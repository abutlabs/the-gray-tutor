# Providing preimages

**In one sentence:** a service asks for data by its hash, and a later block hands the data
over once the chain has checked it is what was asked for.

A block at slot 8 brings data for service 0. Pick a preimage, and see whether the chain
takes it.

<a id="try-it"></a>

<ProvidePreimage />

## The idea

A JAM service can't download things. So how does it get data it needs, say a new
version of its own code?

It asks for it *by its hash and length*, and waits. That is a
[*request*](../glossary.md#request). A later block brings the data, the
[*preimage*](../glossary.md#preimage) of that hash, in its preimages extrinsic
([lesson 4.1](../04-blocks/01-tickets-and-preimages.md)). The chain hashes what came,
looks for a request under that hash and length, and hands the data over.

It works like a parcel slip. The service leaves a slip with the parcel's fingerprint on
it. Anyone may deliver, because only the right parcel matches the slip. Wrong bytes hash
differently, and find no slip at all.

Three places are involved. The asking happened on the chain, in the service's own
accumulate code ([lesson 16.9](../16-host-calls/09-asking-for-preimages.md)). The bytes
come from off the chain, in a block. The handover is on the chain again, on every
validator. This lesson is the handover.

## What the Gray Paper says

::: gray-paper 12.4

#### §12.4 Preimage Integration {#gp-12-4}

<a id="gp-12-4-p1"></a>After accumulation, we must integrate all preimages provided in the lookup extrinsic to arrive at the <abbr class="gp-term" title="after the change: the value once it is made, written with a prime (α′); for state, after the block">posterior</abbr> account state. The lookup extrinsic is a sequence of pairs of service indices and data. These pairs must be ordered and without duplicates (equation [12.35](#eq-12-35) requires this). The data must have been solicited by a service but not yet provided in the *prior* state. Formally:

<a id="gp-12-4-p2"></a><a id="eq-12-34"></a><a id="eq-12-35"></a><a id="eq-12-36"></a>

$$
\begin{align}
\mathbf{E}_P &\in \left[\!\left[\!\left\lgroup \mathbb{N}_S,\, \mathbb{B}_{} \right\rgroup\!\right]\!\right]_{} \tag{12.34} \\
\mathbf{E}_P &= \left[i \in \mathbf{E}_P\,\wr\!\wr\,i\right] \tag{12.35} \\
\forall \left(s, \mathbf{d}\right) &\in \mathbf{E}_P : Y(\delta, s, \mathbf{d}) \tag{12.36}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-xtpreimages" class="gk-wrap">$\mathbf{E}_P$</span> | E sub P | the preimages bag: data a service asked for |
| <span id="gk-in">[$\in$](../symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-sequence">[$\left[\!\left[x\right]\!\right]$](../symbols.md#sequence)</span> | a sequence of | ⟦T⟧ is an array of T; a subscript is its length, :n at most n, n: at least n |
| <span id="gk-tuple">$\!\left\lgroup x\right\rgroup\!$</span> | the tuple of | a record: named fields, each with its type, like an object in JSON |
| <span id="gk-serviceid" class="gk-wrap">$\mathbb{N}_S$</span> | N sub S | a service id: a whole number below 2³², 4 bytes |
| <span id="gk-blob">[$\mathbb{B}$](../symbols.md#blobs)</span> | B, or B sub n | bytes: any run of them; 𝔹ₙ exactly n of them |
| <span id="gk-sqorderuniqby">$\left[y\,\wr\!\wr\,x\right]$</span> | sorted, no repeats, by | sorted by the key on the right, each key once |
| <span id="gk-forall">$\forall$</span> | for all | for every value: ∀c ∈ ℕ_C means for each core c |
| <span id="gk-xp-serviceindex">$s$</span> | s | a preimage's service: the id of the service that asked for it, 4 bytes |
| <span id="gk-xp-data" class="gk-wrap">$\mathbf{d}$</span> | d | a preimage's data: the bytes themselves |
| <span id="gk-local-fnprovidable">$Y$</span> | Y | is this blob still wanted? true if the service exists and its request for the blob's hash and length is [ ]: asked, not yet given |
| <span id="gk-accountspre" class="gk-wrap">$\delta$</span> | delta | the service accounts before the block |

</details>

→ [(12.34), (12.35), (12.36) in plain words](./gray-paper.md#ex-12-34)

<a id="gp-12-4-p3"></a>We disregard, without prejudice, any preimages which due to the effects of accumulation are no longer useful. We define $\delta'$ as the state after the integration of the still-relevant preimages:

<a id="gp-12-4-p4"></a><a id="eq-12-37"></a>

$$
\begin{equation}
\delta' = I(\delta^\ddagger, \mathbf{E}_P) \tag{12.37}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-accountspostpreimage" class="gk-wrap">$\delta'$</span> | delta prime | the service accounts after the block, the preimages provided included |
| <span id="gk-local-fnprovide">$I$</span> | I | preimage integration: files each provided blob in its service, if that service still waits for it |
| <span id="gk-accountspostxfer" class="gk-wrap">$\delta^\ddagger$</span> | delta double dagger | the service accounts midway: after accumulation |

</details>

→ [(12.37) in plain words](./gray-paper.md#ex-12-37)

:::

After accumulation, each preimage in the block is handed to the service that asked for
it. Two checks come first, on the state *before* the block:

- **Y, "providable"**: a preimage (s, data) is welcome if service s has a request for
  (H(data), length) whose history is `[]`, still waiting.
- **Sorted, no repeats**: the block lists its preimages by service, then by the data's
  bytes, each once.

Then **I, "provide"**: for each welcome preimage, the data is stored under
`preimageKey(s, data)` ([lesson 6.2](../06-state-and-merklization/02-state-keys.md)), and
the request's history becomes `[τ′]`, the slot of this block. A preimage that
accumulation made unneeded in this same block is skipped, not refused. That is the
"disregard, without prejudice".

Where do requests live? Beside the preimages, in the service's account:

::: gray-paper 9.2 9-9

#### §9.2 Preimage Lookups, continued

<a id="gp-9-2-p9"></a>The preimage lookup for some service of index $s$ is denoted $\delta\left[s\right]_{\mathbf{p}}$ is a dictionary mapping a hash to its corresponding preimage. Additionally, there is metadata associated with the lookup denoted $\delta\left[s\right]_{\mathbf{l}}$ which is a dictionary mapping some hash and presupposed length into historical information.

:::

::: gray-paper 9.2.1

#### §9.2.1 Invariants {#gp-9-2-1}

<a id="gp-9-2-1-p1"></a>The state of the lookup system naturally satisfies a number of invariants. Firstly, any preimage value must correspond to its hash, equation [9.6](#eq-9-6). Secondly, a preimage value being in state implies that its hash and length pair has some associated status, also in equation [9.6](#eq-9-6). Formally:

<a id="gp-9-2-1-p2"></a><a id="eq-9-6"></a>

$$
\begin{equation}
\forall \mathbf{a} \in \mathbb{A}, \left(h \mapsto \mathbf{d}\right) \in \mathbf{a}_{\mathbf{p}} \Rightarrow
h = \mathcal{H}\left(\mathbf{d}\right)\wedge
\left(h , \left\vert\mathbf{d}\right\vert\right) \in \mathcal{K}\left(\mathbf{a}_{\mathbf{l}}\right) \tag{9.6}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-serviceaccount" class="gk-wrap">$\mathbb{A}$</span> | A | a service account: three dictionaries (storage, preimages, requests) and eight plain fields |
| <span id="gk-kv">$\left(x \mapsto y\right)$</span> | k maps to v | a dictionary entry: key k, value v |
| <span id="gk-sa-preimages" class="gk-wrap">$\mathbf{p}$</span> | p | an account's preimages: each a blob filed under its own 32-byte hash |
| <span id="gk-Rightarrow">$\Rightarrow$</span> | implies | if the left holds, the right must hold too |
| <span id="gk-blake">$\mathcal{H}\left(x\right)$</span> | H of | the Blake2b hash of what's in the brackets: 32 bytes |
| <span id="gk-wedge">$\wedge$</span> | and | both sides are true |
| <span id="gk-len">$\left\vert x\right\vert$</span> | the size of | \|x\|: how many items x has, or how many bytes |
| <span id="gk-keys">$\mathcal{K}\left(x\right)$</span> | K of | a dictionary's keys |
| <span id="gk-sa-requests" class="gk-wrap">$\mathbf{l}$</span> | l | an account's requests: for each (hash, length) asked for, a history of up to 3 slots |

</details>

→ [(9.6) in plain words](./gray-paper.md#ex-9-6)

:::

::: gray-paper 9.2.2 1-2

#### §9.2.2 Semantics {#gp-9-2-2}

<a id="gp-9-2-2-p1"></a>The historical status component $h \in \left[\!\left[\mathbb{N}_T\right]\!\right]_{:3}$ is a sequence of up to three time slots and the <abbr class="gp-term" title="how many items a set has">cardinality</abbr> of this sequence implies one of four modes:

<a id="gp-9-2-2-p2"></a>

- $h = \left[\!\left[\right]\!\right]_{}$: The preimage is *requested*, but has not yet been supplied.
- $h \in \left[\!\left[\mathbb{N}_T\right]\!\right]_{1}$: The preimage is *available* and has been from time $h_0$.
- $h \in \left[\!\left[\mathbb{N}_T\right]\!\right]_{2}$: The previously available preimage is now *unavailable* since time $h_1$. It had been available from time $h_0$.
- $h \in \left[\!\left[\mathbb{N}_T\right]\!\right]_{3}$: The preimage is *available* and has been from time $h_2$. It had previously been available from time $h_0$ until time $h_1$.

:::

Every piece of data a service has asked for has a request, under
[lesson 6.2](../06-state-and-merklization/02-state-keys.md)'s `requestKey(s, H(data), length)`.
Its value is a short *history*, the slots of its life so far:

| History | Means |
| --- | --- |
| `[]` | asked for, still waiting |
| `[x]` | provided at slot x |
| `[x, y]` | provided at x, forgotten at y |
| `[x, y, z]` | available again from z, after being available from x until y |

And the invariant: every stored preimage sits under its own hash, and has a request for
its hash and length. The data proves itself: its hash is in the key, so nobody can provide the wrong thing.

Try it on [the block at the top](#try-it). Four of its preimages are waited for, and
their histories go from `[]` to `[8]`. Two are skipped: one already provided, one never
asked for.

### What the history is for

Why keep a history at all, and not just "have it" or "don't"? Because of refine, which
runs off the chain, on a core, where there is no state everyone agrees on:

::: gray-paper 9.2 3-8

#### §9.2 Preimage Lookups, continued

<a id="gp-9-2-p3"></a>We begin by reformulating the portion of state concerning our data-lookup system. The purpose of this system is to provide a means of storing static data on-chain such that it may later be made available within the execution of any service code as a function accepting only the hash of the data and its length in <abbr class="gp-term" title="bytes: 8 bits each">octets</abbr>.

<a id="gp-9-2-p4"></a>During the on-chain execution of the *Accumulate* function, this is trivial to achieve since there is inherently a state which all validators verifying the block necessarily have complete knowledge of, i.e.  $\sigma$. However, for the <abbr class="gp-term" title="done by a core's guarantors, off the chain; the chain only sees the result">in-core</abbr> execution of *Refine*, there is no such state inherently available to all validators; we thus name a historical state, the *lookup anchor* which must be considered recently <abbr class="gp-term" title="voted final by GRANDPA: never undone">finalized</abbr> before the work's implications may be accumulated hence providing this guarantee.

<a id="gp-9-2-p5"></a>By retaining historical information on its availability, we become confident that any validator with a recently finalized view of the chain is able to determine whether any given preimage was available at any time within the period where auditing may occur. This ensures confidence that judgments will be deterministic even without consensus on chain state.

<a id="gp-9-2-p6"></a>Restated, we must be able to define some *historical* lookup function $\Lambda$ which determines whether the preimage of some hash was available for lookup by some service account at some timeslot, and if so, provide it:

<a id="gp-9-2-p7"></a><a id="eq-9-5"></a>

$$
\begin{equation}
\begin{aligned}
\Lambda\colon \left\{ \ \begin{aligned}
\!\left\lgroup\mathbb{A}, \mathbb{N}_{(\mathbf{H}_{T} - \mathsf{D}) \dots \mathbf{H}_{T}}, \mathbb{H}_{}\right\rgroup\! &\to \mathbb{B}_{}\boldsymbol{?} \\
(\mathbf{a}, t, \mathcal{H}\left(\mathbf{p}\right)) &\mapsto v : v \in \left\{\, \mathbf{p}, \emptyset \,\right\}
\end{aligned} \right.
\end{aligned} \tag{9.5}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-histlookup" class="gk-wrap">$\Lambda$</span> | lambda (capital) | the historical lookup: the preimage with hash h if the account had it at slot t, else ∅ |
| <span id="gk-abracegroup">$\left\{ \begin{aligned}x\end{aligned} \right.$</span> | as follows | a brace grouping lines that hold together: for a function, its type on top, then what each input becomes |
| <span id="gk-Nmax">[$\mathbb{N}_{x}$](../symbols.md#naturals)</span> | N sub n | the whole numbers below n: ℕ_C is a core index, 0 to C − 1 |
| <span id="gk-H" class="gk-wrap">$\mathbf{H}$</span> | H | this block's header; 𝐇_T is its timeslot, 𝐇_P its parent's hash |
| <span id="gk--timeslot">$T$</span> | T | a header's timeslot: 𝐇_T is the slot this block was made for |
| <span id="gk-Cexpungeperiod" class="gk-wrap">$\mathsf{D}$</span> | D | the expunge period: slots a forgotten preimage is kept before it may go, 19,200 on full, 32 on tiny |
| <span id="gk-hash">$\mathbb{H}$</span> | H | a 32-byte value, usually a hash |
| <span id="gk-to">[$\to$](../symbols.md#to)</span> | to | what goes in, to what comes out: A → B takes an A and gives a B |
| <span id="gk-optional">$x\boldsymbol{?}$</span> | or nothing | a value of this type, or ∅ (null) |
| <span id="gk-mapsto">$\mapsto$</span> | maps to | what a function gives back for an input: x ↦ y says x becomes y |
| <span id="gk-set">$\left\{\,x\,\right\}$</span> | the set of | a set: values with no order and no repeats |
| <span id="gk-none" class="gk-wrap">$\emptyset$</span> | nothing | ∅: no value at all, like null |

</details>

→ [(9.5) in plain words](./gray-paper.md#ex-9-5)

<a id="gp-9-2-p8"></a>This function is defined shortly below in equation [9.7](#eq-9-7).

:::

::: gray-paper 9.2.2 3-4

#### §9.2.2 Semantics, continued

<a id="gp-9-2-2-p3"></a>The <abbr class="gp-term" title="reading a service's preimage as it was at a past slot">historical lookup</abbr> function $\Lambda$ may now be defined as:

<a id="gp-9-2-2-p4"></a><a id="eq-9-7"></a>

$$
\begin{equation}
\begin{aligned}
&\Lambda\colon \!\left\lgroup\mathbb{A}, \mathbb{N}_T, \mathbb{H}_{}\right\rgroup\! \to \mathbb{B}_{}\boldsymbol{?} \\
&\Lambda(\mathbf{a}, t, h) \equiv \begin{cases}
\mathbf{a}_{\mathbf{p}}\left[h\right]\!\!\!\! &\text{if } h \in \mathcal{K}\left(\mathbf{a}_{\mathbf{p}}\right) \wedge I(\mathbf{a}_{\mathbf{l}}\left[h, \left\vert\mathbf{a}_{\mathbf{p}}\left[h\right]\right\vert\right], t) \!\!\!\!\! \\
\emptyset &\text{otherwise}
\end{cases}\\
& \text{where } I(\mathbf{l}, t) = \begin{cases}
\bot &\text{if } \left[\right] = \mathbf{l} \\
x \le t &\text{if } \left[x\right] = \mathbf{l} \\
x \le t < y &\text{if } \left[x, y\right] = \mathbf{l} \\
x \le t < y \vee z \le t &\text{if } \left[x, y, z\right] = \mathbf{l} \\
\end{cases}
\end{aligned} \tag{9.7}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-timeslot" class="gk-wrap">$\mathbb{N}_T$</span> | N sub T | a timeslot: a u32 counting 6-second slots |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-subb">[$\left[x\right]$](../symbols.md#sequence)</span> | at | x[i]: the item at index i, or the value at key i |
| <span id="gk-bot">$\bot$</span> | bottom | false, the no of a yes-or-no value |
| <span id="gk-le">$\le$</span> | at most | less than or equal to |
| <span id="gk-vee">$\vee$</span> | or | at least one side is true |

</details>

→ [(9.7) in plain words](./gray-paper.md#ex-9-7)

:::

Λ asks "did this service have the preimage with hash h at slot t?", and reads the answer
off the request's history. `[]` is never. `[x]` is from x on. `[x, y]` is from x until
just before y. `[x, y, z]` is that, or from z on.

A guarantor running refine and an auditor checking it weeks later both ask Λ about the
same slot, the lookup anchor's. They get the same bytes, even though the state has moved
on in between. That is why a forgotten preimage isn't deleted at once: it waits out D
slots (32 on tiny, 19,200 on full), so that a lookup in that window still has its
answer.

Your client doesn't build Λ. Only refine's `historical_lookup` host call uses it, and your
client never runs refine ([Part 16](../16-host-calls/index.md) lists it among the calls
not built). The history it reads is what this lesson writes.

## The tests

Two readers first, beside the other vector helpers. A preimages vector writes each
account's preimages and requests as lists. Your client keeps them as state entries, under
[lesson 6.2](../06-state-and-merklization/02-state-keys.md)'s keys. The tests read them,
and so will the scoreboard at the end of this lesson.

**Add to** `test/vectors.ts`

```ts
import { encode } from "../src/codec/codec.ts";
import { RequestHistory } from "../src/services.ts";
import { preimageKey, requestKey } from "../src/state.ts";
import type { KeyValue } from "../src/trie.ts";
import { toHex } from "../src/bytes.ts";

/** A preimages vector's account, the way the vector writes it. */
export type PreimagesAccount = {
  id: number;
  data: {
    preimage_blobs: { blob: string }[];
    preimage_requests: { key: { hash: string; length: number }; value: number[] }[];
  };
};

/** Accounts as state entries: every preimage and every request, under its key, sorted. */
export function accountEntries(accounts: PreimagesAccount[]): KeyValue[] {
  const entries = accounts.flatMap(({ id, data }) => [
    ...data.preimage_blobs.map(({ blob }) => ({
      key: preimageKey(id, fromHex(blob)),
      value: fromHex(blob),
    })),
    ...data.preimage_requests.map(({ key, value }) => ({
      key: requestKey(id, fromHex(key.hash), key.length),
      value: encode(RequestHistory, value),
    })),
  ]);
  return entries.sort((a, b) => toHex(a.key).localeCompare(toHex(b.key)));
}
```

**New file** `test/services.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { Block, Preimage } from "../src/block.ts";
import { toHex } from "../src/bytes.ts";
import { encode } from "../src/codec/codec.ts";
import { TINY } from "../src/config.ts";
import { blake2b256 } from "../src/hash.ts";
import { providePreimages, RequestHistory } from "../src/services.ts";
import { preimageKey, requestKey } from "../src/state.ts";
import type { KeyValue } from "../src/trie.ts";
import { accountEntries, traceState, vectorFiles, vectorJson } from "./vectors.ts";
import type { PreimagesAccount } from "./vectors.ts";
import type { Bytes } from "../src/bytes.ts";

test("a request's history: [] waiting, [x] provided at slot x", () => {
  const waiting: string = toHex(encode(RequestHistory, []));
  assert.equal(waiting, "0x00");
  const provided: string = toHex(encode(RequestHistory, [5]));
  assert.equal(provided, "0x0105000000");
});

/** The value under a key in a state's entries, as hex, or undefined. */
function valueAt(entries: KeyValue[], key: Uint8Array): string | undefined {
  const entry = entries.find((e) => toHex(e.key) === toHex(key));
  return entry && toHex(entry.value);
}

test("67 real preimages: stored, and their requests marked with the block's slot", () => {
  let provided = 0;
  for (let n = 1; n < 100; n++) {
    const { entries, block } = traceState("preimages", n);
    const { header, extrinsic } = Block(TINY).fromJson(block);
    if (extrinsic.preimages.length === 0) continue;
    const after: KeyValue[] = providePreimages(entries, extrinsic.preimages, header.slot);
    const expected: KeyValue[] = traceState("preimages", n + 1).entries; // after block n
    for (const { requester, blob } of extrinsic.preimages) {
      const request: Bytes = requestKey(requester, blake2b256(blob), blob.length);
      const requestAfter: string | undefined = valueAt(after, request);
      const requestExpected: string | undefined = valueAt(expected, request);
      assert.equal(requestAfter, requestExpected, `block ${n}`);
      const stored: Bytes = preimageKey(requester, blob);
      const storedAfter: string | undefined = valueAt(after, stored);
      const storedExpected: string | undefined = valueAt(expected, stored);
      assert.equal(storedAfter, storedExpected, `block ${n}`);
      provided++;
    }
  }
  assert.equal(provided, 67); // blocks 1 to 99: each needs the next block's state to compare
});

test("the preimages vectors, as state entries", () => {
  let accepted = 0;
  for (const size of ["tiny", "full"]) {
    for (const name of vectorFiles(`stf/preimages/${size}`)) {
      const { input, pre_state, post_state, output } = vectorJson(name) as {
        input: { preimages: unknown[]; slot: number };
        pre_state: { accounts: PreimagesAccount[] };
        post_state: { accounts: PreimagesAccount[] };
        output: { err?: string };
      };
      if (output.err) continue; // a rejected block changes nothing
      const preimages: Preimage[] = input.preimages.map((p) => Preimage.fromJson(p));
      const before: KeyValue[] = accountEntries(pre_state.accounts);
      const after: KeyValue[] = providePreimages(before, preimages, input.slot);
      const sorted: KeyValue[] = after.sort((a, b) => toHex(a.key).localeCompare(toHex(b.key)));
      const expected: KeyValue[] = accountEntries(post_state.accounts);
      assert.deepEqual(sorted, expected, name);
      accepted++;
    }
  }
  assert.equal(accepted, 6); // 3 at each size
});
```

The second test is the big one: every preimage in blocks 1 to 99 of the `preimages`
trace, 67 of them, provided to real state, and compared with the state the chain
actually had after each block. (Block 100 has one more, but no next state in the trace
to compare against.) The third test turns the `preimages` vectors' accounts into state
entries with `accountEntries`, so the same `providePreimages` runs on both.

A stub that provides nothing. `RequestHistory` is real already, since the first test
checks its bytes, and the imports are the ones the real code will need:

**New file** `src/services.ts`

```ts
// Services and their preimages (GP §9, §12): a service asks for some data by its hash and
// length, and a later block provides it.

import type { Preimage } from "./block.ts";
import { toHex } from "./bytes.ts";
import { decode, encode, seq, u32 } from "./codec/codec.ts";
import { blake2b256 } from "./hash.ts";
import { preimageKey, requestKey } from "./state.ts";
import type { KeyValue } from "./trie.ts";

/**
 * A request's history (GP §9), the slots of its life so far: [] asked for, [x] provided
 * at x, [x, y] forgotten at y, [x, y, z] asked for again at z.
 */
export const RequestHistory = seq(u32);

export function providePreimages(
  entries: KeyValue[],
  preimages: Preimage[],
  slot: number, // τ′
): KeyValue[] {
  return entries;
}
```

**Run, expect it to fail**

```sh
npm test
```

```text
...
✔ a request's history: [] waiting, [x] provided at slot x (1.2ms)
✖ 67 real preimages: stored, and their requests marked with the block's slot (37.4ms)
✖ the preimages vectors, as state entries (18.1ms)
...
ℹ tests 393
ℹ suites 0
ℹ pass 391
ℹ fail 2
...
test at test/services.test.ts:28:1
✖ 67 real preimages: stored, and their requests marked with the block's slot (37.4ms)
  AssertionError [ERR_ASSERTION]: block 8
  + actual - expected

  + '0x00'
  - '0x0108000000'
...
```

The history test is green: `RequestHistory` is real. The other two are red, and the
first diff reads well once you know the codec. At block 8 the chain wrote `0x0108000000`,
a list of one slot, `[8]`:

```text
01            the list's length, 1 (a compact natural)
08 00 00 00   slot 8, as a u32: 4 bytes
```

Your stub left `0x00`, the empty list, `[]`: the request is still waiting. (The first
test's `0x0105000000` is the same shape: `[5]`.)

## The code

**Replace in** `src/services.ts`

```ts
/**
 * I (GP §12): give each preimage to the service that asked for it, if it's still waiting
 * (Y, "providable"): store the data, and mark the request provided at this slot.
 */
export function providePreimages(
  entries: KeyValue[],
  preimages: Preimage[],
  slot: number, // τ′
): KeyValue[] {
  const state = new Map(entries.map((entry) => [toHex(entry.key), entry]));
  for (const { requester, blob } of preimages) {
    const request = requestKey(requester, blake2b256(blob), blob.length);
    const history = state.get(toHex(request));
    if (history === undefined) continue; // never asked for
    if (decode(RequestHistory, history.value).length !== 0) continue; // not waiting now
    state.set(toHex(request), { key: request, value: encode(RequestHistory, [slot]) });
    const key = preimageKey(requester, blob);
    state.set(toHex(key), { key, value: blob });
  }
  return [...state.values()];
}
```

`providePreimages` works on the state itself,
[Part 6](../06-state-and-merklization/index.md)'s key-value entries, using its key
recipes. A [*`Map`*](../glossary.md#map), JavaScript's lookup table, finds entries
quickly by their key in hex. A request that doesn't exist, or isn't waiting, is skipped:

```ts
    if (history === undefined) continue; // never asked for
    if (decode(RequestHistory, history.value).length !== 0) continue; // not waiting now
```

> [!NOTE]
> **The simple road.** Skipping is right only for a preimage that accumulation made
> unneeded in this same block. The Gray Paper makes a block invalid if it carries a
> preimage nobody is waiting for, or if its preimages aren't sorted by service, then
> data, with no repeats. Five vectors at each size break those rules (both
> `preimage_not_needed` and three of the four `preimages_order_check`), and the test
> above skips refused vectors, so your client never meets them. The [hardening
> pass](https://github.com/abutlabs/the-gray-tutor/blob/main/HARDENING.md) adds the refusals.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ the reported packages: each one's hash and exports root, sorted by hash (211.7ms)
...
✔ a request's history: [] waiting, [x] provided at slot x (0.7ms)
✔ 67 real preimages: stored, and their requests marked with the block's slot (295.3ms)
✔ the preimages vectors, as state entries (19.8ms)
...
ℹ tests 393
ℹ suites 0
ℹ pass 393
ℹ fail 0
...
reported 393 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791736048893
...
```

## Watch it

**New file** `bin/preimages.ts`

```ts
// Provides the preimages of a trace's block to the services that asked for them, and shows
// each request's history before and after.
// Usage: npm run preimages <trace.json>, e.g.
//        npm run preimages ../vectors/traces/preimages/00000008.json

import { readFileSync } from "node:fs";
import { Block } from "../src/block.ts";
import type { Bytes } from "../src/bytes.ts";
import { fromHex, toHex } from "../src/bytes.ts";
import { decode } from "../src/codec/codec.ts";
import { TINY } from "../src/config.ts";
import { blake2b256 } from "../src/hash.ts";
import { Run } from "../src/obs.ts";
import { providePreimages, RequestHistory } from "../src/services.ts";
import { requestKey } from "../src/state.ts";
import type { KeyValue } from "../src/trie.ts";

const [file] = process.argv.slice(2);
const trace = JSON.parse(readFileSync(file, "utf8"));
const entries: KeyValue[] = trace.pre_state.keyvals.map((e: { key: string; value: string }) => ({
  key: fromHex(e.key),
  value: fromHex(e.value),
}));
const { header, extrinsic } = Block(TINY).fromJson(trace.block);
const after = providePreimages(entries, extrinsic.preimages, header.slot);

/** A request's history in a state, as a list of slots, or "none" if there's no request. */
function history(state: KeyValue[], key: Bytes): string {
  const entry = state.find((e) => toHex(e.key) === toHex(key));
  return entry ? `[${decode(RequestHistory, entry.value).join(", ")}]` : "none";
}

const run = new Run("preimages");
console.log(`block at slot ${header.slot}: ${extrinsic.preimages.length} preimages`);
for (const { requester, blob } of extrinsic.preimages) {
  const hash = blake2b256(blob);
  const request = requestKey(requester, hash, blob.length);
  const [was, now] = [history(entries, request), history(after, request)];
  const what = `${blob.length} bytes, hash ${toHex(hash).slice(0, 10)}…`;
  console.log(`service ${requester}: ${what}  request ${was} → ${now}`);
  run.event("provided", { service: requester, bytes: blob.length, hash, was, now });
}
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

**What flows through it.** One run, three faces: the trace's block going in, what the
program makes of each preimage, and the lines it prints. Here they are for the block's
3-byte preimage. Tab across them:

::: code-group

```json [what goes in]
{
  "header": { "slot": 8 },
  "extrinsic": { "preimages": [
    { "requester": 0, "blob": "0x06cf2d8f02…" },
    { "requester": 0, "blob": "0xaef804" },
    … two more blobs, 84 and 223 bytes, every requester 0 …
  ] }
}
```

```ts [what it computes]
// bin/preimages.ts's values for the 3-byte preimage, once hashed and looked up
const computed = {
  service: 0, // requester: the service that asked for these bytes
  bytes: 3, // the blob's length: 0xaef804, shown whole above
  hash: "0xd0c7d4d8…", // blake2b256 of the blob; hash and length name the request
  was: "[]", // the request's history before: asked for, never provided
  now: "[8]", // after: provided at this block's slot
};
```

```text [what comes out]
block at slot 8: 4 preimages
service 0: 3 bytes, hash 0xd0c7d4d8…  request [] → [8]
```

:::

Read the input into the output. `requester` names the service, and the `blob` is the
data itself: the 3-byte one is `0xaef804` in full. The program hashes each blob with
Blake2b, finds the request filed under that service, hash and length, and prints its
history stepping from `[]`, asked for, to `[8]`, provided at the block's slot.

**Run**

```sh
npm pkg set scripts.preimages="node bin/preimages.ts"
npm pkg set scripts.preimages-trace="node bin/preimages.ts ../vectors/traces/preimages/00000008.json"
npm run preimages-trace
```

```text
block at slot 8: 4 preimages
service 0: 143 bytes, hash 0x6ae18b8b…  request [] → [8]
service 0: 3 bytes, hash 0xd0c7d4d8…  request [] → [8]
service 0: 84 bytes, hash 0x70e9dc78…  request [] → [8]
service 0: 223 bytes, hash 0x35c3078c…  request [] → [8]
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=preimages-1791736053778
```

Four pieces of data that service 0 was waiting for, from 3 bytes to 223, each one's
request history going from `[]` to `[8]`. Block 14 has ten. The *Preimages* panel, on the
**5 · Services** dashboard, lists every handover.

![Preimages panel](./images/01-preimages.png)

## The scoreboard

The preimages family runs whole too, and it's the honest kind of milestone: the board
shows what your client can't do yet, as well as what it can.

**Add to** `test/families.ts`

```ts
import { Preimage } from "../src/block.ts";
import { providePreimages } from "../src/services.ts";
import { accountEntries } from "./vectors.ts";
import type { PreimagesAccount } from "./vectors.ts";

type PreimagesInput = { preimages: unknown[]; slot: number };
type PreimagesState = { accounts: PreimagesAccount[]; statistics: unknown[] };

/** A preimages vector: δ′, each preimage stored and its request marked. Your client
 * refuses no preimages (the simple road above), so it accepts every block. */
function checkPreimages(name: string) {
  const vector = vectorJson(name) as StfVector<PreimagesInput, PreimagesState>;
  const { input, pre_state } = vector;
  sameError(null, vector);
  const preimages = input.preimages.map((p) => Preimage.fromJson(p));
  const after = providePreimages(accountEntries(pre_state.accounts), preimages, input.slot);
  const sorted = after.sort((a, b) => toHex(a.key).localeCompare(toHex(b.key)));
  assert.deepEqual(sorted, accountEntries(vector.post_state.accounts), "accounts differs");
  unchanged(vector, ["accounts"]);
}
```

**Replace in** `test/families.ts`

```ts
/** Every family your client runs so far. */
export const FAMILIES: Family[] = [
  { folders: ["codec/tiny", "codec/full"], check: checkCodec },
  { folders: ["trie"], check: checkTrie },
  { folders: ["shuffle"], check: checkShuffle },
  { folders: ["stf/safrole/tiny", "stf/safrole/full"], check: checkSafrole },
  { folders: ["stf/history/tiny", "stf/history/full"], check: checkHistory },
  { folders: ["stf/disputes/tiny", "stf/disputes/full"], check: checkDisputes },
  { folders: ["stf/assurances/tiny", "stf/assurances/full"], check: checkAssurances },
  { folders: ["stf/reports/tiny", "stf/reports/full"], check: checkReports },
  { folders: ["stf/authorizations/tiny", "stf/authorizations/full"], check: checkAuthorizations },
  { folders: ["stf/preimages/tiny", "stf/preimages/full"], check: checkPreimages },
];
```

Here is a vector from the `stf/preimages` family, whose first rows the scoreboard now counts:

::: code-group

```json [what goes in]
{
  "vector": "vectors/stf/preimages/tiny/preimage_needed-2.json",
  "input": {
    "slot": 43,
    "preimages": [
      {
        "requester": 3,
        "blob": "0x92cdf578c470… (46 bytes)"
      }
    ]
  },
  "pre_state request": {
    "hash": "0x9e0e7d324d129dfbd86462546e6c3aaa533bb6f2079c639f85943c95a53a70a9",
    "length": 46,
    "value": []
  },
  "post_state request": {
    "hash": "0x9e0e7d324d129dfbd86462546e6c3aaa533bb6f2079c639f85943c95a53a70a9",
    "length": 46,
    "value": [
      43
    ]
  },
  "output": {
    "ok": null
  }
}
```

```text [console]
stf/preimages             2 of 16
238 of 1,428 vectors pass.
```

:::

*Run whole* means the block's one preimage is checked against the request waiting for it, and the request's history must move from `[]` to `[43]`, the slot it was provided in. Only 2 of the family's 16 pass at this point. The console row says so, and the failing ones, listed under it in the full output, are about statistics and an unneeded preimage.

**Run**

```sh
npm run typecheck
npm run scoreboard
```

```text
...
The official test vectors, each run whole by your client:

codec                    30 of 30  ✔
erasure                  not run yet (12)
shuffle                    1 of 1  ✔
stf/accumulate           not run yet (126)
stf/assurances           22 of 22  ✔
stf/authorizations         6 of 6  ✔
stf/disputes             60 of 60  ✔
stf/history                8 of 8  ✔
stf/preimages             2 of 16
    ✘ stf/preimages/full/preimage_needed-2.json: statistics changed
    ✘ stf/preimages/full/preimage_not_needed-1.json: accepted, not preimage_unneeded
    ✘ stf/preimages/full/preimage_not_needed-2.json: accepted, not preimage_unneeded
    … and 11 more
stf/reports              62 of 92
    ✘ stf/reports/full/big_work_report_output-1.json: cores_statistics changed
    ✘ stf/reports/full/different_core_same_guarantors-1.json: cores_statistics changed
    ✘ stf/reports/full/high_work_report_gas-1.json: cores_statistics changed
    … and 27 more
stf/safrole              46 of 46  ✔
stf/statistics           not run yet (8)
traces/fallback          not run yet (100)
traces/fuzzy             not run yet (200)
traces/fuzzy_light       not run yet (200)
traces/preimages         not run yet (100)
traces/preimages_light   not run yet (100)
traces/safrole           not run yet (100)
traces/storage           not run yet (100)
traces/storage_light     not run yet (100)
trie                       1 of 1  ✔

238 of 1,428 vectors pass.
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=scoreboard-1791939482202
```

2 of 16, and the board says why for the rest. Ten are blocks the vectors refuse,
`preimage_unneeded` and `preimages_not_sorted_unique`, which your client accepts: the
simple road the note above took, and the [hardening
pass](https://github.com/abutlabs/the-gray-tutor/blob/main/HARDENING.md) adds the refusals.
Those ten stay red on your board until you take it. The other four store their preimages
exactly as the vectors do. Then the vectors' service statistics count them,
`statistics changed`. [Lesson 18.2](../18-statistics/02-what-cores-and-services-did.md)
keeps those, and they cross the line there.

> [!TIP] Milestone
> **Preimages on the board.** Every preimage a vector accepts is stored and its
> request marked exactly as the vector says; the board names the two things still to do.

<details>
<summary>lasair: <code>integrate_preimage</code>, in <code>conformance/services.ml</code></summary>

```ocaml
let integrate_preimage (db : Lasair.State_db.t) (slot : int)
    (service_id : int) (blob : bytes) : Lasair.State_db.t =
  let h = hash_bytes blob in
  let rkey = make_request_state_key service_id h (Bytes.length blob) in
  match Lasair.State_db.get db rkey with
  | Some v when decode_request_value v = [] ->
    let db = Lasair.State_db.set db (make_preimage_state_key service_id h) blob in
    Lasair.State_db.set db rkey (encode_request_value [slot])
  | _ -> db
```

Line for line, your loop body: find the request by its key, check its history is
`[]`, store the data, write `[slot]`. lasair also works on its state store directly,
with the same key recipes as [lesson 6.2](../06-state-and-merklization/02-state-keys.md). When a rule is about the state, writing it
against the state keeps it short.

</details>

## Check your understanding

::: check
**Why does a service ask for data by hash and length, and not fetch it?**

- [x] A service can't reach outside the chain, so the data must come in a block and prove itself
  > Yes: it asks, waits, and a later block brings the bytes. Their hash is the proof
  > that they are what was asked for.
- [ ] To keep the data out of the state
  > No: once provided, the data is stored in the state, under the service's own key.
- [ ] So that validators can't read the data
  > No: nothing is hidden. The data travels in the block, in the open.

**What stops someone providing the wrong data for a request?**

- [ ] Validators compare the data with the original
  > No: there is no original to compare with. The service only ever had a hash and a
  > length.
- [x] The request is found by the data's own hash and length, so other bytes find no request
  > Yes: the key is `requestKey(s, H(data), length)`. Different bytes hash differently,
  > land on a key nobody asked under, and aren't providable.
- [ ] The service checks the data the next time it runs
  > No: the chain checks it before the service sees it. Y lets in only data whose hash and
  > length match a waiting request.

**A request's history is `[3, 40]`. What happened?**

- [x] The data was provided at slot 3, and forgotten at slot 40
  > Yes: two slots means provided, then forgotten. A third would say when it became
  > available again.
- [ ] It was asked for at slot 3, and provided at slot 40
  > No: asking leaves the history empty, `[]`. The first slot in the list is when the data
  > arrived.
- [ ] The data was provided twice, at 3 and at 40
  > No: data is welcome only while the history is `[]`. After slot 3 it was `[3]`, so a
  > second copy wasn't providable. The 40 is when it was forgotten.

**Why does a request keep a history of slots, and not just "have it" or "don't"?**

- [ ] So the service can be charged for how long it kept the data
  > No: the history is read by a lookup, not by a bill.
- [ ] So a forgotten preimage can be restored from the history
  > No: the history holds slots, not data. It says when the data was there.
- [x] Refine runs off the chain, and must get the same answer whenever it is run or checked
  > Yes: a guarantor and an auditor weeks later both ask about the same slot, the lookup
  > anchor's. The history answers "was it there then?", whatever the state is now.

**A block brings a preimage for a request whose history is already `[5]`. What does the Gray Paper say?**

- [ ] The data is stored again, and the history becomes this block's slot
  > No: only a waiting request, `[]`, is providable. `[5]` has its data already.
- [ ] The preimage is skipped, and the rest of the block goes on
  > No: that's what your client does, the simple road. The Gray Paper lets a preimage pass
  > unused only when accumulation in this same block made it unneeded.
- [x] The block is invalid: every preimage in it must be waited for in the state before it
  > Yes: Y is checked against the state before the block. Your client skips such a
  > preimage for now; the [hardening pass](https://github.com/abutlabs/the-gray-tutor/blob/main/HARDENING.md) adds the refusal, `preimage_unneeded`.
:::

## What you have

Your client can hand services the data they asked for: checked by its hash, stored under
its key, and the request marked done, the same way the real chain did, 67 times over. On
the scoreboard, two of the preimages vectors pass whole, and the board names what the
other fourteen need. Who asked, though, and what do they own?
[Lesson 14.2](./02-the-service-account.md) reads a service's account.

Next: [14.2 The service account](./02-the-service-account.md)
