# Clearing the cores

A trial has one more consequence, and it's the most practical one. Remember the cores
from [Part 3](../03-work-and-reports/index.md). Each one can hold a single guaranteed work-report (ρ, in [lesson
6.2](../06-state-and-merklization/02-state-keys.md)'s table) while the validators make sure its data is available. If that report has just been judged bad, or wonky, it has no
business sitting there. Out it goes, freeing the core for honest work. This lesson
finishes what an honest block's disputes do to the state.

## What the Gray Paper says

::: gray-paper 10.2 15-16

#### §10.2 Extrinsic, continued

<a id="gp-10-2-p15"></a>We clear any availability assignments for work-reports which we judged as uncertain or invalid:

<a id="gp-10-2-p16"></a><a id="eq-10-14"></a>

$$
\begin{equation}
\forall c \in \mathbb{N}_{\mathsf{C}} : \rho^\dagger\left[c\right] = \begin{cases}
\emptyset &\!\!\!\!\text{if }
\left(\mathcal{H}\left((\rho\left[c\right]_{\mathbf{g}})_{\mathbf{r}}\right), v\right) \in \mathbf{v},
v \in \left\{\,\bot, \emptyset\,\right\} \\
\rho\left[c\right] &\!\!\!\!\text{otherwise}
\end{cases}\!\!\!\!\!\!\! \tag{10.14}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-forall">$\forall$</span> | for all | for every value: ∀c ∈ ℕ_C means for each core c |
| <span id="gk-in">[$\in$](../symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-coreindex" class="gk-wrap">$\mathbb{N}_{\mathsf{C}}$</span> | N sub C | the core indices: 0 to C − 1 |
| <span id="gk-availassignmentspostjudgment" class="gk-wrap">$\rho^\dagger$</span> | rho dagger | the pending reports midway: after disputes took the judged-bad ones out |
| <span id="gk-subb">[$\left[x\right]$](../symbols.md#sequence)</span> | at | x[i]: the item at index i, or the value at key i |
| <span id="gk-none" class="gk-wrap">$\emptyset$</span> | nothing | ∅: no value at all, like null |
| <span id="gk-blake">$\mathcal{H}\left(x\right)$</span> | H of | the Blake2b hash of what's in the brackets: 32 bytes |
| <span id="gk-availassignments" class="gk-wrap">$\rho$</span> | rho | the pending reports: for each core, the report waiting to be made available, and when it came |
| <span id="gk-aa-guarantee" class="gk-wrap">$\mathbf{g}$</span> | bold g | the guarantee a core's pending report came with: the report and its guarantors' signatures |
| <span id="gk-g-workreport" class="gk-wrap">$\mathbf{r}$</span> | r | a guarantee's work-report: 𝐠_𝐫 is the report it vouches for |
| <span id="gk-vs-valid">$v$</span> | v | a verdict's outcome: ⊤ good, ⊥ bad or ∅ wonky |
| <span id="gk-verdicts" class="gk-wrap">$\mathbf{v}$</span> | bold v | this block's verdicts boiled down: each report's hash with ⊤ good, ⊥ bad or ∅ wonky |
| <span id="gk-set">$\left\{\,x\,\right\}$</span> | the set of | a set: values with no order and no repeats |
| <span id="gk-bot">$\bot$</span> | bottom | false, the no of a yes-or-no value |

</details>

→ [(10.14) in plain words](./gray-paper.md#ex-10-14)

:::

In plain words: §11 defines **ρ** (C(10), [lesson 6.2](../06-state-and-merklization/02-state-keys.md)): for each core, either nothing or a *pending
report*: the guarantee that put it there ([lesson 4.3](../04-blocks/03-guarantees.md), report, slot and signatures) and
the slot it arrived in.

§10 then clears it, in (10.14): ρ†, ρ after the judgments, is ρ with every core emptied
whose report was judged **bad or wonky** in this block, ⊥ or ∅ in 𝐯. Which report
is it? The verdict names a report by its hash, H(ℰ(report)), the very same hash
[lesson 5.2](../05-hashing-and-signatures/02-the-extrinsic-hash.md) put in the extrinsic hash. So: hash each pending report, and compare.

A good verdict leaves its report where it is. The † is the Gray Paper's mark for a point
partway through the block, here just after the judgments: the assurances ([Part 11](../11-assurances/index.md)) make
ρ‡ from it, and the guarantees ([Part 12](../12-guarantees/index.md)) make ρ′, later in the same block.

Why does this stage come first? Think of a core as a parking space that holds one report,
and of the block as three stations the space passes through, in a fixed order:

```text
                 core 1 holds report R, waiting
  ρ     before the block      [ R ]

  ρ†    1  DISPUTES           the court names R guilty         [ empty ]  towed first
  ρ‡    2  ASSURANCES         R is available, or 5 slots up    [ empty ]  R moves on
  ρ′    3  GUARANTEES         a new report S, space is free    [ S ]      S parks
```

Each station works on what the one before left. The court goes first because a condemned
report must not get any further: were the assurances first, a report judged bad in this
very block could be called available and sent on to accumulation before the verdict took
it away. The assurances come second because they empty the spaces that finished or gave up
waiting. The guarantees come last because a new report can only park in a free space; a
core that still holds a report refuses a second one ([lesson 12.4](../12-guarantees/04-bad-guarantees.md)'s
`core_engaged`). So ρ† is made from ρ, ρ‡ from ρ†, and ρ′ from ρ‡, a chain, and the first
link is this lesson.

Two cores, two reports on trial: judge them and see ρ†.

<ClearCores />

## The cores

ρ gets its own file, since [Part 11](../11-assurances/index.md) and [Part 12](../12-guarantees/index.md) will lean on it too:

**New file** `src/cores.ts`

```ts
// The cores (GP §11): each core holds at most one guaranteed work-report while the
// validators make sure its data is available.

import { ReportGuarantee } from "./block.ts";
import type { Value } from "./codec/codec.ts";
import { option, record, seqN, u32 } from "./codec/codec.ts";
import type { Config } from "./config.ts";

/** A report on a core, waiting for its data to become available, and since which slot. */
export const PendingReport = record({
  guarantee: ReportGuarantee, // the guarantee that put it there, report and all
  registered_slot: u32,
});
export type PendingReport = Value<typeof PendingReport>;

/** ρ, C(10): one place per core, each holding a pending report or nothing. */
export function PendingReports(config: Config) {
  return seqN(option(PendingReport), config.core_count);
}
```

`seqN(option(…), C)`: exactly one place per core, no length in front, each place a
pending report or nothing (lessons [4.5](../04-blocks/05-maybe-and-exactly-n.md) and [4.6](../04-blocks/06-the-header.md) had both tools).

## The tests

**Replace in** `test/disputes.test.ts`

```ts
/** A disputes test vector: the parts of it this lesson uses. */
type DisputesVector = {
  input: { disputes: unknown };
  pre_state: {
    psi: unknown; // ψ: past judgements: good, bad and wonky report hashes, and the offenders
    tau: number; // τ: the time: the slot of the most recent block
    kappa: unknown[]; // κ: the validators now: the judges of a verdict from this epoch
    lambda: unknown[]; // λ: last epoch's validators: the judges of a verdict from the last
    rho: unknown; // ρ: the cores: the report each holds while its data becomes available
  };
  post_state: {
    psi: unknown; // ψ′: past judgements after the block: each verdict's report filed
    rho: unknown; // ρ†: the cores after the judgements: bad and wonky reports gone
  };
  output: { err?: string; ok?: { offenders_mark: string[] } };
};
```

**Add to** `test/disputes.test.ts`

```ts
import { clearJudged } from "../src/disputes.ts";
import { PendingReports } from "../src/cores.ts";
import type { PendingReport } from "../src/cores.ts";
import { encode } from "../src/codec/codec.ts";
import { blake2b256 } from "../src/hash.ts";
import { WorkReport } from "../src/work.ts";
import type { Bytes } from "../src/bytes.ts";

test("ρ†: a report judged bad or wonky is taken off its core", () => {
  let cleared = 0;
  for (const config of [TINY, FULL]) {
    for (const { name, vector } of acceptedVectors(config)) {
      const judged = judgedVerdicts(config, vector).map(({ verdict, keys }) => ({
        target: verdict.target,
        outcome: outcome(verdict, keys.length),
      }));
      const cores = PendingReports(config);
      const before: (PendingReport | null)[] = cores.fromJson(vector.pre_state.rho);
      const after: (PendingReport | null)[] = clearJudged(before, judged);
      const expected: (PendingReport | null)[] = cores.fromJson(vector.post_state.rho);
      assert.deepEqual(after, expected, name);
      cleared += before.filter((p) => p !== null).length - after.filter((p) => p !== null).length;
    }
  }
  assert.equal(cleared, 2); // one core on tiny, one on full
});

test("ρ†: wonky clears a core too, and good leaves it be", () => {
  const vector = vectorJson("stf/disputes/tiny/progress_invalidates_avail_assignments-1.json");
  const cores: (PendingReport | null)[] = PendingReports(TINY).fromJson(
    (vector as DisputesVector).pre_state.rho,
  );
  const pending: PendingReport = cores[0] as PendingReport; // core 0 holds a report
  const target: Bytes = blake2b256(encode(WorkReport, pending.guarantee.report));
  const afterWonky: PendingReport | null = clearJudged(cores, [{ target, outcome: "wonky" }])[0];
  assert.equal(afterWonky, null);
  const afterGood: PendingReport | null = clearJudged(cores, [{ target, outcome: "good" }])[0];
  assert.equal(afterGood, pending);
});
```

The vectors only ever clear a core over a *bad* verdict, one core on tiny and one of the
341 on full. So the second test borrows a real pending report from them and judges it
by hand, wonky and then good, to pin down the other two cases.

A stub that takes nothing off:

**Add to** `src/disputes.ts`

```ts
import type { PendingReport } from "./cores.ts";

export function clearJudged(
  cores: (PendingReport | null)[],
  judged: { target: Bytes; outcome: Outcome }[],
): (PendingReport | null)[] {
  return cores;
}
```

**Run, expect it to fail**

```sh
npm test
```

```text
...
✖ ρ†: a report judged bad or wonky is taken off its core (35.0ms)
✖ ρ†: wonky clears a core too, and good leaves it be (13.8ms)
...
ℹ tests 101
ℹ suites 0
ℹ pass 99
ℹ fail 2
...
test at test/disputes.test.ts:147:1
✖ ρ†: a report judged bad or wonky is taken off its core (35.0ms)
  AssertionError [ERR_ASSERTION]: stf/disputes/tiny/progress_invalidates_avail_assignments-1.json
  + actual - expected
  ... Skipped lines

    [
  -   null,
...
```

Red, both tests. Read the first diff: the vector expects core 0 empty (`- null`), and your
stub left its pending report there.

## The code

**Replace in** `src/disputes.ts`

```ts
import { encode } from "./codec/codec.ts";
import type { PendingReport } from "./cores.ts";
import { blake2b256 } from "./hash.ts";
import { WorkReport } from "./work.ts";

/** ρ† (GP §10): take every report judged bad or wonky off its core. */
export function clearJudged(
  cores: (PendingReport | null)[],
  judged: { target: Bytes; outcome: Outcome }[],
): (PendingReport | null)[] {
  const condemned = new Set(judged.filter((j) => j.outcome !== "good").map((j) => toHex(j.target)));
  return cores.map((pending) => {
    if (pending === null) return null;
    const report = blake2b256(encode(WorkReport, pending.guarantee.report)); // as in lesson 5.2
    return condemned.has(toHex(report)) ? null : pending;
  });
}
```

A `Set` of the condemned reports' hashes, as hex, then one pass over the cores.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ ρ†: a report judged bad or wonky is taken off its core (184.6ms)
✔ ρ†: wonky clears a core too, and good leaves it be (0.5ms)
...
ℹ tests 101
ℹ suites 0
ℹ pass 101
ℹ fail 0
...
reported 101 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791731896437
...
```

## Watch it

**New file** `bin/cores.ts`

```ts
// Shows which cores lose their pending report to the verdicts of a disputes test vector.
// Usage: npm run cores <vector.json>, such as the vector that clears a core:
//   npm run cores ../vectors/stf/disputes/tiny/progress_invalidates_avail_assignments-1.json

import { readFileSync } from "node:fs";
import { DisputesExtrinsic } from "../src/block.ts";
import { toHex } from "../src/bytes.ts";
import { encode } from "../src/codec/codec.ts";
import { FULL, TINY } from "../src/config.ts";
import { PendingReports } from "../src/cores.ts";
import { clearJudged, judges, outcome } from "../src/disputes.ts";
import { blake2b256 } from "../src/hash.ts";
import { Run } from "../src/obs.ts";
import { ValidatorKey } from "../src/state.ts";
import { WorkReport } from "../src/work.ts";

const [file] = process.argv.slice(2);
const config = file.includes("/full/") ? FULL : TINY;
const { input, pre_state } = JSON.parse(readFileSync(file, "utf8"));
const keys = (list: unknown[]) => list.map((key) => ValidatorKey.fromJson(key));
const [active, previous] = [keys(pre_state.kappa), keys(pre_state.lambda)];
const judged = DisputesExtrinsic.fromJson(input.disputes).verdicts.map((verdict) => ({
  target: verdict.target,
  outcome: outcome(verdict, judges(config, pre_state.tau, verdict.age, active, previous).length),
}));
const before = PendingReports(config).fromJson(pre_state.rho);
const after = clearJudged(before, judged);
const run = new Run("cores");
let kept = 0;
before.forEach((pending, core) => {
  if (pending === null) return;
  if (after[core] !== null) {
    kept++;
    return;
  }
  const report = blake2b256(encode(WorkReport, pending.guarantee.report));
  const verdict = judged.find((j) => toHex(j.target) === toHex(report))?.outcome;
  console.log(`core ${core}: its report ${toHex(report).slice(0, 10)}… was judged ${verdict}`);
  run.event("cleared", { core, report, verdict });
});
console.log(`${kept} of ${config.core_count} cores keep their reports`);
run.event("kept", { kept, cores: config.core_count });
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

**What flows through it.** This vector has a report pending on *both* tiny cores
(`pre_state.rho`) and both on trial in `input.disputes`:

::: code-group

```json [what goes in]
{
  "verdicts": [
    { "target": "0xa78b526a…", "age": 0, "votes": [ … 5 of 5 "vote": true … ] },
    { "target": "0xf9076864…", "age": 0, "votes": [ … 0 of 5 "vote": true … ] }
  ],
  "rho": [
    { "guarantee": { "report": { … core 0's pending report … } }, "registered_slot": 42 },
    { "guarantee": { "report": { … core 1's pending report … } }, "registered_slot": 42 }
  ]
}
```

```ts [what it computes]
// bin/cores.ts's values: each verdict judged, then rho with the condemned cleared
const judged = [
  { target: "0xa78b526a…", outcome: "good" }, // 5 of 5 say valid
  { target: "0xf9076864…", outcome: "bad" }, // 0 of 5 say valid
];
const computed = {
  cleared: [0], // core 0's pending report hashes to 0xf9076864…: judged bad, it leaves
  kept: 1, // core 1's hashes to 0xa78b526a…: judged good, it stays
};
```

```text [what comes out]
core 0: its report 0xf9076864… was judged bad
1 of 2 cores keep their reports
```

:::

The link between the tabs is a hash: a verdict's `target` names a report, and `rho`
holds whole reports, so the program hashes each pending report
(`blake2b256(encode(WorkReport, …))`) and looks for that hash among the condemned.
Core 0's report hashes to the bad verdict's target; core 1's to the good one's.

**Run**

```sh
npm pkg set scripts.cores="node bin/cores.ts"
npm pkg set scripts.cores-invalidated="node bin/cores.ts ../vectors/stf/disputes/tiny/progress_invalidates_avail_assignments-1.json"
npm run cores-invalidated
```

```text
core 0: its report 0xf9076864… was judged bad
1 of 2 cores keep their reports
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=cores-1791731900567
```

Both cores' reports were on trial in this block. Core 0's was judged bad, so it leaves;
core 1's was judged good, so it stays. Run the `full` version of the same vector: 340 of
341 cores keep their reports. The *Cores* panel, on the **4 · Checks** dashboard, shows
which core was emptied, and why.

![Cores panel](./images/03-cores.png)

<details>
<summary>lasair: two roads to the same set, in <code>conformance/disputes.ml</code></summary>

```ocaml
        let newly lst pre = List.filter (fun t ->
          not (List.exists (Bytes.equal t) pre)) lst in
        let clear_targets =
          newly psi'.Disputes_stf.bad pre_bad
          @ newly psi'.Disputes_stf.wonky pre_wonky in
```

lasair works out which reports to clear differently: it compares ψ′'s bad and wonky sets
with ψ's, and takes whatever is *new*. Your client asks the block's verdicts directly.
Both give exactly this block's condemned reports; it's worth seeing that a rule can be
read more than one way, and checking that the readings agree.

</details>

## Check your understanding

::: check
**Which verdicts take a report off its core?**

- [ ] Only bad ones
  > No: wonky too. Nobody can tell if the report is right, so it has no business
  > waiting on a core.
- [x] Bad or wonky
  > Yes: ρ† empties every core whose report was judged bad or wonky in this block.
- [ ] Any verdict: a challenged report is suspect
  > No: a good verdict leaves its report where it is.

**A verdict names its report only by hash. How does your client find the core that holds it?**

- [ ] The verdict carries the core's index
  > No: a verdict is a report hash, an age and votes. No core.
- [x] It hashes each pending report, H(ℰ(report)), and compares
  > Yes: the same hash [lesson 5.2](../05-hashing-and-signatures/02-the-extrinsic-hash.md) put in the extrinsic hash. A match empties that core.
- [ ] It looks the hash up in ψ's bad set
  > No: ψ's sets hold report hashes, not cores. They say what was judged, not where it
  > sits.

**In `progress_invalidates_avail_assignments-1` on tiny, core 0's report is judged bad and core 1's good. What do the cores hold after?**

- [x] Core 0 nothing, core 1 its report
  > Yes: "1 of 2 cores keep their reports". The bad one leaves, the good one stays.
- [ ] Nothing on either: a trial clears the core whatever the outcome
  > No: only bad and wonky clear it. A report judged good stays.
- [ ] Both reports: clearing waits for the assurances
  > No: the disputes clear the cores first, ρ†. The assurances then work from what's
  > left.

**In one block, in what order do the cores change?**

- [ ] Guarantees, then assurances, then disputes
  > No: the guarantees come last, so they can use the cores the other two have just
  > freed.
- [ ] Assurances, then disputes, then guarantees
  > No: then a report judged bad in this block could still be made available first.
- [x] Disputes (ρ†), then assurances (ρ‡), then guarantees (ρ′)
  > Yes: condemned reports leave first, so they can't be called available; then available
  > and timed-out ones leave; then new reports take the free cores. Each stage works on
  > what the one before left.
:::

## What you have

Your client holds the whole trial of an honest block. It checks every vote, files the
verdicts, names the offenders with real evidence, announces them in the header, and
clears the condemned reports off the cores. But it believes every verdict it's handed.
[Lesson 10.4](./04-bad-verdicts.md) teaches it to refuse a broken one.

Next: [10.4 Bad verdicts](./04-bad-verdicts.md)
