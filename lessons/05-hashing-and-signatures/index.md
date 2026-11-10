# Part 5 · Hashing and signatures

Your client can read a block. Now it learns to *check* one: that it really follows the
block before it, that its extrinsic is what its header promised, and that the
signatures in it were made by the validators they claim. Cryptography, from libraries
that do it well, put to work on real JAM blocks.

By the end of this part your client checks a block's links (hashes), its extrinsic hash,
and who signed what (Ed25519).

All of it runs on the chain: every validator checks every block the same way. The
signatures themselves were made elsewhere, by the block's author, by guarantors in-core,
by validators assuring their shards, and your client only ever checks them. It holds no
key of its own.

**Builds on** [Part 4 · Blocks](../04-blocks/index.md), and on the foundations every part
uses, [Parts 0 to 2](../index.md#lessons).

## At a glance

The whole part on one map. Boxes are what your client holds, and rounded cards are the
steps between them; a dashed card happens outside your client. Tap any card, or walk
through them in order with *next*.

<PartFlow :part="5" />

**Starting here?** At the repo root, `npm run catch-up -- 4.7` makes your client the one
this part starts from; [How to read it](../index.md#how-to-read-it) says more.

- [5.1 Hashes](./01-hashes.md)
- [5.2 The extrinsic hash](./02-the-extrinsic-hash.md)
- [5.3 Signatures](./03-signatures.md)

## In the Gray Paper

Open **§3.8** in *Notational Conventions* for hashing and signatures, and **§5, *The Header*** for the two hashes a header carries.

| The paper says | We say | The vectors say |
| --- | --- | --- |
| ℋ, the Blake2b-256 hash; ℋ_K, Keccak-256; ℍ₀, the zero hash: 32 zero bytes | the hash; Keccak, for the belt and the yields | every `…_hash`, `…_root` field |
| 𝕍̄_k⟨m⟩, the set of Ed25519 signatures by public key k over message m; X_A, X_G, signing contexts such as `$jam_available` | a signature, and the context string in front of what's signed | `signature` |
| H_P ≡ ℋ(ℰ(P(𝐇))), the parent header's hash; H_X, the extrinsic hash | the parent hash and the extrinsic hash | `parent`, `extrinsic_hash` |

Its defining lines, from §5, each explained symbol by symbol in [5.A](./gray-paper.md):

::: gray-paper-eq 5.2

<a id="ex-5-2"></a>The Gray Paper's (5.2), [in its place in the paper's words](./01-hashes.md#eq-5-2):

$$
\begin{equation}
\mathbf{H}_{P} \in \mathbb{H}_{} \,,\quad \mathbf{H}_{P} \equiv \mathcal{H}\left(\mathcal{E}_{}\left(P\left(\mathbf{H}\right)\right)\right) \tag{5.2}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-header" class="gk-wrap">$\mathbf{H}$</span> | H | a block header: the parent's hash, the slot, the seals and markers |
| <span id="gk--parent">$P$</span> | P | a header's parent hash: 𝐇_P is the hash of the header before it, 32 bytes |
| <span id="gk-in">[$\in$](../symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-hash">$\mathbb{H}$</span> | H | a 32-byte value, usually a hash |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-blake">$\mathcal{H}\left(x\right)$</span> | H of | the Blake2b hash of what's in the brackets: 32 bytes |
| <span id="gk-encode">[$\mathcal{E}\left(x\right)$](../symbols.md#encode)</span> | E of | the encoding of what's in the brackets: its bytes, by Appendix C's rules |
| <span id="gk-getparent">$P\left(x\right)$</span> | P of | the parent of a header: P(𝐇) is the header of the block before |

</details>

:::

::: gray-paper-eq 5.4

<a id="ex-5-4"></a>The Gray Paper's (5.4), (5.5), (5.6), (5.7), [in its place in the paper's words](./02-the-extrinsic-hash.md#eq-5-4):

$$
\begin{align}
\mathbf{H}_{X} &\in \mathbb{H}_{} \ ,\quad
\mathbf{H}_{X} \equiv \mathcal{H}\left(\mathcal{E}_{}\left(\mathcal{H}^\#\left(\mathbf{a}\right)\right)\right) \tag{5.4} \\
\text{where } \mathbf{a} &= \left[
\mathcal{E}_{T}\left(\mathbf{E}_T\right),
\mathbf{p},
\mathbf{g},
\mathcal{E}_{A}\left(\mathbf{E}_A\right),
\mathcal{E}_{D}\left(\mathbf{E}_D\right)
\right] \tag{5.5} \\
\text{and } \mathbf{p} &= \mathcal{E}_{}\left(\left\updownarrow\left[
\left(\mathcal{E}_{4}\left(s\right), \mathcal{H}\left(\mathbf{d}\right)\right)
\;\middle\vert\;
\left(s, \mathbf{d}\right) \mathrel{\unicode{x2B40}} \mathbf{E}_P
\right]\right.\!\right) \tag{5.6} \\
\text{and } \mathbf{g} &= \mathcal{E}_{}\left(\left\updownarrow\left[
\left(\mathcal{H}\left(\mathbf{r}\right), \mathcal{E}_{4}\left(t\right), \left\updownarrow a\right.\!\right)
\;\middle\vert\;
\left(\mathbf{r}, t, a\right) \mathrel{\unicode{x2B40}} \mathbf{E}_G
\right]\right.\!\right) \tag{5.7}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk--extrinsichash">$X$</span> | X | a header's extrinsic hash: 𝐇_X stands for the block's five bags, 32 bytes |
| <span id="gk-blakemany">$\mathcal{H}^\#\left(x\right)$</span> | H hash of | hash each item: ℋ#([a, b]) is [ℋ(a), ℋ(b)], a sequence of 32-byte hashes |
| <span id="gk-sq">[$\left[x\right]$](../symbols.md#sequence)</span> | the sequence | a sequence written out item by item; [ ] is the empty one |
| <span id="gk-encodetickets">$\mathcal{E}_{T}\left(x\right)$</span> | E sub T of | the tickets bag's bytes: its length, then each ticket's attempt (1 byte) and 784-byte proof |
| <span id="gk-xttickets" class="gk-wrap">$\mathbf{E}_T$</span> | E sub T | the tickets bag: entries to the block-sealing lottery |
| <span id="gk-encodeassurances">$\mathcal{E}_{A}\left(x\right)$</span> | E sub A of | the assurances bag's bytes: its length, then each one's anchor, bitfield, validator index (2 bytes) and signature |
| <span id="gk-xtassurances" class="gk-wrap">$\mathbf{E}_A$</span> | E sub A | the assurances bag: validators saying they hold their pieces of reports |
| <span id="gk-encodedisputes">$\mathcal{E}_{D}\left(x\right)$</span> | E sub D of | the disputes bag's bytes: the verdicts, the culprits and the faults, each list with its length in front |
| <span id="gk-xtdisputes" class="gk-wrap">$\mathbf{E}_D$</span> | E sub D | the disputes bag: verdicts, culprits and faults |
| <span id="gk-var">[$\left\updownarrow x\right.\!$](../symbols.md#length-prefix)</span> | with its length | ↕x: x with its length in front, as a compact natural |
| <span id="gk-build">$x \;\middle\vert\; y$</span> | for each, such that | built by a rule: the left-hand value, for every case the right-hand side allows (a set, or a sequence in order) |
| <span id="gk-xp-serviceindex">$s$</span> | s | a preimage's service: the id of the service that asked for it, 4 bytes |
| <span id="gk-xp-data" class="gk-wrap">$\mathbf{d}$</span> | d | a preimage's data: the bytes themselves |
| <span id="gk-orderedin">$\mathrel{\unicode{x2B40}}$</span> | in order, from | each item of the sequence, in its order |
| <span id="gk-xtpreimages" class="gk-wrap">$\mathbf{E}_P$</span> | E sub P | the preimages bag: data a service asked for |
| <span id="gk-g-workreport" class="gk-wrap">$\mathbf{r}$</span> | r | a guarantee's work-report: 𝐠_𝐫 is the report it vouches for |
| <span id="gk-g-timeslot">$t$</span> | t | a guarantee's timeslot: the slot its guarantors signed it in |
| <span id="gk-g-credential">$a$</span> | a | a guarantee's credential: two or three pairs of a validator index and its Ed25519 signature |
| <span id="gk-xtguarantees" class="gk-wrap">$\mathbf{E}_G$</span> | E sub G | the guarantees bag: work-reports with their guarantors' signatures, one per core at most |

</details>

:::

Read it aloud: "the parent hash is the hash of the encoding of the parent header, P of H.
The extrinsic hash is the hash of the encoding of the sequence of hashes of a," where a
is the sequence (5.5) to (5.7) spell out: each bag encoded, with the guarantees and
preimages hashed item by item first so that one of them can be proven on its own. ℰ is
the codec of Appendix C and ℋ# means "hash each item of the sequence". A signature line
such as "s ∈ 𝕍̄_k⟨X_A ⌢ ℋ(…)⟩" reads "s is an Ed25519 signature by key k over the
context X_A followed by that hash."
