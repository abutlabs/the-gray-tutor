# Votes and verdicts

Back in [lesson 4.4](../04-blocks/04-disputes.md) you decoded disputes: trials held right in the blocks. Now your client
gets to be the court clerk. When validators challenge a work-report, two thirds of them
plus one vote on it, and every vote is signed. The clerk's job: check every signature,
count the votes, and record the verdict, *good*, *bad* or *wonky*, in the state for
good. This lesson is that clerk.

## New words

- **Judgement.** One validator's signed vote, valid or invalid, on a work-report. The
  state keeps the verdicts' results as its past judgements, ψ. *Example:* a verdict on
  tiny carries 5 judgements.
- **Judges.** The validators whose votes a verdict carries: this epoch's (κ) if the
  verdict's age is this epoch, last epoch's (λ) if it's the one before. *Example:* on
  tiny, 6 judges, so a verdict needs ⌊2·6/3⌋ + 1 = 5 votes.
- **Verdict age.** The epoch a verdict's votes were cast in. Only this epoch or the last
  one will do. *Example:* in epoch 3, ages 3 and 2 are fine, age 1 isn't.
- **Vote split.** How many of a verdict's votes say "valid". Only three splits mean
  anything: all of them (good), none (bad), or a third of the judges (wonky).
  *Example:* on tiny, 5, 0 or 2.

All four are in the [glossary](../glossary.md).

## What the Gray Paper says

§10 (*Disputes, Verdicts and Judgments*).

**Who votes.** A verdict's `age`, its *verdict age*, names an epoch: this one or the one
before. Its *judges* are κ, the current validators, if the age is the current epoch, and
λ, the previous ones, otherwise. That rule is K.

**What a vote signs.** Ed25519 ([lesson 5.3](../05-hashing-and-signatures/03-signatures.md)), over a prefix and the report's hash:
`$jam_valid` for "this report is good", `$jam_invalid` for "it isn't". The `$` is
notation, as always: the bytes are `jam_valid` and `jam_invalid`. The prefix is part of
the message, so a "valid" signature can't be passed off as an "invalid" one.

**What it decides.** A verdict never carries a vote from every judge: it carries exactly
⌊2·|K|/3⌋ + 1 of them, a supermajority — 5 of tiny's 6 judges, 683 of full's 1,023.
Count how many of those carried votes say "valid". That count, t, is the *vote split*,
and only three splits mean anything:

| the votes saying "valid" | on tiny | on full | the report is |
| --- | --- | --- | --- |
| all of them: t = ⌊2·\|K\|/3⌋ + 1 | 5 of 5 | 683 of 683 | **good** — a supermajority swears it's right |
| none: t = 0 | 0 of 5 | 0 of 683 | **bad** — the same supermajority, swearing it's wrong |
| a third of the judges: t = ⌊\|K\|/3⌋ | 2 of 5 | 341 of 683 | **wonky** — truly split, nobody can tell |
| anything else | 1, 3 or 4 of 5 | any other count | no verdict at all: the block is refused, as [lesson 10.4](./04-bad-verdicts.md)'s `bad_vote_split` |

**What the state keeps.** ψ (C(5), [lesson 6.2](../06-state-and-merklization/02-state-keys.md)) holds three sets of report hashes, good,
bad and wonky, plus the offenders' keys ([next lesson](./02-culprits-and-faults.md)). Each verdict's report joins the
set of its outcome. Sets in the state are kept sorted.

Try it on tiny: six judges, and a verdict of five votes. It starts as the first test below
does, all five saying valid, with judge 5 left out. Make the report bad, then wonky. Then
try a split the table doesn't have, 3 valid out of 5: the chain refuses the whole block,
as [lesson 10.4](./04-bad-verdicts.md) will make your client do. Full has 1,023 judges and 683 votes, so
there you set the counts:

<VerdictVotes />

## The tests

**New file** `test/disputes.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { DisputesExtrinsic } from "../src/block.ts";
import type { Verdict } from "../src/block.ts";
import { FULL, TINY } from "../src/config.ts";
import { judges, outcome, PastJudgements, recordVerdicts, votesSigned } from "../src/disputes.ts";
import { ValidatorKey } from "../src/state.ts";
import { vectorFiles, vectorJson } from "./vectors.ts";
import type { Outcome } from "../src/disputes.ts";

/** A verdict with `valid` "valid" votes out of `count`, unsigned: enough for counting. */
function verdictWith(valid: number, count: number): Verdict {
  const votes = Array.from({ length: count }, (_, index) => ({
    vote: index < valid,
    index,
    signature: new Uint8Array(64),
  }));
  return { target: new Uint8Array(32), age: 0, votes };
}

test("V: with 6 judges, 5 valid votes is good, 0 is bad, 2 is wonky", () => {
  const fiveValid: Outcome = outcome(verdictWith(5, 5), 6);
  assert.equal(fiveValid, "good"); // ⌊2 × 6 / 3⌋ + 1 = 5
  const noneValid: Outcome = outcome(verdictWith(0, 5), 6);
  assert.equal(noneValid, "bad");
  const twoValid: Outcome = outcome(verdictWith(2, 5), 6);
  assert.equal(twoValid, "wonky"); // ⌊6 / 3⌋ = 2
});

/** A disputes test vector: the parts of it this lesson uses. */
type DisputesVector = {
  input: { disputes: unknown };
  pre_state: { psi: unknown; tau: number; kappa: unknown[]; lambda: unknown[] };
  post_state: { psi: unknown };
  output: { err?: string };
};

/** A disputes vector's verdicts, each with its judges' keys (κ or λ, by its age). */
function judgedVerdicts(config: typeof TINY, vector: DisputesVector) {
  const { input, pre_state } = vector;
  const keys = (list: unknown[]) => list.map((key) => ValidatorKey.fromJson(key));
  const [active, previous] = [keys(pre_state.kappa), keys(pre_state.lambda)];
  return DisputesExtrinsic.fromJson(input.disputes).verdicts.map((verdict) => ({
    verdict,
    keys: judges(config, pre_state.tau, verdict.age, active, previous),
  }));
}

/** The accepted disputes vectors of a size: a rejected block changes nothing. */
function acceptedVectors(config: typeof TINY): { name: string; vector: DisputesVector }[] {
  return vectorFiles(`stf/disputes/${config.name}`)
    .map((name) => ({ name, vector: vectorJson(name) as DisputesVector }))
    .filter(({ vector }) => !vector.output.err);
}

test("every vote is signed by its judge (tiny: full verdicts are 683 votes each)", () => {
  for (const { name, vector } of acceptedVectors(TINY)) {
    for (const { verdict, keys } of judgedVerdicts(TINY, vector)) {
      const signed: boolean = votesSigned(verdict, keys);
      assert.ok(signed, name);
    }
  }
});

test("each judged report joins the set of its verdict's outcome", () => {
  let accepted = 0;
  for (const config of [TINY, FULL]) {
    for (const { name, vector } of acceptedVectors(config)) {
      const outcomes = judgedVerdicts(config, vector).map(({ verdict, keys }) => ({
        target: verdict.target,
        outcome: outcome(verdict, keys.length),
      }));
      const before: PastJudgements = PastJudgements.fromJson(vector.pre_state.psi);
      const after: PastJudgements = recordVerdicts(before, outcomes);
      const { good, bad, wonky }: PastJudgements = PastJudgements.fromJson(vector.post_state.psi);
      assert.deepEqual([after.good, after.bad, after.wonky], [good, bad, wonky], name);
      accepted++;
    }
  }
  assert.equal(accepted, 21); // 10 tiny, 11 full
});

test("a forged vote is caught", () => {
  const vector = vectorJson("stf/disputes/tiny/progress_with_bad_signatures-1.json");
  const [{ verdict, keys }] = judgedVerdicts(TINY, vector as DisputesVector);
  const signed: boolean = votesSigned(verdict, keys);
  assert.equal(signed, false);
});
```

`verdictWith` builds a fake verdict with blank signatures: plenty for testing the count.
The signatures get their own test, on tiny only. A full verdict has 683 votes, and
checking the 7,500-odd votes of the full vectors it would cover would take your test run
from about three seconds to about ten.

## The code

**New file** `src/disputes.ts`

```ts
// Disputes (GP §10): when a work-report is challenged, validators vote on it, and the chain
// records the verdict for good.

import type { Verdict } from "./block.ts";
import type { Bytes } from "./bytes.ts";
import { concatBytes, toHex } from "./bytes.ts";
import type { Value } from "./codec/codec.ts";
import { fixedBytes, hash, record, seq } from "./codec/codec.ts";
import type { Config } from "./config.ts";
import { epochOf } from "./epoch.ts";
import { verifyEd25519 } from "./signature.ts";
import type { ValidatorKey } from "./state.ts";

/** ψ, C(5): the reports judged good, bad or wonky so far, and the offenders' Ed25519 keys. */
export const PastJudgements = record({
  good: seq(hash),
  bad: seq(hash),
  wonky: seq(hash),
  offenders: seq(fixedBytes(32)),
});
export type PastJudgements = Value<typeof PastJudgements>;

/** X_⊺ and X_⊥: "$jam_valid" and "$jam_invalid" in the GP. */
const VALID = new TextEncoder().encode("jam_valid");
const INVALID = new TextEncoder().encode("jam_invalid");

/** What a vote signs: its prefix, valid or invalid, then the report's hash. */
export function voteMessage(vote: boolean, target: Bytes): Bytes {
  return concatBytes(vote ? VALID : INVALID, target);
}

/** K: whose keys a verdict's votes are signed with. κ if its age is this epoch, else λ. */
export function judges(
  config: Config,
  time: number, // τ
  age: number, // the verdict's epoch
  active: ValidatorKey[], // κ
  previous: ValidatorKey[], // λ
): ValidatorKey[] {
  return age === epochOf(config, time) ? active : previous;
}

/** Whether every vote of a verdict is signed by the validator it names. */
export function votesSigned(verdict: Verdict, keys: ValidatorKey[]): boolean {
  return verdict.votes.every((vote) => {
    const message = voteMessage(vote.vote, verdict.target);
    return verifyEd25519(keys[vote.index].ed25519, message, vote.signature);
  });
}

/** A verdict's outcome: the report is good, bad, or wonky (nobody can tell). */
export type Outcome = "good" | "bad" | "wonky";

/** V: a verdict's outcome, by how many of its judges said "valid": all, none, or a third. */
export function outcome(verdict: Verdict, judges: number): Outcome {
  const valid = verdict.votes.filter((vote) => vote.vote).length;
  if (valid === Math.floor((2 * judges) / 3) + 1) return "good";
  if (valid === 0) return "bad";
  return "wonky"; // ⌊judges / 3⌋ said "valid": no side won
}

/** Hashes as a set: sorted, the way the state keeps them. */
const sorted = (hashes: Bytes[]) => [...hashes].sort((a, b) => toHex(a).localeCompare(toHex(b)));

/** ψ′'s three sets: each judged report joins the set of its outcome. */
export function recordVerdicts(
  before: PastJudgements,
  judged: { target: Bytes; outcome: Outcome }[],
): PastJudgements {
  const after = { ...before };
  for (const set of ["good", "bad", "wonky"] as const) {
    const reports = judged.filter((j) => j.outcome === set).map((j) => j.target);
    after[set] = sorted([...before[set], ...reports]);
  }
  return after;
}
```

`PastJudgements` is ψ as a `record`, so it's C(5)'s codec too. `outcome` is the table,
row by row:

```ts
  if (valid === Math.floor((2 * judges) / 3) + 1) return "good";
  if (valid === 0) return "bad";
  return "wonky"; // ⌊judges / 3⌋ said "valid": no side won
```

It takes the *judges'* number, not always V: a verdict from the previous epoch is counted
against λ's size. `recordVerdicts` copies ψ with `{ ...before }`, then rebuilds each set, sorted.
The sort compares hex strings, which sort in the same order as the bytes they spell.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ V: with 6 judges, 5 valid votes is good, 0 is bad, 2 is wonky (0.6ms)
✔ every vote is signed by its judge (tiny: full verdicts are 683 votes each) (321.8ms)
✔ each judged report joins the set of its verdict's outcome (385.9ms)
✔ a forged vote is caught (8.9ms)
...
ℹ tests 96
ℹ suites 0
ℹ pass 96
ℹ fail 0
...
reported 96 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791731877727
...
```

21 accepted blocks, every verdict recorded where it belongs: 10 on tiny, 11 on full.

> [!NOTE]
> **The simple road, for now.** `outcome` says *wonky* for any count that isn't all or
> nothing, but the Gray Paper only allows exactly ⌊|K|/3⌋. A block whose votes split any
> other way must be rejected. [Lesson 10.4](./04-bad-verdicts.md) adds that check, and lasair has a story about
> it (below).

## Watch it

**New file** `bin/verdicts.ts`

```ts
// Shows each verdict in a disputes test vector: whose judges voted, how they voted, whether
// every vote is really theirs, and what the verdict decides.
// Usage: npm run verdicts <vector.json>, e.g.
//        npm run verdicts ../vectors/stf/disputes/tiny/progress_with_verdicts-4.json

import { readFileSync } from "node:fs";
import { DisputesExtrinsic } from "../src/block.ts";
import { toHex } from "../src/bytes.ts";
import { FULL, TINY } from "../src/config.ts";
import { judges, outcome, votesSigned } from "../src/disputes.ts";
import { Run } from "../src/obs.ts";
import { ValidatorKey } from "../src/state.ts";

const [file] = process.argv.slice(2);
const config = file.includes("/full/") ? FULL : TINY;
const { input, pre_state } = JSON.parse(readFileSync(file, "utf8"));
const keys = (list: unknown[]) => list.map((key) => ValidatorKey.fromJson(key));
const [active, previous] = [keys(pre_state.kappa), keys(pre_state.lambda)];
const run = new Run("verdicts");
for (const verdict of DisputesExtrinsic.fromJson(input.disputes).verdicts) {
  const judgeKeys = judges(config, pre_state.tau, verdict.age, active, previous);
  const set = judgeKeys === active ? "κ" : "λ";
  const valid = verdict.votes.filter((vote) => vote.vote).length;
  const votes = verdict.votes.length;
  const signed = votesSigned(verdict, judgeKeys);
  const decided = outcome(verdict, judgeKeys.length);
  const report = `${toHex(verdict.target).slice(0, 10)}…`;
  console.log(`report ${report}: ${valid} of ${votes} say valid, judged by ${set}`);
  console.log(`  every vote signed by its judge: ${signed}. The report is ${decided}.`);
  run.event("verdict", { report: verdict.target, set, valid, votes, signed, decided });
}
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

**Run**

```sh
npm pkg set scripts.verdicts="node bin/verdicts.ts"
npm pkg set scripts.verdicts-progress="node bin/verdicts.ts ../vectors/stf/disputes/tiny/progress_with_verdicts-4.json"
npm run verdicts-progress
```

```text
report 0x11da6d1f…: 5 of 5 say valid, judged by κ
  every vote signed by its judge: true. The report is good.
report 0x7b0aa173…: 0 of 5 say valid, judged by κ
  every vote signed by its judge: true. The report is bad.
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=verdicts-1791731881564
```

Two trials in one block: one report cleared, one condemned. Now try
`progress_with_bad_signatures-1.json`: `every vote signed by its judge: false`, a forged
vote. Then `progress_with_verdict_signatures_from_previous_set-1.json`, judged by λ. And
that report's hash, `0x0e5751c0…`, should ring a bell: it's the Blake2b of no bytes at
all, from [lesson 5.1](../05-hashing-and-signatures/01-hashes.md). Test vectors need report hashes from somewhere! The *Verdicts*
panel, on the **4 · Checks** dashboard (where [Part 10](./index.md)'s panels are), has every trial.

![Verdicts panel](./images/01-verdicts.png)

<details>
<summary>lasair: <code>classify_verdict</code>, in <code>conformance/disputes_stf.ml</code></summary>

```ocaml
let classify_verdict (k : validator_key list) (judgements : judgement_vote list) : verdict_result =
  let valid_count = List.length (List.filter (fun j -> j.is_valid) judgements) in
  if valid_count = verdict_threshold_for k then VerdictGood
  else if valid_count = 0 then VerdictBad
  else if valid_count = wonky_tally_for k then VerdictWonky
  else VerdictBadSplit
```

Four answers, not three: lasair rejects every other split as `VerdictBadSplit`. Its
comment tells why it's there. An older version treated almost *any* split as wonky, as
your `outcome` does today, and nobody noticed, because no test vector votes 3 of 5 or 342
of 683. (One votes 1 of 5, which that version already refused; [lesson 10.4](./04-bad-verdicts.md) uses it.) A
part of a rule the vectors never exercise is a part you have to read the Gray Paper for.

</details>

## Check your understanding

::: check
**On tiny, 6 judges. A verdict's 5 votes include 2 that say valid. What is the report?**

- [ ] Bad, since most votes say invalid
  > No: bad needs zero valid votes. A majority against isn't enough.
- [x] Wonky
  > Yes: 2 is ⌊6/3⌋, a third of the judges, the wonky row. Nobody can tell.
- [ ] Refused: 2 isn't a split the table has
  > No: 2 is exactly the wonky split. 3 valid would be refused.

**On full, why does a good verdict need exactly 683 valid votes?**

- [x] It's ⌊2 · 1,023/3⌋ + 1 = 682 + 1: more than two thirds of the 1,023 judges
  > Yes: two thirds plus one. And since a verdict carries exactly that many votes, good
  > means every vote in it says valid.
- [ ] It's two thirds of 1,023, rounded up
  > No: two thirds of 1,023 is exactly 682. 683 is one more.
- [ ] Every one of the 1,023 validators must say valid
  > No: a verdict carries only 683 votes, not 1,023.

**A verdict's age is the epoch before this one. Whose keys check its votes, and how many judges count?**

- [ ] κ's, since κ is the validator set now
  > No: K picks κ only when the age is this epoch. Otherwise it's λ.
- [ ] λ's keys, but the count is always against V
  > No: the count is against |K|, the judges' own number. The validator set can change
  > size between epochs.
- [x] λ's keys, and the count is against λ's size
  > Yes: the judges are λ, so two thirds plus one of λ, and λ's keys sign the votes.

**Why does a vote sign `jam_valid` or `jam_invalid` before the report's hash, not the hash alone?**

- [ ] A longer message makes the signature harder to forge
  > No: an Ed25519 signature is 64 bytes, and as strong, whatever it signs.
- [x] So a "valid" signature can't be passed off as an "invalid" one
  > Yes: the prefix is part of the message. Same judge, same report, but the two votes
  > sign different bytes.
- [ ] To say which epoch the vote was cast in
  > No: the epoch is the verdict's age, a separate field. The prefix says only which way
  > the vote went.
:::

## What you have

A court clerk: every vote's signature checked against the right judges, every verdict
counted and filed in ψ. A verdict is only half a trial, though: [lesson 10.2](./02-culprits-and-faults.md) names
the validators who were on the wrong side of it.

Next: [10.2 Culprits and faults](./02-culprits-and-faults.md)
