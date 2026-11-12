# The gas meter

**In one sentence:** the machine pays for a whole basic block before it runs any of it,
so a program that can't pay stops at the block's door, at the same place on every
validator.

Here is a program of three blocks: a start, a loop that runs three laps, and an end with
a host call. Set the starting gas and step, and watch a whole block's price go at each
door.

<a id="try-it"></a>

<GasMeter />

## The idea

Two lessons built the price list: what each instruction costs, and what each basic block
costs once the model CPU has run it. One question is left: when is the gas taken?

The rule is short and strict: **pay for the whole block on the way in.** Not as you go,
not afterwards. It is a turnstile, not a taxi meter. If the gas for the block isn't there,
not one instruction of it runs, and nothing changes. The machine stops,
[*out of gas*](../glossary.md#out-of-gas).

So there is no such thing as half a block. A block is run whole or not at all, and every
validator runs out of gas at exactly the same place.

And the program that loops forever? A jump back to the start of a block comes in through
the door again, so a loop pays at every lap. Sooner or later it can't.

This lesson builds the meter, and runs the real service on a budget.

## What the Gray Paper says

App. A.4, the start of Ψ₁:

::: gray-paper A.4 3-4

#### Appendix A.4 Single-Step State Transition, continued

<a id="gp-A-4-p3"></a>On the very first step of execution, and every time the execution enters a new <abbr class="gp-term" title="a run of instructions with one way in; a jump may only land at its start">basic block</abbr> or jumps back to the beginning of the current basic block, the gas counter of the machine is updated according to the gas cost function $\varrho^{\Delta}$ ([A.54](./10-the-pipeline.md#eq-A-54)) of the target basic block. No instruction is allowed to execute within a basic block unless the gas cost for the entire basic block has been charged in advance. In case there's not enough gas remaining to cover the full gas cost, the execution is interrupted and the gas counter remains unchanged. Formally:

<a id="gp-A-4-p4"></a><a id="eq-A-8"></a>

$$
\begin{equation}
\left(\varepsilon^{\varrho}, \varrho^*, \tilde{\varrho}'\right) = \begin{cases}
\left(\blacktriangleright, \varrho, \top\right) &\text{if } \tilde{\varrho} = \top \\
\left(\blacktriangleright, \varrho - \varrho^{\Delta}(\mathbf{c}, \mathbf{k}, \mathfrak{L}(\imath)), \top\right) &\text{otherwise if } \varrho \ge \varrho^{\Delta}(\mathbf{c}, \mathbf{k}, \mathfrak{L}(\imath)) \\
\left(\infty, \varrho, \bot\right) &\text{otherwise}
\end{cases} \tag{A.8}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-varepsilon">$\varepsilon$</span> | epsilon | the exit reason: how a step or a run ended, from carry on to halt, panic, out of gas, fault or host call |
| <span id="gk-gascounter" class="gk-wrap">$\varrho$</span> | rho (curly) | the gas left |
| <span id="gk-gaschargedflag" class="gk-wrap">$\tilde{\varrho}$</span> | rho tilde | the gas flag: true once the basic block the machine is in has been paid for |
| <span id="gk-continue" class="gk-wrap">$\blacktriangleright$</span> | continue | ▸: the step went normally, and the next one may run |
| <span id="gk-top">$\top$</span> | top | true |
| <span id="gk-gascostforblock" class="gk-wrap">$\varrho^{\Delta}$</span> | rho delta | a basic block's gas cost: its cycles on the model CPU, less 3, and at least 1 |
| <span id="gk-startofbasicblock" class="gk-wrap">$\mathfrak{L}$</span> | L (gothic) | 𝔏(ı): the start of the basic block that ı is in |
| <span id="gk-imath">$\imath$</span> | i | the instruction counter: the index in the code of the instruction to run next |
| <span id="gk-ge">$\ge$</span> | is at least | greater than or equal to |
| <span id="gk-oog" class="gk-wrap">$\infty$</span> | out of gas | ∞: the program ran out of gas |
| <span id="gk-bot">$\bot$</span> | bottom | false, the no of a yes-or-no value |

</details>

→ [(A.8) explained](./gray-paper.md#ex-A-8)

:::

and, after the instruction, which exit wins and when the flag goes off:

::: gray-paper A.4 8-11

#### Appendix A.4 Single-Step State Transition, continued

<a id="gp-A-4-p8"></a>We define the final execution state, the value of the instruction counter, the values of the registers and the memory as follows:

<a id="gp-A-4-p9"></a><a id="eq-A-10"></a>

$$
\begin{align}
\left(\varepsilon^*, \imath^*, \varphi^*, {\mu}^*\right) &= \begin{cases}
\left(\varepsilon^{\varrho}, \imath, \varphi, {\mu}\right) &\text{if } \varepsilon^{\varrho} \neq \blacktriangleright \\
\left(\varepsilon^{\mu}, \imath, \varphi, {\mu}\right) &\text{otherwise if } \varepsilon^{\mu} \neq \blacktriangleright \\
\left(\varepsilon, \imath', \varphi', {\mu}'\right) &\text{otherwise}
\end{cases} \tag{A.10}
\end{align}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-registers" class="gk-wrap">$\varphi$</span> | phi (curly) | the PVM's 13 registers |
| <span id="gk-mem" class="gk-wrap">${\mu}$</span> | mu | the PVM's memory: 2^32 bytes in pages of 4,096, each page readable, writable or neither |
| <span id="gk-neq">$\neq$</span> | is not | not equal |
| <span id="gk-mu">$\mu$</span> | mu | the PVM's memory |

</details>

→ [(A.10) explained](./gray-paper.md#ex-A-10)

<a id="gp-A-4-p10"></a>We also have to adjust the state based on the executed instruction, to force a gas charge on the next step when necessary:

<a id="gp-A-4-p11"></a><a id="eq-A-11"></a>

$$
\begin{equation}
\tilde{\varrho}^* = \begin{cases}
\bot &\text{if } \tilde{\varrho}' = \bot \lor (\mathbf{c}_\imath \in T \land \varepsilon^* \in \left\{\,\blacktriangleright\,\right\} \cup \left\{\,\hbar\,\right\} \times \mathbb{N}_R) \\
\top &\text{otherwise}
\end{cases} \tag{A.11}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-lor">$\lor$</span> | or | at least one side is true |
| <span id="gk-in">[$\in$](../symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-land">$\land$</span> | and | both sides are true |
| <span id="gk-set">$\left\{\,x\,\right\}$</span> | the set of | a set: values with no order and no repeats |
| <span id="gk-cup">$\cup$</span> | union | everything in either side |
| <span id="gk-host" class="gk-wrap">$\hbar$</span> | host call | ħ: the program asked the host for something, and waits |
| <span id="gk-times">$\times$</span> | times | multiply; between sets, every pair of one from each |
| <span id="gk-pvmreg" class="gk-wrap">$\mathbb{N}_R$</span> | N sub R | a register's value: a u64 |

</details>

→ [(A.11) explained](./gray-paper.md#ex-A-11)

:::

The machine carries its gas ϱ and a flag, ϱ̃: has the basic block it's in
been paid for yet?

- **On a step, if the flag is off**, the block's cost ϱ^Δ ([lesson 15.10](./10-the-pipeline.md)) is due. With
  enough gas, it's paid and the flag goes on. Without enough, the machine stops with
  **oog**, out of gas, and nothing else changes: no instruction runs, and the gas stays
  as it was.
- **After a terminator** that carries on (a jump, a branch, a fallthrough), the flag goes
  off: wherever the machine lands is a new block, and the next step pays for it. A jump
  back to the start of the same block pays again. That's how a loop pays every lap.
- A host call doesn't reset it: `ecalli` isn't a terminator, so when the host is done, the
  rest of the block is already paid for.
- **Which exit wins** (A.10): out of gas first, then a memory panic or fault ([lesson
  15.4](./04-memory.md)), and only then the instruction's own result. The first two leave
  ı, the registers and memory as they were.

Step the program [at the top](#try-it) again, with these rules in hand. Each block's
price comes from [lesson 15.10](./10-the-pipeline.md)'s model CPU. The gas drops by a whole block's price as each
block is entered, and the loop pays at every lap. With too little for the next block, the
machine stops with oog at its door, and nothing in that step runs. After the `ecalli`,
the rest of its block is already paid for.

**Try it in the [playground](../pvm-playground.md).** Press **Out of gas**, then **Run**. It stops at the door of a block with 16 gas left and 21 to pay. Type 23 in the gas box and run it again, then 22: one pass, then none.

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
stepping, because `step` moves ı on. Afterwards, the question is whether the instruction
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

What flows through it: the same start as [lesson 15.8](./08-a-real-program.md)'s, twice, on different budgets.

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
27, 73, and 102 for the last block, the one with `ecalli` in it. That instruction's 100
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
             else begin
               gas := Int64.sub !gas cost; charged := true;
               (match !block_hook with Some f -> f inf (Pvm_gas.block_start inf p) | None -> ());
               false
             end)
    then exit := Some OutOfGas
```

The same check, in the middle of lasair's run loop. One difference: lasair prices
`block_start inf p`, the start of whichever block p is in (the Gray Paper's 𝔏). Your
meter prices the block starting at ı: the simple road in the note above. The `block_hook`
line is a tap for lasair's own debugging tools: nothing is hooked in during an import.

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

**What does paying for a whole block on the way in guarantee?**

- [x] A block is run whole or not at all, so every validator runs out of gas at exactly the same place
  > Yes: on 100 gas the bootstrap service reaches a block that costs 73 with 32 left. It
  > stops oog at 121410, the block's start, with all 32 still there.
- [ ] That a program never runs out of gas once it has started
  > No: it can run out at any block's door. What it can't do is run out in the middle of
  > a block.
- [ ] That some gas is kept back for the host call
  > No: nothing is set aside. The meter only compares the gas left with the block's
  > price.

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
