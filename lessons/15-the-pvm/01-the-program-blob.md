# The program blob

**In one sentence:** a service's code arrives as one long run of bytes, packed in layers
like nesting dolls: a label, a memory layout, and the program itself, with a map that says
where each instruction starts.

Here is a whole program in eight bytes. Tap a byte to see which part it belongs to, then
flip a bit of the last one and watch the jump miss.

<a id="try-it"></a>

<BlobLayers />

## The idea

[Part 15](./index.md) builds the [*PVM*](../glossary.md#pvm), the Polkadot Virtual Machine:
the small computer inside every JAM node that runs services' code, and authorizers' too.
It runs in two places. In-core, three guarantors run it for an authorizer and for refine.
On the chain, every validator runs it for accumulate. Your client only ever does the
second, but it is the same machine.

Before it can run anything, the machine has to find the program. A service's code arrives
as one long preimage ([lesson 14.1](../14-services/01-providing-preimages.md)), and the
program is the smallest of a set of nesting dolls.

1. The outer doll is a label, for people: a name, a version, a licence.
2. Inside it is a memory layout: the data the program starts with, and the room it asks for.
3. Inside that is the [*program blob*](../glossary.md#program-blob): the
   [*instructions*](../glossary.md#instruction), one small step each (add, load, jump),
   each opening with its [*opcode*](../glossary.md#opcode), the number that says which step.

One problem is left. Instructions are not all the same length, so a byte in the middle of
one can pass for the start of another. The blob settles it with a map: one bit for every
byte of code, set where an instruction starts.

This lesson opens the dolls on a real service's real code.

## What the Gray Paper says

Three layers, from the outside in.

**1. The code preimage** (§9): E(↕m) ⌢ c. First the **metadata** m, with its length in
front: a name, a version, a licence, for people rather than the PVM. Then the code c.

**2. The standard program.** Appendix A.7 says what c is, in the paper's words:

::: gray-paper A.7 1-5

#### Appendix A.7 Standard Program Initialization {#gp-A-7}

<a id="gp-A-7-p1"></a>The software programs which will run in each of the three instances where the PVM is utilized in the main document have a very typical setup pattern characteristic of an output of a compiler and linker. This means that RAM has sections for program-specific read-only data, read-write (heap) data and the stack. An adjunct to this, very typical of our usage patterns is an extra read-only section via which invocation-specific data may be passed (i.e.  arguments). It thus makes sense to define this properly in a single initializer function. These sections are quantized into *major zones*, and one major zone is always left unallocated between sections in order to reduce accidental overrun. Sections are padded with zeroes to the nearest PVM memory page boundary.

<a id="gp-A-7-p2"></a>We thus define the standard JAM program blob format $\mathfrak{j}$, which includes not only the raw PVM program blob $\mathfrak{p}$, but also information on the state of the RAM at program start. Given JAM program blob $\mathfrak{j}$ and argument data $\mathbf{a}$, we can decode the PVM program blob $\mathfrak{p}$, registers $\varphi$, and RAM ${\mu}$ by invoking the standard initialization function $Y(\mathfrak{j}, \mathbf{a})$:

<a id="gp-A-7-p3"></a><a id="eq-A-41"></a>

$$
\begin{equation}
Y\colon\left\{ \begin{aligned}
\!\left\lgroup\mathbb{B}_{}, \mathbb{B}_{:\mathsf{Z}_I}\right\rgroup\! &\to \!\left\lgroup\mathbb{B}_{}, \left[\!\left[\mathbb{N}_R\right]\!\right]_{13}, \mathbb{M}\right\rgroup\!? \\
\left(\mathfrak{j}, \mathbf{a}\right) &\mapsto \begin{cases}
\left(\mathfrak{p}, \varphi, {\mu}\right) &\text{if } \exists! \left(\mathfrak{p}, \mathbf{o}, \mathbf{w}, z, s\right) \text{ which satisfy equation A.42}\\
\emptyset &\text{otherwise}
\end{cases}
\end{aligned} \right. \tag{A.41}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-abracegroup">$\left\{ \begin{aligned}x\end{aligned} \right.$</span> | as follows | a brace grouping lines that hold together: for a function, its type on top, then what each input becomes |
| <span id="gk-tuple">$\!\left\lgroup x\right\rgroup\!$</span> | the tuple of | a record: named fields, each with its type, like an object in JSON |
| <span id="gk-blob">[$\mathbb{B}$](../symbols.md#blobs)</span> | B, or B sub n | bytes: any run of them; 𝔹ₙ exactly n of them |
| <span id="gk-Cpvminitinputsize" class="gk-wrap">$\mathsf{Z}_I$</span> | Z sub I | the most argument data a program can be given: 2^24 bytes, 16 MiB |
| <span id="gk-to">[$\to$](../symbols.md#to)</span> | to | what goes in, to what comes out: A → B takes an A and gives a B |
| <span id="gk-regs">$\left[\!\left[\mathbb{N}_R\right]\!\right]_{13}$</span> | thirteen registers | a sequence of 13 register values, each a u64 |
| <span id="gk-ram" class="gk-wrap">$\mathbb{M}$</span> | M | a PVM memory: its bytes, and which pages may be read or written |
| <span id="gk-jam-blob" class="gk-wrap">$\mathfrak{j}$</span> | j (gothic) | a standard program: four sizes, the read-only and read-write data, then the PVM blob |
| <span id="gk-mapsto">$\mapsto$</span> | maps to | what a function gives back for an input: x ↦ y says x becomes y |
| <span id="gk-pvm-blob" class="gk-wrap">$\mathfrak{p}$</span> | p (gothic) | a PVM program blob: the jump table, the code and the bitmask, packed as bytes |
| <span id="gk-registers" class="gk-wrap">$\varphi$</span> | phi (curly) | the PVM's 13 registers |
| <span id="gk-mem" class="gk-wrap">${\mu}$</span> | mu | the PVM's memory: 2^32 bytes in pages of 4,096, each page readable, writable or neither |
| <span id="gk-exists">[$\exists$](../symbols.md#exists)</span> | there exists | there is at least one value such that what follows holds |
| <span id="gk-none" class="gk-wrap">$\emptyset$</span> | nothing | ∅: no value at all, like null |

</details>

→ [(A.41) in plain words](./gray-paper.md#ex-A-41)

<a id="gp-A-7-p4"></a>With conditions:

<a id="gp-A-7-p5"></a><a id="eq-A-42"></a><a id="eq-A-43"></a><a id="eq-A-44"></a><a id="eq-A-45"></a>

$$
\begin{align}
&\text{let } \mathcal{E}_3(\left\vert\mathbf{o}\right\vert) \frown \mathcal{E}_3(\left\vert\mathbf{w}\right\vert) \frown \mathcal{E}_2(z) \frown \mathcal{E}_3(s) \frown \mathbf{o} \frown \mathbf{w} \frown \mathcal{E}_4(\left\vert\mathfrak{p}\right\vert) \frown \mathfrak{p} = \mathfrak{j} \tag{A.42} \\
&\mathsf{Z}_Z = 2^{16}\ ,\quad\mathsf{Z}_I = 2^{24} \tag{A.43} \\
&\text{let } P(x \in \mathbb{N}) \equiv \mathsf{Z}_P\left\lceil \frac{x}{\mathsf{Z}_P} \right\rceil\quad,\qquad Z(x \in \mathbb{N}) \equiv \mathsf{Z}_Z\left\lceil \frac{x}{\mathsf{Z}_Z} \right\rceil \tag{A.44} \\
&5\mathsf{Z}_Z + Z(\left\vert\mathbf{o}\right\vert) + Z(\left\vert\mathbf{w}\right\vert + z\mathsf{Z}_P) + Z(s) + \mathsf{Z}_I \leq 2^{32} \tag{A.45}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-len">$\left\vert x\right\vert$</span> | the size of | \|x\|: how many items x has, or how many bytes |
| <span id="gk-concat" class="gk-wrap">[$\frown$](../symbols.md#concat)</span> | concatenate | join: the left sequence followed by the right |
| <span id="gk-Cpvminitzonesize" class="gk-wrap">$\mathsf{Z}_Z$</span> | Z sub Z | a zone: 2^16 bytes, 64 KiB; memory's sections start on zones, with an empty one between |
| <span id="gk-rnp">$P(x)$</span> | P of | x rounded up to whole pages of 4,096 bytes |
| <span id="gk-in">[$\in$](../symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-N" class="gk-wrap">[$\mathbb{N}$](../symbols.md#naturals)</span> | N | the whole numbers: 0, 1, 2 and up; a subscript is a bound, ℕ₈ is 0 to 7 |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-Cpvmpagesize" class="gk-wrap">$\mathsf{Z}_P$</span> | Z sub P | a memory page: 4,096 bytes |
| <span id="gk-ceil">$\left\lceil x\right\rceil$</span> | ceiling of | rounded up to a whole number |
| <span id="gk-frac">$\frac{x}{y}$</span> | over | a fraction: the top divided by the bottom |
| <span id="gk-rnq">$Z(x)$</span> | Z of | x rounded up to whole zones of 65,536 bytes |
| <span id="gk-leq">$\leq$</span> | at most | less than or equal to |

</details>

→ [(A.42), (A.43), (A.44), (A.45) in plain words](./gray-paper.md#ex-A-42)

:::

The first line of (A.42) is the memory layout, the middle doll, and the function Y
(App. A.7) unpacks it: c holds what the program's memory starts with. Four sizes,
ℰ₃(|o|) ⌢ ℰ₃(|w|) ⌢ ℰ₂(z) ⌢ ℰ₃(s), then the data they size:

- o, **read-only data** the program may read;
- w, **read-write data**, followed by z pages of zeroed heap;
- s, the **stack** size;

and then ℰ₄(|p|) ⌢ p, the *program blob* itself. The other lines of (A.42) to (A.45) say
how those sections sit in memory: zones of Z_Z = 2^16 bytes, room for Z_I = 2^24 bytes of
arguments, and everything within 2^32 bytes. [Lesson 15.8](./08-a-real-program.md) lays
them out.

**3. The PVM blob.** Appendix A.2 opens on it:

::: gray-paper A.2 1-3

#### Appendix A.2 Instructions, Opcodes and Skip-distance {#gp-A-2}

<a id="gp-A-2-p1"></a>The PVM program blob $\mathfrak{p}$ is split into a series of <abbr class="gp-term" title="bytes: 8 bits each">octets</abbr> which make up the *instruction data* $\mathbf{c}$ and the *<abbr class="gp-term" title="one bit per byte of code, marking the bytes where an instruction starts">opcode bitmask</abbr>* $\mathbf{k}$ as well as the *<abbr class="gp-term" title="the list of places a computed jump may land; an address picks an entry">dynamic jump table</abbr>*, $\mathbf{j}$. The former two imply an instruction sequence, and by extension a *basic-block sequence*, itself a sequence of indices of the instructions which follow a *block-termination* instruction.

<a id="gp-A-2-p2"></a>The latter, dynamic jump table, is a sequence of indices into the instruction data blob and is indexed into when dynamically-computed jumps are taken. It is encoded as a sequence of natural numbers (i.e. non-negative integers) each encoded with the same length in octets. This length, term $z$ above, is itself encoded prior.

<a id="gp-A-2-p3"></a>The PVM counts instructions in <abbr class="gp-term" title="a byte: 8 bits">octet</abbr> terms (rather than in terms of instructions) and it is thus necessary to define which octets represent the beginning of an instruction, i.e.  the opcode octet, and which do not. This is the purpose of $\mathbf{k}$, the instruction-opcode bitmask. We assert that the length of the bitmask is equal to the length of the instruction blob.

:::

The blob, the smallest doll, is ℰ(|j|) ⌢ ℰ₁(z) ⌢ ℰ(|c|), then the three parts the paper names
(the function that cuts them apart, deblob, is [(A.2)](./03-the-machine.md#eq-A-2),
quoted in [lesson 15.3](./03-the-machine.md) beside the machine it serves):

- j, the *jump table*: |j| entries of z bytes each, the places an indirect jump may land;
- c, the *code*: the *instructions*, byte after byte;
- k, the *opcode bitmask*: one bit per byte of c, saying which bytes *start* an
  instruction. Instructions take 1 to 16 bytes, so without k you couldn't tell an
  opcode from an argument. Bits are packed least significant first, like [lesson 11.1](../11-assurances/01-available.md)'s
  bitfields.

[The eight bytes at the top](#try-it) are such a blob: one jump target, byte 2, three
bytes of code, and a bitmask that marks bytes 0 and 2. Flip bit 2 of the bitmask and the
jump lands mid-instruction. Under them, the real service's layers are drawn to scale.

**Try it in the [playground](../pvm-playground.md).** Press **A real service: bootstrap's accumulate**. The Code panel lists this lesson's 39,849 instructions, and the Memory panel shows the read-only data unpacked into pages.

## The tests

The tests need the trace's service code, and so will later lessons. A helper finds it,
next to the other vector readers:

**Add to** `test/vectors.ts`

```ts
import { serviceCode } from "../src/services.ts";

/** The code of service 0, from the state before the first block of the fallback trace. */
export function bootstrapCode(): Uint8Array {
  const { entries } = traceState("fallback", 1);
  return serviceCode(entries, 0)!;
}
```

**New file** `test/program.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { fromHex, toHex } from "../src/bytes.ts";
import { deblob, startsInstruction, unpackCode } from "../src/pvm/program.ts";
import { bootstrapCode } from "./vectors.ts";
import type { Program, ServiceCode } from "../src/pvm/program.ts";
import type { Bytes } from "../src/bytes.ts";

test("deblob by hand: one jump, three bytes of code, two instructions", () => {
  // |j| = 1, z = 1, |c| = 3 | j = [2] | c = 00 01 02 | k = 0000 0101: bytes 0 and 2 start one
  const program: Program = deblob(fromHex("0x01010302" + "000102" + "05"));
  assert.deepEqual(program.jumpTable, [2]);
  const codeHex: string = toHex(program.code);
  assert.equal(codeHex, "0x000102");
  const starts: boolean[] = [0, 1, 2].map((i) => startsInstruction(program, i));
  assert.deepEqual(starts, [true, false, true]);
});

test("a real service's code: metadata, then a standard program that ends it exactly", () => {
  const preimage: Bytes = bootstrapCode();
  const code: ServiceCode = unpackCode(preimage);
  const metadata: string = new TextDecoder().decode(code.metadata);
  const named: boolean = metadata.includes("jam-bootstrap-service");
  assert.equal(named, true);
  assert.deepEqual([code.readOnly.length, code.readWrite.length], [9904, 48]);
  assert.deepEqual([code.heapPages, code.stackSize], [2, 8192]);
  const tail: Bytes = preimage.subarray(preimage.length - code.program.length);
  assert.deepEqual(tail, code.program); // nothing left over after the PVM blob
});

test("its PVM blob: 39,849 instructions, and all 1,601 jumps land on one", () => {
  const program: Program = deblob(unpackCode(bootstrapCode()).program);
  let instructions = 0;
  for (let i = 0; i < program.code.length; i++) if (startsInstruction(program, i)) instructions++;
  assert.equal(instructions, 39849);
  const startsAtZero: boolean = startsInstruction(program, 0); // the code starts with one
  assert.equal(startsAtZero, true);
  assert.equal(program.jumpTable.length, 1601);
  for (const target of program.jumpTable) {
    const lands: boolean = startsInstruction(program, target);
    assert.ok(lands);
  }
});
```

The first test builds a blob by hand, eight bytes you can read:

```text
01         |j|: one entry in the jump table (a compact natural)
01         z: each entry is 1 byte
03         |c|: 3 bytes of code
02         j: the one jump target, byte 2
00 01 02   c: the code
05         k: 0000 0101, bits 0 and 2 set: bytes 0 and 2 start an instruction
```

They are the blob [at the top](#try-it). The other tests unpack the code of the trace's
service 0, the 159,322-byte preimage from [lesson 6.1](../06-state-and-merklization/01-the-state-trie.md), and check that every layer fits
*exactly*: no bytes left over at the end of the preimage, every jump landing on an
instruction.

## The code

**New file** `src/pvm/program.ts`

```ts
// Programs (GP §9, App. A): how a service's code is packed, from its preimage down to the
// instructions the PVM runs.

import { bitAt } from "../assurances.ts";
import type { Bytes } from "../bytes.ts";
import { Reader } from "../codec/reader.ts";

/** A service's code, unpacked: its metadata, and the standard program's parts (GP App. A). */
export type ServiceCode = {
  metadata: Bytes; // a name, a version, a licence: for people, not the PVM
  readOnly: Bytes; // o: data the program may read
  readWrite: Bytes; // w: data it may read and write
  heapPages: number; // z: pages of zeroed heap after w
  stackSize: number; // s
  program: Bytes; // the PVM program blob
};

/** Unpacks a code preimage: E(↕m) ⌢ c (GP §9), and c is Y's standard program (App. A). */
export function unpackCode(preimage: Bytes): ServiceCode {
  const r = new Reader(preimage);
  const metadata = r.bytes(Number(r.natural()));
  const readOnlyLength = Number(r.fixed(3));
  const readWriteLength = Number(r.fixed(3));
  const heapPages = Number(r.fixed(2));
  const stackSize = Number(r.fixed(3));
  const readOnly = r.bytes(readOnlyLength);
  const readWrite = r.bytes(readWriteLength);
  const program = r.bytes(Number(r.fixed(4)));
  return { metadata, readOnly, readWrite, heapPages, stackSize, program };
}

/** A PVM program blob, unpacked: the jump table, the code, and the opcode bitmask. */
export type Program = { jumpTable: number[]; code: Bytes; bitmask: Bytes };

/** deblob (GP App. A): E(|j|) ⌢ E₁(z) ⌢ E(|c|) ⌢ j, each entry z bytes ⌢ c ⌢ k. */
export function deblob(blob: Bytes): Program {
  const r = new Reader(blob);
  const jumps = Number(r.natural());
  const z = Number(r.fixed(1)); // bytes per jump-table entry
  const codeLength = Number(r.natural());
  const jumpTable = Array.from({ length: jumps }, () => Number(r.fixed(z)));
  const code = r.bytes(codeLength);
  const bitmask = r.bytes(Math.ceil(codeLength / 8)); // one bit per byte of code
  return { jumpTable, code, bitmask };
}

/** Whether byte i of the code starts an instruction: bit i of k, least significant first. */
export function startsInstruction(program: Program, i: number): boolean {
  return i < program.code.length && bitAt(program.bitmask, i);
}
```

The PVM gets a folder of its own, `src/pvm/`: several files are coming. All of
this is [lesson 2.3](../02-codec/03-writer-and-reader.md)'s `Reader`: `fixed(3)` for ℰ₃, `natural()` for ℰ, `bytes(n)` for the
data. `startsInstruction` reuses [lesson 11.1](../11-assurances/01-available.md)'s `bitAt`: the same packing, so the same
function.

> [!NOTE]
> **The simple road.** `unpackCode` and `deblob` trust the sizes they read. A blob
> shorter than its own sizes, a giant jump table, or a jump target off the end of the
> code all slip through, and a program comes from any service, so from anyone. The
> real service's code is well formed, so this is fine for now; the [hardening
> pass](https://github.com/abutlabs/the-gray-tutor/blob/main/HARDENING.md) checks every size.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ the reported packages: each one's hash and exports root, sorted by hash (275.3ms)
...
✔ deblob by hand: one jump, three bytes of code, two instructions (1.6ms)
✔ a real service's code: metadata, then a standard program that ends it exactly (12.7ms)
✔ its PVM blob: 39,849 instructions, and all 1,601 jumps land on one (22.6ms)
...
ℹ tests 398
ℹ suites 0
ℹ pass 398
ℹ fail 0
...
reported 398 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791736314079
...
```

## Watch it

**New file** `bin/program.ts`

```ts
// Unpacks a service's code from the state before a trace's block, layer by layer: the
// metadata, the standard program, and the PVM blob's jump table, code and bitmask.
// Usage: npm run program <trace.json> [service id, 0 unless you say], e.g.
//        npm run program ../vectors/traces/fallback/00000001.json

import { readFileSync } from "node:fs";
import { fromHex } from "../src/bytes.ts";
import { Run } from "../src/obs.ts";
import { deblob, startsInstruction, unpackCode } from "../src/pvm/program.ts";
import { serviceCode } from "../src/services.ts";
import type { KeyValue } from "../src/trie.ts";

const [file, id] = process.argv.slice(2);
const trace = JSON.parse(readFileSync(file, "utf8"));
const entries: KeyValue[] = trace.pre_state.keyvals.map((e: { key: string; value: string }) => ({
  key: fromHex(e.key),
  value: fromHex(e.value),
}));
const preimage = serviceCode(entries, Number(id ?? 0));
if (!preimage) throw new Error("the service's code isn't in this state");
const code = unpackCode(preimage);
const program = deblob(code.program);
const opcodes = new Map<number, number>(); // how often each opcode starts an instruction
for (let i = 0; i < program.code.length; i++) {
  if (!startsInstruction(program, i)) continue;
  const opcode = program.code[i];
  opcodes.set(opcode, (opcodes.get(opcode) ?? 0) + 1);
}
const instructions = [...opcodes.values()].reduce((a, b) => a + b, 0);
const common = [...opcodes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
const run = new Run("program");
const lines = [
  `the code preimage: ${preimage.length} bytes`,
  `  metadata: ${code.metadata.length} bytes`,
  `  read-only data ${code.readOnly.length}, read-write ${code.readWrite.length}, ` +
    `heap pages ${code.heapPages}, stack ${code.stackSize}`,
  `  the PVM blob: ${code.program.length} bytes`,
  `    jump table: ${program.jumpTable.length} entries`,
  `    code: ${program.code.length} bytes, ${instructions} instructions`,
  `    bitmask: ${program.bitmask.length} bytes`,
  `most common opcodes: ${common.map(([op, n]) => `${op} (${n}×)`).join(", ")}`,
];
for (const line of lines) {
  console.log(line);
  run.event("layer", { line });
}
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

What flows through it:

::: code-group

```json [what goes in]
{ "pre_state": { "keyvals": [
  {
    "key": "0x003f00f4004e00375cb1b4c052ebb735f8db5d35cced61f8c918fd873aaa80",
    "value": "0x5000156a616d2d626f6f7473747261702d73657276696365…"
  },
  … the value runs on: 159,322 bytes, the whole code preimage …
] } }
```

```ts [what it computes]
// bin/program.ts's layers, peeled from those 159,322 bytes
const computed = {
  metadata: 80, // the first layer: name, version, licence
  readOnly: 9904, // data mapped read-only; then readWrite: 48
  heapPages: 2, // and stackSize: 8192
  blob: 149274, // the PVM blob: jump table, code, bitmask
  jumpTable: 1601, // entries
  instructions: 39849, // in 128,413 bytes of code: about 3.2 bytes each
  commonest: "130 (6871×)", // one opcode starts a sixth of them
};
```

```text [what comes out]
the code preimage: 159322 bytes
  metadata: 80 bytes
    code: 128413 bytes, 39849 instructions
```

:::

The value opens with the metadata's length, 80, and a few bytes later comes
`jam-bootstrap-service` in ASCII. Every line of the output is sliced from that one state
entry, layer by layer, down to the bitmask.

**Run**

```sh
npm pkg set scripts.program="node bin/program.ts"
npm pkg set scripts.program-fallback="node bin/program.ts ../vectors/traces/fallback/00000001.json"
npm run program-fallback
```

```text
the code preimage: 159322 bytes
  metadata: 80 bytes
  read-only data 9904, read-write 48, heap pages 2, stack 8192
  the PVM blob: 149274 bytes
    jump table: 1601 entries
    code: 128413 bytes, 39849 instructions
    bitmask: 16052 bytes
most common opcodes: 130 (6871×), 123 (4950×), 51 (3474×), 149 (3021×), 151 (2021×)
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=program-1791736319548
```

159,322 bytes: 80 of metadata (it calls itself `jam-bootstrap-service`, version 0.1.29,
Apache-2.0), almost 10 kB of read-only data, and a PVM blob of 149,274 bytes holding
39,849 instructions, about 3.2 bytes each. A few opcodes do most of the work: 130, 123
and 51 start more than a third of them; [next lesson](./02-instructions.md) names them. The *Program* panel, on
the **6 · The PVM** dashboard, shows the layers.

![Program panel](./images/01-program.png)

<details>
<summary>lasair: <code>parse_program</code>, in <code>lib/pvm.ml</code></summary>

```ocaml
        let code_len, pos3 = decode_natural blob pos2 in
        (* Z_J, Z_C; a count past 2^62 wraps negative in an int *)
        if jump_count < 0 || jump_count > Definitions.Constants.c_max_jump_table_entries
           || code_len < 0 || code_len > Definitions.Constants.c_max_code_size then None
        else
        let jump_table_size = jump_count * z in
        let bitmask_size = (code_len + 7) / 8 in
        let expected_size = pos3 + jump_table_size + code_len + bitmask_size in

        if Bytes.length blob < expected_size then None
```

The same three layers of sizes, plus the hardening: limits on the jump table and the
code, and a refusal when the blob is shorter than its own sizes promise. A program blob
comes from a service, so from anyone, and a client must survive a hostile one. A few
lines further down, lasair also *expands* the bitmask into a byte per code byte, trading
memory for a faster "does this byte start an instruction?". Both are hardening (the note
above); your `deblob` shows the shape.

</details>

## Check your understanding

::: check
**The bitmask has one bit for each byte of code. What does a set bit say?**

- [ ] A jump may land on this byte
  > No: jumps have a stricter rule, which [lesson 15.3](./03-the-machine.md) gets to. A set
  > bit only says where an instruction starts.
- [x] An instruction starts at this byte
  > Yes: the hand-made blob marks bytes 0 and 2, so byte 1 is the rest of the first
  > instruction.
- [ ] This byte is the last of its instruction
  > No: it marks the first. The distance to the next set bit gives the instruction's
  > length.

**Why does a program blob need a bitmask at all?**

- [ ] To mark which instructions a service is allowed to run
  > No: the bitmask says nothing about permission. It only says where each instruction
  > starts.
- [ ] To make the code smaller
  > No: it makes the blob bigger, by a bit per byte of code: 16,052 bytes of it in the
  > bootstrap service.
- [x] Instructions take 1 to 16 bytes, so an argument byte could pass for an opcode
  > Yes: an argument byte can hold any value, opcode numbers included. Only the bitmask
  > says which bytes start an instruction.

**Who runs a service's code, and where?**

- [ ] Only the validator that authors the block
  > No: on the chain every validator runs accumulate, and each must get the same result.
- [ ] The service, on machines of its own, which send the chain the result
  > No: JAM's nodes run the code themselves, in the PVM. That is what the machine is for.
- [x] A core's three guarantors, in-core, for an authorizer and for refine; every validator, on the chain, for accumulate
  > Yes: it is the same machine in both places. Your client only ever does the second.

**The bitmask's length is written nowhere in the blob. How does a client know it?**

- [x] It is one bit per byte of code, so the code's length gives it: divide by 8 and round up
  > Yes: every byte of code gets a bit, whether it starts an instruction or not. The
  > bootstrap service's 128,413 bytes of code make 16,052 bytes of bitmask.
- [ ] It is one bit per instruction, so the client counts the instructions first
  > No: the instructions can't be counted without the bitmask. It has a bit for every
  > byte of code.
- [ ] The bitmask runs to the end of the preimage, whatever is left
  > No: the blob has a length of its own in front of it, ℰ₄(|p|). The bitmask's follows
  > from the code's.

**The code preimage starts with 80 bytes of metadata, `jam-bootstrap-service` among them. What does the PVM do with them?**

- [ ] Checks the name before it runs the code
  > No: nothing in the PVM reads the metadata.
- [x] Nothing: they're for people, and unpacking steps over them
  > Yes: E(↕m) puts their length in front, so `unpackCode` reads the length, takes that
  > many bytes, and goes on to the standard program.
- [ ] Loads them into read-only memory, with the data
  > No: the read-only data is o, the 9,904 bytes the standard program sizes. The metadata
  > sits outside the standard program altogether.
:::

## What you have

A real service's code, unpacked down to its instructions: metadata, memory layout, jump
table, code and bitmask, every byte accounted for. So far they're only opcode numbers,
though: [lesson 15.2](./02-instructions.md) reads each one, name and arguments.

Next: [15.2 Instructions](./02-instructions.md)
