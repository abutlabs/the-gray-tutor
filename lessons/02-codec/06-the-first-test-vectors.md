# The first test vectors

Exam day. Your codec meets the official test vectors, the same ones every JAM team
checks against. Their `codec/` folder holds JAM structures twice over: as JSON, and as
the exact bytes ℰ produces. Decode the bytes into the JSON's values, encode those values
back into the very same bytes, and your codec agrees with every other client's. No
partial credit.

Everything in [Part 2](./index.md) gets used here: [lesson 2.1](./01-fixed-width-integers.md)'s fixed widths, [lesson 2.2](./02-compact-naturals.md)'s compact
naturals, [lesson 2.3](./03-writer-and-reader.md)'s Writer and Reader, and lessons [2.4](./04-codecs.md) and [2.5](./05-sequences-and-records.md)'s codecs, sequences
and records.

## New words

- **Hex dump.** A file's bytes printed as hex, a few to a line, to read them by eye.
  *Example:* `04 03 02 01 70 a5 08 29`.
- **Round trip.** Decode the bytes, encode the result, and check you got the very same
  bytes back. *Example:* `work_item.bin` → a work item → `work_item.bin` again.
- **Tiny and full.** JAM's two configurations, with the same rules: *full* is a realistic
  picture of the future network, with the Gray Paper's own numbers; *tiny* is small enough
  to run on your own machine (6 validators, 2 cores). *Example:* `codec/tiny/` and
  `codec/full/`.
- **Segment.** A 4,104-byte piece of data that a work-item exports, for later
  work-packages to import. *Example:* the `work_item` vector's item exports 4.
- **Vector family.** One kind of test vector, in a folder of its own, all checked the same
  way. *Example:* `codec`, and later `stf/safrole` and `traces/fallback`.
- **Scoreboard.** Your client's tally of every official test vector, each one run whole.
  *Example:* after this lesson, 4 of 1,428 pass.

All six are in the [glossary](../glossary.md), next to *test vector*.

## Look at one

From `client/`, the vectors are at `../vectors/`. A small program to show a file's bytes
in hex will be handy for every vector from here on:

**New file** `bin/hexdump.ts`

```ts
// Prints the first bytes of a file in hex, 16 to a line.
// Usage: npm run hexdump <file> [how many bytes, 64 if not given]

import { readFileSync } from "node:fs";

const [file, count = "64"] = process.argv.slice(2);
if (!file) throw new Error("usage: npm run hexdump <file> [count]");
const bytes = readFileSync(file).subarray(0, Number(count));
for (let i = 0; i < bytes.length; i += 16) {
  console.log([...bytes.subarray(i, i + 16)].map((b) => b.toString(16).padStart(2, "0")).join(" "));
}
```

You give it a file and how many bytes to show from the start: `48` shows the first 48,
and leaving the number off shows 64. The work item's file is 236 bytes. Show its first 52,
which is exactly its first four fields: 4 + 32 + 8 + 8 bytes.

A script can carry its words too. `hexdump` takes any file; `hexdump-work-item` is this
one run, the file and the 52 built in, so `npm run hexdump-work-item` shows it again
whenever you like. Every run in the lessons that names a file gets a script like this,
named for what it shows. By the end, `npm run` on its own lists them all: a menu of
everything your client can show, with nothing to retype.

What flows through this run:

::: code-group

```text [what goes in]
../vectors/codec/tiny/work_item.bin    236 bytes: the work item, encoded
52                                     how many to show — its first four fields exactly
```

```ts [what it computes]
const dump = {
  file: "../vectors/codec/tiny/work_item.bin", // argv: whose bytes
  count: 52, // argv: 4 + 32 + 8 + 8, the first four fields
  rows: 4, // 16 bytes to a line: three full rows, then one of 4
};
```

```text [what comes out]
04 03 02 01 70 a5 08 29 85 1e 8f 6a 8c 80 f9 28
```

:::

The first row of the dump: `service`'s four bytes, then the first twelve of
`code_hash`. The run below also prints the item's JSON first, so you can read each
field's bytes against its name.

**Run**

```sh
npm pkg set scripts.hexdump="node bin/hexdump.ts"
npm pkg set scripts.hexdump-work-item="node bin/hexdump.ts ../vectors/codec/tiny/work_item.bin 52"
cat ../vectors/codec/tiny/work_item.json
npm run hexdump-work-item
```

```text
{
    "service": 16909060,
    "code_hash": "0x70a50829851e8f6a8c80f92806ae0e95eb7c06ad064e311cc39107b3219e532e",
    "refine_gas_limit": 42,
...
04 03 02 01 70 a5 08 29 85 1e 8f 6a 8c 80 f9 28
06 ae 0e 95 eb 7c 06 ad 06 4e 31 1c c3 91 07 b3
21 9e 53 2e 2a 00 00 00 00 00 00 00 2a 00 00 00
00 00 00 00
```

![The work item's first 60 bytes, field after field: service 16909060 as 04 03 02 01 (ℰ₄), code_hash as its 32 bytes, both gas limits 42 as 2a and seven zeros (ℰ₈), export_count 4 as 04 00 (ℰ₂), and the payload as its length 5 then its five bytes, with 176 more bytes after](./images/06-work-item-bytes.svg)

The two files are the same work item. The `.json` is the item written out for people,
with each field's name. The `.bin` is the same item encoded, the bytes a client decodes.
The bytes follow the JSON's fields in order, each one encoded the way
[lesson 2.1](./01-fixed-width-integers.md) to [lesson 2.5](./05-sequences-and-records.md) taught, and nothing else: no names, and no
lengths for fields whose size never changes.

Read the first bytes against the JSON:

- `04 03 02 01` is `service`, 16909060, as ℰ₄. In hex 16909060 is `0x01020304`, written
  least significant byte first.
- The next 32 bytes, `70 a5 08 29 ...`, are `code_hash`, as they are.
- `2a 00 00 00 00 00 00 00` is `refine_gas_limit`, 42, as ℰ₈.
- The last eight are `accumulate_gas_limit`, also 42 as ℰ₈: `2a 00 00 00` at the end of
  the third row, and `00 00 00 00` on the fourth. A row is just 16 bytes, so a field can
  run on into the next one.

The `tiny` and `full` folders hold the same structures in JAM's two configurations. Tiny
(6 validators, 2 cores) is what tests run fast with, and full uses the Gray Paper's own
numbers. For the structures in this lesson the two are identical, and later
ones differ.

Here is the whole work item, all 236 bytes, beside its JSON. Tap a field to light up its
bytes and see the rule that wrote them, on its real value. Tap a byte to find its field.
The amber bytes are the only lengths in the file: the payload's, and how many items each
list holds.

<VectorMap />

## A helper for vectors

**New file** `test/vectors.ts`

```ts
// The official test vectors, in vectors/ at the repo root (npm run vectors there).

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { Bytes } from "../src/bytes.ts";
import type { Codec } from "../src/codec/codec.ts";
import { decode, encode } from "../src/codec/codec.ts";

/** The official test vectors' folder: vectors/, at the repo root. */
export const VECTORS = fileURLToPath(new URL("../../vectors/", import.meta.url));

/** A vector file's JSON, by its name in vectors/, such as "codec/tiny/work_item.json". */
export function vectorJson(name: string): unknown {
  return JSON.parse(readFileSync(VECTORS + name, "utf8"));
}

/** A vector file's bytes. */
export function vectorBytes(name: string): Bytes {
  return new Uint8Array(readFileSync(VECTORS + name));
}

/** A codec vector: the .bin decodes to the .json's value, which encodes back to the .bin. */
export function checkCodecVector<T>(codec: Codec<T>, name: string): void {
  const bytes: Bytes = vectorBytes(`${name}.bin`);
  const expected: T = codec.fromJson(vectorJson(`${name}.json`));
  const decoded: T = decode(codec, bytes);
  assert.deepEqual(decoded, expected);
  const encoded: Bytes = encode(codec, expected);
  assert.deepEqual(encoded, bytes);
}
```

`new URL("../../vectors/", import.meta.url)` finds the folder relative to *this file*,
so the tests work from wherever you run them. `readFileSync` hands back a Node `Buffer`;
`new Uint8Array(...)` turns it into a plain `Uint8Array`, because `deepEqual` insists the
two things it compares are the same kind of thing. `VECTORS` is exported for the
scoreboard at the end of this lesson, which walks the whole folder.

`checkCodecVector` is the exam itself: the bytes must decode to the JSON's value, and
that value must encode back to the very same bytes.

Its name doesn't end in `.test.ts`, so `npm test`'s pattern leaves it out: it is a
helper the tests import. (`test/grafana.ts` is left out the same way: it's the reporter
`npm test` loads, not a test.)

## The structures

Two structures from the Gray Paper, both about *work*: what a service asks a core to
compute. You'll get to know them properly in [Part 3](../03-work-and-reports/index.md). Today they're just shapes to
encode.

**The refinement context** (§11, *Refinement Context*) describes the chain as a
work-package saw it: an *anchor*, a recent block with its slot, state root and
accumulation-output root, and a *lookup anchor*, the block whose state its code reads
preimages from, again with its slot and state root. Last come the hashes of any
work-packages that must be accumulated first.

**A work item** (§14, *Packages and Items*) is one job inside a work-package: the
service it is for, that service's code hash, the gas limits for its two stages, a
payload, the data segments it imports and how many it exports, and the extrinsic data
it carries.

Write the fields in the order **Appendix C encodes them**, not the order the definitions
list them. They differ: §14 lists a work item's payload third, but Appendix C encodes it
after the gas limits and the export count. The encoding is what the bytes follow, and
the test vectors' JSON lists fields in that order too.

**New file** `test/work.test.ts`

```ts
import { test } from "node:test";
import { RefineContext, WorkItem } from "../src/work.ts";
import { checkCodecVector } from "./vectors.ts";

for (const spec of ["tiny", "full"]) {
  const dir = `codec/${spec}`;
  test(`refine_context (${spec})`, () => checkCodecVector(RefineContext, `${dir}/refine_context`));
  test(`work_item (${spec})`, () => checkCodecVector(WorkItem, `${dir}/work_item`));
}
```

**New file** `src/work.ts`

```ts
// Work: what services ask the cores to compute (GP §11, §14).

import type { Value } from "./codec/codec.ts";
import { blob, hash, record, seq, u16, u32, u64 } from "./codec/codec.ts";

/** The refinement context (GP §11): the chain as a work-package saw it. */
export const RefineContext = record({
  anchor: hash, // a recent block's header hash
  anchor_slot: u32,
  state_root: hash, // the anchor's posterior state root
  beefy_root: hash, // the anchor's accumulation-output super-peak
  lookup_anchor: hash, // the block whose state refine reads preimages from
  lookup_anchor_slot: u32,
  lookup_anchor_state_root: hash,
  prerequisites: seq(hash), // work-packages to accumulate first
});
export type RefineContext = Value<typeof RefineContext>;

/** A data segment to import: which set of segments (by its root), and which one in it. */
export const ImportSpec = record({
  tree_root: hash,
  index: u16,
});
export type ImportSpec = Value<typeof ImportSpec>;

/** Extrinsic data a work item carries: its hash and length. */
export const ExtrinsicSpec = record({
  hash: hash,
  len: u32,
});
export type ExtrinsicSpec = Value<typeof ExtrinsicSpec>;

/** A work item (GP §14): one job in a work-package, for one service. */
export const WorkItem = record({
  service: u32,
  code_hash: hash,
  refine_gas_limit: u64,
  accumulate_gas_limit: u64,
  export_count: u16,
  payload: blob,
  import_segments: seq(ImportSpec),
  extrinsic: seq(ExtrinsicSpec),
});
export type WorkItem = Value<typeof WorkItem>;
```

Hover over `RefineContext` in VS Code: its type is spelled out field by field, and you
never wrote it. The codec did.

What the scoreboard is chewing on: each codec vector is one JSON file and its `.bin` twin, and "run whole" means decode the bytes, encode the result, and get the same bytes back. One of the vectors it can't pass yet, an assurances extrinsic:

::: code-group

```json [what goes in]
{
  "vector": "vectors/codec/full/assurances_extrinsic.json",
  "[0]": {
    "anchor": "0x0cffbf67aa\u2026",
    "bitfield": "0x5555555555555555\u2026",
    "validator_index": 0,
    "signature": "0x2d8ec7b235\u2026"
  },
  "\u2026": "the rest of the assurances"
}
```

```text [console]
codec                     4 of 30
    ✘ codec/full/assurances_extrinsic.json: no codec for assurances_extrinsic yet
4 of 1,428 vectors pass.
```

:::

The first row of that file is a real assurance, and the console row above names the file by path: with no assurances codec yet, that vector fails with the reason printed, and the family stays at 4 of 30 until it can round-trip every one.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ refine_context (tiny) (3.2ms)
✔ work_item (tiny) (0.4ms)
✔ refine_context (full) (1.1ms)
✔ work_item (full) (0.8ms)
...
ℹ tests 21
ℹ suites 0
ℹ pass 21
ℹ fail 0
...
reported 21 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791726654352
...
```

All four pass: tiny and full, both structures. Your codec reproduces the official
encoding, byte for byte. That's a real JAM milestone, however small: a client written
from the Gray Paper alone agreeing with the reference. Enjoy it.

## Break it on purpose

To see what a mismatch looks like, move `export_count` in `WorkItem` up, above the two
gas limits, and run `npm test`. The work_item tests fail with a diff (`+` is what your
code decoded, `-` is the vector's JSON):

```text
+   accumulate_gas_limit: 1125899906842624n,
-   accumulate_gas_limit: 42n,
+   export_count: 42,
-   export_count: 4,
+   refine_gas_limit: 11821949021847552n,
-   refine_gas_limit: 42n,
```

The decoder took the first 2 bytes of the refine gas limit (`2a 00`) as the export
count, 42, and each gas limit then started 2 bytes late, which makes them huge. The
three fields together are still 18 bytes, so the payload and everything after it still
line up and decode correctly. Move `export_count` below `payload` instead, and everything
from `payload` on goes wrong. Put `export_count` back before going on.

## The scoreboard

Four vectors pass. Out of how many? Every JAM team keeps the same tally, so keep one too:
a program that runs every official vector and counts.

The vectors come in families, a folder each. `codec/` holds structures like today's.
`stf/` holds the rules that change the chain's state, a family per rule (`stf/safrole`,
`stf/disputes`...). `traces/` holds whole runs of real blocks, and a few smaller families
sit beside them. A family's vectors are all checked the same way; for `codec`, it's the
round trip you just wrote.

On the scoreboard a vector is run **whole**: your client's answer must be all of the
vector's answer, not part of it. Many tests in this tutorial check one piece of a vector,
which is the right way to build. The scoreboard is stricter: a vector counts only once
nothing in it differs.

**New file** `test/families.ts`

```ts
// The official test vectors, family by family, each run whole: your client's answer to a
// vector must be all of the vector's answer. bin/scoreboard.ts runs them and counts.

import assert from "node:assert/strict";
import type { Codec } from "../src/codec/codec.ts";
import { RefineContext, WorkItem } from "../src/work.ts";
import { checkCodecVector } from "./vectors.ts";

/** A family of official vectors: the folders of vectors/ it fills, and a check that runs
 * one vector whole and throws if your client's answer differs from it anywhere. */
export type Family = { folders: string[]; check: (name: string) => void };

/** Every family your client runs so far. */
export const FAMILIES: Family[] = [
  { folders: ["codec/tiny", "codec/full"], check: checkCodec },
];

/** The codecs for the codec vectors so far, by the vectors' names for the structures. */
const CODECS: Record<string, Codec<unknown>> = {
  refine_context: RefineContext,
  work_item: WorkItem,
};

/** A codec vector, such as "codec/tiny/work_item.json", by its round trip. */
function checkCodec(name: string) {
  const structure = name.split("/").at(-1)!.replace(".json", "");
  const codec = CODECS[structure];
  assert.ok(codec, `no codec for ${structure} yet`);
  checkCodecVector(codec, name.replace(".json", ""));
}
```

`FAMILIES` is the list of families your client can run, one so far. `CODECS` picks the
codec for each codec vector by its file's name; a structure you haven't written yet fails
with a reason, `no codec for block yet`, instead of a crash.

**New file** `bin/scoreboard.ts`

```ts
// The scoreboard: every official test vector, run whole by the family your client has for
// it, and counted. A vector passes only if your client's answer is all of the vector's.
// Usage: npm run scoreboard

import { readdirSync } from "node:fs";
import { Run } from "../src/obs.ts";
import { FAMILIES } from "../test/families.ts";
import { VECTORS } from "../test/vectors.ts";

/** Every folder of vectors/ that holds vectors, with their names ("codec/tiny/block.json").
 * A trace's genesis.json is the state it starts from, not a step, so not a vector. */
function folders(dir = ""): { folder: string; names: string[] }[] {
  const entries = readdirSync(VECTORS + dir, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name));
  const names = entries
    .filter((e) => e.isFile() && e.name.endsWith(".json") && e.name !== "genesis.json")
    .map((e) => dir + e.name);
  const below = entries.filter((e) => e.isDirectory()).flatMap((e) => folders(`${dir}${e.name}/`));
  return names.length > 0 ? [{ folder: dir.slice(0, -1), names }, ...below] : below;
}

/** The row a folder counts on: tiny and full share one ("stf/safrole"). */
const rowOf = (folder: string) => folder.replace(/\/(tiny|full)$/, "");

/** A row of the scoreboard: how many passed, of how many, and why the others failed. */
type Row = { passed: number; total: number; run: boolean; failures: string[] };

const rows = new Map<string, Row>();
const run = new Run("scoreboard");
for (const { folder, names } of folders()) {
  const row = rows.get(rowOf(folder)) ?? { passed: 0, total: 0, run: false, failures: [] };
  rows.set(rowOf(folder), row);
  row.total += names.length;
  const family = FAMILIES.find((f) => f.folders.includes(folder));
  if (!family) continue; // not run yet
  row.run = true;
  for (const name of names) {
    let why: string | null = null; // null: it passed
    try {
      family.check(name);
    } catch (e) {
      why = (e as Error).message.split("\n")[0];
    }
    if (why === null) row.passed++;
    else row.failures.push(`${name}: ${why}`);
    run.event("vector", { family: rowOf(folder), vector: name, passed: why === null, why });
  }
}

const n = (x: number) => x.toLocaleString("en-US"); // 1,428
console.log("The official test vectors, each run whole by your client:\n");
for (const [name, row] of rows) {
  const count = row.run ? `${n(row.passed)} of ${n(row.total)}`.padStart(10) : "";
  const mark = !row.run ? `not run yet (${n(row.total)})` : row.passed === row.total ? "✔" : "";
  console.log(`${name.padEnd(23)}${count}  ${mark}`.trimEnd());
  for (const failure of row.failures.slice(0, 3)) console.log(`    ✘ ${failure}`);
  if (row.failures.length > 3) console.log(`    … and ${row.failures.length - 3} more`);
  run.event("family", { family: name, passed: row.passed, total: row.total, run: row.run });
}
const passed = [...rows.values()].reduce((sum, row) => sum + row.passed, 0);
const total = [...rows.values()].reduce((sum, row) => sum + row.total, 0);
console.log(`\n${n(passed)} of ${n(total)} vectors pass.`);
run.number("vectors_passed", passed);
run.number("vectors_total", total);
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

The scoreboard walks every folder of `vectors/`, gives each vector to the family that
fills its folder, and counts. A folder no family fills is *not run yet*. A check that
throws is a vector that failed, and the first line of its message says why; the board
shows three per family. `tiny` and `full` folders share a row. Every vector it runs is also
a `vector` event for Grafana: its family, its name, whether it passed, and why not.

**Run**

```sh
npm pkg set scripts.scoreboard="node bin/scoreboard.ts"
npm run typecheck
npm run scoreboard
```

```text
...
The official test vectors, each run whole by your client:

codec                     4 of 30
    ✘ codec/full/assurances_extrinsic.json: no codec for assurances_extrinsic yet
    ✘ codec/full/block.json: no codec for block yet
    ✘ codec/full/disputes_extrinsic.json: no codec for disputes_extrinsic yet
    … and 23 more
erasure                  not run yet (12)
shuffle                  not run yet (1)
stf/accumulate           not run yet (126)
stf/assurances           not run yet (22)
stf/authorizations       not run yet (6)
stf/disputes             not run yet (60)
stf/history              not run yet (8)
stf/preimages            not run yet (16)
stf/reports              not run yet (92)
stf/safrole              not run yet (46)
stf/statistics           not run yet (8)
traces/fallback          not run yet (100)
traces/fuzzy             not run yet (200)
traces/fuzzy_light       not run yet (200)
traces/preimages         not run yet (100)
traces/preimages_light   not run yet (100)
traces/safrole           not run yet (100)
traces/storage           not run yet (100)
traces/storage_light     not run yet (100)
trie                     not run yet (1)

4 of 1,428 vectors pass.
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=scoreboard-1791938884683
```

Four of 1,428. The other codec vectors are structures you haven't written yet, and the
board says which. Every other row is a part of this tutorial still to come. Wherever a
lesson brings a family across the line, it ends with the scoreboard, and the [scoreboard
page](../scoreboard.md) lists every one of those milestones.

> [!TIP] Milestone
> **The first vectors on the board.** 4 of 1,428: `refine_context` and
> `work_item`, at both sizes, decoded and encoded back byte for byte.

Grafana keeps the board too, on a dashboard of its own, *8 · Official vectors*, in the bar
at the top of every dashboard. Its *Each family (last run)* panel is the board you just
printed; the rest of the dashboard keeps every run, so you can watch the count climb
lesson by lesson.

![The Each family panel: codec with 4 of 30 passed, every other family not run yet, with how many vectors each holds](./images/06-each-family-last-run.png)

Below it, the *Every vector (last run)* panel drills into the board: one row for each
vector the run ran, failures first, each with why. The funnel in a column's header filters
it, to one family, or to the failures only.

![The Every vector panel: the codec vectors that failed come first, each with why: no codec for that structure yet](./images/06-every-vector-last-run.png)

<details>
<summary>lasair: <code>encode_refinement_context</code></summary>

```ocaml
let encode_refinement_context (c : refinement_context) : bytes =
  encode_tuple [
    encode_hash c.anchor;
    encode_u32 (Int64.of_int c.anchor_slot);
    encode_hash c.state_root;
    encode_hash c.beefy_root;
    encode_hash c.lookup_anchor;
    encode_u32 (Int64.of_int c.lookup_anchor_slot);
    encode_hash c.lookup_anchor_state_root;
    encode_var_sequence encode_hash c.prerequisites;
  ]
```

Line for line your `RefineContext`. `encode_var_sequence` is your `seq`, with the length
in front. Two of these fields, `anchor_slot` and `lookup_anchor_state_root`, are new in
Gray Paper 0.8.0, and lasair's type marks them so.

</details>

## Check your understanding

::: check
**`work_item.json` and `work_item.bin`: how are they related?**

- [ ] The `.bin` is a compressed copy of the `.json` text
  > No: there is no text in the `.bin` at all, not even the field names. Its 236 bytes are
  > only the values.
- [x] They are the same work item: the `.json` for people, the `.bin` encoded
  > Yes: the `.bin` is the JSON's values, in the JSON's order, each written by its rule
  > from [Part 2](./index.md). A client decodes the `.bin` and must get exactly the `.json`'s values.
- [ ] They are two different work items that happen to share a service
  > No: every value matches. `04 03 02 01` is the service, 16909060, and the next 32
  > bytes are the same `code_hash`.

**In `hexdump-work-item`'s command, `node bin/hexdump.ts ../vectors/codec/tiny/work_item.bin 52`, what is the 52?**

- [ ] The size of every work item
  > No: this one is 236 bytes, and an item with a longer payload is longer still.
- [ ] The number of fields in a work item
  > No: a work item has eight fields at the top level. 52 counts bytes, not fields.
- [x] How many bytes to show, from the start of the file
  > Yes: `bin/hexdump.ts` stops after 52 bytes. They happen to be exactly the first four fields,
  > 4 + 32 + 8 + 8.

**Why is `service`, 16909060, written `04 03 02 01`?**

- [x] ℰ₄ writes a number's least significant byte first
  > Yes: 16909060 is `0x01020304`, and ℰ₄ starts from its lowest byte, `04`.
- [ ] The vector files store numbers backwards to save space
  > No: the order saves nothing; both orders take 4 bytes. It is simply the Gray Paper's
  > rule for fixed-width numbers, from [lesson 2.1](./01-fixed-width-integers.md).
- [ ] The service id is a hash, and hashes are written in reverse
  > No: the service id is a plain number, and a hash such as `code_hash` is copied exactly
  > as it is, never reversed.

**The payload has its length, `05`, in front of it. Why doesn't `code_hash`?**

- [ ] `code_hash` comes first, and only later fields need a length
  > No: order has nothing to do with it. `refine_gas_limit` comes later and has no
  > length either.
- [ ] Lengths are only written for numbers
  > No: it's the other way round. Numbers like the gas limits have a fixed size and no
  > length; the payload is bytes, and it has one.
- [x] A hash is always 32 bytes, but a payload can be any size
  > Yes: when both sides know a field's size, nothing needs saying. A payload's size
  > changes from item to item, so the bytes have to say it.
:::

## What you have

A codec built from a dozen small pieces, the first two JAM structures agreeing with the
official vectors at both parameter sets, and a scoreboard that counts them: 4 of 1,428.
When a decode goes wrong, though, all a test can say is that two values differ. [Lesson
2.7](./07-watch-a-decode.md) makes the codec say which bytes it read for which field.

Next: [2.7 Watch a decode](./07-watch-a-decode.md)
