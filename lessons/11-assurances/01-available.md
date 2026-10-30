# Available

A guaranteed work-report sits on its core ([lesson 10.3](../10-disputes/03-clearing-the-cores.md)) until JAM is sure its data won't
vanish: enough validators must hold their pieces of it. Every block, validators send
*assurances*, [lesson 4.2](../04-blocks/02-tiny-and-full.md)'s bitfields: one bit per core, 1 meaning "I hold my share of
this core's data". Count the 1s for a core, and if more than two thirds of the
validators say so, the report is *available*. This lesson counts.

## New words

- **Assurance and availability.** Each validator signs one bit per core: "I hold my piece
  of this core's data". When more than two thirds of them do, the core's report is
  *available*. *Example:* on tiny, 5 of the 6 validators.

It's in the [glossary](../glossary.md).

## What the Gray Paper says

§11 (*Package Availability Assurances*). Each assurance carries a bitfield of C bits.

**Which bit is which core?** Appendix C packs bits into bytes **least significant
first**: core 0 is the lowest bit of byte 0, core 7 the highest, core 8 the lowest bit
of byte 1. So `0x05`, `0b0000_0101`, means cores 0 and 2.

Careful: that's the *opposite* of [lesson 6.1](../06-state-and-merklization/01-the-state-trie.md)'s trie, which reads key bits most
significant first. JAM uses both orders, each in its own place. Mixing them up is a
classic way to spend an afternoon.

**When is a report available?** 𝐑, the newly available reports, takes the cores in
order, and a core's report joins 𝐑 if the number of assurances with its bit set is
greater than ⅔·|κ|: more than two thirds of the current validators. With 6 validators
that's 5 or more; with 1,023, it's 683 or more.

To stay in whole numbers, multiply both sides by 3: assured × 3 > validators × 2. No
fractions, no rounding, no floating point.

Try it on tiny: six validators, each with its one-byte bitfield, two cores. It starts with
the counts the third test below reads from a vector, 5 for core 0 and 4 for core 1:

<AssuranceGrid />

## The tests

**New file** `test/assurances.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { assuredCount, bitAt, nowAvailable } from "../src/assurances.ts";
import { Assurance } from "../src/block.ts";
import { fromHex } from "../src/bytes.ts";
import type { Config } from "../src/config.ts";
import { FULL, TINY } from "../src/config.ts";
import { PendingReports } from "../src/cores.ts";
import { WorkReport } from "../src/work.ts";
import { vectorFiles, vectorJson } from "./vectors.ts";
import type { Bytes } from "../src/bytes.ts";

test("bits are packed least significant first: 0x05 is cores 0 and 2", () => {
  const bitfield: Bytes = fromHex("0x05"); // 0000 0101
  const bits: boolean[] = [0, 1, 2, 3].map((c) => bitAt(bitfield, c));
  assert.deepEqual(bits, [true, false, true, false]);
  const core8: boolean = bitAt(fromHex("0x0001"), 8); // core 8: the lowest bit of byte 1
  assert.equal(core8, true);
});

/** An assurances test vector: the parts of it this lesson uses. */
type AssurancesVector = {
  input: { assurances: unknown[]; slot: number };
  pre_state: { avail_assignments: unknown; curr_validators: unknown[] };
  output: { err?: string; ok?: { reported: unknown[] } };
};

/** The accepted assurances vectors of a size: a rejected block changes nothing. */
function acceptedVectors(config: Config): { name: string; vector: AssurancesVector }[] {
  return vectorFiles(`stf/assurances/${config.name}`)
    .map((name) => ({ name, vector: vectorJson(name) as AssurancesVector }))
    .filter(({ vector }) => !vector.output.err);
}

test("𝐑: a report becomes available when more than two thirds of κ hold its data", () => {
  let available = 0;
  for (const config of [TINY, FULL]) {
    for (const { name, vector } of acceptedVectors(config)) {
      const { input, pre_state, output } = vector;
      const cores = PendingReports(config).fromJson(pre_state.avail_assignments);
      const assurances = input.assurances.map((a) => Assurance(config).fromJson(a));
      const validators: number = pre_state.curr_validators.length;
      const reports: WorkReport[] = nowAvailable(cores, assurances, validators);
      const expected: WorkReport[] = (output.ok?.reported ?? []).map((r) => WorkReport.fromJson(r));
      assert.deepEqual(reports, expected, name);
      available += reports.length;
    }
  }
  assert.equal(available, 53); // 4 on tiny, 49 on full
});

test("on tiny, 5 of 6 validators make a report available, and 4 don't", () => {
  // 3 × 5 = 15 > 12 = 2 × 6, but 3 × 4 = 12 is not
  const vector = vectorJson("stf/assurances/tiny/some_assurances-1.json") as AssurancesVector;
  const assurances = vector.input.assurances.map((a) => Assurance(TINY).fromJson(a));
  const counts: number[] = [0, 1].map((core) => assuredCount(assurances, core));
  assert.deepEqual(counts, [5, 4]);
});
```

The second test checks 𝐑, the list of newly available reports, against every accepted
vector, in core order. The third looks inside one tiny vector: core 0 gets 5 assurances
and core 1 gets 4, just either side of the line.

## The code

**New file** `src/assurances.ts`

```ts
// Assurances (GP §11): validators say which cores' data they hold, and a report whose data
// enough of them hold becomes available.

import type { Assurance } from "./block.ts";
import type { Bytes } from "./bytes.ts";
import type { PendingReport } from "./cores.ts";
import type { WorkReport } from "./work.ts";

/** Bit c of a bitfield. Bits are packed least significant first (GP App. C). */
export function bitAt(bitfield: Bytes, c: number): boolean {
  return ((bitfield[Math.floor(c / 8)] >> (c % 8)) & 1) === 1;
}

/** How many assurances say "I hold this core's data". */
export function assuredCount(assurances: Assurance[], core: number): number {
  return assurances.filter((assurance) => bitAt(assurance.bitfield, core)).length;
}

/** 𝐑: the reports that become available, core by core: more than 2/3 of κ assure them. */
export function nowAvailable(
  cores: (PendingReport | null)[],
  assurances: Assurance[],
  validators: number, // |κ|
): WorkReport[] {
  const available: WorkReport[] = [];
  cores.forEach((pending, core) => {
    const assured = assuredCount(assurances, core);
    if (pending !== null && 3 * assured > 2 * validators) available.push(pending.guarantee.report);
  });
  return available;
}
```

`bitAt` is [lesson 6.1](../06-state-and-merklization/01-the-state-trie.md)'s `bit`, flipped:

```ts
  return ((bitfield[Math.floor(c / 8)] >> (c % 8)) & 1) === 1;
```

`>> (c % 8)` instead of `>> (7 - (i % 8))`: least significant first instead of most. (And
it answers `true` or `false`.)

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ bits are packed least significant first: 0x05 is cores 0 and 2 (10.1ms)
✔ 𝐑: a report becomes available when more than two thirds of κ hold its data (144.7ms)
✔ on tiny, 5 of 6 validators make a report available, and 4 don't (1.1ms)
...
ℹ tests 168
ℹ suites 0
ℹ pass 168
ℹ fail 0
...
reported 168 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791733586523
...
```

53 reports became available across the accepted vectors, every one of them in the right
order: 4 on tiny, 49 on full.

## Watch it

**New file** `bin/available.ts`

```ts
// Counts, core by core, how many validators of an assurances test vector hold each pending
// report's data, and which reports become available.
// Usage: npm run available <vector.json>, e.g.
//        npm run available ../vectors/stf/assurances/tiny/some_assurances-1.json

import { readFileSync } from "node:fs";
import { assuredCount } from "../src/assurances.ts";
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
const run = new Run("available");
let available = 0;
cores.forEach((pending, core) => {
  if (pending === null) return;
  const assured = assuredCount(assurances, core);
  const now = 3 * assured > 2 * validators;
  if (now) available++;
  const verdict = now ? "available!" : "still waiting";
  const where = `core ${String(core).padStart(3)}`;
  console.log(`${where}: ${assured} of ${validators} hold its data: ${verdict}`);
  run.event("core", { core, assured, validators, available: now });
});
console.log(`reports that became available: ${available}`);
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

**What flows through it.** Six assurances, one per validator, each a bitfield with one
bit per core; both tiny cores have a report pending in `pre_state.avail_assignments`:

::: code-group

```json [what goes in]
{
  "assurances": [
    { "validator_index": 0, "bitfield": "0x02", "anchor": "0xd61a38a0…", "signature": "0xf23ddcfb…" },
    { "validator_index": 1, "bitfield": "0x01", "anchor": "0xd61a38a0…", "signature": "0x3b00faaf…" },
    … four more: validators 2, 3 and 4 say "0x03", validator 5 says "0x01" …
  ],
  "avail_assignments": [ { … core 0's pending report … }, { … core 1's pending report … } ]
}
```

```ts [what it computes]
// bin/available.ts's tally: a bitfield's bit c set means "I hold my share of core c"
const computed = {
  core0: 5, // bit 0 set in 0x01 and 0x03: validators 1, 2, 3, 4 and 5
  core1: 4, // bit 1 set in 0x02 and 0x03: validators 0, 2, 3 and 4
  needed: "3·assured > 2·6, so 5 or more of 6", // more than two thirds
  available: 1, // core 0 crosses the line; core 1 misses it by one
};
```

```text [what comes out]
core   0: 5 of 6 hold its data: available!
core   1: 4 of 6 hold its data: still waiting
```

:::

Read a `bitfield` in binary and the tabs connect: `0x03` is both cores, `0x01` core 0
only, `0x02` core 1 only. Five validators set core 0's bit and 3·5 > 2·6, so its
report crosses the supermajority line; four set core 1's, one short, still waiting.

**Run**

```sh
npm pkg set scripts.available="node bin/available.ts"
npm pkg set scripts.available-some="node bin/available.ts ../vectors/stf/assurances/tiny/some_assurances-1.json"
npm run available-some
```

```text
core   0: 5 of 6 hold its data: available!
core   1: 4 of 6 hold its data: still waiting
reports that became available: 1
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=available-1791733590339
```

Now the full-size version, `../vectors/stf/assurances/full/some_assurances-1.json`. Its
cores alternate: 683 of 1023, *available*; 682 of 1023, *still waiting*. The test
vectors sit exactly on the line, one validator either side, which is precisely where a
`>=` instead of a `>` would be caught. The *Availability* panel, on the **4 · Checks**
dashboard, lists every core.

![Availability panel](./images/01-availability.png)

<details>
<summary>lasair: the threshold, in <code>conformance/assurances_stf.ml</code></summary>

```ocaml
      (* Determine threshold for availability (strict 2/3 supermajority)
         Need MORE than 2/3, so: floor(2n/3) + 1
         For n=6: floor(12/3) + 1 = 4 + 1 = 5 *)
      (* GP 0.8.0: relative to |kappa| (the set the assurers signed under) *)
      let threshold = (2 * List.length pre.curr_validators) / 3 + 1 in
```

"More than two thirds", written another way: at least ⌊2n/3⌋ + 1, compared with `>=`.
Your `3 * assured > 2 * validators` and lasair's threshold agree for every n: two
whole-number spellings of the same fraction. Pick the one you can check in your head.

</details>

## Check your understanding

::: check
**Validator 3's assurance has core 0's bit set. What does that say?**

- [ ] Core 0's report is correct
  > No: an assurance says nothing about whether the work is right. That's for the
  > disputes of [Part 10](../10-disputes/index.md).
- [x] Validator 3 holds its piece of core 0's data
  > Yes: one bit per core, 1 meaning "I hold my share of this core's data".
- [ ] Validator 3 guaranteed core 0's report
  > No: guaranteeing is vouching for the work. Assuring is only holding a piece of its
  > data.

**On tiny, a core's report has 4 of the 6 validators' assurances. Is it available?**

- [ ] Yes: 4 is two thirds of 6
  > No: two thirds isn't enough. It takes *more* than two thirds: 3 × 4 = 12 is not
  > greater than 2 × 6 = 12.
- [ ] Yes: a majority holds the data
  > No: half plus one isn't the line. More than two thirds is.
- [x] Not yet: it needs 5 or more
  > Yes: 3 × 5 = 15 > 12. In `some_assurances-1`, core 0 has 5 and becomes
  > available, core 1 has 4 and waits.

**On full, an assurance's bitfield starts `05 01`. Which cores does it hold?**

- [x] Cores 0, 2 and 8
  > Yes: least significant bit first. `05` is `0b0000_0101`, bits 0 and 2. `01` is byte
  > 1's lowest bit, core 8.
- [ ] Cores 5, 7 and 15
  > No: that reads each byte's bits from the left, as the trie of [lesson 6.1](../06-state-and-merklization/01-the-state-trie.md) does.
  > Bitfields go the other way.
- [ ] Cores 5 and 1
  > No: the bytes aren't core numbers. Each byte is 8 cores' bits.

**On full, `some_assurances-1` gives its cores 683 and 682 assurances, alternately. Why those counts?**

- [x] They sit either side of the line, so a client using "at least two thirds" is caught
  > Yes: 3 × 682 = 2,046 = 2 × 1,023 exactly: two thirds, not more. A `>=` would make
  > it available.
- [ ] Any counts would test the rule as well
  > No: counts far from the line pass with `>` and `>=` alike. Only the edge tells them
  > apart.
- [ ] 683 is as many as a core can get, like a verdict's 683 votes
  > No: a verdict carries 683 votes, but any validator may assure. A core can get all
  > 1,023.
:::

## What you have

Your client can read a bitfield the right way round, count assurances per core, and say
which reports just became available. A report that never gets there can't sit on its
core forever, though: [lesson 11.2](./02-timeouts.md) decides when a core lets go.

Next: [11.2 Timeouts](./02-timeouts.md)
