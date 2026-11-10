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

::: gray-paper 6.3

#### §6.3 Key Rotation {#gp-6-3}

<a id="gp-6-3-p1"></a>In addition to the active sequence of validator keys $\kappa$ and staging sequence $\iota$, internal to the Safrole state we retain a pending sequence $\gamma_P$. The active validator keys identifies the nodes which are currently privileged to author blocks and carry out the validation processes, whereas the pending keys $\gamma_P$, which is reset to $\iota$ at the beginning of each epoch, is the sequence of keys which will be active in the next epoch and which determine the Bandersnatch ring root which authorizes tickets into the slot-sealer contest for the next epoch. The length of each sequence is always a multiple of 3 between 6 and $3\mathsf{C}$.

<a id="gp-6-3-p2"></a><a id="eq-6-7"></a><a id="eq-6-8"></a>

$$
\begin{gather}
\iota \in \left[\!\left[\mathbb{K}\right]\!\right]_{\mathbb{V}} \;,\quad
\gamma_P \in \left[\!\left[\mathbb{K}\right]\!\right]_{\mathbb{V}} \;,\quad
\kappa \in \left[\!\left[\mathbb{K}\right]\!\right]_{\mathbb{V}} \;,\quad
\lambda \in \left[\!\left[\mathbb{K}\right]\!\right]_{\mathbb{V}} \tag{6.7} \\
\mathbb{V} \equiv \left\{\,3c \;\middle\vert\; c \in \mathbb{N}_{2 \dots \mathsf{C}+1}\,\right\} \tag{6.8}
\end{gather}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-stagingset" class="gk-wrap">$\iota$</span> | iota | the next validators: keys queued to become active at the next epoch |
| <span id="gk-in">[$\in$](../symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-allvalkeys">$\left[\!\left[\mathbb{K}\right]\!\right]_{\mathbb{V}}$</span> | a sequence of K, of a size in V | a validator set: a 336-byte key set for each validator; 6 on tiny, 1,023 on full |
| <span id="gk-pendingset" class="gk-wrap">$\gamma_P$</span> | gamma P | the pending validators: the key sets that become active at the next epoch |
| <span id="gk-activeset" class="gk-wrap">$\kappa$</span> | kappa | the current validators: the keys of the V validators active this epoch |
| <span id="gk-previousset" class="gk-wrap">$\lambda$</span> | lambda | the last epoch's validators: kept to check what they signed before the change |
| <span id="gk-valcount" class="gk-wrap">$\mathbb{V}$</span> | V (the set) | the validator counts allowed: multiples of 3 from 6 to 3C, which is 1,023 on full and 6 on tiny |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-set">$\left\{\,x\,\right\}$</span> | the set of | a set: values with no order and no repeats |
| <span id="gk-build">$\left\{ x \;\middle\vert\; y \right\}$</span> | for each, such that | built by a rule: the left-hand value, for every case the right-hand side allows (a set, or a sequence in order) |
| <span id="gk-Nclamp">$\mathbb{N}_{x \dots y}$</span> | N from x to y | the whole numbers from x up to, not including, y |
| <span id="gk-Ccorecount" class="gk-wrap">$\mathsf{C}$</span> | C | the number of cores: 341 on full, 2 on tiny |

</details>

→ [(6.7), (6.8) in plain words](./gray-paper.md#ex-6-7)

<a id="gp-6-3-p3"></a>We must introduce $\mathbb{K}$, the set of validator key tuples. This is a combination of a set of cryptographic public keys and metadata which is an opaque <abbr class="gp-term" title="a byte: 8 bits">octet</abbr> sequence, but utilized to specify practical identifiers for the validator, not least a hardware address.

<a id="gp-6-3-p4"></a>The set of validator keys itself is equivalent to the set of 336-octet sequences. However, for clarity, we divide the sequence into four easily denoted components. For any validator key $k$, the Bandersnatch key is denoted $k_{b}$, and is equivalent to the first 32-octets; the Ed25519 key, $k_{e}$, is the second 32 <abbr class="gp-term" title="bytes: 8 bits each">octets</abbr>; the BLS key denoted $k_{l}$ is equivalent to the following 144 octets, and finally the metadata $k_{m}$ is the last 128 octets. Formally:

<a id="gp-6-3-p5"></a><a id="eq-6-9"></a><a id="eq-6-10"></a><a id="eq-6-11"></a><a id="eq-6-12"></a><a id="eq-6-13"></a>

$$
\begin{align}
\mathbb{K} &\equiv \mathbb{B}_{336} \tag{6.9} \\
\forall k \in \mathbb{K} : k_{b} \in \overset{\backsim}{\mathbb{H}_{}} &\equiv k_{0 \dots+ 32} \tag{6.10} \\
\forall k \in \mathbb{K} : k_{e} \in \bar{\mathbb{H}_{}} &\equiv k_{32 \dots+ 32} \tag{6.11} \\
\forall k \in \mathbb{K} : k_{l} \in \overset{\mathrm{B\!L\!S}}{\mathbb{B}_{}} &\equiv k_{64 \dots+ 144} \tag{6.12} \\
\forall k \in \mathbb{K} : k_{m} \in \mathbb{B}_{128} &\equiv k_{208 \dots+ 128} \tag{6.13}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-valkey" class="gk-wrap">$\mathbb{K}$</span> | K | a validator's key set: 336 bytes holding its Bandersnatch, Ed25519 and BLS keys and its metadata |
| <span id="gk-blob">[$\mathbb{B}$](../symbols.md#blobs)</span> | B, or B sub n | bytes: any run of them; 𝔹ₙ exactly n of them |
| <span id="gk-forall">$\forall$</span> | for all | for every value: ∀c ∈ ℕ_C means for each core c |
| <span id="gk-vkX">$k$</span> | k | one validator's key set: 336 bytes |
| <span id="gk-vk-bs">$b$</span> | b | a validator's Bandersnatch key: the first 32 of its 336 bytes |
| <span id="gk-bskey" class="gk-wrap">$\overset{\backsim}{\mathbb{H}}$</span> | H tilde | a Bandersnatch public key: 32 bytes |
| <span id="gk-subrange">$_{x \dots+ y}$</span> | from x, y of them | y items, starting at index x |
| <span id="gk-vk-ed">$e$</span> | e | a validator's Ed25519 key: the 32 bytes after its Bandersnatch key |
| <span id="gk-edkey" class="gk-wrap">$\bar{\mathbb{H}}$</span> | H bar | an Ed25519 public key: 32 bytes |
| <span id="gk-vk-bls">$l$</span> | l | a validator's BLS key: the 144 bytes from byte 64 |
| <span id="gk-blskey">$\overset{\mathrm{B\!L\!S}}{\mathbb{B}}$</span> | B BLS | a BLS public key: 144 bytes |
| <span id="gk-vk-metadata">$m$</span> | m | a validator's metadata: its last 128 bytes, an address and other details the chain never reads |
| <span id="gk-metadatakey" class="gk-wrap">$\mathbb{B}_{128}$</span> | B sub 128 | 128 bytes: room for a validator's metadata |

</details>

→ [(6.9), (6.10), (6.11), (6.12), (6.13) in plain words](./gray-paper.md#ex-6-9)

<a id="gp-6-3-p6"></a>With a new epoch under regular conditions, validator keys get rotated and the epoch's Bandersnatch ring root is updated into $\gamma_Z'$:

<a id="gp-6-3-p7"></a><a id="eq-6-14"></a><a id="eq-6-15"></a>

$$
\begin{align}
\left(\gamma_P', \kappa', \lambda', \gamma_Z'\right) &\equiv \begin{cases}
(\Phi(\iota), \gamma_P, \kappa, z) &\text{if } e' > e \\ \left(\gamma_P, \kappa, \lambda, \gamma_Z\right) &\text{otherwise}
\end{cases} \tag{6.14} \\
\text{where } z &= \mathcal{O}\left(\left[k_{b} \;\middle\vert\; k \mathrel{\unicode{x2B40}} \gamma_P'\right]\right) \notag \\
\Phi(\mathbf{k}) &\equiv \left[
\begin{rcases}
\left[0, 0, \dots\right] &\text{if } k_{e} \in \psi_O' \\
k &\text{otherwise}
\end{rcases}
\;\middle\vert\;
k \mathrel{\unicode{x2B40}} \mathbf{k}
\right] \tag{6.15}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-epochroot" class="gk-wrap">$\gamma_Z$</span> | gamma Z | the ring root of the pending validators' Bandersnatch keys: 144 bytes a ticket's proof is checked against |
| <span id="gk-Phi">$\Phi$</span> | Phi | the key nullifier: each key set as it is, or 336 zero bytes if its Ed25519 key is an offender's |
| <span id="gk-getringroot">$\mathcal{O}\left(x\right)$</span> | O of | the ring root of a list of Bandersnatch keys |
| <span id="gk-sq">[$\left[x\right]$](../symbols.md#sequence)</span> | the sequence | a sequence written out item by item; [ ] is the empty one |
| <span id="gk-orderedin">$\mathrel{\unicode{x2B40}}$</span> | in order, from | each item of the sequence, in its order |
| <span id="gk-offenders" class="gk-wrap">$\psi_O$</span> | psi O | the offenders: Ed25519 keys of validators found to have judged a report wrongly |

</details>

→ [(6.14), (6.15) in plain words](./gray-paper.md#ex-6-14)

<a id="gp-6-3-p8"></a>Note that on epoch changes the <abbr class="gp-term" title="after the change: the value once it is made, written with a prime (α′); for state, after the block">posterior</abbr> queued validator key sequence $\gamma_P'$ is defined such that incoming keys belonging to the offenders $\psi_O'$ are replaced with a <abbr class="gp-term" title="a validator key set of 336 zero bytes, which nobody can sign with">null key</abbr> containing only zeroes. The origin of the offenders is explained in section [10](../10-disputes/index.md#gp-10-p1).

:::

In plain words, §6.3 (*Key Rotation*). The state holds four sets of validator keys:

| Set | Name | Who they are |
| --- | --- | --- |
| ι | staging | next in line, chosen by a privileged service ([Part 17](../17-accumulation/index.md)) |
| γ_P | pending | active from the next epoch |
| κ | active | validating right now |
| λ | previous | last epoch's, still needed to check what they signed |

Each set is a list of validator key sets, a multiple of 3 long, from 6 to 3C: always 6 on
tiny, and 1,023 on full, the most it allows. Each key set is 336 bytes: the Bandersnatch key (bytes 0 to 31), the Ed25519 key
(32 to 63), the BLS key (64 to 207) and the metadata (208 to 335).

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
<summary>lasair: <code>phi_filter</code>, in <code>conformance/stf_encoding.ml</code></summary>

```ocaml
let phi_filter (offenders : bytes list) (set : bytes) : bytes =
  (* GP eq. blacklistfilter over a LENGTH-PREFIXED set (GP 0.8.0): null the
     whole 336-byte record of any validator whose ed25519 key is an offender;
     the count prefix is preserved. *)
  let n = Stf_config.vset_count set in
  let g = Bytes.copy set in
  for v = 0 to n - 1 do
    match Stf_config.vset_ed25519 set v with
    | Some ed when List.exists (Bytes.equal ed) offenders ->
      Bytes.fill g (Stf_config.vset_record_offset set v) 336 '\x00'
    | _ -> ()
  done;
  g
```

Φ, line for line, on the state's own bytes: for each of the set's validators, if its
Ed25519 key is an offender's, its whole 336-byte record becomes zeros, the null key.
lasair checks every offender for every key; with a handful of offenders, that's just as
quick as your `Set`.

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
