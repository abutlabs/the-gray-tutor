# Bad verdicts

**In one sentence:** a verdict that breaks any one of seven rules, such as the wrong
number of votes or a judge who never signed, sinks the whole block that carries it.

Two verdicts on tiny, and every rule holds. Break one thing, and read the name of the
error the block is refused with.

<a id="try-it"></a>

<VerdictRules />

## The idea

Your court from lessons [10.1](./01-votes-and-verdicts.md) to [10.3](./03-clearing-the-cores.md) believes every verdict it's handed. Should
it?

No. A verdict is a proof, and a proof has to be checked. A real block can carry a broken
one: the wrong number of votes, votes out of order, a judge who never signed, a report
judged long ago.

So your client goes down a list, like a clerk with a form. Is it in order? Is it new? Is
it recent? Has it the right number of votes? Are they in order? Are they signed? Does the
count mean anything? One "no" sinks the whole block, not only the verdict.

The rules lean on three words from [lesson 10.1](./01-votes-and-verdicts.md):
[*judges*](../glossary.md#judges), [*verdict age*](../glossary.md#verdict-age) and
[*vote split*](../glossary.md#vote-split).

This lesson writes down the seven rules and checks them against every disputes vector.
[Lesson 10.5](./05-bad-culprits-and-faults.md) does the same for culprits and faults.

## What the Gray Paper says

::: gray-paper 10.2 7-10

#### §10.2 Extrinsic, continued

<a id="gp-10-2-p7"></a>Verdicts $\mathbf{E}_V$ must be ordered by report hash. Offender signatures $\mathbf{E}_C$ and $\mathbf{E}_F$ must each be ordered by the validator's Ed25519 key. There may be no duplicate report hashes within the extrinsic, nor amongst any past reported hashes. Formally:

<a id="gp-10-2-p8"></a><a id="eq-10-8"></a><a id="eq-10-9"></a><a id="eq-10-10"></a>

$$
\begin{align}
&\mathbf{E}_V = \left[\left(r, a, \mathbf{j}\right) \in \mathbf{E}_V\,\wr\!\wr\,r\right] \tag{10.8} \\
&\mathbf{E}_C = \left[\left(r, f, s\right) \in \mathbf{E}_C\,\wr\!\wr\,f\right] \,,\
\mathbf{E}_F = \left[\left(r, v, f, s\right) \in \mathbf{E}_F\,\wr\!\wr\,f\right]\!\!\!\!\!\! \tag{10.9} \\
&\left\{\,r \;\middle\vert\; \left(r, a, \mathbf{j}\right) \in \mathbf{E}_V\,\right\} \mathrel{\unicode{x2AEF}} \psi_G \cup \psi_B \cup \psi_W \tag{10.10}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-xtverdicts" class="gk-wrap">$\mathbf{E}_V$</span> | E sub V | the block's verdicts: each a report's hash, an epoch, and the judges' signed votes |
| <span id="gk-sqorderuniqby">$\left[y\,\wr\!\wr\,x\right]$</span> | sorted, no repeats, by | sorted by the key on the right, each key once |
| <span id="gk-xv-reporthash">$r$</span> | r | the hash of the work-report on trial |
| <span id="gk-xv-epochindex">$a$</span> | a | a verdict's epoch: this epoch's index or the one before, saying whose validators judged |
| <span id="gk-xv-judgments" class="gk-wrap">$\mathbf{j}$</span> | bold j | a verdict's judgments: the judges' signed votes, two thirds of the judges plus one |
| <span id="gk-in">[$\in$](../symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-xtculprits" class="gk-wrap">$\mathbf{E}_C$</span> | E sub C | the block's culprits: guarantors of a bad report, each with the guarantee they signed |
| <span id="gk-xc-offenderindex">$f$</span> | f | the culprit's Ed25519 key: 32 bytes |
| <span id="gk-xc-signature">$s$</span> | s | the culprit's own guarantee signature on that report |
| <span id="gk-xtfaults" class="gk-wrap">$\mathbf{E}_F$</span> | E sub F | the block's faults: judges who voted against a verdict, each with the vote they signed |
| <span id="gk-xf-validity">$v$</span> | v | the fault's vote: ⊤ valid or ⊥ invalid |
| <span id="gk-set">$\left\{\,x\,\right\}$</span> | the set of | a set: values with no order and no repeats |
| <span id="gk-build">$\left\{ x \;\middle\vert\; y \right\}$</span> | for each, such that | built by a rule: the left-hand value, for every case the right-hand side allows (a set, or a sequence in order) |
| <span id="gk-disjoint">$\mathrel{\unicode{x2AEF}}$</span> | share nothing with | the two sides have no item in common |
| <span id="gk-goodset" class="gk-wrap">$\psi_G$</span> | psi sub G | the good set: hashes of every report a verdict found valid |
| <span id="gk-cup">$\cup$</span> | union | everything in either side |
| <span id="gk-badset" class="gk-wrap">$\psi_B$</span> | psi sub B | the bad set: hashes of every report a verdict found invalid |
| <span id="gk-wonkyset" class="gk-wrap">$\psi_W$</span> | psi sub W | the wonky set: hashes of every report whose verdict split, so nobody can tell |

</details>

→ [(10.8), (10.9), (10.10) in plain words](./gray-paper.md#ex-10-8)

<a id="gp-10-2-p9"></a>The judgments of all verdicts must be ordered by validator index and there may be no duplicates:

<a id="gp-10-2-p10"></a><a id="eq-10-11"></a>

$$
\begin{equation}
\forall \left(r, a, \mathbf{j}\right) \in \mathbf{E}_V : \mathbf{j} = \left[\left(v, i, s\right) \in \mathbf{j}\,\wr\!\wr\,i\right] \tag{10.11}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-forall">$\forall$</span> | for all | for every value: ∀c ∈ ℕ_C means for each core c |
| <span id="gk-xvj-judgeindex">$i$</span> | i | the judge's index in the validator set the verdict's epoch picks |

</details>

→ [(10.11) in plain words](./gray-paper.md#ex-10-11)

:::

Those are rules 1, 2 and 5 below. The other four are in the lines [lesson
10.1](./01-votes-and-verdicts.md#what-the-gray-paper-says) quoted: the age in (10.2), the
count and the signatures in (10.4), the split in (10.12). (10.9), the order of culprits
and faults, is [lesson 10.5](./05-bad-culprits-and-faults.md)'s. Every verdict in a block
must keep seven rules:

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

Break each rule in turn [at the top](#try-it).

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
a fault ([lesson 10.5](./05-bad-culprits-and-faults.md)'s business). One error name comes up in both lessons: in
`progress_with_bad_signatures-2` the bad signature is a culprit's, so its verdicts pass
here.

The test runs every tiny vector, and only the two full ones that tiny can't have. A full
verdict carries 683 signed votes, and checking every full vector takes about twenty
seconds (more on a slower machine), on every `npm test`. Watch it, below, checks them all
whenever you ask.

The full vectors have one case tiny can't have: in
`progress_with_verdicts_from_resized_previous_set-2`, λ has 6 validators and κ has 1,023.
Its verdict is aged this epoch, so its judges are κ. It carries 5 votes, right for λ's 6
and far short of the ⌊2 · 1,023/3⌋ + 1 = 683 that κ needs.

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
test at test/disputes.test.ts:203:1
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

```json [what goes in]
{
  "progress_with_bad_votes_count-1.json": {
    "pre_state": { "tau": 0, "kappa": "… 6 validators …" },
    "input.disputes.verdicts[0]": {
      "target": "0x0e5751c026…",
      "age": 0,
      "votes": [
        { "vote": false, "index": 0, "signature": "0xd602b170…" },
        { "vote": false, "index": 1, "signature": "0x18fd0091…" },
        { "vote": false, "index": 2, "signature": "0x584dd1ae…" },
        { "vote": false, "index": 3, "signature": "0x67c57a90…" }
      ]
    }
  },
  "progress_with_verdicts-5.json": {
    "pre_state": { "tau": 0, "kappa": "… 6 validators …" },
    "input.disputes.verdicts[0]": {
      "target": "0xe12c22d4f1…",
      "age": 0,
      "votes": [
        { "vote": false, "index": 0, "signature": "0x50046732…" },
        { "vote": true, "index": 1, "signature": "0xc84bde6d…" },
        { "vote": false, "index": 2, "signature": "0xa66dcf51…" },
        { "vote": false, "index": 3, "signature": "0x96a1146b…" },
        { "vote": false, "index": 4, "signature": "0x793cdd1d…" }
      ]
    }
  }
}
```

```ts [what it computes]
// what verdictError holds for each vector's verdict, before it reads a signature
const judges = 6; // κ, since age 0 is τ 0's epoch: |K| on tiny
const needed = 5; // ⌊2·6/3⌋ + 1: the votes every verdict carries, exactly
const wonky = 2; // ⌊6/3⌋: the one middle split that means anything
const computed = {
  "progress_with_bad_votes_count-1": {
    votes: 4, // verdict.votes.length: one short of needed
    t: 0, // votes saying "valid": never looked at, the count fails first
    error: "bad_votes_count", // 4 ≠ 5
  },
  "progress_with_verdicts-5": {
    votes: 5, // the right count, so the split is checked
    t: 1, // only index 1 says "valid"
    error: "bad_vote_split", // 1 is not 5 (good), 0 (bad) or 2 (wonky)
  },
};
```

```text [what comes out]
progress_with_bad_votes_count-1: bad_votes_count (the vector: bad_votes_count)
progress_with_verdicts-5: bad_vote_split (the vector: bad_vote_split)
```

:::

The first vector's verdict carries 4 votes where a verdict carries exactly 5: refused
by count alone, before a single signature is read. The second carries 5, of which one
says valid. 1 is not 5, 0 or 2, so the split means nothing: it is one
[lesson 10.1](./01-votes-and-verdicts.md)'s table doesn't have. Each output line shows
your rules' answer beside the vector's, so a disagreement is plain to see.

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
**One verdict in a block breaks one of the seven rules. What does your client refuse?**

- [ ] That verdict only: the rest of the block goes through
  > No: one broken verdict sinks the whole block.
- [x] The whole block
  > Yes: the block is invalid, and the error names the rule that was broken.
- [ ] Nothing: the report is filed as wonky
  > No: wonky is one exact split, a third of the judges saying valid. A broken verdict is
  > no verdict at all.

**A verdict's votes are neither all valid, nor none, nor a third of the judges. Why isn't its report wonky?**

- [ ] It is: every split between all and none is wonky
  > No: that was [lesson 10.1](./01-votes-and-verdicts.md)'s simple `outcome`. Rule 7 refuses every split but the
  > three.
- [ ] It isn't wonky, it's bad: most of the votes say invalid
  > No: bad needs zero valid votes. A majority against isn't enough.
- [x] Wonky is itself one exact split. Any other count means nothing, and the block is refused
  > Yes: `bad_vote_split`. On tiny, only 5, 0 or 2 valid votes mean anything.

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

**A block breaks two of the rules at once. Why does the order of your checks matter?**

- [ ] It doesn't: the block is refused either way
  > No: refused, yes, but under which name? Your client's answer is compared with the
  > vector's.
- [x] A vector names only one error, and your client has to name the same one
  > Yes: checked in this lesson's order, your rules name the vector's error for every
  > disputes vector.
- [ ] The cheapest check should come first, to refuse the block sooner
  > No: the order here isn't about cost. It decides which rule gets named.
:::

## What you have

Verdicts that are checked, not trusted: seven rules, and every disputes vector's verdicts
passed or refused as they should be, tiny in the tests and full with the bin. The
vectors this lesson's rules pass but the vector still refuses are all accusations, and
[lesson 10.5](./05-bad-culprits-and-faults.md) checks those.

Next: [10.5 Bad culprits and faults](./05-bad-culprits-and-faults.md)
