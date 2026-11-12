# A work-report

**In one sentence:** a work-report is a core's receipt for one work-package: what each job
returned, and where to fetch everything needed to check it.

Here is the vectors' report. Tap any part for what it's for, its value and where its bytes
are. Switch from tiny to full and only one part changes.

<a id="try-it"></a>

<WorkReport />

## The idea

A core did some work, and the chain wasn't watching. Why should anyone believe the result?

Because the claim comes with the means to check it. The [*work-report*](../glossary.md#work-report)
is the claim: this is the package ([lesson 3.1](./01-a-work-package.md)), this is what
each job returned ([lesson 3.2](./02-work-digests.md)), this is who allowed it. Validators
sign it, check it, and finally fold it into the chain.

The means to check it is the data behind the report, the [*bundle*](../glossary.md#bundle): the
package and all it needs to be run again. Nobody should have to store every core's
bundles. So each bundle is cut into one piece per validator, in such a way that a third of
the pieces, plus one, rebuild all of it. That is [*erasure coding*](../glossary.md#erasure-coding):
1,023 shards on full, any 342 of which will do; on tiny, 6, any 3.
One hash, the [*erasure root*](../glossary.md#erasure-root), vouches for every piece.

The report carries both promises in its
[*availability specification*](../glossary.md#availability-specification). Your client only decodes
the report, but its fields make no sense until you know what they promise.

## The big picture

A report says a core did some work. Before the chain acts on it, the bundle behind it
must be somewhere anyone can fetch it, so auditors can redo the work and catch a lie. But
nobody should have to store every core's bundles. So JAM spreads each one across all the
validators:

1. **Cut.** The validators working the core (its *guarantors*) cut the bundle into one
   shard per validator: 6 on tiny, 1,023 on full.
2. **Commit.** They hash each shard and build a Merkle tree of the hashes: each box is the
   hash of the two below it. The top one, the erasure root, goes in the report: the full
   report's is `0x7af11fda…`.
3. **Send.** Each validator gets its shard, plus the hashes beside its path up the tree.
   It hashes its way up; if it reaches the erasure root, the shard is genuine.
4. **Say so.** Each validator then signs an *assurance*, "I hold my shard". Once more than
   two-thirds have (5 of 6, 683 of 1,023), the report is *available*; [lesson 11.2](../11-assurances/02-timeouts.md)
   walks one across a core.
5. **Rebuild.** An auditor fetches shards, checks each against the root, and rebuilds the
   bundle from any third plus one: 3 on tiny, 342 on full.

Why trust 683 yeses when some may be lies? Even if a third of all validators lied, 341,
then 683 − 341 = 342 really hold their shard: exactly enough to rebuild. On tiny,
5 − 2 = 3.

Tap a validator to see its check; tap it again to take it offline or make it lie.

<ShardJourney />

So is erasure coding a Merkle tree? No: two tools, stacked. Erasure coding makes the
pieces, so that a third plus one rebuild the whole. The Merkle tree fingerprints them, so
anyone can check one piece without the rest. [Lesson 5.2](../05-hashing-and-signatures/02-the-extrinsic-hash.md) builds a Merkle commitment.

A validator's piece has two parts: its shard of the bundle, kept until the report is
audited, and its shard of each segment the package exported, kept 28 days so later
packages can import them. The erasure root covers both. (The widget is a miniature: a real
leaf is the bundle shard's hash followed by a root of the segment shards.)

## What the Gray Paper says

::: gray-paper 11.1 4-4

#### §11.1 State, continued

<a id="gp-11-1-p4"></a>A work-report guarantee, of the set $\mathbb{G}$, consists of a work-report together with signatures from guarantors attesting to its correctness. $\mathbb{G}$ is formally defined and guarantees discussed further in section [11.4](../12-guarantees/index.md#gp-11-4-p1). For now, we concern ourselves with the work-reports that guarantees attest to.

:::

::: gray-paper 11.1.1 1-2

#### §11.1.1 Work Report {#gp-11-1-1}

<a id="gp-11-1-1-p1"></a>A work-report, of the set $\mathbb{R}$, is defined as a tuple of the work-package specification, $\mathbf{s}$; the refinement context, $\mathbf{c}$; the core-index (i.e.  on which the work is done), $c$; as well as the authorizer hash $a$ and trace $\mathbf{t}$; a segment-root lookup dictionary $\mathbf{l}$; the gas consumed during the <abbr class="gp-term" title="the authorizer's code, run in the PVM by the guarantors to decide if a package may use the core">Is-Authorized</abbr> <abbr class="gp-term" title="one run of code in the PVM: Is-Authorized, refine or accumulate">invocation</abbr>, $g$; and finally the work-digests $\mathbf{d}$ which comprise the results of the evaluation of each of the items in the package together with some associated data. Formally:

<a id="gp-11-1-1-p2"></a><a id="eq-11-2"></a>

$$
\begin{equation}
\mathbb{R} \equiv \!\left\lgroup
\begin{aligned}
&\mathbf{s}\in \mathbb{Y},\
\mathbf{c}\in \mathbb{C},\
c\in \mathbb{N}_{\mathsf{C}},\
a\in \mathbb{H}_{},\
\mathbf{t}\in \mathbb{B}_{},\\
&\mathbf{l}\in \left\langle\!\left\vert \mathbb{H}_{}\to\mathbb{H}_{}\right\vert\!\right\rangle,\
\mathbf{d}\in \left[\!\left[\mathbb{D}\right]\!\right]_{1:\mathsf{I}},\
g\in \mathbb{N}_G
\end{aligned}
\right\rgroup\! \tag{11.2}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-workreport" class="gk-wrap">$\mathbb{R}$</span> | R | the set of work-reports: a core's signed receipt for one work-package |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-tuple">$\!\left\lgroup x\right\rgroup\!$</span> | the tuple of | a record: named fields, each with its type, like an object in JSON |
| <span id="gk-isa">[$x\in y$](../symbols.md#in)</span> | in | belongs to: the field's type |
| <span id="gk-wr-avspec" class="gk-wrap">$\mathbf{s}$</span> | bold s | a report's availability spec: the package's hash, its bundle's length, and the roots of its pieces and of the segments it exports |
| <span id="gk-avspec" class="gk-wrap">$\mathbb{Y}$</span> | Y | the set of availability specifications: package hash, bundle length, erasure root, shard count, segments root, segment count |
| <span id="gk-wr-context" class="gk-wrap">$\mathbf{c}$</span> | c | a report's refinement context: the blocks its package was built against, and its prerequisites |
| <span id="gk-workcontext" class="gk-wrap">$\mathbb{C}$</span> | C | the set of refinement contexts: the recent blocks a package was built against, and the packages it needs first |
| <span id="gk-wr-core">$c$</span> | c | the core a report's work was done on, 0 to C − 1 |
| <span id="gk-coreindex" class="gk-wrap">$\mathbb{N}_{\mathsf{C}}$</span> | N sub C | the core indices: 0 to C − 1 |
| <span id="gk-wr-authorizer">$a$</span> | a | a report's authorizer hash: which gatekeeper let its package onto the core |
| <span id="gk-hash">$\mathbb{H}$</span> | H | a 32-byte value, usually a hash |
| <span id="gk-wr-authtrace" class="gk-wrap">$\mathbf{t}$</span> | t | the authorizer's trace: the blob its code returned when it said yes (`auth_output`) |
| <span id="gk-blob">[$\mathbb{B}$](../symbols.md#blobs)</span> | B, or B sub n | bytes: any run of them; 𝔹ₙ exactly n of them |
| <span id="gk-wr-srlookup" class="gk-wrap">$\mathbf{l}$</span> | l | the segment-root lookup: for each package whose exports it imports by package hash, that package's segments root |
| <span id="gk-dictionary">$\left\langle\!\left\vert x\to y\right\vert\!\right\rangle$</span> | a dictionary from K to V | a map: keys of type K, each with one value of type V |
| <span id="gk-wr-digests" class="gk-wrap">$\mathbf{d}$</span> | d | the report's digests, one per work-item, 1 to 16 of them (`results`) |
| <span id="gk-sequence">[$\left[\!\left[x\right]\!\right]$](../symbols.md#sequence)</span> | a sequence of | ⟦T⟧ is an array of T; a subscript is its length, :n at most n, n: at least n |
| <span id="gk-Cmaxpackageitems" class="gk-wrap">$\mathsf{I}$</span> | I | the most work-items a package holds, so the most digests a report holds: 16 |
| <span id="gk-workdigest" class="gk-wrap">$\mathbb{D}$</span> | D | the set of work-digests: one item's result card, with its service, hashes, gas limit, result and load |
| <span id="gk-wr-authgasused">$g$</span> | g | the gas the authorizer's code used (`auth_gas_used`) |
| <span id="gk-gas" class="gk-wrap">$\mathbb{N}_G$</span> | N sub G | an amount of gas: a u64 |

</details>

→ [(11.2) in plain words](./gray-paper.md#ex-11-2)

:::

::: gray-paper 11.1.3

#### §11.1.3 Availability {#gp-11-1-3}

<a id="gp-11-1-3-p1"></a>We define the set of *availability specifications*, $\mathbb{Y}$, as the tuple of the work-package's hash $p$, an auditable work bundle length $l$ (see section [14.4.1](./gray-paper.md#gp-14-4-1-p1) for more clarity on what this is), together with an erasure-root $u$, the total number of <abbr class="gp-term" title="cut into one piece per validator, so that any third of the pieces rebuild the whole">erasure-coded</abbr> chunks $v$, a segment-root $e$ and segment-count $n$. Work-reports include this availability specification in order to ensure the original work-package is able to be correctly reconstructed and the purported ramifications audited. Formally:

<a id="gp-11-1-3-p2"></a><a id="eq-11-5"></a>

$$
\begin{align}
\mathbb{Y} &\equiv \!\left\lgroup
p\in \mathbb{H}_{}\,,\;
l\in \mathbb{N}_L\,,\;
u\in \mathbb{H}_{}\,,\;
v\in \mathbb{V}\,,\;
e\in \mathbb{H}_{}\,,\;
n\in \mathbb{N}
\right\rgroup\! \tag{11.5}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-as-packagehash">$p$</span> | p | the work-package's hash |
| <span id="gk-as-bundlelen">$l$</span> | l | the bundle's length in bytes: the package with everything needed to refine it again |
| <span id="gk-bloblength" class="gk-wrap">$\mathbb{N}_L$</span> | N sub L | a length of bytes: a u32 (below 2³²) |
| <span id="gk-as-erasureroot">$u$</span> | u | the erasure root: one Merkle root over every validator's shard of the bundle and the exports |
| <span id="gk-as-erasureshards">$v$</span> | v | how many shards the data is cut into: one per validator, 1,023 on full, 6 on tiny |
| <span id="gk-valcount" class="gk-wrap">$\mathbb{V}$</span> | V (the set) | the validator counts allowed: multiples of 3 from 6 to 3C, which is 1,023 on full and 6 on tiny |
| <span id="gk-as-segroot">$e$</span> | e | the root of the segments a package exports |
| <span id="gk-as-segcount">$n$</span> | n | how many segments the package exported |
| <span id="gk-N" class="gk-wrap">[$\mathbb{N}$](../symbols.md#naturals)</span> | N | the whole numbers: 0, 1, 2 and up; a subscript is a bound, ℕ₈ is 0 to 7 |

</details>

→ [(11.5) in plain words](./gray-paper.md#ex-11-5)

<a id="gp-11-1-3-p3"></a>The *erasure-root* ($u$) is the root of a binary Merkle tree whose leaves are the $v$ chunks produced by erasure-coding the <abbr class="gp-term" title="a package with everything needed to redo its work, as auditors fetch it">work-package bundle</abbr> and exported segments. As one chunk is distributed to each assurer, the number of chunks must equal the size of the assuring validator set. The erasure-root functions as a <abbr class="gp-term" title="a short hash that stands for some data, so the data can be checked against it later">commitment</abbr> to all data required for the auditing of the report and for use by later work-packages should they need to retrieve any data yielded. It is thus used by assurers to verify the correctness of data they have been sent by guarantors, and it is later verified as correct by auditors. It is discussed fully in section [14](./index.md#gp-14-1-p1).

<a id="gp-11-1-3-p4"></a>The *segment-root* ($e$) is the root of a constant-depth, left-biased and zero-hash-padded binary Merkle tree committing to the hashes of each of the exported segments of each work-item. These are used by guarantors to verify the correctness of any reconstructed segments they are called upon to import for evaluation of some later work-package. It is also discussed in section [14](./index.md#gp-14-1-p1).

:::

§11.1.1 (*Work Report*) says a report is:

- the *availability specification*: how to find the package's data again later;
- the refinement *context* ([lesson 2.6](../02-codec/06-the-first-test-vectors.md)) and the *core* that did the work;
- the *authorizer*'s hash, the gas it used, and its output (the vectors call that
  output `auth_output`);
- a *segment-root lookup*: for work-packages this one imported segments from, by
  package hash, the root of the segments they exported;
- the work *digests*, one per item ([lesson 3.2](./02-work-digests.md)).

And the availability specification (§11.1.3, *Availability*) is six things: the package's
hash, the length of its *bundle* (the package plus everything needed to re-run it), an
**erasure root** with the number of **erasure shards**, and the root and count of the
segments it exported.

There is one shard per validator, so for the first time tiny and full vectors differ: 6
shards on tiny, 1,023 on full (`erasure_shards` is `ff 03` on full and `06 00` on tiny). The exports root is a second Merkle root,
over the exported segments themselves: a package that imports one later checks it there.

Where every field comes from is §14.4's function Ξ, which the guarantors run in-core and
your client never does: authorize, refine each item, then build the spec from the bundle
and the exports. [3.A](./gray-paper.md#gp-14-4) quotes it with the rest of §14, step by step.

Two fields are compact naturals: `core_index`, and `auth_gas_used`. Remember [lesson 1.2](../01-bytes-and-numbers/02-numbers.md)?
`auth_gas_used` is the field where lasair's signed-number bug lived.

How can a few pieces hold the whole? The same idea in miniature, not JAM's exact code.
Take the message "JAM": its bytes are 74, 65 and 77. Draw them as dots at x = 0, 1 and 2.
Through any three dots passes exactly one curve, `y = a + bx + cx²`, and through these it's
y = 74 − 19.5x + 10.5x²: down from 74 to 65, then up to 77. Read the curve on at x = 3,
4 and 5: 110, 164 and 239. Six numbers, one per validator: those are the shards.

Now lose any three, even 74, 65 and 77, the message itself. The three left, 110, 164 and
239, lie on only one curve, the same one, and at x = 0, 1 and 2 it gives 74, 65 and 77
back. Lose four and two dots are left, and two dots lie on many curves, each reading a
different message. There's no telling which.

Take validators offline and press *rebuild*, or type a message of your own.

<ShardRebuild />

### The curve, worked by hand

Don't take the curve on trust: it's school algebra, and every step can be checked.

Between x = p and x = q, the curve `y = a + bx + cx²` climbs (y at q − y at p) ÷ (q − p)
per step, and that always comes to b + c × (p + q), since `cq² − cp² = c × (q − p) × (q + p)`.
For "JAM", from x = 0 to 1 it climbs 65 − 74 = −9, which is b + c; from 1 to 2 it climbs
77 − 65 = 12, which is b + 3c. The two differ by 2c, so c = 21 ÷ 2 = 10.5. Then
b = −9 − 10.5 = −19.5, and a is the height at 0: 74.

Rebuilding is the same sums on whichever three shards are left. From 110, 164 and 239 at
x = 3, 4 and 5, it climbs 54, then 75: b + 7c and b + 9c. They differ by 2c, so c = 21 ÷ 2 = 10.5
again, and the same curve comes back. Make the shards, then rebuild from any three:

<CurveSolve />

That's how JAM works all the way up: a validator doesn't trust its shard, it checks it
against the erasure root; an auditor doesn't trust a report, it rebuilds the bundle and
runs it again.

> **Albert:** Knowledge = Truth, not Trust.

### Shamir's secret sharing: the same curve, the other way round

You may know [*Shamir's secret sharing*](../glossary.md#shamir-s-secret-sharing): it's how some hardware wallets back up a seed
phrase as any 3 of 6 cards (Trezor calls it *Shamir Backup*). Same trick: a curve through
points, and any 3 points pin it down. But it wants the opposite thing.

Shamir puts one secret at x = 0 and rolls dice for the rest. Hide 49, roll 7 and 3, and
the curve is y = 49 + 7x + 3x². The six shares are its heights at x = 1 to 6: 59, 75, 97,
125, 159 and 199. Any 3 pin the curve down, and at x = 0 it gives 49 back. Any 2 say
nothing at all: for every possible secret, a curve runs through it and those two points.
Above, that was the problem. For Shamir, it's the point.

| | Erasure coding | Shamir's secret sharing |
| --- | --- | --- |
| Wants | the data back, even with most pieces gone | the secret hidden until enough shares meet |
| The curve carries | the data itself: the first shards are the message | one secret, and random numbers |
| Each piece | a slice: a third of "JAM"; on full, 1/342 of the bundle | as big as the whole secret |
| A few pieces | show part of the data, in plain sight | show nothing |

Neither is encryption: there's no key. Shamir's secrecy comes from the dice alone, and no
amount of computing power gets round it. Erasure coding has no secrecy at all: shard 0 of
"JAM" is 74, the "J" itself. The chain wants none: auditors must be able to read a bundle.

## The test

**Add to** `test/work.test.ts`

```ts
import { WorkReport } from "../src/work.ts";

for (const spec of ["tiny", "full"]) {
  test(`work_report (${spec})`, () => checkCodecVector(WorkReport, `codec/${spec}/work_report`));
}
```

## The code

**Add to** `src/work.ts`

```ts
/** An availability specification (GP §11): how to find a package's data again. */
export const AvailabilitySpec = record({
  hash: hash, // the work-package's hash
  length: u32, // the size of its bundle, the package plus everything needed to re-run it
  erasure_root: hash, // the root of its erasure-coded chunks
  erasure_shards: u16, // how many chunks: one per validator
  exports_root: hash, // the root of the segments it exported
  exports_count: u16,
});
export type AvailabilitySpec = Value<typeof AvailabilitySpec>;

/** A segment-root lookup entry: a work-package's hash and the root of its segments. */
export const SegmentRootLookupItem = record({
  work_package_hash: hash,
  segment_tree_root: hash,
});
export type SegmentRootLookupItem = Value<typeof SegmentRootLookupItem>;

/** A work-report (GP §11): what a core sends back for one work-package. */
export const WorkReport = record({
  package_spec: AvailabilitySpec,
  context: RefineContext,
  core_index: natural32,
  authorizer_hash: hash,
  auth_gas_used: natural,
  auth_output: blob,
  segment_root_lookup: seq(SegmentRootLookupItem),
  results: seq(WorkDigest),
});
export type WorkReport = Value<typeof WorkReport>;
```

The Gray Paper calls the lookup a *dictionary* (hash to hash), and Appendix C encodes a
small dictionary as a list of its key-value pairs, sorted by key, length in front. So
that's what this is: a `seq` of pairs. (The vectors' lookup is empty, but the shape is
ready.)

Once more the encoding's order beats the definition's: §11 lists the authorizer's gas
*last*, Appendix C writes it fifth. The record follows Appendix C.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ work_report (tiny) (0.9ms)
✔ work_report (full) (0.7ms)
...
ℹ tests 32
ℹ suites 0
ℹ pass 32
ℹ fail 0
...
reported 32 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791727156593
...
```

## Watch it

**Replace in** `bin/decode.ts`

```ts
import { WorkReport } from "../src/work.ts";

/** The structures this program knows, by the test vectors' names for them. */
const CODECS: Record<string, Codec<unknown>> = {
  refine_context: RefineContext,
  work_item: WorkItem,
  work_package: WorkPackage,
  work_result: WorkDigest,
  work_report: WorkReport,
};
```

What flows through this run: the file's bytes, the report they decode to, the trace printed:

::: code-group

```text [what goes in]
work_report.bin (full), 483 bytes; the first 48:
30 46 6e 0a e1 b0 5d de 52 49 87 24 75 f6 be ea
c3 68 fd 01 4b 5a 34 13 ce b3 2d 38 72 14 32 84
2a 00 00 00 7a f1 1f da a7 17 c3 98 e2 23 21 18 …
```

```ts [what it computes]
// WorkReport.decode(r): the value it returns (trimmed)
const computed = {
  package_spec: {
    hash: "0x30466e0a…", // the first 32 bytes, as they are
    length: 42, // 2a 00 00 00: the bundle's length, 4 bytes
    erasure_root: "0x7af11fda…", // 32 bytes
    erasure_shards: 1023, // ff 03, little end first: one shard per full validator
    exports_root: "0xe8e52949…", // 32 bytes
    exports_count: 69, // 45 00
  },
  core_index: 3, // one byte, 03: a compact natural, small enough for one
  authorizer_hash: "0x022e5e16…", // 32 bytes
  auth_output: "0x0102030405", // a blob, its length in front
  segment_root_lookup: [], // an empty dictionary: a count of 00
  results: [ // two digests, each 3.2's shape
    { service_id: 16909060, accumulate_gas: 42 }, // result: ok
    { service_id: 84281096, accumulate_gas: 33 }, // result: panic
  ],
};
```

```text [what comes out]
   32..36    package_spec.length            0x2a000000
   68..70    package_spec.erasure_shards    0xff03
  273..274   core_index                     0x03
```

:::

The first 32 bytes are the package's hash, the next four its length, 42. `ff 03` is the
shard count, 1,023, and `core_index` takes one byte because 3 is small. Each line of
the trace is one field of the value on the left.

**Run**

```sh
npm pkg set scripts.decode-work-report="node bin/decode.ts work_report ../vectors/codec/full/work_report.bin"
npm run decode-work-report
```

```text
    0..32    package_spec.hash              0x30466e0ae1b05dde5249872475f6beeac368fd014b5a3413ceb32d3872143284
   32..36    package_spec.length            0x2a000000
   36..68    package_spec.erasure_root      0x7af11fdaa717c398e223211842b41392f18df4bbc4ea0f4cfb972f19c7a64949
   68..70    package_spec.erasure_shards    0xff03
   70..102   package_spec.exports_root      0xe8e52949f6e4fb1d943248df48c3f2b538200fddfea22388e5e061be8ebf21a7
  102..104   package_spec.exports_count     0x4500
...
  273..274   core_index                     0x03
...
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=decode-1791727157021
```

`0xff03`, little end first, is `0x03ff`: 1,023 shards, one per validator on the full
network. Run the same file from `tiny/` and you get `0x0600`. And `core_index` is a single
byte, `0x03`: compact, because it's small.

<details>
<summary>lasair: a trap that tiny can't see, in <code>lib/serialization.ml</code></summary>

```ocaml
let encode_work_report (r : work_report) : bytes =
  let pkg = encode_package_spec r.package_spec in
  let ctx = encode_refinement_context r.context in
  (* core_index is a JAM compact natural, NOT a fixed byte: full-spec cores
     reach 340 (>127 = 2 compact bytes). For tiny cores (0..1, <128) compact ==
     a single byte, so this stays byte-identical for tiny. *)
  let core = encode_compact (Int64.of_int r.core_index) in
  let auth = encode_hash r.authorizer_hash in
  let gas = encode_compact r.auth_gas_used in
  let trace = encode_var r.auth_output in
  let srl = encode_var_sequence encode_segment_lookup_entry r.segment_root_lookup in
  (* All work result items include exports field per graypaper serialization.tex *)
  let res = encode_work_result_items r.results in
  encode_tuple [pkg; ctx; core; auth; gas; trace; srl; res]
```

Read that comment twice. Encode `core_index` as one plain byte and every vector here
still passes: both sizes' vectors put their report on core 3 (a codec vector needn't be a
real chain's), and a real tiny chain's cores only go up to 1. Only a core of 128 or more,
which only full has (up to 340), shows the mistake, and no binary vector in this tutorial
carries one. Some rules no test catches for you: this one
you get right by reading it.

</details>

## Check your understanding

::: check
**What does a work-report claim, and how can anyone check the claim?**

- [ ] That a block is valid; by importing the block
  > No: a report is about one work-package on one core, not about a block.
- [x] That a core ran a package and got these results; by fetching the bundle and running it again
  > Yes: the report names the package, carries a digest per item, and says how to get the
  > data back. An auditor rebuilds the bundle and refines it again.
- [ ] That the guarantors are honest; by checking their signatures
  > No: a signature says who made the claim, not that it is true. Running the work again
  > does that.

**On tiny, 4 of the 6 validators go offline. Can the bundle be rebuilt from the other 2 shards?**

- [ ] Yes: each shard is a full copy, so any one will do
  > No: a shard is a piece, not a copy. If one were enough, the rule would be any 1 of
  > the 6, not any 3.
- [ ] Yes: 2 is a third of 6, and a third is enough
  > No: it takes a third *plus one*: 6 ÷ 3 + 1 = 3 shards.
- [x] No: it takes 3, and more than one bundle fits the same 2 shards
  > Yes: as with the curve, any 3 points fix it, but 2 points fit many curves. With 3
  > validators left, it rebuilds.

**683 of 1,023 validators say they hold their shard, and 341 of them are lying. Can the bundle be rebuilt?**

- [ ] No: a third of them lied, so the data is lost
  > No: the liars don't matter as long as enough others tell the truth. 683 − 341 = 342
  > really hold a shard.
- [x] Yes: the other 342 hold real shards, and any 342 rebuild it
  > Yes: that's why it takes more than two-thirds. Even with a third lying, a third plus
  > one is left.
- [ ] Only once the liars' shards are checked against the erasure root
  > No: the auditor doesn't need the liars at all. It checks every shard it fetches
  > against the root, and the 342 real ones are enough.

**What does erasure coding buy?**

- [ ] Compression: the shards together are smaller than the bundle
  > No: they're bigger. Any 342 of the 1,023 shards hold the whole bundle, so all 1,023
  > hold about three times as much.
- [ ] Secrecy: no single validator can read the bundle
  > No: it isn't encryption. It is about getting the data back, not hiding it.
- [x] The bundle survives even if most validators vanish, and no one has to keep all of it
  > Yes: each validator keeps one piece, and any 342 of the 1,023 rebuild the bundle. So
  > 681 can be gone and the data is still there.

**The erasure root is a Merkle root. Is erasure coding a Merkle tree, then?**

- [ ] Yes: the tree is what lets the data be rebuilt
  > No: a tree of hashes can't bring back lost data. It can only check data you have.
- [x] No: erasure coding makes the pieces, and the Merkle tree lets anyone check one piece against the report
  > Yes: two tools, stacked. One makes the data survive, the other makes each piece
  > checkable without the rest.
- [ ] No: the erasure root is a hash of the whole bundle
  > No: it is the root of a tree over every validator's shard, so a single shard can be
  > checked alone.
:::

## What you have

[Part 3](./index.md)'s paperwork, complete: package in, digests out, and the report that binds them,
all byte for byte with the official vectors at both sizes. Reports reach the chain
inside blocks, along with tickets, preimages, assurances and disputes: [Part 4](../04-blocks/index.md) encodes a
whole block.

Next: [Part 4 · Blocks](../04-blocks/index.md)
