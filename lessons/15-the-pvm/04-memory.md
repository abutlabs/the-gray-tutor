# Memory

**In one sentence:** the PVM's memory is four gigabytes of numbered bytes, of which a
program may touch only the pages it was given, and a touch anywhere else stops the machine
before anything changes.

Here is a map with one writable page, one read-only page and nothing else. Pick a load or
a store, a width and an address, and see whether the machine carries on, faults or panics.

<a id="try-it"></a>

<MemoryTouch />

## The idea

Thirteen registers are thirteen numbers. A real program needs far more room. So the
machine gets [*memory*](../glossary.md#memory): one long row of numbered bytes, 2^32 of
them, 4 gigabytes.

No program gets the whole row. It is cut into [*pages*](../glossary.md#page), in pages of
4,096 bytes, and a program can touch only the pages it has been given. Some it may read
and write. Some it may only read. Think of a hotel corridor four gigabytes long, and a key
that opens a handful of its doors.

What if a program tries a door its key doesn't open? The machine stops, and nothing is
changed. That stop is a [*fault*](../glossary.md#fault). It names the page, so whoever
runs the machine could add the page and carry on. One stretch is different: nothing may
ever live in the first 64 kB. A touch there is a panic, so an address near zero is always
a crash.

This lesson builds the pages, the check, and the thirty instructions that load and store.

## What the Gray Paper says

§4 and Appendix A. §4 gives memory's shape, 𝕄: its bytes, and each page's access. What
happens when an instruction touches it is A.4's:

::: gray-paper A.4 5-7

#### Appendix A.4 Single-Step State Transition, continued

<a id="gp-A-4-p5"></a>During the course of executing instructions RAM may be accessed. When an index of RAM below $2^{16}$ is required, the machine always panics immediately without further changes to its state regardless of the apparent (in)accessibility of the value. Otherwise, should the given index of RAM not be accessible then machine state remains unchanged and the exit reason is a fault with the lowest inaccessible *page address* to be read. Similarly, where RAM must be mutated and yet mutable access is not possible, then machine state is unchanged, and the exit reason is a fault with the lowest page address to be written which is inaccessible.

<a id="gp-A-4-p6"></a>Formally, let $\mathbf{r}$ and $\mathbf{w}$ be the set of indices by which ${\mu}$ must be subscripted for inspection and mutation respectively in order to calculate the result of $\Psi_1$. We define the memory-access exceptional execution state $\varepsilon^\mu$ as following:

<a id="gp-A-4-p7"></a><a id="eq-A-9"></a>

$$
\begin{equation}
\begin{aligned}
\varepsilon^{\mu} &= \begin{cases}
\blacktriangleright &\text{if } \mathbf{x} = \emptyset \\
\unicode{x21AF} &\text{if } \min(\mathbf{x}) \bmod 2^{32} < 2^{16} \\
\unicode{x2132} \times \mathsf{Z}_P\left\lfloor\min(\mathbf{x}) \bmod 2^{32} \div \mathsf{Z}_P\right\rfloor &\text{otherwise}
\end{cases}\\
\text{where } \mathbf{x} &= \left\{\,x \;\middle\vert\; x \in \mathbf{r} \wedge x \bmod 2^{32} \not\in \mathbb{V}_{{\mu}}\ \vee\ x \in \mathbf{w} \wedge x \bmod 2^{32} \not\in \mathbb{V}_{{\mu}}^*\,\right\}
\end{aligned} \tag{A.9}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-varepsilon">$\varepsilon$</span> | epsilon | the exit reason: how a step or a run ended, from carry on to halt, panic, out of gas, fault or host call |
| <span id="gk-mu">$\mu$</span> | mu | the PVM's memory |
| <span id="gk-continue" class="gk-wrap">$\blacktriangleright$</span> | continue | ▸: the step went normally, and the next one may run |
| <span id="gk-emptyset">$\emptyset$</span> | empty | the empty set: no items at all |
| <span id="gk-panic">$\unicode{x21AF}$</span> | panic | ↯: the program trapped |
| <span id="gk-min">$\min$</span> | the least of | the smallest of the values given; min(24, j : …) is the smallest j that fits, but no more than 24 |
| <span id="gk-bmod">[$\bmod$](../symbols.md#mod)</span> | mod | the remainder after dividing: 14 mod 4 is 2 |
| <span id="gk-fault">$\unicode{x2132}$</span> | page fault | Ⅎ: the program touched memory it may not |
| <span id="gk-times">$\times$</span> | times | multiply; between sets, every pair of one from each |
| <span id="gk-Cpvmpagesize" class="gk-wrap">$\mathsf{Z}_P$</span> | Z sub P | a memory page: 4,096 bytes |
| <span id="gk-floor">[$\left\lfloor x\right\rfloor$](../symbols.md#floor)</span> | floor of | rounded down to a whole number |
| <span id="gk-div">$\div$</span> | divided by | division, exact; rounded only where ⌊ ⌋, ⌈ ⌉ or rtz says so |
| <span id="gk-set">$\left\{\,x\,\right\}$</span> | the set of | a set: values with no order and no repeats |
| <span id="gk-build">$\left\{ x \;\middle\vert\; y \right\}$</span> | for each, such that | built by a rule: the left-hand value, for every case the right-hand side allows (a set, or a sequence in order) |
| <span id="gk-in">[$\in$](../symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-wedge">$\wedge$</span> | and | both sides are true |
| <span id="gk-readable">$\mathbb{V}_{x}$</span> | V sub mu | the addresses of memory μ that may be read |
| <span id="gk-mem" class="gk-wrap">${\mu}$</span> | mu | the PVM's memory: 2^32 bytes in pages of 4,096, each page readable, writable or neither |
| <span id="gk-vee">$\vee$</span> | or | at least one side is true |
| <span id="gk-writable">$\mathbb{V}_{x}^*$</span> | V sub mu star | the addresses of memory μ that may be written |

</details>

→ [(A.9) explained](./gray-paper.md#ex-A-9)

:::

**RAM** is 2^32 bytes, cut into *pages* of Z_P = 4,096 bytes. Each page is *readable*
(R), *writable* (W, which is readable too), or *inaccessible*. A fresh machine has only
the pages its program needs. Everything else is empty space.

**Touching memory** (ε^μ, A.4): if an instruction reads an inaccessible byte, or writes
a byte that isn't writable, the machine stops and changes *nothing*:

- if the lowest bad address is below 2^16, that's a **panic**: nothing may live in the
  first 64 kB, so a near-null pointer is always a crash;
- otherwise it's a *fault*, reporting the address of the bad page (the bad address
  rounded down to a multiple of 4,096).

The machine stays on the faulting instruction, so whoever runs it could add the page and
carry on.

Addresses wrap round at 2^32 (the GP's ↺), and every value is little-endian.

**The instructions** are in three of A.5's tables. With two immediates, the stores of a
constant:

::: gray-paper A.5.4 2-2

#### Appendix A.5.4 Instructions with Arguments of Two Immediates, continued

<a id="gp-A-5-4-p2"></a>

| $\zeta_\imath$ | **Name** | **Mutations** |
| --- | --- | --- |
| 30 | `store_imm_u8` | ${{\mu}'}^\circlearrowleft_{\nu_X} = \nu_Y \bmod 2^8$ |
| 31 | `store_imm_u16` | ${{\mu}'}^\circlearrowleft_{\nu_X \dots+ 2} = \mathcal{E}_{2}\left(\nu_Y \bmod 2^{16}\right)$ |
| 32 | `store_imm_u32` | ${{\mu}'}^\circlearrowleft_{\nu_X \dots+ 4} = \mathcal{E}_{4}\left(\nu_Y \bmod 2^{32}\right)$ |
| 33 | `store_imm_u64` | ${{\mu}'}^\circlearrowleft_{\nu_X \dots+ 8} = \mathcal{E}_{8}\left(\nu_Y\right)$ |

:::

With a register and an immediate, the loads and stores at a fixed address (and
`jump_ind` and `load_imm`, from [lesson 15.3](./03-the-machine.md)):

::: gray-paper A.5.6 2-2

#### Appendix A.5.6 Instructions with Arguments of One Register &amp; One Immediate, continued

<a id="gp-A-5-6-p2"></a>

| $\zeta_\imath$ | **Name** | **Mutations** |
| --- | --- | --- |
| 50 | `jump_ind` | $\texttt{djump}(({\varphi}_A + \nu_X) \bmod 2^{32})$ |
| 51 | `load_imm` | ${\varphi}'_A = \nu_X$ |
| 52 | `load_u8` | ${\varphi}'_A = {{\mu}}^\circlearrowleft_{\nu_X}$ |
| 53 | `load_i8` | ${\varphi}'_A = \mathcal{X}_{1}\left({{\mu}}^\circlearrowleft_{\nu_X}\right)$ |
| 54 | `load_u16` | ${\varphi}'_A = \mathcal{E}^{-1}_{2}\left({{\mu}}^\circlearrowleft_{\nu_X \dots+ 2}\right)$ |
| 55 | `load_i16` | ${\varphi}'_A = \mathcal{X}_{2}\left(\mathcal{E}^{-1}_{2}\left({{\mu}}^\circlearrowleft_{\nu_X \dots+ 2}\right)\right)$ |
| 56 | `load_u32` | ${\varphi}'_A = \mathcal{E}^{-1}_{4}\left({{\mu}}^\circlearrowleft_{\nu_X \dots+ 4}\right)$ |
| 57 | `load_i32` | ${\varphi}'_A = \mathcal{X}_{4}\left(\mathcal{E}^{-1}_{4}\left({{\mu}}^\circlearrowleft_{\nu_X \dots+ 4}\right)\right)$ |
| 58 | `load_u64` | ${\varphi}'_A = \mathcal{E}^{-1}_{8}\left({{\mu}}^\circlearrowleft_{\nu_X \dots+ 8}\right)$ |
| 59 | `store_u8` | ${{\mu}'}^\circlearrowleft_{\nu_X} = {\varphi}_A \bmod 2^8$ |
| 60 | `store_u16` | ${{\mu}'}^\circlearrowleft_{\nu_X \dots+ 2} = \mathcal{E}_{2}\left({\varphi}_A \bmod 2^{16}\right)$ |
| 61 | `store_u32` | ${{\mu}'}^\circlearrowleft_{\nu_X \dots+ 4} = \mathcal{E}_{4}\left({\varphi}_A \bmod 2^{32}\right)$ |
| 62 | `store_u64` | ${{\mu}'}^\circlearrowleft_{\nu_X \dots+ 8} = \mathcal{E}_{8}\left({\varphi}_A\right)$ |

:::

With a register and two immediates, the stores of a constant through a register:

::: gray-paper A.5.7 2-2

#### Appendix A.5.7 Instructions with Arguments of One Register &amp; Two Immediates, continued

<a id="gp-A-5-7-p2"></a>

| $\zeta_\imath$ | **Name** | **Mutations** |
| --- | --- | --- |
| 70 | `store_imm_ind_u8` | ${{\mu}'}^\circlearrowleft_{{\varphi}_A + \nu_X} = \nu_Y \bmod 2^8$ |
| 71 | `store_imm_ind_u16` | ${{\mu}'}^\circlearrowleft_{{\varphi}_A + \nu_X \dots+ 2} = \mathcal{E}_{2}\left(\nu_Y \bmod 2^{16}\right)$ |
| 72 | `store_imm_ind_u32` | ${{\mu}'}^\circlearrowleft_{{\varphi}_A + \nu_X \dots+ 4} = \mathcal{E}_{4}\left(\nu_Y \bmod 2^{32}\right)$ |
| 73 | `store_imm_ind_u64` | ${{\mu}'}^\circlearrowleft_{{\varphi}_A + \nu_X \dots+ 8} = \mathcal{E}_{8}\left(\nu_Y\right)$ |

:::

The loads and stores through a register, `load_ind_…` and `store_ind_…` (120 to 130), share
a table with [lesson 15.5](./05-arithmetic.md)'s arithmetic, and it's quoted there. The
families differ only in width and form:

| Instructions | Address | Does |
| --- | --- | --- |
| `load_u8` … `load_u64`, `load_i8` … `load_i32` | ν_X | φ_A ← memory; `i` sign-extends |
| `load_ind_u8` … `load_ind_u64`, `load_ind_i…` | φ_B + ν_X | the same, through a register |
| `store_u8` … `store_u64` | ν_X | memory ← φ_A |
| `store_ind_u8` … `store_ind_u64` | φ_B + ν_X | memory ← φ_A |
| `store_imm_u8` … `store_imm_u64` | ν_X | memory ← ν_Y |
| `store_imm_ind_u8` … `store_imm_ind_u64` | φ_A + ν_X | memory ← ν_Y |

A store keeps only the low bytes: `store_u8` writes φ_A mod 2^8.

Try each case on [the map at the top](#try-it): a store to the read-only page, a load
where there is no page, a load below 2^16, and a load of 8 bytes that runs off the end of
its page.

**Try it in the [playground](../pvm-playground.md).** Press **Reading and writing memory**, then **Step** twice: the Memory panel jumps to the store and lights `88 77 66 55 44 33 22 11`. Then press **Writing to a read-only page**, and **Run**: the store stops with a page fault, and the page says what to change.

## The tests

**New file** `test/memory.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { HALT_ADDRESS, newMachine, run, step } from "../src/pvm/machine.ts";
import type { Memory } from "../src/pvm/memory.ts";
import { addPages } from "../src/pvm/memory.ts";
import { assemble } from "../src/pvm/program.ts";
import type { Exit, Machine } from "../src/pvm/machine.ts";
import type { Program } from "../src/pvm/program.ts";

test("store 8 bytes, load them back, and load one as a signed byte", () => {
  const program: Program = assemble([
    [123, 0x12], //  store_ind_u64 r2 at r1 + 0
    [130, 0x13], //  load_ind_u64 r3 from r1 + 0
    [125, 0x14], //  load_ind_i8 r4 from r1 + 0: one byte, sign-extended
    [50, 0x00], //   jump_ind r0: return
  ]);
  const memory: Memory = new Map();
  addPages(memory, 0x20000, 4096, "W"); // one writable page at 0x20000
  const r2: bigint = 0x1122334455667780n; // its lowest byte, 0x80, is −128 as a signed byte
  const machine: Machine = newMachine(program, [HALT_ADDRESS, 0x20000n, r2], memory);
  const exit: Exit = run(machine);
  assert.equal(exit, "halt");
  assert.equal(machine.registers[3], r2);
  assert.equal(machine.registers[4], 2n ** 64n - 128n);
});

test("no page there: a fault at the page's address; below 2^16: a panic", () => {
  // load_u8 r1, [0x30005]
  const far: Machine = newMachine(assemble([[52, 0x01, 0x05, 0x00, 0x03]]));
  const farExit: Exit = step(far);
  assert.deepEqual(farExit, { fault: 0x30000 });
  assert.equal(far.pc, 0); // the machine stays at the instruction that faulted
  const low: Machine = newMachine(assemble([[52, 0x01, 0x00, 0x01]])); // load_u8 r1, [0x0100]
  const lowExit: Exit = step(low);
  assert.equal(lowExit, "panic");
});

test("writing a read-only page faults, and writes nothing", () => {
  const memory: Memory = new Map();
  addPages(memory, 0x10000, 4096, "R");
  // store_imm_u8 [0x10000], 42
  const program: Program = assemble([[30, 0x03, 0x00, 0x00, 0x01, 0x2a]]);
  const exit: Exit = step(newMachine(program, [], memory));
  assert.deepEqual(exit, { fault: 0x10000 });
  const firstByte: number | undefined = memory.get(0x10)?.bytes[0];
  assert.equal(firstByte, 0);
});
```

The first test is the `ind` forms you saw most in the real code ([lesson 15.2](./02-instructions.md)): r1
holds an address, like a stack pointer. `0x80` is 128 unsigned and −128 signed, which in
64 bits is `0xffffffffffffff80`: its sign bit copied into the seven bytes above, `ff` each.

## The code

**New file** `src/pvm/memory.ts`

```ts
// Memory (GP §4, App. A): 2^32 bytes in pages of 4096. Each page is readable, writable
// (and readable), or not there at all.

import type { Bytes } from "../bytes.ts";

/** Z_P: the size of a page. */
export const PAGE_SIZE = 4096;

/** A page's access: R, read only, or W, read and write. Pages not in memory have neither. */
export type Access = "R" | "W";

/** RAM, by page number: only the pages a program can touch are here. */
export type Memory = Map<number, { access: Access; bytes: Uint8Array }>;

/** What can go wrong touching memory: a panic below 2^16, or a fault at a page's address. */
export type MemoryError = "panic" | { fault: number };

/** Makes the pages covering [start, start + length) accessible, zeroed, with `access`. */
export function addPages(memory: Memory, start: number, length: number, access: Access): void {
  const first = Math.floor(start / PAGE_SIZE);
  const last = Math.ceil((start + length) / PAGE_SIZE);
  for (let page = first; page < last; page++) {
    memory.set(page, { access, bytes: new Uint8Array(PAGE_SIZE) });
  }
}

/** The addresses of n bytes from `address`, wrapping round at 2^32 (the GP's ↻). */
function addresses(address: bigint, n: number): number[] {
  return Array.from({ length: n }, (_, k) => Number((address + BigInt(k)) % 2n ** 32n));
}

/** ε^μ (GP App. A.4): the lowest address that can't be used; below 2^16 it's a panic. */
function check(memory: Memory, at: number[], write: boolean): MemoryError | null {
  const bad = at.filter((i) => {
    const page = memory.get(Math.floor(i / PAGE_SIZE));
    return page === undefined || (write && page.access !== "W");
  });
  if (bad.length === 0) return null;
  const lowest = Math.min(...bad);
  if (lowest < 2 ** 16) return "panic";
  return { fault: Math.floor(lowest / PAGE_SIZE) * PAGE_SIZE };
}

/** Reads n bytes from `address`, or says why it can't. */
export function readMemory(memory: Memory, address: bigint, n: number): Bytes | MemoryError {
  const at = addresses(address, n);
  const error = check(memory, at, false);
  if (error) return error;
  return Uint8Array.from(at, (i) => memory.get(Math.floor(i / PAGE_SIZE))!.bytes[i % PAGE_SIZE]);
}

/** Writes `bytes` at `address`, or says why it can't (and writes nothing). */
export function writeMemory(memory: Memory, address: bigint, bytes: Bytes): MemoryError | null {
  const at = addresses(address, bytes.length);
  const error = check(memory, at, true);
  if (error) return error;
  at.forEach((i, k) => {
    memory.get(Math.floor(i / PAGE_SIZE))!.bytes[i % PAGE_SIZE] = bytes[k];
  });
  return null;
}
```

Memory is a `Map` from page number to page, so the 2^32 bytes cost nothing until a page
is added. `check` is ε^μ: it finds every address that can't be used, takes the lowest, and
says panic or fault. Only if every byte is fine is anything read or written. The `!` after
`memory.get(…)` tells TypeScript the page is there: `check` already made sure.

Now the machine. It gets a new way to stop, a memory, and the new family.

**Replace in** `src/pvm/machine.ts`

```ts
/** How a step ends (GP's ε): carry on, finish, fail, or fault on a page of memory. */
export type Exit = "continue" | "halt" | "panic" | { fault: number };

/** The machine's state: the program, ı, the registers φ, and the memory μ. */
export type Machine = {
  program: Program;
  pc: number;
  registers: bigint[];
  memory: Memory;
  blocks: Set<number>;
};

/** A machine at instruction 0, with every register 0 unless given, and no memory unless given. */
export function newMachine(
  program: Program,
  registers: bigint[] = [],
  memory: Memory = new Map(),
): Machine {
  const all = Array.from({ length: 13 }, (_, i) => registers[i] ?? 0n);
  return { program, pc: 0, registers: all, memory, blocks: basicBlocks(program) };
}

/** Every family of instructions built so far. */
const FAMILIES: Family[] = [basics, memoryInstructions];
```

**Add to** `src/pvm/machine.ts`

```ts
import { signExtend } from "./instructions.ts";
import type { Memory, MemoryError } from "./memory.ts";
import { readMemory, writeMemory } from "./memory.ts";
import { decodeFixed, encodeFixed } from "../codec/numbers.ts";

/** A memory error leaves the machine as it was, at the instruction that caused it. */
function failed(m: Machine, ins: Instruction, error: MemoryError): Exit {
  m.pc = ins.at;
  return error;
}

/** Lesson 15.4's instructions: loads and stores, in every width and form. */
function memoryInstructions(m: Machine, ins: Instruction): Exit | undefined {
  const [a, b] = ins.registers;
  const [x, y] = ins.immediates;
  const reg = m.registers;
  const load = /^load_(ind_)?([ui])(8|16|32|64)$/.exec(ins.name);
  if (load) {
    const [, indirect, kind, bits] = load;
    const n = Number(bits) / 8;
    const bytes = readMemory(m.memory, indirect ? reg[b] + x : x, n);
    if (!(bytes instanceof Uint8Array)) return failed(m, ins, bytes);
    const value = decodeFixed(bytes); // little-endian
    reg[a] = kind === "i" ? signExtend(n, value) : value; // load_i… sign-extends
    return "continue";
  }
  const store = /^store_(imm_)?(ind_)?u(8|16|32|64)$/.exec(ins.name);
  if (store) {
    const [, imm, indirect, bits] = store;
    const n = Number(bits) / 8;
    const value = imm ? y : reg[a]; // store_imm… stores an immediate, the others φ_A
    const base = !indirect ? 0n : imm ? reg[a] : reg[b]; // …_ind adds a register
    const bytes = encodeFixed(value % 2n ** BigInt(8 * n), n);
    const error = writeMemory(m.memory, base + x, bytes);
    return error ? failed(m, ins, error) : "continue";
  }
  return undefined;
}
```

Thirty instructions in two `if` statements. A regular expression reads the name, and the
name says everything: `load_ind_i16` is "load, through a register, signed, 16 bits". The
`([ui])` group catches signed or unsigned, `(ind_)?` the indirect form, `(8|16|32|64)`
the width. And `step` hasn't changed at all: that is what
[lesson 15.3](./03-the-machine.md)'s `FAMILIES` is for.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ the reported packages: each one's hash and exports root, sorted by hash (268.9ms)
...
✔ store 8 bytes, load them back, and load one as a signed byte (1.6ms)
✔ no page there: a fault at the page's address; below 2^16: a panic (0.6ms)
...
ℹ tests 407
ℹ suites 0
ℹ pass 407
ℹ fail 0
...
reported 407 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791736620345
...
```

## Watch it

**New file** `bin/memory.ts`

```ts
// Runs two tiny programs on your PVM's memory: one stores 8 bytes and loads them back, the
// other reaches for a page that isn't there.
// Usage: npm run memory

import { toHex } from "../src/bytes.ts";
import { Run } from "../src/obs.ts";
import { HALT_ADDRESS, newMachine, run } from "../src/pvm/machine.ts";
import type { Memory } from "../src/pvm/memory.ts";
import { addPages } from "../src/pvm/memory.ts";
import { assemble } from "../src/pvm/program.ts";

const report = new Run("memory");
const say = (line: string) => {
  console.log(line);
  report.event("memory", { line });
};

const memory: Memory = new Map();
addPages(memory, 0x20000, 4096, "W");
const page = () => toHex((memory.get(0x20) as { bytes: Uint8Array }).bytes.subarray(0, 8));
say(`page 0x20000 before: ${page()}`);
const roundTrip = assemble([[123, 0x12], [130, 0x13], [125, 0x14], [50, 0x00]]);
const machine = newMachine(roundTrip, [HALT_ADDRESS, 0x20000n, 0x1122334455667780n], memory);
say(`run: ${run(machine)}`);
say(`page 0x20000 after:  ${page()}  (little-endian: the lowest byte first)`);
say(`r3 = 0x${machine.registers[3].toString(16)}  (all 8 bytes back)`);
say(`r4 = 0x${machine.registers[4].toString(16)}  (one byte, 0x80, sign-extended: −128)`);

const faulty = newMachine(assemble([[52, 0x01, 0x05, 0x00, 0x03]])); // load_u8 r1, [0x30005]
const exit = run(faulty);
const shown = typeof exit === "object" ? `a fault at 0x${exit.fault.toString(16)}` : exit;
say(`load from 0x30005, where there's no page: ${shown}`);
const link = await report.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

What flows through it:

::: code-group

```text [what goes in]
a writable page at 0x20000, 4096 zeroed bytes, and three preset registers:
  r0 = HALT_ADDRESS   r1 = 0x20000   r2 = 0x1122334455667780
the round-trip program: store_ind_u64 [r1] = r2, load_ind_u64 r3 = [r1],
  load_ind_i8 r4 = [r1], jump_ind r0
then a second machine: load_u8 r1, [0x30005] — and no page is there
```

```ts [what it computes]
// after the round trip: one store, two loads of different widths
const computed = {
  page: "0x8077665544332211", // the 8 bytes at 0x20000: r2's bytes, lowest first
  r3: 0x1122334455667780n, // load_ind_u64: all 8 bytes back, order restored
  r4: -128n, // load_ind_i8: the byte at 0x20000 is 0x80, sign-extended
  fault: 0x30000, // the second machine stops at the missing page's start
};
```

```text [what comes out]
page 0x20000 after:  0x8077665544332211  (little-endian: the lowest byte first)
load from 0x30005, where there's no page: a fault at 0x30000
```

:::

r2's value goes to memory lowest byte first, so the page reads backwards. Loading 8 bytes
undoes the reversal. Loading 1 byte picks up `0x80` alone and sign-extends it to −128. The
second machine's address has no page behind it, and the fault names the page's start,
0x30000, not the byte it reached for.

**Run**

```sh
npm pkg set scripts.memory="node bin/memory.ts"
npm run memory
```

```text
page 0x20000 before: 0x0000000000000000
run: halt
page 0x20000 after:  0x8077665544332211  (little-endian: the lowest byte first)
r3 = 0x1122334455667780  (all 8 bytes back)
r4 = 0xffffffffffffff80  (one byte, 0x80, sign-extended: −128)
load from 0x30005, where there's no page: a fault at 0x30000
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=memory-1791736626608
```

The *Memory* panel, on **6 · The PVM**, has the run.

![Memory panel](./images/04-memory.png)

Store it yourself, then load it back at every width:

<StoreLoad />

<details>
<summary>lasair: loads, in <code>lib/pvm.ml</code></summary>

```ocaml
         (* Loads. A fault reports the unmasked address. *)
         | Load_u8 { ra; addr } -> if load c 1 false ra addr then pc := next else exit := Some (PageFault addr)
         | Load_i8 { ra; addr } -> if load c 1 true ra addr then pc := next else exit := Some (PageFault addr)
```

One line per instruction, thirty of them, where yours reads the name. And the comment
points at a real choice: lasair's fault carries the address it tried, yours the start of
the page, as ε^μ does. Mostly nobody looks: when a service's code runs, any fault counts
as a panic (Ψ_M, [Part 16](../16-host-calls/index.md)). But a machine run *inside* another, by the `invoke` host
call, hands its fault back to the program that ran it, and there the address is part of
the answer.

</details>

## Check your understanding

::: check
**`load_ind_u8` and `load_ind_i8` read the same byte. How can they give different registers?**

- [x] `i8` reads the byte as signed: a set top bit makes it negative, and the bytes above fill with ones
  > Yes: `u8` fills the upper bytes with zeros, `i8` copies the byte's top bit into them.
  > For a byte under 128 they agree.
- [ ] They read different addresses
  > No: same address, same byte. The difference is in how the byte is read.
- [ ] `i8` rounds the byte to a whole number
  > No: bytes are already whole numbers. `i` only means signed.

**A program loads from a page it was never given, at 0x30005. What does the machine report, and why?**

- [ ] A fault at 0x30005, the byte it reached for
  > No: a fault names the page, not the byte: the address rounded down to a multiple of
  > 4,096.
- [ ] A panic: missing memory is a crash
  > No: a panic is for an address below 2^16. Above it, a missing page is a fault.
- [x] A fault at 0x30000, the page's start, with the machine still on the load
  > Yes: whoever runs the machine could add that page and carry on from the same
  > instruction.

**Why is a touch below 2^16 a panic and not a fault?**

- [x] Nothing may live in the first 64 kB, so there is no page anyone could add
  > Yes: a fault says "this page is missing". Down there no page can ever be given, so a
  > near-null pointer is always a crash.
- [ ] The program's code lives there, and code may not be read
  > No: nothing lives there at all.
- [ ] Reads there give zeros, and only a write panics
  > No: missing memory never reads as zeros. A load there panics as a store does.

**A store finds that one of its bytes is not writable. What has changed when the machine stops?**

- [ ] The bytes before the bad one: they were written first
  > No: the check comes first, over every byte. If any can't be written, the machine
  > stops and changes *nothing*.
- [ ] The register holding the address: it is cleared
  > No: no register changes either.
- [x] Nothing: every byte is checked before any is written
  > Yes: the machine stops as it was, on the same instruction. A store to the read-only
  > page at 0x10000 leaves the page as it was, and faults at 0x10000. It is a fault
  > because 0x10000 is 2^16 exactly. A panic is only for addresses *below* 2^16.
:::

## What you have

Memory with pages and permissions, and every load and store, failing exactly as the Gray
Paper says when a program reaches too far. [Lesson 15.5](./05-arithmetic.md) adds the arithmetic.

Next: [15.5 Arithmetic](./05-arithmetic.md)
