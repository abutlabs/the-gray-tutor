# Instructions

[Lesson 15.1](./01-the-program-blob.md) found 39,849 instructions in a real service's code, as opcode numbers.
Now your client *reads* each one: its name and its arguments, which registers it uses,
which numbers it carries, where it jumps. That's a disassembler, and by the end you're
reading real JAM service code the way a computer does.

## What the Gray Paper says

Appendix A.5 (*Instruction Tables*). 139 instructions, in 13 groups. Each group shares
one **layout**, the way its arguments sit in the bytes after the opcode:

| Layout | Opcodes | Arguments |
| --- | --- | --- |
| no arguments | 0 to 2 | `trap`, `fallthrough`, `unlikely` |
| one immediate | 10 | `ecalli`, a host call ([Part 16](../16-host-calls/index.md)) |
| register, 8-byte immediate | 20 | `load_imm_64` |
| two immediates | 30 to 33 | `store_imm_…` |
| one offset | 40 | `jump` |
| register, immediate | 50 to 62 | `jump_ind`, `load_imm`, loads, stores |
| register, two immediates | 70 to 73 | `store_imm_ind_…` |
| register, immediate, offset | 80 to 90 | `load_imm_jump`, `branch_…_imm` |
| two registers | 100 to 110 | `move_reg`, bit counts, extensions |
| two registers, immediate | 120 to 161 | indirect loads and stores, arithmetic with a constant |
| two registers, offset | 170 to 175 | `branch_eq` and friends |
| two registers, two immediates | 180 | `load_imm_jump_ind` |
| three registers | 190 to 230 | arithmetic, logic, comparisons |

The rules for reading them, in brief:

- **Registers** are four bits each: the byte after the opcode holds one in its low half
  and one in its high half. There are 13 registers, so a number over 12 counts as 12.
- **Immediates** are little-endian, 0 to 4 bytes long, and **sign-extended** to 64 bits
  (X): if their top bit is set, they're negative, and the missing high bytes fill with
  `ff`. Their length isn't written down: it's whatever the instruction's bytes leave,
  which is why [lesson 15.1](./01-the-program-blob.md)'s bitmask matters.
- **skip(ı)** is the distance from an opcode to the next one, minus one, never over 24.
  An instruction ends where the next begins.
- **Offsets** are signed (Z) and relative: the target is ı plus the offset, so a jump
  back is a negative number.

<DecodeInstruction />

## The tests

**New file** `test/instructions.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { decodeInstruction, signed, signExtend } from "../src/pvm/instructions.ts";
import type { Program } from "../src/pvm/program.ts";
import { deblob, startsInstruction, unpackCode } from "../src/pvm/program.ts";
import { bootstrapCode } from "./vectors.ts";
import type { Instruction } from "../src/pvm/instructions.ts";

test("immediates: sign-extended to 64 bits, or read as signed", () => {
  const small: bigint = signExtend(1, 0x7fn);
  assert.equal(small, 0x7fn);
  const minusOne: bigint = signExtend(1, 0xffn);
  assert.equal(minusOne, 2n ** 64n - 1n); // −1, as 64 unsigned bits
  const twoBytes: bigint = signExtend(2, 0x8000n);
  assert.equal(twoBytes, 0xffffffffffff8000n);
  const minusThree: bigint = signed(1, 0xfdn);
  assert.equal(minusThree, -3n);
});

test("three instructions by hand: load_imm, add_64, and a jump back", () => {
  // load_imm r1, −1 | add_64 r3 = r1 + r2 | jump back 3 bytes | trap
  const code = Uint8Array.from([51, 0x01, 0xff, 200, 0x21, 0x03, 40, 0xfd, 0]);
  const program: Program = { jumpTable: [], code, bitmask: Uint8Array.from([0x49, 0x01]) };
  const loadImm: Instruction = decodeInstruction(program, 0); // they start at 0, 3, 6 and 8
  assert.deepEqual([loadImm.name, loadImm.registers, loadImm.immediates], [
    "load_imm",
    [1],
    [2n ** 64n - 1n],
  ]);
  const add: Instruction = decodeInstruction(program, 3);
  assert.deepEqual([add.name, add.registers, add.next], ["add_64", [1, 2, 3], 6]);
  const jump: Instruction = decodeInstruction(program, 6);
  assert.deepEqual([jump.name, jump.target], ["jump", 3]); // 6 + (−3)
});

test("the bootstrap service: 39,849 instructions, all known, every jump on target", () => {
  const program: Program = deblob(unpackCode(bootstrapCode()).program);
  let instructions = 0;
  let targets = 0;
  for (let i = 0; i < program.code.length; i = decodeInstruction(program, i).next) {
    const instruction: Instruction = decodeInstruction(program, i);
    instructions++;
    if (instruction.target === undefined) continue;
    const lands: boolean = startsInstruction(program, instruction.target);
    assert.ok(lands, `${instruction.name} at ${i}`);
    targets++;
  }
  assert.deepEqual([instructions, targets], [39849, 4767]);
});
```

The second test is a three-instruction program you could write on a napkin. The third
walks the whole real program by `next`, decoding every instruction, and checks every
jump and branch: 4,767 of them, each landing exactly on the start of an instruction.
Get the sign of an offset wrong, or its length, and they'd land in the middle of one.

## The code

The opcode table is long, and its names are the Gray Paper's own.

**New file** `src/pvm/instructions.ts`

```ts
// Instructions (GP App. A): reading one instruction out of the code, its opcode and its
// arguments. What each one *does* comes in the following lessons.

import type { Program } from "./program.ts";
import { startsInstruction } from "./program.ts";

/** How an instruction's arguments are laid out after its opcode: 13 ways (GP App. A.5). */
export type Layout =
  | "none" // trap, fallthrough
  | "imm" // one immediate
  | "regExtImm" // a register and an 8-byte immediate
  | "immImm" // two immediates
  | "offset" // one jump offset
  | "regImm" // a register and an immediate
  | "regImmImm" // a register and two immediates
  | "regImmOffset" // a register, an immediate and an offset
  | "regReg" // two registers
  | "regRegImm" // two registers and an immediate
  | "regRegOffset" // two registers and an offset
  | "regRegImmImm" // two registers and two immediates
  | "regRegReg"; // three registers

/** Each layout's opcodes, which run consecutively from `first`, by their GP names. */
const LAYOUTS: { layout: Layout; first: number; names: string[] }[] = [
  { layout: "none", first: 0, names: ["trap", "fallthrough", "unlikely"] },
  { layout: "imm", first: 10, names: ["ecalli"] },
  { layout: "regExtImm", first: 20, names: ["load_imm_64"] },
  {
    layout: "immImm",
    first: 30,
    names: [
      "store_imm_u8", "store_imm_u16", "store_imm_u32", "store_imm_u64"
    ],
  },
  { layout: "offset", first: 40, names: ["jump"] },
  {
    layout: "regImm",
    first: 50,
    names: [
      "jump_ind", "load_imm", "load_u8", "load_i8", "load_u16", "load_i16", "load_u32",
      "load_i32", "load_u64", "store_u8", "store_u16", "store_u32", "store_u64"
    ],
  },
  {
    layout: "regImmImm",
    first: 70,
    names: [
      "store_imm_ind_u8", "store_imm_ind_u16", "store_imm_ind_u32", "store_imm_ind_u64"
    ],
  },
  {
    layout: "regImmOffset",
    first: 80,
    names: [
      "load_imm_jump", "branch_eq_imm", "branch_ne_imm", "branch_lt_u_imm", "branch_le_u_imm",
      "branch_ge_u_imm", "branch_gt_u_imm", "branch_lt_s_imm", "branch_le_s_imm",
      "branch_ge_s_imm", "branch_gt_s_imm"
    ],
  },
  {
    layout: "regReg",
    first: 100,
    names: [
      "move_reg", "count_set_bits_64", "count_set_bits_32", "leading_zero_bits_64",
      "leading_zero_bits_32", "trailing_zero_bits_64", "trailing_zero_bits_32", "sign_extend_8",
      "sign_extend_16", "zero_extend_16", "reverse_bytes"
    ],
  },
  {
    layout: "regRegImm",
    first: 120,
    names: [
      "store_ind_u8", "store_ind_u16", "store_ind_u32", "store_ind_u64", "load_ind_u8",
      "load_ind_i8", "load_ind_u16", "load_ind_i16", "load_ind_u32", "load_ind_i32",
      "load_ind_u64", "add_imm_32", "and_imm", "xor_imm", "or_imm", "mul_imm_32",
      "set_lt_u_imm", "set_lt_s_imm", "shlo_l_imm_32", "shlo_r_imm_32", "shar_r_imm_32",
      "neg_add_imm_32", "set_gt_u_imm", "set_gt_s_imm", "shlo_l_imm_alt_32",
      "shlo_r_imm_alt_32", "shar_r_imm_alt_32", "cmov_iz_imm", "cmov_nz_imm", "add_imm_64",
      "mul_imm_64", "shlo_l_imm_64", "shlo_r_imm_64", "shar_r_imm_64", "neg_add_imm_64",
      "shlo_l_imm_alt_64", "shlo_r_imm_alt_64", "shar_r_imm_alt_64", "rot_r_64_imm",
      "rot_r_64_imm_alt", "rot_r_32_imm", "rot_r_32_imm_alt"
    ],
  },
  {
    layout: "regRegOffset",
    first: 170,
    names: [
      "branch_eq", "branch_ne", "branch_lt_u", "branch_lt_s", "branch_ge_u", "branch_ge_s"
    ],
  },
  { layout: "regRegImmImm", first: 180, names: ["load_imm_jump_ind"] },
  {
    layout: "regRegReg",
    first: 190,
    names: [
      "add_32", "sub_32", "mul_32", "div_u_32", "div_s_32", "rem_u_32", "rem_s_32", "shlo_l_32",
      "shlo_r_32", "shar_r_32", "add_64", "sub_64", "mul_64", "div_u_64", "div_s_64",
      "rem_u_64", "rem_s_64", "shlo_l_64", "shlo_r_64", "shar_r_64", "and", "xor", "or",
      "mul_upper_s_s", "mul_upper_u_u", "mul_upper_s_u", "set_lt_u", "set_lt_s", "cmov_iz",
      "cmov_nz", "rot_l_64", "rot_l_32", "rot_r_64", "rot_r_32", "and_inv", "or_inv", "xnor",
      "max", "max_u", "min", "min_u"
    ],
  },
];

/** An opcode's name and layout, or undefined for a byte that isn't an opcode. */
export function opcodeInfo(opcode: number): { name: string; layout: Layout } | undefined {
  for (const { layout, first, names } of LAYOUTS) {
    const name = names[opcode - first];
    if (name !== undefined) return { name, layout };
  }
  return undefined;
}

/** skip(i) (GP App. A): how many bytes after the opcode at i until the next opcode, at most 24. */
export function skip(program: Program, i: number): number {
  let j = 0;
  while (j < 24 && i + 1 + j < program.code.length && !startsInstruction(program, i + 1 + j)) j++;
  return j;
}

/** n bytes of code from i, little-endian; past the end, the code reads as zeros (GP's ζ). */
function readLE(program: Program, i: number, n: number): bigint {
  let value = 0n;
  for (let k = n - 1; k >= 0; k--) value = (value << 8n) | BigInt(program.code[i + k] ?? 0);
  return value;
}

/** X_n (GP App. A): an n-byte value sign-extended to 64 bits, as an unsigned number. */
export function signExtend(n: number, x: bigint): bigint {
  if (n === 0) return 0n;
  const negative = x >> BigInt(8 * n - 1) === 1n; // the top bit of the n bytes
  return negative ? x + (2n ** 64n - 2n ** BigInt(8 * n)) : x;
}

/** Z_n (GP App. A): an n-byte value read as a signed number. */
export function signed(n: number, x: bigint): bigint {
  if (n === 0) return 0n;
  return x < 2n ** BigInt(8 * n - 1) ? x : x - 2n ** BigInt(8 * n);
}

/** One decoded instruction: what it is, and its arguments in the order the GP names them. */
export type Instruction = {
  at: number; // ı: where its opcode is
  opcode: number;
  name: string;
  layout: Layout;
  registers: number[]; // register numbers, 0 to 12
  immediates: bigint[]; // sign-extended to 64 bits
  target?: number; // where an offset points: ı plus the signed offset
  next: number; // where the next instruction starts: ı + 1 + skip(ı)
};

/** Decodes the instruction at i (GP App. A.5): its opcode, then its layout's arguments. */
export function decodeInstruction(program: Program, i: number): Instruction {
  const opcode = program.code[i];
  const info = opcodeInfo(opcode);
  if (!info) throw new Error(`no instruction has opcode ${opcode}`);
  const l = skip(program, i);
  const byte = (k: number) => program.code[i + k] ?? 0;
  const low = Math.min(12, byte(1) % 16); // a register number in the low four bits
  const high = Math.min(12, Math.floor(byte(1) / 16)); // and another in the high four
  const imm = (at: number, n: number) => signExtend(n, readLE(program, i + at, n));
  const offset = (at: number, n: number) => i + Number(signed(n, readLE(program, i + at, n)));
  const next = i + 1 + l; // ı + 1 + skip(ı)
  const result: Instruction = { at: i, opcode, ...info, registers: [], immediates: [], next };
  switch (info.layout) {
    case "none":
      break;
    case "imm":
      result.immediates = [imm(1, Math.min(4, l))];
      break;
    case "regExtImm":
      result.registers = [low];
      result.immediates = [readLE(program, i + 2, 8)];
      break;
    case "immImm": {
      const lX = Math.min(4, byte(1) % 8);
      const lY = Math.min(4, Math.max(0, l - lX - 1));
      result.immediates = [imm(2, lX), imm(2 + lX, lY)];
      break;
    }
    case "offset":
      result.target = offset(1, Math.min(4, l));
      break;
    case "regImm":
      result.registers = [low];
      result.immediates = [imm(2, Math.min(4, Math.max(0, l - 1)))];
      break;
    case "regImmImm":
    case "regImmOffset": {
      const lX = Math.min(4, Math.floor(byte(1) / 16) % 8);
      const lY = Math.min(4, Math.max(0, l - lX - 1));
      result.registers = [low];
      result.immediates = [imm(2, lX)];
      if (info.layout === "regImmImm") result.immediates.push(imm(2 + lX, lY));
      else result.target = offset(2 + lX, lY);
      break;
    }
    case "regReg":
      result.registers = [low, high]; // r_D, then r_A
      break;
    case "regRegImm":
      result.registers = [low, high];
      result.immediates = [imm(2, Math.min(4, Math.max(0, l - 1)))];
      break;
    case "regRegOffset":
      result.registers = [low, high];
      result.target = offset(2, Math.min(4, Math.max(0, l - 1)));
      break;
    case "regRegImmImm": {
      const lX = Math.min(4, byte(2) % 8);
      const lY = Math.min(4, Math.max(0, l - lX - 2));
      result.registers = [low, high];
      result.immediates = [imm(3, lX), imm(3 + lX, lY)];
      break;
    }
    case "regRegReg":
      result.registers = [low, high, Math.min(12, byte(2))]; // r_A, r_B, r_D
      break;
  }
  return result;
}
```

`decodeInstruction` is one big `switch` over the layouts, each case a line of the Gray
Paper. `low` and `high` are the two register halves of byte ı + 1. `imm` reads and
sign-extends, `offset` reads, makes signed and adds ı. Reading past the end of the code
gives zeros (`?? 0`), just like the Gray Paper's ζ, which pads the code with zeros
forever.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ the reported packages: each one's hash and exports root, sorted by hash (226.5ms)
...
✔ immediates: sign-extended to 64 bits, or read as signed (0.5ms)
✔ three instructions by hand: load_imm, add_64, and a jump back (0.7ms)
✔ the bootstrap service: 39,849 instructions, all known, every jump on target (84.8ms)
...
ℹ tests 401
ℹ suites 0
ℹ pass 401
ℹ fail 0
...
reported 401 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791736324569
...
```

## Watch it

**New file** `bin/disassemble.ts`

```ts
// Disassembles a stretch of a service's code from the state before a trace's block: each
// instruction's place, name, registers, immediates and jump target.
// Usage: npm run disassemble <trace.json> [from, 0 unless you say] [how many, 12], e.g.
//        npm run disassemble ../vectors/traces/fallback/00000001.json 80282

import { readFileSync } from "node:fs";
import { fromHex } from "../src/bytes.ts";
import { Run } from "../src/obs.ts";
import type { Instruction } from "../src/pvm/instructions.ts";
import { decodeInstruction } from "../src/pvm/instructions.ts";
import { deblob, unpackCode } from "../src/pvm/program.ts";
import { serviceCode } from "../src/services.ts";
import type { KeyValue } from "../src/trie.ts";

const [file, from, count] = process.argv.slice(2);
const trace = JSON.parse(readFileSync(file, "utf8"));
const entries: KeyValue[] = trace.pre_state.keyvals.map((e: { key: string; value: string }) => ({
  key: fromHex(e.key),
  value: fromHex(e.value),
}));
const preimage = serviceCode(entries, 0);
if (!preimage) throw new Error("service 0's code isn't in this state");
const program = deblob(unpackCode(preimage).program);

/** An immediate as a person would write it: negative if its top bit is set. */
const show = (x: bigint) => String(x >= 2n ** 63n ? x - 2n ** 64n : x);

/** An instruction in one line: name, registers, immediates, target. */
function line({ name, registers, immediates, target }: Instruction): string {
  const args = [...registers.map((r) => `r${r}`), ...immediates.map(show)];
  if (target !== undefined) args.push(`→ ${target}`);
  return `${name.padEnd(16)} ${args.join(", ")}`;
}

const run = new Run("disassemble");
let at = Number(from ?? 0);
for (let n = 0; n < Number(count ?? 12) && at < program.code.length; n++) {
  const instruction = decodeInstruction(program, at);
  console.log(`${String(at).padStart(7)}  ${line(instruction)}`);
  run.event("instruction", { at, text: line(instruction) });
  at = instruction.next;
}
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

**What flows through it.** One run, three faces — the raw code bytes going in, the
instruction decoded from them, and the lines printed. Tab across them:

::: code-group

```text [what goes in]
argv: ../vectors/traces/fallback/00000001.json 0 4
code bytes 0 to 15 of the unpacked blob:
  28 9a 39 01 00   28 a9 67 01   95 11 a0   7b 10 58
bitmask: 21 92 … — its 1 bits mark bytes 0, 5, 9 and 12 as instruction starts
```

```ts [what it computes]
// bin/disassemble.ts's first instruction, decoded from 28 9a 39 01 00
const computed = {
  opcode: 0x28, // 40: jump
  immediates: [80282n], // 9a 39 01 00 read little-endian
  next: 5, // the bitmask's next 1 bit: this instruction took 5 bytes
  target: 80282, // where the jump goes: refine's front door
};
```

```text [what comes out]
      0  jump             → 80282
      5  jump             → 92078
```

:::

Read the input into the output: the gaps drawn between the bytes are the bitmask's
doing — `21 92` in bits puts a 1 at 0, 5, 9 and 12, so the decoder knows `28` at byte 0
starts an instruction, opcode 40, `jump`, and the four bytes after it, `9a 39 01 00`,
are its immediate, 80,282 read little-endian. Without the bitmask the same sixteen
bytes could be sliced a dozen ways.

**Run**

```sh
npm pkg set scripts.disassemble="node bin/disassemble.ts"
npm pkg set scripts.disassemble-fallback="node bin/disassemble.ts ../vectors/traces/fallback/00000001.json 0 4"
npm run disassemble-fallback
```

```text
      0  jump             → 80282
      5  jump             → 92078
      9  add_imm_64       r1, r1, -96
     12  store_ind_u64    r0, r1, 88
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=disassemble-1791736329537
```

The very first two instructions are jumps, and that's no accident: the PVM starts
*refine* at byte 0 and *accumulate* at byte 5 (App. B; §9 just numbers them 0 and 1). They're the code's two
front doors. Follow the first one, `npm run disassemble
../vectors/traces/fallback/00000001.json 80282`, and you're reading the start of a
function: `add_imm_64 r1, r1, -752` makes room on the stack (r1 is the stack pointer),
and `store_ind_u64 r0, r1, 744` saves the return address (r0) there. Then [lesson 15.1](./01-the-program-blob.md)'s
most common opcodes have names: `load_ind_u64` and `store_ind_u64`, moving 8-byte values
between registers and memory, and `load_imm`. The *Disassembly* panel, on **6 · The PVM**,
shows each instruction.

![Disassembly panel](./images/02-disassembly.png)

<details>
<summary>lasair: one variant per instruction, in <code>lib/pvm_decode.ml</code></summary>

```ocaml
  (* One register + two immediates: l_X from byte[1]/16 mod 8 *)
  | 70 | 71 | 72 | 73 ->
    let byte1 = get_byte code pc 1 in
    let ra = decode_reg byte1 in
    let l_x = min 4 ((byte1 / 16) mod 8) in
    let imm_x = sign_extend l_x (decode_le code pc 2 l_x) in
    let l_y = min 4 (max 0 (l - l_x - 1)) in
    let imm_y = sign_extend l_y (decode_le code pc (2 + l_x) l_y) in
    (match opcode with
     | 70 -> Store_imm_ind_u8 { ra; offset = imm_x; value = imm_y }
```

The same formulas, line for line. The difference is what comes out: lasair gives every
instruction its own OCaml variant with named fields, `offset` and `value`, so the
compiler checks that the executor uses each one right. Your `Instruction` is one record
for all 139, with lists of registers and immediates. Simpler to write; the names come
from the Gray Paper's order instead. lasair also leaves an offset relative until it
runs, where yours works out the target straight away.

</details>

## Check your understanding

::: check
**In the napkin program, `load_imm r1` carries the one-byte immediate `ff`. What lands in r1?**

- [ ] 255
  > No: that's `ff` read unsigned. Immediates are sign-extended: a set top bit means
  > negative.
- [x] 2^64 − 1, which is −1
  > Yes: `ff`'s top bit is 1, so the seven missing bytes fill with `ff`:
  > 0xffffffffffffffff, −1 read as signed.
- [ ] 0xff00000000000000
  > No: the byte stays at the bottom, as the lowest byte. Sign extension fills the bytes
  > *above* it.

**The `jump` at byte 6 has the offset `fd`. Where does it land?**

- [ ] 259: 6 + 253
  > No: offsets are signed. `fd` is −3, not 253.
- [ ] 5: three back from the next instruction, at 8
  > No: an offset counts from the jump's own opcode, ı, not from the next instruction.
- [x] 3, the `add_64`
  > Yes: 6 + (−3) = 3, and 3 starts an instruction, as every target must.

**How does the PVM know that `load_imm`'s immediate is one byte long?**

- [ ] A length byte comes in front of it
  > No: no length is written down anywhere.
- [ ] Every immediate is 4 bytes
  > No: an immediate takes 0 to 4 bytes. Four here would swallow the start of the
  > `add_64`.
- [x] The bitmask says the next instruction starts at 3
  > Yes: so skip(0) is 2, one byte for the register and one left for the immediate. An
  > instruction ends where the next begins.

**`add_64` is the bytes `200, 0x21, 0x03`. Which register gets the sum?**

- [ ] r12, because `0x21` is 33, more than 12
  > No: `0x21` holds two registers, four bits each: 1 in the low half, 2 in the high half.
- [x] r3
  > Yes: the halves of `0x21` are the inputs, r1 and r2, and the third byte, `0x03`, is
  > the register written: r3 = r1 + r2.
- [ ] r1, the first one named
  > No: with three registers, the first two are the inputs. `add_64` writes the third.
:::

## What you have

A disassembler: any JAM service's code, read instruction by instruction, every
argument decoded and every jump checked against the real thing. Reading a program isn't
running it: [lesson 15.3](./03-the-machine.md) builds the machine that steps through one.

Next: [15.3 The machine](./03-the-machine.md)
