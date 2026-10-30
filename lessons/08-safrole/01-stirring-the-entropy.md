# Stirring the entropy

[Part 8](./index.md) is *Safrole*, JAM's block-production engine: *who makes the next block?* A
lottery whose winners stay secret until their slot comes, and a lottery is only as fair
as its randomness. This lesson keeps that randomness, η, fresh, one block at a time.

## New words

- **Safrole.** JAM's way of choosing who makes each block: a lottery run one epoch ahead,
  with a fallback when it fizzles. *Example:* this whole part, put together in
  [lesson 8.5](./05-one-step-of-safrole.md).
- **Entropy.** η. Randomness the chain gathers from every block, so that no one can
  predict the future lotteries. *Example:* η₀, stirred by every block.
- **VRF.** A signature whose output is random, yet can't be chosen by the signer: for a
  given key and input (the Gray Paper's *context*) it comes out one way only, and anyone
  can check it. *Example:*
  the header's 96-byte `entropy_source`.
- **Optional field.** A field written with a `?`, which an object may leave out; reading a
  missing one gives `undefined`. *Example:* `output: { err?: string }`, a vector's output,
  which carries an error or doesn't.

All four are in the [glossary](../glossary.md).

## What the Gray Paper says

§6 (*Sealing and Entropy Accumulation*): every block stirs new randomness into η₀, the
accumulator:

> η′₀ = H(η₀ ⌢ Y(H_V))

H_V is the header's `entropy_source` ([lesson 4.6](../04-blocks/06-the-header.md)): a 96-byte Bandersnatch *VRF*
signature by the block's author. Y(H_V) is its *output*, 32 bytes of randomness with a
special property. The author can't choose it: for a given key and input (here, a fixed
label and the block's seal), a VRF's output comes out one way only. Yet everyone can check it was made honestly. So
nobody, not even the author, can steer what goes into η.

Computing Y is [lesson 8.6](./06-the-vrf-output.md)'s job. Until then, the `safrole` test vectors hand it to you,
as `input.entropy`. And the rest of η′ is [lesson 7.1](../07-time-and-shuffling/01-epochs.md)'s
history: moved along one at a new epoch, unchanged otherwise.

## The tests

The safrole vectors come as a folder of small scenarios, so the tests need a way to list
a folder:

**Add to** `test/vectors.ts`

```ts
import { readdirSync } from "node:fs";

/** The JSON vectors in a folder of vectors/, by name, such as "stf/safrole/tiny". */
export function vectorFiles(folder: string): string[] {
  const files = readdirSync(VECTORS + folder).filter((f) => f.endsWith(".json"));
  return files.map((f) => `${folder}/${f}`);
}
```

**New file** `test/safrole.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { fromHex, toHex } from "../src/bytes.ts";
import { FULL, TINY } from "../src/config.ts";
import { epochOf } from "../src/epoch.ts";
import { nextEntropy } from "../src/safrole.ts";
import { vectorFiles, vectorJson } from "./vectors.ts";
import type { Bytes } from "../src/bytes.ts";

/** A safrole test vector: the parts of it the lessons use so far. */
type SafroleVector = {
  input: { slot: number; entropy: string };
  pre_state: { tau: number; eta: string[] };
  post_state: { eta: string[] };
  output: { err?: string };
};

test("η′: each block stirs its VRF output into η₀, and a new epoch moves the history", () => {
  let checked = 0;
  for (const config of [TINY, FULL]) {
    for (const name of vectorFiles(`stf/safrole/${config.name}`)) {
      const { input, pre_state, post_state, output } = vectorJson(name) as SafroleVector;
      if (output.err) continue; // a rejected block changes nothing
      const newEpoch: boolean = epochOf(config, input.slot) > epochOf(config, pre_state.tau);
      const vrfOutput: Bytes = fromHex(input.entropy);
      const eta: Bytes[] = nextEntropy(pre_state.eta.map(fromHex), vrfOutput, newEpoch);
      const etaHex: string[] = eta.map(toHex);
      assert.deepEqual(etaHex, post_state.eta, name);
      checked++;
    }
  }
  assert.equal(checked, 33); // 15 tiny, 18 full
});
```

Some vectors describe blocks that must be *rejected*: a bad slot, a bad ticket. Their
`output` is an `err`, and their state doesn't change at all. Rejecting them takes checks
this part can't make yet ([lesson 8.5](./05-one-step-of-safrole.md) says which), so for now the test skips them, and
counts the rest: 15 on tiny, 18 on full.

A stub that stirs nothing in: the entropy comes back as it went.

**New file** `src/safrole.ts`

```ts
// Safrole (GP §6): JAM's block-production engine. It decides who may seal each slot, and
// keeps the chain's randomness fresh.

import type { Bytes } from "./bytes.ts";

export function nextEntropy(entropy: Bytes[], vrfOutput: Bytes, newEpoch: boolean): Bytes[] {
  return entropy;
}
```

**Run, expect it to fail**

```sh
npm test
```

```text
...
✖ η′: each block stirs its VRF output into η₀, and a new epoch moves the history (2.3ms)
...
ℹ tests 72
ℹ suites 0
ℹ pass 71
ℹ fail 1
...
test at test/safrole.test.ts:18:1
✖ η′: each block stirs its VRF output into η₀, and a new epoch moves the history (2.3ms)
  AssertionError [ERR_ASSERTION]: stf/safrole/tiny/enact-epoch-change-with-no-tickets-1.json
  + actual - expected

    [
  +   '0x03170a2e7597b7b7e3d84c05391d139a62b157e78786d8c082f29dcf4c111314',
  -   '0xa0243a82952899598fcbc74aff0df58a71059a9882d4416919055c5d64bf2a45',
      '0xee155ace9c40292074cb6aff8c9ccdd273c81648ff1149ef36bcea6ebb8a3e25',
      '0xbb30a42c1e62f0afda5f0a4e8a562f7a13a24cea00ee81917b86b89e801314aa',
      '0xe88bd757ad5b9bedf372d8d3f0cf6c962a469db61a265f6418e1ffed86da29ec'
    ]

      at TestContext.<anonymous> (…/client/test/safrole.test.ts:28:14)
...
```

Red on the first vector, and only in the first entry: η₀ should have been stirred. The
other three are right by luck, because that block doesn't start an epoch, so they stay
put anyway.

## The code

**Replace in** `src/safrole.ts`

```ts
import { concatBytes } from "./bytes.ts";
import { entropyHistory } from "./epoch.ts";
import { blake2b256 } from "./hash.ts";

/**
 * η′: every block stirs its VRF output into the accumulator, η′₀ = H(η₀ ⌢ output), and at a
 * new epoch the history moves along one.
 */
export function nextEntropy(entropy: Bytes[], vrfOutput: Bytes, newEpoch: boolean): Bytes[] {
  const accumulator = blake2b256(concatBytes(entropy[0], vrfOutput));
  return [accumulator, ...entropyHistory(entropy, newEpoch)];
}
```

One hash for the accumulator, and [lesson 7.1](../07-time-and-shuffling/01-epochs.md)'s `entropyHistory` for the rest.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ η′: each block stirs its VRF output into η₀, and a new epoch moves the history (386.3ms)
...
ℹ tests 72
ℹ suites 0
ℹ pass 72
ℹ fail 0
...
reported 72 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791730458811
...
```

33 scenarios, and your η′ matches every one. That includes `skip-epochs-1`, where the
chain jumps from slot 10 to slot 46, straight over two whole epochs. Even then the
history moves along just one place: the Gray Paper only asks *whether* a new epoch began,
never how many.

## Watch it

**New file** `bin/entropy.ts`

```ts
// Shows how one block changes η, from a safrole test vector: the accumulator stirred with
// the block's VRF output, and the history moving along if a new epoch begins.
// Usage: npm run entropy <vector.json>, e.g.
//        npm run entropy ../vectors/stf/safrole/tiny/enact-epoch-change-with-no-tickets-4.json

import { readFileSync } from "node:fs";
import { fromHex, toHex } from "../src/bytes.ts";
import { FULL, TINY } from "../src/config.ts";
import { epochOf } from "../src/epoch.ts";
import { Run } from "../src/obs.ts";
import { nextEntropy } from "../src/safrole.ts";

const [file] = process.argv.slice(2);
const config = file.includes("/full/") ? FULL : TINY;
const { input, pre_state, post_state } = JSON.parse(readFileSync(file, "utf8"));
const newEpoch = epochOf(config, input.slot) > epochOf(config, pre_state.tau);
const before: string[] = pre_state.eta;
const after = nextEntropy(before.map(fromHex), fromHex(input.entropy), newEpoch).map(toHex);
const short = (hash: string) => `${hash.slice(0, 18)}…`;
const run = new Run("entropy");
console.log(`slot ${pre_state.tau} → ${input.slot}${newEpoch ? ": a new epoch" : ""}`);
console.log(`VRF output ${short(input.entropy)}`);
after.forEach((hash, index) => {
  console.log(`η${index}  ${short(before[index])}  →  ${short(hash)}`);
  run.event("eta", { index, before: before[index], after: hash });
});
const matches = after.every((hash, index) => hash === post_state.eta[index]);
console.log(`η′ matches the vector: ${matches}`);
run.event("result", { slot: input.slot, newEpoch, matches });
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

**What flows through it.** One run, three faces — the vector fields the program reads,
the values it computes from them, and the lines the terminal prints:

::: code-group

```json [what goes in]
{
  "input": { "slot": 15, "entropy": "0x92e69aed566b11bf…" },
  "pre_state": {
    "tau": 10,
    "eta": [
      "0xf164ce89b1048859…",
      "0xee155ace9c402920…",
      "0xbb30a42c1e62f0af…",
      "0xe88bd757ad5b9bed…"
    ]
  }
}
```

```ts [what it computes]
// bin/entropy.ts's values, once the slots are placed and η is stirred
const computed = {
  epochs: "slot 10 is epoch 0, slot 15 is epoch 1", // ⌊slot / 12⌋ on tiny
  newEpoch: true, // an epoch boundary: the history moves along one place
  eta0: "0x760612c571119ba1…", // H(η₀ ⌢ the VRF output), brand new
  eta1to3: "the old η₀, η₁, η₂, each down one row", // the staircase
  matches: true, // η′ equals the vector's post_state.eta, all four
};
```

```text [what comes out]
slot 10 → 15: a new epoch
VRF output 0x92e69aed566b11bf…
η0  0xf164ce89b1048859…  →  0x760612c571119ba1…
η′ matches the vector: true
```

:::

Read the input into the output: `input.slot` 15 against `pre_state.tau` 10 crosses an
epoch boundary — 12 slots an epoch on tiny — which is the `: a new epoch` on the first
line. `input.entropy` is the block's VRF output, the only fresh randomness; `pre_state.eta`
is the η the last block left. The program stirs η₀ with the output and, because the epoch
turned, steps every old value down one row.

**Run**

```sh
npm pkg set scripts.entropy="node bin/entropy.ts"
npm pkg set scripts.entropy-new-epoch="node bin/entropy.ts ../vectors/stf/safrole/tiny/enact-epoch-change-with-no-tickets-4.json"
npm run entropy-new-epoch
```

```text
slot 10 → 15: a new epoch
VRF output 0x92e69aed566b11bf…
η0  0xf164ce89b1048859…  →  0x760612c571119ba1…
η1  0xee155ace9c402920…  →  0xf164ce89b1048859…
η2  0xbb30a42c1e62f0af…  →  0xee155ace9c402920…
η3  0xe88bd757ad5b9bed…  →  0xbb30a42c1e62f0af…
η′ matches the vector: true
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=entropy-1791730462383
```

Look at the four η lines: a staircase. Each old value steps down one row, η₀'s to η₁,
η₁'s to η₂, and so on, while η₀ itself gets a brand-new hash and the oldest falls off the
bottom. Try a vector without a new epoch, such as
`../vectors/stf/safrole/tiny/publish-tickets-no-mark-2.json`: only η₀ changes. The
*Entropy* panel, on the **3 · Consensus** dashboard (where all of [Part 8](./index.md)'s panels are),
shows the same staircase.

<EntropyStairs />

![Entropy panel](./images/01-entropy.png)

<details>
<summary>lasair: <code>accumulate_entropy</code>, in <code>conformance/safrole_stf.ml</code></summary>

```ocaml
(** Accumulate entropy: η₀' = Blake2b(η₀ || input_entropy) *)
let accumulate_entropy eta0 input_entropy =
  blake2b_256 (Bytes.cat eta0 input_entropy)
```

The same one-liner as yours, fed the same `input.entropy` from the same vectors. lasair's
real block importer goes one step further: it starts from the 96-byte signature in the
header and computes Y itself, with a Bandersnatch library. Your client will too, in
[lesson 8.6](./06-the-vrf-output.md), with nothing more than a hash.

</details>

## Check your understanding

::: check
**η′₀ = H(η₀ ⌢ Y(H_V)). Why can't a block's author steer what goes into η?**

- [ ] The author doesn't know η₀ when it makes the block
  > No: η₀ is in the state, which every node knows. The author knows it as well as anyone.
- [x] Y(H_V) is a VRF output: for the author's key and its input, it comes out one way only
  > Yes: the author makes the signature but can't pick its output, and everyone can check
  > it was made honestly.
- [ ] The hash H scrambles whatever the author puts in
  > No: a hash gives the same result for the same input. An author free to choose the
  > input could try one after another until it liked the result. The VRF takes that choice
  > away.

**In a block that doesn't start an epoch, which parts of η change?**

- [x] Only η₀
  > Yes: every block stirs its VRF output into η₀. η₁ to η₃ move only at a new epoch.
- [ ] All four, each moving along one
  > No: that's a new epoch. In `publish-tickets-no-mark-2.json`, with no new epoch, only η₀
  > changes.
- [ ] None: entropy changes only at a new epoch
  > No: every block stirs η₀. That's what keeps it fresh.

**In `skip-epochs-1`, tiny jumps from slot 10 to slot 46, over two whole epochs. How far does the history move?**

- [ ] Three places, one for each epoch boundary crossed
  > No: the Gray Paper only asks *whether* a new epoch began. Slot 10 is in epoch 0 and
  > slot 46 in epoch 3, so one did, and the history moves once.
- [ ] Not at all: slot 46 isn't the first slot of an epoch
  > No: the rule compares epochs, not phases. Epoch 3 is greater than epoch 0.
- [x] One place, as at any new epoch
  > Yes: η′₁ is the old η₀, η′₂ the old η₁, η′₃ the old η₂, once. Your η′ matches the
  > vector's.

**A vector's `output` is an `err`. What does its block do to the state?**

- [ ] It stirs η₀ anyway, since every block does
  > No: a refused block isn't part of the chain, so nothing in it counts, its randomness
  > included.
- [x] Nothing: a refused block changes nothing
  > Yes: its `post_state` is its `pre_state`, exactly. That's why the test can skip it for
  > now.
- [ ] Everything except the part that broke a rule
  > No: a block is taken whole or not at all.
:::

## What you have

The randomness at the heart of Safrole: stirred every block, set aside every epoch. A new epoch moves more than entropy:
[lesson 8.2](./02-rotating-the-validators.md) moves the validator sets along with it.

Next: [8.2 Rotating the validators](./02-rotating-the-validators.md)
