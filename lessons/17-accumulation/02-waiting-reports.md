# Waiting reports

Some work can't go until other work has gone. A report can name *prerequisites*: other
work-packages that must be accumulated first. [Lesson 17.1](./01-a-blocks-accumulation.md) left those reports out. This
lesson gives them somewhere to wait, a way to know when they're free, and the bookkeeping
that keeps both straight from block to block. Seven more official vectors pass, every one
of them about waiting.

## New words

- **Dependency.** Anything a report waits for: its prerequisites, and any work-packages
  named by its segment-root lookups. *Example:* report D depends on package A.
- **Ready queue.** ω. Where reports with dependencies wait: one list for each slot of an
  epoch, used like a ring. *Example:* a report arriving at slot 43 on tiny waits in list
  43 mod 12 = 7.
- **Accumulated history.** ξ. For each of the last E blocks, the set of work-packages that
  were accumulated in it. *Example:* after the block at slot 44, its newest set holds A and D.
- **Unlock.** A waiting report is free to go once its last dependency has been accumulated,
  possibly earlier in the very same block. *Example:* A accumulates, so D, waiting for A,
  goes right after it.

All four are in the [glossary](../glossary.md).

## What the Gray Paper says

::: gray-paper 12.1

#### §12.1 History and Queuing {#gp-12-1}

<a id="gp-12-1-p1"></a>Accumulation of a work-report is deferred in the case that it has a not-yet-fulfilled dependency and is cancelled entirely in the case of an invalid dependency. Dependencies are specified as work-package hashes and in order to know which work-packages have been accumulated already, we maintain a history of what has been accumulated. This history, $\xi$, is sufficiently large for an epoch worth of work-reports. Formally:

<a id="gp-12-1-p2"></a><a id="eq-12-1"></a><a id="eq-12-2"></a>

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
| <span id="gk-in">[$\in$](../symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-sequence">[$\left[\!\left[x\right]\!\right]$](../symbols.md#sequence)</span> | a sequence of | ⟦T⟧ is an array of T; a subscript is its length, :n at most n, n: at least n |
| <span id="gk-Cepochlen" class="gk-wrap">$\mathsf{E}$</span> | E | an epoch's length in slots: 600 on full, 12 on tiny |
| <span id="gk-protoset">$\left\{\mkern-5mu\left[\,x\,\right]\mkern-5mu\right\}$</span> | the set of | a set written in order: no repeats, kept sorted |
| <span id="gk-hash">$\mathbb{H}$</span> | H | a 32-byte value, usually a hash |
| <span id="gk-accumulatedcup" class="gk-wrap">$\overbrace{\xi}$</span> | all of xi | every work-package hash in the history ξ, its E sets joined into one: what was accumulated in the last epoch |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-bigcup">$\bigcup$</span> | the union over | everything in any of the sets it ranges over, together |

</details>

→ [(12.1), (12.2) in plain words](./gray-paper.md#ex-12-1)

<a id="gp-12-1-p3"></a>We also maintain knowledge of ready (i.e.  available and/or audited) but not-yet-accumulated work-reports in the state item $\omega$. Each of these were made available at most one epoch ago but have or had unfulfilled dependencies. Alongside the work-report itself, we retain its unaccumulated dependencies, a set of work-package hashes. Formally:

<a id="gp-12-1-p4"></a><a id="eq-12-3"></a>

$$
\begin{align}
\omega &\in \left[\!\left[\left[\!\left[\!\left\lgroup\mathbb{R}, \left\{\mkern-5mu\left[\,\mathbb{H}_{}\,\right]\mkern-5mu\right\}\right\rgroup\!\right]\!\right]_{}\right]\!\right]_{\mathsf{E}} \tag{12.3}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-ready" class="gk-wrap">$\omega$</span> | omega | the ready queue: available reports waiting on others before they can accumulate |
| <span id="gk-tuple">$\!\left\lgroup x\right\rgroup\!$</span> | the tuple of | a record: named fields, each with its type, like an object in JSON |
| <span id="gk-workreport" class="gk-wrap">$\mathbb{R}$</span> | R | the set of work-reports: a core's signed receipt for one work-package |

</details>

→ [(12.3) in plain words](./gray-paper.md#ex-12-3)

<a id="gp-12-1-p5"></a>The newly available work-reports, $\mathbf{R}$, are partitioned into two sequences based on the condition of having zero prerequisite work-reports. Those meeting the condition, $\mathbf{R}^!$, are accumulated immediately. Those not, $\mathbf{R}^Q$, are for queued execution. Formally:

<a id="gp-12-1-p6"></a><a id="eq-12-4"></a><a id="eq-12-5"></a><a id="eq-12-6"></a>

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
| <span id="gk-build">$x \;\middle\vert\; y$</span> | for each, such that | built by a rule: the left-hand value, for every case the right-hand side allows (a set, or a sequence in order) |
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

→ [(12.4), (12.5), (12.6) in plain words](./gray-paper.md#ex-12-4)

<a id="gp-12-1-p7"></a>We define the queue-editing function $E$, which is essentially a mutator function for items such as those of $\omega$, parameterized by sets of now-accumulated work-package hashes (those in $\xi$). It is used to update queues of work-reports when some of them are accumulated. Functionally, it removes all entries whose work-report's hash is in the set provided as a parameter, and removes any dependencies which appear in said set. Formally:

<a id="gp-12-1-p8"></a><a id="eq-12-7"></a>

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

→ [(12.7) in plain words](./gray-paper.md#ex-12-7)

<a id="gp-12-1-p9"></a>We further define the accumulation priority queue function $Q$, which provides the sequence of work-reports which are able to be accumulated given a set of not-yet-accumulated work-reports and their dependencies.

<a id="gp-12-1-p10"></a><a id="eq-12-8"></a>

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

→ [(12.8) in plain words](./gray-paper.md#ex-12-8)

<a id="gp-12-1-p11"></a>Finally, we define the mapping function $P$ which extracts the corresponding work-package hashes from a set of work-reports:

<a id="gp-12-1-p12"></a><a id="eq-12-9"></a>

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

→ [(12.9) in plain words](./gray-paper.md#ex-12-9)

<a id="gp-12-1-p13"></a>We may now define the sequence of accumulatable work-reports in this block as $\mathbf{R}^*$:

<a id="gp-12-1-p14"></a><a id="eq-12-10"></a><a id="eq-12-11"></a><a id="eq-12-12"></a>

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

→ [(12.10), (12.11), (12.12) in plain words](./gray-paper.md#ex-12-10)

:::

In plain words, §12.1, *History and Queuing*, is five steps:

1. **Sort the new reports.** Those with no dependencies go now, as in [lesson 17.1](./01-a-blocks-accumulation.md). Each of the
   others joins the waiters with its set of dependencies, minus any package the history
   says is already done.
2. **Line up everyone waiting.** The reports already in the queue, read around the ring
   starting from this block's slot, then the new waiters. Take out what the reports going
   now have just done.
3. **Unlock, again and again.** Every waiter with nothing left to wait for goes; their
   packages are now done, which may free others; repeat until nothing more is free.
4. **Accumulate** the reports going now, then the unlocked ones in that order, in one
   round ([lesson 17.1](./01-a-blocks-accumulation.md)).
5. **Remember.** The history moves on one block: the oldest set drops off, and a new set
   with everything just accumulated goes on the end. The queue's list for this slot is
   replaced by this block's new waiters (what had waited there an epoch is given up), and
   every other list loses whatever is now done. Lists for
   slots the chain skipped since the last block are emptied: their reports have waited a
   whole epoch, and are given up.

Step 5 is in §12.3, *Final State Integration*, after the rounds have run, because only
then is it known which reports went (the first n of R\*):

::: gray-paper 12.3 7-8

#### §12.3 Final State Integration, continued

<a id="gp-12-3-p7"></a>We define the final state of the ready queue and the accumulated map by integrating those work-reports which were accumulated in this block and shifting any from the prior state with the oldest such items being dropped entirely:

<a id="gp-12-3-p8"></a><a id="eq-12-31"></a><a id="eq-12-32"></a><a id="eq-12-33"></a>

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
| <span id="gk-forall">$\forall$</span> | for all | for every value: ∀c ∈ ℕ_C means for each core c |
| <span id="gk-Nmax">[$\mathbb{N}_{x}$](../symbols.md#naturals)</span> | N sub n | the whole numbers below n: ℕ_C is a core index, 0 to C − 1 |
| <span id="gk-N" class="gk-wrap">[$\mathbb{N}$](../symbols.md#naturals)</span> | N | the whole numbers: 0, 1, 2 and up; a subscript is a bound, ℕ₈ is 0 to 7 |
| <span id="gk-cyclic">${x}^\circlearrowleft$</span> | wrapped around | ↺: the index goes round, counting from 0 again past the end (mod the length) |
| <span id="gk-le">$\le$</span> | at most | less than or equal to |
| <span id="gk-thetime" class="gk-wrap">$\tau$</span> | tau | the time: the latest block's timeslot |
| <span id="gk-ge">$\ge$</span> | is at least | greater than or equal to |

</details>

→ [(12.31), (12.32), (12.33) in plain words](./gray-paper.md#ex-12-31)

:::

When you read the Gray Paper, these are the same things:

| Here | Gray Paper |
| --- | --- |
| the history | **ξ**, and all of it together **ξ∪** (written ξ with a brace over it) |
| the queue | **ω** |
| the queue's list for this block | **ω[τ′ mod E]** |
| the new waiters | **R^Q** |
| a report's dependencies | **D(r)** |
| taking done packages out of a queue | **E** |
| the unlocking loop | **Q** |
| the hashes of some reports | **P** |
| everything that goes this block | **R\* = R! ⌢ Q(q)** |

Try it on tiny, with letters for packages. It starts at the lesson's example: the next
block brings D, which waits for A. Run it, and D waits in list 7. Now add A, waiting for
nothing, and run the next block: both go. *The chain vectors* loads a queue where one A
frees four waiters, one after another. Skip slots, or jump an epoch, to see waiters given up.

<ReadyQueue />

## The tests

The vector checks now cover the queue and the history too, and seven more vectors join:

**Replace in** `test/accumulate.test.ts`

```ts
/** A vector's work-reports, decoded. */
const reportsOf = (vector: { input: { reports: unknown[] } }) =>
  vector.input.reports.map((r) => WorkReport.fromJson(r));

/** Checks the whole block of test vector `name`: accounts, statistics, queue and history. */
function checkBlock(name: string) {
  const vector = vectorJson(`stf/accumulate/tiny/${name}.json`) as BlockVector;
  const before = accumulationStateFromJson(vector.pre_state);
  const { state, statistics } = accumulateBlock(TINY, before, vector.input.slot, reportsOf(vector));
  const expected = accumulationStateFromJson(vector.post_state);
  assert.deepEqual(state.accounts, expected.accounts);
  assert.deepEqual(state.ready, expected.ready);
  assert.deepEqual(state.accumulated, expected.accumulated);
  const stats = vector.post_state.statistics.map(({ id, record: r }) => {
    const gasUsed = BigInt(r.accumulate_gas_used);
    return [id, { count: r.accumulate_count, transfers: r.accumulate_transfer_count, gasUsed }];
  });
  assert.deepEqual(statistics, new Map(stats as [number, unknown][]));
}

/** The vectors whose whole block needs nothing beyond this lesson. */
const BLOCK_CASES = [
  "accumulate_ready_queued_reports-1", "always_accumulate-1", "always_accumulate-2",
  "enqueue_and_unlock_chain-1", "enqueue_and_unlock_chain-2", "enqueue_and_unlock_chain-3",
  "enqueue_and_unlock_chain-4", "enqueue_and_unlock_chain_wraps-1",
  "enqueue_and_unlock_chain_wraps-2", "enqueue_and_unlock_chain_wraps-3",
  "enqueue_and_unlock_chain_wraps-4", "enqueue_and_unlock_chain_wraps-5",
  "enqueue_and_unlock_simple-1", "enqueue_and_unlock_simple-2",
  "enqueue_and_unlock_with_sr_lookup-1", "enqueue_and_unlock_with_sr_lookup-2",
  "enqueue_self_referential-1", "enqueue_self_referential-2", "enqueue_self_referential-3",
  "enqueue_self_referential-4", "lookup_foreign_preimage-1", "lookup_foreign_preimage-2",
  "no_available_reports-1", "preimage_len_bound-1", "preimage_len_bound-2",
  "preimage_len_bound-3", "process_one_immediate_report-1", "queues_are_shifted-1",
  "queues_are_shifted-2", "ready_queue_editing-1", "ready_queue_editing-2",
  "ready_queue_editing-3", "same_code_different_services-1", "same_round_storage_isolation-1",
  "same_round_storage_isolation-2", "work_for_ejected_service-1",
];
```

**Add to** `test/accumulate.test.ts`

```ts
import type { AccumulationStateJson } from "../src/accumulate.ts";
import { accumulationStateFromJson } from "../src/accumulate.ts";
import type { AccumulationState } from "../src/accumulate.ts";

/** A whole accumulate test vector: the input, the state before and after. */
type BlockVector = {
  input: { slot: number; reports: unknown[] };
  pre_state: AccumulationStateJson;
  post_state: AccumulationStateJson & { statistics: Vector["post_state"]["statistics"] };
};

test("a report waiting for package A goes in the same block as A", () => {
  const vector = vectorJson("stf/accumulate/tiny/enqueue_and_unlock_simple-2.json") as BlockVector;
  const before: AccumulationState = accumulationStateFromJson(vector.pre_state);
  const waiting: number = before.ready.flat().length; // D waits for A
  assert.equal(waiting, 1);
  const [a] = reportsOf(vector); // the block brings A, which waits for nothing
  const { state } = accumulateBlock(TINY, before, vector.input.slot, [a]);
  const stillWaiting: number = state.ready.flat().length; // D has gone
  assert.equal(stillWaiting, 0);
  const accumulated: number = state.accumulated.at(-1)!.size; // A and D, both accumulated now
  assert.equal(accumulated, 2);
});
```

`enqueue_and_unlock_simple-2` is the whole lesson in one vector: D has been waiting since
slot 43 for package A; the block at slot 44 brings A; both go.

## The code

First the pieces: [lesson 17.1](./01-a-blocks-accumulation.md)'s round on its own, the queue's two operations, the state a
block's accumulation works on, and a reader for the vectors' version of it:

**Add to** `src/accumulate.ts`

```ts
import { fromHex } from "./bytes.ts";
import { WorkReport } from "./work.ts";
import type { AccountJson } from "./services.ts";
import { accountFromJson } from "./services.ts";

/**
 * Δ* (GP §12), one round: every service with work in `reports`, and every always-accumulate
 * service, runs once from the same accounts and keeps its own account as its run leaves it.
 * Returns the accounts after the round, and the gas each service used.
 */
export function accumulateRound(
  config: Config,
  accounts: Map<number, Account>,
  free: Map<number, bigint>, // χ_Z: the services that accumulate every block, and their gas
  entropy: Bytes,
  slot: number,
  reports: WorkReport[],
) {
  const digests = reports.flatMap((r) => r.results);
  const services = new Set([...free.keys(), ...digests.map((d) => d.service_id)]);
  const after = copyAccounts(accounts);
  const used = new Map<number, bigint>();
  for (const s of services) {
    const account = accounts.get(s);
    const code = account && codeOf(account);
    if (!code) {
      used.set(s, 0n); // no code to run (or no such service): no gas used
      continue;
    }
    const { inputs, gas } = serviceInputs(reports, s, free.get(s) ?? 0n);
    const mine = copyAccounts(accounts); // every service starts from the same accounts
    const checkpoint = copyAccounts(accounts);
    const a = { id: s, accounts: mine, checkpoint, code, entropy, inputs };
    const result = accumulate(config, a, slot, gas);
    after.set(s, result.accounts.get(s)!);
    used.set(s, result.gasUsed);
  }
  return { accounts: after, used };
}

/** A report in the ready queue (GP §12, ω), and the packages it still waits for, in hex. */
export type Waiting = { report: WorkReport; dependencies: Set<string> };

/** A report's work-package hash, in hex. */
const packageOf = (r: WorkReport) => toHex(r.package_spec.hash);

/** E (GP §12): the queue without the reports whose packages are done, and without the done
 * packages in what the rest wait for. */
export function edit(queue: Waiting[], done: Set<string>): Waiting[] {
  return queue
    .filter((w) => !done.has(packageOf(w.report)))
    .map((w) => ({
      report: w.report,
      dependencies: new Set([...w.dependencies].filter((d) => !done.has(d))),
    }));
}

/** Q (GP §12): the reports the queue lets go now, in order: those waiting for nothing,
 * then the ones they free up, and so on, until nothing more is free. */
export function unlock(queue: Waiting[]): WorkReport[] {
  const out: WorkReport[] = [];
  for (;;) {
    const free = queue.filter((w) => w.dependencies.size === 0).map((w) => w.report);
    if (free.length === 0) return out;
    out.push(...free);
    queue = edit(queue, new Set(free.map(packageOf)));
  }
}

/** What a block's accumulation reads from the state, and gives back changed (GP §12). */
export type AccumulationState = {
  slot: number; // τ: the slot of the block before
  accounts: Map<number, Account>; // δ
  free: Map<number, bigint>; // χ_Z
  entropy: Bytes; // η′₀
  ready: Waiting[][]; // ω: for each slot of an epoch, the reports that wait
  accumulated: Set<string>[]; // ξ: for each of the last E slots, the packages accumulated
};

/** A block's accumulation state, as the accumulate test vectors write it. */
export type AccumulationStateJson = {
  slot: number;
  entropy: string;
  accounts: { id: number; data: AccountJson }[];
  privileges: { always_acc: { id: number; gas: number }[] };
  ready_queue: { report: unknown; dependencies: string[] }[][];
  accumulated: string[][];
};

/** An AccumulationState from the accumulate test vectors' JSON. */
export function accumulationStateFromJson(json: AccumulationStateJson): AccumulationState {
  const waiting = (w: { report: unknown; dependencies: string[] }) => ({
    report: WorkReport.fromJson(w.report),
    dependencies: new Set(w.dependencies),
  });
  return {
    slot: json.slot,
    accounts: new Map(json.accounts.map((a) => [a.id, accountFromJson(a.data)])),
    free: new Map(json.privileges.always_acc.map((x) => [x.id, BigInt(x.gas)])),
    entropy: fromHex(json.entropy),
    ready: json.ready_queue.map((slot) => slot.map(waiting)),
    accumulated: json.accumulated.map((hashes) => new Set(hashes)),
  };
}
```

`edit` and `unlock` are the Gray Paper's E and Q, nearly word for word. Hashes travel as
hex strings in `Set` objects, so "is this package done?" is a plain `has`.

Then the block, which takes the whole state now and gives back the new one:

**Replace in** `src/accumulate.ts`

```ts
/**
 * A block's accumulation (GP §12): the reports that can go now (R!, then what they and
 * the history unlock from the queue: R*) accumulate in one round. Every service that did
 * anything gets its statistics and its last-accumulation slot; the history ξ moves on one
 * slot, and the reports still waiting go back into the queue ω.
 */
export function accumulateBlock(
  config: Config,
  state: AccumulationState,
  slot: number, // τ′
  reports: WorkReport[], // the reports that just became available
) {
  const E = config.epoch_length;
  const waits = (r: WorkReport) =>
    r.context.prerequisites.length > 0 || r.segment_root_lookup.length > 0;
  const dependencies = (r: WorkReport) => [
    ...r.context.prerequisites,
    ...r.segment_root_lookup.map((l) => l.work_package_hash),
  ];
  const history = new Set(state.accumulated.flatMap((x) => [...x])); // ξ∪
  const now = reports.filter((r) => !waits(r)); // R!
  const fresh = reports.filter(waits).map((r) => ({
    report: r,
    dependencies: new Set(dependencies(r).map(toHex)),
  }));
  const queued = edit(fresh, history); // R^Q
  const m = slot % E;
  const ring = [...state.ready.slice(m), ...state.ready.slice(0, m)].flat();
  const all = [...now, ...unlock(edit([...ring, ...queued], new Set(now.map(packageOf))))];

  const { accounts, used } = accumulateRound(
    config, state.accounts, state.free, state.entropy, slot, all,
  );
  const digests = all.flatMap((r) => r.results);
  const statistics = new Map<number, AccumulationStats>();
  for (const [s, gasUsed] of used) {
    const count = digests.filter((d) => d.service_id === s).length;
    if (count === 0 && gasUsed === 0n) continue;
    statistics.set(s, { count, transfers: 0, gasUsed });
    const account = accounts.get(s);
    if (account) account.info.last_accumulation_slot = slot;
  }

  const done = new Set(all.map(packageOf));
  const accumulated = [...state.accumulated.slice(1), done]; // ξ′: newest last
  const ready: Waiting[][] = []; // ω′, slot by slot back from m
  for (let i = 0; i < E; i++) {
    const at = (m - i + E) % E;
    if (i === 0) ready[at] = edit(queued, done); // this block's newcomers
    else if (i < slot - state.slot) ready[at] = []; // slots the chain skipped: emptied
    else ready[at] = edit(state.ready[at], done);
  }
  const after = { ...state, slot, accounts, ready, accumulated };
  return { state: after, statistics };
}
```

The five steps are in order. The ring is read from this block's slot round to the one
before it; afterwards, `at` walks back from this block's slot, one list at a time.

The bin uses the block too, so it changes with it:

**Rewrite** `bin/accumulate.ts`

```ts
// Accumulates a test vector's block the way Part 17 does so far, and shows the queue: what
// waited, which packages went, what still waits; then each service next to the vector.
// Usage: npm run accumulate [vector], enqueue_and_unlock_simple-2 if not given

import { readFileSync } from "node:fs";
import { accumulateBlock, accumulationStateFromJson } from "../src/accumulate.ts";
import { TINY } from "../src/config.ts";
import { Run } from "../src/obs.ts";
import { WorkReport } from "../src/work.ts";

type Stat = { id: number; record: { accumulate_count: number; accumulate_gas_used: number } };

const DEFAULT = "../vectors/stf/accumulate/tiny/enqueue_and_unlock_simple-2.json";
const vector = JSON.parse(readFileSync(process.argv[2] ?? DEFAULT, "utf8"));
const before = accumulationStateFromJson(vector.pre_state);
const reports = vector.input.reports.map((r: unknown) => WorkReport.fromJson(r));
const slot = vector.input.slot;
const { state, statistics } = accumulateBlock(TINY, before, slot, reports);

const run = new Run("accumulate");
const short = (hash: string) => hash.slice(0, 10);
const went = [...state.accumulated.at(-1)!].map(short);
console.log(`slot ${slot}: ${reports.length} new report(s), ${before.ready.flat().length} waiting`);
console.log(`accumulated: ${went.join(", ") || "nothing"}`);
console.log(`still waiting: ${state.ready.flat().length}`);
run.event("block", { slot, went: went.join(", "), waiting: state.ready.flat().length });
for (const [s, { count, gasUsed }] of statistics) {
  const theirs = (vector.post_state.statistics as Stat[]).find((x) => x.id === s)?.record;
  console.log(`service ${s}: ${count} digest(s), ${gasUsed} gas`);
  const said = `${theirs?.accumulate_count} digest(s), ${theirs?.accumulate_gas_used} gas`;
  console.log(`  the vector says: ${said}`);
  const expected = theirs?.accumulate_gas_used;
  run.event("service", { s, count, used: Number(gasUsed), expected });
}
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ enqueue_and_unlock_chain-4: the block ends as the vector says (45.6ms)
...
✔ a report waiting for package A goes in the same block as A (43.3ms)
...
✔ the reported packages: each one's hash and exports root, sorted by hash (216.4ms)
...
ℹ tests 523
ℹ suites 0
ℹ pass 523
ℹ fail 0
...
reported 523 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791738811802
...
```

Thirty-six official vectors now end exactly as their post-states say: every account, every
statistic, the ready queue and the history.

## Watch it

**What flows through it.** A new default vector, with a queue: one report arrives, one
was already waiting for it. What goes in, what the queue becomes, what prints:

::: code-group

```json [what goes in]
{
  "input": { "slot": 44, "reports": [ {
    "package_spec": { "hash": "0x9aa1453512…" },
    "context": { "prerequisites": [] },
    "results": [ { "service_id": 1729, "accumulate_gas": 200000 } ]
  } ] },
  "pre_state": { "ready_queue": [ "… 7 empty slots …", [ {
    "report": { "package_spec": { "hash": "0xd97d796515…" } },
    "dependencies": [ "0x9aa1453512…" ]
  } ], "… 4 more, empty …" ] }
}
```

```ts [what it computes]
// accumulateBlock's queue, before and after
const computed = {
  waiting: [{ report: "0xd97d7965…", dependencies: ["0x9aa14535…"] }], // ready[7]: D, waits for A
  arriving: ["0x9aa14535…"], // A: no prerequisites, so it can go now
  edited: [{ report: "0xd97d7965…", dependencies: [] }], // A accumulated: D's last dependency gone
  accumulated: ["0x9aa14535…", "0xd97d7965…"], // the newest set in ξ′: A, then D
  ready: 0, // nothing left waiting
  statistics: { 1729: { count: 2, transfers: 0, gasUsed: 40_441n } }, // both digests are 1729's
};
```

```text [what comes out]
slot 44: 1 new report(s), 1 waiting
accumulated: 0x9aa14535, 0xd97d7965
still waiting: 0
```

:::

The vector is the bin's new default, `../vectors/stf/accumulate/tiny/enqueue_and_unlock_simple-2.json`.
D was filed at slot 43, in place 7 of the queue (43 mod 12 on tiny), waiting for A. A
arrives, goes, and takes D's last dependency with it, so D goes in the same block, and
service 1729 accumulates both digests.

**Run**

```sh
npm run accumulate
```

```text
slot 44: 1 new report(s), 1 waiting
accumulated: 0x9aa14535, 0xd97d7965
still waiting: 0
service 1729: 2 digest(s), 40441 gas
  the vector says: 2 digest(s), 40441 gas
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=accumulate-1791738817098
```

Try the chains:
`npm run accumulate ../vectors/stf/accumulate/tiny/enqueue_and_unlock_chain-4.json`.
The *Accumulate* panel, on **7 · Accumulation and import**, shows each block's line, then its services.

![Accumulate panel](./images/02-accumulate.png)

<details>
<summary>lasair: unlocking, in <code>conformance/accumulate_stf.ml</code></summary>

```ocaml
  let rec resolve_ready (items : ready_item list) (known : bytes list) : ready_item list =
    (* First, edit all items' deps to remove those that are known *)
    let edited_items = List.map (fun item -> edit_item_deps item known) items in
    (* Find items with no remaining dependencies *)
    let (ready, pending) = List.partition (fun item ->
      List.length item.ri_dependencies = 0
    ) edited_items in
    if List.length ready = 0 then
      [] (* No more items can become ready *)
    else begin
      (* Add ready items' hashes to known set and recurse *)
      let new_known = List.map get_package_hash ready in
      let more_ready = resolve_ready pending new_known in
      ready @ more_ready
    end
```

lasair's Q, written the way the Gray Paper writes it: take what's free, then call itself on
the rest with the newly done packages. Your `unlock` is the same recursion as a loop.

</details>

## Check your understanding

::: check
**On tiny, report D arrives at slot 43, waiting for package A. Which of the queue's lists does it wait in?**

- [ ] List 11, the last: new waiters join the end of the queue
  > No: the queue isn't one line. It's 12 lists, one for each slot of an epoch, and a
  > waiter goes in the list for the slot it arrived at.
- [x] List 7
  > Yes: 43 mod 12 = 7. Tiny's epoch is 12 slots long, and the lists are used like a
  > ring.
- [ ] List 43
  > No: there are only 12 lists, one for each slot of an epoch. Slot 43 wraps round
  > to list 7.

**At slot 44, A arrives, waiting for nothing. When does D accumulate?**

- [ ] At slot 55, when the ring comes back round to list 7
  > No: every block reads every list, starting from its own slot. D's list is read at
  > slot 44 like all the others.
- [ ] At slot 45: A must be in the history before anything waiting for it can go
  > No: unlocking happens inside the block. A goes now, its package is done, and that
  > frees D at once.
- [x] At slot 44, right after A
  > Yes: in `enqueue_and_unlock_simple-2` both go at slot 44, in one round. Service
  > 1729 accumulates 2 digests, and nobody is left waiting.

**A new report at slot 44 depends only on package A, which accumulated three blocks ago. What happens to it?**

- [x] It goes in this block: the history says A is done
  > Yes: step 1 crosses off every dependency the history ξ already holds. With nothing
  > left to wait for, the unlocking loop lets it go at once.
- [ ] It waits in list 8 until A is accumulated again
  > No: A won't come again, and needn't. ξ remembers what accumulated in the last E
  > blocks, and A is there.
- [ ] It's thrown away: A has gone, so the dependency can never be met
  > No: a dependency that's already met is the best kind. It's crossed off, not held
  > against the report.

**D waits in list 7 from slot 43, and A never comes. What happens at the block at slot 55?**

- [ ] D keeps waiting until A comes, however long that takes
  > No: the queue holds one epoch. A report that has waited a whole one is given up.
- [x] D is read one last time, then given up
  > Yes: 55 mod 12 = 7 again. The ring is read from list 7 first, but A still isn't
  > done, so D can't go, and list 7 becomes block 55's new waiters.
- [ ] D accumulates anyway: an epoch is long enough to wait
  > No: a report never goes without its dependencies. Waiting doesn't earn it a pass.
:::

## What you have

Reports that wait for each other, unlocked in the right order, and a queue and history
that match 36 official vectors. Services so far only touch their own accounts; [lesson
17.3](./03-sending-a-transfer.md) lets one pay another.

**Say it out loud.** A report can wait for other work. It sits in a ring of lists, one for each slot of an epoch, and if what it needs doesn't come within an epoch, it's given up.

Next: [17.3 Sending a transfer](./03-sending-a-transfer.md)
