# Bad verdicts

Your court from lessons [10.1](./01-votes-and-verdicts.md) to [10.3](./03-clearing-the-cores.md) believes every verdict it's handed. A real block can
carry a broken one: the wrong number of votes, votes out of order, a judge who never
signed, a report judged long ago. Any of them sinks the whole block. This lesson writes
down the rules and checks them against every disputes vector; [lesson 10.5](./05-bad-culprits-and-faults.md) does the
same for culprits and faults.

The rules lean on three words from [lesson 10.1](./01-votes-and-verdicts.md): *judges*, *verdict age* and *vote
split*. All three are in the [glossary](../glossary.md) too.

## What the Gray Paper says

§10, *Disputes*. Every verdict in a block must keep seven rules:

1. **In order.** Verdicts are sorted by report hash, with no report twice.
   (`verdicts_not_sorted_unique`)
2. **New.** No report judged before: not in ψ's good, bad or wonky sets.
   (`already_judged`)
3. **Recent.** Its age is this epoch or the last. (`bad_judgement_age`)
4. **The right number of votes.** Exactly two thirds of its judges, plus one.
   (`bad_votes_count`)
5. **Votes in order.** Sorted by judge index, no judge twice.
   (`judgements_not_sorted_unique`)
6. **Signed.** Every vote by the judge it names ([lesson 10.1](./01-votes-and-verdicts.md)'s `votesSigned`), and every
   judge index a real one. (`bad_signature`; the note after the code has more on the
   index)
7. **A meaningful split.** All, none, or a third of the judges said "valid".
   (`bad_vote_split`)

Rule 7 changes [lesson 10.1](./01-votes-and-verdicts.md)'s `outcome`: it called every split that wasn't all or none
"wonky". Now any other split never gets that far, and only the third is left.

The Gray Paper's names: the judges are **K(a)**, κ if a = ⌊τ/E⌋ and λ otherwise; the
count is **⌊⅔|K|⌋ + 1**; the three splits are **V**'s three cases.

## The tests

**Add to** `test/disputes.test.ts`

```ts
import { verdictError } from "../src/disputes.ts";

/** What the verdict rules say of disputes vector `name`: null (they pass) or the rule broken. */
function verdictVerdict(config: typeof TINY, name: string) {
  const { input, pre_state } = vectorJson(name) as DisputesVector;
  const keys = (list: unknown[]) => list.map((key) => ValidatorKey.fromJson(key));
  const { verdicts } = DisputesExtrinsic.fromJson(input.disputes);
  const before = PastJudgements.fromJson(pre_state.psi);
  const [active, previous] = [keys(pre_state.kappa), keys(pre_state.lambda)];
  return verdictError(config, verdicts, before, pre_state.tau, active, previous);
}

/** The disputes vectors whose verdicts break a rule, and the rule they break. */
const BAD_VERDICTS = new Map([
  ["progress_with_verdicts-3", "verdicts_not_sorted_unique"],
  ["progress_with_culprits-3", "already_judged"],
  ["progress_with_faults-5", "already_judged"],
  ["progress_with_verdict_signatures_from_previous_set-2", "bad_judgement_age"],
  ["progress_with_bad_votes_count-1", "bad_votes_count"],
  ["progress_with_verdicts_from_resized_previous_set-2", "bad_votes_count"], // full only
  ["progress_with_verdicts-1", "judgements_not_sorted_unique"],
  ["progress_with_verdicts-2", "judgements_not_sorted_unique"],
  ["progress_with_bad_signatures-1", "bad_signature"],
  ["progress_with_verdicts-5", "bad_vote_split"],
]);

test("a split that's neither good, bad nor wonky is refused", () => {
  const name = "stf/disputes/tiny/progress_with_verdicts-5.json";
  const broken: string | null = verdictVerdict(TINY, name);
  assert.equal(broken, "bad_vote_split");
});

/**
 * Every tiny disputes vector, and the full ones tiny can't have (a resized λ). A full
 * verdict carries 683 signed votes, and checking every full vector takes the better part
 * of a minute; `npm run check-disputes full` does that whenever you like.
 */
const VERDICT_VECTORS = [
  ...vectorFiles("stf/disputes/tiny").map((name) => ({ config: TINY, name })),
  ...vectorFiles("stf/disputes/full")
    .filter((name) => name.includes("resized"))
    .map((name) => ({ config: FULL, name })),
];

for (const { config, name } of VERDICT_VECTORS) {
  const short = name.split("/").at(-1)!.replace(".json", "");
  test(`${name}: its verdicts pass, or break the rule the vector names`, () => {
    const broken: string | null = verdictVerdict(config, name);
    const expected: string | null = BAD_VERDICTS.get(short) ?? null;
    assert.equal(broken, expected);
  });
}
```

`BAD_VERDICTS` lists the vectors whose verdicts break a rule, and which rule. Every other
disputes vector's verdicts must pass, including those the vector refuses for a culprit or
a fault ([lesson 10.5](./05-bad-culprits-and-faults.md)'s business). The test runs every tiny vector, and only the two full
ones that tiny can't have: a full verdict carries 683 signed votes, and checking every
full vector takes about twenty seconds (more on a slower machine), on every `npm test`. Watch it, below,
checks them all whenever you ask. One error name comes up in both lessons: in
`progress_with_bad_signatures-2` the bad signature is a culprit's, so its verdicts pass
here. The full vectors have one case tiny can't have: in
`progress_with_verdicts_from_resized_previous_set-2`, λ has 6 validators and κ has 1,023.
Its verdict is aged this epoch, so its judges are κ, and 5 votes are far short of 683.

A stub that passes every verdict:

**Add to** `src/disputes.ts`

```ts
export function verdictError(
  config: Config,
  verdicts: Verdict[],
  before: PastJudgements, // ψ
  time: number,
  active: ValidatorKey[],
  previous: ValidatorKey[],
): string | null {
  return null;
}
```

**Run, expect it to fail**

```sh
npm test
```

```text
...
✖ a split that's neither good, bad nor wonky is refused (1.6ms)
...
ℹ tests 133
ℹ suites 0
ℹ pass 122
ℹ fail 11
...
test at test/disputes.test.ts:194:1
✖ a split that's neither good, bad nor wonky is refused (1.6ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected

  + null
  - 'bad_vote_split'
...
```

Eleven reds: the split test, and each of the ten vectors in `BAD_VERDICTS`. They all read
the same way: the vector names a rule (`-`), and your stub, passing everything, says
`null` (`+`).

## The code

**Replace in** `src/disputes.ts`

```ts
/**
 * Are a block's verdicts valid (GP §10)? The first rule they break, under the test vectors'
 * name for it, or null if they keep every rule. `time` is τ, the slot before the block;
 * `active` and `previous` are κ and λ.
 */
export function verdictError(
  config: Config,
  verdicts: Verdict[],
  before: PastJudgements, // ψ
  time: number,
  active: ValidatorKey[],
  previous: ValidatorKey[],
): string | null {
  const epoch = epochOf(config, time);
  const keysOf = (v: Verdict) => judges(config, time, v.age, active, previous); // K
  const judged = new Set([...before.good, ...before.bad, ...before.wonky].map(toHex));
  const targetsInOrder = verdicts.every(
    (v, i) => i === 0 || toHex(verdicts[i - 1].target) < toHex(v.target),
  );
  const votesInOrder = (v: Verdict) =>
    v.votes.every((j, i) => i === 0 || v.votes[i - 1].index < j.index);
  const twoThirdsPlusOne = (v: Verdict) => Math.floor((2 * keysOf(v).length) / 3) + 1;
  const signed = (v: Verdict) =>
    v.votes.every((j) => j.index < keysOf(v).length) && votesSigned(v, keysOf(v));
  const split = (v: Verdict) => {
    const valid = v.votes.filter((j) => j.vote).length;
    return [twoThirdsPlusOne(v), 0, Math.floor(keysOf(v).length / 3)].includes(valid);
  };
  if (!targetsInOrder) return "verdicts_not_sorted_unique";
  if (verdicts.some((v) => judged.has(toHex(v.target)))) return "already_judged";
  if (!verdicts.every((v) => v.age === epoch || v.age === epoch - 1)) return "bad_judgement_age";
  if (!verdicts.every((v) => v.votes.length === twoThirdsPlusOne(v))) return "bad_votes_count";
  if (!verdicts.every(votesInOrder)) return "judgements_not_sorted_unique";
  if (!verdicts.every(signed)) return "bad_signature";
  if (!verdicts.every(split)) return "bad_vote_split";
  return null;
}
```

Seven rules, seven lines at the end, in the order above. The helpers before them each
answer one question about one verdict: who its judges are, whether its votes are in
order, how many votes it needs, whether it's signed, whether its split means anything.
The order matters when a block breaks two rules at once, because a vector names only one
of them. This order names the same one as the vector, for every disputes vector.

<VerdictRules />

> [!NOTE]
> **The simple road.** The test vectors' list of error names has one more for rule 6:
> `bad_validator_index`, for a vote whose judge index is past the end of K. No vector
> uses it yet, so `signed` folds an index out of range into `bad_signature`, and every
> vector agrees. The [hardening pass](https://github.com/abutlabs/the-gray-tutor/blob/main/HARDENING.md) gives it its own name.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ a split that's neither good, bad nor wonky is refused (9.7ms)
...
ℹ tests 133
ℹ suites 0
ℹ pass 133
ℹ fail 0
...
reported 133 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791732266078
...
```

## Watch it

**New file** `bin/check-disputes.ts`

```ts
// Checks the verdicts of every disputes test vector of one size against the rules, and
// shows what the rules say next to what the vector says.
// Usage: npm run check-disputes [tiny or full], tiny if not given

import { readdirSync, readFileSync } from "node:fs";
import { DisputesExtrinsic } from "../src/block.ts";
import { FULL, TINY } from "../src/config.ts";
import { PastJudgements, verdictError } from "../src/disputes.ts";
import { Run } from "../src/obs.ts";
import { ValidatorKey } from "../src/state.ts";

const config = process.argv[2] === "full" ? FULL : TINY;
const dir = `../vectors/stf/disputes/${config.name}`;
const keys = (list: unknown[]) => list.map((key) => ValidatorKey.fromJson(key));
const run = new Run("dispute-check");
for (const file of readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
  const { input, pre_state, output } = JSON.parse(readFileSync(`${dir}/${file}`, "utf8"));
  const { verdicts } = DisputesExtrinsic.fromJson(input.disputes);
  const before = PastJudgements.fromJson(pre_state.psi);
  const [active, previous] = [keys(pre_state.kappa), keys(pre_state.lambda)];
  const ours = verdictError(config, verdicts, before, pre_state.tau, active, previous);
  const theirs = output.err ?? "accepted";
  const name = file.replace(".json", "");
  console.log(`${name}: ${ours ?? "verdicts pass"} (the vector: ${theirs})`);
  run.event("vector", { name, ours: ours ?? "verdicts pass", theirs });
}
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

**What flows through it.** No single vector this time: the program walks every tiny
disputes vector in turn. Two of the ones it refuses, trimmed to the broken verdict:

::: code-group

```text [what goes in]
progress_with_bad_votes_count-1.json, input.disputes.verdicts[0]:
  { "target": "0x0e5751c0…", "age": 0, "votes": [ …only 4 votes, none "vote": true… ] }

progress_with_verdicts-5.json, input.disputes.verdicts[0]:
  { "target": "0xe12c22d4…", "age": 0, "votes": [ …5 votes, 1 of them "vote": true… ] }
```

```ts [what it computes]
// verdictError's answer for each, printed beside the vector's own output.err
const computed = {
  bad_votes_count: "4 votes carried, not ⌊2·6/3⌋ + 1 = 5", // counted before any signature
  bad_vote_split: "5 carried but t = 1: not all, not none, not a third", // no such split
};
```

```text [what comes out]
progress_with_bad_votes_count-1: bad_votes_count (the vector: bad_votes_count)
progress_with_verdicts-5: bad_vote_split (the vector: bad_vote_split)
```

:::

The first vector's verdict carries 4 votes where a verdict carries exactly 5: refused
by count alone, before a single signature is read. The second carries 5 of which one
says valid — a split [lesson 10.1](./01-votes-and-verdicts.md)'s table doesn't have. Each output line shows your
rules' answer beside the vector's, so a disagreement reads instantly.

**Run**

```sh
npm pkg set scripts.check-disputes="node bin/check-disputes.ts"
npm run check-disputes
```

```text
progress_invalidates_avail_assignments-1: verdicts pass (the vector: accepted)
progress_with_bad_signatures-1: bad_signature (the vector: bad_signature)
progress_with_bad_signatures-2: verdicts pass (the vector: bad_signature)
progress_with_bad_verdict_without_culprits-1: verdicts pass (the vector: accepted)
progress_with_bad_verdict_without_culprits-2: verdicts pass (the vector: accepted)
progress_with_bad_votes_count-1: bad_votes_count (the vector: bad_votes_count)
progress_with_culprits-1: verdicts pass (the vector: culprits_not_sorted_unique)
progress_with_culprits-2: verdicts pass (the vector: accepted)
progress_with_culprits-3: already_judged (the vector: already_judged)
progress_with_culprits-4: verdicts pass (the vector: offender_already_reported)
progress_with_culprits-5: verdicts pass (the vector: culprits_verdict_not_bad)
progress_with_faults-1: verdicts pass (the vector: not_enough_faults)
progress_with_faults-2: verdicts pass (the vector: accepted)
progress_with_faults-3: verdicts pass (the vector: faults_not_sorted_unique)
progress_with_faults-4: verdicts pass (the vector: accepted)
progress_with_faults-5: already_judged (the vector: already_judged)
progress_with_faults-6: verdicts pass (the vector: offender_already_reported)
progress_with_faults-7: verdicts pass (the vector: fault_verdict_wrong)
progress_with_invalid_keys-1: verdicts pass (the vector: bad_guarantor_key)
progress_with_invalid_keys-2: verdicts pass (the vector: bad_auditor_key)
progress_with_no_verdicts-1: verdicts pass (the vector: accepted)
progress_with_verdict_signatures_from_previous_set-1: verdicts pass (the vector: accepted)
progress_with_verdict_signatures_from_previous_set-2: bad_judgement_age (the vector: bad_judgement_age)
progress_with_verdicts-1: judgements_not_sorted_unique (the vector: judgements_not_sorted_unique)
progress_with_verdicts-2: judgements_not_sorted_unique (the vector: judgements_not_sorted_unique)
progress_with_verdicts-3: verdicts_not_sorted_unique (the vector: verdicts_not_sorted_unique)
progress_with_verdicts-4: verdicts pass (the vector: accepted)
progress_with_verdicts-5: bad_vote_split (the vector: bad_vote_split)
progress_with_verdicts-6: verdicts pass (the vector: accepted)
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=dispute-check-1791732270772
```

Every line where the rules found a bad verdict agrees with the vector, and
`npm run check-disputes full` says the same of the full vectors. The others show
what's left for [lesson 10.5](./05-bad-culprits-and-faults.md): blocks whose verdicts are fine, refused for their culprits or
faults. The *Dispute checks* panel, on the **4 · Checks** dashboard, keeps the list.

![Dispute checks panel](./images/04-dispute-checks.png)

<details>
<summary>lasair: rule 6, in <code>conformance/disputes_stf.ml</code></summary>

```ocaml
      let rec validate_votes (votes : judgement_vote list) = match votes with
        | [] -> Result.Ok ()
        | (vote : judgement_vote) :: rest ->
          (* Check validator index *)
          if vote.index < 0 || vote.index >= List.length validators then
            Result.Error "bad_validator_index"
          else begin
            (* Get validator's public key *)
            let validator = List.nth validators vote.index in

            (* Verify signature *)
            let payload = create_judgment_payload vote.is_valid v.target in
            if not (ed25519_verify validator.ed25519 payload vote.signature) then
              Result.Error "bad_signature"
            else
              validate_votes rest
          end
      in
```

Rule 6 as a recursion over the votes, one at a time, and with the index check split
off: an index past the end is `bad_validator_index`, the name your client folds into
`bad_signature` (the note above). No vector has an index out of range yet, so lasair's
name comes from reading the vectors' error list, not from a vector that proved it. The rule
7 story, the split lasair once got wrong, is in [lesson 10.1](./01-votes-and-verdicts.md)'s lasair box.

</details>

## Check your understanding

::: check
**In `progress_with_verdicts-5` on tiny, a verdict's 5 votes include 1 valid. What happens?**

- [ ] The report is wonky: neither all nor none
  > No: wonky is exactly ⌊6/3⌋ = 2 valid votes, not any count in between.
- [x] The whole block is refused, `bad_vote_split`
  > Yes: 1 is not 5, 0 or 2, so the split means nothing, and rule 7 sinks the block.
- [ ] The report is bad: nearly everyone said invalid
  > No: bad needs zero valid votes. One judge said valid.

**On full, `progress_with_verdicts_from_resized_previous_set-2` has λ of 6 validators and κ of 1,023. Its verdict, aged this epoch, carries 5 votes. Why is it refused?**

- [ ] It isn't: 5 votes is right for 6 validators
  > No: it would be, if its judges were λ. Its age is this epoch, so they're κ.
- [x] Its judges are κ, so it needs 683 votes, and 5 is far short: `bad_votes_count`
  > Yes: ⌊2 · 1,023/3⌋ + 1 = 683. The count is against the judges the age picks.
- [ ] Its age is too old: `bad_judgement_age`
  > No: this epoch is always a fine age. It's the count that's wrong.

**A block in epoch 3 carries a verdict of age 1. What happens?**

- [x] Refused, `bad_judgement_age`: only epochs 3 and 2 will do
  > Yes: rule 3. A verdict's votes must come from this epoch or the last.
- [ ] Judged by λ, like any age that isn't this epoch
  > No: K's "otherwise" is meant for the epoch before. Rule 3 refuses anything older
  > first.
- [ ] Judged by epoch 1's validators
  > No: the state keeps only κ and λ. Epoch 1's validators are long gone.

**A report already in ψ's good set is put on trial again. What happens?**

- [ ] The new verdict replaces the old one
  > No: a verdict is recorded for good. Nothing replaces it.
- [ ] It's allowed, if the new verdict agrees with the old
  > No: agreeing or not, the report was judged before. That alone refuses it.
- [x] The block is refused, `already_judged`
  > Yes: rule 2. A report in the good, bad or wonky set can't be judged again.
:::

## What you have

Verdicts that are checked, not trusted: seven rules, and every disputes vector's verdicts
passed or refused as they should be, tiny in the tests and full with the bin. The
vectors this lesson's rules pass but the vector still refuses are all accusations, and
[lesson 10.5](./05-bad-culprits-and-faults.md) checks those.

Next: [10.5 Bad culprits and faults](./05-bad-culprits-and-faults.md)
