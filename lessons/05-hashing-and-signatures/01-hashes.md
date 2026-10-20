# Hashes

A blockchain is a *chain* because each block holds on to the one before it, and what it
holds is a *hash*: a 32-byte fingerprint of the previous block's header. Change one bit
of an old block and its fingerprint changes, which breaks the next block's grip, and the
next, all the way up. This lesson gives your client JAM's hash function, then checks a
real chain of a hundred blocks, link by link.

## New words

- **Hash.** A 32-byte fingerprint of some data: change one bit of the data and the
  fingerprint changes completely. The Gray Paper writes H(x). *Example:* the hash of no
  bytes at all starts `0x0e5751c0`.
- **Parent.** The block before this one. Each header names its parent by hash, which is
  what makes the blocks a chain. *Example:* block 2's parent is block 1.
- **Trace.** A recorded run of real blocks, each with the state before and after it, from
  the test vectors. *Example:* the tiny `fallback` trace has 100 blocks.
- **Blake2b.** The hash function JAM uses. It can make fingerprints of any size up to 64
  bytes; JAM asks for 32. *Example:* asked for 64 bytes, the hash of no bytes at all
  starts `786a02f7`, a different value altogether, not a longer `0e5751c0`.
- **Library (dependency).** Code someone else wrote and published, which your project
  installs and uses. *Example:* `@noble/hashes`, from `npm install`.
- **Known-answer test.** A test whose expected value comes from somewhere you trust, not
  from your own code. *Example:* the published Blake2b-256 of nothing at all.

All six are in the [glossary](../glossary.md).

## What the Gray Paper says

§3 (*Notational Conventions*): H(m) is *Blake2b* with a 256-bit (32-byte) output, as
defined in RFC 7693. JAM hashes *encodings*: to hash a value, encode it ([Part 2](../02-codec/index.md)), then
hash the bytes.

§5 (*The Header*): a header's `parent` is the hash of its parent block's header,
H(ℰ(parent header)). The test vectors' block-import traces are chains of real blocks, so
that's something you can check.

Try it below. The input starts as `c7 12`: 4,807 written as ℰ₂, from [lesson 2.1](../02-codec/01-fixed-width-integers.md).
Flip any one of its bits, and about half of the hash's 256 bits flip with it, scattered,
with no pattern to follow. Empty the input to meet the hash of nothing, `0e5751c0...`.
Then write 42 as ℰ₄ and as ℰ₈: one number, two encodings, two hashes with nothing in
common.

<HashAvalanche />

## A library, for once

So far you've written everything yourself. Hash functions are the exception. Writing a
correct, fast Blake2b is a fine exercise in cryptography, but this is a tutorial about
JAM, and a tiny mistake in a hash would make every result wrong in ways no test of yours
would catch. So the client takes its first dependency: `@noble/hashes`, a small, audited
library with no dependencies of its own.

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

The first test pins the hash of *no bytes at all*, a classic known answer. The second
walks the tiny `fallback` trace, blocks 1 to 100, and checks every link. The official
vectors hold eight traces, each a short tiny chain built to try one thing, in its own
folder of `vectors/traces/`. `fallback` is the simplest: no service sends any work, so its
blocks carry nothing but their headers, and the block-makers are chosen by Safrole's
fallback rule ([lesson 8.3](../08-safrole/03-the-fallback-sealers.md)), hence the name.

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

The tests import two names that don't exist yet. A stub for the hash, the right size and
all zeros:

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

Both tests caught the stub: the hash of nothing isn't 32 zero bytes, and a chain of zero
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

This is what a known-answer test is for. Without the hash of nothing pinned to a value
anyone can check (`python3 -c "import hashlib; print(hashlib.blake2b(b'',
digest_size=32).hexdigest())"` prints it), the chain test alone would only tell you "every
link is broken", and the hunt would start in the encoding. The fix is one argument:

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

The first four of them, held by their hashes. Pick a block and flip one bit of its seal,
its slot or its entropy source: its hash becomes a stranger, and the block after it no
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
[lesson 0.3](../00-start/03-watch-your-client.md#the-module), in `src/obs.ts`. `new Run("chain")` opens one for this program, and
`"chain"` is its kind, which Grafana files it under and its id starts with:
`chain-1791728701859` below.

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
**Flip one bit of the input `c7 12`. What happens to its 32-byte hash?**

- [ ] One bit of the hash flips, in the same place
  > No: a hash isn't a copy of its input. Every bit of the output depends on every
  > bit of the input.
- [ ] Only the first few bytes change
  > No: the change is scattered across all 32 bytes, with no pattern to follow.
- [x] About half of its 256 bits flip, all over the place
  > Yes: one bit in, a stranger out. That's why one changed byte anywhere in a block
  > can't hide.

**42 written as ℰ₄ and as ℰ₈ give two hashes with nothing in common. Why?**

- [x] H hashes bytes, not numbers, and `2a 00 00 00` and `2a 00 00 00 00 00 00 00` are different bytes
  > Yes: to hash a value, JAM encodes it and hashes the bytes. Change the encoding,
  > even by four zero bytes, and the hash is a stranger.
- [ ] One of the two must be a bug: the same number should give the same hash
  > No: H never sees the number, only bytes. That's why the encoding has to be byte
  > perfect before any hash can match.
- [ ] Trailing zero bytes count for more in a hash than other bytes
  > No: no byte counts for more. Any change at all, a zero added or a bit flipped,
  > gives a hash with nothing in common.

**Each header names its parent by the hash of the parent's header. What does that buy?**

- [ ] A compressed copy of the parent, to save space
  > No: a hash can't be turned back into the header. It's a fingerprint, 32 bytes,
  > whatever the size of what it fingerprints.
- [x] Change any bit of block 1's header, and block 2's `parent` no longer matches
  > Yes: block 2 holds on to block 1 by its exact fingerprint. Breaking one link breaks
  > the grip of every block after it.
- [ ] It tells you the parent's slot, so blocks stay in order
  > No: the slot is its own field. The hash says nothing readable about the parent;
  > it can only be matched.

**Your first `blake2b(data)` gave 64 bytes. Could you have kept just the first 32?**

- [ ] Yes: the first half of the 64-byte hash is the 32-byte one
  > No: Blake2b's output size is part of its setup and changes every byte. The 64-byte
  > hash of nothing starts `786a02f7`, the 32-byte one `0e5751c0`.
- [ ] Yes, as long as every client cuts it the same way
  > No: JAM's H is Blake2b with a 32-byte output, and every header in the vectors was
  > hashed that way. Cut-down hashes would break every link.
- [x] No: you have to ask Blake2b for 32 bytes, `dkLen: 32`
  > Yes: that's the fix. The known answer, the hash of nothing starting `0e5751c0`,
  > is how you know it's right.
:::

## What you have

A hash function, and proof that your encoding of headers is exact for every field these
headers carry: a byte off anywhere in them would break a link. (None of them has a tickets
mark; [lesson 4.6](../04-blocks/06-the-header.md)'s `header_1` covers that one.) A header makes a second promise by
hash, about everything its block carries: [lesson 5.2](./02-the-extrinsic-hash.md)
checks it.

Next: [5.2 The extrinsic hash](./02-the-extrinsic-hash.md)
