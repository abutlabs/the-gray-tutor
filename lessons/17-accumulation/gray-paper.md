# The formulas, in plain words

This part's appendix: every formula of §12, *Accumulation*, and of §9.4, *Service
Privileges*, explained. That is twenty-one blocks, more than any other part. [The part's
page](./index.md#the-big-picture) tells the story first, on one real block.

The real values are the tiny vectors in `vectors/stf/accumulate/tiny/`: E = 12 slots an
epoch, C = 2 cores, G_T = 20,000,000 and G_A = 10,000,000 gas. A hash is shown by its
first two bytes. Each formula: its key, then read aloud, in plain words, on a real value,
in your client. Notation: [Reading the Gray Paper](../reading-the-gray-paper.md).

## (9.9) to (9.11): who holds which privilege

::: gray-paper-eq 9.9

<a id="ex-9-9"></a>The Gray Paper's (9.9), (9.10), (9.11), [in its place in the paper's words](./05-privileges.md#eq-9-9):

$$
\begin{align}
\chi &\equiv \!\left\lgroup
\chi_M,
\chi_V,
\chi_R,
\chi_A,
\chi_Z
\right\rgroup\! \tag{9.9} \\
\chi_M &\in \mathbb{N}_S \ ,\qquad
\chi_V \in \mathbb{N}_S \ ,\qquad
\chi_R \in \mathbb{N}_S \tag{9.10} \\
\chi_A &\in \left[\!\left[\mathbb{N}_S\right]\!\right]_{\mathsf{C}} \ ,\qquad
\chi_Z \in \left\langle\!\left\vert \mathbb{N}_S\to\mathbb{N}_G\right\vert\!\right\rangle \tag{9.11}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-privileges" class="gk-wrap">$\chi$</span> | chi | the privileged services: who may manage, assign cores, set validators and accumulate for free |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-tuple">$\!\left\lgroup x\right\rgroup\!$</span> | the tuple of | a record: named fields, each with its type, like an object in JSON |
| <span id="gk-manager" class="gk-wrap">$\chi_M$</span> | chi sub M | the manager: the one service that may change the privileges and grant free storage |
| <span id="gk-delegator" class="gk-wrap">$\chi_V$</span> | chi sub V | the delegator: the one service that may set the next epoch's validator keys |
| <span id="gk-registrar" class="gk-wrap">$\chi_R$</span> | chi sub R | the registrar: the one service that may create services with the reserved low ids |
| <span id="gk-assigners" class="gk-wrap">$\chi_A$</span> | chi sub A | the assigners: for each core, the service that may replace its authorizer queue |
| <span id="gk-alwaysaccers" class="gk-wrap">$\chi_Z$</span> | chi sub Z | the always-accumulate services: each accumulates every block, with this much gas |
| <span id="gk-in">[$\in$](../symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-serviceid" class="gk-wrap">$\mathbb{N}_S$</span> | N sub S | a service id: a whole number below 2³², 4 bytes |
| <span id="gk-sequence">[$\left[\!\left[x\right]\!\right]$](../symbols.md#sequence)</span> | a sequence of | ⟦T⟧ is an array of T; a subscript is its length, :n at most n, n: at least n |
| <span id="gk-Ccorecount" class="gk-wrap">$\mathsf{C}$</span> | C | the number of cores: 341 on full, 2 on tiny |
| <span id="gk-dictionary">$\left\langle\!\left\vert x\to y\right\vert\!\right\rangle$</span> | a dictionary from K to V | a map: keys of type K, each with one value of type V |
| <span id="gk-gas" class="gk-wrap">$\mathbb{N}_G$</span> | N sub G | an amount of gas: a u64 |

</details>

:::

**Read it aloud.** "Chi is defined as the tuple of chi M, chi V, chi R, chi A and chi Z.
Chi M, chi V and chi R are each a service id. Chi A is a sequence of C service ids. Chi Z
is a dictionary from service id to gas."

**In plain words.** A type line: the shape of the privileges, the state's list of who may
do what. There are five. Three are held by one service each, one is held per core, and
one is a list:

- χ_M, the *manager*, may change all the privileges at once, with `bless`;
- χ_V, the *delegator*, chooses the next validators' keys ι, with `designate`;
- χ_R, the *registrar*, alone may create services at ids below S = 2^16;
- χ_A, one *assigner* per core, sets that core's authorizer queue, with `assign`;
- χ_Z, the *always-accumulate* services, run every block, each with its free gas.

**On a real value.** `always_accumulate-1`, before the block (the vector calls them
`bless`, `designate`, `register`, `assign` and `always_acc`):

```text
χ_M   0                    service 0 is the manager
χ_V   0                    and the delegator
χ_R   0                    and the registrar
χ_A   [0, 0]               and the assigner of both cores, C = 2
χ_Z   {1729 ↦ 100,000}     service 1729 runs every block, on 100,000 free gas
```

One service may hold many privileges: here service 0 holds four.

**In your client.** The `Privileges` type in `src/host.ts`, [17.5's
code](./05-privileges.md#the-code). χ_Z is the accumulation state's `free`, and joins a
run's privileged state in [17.13](./13-blessing-and-designating.md#the-code).

## (12.1) to (12.3): the history and the queue

::: gray-paper-eq 12.1

<a id="ex-12-1"></a>The Gray Paper's (12.1), (12.2), [in its place in the paper's words](./02-waiting-reports.md#eq-12-1):

$$
\begin{align}
\xi &\in \left[\!\left[\left\{\mkern-5mu\left[\,\mathbb{H}_{}\,\right]\mkern-5mu\right\}\right]\!\right]_{\mathsf{E}} \tag{12.1} \\
\overbrace{\xi} &\equiv \bigcup_{x \in \xi}(x) \tag{12.2}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-accumulated" class="gk-wrap">$\xi$</span> | xi | the accumulated history: the packages accumulated in each of the last E slots |
| <span id="gk-Cepochlen" class="gk-wrap">$\mathsf{E}$</span> | E | an epoch's length in slots: 600 on full, 12 on tiny |
| <span id="gk-protoset">$\left\{\mkern-5mu\left[\,x\,\right]\mkern-5mu\right\}$</span> | the set of | a set written in order: no repeats, kept sorted |
| <span id="gk-hash">$\mathbb{H}$</span> | H | a 32-byte value, usually a hash |
| <span id="gk-accumulatedcup" class="gk-wrap">$\overbrace{\xi}$</span> | all of xi | every work-package hash in the history ξ, its E sets joined into one: what was accumulated in the last epoch |
| <span id="gk-bigcup">$\bigcup$</span> | the union over | everything in any of the sets it ranges over, together |

</details>

:::

::: gray-paper-eq 12.3

<a id="ex-12-3"></a>The Gray Paper's (12.3), [in its place in the paper's words](./02-waiting-reports.md#eq-12-3):

$$
\begin{align}
\omega &\in \left[\!\left[\left[\!\left[\!\left\lgroup\mathbb{R}, \left\{\mkern-5mu\left[\,\mathbb{H}_{}\,\right]\mkern-5mu\right\}\right\rgroup\!\right]\!\right]_{}\right]\!\right]_{\mathsf{E}} \tag{12.3}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-ready" class="gk-wrap">$\omega$</span> | omega | the ready queue: available reports waiting on others before they can accumulate |
| <span id="gk-workreport" class="gk-wrap">$\mathbb{R}$</span> | R | the set of work-reports: a core's signed receipt for one work-package |

</details>

:::

**Read it aloud.** "Xi is a sequence of E sets of hashes. Xi union is defined as the union
of every x in xi. Omega is a sequence of E sequences of pairs: a work-report and a set of
hashes."

**In plain words.** Two pieces of state, both one epoch long:

- **ξ, the history.** One set of work-package hashes for each of the last E blocks: what
  each accumulated. ξ with a brace over it, *ξ union*, is all of them in one set: "has this
  package been accumulated lately?"
- **ω, the ready queue.** One list for each slot of an epoch, used as a ring. Each entry
  is a report that is ready but waits, with the set of packages it still waits for.

**On a real value.** `enqueue_and_unlock_chain-4`, before its block at slot 47:

```text
ξ[0..10]   {}  (eleven empty sets)
ξ[11]      {a7a6, f598}                     the newest block's accumulated packages
ξ∪         {a7a6, f598}                     all twelve sets joined
ω[7]       [(7749, {38b7}), (d54f, {1817, 6af0})]
ω[8]       [(6af0, {7749})]
ω[10]      [(1817, {38b7})]
ω, else    []
```

**In your client.** `accumulated` and `ready` in the `AccumulationState`, with `Waiting`
for an entry, in [17.2's code](./02-waiting-reports.md#the-code).

## (12.4) to (12.6): go now, or wait

::: gray-paper-eq 12.4

<a id="ex-12-4"></a>The Gray Paper's (12.4), (12.5), (12.6), [in its place in the paper's words](./02-waiting-reports.md#eq-12-4):

$$
\begin{align}
\mathbf{R}^! &\equiv \left[r \;\middle\vert\; r \mathrel{\unicode{x2B40}} \mathbf{R}, \left\vert(r_{\mathbf{c}})_{\mathbf{p}}\right\vert = 0 \wedge r_{\mathbf{l}} = \left\{\right\}\right] \tag{12.4} \\
\mathbf{R}^Q &\equiv E(\left[
D(r) \mid
r \mathrel{\unicode{x2B40}} \mathbf{R},
\left\vert(r_{\mathbf{c}})_{\mathbf{p}}\right\vert > 0 \vee r_{\mathbf{l}} \ne \left\{\right\}
\right], \overbrace{\xi})\!\!\!\! \tag{12.5} \\
D(r) &\equiv (r, \left\{\,(r_{\mathbf{c}})_{\mathbf{p}}\,\right\} \cup \mathcal{K}\left(r_{\mathbf{l}}\right)) \tag{12.6}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-justbecameavailable" class="gk-wrap">$\mathbf{R}$</span> | R | the reports this block made available: ready to accumulate |
| <span id="gk-sq">[$\left[x\right]$](../symbols.md#sequence)</span> | the sequence | a sequence written out item by item; [ ] is the empty one |
| <span id="gk-build">$\left\{ x \;\middle\vert\; y \right\}$</span> | for each, such that | built by a rule: the left-hand value, for every case the right-hand side allows (a set, or a sequence in order) |
| <span id="gk-orderedin">$\mathrel{\unicode{x2B40}}$</span> | in order, from | each item of the sequence, in its order |
| <span id="gk-len">$\left\vert x\right\vert$</span> | the size of | \|x\|: how many items x has, or how many bytes |
| <span id="gk-wr-context" class="gk-wrap">$\mathbf{c}$</span> | c | a report's refinement context: the blocks its package was built against, and its prerequisites |
| <span id="gk-wc-prerequisites" class="gk-wrap">$\mathbf{p}$</span> | p | a context's prerequisites: hashes of packages that must be accumulated first |
| <span id="gk-wedge">$\wedge$</span> | and | both sides are true |
| <span id="gk-wr-srlookup" class="gk-wrap">$\mathbf{l}$</span> | l | the segment-root lookup: for each package whose exports it imports by package hash, that package's segments root |
| <span id="gk-emset">$\left\{\right\}$</span> | the empty set | a set, or a dictionary, with nothing in it |
| <span id="gk-mid">$\mid$</span> | such that | in a sequence built from a rule: the items on the left, for every choice on the right |
| <span id="gk-vee">$\vee$</span> | or | at least one side is true |
| <span id="gk-ne">$\ne$</span> | is not | not equal |
| <span id="gk-set">$\left\{\,x\,\right\}$</span> | the set of | a set: values with no order and no repeats |
| <span id="gk-cup">$\cup$</span> | union | everything in either side |
| <span id="gk-keys">$\mathcal{K}\left(x\right)$</span> | K of | a dictionary's keys |

</details>

:::

**Read it aloud.** "R bang is the sequence of r, for r in order from R, such that the size
of r's context's prerequisites is zero and r's segment-root lookup is empty. R Q is E of:
the sequence of D of r, for r in order from R, such that the size of its prerequisites is
above zero or its segment-root lookup isn't empty; and xi union. D of r is the pair: r, and
the set of its prerequisites joined with the keys of its segment-root lookup."

**In plain words.** The block's newly available reports 𝐑 split in two, keeping their
order.

- A report that waits for nothing goes straight into 𝐑!, to accumulate now.
- A report with a prerequisite, or a segment-root lookup naming another package, is a
  waiter. D pairs it with every package it depends on. E (below) strikes off any the
  history ξ∪ says are done.

The waiters are 𝐑^Q.

**On a real value.** `enqueue_and_unlock_chain-3`, slot 46, brings two reports, and the
history is empty:

```text
𝐑         [1817 (prerequisite 38b7), a7a6 (none)]
𝐑!        [a7a6]                          no prerequisites, no lookups
D(1817)   (1817, {38b7})
𝐑^Q       E([(1817, {38b7})], {})         ξ∪ is empty: nothing to strike off
          = [(1817, {38b7})]
```

**In your client.** `now`, `fresh` and `queued` in `accumulateBlock`, [17.2's
code](./02-waiting-reports.md#the-code).

## (12.7) to (12.9): E, Q and P, the queue's three helpers

::: gray-paper-eq 12.7

<a id="ex-12-7"></a>The Gray Paper's (12.7), [in its place in the paper's words](./02-waiting-reports.md#eq-12-7):

$$
\begin{equation}
E\colon\left\{ \begin{aligned}
&\!\left\lgroup\left[\!\left[\!\left\lgroup\mathbb{R}, \left\{\mkern-5mu\left[\,\mathbb{H}_{}\,\right]\mkern-5mu\right\}\right\rgroup\!\right]\!\right]_{}, \left\{\mkern-5mu\left[\,\mathbb{H}_{}\,\right]\mkern-5mu\right\}\right\rgroup\! \to \left[\!\left[\!\left\lgroup\mathbb{R}, \left\{\mkern-5mu\left[\,\mathbb{H}_{}\,\right]\mkern-5mu\right\}\right\rgroup\!\right]\!\right]_{} \\
&\left(\mathbf{r}, \mathbf{x}\right) \mapsto \left[
\left(r, \mathbf{d} \setminus \mathbf{x}\right)
\;\middle\vert\;
\begin{aligned}
&\left(r, \mathbf{d}\right) \mathrel{\unicode{x2B40}} \mathbf{r} ,\\
&(r_{\mathbf{s}})_{p} \not\in \mathbf{x}
\end{aligned}
\right]
\end{aligned} \right. \tag{12.7}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-abracegroup">$\left\{ \begin{aligned}x\end{aligned} \right.$</span> | as follows | a brace grouping lines that hold together: for a function, its type on top, then what each input becomes |
| <span id="gk-to">[$\to$](../symbols.md#to)</span> | to | what goes in, to what comes out: A → B takes an A and gives a B |
| <span id="gk-mapsto">$\mapsto$</span> | maps to | what a function gives back for an input: x ↦ y says x becomes y |
| <span id="gk-setminus">$\setminus$</span> | without | the left side with every item of the right taken out |
| <span id="gk-wr-avspec" class="gk-wrap">$\mathbf{s}$</span> | bold s | a report's availability spec: the package's hash, its bundle's length, and the roots of its pieces and of the segments it exports |
| <span id="gk-as-packagehash">$p$</span> | p | the work-package's hash |

</details>

:::

::: gray-paper-eq 12.8

<a id="ex-12-8"></a>The Gray Paper's (12.8), [in its place in the paper's words](./02-waiting-reports.md#eq-12-8):

$$
\begin{equation}
Q\colon\left\{ \begin{aligned}
&\left[\!\left[\!\left\lgroup\mathbb{R}, \left\{\mkern-5mu\left[\,\mathbb{H}_{}\,\right]\mkern-5mu\right\}\right\rgroup\!\right]\!\right]_{} \to \left[\!\left[\mathbb{R}\right]\!\right]_{} \\
&\mathbf{r} \mapsto \begin{cases}
\left[\right] &\text{if } \mathbf{g} = \left[\right] \\
\mathbf{g} \frown Q(E(\mathbf{r}, P(\mathbf{g})))\!\!\!\! &\text{otherwise} \\
\, \text{where } \mathbf{g} = \left[r \;\middle\vert\; \left(r, \left\{\right\}\right) \mathrel{\unicode{x2B40}} \mathbf{r}\right]
\end{cases}
\end{aligned} \right. \tag{12.8}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-workreports">$\left[\!\left[\mathbb{R}\right]\!\right]$</span> | a sequence of work-reports | a list of work-reports, in order |
| <span id="gk-concat" class="gk-wrap">[$\frown$](../symbols.md#concat)</span> | concatenate | join: the left sequence followed by the right |
| <span id="gk-local-fnsrmap">$P$</span> | P | the package hashes of some reports: P(𝐫) is the set of each report's work-package hash |

</details>

:::

::: gray-paper-eq 12.9

<a id="ex-12-9"></a>The Gray Paper's (12.9), [in its place in the paper's words](./02-waiting-reports.md#eq-12-9):

$$
\begin{equation}
P\colon\left\{ \begin{aligned}
\left\{\mkern-5mu\left[\,\mathbb{R}\,\right]\mkern-5mu\right\} &\to \left\{\mkern-5mu\left[\,\mathbb{H}_{}\,\right]\mkern-5mu\right\}\\
\mathbf{r} &\mapsto \left\{\,
(r_{\mathbf{s}})_{p} \;\middle\vert\; r \in \mathbf{r}
\,\right\}
\end{aligned} \right. \tag{12.9}
\end{equation}
$$

:::

**Read it aloud.** "E maps a queue r and a set of hashes x to: the sequence of pairs r,
d without x, for each pair r, d in order from the queue, whose report's package hash is not
in x. Q maps a queue r to: the empty sequence when g is empty; otherwise g followed by Q of
E of r and P of g, where g is every report r whose pair r, empty set is in the queue, in
order. P maps a set of reports to the set of their package hashes."

**In plain words.** Three small tools:

- **E, edit.** Given the packages now done, take every done report out of the queue, and
  take the done packages out of what the rest wait for.
- **Q, unlock.** Take, in order, every report that waits for nothing. Those are now done,
  so E the rest with their packages, and go again, until nothing more is free.
- **P, package hashes.** From some reports, the set of their work-package hashes.

**On a real value.** `enqueue_and_unlock_chain-4`, slot 47. Its one new report is `38b7`,
and the queue read round the ring (next section) is four waiters. E strikes `38b7` off.
Then Q unlocks in three passes:

```text
queue           [(7749, {38b7}), (d54f, {1817, 6af0}), (6af0, {7749}), (1817, {38b7})]
E(…, {38b7})    [(7749, {}),     (d54f, {1817, 6af0}), (6af0, {7749}), (1817, {})]
Q pass 1        g = [7749, 1817]; E with P(g) = {7749, 1817}: [(d54f, {6af0}), (6af0, {})]
Q pass 2        g = [6af0];       E with {6af0}:              [(d54f, {})]
Q pass 3        g = [d54f];       E with {d54f}:              []
Q pass 4        g = []: stop
Q(…)            [7749, 1817, 6af0, d54f]
```

**In your client.** `edit` (E), `unlock` (Q) and `packageOf` (P, one report at a time), in
[17.2's code](./02-waiting-reports.md#the-code).

## (12.10) to (12.12): this block's reports, 𝐑\*

::: gray-paper-eq 12.10

<a id="ex-12-10"></a>The Gray Paper's (12.10), (12.11), (12.12), [in its place in the paper's words](./02-waiting-reports.md#eq-12-10):

$$
\begin{align}
\text{let } m &= \mathbf{H}_{T} \bmod \mathsf{E} \tag{12.10} \\
\mathbf{R}^* &\equiv \mathbf{R}^! \frown Q(\mathbf{q}) \tag{12.11} \\
\quad \text{where } \mathbf{q} &= E(\overparen{\omega_{m \dots }} \frown \overparen{\omega_{ \dots m}} \frown \mathbf{R}^Q, P(\mathbf{R}^!)) \tag{12.12}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-H" class="gk-wrap">$\mathbf{H}$</span> | H | this block's header; 𝐇_T is its timeslot, 𝐇_P its parent's hash |
| <span id="gk--timeslot">$T$</span> | T | a header's timeslot: 𝐇_T is the slot this block was made for |
| <span id="gk-bmod">[$\bmod$](../symbols.md#mod)</span> | mod | the remainder after dividing: 14 mod 4 is 2 |
| <span id="gk-concatall">$\overparen{x}$</span> | all joined | every sequence in it, joined end to end into one |
| <span id="gk-interval">$_{x \dots y}$</span> | from x to y | the items from index x up to, not including, y |

</details>

:::

**Read it aloud.** "Let m be the header's timeslot mod E. R star is defined as R bang
followed by Q of q, where q is E of: omega from m on, all joined, followed by omega before
m, all joined, followed by R Q; and P of R bang."

**In plain words.** Everything that accumulates in this block, in order: first the reports
that wait for nothing, then whatever the queue can now let go. The queue is read round the
ring starting at this block's slot m, so the oldest waiters come first. The new waiters
𝐑^Q come at the end. Before unlocking, the packages in 𝐑! are struck off, since they are
about to be done.

**On a real value.** `enqueue_and_unlock_chain-4` again, slot 47:

```text
m          47 mod 12 = 11
ω[11..]    ω[11] = []
ω[..11]    ω[0] to ω[10]: (7749, {38b7}), (d54f, {1817, 6af0}), (6af0, {7749}), (1817, {38b7})
𝐑^Q        []                       the new report waits for nothing
𝐑!         [38b7]
q          E(those four, P(𝐑!) = {38b7})
Q(q)       [7749, 1817, 6af0, d54f]  worked above
𝐑*         [38b7, 7749, 1817, 6af0, d54f]
```

Five reports, all for service 1729: the vector's statistics give it 5 digests.

**In your client.** The `ring` and `all` lines of `accumulateBlock`, [17.2's
code](./02-waiting-reports.md#the-code).

## (12.13) and (12.14): an operand and a transfer

::: gray-paper-eq 12.13

<a id="ex-12-13"></a>The Gray Paper's (12.13), (12.14), [in its place in the paper's words](./03-sending-a-transfer.md#eq-12-13):

$$
\begin{align}
\mathbb{U} &\equiv \!\left\lgroup
\begin{alignedat}{5}
p&\in \mathbb{H}_{},\;
&e&\in \mathbb{H}_{},\;
&a&\in \mathbb{H}_{},\;
y\in \mathbb{H}_{},\;\\
g&\in \mathbb{N}_G,\;
&\mathbf{t}&\in \mathbb{B}_{},\;
&\mathbf{l}&\in \mathbb{B}_{} \cup \mathbb{E}
\end{alignedat}
\right\rgroup\! \tag{12.13} \\
\mathbb{X} &\equiv \!\left\lgroup
s\in \mathbb{N}_S ,
d\in \mathbb{N}_S ,
a\in \mathbb{N}_B ,
m\in \mathbb{B}_{\mathsf{W}_T} ,
g\in \mathbb{N}_G
\right\rgroup\! \tag{12.14}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-operandtuple" class="gk-wrap">$\mathbb{U}$</span> | U | an operand: what accumulate is told about one work-digest: package hash, exports root, authorizer, payload hash, gas, trace and result |
| <span id="gk-isa">[$x\in y$](../symbols.md#in)</span> | in | belongs to: the field's type |
| <span id="gk-ot-segroot">$e$</span> | e | the operand's exports root: the root of the segments its package exported |
| <span id="gk-ot-authorizer">$a$</span> | a | the authorizer hash of the report the digest came from |
| <span id="gk-ot-payloadhash">$y$</span> | y | the hash of the work-item's payload |
| <span id="gk-ot-gaslimit">$g$</span> | g | the gas the digest asked for, to accumulate it |
| <span id="gk-ot-authtrace" class="gk-wrap">$\mathbf{t}$</span> | t | the authorizer's trace: the blob its code gave back when it said yes |
| <span id="gk-blob">[$\mathbb{B}$](../symbols.md#blobs)</span> | B, or B sub n | bytes: any run of them; 𝔹ₙ exactly n of them |
| <span id="gk-workerror" class="gk-wrap">$\mathbb{E}$</span> | E | the set of work errors: out of gas, panic, bad exports, oversize, BAD (no code) and BIG (code too big) |
| <span id="gk-defxfer" class="gk-wrap">$\mathbb{X}$</span> | X | a deferred transfer: (source, destination, amount, memo, gas), the money moved now, the receiver run in the next round |
| <span id="gk-dx-source">$s$</span> | s | a transfer's sender: the service it comes from |
| <span id="gk-dx-dest">$d$</span> | d | a transfer's receiver: the service it goes to |
| <span id="gk-balance" class="gk-wrap">$\mathbb{N}_B$</span> | N sub B | a balance: a u64 |
| <span id="gk-dx-memo">$m$</span> | m | a transfer's memo: 128 bytes the sender writes for the receiver's code |
| <span id="gk-memo" class="gk-wrap">$\mathbb{B}_{\mathsf{W}_T}$</span> | a blob of W sub T bytes | exactly 128 bytes |

</details>

:::

**Read it aloud.** "U is defined as the tuple of: p, a hash; e, a hash; a, a hash; y, a
hash; g, gas; t, a blob; and l, a blob or a work error. X is defined as the tuple of: s, a
service id; d, a service id; a, a balance; m, a memo; and g, gas."

**In plain words.** The two kinds of input a service's accumulate can get.

An *operand* 𝕌 is what it learns about one of its digests:

- p, the package's hash;
- e, its exports root;
- a, its authorizer;
- y, the item's payload hash;
- g, the digest's gas;
- t, the authorizer's trace;
- l, refine's result, which may be an error.

A *transfer* 𝕏 is money with a note: from s, to d, amount a, a 128-byte memo m, and gas g
that the sender pays for the receiver's run.

**On a real value.** `transfer_for_live_service-1`, slot 43. Service 0's one digest
becomes this operand, and its run sends service 1 one transfer:

```text
p   7749 35b6…        the package's hash
e   e1bb 8e99…        its exports root
a   ddd6 1398…        the report's authorizer
y   9a00 110a…        the work-item's payload hash
g   400,000           the digest's accumulate gas
t   (empty)           this authorizer's trace is 0 bytes
l   ok: 0102 0100 …   refine's result, a blob

s 0, d 1, a 100, m "gift" and 124 zero bytes, g 80,000
```

**In your client.** The `Operand` codec of [16.7](../16-host-calls/07-a-services-inputs.md#the-code)
and the `Transfer` record of [17.3](./03-sending-a-transfer.md#the-code).

## (12.15): the partial state

::: gray-paper-eq 12.15

<a id="ex-12-15"></a>The Gray Paper's (12.15), [in its place in the paper's words](./05-privileges.md#eq-12-15):

$$
\begin{equation}
\mathbb{S} \equiv \!\left\lgroup\begin{aligned}
&\mathbf{d}\in \left\langle\!\left\vert \mathbb{N}_S\to\mathbb{A}\right\vert\!\right\rangle \,,\;
\mathbf{i}\in \left[\!\left[\mathbb{K}\right]\!\right]_{\mathbb{V}} \,,\;
\mathbf{q}\in \left[\!\left[\left[\!\left[\mathbb{H}_{}\right]\!\right]_{\mathsf{Q}}\right]\!\right]_{\mathsf{C}} \,,\;
m\in \mathbb{N}_S \,,\\
&\mathbf{a}\in \left[\!\left[\mathbb{N}_S\right]\!\right]_{\mathsf{C}} \,,\;
v\in \mathbb{N}_S \,,\;
r\in \mathbb{N}_S \,,\;
\mathbf{z}\in \left\langle\!\left\vert \mathbb{N}_S\to\mathbb{N}_G\right\vert\!\right\rangle
\end{aligned}\right\rgroup\! \tag{12.15}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-partialstate" class="gk-wrap">$\mathbb{S}$</span> | S | a partial state: the parts of the state accumulation may change: accounts, next validators, authorizer queues and the privileges |
| <span id="gk-ps-accounts" class="gk-wrap">$\mathbf{d}$</span> | d | a partial state's service accounts, by service id |
| <span id="gk-serviceaccount" class="gk-wrap">$\mathbb{A}$</span> | A | a service account: three dictionaries (storage, preimages, requests) and eight plain fields |
| <span id="gk-ps-stagingset" class="gk-wrap">$\mathbf{i}$</span> | i | a partial state's next validators' keys, ι |
| <span id="gk-allvalkeys">$\left[\!\left[\mathbb{K}\right]\!\right]_{\mathbb{V}}$</span> | a sequence of K, of a size in V | a validator set: a 336-byte key set for each validator; 6 on tiny, 1,023 on full |
| <span id="gk-ps-authqueue" class="gk-wrap">$\mathbf{q}$</span> | q | a partial state's authorizer queues, ϕ: 80 hashes for each core |
| <span id="gk-Cauthqueuesize" class="gk-wrap">$\mathsf{Q}$</span> | Q | how many authorizers a core's queue holds: 80 |
| <span id="gk-ps-assigners" class="gk-wrap">$\mathbf{a}$</span> | a | each core's assigner service id, χ_A |
| <span id="gk-ps-delegator">$v$</span> | v | the delegator service's id, χ_V: it sets the next validators |
| <span id="gk-ps-registrar">$r$</span> | r | the registrar service's id, χ_R: it may create services at small ids |
| <span id="gk-ps-alwaysaccers" class="gk-wrap">$\mathbf{z}$</span> | z | the always-accumulate services with their free gas, χ_Z |

</details>

:::

**Read it aloud.** "S is defined as the tuple of: d, a dictionary from service id to
account; i, the validators' keys; q, a sequence of C sequences of Q hashes; m, a service
id; a, a sequence of C service ids; v, a service id; r, a service id; and z, a dictionary
from service id to gas."

**In plain words.** Everything accumulation may change, in one record:

- the accounts;
- the next validators' keys ι;
- the authorizer queues ϕ (C cores, Q = 80 hashes each);
- the five privileges of (9.9).

Accumulation never touches the rest of the state. Every run gets one, 𝐞, and gives one
back.

**On a real value.** `transfer_for_live_service-1`, before the block:

```text
𝐝   {0, 1, 1729}              three accounts
𝐢   the next validators' keys  not in the accumulate vectors: 6 keysets on tiny
𝐪   2 queues of 80 hashes      not in the accumulate vectors either
m   0;  𝐚 [0, 0];  v 0;  r 0;  𝐳 {}
```

**In your client.** No one type: a run's accounts, in its `Accumulation`, and its
`Privileged` (privileges, queues, then `free` and `staging`), in [17.5](./05-privileges.md#the-code)
and [17.13](./13-blessing-and-designating.md#the-code).

## (12.16): yields and gas

::: gray-paper-eq 12.16

<a id="ex-12-16"></a>The Gray Paper's (12.16), [in its place in the paper's words](./11-what-a-service-yields.md#eq-12-16):

$$
\begin{equation}
B \equiv \left\{\mkern-5mu\left[\,\!\left\lgroup\mathbb{N}_S, \mathbb{H}_{}\right\rgroup\!\,\right]\mkern-5mu\right\} \qquad
U \equiv \left[\!\left[\!\left\lgroup\mathbb{N}_S, \mathbb{N}_G\right\rgroup\!\right]\!\right]_{} \tag{12.16}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-local-fnservouts">$B$</span> | B | the yields: a set of pairs (service, 32-byte hash) |
| <span id="gk-local-fngasused">$U$</span> | U | the gas used: a list of pairs (service, gas), one per run |

</details>

:::

**Read it aloud.** "B is defined as a set of pairs: a service id and a hash. U is defined
as a sequence of pairs: a service id and gas."

**In plain words.** Two shapes a round hands back. 𝐁 holds the *yields*: which service
handed the chain which 32-byte hash. It is a set, so a pair counts once and has no order.
𝐔 holds the gas each run used, one pair per run, in order.

**On a real value.** `work_for_ejected_service-3`, slot 45: services 1 and 2 run in one
round, and service 1 yields.

```text
𝐛   {(1, b8fe 9f7f…)}           service 2 yields nothing
𝐮   [(1, 183,402), (2, 0)]      service 2 was ejected: no account, nothing runs
```

**In your client.** `AccumulationOutput`, a pair of 𝐛, in [17.11](./11-what-a-service-yields.md#the-code).
The round's `used` map is 𝐮.

## (12.17): Δ+, round after round

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

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-accseq" class="gk-wrap">$\Delta_+$</span> | Delta plus | the outer accumulation: rounds of Δ\*, each taking the reports that fit the gas left, until no reports fit and no transfers wait |
| <span id="gk-defxfers">$\left[\!\left[\mathbb{X}\right]\!\right]$</span> | a sequence of transfers | a list of deferred transfers, in order |
| <span id="gk-N" class="gk-wrap">[$\mathbb{N}$](../symbols.md#naturals)</span> | N | the whole numbers: 0, 1, 2 and up; a subscript is a bound, ℕ₈ is 0 to 7 |
| <span id="gk-psX" class="gk-wrap">$\mathbf{e}$</span> | e | a partial state: the accounts, next validators, queues and privileges a run works on |
| <span id="gk-dagger">$\dagger$</span> | dagger | a mark making a new name from an old one: δ† is δ partway through the block, 𝐭† another list of transfers |
| <span id="gk-max">$\max$</span> | max of | the largest of the values in the brackets |
| <span id="gk-Nmax">[$\mathbb{N}_{x}$](../symbols.md#naturals)</span> | N sub n | the whole numbers below n: ℕ_C is a core index, 0 to C − 1 |
| <span id="gk-sum">$\sum$</span> | the sum of | add up what follows, once for each value the subscript ranges over |
| <span id="gk-values">$\mathcal{V}\left(x\right)$</span> | V of | a dictionary's (or sequence's) values |
| <span id="gk-le">$\le$</span> | at most | less than or equal to |
| <span id="gk-accpar" class="gk-wrap">$\Delta_*$</span> | Delta star | one round of accumulation: every service with work runs once, all from the same state, and their results are merged |

</details>

:::

**Read it aloud.** "Delta plus maps a gas limit, a sequence of transfers, a sequence of
work-reports, a partial state and a dictionary from service id to gas, to: a number, a
partial state, a B and a U, and a sequence of transfers. Given g, t, r, e and f: when n is
zero, the tuple zero, e, the empty set, the empty sequence, the empty sequence. Otherwise:
i plus j; e prime; b star union b; u star followed by u; t followed by t dagger. Where i is
the largest number up to the count of r, such that the gas of every digest in the first i
reports, plus the gas of every transfer, plus all the free gas, is at most g; n is i plus
the number of transfers plus the number of free services; e star, t star, b star, u star
are Delta star of e, t, the first i reports, and f; j, e prime, b, u, t dagger are Delta
plus of g star, t star, the reports after i, e star and no free services; and g star is g
plus the new transfers' gas, minus the gas used."

**In plain words.** A recursion, one level per round:

1. **Take what fits.** As many reports as fit the gas g, counting the transfers' gas and
   the free gas first. That many is i.
2. **Nothing to do?** No reports fit, no transfers, no free services: n = 0, stop.
3. **One round.** Δ\* on those i reports, the transfers and the free services.
4. **Again.** Δ+ on the reports left over, with the transfers this round sent, no free
   services (they ran once), and the gas left: g plus the new transfers' gas, minus what
   the round used.
5. **Add it up.** Reports accumulated i + j, the yields of every round joined, the gas of
   every round in order, and every transfer delivered.

**On a real value.** `recreate_service_ejected_in_earlier_round-1`, slot 43: two reports,
the first asking for the whole budget.

```text
g = 20,000,000;  𝐭 = [];  𝐟 = {}
𝐫     [r1: 19,800,000 + 200,000;  r2: 2,000,000]
i     first 1: 20,000,000 ≤ g;  first 2: 22,000,000 > g        so i = 1
n     1 + 0 + 0 = 1                                             not 0: a round
Δ*    r1: service 0 uses 151,611, ejecting service 2; service 2 uses 0; no transfers
g*    20,000,000 + 0 − 151,611 = 19,848,389
Δ+    g*, [], [r2]: i = 1, r2 fits; service 0 uses 203,009, making a new service 2
Δ+    then nothing left: n = 0, stop
out   i + j = 1 + 1 = 2 reports;  𝐮 = [(0, 151,611), (2, 0), (0, 203,009)]
```

**In your client.** The loop of `accumulateBlock`, with `fit`, `budget` and `todo`, in
[17.9's code](./09-the-blocks-gas-budget.md#the-code).

## (12.18) and (12.19): Δ\*, one round, and R

::: gray-paper-eq 12.18

<a id="ex-12-18"></a>The Gray Paper's (12.18), [in its place in the paper's words](./01-a-blocks-accumulation.md#eq-12-18):

$$
\begin{equation}
\Delta_*\colon\left\{ \;\begin{aligned}\begin{aligned}
&\!\left\lgroup\mathbb{S}, \left[\!\left[\mathbb{X}\right]\!\right]_{}, \left[\!\left[\mathbb{R}\right]\!\right]_{}, \left\langle\!\left\vert \mathbb{N}_S\to\mathbb{N}_G\right\vert\!\right\rangle\right\rgroup\! \to \!\left\lgroup\mathbb{S}, \left[\!\left[\mathbb{X}\right]\!\right]_{}, B, U\right\rgroup\! \\
&\left(\mathbf{e}, \mathbf{t}, \mathbf{r}, \mathbf{f}\right) \mapsto \left(
\left(
\mathbf{d}', \mathbf{i}', \mathbf{q}', m', \mathbf{a}', v', r', \mathbf{z}'
\right), \overparen{\mathbf{t}'}, \mathbf{b}, \mathbf{u}
\right)\!\!\!\!\!\!\\
&\text{where:}\\
&\ \begin{aligned}
\text{let } \mathbf{s} &= \left\{\,
d_{s}
\;\middle\vert\;
r \in \mathbf{r}, d \in r_{\mathbf{d}}
\,\right\} \cup \mathcal{K}\left(\mathbf{f}\right) \cup \left\{\,t_{d} \;\middle\vert\; t \in \mathbf{t}\,\right\} \\
\Delta(s) &\equiv \Delta_1(\mathbf{e}, \mathbf{t}, \mathbf{r}, \mathbf{f}, s) \\
\mathbf{u} &= \left[
\left(s, \Delta(s)_{u}\right)
\;\middle\vert\;
s \mathrel{\unicode{x2B40}} \mathbf{s}
\right] \\
\mathbf{b} &= \left\{\,
\left(s, b\right)
\;\middle\vert\;
s \in \mathbf{s},\,
b = \Delta(s)_{y},\,
b \ne \emptyset
\,\right\} \\
\mathbf{t}' &= \left[
\Delta(s)_{\mathbf{t}}
\;\middle\vert\;
s \mathrel{\unicode{x2B40}} \mathbf{s}
\right] \\
\mathbf{d}' &= I(
(\mathbf{d} \cup \mathbf{n}) \setminus \mathbf{m},
\bigcup_{s \in \mathbf{s}} \Delta(s)_{\mathbf{p}}
) \\
&\left(
\mathbf{d}, \mathbf{i}, \mathbf{q}, m, \mathbf{a}, v, r, \mathbf{z}
\right) = \mathbf{e} \\
\mathbf{e}^* &= \Delta(m)_{\mathbf{e}} \\
\left(m'\!,\mathbf{z}'\right) &=
\mathbf{e}^*_{\left(m, \mathbf{z}\right)} \\
\forall c \in \mathbb{N}_{\mathsf{C}} :
\mathbf{a}'_{c} &= R(
\mathbf{a}_{c},
(\mathbf{e}^*_{\mathbf{a}})_{c},
((\Delta(\mathbf{a}_{c})_{\mathbf{e}})_{\mathbf{a}})_{c}
) \\
v' &= R(
v,
\mathbf{e}^*_{v},
(\Delta(v)_{\mathbf{e}})_{v}
) \\
r' &= R(
r,
\mathbf{e}^*_{r},
(\Delta(r)_{\mathbf{e}})_{r}
) \\
\mathbf{i}' &= (
\Delta(v)_{\mathbf{e}}
)_{\mathbf{i}} \\
\forall c \in \mathbb{N}_{\mathsf{C}} :
\mathbf{q}'_{c} &= ((
\Delta(\mathbf{a}_{c})_{\mathbf{e}}
)_{\mathbf{q}})_{c} \\
\mathbf{n} &= \bigcup_{s \in \mathbf{s}}(
(\Delta(s)_{\mathbf{e}})_{\mathbf{d}}
\setminus
\mathcal{K}\left(\mathbf{d} \setminus \left\{\,s\,\right\}\right)
) \\
\mathbf{m} &= \bigcup_{s \in \mathbf{s}}(
\mathcal{K}\left(\mathbf{d}\right)
\setminus
\mathcal{K}\left((\Delta(s)_{\mathbf{e}})_{\mathbf{d}}\right)
)
\end{aligned}
\end{aligned}\end{aligned} \right. \tag{12.18}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-local-acc" class="gk-wrap">$\Delta$</span> | Delta | inside Δ\*: Δ(s) is service s's run in this round, Δ₁ with the round's inputs |
| <span id="gk-accone" class="gk-wrap">$\Delta_1$</span> | Delta one | one service's accumulation: adds up its gas, lines up its inputs, transfers first, and runs its code with Ψ_A |
| <span id="gk-ao-gasused">$u$</span> | u | the gas a run used |
| <span id="gk-none" class="gk-wrap">$\emptyset$</span> | nothing | ∅: no value at all, like null |
| <span id="gk-local-fnprovide">$I$</span> | I | preimage integration: files each provided blob in its service, if that service still waits for it |
| <span id="gk-local-manpost" class="gk-wrap">$\mathbf{e}^*$</span> | e star | the state the manager's run left behind |
| <span id="gk-forall">$\forall$</span> | for all | for every value: ∀c ∈ ℕ_C means for each core c |
| <span id="gk-coreindex" class="gk-wrap">$\mathbb{N}_{\mathsf{C}}$</span> | N sub C | the core indices: 0 to C − 1 |

</details>

:::

::: gray-paper-eq 12.19

<a id="ex-12-19"></a>The Gray Paper's (12.19), [in its place in the paper's words](./06-who-wins.md#eq-12-19):

$$
\begin{equation}
R(o, a, b) \equiv \begin{cases}
b &\text{if } a = o \\
a &\text{otherwise}
\end{cases} \tag{12.19}
\end{equation}
$$

:::

**Read it aloud.** "Delta star maps a partial state, transfers, work-reports and free
services to: a partial state, transfers, a B and a U. Given e, t, r and f, it gives the
partial state d′, i′, q′, m′, a′, v′, r′, z′; all of t′ joined; b; and u. Where: s is the
service of every digest of every report, joined with the keys of f and the receiver of
every transfer; Delta of s is Delta one of e, t, r, f and s; u is each s in order with the
gas its run used; b is each s with its run's yield, where there is one; t′ is each run's
transfers, in order of s; d′ is I of d with n added and m removed, and every run's
provisions. The manager's new state e star is its own run's. m′ and z′ are what e star says.
For each core, a′ of c is R of: a of c, e star's a of c, and what core c's assigner's own
run left as a of c. v′ and r′ the same way. i′ is the delegator's run's i; each q′ of c is
core c's assigner's run's q of c. n is, over every s, the accounts its run left, without
those of every other service at the start; m is, over every s, the ids at the start that
its run's accounts no longer have. And R of o, a, b is b if a equals o, otherwise a."

**In plain words.** One round, built on top of one-service runs Δ(s):

1. **Who runs.** Every service with a digest, every free service, every service a transfer
   is for: 𝐬. Each runs once, from the *same* state 𝐞, never seeing the others.
2. **Collect.** 𝐮 the gas, 𝐛 the yields, 𝐭′ the transfers sent, by service id.
3. **Accounts.** Start from 𝐝. Add 𝐧: each run's own account as it left it, and any it
   created. Take out 𝐦: any id some run removed. Then I files the preimages provided.
4. **Privileges.** The manager's run decides the manager and the free services. Every
   other privilege goes through R: the manager's change wins; if it left that one alone,
   the holder's own run decides. The next validators come from the delegator's run, and
   each core's queue from its assigner's run.

Δ\* reaches across the whole part:

- [17.1](./01-a-blocks-accumulation.md) builds steps 1 and 2;
- [17.4](./04-rounds.md) adds the transfers;
- [17.6](./06-who-wins.md) and [17.13](./13-blessing-and-designating.md) add the privileges;
- [17.7](./07-ejecting-a-service.md) and [17.8](./08-creating-a-service.md) add 𝐦 and 𝐧;
- [17.12](./12-providing-a-preimage.md) adds I.

**On a real value.** `same_round_storage_isolation-1`, slot 43: two reports, one for 1729,
one for 1730.

```text
𝐬         {1729, 1730} ∪ {} ∪ {}         two digests' services; no free ones, no transfers
Δ(1729)   from 𝐞: uses 29,643, stores "last" = 033f de3d
Δ(1730)   from the same 𝐞: reads 1729's "last", not there yet; stores 00; uses 34,413
𝐮         [(1729, 29,643), (1730, 34,413)]
𝐛         {}                             neither yields
𝐭′        [] ⌢ [] = []                   neither sends a transfer
𝐧         {1729 ↦ as its run left it, 1730 ↦ as its run left it}
𝐦         {}                             nobody removed anyone
𝐝′        I((𝐝 ∪ 𝐧) \ {}, {}): both accounts as their runs left them
m′ … r′   0, [0, 0], 0, 0                 service 0 holds them all and has no account here
```

And R, on two real merges:

```text
bless_from_non_manager-1     delegator v = 1; the manager, 0, doesn't run: 𝐞*_v = 1
                             service 1's run sets v to 2
v′ = R(1, 1, 2)              a = o: the manager left it alone, so the holder's 2
assign_from_non_assigner-3   core 0's assigner is the manager, 0; its one run assigns 1
𝐚′[0] = R(0, 1, 1)           a ≠ o: the manager's 1
```

**In your client.** `accumulateRound` in `src/accumulate.ts`, rebuilt lesson by lesson
from [17.4's](./04-rounds.md#the-code) to [17.13's](./13-blessing-and-designating.md#the-code).
`R` and `mergePrivileges` are in [17.6's code](./06-who-wins.md#the-code).

## (12.20) and (12.21): I and Y, filing provided preimages

::: gray-paper-eq 12.20

<a id="ex-12-20"></a>The Gray Paper's (12.20), (12.21), [in its place in the paper's words](./12-providing-a-preimage.md#eq-12-20):

$$
\begin{align}
I &\colon\left\{ \begin{aligned}
&\!\left\lgroup\left\langle\!\left\vert \mathbb{N}_S\to\mathbb{A}\right\vert\!\right\rangle, \left\{\mkern-5mu\left[\,\!\left\lgroup\mathbb{N}_S, \mathbb{B}_{}\right\rgroup\!\,\right]\mkern-5mu\right\}\right\rgroup\! \to \left\langle\!\left\vert \mathbb{N}_S\to\mathbb{A}\right\vert\!\right\rangle \\
&\left(\mathbf{d}, \mathbf{p}\right) \mapsto \mathbf{d}'\; \text{where } \mathbf{d}' = \mathbf{d}\;\text{except:} \\
&\quad\forall \left(s, \mathbf{i}\right) \in \mathbf{p},\;
Y(\mathbf{d}, s, \mathbf{i}):\\
&\qquad \mathbf{d}'\left[s\right]_{\mathbf{l}}\left[\left(\mathcal{H}\left(\mathbf{i}\right), \left\vert\mathbf{i}\right\vert\right)\right] =\left[\tau'\right]\\
&\qquad \mathbf{d}'\left[s\right]_{\mathbf{p}}\left[\mathcal{H}\left(\mathbf{i}\right)\right] = \mathbf{i}
\end{aligned} \right. \tag{12.20} \\
Y &\colon\left\{ \begin{aligned}
&\!\left\lgroup\left\langle\!\left\vert \mathbb{N}_S\to\mathbb{A}\right\vert\!\right\rangle, \mathbb{N}_S, \mathbb{B}_{}\right\rgroup\! \to {\left\{\,\bot, \top\,\right\}} \\
&\left(\mathbf{d}, s, \mathbf{i}\right) \mapsto \begin{cases}
\mathbf{d}\left[s\right]_{\mathbf{l}}\left[\left(\mathcal{H}\left(\mathbf{i}\right), \left\vert\mathbf{i}\right\vert\right)\right] = \left[\right] &\text{if } s \in \mathcal{K}\left(\mathbf{d}\right) \\
\bot &\text{otherwise}
\end{cases}
\end{aligned} \right. \tag{12.21}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-local-fnprovidable">$Y$</span> | Y | is this blob still wanted? true if the service exists and its request for the blob's hash and length is [ ]: asked, not yet given |
| <span id="gk-blake">$\mathcal{H}\left(x\right)$</span> | H of | the Blake2b hash of what's in the brackets: 32 bytes |
| <span id="gk-thetime" class="gk-wrap">$\tau$</span> | tau | the time: the latest block's timeslot |
| <span id="gk-bool">${\left\{\,\bot, \top\,\right\}}$</span> | true or false | a yes-or-no value: true (⊤) or false (⊥) |
| <span id="gk-bot">$\bot$</span> | bottom | false, the no of a yes-or-no value |

</details>

:::

**Read it aloud.** "I maps a dictionary of accounts and a set of pairs, a service id and a
blob, to a dictionary of accounts: d and p give d′, where d′ is d except: for every pair s,
i in p for which Y of d, s, i holds, d′ of s's request for the hash of i and the length of
i is the sequence of tau prime, and d′ of s's preimage at the hash of i is i. Y maps
accounts, a service id and a blob to a boolean: d, s, i give whether d of s's request for
the hash and length of i is the empty sequence, when s is a key of d; otherwise false."

**In plain words.** Y asks "is this blob still wanted?" The service must exist, and its
request for exactly this hash and length must be `[]`: asked for and not yet given.

I files every wanted blob. The bytes go in the service's preimages under their hash, and
the request becomes `[τ′]`: provided in this block's slot. Anything unwanted is dropped
without fuss.

Δ\* calls I on the round's provisions. §12.4 calls it again on the block's preimages
extrinsic ([Part 14](../14-services/index.md)).

**On a real value.** `provide_preimage-2`, slot 44: service 0 provides 8 bytes to 1729.

```text
i                       70 72 65 69 6d 61 67 65     "preimage", 8 bytes
H(i)                    943e 3d42…                  its Blake2b-256
Y(𝐝, 1729, i)           1729 is in 𝐝; its request (943e…, 8) is []: true
𝐝′[1729].l[(943e…, 8)]  [44]                        provided at slot 44
𝐝′[1729].p[943e…]       "preimage"                  filed under its hash
```

**In your client.** `applyProvisions` in `src/accumulate.ts`, [17.12's
code](./12-providing-a-preimage.md#the-code).

## (12.22) and (12.23): Δ₁, one service's run

::: gray-paper-eq 12.22

<a id="ex-12-22"></a>The Gray Paper's (12.22), [in its place in the paper's words](./04-rounds.md#eq-12-22):

$$
\begin{equation}
\mathbb{O} \equiv \!\left\lgroup
\begin{alignedat}{3}
\mathbf{e}&\in \mathbb{S},\;
&\mathbf{t}&\in \left[\!\left[\mathbb{X}\right]\!\right]_{},\;
y\in \mathbb{H}_{}\boldsymbol{?},\;\\
u&\in \mathbb{N}_G,\;
&\mathbf{p}&\in \left\{\mkern-5mu\left[\,\!\left\lgroup\mathbb{N}_S, \mathbb{B}_{}\right\rgroup\!\,\right]\mkern-5mu\right\}
\end{alignedat}
\right\rgroup\! \tag{12.22}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-acconeout" class="gk-wrap">$\mathbb{O}$</span> | O | what one run gives back: its state 𝐞, transfers 𝐭, yield y, gas used u and provisions 𝐩 |
| <span id="gk-optional">$x\boldsymbol{?}$</span> | or nothing | a value of this type, or ∅ (null) |

</details>

:::

::: gray-paper-eq 12.23

<a id="ex-12-23"></a>The Gray Paper's (12.23), [in its place in the paper's words](./04-rounds.md#eq-12-23):

$$
\begin{align}
&\Delta_1 \colon \left\{ \;\begin{aligned}
&\begin{aligned}
\!\left\lgroup\begin{aligned}
&\mathbb{S}, \left[\!\left[\mathbb{X}\right]\!\right]_{}, \left[\!\left[\mathbb{R}\right]\!\right]_{},\\
&\left\langle\!\left\vert \mathbb{N}_S\to\mathbb{N}_G\right\vert\!\right\rangle, \mathbb{N}_S
\end{aligned}\right\rgroup\!
&\to \mathbb{O} \\
\left(\mathbf{e}, \mathbf{t}, \mathbf{r}, \mathbf{f}, s\right) &\mapsto \Psi_A(\mathbf{e}, \tau', s, g, \mathbf{i}^T \!\!\frown \mathbf{i}^U)
\end{aligned} \\
&\text{where:} \\
&\ \begin{aligned}
g &= \mathcal{U}\left(\mathbf{f}_{s}, 0\right)
+ \!\!\!\!\sum_{t \in \mathbf{t}, t_{d} = s}\!\!\!\!(t_{g})
+ \!\!\!\!\!\!\!\!\sum_{r \in \mathbf{r}, d \in r_{\mathbf{d}}, d_{s} = s}\!\!\!\!\!\!\!\!(d_{g}) \\
\mathbf{i}^T &= \left[
t
\;\middle\vert\;
t \mathrel{\unicode{x2B40}} \mathbf{t}, t_{d} = s
\right]\\
\mathbf{i}^U &= \left[
\left(\begin{alignedat}{3}
\mathbf{l}\mathrel{\unicode{x2AF6}} d_{\mathbf{l}},\,
g\mathrel{\unicode{x2AF6}} d_{g},\,
y\mathrel{\unicode{x2AF6}} d_{y},\,
&\mathbf{t}\;&\mathrel{\unicode{x2AF6}} r_{\mathbf{t}}&,\\
e\mathrel{\unicode{x2AF6}}(r_{\mathbf{s}})_{e},\,
p\mathrel{\unicode{x2AF6}}(r_{\mathbf{s}})_{p},\,
&a\;&\mathrel{\unicode{x2AF6}} r_{a}&
\end{alignedat}\right)
\;\middle\vert\;
\begin{alignedat}{2}
r& \mathrel{\unicode{x2B40}} \mathbf{r},&\\
d& \mathrel{\unicode{x2B40}} r_{\mathbf{d}},&\ d_{s} = s
\end{alignedat}
\right]
\end{aligned}
\end{aligned} \right.\!\!\!\! \tag{12.23}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-Psi">$\Psi$</span> | psi (capital) | the PVM: a program, a gas limit, registers and memory in; how it stopped and what's left out |
| <span id="gk-subifnone">$\mathcal{U}\left(x\right)$</span> | U of | the first of its arguments that isn't nothing (∅), or ∅ if all are |
| <span id="gk-is">$x\mathrel{\unicode{x2AF6}} y$</span> | is a | names a field and gives its type, in a tuple |

</details>

:::

**Read it aloud.** "O is defined as the tuple of: e, a partial state; t, a sequence of
transfers; y, a hash or nothing; u, gas; and p, a set of pairs, a service id and a blob.
Delta one maps a partial state, transfers, work-reports, free services and a service id to
an O: e, t, r, f, s give Psi A of e, tau prime, s, g, and i T followed by i U. Where g is
f of s, or zero if there is none, plus the gas of every transfer to s, plus the gas limit of
every digest for s. i T is every transfer to s, in order. i U is, for each digest d for s
in each report r, in order, the operand: its result, gas limit and payload hash from d;
its trace, exports root, package hash and authorizer from r."

**In plain words.** One service's run in a round.

1. **Add up its gas:** its free gas, the gas of every transfer sent to it, and every
   digest's gas limit.
2. **Line up its inputs:** the transfers first, then one operand per digest.
3. **Run** its accumulate code on them with Ψ_A ([Part 16](../16-host-calls/index.md)).

What comes back, 𝕆, is the state it left 𝐞, the transfers it sent 𝐭, its yield y, the gas
it used u, and the preimages it provided 𝐩.

**On a real value.** `transfer_for_live_service-1`, both rounds:

```text
Δ₁(𝐞, [], [r], {}, 0)       round 1, service 0
  g                         0 free + 0 transfers + 400,000 digest = 400,000
  inputs                    𝐢^T = [];  𝐢^U = [its one operand]
  𝕆                         u = 255,437;  𝐭 = [the gift to 1];  y none;  𝐩 {}
Δ₁(𝐞*, [gift], [], {}, 1)   round 2, service 1
  g                         0 free + 80,000 transfer + 0 digests = 80,000
  inputs                    𝐢^T = [gift];  𝐢^U = []
  𝕆                         u = 61,711;  𝐭 = [];  y none;  𝐩 {}
```

**In your client.** `serviceInputs` (g and the inputs) and the loop of `accumulateRound`, in
[17.4's code](./04-rounds.md#the-code). `accumulate` in `src/host.ts` returns the 𝕆, as an
`Accumulated`.

## (12.24) to (12.26): the block calls Δ+

::: gray-paper-eq 12.24

<a id="ex-12-24"></a>The Gray Paper's (12.24), (12.25), (12.26), [in its place in the paper's words](./09-the-blocks-gas-budget.md#eq-12-24):

$$
\begin{align}
&\text{let } g = \max\left(
\mathsf{G}_T,
\mathsf{G}_A \cdot \mathsf{C} + \textstyle \sum_{x \in \mathcal{V}\left(\chi_Z\right)}(x)
\right) \notag \\
& \text{and } \mathbf{e} = \left(
\mathbf{d}\mathrel{\unicode{x2AF6}}\delta,
\mathbf{i}\mathrel{\unicode{x2AF6}}\iota,
\mathbf{q}\mathrel{\unicode{x2AF6}}\phi,
m\mathrel{\unicode{x2AF6}}\chi_M,
\mathbf{a}\mathrel{\unicode{x2AF6}}\chi_A,
v\mathrel{\unicode{x2AF6}}\chi_V,
r\mathrel{\unicode{x2AF6}}\chi_R,
\mathbf{z}\mathrel{\unicode{x2AF6}}\chi_Z
\right)
\!\!\!\!\! \notag \\
&\left(
n, \mathbf{e}', \mathbf{b}, \mathbf{u}, \mathbf{t}
\right) \equiv \Delta_+(g, \left[\right], \mathbf{R}^*, \mathbf{e}, \chi_Z) \tag{12.24} \\
&\theta' \equiv \left[\left(s, h\right) \in \mathbf{b}\right] \tag{12.25} \\
&\left(
\mathbf{d}\mathrel{\unicode{x2AF6}}\delta^\dagger,
\mathbf{i}\mathrel{\unicode{x2AF6}}\iota',
\mathbf{q}\mathrel{\unicode{x2AF6}}\phi',
m\mathrel{\unicode{x2AF6}}\chi_M',
\mathbf{a}\mathrel{\unicode{x2AF6}}\chi_A',
v\mathrel{\unicode{x2AF6}}\chi_V',
r\mathrel{\unicode{x2AF6}}\chi_R',
\mathbf{z}\mathrel{\unicode{x2AF6}}\chi_Z'
\right) \equiv \mathbf{e}'
\!\!\!\!\! \tag{12.26}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-Cblockaccgas" class="gk-wrap">$\mathsf{G}_T$</span> | G sub T | the gas for a whole block's accumulation: 3,500,000,000 on full, 20,000,000 on tiny |
| <span id="gk-Creportaccgas" class="gk-wrap">$\mathsf{G}_A$</span> | G sub A | the most gas a report's accumulation may be given: 10,000,000 |
| <span id="gk-cdot">$\cdot$</span> | times | multiply |
| <span id="gk-accountspre" class="gk-wrap">$\delta$</span> | delta | the service accounts before the block |
| <span id="gk-stagingset" class="gk-wrap">$\iota$</span> | iota | the next validators: keys queued to become active at the next epoch |
| <span id="gk-authqueue" class="gk-wrap">$\phi$</span> | phi | the authorizer queues: for each core, Q = 80 authorizer hashes waiting to join its pool |
| <span id="gk-local-numberofreportsaccumulated">$n$</span> | n | how many reports the block accumulated: the first n of 𝐑\* |
| <span id="gk-local-servicegasused" class="gk-wrap">$\mathbf{u}$</span> | u | the gas each service used: a pair (service, gas) for every run, over all rounds |
| <span id="gk-lastaccout" class="gk-wrap">$\theta$</span> | theta | the last block's accumulation outputs: which service yielded which hash |
| <span id="gk-accountspostacc" class="gk-wrap">$\delta^\dagger$</span> | delta dagger | the service accounts right after accumulation, before slots are stamped and the block's preimages filed |

</details>

:::

**Read it aloud.** "Let g be the larger of G T and G A times C plus the sum of chi Z's gas
values. Let e be the partial state of: d is delta, i is iota, q is phi, m is chi M, a is chi
A, v is chi V, r is chi R, z is chi Z. The tuple n, e prime, b, u, t is defined as Delta
plus of g, no transfers, R star, e and chi Z. Theta prime is the pairs s, h in b, as a
sequence. And the partial state e prime gives delta dagger, iota prime, phi prime and the
new privileges."

**In plain words.** The block's budget is G_T, or enough for one maximal report per core
plus every free service's gas, whichever is larger. The state's accounts, next validators,
queues and privileges go in as one partial state. Δ+ runs every round on this block's 𝐑\*.
What comes out:

- the new ι′, ϕ′ and χ′;
- the accounts δ†, still to be stamped and given the block's preimages;
- the yields θ′, the gas 𝐮 and the transfers 𝐭.

**On a real value.** `always_accumulate-1`, slot 43, has no reports at all:

```text
g      max(20,000,000, 10,000,000 × 2 + 100,000) = 20,100,000   the free gas tips it
𝐞      (δ, ι, ϕ, 0, [0, 0], 0, 0, {1729 ↦ 100,000})
Δ+     i = 0, n = 0 + 0 + 1 = 1: one round, for 1729 alone; it uses 16,417
out    n = 0 reports;  𝐮 = [(1729, 16,417)];  𝐛 = {};  𝐭 = []
θ′     []                                                         nothing yielded
```

**In your client.** `floor` and `budget` in `accumulateBlock`, [17.9's
code](./09-the-blocks-gas-budget.md#the-code). θ′ is its `outputs`, [17.11](./11-what-a-service-yields.md#the-code).

## (12.27) and (12.28): the statistics

::: gray-paper-eq 12.27

<a id="ex-12-27"></a>The Gray Paper's (12.27), (12.28), [in its place in the paper's words](./01-a-blocks-accumulation.md#eq-12-27):

$$
\begin{align}
&\mathbf{S} \in \left\langle\!\left\vert \mathbb{N}_S\to\!\left\lgroup\mathbb{N}, \mathbb{N}, \mathbb{N}_G\right\rgroup\!\right\vert\!\right\rangle \tag{12.27} \\
&\textstyle \mathbf{S} \equiv \left\{\,
\left(s \mapsto S(s)\right)
\;\middle\vert\;
S(s) \ne \left(0, 0, 0\right)
\,\right\}
\!\!\!\! \tag{12.28} \\
\text{where } &S(s) \equiv \left(N(s), T(s), G(s)\right) \notag \\
\text{and } &N(s) \equiv \left\vert\left[d \;\middle\vert\;
r \mathrel{\unicode{x2B40}} \mathbf{R}^*_{\dots n} ,
d \mathrel{\unicode{x2B40}} r_{\mathbf{d}} ,
d_{s} = s
\right]\right\vert \notag \\
\text{and } &T(s) \equiv \left\vert\left[t \;\middle\vert\;
t \mathrel{\unicode{x2B40}} \mathbf{t} ,
t_{d} = s
\right]\right\vert \notag \\
\text{and } &G(s) \equiv \sum_{\left(s, u\right) \in \mathbf{u}}(u) \notag
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-accumulationstatistics" class="gk-wrap">$\mathbf{S}$</span> | S | this block's accumulation tallies, per service: work-items accumulated, transfers, and gas used |
| <span id="gk-kv">$\left(x \mapsto y\right)$</span> | k maps to v | a dictionary entry: key k, value v |

</details>

:::

**Read it aloud.** "S is a dictionary from service id to a tuple of a number, a number and
gas. S is defined as the set of s maps to S of s, where S of s isn't zero, zero, zero.
Where S of s is the tuple N of s, T of s, G of s; N of s is the count of digests for s in
the first n reports of R star; T of s is the count of transfers to s in t; and G of s is
the sum of the gas u of every pair s, u in u."

**In plain words.** For each service, three tallies over the whole block:

- N, the digests it accumulated (only from reports that ran: the first n);
- T, the transfers it received;
- G, the gas it used, added up over every round.

A service with all three at zero is left out.

**On a real value.** `transfer_for_live_service-1`:

```text
S(0)      (1, 0, 255,437)    one digest, no transfers, round 1's gas
S(1)      (0, 1, 61,711)     no digests, the gift, round 2's gas
S(1729)   (0, 0, 0)          left out of 𝐒
```

The vector's `accumulate_count`, `accumulate_transfer_count` and `accumulate_gas_used`
say the same.

**In your client.** `statistics` and `AccumulationStats` in `accumulateBlock`, [17.1's
code](./01-a-blocks-accumulation.md#the-code), with T counted from [17.4](./04-rounds.md#the-code).

## (12.29) and (12.30): stamping the slot

::: gray-paper-eq 12.29

<a id="ex-12-29"></a>The Gray Paper's (12.29), (12.30), [in its place in the paper's words](./01-a-blocks-accumulation.md#eq-12-29):

$$
\begin{align}
\delta^\ddagger &\equiv \left\{\,  \left(s \mapsto a'\right)  \;\middle\vert\;  \left(s \mapsto a\right) \in \delta^\dagger \,\right\} \tag{12.29} \\
& \text{where } a' = \begin{cases}
a \text{ except } a'_{a} = \tau' &\text{if } s \in \mathcal{K}\left(\mathbf{S}\right) \\
a &\text{otherwise}
\end{cases} \tag{12.30}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-accountspostxfer" class="gk-wrap">$\delta^\ddagger$</span> | delta double dagger | the service accounts midway: after accumulation |

</details>

:::

**Read it aloud.** "Delta double dagger is defined as the set of s maps to a prime, for
each s maps to a in delta dagger, where a prime is a except that its a is tau prime, if s
is a key of S; otherwise a."

**In plain words.** Every service in the statistics, so every service that did anything,
gets its last-accumulation slot set to this block's slot. The rest are left alone.

**On a real value.** `transfer_for_live_service-1`, slot 43:

```text
service 0      last accumulated 0 → 43    in 𝐒
service 1      last accumulated 0 → 43    in 𝐒: a transfer alone counts
service 1729   last accumulated 0         not in 𝐒
```

**In your client.** `account.info.last_accumulation_slot = slot` in `accumulateBlock`,
[17.1's code](./01-a-blocks-accumulation.md#the-code).

## (12.31) to (12.33): the history and the queue move on

::: gray-paper-eq 12.31

<a id="ex-12-31"></a>The Gray Paper's (12.31), (12.32), (12.33), [in its place in the paper's words](./02-waiting-reports.md#eq-12-31):

$$
\begin{align}
\xi'_{\mathsf{E} - 1} &= P(\mathbf{R}^*_{\dots n}) \tag{12.31} \\
\forall i \in \mathbb{N}_{\mathsf{E} - 1}: \xi'_{i} &\equiv \xi_{i + 1} \tag{12.32} \\
\forall i \in \mathbb{N}_{\mathsf{E}} : {\omega'}^\circlearrowleft_{m - i} &\equiv \begin{cases}
E(\mathbf{R}^Q, \xi'_{\mathsf{E} - 1}) &\text{if } i = 0 \\
\left[\right] &\text{if } 1 \le i < \tau' - \tau \\
E({\omega}^\circlearrowleft_{m - i}, \xi'_{\mathsf{E} - 1}) &\text{if } i \ge \tau' - \tau
\end{cases}
\!\!\!\! \tag{12.33}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-cyclic">${x}^\circlearrowleft$</span> | wrapped around | ↺: the index goes round, counting from 0 again past the end (mod the length) |
| <span id="gk-ge">$\ge$</span> | is at least | greater than or equal to |

</details>

:::

**Read it aloud.** "Xi prime at E minus 1 is P of the first n of R star. For every i below
E minus 1, xi prime at i is xi at i plus 1. For every i below E, omega prime wrapped, at m
minus i, is: E of R Q and xi prime's newest, when i is zero; empty, when i is at least 1 and
below tau prime minus tau; and E of omega wrapped at m minus i and xi prime's newest, when i
is at least tau prime minus tau."

**In plain words.** The history slides one place: the oldest set drops off the front, and
the packages that accumulated in this block join at the end. The queue, read back from
this block's list m:

- **list m** gets this block's new waiters, less anything now done;
- **the lists of slots the chain skipped** are emptied: what waited there has waited a
  whole epoch, and is given up;
- **every other list** loses whatever is now done.

**On a real value.** `enqueue_and_unlock_chain-3`: the block before was at slot 44, this
one is at 46, so slot 45 was skipped.

```text
m           46 mod 12 = 10;   τ′ − τ = 2
ξ′[11]      P(𝐑*) = {a7a6, f598}      ξ′[0..10] = ξ[1..11], all empty
ω′[10]      i = 0: E([(1817, {38b7})], {a7a6, f598}) = [(1817, {38b7})]
ω′[9]       i = 1, below 2: emptied (slot 45 was skipped)
ω′[8]       i = 2: E([(6af0, {7749}), (f598, {a7a6})], …) = [(6af0, {7749})]   f598 is done
ω′[7]       i = 3: [(7749, {38b7}), (d54f, {1817, 6af0})]                     unchanged
```

**In your client.** The `accumulated` and `ready` lines at the end of `accumulateBlock`,
[17.2's code](./02-waiting-reports.md#the-code).

## Say it in one breath

Five privileges say who may change what (9.9). Reports wait in a ring ω for the packages
they need, and a history ξ remembers an epoch of done packages (12.1 to 12.3). Each block,
the reports that wait for nothing go now, and E, Q and P unlock whatever they free (12.4 to
12.12). A service's inputs are operands and transfers (12.13), its state a partial state
(12.15).

Δ+ runs rounds while reports fit the gas or transfers wait (12.17). Each round, Δ\* runs
every service once from the same state and merges the results: privileges through R
(12.18, 12.19), preimages through I (12.20). Each run is Δ₁ (12.22, 12.23).

The block feeds it a budget and its state (12.24). Then it counts N, T and G (12.27),
stamps the slot (12.29), and moves the history and the queue on (12.31).
