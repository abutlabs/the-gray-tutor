# Who guarantees what

**In one sentence:** every core gets three validators to vouch for its work, dealt out by
a shuffle nobody can steer, and moved on to the next core every few slots.

Six validators, two cores, and a real block at slot 14. Slide the slot through the epoch,
and watch everyone move on one core every 4 slots.

<a id="try-it"></a>

<GuarantorSeats />

## The idea

Work arrives at JAM as work-packages. Every package needs
[*guarantors*](../glossary.md#guarantor): validators who run it, sign the resulting
report, and put their stake behind it. Which validators get which core?

If you could pick, you'd pick your friends. So nobody picks. JAM deals the cores out like
cards: three validators per core, shuffled with randomness nobody could steer
([lesson 7.2](../07-time-and-shuffling/02-the-shuffle.md)).

Then it keeps them moving. Every few slots a new [*rotation*](../glossary.md#rotation)
begins, and everyone moves on to the next core. Nobody stays on one core for long.

The dealing is on the chain. Every validator works out the same hand from the same
entropy. That is how the chain can later tell whether the right three signed a report
([the part's page](./index.md) draws the whole exchange).

This lesson deals the hand: this rotation's, and the one before it.

## What the Gray Paper says

::: gray-paper 11.3

#### §11.3 Guarantor Assignments {#gp-11-3}

<a id="gp-11-3-p1"></a>As discussed in section [4.9](../what-runs-where.md#gp-4-9-p1), the amount of <abbr class="gp-term" title="done by a core's guarantors, off the chain; the chain only sees the result">in-core</abbr> computation that is possible scales with the number of validator nodes. Concretely, while there are a fixed number of cores $\mathsf{C} = 341$, only the first ${}^{\left\vert\kappa'\right\vert}\!/_{3}$ are *active* and capable of processing work-packages.

<a id="gp-11-3-p2"></a>Every block, each active core has three validators uniquely assigned to guarantee work-reports for it. The core index assigned to each of the validators, as well as the validators' keys are denoted by $\mathbf{M}$:

<a id="gp-11-3-p3"></a><a id="eq-11-19"></a>

$$
\begin{equation}
\mathbf{M} \in \!\left\lgroup\left[\!\left[\mathbb{N}_{\mathsf{C}}\right]\!\right]_{\left\vert\kappa'\right\vert}, \left[\!\left[\mathbb{K}\right]\!\right]_{\left\vert\kappa'\right\vert}\right\rgroup\! \tag{11.19}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-guarantorassignments" class="gk-wrap">$\mathbf{M}$</span> | M | the guarantor assignments: each validator's core this rotation, and the validators' keys |
| <span id="gk-in">[$\in$](../symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-tuple">$\!\left\lgroup x\right\rgroup\!$</span> | the tuple of | a record: named fields, each with its type, like an object in JSON |
| <span id="gk-sequence">[$\left[\!\left[x\right]\!\right]$](../symbols.md#sequence)</span> | a sequence of | ⟦T⟧ is an array of T; a subscript is its length, :n at most n, n: at least n |
| <span id="gk-len">$\left\vert x\right\vert$</span> | the size of | \|x\|: how many items x has, or how many bytes |
| <span id="gk-activeset" class="gk-wrap">$\kappa$</span> | kappa | the current validators: the keys of the V validators active this epoch |
| <span id="gk-coreindex" class="gk-wrap">$\mathbb{N}_{\mathsf{C}}$</span> | N sub C | the core indices: 0 to C − 1 |
| <span id="gk-valkey" class="gk-wrap">$\mathbb{K}$</span> | K | a validator's key set: 336 bytes holding its Bandersnatch, Ed25519 and BLS keys and its metadata |

</details>

→ [(11.19) in plain words](./gray-paper.md#ex-11-19)

<a id="gp-11-3-p4"></a>We determine the core to which any given validator is assigned through a shuffle using epochal entropy and a periodic rotation to help guard the security and liveness of the network. We use $\eta_2$ for the epochal entropy rather than $\eta_1$ to avoid the possibility of <abbr class="gp-term" title="forks multiplying because validators disagree about the end of an epoch">fork-magnification</abbr> where uncertainty about chain state at the end of an epoch could give rise to two established <abbr class="gp-term" title="two blocks built on the same parent, splitting the chain until one side is dropped">forks</abbr> before it naturally resolves.

<a id="gp-11-3-p5"></a>We define the rotation function $R$, the permute function $P$ and finally the guarantor assignments $\mathbf{M}$ as follows:

<a id="gp-11-3-p6"></a><a id="eq-11-20"></a><a id="eq-11-21"></a><a id="eq-11-22"></a>

$$
\begin{align}
R(\mathbf{c}, n) &\equiv \left[(x + n) \bmod \frac{\left\vert\mathbf{c}\right\vert}{3} \;\middle\vert\; x \mathrel{\unicode{x2B40}} \mathbf{c}\right] \tag{11.20} \\
P(v, e, t) &\equiv R\left(
\mathcal{F}\left(\left[\left\lfloor\frac{i}{3}\right\rfloor \;\middle\vert\; i \mathrel{\unicode{x2B40}} \mathbb{N}_{v}\right], e\right),
\left\lfloor\frac{t \bmod \mathsf{E}}{\mathsf{R}}\right\rfloor
\right) \tag{11.21} \\
\mathbf{M} &\equiv \left(P(\left\vert\kappa'\right\vert, \eta'_2, \tau'), \Phi(\kappa')\right) \tag{11.22}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-sq">[$\left[x\right]$](../symbols.md#sequence)</span> | the sequence | a sequence written out item by item; [ ] is the empty one |
| <span id="gk-build">$\left\{ x \;\middle\vert\; y \right\}$</span> | for each, such that | built by a rule: the left-hand value, for every case the right-hand side allows (a set, or a sequence in order) |
| <span id="gk-bmod">[$\bmod$](../symbols.md#mod)</span> | mod | the remainder after dividing: 14 mod 4 is 2 |
| <span id="gk-frac">$\frac{x}{y}$</span> | over | a fraction: the top divided by the bottom |
| <span id="gk-orderedin">$\mathrel{\unicode{x2B40}}$</span> | in order, from | each item of the sequence, in its order |
| <span id="gk-fyshuffle">$\mathcal{F}\left(x\right)$</span> | F of | the Fisher-Yates shuffle: the sequence reordered by an entropy, the same way on every validator |
| <span id="gk-ffrac">$\left\lfloor\frac{x}{y}\right\rfloor$</span> | x over y, rounded down | whole-number division, the remainder dropped: ⌊7/3⌋ is 2 |
| <span id="gk-Nmax">[$\mathbb{N}_{x}$](../symbols.md#naturals)</span> | N sub n | the whole numbers below n: ℕ_C is a core index, 0 to C − 1 |
| <span id="gk-Cepochlen" class="gk-wrap">$\mathsf{E}$</span> | E | an epoch's length in slots: 600 on full, 12 on tiny |
| <span id="gk-Crotationperiod" class="gk-wrap">$\mathsf{R}$</span> | R | how often the guarantors move on to another core: every 10 slots on full, 4 on tiny |
| <span id="gk-entropy" class="gk-wrap">$\eta$</span> | eta | entropy: four 32-byte values of randomness, the newest mixing in every block |
| <span id="gk-thetime" class="gk-wrap">$\tau$</span> | tau | the time: the latest block's timeslot |
| <span id="gk-Phi">$\Phi$</span> | Phi | the key nullifier: each key set as it is, or 336 zero bytes if its Ed25519 key is an offender's |

</details>

→ [(11.20), (11.21), (11.22) in plain words](./gray-paper.md#ex-11-20)

<a id="gp-11-3-p7"></a>We also define $\mathbf{M}^*$, which is equivalent to the value $\mathbf{M}$ as it would have been under the previous rotation:

<a id="gp-11-3-p8"></a><a id="eq-11-23"></a>

$$
\begin{equation}
\begin{aligned}
\text{let } \left(\mathbf{k}, e\right) &= \begin{cases}
\left(\kappa', \eta'_2\right) &\text{if } \displaystyle\left\lfloor\frac{\tau' - \mathsf{R}}{\mathsf{E}}\right\rfloor = \left\lfloor\frac{\tau'}{\mathsf{E}}\right\rfloor\\
\left(\lambda', \eta'_3\right) &\text{otherwise}
\end{cases} \\
\mathbf{M}^* &\equiv \left(
P(\left\vert\mathbf{k}\right\vert, e, \tau' - \mathsf{R}),
\Phi(\mathbf{k})
\right)
\end{aligned} \tag{11.23}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-previousset" class="gk-wrap">$\lambda$</span> | lambda | the last epoch's validators: kept to check what they signed before the change |
| <span id="gk-guarantorassignmentsunderlastrotation" class="gk-wrap">$\mathbf{M}^*$</span> | M star | the guarantor assignments of the rotation before this one |

</details>

→ [(11.23) in plain words](./gray-paper.md#ex-11-23)

:::

§11.3 (*Guarantor Assignments*): with v validators, only the first v/3 cores are
[*active cores*](../glossary.md#active-core), three guarantors each: 6 validators keep 2
cores active. P(v, e, t) is the core of each validator at slot t, in three steps:

1. **Seats.** Validator i gets core ⌊i/3⌋, so `0 0 0 1 1 1 2 2 2 …`.
2. **Shuffle** them ([lesson 7.2](../07-time-and-shuffling/02-the-shuffle.md)) with entropy e.
3. **Rotate.** Every R slots (4 on tiny, 10 on full) everyone moves on one core, wrapping
   round the active cores. At slot t, that's ⌊(t mod E)/R⌋ moves since the epoch began.

**M** is this rotation's assignment: P(|κ′|, η′₂, τ′), with the keys of κ′, offenders
zeroed by [lesson 8.2](../08-safrole/02-rotating-the-validators.md)'s Φ. Why η′₂, not
η′₁? It is randomness from two epochs back, which no fork at the end of the last epoch
can disagree about.

**M\*** is the *last* rotation's: P at τ′ − R. If τ′ − R falls in the same epoch, it
uses κ′ and η′₂ again. If it falls in the previous epoch, it uses λ′ and η′₃, that
epoch's own validators and randomness.

**Which applies?** A guarantee carries the slot it was made at. If that slot is in the
same rotation as the block (⌊τ′/R⌋ = ⌊t/R⌋), its signers must be assigned by M.
Otherwise, by M\*. So a guarantee made just before a rotation still counts in the next:
the work takes time to refine and get into a block, and a rotation in between shouldn't
throw it away.

Try it on [the seats at the top](#try-it). They are tiny's, with the validators and
entropy of the reports vector `report_prev_rotation-1`, whose block is at slot 14. Watch
the shuffle pick each seat, compare M with M\*, and tap a guarantor to make it an
offender.

## The size grows, once more

R is 10 slots on full and 4 on tiny:

**Replace in** `src/config.ts`

```ts
/** The protocol constants that depend on the size of the network. */
export type Config = {
  name: string;
  validators_count: number; // V: validators in a set
  core_count: number; // C: cores doing work in parallel
  epoch_length: number; // E: timeslots in an epoch
  epoch_tail_start: number; // Y: the slot of an epoch at which the ticket lottery closes
  rotation_period: number; // R: slots between reshuffles of the guarantors
  max_tickets_per_extrinsic: number; // K: tickets a block may carry
};

export const TINY: Config = {
  name: "tiny",
  validators_count: 6,
  core_count: 2,
  epoch_length: 12,
  epoch_tail_start: 10,
  rotation_period: 4,
  max_tickets_per_extrinsic: 3,
};

export const FULL: Config = {
  name: "full",
  validators_count: 1023,
  core_count: 341,
  epoch_length: 600,
  epoch_tail_start: 500,
  rotation_period: 10,
  max_tickets_per_extrinsic: 16,
};
```

## The tests

**New file** `test/guarantors.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { GuaranteesExtrinsic } from "../src/block.ts";
import { fromHex } from "../src/bytes.ts";
import type { Bytes } from "../src/bytes.ts";
import type { Config } from "../src/config.ts";
import { FULL, TINY } from "../src/config.ts";
import { assignCores, assignmentFor, guarantorAssignments } from "../src/guarantors.ts";
import { ValidatorKey } from "../src/state.ts";
import { vectorFiles, vectorJson } from "./vectors.ts";

test("P: three guarantors per core, and every R slots they all move on one core", () => {
  const e: Bytes = new Uint8Array(32).fill(7); // any entropy will do
  const now: number[] = assignCores(TINY, 6, e, 0);
  const perCore: number[] = [0, 1].map((core) => now.filter((c) => c === core).length);
  assert.deepEqual(perCore, [3, 3]);
  const next: number[] = assignCores(TINY, 6, e, 4); // R = 4 slots later, on tiny
  const movedOn: number[] = now.map((core) => (core + 1) % 2);
  assert.deepEqual(next, movedOn);
});

/** A reports test vector: the parts of it this lesson uses. */
type ReportsVector = {
  input: { guarantees: unknown[]; slot: number };
  pre_state: {
    curr_validators: unknown[];
    prev_validators: unknown[];
    entropy: string[];
    offenders: string[];
  };
  output: { err?: string };
};

/** For each guarantee in a reports vector: its report's core, and the signers' cores. */
function signerCores(config: Config, vector: ReportsVector) {
  const { input, pre_state } = vector;
  const keys = (list: unknown[]) => list.map((key) => ValidatorKey.fromJson(key));
  const assignments = guarantorAssignments(
    config,
    input.slot,
    pre_state.entropy.map(fromHex),
    keys(pre_state.curr_validators),
    keys(pre_state.prev_validators),
    pre_state.offenders.map(fromHex),
  );
  return GuaranteesExtrinsic.fromJson(input.guarantees).map((guarantee) => {
    const { cores } = assignmentFor(config, input.slot, guarantee.slot, assignments);
    const signers = guarantee.signatures.map((s) => cores[s.validator_index]);
    return { core: guarantee.report.core_index, signers };
  });
}

test("every guarantor of every accepted report is assigned to that report's core", () => {
  let signatures = 0;
  for (const config of [TINY, FULL]) {
    for (const name of vectorFiles(`stf/reports/${config.name}`)) {
      const vector = vectorJson(name) as ReportsVector;
      if (vector.output.err) continue; // a rejected block changes nothing
      for (const { core, signers } of signerCores(config, vector)) {
        for (const signer of signers) assert.equal(signer, core, name);
        signatures += signers.length;
      }
    }
  }
  assert.equal(signatures, 130); // 62 on tiny, 68 on full
});

test("a guarantor from another core is caught", () => {
  const vector = vectorJson("stf/reports/tiny/wrong_assignment-1.json") as ReportsVector;
  const [{ core, signers }] = signerCores(TINY, vector);
  const elsewhere: boolean = signers.some((signer) => signer !== core);
  assert.ok(elsewhere);
});
```

The first test checks P's two promises with no vectors: three guarantors for each core,
and one rotation later, everyone one core along. The second checks every signer of every
accepted guarantee, 130 of them, against M or M\*.

## The code

**New file** `src/guarantors.ts`

```ts
// Guarantor assignments (GP §11): which validators may guarantee work for which core.
// Three per core, dealt out by a shuffle, and moved on to the next core every R slots.

import type { Bytes } from "./bytes.ts";
import type { Config } from "./config.ts";
import { epochOf } from "./epoch.ts";
import { withoutOffenders } from "./safrole.ts";
import { shuffleWithHash } from "./shuffle.ts";
import type { ValidatorKey } from "./state.ts";

/** P (GP §11): the core each of v validators guarantees at a slot, dealt with entropy e. */
export function assignCores(config: Config, v: number, e: Bytes, slot: number): number[] {
  const seats = Array.from({ length: v }, (_, i) => Math.floor(i / 3)); // 0 0 0 1 1 1 2 …
  const shuffled = shuffleWithHash(seats, e);
  const turns = Math.floor((slot % config.epoch_length) / config.rotation_period);
  const activeCores = v / 3;
  return shuffled.map((core) => (core + turns) % activeCores); // R: everyone moves on
}

/** An assignment (GP's M): each validator's core, and the validators' keys (offenders out). */
export type Assignment = { cores: number[]; keys: ValidatorKey[] };

/** M and M*: the guarantors of this rotation, and of the one before it. */
export function guarantorAssignments(
  config: Config,
  slot: number, // τ′
  entropy: Bytes[], // η′
  active: ValidatorKey[], // κ′
  previous: ValidatorKey[], // λ′
  offenders: Bytes[], // ψ′_O
): { current: Assignment; last: Assignment } {
  const assignment = (keys: ValidatorKey[], e: Bytes, at: number): Assignment => ({
    cores: assignCores(config, keys.length, e, at),
    keys: withoutOffenders(keys, offenders),
  });
  const then = slot - config.rotation_period; // a slot in the last rotation
  const sameEpoch = epochOf(config, then) === epochOf(config, slot);
  return {
    current: assignment(active, entropy[2], slot),
    last: sameEpoch ? assignment(active, entropy[2], then) : assignment(previous, entropy[3], then),
  };
}

/** Which assignment a guarantee made at `made` answers to, in a block at `slot`. */
export function assignmentFor(
  config: Config,
  slot: number,
  made: number,
  assignments: { current: Assignment; last: Assignment },
): Assignment {
  const R = config.rotation_period;
  return Math.floor(slot / R) === Math.floor(made / R) ? assignments.current : assignments.last;
}
```

`assignCores` is the Gray Paper's P in three lines, seats, shuffle, rotate:

```ts
  const seats = Array.from({ length: v }, (_, i) => Math.floor(i / 3)); // 0 0 0 1 1 1 2 …
  const shuffled = shuffleWithHash(seats, e);
  return shuffled.map((core) => (core + turns) % activeCores); // R: everyone moves on
```

The rotation is `% activeCores`, not `% C`: on a network with fewer validators than
usual, guarantors only rotate among the cores that have any. `guarantorAssignments`
builds M and M\* at once. `assignmentFor` picks the one a guarantee answers to.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ P: three guarantors per core, and every R slots they all move on one core (6.9ms)
✔ every guarantor of every accepted report is assigned to that report's core (2296.7ms)
✔ a guarantor from another core is caught (0.9ms)
...
ℹ tests 196
ℹ suites 0
ℹ pass 196
ℹ fail 0
...
reported 196 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791734292556
...
```

## Watch it

**New file** `bin/guarantors.ts`

```ts
// Shows who guarantees which core in a reports test vector, this rotation and the last,
// and checks each guarantee's signers against the assignment it answers to.
// Usage: npm run guarantors <vector.json>, e.g.
//        npm run guarantors ../vectors/stf/reports/tiny/report_prev_rotation-1.json

import { readFileSync } from "node:fs";
import { GuaranteesExtrinsic } from "../src/block.ts";
import { fromHex } from "../src/bytes.ts";
import { FULL, TINY } from "../src/config.ts";
import type { Assignment } from "../src/guarantors.ts";
import { assignmentFor, guarantorAssignments } from "../src/guarantors.ts";
import { Run } from "../src/obs.ts";
import { ValidatorKey } from "../src/state.ts";

const [file] = process.argv.slice(2);
const config = file.includes("/full/") ? FULL : TINY;
const { input, pre_state } = JSON.parse(readFileSync(file, "utf8"));
const keys = (list: unknown[]) => list.map((key) => ValidatorKey.fromJson(key));
const assignments = guarantorAssignments(
  config,
  input.slot,
  pre_state.entropy.map(fromHex),
  keys(pre_state.curr_validators),
  keys(pre_state.prev_validators),
  pre_state.offenders.map(fromHex),
);
const run = new Run("guarantors");

/** Each core's guarantors in an assignment, as validator indices. */
function byCore(assignment: Assignment): string {
  const cores = [...new Set(assignment.cores)].sort((a, b) => a - b);
  const seats = (core: number) => assignment.cores.flatMap((c, v) => (c === core ? [v] : []));
  return cores.map((core) => `core ${core}: ${seats(core).join(" ")}`).join(" | ");
}
console.log(`slot ${input.slot}, rotation ${Math.floor(input.slot / config.rotation_period)}`);
console.log(`  this rotation: ${byCore(assignments.current)}`);
console.log(`  the last one:  ${byCore(assignments.last)}`);
for (const guarantee of GuaranteesExtrinsic.fromJson(input.guarantees)) {
  const assignment = assignmentFor(config, input.slot, guarantee.slot, assignments);
  const which = assignment === assignments.current ? "this rotation" : "the last rotation";
  const signers = guarantee.signatures.map((s) => s.validator_index);
  const core = guarantee.report.core_index;
  const assigned = signers.every((v) => assignment.cores[v] === core);
  console.log(`guarantee for core ${core}, made at slot ${guarantee.slot} (${which}):`);
  console.log(`  signed by ${signers.join(", ")}: all assigned to core ${core}? ${assigned}`);
  const made = guarantee.slot;
  run.event("guarantee", { core, made, which, signers: signers.join(" "), assigned });
}
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

**What flows through it.** A block at slot 14 carrying one guarantee made back at slot
10, with the entropy and validator sets the assignments are dealt from:

::: code-group

```json [what goes in]
{
  "slot": 14,
  "guarantees": [
    {
      "report": { "core_index": 0, … },
      "slot": 10,
      "signatures": [
        { "validator_index": 1, "signature": "0x9e387b2c…" },
        { "validator_index": 2, "signature": "0xad62f1bf…" },
        { "validator_index": 5, "signature": "0x53476a6a…" }
      ]
    }
  ],
  "entropy": ["0x11da6d1f…", "0xe12c22d4…", "0x7b0aa173…", "0x8c039ff7…"],
  "offenders": []
}
```

```ts [what it computes]
// bin/guarantors.ts's two dealt hands, and the guarantee checked against the right one
const computed = {
  rotation: 3, // ⌊14 / 4⌋: the block's own rotation
  current: { core0: [1, 4, 5], core1: [0, 2, 3] }, // dealt from κ′ for this rotation
  last: { core0: [1, 2, 5], core1: [0, 3, 4] }, // slot 10 was last epoch: dealt from λ′, η′₃
  checked: "the last rotation", // the guarantee's slot 10 picks which hand must answer
  assigned: true, // signers 1, 2 and 5 all sat on core 0 back then
};
```

```text [what comes out]
guarantee for core 0, made at slot 10 (the last rotation):
  signed by 1, 2, 5: all assigned to core 0? true
```

:::

The guarantee's own `slot` decides which hand it answers to. Made at 10, it's checked
against the *last* rotation's seats, where 1, 2 and 5 were core 0's trio, even though
this rotation has dealt validator 2 to core 1. The `entropy` list is η: the last
rotation's hand is shuffled from its fourth entry.

**Run**

```sh
npm pkg set scripts.guarantors="node bin/guarantors.ts"
npm pkg set scripts.guarantors-prev-rotation="node bin/guarantors.ts ../vectors/stf/reports/tiny/report_prev_rotation-1.json"
npm run guarantors-prev-rotation
```

```text
slot 14, rotation 3
  this rotation: core 0: 1 4 5 | core 1: 0 2 3
  the last one:  core 0: 1 2 5 | core 1: 0 3 4
guarantee for core 0, made at slot 10 (the last rotation):
  signed by 1, 2, 5: all assigned to core 0? true
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=guarantors-1791734301753
```

The block is at slot 14, but the guarantee was made at slot 10, in the last rotation.
Slot 10 was in the *previous epoch*, so the last rotation's hand was dealt from λ′ with
η′₃. Its numbers count in λ′, this rotation's in κ′. The validator that signed as λ′'s
2 (key `0x4418…`) is κ′'s 0 now, on core 1. Its signature for core 0 still counts: back
then, core 0 was its job.

Now try `wrong_assignment-1.json`. κ′'s validator 2 signs for core 0 *this* rotation,
where it belongs to core 1, and it's caught. The *Guarantors* panel, on the
**4 · Checks** dashboard, shows each guarantee's check.

![Guarantors panel](./images/01-guarantors.png)

<details>
<summary>lasair: <code>guarantor_assignment</code>, in <code>conformance/guarantors.ml</code></summary>

```ocaml
(** GP 0.8.0 reporting_assurance.tex P(v, e, t): the core each of the [v]
    validators of a key set guarantees at slot [t] -- three guarantors per
    ACTIVE core (the first v/3 cores), base [floor(i/3) for i in N_v]
    Fisher-Yates-shuffled by [entropy], rotated every R slots modulo the
    active core count. Both the importer and live guarantee authoring use this
    one function; the set size is LIVE (sets may resize). *)
let guarantor_assignment ~(v : int) ~(entropy : bytes) ~(slot : int) : int array =
  let active = max 1 (v / 3) in
  let base = Array.init v (fun i -> i / 3) in
  let shuffled = Lasair.Utilities.shuffle_array_with_hash base entropy in
  let n = (slot mod Stf_config.epoch_length ()) / Stf_config.rotation_period () in
  Array.map (fun c -> (c + n) mod active) shuffled
```

Your `assignCores`, line for line: seats, shuffle, turns, rotate among the active cores.
lasair's comment adds something worth knowing: both its block importer *and* its own
guarantor, when it makes guarantees itself, use this one function. A client that checks
guarantees and a client that makes them had better deal the same hand.

</details>

## Check your understanding

::: check
**Why are the guarantors dealt out by a shuffle?**

- [x] So nobody can pick their core, or their friends to share it
  > Yes: the shuffle runs on entropy nobody could steer, so nobody chooses who
  > guarantees what.
- [ ] Without it, some cores would get no guarantors
  > No: the seats `0 0 0 1 1 1` already give every core three. The shuffle only changes
  > who sits where.
- [ ] So each validator guarantees every core within one slot
  > No: a validator has one core at a time, for a whole rotation of R slots.

**Who works out which validators guarantee which core, and where?**

- [ ] The guarantors, in-core: they tell the chain which core they took
  > No: nobody is taken at their word. The chain deals the hand itself, and checks a
  > guarantee's signers against it.
- [ ] The block's author, who names three validators for each core
  > No: nobody picks. If you could pick, you'd pick your friends.
- [x] Every validator, on the chain, from the same entropy
  > Yes: each works out the same hand, so the chain can later tell whether the right
  > three signed a report.

**The shuffle uses η′₂, randomness from two epochs back, not the newer η′₁. Why?**

- [ ] The newer one isn't in the state yet
  > No: both are in the state. The trouble with the newer one is the end of the last
  > epoch, where forks may still disagree.
- [x] No fork at the end of the last epoch can disagree about it
  > Yes: validators unsure how the last epoch ended still deal the same hand, so the
  > doubt can't grow into two established forks.
- [ ] Older randomness is harder to steer
  > No: the Gray Paper's reason is agreement, not strength. Every fork holds the same
  > η′₂.

**Why does a guarantee from the last rotation still count?**

- [ ] Guarantors keep their old core for an extra rotation
  > No: everyone moves on every R slots. M\* seats nobody; it only checks guarantees
  > made in the last rotation.
- [x] Its signers are checked against the core they held when they signed
  > Yes: doing the work and reaching a block takes time. A guarantee made just before
  > a rotation still counts in the next.
- [ ] Any guarantee from this epoch counts
  > No: only this rotation or the one before. M\* covers just the rotation before.

**A guarantee was made in the rotation before its block's, and that rotation was in the previous epoch. Which hand are its signers checked against?**

- [x] The last rotation's, dealt from the previous epoch's validators with that epoch's randomness
  > Yes: M\* at τ′ − R. That slot is in the previous epoch, so it uses λ′ and η′₃.
- [ ] The last rotation's, dealt from the current validators
  > No: that's for a last rotation in this epoch. Across an epoch's edge the validators
  > and the randomness are the previous epoch's own.
- [ ] This rotation's: what counts is the block's slot
  > No: a guarantee answers to the rotation it was made in. The block's slot only says
  > which rotation is "this" one.
:::

## What you have

The guarantor deal: who may vouch for which core, this rotation and the last, checked
against every guarantee in the vectors. Being assigned isn't the same as having signed,
though: [lesson 12.2](./02-signed-and-counted.md) checks the signatures.

Next: [12.2 Signed and counted](./02-signed-and-counted.md)
