# Part 18 · Statistics

The chain keeps score: which validators made blocks, guaranteed work and confirmed they
hold data, and how much work each core and each service did. JAM itself pays nobody; the
tallies are there so that whoever does pay can see who earned it. This part builds them,
validators first.

By the end of this part your client keeps all three scorecards, the validators', the
cores' and the services', matching every reports and preimages vector.

**Builds on** [Part 3 · Work and reports](../03-work-and-reports/index.md), [Part 4 ·
Blocks](../04-blocks/index.md), [Part 6 · State and
Merklization](../06-state-and-merklization/index.md), [Part 11 ·
Assurances](../11-assurances/index.md), [Part 12 · Guarantees](../12-guarantees/index.md)
and [Part 17 · Accumulation](../17-accumulation/index.md), and on the foundations every
part uses, [Parts 0 to 2](../index.md#lessons).

## The big picture

The chain hands out no rewards. The Gray Paper leaves that to a staking system, and asks
the chain only to get it the facts:

::: gray-paper 13.1 1-2

#### §13.1 Validator Activity {#gp-13-1}

<a id="gp-13-1-p1"></a>The JAM chain does not explicitly issue rewards—we leave this as a job to be done by the staking subsystem (in Polkadot's case envisioned as a system <abbr class="gp-term" title="a chain of its own whose blocks Polkadot's validators check, one core's worth at a time">parachain</abbr>—hosted without fees—in the current imagining of a public JAM network). However, much as with validator punishment information, it is important for the JAM chain to facilitate the arrival of information on validator activity in to the staking subsystem so that it may be acted upon.

<a id="gp-13-1-p2"></a>Such performance information cannot directly cover all aspects of validator activity; whereas block production, guarantor reports and availability assurance can easily be tracked on-chain, GRANDPA, BEEFY and auditing activity cannot. In the latter case, this is instead tracked with validator voting activity: validators vote on their impression of each other's efforts and a median may be accepted as the truth for any given validator. With an assumption of 50% honest validators, this gives an adequate means of oraclizing this information.

:::

So the chain counts what it can see in its own blocks, and leaves finality voting and
auditing to a vote among validators. Three scorecards hold the counts:

| Card | Counts | Lasts | Who it's for |
| --- | --- | --- | --- |
| Validators | blocks, tickets, preimages, guarantees, assurances | an epoch, and the last one is kept | the staking system, to pay them |
| Cores | work taken on, data load, popularity | one block | the Gray Paper names nobody |
| Services | work, preimages provided, accumulation | one block | the Gray Paper names nobody |

The facts come from what the block carries: who authored it, whose tickets, preimages,
guarantees and assurances are in its extrinsics, and what accumulation did. Nothing runs
in-core here; the chain is only writing down what it saw, on every validator, the same way.

It looks like bookkeeping, and it can still sink your client. The cards are chapter 13 of
the state, so they're in the state root: one count wrong, and the root is wrong, and your
client refuses a good block. [Lesson 19.6](../19-block-import/06-blocks-to-refuse.md) shows
a real case, where a difference in gas did exactly that.

The part takes about 20 minutes: 18.1 is the validators, 18.2 the cores and services.

## At a glance

The whole part on one map. Boxes are what your client holds, and rounded cards are the
steps between them; a dashed card happens outside your client. Tap any card, or walk
through them in order with *next*.

<PartFlow :part="18" />

**Starting here?** At the repo root, `npm run catch-up -- 17.13` makes your client the one
this part starts from; [How to read it](../index.md#how-to-read-it) says more.

- [18.1 Who did what](./01-who-did-what.md)
- [18.2 What cores and services did](./02-what-cores-and-services-did.md)

## In the Gray Paper

Open **§13, *Statistics***, which the source calls *bookkeeping*: 13.1 the validators, 13.2 the cores and services.

| The paper says | We say | The vectors say |
| --- | --- | --- |
| π ≡ (π_V this epoch's validator tallies, π_L last epoch's, π_C cores, π_S services) | the three scorecards | `vals_curr_stats`, `vals_last_stats`, `cores_statistics`, `services_statistics` |
| a validator's record: b blocks, t tickets, p preimage count, d preimage size, g guarantees, a assurances | who did what | `blocks`, `tickets`, `pre_images`, `pre_images_size`, `guarantees`, `assurances` |
| the reporters 𝐆 from §11.4 credit the guarantees | the signers of this block's guarantees | |

Its defining lines, (13.1) to (13.3), with the rest of §13 each explained symbol by symbol in
[18.A](./gray-paper.md):

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

Read it aloud: "the statistics are the current validator tallies, the last epoch's, the
cores' and the services'. The two validator tallies are each a sequence of records of six
naturals, one record per validator: as many as the current validators for this epoch's,
as many as the previous validators for last epoch's." The transition under it is three
daggers: add the assurances, roll over at an epoch's turn, then add the block's author,
tickets, preimages and guarantees ([18.1](./01-who-did-what.md)).

**Test yourself:** [Ch. 13 Statistics](https://abutlabs.github.io/jam-learning/lasair/exam.html?chapter=ch13-statistics),
self-test cards on JAM learning.
