# The formulas, in plain words

[Part 18](./index.md)'s appendix: every formula of §13, *Statistics*, explained. Five
blocks: the validators' tallies (13.1) to (13.3) and how a block moves them on (13.4) to
(13.6); the cores' and services' tallies (13.7) and (13.8), and how each block fills them
(13.9) to (13.17). All counting: nothing here decides anything, but every count goes into
the state root. Each formula: its key, then read aloud, in plain words, on a real value, in
your client. Notation: [Reading the Gray Paper](../reading-the-gray-paper.md).

## (13.1) to (13.3): the four tallies

::: gray-paper-eq 13.1

<a id="ex-13-1"></a>The Gray Paper's (13.1), (13.2), (13.3), [in its place in the paper's words](./01-who-did-what.md#eq-13-1):

$$
\begin{align}
\pi &\equiv \left(\pi_V, \pi_L, \pi_C, \pi_S\right) \tag{13.1} \\
\!\left\lgroup\pi_V, \pi_L\right\rgroup\! &\in \left[\!\left[\!\left\lgroup
b\in \mathbb{N}\,,
t\in \mathbb{N}\,,
p\in \mathbb{N}\,,
d\in \mathbb{N}\,,
g\in \mathbb{N}\,,
a\in \mathbb{N}
\right\rgroup\!\right]\!\right]_{}^2
\!\!\!\!\!\!\!\!\!\! \tag{13.2} \\
\left\vert\pi_V\right\vert &= \left\vert\kappa\right\vert\ , \qquad \left\vert\pi_L\right\vert = \left\vert\lambda\right\vert \tag{13.3}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-activity" class="gk-wrap">$\pi$</span> | pi | the statistics: tallies per validator, per core and per service |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-valstatsaccumulator" class="gk-wrap">$\pi_V$</span> | pi sub V | this epoch's validator tallies: one record of six counts per validator, still counting |
| <span id="gk-valstatsprevious" class="gk-wrap">$\pi_L$</span> | pi sub L | last epoch's validator tallies: one record of six counts per validator, finished |
| <span id="gk-corestats" class="gk-wrap">$\pi_C$</span> | pi sub C | the cores' tallies: one record per core, for this block only |
| <span id="gk-servicestats" class="gk-wrap">$\pi_S$</span> | pi sub S | the services' tallies: one record per service active in this block, for this block only |
| <span id="gk-tuple">$\!\left\lgroup x\right\rgroup\!$</span> | the tuple of | a record: named fields, each with its type, like an object in JSON |
| <span id="gk-in">[$\in$](../symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-sequence">[$\left[\!\left[x\right]\!\right]$](../symbols.md#sequence)</span> | a sequence of | ⟦T⟧ is an array of T; a subscript is its length, :n at most n, n: at least n |
| <span id="gk-isa">[$x\in y$](../symbols.md#in)</span> | in | belongs to: the field's type |
| <span id="gk-vs-blocks">$b$</span> | b | blocks the validator made |
| <span id="gk-N" class="gk-wrap">[$\mathbb{N}$](../symbols.md#naturals)</span> | N | the whole numbers: 0, 1, 2 and up; a subscript is a bound, ℕ₈ is 0 to 7 |
| <span id="gk-vs-tickets">$t$</span> | t | tickets the validator put in its blocks |
| <span id="gk-vs-preimagecount">$p$</span> | p | preimages the validator put in its blocks |
| <span id="gk-vs-preimagesize">$d$</span> | d | the bytes of those preimages, all together |
| <span id="gk-vs-guarantees">$g$</span> | g | blocks in which the validator signed a guarantee, once a block |
| <span id="gk-vs-assurances">$a$</span> | a | availability assurances the validator made |
| <span id="gk-len">$\left\vert x\right\vert$</span> | the size of | \|x\|: how many items x has, or how many bytes |
| <span id="gk-activeset" class="gk-wrap">$\kappa$</span> | kappa | the current validators: the keys of the V validators active this epoch |
| <span id="gk-previousset" class="gk-wrap">$\lambda$</span> | lambda | the last epoch's validators: kept to check what they signed before the change |

</details>

:::

**Read it aloud.** "Pi is defined as the tuple pi sub V, pi sub L, pi sub C, pi sub S.
Pi sub V and pi sub L are each in: a sequence of tuples of b, t, p, d, g and a, all
naturals. The size of pi sub V is the size of kappa; the size of pi sub L is the size of
lambda."

**In plain words.** The statistics π are four tallies. Two are for validators: π_V, the
epoch in progress, and π_L, the epoch before, finished. Each holds one record per
validator, in the same order as the validator keys, κ for this epoch's and λ for last
epoch's. So validator v's record is at index v. A record has six counts: b, blocks
made; t and p, tickets and preimages put in them; d, the preimages' bytes; g, guarantees
signed; and a, assurances made. The other two, π_C and π_S, are (13.7) and (13.8).

**On a real value.** Tiny has 6 validators, so each tally holds 6 records. Validator 1's,
in `stats_with_some_extrinsic-1`, before the block:

```text
π_V[1]   b 15610  t 17650  p 39  d 731  g 1319  a 1379     this epoch so far
π_L[1]   b 11144  t 2376   p 86  d 926  g 1070  a 1870     last epoch, finished
```

**In your client.** `ValidatorStats` in `src/statistics.ts`, [18.1's
code](./01-who-did-what.md#the-code), is one record, under the vectors' names.

## (13.4) to (13.6): a block moves the tallies on

::: gray-paper-eq 13.4

<a id="ex-13-4"></a>The Gray Paper's (13.4), (13.5), (13.6), [in its place in the paper's words](./01-who-did-what.md#eq-13-4):

$$
\begin{align}
\begin{split}
\pi_V^\dagger &\equiv \pi_V \text{ except } \forall v \in \mathbb{N}_{\left\vert\kappa\right\vert}: \\
\pi_V^\dagger\left[v\right]_{a} &=
\pi_V\left[v\right]_{a} +
(\exists a \in \mathbf{E}_A : a_{v} = v)
\end{split} \tag{13.4} \\
\begin{split}
\left(\pi_V^\ddagger, \pi_L'\right) &\equiv \begin{cases}
\left(\pi_V^\dagger, \pi_L\right) &\text{if } e' = e \\
\left(\left[\left(0, \dots\right), \dots\right], \pi_V^\dagger\right) &\text{otherwise}
\end{cases} \\
\text{where } e &= \left\lfloor\frac{\tau}{\mathsf{E}}\right\rfloor \ ,\quad e' = \left\lfloor\frac{\tau'}{\mathsf{E}}\right\rfloor
\end{split} \tag{13.5} \\
\begin{split}
\pi_V' &\equiv \pi_V^\ddagger \text{ except } \forall v \in \mathbb{N}_{\left\vert\kappa'\right\vert}: \\
\pi_V'\left[v\right]_{b} &=
\pi_V^\ddagger\left[v\right]_{b} + (v = \mathbf{H}_{I})\\
\pi_V'\left[v\right]_{t} &=
\pi_V^\ddagger\left[v\right]_{t} + \begin{cases}
\left\vert\mathbf{E}_T\right\vert &\text{if } v = \mathbf{H}_{I} \\
0 &\text{otherwise}
\end{cases}\\
\pi_V'\left[v\right]_{p} &=
\pi_V^\ddagger\left[v\right]_{p} + \begin{cases}
\left\vert\mathbf{E}_P\right\vert &\text{if } v = \mathbf{H}_{I} \\
0 &\text{otherwise}
\end{cases}\\
\pi_V'\left[v\right]_{d} &=
\pi_V^\ddagger\left[v\right]_{d} + \begin{cases}
\sum_{d \in \mathbf{E}_P}\left\vert d\right\vert &\text{if } v = \mathbf{H}_{I} \\
0 &\text{otherwise}
\end{cases}\\
\pi_V'\left[v\right]_{g} &=
\pi_V^\ddagger\left[v\right]_{g} + (\kappa'_{v} \in \mathbf{G})
\end{split} \tag{13.6}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-dagger">$\dagger$</span> | dagger | a mark making a new name from an old one: δ† is δ partway through the block, 𝐭† another list of transfers |
| <span id="gk-forall">$\forall$</span> | for all | for every value: ∀c ∈ ℕ_C means for each core c |
| <span id="gk-Nmax">[$\mathbb{N}_{x}$](../symbols.md#naturals)</span> | N sub n | the whole numbers below n: ℕ_C is a core index, 0 to C − 1 |
| <span id="gk-subb">[$\left[x\right]$](../symbols.md#sequence)</span> | at | x[i]: the item at index i, or the value at key i |
| <span id="gk-exists">[$\exists$](../symbols.md#exists)</span> | there exists | there is at least one value such that what follows holds |
| <span id="gk-xtassurances" class="gk-wrap">$\mathbf{E}_A$</span> | E sub A | the assurances bag: validators saying they hold their pieces of reports |
| <span id="gk-xa-assurer">$v$</span> | v | the assuring validator's index in κ |
| <span id="gk-ddagger">$\ddagger$</span> | double dagger | a second midway value: after the dagger step, before the prime |
| <span id="gk-ffrac">$\left\lfloor\frac{x}{y}\right\rfloor$</span> | x over y, rounded down | whole-number division, the remainder dropped: ⌊7/3⌋ is 2 |
| <span id="gk-thetime" class="gk-wrap">$\tau$</span> | tau | the time: the latest block's timeslot |
| <span id="gk-Cepochlen" class="gk-wrap">$\mathsf{E}$</span> | E | an epoch's length in slots: 600 on full, 12 on tiny |
| <span id="gk-H" class="gk-wrap">$\mathbf{H}$</span> | H | this block's header; 𝐇_T is its timeslot, 𝐇_P its parent's hash |
| <span id="gk--authorindex">$I$</span> | I | a header's author index: 𝐇_I, which validator made the block, a position in κ′ |
| <span id="gk-xttickets" class="gk-wrap">$\mathbf{E}_T$</span> | E sub T | the tickets bag: entries to the block-sealing lottery |
| <span id="gk-xtpreimages" class="gk-wrap">$\mathbf{E}_P$</span> | E sub P | the preimages bag: data a service asked for |
| <span id="gk-sum">$\sum$</span> | the sum of | add up what follows, once for each value the subscript ranges over |
| <span id="gk-reporters" class="gk-wrap">$\mathbf{G}$</span> | G | the reporters: the Ed25519 keys of every guarantor who signed a guarantee in this block |

</details>

:::

**Read it aloud.** "Pi sub V dagger is defined as pi sub V, except: for every validator v,
its a is its old a plus one if there exists an assurance in E sub A whose assurer is v.
The pair pi sub V double dagger, pi sub L prime is defined as: pi sub V dagger and pi sub
L, if e prime equals e; otherwise, a sequence of all-zero records and pi sub V dagger;
where e is tau over E, rounded down, and e prime is tau prime over E, rounded down. Pi sub
V prime is defined as pi sub V double dagger, except: for every validator v, its b goes up
by one if v is the header's author; its t goes up by the number of tickets in E sub T if v
is the author, else 0; its p by the number of preimages in E sub P if v is the author; its
d by the sum of the preimages' sizes if v is the author; and its g by one if v's key in
kappa prime is among the reporters G."

**In plain words.** Three steps, one formula each, in this order:

1. **(13.4), assurances first.** Each validator with an assurance in this block gets one
   more a. A true condition counts as 1 and a false one as 0, which is how "plus (there
   exists …)" adds one or nothing.
2. **(13.5), a new epoch turns the page.** e and e′ are the epochs of the parent's slot
   and this block's. If they differ, this block starts a new epoch. The tally in
   progress, assurances included, becomes π_L′, and a fresh one of zeros begins. The old
   π_L is dropped. If they're the same, nothing moves.
3. **(13.6), then the rest.** The author H_I gets one more b, and as many t, p and d as
   the block's tickets, preimages and preimage bytes. Every validator in 𝐆, the reporters
   who signed this block's guarantees, gets one more g, once however many guarantees it
   signed.

The order is why a new epoch's first block counts its assurances in the old epoch: they
were made about the parent's data, in the parent's epoch.

**On a real value.** `stats_with_some_extrinsic-1`, slot 123,457, author 1: 2 tickets, 3
preimages of 16, 17 and 18 bytes, guarantees signed by 0 and 1 and by 2 and 3, assurances
by 0 and 1. Validator 1:

```text
π_V[1]          b 15610  t 17650  p 39  d 731  g 1319  a 1379
(13.4) π_V†[1]                                          a 1380    assured: +1
(13.5) e, e′    ⌊123456/12⌋ = 10288, ⌊123457/12⌋ = 10288        same epoch: π_V‡ = π_V†
(13.6) b        15610 + 1                    = 15611    the author
       t        17650 + 2                    = 17652
       p        39 + 3                       = 42
       d        731 + 16 + 17 + 18           = 782
       g        1319 + 1                     = 1320     a reporter
π_V′[1]         b 15611  t 17652  p 42  d 782  g 1320  a 1380
```

And `stats_with_epoch_change-1`, one slot earlier, at the turn of an epoch, with the same
extrinsic:

```text
(13.5) e, e′    ⌊123455/12⌋ = 10287, ⌊123456/12⌋ = 10288        a new epoch
π_L′[1]         b 15610  t 17650  p 39  d 731  g 1319  a 1380    the old tally, assurance in
π_V‡[1]         all zeros
π_V′[1]         b 1  t 2  p 3  d 51  g 1  a 0                     this block's work only
```

**In your client.** `updateValidatorStats` in `src/statistics.ts`, [18.1's
code](./01-who-did-what.md#the-code), does the three steps in this order.

## (13.7) and (13.8): the cores' and the services' cards

::: gray-paper-eq 13.7

<a id="ex-13-7"></a>The Gray Paper's (13.7), (13.8), [in its place in the paper's words](./02-what-cores-and-services-did.md#eq-13-7):

$$
\begin{align}
\pi_C &\in \left[\!\left[\!\left\lgroup
\begin{alignedat}{7}
d&\in \mathbb{N}\,,\;
&p&\in \mathbb{N}\,,\;
&i&\in \mathbb{N}\,,\;
&x&\in \mathbb{N}\,,\;\\
z&\in \mathbb{N}\,,\;
&e&\in \mathbb{N}\,,\;
&l&\in \mathbb{N}\,,\;
&u&\in \mathbb{N}_G
\end{alignedat}
\right\rgroup\!\right]\!\right]_{\mathsf{C}} \tag{13.7} \\
\pi_S &\in \left\langle\!\left\vert \mathbb{N}_S\to\!\left\lgroup
\begin{alignedat}{3}
p&\in \left(\mathbb{N}, \mathbb{N}\right)\,,\;
&r&\in \left(\mathbb{N}, \mathbb{N}_G\right)\,,\;\\
i&\in \mathbb{N}\,,\;
x\in \mathbb{N}\,,\;
&z&\in \mathbb{N}\,,\;
e\in \mathbb{N}\,,\;\\
a&\in \left(\mathbb{N}, \mathbb{N}, \mathbb{N}_G\right)
\end{alignedat}
\right\rgroup\!\right\vert\!\right\rangle \tag{13.8}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-Ccorecount" class="gk-wrap">$\mathsf{C}$</span> | C | the number of cores: 341 on full, 2 on tiny |
| <span id="gk-cs-importcount">$i$</span> | i | segments imported by the work of the reports the core took on |
| <span id="gk-cs-xtcount">$x$</span> | x | work-item extrinsics in those reports: blobs sent along for refine |
| <span id="gk-cs-xtsize">$z$</span> | z | the bytes of those extrinsics |
| <span id="gk-cs-exportcount">$e$</span> | e | segments exported by the work of the reports the core took on |
| <span id="gk-cs-bundlelen">$l$</span> | l | the bytes of those reports' bundles, all together |
| <span id="gk-cs-gasused">$u$</span> | u | the gas refine used for the reports the core took on |
| <span id="gk-gas" class="gk-wrap">$\mathbb{N}_G$</span> | N sub G | an amount of gas: a u64 |
| <span id="gk-dictionary">$\left\langle\!\left\vert x\to y\right\vert\!\right\rangle$</span> | a dictionary from K to V | a map: keys of type K, each with one value of type V |
| <span id="gk-serviceid" class="gk-wrap">$\mathbb{N}_S$</span> | N sub S | a service id: a whole number below 2³², 4 bytes |
| <span id="gk-ss-refinement">$r$</span> | r | a service's refinement: how many of its digests were reported, and the gas they used |

</details>

:::

**Read it aloud.** "Pi sub C is in: a sequence of C tuples of d, p, i, x, z, e, l, all
naturals, and u, an amount of gas. Pi sub S is in: a dictionary from service ids to tuples
of p, a pair of naturals; r, a natural and an amount of gas; i, x, z and e, naturals; and
a, two naturals and an amount of gas."

**In plain words.** Two type lines, a schema for each card:

- **π_C, one card per core**, C of them: data load d, popularity p, and the work of the
  reports it took on: imports i, extrinsics x and their bytes z, exports e, bundle bytes
  l, refine gas u.
- **π_S, one card per active service**, a dictionary, so a service that did nothing this
  block has no card: provisions p (how many, how many bytes), refinement r (how many
  digests, how much gas), the same i, x, z, e, and accumulation a (work-items, transfers,
  gas).

Both last one block: (13.9) and (13.13) build them fresh each time, from nothing.

**On a real value.** Tiny has 2 cores, so π_C has 2 cards. After `multiple_reports-1`:

```text
π_C[0]     d 0  p 0  i 8  x 8  z 1526  e 17  l 17180  u 821
π_C[1]     d 0  p 0  i 1  x 3  z 1926  e 18  l 12487  u 697
π_S[42]    p (0, 0)  r (2, 1518)  i 9  x 11  z 3452  e 35  a (0, 0, 0)
```

**In your client.** `CoreStats` and `ServiceStats` in `src/statistics.ts`, [18.2's
code](./02-what-cores-and-services-did.md#the-code).

## (13.9) to (13.12): what each core did

::: gray-paper-eq 13.9

<a id="ex-13-9"></a>The Gray Paper's (13.9), (13.10), (13.11), (13.12), [in its place in the paper's words](./02-what-cores-and-services-did.md#eq-13-9):

$$
\begin{align}
\forall c \in \mathbb{N}_{\mathsf{C}} : \pi_C'\left[c\right] &\equiv \left(
\begin{alignedat}{5}
i&\mathrel{\unicode{x2AF6}} R(c)_{i}\,,\;
&x&\mathrel{\unicode{x2AF6}} R(c)_{x}\,,\;
&z&\mathrel{\unicode{x2AF6}} R(c)_{z}\,,\\
e&\mathrel{\unicode{x2AF6}} R(c)_{e}\,,\;
&u&\mathrel{\unicode{x2AF6}} R(c)_{u}\,,\;
&l&\mathrel{\unicode{x2AF6}} L(c)\,,\\
d&\mathrel{\unicode{x2AF6}} D(c)\,,\;
&p&\mathrel{\unicode{x2AF6}} \textstyle \sum_{a \in \mathbf{E}_A} a_{f}\left[c\right]\qquad
\end{alignedat}
\right)\!\!\!\! \tag{13.9} \\
\text{where } R(c \in \mathbb{N}_{\mathsf{C}}) &\equiv
\!\!\!\!\!\!\!\!\!\!\!
\sum_{\mathbf{d} \in \mathbf{r}_{\mathbf{d}}, \mathbf{r} \in \mathbf{I}, \mathbf{r}_{c} = c}
\!\!\!\!\!\!\!\!\!\!\!
\left(
\mathbf{d}_{i},
\mathbf{d}_{x},
\mathbf{d}_{z},
\mathbf{d}_{e},
\mathbf{d}_{u},
\right) \tag{13.10} \\
\text{and } L(c \in \mathbb{N}_{\mathsf{C}}) &\equiv
\!\!\!\!\!\!\!
\sum_{\mathbf{r} \in \mathbf{I}, \mathbf{r}_{c} = c}
\!\!\!\!\!\!\!
(\mathbf{r}_{\mathbf{s}})_{l} \tag{13.11} \\
\text{and } D(c \in \mathbb{N}_{\mathsf{C}}) &\equiv
\!\!\!\!\!\!
\sum_{\mathbf{r} \in \mathbf{R}, \mathbf{r}_{c} = c}
\!\!\!\!\!\!
(\mathbf{r}_{\mathbf{s}})_{l} +
\mathsf{W}_G\left\lceil(\mathbf{r}_{\mathbf{s}})_{n}{}^{65}\!/_{64}\right\rceil \tag{13.12}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-coreindex" class="gk-wrap">$\mathbb{N}_{\mathsf{C}}$</span> | N sub C | the core indices: 0 to C − 1 |
| <span id="gk-is">$x\mathrel{\unicode{x2AF6}} y$</span> | is a | names a field and gives its type, in a tuple |
| <span id="gk-xa-availabilities">$f$</span> | f | an assurance's bitfield: one bit per core, 1 for "I hold my piece of its data" |
| <span id="gk-wdX" class="gk-wrap">$\mathbf{d}$</span> | d | a work-digest |
| <span id="gk-wrX" class="gk-wrap">$\mathbf{r}$</span> | r | a work-report |
| <span id="gk-incomingreports" class="gk-wrap">$\mathbf{I}$</span> | I | the incoming reports: the work-reports this block's guarantees carry |
| <span id="gk-wr-core">$c$</span> | c | the core a report's work was done on, 0 to C − 1 |
| <span id="gk-wr-avspec" class="gk-wrap">$\mathbf{s}$</span> | bold s | a report's availability spec: the package's hash, its bundle's length, and the roots of its pieces and of the segments it exports |
| <span id="gk-justbecameavailable" class="gk-wrap">$\mathbf{R}$</span> | R | the reports this block made available: ready to accumulate |
| <span id="gk-Csegmentsize" class="gk-wrap">$\mathsf{W}_G$</span> | W sub G | a segment's size: 4,104 bytes |
| <span id="gk-ceil">$\left\lceil x\right\rceil$</span> | ceiling of | rounded up to a whole number |
| <span id="gk-as-segcount">$n$</span> | n | how many segments the package exported |
| <span id="gk-nicefrac">${}^{x}\!/_{y}$</span> | over | a fraction: the top divided by the bottom |

</details>

:::

**Read it aloud.** "For every core c: pi sub C prime at c is defined as: i is R of c's i,
x is R of c's x, z is R of c's z, e is R of c's e, u is R of c's u, l is L of c, d is D of
c, and p is the sum over the assurances a in E sub A of a's bit for c. Where R of c is
the sum, over each digest d of each report r in I whose core is c, of d's i, x, z, e and
u. L of c is the sum, over each report r in I whose core is c, of its spec's bundle
length. D of c is the sum, over each report r in R whose core is c, of its spec's bundle
length plus W sub G times the ceiling of its segment count times 65 over 64."

**In plain words.** A core's card comes from three places in the block:

1. **R(c) and L(c), the work it took on.** 𝐈 is the reports guaranteed in this block.
   For those on core c, add up their digests' imports, extrinsics, extrinsic bytes,
   exports and gas, and their bundles' lengths. The sum of tuples is field by field.
2. **D(c), its data load.** 𝐑 is the reports that became available in this block. For
   those on core c: the bundle, plus W_G = 4,104 bytes per exported segment, plus one
   more segment of proof hashes for every 64, rounded up. n · 65/64 is n + n/64: the
   segments and their proof pages.
3. **p, its popularity.** Each assurance's bitfield has one bit per core, 1 for "I hold
   my piece of it". Add bit c across all the block's assurances.

Two different R's meet here: the bold 𝐑, the reports made available, and the plain R(c),
a core's work sum. The paper reuses the letter.

**On a real value.** Core 0 in `multiple_reports-1`, one report on it with one digest, and
core 0 in the assurances vector `some_assurances-1`, whose report (3 exports) became
available:

```text
R(0)     (i 8, x 8, z 1526, e 17, u 821)          one digest: its own counts
L(0)     17180                                    one bundle
D(0)     12345 + 4104 · ⌈3 · 65/64⌉
       = 12345 + 4104 · ⌈3.046875⌉
       = 12345 + 4104 · 4
       = 12345 + 16416                            = 28761
p        bit 0 of 02 01 03 03 03 01: 0+1+1+1+1+1  = 5
```

**In your client.** `coreStats` and its `dataLoad` in `src/statistics.ts`, [18.2's
code](./02-what-cores-and-services-did.md#the-code).

## (13.13) to (13.17): what each service did

::: gray-paper-eq 13.13

<a id="ex-13-13"></a>The Gray Paper's (13.13), (13.14), (13.15), (13.16), (13.17), [in its place in the paper's words](./02-what-cores-and-services-did.md#eq-13-13):

$$
\begin{align}
\forall s \in \mathbf{s} : \pi_S'\left[s\right] &\equiv \left(
\begin{alignedat}{5}
i&\mathrel{\unicode{x2AF6}} R(s)_{i}\,,\;
&x&\mathrel{\unicode{x2AF6}} R(s)_{x}\,,\;
&z&\mathrel{\unicode{x2AF6}} R(s)_{z}\,,\\
e&\mathrel{\unicode{x2AF6}} R(s)_{e}\,,\;
&r&\mathrel{\unicode{x2AF6}}\left(R(s)_{n}, R(s)_{u}\right)\,,\;\\
p&\mathrel{\unicode{x2AF6}}
\textstyle
\sum_{\left(s, \mathbf{d}\right)\,\in \mathbf{E}_P}\left(1, \left\vert\mathbf{d}\right\vert\right)
\,,\;\\
a&\mathrel{\unicode{x2AF6}}
\mathcal{U}\left(\mathbf{S}\left[s\right], \left(0, 0, 0\right)\right)
\end{alignedat}
\right)\!\!\!\! \tag{13.13} \\
\text{where } \mathbf{s} &=
\mathbf{s}^R \cup
\mathbf{s}^P \cup
\mathcal{K}\left(\mathbf{S}\right) \tag{13.14} \\
\text{and } \mathbf{s}^R &= \left\{\,
\mathbf{d}_{s} \;\middle\vert\; \mathbf{d} \in \mathbf{r}_{\mathbf{d}}, \mathbf{r} \in \mathbf{I}
\,\right\} \tag{13.15} \\
\text{and } \mathbf{s}^P &= \left\{\,
s \;\middle\vert\; \exists x: \left(s, x\right) \in \mathbf{E}_P
\,\right\} \tag{13.16} \\
\text{and } R(s \in \mathbb{N}_S) &\equiv
\!\!\!\!\!\!\!\!\!\!\!
\sum_{\mathbf{d} \in \mathbf{r}_{\mathbf{d}}, \mathbf{r} \in \mathbf{I}, \mathbf{d}_{s} = s}
\!\!\!\!\!\!\!\!\!\!\!
\left(
n\mathrel{\unicode{x2AF6}}1,
\mathbf{d}_{u},
\mathbf{d}_{i},
\mathbf{d}_{x},
\mathbf{d}_{z},
\mathbf{d}_{e}
\right) \tag{13.17}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-xp-serviceindex">$s$</span> | s | a preimage's service: the id of the service that asked for it, 4 bytes |
| <span id="gk-subifnone">$\mathcal{U}\left(x\right)$</span> | U of | the first of its arguments that isn't nothing (∅), or ∅ if all are |
| <span id="gk-accumulationstatistics" class="gk-wrap">$\mathbf{S}$</span> | S | this block's accumulation tallies, per service: work-items accumulated, transfers, and gas used |
| <span id="gk-local-servicesreported" class="gk-wrap">$\mathbf{s}^R$</span> | s sup R | the services with a digest in a report guaranteed in this block |
| <span id="gk-cup">$\cup$</span> | union | everything in either side |
| <span id="gk-local-servicesprovided" class="gk-wrap">$\mathbf{s}^P$</span> | s sup P | the services a preimage was provided for in this block |
| <span id="gk-keys">$\mathcal{K}\left(x\right)$</span> | K of | a dictionary's keys |
| <span id="gk-set">$\left\{\,x\,\right\}$</span> | the set of | a set: values with no order and no repeats |
| <span id="gk-build">$\left\{ x \;\middle\vert\; y \right\}$</span> | for each, such that | built by a rule: the left-hand value, for every case the right-hand side allows (a set, or a sequence in order) |

</details>

:::

**Read it aloud.** "For every s in the active services: pi sub S prime at s is defined
as: i, x, z and e are R of s's i, x, z and e; r is the pair R of s's n and R of s's u; p
is the sum over s and d in E sub P of the pair 1 and the size of d; a is S at s, or 0, 0,
0 if there is none. Where the active services are s R, union s P, union the keys of S. s
R is the set of every digest's service, over the digests of the reports in I. s P is the
set of every s for which some pair s, x is in E sub P. R of s is the sum, over each digest
d of each report in I whose service is s, of: n is 1, d's u, i, x, z and e."

**In plain words.** A service gets a card if it did at least one of three things this
block, (13.14) to (13.16): a digest of its was in a guaranteed report (𝐬^R), a preimage
was provided for it (𝐬^P), or it accumulated (a key of 𝐒, the accumulation tallies of
§12.3). Then its card, (13.13):

1. **R(s), its share of the work**, (13.17): over every digest for s in the guaranteed
   reports, add 1 to n, to count them, and add up their gas, imports, extrinsics and
   exports. r is (count, gas).
2. **p, its provisions**: add (1, size) for each preimage provided for it. The sum is
   written over every (s, 𝐝) in 𝐄_P, reusing s; read it as "for each preimage whose
   service is s", which is what the vectors do.
3. **a, its accumulation**: 𝐒[s] if it accumulated, else (0, 0, 0). 𝒰 is "the first that
   isn't nothing".

**On a real value.** Service 42 in `multiple_reports-1`, two digests, one on each core;
service 3 in `preimage_needed-2`; service 1729 in the accumulate vector
`accumulate_ready_queued_reports-1`:

```text
𝐬 in multiple_reports-1   𝐬^R = {42}, 𝐬^P = {}, 𝒦(𝐒) = {}            → {42}
R(42)    n  1 + 1          = 2
         u  821 + 697      = 1518
         i  8 + 1          = 9
         x  8 + 3          = 11
         z  1526 + 1926    = 3452
         e  17 + 18        = 35
π_S′[42] r (2, 1518)  i 9  x 11  z 3452  e 35  p (0, 0)  a (0, 0, 0)

π_S′[3]   p (1, 46)                                  one preimage of 46 bytes
π_S′[1729] a (9, 0, 111136)                          9 work-items, 0 transfers, 111,136 gas
```

**In your client.** `serviceStats` in `src/statistics.ts`, [18.2's
code](./02-what-cores-and-services-did.md#the-code); its `active` set is (13.14).

## Say it in one breath

The statistics are four tallies (13.1): this epoch's and last epoch's validator records,
six counts each, one per validator (13.2, 13.3), and one block's cards for cores and
services (13.7, 13.8). Each block, assurances count first (13.4). A new epoch moves the
tally in progress to last epoch's and starts from zero (13.5). Then the author's block,
tickets and preimages and the reporters' guarantees count (13.6). Each core's card adds up
the work it took on, the data it must now keep, and the assurances that name it (13.9 to
13.12). Each active service's card adds up its digests, its preimages and its
accumulation (13.13 to 13.17).
