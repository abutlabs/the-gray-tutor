# The gas meter

Two lessons built the price list: what each instruction costs, and what each basic block
costs once the model CPU has run it. Now the meter that charges it. The rule is short and
strict: **pay for the whole block on the way in.** Not as you go, not afterwards. If the
gas for the block isn't there, not one instruction of it runs. A program that loops
forever? It pays at every lap, and sooner or later it can't.

## What the Gray Paper says

App. A.4, the start of Ψ₁. The machine carries its gas ϱ and a flag: has the basic block
it's in been paid for yet?

- **On a step, if the flag is off**, the block's cost ϱ^Δ ([lesson 15.10](./10-the-pipeline.md)) is due. With
  enough gas, it's paid and the flag goes on. Without enough, the machine stops with
  **oog**, out of gas, and nothing else changes: no instruction runs, and the gas stays
  as it was.
- **After a terminator** that carries on (a jump, a branch, a fallthrough), the flag goes
  off: wherever the machine lands is a new block, and the next step pays for it. A jump
  back to the start of the same block pays again. That's how a loop pays every lap.
- A host call doesn't reset it: `ecalli` isn't a terminator, so when the host is done, the
  rest of the block is already paid for.

Try it below, on a small program of three blocks: a start, a loop that runs three laps,
and an end with a host call. Each block's price comes from [lesson 15.10](./10-the-pipeline.md)'s model CPU.
Set the starting gas and step. The gas drops by a whole block's price as each block is
entered, and the loop pays at every lap. With too little for the next block, the machine
stops with oog at its door, and nothing in that step runs. After the `ecalli`, the rest
of its block is already paid for.

<GasMeter />

## The tests

**Add to** `test/gas.test.ts`

```ts
import { runWithGas } from "../src/pvm/gas.ts";
import { newMachine } from "../src/pvm/machine.ts";
import { standardProgram } from "../src/pvm/standard.ts";
import type { Exit, Machine } from "../src/pvm/machine.ts";
import type { Program, ServiceCode } from "../src/pvm/program.ts";
import type { Bytes } from "../src/bytes.ts";

test("an endless loop runs out of gas: each lap pays 15, until there's too little", () => {
  const machine: Machine = newMachine(assemble([[40, 0]]), [], new Map(), 100n); // jump to itself
  const exit: Exit = runWithGas(machine);
  assert.equal(exit, "oog");
  assert.equal(machine.gas, 10n); // six laps paid for, and 10 isn't enough for a seventh
});

test("a block is paid for in full before any of it runs", () => {
  const block: Program = assemble([[51, 0x02, 7], [0]]); // load_imm r2, 7; trap: 2 gas
  const poor: Machine = newMachine(block, [], new Map(), 1n);
  const poorExit: Exit = runWithGas(poor);
  assert.equal(poorExit, "oog");
  assert.equal(poor.registers[2], 0n); // not even the load_imm ran
  const rich: Machine = newMachine(block, [], new Map(), 2n);
  const richExit: Exit = runWithGas(rich); // the trap
  assert.equal(richExit, "panic");
  assert.deepEqual([rich.registers[2], rich.gas], [7n, 0n]);
});

test("the bootstrap service spends 243 gas to reach its first host call", () => {
  const code: ServiceCode = unpackCode(bootstrapCode());
  const args: Bytes = Uint8Array.from([1, 0, 0]); // slot 1, service 0, no inputs: each one byte
  const { memory, registers } = standardProgram(code, args);
  const machine: Machine = newMachine(deblob(code.program), registers, memory, 1000n);
  machine.pc = 5; // accumulation
  const exit: Exit = runWithGas(machine);
  assert.deepEqual(exit, { host: 2 });
  assert.equal(machine.gas, 1000n - 243n);
});
```

## The code

The machine gets a purse: its gas, the flag, and a new way to stop.

**Replace in** `src/pvm/machine.ts`

```ts
/** How a step ends (GP's ε): carry on, finish, fail, run out of gas, fault, or call the host. */
export type Exit = "continue" | "halt" | "panic" | "oog" | { fault: number } | { host: number };

/** The machine's state: the program, ı, the registers φ, the memory μ, and its gas. */
export type Machine = {
  program: Program;
  pc: number;
  registers: bigint[];
  memory: Memory;
  blocks: Set<number>;
  gas: bigint; // ϱ: what's left to spend
  charged: boolean; // has the basic block it's in been paid for?
};

/** A machine at instruction 0: every register 0, no memory and no gas, unless given. */
export function newMachine(
  program: Program,
  registers: bigint[] = [],
  memory: Memory = new Map(),
  gas = 0n,
): Machine {
  const all = Array.from({ length: 13 }, (_, i) => registers[i] ?? 0n);
  const blocks = basicBlocks(program);
  return { program, pc: 0, registers: all, memory, blocks, gas, charged: false };
}
```

Gas is a `bigint`: a service's budget can be bigger than JavaScript's safe whole numbers.
It starts at 0, so all the machines from earlier lessons, which never pay, run as before.

**Add to** `src/pvm/gas.ts`

```ts
import type { Exit, Machine } from "./machine.ts";
import { step } from "./machine.ts";

/**
 * Ψ₁ with gas (GP App. A.4). A basic block is paid for in full on the way in, before any
 * of it runs. Without the gas for it, the machine stops "oog" (out of gas), as it was.
 */
export function stepWithGas(m: Machine): Exit {
  if (!m.charged) {
    const cost = BigInt(blockCost(m.program, m.pc));
    if (m.gas < cost) return "oog";
    m.gas -= cost;
    m.charged = true;
  }
  const opcode = m.program.code[m.pc];
  const exit = step(m);
  if (exit === "continue" && TERMINATORS.has(opcode)) m.charged = false; // a new block next
  return exit;
}

/** Ψ with gas: steps until the machine stops, or its gas runs out. */
export function runWithGas(m: Machine): Exit {
  for (;;) {
    const exit = stepWithGas(m);
    if (exit !== "continue") return exit;
  }
}
```

The meter wraps [lesson 15.3](./03-the-machine.md)'s `step` rather than living inside it, so `machine.ts` never
needs `gas.ts` (which already needs `machine.ts`). `stepWithGas` notes the opcode before
stepping, because `step` moves ı on: afterwards, the question is whether the instruction
that just ran was a terminator.

> [!NOTE]
> **The simple road.** The Gray Paper charges the block that ı is *in*, from its start
> (𝔏(ı)). `stepWithGas` charges the block starting *at* ı. That's the same whenever ı
> starts a block, and so far it always does. A machine started or resumed in the middle
> of a block, as the inner machines of the `machine` and `invoke` host calls (still to be
> written) can be, needs 𝔏; the [hardening
> pass](https://github.com/abutlabs/the-gray-tutor/blob/main/HARDENING.md) adds it.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ an endless loop runs out of gas: each lap pays 15, until there's too little (0.7ms)
✔ a block is paid for in full before any of it runs (0.2ms)
✔ the bootstrap service spends 243 gas to reach its first host call (23.3ms)
...
✔ the reported packages: each one's hash and exports root, sorted by hash (209.6ms)
...
ℹ tests 446
ℹ suites 0
ℹ pass 446
ℹ fail 0
...
reported 446 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791737125469
...
```

## Watch it

**New file** `bin/gas.ts`

```ts
// Runs the bootstrap service from accumulation's entry point with a gas budget, and shows
// each basic block it pays for on the way to its first host call. Then again, short.
// Usage: npm run gas

import { readFileSync } from "node:fs";
import { fromHex } from "../src/bytes.ts";
import { Run } from "../src/obs.ts";
import { stepWithGas } from "../src/pvm/gas.ts";
import { newMachine } from "../src/pvm/machine.ts";
import { deblob, unpackCode } from "../src/pvm/program.ts";
import { standardProgram } from "../src/pvm/standard.ts";
import { serviceCode } from "../src/services.ts";
import type { KeyValue } from "../src/trie.ts";

const trace = JSON.parse(readFileSync("../vectors/traces/fallback/00000001.json", "utf8"));
const entries: KeyValue[] = trace.pre_state.keyvals.map((e: { key: string; value: string }) => ({
  key: fromHex(e.key),
  value: fromHex(e.value),
}));
const code = unpackCode(serviceCode(entries, 0)!);

const run = new Run("gas");
for (const budget of [1000n, 100n]) {
  const { memory, registers } = standardProgram(code, Uint8Array.from([1, 0, 0]));
  const machine = newMachine(deblob(code.program), registers, memory, budget);
  machine.pc = 5; // accumulation
  console.log(`with ${budget} gas:`);
  for (;;) {
    const [at, before] = [machine.pc, machine.gas];
    const exit = stepWithGas(machine);
    if (machine.gas !== before) {
      const paid = before - machine.gas;
      console.log(`  block at ${String(at).padStart(6)} costs ${paid}, leaving ${machine.gas}`);
      run.event("block", { budget: Number(budget), at, paid: Number(paid) });
    }
    if (exit !== "continue") {
      const spent = budget - machine.gas;
      console.log(`  stops: ${JSON.stringify(exit)} at ${machine.pc}, having spent ${spent}`);
      const stop = { budget: Number(budget), exit: JSON.stringify(exit), spent: Number(spent) };
      run.event("stop", stop);
      break;
    }
  }
}
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

**What flows through it.** One run, three faces — the same start as [lesson 15.8](./08-a-real-program.md)'s
going in, twice with different budgets, the meter's arithmetic, and the lines printed.
Tab across them:

::: code-group

```text [what goes in]
service 0's code (the fallback trace), started at accumulation's byte 5 with
the argument bytes 01 00 00 — exactly the run of 38 steps from before —
once with a budget of 1000 gas, once with 100
```

```ts [what it computes]
// the 100-gas run's meter, block by block
const computed = {
  paid: [15n, 26n, 27n], // the first three blocks' prices, paid on entry
  left: 32n, // 100 - 15 - 26 - 27
  nextBlock: 73n, // what the block at 121410 would cost
  stops: "oog", // 32 < 73: out of gas at that block's door
};
```

```text [what comes out]
  block at 123687 costs 27, leaving 32
  stops: "oog" at 121410, having spent 68
```

:::

Read the input into the output: gas is charged a basic block at a time, as the machine
*enters* the block, at the pipeline's price — 26 is [lesson 15.10](./10-the-pipeline.md)'s number. With 1000
the run reaches its host call having spent 243; with 100 it pays for three blocks,
stands at the fourth with 32 in hand against a bill of 73, and stops: out of gas, at
the door.

**Run**

```sh
npm pkg set scripts.gas="node bin/gas.ts"
npm run gas
```

```text
with 1000 gas:
  block at      5 costs 15, leaving 985
  block at  92078 costs 26, leaving 959
  block at 123687 costs 27, leaving 932
  block at 121410 costs 73, leaving 859
  block at 121467 costs 102, leaving 757
  stops: {"host":2} at 121489, having spent 243
with 100 gas:
  block at      5 costs 15, leaving 85
  block at  92078 costs 26, leaving 59
  block at 123687 costs 27, leaving 32
  stops: "oog" at 121410, having spent 68
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=gas-1791737130606
```

The same 38 steps as [lesson 15.8](./08-a-real-program.md), now in five payments: 15, 26 ([lesson 15.10](./10-the-pipeline.md)'s block),
27, 73, and 102 for the last block, the one with `ecalli` in it: that instruction's 100
cycles are most of the bill. 243 in all. Then the same start on a budget of 100: three
blocks paid, 32 gas left, and the fourth costs 73. Out of gas, at the door of the block
it couldn't afford. The *Gas* panel, on **6 · The PVM**, has both runs.

![Gas panel](./images/11-gas.png)

<details>
<summary>lasair: paying for a block, in <code>lib/pvm.ml</code></summary>

```ocaml
    else if not !charged
         && (let cost = Int64.of_int (Pvm_gas.block_cost inf (Pvm_gas.block_start inf p)) in
             if Int64.compare !gas cost < 0 then true
             else (gas := Int64.sub !gas cost; charged := true; false))
    then exit := Some OutOfGas
```

The same check, in the middle of lasair's run loop. One difference: lasair prices
`block_start inf p`, the start of whichever block p is in (the Gray Paper's 𝔏). Your
meter prices the block starting at ı: the simple road in the note above.

</details>

## Check your understanding

::: check
**A `jump` to itself costs 15 a lap, and the machine starts with 100 gas. How does it end?**

- [ ] It loops forever: it's one block, so it's paid for once
  > No: a jump back to the start of a block pays for it again. That's how a loop pays
  > every lap.
- [ ] oog with 0 left: the last lap takes the final 10
  > No: a block is paid for in full or not at all. 10 can't buy part of a 15-gas lap.
- [x] oog after six laps, with 10 left
  > Yes: 6 × 15 = 90, and 10 isn't enough for a seventh lap. The gas stays at 10.

**A block, `load_imm r2, 7` then `trap`, costs 2, and the machine has 1 gas. What happens?**

- [ ] The `load_imm` runs, and the machine runs out at the `trap`
  > No: the whole block is paid for on the way in. Without 2 gas, not one instruction of
  > it runs.
- [x] oog straight away: r2 stays 0, and the gas stays 1
  > Yes: nothing changes when a block can't be paid for. With 2 gas, both run: r2 = 7,
  > then the `trap` panics with 0 gas left.
- [ ] The gas goes to −1, and the machine panics
  > No: gas never goes below 0. The meter refuses before it charges.

**On 100 gas, the bootstrap service reaches a block that costs 73 with 32 left. Why not run as much of the block as 32 buys?**

- [x] A block is paid for in full on the way in, or not entered at all
  > Yes: the machine stops oog at 121410, the block's start, with all 32 still there.
- [ ] The 32 is kept back for the host call
  > No: nothing is set aside. The meter only compares the gas left with the block's
  > price.
- [ ] It does run part of the block, and stops when the 32 runs out
  > No: no instruction of a block runs before the whole block is paid for. That's the
  > rule.

**The machine stops at an `ecalli` in the middle of a block, and the host answers. Does the rest of that block cost anything?**

- [ ] Yes: each time the machine starts again, it pays for its block
  > No: the flag goes off only after a terminator that carries on, and `ecalli` isn't a
  > terminator.
- [x] No: the block was paid for on the way in, and `ecalli` doesn't end it
  > Yes: the paid flag stays on through the host call, so the rest of the block is
  > already paid for.
- [ ] No: a host call makes everything after it free
  > No: only the rest of this block, already paid for. The next block pays as usual, and
  > the `ecalli`'s own 100 cycles were in this block's price, 102.
:::

## What you have

A complete PVM: every instruction, memory, a real program's setup, host calls as a way
out, and gas, priced and charged the Gray Paper's way. [Part 15](./index.md), done. The machine can ask
the host for things; in [Part 16](../16-host-calls/index.md), the host answers back.

Next: [Part 16 · Host calls](../16-host-calls/index.md)
