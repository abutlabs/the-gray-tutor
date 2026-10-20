# The state trie

Every JAM header carries `parent_state_root`: 32 bytes that stand for the *entire* state
of the chain. Every validator's keys, every service's code and storage, every pending
report: all of it, behind one hash. Change a single byte anywhere, and the root changes.
How do you hash a whole world, and still be able to prove one small piece of it later?
With a *trie*. This lesson builds one and checks it against 400 real states.

## New words

- **Trie.** A tree that files entries by the bits of their keys: 0 goes left, 1 goes
  right. *Example:* keys starting `0x01` and `0x40` part ways at their second bit.
- **Leaf and branch.** A trie's two kinds of node: a leaf holds one entry, a branch holds
  the hashes of the two subtries below it. *Example:* a 64-byte node; its first bit says
  which.
- **Merklization.** Hashing a whole trie down to one root, so that any one entry can later
  be proven with a few hashes. *Example:* 400 real states, each down to 32 bytes.
- **State root.** One 32-byte hash that fingerprints the whole state, through a trie. Two
  clients agree on the state exactly when they agree on the root. *Example:* a header's
  `parent_state_root`.

All four are in the [glossary](../glossary.md).

## What the Gray Paper says

Appendix D does it in two stages:

1. *Serialization* turns the state into a list of entries: each a 31-byte *key* and a
   value of any length. (Which key holds what is [the next lesson](./02-state-keys.md). Today they're just
   bytes.)
2. *Merklization* turns those entries into one 32-byte root. That's today.

The trie is binary: it sorts entries by their key's bits, most significant first. Every
node is exactly 64 bytes, and its first bit says what kind it is.

- **A leaf** (first bit 1) holds one entry: the key, and the value itself if the value
  fits in 32 bytes (second bit 0, then six bits of its length). A bigger value is
  replaced by its hash (second bit 1). Small things inline, big things by fingerprint.
- **A branch** (first bit 0) holds the hashes of its two subtries: left for keys whose
  next bit is 0, right for 1. Two hashes are 512 bits, though, and the branch needs one
  for its 0. So the left hash gives up its first bit.

And the root, M, of some entries:

- no entries: 32 zero bytes;
- one entry: the hash of its leaf;
- more: split them on the next bit of their keys, and hash the branch of the two halves.

Three keys starting `0x01` (`0b0000_0001`), `0x40` (`0b0100_0000`) and `0xff`
(`0b1111_1111`) make this trie:

![The trie of the keys 0x01, 0x40 and 0xff. The root is a branch. Its 1 side is the leaf for 0xff, the only key whose first bit is 1. Its 0 side is another branch, whose 0 side is the leaf for 0x01 (first bits 0b00) and whose 1 side is the leaf for 0x40 (first bits 0b01). A branch holds both sides' hashes, and the root is the hash of the top branch.](./images/01-state-trie.svg)

`0xff` is alone on the 1 side, so it becomes a leaf right away. The other two need a
second bit to part ways.

So a key's bits are its route down the trie: from its first bit on, 0 goes left and 1
goes right, and its leaf sits as soon as no other key shares the route. `0xff` stops after
one bit, `0x01` and `0x40` after two. Change a key's bits and you change its route: its
leaf lands somewhere else, maybe deeper, and every hash above it changes with it.

Nothing builds the trie first and hashes it after. M is one recursive function: split the
entries on the next bit, work out each half's root, hash the branch. The hashing happens
on the way back up, one hash per node: for these three keys, three leaves and two
branches, five hashes. A real state is the same, only bigger: the tiny genesis state the
official traces start from has 21 entries, which make 21 leaves and 22 branches (two with
an empty side), the deepest leaf 11 bits down. Its 12 values over 32 bytes are hashed
first, so its root takes 55 hashes.

Try it below, starting from the same three keys, each with a value to type: text, or hex
from `0x`. Every node shows its real hash, made as your client's `merkle` makes it. Flip a
key's bits and watch its leaf move to its new route. Make two keys that differ only in
their last bit, and the trie needs all eight bits to part them: a chain of branches with
empty sides. Then change a value. Only the hashes on that leaf's path change, but the path
always ends at the root. Make a value longer than 32 bytes and the leaf doesn't split or
move: it keeps its place and holds the value's hash, while the value is kept outside the
trie.

<TrieBuilder />

Why hash a branch whose other side is empty, 32 zero bytes? Because M splits on one bit
per level, always, even when every key goes the same way. That keeps the trie simple: a
node's depth says which bit it split on, so no node has to record "skip these bits", and
there are only two kinds of node, each 64 bytes. Ethereum's trie does skip, with a third
kind of node that records the bits its keys share; JAM's costs one extra hash per shared
bit instead. The Gray Paper just defines it this way; the trade is ours to read. A real
state rarely pays much: of the tiny genesis state's 22 branches, only 2 have an empty side.

## The tests

Two sets of vectors. The `trie` vectors are made for exactly this: entries in, root out.
They're one file, `vectors/trie/trie.json`: `vectorJson`, from your `test/vectors.ts` of
[lesson 2.6](../02-codec/06-the-first-test-vectors.md), finds `vectors/` from its own file's place and reads names from there. It
holds 11 cases, each a set of entries, key → value in hex, and the root they must make, its
`output`. The cases hold 0, 1, 1, 1, 1, 1, 2, 2, 2, 5 and 10 entries, and the single
entries' values are 0, 1, 32, 33 and 60 bytes long: either side of a leaf's 32. (Their
keys are 32 bytes, from when the Gray Paper's keys were. The trie only ever reads the
first 31, so the test simply drops the 32nd.)
And then real states, from the four traces of [lesson 5.2](../05-hashing-and-signatures/02-the-extrinsic-hash.md): each trace step carries the
state *before* its block, as key-value entries, and each block's header promises that
state's root.

First, a helper that reads a trace's state, next to the other vector readers. Each
entry's key and value become bytes, and the header's promise comes along.

**Add to** `test/vectors.ts`

```ts
import { fromHex } from "../src/bytes.ts";

/** The state before block n of a tiny trace, and the state root its header promises. */
export function traceState(family: string, n: number) {
  const name = `traces/${family}/${String(n).padStart(8, "0")}.json`;
  const trace = vectorJson(name) as {
    pre_state: { keyvals: { key: string; value: string }[] };
    block: { header: { parent_state_root: string } };
  };
  const entries = trace.pre_state.keyvals.map((e) => ({
    key: fromHex(e.key),
    value: fromHex(e.value),
  }));
  return { entries, promised: trace.block.header.parent_state_root };
}
```

**New file** `test/trie.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { fromHex, toHex } from "../src/bytes.ts";
import { stateRoot } from "../src/trie.ts";
import { traceState, vectorJson } from "./vectors.ts";
import type { KeyValue } from "../src/trie.ts";

test("the trie vectors: from no entries at all to ten", () => {
  const vectors = vectorJson("trie/trie.json") as {
    input: Record<string, string>;
    output: string;
  }[];
  for (const { input, output } of vectors) {
    const entries: KeyValue[] = Object.entries(input).map(([key, value]) => ({
      key: fromHex(`0x${key}`).subarray(0, 31), // these vectors' keys are 32 bytes; a key is 31
      value: fromHex(`0x${value}`),
    }));
    const root: string = toHex(stateRoot(entries));
    const expected: string = `0x${output}`;
    assert.equal(root, expected);
  }
});

test("each header promises the state before its block, by its root: 400 real states", () => {
  for (const family of ["fallback", "safrole", "preimages", "storage"]) {
    for (let n = 1; n <= 100; n++) {
      const { entries, promised } = traceState(family, n);
      const root: string = toHex(stateRoot(entries));
      assert.equal(root, promised, `${family} ${n}`);
    }
  }
});
```

The `trie` vectors write their hex without `0x`, so the test adds it for `fromHex`.

A stub so the tests can run: the type of an entry, and a root that's always zeros.

**New file** `src/trie.ts`

```ts
// The state trie (GP App. D): one 32-byte root that commits to every key and value in the
// state. Change any value anywhere, and the root changes.

import type { Bytes } from "./bytes.ts";

export type KeyValue = { key: Bytes; value: Bytes };

export function stateRoot(entries: KeyValue[]): Bytes {
  return new Uint8Array(32);
}
```

**Run, expect it to fail**

```sh
npm test
```

```text
...
✖ the trie vectors: from no entries at all to ten (1.5ms)
✖ each header promises the state before its block, by its root: 400 real states (1.0ms)
...
ℹ tests 60
ℹ suites 0
ℹ pass 58
ℹ fail 2
...
test at test/trie.test.ts:8:1
✖ the trie vectors: from no entries at all to ten (1.5ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected

  + '0x0000000000000000000000000000000000000000000000000000000000000000'
  - '0x99ecb1509d2cbc16bab389714e5933932977e742472fcd9277d67f45699e076a'

      at TestContext.<anonymous> (…/client/test/trie.test.ts:20:12)
...
```

Red, but look at which vector it fell on. The first trie vector is the empty state, and
the Gray Paper says an empty trie's root is 32 zero bytes: the stub got that one right
by accident. Every other root, and every real state, it got wrong.

## The code

The real trie replaces the stub, file and all:

**Rewrite** `src/trie.ts`

```ts
// The state trie (GP App. D): one 32-byte root that commits to every key and value in the
// state. Change any value anywhere, and the root changes.

import type { Bytes } from "./bytes.ts";
import { concatBytes } from "./bytes.ts";
import type { Trace } from "./codec/reader.ts";
import { blake2b256 } from "./hash.ts";

/** One entry of the state: a 31-byte key, and its value. */
export type KeyValue = { key: Bytes; value: Bytes };

/** Bit i of a key, counting from the most significant bit of its first byte. */
function bit(key: Bytes, i: number): number {
  const byte = key[Math.floor(i / 8)];
  return (byte >> (7 - (i % 8))) & 1;
}

/** A leaf node: 64 bytes holding the key, and the value itself if it fits in 32 bytes. */
function leaf(key: Bytes, value: Bytes): Bytes {
  const node = new Uint8Array(64);
  if (value.length <= 32) {
    node[0] = 0b10000000 | value.length; // 1, 0: a leaf with the value inside; its length
    node.set(value, 32);
  } else {
    node[0] = 0b11000000; // 1, 1: a leaf with the value's hash
    node.set(blake2b256(value), 32);
  }
  node.set(key, 1);
  return node;
}

/** A branch node: its two subtries' hashes, side by side, with the first bit cleared. */
function branch(left: Bytes, right: Bytes): Bytes {
  const node = concatBytes(left, right);
  node[0] = node[0] & 0b01111111; // 0: a branch
  return node;
}

/** M (GP App. D): the hash of the trie of these entries, which agree on their first bits. */
function merkle(entries: KeyValue[], depth: number, trace?: Trace): Bytes {
  if (entries.length === 0) return new Uint8Array(32); // an empty trie is 32 zero bytes
  if (entries.length === 1) {
    const { key, value } = entries[0];
    trace?.event("leaf", { depth, key, size: value.length });
    return blake2b256(leaf(key, value));
  }
  const left = entries.filter((e) => bit(e.key, depth) === 0);
  const right = entries.filter((e) => bit(e.key, depth) === 1);
  return blake2b256(branch(merkle(left, depth + 1, trace), merkle(right, depth + 1, trace)));
}

/** The state root: the hash of the trie of every entry in the state. */
export function stateRoot(entries: KeyValue[], trace?: Trace): Bytes {
  return merkle(entries, 0, trace);
}
```

A few things to notice:

- **`bit`** finds byte `i / 8`, rounded down, and inside it bit `i % 8`, counted from the
  left: shift that bit to the bottom (`>>`), and keep just it (`& 1`). These are the
  bitwise operators [lesson 1.2](../01-bytes-and-numbers/02-numbers.md) warned about, and they're safe here: a byte is far below
  their 32 bits.
- **`0b10000000 | value.length`** builds a leaf's first byte in one go: the `1, 0` on
  top, the length (at most 32, so six bits are plenty) at the bottom.
- **`merkle` keeps the keys whole and counts `depth`.** The Gray Paper chops the first
  bit off every key at each level instead, and looks at the new first bit. Same trie, and
  no copying.
- **`trace`** is the same optional watcher as the decoder's ([lesson 2.7](../02-codec/07-watch-a-decode.md)): it hears about
  every leaf, and costs nothing when nobody is listening.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ the trie vectors: from no entries at all to ten (3.6ms)
✔ each header promises the state before its block, by its root: 400 real states (2491.0ms)
...
ℹ tests 60
ℹ suites 0
ℹ pass 60
ℹ fail 0
...
reported 60 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791728952545
...
```

About fifty lines, and your client computes the state root of real JAM states, up to 273
entries each, exactly as the Gray Paper says. It takes a couple of seconds, most of it
reading 300 MB of JSON.

## Watch it

**New file** `bin/state.ts`

```ts
// Builds the trie of the state before a trace's block, shows where each entry lands, and
// checks the root against the one the block's header promises.
// Usage: npm run state <trace.json>, e.g.
//        npm run state ../vectors/traces/fallback/00000001.json

import { readFileSync } from "node:fs";
import type { Bytes } from "../src/bytes.ts";
import { fromHex, toHex } from "../src/bytes.ts";
import { Run } from "../src/obs.ts";
import { stateRoot } from "../src/trie.ts";

const [file] = process.argv.slice(2);
const trace = JSON.parse(readFileSync(file, "utf8"));
const entries = trace.pre_state.keyvals.map((e: { key: string; value: string }) => ({
  key: fromHex(e.key),
  value: fromHex(e.value),
}));
const run = new Run("state");
const root = stateRoot(entries, {
  event(step, fields) {
    run.event(step, fields);
    const { depth, key, size } = fields as { depth: number; key: Bytes; size: number };
    const where = size <= 32 ? "in the leaf" : "hashed";
    console.log(`depth ${String(depth).padStart(2)}  ${toHex(key)}  ${size}-byte value, ${where}`);
  },
});
const promised = trace.block.header.parent_state_root;
const matches = toHex(root) === promised;
console.log(`${entries.length} entries, state root ${toHex(root)}`);
console.log(`the header promises it: ${matches}`);
run.event("root", { root, promised, matches });
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

**Run**

```sh
npm pkg set scripts.state="node bin/state.ts"
npm pkg set scripts.state-fallback="node bin/state.ts ../vectors/traces/fallback/00000001.json"
npm run state-fallback
```

```text
depth 11  0x001f00d80020000f54baff5df8254cd8565b0ae7128494d27595b5ff15c665  5-byte value, in the leaf
depth 11  0x003f00f4004e00375cb1b4c052ebb735f8db5d35cced61f8c918fd873aaa80  159322-byte value, hashed
depth 10  0x006200e5005e009a783dea6395f0002b98566c47f6d17f33ac790f6a687e5f  50-byte value, hashed
depth  9  0x00cc007a00980005854520370befe282935ed398114c060b435946c98d4fc1  5-byte value, in the leaf
depth  8  0x01000000000000000000000000000000000000000000000000000000000000  514-byte value, hashed
depth  8  0x02000000000000000000000000000000000000000000000000000000000000  5120-byte value, hashed
depth  8  0x03000000000000000000000000000000000000000000000000000000000000  103-byte value, hashed
depth  8  0x04000000000000000000000000000000000000000000000000000000000000  2547-byte value, hashed
depth  8  0x05000000000000000000000000000000000000000000000000000000000000  4-byte value, in the leaf
depth  8  0x06000000000000000000000000000000000000000000000000000000000000  128-byte value, hashed
depth  8  0x07000000000000000000000000000000000000000000000000000000000000  2017-byte value, hashed
depth  8  0x08000000000000000000000000000000000000000000000000000000000000  2017-byte value, hashed
depth  8  0x09000000000000000000000000000000000000000000000000000000000000  2017-byte value, hashed
depth  8  0x0a000000000000000000000000000000000000000000000000000000000000  2-byte value, in the leaf
depth  8  0x0b000000000000000000000000000000000000000000000000000000000000  4-byte value, in the leaf
depth  8  0x0c000000000000000000000000000000000000000000000000000000000000  21-byte value, in the leaf
depth  8  0x0d000000000000000000000000000000000000000000000000000000000000  307-byte value, hashed
depth  8  0x0e000000000000000000000000000000000000000000000000000000000000  12-byte value, in the leaf
depth  8  0x0f000000000000000000000000000000000000000000000000000000000000  12-byte value, in the leaf
depth  4  0x10000000000000000000000000000000000000000000000000000000000000  1-byte value, in the leaf
depth  1  0xff000000000000000000000000000000000000000000000000000000000000  89-byte value, hashed
21 entries, state root 0xd6e78dc07a9ae915ada8306bf0da89b11044a2d4ee71ae0c5faf61f34f6b3a0c
the header promises it: true
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=state-1791728955705
```

Twenty-one entries, one root, and the header agrees. Now read the leaves, in key order,
and the trie's shape appears:

- `0xff00…` sits at **depth 1**: it's the only key that starts with a 1 bit, so it
  needs no more splitting. Same story as the little picture above.
- `0x0100…` to `0x0f00…` sit at **depth 8**: they differ only in their first byte, so
  eight bits tell them apart. Fifteen of them, plus `0x10` at depth 4.
- four keys starting `0x00` go deeper, to depth 9 to 11.

Most values are big enough to be hashed. The biggest, 159,322 bytes, is a service's code:
its hash is the code hash in the service's own entry, the one under `0xff`. Those
keys that are all zeros after the first byte look suspiciously *designed*, don't they?
That's [the next lesson](./02-state-keys.md). The dashboard's *State trie* panel has every leaf and the root.

![State trie panel](./images/01-state-trie.png)

## The scoreboard

The trie vectors' test already runs their one file whole: every case, entries in and root
out. That's the scoreboard's `trie` family. Move the check into `test/families.ts`, where
the scoreboard can reach it, and let the test call it from there, so it's written once:

**Add to** `test/families.ts`

```ts
import { fromHex, toHex } from "../src/bytes.ts";
import type { KeyValue } from "../src/trie.ts";
import { stateRoot } from "../src/trie.ts";
import { vectorJson } from "./vectors.ts";

/** The trie vector: each set of entries has the vector's root. Its keys are 32 bytes, from
 * when the Gray Paper's keys were; the trie reads the first 31. */
export function checkTrie(name: string) {
  const cases = vectorJson(name) as { input: Record<string, string>; output: string }[];
  for (const { input, output } of cases) {
    const entries: KeyValue[] = Object.entries(input).map(([key, value]) => ({
      key: fromHex(`0x${key}`).subarray(0, 31),
      value: fromHex(`0x${value}`),
    }));
    assert.equal(toHex(stateRoot(entries)), `0x${output}`);
  }
}
```

**Replace in** `test/families.ts`

```ts
/** Every family your client runs so far. */
export const FAMILIES: Family[] = [
  { folders: ["codec/tiny", "codec/full"], check: checkCodec },
  { folders: ["trie"], check: checkTrie },
];
```

**Rewrite** `test/trie.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { toHex } from "../src/bytes.ts";
import { stateRoot } from "../src/trie.ts";
import { checkTrie } from "./families.ts";
import { traceState } from "./vectors.ts";

test("the trie vectors: from no entries at all to ten", () => checkTrie("trie/trie.json"));

test("each header promises the state before its block, by its root: 400 real states", () => {
  for (const family of ["fallback", "safrole", "preimages", "storage"]) {
    for (let n = 1; n <= 100; n++) {
      const { entries, promised } = traceState(family, n);
      const root: string = toHex(stateRoot(entries));
      assert.equal(root, promised, `${family} ${n}`);
    }
  }
});
```

**Run**

```sh
npm test
npm run typecheck
npm run scoreboard
```

```text
...
The official test vectors, each run whole by your client:

codec                    30 of 30  ✔
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
trie                       1 of 1  ✔

31 of 1,428 vectors pass.
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=scoreboard-1791939036335
```

> [!TIP] Milestone
> **The trie vector.** Every case in it, from no entries to ten, has the
> vector's root: your client commits to a state exactly as every other client does.

<details>
<summary>lasair: <code>merkle_trie_depth</code>, in <code>lib/merklization.ml</code></summary>

```ocaml
let rec merkle_trie_depth (entries : trie_entry list) (hash_fn : hash_fn) (depth : int) : bytes =
  match entries with
  | [] -> zero_hash
  | [{ key; value }] ->
    let node =
      if Bytes.length value <= 32 then
        encode_leaf key value
      else
        encode_hashed_leaf key (hash_fn value)
    in
    hash_fn node
  | _ ->
    (* Partition by bit at current depth (no key shifting) *)
    let left, right = List.partition (fun e -> not (get_bit e.key depth)) entries in
    (* Recurse at next depth *)
    let left_hash = merkle_trie_depth left hash_fn (depth + 1) in
    let right_hash = merkle_trie_depth right hash_fn (depth + 1) in
    let node = encode_branch left_hash right_hash in
    hash_fn node
```

Line for line, your `merkle`: no entries, one entry, or split and recurse. Even the
comment, "no key shifting", is the same trick as your `depth`. OCaml's `match` reads the
three cases off like the Gray Paper's own definition.

</details>

## Check your understanding

::: check
**Change one value anywhere in the state, say τ's 4 bytes. Why does the root change?**

- [ ] The whole trie is rebuilt, and a rebuilt trie gets a new root
  > No: only the hashes on τ's path are worked out again. Every other subtrie keeps its
  > hash, and the branches above reuse it as it is.
- [x] Its leaf's hash changes, so its branch's does, and so on up the path to the root
  > Yes: a branch holds the hashes of the two subtries below it. A new hash at the bottom
  > makes a new branch above it, all the way up, and the root is the last of them.
- [ ] It doesn't: a value that small sits inside its leaf, not behind a hash
  > No: inside the leaf is exactly why it shows. New bytes in the leaf give the leaf a new
  > hash. Inline or hashed, the change reaches the root.

**τ's value is 4 bytes; service 0's code is 159,322. What do their leaves hold?**

- [ ] τ's 4 bytes; the code is split over many leaves
  > No: one entry is always one leaf, and every leaf is 64 bytes. The code doesn't fit, so
  > it doesn't go in at all.
- [ ] Each holds its value's hash, so that every leaf is the same size
  > No: only values over 32 bytes are hashed. One of 32 bytes or less goes in as it is, and
  > the leaf's first byte says how long it is.
- [x] τ's leaf holds the 4 bytes themselves; the code's holds its 32-byte hash
  > Yes: small things inline, big things by fingerprint. `bin/state.ts` says so: "4-byte
  > value, in the leaf", "159322-byte value, hashed".

**In the little trie of `0x01`, `0x40` and `0xff`, why is `0xff` a leaf straight under the root, and the other two a level deeper?**

- [x] It's the only key whose first bit is 1, so one bit already sets it apart
  > Yes: `0xff` is `0b1111_1111`, and the others start with 0. `0x01` (`0b00…`) and `0x40`
  > (`01…`) need their second bit to part ways.
- [ ] It's the biggest key, and the biggest goes nearest the root
  > No: bits decide, not size. A key `0x80`, `0b1000_0000`, alone on the 1 side, would sit
  > there just the same.
- [ ] The trie keeps itself balanced: one key on one side, two on the other
  > No: a trie doesn't balance. In the real state, `0xff` is alone on the 1 side and the
  > other 20 keys share the 0 side, some as deep as 11.

**Two clients work out the same 32-byte root for their states. What do they know?**

- [ ] They hold the same number of entries
  > No: they know far more. The root covers every key and every value, not just how many
  > there are.
- [x] Their states are the same: every key, and every value
  > Yes: a different byte anywhere gives a different root. That's why one hash in the
  > header, `parent_state_root`, is enough to check a whole state.
- [ ] They have the same keys, though the values may differ
  > No: the values are in the leaves too, inline or as a hash. A different value means a
  > different leaf, and a different root.
:::

## What you have

The function every JAM node runs after every block: the state root, matching the official
trie vector whole. Your client can now
check that a header's `parent_state_root` really is the state it came from. A root is all
it gives, though: which key holds what? [Lesson 6.2](./02-state-keys.md) maps the keys.

Next: [6.2 State keys](./02-state-keys.md)
