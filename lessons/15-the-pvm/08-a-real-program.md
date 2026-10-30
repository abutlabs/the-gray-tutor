# A real program

Every program so far was a handful of bytes you assembled yourself. Now the real thing:
the bootstrap service, a 149,274-byte PVM program from the test vectors' state. It expects
its memory laid out just so before it starts, and sooner or later it asks the outside
world for something, with `ecalli`. Build both and watch a real service wake up and ask
its first question.

## What the Gray Paper says

**`ecalli`** (opcode 10, App. A.5): ε = h × ν_X. The machine stops with a *host call*, and
ν_X says which one. The machine hands back ı pointing *at* the `ecalli`, with registers and
memory as they were. The host answers, by changing registers or memory, and the machine
carries on from the next instruction (Ψ_H, App. A.6). The host calls are numbered in App.
B: `gas` is 0, `grow_heap` 1, `fetch` 2, and so on up to `provide`, 27. [Part 16](../16-host-calls/index.md) and
[Part 17](../17-accumulation/index.md) build the 20 that accumulation uses. The other 8 (`historical_lookup`, `export`, `machine`,
`peek`, `poke`, `pages`, `invoke`, `expunge`) only run in refine, on the cores, which a
block importer never does.

**Y** (App. A.7) turns a standard program ([lesson 15.1](./01-the-program-blob.md) unpacked its parts: o, w, z, s and
the code) and some argument bytes a into a starting memory and registers. Memory is laid
out in *zones* of Z_Z = 2^16 bytes, with an empty zone between sections, so a program that
runs off the end of one section hits nothing at all instead of the next one:

| From | What | Access |
| --- | --- | --- |
| 2^16 | o, the read-only data, padded with zeros to a whole page | R |
| 2 · 2^16 + Z(\|o\|) | w, the read-write data, padded to a page, then z pages of heap | W |
| below 2^32 − 2 · 2^16 − 2^24 | the stack: s bytes rounded up to pages | W |
| 2^32 − 2^16 − 2^24 | the arguments a, at most Z_I = 2^24 bytes, padded to a page | R |

P rounds up to whole pages, Z to whole zones (not to be confused with Z_Z, a zone's size).
Everything else isn't there: touch it and the machine faults, or panics below 2^16
([lesson 15.4](./04-memory.md)).

Lay out the test's tiny program or the real service, or sizes of your own:

<YLayout />

And the registers: r0 = 2^32 − 2^16, the halt address ([lesson 15.3](./03-the-machine.md)), so that when the
program returns, it ends. r1 = the top of the stack, which grows down. r7 = where the
arguments are, r8 = how many bytes. Every other register starts at 0.

**Where to start.** A program has more than one way in. App. B starts authorization and
refinement at instruction 0, and accumulation at 5, with the arguments E(t, s, |i|): the
slot, the service's id, and how many inputs it has, each a compact natural ([lesson 2.2](../02-codec/02-compact-naturals.md)).

## The tests

**New file** `test/standard.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { encodeNatural } from "../src/codec/numbers.ts";
import { HALT_ADDRESS, newMachine, run, step } from "../src/pvm/machine.ts";
import { readMemory, writeMemory } from "../src/pvm/memory.ts";
import { assemble, deblob, unpackCode } from "../src/pvm/program.ts";
import { standardProgram } from "../src/pvm/standard.ts";
import { bootstrapCode } from "./vectors.ts";
import type { Bytes } from "../src/bytes.ts";
import type { MemoryError } from "../src/pvm/memory.ts";
import type { Exit, Machine } from "../src/pvm/machine.ts";
import type { ServiceCode } from "../src/pvm/program.ts";

/** A tiny standard program: 3 bytes of o, 2 of w, a page of heap, 100 bytes of stack. */
const TINY_PROGRAM = {
  metadata: new Uint8Array(0),
  readOnly: Uint8Array.from([1, 2, 3]),
  readWrite: Uint8Array.from([4, 5]),
  heapPages: 1,
  stackSize: 100,
  program: new Uint8Array(0),
};

test("Y lays out memory: o a zone up, w a zone after it, the stack and arguments up top", () => {
  const { memory } = standardProgram(TINY_PROGRAM, Uint8Array.from([9]));
  const o: Bytes | MemoryError = readMemory(memory, 0x10000n, 3);
  assert.deepEqual(o, Uint8Array.from([1, 2, 3]));
  const zero: Bytes = Uint8Array.of(0);
  const intoO: MemoryError | null = writeMemory(memory, 0x10000n, zero); // o is read only
  assert.deepEqual(intoO, { fault: 0x10000 });
  const w: Bytes | MemoryError = readMemory(memory, 0x30000n, 2);
  assert.deepEqual(w, Uint8Array.from([4, 5]));
  // the heap page, after w's page
  const intoHeap: MemoryError | null = writeMemory(memory, 0x31fffn, zero);
  assert.equal(intoHeap, null);
  const intoStack: MemoryError | null = writeMemory(memory, 0xfefdf000n, zero); // its one page
  assert.equal(intoStack, null);
  const args: Bytes | MemoryError = readMemory(memory, 0xfeff0000n, 1);
  assert.deepEqual(args, Uint8Array.from([9]));
  const gap: Bytes | MemoryError = readMemory(memory, 0x32000n, 1); // and gaps between
  assert.deepEqual(gap, { fault: 0x32000 });
});

test("Y's registers: the halt address, the stack pointer, and where the arguments are", () => {
  const { registers } = standardProgram(TINY_PROGRAM, Uint8Array.from([9]));
  assert.equal(registers[0], HALT_ADDRESS);
  assert.equal(registers[1], 0xfefe0000n); // 2^32 − 2·2^16 − 2^24: the top of the stack
  assert.equal(registers[7], 0xfeff0000n); // 2^32 − 2^16 − 2^24
  assert.equal(registers[8], 1n);
});

test("ecalli stops the machine to call the host, and stays on the ecalli", () => {
  const machine: Machine = newMachine(assemble([[10, 2]])); // ecalli 2
  const exit: Exit = step(machine);
  assert.deepEqual(exit, { host: 2 });
  assert.equal(machine.pc, 0);
});

test("a real service starts: the bootstrap service runs until it calls fetch", () => {
  const code: ServiceCode = unpackCode(bootstrapCode());
  const args: Bytes = Uint8Array.from([
    ...encodeNatural(1n),
    ...encodeNatural(0n),
    ...encodeNatural(0n),
  ]);
  const { memory, registers } = standardProgram(code, args); // slot 1, service 0, 0 inputs
  const machine: Machine = newMachine(deblob(code.program), registers, memory);
  machine.pc = 5; // where accumulation starts
  const exit: Exit = run(machine);
  assert.deepEqual(exit, { host: 2 }); // host call 2 is fetch
  assert.equal(machine.registers[10], 0n); // asking for item 0: the protocol constants
});
```

`TINY_PROGRAM` has every part, each as small as it can be, so the addresses are easy to
work out by hand. o is one zone up, at 0x10000. It's 3 bytes, so Z(3) is one zone, and w
starts at 2 · 0x10000 + 0x10000 = 0x30000: one page for w, then one of heap. The stack's
top is 2^32 − 2 · 2^16 − 2^24 = 0xfefe0000, with one page below it. The last test runs the
real thing: the bootstrap service, entered at 5 with slot 1, service 0 and no inputs.

## The code

**New file** `src/pvm/standard.ts`

```ts
// The standard program (GP App. A.7, Y): how a service's program starts. Its data, heap,
// stack and arguments are laid out in memory, and a few registers say where things are.

import type { Bytes } from "../bytes.ts";
import type { Memory } from "./memory.ts";
import { addPages, PAGE_SIZE } from "./memory.ts";
import type { ServiceCode } from "./program.ts";

/** Z_Z: memory is laid out in zones of 64 KiB. */
export const ZONE = 2 ** 16;
/** Z_I: room for up to 16 MiB of arguments. */
export const INPUT_SIZE = 2 ** 24;

/** x rounded up to a whole number of `size`s: the GP's P (pages) and Q (zones). */
const roundUp = (x: number, size: number) => Math.ceil(x / size) * size;

/** Copies bytes into memory at `address`, whatever the pages allow: setting up is allowed. */
function place(memory: Memory, address: number, bytes: Bytes): void {
  bytes.forEach((byte, k) => {
    const i = address + k;
    memory.get(Math.floor(i / PAGE_SIZE))!.bytes[i % PAGE_SIZE] = byte;
  });
}

/** Y (GP App. A.7): a standard program's memory and registers at the start, given arguments. */
export function standardProgram(code: ServiceCode, args: Bytes) {
  const { readOnly, readWrite, heapPages, stackSize } = code;
  const memory: Memory = new Map();
  addPages(memory, ZONE, readOnly.length, "R"); // o, one zone up
  place(memory, ZONE, readOnly);
  const heap = 2 * ZONE + roundUp(readOnly.length, ZONE); // w, a zone after o's zones
  addPages(memory, heap, roundUp(readWrite.length, PAGE_SIZE) + heapPages * PAGE_SIZE, "W");
  place(memory, heap, readWrite);
  const stackTop = 2 ** 32 - 2 * ZONE - INPUT_SIZE; // the stack grows down from here
  const stack = roundUp(stackSize, PAGE_SIZE);
  addPages(memory, stackTop - stack, stack, "W");
  const input = 2 ** 32 - ZONE - INPUT_SIZE; // the arguments, read only
  addPages(memory, input, args.length, "R");
  place(memory, input, args);
  const registers = Array<bigint>(13).fill(0n);
  registers[0] = 2n ** 32n - 2n ** 16n; // the halt address: returning from the program ends it
  registers[1] = BigInt(stackTop); // the stack pointer
  registers[7] = BigInt(input); // where the arguments are,
  registers[8] = BigInt(args.length); // and how long they are
  return { memory, registers };
}
```

Y, a line of code for each row of the table. `place` writes bytes in without asking the
pages' permission: o is read only *for the program*, not for whoever sets it up.

> [!NOTE]
> **The simple road.** Y has an answer only if every section fits: the zones, o, w with
> its heap, the stack and the arguments must add up to no more than 2^32 bytes, and the
> arguments must fit in Z_I. If not, the machine panics without running anything.
> `standardProgram` lays out whatever it's given, which is fine for the real service
> here; the [hardening pass](https://github.com/abutlabs/the-gray-tutor/blob/main/HARDENING.md) adds the check, since a service's code comes from
> anyone.

Now the machine learns its last instruction. A host call is a new way to stop:

**Replace in** `src/pvm/machine.ts`

```ts
/** How a step ends (GP's ε): carry on, finish, fail, fault on a page, or call the host. */
export type Exit = "continue" | "halt" | "panic" | { fault: number } | { host: number };

/** Ψ, without gas yet: steps until the machine halts, panics, faults or calls the host. */
export function run(m: Machine): Exit {
  for (;;) {
    const exit = step(m);
    if (exit !== "continue") return exit;
  }
}

/** Every family of instructions built so far. */
const FAMILIES: Family[] = [
  basics,
  memoryInstructions,
  arithmetic,
  decisions,
  bitsAndBytes,
  hostCall,
];
```

**Add to** `src/pvm/machine.ts`

```ts
/** Lesson 15.8's instruction: ecalli stops the machine, to ask the host for something. */
function hostCall(m: Machine, ins: Instruction): Exit | undefined {
  if (ins.name !== "ecalli") return undefined;
  m.pc = ins.at; // ı stays on the ecalli; the host moves it on once it has answered
  return { host: Number(ins.immediates[0]) };
}
```

TypeScript now spots something in [lesson 15.4](./04-memory.md)'s `bin/memory.ts`. It reads `exit.fault`
from any exit that's an object, and a host call is an object too. Ask which it is, with
`in`:

**Replace in** `bin/memory.ts`

```ts
const shown =
  typeof exit === "object" && "fault" in exit ? `a fault at 0x${exit.fault.toString(16)}` : exit;
say(`load from 0x30005, where there's no page: ${shown}`);
```

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ the reported packages: each one's hash and exports root, sorted by hash (206.8ms)
...
✔ Y lays out memory: o a zone up, w a zone after it, the stack and arguments up top (1.2ms)
✔ Y's registers: the halt address, the stack pointer, and where the arguments are (0.2ms)
✔ ecalli stops the machine to call the host, and stays on the ecalli (0.6ms)
✔ a real service starts: the bootstrap service runs until it calls fetch (50.1ms)
...
ℹ tests 431
ℹ suites 0
ℹ pass 431
ℹ fail 0
...
reported 431 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791736885963
...
```

## Watch it

**New file** `bin/start.ts`

```ts
// Starts a real service: the bootstrap service, from the state before the first block of
// the fallback trace. Y lays out its memory and registers, and the machine runs from
// accumulation's entry point until the program calls the host.
// Usage: npm run start

import { readFileSync } from "node:fs";
import { fromHex } from "../src/bytes.ts";
import { encodeNatural } from "../src/codec/numbers.ts";
import { Run } from "../src/obs.ts";
import { decodeInstruction } from "../src/pvm/instructions.ts";
import { newMachine, step } from "../src/pvm/machine.ts";
import { PAGE_SIZE } from "../src/pvm/memory.ts";
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

const run = new Run("start");
const say = (line: string) => {
  console.log(line);
  run.event("line", { line });
};
const hex = (x: number | bigint) => `0x${x.toString(16).padStart(8, "0")}`;

// Accumulation's arguments (GP App. B): the slot, the service, and how many inputs.
const args = Uint8Array.from([...encodeNatural(1n), ...encodeNatural(0n), ...encodeNatural(0n)]);
const { memory, registers } = standardProgram(code, args);
say("memory, as Y lays it out:");
const pages = [...memory.keys()].sort((a, b) => a - b);
let first = pages[0]; // the first page of a run of pages with the same access
pages.forEach((page, i) => {
  const next = pages[i + 1];
  const access = memory.get(page)!.access;
  if (next === page + 1 && memory.get(next)!.access === access) return; // the run goes on
  const [from, to] = [hex(first * PAGE_SIZE), hex((page + 1) * PAGE_SIZE - 1)];
  say(`  ${from} to ${to}  ${access}  ${page - first + 1} page(s)`);
  first = next;
});
const [r0, r1, r7, r8] = [0, 1, 7, 8].map((r) => registers[r]);
say(`registers: r0 = ${hex(r0)}, r1 = ${hex(r1)}, r7 = ${hex(r7)}, r8 = ${r8}`);

const program = deblob(code.program);
const machine = newMachine(program, registers, memory);
machine.pc = 5; // where accumulation starts
for (let n = 1; ; n++) {
  const at = machine.pc;
  const { name } = decodeInstruction(program, at);
  const exit = step(machine);
  say(`step ${String(n).padStart(2)}  at ${String(at).padStart(6)}  ${name}`);
  if (exit !== "continue") {
    say(`the machine stops: ${JSON.stringify(exit)}, with r10 = ${machine.registers[10]}`);
    break;
  }
}
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

**What flows through it.** One run, three faces — the code and arguments going in, the
world Y builds for them, and the lines printed. Tab across them:

::: code-group

```text [what goes in]
service 0's unpacked code — the 159,322-byte preimage of the fallback trace —
and accumulation's argument blob, three compact naturals:
  01 00 00   the slot, 1; the service, 0; its inputs, 0
Y turns those into memory and registers; the machine starts at byte 5
```

```ts [what it computes]
// what Y laid out, before the first step
const computed = {
  readOnly: "0x00010000, 3 pages R", // the program's constant data
  stack: "0xfefde000, 2 pages W", // ending under r1, the stack pointer
  args: "0xfeff0000, 1 page R", // the 3 argument bytes, where r7 points
  r8: 3n, // the arguments' length
  stops: '{"host":2}', // step 38, ecalli 2: the fetch host call
};
```

```text [what comes out]
registers: r0 = 0xffff0000, r1 = 0xfefe0000, r7 = 0xfeff0000, r8 = 3
the machine stops: {"host":2}, with r10 = 0
```

:::

Read the input into the output: the three argument bytes end up in memory at
`0xfeff0000`, and r7 and r8 point the program at them — address and length. r0 holds
the halt address, r1 the top of Y's stack. Thirty-eight steps later the program asks
the host its first question, `ecalli 2`, and everything it knows it read from those
pages.

**Run**

```sh
npm pkg set scripts.start="node bin/start.ts"
npm run start
```

```text
memory, as Y lays it out:
  0x00010000 to 0x00012fff  R  3 page(s)
  0x00030000 to 0x00032fff  W  3 page(s)
  0xfefde000 to 0xfefdffff  W  2 page(s)
  0xfeff0000 to 0xfeff0fff  R  1 page(s)
registers: r0 = 0xffff0000, r1 = 0xfefe0000, r7 = 0xfeff0000, r8 = 3
step  1  at      5  jump
step  2  at  92078  add_imm_64
step  3  at  92082  store_ind_u64
step  4  at  92086  store_ind_u64
step  5  at  92090  store_ind_u64
step  6  at  92094  move_reg
step  7  at  92096  move_reg
step  8  at  92098  load_imm_jump
step  9  at 123687  add_imm_64
step 10  at 123691  store_ind_u64
step 11  at 123695  store_ind_u64
step 12  at 123699  store_ind_u64
step 13  at 123703  store_imm_ind_u64
step 14  at 123707  add_imm_64
step 15  at 123711  add_imm_64
step 16  at 123715  load_imm_jump
...
step 38  at 121489  ecalli
the machine stops: {"host":2}, with r10 = 0
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=start-1791736891343
```

Four sections, with empty zones between them, as the table said. Then 38 steps of real
compiled code. Step 1 jumps from 5 into the program. Step 2 moves the stack pointer r1
down by 1,440 bytes, and steps 3 to 5 save registers there: Y's stack pages, in use
already. Step 8 is a `load_imm_jump`, a call, leaving the way back in
r0 exactly as in [lesson 15.6](./06-branches-and-calls.md), and step 16 is another. Step 38 is `ecalli 2`: `fetch`. And
r10 = 0 says what it wants: in `fetch`'s table, item 0 is the chain's protocol constants.
The service's first question is "what are the rules here?" Fair enough. The *A real
program starts* panel, on **6 · The PVM**, has the whole run.

![A real program starts panel](./images/08-a-real-program-starts.png)

<details>
<summary>lasair: <code>init_registers</code>, in <code>lib/pvm_program.ml</code></summary>

```ocaml
let init_registers (args : bytes) : int64 array =
  let regs = Array.make 13 0L in
  regs.(0) <- Int64.of_int (0x100000000 - 0x10000);  (* RA = 2^32 - 64KB *)
  regs.(1) <- Int64.of_int (0x100000000 - 2 * init_zone_size - init_input_size);  (* SP *)
  regs.(7) <- Int64.of_int (0x100000000 - init_zone_size - init_input_size);  (* A0 = args ptr *)
  regs.(8) <- Int64.of_int (Bytes.length args);  (* A1 = args len *)
  regs
```

RA, SP, A0, A1: lasair's comments use the register names from RISC-V, the instruction set
the PVM is based on. The return address, the stack pointer, the first two arguments: the
same jobs your registers 0, 1, 7 and 8 do. lasair also checks Y's size rule, the one the
note above leaves for the [hardening pass](https://github.com/abutlabs/the-gray-tutor/blob/main/HARDENING.md).

</details>

## Check your understanding

::: check
**`ecalli 2` stops the machine. Where is ı?**

- [ ] At the next instruction, so the program carries on by itself
  > No: the machine stops and hands over to the host, and it carries on only once the
  > host has answered.
- [x] On the `ecalli` itself, until the host has answered
  > Yes: registers and memory are as they were. The host changes what it must, then the
  > machine carries on from the next instruction.
- [ ] At jump-table address 2
  > No: the 2 isn't a place in the program. It says which host call: 2 is `fetch`.

**Why does Y leave an empty zone between the sections of memory?**

- [x] A program that runs off the end of one section hits nothing, not the next section
  > Yes: an overrun faults or panics, instead of quietly reading or writing other data.
- [ ] Pages have to be 64 kB apart
  > No: pages are 4,096 bytes, and inside a section they sit side by side: w and its heap
  > page at 0x30000 and 0x31000.
- [ ] It makes memory faster to reach
  > No: every address is reached the same way. The gaps are for safety, not speed.

**`TINY_PROGRAM`'s o is 3 bytes, at 0x10000. Where does Y put w?**

- [ ] 0x11000, the page after o's
  > No: sections never touch. An empty zone separates o from w.
- [ ] 0x20000, the zone after o's
  > No: 0x20000 starts the empty zone. o's 3 bytes, rounded up, take the zone from
  > 0x10000 to 0x1ffff, and the next zone is the gap.
- [x] 0x30000
  > Yes: 2 · 2^16 + Z(3) = 0x20000 + 0x10000. o's zone, then a gap, then w.

**The bootstrap service starts with r8 = 3. What is the 3?**

- [ ] The service has three inputs
  > No: it has none. r8 counts bytes of arguments.
- [x] Three bytes of arguments: slot 1, service 0 and 0 inputs, each a one-byte compact natural
  > Yes: E(t, s, |i|) is `01 00 00`, and r7 says where it is, 0xfeff0000.
- [ ] It's service 3
  > No: it's service 0. r8 is the arguments' length.
:::

## What you have

A machine that runs every instruction in the Gray Paper, and a real service started on
it, right up to its first question for the host. Answering that question is [Part 16](../16-host-calls/index.md).
Before that, the machine needs to charge for its work, or a program could run forever:
[lesson 15.9](./09-what-instructions-cost.md) prices every instruction.

Next: [15.9 What instructions cost](./09-what-instructions-cost.md)
