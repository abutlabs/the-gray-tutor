# Part 6 · State and Merklization

**In one sentence:** this Part computes the 32-byte root that stands for the whole state,
then reads the state that root stands for.

By the end of this part your client computes the state's root and reads any component
of the state by its key, with the codecs it already has.

## The big picture

Blocks change the state. So before your client can change anything, it has to know what
the state *is*: every validator's keys, every service, every byte of storage.

The state is the chain's whole memory, and every validator keeps its own full copy.
Nothing in-core holds state: a core's guarantors read it as a recent block saw it and
write nothing.

One 32-byte root in every header commits to all of it. That root is how every validator
checks that its copy is everyone's. Appendix D opens with why one root is worth having:

::: gray-paper D

#### Appendix D State Merklization {#gp-D}

<a id="gp-D-p1"></a>The <abbr class="gp-term" title="hashing many values down to one root through a tree, so one 32-byte hash stands for them all">Merklization</abbr> process defines a cryptographic <abbr class="gp-term" title="a short hash that stands for some data, so the data can be checked against it later">commitment</abbr> from which arbitrary information within state may be provided as being authentic in a concise and swift fashion. We describe this in two stages; the first defines a mapping from 31-octet sequences to (unlimited) <abbr class="gp-term" title="a byte: 8 bits">octet</abbr> sequences in a process called *state <abbr class="gp-term" title="turning a value into bytes, so it can be hashed, signed or sent">serialization</abbr>*. The second forms a 32-octet commitment from this mapping in a process called *Merklization*.

:::

With the root alone, anyone can be shown that one value really is in the state, with a
few hashes as proof and no copy of the rest. The two stages are this Part's first two
lessons, backwards: [6.1](./01-the-state-trie.md) builds the Merklization,
[6.2](./02-state-keys.md) the serialization's keys.

Appendix D cuts the state into sixteen numbered components, each a Greek letter, plus one
record per service:

| Key | Symbol | What it is | Built in |
| --- | --- | --- | --- |
| C(1) | α | each core's authorizer pool | [Part 13](../13-authorization/index.md) |
| C(2) | ϕ | each core's authorizer queue | [Part 13](../13-authorization/index.md) |
| C(3) | β | recent history: the last 8 blocks and the belt | [Part 9](../09-recent-history/index.md) |
| C(4) | γ | Safrole: the next validators, the ring root, the sealers, the tickets | [Part 8](../08-safrole/index.md) |
| C(5) | ψ | disputes: the verdicts and the offenders | [Part 10](../10-disputes/index.md) |
| C(6) | η | entropy, four hashes | [6.3](./03-reading-the-state.md), [8.1](../08-safrole/01-stirring-the-entropy.md) |
| C(7), C(8), C(9) | ι, κ, λ | validators: staging, current, previous | [6.3](./03-reading-the-state.md), [8.2](../08-safrole/02-rotating-the-validators.md) |
| C(10) | ρ | each core's pending report, waiting for assurances | Parts [11](../11-assurances/index.md), [12](../12-guarantees/index.md) |
| C(11) | τ | the time: the last block's slot | [6.3](./03-reading-the-state.md) |
| C(12) | χ | privileges: the manager, each core's assigner, the delegator, the registrar | [17.5](../17-accumulation/05-privileges.md) |
| C(13) | π | statistics: the validators', cores' and services' scorecards | [Part 18](../18-statistics/index.md) |
| C(14) | ω | reports waiting on other work | [17.2](../17-accumulation/02-waiting-reports.md) |
| C(15) | ξ | the packages accumulated recently | [17.2](../17-accumulation/02-waiting-reports.md) |
| C(16) | θ | the last block's accumulation outputs | [17.11](../17-accumulation/11-what-a-service-yields.md) |
| C(255, s) | δ | service s's account, with its storage, preimages and requests under keys of its own | [Part 14](../14-services/index.md), [19.3](../19-block-import/03-accounts-from-the-state.md) |

This Part reads the simplest three, τ, η and κ, and builds the trie that hashes all of
them into one root. [19.2](../19-block-import/02-the-whole-state.md) reads the whole
table.

If you build web services: the state is the database, the components are its tables, and
the root is a checksum of all of it that every replica must agree on.

**Builds on** [Part 4 · Blocks](../04-blocks/index.md) and [Part 5 · Hashing and
signatures](../05-hashing-and-signatures/index.md), and on the foundations every part
uses, [Parts 0 to 2](../index.md#lessons).

## At a glance

The whole part on one map. Boxes are what your client holds, and rounded cards are the
steps between them; a dashed card happens outside your client. Tap any card, or walk
through them in order with *next*.

<PartFlow :part="6" />

**Starting here?** At the repo root, `npm run catch-up -- 5.3` makes your client the one
this part starts from; [How to read it](../index.md#how-to-read-it) says more.

- [6.1 The state trie](./01-the-state-trie.md)
- [6.2 State keys](./02-state-keys.md)
- [6.3 Reading the state](./03-reading-the-state.md)

## In the Gray Paper

Open **§4.2, *The State***, for what σ is made of, and **Appendix D, *State Merklization***, for the keys and the root.

| The paper says | We say | The vectors say |
| --- | --- | --- |
| σ, the state, and its seventeen letters | the state and its components | `pre_state`, `post_state`, and in the traces `keyvals` |
| T(σ), the state serialization: a dictionary from 31-byte keys to encodings; C, the key constructor | the state's entries, and the three key recipes | `key`, `value` |
| ℳ_σ(σ), the state Merklization; H_R, the prior state root | the state root | `state_root`, `parent_state_root` |

Its defining lines, equation (4.4) and Appendix D's (D.5), each explained symbol by symbol
in [6.A](./gray-paper.md), with every other formula this part quotes:

::: gray-paper-eq 4.4

<a id="ex-4-4"></a>The Gray Paper's (4.4), [in its place in the paper's words](../00-start/06-how-a-block-is-imported.md#eq-4-4):

$$
\begin{align}
\sigma &\equiv \left(\alpha, \beta, \theta, \gamma, \delta, \eta, \iota, \kappa, \lambda, \rho, \tau, \phi, \chi, \psi, \pi, \omega, \xi\right) \tag{4.4}
\end{align}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-thestate" class="gk-wrap">[$\sigma$](../symbols.md#state)</span> | sigma | the state: everything the chain remembers between blocks |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-authpool" class="gk-wrap">$\alpha$</span> | alpha | the authorizer pools: for each core, up to O = 8 authorizer hashes it accepts right now |
| <span id="gk-recent" class="gk-wrap">$\beta$</span> | beta | recent blocks: the last few blocks' hashes and roots, and the belt of accumulation outputs |
| <span id="gk-lastaccout" class="gk-wrap">$\theta$</span> | theta | the last block's accumulation outputs: which service yielded which hash |
| <span id="gk-safrole" class="gk-wrap">$\gamma$</span> | gamma | Safrole's state: the ticket lottery for who seals the next epoch's blocks |
| <span id="gk-accounts" class="gk-wrap">$\delta$</span> | delta | the service accounts: every service's code hash, balance, storage and preimages |
| <span id="gk-entropy" class="gk-wrap">$\eta$</span> | eta | entropy: four 32-byte values of randomness, the newest mixing in every block |
| <span id="gk-stagingset" class="gk-wrap">$\iota$</span> | iota | the next validators: keys queued to become active at the next epoch |
| <span id="gk-activeset" class="gk-wrap">$\kappa$</span> | kappa | the current validators: the keys of the V validators active this epoch |
| <span id="gk-previousset" class="gk-wrap">$\lambda$</span> | lambda | the last epoch's validators: kept to check what they signed before the change |
| <span id="gk-availassignments" class="gk-wrap">$\rho$</span> | rho | the pending reports: for each core, the report waiting to be made available, and when it came |
| <span id="gk-thetime" class="gk-wrap">$\tau$</span> | tau | the time: the latest block's timeslot |
| <span id="gk-authqueue" class="gk-wrap">$\phi$</span> | phi | the authorizer queues: for each core, Q = 80 authorizer hashes waiting to join its pool |
| <span id="gk-privileges" class="gk-wrap">$\chi$</span> | chi | the privileged services: who may manage, assign cores, set validators and accumulate for free |
| <span id="gk-disputes" class="gk-wrap">$\psi$</span> | psi | past judgments: the reports found good, bad or wonky, and the validators who lied |
| <span id="gk-activity" class="gk-wrap">$\pi$</span> | pi | the statistics: tallies per validator, per core and per service |
| <span id="gk-ready" class="gk-wrap">$\omega$</span> | omega | the ready queue: available reports waiting on others before they can accumulate |
| <span id="gk-accumulated" class="gk-wrap">$\xi$</span> | xi | the accumulated history: the packages accumulated in each of the last E slots |

</details>

:::

::: gray-paper-eq D.5

<a id="ex-D-5"></a>The Gray Paper's (D.5), (D.6), [in its place in the paper's words](./01-the-state-trie.md#eq-D-5):

$$
\begin{align}
\mathcal{M}_\sigma\left(\sigma\right) &\equiv M(\left\{\,\left(\text{bits}(k) \mapsto \left(k, v\right)\right) \;\middle\vert\; \left(k \mapsto v\right) \in T(\sigma) \,\right\}) \tag{D.5} \\
M(d: \left\langle\!\left\vert \mathbb{b}_{}\to\!\left\lgroup\mathbb{B}_{31}, \mathbb{B}_{}\right\rgroup\!\right\vert\!\right\rangle) &\equiv \begin{cases}
\mathbb{H}_{0} &\text{if } \left\vert d\right\vert = 0\\
\mathcal{H}\left(\text{bits}^{-1}(L(k, v))\right) &\text{if } \mathcal{V}\left(d\right) = \left\{\, \left(k, v\right) \,\right\}\\
\mathcal{H}\left(\text{bits}^{-1}(B(M(l), M(r)))\right) &\text{otherwise}\\
\quad \text{where } \forall b, p: \left(b \mapsto p\right) \in d \Leftrightarrow \left(b_{1 \dots } \mapsto p\right) \in \begin{cases}
l &\text{if } b_0 = 0 \\
r &\text{if } b_0 = 1
\end{cases}
\end{cases} \tag{D.6}
\end{align}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-merklizestate">$\mathcal{M}_\sigma\left(x\right)$</span> | M sigma of | the state root of: the 32-byte Merkle root of the whole state |
| <span id="gk-set">$\left\{\,x\,\right\}$</span> | the set of | a set: values with no order and no repeats |
| <span id="gk-build">$\left\{ x \;\middle\vert\; y \right\}$</span> | for each, such that | built by a rule: the left-hand value, for every case the right-hand side allows (a set, or a sequence in order) |
| <span id="gk-kv">$\left(x \mapsto y\right)$</span> | k maps to v | a dictionary entry: key k, value v |
| <span id="gk-in">[$\in$](../symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-dictionary">$\left\langle\!\left\vert x\to y\right\vert\!\right\rangle$</span> | a dictionary from K to V | a map: keys of type K, each with one value of type V |
| <span id="gk-bitstring">$\mathbb{b}$</span> | b sub n | bits: a run of true-or-false values; a subscript is how many |
| <span id="gk-tuple">$\!\left\lgroup x\right\rgroup\!$</span> | the tuple of | a record: named fields, each with its type, like an object in JSON |
| <span id="gk-blob">[$\mathbb{B}$](../symbols.md#blobs)</span> | B, or B sub n | bytes: any run of them; 𝔹ₙ exactly n of them |
| <span id="gk-zerohash" class="gk-wrap">$\mathbb{H}_{0}$</span> | H zero | 32 zero bytes: a placeholder where a hash isn't known yet |
| <span id="gk-len">$\left\vert x\right\vert$</span> | the size of | \|x\|: how many items x has, or how many bytes |
| <span id="gk-blake">$\mathcal{H}\left(x\right)$</span> | H of | the Blake2b hash of what's in the brackets: 32 bytes |
| <span id="gk-values">$\mathcal{V}\left(x\right)$</span> | V of | a dictionary's (or sequence's) values |
| <span id="gk-forall">$\forall$</span> | for all | for every value: ∀c ∈ ℕ_C means for each core c |
| <span id="gk-Leftrightarrow">$\Leftrightarrow$</span> | exactly when | if and only if: both sides are true together, or false together |
| <span id="gk-interval">$_{x \dots y}$</span> | from x to y | the items from index x up to, not including, y |

</details>

:::

Read (4.4) aloud: "the state is alpha, beta, theta, gamma, delta, eta, iota, kappa, lambda,
rho, tau, phi, chi, psi, pi, omega, xi." The paper lists them in this order, not by key
number. The table above has them by key, C(1) to C(16), which is how the state is
stored. The seventeenth letter, δ, is the services: not one component, but one record per
service under C(255, s).

Then (D.5): "the state root is M of the set that maps the bits of each key to the pair of
the key and its value, for every key and value in the serialized state." M is the trie of
[6.1](./01-the-state-trie.md), which hashes a leaf with ℋ and a branch from its two
halves.

**Test yourself:** [E · Serialization and Merklization (Appendices C and D)](https://abutlabs.github.io/jam-learning/lasair/exam.html?chapter=e-codec-merklization),
self-test cards on JAM learning.
