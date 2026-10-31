# The header

The header is a block's cover page: a few hundred bytes that say where the block sits
in the chain, who made it, and what's inside, sealed with the author's signature. Every
node reads every header. It's the most-read structure in JAM, and now your client can
read it too.

## New words

- **Epoch mark.** At an epoch's first block only: fresh randomness, and the keys of the
  validators who take over in the epoch after this one. *Example:* most headers have none.
- **Tickets mark.** At most once per epoch, when the lottery closes having filled every
  slot: the winning ticket for every slot of the next epoch. *Example:* 600 tickets on
  full.
- **Seal.** The author's signature over the rest of the header. *Example:* 96 bytes, the
  last field.
- **Offenders mark.** The Ed25519 keys of the validators a block convicts in its
  disputes. *Example:* empty in almost every block.

All four are in the [glossary](../glossary.md).

## What the Gray Paper says

§5 (*The Header*) defines ten fields, here in the order Appendix C encodes them:

| Field | What it says |
| --- | --- |
| `parent` | the parent block's header hash: the link in the chain |
| `parent_state_root` | the state root after the parent block |
| `extrinsic_hash` | a hash committing to this block's extrinsic ([Part 4](./index.md)'s five bags) |
| `slot` | the timeslot ([lesson 0.4](../00-start/04-the-jam-clock.md)), ℰ₄ |
| `epoch_mark` | at an epoch's first block only: fresh randomness, and the keys of the validators who take over in the epoch after it |
| `tickets_mark` | at most once per epoch, when the ticket lottery closes with every slot filled: the winning ticket for every slot of the next epoch |
| `author_index` | which validator made this block, ℰ₂ |
| `entropy_source` | a VRF signature: 96 bytes of verifiable fresh randomness |
| `offenders_mark` | the Ed25519 keys of validators newly convicted in disputes ([lesson 4.4](./04-disputes.md)) |
| `seal` | the author's signature over all of the above |

Two markers that are only sometimes there: that's what `option` is for ([lesson 4.5](./05-maybe-and-exactly-n.md)). And
the tickets mark holds exactly one ticket per slot of an epoch, E of them, 12 on tiny and
600 on full, with no length in front: that's `seqN`. The epoch mark's validator list,
though, *does* carry its length: Gray Paper 0.8.0 lets the validator count change, so the
list says how long it is.

And the order? You know the drill. §5 lists the offenders mark before the author index;
Appendix C writes the author index, the entropy source, *then* the offenders. The encoding
wins.

Here are the two header test vectors, byte by byte, in Appendix C's order. Switch between
them. In `header_1`, the epoch mark is one byte: `00`, nothing. In `header_0`, it's `01`
and then 449 bytes of value. Tap a field to light up its bytes and see its rule worked on
its real value; tap a byte to find its field. Long values fold to their first and last
bytes: tap the fold to see the rest.

<HeaderMap />

## The size grows

The tickets mark needs E, so the config gets its third constant:

**Replace in** `src/config.ts`

```ts
/** The protocol constants that depend on the size of the network. */
export type Config = {
  name: string;
  validators_count: number; // V: validators in a set
  core_count: number; // C: cores doing work in parallel
  epoch_length: number; // E: timeslots in an epoch
};

export const TINY: Config = {
  name: "tiny",
  validators_count: 6,
  core_count: 2,
  epoch_length: 12,
};

export const FULL: Config = {
  name: "full",
  validators_count: 1023,
  core_count: 341,
  epoch_length: 600,
};
```

An epoch is 600 slots of six seconds: one hour. Tiny's epochs last a brisk 72 seconds.

## The tests

**Add to** `test/block.test.ts`

```ts
import { Header } from "../src/block.ts";

testCodecVector("header_0", Header);
testCodecVector("header_1", Header);
```

The two vectors show both markers: `header_0` has an epoch mark and no tickets, `header_1`
a tickets mark and no epoch mark. (Both say slot 42, the middle of an epoch on tiny: a
codec vector only has to have the right shape.)

## The code

**Add to** `src/block.ts`

```ts
import { option, seqN } from "./codec/codec.ts";

/** A validator's two public keys, as an epoch mark lists them. */
export const EpochMarkValidatorKeys = record({
  bandersnatch: fixedBytes(32), // for sealing blocks and the ticket lottery
  ed25519: fixedBytes(32), // for signing everything else
});
export type EpochMarkValidatorKeys = Value<typeof EpochMarkValidatorKeys>;

/** The epoch mark (GP §5): at an epoch's first block, the randomness and validators ahead. */
export const EpochMark = record({
  entropy: hash,
  tickets_entropy: hash,
  validators: seq(EpochMarkValidatorKeys),
});
export type EpochMark = Value<typeof EpochMark>;

/** A winning ticket: its id and attempt. Once a ticket has won, its proof can stay behind. */
export const TicketBody = record({
  id: hash,
  attempt: u8,
});
export type TicketBody = Value<typeof TicketBody>;

/** A block header (GP §5). */
export function Header(config: Config) {
  return record({
    parent: hash, // the parent block's header hash
    parent_state_root: hash, // the state root after the parent block
    extrinsic_hash: hash, // commits to this block's extrinsic
    slot: u32,
    epoch_mark: option(EpochMark), // only in an epoch's first block
    tickets_mark: option(seqN(TicketBody, config.epoch_length)), // when the lottery closes
    author_index: u16, // which validator made this block
    entropy_source: fixedBytes(96), // a VRF signature: fresh randomness for the chain
    offenders_mark: seq(fixedBytes(32)), // Ed25519 keys of newly convicted validators
    seal: fixedBytes(96), // the author's signature over everything above
  });
}
export type Header = Value<ReturnType<typeof Header>>;
```

A winning ticket in the header is just its `id` and `attempt`. The 784-byte proof from
[lesson 4.1](./01-tickets-and-preimages.md) already did its job when the ticket was submitted; by now everyone has checked
it, so the header can travel light.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ header_1 (tiny) (0.7ms)
✔ header_1 (full) (2.0ms)
...
ℹ tests 48
ℹ suites 0
ℹ pass 48
ℹ fail 0
...
reported 48 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791728274365
...
```

## Watch it

**Replace in** `bin/decode.ts`

```ts
import { Header } from "../src/block.ts";

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
});
```

What flows through this run — the file's bytes, the header they decode to, the trace printed:

::: code-group

```text [what goes in]
header_1.bin, 693 bytes; the first 40:
5c 74 3d bc 51 42 84 b2 ea 57 79 87 87 c5 a1 55 ef 9d 7a c1
e9 49 9e c6 59 10 a7 a3 d6 58 97 b7 25 91 eb d0 47 48 9f 10 …
```

```ts [what it computes]
// Header(TINY).decode(r): the value it returns (trimmed)
const computed = {
  parent: "0x5c743dbc…", // the first 32 bytes
  parent_state_root: "0x2591ebd0…", // the next 32
  extrinsic_hash: "0x74a9e79d…", // and 32 more
  slot: 42, // 4 bytes, ending at byte 100
  epoch_mark: null, // 00: nothing follows
  tickets_mark: [ // 01, then exactly E = 12 tickets, no length in front
    { id: "0x8c25c063…", attempt: 0 }, // ticket 0
    { id: "0xabf4869d…", attempt: 3 }, // ticket 11, the last
  ],
  offenders_mark: [], // 00: a count of none
  author_index: 3,
};
```

```text [what comes out]
    0..32    parent                         0x5c743dbc514284b2ea57798787c5a155ef9d7ac1e9499ec65910a7a3d65897b7
  100..101   epoch_mark.present             0x00
  101..102   tickets_mark.present           0x01
  497..498   tickets_mark.11.attempt        0x03
```

:::

Three hashes and the slot fill the first 100 bytes. Then an option says "no epoch
mark", another says "a tickets mark", and twelve tickets follow with no count, because
the configuration says how many.

**Run**

```sh
npm pkg set scripts.decode-header="node bin/decode.ts header ../vectors/codec/tiny/header_1.bin"
npm run decode-header
```

```text
    0..32    parent                         0x5c743dbc514284b2ea57798787c5a155ef9d7ac1e9499ec65910a7a3d65897b7
...
  100..101   epoch_mark.present             0x00
  101..102   tickets_mark.present           0x01
...
  497..498   tickets_mark.11.attempt        0x03
...
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=decode-1791728274814
```

Read it top to bottom: no epoch mark (`0x00`), a tickets mark (`0x01`), and then twelve
tickets, `tickets_mark.0` to `tickets_mark.11`, one for each slot of tiny's next epoch.
No length anywhere in between: the client knew there'd be twelve.

<details>
<summary>lasair: four headers, in four files</summary>

lasair has a `type header` in `lib/header.ml`, written in the Gray Paper's own notation:

```ocaml
type header = {
  parent: hash;             (** H_p: Hash of parent header *)
  prior_state_root: hash;   (** H_r: Prior state root (BEFORE this block) *)
  extrinsic_hash: hash;     (** H_x: Extrinsic Merkle commitment *)
  timeslot: timeslot;       (** H_t: Timeslot index *)
  epoch_marker: epoch_marker option;    (** H_e: Fallback epoch data *)
  winners_marker: winners_marker option; (** H_w: Next epoch tickets *)
  offenders_marker: ed_key seq;  (** H_o: Misbehaving validators *)
  author_index: val_index;  (** H_i: Block author validator index *)
  vrf_signature: bs_signature;   (** H_v: Entropy VRF signature *)
  seal_signature: bs_signature;  (** H_s: Block seal signature *)
}
```

It also has one in `lib/block_codec.ml`, one in `lib/overview.ml`, and one in
`conformance/codec_tests.ml`: four headers, grown over months, each kept in step with the
others by hand and by tests. Your client has one `Header`, and it is the type, the
encoder, the decoder and the JSON reader at once.

</details>

## Check your understanding

::: check
**§5 lists the offenders mark before the author index. In a header's bytes, what comes straight after the tickets mark?**

- [ ] The offenders mark, as §5 lists it
  > No: §5 says what a header holds, not the order of its bytes. Appendix C moves the
  > offenders mark later.
- [x] The author index, ℰ₂
  > Yes: Appendix C writes the author index, then the entropy source, then the
  > offenders mark, then the seal. The encoding wins.
- [ ] The seal
  > No: the seal is the very last field, a signature over everything before it.

**In `header_1`, the epoch mark is the single byte `00`. What does it say?**

- [ ] An epoch mark with no validators in it
  > No: an epoch mark would start `01`, then its two 32-byte hashes, then the
  > validators' length. `00` is all there is.
- [x] This header has no epoch mark
  > Yes: `00` is the discriminator for "nothing". In `header_0` it's `01`, and the epoch
  > mark follows.
- [ ] Epoch 0
  > No: the byte is a tag, not a number. Which epoch a header is in comes from its
  > slot.

**The tickets mark has no length in front, but the epoch mark's validator list does. Why?**

- [ ] Tickets are small and validator keys are big
  > No: size doesn't decide it. What decides is whether the decoder already knows the
  > count.
- [ ] The tickets mark is optional, so its `01` says how many follow
  > No: the epoch mark is optional too, and its list still has a length. `01` only
  > says "present".
- [x] There's always one ticket per slot of an epoch, but 0.8.0 lets the validator count change
  > Yes: E is fixed, 12 on tiny and 600 on full, so the decoder knows the count. V can
  > change, so the list has to say how long it is.

**On tiny, the epoch mark's value is 449 bytes. Where does 449 come from?**

- [x] Two 32-byte hashes, a 1-byte length, and 6 validators' two 32-byte keys
  > Yes: 32 + 32 + 1 + 6 × 64 = 449. The length byte is `06`.
- [ ] 449 is the epoch mark's fixed size, on every network
  > No: it grows with the validators. On full, 1,023 of them, it's 32 + 32 + 2 +
  > 1,023 × 64 = 65,538 bytes, with a 2-byte length.
- [ ] Twelve tickets, one per slot of tiny's next epoch
  > No: those are the tickets mark, a different field. The epoch mark holds
  > randomness and validators' keys.
:::

## What you have

A client that can read the cover page of any JAM block, at either size. Cover page and
contents together make a block: [lesson 4.7](./07-the-block.md).

Next: [4.7 The block](./07-the-block.md)
