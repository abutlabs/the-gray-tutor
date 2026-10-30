# Reading the state

You know where everything in the state lives ([lesson 6.2](./02-state-keys.md)). Time to open the boxes. Each
value is an encoding, so [Part 2](../02-codec/index.md)'s codecs read it. This lesson reads three components,
the time, the entropy and the validators, and checks each against the blocks themselves.

## New words

- **Validator key.** Everything the chain knows about one validator: three keys for three
  jobs, and some metadata, 336 bytes in all. *Example:* its Ed25519 key signs assurances.
- **Bandersnatch key.** The key a validator uses for the ticket lottery and to seal
  blocks ([Part 8](../08-safrole/index.md)). *Example:* the first 32 of the 336 bytes.
- **BLS key.** A 144-byte key for signatures that can be combined into one. *Example:*
  bytes 64 to 207 of a validator key.

All three are in the [glossary](../glossary.md).

## What the Gray Paper says

Appendix D's T says what each key's value is. Three of them:

| Key | Value | Codec |
| --- | --- | --- |
| C(11) | τ, the time: ℰ₄ of the slot of the most recent block | `u32` |
| C(6) | η, entropy: four hashes, newest first, no length in front | `seqN(hash, 4)` |
| C(8) | κ, this epoch's validators, with their length in front | `seq(ValidatorKey)` |

A *validator key* (§6) is 336 bytes: three keys for three jobs, Bandersnatch (32 bytes),
Ed25519 (32) and BLS (144), then 128 bytes of metadata, which the Gray Paper leaves opaque
(a validator's network address, say). You met the first two in [lesson 4.6](../04-blocks/06-the-header.md), where an
epoch mark carries just those. The state keeps all four parts.

<ValidatorKeyMap />

And three facts from elsewhere in the Gray Paper, to check your reading against:

- **τ** (§6): after a block, the time *is* that block's slot. So the time in the state
  before block n is the slot of block n − 1.
- **η** (§6): an epoch mark ([lesson 4.6](../04-blocks/06-the-header.md)) is η₀, η₁ and the next validators, with η₀ and η₁
  as they stood before its block. So `epoch_mark.entropy` must be the state's η₀, and
  `epoch_mark.tickets_entropy` its η₁.
- **κ** (§11): assurances are signed with the validators' Ed25519 keys ([lesson 5.3](../05-hashing-and-signatures/03-signatures.md)). So
  the keys in κ must check out against real assurances.

## The tests

The tests need each trace step's block as well as its state, so `traceState` hands it
over too.

**Replace in** `test/vectors.ts`

```ts
/** The state before block n of a tiny trace, the state root its header promises, the block. */
export function traceState(family: string, n: number) {
  const name = `traces/${family}/${String(n).padStart(8, "0")}.json`;
  const trace = vectorJson(name) as {
    pre_state: { keyvals: { key: string; value: string }[] };
    block: { header: { parent_state_root: string } };
  };
  const entries = trace.pre_state.keyvals.map((e) => ({
    key: fromHex(e.key),
    value: fromHex(e.value),
  }));
  return { entries, promised: trace.block.header.parent_state_root, block: trace.block };
}
```

**Add to** `test/state.test.ts`

```ts
import { Block, assuranceSigned } from "../src/block.ts";
import { TINY } from "../src/config.ts";
import { readEntropy, readTime, readValidators } from "../src/state.ts";
import type { Bytes } from "../src/bytes.ts";
import type { EpochMark } from "../src/block.ts";

test("τ: the time before each block is the slot of the block before it", () => {
  for (let n = 2; n <= 100; n++) {
    const before: Block = Block(TINY).fromJson(traceState("fallback", n - 1).block);
    const time: number = readTime(traceState("fallback", n).entries);
    assert.equal(time, before.header.slot);
  }
});

test("η: each epoch mark carries η₀ and η₁ from the state before its block", () => {
  let marks = 0;
  for (let n = 1; n <= 100; n++) {
    const { entries, block } = traceState("safrole", n);
    const mark: EpochMark | null = Block(TINY).fromJson(block).header.epoch_mark;
    if (mark === null) continue;
    const entropy: Bytes[] = readEntropy(entries);
    const marked: Bytes[] = [mark.entropy, mark.tickets_entropy];
    const fromState: Bytes[] = [entropy[0], entropy[1]];
    assert.deepEqual(marked, fromState);
    marks++;
  }
  assert.ok(marks > 0);
});

test("κ: real assurances check out with the validators' keys from the state", () => {
  let checked = 0;
  for (let n = 1; n <= 100; n++) {
    const { entries, block } = traceState("preimages", n);
    const keys: Bytes[] = readValidators(entries).map((v) => v.ed25519);
    for (const assurance of Block(TINY).fromJson(block).extrinsic.assurances) {
      const signed: boolean = assuranceSigned(keys, assurance);
      assert.ok(signed, `block ${n}`);
      checked++;
    }
  }
  assert.equal(checked, 524);
});
```

Three components, three independent witnesses: 99 headers for τ, the 8 epoch marks of
the `safrole` trace (one every 12 slots, at the start of each tiny epoch) for η, and all
524 assurances of the `preimages` trace for κ. The `assert.ok(marks > 0)` and
`assert.equal(checked, 524)` lines are there so a loop that silently checks nothing
can't pass.

## The code

**Add to** `src/state.ts`

```ts
import { toHex } from "./bytes.ts";
import type { Codec, Value } from "./codec/codec.ts";
import { decode, fixedBytes, hash, record, seq, seqN, u32 } from "./codec/codec.ts";
import type { KeyValue } from "./trie.ts";

/** A validator's keys (GP §6): 336 bytes, the four keys it uses for different jobs. */
export const ValidatorKey = record({
  bandersnatch: fixedBytes(32), // for sealing blocks and the ticket lottery
  ed25519: fixedBytes(32), // for signing everything else
  bls: fixedBytes(144), // for BEEFY, which bridges to other chains
  metadata: fixedBytes(128), // where to reach it on the network
});
export type ValidatorKey = Value<typeof ValidatorKey>;

/** State component i, read from the state's entries with its codec. */
function component<T>(entries: KeyValue[], i: number, codec: Codec<T>): T {
  const key = toHex(componentKey(i));
  const entry = entries.find((e) => toHex(e.key) === key);
  if (!entry) throw new Error(`the state has no component ${i}`);
  return decode(codec, entry.value);
}

/** τ, C(11): the time, as the slot of the most recent block. */
export function readTime(entries: KeyValue[]): number {
  return component(entries, 11, u32);
}

/** η, C(6): four 32-byte hashes of fresh randomness, the newest first. */
export function readEntropy(entries: KeyValue[]): Bytes[] {
  return component(entries, 6, seqN(hash, 4));
}

/** κ, C(8): the validators of this epoch. */
export function readValidators(entries: KeyValue[]): ValidatorKey[] {
  return component(entries, 8, seq(ValidatorKey));
}
```

`component` does the work: build the key with C(i), find its entry, decode the value.
The three readers say which component and which codec.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ τ: the time before each block is the slot of the block before it (171.5ms)
✔ η: each epoch mark carries η₀ and η₁ from the state before its block (158.7ms)
✔ κ: real assurances check out with the validators' keys from the state (787.6ms)
...
ℹ tests 66
ℹ suites 0
ℹ pass 66
ℹ fail 0
...
reported 66 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791728965838
...
```

The κ test: real assurances ([Part 4](../04-blocks/index.md)), checked with Ed25519 ([Part 5](../05-hashing-and-signatures/index.md)) against keys read
from a real state ([Part 6](./index.md)) with your own codecs ([Part 2](../02-codec/index.md)). Four parts, one `assert`.

And the test checks against the right set. The Gray Paper checks an assurance with κ, the
validators as they were *before* the block (§11: κ, with no prime mark), so the test's choice holds
even when the sets start rotating, in [Part 8](../08-safrole/index.md). (In these traces they never do: ι, κ
and λ hold the same six throughout.)

## Watch it

**New file** `bin/read-state.ts`

```ts
// Reads three components of the state before a trace's block: τ, η and κ.
// Usage: npm run read-state <trace.json>, e.g.
//        npm run read-state ../vectors/traces/safrole/00000012.json

import { readFileSync } from "node:fs";
import { fromHex, toHex } from "../src/bytes.ts";
import { Run } from "../src/obs.ts";
import { readEntropy, readTime, readValidators } from "../src/state.ts";

const [file] = process.argv.slice(2);
const trace = JSON.parse(readFileSync(file, "utf8"));
const entries = trace.pre_state.keyvals.map((e: { key: string; value: string }) => ({
  key: fromHex(e.key),
  value: fromHex(e.value),
}));
const run = new Run("read-state");

const slot = readTime(entries);
console.log(`τ, the time: slot ${slot}`);
run.event("time", { slot });

readEntropy(entries).forEach((hash, index) => {
  console.log(`η${index}: ${toHex(hash)}`);
  run.event("entropy", { index, hash });
});

readValidators(entries).forEach((v, index) => {
  console.log(`κ${index}: ed25519 ${toHex(v.ed25519)}`);
  run.event("validator", { index, ed25519: v.ed25519, bandersnatch: v.bandersnatch });
});

const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

What flows through it — three state entries in, three components out:

::: code-group

```json [what goes in]
{ "pre_state": { "keyvals": [
  { "key": "0x0b00000000…", "value": "0x0b000000" },
  { "key": "0x0600000000…", "value": "0xcf7f084efbeefbda10df…" },
  { "key": "0x0800000000…", "value": "0x06ff71c6c03ff88adb5e…" }
] } }
```

```ts [what it computes]
const components = {
  tau: 11, // C(11)'s 4-byte value, 0x0b000000, read as a u32: slot 11
  eta: 4, // C(6)'s 128 bytes: four 32-byte hashes, η₀ first
  kappa: 6, // C(8)'s list of validator keys, 336 bytes each
};
```

```text [what comes out]
τ, the time: slot 11
η0: 0xcf7f084efbeefbda10df98970c403993cfc0039f1c240ba4f2ff075890a1a83b
```

:::

The key of each `keyvals` entry begins with its component's number — 0x0b is 11, τ; 0x06 is 6, η;
0x08 is 8, κ — and the value is that component's encoding, which the readers decode:
the time's four little-endian bytes say slot 11, and η's first 32 bytes are η₀ exactly
as the output prints it.

**Run**

```sh
npm pkg set scripts.read-state="node bin/read-state.ts"
npm pkg set scripts.read-state-safrole="node bin/read-state.ts ../vectors/traces/safrole/00000012.json"
npm run read-state-safrole
```

```text
τ, the time: slot 11
η0: 0xcf7f084efbeefbda10df98970c403993cfc0039f1c240ba4f2ff075890a1a83b
...
κ0: ed25519 0x4418fb8c85bb3985394a8c2756d3643457ce614546202a2f50b093d762499ace
...
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=read-state-1791728969293
```

Block 12 of the `safrole` trace starts an epoch, and its state says the time is slot 11:
one block earlier, as promised. Compare η0 and η1 with that block's epoch mark, in the
trace file: same hashes. And κ0's key, `0x4418fb8c…`, is an old friend: it's validator 0
from [lesson 5.3](../05-hashing-and-signatures/03-signatures.md)'s assurance vectors. The test vectors share one cast of six validators.
The *Reading σ* panel shows all three components.

![Reading σ panel](./images/03-reading-sigma.png)

<details>
<summary>lasair: <code>type validator_keys</code>, in <code>lib/definitions.ml</code></summary>

```ocaml
type validator_keys = {
  ed: ed_key;           (* Ed25519 key for signing *)
  bs: bs_key;           (* Bandersnatch key for VRF *)
  bls: bls_key;         (* BLS key for aggregation *)
  metadata: bytes;      (* Additional metadata *)
}
```

Ed25519 first, Bandersnatch second: the opposite of the bytes. In lasair that's fine,
because its decoders are written by hand and read the bytes in their own order. In your
client the record *is* the byte order ([lesson 2.5](../02-codec/05-sequences-and-records.md)): swap `bandersnatch` and `ed25519`
in `ValidatorKey`, and every Ed25519 key comes out wrong. Try it, and watch the κ test go
red.

</details>

## Check your understanding

::: check
**The state before block 12 of the `safrole` trace says τ is slot 11. Why not 12?**

- [ ] The state lags a slot behind, and catches up later
  > No: it's exactly right. τ is the slot of the most recent block, and in this state
  > block 12 hasn't happened yet.
- [x] τ is the slot of the most recent block, and before block 12 that's block 11
  > Yes: after a block, the time is that block's slot. So the state before block n holds
  > block n − 1's slot: here, 11.
- [ ] Slots count from 0 and blocks from 1, so block 12 is in slot 11
  > No: block 12 is in slot 12; its header says so. The 11 is the block before it.

**κ's value is 2,017 bytes on tiny. Where does that come from?**

- [x] A length byte, `06`, then six validator keys of 336 bytes each
  > Yes: 1 + 6 × 336 = 2,017. Each key is Bandersnatch (32), Ed25519 (32), BLS (144) and
  > metadata (128).
- [ ] A `01` saying κ is there, then six validator keys
  > No: κ isn't optional, so there's no there-or-not byte. The first byte is `06`, how many
  > validators follow.
- [ ] Six validators' Bandersnatch and Ed25519 keys, as in an epoch mark
  > No: those are 64 bytes a validator, 6 × 64 = 384 in all. The state keeps all four
  > parts of each key, 336 bytes.

**The test checks real assurances against keys read from κ. Which key, and where is it in each validator's 336 bytes?**

- [ ] The Bandersnatch key, bytes 0 to 31
  > No: Bandersnatch is for sealing blocks and the ticket lottery. Assurances are signed
  > with Ed25519.
- [ ] The BLS key, bytes 64 to 207
  > No: BLS is for signatures that can be combined into one. An assurance is a plain
  > Ed25519 signature.
- [x] The Ed25519 key, bytes 32 to 63
  > Yes: it comes second, after the 32-byte Bandersnatch key. Read the wrong 32 bytes,
  > as swapping two fields of `ValidatorKey` does, and every assurance fails.

**Block 12 of the `safrole` trace starts an epoch. What must its epoch mark's `entropy` be?**

- [ ] η₀ after block 12, stirred with the block's own randomness
  > No: the mark carries η₀ as it stood *before* its block, the value in the state the
  > block starts from.
- [ ] η₃, the oldest of the four
  > No: the mark carries η₀ and η₁, as `entropy` and `tickets_entropy`.
- [x] η₀ in the state before block 12, `0xcf7f084e…`
  > Yes: the epoch mark carries η₀ and η₁ as they stood before its block. `bin/read-state.ts`
  > printed that η₀, and the trace's epoch mark holds the same hash.
:::

## What you have

Your client can read the state: find any component by its key, decode it with the codecs
it already has, and trust it, because three independent witnesses agree. [Part 7](../07-time-and-shuffling/index.md) turns to
time itself: epochs, and the shuffle that deals validators out to cores.

Next: [Part 7 · Time and shuffling](../07-time-and-shuffling/index.md)
