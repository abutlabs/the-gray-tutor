# Timeouts

A core holds one report at a time, so a report that never becomes available would block
its core forever. JAM won't allow that. This lesson writes the rule for when a core lets
go: the report made it, the report took too long, or the ground shifted under it.

## What the Gray Paper says

§11 again: ρ‡, the cores after the assurances. A core's pending report p is dropped
when any of these holds:

1. **p became available** ([lesson 11.1](./01-available.md)): its job on the core is done. It moves on to be
   accumulated ([Part 17](../17-accumulation/index.md)).
2. **p timed out**: the block's slot is at least p's `registered_slot` + U, where
   **U = 5** slots. Thirty seconds to gather its assurances, or it's out.
3. **The validator set changed size**: |κ| ≠ |κ′|. Every pending report goes. The Gray
   Paper only says such reports "can be viewed as having timed out early". A likely
   reason: each report's data was cut into one piece per validator ([lesson 3.3](../03-work-and-reports/03-a-work-report.md)), and a
   set of another size no longer matches its pieces. [Lesson 12.4](../12-guarantees/04-bad-guarantees.md) meets the rule behind it:
   a new report's shard count must equal the number of validators.

Otherwise p stays, and waits another block.

Try a report's whole life on tiny: six validators, two cores. Each block you import works
in order. Its disputes clear a report judged bad ([lesson 10.3](../10-disputes/03-clearing-the-cores.md)). Its assurances make a
report available, 5 of 6 in that one block, or let it time out. Then its guarantees put
new reports on the cores left free ([lesson 12.3](../12-guarantees/03-onto-the-cores.md)). Report A starts on core 0, registered
at slot 7: leave it alone until slot 12 and watch it go. Then try to guarantee a report
onto a core that is still busy. (The validator set never changes size here.)

<ReportLife />

## Splitting a function

`clearCores` needs to know *which cores* became available, and [lesson 11.1](./01-available.md)'s
`nowAvailable` already works that out, but only hands back the reports. So split it:
`availableCores` finds the cores, and `nowAvailable` turns them into reports. Same
behaviour, and now both users share the counting.

**Add to** `src/assurances.ts`

```ts
/** The cores whose pending report becomes available: more than 2/3 of κ hold its data. */
export function availableCores(
  cores: (PendingReport | null)[],
  assurances: Assurance[],
  validators: number, // |κ|
): number[] {
  const available: number[] = [];
  cores.forEach((pending, core) => {
    const assured = assuredCount(assurances, core);
    if (pending !== null && 3 * assured > 2 * validators) available.push(core);
  });
  return available;
}
```

**Replace in** `src/assurances.ts`

```ts
/** 𝐑: the reports that become available, core by core. */
export function nowAvailable(
  cores: (PendingReport | null)[],
  assurances: Assurance[],
  validators: number,
): WorkReport[] {
  const available = availableCores(cores, assurances, validators);
  return available.map((core) => (cores[core] as PendingReport).guarantee.report);
}
```

`cores[core] as PendingReport` tells TypeScript what you already know: `availableCores`
only returns cores that hold a report.

A split like this changes the shape, not the behaviour, so the tests you have should
still pass:

**Run**

```sh
npm test
```

```text
...
✔ bits are packed least significant first: 0x05 is cores 0 and 2 (0.8ms)
✔ 𝐑: a report becomes available when more than two thirds of κ hold its data (177.3ms)
✔ on tiny, 5 of 6 validators make a report available, and 4 don't (0.8ms)
...
ℹ tests 168
ℹ suites 0
ℹ pass 168
ℹ fail 0
...
reported 168 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791733590641
```

Same tests, same 168 passes: the shape changed, and nothing else did.

## The tests

**Replace in** `test/assurances.test.ts`

```ts
/** An assurances test vector: the parts of it this lesson uses. */
type AssurancesVector = {
  input: { assurances: unknown[]; slot: number };
  pre_state: { avail_assignments: unknown; curr_validators: unknown[]; post_validators: unknown[] };
  post_state: { avail_assignments: unknown };
  output: { err?: string; ok?: { reported: unknown[] } };
};
```

**Add to** `test/assurances.test.ts`

```ts
import { availableCores, clearCores } from "../src/assurances.ts";
import type { PendingReport } from "../src/cores.ts";

test("ρ‡: a core lets go of a report once available, timed out, or the set resizes", () => {
  let released = 0;
  for (const config of [TINY, FULL]) {
    for (const { name, vector } of acceptedVectors(config)) {
      const { input, pre_state, post_state } = vector;
      const cores = PendingReports(config).fromJson(pre_state.avail_assignments);
      const assurances = input.assurances.map((a) => Assurance(config).fromJson(a));
      const validators: number = pre_state.curr_validators.length;
      const available: number[] = availableCores(cores, assurances, validators);
      const resized: boolean = validators !== pre_state.post_validators.length;
      const after: (PendingReport | null)[] = clearCores(cores, available, input.slot, resized);
      const expected = PendingReports(config).fromJson(post_state.avail_assignments);
      assert.deepEqual(after, expected, name);
      released += cores.filter((p) => p !== null).length - after.filter((p) => p !== null).length;
    }
  }
  assert.equal(released, 87); // 6 on tiny, 81 on full
});

test("a report registered at slot 7 may wait through slot 11, and times out at 12", () => {
  const vector = vectorJson("stf/assurances/tiny/no_assurances-1.json") as AssurancesVector;
  const cores = PendingReports(TINY).fromJson(vector.pre_state.avail_assignments);
  const pending: PendingReport = { ...(cores[0] as PendingReport), registered_slot: 7 };
  const atEleven: (PendingReport | null)[] = clearCores([pending], [], 11, false);
  assert.deepEqual(atEleven, [pending]);
  const atTwelve: (PendingReport | null)[] = clearCores([pending], [], 12, false);
  assert.deepEqual(atTwelve, [null]); // 12 ≥ 7 + 5
});
```

The second test pins the timeout's edge: a report registered at slot 7 still holds its
core at slot 11 (11 < 12), and lets it go at 12, though that block's assurances can still
make it available. The vector `no_assurances_with_stale_report-1`
has exactly that case at tiny size. `{ ...pending, registered_slot: 7 }` copies a real
pending report with one field changed.

A stub that never lets go, with U already in place:

**Add to** `src/assurances.ts`

```ts
/** U: the slots a report may wait on its core for its data to become available. */
export const AVAILABILITY_TIMEOUT = 5;

export function clearCores(
  cores: (PendingReport | null)[],
  available: number[], // the cores whose report became available
  slot: number, // this block's slot
  resized: boolean, // |κ| ≠ |κ′|
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
✖ ρ‡: a core lets go of a report once available, timed out, or the set resizes (29.3ms)
✖ a report registered at slot 7 may wait through slot 11, and times out at 12 (15.4ms)
...
ℹ tests 170
ℹ suites 0
ℹ pass 168
ℹ fail 2
...
test at test/assurances.test.ts:81:1
✖ a report registered at slot 7 may wait through slot 11, and times out at 12 (15.4ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
  + actual - expected
...
    actual: [ { guarantee: [Object], registered_slot: 7 } ],
    expected: [ null ],
...
```

Two reds. The second is the shorter to read: at slot 12, the report registered at slot 7
should be gone (`expected: [ null ]`), and the stub kept it, `registered_slot: 7` and all.

## The code

**Replace in** `src/assurances.ts`

```ts
/**
 * ρ‡ (GP §11): a core lets go of its report when the report became available, when it
 * has waited U slots, or when the number of validators changed.
 */
export function clearCores(
  cores: (PendingReport | null)[],
  available: number[], // the cores whose report became available
  slot: number, // this block's slot
  resized: boolean, // |κ| ≠ |κ′|
): (PendingReport | null)[] {
  return cores.map((pending, core) => {
    if (pending === null) return null;
    const timedOut = slot >= pending.registered_slot + AVAILABILITY_TIMEOUT;
    return available.includes(core) || timedOut || resized ? null : pending;
  });
}
```

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ ρ‡: a core lets go of a report once available, timed out, or the set resizes (314.1ms)
✔ a report registered at slot 7 may wait through slot 11, and times out at 12 (0.4ms)
...
ℹ tests 170
ℹ suites 0
ℹ pass 170
ℹ fail 0
...
reported 170 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791733601118
...
```

87 cores freed across the accepted vectors, 6 on tiny and 81 on full, and every core
that should keep its report kept it.

## Watch it

**New file** `bin/release.ts`

```ts
// Shows what happens to each core's pending report in an assurances test vector: it
// became available, it timed out, the validator set resized, or it stays.
// Usage: npm run release <vector.json>, for example:
//   npm run release ../vectors/stf/assurances/tiny/no_assurances_with_stale_report-1.json

import { readFileSync } from "node:fs";
import { AVAILABILITY_TIMEOUT, availableCores } from "../src/assurances.ts";
import { Assurance } from "../src/block.ts";
import { FULL, TINY } from "../src/config.ts";
import { PendingReports } from "../src/cores.ts";
import { Run } from "../src/obs.ts";

const [file] = process.argv.slice(2);
const config = file.includes("/full/") ? FULL : TINY;
const { input, pre_state } = JSON.parse(readFileSync(file, "utf8"));
const cores = PendingReports(config).fromJson(pre_state.avail_assignments);
const assurances = input.assurances.map((a: unknown) => Assurance(config).fromJson(a));
const validators = pre_state.curr_validators.length;
const available = availableCores(cores, assurances, validators);
const next = pre_state.post_validators.length; // |κ′|
const resized = validators !== next;
const run = new Run("release");
cores.forEach((pending, core) => {
  if (pending === null) return;
  const since = pending.registered_slot;
  let fate = "stays";
  if (available.includes(core)) fate = "became available";
  else if (input.slot >= since + AVAILABILITY_TIMEOUT) fate = `timed out (waiting since ${since})`;
  else if (resized) fate = `cleared: κ goes from ${validators} to ${next}`;
  console.log(`core ${String(core).padStart(3)} at slot ${input.slot}: ${fate}`);
  run.event("core", { core, slot: input.slot, since, fate });
});
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

**What flows through it.** The block arrives at slot 12 carrying *no* assurances at
all, and both cores hold a pending report — one old, one fresh:

::: code-group

```json [what goes in]
{
  "slot": 12,
  "assurances": [],
  "avail_assignments": [
    { "guarantee": { … core 0's report … }, "registered_slot": 7 },
    { "guarantee": { … core 1's report … }, "registered_slot": 11 }
  ]
}
```

```ts [what it computes]
// bin/release.ts's fate for each core, nobody assuring either
const computed = {
  available: [], // no assurances, so no core crosses two thirds
  core0: "timed out", // 12 >= 7 + 5, the availability timeout: waited its five slots
  core1: "stays", // 12 < 11 + 5: only one slot so far
  resized: false, // κ stays 6 validators, so no sweep
};
```

```text [what comes out]
core   0 at slot 12: timed out (waiting since 7)
core   1 at slot 12: stays
```

:::

With `assurances` empty, availability can't release anything; what decides each core's
fate is arithmetic on two slots. Core 0 has sat since slot 7, and 12 ≥ 7 + 5, the
timeout. Core 1 has sat since slot 11: four slots still to wait.

**Run**

```sh
npm pkg set scripts.release="node bin/release.ts"
npm pkg set scripts.release-stale="node bin/release.ts ../vectors/stf/assurances/tiny/no_assurances_with_stale_report-1.json"
npm run release-stale
```

```text
core   0 at slot 12: timed out (waiting since 7)
core   1 at slot 12: stays
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=release-1791733608115
```

Two reports, nobody assuring either, and two different fates: one has waited its five
slots, the other has only waited one. Try
`val_set_size_change_clears_pending_reports-1.json`, where κ goes from 6 validators to
3 and the waiting report is swept away. The *Releases* panel, on **4 · Checks**, shows each
core's fate.

![Releases panel](./images/02-releases.png)

<details>
<summary>lasair: one pass, in <code>conformance/assurances_stf.ml</code></summary>

```ocaml
      let new_assignments = List.mapi (fun core assignment ->
        match assignment with
        | None -> None
        | Some ({ report = r; registered_slot; _ } as a) ->
          (* GP: cleared when tau' >= registered_slot + U (U = 5 slots) *)
          let is_stale = input.slot >= registered_slot + 5 in
          (* Check if core has achieved availability *)
          if core_counts.(core) >= threshold then begin
            available_reports := r :: !available_reports;
            None  (* Remove from assignments *)
          end else if is_stale || set_resized then
            None  (* Remove stale reports / early timeout on set resize *)
          else
            Some a
      ) pre.avail_assignments in
```

lasair does 𝐑 and ρ‡ in a single pass: each core either hands its report to the
available list and empties, or empties for a timeout or a resize, or keeps it. Yours
takes two smaller steps. Both are fine. One pass is a little faster; two steps are
easier to test one at a time.

</details>

## Check your understanding

::: check
**A report was registered at slot 7, and nobody assures it. At which slot does its core let go?**

- [ ] 11
  > No: 11 < 7 + 5. At slot 11 it may still wait.
- [x] 12
  > Yes: 12 ≥ 7 + 5 = 12. U is 5 slots, and at 12 they're up.
- [ ] 13
  > No: the rule is "at least registered slot + U", not "more than". 12 already
  > counts.

**In `assurances_for_stale_report-1`, the report from slot 7 gets all 6 assurances at slot 12, the slot it times out. What happens?**

- [x] It becomes available, and its core lets go
  > Yes: 𝐑 counts the assurances on the cores before any clearing. The vector reports
  > it, and its core empties either way.
- [ ] It's dropped as timed out, and the assurances are wasted
  > No: the timeout only decides whether the core keeps it. It doesn't stop it becoming
  > available.
- [ ] It earns five more slots on its core
  > No: assurances never reset the clock. A report leaves its core at its timeout at
  > the latest.

**In `val_set_size_change_clears_pending_reports-1`, κ goes from 6 validators to 3. Core 1's report was registered one slot ago, with no assurances. What happens to it?**

- [ ] It stays: it has only waited one slot
  > No: |κ| ≠ |κ′| clears every pending report, however new.
- [ ] It stays, and now needs more than two thirds of 3
  > No: it doesn't get to wait at all. A resize sweeps the cores.
- [x] It's dropped: the Gray Paper calls it "timed out early"
  > Yes: likely because its data was cut into one piece per validator of the old set,
  > and a set of another size no longer matches its pieces.

**Why does a pending report time out at all?**

- [x] A core holds one report at a time, so one that never became available would block it forever
  > Yes: after U slots the core lets go, and new work can take it.
- [ ] To punish guarantors whose reports are slow
  > No: nobody is punished here. The report is just dropped. Offenders only come from
  > disputes.
- [ ] Old reports can't be accumulated
  > No: what's accumulated is what became available. The timeout is about freeing the
  > core.
:::

## What you have

Your client reads every assurance, makes reports available, and frees the cores of
reports that made it, ran out of time, or outlived their validator set. Like the court
of [Part 10](../10-disputes/index.md), it still believes every assurance it's handed; [lesson 11.3](./03-bad-assurances.md) refuses the
broken ones.

Next: [11.3 Bad assurances](./03-bad-assurances.md)
