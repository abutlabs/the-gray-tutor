# Bad reports

[Lesson 12.4](./04-bad-guarantees.md) checked who vouched for each report, and when. Now the report itself: a
sensible size? Built against a block the chain really had, as it really was? Leaning on
work that exists, naming real services with the right code? New, or a package the chain
has seen? With these rules and 12.4's, your client agrees with every reports vector.

## New words

- **Report anchor.** The recent block a report was built against: its hash, slot, state
  root and belt root, all in the report's context. *Example:* a report anchored on a
  block the chain doesn't remember is refused.
- **Segment-root lookup.** A report's list of the work-packages whose exported segments it
  imported, each with the root of those segments. *Example:* "package A, segments root R".
- **Pipeline.** Every package the chain is already dealing with: accumulated recently,
  waiting in the ready queue, or pending on a core. The vectors hand these over as
  `known_packages`. *Example:* a package in the pipeline can't be reported again.

All three are in the [glossary](../glossary.md).

## What the Gray Paper says

§11, *Contextual Validity of Reports*, and the limits of §11's *Work Report*. Ten rules
making fourteen checks, in two groups.

**The report on its own:**

1. One to sixteen results (I = 16). (`missing_work_results`)
2. At most eight dependencies, prerequisites and lookups together (J = 8).
   (`too_many_dependencies`)
3. Its outputs, the authorizer's and every result's, fit in 48 KiB (W_R).
   (`work_report_too_big`)
4. Its results ask for at most 10,000,000 accumulation gas in all (G_A).
   (`work_report_gas_too_high`)

**The report against the chain:**

5. A new package: not twice in this block, not in the recent blocks' reported packages,
   not in the pipeline. (`duplicate_package`)
6. Its anchor is one of the recent blocks (β_H†, [Part 9](../09-recent-history/index.md)'s history after this block's
   first step). (`anchor_not_recent`)
7. And matches it: the same state root (`bad_state_root`), belt root
   (`bad_beefy_mmr_root`) and slot (`bad_anchor_slot`).
8. Its prerequisites are packages this block or a recent one reported.
   (`dependency_missing`)
9. Every lookup names such a package, with that package's real segments root.
   (`segment_root_lookup_invalid`)
10. Every result names a service that exists (`bad_service_id`), with that service's
    code hash (`bad_code_hash`), and asks for at least the service's minimum gas
    (`service_item_gas_too_low`).

<ReportAnchor />

Rule 8 and the first half of rule 9 are one rule in the Gray Paper: every prerequisite and
every looked-up package must be known. The second half, the right segments root, is a
rule of its own, the equation after it. The vectors give a looked-up package that isn't
known its own name too, `segment_root_lookup_invalid`, so your client checks rules 8 and 9
separately.

Two more rules this lesson leaves out: the report's *lookup* anchor must be at most L slots
old, and must be one of the last L blocks' headers. Checking the second needs the header
chain itself, which no state holds, and no vector tests either. They wait in
[HARDENING.md](https://github.com/abutlabs/the-gray-tutor/blob/main/HARDENING.md).

## The tests

The vectors give the recent blocks, the services and the pipeline too:

**Replace in** `test/guarantors.test.ts`

```ts
/** A reports test vector: the parts of it this lesson uses. */
type ReportsVector = {
  input: { guarantees: unknown[]; slot: number; known_packages: string[] };
  pre_state: {
    curr_validators: unknown[];
    prev_validators: unknown[];
    entropy: string[];
    offenders: string[];
    avail_assignments: unknown;
    auth_pools: string[][];
    recent_blocks: { history: unknown[] };
    accounts: { id: number; data: { service: { code_hash: string; min_item_gas: number } } }[];
  };
  post_state: { avail_assignments: unknown };
  output: { err?: string; ok?: { reporters: string[]; reported: unknown[] } };
};
```

**Add to** `test/guarantors.test.ts`

```ts
import { reportError } from "../src/guarantors.ts";
import { RecentBlock } from "../src/history.ts";

/** What lesson 12.5's rules say of reports vector `name`: null (they pass) or the rule broken. */
function reportVerdict(name: string) {
  const { input, pre_state } = vectorJson(name) as ReportsVector;
  const reports = GuaranteesExtrinsic.fromJson(input.guarantees).map((g) => g.report);
  const history = pre_state.recent_blocks.history.map((b) => RecentBlock.fromJson(b));
  const services = new Map(pre_state.accounts.map(({ id, data: { service } }) => [id, {
    code_hash: fromHex(service.code_hash),
    min_item_gas: BigInt(service.min_item_gas),
  }]));
  return reportError(reports, history, new Set(input.known_packages), services);
}

test("a report anchored on a block nobody remembers is refused", () => {
  const broken: string | null = reportVerdict("stf/reports/tiny/anchor_not_recent-1.json");
  assert.equal(broken, "anchor_not_recent");
});

for (const config of [TINY, FULL]) {
  for (const name of vectorFiles(`stf/reports/${config.name}`)) {
    test(`${name}: accepted or refused, as the vector says`, () => {
      const { err } = (vectorJson(name) as ReportsVector).output;
      const broken: string | null = guaranteeVerdict(config, name) ?? reportVerdict(name);
      const expected: string | null = err ?? null;
      assert.equal(broken, expected);
    });
  }
}
```

The last test is the whole reports step: [lesson 12.4](./04-bad-guarantees.md)'s rules first, then these. Every
reports vector, tiny and full, must come out exactly as the vector says, accepted or
refused for the very same reason. The services come straight from the JSON: a report
only needs a service's code hash and minimum gas, and [Part 14](../14-services/index.md) builds the full service
account later.

A stub that passes every report, with the four limits and `ServiceNeeds` already in
place:

**Add to** `src/guarantors.ts`

```ts
import type { WorkDigest } from "./work.ts";
import type { RecentBlock } from "./history.ts";

/** I: the most work items (so digests) a report may carry. */
const MAX_DIGESTS = 16;
/** J: the most dependencies (prerequisites and segment-root lookups) a report may have. */
const MAX_DEPENDENCIES = 8;
/** W_R: the most bytes a report's outputs (its digests' and its authorizer's) may take. */
const MAX_OUTPUT = 48 * 1024;
/** G_A: the most accumulation gas a report may ask for, all its digests together. */
const REPORT_GAS = 10_000_000n;

/** What a report needs of a service: its code hash, and the least gas it accumulates on. */
export type ServiceNeeds = { code_hash: Bytes; min_item_gas: bigint };

export function reportError(
  reports: WorkReport[], // 𝐈
  history: RecentBlock[],
  known: Set<string>,
  services: Map<number, ServiceNeeds>,
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
✖ a report anchored on a block nobody remembers is refused (1.3ms)
...
ℹ tests 386
ℹ suites 0
ℹ pass 353
ℹ fail 33
...
test at test/guarantors.test.ts:209:1
✖ a report anchored on a block nobody remembers is refused (1.3ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected

  + null
  - 'anchor_not_recent'
...
```

Thirty-three reds this time: the anchor test, and the sixteen vectors at each size whose
guarantees are fine but whose reports aren't. [Lesson 12.4](./04-bad-guarantees.md)'s refusals are green
already, because the full check asks the guarantee rules first.

## The code

**Replace in** `src/guarantors.ts`

```ts
/**
 * Are a block's reports valid (GP §11)? The first rule they break, under the test vectors'
 * name for it, or null if they keep every rule. `history` is the recent blocks (β_H†),
 * `known` the packages already in the pipeline (accumulated, waiting, or on a core: the
 * vectors' `known_packages`), and `services` what each service needs, by id.
 */
export function reportError(
  reports: WorkReport[], // 𝐈
  history: RecentBlock[],
  known: Set<string>,
  services: Map<number, ServiceNeeds>,
): string | null {
  const incoming = new Map(reports.map((r) => [toHex(r.package_spec.hash), r])); // 𝐩
  const reported = new Map(history.flatMap((b) => b.reported.map((p) => [toHex(p.hash), p])));
  const rootOf = (hash: Bytes) =>
    incoming.get(toHex(hash))?.package_spec.exports_root ?? reported.get(toHex(hash))?.exports_root;
  const anchor = (r: WorkReport) =>
    history.find((b) => toHex(b.header_hash) === toHex(r.context.anchor));
  const digests = reports.flatMap((r) => r.results);
  const outputOf = (d: WorkDigest) => ("ok" in d.result ? d.result.ok.length : 0);
  const output = (r: WorkReport) =>
    r.auth_output.length + r.results.reduce((n, d) => n + outputOf(d), 0);
  // the report on its own
  const someWork = (r: WorkReport) => r.results.length >= 1 && r.results.length <= MAX_DIGESTS;
  const fewDependencies = (r: WorkReport) =>
    r.context.prerequisites.length + r.segment_root_lookup.length <= MAX_DEPENDENCIES;
  const gas = (r: WorkReport) => r.results.reduce((n, d) => n + d.accumulate_gas, 0n);
  // the report against the chain
  const fresh = (hash: string) => !reported.has(hash) && !known.has(hash);
  const anchored = (r: WorkReport) => anchor(r) !== undefined;
  const sameRoot = (r: WorkReport) => toHex(anchor(r)!.state_root) === toHex(r.context.state_root);
  const sameBelt = (r: WorkReport) => toHex(anchor(r)!.beefy_root) === toHex(r.context.beefy_root);
  const sameSlot = (r: WorkReport) => anchor(r)!.slot === r.context.anchor_slot;
  const prerequisitesKnown = (r: WorkReport) =>
    r.context.prerequisites.every((p) => rootOf(p) !== undefined);
  const lookupsRight = (r: WorkReport) =>
    r.segment_root_lookup.every((l) => {
      const root = rootOf(l.work_package_hash);
      return root !== undefined && toHex(root) === toHex(l.segment_tree_root);
    });
  if (!reports.every(someWork)) return "missing_work_results";
  if (!reports.every(fewDependencies)) return "too_many_dependencies";
  if (!reports.every((r) => output(r) <= MAX_OUTPUT)) return "work_report_too_big";
  if (!reports.every((r) => gas(r) <= REPORT_GAS)) return "work_report_gas_too_high";
  if (incoming.size < reports.length || ![...incoming.keys()].every(fresh)) {
    return "duplicate_package";
  }
  if (!reports.every(anchored)) return "anchor_not_recent";
  if (!reports.every(sameRoot)) return "bad_state_root";
  if (!reports.every(sameBelt)) return "bad_beefy_mmr_root";
  if (!reports.every(sameSlot)) return "bad_anchor_slot";
  if (!reports.every(prerequisitesKnown)) return "dependency_missing";
  if (!reports.every(lookupsRight)) return "segment_root_lookup_invalid";
  if (!digests.every((d) => services.has(d.service_id))) return "bad_service_id";
  const service = (d: WorkDigest) => services.get(d.service_id)!;
  if (!digests.every((d) => toHex(service(d).code_hash) === toHex(d.code_hash))) {
    return "bad_code_hash";
  }
  if (!digests.every((d) => d.accumulate_gas >= service(d).min_item_gas)) {
    return "service_item_gas_too_low";
  }
  return null;
}
```

Fourteen checks, in the order above. `rootOf` looks a package up first in this block, then in
the recent blocks, and that one helper serves rules 8 and 9: a prerequisite needs any root,
a lookup the right one. The four limits get names, so the numbers say what they are.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ the reported packages: each one's hash and exports root, sorted by hash (1169.6ms)
...
✔ a report anchored on a block nobody remembers is refused (0.6ms)
...
ℹ tests 386
ℹ suites 0
ℹ pass 386
ℹ fail 0
...
reported 386 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791734631104
...
```

## Watch it

`bin/check-guarantees.ts` checks both lessons' rules now, and mentions the vector only
when the two disagree:

**Rewrite** `bin/check-guarantees.ts`

```ts
// Checks the guarantees and reports of every reports test vector of one size against the
// rules (the guarantees' first, then the reports'), and shows each verdict next to the
// vector's: accepted, or the first rule broken.
// Usage: npm run check-guarantees [tiny or full], tiny if not given

import { readdirSync, readFileSync } from "node:fs";
import { GuaranteesExtrinsic } from "../src/block.ts";
import { fromHex } from "../src/bytes.ts";
import { FULL, TINY } from "../src/config.ts";
import { PendingReports } from "../src/cores.ts";
import type { ServiceNeeds } from "../src/guarantors.ts";
import { guaranteeError, guarantorAssignments, reportError } from "../src/guarantors.ts";
import { RecentBlock } from "../src/history.ts";
import { Run } from "../src/obs.ts";
import { ValidatorKey } from "../src/state.ts";

type Service = { code_hash: string; min_item_gas: number };

const config = process.argv[2] === "full" ? FULL : TINY;
const dir = `../vectors/stf/reports/${config.name}`;
const keys = (list: unknown[]) => list.map((key) => ValidatorKey.fromJson(key));
const run = new Run("guarantee-check");
for (const file of readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
  const { input, pre_state: pre, output } = JSON.parse(readFileSync(`${dir}/${file}`, "utf8"));
  const assignments = guarantorAssignments(config, input.slot, pre.entropy.map(fromHex),
    keys(pre.curr_validators), keys(pre.prev_validators), pre.offenders.map(fromHex));
  const guarantees = GuaranteesExtrinsic.fromJson(input.guarantees);
  const cores = PendingReports(config).fromJson(pre.avail_assignments);
  const pools = pre.auth_pools.map((pool: string[]) => pool.map(fromHex));
  const history = pre.recent_blocks.history.map((b: unknown) => RecentBlock.fromJson(b));
  const services = new Map<number, ServiceNeeds>();
  for (const { id, data } of pre.accounts as { id: number; data: { service: Service } }[]) {
    const { code_hash, min_item_gas } = data.service;
    services.set(id, { code_hash: fromHex(code_hash), min_item_gas: BigInt(min_item_gas) });
  }
  const error =
    guaranteeError(config, guarantees, input.slot, assignments, cores, pools,
      pre.curr_validators.length) ??
    reportError(guarantees.map((g) => g.report), history, new Set(input.known_packages), services);
  const ours = error ?? "accepted";
  const theirs = output.err ?? "accepted";
  const name = file.replace(".json", "");
  console.log(`${name}: ${ours}${ours === theirs ? "" : ` (the vector says ${theirs})`}`);
  run.event("vector", { name, ours, theirs, agree: ours === theirs });
}
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

**Run**

```sh
npm run check-guarantees
```

```text
anchor_not_recent-1: anchor_not_recent
bad_anchor_slot-1: bad_anchor_slot
bad_beefy_mmr-1: bad_beefy_mmr_root
bad_code_hash-1: bad_code_hash
bad_core_index-1: bad_core_index
bad_erasure_shards-1: bad_erasure_shards
bad_service_id-1: bad_service_id
bad_signature-1: bad_signature
bad_state_root-1: bad_state_root
bad_validator_index-1: bad_validator_index
banned_validator_guarantee-1: banned_validator
big_work_report_output-1: accepted
core_engaged-1: core_engaged
...
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=guarantee-check-1791734639549
```

Forty-four vectors, and not one "the vector says": your client's reports step agrees with
all of them. `npm run check-guarantees full` says the same of the full ones. The
*Guarantee checks* panel, on **4 · Checks**, keeps the list.

![Guarantee checks panel](./images/05-guarantee-checks.png)

## The scoreboard

Every rule the reports vectors check, your client checks. Run them whole: the block
refused for the vector's reason, or accepted, and then ρ′ with the new reports on their
cores, and the output, the reporters 𝐆 and the reported packages. The rest of a reports
vector's state is only read, or so it looks:

**Add to** `test/families.ts`

```ts
import { GuaranteesExtrinsic } from "../src/block.ts";
import { placeReports, reportedPackages } from "../src/cores.ts";
import { assignmentFor, guaranteeError, guarantorAssignments, reportError, reporters, signerKeys } from "../src/guarantors.ts";
import { RecentBlock } from "../src/history.ts";

type ReportsInput = { guarantees: unknown[]; slot: number; known_packages: string[] };
type ReportsState = {
  curr_validators: unknown[];
  prev_validators: unknown[];
  entropy: string[];
  offenders: string[];
  avail_assignments: unknown;
  auth_pools: string[][];
  recent_blocks: { history: unknown[] };
  accounts: { id: number; data: { service: { code_hash: string; min_item_gas: number } } }[];
};

/** A reports vector: ρ′, the reporters and the reported packages, or the rule broken. */
function checkReports(name: string) {
  const vector = vectorJson(name) as StfVector<ReportsInput, ReportsState>;
  const config = configOf(name);
  const { input, pre_state: pre } = vector;
  const offenders = pre.offenders.map(fromHex);
  const [active, previous] = [keys(pre.curr_validators), keys(pre.prev_validators)];
  const entropy = pre.entropy.map(fromHex);
  const assignments =
    guarantorAssignments(config, input.slot, entropy, active, previous, offenders);
  const guarantees = GuaranteesExtrinsic.fromJson(input.guarantees);
  const cores = PendingReports(config).fromJson(pre.avail_assignments);
  const pools = pre.auth_pools.map((pool) => pool.map(fromHex));
  const reports = guarantees.map((g) => g.report);
  const history = pre.recent_blocks.history.map((b) => RecentBlock.fromJson(b));
  const services = new Map(pre.accounts.map(({ id, data: { service } }) => [id, {
    code_hash: fromHex(service.code_hash),
    min_item_gas: BigInt(service.min_item_gas),
  }]));
  const known = new Set(input.known_packages);
  const count = active.length;
  const error = guaranteeError(config, guarantees, input.slot, assignments, cores, pools, count) ??
    reportError(reports, history, known, services);
  sameError(error, vector);
  if (error) return unchanged(vector, []);
  const after = placeReports(cores, guarantees, input.slot);
  const expected = PendingReports(config).fromJson(vector.post_state.avail_assignments);
  assert.deepEqual(after, expected, "avail_assignments differs");
  const signers = guarantees.flatMap((g) =>
    signerKeys(g, assignmentFor(config, input.slot, g.slot, assignments).keys));
  const ok = vector.output?.ok as { reporters: string[]; reported: unknown[] };
  assert.deepEqual(reporters(signers).map(toHex), ok.reporters, "reporters differs");
  const reported = reportedPackages(guarantees).map((p) => ({
    work_package_hash: toHex(p.hash),
    segment_tree_root: toHex(p.exports_root),
  }));
  assert.deepEqual(reported, ok.reported, "reported differs");
  unchanged(vector, ["avail_assignments"]);
}
```

**Replace in** `test/families.ts`

```ts
/** Every family your client runs so far. */
export const FAMILIES: Family[] = [
  { folders: ["codec/tiny", "codec/full"], check: checkCodec },
  { folders: ["trie"], check: checkTrie },
  { folders: ["shuffle"], check: checkShuffle },
  { folders: ["stf/safrole/tiny", "stf/safrole/full"], check: checkSafrole },
  { folders: ["stf/history/tiny", "stf/history/full"], check: checkHistory },
  { folders: ["stf/disputes/tiny", "stf/disputes/full"], check: checkDisputes },
  { folders: ["stf/assurances/tiny", "stf/assurances/full"], check: checkAssurances },
  { folders: ["stf/reports/tiny", "stf/reports/full"], check: checkReports },
];
```

One of the refusals the milestone counts, a guarantee for a core that does not exist:

::: code-group

```json [what goes in]
{
  "vector": "vectors/stf/reports/tiny/bad_core_index-1.json",
  "input": {
    "slot": 14,
    "guarantees": [
      {
        "slot": 14,
        "report": {
          "core_index": 3,
          "package_spec.hash": "0x63c03371b9dad9f1c60473ec0326c970984e9c90c0b5ed90eba6ada471ba4d86"
        },
        "signatures": [
          {
            "validator_index": 0,
            "signature": "0xed25d1700e…"
          },
          {
            "validator_index": 2,
            "signature": "0xd979bfe3b6…"
          },
          {
            "validator_index": 3,
            "signature": "0x434cf33017…"
          }
        ]
      }
    ]
  },
  "output": {
    "err": "bad_core_index"
  }
}
```

```text [console]
stf/reports              62 of 92
230 of 1,428 vectors pass.
```

:::

*Run whole* means every rule on a report is checked, and a vector that should be refused only counts when it is refused for its own reason: here core 3 on tiny, which has only cores 0 and 1. The row's `62 of 92` is the 62 refusals; the other 30 vectors are accepted, and wait for the statistics.

**Run**

```sh
npm run typecheck
npm run scoreboard
```

```text
...
The official test vectors, each run whole by your client:

codec                    30 of 30  ✔
erasure                  not run yet (12)
shuffle                    1 of 1  ✔
stf/accumulate           not run yet (126)
stf/assurances           22 of 22  ✔
stf/authorizations       not run yet (6)
stf/disputes             60 of 60  ✔
stf/history                8 of 8  ✔
stf/preimages            not run yet (16)
stf/reports              62 of 92
    ✘ stf/reports/full/big_work_report_output-1.json: cores_statistics changed
    ✘ stf/reports/full/different_core_same_guarantors-1.json: cores_statistics changed
    ✘ stf/reports/full/high_work_report_gas-1.json: cores_statistics changed
    … and 27 more
stf/safrole              46 of 46  ✔
stf/statistics           not run yet (8)
traces/fallback          not run yet (100)
traces/fuzzy             not run yet (200)
traces/fuzzy_light       not run yet (200)
traces/preimages         not run yet (100)
traces/preimages_light   not run yet (100)
traces/safrole           not run yet (100)
traces/storage           not run yet (100)
traces/storage_light     not run yet (100)
trie                       1 of 1  ✔

230 of 1,428 vectors pass.
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=scoreboard-1791939267270
```

62 of 92: every refused block, and not one accepted block. The board says why. A block
that seats reports also counts work for the statistics, each core's and each service's,
and the vector's state holds those counts too: `cores_statistics changed`. Your client
doesn't keep statistics yet. Every part it does make matches; the accepted 30 cross the
line in [lesson 18.2](../18-statistics/02-what-cores-and-services-did.md), when it does.

> [!TIP] Milestone
> **Every bad report refused.** All 62 refusals in the reports vectors, tiny
> and full, for the vector's own reason. The accepted 30 wait for the statistics.

<details>
<summary>lasair: a lookup, in <code>conformance/reports_stf.ml</code></summary>

```ocaml
                (match find_exports_root entry.work_package_hash with
                 | None -> true  (* Not in history = in current batch, can't verify yet *)
                 | Some exports_root -> Bytes.equal entry.segment_tree_root exports_root)
```

Rule 9 in lasair's reports harness. For a looked-up package from the recent blocks, it
checks the segments root, just like yours. For one reported in this same block, it says
"can't verify yet" and lets it through. But the root is right there, in that report's
`package_spec`, and the Gray Paper checks it: its lookup map is this block's packages and
the recent ones'. Your `rootOf` checks both. No vector has a wrong root for a package in
the same block, which is how a gap like this can sit unnoticed.

</details>

## Check your understanding

::: check
**A report's anchor is one of the recent blocks, but its state root differs from that block's. What happens?**

- [ ] Accepted: the anchor is recent, and that's what matters
  > No: it must match the block too, as the block really was.
- [x] Refused, `bad_state_root`
  > Yes: rule 7. Same state root, belt root and slot as the recent block it names.
- [ ] Refused, `anchor_not_recent`
  > No: the anchor is found among the recent blocks. It's its details that are wrong.

**A package was reported two blocks ago. A guarantee reports it again. What happens?**

- [ ] Accepted, if new guarantors sign it
  > No: who signs doesn't matter. The package isn't new.
- [ ] Accepted, once the first report has been accumulated
  > No: a package accumulated recently is in the pipeline, and refused too.
- [x] Refused, `duplicate_package`
  > Yes: rule 5. It's in the recent blocks' reported packages, kept for exactly this
  > ([lesson 9.2](../09-recent-history/02-recent-blocks.md)).

**A report looks up segments from package A, reported in this same block. Is the lookup's segments root checked?**

- [x] Yes: it must match A's exports root, from A's report in this block
  > Yes: the Gray Paper's lookup map is this block's packages and the recent ones'.
  > `rootOf` looks here first.
- [ ] No: a package in the same block can't be checked yet
  > No: its root is right there, in that report's `package_spec`. That's the gap
  > lasair's harness leaves.
- [ ] Refused: a lookup may only name a package from an earlier block
  > No: this block's packages count, for prerequisites and lookups both.

**A report's two results ask for 6,000,000 and 5,000,000 accumulation gas. What happens?**

- [ ] Accepted: each is under 10,000,000
  > No: G_A limits the results together, not each one.
- [x] Refused, `work_report_gas_too_high`: 11,000,000 is over G_A
  > Yes: rule 4. All of a report's results together get at most 10,000,000.
- [ ] Accepted, if each meets its service's minimum gas
  > No: that's a floor, rule 10. G_A is a ceiling, and this report is over it.
:::

## What you have

The whole reports step, checked: thirteen checks on the guarantees, fourteen on the reports,
and every reports vector accepted or refused exactly as it should be. The refused 62 pass
whole; the accepted 30 wait for the statistics. [Part 12](./index.md) is done.
One rule leaned on something you haven't built: [lesson 12.4](./04-bad-guarantees.md)'s authorizer pools.
[Part 13](../13-authorization/index.md) keeps them moving, block by block.

Next: [Part 13 · Authorization](../13-authorization/index.md)
