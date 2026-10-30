# What cores and services did

[Lesson 18.1](./01-who-did-what.md) kept score for validators, epoch by epoch. Cores and services get a scorecard
too, but a short-lived one: it covers a single block, and the next block starts again
from zero. This lesson builds both cards and checks them against every reports and
preimages test vector. No reports, assurances or statistics vector checks a core's data
load (the block-import traces carry it, for when real blocks run through), so you'll work
one out by hand as well.

## New words

- **Core statistics.** One block's scorecard for each core: the work in the reports it
  took on, the bytes it now has to keep available, and how many assurances named it.
  *Example:* core 0 took on one report: 821 gas, and a 17180-byte bundle.
- **Service statistics.** One block's scorecard for each service that did something: its
  share of that work, the preimages provided for it, and its accumulation. *Example:*
  service 42: 2 digests refined, 1518 gas.
- **Data load.** The bytes a core's newly available reports ask the validators to keep:
  each report's bundle, plus every segment it exported, plus their proof pages.
  *Example:* a 12345-byte bundle with 3 segments: 12345 + 4 × 4104 = 28761 bytes.
- **Popularity.** How many of the block's assurances say "I hold my piece" of a core's
  data. *Example:* 4 of 6 validators assure core 1: popularity 4, even though 4 isn't
  enough to make its report available.

Two words this lesson leans on: a **bundle** is a work-package together with everything
needed to refine it, and a **segment** is a 4104-byte piece of data a work-item exports
for later packages to import. All of them are in the [glossary](../glossary.md).

## What the Gray Paper says

§13, *Cores and Services*. Unlike the validators' tallies, these two "are tracked only on
a per-block basis": nothing carries over from the block before.

**Each core's card** is filled from three places:

1. **The work it took on.** Every report this block's guarantees put on the core ([lesson
   12.3](../12-guarantees/03-onto-the-cores.md)): add up its digests' imports, exports, gas and extrinsics (how many, and their
   bytes), and its bundle's length. A work-item's *extrinsics* are data blobs sent along
   with it for refine to read; nothing to do with the block's extrinsic.
2. **Its data load.** Every report of the core's that became available in this block
   ([lesson 11.1](../11-assurances/01-available.md)): its bundle's length, plus 4104 bytes for every segment it exported,
   plus one more segment for every 64 of them, rounded up. That last one is a *proof
   page*: hashes that let anyone check later that a segment is the real one.
3. **Its popularity.** How many of the block's assurances have the core's bit set.

**Each service's card** is filled from three places as well:

1. **Its share of the work.** Every digest for the service in the reports taken on: how
   many, their gas, imports, extrinsics and exports.
2. **Its provisions.** The preimages provided for it in this block ([lesson 14.1](../14-services/01-providing-preimages.md)): how
   many, and their bytes.
3. **Its accumulation.** [Lesson 17.1](../17-accumulation/01-a-blocks-accumulation.md)'s (count, transfers, gas), or zeros if it didn't
   accumulate.

A service gets a card only if it appears in at least one of the three.

The Gray Paper's names: the cores' cards are **π_C**, the services' **π_S**. The reports
taken on are **𝐈** (a bold I: the incoming reports, the ones [lesson 12.3](../12-guarantees/03-onto-the-cores.md) put onto
cores), the newly available ones **𝐑** (a bold R,
[lesson 11.1](../11-assurances/01-available.md)). For core c, it writes the work as R(c), with a plain R: a different thing,
the sum of step 1. The bundle lengths are L(c), and the data load is

  D(c) = Σ over 𝐑's reports for core c of: bundle length + W_G · ⌈segments · 65/64⌉

with W_G = 4104. Why 65/64? For n segments, n · 65/64 = n + n/64: the segments
themselves, and a proof page for every 64. Three segments: ⌈3.046875⌉ = 4.

<CoreLoad />

## The tests

**Add to** `test/statistics.test.ts`

```ts
import { Assurance, Preimage } from "../src/block.ts";
import type { Config } from "../src/config.ts";
import { FULL, TINY } from "../src/config.ts";
import { coreStats, CoreStats, serviceStats, ServiceStats } from "../src/statistics.ts";
import { WorkReport } from "../src/work.ts";
import { vectorJson } from "./vectors.ts";

/** The vectors in `dir` whose block is valid: a block that fails changes no tally. */
function validVectors(dir: string) {
  const valid = (name: string) => "ok" in (vectorJson(name) as { output: object }).output;
  return vectorFiles(dir).filter(valid);
}

/** Service tallies as the vectors write them: a list of ids, each with its tally. */
type ServiceTallies = { id: number; record: unknown }[];

/** The vectors' service tallies, as a map from service id to tally. */
const serviceTallies = (json: ServiceTallies) =>
  new Map(json.map((s) => [s.id, ServiceStats.fromJson(s.record)]));

/** A reports test vector, as far as statistics go: the new reports, and the tallies after. */
type ReportsVector = {
  input: { guarantees: { report: unknown }[] };
  post_state: { cores_statistics: unknown[]; services_statistics: ServiceTallies };
};

/** One block of reports vector `name`: core and service tallies, yours and the vector's. */
function runWork(config: Config, name: string) {
  const v = vectorJson(name) as ReportsVector;
  const incoming = v.input.guarantees.map((g) => WorkReport.fromJson(g.report));
  const cores = coreStats(config, incoming, [], []);
  const services = serviceStats(incoming, [], new Map());
  const post = v.post_state;
  const expected = {
    cores: post.cores_statistics.map((c) => CoreStats.fromJson(c)),
    services: serviceTallies(post.services_statistics),
  };
  return { cores, services, expected };
}

test("one big report: its core and its service take on all its work", () => {
  const { cores, services } = runWork(TINY, "stf/reports/tiny/big_work_report_output-1.json");
  assert.deepEqual([cores[0].bundle_size, cores[0].gas_used], [17180, 821n]);
  assert.equal(services.get(42)?.refinement_count, 2); // the report's two digests
  assert.equal(cores[1].gas_used, 0n); // core 1 took on nothing
});

/** An assurances test vector: the block's assurances, and the reports they made available. */
type AssurancesVector = {
  input: { assurances: unknown[] };
  output: { ok: { reported: unknown[] } };
};

test("assured data: each core's load, and how many assurances name it", () => {
  const v = vectorJson("stf/assurances/tiny/some_assurances-1.json") as AssurancesVector;
  const assurances = v.input.assurances.map((a) => Assurance(TINY).fromJson(a));
  const available: WorkReport[] = v.output.ok.reported.map((r) => WorkReport.fromJson(r));
  const cores: CoreStats[] = coreStats(TINY, [], available, assurances);
  // core 0's report became available: a 12345-byte bundle, and 3 segments plus 1 proof page
  assert.deepEqual([cores[0].da_load, cores[0].popularity], [12345 + 4104 * 4, 5]);
  assert.deepEqual([cores[1].da_load, cores[1].popularity], [0, 4]); // 4 of 6 isn't enough
});

for (const config of [TINY, FULL]) {
  for (const name of validVectors(`stf/reports/${config.name}`)) {
    test(`${name}: every core's and service's work ends as the vector says`, () => {
      const { cores, services, expected } = runWork(config, name);
      assert.deepEqual({ cores, services }, expected);
    });
  }
}

/** A preimages test vector, as far as statistics go: the preimages, and the tallies after. */
type PreimagesVector = {
  input: { preimages: unknown[] };
  post_state: { statistics: ServiceTallies };
};

for (const config of [TINY, FULL]) {
  for (const name of validVectors(`stf/preimages/${config.name}`)) {
    test(`${name}: every service's provided preimages end as the vector says`, () => {
      const v = vectorJson(name) as PreimagesVector;
      const preimages: Preimage[] = v.input.preimages.map((p) => Preimage.fromJson(p));
      const services: Map<number, ServiceStats> = serviceStats([], preimages, new Map());
      const expected: Map<number, ServiceStats> = serviceTallies(v.post_state.statistics);
      assert.deepEqual(services, expected);
    });
  }
}
```

Three kinds of vector, each checking one piece:

- The **reports** vectors put new reports on cores, so they check the work. Only the
  valid ones count: a block that fails changes nothing.
- The **preimages** vectors provide preimages, so they check provisions.
- The **assurances** vectors make reports available, but they don't keep statistics.
  So the second test works its numbers out by hand. In `some_assurances-1`, five of
  the six validators assure core 0, and four assure core 1. More than two thirds of 6
  means at least 5, so only core 0's report becomes available.

Accumulation's part was checked against the accumulate vectors in [lesson 17.1](../17-accumulation/01-a-blocks-accumulation.md).

## The code

**Add to** `src/statistics.ts`

```ts
import type { Assurance, Preimage } from "./block.ts";
import type { AccumulationStats } from "./accumulate.ts";
import { assuredCount } from "./assurances.ts";
import { natural, natural32 } from "./codec/codec.ts";
import type { RefineLoad, WorkReport } from "./work.ts";

/** One core's work in one block (GP §13, π_C), under the test vectors' names. */
export const CoreStats = record({
  da_load: natural32, // D: bytes it must keep available, for reports that became available
  popularity: natural32, // assurances that it holds a report's data
  imports: natural32, // from here down: the work in the reports it took on (R(c))
  extrinsic_count: natural32,
  extrinsic_size: natural32,
  exports: natural32,
  bundle_size: natural32, // L: those reports' bundles, all together
  gas_used: natural,
});
export type CoreStats = Value<typeof CoreStats>;

/** W_G: the size of a segment, an exported piece of data (GP App. I). */
const SEGMENT_SIZE = 4104;

/** What a report's data costs to keep available: its bundle, and its exported segments
 * with one more for every 64 of them (their proofs), rounded up. */
const dataLoad = (spec: { length: number; exports_count: number }) =>
  spec.length + SEGMENT_SIZE * Math.ceil((spec.exports_count * 65) / 64);

/**
 * π_C′ (GP §13): what each core did in this block. Its work: the digests of the reports it
 * took on (I), summed. Its data load: the reports of its that became available (R), each
 * bundle plus its exported segments. Its popularity: how many assurances name it.
 */
export function coreStats(
  config: Config,
  incoming: WorkReport[], // I: the reports guaranteed in this block
  available: WorkReport[], // R: the reports that became available in this block
  assurances: Assurance[],
): CoreStats[] {
  return Array.from({ length: config.core_count }, (_, c) => {
    const mine = incoming.filter((r) => r.core_index === c);
    const loads = mine.flatMap((r) => r.results.map((d) => d.refine_load));
    const sum = (f: (l: RefineLoad) => number) => loads.reduce((n, l) => n + f(l), 0);
    const kept = available.filter((r) => r.core_index === c).map((r) => r.package_spec);
    return {
      da_load: kept.reduce((n, spec) => n + dataLoad(spec), 0),
      popularity: assuredCount(assurances, c),
      imports: sum((l) => l.imports),
      extrinsic_count: sum((l) => l.extrinsic_count),
      extrinsic_size: sum((l) => l.extrinsic_size),
      exports: sum((l) => l.exports),
      bundle_size: mine.reduce((n, r) => n + r.package_spec.length, 0),
      gas_used: loads.reduce((n, l) => n + l.gas_used, 0n),
    };
  });
}

/** One service's activity in one block (GP §13, π_S), under the test vectors' names. */
export const ServiceStats = record({
  provided_count: natural32, // preimages provided for it
  provided_size: natural32, // their bytes
  refinement_count: natural32, // its digests in the reports guaranteed (R(s))
  refinement_gas_used: natural,
  imports: natural32,
  extrinsic_count: natural32,
  extrinsic_size: natural32,
  exports: natural32,
  accumulate_count: natural32, // from here down: lesson 17.1's accumulation statistics
  accumulate_transfer_count: natural32,
  accumulate_gas_used: natural,
});
export type ServiceStats = Value<typeof ServiceStats>;

/**
 * π_S′ (GP §13): every service active in this block, and what it did: preimages provided
 * for it, its share of the guaranteed reports' work, and its accumulation (lesson 17.1).
 */
export function serviceStats(
  incoming: WorkReport[],
  preimages: Preimage[],
  accumulation: Map<number, AccumulationStats>,
): Map<number, ServiceStats> {
  const digests = incoming.flatMap((r) => r.results);
  const active = new Set([
    ...digests.map((d) => d.service_id),
    ...preimages.map((p) => p.requester),
    ...accumulation.keys(),
  ]);
  const stats = new Map<number, ServiceStats>();
  for (const s of active) {
    const mine = digests.filter((d) => d.service_id === s).map((d) => d.refine_load);
    const sum = (f: (l: RefineLoad) => number) => mine.reduce((n, l) => n + f(l), 0);
    const provided = preimages.filter((p) => p.requester === s);
    const acc = accumulation.get(s) ?? { count: 0, transfers: 0, gasUsed: 0n };
    stats.set(s, {
      provided_count: provided.length,
      provided_size: provided.reduce((n, p) => n + p.blob.length, 0),
      refinement_count: mine.length,
      refinement_gas_used: mine.reduce((n, l) => n + l.gas_used, 0n),
      imports: sum((l) => l.imports),
      extrinsic_count: sum((l) => l.extrinsic_count),
      extrinsic_size: sum((l) => l.extrinsic_size),
      exports: sum((l) => l.exports),
      accumulate_count: acc.count,
      accumulate_transfer_count: acc.transfers,
      accumulate_gas_used: acc.gasUsed,
    });
  }
  return stats;
}
```

Both are sums, done once for each core or service. A few things to notice:

- `assuredCount` is [lesson 11.1](../11-assurances/01-available.md)'s, which counted the same bits to decide availability.
- Gas is a `bigint`, as it has been since [Part 3](../03-work-and-reports/index.md)'s `gas_used`, so its sums start from `0n`.
- `Math.ceil` on `n * 65 / 64` is exact: dividing by 64, a power of two, never rounds in
  floating point.
- `active` is a `Set`, so a service that both refined and accumulated gets one card,
  not two.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ the reported packages: each one's hash and exports root, sorted by hash (582.3ms)
...
✔ one big report: its core and its service take on all its work (0.9ms)
✔ assured data: each core's load, and how many assurances name it (0.3ms)
...
ℹ tests 636
ℹ suites 0
ℹ pass 636
ℹ fail 0
...
reported 636 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791740899975
...
```

## Watch it

**New file** `bin/activity.ts`

```ts
// One block's core and service activity, from a reports test vector (new work taken on) or
// an assurances one (data now available), and what each core and service did.
// Usage: npm run activity [vector], multiple_reports-1 (tiny) if not given

import { readFileSync } from "node:fs";
import { Assurance } from "../src/block.ts";
import { FULL, TINY } from "../src/config.ts";
import { Run } from "../src/obs.ts";
import { coreStats, serviceStats } from "../src/statistics.ts";
import { WorkReport } from "../src/work.ts";

const DEFAULT = "../vectors/stf/reports/tiny/multiple_reports-1.json";
const file = process.argv[2] ?? DEFAULT;
const config = file.includes("/full/") ? FULL : TINY;
const v = JSON.parse(readFileSync(file, "utf8"));
let incoming: WorkReport[] = []; // I
let available: WorkReport[] = []; // R
let assurances: Assurance[] = [];
if (file.includes("/assurances/")) {
  // a block of assurances: some reports' data is now available
  available = v.output.ok.reported.map((r: unknown) => WorkReport.fromJson(r));
  assurances = v.input.assurances.map((a: unknown) => Assurance(config).fromJson(a));
} else {
  // a block of guarantees: new reports, new work for their cores
  incoming = v.input.guarantees.map((g: { report: unknown }) => WorkReport.fromJson(g.report));
}
const cores = coreStats(config, incoming, available, assurances);
const services = serviceStats(incoming, [], new Map());

const run = new Run("activity");
/** A tally's fields that aren't zero, by name: the ones worth reading. */
const busy = (tally: object) =>
  Object.entries(tally).filter(([, n]) => Number(n) !== 0).map(([k, n]) => `${k} ${n}`).join(", ");
const show = (who: string, tally: object) => {
  const did = busy(tally) || "nothing";
  console.log(`${who}: ${did}`);
  run.event("tally", { who, did });
};
cores.forEach((tally, c) => show(`core ${c}`, tally));
for (const [s, tally] of services) show(`service ${s}`, tally);
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

**What flows through it.** The three faces of the guarantees run — the two reports'
refine loads going in, the tallies the program adds up, its terminal lines:

::: code-group

```json [what goes in]
{
  "input": { "guarantees": [
    { "report": { "core_index": 0, "package_spec": { "length": 17180 }, "results": [ {
      "service_id": 42,
      "refine_load": { "gas_used": 821, "imports": 8, "extrinsic_count": 8,
                       "extrinsic_size": 1526, "exports": 17 }
    } ] } },
    { "report": { "core_index": 1, "package_spec": { "length": 12487 }, "results": [ {
      "service_id": 42,
      "refine_load": { "gas_used": 697, "imports": 1, "extrinsic_count": 3,
                       "extrinsic_size": 1926, "exports": 18 }
    } ] } }
  ] }
}
```

```ts [what it computes]
// coreStats and serviceStats, from those two refine loads
const computed = {
  core0: { bundle_size: 17180, gas_used: 821 }, // its own report's load, as it stands
  core1: { bundle_size: 12487, gas_used: 697 },
  service42: { refinement_count: 2, refinement_gas_used: 821 + 697 }, // both reports, added
  availability: "nothing", // no assurances in this vector: that's the second run below
};
```

```text [what comes out]
core 0: imports 8, extrinsic_count 8, extrinsic_size 1526, exports 17, bundle_size 17180, gas_used 821
core 1: imports 1, extrinsic_count 3, extrinsic_size 1926, exports 18, bundle_size 12487, gas_used 697
service 42: refinement_count 2, refinement_gas_used 1518, imports 9, extrinsic_count 11, extrinsic_size 3452, exports 35
```

:::

Read the input into the output: each core's line is its own report's `refine_load` plus
the `package_spec.length` as `bundle_size`, kept apart; service 42's line is the same
two loads *added*, because both reports carry its work — 821 + 697 = 1518 gas, 8 + 1 = 9
imports, 1526 + 1926 = 3452 extrinsic bytes, 17 + 18 = 35 exports. One block, two views:
per core, and per service.

**Run**

```sh
npm pkg set scripts.activity="node bin/activity.ts"
npm run activity
```

```text
core 0: imports 8, extrinsic_count 8, extrinsic_size 1526, exports 17, bundle_size 17180, gas_used 821
core 1: imports 1, extrinsic_count 3, extrinsic_size 1926, exports 18, bundle_size 12487, gas_used 697
service 42: refinement_count 2, refinement_gas_used 1518, imports 9, extrinsic_count 11, extrinsic_size 3452, exports 35
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=activity-1791740914594
```

A block of two guarantees, one report for each core, both for service 42. Each core's
card shows its own report's work. Service 42's card shows both reports' work added up:
821 + 697 = 1518 gas. Now a block of assurances:

**Run**

```sh
npm pkg set scripts.activity-some="node bin/activity.ts ../vectors/stf/assurances/tiny/some_assurances-1.json"
npm run activity-some
```

```text
core 0: da_load 28761, popularity 5
core 1: popularity 4
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=activity-1791740914740
```

Core 0's report became available, so core 0 carries its data load: 12345 + 4 × 4104.
Core 1 is popular too, with 4 assurances, but not popular enough: it carries nothing yet.
Both runs land in the *Core and service activity* panel, on the **7 · Accumulation and
import** dashboard, one line per card.

![Core and service activity panel](./images/02-core-and-service-activity.png)

## The scoreboard

In [lesson 12.5](../12-guarantees/05-bad-reports.md) the scoreboard turned away every accepted reports vector, and in
[lesson 14.1](../14-services/01-providing-preimages.md) four preimages vectors, all for the same reason: the vectors' statistics
changed and your client's didn't. Now it keeps them. Both checks learn to compare them:

**Add to** `test/families.ts`

```ts
import { CoreStats, coreStats, ServiceStats, serviceStats } from "../src/statistics.ts";

/** Service tallies as the vectors write them: a list of ids, each with its tally. */
type ServiceTallies = { id: number; record: unknown }[];

/** The vectors' service tallies, as a map from service id to tally. */
const serviceTallies = (json: ServiceTallies) =>
  new Map(json.map((s) => [s.id, ServiceStats.fromJson(s.record)]));
```

**Replace in** `test/families.ts`

```ts
type ReportsState = {
  curr_validators: unknown[];
  prev_validators: unknown[];
  entropy: string[];
  offenders: string[];
  avail_assignments: unknown;
  auth_pools: string[][];
  recent_blocks: { history: unknown[] };
  accounts: { id: number; data: { service: { code_hash: string; min_item_gas: number } } }[];
  cores_statistics: unknown[];
  services_statistics: ServiceTallies;
};

/** A reports vector: ρ′, the reporters and the reported packages, and the work counted for
 * each core and service; or the rule broken. */
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
  const post = vector.post_state;
  const coreTallies = post.cores_statistics.map((c) => CoreStats.fromJson(c));
  assert.deepEqual(coreStats(config, reports, [], []), coreTallies, "cores_statistics differs");
  const serviceTally = serviceTallies(post.services_statistics);
  const serviceWork = serviceStats(reports, [], new Map());
  assert.deepEqual(serviceWork, serviceTally, "services_statistics differs");
  unchanged(vector, ["avail_assignments", "cores_statistics", "services_statistics"]);
}

type PreimagesState = { accounts: PreimagesAccount[]; statistics: ServiceTallies };

/** A preimages vector: δ′, each preimage stored and its request marked, and each service's
 * provided preimages counted. Your client refuses no preimages (lesson 14.1's simple road),
 * so it accepts every block. */
function checkPreimages(name: string) {
  const vector = vectorJson(name) as StfVector<PreimagesInput, PreimagesState>;
  const { input, pre_state } = vector;
  sameError(null, vector);
  const preimages = input.preimages.map((p) => Preimage.fromJson(p));
  const after = providePreimages(accountEntries(pre_state.accounts), preimages, input.slot);
  const sorted = after.sort((a, b) => toHex(a.key).localeCompare(toHex(b.key)));
  assert.deepEqual(sorted, accountEntries(vector.post_state.accounts), "accounts differs");
  const expected = serviceTallies(vector.post_state.statistics);
  assert.deepEqual(serviceStats([], preimages, new Map()), expected, "statistics differs");
  unchanged(vector, ["accounts", "statistics"]);
}
```

A reports block counts only the work it brings: no report becomes available in it and it
carries no assurances, so `coreStats` gets two empty lists, as in the tests above.

The milestone's vectors are the `reports` ones. Here is one, two guarantees at slot 14, and the board's row for the family:

::: code-group

```json [what goes in]
{
  "vector": "vectors/stf/reports/tiny/multiple_reports-1.json",
  "input.slot": 14,
  "input.guarantees": [
    { "core_index": 0, "package": "0x63c03371…", "length": 17180, "signed_by": [1, 4, 5] },
    { "core_index": 1, "package": "0xc7e675b7…", "length": 12487, "signed_by": [0, 2] }
  ],
  "output.ok.reported": ["0x63c03371…", "0xc7e675b7…"]
}
```

```text [console]
stf/reports              92 of 92  ✔

406 of 1,428 vectors pass.
```

:::

*Run whole* here means the vector's answer is the reports list in `output`, two packages, and the state after it, `cores_statistics` included, matching to the byte. All 92 `reports` vectors do that, and the row says `92 of 92`.

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
stf/accumulate         126 of 126  ✔
stf/assurances           22 of 22  ✔
stf/authorizations         6 of 6  ✔
stf/disputes             60 of 60  ✔
stf/history                8 of 8  ✔
stf/preimages             6 of 16
    ✘ stf/preimages/full/preimage_not_needed-1.json: accepted, not preimage_unneeded
    ✘ stf/preimages/full/preimage_not_needed-2.json: accepted, not preimage_unneeded
    ✘ stf/preimages/full/preimages_order_check-1.json: accepted, not preimages_not_sorted_unique
    … and 7 more
stf/reports              92 of 92  ✔
stf/safrole              46 of 46  ✔
stf/statistics             8 of 8  ✔
traces/fallback          not run yet (100)
traces/fuzzy             not run yet (200)
traces/fuzzy_light       not run yet (200)
traces/preimages         not run yet (100)
traces/preimages_light   not run yet (100)
traces/safrole           not run yet (100)
traces/storage           not run yet (100)
traces/storage_light     not run yet (100)
trie                       1 of 1  ✔

406 of 1,428 vectors pass.
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=scoreboard-1791939804842
```

Every reports vector, and six preimages vectors. The ten left in `stf/preimages` are the
blocks your client should refuse and doesn't, the [hardening pass](https://github.com/abutlabs/the-gray-tutor/blob/main/HARDENING.md)'s to fix, and the board
will go on saying so.

> [!TIP] Milestone
> **Every reports vector.** All 92, tiny and full, whole: guarantees and reports
> checked, reports seated on their cores, and each core's and service's work counted.

<details>
<summary>lasair: the data load, in <code>lib/statistics.ml</code></summary>

```ocaml
(** Calculate DA load for a report *)
let calculate_da_load (bundle_len : int) (segment_count : int) : int =
  let segment_overhead =
    c_segment_size * ((segment_count * c_da_overhead_num + c_da_overhead_den - 1)
                      / c_da_overhead_den)
  in
  bundle_len + segment_overhead
```

The same sum, in whole numbers only: `c_segment_size` is 4104, and the two
`c_da_overhead_` constants are 65 and 64, defined at the top of the file. Adding 63 before
dividing by 64 rounds up without fractions, the classic way to write ⌈x/64⌉ when you
only have integers. Try it: 3 segments, (195 + 63) / 64 = 4.

</details>

## Check your understanding

::: check
**A validator's tally lasts an epoch. How long does a core's or a service's last?**

- [ ] An epoch too, with a last epoch's copy
  > No: only the validators get two tallies that last an epoch.
- [x] One block: the next block starts again from zero
  > Yes: the Gray Paper tracks these "only on a per-block basis". Nothing carries over.
- [ ] For ever, adding up block after block
  > No: each block's cards are only that block's work.

**A report with a 12345-byte bundle and 3 exported segments becomes available. What does its core's data load go up by?**

- [ ] 12345 + 3 × 4104 = 24657
  > No: that leaves out the proof page. Every 64 segments, or part of 64, add one more.
- [ ] 12345: segments are kept by whoever imports them
  > No: the validators keep the segments available too, so they count.
- [x] 12345 + 4 × 4104 = 28761
  > Yes: ⌈3 × 65/64⌉ = ⌈3.046875⌉ = 4: the 3 segments and one proof page.

**In `some_assurances-1`, 4 of the 6 validators assure core 1. What is on core 1's card?**

- [x] Popularity 4, and a data load of 0
  > Yes: popularity counts every assurance naming the core. But availability needs more
  > than two thirds of 6, at least 5, so nothing became available, and there's no load.
- [ ] Popularity 0, because its report didn't become available
  > No: popularity counts assurances, whether or not there are enough of them.
- [ ] Its report's data load, since 4 validators already hold it
  > No: the load counts only reports that became available in this block.

**A block brings two reports, one for each core, both for service 42, using 821 and 697 gas. What does service 42's card say?**

- [ ] 821 gas: one card for the first report
  > No: a service's card adds up its work from every report in the block.
- [x] 2 digests refined, using 1518 gas
  > Yes: 821 + 697 = 1518. Each core's card has its own report's gas; the service's has
  > both.
- [ ] Two cards, one for each core
  > No: one card per service. The services that took part form a set, so 42 is in it once.

**Service 7 has a preimage provided in this block, but no reports and no accumulation. Does it get a card?**

- [ ] No: only services that accumulate get one
  > No: any one of the three is enough: work, provisions or accumulation.
- [ ] Yes, carried over from the block before, with one more preimage
  > No: nothing carries over. The card is this block's alone.
- [x] Yes: 1 preimage provided and its bytes, and zeros for the rest
  > Yes: a service gets a card if it appears in at least one of the three.
:::

## What you have

All three scorecards: each validator's for the epoch ([lesson 18.1](./01-who-did-what.md)), and each core's
and each service's for the block. Every state-transition family is on the scoreboard now,
every vector in it passing whole but the ten preimages refusals. [Part 18](./index.md) is
done. Every part so far built one piece of a block's state transition on its own;
[Part 19](../19-block-import/index.md) starts putting them together, with the order the Gray Paper asks for.

Next: [Part 19 · Block import](../19-block-import/index.md)
