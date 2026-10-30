# The shuffle

JAM deals its validators out to cores: these three guarantee core 0 for a while, those
three core 1. The deal must be **random**, so nobody can arrange to sit where their
friends' work is, and **the same on every node**, or they'd disagree about who may do
what. Random, yet the same answer everywhere: a shuffle driven by a hash everyone shares.

## New words

- **Fisher-Yates shuffle.** Shuffling by picking items one at a time, each pick from the
  items still left. *Example:* a b c d with the numbers 1, 1, 0, 0 gives b d a c, below.

It's in the [glossary](../glossary.md).

## What the Gray Paper says

Appendix F defines F, a Fisher-Yates shuffle, in two layers.

**F(s, r)** shuffles a sequence s with a sequence of numbers r. Take the first number,
r₀, and l, how many items are left:

1. pick the item at index r₀ mod l;
2. put the *last* item into the gap it leaves, and drop the last place;
3. go again with what's left and the rest of the numbers.

The picks, in order, are the shuffled sequence. Here are four letters shuffled with the
numbers 1, 1, 0, 0:

| Step | Left | Number | Index | Pick | Then |
| --- | --- | --- | --- | --- | --- |
| 1 | a b c d | 1 | 1 mod 4 = 1 | b | d fills b's gap |
| 2 | a d c | 1 | 1 mod 3 = 1 | d | c fills d's gap |
| 3 | a c | 0 | 0 mod 2 = 0 | a | c fills a's gap |
| 4 | c | 0 | 0 mod 1 = 0 | c | nothing left |

Result: b, d, a, c.

![The four-letter shuffle from the table, one row per step: the items left, with the pick highlighted and an arrow from the last item into the gap the pick leaves, and on the right the picks so far, ending b, d, a, c.](./images/02-shuffle-steps.svg)

Step through it yourself, then through the eight numbers of the run below.

<ShuffleSteps />

**Q_l(h)** makes the numbers: l of them, from a 32-byte hash h. Hash h together with
ℰ₄(0), and the 32 bytes that come out are eight 4-byte numbers, read with ℰ₄⁻¹. Hash h
with ℰ₄(1) for the next eight, and so on. **F(s, h)** is F(s, Q_l(h)): the shuffle as JAM
uses it, with l the length of s.

## The tests

**New file** `test/shuffle.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { fromHex } from "../src/bytes.ts";
import { shuffle, shuffleWithHash } from "../src/shuffle.ts";
import { vectorJson } from "./vectors.ts";

test("a shuffle by hand: four letters, four numbers", () => {
  const shuffled: string[] = shuffle(["a", "b", "c", "d"], [1, 1, 0, 0]);
  assert.deepEqual(shuffled, ["b", "d", "a", "c"]);
});

test("the shuffle vectors: 0 to 341 items, shuffled by a hash", () => {
  const vectors = vectorJson("shuffle/shuffle_tests.json") as {
    input: number; // how many items: 0, 1, 2, ... input − 1
    entropy: string;
    output: number[];
  }[];
  for (const { input, entropy, output } of vectors) {
    const items: number[] = Array.from({ length: input }, (_, i) => i);
    const shuffled: number[] = shuffleWithHash(items, fromHex(`0x${entropy}`));
    assert.deepEqual(shuffled, output);
  }
});
```

The first test is the table above. The eight vectors give just a length (0, 8, 16, 20,
50, 100, 200 or 341) and a hash; the items are always 0, 1, 2 and so on, so the test
builds them. 341 is the full network's core count, though the deal in [lesson
12.1](../12-guarantees/01-who-guarantees-what.md) shuffles 1,023 seats, one per validator.

A stub that doesn't shuffle at all: every list comes back as it went in.

**New file** `src/shuffle.ts`

```ts
// The shuffle (GP App. F): a Fisher-Yates shuffle that every node can repeat, because the
// randomness it uses comes from a hash they all share.

import type { Bytes } from "./bytes.ts";

export function shuffle<T>(items: T[], numbers: number[]): T[] {
  return items;
}

export function numbersFromHash(h: Bytes, l: number): number[] {
  return [];
}

export function shuffleWithHash<T>(items: T[], h: Bytes): T[] {
  return items;
}
```

**Run, expect it to fail**

```sh
npm test
```

```text
...
✖ a shuffle by hand: four letters, four numbers (3.9ms)
✖ the shuffle vectors: 0 to 341 items, shuffled by a hash (1.0ms)
...
ℹ tests 71
ℹ suites 0
ℹ pass 69
ℹ fail 2
...
test at test/shuffle.test.ts:7:1
✖ a shuffle by hand: four letters, four numbers (3.9ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
  + actual - expected

    [
  +   'a',
      'b',
  +   'c',
      'd',
  -   'a',
  -   'c'
    ]

      at TestContext.<anonymous> (…/client/test/shuffle.test.ts:9:10)
...
    actual: [ 'a', 'b', 'c', 'd' ],
    expected: [ 'b', 'd', 'a', 'c' ],
...
```

Red: the stub hands every list back as it was, `a b c d`, where the table above says
`b d a c`.

## The code

**Replace in** `src/shuffle.ts`

```ts
import { concatBytes } from "./bytes.ts";
import type { Trace } from "./codec/reader.ts";
import { decodeFixed, encodeFixed } from "./codec/numbers.ts";
import { blake2b256 } from "./hash.ts";

/** F(s, r): pick item r₀ mod l, put the last item in its place, and go again with r₁... */
export function shuffle<T>(items: T[], numbers: number[], trace?: Trace): T[] {
  const left = [...items]; // what's still to be picked
  const out: T[] = [];
  for (const number of numbers.slice(0, items.length)) {
    const index = number % left.length;
    const picked = left[index];
    trace?.event("pick", { number, left: left.length, index, picked });
    out.push(picked);
    left[index] = left[left.length - 1]; // the last item fills the gap
    left.pop();
  }
  return out;
}

/** Q_l(h): l numbers from a hash. Each Blake2b of h and a counter gives eight of them. */
export function numbersFromHash(h: Bytes, l: number): number[] {
  const numbers: number[] = [];
  for (let i = 0; i < l; i++) {
    const block = blake2b256(concatBytes(h, encodeFixed(BigInt(Math.floor(i / 8)), 4)));
    const at = (4 * i) % 32; // number i is bytes 4i to 4i + 4 of its block, wrapping at 32
    numbers.push(Number(decodeFixed(block.subarray(at, at + 4))));
  }
  return numbers;
}

/** F(s, h): the shuffle as JAM uses it, with its numbers drawn from a hash. */
export function shuffleWithHash<T>(items: T[], h: Bytes, trace?: Trace): T[] {
  return shuffle(items, numbersFromHash(h, items.length), trace);
}
```

The Gray Paper writes F as a recursion: pick one, then F of the rest. `shuffle` is the
same as a loop, one pick per number, and never runs out of stack. `numbersFromHash`
hashes for every number, recomputing each block eight times: wasteful, but it reads like Q.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ a shuffle by hand: four letters, four numbers (0.8ms)
✔ the shuffle vectors: 0 to 341 items, shuffled by a hash (30.4ms)
...
ℹ tests 71
ℹ suites 0
ℹ pass 71
ℹ fail 0
...
reported 71 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791729471524
...
```

### Break it on purpose

Step 2 can look like an odd choice. Why move the last item into the gap, rather than just
close it up? Find out: in `shuffle`, replace the two lines

```ts
    left[index] = left[left.length - 1]; // the last item fills the gap
    left.pop();
```

with the more obvious

```ts
    left.splice(index, 1);
```

and run `npm test`. Both tests go red: the letters come out b, c, a, d. That's still a
perfectly fair shuffle, but it isn't *JAM's* shuffle, and a shuffle that every node must
agree on has to agree down to the last detail. (Moving the last item in is also faster: no
shifting everything after the gap.) Put the two lines back.

## Watch it

**New file** `bin/shuffle.ts`

```ts
// Shuffles the numbers 0 to n − 1 with a hash, as the shuffle vectors do, and shows each
// pick on the way.
// Usage: npm run shuffle <how many> <hash>, e.g.
//        npm run shuffle 8 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff

import { fromHex } from "../src/bytes.ts";
import { Run } from "../src/obs.ts";
import { shuffleWithHash } from "../src/shuffle.ts";

const [count, hash] = process.argv.slice(2);
const items = Array.from({ length: Number(count) }, (_, i) => i);
const run = new Run("shuffle");
const shuffled = shuffleWithHash(items, fromHex(hash), {
  event(step, fields) {
    run.event(step, fields);
    const { number, left, index, picked } = fields as Record<string, number>;
    const sum = `${String(number).padStart(10)} mod ${String(left).padStart(3)} = ${index}`;
    console.log(`${sum}: pick ${picked}`);
  },
});
const order = shuffled.join(", ");
console.log(`shuffled: ${order}`);
run.event("shuffled", { order });
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

What flows through it:

::: code-group

```text [what goes in]
8                      argv: shuffle the numbers 0 to 7
0xffffffffffffffff…    argv: the hash the picks are read from — 32 bytes of ff,
                       the second shuffle vector's own entropy
```

```ts [what it computes]
const shuffle = {
  numbers: 8, // one u32 read from the hash per pick, 3180133873 first
  firstPick: 1, // 3180133873 mod 8: the item at index 1
  order: [1, 2, 6, 0, 7, 4, 3, 5], // every pick in turn: the vector's answer
};
```

```text [what comes out]
3180133873 mod   8 = 1: pick 1
shuffled: 1, 2, 6, 0, 7, 4, 3, 5
```

:::

Two arguments in, eight picks out: each line is one number read from the hash, taken
mod the items still left, and the pick it lands on.

**Run**

```sh
npm pkg set scripts.shuffle="node bin/shuffle.ts"
npm pkg set scripts.shuffle-eight="node bin/shuffle.ts 8 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
npm run shuffle-eight
```

```text
3180133873 mod   8 = 1: pick 1
2874123541 mod   7 = 2: pick 2
1702679006 mod   6 = 2: pick 6
3779386820 mod   5 = 0: pick 0
 313342713 mod   4 = 1: pick 7
1075366959 mod   3 = 0: pick 4
2867850673 mod   2 = 1: pick 3
 573291173 mod   1 = 0: pick 5
shuffled: 1, 2, 6, 0, 7, 4, 3, 5
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=shuffle-1791729474845
```

That's the second shuffle vector, worked out step by step. Look at the third pick: the
number lands on index 2, and the item there is 6, not 2. The first two picks moved items
7 and 6 into their gaps. The *Shuffle* panel, on the **3 · Consensus** dashboard, has every
pick and the final order; try a hash of your own, and a longer list.

![Shuffle panel](./images/02-shuffle.png)

## The scoreboard

Like the trie's, the shuffle vectors' test runs their one file whole, so it becomes the
scoreboard's `shuffle` family, and the test calls it:

**Add to** `test/families.ts`

```ts
import { shuffleWithHash } from "../src/shuffle.ts";

/** The shuffle vector: 0, 1, 2… shuffled by each case's hash, in the vector's order. */
export function checkShuffle(name: string) {
  const cases = vectorJson(name) as { input: number; entropy: string; output: number[] }[];
  for (const { input, entropy, output } of cases) {
    const items: number[] = Array.from({ length: input }, (_, i) => i);
    assert.deepEqual(shuffleWithHash(items, fromHex(`0x${entropy}`)), output);
  }
}
```

**Replace in** `test/families.ts`

```ts
/** Every family your client runs so far. */
export const FAMILIES: Family[] = [
  { folders: ["codec/tiny", "codec/full"], check: checkCodec },
  { folders: ["trie"], check: checkTrie },
  { folders: ["shuffle"], check: checkShuffle },
];
```

**Rewrite** `test/shuffle.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { shuffle } from "../src/shuffle.ts";
import { checkShuffle } from "./families.ts";

test("a shuffle by hand: four letters, four numbers", () => {
  const shuffled: string[] = shuffle(["a", "b", "c", "d"], [1, 1, 0, 0]);
  assert.deepEqual(shuffled, ["b", "d", "a", "c"]);
});

test("the shuffle vectors: 0 to 341 items, shuffled by a hash", () =>
  checkShuffle("shuffle/shuffle_tests.json"));
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

32 of 1,428 vectors pass.
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=scoreboard-1791939055623
```

> [!TIP] Milestone
> **The shuffle vector.** All eight of its shuffles, from no items to 341, deal
> the same hand as the vector's.

<details>
<summary>lasair: <code>sequence_from_hash</code>, in <code>lib/utilities.ml</code></summary>

```ocaml
  (* Cache for blake hashes - one hash covers 8 integers *)
  let cached_hash = ref Bytes.empty in
  let cached_block = ref (-1) in

  for i = 0 to len - 1 do
    let block = i / 8 in

    (* Compute hash for this block if not cached *)
    if block <> !cached_block then begin
```

lasair hashes once per eight numbers and keeps the result; your `numbersFromHash` hashes
once per number. Same numbers, an eighth of the work. Its shuffle, next door, moves the
last item into the gap exactly as yours does: `work.(index) <- work.(remaining - 1)`.

</details>

## Check your understanding

::: check
**Shuffling `a b c d` with 1, 1, 0, 0: once b is picked, why is what's left `a d c`, not `a c d`?**

- [x] The last item, d, moves into b's gap
  > Yes: step 2 of F. The gap is filled from the end, so nothing else moves.
- [ ] What's left is shuffled again after every pick
  > No: nothing is shuffled again. Only one item moves: the last, into the gap.
- [ ] Which item fills the gap is random
  > No: nothing in F is random by itself. All the randomness is in the numbers, and the
  > same numbers give the same picks on every node.

**Why does JAM shuffle with numbers from a hash everyone shares, not each node's own random numbers?**

- [ ] A hash is more random than a computer's random numbers
  > No: how random isn't the point. A node's own random numbers would be different on
  > every node.
- [ ] So nobody can work out the deal before the others
  > No: anyone with the hash can work it out, and every node does. What matters is that
  > they all get the same answer.
- [x] Every node must deal the same hand, and a shared hash gives them all the same numbers
  > Yes: random, so nobody can arrange their seat, and yet the same everywhere, so every
  > node agrees who may do what.

**Close the gap with `splice` instead, and the letters come out b, c, a, d. What's wrong with that?**

- [ ] It isn't a fair shuffle any more
  > No: it's still perfectly fair. Every order is as likely as before.
- [x] It's fair, but it isn't JAM's shuffle, and every node must agree to the last detail
  > Yes: the same numbers deal a different hand, b c a d instead of b d a c. A node
  > dealing that hand would disagree with all the others.
- [ ] Nothing: the vectors accept any fair shuffle
  > No: each vector gives one exact order, and both tests go red.

**A shuffle of 20 items. How many Blake2b hashes does Q need for its numbers?**

- [ ] 20: one hash for each number
  > No: one 32-byte hash holds eight 4-byte numbers. (Your `numbersFromHash` does hash 20
  > times, but makes only three different hashes.)
- [x] 3: h with ℰ₄(0), with ℰ₄(1), and with ℰ₄(2)
  > Yes: each hash gives eight numbers. Two cover 16, and a third gives the last four, with
  > four to spare.
- [ ] 1: one hash is enough for any shuffle
  > No: one hash holds only eight numbers, and a shuffle of 20 items takes 20.

**In `bin/shuffle.ts`'s third pick, 1702679006 mod 6 = 2, yet the item picked is 6, not 2. Why?**

- [ ] Item 2 was picked already, so F takes the next one along
  > No: F never looks for a next one. Index 2 holds whatever filled its gap.
- [x] The first two picks moved 7 and then 6 into their gaps, so 6 now sits at index 2
  > Yes: 1 goes and 7 fills index 1; 2 goes and 6 fills index 2. What's left is
  > 0 7 6 3 4 5.
- [ ] The number is too big, so it wraps round
  > No: `mod 6` already did the wrapping, giving 2. The question is what sits at index 2.
:::

## What you have

A shuffle every node agrees on: give it a list and a hash, and every JAM client in the
world deals the same hand, the shuffle vector's included. [Part 8](../08-safrole/index.md) puts epochs and entropy to work in Safrole, the
lottery that picks who makes each block, and borrows this lesson's way of reading numbers
out of a hash. The shuffle itself comes back in [lesson 12.1](../12-guarantees/01-who-guarantees-what.md), to deal guarantors to
cores.

Next: [Part 8 · Safrole](../08-safrole/index.md)
