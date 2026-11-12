# The formulas, in plain words

[Part 2](./index.md)'s appendix: every formula of Appendix C, *Serialization Codec*, this
part quotes, explained. Eleven blocks, (C.1) to (C.7) and (C.10) to (C.15): how any JAM
value becomes bytes. Real values: the codec vectors (`vectors/codec/tiny`) and the block
traces. The bits, the maybe and the block are in [4.A](../04-blocks/gray-paper.md). Each
formula: its key, then read aloud, in plain words, on a real value, in your client.
Notation: [Reading the Gray Paper](../reading-the-gray-paper.md).

## (C.1) and (C.2): nothing, and bytes

::: gray-paper-eq C.1

<a id="ex-C-1"></a>The Gray Paper's (C.1), [in its place in the paper's words](./04-codecs.md#eq-C-1):

$$
\begin{equation}
\mathcal{E}_{}\left(\emptyset\right) \equiv \left[\right] \tag{C.1}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-encode">[$\mathcal{E}\left(x\right)$](../symbols.md#encode)</span> | E of | the encoding of what's in the brackets: its bytes, by Appendix C's rules |
| <span id="gk-none" class="gk-wrap">$\emptyset$</span> | nothing | ∅: no value at all, like null |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-sq">[$\left[x\right]$](../symbols.md#sequence)</span> | the sequence | a sequence written out item by item; [ ] is the empty one |

</details>

:::

::: gray-paper-eq C.2

<a id="ex-C-2"></a>The Gray Paper's (C.2), [in its place in the paper's words](./04-codecs.md#eq-C-2):

$$
\begin{equation}
\mathcal{E}_{}\left(x \in \mathbb{B}_{}\right) \equiv x \tag{C.2}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-in">[$\in$](../symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-blob">[$\mathbb{B}$](../symbols.md#blobs)</span> | B, or B sub n | bytes: any run of them; 𝔹ₙ exactly n of them |

</details>

:::

**Read it aloud.** "E of nothing is defined as the empty sequence. E of x, where x is in
B, is defined as x."

**In plain words.** The two simplest rules of the codec. Nothing (∅, which your client
writes as `null`) takes no bytes at all. And a value that already *is* bytes (a hash, a
signature, a blob) goes out exactly as it is, byte for byte. The codec has no work to do
on either, which is the point: most of a block is hashes and signatures, and they cost
nothing to encode.

**On a real value.** `header_1` starts with its parent hash. The JSON says
`0x5c743dbc…d65897b7`, and the file's first 32 bytes are those same bytes:

```text
parent (JSON)       0x5c743dbc 514284b2 … d65897b7     a hash: 32 bytes, in 𝔹₃₂
ℰ(parent)           5c 74 3d bc 51 42 84 b2 … d6 58 97 b7  (C.2): itself
header_1.bin 0..32  5c 74 3d bc 51 42 84 b2 … d6 58 97 b7  the same 32 bytes
```

(C.1) has no real value of its own to show: nothing encodes as nothing. Where the vectors
write a `null`, a sign in front says it is missing, the ¿ of (C.8), so that a reader
knows to skip it.

**In your client.** `fixedBytes` and `hash` in `src/codec/codec.ts` are (C.2), from
[2.4's Bytes](./04-codecs.md#bytes).

## (C.3) and (C.4): a tuple is its parts, glued

::: gray-paper-eq C.3

<a id="ex-C-3"></a>The Gray Paper's (C.3), [in its place in the paper's words](./03-writer-and-reader.md#eq-C-3):

$$
\begin{equation}
\mathcal{E}_{}\left(\left(a, b, \dots\right)\right) \equiv \mathcal{E}_{}\left(a\right) \frown \mathcal{E}_{}\left(b\right) \frown \dots \tag{C.3}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-concat" class="gk-wrap">[$\frown$](../symbols.md#concat)</span> | concatenate | join: the left sequence followed by the right |

</details>

:::

::: gray-paper-eq C.4

<a id="ex-C-4"></a>The Gray Paper's (C.4), [in its place in the paper's words](./03-writer-and-reader.md#eq-C-4):

$$
\begin{align}
\mathcal{E}_{}\left(a, b, \dots\right) &\equiv \mathcal{E}_{}\left(\left(a, b, \dots\right)\right) \tag{C.4}
\end{align}
$$

:::

**Read it aloud.** "E of the tuple a, b, and so on, is defined as E of a, concatenated
with E of b, concatenated with the rest. E of a, b, and so on, is defined as E of the
tuple a, b, and so on."

**In plain words.** A tuple, a record of a few fields, encodes as its fields' encodings,
one after another, in the order written, with nothing between them: no names, no
separators, no count. (C.4) is shorthand: giving ℰ several values at once means the tuple
of them. So the reader must know the fields and their order already, and the bytes carry
only the values.

**On a real value.** A header starts with three hashes and a slot. By (C.3) its bytes are
each field's, glued:

```text
ℰ(H_P)        5c 74 3d bc … 97 b7       bytes 0 to 31     the parent hash: itself, 32 bytes
ℰ(H_R)        25 91 eb d0 … a0 0b       bytes 32 to 63    the prior state root: 32 bytes
ℰ(H_X)        74 a9 e7 9d … 5c 81       bytes 64 to 95    the extrinsic hash: 32 bytes
ℰ₄(H_T)       2a 00 00 00               bytes 96 to 99    the slot, 42, in 4 bytes (C.12)
                                                          32 + 32 + 32 + 4 = 100 bytes
```

That is `header_1.bin`'s first 100 bytes exactly: the file is the fields, back to back.

**In your client.** `Writer` writes each part after the last and `Reader` reads them back
in the same order ([2.3](./03-writer-and-reader.md#the-writer)); `record` in
`src/codec/codec.ts` encodes a record's fields in their order
([2.5's Records](./05-sequences-and-records.md#records)).

## (C.5): compact naturals

::: gray-paper-eq C.5

<a id="ex-C-5"></a>The Gray Paper's (C.5), [in its place in the paper's words](./02-compact-naturals.md#eq-C-5):

$$
\begin{equation}
\mathcal{E}_{}\colon\left\{ \begin{aligned}
\mathbb{N}_{2^{64}} &\to \mathbb{B}_{1:9} \\
x &\mapsto \begin{cases}
\left[0\right] &\text{if } x = 0 \\
\left[2^8-2^{8-l} + \left\lfloor\frac{x}{2^{8l}}\right\rfloor\right] \frown \mathcal{E}_{l}\left(x \bmod 2^{8l}\right) &\text{if } \exists l \in \mathbb{N}_8 : 2^{7l} \le x < 2^{7(l+1)} \\
\left[2^8-1\right] \frown \mathcal{E}_{8}\left(x\right) &\text{otherwise if } x < 2^{64} \\
\end{cases}
\end{aligned} \right. \tag{C.5}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-fnencode">[$\mathcal{E}$](../symbols.md#encode)</span> | E | the codec: a value in, its bytes out; a number alone, as a compact natural of 1 to 9 bytes |
| <span id="gk-abracegroup">$\left\{ \begin{aligned}x\end{aligned} \right.$</span> | as follows | a brace grouping lines that hold together: for a function, its type on top, then what each input becomes |
| <span id="gk-Nbits">[$\mathbb{N}_{2^{x}}$](../symbols.md#naturals)</span> | N sub two to the n | the numbers that fit in n bits: ℕ_{2³²} is a u32 |
| <span id="gk-to">[$\to$](../symbols.md#to)</span> | to | what goes in, to what comes out: A → B takes an A and gives a B |
| <span id="gk-mapsto">$\mapsto$</span> | maps to | what a function gives back for an input: x ↦ y says x becomes y |
| <span id="gk-ffrac">$\left\lfloor\frac{x}{y}\right\rfloor$</span> | x over y, rounded down | whole-number division, the remainder dropped: ⌊7/3⌋ is 2 |
| <span id="gk-bmod">[$\bmod$](../symbols.md#mod)</span> | mod | the remainder after dividing: 14 mod 4 is 2 |
| <span id="gk-exists">[$\exists$](../symbols.md#exists)</span> | there exists | there is at least one value such that what follows holds |
| <span id="gk-N" class="gk-wrap">[$\mathbb{N}$](../symbols.md#naturals)</span> | N | the whole numbers: 0, 1, 2 and up; a subscript is a bound, ℕ₈ is 0 to 7 |
| <span id="gk-le">$\le$</span> | at most | less than or equal to |

</details>

:::

**Read it aloud.** "E is a function from the naturals below 2 to the 64 to between 1 and 9
bytes. x maps to: the sequence holding 0, if x is 0; the sequence holding 2 to the 8
minus 2 to the 8 minus l, plus the floor of x over 2 to the 8l, concatenated with E sub l
of x mod 2 to the 8l, if there exists an l in N sub 8 with 2 to the 7l at most x and x
below 2 to the 7 times l plus 1; and otherwise, if x is below 2 to the 64, the sequence
holding 2 to the 8 minus 1, concatenated with E sub 8 of x."

**In plain words.** A number takes as few bytes as it needs, 1 to 9, and the first byte
says how many more follow. That first byte starts with l ones and a zero, the marker:
no ones for a one-byte number, one for two bytes, and so on. The bits after the marker
hold x's top bits, and the next l bytes hold the rest of x, smallest byte first (C.12).
The condition picks l: the number of extra bytes, the one l where x is at least
2^(7l) and below 2^(7(l+1)). Each extra byte buys 7 more bits, because the marker takes
one bit of the first byte for each. A number too big for that, 2^56 or more, gets the
byte 255 and all eight bytes.

**On a real value.** The preimage of 143 bytes in block 8 of the `preimages` trace has
its length in front, as a compact natural:

```text
x = 143                    the length to write
l = 1                      2^7 = 128 ≤ 143 < 16,384 = 2^14: one extra byte
2^8 − 2^7 = 128            the marker: 0b1000_0000, one 1 and a 0
⌊143 / 2^8⌋ = 0            x's top bits, after the marker: none here
128 + 0 = 128 = 0x80       the first byte
143 mod 2^8 = 143          the low byte
ℰ₁(143) = 8f               (C.12): one byte
ℰ(143) = 80 8f             2 bytes
```

143's top bits are all zero, which hides one part of the rule, so take 300, the
[2.2](./02-compact-naturals.md) example:

```text
x = 300                    l = 1 again: 128 ≤ 300 < 16,384
⌊300 / 256⌋ = 1            the top bits: 1
128 + 1 = 129 = 0x81       the marker, with x's top bit added in: 0b1000_0001
300 mod 256 = 44 = 0x2c    the low byte
ℰ(300) = 81 2c             2 bytes
```

**In your client.** `encodeNatural` and `decodeNatural` in `src/codec/numbers.ts`
([2.2](./02-compact-naturals.md#the-code)), and `Writer.natural` and `Reader.natural`,
which call them.

## (C.6): a sequence is its items

::: gray-paper-eq C.6

<a id="ex-C-6"></a>The Gray Paper's (C.6), [in its place in the paper's words](./05-sequences-and-records.md#eq-C-6):

$$
\begin{equation}
\mathcal{E}_{}\left([\mathbf{i}_0, \mathbf{i}_1, ...]\right) \equiv \mathcal{E}_{}\left(\mathbf{i}_0\right) \frown \mathcal{E}_{}\left(\mathbf{i}_1\right) \frown \dots \tag{C.6}
\end{equation}
$$

:::

**Read it aloud.** "E of the sequence i zero, i one, and so on, is defined as E of i zero,
concatenated with E of i one, concatenated with the rest."

**In plain words.** A list encodes as its items, one after another. On its own that has
no length in front: the paper adds one where the length can vary, with ↕ (C.7). A list
whose length everyone knows, such as a hash's 32 bytes or one ticket for each slot of an
epoch, goes bare. That is why the paper can say a hash's encoding is the hash itself: a
hash is 32 bytes in a row, and (C.6) writes them in a row.

**On a real value.** `header_1`'s tickets mark is a list of exactly E = 12 tickets on
tiny, so (C.6) writes them with no count:

```text
8c25…4c7b 00     ticket 0: its 32-byte id, then its attempt (ℰ₁): 33 bytes
2f24…66e6 01     ticket 1: 33 bytes
…                tickets 2 to 10
abf4…c68c 03     ticket 11: 33 bytes
                 12 × 33 = 396 bytes, and no count in front
```

**In your client.** `seq` in `src/codec/codec.ts` writes a length first, as most lists
need ([2.5's Sequences](./05-sequences-and-records.md#sequences)); `seqN`, the list with
no length, comes in [4.5](../04-blocks/05-maybe-and-exactly-n.md#the-code).

## (C.7): ↕, the length in front

::: gray-paper-eq C.7

<a id="ex-C-7"></a>The Gray Paper's (C.7), [in its place in the paper's words](./04-codecs.md#eq-C-7):

$$
\begin{equation}
\left\updownarrow x\right.\! \equiv \left(\left\vert x\right\vert, x\right)\text{ thus }\mathcal{E}_{}\left(\left\updownarrow x\right.\!\right) \equiv \mathcal{E}_{}\left(\left\vert x\right\vert\right)\frown\mathcal{E}_{}\left(x\right) \tag{C.7}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-var">[$\left\updownarrow x\right.\!$](../symbols.md#length-prefix)</span> | with its length | ↕x: x with its length in front, as a compact natural |
| <span id="gk-len">$\left\vert x\right\vert$</span> | the size of | \|x\|: how many items x has, or how many bytes |

</details>

:::

**Read it aloud.** "Up-down-arrow x is defined as the tuple of the size of x and x, thus E
of up-down-arrow x is defined as E of the size of x, concatenated with E of x."

**In plain words.** ↕x is x with its length in front, written as a compact natural (C.5).
The paper calls that length a discriminator: it tells a reader where x ends. The paper
puts ↕ only where the length can vary, so a hash never gets one and a blob always does.

**On a real value.** The tiny `block.json` carries three preimages. The first is for
service `0x01020304` and its data is 16 bytes, so in `block.bin`:

```text
04 03 02 01                   the service, 0x01020304, as ℰ₄: 4 bytes, smallest first
10                            ↕: the data's length, 16, as a compact natural: 1 byte
81 09 5e 61 … 4a 7f c8 33     the data, 16 bytes, as itself (C.2)
                              4 + 1 + 16 = 21 bytes
```

**In your client.** `blob` in `src/codec/codec.ts` ([2.4's Bytes](./04-codecs.md#bytes))
is ↕ for bytes, and `seq` ([2.5](./05-sequences-and-records.md#sequences)) is ↕ for lists.

## (C.10): a dictionary, sorted

::: gray-paper-eq C.10

<a id="ex-C-10"></a>The Gray Paper's (C.10), [in its place in the paper's words](./05-sequences-and-records.md#eq-C-10):

$$
\begin{equation}
\forall K, V: \mathcal{E}_{}\left(d \in \left\langle\!\left\vert K\to V\right\vert\!\right\rangle\right) \equiv
\mathcal{E}_{}\left(
\left\updownarrow\left[
\left(\mathcal{E}_{}\left(k\right), \mathcal{E}_{}\left(d\left[k\right]\right)\right)
\;\middle\vert\;
k \in \mathcal{K}\left(d\right)
\,\wr\,k
\right]\right.\!
\right) \tag{C.10}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-forall">$\forall$</span> | for all | for every value: ∀c ∈ ℕ_C means for each core c |
| <span id="gk-dictionary">$\left\langle\!\left\vert x\to y\right\vert\!\right\rangle$</span> | a dictionary from K to V | a map: keys of type K, each with one value of type V |
| <span id="gk-orderby">$y\,\wr\,x$</span> | sorted by | [y ≀ x]: the items y, sorted by x, smallest first |
| <span id="gk-build">$\left\{ x \;\middle\vert\; y \right\}$</span> | for each, such that | built by a rule: the left-hand value, for every case the right-hand side allows (a set, or a sequence in order) |
| <span id="gk-keys">$\mathcal{K}\left(x\right)$</span> | K of | a dictionary's keys |

</details>

:::

**Read it aloud.** "For all K and V: E of d, where d is a dictionary from K to V, is
defined as E of up-down-arrow the sequence of the pairs E of k and E of d at k, for each
key k of d, sorted by k."

**In plain words.** A small map is written as a list of (key, value) pairs with its
length in front, sorted by key. The sorting is the point: a map has no order of its own,
so without it two clients could write the same map two ways and get two different hashes.

**On a real value.** The real dictionaries in the vectors are empty: χ_Z, the services
that accumulate for free, in the tiny genesis state, and the segment-root lookup in the
work-report vectors. An empty dictionary is a length of 0:

```text
00         ↕[]: no entries, a length of 0, 1 byte
```

So here is a small made-up one, a map from service 7 to the byte `aa` and from service 2
to `bb`, keys as u32:

```text
02                    two entries: the length, 1 byte
02 00 00 00  bb       key 2 first, sorted: its key in 4 bytes, then its value
07 00 00 00  aa       then key 7
                      1 + 5 + 5 = 11 bytes
```

**In your client.** A dictionary is a `seq` of `record` values, one per entry, kept in key
order: the segment-root lookup in [3.3](../03-work-and-reports/03-a-work-report.md#the-code)
is the first.

## (C.11): a set, sorted

::: gray-paper-eq C.11

<a id="ex-C-11"></a>The Gray Paper's (C.11), [in its place in the paper's words](./05-sequences-and-records.md#eq-C-11):

$$
\begin{equation}
\mathcal{E}_{}\left(\left\{\,a, b, c, \dots\,\right\}\right) \equiv \mathcal{E}_{}\left(a\right) \frown \mathcal{E}_{}\left(b\right) \frown \mathcal{E}_{}\left(c\right) \frown \dots  \text{where } a < b < c < \dots \tag{C.11}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-set">$\left\{\,x\,\right\}$</span> | the set of | a set: values with no order and no repeats |

</details>

:::

**Read it aloud.** "E of the set a, b, c, and so on, is defined as E of a, concatenated
with E of b, concatenated with E of c, and the rest, where a is less than b is less than
c, and so on."

**In plain words.** A set is written as its items, smallest first: the same reason as the
dictionary, a set has no order, so the codec gives it one. "Smallest" for hashes means
by their bytes, from the first. On its own a set carries no length; where one is needed,
the paper adds ↕, as Appendix D does for the four sets of past judgments.

**On a real value.** Those four sets are empty in the tiny genesis state, so each is a
lone `00`, and ψ is `00 00 00 00`. A made-up set of three hashes, starting `c0…`, `0a…`
and `7f…`, goes out sorted:

```text
0a…        the smallest: 32 bytes
7f…        32 bytes
c0…        the largest: 32 bytes
           3 × 32 = 96 bytes, in this order whatever order they came in
```

**In your client.** A set is a `seq` of its items, kept sorted: `sorted` in
`src/disputes.ts` sorts the judged reports before they join ψ
([10.1](../10-disputes/01-votes-and-verdicts.md)).

## (C.12): fixed-width integers

::: gray-paper-eq C.12

<a id="ex-C-12"></a>The Gray Paper's (C.12), [in its place in the paper's words](./01-fixed-width-integers.md#eq-C-12):

$$
\begin{equation}
\mathcal{E}_{l \in \mathbb{N}}\colon\left\{ \begin{aligned}
\mathbb{N}_{2^{8l}} &\to \mathbb{B}_{l} \\
x &\mapsto \begin{cases}
\left[\right] &\text{if } l = 0 \\
\left[x \bmod 256\right] \frown \mathcal{E}_{l - 1}\left(\left\lfloor\frac{x}{256}\right\rfloor\right) &\text{otherwise}
\end{cases}
\end{aligned} \right. \tag{C.12}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-floor">[$\left\lfloor x\right\rfloor$](../symbols.md#floor)</span> | floor of | rounded down to a whole number |
| <span id="gk-frac">$\frac{x}{y}$</span> | over | a fraction: the top divided by the bottom |

</details>

:::

**Read it aloud.** "E sub l, for l in N, is a function from the naturals below 2 to the 8l
to l bytes. x maps to the empty sequence if l is 0; otherwise, to the sequence holding x
mod 256, concatenated with E sub l minus 1 of the floor of x over 256."

**In plain words.** A number in exactly l bytes, smallest byte first (little-endian).
Write x's lowest byte, chop it off, and do the same with one byte fewer, until there are
no bytes left. The width is the type's, never the number's: a slot is 4 bytes even when
it is 1. ℰ₂, ℰ₄ and ℰ₈ are a u16, a u32 and a u64.

**On a real value.** `header_1`'s slot, 42, at bytes 96 to 99:

```text
ℰ₄(42) = [42 mod 256] ⌢ ℰ₃(⌊42 / 256⌋)   = [42] ⌢ ℰ₃(0)
ℰ₃(0) = [0] ⌢ ℰ₂(0)                       three zero bytes follow, one per step
ℰ₀(0) = []                                 l = 0: stop
ℰ₄(42) = 2a 00 00 00                       42 is 0x2a: 4 bytes
```

And 4,807, whose bytes are both not zero, from [2.1](./01-fixed-width-integers.md):

```text
ℰ₂(4807) = [4807 mod 256] ⌢ ℰ₁(⌊4807 / 256⌋)   = [199] ⌢ ℰ₁(18)
ℰ₁(18)   = [18] ⌢ ℰ₀(0)                          = [18]
ℰ₂(4807) = c7 12                                  199 is 0xc7, 18 is 0x12: 2 bytes
```

**In your client.** `encodeFixed` and `decodeFixed` in `src/codec/numbers.ts`
([2.1](./01-fixed-width-integers.md#the-code)), and the codecs `u8`, `u16`, `u32` and
`u64` built on them ([2.4](./04-codecs.md#integers)).

## (C.13) to (C.15): fixed width, stretched

::: gray-paper-eq C.13

<a id="ex-C-13"></a>The Gray Paper's (C.13), (C.14), (C.15), [in its place in the paper's words](./01-fixed-width-integers.md#eq-C-13):

$$
\begin{align}
\mathcal{E}_{l \in \mathbb{N}}\left(a, b, \dots\right) &\equiv \mathcal{E}_{l}\left(\left(a, b, \dots\right)\right) \tag{C.13} \\
\mathcal{E}_{l \in \mathbb{N}}\left(\left(a, b, \dots\right)\right) &\equiv \mathcal{E}_{l}\left(a\right) \frown \mathcal{E}_{l}\left(b\right) \frown \dots \tag{C.14} \\
\mathcal{E}_{l \in \mathbb{N}}\left(\left[\mathbf{i}_0, \mathbf{i}_1, \dots\right]\right) &\equiv \mathcal{E}_{l}\left(\mathbf{i}_0\right) \frown \mathcal{E}_{l}\left(\mathbf{i}_1\right) \frown \dots \tag{C.15}
\end{align}
$$

:::

**Read it aloud.** "E sub l of a, b, and so on, is E sub l of the tuple a, b, and so on.
E sub l of the tuple a, b, and so on, is E sub l of a, concatenated with E sub l of b,
and the rest. E sub l of the sequence i zero, i one, and so on, is E sub l of i zero,
concatenated with E sub l of i one, and the rest."

**In plain words.** The same three rules as (C.3), (C.4) and (C.6), with ℰₗ in place of ℰ:
every number inside gets exactly l bytes. The paper uses it to say "these numbers are all
u32" in one go, such as ℰ₄(χ_M, χ_A, χ_V, χ_R) in Appendix D.

**On a real value.** After block 8 of the `preimages` trace, validator 3's tally for the
epoch is six numbers, which Appendix D writes as one ℰ₄ of the tuple:

```text
03 00 00 00     blocks made: 3, as ℰ₄
00 00 00 00     tickets: 0
04 00 00 00     preimages: 4
c5 01 00 00     preimage bytes: 453 (143 + 3 + 84 + 223), 0x01c5
04 00 00 00     guarantees: 4
07 00 00 00     assurances: 7
                6 × 4 = 24 bytes
```

**In your client.** A `record` whose fields are all `u32`, such as `ValidatorStats`
([18.1](../18-statistics/01-who-did-what.md)).

## Say it in one breath

Nothing is no bytes, and bytes are themselves (C.1, C.2). A tuple is its parts glued in
order (C.3, C.4), and a list is its items glued in order (C.6), with ↕, its length as a
compact natural, in front when the length can vary (C.7). A number is either fixed-width,
exactly l bytes smallest first (C.12, C.13 to C.15), or compact, 1 to 9 bytes with a
marker of leading ones saying how many follow (C.5). Maps and sets are sorted before they
are written, so each has one encoding only (C.10, C.11).
