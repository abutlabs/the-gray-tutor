# Stirring the entropy

**In one sentence:** every block hashes a little randomness its author could not choose into
a pool the whole chain shares, so nobody can predict or steer the lotteries drawn from it.

Apply a block and watch the pool change. Then try the block that starts a new epoch, and
the one that jumps over two.

<a id="try-it"></a>

<EntropyStairs />

## The idea

[Part 8](./index.md) is [*Safrole*](../glossary.md#safrole), JAM's block-production engine.
It answers one question: who makes the next block? The answer is a lottery whose winners
stay secret until their slot comes. A lottery is only as fair as its randomness.

So where does a chain get randomness? Every node has to end up with the same value, so no
node can roll its own dice. And it can't be anything a block's author is free to choose:
the author would try values until one suited it.

The trick is a signature of a special kind, a [*VRF*](../glossary.md#vrf). Its output looks
random. The signer can't pick it. Anyone can check it. Every block carries one, and every
block's output is hashed into the pool: the [*entropy*](../glossary.md#entropy). It is a
pot that every cook must stir one spoonful into, from a jar they could not fill themselves.

Once an epoch, the pool's value is set aside. Later rules use those older values, fixed
before anyone could aim at them.

This lesson builds the stir: one hash per block.

## What the Gray Paper says

::: gray-paper 6.4 6-7

#### §6.4 Sealing and Entropy Accumulation, continued

<a id="gp-6-4-p6"></a>$\eta_0$ defines the state of the randomness accumulator to which the provably random output of the VRF, the signature over some <abbr class="gp-term" title="nobody, not even its maker, can steer the value">unbiasable</abbr> input, is combined each block. $\eta_1$, $\eta_2$ and $\eta_3$ meanwhile retain the state of this accumulator at the end of the three most recently ended epochs in order.

<a id="gp-6-4-p7"></a><a id="eq-6-23"></a>

$$
\begin{align}
\eta_0' &\equiv \mathcal{H}\left(\eta_0 \frown \mathcal{Y}\left(\mathbf{H}_{V}\right)\right) \tag{6.23}
\end{align}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-entropyaccumulator" class="gk-wrap">$\eta_0$</span> | eta zero | the entropy accumulator: 32 bytes that every block's VRF output is hashed into |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-blake">$\mathcal{H}\left(x\right)$</span> | H of | the Blake2b hash of what's in the brackets: 32 bytes |
| <span id="gk-concat" class="gk-wrap">[$\frown$](../symbols.md#concat)</span> | concatenate | join: the left sequence followed by the right |
| <span id="gk-banderout">$\mathcal{Y}\left(x\right)$</span> | Y of | the 32-byte random output a Bandersnatch signature or proof carries, used as entropy |
| <span id="gk-H" class="gk-wrap">$\mathbf{H}$</span> | H | this block's header; 𝐇_T is its timeslot, 𝐇_P its parent's hash |
| <span id="gk--vrfsig">$V$</span> | V | a header's VRF signature: 𝐇_V, 96 bytes of the author's fresh randomness; the vectors' entropy source |

</details>

→ [(6.23) explained](./gray-paper.md#ex-6-23)

:::

§6.4 (*Sealing and Entropy Accumulation*) is the stir. η₀ is the pool, the accumulator.
The new η₀ is the hash of the old one followed by Y(H_V).

- **H_V** is the header's `entropy_source` ([lesson 4.6](../04-blocks/06-the-header.md)): a
  96-byte Bandersnatch VRF signature by the block's author.
- **Y(H_V)** is its *output*: 32 bytes of randomness. For a given key and input (here, a
  fixed label and the block's seal), it comes out one way only. The author can't choose
  it, and everyone can check it was made honestly.

So nobody, not even the author, can steer what goes into η.

η₁, η₂ and η₃ are the values set aside: [lesson 7.1](../07-time-and-shuffling/01-epochs.md)'s
history, moved along one at a new epoch, unchanged otherwise. [The stairs at the top](#try-it)
show both moves.

Computing Y is [lesson 8.6](./06-the-vrf-output.md)'s job. Until then, the `safrole` test
vectors hand it to you, as `input.entropy`.

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

Some vectors hold a block that must be *rejected*: a bad slot, a bad ticket. Their `output`
carries an `err`, an [*optional field*](../glossary.md#optional-field) the other vectors
leave out, and their state doesn't change at all. The checks that reject them come in
[lesson 8.5](./05-one-step-of-safrole.md), so for now the test skips them and counts the
rest: 15 on tiny, 18 on full.

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
other three are right by luck. That block doesn't start an epoch, so they stay put anyway.

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

What flows through it:

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

`input.slot` 15 against `pre_state.tau` 10 crosses an epoch boundary (12 slots an epoch
on tiny): that is the `: a new epoch` on the first line. `input.entropy` is the block's
VRF output, the only fresh randomness. The program stirs it into η₀ and, because the
epoch turned, steps every old value down one row.

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

A staircase. Each old value steps down one row, and the oldest falls off the bottom. η₀
gets a brand-new hash. Try a vector without a new epoch, such as
`../vectors/stf/safrole/tiny/publish-tickets-no-mark-2.json`: only η₀ changes. The
*Entropy* panel, on the **3 · Consensus** dashboard (where all of [Part 8](./index.md)'s
panels are), shows the same staircase.

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
**What is the entropy, η, for?**

- [ ] It is a fingerprint of the state, so two nodes can tell whether they agree
  > No: that is the state root of [lesson 6.1](../06-state-and-merklization/01-the-state-trie.md).
  > η is four hashes inside the state, and its job is to be unpredictable.
- [x] It is the randomness Safrole's lotteries draw on, gathered from every block so nobody can predict them
  > Yes: a lottery is only as fair as its randomness, so the chain keeps its own and
  > stirs it every block.
- [ ] It is each validator's private random number
  > No: η is in the state, the same on every node. What is private is each author's key.

**Why can't a block's author steer what goes into η?**

- [ ] The author doesn't know η₀ when it makes the block
  > No: η₀ is in the state, which every node knows. The author knows it as well as anyone.
- [ ] The hash scrambles whatever the author puts in
  > No: a hash gives the same result for the same input. An author free to choose the
  > input could try one after another until it liked the result. The VRF takes that choice
  > away.
- [x] What goes in is a VRF output: for the author's key and its input, it comes out one way only
  > Yes: the author makes the signature but can't pick its output, and everyone can check
  > it was made honestly.

**Who stirs η, and how often?**

- [x] Every node, for every block it accepts: one hash of the old η₀ and the block's VRF output
  > Yes: η is part of the state, and every node works the new state out from the block. In
  > a block that doesn't start an epoch, η₀ is the only one of the four that changes.
- [ ] Only the block's author; the other nodes copy its result
  > No: nobody takes the author's word. Each node hashes for itself and must reach the
  > same η₀.
- [ ] Every node, but only once an epoch
  > No: once an epoch the history moves along. The stir is every block. That is what
  > keeps η₀ fresh.

**The chain goes quiet and the next block arrives two whole epochs later. How far does the history move?**

- [ ] Three places, one for each epoch boundary crossed
  > No: the Gray Paper only asks *whether* a new epoch began. In `skip-epochs-1`, slot 10
  > is in epoch 0 and slot 46 in epoch 3, so one did, and the history moves once.
- [ ] Not at all: the block isn't in the first slot of an epoch
  > No: the rule compares epochs, not phases. Epoch 3 is greater than epoch 0.
- [x] One place, as at any new epoch
  > Yes: η′₁ is the old η₀, η′₂ the old η₁, η′₃ the old η₂, once. Your η′ matches the
  > vector's.

**A block breaks a rule and is refused. What does it do to η?**

- [ ] It stirs η₀ anyway, since every block does
  > No: a refused block isn't part of the chain, so nothing in it counts, its randomness
  > included.
- [x] Nothing: a refused block changes nothing
  > Yes: in the vectors, such a block's `post_state` is its `pre_state`, exactly. That's
  > why the test can skip it for now.
- [ ] Everything except the part that broke a rule
  > No: a block is taken whole or not at all.
:::

## What you have

The randomness at the heart of Safrole: stirred every block, set aside every epoch. A new
epoch moves more than entropy: [lesson 8.2](./02-rotating-the-validators.md) moves the
validator sets along with it.

Next: [8.2 Rotating the validators](./02-rotating-the-validators.md)
