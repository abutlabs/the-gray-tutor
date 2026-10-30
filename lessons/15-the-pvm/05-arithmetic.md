# Arithmetic

The PVM computes with 72 instructions: add, subtract, multiply, divide, shift, rotate,
compare, pick. Most come twice, in 32 and 64 bits, with a register or a constant as the
second input. Each is one line in the Gray Paper and one line in your client. The lines
are easy; the corners are where the fun is.

## What the Gray Paper says

Appendix A.5, the tables with two registers and an immediate (131 to 161) and with three
registers (190 to 230). Registers hold 64 bits, and everything is modulo 2^64. The
corners that catch people:

- **32-bit instructions** work on the low 32 bits, and **sign-extend** the result back
  to 64: `add_32` of 2^31 − 1 and 1 isn't 2^31, it's `0xffffffff80000000`, which is
  −2^31. The low 32 bits are `80000000`, 2^31, whose top bit is 1: as a signed 32-bit
  number that's −2^31, and sign-extending copies the 1 into the 32 bits above, `ffffffff`.
- **Division by zero** doesn't crash. Division, signed or not, gives 2^64 − 1, all
  ones, and the remainder gives back the dividend.
- **−2^63 ÷ −1** would be 2^63, which doesn't fit in a signed 64-bit number, so the
  answer is −2^63 itself, and the remainder is 0.
- **Signed division rounds towards zero**: −7 ÷ 2 is −3, not −4. And the remainder keeps
  the *dividend's* sign: −7 rem 2 is −1, 7 rem −3 is 1. (The Gray Paper calls these rtz
  and smod.)
- **Shifts**: `shlo_r` (logical) fills with zeros; `shar_r` (arithmetic) keeps the sign,
  so −8 shifted right is −4. Shift amounts are taken mod 32 or mod 64.
- **The immediate forms** are the three-register ones with ν_X standing in for a
  register: `add_imm_64` writes φ_A from φ_B + ν_X. The **alt** forms swap the inputs:
  `shlo_l_imm_alt_32` shifts ν_X by φ_B. Two come only with an immediate, `neg_add_imm`
  (ν_X − φ_B) and `set_gt_imm` (φ_B > ν_X): with three registers you'd just swap them
  and use `sub` or `set_lt`.
- **`cmov`** moves a value only if a condition register is zero (`iz`) or not (`nz`),
  otherwise the destination keeps what it had.

Try the corners, or numbers of your own:

<AluCorners />

## The tests

**New file** `test/arithmetic.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { newMachine, step } from "../src/pvm/machine.ts";
import { assemble } from "../src/pvm/program.ts";
import { OPERATIONS, operationOf } from "../src/pvm/arithmetic.ts";
import { opcodeInfo } from "../src/pvm/instructions.ts";

const MAX = 2n ** 64n - 1n; // all 64 bits set: −1, read as signed
const neg = (x: bigint) => 2n ** 64n - x; // −x, as 64 unsigned bits

/** The registers after running one instruction on them. */
function after(instruction: number[], registers: bigint[]): bigint[] {
  const machine = newMachine(assemble([instruction]), registers);
  step(machine);
  return machine.registers;
}

// Three-register instructions are [opcode, A + 16·B, D]: here A = r0, B = r1, D = r2.
const three = (opcode: number, r0: bigint, r1: bigint, r2 = 0n) =>
  after([opcode, 0x10, 2], [r0, r1, r2])[2];

test("a 32-bit result is sign-extended to 64 bits", () => {
  const add32: bigint = three(190, 0x7fffffffn, 1n); // add_32
  assert.equal(add32, 0xffffffff80000000n);
});

test("dividing by zero gives all ones; −2^63 ÷ −1 keeps −2^63", () => {
  const byZero: bigint = three(203, 5n, 0n); // div_u_64
  assert.equal(byZero, MAX);
  const overflow: bigint = three(204, 2n ** 63n, MAX); // div_s_64
  assert.equal(overflow, 2n ** 63n);
});

test("signed division rounds towards zero; the remainder keeps the dividend's sign", () => {
  const quotient: bigint = three(204, neg(7n), 2n); // −7 ÷ 2 = −3
  assert.equal(quotient, neg(3n));
  const remainder: bigint = three(206, neg(7n), 2n); // rem_s_64: −7 rem 2 = −1
  assert.equal(remainder, neg(1n));
  const positiveRemainder: bigint = three(206, 7n, neg(3n)); // 7 rem −3 = 1
  assert.equal(positiveRemainder, 1n);
});

test("shifts: arithmetic keeps the sign, logical doesn't", () => {
  const arithmetic: bigint = three(209, neg(8n), 1n); // shar_r_64
  assert.equal(arithmetic, neg(4n));
  const logical: bigint = three(208, 2n ** 63n, 63n); // shlo_r_64
  assert.equal(logical, 1n);
});

test("rotations carry the bits round", () => {
  const rotatedRight: bigint = three(222, 1n, 1n); // rot_r_64: bit 0 to bit 63
  assert.equal(rotatedRight, 2n ** 63n);
  const rotatedLeft: bigint = three(221, 0x80000000n, 1n); // rot_l_32: bit 31 to bit 0
  assert.equal(rotatedLeft, 1n);
});

test("immediate forms: φ_B with ν_X, and the alt forms the other way round", () => {
  // [opcode, A + 16·B, ν_X]: A = r2 gets the result, B = r1 holds 4, ν_X = 3
  const shifted: bigint = after([138, 0x12, 3], [0n, 4n])[2]; // shlo_l_imm_32: 4 << 3
  assert.equal(shifted, 32n);
  const shiftedAlt: bigint = after([144, 0x12, 3], [0n, 4n])[2]; // shlo_l_imm_alt_32: 3 << 4
  assert.equal(shiftedAlt, 48n);
});

test("cmov: move only if the condition register is zero (iz) or not (nz)", () => {
  const moved: bigint = three(218, 9n, 0n, 5n); // cmov_iz: r1 = 0, so r2 = r0
  assert.equal(moved, 9n);
  const stayed: bigint = three(218, 9n, 1n, 5n); // r1 ≠ 0, so r2 stays
  assert.equal(stayed, 5n);
  const movedImm: bigint = after([147, 0x12, 7], [0n, 0n, 5n])[2]; // cmov_iz_imm: r2 = 7
  assert.equal(movedImm, 7n);
});

test("the upper half of a product, and min/max signed or not", () => {
  const upper: bigint = three(214, MAX, MAX); // mul_upper_u_u: (2^64 − 1)² >> 64
  assert.equal(upper, MAX - 1n);
  const signedMax: bigint = three(227, MAX, 1n); // max: −1 < 1
  assert.equal(signedMax, 1n);
  const unsignedMax: bigint = three(228, MAX, 1n); // max_u: 2^64 − 1 > 1
  assert.equal(unsignedMax, MAX);
});

test("every arithmetic instruction in the GP's tables has an operation: 72 of them", () => {
  let covered = 0;
  for (let opcode = 0; opcode < 256; opcode++) {
    const info = opcodeInfo(opcode);
    const arithmetic = (opcode >= 131 && opcode <= 161) || opcode >= 190; // not loads or stores
    if (!info || !arithmetic) continue;
    const operation = OPERATIONS[operationOf(info.name).operation];
    assert.ok(operation, info.name);
    covered++;
  }
  assert.equal(covered, 72); // 31 with an immediate, 41 with three registers
});
```

Each test runs one instruction and looks at r2. The last test is the safety net: it
walks all 72 arithmetic opcodes of [lesson 15.2](./02-instructions.md)'s table and checks each has an
operation, so none can be forgotten.

## The code

**New file** `src/pvm/arithmetic.ts`

```ts
// Arithmetic and logic (GP App. A.5): every instruction that takes two numbers and makes a
// third, in 32 and 64 bits. One line each, straight from the GP's tables.

import { signed, signExtend } from "./instructions.ts";

const M32 = 2n ** 32n;
const M64 = 2n ** 64n;

/** x mod n, always from 0 to n − 1 (bigint's % keeps the sign of x). */
const mod = (x: bigint, n: bigint) => ((x % n) + n) % n;
/** A 32-bit result, sign-extended to 64 bits (GP's X₄). */
const ext32 = (x: bigint) => signExtend(4, mod(x, M32));
/** A register's low 32 bits, read as signed (Z₄), and the whole register (Z₈). */
const s32 = (x: bigint) => signed(4, mod(x, M32));
const s64 = (x: bigint) => signed(8, x);
/** A signed number back into 64 bits (Z₈⁻¹). */
const u64 = (x: bigint) => mod(x, M64);
const bool = (b: boolean) => (b ? 1n : 0n);
/** Rotations: x's bits moved k places round a word of n bits. */
const rotateRight = (x: bigint, k: bigint, n: bigint) =>
  mod((x >> k) | (x << (n - k)), 2n ** n);

/**
 * Each operation, by its three-register name: p and q are its two inputs (φ_A and φ_B,
 * or φ_B and ν_X for the immediate forms), and `old` the register being written.
 */
export const OPERATIONS: Record<string, (p: bigint, q: bigint, old: bigint) => bigint> = {
  add_32: (p, q) => ext32(p + q),
  sub_32: (p, q) => ext32(p + M32 - mod(q, M32)),
  mul_32: (p, q) => ext32(p * q),
  div_u_32: (p, q) => (mod(q, M32) === 0n ? M64 - 1n : ext32(mod(p, M32) / mod(q, M32))),
  div_s_32: (p, q) => {
    const [a, b] = [s32(p), s32(q)];
    if (b === 0n) return M64 - 1n;
    if (a === -(2n ** 31n) && b === -1n) return u64(a); // the one quotient that won't fit
    return u64(a / b); // bigint's / rounds towards zero, like the GP's rtz
  },
  rem_u_32: (p, q) => (mod(q, M32) === 0n ? ext32(p) : ext32(mod(p, M32) % mod(q, M32))),
  rem_s_32: (p, q) => {
    const [a, b] = [s32(p), s32(q)];
    if (a === -(2n ** 31n) && b === -1n) return 0n;
    return u64(b === 0n ? a : a % b); // % keeps a's sign, like the GP's smod
  },
  shlo_l_32: (p, q) => ext32(p << mod(q, 32n)),
  shlo_r_32: (p, q) => ext32(mod(p, M32) >> mod(q, 32n)),
  shar_r_32: (p, q) => u64(s32(p) >> mod(q, 32n)), // >> on a negative rounds down: arithmetic
  neg_add_32: (p, q) => ext32(q + M32 - p),
  rot_l_32: (p, q) => ext32(rotateRight(mod(p, M32), 32n - mod(q, 32n), 32n)),
  rot_r_32: (p, q) => ext32(rotateRight(mod(p, M32), mod(q, 32n), 32n)),
  add_64: (p, q) => mod(p + q, M64),
  sub_64: (p, q) => mod(p - q, M64),
  mul_64: (p, q) => mod(p * q, M64),
  div_u_64: (p, q) => (q === 0n ? M64 - 1n : p / q),
  div_s_64: (p, q) => {
    const [a, b] = [s64(p), s64(q)];
    if (b === 0n) return M64 - 1n;
    if (a === -(2n ** 63n) && b === -1n) return p;
    return u64(a / b);
  },
  rem_u_64: (p, q) => (q === 0n ? p : p % q),
  rem_s_64: (p, q) => {
    const [a, b] = [s64(p), s64(q)];
    if (a === -(2n ** 63n) && b === -1n) return 0n;
    return u64(b === 0n ? a : a % b);
  },
  shlo_l_64: (p, q) => mod(p << mod(q, 64n), M64),
  shlo_r_64: (p, q) => p >> mod(q, 64n),
  shar_r_64: (p, q) => u64(s64(p) >> mod(q, 64n)),
  neg_add_64: (p, q) => mod(q - p, M64),
  rot_l_64: (p, q) => rotateRight(p, 64n - mod(q, 64n), 64n),
  rot_r_64: (p, q) => rotateRight(p, mod(q, 64n), 64n),
  mul_upper_s_s: (p, q) => u64((s64(p) * s64(q)) >> 64n),
  mul_upper_u_u: (p, q) => (p * q) >> 64n,
  mul_upper_s_u: (p, q) => u64((s64(p) * q) >> 64n),
  and: (p, q) => p & q,
  or: (p, q) => p | q,
  xor: (p, q) => p ^ q,
  and_inv: (p, q) => mod(p & ~q, M64),
  or_inv: (p, q) => mod(p | ~q, M64),
  xnor: (p, q) => mod(~(p ^ q), M64),
  set_lt_u: (p, q) => bool(p < q),
  set_lt_s: (p, q) => bool(s64(p) < s64(q)),
  set_gt_u: (p, q) => bool(p > q),
  set_gt_s: (p, q) => bool(s64(p) > s64(q)),
  cmov_iz: (p, q, old) => (q === 0n ? p : old),
  cmov_nz: (p, q, old) => (q !== 0n ? p : old),
  max: (p, q) => u64(s64(p) > s64(q) ? s64(p) : s64(q)),
  max_u: (p, q) => (p > q ? p : q),
  min: (p, q) => u64(s64(p) < s64(q) ? s64(p) : s64(q)),
  min_u: (p, q) => (p < q ? p : q),
};

/**
 * An instruction's operation and the order of its inputs. The immediate forms share the
 * three-register operation: add_imm_64 is add_64, shlo_l_imm_alt_32 is shlo_l_32 with its
 * inputs swapped. cmov…_imm reads that way round too: its immediate is the value moved.
 */
export function operationOf(name: string): { operation: string; swapped: boolean } {
  const operation = name.replace("_imm", "").replace("_alt", "");
  const swapped = name.includes("_alt") || (name.startsWith("cmov") && name.endsWith("_imm"));
  return { operation, swapped };
}
```

Every operation takes p and q plus `old`, the register being written (only `cmov` looks
at it). `bigint` never overflows, so the wrap-around is explicit: `mod` brings a result
back into 64 bits, `ext32` into 32, sign-extended. One trap: bigint's `%` keeps the sign
of its left side, so `-7n % 2n` is `-1n`. Wrong for wrapping, which is why `mod` adds n
and takes `%` again:

```ts
const mod = (x: bigint, n: bigint) => ((x % n) + n) % n;
```

But that sign-keeping `%` is exactly the Gray Paper's smod, so the signed remainders use
it directly:

```ts
  rem_s_64: (p, q) => {
    const [a, b] = [s64(p), s64(q)];
    if (a === -(2n ** 63n) && b === -1n) return 0n;
    return u64(b === 0n ? a : a % b);
  },
```

−7 rem 2 is −1, and `u64` writes it into the register as 2^64 − 1. The line before covers
−2^63 rem −1, whose division would overflow, which the Gray Paper makes 0; a remainder
by 0 is the number itself.

`operationOf` maps the immediate and alt names onto the three-register ones, so one
table serves 72 instructions. `cmov…_imm` is the odd one out: its immediate is the
value moved, not the condition, so it reads the swapped way round.

[Lesson 15.3](./03-the-machine.md)'s `basics` had six of these instructions written out. They move to the new
family now, so `basics` gets shorter:

**Replace in** `src/pvm/machine.ts`

```ts
/** Lesson 15.3's instructions: control flow, and loading and moving values. */
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

/** Every family of instructions built so far. */
const FAMILIES: Family[] = [basics, memoryInstructions, arithmetic];
```

**Add to** `src/pvm/machine.ts`

```ts
import { OPERATIONS, operationOf } from "./arithmetic.ts";

/** Lesson 15.5's instructions: arithmetic and logic, with an immediate or three registers. */
function arithmetic(m: Machine, ins: Instruction): Exit | undefined {
  const { operation, swapped } = operationOf(ins.name);
  const f = OPERATIONS[operation];
  if (!f) return undefined;
  const [a, b, d] = ins.registers;
  const [x] = ins.immediates;
  const reg = m.registers;
  if (ins.layout === "regRegImm") {
    const [p, q] = swapped ? [x, reg[b]] : [reg[b], x]; // φ′_A from φ_B and ν_X
    reg[a] = f(p, q, reg[a]);
  } else {
    reg[d] = f(reg[a], reg[b], reg[d]); // three registers: φ′_D from φ_A and φ_B
  }
  return "continue";
}
```

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ a 32-bit result is sign-extended to 64 bits (2.9ms)
✔ dividing by zero gives all ones; −2^63 ÷ −1 keeps −2^63 (0.3ms)
✔ signed division rounds towards zero; the remainder keeps the dividend's sign (0.2ms)
✔ shifts: arithmetic keeps the sign, logical doesn't (0.1ms)
✔ rotations carry the bits round (0.2ms)
✔ immediate forms: φ_B with ν_X, and the alt forms the other way round (0.1ms)
✔ cmov: move only if the condition register is zero (iz) or not (nz) (0.1ms)
✔ the upper half of a product, and min/max signed or not (0.1ms)
✔ every arithmetic instruction in the GP's tables has an operation: 72 of them (0.4ms)
...
✔ the reported packages: each one's hash and exports root, sorted by hash (211.3ms)
...
ℹ tests 416
ℹ suites 0
ℹ pass 416
ℹ fail 0
...
reported 416 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791736632944
...
```

## Watch it

**New file** `bin/alu.ts`

```ts
// Runs the arithmetic edge cases the Gray Paper spells out, each as one instruction on
// your PVM, and shows the answers in hex and as signed numbers.
// Usage: npm run alu

import { Run } from "../src/obs.ts";
import { decodeInstruction } from "../src/pvm/instructions.ts";
import { newMachine, step } from "../src/pvm/machine.ts";
import { assemble } from "../src/pvm/program.ts";

const neg = (x: bigint) => 2n ** 64n - x; // −x, as 64 unsigned bits
const signed = (x: bigint) => (x >= 2n ** 63n ? x - 2n ** 64n : x);

/** Each case: an instruction [opcode, A + 16·B, D], with r0 and r1; the answer lands in r2. */
const CASES: [number, bigint, bigint, string][] = [
  [190, 0x7fffffffn, 1n, "2^31 − 1 + 1, in 32 bits"],
  [203, 5n, 0n, "5 ÷ 0, unsigned"],
  [204, 2n ** 63n, neg(1n), "−2^63 ÷ −1: too big to fit"],
  [204, neg(7n), 2n, "−7 ÷ 2: towards zero"],
  [206, neg(7n), 2n, "−7 rem 2: the dividend's sign"],
  [209, neg(8n), 1n, "−8 >> 1, arithmetic"],
  [208, neg(8n), 1n, "−8 >> 1, logical"],
  [222, 1n, 1n, "1 rotated right by 1"],
  [214, neg(1n), neg(1n), "(2^64 − 1)², upper 64 bits"],
];

const run = new Run("alu");
for (const [opcode, r0, r1, what] of CASES) {
  const program = assemble([[opcode, 0x10, 2]]);
  const machine = newMachine(program, [r0, r1]);
  step(machine);
  const r2 = machine.registers[2];
  const { name } = decodeInstruction(program, 0);
  const answer = `0x${r2.toString(16).padStart(16, "0")} = ${signed(r2)}`;
  console.log(`${name.padEnd(14)} ${what.padEnd(32)} ${answer}`);
  run.event("case", { name, what, answer });
}
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

**What flows through it.** One run, three faces — a one-instruction program going in,
the bits it leaves in r2, and the line printed. Here is the −7 ÷ 2 case:

::: code-group

```text [what goes in]
nine one-instruction programs, written in bin/alu.ts itself; this one:
  [204, 0x10, 2]   div_s_64 r2 = r0 ÷ r1
  r0 = 2^64 − 7 (−7, as unsigned bits)   r1 = 2
```

```ts [what it computes]
// the −7 ÷ 2 case, after its one step
const computed = {
  name: "div_s_64", // opcode 204, decoded back for the printout
  r2: 0xfffffffffffffffdn, // the raw 64 bits the division left
  signed: -3n, // the same bits read signed: towards zero, not −4
};
```

```text [what comes out]
div_s_64       −7 ÷ 2: towards zero             0xfffffffffffffffd = -3
```

:::

Read the input into the output: the operand byte `0x10` packs the sources, r0 and r1,
and the `2` names the destination, r2. One `step` runs the division; the program prints
r2 twice, as raw bits and as a signed number, which is the whole lesson of this table —
same bits, two readings.

**Run**

```sh
npm pkg set scripts.alu="node bin/alu.ts"
npm run alu
```

```text
add_32         2^31 − 1 + 1, in 32 bits         0xffffffff80000000 = -2147483648
div_u_64       5 ÷ 0, unsigned                  0xffffffffffffffff = -1
div_s_64       −2^63 ÷ −1: too big to fit       0x8000000000000000 = -9223372036854775808
div_s_64       −7 ÷ 2: towards zero             0xfffffffffffffffd = -3
rem_s_64       −7 rem 2: the dividend's sign    0xffffffffffffffff = -1
shar_r_64      −8 >> 1, arithmetic              0xfffffffffffffffc = -4
shlo_r_64      −8 >> 1, logical                 0x7ffffffffffffffc = 9223372036854775804
rot_r_64       1 rotated right by 1             0x8000000000000000 = -9223372036854775808
mul_upper_u_u  (2^64 − 1)², upper 64 bits       0xfffffffffffffffe = -2
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=alu-1791736638573
```

Every corner from the list, worked by your PVM and shown twice, as raw bits and signed.
Compare the two `−8 >> 1` lines: the same bits in, `-4` out of the arithmetic shift, a
huge positive number out of the logical one. The *ALU* panel has the table.

![ALU panel](./images/05-alu.png)

<details>
<summary>lasair: signed division, in <code>lib/pvm.ml</code></summary>

```ocaml
         | Div_s_64 { rd; ra; rb } ->
           let a = rget r ra and b = rget r rb in
           rset r rd (if b = 0L then (-1L)
                      else if a = Int64.min_int && b = (-1L) then a
                      else Int64.div a b);
```

The same three cases as your `div_s_64`. OCaml's `Int64` is signed and wraps on its own,
so lasair spells out the unsigned operations with `Int64.unsigned_div` and friends;
`bigint` never wraps, so your code says where, with `mod`. Each language makes one half
of the job free.

</details>

## Check your understanding

::: check
**`add_32` of 2^31 − 1 and 1. What lands in the register?**

- [ ] 0x0000000080000000, 2^31
  > No: those are the right low 32 bits, but a 32-bit result is sign-extended to 64. Its
  > top bit is 1, so the upper half fills with `ff`.
- [x] 0xffffffff80000000, −2^31
  > Yes: the low 32 bits are `80000000`, negative as a signed 32-bit number, so the 32
  > bits above become `ffffffff`.
- [ ] 0, because the sum overflowed 32 bits
  > No: 2^31 still fits in 32 bits; it only reaches the sign bit. Wrapping to 0 takes
  > 2^32.

**`add_64` of 2^64 − 1 and 2?**

- [ ] 2^64 + 1
  > No: a register holds 64 bits, and 2^64 + 1 needs 65.
- [ ] A panic: the sum overflowed
  > No: overflow is never an error on the PVM. Everything is modulo 2^64.
- [x] 1
  > Yes: 2^64 + 1, modulo 2^64, is 1. The count rolls over like a car's odometer.

**`div_u_64` divides 5 by 0. What happens?**

- [x] The answer is 2^64 − 1, all ones, and the program carries on
  > Yes: the Gray Paper gives division by zero an answer instead of a crash. The
  > remainder by 0, `rem_u_64`, gives back the 5.
- [ ] The machine panics
  > No: no arithmetic instruction panics. Division by zero has its answer in the table.
- [ ] The answer is 0
  > No: the Gray Paper picks all ones, 0xffffffffffffffff, not 0.

**`div_s_64` of −7 and 2?**

- [ ] −4
  > No: that rounds down. Signed division rounds towards zero.
- [x] −3, and the remainder, `rem_s_64`, is −1
  > Yes: −3.5 towards zero is −3, and the remainder keeps the dividend's sign:
  > −7 = 2 × (−3) + (−1).
- [ ] A huge positive number, since −7 is 2^64 − 7 in the register
  > No: that's how `div_u_64` reads it. The `_s` reads both inputs as signed first.
:::

## What you have

All 72 arithmetic and logic instructions, every corner of the Gray Paper's tables tested.
[Lesson 15.6](./06-branches-and-calls.md) adds the rest of the branches, and calls.

Next: [15.6 Branches and calls](./06-branches-and-calls.md)
