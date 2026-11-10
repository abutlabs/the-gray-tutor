# The formulas, in plain words

[Part 7](./index.md)'s appendix: every formula the part quotes, read for someone who doesn't read math.
There are six. Two from §6.1 tell the time, (6.1) and (6.2); two from §6.4 keep the
entropy's history, (6.22) and (6.24); and two from Appendix F shuffle a list, (F.1) and
(F.2) with (F.3). [The part's page](./index.md) says why a client needs a clock and a
shuffle at all. Each formula comes with its key, then the same four steps: read it aloud,
say it in plain words, watch it work on a real value, and find it in your client.
[Reading the Gray Paper](../reading-the-gray-paper.md) teaches the shapes a line can take,
if one of these stops you.

## (6.1): the time is the header's slot

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

**Read it aloud.** "Tau is in N sub T. Tau prime is defined as H sub T."

**In plain words.** Two statements. The first is a type: τ, the time in the state, is a
timeslot, a whole number below 2³² (a u32). The second is the rule: after a block, τ′ is
that block's own slot, the header's `slot` field, copied. So τ always holds the slot of
the latest block, and while a block is being checked, τ is still its parent's slot. That
is what lets §6.1 compare the two. (That a slot must be later than its parent's is a
header rule, [(5.8)](../04-blocks/06-the-header.md#eq-5-8).)

**On a real value.** The tiny vector `enact-epoch-change-with-no-tickets-4`:

```text
τ       10    the state before: the last block was made for slot 10
H_T     15    this block's slot, from its header (slots 11 to 14 had no block)
τ′      15    the state after: the header's slot, copied
```

**In your client.** `readTime` reads τ from the state ([6.3](../06-state-and-merklization/03-reading-the-state.md#the-code)),
and `safroleStep` sets the new `time` to the block's slot ([8.5](../08-safrole/05-one-step-of-safrole.md#the-code)).

## (6.2): the epoch and the phase

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

**Read it aloud.** "Let e remainder m equal tau over E, and e prime remainder m prime
equal tau prime over E."

**In plain words.** The R is the paper's way of writing the two answers of one whole-number
division: the quotient on its left, the remainder on its right. Divide a slot by E, the
epoch's length, and the quotient e is the epoch, the remainder m is the *phase*, where the
slot falls within its epoch. Without a prime, it's about τ, the block before; with a
prime, about τ′, this block. A block starts a new epoch exactly when e′ > e. Several
rules of [Part 8](../08-safrole/index.md) also read m and m′: the phase tells them whether the ticket lottery is
still open.

**On a real value.** The same vector, on tiny, where E = 12:

```text
τ  = 10    10 ÷ 12 = 0, remainder 10    e  = 0, m  = 10
τ′ = 15    15 ÷ 12 = 1, remainder 3     e′ = 1, m′ = 3
e′ > e     1 > 0                         this block starts epoch 1
```

On full, E = 600: slot 1,000 is 1,000 ÷ 600 = 1, remainder 400, so epoch 1, phase 400.

**In your client.** `epochOf` and `phaseOf` in `src/epoch.ts`, written in
[7.1](./01-epochs.md#the-code).

## (6.22) and (6.24): four hashes, moved along at an epoch's turn

::: gray-paper-eq 6.22

<a id="ex-6-22"></a>The Gray Paper's (6.22), [in its place in the paper's words](./01-epochs.md#eq-6-22):

$$
\begin{align}
\eta &\in \left[\!\left[\mathbb{H}_{}\right]\!\right]_{4} \tag{6.22}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-entropy" class="gk-wrap">$\eta$</span> | eta | entropy: four 32-byte values of randomness, the newest mixing in every block |
| <span id="gk-sequence">[$\left[\!\left[x\right]\!\right]$](../symbols.md#sequence)</span> | a sequence of | ⟦T⟧ is an array of T; a subscript is its length, :n at most n, n: at least n |
| <span id="gk-hash">$\mathbb{H}$</span> | H | a 32-byte value, usually a hash |

</details>

:::

::: gray-paper-eq 6.24

<a id="ex-6-24"></a>The Gray Paper's (6.24), [in its place in the paper's words](./01-epochs.md#eq-6-24):

$$
\begin{align}
\left(\eta'_1, \eta'_2, \eta'_3\right) &\equiv \begin{cases}
\left(\eta_0, \eta_1, \eta_2\right) &\text{if } e' > e \\
\left(\eta_1, \eta_2, \eta_3\right) &\text{otherwise}
\end{cases} \tag{6.24}
\end{align}
$$

:::

**Read it aloud.** "Eta is in a sequence of four hashes." And: "eta one prime, eta two
prime, eta three prime are defined as: eta zero, eta one, eta two, if e prime is greater
than e; otherwise eta one, eta two, eta three."

**In plain words.** (6.22) is a type line: η is exactly four 32-byte hashes, 128 bytes in
all. η₀ is the accumulator, stirred by every block (that's (6.23), in
[8.A](../08-safrole/gray-paper.md#ex-6-23)). η₁, η₂ and η₃ are what η₀ was
when each of the last three epochs ended, newest first.

(6.24) moves them. At a new epoch (e′ > e), each one steps one place down the line: the
old η₀ becomes η′₁, the old η₁ becomes η′₂, the old η₂ becomes η′₃, and the old η₃ is
forgotten. In any other block, the three stay as they are. The tuple on each side is just
three values written together, as an array of three.

**On a real value.** `enact-epoch-change-with-no-tickets-4` again, where e′ > e. Each hash
is 32 bytes; only its first two are shown:

```text
η            f164  ee15  bb30  e88b    before: η₀, η₁, η₂, η₃
e′ > e       1 > 0                     a new epoch: the first case
η′₁ η′₂ η′₃  f164  ee15  bb30          the old η₀, η₁, η₂; e88b is forgotten
η′₀          7606                      stirred by (6.23), not by this rule
```

**In your client.** `entropyHistory` in `src/epoch.ts`, written in
[7.1](./01-epochs.md#the-code): `entropy.slice(0, 3)` at a new epoch,
`entropy.slice(1, 4)` otherwise.

## (F.1): the shuffle, one pick at a time

::: gray-paper-eq F.1

<a id="ex-F-1"></a>The Gray Paper's (F.1), [in its place in the paper's words](./02-the-shuffle.md#eq-F-1):

$$
\begin{equation}
\forall T, l \in \mathbb{N}: \mathcal{F}\colon\left\{ \begin{aligned}
\!\left\lgroup\left[\!\left[T\right]\!\right]_{l}, \left[\!\left[\mathbb{N}\right]\!\right]_{l:}\right\rgroup\! &\to \left[\!\left[T\right]\!\right]_{l}\\
\left(\mathbf{s}, \mathbf{r}\right) &\mapsto \begin{cases}
\left[\mathbf{s}_{\mathbf{r}_0 \bmod l}\right] \frown \mathcal{F}\left(\mathbf{s}'_{\dots l-1}, \mathbf{r}_{1\dots}\right)\  \text{where } \mathbf{s}' = \mathbf{s} \text{ except } \mathbf{s'}_{\mathbf{r}_0 \bmod l} = \mathbf{s}_{l - 1} &\text{if } \mathbf{s} \ne \left[\right]\\
\left[\right] &\text{otherwise}
\end{cases}
\end{aligned} \right. \tag{F.1}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-forall">$\forall$</span> | for all | for every value: ∀c ∈ ℕ_C means for each core c |
| <span id="gk-N" class="gk-wrap">[$\mathbb{N}$](../symbols.md#naturals)</span> | N | the whole numbers: 0, 1, 2 and up; a subscript is a bound, ℕ₈ is 0 to 7 |
| <span id="gk-fnfyshuffle" class="gk-wrap">$\mathcal{F}$</span> | F | the Fisher-Yates shuffle: a sequence and some entropy in, the same items in a fixed random order out |
| <span id="gk-abracegroup">$\left\{ \begin{aligned}x\end{aligned} \right.$</span> | as follows | a brace grouping lines that hold together: for a function, its type on top, then what each input becomes |
| <span id="gk-tuple">$\!\left\lgroup x\right\rgroup\!$</span> | the tuple of | a record: named fields, each with its type, like an object in JSON |
| <span id="gk-to">[$\to$](../symbols.md#to)</span> | to | what goes in, to what comes out: A → B takes an A and gives a B |
| <span id="gk-mapsto">$\mapsto$</span> | maps to | what a function gives back for an input: x ↦ y says x becomes y |
| <span id="gk-sq">[$\left[x\right]$](../symbols.md#sequence)</span> | the sequence | a sequence written out item by item; [ ] is the empty one |
| <span id="gk-bmod">[$\bmod$](../symbols.md#mod)</span> | mod | the remainder after dividing: 14 mod 4 is 2 |
| <span id="gk-concat" class="gk-wrap">[$\frown$](../symbols.md#concat)</span> | concatenate | join: the left sequence followed by the right |
| <span id="gk-fyshuffle">$\mathcal{F}\left(x\right)$</span> | F of | the Fisher-Yates shuffle: the sequence reordered by an entropy, the same way on every validator |
| <span id="gk-ne">$\ne$</span> | is not | not equal |

</details>

:::

**Read it aloud.** "For all T and l in N: F maps a sequence of l T's and a sequence of at
least l numbers to a sequence of l T's. s and r map to: if s is not empty, the sequence
holding s at r zero mod l, concatenated with F of s prime up to l minus 1 and r from 1 on,
where s prime is s except that s prime at r zero mod l is s at l minus 1; otherwise the
empty sequence."

**In plain words.** The top line is the function's type: F takes a list s of l items (of
any type T) and at least l numbers r, and gives back the same l items in a new order. The
lines under it say how, as a recursion, a function that calls itself on a shorter list:

1. pick the item at index r₀ mod l, and put it first;
2. make s′: the same list, with the last item copied into the gap the pick left;
3. drop the last place (s′ up to l − 1), drop the number used (r from 1 on), and shuffle
   what's left the same way.

The empty list shuffles to the empty list, and that is where the recursion stops.

**On a real value.** Four letters and the numbers 1, 1, 0, 0, as
[7.2](./02-the-shuffle.md) works them:

```text
s = a b c d   r₀ = 1   1 mod 4 = 1   pick b; s′ = a d c d, keep 3: a d c
s = a d c     r₁ = 1   1 mod 3 = 1   pick d; s′ = a c c, keep 2: a c
s = a c       r₂ = 0   0 mod 2 = 0   pick a; s′ = c c, keep 1: c
s = c         r₃ = 0   0 mod 1 = 0   pick c; nothing left
s = [ ]                               the empty sequence: the recursion stops
F = b d a c                           the picks, in order
```

**In your client.** `shuffle` in `src/shuffle.ts`, written in
[7.2](./02-the-shuffle.md#the-code). It is the same recursion written as a loop, one pick
per number.

## (F.2) and (F.3): the numbers, from a hash

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
| <span id="gk-fnseqfromhash">$\mathcal{Q}_{x}$</span> | Q sub l | numbers from a hash: l numbers of 4 bytes each, read from hashes of a 32-byte seed, for the shuffle |
| <span id="gk-Nbits">[$\mathbb{N}_{2^{x}}$](../symbols.md#naturals)</span> | N sub two to the n | the numbers that fit in n bits: ℕ_{2³²} is a u32 |
| <span id="gk-build">$x \;\middle\vert\; y$</span> | for each, such that | built by a rule: the left-hand value, for every case the right-hand side allows (a set, or a sequence in order) |
| <span id="gk-decode">[$\mathcal{E}^{-1}\left(x\right)$](../symbols.md#decode)</span> | E inverse of | decoding: bytes back into the value they encode |
| <span id="gk-blake">$\mathcal{H}\left(x\right)$</span> | H of | the Blake2b hash of what's in the brackets: 32 bytes |
| <span id="gk-encode">[$\mathcal{E}\left(x\right)$](../symbols.md#encode)</span> | E of | the encoding of what's in the brackets: its bytes, by Appendix C's rules |
| <span id="gk-floor">[$\left\lfloor x\right\rfloor$](../symbols.md#floor)</span> | floor of | rounded down to a whole number |
| <span id="gk-nicefrac">${}^{x}\!/_{y}$</span> | over | a fraction: the top divided by the bottom |
| <span id="gk-orderedin">$\mathrel{\unicode{x2B40}}$</span> | in order, from | each item of the sequence, in its order |
| <span id="gk-seqfromhash">$\mathcal{Q}_{x}\left(y\right)$</span> | Q sub l of h | l numbers drawn from the hash h: 4 bytes each, from the hashes of h with a counter after it |

</details>

:::

**Read it aloud.** "For all l in N: Q sub l maps a hash to a sequence of l numbers below 2
to the 32. h maps to: for each i in order from N sub l, E-4 inverse of: the hash of h
concatenated with E-4 of the floor of i over 8, bytes 4i mod 32, four of them. And for all
T and l: F maps a sequence of l T's and a hash to a sequence of l T's: s and h map to F of
s and Q sub l of h."

**In plain words.** (F.2) makes the numbers the shuffle needs, l of them, from one 32-byte
hash h. For number i:

1. **the counter**: ⌊i / 8⌋, written as 4 bytes, little-endian. Numbers 0 to 7 use
   counter 0, numbers 8 to 15 counter 1, and so on;
2. **hash** h with the counter after it, with Blake2b: 32 new bytes, room for eight
   4-byte numbers;
3. **read** bytes 4i mod 32 to 4i mod 32 + 4 of that hash as a little-endian number
   (ℰ₄⁻¹). The `mod 32` wraps: number 8 reads bytes 0 to 3 again, of the next hash.

(F.3) is the shuffle as JAM uses it: F of a list and a hash is F of the list and l numbers
drawn from that hash, l being the list's length. Everyone holding the same hash gets the
same order.

**On a real value.** The shuffle vector's case with 8 items, 0 to 7, and h = 32 bytes of
`ff`:

```text
H(ff…ff ⌢ 00 00 00 00)   f1fd8cbd 15a54fab ded17c65 c4dd44e1 f93aad12 2fcc1840 b1edefaa a5ba2b22
i = 0   bytes 0 to 3     f1 fd 8c bd, little-endian 0xbd8cfdf1 = 3,180,133,873
i = 1   bytes 4 to 7     15 a5 4f ab, little-endian 0xab4fa515 = 2,874,123,541
…
i = 7   bytes 28 to 31   a5 ba 2b 22, little-endian 0x222bbaa5 = 573,291,173
F(s, h)                  3,180,133,873 mod 8 = 1, pick 1; and on: 1, 2, 6, 0, 7, 4, 3, 5
```

A ninth item would read counter ⌊8 / 8⌋ = 1: a new hash, H(ff…ff ⌢ 01 00 00 00), its
bytes 0 to 3.

**In your client.** `numbersFromHash` and `shuffleWithHash` in `src/shuffle.ts`, written
in [7.2](./02-the-shuffle.md#the-code).

## Say it in one breath

τ is the slot of the latest block, and a block sets it to its own slot (6.1). Dividing a
slot by E gives its epoch and its phase, and a block whose epoch is greater than its
parent's starts a new one (6.2). η is four hashes, the accumulator and the last three
epochs' values (6.22), and at a new epoch they step along one place (6.24). JAM's shuffle
picks the item at the next number mod what's left and fills the gap with the last item
(F.1), and it draws those numbers from a hash, eight 4-byte numbers per Blake2b of the
hash and a counter (F.2), so every node holding the same hash deals the same order (F.3).
