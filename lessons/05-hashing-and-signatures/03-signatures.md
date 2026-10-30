# Signatures

A hash says "these bytes haven't changed". It can't say *who*: anyone can hash anything.
For "who", you need a *signature*. Only the holder of a secret key can make one, and
anyone with the matching public key can check it. JAM validators sign all day long: every
assurance, every guarantee, every vote in a dispute. This lesson checks real validator
signatures, a thousand of them, and then catches a forgery red-handed.

## New words

- **Signature.** Proof that the holder of a secret key approved some bytes; anyone with
  the matching public key can check it. *Example:* a validator's signature on an
  assurance.
- **Secret key and public key.** A pair: the secret one signs, the public one checks. Only
  the holder knows the secret one; everyone may know the public one. *Example:* a
  validator's 32-byte Ed25519 public key.
- **Ed25519.** The signature scheme JAM uses for its everyday signatures (RFC 8032).
  *Example:* a 64-byte signature.
- **Domain prefix.** A few ASCII bytes in front of a signed message, so a signature for
  one job can't pass for another. *Example:* `jam_available`, `jam_guarantee`.

All four are in the [glossary](../glossary.md).

## What the Gray Paper says

§3 (*Notational Conventions*): JAM's everyday signatures are *Ed25519*, as RFC 8032
defines them. A public key is 32 bytes, a signature is 64.

§11 (*Reporting and Assurance*): an assurance ([lesson 4.2](../04-blocks/02-tiny-and-full.md)) must be signed by the
validator it names, with that validator's Ed25519 key, and the message signed is

> X_A, then H(ℰ(parent, bitfield)), where X_A = `$jam_available`

Three details, and each one matters:

- **The `$`.** §3 uses `$` to mark ASCII strings (𝔹_$ is the set of them): it's
  notation, not a byte. What's signed starts with the 13 ASCII bytes of `jam_available`.
  (Trust the bytes: put the `$` in, and not one signature in the vectors checks.)
- **Why a prefix at all?** So a signature made for one job can't be passed off as
  another. A guarantee's message starts with `jam_guarantee`, a dispute vote's with
  `jam_valid` or `jam_invalid`. Different first bytes, different messages: a validator's
  "I hold my piece" can never be replayed as "this report is good".
- **ℰ(parent, bitfield)** is just the two side by side: a hash and a fixed-size bitfield
  encode as themselves. The parent is the block's parent hash, and an assurance's
  `anchor` must be exactly that (§11 again), so your code puts the anchor in the
  parent's place. ([Lesson 11.3](../11-assurances/03-bad-assurances.md)
  checks that the two really are the same.)

Try it below. A validator signs an assurance's 45 bytes, and its public key checks them.
Change one bit of the bitfield, or of the parent, and check again. Swap the prefix for
`jam_guarantee`, put the `$` in, or check with another validator's key. Each one fails.
Sign again and it passes, with a signature that shares almost no bytes with the old one.
The demo validator's secret key is made up and shown, so you can sign. The real
assurance, validator 5's from the vectors, you can only check.

<SignCheck />

## Another library

Ed25519 is another job for a specialist. `@noble/curves` comes from the same author as
`@noble/hashes`, and is built on it.

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
    "decode-block": "node bin/decode.ts block ../vectors/codec/tiny/block.bin",
    "chain": "node bin/chain.ts"
  },
  "dependencies": {
    "@noble/curves": "2.4.0",
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

Three tests, from small to dramatic. First a known answer: RFC 8032's own first example,
a signature of no bytes at all. Then real validators, from the `stf/assurances` test
vectors. Those vectors test a whole state transition, which comes much later; today you
borrow just two things from them: the validators' keys (`pre_state.curr_validators`)
and the assurances (`input.assurances`). In `some_assurances-1`, every signature is
genuine. In `assurances_with_bad_signature-1`, one isn't.

Here is that file: the fields the tests read, lit, and where the rest gets read. Step
through its six assurances as the third test does, and set a breakpoint in
`signedAssurances` to watch the same values go by:

<VectorStep />

**New file** `test/signature.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { Assurance, assuranceSigned } from "../src/block.ts";
import { fromHex } from "../src/bytes.ts";
import type { Config } from "../src/config.ts";
import { FULL, TINY } from "../src/config.ts";
import { verifyEd25519 } from "../src/signature.ts";
import { vectorJson } from "./vectors.ts";
import type { Bytes } from "../src/bytes.ts";

test("Ed25519: RFC 8032's first example, a signature of no bytes at all", () => {
  const key: Bytes = fromHex("0xd75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a");
  const signature: Bytes = fromHex(
    "0xe5564300c360ac729086e2cc806e828a84877f1eb8e5d974d873e06522490155" +
      "5fb8821590a33bacc61e39701cf9b46bd25bf5f0595bbe24655141438e7a100b",
  );
  const valid: boolean = verifyEd25519(key, new Uint8Array(0), signature);
  assert.equal(valid, true);
  const forAnotherMessage: boolean = verifyEd25519(key, fromHex("0x00"), signature);
  assert.equal(forAnotherMessage, false);
});

/** For each assurance in an assurances test vector: is it signed by the validator it names? */
function signedAssurances(config: Config, name: string): boolean[] {
  const vector = vectorJson(`stf/assurances/${config.name}/${name}.json`) as {
    input: { assurances: unknown[] };
    pre_state: { curr_validators: { ed25519: string }[] };
  };
  const keys = vector.pre_state.curr_validators.map((v) => fromHex(v.ed25519));
  return vector.input.assurances.map((a) => assuranceSigned(keys, Assurance(config).fromJson(a)));
}

test("every assurance is signed by the validator it names: 6 on tiny, 1023 on full", () => {
  const tiny: boolean[] = signedAssurances(TINY, "some_assurances-1");
  assert.deepEqual(tiny, Array(6).fill(true));
  const full: boolean[] = signedAssurances(FULL, "some_assurances-1");
  assert.deepEqual(full, Array(1023).fill(true));
});

test("a forged signature is caught", () => {
  const signed: boolean[] = signedAssurances(TINY, "assurances_with_bad_signature-1");
  assert.deepEqual(signed, [true, false, true, true, true, true]);
});
```

Look at the first test's second check. The same signature, on a message one byte
different, is worthless. That's the whole point of a signature.

A stub first, and a dangerous one: a check that says yes to everything.

**New file** `src/signature.ts`

```ts
// Signatures (GP §3): Ed25519, as RFC 8032 defines it. Validators sign most of what they
// say with it; blocks and tickets use Bandersnatch instead.

import type { Bytes } from "./bytes.ts";

/** Is `signature` a valid Ed25519 signature of `message`, by the holder of `key`? */
export function verifyEd25519(key: Bytes, message: Bytes, signature: Bytes): boolean {
  return true;
}
```

And the real assurance check, which only builds the message and asks the stub:

**Add to** `src/block.ts`

```ts
import { verifyEd25519 } from "./signature.ts";

/** X_A (GP §11): an assurance's message starts with these bytes, "$jam_available" in the GP. */
const AVAILABLE = new TextEncoder().encode("jam_available");

/** What an assurance's validator signs (GP §11): X_A, then the hash of anchor and bitfield. */
export function assuranceMessage(assurance: Assurance): Bytes {
  return concatBytes(AVAILABLE, blake2b256(concatBytes(assurance.anchor, assurance.bitfield)));
}

/** Is an assurance signed by the validator it names? `keys`: the validators' Ed25519 keys. */
export function assuranceSigned(keys: Bytes[], assurance: Assurance): boolean {
  const key = keys[assurance.validator_index];
  return verifyEd25519(key, assuranceMessage(assurance), assurance.signature);
}
```

`TextEncoder` turns a string into its UTF-8 bytes, and for plain ASCII text like this
that's one byte per letter.

**Run, expect it to fail**

```sh
npm test
```

```text
...
✖ Ed25519: RFC 8032's first example, a signature of no bytes at all (0.9ms)
✔ every assurance is signed by the validator it names: 6 on tiny, 1023 on full (29.6ms)
✖ a forged signature is caught (1.3ms)
...
ℹ tests 58
ℹ suites 0
ℹ pass 56
ℹ fail 2
...
test at test/signature.test.ts:40:1
✖ a forged signature is caught (1.3ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
  + actual - expected

    [
      true,
  -   false,
      true,
      true,
      true,
      true,
  +   true
    ]

      at TestContext.<anonymous> (…/client/test/signature.test.ts:42:10)
...
```

Look at what passed: the RFC's genuine signature, and all 1,029 genuine assurances on
tiny and full. A check that trusts everyone sails through every honest case. Only the two
checks that try a forgery caught it, which is why every signature test needs one.

## The code

**Replace in** `src/signature.ts`

```ts
import { ed25519 } from "@noble/curves/ed25519.js";

/** Is `signature` a valid Ed25519 signature of `message`, by the holder of `key`? */
export function verifyEd25519(key: Bytes, message: Bytes, signature: Bytes): boolean {
  return ed25519.verify(signature, message, key);
}
```

A thin wrapper, with the arguments in the order you'd say them: *who* signed *what*, and
the signature. (The library wants them the other way round; now only one line of your
client has to remember that.)

Blocks and tickets are signed with a different kind of key, Bandersnatch. Its keys turn
up with the ticket lottery in [Part 8](../08-safrole/index.md); checking its signatures needs a library
this tutorial doesn't add yet.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ a forged signature is caught (6.9ms)
...
ℹ tests 58
ℹ suites 0
ℹ pass 58
ℹ fail 0
...
reported 58 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791728705670
...
```

Over a thousand genuine signatures checked, and one forgery caught. The full-size check
takes about a second: 1,023 signatures is real work, even for a fast library.

## Watch it

**New file** `bin/assurances.ts`

```ts
// Checks the signature on every assurance in an assurances test vector, with the Ed25519
// keys of the validators in the vector's state.
// Usage: npm run assurances <vector.json>, e.g.
//        npm run assurances ../vectors/stf/assurances/tiny/some_assurances-1.json

import { readFileSync } from "node:fs";
import { Assurance, assuranceSigned } from "../src/block.ts";
import { fromHex } from "../src/bytes.ts";
import { FULL, TINY } from "../src/config.ts";
import { Run } from "../src/obs.ts";

const [file] = process.argv.slice(2);
const config = file.includes("/full/") ? FULL : TINY;
const vector = JSON.parse(readFileSync(file, "utf8"));
const keys = vector.pre_state.curr_validators.map((v: { ed25519: string }) => fromHex(v.ed25519));
const run = new Run("assurances");
let valid = 0;
for (const json of vector.input.assurances) {
  const assurance = Assurance(config).fromJson(json);
  const signed = assuranceSigned(keys, assurance);
  if (signed) valid++;
  const validator = assurance.validator_index;
  console.log(`validator ${validator}: ${signed ? "signed it" : "FORGED"}`);
  run.event("assurance", { validator, key: keys[validator], bitfield: assurance.bitfield, signed });
}
console.log(`${valid} of ${vector.input.assurances.length} signatures are valid.`);
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

What flows through it — the forged assurance, what the check makes of it, the line it
earns:

::: code-group

```json [what goes in]
{
  "anchor": "0xd61a38a0f73b…",
  "bitfield": "0x02",
  "validator_index": 1,
  "signature": "0x44e668f7d744…"
}
```

```ts [what it computes]
const checked = {
  keys: 6, // pre_state.curr_validators: one Ed25519 key per validator
  prefix: "jam_available", // the domain every assurance signature must cover
  validator1: "FORGED", // this signature never came from validator 1's key
  valid: 5, // of 6: every other assurance checks out
};
```

```text [what comes out]
validator 1: FORGED
5 of 6 signatures are valid.
```

:::

`validator_index` says whose key to check — the vector's `curr_validators[1]`, key
`0xad93247bd0130755…` — and the signature under it was made by someone else, so the
check says so. The other five verify.

**Run**

```sh
npm pkg set scripts.assurances="node bin/assurances.ts"
npm pkg set scripts.assurances-bad-signature="node bin/assurances.ts ../vectors/stf/assurances/tiny/assurances_with_bad_signature-1.json"
npm run assurances-bad-signature
```

```text
...
validator 1: FORGED
...
5 of 6 signatures are valid.
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=assurances-1791728707489
```

Caught! Validator 1's assurance carries a signature its key never made. The new
*Assurances* panel, on the **2 · Blocks and state** dashboard, lists each one: the validator, `signed: true` or
`false`, its key and its bitfield. Then point it at
`../vectors/stf/assurances/full/some_assurances-1.json` and watch 1,023 validators
check out.

![Assurances panel](./images/03-assurances.png)

<details>
<summary>lasair: the dollar sign, in <code>conformance/assurances_stf.ml</code></summary>

lasair met the same `$`, and settled it by asking, then checking both against the vectors.
(Its comment calls the `$` "binary string"; the Gray Paper's §3 says it marks ASCII text.
Either way, the bytes are the letters without it.)

```ocaml
(* Note: Graypaper uses \token{\$jam_available} but per dakk's clarification,
   the $ is notation for "binary string" - actual context omits the dollar sign.
   Verified against test vectors: "jam_available" works, "$jam_available" does not. *)
let assurance_context = Bytes.of_string "jam_available"
```

For the signature itself, lasair calls a Rust library, `ed25519-consensus`, through a
small bridge. Both clients lean on a specialist here, just as with Blake2b.

</details>

## Check your understanding

::: check
**What can a signature tell you that a hash can't?**

- [x] Who approved the bytes: only the holder of the secret key could have made it
  > Yes: anyone can hash anything, but only one validator can sign with its key, and
  > anyone with its public key can check.
- [ ] That the bytes are hidden from everyone else
  > No: a signature hides nothing. The message is in the open; the signature only
  > vouches for it.
- [ ] Nothing new: it's a longer hash, 64 bytes instead of 32
  > No: anyone can compute a hash of anything. Only the holder of the secret key can
  > make a signature that its public key accepts.

**X_A is written `$jam_available`. What is the `$`?**

- [ ] A real byte, `0x24`, in front of the letters
  > No: put it in, and not one signature in the vectors checks. The signed message
  > starts with the letters themselves.
- [ ] Shorthand for the string's length in front, as with a blob
  > No: there's no length. X_A is just the 13 bytes of `jam_available`; the 32-byte
  > hash follows, 45 bytes in all.
- [x] Notation: it marks an ASCII string, and is not a byte itself
  > Yes: §3 uses `$` for ASCII strings. What's signed starts with the 13 letters, no
  > `$`.

**What does a prefix like `jam_available` prevent?**

- [ ] Anyone reading the signature without a key
  > No: signatures aren't secret. Anyone can read one, and anyone with the public key
  > can check it.
- [x] A signature made for one job being passed off as another
  > Yes: a guarantee's message starts `jam_guarantee`, a vote's `jam_valid` or
  > `jam_invalid`. "I hold my piece" can never be replayed as "this report is good".
- [ ] Mixing up which validator signed
  > No: every validator uses the same prefix. The assurance's `validator_index` says
  > whose key to check with.

**The stub that said yes to everything passed all 1,029 genuine assurances. What does that show?**

- [ ] The stub was nearly right: it only missed one forgery
  > No: it checked nothing at all. It would have passed a thousand forgeries just as
  > happily.
- [ ] The genuine assurances were enough to prove the check works
  > No: honest cases pass a check that trusts everyone. They can't tell a real check
  > from a fake one.
- [x] Every signature test needs a forgery to catch
  > Yes: only the two checks that tried a forgery failed against the stub. A test
  > that never says "no" can't prove the code can.
:::

## What you have

[Part 5](./index.md), done. Your client can check a block's links (hashes), its contents (the
extrinsic hash), and who signed what (Ed25519). Guarantees and dispute votes are signed
the same way, with their own prefixes; you'll check them in the parts that process them.
Every header also commits to the whole state, by its root: [Part 6](../06-state-and-merklization/index.md) computes that root.

Next: [Part 6 · State and Merklization](../06-state-and-merklization/index.md)
