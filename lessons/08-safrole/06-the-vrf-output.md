# The VRF output

Since [lesson 8.1](./01-stirring-the-entropy.md), your client has trusted the test vectors for one value: Y(H_V), the
randomness a block's author stirs into η₀. The vectors handed it over as `input.entropy`,
because computing it seemed to need Bandersnatch, a whole elliptic curve. Good news: it
doesn't. A VRF signature carries its output in its first 32 bytes, as a point on the curve,
and the output is just a hash of that point. By the end of this lesson your client reads
the VRF output of any real block, works out a ticket's id, and gets η′ right on 198 real
blocks, with no help from the vectors.

## New words

- **Output point.** The first 32 bytes of a Bandersnatch VRF signature: a point on the
  curve that only the signer's secret key could have made for that input. *Example:* the
  first 32 bytes of a header's 96-byte `entropy_source`.
- **SHA-512.** A hash function, like Blake2b, with a 64-byte result. *Example:* the VRF
  output is the first 32 of those bytes.
- **Ticket id.** A ticket's score in the lottery: the VRF output of its ring proof. Lower
  is better. *Example:* `0x00e51b1c…` beats `0x20164381…`.

All three are in the [glossary](../glossary.md).

## What the Gray Paper says

Appendix G defines 𝒴(s) = output(s)₍..32₎: the first 32 bytes of a VRF signature's
output. What "output" is, the Gray Paper leaves to the Bandersnatch VRF specification it
cites, which the VRF library ark-vrf implements as the suite `Bandersnatch_SHA-512_ELL2`.
There, the output is a hash of the output point, as RFC 9381, the standard for VRFs, says:

1. **Take the output point**: the signature's first 32 bytes, as they are.
2. **Hash** the suite's name, then the byte 3, then the point, then the byte 0, with
   SHA-512. The 3 and the 0 are the RFC's way of saying "this hash is a VRF output", so it
   can't be mistaken for any other hash of the same bytes.
3. **Keep the first 32 bytes**: that's 𝒴.

The three steps on five real blocks:

<VrfOutput />

Two places use it. A header's entropy source gives η′₀ = H(η₀ ⌢ 𝒴(H_V)) ([lesson 8.1](./01-stirring-the-entropy.md)).
And a ticket's id is 𝒴 of its 784-byte ring proof (§6), which also starts with its output
point.

> [!NOTE]
> **The simple road.** Reading the output is not checking the signature. Anyone can write
> 32 bytes into a header; only the right key makes a signature that *checks*, and checking
> needs the curve's arithmetic, which [lesson 8.9](./09-seals.md) brings. Until then your client takes
> each block's word for its own randomness, which is fine for the official traces (every
> block in them is honest) and not for a block from a stranger.

## The tests

**New file** `test/bandersnatch.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { vrfOutput } from "../src/bandersnatch.ts";
import { fromHex, toHex } from "../src/bytes.ts";
import { nextEntropy } from "../src/safrole.ts";
import { readEntropy, readTime } from "../src/state.ts";
import { Block } from "../src/block.ts";
import type { Header } from "../src/block.ts";
import { TINY } from "../src/config.ts";
import { epochOf } from "../src/epoch.ts";
import { traceState, vectorFiles, vectorJson } from "./vectors.ts";
import type { Bytes } from "../src/bytes.ts";

/** A safrole vector's tickets, and the ids in its lottery after the block. */
type TicketsVector = {
  input: { extrinsic: { attempt: number; signature: string }[] };
  post_state: { gamma_a: { id: string }[] };
  output: { err?: string };
};

test("a ticket's id is its proof's VRF output", () => {
  let checked = 0;
  for (const size of ["tiny", "full"]) {
    for (const name of vectorFiles(`stf/safrole/${size}`)) {
      const vector = vectorJson(name) as TicketsVector;
      if (vector.output.err) continue; // a refused block keeps none of its tickets
      const ids = new Set(vector.post_state.gamma_a.map((t) => t.id));
      for (const ticket of vector.input.extrinsic) {
        const id: string = toHex(vrfOutput(fromHex(ticket.signature)));
        assert.ok(ids.has(id), `${name}: ${id}`);
        checked++;
      }
    }
  }
  assert.equal(checked, 34); // every ticket of every accepted block, tiny and full
});

test("η′ of 198 real blocks: η₀ stirred with each header's VRF output, at last", () => {
  for (const family of ["fallback", "safrole"]) {
    for (let n = 1; n < 100; n++) {
      const { entries, block } = traceState(family, n);
      const header: Header = Block(TINY).fromJson(block).header;
      const newEpoch: boolean = epochOf(TINY, header.slot) > epochOf(TINY, readTime(entries));
      const output: Bytes = vrfOutput(header.entropy_source);
      const eta: string[] = nextEntropy(readEntropy(entries), output, newEpoch).map(toHex);
      const after: string[] = readEntropy(traceState(family, n + 1).entries).map(toHex);
      assert.deepEqual(eta, after, `${family} block ${n}`);
    }
  }
});
```

The first test checks every ticket in the safrole vectors' accepted blocks: its id,
worked out from its proof, must be in the lottery afterwards. The second is [lesson
7.1](../07-time-and-shuffling/01-epochs.md)'s trace test, finished: 7.1 left η′₀ out, since it needed a VRF output. Now
nothing is left out.

A stub first, so the red is about the rule:

**New file** `src/bandersnatch.ts`

```ts
// Bandersnatch (GP App. G): the elliptic curve JAM's VRF signatures are made on. A VRF
// signature starts with its output point, and hashing that point gives the output, 𝒴.

import type { Bytes } from "./bytes.ts";

/** 𝒴, for now: no output at all, just 32 zeros. */
export function vrfOutput(signature: Bytes): Bytes {
  return new Uint8Array(32);
}
```

**Run, expect it to fail**

```sh
npm test
```

```text
...
✖ a ticket's id is its proof's VRF output (3.740959ms)
✖ η′ of 198 real blocks: η₀ stirred with each header's VRF output, at last (3.6605ms)
...
ℹ tests 81
ℹ suites 0
ℹ pass 79
ℹ fail 2
...
✖ η′ of 198 real blocks: η₀ stirred with each header's VRF output, at last (3.6605ms)
  AssertionError [ERR_ASSERTION]: fallback block 1
  + actual - expected
...
  +   '0xa42908a427750e4676c3b3210ace2f3a15a291b3d9065dfeab19ad46434fb411',
  -   '0x5b8e9d7c5c737a1d41f8dc4ad0cd7962e4718ee3761146c2ba992f6fbdf172ce',
...
```

Red twice. No ticket's id is 32 zeros, and neither is any block's randomness.

## The code

**Rewrite** `src/bandersnatch.ts`

```ts
// Bandersnatch (GP App. G): the elliptic curve JAM's VRF signatures are made on. A VRF
// signature starts with its output point, and hashing that point gives the output, 𝒴.

import type { Bytes } from "./bytes.ts";
import { concatBytes } from "./bytes.ts";
import { sha512 } from "@noble/hashes/sha2.js";

/** The VRF suite's name, which the VRF library JAM uses (ark-vrf) hashes in everywhere. */
const SUITE = new TextEncoder().encode("Bandersnatch_SHA-512_ELL2");

/**
 * 𝒴 (GP App. G): a VRF signature's output, 32 bytes its signer couldn't choose. The first
 * 32 bytes of the signature are a point on the curve; the output is SHA-512 of the suite's
 * name, a 3, that point and a 0, cut to 32 bytes. Reading it doesn't check the signature.
 */
export function vrfOutput(signature: Bytes): Bytes {
  const point = signature.subarray(0, 32);
  return sha512(concatBytes(SUITE, Uint8Array.of(3), point, Uint8Array.of(0))).subarray(0, 32);
}
```

`concatBytes` lines the four pieces up, and `sha512` comes from the hashing library you
already have, `@noble/hashes`. `.subarray(0, 32)` keeps the first half.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ a ticket's id is its proof's VRF output (335.31625ms)
✔ η′ of 198 real blocks: η₀ stirred with each header's VRF output, at last (237.368792ms)
...
ℹ tests 81
ℹ suites 0
ℹ pass 81
ℹ fail 0
...
reported 81 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791771392845
...
```

## Watch it

**New file** `bin/vrf.ts`

```ts
// Reads the VRF output of real blocks' entropy sources, and stirs it into η₀: the first
// blocks of a block-import trace, each next to the η₀ the trace's next state holds.
// Usage: npm run vrf [family] [blocks], the first 5 blocks of "safrole" if not given

import { vrfOutput } from "../src/bandersnatch.ts";
import { Block } from "../src/block.ts";
import { toHex } from "../src/bytes.ts";
import { TINY } from "../src/config.ts";
import { epochOf } from "../src/epoch.ts";
import { Run } from "../src/obs.ts";
import { nextEntropy } from "../src/safrole.ts";
import { readEntropy, readTime } from "../src/state.ts";
import { traceState } from "../test/vectors.ts";

const family = process.argv[2] ?? "safrole";
const count = Number(process.argv[3] ?? 5);
const short = (bytes: Uint8Array) => `${toHex(bytes).slice(0, 10)}…`;
const run = new Run("vrf");
for (let n = 1; n <= count; n++) {
  const { entries, block } = traceState(family, n);
  const header = Block(TINY).fromJson(block).header;
  const output = vrfOutput(header.entropy_source);
  const newEpoch = epochOf(TINY, header.slot) > epochOf(TINY, readTime(entries));
  const eta0 = nextEntropy(readEntropy(entries), output, newEpoch)[0];
  const theirs = readEntropy(traceState(family, n + 1).entries)[0]; // the state after block n
  console.log(`block ${n}, slot ${header.slot}: entropy source ${short(header.entropy_source)}`);
  console.log(`  VRF output ${short(output)}, η′₀ ${short(eta0)} (the trace: ${short(theirs)})`);
  const source = short(header.entropy_source);
  run.event("block", { n, slot: header.slot, source, output: short(output), eta0: short(eta0) });
}
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

**What flows through it.** This program reads real blocks, not a state-transition vector: each trace
file holds a block and the state before it. What block 1 gives, what the program makes
of it, and what it prints:

::: code-group

```json [what goes in]
{
  "block": {
    "header": { "slot": 1, "entropy_source": "0x62bc9d2311da…" }
  },
  "pre_state": {
    "keyvals": ["…", "the state's entries: η and τ read from their components"]
  }
}
```

```ts [what it computes]
// bin/vrf.ts's values for block 1
const computed = {
  output: "0x83199eec…", // 𝒴(entropy_source): the 32-byte output point, hashed
  newEpoch: false, // slot 0 → 1 stays in epoch 0: no staircase
  eta0: "0x5b8e9d7c…", // H(the old η₀ ⌢ output)
  theirs: "0x5b8e9d7c…", // η₀ in the next trace file's state: the same bytes
};
```

```text [what comes out]
block 1, slot 1: entropy source 0x62bc9d23…
  VRF output 0x83199eec…, η′₀ 0x5b8e9d7c… (the trace: 0x5b8e9d7c…)
```

:::

Read the input into the output: the 96-byte `entropy_source` is the header's VRF
signature, and 𝒴 of it — first 32 bytes through SHA-512, as this lesson built — is the
output the program stirs into the η₀ it read from `pre_state.keyvals`
(`../vectors/traces/safrole/00000001.json` is the file). The parenthesis is the check:
the next file's state holds the η₀ the real chain got, and yours must be byte-identical.

**Run**

```sh
npm pkg set scripts.vrf="node bin/vrf.ts"
npm run vrf
```

```text
block 1, slot 1: entropy source 0x62bc9d23…
  VRF output 0x83199eec…, η′₀ 0x5b8e9d7c… (the trace: 0x5b8e9d7c…)
block 2, slot 2: entropy source 0x635d6b1c…
  VRF output 0xd603a5c7…, η′₀ 0x8087a00e… (the trace: 0x8087a00e…)
block 3, slot 3: entropy source 0x635d6b1c…
  VRF output 0xd603a5c7…, η′₀ 0x6599553b… (the trace: 0x6599553b…)
block 4, slot 4: entropy source 0xc50ffdad…
  VRF output 0xd34b355c…, η′₀ 0x7973268a… (the trace: 0x7973268a…)
block 5, slot 5: entropy source 0x450dad32…
  VRF output 0x8c273b7e…, η′₀ 0xe63da799… (the trace: 0xe63da799…)
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=vrf-1791771397022
```

Each block's η′₀ matches the trace's. And look at blocks 2 and 3: the same entropy source,
byte for byte. Both were made by validator 3, and a VRF's output depends only on the key
and the input, never on what else the block says. In a fallback epoch the input is the
same for every block a validator seals, so validator 3's randomness is the same twice. η₀
still moves on, because each block hashes the new output in with the η₀ before it. The
*VRF output* panel, on **3 · Consensus**, lists the blocks.

![VRF output panel](./images/06-vrf-output.png)

<details>
<summary>ark-vrf: the output hash, in <code>src/utils/common.rs</code></summary>

The library the Gray Paper names, version 0.1.1 (the one the test vectors pin), comments
trimmed:

```rust
pub fn point_to_hash_rfc_9381<S: Suite>(
    pt: &AffinePoint<S>,
    mul_by_cofactor: bool,
) -> HashOutput<S> {
    use ark_std::borrow::Cow::*;
    const DOM_SEP_START: u8 = 0x03;
    const DOM_SEP_END: u8 = 0x00;
    let mut buf = [S::SUITE_ID, &[DOM_SEP_START]].concat();
    let pt = match mul_by_cofactor {
        false => Borrowed(pt),
        true => Owned(pt.mul_by_cofactor()),
    };
    S::Codec::point_encode_into(&pt, &mut buf);
    buf.push(DOM_SEP_END);
    hash::<S::Hasher>(&buf)
}
```

The suite's name, the 3, the point, the 0: your four pieces, in the same order. ark-vrf's
default, which its Bandersnatch suite keeps, passes `false` for `mul_by_cofactor`, so the
point goes in as the signature wrote it. One difference: ark-vrf first reads the 32 bytes *as a point*, and
refuses bytes that aren't one. Your `vrfOutput` hashes them as they come, the simple road
named above. lasair asks its Rust library for the same hash
(`bandersnatch_output_hash`, in `rust/bandersnatch-ffi`).

</details>

## Check your understanding

::: check
**How does your client get 𝒴(H_V) from the 96-byte entropy source?**

- [ ] It takes the first 32 bytes, as they are
  > No: those 32 bytes are the output point. 𝒴 is a hash of it.
- [x] SHA-512 of the suite's name, a 3, the first 32 bytes and a 0, cut to 32 bytes
  > Yes: RFC 9381's output hash. The 3 and the 0 make sure it can't be mistaken for any
  > other hash of the same bytes.
- [ ] Blake2b of all 96 bytes
  > No: Blake2b is JAM's usual hash, but a VRF's output follows its own suite: SHA-512, of
  > the output point only.

**Your client now reads every block's VRF output. Does that mean it checks the signatures?**

- [ ] Yes: a forged signature would give the wrong output
  > No: anyone can write any 32 bytes into a header, and your client hashes them without
  > question. Checking needs the curve's arithmetic.
- [x] No: reading the output takes the block's word; checking waits for [lesson 8.9](./09-seals.md)
  > Yes: that's fine for the official traces, where every block is honest, and not for a
  > stranger's block.

**Blocks 2 and 3 of the `safrole` trace have the same entropy source, byte for byte. Why?**

- [ ] One block was replayed, and the chain should have refused it
  > No: they're two different blocks, at slots 2 and 3, and both are accepted.
- [x] The same validator made both for the same input, and a VRF's output depends only on the key and the input
  > Yes: in a fallback epoch the input is the same for every block a validator seals, so
  > validator 3's randomness is the same twice.
- [ ] η₀ didn't change between the two blocks
  > No: it did, `0x8087a00e…` to `0x6599553b…`, because each block hashes the output in
  > with the η₀ before it. η₀ isn't part of the VRF's input.

**What is a ticket's id, and why can't a validator just give itself a low one?**

- [ ] A number the validator draws at random, which it reports honestly
  > No: honesty can't be checked. If validators chose their own ids, a cheat would always
  > pick a low one.
- [ ] The hash of the validator's key and the attempt
  > No: then anyone could work out every validator's ids, and see who holds each winning
  > ticket. The lottery would have no secrets.
- [x] 𝒴 of its ring proof: a VRF output, which no validator can choose
  > Yes: the same 𝒴 as the entropy source's. Lower is better, but nobody can aim low.
:::

## What you have

The VRF output of any signature, with nothing but SHA-512: ticket ids, and η′ for every
real block, no longer handed over by the vectors. With ticket ids in hand, a block's
tickets can finally enter the lottery: [lesson 8.7](./07-entering-tickets.md).

Next: [8.7 Entering tickets](./07-entering-tickets.md)
