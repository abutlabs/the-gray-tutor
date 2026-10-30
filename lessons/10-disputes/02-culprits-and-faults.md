# Culprits and faults

A verdict says what's true. Now the consequences: anyone who put their name to a
falsehood is named in the block as an **offender**, with their own signature as the
evidence. Two kinds of offender, two kinds of evidence:

- a **culprit** guaranteed a report that turned out *bad*. Exhibit A: their guarantee.
- a **fault** voted against the verdict: "valid" on a bad report, or "invalid" on a good
  one. Exhibit A: their vote.

Offenders are remembered forever in ψ_O, and [lesson 8.2](../08-safrole/02-rotating-the-validators.md)'s Φ keeps them out of the next
validator set. This lesson checks the evidence and keeps the record.

## What the Gray Paper says

§10 again.

- A **culprit** (r, k, s) is valid if s is k's Ed25519 signature on `$jam_guarantee` ⌢ r,
  the very message a guarantor signs when vouching for report r. (The `$` is notation;
  the bytes are `jam_guarantee`.)
- A **fault** (r, v, k, s) is valid if s is k's signature on the vote v about r:
  `$jam_valid` or `$jam_invalid`, then r, exactly like [lesson 10.1](./01-votes-and-verdicts.md)'s votes.
- **ψ′_O**, the offenders, gains every culprit's and every fault's key.
- **The offenders mark** ([lesson 4.6](../04-blocks/06-the-header.md)'s `offenders_mark`) lists the same keys: the
  culprits' first, then the faults', in the order the block gives them.

<Offenders />

More rules say *which* offenders may appear: a culprit's report must really be bad, a
fault's vote must really contradict the verdict, an offender must be a current or previous
validator and not already punished. [Lesson 10.5](./05-bad-culprits-and-faults.md) adds that fine print; for now,
check the evidence and keep the record.

## The tests

The vector type learns about the offenders mark:

**Replace in** `test/disputes.test.ts`

```ts
/** A disputes test vector: the parts of it this lesson uses. */
type DisputesVector = {
  input: { disputes: unknown };
  pre_state: { psi: unknown; tau: number; kappa: unknown[]; lambda: unknown[] };
  post_state: { psi: unknown };
  output: { err?: string; ok?: { offenders_mark: string[] } };
};
```

**Add to** `test/disputes.test.ts`

```ts
import { culpritSigned, faultSigned, offendersMark, recordOffenders } from "../src/disputes.ts";
import { toHex } from "../src/bytes.ts";
import type { Bytes } from "../src/bytes.ts";

test("every culprit's guarantee and every fault's vote is really theirs", () => {
  for (const config of [TINY, FULL]) {
    for (const { name, vector } of acceptedVectors(config)) {
      const { culprits, faults } = DisputesExtrinsic.fromJson(vector.input.disputes);
      for (const culprit of culprits) {
        const signed: boolean = culpritSigned(culprit);
        assert.ok(signed, name);
      }
      for (const fault of faults) {
        const signed: boolean = faultSigned(fault);
        assert.ok(signed, name);
      }
    }
  }
});

test("a forged guarantee is caught", () => {
  const vector = vectorJson("stf/disputes/tiny/progress_with_bad_signatures-2.json");
  const { culprits } = DisputesExtrinsic.fromJson((vector as DisputesVector).input.disputes);
  const signed: boolean[] = culprits.map(culpritSigned);
  assert.deepEqual(signed, [true, false]);
});

test("the offenders mark names this block's offenders, and ψ′_O keeps them all", () => {
  let offenders = 0;
  for (const config of [TINY, FULL]) {
    for (const { name, vector } of acceptedVectors(config)) {
      const disputes: DisputesExtrinsic = DisputesExtrinsic.fromJson(vector.input.disputes);
      const mark: Bytes[] = offendersMark(disputes);
      const markHex: string[] = mark.map(toHex);
      assert.deepEqual(markHex, vector.output.ok?.offenders_mark, name);
      const before: PastJudgements = PastJudgements.fromJson(vector.pre_state.psi);
      const after: PastJudgements = recordOffenders(before, disputes);
      const expected: PastJudgements = PastJudgements.fromJson(vector.post_state.psi);
      assert.deepEqual(after.offenders, expected.offenders, name);
      offenders += mark.length;
    }
  }
  assert.equal(offenders, 28); // 14 tiny, 14 full
});
```

## The code

**Add to** `src/disputes.ts`

```ts
import type { Culprit, DisputesExtrinsic, Fault } from "./block.ts";

/** X_G: "$jam_guarantee" in the GP, what a guarantor signs before a report's hash. */
const GUARANTEE = new TextEncoder().encode("jam_guarantee");

/** Whether a culprit's signature really is its guarantee of the report: the evidence. */
export function culpritSigned(culprit: Culprit): boolean {
  return verifyEd25519(culprit.key, concatBytes(GUARANTEE, culprit.target), culprit.signature);
}

/** Whether a fault's signature really is its vote on the report, the way it voted. */
export function faultSigned(fault: Fault): boolean {
  return verifyEd25519(fault.key, voteMessage(fault.vote, fault.target), fault.signature);
}

/** H_O, the offenders mark: the keys of this block's offenders, culprits first, then faults. */
export function offendersMark(disputes: DisputesExtrinsic): Bytes[] {
  return [...disputes.culprits.map((c) => c.key), ...disputes.faults.map((f) => f.key)];
}

/** ψ′_O: the offenders so far, and this block's. */
export function recordOffenders(
  before: PastJudgements,
  disputes: DisputesExtrinsic,
): PastJudgements {
  return { ...before, offenders: sorted([...before.offenders, ...offendersMark(disputes)]) };
}
```

`faultSigned` reuses [lesson 10.1](./01-votes-and-verdicts.md)'s `voteMessage`: a fault's evidence *is* a vote, just
one on the losing side.

```ts
  return verifyEd25519(fault.key, voteMessage(fault.vote, fault.target), fault.signature);
```

And `recordOffenders` reuses `sorted`, since ψ_O is a set like the other three.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ every culprit's guarantee and every fault's vote is really theirs (234.4ms)
✔ a forged guarantee is caught (3.0ms)
✔ the offenders mark names this block's offenders, and ψ′_O keeps them all (152.3ms)
...
ℹ tests 99
ℹ suites 0
ℹ pass 99
ℹ fail 0
...
reported 99 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791731886863
...
```

28 offenders named across the accepted vectors, 14 at each size, every one with real
evidence and in the right place.

## Watch it

**New file** `bin/offenders.ts`

```ts
// Shows the offenders in a disputes test vector: each culprit (a guarantor of a bad report)
// and each fault (a vote against the verdict), and whether the evidence is real.
// Usage: npm run offenders <vector.json>, e.g.
//        npm run offenders ../vectors/stf/disputes/tiny/progress_with_verdicts-4.json

import { readFileSync } from "node:fs";
import { DisputesExtrinsic } from "../src/block.ts";
import type { Bytes } from "../src/bytes.ts";
import { toHex } from "../src/bytes.ts";
import { culpritSigned, faultSigned, offendersMark } from "../src/disputes.ts";
import { Run } from "../src/obs.ts";

const [file] = process.argv.slice(2);
const { input } = JSON.parse(readFileSync(file, "utf8"));
const disputes = DisputesExtrinsic.fromJson(input.disputes);
const short = (bytes: Bytes) => `${toHex(bytes).slice(0, 10)}…`;
const run = new Run("offenders");
for (const culprit of disputes.culprits) {
  const signed = culpritSigned(culprit);
  console.log(`culprit ${short(culprit.key)}: guaranteed report ${short(culprit.target)}`);
  console.log(`  the guarantee is really theirs: ${signed}`);
  run.event("culprit", { key: culprit.key, report: culprit.target, signed });
}
for (const fault of disputes.faults) {
  const signed = faultSigned(fault);
  const said = fault.vote ? "valid" : "invalid";
  console.log(`fault ${short(fault.key)}: voted ${said} on report ${short(fault.target)}`);
  console.log(`  the vote is really theirs: ${signed}`);
  run.event("fault", { key: fault.key, report: fault.target, said, signed });
}
console.log(`offenders mark: ${offendersMark(disputes).map(short).join(", ") || "none"}`);
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

**What flows through it.** The same vector [lesson 10.1](./01-votes-and-verdicts.md)'s program read, but this
program reads the *other* two parts of `input.disputes` — the accusations:

::: code-group

```json [what goes in]
{
  "culprits": [
    { "target": "0x7b0aa173…", "key": "0xad93247b…", "signature": "0x1558f9e1…" },
    { "target": "0x7b0aa173…", "key": "0xcab2b9ff…", "signature": "0x4a1ed409…" }
  ],
  "faults": [
    { "target": "0x11da6d1f…", "vote": false, "key": "0x4418fb8c…", "signature": "0x04a8e50e…" }
  ]
}
```

```ts [what it computes]
// bin/offenders.ts's values, once each piece of evidence is checked
const computed = {
  culprits: 2, // two guarantors of the report judged bad, 0x7b0aa173…
  faults: 1, // one vote against the report judged good, 0x11da6d1f…
  culpritsSigned: true, // both $jam_guarantee signatures are really theirs (culpritSigned)
  faultSigned: true, // the "invalid" vote is really κ0's (faultSigned)
  offendersMark: ["0xad93247b…", "0xcab2b9ff…", "0x4418fb8c…"], // every proven offender's key
};
```

```text [what comes out]
culprit 0xad93247b…: guaranteed report 0x7b0aa173…
  the guarantee is really theirs: true
offenders mark: 0xad93247b…, 0xcab2b9ff…, 0x4418fb8c…
```

:::

Each accusation names its `target`, the disputed report, and the accused validator by
Ed25519 `key`. A culprit's `signature` is the guarantee they signed over that report; a
fault adds `vote`, the way they had voted, and its `signature` is that vote. The program
checks every signature and prints the mark: the keys of everyone proven an offender.

**Run**

```sh
npm pkg set scripts.offenders="node bin/offenders.ts"
npm pkg set scripts.offenders-progress="node bin/offenders.ts ../vectors/stf/disputes/tiny/progress_with_verdicts-4.json"
npm run offenders-progress
```

```text
culprit 0xad93247b…: guaranteed report 0x7b0aa173…
  the guarantee is really theirs: true
culprit 0xcab2b9ff…: guaranteed report 0x7b0aa173…
  the guarantee is really theirs: true
fault 0x4418fb8c…: voted invalid on report 0x11da6d1f…
  the vote is really theirs: true
offenders mark: 0xad93247b…, 0xcab2b9ff…, 0x4418fb8c…
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=offenders-1791731890899
```

Put it next to [lesson 10.1](./01-votes-and-verdicts.md)'s `bin/verdicts.ts` on the same vector, and the whole trial
reads like a story. Report `0x7b0a…` was judged bad, so the two validators who
guaranteed it are culprits. Report `0x11da…` was judged good, and validator `0x4418…`
(validator 0, whose key [lesson 6.3](../06-state-and-merklization/03-reading-the-state.md) printed as κ0) had voted "invalid" on it: a fault. Now try
`progress_with_bad_signatures-2.json`, where the second culprit's "evidence" is a
forgery. The *Offenders* panel lists every offender.

![Offenders panel](./images/02-offenders.png)

<details>
<summary>lasair: signing contexts, in <code>conformance/disputes_stf.ml</code></summary>

```ocaml
let valid_context = Bytes.of_string "jam_valid"
let invalid_context = Bytes.of_string "jam_invalid"
let guarantee_context = Bytes.of_string "jam_guarantee"

let create_judgment_payload (vote : bool) (target : bytes) : bytes =
  let context = if vote then valid_context else invalid_context in
  Bytes.cat context target

let create_guarantee_payload (target : bytes) : bytes =
  Bytes.cat guarantee_context target
```

Your `voteMessage` and `culpritSigned`, in OCaml, down to the missing dollar signs.
Right next to these, lasair has a comment worth a read: every vote threshold is relative
to the size of the set the verdict cites, κ or λ, because the validator set can change
size between epochs. That's why your `outcome` takes the judges' count.

</details>

## Check your understanding

::: check
**In `progress_with_verdicts-4`, report `0x7b0a…` is judged bad. Who becomes a culprit?**

- [ ] Every judge who voted invalid on it
  > No: they voted with the verdict. Nobody is punished for being right.
- [ ] Every judge who voted valid on it
  > No: a "valid" vote on a bad report makes a fault, not a culprit. And this verdict
  > had 0 valid votes.
- [x] The validators who guaranteed it, caught by their own guarantee signatures
  > Yes: two culprits, `0xad93…` and `0xcab2…`. Their evidence is the guarantee they
  > signed.

**In the same block, validator `0x4418…` voted invalid on report `0x11da…`, which is judged good. What is it?**

- [ ] A culprit
  > No: a culprit guaranteed a bad report. This validator cast a vote on a good one.
- [x] A fault, with its own signed "invalid" vote as the evidence
  > Yes: it voted against the verdict. Its key goes into the offenders mark and ψ_O.
- [ ] Nothing: a judge may vote as it likes
  > No: a vote against the verdict is a fault, and the block names it.

**Why is a culprit's evidence checked against `jam_guarantee` ⌢ the report's hash?**

- [x] It's the very message a guarantor signs when vouching for a report
  > Yes: only that validator's key could have signed it, so the guarantee convicts its
  > own signer.
- [ ] It's the message of an "invalid" vote
  > No: that's `jam_invalid` ⌢ the hash, a fault's evidence.
- [ ] Any signature by the key will do: the prefix is decoration
  > No: in `progress_with_bad_signatures-2`, the second culprit's signature fails on
  > that message, and the forgery is caught.

**In `progress_with_verdicts-4`, the offenders are culprits `0xad93…` and `0xcab2…` and fault `0x4418…`. In what order does the offenders mark list them?**

- [ ] `0x4418…`, `0xad93…`, `0xcab2…`, sorted
  > No: that's how ψ_O keeps them, as a set. The mark keeps the block's order.
- [x] `0xad93…`, `0xcab2…`, `0x4418…`: the culprits first, then the faults
  > Yes: H_O is the culprits' keys in the block's order, then the faults'.
- [ ] `0x4418…` first, since the votes came before the offenses
  > No: faults come after culprits in the mark, whatever happened first.
:::

## What you have

The consequences of a trial: offenders named with evidence that checks out, kept in ψ_O,
and announced in the block's header. One consequence is left, and it touches the work
itself: [lesson 10.3](./03-clearing-the-cores.md) takes condemned reports off their cores.

Next: [10.3 Clearing the cores](./03-clearing-the-cores.md)
