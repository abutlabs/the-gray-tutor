# State keys

**In one sentence:** every entry of the state sits under a 31-byte key made by one of three
recipes, so the key alone says what the entry is.

Make a few. Pick a recipe and type what goes in: each of the 31 bytes is coloured by where
it came from.

<a id="try-it"></a>

<StateKeyWeave />

## The idea

A trie needs a key for every entry. JAM could have hashed a name for each one, and every
key would look like noise. It builds keys you can read instead, like addresses.

- **The chain's own records** (the validators, the clock, the entropy: 16 in all) get a
  number each. The key is the number, then zeros. Each record is a [*state component*](../glossary.md#state-component).
- **A service's account** gets 255, then the service's id.
- **Anything a service keeps** (its code, its storage) gets the service's id, woven into
  a hash that names the thing.

So the keys of [lesson 6.1](./01-the-state-trie.md) were designed. `0x0b` and thirty
zeros is the clock. `0xff` and thirty zeros is service 0's account. Learn the three
recipes and you can find anything in the state, or look at a [*state key*](../glossary.md#state-key) and say
what it holds.

## What the Gray Paper says

Appendix D, *Serialization*:

::: gray-paper D.1 1-3

#### Appendix D.1 Serialization {#gp-D-1}

<a id="gp-D-1-p1"></a>The <abbr class="gp-term" title="turning a value into bytes, so it can be hashed, signed or sent">serialization</abbr> of state primarily involves placing all the various components of $\sigma$ into a single mapping from 31-octet sequence *state-keys* to <abbr class="gp-term" title="a byte: 8 bits">octet</abbr> sequences of indefinite length. The state-key is constructed from a hash component and a chapter component, equivalent to either the index of a state component or, in the case of the inner dictionaries of $\delta$, a service index.

<a id="gp-D-1-p2"></a>We define the state-key constructor functions $C$ as:

<a id="gp-D-1-p3"></a><a id="eq-D-1"></a>

$$
\begin{equation}
C\colon\left\{ \begin{aligned}
\mathbb{N}_{2^{8}} \cup \left(\mathbb{N}_{2^{8}}, \mathbb{N}_S\right) \cup \left(\mathbb{N}_S, \mathbb{B}_{}\right) &\to \mathbb{B}_{31} \\
i \in \mathbb{N}_{2^{8}} &\mapsto \left[i, 0, 0, \dots\right] \\
\left(i, s \in \mathbb{N}_S\right) &\mapsto \left[i, n_0, 0, n_1, 0, n_2, 0, n_3, 0, 0, \dots\right]\  \text{where } n = \mathcal{E}_{4}\left(s\right) \\
\left(s, h\right) &\mapsto \left[n_0, a_0, n_1, a_1, n_2, a_2, n_3, a_3, a_4, a_5, \dots, a_{26}\right]\  \text{where } n = \mathcal{E}_{4}\left(s\right), a = \mathcal{H}\left(h\right)
\end{aligned} \right. \tag{D.1}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-abracegroup">$\left\{ \begin{aligned}x\end{aligned} \right.$</span> | as follows | a brace grouping lines that hold together: for a function, its type on top, then what each input becomes |
| <span id="gk-Nbits">[$\mathbb{N}_{2^{x}}$](../symbols.md#naturals)</span> | N sub two to the n | the numbers that fit in n bits: ℕ_{2³²} is a u32 |
| <span id="gk-cup">$\cup$</span> | union | everything in either side |
| <span id="gk-serviceid" class="gk-wrap">$\mathbb{N}_S$</span> | N sub S | a service id: a whole number below 2³², 4 bytes |
| <span id="gk-blob">[$\mathbb{B}$](../symbols.md#blobs)</span> | B, or B sub n | bytes: any run of them; 𝔹ₙ exactly n of them |
| <span id="gk-to">[$\to$](../symbols.md#to)</span> | to | what goes in, to what comes out: A → B takes an A and gives a B |
| <span id="gk-in">[$\in$](../symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-mapsto">$\mapsto$</span> | maps to | what a function gives back for an input: x ↦ y says x becomes y |
| <span id="gk-sq">[$\left[x\right]$](../symbols.md#sequence)</span> | the sequence | a sequence written out item by item; [ ] is the empty one |
| <span id="gk-encode">[$\mathcal{E}\left(x\right)$](../symbols.md#encode)</span> | E of | the encoding of what's in the brackets: its bytes, by Appendix C's rules |
| <span id="gk-blake">$\mathcal{H}\left(x\right)$</span> | H of | the Blake2b hash of what's in the brackets: 32 bytes |

</details>

→ [(D.1) in plain words](./gray-paper.md#ex-D-1)

:::

Every key is 31 bytes, made by C, the *state-key constructor*. C is one
function with three cases, and what you hand it picks the case:

| Case | You hand it | Where it puts | The 31 bytes |
| --- | --- | --- | --- |
| C(i) | a number i, 0 to 255 | state component i | i, then 30 zeros |
| C(i, s), as C(255, s) | 255 and a service id s | service s's account | 255, then ℰ₄(s) with a zero after each byte, then zeros |
| C(s, h) | a service id s and bytes h | something service s keeps | ℰ₄(s) woven into H(h): n₀ a₀ n₁ a₁ n₂ a₂ n₃ a₃ a₄ … a₂₆ |

The middle case takes any number in the Gray Paper, but the state only ever hands it 255:
every service's account is C(255, s).

In the last row, n = ℰ₄(s) and a = H(h): the service's four bytes take turns with the
hash's first four, then 23 more bytes of the hash follow.

Try each row on [the keys at the top](#try-it). Make service `0x04030201`'s account,
then weave a different service into the same hash: only the four service bytes move.

The 16 components, C(1) to C(16), each with its Greek letter and its size in the state of
[lesson 6.1](./01-the-state-trie.md):

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

Some sizes you can already read. τ is 4 bytes: a timeslot ([lesson 0.4](../00-start/04-the-jam-clock.md)).
η is 128: four 32-byte hashes. Each validator set is 2,017: a count byte, then six
validators of 336 bytes. [Lesson 6.3](./03-reading-the-state.md) reads what is inside.

What a service keeps comes in three kinds, and each makes its h differently:

- a **preimage** p: h = ℰ₄(2^32 − 2) ⌢ H(p);
- a **request** for a preimage of hash H(p) and length l: h = ℰ₄(l) ⌢ H(p);
- a **storage** item with key k: h = ℰ₄(2^32 − 1) ⌢ k.

Hashing h makes every key 31 bytes, whatever went in. The Gray Paper adds what follows
from that:

::: gray-paper D.1 8-8

#### Appendix D.1 Serialization, continued

<a id="gp-D-1-p8"></a>Finally, be aware that JAM does not allow service storage keys to be directly inspected or enumerated. Thus the key values themselves are not required to be known by implementations, and only the Merklisation-ready serialisation is important, which is a fixed-size hash (alongside the service index and item marker). Implementations are free to use this fact in order to avoid storing the keys themselves.

:::

A client never needs a storage key back, only its hash. This lesson builds
the keys of preimages and requests. Storage keys wait for block import
([lesson 19.2](../19-block-import/02-the-whole-state.md)), which puts each service's storage into the
trie: the map [lesson 14.2](../14-services/02-the-service-account.md) reads and the `write` host call
of [lesson 16.5](../16-host-calls/05-storage.md) fills.

All three recipes together make a real state. Here is the one `npm run state-fallback` reads
in [lesson 6.1](./01-the-state-trie.md): one file, `fallback/00000001.json`, whose 21 entries the script builds into the trie
and hashes up to one root, then checks against the `parent_state_root` in the same file's
block header. Each leaf is named by its recipe. The 16 components sit together. The
account is alone on the other side, since 255 starts with a 1. Service 0's four items sit
deepest. Set τ to slot 1 and the root changes completely. Tap a branch to see the two
hashes it joins.

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

What flows through this run — two of the state's 21 entries by their keys, what `describe` makes of them, and the lines printed:

::: code-group

```json [what goes in]
{
  "pre_state": {
    "keyvals": [
      …,
      { "key": "0x08000000000000000000000000000000000000000000000000000000000000", "value": …2,017 bytes… },
      …,
      { "key": "0xff000000000000000000000000000000000000000000000000000000000000", "value": …89 bytes… },
      …21 entries in all…
    ]
  },
  "block": { "header": { "parent_state_root": …the root the state must hash to… } }
}
```

```ts [what it computes]
// bin/state.ts's values (vectors/traces/fallback/00000001.json)
const computed = {
  kappa: { first: 8, zerosAfter: 1, name: "C(8): κ, the validators" }, // a component
  account: { // checked first: it also looks like a component 255
    first: 255, zerosAfter: 8, service: 0n, name: "C(255, 0): an account",
  },
  entries: 21, // the state's keys, each named by describe
  root: "0xd6e78dc0…", // stateRoot(entries), as in lesson 6.1
  matches: true, // equal to header.parent_state_root
};
```

```text [what comes out]
depth  8    2017-byte value  C(8): κ, the validators
depth  1      89-byte value  C(255, 0): an account
the header promises it: true
```

:::

`describe` reads each key backwards: `08` and then zeros is component 8, κ; `ff` and
zeros from byte 8 is an account, service 0. The names are printed beside the depth each
key reached in the trie.

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
**How many kinds of state key are there, and what does each one address?**

- [ ] One: every key is the hash of its entry's name
  > No: only one recipe hashes anything, and even that one keeps the service's id readable.
- [x] Three: a state component, a service's account, and something a service keeps
  > Yes: C(i), C(255, s) and C(s, h). Sixteen components, one account per service, and as
  > many items as the services keep.
- [ ] Sixteen: one for each component
  > No: the 16 components share one recipe, C(i). Services' accounts and items have the
  > other two.

**You are handed a state key and nothing else. What can you tell from it?**

- [x] Its kind and its owner: which component, or which service. Not which of a service's items it is
  > Yes: a number then zeros is a component, 255 first is an account, and anything else
  > has a service's id in bytes 0, 2, 4 and 6. The rest is a hash, and a hash doesn't run
  > backwards.
- [ ] Nothing: a key is a hash
  > No: the keys are built so that their own bytes say what they are.
- [ ] Everything, down to a storage item's original key
  > No: that key went into a hash. The Gray Paper says a client need not even keep it.

**Where is a service's code in the state?**

- [ ] Inside its account, under C(255, s)
  > No: an account is 89 bytes. It holds the code's hash, not the code.
- [ ] Under a component number of its own
  > No: the components are the chain's 16 records. What a service keeps is under C(s, h).
- [x] Under C(s, h), as a preimage the service keeps; its account records the code's hash
  > Yes: h is ℰ₄(2^32 − 2) ⌢ H(code). In [lesson 6.1](./01-the-state-trie.md)'s state it
  > was the 159,322-byte value.

**Two services keep something under the same h. Do their keys collide?**

- [ ] Yes: the key comes from the hash of h, and h is the same
  > No: C(s, h) weaves the service in, so two services' items never share a key.
- [x] No: each key carries its service's id in four of its bytes
  > Yes: the service's four bytes take turns with the hash's first four. The other 27
  > bytes are the same for both.
- [ ] No: the service's id is hashed together with h
  > No: the id isn't hashed. It goes into the key as it is, which is why a key can be read
  > back to its service.

**Why does C(s, h) hash h instead of using it as it is?**

- [x] So every key is exactly 31 bytes, whatever went in
  > Yes: a storage key can be any length. Its hash is always 32 bytes, and 27 of them fit
  > beside the service's four.
- [ ] To keep the item secret
  > No: the value sits in the state as it is, and anyone who knows h can work out the key.
  > The hash is about size.
- [ ] So that two services can't use the same h
  > No: they can, and their keys still differ, by the service's bytes woven in.
:::

## What you have

A map of the state: for any key, which part of JAM it holds, and for any part of JAM,
its key. [Lesson 6.3](./03-reading-the-state.md) reads what's there: the time, the
entropy, the validators.

Next: [6.3 Reading the state](./03-reading-the-state.md)
