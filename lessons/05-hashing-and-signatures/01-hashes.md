# Hashes

**In one sentence:** a hash is a 32-byte fingerprint of some bytes, and every block carries
the fingerprint of the block before it, which is what makes the blocks a chain.

Flip one bit of the input below. Then count how much of its fingerprint changed.

<a id="try-it"></a>

<HashAvalanche />

## The idea

How do you know nobody rewrote an old block? You could keep every block and compare them
byte by byte. A [*hash*](../glossary.md#hash) does it with 32 bytes.

A hash is a fingerprint of some data. The same bytes always give the same fingerprint.
Change one bit of the data and the fingerprint changes completely.

So each block's header holds the hash of the header before it, its
[*parent*](../glossary.md#parent). Block 2 holds on to block 1, block 3 to block 2, and so
on up. Change one bit of an old block and its fingerprint changes. That breaks the next
block's grip, and the next, all the way up. Nothing old can change quietly.

JAM's hash function is [*Blake2b*](../glossary.md#blake2b). Your client takes it from a
[*library*](../glossary.md#library), the first code in it you didn't write. A
[*known-answer test*](../glossary.md#known-answer-test) checks you asked the library for
the right thing.

This lesson gives your client the hash, then walks a
[*trace*](../glossary.md#trace), a recorded run of a hundred real blocks, and checks every
link.

## What the Gray Paper says

§3.8 (*Cryptography*) names the hash:

::: gray-paper 3.8.1

#### §3.8.1 Hashing {#gp-3-8-1}

<a id="gp-3-8-1-p1"></a>$\mathbb{H}_{}$ denotes the set of 256-bit values equivalent to $\mathbb{B}_{32}$. All hash functions in the present work output to this type and $\mathbb{H}_{0}$ is the value equal to $\left[0\right]_{32}$. We assume a function $\mathcal{H}\left(m \in \mathbb{B}_{}\right) \in \mathbb{H}_{}$ denoting the Blake2b 256-bit hash introduced by [Saarinen and Aumasson 2015](https://www.rfc-editor.org/info/rfc7693) and a function $\mathcal{H}_K\left(m \in \mathbb{B}_{}\right) \in \mathbb{H}_{}$ denoting the Keccak 256-bit hash as proposed by Bertoni et al. 2013 and utilized by Wood 2014.

<a id="gp-3-8-1-p2"></a>The inputs of a hash function should be expected to be passed through our <abbr class="gp-term" title="turning a value into bytes, so it can be hashed, signed or sent">serialization</abbr> codec $\mathcal{E}$ to yield an <abbr class="gp-term" title="a byte: 8 bits">octet</abbr> sequence to which the cryptography may be applied. (Note that an octet sequence conveniently yields an identity transform.) We may wish to interpret a sequence of <abbr class="gp-term" title="bytes: 8 bits each">octets</abbr> as some other kind of value with the assumed decoder function $\mathcal{E}^{-1}_{}\left(x \in \mathbb{B}_{}\right)$. In both cases, we may subscript the transformation function with the number of octets we expect the octet sequence term to have. Thus, $r = \mathcal{E}_4(x \in \mathbb{N})$ would assert $x \in \mathbb{N}_{2^{32}}$ and $r \in \mathbb{B}_{4}$, whereas $s = \mathcal{E}^{-1}_{8}\left(y \in \mathbb{B}_{}\right)$ would assert $y \in \mathbb{B}_{8}$ and $s \in \mathbb{N}_{2^{64}}$.

:::

H(m) is Blake2b with a 256-bit (32-byte) output, as RFC 7693 defines it. JAM hashes
*encodings*: to hash a value, encode it ([Part 2](../02-codec/index.md)), then hash the
bytes. Bytes encode as themselves, so a blob is hashed as it is. ℍ₀, the zero hash, is 32
zero bytes, used where there is nothing to point at. Keccak, the other hash, waits for
[Part 9](../09-recent-history/index.md).

§5 (*The Header*) puts the hash to work as the chain's link:

::: gray-paper 5 3-8

#### §5 The Header, continued

<a id="gp-5-p3"></a>The blockchain is a sequence of blocks, each cryptographically referencing some prior block by including a hash derived from the parent's header, all the way back to some first block which references the <abbr class="gp-term" title="the chain's first block and state">genesis</abbr> header. We already presume consensus over this genesis header $\mathbf{H}^0$ and the state it represents defined as $\sigma^0$.

<a id="gp-5-p4"></a>Excepting the Genesis header, all block headers $\mathbf{H}$ have an associated parent header, whose hash is $\mathbf{H}_{P}$. We denote the parent header ${\mathbf{H}}^- = P\left(\mathbf{H}\right)$:

<a id="gp-5-p5"></a><a id="eq-5-2"></a>

$$
\begin{equation}
\mathbf{H}_{P} \in \mathbb{H}_{} \,,\quad \mathbf{H}_{P} \equiv \mathcal{H}\left(\mathcal{E}_{}\left(P\left(\mathbf{H}\right)\right)\right) \tag{5.2}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-header" class="gk-wrap">$\mathbf{H}$</span> | H | a block header: the parent's hash, the slot, the seals and markers |
| <span id="gk--parent">$P$</span> | P | a header's parent hash: 𝐇_P is the hash of the header before it, 32 bytes |
| <span id="gk-in">[$\in$](../symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-hash">$\mathbb{H}$</span> | H | a 32-byte value, usually a hash |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-blake">$\mathcal{H}\left(x\right)$</span> | H of | the Blake2b hash of what's in the brackets: 32 bytes |
| <span id="gk-encode">[$\mathcal{E}\left(x\right)$](../symbols.md#encode)</span> | E of | the encoding of what's in the brackets: its bytes, by Appendix C's rules |
| <span id="gk-getparent">$P\left(x\right)$</span> | P of | the parent of a header: P(𝐇) is the header of the block before |

</details>

→ [(5.2) in plain words](./gray-paper.md#ex-5-2)

<a id="gp-5-p6"></a>$P$ is thus defined as being the mapping from one block header to its parent block header. With $P$, we are able to define the set of ancestor headers $\mathbf{A}$:

<a id="gp-5-p7"></a><a id="eq-5-3"></a>

$$
\begin{align}
h \in \mathbf{A} \Leftrightarrow h = \mathbf{H} \vee (\exists i \in \mathbf{A} : h = P\left(i\right)) \tag{5.3}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-ancestors" class="gk-wrap">$\mathbf{A}$</span> | A | the ancestors: this header, its parent, its parent's parent, and so on back to genesis |
| <span id="gk-Leftrightarrow">$\Leftrightarrow$</span> | exactly when | if and only if: both sides are true together, or false together |
| <span id="gk-vee">$\vee$</span> | or | at least one side is true |
| <span id="gk-exists">[$\exists$](../symbols.md#exists)</span> | there exists | there is at least one value such that what follows holds |

</details>

→ [(5.3) in plain words](./gray-paper.md#ex-5-3)

<a id="gp-5-p8"></a>We only require implementations to store headers of ancestors which were authored in the previous $\mathsf{L} = 24$ hours of any block $\mathbf{B}$ they wish to validate.

:::

A header's `parent` is the hash of its parent block's header, H(ℰ(parent header)) (5.2).
Follow `parent` back, one header at a time, and you visit every ancestor, all the way to
genesis (5.3). A node keeps only the last 24 hours of them, L = 14,400 slots. The test
vectors' traces are chains of real blocks, so the link is something you can check.

Try each rule on [the hash at the top](#try-it). Its input starts as `c7 12`: 4,807
written as ℰ₂, from [lesson 2.1](../02-codec/01-fixed-width-integers.md).

- **Flip any one bit.** About half of the hash's 256 bits flip with it, scattered, with
  no pattern to follow.
- **Empty the input.** The hash of no bytes at all starts `0x0e5751c0`.
- **Write 42 as ℰ₄ and as ℰ₈.** One number, two encodings, two hashes with nothing in
  common.

## A library, for once

So far you've written everything yourself. A hash function is the exception: a tiny
mistake in one would make every result wrong in ways no test of yours would catch. So the
client takes its first dependency: `@noble/hashes`, a small, audited library with no
dependencies of its own.

**Rewrite** `package.json`

```json
{
  "name": "jam-client",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test --test-reporter=spec --test-reporter-destination=stdout --test-reporter=./test/grafana.ts --test-reporter-destination=stdout \"test/**/*.test.ts\"",
    "typecheck": "tsc -p .",
    "hello": "node bin/hello.ts",
    "now": "node bin/now.ts",
    "hexdump": "node bin/hexdump.ts",
    "hexdump-work-item": "node bin/hexdump.ts ../vectors/codec/tiny/work_item.bin 52",
    "scoreboard": "node bin/scoreboard.ts",
    "decode": "node bin/decode.ts",
    "decode-work-item": "node bin/decode.ts work_item ../vectors/codec/tiny/work_item.bin",
    "decode-work-package": "node bin/decode.ts work_package ../vectors/codec/tiny/work_package.bin",
    "decode-work-result": "node bin/decode.ts work_result ../vectors/codec/tiny/work_result_1.bin",
    "decode-work-report": "node bin/decode.ts work_report ../vectors/codec/full/work_report.bin",
    "decode-preimages": "node bin/decode.ts preimages_extrinsic ../vectors/codec/tiny/preimages_extrinsic.bin",
    "decode-assurances": "node bin/decode.ts assurances_extrinsic ../vectors/codec/tiny/assurances_extrinsic.bin",
    "decode-assurances-full": "node bin/decode.ts assurances_extrinsic ../vectors/codec/full/assurances_extrinsic.bin",
    "decode-guarantees": "node bin/decode.ts guarantees_extrinsic ../vectors/codec/tiny/guarantees_extrinsic.bin",
    "decode-disputes": "node bin/decode.ts disputes_extrinsic ../vectors/codec/full/disputes_extrinsic.bin",
    "decode-header": "node bin/decode.ts header ../vectors/codec/tiny/header_1.bin",
    "decode-block": "node bin/decode.ts block ../vectors/codec/tiny/block.bin"
  },
  "dependencies": {
    "@noble/hashes": "2.4.0"
  },
  "devDependencies": {
    "@types/node": "26.6.4",
    "typescript": "7.0.2"
  }
}
```

**Run**

```sh
npm install
```

## The tests

Two tests. The first pins the hash of *no bytes at all*, a known answer. The second walks
the tiny `fallback` trace, blocks 1 to 100, and checks every link.

The official vectors hold eight traces, each a short tiny chain built to try one thing, in
its own folder of `vectors/traces/`. `fallback` is the simplest. No service sends any
work, so its blocks carry nothing but their headers. Safrole's fallback rule
([lesson 8.3](../08-safrole/03-the-fallback-sealers.md)) picks who makes each block, hence
the name.

**New file** `test/hash.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { Block, headerHash } from "../src/block.ts";
import { toHex } from "../src/bytes.ts";
import { TINY } from "../src/config.ts";
import { blake2b256 } from "../src/hash.ts";
import { vectorJson } from "./vectors.ts";
import type { Bytes } from "../src/bytes.ts";

test("Blake2b-256 of nothing at all", () => {
  const empty: string = "0x0e5751c026e543b2e8ab2eb06099daa1d1e5df47778f7787faab45cdf12fe3a8";
  const hashed: string = toHex(blake2b256(new Uint8Array(0)));
  assert.equal(hashed, empty);
});

/** Block n of the tiny "fallback" trace: a chain of 100 real blocks. */
function traceBlock(n: number): Block {
  const name = `traces/fallback/${String(n).padStart(8, "0")}.json`;
  const trace = vectorJson(name) as { block: unknown };
  return Block(TINY).fromJson(trace.block);
}

test("each block names its parent by the hash of the header before it", () => {
  for (let n = 2; n <= 100; n++) {
    const parent: Bytes = traceBlock(n).header.parent;
    const previousHeaderHash: Bytes = headerHash(TINY, traceBlock(n - 1).header);
    assert.deepEqual(parent, previousHeaderHash);
  }
});
```

`Block` is both a codec and a type (lessons [2.5](../02-codec/05-sequences-and-records.md) and [4.7](../04-blocks/07-the-block.md)): `traceBlock(n): Block` uses
the type, `Block(TINY)` the codec. TypeScript tells them apart by where they appear.

The tests import two names that don't exist yet. First a stub for the hash, the right
size and all zeros:

**New file** `src/hash.ts`

```ts
// Hashing (GP §3): Blake2b-256, the hash JAM uses almost everywhere.

import type { Bytes } from "./bytes.ts";

/** H(x): Blake2b with a 32-byte output. */
export function blake2b256(data: Bytes): Bytes {
  return new Uint8Array(32);
}
```

And the real header hash, which only encodes and hashes:

**Add to** `src/block.ts`

```ts
import type { Bytes } from "./bytes.ts";
import { encode } from "./codec/codec.ts";
import { blake2b256 } from "./hash.ts";

/** A header's hash (GP §5): what the next block names as its parent. */
export function headerHash(config: Config, header: Header): Bytes {
  return blake2b256(encode(Header(config), header));
}
```

Encode, then hash. Every hash in JAM works this way, which is why [Part 2](../02-codec/index.md) had to be byte
perfect: one wrong byte in the encoding, and the hash is a stranger.

**Run, expect it to fail**

```sh
npm test
```

```text
...
✖ Blake2b-256 of nothing at all (0.9ms)
✖ each block names its parent by the hash of the header before it (7.6ms)
...
ℹ tests 54
ℹ suites 0
ℹ pass 52
ℹ fail 2
...
test at test/hash.test.ts:10:1
✖ Blake2b-256 of nothing at all (0.9ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected

  + '0x0000000000000000000000000000000000000000000000000000000000000000'
  - '0x0e5751c026e543b2e8ab2eb06099daa1d1e5df47778f7787faab45cdf12fe3a8'

      at TestContext.<anonymous> (…/client/test/hash.test.ts:13:10)
...
```

Both tests caught the stub. The hash of nothing isn't 32 zero bytes, and a chain of zero
hashes links nothing.

## The code

Now the real hash, from the library installed above:

**Replace in** `src/hash.ts`

```ts
import { blake2b } from "@noble/hashes/blake2.js";

/** H(x): Blake2b with a 32-byte output. */
export function blake2b256(data: Bytes): Bytes {
  return blake2b(data);
}
```

**Run, expect it to fail**

```sh
npm test
```

```text
...
✖ Blake2b-256 of nothing at all (2.8ms)
✖ each block names its parent by the hash of the header before it (60.3ms)
...
ℹ tests 54
ℹ suites 0
ℹ pass 52
ℹ fail 2
...
test at test/hash.test.ts:10:1
✖ Blake2b-256 of nothing at all (2.8ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected

  + '0x786a02f742015903c6c6fd852552d272912f4740e15847618a86e217f71f5419d25e1031afee585313896444934eb04b903a685b1448b755d56f701afe9be2ce'
  - '0x0e5751c026e543b2e8ab2eb06099daa1d1e5df47778f7787faab45cdf12fe3a8'

      at TestContext.<anonymous> (…/client/test/hash.test.ts:13:10)
...
```

## Bug hunt

Red, and both new tests with it. (Your fifth planted bug.) The trail:

1. **The test output.** *Blake2b-256 of nothing at all* failed with two hashes side by
   side, yours first. Don't read them, *measure* them: the expected one is 64 hex digits
   after the `0x`, yours is 128. Your hash is twice too long. The chain test failed too,
   on the very first link.
2. **The dashboard.** *Tests failed* says 2, and *Failed tests* has both `FAIL` lines. One
   cause, two symptoms: every hash is wrong, so every link is.

   ![Failed tests panel](./images/01-failed-tests.png)
3. **The reasoning.** 128 hex digits is 64 bytes. Your code calls `blake2b(data)`, and
   Blake2b can make fingerprints of any size up to 64 bytes. Ask for nothing, and the
   library picks its own default: the biggest. JAM's H is Blake2b with a *32-byte* output,
   and a library can't know that. You have to say so.

This is what a known-answer test is for. Anyone can check the value it pins:
`python3 -c "import hashlib; print(hashlib.blake2b(b'', digest_size=32).hexdigest())"`
prints it. Without it, the chain test alone would only say "every link is broken", and
the hunt would start in the encoding. The fix is one argument:

**Replace in** `src/hash.ts`

```ts
/** H(x): Blake2b with a 32-byte output. */
export function blake2b256(data: Bytes): Bytes {
  return blake2b(data, { dkLen: 32 });
}
```

`dkLen: 32` asks for JAM's 32 bytes.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ each block names its parent by the hash of the header before it (280.1ms)
...
ℹ tests 54
ℹ suites 0
ℹ pass 54
ℹ fail 0
...
reported 54 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791728700903
...
```

99 links, checked: every one of these blocks really does follow the one before it.

Here are the first four, held by their hashes. Pick a block and flip one bit of its seal,
its slot or its entropy source. Its hash becomes a stranger, and the block after it no
longer matches. Flip a bit of its `parent` and the link before it breaks too.

<HashChain />

## Watch the chain

**New file** `bin/chain.ts`

```ts
// Walks the 100 blocks of the tiny "fallback" trace and checks that each one names the
// hash of the block before it as its parent.

import { readFileSync } from "node:fs";
import { Block, headerHash } from "../src/block.ts";
import type { Bytes } from "../src/bytes.ts";
import { toHex } from "../src/bytes.ts";
import { TINY } from "../src/config.ts";
import { Run } from "../src/obs.ts";

const run = new Run("chain");
let previous: Bytes | null = null; // the hash of the last block's header
let holding = 0;
for (let n = 1; n <= 100; n++) {
  const file = `../vectors/traces/fallback/${String(n).padStart(8, "0")}.json`;
  const header = Block(TINY).fromJson(JSON.parse(readFileSync(file, "utf8")).block).header;
  const hash = headerHash(TINY, header);
  const linked = previous !== null && toHex(header.parent) === toHex(previous);
  if (linked) holding++;
  run.event("block", { slot: header.slot, hash, parent: header.parent, linked });
  previous = hash;
}
console.log(`${holding} of 99 links hold.`);
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

`Run` is your client's own, not TypeScript's: the notebook from
[lesson 0.3](../00-start/03-watch-your-client.md#the-module), in `src/obs.ts`.
`new Run("chain")` opens one for this program. `"chain"` is its kind: Grafana files it
under that, and its id starts with it, `chain-1791728701859` below.

What flows through the walk:

::: code-group

```text [what goes in]
00000001.json … 00000100.json — the tiny fallback trace, one block each.
Block 2's header, the two fields the walk reads:
  slot    2
  parent  0x5592b088d8760232d1…   which must be the hash of block 1's whole header
```

```ts [what it computes]
const walk = {
  blocks: 100, // each header hashed, then compared with the next block's parent
  linked: 99, // toHex(header.parent) === toHex(previous), ninety-nine times
  unchecked: 1, // block 1's parent is the genesis header, which this walk never reads
};
```

```text [what comes out]
99 of 99 links hold.
```

:::

Block 2's `parent` really is Blake2b-256 of block 1's encoded header. That one equality,
checked down the whole trace, is what makes the hundred files a chain.

**Run**

```sh
npm pkg set scripts.chain="node bin/chain.ts"
npm run chain
```

```text
99 of 99 links hold.
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=chain-1791728701859
```

On the **2 · Blocks and state** dashboard, the *Chain* panel lists all hundred blocks:
slot, hash, and `linked: true` for every one after the first. (Block 1's parent is the
genesis header, in the trace's own `genesis.json`. This walk doesn't read it, so that first
link stays unchecked.)

![Chain panel](./images/01-chain.png)

<details>
<summary>lasair: <code>blake2b_256</code>, in <code>lib/utilities.ml</code></summary>

lasair uses a library too, `digestif`:

```ocaml
let blake2b_256 (data : bytes) : bytes =
  let module B2b = Digestif.Make_BLAKE2B(struct let digest_size = 32 end) in
  let hash = B2b.digest_bytes data in
  B2b.to_raw_string hash |> Bytes.of_string
```

`Make_BLAKE2B(struct let digest_size = 32 end)` builds a Blake2b with a 32-byte output:
the same knob as your `dkLen: 32`, in OCaml's module syntax. Every serious client leans
on a well-tested library here.

</details>

## Check your understanding

::: check
**Why does each header carry the hash of its parent's header?**

- [ ] As a compressed copy of the parent, to save space
  > No: a hash can't be turned back into the header. It is a fingerprint, 32 bytes
  > whatever the size of what it fingerprints.
- [x] So that no old block can change without breaking the link above it
  > Yes: block 2 holds block 1 by its exact fingerprint. Change any bit of block 1's
  > header and block 2's `parent` no longer matches.
- [ ] To tell a node the parent's slot, so blocks stay in order
  > No: the slot is its own field. A hash says nothing readable about the parent. It
  > can only be matched.

**One bit of a hashed input is flipped. What happens to the 32-byte hash?**

- [ ] One bit of the hash flips, in the same place
  > No: a hash isn't a copy of its input. Every bit of the output depends on every bit
  > of the input.
- [ ] Only its first few bytes change
  > No: the change is scattered across all 32 bytes, with no pattern to follow.
- [x] About half of its 256 bits flip, all over the place
  > Yes: one bit in, a stranger out. That is why one changed byte anywhere in a block
  > can't hide.

**The same number, written in 4 bytes and in 8, gives two hashes with nothing in common. Why?**

- [x] The hash is taken over bytes, not numbers, and the two encodings are different bytes
  > Yes: to hash a value, JAM encodes it and hashes the bytes. Change the encoding, even
  > by four zero bytes, and the hash is a stranger.
- [ ] One of the two must be a bug: the same number should give the same hash
  > No: the hash never sees the number, only bytes. That is why the encoding has to be
  > byte perfect before any hash can match.
- [ ] Zero bytes at the end count for more in a hash than other bytes
  > No: no byte counts for more. Any change at all, a zero added or a bit flipped, gives
  > a hash with nothing in common.

**The chain test fails whenever the hash is wrong. What does the known-answer test add?**

- [ ] Nothing: one failing test is enough
  > No: the chain test alone only says "every link is broken". The hunt would start in
  > the encoding, where nothing is wrong.
- [ ] Proof that the headers are encoded right
  > No: it hashes no bytes at all, so no encoding is in it. The chain test is the one
  > that needs the headers' bytes exact.
- [x] It tests the hash on its own, against a value anyone can check
  > Yes: its expected value comes from outside your code. When it fails, the hash is
  > wrong, whatever the encoding does.

**A Blake2b library gave 64 bytes where JAM wants 32. Why not keep the first 32?**

- [ ] You can: the first half of the 64-byte hash is the 32-byte one
  > No: Blake2b's output size is part of its setup and changes every byte. The 64-byte
  > hash of nothing starts `786a02f7`, the 32-byte one `0e5751c0`.
- [x] The output size is part of the function: you have to ask Blake2b for 32 bytes
  > Yes: JAM's hash is Blake2b with a 32-byte output. In the library that is
  > `dkLen: 32`, and the known answer is how you know it's right.
- [ ] You can, as long as every client cuts it the same way
  > No: every header in the vectors was hashed with a 32-byte output. Cut-down hashes
  > would break every link.
:::

## What you have

A hash function, and proof that your encoding of headers is exact for every field these
headers carry: a byte off anywhere in them would break a link. (None of them has a tickets
mark. [Lesson 4.6](../04-blocks/06-the-header.md)'s `header_1` covers that one.) A header
makes a second promise by hash, about everything its block carries.
[Lesson 5.2](./02-the-extrinsic-hash.md) checks it.

Next: [5.2 The extrinsic hash](./02-the-extrinsic-hash.md)
