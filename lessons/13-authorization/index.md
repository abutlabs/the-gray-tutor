# Part 13 · Authorization

**In one sentence:** a core takes a work-package only if one of its current gatekeepers
says yes, and this part keeps each core's list of gatekeepers up to date.

The gatekeepers are *authorizers*: an authorizer is a PVM program plus a blob of settings,
named by one hash. Each core has a list of the ones it accepts, its *pool*. The pool
moves block by block: one in from a queue, one out.

By the end of this part your client keeps every core's pool of authorizers moving,
checked on the vectors and on 99 real blocks.

## The big picture

A core's time is JAM's scarce resource, as gas is Ethereum's and a parachain slot is
Polkadot's, and it is bought in advance, as *coretime*. But the one who buys a core's time
is often not the one who later sends the work: a rollup team buys, its users send. JAM
keeps the two apart with a gatekeeper on every core, the authorizer, and that is what
this part is about. It is the one M1 topic about *who may use a core*, not about checking
a computation, so hold the picture before any field.

The paper opens §8 with the same comparison:

::: gray-paper 8

#### §8 Authorization {#gp-8}

<a id="gp-8-p1"></a>We have previously discussed the model of work-packages and services in section [4.9](../what-runs-where.md#gp-4-9-p1), however we have yet to make a substantial discussion of exactly how some *<abbr class="gp-term" title="time on a core, bought ahead: the right to have work run there for a while">coretime</abbr>* resource may be apportioned to some work-package and its associated service. In the *YP* Ethereum model, the underlying resource, gas, is procured at the point of introduction on-chain and the purchaser is always the same agent who authors the data which describes the work to be done (i.e.  the transaction). Conversely, in Polkadot the underlying resource, a <abbr class="gp-term" title="a chain of its own whose blocks Polkadot's validators check, one core's worth at a time">parachain</abbr> slot, is procured with a substantial deposit for typically 24 months at a time and the procurer, generally a parachain team, will often have no direct relation to the author of the work to be done (i.e.  a parachain block).

<a id="gp-8-p2"></a>On a principle of flexibility, we would wish JAM capable of supporting a range of interaction patterns both Ethereum-style and Polkadot-style. In an effort to do so, we introduce the *authorization system*, a means of disentangling the intention of usage for some coretime from the specification and submission of a particular workload to be executed on it. We are thus able to disassociate the purchase and assignment of coretime from the specific determination of work to be done with it, and so are able to support both Ethereum-style and Polkadot-style interaction patterns.

:::

An authorizer is not a validator, not a service, and not a report. It is a PVM program
plus a blob of settings, and the chain knows it by one 32-byte name. The paper says so in
§8.1, the two paragraphs to know by heart:

::: gray-paper 8.1

#### §8.1 Authorizers and Authorizations {#gp-8-1}

<a id="gp-8-1-p1"></a>The authorization system involves three key concepts: *Authorizers*, *Tokens* and *Traces*. A Token is simply a piece of <abbr class="gp-term" title="bytes the protocol carries but never reads; only the code they're for knows what they mean">opaque data</abbr> to be included with a work-package to help make an argument that the work-package should be authorized. Similarly, a Trace is a piece of opaque data which helps characterize or describe some successful authorization. An Authorizer meanwhile, is a piece of logic which executes within some pre-specified and well-known computational limits and determines whether a work-package—including its Token—is authorized for execution on some particular core and yields a Trace on success.

<a id="gp-8-1-p2"></a>Authorizers are identified as the hash of their PVM code hash concatenated with their Configuration blob, the latter being, like Tokens and Traces, opaque data meaningful to the PVM code. The process by which work-packages are determined to be authorized (or not) is not the competence of <abbr class="gp-term" title="what every validator computes while importing a block: your client">on-chain logic</abbr> and happens entirely <abbr class="gp-term" title="done by a core's guarantors, off the chain; the chain only sees the result">in-core</abbr> and as such is discussed in section [14.3](../03-work-and-reports/01-a-work-package.md#gp-14-3-p1). However, on-chain logic must identify each set of authorizers assigned to each core in order to verify that a work-package is legitimately able to utilize that resource. It is this subsystem we will now define.

:::

In a picture:

![An authorizer's anatomy: the package names a code hash, a configuration blob, the service holding the code and a token; the authorizer's name is the hash of code hash and configuration; the guarantors run the code in-core; the chain checks the name against the core's pool and keeps the hash, trace and gas in the report](./images/index-authorizer.svg)

The life of one authorizer, start to finish:

1. **Someone writes the gatekeeper.** Say the rule is "let a package in if its token is a
   signature by key K". The code goes into the state as a preimage of some service, the
   package's `auth_code_host`. The settings blob, the *configuration*, holds K. The
   authorizer's name is H(code hash ⌢ configuration): the same code with another key is
   another authorizer.
2. **The core's owner puts it in the queue.** Each core has an *assigner* service, and
   during its accumulation it can call `assign` with 80 authorizer hashes, the core's new
   queue ϕ[c] ([17.5](../17-accumulation/05-privileges.md)). On the chain.
3. **The chain moves the queue into the pool.** Every block, the queue's entry for this
   slot joins the core's pool α[c], at most 8 hashes: the gatekeepers the core accepts
   right now ([13.1](./01-the-authorizer-pools.md)). On the chain, every validator, your
   client included.
4. **A builder sends a package**, naming the authorizer by code hash and configuration and
   carrying a *token*, here the signature. Off the chain ([lesson
   3.1](../03-work-and-reports/01-a-work-package.md)).
5. **The guarantors run the gatekeeper.** The core's three guarantors run the authorizer's
   code on the package and its token in the PVM, with up to 50,000,000 gas on full. Yes,
   and out comes a *trace* and they go on to refine; no, and the package goes nowhere.
   In-core, never on the chain.
6. **The chain checks the name.** The report carries the authorizer's hash, its trace and
   the gas it used ([lesson 3.3](../03-work-and-reports/03-a-work-report.md)). Every
   validator checks the hash is in the core's pool ([12.4](../12-guarantees/04-bad-guarantees.md)),
   then takes that authorizer out of the pool as the next one comes in from the queue
   ([13.1](./01-the-authorizer-pools.md)).

| Piece | Made from | Lives | Runs or is checked |
| --- | --- | --- | --- |
| the authorizer | PVM code + configuration blob | code: a service's preimage; name: 32 bytes in pools and queues | run in-core by the guarantors |
| the token | a blob in the package | the package, never the chain | read by the authorizer's code |
| the trace | a blob the authorizer produced | the report's `auth_output` | kept, so auditors can check it |
| the pool α[c] | up to 8 authorizer hashes | the state, C(1) | a report's authorizer must be in it: every validator, every block |
| the queue ϕ[c] | exactly 80 authorizer hashes | the state, C(2) | one joins the pool each block; only the assigner changes it |

Why the chain never runs the authorizer itself: the code could be anything and cost
50,000,000 gas, far too much for every validator to repeat. The chain only needs to know
that the gatekeeper was one the core's owner chose, and a 32-byte hash in a list of 8
settles that.

If you build web services: an authorizer is the gateway's authorization check, the code is the
check and the configuration is its policy (a public key, a list of allowed senders), the
token is the bearer token, and the pool is the list of gateways that stand in front of
this core right now.

In the real traces, the queue is one hash 80 times over and the pool is 8 copies of it:
every report takes one copy out and the next slot puts one in, so the pool never changes.
The authorization vectors move real ones, and [13.1](./01-the-authorizer-pools.md) runs
both.

> [!NOTE]
> **Say it in two minutes.** Coretime is bought in advance by someone who may not be the
> one sending the work. So every core has gatekeepers: authorizers, each a PVM program
> plus a configuration, named by one hash. A core's owner puts up to 80 of those hashes in
> the core's queue through the assigner service, and every block one of them joins the
> core's pool of 8. A package names its authorizer and carries a token; the core's
> guarantors run the authorizer's code on it in-core, and if it says yes they refine and
> report. The chain never runs the authorizer. It only checks that the report's authorizer
> hash is in that core's pool, and then rotates that one out.

**Builds on** [Part 4 · Blocks](../04-blocks/index.md), and on the foundations every part
uses, [Parts 0 to 2](../index.md#lessons).

## At a glance

The whole part on one map. Boxes are what your client holds, and rounded cards are the
steps between them; a dashed card happens outside your client. Tap any card, or walk
through them in order with *next*.

<PartFlow :part="13" />

**Starting here?** At the repo root, `npm run catch-up -- 12.5` makes your client the one
this part starts from; [How to read it](../index.md#how-to-read-it) says more.

- [13.1 The authorizer pools](./01-the-authorizer-pools.md)

## In the Gray Paper

Open **§8, *Authorization***, two pages, and **§14.3**, where the package's implied authorizer is defined; **§15** is the guarantors' side, and Appendix B's Ψ_I is the Is-Authorized invocation.

| The paper says | We say | The vectors say |
| --- | --- | --- |
| authorizer: ℋ(authorization code hash ⌢ configuration blob); the *token* in the package; the *trace* the code yields | the authorizer's name, made of its code and settings; the token; the trace | `authorizer_hash`; `authorization`; `auth_output` |
| α, the authorizer pool, at most O = 8 a core; φ, the authorizer queue, exactly Q = 80 a core | the pool and the queue | `auth_pools`, `auth_queues` |
| "an exogenous call made from the accumulate logic of an appropriately privileged service" | the assigner service's `assign` host call | |

Its defining lines, (8.1) to (8.3), each explained symbol by symbol in [13.A](./gray-paper.md):

::: gray-paper-eq 8.1

<a id="ex-8-1"></a>The Gray Paper's (8.1), [in its place in the paper's words](./01-the-authorizer-pools.md#eq-8-1):

$$
\begin{equation}
\alpha \in \left[\!\left[\left[\!\left[\mathbb{H}_{}\right]\!\right]_{:\mathsf{O}}\right]\!\right]_{\mathsf{C}}\ , \qquad
\phi \in \left[\!\left[\left[\!\left[\mathbb{H}_{}\right]\!\right]_{\mathsf{Q}}\right]\!\right]_{\mathsf{C}} \tag{8.1}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-authpool" class="gk-wrap">$\alpha$</span> | alpha | the authorizer pools: for each core, up to O = 8 authorizer hashes it accepts right now |
| <span id="gk-in">[$\in$](../symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-sequence">[$\left[\!\left[x\right]\!\right]$](../symbols.md#sequence)</span> | a sequence of | ⟦T⟧ is an array of T; a subscript is its length, :n at most n, n: at least n |
| <span id="gk-Ccorecount" class="gk-wrap">$\mathsf{C}$</span> | C | the number of cores: 341 on full, 2 on tiny |
| <span id="gk-Cauthpoolsize" class="gk-wrap">$\mathsf{O}$</span> | O | the most authorizers a core's pool holds: 8 |
| <span id="gk-hash">$\mathbb{H}$</span> | H | a 32-byte value, usually a hash |
| <span id="gk-authqueue" class="gk-wrap">$\phi$</span> | phi | the authorizer queues: for each core, Q = 80 authorizer hashes waiting to join its pool |
| <span id="gk-Cauthqueuesize" class="gk-wrap">$\mathsf{Q}$</span> | Q | how many authorizers a core's queue holds: 80 |

</details>

:::

::: gray-paper-eq 8.2

<a id="ex-8-2"></a>The Gray Paper's (8.2), (8.3), [in its place in the paper's words](./01-the-authorizer-pools.md#eq-8-2):

$$
\begin{align}
&\forall c \in \mathbb{N}_{\mathsf{C}} : \alpha'\left[c\right] \equiv {\overleftarrow{F(c) \mathbin{+\!\!+} {\phi'\left[c\right]\left[\mathbf{H}_{T}\right]}^\circlearrowleft}}^{\mathsf{O}} \tag{8.2} \\
&F(c) \equiv \begin{cases} \alpha[c] \mathbin{\circ\!\!\!-\!\!-} \left\{\,(g_{\mathbf{r}})_{a}\,\right\} &\text{if } \exists g \in \mathbf{E}_G : (g_{\mathbf{r}})_{c} = c \\ \alpha[c] & \text{otherwise} \end{cases} \tag{8.3}
\end{align}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-forall">$\forall$</span> | for all | for every value: ∀c ∈ ℕ_C means for each core c |
| <span id="gk--core">$c$</span> | c | a core's index, 0 to C − 1 |
| <span id="gk-coreindex" class="gk-wrap">$\mathbb{N}_{\mathsf{C}}$</span> | N sub C | the core indices: 0 to C − 1 |
| <span id="gk-subb">[$\left[x\right]$](../symbols.md#sequence)</span> | at | x[i]: the item at index i, or the value at key i |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-overleftarrow">$\overleftarrow{x}$</span> | the last n of | with a number above: keep only the rightmost (newest) n items; with none: the sequence reversed |
| <span id="gk-append">[$\mathbin{+\!\!+}$](../symbols.md#concat)</span> | append | add one item at the end of the sequence |
| <span id="gk-cyclic">${x}^\circlearrowleft$</span> | wrapped around | ↺: the index goes round, counting from 0 again past the end (mod the length) |
| <span id="gk-H" class="gk-wrap">$\mathbf{H}$</span> | H | this block's header; 𝐇_T is its timeslot, 𝐇_P its parent's hash |
| <span id="gk--timeslot">$T$</span> | T | a header's timeslot: 𝐇_T is the slot this block was made for |
| <span id="gk-seqminusl">$\mathbin{\circ\!\!\!-\!\!-}$</span> | without its first | the sequence with the leftmost copy of the item taken out |
| <span id="gk-set">$\left\{\,x\,\right\}$</span> | the set of | a set: values with no order and no repeats |
| <span id="gk-g-workreport" class="gk-wrap">$\mathbf{r}$</span> | r | a guarantee's work-report: 𝐠_𝐫 is the report it vouches for |
| <span id="gk-wr-authorizer">$a$</span> | a | a report's authorizer hash: which gatekeeper let its package onto the core |
| <span id="gk-exists">[$\exists$](../symbols.md#exists)</span> | there exists | there is at least one value such that what follows holds |
| <span id="gk-xtguarantees" class="gk-wrap">$\mathbf{E}_G$</span> | E sub G | the guarantees bag: work-reports with their guarantors' signatures, one per core at most |

</details>

:::

Read it aloud: "the pools are, for each of C cores, a sequence of at most O hashes; the
queues, for each core, a sequence of exactly Q hashes. For every core c, the new pool is
F of c, followed by the queue's entry at the slot mod Q, keeping the last O. F of c is the
old pool with the authorizer of this block's report on core c taken out, if there is one,
else the old pool." The arrow over the brackets with a superscript means "keep the
rightmost O". Two pages, two equations: when they ask what authorization is, this is the
whole on-chain part, and the big picture above is the rest.

**Test yourself:** [Ch. 8 Authorization](https://abutlabs.github.io/jam-learning/lasair/exam.html?chapter=ch08-authorization),
self-test cards on JAM learning.
