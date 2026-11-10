# Part 7 · Time and shuffling

JAM's clock has two hands: the slot, every six seconds, and the epoch, every hour. This
part teaches your client to read both, and then to shuffle: JAM deals validators out to
cores with a shuffle everyone can repeat, from randomness nobody could steer.

By the end of this part your client reads slots and epochs, and shuffles a list from a
hash exactly the way every other JAM client does.

Both run on every validator from the block and the state alone: no clock on the wall and
no messages. A slot comes from the header, an epoch from the slot, a shuffle from the
entropy in the state. Everyone gets the same answer because everyone has the same inputs.

**Builds on** [Part 4 · Blocks](../04-blocks/index.md), [Part 5 · Hashing and
signatures](../05-hashing-and-signatures/index.md) and [Part 6 · State and
Merklization](../06-state-and-merklization/index.md), and on the foundations every part
uses, [Parts 0 to 2](../index.md#lessons).

## At a glance

The whole part on one map. Boxes are what your client holds, and rounded cards are the
steps between them; a dashed card happens outside your client. Tap any card, or walk
through them in order with *next*.

<PartFlow :part="7" />

**Starting here?** At the repo root, `npm run catch-up -- 6.3` makes your client the one
this part starts from; [How to read it](../index.md#how-to-read-it) says more.

- [7.1 Epochs](./01-epochs.md)
- [7.2 The shuffle](./02-the-shuffle.md)

## In the Gray Paper

Open **§4.4, *Time***, **§6.1, *Timekeeping***, the end of **§6.4**, where the entropy's
history is kept, and **Appendix F, *Shuffling***.

| The paper says | We say | The vectors say |
| --- | --- | --- |
| ℕ_T, a timeslot index, a natural below 2³²; τ, the most recent block's slot | the slot, and the time component | `slot`, `tau` |
| e and m, the epoch index and the slot's phase within it: e R m = τ / E, quotient and remainder; E = 600 | the epoch and the slot in the epoch; 12 on tiny | |
| η, four hashes: η₀ the entropy accumulator, η₁ to η₃ its value at the end of each of the last three epochs | the entropy and its history | `eta` |
| ℱ, the Fisher-Yates shuffle; Q_l(h), l numbers drawn from a hash | the shuffle, driven by a hash | `entropy` |

Its defining lines, (6.1) and (6.2) for the clock and (F.2) with (F.3) for the shuffle,
each explained symbol by symbol in [7.A](./gray-paper.md):

::: gray-paper-eq 6.1

<a id="ex-6-1"></a>The Gray Paper's (6.1), [in its place in the paper's words](./01-epochs.md#eq-6-1):

$$
\begin{equation}
\tau \in \mathbb{N}_T \ ,\quad
\tau' \equiv \mathbf{H}_{T} \tag{6.1}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-thetime" class="gk-wrap">$\tau$</span> | tau | the time: the latest block's timeslot |
| <span id="gk-in">[$\in$](../symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-timeslot" class="gk-wrap">$\mathbb{N}_T$</span> | N sub T | a timeslot: a u32 counting 6-second slots |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-H" class="gk-wrap">$\mathbf{H}$</span> | H | this block's header; 𝐇_T is its timeslot, 𝐇_P its parent's hash |
| <span id="gk--timeslot">$T$</span> | T | a header's timeslot: 𝐇_T is the slot this block was made for |

</details>

:::

::: gray-paper-eq 6.2

<a id="ex-6-2"></a>The Gray Paper's (6.2), [in its place in the paper's words](./01-epochs.md#eq-6-2):

$$
\begin{align}
\mathrm{let}\quad e \,\mathsf{R}\, m = \frac{\tau}{\mathsf{E}} \,,\quad
e' \,\mathsf{R}\, m' = \frac{\tau'}{\mathsf{E}} \tag{6.2}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-remainder">$\,\mathsf{R}\,$</span> | R | the remainder of a division |
| <span id="gk-frac">$\frac$</span> | over | a fraction: the top divided by the bottom |
| <span id="gk-Cepochlen" class="gk-wrap">$\mathsf{E}$</span> | E | an epoch's length in slots: 600 on full, 12 on tiny |

</details>

:::

::: gray-paper-eq F.2

<a id="ex-F-2"></a>The Gray Paper's (F.2), (F.3), [in its place in the paper's words](./02-the-shuffle.md#eq-F-2):

$$
\begin{align}
\forall l \in \mathbb{N}:\ \mathcal{Q}_{l}&\colon\left\{ \begin{aligned}
\mathbb{H}_{} &\to \left[\!\left[\mathbb{N}_{2^{32}}\right]\!\right]_{l}\\
h &\mapsto \left[
\mathcal{E}^{-1}_{4}\left(\mathcal{H}\left(h \frown \mathcal{E}_{4}\left(\left\lfloor{}^{i}\!/_{8}\right\rfloor\right)\right)
_{4i \bmod 32 \dots+4}\right)
\;\middle\vert\;
i \mathrel{\unicode{x2B40}} \mathbb{N}_{l}
\right]
\end{aligned} \right. \tag{F.2} \\
\forall T, l \in \mathbb{N}:\ \mathcal{F}&\colon\left\{ \begin{aligned}
\!\left\lgroup\left[\!\left[T\right]\!\right]_{l}, \mathbb{H}_{}\right\rgroup\! &\to \left[\!\left[T\right]\!\right]_{l}\\
\left(\mathbf{s}, h\right) &\mapsto \mathcal{F}\left(\mathbf{s}, \mathcal{Q}_{l}\left(h\right)\right)
\end{aligned} \right. \tag{F.3}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-forall">$\forall$</span> | for all | for every value: ∀c ∈ ℕ_C means for each core c |
| <span id="gk-N" class="gk-wrap">[$\mathbb{N}$](../symbols.md#naturals)</span> | N | the whole numbers: 0, 1, 2 and up; a subscript is a bound, ℕ₈ is 0 to 7 |
| <span id="gk-fnseqfromhash">$\mathcal{Q}_{x}$</span> | Q sub l | numbers from a hash: l numbers of 4 bytes each, read from hashes of a 32-byte seed, for the shuffle |
| <span id="gk-abracegroup">$\left\{ \begin{aligned}x\end{aligned} \right.$</span> | as follows | a brace grouping lines that hold together: for a function, its type on top, then what each input becomes |
| <span id="gk-hash">$\mathbb{H}$</span> | H | a 32-byte value, usually a hash |
| <span id="gk-to">[$\to$](../symbols.md#to)</span> | to | what goes in, to what comes out: A → B takes an A and gives a B |
| <span id="gk-sequence">[$\left[\!\left[x\right]\!\right]$](../symbols.md#sequence)</span> | a sequence of | ⟦T⟧ is an array of T; a subscript is its length, :n at most n, n: at least n |
| <span id="gk-Nbits">[$\mathbb{N}_{2^{x}}$](../symbols.md#naturals)</span> | N sub two to the n | the numbers that fit in n bits: ℕ_{2³²} is a u32 |
| <span id="gk-mapsto">$\mapsto$</span> | maps to | what a function gives back for an input: x ↦ y says x becomes y |
| <span id="gk-sq">[$\left[x\right]$](../symbols.md#sequence)</span> | the sequence | a sequence written out item by item; [ ] is the empty one |
| <span id="gk-build">$x \;\middle\vert\; y$</span> | for each, such that | built by a rule: the left-hand value, for every case the right-hand side allows (a set, or a sequence in order) |
| <span id="gk-decode">[$\mathcal{E}^{-1}\left(x\right)$](../symbols.md#decode)</span> | E inverse of | decoding: bytes back into the value they encode |
| <span id="gk-blake">$\mathcal{H}\left(x\right)$</span> | H of | the Blake2b hash of what's in the brackets: 32 bytes |
| <span id="gk-concat" class="gk-wrap">[$\frown$](../symbols.md#concat)</span> | concatenate | join: the left sequence followed by the right |
| <span id="gk-encode">[$\mathcal{E}\left(x\right)$](../symbols.md#encode)</span> | E of | the encoding of what's in the brackets: its bytes, by Appendix C's rules |
| <span id="gk-floor">[$\left\lfloor x\right\rfloor$](../symbols.md#floor)</span> | floor of | rounded down to a whole number |
| <span id="gk-nicefrac">${}^{x}\!/_{y}$</span> | over | a fraction: the top divided by the bottom |
| <span id="gk-bmod">[$\bmod$](../symbols.md#mod)</span> | mod | the remainder after dividing: 14 mod 4 is 2 |
| <span id="gk-orderedin">$\mathrel{\unicode{x2B40}}$</span> | in order, from | each item of the sequence, in its order |
| <span id="gk-fnfyshuffle" class="gk-wrap">$\mathcal{F}$</span> | F | the Fisher-Yates shuffle: a sequence and some entropy in, the same items in a fixed random order out |
| <span id="gk-tuple">$\!\left\lgroup x\right\rgroup\!$</span> | the tuple of | a record: named fields, each with its type, like an object in JSON |
| <span id="gk-fyshuffle">$\mathcal{F}\left(x\right)$</span> | F of | the Fisher-Yates shuffle: the sequence reordered by an entropy, the same way on every validator |
| <span id="gk-seqfromhash">$\mathcal{Q}_{x}\left(y\right)$</span> | Q sub l of h | l numbers drawn from the hash h: 4 bytes each, from the hashes of h with a counter after it |

</details>

:::

Read it aloud: "tau is a timeslot, and tau prime, the new time, is the header's slot. Let
e remainder m be tau over E: e the epoch, m the slot within it; and the same, primed, for
the new time." A new epoch is e′ > e. The shuffle lines: "Q sub l of a hash is l numbers,
each four bytes of the hash of h with a counter after it; shuffling a sequence by a hash is
shuffling it by the numbers Q draws from that hash, as many as the sequence has items"
([7.2](./02-the-shuffle.md) walks it).
