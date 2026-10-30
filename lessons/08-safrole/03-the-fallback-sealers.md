# The fallback sealers

Every slot of an epoch needs a *sealer*: the one validator allowed to make that slot's
block. Normally a lottery decides, with secret tickets ([lesson 8.4](./04-the-lotterys-winners.md)). But lotteries can
fizzle: too few tickets get entered, or no blocks arrive in the epoch's closing slots
when the lottery would close, or the chain skips whole epochs. JAM never
lets a slot go unclaimed, so there's a Plan B: pick the sealers straight from the
validators, by hash — one throw of the dice per slot, except the dice is a hash, so every
node throws the same numbers and fills in the same list. Everyone can work it out, so it
isn't secret, but nobody could have steered it. This lesson builds Plan B.

## New words

- **Sealer.** The one validator allowed to make a slot's block. *Example:* the fallback
  sealers, picked from the entropy when the lottery didn't fill the epoch.

It's in the [glossary](../glossary.md).

## What the Gray Paper says

§6 (*The Slot-Sealer Sequence*). γ_S holds the sealers of the current epoch, one per
slot, and changes only when a new epoch begins. Then it becomes either the lottery's
tickets (8.4) or, otherwise, the **fallback** sequence F(η′₂, κ′):

> slot i's sealer is the Bandersnatch key of validator ℰ₄⁻¹(H(η′₂ ⌢ ℰ₄(i))₀…₄) of κ′,
> counted round κ′

In words: for each slot number i, hash η′₂ with i, read the first four bytes as a number,
and take that validator of the *new* active set, wrapping round with `mod`. Two inputs,
both fixed before the epoch begins: η′₂, randomness from two epochs back ([lesson 8.1](./01-stirring-the-entropy.md)),
and κ′, the validators who'll be active ([lesson 8.2](./02-rotating-the-validators.md)).

How far the `mod` wraps is however many validators the network runs: six on tiny, so every
draw lands on 0 to 5; 1,023 on full. The same formula, counted round a bigger set. And at
the moment the epoch turns, both inputs are already in the state under other names: η′₂ is
the η₁ the old epoch left behind ([lesson 8.1](./01-stirring-the-entropy.md)'s shift), and
κ′ is the pending set γ_P that just became active. `bin/sealers.ts` below reads them
straight from those fields.

Here is F on the run's real epoch, one slot at a time:

<FallbackSealer />

[Lesson 8.5](./05-one-step-of-safrole.md) has a tiny epoch you can drive: let its lottery
close short, and watch this fallback seat the next epoch.

## The tests

The test needs γ_S from the vectors, so the state type grows a field:

**Replace in** `test/safrole.test.ts`

```ts
/** The parts of a safrole vector's state the lessons use so far. */
type SafroleState = {
  tau: number;
  eta: string[];
  iota: unknown[];
  gamma_k: unknown[];
  kappa: unknown[];
  lambda: unknown[];
  post_offenders: string[];
  gamma_s: { keys?: string[] }; // γ_S: the sealers, as fallback keys (or tickets: lesson 8.4)
};
```

**Add to** `test/safrole.test.ts`

```ts
import { fallbackKeys } from "../src/safrole.ts";
import type { Bytes } from "../src/bytes.ts";

test("F: an epoch without a full lottery is sealed by keys picked from κ′ by hash", () => {
  let fallbacks = 0;
  for (const { config, name, vector, newEpoch } of acceptedVectors()) {
    const { input, pre_state, post_state } = vector;
    if (!newEpoch || !post_state.gamma_s.keys) continue; // not a fallback epoch
    const vrfOutput: Bytes = fromHex(input.entropy);
    const eta: Bytes[] = nextEntropy(pre_state.eta.map(fromHex), vrfOutput, newEpoch);
    const offenders: Bytes[] = pre_state.post_offenders.map(fromHex);
    const before: ValidatorSets = validatorSets(pre_state);
    const { active }: ValidatorSets = rotateValidators(before, offenders); // κ′
    const sealers: Bytes[] = fallbackKeys(config, eta[2], active); // F(η′₂, κ′)
    const sealersHex: string[] = sealers.map(toHex);
    assert.deepEqual(sealersHex, post_state.gamma_s.keys, name);
    fallbacks++;
  }
  assert.equal(fallbacks, 12); // 5 tiny, 7 full
});
```

*Which* new epochs fall back is [the next lesson](./04-the-lotterys-winners.md)'s question. This test checks every vector
where the fallback happened: post_state's γ_S holds `keys` instead of `tickets`. It works
out η′ and κ′ with lessons [8.1](./01-stirring-the-entropy.md) and [8.2](./02-rotating-the-validators.md)'s own functions, so your whole Safrole so far is on
trial, not just F.

A stub that hands every slot the same key, all zeros:

**Add to** `src/safrole.ts`

```ts
import type { Config } from "./config.ts";

export function fallbackKeys(config: Config, r: Bytes, validators: ValidatorKey[]): Bytes[] {
  return Array(config.epoch_length).fill(new Uint8Array(32));
}
```

**Run, expect it to fail**

```sh
npm test
```

```text
...
✖ F: an epoch without a full lottery is sealed by keys picked from κ′ by hash (201.1ms)
...
ℹ tests 74
ℹ suites 0
ℹ pass 73
ℹ fail 1
...
test at test/safrole.test.ts:86:1
✖ F: an epoch without a full lottery is sealed by keys picked from κ′ by hash (201.1ms)
  AssertionError [ERR_ASSERTION]: stf/safrole/tiny/enact-epoch-change-with-no-tickets-4.json
  + actual - expected

    [
  +   '0x0000000000000000000000000000000000000000000000000000000000000000',
  +   '0x0000000000000000000000000000000000000000000000000000000000000000',
  +   '0x0000000000000000000000000000000000000000000000000000000000000000',
  +   '0x0000000000000000000000000000000000000000000000000000000000000000',
  +   '0x0000000000000000000000000000000000000000000000000000000000000000',
  +   '0x0000000000000000000000000000000000000000000000000000000000000000',
  +   '0x0000000000000000000000000000000000000000000000000000000000000000',
  +   '0x0000000000000000000000000000000000000000000000000000000000000000',
  +   '0x0000000000000000000000000000000000000000000000000000000000000000',
  +   '0x0000000000000000000000000000000000000000000000000000000000000000',
  +   '0x0000000000000000000000000000000000000000000000000000000000000000',
  +   '0x0000000000000000000000000000000000000000000000000000000000000000'
  -   '0x9326edb21e5541717fde24ec085000b28709847b8aab1ac51f84e94b37ca1b66',
  -   '0xdee6d555b82024f1ccf8a1e37e60fa60fd40b1958c4bb3006af78647950e1b91',
...
```

Red: twelve slots, twelve zero keys, where the vector has twelve real keys, from its six
validators.

## The code

**Replace in** `src/safrole.ts`

```ts
import { decodeFixed, encodeFixed } from "./codec/numbers.ts";

/**
 * F: the fallback sealers, one Bandersnatch key per slot of an epoch. Slot i goes to the
 * validator at ℰ₄⁻¹(the first four bytes of H(r ⌢ ℰ₄(i))), counted round the set.
 */
export function fallbackKeys(config: Config, r: Bytes, validators: ValidatorKey[]): Bytes[] {
  const keys: Bytes[] = [];
  for (let i = 0; i < config.epoch_length; i++) {
    const hash = blake2b256(concatBytes(r, encodeFixed(BigInt(i), 4)));
    const index = Number(decodeFixed(hash.subarray(0, 4))) % validators.length;
    keys.push(validators[index].bandersnatch);
  }
  return keys;
}
```

It's the same trick as [lesson 7.2](../07-time-and-shuffling/02-the-shuffle.md)'s numbers from a hash, with one hash per slot instead of
eight numbers per hash.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ F: an epoch without a full lottery is sealed by keys picked from κ′ by hash (279.6ms)
...
ℹ tests 74
ℹ suites 0
ℹ pass 74
ℹ fail 0
...
reported 74 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791730474850
...
```

12 fallback epochs, every sealer of every slot right: 5 on tiny, 7 on full, where each
epoch is 600 slots.

## Watch it

**New file** `bin/sealers.ts`

```ts
// Shows who seals each slot of the new epoch when a safrole test vector falls back to F:
// every slot's key, and which validator of κ′ it belongs to.
// Usage: npm run sealers <vector.json>, e.g.
//        npm run sealers ../vectors/stf/safrole/tiny/enact-epoch-change-with-no-tickets-4.json

import { readFileSync } from "node:fs";
import { fromHex, toHex } from "../src/bytes.ts";
import { FULL, TINY } from "../src/config.ts";
import { Run } from "../src/obs.ts";
import { fallbackKeys } from "../src/safrole.ts";
import { ValidatorKey } from "../src/state.ts";

const [file] = process.argv.slice(2);
const config = file.includes("/full/") ? FULL : TINY;
const { pre_state, post_state } = JSON.parse(readFileSync(file, "utf8"));
// at a new epoch, κ′ is the old pending set γ_P, and η′₂ is the old η₁
const active = pre_state.gamma_k.map((key: unknown) => ValidatorKey.fromJson(key));
const sealers = fallbackKeys(config, fromHex(pre_state.eta[1]), active);
const run = new Run("sealers");
const owners = active.map((v: ValidatorKey) => toHex(v.bandersnatch));
sealers.forEach((key, phase) => {
  const validator = owners.indexOf(toHex(key));
  console.log(`slot ${String(phase).padStart(3)} of the epoch: validator ${validator}`);
  run.event("sealer", { phase, validator, key });
});
const matches = sealers.every((key, phase) => toHex(key) === post_state.gamma_s.keys?.[phase]);
console.log(`the sealers match the vector: ${matches}`);
run.event("result", { matches });
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

**What flows through it.** The vector fields the program reads, the values it computes,
and the lines it prints:

::: code-group

```json [what goes in]
{
  "pre_state": {
    "eta": ["…", "0xee155ace9c402920…", "…", "…"],
    "gamma_k": [
      { "bandersnatch": "0xff71c6c03f…", "…": "five more keys follow" }
    ]
  },
  "post_state": {
    "gamma_s": { "keys": ["0x9326edb21e…", "0xdee6d555b8…", "… ten more …"] }
  }
}
```

```ts [what it computes]
// bin/sealers.ts's values: F run on the new epoch's randomness and keys
const computed = {
  seed: "the old η₁, about to become η′₂", // what F draws from at the epoch's turn
  active: "κ′ = the old pending set γ_P", // whose Bandersnatch keys F deals out
  sealers: 12, // one key per slot of the new epoch, repeats allowed
  slot0: "0x9326edb21e…", // γ_P[2]'s Bandersnatch key: validator 2
  matches: true, // every dealt key equals post_state.gamma_s.keys, in order
};
```

```text [what comes out]
slot   0 of the epoch: validator 2
slot   1 of the epoch: validator 1
the sealers match the vector: true
```

:::

Read the input into the output: the seed is `eta[1]` — the old η₁, which the epoch's turn
makes η′₂ — and the keys dealt are `gamma_k`'s Bandersnatch ones, since at a new epoch the
pending set becomes κ′. F picks one per slot: slot 0 gets `0x9326edb21e…`, which is
`gamma_k[2]`'s key, so the program prints `validator 2`. The vector's own answer sheet is
`post_state.gamma_s.keys`, and the last line says the twelve match.

**Run**

```sh
npm pkg set scripts.sealers="node bin/sealers.ts"
npm pkg set scripts.sealers-no-tickets="node bin/sealers.ts ../vectors/stf/safrole/tiny/enact-epoch-change-with-no-tickets-4.json"
npm run sealers-no-tickets
```

```text
slot   0 of the epoch: validator 2
slot   1 of the epoch: validator 1
slot   2 of the epoch: validator 5
slot   3 of the epoch: validator 0
slot   4 of the epoch: validator 0
slot   5 of the epoch: validator 3
slot   6 of the epoch: validator 1
slot   7 of the epoch: validator 5
slot   8 of the epoch: validator 1
slot   9 of the epoch: validator 1
slot  10 of the epoch: validator 4
slot  11 of the epoch: validator 1
the sealers match the vector: true
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=sealers-1791730478835
```

Count them up: validator 1 seals 5 of the 12 slots, validators 2, 3 and 4 just one each.
That's what picking by hash does: every slot is a fresh draw, so some validators get
lucky, and nobody is guaranteed a turn. The *Sealers* panel has the whole epoch.

![Sealers panel](./images/03-sealers.png)

<details>
<summary>lasair: F, in <code>conformance/stf_transitions.ml</code></summary>

```ocaml
          (* GP eq. fallbackkeysequence: F(eta_2', kappa') samples the
             POSTERIOR ACTIVE set kappa' (= the pre-state gamma_k), not
             the announced pending set in the epoch mark. Identical sets
             in the curated corpus hid the difference. *)
          (* F(eta_2', kappa') with kappa' = old gamma_k: index modulo |kappa'| *)
          let v_count = max 1 (Stf_config.vset_count old_gamma_k) in
          let gamma_s = Bytes.create (gamma_s_size_fallback ()) in
          for s = 0 to (epoch_length ()) - 1 do
            let input = Bytes.cat epoch_mark.tickets_entropy (encode_u32_le s) in
            let h = Lasair.Merklization.blake2b256 input in
            let idx = decode_u32_le h 0 mod v_count in
```

Read that first comment: a bug story. lasair once picked from the wrong set, the one the
epoch mark announces for *later*. In the test data it had at the time, every set held the
same validators, so the wrong set gave the right answer, until data with different sets
arrived. That's why [lesson 8.2](./02-rotating-the-validators.md)'s vectors, with their shuffled sets, matter. (And
`epoch_mark.tickets_entropy` is η′₂ under another name: [lesson 6.3](../06-state-and-merklization/03-reading-the-state.md) showed the epoch mark
carries the old η₁.)

</details>

## Check your understanding

::: check
**How is slot i's fallback sealer chosen?**

- [ ] In turn: validator i mod 6, on tiny
  > No: then every validator would get two of tiny's 12 slots. In the vector, validator 1
  > gets five.
- [x] Hash η′₂ with ℰ₄(i), read the first four bytes as a number, and take that validator of κ′, counted round
  > Yes: one hash per slot, a fresh draw each time, from values fixed before the epoch
  > began.
- [ ] By the ticket lottery, best tickets first
  > No: the fallback is for when the lottery didn't fill the epoch. It needs no tickets at
  > all.

**Why does F use η′₂, and not η₀?**

- [ ] η₀ isn't kept in the state
  > No: it is, in C(6), with the other three.
- [ ] η₂ has been stirred the most, so it's the most random
  > No: η′₂ stopped being stirred two epochs back. η₀ has been stirred more.
- [x] η′₂ was fixed before the epoch began, so nobody could have steered it
  > Yes: η₀ changes with every block, so it depends on who made the latest ones. η′₂, like
  > κ′, was settled before anyone could aim at a slot.

**In `enact-epoch-change-with-no-tickets-4`, validator 1 seals 5 of the 12 slots, and validators 2, 3 and 4 one each. Why so uneven?**

- [x] Each slot is a fresh draw, so some validators get lucky
  > Yes: that's what picking by hash does. Nobody is guaranteed a turn.
- [ ] Validator 1 has more at stake, so it gets more slots
  > No: F looks at nothing but the hash and the list. Every validator has the same chance
  > at every slot.
- [ ] It's a bug: each validator should get two of the twelve
  > No: the vector agrees with your client, slot for slot. Nothing in F evens things out.

**At a new epoch, F picks from κ′. Which set of the state before the block is that?**

- [ ] κ, the validators active until now
  > No: κ′ is the *new* active set. The old κ moves on to λ.
- [x] γ_P, the pending set, which has just become active
  > Yes: κ′ = γ_P ([lesson 8.2](./02-rotating-the-validators.md)). That's why `bin/sealers.ts` reads `pre_state.gamma_k`.
- [ ] γ′_P, the set the epoch mark announces
  > No: that set is for the epoch after. lasair once picked from it, and test data with
  > identical sets hid the bug.

**Is the fallback secret, as the lottery is?**

- [ ] Yes: nobody learns who seals a slot until its block arrives
  > No: that's the lottery, with its secret tickets. The fallback has no secrets.
- [x] No: every node can work it out, but nobody could have steered it
  > Yes: η′₂ and κ′ are in the state, so any node can run F. What it gives up is secrecy,
  > not fairness.
:::

## What you have

A Plan B for every epoch: sealers chosen by hash from the new validators, the same on
every node. Plan A is the lottery itself: [lesson 8.4](./04-the-lotterys-winners.md) seats its
winners.

Next: [8.4 The lottery's winners](./04-the-lotterys-winners.md)
