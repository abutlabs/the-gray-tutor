# Tickets and preimages

Time to build a block. Not all at once: a block is a header plus five bags of stuff from
the outside world, and this lesson fills the two simplest bags.

Here they are, from the tiny vectors: each bag is a count, then its items. Tap any part.

<TicketsPreimages />

## New words

- **Extrinsic.** The part of a block that comes from outside the chain's state, in five
  lists, each as long as that block needs, often empty. *Example:* a tiny block carries 0
  to 3 tickets and 0 to 2 guarantees ([Part 4](./index.md#how-much-a-block-carries) has every range).
- **Ticket.** An anonymous entry in the lottery for who makes blocks in the next epoch.
  *Example:* `attempt` 1, and a 784-byte proof.
- **Ring VRF proof.** Cryptography that proves *some* validator in a set made something,
  without saying *which*. *Example:* every ticket carries one.
- **Preimage.** The data behind a hash: if h = H(d), d is h's preimage. Services ask for
  data by its hash, and blocks deliver it. *Example:* a new version of a service's code.

All four are in the [glossary](../glossary.md).

## What the Gray Paper says

§4 splits a block into its *header* and its *extrinsic* (the data that comes from
*outside* the chain's state), and the extrinsic into five parts:

| Part | What it carries | Lesson |
| --- | --- | --- |
| tickets | entries in the lottery for who authors future blocks | this one |
| preimages | data that services asked for by hash | this one |
| guarantees | work-reports, signed by the validators who vouch for them | 4.3 |
| assurances | validators' promises that they hold reports' data | 4.2 |
| disputes | judgements on reports someone thinks are wrong | 4.4 |

(§4's own equation lists them in another order, tickets, disputes, preimages,
assurances, guarantees. Appendix C writes them in the table's order. You know the drill
by now: the encoding's order wins.)

A **ticket** (§6) is an anonymous lottery entry. Every epoch, validators submit tickets
for the right to author blocks in the next one, and the best tickets win slots. Each
ticket says which of its owner's tries it is (`attempt`, one byte), and carries a *ring
VRF proof*: 784 bytes that prove *one of* the validators made it without revealing
*which*, so nobody knows who won a slot until it comes. You won't write that cryptography:
your client borrows it from a library ([Cryptography we use](../cryptography.md#bandersnatch-ring-vrf)), and
[lesson 8.8](../08-safrole/08-the-ring-root.md) checks every proof with it. Today they're just 784 bytes.

A *preimage* is the data behind a hash. Services can ask for data by its hash, and
anyone can then deliver it in a block: the requesting service's id (ℰ₄) and the data
itself, as a blob.

Tickets and preimages are each a sequence with its length in front.

## A shortcut for vector tests

[Part 4](./index.md) checks a lot of vectors, each at both sizes. One helper registers both tests in
one line:

**Add to** `test/vectors.ts`

```ts
import { test } from "node:test";

/** Tests a codec against a codec vector at both sizes, tiny and full. */
export function testCodecVector(name: string, codec: Codec<unknown>): void {
  for (const spec of ["tiny", "full"]) {
    test(`${name} (${spec})`, () => checkCodecVector(codec, `codec/${spec}/${name}`));
  }
}
```

## The tests

**New file** `test/block.test.ts`

```ts
import { PreimagesExtrinsic, TicketsExtrinsic } from "../src/block.ts";
import { testCodecVector } from "./vectors.ts";

testCodecVector("tickets_extrinsic", TicketsExtrinsic);
testCodecVector("preimages_extrinsic", PreimagesExtrinsic);
```

Four tests in two lines.

## The code

**New file** `src/block.ts`

```ts
// Blocks: a header, and the extrinsic, the data a block brings in from outside (GP §5).

import type { Value } from "./codec/codec.ts";
import { blob, fixedBytes, record, seq, u32, u8 } from "./codec/codec.ts";

/** A ticket (GP §6): an anonymous entry in the draw for who authors which slot. */
export const TicketEnvelope = record({
  attempt: u8, // which of its tries the validator used
  signature: fixedBytes(784), // a ring VRF proof: one of the validators made it, but which?
});
export type TicketEnvelope = Value<typeof TicketEnvelope>;

/** The tickets in a block. */
export const TicketsExtrinsic = seq(TicketEnvelope);

/** A preimage (GP §12): data that a service asked for by its hash, delivered. */
export const Preimage = record({
  requester: u32, // the service that asked
  blob: blob,
});
export type Preimage = Value<typeof Preimage>;

/** The preimages in a block. */
export const PreimagesExtrinsic = seq(Preimage);
```

Nothing new under the sun: records and sequences, the bricks from [Part 2](../02-codec/index.md). The only
surprise is how *big* a ticket is. Those 784 bytes are the price of anonymity.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ preimages_extrinsic (tiny) (1.8ms)
✔ preimages_extrinsic (full) (0.9ms)
...
ℹ tests 36
ℹ suites 0
ℹ pass 36
ℹ fail 0
...
reported 36 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791728268478
...
```

## Watch it

**Replace in** `bin/decode.ts`

```ts
import { PreimagesExtrinsic, TicketsExtrinsic } from "../src/block.ts";

/** The structures this program knows, by the test vectors' names for them. */
const CODECS: Record<string, Codec<unknown>> = {
  refine_context: RefineContext,
  work_item: WorkItem,
  work_package: WorkPackage,
  work_result: WorkDigest,
  work_report: WorkReport,
  tickets_extrinsic: TicketsExtrinsic,
  preimages_extrinsic: PreimagesExtrinsic,
};
```

What flows through this run — the file's bytes, the list they decode to, the trace printed:

::: code-group

```text [what goes in]
preimages_extrinsic.bin, 64 bytes; the first 32:
03 04 03 02 01 10 81 09 5e 61 22 e3 bc 9d 96 1e
00 01 4a 7f c8 33 05 03 02 01 10 d2 57 bc 7d 93 …
```

```ts [what it computes]
// PreimagesExtrinsic.decode(r): a sequence of three preimages
const computed = [ // 03 in front: the count
  { requester: 16909060, blob: "0x81095e61…" }, // 04 03 02 01, then 10 (16) and 16 bytes
  { requester: 16909061, blob: "0xd257bc7d…" }, // 05 03 02 01, then 10 and 16 bytes
  { requester: 16909062, blob: "0x38db056c…" }, // 06 03 02 01, then 10 and 16 bytes
];
```

```text [what comes out]
    0..1     length                         0x03
    1..5     0.requester                    0x04030201
```

:::

The first byte, `03`, is how many preimages follow. Each is four bytes of requester,
little end first, then its blob: a length, `10`, and that many bytes.

**Run**

```sh
npm pkg set scripts.decode-preimages="node bin/decode.ts preimages_extrinsic ../vectors/codec/tiny/preimages_extrinsic.bin"
npm run decode-preimages
```

```text
    0..1     length                         0x03
    1..5     0.requester                    0x04030201
...
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=decode-1791728269291
```

A list of three preimages: `length 0x03`, then each requester and its blob. The blob's
first byte, `0x10`, is its length: 16 bytes of data follow.

<details>
<summary>lasair: one octet, mind you</summary>

The ticket's `attempt` is one byte, ℰ₁. The official vectors once got that wrong
themselves: their `.bin` files used the compact form, which only differs for attempts of
128 or more. Their changelog for v0.8.0 records the fix:

```text
* `TicketAttempt` is encoded as one octet, as the GP and the schema say. The
  `.bin` files used the compact form, which differs for attempts of 128 or
  more.
```

Even the referee double-checks the rule book. lasair already wrote one octet, so the fix
changed nothing for it, and your `u8` is right from the start.

</details>

## Check your understanding

::: check
**§4 lists the parts tickets, disputes, preimages, assurances, guarantees. Appendix C lists tickets, preimages, guarantees, assurances, disputes. Which order do a block's bytes follow?**

- [ ] §4's, because §4 is where the extrinsic is defined
  > No: §4 says what's in an extrinsic, not how it's laid out in bytes. A decoder
  > that followed it would read the preimages' bytes as if they were disputes.
- [x] Appendix C's, because it's the encoding
  > Yes: the order of the bytes is the encoding's job, and the encoding's order wins,
  > just as it did in [Part 3](../03-work-and-reports/index.md).
- [ ] Either, since each part carries its own length
  > No: the bytes carry no names. A length says how many items, not which part they
  > belong to, so both sides must agree on one order.

**A ticket is one byte of `attempt` and 784 more. What are the 784?**

- [x] A ring VRF proof: some validator made this ticket, without saying which
  > Yes: that's the price of anonymity. The proof convinces everyone the entry is
  > genuine while keeping its owner secret.
- [ ] The validator's name and key, so everyone knows whose entry it is
  > No: it's the opposite. A ticket is anonymous; nothing in it says which validator
  > entered it.
- [ ] The `attempt` number, written large
  > No: `attempt` is ℰ₁, one byte, and it's the byte in front. The 784 bytes after it
  > are all proof.

**A service asks for some data by its hash, h. What is the preimage?**

- [ ] The hash h itself, which the block carries to the service
  > No: the service already knows h; that's how it asked. The block brings what it
  > doesn't have yet.
- [ ] The service's id, so the data reaches the right place
  > No: the id, `requester`, is one of a preimage's two fields. The preimage is the
  > other one.
- [x] The data d with H(d) = h: the bytes behind the hash
  > Yes: a preimage in a block is the requester's id (ℰ₄) and that data, as a blob.

**In the decoded preimages, the first blob starts with the byte `0x10`. What is it?**

- [x] The blob's length: 16 bytes of data follow
  > Yes: a blob can be any size, so its length goes in front, as a compact natural.
  > `0x10` is 16.
- [ ] The first byte of the data
  > No: like the payload in [lesson 2.6](../02-codec/06-the-first-test-vectors.md), a
  > blob's own bytes come after its length.
- [ ] The hash of the data, shortened
  > No: a hash is 32 bytes, and a preimage carries the data itself, not its hash.
:::

## What you have

Two of the five parts of a block's extrinsic. The next part's size depends on the network:
[lesson 4.2](./02-tiny-and-full.md) meets JAM's two configurations, tiny and full.

Next: [4.2 Tiny and full](./02-tiny-and-full.md)
