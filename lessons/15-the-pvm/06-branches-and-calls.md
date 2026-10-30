# Branches and calls

Programs make choices (*if the balance is too low, stop*) and call functions and come
back. [Lesson 15.3](./03-the-machine.md) gave your machine equal and not equal; this lesson adds the other
fourteen branches and the two instructions for a call. One question runs through it: is
−1 less than 1? That depends on who's asking.

## What the Gray Paper says

Appendix A.5:

- **Branches** compare φ_A with a register φ_B, or with an immediate ν_X, and jump if the
  comparison holds. It's [lesson 15.3](./03-the-machine.md)'s `branch`: the target and the next instruction must
  both start basic blocks. There are ten comparisons: `eq`, `ne`, and `lt`, `le`, `ge`,
  `gt` in two flavours each. `_u` reads the 64 bits as an unsigned number, `_s` as a
  signed one (Z₈, [lesson 15.2](./02-instructions.md)). The immediate branches have all ten; with two registers
  there are six (no `le` or `gt`: swap the registers and use `ge` or `lt`).
- **−1 against 1.** A register holds −1 as 64 set bits. Unsigned, that's 2^64 − 1, the
  biggest number there is. Signed, it's −1. So `branch_lt_u` says −1 < 1 is false, and
  `branch_lt_s` says it's true. Same bits, opposite answers.
- **`load_imm_jump`** (80) sets φ_A to ν_X and jumps to ν_Y. That's a function call: ν_X
  is the way back, an address in the jump table ([lesson 15.3](./03-the-machine.md)), and the function returns
  with `jump_ind` through φ_A. Programs keep the way back in r0, which is why [lesson 15.3](./03-the-machine.md)'s
  program finished by jumping through r0.
- **`load_imm_jump_ind`** (180) is the same call through a register: φ_A gets ν_X, and the
  machine jumps through the table to φ_B + ν_Y. Think *function pointer*. φ_B is read as
  it was before φ_A changes, which matters when they're the same register.
- **`unlikely`** (2) changes nothing at all. It marks a path a branch rarely takes, and
  only the gas meter cares: a branch with `unlikely` (or `trap`) at either end costs less
  ([15.9 to 15.11](./09-what-instructions-cost.md)).

Set two registers and see every comparison, unsigned beside signed:

<SignedBranches />

## The tests

**New file** `test/branches.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { opcodeInfo } from "../src/pvm/instructions.ts";
import { HALT_ADDRESS, newMachine, run, step } from "../src/pvm/machine.ts";
import type { Program } from "../src/pvm/program.ts";
import { assemble } from "../src/pvm/program.ts";
import type { Exit, Machine } from "../src/pvm/machine.ts";

const MAX = 2n ** 64n - 1n; // all 64 bits set: −1, read as signed

/** Runs one branch, with r0 = p and r1 = q: does it jump (to 5), or fall through? */
function jumps(branch: number[], p: bigint, q = 0n): boolean {
  const fallthroughs = Array.from({ length: 5 - branch.length }, () => [1]); // up to 5
  const machine = newMachine(assemble([branch, ...fallthroughs, [0]]), [p, q]);
  step(machine);
  return machine.pc === 5;
}

// A branch on two registers is [opcode, A + 16·B, offset]: here A = r0, B = r1, offset 5.
test("signed or unsigned: −1 is the biggest number there is, or less than 1", () => {
  const unsignedLess: boolean = jumps([172, 0x10, 5], MAX, 1n); // branch_lt_u: 2^64 − 1 < 1? no
  assert.equal(unsignedLess, false);
  const signedLess: boolean = jumps([173, 0x10, 5], MAX, 1n); // branch_lt_s: −1 < 1? yes
  assert.equal(signedLess, true);
});

// With an immediate it's [opcode, A + 16·l_X, X, offset]: here A = r0 and X is one byte.
test("an immediate branch compares with ν_X, sign-extended like every immediate", () => {
  const lessOrEqual: boolean = jumps([84, 0x10, 3, 5], 3n); // branch_le_u_imm: 3 ≤ 3
  assert.equal(lessOrEqual, true);
  const less: boolean = jumps([83, 0x10, 3, 5], 3n); // branch_lt_u_imm: 3 < 3? no
  assert.equal(less, false);
  const overMax: boolean = jumps([86, 0x10, 0xff, 5], 3n); // branch_gt_u_imm: 3 > 2^64 − 1? no
  assert.equal(overMax, false);
  const overMinusOne: boolean = jumps([90, 0x10, 0xff, 5], 3n); // branch_gt_s_imm: 3 > −1? yes
  assert.equal(overMinusOne, true);
});

/** A function that doubles r2, at 6, and a call to it at 0: `call` must leave 2 in r0. */
function withCall(call: number[]): Program {
  const program = assemble([
    call, //                    0: the call, 4 bytes
    [50, 0x01], //              4: jump_ind r1 + 0: halt; the function returns here
    [200, 0x22, 0x02], //       6: add_64 r2 = r2 + r2
    [50, 0x00], //              9: jump_ind r0 + 0: return
  ]);
  return { ...program, jumpTable: [4, 6] }; // address 2 leads to 4, address 4 to 6
}

test("a call: load_imm_jump leaves the way back in r0, and the function returns by it", () => {
  const machine: Machine = newMachine(withCall([80, 0x10, 2, 6]), [0n, HALT_ADDRESS, 21n]);
  const exit: Exit = run(machine);
  assert.equal(exit, "halt");
  const registers: bigint[] = machine.registers.slice(0, 3);
  assert.deepEqual(registers, [2n, HALT_ADDRESS, 42n]);
});

// load_imm_jump_ind is [opcode, A + 16·B, l_X, X, Y]: here A = r0, B = r3, X = 2, no Y.
test("a call through a register: load_imm_jump_ind jumps to φ_B + ν_Y", () => {
  const registers: bigint[] = [0n, HALT_ADDRESS, 21n, 4n]; // r3 = 4: the function's address
  const machine: Machine = newMachine(withCall([180, 0x30, 0x01, 2]), registers);
  const exit: Exit = run(machine);
  assert.equal(exit, "halt");
  assert.equal(machine.registers[2], 42n);
});

test("unlikely does nothing but move on", () => {
  const machine: Machine = newMachine(assemble([[2], [0]]));
  const exit: Exit = step(machine);
  assert.equal(exit, "continue");
  assert.equal(machine.pc, 1);
});

test("every branch in the GP's tables has a comparison: 16 of them", () => {
  let branches = 0;
  for (let opcode = 0; opcode < 256; opcode++) {
    if (!opcodeInfo(opcode)?.name.startsWith("branch_")) continue;
    assert.doesNotThrow(() => step(newMachine(assemble([[opcode], [0]]))));
    branches++;
  }
  assert.equal(branches, 16); // 10 against an immediate, 6 against a register
});
```

`jumps` runs one branch whose target is 5, with fallthroughs filling the gap so that both
ways start basic blocks. Then it asks one thing: did the machine land on 5?

`withCall` is a whole program with a function in it. The call at 0 goes to the function
at 6, which doubles r2 and returns through r0 to 4. The jump table has two entries:
address 2 leads to 4, just after the call, and address 4 leads to 6, the function. The
halt address sits in r1 this time, because r0 holds the way back. (A real program
would save r0 in memory before making a call of its own.)

Step it, and try a wrong way back:

<CallTable />

**Run, expect it to fail**

```sh
npm test
```

```text
...
✖ signed or unsigned: −1 is the biggest number there is, or less than 1 (4.6ms)
✖ an immediate branch compares with ν_X, sign-extended like every immediate (0.2ms)
✖ a call: load_imm_jump leaves the way back in r0, and the function returns by it (0.1ms)
✖ a call through a register: load_imm_jump_ind jumps to φ_B + ν_Y (0.1ms)
✖ unlikely does nothing but move on (0.1ms)
✖ every branch in the GP's tables has a comparison: 16 of them (0.6ms)
...
ℹ tests 422
ℹ suites 0
ℹ pass 416
ℹ fail 6
...
test at test/branches.test.ts:20:1
✖ signed or unsigned: −1 is the biggest number there is, or less than 1 (4.6ms)
  Error: branch_lt_u isn't built yet
...
```

Red, and for a reason worth reading: the tests reach branches that no family handles
yet, so `step` throws "isn't built yet". That's [lesson 15.3](./03-the-machine.md)'s rule of thumb at work:
a thrown `Error` is your client's gap, not the program's crash.

## The code

The four branches in `basics` move out to join their twelve siblings:

**Replace in** `src/pvm/machine.ts`

```ts
/** Lesson 15.3's instructions: jumps, and loading and moving values. */
function basics(m: Machine, ins: Instruction): Exit | undefined {
  const [a, b] = ins.registers; // the GP's register letters, in its order
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
    default:
      return undefined; // not one of these
  }
}

/** Every family of instructions built so far. */
const FAMILIES: Family[] = [basics, memoryInstructions, arithmetic, decisions];
```

**Add to** `src/pvm/machine.ts`

```ts
import { signed } from "./instructions.ts";

/** How a branch compares φ_A with φ_B or ν_X: as unsigned numbers (u), or signed (s, Z₈). */
const COMPARISONS: Record<string, (p: bigint, q: bigint) => boolean> = {
  eq: (p, q) => p === q,
  ne: (p, q) => p !== q,
  lt_u: (p, q) => p < q,
  le_u: (p, q) => p <= q,
  ge_u: (p, q) => p >= q,
  gt_u: (p, q) => p > q,
  lt_s: (p, q) => signed(8, p) < signed(8, q),
  le_s: (p, q) => signed(8, p) <= signed(8, q),
  ge_s: (p, q) => signed(8, p) >= signed(8, q),
  gt_s: (p, q) => signed(8, p) > signed(8, q),
};

/** Lesson 15.6's instructions: every branch, the jumps that load a register, and unlikely. */
function decisions(m: Machine, ins: Instruction): Exit | undefined {
  const [a, b] = ins.registers;
  const [x, y] = ins.immediates;
  const reg = m.registers;
  if (ins.name.startsWith("branch_")) {
    const comparison = ins.name.slice("branch_".length).replace("_imm", "");
    const q = ins.name.endsWith("_imm") ? x : reg[b]; // φ_A against ν_X, or against φ_B
    return branch(m, ins, ins.target as number, COMPARISONS[comparison](reg[a], q));
  }
  switch (ins.name) {
    case "load_imm_jump": // φ′_A = ν_X, and jump to ν_Y
      reg[a] = x;
      return jumpTo(m, ins.target as number);
    case "load_imm_jump_ind": {
      const address = (reg[b] + y) % 2n ** 32n; // from φ_B as it was, before φ_A changes
      reg[a] = x;
      return jumpIndirect(m, address);
    }
    case "unlikely": // does nothing at all; it's a hint for the gas meter
      return "continue";
    default:
      return undefined;
  }
}
```

`COMPARISONS` is the Gray Paper's table in ten lines. A branch's name says which
comparison it wants (`branch_lt_s_imm` → `lt_s`) and whether its other side is ν_X or
φ_B. In `load_imm_jump_ind` the address is worked out *before* φ_A changes: swap the two
lines and a call through r0 would jump to its own way back. No test here calls through
the register it writes, so nothing would catch that yet: the [hardening pass](https://github.com/abutlabs/the-gray-tutor/blob/main/HARDENING.md) adds it.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ signed or unsigned: −1 is the biggest number there is, or less than 1 (1.3ms)
✔ an immediate branch compares with ν_X, sign-extended like every immediate (0.3ms)
✔ a call: load_imm_jump leaves the way back in r0, and the function returns by it (0.6ms)
✔ a call through a register: load_imm_jump_ind jumps to φ_B + ν_Y (0.1ms)
✔ unlikely does nothing but move on (0.1ms)
✔ every branch in the GP's tables has a comparison: 16 of them (0.6ms)
...
✔ the reported packages: each one's hash and exports root, sorted by hash (203.9ms)
...
ℹ tests 422
ℹ suites 0
ℹ pass 422
ℹ fail 0
...
reported 422 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791736644236
...
```

## Watch it

**New file** `bin/branches.ts`

```ts
// Runs every branch on your PVM with r0 = −1 and r1 = 1 (ν_X = 1 for the immediate ones),
// and shows which of them jump: the same bits give different answers, unsigned and signed.
// Usage: npm run branches

import { Run } from "../src/obs.ts";
import { opcodeInfo } from "../src/pvm/instructions.ts";
import { newMachine, step } from "../src/pvm/machine.ts";
import { assemble } from "../src/pvm/program.ts";

const MINUS_ONE = 2n ** 64n - 1n; // all 64 bits set

const run = new Run("branches");
console.log("r0 = −1, against r1 = 1 or ν_X = 1:");
for (let opcode = 0; opcode < 256; opcode++) {
  const name = opcodeInfo(opcode)?.name ?? "";
  if (!name.startsWith("branch_")) continue;
  const branch = name.endsWith("_imm") ? [opcode, 0x10, 1, 5] : [opcode, 0x10, 5]; // to 5
  const fallthroughs = Array.from({ length: 5 - branch.length }, () => [1]);
  const machine = newMachine(assemble([branch, ...fallthroughs, [0]]), [MINUS_ONE, 1n]);
  step(machine);
  const taken = machine.pc === 5;
  console.log(`${name.padEnd(16)} ${taken ? "jumps" : "falls through"}`);
  run.event("branch", { name, taken });
}
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

**What flows through it.** One run, three faces — sixteen tiny programs going in, one
comparison's two readings, and the lines printed. Tab across them:

::: code-group

```text [what goes in]
sixteen one-branch programs, one per branch_ opcode, each with
  r0 = 2^64 − 1 — which is −1 read signed, the biggest number read unsigned —
  against r1 = 1 (or ν_X = 1 for the _imm forms); every branch targets byte 5
```

```ts [what it computes]
// the lt pair: the same bits, compared two ways
const computed = {
  branch_lt_u: false, // unsigned: 2^64 − 1 is the biggest number, never < 1
  branch_lt_s: true, // signed: the same bits read −1, and −1 < 1
  taken: "machine.pc === 5", // a taken branch lands the machine on byte 5
};
```

```text [what comes out]
branch_lt_u      falls through
branch_lt_s      jumps
```

:::

Read the input into the output: every program holds the same two values; only the
opcode changes. After one `step` the program checks where the machine stands — on byte
5 the branch jumped, just past it the branch fell through — and the signed and unsigned
twins split exactly where reading the bits differently changes the answer.

**Run**

```sh
npm pkg set scripts.branches="node bin/branches.ts"
npm run branches
```

```text
r0 = −1, against r1 = 1 or ν_X = 1:
branch_eq_imm    falls through
branch_ne_imm    jumps
branch_lt_u_imm  falls through
branch_le_u_imm  falls through
branch_ge_u_imm  jumps
branch_gt_u_imm  jumps
branch_lt_s_imm  jumps
branch_le_s_imm  jumps
branch_ge_s_imm  falls through
branch_gt_s_imm  falls through
branch_eq        falls through
branch_ne        jumps
branch_lt_u      falls through
branch_lt_s      jumps
branch_ge_u      jumps
branch_ge_s      falls through
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=branches-1791736649004
```

Read it in pairs. Every unsigned comparison and its signed twin disagree about −1 and 1:
`lt_u` falls through where `lt_s` jumps, `ge_u` jumps where `ge_s` falls through. `eq`
and `ne` have no twin: equal bits are equal however you read them. The *Branches* panel,
on **6 · The PVM**, has all sixteen.

![Branches panel](./images/06-branches.png)

<details>
<summary>lasair: <code>Load_imm_jump_ind</code>, in <code>lib/pvm.ml</code></summary>

```ocaml
         | Load_imm_jump_ind { ra; rb; imm; offset } ->
           (* the base is read before ra is written; ra is written even when
              the jump halts or panics *)
           let base = rget r rb in
           rset r ra imm;
```

The same order as yours, with a comment to stop anyone "tidying" it. For the branches
lasair has your problem reversed: OCaml's `Int64` compares as signed, so lasair writes a
`compare_u64` for the `_u` branches, where your unsigned `bigint` needs `signed` for `_s`.

</details>

## Check your understanding

::: check
**r0 holds −1, all 64 bits set, and r1 holds 1. Does `branch_lt_u r0, r1` jump?**

- [ ] Yes: −1 is less than 1
  > No: that's `branch_lt_s`. Read unsigned, the same bits are 2^64 − 1, the biggest
  > number there is.
- [x] No: read unsigned, r0 is 2^64 − 1, which isn't less than 1
  > Yes: same bits, two readings. `branch_lt_s` jumps on these registers, and
  > `branch_lt_u` falls through.
- [ ] It panics: a register can't hold −1
  > No: it can, as 64 set bits. Whether they mean −1 or 2^64 − 1 is up to the instruction
  > reading them.

**Why do `branch_eq` and `branch_ne` have no `_u` and `_s` twins?**

- [x] Equal bits are equal however you read them
  > Yes: signed or unsigned changes which of two different numbers is bigger. It can't
  > change whether they're the same.
- [ ] Equality only makes sense for unsigned numbers
  > No: −1 equals −1 just as well. Both readings always agree on equality, so one
  > instruction is enough.

**In `withCall`, `load_imm_jump` leaves 2 in r0. What is that 2?**

- [ ] Byte 2 of the code
  > No: byte 2 is in the middle of the call itself. The way back is an address for the
  > jump table, not a place in the code.
- [x] Jump-table address 2: the table's first entry, byte 4, just after the call
  > Yes: addresses go (index + 1) · 2, so 2 is entry 0, which holds 4. The function
  > returns with `jump_ind` through r0 and lands there.
- [ ] Which function is being called
  > No: where the function is comes from ν_Y, and the call jumps there, to 6. r0 holds
  > the way *back*.

**There's a `branch_le_u_imm`, but no `branch_le_u` with two registers. How does a program ask "is r0 ≤ r1?" in one instruction?**

- [ ] With `branch_le_u_imm`, putting r1 in its immediate
  > No: an immediate is a constant written in the code. It can't hold whatever r1 happens
  > to be when the program runs.
- [ ] With `branch_lt_u`, then `branch_eq`
  > No: that's two instructions, and the question asks for one.
- [x] With `branch_ge_u`, the registers swapped: r1 ≥ r0
  > Yes: r0 ≤ r1 is the same question as r1 ≥ r0. The immediate branches need all ten,
  > because the immediate always sits on the right.
:::

## What you have

Every branch, and calls both ways. Your machine runs every instruction but eleven: ten
that count and shuffle bits, and `ecalli`, the door out to the host. [Lesson 15.7](./07-bits-and-bytes.md)
builds the ten.

Next: [15.7 Bits and bytes](./07-bits-and-bytes.md)
