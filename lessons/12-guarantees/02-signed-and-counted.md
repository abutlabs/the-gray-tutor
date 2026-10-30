# Signed and counted

A guarantee is a promise with signatures on it: "we ran this work, and this is the
report". This lesson checks that every signature is real: made with the key of the
validator it names, in the assignment the guarantee answers to. (Whether that validator
was assigned to the report's core is a check of its own, in [lesson
12.4](./04-bad-guarantees.md).) Then it writes down who signed: the *reporters*, which the statistics
([Part 18](../18-statistics/index.md)) will credit for the work.

## New words

- **Reporters.** 𝐆. Every validator who signed a guarantee in a block, each counted once.
  *Example:* guarantees signed by 0 and 1, and by 2 and 3: four reporters.

It's in the [glossary](../glossary.md).

## What the Gray Paper says

§11 (*Work Report Guarantees*). For each signature (v, s) on a guarantee, with (c, k)
the assignment the guarantee answers to ([lesson 12.1](./01-who-guarantees-what.md)):

- s must be the Ed25519 signature of k[v], validator v's key, on `$jam_guarantee` ⌢ H(the
  report). That's the same message a culprit's evidence carries ([lesson 10.2](../10-disputes/02-culprits-and-faults.md)): a
  guarantee is exactly the signature that convicts its signers if the report turns out
  bad.
- k is the assignment's keys *after* Φ ([lesson 8.2](../08-safrole/02-rotating-the-validators.md)): an offender's key is all zeros.
  So even a genuine signature from an offender can't check out. Banned means banned.

**𝐆, the reporters**, is the set of Ed25519 keys of everyone who signed any guarantee
in the block. A *set*: each key once, however many guarantees it signed.

Two real guarantees, every signature checked:

<SignedCounted />

## Sharing a message

Culprits ([lesson 10.2](../10-disputes/02-culprits-and-faults.md)) and guarantees sign the same message, so it gets one home:

**Add to** `src/disputes.ts`

```ts
/** What a guarantor signs about a report: X_G, then the report's hash. */
export function guaranteeMessage(reportHash: Bytes): Bytes {
  return concatBytes(GUARANTEE, reportHash);
}
```

**Replace in** `src/disputes.ts`

```ts
/** Whether a culprit's signature really is its guarantee of the report: the evidence. */
export function culpritSigned(culprit: Culprit): boolean {
  return verifyEd25519(culprit.key, guaranteeMessage(culprit.target), culprit.signature);
}
```

`culpritSigned` builds the same message as before, through its new home, so [Part 10](../10-disputes/index.md)'s
tests should all still pass:

**Run**

```sh
npm test
```

```text
...
✔ every culprit's guarantee and every fault's vote is really theirs (790.7ms)
✔ a forged guarantee is caught (7.8ms)
✔ the offenders mark names this block's offenders, and ψ′_O keeps them all (319.2ms)
...
ℹ tests 196
ℹ suites 0
ℹ pass 196
ℹ fail 0
...
reported 196 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791734301991
```

Green, [Part 10](../10-disputes/index.md)'s offender tests among them: the message has a new home, and nothing else
changed.

## The tests

[Lesson 12.1](./01-who-guarantees-what.md)'s `signerCores` worked out each guarantee's assignment inline; the new tests
need that too. So `assigned` does it once, and `signerCores` is rebuilt on top:

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
  };
  output: { err?: string; ok?: { reporters: string[] } };
};

/** For each guarantee in a reports vector: its report's core, and the signers' cores. */
function signerCores(config: Config, vector: ReportsVector) {
  return assigned(config, vector).map(({ guarantee, assignment }) => ({
    core: guarantee.report.core_index,
    signers: guarantee.signatures.map((s) => assignment.cores[s.validator_index]),
  }));
}
```

**Add to** `test/guarantors.test.ts`

```ts
import { guaranteeSigned, reporters, signerKeys } from "../src/guarantors.ts";
import type { Bytes } from "../src/bytes.ts";
import { toHex } from "../src/bytes.ts";

/** Each guarantee in a reports vector, with the assignment, M or M*, it answers to. */
function assigned(config: Config, vector: ReportsVector) {
  const { input, pre_state } = vector;
  const keys = (list: unknown[]) => list.map((key) => ValidatorKey.fromJson(key));
  const assignments = guarantorAssignments(
    config,
    input.slot,
    pre_state.entropy.map(fromHex),
    keys(pre_state.curr_validators),
    keys(pre_state.prev_validators),
    pre_state.offenders.map(fromHex),
  );
  return GuaranteesExtrinsic.fromJson(input.guarantees).map((guarantee) => ({
    guarantee,
    assignment: assignmentFor(config, input.slot, guarantee.slot, assignments),
  }));
}

test("every accepted guarantee is signed by its guarantors, and 𝐆 lists them once each", () => {
  let checked = 0;
  for (const config of [TINY, FULL]) {
    for (const name of vectorFiles(`stf/reports/${config.name}`)) {
      const vector = vectorJson(name) as ReportsVector;
      if (vector.output.err) continue;
      const signers: Bytes[] = [];
      for (const { guarantee, assignment } of assigned(config, vector)) {
        const signed: boolean = guaranteeSigned(guarantee, assignment.keys);
        assert.ok(signed, name);
        signers.push(...signerKeys(guarantee, assignment.keys));
        checked++;
      }
      const reportersHex: string[] = reporters(signers).map(toHex);
      assert.deepEqual(reportersHex, vector.output.ok?.reporters, name);
    }
  }
  assert.equal(checked, 44); // 21 guarantees on tiny, 23 on full
});

test("a forged guarantee signature is caught", () => {
  const vector = vectorJson("stf/reports/tiny/bad_signature-1.json") as ReportsVector;
  const [{ guarantee, assignment }] = assigned(TINY, vector);
  const signed: boolean = guaranteeSigned(guarantee, assignment.keys);
  assert.equal(signed, false);
});
```

`assigned` is a plain `function` declaration, so it can sit below the tests that use it:
JavaScript lifts ("hoists") function declarations to the top of their file.

## The code

**Add to** `src/guarantors.ts`

```ts
import { fromHex, toHex } from "./bytes.ts";
import type { ReportGuarantee } from "./block.ts";
import { encode } from "./codec/codec.ts";
import { guaranteeMessage } from "./disputes.ts";
import { blake2b256 } from "./hash.ts";
import { verifyEd25519 } from "./signature.ts";
import { WorkReport } from "./work.ts";

/** The Ed25519 keys of a guarantee's signers, from the assignment's keys. */
export function signerKeys(guarantee: ReportGuarantee, keys: ValidatorKey[]): Bytes[] {
  return guarantee.signatures.map((s) => keys[s.validator_index].ed25519);
}

/** Whether every signature on a guarantee is its guarantor's, over the report's hash. */
export function guaranteeSigned(guarantee: ReportGuarantee, keys: ValidatorKey[]): boolean {
  const message = guaranteeMessage(blake2b256(encode(WorkReport, guarantee.report)));
  const signers = signerKeys(guarantee, keys);
  return guarantee.signatures.every((s, i) => verifyEd25519(signers[i], message, s.signature));
}

/** 𝐆, the reporters (GP §11): every guarantor who signed in the block, once each, sorted. */
export function reporters(signers: Bytes[]): Bytes[] {
  return [...new Set(signers.map(toHex))].sort().map(fromHex);
}
```

`reporters` makes a set the quick way: turn each key into hex, let a `Set` drop the
repeats, sort, and turn the hex back into bytes.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ every accepted guarantee is signed by its guarantors, and 𝐆 lists them once each (726.5ms)
✔ a forged guarantee signature is caught (1.6ms)
...
ℹ tests 198
ℹ suites 0
ℹ pass 198
ℹ fail 0
...
reported 198 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791734316847
...
```

44 accepted guarantees, every signature real, and 𝐆 right in every vector.

## Watch it

**New file** `bin/reporters.ts`

```ts
// Checks the signatures on every guarantee of a reports test vector and lists the
// reporters: everyone who signed, once each.
// Usage: npm run reporters <vector.json>, e.g.
//        npm run reporters ../vectors/stf/reports/tiny/multiple_reports-1.json

import { readFileSync } from "node:fs";
import { GuaranteesExtrinsic } from "../src/block.ts";
import type { Bytes } from "../src/bytes.ts";
import { fromHex, toHex } from "../src/bytes.ts";
import { FULL, TINY } from "../src/config.ts";
import { assignmentFor, guaranteeSigned, guarantorAssignments } from "../src/guarantors.ts";
import { reporters, signerKeys } from "../src/guarantors.ts";
import { Run } from "../src/obs.ts";
import { ValidatorKey } from "../src/state.ts";

const [file] = process.argv.slice(2);
const config = file.includes("/full/") ? FULL : TINY;
const { input, pre_state } = JSON.parse(readFileSync(file, "utf8"));
const keys = (list: unknown[]) => list.map((key) => ValidatorKey.fromJson(key));
const assignments = guarantorAssignments(
  config,
  input.slot,
  pre_state.entropy.map(fromHex),
  keys(pre_state.curr_validators),
  keys(pre_state.prev_validators),
  pre_state.offenders.map(fromHex),
);
const short = (bytes: Bytes) => `${toHex(bytes).slice(0, 10)}…`;
const run = new Run("reporters");
const everyone: Bytes[] = [];
for (const guarantee of GuaranteesExtrinsic.fromJson(input.guarantees)) {
  const assignment = assignmentFor(config, input.slot, guarantee.slot, assignments);
  const signers = signerKeys(guarantee, assignment.keys);
  const signed = guaranteeSigned(guarantee, assignment.keys);
  everyone.push(...signers);
  const core = guarantee.report.core_index;
  console.log(`core ${core}: signed by ${signers.map(short).join(", ")}; all real: ${signed}`);
  run.event("guarantee", { core, signers: signers.map(short).join(" "), signed });
}
const G = reporters(everyone);
console.log(`𝐆, the reporters: ${G.length} of ${everyone.length} signatures' keys`);
for (const key of G) console.log(`  ${toHex(key)}`);
run.event("reporters", { count: G.length, signatures: everyone.length });
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

**What flows through it.** Two guarantees in one block at slot 18, signed by the *same
three seats* — one guarantee from this rotation, one made at slot 14, the rotation
before:

::: code-group

```json [what goes in]
{
  "slot": 18,
  "guarantees": [
    { "report": { "core_index": 0, … }, "slot": 14,
      "signatures": [ { "validator_index": 1, "signature": "0x236ff161…" }, … 4, … 5 … ] },
    { "report": { "core_index": 1, … }, "slot": 18,
      "signatures": [ { "validator_index": 1, "signature": "0x52ddd0bb…" }, … 4, … 5 … ] }
  ]
}
```

```ts [what it computes]
// bin/reporters.ts: each guarantee's signer keys looked up in its own rotation's hand
const computed = {
  core0: { signedBy: "seats 1, 4, 5 of the slot-14 hand", allReal: true },
  core1: { signedBy: "seats 1, 4, 5 of the slot-18 hand", allReal: true },
  signatures: 6, // three per guarantee
  reporters: 3, // 𝐆 counts each key once, however often it signed
};
```

```text [what comes out]
core 0: signed by 0xad93247b…, 0x8b8c5d43…, 0xab0084d0…; all real: true
core 1: signed by 0xad93247b…, 0x8b8c5d43…, 0xab0084d0…; all real: true
𝐆, the reporters: 3 of 6 signatures' keys
```

:::

Both guarantees carry `validator_index` 1, 4 and 5 — but each is resolved against the
hand of *its own* `slot`, and the two hands seat those numbers on different cores, so
both check out. Six signatures become three reporters: 𝐆 counts people, not autographs.

**Run**

```sh
npm pkg set scripts.reporters="node bin/reporters.ts"
npm pkg set scripts.reporters-same-guarantors="node bin/reporters.ts ../vectors/stf/reports/tiny/different_core_same_guarantors-1.json"
npm run reporters-same-guarantors
```

```text
core 0: signed by 0xad93247b…, 0x8b8c5d43…, 0xab0084d0…; all real: true
core 1: signed by 0xad93247b…, 0x8b8c5d43…, 0xab0084d0…; all real: true
𝐆, the reporters: 3 of 6 signatures' keys
  0x8b8c5d436f92ecf605421e873a99ec528761eb52a88a2f9a057b3b3003e6f32a
  0xab0084d01534b31c1dd87c81645fd762482a90027754041ca1b56133d0466c06
  0xad93247bd01307550ec7acd757ce6fb805fcf73db364063265b30a949e90d933
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=reporters-1791734322115
```

The same three guarantors signed for core 0 *and* core 1: one guarantee from this
rotation, one from the last, when they sat on the other core. Six signatures, three
reporters. Then try `bad_signature-1.json` (`all real: false`) and
`banned_validator_guarantee-1.json`, where one signer's key prints as `0x00000000…`:
an offender, zeroed by Φ, and the guarantee sinks with it.
The *Reporters* panel shows every check.

![Reporters panel](./images/02-reporters.png)

<details>
<summary>lasair: what a test checks, in <code>conformance/reports_stf.ml</code></summary>

```ocaml
  match test.output, result with
  | Output_ok (expected_reported, _), Result.Ok (actual_reported, _, _) ->
    if List.length expected_reported <> List.length actual_reported then
      Alcotest.fail (Printf.sprintf "Expected %d reported, got %d"
        (List.length expected_reported) (List.length actual_reported))
```

This is how lasair's own adapter checks these same vectors when a block is accepted, and
it compares just one thing: *how many* packages were reported. The reporters, the `_`,
are never looked at. And lasair's adapter builds them as a plain list, repeats and all:
on `different_core_same_guarantors-1` it would have six keys where 𝐆 has three, and no
test would say a word. A test is only as strong as what it compares. Yours compares the
whole set.

</details>

## Check your understanding

::: check
**A guarantee's signature is on `jam_guarantee` ⌢ H(report), the same message a culprit carries. Why?**

- [ ] Coincidence: two messages that happen to look alike
  > No: it's the same message on purpose, with the same `jam_guarantee` prefix.
- [x] Signing a guarantee is signing the evidence that convicts you if the report turns out bad
  > Yes: the signature that puts a report on a core is exactly what [lesson 10.2](../10-disputes/02-culprits-and-faults.md) checks
  > in a culprit.
- [ ] After a bad verdict, the guarantors re-sign it as a confession
  > No: nobody re-signs anything. The culprit's evidence is the guarantee's own
  > signature, from before.

**In `different_core_same_guarantors-1`, the same three validators sign guarantees for core 0 and core 1. How many reporters does 𝐆 hold?**

- [ ] 6, one per signature
  > No: 𝐆 is a set. Each key goes in once, however many guarantees it signed.
- [ ] 2, one per guarantee
  > No: 𝐆 counts validators, not guarantees.
- [x] 3
  > Yes: six signatures, three keys. One guarantee is from this rotation, one from the
  > last, when they sat on the other core.

**In `banned_validator_guarantee-1`, an offender signs a guarantee with its real key. Why can't the signature check out?**

- [x] Φ has zeroed the offender's key in the assignment, so there's no key to check it against
  > Yes: its key prints as `0x00000000…`. Banned means banned, and the guarantee sinks.
- [ ] An offender's signatures are removed from the block
  > No: the signature is still in the block. It's the key it would check against that's
  > gone.
- [ ] It does check out, but the report is refused for being bad
  > No: this report was never judged. The signature fails because the key is all zeros.
:::

## What you have

Guarantees you can trust: every signature real, every signer the right guarantor, no
offender's word accepted, and the reporters counted once each. A trusted guarantee puts
its report on a core, and [lesson 12.3](./03-onto-the-cores.md) does exactly that.

Next: [12.3 Onto the cores](./03-onto-the-cores.md)
