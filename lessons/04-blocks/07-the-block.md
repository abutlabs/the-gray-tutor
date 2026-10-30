# The block

Drumroll. You have a header (4.6) and all five parts of an extrinsic (4.1 to 4.4). A
block is the two together. This lesson is short on purpose: after everything you've
built, the whole block is two little records, and then your client reads real JAM blocks.

## New words

- **Block.** A header plus an extrinsic: everything the chain adds in one slot.
  *Example:* `block.bin` in the codec vectors.

It's in the [glossary](../glossary.md).

## What the Gray Paper says

§4 says a block B is a header H and an extrinsic E, and the extrinsic is its five parts.
Appendix C writes the block as the header, then the five parts in its own order: tickets,
preimages, guarantees, assurances, disputes ([lesson 4.1](./01-tickets-and-preimages.md) had the table). Nothing in
between, no lengths around the parts beyond their own.

## The tests

**Add to** `test/block.test.ts`

```ts
import { Block, Extrinsic } from "../src/block.ts";

testCodecVector("extrinsic", Extrinsic);
testCodecVector("block", Block);
```

## The code

**Add to** `src/block.ts`

```ts
/** A block's extrinsic (GP §4): the five parts, in Appendix C's order. */
export function Extrinsic(config: Config) {
  return record({
    tickets: TicketsExtrinsic,
    preimages: PreimagesExtrinsic,
    guarantees: GuaranteesExtrinsic,
    assurances: AssurancesExtrinsic(config),
    disputes: DisputesExtrinsic,
  });
}
export type Extrinsic = Value<ReturnType<typeof Extrinsic>>;

/** A block (GP §4): a header and an extrinsic. */
export function Block(config: Config) {
  return record({
    header: Header(config),
    extrinsic: Extrinsic(config),
  });
}
export type Block = Value<ReturnType<typeof Block>>;
```

That's the whole thing. Both are functions of the config because two of their bricks
are: the assurances' bitfield (4.2) and the header's tickets mark (4.6).

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ block (tiny) (0.8ms)
✔ block (full) (7.4ms)
...
ℹ tests 52
ℹ suites 0
ℹ pass 52
ℹ fail 0
...
reported 52 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791728275436
...
```

`block (tiny)` and `block (full)`: your client decodes complete JAM blocks, byte for
byte, at both sizes. Take a moment. That's every structure a block can carry.

## Watch a whole block

**Replace in** `bin/decode.ts`

```ts
import { Block, Extrinsic } from "../src/block.ts";

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
  header: Header(config),
  extrinsic: Extrinsic(config),
  block: Block(config),
});
```

**Run**

```sh
npm pkg set scripts.decode-block="node bin/decode.ts block ../vectors/codec/tiny/block.bin"
npm run decode-block
```

```text
    0..32    header.parent                  0x5c743dbc514284b2ea57798787c5a155ef9d7ac1e9499ec65910a7a3d65897b7
   32..64    header.parent_state_root       0x2591ebd047489f1006361a4254731466a946174af02fe1d86681d254cfd4a00b
...
 5086..5150  extrinsic.disputes.faults.0.signature 0x557e5ee3660be9247c4908c74a46c91eebd713925dd7f2ede3ef4900ba277039f7d46ec15432116176cce8ce39d8ae21eabafdf71796eeb724ee7e4ff1dd1fd7
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=decode-1791728275906
```

145 fields, from `header.parent` at byte 0 to the last fault's signature ending at byte
5,150: every byte of a tiny block, accounted for. Now try the full one,
`../vectors/codec/full/block.bin`: 161,177 bytes, most of them a 1,023-validator epoch
mark and two juries of 683. It scrolls by in a blink, and the whole trace lands in
Grafana's *Decode trace* panel, where you can search it.

Here is the same block as a strip, each part as wide as its bytes. Tap a part for where
it sits and what the trace names there, then switch to full and watch the header and
the disputes swallow the rest.

<BlockStrip />

![Decode trace panel](./images/07-decode-trace.png)

## The scoreboard

Every structure the codec vectors hold now has a codec: the work items and reports of
[Part 3](../03-work-and-reports/index.md), each extrinsic part, the header and the block.
Give the scoreboard all of them. The sized ones come as functions of the config, as
`testCodecVector` takes them, and the size comes from the vector's folder:

**Replace in** `test/families.ts`

```ts
import type { Config } from "../src/config.ts";
import { RefineContext, WorkItem, WorkPackage, WorkDigest, WorkReport } from "../src/work.ts";
import { TicketsExtrinsic, PreimagesExtrinsic, AssurancesExtrinsic, GuaranteesExtrinsic, DisputesExtrinsic, Header, Extrinsic, Block } from "../src/block.ts";

/** The codecs for the codec vectors, by the vectors' names for the structures. A codec
 * whose shape depends on the size comes as a function of the config. */
const CODECS: Record<string, Codec<unknown> | ((config: Config) => Codec<unknown>)> = {
  refine_context: RefineContext,
  work_item: WorkItem,
  work_package: WorkPackage,
  work_result_0: WorkDigest,
  work_result_1: WorkDigest,
  work_report: WorkReport,
  tickets_extrinsic: TicketsExtrinsic,
  preimages_extrinsic: PreimagesExtrinsic,
  assurances_extrinsic: AssurancesExtrinsic,
  guarantees_extrinsic: GuaranteesExtrinsic,
  disputes_extrinsic: DisputesExtrinsic,
  header_0: Header,
  header_1: Header,
  extrinsic: Extrinsic,
  block: Block,
};

/** A codec vector, such as "codec/tiny/work_item.json", by its round trip. */
function checkCodec(name: string) {
  const structure = name.split("/").at(-1)!.replace(".json", "");
  const codec = CODECS[structure];
  assert.ok(codec, `no codec for ${structure} yet`);
  const sized = typeof codec === "function" ? codec(configOf(name)) : codec;
  checkCodecVector(sized, name.replace(".json", ""));
}
```

**Add to** `test/families.ts`

```ts
import { FULL, TINY } from "../src/config.ts";

/** The size a vector is written for, from its folder: full or tiny. */
const configOf = (name: string): Config => (name.includes("/full/") ? FULL : TINY);
```

The whole block is the biggest codec vector. Its header and the five-part extrinsic, trimmed:

::: code-group

```json [what goes in]
{
  "vector": "vectors/codec/tiny/block.json",
  "header": {
    "parent": "0x5c743dbc51\u2026",
    "slot": 42,
    "author_index": 3,
    "seal": "0x31dc5b1e94\u2026"
  },
  "extrinsic": "{ tickets, preimages, guarantees, assurances, disputes }"
}
```

```text [console]
codec                    30 of 30  ✔
30 of 1,428 vectors pass.
```

:::

Run whole, a vector like this one decodes to a header and an extrinsic, then encodes back to its exact bytes. Every one of the 30 does that now, hence the family row.

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
shuffle                  not run yet (1)
stf/accumulate           not run yet (126)
stf/assurances           not run yet (22)
stf/authorizations       not run yet (6)
stf/disputes             not run yet (60)
stf/history              not run yet (8)
stf/preimages            not run yet (16)
stf/reports              not run yet (92)
stf/safrole              not run yet (46)
stf/statistics           not run yet (8)
traces/fallback          not run yet (100)
traces/fuzzy             not run yet (200)
traces/fuzzy_light       not run yet (200)
traces/preimages         not run yet (100)
traces/preimages_light   not run yet (100)
traces/safrole           not run yet (100)
traces/storage           not run yet (100)
traces/storage_light     not run yet (100)
trie                     not run yet (1)

30 of 1,428 vectors pass.
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=scoreboard-1791938953569
```

> [!TIP] Milestone
> **Every codec vector.** All 30, tiny and full: every JAM structure the
> official vectors encode, decoded and encoded back byte for byte.

<details>
<summary>lasair: <code>decode_block</code>, in <code>conformance/block_codec.ml</code></summary>

```ocaml
let decode_block b off : raw_block * int =
  let (header, off) = decode_header b off in
  let (extrinsic, off) = decode_extrinsic b off in
  ({ rb_header = header; rb_extrinsic = extrinsic }, off)
```

Three lines at the top, sitting on a few hundred lines of hand-written decoders below.
Yours sits on `record`, `seq` and friends: the same block, a lot less code to get wrong.

</details>

## Check your understanding

::: check
**How are a block's bytes laid out?**

- [ ] The header and each extrinsic part, each with its length in front
  > No: there's nothing in between. The parts carry only the lengths their own rules
  > give them, such as each list's length.
- [ ] The extrinsic first, then the header that describes it
  > No: the header comes first, the extrinsic after.
- [x] The header, then the five parts in Appendix C's order, back to back
  > Yes: tickets, preimages, guarantees, assurances, disputes, straight after the
  > header's seal.

**Why are `Block` and `Extrinsic` functions of the config?**

- [ ] Because a full block is much bigger than a tiny one
  > No: bigger alone doesn't matter. A verdict on full has 683 votes, and
  > `DisputesExtrinsic` is still a plain codec, because the votes carry their length.
- [x] Because two of their bricks are: the assurances' bitfield and the header's tickets mark
  > Yes: the bitfield has ⌈C/8⌉ bytes and the tickets mark holds E tickets. Anything
  > built from them needs the config too.
- [ ] Because every block says in its first byte whether it's tiny or full
  > No: nothing in the bytes says which size. The vectors' folders do, which is why
  > the code reads the size from the path.

**All 30 codec vectors pass. What can't your client do yet?**

- [ ] Read a full-size block
  > No: it does, 161,177 bytes of the full `block.bin`, byte for byte.
- [ ] Turn a block back into bytes
  > No: every vector checks the round trip, decoding and encoding back to exactly the
  > same bytes.
- [x] Check that a block is genuine: its parent hash, its extrinsic hash and its signatures
  > Yes: it reads all of those as plain bytes but checks none of them. That's
  > [Part 5](../05-hashing-and-signatures/index.md)'s job.
:::

## What you have

[Part 4](./index.md), done: your client reads any JAM block, at either size, and can show you every
byte of it, and every one of the 30 codec vectors passes whole. What it can't do yet is check one. A block names its parent by *hash*, and
promises its extrinsic by hash, and is sealed with signatures. [Part 5](../05-hashing-and-signatures/index.md) brings the
cryptography.

Next: [Part 5 · Hashing and signatures](../05-hashing-and-signatures/index.md)
