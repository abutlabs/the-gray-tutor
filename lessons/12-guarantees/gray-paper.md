# The formulas, in plain words

[Part 12](./index.md)'s appendix: every formula the part quotes, read for someone who doesn't read math.
They come from §11.3 to §11.5, with two limits from §11.1: who guarantees which core
(11.19 to 11.23), what a guarantee is (11.24), the rules a guarantee keeps (11.25 to
11.33), the rules its report keeps against the chain (11.3, 11.8 and 11.34 to 11.45), and
how the reports take their cores (11.46). [The part's page](./index.md#the-big-picture)
tells who does what; everything here is the chain's side, on every validator, your client
included. Each formula comes with its key, then the same four steps: read it aloud, say it
in plain words, watch it work on a real vector, and find it in your client. [Reading the
Gray Paper](../reading-the-gray-paper.md) teaches the shapes a line can take, if one of
these stops you.

The real values come from the tiny reports vectors: 6 validators, 2 cores, an epoch of
E = 12 slots, a rotation of R = 4, and most of them a block at slot 14.
`report_prev_rotation-1` is the main one: one guarantee, for core 0, made at slot 10 and
signed by validators 1, 2 and 5.

## (11.19): the assignment's shape

::: gray-paper-eq 11.19

<a id="ex-11-19"></a>The Gray Paper's (11.19), [in its place in the paper's words](./01-who-guarantees-what.md#eq-11-19):

$$
\begin{equation}
\mathbf{M} \in \!\left\lgroup\left[\!\left[\mathbb{N}_{\mathsf{C}}\right]\!\right]_{\left\vert\kappa'\right\vert}, \left[\!\left[\mathbb{K}\right]\!\right]_{\left\vert\kappa'\right\vert}\right\rgroup\! \tag{11.19}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-guarantorassignments" class="gk-wrap">$\mathbf{M}$</span> | M | the guarantor assignments: each validator's core this rotation, and the validators' keys |
| <span id="gk-in">[$\in$](../symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-tuple">$\!\left\lgroup x\right\rgroup\!$</span> | the tuple of | a record: named fields, each with its type, like an object in JSON |
| <span id="gk-sequence">[$\left[\!\left[x\right]\!\right]$](../symbols.md#sequence)</span> | a sequence of | ⟦T⟧ is an array of T; a subscript is its length, :n at most n, n: at least n |
| <span id="gk-len">$\left\vert x\right\vert$</span> | the size of | \|x\|: how many items x has, or how many bytes |
| <span id="gk-activeset" class="gk-wrap">$\kappa$</span> | kappa | the current validators: the keys of the V validators active this epoch |
| <span id="gk-coreindex" class="gk-wrap">$\mathbb{N}_{\mathsf{C}}$</span> | N sub C | the core indices: 0 to C − 1 |
| <span id="gk-valkey" class="gk-wrap">$\mathbb{K}$</span> | K | a validator's key set: 336 bytes holding its Bandersnatch, Ed25519 and BLS keys and its metadata |

</details>

:::

**Read it aloud.** "M is in: the pair of a sequence of core indices, one for each of the
validators in kappa prime, and a sequence of validator keys, as many."

**In plain words.** A type line. The guarantor assignment is two lists of the same
length, one entry per validator: the core it guarantees for, and its keys. Three
validators per active core, every block.

**On a real value.** On tiny, 6 validators: 6 cores (each 0 or 1) and 6 keys. On full,
1,023 of each, 3 for each of 341 cores.

**In your client.** `Assignment` in `src/guarantors.ts`, written in [lesson
12.1](./01-who-guarantees-what.md#the-code).

## (11.20) to (11.22): dealing the cores

::: gray-paper-eq 11.20

<a id="ex-11-20"></a>The Gray Paper's (11.20), (11.21), (11.22), [in its place in the paper's words](./01-who-guarantees-what.md#eq-11-20):

$$
\begin{align}
R(\mathbf{c}, n) &\equiv \left[(x + n) \bmod \frac{\left\vert\mathbf{c}\right\vert}{3} \;\middle\vert\; x \mathrel{\unicode{x2B40}} \mathbf{c}\right] \tag{11.20} \\
P(v, e, t) &\equiv R\left(
\mathcal{F}\left(\left[\left\lfloor\frac{i}{3}\right\rfloor \;\middle\vert\; i \mathrel{\unicode{x2B40}} \mathbb{N}_{v}\right], e\right),
\left\lfloor\frac{t \bmod \mathsf{E}}{\mathsf{R}}\right\rfloor
\right) \tag{11.21} \\
\mathbf{M} &\equiv \left(P(\left\vert\kappa'\right\vert, \eta'_2, \tau'), \Phi(\kappa')\right) \tag{11.22}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-sq">[$\left[x\right]$](../symbols.md#sequence)</span> | the sequence | a sequence written out item by item; [ ] is the empty one |
| <span id="gk-build">$\left\{ x \;\middle\vert\; y \right\}$</span> | for each, such that | built by a rule: the left-hand value, for every case the right-hand side allows (a set, or a sequence in order) |
| <span id="gk-bmod">[$\bmod$](../symbols.md#mod)</span> | mod | the remainder after dividing: 14 mod 4 is 2 |
| <span id="gk-frac">$\frac{x}{y}$</span> | over | a fraction: the top divided by the bottom |
| <span id="gk-orderedin">$\mathrel{\unicode{x2B40}}$</span> | in order, from | each item of the sequence, in its order |
| <span id="gk-fyshuffle">$\mathcal{F}\left(x\right)$</span> | F of | the Fisher-Yates shuffle: the sequence reordered by an entropy, the same way on every validator |
| <span id="gk-ffrac">$\left\lfloor\frac{x}{y}\right\rfloor$</span> | x over y, rounded down | whole-number division, the remainder dropped: ⌊7/3⌋ is 2 |
| <span id="gk-Nmax">[$\mathbb{N}_{x}$](../symbols.md#naturals)</span> | N sub n | the whole numbers below n: ℕ_C is a core index, 0 to C − 1 |
| <span id="gk-Cepochlen" class="gk-wrap">$\mathsf{E}$</span> | E | an epoch's length in slots: 600 on full, 12 on tiny |
| <span id="gk-Crotationperiod" class="gk-wrap">$\mathsf{R}$</span> | R | how often the guarantors move on to another core: every 10 slots on full, 4 on tiny |
| <span id="gk-entropy" class="gk-wrap">$\eta$</span> | eta | entropy: four 32-byte values of randomness, the newest mixing in every block |
| <span id="gk-thetime" class="gk-wrap">$\tau$</span> | tau | the time: the latest block's timeslot |
| <span id="gk-Phi">$\Phi$</span> | Phi | the key nullifier: each key set as it is, or 336 zero bytes if its Ed25519 key is an offender's |

</details>

:::

**Read it aloud.** "R of c and n is defined as the sequence of x plus n, mod the length of
c over 3, for each x in order in c. P of v, e and t is defined as R of: the Fisher-Yates
shuffle, by e, of the floor of i over 3 for each i below v; and the floor of t mod E over
R. M is defined as the pair of P of the length of kappa prime, eta prime two and tau
prime, and Phi of kappa prime."

**In plain words.** Three steps, every validator computing the same:

1. **Seats.** Validator i gets core ⌊i/3⌋: `0 0 0 1 1 1 2 2 2 …`, three to a core.
2. **Shuffle** (ℱ) the seats with the entropy η′₂, two epochs old, so nobody chooses
   their core and every fork agrees.
3. **Rotate** (R): every R slots into the epoch, add one to every core, wrapping round
   the active cores (|𝐜|/3 of them). So a validator stays on a core for at most R slots.

M is that list of cores for the current validators κ′ at this block's slot τ′, with κ′'s
keys after Φ, which blanks every offender's key to zeros.

**On a real value.** `report_prev_rotation-1`, slot 14:

```text
seats                   0 0 0 1 1 1          ⌊i/3⌋ for i = 0 to 5
ℱ(seats, η′₂ 0x7b0aa173…)  1 0 1 1 0 0
turns                   ⌊(14 mod 12) / 4⌋ = ⌊2/4⌋ = 0
R(…, 0)                 (x + 0) mod 2        1 0 1 1 0 0: M's cores
```

At slot 16 it is ⌊4/4⌋ = 1 turn: (x + 1) mod 2 swaps them, `0 1 0 0 1 1`. Validators 1,
4 and 5 guarantee core 0 at slot 14.

**In your client.** `assignCores` and `guarantorAssignments` in `src/guarantors.ts`,
written in [lesson 12.1](./01-who-guarantees-what.md#the-code); ℱ is
[lesson 7.2](../07-time-and-shuffling/02-the-shuffle.md)'s shuffle and Φ
[lesson 8.2](../08-safrole/02-rotating-the-validators.md)'s.

## (11.23): the rotation before

::: gray-paper-eq 11.23

<a id="ex-11-23"></a>The Gray Paper's (11.23), [in its place in the paper's words](./01-who-guarantees-what.md#eq-11-23):

$$
\begin{equation}
\begin{aligned}
\text{let } \left(\mathbf{k}, e\right) &= \begin{cases}
\left(\kappa', \eta'_2\right) &\text{if } \displaystyle\left\lfloor\frac{\tau' - \mathsf{R}}{\mathsf{E}}\right\rfloor = \left\lfloor\frac{\tau'}{\mathsf{E}}\right\rfloor\\
\left(\lambda', \eta'_3\right) &\text{otherwise}
\end{cases} \\
\mathbf{M}^* &\equiv \left(
P(\left\vert\mathbf{k}\right\vert, e, \tau' - \mathsf{R}),
\Phi(\mathbf{k})
\right)
\end{aligned} \tag{11.23}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-previousset" class="gk-wrap">$\lambda$</span> | lambda | the last epoch's validators: kept to check what they signed before the change |
| <span id="gk-guarantorassignmentsunderlastrotation" class="gk-wrap">$\mathbf{M}^*$</span> | M star | the guarantor assignments of the rotation before this one |

</details>

:::

**Read it aloud.** "Let k and e be: kappa prime and eta prime two, when the floor of tau
prime minus R over E equals the floor of tau prime over E; otherwise lambda prime and eta
prime three. M star is defined as the pair of P of the length of k, e, and tau prime minus
R; and Phi of k."

**In plain words.** 𝐌\* is the assignment as it was one rotation ago, at τ′ − R. If that
slot is in the same epoch, it's dealt from the same validators and entropy. If it falls in
the previous epoch, it's dealt from that epoch's validators, λ′, and its entropy, η′₃, so
it comes out exactly as it did then.

**On a real value.** `report_prev_rotation-1`, slot 14:

```text
τ′ − R                  14 − 4 = 10
same epoch?             ⌊10/12⌋ = 0, ⌊14/12⌋ = 1: no, so λ′ and η′₃
ℱ(seats, η′₃ 0x8c039ff7…)  1 0 0 1 1 0
turns at slot 10        ⌊(10 mod 12) / 4⌋ = 2
R(…, 2)                 (x + 2) mod 2        1 0 0 1 1 0: M*'s cores
M*'s keys               λ′: 0xcab2…, 0xab00…, 0x4418…, 0x8b8c…, 0xad93…, 0xf30a…
```

So in the rotation before, validators 1, 2 and 5 were core 0's.

**In your client.** `guarantorAssignments` returns both, `current` and `last` ([lesson
12.1](./01-who-guarantees-what.md#the-code)).

## (11.24): a guarantee

::: gray-paper-eq 11.24

<a id="ex-11-24"></a>The Gray Paper's (11.24), [in its place in the paper's words](./index.md#eq-11-24):

$$
\begin{equation}
\mathbb{G} \equiv \!\left\lgroup
\mathbf{r}\in \mathbb{R},\,
t\in \mathbb{N}_T,\,
a\in \left[\!\left[\!\left\lgroup\mathbb{N}, \bar{\mathbb{V}}\right\rgroup\!\right]\!\right]_{2:3}
\right\rgroup\! \tag{11.24}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-guarantee" class="gk-wrap">$\mathbb{G}$</span> | G | the set of guarantees: a work-report, the slot it was made at, and two or three guarantors' signatures |
| <span id="gk-isa">[$x\in y$](../symbols.md#in)</span> | in | belongs to: the field's type |
| <span id="gk-g-workreport" class="gk-wrap">$\mathbf{r}$</span> | r | a guarantee's work-report: 𝐠_𝐫 is the report it vouches for |
| <span id="gk-workreport" class="gk-wrap">$\mathbb{R}$</span> | R | the set of work-reports: a core's signed receipt for one work-package |
| <span id="gk-g-timeslot">$t$</span> | t | a guarantee's timeslot: the slot its guarantors signed it in |
| <span id="gk-timeslot" class="gk-wrap">$\mathbb{N}_T$</span> | N sub T | a timeslot: a u32 counting 6-second slots |
| <span id="gk-g-credential">$a$</span> | a | a guarantee's credential: two or three pairs of a validator index and its Ed25519 signature |
| <span id="gk-N" class="gk-wrap">[$\mathbb{N}$](../symbols.md#naturals)</span> | N | the whole numbers: 0, 1, 2 and up; a subscript is a bound, ℕ₈ is 0 to 7 |
| <span id="gk-edsignaturebase" class="gk-wrap">$\bar{\mathbb{V}}$</span> | V bar | an Ed25519 signature: 64 bytes |

</details>

:::

**Read it aloud.** "G is defined as the tuple of: r, a work-report; t, a timeslot; and a,
a sequence of two to three pairs, each a natural and an Ed25519 signature."

**In plain words.** A guarantee is the report, the slot the guarantors made it at, and
their credential: two or three (validator index, signature) pairs. Two is enough, three
is normal: a core has three guarantors, and one may be slow or offline.

**On a real value.** `report_prev_rotation-1`'s one guarantee, 610 bytes:

```text
𝐫  report       407 bytes, core 0, package 0x63c03371…
t  slot         10                         4 bytes
a  signatures   3 pairs                    1 byte: the count
   (1, 0x…)   (2, 0x…)   (5, 0x…)         3 × (2 + 64) = 198 bytes
                                           407 + 4 + 1 + 198 = 610 bytes
```

`no_enough_guarantees-1` carries one signature: not even a guarantee by this type, and the
block is refused with `insufficient_guarantees`.

**In your client.** `ReportGuarantee` in `src/block.ts`, from [lesson
4.3](../04-blocks/03-guarantees.md#the-code).

## (11.25) and (11.26): one per core, in order

::: gray-paper-eq 11.25

<a id="ex-11-25"></a>The Gray Paper's (11.25), (11.26), [in its place in the paper's words](./04-bad-guarantees.md#eq-11-25):

$$
\begin{align}
\mathbf{E}_G &\in \left[\!\left[\mathbb{G}\right]\!\right]_{:\mathsf{C}} \tag{11.25} \\
\mathbf{E}_G &= \left[\mathbf{g} \in \mathbf{E}_G\,\wr\!\wr\,(\mathbf{g}_{\mathbf{r}})_{c}\right] \tag{11.26}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-xtguarantees" class="gk-wrap">$\mathbf{E}_G$</span> | E sub G | the guarantees bag: work-reports with their guarantors' signatures, one per core at most |
| <span id="gk-Ccorecount" class="gk-wrap">$\mathsf{C}$</span> | C | the number of cores: 341 on full, 2 on tiny |
| <span id="gk-sqorderuniqby">$\left[y\,\wr\!\wr\,x\right]$</span> | sorted, no repeats, by | sorted by the key on the right, each key once |
| <span id="gk-gX" class="gk-wrap">$\mathbf{g}$</span> | g | a guarantee |
| <span id="gk-wr-core">$c$</span> | c | the core a report's work was done on, 0 to C − 1 |

</details>

:::

**Read it aloud.** "E sub G is in: a sequence of at most C guarantees. E sub G equals E sub
G ordered and unique by the core of g's report."

**In plain words.** At most one guarantee per core in a block, and the guarantees sorted by
core. Saying "the list equals itself sorted, without repeats" is the paper's way of
saying both at once.

**On a real value.**

```text
multiple_reports-1         cores 0, 1        sorted, no repeat: fine
out_of_order_guarantees-1  cores 0, 0        a repeat: out_of_order_guarantee
```

**In your client.** `guaranteeError`'s `inOrder` in `src/guarantors.ts` ([lesson
12.4](./04-bad-guarantees.md#the-code)).

## (11.27): signers in order

::: gray-paper-eq 11.27

<a id="ex-11-27"></a>The Gray Paper's (11.27), [in its place in the paper's words](./04-bad-guarantees.md#eq-11-27):

$$
\begin{align}
\forall g &\in \mathbf{E}_G : g_{a} = \left[\left(v, s\right) \in g_{a}\,\wr\!\wr\,v\right] \tag{11.27}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-forall">$\forall$</span> | for all | for every value: ∀c ∈ ℕ_C means for each core c |

</details>

:::

**Read it aloud.** "For every g in E sub G: g's credential equals g's credential ordered
and unique by v, over the pairs v and s in it."

**In plain words.** Within one guarantee, the signatures are sorted by validator index,
and no validator signs twice.

**On a real value.**

```text
report_prev_rotation-1   1, 2, 5     fine
not_sorted_guarantor-1   5, 4, 1     not_sorted_or_unique_guarantors
```

**In your client.** `guaranteeError`'s `signersInOrder` ([lesson
12.4](./04-bad-guarantees.md#the-code)).

## (11.28) and (11.29): signed, by the right validators, recently

::: gray-paper-eq 11.28

<a id="ex-11-28"></a>The Gray Paper's (11.28), (11.29), [in its place in the paper's words](./02-signed-and-counted.md#eq-11-28):

$$
\begin{gather}
\begin{aligned}
&\begin{aligned}
\forall \left(\mathbf{r}, t, a\right) &\in \mathbf{E}_G,\\
\forall \left(v, s\right) &\in a
\end{aligned} : \left\{ \,\begin{aligned}
&v < \left\vert\mathbf{k}\right\vert \wedge \mathbf{c}_{v} = \mathbf{r}_{c} < \frac{\left\vert\kappa'\right\vert}{3}\\
&s \in \bar{\mathbb{V}}_{(\mathbf{k}_{v})_{e}}\left\langle\mathsf{X}_G\frown\mathcal{H}\left(\mathbf{r}\right)\right\rangle\\
&\mathsf{R}(\left\lfloor{}^{\tau'}\!/_{\mathsf{R}}\right\rfloor - 1) \le t \le \tau'
\end{aligned} \right.\\
&k \in \mathbf{G} \Leftrightarrow \exists \left(\mathbf{r}, t, a\right) \in \mathbf{E}_G, \exists \left(v, s\right) \in a: k = (\mathbf{k}_{v})_{e}\\
&\quad \text{where } \left(\mathbf{c}, \mathbf{k}\right) = \begin{cases}
\mathbf{M} &\text{if } \displaystyle \left\lfloor\frac{\tau'}{\mathsf{R}}\right\rfloor = \left\lfloor\frac{t}{\mathsf{R}}\right\rfloor \\
\mathbf{M}^* &\text{otherwise}
\end{cases}
\end{aligned} \tag{11.28} \\
\mathsf{X}_G \equiv \texttt{\$jam\_guarantee} \tag{11.29}
\end{gather}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-abracegroup">$\left\{ \begin{aligned}x\end{aligned} \right.$</span> | as follows | a brace grouping lines that hold together: for a function, its type on top, then what each input becomes |
| <span id="gk-wedge">$\wedge$</span> | and | both sides are true |
| <span id="gk-edsignature">$\bar{\mathbb{V}}_{x}\left\langle y\right\rangle$</span> | V bar sub k of m | the valid Ed25519 signatures by key k on message m: 64 bytes |
| <span id="gk-vk-ed">$e$</span> | e | a validator's Ed25519 key: the 32 bytes after its Bandersnatch key |
| <span id="gk-Xguarantee" class="gk-wrap">$\mathsf{X}_G$</span> | X sub G | the 13 bytes `jam_guarantee`, signed in front of a report's hash to guarantee it |
| <span id="gk-concat" class="gk-wrap">[$\frown$](../symbols.md#concat)</span> | concatenate | join: the left sequence followed by the right |
| <span id="gk-blake">$\mathcal{H}\left(x\right)$</span> | H of | the Blake2b hash of what's in the brackets: 32 bytes |
| <span id="gk-floor">[$\left\lfloor x\right\rfloor$](../symbols.md#floor)</span> | floor of | rounded down to a whole number |
| <span id="gk-nicefrac">${}^{x}\!/_{y}$</span> | over | a fraction: the top divided by the bottom |
| <span id="gk-le">$\le$</span> | at most | less than or equal to |
| <span id="gk-reporters" class="gk-wrap">$\mathbf{G}$</span> | G | the reporters: the Ed25519 keys of every guarantor who signed a guarantee in this block |
| <span id="gk-Leftrightarrow">$\Leftrightarrow$</span> | exactly when | if and only if: both sides are true together, or false together |
| <span id="gk-exists">[$\exists$](../symbols.md#exists)</span> | there exists | there is at least one value such that what follows holds |
| <span id="gk-token">$\texttt{x}$</span> | the string | a name in typewriter type: an instruction's or helper's name, or fixed bytes written as text: the ASCII bytes of its words; the dollar sign in front only marks them as text and is not one of the bytes |

</details>

:::

**Read it aloud.** "For every guarantee (r, t, a) in E sub G and every pair (v, s) in a:
v is less than the length of k, and c at v equals r's core, which is less than the number
of validators over 3; s is an Ed25519 signature by k at v's key, of X sub G concatenated
with H of r; and R times (the floor of tau prime over R, minus 1) is at most t, which is
at most tau prime. And k is in G exactly when some guarantee in E sub G has some pair
(v, s) with k equal to k at v's Ed25519 key. Where c and k are M when the floor of tau
prime over R equals the floor of t over R, and M star otherwise. X sub G is defined as the
token jam guarantee."

**In plain words.** One rule with five checks for every signature, and one definition:

1. **Which assignment.** A guarantee made in this block's rotation answers to 𝐌; one made
   in the rotation before answers to 𝐌\*. That's the `where` at the bottom.
2. **A real validator**: v is below the number of keys.
3. **On this core**: the assignment puts v on the report's core, and that core is active,
   below |κ′|/3, even if it was active in the rotation before and isn't now.
4. **Really signed**: s is v's Ed25519 signature over `jam_guarantee` and the report's
   hash. An offender's key is all zeros after Φ, so its signature can never pass.
5. **Recent**: t is no later than τ′ and no earlier than the start of the last rotation.

Then 𝐆, the reporters: the Ed25519 key of every signer in the block, a set, so each once.
The statistics count them.

**On a real value.** `report_prev_rotation-1`, τ′ = 14, t = 10:

```text
rotation        ⌊14/4⌋ = 3, ⌊10/4⌋ = 2: not equal, so M*
v < |k|         1, 2, 5 < 6
c[v]            M*'s cores at 1, 2, 5: 0, 0, 0 = the report's core 0 < 6/3 = 2
H(r)            0x6c9dd0e7…   the 407-byte report, hashed
message         "jam_guarantee" ⌢ H(r): 13 + 32 = 45 bytes
s               verifies by λ′[1], λ′[2] and λ′[5]: true, true, true
window          4 × (3 − 1) = 8 ≤ 10 ≤ 14
𝐆               { 0x4418fb8c…, 0xab0084d0…, 0xf30aa544… }
```

And the vectors that break each check: `wrong_assignment-1` (signer 2 is on core 1 in
𝐌), `bad_core_index-1` (core 3), `future_report_slot-1` (slot 14 in a block at 13),
`report_before_last_rotation-1` (slot 14 in a block at 22: 4 × (5 − 1) = 16 > 14).

**In your client.** `guaranteeSigned`, `reporters` and `guaranteeMessage` in [lesson
12.2](./02-signed-and-counted.md#the-code); the who and when checks in `guaranteeError`
([lesson 12.4](./04-bad-guarantees.md#the-code)); `assignmentFor` picks 𝐌 or 𝐌\* ([lesson
12.1](./01-who-guarantees-what.md#the-code)).

## (11.30): the incoming reports

::: gray-paper-eq 11.30

<a id="ex-11-30"></a>The Gray Paper's (11.30), [in its place in the paper's words](./04-bad-guarantees.md#eq-11-30):

$$
\begin{align}
\text{let }\mathbf{I} = \left\{\,  \mathbf{g}_{\mathbf{r}}  \;\middle\vert\;  \mathbf{g} \in \mathbf{E}_G  \,\right\} \tag{11.30}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-incomingreports" class="gk-wrap">$\mathbf{I}$</span> | I | the incoming reports: the work-reports this block's guarantees carry |
| <span id="gk-set">$\left\{\,x\,\right\}$</span> | the set of | a set: values with no order and no repeats |

</details>

:::

**Read it aloud.** "Let I be the set of g's report, for each g in E sub G."

**In plain words.** A name for later rules: 𝐈 is the reports the block's guarantees carry.

**On a real value.** `report_prev_rotation-1`: 𝐈 holds one report, package `0x63c03371…`
on core 0.

**In your client.** `reportError` takes them as its first argument ([lesson
12.5](./05-bad-reports.md#the-code)).

## (11.31): one shard per validator

::: gray-paper-eq 11.31

<a id="ex-11-31"></a>The Gray Paper's (11.31), [in its place in the paper's words](./04-bad-guarantees.md#eq-11-31):

$$
\begin{equation}
\forall \mathbf{r} \in \mathbf{I} : (\mathbf{r}_{\mathbf{s}})_{v} = \left\vert\kappa'\right\vert \tag{11.31}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-wr-avspec" class="gk-wrap">$\mathbf{s}$</span> | bold s | a report's availability spec: the package's hash, its bundle's length, and the roots of its pieces and of the segments it exports |
| <span id="gk-as-erasureshards">$v$</span> | v | how many shards the data is cut into: one per validator, 1,023 on full, 6 on tiny |

</details>

:::

**Read it aloud.** "For every r in I: r's s's v equals the number of validators in kappa
prime."

**In plain words.** The report's data was erasure-coded into v shards, one for each
validator that will assure it, so v must be the current validator count.

**On a real value.** `report_prev_rotation-1`: 6 shards, 6 validators. `bad_erasure_shards-1`
says 5: `bad_erasure_shards`.

**In your client.** `guaranteeError`'s `shards` ([lesson 12.4](./04-bad-guarantees.md#the-code)).

## (11.32): a free core, and a known authorizer

::: gray-paper-eq 11.32

<a id="ex-11-32"></a>The Gray Paper's (11.32), [in its place in the paper's words](./04-bad-guarantees.md#eq-11-32):

$$
\begin{equation}
\forall \mathbf{r} \in \mathbf{I} :
\rho^\ddagger\left[\mathbf{r}_{c}\right] = \emptyset \wedge \mathbf{r}_{a} \in \alpha\left[\mathbf{r}_{c}\right] \tag{11.32}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-availassignmentspostassurances" class="gk-wrap">$\rho^\ddagger$</span> | rho double dagger | the pending reports midway: after the available ones and the timed-out ones left |
| <span id="gk-none" class="gk-wrap">$\emptyset$</span> | nothing | ∅: no value at all, like null |
| <span id="gk-authpool" class="gk-wrap">$\alpha$</span> | alpha | the authorizer pools: for each core, up to O = 8 authorizer hashes it accepts right now |

</details>

:::

**Read it aloud.** "For every r in I: rho double-dagger at r's core is nothing, and r's
authorizer is in alpha at r's core."

**In plain words.** Two checks that join three parts. The core must be empty after this
block's assurances ([Part 11](../11-assurances/index.md)): a core holds one report at a
time. And the report's authorizer hash must be in that core's pool
([Part 13](../13-authorization/index.md)): the gatekeeper the guarantors ran must be one
the core accepts. This is the only place the chain checks an authorizer at all.

**On a real value.**

```text
report_prev_rotation-1  ρ‡[0] = ∅; 0x9a3a97d1 ∈ α[0] = [0x9a3a97d1, 0x66ae71c0]   fine
core_engaged-1          ρ‡[0] holds a report since slot 13                         core_engaged
not_authorized-1        core 1: α[1] is empty, so 0x9a3a97d1 isn't in it          core_unauthorized
```

**In your client.** `guaranteeError`'s `free` and `authorized` ([lesson
12.4](./04-bad-guarantees.md#the-code)).

## (11.33): enough gas, not too much

::: gray-paper-eq 11.33

<a id="ex-11-33"></a>The Gray Paper's (11.33), [in its place in the paper's words](./05-bad-reports.md#eq-11-33):

$$
\begin{equation}
\forall \mathbf{r} \in \mathbf{I}:
\sum_{\mathbf{d} \in \mathbf{r}_{\mathbf{d}}}\!(\mathbf{d}_{g}) \le \mathsf{G}_A \ \wedge \
\forall \mathbf{d} \in \mathbf{r}_{\mathbf{d}}: \mathbf{d}_{g} \ge \delta\left[\mathbf{d}_{s}\right]_{g} \tag{11.33}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-sum">$\sum$</span> | the sum of | add up what follows, once for each value the subscript ranges over |
| <span id="gk-wdX" class="gk-wrap">$\mathbf{d}$</span> | d | a work-digest |
| <span id="gk-wd-gaslimit">$g$</span> | g | the gas the item's accumulation may use (`accumulate_gas`) |
| <span id="gk-Creportaccgas" class="gk-wrap">$\mathsf{G}_A$</span> | G sub A | the most gas a report's accumulation may be given: 10,000,000 |
| <span id="gk-ge">$\ge$</span> | is at least | greater than or equal to |
| <span id="gk-accounts" class="gk-wrap">$\delta$</span> | delta | the service accounts: every service's code hash, balance, storage and preimages |
| <span id="gk-wd-serviceindex">$s$</span> | s | the service the item was for, whose accumulate gets the result |

</details>

:::

**Read it aloud.** "For every r in I: the sum of g over r's digests is at most G sub A,
and every digest's g is at least the minimum accumulate gas of the service at its s."

**In plain words.** A report may ask for at most G_A = 10,000,000 gas to accumulate, all
its digests together. And each digest must offer at least what its service says it needs
per item, the service's minimum. The cap is per report, not per block.

**On a real value.**

```text
report_prev_rotation-1       18,012 ≤ 10,000,000; 18,012 ≥ 10 (service 42's minimum)
high_work_report_gas-1       9,999,987 and 10,000,000: each ≤ 10,000,000, fine
too_high_work_report_gas-1   10,000,029 > 10,000,000: work_report_gas_too_high
service_item_gas_too_low-1   9 < 10: service_item_gas_too_low
```

The second asks 19,999,987 in all and passes: each report is checked on its own.

**In your client.** `reportError`'s `gas` and its last check ([lesson
12.5](./05-bad-reports.md#the-code)).

## (11.3): at most eight dependencies

::: gray-paper-eq 11.3

<a id="ex-11-3"></a>The Gray Paper's (11.3), [in its place in the paper's words](./05-bad-reports.md#eq-11-3):

$$
\begin{equation}
\forall \mathbf{r} \in \mathbb{R} : \left\vert\mathbf{r}_{\mathbf{l}}\right\vert + \left\vert(\mathbf{r}_{\mathbf{c}})_{\mathbf{p}}\right\vert \le \mathsf{J} \tag{11.3}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-wr-srlookup" class="gk-wrap">$\mathbf{l}$</span> | l | the segment-root lookup: for each package whose exports it imports by package hash, that package's segments root |
| <span id="gk-wr-context" class="gk-wrap">$\mathbf{c}$</span> | c | a report's refinement context: the blocks its package was built against, and its prerequisites |
| <span id="gk-wc-prerequisites" class="gk-wrap">$\mathbf{p}$</span> | p | a context's prerequisites: hashes of packages that must be accumulated first |
| <span id="gk-Cmaxreportdeps" class="gk-wrap">$\mathsf{J}$</span> | J | the most dependencies a report may have, prerequisites and segment-root lookups together: 8 |

</details>

:::

**Read it aloud.** "For every r in R: the length of r's l, plus the length of r's
context's p, is at most J."

**In plain words.** A report may lean on at most J = 8 other packages: those it imported
from by package hash (its lookup) and those its context says must come first.

**On a real value.** `report_prev_rotation-1`: 0 + 0 = 0. `too_many_dependencies-1`: 5
lookups + 4 prerequisites = 9 > 8, `too_many_dependencies`.

**In your client.** `reportError`'s `fewDependencies` ([lesson
12.5](./05-bad-reports.md#the-code)).

## (11.8) to (11.10): at most 48 KiB of output

::: gray-paper-eq 11.8

<a id="ex-11-8"></a>The Gray Paper's (11.8), (11.9), (11.10), [in its place in the paper's words](./05-bad-reports.md#eq-11-8):

$$
\begin{align}
\forall \mathbf{r} \in \mathbb{R} &:
\left\vert\mathbf{r}_{\mathbf{t}}\right\vert + \sum\limits_{i=0}^{i<\left\vert\mathbf{r}_{\mathbf{d}}\right\vert} L(\mathbf{r}_{\mathbf{d}}\left[i\right]_{\mathbf{l}}) \le \mathsf{W}_R \tag{11.8} \\
L(\mathbf{l} \in \mathbb{B}_{} \cup \mathbb{E}) &\equiv \begin{cases}
\left\vert\mathbf{l}\right\vert &\text{if } \mathbf{l} \in \mathbb{B}_{} \\
0 &\text{otherwise}
\end{cases} \tag{11.9} \\
\mathsf{W}_R &\equiv 48\cdot2^{10} \tag{11.10}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-wr-authtrace" class="gk-wrap">$\mathbf{t}$</span> | t | the authorizer's trace: the blob its code returned when it said yes (`auth_output`) |
| <span id="gk-Cmaxreportvarsize" class="gk-wrap">$\mathsf{W}_R$</span> | W sub R | the most bytes a report's outputs may take, the trace and every result together: 48 × 1,024 = 49,152 |
| <span id="gk-blob">[$\mathbb{B}$](../symbols.md#blobs)</span> | B, or B sub n | bytes: any run of them; 𝔹ₙ exactly n of them |
| <span id="gk-cup">$\cup$</span> | union | everything in either side |
| <span id="gk-workerror" class="gk-wrap">$\mathbb{E}$</span> | E | the set of work errors: out of gas, panic, bad exports, oversize, BAD (no code) and BIG (code too big) |
| <span id="gk-cdot">$\cdot$</span> | times | multiply |

</details>

:::

**Read it aloud.** "For every r in R: the length of r's t, plus the sum over i of L of r's
digest i's result, is at most W sub R. L of a result is its length when it is a blob, 0
otherwise. W sub R is defined as 48 times 2 to the 10."

**In plain words.** The report's variable parts, the authorizer's trace and every
successful output, together fit in W_R = 49,152 bytes. An error counts 0: it has no bytes.
This keeps a block's guarantees small.

**On a real value.**

```text
report_prev_rotation-1        0 + 12 ("dummy-result")    = 12        fine
big_work_report_output-1      trace and outputs          = 49,152    exactly W_R: fine
too_big_work_report_output-1                             = 49,153    work_report_too_big
```

**In your client.** `reportError`'s `output` ([lesson 12.5](./05-bad-reports.md#the-code)).

## (11.34) and (11.35): no package twice in a block

::: gray-paper-eq 11.34

<a id="ex-11-34"></a>The Gray Paper's (11.34), [in its place in the paper's words](./05-bad-reports.md#eq-11-34):

$$
\begin{equation}
\text{let } \mathbf{x} \equiv \left\{\,  \mathbf{r}_{\mathbf{c}}  \;\middle\vert\;  \mathbf{r} \in \mathbf{I}  \,\right\}\ ,\quad
\mathbf{p} \equiv \left\{\,  (\mathbf{r}_{\mathbf{s}})_{p}  \;\middle\vert\;  \mathbf{r} \in \mathbf{I}  \,\right\} \tag{11.34}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-local-incomingcontexts" class="gk-wrap">$\mathbf{x}$</span> | x | the contexts of this block's incoming reports |
| <span id="gk-as-packagehash">$p$</span> | p | the work-package's hash |

</details>

:::

::: gray-paper-eq 11.35

<a id="ex-11-35"></a>The Gray Paper's (11.35), [in its place in the paper's words](./05-bad-reports.md#eq-11-35):

$$
\begin{equation}
\left\vert\mathbf{p}\right\vert = \left\vert\mathbf{I}\right\vert \tag{11.35}
\end{equation}
$$

:::

**Read it aloud.** "Let x be the set of r's context for each r in I, and p the set of r's
package hash for each r in I. The size of p equals the length of I."

**In plain words.** Two names, 𝐱 for the block's contexts and 𝐩 for its package hashes,
then the first use: as many distinct package hashes as reports, so no package is reported
twice in one block.

**On a real value.** `duplicated_package_in_report-1`: two reports, one package hash.
|𝐩| = 1 ≠ |𝐈| = 2: `duplicate_package`.

**In your client.** `reportError`'s `incoming` map, and `incoming.size < reports.length`
([lesson 12.5](./05-bad-reports.md#the-code)).

## (11.36): anchored on a recent block, as it was

::: gray-paper-eq 11.36

<a id="ex-11-36"></a>The Gray Paper's (11.36), [in its place in the paper's words](./05-bad-reports.md#eq-11-36):

$$
\begin{align}
\forall x \in \mathbf{x} : \exists y \in \beta_H^\dagger : x_{a} = y_{h} \wedge x_{s} = y_{s} \wedge x_{b} = y_{b} \wedge x_{n} = y_{t} \!\!\!\!\!\! \tag{11.36}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-recenthistorypostparentstaterootupdate" class="gk-wrap">$\beta_H^\dagger$</span> | beta sub H dagger | the recent blocks midway: with the parent's state root filled in, before this block's entry |
| <span id="gk-rh-headerhash">$h$</span> | h | a recent block's header hash |
| <span id="gk-wc-anchoraccoutlog">$b$</span> | b | the anchor block's accumulation-output super-peak, the belt's root (`beefy_root`) |
| <span id="gk-wc-anchortime">$n$</span> | n | the anchor block's timeslot |

</details>

:::

**Read it aloud.** "For every x in x bold: there is a y in beta dagger sub H such that x's
anchor hash is y's header hash, x's state root is y's state root, x's belt root is y's
belt root, and x's anchor slot is y's slot."

**In plain words.** The anchor must be one of the last H = 8 blocks the chain remembers,
and the context must describe it exactly: the same state root, belt root and slot. So a
package was built against this chain, recently.

**On a real value.** `report_prev_rotation-1`:

```text
context anchor   0x39cb5189…, slot 12, state 0xd8c57781…, belt 0xf5df0c11…
recent block 7   0x39cb5189…, slot 12, state 0xd8c57781…, belt 0xf5df0c11…   all match
```

`anchor_not_recent-1` names `0x6900f395…`, in none of the 8: `anchor_not_recent`.
`bad_anchor_slot-1` names the right block with slot 13: `bad_anchor_slot`.

**In your client.** `reportError`'s `anchored`, `sameRoot`, `sameBelt` and `sameSlot`
([lesson 12.5](./05-bad-reports.md#the-code)).

## (11.37) and (11.38): the lookup anchor

::: gray-paper-eq 11.37

<a id="ex-11-37"></a>The Gray Paper's (11.37), [in its place in the paper's words](./05-bad-reports.md#eq-11-37):

$$
\begin{align}
\forall x \in \mathbf{x} :\ x_{t} \ge \mathbf{H}_{T} - \mathsf{L} \tag{11.37}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-H" class="gk-wrap">$\mathbf{H}$</span> | H | this block's header; 𝐇_T is its timeslot, 𝐇_P its parent's hash |
| <span id="gk--timeslot">$T$</span> | T | a header's timeslot: 𝐇_T is the slot this block was made for |
| <span id="gk-Cmaxlookupanchorage" class="gk-wrap">$\mathsf{L}$</span> | L | the oldest a lookup anchor may be: 14,400 slots, 24 hours |

</details>

:::

::: gray-paper-eq 11.38

<a id="ex-11-38"></a>The Gray Paper's (11.38), [in its place in the paper's words](./05-bad-reports.md#eq-11-38):

$$
\begin{equation}
\forall x \in \mathbf{x} : \exists h, h' \in \mathbf{A} : \bigwedge \left\{ \begin{aligned}
h_{T} &= x_{t} \\
\mathcal{H}\left(h\right) &= x_{l} \\
h'_{P} &= \mathcal{H}\left(h\right) \\
h'_{R} &= x_{r}
\end{aligned} \right. \tag{11.38}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-ancestors" class="gk-wrap">$\mathbf{A}$</span> | A | the ancestors: this header, its parent, its parent's parent, and so on back to genesis |
| <span id="gk-bigwedge">$\bigwedge$</span> | all of | every one of the conditions under it is true |
| <span id="gk-wc-lookupanchorhash">$l$</span> | l | the lookup anchor's header hash: the block whose state code is fetched from |
| <span id="gk--parent">$P$</span> | P | a header's parent hash: 𝐇_P is the hash of the header before it, 32 bytes |
| <span id="gk--priorstateroot">$R$</span> | R | a header's prior state root: 𝐇_R is the root of the state before this block, 32 bytes |
| <span id="gk-wc-lookupanchorpoststate">$r$</span> | r | the lookup anchor's state root |

</details>

:::

**Read it aloud.** "For every x in x bold: x's lookup-anchor slot is at least H sub T
minus L. And there are h and h prime in A such that: h's slot is x's lookup-anchor slot;
H of h is x's lookup-anchor hash; h prime's parent is H of h; and h prime's prior state
root is x's lookup-anchor state root."

**In plain words.** The lookup anchor, the block whose state the code was read from, may be
older than the anchor, but at most L = 14,400 slots, a day. And the client must have seen
it: 𝐀 is the last L headers it keeps. A header carries its parent's state root, so the
lookup anchor's state root is checked in its child's header, h′. This is one of the few
rules no state can check, only the header chain.

**On a real value.** `report_prev_rotation-1`: lookup anchor slot 6 ≥ 14 − 14,400. Its
hash `0x16bda47e…` happens to be recent block 5 too, whose state root is `0x833233f9…`,
the context's `lookup_anchor_state_root`: that is what its child's H_R would say.

**In your client.** Not yet: neither is in the vectors, and the second needs headers no
state holds. Both wait in
[HARDENING.md](https://github.com/abutlabs/the-gray-tutor/blob/main/HARDENING.md), as
[lesson 12.5](./05-bad-reports.md#what-the-gray-paper-says) says.

## (11.39) to (11.41): a new package

::: gray-paper-eq 11.39

<a id="ex-11-39"></a>The Gray Paper's (11.39), (11.40), (11.41), [in its place in the paper's words](./05-bad-reports.md#eq-11-39):

$$
\begin{align}
&\text{let } \mathbf{q} = \left\{\,
(\mathbf{r}_{\mathbf{s}})_{p}
\;\middle\vert\;
\left(\mathbf{r}, \mathbf{d}\right) \in \overparen{\omega}
\,\right\} \tag{11.39} \\
&\text{let } \mathbf{a} = \left\{\,
(((\mathbf{a}_{\mathbf{g}})_{\mathbf{r}})_{\mathbf{s}})_{p}
\;\middle\vert\;
\mathbf{a} \in \rho, \mathbf{a} \ne \emptyset
\,\right\} \tag{11.40} \\
&\forall p \in \mathbf{p},
p \not\in \bigcup_{x \in \beta_H}\mathcal{K}\left(x_{\mathbf{p}}\right)
\cup
\bigcup_{x \in \xi}x
\cup \mathbf{q}
\cup \mathbf{a} \tag{11.41}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-concatall">$\overparen{x}$</span> | all joined | every sequence in it, joined end to end into one |
| <span id="gk-ready" class="gk-wrap">$\omega$</span> | omega | the ready queue: available reports waiting on others before they can accumulate |
| <span id="gk-aaX" class="gk-wrap">$\mathbf{a}$</span> | a | one core's entry in ρ: a pending report and its slot |
| <span id="gk-availassignments" class="gk-wrap">$\rho$</span> | rho | the pending reports: for each core, the report waiting to be made available, and when it came |
| <span id="gk-ne">$\ne$</span> | is not | not equal |
| <span id="gk-bigcup">$\bigcup$</span> | the union over | everything in any of the sets it ranges over, together |
| <span id="gk-recenthistory" class="gk-wrap">$\beta_H$</span> | beta sub H | the last H = 8 blocks: each one's header hash, state root, belt peak and reported packages |
| <span id="gk-keys">$\mathcal{K}\left(x\right)$</span> | K of | a dictionary's keys |
| <span id="gk-accumulated" class="gk-wrap">$\xi$</span> | xi | the accumulated history: the packages accumulated in each of the last E slots |

</details>

:::

**Read it aloud.** "Let q be the set of r's package hash for each pair r, d in the ready
queue, all of it. Let a be the set of the package hash of a's guarantee's report for each
a in rho that isn't nothing. For every p in p bold: p is not in the union of the keys of
x's reported packages for every x in beta sub H, nor in the union of every x in xi, nor in
q, nor in a."

**In plain words.** A report's package must be new to the whole pipeline: not reported by
a recent block (β_H), not accumulated recently (ξ), not waiting in the ready queue (ω, as
𝐪), not on a core (ρ, as 𝐚). Otherwise its work would be counted twice.

**On a real value.** `duplicate_package_in_recent_history-1`: package `0x63c03371…`, and a
recent block reported `0x63c03371…`: `duplicate_package`. The vectors hand over ξ, 𝐪 and 𝐚
together as `known_packages`: `0x22f6c965…`, `0x303026af…`, `0x35e10c83…` in
`report_prev_rotation-1`, none of them its package.

**In your client.** `reportError`'s `fresh` ([lesson 12.5](./05-bad-reports.md#the-code)).

## (11.42): dependencies that exist

::: gray-paper-eq 11.42

<a id="ex-11-42"></a>The Gray Paper's (11.42), [in its place in the paper's words](./05-bad-reports.md#eq-11-42):

$$
\begin{align}
&\begin{aligned}
&\forall \mathbf{r} \in \mathbf{I},
\forall p \in (\mathbf{r}_{\mathbf{c}})_{\mathbf{p}} \cup
\mathcal{K}\left(\mathbf{r}_{\mathbf{l}}\right) :\\
&\quad p \in \mathbf{p} \cup \left\{\,
x \;\middle\vert\; x \in \mathcal{K}\left(b_{\mathbf{p}}\right),\, b \in \beta_H\,\right\}
\end{aligned} \tag{11.42}
\end{align}
$$

:::

**Read it aloud.** "For every r in I, and every p in r's context's prerequisites or the
keys of r's lookup: p is in p bold, or is one of the keys of b's reported packages for
some b in beta sub H."

**In plain words.** Every package a report depends on must be known: reported in this same
block, or by a recent one. Whether it will really accumulate first is the ready queue's
business later ([Part 17](../17-accumulation/index.md)).

**On a real value.**

```text
reports_with_dependencies-1   core 1 needs 0x63c03371…, core 0's report in this block    fine
dependency_missing-1          needs 0x63c03371… (here) and 0x85df040d… (nowhere)          dependency_missing
```

**In your client.** `reportError`'s `prerequisitesKnown` ([lesson
12.5](./05-bad-reports.md#the-code)); the vectors give an unknown lookup key its own name,
`segment_root_lookup_invalid`.

## (11.43) and (11.44): the right segments roots

::: gray-paper-eq 11.43

<a id="ex-11-43"></a>The Gray Paper's (11.43), (11.44), [in its place in the paper's words](./05-bad-reports.md#eq-11-43):

$$
\begin{align}
&\text{let } \mathbf{p} = \left\{\,
\left(
((g_{\mathbf{r}})_{\mathbf{s}})_{p}
\mapsto
((g_{\mathbf{r}})_{\mathbf{s}})_{e}
\right)
\;\middle\vert\;
g \in \mathbf{E}_G
\,\right\} \tag{11.43} \\
&\forall \mathbf{r} \in \mathbf{I}: \mathbf{r}_{\mathbf{l}} \subseteq \mathbf{p} \cup \bigcup_{b \in \beta_H} b_{\mathbf{p}} \tag{11.44}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-kv">$\left(x \mapsto y\right)$</span> | k maps to v | a dictionary entry: key k, value v |
| <span id="gk-subseteq">$\subseteq$</span> | is a subset of | everything in the left is in the right |

</details>

:::

**Read it aloud.** "Let p be the set of pairs: g's report's package hash, to its segments
root, for each g in E sub G. For every r in I: r's l is a subset of p, together with the
union of b's reported packages for every b in beta sub H."

**In plain words.** 𝐩 is reused here as a dictionary, each package of this block to its
segments root. Every entry of a report's lookup, a package and the root it claims, must
match a package and root the chain has seen: reported in this block or a recent one. A
wrong root would let refine import the wrong data.

**On a real value.**

```text
segment_root_lookup_invalid-1   0xd8fb1874… ↦ 0xf1abc7a7…   0xd8fb… unknown           refused
segment_root_lookup_invalid-2   0xd8fb1874… ↦ 0xf1abc7a7…   reported with 0xc01a9c8a…  refused
```

The paper's note after: these rules allow reports that depend on each other in a loop.
They are accepted, and accumulation simply never runs them.

**In your client.** `reportError`'s `lookupsRight` ([lesson 12.5](./05-bad-reports.md#the-code)).

## (11.45): the right code

::: gray-paper-eq 11.45

<a id="ex-11-45"></a>The Gray Paper's (11.45), [in its place in the paper's words](./05-bad-reports.md#eq-11-45):

$$
\begin{align}
\forall \mathbf{r} \in \mathbf{I}, \forall \mathbf{d} \in \mathbf{r}_{\mathbf{d}} : \mathbf{d}_{c} = \delta\left[\mathbf{d}_{s}\right]_{c} \tag{11.45}
\end{align}
$$

:::

**Read it aloud.** "For every r in I and every d in r's digests: d's code hash equals the
code hash of the account delta at d's s."

**In plain words.** Each digest names its service's code hash as the guarantors saw it, and
it must be the code the service has now. A report refined with old code is refused.

**On a real value.** `report_prev_rotation-1`: service 42's code hash is `0x6470fd21…`, and
so is the digest's. `bad_code_hash-1`'s digest says `0x7a3a6a60…`: `bad_code_hash`.

**In your client.** `reportError`'s last checks, `bad_service_id` and `bad_code_hash`
([lesson 12.5](./05-bad-reports.md#the-code)).

## (11.46): onto the cores

::: gray-paper-eq 11.46

<a id="ex-11-46"></a>The Gray Paper's (11.46), [in its place in the paper's words](./03-onto-the-cores.md#eq-11-46):

$$
\begin{equation}
\forall c \in \mathbb{N}_{\mathsf{C}} : \rho'\left[c\right] \equiv \begin{cases}
\left(\mathbf{g},\,t\mathrel{\unicode{x2AF6}}\tau'\right) &\text{if } \exists \mathbf{g} \in \mathbf{E}_G, (\mathbf{g}_{\mathbf{r}})_{c} = c \\
\rho^\ddagger\left[c\right] &\text{otherwise}
\end{cases} \tag{11.46}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-availassignmentspostguarantees" class="gk-wrap">$\rho'$</span> | rho prime | the cores after this block's guarantees: each core's pending report and its slot, or nothing |
| <span id="gk-is">$x\mathrel{\unicode{x2AF6}} y$</span> | is a | names a field and gives its type, in a tuple |

</details>

:::

**Read it aloud.** "For every core c: rho prime at c is defined as: the pair of g and t,
which is tau prime, when there is a g in E sub G whose report's core is c; otherwise rho
double-dagger at c."

**In plain words.** Each guaranteed report takes its core, registered at this block's slot
τ′, not the slot the guarantee was made at: the timeout of [lesson
11.2](../11-assurances/02-timeouts.md) counts from here. Every other core keeps what the
assurances left it. A core at or past |κ′|/3 always stays empty, so there are never more
reports to audit than the validators can handle.

**On a real value.** `report_prev_rotation-1`:

```text
ρ‡          ∅, ∅
E_G         one guarantee, core 0, made at slot 10
ρ′[0]       (the guarantee, 14)        registered at τ′ = 14, not 10
ρ′[1]       ∅                          ρ‡[1], kept
```

**In your client.** `placeReports` in `src/cores.ts`, written in [lesson
12.3](./03-onto-the-cores.md#the-code).

## Say it in one breath

Every block, every validator deals three guarantors to each active core: seats shuffled
by two-epoch-old entropy, rotated every R slots (11.19 to 11.22), with the rotation before
kept as 𝐌\* (11.23). A guarantee is a report, a slot and two or three signatures (11.24);
guarantees go one per core, in order, signers in order (11.25 to 11.27), each signed over
`jam_guarantee` and the report's hash by validators the assignment put on that core, within
the last two rotations, and their keys are the reporters (11.28, 11.29). The report must
have one shard per validator, a free core and an authorizer in that core's pool (11.31,
11.32), sane gas and size and at most 8 dependencies (11.33, 11.3, 11.8), a new package, an
anchor the chain remembers, known dependencies with true segments roots, and the services'
real code (11.34 to 11.45). Then each report takes its core, registered now (11.46).
