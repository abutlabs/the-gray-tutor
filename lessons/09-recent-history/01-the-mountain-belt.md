# The mountain belt

Every JAM block remembers a little of the blocks before it, and one thing it keeps is a
running commitment to *every accumulation output ever*. Bridges to other chains read it
(a bridge is a program on another chain, Ethereum say, that checks what happened on
JAM), so it has to be small, cheap to extend, and checkable with tools those chains already
have. JAM's answer is a *Merkle mountain belt*: a row of perfect little Merkle trees,
"mountains", of sizes 1, 2, 4, 8 and so on. Appending an item is exactly like adding 1 to
a binary number. Really. You'll see it. By the end of this lesson your client keeps the
belt, and its one-hash summary, exactly as the test vectors do.

## New words

- **Merkle mountain belt.** A list of Merkle tree roots, one per power of two, that grows
  one item at a time. *Example:* 5 items make a mountain of 4 and a mountain of 1.
- **Peak.** One mountain's root, or ∅ where the belt has no mountain of that size.
  *Example:* after 5 items the peaks are [a hash, ∅, a hash].
- **Super-peak.** One hash for the whole belt, made from its peaks. *Example:* the
  `beefy_root` in each recent block, named for BEEFY, the way validators sign that hash
  for bridges.
- **Keccak-256.** Ethereum's hash function. It gives 32 bytes, like Blake2b, but different
  ones. *Example:* Keccak-256 of nothing at all starts `0xc5d24601`.

All four are in the [glossary](../glossary.md).

## What the Gray Paper says

Appendix E (*Merkle Mountain Ranges and Belts*). A belt is a list of *peaks*: peak i is
the root of a mountain of 2^i items, or ∅ if there's no mountain of that size.

**Appending** an item l (the function A, which the Gray Paper defines through a helper,
P, that calls itself once per place): start at place 0, carrying l.

- If the place is empty, the carried hash rests there. Done.
- If there's a mountain there, merge: the carried hash becomes H(peak ⌢ carried), the
  place empties, and you move on to the next place, carrying the merged hash.
- If you run off the end, the carried hash becomes a new, biggest mountain.

That's binary addition, with mountains for 1s, empty places for 0s, and merging for
"carry the one". One difference, and it's the whole point: a counter's digit is a bare
1, and carrying throws its 1s away — nothing about 1000 remembers the eight 1s that
made it. Here every held place stores exactly 32 bytes, a Keccak-256 hash, and a carry
hashes the two peaks it eats, so the one peak of 1000 still commits to all 8 items.
A binary counter whose digits are receipts.

Try it. Each tap appends one item. A peak's label reads as the items under it — 1–4 is
the mountain over items 1 to 4 — and the bytes beneath the label are the peak itself,
hashed live on this page with the same items `npm run belt` uses, so every hash and
super-peak here matches what your terminal prints. It starts at 5 items, a mountain of
4 and a mountain of 1. Turn on step by step and watch the carry climb one place at a
time, merging or resting, just as the 1s carried in
[lesson 2.2](../02-codec/02-compact-naturals.md). Then append up to 8, for three merges in a row:

<MountainBelt />

And backwards? Jump to 32 items and the belt is one peak: `· · · · · ●`, 100000, five
mountains collapsed into one by five merges. Now *take one back*. The page manages it
only by cheating — it kept the items and replays 1 to 31 from an empty belt. Your
client never could: each merge's H(peak ⌢ carried) destroyed the two 32-byte peaks it
read, and Keccak has no reverse, so the five peaks of 31 items are not derivable from
the 32-item belt alone. (After 33 the one step back *is* easy — item 33 sits alone in
place 0, unhashed; it's the merges that lock the door.) The belt is a commitment, not
an archive: it can prove the past it was shown, never replay it. And that's fine,
because nothing in JAM ever rewinds the belt — it only appends, one accumulate root
per block.

The *super-peak*, M_R, squeezes a belt into one hash: take the peaks that exist, in
order. None gives 32 zero bytes, and one gives itself. Otherwise it's
H(`$peak` ⌢ M_R(all but the last) ⌢ the last). The `$` marks an ASCII string, as in
[lesson 5.3](../05-hashing-and-signatures/03-signatures.md): the bytes hashed are the four letters `peak`, without the `$`.

Why the label? Without it, the super-peak of two peaks would be H(peak₀ ⌢ peak₁) — the
same 64 bytes a merge hashes. One value would then mean two things: "a belt of two
mountains" and "one mountain twice the size" would hash identically, and a bridge
signing the super-peak couldn't say which it had signed. The four letters make the
super-peak's input 68 bytes, which no merge can ever produce. It's the same trick as
the signing contexts of [lesson 8.9](../08-safrole/09-seals.md): every hash first states what it is. Like
writing TOTAL beside the sum on a receipt, so the total can never be read as one more
item.

Here is M_R on the history vectors' real belts, hashed live on this page — the belt of 9
items is the one with a merge to watch, and every answer is the vector's own `beefy_root`:

<SuperPeak />

And the hash? Not Blake2b, for once. §7 says the belt uses *Keccak-256*, Ethereum's
hash, "to maximize compatibility with legacy systems": a bridge contract on Ethereum can
check JAM's belt with a hash it has built in.

## A second hash

`@noble/hashes` has Keccak too. No new dependency:

**Add to** `src/hash.ts`

```ts
import { keccak_256 } from "@noble/hashes/sha3.js";

/** Keccak-256, the hash Ethereum uses, for the parts of JAM that other chains must read. */
export function keccak256(data: Bytes): Bytes {
  return keccak_256(data);
}
```

## The tests

**New file** `test/belt.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { appendToBelt, superPeak } from "../src/belt.ts";
import type { Belt } from "../src/belt.ts";
import { fromHex, toHex } from "../src/bytes.ts";
import { keccak256 } from "../src/hash.ts";
import { vectorFiles, vectorJson } from "./vectors.ts";
import type { Bytes } from "../src/bytes.ts";

test("Keccak-256 of nothing at all", () => {
  const empty: string = "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470";
  const hashed: string = toHex(keccak256(new Uint8Array(0)));
  assert.equal(hashed, empty);
});

test("appending is counting in binary: mountains of 1, 2, 4...", () => {
  const a: Bytes = new Uint8Array(32).fill(1);
  let belt: Belt = [];
  belt = appendToBelt(belt, a); // 1 item:  [a]
  belt = appendToBelt(belt, a); // 2 items: [-, H(a ⌢ a)]
  const aa: Bytes = keccak256(new Uint8Array(64).fill(1)); // H(a ⌢ a)
  assert.deepEqual(belt, [null, aa]);
  belt = appendToBelt(belt, a); // 3 items: [a, H(a ⌢ a)]
  const lowest: Bytes | null = belt[0];
  assert.deepEqual(lowest, a);
});

/** A history test vector: the parts of it this lesson uses. */
type HistoryVector = {
  input: { accumulate_root: string };
  pre_state: { beta: { mmr: { peaks: (string | null)[] } } };
  post_state: { beta: { history: { beefy_root: string }[]; mmr: { peaks: (string | null)[] } } };
};

const belt = (peaks: (string | null)[]): Belt => peaks.map((p) => (p === null ? null : fromHex(p)));

test("the belt after each block of the history vectors, and its super-peak", () => {
  let checked = 0;
  for (const size of ["tiny", "full"]) {
    for (const name of vectorFiles(`stf/history/${size}`)) {
      const { input, pre_state, post_state } = vectorJson(name) as HistoryVector;
      const before: Belt = belt(pre_state.beta.mmr.peaks);
      const after: Belt = appendToBelt(before, fromHex(input.accumulate_root));
      const expected: Belt = belt(post_state.beta.mmr.peaks);
      assert.deepEqual(after, expected, name);
      const newest = post_state.beta.history[post_state.beta.history.length - 1];
      const peak: string = toHex(superPeak(after));
      assert.equal(peak, newest.beefy_root, name);
      checked++;
    }
  }
  assert.equal(checked, 8);
});
```

The vectors are the `history` ones ([lesson 9.2](./02-recent-blocks.md) uses the rest of them). Each gives the
belt before a block, the item appended (`accumulate_root`), the belt after, and, in the
newest block's history entry, the super-peak as `beefy_root`. Between them they hold
belts of 1, 2, 8 and 9 items, so the 7 → 8 append carries all the way up, three merges
in a row.

A stub that never merges: every item becomes a peak of its own, and the super-peak is
zeros.

**New file** `src/belt.ts`

```ts
// The accumulation output belt (GP §7, App. E): a Merkle mountain belt. A compact
// commitment to every block's accumulation outputs, built with Keccak so that other chains
// can check it.

import type { Bytes } from "./bytes.ts";

/** A mountain belt: peak i is the root of 2^i items, or null if there's no such mountain. */
export type Belt = (Bytes | null)[];

export function appendToBelt(belt: Belt, item: Bytes): Belt {
  return [...belt, item];
}

export function superPeak(belt: Belt): Bytes {
  return new Uint8Array(32);
}
```

**Run, expect it to fail**

```sh
npm test
```

```text
...
✖ appending is counting in binary: mountains of 1, 2, 4... (1.9ms)
✖ the belt after each block of the history vectors, and its super-peak (0.9ms)
...
ℹ tests 90
ℹ suites 0
ℹ pass 88
ℹ fail 2
...
test at test/belt.test.ts:16:1
✖ appending is counting in binary: mountains of 1, 2, 4... (1.9ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
  + actual - expected

    [
  -   null,
      Uint8Array(32) [
  +     1,
...
```

Red, in the two tests that append. Read the first diff from its top. The expected belt
(the `-` lines) starts with `null`, an empty place, because two items should merge into
one mountain of 2 in place 1. Your stub's belt (the `+` lines) starts with the item
itself, its 32 bytes all 1, and has it again in place 1: two mountains of 1, side by
side. The Keccak test already passes: the hash was there before the belt.

## The code

Now the real thing, the whole file again:

**Rewrite** `src/belt.ts`

```ts
// The accumulation output belt (GP §7, App. E): a Merkle mountain belt. A compact
// commitment to every block's accumulation outputs, built with Keccak so that other chains
// can check it.

import type { Bytes } from "./bytes.ts";
import { concatBytes } from "./bytes.ts";
import { keccak256 } from "./hash.ts";

/** A mountain belt: peak i is the root of 2^i items, or null if there's no such mountain. */
export type Belt = (Bytes | null)[];

/** A (GP App. E): append an item, merging equal mountains as it goes, like adding 1 in binary. */
export function appendToBelt(belt: Belt, item: Bytes): Belt {
  const peaks = [...belt];
  let carry = item;
  for (let i = 0; i < peaks.length; i++) {
    const peak = peaks[i];
    if (peak === null) {
      peaks[i] = carry; // an empty place: the mountain rests here
      return peaks;
    }
    carry = keccak256(concatBytes(peak, carry)); // two mountains of 2^i make one of 2^(i+1)
    peaks[i] = null;
  }
  peaks.push(carry); // a new, biggest mountain
  return peaks;
}

/** "$peak" in the Gray Paper: the $ marks an ASCII string, as in lesson 5.3. */
const PEAK = new TextEncoder().encode("peak");

/** M_R (GP App. E): the super-peak, one hash for the whole belt. */
export function superPeak(belt: Belt): Bytes {
  const peaks = belt.filter((peak) => peak !== null);
  if (peaks.length === 0) return new Uint8Array(32);
  if (peaks.length === 1) return peaks[0];
  const last = peaks[peaks.length - 1];
  return keccak256(concatBytes(PEAK, superPeak(peaks.slice(0, -1)), last));
}
```

The merge is two lines in the loop:

```ts
    carry = keccak256(concatBytes(peak, carry)); // two mountains of 2^i make one of 2^(i+1)
    peaks[i] = null;
```

The Gray Paper writes A's helper P as a recursion; `appendToBelt` is the same thing as a
loop, carrying one hash along the places. `superPeak` stays recursive, just as the Gray
Paper writes it: fold all but the last, then join the last on.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ Keccak-256 of nothing at all (1.1ms)
✔ appending is counting in binary: mountains of 1, 2, 4... (0.9ms)
✔ the belt after each block of the history vectors, and its super-peak (16.7ms)
...
ℹ tests 90
ℹ suites 0
ℹ pass 90
ℹ fail 0
...
reported 90 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791731459401
...
```

## Watch it

**New file** `bin/belt.ts`

```ts
// Grows a mountain belt one item at a time and shows its peaks after each append:
// ● a mountain, · an empty place, smallest mountain first.
// Usage: npm run belt [how many items, 16 unless you say]

import { appendToBelt, superPeak } from "../src/belt.ts";
import type { Belt } from "../src/belt.ts";
import { toHex } from "../src/bytes.ts";
import { keccak256 } from "../src/hash.ts";
import { Run } from "../src/obs.ts";

const count = Number(process.argv[2] ?? 16);
const run = new Run("belt");
let belt: Belt = [];
for (let items = 1; items <= count; items++) {
  belt = appendToBelt(belt, keccak256(new Uint8Array([items]))); // any 32 bytes will do
  const peaks = belt.map((peak) => (peak === null ? "·" : "●")).join(" ");
  const top = `${toHex(superPeak(belt)).slice(0, 10)}…`;
  console.log(`after ${String(items).padStart(3)}: ${peaks.padEnd(12)} super-peak ${top}`);
  run.event("append", { items, peaks, superPeak: superPeak(belt) });
}
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

**Run**

```sh
npm pkg set scripts.belt="node bin/belt.ts"
npm run belt
```

```text
after   1: ●            super-peak 0x5fe7f977…
after   2: · ●          super-peak 0x71d8979c…
after   3: ● ●          super-peak 0xacb31462…
after   4: · · ●        super-peak 0x3ef0aafe…
after   5: ● · ●        super-peak 0x57bba00c…
after   6: · ● ●        super-peak 0xe1de474b…
after   7: ● ● ●        super-peak 0xe7b9b123…
after   8: · · · ●      super-peak 0x62762e65…
after   9: ● · · ●      super-peak 0x13f2e75e…
after  10: · ● · ●      super-peak 0x643b865f…
after  11: ● ● · ●      super-peak 0xa6d8952e…
after  12: · · ● ●      super-peak 0xd8e5acd3…
after  13: ● · ● ●      super-peak 0x52b36038…
after  14: · ● ● ●      super-peak 0xba074758…
after  15: ● ● ● ●      super-peak 0xc4c91480…
after  16: · · · · ●    super-peak 0x77a03478…
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=belt-1791731463475
```

Your hashes are these same ones: the items are fixed bytes, so only the link's run id
changes from run to run. Now read the dots from right to left: after 5, `● · ●` is 101, after 6 `· ● ●` is 110, after
8 `· · · ●` is 1000. The belt *is* the count in binary, written backwards, smallest
mountain first. Watch 7 → 8: three mountains merge into one, like 0111 + 1 = 1000. The
*Belt* panel has every step; try `npm run belt 100`.

![Belt panel](./images/01-belt.png)

<details>
<summary>lasair: <code>mmr_append</code>, in <code>conformance/history_stf.ml</code></summary>

```ocaml
let mmr_append (peaks : bytes option list) (leaf : bytes) : bytes option list =
  let rec carry peaks hash =
    match peaks with
    | [] -> [Some hash]  (* No more peaks, place here *)
    | None :: rest -> Some hash :: rest  (* Empty slot, place here *)
    | Some p :: rest ->
      (* Combine with existing peak, carry to next level *)
      let combined = hash_combine p hash in
      None :: carry rest combined
  in
  carry peaks leaf
```

The same three cases as the Gray Paper's P, as a pattern match on the list: off the end,
an empty place, or a mountain to merge with. This is the code lasair runs against the
same `history` vectors. OCaml's `match` makes the binary counter almost a poem.

</details>

## Check your understanding

::: check
**The belt holds 5 items: a mountain of 4 and a mountain of 1, `● · ●`. What does a sixth item do?**

- [ ] It becomes a second mountain of 1, next to the first
  > No: place 0 is taken, and two mountains of one size never sit side by side. The new
  > item merges with the mountain there.
- [x] It merges with the mountain of 1, and the merged mountain of 2 rests in the empty place 1
  > Yes: H(peak ⌢ item) carries to place 1, finds it empty, and stops. The belt is
  > `· ● ●`, 110 read right to left: 6.
- [ ] It merges with the mountain of 4
  > No: the carry starts at place 0 and climbs one place at a time. A mountain of 4 only
  > merges with another mountain of 4.

**`bin/history.ts` prints the belt `● · · · ● ●`. How many items are in it?**

- [ ] 3, one per mountain
  > No: a mountain in place i holds 2^i items. These three hold 1, 16 and 32.
- [ ] 35
  > No: that reads the dots left to right, as 100011. The belt puts the smallest
  > mountain first, so read it right to left.
- [x] 49
  > Yes: right to left it's 110001, 32 + 16 + 1 = 49. One accumulation root for each
  > block so far, and the newest block in that history is slot 49.

**A belt of exactly 4 items has one peak. What is its super-peak?**

- [x] That peak, unchanged
  > Yes: M_R of a single peak is the peak itself. `$peak` only comes in when there are
  > two or more.
- [ ] H(`peak` ⌢ the peak)
  > No: that prefix joins a fold of the earlier peaks to the last one. With one peak
  > there's nothing to join.
- [ ] 32 zero bytes
  > No: zeros are for a belt with no peaks at all. This one has a mountain over all 4
  > items.

**Appending item 32 merges five times and leaves one peak: [∅, ∅, ∅, ∅, ∅, a hash]. Can the client compute the 31-item belt — the five peaks that were there — from the 32-item belt alone?**

- [ ] Yes: split the hash back into the five peaks it was built from
  > No: Keccak-256 is one-way. Each merge's H(peak ⌢ carried) read 64 bytes and kept
  > 32; no amount of work recovers the inputs from the output.
- [ ] Yes: the hash still contains all 31 items, so decode them back out
  > No: 32 bytes *commit* to the items, they don't *contain* them. The belt can prove
  > a past it was shown, never replay one — a receipt, not a copy.
- [x] No: only replaying items 1 to 31 onto an empty belt rebuilds those peaks
  > Yes: the items themselves are the only road back, and the belt doesn't keep them.
  > That's fine — JAM only ever appends. After 33, though, one step back would be easy:
  > item 33 sits alone in place 0, unhashed, so clearing the place is the whole step.

**Why does the belt hash with Keccak-256, not Blake2b like the rest of JAM?**

- [ ] Keccak-256 is faster
  > No: speed isn't the reason. §7 gives one: "to maximize compatibility with legacy
  > systems".
- [x] A bridge on Ethereum can check the belt with a hash it already has built in
  > Yes: Keccak-256 is Ethereum's own hash. The belt is there for other chains to read,
  > so it speaks their hash.
- [ ] Blake2b can't hash two 32-byte peaks together
  > No: Blake2b hashes any bytes. [Lesson 6.1](../06-state-and-merklization/01-the-state-trie.md)'s trie hashes pairs of hashes with it.
:::

## What you have

A Merkle mountain belt, the commitment JAM keeps for bridges, appended to in a handful of
hashes per block, whatever its length. The belt's super-peak is one of the things the
chain writes down for every block; [lesson 9.2](./02-recent-blocks.md) keeps the rest of that record.

Next: [9.2 Recent blocks](./02-recent-blocks.md)
