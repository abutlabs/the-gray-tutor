# Who did what

Validators do the chain's work: they make blocks, vouch for work-reports, and confirm they
hold their share of the data. JAM doesn't pay them itself; it keeps a tally of who did
what, so that whoever pays (Polkadot's staking system, in the Gray Paper's picture) can see
who earned it. This lesson keeps that tally, and checks it against every statistics test
vector, tiny and full.

## New words

- **Validator statistics.** A tally of each validator's work: blocks made, tickets and
  preimages put into blocks (and the preimages' bytes), guarantees (the blocks it signed a
  guarantee in, once a block however many it signed), assurances made. *Example:* validator 1: 1 block, 2 tickets, 3 preimages of 51 bytes, 1 guarantee,
  0 assurances.
- **Author.** The validator that made a block; the header names it by its index.
  *Example:* `author_index: 1`.
- **Reporters.** Every validator who signed a guarantee in a block, each counted once.
  *Example:* two guarantees, signed by validators 0 and 1 and by 2 and 3: four reporters.

All three are in the [glossary](../glossary.md).

## What the Gray Paper says

§13, *Validator Activity*. The chain keeps two tallies: one for the epoch in progress,
and the finished one from the epoch before. Each block moves them on, in this order:

1. **Assurances count first.** Every validator who made an assurance in the block gets one
   more. They count towards the epoch the block's parent was in.
2. **A new epoch turns the page.** If this block is the first of a new epoch, the tally in
   progress becomes "the last epoch's", and a fresh one, all zeros, begins. The old "last
   epoch's" is forgotten.
3. **Then the rest.** The author gets one more block, plus as many tickets and preimages
   (and preimage bytes) as the block carries. Every reporter gets one more guarantee.

The three steps on a real epoch's turn:

<EpochTallies />

Why track only these? They're the work the chain can see for itself. Other work, such as
voting on finality or auditing, happens off the chain, and the Gray Paper leaves it out.

The Gray Paper's names: the tally in progress is **π_V** (its "accumulator"), the last
epoch's **π_L**. The six fields are **b, t, p, d, g, a**. The author is **H_I**, the
reporters **𝐆** ([lesson 12.2](../12-guarantees/02-signed-and-counted.md)'s set), and "a new epoch" means ⌊τ′/E⌋ ≠ ⌊τ/E⌋.

## The tests

Every statistics vector is one block's tallies, before and after. Running one is a job
for the scoreboard too, so the runner goes in `test/families.ts`, and the tests use it:
the tallies before the block, yours after it, and the vector's after it. Its size comes
from the vector's folder.

**Add to** `test/families.ts`

```ts
import { Extrinsic } from "../src/block.ts";
import { updateValidatorStats, ValidatorStats } from "../src/statistics.ts";

type StatsInput = { slot: number; author_index: number; extrinsic: unknown };
type StatsState = {
  slot: number;
  curr_validators: unknown[];
  vals_curr_stats: unknown[];
  vals_last_stats: unknown[];
};

/** One block of statistics vector `name`: the tallies before it, your code's after it,
 * and the vector's after it. */
export function runStats(name: string) {
  const vector = vectorJson(name) as StfVector<StatsInput, StatsState>;
  const config = configOf(name);
  const { input, pre_state: pre, post_state: post } = vector;
  const tallies = (json: unknown[]) => json.map((s) => ValidatorStats.fromJson(s));
  const current = tallies(pre.vals_curr_stats);
  const before = { slot: pre.slot, current, last: tallies(pre.vals_last_stats) };
  const extrinsic = Extrinsic(config).fromJson(input.extrinsic);
  const [author, validators] = [input.author_index, keys(pre.curr_validators)];
  const after = updateValidatorStats(config, before, input.slot, author, extrinsic, validators);
  const expected = { current: tallies(post.vals_curr_stats), last: tallies(post.vals_last_stats) };
  return { vector, before, after, expected };
}

/** A statistics vector: π_V and π_L after the block. It says nothing back. */
export function checkStatistics(name: string) {
  const { vector, after, expected } = runStats(name);
  assert.deepEqual(after, expected, "vals_curr_stats or vals_last_stats differs");
  assert.equal(vector.output, null, "output differs");
  unchanged(vector, ["vals_curr_stats", "vals_last_stats"]);
}
```

**New file** `test/statistics.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { checkStatistics, runStats } from "./families.ts";
import { vectorFiles } from "./vectors.ts";

test("an empty block: its author makes one more block, and that's all", () => {
  const { before, after } = runStats("stf/statistics/tiny/stats_with_empty_extrinsic-1.json");
  const authorBlocks: number = after.current[1].blocks; // validator 1 made it
  assert.equal(authorBlocks, before.current[1].blocks + 1);
  assert.deepEqual(after.current[0], before.current[0]); // validator 0 did nothing
});

test("an epoch's first block: assurances close the old tally, the rest opens the new one", () => {
  const name = "stf/statistics/tiny/stats_with_epoch_change-1.json";
  const { before, after } = runStats(name);
  const closed: number = after.last[0].assurances; // into the old one
  assert.equal(closed, before.current[0].assurances + 1);
  assert.deepEqual([after.current[0].blocks, after.current[0].assurances], [0, 0]); // fresh
  assert.equal(after.current[1].blocks, 1); // the author's block starts the fresh tally
});

for (const size of ["tiny", "full"]) {
  for (const name of vectorFiles(`stf/statistics/${size}`)) {
    test(`${name}: every validator's tallies end as the vector says`, () => checkStatistics(name));
  }
}
```

The epoch-change test pins down the one surprise in the order: the block's assurances end up
in the *old* tally, while its author's block opens the new one.

## The code

**New file** `src/statistics.ts`

```ts
// Statistics (GP §13): who did what. The chain keeps a tally of each validator's work, for
// this epoch and the last, so that whoever pays validators knows who earned it.

import type { Extrinsic } from "./block.ts";
import { toHex } from "./bytes.ts";
import type { Value } from "./codec/codec.ts";
import { record, u32 } from "./codec/codec.ts";
import type { Config } from "./config.ts";
import { reporters, signerKeys } from "./guarantors.ts";
import type { ValidatorKey } from "./state.ts";

/** One validator's tally for one epoch (GP §13), under the test vectors' names. */
export const ValidatorStats = record({
  blocks: u32, // b: blocks it made
  tickets: u32, // t: tickets it put in its blocks
  pre_images: u32, // p: preimages it put in its blocks
  pre_images_size: u32, // d: their bytes, all together
  guarantees: u32, // g: reports it guaranteed
  assurances: u32, // a: availability assurances it made
});
export type ValidatorStats = Value<typeof ValidatorStats>;

/** A tally with nothing in it yet. */
const fresh = (): ValidatorStats => ({
  blocks: 0, tickets: 0, pre_images: 0, pre_images_size: 0, guarantees: 0, assurances: 0,
});

/**
 * π_V and π_L, one block on (GP §13). First the block's assurances count, in the epoch they
 * were made in. Then, if the block starts a new epoch, this epoch's tally becomes the last
 * one and a fresh one begins. Then the author gets its block, tickets and preimages, and
 * every validator who signed a guarantee gets one guarantee. `validators` is κ′.
 */
export function updateValidatorStats(
  config: Config,
  before: { slot: number; current: ValidatorStats[]; last: ValidatorStats[] },
  slot: number, // τ′
  author: number, // the header's author index
  extrinsic: Extrinsic,
  validators: ValidatorKey[],
) {
  let current = before.current.map((s) => ({ ...s }));
  let last = before.last;
  for (const a of extrinsic.assurances) current[a.validator_index].assurances += 1;
  const epoch = (t: number) => Math.floor(t / config.epoch_length);
  if (epoch(slot) !== epoch(before.slot)) {
    last = current;
    current = validators.map(fresh);
  }
  const mine = current[author];
  mine.blocks += 1;
  mine.tickets += extrinsic.tickets.length;
  mine.pre_images += extrinsic.preimages.length;
  mine.pre_images_size += extrinsic.preimages.reduce((n, p) => n + p.blob.length, 0);
  const signers = extrinsic.guarantees.flatMap((g) => signerKeys(g, validators));
  const signed = new Set(reporters(signers).map(toHex)); // 𝐆, once each
  validators.forEach((key, v) => {
    if (signed.has(toHex(key.ed25519))) current[v].guarantees += 1;
  });
  return { current, last };
}
```

The three steps, in the Gray Paper's order. Assurances count first, in the tally in
progress:

```ts
  for (const a of extrinsic.assurances) current[a.validator_index].assurances += 1;
```

Then a new epoch turns the page. Because it comes second, the assurances just counted
stay with the epoch the block's parent was in:

```ts
  if (epoch(slot) !== epoch(before.slot)) {
    last = current;
    current = validators.map(fresh);
  }
```

Then the rest go into the tally in progress, fresh or not: the author's block, tickets and
preimages, and one guarantee for each reporter, found by its Ed25519 key:

```ts
  validators.forEach((key, v) => {
    if (signed.has(toHex(key.ed25519))) current[v].guarantees += 1;
  });
```

Note the copy at the top: `before`'s tallies stay as they were, so a test can still
compare with them. `reporters` and `signerKeys` come from [lesson 12.2](../12-guarantees/02-signed-and-counted.md).

> [!NOTE]
> **The simple road.** The guarantee count looks the guarantors' keys up in κ′. The Gray
> Paper's reporters 𝐆 come from the guarantee checks instead, and a guarantee from the
> last rotation is signed with that rotation's keys, which can be λ's. The statistics
> vectors only use κ′, so this is fine for now; when [Part 19](../19-block-import/index.md) puts the block
> together, 𝐆 should come straight from [lesson 12.2](../12-guarantees/02-signed-and-counted.md)'s step. The [hardening
> pass](https://github.com/abutlabs/the-gray-tutor/blob/main/HARDENING.md) does that.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ the reported packages: each one's hash and exports root, sorted by hash (376.0ms)
...
✔ an epoch's first block: assurances close the old tally, the rest opens the new one (0.7ms)
✔ stf/statistics/tiny/stats_epoch_change_with_set_resize-1.json: every validator's tallies end as the vector says (0.4ms)
✔ stf/statistics/tiny/stats_with_empty_extrinsic-1.json: every validator's tallies end as the vector says (0.2ms)
✔ stf/statistics/tiny/stats_with_epoch_change-1.json: every validator's tallies end as the vector says (0.2ms)
✔ stf/statistics/tiny/stats_with_some_extrinsic-1.json: every validator's tallies end as the vector says (0.4ms)
✔ stf/statistics/full/stats_epoch_change_with_set_resize-1.json: every validator's tallies end as the vector says (3.6ms)
✔ stf/statistics/full/stats_with_empty_extrinsic-1.json: every validator's tallies end as the vector says (80.3ms)
✔ stf/statistics/full/stats_with_epoch_change-1.json: every validator's tallies end as the vector says (14.0ms)
✔ stf/statistics/full/stats_with_some_extrinsic-1.json: every validator's tallies end as the vector says (51.3ms)
...
ℹ tests 598
ℹ suites 0
ℹ pass 598
ℹ fail 0
...
reported 598 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791740875939
...
```

Eight official vectors, tiny and full: every validator's tallies, before and after.

## Watch it

**New file** `bin/statistics.ts`

```ts
// Moves the validators' tallies on by one block, as a statistics test vector sets it up,
// and shows what changed for whom.
// Usage: npm run statistics [vector], stats_with_epoch_change-1 (tiny) if not given

import { readFileSync } from "node:fs";
import { Extrinsic } from "../src/block.ts";
import { FULL, TINY } from "../src/config.ts";
import { Run } from "../src/obs.ts";
import { ValidatorKey } from "../src/state.ts";
import type { ValidatorStats } from "../src/statistics.ts";
import { updateValidatorStats } from "../src/statistics.ts";

const DEFAULT = "../vectors/stf/statistics/tiny/stats_with_epoch_change-1.json";
const file = process.argv[2] ?? DEFAULT;
const config = file.includes("/full/") ? FULL : TINY;
const v = JSON.parse(readFileSync(file, "utf8"));
const pre = v.pre_state;
const before = { slot: pre.slot, current: pre.vals_curr_stats, last: pre.vals_last_stats };
const validators = pre.curr_validators.map((k: unknown) => ValidatorKey.fromJson(k));
const extrinsic = Extrinsic(config).fromJson(v.input.extrinsic);
const after = updateValidatorStats(config, before, v.input.slot, v.input.author_index, extrinsic,
  validators);

const run = new Run("statistics");
const epoch = (t: number) => Math.floor(t / config.epoch_length);
const turned = epoch(v.input.slot) !== epoch(pre.slot);
console.log(`slot ${pre.slot} → ${v.input.slot}${turned ? ": a new epoch begins" : ""}`);
console.log(`author: validator ${v.input.author_index}`);
console.log("columns: blocks, tickets, preimages, preimage bytes, guarantees, assurances");
/** The tally's fields, side by side. */
const show = (s: ValidatorStats) => Object.values(s).join(" ");
for (let i = 0; i < Math.min(after.current.length, 6); i++) {
  const was = turned ? "fresh" : show(pre.vals_curr_stats[i]);
  console.log(`validator ${i}: ${was} → ${show(after.current[i])}`);
  run.event("validator", { i, before: was, after: show(after.current[i]), epoch_turned: turned });
}
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

**What flows through it.** One block's three faces — the extrinsic going in, the tally
moves the program derives, the lines it prints:

::: code-group

```json [what goes in]
{
  "input": {
    "slot": 123456,
    "author_index": 1,
    "extrinsic": {
      "tickets": [ { "attempt": 0 }, { "attempt": 1 } ],
      "preimages": [ "… three blobs of 16, 17 and 18 bytes …" ],
      "guarantees": [ "… one signed by validators 0 and 1 …", "… one by 2 and 3 …" ],
      "assurances": [ "… two, but they count toward the epoch that just closed …" ]
    }
  },
  "pre_state": { "slot": 123455 }
}
```

```ts [what it computes]
// updateValidatorStats' moves for this block, from that extrinsic
const computed = {
  epochTurned: true, // ⌊123455/12⌋ ≠ ⌊123456/12⌋: every tally restarts from zero
  author: 1, // +1 block, +2 tickets, +3 preimages of 16 + 17 + 18 = 51 bytes
  reporters: [0, 1, 2, 3], // the guarantees' credentials: one guarantee counted each
  assurances: 0, // this block's two belong to the tally that just closed
};
```

```text [what comes out]
slot 123455 → 123456: a new epoch begins
author: validator 1
validator 1: fresh → 1 2 3 51 1 0
```

:::

Read the input into the output: slot 123455 to 123456 crosses an epoch boundary (12
slots an epoch on tiny), so every row starts `fresh`. The author, validator 1, collects
the block, both tickets and all three preimages — 51 bytes between them — plus the
guarantee it co-signed; validators 0, 2 and 3 each get their guarantee; and the two
assurances change nothing here, because assurances land in the epoch being closed.

**Run**

```sh
npm pkg set scripts.statistics="node bin/statistics.ts"
npm run statistics
```

```text
slot 123455 → 123456: a new epoch begins
author: validator 1
columns: blocks, tickets, preimages, preimage bytes, guarantees, assurances
validator 0: fresh → 0 0 0 0 1 0
validator 1: fresh → 1 2 3 51 1 0
validator 2: fresh → 0 0 0 0 1 0
validator 3: fresh → 0 0 0 0 1 0
validator 4: fresh → 0 0 0 0 0 0
validator 5: fresh → 0 0 0 0 0 0
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=statistics-1791740888363
```

The first block of a new epoch: every tally starts fresh, the author, validator 1, gets its
block, its 2 tickets and its 3 preimages of 51 bytes, and the four validators who signed
guarantees get one each. The block's assurances aren't there: they went into the tally that
just closed. The *Validator statistics* panel keeps the table.

![Validator statistics panel](./images/01-validator-statistics.png)

## The scoreboard

`checkStatistics` already runs a statistics vector whole: the tests above call it for every
one. Put the family on the board:

**Replace in** `test/families.ts`

```ts
/** Every family your client runs so far. */
export const FAMILIES: Family[] = [
  { folders: ["codec/tiny", "codec/full"], check: checkCodec },
  { folders: ["trie"], check: checkTrie },
  { folders: ["shuffle"], check: checkShuffle },
  { folders: ["stf/safrole/tiny", "stf/safrole/full"], check: checkSafrole },
  { folders: ["stf/history/tiny", "stf/history/full"], check: checkHistory },
  { folders: ["stf/disputes/tiny", "stf/disputes/full"], check: checkDisputes },
  { folders: ["stf/assurances/tiny", "stf/assurances/full"], check: checkAssurances },
  { folders: ["stf/reports/tiny", "stf/reports/full"], check: checkReports },
  { folders: ["stf/authorizations/tiny", "stf/authorizations/full"], check: checkAuthorizations },
  { folders: ["stf/preimages/tiny", "stf/preimages/full"], check: checkPreimages },
  { folders: ["stf/accumulate/tiny", "stf/accumulate/full"], check: checkAccumulate },
  { folders: ["stf/statistics/tiny", "stf/statistics/full"], check: checkStatistics },
];
```

The milestone's vectors are the `statistics` ones. Here is one, the first block of an epoch with nothing in it, and the board's row for the whole family:

::: code-group

```json [what goes in]
{
  "vector": "vectors/stf/statistics/tiny/stats_with_empty_extrinsic-1.json",
  "input": { "slot": 123457, "author_index": 1, "extrinsic": "empty: nothing in any of the five parts" },
  "pre_state.vals_curr_stats[1]": { "blocks": 15610, "tickets": 17650, "pre_images": 39, "guarantees": 1319 },
  "post_state.vals_curr_stats[1]": { "blocks": 15611, "tickets": 17650, "pre_images": 39, "guarantees": 1319 }
}
```

```text [console]
stf/statistics             8 of 8  ✔

372 of 1,428 vectors pass.
```

:::

*Run whole* for this vector means validator 1's `blocks` tally moves from 15610 to 15611 and nothing else changes, every one of the vector's `vals_curr_stats` and `vals_last_stats` entries equal to the state it names after the block. All 8 `statistics` vectors do that, and the row says `8 of 8`.

**Run**

```sh
npm run typecheck
npm run scoreboard
```

```text
...
The official test vectors, each run whole by your client:

codec                    30 of 30  ✔
erasure                  not run yet (12)
shuffle                    1 of 1  ✔
stf/accumulate         126 of 126  ✔
stf/assurances           22 of 22  ✔
stf/authorizations         6 of 6  ✔
stf/disputes             60 of 60  ✔
stf/history                8 of 8  ✔
stf/preimages             2 of 16
    ✘ stf/preimages/full/preimage_needed-2.json: statistics changed
    ✘ stf/preimages/full/preimage_not_needed-1.json: accepted, not preimage_unneeded
    ✘ stf/preimages/full/preimage_not_needed-2.json: accepted, not preimage_unneeded
    … and 11 more
stf/reports              62 of 92
    ✘ stf/reports/full/big_work_report_output-1.json: cores_statistics changed
    ✘ stf/reports/full/different_core_same_guarantors-1.json: cores_statistics changed
    ✘ stf/reports/full/high_work_report_gas-1.json: cores_statistics changed
    … and 27 more
stf/safrole              46 of 46  ✔
stf/statistics             8 of 8  ✔
traces/fallback          not run yet (100)
traces/fuzzy             not run yet (200)
traces/fuzzy_light       not run yet (200)
traces/preimages         not run yet (100)
traces/preimages_light   not run yet (100)
traces/safrole           not run yet (100)
traces/storage           not run yet (100)
traces/storage_light     not run yet (100)
trie                       1 of 1  ✔

372 of 1,428 vectors pass.
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=scoreboard-1791939736998
```

> [!TIP] Milestone
> **Every statistics vector.** All 8, tiny and full: every validator's tally,
> through epoch changes and a resized validator set, as the vectors keep it.

<details>
<summary>lasair: turning the page, in <code>lib/statistics.ml</code></summary>

```ocaml
(** Check if epoch changed *)
let is_new_epoch (old_time : int) (new_time : int) : bool =
  let epoch_len = Definitions.Constants.c_epoch_len in
  old_time / epoch_len <> new_time / epoch_len

(** Rotate stats at epoch boundary *)
let rotate_epoch (state : activity_state) : activity_state =
  let val_count = Definitions.Constants.c_val_count in
  {
    state with
    previous = state.accumulator;
    accumulator = Array.make val_count empty_validator_stats;
  }
```

The same page-turn, under the Gray Paper's own word: the tally in progress is the
`accumulator`, the finished one `previous`. lasair then updates the accumulator one field
at a time, with a small function for each.

</details>

## Check your understanding

::: check
**The first block of a new epoch carries an assurance from validator 0. Which tally gets it?**

- [ ] The fresh one, since the block is in the new epoch
  > No: assurances count before the page turns, so they never reach the fresh tally.
- [x] The one that just closed, now the last epoch's
  > Yes: assurances count first, then the page turns. They stay with the epoch the block's
  > parent was in.
- [ ] Neither: an epoch's first block drops its assurances
  > No: the test finds validator 0's assurances one higher in the closed tally.

**Same block: its author, validator 1, made it. Where does its block count?**

- [x] In the fresh tally: blocks 1
  > Yes: the author's block, tickets and preimages are counted after the page turns, so
  > they open the new epoch's tally.
- [ ] In the tally that just closed, next to the assurances
  > No: only the assurances count before the page turns.
- [ ] In both
  > No: every piece of work counts once, in one tally.

**A block has two guarantees, one signed by validators 0 and 1, the other by 1 and 2. How many does validator 1 gain?**

- [ ] 2, one for each guarantee it signed
  > No: the reporters are a set. Each validator is in it once, however many guarantees
  > it signed.
- [x] 1
  > Yes: it's a reporter of this block, and every reporter gets one more guarantee.
- [ ] 0: only the author's guarantees count
  > No: every reporter counts, author or not.

**A new epoch begins. What happens to the last epoch's tally from before?**

- [ ] It's added into the new last epoch's tally
  > No: nothing is added up across epochs. There are only ever two tallies.
- [x] It's forgotten: the tally in progress takes its place, and a fresh one begins
  > Yes: π_V becomes π_L, and the old π_L goes.
- [ ] JAM pays the validators from it, then clears it
  > No: JAM pays nobody. Whoever pays validators reads the tallies.

**Why do the tallies leave out auditing and voting on finality?**

- [x] They happen off the chain, so the chain can't see them for itself
  > Yes: blocks, tickets, preimages, guarantees and assurances are all in blocks. Auditing
  > and finality votes aren't.
- [ ] They're counted under assurances
  > No: an assurance says only that a validator holds its piece of a core's data.
- [ ] JAM pays for them itself
  > No: JAM pays nobody, for anything.
:::

## What you have

Every validator's tally, kept the Gray Paper's way, and matching every statistics vector,
whole.
Validators aren't the only ones who work: [lesson 18.2](./02-what-cores-and-services-did.md) scores the cores and the
services, block by block.

Next: [18.2 What cores and services did](./02-what-cores-and-services-did.md)
