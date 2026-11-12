# Tiny and full

**In one sentence:** JAM comes in two sizes with the same rules, and an assurance is the
first structure whose shape depends on which size you run.

Here is one assurance. Switch between tiny and full, and watch which part grows.

<a id="try-it"></a>

<AssuranceParcel />

## The idea

How do you test a network of a thousand machines on a laptop? You can't. So JAM has two
sizes, each a [*configuration*](../glossary.md#configuration): a handful of numbers, and
the same rules. Full is a realistic picture of the network JAM will be. Tiny is small
enough to run and test on your own.

| | [*Validators*](../glossary.md#validator) | [*Cores*](../glossary.md#core) |
| --- | --- | --- |
| tiny | 6 | 2 |
| full | 1,023 | 341 |

Until now every structure had the same shape in both. The assurance is the first that
doesn't. In an assurance, a validator says which cores' data it is holding. Think of an
attendance sheet with one box per core: the validator ticks the boxes and signs the sheet.
More cores, a longer sheet.

A decoder can't guess how long the sheet is. Nothing in the bytes says. It has to know the
size of the network it is reading. So this lesson gives the client its two configurations,
and a codec that takes one as an argument.

## What the Gray Paper says

§11 (*The Assurances Extrinsic*): an assurance is four things.

- an **anchor**: the parent block's hash (every assurance in a block names the same one);
- a **bitfield**: one bit per core, 1 for "I've got its chunks";
- the **validator**'s index, ℰ₂;
- its **signature**: 64 bytes of Ed25519.

One bit per core means C bits, and Appendix C says how bits become bytes:

::: gray-paper C.1.4

#### Appendix C.1.4 Bit Sequence Encoding {#gp-C-1-4}

<a id="gp-C-1-4-p1"></a>A sequence of bits $b \in \mathbb{b}_{}$ is a special case since encoding each individual bit as an <abbr class="gp-term" title="a byte: 8 bits">octet</abbr> would be very wasteful. We instead pack the bits into <abbr class="gp-term" title="bytes: 8 bits each">octets</abbr> in order of least significant to most, and arrange into an octet stream. In the case of a variable length sequence, then the length is prefixed as in the general case.

<a id="gp-C-1-4-p2"></a><a id="eq-C-9"></a>

$$
\begin{align}
\mathcal{E}_{}\left(b \in \mathbb{b}_{}\right) &\equiv \begin{cases}
\left[\right] &\text{if } b = \left[\right] \\
\left[
\sum\limits_{i=0}^{i < \min(8, \left\vert b\right\vert)}
b_{i} \cdot 2^i
\right] \frown \mathcal{E}_{}\left(b_{8 \dots }\right) &\text{otherwise}\\
\end{cases} \tag{C.9}
\end{align}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-encode">[$\mathcal{E}\left(x\right)$](../symbols.md#encode)</span> | E of | the encoding of what's in the brackets: its bytes, by Appendix C's rules |
| <span id="gk-in">[$\in$](../symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-bitstring">$\mathbb{b}$</span> | b sub n | bits: a run of true-or-false values; a subscript is how many |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-sq">[$\left[x\right]$](../symbols.md#sequence)</span> | the sequence | a sequence written out item by item; [ ] is the empty one |
| <span id="gk-sum">$\sum$</span> | the sum of | add up what follows, once for each value the subscript ranges over |
| <span id="gk-min">$\min$</span> | the least of | the smallest of the values given; min(24, j : …) is the smallest j that fits, but no more than 24 |
| <span id="gk-len">$\left\vert x\right\vert$</span> | the size of | \|x\|: how many items x has, or how many bytes |
| <span id="gk-cdot">$\cdot$</span> | times | multiply |
| <span id="gk-concat" class="gk-wrap">[$\frown$](../symbols.md#concat)</span> | concatenate | join: the left sequence followed by the right |
| <span id="gk-interval">$_{x \dots y}$</span> | from x to y | the items from index x up to, not including, y |

</details>

→ [(C.9) explained](./gray-paper.md#ex-C-9)

:::

(C.9) packs bits into bytes, eight to a byte, lowest bit first: bit 0 is worth 1, bit 1 is
worth 2, and so on up to bit 7, worth 128. Then it does the same with the rest. So the
bitfield takes ⌈C/8⌉ bytes: **1 byte on tiny, 43 on full**. C fixes its length, so it
carries none in front ([4.7](./07-the-block.md#eq-C-20)'s (C.20) writes the bitfield
bare). A codec that reads one byte where there are 43 would misread every assurance,
starting with the first one's validator index.

Which cores does a validator assure? All of them at once. As [lesson 3.3](../03-work-and-reports/03-a-work-report.md#the-big-picture)
showed, every validator holds one shard of each report waiting on any core, so bit c says
"I hold my shard of core c's report". It knows which cores have a report waiting because
every validator keeps the same state.

Could it lie? There are two kinds of lie.

- A bit set for a core with nothing waiting, or a bad signature, makes the whole block
  invalid ([lesson 11.3](../11-assurances/03-bad-assurances.md)).
- A bit for a shard it doesn't really hold can't be caught on the chain. That's why a
  report needs more than two-thirds of the validators (5 of 6, 683 of 1,023): even if a
  third lied, the rest hold enough to rebuild it.

Either way, every node counts the same bits by the same rule and reaches the same state.
A lie can make the state wrong, never inconsistent.

The two sizes are the Gray Paper's own numbers and the vectors'. Gray Paper 0.8.0 lets the
validator count be any multiple of 3 from 6 to 1,023; the full vectors use the most.

Here is the network at both sizes: three guarantors per core, every validator holding a
piece of every core's work. Switch to full and the same picture holds 1,023 validators.

<JamNetwork />

## The configuration

**New file** `src/config.ts`

```ts
// JAM's two configurations, with the same rules: full, the future network with the Gray
// Paper's own numbers, and tiny, small enough to run on one machine. The official test vectors come
// in both, in folders named after them.

/** The protocol constants that depend on the size of the network. */
export type Config = {
  name: string;
  validators_count: number; // V: validators in a set
  core_count: number; // C: cores doing work in parallel
};

export const TINY: Config = { name: "tiny", validators_count: 6, core_count: 2 };

export const FULL: Config = { name: "full", validators_count: 1023, core_count: 341 };
```

Just the two numbers we need, for now. More constants move in as later lessons need them.

## A codec that depends on the size

A codec whose shape depends on the size becomes a *function*: it takes a config and
returns a codec.

**Add to** `src/block.ts`

```ts
import { hash, u16 } from "./codec/codec.ts";
import type { Config } from "./config.ts";

/** An assurance (GP §11): a validator's promise that it holds its chunks for these cores. */
export function Assurance(config: Config) {
  return record({
    anchor: hash, // the parent block's hash
    bitfield: fixedBytes(Math.ceil(config.core_count / 8)), // one bit per core, lowest first
    validator_index: u16,
    signature: fixedBytes(64), // the validator's Ed25519 signature
  });
}
export type Assurance = Value<ReturnType<typeof Assurance>>;

/** The assurances in a block. */
export function AssurancesExtrinsic(config: Config) {
  return seq(Assurance(config));
}
```

`ReturnType<typeof Assurance>` is "whatever `Assurance` returns", a codec, and `Value` of
that is the assurance itself. The bitfield stays as bytes, exactly as the vectors write
it. When a later lesson needs to ask "is core 7 available?", it'll pick the bit out.

## Testing both sizes

`testCodecVector` has to build the codec for each size. A codec object or a function of
the config: it now takes either.

**Replace in** `test/vectors.ts`

```ts
import type { Config } from "../src/config.ts";
import { FULL, TINY } from "../src/config.ts";

/**
 * Tests a codec against a codec vector at both sizes, tiny and full. A codec whose shape
 * depends on the size comes as a function of the config.
 */
export function testCodecVector(
  name: string,
  codec: Codec<unknown> | ((config: Config) => Codec<unknown>),
): void {
  for (const config of [TINY, FULL]) {
    const sized = typeof codec === "function" ? codec(config) : codec;
    test(`${name} (${config.name})`, () => checkCodecVector(sized, `codec/${config.name}/${name}`));
  }
}
```

**Add to** `test/block.test.ts`

```ts
import { AssurancesExtrinsic } from "../src/block.ts";

testCodecVector("assurances_extrinsic", AssurancesExtrinsic);
```

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ assurances_extrinsic (tiny) (0.7ms)
✔ assurances_extrinsic (full) (1.5ms)
...
ℹ tests 38
ℹ suites 0
ℹ pass 38
ℹ fail 0
...
reported 38 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791728269567
...
```

## Watch both sizes

`bin/decode.ts` needs to know the size too. The vectors keep each size in its own folder,
so the file's path says which.

**Replace in** `bin/decode.ts`

```ts
import { AssurancesExtrinsic } from "../src/block.ts";
import type { Config } from "../src/config.ts";
import { FULL, TINY } from "../src/config.ts";

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
});

// the vectors keep each size in its own folder, tiny/ or full/
const codec = CODECS(file?.includes("/full/") ? FULL : TINY)[name];
if (!codec || !file) {
  // the names are the same in both configurations, only some codecs change shape:
  // either one lists them
  throw new Error(`usage: npm run decode <${Object.keys(CODECS(TINY)).join("|")}> <file.bin>`);
}
```

What flows through these two runs:

::: code-group

```text [what goes in]
tiny/assurances_extrinsic.bin, 199 bytes; the first 34:
02 0c ff bf 67 aa e5 0a ee d3 c6 f8 f0 d9 bf 7d 85
4f fd 87 ce f8 35 8c bb aa 58 7a 9e 3b d1 a7 76 01 …

full/assurances_extrinsic.bin, 283 bytes; the same anchor, then the bitfield:
… 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55
  55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 15 …
```

```ts [what it computes]
// AssurancesExtrinsic(config).decode(r): the first assurance, in each configuration
const tiny = { // 2 cores: the bitfield is ⌈2 / 8⌉ = 1 byte
  anchor: "0x0cffbf67…", // the parent block's hash
  bitfield: "0x01", // core 0: available
  validator_index: 0,
};
const full = { // 341 cores: the bitfield is ⌈341 / 8⌉ = 43 bytes
  anchor: "0x0cffbf67…", // the same anchor
  bitfield: "0x5555…5515", // 0b01010101 per byte: every other core, 171 of 341
  validator_index: 0,
};
```

```text [what comes out]
    0..1     length                         0x02
   33..34    0.bitfield                     0x01
   33..76    0.bitfield                     0x55555555555555555555555555555555555555555555555555555555555555555555555555555555555515
```

:::

Both files start the same: `02` assurances, then the same 32-byte anchor. What differs
is the bitfield: one byte on tiny, 43 on full. That is why the codec is
`AssurancesExtrinsic(config)`, not one fixed shape.

**Run**

```sh
npm pkg set scripts.decode-assurances="node bin/decode.ts assurances_extrinsic ../vectors/codec/tiny/assurances_extrinsic.bin"
npm run decode-assurances
npm pkg set scripts.decode-assurances-full="node bin/decode.ts assurances_extrinsic ../vectors/codec/full/assurances_extrinsic.bin"
npm run decode-assurances-full
```

```text
    0..1     length                         0x02
...
   33..34    0.bitfield                     0x01
...
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=decode-1791728270087
    0..1     length                         0x02
...
   33..76    0.bitfield                     0x55555555555555555555555555555555555555555555555555555555555555555555555555555555555515
...
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=decode-1791728270298
```

Same assurance, both configurations. On tiny the bitfield is one byte, `0x01`: core 0, available.
On full it's 42 bytes of `0x55` and a last `0x15`. `0x55` is `0b01010101` in binary, so
every *other* core says "got it": 171 of the 341. (The last byte is smaller because 341
cores need only 5 of its 8 bits.)

Which cores are those? Lowest bit first: core 0 is the lowest bit of byte 0, the one at
the *right* end when the byte is written in binary, and core 7 the highest, at the left.
So `0b01010101`, read from the right, is cores 0, 2, 4 and 6. Click cores and watch the
bytes; "every other core" on full rebuilds the vector's bitfield:

<CoreBitfield />

<details>
<summary>lasair: the codec that froze at tiny</summary>

lasair got this wrong once, in a way that's easy to miss. Its bitfield size was a
module-level value, computed once, when the program loaded:

```ocaml
let bitfield_bytes = ((Stf_config.num_cores ()) + 7) / 8
```

At load time the spec was still tiny, so `bitfield_bytes` was 1 forever, even after the
program switched to full, and so was its twin, the number of votes a verdict carries,
stuck at tiny's 5. Every tiny test passed. Then the official fuzzer sent a full-size block
with a dispute in it: its verdict carried 683 votes, lasair read 5, and it crashed with
`decode: bad list count`. The fix, F5 in lasair's release notes, is two characters for
each: `()`, which turns the value into a function, computed each time:

```ocaml
let bitfield_bytes () = ((Stf_config.num_cores ()) + 7) / 8
```

Your `Assurance(config)` takes the size as an argument every time, so it can't freeze.

</details>

## Check your understanding

::: check
**What does an assurance say, and who says it?**

- [ ] A core's three guarantors say a work-report is correct
  > No: that is a guarantee, [lesson 4.3](./03-guarantees.md)'s. An assurance says nothing
  > about whether the work is right.
- [x] One validator says which cores' data it is holding, and signs it
  > Yes: one bit per core, 1 for "I hold my shard of that core's report", with the
  > validator's index and its signature.
- [ ] The block's author says the parent block is valid
  > No: the anchor names the parent, but an assurance comes from any validator, and what it
  > vouches for is data it holds.

**Why is an assurance's bitfield 1 byte on tiny but 43 on full?**

- [x] One bit per core, eight to a byte: 2 cores fit in 1 byte, 341 need 43
  > Yes: ⌈2/8⌉ = 1 and ⌈341/8⌉ = 43. The last byte on full uses only 5 of its 8 bits.
- [ ] One bit per validator: 6 on tiny, 1,023 on full
  > No: the bits are for cores, which cores' data this validator holds. One bit per
  > validator would take ⌈1023/8⌉ = 128 bytes on full.
- [ ] On full the bitfield has its length in front
  > No: the bitfield never has a length. Both sides know C, so both know how many
  > bytes to read.

**What goes wrong if a decoder reads a full assurance with tiny's 1-byte bitfield?**

- [ ] It reads cores 0 to 7 and quietly skips the rest
  > No: nothing in the bytes says "skip". A decoder reads exactly what its codec says,
  > and the next field starts straight after.
- [ ] It stops with an error at the bitfield
  > No: the bytes have no labels to disagree with. It reads on happily, and every
  > value after is wrong.
- [x] It takes the bitfield's next two bytes as the validator index, and is lost from there
  > Yes: one byte too few, and every field after it starts in the wrong place. The
  > signature, the next assurance, all misread.

**Why does the assurance codec become a function of the config, when a work-report's doesn't?**

- [ ] On full the numbers are bigger, so they need wider integers
  > No: the validator index is ℰ₂ on both sizes. Widths don't change with the network.
- [x] Its shape depends on the size: how many bytes the bitfield has depends on C
  > Yes: a codec must know how many bytes to read, and here that number comes from the
  > config, so the config goes in as an argument.
- [ ] Only full assurances are signed
  > No: every assurance carries a 64-byte signature, on both sizes.

**A validator sets the bit for a shard it doesn't really hold. What protects the chain?**

- [ ] The block is rejected: every node checks the bit against the validator's disk
  > No: the chain can't see what a validator holds. This lie can't be caught on the chain.
  > A bit for a core with nothing waiting can, and that does reject the block.
- [ ] Nothing: one false bit and the report's data may be lost
  > No: one validator's bit is never enough to count on.
- [x] The threshold: a report needs more than two-thirds of the validators, so even if a third lied the rest can rebuild it
  > Yes: 5 of 6 on tiny, 683 of 1,023 on full. And every node counts the same bits by the
  > same rule, so they all reach the same state.
:::

## What you have

A client that knows JAM's two configurations, and codecs that change shape to match.
Three of the five extrinsic parts done. [Lesson 4.3](./03-guarantees.md) adds the fourth:
guarantees, [Part 3](../03-work-and-reports/index.md)'s reports with signatures behind them.

Next: [4.3 Guarantees](./03-guarantees.md)
