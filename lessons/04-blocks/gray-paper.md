# The formulas, in plain words

[Part 4](./index.md)'s appendix: every formula this part quotes, read for someone who doesn't read math.
They come from three places: §4.1 says what a block is made of, §5 what its header holds,
and Appendix C how all of it is written as bytes. There are eight displayed blocks, and
the last one, Appendix C's *Block Serialization*, holds twenty-two equations, (C.16) to
(C.37), so it gets a heading for each group of lines. [The part's page](./index.md) says
who makes each bag and where. Each formula comes with its key, then the same four steps:
read it aloud, say it in plain words, watch it work on a real value, and find it in your
client. The real values are the codec vectors' (`vectors/codec/tiny`) and the `fallback`
trace's. [2.A](../02-codec/gray-paper.md) explains the rest of Appendix C, the rules
these lines are built from; [Reading the Gray Paper](../reading-the-gray-paper.md)
teaches the shapes a line can take.

## (4.2) and (4.3): a block, and its five bags

::: gray-paper-eq 4.2

<a id="ex-4-2"></a>The Gray Paper's (4.2), (4.3), [in its place in the paper's words](../19-block-import/04-importing-a-block.md#eq-4-2):

$$
\begin{align}
\mathbf{B} &\equiv \left(\mathbf{H}, \mathbf{E}\right) \tag{4.2} \\
\mathbf{E} &\equiv \left(\mathbf{E}_T, \mathbf{E}_D, \mathbf{E}_P, \mathbf{E}_A, \mathbf{E}_G\right) \tag{4.3}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-block" class="gk-wrap">[$\mathbf{B}$](../symbols.md#block)</span> | B | a block: its header and its extrinsic |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-header" class="gk-wrap">$\mathbf{H}$</span> | H | a block header: the parent's hash, the slot, the seals and markers |
| <span id="gk-extrinsic" class="gk-wrap">$\mathbf{E}$</span> | E | a block's extrinsic: the data it carries in, in five bags |
| <span id="gk-xttickets" class="gk-wrap">$\mathbf{E}_T$</span> | E sub T | the tickets bag: entries to the block-sealing lottery |
| <span id="gk-xtdisputes" class="gk-wrap">$\mathbf{E}_D$</span> | E sub D | the disputes bag: verdicts, culprits and faults |
| <span id="gk-xtpreimages" class="gk-wrap">$\mathbf{E}_P$</span> | E sub P | the preimages bag: data a service asked for |
| <span id="gk-xtassurances" class="gk-wrap">$\mathbf{E}_A$</span> | E sub A | the assurances bag: validators saying they hold their pieces of reports |
| <span id="gk-xtguarantees" class="gk-wrap">$\mathbf{E}_G$</span> | E sub G | the guarantees bag: work-reports with their guarantors' signatures, one per core at most |

</details>

:::

**Read it aloud.** "B is defined as the tuple of H and E. E is defined as the tuple of E
sub T, E sub D, E sub P, E sub A and E sub G."

**In plain words.** A block is two things: a header, the few hundred bytes every node
reads first, and an extrinsic, the data the block brings in from outside the chain. The
extrinsic is five bags: tickets, disputes, preimages, assurances and guarantees. These
two lines name the parts and nothing more; Appendix C's (C.16) decides the byte order,
which is not this one.

**On a real value.** The tiny `block.json`:

```text
header          slot 42, author 3, with an epoch mark       778 bytes
E_T  tickets    3 tickets                                   2,356 bytes
E_D  disputes   2 verdicts, 2 culprits, 1 fault             1,132 bytes
E_P  preimages  3 preimages                                 64 bytes
E_A  assurances 2 assurances                                199 bytes
E_G  guarantees 1 guarantee                                 621 bytes
                778 + 2,356 + 1,132 + 64 + 199 + 621 = 5,150 bytes, block.bin's size
```

**In your client.** `Extrinsic` and `Block` in `src/block.ts`
([4.7](./07-the-block.md#the-code)), each a `record` of its parts.

## (5.1): the header's ten fields

::: gray-paper-eq 5.1

<a id="ex-5-1"></a>The Gray Paper's (5.1), [in its place in the paper's words](./06-the-header.md#eq-5-1):

$$
\begin{equation}
\mathbf{H} \equiv \left(\mathbf{H}_{P}, \mathbf{H}_{R}, \mathbf{H}_{X}, \mathbf{H}_{T}, \mathbf{H}_{E}, \mathbf{H}_{W}, \mathbf{H}_{O}, \mathbf{H}_{I}, \mathbf{H}_{V}, \mathbf{H}_{S}\right) \tag{5.1}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk--parent">$P$</span> | P | a header's parent hash: 𝐇_P is the hash of the header before it, 32 bytes |
| <span id="gk--priorstateroot">$R$</span> | R | a header's prior state root: 𝐇_R is the root of the state before this block, 32 bytes |
| <span id="gk--extrinsichash">$X$</span> | X | a header's extrinsic hash: 𝐇_X stands for the block's five bags, 32 bytes |
| <span id="gk--timeslot">$T$</span> | T | a header's timeslot: 𝐇_T is the slot this block was made for |
| <span id="gk--epochmark">$E$</span> | E | a header's epoch mark: 𝐇_E, at an epoch's first block only, the next epoch's entropy and validator keys |
| <span id="gk--winnersmark">$W$</span> | W | a header's winning-tickets mark: 𝐇_W, at most once an epoch, a ticket for every slot of the next (12 on tiny, 600 on full) |
| <span id="gk--offendersmark">$O$</span> | O | a header's offenders mark: 𝐇_O, the Ed25519 keys of the validators this block convicts |
| <span id="gk--authorindex">$I$</span> | I | a header's author index: 𝐇_I, which validator made the block, a position in κ′ |
| <span id="gk--vrfsig">$V$</span> | V | a header's VRF signature: 𝐇_V, 96 bytes of the author's fresh randomness; the vectors' entropy source |
| <span id="gk--sealsig">$S$</span> | S | a header's seal: 𝐇_S, the author's 96-byte Bandersnatch signature on the rest of the header |

</details>

:::

**Read it aloud.** "H is defined as the tuple of H sub P, H sub R, H sub X, H sub T, H sub
E, H sub W, H sub O, H sub I, H sub V and H sub S."

**In plain words.** The header's ten fields, by their letters: the parent's hash (P), the
prior state root (R), the extrinsic hash (X), the timeslot (T), the epoch mark (E), the
winning-tickets mark (W), the offenders mark (O), the author's index (I), the VRF
signature (V) and the seal (S). Like (4.3), this is a list of names; Appendix C's (C.23)
writes them in another order, I and V before O.

**On a real value.** `header_1`, field by field, in the paper's order:

```text
H_P  parent             0x5c743dbc…d65897b7       32 bytes
H_R  parent_state_root  0x2591ebd0…cfd4a00b       32 bytes
H_X  extrinsic_hash     0x74a9e79d…56e85c81       32 bytes
H_T  slot               42                        4 bytes
H_E  epoch_mark         none                      1 byte, 00
H_W  tickets_mark       12 tickets                1 + 12 × 33 = 397 bytes
H_O  offenders_mark     none                      1 byte, the length 00
H_I  author_index       3                         2 bytes
H_V  entropy_source     0xae85d663…a2256c5f       96 bytes
H_S  seal               0x31dc5b1e…d283f7b0       96 bytes
                        32 × 3 + 4 + 1 + 397 + 1 + 2 + 96 + 96 = 693 bytes, header_1.bin's size
```

**In your client.** `Header` in `src/block.ts` ([4.6](./06-the-header.md#the-code)), its
fields in Appendix C's order.

## (5.8): forward, and never ahead of the clock

::: gray-paper-eq 5.8

<a id="ex-5-8"></a>The Gray Paper's (5.8), [in its place in the paper's words](./06-the-header.md#eq-5-8):

$$
\begin{equation}
\mathbf{H}_{T} \in \mathbb{N}_T \,,\quad
P\left(\mathbf{H}\right)_{T} < \mathbf{H}_{T}\ \wedge\ \mathbf{H}_{T}\cdot\mathsf{P} \leq \mathcal{T} \tag{5.8}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-in">[$\in$](../symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-timeslot" class="gk-wrap">$\mathbb{N}_T$</span> | N sub T | a timeslot: a u32 counting 6-second slots |
| <span id="gk-getparent">$P\left(x\right)$</span> | P of | the parent of a header: P(𝐇) is the header of the block before |
| <span id="gk-wedge">$\wedge$</span> | and | both sides are true |
| <span id="gk-cdot">$\cdot$</span> | times | multiply |
| <span id="gk-Cslotseconds" class="gk-wrap">$\mathsf{P}$</span> | P | a slot's length: 6 seconds |
| <span id="gk-leq">$\leq$</span> | at most | less than or equal to |
| <span id="gk-wallclock" class="gk-wrap">$\mathcal{T}$</span> | T | the wall clock: seconds since the JAM Common Era began (2025-01-01 12:00 UTC) |

</details>

:::

**Read it aloud.** "H sub T is in N sub T; the parent of H's T is less than H sub T, and H
sub T times P is at most T," the last T being the wall clock.

**In plain words.** Two rules for a header's slot. It comes after its parent's slot, so
the chain only moves forward in time (a slot may be skipped, never repeated). And it is
not in the future: the slot's start, slot × 6 seconds from JAM's clock start, must have
come. A block that breaks the second rule isn't wrong forever, only early: the paper's
next line says it becomes valid as the clock moves on.

**On a real value.** Block 2 of the `fallback` trace:

```text
P(H)_T = 1                 its parent, block 1, was made in slot 1
H_T = 2                    block 2's slot
1 < 2                      the first rule holds
2 × 6 = 12 seconds         slot 2 starts 12 seconds after 2025-01-01 12:00 UTC
12 ≤ T                     in November 2026, T is about 58.6 million: long past
```

**In your client.** `checkHeader` in `src/import.ts` refuses a slot that isn't after the
state's time τ, the parent's slot, as `bad_slot`
([19.4](../19-block-import/04-importing-a-block.md#the-code)). The clock half isn't
checked: the vectors have no clock to check against.

## (5.10): the author, by number

::: gray-paper-eq 5.10

<a id="ex-5-10"></a>The Gray Paper's (5.10), [in its place in the paper's words](./06-the-header.md#eq-5-10):

$$
\begin{equation}
\mathbf{H}_{I} \in \mathbb{N}_{\left\vert\kappa'\right\vert} \,,\quad \mathbf{H}_{A} \equiv \kappa'[\mathbf{H}_{I}]_{b} \tag{5.10}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-Nmax">[$\mathbb{N}_{x}$](../symbols.md#naturals)</span> | N sub n | the whole numbers below n: ℕ_C is a core index, 0 to C − 1 |
| <span id="gk-len">$\left\vert x\right\vert$</span> | the size of | \|x\|: how many items x has, or how many bytes |
| <span id="gk-activeset" class="gk-wrap">$\kappa$</span> | kappa | the current validators: the keys of the V validators active this epoch |
| <span id="gk--authorbskey">$A$</span> | A | the author's Bandersnatch key: 𝐇_A, looked up in κ′ at 𝐇_I, never written in the header |
| <span id="gk-vk-bs">$b$</span> | b | a validator's Bandersnatch key: the first 32 of its 336 bytes |

</details>

:::

**Read it aloud.** "H sub I is in N sub the size of kappa prime; H sub A is defined as
kappa prime at H sub I, its b."

**In plain words.** The header names its author by a number, a position in κ′, this
epoch's validators after the block: 0 to 5 on tiny, 0 to 1,022 on full. H_A, the author's
Bandersnatch key, is the b part (the first 32 bytes) of that validator's entry. It is
looked up, never written: two bytes in the header stand for a 32-byte key.

**On a real value.** Block 3 of the `fallback` trace:

```text
H_I = 3                    the header's author_index, 2 bytes: 03 00
|κ′| = 6                   six validators on tiny, so 3 is in ℕ₆
κ′[3]                      the fourth validator's 336-byte entry in the state, C(8)
κ′[3]_b = 0x0746846d…      its first 32 bytes: H_A, the key the seal must check against
```

**In your client.** `readValidators` in `src/state.ts` reads κ
([6.3](../06-state-and-merklization/03-reading-the-state.md#the-code)); the seal is
checked against H_A in [Part 8](../08-safrole/index.md).

## (5.11): the three markers

::: gray-paper-eq 5.11

<a id="ex-5-11"></a>The Gray Paper's (5.11), [in its place in the paper's words](./06-the-header.md#eq-5-11):

$$
\begin{equation}
\mathbf{H}_{E} \in \!\left\lgroup\mathbb{H}_{}, \mathbb{H}_{}, \left[\!\left[\!\left\lgroup\overset{\backsim}{\mathbb{H}_{}}, \bar{\mathbb{H}_{}}\right\rgroup\!\right]\!\right]_{\mathbb{V}}\right\rgroup\!\boldsymbol{?}\,,\quad
\mathbf{H}_{W} \in \left[\!\left[\mathbb{T}\right]\!\right]_{\mathsf{E}}\boldsymbol{?}\,,\quad
\mathbf{H}_{O} \in \left[\!\left[\bar{\mathbb{H}_{}}\right]\!\right]_{} \tag{5.11}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-optional">$x\boldsymbol{?}$</span> | or nothing | a value of this type, or ∅ (null) |
| <span id="gk-tuple">$\!\left\lgroup x\right\rgroup\!$</span> | the tuple of | a record: named fields, each with its type, like an object in JSON |
| <span id="gk-hash">$\mathbb{H}$</span> | H | a 32-byte value, usually a hash |
| <span id="gk-sequence">[$\left[\!\left[x\right]\!\right]$](../symbols.md#sequence)</span> | a sequence of | ⟦T⟧ is an array of T; a subscript is its length, :n at most n, n: at least n |
| <span id="gk-valcount" class="gk-wrap">$\mathbb{V}$</span> | V (the set) | the validator counts allowed: multiples of 3 from 6 to 3C, which is 1,023 on full and 6 on tiny |
| <span id="gk-bskey" class="gk-wrap">$\overset{\backsim}{\mathbb{H}}$</span> | H tilde | a Bandersnatch public key: 32 bytes |
| <span id="gk-edkey" class="gk-wrap">$\bar{\mathbb{H}}$</span> | H bar | an Ed25519 public key: 32 bytes |
| <span id="gk-Cepochlen" class="gk-wrap">$\mathsf{E}$</span> | E | an epoch's length in slots: 600 on full, 12 on tiny |
| <span id="gk-safroleticket" class="gk-wrap">$\mathbb{T}$</span> | T | a ticket: a 32-byte id, and which of its maker's tries it was (its attempt) |

</details>

:::

**Read it aloud.** "H sub E is in: the tuple of H, H, and a sequence, of a size in V, of
pairs of an H tilde and an H bar; or nothing. H sub W is in: a sequence of exactly E
tickets, or nothing. H sub O is in: a sequence of H bars."

**In plain words.** The types of the three markers. The epoch mark, when there is one,
holds two 32-byte entropy hashes and the next epoch's validators, each as a Bandersnatch key
and an Ed25519 key, as many as there are validators (the 𝕍 says the count may vary). The
winning-tickets mark, when there is one, holds exactly E tickets, one for each slot of
the next epoch. The offenders mark is always there, a list of Ed25519 keys, usually
empty. The ? on the first two is what makes them optional: on the bytes, the ¿ of (C.8).

**On a real value.** `header_0` and `header_1` show all three:

```text
header_0  H_E   η₀ 0xae85d663…, η₁ 0x333a7e32…,       the epoch mark: 32 + 32 bytes,
                6 validators: ff71c6c0… 4418fb8c…, …  and 6 pairs of 32 + 32
header_0  H_W   none                                  ∅
header_0  H_O   [0x4418fb8c…]                         one offender: an Ed25519 key
header_1  H_E   none                                  ∅
header_1  H_W   12 tickets                            exactly E = 12 on tiny
header_1  H_O   []                                    no offenders
```

**In your client.** `EpochMark`, `TicketBody` and `Header` in `src/block.ts`
([4.6](./06-the-header.md#the-code)): `option` for the first two, `seqN` for the 12
tickets, `seq` for the offenders.

## (C.8): ¿, maybe

::: gray-paper-eq C.8

<a id="ex-C-8"></a>The Gray Paper's (C.8), [in its place in the paper's words](./05-maybe-and-exactly-n.md#eq-C-8):

$$
\begin{align}
\mathord{\unicode{xBF}}x \equiv \begin{cases}
0 &\text{if } x = \emptyset \\
\left(1, x\right) &\text{otherwise}
\end{cases} \tag{C.8}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-maybe">$\mathord{\unicode{xBF}}x$</span> | maybe | ¿x: the byte 0 if x is nothing (∅), or the byte 1 and then x |
| <span id="gk-none" class="gk-wrap">$\emptyset$</span> | nothing | ∅: no value at all, like null |

</details>

:::

**Read it aloud.** "Maybe x is defined as: 0, if x is nothing; otherwise, the tuple 1, x."

**In plain words.** A value that may be missing gets one byte in front: 0 for "nothing
here", and nothing follows; or 1, then the value. The 0 and the 1 are naturals, so they
are written as compact naturals, `00` and `01`. Without the byte, a reader could not tell
"nothing" from the first byte of a value.

**On a real value.** `header_1`, at bytes 100 and 101:

```text
H_E = ∅          ¿∅ = 0          00                    1 byte: no epoch mark
H_W = 12 tickets ¿H_W = (1, H_W) 01 8c 25 c0 63 …      1 byte, then the 396 bytes of tickets
```

**In your client.** `option` in `src/codec/codec.ts`
([4.5](./05-maybe-and-exactly-n.md#the-code)): `null` writes `00`, anything else `01` and
the value.

## (C.9): bits, eight to a byte

::: gray-paper-eq C.9

<a id="ex-C-9"></a>The Gray Paper's (C.9), [in its place in the paper's words](./02-tiny-and-full.md#eq-C-9):

$$
\begin{align}
\mathcal{E}_{}\left(b \in \mathbb{b}_{}\right) &\equiv \begin{cases}
\left[\right] &\text{if } b = \left[\right] \\
\left[
\sum\limits_{i=0}^{i < \min(8, \left\vert b\right\vert)}
b_{i} \cdot 2^i
\right] \frown \mathcal{E}_{}\left(b_{8 \dots }\right) &\text{otherwise}\\
\end{cases} \tag{C.9}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-encode">[$\mathcal{E}\left(x\right)$](../symbols.md#encode)</span> | E of | the encoding of what's in the brackets: its bytes, by Appendix C's rules |
| <span id="gk-bitstring">$\mathbb{b}$</span> | b sub n | bits: a run of true-or-false values; a subscript is how many |
| <span id="gk-sq">[$\left[x\right]$](../symbols.md#sequence)</span> | the sequence | a sequence written out item by item; [ ] is the empty one |
| <span id="gk-sum">$\sum$</span> | the sum of | add up what follows, once for each value the subscript ranges over |
| <span id="gk-min">$\min$</span> | the least of | the smallest of the values given; min(24, j : …) is the smallest j that fits, but no more than 24 |
| <span id="gk-concat" class="gk-wrap">[$\frown$](../symbols.md#concat)</span> | concatenate | join: the left sequence followed by the right |
| <span id="gk-interval">$_{x \dots y}$</span> | from x to y | the items from index x up to, not including, y |

</details>

:::

**Read it aloud.** "E of b, where b is a bit string, is defined as: the empty sequence, if
b is empty; otherwise, the sequence holding the sum, for i from 0 while i is below the
smaller of 8 and the size of b, of b sub i times 2 to the i, concatenated with E of b from
8 on."

**In plain words.** Bits go eight to a byte. The first eight bits make the first byte:
bit 0 is worth 1, bit 1 worth 2, up to bit 7 worth 128, so the first bit is the byte's
*lowest*. Then the same with the next eight, until none are left; a last byte with fewer
than eight bits is padded with zeros at the top. Careful: the state trie of
[Part 6](../06-state-and-merklization/index.md) reads a key's bits the other way round,
highest first. Two rules, two orders.

**On a real value.** An assurance's bitfield, one bit per core:

```text
tiny, C = 2       bits [1, 0]                     core 0: yes; core 1: no
                  1 × 1 + 0 × 2 = 1               the byte: 0x01, 1 byte for 2 cores
full, C = 341     first 8 bits [1,0,1,0,1,0,1,0]  cores 0, 2, 4, 6: yes
                  1 + 4 + 16 + 64 = 85 = 0x55     the first of 43 bytes
                  last byte 0x15 = 1 + 4 + 16     cores 336, 338 and 340: yes
                  ⌈341 / 8⌉ = 43 bytes            every other core, 171 of 341
```

**In your client.** The bitfield is kept as its bytes, `fixedBytes(⌈C / 8⌉)` in
`Assurance` ([4.2](./02-tiny-and-full.md#a-codec-that-depends-on-the-size)); the bits are
read one by one in [Part 11](../11-assurances/index.md).

## (C.16) to (C.37): the block, line by line

::: gray-paper-eq C.16

<a id="ex-C-16"></a>The Gray Paper's (C.16), (C.17), (C.18), (C.19), (C.20), (C.21), (C.22), (C.23), (C.24), (C.25), (C.26), (C.27), (C.28), (C.29), (C.30), (C.31), (C.32), (C.33), (C.34), (C.35), (C.36), (C.37), [in its place in the paper's words](./07-the-block.md#eq-C-16):

$$
\begin{align}
\mathcal{E}_{}\left(\mathbf{B}\right) &= \mathcal{E}_{}\left(
\mathbf{H},
\mathcal{E}_{T}\left(\mathbf{E}_T\right),
\mathcal{E}_{P}\left(\mathbf{E}_P\right),
\mathcal{E}_{G}\left(\mathbf{E}_G\right),
\mathcal{E}_{A}\left(\mathbf{E}_A\right),
\mathcal{E}_{D}\left(\mathbf{E}_D\right)
\right) \tag{C.16} \\
\mathcal{E}_{T}\left(\mathbf{E}_T\right) &= \mathcal{E}_{}\left(
\left\updownarrow\left[
\left(\mathcal{E}_{1}\left(e\right), p\right)
\;\middle\vert\;
\left(e, p\right) \mathrel{\unicode{x2B40}} \mathbf{E}_T
\right]\right.\!\right) \tag{C.17} \\
\mathcal{E}_{P}\left(\mathbf{E}_P\right) &= \mathcal{E}_{}\left(
\left\updownarrow\left[
\left(\mathcal{E}_{4}\left(s\right), \left\updownarrow\mathbf{d}\right.\!\right)
\;\middle\vert\;
\left(s, \mathbf{d}\right) \mathrel{\unicode{x2B40}} \mathbf{E}_P
\right]\right.\!\right) \tag{C.18} \\
\mathcal{E}_{G}\left(\mathbf{E}_G\right) &= \mathcal{E}_{}\left(\left\updownarrow\mathbf{E}_G\right.\!\right) \tag{C.19} \\
\mathcal{E}_{A}\left(\mathbf{E}_A\right) &= \mathcal{E}_{}\left(
\left\updownarrow\left[
\left(a, f, \mathcal{E}_{2}\left(v\right), s\right)
\;\middle\vert\;
\left(a, f, v, s\right) \mathrel{\unicode{x2B40}} \mathbf{E}_A
\right]\right.\!\right) \tag{C.20} \\
\mathcal{E}_{D}\left(\left(\mathbf{v}, \mathbf{c}, \mathbf{f}\right)\right) &= \mathcal{E}_{}\left(
\left\updownarrow\left[
\left(r, \mathcal{E}_{4}\left(a\right),
\left\updownarrow\left[
\left(v, \mathcal{E}_{2}\left(i\right), s\right)
\;\middle\vert\;
\left(v, i, s\right) \mathrel{\unicode{x2B40}} \mathbf{j}
\right]
\right.\!\right)
\;\middle\vert\;
\left(r, a, \mathbf{j}\right) \mathrel{\unicode{x2B40}} \mathbf{v}
\right]\right.\!,
\left\updownarrow\mathbf{c}\right.\!,
\left\updownarrow\mathbf{f}\right.\!
\right) \tag{C.21} \\
\mathcal{E}_{}\left(\mathbf{H}\right) &= \mathcal{E}_{}\left(
\mathcal{E}_{U}\left(\mathbf{H}\right),
\mathbf{H}_{S}
\right) \tag{C.22} \\
\mathcal{E}_{U}\left(\mathbf{H}\right) &= \mathcal{E}_{}\left(
\mathbf{H}_{P},
\mathbf{H}_{R},
\mathbf{H}_{X},
\mathcal{E}_{4}\left(\mathbf{H}_{T}\right),
\mathcal{E}_{E}\left(\mathbf{H}_{E}\right),
\mathord{\unicode{xBF}}\mathbf{H}_{W},
\mathcal{E}_{2}\left(\mathbf{H}_{I}\right),
\mathbf{H}_{V},
\left\updownarrow\mathbf{H}_{O}\right.\!
\right) \tag{C.23} \\
\mathcal{E}_{E}\left(\emptyset\right) &= \mathcal{E}_{}\left(0\right) \tag{C.24} \\
\mathcal{E}_{E}\left(\left(\eta_0, \eta_1, \mathbf{k}\right)\right) &= \mathcal{E}_{}\left(1, \eta_0, \eta_1, \left\updownarrow\mathbf{k}\right.\!\right) \tag{C.25} \\
\mathcal{E}_{}\left(\mathbf{x} \in \mathbb{C}\right) &\equiv \mathcal{E}_{}\left(
\mathbf{x}_{a},
\mathcal{E}_{4}\left(\mathbf{x}_{n}\right),
\mathbf{x}_{s},
\mathbf{x}_{b},
\mathbf{x}_{l},
\mathcal{E}_{4}\left(\mathbf{x}_{t}\right),
\mathbf{x}_{r},
\left\updownarrow\mathbf{x}_{\mathbf{p}}\right.\!
\right) \tag{C.26} \\
\mathcal{E}_{}\left(\mathbf{x} \in \mathbb{Y}\right) &\equiv \mathcal{E}_{}\left(
\mathbf{x}_{p},
\mathcal{E}_{4}\left(\mathbf{x}_{l}\right),
\mathbf{x}_{u},
\mathcal{E}_{2}\left(\mathbf{x}_{v}\right),
\mathbf{x}_{e},
\mathcal{E}_{2}\left(\mathbf{x}_{n}\right)
\right) \tag{C.27} \\
\mathcal{E}_{}\left(\mathbf{d} \in \mathbb{D}\right) &\equiv \mathcal{E}_{}\left(
\mathcal{E}_{4}\left(\mathbf{d}_{s}\right),
\mathbf{d}_{c},
\mathbf{d}_{y},
\mathcal{E}_{8}\left(\mathbf{d}_{g}\right),
O\left(\mathbf{d}_{\mathbf{l}}\right),
\mathbf{d}_{u},
\mathbf{d}_{i},
\mathbf{d}_{x},
\mathbf{d}_{z},
\mathbf{d}_{e}
\right) \tag{C.28} \\
\mathcal{E}_{}\left(\mathbf{r} \in \mathbb{R}\right) &\equiv \mathcal{E}_{}\left(
\mathbf{r}_{\mathbf{s}},
\mathbf{r}_{\mathbf{c}},
\mathbf{r}_{c},
\mathbf{r}_{a},
\mathbf{r}_{g},
\left\updownarrow\mathbf{r}_{\mathbf{t}}\right.\!,
\left\updownarrow\mathbf{r}_{\mathbf{l}}\right.\!,
\left\updownarrow\mathbf{r}_{\mathbf{d}}\right.\!
\right) \tag{C.29} \\
\mathcal{E}_{}\left(\mathbf{g} \in \mathbb{G}\right) &\equiv \mathcal{E}_{}\left(
\mathbf{g}_{\mathbf{r}},
\mathcal{E}_{4}\left(\mathbf{g}_{t}\right),
\left\updownarrow\left[\left(\mathcal{E}_{2}\left(v\right), s\right) \;\middle\vert\; \left(v, s\right) \mathrel{\unicode{x2B40}} \mathbf{g}_{a}\right]\right.\!
\right) \tag{C.30} \\
\mathcal{E}_{}\left(\mathbf{p} \in \mathbb{P}\right) &\equiv \mathcal{E}_{}\left(
\mathcal{E}_{4}\left(\mathbf{p}_{h}\right),
\mathbf{p}_{u},
\mathbf{p}_{\mathbf{c}},
\left\updownarrow\mathbf{p}_{\mathbf{j}}\right.\!,
\left\updownarrow\mathbf{p}_{\mathbf{f}}\right.\!,
\left\updownarrow\mathbf{p}_{\mathbf{w}}\right.\!
\right) \tag{C.31} \\
\mathcal{E}_{}\left(\mathbf{w} \in \mathbb{W}\right) &\equiv \mathcal{E}_{}\left(
\mathcal{E}_{4}\left(\mathbf{w}_{s}\right),
\mathbf{w}_{c},
\mathcal{E}_{8}\left(\mathbf{w}_{g}\right),
\mathcal{E}_{8}\left(\mathbf{w}_{a}\right),
\mathcal{E}_{2}\left(\mathbf{w}_{e}\right),
\left\updownarrow\mathbf{w}_{\mathbf{y}}\right.\!,
\left\updownarrow I^\#\left(\mathbf{w}_{\mathbf{i}}\right)\right.\!,
\left\updownarrow\left[
\left(h, \mathcal{E}_{4}\left(i\right)\right)
\;\middle\vert\;
\left(h, i\right) \mathrel{\unicode{x2B40}} \mathbf{w}_{\mathbf{x}}
\right]\right.\!
\right) \tag{C.32} \\
\mathcal{E}_{}\left(x \in \mathbb{T}\right) &\equiv \mathcal{E}_{}\left(
x_{y},
\mathcal{E}_{1}\left(x_{e}\right)
\right) \tag{C.33} \\
\mathcal{E}_{}\left(x \in \mathbb{X}\right) &\equiv \mathcal{E}_{}\left(
1,
\mathcal{E}_{4}\left(x_{s}\right),
\mathcal{E}_{4}\left(x_{d}\right),
\mathcal{E}_{8}\left(x_{a}\right),
x_{m},
\mathcal{E}_{8}\left(x_{g}\right)
\right) \tag{C.34} \\
\mathcal{E}_{}\left(\mathbf{x} \in \mathbb{U}\right) &\equiv \mathcal{E}_{}\left(
0,
\mathbf{x}_{p},
\mathbf{x}_{e},
\mathbf{x}_{a},
\mathbf{x}_{y},
\mathbf{x}_{g},
O\left(\mathbf{x}_{\mathbf{l}}\right),
\left\updownarrow\mathbf{x}_{\mathbf{t}}\right.\!
\right) \tag{C.35} \\
O\left(o \in \mathbb{E} \cup \mathbb{B}_{}\right) &\equiv \begin{cases}
\left(0, \left\updownarrow o\right.\!\right) &\text{if } o \in \mathbb{B}_{} \\
1 &\text{if } o = \infty \\
2 &\text{if } o = \unicode{x21AF} \\
3 &\text{if } o = \circledcirc \\
4 &\text{if } o = \circleddash \\
5 &\text{if } o = \texttt{BAD} \\
6 &\text{if } o = \texttt{BIG}
\\
\end{cases} \tag{C.36} \\
I\left(\left(
h \in \mathbb{H}_{} \cup \mathbb{H}_{}^\boxplus,
i \in \mathbb{N}_{2^{15}}
\right)\right) &\equiv \begin{cases}
\left(h, \mathcal{E}_{2}\left(i\right)\right) &\text{if } h \in \mathbb{H}_{}\\
\left(r, \mathcal{E}_{2}\left(i + 2^{15}\right)\right) &\text{if } \exists r \in \mathbb{H}_{}, h = r^\boxplus\\
\end{cases} \tag{C.37}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-encodetickets">$\mathcal{E}_{T}\left(x\right)$</span> | E sub T of | the tickets bag's bytes: its length, then each ticket's attempt (1 byte) and 784-byte proof |
| <span id="gk-encodepreimages">$\mathcal{E}_{P}\left(x\right)$</span> | E sub P of | the preimages bag's bytes: its length, then each one's service (4 bytes) and its data with its length |
| <span id="gk-encodeguarantees">$\mathcal{E}_{G}\left(x\right)$</span> | E sub G of | the guarantees bag's bytes: its length, then each guarantee |
| <span id="gk-encodeassurances">$\mathcal{E}_{A}\left(x\right)$</span> | E sub A of | the assurances bag's bytes: its length, then each one's anchor, bitfield, validator index (2 bytes) and signature |
| <span id="gk-encodedisputes">$\mathcal{E}_{D}\left(x\right)$</span> | E sub D of | the disputes bag's bytes: the verdicts, the culprits and the faults, each list with its length in front |
| <span id="gk-var">[$\left\updownarrow x\right.\!$](../symbols.md#length-prefix)</span> | with its length | ↕x: x with its length in front, as a compact natural |
| <span id="gk-build">$\left\{ x \;\middle\vert\; y \right\}$</span> | for each, such that | built by a rule: the left-hand value, for every case the right-hand side allows (a set, or a sequence in order) |
| <span id="gk-xt-entryindex">$e$</span> | e | an entered ticket's attempt number, 0 to n − 1: which of its maker's tickets this is |
| <span id="gk-xt-proof">$p$</span> | p | an entered ticket's ring proof: 784 bytes proving a pending validator made it, without saying which |
| <span id="gk-orderedin">$\mathrel{\unicode{x2B40}}$</span> | in order, from | each item of the sequence, in its order |
| <span id="gk-xp-serviceindex">$s$</span> | s | a preimage's service: the id of the service that asked for it, 4 bytes |
| <span id="gk-xp-data" class="gk-wrap">$\mathbf{d}$</span> | d | a preimage's data: the bytes themselves |
| <span id="gk-xa-anchor">$a$</span> | a | an assurance's anchor: the parent block's header hash |
| <span id="gk-xa-availabilities">$f$</span> | f | an assurance's bitfield: one bit per core, 1 for "I hold my piece of its data" |
| <span id="gk-xa-assurer">$v$</span> | v | the assuring validator's index in κ |
| <span id="gk-xv-reporthash">$r$</span> | r | the hash of the work-report on trial |
| <span id="gk-xvj-judgeindex">$i$</span> | i | the judge's index in the validator set the verdict's epoch picks |
| <span id="gk-xv-judgments" class="gk-wrap">$\mathbf{j}$</span> | bold j | a verdict's judgments: the judges' signed votes, two thirds of the judges plus one |
| <span id="gk-encodeunsignedheader">$\mathcal{E}_{U}\left(x\right)$</span> | E sub U of | the header's bytes without its seal: what the seal signs |
| <span id="gk-encodeepochmark">$\mathcal{E}_{E}\left(x\right)$</span> | E sub E of | the epoch mark's bytes: 0 if there is none; else 1, two entropy hashes and the keys with their length |
| <span id="gk-entropyaccumulator" class="gk-wrap">$\eta_0$</span> | eta zero | the entropy accumulator: 32 bytes that every block's VRF output is hashed into |
| <span id="gk-entropy" class="gk-wrap">$\eta$</span> | eta | entropy: four 32-byte values of randomness, the newest mixing in every block |
| <span id="gk-wcX" class="gk-wrap">$\mathbf{x}$</span> | x | a refinement context: the anchor block and the lookup anchor a package was made against, and its prerequisites |
| <span id="gk-workcontext" class="gk-wrap">$\mathbb{C}$</span> | C | the set of refinement contexts: the recent blocks a package was built against, and the packages it needs first |
| <span id="gk-wc-anchortime">$n$</span> | n | the anchor block's timeslot |
| <span id="gk-wc-lookupanchorhash">$l$</span> | l | the lookup anchor's header hash: the block whose state code is fetched from |
| <span id="gk-wc-lookupanchortime">$t$</span> | t | the lookup anchor's timeslot: at most L = 14,400 slots old |
| <span id="gk-wc-prerequisites" class="gk-wrap">$\mathbf{p}$</span> | p | a context's prerequisites: hashes of packages that must be accumulated first |
| <span id="gk-avspec" class="gk-wrap">$\mathbb{Y}$</span> | Y | the set of availability specifications: package hash, bundle length, erasure root, shard count, segments root, segment count |
| <span id="gk-as-erasureroot">$u$</span> | u | the erasure root: one Merkle root over every validator's shard of the bundle and the exports |
| <span id="gk-workdigest" class="gk-wrap">$\mathbb{D}$</span> | D | the set of work-digests: one item's result card, with its service, hashes, gas limit, result and load |
| <span id="gk-wd-codehash">$c$</span> | c | the service's code hash as the guarantors saw it; it must match the chain's |
| <span id="gk-wd-payloadhash">$y$</span> | y | the hash of the item's payload |
| <span id="gk-wd-gaslimit">$g$</span> | g | the gas the item's accumulation may use (`accumulate_gas`) |
| <span id="gk-encoderesult">$O\left(x\right)$</span> | O of | a work result's bytes: 0 then the output with its length, or one byte from 1 to 6 naming the error |
| <span id="gk-wd-result" class="gk-wrap">$\mathbf{l}$</span> | l | the result: the bytes refine returned, or one of six errors |
| <span id="gk-wd-xtcount">$x$</span> | x | how many extrinsic blobs the item used |
| <span id="gk-wd-xtsize">$z$</span> | z | those extrinsics' total size, in bytes |
| <span id="gk-wrX" class="gk-wrap">$\mathbf{r}$</span> | r | a work-report |
| <span id="gk-workreport" class="gk-wrap">$\mathbb{R}$</span> | R | the set of work-reports: a core's signed receipt for one work-package |
| <span id="gk-wr-avspec" class="gk-wrap">$\mathbf{s}$</span> | bold s | a report's availability spec: the package's hash, its bundle's length, and the roots of its pieces and of the segments it exports |
| <span id="gk-wr-context" class="gk-wrap">$\mathbf{c}$</span> | c | a report's refinement context: the blocks its package was built against, and its prerequisites |
| <span id="gk-wr-authtrace" class="gk-wrap">$\mathbf{t}$</span> | t | the authorizer's trace: the blob its code returned when it said yes (`auth_output`) |
| <span id="gk-gX" class="gk-wrap">$\mathbf{g}$</span> | g | a guarantee |
| <span id="gk-guarantee" class="gk-wrap">$\mathbb{G}$</span> | G | the set of guarantees: a work-report, the slot it was made at, and two or three guarantors' signatures |
| <span id="gk-workpackage" class="gk-wrap">$\mathbb{P}$</span> | P | the set of work-packages: up to 16 work-items for one core, with their authorizer and context |
| <span id="gk-wp-authcodehost">$h$</span> | h | the service whose preimages hold the authorizer's code (`auth_code_host`) |
| <span id="gk-wp-authconfig" class="gk-wrap">$\mathbf{f}$</span> | f | the authorizer's configuration blob, its settings (`authorizer_config`) |
| <span id="gk-wp-workitems" class="gk-wrap">$\mathbf{w}$</span> | w | the package's work-items: 1 to 16 |
| <span id="gk-workitem" class="gk-wrap">$\mathbb{W}$</span> | W | the set of work-items: one job for one service, with its payload, gas limits, imports, extrinsics and export count |
| <span id="gk-wi-payload" class="gk-wrap">$\mathbf{y}$</span> | y | the item's payload: the input its refine reads |
| <span id="gk-encodeimportrefs">$I^\#\left(x\right)$</span> | I hash of | each import reference encoded with I, one after another |
| <span id="gk-wi-importsegments" class="gk-wrap">$\mathbf{i}$</span> | i | the segments the item imports: each a segments root (or a package hash) and an index |
| <span id="gk-defxfer" class="gk-wrap">$\mathbb{X}$</span> | X | a deferred transfer: (source, destination, amount, memo, gas), the money moved now, the receiver run in the next round |
| <span id="gk-dx-dest">$d$</span> | d | a transfer's receiver: the service it goes to |
| <span id="gk-dx-memo">$m$</span> | m | a transfer's memo: 128 bytes the sender writes for the receiver's code |
| <span id="gk-operandtuple" class="gk-wrap">$\mathbb{U}$</span> | U | an operand: what accumulate is told about one work-digest: package hash, exports root, authorizer, payload hash, gas, trace and result |
| <span id="gk-workerror" class="gk-wrap">$\mathbb{E}$</span> | E | the set of work errors: out of gas, panic, bad exports, oversize, BAD (no code) and BIG (code too big) |
| <span id="gk-cup">$\cup$</span> | union | everything in either side |
| <span id="gk-blob">[$\mathbb{B}$](../symbols.md#blobs)</span> | B, or B sub n | bytes: any run of them; 𝔹ₙ exactly n of them |
| <span id="gk-infty">$\infty$</span> | infinity | ∞: in a work result, the program ran out of gas |
| <span id="gk-panic">$\unicode{x21AF}$</span> | panic | ↯: the program trapped |
| <span id="gk-badexports" class="gk-wrap">$\circledcirc$</span> | bad exports | the error: the item exported a different number of segments than it said it would |
| <span id="gk-oversize" class="gk-wrap">$\circleddash$</span> | oversize | the error: this output would make the report's outputs bigger than W_R |
| <span id="gk-token">$\texttt{x}$</span> | the string | a name in typewriter type: an instruction's or helper's name, or fixed bytes written as text: the ASCII bytes of its words; the dollar sign in front only marks them as text and is not one of the bytes |
| <span id="gk-encodeimportref">$I\left(x\right)$</span> | I of | one import reference's bytes: a 32-byte hash, then the index in 2 bytes, its top bit set if the hash names a work-package |
| <span id="gk-boxplus">$\boxplus$</span> | boxed | H⊞ marks a hash as a package's hash, to be swapped for that package's segments root |
| <span id="gk-Nbits">[$\mathbb{N}_{2^{x}}$](../symbols.md#naturals)</span> | N sub two to the n | the numbers that fit in n bits: ℕ_{2³²} is a u32 |
| <span id="gk-exists">[$\exists$](../symbols.md#exists)</span> | there exists | there is at least one value such that what follows holds |

</details>

:::

One formula, twenty-two lines. They come in five groups: the block, its five bags, its
header, the work a guarantee carries, and a few small structures other Parts meet.
Everything in them is built from [2.A](../02-codec/gray-paper.md)'s rules: ℰ₄ and ℰ₂ are
fixed-width numbers, a bare letter for a hash or a signature is itself, ↕ is a length in
front, and ¿ is maybe.

### (C.16): the block

**Read it aloud.** "E of B equals E of: H, E sub T of E sub T, E sub P of E sub P, E sub G
of E sub G, E sub A of E sub A, E sub D of E sub D."

**In plain words.** A block's bytes are its header's, then the five bags', in this order:
tickets, preimages, guarantees, assurances, disputes. Not (4.3)'s order: the encoding's
order is the one that counts on the wire.

**On a real value.** The tiny `block.bin`, 5,150 bytes:

```text
bytes 0 to 777         ℰ(H)       the header: 778 bytes
bytes 778 to 3,133     ℰ_T(E_T)   3 tickets: 1 + 3 × (1 + 784) = 2,356 bytes
bytes 3,134 to 3,197   ℰ_P(E_P)   3 preimages: 64 bytes
bytes 3,198 to 3,818   ℰ_G(E_G)   1 guarantee: 621 bytes
bytes 3,819 to 4,017   ℰ_A(E_A)   2 assurances: 199 bytes
bytes 4,018 to 5,149   ℰ_D(E_D)   2 verdicts, 2 culprits, 1 fault: 1,132 bytes
```

**In your client.** `Block` and `Extrinsic` in `src/block.ts`
([4.7](./07-the-block.md#the-code)).

### (C.17) to (C.21): the five bags

**Read it aloud.** "E sub T of the tickets equals E of: up-down-arrow, the sequence of E sub
1 of e and p, for each e and p in order in the tickets. E sub P of the preimages equals E
of up-down-arrow, the sequence of E sub 4 of s and up-down-arrow d, for each s and d in
order. E sub G of the guarantees equals E of up-down-arrow the guarantees. E sub A of the
assurances equals E of up-down-arrow, the sequence of a, f, E sub 2 of v, and s, for each
in order. E sub D of v, c, f equals E of: up-down-arrow, the sequence of r, E sub 4 of a,
and up-down-arrow the sequence of v, E sub 2 of i, and s, for each judgment in j, for each
verdict in v; up-down-arrow c; up-down-arrow f."

**In plain words.** Every bag is a list with its length in front, and each line says how
one item is written:

- **a ticket** (C.17): its attempt in 1 byte, then its 784-byte proof;
- **a preimage** (C.18): the service in 4 bytes, then its data with its length;
- **a guarantee** (C.19): as (C.30) below;
- **an assurance** (C.20): the anchor hash a, the bitfield f (bare, its length known from
  C), the validator in 2 bytes, the signature s;
- **the disputes** (C.21): three lists. A verdict is the report's hash r, the epoch a in 4
  bytes, then its votes with their length, each a yes-or-no v, the voter in 2 bytes and a
  signature; then the culprits, then the faults.

**On a real value.** The first of the tiny `block.json`'s three preimages:

```text
03                    ↕: three preimages, 1 byte
04 03 02 01           ℰ₄(s): service 0x01020304, 4 bytes
10                    ↕d: the data's length, 16, 1 byte
81 09 5e 61 … c8 33   d: the data, 16 bytes
                      each preimage 4 + 1 + 16 = 21 bytes; 1 + 3 × 21 = 64
```

**In your client.** `TicketsExtrinsic` and `PreimagesExtrinsic`
([4.1](./01-tickets-and-preimages.md#the-code)), `AssurancesExtrinsic`
([4.2](./02-tiny-and-full.md#a-codec-that-depends-on-the-size)), `GuaranteesExtrinsic`
([4.3](./03-guarantees.md#the-code)) and `DisputesExtrinsic`
([4.4](./04-disputes.md#the-code)), all in `src/block.ts`.

### (C.22) to (C.25): the header

**Read it aloud.** "E of H equals E of: E sub U of H, and H sub S. E sub U of H equals E
of: H sub P, H sub R, H sub X, E sub 4 of H sub T, E sub E of H sub E, maybe H sub W, E
sub 2 of H sub I, H sub V, up-down-arrow H sub O. E sub E of nothing equals E of 0. E sub
E of eta zero, eta one, k, equals E of 1, eta zero, eta one, up-down-arrow k."

**In plain words.** ℰ_U is the header without its seal, the bytes the author signs; the
full header is those bytes and then the seal. The fields go in this order: three hashes,
the slot in 4 bytes, the epoch mark, the tickets mark with ¿, the author in 2 bytes, the
VRF signature, the offenders with their length. The epoch mark has its own little rule
that works like ¿: `00` for none, or `01`, the two entropy hashes, and the validators' keys with
their length (the count may change, so it is written).

**On a real value.** `header_0`, 778 bytes:

```text
5c74… 2591… 74a9…     H_P, H_R, H_X: three hashes, 96 bytes
2a 00 00 00           ℰ₄(H_T): slot 42, 4 bytes
01 ae85… 333a… 06 …   ℰ_E(H_E): 1, η₀, η₁, then 06 and 6 × 64 bytes of keys: 450 bytes
00                    ¿H_W: no tickets mark, 1 byte
03 00                 ℰ₂(H_I): author 3, 2 bytes
ae85… (96 bytes)      H_V, 96 bytes
01 4418fb8c…          ↕H_O: one offender's key, 1 + 32 = 33 bytes
(96 bytes)            H_S, the seal: what (C.22) adds to ℰ_U
                      96 + 4 + 450 + 1 + 2 + 96 + 33 + 96 = 778 bytes
```

**In your client.** `Header`, `EpochMark` and `TicketBody` in `src/block.ts`
([4.6](./06-the-header.md#the-code)). Your client never needs ℰ_U on its own until it
checks a seal, in [Part 8](../08-safrole/index.md).

### (C.26) to (C.32): the work a guarantee carries

**Read it aloud.** Each line is "E of x, where x is in this set, is defined as E of" its
fields in order. (C.26), a refinement context: x sub a, E sub 4 of x sub n, x sub s, x sub
b, x sub l, E sub 4 of x sub t, x sub r, up-down-arrow x sub p. (C.27), an availability
spec: x sub p, E sub 4 of x sub l, x sub u, E sub 2 of x sub v, x sub e, E sub 2 of x sub
n. (C.28), a work digest: E sub 4 of d sub s, d sub c, d sub y, E sub 8 of d sub g, O of d
sub l, then d sub u, i, x, z and e. (C.29), a work-report: r sub s, r sub c, r sub c, r sub
a, r sub g, then up-down-arrow r sub t, r sub l and r sub d. (C.30), a guarantee: g sub r,
E sub 4 of g sub t, up-down-arrow the sequence of E sub 2 of v and s, for each v and s in
order in g sub a. (C.31), a work-package: E sub 4 of p sub h, p sub u, p sub c, then
up-down-arrow p sub j, p sub f and p sub w. (C.32), a work item: E sub 4 of w sub s, w sub
c, E sub 8 of w sub g, E sub 8 of w sub a, E sub 2 of w sub e, up-down-arrow w sub y,
up-down-arrow I hash of w sub i, up-down-arrow the sequence of h and E sub 4 of i, for each
in w sub x.

**In plain words.** These are the structures of [Part 3](../03-work-and-reports/index.md)
and [4.3](./03-guarantees.md): what a core computed, and what it reports. They are in this
formula because a guarantee carries a whole work-report, so the block's bytes include
them. Two things to see in them. Hashes go bare, and most numbers get a width. But the
five numbers at the end of a work digest (C.28), the gas used and the counts of imports,
extrinsics, their size and exports, have no ℰ₄ or ℰ₈: they are compact naturals, small
numbers in few bytes. So are a report's core index and gas in (C.29). A guarantee (C.30) is the report, the
slot in 4 bytes, and its signatures with their length, each the validator in 2 bytes and
64 bytes of Ed25519.

**On a real value.** The tiny `work_result_0`, a work digest of 86 bytes:

```text
04 03 02 01           ℰ₄(d_s): service 0x01020304, 4 bytes
70a5…532e             d_c: the code hash, 32 bytes
fa99…8696             d_y: the payload hash, 32 bytes
2a 00 00 00 00 00 00 00   ℰ₈(d_g): 42 gas to accumulate, 8 bytes
00 03 aa bb cc        O(d_l): 0 for "a result", then ↕ of the 3 bytes aa bb cc: 5 bytes
00 00 00 00 00        d_u, d_i, d_x, d_z, d_e: five zeros, compact, 1 byte each
                      4 + 32 + 32 + 8 + 5 + 5 = 86 bytes
```

**In your client.** `RefineContext` and `WorkItem` in `src/work.ts`
([2.6](../02-codec/06-the-first-test-vectors.md#the-structures)), `WorkPackage`
([3.1](../03-work-and-reports/01-a-work-package.md#the-code)), `WorkDigest`
([3.2](../03-work-and-reports/02-work-digests.md#the-code)), `AvailabilitySpec` and
`WorkReport` ([3.3](../03-work-and-reports/03-a-work-report.md#the-code)), and
`ReportGuarantee` in `src/block.ts` ([4.3](./03-guarantees.md#the-code)).

### (C.33) to (C.37): tickets, transfers, operands, results, imports

**Read it aloud.** "E of x, a ticket, is E of x sub y and E sub 1 of x sub e. E of x, a
deferred transfer, is E of 1, E sub 4 of x sub s, E sub 4 of x sub d, E sub 8 of x sub a,
x sub m, E sub 8 of x sub g. E of x, an operand tuple, is E of 0, x sub p, x sub e, x sub
a, x sub y, x sub g, O of x sub l, up-down-arrow x sub t. O of o is: 0 and up-down-arrow
o, if o is bytes; 1 if o is infinity; 2 if it is a panic; 3, 4, 5 or 6 for the other
errors. I of h and i is: h and E sub 2 of i, if h is a hash; r and E sub 2 of i plus 2 to
the 15, if h is r boxed."

**In plain words.** Five small ones:

- **a ticket** (C.33): its 32-byte id, then its attempt in 1 byte. The header's tickets
  mark is a list of these.
- **a deferred transfer** (C.34) and **an operand tuple** (C.35): what a service's
  accumulate reads as its inputs. Each starts with a 1 or a 0, a discriminator that says
  which kind it is, since both arrive in one list.
- **a work result** (C.36), O: the output with a `00` in front, or one byte naming what went
  wrong: 1 out of gas, 2 a panic, 3 a bad export count, 4 too big, 5 the code
  unavailable (BAD), 6 the code too big (BIG).
- **an import reference** (C.37), I: which segment a work item reads, as a 32-byte root and
  a 2-byte index. If the hash is a work-package's hash rather than a segment root (the ⊞
  mark), the index gets 2^15 added: its top bit set, so 2 bytes say both.

**On a real value.** `header_1`'s first winning ticket, (C.33):

```text
8c 25 c0 63 … 74 4c 7b    x_y: the ticket's id, 32 bytes
00                        ℰ₁(x_e): attempt 0, 1 byte
                          33 bytes
```

And O on the work digest above: its result is `ok` with `0xaabbcc`, so `00 03 aa bb cc`; a
digest whose program ran out of gas would hold the single byte `01` there instead.

**In your client.** `TicketBody` ([4.6](./06-the-header.md#the-code)), `WorkResult`
([3.2](../03-work-and-reports/02-work-digests.md#the-code)), `ImportSpec`
([2.6](../02-codec/06-the-first-test-vectors.md#the-structures)), `Operand`
([16.7](../16-host-calls/07-a-services-inputs.md#the-code)) and `Transfer`
([17.3](../17-accumulation/03-sending-a-transfer.md#the-code)).

## Say it in one breath

A block is a header and five bags (4.2, 4.3); a header is ten fields (5.1), among them a
slot that only moves forward and never ahead of the clock (5.8), an author named by its
place in κ′ (5.10), and three markers, two of them optional (5.11). On the bytes, a maybe
is `00` or `01` and the value (C.8), and bits go eight to a byte, lowest first (C.9).
Appendix C's block lines (C.16 to C.37) put it all in one order: the header without its
seal, then the seal, then tickets, preimages, guarantees, assurances, disputes, each a
list with its length in front, every number at its own width and every hash as itself.
