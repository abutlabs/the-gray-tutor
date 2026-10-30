# What instructions cost

A program that loops forever would stall every validator running it. JAM's answer is
*gas*: a service gets a budget, and every piece of code is paid for before it runs. Gray
Paper 0.8.0 sets the price by imagining a modern CPU running the code and counting its
cycles. That takes a price list and a CPU; this lesson is the price list.

## What the Gray Paper says

App. A.10, the gas cost tables. Every instruction has a row with three things:

- **č, cycles**: how long it takes to finish. An `add_64` takes 1, a load or a store 25
  (the Gray Paper calls that 𝔪), a multiply 3 to 6, a divide 60, `ecalli` 100. And
  `move_reg` takes 0: the CPU just relabels a register, no work at all.
- **ď, decode slots**: how much decoding it needs, from 1 to 4.
- **x̌, execution units**: which parts of the CPU it occupies while it runs. There are five
  kinds: ALU, load, store, multiply and divide. A load needs an ALU and a load unit.

Some rows depend on more than the instruction's name, through three functions:

- **𝔓(a, b)** is a if the instruction writes a register it also reads, b if not. So
  `add_64 r0 = r0 + r1` needs 1 decode slot and `add_64 r2 = r0 + r1` needs 2. Picture a
  CPU whose add always overwrites one of its inputs: aiming at a third register takes an
  extra copy first.
- **𝔓_S(a, b)**, for the shifts and rotations with three registers: a if φ_D is the same
  register as φ_A.
- **𝔟**, a branch's cycles: 20, or just 1 if either way it can go (the next instruction, or
  the target) starts with `trap` or `unlikely`. That's [lesson 15.6](./06-branches-and-calls.md)'s hint at work: a branch
  to a `trap` is usually a check that should never fail, so a CPU would guess it right.

For 𝔓, App. A.9 defines š and ř: the registers an instruction reads and writes, straight
from its row in the instruction tables, whether or not they change when it runs. A `cmov`
reads the register it writes (it might keep it). `ecalli` reads and writes none.

Pick an instruction and its registers, and watch its row:

<CostRow />

## The tests

**New file** `test/gas.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import type { Cost } from "../src/pvm/gas.ts";
import { instructionCost, registersUsed } from "../src/pvm/gas.ts";
import { decodeInstruction, opcodeInfo } from "../src/pvm/instructions.ts";
import { assemble } from "../src/pvm/program.ts";

/** The cost of the first instruction of a hand-made program. */
function costOf(...instructions: number[][]): Cost {
  const program = assemble(instructions);
  return instructionCost(program, decodeInstruction(program, 0));
}

test("which registers an instruction reads and writes", () => {
  const used = (bytes: number[]) => registersUsed(decodeInstruction(assemble([bytes]), 0));
  const add = used([200, 0x10, 2]); // add_64 r2 = r0 + r1
  assert.deepEqual(add, { reads: [0, 1], writes: [2] });
  const load = used([130, 0x10]); // load_ind_u64 r0, [r1]
  assert.deepEqual(load, { reads: [1], writes: [0] });
  const store = used([123, 0x10]); // store_ind_u64 r0, [r1]
  assert.deepEqual(store, { reads: [0, 1], writes: [] });
  const cmov = used([218, 0x10, 2]); // cmov_iz
  assert.deepEqual(cmov, { reads: [0, 1, 2], writes: [2] });
});

test("a row from the GP's table: add_64 is 1 cycle, and 1 or 2 decode slots", () => {
  const add: Cost = costOf([200, 0x10, 2]);
  assert.deepEqual(add, { cycles: 1, slots: 2, units: [1, 0, 0, 0, 0] });
  const addInPlace: Cost = costOf([200, 0x10, 0]); // r0 = r0 + r1: writes a register it reads
  assert.equal(addInPlace.slots, 1);
});

test("memory is slow: a load or a store takes 25 cycles, and a load unit or a store unit", () => {
  const load: Cost = costOf([130, 0x10]);
  assert.deepEqual(load, { cycles: 25, slots: 1, units: [1, 1, 0, 0, 0] });
  const store: Cost = costOf([123, 0x10]);
  assert.deepEqual(store, { cycles: 25, slots: 1, units: [1, 0, 1, 0, 0] });
});

test("dividing takes 60 cycles; ecalli takes 100", () => {
  const divide: Cost = costOf([203, 0x10, 2]); // div_u_64
  assert.equal(divide.cycles, 60);
  const ecalli: Cost = costOf([10, 0]);
  assert.equal(ecalli.cycles, 100);
});

test("a branch costs 20, or 1 if either way leads to trap or unlikely", () => {
  const eitherWay: Cost = costOf([170, 0x10, 4], [1], [1]); // both ways: fallthrough
  assert.equal(eitherWay.cycles, 20);
  const toTrap: Cost = costOf([170, 0x10, 4], [1], [0]); // the target is a trap
  assert.equal(toTrap.cycles, 1);
  const nextUnlikely: Cost = costOf([170, 0x10, 4], [2], [1]); // the next one is unlikely
  assert.equal(nextUnlikely.cycles, 1);
});

test("every instruction has a row in the cost table: 139 of them", () => {
  let rows = 0;
  for (let opcode = 0; opcode < 256; opcode++) {
    if (!opcodeInfo(opcode)) continue;
    const cost: Cost = costOf([opcode], [0]);
    assert.ok(cost.cycles >= 0, opcodeInfo(opcode)!.name);
    rows++;
  }
  assert.equal(rows, 139);
});
```

## The code

**New file** `src/pvm/gas.ts`

```ts
// Gas (GP App. A.9 and A.10): what running code costs. Every instruction has a row in the
// GP's cost table: the cycles it takes, the decode slots it needs, and the execution units
// of the virtual CPU it occupies. Lesson 15.10 feeds the rows through a model CPU.

import type { Instruction } from "./instructions.ts";
import type { Program } from "./program.ts";

/** How many of each execution unit: ALU, load, store, multiply, divide (the GP's 𝔼). */
export type Units = [number, number, number, number, number];

/** An instruction's row in the cost table: cycles (č), decode slots (ď) and units (x̌). */
export type Cost = { cycles: number; slots: number; units: Units };

const NONE: Units = [0, 0, 0, 0, 0];
const ALU: Units = [1, 0, 0, 0, 0];
const LOAD: Units = [1, 1, 0, 0, 0];
const STORE: Units = [1, 0, 1, 0, 0];
const MUL: Units = [1, 0, 0, 1, 0];
const DIV: Units = [1, 0, 0, 0, 1];

/** 𝔪 (GP App. A.10): a load or a store takes 25 cycles. */
const MEMORY = 25;

/**
 * š and ř (GP App. A.9): the registers an instruction reads, and those it writes, from its
 * row in the instruction tables. A cmov reads the register it writes: it may keep it.
 */
export function registersUsed(ins: Instruction): { reads: number[]; writes: number[] } {
  const { name, layout, registers: r } = ins;
  if (/^(store|branch|jump_ind)/.test(name)) return { reads: r, writes: [] };
  if (layout === "regRegReg") {
    return { reads: name.startsWith("cmov") ? r : r.slice(0, 2), writes: [r[2]] }; // [A, B, D]
  }
  if (layout === "regReg") return { reads: [r[1]], writes: [r[0]] }; // [D, A]
  return { reads: name.startsWith("cmov") ? r : r.slice(1), writes: r.slice(0, 1) };
}

/** What a row can depend on: the GP's 𝔓 and 𝔓_S for this instruction, and its 𝔟. */
type Context = { p: (a: number, b: number) => number; ps: (a: number, b: number) => number };
type Row = (c: Context & { b: number }) => Cost;
const cost = (cycles: number, slots: number, units: Units): Cost => ({ cycles, slots, units });
const fixed = (c: number, s: number, u: Units): Row => () => cost(c, s, u);

// The GP's kinds of row, named after its own (\simplealuthreeop and friends).
const simple: Row = ({ p }) => cost(1, p(1, 2), ALU);
const simple32: Row = ({ p }) => cost(2, p(2, 3), ALU);
const trivial = fixed(1, 1, ALU);
const trivial2 = fixed(2, 1, ALU);
const shift: Row = ({ ps }) => cost(1, ps(2, 3), ALU);
const shift32: Row = ({ ps }) => cost(2, ps(3, 4), ALU);
const shiftAlt = fixed(1, 3, ALU);
const shiftAlt32 = fixed(2, 4, ALU);
const compare = fixed(3, 3, ALU);
const minMax: Row = ({ p }) => cost(3, p(2, 3), ALU);
const divide = fixed(60, 4, DIV);

/** The rest of the GP's cost table (App. A.10); loads, stores and branches come below. */
const COSTS: Record<string, Row> = {
  move_reg: fixed(0, 1, NONE),
  and: simple, xor: simple, or: simple, add_64: simple, sub_64: simple,
  and_imm: simple, xor_imm: simple, or_imm: simple, add_imm_64: simple, shlo_r_imm_64: simple,
  shar_r_imm_64: simple, shlo_l_imm_64: simple, rot_r_64_imm: simple, reverse_bytes: simple,
  add_32: simple32, sub_32: simple32, add_imm_32: simple32, shlo_r_imm_32: simple32,
  shar_r_imm_32: simple32, shlo_l_imm_32: simple32, rot_r_32_imm: simple32,
  count_set_bits_64: trivial, count_set_bits_32: trivial, leading_zero_bits_64: trivial,
  leading_zero_bits_32: trivial, sign_extend_8: trivial, sign_extend_16: trivial,
  zero_extend_16: trivial, trailing_zero_bits_64: trivial2, trailing_zero_bits_32: trivial2,
  shlo_l_64: shift, shlo_r_64: shift, shar_r_64: shift, rot_l_64: shift, rot_r_64: shift,
  shlo_l_32: shift32, shlo_r_32: shift32, shar_r_32: shift32, rot_l_32: shift32,
  rot_r_32: shift32, shlo_l_imm_alt_64: shiftAlt, shlo_r_imm_alt_64: shiftAlt,
  shar_r_imm_alt_64: shiftAlt, rot_r_64_imm_alt: shiftAlt, shlo_l_imm_alt_32: shiftAlt32,
  shlo_r_imm_alt_32: shiftAlt32, shar_r_imm_alt_32: shiftAlt32, rot_r_32_imm_alt: shiftAlt32,
  set_lt_u: compare, set_lt_s: compare, set_lt_u_imm: compare, set_lt_s_imm: compare,
  set_gt_u_imm: compare, set_gt_s_imm: compare,
  cmov_iz: fixed(2, 2, ALU), cmov_nz: fixed(2, 2, ALU),
  cmov_iz_imm: fixed(2, 3, ALU), cmov_nz_imm: fixed(2, 3, ALU),
  max: minMax, max_u: minMax, min: minMax, min_u: minMax,
  div_u_32: divide, div_s_32: divide, rem_u_32: divide, rem_s_32: divide,
  div_u_64: divide, div_s_64: divide, rem_u_64: divide, rem_s_64: divide,
  and_inv: fixed(2, 3, ALU), or_inv: fixed(2, 3, ALU), xnor: ({ p }) => cost(2, p(2, 3), ALU),
  neg_add_imm_64: fixed(2, 3, ALU), neg_add_imm_32: fixed(3, 4, ALU),
  load_imm: fixed(1, 1, NONE), load_imm_64: fixed(1, 2, NONE),
  mul_64: ({ p }) => cost(3, p(1, 2), MUL), mul_imm_64: ({ p }) => cost(3, p(1, 2), MUL),
  mul_32: ({ p }) => cost(4, p(2, 3), MUL), mul_imm_32: ({ p }) => cost(4, p(2, 3), MUL),
  mul_upper_s_s: fixed(4, 4, MUL), mul_upper_u_u: fixed(4, 4, MUL),
  mul_upper_s_u: fixed(6, 4, MUL),
  trap: fixed(2, 1, NONE), fallthrough: fixed(2, 1, NONE), unlikely: fixed(40, 1, NONE),
  jump: fixed(15, 1, NONE), load_imm_jump: fixed(15, 1, NONE),
  jump_ind: fixed(22, 1, NONE), load_imm_jump_ind: fixed(22, 1, NONE),
  ecalli: fixed(100, 4, ALU),
};

/** An instruction's row: every load, store and branch shares one; the rest are in COSTS. */
function rowOf(name: string): Row {
  if (/^load_(ind_)?[ui]\d+$/.test(name)) return fixed(MEMORY, 1, LOAD);
  if (name.startsWith("store_")) return fixed(MEMORY, 1, STORE);
  if (name.startsWith("branch_")) return ({ b }) => cost(b, 1, ALU);
  return COSTS[name];
}

/** 𝔟 (GP App. A.10): 1 if either way a branch can go starts with unlikely or trap, else 20. */
function branchCost(program: Program, ins: Instruction): number {
  const opcodeAt = (i: number) => program.code[i] ?? 0; // past the end, ζ is zeros: trap
  const ways = [ins.next, ins.target as number]; // fall through, or jump
  return ways.some((i) => [0, 2].includes(opcodeAt(i))) ? 1 : 20;
}

/** An instruction's cost (GP App. A.10): its row, for its registers and its branch targets. */
export function instructionCost(program: Program, ins: Instruction): Cost {
  const { reads, writes } = registersUsed(ins);
  const overlap = writes.some((r) => reads.includes(r));
  const [a, , d] = ins.registers; // for the shifts: registers [A, B, D]
  const p = (x: number, y: number) => (overlap ? x : y); // 𝔓: writes a register it reads?
  const ps = (x: number, y: number) => (a === d ? x : y); // 𝔓_S: is φ_D the same as φ_A?
  const b = ins.name.startsWith("branch_") ? branchCost(program, ins) : 0;
  return rowOf(ins.name)({ p, ps, b });
}
```

`registersUsed` reads the registers off the instruction's layout. Stores, branches and
`jump_ind` only read; three-register instructions read A and B and write D; two-register
ones read A and write D; everything else writes its first register and reads the rest.

The table copies the Gray Paper's row by row, and its names (`simple`, `shift`,
`compare`...) follow the shorthands the Gray Paper's own source uses for its kinds of row,
so you can hold the two side by side. Loads, stores and branches each share one row, so a
pattern finds them. `branchCost` reads the opcode byte at both ways a branch can go. Past
the end of the code there is nothing, and the Gray Paper's ζ says nothing reads as zeros:
`trap`.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ which registers an instruction reads and writes (8.4ms)
✔ a row from the GP's table: add_64 is 1 cycle, and 1 or 2 decode slots (0.3ms)
✔ memory is slow: a load or a store takes 25 cycles, and a load unit or a store unit (0.1ms)
✔ dividing takes 60 cycles; ecalli takes 100 (0.1ms)
✔ a branch costs 20, or 1 if either way leads to trap or unlikely (0.1ms)
✔ every instruction has a row in the cost table: 139 of them (0.9ms)
...
✔ the reported packages: each one's hash and exports root, sorted by hash (229.1ms)
...
ℹ tests 437
ℹ suites 0
ℹ pass 437
ℹ fail 0
...
reported 437 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791736897027
...
```

## Watch it

**New file** `bin/costs.ts`

```ts
// Shows the cost sheet of a real basic block: the one the bootstrap service's accumulation
// jumps to first. Each instruction's cycles, decode slots and execution units.
// Usage: npm run costs

import { readFileSync } from "node:fs";
import { fromHex } from "../src/bytes.ts";
import { Run } from "../src/obs.ts";
import { instructionCost } from "../src/pvm/gas.ts";
import { decodeInstruction } from "../src/pvm/instructions.ts";
import { basicBlocks } from "../src/pvm/machine.ts";
import { deblob, unpackCode } from "../src/pvm/program.ts";
import { serviceCode } from "../src/services.ts";
import type { KeyValue } from "../src/trie.ts";

const trace = JSON.parse(readFileSync("../vectors/traces/fallback/00000001.json", "utf8"));
const entries: KeyValue[] = trace.pre_state.keyvals.map((e: { key: string; value: string }) => ({
  key: fromHex(e.key),
  value: fromHex(e.value),
}));
const program = deblob(unpackCode(serviceCode(entries, 0)!).program);
const blocks = basicBlocks(program);

const UNITS = ["ALU", "load", "store", "mul", "div"];
const run = new Run("costs");
let at = decodeInstruction(program, 5).target as number; // where accumulation's jump goes
console.log(`the basic block at ${at}:`);
for (;;) {
  const ins = decodeInstruction(program, at);
  const { cycles, slots, units } = instructionCost(program, ins);
  const used = UNITS.filter((_, k) => units[k] > 0).join("+") || "none";
  const row = `${ins.name.padEnd(16)} cycles ${String(cycles).padStart(3)}  slots ${slots}`;
  console.log(`${row}  ${used}`);
  run.event("cost", { at, name: ins.name, cycles, slots, units: used });
  if (blocks.has(ins.next)) break; // the next instruction starts another block
  at = ins.next;
}
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

**What flows through it.** One run, three faces — a basic block going in, one
instruction's price tag, and the lines printed. Tab across them:

::: code-group

```text [what goes in]
service 0's code from the fallback trace, cut into basic blocks;
the block shown is the one accumulation's first jump lands on, at 92078 —
seven instructions: make stack room, save three registers, call on
```

```ts [what it computes]
// instructionCost for one of the three store_ind_u64s
const computed = {
  cycles: 25, // a store's latency on the model CPU
  slots: 1, // decode slots it occupies
  units: "ALU+store", // an address to add, a value to store
  blockTotal: 91, // all seven added up — the pipeline will beat it
};
```

```text [what comes out]
the basic block at 92078:
store_ind_u64    cycles  25  slots 1  ALU+store
```

:::

Read the input into the output: the program only needs the code — no machine runs here.
It walks the block instruction by instruction, prices each one (cycles, decode slots,
the execution units it would occupy), and stops where the next basic block begins.

**Run**

```sh
npm pkg set scripts.costs="node bin/costs.ts"
npm run costs
```

```text
the basic block at 92078:
add_imm_64       cycles   1  slots 1  ALU
store_ind_u64    cycles  25  slots 1  ALU+store
store_ind_u64    cycles  25  slots 1  ALU+store
store_ind_u64    cycles  25  slots 1  ALU+store
move_reg         cycles   0  slots 1  none
move_reg         cycles   0  slots 1  none
load_imm_jump    cycles  15  slots 1  none
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=costs-1791736902016
```

You met this block in [lesson 15.8](./08-a-real-program.md): a function getting started. It makes room on the
stack, saves three registers there, and calls another function. Add up its cycles and you
get 91. But a real CPU doesn't wait for one store to finish before starting the next: the
model has four store units, and they can all work at once. [Lesson 15.10](./10-the-pipeline.md) builds that
CPU, and this block comes out far cheaper than 91. The *Costs* panel, on **6 · The PVM**,
has the sheet.

![Costs panel](./images/09-costs.png)

<details>
<summary>lasair: <code>inst_cost</code>, in <code>lib/pvm_gas.ml</code></summary>

```ocaml
let inst_cost ~(branch : int) (i : instruction) : cost =
  let alu3 = c 1 (overlap 1 2 i) u_alu and alu3_32 = c 2 (overlap 2 3 i) u_alu in
  let alu2 = c 1 (overlap 1 2 i) u_alu and alu2_32 = c 2 (overlap 2 3 i) u_alu in
  let triv1 = c 1 1 u_alu and triv2 = c 2 1 u_alu in
  let shifts = c 1 (overlap_shift 2 3 i) u_alu and shifts_32 = c 2 (overlap_shift 3 4 i) u_alu in
```

The same trick: name the Gray Paper's kinds of row once, then give each instruction its
kind. lasair matches on its decoded instruction type, one constructor per instruction;
your table matches on names.

</details>

## Check your understanding

::: check
**`add_64 r2 = r0 + r1` needs 2 decode slots, and `add_64 r0 = r0 + r1` only 1. Why?**

- [ ] r0 is a special register, cheaper to use
  > No: any register would do. What matters is whether the result overwrites one of the
  > inputs.
- [x] The second writes a register it also reads
  > Yes: that's 𝔓(1, 2). Picture a CPU whose add always overwrites an input: aiming at a
  > third register takes an extra copy first.
- [ ] The second does less work, so it takes fewer cycles
  > No: both take 1 cycle. Only the decode slots differ.

**A `branch_eq` whose target is a `trap` costs 1 cycle, not 20. Why?**

- [ ] A trap ends the program, so the rest is free
  > No: the price is the branch's own, and it's charged whether the branch jumps or not.
- [x] A branch to a trap is usually a check that should never fail, so a CPU would guess it right
  > Yes: 𝔟 is 1 if either way the branch can go starts with `trap` or `unlikely`, and 20
  > otherwise.
- [ ] Branches backwards are cheaper
  > No: direction doesn't come into it, only what's at the two places it can go: the
  > target and the next instruction.

**Why does `cmov_iz` count as reading the register it writes?**

- [x] When the condition fails it keeps the old value, so that value is an input
  > Yes: a `cmov` may leave its destination as it was, so š lists the destination among
  > the registers it reads.
- [ ] Every instruction reads the register it writes
  > No: `add_64 r2 = r0 + r1` reads only r0 and r1. That's why it needs 2 decode slots.
- [ ] Only on a run where the move happens
  > No: š and ř come from the instruction's row, not from what happens when it runs. A
  > `cmov` reads its destination every time.

**The cycles of the block at 92078 add up to 91. Is 91 what the block costs?**

- [ ] Yes: a block costs the sum of its cycles
  > No: a CPU doesn't run one instruction at a time. The model has four store units, so
  > the three stores can run at once.
- [x] No: the CPU runs instructions side by side, so it costs far less
  > Yes: [lesson 15.10](./10-the-pipeline.md) builds that CPU, and the three 25-cycle
  > stores run together instead of one after another.
- [ ] No: it costs more, because `move_reg` can't really be free
  > No: `move_reg`'s 0 is its row in the table, already in the 91. And the real cost is
  > lower than 91, not higher.
:::

## What you have

A price for every instruction the PVM knows. A price list doesn't say what a block costs,
though, because a CPU runs instructions side by side: [lesson 15.10](./10-the-pipeline.md) builds the CPU that
adds them up.

Next: [15.10 The pipeline](./10-the-pipeline.md)
