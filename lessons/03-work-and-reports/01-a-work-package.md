# A work-package

In [Part 2](../02-codec/index.md) you encoded a single work item. Nobody sends a work item on its own, though.
Items travel in a *work-package*: a parcel of up to sixteen jobs, for one of JAM's cores
(the package doesn't say which; its report will), with a permission slip stapled to the front.

Here is a real one, the tiny test vector's: the slip on the front, a postmark saying how
the chain looked when it was made, and two jobs inside. Tap any part to see what it's for,
its value and where its bytes are. The strip under the parcel is the same package as the
bytes hold it, and the order isn't the parcel's.

<WorkPackage />

## New words

- **Work-item and work-package.** A work-item is one job for one service: its input (the
  *payload*) and its gas limits. A work-package is up to 16 of them for one core, packed
  together with what's needed to let them in. *Example:* a package of one item, for
  service 42.
- **Authorizer.** A small program that decides whether a package may use a core at all.
  *Example:* a package names its authorizer by a service and a code hash.
- **Refinement context.** The chain as a package saw it when it was built: a recent block
  to anchor on, and anything that must be accumulated first. *Example:* [lesson 2.6](../02-codec/06-the-first-test-vectors.md)'s
  `refine_context` vector.
- **In-core and on-chain.** The two places JAM does its work. In-core work runs on one of
  the cores, by its guarantors, before any block: authorizing a package and refining its
  items. On-chain work is what every client does as it imports a block, yours included.
  *Example:* refining runs in-core; checking a report's signatures runs on-chain.

All four are in the [glossary](../glossary.md).

## What the Gray Paper says

§14 (*Packages and Items*) defines a work-package as six things:

- **items**: the work items, 1 to 16 of them (the Gray Paper calls the limit I = 16);
- **context**: the refinement context from [lesson 2.6](../02-codec/06-the-first-test-vectors.md), the chain as the package saw it;
- and the permission slip, in four parts. Each core only accepts packages that a small
  program called an *authorizer* approves. The package says where that program lives
  (`auth_code_host`, a service, and `auth_code_hash`, which code in it), hands it a token
  (`authorization`) and its settings (`authorizer_config`).

Running an authorizer is a guarantor's job. Guarantors are validators, two or three of them
on each core at a time, that take a package in, run its authorizer and its items, and sign
for the result ([Part 12](../12-guarantees/index.md) checks their signatures). All of that
happens *in-core*, on the network, before a package reaches any block. Your client's work is
*on-chain*: it imports blocks, and block import never runs an authorizer. Today the package
is a shape to encode, and almost every piece of it is already in your client.

Appendix C encodes it in this order: ℰ₄ of the code host, the code hash, the context,
then the token, the config and the items, each with its length in front.

## The test

**Add to** `test/work.test.ts`

```ts
import { WorkPackage } from "../src/work.ts";

for (const spec of ["tiny", "full"]) {
  test(`work_package (${spec})`, () => checkCodecVector(WorkPackage, `codec/${spec}/work_package`));
}
```

## The code

**Add to** `src/work.ts`

```ts
/**
 * A work-package (GP §14): up to 16 work items for one core, the context they were built
 * against, and what the authorizer needs to let them in.
 */
export const WorkPackage = record({
  auth_code_host: u32, // the service whose storage holds the authorizer's code
  auth_code_hash: hash, // which code: the authorizer
  context: RefineContext,
  authorization: blob, // the token the authorizer checks
  authorizer_config: blob, // the authorizer's settings
  items: seq(WorkItem),
});
export type WorkPackage = Value<typeof WorkPackage>;
```

Look at what *isn't* there: no new codec. `context` is the whole `RefineContext` record,
`items` is a `seq` of whole `WorkItem` records, and the codec machinery from [Part 2](../02-codec/index.md) just
nests them. Records inside records inside a list: it's bricks all the way down.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ work_package (tiny) (4.8ms)
✔ work_package (full) (2.2ms)
...
ℹ tests 25
ℹ suites 0
ℹ pass 25
ℹ fail 0
...
reported 25 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791727153621
...
```

## Watch it

Teach `bin/decode.ts` the new structure:

**Replace in** `bin/decode.ts`

```ts
import { WorkPackage } from "../src/work.ts";

/** The structures this program knows, by the test vectors' names for them. */
const CODECS: Record<string, Codec<unknown>> = {
  refine_context: RefineContext,
  work_item: WorkItem,
  work_package: WorkPackage,
};
```

What flows through this run — the file's bytes, the value they decode to, the trace printed:

::: code-group

```text [what goes in]
work_package.bin, 695 bytes; the first 24:
78 56 34 12 02 2e 5e 16 5c c8 bd 58 64 04 25 7f 5c d6 f5 a3 11 77 b5 c9 …
```

```ts [what it computes]
// WorkPackage.decode(r): the value it returns (trimmed), and the reader's trace of it
const computed = {
  auth_code_host: 305419896, // 78 56 34 12, little end first: 0x12345678
  auth_code_hash: "0x022e5e16…", // the next 32 bytes, as they are
  context: { anchor_slot: 11, lookup_anchor_slot: 33, prerequisites: [] }, // a record within
  authorization: "0x0102030405", // a blob: its length, 05, in front
  authorizer_config: "0x00010203040506070809", // a blob of 10: 0a in front
  items: [ // a sequence: its count, 02, in front
    { service: 16909060, refine_gas_limit: 42, export_count: 4 }, // 3 imports, 2 extrinsics
    { service: 84281096, refine_gas_limit: 77, export_count: 7 }, // 2 imports, 3 extrinsics
  ],
  traced: 695, // bytes the trace covers: every one, once
};
```

```text [what comes out]
    0..4     auth_code_host                 0x78563412
  205..211   authorization                  0x050102030405
  222..223   items.length                   0x02
```

:::

The first four bytes are the first field, little end first; each blob and sequence
carries its length in front, which is why `authorization` reads `05` then five bytes.
The value is `WorkPackage`'s; the printed lines are the trace the reader kept of it.

**Run**

```sh
npm pkg set scripts.decode-work-package="node bin/decode.ts work_package ../vectors/codec/tiny/work_package.bin"
npm run decode-work-package
```

```text
    0..4     auth_code_host                 0x78563412
    4..36    auth_code_hash                 0x022e5e165cc8bd586404257f5cd6f5a31177b5c951eb076c7c10174f90006eef
   36..68    context.anchor                 0xc0564c5e0de0942589df4343ad1956da66797240e2a2f2d6f8116b5047768986
   68..72    context.anchor_slot            0x0b000000
   72..104   context.state_root             0xf6967658df626fa39cbfb6014b50196d23bc2cfbfa71a7591ca7715472dd2b48
  104..136   context.beefy_root             0x9329de635d4bbb8c47cdccbbc1285e48bf9dbad365af44b205343e99dea298f3
  136..168   context.lookup_anchor          0x60751ab5b251361fbfd3ad5b0e84f051ccece6b00830aed31a5354e00b20b9ed
  168..172   context.lookup_anchor_slot     0x21000000
  172..204   context.lookup_anchor_state_root 0x8f665c40573f1288749767417430f62360e37865ef773c24186527aa24b5a493
  204..205   context.prerequisites.length   0x00
  205..211   authorization                  0x050102030405
  211..222   authorizer_config              0x0a00010203040506070809
  222..223   items.length                   0x02
...
  550..552   items.1.import_segments.0.index 0x0000
...
  587..619   items.1.extrinsic.0.hash       0x80b628780612e8928705018d1ced53b2f76607ad026a86e4f36c99ac0491f8eb
...
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=decode-1791727189774
```

The trace paths show the nesting: `context.anchor_slot`, `items.1.import_segments.0.index`.
And the very first field, `auth_code_host`, reads `0x78563412`: that's 305,419,896, better
known as `0x12345678`, written little end first. The vector's authors have a sense of
humour.

<details>
<summary>lasair: two orders for one package</summary>

lasair has *two* work-package types. The node's, in `lib/work_packages.ml`, lists the
parts in the Gray Paper's *definition* order, token first:

```ocaml
type work_package = {
  auth_token: bytes;              (** Authorization token blob *)
  auth_code_host: int;            (** Service hosting auth code *)
  auth_code_hash: hash;           (** Hash of authorization code *)
  auth_config: bytes;             (** Authorization configuration *)
  context: work_context;          (** Execution context *)
  work_items: work_item list;     (** 1 to C_max_package_items items *)
}
```

The other, in `conformance/codec_tests.ml`, uses the vectors' names in Appendix C's
order (`auth_code_host`, `auth_code_hash`, `context`, `authorization`, ...), and its
encoder writes them that way, code host first, the trap from [lesson 2.6](../02-codec/06-the-first-test-vectors.md) avoided by hand:

```ocaml
let encode_work_package (wp : work_package) : bytes =
  let enc = Serialization.create_encoder () in
  (* auth_code_host: u32 *)
  Serialization.write_bytes enc (Serialization.encode_u32 wp.auth_code_host);
  (* auth_code_hash: 32 bytes *)
  Serialization.write_bytes enc wp.auth_code_hash;
  (* context *)
  Serialization.write_bytes enc (encode_refine_context wp.context);
```

Your client needs only one: a `record` is the type, the encoder, the decoder and the JSON
reader at once, in the encoding's order.

</details>

## Check your understanding

::: check
**In the package's bytes, `auth_code_hash` is 4 to 36 and `context.anchor` is 36 to 68. What's between them?**

- [ ] A length, saying how many bytes the context takes
  > No: a record never gets a length in front. Its fields are always the same, so the
  > decoder knows what comes.
- [ ] A marker byte saying "a context starts here"
  > No: nothing in the bytes says what they are. The decoder knows a context comes third
  > because the field list says so.
- [x] Nothing: the context's own bytes start right where the hash stops
  > Yes: a record inside a record is just its fields' bytes, in place. 36 is both where
  > `auth_code_hash` stops and where `context.anchor` starts.

**Who runs a package's authorizer?**

- [x] A guarantor, before the package reaches any block
  > Yes: and block import never runs one. To your client, a package is a shape to
  > encode.
- [ ] Every validator, when it imports the block holding the package
  > No: block import never runs an authorizer. That's why the client you build here never
  > will either.
- [ ] Your client, as the first step of reading a package
  > No: decoding a package only reads its fields. The authorizer's code isn't even in the
  > package, only its hash, `auth_code_hash`.

**§14 defines the package with the token first. The bytes start `78 56 34 12`. Which order do the bytes follow?**

- [ ] The definition's: the token first
  > No: then the bytes would start with the token's length. `78 56 34 12` is a u32,
  > 305,419,896, the code host.
- [x] Appendix C's: `auth_code_host` first, the token fourth
  > Yes: the encoding has its own order, and the record follows it. The token,
  > `authorization`, comes after the code host, the code hash and the context.
- [ ] Either: a decoder accepts both orders
  > No: nothing in the bytes says which field is which, so there is only one order that
  > works, Appendix C's. [Lesson 2.6](../02-codec/06-the-first-test-vectors.md)'s
  > moved field showed what the wrong one does.

**A package carries 1 to 16 items. How does the decoder know how many this one has?**

- [ ] It reads items until the bytes run out
  > No: it never has to guess where the list ends. The count is written down.
- [x] `items` has its length in front: `02`, two items
  > Yes: `items` is a `seq`, so the count comes first, at byte 222. Then two whole
  > work items follow.
- [ ] Every package has 16 slots, and the empty ones are zeros
  > No: 16 is only the most a package may carry. A package writes the items it has, no
  > more.
:::

## What you have

The parcel that carries work into JAM, encoded byte for byte. A core turns each of its
items into a result, and [lesson 3.2](./02-work-digests.md) encodes what comes back.

Next: [3.2 Work digests](./02-work-digests.md)
