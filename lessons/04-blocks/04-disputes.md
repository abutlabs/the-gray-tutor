# Disputes

**In one sentence:** when a guaranteed work-report turns out to be bad, the validators
vote on it, and a block carries the signed record of that vote.

Here is the tiny vector's record. Open a verdict to its votes, and a vote to the byte that
says yes or no.

<a id="try-it"></a>

<DisputesParcel />

## The idea

A guarantee is two or three validators saying "this report is correct". What if they are
wrong, or lying? Every system that trusts people needs a way to say "that was wrong".

JAM's way is a trial, and a block carries the court record.

1. Validators re-run the work and vote: valid, or not. This happens off the chain.
2. The votes on one report, from two thirds of the validators plus one, make a
   [*verdict*](../glossary.md#verdict).
3. If the report is judged bad, whoever vouched for it is named a
   [*culprit*](../glossary.md#culprit). The evidence is the guarantor's own signature on
   the guarantee.
4. A validator whose vote went against the verdict is recorded as a
   [*fault*](../glossary.md#fault). The evidence is its signed vote.

So the record is three lists: verdicts, culprits, faults. It is the extrinsic's last part.
Every entry in it is signed, so nobody has to take the author's word for what was voted.

The block only carries the record. [Part 10](../10-disputes/index.md) is the clerk who
checks it. Today your client reads it: this lesson builds the codec for the three lists.

## What the Gray Paper says

§10 (*Disputes, Verdicts and Judgments*) puts three lists in a block:

- **verdicts**: each one names a work-report (by its hash, the `target`), the epoch whose
  validators voted (`age`), and the votes themselves: two thirds of the validators, plus
  one. *Example:* 5 votes on tiny. Each vote (a *judgement*) is a yes or no, the voter's
  index and its signature.
- **culprits**: guarantors of a report found bad: the report's hash, the guarantor's
  Ed25519 key, and its signature as evidence.
- **faults**: validators whose vote went against the verdict: the report, how they
  voted, their key, their signature.

Appendix C encodes all three as lists with their lengths in front, the verdicts as
(target, ℰ₄ of the age, the votes with their length in front): its (C.21), quoted with
the whole block's in [lesson 4.7](./07-the-block.md#eq-C-21).

How many votes? ⌊2V/3⌋ + 1: **5 on tiny, 683 on full**. The vectors have exactly that
many. Slide V between the two sizes and watch the count, and the bytes it takes in
front of the votes: one until 128 votes, two after.

<VoteCount />

## A yes or no

A vote needs one new primitive: a boolean, one byte, 1 for yes and 0 for no.

**Add to** `src/codec/codec.ts`

```ts
/** A yes or no, as one byte: 1 or 0. */
export const bool: Codec<boolean> = {
  encode: (w, x) => w.fixed(x ? 1n : 0n, 1),
  decode: (r) => r.fixed(1) === 1n,
  fromJson: (json) => json as boolean,
};
```

## The test

**Add to** `test/block.test.ts`

```ts
import { DisputesExtrinsic } from "../src/block.ts";

testCodecVector("disputes_extrinsic", DisputesExtrinsic);
```

## The code

**Add to** `src/block.ts`

```ts
import { bool } from "./codec/codec.ts";

/** A judgement (GP §10): one validator's vote on whether a work-report is valid. */
export const Judgement = record({
  vote: bool, // true: valid
  index: u16, // which validator voted
  signature: fixedBytes(64),
});
export type Judgement = Value<typeof Judgement>;

/** A verdict: the votes of two thirds of the validators, plus one, on one report. */
export const Verdict = record({
  target: hash, // the work-report's hash
  age: u32, // the epoch whose validators voted: this one or the one before
  votes: seq(Judgement),
});
export type Verdict = Value<typeof Verdict>;

/** A culprit: a guarantor who vouched for a report that turned out bad. */
export const Culprit = record({
  target: hash,
  key: fixedBytes(32), // the guarantor's Ed25519 key
  signature: fixedBytes(64), // its guarantee, as evidence
});
export type Culprit = Value<typeof Culprit>;

/** A fault: a validator who voted against the verdict. */
export const Fault = record({
  target: hash,
  vote: bool,
  key: fixedBytes(32),
  signature: fixedBytes(64),
});
export type Fault = Value<typeof Fault>;

/** The disputes in a block (GP §10). */
export const DisputesExtrinsic = record({
  verdicts: seq(Verdict),
  culprits: seq(Culprit),
  faults: seq(Fault),
});
export type DisputesExtrinsic = Value<typeof DisputesExtrinsic>;
```

683 votes on full, 5 on tiny, and the codec doesn't care: the votes carry their own
length, so `DisputesExtrinsic` is a plain codec, not a function of the config.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ disputes_extrinsic (tiny) (0.7ms)
✔ disputes_extrinsic (full) (12.7ms)
...
ℹ tests 42
ℹ suites 0
ℹ pass 42
ℹ fail 0
...
reported 42 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791728272265
...
```

## Watch it

**Replace in** `bin/decode.ts`

```ts
import { DisputesExtrinsic } from "../src/block.ts";

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
  disputes_extrinsic: DisputesExtrinsic,
});
```

What flows through this run:

::: code-group

```text [what goes in]
disputes_extrinsic.bin (full), 91,986 bytes; the first 40:
02 dd 1b 65 c0 36 54 77 50 d2 f8 4f f4 c6 fa c7 de 56 94 46
58 53 0a 62 e8 1c 6c c2 90 08 74 40 d0 03 00 00 00 82 ab 01 …
```

```ts [what it computes]
// DisputesExtrinsic.decode(r): two verdicts, two culprits, one fault
const computed = {
  verdicts: [ // 02 in front
    { target: "0xdd1b65c0…", age: 3, votes: 683 }, // 82 ab: 683 votes, every one "valid"
    { target: "0x2bdbba47…", age: 3, votes: 683 }, // 683 again, every one "invalid"
  ],
  culprits: 2, // the guarantors of the report judged bad
  faults: 1, // a judge whose vote went against its verdict
};
```

```text [what comes out]
    0..1     verdicts.length                0x02
   37..39    verdicts.0.votes.length        0x82ab
```

:::

After the count `02` come the first verdict's 32-byte target and its age, `03 00 00 00`;
then `82 ab`, a compact natural for 683, and that many votes. The full jury is why the
file is 92 kilobytes.

**Run**

```sh
npm pkg set scripts.decode-disputes="node bin/decode.ts disputes_extrinsic ../vectors/codec/full/disputes_extrinsic.bin"
npm run decode-disputes
```

```text
    0..1     verdicts.length                0x02
...
   37..39    verdicts.0.votes.length        0x82ab
...
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=decode-1791728272718
```

`0x82ab` is a two-byte compact natural ([lesson 2.2](../02-codec/02-compact-naturals.md)): the first byte's leading `1` says
one more byte follows, and together they make 683. Then 683 votes scroll past.

<details>
<summary>lasair: the rule that changed</summary>

In Gray Paper 0.7.2, the votes had *no* length in front. From `text/serialization.tex` at
v0.7.2:

```tex
\tup{\xv¬reporthash, \encode[4]{\xv¬epochindex},
  \sq{\build{
```

and at v0.8.0:

```tex
\tup{\xv¬reporthash, \encode[4]{\xv¬epochindex},
  \var{\sq{\build{
```

That `\var` is the length prefix. Without it, a decoder had to *know* how many votes to
read, which means knowing V, which means knowing the size of the network. That's exactly
where lasair's frozen-at-tiny bug ([lesson 4.2](./02-tiny-and-full.md)) bit: its vote count, like its bitfield
size, was computed once at tiny and never again. Under 0.8.0 the votes say how many they
are, and that trap is gone. They have to: 0.8.0 lets the validator count change, so the
network's size no longer tells a decoder how many to read. Specs evolve, and sometimes they make your life easier.

</details>

## Check your understanding

::: check
**A guaranteed report turns out to be bad. What does JAM do about it?**

- [ ] Nothing: two or three validators signed it, so it stands
  > No: a guarantee is a claim, not a proof. Disputes exist because a guaranteed report can
  > be wrong.
- [x] Validators vote on it, and a block records the verdict, the guarantors who vouched for it, and anyone who voted the wrong way
  > Yes: three lists, verdicts, culprits and faults, every entry signed.
- [ ] Its guarantors re-run the work and take their signatures back
  > No: the guarantors don't judge their own report. The verdict is the votes of two
  > thirds of the validators, plus one, and the guarantors' signatures become the evidence
  > against them.

**Where does the voting happen, and what does the block carry?**

- [x] Off the chain, by validators who re-ran the work; the block carries their signed votes
  > Yes: the block is the record, not the trial. [Part 10](../10-disputes/index.md) checks
  > the record on the chain.
- [ ] On the chain: every node re-runs the work when it imports the block
  > No: the work was re-run before the block was made. A node importing the block checks
  > signatures and counts, which is far less than re-running the work.
- [ ] In-core, by the same three validators that guaranteed the report
  > No: those three are the ones on trial. The votes come from the validators at large.

**A culprit and a fault: what's the difference?**

- [ ] A culprit voted against the verdict; a fault vouched for a bad report
  > No: that's the right pair, swapped. The culprit is the guarantor who signed the bad
  > report.
- [ ] They're two names for any validator who did something wrong
  > No: they're different lists with different evidence. A culprit's is its
  > guarantee; a fault's is its vote.
- [x] A culprit vouched for a bad report; a fault voted against the verdict
  > Yes: culprits are guarantors, caught by their own signed guarantee. Faults are
  > voters who called it the wrong way.

**Anyone who knows V can work out how many votes a verdict has. So why does Gray Paper 0.8.0 write their length in front?**

- [ ] Because 683 doesn't fit in one byte
  > No: tiny's 5 fits in one byte, and it still gets a length. The length is there
  > because the count can't be known in advance.
- [x] Because 0.8.0 lets the validator count change, so the size of the network no longer tells a decoder the count
  > Yes: with V free to change, the votes must say how many they are. It also closes
  > a trap: a count worked out once, at tiny, and used for every size.
- [ ] Every list in JAM has its length in front
  > No: in Gray Paper 0.7.2 these very votes had no length. Decoders had to work the
  > count out from V.
:::

## What you have

All five parts of a block's extrinsic: tickets, preimages, assurances, guarantees and
disputes, each matching the official vectors at both sizes. The header still needs two
shapes the codec doesn't have: a value that may be missing, and a list of exactly n.
[Lesson 4.5](./05-maybe-and-exactly-n.md) adds both.

Next: [4.5 Maybe, and exactly n](./05-maybe-and-exactly-n.md)
