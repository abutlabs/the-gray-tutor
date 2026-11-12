# The formulas, in plain words

[Part 5](./index.md)'s appendix: every formula this part quotes, explained.
§3.8, where the paper names its hash and its signatures, has no formulas of its own, only
sentences, and [5.1](./01-hashes.md#what-the-gray-paper-says) and
[5.3](./03-signatures.md#what-the-gray-paper-says) say them in plain words. What is left
is three formulas of §5, *The Header*: (5.2), the parent hash; (5.3), the ancestors; and
(5.4) to (5.7), the extrinsic hash. They are the two hashes a header carries, the ones
that tie a block to the block before it and to its own contents. Each comes with its key,
then the same four steps: read it aloud, say it in plain words, watch it work on a real
value, and find it in your client. The real values are the `fallback` and `preimages`
traces' (`vectors/traces`). [Reading the Gray Paper](../reading-the-gray-paper.md)
teaches the shapes a line can take, if one of these stops you.

## (5.2): the parent hash

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

**Read it aloud.** "H sub P is in H; H sub P is defined as the hash of the encoding of P of
H," P of H being the parent of this header.

**In plain words.** A header's `parent` field is the Blake2b hash of the whole of the
parent block's header, encoded by Appendix C. Its seal is included: the hash covers every
byte of the header before. So a block can't be moved, and an old header can't be changed
by one bit, without every later block's `parent` going wrong. That is the chain.

**On a real value.** Blocks 1 and 2 of the `fallback` trace:

```text
P(H)                 block 1's header: slot 1, author 0, no marks
ℰ(P(H))              its encoding: 96 + 4 + 1 + 1 + 2 + 96 + 1 + 96 = 297 bytes
ℋ(ℰ(P(H)))           0x5592b088…89d9620a, the Blake2b-256 of those 297 bytes
H_P of block 2       0x5592b088…89d9620a: the same, so block 2 follows block 1
```

**In your client.** `blake2b256` in `src/hash.ts` and `headerHash` in `src/block.ts`
([5.1](./01-hashes.md#the-code)), which `npm run chain` uses to check a hundred links.

## (5.3): the ancestors

::: gray-paper-eq 5.3

<a id="ex-5-3"></a>The Gray Paper's (5.3), [in its place in the paper's words](./01-hashes.md#eq-5-3):

$$
\begin{align}
h \in \mathbf{A} \Leftrightarrow h = \mathbf{H} \vee (\exists i \in \mathbf{A} : h = P\left(i\right)) \tag{5.3}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-ancestors" class="gk-wrap">$\mathbf{A}$</span> | A | the ancestors: this header, its parent, its parent's parent, and so on back to genesis |
| <span id="gk-Leftrightarrow">$\Leftrightarrow$</span> | exactly when | if and only if: both sides are true together, or false together |
| <span id="gk-vee">$\vee$</span> | or | at least one side is true |
| <span id="gk-exists">[$\exists$](../symbols.md#exists)</span> | there exists | there is at least one value such that what follows holds |

</details>

:::

**Read it aloud.** "h is in A exactly when h is H, or there exists an i in A such that h is
the parent of i."

**In plain words.** A, the ancestors, is the set of headers you reach from this one by
following `parent` back: this header itself, its parent, its parent's parent, and so on to
genesis. The definition is recursive: a header is an ancestor if it is this one, or the
parent of an ancestor. The paper's next sentence limits the work: a node keeps only the
ancestors of the last L = 14,400 slots, 24 hours, because a work-package's lookup anchor
may be no older than that ([lesson 12.5](../12-guarantees/05-bad-reports.md) checks it).

**On a real value.** Block 3 of the `fallback` trace, and back:

```text
H = block 3              in A: it is H
block 3's parent         0x3d27225d…: block 2, in A as the parent of block 3
block 2's parent         0x5592b088…: block 1, in A as the parent of block 2
block 1's parent         0x245becfe…: the genesis header, in A as the parent of block 1
A                        {block 3, block 2, block 1, genesis}: four headers
```

**In your client.** Your client keeps no set of ancestors: it checks each block's
`parent` against the block before it ([5.1](./01-hashes.md#watch-the-chain)), and keeps
the last 8 blocks' hashes in β ([Part 9](../09-recent-history/index.md)).

## (5.4) to (5.7): the extrinsic hash

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
| <span id="gk-build">$\left\{ x \;\middle\vert\; y \right\}$</span> | for each, such that | built by a rule: the left-hand value, for every case the right-hand side allows (a set, or a sequence in order) |
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

**Read it aloud.** "H sub X is in H; H sub X is defined as the hash of the encoding of H
hash of a, where a is the sequence of: E sub T of the tickets, p, g, E sub A of the
assurances, and E sub D of the disputes; and p is E of up-down-arrow, the sequence of E sub
4 of s and the hash of d, for each s and d in order in the preimages; and g is E of
up-down-arrow, the sequence of the hash of r, E sub 4 of t, and up-down-arrow a, for each
r, t and a in order in the guarantees."

**In plain words.** The header's 32-byte promise of the extrinsic, in three steps.
(5.5) makes a, five byte strings, one per bag, in Appendix C's order. Three are the bags'
own encodings. The other two, p and g from (5.6) and (5.7), are the preimages and the
guarantees with their big part swapped for its hash: a preimage's data for ℋ(d), a
guarantee's work-report for ℋ(r). ℋ# then hashes each of the five, and (5.4) hashes the
five hashes, 160 bytes, into one. Why the swaps: to prove one report was in a block, you
show that report, g with every other report as 32 bytes, and four hashes, never the other
reports themselves.

**On a real value.** Every block of the `fallback` trace has an empty extrinsic:

```text
a = [00, 00, 00, 00, 00 00 00]   tickets, p, g, assurances: a length of 0 each, 1 byte;
                                 disputes: three empty lists, 3 bytes
ℋ(00)       = 0x03170a2e…        the hash of each of the first four
ℋ(00 00 00) = 0xab29e6dc…        the hash of the disputes' three bytes
ℰ(ℋ#(a))    = 0317…  0317…  0317…  0317…  ab29…   five hashes side by side: 160 bytes,
                                 no length in front
ℋ of those 160 bytes = 0x189d15af…306ca252   H_X: all 100 fallback blocks carry it
```

And block 8 of the `preimages` trace shows (5.6)'s swap. It carries four preimages, of
143, 3, 84 and 223 bytes, all for service 0:

```text
ℰ_P(E_P), in the block   1 + (4 + 2 + 143) + (4 + 1 + 3) + (4 + 1 + 84) + (4 + 2 + 223) = 476 bytes
p, in a                  1 + 4 × (4 + 32) = 145 bytes: each data swapped for its 32-byte hash
first item of p          00 00 00 00, then ℋ(d) = 0x6ae18b8b…: service 0 and the hash of the 143 bytes
H_X                      0xdd3582f2…76b00121, the header's own extrinsic_hash
```

**In your client.** `extrinsicHash` in `src/block.ts` ([5.2](./02-the-extrinsic-hash.md#the-code)),
with `HashedPreimage` and `HashedGuarantee` for (5.6) and (5.7).

## Say it in one breath

A header points back at its parent with the hash of the parent's whole encoded header
(5.2), and following those pointers back to genesis gives its ancestors (5.3), of which a
node keeps a day's worth. It points down at its own extrinsic with one more hash (5.4):
the hash of the five bags' hashes, in Appendix C's order (5.5), where the preimages and
the guarantees go in with their data and their reports already hashed (5.6, 5.7), so any
one of them can be proven on its own.
