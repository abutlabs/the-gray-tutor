# State keys

[Lesson 6.1](./01-the-state-trie.md)'s keys looked suspiciously *designed*: `0x01` and thirty zeros, `0xff` and
thirty zeros, and then a few that looked like noise. They are designed. Every key in a
JAM state is made by one of three recipes, which the Gray Paper calls C. Learn the
recipes, and you know where to find anything: the validators, the clock, a service's
code.

## New words

- **State key.** The 31-byte key an entry of the state is filed under. *Example:* `0x0b`
  and 30 zeros is the time.
- **State component.** One of the 16 parts of the state, each with a Greek letter.
  *Example:* C(11) is τ, the time.

Both are in the [glossary](../glossary.md).

## What the Gray Paper says

Appendix D. Every key is 31 bytes, made by C, which the Gray Paper calls the *state-key
constructor*. C is one function with three cases, and what you hand it picks the case,
like a TypeScript function overloaded on its arguments: one number; a number and a
service; or a service and some bytes.

| Case | You hand it | Where it puts | The 31 bytes |
| --- | --- | --- | --- |
| C(i) | a number i, 0 to 255 | state component i | i, then 30 zeros |
| C(i, s), as C(255, s) | 255 and a service id s | service s's account | 255, then ℰ₄(s) with a zero after each byte, then zeros |
| C(s, h) | a service id s and bytes h | something service s keeps | ℰ₄(s) woven into H(h): n₀ a₀ n₁ a₁ n₂ a₂ n₃ a₃ a₄ … a₂₆ |

The middle case takes any number in the Gray Paper, but the state only ever hands it 255:
every service's account is C(255, s).

(In the last row, n = ℰ₄(s) and a = H(h): the service's four bytes take turns with the
hash's first four, then 23 more bytes of the hash follow.)

Pick a recipe below and type what goes in. Each of the 31 bytes is coloured by where it
came from. Make service `0x04030201`'s account, then weave a different service into the
same hash: only the four service bytes move. The widget doesn't hash, so for C(s, h) you
type the hash's bytes yourself. They start as the ones in a key from [lesson 6.1](./01-the-state-trie.md).

<StateKeyWeave />

The state has **16 components**, C(1) to C(16), each a Greek letter in the Gray Paper.
Here they are, with their sizes in the state you met in [lesson 6.1](./01-the-state-trie.md):

| Key | Letter | What it is | Bytes |
| --- | --- | --- | --- |
| C(1) | α | the authorizer pool | 514 |
| C(2) | ϕ | the authorizer queue | 5,120 |
| C(3) | β | recent blocks | 103 |
| C(4) | γ | Safrole's state: the ticket lottery | 2,547 |
| C(5) | ψ | past judgements, from disputes | 4 |
| C(6) | η | entropy | 128 |
| C(7) | ι | the next validators | 2,017 |
| C(8) | κ | the validators | 2,017 |
| C(9) | λ | the previous validators | 2,017 |
| C(10) | ρ | reports awaiting availability | 2 |
| C(11) | τ | the time | 4 |
| C(12) | χ | privileged services | 21 |
| C(13) | π | statistics | 307 |
| C(14) | ω | reports ready to accumulate | 12 |
| C(15) | ξ | recently accumulated packages | 12 |
| C(16) | θ | the last accumulation outputs | 1 |

You can already read a few of those sizes. τ is 4 bytes: ℰ₄ of a timeslot ([lesson 0.4](../00-start/04-the-jam-clock.md)).
η is 128: four 32-byte hashes. The three validator sets are 2,017 each: a length byte,
then six validators of 336 bytes. Reading what's *inside* comes [next lesson](./03-reading-the-state.md).

What a service keeps comes in three kinds, and each makes its h differently:

- a **preimage** p: h = ℰ₄(2^32 − 2) ⌢ H(p);
- a **request** for a preimage of hash H(p) and length l: h = ℰ₄(l) ⌢ H(p);
- a **storage** item with key k: h = ℰ₄(2^32 − 1) ⌢ k.

Hashing h makes every key exactly 31 bytes, whatever went in, and the Gray Paper points
out the bonus: a client never needs the original storage key back, only its hash. This
lesson builds preimages and requests. Storage keys wait: your client keeps each service's
storage as a map from key to value (read from the vectors in [lesson 14.2](../14-services/02-the-service-account.md), written
by the `write` host call in [lesson 16.5](../16-host-calls/05-storage.md)), and needs these keys only to put that map
into the state trie, which block import does ([lesson 19.2](../19-block-import/02-the-whole-state.md)).

All three cases together make a real state. Here is the one `npm run state-fallback` reads
in [lesson 6.1](./01-the-state-trie.md): one file, `fallback/00000001.json`, whose 21 entries the script builds into the trie
and hashes up to one root, then checks against the `parent_state_root` in the same file's
block header. Each leaf is named by its key's case. The 16 components sit together, as their
keys all start with a few zero bits; the account is alone on the other side, as 255 starts
with a 1; and service 0's four keys all start `0x00`, its id's first byte, so they sit
deepest, told apart only by their hash bytes. Set τ to slot 1, four bytes in one leaf,
and the root changes completely: that is why 32 bytes can stand for the whole state.
Every dot is a hash too: tap a branch to see the two 32-byte hashes it joins, the 64-byte
node they make, and the hash of that, which the branch above joins in turn, all the way to
the root.

<StateRoot />

## The tests

**New file** `test/state.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { toHex } from "../src/bytes.ts";
import { blake2b256 } from "../src/hash.ts";
import { accountKey, componentKey, preimageKey, requestKey } from "../src/state.ts";
import { traceState } from "./vectors.ts";
import type { Bytes } from "../src/bytes.ts";

test("C(i): a component's key is its number, then 30 zero bytes", () => {
  const key: string = toHex(componentKey(11));
  assert.equal(key, "0x0b" + "00".repeat(30));
});

test("C(255, s): an account's key spreads the service id out, with zeros between", () => {
  const key: string = toHex(accountKey(0x04030201));
  assert.equal(key, "0xff0100020003000400" + "00".repeat(22));
});

test("every key of a real state, named: 16 components, an account, preimages, requests", () => {
  const { entries } = traceState("fallback", 1);
  const keys: string[] = entries.map((e) => toHex(e.key));
  const named: Bytes[] = [accountKey(0)];
  for (let i = 1; i <= 16; i++) named.push(componentKey(i));
  for (const { value } of entries) {
    const key: Bytes = preimageKey(0, value);
    if (!keys.includes(toHex(key))) continue; // not a preimage of service 0
    named.push(key, requestKey(0, blake2b256(value), value.length)); // and its request
  }
  const namedHex: string[] = named.map(toHex).sort();
  const keysHex: string[] = keys.sort();
  assert.deepEqual(namedHex, keysHex);
});
```

The first two pin the byte layouts with small examples: service `0x04030201` has ℰ₄ bytes
`01 02 03 04`, so its account key reads `ff 01 00 02 00 03 00 04 00`, then zeros.

The third names every key of a real state, the one before the first block of the
`fallback` trace. It lists the 16 components and service 0's account. Then, for every
value in the state, it asks: is this value sitting exactly where a preimage of *itself*
would sit? If so, it's a preimage, and its request has to be there too. At the end, the
keys named this way and the keys in the state must be the same 21, no more, no fewer.

A stub, with every key the same: 31 zero bytes.

**New file** `src/state.ts`

```ts
// State keys (GP App. D): where in the state trie each part of the state lives.

import type { Bytes } from "./bytes.ts";

export function componentKey(i: number): Bytes {
  return new Uint8Array(31);
}

export function accountKey(s: number): Bytes {
  return new Uint8Array(31);
}

export function serviceItemKey(s: number, h: Bytes): Bytes {
  return new Uint8Array(31);
}

export function preimageKey(s: number, p: Bytes): Bytes {
  return new Uint8Array(31);
}

export function requestKey(s: number, h: Bytes, l: number): Bytes {
  return new Uint8Array(31);
}
```

**Run, expect it to fail**

```sh
npm test
```

```text
...
✖ C(i): a component's key is its number, then 30 zero bytes (1.9ms)
✖ C(255, s): an account's key spreads the service id out, with zeros between (0.2ms)
✖ every key of a real state, named: 16 components, an account, preimages, requests (3.4ms)
...
ℹ tests 63
ℹ suites 0
ℹ pass 60
ℹ fail 3
...
test at test/state.test.ts:9:1
✖ C(i): a component's key is its number, then 30 zero bytes (1.9ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected

  + '0x00000000000000000000000000000000000000000000000000000000000000'
  - '0x0b000000000000000000000000000000000000000000000000000000000000'

      at TestContext.<anonymous> (…/client/test/state.test.ts:11:10)
...
```

All three caught the stub. Component 11's key should start with its number, `0x0b`;
the stub's is all zeros, like every other key it makes.

## The code

**Replace in** `src/state.ts`

```ts
import { concatBytes } from "./bytes.ts";
import { encodeFixed } from "./codec/numbers.ts";
import { blake2b256 } from "./hash.ts";

/** C(i): the key of state component i. The byte i, then 30 zeros. */
export function componentKey(i: number): Bytes {
  const key = new Uint8Array(31);
  key[0] = i;
  return key;
}

/** C(255, s): the key of service s's account. 255, then ℰ₄(s) with a zero after each byte. */
export function accountKey(s: number): Bytes {
  const n = encodeFixed(BigInt(s), 4);
  const key = new Uint8Array(31);
  key[0] = 255;
  for (let i = 0; i < 4; i++) key[1 + 2 * i] = n[i];
  return key;
}

/** C(s, h): the key of something service s keeps. ℰ₄(s) woven into the hash of h. */
export function serviceItemKey(s: number, h: Bytes): Bytes {
  const n = encodeFixed(BigInt(s), 4);
  const a = blake2b256(h);
  const key = new Uint8Array(31);
  for (let i = 0; i < 4; i++) {
    key[2 * i] = n[i]; // the service's bytes at 0, 2, 4, 6
    key[2 * i + 1] = a[i]; // the hash's first four at 1, 3, 5, 7
  }
  key.set(a.subarray(4, 27), 8); // and 23 more of the hash after them
  return key;
}

/** Where service s keeps the preimage p: C(s, ℰ₄(2^32 − 2) ⌢ H(p)). */
export function preimageKey(s: number, p: Bytes): Bytes {
  return serviceItemKey(s, concatBytes(encodeFixed(2n ** 32n - 2n, 4), blake2b256(p)));
}

/** Where service s records its request for the preimage of hash h, l bytes long. */
export function requestKey(s: number, h: Bytes, l: number): Bytes {
  return serviceItemKey(s, concatBytes(encodeFixed(BigInt(l), 4), h));
}
```

`encodeFixed` is ℰ₄ from [lesson 2.1](../02-codec/01-fixed-width-integers.md), and `2n ** 32n - 2n` is 2^32 − 2 as a `bigint`.
`a.subarray(4, 27)` is a₄ to a₂₆: from index 4 up to, but not including, 27.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ C(i): a component's key is its number, then 30 zero bytes (0.4ms)
...
✔ every key of a real state, named: 16 components, an account, preimages, requests (17.8ms)
...
ℹ tests 63
ℹ suites 0
ℹ pass 63
ℹ fail 0
...
reported 63 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791728959119
...
```

All 21 keys, accounted for. Two of the service's entries are preimages (the
159,322-byte one is its code, as [lesson 6.1](./01-the-state-trie.md) found), and two are the requests that asked
for them.

## Watch it

`bin/state.ts` learns to read a key back: which recipe made it, and for whom.

**Rewrite** `bin/state.ts`

```ts
// Builds the trie of the state before a trace's block, shows where each entry lands and
// what it is, and checks the root against the one the block's header promises.
// Usage: npm run state <trace.json>, e.g.
//        npm run state ../vectors/traces/fallback/00000001.json

import { readFileSync } from "node:fs";
import type { Bytes } from "../src/bytes.ts";
import { fromHex, toHex } from "../src/bytes.ts";
import { decodeFixed } from "../src/codec/numbers.ts";
import { Run } from "../src/obs.ts";
import { stateRoot } from "../src/trie.ts";

/** The state's 16 components, by i in C(i), with their Gray Paper letters (GP App. D). */
const COMPONENTS = [
  "",
  "α, the authorizer pool",
  "ϕ, the authorizer queue",
  "β, recent blocks",
  "γ, Safrole's state",
  "ψ, past judgements",
  "η, entropy",
  "ι, the next validators",
  "κ, the validators",
  "λ, the previous validators",
  "ρ, reports awaiting availability",
  "τ, the time",
  "χ, privileged services",
  "π, statistics",
  "ω, reports ready to accumulate",
  "ξ, recently accumulated packages",
  "θ, the last accumulation outputs",
];

/** A service id from four bytes spread out with gaps, starting at byte `at` of a key. */
function serviceIn(key: Bytes, at: number): bigint {
  return decodeFixed(new Uint8Array([key[at], key[at + 2], key[at + 4], key[at + 6]]));
}

/** What a state key is: C(255, s), C(i) or C(s, h), read back from its bytes. */
function describe(key: Bytes): string {
  const zerosFrom = (i: number) => key.subarray(i).every((b) => b === 0);
  if (key[0] === 255 && zerosFrom(8)) return `C(255, ${serviceIn(key, 1)}): an account`;
  if (zerosFrom(1)) return `C(${key[0]}): ${COMPONENTS[key[0]]}`;
  return `C(${serviceIn(key, 0)}, h): something service ${serviceIn(key, 0)} keeps`;
}

const [file] = process.argv.slice(2);
const trace = JSON.parse(readFileSync(file, "utf8"));
const entries = trace.pre_state.keyvals.map((e: { key: string; value: string }) => ({
  key: fromHex(e.key),
  value: fromHex(e.value),
}));
const run = new Run("state");
const root = stateRoot(entries, {
  event(step, fields) {
    const { depth, key, size } = fields as { depth: number; key: Bytes; size: number };
    const name = describe(key);
    run.event(step, { ...fields, name });
    const where = `depth ${String(depth).padStart(2)}  ${String(size).padStart(6)}-byte value`;
    console.log(`${where}  ${name}`);
  },
});
const promised = trace.block.header.parent_state_root;
const matches = toHex(root) === promised;
console.log(`${entries.length} entries, state root ${toHex(root)}`);
console.log(`the header promises it: ${matches}`);
run.event("root", { root, promised, matches });
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

`describe` runs the recipes backwards. A key that's 255 and then zeros from byte 8 on is
an account, and the service id is in bytes 1, 3, 5 and 7. A key that's zeros from byte 1
on is a component. Anything else is woven, with the service id in bytes 0, 2, 4 and 6.
The account check goes *first* for a reason: service 0's account key is `0xff` and 30
zeros, which also looks like a component 255. There's no component 255, so it's the
account.

**Run**

```sh
npm run state-fallback
```

```text
...
depth  8    2017-byte value  C(8): κ, the validators
...
depth  1      89-byte value  C(255, 0): an account
...
the header promises it: true
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=state-1791728962505
```

The same 21 leaves as [lesson 6.1](./01-the-state-trie.md), now with names. The one alone at depth 1 is service
0's account. The *State trie* panel shows the names too. Then try a state a hundred
blocks on, `../vectors/traces/storage/00000100.json`: 164 entries. The same 16
components, the same account, the same two preimages and requests, and 143 new things
service 0 keeps. That's its storage, filling up block by block.

![State trie panel](./images/02-state-trie.png)

<details>
<summary>lasair: <code>make_service_key</code>, in <code>lib/state_keys.ml</code></summary>

```ocaml
let make_service_key (service_id : int) : bytes =
  let key = Bytes.make 31 '\x00' in
  Bytes.set_uint8 key 0 Prefix.service_account;
  Bytes.set_uint8 key 1 (service_id land 0xff);
  Bytes.set_uint8 key 3 ((service_id lsr 8) land 0xff);
  Bytes.set_uint8 key 5 ((service_id lsr 16) land 0xff);
  Bytes.set_uint8 key 7 ((service_id lsr 24) land 0xff);
  key
```

C(255, s), byte by byte: `land 0xff` keeps the low byte, `lsr 8` shifts the next one
down. Your `accountKey` lets `encodeFixed` split the bytes and a loop place them. lasair
has the same recipe a second time, as `state_key_from_index_service` in
`lib/merklization.ml`: two copies to keep in step, like its headers in [lesson 4.6](../04-blocks/06-the-header.md).

</details>

## Check your understanding

::: check
**In [lesson 6.1](./01-the-state-trie.md), the key `0x10` and 30 zeros sat at depth 4. What is it?**

- [ ] C(10), ρ, reports awaiting availability
  > No: `0x10` is hex, so it's 16, not 10. C(10)'s key starts `0x0a`.
- [x] C(16), θ, the last accumulation outputs
  > Yes: C(i) is the byte i, then 30 zeros, and 16 is `0x10`. Its value is θ's 1 byte,
  > just as the table says.
- [ ] Service 16's account
  > No: an account's key starts with 255, `0xff`. A key that's one byte and then zeros is
  > a component.

**What is service `0x04030201`'s account key?**

- [ ] `ff 04 03 02 01`, then 26 zeros
  > No: that's the id most significant byte first, with no gaps. ℰ₄ starts with the lowest
  > byte, and C(255, s) puts a zero after each one.
- [ ] `ff 01 02 03 04`, then 26 zeros
  > No: the bytes are in the right order, but C(255, s) puts a zero after each one.
- [x] `ff 01 00 02 00 03 00 04 00`, then 22 zeros
  > Yes: 255, then ℰ₄(s), `01 02 03 04`, with a zero after each byte. 1 + 8 + 22 = 31.

**What is the key `0xff` and 30 zeros?**

- [x] Service 0's account
  > Yes: C(255, 0) is 255, then ℰ₄(0) spread out, which is all zeros. In
  > [lesson 6.1](./01-the-state-trie.md) it sat alone at depth 1, holding 89 bytes.
- [ ] Component 255, the last part of the state
  > No: there are 16 components, C(1) to C(16). 255 starts every account key.
- [ ] An empty key, kept for an entry not filled in yet
  > No: the state has no placeholder entries. Every key holds a value; this one holds
  > service 0's 89-byte account.

**Service 0 and service `0x04030201` each keep something under the same h. How do their two keys differ?**

- [ ] Not at all: the key comes from the hash of h, and h is the same
  > No: C(s, h) weaves the service in. Without it, two services' items would land on the
  > same key.
- [x] In bytes 0, 2, 4 and 6 only: `00 00 00 00` for one, `01 02 03 04` for the other
  > Yes: the service's four bytes take turns with the hash's first four. The other 27
  > bytes come from H(h), the same for both.
- [ ] In every byte, because the service is hashed in along with h
  > No: the service isn't hashed. Its bytes go into the key as they are, which is why
  > `bin/state.ts` can read the service back out of a key.

**Why does C(s, h) hash h instead of using it as it is?**

- [x] So every key is exactly 31 bytes, whatever went in
  > Yes: a storage key can be any length. Its hash is always 32 bytes, and 27 of them fit
  > beside the service's four.
- [ ] To keep the item secret
  > No: the value sits in the state as it is, and anyone who knows h can work out the key.
  > The hash is about size.
- [ ] So that two services can't use the same h
  > No: they can, and their keys still differ, by the service bytes woven in.
:::

## What you have

A map of the state: for any key, which part of JAM it holds, and for any part of JAM,
its key. [Lesson 6.3](./03-reading-the-state.md) reads what's there: the time, the
entropy, the validators.

Next: [6.3 Reading the state](./03-reading-the-state.md)
