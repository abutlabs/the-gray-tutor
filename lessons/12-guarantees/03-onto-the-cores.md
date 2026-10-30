# Onto the cores

The guarantors are the right ones ([lesson 12.1](./01-who-guarantees-what.md)), their signatures are real ([lesson
12.2](./02-signed-and-counted.md)). Time to seat the report: each guaranteed report takes its core and starts waiting
for its data to become available, which is where [Part 11](../11-assurances/index.md) picks it up next block.
And the block makes a note of the packages it reported, for the recent history ([Part
9](../09-recent-history/index.md)) to remember.

## What the Gray Paper says

§11. ρ′, the cores after the guarantees: each guarantee's report goes on the core it
names, as a pending report: the whole guarantee, registered at τ′, this block's slot. A
core can only take a report if it's free, after the disputes ([lesson 10.3](../10-disputes/03-clearing-the-cores.md)) and the
assurances ([lesson 11.2](../11-assurances/02-timeouts.md)) have done their clearing. Every other core keeps what it had.

**The reported packages** are a dictionary: each reported work-package's hash, mapped to
the root of the segments it exports. [Lesson 9.2](../09-recent-history/02-recent-blocks.md)'s `recordBlock` takes exactly these, as
`work_packages`. A dictionary is kept **sorted by key**, so they're listed by package
hash, not in the order the guarantees came. ([Lesson 9.2](../09-recent-history/02-recent-blocks.md) left sorting to the [hardening
pass](https://github.com/abutlabs/the-gray-tutor/blob/main/HARDENING.md). Here the vectors insist on it.)

Step a real block's two guarantees onto the cores:

<OntoCores />

## The tests

**Replace in** `test/guarantors.test.ts`

```ts
/** A reports test vector: the parts of it this lesson uses. */
type ReportsVector = {
  input: { guarantees: unknown[]; slot: number };
  pre_state: {
    curr_validators: unknown[];
    prev_validators: unknown[];
    entropy: string[];
    offenders: string[];
    avail_assignments: unknown;
  };
  post_state: { avail_assignments: unknown };
  output: { err?: string; ok?: { reporters: string[]; reported: unknown[] } };
};
```

**Add to** `test/guarantors.test.ts`

```ts
import { PendingReports, placeReports, reportedPackages } from "../src/cores.ts";
import type { PendingReport } from "../src/cores.ts";

/** The accepted reports vectors of a size: a rejected block changes nothing. */
function acceptedVectors(config: Config): { name: string; vector: ReportsVector }[] {
  return vectorFiles(`stf/reports/${config.name}`)
    .map((name) => ({ name, vector: vectorJson(name) as ReportsVector }))
    .filter(({ vector }) => !vector.output.err);
}

test("ρ′: each guaranteed report takes its core, registered at the block's slot", () => {
  let placed = 0;
  for (const config of [TINY, FULL]) {
    for (const { name, vector } of acceptedVectors(config)) {
      const { input, pre_state, post_state } = vector;
      const before = PendingReports(config).fromJson(pre_state.avail_assignments);
      const guarantees = GuaranteesExtrinsic.fromJson(input.guarantees);
      const after: (PendingReport | null)[] = placeReports(before, guarantees, input.slot);
      const expected = PendingReports(config).fromJson(post_state.avail_assignments);
      assert.deepEqual(after, expected, name);
      placed += guarantees.length;
    }
  }
  assert.equal(placed, 44); // 21 on tiny, 23 on full
});

test("the reported packages: each one's hash and exports root, sorted by hash", () => {
  for (const config of [TINY, FULL]) {
    for (const { name, vector } of acceptedVectors(config)) {
      const guarantees = GuaranteesExtrinsic.fromJson(vector.input.guarantees);
      const reported = reportedPackages(guarantees).map((p) => ({
        work_package_hash: toHex(p.hash),
        segment_tree_root: toHex(p.exports_root),
      }));
      assert.deepEqual(reported, vector.output.ok?.reported, name);
    }
  }
});
```

The vectors write the reported packages as `work_package_hash` and `segment_tree_root`;
the history vectors called the same two things `hash` and `exports_root`. Your client
picks one pair of names, and the test translates.

## The code

**Add to** `src/cores.ts`

```ts
import { toHex } from "./bytes.ts";
import type { ReportedPackage } from "./history.ts";

/** ρ′ (GP §11): each guaranteed report takes its core, registered at this block's slot. */
export function placeReports(
  cores: (PendingReport | null)[],
  guarantees: ReportGuarantee[],
  slot: number, // τ′
): (PendingReport | null)[] {
  const after = [...cores];
  for (const guarantee of guarantees) {
    after[guarantee.report.core_index] = { guarantee, registered_slot: slot };
  }
  return after;
}

/** The packages a block reports: each one's hash and exports root, sorted by hash. */
export function reportedPackages(guarantees: ReportGuarantee[]): ReportedPackage[] {
  const packages = guarantees.map(({ report }) => ({
    hash: report.package_spec.hash,
    exports_root: report.package_spec.exports_root,
  }));
  return packages.sort((a, b) => toHex(a.hash).localeCompare(toHex(b.hash))); // a dictionary
}
```

`[...cores]` copies the list first, so the cores before the block stay as they were.
`({ report }) =>` picks the one field it needs out of each guarantee.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ ρ′: each guaranteed report takes its core, registered at the block's slot (682.3ms)
✔ the reported packages: each one's hash and exports root, sorted by hash (218.4ms)
...
ℹ tests 200
ℹ suites 0
ℹ pass 200
ℹ fail 0
...
reported 200 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791734328669
...
```

44 reports seated, and every reported list in order. Take the `.sort(…)` away and run
the tests again: `high_work_report_gas-1` fails (the tiny one stops the test first; the full
one would too). Its guarantees list
package `0x63c0…` before `0x3165…`, and the dictionary wants them the other way round.

## Watch it

**New file** `bin/placed.ts`

```ts
// Puts the guaranteed reports of a reports test vector onto their cores, and lists the
// packages the block reports, sorted by hash.
// Usage: npm run placed <vector.json>, e.g.
//        npm run placed ../vectors/stf/reports/tiny/high_work_report_gas-1.json

import { readFileSync } from "node:fs";
import { GuaranteesExtrinsic } from "../src/block.ts";
import type { Bytes } from "../src/bytes.ts";
import { toHex } from "../src/bytes.ts";
import { FULL, TINY } from "../src/config.ts";
import { PendingReports, placeReports, reportedPackages } from "../src/cores.ts";
import { Run } from "../src/obs.ts";

const [file] = process.argv.slice(2);
const config = file.includes("/full/") ? FULL : TINY;
const { input, pre_state } = JSON.parse(readFileSync(file, "utf8"));
const before = PendingReports(config).fromJson(pre_state.avail_assignments);
const guarantees = GuaranteesExtrinsic.fromJson(input.guarantees);
const after = placeReports(before, guarantees, input.slot);
const short = (bytes: Bytes) => `${toHex(bytes).slice(0, 10)}…`;
const run = new Run("placed");
for (const guarantee of guarantees) {
  const core = guarantee.report.core_index;
  const was = before[core] === null ? "empty" : "taken";
  const spec = guarantee.report.package_spec;
  console.log(`core ${core} (${was}): now holds package ${short(spec.hash)}, since ${input.slot}`);
  run.event("placed", { core, was, package: spec.hash, slot: input.slot });
}
const waiting = after.filter((pending) => pending !== null).length;
console.log(`cores holding a report now: ${waiting} of ${config.core_count}`);
for (const { hash, exports_root } of reportedPackages(guarantees)) {
  console.log(`reported: package ${short(hash)}, exports root ${short(exports_root)}`);
  run.event("reported", { package: hash, exports_root });
}
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

**What flows through it.** A block at slot 14 with both cores empty and a guarantee
for each:

::: code-group

```json [what goes in]
{
  "slot": 14,
  "avail_assignments": [null, null],
  "guarantees": [
    { "report": { "core_index": 0,
        "package_spec": { "hash": "0x63c03371…", "exports_root": "0x5c9dca80…", … } } },
    { "report": { "core_index": 1,
        "package_spec": { "hash": "0x316504b8…", "exports_root": "0x5c9dca80…", … } } }
  ]
}
```

```ts [what it computes]
// bin/placed.ts: ρ after the block, and the block's reported-packages list
const computed = {
  core0: { was: "empty", holds: "0x63c03371…", since: 14 },
  core1: { was: "empty", holds: "0x316504b8…", since: 14 },
  reported: ["0x316504b8…", "0x63c03371…"], // the same two packages, sorted by hash
};
```

```text [what comes out]
core 0 (empty): now holds package 0x63c03371…, since 14
cores holding a report now: 2 of 2
reported: package 0x316504b8…, exports root 0x5c9dca80…
```

:::

Each guarantee lands on the core its report names, stamped with the block's `slot` for
[lesson 11.2](../11-assurances/02-timeouts.md)'s timeout clock. Notice the two orders: `avail_assignments` fills in core
order, the reported list sorts by package hash — which is why `0x316504b8…` leads it
while core 0 holds `0x63c03371…`.

**Run**

```sh
npm pkg set scripts.placed="node bin/placed.ts"
npm pkg set scripts.placed-high-gas="node bin/placed.ts ../vectors/stf/reports/tiny/high_work_report_gas-1.json"
npm run placed-high-gas
```

```text
core 0 (empty): now holds package 0x63c03371…, since 14
core 1 (empty): now holds package 0x316504b8…, since 14
cores holding a report now: 2 of 2
reported: package 0x316504b8…, exports root 0x5c9dca80…
reported: package 0x63c03371…, exports root 0x5c9dca80…
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=placed-1791734334389
```

Core 0 gets `0x63c0…` and core 1 gets `0x3165…`, but the reported list starts with
`0x3165…`: cores in core order, packages in hash order. Try `with_avail_assignments-1`,
where one core is already taken and the new report takes a free one. The *Placed* panel,
on **4 · Checks**, shows both lists.

![Placed panel](./images/03-placed.png)

<details>
<summary>lasair: placing reports, in <code>conformance/reports_stf.ml</code></summary>

```ocaml
    let new_assignments = List.mapi (fun core assignment ->
      match List.find_opt (fun (g : guarantee) -> g.report.core_index = core) input.guarantees with
      | Some g ->
        Some { guarantee = g; registered_slot = input.slot }
      | None -> assignment
    ) pre.avail_assignments in
```

The same rule, turned around: lasair walks the cores and looks for a guarantee for each
one, where yours walks the guarantees and drops each on its core. Both seat the same
reports. A few lines above this, in the same adapter, the reported list's segment roots
are still `TODO: compute properly` and written as zeros. [Lesson 12.2](./02-signed-and-counted.md) showed why no test
noticed: the adapter only counts the reported packages.

</details>

## Check your understanding

::: check
**In a block at slot 14, a guarantee made at slot 10 puts its report on core 0. What does core 0 hold now?**

- [x] The whole guarantee, registered at slot 14
  > Yes: a pending report is the guarantee and τ′, this block's slot.
- [ ] The report, registered at slot 10, when the guarantee was made
  > No: the registered slot is the block's, 14, not the guarantee's own slot.
- [ ] Only the report's hash
  > No: the core holds the whole guarantee, report and signatures.

**That report never gets assured. At which slot does it time out?**

- [ ] 15: the next block's assurances are its only chance
  > No: it may wait several blocks for its assurances.
- [x] 19
  > Yes: 19 ≥ 14 + 5, U = 5 slots after it was registered ([lesson 11.2](../11-assurances/02-timeouts.md)).
- [ ] 20
  > No: off by one. At 19, the slot is already at least 14 + 5.

**In `high_work_report_gas-1`, core 0 gets package `0x63c0…` and core 1 gets `0x3165…`. In what order are the reported packages listed?**

- [ ] `0x63c0…`, then `0x3165…`, in core order
  > No: the reported packages are a dictionary, and a dictionary is sorted by key.
- [x] `0x3165…`, then `0x63c0…`, sorted by package hash
  > Yes: the key is the package hash. Cores go in core order, packages in hash order.
- [ ] Sorted by exports root
  > No: the exports root is the value, not the key. Here both are `0x5c9dca80…`
  > anyway.

**Core 0's report becomes available in this block. Can a guarantee in the same block put a new report on core 0?**

- [x] Yes: the assurances free the core first, and the guarantees use what's free
  > Yes: ρ′ is made from ρ‡, the cores after the assurances have done their clearing.
- [ ] No: a freed core stays empty until the next block
  > No: the guarantees come after the assurances in the same block, so they see the
  > core free.
- [ ] Yes, and it would even if the old report were still waiting
  > No: a core takes a report only when it's free. A waiting report keeps it.
:::

## What you have

Guarantors dealt, signatures checked, reporters counted, and every good report seated
on its core with its package noted for the history. So far, though, every guarantee in
a block has been taken at its word. [Lesson 12.4](./04-bad-guarantees.md) writes the rules that refuse a bad one.

Next: [12.4 Bad guarantees](./04-bad-guarantees.md)
