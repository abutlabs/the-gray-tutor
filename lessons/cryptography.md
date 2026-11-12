# Cryptography we use

Your client is TypeScript you write yourself, with one exception: cryptography. A hash, a
signature or a VRF is a published standard that's easy to get subtly wrong: one wrong byte
and every check fails, or worse, a check passes that shouldn't. So for these, and only
these, your client calls open-source libraries written by specialists. This page lists
them: what each does, where JAM uses it, which library does it, and the lesson that brings
it in.

Tap an algorithm to light the bytes of a real block it made, or holds the keys of. The
block is the tiny test vector's, from [Part 4](./04-blocks/index.md); its three ring proofs alone are
2,352 of its 5,150 bytes.

<CryptoMap />

## The algorithms

The Gray Paper names them in §3.8 (*Cryptography*), and the Bandersnatch ones in
Appendix G. One more piece of its mathematics, Appendix H's erasure coding, needs no
library because your client never runs it; it is [at the end of this
page](#erasure-coding-appendix-h), in the paper's words.

### Blake2b-256

H(x), JAM's hash: a 32-byte fingerprint of any data. "JAM" hashes to `bf77ce74…` and "JAN"
to `7f4c0e47…`: one letter changed, a whole new fingerprint. Headers, reports, the state
trie and the extrinsic are all hashed with it. *Standard:* RFC 7693. *Library:*
`@noble/hashes`, from [lesson 5.1](./05-hashing-and-signatures/01-hashes.md).

### Keccak-256

H_K(x), Ethereum's hash, also 32 bytes. JAM uses it for the one root a bridge to an
Ethereum-style chain reads: the belt of accumulation outputs, which a report carries as
`beefy_root`. "JAM" hashes to `4924ad2a…`. It isn't SHA3-256, which pads its input
differently and gives `c16d7737…`. *Standard:* Keccak, as Ethereum uses it. *Library:*
`@noble/hashes`, from [lesson 9.1](./09-recent-history/01-the-mountain-belt.md).

### SHA-512

A 64-byte hash that no field of a block shows: a VRF's output is the first 32 bytes of one,
and Ed25519 uses it inside. *Library:* `@noble/hashes`, from [lesson 8.6](./08-safrole/06-the-vrf-output.md).

### Ed25519

JAM's everyday signature: a 32-byte public key and a 64-byte signature. Guarantors sign
reports, validators sign assurances, judges sign votes, and culprits and faults carry
signatures as evidence. *Standard:* RFC 8032. *Library:* `@noble/curves`, from
[lesson 5.3](./05-hashing-and-signatures/03-signatures.md).

### Bandersnatch VRF

A VRF is a signature that also gives a random number: only the key's owner could make it,
anyone can check it, and nobody, the owner included, could have picked the number. A
block's author seals it with one (96 bytes), and signs a second, the entropy source, that
feeds JAM's randomness. Bandersnatch is the elliptic curve it runs on, built over
BLS12-381's numbers so that the ring proofs below are practical. *Standard:* RFC 9381's
VRF, as the Bandersnatch VRF specification (Hosseini and Galassi) sets it out for JAM.
*Library:* `@typeberry/native`, from [lesson 8.9](./08-safrole/09-seals.md).

### Bandersnatch ring VRF

The same, anonymous: a 784-byte proof that *one of* a list of keys, the ring, made it,
without saying which. Every ticket carries one, so the lottery's winners stay secret until
their slot comes. The ring is kept as a 144-byte ring root, γ_Z. Under the hood it's a
zero-knowledge proof, with a pairing on BLS12-381 and 590 KB of public parameters every
checker shares. *Standard:* the same specification, after Burdges and others' ring VRF
paper (2023). *Library:* `@typeberry/native`, from [lesson 8.8](./08-safrole/08-the-ring-root.md).

### BLS

Signatures that combine: many validators' signatures merge into one. Every validator has a
144-byte BLS key (bytes 64 to 207 of its 336-byte validator key) for BEEFY (§18): each
validator signs every finalized block's accumulation root, so bridges can follow JAM
cheaply. That happens beside block import, not in it, so your client never checks a BLS
signature and installs nothing for it.

## The libraries

The audits are as each library's own README lists them:

- **`@noble/hashes` 2.4.0**, by Paul Miller, MIT licence. Audited by Cure53 in January
  2022, at 1.0.0, with Blake2b, Keccak and SHA-512 in scope.
- **`@noble/curves` 2.4.0**, by Paul Miller, MIT licence. Audited by Trail of Bits in August
  2026, at 2.3.0, everything; by Cure53 in September 2024, at 1.6.0, with Ed25519 in scope;
  and twice before that.
- **`@typeberry/native` 0.5.1**, by Fluffy Labs, MPL-2.0 licence. No audit claimed.
- **ark-vrf**, inside it, by Davide Galassi, MIT licence. No audit claimed.

`@typeberry/native` is the Bandersnatch library another JAM team, Fluffy Labs, made for
their client, typeberry. It wraps ark-vrf, the Rust library behind the specification the
Gray Paper cites, as WebAssembly and native code, so it runs in Node.

Why trust the two without an audit? ark-vrf is written by one of the specification's two
authors, who also makes the official test vectors, so a client that disagrees with it fails
them; and your client checks the wrapper the same way, against every vector its tickets
and seals appear in. Passing vectors shows agreement, not safety: the right bar for a
client you learn from, not enough on its own for one that holds real value.

<details>
<summary>lasair: the same choices, from OCaml</summary>

lasair hashes with digestif, an OCaml library, and reaches Rust for the rest, through its
own bindings in `rust/`: ed25519-consensus for Ed25519, and ark-vrf 0.1 for Bandersnatch.
Different libraries, the same standards: both clients pass the same vectors.

</details>

## Erasure coding, Appendix H

A guarantor cuts each work-package's data into one chunk per validator, so cleverly that
any third of the chunks rebuild the whole. Every validator keeps its chunk and says so in
its assurance; an auditor, or a later package, fetches a third of them and rebuilds.
[3.3](./03-work-and-reports/03-a-work-report.md) draws the big picture, and the erasure
root that vouches for every chunk. Your client never cuts or rebuilds anything: block
import only counts the assurances. The `erasure/` vectors test it, and this tutorial
leaves them aside ([0.5](./00-start/05-understanding-the-vectors.md)).

If you build web services: RAID for a network. A RAID array survives a lost disk; this
survives almost two thirds of the validators going missing.

::: gray-paper H

#### Appendix H Erasure Coding {#gp-H}

<a id="gp-H-p1"></a>The foundation of the data-availability and distribution system of JAM is a systematic Reed-Solomon erasure coding function in GF($2^{16}$), the same transform as done by the algorithm of Lin et al. 2014. The coding rate is $\mathcal{D}(v)$:$v$, where $v \in \mathbb{V}$ is the number of validators.

<a id="gp-H-p2"></a><a id="eq-H-1"></a>

$$
\begin{equation}
\mathcal{D}(v \in \mathbb{V}) \equiv \max\left(\left\{\,d \;\middle\vert\; d \in \mathbb{N}_{{}^{v}\!/_{3} + 2}, \mathsf{W}_G \ \%\  2d = 0\,\right\}\right) \tag{H.1}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-fnecoriginalshards" class="gk-wrap">$\mathcal{D}$</span> | D | how many shards rebuild the data: 342 of 1,023 on full, 3 of 6 on tiny |
| <span id="gk-in">[$\in$](./symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-valcount" class="gk-wrap">$\mathbb{V}$</span> | V (the set) | the validator counts allowed: multiples of 3 from 6 to 3C, which is 1,023 on full and 6 on tiny |
| <span id="gk-equiv">[$\equiv$](./symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-max">$\max$</span> | max of | the largest of the values in the brackets |
| <span id="gk-set">$\left\{\,x\,\right\}$</span> | the set of | a set: values with no order and no repeats |
| <span id="gk-build">$\left\{ x \;\middle\vert\; y \right\}$</span> | for each, such that | built by a rule: the left-hand value, for every case the right-hand side allows (a set, or a sequence in order) |
| <span id="gk-Nmax">[$\mathbb{N}_{x}$](./symbols.md#naturals)</span> | N sub n | the whole numbers below n: ℕ_C is a core index, 0 to C − 1 |
| <span id="gk-nicefrac">${}^{x}\!/_{y}$</span> | over | a fraction: the top divided by the bottom |
| <span id="gk-Csegmentsize" class="gk-wrap">$\mathsf{W}_G$</span> | W sub G | a segment's size: 4,104 bytes |
| <span id="gk-rem">[$\ \%\$](./symbols.md#mod)</span> | mod | the remainder after dividing |

</details>

<a id="gp-H-p3"></a>This rate is derived from the fact we wish to be able to reconstruct even should almost two-thirds of the $v$ validators be malicious or incapacitated, the 16-bit Galois field on which the erasure-code is based and the desire to support, for simplicity, encoding segments of size $\mathsf{W}_G$ without padding. The rate is optimal, i.e.  there is no more redundancy than necessary, when $\mathcal{D}(v) = {}^{v}\!/_{3} + 1$. This occurs when $v \in \left\{\,6, 9, 15, 24, 33, 51, 54, 78, 105, 111, 159, 168, 225, 321, 339, 510, 681, 1023\,\right\}$. Note that the rate is least efficient when $v$ is slightly below one of these values. For example, when $v = 1022$, the rate is approximately 1:4.5. It is recommended, for efficiency of the data availability system, that validator set sizes be chosen from the given set.

<a id="gp-H-p4"></a>We use a little-endian $\mathbb{B}_{2}$ form of the 16-bit GF points with a functional equivalence given by $\mathcal{E}_{2}$. From this we may assume the encoding function $\mathcal{C}^{v \in \mathbb{V}}_{}: \left[\!\left[\mathbb{B}_{2}\right]\!\right]_{\mathcal{D}(v)} \to \left[\!\left[\mathbb{B}_{2}\right]\!\right]_{v}$ and the recovery function $\mathcal{R}^{v \in \mathbb{V}}_{}: \left\{\mkern-5mu\left[\,\!\left\lgroup\mathbb{B}_{2}, \mathbb{N}_{v}\right\rgroup\!\,\right]\mkern-5mu\right\}_{\mathcal{D}(v)} \to \left[\!\left[\mathbb{B}_{2}\right]\!\right]_{\mathcal{D}(v)}$. Encoding is done by extrapolating a data blob of size $2 \cdot \mathcal{D}(v)$ <abbr class="gp-term" title="bytes: 8 bits each">octets</abbr> (provided in $\mathcal{C}^{v}_{}$ here as $\mathcal{D}(v)$ <abbr class="gp-term" title="a byte: 8 bits">octet</abbr> pairs) into $v$ octet pairs. Recovery is done by collecting together any distinct $\mathcal{D}(v)$ octet pairs, together with their indices, and transforming this into the original sequence of $\mathcal{D}(v)$ octet pairs.

<a id="gp-H-p5"></a>Practically speaking, this allows for the efficient encoding and recovery of data whose size is a multiple of $2 \cdot \mathcal{D}(v)$ octets. Data whose length is not divisible by $2 \cdot \mathcal{D}(v)$ must be padded (we pad with zeroes). We use this erasure-coding in two contexts within the JAM protocol; one where we encode variable sized (but typically very large) data blobs for the <abbr class="gp-term" title="the short-term store of bundles for auditors, kept until finality">Audit DA</abbr> and block-distribution system, and the other where we encode much smaller fixed-size data *segments* for the Import DA system.

<a id="gp-H-p6"></a>For the Import DA system, we deal with an input size of $\mathsf{W}_G = \text{4,104}$ octets resulting in data-parallelism of order 6 with 1023 validators. We may attain a greater degree of data parallelism if encoding or recovering more than one segment at a time though for recovery, we may be restricted to requiring each segment to be formed from the same set of indices (depending on the specific algorithm).

:::

**(H.1), read it aloud.** "D of v is defined as the largest d below v over 3 plus 2 such
that W sub G mod 2d is 0." **What it means.** D(v) is how many chunks it takes to rebuild:
about a third of v, and no more than v/3 + 1, chosen so that a 4,104-byte segment (W_G)
divides into whole rows of D two-byte words, with no padding. **On a real value.**

```text
tiny, v = 6      d below 6/3 + 2 = 4:   1, 2, 3
                 4,104 mod 2, mod 4, mod 6 are all 0     D(6) = 3
full, v = 1,023  d below 1,023/3 + 2 = 343: the largest is 342
                 4,104 mod 684 = 0 (684 × 6 = 4,104)      D(1,023) = 342
```

So on tiny any 3 of the 6 chunks rebuild the data; on full, any 342 of 1,023. Both are
the case the paper calls optimal, D(v) = v/3 + 1. And on full a segment makes
4,104 / 684 = 6 rows, so each chunk of it is 6 two-byte words: the six the text mentions
for 1,023 validators.

::: gray-paper H.1 1-4

#### Appendix H.1 Blob Encoding and Recovery {#gp-H-1}

<a id="gp-H-1-p1"></a>We assume $v \in \mathbb{V}$ validators and some data blob $\mathbf{d} \in \mathbb{B}_{2k \cdot \mathcal{D}(v)}, k \in \mathbb{N}$. This blob is split into a whole number of $k$ pieces, each a sequence of $\mathcal{D}(v)$ octet pairs. Each piece is <abbr class="gp-term" title="cut into one piece per validator, so that any third of the pieces rebuild the whole">erasure-coded</abbr> using $\mathcal{C}^{v}_{}$ as above to give $v$ octet pairs per piece.

<a id="gp-H-1-p2"></a>The resulting matrix is grouped by its pair-index and concatenated to form $v$ *chunks*, each of $k$ octet-pairs. Any $\mathcal{D}(v)$ of these chunks may then be used to reconstruct the original data $\mathbf{d}$.

<a id="gp-H-1-p3"></a>Formally we begin by defining two utility functions for splitting some large sequence into a number of equal-sized sub-sequences and for reconstituting such subsequences back into a single large sequence:

<a id="gp-H-1-p4"></a><a id="eq-H-2"></a><a id="eq-H-3"></a>

$$
\begin{align}
\forall n \in \mathbb{N}, k \in \mathbb{N} :\ &\text{split}_{n}(\mathbf{d} \in \mathbb{B}_{kn}) \in \left[\!\left[\mathbb{B}_{n}\right]\!\right]_{k} \equiv \left[\mathbf{d}_{0 \dots+ n}, \mathbf{d}_{n \dots+ n}, \cdots, \mathbf{d}_{(k-1)n \dots+ n}\right] \tag{H.2} \\
\forall n \in \mathbb{N}, k \in \mathbb{N} :\ &\text{join}(\mathbf{c} \in \left[\!\left[\mathbb{B}_{n}\right]\!\right]_{k}) \in \mathbb{B}_{kn} \equiv \mathbf{c}_0 \frown \mathbf{c}_1 \frown \dots \tag{H.3}
\end{align}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-forall">$\forall$</span> | for all | for every value: ∀c ∈ ℕ_C means for each core c |
| <span id="gk-N" class="gk-wrap">[$\mathbb{N}$](./symbols.md#naturals)</span> | N | the whole numbers: 0, 1, 2 and up; a subscript is a bound, ℕ₈ is 0 to 7 |
| <span id="gk-spl">$\text{split}_{x}$</span> | split n of | cuts a blob into equal slices of n bytes each |
| <span id="gk-blob">[$\mathbb{B}$](./symbols.md#blobs)</span> | B, or B sub n | bytes: any run of them; 𝔹ₙ exactly n of them |
| <span id="gk-sequence">[$\left[\!\left[x\right]\!\right]$](./symbols.md#sequence)</span> | a sequence of | ⟦T⟧ is an array of T; a subscript is its length, :n at most n, n: at least n |
| <span id="gk-sq">[$\left[x\right]$](./symbols.md#sequence)</span> | the sequence | a sequence written out item by item; [ ] is the empty one |
| <span id="gk-subrange">$_{x \dots+ y}$</span> | from x, y of them | y items, starting at index x |
| <span id="gk-join">$\text{join}$</span> | join | glues a sequence of blobs back into one, end to end |
| <span id="gk-concat" class="gk-wrap">[$\frown$](./symbols.md#concat)</span> | concatenate | join: the left sequence followed by the right |

</details>

:::

**(H.2) and (H.3), read aloud.** "For every n and k: split n of d, a blob of k times n
bytes, is a sequence of k blobs of n bytes: d from 0, n of them; d from n, n of them; and
so on to d from k − 1 times n. join of c, k blobs of n bytes, is c-0 joined to c-1 joined to
the rest." **What it means.** split_n cuts a blob into equal n-byte slices; join glues
slices back. **On a value.** split₂ of the six bytes `61 5d 17 00 00 00` is
[`615d`, `1700`, `0000`], and join of that is the six bytes again.

::: gray-paper H.1 5-6

#### Appendix H.1 Blob Encoding and Recovery, continued

<a id="gp-H-1-p5"></a>We define the transposition operator hence:

<a id="gp-H-1-p6"></a><a id="eq-H-4"></a>

$$
\begin{equation}
{}^\text{T}\left[\left[\mathbf{x}_{0, 0}, \mathbf{x}_{0, 1}, \mathbf{x}_{0, 2}, \dots\right], \left[\mathbf{x}_{1, 0}, \mathbf{x}_{1, 1}, \dots\right], \dots\right] \equiv \left[\left[\mathbf{x}_{0, 0}, \mathbf{x}_{1, 0}, \mathbf{x}_{2, 0}, \dots\right], \left[\mathbf{x}_{0, 1}, \mathbf{x}_{1, 1}, \dots\right], \dots\right] \tag{H.4}
\end{equation}
$$

:::

**(H.4), read it aloud.** "The transpose of the sequence of rows x-0 and x-1 is the
sequence of columns." **What it means.** Rows become columns, as in a spreadsheet:
[[a, b, c], [d, e, f]] becomes [[a, d], [b, e], [c, f]]. The code needs it twice: once to
line the data up word by word, once to hand each validator its column.

::: gray-paper H.1 7-8

#### Appendix H.1 Blob Encoding and Recovery, continued

<a id="gp-H-1-p7"></a>We may then define our erasure-code chunking function which accepts an arbitrary sized data blob whose length divides wholly into $2 \cdot \mathcal{D}(v)$ octets and results in a sequence of $v$ smaller blobs:

<a id="gp-H-1-p8"></a><a id="eq-H-5"></a>

$$
\begin{equation}
\mathcal{C}^{v \in \mathbb{V}}_{k \in \mathbb{N}}\colon\left\{ \begin{aligned}
\mathbb{B}_{2k \cdot \mathcal{D}(v)} &\to \left[\!\left[\mathbb{B}_{2k}\right]\!\right]_{v} \\
\mathbf{d} &\mapsto \text{join}^\#\left({}^{\text{T}}\left[\mathcal{C}^{v}_{}\left(\mathbf{p}\right) \;\middle\vert\; \mathbf{p} \mathrel{\unicode{x2B40}} {}^\text{T}\text{split}_{2}^\#(\text{split}_{2k}(\mathbf{d}))\right]\right)
\end{aligned} \right. \tag{H.5}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-fnerasurecode">$\mathcal{C}^{x}_{y}$</span> | C | the erasure-coding function |
| <span id="gk-abracegroup">$\left\{ \begin{aligned}x\end{aligned} \right.$</span> | as follows | a brace grouping lines that hold together: for a function, its type on top, then what each input becomes |
| <span id="gk-cdot">$\cdot$</span> | times | multiply |
| <span id="gk-to">[$\to$](./symbols.md#to)</span> | to | what goes in, to what comes out: A → B takes an A and gives a B |
| <span id="gk-mapsto">$\mapsto$</span> | maps to | what a function gives back for an input: x ↦ y says x becomes y |
| <span id="gk-erasurecode">$\mathcal{C}^{x}_{y}\left(z\right)$</span> | C, v shards, k pieces, of | erasure-code: cut data of k pieces into v shards, any D(v) of which rebuild it |
| <span id="gk-orderedin">$\mathrel{\unicode{x2B40}}$</span> | in order, from | each item of the sequence, in its order |

</details>

:::

**(H.5), read it aloud.** "C sub k, for v validators, takes a blob of 2k times D of v
bytes to a sequence of v blobs of 2k bytes: d goes to join, for each, of the transpose of
the sequence of C of p, for each p in order in the transpose of split₂, for each, of
split 2k of d." **What it means**, inside out:

1. split_{2k}(d): cut the data into D(v) slices of 2k bytes.
2. split₂ on each: cut every slice into k two-byte words.
3. Transpose: k rows, row p holding word p of every slice, D(v) words a row.
4. Code each row into v words with 𝒞, the erasure code of the text above.
5. Transpose back and join each: chunk i is word i of every row, 2k bytes.

**On a real value.** The tiny vector `ec-3`: the 3 bytes `61 5d 17`, padded with zeros to
2 × D(6) = 6 bytes, so k = 1, one row:

```text
data, padded       61 5d 17 00 00 00
split, one row     615d   1700   0000                 D(6) = 3 words
coded, 6 words     615d   1700   0000   59d0   0615   756d
chunk i            word i: chunk 0 is 615d, chunk 3 is 59d0
```

The vector's six shards are exactly those six words. The first three are the data
itself, untouched: that is what systematic means. Only chunks 3 to 5 are new. In
`ec-100`, 100 bytes padded to 102 make k = 17, so each chunk is 34 bytes, and chunk 0 is
the data's first 34 bytes.

::: gray-paper H.1 9-

#### Appendix H.1 Blob Encoding and Recovery, continued

<a id="gp-H-1-p9"></a>The original data may be reconstructed with any $\mathcal{D}(v)$ of the $v$ resultant items (along with their indices). If the original $\mathcal{D}(v)$ items are known then reconstruction is just their concatenation.

<a id="gp-H-1-p10"></a><a id="eq-H-6"></a>

$$
\begin{equation}
\mathcal{R}^{v \in \mathbb{V}}_{k \in \mathbb{N}}\colon\left\{ \begin{aligned}
\left\{\mkern-5mu\left[\,\!\left\lgroup\mathbb{B}_{2k}, \mathbb{N}_{v}\right\rgroup\!\,\right]\mkern-5mu\right\}_{\mathcal{D}(v)} &\to \mathbb{B}_{2k \cdot \mathcal{D}(v)} \\
\mathbf{c} &\mapsto \begin{cases}
\mathcal{E}_{}\left(\left[\mathbf{x} \;\middle\vert\; \left(\mathbf{x}, i\right) \mathrel{\unicode{x2B40}} \left[\left(\mathbf{x}, i\right) \in \mathbf{c}\,\wr\,i\right]\right]\right) &\text{if } \left\{\,i \;\middle\vert\; \left(\mathbf{x}, i\right) \in \mathbf{c}\,\right\} = \mathbb{N}_{\mathcal{D}(v)}\\
\text{join}(\text{join}^\#({}^\text{T}\left[
\mathcal{R}^{v}_{}\left({\left\{\,
(\text{split}_{2}(\mathbf{x})_{p}, i)
\;\middle\vert\;
\left(\mathbf{x}, i\right) \in \mathbf{c}
\,\right\}}\right)
\;\middle\vert\;
p \in \mathbb{N}_{k}
\right])) &\text{always}\\
\end{cases}
\end{aligned} \right. \tag{H.6}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-fnecrecover">$\mathcal{R}^{x}_{y}$</span> | R | erasure recovery: any D(v) chunks, with which validator each came from, in; the original data out |
| <span id="gk-protoset">$\left\{\mkern-5mu\left[\,x\,\right]\mkern-5mu\right\}$</span> | the set of | a set written in order: no repeats, kept sorted |
| <span id="gk-tuple">$\!\left\lgroup x\right\rgroup\!$</span> | the tuple of | a record: named fields, each with its type, like an object in JSON |
| <span id="gk-encode">[$\mathcal{E}\left(x\right)$](./symbols.md#encode)</span> | E of | the encoding of what's in the brackets: its bytes, by Appendix C's rules |
| <span id="gk-sqorderby">$\left[y\,\wr\,x\right]$</span> | sorted by | the sequence's items, sorted by the key on the right |
| <span id="gk-ecrecover">$\mathcal{R}^{x}_{y}\left(z\right)$</span> | R of | recovers the D(v) message words from any D(v) of the v coded words, given which validator each came from |

</details>

<a id="gp-H-1-p11"></a>Segment encoding/decoding may be done using the same functions albeit with a fixed $k = {}^{\mathsf{W}_G}\!/_{2 \cdot \mathcal{D}(v)}$. Note that the definition of $\mathcal{D}$ ensures this is always an integer, i.e.  no padding is required.

:::

**(H.6), read it aloud.** "R sub k, for v validators, takes a set of D of v pairs, each a
blob of 2k bytes and an index below v, to a blob of 2k times D of v bytes: c goes to the
encoding of the blobs sorted by index, when the indices are exactly 0 to D of v minus 1;
otherwise, the join of joins of the transpose of, for each word position p below k, R of
the set of each chunk's word p with its index." **What it means.** Given D(v) chunks and
which validator each came from: if they happen to be chunks 0 to D(v) − 1, the original
slices, just glue them in order. Otherwise rebuild word position by word position, with ℛ,
and glue the result. **On a real value.** From `ec-3`, chunks 0, 1 and 2 are `615d`, `1700`
and `0000`: glued, `61 5d 17 00 00 00`, the data and its padding. From chunks 3, 4 and 5
the field arithmetic below gets the same six bytes back.

::: gray-paper H.2

#### Appendix H.2 Code Word representation {#gp-H-2}

<a id="gp-H-2-p1"></a>For the sake of brevity we call each octet pair a *word*. The code words (including the message words) are treated as element of $\mathbb{F}_{2^{16}}$ finite field. The field is generated as an extension of $\mathbb{F}_2$ using the irreducible polynomial:

<a id="gp-H-2-p2"></a><a id="eq-H-7"></a>

$$
\begin{equation}
x^{16} + x^5 + x^3 + x^2 + 1 \tag{H.7}
\end{equation}
$$

<a id="gp-H-2-p3"></a>Hence:

<a id="gp-H-2-p4"></a><a id="eq-H-8"></a>

$$
\begin{equation}
\mathbb{F}_{2^{16}} \equiv \frac{\mathbb{F}_2\left[x\right]}{x^{16} + x^5 + x^3 + x^2 + 1} \tag{H.8}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-finitefield" class="gk-wrap">$\mathbb{F}$</span> | F | a finite field: a fixed set of values that add, subtract, multiply and divide without leaving it; 𝔽 with 2¹⁶ has one value per two-byte word |
| <span id="gk-frac">$\frac{x}{y}$</span> | over | a fraction: the top divided by the bottom |

</details>

<a id="gp-H-2-p5"></a>We name the generator of $\frac{\mathbb{F}_{2^{16}}}{\mathbb{F}_2}$, the root of the above polynomial, $\alpha$ as such: $\mathbb{F}_{2^{16}} = \mathbb{F}_2(\alpha)$.

<a id="gp-H-2-p6"></a>Instead of using the standard basis $\left\{\,1, \alpha, \alpha^2, \dots, \alpha^{15}\,\right\}$, we opt for a representation of $\mathbb{F}_{2^{16}}$ which performs more efficiently for the encoding and the decoding process. To that aim, we name this specific representation of $\mathbb{F}_{2^{16}}$ as $\tilde{\mathbb{F}}_{2^{16}}$ and define it as a vector space generated by the following Cantor basis:

<a id="gp-H-2-p7"></a>

|  |  |
| --- | --- |
| $v_0$ | $1$ |
| $v_1$ | $\alpha^{15} + \alpha^{13} + \alpha^{11} + \alpha^{10} + \alpha^7 + \alpha^6 + \alpha^3 + \alpha$ |
| $v_2$ | $\alpha^{13} + \alpha^{12} + \alpha^{11} + \alpha^{10} + \alpha^3 + \alpha^2 + \alpha$ |
| $v_3$ | $\alpha^{12} + \alpha^{10} + \alpha^9 + \alpha^5 + \alpha^4 + \alpha^3 + \alpha^2 + \alpha$ |
| $v_4$ | $\alpha^{15} + \alpha^{14} + \alpha^{10} + \alpha^8 + \alpha^7 + \alpha$ |
| $v_5$ | $\alpha^{15} + \alpha^{14} + \alpha^{13} + \alpha^{11} + \alpha^{10} + \alpha^8 + \alpha^5 + \alpha^3 + \alpha^2 + \alpha$ |
| $v_6$ | $\alpha^{15} + \alpha^{12} + \alpha^8 + \alpha^6 + \alpha^3 + \alpha^2$ |
| $v_7$ | $\alpha^{14} + \alpha^4 + \alpha$ |
| $v_8$ | $\alpha^{14} + \alpha^{13} + \alpha^{11} + \alpha^{10} + \alpha^7 + \alpha^4 + \alpha^3$ |
| $v_9$ | $\alpha^{12} + \alpha^7 + \alpha^6 + \alpha^4 + \alpha^3$ |
| $v_{10}$ | $\alpha^{14} + \alpha^{13} + \alpha^{11} + \alpha^9 + \alpha^6 + \alpha^5 + \alpha^4 + \alpha$ |
| $v_{11}$ | $\alpha^{15} + \alpha^{13} + \alpha^{12} + \alpha^{11} + \alpha^8$ |
| $v_{12}$ | $\alpha^{15} + \alpha^{14} + \alpha^{13} + \alpha^{12} + \alpha^{11} + \alpha^{10} + \alpha^8 + \alpha^7 + \alpha^5 + \alpha^4 + \alpha^3$ |
| $v_{13}$ | $\alpha^{15} + \alpha^{14} + \alpha^{13} + \alpha^{12} + \alpha^{11} + \alpha^9 + \alpha^8 + \alpha^5 + \alpha^4 + \alpha^2$ |
| $v_{14}$ | $\alpha^{15} + \alpha^{14} + \alpha^{13} + \alpha^{12} + \alpha^{11} + \alpha^{10} + \alpha^9 + \alpha^8 + \alpha^5 + \alpha^4 + \alpha^3$ |
| $v_{15}$ | $\alpha^{15} + \alpha^{12} + \alpha^{11} + \alpha^8 + \alpha^4 + \alpha^3 + \alpha^2 + \alpha$ |

<a id="gp-H-2-p8"></a>Every message word $m_{i}=m_{i, 15} \ldots m_{i, 0}$ consists of 16 bits. As such it could be regarded as binary vector of length 16:

<a id="gp-H-2-p9"></a><a id="eq-H-9"></a>

$$
\begin{equation}
m_{i} = \left(m_{i, 0} \ldots m_{i, 15}\right) \tag{H.9}
\end{equation}
$$

<a id="gp-H-2-p10"></a>Where $m_{i, 0}$ is the least significant bit of message word $m_{i}$. Accordingly we consider the field element $\widetilde{m_{i}} = \sum^{15}_{j = 0} m_{i, j} v_{j}$ to represent that message word.

<a id="gp-H-2-p11"></a>Similarly, we assign a unique index to each validator between 0 and $v - 1$ and we represent validator $i$ with the field element:

<a id="gp-H-2-p12"></a><a id="eq-H-10"></a>

$$
\begin{equation}
\tilde{i} = \sum^{15}_{j = 0} i_{j} v_{j} \tag{H.10}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-tilde">$\tilde{x}$</span> | tilde | x̃: x as a value of the erasure code's field, in the basis its table lists |
| <span id="gk-sum">$\sum$</span> | the sum of | add up what follows, once for each value the subscript ranges over |

</details>

<a id="gp-H-2-p13"></a>where $i = i_{15} \ldots i_0$ is the binary representation of $i$.

:::

**(H.7) and (H.8), read aloud.** "x to the 16 plus x to the 5 plus x cubed plus x squared
plus 1." "F sub 2 to the 16 is defined as F-2 of x over that polynomial." **In plain
words.** Each two-byte word is a number in a finite field of 65,536 values: a set where
adding is XOR, multiplying is defined so that every value but 0 can be divided by, and
nothing ever overflows past 16 bits. The polynomial is the rule that folds a product back
into 16 bits; as bits it is `1 0000 0000 0010 1101`, 0x1002D. **On a value.** In this field
1 + 1 = 0, since 1 XOR 1 = 0, and `615d` + `1700` = `765d`, byte by byte.

**(H.9) and (H.10), read aloud.** "m-i is the tuple of its bits, m-i-0 to m-i-15." "i tilde
is the sum over j from 0 to 15 of i-j times v-j." **What it means.** A word is 16 bits,
lowest first, and the paper reads each bit as a weight on one of the 16 basis values v₀ to
v₁₅ in the table: a change of coordinates that makes the fast algorithm work. A validator's
index becomes a field value the same way. **On a value.** Validator 5 is binary `101`, bits
0 and 2, so 5̃ = v₀ + v₂.

::: gray-paper H.3

#### Appendix H.3 The Generator Polynomial {#gp-H-3}

<a id="gp-H-3-p1"></a>To erasure code a message of $d = \mathcal{D}(v)$ words into $v$ code words, we represent each message as a field element as described in previous section and we interpolate the polynomial $p(y)$ of maximum $d - 1$ degree which satisfies the following equalities:

<a id="gp-H-3-p2"></a><a id="eq-H-11"></a>

$$
\begin{equation}
\begin{array}{l}
p (\tilde{0}) = \widetilde{m_0}\\
p (\tilde{1}) = \widetilde{m_1}\\
\vdots\\
p (\widetilde{d-1}) = \widetilde{m_{d-1}}
\end{array} \tag{H.11}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-widetilde">$\widetilde{x}$</span> | tilde | x̃: x as a value of the erasure code's field, in the basis its table lists |

</details>

<a id="gp-H-3-p3"></a>After finding $p(y)$ with such properties, we evaluate $p$ at the following points:

<a id="gp-H-3-p4"></a><a id="eq-H-12"></a>

$$
\begin{equation}
\begin{array}{l}
\widetilde{r_d} : = p (\widetilde{d})\\
\widetilde{r_{d+1}} : = p (\widetilde{d+1})\\
\vdots\\
\widetilde{r_{v-1}} : = p (\widetilde{v-1})
\end{array} \tag{H.12}
\end{equation}
$$

<a id="gp-H-3-p5"></a>We then distribute the message words and the extra code words among the validators according to their corresponding indices.

:::

**(H.11) and (H.12), read aloud.** "p of 0 tilde is m-0 tilde, p of 1 tilde is m-1 tilde, and
so on to p of d − 1 tilde." "r-d tilde is defined as p of d tilde, and so on to r-v−1
tilde." **What it means.** Draw the one curve, a polynomial of degree below d, through
the d message words, then read the curve at the other validators' points. Any d points
pin the curve down again, so any d chunks rebuild the message: the same idea as Shamir's
secret sharing, which [3.3](./03-work-and-reports/03-a-work-report.md) compares. **On a
real value.** In `ec-3`, d = 3: p passes through the message words `615d`, `1700` and
`0000` at 0̃, 1̃ and 2̃, and its values at 3̃, 4̃ and 5̃ are the vector's last three shards,
`59d0`, `0615` and `756d`, written as bytes.
