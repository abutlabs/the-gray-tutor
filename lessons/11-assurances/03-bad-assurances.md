# Bad assurances

So far your client has believed every assurance it was handed. A real block can carry a
broken one: signed with the wrong key, anchored on the wrong block, claiming a core with
nothing on it. This lesson writes down the five rules an assurance must keep and checks
them against every assurances vector, including the six on each size meant to fail.

## New words

- **Anchor.** The block an assurance was made on top of: it must be the parent of the
  block carrying it. *Example:* an assurance anchored two blocks back is refused.
- **Rejected block.** A block that breaks any rule. It's refused whole: nothing in it
  counts, and the state stays exactly as it was. *Example:* one bad signature among six
  assurances sinks the block.
- **Error name.** The test vectors' name for the rule a rejected block breaks.
  *Example:* `bad_signature`.

All three are in the [glossary](../glossary.md).

## What the Gray Paper says

§11.2, *The Assurances Extrinsic*. Every assurance in a block must keep five rules:

1. **Anchored on the parent.** Its anchor is H_P, the hash of the block before this one.
   (`bad_attestation_parent`)
2. **From a real validator.** Its index is below |κ|: there's no validator 6 among 6.
   (`bad_validator_index`)
3. **One per validator, in order.** The indices go strictly up: sorted, and no validator
   twice. (`not_sorted_or_unique_assurers`)
4. **Only cores with something on them.** A bit may be set only for a core with a report
   pending in ρ†, the cores after the judgments. (`core_not_engaged`)
5. **Signed.** By that validator's Ed25519 key in κ, over [lesson 5.3](../05-hashing-and-signatures/03-signatures.md)'s message: `jam_available`
   and the hash of the parent and the bitfield. (`bad_signature`)

Break any one and the whole block is invalid.

The Gray Paper says which rules hold, not which one to name first when several break.
The vectors pin that down in one place: an index past the end is named before an
unsorted list. Fair enough, since the Gray Paper's own type for an assurance (an index
*below |κ|*) makes such an assurance not even an assurance. The other choice is this
client's own: the signatures come last, because checking one is far slower than
comparing two numbers, so it's worth doing only once everything cheap has passed.

<AssuranceRules />

## The tests

The vectors give the block's parent too, so the test vector type grows a field:

**Replace in** `test/assurances.test.ts`

```ts
/** An assurances test vector: the parts of it this lesson uses. */
type AssurancesVector = {
  input: { assurances: unknown[]; slot: number; parent: string };
  pre_state: {
    avail_assignments: unknown;
    curr_validators: { ed25519: string }[];
    post_validators: unknown[];
  };
  post_state: { avail_assignments: unknown };
  output: { err?: string; ok?: { reported: unknown[] } };
};
```

**Add to** `test/assurances.test.ts`

```ts
import { assuranceError } from "../src/assurances.ts";

/** What the rules say of assurances vector `name`: null (accepted) or the rule broken. */
function verdict(config: Config, name: string) {
  const { input, pre_state } = vectorJson(name) as AssurancesVector;
  const assurances = input.assurances.map((a) => Assurance(config).fromJson(a));
  const keys = pre_state.curr_validators.map((k) => fromHex(k.ed25519)); // κ
  const cores = PendingReports(config).fromJson(pre_state.avail_assignments); // ρ†
  return assuranceError(assurances, fromHex(input.parent), keys, cores);
}

test("an assurance for a core with nothing on it is refused", () => {
  const name = "stf/assurances/tiny/assurance_for_not_engaged_core-1.json";
  const broken: string | null = verdict(TINY, name);
  assert.equal(broken, "core_not_engaged");
});

for (const config of [TINY, FULL]) {
  for (const name of vectorFiles(`stf/assurances/${config.name}`)) {
    test(`${name}: accepted or refused, as the vector says`, () => {
      const { output } = vectorJson(name) as AssurancesVector;
      const broken: string | null = verdict(config, name);
      const expected: string | null = output.err ?? null;
      assert.equal(broken, expected);
    });
  }
}
```

`verdict` reads a vector the way the rules need it: the assurances, the parent, κ's keys
(the vectors' `curr_validators`) and the cores. Every vector then gets one test: accepted
(`null`) or refused for the reason the vector gives.

A stub that accepts every assurance:

**Add to** `src/assurances.ts`

```ts
export function assuranceError(
  assurances: Assurance[],
  parent: Bytes, // H_P: the parent block's hash
  keys: Bytes[],
  cores: (PendingReport | null)[],
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
✖ an assurance for a core with nothing on it is refused (0.8ms)
✖ stf/assurances/tiny/assurance_for_not_engaged_core-1.json: accepted or refused, as the vector says (0.5ms)
✖ stf/assurances/tiny/assurance_with_bad_attestation_parent-1.json: accepted or refused, as the vector says (0.3ms)
✔ stf/assurances/tiny/assurances_for_stale_report-1.json: accepted or refused, as the vector says (0.2ms)
✖ stf/assurances/tiny/assurances_with_bad_signature-1.json: accepted or refused, as the vector says (0.3ms)
✖ stf/assurances/tiny/assurances_with_bad_validator_index-1.json: accepted or refused, as the vector says (0.2ms)
✖ stf/assurances/tiny/assurers_not_sorted_or_unique-1.json: accepted or refused, as the vector says (0.2ms)
✖ stf/assurances/tiny/assurers_not_sorted_or_unique-2.json: accepted or refused, as the vector says (0.2ms)
✔ stf/assurances/tiny/no_assurances-1.json: accepted or refused, as the vector says (0.2ms)
✔ stf/assurances/tiny/no_assurances_with_stale_report-1.json: accepted or refused, as the vector says (0.2ms)
✔ stf/assurances/tiny/some_assurances-1.json: accepted or refused, as the vector says (13.1ms)
✔ stf/assurances/tiny/val_set_size_change_clears_pending_reports-1.json: accepted or refused, as the vector says (1.7ms)
✖ stf/assurances/full/assurance_for_not_engaged_core-1.json: accepted or refused, as the vector says (11.0ms)
✖ stf/assurances/full/assurance_with_bad_attestation_parent-1.json: accepted or refused, as the vector says (12.5ms)
✔ stf/assurances/full/assurances_for_stale_report-1.json: accepted or refused, as the vector says (91.9ms)
✖ stf/assurances/full/assurances_with_bad_signature-1.json: accepted or refused, as the vector says (17.8ms)
✖ stf/assurances/full/assurances_with_bad_validator_index-1.json: accepted or refused, as the vector says (29.7ms)
✖ stf/assurances/full/assurers_not_sorted_or_unique-1.json: accepted or refused, as the vector says (10.7ms)
✖ stf/assurances/full/assurers_not_sorted_or_unique-2.json: accepted or refused, as the vector says (10.0ms)
...
ℹ tests 193
ℹ suites 0
ℹ pass 180
ℹ fail 13
...
test at test/assurances.test.ts:104:1
✖ an assurance for a core with nothing on it is refused (0.8ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected

  + null
  - 'core_not_engaged'
...
```

Thirteen reds, and look at the pattern in the list: every vector meant to fail is red,
on both sizes, and every vector meant to pass is already green, because the stub accepts
everything. The first failure says it in one line: `core_not_engaged` expected, `null`
given.

## The code

**Replace in** `src/assurances.ts`

```ts
import { assuranceSigned } from "./block.ts";
import { toHex } from "./bytes.ts";

/**
 * Are a block's assurances valid (GP §11.2)? The first rule they break, under the test
 * vectors' name for it, or null if they keep every rule. `keys` is κ's Ed25519 keys and
 * `cores` is ρ†, the cores after the judgments. The signatures go last: they're the slow
 * check.
 */
export function assuranceError(
  assurances: Assurance[],
  parent: Bytes, // H_P: the parent block's hash
  keys: Bytes[],
  cores: (PendingReport | null)[],
): string | null {
  const ordered = (a: Assurance, i: number) =>
    i === 0 || assurances[i - 1].validator_index < a.validator_index;
  const engaged = (a: Assurance) =>
    cores.every((pending, c) => pending !== null || !bitAt(a.bitfield, c));
  if (!assurances.every((a) => toHex(a.anchor) === toHex(parent))) return "bad_attestation_parent";
  if (!assurances.every((a) => a.validator_index < keys.length)) return "bad_validator_index";
  if (!assurances.every(ordered)) return "not_sorted_or_unique_assurers";
  if (!assurances.every(engaged)) return "core_not_engaged";
  if (!assurances.every((a) => assuranceSigned(keys, a))) return "bad_signature";
  return null;
}
```

Five rules, five lines, in the order above:

```ts
  if (!assurances.every((a) => toHex(a.anchor) === toHex(parent))) return "bad_attestation_parent";
  if (!assurances.every((a) => a.validator_index < keys.length)) return "bad_validator_index";
```

and so on down. `every` asks whether all the assurances keep a rule. `ordered` compares each assurance with the one before it, and `engaged` walks
every core and asks: a bit set here, with nothing on the core?

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ an assurance for a core with nothing on it is refused (0.3ms)
...
ℹ tests 193
ℹ suites 0
ℹ pass 193
ℹ fail 0
...
reported 193 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791733612505
...
```

## Watch it

**New file** `bin/check-assurances.ts`

```ts
// Checks the assurances of every assurances test vector of one size against the rules, and
// shows each verdict next to the vector's: accepted, or the rule it breaks.
// Usage: npm run check-assurances [tiny or full], tiny if not given

import { readdirSync, readFileSync } from "node:fs";
import { assuranceError } from "../src/assurances.ts";
import { Assurance } from "../src/block.ts";
import { fromHex } from "../src/bytes.ts";
import { FULL, TINY } from "../src/config.ts";
import { PendingReports } from "../src/cores.ts";
import { Run } from "../src/obs.ts";

const config = process.argv[2] === "full" ? FULL : TINY;
const dir = `../vectors/stf/assurances/${config.name}`;
const run = new Run("assurance-check");
for (const file of readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
  const { input, pre_state, output } = JSON.parse(readFileSync(`${dir}/${file}`, "utf8"));
  const assurances = input.assurances.map((a: unknown) => Assurance(config).fromJson(a));
  const keys = pre_state.curr_validators.map((k: { ed25519: string }) => fromHex(k.ed25519));
  const cores = PendingReports(config).fromJson(pre_state.avail_assignments);
  const ours = assuranceError(assurances, fromHex(input.parent), keys, cores) ?? "accepted";
  const theirs = output.err ?? "accepted";
  const name = file.replace(".json", "");
  console.log(`${name}: ${ours}${ours === theirs ? "" : ` (the vector says ${theirs})`}`);
  run.event("vector", { name, ours, theirs, agree: ours === theirs });
}
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

**What flows through it.** The program walks every tiny assurances vector. Two of the
refused ones, trimmed to the assurance that breaks a rule:

::: code-group

```text [what goes in]
assurances_with_bad_signature-1.json, input.assurances[0]:
  { "anchor": "0xd61a38a0…", "bitfield": "0x03", "validator_index": 0,
    "signature": "0x3dbe32bd…" }

assurance_for_not_engaged_core-1.json, input.assurances[0]:
  { … "bitfield": "0x03" … } with avail_assignments [ a pending report, null ]
```

```ts [what it computes]
// assuranceError's answer per vector, printed beside the vector's own output.err
const computed = {
  bad_signature: "validator 0's Ed25519 fails over jam_available ⌢ H(parent ⌢ bitfield)",
  core_not_engaged: "bitfield 0x03 sets core 1's bit, but core 1 has nothing pending",
};
```

```text [what comes out]
assurances_with_bad_signature-1: bad_signature
assurance_for_not_engaged_core-1: core_not_engaged
```

:::

The first assurance looks perfect and fails invisibly: only the signature check over
its bytes catches it. The second fails by shape alone — a set bit for a core with no
pending report is an assurance of nothing.

**Run**

```sh
npm pkg set scripts.check-assurances="node bin/check-assurances.ts"
npm run check-assurances
```

```text
assurance_for_not_engaged_core-1: core_not_engaged
assurance_with_bad_attestation_parent-1: bad_attestation_parent
assurances_for_stale_report-1: accepted
assurances_with_bad_signature-1: bad_signature
assurances_with_bad_validator_index-1: bad_validator_index
assurers_not_sorted_or_unique-1: not_sorted_or_unique_assurers
assurers_not_sorted_or_unique-2: not_sorted_or_unique_assurers
no_assurances-1: accepted
no_assurances_with_stale_report-1: accepted
some_assurances-1: accepted
val_set_size_change_clears_pending_reports-1: accepted
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=assurance-check-1791733621501
```

Eleven vectors, eleven verdicts, no "the vector says" anywhere. `npm run check-assurances
full` does the same for the full vectors. The *Assurance checks* panel keeps the list.

![Assurance checks panel](./images/03-assurance-checks.png)

## The scoreboard

An assurances vector runs whole in three parts: the block refused for the vector's
reason, or accepted; then the output, the reports that just became available, 𝐑; and
ρ‡, the cores without them and without the ones that timed out. The validator sets are
only read.

**Add to** `test/families.ts`

```ts
import { Assurance } from "../src/block.ts";
import { WorkReport } from "../src/work.ts";
import { assuranceError, availableCores, clearCores, nowAvailable } from "../src/assurances.ts";

type AssurancesInput = { assurances: unknown[]; slot: number; parent: string };
type AssurancesState = {
  avail_assignments: unknown;
  curr_validators: unknown[];
  post_validators: unknown[];
};

/** An assurances vector: 𝐑, the reports made available, and ρ‡, or the rule broken. */
function checkAssurances(name: string) {
  const vector = vectorJson(name) as StfVector<AssurancesInput, AssurancesState>;
  const config = configOf(name);
  const { input, pre_state } = vector;
  const cores = PendingReports(config).fromJson(pre_state.avail_assignments);
  const assurances = input.assurances.map((a) => Assurance(config).fromJson(a));
  const active = keys(pre_state.curr_validators);
  const ed25519 = active.map((k) => k.ed25519);
  const error = assuranceError(assurances, fromHex(input.parent), ed25519, cores);
  sameError(error, vector);
  if (error) return unchanged(vector, []);
  const ok = vector.output?.ok as { reported: unknown[] };
  const reported = ok.reported.map((r) => WorkReport.fromJson(r));
  assert.deepEqual(nowAvailable(cores, assurances, active.length), reported, "reported differs");
  const available = availableCores(cores, assurances, active.length);
  const resized = active.length !== pre_state.post_validators.length;
  const after = clearCores(cores, available, input.slot, resized);
  const expected = PendingReports(config).fromJson(vector.post_state.avail_assignments);
  assert.deepEqual(after, expected, "avail_assignments differs");
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
];
```

One of the 22 that the milestone counts, a block whose assurances include a forged signature:

::: code-group

```json [what goes in]
{
  "vector": "vectors/stf/assurances/tiny/assurances_with_bad_signature-1.json",
  "input.assurances": [
    {
      "validator_index": 0,
      "bitfield": "0x03",
      "anchor": "0xd61a38a0f7…",
      "signature": "0x3dbe32bd0a…"
    },
    {
      "validator_index": 1,
      "bitfield": "0x02",
      "anchor": "0xd61a38a0f7…",
      "signature": "0x44e668f7d7…"
    },
    "… more assurances, one with a signature that is not its validator's …"
  ],
  "output": {
    "err": "bad_signature"
  }
}
```

```text [console]
stf/assurances           22 of 22  ✔
168 of 1,428 vectors pass.
```

:::

*Run whole* means your client reads every assurance, checks every signature and bitfield, and must refuse this block with the vector's own reason, `bad_signature`; the `stf/assurances` row counts it only then.

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
stf/reports              not run yet (92)
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

168 of 1,428 vectors pass.
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=scoreboard-1791939213633
```

> [!TIP] Milestone
> **Every assurances vector.** All 22, tiny and full, whole: the reports that
> became available, the cores freed, and every bad assurance refused for the vector's
> reason.

<details>
<summary>lasair: the same rules, in <code>conformance/assurances_stf.ml</code></summary>

The index first, then the order:

```ocaml
      if a.validator_index < 0 || a.validator_index >= List.length pre.curr_validators then
        Result.Error "bad_validator_index"
```

```ocaml
    if not (check_assurers_sorted_unique input.assurances) then
      Result.Error "not_sorted_or_unique_assurers"
```

Then lasair takes one assurance at a time: its anchor, its cores, its signature. Its own
comment on the cores check says why that one comes early:

```ocaml
        (* Check that ALL cores in bitfield have an assignment (before signature) *)
```

The same two choices as yours: an index past the end is named first, and the signature
waits for everything cheaper.

</details>

## Check your understanding

::: check
**One assurance in a block sets the bit for a core with nothing on it. What happens?**

- [ ] That bit is ignored, and the rest of the block counts
  > No: one broken assurance sinks the block. Nothing in it counts.
- [x] The whole block is refused, `core_not_engaged`, and the state stays as it was
  > Yes: rule 4. There's no data on an empty core to hold, so the bit can't be true.
- [ ] The assurance counts for that core once a report arrives
  > No: nothing carries over. An assurance only counts in its own block.

**An assurance is anchored on the block two back, not the parent. What happens?**

- [ ] Fine: any of the last eight blocks will do
  > No: that's a guarantee's anchor, in [lesson 9.2](../09-recent-history/02-recent-blocks.md). An assurance's anchor must be the
  > parent.
- [ ] Fine, as long as its bits are for cores with reports
  > No: every rule must hold. The anchor rule alone refuses the block.
- [x] The block is refused, `bad_attestation_parent`
  > Yes: rule 1. Its anchor must be H_P, the block this one is built on.

**On tiny, a block's assurances come from validators 2, 1 and 6, in that order. Which error do the vectors give?**

- [ ] `not_sorted_or_unique_assurers`: 2 before 1
  > No: the list is out of order, but the vectors name an index past the end first.
- [x] `bad_validator_index`: 6 isn't below |κ| = 6
  > Yes: there's no validator 6 among 6. The Gray Paper's own type makes it not even an
  > assurance.
- [ ] `bad_signature`: there's no key for validator 6
  > No: the signatures are checked last. The index rule catches 6 well before.

**Why does this client check the signatures last?**

- [x] A signature is far slower to check than two numbers are to compare
  > Yes: it's worth checking only once everything cheap has passed.
- [ ] The Gray Paper says to
  > No: the Gray Paper says which rules hold, not which to check first. The order is
  > the client's choice.
- [ ] So a block with a bad anchor and a bad signature gets `bad_signature`
  > No: the other way round. With signatures last, that block gets
  > `bad_attestation_parent`.
:::

## What you have

Assurances that are checked, not trusted: five rules, and every official assurances
vector, tiny and full, accepted or refused just as it should be and passing whole. [Part
11](./index.md) is done. A
report reaches a core in the first place because guarantors vouch for it, and
[Part 12](../12-guarantees/index.md) checks their guarantees.

Next: [Part 12 · Guarantees](../12-guarantees/index.md)
