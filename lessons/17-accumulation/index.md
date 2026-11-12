# Part 17 · Accumulation

**In one sentence:** accumulation is the moment a block's finished work reaches the
chain, when each service folds the results of its work into its own state.

By the end of this part your client does that for whole blocks, and all 63 official
accumulate vectors pass.

## The big picture

A core is a workshop and the chain is a ledger. The heavy work happens in the workshop,
and only its result is written into the ledger. *Refine* is the workshop. *Accumulate* is
the writing down. Every validator does it, the same way, so they all end up with the same
ledger.

| | Refine | Accumulate |
| --- | --- | --- |
| Where | on one core, off the chain | on the chain, inside block import |
| Who runs it | that core's guarantors, then the auditors | every validator |
| Gas, on full | 5,000,000,000 a package | 10,000,000 a report, 3,500,000,000 a block |
| Touches the state? | no: it makes a report | yes: this is how a service's state changes |

The paper opens §12 with the same picture, and names the three things that make it more
than "run each service's code":

::: gray-paper 12

#### §12 Accumulation {#gp-12}

<a id="gp-12-p1"></a>Accumulation may be defined as some function whose arguments are $\mathbf{R}$ and $\delta$ together with selected portions of (at times partially transitioned) state and which yields the <abbr class="gp-term" title="after the change: the value once it is made, written with a prime (α′); for state, after the block">posterior</abbr> service state $\delta'$ together with additional state elements $\iota'$, $\phi'$ and $\chi'$.

<a id="gp-12-p2"></a>The proposition of accumulation is in fact quite simple: we merely wish to execute the *Accumulate* logic of the service code of each of the services which has at least one work-digest, passing to it relevant data from said digests together with useful contextual information. However, there are three main complications. Firstly, we must define the execution environment of this logic and in particular the host functions available to it. Secondly, we must define the amount of gas to be allowed for each service's execution. Finally, we must determine the nature of transfers within Accumulate.

:::

Those three are where this part's lessons go:

- the environment is [Part 16](../16-host-calls/index.md)'s host calls;
- the gas is [17.9](./09-the-blocks-gas-budget.md)'s budget;
- the transfers are [17.3](./03-sending-a-transfer.md) and [17.4](./04-rounds.md).

(𝐑 is the reports that just became available, δ the accounts; ι′, ϕ′ and χ′ are the next
validators, the authorizer queues and the privileges.)

Service code runs in both refine and accumulate, but block import never refines. So why
does accumulation need 13 lessons? Many services accumulate in one block, and they can
affect each other. One real block from the vectors shows most of it:

1. A report for service 0 became available, so service 0 runs, using 255,437 gas.
2. Its code pays service 1 a hundred. The money leaves service 0 at once, but nothing
   reaches another service inside a round, so it waits for the next one.
3. A second round runs for that transfer: the 100 lands first, then service 1 runs, using
   61,711 gas. It sends nothing, so there's no third round.

What the pieces are:

- **What goes in:** the *digests* in the block's available reports. There is one per
  work-item, and each says what refine produced for one service ([lesson
  3.2](../03-work-and-reports/02-work-digests.md)).
- **What changes:** the service's *account*, through host calls: its storage, balance,
  requests and privileges ([Part 14](../14-services/index.md)'s page draws it).
- **What comes out:** a *yield* per service, a 32-byte hash for the outside world, and
  the transfers to other services.

Only the accumulate code runs here. The refine code already ran, in-core, and nothing
re-runs it.

Everything else is what can go right or wrong around those three steps. The sidebar's
order is the order the code gets built in. To read for the ideas, take this order:

| Question | Lessons | Time |
| --- | --- | --- |
| How does a block's work flow through? | [17.1](./01-a-blocks-accumulation.md), [17.2](./02-waiting-reports.md), [17.3](./03-sending-a-transfer.md), [17.4](./04-rounds.md), [17.9](./09-the-blocks-gas-budget.md) | 37 min |
| Who may change the rules? | [17.5](./05-privileges.md), [17.6](./06-who-wins.md), [17.13](./13-blessing-and-designating.md) | 22 min |
| How does a service begin, change and end? | [17.8](./08-creating-a-service.md), [17.10](./10-upgrading-a-service.md), [17.7](./07-ejecting-a-service.md) | 18 min |
| What leaves a service? | [17.11](./11-what-a-service-yields.md), [17.12](./12-providing-a-preimage.md) | 13 min |

**Builds on** [Part 3 · Work and reports](../03-work-and-reports/index.md), [Part 4 ·
Blocks](../04-blocks/index.md), [Part 5 · Hashing and
signatures](../05-hashing-and-signatures/index.md), [Part 9 · Recent
history](../09-recent-history/index.md), [Part 13 · Authorization](../13-authorization/index.md), [Part 14 · Services and
preimages](../14-services/index.md), [Part 15 · The PVM](../15-the-pvm/index.md) and [Part
16 · Host calls](../16-host-calls/index.md), and on the foundations every part uses,
[Parts 0 to 2](../index.md#lessons).

## At a glance

The whole part on one map. Boxes are what your client holds, and rounded cards are the
steps between them; a dashed card happens outside your client. Tap any card, or walk
through them in order with *next*.

<PartFlow :part="17" />

**Starting here?** At the repo root, `npm run catch-up -- 16.9` makes your client the one
this part starts from; [How to read it](../index.md#how-to-read-it) says more.

- [17.1 A block's accumulation](./01-a-blocks-accumulation.md)
- [17.2 Waiting reports](./02-waiting-reports.md)
- [17.3 Sending a transfer](./03-sending-a-transfer.md)
- [17.4 Rounds](./04-rounds.md)
- [17.5 Privileges](./05-privileges.md)
- [17.6 Who wins](./06-who-wins.md)
- [17.7 Ejecting a service](./07-ejecting-a-service.md)
- [17.8 Creating a service](./08-creating-a-service.md)
- [17.9 The block's gas budget](./09-the-blocks-gas-budget.md)
- [17.10 Upgrading a service](./10-upgrading-a-service.md)
- [17.11 What a service yields](./11-what-a-service-yields.md)
- [17.12 Providing a preimage](./12-providing-a-preimage.md)
- [17.13 Blessing and designating](./13-blessing-and-designating.md)

## In the Gray Paper

Open **§12, *Accumulation***: 12.1 *History and Queuing* (ξ and ω, which reports may go),
12.2 *Execution* (the three accumulation functions Δ+, Δ\* and Δ₁), 12.3 *Final State
Integration* (the budget, the statistics, the new ξ′ and ω′), and 12.4 *Preimage
Integration*, which [Part 14](../14-services/index.md) builds. The privileges χ are in
**§9.4**, and the host calls a service makes are Appendix B ([Part
16](../16-host-calls/index.md)).

| The paper says | We say | The vectors say |
| --- | --- | --- |
| Δ+, the outer accumulation function; Δ\*, the parallelized one; Δ₁, single-service | a block's rounds; one round; one service | |
| ω, the ready queue; ξ, the accumulated history; θ, the accumulation outputs; 𝐑, the newly available reports | the waiting reports; what was accumulated recently; the yields; the inputs | `ready_queue`, `accumulated`, `output` (the yields' root) |
| 𝕊, the partial state; 𝕌, an operand tuple; 𝕏, a deferred transfer; 𝕆, a service's output | the state a service may touch; a digest as input; a transfer; what a run produced | `accounts`, `transfers` |
| χ_Z, the always-accumulate services, passed to Δ+ as 𝐟 | the services that run every block for free | `always_acc` |
| 𝐒, the accumulation statistics: N, T, G | how many digests, transfers and gas, a service | `statistics` |

Its defining line, the outer accumulation Δ+, (12.17), explained symbol by symbol with
every other formula of this part in [17.A](./gray-paper.md):

::: gray-paper-eq 12.17

<a id="ex-12-17"></a>The Gray Paper's (12.17), [in its place in the paper's words](./09-the-blocks-gas-budget.md#eq-12-17):

$$
\begin{equation}
\Delta_+\colon\left\{ \begin{aligned}
&\!\left\lgroup\mathbb{N}_G, \left[\!\left[\mathbb{X}\right]\!\right]_{}, \left[\!\left[\mathbb{R}\right]\!\right]_{}, \mathbb{S}, \left\langle\!\left\vert \mathbb{N}_S\to\mathbb{N}_G\right\vert\!\right\rangle\right\rgroup\! \to \!\left\lgroup\mathbb{N}, \mathbb{S}, B, U, \left[\!\left[\mathbb{X}\right]\!\right]_{}\right\rgroup\! \\
&\left(g, \mathbf{t}, \mathbf{r}, \mathbf{e}, \mathbf{f}\right) \!\mapsto\! \begin{cases}
\left(0, \mathbf{e}, \left\{\right\}, \left[\right], \left[\right]\right) &
\text{if } n = 0 \\
\left(i + j, \mathbf{e}', \mathbf{b}^* \!\cup \mathbf{b}, \mathbf{u}^* \!\!\frown \mathbf{u}, \mathbf{t} \frown \mathbf{t}^\dagger\right)\!\!\!\! &
\text{o/w}\!\!\!\!\!\!\!\! \\
\end{cases} \\
&\quad \text{where } i = \max(\mathbb{N}_{\left\vert\mathbf{r}\right\vert + 1}): \\
&\qquad \sum_{r \in \mathbf{r}_{\dots i}, d \in r_{\mathbf{d}}}\!\!\!\!\!\!\!\!(d_{g}) + \sum_{t \in \mathbf{t}}(t_{g}) + \!\!\!\!\sum_{x \in \mathcal{V}\left(\mathbf{f}\right)}\!\!\!\!(x) \le g \\
&\quad \text{and } n = i + \left\vert\mathbf{t}\right\vert + \left\vert\mathbf{f}\right\vert \\
&\quad \text{and } \left(\mathbf{e}^*\!\!, \mathbf{t}^*\!\!, \mathbf{b}^*\!\!, \mathbf{u}^*\right) = \Delta_*(\mathbf{e}, \mathbf{t},\mathbf{r}_{\dots i}, \mathbf{f}) \\
&\quad \text{and } \left(j, \mathbf{e}'\!, \mathbf{b}, \mathbf{u}, \mathbf{t}^\dagger\right) = \Delta_+(g^*, \mathbf{t}^*\!\!, \mathbf{r}_{i\dots}, \mathbf{e}^*\!\!, \left\{\right\})\\
&\quad \text{and } g^* = g + \sum_{t \in \mathbf{t^*}}(t_{g}) - \!\!\!\!\!\!\sum_{\left(s, u\right) \in \mathbf{u}^*}\!\!\!\!\!\!(u)
\end{aligned} \right. \tag{12.17}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-accseq" class="gk-wrap">$\Delta_+$</span> | Delta plus | the outer accumulation: rounds of Δ\*, each taking the reports that fit the gas left, until no reports fit and no transfers wait |
| <span id="gk-abracegroup">$\left\{ \begin{aligned}x\end{aligned} \right.$</span> | as follows | a brace grouping lines that hold together: for a function, its type on top, then what each input becomes |
| <span id="gk-tuple">$\!\left\lgroup x\right\rgroup\!$</span> | the tuple of | a record: named fields, each with its type, like an object in JSON |
| <span id="gk-gas" class="gk-wrap">$\mathbb{N}_G$</span> | N sub G | an amount of gas: a u64 |
| <span id="gk-defxfers">$\left[\!\left[\mathbb{X}\right]\!\right]$</span> | a sequence of transfers | a list of deferred transfers, in order |
| <span id="gk-workreports">$\left[\!\left[\mathbb{R}\right]\!\right]$</span> | a sequence of work-reports | a list of work-reports, in order |
| <span id="gk-partialstate" class="gk-wrap">$\mathbb{S}$</span> | S | a partial state: the parts of the state accumulation may change: accounts, next validators, authorizer queues and the privileges |
| <span id="gk-dictionary">$\left\langle\!\left\vert x\to y\right\vert\!\right\rangle$</span> | a dictionary from K to V | a map: keys of type K, each with one value of type V |
| <span id="gk-serviceid" class="gk-wrap">$\mathbb{N}_S$</span> | N sub S | a service id: a whole number below 2³², 4 bytes |
| <span id="gk-to">[$\to$](../symbols.md#to)</span> | to | what goes in, to what comes out: A → B takes an A and gives a B |
| <span id="gk-N" class="gk-wrap">[$\mathbb{N}$](../symbols.md#naturals)</span> | N | the whole numbers: 0, 1, 2 and up; a subscript is a bound, ℕ₈ is 0 to 7 |
| <span id="gk-local-fnservouts">$B$</span> | B | the yields: a set of pairs (service, 32-byte hash) |
| <span id="gk-local-fngasused">$U$</span> | U | the gas used: a list of pairs (service, gas), one per run |
| <span id="gk-psX" class="gk-wrap">$\mathbf{e}$</span> | e | a partial state: the accounts, next validators, queues and privileges a run works on |
| <span id="gk-mapsto">$\mapsto$</span> | maps to | what a function gives back for an input: x ↦ y says x becomes y |
| <span id="gk-emset">$\left\{\right\}$</span> | the empty set | a set, or a dictionary, with nothing in it |
| <span id="gk-sq">[$\left[x\right]$](../symbols.md#sequence)</span> | the sequence | a sequence written out item by item; [ ] is the empty one |
| <span id="gk-cup">$\cup$</span> | union | everything in either side |
| <span id="gk-concat" class="gk-wrap">[$\frown$](../symbols.md#concat)</span> | concatenate | join: the left sequence followed by the right |
| <span id="gk-dagger">$\dagger$</span> | dagger | a mark making a new name from an old one: δ† is δ partway through the block, 𝐭† another list of transfers |
| <span id="gk-max">$\max$</span> | max of | the largest of the values in the brackets |
| <span id="gk-Nmax">[$\mathbb{N}_{x}$](../symbols.md#naturals)</span> | N sub n | the whole numbers below n: ℕ_C is a core index, 0 to C − 1 |
| <span id="gk-len">$\left\vert x\right\vert$</span> | the size of | \|x\|: how many items x has, or how many bytes |
| <span id="gk-sum">$\sum$</span> | the sum of | add up what follows, once for each value the subscript ranges over |
| <span id="gk-in">[$\in$](../symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-wr-digests" class="gk-wrap">$\mathbf{d}$</span> | d | the report's digests, one per work-item, 1 to 16 of them (`results`) |
| <span id="gk-wd-gaslimit">$g$</span> | g | the gas the item's accumulation may use (`accumulate_gas`) |
| <span id="gk-values">$\mathcal{V}\left(x\right)$</span> | V of | a dictionary's (or sequence's) values |
| <span id="gk-le">$\le$</span> | at most | less than or equal to |
| <span id="gk-accpar" class="gk-wrap">$\Delta_*$</span> | Delta star | one round of accumulation: every service with work runs once, all from the same state, and their results are merged |

</details>

:::

Read it aloud: "the outer accumulation takes a gas limit, the transfers to deliver, the
reports to accumulate, a partial state and the free services with their gas, and gives
back how many reports it took, the new partial state, the yields, the gas each service
used, and the transfers it delivered." The body is one round, Δ\*, on as many reports as
fit the gas, then Δ+ again on the rest with what's left: a recursion, one level per round
([17.4](./04-rounds.md), [17.9](./09-the-blocks-gas-budget.md)).

**Test yourself:** [Ch. 12 Accumulation](https://abutlabs.github.io/jam-learning/lasair/exam.html?chapter=ch12-accumulation),
self-test cards on JAM learning.
