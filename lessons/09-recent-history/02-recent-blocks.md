# Recent blocks

The state has a short memory on purpose: the last eight blocks. For each, it keeps the
header hash, the state root after it, the belt's super-peak ([lesson 9.1](./01-the-mountain-belt.md)), the slot,
and the work-packages it reported. Guarantors anchor their work on these blocks, and the
chain uses them to turn away reports it has already seen. This lesson keeps that memory
up to date, block by block.

## New words

- **Recent history.** β. What the state remembers of the last eight blocks (β_H), with the
  belt of accumulation outputs (β_B). *Example:* a guarantee's anchor must be one of
  those eight blocks.

It's in the [glossary](../glossary.md).

## What the Gray Paper says

§7 (*Recent History*). β is two things: β_H, the list of recent blocks, at most H = 8 of
them, and β_B, the belt. Each new block does three things to them:

1. **Fills in a blank.** The newest remembered block's state root couldn't be known when
   it was added, because a block's state root comes *after* the block. Now it is known:
   it's this block's `parent_state_root` (H_R, [lesson 4.6](../04-blocks/06-the-header.md)). So it's written in.
2. **Adds itself.** The block's accumulation outputs go onto the belt ([lesson 9.1](./01-the-mountain-belt.md)), and
   a new entry joins the list: its header hash, the belt's new super-peak, its slot, the
   packages it reported, and a state root of 32 zeros. The Gray Paper calls that zero
   root "inaccurate but safe": nothing reads it before step 1 fixes it, one block later.
3. **Forgets.** Only the last eight entries are kept.

The history vectors give the new block's parts ready-made: its header hash, its
`parent_state_root`, the root of its accumulation outputs, its slot, and its reported
packages. For now, all you need to know is that a block brings them. [Part 12](../12-guarantees/index.md) works out
the reported packages; the accumulation root needs the outputs that services hand back
with the `yield` host call, which [lesson 17.11](../17-accumulation/11-what-a-service-yields.md) builds.

## The records first

The tests read β from real states as well as from the vectors, so its records come first,
with a `recordBlock` that doesn't record anything yet:

**New file** `src/history.ts`

```ts
// Recent history (GP §7): the state remembers the last eight blocks, and keeps a belt of
// every accumulation output.

import type { Bytes } from "./bytes.ts";
import type { Value } from "./codec/codec.ts";
import { hash, option, record, seq, u32 } from "./codec/codec.ts";

/** A work-package reported in a block: its hash, and the root of the segments it exports. */
export const ReportedPackage = record({
  hash: hash,
  exports_root: hash,
});
export type ReportedPackage = Value<typeof ReportedPackage>;

/** One remembered block (GP §7). */
export const RecentBlock = record({
  header_hash: hash,
  beefy_root: hash, // the belt's super-peak, just after this block
  state_root: hash, // the state root after this block: the next block fills it in
  slot: u32,
  reported: seq(ReportedPackage), // the work-packages reported in this block
});
export type RecentBlock = Value<typeof RecentBlock>;

/** β, C(3): the recent blocks, then the belt, each peak an option (GP App. D). */
export const Recent = record({
  history: seq(RecentBlock),
  belt: seq(option(hash)),
});
export type Recent = Value<typeof Recent>;

/** What a new block brings to the history (the history vectors' input). */
export const NewBlock = record({
  header_hash: hash,
  parent_state_root: hash, // H_r: the state root after the newest remembered block
  accumulate_root: hash, // the root of this block's accumulation outputs
  slot: u32,
  work_packages: seq(ReportedPackage),
});
export type NewBlock = Value<typeof NewBlock>;

/** H: how many recent blocks the state remembers. */
export const RECENT_BLOCKS = 8;

export function recordBlock(before: Recent, block: NewBlock): Recent {
  return before;
}
```

Every structure here is a `record`, so it's a type, an encoder, a decoder and a JSON
reader at once ([lesson 2.5](../02-codec/05-sequences-and-records.md)). `Recent` is exactly how C(3) holds β in the state: the list,
then the belt, each peak an `option` ([lesson 4.5](../04-blocks/05-maybe-and-exactly-n.md)), since a belt has gaps.

> [!NOTE]
> The `slot` in each entry is new in Gray Paper 0.8.0; 0.7.2's entries didn't have it.
> Rules change between versions, so a client says which one it follows.

And a reader for β, next to [lesson 6.3](../06-state-and-merklization/03-reading-the-state.md)'s:

**Add to** `src/state.ts`

```ts
import { Recent } from "./history.ts";

/** β, C(3): the recent blocks, and the belt. */
export function readRecent(entries: KeyValue[]): Recent {
  return component(entries, 3, Recent);
}
```

## The tests

**New file** `test/history.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { Block, headerHash } from "../src/block.ts";
import { TINY } from "../src/config.ts";
import { NewBlock, Recent, RECENT_BLOCKS, recordBlock } from "../src/history.ts";
import { readRecent } from "../src/state.ts";
import { traceState, vectorFiles, vectorJson } from "./vectors.ts";
import type { Header } from "../src/block.ts";
import type { Bytes } from "../src/bytes.ts";
import type { RecentBlock } from "../src/history.ts";

/** A history vector's β, as your client's Recent. */
function recent(beta: { history: unknown[]; mmr: { peaks: unknown[] } }): Recent {
  return Recent.fromJson({ history: beta.history, belt: beta.mmr.peaks });
}

test("β′: the last block learns its state root, the new one joins, eight are kept", () => {
  let checked = 0;
  for (const size of ["tiny", "full"]) {
    for (const name of vectorFiles(`stf/history/${size}`)) {
      const { input, pre_state, post_state } = vectorJson(name) as {
        input: unknown;
        pre_state: { beta: { history: unknown[]; mmr: { peaks: unknown[] } } };
        post_state: { beta: { history: unknown[]; mmr: { peaks: unknown[] } } };
      };
      const before: Recent = recent(pre_state.beta);
      const after: Recent = recordBlock(before, NewBlock.fromJson(input));
      const expected: Recent = recent(post_state.beta);
      assert.deepEqual(after, expected, name);
      checked++;
    }
  }
  assert.equal(checked, 8);
});

test("β in real states: the newest block remembered is the block before", () => {
  for (let n = 2; n <= 100; n++) {
    const { history }: Recent = readRecent(traceState("fallback", n).entries);
    const before: Header = Block(TINY).fromJson(traceState("fallback", n - 1).block).header;
    const newest: RecentBlock = history[history.length - 1];
    const beforeHash: Bytes = headerHash(TINY, before);
    assert.deepEqual(newest.header_hash, beforeHash, `block ${n}`);
    assert.deepEqual(newest.state_root, new Uint8Array(32)); // not known yet
    const previous: RecentBlock = history[history.length - 2];
    assert.deepEqual(previous.state_root, before.parent_state_root);
    const kept: number = Math.min(n, RECENT_BLOCKS); // genesis counts too
    assert.equal(history.length, kept);
  }
});
```

Two kinds of check. The vectors check `recordBlock`: all three steps, at both sizes,
including a block that pushes the ninth entry out. Real states check the *codec* and the
rules: before each of 99 trace blocks, the newest remembered block is the one before, by
header hash ([lesson 5.1](../05-hashing-and-signatures/01-hashes.md)), with its state root still zeros, and the entry before it
filled in. The real chain did that recording, so this test passes before `recordBlock`
does anything.

**Run, expect it to fail**

```sh
npm test
```

```text
...
✖ β′: the last block learns its state root, the new one joins, eight are kept (197.8ms)
✔ β in real states: the newest block remembered is the block before (366.2ms)
...
ℹ tests 92
ℹ suites 0
ℹ pass 91
ℹ fail 1
...
test at test/history.test.ts:17:1
✖ β′: the last block learns its state root, the new one joins, eight are kept (197.8ms)
  AssertionError [ERR_ASSERTION]: stf/history/tiny/progress_blocks_history-1.json
  + actual - expected

    {
  +   belt: [],
  +   history: []
  -   belt: [
...
```

One red, one green, and that's the split you want. The real states pass: your records
and `readRecent` read β exactly as the chain wrote it. The vectors fail on the first one,
which starts from an empty history. Your stub hands it back empty (`+`), where the
vector expects one block remembered and a belt of one mountain (`-`).

## The code

The three steps, one line or two each:

**Replace in** `src/history.ts`

```ts
import type { Belt } from "./belt.ts";
import { appendToBelt, superPeak } from "./belt.ts";

/**
 * β′ (GP §7): the newest remembered block learns its state root, the new block joins the
 * belt and the list, and the list keeps only the last eight.
 */
export function recordBlock(before: Recent, block: NewBlock): Recent {
  const last = before.history.length - 1;
  const fixed = before.history.map((b, i) =>
    i === last ? { ...b, state_root: block.parent_state_root } : b,
  );
  const belt: Belt = appendToBelt(before.belt, block.accumulate_root);
  const entry: RecentBlock = {
    header_hash: block.header_hash,
    beefy_root: superPeak(belt),
    state_root: new Uint8Array(32), // unknown yet: zeros until the next block
    slot: block.slot,
    reported: block.work_packages,
  };
  return { history: [...fixed, entry].slice(-RECENT_BLOCKS), belt };
}
```

`fixed` is step 1: copy every entry, but give the last one its state root.

```ts
    i === last ? { ...b, state_root: block.parent_state_root } : b,
```

`{ ...b, state_root: ... }` copies an object with one field changed. `entry` is step 2,
and step 3 is the last line:

```ts
  return { history: [...fixed, entry].slice(-RECENT_BLOCKS), belt };
```

A negative `slice` counts from the end, so it keeps the last eight.

> [!NOTE]
> **The simple road.** `recordBlock` keeps the reported packages in the order the block
> lists them. The Gray Paper holds them in a *dictionary*, and dictionaries are encoded
> sorted by key ([lesson 3.3](../03-work-and-reports/03-a-work-report.md)), here the
> package hash. The vectors only ever list them in order, so this is fine for now; the
> [hardening pass](https://github.com/abutlabs/the-gray-tutor/blob/main/HARDENING.md) sorts
> them.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ β′: the last block learns its state root, the new one joins, eight are kept (7.5ms)
✔ β in real states: the newest block remembered is the block before (408.1ms)
...
ℹ tests 92
ℹ suites 0
ℹ pass 92
ℹ fail 0
...
reported 92 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791731468082
...
```

## Watch it

**New file** `bin/history.ts`

```ts
// Reads β from the state before a trace's block: the blocks the chain remembers, each with
// the belt's super-peak as it stood after that block (its beefy_root), and the one belt,
// its super-peak folded live and checked against the newest block's.
// Usage: npm run history <trace.json>, e.g.
//        npm run history ../vectors/traces/preimages/00000050.json

import { readFileSync } from "node:fs";
import type { Bytes } from "../src/bytes.ts";
import { fromHex, toHex } from "../src/bytes.ts";
import { superPeak } from "../src/belt.ts";
import { Run } from "../src/obs.ts";
import { readRecent } from "../src/state.ts";

const [file] = process.argv.slice(2);
const trace = JSON.parse(readFileSync(file, "utf8"));
const entries = trace.pre_state.keyvals.map((e: { key: string; value: string }) => ({
  key: fromHex(e.key),
  value: fromHex(e.value),
}));
const { history, belt } = readRecent(entries);
const short = (bytes: Bytes) => `${toHex(bytes).slice(0, 10)}…`;
/** The belt's shape after n items: n in binary, smallest mountain first. */
const dot = (bit: string) => (bit === "1" ? "●" : "·");
const dots = (n: number) => [...n.toString(2)].reverse().map(dot).join(" ");
const items = belt.reduce((n: number, peak, i) => (peak === null ? n : n + 2 ** i), 0);
const run = new Run("history");
for (const [i, { slot, header_hash, state_root, beefy_root, reported }] of history.entries()) {
  const onBelt = items - (history.length - 1 - i); // every block appended one item
  const roots = `header ${short(header_hash)}  state root ${short(state_root)}`;
  const line = `slot ${String(slot).padStart(3)}  ${roots}  beefy ${short(beefy_root)}`;
  console.log(`${line}  reported: ${reported.length}  belt ${dots(onBelt)}`);
  const counted = { reported: reported.length, belt: dots(onBelt) };
  run.event("block", { slot, header_hash, state_root, beefy_root, ...counted });
}
const peaks = belt.map((peak) => (peak === null ? "·" : "●")).join(" ");
const top = superPeak(belt);
const newest = history[history.length - 1];
const same = toHex(top) === toHex(newest.beefy_root);
const agrees = same ? "the newest block's beefy ✓" : "NOT the newest block's beefy ✗";
console.log(`the belt: ${peaks}`);
console.log(`its super-peak, folded live: ${short(top)} — ${agrees}`);
run.event("belt", { peaks, superPeak: top });
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

**What flows through it.** The input is a whole state this time: the trace file's
`pre_state.keyvals`, where β sits under C(3)'s key. One entry in, a decoded β computed,
the rows printed:

::: code-group

```json [what goes in]
{
  "pre_state": {
    "keyvals": [
      {
        "key": "0x0300000000…",
        "value": "0x088492038c11a08a79…"
      },
      { "…": "every other component and account entry, not read here" }
    ]
  }
}
```

```ts [what it computes]
// bin/history.ts's values, once C(3)'s bytes decode as Recent
const computed = {
  component: "the 0x03… entry is β", // its value: 0x08, a count, then 8 blocks
  blocks: 8, // slots 42 to 49: header hash, state root, beefy, reported, each
  items: 49, // the belt's held places read as binary: 110001
  shapes: "each row's belt is one item fewer than the next", // drawn, not rewound
  foldedLive: "0x41063bd0…", // superPeak(belt), equal to slot 49's stored beefy
};
```

```text [what comes out]
slot  42  header 0x8492038c…  state root 0x85e2f9da…  beefy 0xd33299c9…  reported: 0  belt · ● · ● · ●
the belt: ● · · · ● ●
its super-peak, folded live: 0x41063bd0… — the newest block's beefy ✓
```

:::

Read the input into the output: the `value`'s first byte, `0x08`, is `seq`'s count — 8
remembered blocks — and the very next 32 bytes are slot 42's `header_hash`, the
`0x8492038c…` that opens the first printed row. Everything the program shows is decoded
out of that one entry's bytes by the codecs this lesson builds.

**Run**

```sh
npm pkg set scripts.history="node bin/history.ts"
npm pkg set scripts.history-preimages="node bin/history.ts ../vectors/traces/preimages/00000050.json"
npm run history-preimages
```

```text
slot  42  header 0x8492038c…  state root 0x85e2f9da…  beefy 0xd33299c9…  reported: 0  belt · ● · ● · ●
slot  43  header 0x083e87af…  state root 0x92b349ae…  beefy 0xf25da2b7…  reported: 0  belt ● ● · ● · ●
slot  44  header 0x0193a9f8…  state root 0xf3d9561f…  beefy 0xddaed19c…  reported: 2  belt · · ● ● · ●
slot  45  header 0xdf827752…  state root 0x1e90a7be…  beefy 0x8e61f98d…  reported: 1  belt ● · ● ● · ●
slot  46  header 0xb3711eed…  state root 0xa61f6f99…  beefy 0xbede1624…  reported: 0  belt · ● ● ● · ●
slot  47  header 0x12d04d3e…  state root 0x2f529bd8…  beefy 0x524e191c…  reported: 1  belt ● ● ● ● · ●
slot  48  header 0x1beca774…  state root 0xd095c60f…  beefy 0xebfeb74b…  reported: 1  belt · · · · ● ●
slot  49  header 0x7c7ee195…  state root 0x00000000…  beefy 0x41063bd0…  reported: 1  belt ● · · · ● ●
the belt: ● · · · ● ●
its super-peak, folded live: 0x41063bd0… — the newest block's beefy ✓
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=history-1793314582825
```

Eight blocks, slots 42 to 49, and only the newest still waiting for its state root. Now
read the belt backwards, as [lesson 9.1](./01-the-mountain-belt.md) taught you: 110001 in binary is 49, one
accumulation root for each block so far. The `beefy` column is the super-peak as it stood
after each block — eight snapshots of the one belt, a fresh M_R every block because every
block appends. The `belt` column is where [lesson 9.1](./01-the-mountain-belt.md)'s
one-way street gets precise: the old belts' *hashes* are gone for good — only the stored
belt, the newest line's, has real peaks behind its dots — but their *shapes* cost
nothing, because a shape is only the item count in binary, and each block's count is one
less than the next. So the program draws every shape and could recover no peak but the
last row's. Watch slot 47 → 48: `● ● ● ● · ●` collapses to `· · · · ● ●`, four merges
in one block, 101111 + 1 = 110000. The *Recent history* panel, on the **3 ·
Consensus** dashboard, shows it all.

Now let block 50 arrive, then 51 and 52: the three steps, on the trace's own β.

<RecentBlocks />

![Recent history panel](./images/02-recent-history.png)

## The scoreboard

The first test above runs every history vector whole: β′ is all a history vector's state
holds, and it says nothing back. That's the `stf/history` family. Move the check into
`test/families.ts` and have the test call it:

**Add to** `test/families.ts`

```ts
import { NewBlock, Recent, recordBlock } from "../src/history.ts";

/** β as the history vectors write it: the blocks, and the belt's peaks as `mmr`. */
type Beta = { history: unknown[]; mmr: { peaks: unknown[] } };

/** A history vector: β′, the last eight blocks and the belt. It says nothing back. */
export function checkHistory(name: string) {
  const vector = vectorJson(name) as StfVector<unknown, { beta: Beta }>;
  const recent = (beta: Beta) => Recent.fromJson({ history: beta.history, belt: beta.mmr.peaks });
  const after = recordBlock(recent(vector.pre_state.beta), NewBlock.fromJson(vector.input));
  assert.deepEqual(after, recent(vector.post_state.beta), "beta differs");
  assert.equal(vector.output, null, "output differs");
}
```

**Replace in** `test/families.ts`

```ts
/** Every family your client runs so far. */
export const FAMILIES: Family[] = [
  { folders: ["codec/tiny", "codec/full"], check: checkCodec },
  { folders: ["trie"], check: checkTrie },
  { folders: ["shuffle"], check: checkShuffle },
  { folders: ["stf/safrole/tiny", "stf/safrole/full"], check: checkSafrole },
  { folders: ["stf/history/tiny", "stf/history/full"], check: checkHistory },
];
```

**Rewrite** `test/history.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { Block, headerHash } from "../src/block.ts";
import { TINY } from "../src/config.ts";
import { Recent, RECENT_BLOCKS } from "../src/history.ts";
import { readRecent } from "../src/state.ts";
import { checkHistory } from "./families.ts";
import { traceState, vectorFiles } from "./vectors.ts";
import type { Header } from "../src/block.ts";
import type { Bytes } from "../src/bytes.ts";
import type { RecentBlock } from "../src/history.ts";

test("β′: the last block learns its state root, the new one joins, eight are kept", () => {
  const names: string[] = [...vectorFiles("stf/history/tiny"), ...vectorFiles("stf/history/full")];
  for (const name of names) checkHistory(name);
  assert.equal(names.length, 8);
});

test("β in real states: the newest block remembered is the block before", () => {
  for (let n = 2; n <= 100; n++) {
    const { history }: Recent = readRecent(traceState("fallback", n).entries);
    const before: Header = Block(TINY).fromJson(traceState("fallback", n - 1).block).header;
    const newest: RecentBlock = history[history.length - 1];
    const beforeHash: Bytes = headerHash(TINY, before);
    assert.deepEqual(newest.header_hash, beforeHash, `block ${n}`);
    assert.deepEqual(newest.state_root, new Uint8Array(32)); // not known yet
    const previous: RecentBlock = history[history.length - 2];
    assert.deepEqual(previous.state_root, before.parent_state_root);
    const kept: number = Math.min(n, RECENT_BLOCKS); // genesis counts too
    assert.equal(history.length, kept);
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
shuffle                    1 of 1  ✔
stf/accumulate           not run yet (126)
stf/assurances           not run yet (22)
stf/authorizations       not run yet (6)
stf/disputes             not run yet (60)
stf/history                8 of 8  ✔
stf/preimages            not run yet (16)
stf/reports              not run yet (92)
stf/safrole              46 of 46  ✔
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

86 of 1,428 vectors pass.
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=scoreboard-1791939138847
```

> [!TIP] Milestone
> **Every history vector.** All 8, tiny and full: the chain's short-term
> memory, and the belt's peaks, exactly as the vectors keep them.

<details>
<summary>lasair: <code>recent_history_core</code>, in <code>conformance/stf_transitions.ml</code></summary>

```ocaml
  let new_entry = {
    e_header_hash = header_hash;
    e_beefy_root = beefy_root;
    e_state_root = Bytes.make 32 '\x00';  (* Corrected next block *)
    e_slot = slot;                         (* GP 0.8.0 (#526): item carries the block's timeslot *)
    e_reported = reported;
  } in
```

The same entry as yours, field for field, and lasair marks the slot as new in 0.8.0 with
the number of the Gray Paper change that added it. Specs move; good code says which
version it follows. Just above this, lasair also sorts the reported packages by hash,
the road yours doesn't take yet (the note above).

</details>

## Check your understanding

::: check
**In `bin/history.ts`'s output, only slot 49's state root is zeros. Why?**

- [ ] Block 49 changed nothing, so its state is empty
  > No: every new entry starts with zeros, whatever its block did. Slot 48's root was
  > zeros too, one block earlier.
- [x] A block's state root comes after the block, so it's written in by the next one
  > Yes: block 50 brings it as `parent_state_root`, H_R. Until then, the zeros are
  > "inaccurate but safe".
- [ ] Only the oldest blocks keep a state root, to save space
  > No: slots 42 to 48 all have theirs. Only the newest is still waiting.

**β_H holds slots 42 to 49. Block 50 arrives. What does β_H hold after it?**

- [x] Slots 43 to 50, with 49's state root filled in and 50's zeros
  > Yes: all three steps. Fill in the blank, add the new entry, keep the last H = 8.
- [ ] Slots 42 to 50, nine blocks
  > No: H = 8. The ninth entry pushes slot 42 out.
- [ ] Slots 42 to 49, unchanged until the epoch ends
  > No: β changes every block. Each block adds itself and forgets the oldest.

**Each entry keeps the work-packages its block reported. What does the chain use them for?**

- [ ] To run the packages' work again later
  > No: an entry keeps only each package's hash and exports root, not its work.
- [x] To turn away a report of a package it has already seen
  > Yes: with eight blocks of reported packages to hand, a package reported again is
  > easy to spot.
- [ ] To build the belt
  > No: the belt grows from each block's accumulation root, not from its reported
  > packages.

**What is an entry's `beefy_root`?**

- [ ] The block's header hash, under another name
  > No: `header_hash` is its own field, a Blake2b hash of the header.
- [ ] The accumulation root that block appended
  > No: that's only the newest item. `beefy_root` covers every item the belt holds.
- [x] The belt's super-peak, just after that block
  > Yes: [lesson 9.1](./01-the-mountain-belt.md)'s M_R of the belt, once the block's accumulation root is on it.
:::

## What you have

The chain's short-term memory: eight blocks, kept up to date, with the blank from last
block filled in every time, and every history vector passing whole. That's what the chain remembers; [Part 10](../10-disputes/index.md) is how it
judges, when a work-report that validators vouched for turns out to be wrong.

Next: [Part 10 · Disputes](../10-disputes/index.md)
