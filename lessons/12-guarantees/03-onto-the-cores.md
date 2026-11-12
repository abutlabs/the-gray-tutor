# Onto the cores

**In one sentence:** a guaranteed report takes the core it names, if that core is free,
and waits there for its data, while the block notes which packages it reported.

A real block's two guarantees, and two empty cores. Place them one at a time, and watch
the cores and the reported list fill.

<a id="try-it"></a>

<OntoCores />

## The idea

The guarantors are the right ones ([lesson 12.1](./01-who-guarantees-what.md)). Their
signatures are real ([lesson 12.2](./02-signed-and-counted.md)). Where does the report
go now?

Onto its core. Each guaranteed report takes the core it names, and starts waiting there
for its data to become available. That is where [Part 11](../11-assurances/index.md)
picks it up, next block.

A core is like a parking space: it holds one report at a time. So a core can take a new
report only if it's free, after the disputes and the assurances have done their
clearing. The report is stamped with the block's slot, and the timeout clock of
[lesson 11.2](../11-assurances/02-timeouts.md) runs from there.

The block also makes a note of the packages it reported, for the recent history
([Part 9](../09-recent-history/index.md)) to remember. The note is kept in the order of
the packages' hashes, not the order the guarantees came in.

This lesson seats the reports and writes the note.

## What the Gray Paper says

::: gray-paper 11.5

#### §11.5 Transitioning for Reports {#gp-11-5}

<a id="gp-11-5-p1"></a>We define $\rho'$ as being equivalent to $\rho^\ddagger$, except where the extrinsic replaced an entry. In the case an entry is replaced, the new value includes the present time $\tau'$ so that it can be cleared if it is not made available quickly enough (see equation [11.18](../11-assurances/02-timeouts.md#eq-11-18)).

<a id="gp-11-5-p2"></a><a id="eq-11-46"></a>

$$
\begin{equation}
\forall c \in \mathbb{N}_{\mathsf{C}} : \rho'\left[c\right] \equiv \begin{cases}
\left(\mathbf{g},\,t\mathrel{\unicode{x2AF6}}\tau'\right) &\text{if } \exists \mathbf{g} \in \mathbf{E}_G, (\mathbf{g}_{\mathbf{r}})_{c} = c \\
\rho^\ddagger\left[c\right] &\text{otherwise}
\end{cases} \tag{11.46}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-forall">$\forall$</span> | for all | for every value: ∀c ∈ ℕ_C means for each core c |
| <span id="gk-cX">$c$</span> | c | a core's index, 0 to C − 1 |
| <span id="gk-in">[$\in$](../symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-coreindex" class="gk-wrap">$\mathbb{N}_{\mathsf{C}}$</span> | N sub C | the core indices: 0 to C − 1 |
| <span id="gk-availassignmentspostguarantees" class="gk-wrap">$\rho'$</span> | rho prime | the cores after this block's guarantees: each core's pending report and its slot, or nothing |
| <span id="gk-subb">[$\left[x\right]$](../symbols.md#sequence)</span> | at | x[i]: the item at index i, or the value at key i |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-aa-guarantee" class="gk-wrap">$\mathbf{g}$</span> | bold g | the guarantee a core's pending report came with: the report and its guarantors' signatures |
| <span id="gk-is">$x\mathrel{\unicode{x2AF6}} y$</span> | is a | names a field and gives its type, in a tuple |
| <span id="gk-aa-timestamp">$t$</span> | t | the slot a pending report arrived on its core |
| <span id="gk-thetime" class="gk-wrap">$\tau$</span> | tau | the time: the latest block's timeslot |
| <span id="gk-exists">[$\exists$](../symbols.md#exists)</span> | there exists | there is at least one value such that what follows holds |
| <span id="gk-xtguarantees" class="gk-wrap">$\mathbf{E}_G$</span> | E sub G | the guarantees bag: work-reports with their guarantors' signatures, one per core at most |
| <span id="gk-g-workreport" class="gk-wrap">$\mathbf{r}$</span> | r | a guarantee's work-report: 𝐠_𝐫 is the report it vouches for |
| <span id="gk-availassignmentspostassurances" class="gk-wrap">$\rho^\ddagger$</span> | rho double dagger | the pending reports midway: after the available ones and the timed-out ones left |

</details>

→ [(11.46) in plain words](./gray-paper.md#ex-11-46)

<a id="gp-11-5-p3"></a>It is worth noting that $\rho'\left[c\right]$ is always $\emptyset$ for $c \ge {}^{\left\vert\kappa'\right\vert}\!/_{3}$; this in particular ensures that we will never have more reports to audit than can safely be managed with the number of active validators.

<a id="gp-11-5-p4"></a>This concludes the section on reporting and assurance. We now have a complete definition of $\rho'$ together with $\mathbf{R}$ to be utilized in section [12](../17-accumulation/index.md#gp-12-p1), describing the portion of the state transition happening once a work-report is guaranteed and made available.

:::

§11.5 (*Transitioning for Reports*) defines ρ′, the cores after the guarantees. Each
guarantee's report goes on the core it names, as a pending report: the whole guarantee,
registered at τ′, this block's slot. A
core can only take a report if it's free, after the disputes ([lesson 10.3](../10-disputes/03-clearing-the-cores.md)) and the
assurances ([lesson 11.2](../11-assurances/02-timeouts.md)) have done their clearing. Every other core keeps what it had.

**The reported packages** are a dictionary: each reported work-package's hash, mapped to
the root of the segments it exports. [Lesson 9.2](../09-recent-history/02-recent-blocks.md)'s `recordBlock` takes exactly these, as
`work_packages`. A dictionary is kept **sorted by key**, so they're listed by package
hash, not in the order the guarantees came. ([Lesson 9.2](../09-recent-history/02-recent-blocks.md) left sorting to the [hardening
pass](https://github.com/abutlabs/the-gray-tutor/blob/main/HARDENING.md). Here the vectors insist on it.)

Step the two guarantees onto the cores [at the top](#try-it): the cores fill in core
order, the reported list in hash order.

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

The vectors write the reported packages as `work_package_hash` and `segment_tree_root`.
The history vectors called the same two things `hash` and `exports_root`. Your client
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
the tests again: `high_work_report_gas-1` fails (the tiny one stops the test first; the
full one would too). Its guarantees list package `0x63c0…` before `0x3165…`, and the
dictionary wants them the other way round.

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
[lesson 11.2](../11-assurances/02-timeouts.md)'s timeout clock. Notice the two orders. `avail_assignments` fills in core
order. The reported list sorts by package hash, which is why `0x316504b8…` leads it
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

Cores in core order, packages in hash order. Now try `with_avail_assignments-1`, where
one core is already taken and the new report takes a free one. The *Placed* panel, on
**4 · Checks**, shows both lists.

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
**A guarantee made a few slots ago puts its report on a core in this block. What does the core hold now?**

- [ ] The report, registered at the slot the guarantee was made
  > No: the registered slot is the block's, not the guarantee's own.
- [x] The whole guarantee, registered at this block's slot
  > Yes: a pending report is the guarantee and τ′, this block's slot.
- [ ] Only the report's hash
  > No: the core holds the whole guarantee, report and signatures.

**Why is the report stamped with the block's slot?**

- [ ] The guarantee's own slot isn't in the block
  > No: a guarantee carries the slot it was made at. That slot picks the rotation its
  > signers answer to ([lesson 12.1](./01-who-guarantees-what.md)).
- [ ] The two are always the same slot
  > No: a guarantee can be made in the rotation before its block's, and still count.
- [x] The timeout clock runs from when the report took its core
  > Yes: [lesson 11.2](../11-assurances/02-timeouts.md) lets a core go a fixed number of slots after its report was
  > registered, and registered means placed.

**Core 0's report becomes available in this block. Can a guarantee in the same block put a new report on core 0?**

- [x] Yes: the assurances free the core first, and the guarantees use what's free
  > Yes: ρ′ is made from ρ‡, the cores after the assurances have done their clearing.
- [ ] No: a freed core stays empty until the next block
  > No: the guarantees come after the assurances in the same block, so they see the
  > core free.
- [ ] Yes, and it would even if the old report were still waiting
  > No: a core takes a report only when it's free. A waiting report keeps it.

**Why are the reported packages listed by package hash, and not in the order the guarantees came?**

- [ ] The two orders are always the same
  > No: in `high_work_report_gas-1` the guarantees list `0x63c0…` before `0x3165…`, and
  > the reported list wants them the other way round.
- [ ] They are sorted by exports root
  > No: the exports root is the value, not the key.
- [x] They are a dictionary, and a dictionary is kept sorted by key
  > Yes: the key is the package hash. Cores go in core order, packages in hash order.
:::

## What you have

Guarantors dealt, signatures checked, reporters counted, and every good report seated
on its core with its package noted for the history. So far, though, every guarantee in
a block has been taken at its word. [Lesson 12.4](./04-bad-guarantees.md) writes the rules that refuse a bad one.

Next: [12.4 Bad guarantees](./04-bad-guarantees.md)
