# The formulas, in plain words

[Part 9](./index.md)'s appendix: every formula of §7, *Recent History*, and of Appendix E.2,
*Merkle Mountain Ranges and Belts*, explained. Seven blocks: what the state remembers (7.1
to 7.4), the blank filled in (7.5), the belt's append, bytes and super-peak (E.8 to E.10),
what each block appends (7.6, 7.7), and the new entry (7.8). Each formula: its key, then
read aloud, in plain words, on a real value, in your client. Notation: [Reading the Gray
Paper](../reading-the-gray-paper.md).

## (7.1) to (7.4): what the state remembers

::: gray-paper-eq 7.1

<a id="ex-7-1"></a>The Gray Paper's (7.1), (7.2), (7.3), (7.4), [in its place in the paper's words](./02-recent-blocks.md#eq-7-1):

$$
\begin{align}
\beta &\equiv \left(\beta_H, \beta_B\right) \tag{7.1} \\
\beta_H &\in \left[\!\left[\!\left\lgroup
h\in \mathbb{H}_{},
s\in \mathbb{H}_{},
b\in \mathbb{H}_{},
t\in \mathbb{N}_T,
\mathbf{p}\in \left\langle\!\left\vert \mathbb{H}_{}\to\mathbb{H}_{}\right\vert\!\right\rangle
\right\rgroup\!\right]\!\right]_{:\mathsf{H}} \tag{7.2} \\
\beta_B &\in \left[\!\left[\mathbb{H}_{}\boldsymbol{?}\right]\!\right]_{} \tag{7.3} \\
\theta &\in \left[\!\left[\left(\mathbb{N}_S, \mathbb{H}_{}\right)\right]\!\right]_{} \tag{7.4}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-recent" class="gk-wrap">$\beta$</span> | beta | recent blocks: the last few blocks' hashes and roots, and the belt of accumulation outputs |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-recenthistory" class="gk-wrap">$\beta_H$</span> | beta sub H | the last H = 8 blocks: each one's header hash, state root, belt peak and reported packages |
| <span id="gk-accoutbelt" class="gk-wrap">$\beta_B$</span> | beta sub B | the accumulation output belt: one place per binary digit of the block count, each a peak or nothing |
| <span id="gk-in">[$\in$](../symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-sequence">[$\left[\!\left[x\right]\!\right]$](../symbols.md#sequence)</span> | a sequence of | ⟦T⟧ is an array of T; a subscript is its length, :n at most n, n: at least n |
| <span id="gk-Crecenthistorylen" class="gk-wrap">$\mathsf{H}$</span> | H | how many recent blocks the state remembers: 8 |
| <span id="gk-tuple">$\!\left\lgroup x\right\rgroup\!$</span> | the tuple of | a record: named fields, each with its type, like an object in JSON |
| <span id="gk-isa">[$x\in y$](../symbols.md#in)</span> | in | belongs to: the field's type |
| <span id="gk-rh-headerhash">$h$</span> | h | a recent block's header hash |
| <span id="gk-hash">$\mathbb{H}$</span> | H | a 32-byte value, usually a hash |
| <span id="gk-rh-stateroot">$s$</span> | s | a recent block's state root: the state just after it; zeros until the next block fills it in |
| <span id="gk-rh-accoutlogsuperpeak">$b$</span> | b | the belt's super-peak just after that block: the vectors' `beefy_root` |
| <span id="gk-rh-timeslot">$t$</span> | t | a recent block's timeslot |
| <span id="gk-timeslot" class="gk-wrap">$\mathbb{N}_T$</span> | N sub T | a timeslot: a u32 counting 6-second slots |
| <span id="gk-rh-reportedpackagehashes" class="gk-wrap">$\mathbf{p}$</span> | bold p | the packages a block reported: each package's hash, mapped to the root of the segments it exports |
| <span id="gk-dictionary">$\left\langle\!\left\vert x\to y\right\vert\!\right\rangle$</span> | a dictionary from K to V | a map: keys of type K, each with one value of type V |
| <span id="gk-optional">$x\boldsymbol{?}$</span> | or nothing | a value of this type, or ∅ (null) |
| <span id="gk-lastaccout" class="gk-wrap">$\theta$</span> | theta | the last block's accumulation outputs: which service yielded which hash |
| <span id="gk-serviceid" class="gk-wrap">$\mathbb{N}_S$</span> | N sub S | a service id: a whole number below 2³², 4 bytes |

</details>

:::

**Read it aloud.** "Beta is defined as the pair beta-H, beta-B. Beta-H is in: a sequence
of at most H tuples, each an h in H, an s in H, a b in H, a t in N-T, and a bold p in a
dictionary from H to H. Beta-B is in: a sequence of H-or-nothing. Theta is in: a sequence
of pairs, a service id and an H."

**In plain words.** Four type lines, a schema for one piece of state and one helper:

- **(7.1)** β, the recent history, is two things side by side.
- **(7.2)** β_H is a list of at most H = 8 entries, one per recent block, each a record of
  five fields: the block's header hash h, its state root s, the belt's super-peak b just
  after it, its timeslot t, and p, the packages it reported, each package hash mapped to
  the root of the segments that package exports.
- **(7.3)** β_B is the belt: a list whose places hold a 32-byte peak or nothing (the ? after
  ℍ). Its length grows by one place per binary digit of the block count.
- **(7.4)** θ is a list of (service, hash) pairs: what services handed back when their work
  was accumulated. It isn't part of β. §7 types it because the belt is made from it
  ((7.6) below), and §12 fills it.

ℍ means 32 bytes, usually a hash. The paper writes the fields h, s, b, t. The vectors and
the state's bytes put b before s (`header_hash`, `beefy_root`, `state_root`), as
Appendix D's C(3) does. Same fields, another order.

**On a real value.** `progress_blocks_history-4`, before the block at slot 8, on tiny:

```text
β_H      8 entries: slots 0, 1, 2, 3, 4, 5, 6, 7              at most H = 8: full
β_H[7]   h = 0x214f…   the header hash of the slot 7 block
         s = 0x0000…   its state root: not known yet, 32 zero bytes
         b = 0x658b…   the belt's super-peak just after slot 7
         t = 7         its timeslot
         p = { 0x3d6e… ↦ 0x4fd3… }   one package reported, ↦ its segment root
β_B      [∅, ∅, ∅, 0x658b…]   8 items so far: one mountain of 8 in place 3
```

And θ, from the accumulate vector `work_for_ejected_service-3`, where only service 1
yielded: θ′ = [(1, `0xb8fe…`)].

**In your client.** `RecentBlock`, `ReportedPackage`, `Recent` and `RECENT_BLOCKS` in
`src/history.ts`, written in [9.2's first step](./02-recent-blocks.md#the-records-first);
θ′ is `AccumulationOutput[]` in `src/accumulate.ts`, from
[17.11](../17-accumulation/11-what-a-service-yields.md#the-code).

## (7.5): the blank filled in

::: gray-paper-eq 7.5

<a id="ex-7-5"></a>The Gray Paper's (7.5), [in its place in the paper's words](./02-recent-blocks.md#eq-7-5):

$$
\begin{equation}
\beta_H^\dagger \equiv \beta_H\quad\text{ except }\quad\beta_H^\dagger\left[\left\vert\beta_H\right\vert - 1\right]_{s} = \mathbf{H}_{R} \tag{7.5}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-recenthistorypostparentstaterootupdate" class="gk-wrap">$\beta_H^\dagger$</span> | beta sub H dagger | the recent blocks midway: with the parent's state root filled in, before this block's entry |
| <span id="gk-subb">[$\left[x\right]$](../symbols.md#sequence)</span> | at | x[i]: the item at index i, or the value at key i |
| <span id="gk-len">$\left\vert x\right\vert$</span> | the size of | \|x\|: how many items x has, or how many bytes |
| <span id="gk-H" class="gk-wrap">$\mathbf{H}$</span> | H | this block's header; 𝐇_T is its timeslot, 𝐇_P its parent's hash |
| <span id="gk--priorstateroot">$R$</span> | R | a header's prior state root: 𝐇_R is the root of the state before this block, 32 bytes |

</details>

:::

**Read it aloud.** "Beta-H dagger is defined as beta-H, except that beta-H dagger at the
length of beta-H minus one, its s, equals the header's R."

**In plain words.** Take the list as it is and change one field. The newest entry's
state root (index |β_H| − 1, the last one) becomes this block's 𝐇_R, the parent's state
root, which the header carries. A block can't know its own state root when it is
recorded: the root is computed from the state *after* the block. The next block knows
it, so the next block writes it in. The dagger † marks a value partway through the
block: β_H† is the list after this fix and before the new entry joins. Guarantees are
checked against β_H† ([12.5](../12-guarantees/05-bad-reports.md)), so a package anchored
on the parent block sees its real state root.

**On a real value.** `progress_blocks_history-4`:

```text
|β_H| − 1          8 − 1 = 7: the newest entry, slot 7's
β_H[7].s           0x0000…    before
𝐇_R                0xa6aa…    this block's parent_state_root
β_H†[7].s          0xa6aa…    after; the other 7 entries are untouched
```

**In your client.** `fixed` in `recordBlock`, `src/history.ts`, written in
[9.2](./02-recent-blocks.md#the-code):

```ts
    i === last ? { ...b, state_root: block.parent_state_root } : b,
```

## (E.8): appending to a belt

::: gray-paper-eq E.8

<a id="ex-E-8"></a>The Gray Paper's (E.8), [in its place in the paper's words](./01-the-mountain-belt.md#eq-E-8):

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

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-fnmmrappend" class="gk-wrap">$\mathcal{A}$</span> | A | append to a Merkle mountain range: its peaks and one more item in, the new peaks out |
| <span id="gk-deffunc">$\left\{ \,\begin{aligned}x\vphantom{x'_i}\end{aligned} \right.$</span> | as follows | a brace grouping lines that hold together: for a function, its type on top, then what each input becomes |
| <span id="gk-blob">[$\mathbb{B}$](../symbols.md#blobs)</span> | B, or B sub n | bytes: any run of them; 𝔹ₙ exactly n of them |
| <span id="gk-to">[$\to$](../symbols.md#to)</span> | to | what goes in, to what comes out: A → B takes an A and gives a B |
| <span id="gk-mapsto">$\mapsto$</span> | maps to | what a function gives back for an input: x ↦ y says x becomes y |
| <span id="gk-N" class="gk-wrap">[$\mathbb{N}$](../symbols.md#naturals)</span> | N | the whole numbers: 0, 1, 2 and up; a subscript is a bound, ℕ₈ is 0 to 7 |
| <span id="gk-append">[$\mathbin{+\!\!+}$](../symbols.md#concat)</span> | append | add one item at the end of the sequence |
| <span id="gk-ge">$\ge$</span> | is at least | greater than or equal to |
| <span id="gk-wedge">$\wedge$</span> | and | both sides are true |
| <span id="gk-none" class="gk-wrap">$\emptyset$</span> | nothing | ∅: no value at all, like null |
| <span id="gk-concat" class="gk-wrap">[$\frown$](../symbols.md#concat)</span> | concatenate | join: the left sequence followed by the right |

</details>

:::

**Read it aloud.** "A is a function from a belt, a hash and a hash function to a belt:
r, l and H map to P of r, l, zero, H. Where P maps r, l, n, H to: r with l appended, if n
is at least the length of r; R of r, n, l, if n is less than the length of r and r at n
is nothing; otherwise, P of: R of r, n, nothing; H of r at n joined with l; n plus one;
and H. And R maps a sequence s, an index i and a value v to s prime, where s prime is s
except that s prime at i is v."

**In plain words.** 𝒜 appends the item l to the belt r, hashing with H, which for JAM's
belt is always Keccak-256. It hands the work to P, which walks the places from n = 0,
carrying l. At each place, one of three cases:

1. **Off the end** (n ≥ |r|): the carried hash becomes a new, biggest mountain, appended.
2. **An empty place** (r_n = ∅): the carried hash rests there. R is only "write v at index
   i of a list": R(r, n, l) is r with place n set to l.
3. **A mountain there** (otherwise): merge. Empty place n (R(r, n, ∅)), hash the peak and
   the carried hash together, peak first, H(r_n ⌢ l), and go on to place n + 1 carrying
   that.

It is adding 1 to a binary number, with mountains for 1s and merges for carries
([9.1](./01-the-mountain-belt.md#what-the-gray-paper-says) shows it). ∧ is *and*; ⌢ joins
two byte strings; 𝔹 → ℍ is the type of a hash function, bytes in, 32 bytes out.

**On a real value.** `progress_blocks_history-3`: a belt of 7 items, three mountains,
gets its 8th, `0x8223…`. Each line is one call of P:

```text
r = [0xf986…, 0xca29…, 0xe177…]   7 items: mountains of 1, 2, 4    l = 0x8223…
n = 0   r₀ = 0xf986…: a mountain    H(0xf986… ⌢ 0x8223…) = 0x6791…   place 0 empties
n = 1   r₁ = 0xca29…: a mountain    H(0xca29… ⌢ 0x6791…) = 0xd1e0…   place 1 empties
n = 2   r₂ = 0xe177…: a mountain    H(0xe177… ⌢ 0xd1e0…) = 0x658b…   place 2 empties
n = 3   3 ≥ |r| = 3: off the end    r ++ 0x658b…
r′ = [∅, ∅, ∅, 0x658b…]           8 items: one mountain of 8, 0111 + 1 = 1000
```

Each H is Keccak-256 of 64 bytes, two 32-byte hashes. Then `progress_blocks_history-4`
appends `0xa983…` to that belt, the short way:

```text
n = 0   r₀ = ∅: an empty place      R(r, 0, 0xa983…)
r′ = [0xa983…, ∅, ∅, 0x658b…]       9 items: 1000 + 1 = 1001
```

**In your client.** `appendToBelt` in `src/belt.ts`, written in
[9.1](./01-the-mountain-belt.md#the-code): P's recursion as a loop, carrying one hash
along the places.

## (E.9): a belt as bytes

::: gray-paper-eq E.9

<a id="ex-E-9"></a>The Gray Paper's (E.9), [in its place in the paper's words](./01-the-mountain-belt.md#eq-E-9):

$$
\begin{equation}
\mathcal{E}_{M}\colon\left\{ \,\begin{aligned}
\left[\!\left[\mathbb{H}_{}\boldsymbol{?}\right]\!\right]_{} &\to \mathbb{B}_{} \\
\mathbf{b} &\mapsto \mathcal{E}_{}\left(\left\updownarrow\left[\mathord{\unicode{xBF}}x \;\middle\vert\; x \mathrel{\unicode{x2B40}} \mathbf{b}\right]\right.\!\right)
\vphantom{x'_i}\end{aligned} \right. \tag{E.9}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-fnmmrencode" class="gk-wrap">$\mathcal{E}_{M}$</span> | E sub M | a Merkle mountain range's encoding: its peaks, each maybe empty, with their count in front |
| <span id="gk-encode">[$\mathcal{E}\left(x\right)$](../symbols.md#encode)</span> | E of | the encoding of what's in the brackets: its bytes, by Appendix C's rules |
| <span id="gk-var">[$\left\updownarrow x\right.\!$](../symbols.md#length-prefix)</span> | with its length | ↕x: x with its length in front, as a compact natural |
| <span id="gk-build">$\left\{ x \;\middle\vert\; y \right\}$</span> | for each, such that | built by a rule: the left-hand value, for every case the right-hand side allows (a set, or a sequence in order) |
| <span id="gk-maybe">$\mathord{\unicode{xBF}}x$</span> | maybe | ¿x: the byte 0 if x is nothing (∅), or the byte 1 and then x |
| <span id="gk-orderedin">$\mathrel{\unicode{x2B40}}$</span> | in order, from | each item of the sequence, in its order |

</details>

:::

**Read it aloud.** "E sub M is a function from a sequence of hash-or-nothing to a blob:
bold b maps to E of: length-prefixed, the sequence of maybe x, for each x of b, in
order."

**In plain words.** How a belt is written as bytes in the state. Its number of places
comes first (the ↕ prefix, a compact natural). Then each place in order, as an optional
value: the byte `00` for ∅, or `01` followed by the 32-byte peak (the ¿ is that maybe
encoding, [lesson 4.5](../04-blocks/05-maybe-and-exactly-n.md)).

**On a real value.** The belt after `progress_blocks_history-4`, [0xa983…, ∅, ∅, 0x658b…],
as the vector's own bytes hold it:

```text
04                 4 places: a compact natural, 1 byte
01 a983 4174 …     place 0: a peak, 1 + 32 bytes
00                 place 1: none, 1 byte
00                 place 2: none, 1 byte
01 658b 919f …     place 3: a peak, 1 + 32 bytes
                   1 + 33 + 1 + 1 + 33 = 69 bytes
```

**In your client.** `belt: seq(option(hash))` in the `Recent` record, `src/history.ts`,
written in [9.2](./02-recent-blocks.md#the-records-first): `seq` puts the length in front,
`option` writes each place.

## (E.10): the super-peak

::: gray-paper-eq E.10

<a id="ex-E-10"></a>The Gray Paper's (E.10), [in its place in the paper's words](./01-the-mountain-belt.md#eq-E-10):

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

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-fnmmrsuperpeak" class="gk-wrap">$\mathcal{M}_R$</span> | M sub R | the super-peak: a mountain range's peaks hashed down to one 32-byte root, with Keccak |
| <span id="gk-zerohash" class="gk-wrap">$\mathbb{H}_{0}$</span> | H zero | 32 zero bytes: a placeholder where a hash isn't known yet |
| <span id="gk-keccak">$\mathcal{H}_K\left(x\right)$</span> | H sub K of | the Keccak-256 hash, as Ethereum uses it: 32 bytes |
| <span id="gk-token">$\texttt{x}$</span> | the string | a name in typewriter type: an instruction's or helper's name, or fixed bytes written as text: the ASCII bytes of its words; the dollar sign in front only marks them as text and is not one of the bytes |
| <span id="gk-mmrsuperpeak">$\mathcal{M}_R\left(x\right)$</span> | M sub R of | the super-peak: one hash for a whole belt, its peaks folded together under the word `peak` |
| <span id="gk-ne">$\ne$</span> | is not | not equal |

</details>

:::

**Read it aloud.** "M sub R is a function from a sequence of hash-or-nothing to a hash:
bold b maps to: the zero hash, if the length of h is zero; h zero, if the length of h is
one; otherwise, Keccak of: the string peak, joined with M sub R of h up to its last,
joined with h's last; where h is every h in b, in order, that isn't nothing."

**In plain words.** One hash for the whole belt. First drop the empty places: 𝐡 is the
peaks that exist, smallest mountain first. Then:

- **no peaks**: 32 zero bytes (ℍ₀);
- **one peak**: that peak, as it is;
- **more**: Keccak-256 of the four bytes `peak`, then the super-peak of all but the last
  peak, then the last peak. The fold climbs from the smallest mountain to the biggest.

`$peak` is the paper's way to write the ASCII bytes `peak`. The `$` is not hashed. The
label keeps a super-peak's input, 4 + 32 + 32 = 68 bytes, from ever being the 64 bytes of
a merge in (E.8).

**On a real value.** The belt after `progress_blocks_history-4`:

```text
b      [0xa983…, ∅, ∅, 0x658b…]
𝐡      [0xa983…, 0x658b…]                      the ∅ places dropped: 2 peaks
M_R    H_K("peak" ⌢ M_R([0xa983…]) ⌢ 0x658b…)  more than one: fold
       M_R([0xa983…]) = 0xa983…                one peak: itself
       H_K("peak" ⌢ 0xa983… ⌢ 0x658b…)          4 + 32 + 32 = 68 bytes
       = 0xebdb…                                the new entry's b, its beefy_root
```

And the belt before it, [∅, ∅, ∅, 0x658b…], has one peak, so its super-peak is
`0x658b…` itself: slot 7's b in (7.1)'s example.

**In your client.** `superPeak` in `src/belt.ts`, written in
[9.1](./01-the-mountain-belt.md#the-code), recursive just as the paper writes it.

## (7.6) and (7.7): what each block appends

::: gray-paper-eq 7.6

<a id="ex-7-6"></a>The Gray Paper's (7.6), (7.7), [in its place in the paper's words](./01-the-mountain-belt.md#eq-7-6):

$$
\begin{align}
\text{let } \mathbf{s} &= \left[\mathcal{E}_{4}\left(s\right) \frown \mathcal{E}_{}\left(h\right) \;\middle\vert\; \left(s, h\right) \mathrel{\unicode{x2B40}} \theta'\right] \tag{7.6} \\
\beta_B' &\equiv \mathcal{A}\left(\beta_B, \mathcal{M}_B\left(\mathbf{s}, \mathcal{H}_K\right), \mathcal{H}_K\right) \tag{7.7}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-mmrappend">$\mathcal{A}\left(x\right)$</span> | A of | append one item to a belt, merging equal mountains on the way, as adding 1 carries in binary |
| <span id="gk-merklizewb">$\mathcal{M}_B\left(x\right)$</span> | M sub B of | the well-balanced Merkle root of a list: one hash for all its items |
| <span id="gk-fnkeccak" class="gk-wrap">$\mathcal{H}_K$</span> | H sub K | Keccak-256, Ethereum's hash: 32 bytes, for what other chains must check |

</details>

:::

**Read it aloud.** "Using bold s equals the sequence of: E-4 of s joined with E of h,
for each pair s, h of theta prime, in order. Beta-B prime is defined as A of: beta-B,
M-B of bold s with Keccak, and Keccak."

**In plain words.** Each block adds exactly one item to the belt, made from its
accumulation outputs θ′:

1. **(7.6)** Write each (service, hash) pair as bytes: the service id in 4 bytes,
   little-endian, then the 32-byte hash. 36 bytes each.
2. **(7.7)** Roll the list into one root with M_B, the well-balanced Merkle root, using
   Keccak-256: one item is simply hashed; more are split in halves and joined.
3. **(7.7)** Append that root to the belt with 𝒜, (E.8), also with Keccak-256.

Keccak, ℋ_K, not Blake2b, so that a bridge on Ethereum can check the belt with a hash it
has built in. "Using" introduces a name for this line only.

**On a real value.** The accumulate vector `work_for_ejected_service-3`, slot 45, where
service 1 yields `0xb8fe…` and nobody else yields:

```text
θ′       [(1, 0xb8fe 9f7f …)]                       one output
𝐬        [01 00 00 00 b8fe 9f7f …]                  ℰ₄(1) ⌢ the hash: 4 + 32 = 36 bytes
M_B(𝐬)   H_K(those 36 bytes) = 0x1677 6227 …        one item: its hash
β′_B     𝒜(β_B, 0x1677…, H_K)                       appended as in (E.8)
```

The history vectors start from the root: their `accumulate_root`, `0xa983…` at slot 8, is
M_B(𝐬) for that block, appended in (E.8)'s second example.

**In your client.** `outputsRoot` in `src/accumulate.ts` and `wellBalancedRoot` in
`src/belt.ts` make the root, written in
[17.11](../17-accumulation/11-what-a-service-yields.md#the-code); `recordBlock` appends
it, `appendToBelt(before.belt, block.accumulate_root)`, in
[9.2](./02-recent-blocks.md#the-code).

## (7.8): the new entry, and the last eight

::: gray-paper-eq 7.8

<a id="ex-7-8"></a>The Gray Paper's (7.8), [in its place in the paper's words](./02-recent-blocks.md#eq-7-8):

$$
\begin{equation}
\begin{aligned}
\beta_H' &\equiv {\overleftarrow{\beta_H^\dagger \mathbin{+\!\!+} \left(
h\mathrel{\unicode{x2AF6}}\mathcal{H}\left(\mathbf{H}\right),
s\mathrel{\unicode{x2AF6}}\mathbb{H}_{0},
b\mathrel{\unicode{x2AF6}}\mathcal{M}_R\left(\beta_B'\right),
t\mathrel{\unicode{x2AF6}}\mathbf{H}_{T},
\mathbf{p}
\right)}}^{\mathsf{H}} \\
\text{where } \mathbf{p} &= \left\{\,
\left(
((g_{\mathbf{r}})_{\mathbf{s}})_{p}
\mapsto
((g_{\mathbf{r}})_{\mathbf{s}})_{e}
\right)
\;\middle\vert\;
g \in \mathbf{E}_G
\,\right\}
\end{aligned} \tag{7.8}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-overleftarrow">$\overleftarrow{x}$</span> | the last n of | with a number above: keep only the rightmost (newest) n items; with none: the sequence reversed |
| <span id="gk-is">$x\mathrel{\unicode{x2AF6}} y$</span> | is a | names a field and gives its type, in a tuple |
| <span id="gk-blake">$\mathcal{H}\left(x\right)$</span> | H of | the Blake2b hash of what's in the brackets: 32 bytes |
| <span id="gk--timeslot">$T$</span> | T | a header's timeslot: 𝐇_T is the slot this block was made for |
| <span id="gk-set">$\left\{\,x\,\right\}$</span> | the set of | a set: values with no order and no repeats |
| <span id="gk-kv">$\left(x \mapsto y\right)$</span> | k maps to v | a dictionary entry: key k, value v |
| <span id="gk-g-workreport" class="gk-wrap">$\mathbf{r}$</span> | r | a guarantee's work-report: 𝐠_𝐫 is the report it vouches for |
| <span id="gk-wr-avspec" class="gk-wrap">$\mathbf{s}$</span> | bold s | a report's availability spec: the package's hash, its bundle's length, and the roots of its pieces and of the segments it exports |
| <span id="gk-as-packagehash">$p$</span> | p | the work-package's hash |
| <span id="gk-as-segroot">$e$</span> | e | the root of the segments a package exports |
| <span id="gk-xtguarantees" class="gk-wrap">$\mathbf{E}_G$</span> | E sub G | the guarantees bag: work-reports with their guarantors' signatures, one per core at most |

</details>

:::

**Read it aloud.** "Beta-H prime is defined as: beta-H dagger with a tuple appended, h is
the hash of the header, s is the zero hash, b is M-R of beta-B prime, t is the header's
T, and bold p; keeping the last H. Where bold p is the dictionary of: g's report's
availability spec's p, mapped to g's report's availability spec's e, for each g in the
guarantees extrinsic."

**In plain words.** The block's own entry joins the list, after the fix of (7.5):

- **h**: the Blake2b hash of this block's header.
- **s**: the zero hash, ℍ₀, 32 zero bytes, because the state root isn't known yet. The
  next block's (7.5) fills it in. The paper's own word for it: "inaccurate but safe".
- **b**: the super-peak, (E.10), of the belt *after* this block's append, (7.7).
- **t**: this block's timeslot, 𝐇_T.
- **p**: for every guarantee in this block, its report's package hash ↦ the root of the
  segments that package exports. A dictionary, so it is written sorted by package hash.

Then the arrow over the whole list, with H on top, keeps only the rightmost H = 8
entries: when a ninth joins, the oldest drops off the left.

**On a real value.** `progress_blocks_history-4`, slot 8:

```text
β_H†           slots 0 … 7, slot 7's s now 0xa6aa…      8 entries, from (7.5)
new entry      h = 0xad68…   the header's hash
               s = 0x0000…   not known yet
               b = 0xebdb…   M_R(β′_B), from (E.10)
               t = 8
               p = { 0x1b03… ↦ 0x7d06… }   the one guaranteed package
β_H† ++ entry  slots 0 … 8                              9 entries
β′_H           slots 1 … 8                              the last 8: slot 0 drops
```

**In your client.** `recordBlock` in `src/history.ts`, written in
[9.2](./02-recent-blocks.md#the-code): `entry` is the tuple, and
`[...fixed, entry].slice(-RECENT_BLOCKS)` is the arrow. The packages come from the
block's guarantees through `reportedPackages` in `src/cores.ts`
([12.3](../12-guarantees/03-onto-the-cores.md#the-code)).

## Say it in one breath

The state remembers the last 8 blocks, each by its header hash, state root, belt
super-peak, slot and reported packages. Beside them it keeps a belt of every block's
accumulation outputs (7.1 to 7.4). Each block first writes its parent's state root into
the newest entry (7.5). Then it rolls its accumulation outputs into one Keccak root and
appends it to the belt, merging equal mountains like a binary carry (7.6, 7.7, E.8). Then
it adds its own entry, with a zero state root and the belt's new super-peak, and keeps
the newest 8 (7.8, E.10). The belt is stored as its places, each a peak or nothing (E.9).
