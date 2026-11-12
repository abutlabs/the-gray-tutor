# The mountain belt

**In one sentence:** the mountain belt is a short row of hashes that stands for every
result any service has ever handed back, and grows by one item a block.

<AlbertClimber />

Tap to append an item. Watch what happens when two mountains of the same size meet.

<a id="try-it"></a>

<MountainBelt />

## The idea

Other chains want to check what happened on JAM. A program that does it, on Ethereum say,
is a bridge. What can JAM hand it?

Each time a service's finished work lands on the chain, the service hands back a hash,
usually a commitment to its new state. A bridge needs one commitment to *every* such
output ever. It has to be small, cheap to extend, and checkable with tools those chains
already have.

JAM's answer is a
[*Merkle mountain belt*](../glossary.md#merkle-mountain-belt): a row of perfect little
Merkle trees, "mountains", of sizes 1, 2, 4, 8 and so on. Two of one size never sit side
by side. They merge into one of twice the size, like trading two coins for the next coin
up. So 5 items make a mountain of 4 and a mountain of 1, and appending an item is exactly
like adding 1 to a binary number.

Each mountain's root is a [*peak*](../glossary.md#peak). One hash made from the peaks,
the [*super-peak*](../glossary.md#super-peak), stands for the whole belt. The hashing is
[*Keccak-256*](../glossary.md#keccak-256), Ethereum's own.

This lesson builds the belt and its one-hash summary, exactly as the test vectors have
them.

## What the Gray Paper says

::: gray-paper E.2 1-5

#### Appendix E.2 Merkle Mountain Ranges and Belts {#gp-E-2}

<a id="gp-E-2-p1"></a>The Merkle Mountain Range (MMR) is an append-only cryptographic data structure which yields a <abbr class="gp-term" title="a short hash that stands for some data, so the data can be checked against it later">commitment</abbr> to a sequence of values. Appending to an MMR and proof of inclusion of some item within it are both $O(\log(N))$ in time and space for the size of the set.

<a id="gp-E-2-p2"></a>We define a Merkle Mountain Range as being within the set $\left[\!\left[\mathbb{H}_{}\boldsymbol{?}\right]\!\right]_{}$, a sequence of peaks, each peak the root of a Merkle tree containing $2^i$ items where $i$ is the index in the sequence. Since we support set sizes which are not always powers-of-two-minus-one, some peaks may be empty, $\emptyset$ rather than a Merkle root.

<a id="gp-E-2-p3"></a>Since the sequence of hashes is somewhat unwieldy as a commitment, Merkle Mountain Ranges are themselves generally hashed before being published. Hashing them removes the possibility of further appending so the range itself is kept on the system which needs to generate future proofs.

<a id="gp-E-2-p4"></a>We define the MMB append function $\mathcal{A}$ as:

<a id="gp-E-2-p5"></a><a id="eq-E-8"></a>

$$
\begin{equation}
\begin{aligned}
\mathcal{A}&\colon\left\{ \,\begin{aligned}
\!\left\lgroup\left[\!\left[\mathbb{H}_{}\boldsymbol{?}\right]\!\right]_{}, \mathbb{H}_{}, \mathbb{B}_{}\to\mathbb{H}_{}\right\rgroup\! &\to \left[\!\left[\mathbb{H}_{}\boldsymbol{?}\right]\!\right]_{}\\
\left(\mathbf{r}, l, H\right) &\mapsto P(\mathbf{r}, l, 0, H)
\vphantom{x'_i}\end{aligned} \right.\\
\text{where } P&\colon\left\{ \,\begin{aligned}
\!\left\lgroup\left[\!\left[\mathbb{H}_{}\boldsymbol{?}\right]\!\right]_{}, \mathbb{H}_{}, \mathbb{N}, \mathbb{B}_{}\to\mathbb{H}_{}\right\rgroup\! &\to \left[\!\left[\mathbb{H}_{}\boldsymbol{?}\right]\!\right]_{}\\
\left(\mathbf{r}, l, n, H\right) &\mapsto \begin{cases}
\mathbf{r} \mathbin{+\!\!+} l &\text{if } n \ge \left\vert\mathbf{r}\right\vert\\
R(\mathbf{r}, n, l) &\text{if } n < \left\vert\mathbf{r}\right\vert \wedge \mathbf{r}_{n} = \emptyset\\
P(R(\mathbf{r}, n, \emptyset), H(\mathbf{r}_{n} \frown l), n + 1, H) &\text{otherwise}
\end{cases}
\vphantom{x'_i}\end{aligned} \right.\\
\text{and } R&\colon\left\{ \,\begin{aligned}
\!\left\lgroup\left[\!\left[T\right]\!\right]_{}, \mathbb{N}, T\right\rgroup\! &\to \left[\!\left[T\right]\!\right]_{}\\
\left(\mathbf{s}, i, v\right) &\mapsto \mathbf{s}'\  \text{where } \mathbf{s}' = \mathbf{s} \text{ except } \mathbf{s}'_{i} = v
\vphantom{x'_i}\end{aligned} \right.
\end{aligned} \tag{E.8}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-fnmmrappend" class="gk-wrap">$\mathcal{A}$</span> | A | append to a Merkle mountain range: its peaks and one more item in, the new peaks out |
| <span id="gk-deffunc">$\left\{ \,\begin{aligned}x\vphantom{x'_i}\end{aligned} \right.$</span> | as follows | a brace grouping lines that hold together: for a function, its type on top, then what each input becomes |
| <span id="gk-tuple">$\!\left\lgroup x\right\rgroup\!$</span> | the tuple of | a record: named fields, each with its type, like an object in JSON |
| <span id="gk-sequence">[$\left[\!\left[x\right]\!\right]$](../symbols.md#sequence)</span> | a sequence of | ⟦T⟧ is an array of T; a subscript is its length, :n at most n, n: at least n |
| <span id="gk-optional">$x\boldsymbol{?}$</span> | or nothing | a value of this type, or ∅ (null) |
| <span id="gk-hash">$\mathbb{H}$</span> | H | a 32-byte value, usually a hash |
| <span id="gk-blob">[$\mathbb{B}$](../symbols.md#blobs)</span> | B, or B sub n | bytes: any run of them; 𝔹ₙ exactly n of them |
| <span id="gk-to">[$\to$](../symbols.md#to)</span> | to | what goes in, to what comes out: A → B takes an A and gives a B |
| <span id="gk-mapsto">$\mapsto$</span> | maps to | what a function gives back for an input: x ↦ y says x becomes y |
| <span id="gk-N" class="gk-wrap">[$\mathbb{N}$](../symbols.md#naturals)</span> | N | the whole numbers: 0, 1, 2 and up; a subscript is a bound, ℕ₈ is 0 to 7 |
| <span id="gk-append">[$\mathbin{+\!\!+}$](../symbols.md#concat)</span> | append | add one item at the end of the sequence |
| <span id="gk-ge">$\ge$</span> | is at least | greater than or equal to |
| <span id="gk-len">$\left\vert x\right\vert$</span> | the size of | \|x\|: how many items x has, or how many bytes |
| <span id="gk-wedge">$\wedge$</span> | and | both sides are true |
| <span id="gk-none" class="gk-wrap">$\emptyset$</span> | nothing | ∅: no value at all, like null |
| <span id="gk-concat" class="gk-wrap">[$\frown$](../symbols.md#concat)</span> | concatenate | join: the left sequence followed by the right |

</details>

→ [(E.8) explained](./gray-paper.md#ex-E-8)

:::

Appendix E.2 (*Merkle Mountain Ranges and Belts*): a belt is a list of *peaks*. Peak i is
the root of a mountain of 2^i items, or ∅ if there's no mountain of that size. So
after 5 items the peaks are [a hash, ∅, a hash]. The paper says *range* (MMR) where it
defines the list and *belt* (MMB) where it appends to one. This tutorial says belt
throughout, as §7 does.

**Appending** an item l is the function 𝒜. The Gray Paper defines it through a helper, P,
that calls itself once per place, and R, which writes one place of a list. Start at
place 0, carrying l.

- If the place is empty, the carried hash rests there. Done.
- If there's a mountain there, merge: the carried hash becomes H(peak ⌢ carried), the
  place empties, and you move on to the next place, carrying the merged hash.
- If you run off the end, the carried hash becomes a new, biggest mountain.

That's binary addition: mountains for 1s, empty places for 0s, merging for "carry the
one". One difference, and it's the whole point. A counter's digit is a bare 1, and
carrying throws its 1s away: nothing about 1000 remembers the eight 1s that made it.
Here every held place stores exactly 32 bytes, a Keccak-256 hash, and a carry hashes the
two peaks it eats. So the one peak of 1000 still commits to all 8 items. A binary counter
whose digits are receipts.

Try it on [the belt at the top](#try-it). Each tap appends one item. A peak's label reads
as the items under it: 1–4 is the mountain over items 1 to 4. The bytes beneath the label
are the peak itself, hashed live on this page with the same items `npm run belt` uses, so
every hash and super-peak there matches what your terminal prints.

- **It starts at 5 items**: a mountain of 4 and a mountain of 1.
- **Turn on step by step.** The carry climbs one place at a time, merging or resting,
  just as the 1s carried in [lesson 2.2](../02-codec/02-compact-naturals.md).
- **Append up to 8**, for three merges in a row.

And backwards? Jump to 32 items and the belt is one peak: `· · · · · ●`, 100000, five
mountains collapsed into one by five merges. Now *take one back*. The page manages it
only by cheating: it kept the items and replays 1 to 31 from an empty belt. Your client
never could. Each merge's H(peak ⌢ carried) destroyed the two 32-byte peaks it read, and
Keccak has no reverse, so the five peaks of 31 items can't be worked out from the 32-item
belt alone. (After 33 the one step back *is* easy: item 33 sits alone in place 0,
unhashed. It's the merges that lock the door.) The belt is a commitment, not an archive:
it can prove the past it was shown, never replay it. That's fine, because nothing in JAM
ever rewinds the belt. It only appends, one accumulate root per block.

::: gray-paper E.2 6-9

#### Appendix E.2 Merkle Mountain Ranges and Belts, continued

<a id="gp-E-2-p6"></a>We define the MMR encoding function as $\mathcal{E}_{M}$:

<a id="gp-E-2-p7"></a><a id="eq-E-9"></a>

$$
\begin{equation}
\mathcal{E}_{M}\colon\left\{ \,\begin{aligned}
\left[\!\left[\mathbb{H}_{}\boldsymbol{?}\right]\!\right]_{} &\to \mathbb{B}_{} \\
\mathbf{b} &\mapsto \mathcal{E}_{}\left(\left\updownarrow\left[\mathord{\unicode{xBF}}x \;\middle\vert\; x \mathrel{\unicode{x2B40}} \mathbf{b}\right]\right.\!\right)
\vphantom{x'_i}\end{aligned} \right. \tag{E.9}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-fnmmrencode" class="gk-wrap">$\mathcal{E}_{M}$</span> | E sub M | a Merkle mountain range's encoding: its peaks, each maybe empty, with their count in front |
| <span id="gk-encode">[$\mathcal{E}\left(x\right)$](../symbols.md#encode)</span> | E of | the encoding of what's in the brackets: its bytes, by Appendix C's rules |
| <span id="gk-var">[$\left\updownarrow x\right.\!$](../symbols.md#length-prefix)</span> | with its length | ↕x: x with its length in front, as a compact natural |
| <span id="gk-sq">[$\left[x\right]$](../symbols.md#sequence)</span> | the sequence | a sequence written out item by item; [ ] is the empty one |
| <span id="gk-build">$\left\{ x \;\middle\vert\; y \right\}$</span> | for each, such that | built by a rule: the left-hand value, for every case the right-hand side allows (a set, or a sequence in order) |
| <span id="gk-maybe">$\mathord{\unicode{xBF}}x$</span> | maybe | ¿x: the byte 0 if x is nothing (∅), or the byte 1 and then x |
| <span id="gk-orderedin">$\mathrel{\unicode{x2B40}}$</span> | in order, from | each item of the sequence, in its order |

</details>

→ [(E.9) explained](./gray-paper.md#ex-E-9)

<a id="gp-E-2-p8"></a>We define the MMR super-peak function as $\mathcal{M}_R$:

<a id="gp-E-2-p9"></a><a id="eq-E-10"></a>

$$
\begin{equation}
\mathcal{M}_R\colon\left\{ \,\begin{aligned}
\left[\!\left[\mathbb{H}_{}\boldsymbol{?}\right]\!\right]_{} &\to \mathbb{H}_{} \\
\mathbf{b} &\mapsto \begin{cases}
\mathbb{H}_{0} &\text{if } \left\vert\mathbf{h}\right\vert = 0\\
\mathbf{h}_0 &\text{if } \left\vert\mathbf{h}\right\vert = 1\\
\mathcal{H}_K\left(\texttt{\$peak} \frown \mathcal{M}_R\left(\mathbf{h}_{\dots\left\vert\mathbf{h}\right\vert-1}\right) \frown \mathbf{h}_{\left\vert\mathbf{h}\right\vert-1}\right) &\text{otherwise} \\
\text{where } \mathbf{h} = \left[h \;\middle\vert\; h \mathrel{\unicode{x2B40}} \mathbf{b}, h \ne \emptyset\right]
\end{cases}
\vphantom{x'_i}\end{aligned} \right. \tag{E.10}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-fnmmrsuperpeak" class="gk-wrap">$\mathcal{M}_R$</span> | M sub R | the super-peak: a mountain range's peaks hashed down to one 32-byte root, with Keccak |
| <span id="gk-zerohash" class="gk-wrap">$\mathbb{H}_{0}$</span> | H zero | 32 zero bytes: a placeholder where a hash isn't known yet |
| <span id="gk-keccak">$\mathcal{H}_K\left(x\right)$</span> | H sub K of | the Keccak-256 hash, as Ethereum uses it: 32 bytes |
| <span id="gk-token">$\texttt{x}$</span> | the string | a name in typewriter type: an instruction's or helper's name, or fixed bytes written as text: the ASCII bytes of its words; the dollar sign in front only marks them as text and is not one of the bytes |
| <span id="gk-mmrsuperpeak">$\mathcal{M}_R\left(x\right)$</span> | M sub R of | the super-peak: one hash for a whole belt, its peaks folded together under the word `peak` |
| <span id="gk-ne">$\ne$</span> | is not | not equal |

</details>

→ [(E.10) explained](./gray-paper.md#ex-E-10)

:::

Two more functions. ℰ_M is how a belt is written as bytes, in the state: its length, then
each place as an optional hash (`00` for ∅, `01` and the 32 bytes for a peak).
[Lesson 9.2](./02-recent-blocks.md)'s `Recent` record does that.

The super-peak, M_R, squeezes a belt into one hash. Take the peaks that exist, in order.
None gives 32 zero bytes, and one gives itself. Otherwise it's
H(`$peak` ⌢ M_R(all but the last) ⌢ the last). The `$` marks an ASCII string, as in
[lesson 5.3](../05-hashing-and-signatures/03-signatures.md): the bytes hashed are the four letters `peak`, without the `$`.

Unrolled, on the 15-item belt `● ● ● ●`, the fold reads top to bottom:

```text
acc = peak₀                        (the mountain of 1)
acc = H("peak" ⌢ acc ⌢ peak₁)      (fold in the mountain of 2)
acc = H("peak" ⌢ acc ⌢ peak₂)      (fold in the mountain of 4)
M_R = H("peak" ⌢ acc ⌢ peak₃)      (fold in the mountain of 8)
```

peak₀ is the leftmost dot, the smallest mountain, joined as it is, with no label. The
fold climbs toward the biggest. The subscripts count only the peaks that *exist*: ∅
places are skipped. So on the 9-item belt `● · · ●` the whole fold is one line,
M_R = H(`peak` ⌢ peak₀ ⌢ peak₁): peak₀ is the single newest item in place 0, and peak₁ is
the mountain of 8 over in place 3. The widget below writes these same lines and names
each dot's peak, so you can see the subscripts slide across the gaps.

Why the label? Without it, the super-peak of two peaks would be H(peak₀ ⌢ peak₁): the
same 64 bytes a merge hashes. One value would then mean two things. "A belt of two
mountains" and "one mountain twice the size" would hash the same, and a bridge signing
the super-peak couldn't say which it had signed. The four letters make the super-peak's
input 68 bytes, which no merge can ever produce. It's the same trick as the signing
contexts of [lesson 8.9](../08-safrole/09-seals.md): every hash first states what it is.
Like writing TOTAL beside the sum on a receipt, so the total can never be read as one
more item.

One value, three names: **M_R** is the Gray Paper's symbol for it, the **super-peak**
this tutorial's word, and **`beefy_root`** the field it fills in state, in every recent
block's history entry, where validators sign it for bridges.

Here is M_R on the history vectors' real belts, hashed live on this page. The belt of 9
items is the one with a merge to watch, and every answer is the vector's own `beefy_root`:

<SuperPeak />

What does each block append? §7 says:

::: gray-paper 7 6-7

#### §7 Recent History, continued

<a id="gp-7-p6"></a>We define the new <abbr class="gp-term" title="β_B, the belt: one running commitment to every block's accumulation outputs">Accumulation Output Log</abbr> $\beta_B$. This is formed from the block's accumulation-output sequence $\theta'$ (defined in section [12](../17-accumulation/index.md#gp-12-p1)), taking its root using the basic binary <abbr class="gp-term" title="hashing many values down to one root through a tree, so one 32-byte hash stands for them all">Merklization</abbr> function ($\mathcal{M}_B$, defined in appendix [E](../06-state-and-merklization/gray-paper.md#gp-E-1-p1)) and appending it to the previous log value with the MMB append function (defined in appendix [E.2](#gp-E-2-p1)). Throughout, the Keccak hash function is used to maximize compatibility with legacy systems:

<a id="gp-7-p7"></a><a id="eq-7-6"></a><a id="eq-7-7"></a>

$$
\begin{align}
\text{let } \mathbf{s} &= \left[\mathcal{E}_{4}\left(s\right) \frown \mathcal{E}_{}\left(h\right) \;\middle\vert\; \left(s, h\right) \mathrel{\unicode{x2B40}} \theta'\right] \tag{7.6} \\
\beta_B' &\equiv \mathcal{A}\left(\beta_B, \mathcal{M}_B\left(\mathbf{s}, \mathcal{H}_K\right), \mathcal{H}_K\right) \tag{7.7}
\end{align}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-lastaccout" class="gk-wrap">$\theta$</span> | theta | the last block's accumulation outputs: which service yielded which hash |
| <span id="gk-accoutbelt" class="gk-wrap">$\beta_B$</span> | beta sub B | the accumulation output belt: one place per binary digit of the block count, each a peak or nothing |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-mmrappend">$\mathcal{A}\left(x\right)$</span> | A of | append one item to a belt, merging equal mountains on the way, as adding 1 carries in binary |
| <span id="gk-merklizewb">$\mathcal{M}_B\left(x\right)$</span> | M sub B of | the well-balanced Merkle root of a list: one hash for all its items |
| <span id="gk-fnkeccak" class="gk-wrap">$\mathcal{H}_K$</span> | H sub K | Keccak-256, Ethereum's hash: 32 bytes, for what other chains must check |

</details>

→ [(7.6), (7.7) explained](./gray-paper.md#ex-7-6)

:::

Four steps. Take this block's accumulation outputs θ′, each a service and the hash it
yielded. Write each as the service id in 4 bytes then the hash, 36 bytes. Roll them into
one root with M_B, the well-balanced Merkle root
([lesson 17.11](../17-accumulation/11-what-a-service-yields.md) builds it). Append that
root to the belt with 𝒜. That root is the vectors' `accumulate_root`, the one item a
block adds.

And the hash? Not Blake2b, for once. The belt uses Keccak-256, ℋ_K, Ethereum's hash,
"to maximize compatibility with legacy systems": a bridge contract on Ethereum can check
JAM's belt with a hash it has built in.

## A second hash

`@noble/hashes` has Keccak too. No new dependency:

**Add to** `src/hash.ts`

```ts
import { keccak_256 } from "@noble/hashes/sha3.js";

/** Keccak-256, the hash Ethereum uses, for the parts of JAM that other chains must read. */
export function keccak256(data: Bytes): Bytes {
  return keccak_256(data);
}
```

## The tests

**New file** `test/belt.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { appendToBelt, superPeak } from "../src/belt.ts";
import type { Belt } from "../src/belt.ts";
import { fromHex, toHex } from "../src/bytes.ts";
import { keccak256 } from "../src/hash.ts";
import { vectorFiles, vectorJson } from "./vectors.ts";
import type { Bytes } from "../src/bytes.ts";

test("Keccak-256 of nothing at all", () => {
  const empty: string = "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470";
  const hashed: string = toHex(keccak256(new Uint8Array(0)));
  assert.equal(hashed, empty);
});

test("appending is counting in binary: mountains of 1, 2, 4...", () => {
  const a: Bytes = new Uint8Array(32).fill(1);
  let belt: Belt = [];
  belt = appendToBelt(belt, a); // 1 item:  [a]
  belt = appendToBelt(belt, a); // 2 items: [-, H(a ⌢ a)]
  const aa: Bytes = keccak256(new Uint8Array(64).fill(1)); // H(a ⌢ a)
  assert.deepEqual(belt, [null, aa]);
  belt = appendToBelt(belt, a); // 3 items: [a, H(a ⌢ a)]
  const lowest: Bytes | null = belt[0];
  assert.deepEqual(lowest, a);
});

/** A history test vector: the parts of it this lesson uses. */
type HistoryVector = {
  input: { accumulate_root: string };
  pre_state: { beta: { mmr: { peaks: (string | null)[] } } };
  post_state: { beta: { history: { beefy_root: string }[]; mmr: { peaks: (string | null)[] } } };
};

const belt = (peaks: (string | null)[]): Belt => peaks.map((p) => (p === null ? null : fromHex(p)));

test("the belt after each block of the history vectors, and its super-peak", () => {
  let checked = 0;
  for (const size of ["tiny", "full"]) {
    for (const name of vectorFiles(`stf/history/${size}`)) {
      const { input, pre_state, post_state } = vectorJson(name) as HistoryVector;
      const before: Belt = belt(pre_state.beta.mmr.peaks);
      const after: Belt = appendToBelt(before, fromHex(input.accumulate_root));
      const expected: Belt = belt(post_state.beta.mmr.peaks);
      assert.deepEqual(after, expected, name);
      const newest = post_state.beta.history[post_state.beta.history.length - 1];
      const peak: string = toHex(superPeak(after));
      assert.equal(peak, newest.beefy_root, name);
      checked++;
    }
  }
  assert.equal(checked, 8);
});
```

The vectors are the `history` ones ([lesson 9.2](./02-recent-blocks.md) uses the rest of
them). Each gives the belt before a block, the item appended (`accumulate_root`), and the
belt after. The newest block's history entry has the super-peak, as `beefy_root`. Between
them they hold belts of 1, 2, 8 and 9 items, so
the 7 → 8 append carries all the way up, three merges in a row.

A stub that never merges: every item becomes a peak of its own, and the super-peak is
zeros.

**New file** `src/belt.ts`

```ts
// The accumulation output belt (GP §7, App. E): a Merkle mountain belt. A compact
// commitment to every block's accumulation outputs, built with Keccak so that other chains
// can check it.

import type { Bytes } from "./bytes.ts";

/** A mountain belt: peak i is the root of 2^i items, or null if there's no such mountain. */
export type Belt = (Bytes | null)[];

export function appendToBelt(belt: Belt, item: Bytes): Belt {
  return [...belt, item];
}

export function superPeak(belt: Belt): Bytes {
  return new Uint8Array(32);
}
```

**Run, expect it to fail**

```sh
npm test
```

```text
...
✖ appending is counting in binary: mountains of 1, 2, 4... (1.9ms)
✖ the belt after each block of the history vectors, and its super-peak (0.9ms)
...
ℹ tests 90
ℹ suites 0
ℹ pass 88
ℹ fail 2
...
test at test/belt.test.ts:16:1
✖ appending is counting in binary: mountains of 1, 2, 4... (1.9ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
  + actual - expected

    [
  -   null,
      Uint8Array(32) [
  +     1,
...
```

Red, in the two tests that append. Read the first diff from its top. The expected belt
(the `-` lines) starts with `null`, an empty place: two items should merge into one
mountain of 2 in place 1. Your stub's belt (the `+` lines) starts with the item itself,
its 32 bytes all 1, and has it again in place 1: two mountains of 1, side by side. The
Keccak test already passes: the hash was there before the belt.

## The code

Now the real thing, the whole file again:

**Rewrite** `src/belt.ts`

```ts
// The accumulation output belt (GP §7, App. E): a Merkle mountain belt. A compact
// commitment to every block's accumulation outputs, built with Keccak so that other chains
// can check it.

import type { Bytes } from "./bytes.ts";
import { concatBytes } from "./bytes.ts";
import { keccak256 } from "./hash.ts";

/** A mountain belt: peak i is the root of 2^i items, or null if there's no such mountain. */
export type Belt = (Bytes | null)[];

/** A (GP App. E): append an item, merging equal mountains as it goes, like adding 1 in binary. */
export function appendToBelt(belt: Belt, item: Bytes): Belt {
  const peaks = [...belt];
  let carry = item;
  for (let i = 0; i < peaks.length; i++) {
    const peak = peaks[i];
    if (peak === null) {
      peaks[i] = carry; // an empty place: the mountain rests here
      return peaks;
    }
    carry = keccak256(concatBytes(peak, carry)); // two mountains of 2^i make one of 2^(i+1)
    peaks[i] = null;
  }
  peaks.push(carry); // a new, biggest mountain
  return peaks;
}

/** "$peak" in the Gray Paper: the $ marks an ASCII string, as in lesson 5.3. */
const PEAK = new TextEncoder().encode("peak");

/** M_R (GP App. E): the super-peak, one hash for the whole belt. */
export function superPeak(belt: Belt): Bytes {
  const peaks = belt.filter((peak) => peak !== null);
  if (peaks.length === 0) return new Uint8Array(32);
  if (peaks.length === 1) return peaks[0];
  const last = peaks[peaks.length - 1];
  return keccak256(concatBytes(PEAK, superPeak(peaks.slice(0, -1)), last));
}
```

The merge is two lines in the loop:

```ts
    carry = keccak256(concatBytes(peak, carry)); // two mountains of 2^i make one of 2^(i+1)
    peaks[i] = null;
```

The Gray Paper writes A's helper P as a recursion. `appendToBelt` is the same thing as a
loop, carrying one hash along the places. `superPeak` stays recursive, as the Gray Paper
writes it: fold all but the last, then join the last on.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ Keccak-256 of nothing at all (1.1ms)
✔ appending is counting in binary: mountains of 1, 2, 4... (0.9ms)
✔ the belt after each block of the history vectors, and its super-peak (16.7ms)
...
ℹ tests 90
ℹ suites 0
ℹ pass 90
ℹ fail 0
...
reported 90 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791731459401
...
```

## Watch it

**New file** `bin/belt.ts`

```ts
// Grows a mountain belt one item at a time and shows its peaks after each append:
// ● a mountain, · an empty place, smallest mountain first.
// Usage: npm run belt [how many items, 16 unless you say]

import { appendToBelt, superPeak } from "../src/belt.ts";
import type { Belt } from "../src/belt.ts";
import { toHex } from "../src/bytes.ts";
import { keccak256 } from "../src/hash.ts";
import { Run } from "../src/obs.ts";

const count = Number(process.argv[2] ?? 16);
const run = new Run("belt");
let belt: Belt = [];
for (let items = 1; items <= count; items++) {
  belt = appendToBelt(belt, keccak256(new Uint8Array([items]))); // any 32 bytes will do
  const peaks = belt.map((peak) => (peak === null ? "·" : "●")).join(" ");
  const top = `${toHex(superPeak(belt)).slice(0, 10)}…`;
  console.log(`after ${String(items).padStart(3)}: ${peaks.padEnd(12)} super-peak ${top}`);
  run.event("append", { items, peaks, superPeak: superPeak(belt) });
}
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

**What flows through it.** No vector this time: the program makes its own items, one
per append. Item i is Keccak-256 of the single byte i; any 32 bytes would do. What goes
in, what each append computes, and what it prints:

::: code-group

```text [what goes in]
item  1 = Keccak-256(0x01) = 0x5fe7f977e7…   the byte 1, hashed to 32 bytes
item  2 = Keccak-256(0x02) = 0xf2ee15ea63…
…
item 16 = Keccak-256(0x10) = 0x967f2a2c7f…
```

```ts [what it computes]
// appendToBelt, on the 16th item: 15 is 1111, so the carry climbs all four places
const computed = {
  before: "● ● ● ●", // 15 items: mountains of 1, 2, 4 and 8
  merges: 4, // H(peak ⌢ carried) at places 0, 1, 2, 3 — each eats two peaks
  after: "· · · · ●", // one mountain of 16, resting in new place 4
  superPeak: "0x77a03478…", // M_R of one peak is the peak itself
};
```

```text [what comes out]
after  15: ● ● ● ●      super-peak 0xc4c91480…
after  16: · · · · ●    super-peak 0x77a03478…
```

:::

Read the input into the output. Item 1's hash *is* the `after 1` super-peak: one peak,
no folding. Every later line is the belt after one more append. The 15 → 16 step above
is the biggest collapse on the page: four merges, 1111 + 1 = 10000.

**Run**

```sh
npm pkg set scripts.belt="node bin/belt.ts"
npm run belt
```

```text
after   1: ●            super-peak 0x5fe7f977…
after   2: · ●          super-peak 0x71d8979c…
after   3: ● ●          super-peak 0xacb31462…
after   4: · · ●        super-peak 0x3ef0aafe…
after   5: ● · ●        super-peak 0x57bba00c…
after   6: · ● ●        super-peak 0xe1de474b…
after   7: ● ● ●        super-peak 0xe7b9b123…
after   8: · · · ●      super-peak 0x62762e65…
after   9: ● · · ●      super-peak 0x13f2e75e…
after  10: · ● · ●      super-peak 0x643b865f…
after  11: ● ● · ●      super-peak 0xa6d8952e…
after  12: · · ● ●      super-peak 0xd8e5acd3…
after  13: ● · ● ●      super-peak 0x52b36038…
after  14: · ● ● ●      super-peak 0xba074758…
after  15: ● ● ● ●      super-peak 0xc4c91480…
after  16: · · · · ●    super-peak 0x77a03478…
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=belt-1791731463475
```

Your hashes are these same ones: the items are fixed bytes, so only the link's run id
changes from run to run. Now read the dots from right to left: after 5, `● · ●` is 101,
after 6 `· ● ●` is 110, after 8 `· · · ●` is 1000. The belt *is* the count in binary,
written backwards, smallest mountain first. Watch 7 → 8: three mountains merge into one,
like 0111 + 1 = 1000. The *Belt* panel has every step. Try `npm run belt 100`.

![Belt panel](./images/01-belt.png)

<details>
<summary>lasair: <code>mmr_append</code>, in <code>conformance/history_stf.ml</code></summary>

```ocaml
let mmr_append (peaks : bytes option list) (leaf : bytes) : bytes option list =
  let rec carry peaks hash =
    match peaks with
    | [] -> [Some hash]  (* No more peaks, place here *)
    | None :: rest -> Some hash :: rest  (* Empty slot, place here *)
    | Some p :: rest ->
      (* Combine with existing peak, carry to next level *)
      let combined = hash_combine p hash in
      None :: carry rest combined
  in
  carry peaks leaf
```

The same three cases as the Gray Paper's P, as a pattern match on the list: off the end,
an empty place, or a mountain to merge with. This is the code lasair runs against the
same `history` vectors. OCaml's `match` makes the binary counter almost a poem.

</details>

## Check your understanding

::: check
**What is the belt for?**

- [ ] It lets a validator replay old blocks
  > No: the belt is a commitment, not an archive. It can prove a past it was shown,
  > never replay one.
- [x] It gives other chains one small commitment to every accumulation output ever
  > Yes: a bridge reads it. So it is small, cheap to extend, and hashed with a function
  > those chains already have.
- [ ] It stores each service's state
  > No: a place holds 32 bytes, a hash. A service's output is usually a commitment to
  > its state, and the belt commits to those outputs.

**A belt holds a mountain of 4 and a mountain of 1. What does the next item do?**

- [ ] It becomes a second mountain of 1, next to the first
  > No: two mountains of one size never sit side by side. The new item merges with the
  > mountain in place 0.
- [x] It merges with the mountain of 1, and the new mountain of 2 rests in the empty place
  > Yes: H(peak ⌢ item) carries to place 1, finds it empty, and stops. That is 101 + 1 =
  > 110, six items.
- [ ] It merges with the mountain of 4
  > No: the carry starts at place 0 and climbs one place at a time. A mountain of 4 only
  > merges with another mountain of 4.

**Appending item 32 merges five times and leaves one peak: [∅, ∅, ∅, ∅, ∅, a hash]. Can the client compute the 31-item belt, the five peaks that were there, from the 32-item belt alone?**

- [ ] Yes: split the hash back into the five peaks it was built from
  > No: Keccak-256 is one-way. Each merge's H(peak ⌢ carried) read 64 bytes and kept
  > 32. No amount of work recovers the inputs from the output.
- [ ] Yes: the hash still contains all 31 items, so decode them back out
  > No: 32 bytes *commit* to the items, they don't *contain* them. A receipt, not a
  > copy.
- [x] No: only replaying items 1 to 31 onto an empty belt rebuilds those peaks
  > Yes: the items are the only road back, and the belt doesn't keep them. That's fine:
  > JAM only ever appends.

**Why does the super-peak hash the letters `peak` in front of its peaks?**

- [x] So a belt of two mountains can never hash the same as one mountain twice the size
  > Yes: a merge hashes 64 bytes, two peaks. With the four letters the super-peak's
  > input is 68 bytes, which no merge can ever produce.
- [ ] The letters are the length of the belt, as a blob has its length in front
  > No: they are four fixed ASCII bytes, the same for every belt. They say what kind of
  > hash this is, not how long anything is.
- [ ] Ethereum's hash needs a prefix on its input
  > No: Keccak-256 hashes any bytes. A merge hashes two peaks with no prefix at all.

**Why does the belt hash with Keccak-256, not Blake2b like the rest of JAM?**

- [ ] Keccak-256 is faster
  > No: speed isn't the reason. §7 gives one: "to maximize compatibility with legacy
  > systems".
- [x] A bridge on Ethereum can check the belt with a hash it already has built in
  > Yes: Keccak-256 is Ethereum's own hash. The belt is there for other chains to read,
  > so it speaks their hash.
- [ ] Blake2b can't hash two 32-byte peaks together
  > No: Blake2b hashes any bytes. [Lesson 6.1](../06-state-and-merklization/01-the-state-trie.md)'s trie hashes pairs of hashes with it.
:::

## What you have

A Merkle mountain belt, the commitment JAM keeps for bridges, appended to in a handful of
hashes per block, whatever its length. The belt's super-peak is one of the things the
chain writes down for every block. [Lesson 9.2](./02-recent-blocks.md) keeps the rest of
that record.

Next: [9.2 Recent blocks](./02-recent-blocks.md)
