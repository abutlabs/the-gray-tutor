# Part 14 · Services and preimages

**In one sentence:** services are JAM's programs, each with an account holding its code,
its balance and its storage, and this part opens those accounts up.

It starts with how a service gets data it asked for: preimages.

By the end of this part your client hands services the data they asked for, and reads
any service's account, checking that its footprint and balance add up.

## The big picture

A *service* is JAM's unit of deployment: what an app, or a contract, is elsewhere. It is
made from two things. One PVM program with two entry points, *refine*, which runs in-core
on the work a package brings, and *accumulate*, which runs on the chain to fold the
results into the service's state ([Part 15](../15-the-pvm/index.md) builds the machine,
[Part 16](../16-host-calls/index.md) the calls). And one *account* in the state, which this
part reads.

The paper opens §9 with the same comparison, to a smart contract on Ethereum:

::: gray-paper 9 1-1

#### §9 Service Accounts {#gp-9}

<a id="gp-9-p1"></a>As we already noted, a service in JAM is somewhat analogous to a smart contract in Ethereum in that it includes amongst other items, a code component, a storage component and a balance. Unlike Ethereum, the code is split over two isolated entry-points each with their own environmental conditions; one, *Refinement*, is essentially stateless and happens <abbr class="gp-term" title="done by a core's guarantors, off the chain; the chain only sees the result">in-core</abbr>, and the other, *Accumulation*, which is stateful and happens on-chain. It is the latter which we will concern ourselves with now.

:::

and names the two entry points, numbered 0 and 1. The numbers are names, not addresses:
Appendix B starts refine's run at instruction 0 and accumulate's at instruction 5.

::: gray-paper 9.1 3-5

#### §9.1 Code and Gas, continued

<a id="gp-9-1-p3"></a>There are two entry-points in the code:

<a id="gp-9-1-p4"></a>

- **0 `refine`** Refinement, executed in-core and stateless.<sup>1</sup>
- **1 `accumulate`** Accumulation, executed on-chain and stateful.

<small class="gp-note"><sup>1</sup> Technically there is some small assumption of state, namely that some modestly recent instance of each service's preimages. The specifics of this are discussed in section [14.3](../03-work-and-reports/01-a-work-package.md#gp-14-3-p1).</small>

<a id="gp-9-1-p5"></a>Refinement and accumulation are described in more detail in sections [14.4](../03-work-and-reports/gray-paper.md#gp-14-4-p1) and [12.2](../17-accumulation/04-rounds.md#gp-12-2-p1) respectively.

:::

![A service account: a record under C(255, s) with code hash, balance, gas minimums, footprint and more; beside it three bags of entries, storage, preimages and requests, each under its own kind of key; only the service's own accumulate code and a block's preimages extrinsic change it](./images/index-service-account.svg)

Who touches an account, and where:

1. **On the chain**, the service's own accumulate code, through host calls, on every
   validator: it reads and writes its storage, asks for preimages, pays other services
   (Parts [16](../16-host-calls/index.md) and [17](../17-accumulation/index.md)).
2. **On the chain**, a block's preimages extrinsic, when it brings bytes a service asked
   for ([14.1](./01-providing-preimages.md)).
3. Nobody else. No private key owns a service and no transaction moves its balance: its
   code does, or nothing does. **In-core**, refine can read a service's preimages as a
   recent block saw them, but can't change anything.

A *preimage* is bytes filed under their own hash. It is how data gets into a service at
all, its own code included. The life of one:

1. The service asks, during accumulation, for the data with hash h and length z
   ([16.9](../16-host-calls/09-asking-for-preimages.md)), and a request appears in its
   account.
2. Someone puts the bytes into a block's preimages extrinsic, off the chain.
3. Every validator hashes them, finds the matching request, and files them
   ([14.1](./01-providing-preimages.md)).
4. From then on the service reads them with a host call
   ([16.8](../16-host-calls/08-lookup.md)).

Why not keep that data in storage, which the service writes itself? The paper gives three
reasons, and the last is the one that shapes [14.1](./01-providing-preimages.md):

::: gray-paper 9.2 1-2

#### §9.2 Preimage Lookups {#gp-9-2}

<a id="gp-9-2-p1"></a>In addition to storing data in arbitrary key/value pairs available only on-chain, an account may also solicit data to be made available also in-core, and thus available to the Refine logic of the service's code. State concerning this facility is held under the service's $\mathbf{p}$ and $\mathbf{l}$ components.

<a id="gp-9-2-p2"></a>There are several differences between preimage-lookups and storage. Firstly, preimage-lookups act as a mapping from a hash to its preimage, whereas general storage maps arbitrary keys to values. Secondly, preimage data is supplied extrinsically, whereas storage data originates as part of the service's accumulation. Thirdly preimage data, once supplied, may not be removed freely; instead it goes through a process of being marked as unavailable, and only after a period of time may it be removed from state. This ensures that historical information on its existence is retained. The final point especially is important since preimage data is designed to be queried in-core, under the Refine logic of the service's code, and thus it is important that the historical availability of the preimage is known.

:::

In short: storage is the service's own scratch space, only on the chain. Preimages come
from outside, are checked by their hash, and are kept with a history of when they were
there. Refine, off the chain, must be able to say whether a preimage was there at a given
slot, and auditors must reach the same answer later.

If you build web services: the account is an app's row and its tables, and the preimage
store is a content-addressed blob store, a cache keyed by hash. You ask by hash, you get
bytes whose hash matches, and nobody can slip you anything else. Storage isn't free: the
balance must cover a deposit for every item and byte the service keeps
([14.2](./02-the-service-account.md)).

**Builds on** [Part 4 · Blocks](../04-blocks/index.md), [Part 5 · Hashing and
signatures](../05-hashing-and-signatures/index.md) and [Part 6 · State and
Merklization](../06-state-and-merklization/index.md), and on the foundations every part
uses, [Parts 0 to 2](../index.md#lessons).

## At a glance

The whole part on one map. Boxes are what your client holds, and rounded cards are the
steps between them; a dashed card happens outside your client. Tap any card, or walk
through them in order with *next*.

<PartFlow :part="14" />

**Starting here?** At the repo root, `npm run catch-up -- 13.1` makes your client the one
this part starts from; [How to read it](../index.md#how-to-read-it) says more.

- [14.1 Providing preimages](./01-providing-preimages.md)
- [14.2 The service account](./02-the-service-account.md)

## In the Gray Paper

Open **§9, *Service Accounts***; **§12.4**, *Preimage Integration*, for how a block provides a preimage; and **Appendix D** for where each piece sits in the state.

| The paper says | We say | The vectors say |
| --- | --- | --- |
| δ, the service accounts: a dictionary from service index ℕ_S to account 𝔸 | the accounts | `accounts` |
| 𝔸: storage s, preimages p, preimage requests l, gratis storage offset f, code hash c, balance b, minimum accumulate gas g, minimum memo gas m, created r, last accumulated a, parent p | the record, and its three bags | `storage`, `preimage_blobs`, `preimage_requests`; `code_hash`, `balance`, `min_item_gas`, `min_memo_gas`, `deposit_offset`, `creation_slot`, `last_accumulation_slot`, `parent_service` |
| derived: items i, octets o, the minimum balance t; B_S = 100, B_I = 10, B_L = 1, the deposits | the footprint and the deposit | `items`, `bytes` |

Its defining lines, the account (9.3) and its minimum balance (9.8), each explained
symbol by symbol in [14.A](./gray-paper.md):

::: gray-paper-eq 9.3

<a id="ex-9-3"></a>The Gray Paper's (9.3), [in its place in the paper's words](./02-the-service-account.md#eq-9-3):

$$
\begin{align}
\mathbb{A} \equiv \!\left\lgroup\ \begin{aligned}
\mathbf{s} &\in \left\langle\!\left\vert \mathbb{B}_{}\to\mathbb{B}_{}\right\vert\!\right\rangle\,,\
\mathbf{p} \in \left\langle\!\left\vert \mathbb{H}_{}\to\mathbb{B}_{}\right\vert\!\right\rangle\,,\\
\mathbf{l} &\in \left\langle\!\left\vert \!\left\lgroup\mathbb{H}_{},\mathbb{N}_L\right\rgroup\!\to\left[\!\left[\mathbb{N}_T\right]\!\right]_{:3}\right\vert\!\right\rangle\,,\\
f &\in \mathbb{N}_B\,,\
c \in \mathbb{H}_{}\,,\
b \in \mathbb{N}_B\,,\
g \in \mathbb{N}_G\,,\\
m &\in \mathbb{N}_G\,,\
r \in \mathbb{N}_T\,,\
a \in \mathbb{N}_T\,,\
p \in \mathbb{N}_S\\
\end{aligned}\,\right\rgroup\! \tag{9.3}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-serviceaccount" class="gk-wrap">$\mathbb{A}$</span> | A | a service account: three dictionaries (storage, preimages, requests) and eight plain fields |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-tuple">$\!\left\lgroup x\right\rgroup\!$</span> | the tuple of | a record: named fields, each with its type, like an object in JSON |
| <span id="gk-sa-storage" class="gk-wrap">$\mathbf{s}$</span> | s | an account's storage: keys to values, both any bytes, written by its own accumulate code |
| <span id="gk-in">[$\in$](../symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-dictionary">$\left\langle\!\left\vert x\to y\right\vert\!\right\rangle$</span> | a dictionary from K to V | a map: keys of type K, each with one value of type V |
| <span id="gk-blob">[$\mathbb{B}$](../symbols.md#blobs)</span> | B, or B sub n | bytes: any run of them; 𝔹ₙ exactly n of them |
| <span id="gk-sa-preimages" class="gk-wrap">$\mathbf{p}$</span> | p | an account's preimages: each a blob filed under its own 32-byte hash |
| <span id="gk-hash">$\mathbb{H}$</span> | H | a 32-byte value, usually a hash |
| <span id="gk-sa-requests" class="gk-wrap">$\mathbf{l}$</span> | l | an account's requests: for each (hash, length) asked for, a history of up to 3 slots |
| <span id="gk-bloblength" class="gk-wrap">$\mathbb{N}_L$</span> | N sub L | a length of bytes: a u32 (below 2³²) |
| <span id="gk-sequence">[$\left[\!\left[x\right]\!\right]$](../symbols.md#sequence)</span> | a sequence of | ⟦T⟧ is an array of T; a subscript is its length, :n at most n, n: at least n |
| <span id="gk-timeslot" class="gk-wrap">$\mathbb{N}_T$</span> | N sub T | a timeslot: a u32 counting 6-second slots |
| <span id="gk-sa-gratis">$f$</span> | f | an account's gratis offset: deposit it is let off, taken from its minimum balance |
| <span id="gk-balance" class="gk-wrap">$\mathbb{N}_B$</span> | N sub B | a balance: a u64 |
| <span id="gk-sa-codehash">$c$</span> | c | an account's code hash: names the preimage holding its code |
| <span id="gk-sa-balance">$b$</span> | b | an account's balance, in tokens: a u64 |
| <span id="gk-sa-minaccgas">$g$</span> | g | the least gas each work-item for this service must bring to accumulate |
| <span id="gk-gas" class="gk-wrap">$\mathbb{N}_G$</span> | N sub G | an amount of gas: a u64 |
| <span id="gk-sa-minmemogas">$m$</span> | m | the least gas each transfer to this service must bring |
| <span id="gk-sa-created">$r$</span> | r | the slot the service was created at |
| <span id="gk-sa-lastacc">$a$</span> | a | the slot the service last accumulated at |
| <span id="gk-sa-parent">$p$</span> | p | the parent: the id of the service that created this one |
| <span id="gk-serviceid" class="gk-wrap">$\mathbb{N}_S$</span> | N sub S | a service id: a whole number below 2³², 4 bytes |

</details>

:::

::: gray-paper-eq 9.8

<a id="ex-9-8"></a>The Gray Paper's (9.8), [in its place in the paper's words](./02-the-service-account.md#eq-9-8):

$$
\begin{align}
\forall \mathbf{a} \in \mathcal{V}\left(\delta\right)\colon \left\{ \begin{aligned}
\mathbf{a}_{i} \in \mathbb{N}_{2^{32}} &\equiv
2\cdot\left\vert\,\mathbf{a}_{\mathbf{l}}\,\right\vert + \left\vert\,\mathbf{a}_{\mathbf{s}}\,\right\vert \\
\mathbf{a}_{o} \in \mathbb{N}_{2^{64}} &\equiv
\sum\limits_{\,\left(h, z\right) \in \mathcal{K}\left(\mathbf{a}_{\mathbf{l}}\right)\,} \!\!\!\!81 + z \\
&\phantom{\equiv\ } + \sum\limits_{\left(x, y\right) \in \mathbf{a}_{\mathbf{s}}} 34 + \left\vert y\right\vert + \left\vert x\right\vert \\
\mathbf{a}_{t} \in \mathbb{N}_B &\equiv
\max(0,
\mathsf{B}_S
+ \mathsf{B}_I \cdot \mathbf{a}_{i}
+ \mathsf{B}_L \cdot \mathbf{a}_{o}
- \mathbf{a}_{f}
)
\end{aligned} \right. \tag{9.8}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-forall">$\forall$</span> | for all | for every value: ∀c ∈ ℕ_C means for each core c |
| <span id="gk-values">$\mathcal{V}\left(x\right)$</span> | V of | a dictionary's (or sequence's) values |
| <span id="gk-accounts" class="gk-wrap">$\delta$</span> | delta | the service accounts: every service's code hash, balance, storage and preimages |
| <span id="gk-abracegroup">$\left\{ \begin{aligned}x\end{aligned} \right.$</span> | as follows | a brace grouping lines that hold together: for a function, its type on top, then what each input becomes |
| <span id="gk-sa-items">$i$</span> | i | an account's items: 2 per request plus 1 per storage entry |
| <span id="gk-Nbits">[$\mathbb{N}_{2^{x}}$](../symbols.md#naturals)</span> | N sub two to the n | the numbers that fit in n bits: ℕ_{2³²} is a u32 |
| <span id="gk-cdot">$\cdot$</span> | times | multiply |
| <span id="gk-len">$\left\vert x\right\vert$</span> | the size of | \|x\|: how many items x has, or how many bytes |
| <span id="gk-sa-octets">$o$</span> | o | an account's octets: the bytes it keeps, with 81 per request and 34 per storage entry on top |
| <span id="gk-sum">$\sum$</span> | the sum of | add up what follows, once for each value the subscript ranges over |
| <span id="gk-keys">$\mathcal{K}\left(x\right)$</span> | K of | a dictionary's keys |
| <span id="gk-sa-minbalance">$t$</span> | t | an account's minimum balance: 100, plus 10 per item and 1 per octet, less f, never below 0 |
| <span id="gk-max">$\max$</span> | max of | the largest of the values in the brackets |
| <span id="gk-Cbasedeposit" class="gk-wrap">$\mathsf{B}_S$</span> | B sub S | the deposit every service holds just to exist: 100 |
| <span id="gk-Citemdeposit" class="gk-wrap">$\mathsf{B}_I$</span> | B sub I | the deposit a service holds for each item it stores: 10 |
| <span id="gk-Cbytedeposit" class="gk-wrap">$\mathsf{B}_L$</span> | B sub L | the deposit a service holds for each byte it stores: 1 |

</details>

:::

Read it aloud: "an account is a storage dictionary from blob to blob; a preimage
dictionary from hash to blob; a request dictionary from a hash and a length to a
sequence of up to three timeslots; and the plain fields: gratis offset, balance, code
hash, two gas minimums, two timeslots, a parent. Its minimum balance is the base deposit
plus the item deposit times its items plus the byte deposit times its octets, less its
gratis offset, floored at zero." The request's three timeslots are the history
[14.1](./01-providing-preimages.md) keeps: provided, forgotten, available again.

**Test yourself:** [Ch. 9 Service Accounts](https://abutlabs.github.io/jam-learning/lasair/exam.html?chapter=ch09-accounts),
self-test cards on JAM learning.
