# Part 9 · Recent history

A block carries no memory of its own, so the state keeps one: the last few blocks' hashes,
their state roots, the work they reported, and a running commitment to every
accumulation output, built so other chains can read it. Guarantors lean on this history to
show their work is anchored in a real, recent block. This part builds it.

By the end of this part your client keeps the chain's short-term memory, the last eight
blocks, up to date block by block, with the mountain belt of accumulation outputs.

## The big picture

A block carries no memory of its own. To check a report the chain needs to remember two
things about the recent past: which blocks really happened, so a package can be anchored
on one, and which packages were already reported, so none is reported twice. The paper
opens §7 with exactly that:

::: gray-paper 7 1-1

#### §7 Recent History {#gp-7}

<a id="gp-7-p1"></a>We retain in state information on the most recent $\mathsf{H}$ blocks. This is used to preclude the possibility of duplicate or out of date work-reports from being submitted.

:::

What the memory is made from, and where it lives:

| Piece | Made from | Lives | Who writes it, who reads it |
| --- | --- | --- | --- |
| a recent block's entry | its header hash, its state root, the belt's super-peak, its slot, and the packages it reported: five fields | the state, C(3), the last H = 8 of them | every validator writes one each block; guarantors read it to anchor a package, and every validator checks reports against it ([12.5](../12-guarantees/05-bad-reports.md)) |
| the belt | one 32-byte root per block, of that block's accumulation outputs, folded into at most one peak per binary digit of the block count | the state, C(3), beside the entries, forever | every validator appends to it each block; bridges on other chains read its super-peak |

The life of one entry, on the history vectors' slot 8 block:

1. **The block arrives**, with its header hash `0xad68…`, its parent's state root
   `0xa6aa…` in the header, and one package reported. On the chain, every validator.
2. **The last entry learns its state root.** Slot 7's entry was stored with 32 zero bytes
   for its state root, since nobody knew it yet; now `0xa6aa…` is written in.
3. **The belt grows by one.** This block's accumulation outputs, rolled into one root
   `0xa983…`, are appended; the belt's new super-peak is `0xebdb…`
   ([9.1](./01-the-mountain-belt.md)).
4. **The new entry joins**: header hash, zero state root, super-peak `0xebdb…`, slot 8,
   the package. Nine entries is one too many, so the oldest, slot 0's, is dropped
   ([9.2](./02-recent-blocks.md)).
5. **Later blocks read it.** A guarantee that names slot 8 as its anchor must give the
   same header hash, state root and super-peak; a package reported here may not be
   reported again while the entry is remembered.

If you build web services: the entries are a server's short list of recent request ids,
kept to refuse a replay; the belt is an append-only audit log whose running hash anyone
can check without keeping the log.

**Builds on** [Part 4 · Blocks](../04-blocks/index.md) and [Part 5 · Hashing and
signatures](../05-hashing-and-signatures/index.md), and on the foundations every part
uses, [Parts 0 to 2](../index.md#lessons).

## At a glance

The whole part on one map. Boxes are what your client holds, and rounded cards are the
steps between them; a dashed card happens outside your client. Tap any card, or walk
through them in order with *next*.

<PartFlow :part="9" />

**Starting here?** At the repo root, `npm run catch-up -- 8.9` makes your client the one
this part starts from; [How to read it](../index.md#how-to-read-it) says more.

- [9.1 The mountain belt](./01-the-mountain-belt.md)
- [9.2 Recent blocks](./02-recent-blocks.md)

## In the Gray Paper

Open **§7, *Recent History***, one page, and **Appendix E.2, *Merkle Mountain Ranges and
Belts***, for the belt's append and super-peak; §12's θ′ is where the accumulation
outputs come from, and Appendix D's C(3) is how β sits in the state.

| The paper says | We say | The vectors say |
| --- | --- | --- |
| β ≡ (β_H, β_B): the recent history and the accumulation output log, a Merkle mountain belt; H = 8 | the last eight blocks, and the belt | `beta.history`, `beta.mmr.peaks` |
| for each recent block: header hash h, accumulation-result super-peak b, state root s, timeslot t, reported packages p (package hash → segment root) | the entry's five fields | `header_hash`, `beefy_root`, `state_root`, `slot`, `reported` (`hash`, `exports_root`) |
| β_H†, the recent history with the parent's state root filled in | the history after step 1 | |
| 𝒜, the belt's append; M_R, its super-peak; ℋ_K, Keccak-256 | `appendToBelt`, `superPeak`, `keccak256` | |

Its defining lines, (7.1) to (7.4) and (7.8), each explained symbol by symbol in
[9.A](./gray-paper.md):

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
| <span id="gk-recenthistorypostparentstaterootupdate" class="gk-wrap">$\beta_H^\dagger$</span> | beta sub H dagger | the recent blocks midway: with the parent's state root filled in, before this block's entry |
| <span id="gk-append">[$\mathbin{+\!\!+}$](../symbols.md#concat)</span> | append | add one item at the end of the sequence |
| <span id="gk-is">$x\mathrel{\unicode{x2AF6}} y$</span> | is a | names a field and gives its type, in a tuple |
| <span id="gk-blake">$\mathcal{H}\left(x\right)$</span> | H of | the Blake2b hash of what's in the brackets: 32 bytes |
| <span id="gk-theheader" class="gk-wrap">$\mathbf{H}$</span> | H | this block's header |
| <span id="gk-zerohash" class="gk-wrap">$\mathbb{H}_{0}$</span> | H zero | 32 zero bytes: a placeholder where a hash isn't known yet |
| <span id="gk-mmrsuperpeak">$\mathcal{M}_R\left(x\right)$</span> | M sub R of | the super-peak: one hash for a whole belt, its peaks folded together under the word `peak` |
| <span id="gk--timeslot">$T$</span> | T | a header's timeslot: 𝐇_T is the slot this block was made for |
| <span id="gk-set">$\left\{\,x\,\right\}$</span> | the set of | a set: values with no order and no repeats |
| <span id="gk-build">$\left\{ x \;\middle\vert\; y \right\}$</span> | for each, such that | built by a rule: the left-hand value, for every case the right-hand side allows (a set, or a sequence in order) |
| <span id="gk-kv">$\left(x \mapsto y\right)$</span> | k maps to v | a dictionary entry: key k, value v |
| <span id="gk-g-workreport" class="gk-wrap">$\mathbf{r}$</span> | r | a guarantee's work-report: 𝐠_𝐫 is the report it vouches for |
| <span id="gk-wr-avspec" class="gk-wrap">$\mathbf{s}$</span> | bold s | a report's availability spec: the package's hash, its bundle's length, and the roots of its pieces and of the segments it exports |
| <span id="gk-as-packagehash">$p$</span> | p | the work-package's hash |
| <span id="gk-as-segroot">$e$</span> | e | the root of the segments a package exports |
| <span id="gk-xtguarantees" class="gk-wrap">$\mathbf{E}_G$</span> | E sub G | the guarantees bag: work-reports with their guarantors' signatures, one per core at most |

</details>

:::

Read it aloud: "beta is the pair beta-H, beta-B. Beta-H is a sequence of at most H
entries, each a header hash h, a state root s, a super-peak b, a timeslot t and a
dictionary p from hash to hash; beta-B is a sequence of optional hashes; theta is a
sequence of service and hash pairs. The new beta-H is beta-H dagger with a new entry
appended, keeping the last H: the entry's h is the hash of this header, its s the zero
hash, its b the super-peak of the new belt, its t this header's timeslot, and its p each
guaranteed report's package hash mapped to its segment root." The question mark in
ℍ? means a place may be empty, which is how a belt looks between merges. A block's own
state root isn't known when the block is made, so its entry gets the zero hash and the
*next* block fills it in, as (7.5) says: that is β_H†.

**Test yourself:** [Ch. 7 Recent History](https://abutlabs.github.io/jam-learning/lasair/exam.html?chapter=ch07-recent-history),
self-test cards on JAM learning.
