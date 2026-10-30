# Bits and bytes

Most instructions do sums. These ten *look* at a number instead: how many 1s does it
have? How many 0s sit above its highest 1? What are its bytes back to front? A program
that juggles bitmaps or reads big-endian data needs them. After this lesson your machine
runs every instruction in the Gray Paper but one.

## What the Gray Paper says

Appendix A.5, the instructions with two registers (101 to 110). Each one makes φ′_D from
φ_A alone, and the byte after the opcode is D + 16·A.

- **`count_set_bits`**: how many bits are 1.
- **`leading_zero_bits`**: how many 0s come above the highest 1. **`trailing_zero_bits`**:
  how many come below the lowest 1. Zero has no 1 to stop at, so both give 64.
- Each count comes in **64 and 32** bits. The `_32` forms see only the low 32 bits:
  `count_set_bits_32` of all ones is 32, and `trailing_zero_bits_32` of zero is 32.
- **`sign_extend_8`** and **`sign_extend_16`** take the lowest byte or two and read them
  as a signed number (Z, [lesson 15.2](./02-instructions.md)): 0x80 becomes −128. **`zero_extend_16`** keeps the
  lowest two bytes as they are, and clears the rest.
- **`reverse_bytes`** turns the 8 bytes round, first to last. Registers go to memory
  little-endian ([lesson 15.4](./04-memory.md)); plenty of data out in the world is big-endian. One
  instruction flips between them.

The Gray Paper counts with B, which lists a number's bits lowest first, and B with an
arrow over it, the same bits highest first. That second one is how people write numbers,
and it's how your code will too.

Flip bits, or type a number, and tap an instruction to see which bits it looked at:

<BitCounts />

## The tests

**New file** `test/bits.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { BIT_OPERATIONS } from "../src/pvm/bits.ts";
import { opcodeInfo } from "../src/pvm/instructions.ts";
import { newMachine, step } from "../src/pvm/machine.ts";
import { assemble } from "../src/pvm/program.ts";

const MAX = 2n ** 64n - 1n; // all 64 bits set

/** φ′_D after one two-register instruction, [opcode, D + 16·A]: here D = r1, A = r0. */
function one(opcode: number, r0: bigint): bigint {
  const machine = newMachine(assemble([[opcode, 0x01]]), [r0]);
  step(machine);
  return machine.registers[1];
}

test("counting bits: the 1s, the 0s before the first 1, the 0s after the last", () => {
  const setBits: bigint = one(101, 0b1011n); // count_set_bits_64
  assert.equal(setBits, 3n);
  const leadingZeros: bigint = one(103, 1n); // leading_zero_bits_64: 63 zeros, then the 1
  assert.equal(leadingZeros, 63n);
  const trailingZeros: bigint = one(105, 0b1000n); // trailing_zero_bits_64
  assert.equal(trailingZeros, 3n);
});

test("the 32-bit counts see only the low 32 bits, and zero is all zeros", () => {
  const setBits32: bigint = one(102, MAX); // count_set_bits_32
  assert.equal(setBits32, 32n);
  const leadingZeros32: bigint = one(104, 1n); // leading_zero_bits_32
  assert.equal(leadingZeros32, 31n);
  const allZeros: bigint = one(103, 0n); // leading_zero_bits_64: no 1 to stop at
  assert.equal(allZeros, 64n);
  const trailingZeros32: bigint = one(106, 0n); // trailing_zero_bits_32
  assert.equal(trailingZeros32, 32n);
});

test("extending: the lowest byte or two, read as signed or unsigned", () => {
  const signExtended8: bigint = one(107, 0x180n); // sign_extend_8: 0x80 is −128
  assert.equal(signExtended8, MAX - 127n);
  const signExtended16: bigint = one(108, 0x12345n); // sign_extend_16: 0x2345 is positive
  assert.equal(signExtended16, 0x2345n);
  const zeroExtended16: bigint = one(109, MAX); // zero_extend_16
  assert.equal(zeroExtended16, 0xffffn);
});

test("reverse_bytes turns little-endian into big-endian", () => {
  const reversed: bigint = one(110, 0x0102030405060708n);
  assert.equal(reversed, 0x0807060504030201n);
});

test("every two-register instruction after move_reg has an operation: 10 of them", () => {
  for (let opcode = 101; opcode <= 110; opcode++) {
    const { name } = opcodeInfo(opcode)!;
    const operation = BIT_OPERATIONS[name];
    assert.ok(operation, name);
  }
  const beyond = opcodeInfo(111); // and the table ends there
  assert.equal(beyond, undefined);
});
```

## The code

**New file** `src/pvm/bits.ts`

```ts
// Bits and bytes (GP App. A.5, two registers): instructions that count a register's bits,
// widen its lowest bytes, or turn it back to front. Each makes φ′_D from φ_A alone.

import { decodeFixed, encodeFixed } from "../codec/numbers.ts";
import { signExtend } from "./instructions.ts";

/** x's lowest n bits as a string of 0s and 1s, the highest first (the GP's B, reversed). */
const bits = (x: bigint, n: number) => BigInt.asUintN(n, x).toString(2).padStart(n, "0");
/** How many 1s there are, how many 0s come before the first 1, and how many after the last. */
const ones = (s: string) => BigInt(s.replaceAll("0", "").length);
const leadingZeros = (s: string) => BigInt(/^0*/.exec(s)![0].length);
const trailingZeros = (s: string) => BigInt(/0*$/.exec(s)![0].length);

/** Each instruction's operation, by name: x is φ_A, and the answer goes to φ′_D. */
export const BIT_OPERATIONS: Record<string, (x: bigint) => bigint> = {
  count_set_bits_64: (x) => ones(bits(x, 64)),
  count_set_bits_32: (x) => ones(bits(x, 32)),
  leading_zero_bits_64: (x) => leadingZeros(bits(x, 64)),
  leading_zero_bits_32: (x) => leadingZeros(bits(x, 32)),
  trailing_zero_bits_64: (x) => trailingZeros(bits(x, 64)),
  trailing_zero_bits_32: (x) => trailingZeros(bits(x, 32)),
  sign_extend_8: (x) => signExtend(1, BigInt.asUintN(8, x)),
  sign_extend_16: (x) => signExtend(2, BigInt.asUintN(16, x)),
  zero_extend_16: (x) => BigInt.asUintN(16, x),
  reverse_bytes: (x) => decodeFixed(encodeFixed(x, 8).reverse()), // ℰ₈, back to front
};
```

The trick: turn the number into a *string*. `toString(2)` writes a bigint in binary, and
`padStart` fills in the zeros above its highest 1, so `bits(5n, 8)` is `"00000101"`.
(`BigInt.asUintN(n, x)` keeps x's lowest n bits, x mod 2^n.) Counting is now string work:
drop the 0s and count what's left, or let `/^0*/` match the run of 0s at the start and
`/0*$/` the run at the end. Zero needs no special case: its string is all 0s, so both runs
are the whole thing.

`reverse_bytes` is the Gray Paper's own definition, almost word for word: encode in 8
bytes (ℰ₈, from [lesson 2.1](../02-codec/01-fixed-width-integers.md)), reverse them, decode.

A family to run them, and a place in the line-up:

**Add to** `src/pvm/machine.ts`

```ts
import { BIT_OPERATIONS } from "./bits.ts";

/** Lesson 15.7's instructions: φ′_D from φ_A alone, by counting, widening or reversing. */
function bitsAndBytes(m: Machine, ins: Instruction): Exit | undefined {
  const f = BIT_OPERATIONS[ins.name];
  if (!f) return undefined;
  const [d, a] = ins.registers; // two registers: [D, A]
  m.registers[d] = f(m.registers[a]);
  return "continue";
}
```

**Replace in** `src/pvm/machine.ts`

```ts
/** Every family of instructions built so far. */
const FAMILIES: Family[] = [basics, memoryInstructions, arithmetic, decisions, bitsAndBytes];
```

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ counting bits: the 1s, the 0s before the first 1, the 0s after the last (1.2ms)
✔ the 32-bit counts see only the low 32 bits, and zero is all zeros (0.2ms)
✔ extending: the lowest byte or two, read as signed or unsigned (0.2ms)
✔ reverse_bytes turns little-endian into big-endian (0.1ms)
✔ every two-register instruction after move_reg has an operation: 10 of them (0.1ms)
...
✔ the reported packages: each one's hash and exports root, sorted by hash (266.6ms)
...
ℹ tests 427
ℹ suites 0
ℹ pass 427
ℹ fail 0
...
reported 427 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791736873566
...
```

## Watch it

**New file** `bin/bits.ts`

```ts
// Runs the ten bit-and-byte instructions on one number, on your PVM, and shows its bits and
// every answer.
// Usage: npm run bits [number], e.g. npm run bits 0xdeadbeef (0x1f0 if not given)

import { Run } from "../src/obs.ts";
import { opcodeInfo, signed } from "../src/pvm/instructions.ts";
import { newMachine, step } from "../src/pvm/machine.ts";
import { assemble } from "../src/pvm/program.ts";

const x = BigInt.asUintN(64, BigInt(process.argv[2] ?? "0x1f0")); // as 64 unsigned bits
const hex = (v: bigint) => `0x${v.toString(16).padStart(16, "0")}`;

const run = new Run("bits");
console.log(`r0 = ${hex(x)}, in bits:`);
console.log(x.toString(2).padStart(64, "0"));
for (let opcode = 101; opcode <= 110; opcode++) {
  const { name } = opcodeInfo(opcode)!;
  const machine = newMachine(assemble([[opcode, 0x01]]), [x]); // r1 = the answer, from r0
  step(machine);
  const answer = `${hex(machine.registers[1])} = ${signed(8, machine.registers[1])}`;
  console.log(`${name.padEnd(22)} ${answer}`);
  run.event("bits", { name, x: hex(x), answer });
}
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

**What flows through it.** One run, three faces — one number going in, one
instruction's answer, and the lines printed. Tab across them:

::: code-group

```text [what goes in]
one number, 0x1f0 (496): five 1 bits with four 0s below them
  0000…000111110000 as 64 bits, preset into r0
ten one-instruction programs, opcodes 101 to 110, each writing r1 from r0
```

```ts [what it computes]
// the sign_extend_8 case: only r0's lowest byte matters
const computed = {
  lowByte: 0xf0, // 240 unsigned — but the top bit of the byte is set
  r1: 0xfffffffffffffff0n, // that bit copied up through all 64
  signed: -16n, // the same byte read signed
};
```

```text [what comes out]
sign_extend_8          0xfffffffffffffff0 = -16
```

:::

Read the input into the output: every program starts from the same r0 and runs one
`step`; only the opcode differs. `sign_extend_8` looks at nothing but the lowest byte,
`0xf0`, sees its top bit set, and copies that bit up through all 64 — the whole
register becomes −16, however big r0 was.

**Run**

```sh
npm pkg set scripts.bits="node bin/bits.ts"
npm run bits
```

```text
r0 = 0x00000000000001f0, in bits:
0000000000000000000000000000000000000000000000000000000111110000
count_set_bits_64      0x0000000000000005 = 5
count_set_bits_32      0x0000000000000005 = 5
leading_zero_bits_64   0x0000000000000037 = 55
leading_zero_bits_32   0x0000000000000017 = 23
trailing_zero_bits_64  0x0000000000000004 = 4
trailing_zero_bits_32  0x0000000000000004 = 4
sign_extend_8          0xfffffffffffffff0 = -16
sign_extend_16         0x00000000000001f0 = 496
zero_extend_16         0x00000000000001f0 = 496
reverse_bytes          0xf001000000000000 = -1152640029630136320
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=bits-1791736879612
```

0x1f0 is five 1s with four 0s below them: count each answer off the bits at the top. Its
lowest byte, 0xf0, is 240 unsigned and −16 signed, and `sign_extend_8` reads it signed.
`reverse_bytes` moves that 0xf0 from the bottom of the register to the top. Try
`npm run bits 0xdeadbeef` and `npm run bits -1`. The *Bits* panel, on **6 · The PVM**,
keeps every run.

![Bits panel](./images/07-bits.png)

<details>
<summary>lasair: <code>clz64</code>, in <code>lib/pvm.ml</code></summary>

```ocaml
let clz64 (x : int64) : int =
  if x = 0L then 64
  else
    let rec count n i =
      if i < 0 then n
      else if Int64.(logand (shift_right_logical x i) 1L) <> 0L then 64 - i - 1
      else count n (i - 1)
    in
    count 0 63
```

`leading_zero_bits_64`, the classic way: test the bits one at a time from the top, with
shifts and masks, and treat zero on its own. Your string version takes the same walk
with no shifts, no masks and no special case.

</details>

## Check your understanding

::: check
**`leading_zero_bits_64` of 0x1f0 is 55. Why is `leading_zero_bits_32` 23?**

- [x] The `_32` form sees only the low 32 bits: 32 − 9 = 23
  > Yes: 0x1f0's highest 1 is bit 8, so 9 bits are in use. 64 − 9 = 55, and 32 − 9 = 23.
- [ ] It counts the zeros at the bottom instead
  > No: that's `trailing_zero_bits`, 4 here. Both `leading` forms count the zeros above
  > the highest 1.
- [ ] 55 doesn't fit in 32 bits, so it wraps
  > No: 55 fits with room to spare. The upper 32 bits, all zeros, simply aren't looked at.

**`sign_extend_8` of 0x1f0?**

- [ ] 496
  > No: that's the whole value, 0x1f0. `sign_extend_8` takes only the lowest byte.
- [ ] 240
  > No: that's the lowest byte, 0xf0, read unsigned. `sign_extend_8` reads it signed.
- [x] −16
  > Yes: 0xf0's top bit is 1, so signed it's 240 − 256 = −16, written into the register
  > as 0xfffffffffffffff0.

**`trailing_zero_bits_64` of 0?**

- [ ] 0
  > No: 0 would mean bit 0 is a 1. Zero has no 1 anywhere.
- [x] 64
  > Yes: there's no 1 to stop at, so every bit counts: 64, or 32 for the `_32` form.
- [ ] A panic: there's no lowest 1 to find
  > No: the count is defined for zero. Your code needs no special case for it either: its
  > string of bits is all 0s.

**`reverse_bytes` of 0x0102030405060708?**

- [ ] 0x8070605040302010
  > No: that reverses the hex digits, which swaps the halves of each byte too. Bytes move
  > whole.
- [x] 0x0807060504030201
  > Yes: the 8 bytes turned round, first to last, each byte unchanged.
- [ ] 0x10e060a020c04080
  > No: that reverses all 64 bits. `reverse_bytes` moves bytes, so `08` stays `08`.
:::

## What you have

Every instruction in the Gray Paper's tables, bar one: `ecalli`, the door out of the
machine to the host. [Lesson 15.8](./08-a-real-program.md) builds it, and runs a real service up to its first
`ecalli`.

Next: [15.8 A real program](./08-a-real-program.md)
