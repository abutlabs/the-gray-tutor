# Guarantees

A work-report doesn't just wander into a block. Two or three validators from the core
that did the work sign it, putting their names (and, eventually, their stake) on "this
report is correct". A signed report is a *guarantee*: how work from the cores reaches the
chain.

Here is the tiny vector's: the report, the slot it was signed in, and who signed. Tap
into the report and it's [lesson 3.3](../03-work-and-reports/03-a-work-report.md)'s receipt.

<GuaranteeParcel />

## New words

- **Guarantee.** A work-report signed by the validators who vouch for it. *Example:* one
  report, signed at slot 42 by validators 3 and 4.
- **Credential.** The signatures on a guarantee, two or three of them, each a guarantor's
  validator index and its Ed25519 signature (the `signatures` field below). *Example:*
  index 3 and 64 bytes, then index 4 and 64 bytes.

Both are in the [glossary](../glossary.md).

## What the Gray Paper says

§11 (*Work Report Guarantees*): a guarantee is three things:

- the *work-report* itself ([lesson 3.3](../03-work-and-reports/03-a-work-report.md));
- the *timeslot* the guarantors signed it in;
- a *credential*: two or three signatures, each a validator's index and its Ed25519
  signature.

A block carries at most one guarantee per core, in order of core.

Appendix C encodes a guarantee as the report, ℰ₄ of the slot, then the signatures with
their length in front, each as ℰ₂ of the index and the 64-byte signature.

## The test

**Add to** `test/block.test.ts`

```ts
import { GuaranteesExtrinsic } from "../src/block.ts";

testCodecVector("guarantees_extrinsic", GuaranteesExtrinsic);
```

## The code

**Add to** `src/block.ts`

```ts
import { WorkReport } from "./work.ts";

/** A guarantor's signature: which validator, and its Ed25519 signature. */
export const ValidatorSignature = record({
  validator_index: u16,
  signature: fixedBytes(64),
});
export type ValidatorSignature = Value<typeof ValidatorSignature>;

/** A guarantee (GP §11): a work-report, vouched for by two or three validators. */
export const ReportGuarantee = record({
  report: WorkReport,
  slot: u32, // when the guarantors signed it
  signatures: seq(ValidatorSignature),
});
export type ReportGuarantee = Value<typeof ReportGuarantee>;

/** The guarantees in a block: at most one per core. */
export const GuaranteesExtrinsic = seq(ReportGuarantee);
```

The whole work-report from [Part 3](../03-work-and-reports/index.md) slots straight in as one field. Every piece you've
built so far is a brick for the next.

The report has a size-dependent part (its erasure shards, [lesson 3.3](../03-work-and-reports/03-a-work-report.md)) only in its
*values*, not its shape: 6 or 1,023, it's a u16 either way. So `GuaranteesExtrinsic` is
a plain codec, not a function of the config.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ guarantees_extrinsic (tiny) (1.1ms)
✔ guarantees_extrinsic (full) (0.6ms)
...
ℹ tests 40
ℹ suites 0
ℹ pass 40
ℹ fail 0
...
reported 40 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791728271225
...
```

## Watch it

**Replace in** `bin/decode.ts`

```ts
import { GuaranteesExtrinsic } from "../src/block.ts";

/** The structures this program knows, by the test vectors' names; some depend on the size. */
const CODECS = (config: Config): Record<string, Codec<unknown>> => ({
  refine_context: RefineContext,
  work_item: WorkItem,
  work_package: WorkPackage,
  work_result: WorkDigest,
  work_report: WorkReport,
  tickets_extrinsic: TicketsExtrinsic,
  preimages_extrinsic: PreimagesExtrinsic,
  assurances_extrinsic: AssurancesExtrinsic(config),
  guarantees_extrinsic: GuaranteesExtrinsic,
});
```

What flows through this run — the file's bytes, the guarantee they decode to, the trace printed:

::: code-group

```text [what goes in]
guarantees_extrinsic.bin, 621 bytes; the first 33:
01 30 46 6e 0a e1 b0 5d de 52 49 87 24 75 f6 be ea
c3 68 fd 01 4b 5a 34 13 ce b3 2d 38 72 14 32 84 …
```

```ts [what it computes]
// GuaranteesExtrinsic.decode(r): a list of one guarantee
const computed = [ // 01 in front: the count
  {
    report: { package_spec: { hash: "0x30466e0a…" }, core_index: 3 }, // 3.3's shape, whole
    slot: 42, // 2a 00 00 00, after the report
    signatures: [ // 02 in front: two guarantors, the fewest a guarantee may have
      { validator_index: 0, signature: "0x5f6e74d2…" }, // 2 bytes of index, 64 of signature
      { validator_index: 1, signature: "0x3a6813f7…" },
    ],
  },
];
```

```text [what comes out]
    0..1     length                         0x01
  484..488   0.slot                         0x2a000000
  555..557   0.signatures.1.validator_index 0x0100
```

:::

After the count, the whole work-report comes first; then the slot, 42, and the two
signatures, each a two-byte validator index and 64 bytes.

**Run**

```sh
npm pkg set scripts.decode-guarantees="node bin/decode.ts guarantees_extrinsic ../vectors/codec/tiny/guarantees_extrinsic.bin"
npm run decode-guarantees
```

```text
    0..1     length                         0x01
...
  484..488   0.slot                         0x2a000000
...
  555..557   0.signatures.1.validator_index 0x0100
...
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=decode-1791728271657
```

Scroll the trace: the whole work-report goes by first (`0.report.package_spec...` down
to `0.report.results.1.refine_load.exports`), then the slot, 42, and two signatures, from
validators 0 and 1. Two guarantors, the minimum.

<details>
<summary>lasair: <code>decode_guarantee</code>, in <code>conformance/block_codec.ml</code></summary>

```ocaml
let decode_guarantee b off =
  let (report, consumed) =
    Lasair.Serialization.decode_work_report (Bytes.sub b off (Bytes.length b - off)) 0 in
  let off = off + consumed in
  let slot = u32_le b off in
  let off = off + 4 in
  let (signatures, off) = dec_list b off (fun b off ->
    let idx = u16_le b off in
    let (s, off) = dec_bytes b (off + 2) 64 in
    ((idx, s), off))
  in
  ({ rg_report = report; rg_slot = slot; rg_signatures = signatures }, off)
```

Count the `off` variables: every step works out where the next one starts. That's the
bookkeeping your Reader does for you ([lesson 2.3](../02-codec/03-writer-and-reader.md)), and why your version is a five-line
record.

</details>

## Check your understanding

::: check
**What turns a work-report into a guarantee?**

- [ ] Every validator checking it and agreeing it's correct
  > No: only two or three validators sign, from the core that did the work. A
  > guaranteed report can still turn out wrong, which is what disputes are for.
- [x] Two or three validators signing it, with the slot they signed it in
  > Yes: a guarantee is the report, ℰ₄ of the slot, and the credential, their
  > signatures. They put their names on "this report is correct".
- [ ] A hash of the report written in front of it
  > No: a guarantee carries the whole report, then the slot and the signatures. There's
  > no hash in front.

**The tiny vector's slot bytes are `2a 00 00 00`. What is the slot?**

- [x] 42
  > Yes: ℰ₄ writes the least significant byte first, and `0x2a` is 42.
- [ ] 704,643,072
  > No: that's `0x2a000000`, the bytes read the wrong way round. ℰ₄ puts the
  > lowest byte first, so `2a` is the small end.
- [ ] A length: 42 signatures follow
  > No: the slot is a fixed 4-byte number, and the signatures carry their own length.
  > There are two.

**The guarantee's two signatures come from validators 0 and 1. How does a decoder know to read two, not three?**

- [ ] Guarantees always have exactly two signatures
  > No: a credential has two or three. Two is only the minimum.
- [ ] It keeps reading signatures until the bytes run out
  > No: more can follow, another guarantee or the rest of the block. A decoder can't
  > tell a signature from whatever comes next.
- [x] The signatures list has its length in front
  > Yes: Appendix C writes the signatures with their length first, so the bytes say
  > "two" before the first one starts.

**A work-report holds the number of erasure shards: 6 on tiny, 1,023 on full. Why isn't `GuaranteesExtrinsic` a function of the config?**

- [x] The size changes a value, not the shape: it's a u16 either way
  > Yes: a codec only needs the config when the number of bytes depends on it. 6 and
  > 1,023 both fit in the same two bytes.
- [ ] Guarantees only ever appear in tiny blocks
  > No: the vectors have a `guarantees_extrinsic` for both sizes, and both pass.
- [ ] A work-report is the same number of bytes in every guarantee
  > No: a report with more results is longer. Its variable parts carry their own
  > lengths, so the codec still needs no config.
:::

## What you have

Four of the five extrinsic parts. One left, and it's the dramatic one: disputes.

Next: [4.4 Disputes](./04-disputes.md)
