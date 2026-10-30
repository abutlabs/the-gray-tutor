# Rotating the validators

JAM's validators work in shifts, an epoch at a time, with a queue: who's on now, who's
up next, who's after that, and who just finished. At each new epoch everyone steps one
along. A validator caught cheating ([lesson 4.4](../04-blocks/04-disputes.md)'s disputes) doesn't step up: its keys
are swapped for zeros.

## New words

- **Validator sets.** Four lists of validators: κ the active ones, λ last epoch's, γ_P the
  next epoch's (pending), and ι the ones queued after that (staging). *Example:* at a new
  epoch, γ_P becomes κ.
- **Offender.** A validator convicted in a dispute: its keys are kept out of the sets
  that come next. *Example:* ψ_O, the state's list of offenders' Ed25519 keys.

Both are in the [glossary](../glossary.md).

## What the Gray Paper says

§6 (*Key Rotation*). The state holds four sets of validator keys:

| Set | Name | Who they are |
| --- | --- | --- |
| ι | staging | next in line, chosen by a privileged service ([Part 17](../17-accumulation/index.md)) |
| γ_P | pending | active from the next epoch |
| κ | active | validating right now |
| λ | previous | last epoch's, still needed to check what they signed |

At a new epoch, everyone moves along one: κ′ = γ_P, λ′ = κ, and γ′_P = Φ(ι). ι itself
stays, since only that privileged service changes it. In any other block, nothing moves.

**Φ** is the bouncer at the door. It goes through ι, and every validator whose Ed25519
key is among the *offenders* (ψ′_O, the keys convicted in disputes) gets replaced by a
key of all zeros: 336 zero bytes. The slot is kept, so everyone else keeps their place
in the list, but the key is useless. Nobody can sign with a zero key.

<Rotation />

(The new pending set also gets a fresh Bandersnatch *ring root*, γ′_Z, which lets
validators prove they're in the set without saying who they are. That needs Bandersnatch's
arithmetic: [lesson 8.8](./08-the-ring-root.md).)

## The tests

The safrole tests are about to get a second user of the same bookkeeping, every
accepted vector and whether its block starts a new epoch, so the file gets a helper,
`acceptedVectors`, and both tests use it. That's a rewrite of the whole file:

**Rewrite** `test/safrole.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { fromHex, toHex } from "../src/bytes.ts";
import type { Config } from "../src/config.ts";
import { FULL, TINY } from "../src/config.ts";
import { epochOf } from "../src/epoch.ts";
import type { ValidatorSets } from "../src/safrole.ts";
import { nextEntropy, rotateValidators } from "../src/safrole.ts";
import { ValidatorKey } from "../src/state.ts";
import { vectorFiles, vectorJson } from "./vectors.ts";
import type { Bytes } from "../src/bytes.ts";

/** The parts of a safrole vector's state the lessons use so far. */
type SafroleState = {
  tau: number;
  eta: string[];
  iota: unknown[];
  gamma_k: unknown[];
  kappa: unknown[];
  lambda: unknown[];
  post_offenders: string[];
};

/** A safrole test vector: the parts of it the lessons use so far. */
type SafroleVector = {
  input: { slot: number; entropy: string };
  pre_state: SafroleState;
  post_state: SafroleState;
  output: { err?: string };
};

/** A safrole vector whose block is accepted, and whether that block starts a new epoch. */
type Accepted = { config: Config; name: string; vector: SafroleVector; newEpoch: boolean };

/** Every accepted safrole vector, at both sizes. A rejected block changes nothing. */
function acceptedVectors(): Accepted[] {
  const accepted: Accepted[] = [];
  for (const config of [TINY, FULL]) {
    for (const name of vectorFiles(`stf/safrole/${config.name}`)) {
      const vector = vectorJson(name) as SafroleVector;
      if (vector.output.err) continue;
      const newEpoch = epochOf(config, vector.input.slot) > epochOf(config, vector.pre_state.tau);
      accepted.push({ config, name, vector, newEpoch });
    }
  }
  return accepted;
}

test("η′: each block stirs its VRF output into η₀, and a new epoch moves the history", () => {
  const accepted: Accepted[] = acceptedVectors();
  for (const { name, vector, newEpoch } of accepted) {
    const { input, pre_state, post_state } = vector;
    const vrfOutput: Bytes = fromHex(input.entropy);
    const eta: Bytes[] = nextEntropy(pre_state.eta.map(fromHex), vrfOutput, newEpoch);
    const etaHex: string[] = eta.map(toHex);
    assert.deepEqual(etaHex, post_state.eta, name);
  }
  assert.equal(accepted.length, 33); // 15 tiny, 18 full
});

/** The four validator sets of a safrole vector's state, by your client's names for them. */
function validatorSets(state: SafroleState): ValidatorSets {
  const read = (keys: unknown[]) => keys.map((key) => ValidatorKey.fromJson(key));
  return {
    staging: read(state.iota),
    pending: read(state.gamma_k),
    active: read(state.kappa),
    previous: read(state.lambda),
  };
}

test("at a new epoch the validator sets move along one, with offenders zeroed", () => {
  let rotations = 0;
  for (const { name, vector, newEpoch } of acceptedVectors()) {
    const before: ValidatorSets = validatorSets(vector.pre_state);
    const offenders: Bytes[] = vector.pre_state.post_offenders.map(fromHex);
    const expected: ValidatorSets = newEpoch ? rotateValidators(before, offenders) : before;
    const after: ValidatorSets = validatorSets(vector.post_state);
    assert.deepEqual(after, expected, name);
    if (newEpoch) rotations++;
  }
  assert.equal(rotations, 14); // 6 tiny, 8 full
});
```

The vectors name the sets in Greek: `iota`, `gamma_k`, `kappa`, `lambda`. (`gamma_k` is
γ_P: older Gray Papers called it γ_k, and the vectors kept the name.) `validatorSets` gives them your client's names.
`post_offenders` is ψ′_O, the offenders *after* this block's disputes.

## The code

**Add to** `src/safrole.ts`

```ts
import { toHex } from "./bytes.ts";
import type { ValidatorKey } from "./state.ts";

/** The validator sets Safrole keeps (GP §6), each a list of validator keys. */
export type ValidatorSets = {
  staging: ValidatorKey[]; // ι: next in line, chosen by a privileged service
  pending: ValidatorKey[]; // γ_P: active from the next epoch
  active: ValidatorKey[]; // κ: validating now
  previous: ValidatorKey[]; // λ: last epoch's, still needed to check its signatures
};

/** A validator key of all zeros: what an offender's keys become. */
const NULL_KEY: ValidatorKey = {
  bandersnatch: new Uint8Array(32),
  ed25519: new Uint8Array(32),
  bls: new Uint8Array(144),
  metadata: new Uint8Array(128),
};

/** Φ: the keys, with each offender's (found by its Ed25519 key) replaced by zeros. */
export function withoutOffenders(keys: ValidatorKey[], offenders: Bytes[]): ValidatorKey[] {
  const banned = new Set(offenders.map(toHex));
  return keys.map((key) => (banned.has(toHex(key.ed25519)) ? NULL_KEY : key));
}

/** At a new epoch (GP §6), the sets move along one: ι, minus offenders, → γ_P → κ → λ. */
export function rotateValidators(sets: ValidatorSets, offenders: Bytes[]): ValidatorSets {
  return {
    staging: sets.staging, // stays: only a privileged service changes ι
    pending: withoutOffenders(sets.staging, offenders),
    active: sets.pending,
    previous: sets.active,
  };
}
```

`withoutOffenders` puts the offenders' keys in a `Set` of hex strings first, so checking
each validator is a quick lookup. (Two `Uint8Array` values with the same bytes aren't `===`, but
their hex strings are.)

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ at a new epoch the validator sets move along one, with offenders zeroed (596.3ms)
...
ℹ tests 73
ℹ suites 0
ℹ pass 73
ℹ fail 0
...
reported 73 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791730466785
...
```

14 rotations checked, and 19 blocks where nothing moved. One vector,
`enact-epoch-change-with-padding-1`, has an offender, at both sizes.

## Watch it

**New file** `bin/rotation.ts`

```ts
// Shows the four validator sets before and after a block, from a safrole test vector, each
// validator by the first four hex digits of its Ed25519 key.
// Usage: npm run rotation <vector.json>, e.g.
//        npm run rotation ../vectors/stf/safrole/tiny/enact-epoch-change-with-padding-1.json

import { readFileSync } from "node:fs";
import { fromHex, toHex } from "../src/bytes.ts";
import { FULL, TINY } from "../src/config.ts";
import { epochOf } from "../src/epoch.ts";
import { Run } from "../src/obs.ts";
import type { ValidatorSets } from "../src/safrole.ts";
import { rotateValidators } from "../src/safrole.ts";
import { ValidatorKey } from "../src/state.ts";

const [file] = process.argv.slice(2);
const config = file.includes("/full/") ? FULL : TINY;
const { input, pre_state } = JSON.parse(readFileSync(file, "utf8"));
const read = (keys: unknown[]) => keys.map((key) => ValidatorKey.fromJson(key));
const before: ValidatorSets = {
  staging: read(pre_state.iota),
  pending: read(pre_state.gamma_k),
  active: read(pre_state.kappa),
  previous: read(pre_state.lambda),
};
const offenders = pre_state.post_offenders.map(fromHex);
const newEpoch = epochOf(config, input.slot) > epochOf(config, pre_state.tau);
const after = newEpoch ? rotateValidators(before, offenders) : before;

/** A set of keys, each as the first four hex digits of its Ed25519 key. */
const short = (keys: ValidatorKey[]) => keys.map((k) => toHex(k.ed25519).slice(2, 6)).join(" ");

const run = new Run("rotation");
console.log(`slot ${pre_state.tau} → ${input.slot}${newEpoch ? ": a new epoch" : ""}`);
for (const set of ["staging", "pending", "active", "previous"] as const) {
  console.log(`${set.padEnd(8)}  ${short(before[set])}  →  ${short(after[set])}`);
  run.event("set", { set, before: short(before[set]), after: short(after[set]) });
}
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

**What flows through it.** The vector fields the program reads (each entry of the four
sets is really a whole 336-byte validator key; the program shows its Ed25519 part's
first four hex digits), what it computes, and what it prints:

::: code-group

```json [what goes in]
{
  "input": { "slot": 48 },
  "pre_state": {
    "tau": 45,
    "post_offenders": ["0xab0084d01534b31c…"],
    "iota":    ["cab2…", "ab00…", "4418…", "8b8c…", "ad93…", "f30a…"],
    "gamma_k": ["4418…", "ad93…", "cab2…", "f30a…", "8b8c…", "ab00…"],
    "kappa":   ["ab00…", "f30a…", "8b8c…", "4418…", "ad93…", "cab2…"],
    "lambda":  ["4418…", "cab2…", "8b8c…", "f30a…", "ab00…", "ad93…"]
  }
}
```

```ts [what it computes]
// bin/rotation.ts's values, once the sets are read and the epoch checked
const computed = {
  epochs: "slot 45 is epoch 3, slot 48 is epoch 4", // ⌊slot / 12⌋ on tiny
  newEpoch: true, // so the sets move along one: ι → γ_P → κ → λ
  pending: "Φ(ι): iota's keys, with the offender ab00 zeroed", // the one changed tile
  active: "the old pending, exactly", // no filtering on the way to κ
  previous: "the old active, exactly",
};
```

```text [what comes out]
slot 45 → 48: a new epoch
pending   4418 ad93 cab2 f30a 8b8c ab00  →  cab2 0000 4418 8b8c ad93 f30a
active    ab00 f30a 8b8c 4418 ad93 cab2  →  4418 ad93 cab2 f30a 8b8c ab00
```

:::

Read the input into the output: `slot` 48 against `tau` 45 turns the epoch, so each set's
*after* is the set above's *before* — `pending`'s new row is `iota`'s old one, `active`'s
is `pending`'s. The one exception comes from `post_offenders`: its key is `ab00…`, so
where `iota`'s row slides into `pending`, that tile arrives as `0000`.

**Run**

```sh
npm pkg set scripts.rotation="node bin/rotation.ts"
npm pkg set scripts.rotation-new-epoch="node bin/rotation.ts ../vectors/stf/safrole/tiny/enact-epoch-change-with-padding-1.json"
npm run rotation-new-epoch
```

```text
slot 45 → 48: a new epoch
staging   cab2 ab00 4418 8b8c ad93 f30a  →  cab2 ab00 4418 8b8c ad93 f30a
pending   4418 ad93 cab2 f30a 8b8c ab00  →  cab2 0000 4418 8b8c ad93 f30a
active    ab00 f30a 8b8c 4418 ad93 cab2  →  4418 ad93 cab2 f30a 8b8c ab00
previous  4418 cab2 8b8c f30a ab00 ad93  →  ab00 f30a 8b8c 4418 ad93 cab2
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=rotation-1791730470419
```

A slide puzzle. The six validators are an old cast (`4418` is κ0 from [lesson 6.3](../06-state-and-merklization/03-reading-the-state.md)),
each set in a different order. After the block, each row's *right* side is the row
above's *left*. Except one tile: `ab00` is an offender, and arrived in pending as
`0000`. The *Validator rotation* panel shows the same four rows.

![Validator rotation panel](./images/02-validator-rotation.png)

<details>
<summary>lasair: <code>filter_offenders</code>, in <code>lib/cores.ml</code></summary>

```ocaml
let filter_offenders (keys : validator_set) (offenders : hash seq)
    : validator_set =
  Array.map (fun k ->
    let is_offender = Array.exists (fun off ->
      Bytes.equal (Hash.to_bytes k.ed) (Hash.to_bytes off)
    ) offenders in
    if is_offender then null_validator_key else k
  ) keys
```

Φ, line for line: map over the keys, and if a key's Ed25519 part equals any offender,
swap in the null key. lasair compares bytes directly and checks every offender for every
key; with a handful of offenders, that's just as quick as your `Set`.

</details>

## Check your understanding

::: check
**At a new epoch, which set becomes κ′, the active validators?**

- [ ] ι, the staging set
  > No: ι is two steps away. It moves into pending, minus offenders, and is active only an
  > epoch later.
- [x] γ_P, the pending set
  > Yes: κ′ = γ_P. Pending means "active from the next epoch", and the next epoch has just
  > begun.
- [ ] κ itself: the active set stays until a dispute removes it
  > No: validators serve an epoch at a time. κ moves on to λ, the previous set.

**And what happens to ι at the new epoch?**

- [ ] It moves on to λ, closing the circle
  > No: the sets aren't a circle. λ′ is the old κ, and the old λ is dropped.
- [x] It stays as it is: only a privileged service changes it
  > Yes: a copy of it, minus offenders, becomes γ′_P, but ι itself is untouched. In the
  > vector, staging reads `cab2 ab00 4418 8b8c ad93 f30a` before and after.
- [ ] It's emptied, ready for new validators
  > No: nothing empties it. If the privileged service does nothing, the same validators
  > come round again.

**`ab00` is an offender in ι. Why does it arrive in pending as `0000`, in its old place, instead of being taken out?**

- [x] So everyone else keeps their place in the list, and nobody can sign with a zero key
  > Yes: Φ swaps its 336 bytes for zeros. The list stays six long, every other validator
  > keeps its position, and the key in `ab00`'s place is useless.
- [ ] It is taken out; `0000` is just how `bin/rotation.ts` shows a gap
  > No: the key is really there, 336 zero bytes, and pending still holds six.
- [ ] So that what it signed in earlier epochs stops checking out
  > No: Φ only touches the new pending set. `ab00` is still in κ′ and λ′, where it was.

**Why keep λ, last epoch's validators?**

- [ ] They stand by, ready to step in if active validators go offline
  > No: nothing in Safrole calls them back. They're kept for checking.
- [ ] The next ring root is made from them
  > No: the ring root is made for the new pending set, γ′_P.
- [x] Work they signed last epoch still needs checking, and that takes their keys
  > Yes: λ is "last epoch's, still needed to check what they signed".
:::

## What you have

Validator sets that change hands at every epoch, with cheaters left at the door. The new set has to seal the
epoch's blocks; when the lottery doesn't fill every slot, [lesson 8.3](./03-the-fallback-sealers.md)'s Plan B does.

Next: [8.3 The fallback sealers](./03-the-fallback-sealers.md)
