# The pipeline

[Lesson 15.9](./09-what-instructions-cost.md)'s block from the bootstrap service adds up to 91 cycles. Yet a real CPU would
run it in far fewer, because it doesn't do one thing at a time. While one instruction
waits on memory, others start; while a store crawls along, three more crawl beside it.
The Gray Paper's gas model builds exactly such a CPU, small and made up, and charges a
basic block the cycles that CPU needs. This lesson builds it.

## What the Gray Paper says

App. A.9 describes the model CPU, cycle by cycle:

1. **Decode.** Each cycle, the front end decodes instructions in order, up to 4 decode
   slots' worth ([lesson 15.9](./09-what-instructions-cost.md)'s ď), into a *reorder buffer*. At most 32 instructions can
   be in it, not yet retired. Decoding stops at the block's terminator.
2. **Wait.** The next cycle, a decoded instruction is waiting. It can start once every
   earlier instruction that writes a register it reads has finished its cycles, and once
   the units it needs are free. The CPU has 4 ALUs, 4 load units, 4 store units, 1
   multiplier and 1 divider. Up to 5 instructions start each cycle.
3. **Execute.** It runs for its cycles (č), then gives its units back and is finished.
4. **Retire.** Finished instructions leave the buffer *in order*: one retires only once
   everything before it has.

`move_reg` never enters the buffer at all: the front end just notes that whatever
produces its source register now produces its destination too, and anything that reads
the destination waits on that. It's free, but the wait follows the value through it.

When everything has been decoded and retired, the block's gas is the cycles taken, less
3, and at least 1. (Run one instruction alone and it costs exactly its own cycles: the 3
is the pipeline's own overhead.)

The Gray Paper writes this as a state 𝕊 (ı, c, d, e, t and the buffer r) and four
transitions: X′ decodes (X^mov for `move_reg`, X^dec for the rest), X″ starts the first
ready instruction S, X‴ ticks the clock, and X picks: decode if it can, else start if it
can, else stop if everything is retired, else tick.

Step through it below. Pick one of this lesson's blocks, or build your own, and move a
cycle at a time. Each row is a line of the block; each column is the start of a cycle,
as the printout further down catches it. Four loads start together and finish together.
In a chain, each load waits for the register the one before it is making. Two divides
take turns at the one divider. When everything has retired, the block's cost appears.

<PipelineCycles />

## The tests

**Add to** `test/gas.test.ts`

```ts
import { blockCost } from "../src/pvm/gas.ts";
import { deblob, unpackCode } from "../src/pvm/program.ts";
import { bootstrapCode } from "./vectors.ts";
import type { Program, ServiceCode } from "../src/pvm/program.ts";

/** The gas a hand-made block costs, from its first instruction. */
const gas = (...instructions: number[][]) => blockCost(assemble(instructions), 0);

// load_ind_u64 is [130, A + 16·B]: φ_A from memory at φ_B. trap ends each block.
test("one instruction on its own costs its cycles: the 3 is the pipeline's overhead", () => {
  const trap: number = gas([0]); // trap
  assert.equal(trap, 2);
  const jump: number = gas([40, 0]); // jump
  assert.equal(jump, 15);
});

test("independent loads run side by side: four cost no more than one, a fifth waits", () => {
  const oneLoad: number = gas([130, 0x12], [0]); // r2 = [r1]
  assert.equal(oneLoad, 25);
  const fourLoads: number = gas([130, 0x12], [130, 0x13], [130, 0x14], [130, 0x15], [0]);
  assert.equal(fourLoads, 25);
  const fiveLoads: number = gas(
    [130, 0x12], [130, 0x13], [130, 0x14], [130, 0x15], [130, 0x16], [0],
  );
  assert.equal(fiveLoads, 50);
});

test("a load that needs another's answer waits for it", () => {
  const chainOfTwo: number = gas([130, 0x12], [130, 0x23], [0]); // r2 = [r1], then r3 = [r2]
  assert.equal(chainOfTwo, 50);
  const chainOfThree: number = gas([130, 0x12], [130, 0x23], [130, 0x34], [0]);
  assert.equal(chainOfThree, 75);
});

test("move_reg is free, and the wait follows the value through it", () => {
  const throughMove: number = gas([130, 0x12], [100, 0x25], [130, 0x53], [0]); // r5 = r2, r3 = [r5]
  assert.equal(throughMove, 50);
});

test("there's one divide unit: two divides take turns", () => {
  const oneDivide: number = gas([203, 0x10, 2], [0]); // div_u_64 r2 = r0 ÷ r1
  assert.equal(oneDivide, 60);
  const twoDivides: number = gas([203, 0x10, 2], [203, 0x10, 3], [0]);
  assert.equal(twoDivides, 120);
});

test("a real block: the bootstrap service's first costs 26, not the 91 its cycles add to", () => {
  const program: Program = deblob(unpackCode(bootstrapCode()).program);
  const first: number = blockCost(program, 92078);
  assert.equal(first, 26);
});
```

Loads make the clearest examples: 25 cycles each, and 4 load units. Four independent
loads cost what one does. A load whose address comes from another load must wait for it.

## The code

The model decodes until the block's terminator, so it needs [lesson 15.3](./03-the-machine.md)'s T:

**Replace in** `src/pvm/machine.ts`

```ts
/** T (GP App. A.3): the instructions that end a basic block. */
export const TERMINATORS = new Set([0, 1, 40, 50, 80, 180, 170, 171, 172, 173, 174, 175]);
for (let opcode = 81; opcode <= 90; opcode++) TERMINATORS.add(opcode); // the immediate branches
```

**Add to** `src/pvm/gas.ts`

```ts
import { decodeInstruction } from "./instructions.ts";
import { TERMINATORS } from "./machine.ts";

/** A reorder buffer entry's state: decoding, waiting, executing, finished, or retired. */
type State = "DEC" | "WAIT" | "EXE" | "FIN" | null;

/** An instruction in the reorder buffer (GP's ℝ): its state, cycles to go, what it waits on. */
type Entry = { state: State; cycles: number; deps: number[]; regs: number[]; units: Units };

/**
 * The model CPU (GP's 𝕊): where it's decoding, its clock, what's left this cycle, and the
 * reorder buffer, where decoded instructions wait, run and retire.
 */
export type Cpu = {
  pc: number | null; // ı: the next instruction to decode, or null once the block is decoded
  cycles: number; // c
  decode: number; // d: decode slots left this cycle
  start: number; // e: instructions that may still start this cycle
  units: Units; // t: execution units free
  rob: Entry[]; // r
};

/** Units added up, kind by kind (or taken away, with a sign of −1). */
const plus = (a: Units, b: Units, sign = 1) => a.map((u, k) => u + sign * b[k]) as Units;

/** S (GP App. A.9): the first waiting instruction whose units are free and inputs ready. */
function readyToStart(cpu: Cpu): number | null {
  const ready = cpu.rob.findIndex(
    (e) =>
      e.state === "WAIT" &&
      e.units.every((u, k) => u <= cpu.units[k]) &&
      e.deps.every((k) => cpu.rob[k].cycles === 0),
  );
  return ready === -1 ? null : ready;
}

/** X′ (GP App. A.9): decodes one instruction into the reorder buffer. */
function decode(cpu: Cpu, program: Program, ins: Instruction): void {
  const { reads, writes } = registersUsed(ins);
  if (ins.name === "move_reg") {
    // X^mov: no work at all. Whatever makes the register it reads now makes its destination.
    for (const e of cpu.rob) {
      const feeds = e.regs.some((r) => reads.includes(r));
      e.regs = feeds ? [...e.regs, ...writes] : e.regs.filter((r) => !writes.includes(r));
    }
    cpu.pc = ins.next;
    cpu.decode -= 1;
    return;
  }
  // X^dec: it waits on every entry that makes a register it reads.
  const { cycles, slots, units } = instructionCost(program, ins);
  const deps = cpu.rob.flatMap((e, i) => (e.regs.some((r) => reads.includes(r)) ? [i] : []));
  for (const e of cpu.rob) e.regs = e.regs.filter((r) => !writes.includes(r));
  cpu.rob.push({ state: "DEC", cycles, deps, regs: writes, units });
  cpu.pc = TERMINATORS.has(ins.opcode) ? null : ins.next;
  cpu.decode -= slots;
}

/** X″ (GP App. A.9): starts the first instruction that's ready. */
function startOne(cpu: Cpu, n: number): void {
  cpu.start -= 1;
  cpu.units = plus(cpu.units, cpu.rob[n].units, -1);
  cpu.rob[n].state = "EXE";
}

/** X‴ (GP App. A.9): one tick of the clock. */
function tick(cpu: Cpu): void {
  cpu.cycles += 1;
  cpu.decode = 4;
  cpu.start = 5;
  let retiring = true; // has everything up to here finished? Then it retires, in order
  for (const e of cpu.rob) {
    retiring &&= e.state === "FIN" || e.state === null;
    const executing = e.state === "EXE";
    if (executing && e.cycles === 1) cpu.units = plus(cpu.units, e.units); // done: units free
    if (retiring) e.state = null;
    else if (e.state === "DEC") e.state = "WAIT";
    else if (executing && e.cycles === 0) e.state = "FIN";
    if (executing && e.cycles > 0) e.cycles -= 1;
  }
}

/**
 * ϱ^Δ (GP App. A.9): the gas a basic block costs. The model CPU decodes up to 4 slots and
 * starts up to 5 instructions a cycle, runs them on (4, 4, 4, 1, 1) units, and retires
 * them in order. The cost is its cycles until all are retired, less 3, and at least 1.
 * `watch`, if given, sees the CPU after every tick.
 */
export function blockCost(program: Program, start: number, watch?: (cpu: Cpu) => void): number {
  const cpu: Cpu = { pc: start, cycles: 0, decode: 4, start: 5, units: [4, 4, 4, 1, 1], rob: [] };
  for (;;) {
    const live = cpu.rob.filter((e) => e.state !== null).length;
    const ins = cpu.pc === null ? null : decodeInstruction(program, cpu.pc);
    const ready = readyToStart(cpu);
    if (ins && instructionCost(program, ins).slots <= cpu.decode && live < 32) {
      decode(cpu, program, ins);
    } else if (ready !== null && cpu.start > 0) {
      startOne(cpu, ready);
    } else if (cpu.pc === null && live === 0) {
      return Math.max(cpu.cycles - 3, 1);
    } else {
      tick(cpu);
      watch?.(cpu); // lets a watcher see each cycle
    }
  }
}
```

Each Gray Paper function is one small function here. `decode` is X′, with X^mov as its
first branch. Its dependencies are worked out *before* the new instruction takes over its
registers, so it waits on the old writer, not on itself. `startOne` is X″, and `tick` is
X‴. In `tick`, `retiring` stays true only while every entry so far has finished: that's
"retire in order" in one line. `blockCost` is X, its four cases in the Gray Paper's
order.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ one instruction on its own costs its cycles: the 3 is the pipeline's overhead (0.3ms)
✔ independent loads run side by side: four cost no more than one, a fifth waits (0.3ms)
✔ a load that needs another's answer waits for it (0.3ms)
✔ move_reg is free, and the wait follows the value through it (0.2ms)
✔ there's one divide unit: two divides take turns (0.3ms)
✔ a real block: the bootstrap service's first costs 26, not the 91 its cycles add to (13.1ms)
...
✔ the reported packages: each one's hash and exports root, sorted by hash (254.0ms)
...
ℹ tests 443
ℹ suites 0
ℹ pass 443
ℹ fail 0
...
reported 443 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791737113888
...
```

## Watch it

**New file** `bin/pipeline.ts`

```ts
// Runs a real basic block through the model CPU, the one the bootstrap service's
// accumulation jumps to first, and draws its reorder buffer cycle by cycle.
// Usage: npm run pipeline

import { readFileSync } from "node:fs";
import { fromHex } from "../src/bytes.ts";
import { Run } from "../src/obs.ts";
import { blockCost } from "../src/pvm/gas.ts";
import { decodeInstruction } from "../src/pvm/instructions.ts";
import { deblob, unpackCode } from "../src/pvm/program.ts";
import { serviceCode } from "../src/services.ts";
import type { KeyValue } from "../src/trie.ts";

const trace = JSON.parse(readFileSync("../vectors/traces/fallback/00000001.json", "utf8"));
const entries: KeyValue[] = trace.pre_state.keyvals.map((e: { key: string; value: string }) => ({
  key: fromHex(e.key),
  value: fromHex(e.value),
}));
const program = deblob(unpackCode(serviceCode(entries, 0)!).program);
const start = decodeInstruction(program, 5).target as number; // where accumulation jumps

const LETTER = { DEC: "D", WAIT: "W", EXE: "E", FIN: "F" } as const;
const run = new Run("pipeline");
let last = "";
const cost = blockCost(program, start, (cpu) => {
  const row = cpu.rob.map((e) => (e.state === null ? "." : LETTER[e.state])).join(" ");
  if (row === last) return; // only the cycles where something changes
  last = row;
  console.log(`cycle ${String(cpu.cycles).padStart(2)}  ${row}`);
  run.event("cycle", { cycle: cpu.cycles, row });
});
console.log(`the block at ${start} costs ${cost} gas`);
run.event("cost", { block: start, cost });
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

**What flows through it.** One run, three faces — the same basic block going in as
[lesson 15.9](./09-what-instructions-cost.md) priced, the model CPU's buffer mid-flight, and the lines printed. Tab
across them:

::: code-group

```text [what goes in]
the basic block at 92078 of service 0's code (the fallback trace):
  add_imm_64, three store_ind_u64s, two move_regs, load_imm_jump —
  91 cycles if each instruction waited for the one before
```

```ts [what it computes]
// the reorder buffer at cycle 3, one column per buffered instruction
const computed = {
  rob: "F E E E E", // the add finished; three stores and the call, side by side
  why: "the stores needed the add's r1; from here they overlap", // cycle 2's W W W W
  retired: 29, // everything finished at 28, retired at 29
  gas: 26, // 29 - 3: far under the 91 of one-at-a-time
};
```

```text [what comes out]
cycle  3  F E E E E
the block at 92078 costs 26 gas
```

:::

Read the input into the output: the block's seven instructions become five columns (the
two `move_reg` instructions cost nothing and never enter the buffer). Each printed row is the buffer in
one cycle where something changed, and the gas at the end is the cycle count the whole
dance took — the pipeline's price, not the sum of the price tags.

**Run**

```sh
npm pkg set scripts.pipeline="node bin/pipeline.ts"
npm run pipeline
```

```text
cycle  1  W W W W
cycle  2  E W W W W
cycle  3  F E E E E
cycle  4  . E E E E
cycle 18  . E E E F
cycle 28  . F F F F
cycle 29  . . . . .
the block at 92078 costs 26 gas
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=pipeline-1791737119776
```

One column per instruction in the buffer: the stack-pointer add, the three stores and the
call (the two `move_reg` instructions never get a column). W is waiting, E executing, F finished, and
a dot is retired. (Decoding lasts only until the next tick, so you never catch a D.) Read
it top down. At cycle 2 the add runs while the
stores wait: they need its r1. From cycle 3 all three stores run side by side, with the
15-cycle call beside them. The call finishes at 18 but can't retire before the stores
ahead of it. At 28 everything is finished, at 29 everything is retired: 29 − 3 = 26 gas.
The *Pipeline* panel, on **6 · The PVM**, keeps the picture.

![Pipeline panel](./images/10-pipeline.png)

<details>
<summary>lasair: the clock tick, in <code>lib/pvm_gas.ml</code></summary>

```ocaml
             let all_done = ref true in
             for j = !head to !rob_len - 1 do
               let en = !rob.(j) in
               let old_st = en.st and old_cyc = en.cycles_left in
               if not (old_st = Fin || old_st = Retired) then all_done := false;
               en.st <- (if !all_done then Retired
                         else if old_st = Dec then Wait
                         else if old_st = Exe && old_cyc = 0 then Fin
                         else old_st);
```

The same single pass as your `tick`, with `all_done` for your `retiring`. lasair adds
speed: it skips the retired entries at the front of the buffer with `head`, and
remembers each block's cost once worked out. On the bootstrap service's 6,229 basic
blocks, the two give the same cost every time.

</details>

## Check your understanding

::: check
**Four independent loads cost 25, the same as one. Why does a fifth make it 50?**

- [ ] Every load after the fourth costs double
  > No: every load takes 25 cycles. The fifth just can't start until one is done.
- [x] The CPU has 4 load units, so the fifth waits for one to come free
  > Yes: four start together and finish 25 cycles later. The fifth starts then, and takes
  > 25 more.
- [ ] The reorder buffer holds only 4 instructions
  > No: it holds 32. It's the units that run out.

**`r2 = [r1]`, then `r3 = [r2]`, costs 50. Why not 25, as two loads side by side?**

- [x] The second load's address is the first load's answer, so it waits for it
  > Yes: it reads r2, which the first load is still making. It starts only once that one
  > has finished its 25 cycles.
- [ ] Two loads always take turns
  > No: four independent loads run side by side, for 25. It's the shared register that
  > makes these two wait.
- [ ] They might read the same memory, so they mustn't overlap
  > No: the model never looks at addresses, only at registers and units.

**`r2 = [r1]`, `move_reg r5 = r2`, `r3 = [r5]` costs 50 too. What does `move_reg` change?**

- [ ] It adds a cycle for the copy
  > No: `move_reg` never enters the reorder buffer, and costs nothing.
- [ ] Nothing, so the third load runs beside the first
  > No: then the block would cost 25. The third load waits.
- [x] It costs nothing, but the third load still waits for the first
  > Yes: the front end notes that whatever makes r2 now makes r5 too, so a read of r5
  > waits on the first load. 25 + 25 = 50.

**In the real block, the 15-cycle call finishes at cycle 18. Why isn't the block done then?**

- [ ] The CPU must decode where the call goes first
  > No: decoding stops at the block's terminator, which is the call. Nothing beyond it is
  > decoded.
- [x] Instructions retire in order, and the stores ahead of the call are still running
  > Yes: the three stores run from cycle 3 to 28. The call can't retire before them, so
  > everything retires at 29, and 29 − 3 = 26 gas.
- [ ] The call takes 15 more cycles to come back
  > No: its 15 cycles are over at 18. It's waiting on the stores, not on itself.
:::

## What you have

A price for every basic block, worked out the Gray Paper's way. One piece of gas is left:
the meter that charges those prices as the machine runs, and [lesson 15.11](./11-the-gas-meter.md) builds it.

Next: [15.11 The gas meter](./11-the-gas-meter.md)
