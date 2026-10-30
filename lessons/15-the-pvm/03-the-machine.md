# The machine

Time to switch it on. Lessons [15.1](./01-the-program-blob.md) and [15.2](./02-instructions.md) read a program; this one *runs* one. The PVM
is a small, very strict computer: thirteen 64-bit registers, an instruction counter,
and a rulebook for each instruction. This lesson builds the machine and teaches it its
first seventeen instructions, enough to run a loop. Memory comes [next lesson](./04-memory.md), and gas
at the end of the part ([lessons 15.9](./09-what-instructions-cost.md) to 15.11).

## New words

- **Register.** One of the PVM's 13 little 64-bit boxes for numbers, named r0 to r12.
  Instructions work on registers. *Example:* `add_64` adds two registers into a third.
- **Basic block.** A run of instructions with one way in, its first instruction, and one
  way out, a jump or branch (or a stop) at its end. *Example:* a loop's body.
- **Halt and panic.** The ways a program stops on its own: halt is finishing on purpose,
  panic is a crash. *Example:* jumping to an address that starts no basic block panics.

All three are in the [glossary](../glossary.md).

## What the Gray Paper says

Appendix A.

**The state**: ı, the instruction counter, and φ, thirteen *registers* of 64 bits each. (A
curly phi: the straight ϕ of [lesson 6.2](../06-state-and-merklization/02-state-keys.md) is the authorizer queue. Memory comes in [lesson 15.4](./04-memory.md),
the gas counter in [lesson 15.11](./11-the-gas-meter.md).)

**One step, Ψ₁**: run the instruction at ı. Unless it says otherwise, an instruction
moves ı on to the next one, ı + 1 + skip(ı), and the step ends with ε = ▸, carry on. A
step can also end with *halt* (finished well) or *panic* (finished badly).

**Ψ** steps until ε is anything but ▸.

*Basic blocks* (A.3): a basic block starts at 0, and right after every *terminator*:
`trap`, `fallthrough`, jumps and branches. Apart from `trap` and `fallthrough`, these are
the instructions that can send ı somewhere other than the next instruction. The rule that matters: **a jump or branch
may only land at the start of a basic block**, or the machine panics. A branch checks
*both* places it might go, its target and the next instruction, whether it's taken or
not.

**Halting**: `jump_ind` jumps through the jump table by address, and one address is
special: 2^32 − 2^16. Jumping there halts the machine. It's also where r0 points when a
program starts (r0 is the return address), so when the outermost function returns,
the machine stops.

This lesson's instructions, from the tables: `trap` (panic), `fallthrough`, `jump`,
`jump_ind`, `load_imm`, `load_imm_64`, `move_reg`, `add_imm_64`, `add_64`, `sub_64`,
`and`, `or`, `xor`, `branch_eq`, `branch_ne`, `branch_eq_imm` and `branch_ne_imm`.
Arithmetic wraps around at 2^64.

Below, step three tiny programs from this lesson's tests. The loop adds 10 + 9 + … + 1
into r2: watch ı move on by 1 + skip(ı), the register each instruction writes light up,
and ε stay ▸ until the return halts the machine. The loop without its `fallthrough`, and
a jump into the middle, both panic. Find the instruction that does it, and why. Each line's
first number is its opcode in decimal, as the Gray Paper's table numbers it (51 is
`load_imm`); the bytes after it are hex, as in the code below.

<PvmStepper />

## The tests

**New file** `test/machine.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { HALT_ADDRESS, newMachine, run, step } from "../src/pvm/machine.ts";
import { assemble } from "../src/pvm/program.ts";
import type { Exit, Machine } from "../src/pvm/machine.ts";
import type { Program } from "../src/pvm/program.ts";

/** Adds 10 + 9 + … + 1 into r2, then returns through r0. */
const SUM = assemble([
  [51, 0x02], //               0: load_imm r2, 0
  [51, 0x03, 10], //           2: load_imm r3, 10
  [1], //                      5: fallthrough: the loop must start a basic block
  [200, 0x32, 0x02], //        6: add_64 r2 = r2 + r3
  [149, 0x33, 0xff], //        9: add_imm_64 r3 = r3 + (−1)
  [82, 0x03, 0xfa], //        12: branch_ne_imm r3, 0, back 6 bytes to 6
  [50, 0x00], //              15: jump_ind r0 + 0: return
]);

test("a loop adds 10 + 9 + … + 1, and returning through r0 halts", () => {
  const machine: Machine = newMachine(SUM, [HALT_ADDRESS]);
  const exit: Exit = run(machine);
  assert.equal(exit, "halt");
  assert.equal(machine.registers[2], 55n);
  assert.equal(machine.registers[3], 0n);
});

test("a jump must land at the start of a basic block, or the machine panics", () => {
  const toTheStart: Machine = newMachine(assemble([[51, 0x02, 1], [40, 0xfd]])); // jumps to 0
  const twoSteps: Exit[] = [step(toTheStart), step(toTheStart)];
  assert.deepEqual(twoSteps, ["continue", "continue"]);
  assert.equal(toTheStart.pc, 0); // 0 always starts a block
  const program: Program = assemble([[51, 0x02, 1], [51, 0x03, 2], [40, 0xfd]]); // jumps to 3
  const intoTheMiddle: Machine = newMachine(program);
  const steps: Exit[] = [step(intoTheMiddle), step(intoTheMiddle), step(intoTheMiddle)];
  assert.deepEqual(steps, ["continue", "continue", "panic"]); // 3 follows a load_imm
});

test("trap panics; jump_ind to anything else than the halt address, without a table, too", () => {
  const trapped: Exit = step(newMachine(assemble([[0]])));
  assert.equal(trapped, "panic");
  const jumped: Exit = run(newMachine(assemble([[50, 0x00]]), [8n])); // r0 = 8, no table
  assert.equal(jumped, "panic");
});
```

The `SUM` program is seven instructions you can read from the comments, and [lesson
15.2](./02-instructions.md)'s layouts tell you each byte. `0x32` packs two registers, r2 and r3. `0xff` is −1,
sign-extended. `0xfa` is −6, the jump back. Look at the `fallthrough` at 5: it does
nothing but end a basic block, so that 6, where the loop starts, *begins* one. Without
it the branch back to 6 would panic.

## The code

A tiny assembler first, for programs written by hand:

**Add to** `src/pvm/program.ts`

```ts
/** A tiny assembler for hand-written programs: each array is one instruction's bytes. */
export function assemble(instructions: number[][]): Program {
  const code = Uint8Array.from(instructions.flat());
  const bitmask = new Uint8Array(Math.ceil(code.length / 8));
  let at = 0;
  for (const instruction of instructions) {
    bitmask[Math.floor(at / 8)] |= 1 << at % 8; // this byte starts an instruction
    at += instruction.length;
  }
  return { jumpTable: [], code, bitmask };
}
```

**New file** `src/pvm/machine.ts`

```ts
// The machine (GP App. A): thirteen 64-bit registers and an instruction counter, stepping
// through a program one instruction at a time. Memory and gas come in later lessons.

import type { Instruction } from "./instructions.ts";
import { decodeInstruction, opcodeInfo, skip } from "./instructions.ts";
import type { Program } from "./program.ts";
import { startsInstruction } from "./program.ts";

/** How a step ends (GP's ε): carry on, finish, or fail. */
export type Exit = "continue" | "halt" | "panic";

/** The machine's state: the program, ı, and the registers φ. */
export type Machine = { program: Program; pc: number; registers: bigint[]; blocks: Set<number> };

/** T (GP App. A.3): the instructions that end a basic block. */
const TERMINATORS = new Set([0, 1, 40, 50, 80, 180, 170, 171, 172, 173, 174, 175]);
for (let opcode = 81; opcode <= 90; opcode++) TERMINATORS.add(opcode); // the immediate branches

/** ϖ (GP App. A.3): where basic blocks start, at 0 and just after every terminator. */
export function basicBlocks(program: Program): Set<number> {
  const starts = new Set<number>([0]);
  for (let i = 0; i < program.code.length; i++) {
    if (startsInstruction(program, i) && TERMINATORS.has(program.code[i])) {
      starts.add(i + 1 + skip(program, i));
    }
  }
  const valid = (n: number) => startsInstruction(program, n) && !!opcodeInfo(program.code[n]);
  return new Set([...starts].filter(valid));
}

/** A machine at instruction 0, with every register 0 unless given. */
export function newMachine(program: Program, registers: bigint[] = []): Machine {
  const all = Array.from({ length: 13 }, (_, i) => registers[i] ?? 0n);
  return { program, pc: 0, registers: all, blocks: basicBlocks(program) };
}

/** The address that halts the machine when jumped to: where r0 points at the start. */
export const HALT_ADDRESS = 2n ** 32n - 2n ** 16n;

/** Moves to b, which must start a basic block (sjump). */
function jumpTo(m: Machine, b: number): Exit {
  if (!m.blocks.has(b)) return "panic";
  m.pc = b;
  return "continue";
}

/** A branch to b if `taken`: both b and the next instruction must start basic blocks. */
function branch(m: Machine, ins: Instruction, b: number, taken: boolean): Exit {
  if (!m.blocks.has(b) || !m.blocks.has(ins.next)) return "panic";
  m.pc = taken ? b : ins.next;
  return "continue";
}

/** djump(a): through the jump table, by address a = (index + 1) · 2; HALT_ADDRESS halts. */
function jumpIndirect(m: Machine, a: bigint): Exit {
  if (a === HALT_ADDRESS) return "halt";
  const table = m.program.jumpTable;
  if (a === 0n || a > BigInt(table.length * 2) || a % 2n !== 0n) return "panic";
  return jumpTo(m, table[Number(a / 2n) - 1]);
}

/** Lesson 15.3's instructions: control flow, loading constants, and simple arithmetic. */
function basics(m: Machine, ins: Instruction): Exit | undefined {
  const [a, b, c] = ins.registers; // the GP's register letters, in its order
  const [x] = ins.immediates;
  const reg = m.registers; // φ
  switch (ins.name) {
    case "trap":
      return "panic";
    case "fallthrough":
      return jumpTo(m, ins.next);
    case "jump":
      return jumpTo(m, ins.target as number);
    case "jump_ind":
      return jumpIndirect(m, (reg[a] + x) % 2n ** 32n);
    case "load_imm":
    case "load_imm_64":
      reg[a] = x;
      return "continue";
    case "move_reg": // registers [D, A]: φ′_D = φ_A
      reg[a] = reg[b];
      return "continue";
    case "add_imm_64": // registers [A, B]: φ′_A = φ_B + ν_X
      reg[a] = (reg[b] + x) % 2n ** 64n; // registers hold 64 bits
      return "continue";
    case "add_64": // registers [A, B, D]: φ′_D = φ_A + φ_B
      reg[c] = (reg[a] + reg[b]) % 2n ** 64n;
      return "continue";
    case "sub_64":
      reg[c] = (reg[a] + 2n ** 64n - reg[b]) % 2n ** 64n;
      return "continue";
    case "and":
      reg[c] = reg[a] & reg[b];
      return "continue";
    case "or":
      reg[c] = reg[a] | reg[b];
      return "continue";
    case "xor":
      reg[c] = reg[a] ^ reg[b];
      return "continue";
    case "branch_eq":
      return branch(m, ins, ins.target as number, reg[a] === reg[b]);
    case "branch_ne":
      return branch(m, ins, ins.target as number, reg[a] !== reg[b]);
    case "branch_eq_imm":
      return branch(m, ins, ins.target as number, reg[a] === x);
    case "branch_ne_imm":
      return branch(m, ins, ins.target as number, reg[a] !== x);
    default:
      return undefined; // not one of these
  }
}

/** A family of instructions: runs the instruction if it's one of its own, else undefined. */
type Family = (m: Machine, ins: Instruction) => Exit | undefined;

/** Every family of instructions built so far. */
const FAMILIES: Family[] = [basics];

/** Ψ₁ (GP App. A.4): runs the instruction at ı. Each family has a go at it. */
export function step(m: Machine): Exit {
  const ins = decodeInstruction(m.program, m.pc);
  m.pc = ins.next; // most instructions just move on
  for (const family of FAMILIES) {
    const exit = family(m, ins);
    if (exit !== undefined) return exit;
  }
  throw new Error(`${ins.name} isn't built yet`);
}

/** Ψ, without gas yet: steps until the machine halts or panics. */
export function run(m: Machine): Exit {
  for (;;) {
    const exit = step(m);
    if (exit !== "continue") return exit;
  }
}
```

The machine is a plain object that `step` *changes*. Most of your client works on values
it doesn't change, but a machine is exactly something that changes as it runs (like
[lesson 2.3](../02-codec/03-writer-and-reader.md)'s `Writer` and `Reader`, which move along as they go). `step` decodes
the instruction ([lesson 15.2](./02-instructions.md)), moves ı on, and then offers it to each *family* of
instructions in turn. This lesson has one family, `basics`; later lessons add more to
`FAMILIES` without touching `step`. Inside a family, each instruction can override the
move: a jump sets ı itself, a halt or panic stops. Each register's meaning depends on
the layout, as [lesson 15.2](./02-instructions.md)'s comments said: `add_64` writes its *third* register, and
`add_imm_64` its *first*. Instructions not built yet throw an `Error`, which is your
bug, not the program's: a panic is the program's fault, a thrown `Error` is yours.

> [!NOTE]
> **The simple road.** `step` moves ı on *before* running the instruction, so a jump that
> panics leaves ı at the next instruction, not where it was. And `run` doesn't reset ı
> after the machine stops, as the Gray Paper's Ψ does. Nothing reads ı after a stop until
> [Part 16](../16-host-calls/index.md)'s host calls, and the [hardening pass](https://github.com/abutlabs/the-gray-tutor/blob/main/HARDENING.md) puts both right.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ the reported packages: each one's hash and exports root, sorted by hash (235.9ms)
...
✔ a loop adds 10 + 9 + … + 1, and returning through r0 halts (1.3ms)
✔ a jump must land at the start of a basic block, or the machine panics (0.6ms)
...
ℹ tests 404
ℹ suites 0
ℹ pass 404
ℹ fail 0
...
reported 404 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791736334899
...
```

### Break it on purpose

Delete the `[1]` line (the `fallthrough`) from `SUM` and run the tests. The loop runs
once, r2 reaches 10, and then the branch back panics: its target, now 5, follows a
`load_imm` and starts no basic block. Put it back.

## Watch it

**New file** `bin/run.ts`

```ts
// Runs a hand-written program on your PVM, one step at a time: it adds 10 + 9 + … + 1 into
// r2, then returns through r0, which halts the machine.
// Usage: npm run run

import { decodeInstruction } from "../src/pvm/instructions.ts";
import { HALT_ADDRESS, newMachine, step } from "../src/pvm/machine.ts";
import { assemble } from "../src/pvm/program.ts";
import { Run } from "../src/obs.ts";

const SUM = assemble([
  [51, 0x02], //               0: load_imm r2, 0
  [51, 0x03, 10], //           2: load_imm r3, 10
  [1], //                      5: fallthrough
  [200, 0x32, 0x02], //        6: add_64 r2 = r2 + r3
  [149, 0x33, 0xff], //        9: add_imm_64 r3 = r3 + (−1)
  [82, 0x03, 0xfa], //        12: branch_ne_imm r3, 0, back to 6
  [50, 0x00], //              15: jump_ind r0 + 0
]);

const machine = newMachine(SUM, [HALT_ADDRESS]);
const run = new Run("run");
for (let n = 1; ; n++) {
  const at = machine.pc;
  const { name } = decodeInstruction(SUM, at);
  const before = [...machine.registers];
  const exit = step(machine);
  const changed = machine.registers.flatMap((v, r) => (v !== before[r] ? [`r${r} = ${v}`] : []));
  const where = `step ${String(n).padStart(2)}  at ${String(at).padStart(2)}`;
  console.log(`${where}  ${name.padEnd(14)} ${changed.join(", ")}`);
  run.event("step", { n, at, name, changed: changed.join(", "), exit });
  if (exit !== "continue") {
    console.log(`the machine stops: ${exit}, with r2 = ${machine.registers[2]}`);
    break;
  }
}
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

**What flows through it.** One run, three faces — the program going in (no file this
time: it's written in the bin itself), the machine mid-loop, and the lines printed. Tab
across them:

::: code-group

```text [what goes in]
the SUM program, seven hand-assembled instructions:
  [51, 0x02]         0: load_imm r2, 0
  [51, 0x03, 10]     2: load_imm r3, 10
  [1]                5: fallthrough
  [200, 0x32, 0x02]  6: add_64 r2 = r2 + r3
  [149, 0x33, 0xff]  9: add_imm_64 r3 = r3 + (-1)
  [82, 0x03, 0xfa]  12: branch_ne_imm r3, 0, back to 6
  [50, 0x00]        15: jump_ind r0 + 0
```

```ts [what it computes]
// the machine after step 7, mid-loop: the second add_64 just ran
const computed = {
  pc: 9, // add_64 at 6 finished; add_imm_64 is next
  r2: 19n, // the sum so far: 10 + 9
  r3: 9n, // the counter, on its way down to 0
  trips: 10, // the loop runs ten times, three instructions a trip
  stops: "halt", // jump_ind through r0, which held HALT_ADDRESS from the start
};
```

```text [what comes out]
step  7  at  6  add_64         r2 = 19
the machine stops: halt, with r2 = 55
```

:::

Read the input into the output: each step decodes one instruction at `pc`, runs it, and
prints only the registers it changed — so the loop reads as r2 climbing while r3 falls.
The last `jump_ind` adds 0 to r0, which `newMachine` set to the halt address at the
start, and the machine stops with the answer, 10 + 9 + … + 1 = 55, sitting in r2.

**Run**

```sh
npm pkg set scripts.run="node bin/run.ts"
npm run run
```

```text
step  1  at  0  load_imm
step  2  at  2  load_imm       r3 = 10
step  3  at  5  fallthrough
step  4  at  6  add_64         r2 = 10
step  5  at  9  add_imm_64     r3 = 9
step  6  at 12  branch_ne_imm
step  7  at  6  add_64         r2 = 19
step  8  at  9  add_imm_64     r3 = 8
step  9  at 12  branch_ne_imm
step 10  at  6  add_64         r2 = 27
...
step 33  at 12  branch_ne_imm
step 34  at 15  jump_ind
the machine stops: halt, with r2 = 55
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=run-1791736339857
```

34 steps: two loads, the fallthrough, ten trips round the loop at three instructions
each, and the return. Each step shows only the registers it changed, which is why step 1
shows none: it loads 0 into r2, which already held 0. Watch r2 climb, 10, 19, 27…, and
r3 count down to 0. The *PVM run* panel, on **6 · The PVM**, has every step, with the
registers each one changed.

![PVM run panel](./images/03-pvm-run.png)

<details>
<summary>lasair: <code>djump_index</code>, in <code>lib/pvm.ml</code></summary>

```ocaml
let djump_index (jt : int64 array) (base : int64) (offset : int64) : int =
  let a = Int64.to_int (Int64.logand (Int64.add base offset) 0xFFFFFFFFL) in
  if a = 0xFFFF0000 then -1
  else if a = 0 || a land 1 <> 0 then -2
  else
    let idx = a / 2 - 1 in
    if idx < 0 || idx >= Array.length jt then -2 else idx
```

Your `jumpIndirect`, with two differences. The halt address is written in hex,
`0xFFFF0000`, which is exactly 2^32 − 2^16. And instead of returning "halt" or "panic",
lasair returns −1 or −2 in place of a table index: a little faster, a little harder to
read. `logand … 0xFFFFFFFFL` is the `mod 2^32`.

</details>

## Check your understanding

::: check
**`SUM` adds 10 + 9 + … + 1 into r2. What happens if you delete its `fallthrough`?**

- [ ] Nothing changes: `fallthrough` does no work
  > No: it does no arithmetic, but it ends a basic block, so that the loop's first
  > instruction starts one.
- [x] The loop runs once, r2 reaches 10, and the branch back panics
  > Yes: the loop now starts at 5, right after a `load_imm`, which ends no block. The
  > branch's target starts no basic block, so the machine panics.
- [ ] The loop never ends
  > No: the branch can't go back even once. It's checked, and fails, the first time it
  > runs.

**`add_imm_64 r3 = r3 + (−1)` adds the immediate 2^64 − 1 to 10. Why does r3 become 9?**

- [x] Registers hold 64 bits, so 10 + 2^64 − 1 wraps round to 9
  > Yes: the sum is 2^64 + 9, and only the 64 bits below 2^64 are kept. Adding all ones
  > takes 1 away.
- [ ] The PVM spots the minus sign and subtracts instead
  > No: `add_imm_64` only ever adds. The wrap-around at 2^64 is what makes the add work
  > out as taking 1 away.
- [ ] The sum overflowed, and the PVM put the old value back, less one
  > No: overflow is never an error on the PVM, and nothing is put back. Arithmetic simply
  > wraps around at 2^64.

**Why does `SUM` stop with halt when it jumps through r0?**

- [ ] `jump_ind` always ends the program
  > No: through any other address it goes via the jump table. With r0 = 8 and no table,
  > the test's machine panics.
- [x] r0 holds 2^32 − 2^16, the halt address
  > Yes: the test starts r0 there, as a real program's start does, so returning from the
  > outermost function stops the machine well.
- [ ] It's the last instruction in the code
  > No: the machine stops because of where it jumps, not where the code ends. Past the end
  > the code reads as zeros, which is `trap`: a panic.

**A branch is not taken. Must its target still start a basic block?**

- [ ] No: only the place it actually goes is checked
  > No: the Gray Paper checks both places, whichever way the branch goes.
- [ ] Only if the target is behind it
  > No: direction doesn't come into it. A forward target is checked just the same.
- [x] Yes: the target and the next instruction must both start basic blocks
  > Yes: a branch with a bad target panics even on a run where it wouldn't jump.
:::

## What you have

A running PVM: registers, an instruction counter, seventeen instructions, basic blocks,
and the two ways a program ends. Everything so far lives in registers, and a real
program needs more room than 13 numbers: [lesson 15.4](./04-memory.md) gives the machine memory.

Next: [15.4 Memory](./04-memory.md)
