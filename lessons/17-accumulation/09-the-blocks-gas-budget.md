# The block's gas budget

Accumulation runs on gas, and a block has only so much of it. Until now your client ran
every report in round 1, as if the tank were bottomless. The Gray Paper gives the block a
budget: a round takes reports only while they fit, and the rest wait for the next round,
which gets whatever the last one didn't spend. By the end of this lesson your client keeps
that budget, and an official vector that depends on it passes: a service is ejected in
round 1 and created again in round 2.

## New words

- **Gas budget (g).** The gas a block's accumulation may use, all rounds together: the
  bigger of *G_T*, the block's own limit, and G_A for every core plus the
  always-accumulate services' gas. *Example:* on tiny, max(20M, 10M × 2 + 0) = 20M.
- **G_T.** The protocol's gas limit for a whole block's accumulation, `max_block_gas` in
  your config. *Example:* 20,000,000 on tiny, 3,500,000,000 on full.
- **Leftover budget (g\*).** The next round's budget: the last round's budget, plus the
  gas its new transfers carry, minus the gas it used. *Example:* 20M + 0 − 0.35M = 19.65M.

All three are in the [glossary](../glossary.md).

## What the Gray Paper says

Δ+, the outer accumulation, round after round:

::: gray-paper 12.2 12-13

#### §12.2 Execution, continued

<a id="gp-12-2-p12"></a>We define the outer accumulation function $\Delta_+$ which transforms a gas-limit, a sequence of deferred transfers, a sequence of work-reports, an initial partial-state and a dictionary of services enjoying free accumulation, into a tuple of the number of work-reports accumulated, a <abbr class="gp-term" title="after the change: the value once it is made, written with a prime (α′); for state, after the block">posterior</abbr> <abbr class="gp-term" title="the partial state a run of accumulate works on and hands back">state-context</abbr>, the resultant accumulation-output pairings, the service-indexed gas usage and the sequence of processed transfers:

<a id="gp-12-2-p13"></a><a id="eq-12-17"></a>

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

→ [(12.17) in plain words](./gray-paper.md#ex-12-17)

:::

And where the block calls it, with the budget g, in §12.3:

::: gray-paper 12.3 1-2

#### §12.3 Final State Integration {#gp-12-3}

<a id="gp-12-3-p1"></a>Given the result of the top-level $\Delta_+$, we may define the posterior state $\chi'$, $\phi'$ and $\iota'$ as well as the first intermediate state of the service-accounts $\delta^\dagger$ and the <abbr class="gp-term" title="β_B, the belt: one running commitment to every block's accumulation outputs">Accumulation Output Log</abbr> $\theta'$:

<a id="gp-12-3-p2"></a><a id="eq-12-24"></a><a id="eq-12-25"></a><a id="eq-12-26"></a>

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
| <span id="gk-Ccorecount" class="gk-wrap">$\mathsf{C}$</span> | C | the number of cores: 341 on full, 2 on tiny |
| <span id="gk-alwaysaccers" class="gk-wrap">$\chi_Z$</span> | chi sub Z | the always-accumulate services: each accumulates every block, with this much gas |
| <span id="gk-is">$x\mathrel{\unicode{x2AF6}} y$</span> | is a | names a field and gives its type, in a tuple |
| <span id="gk-accountspre" class="gk-wrap">$\delta$</span> | delta | the service accounts before the block |
| <span id="gk-ps-stagingset" class="gk-wrap">$\mathbf{i}$</span> | i | a partial state's next validators' keys, ι |
| <span id="gk-stagingset" class="gk-wrap">$\iota$</span> | iota | the next validators: keys queued to become active at the next epoch |
| <span id="gk-ps-authqueue" class="gk-wrap">$\mathbf{q}$</span> | q | a partial state's authorizer queues, ϕ: 80 hashes for each core |
| <span id="gk-authqueue" class="gk-wrap">$\phi$</span> | phi | the authorizer queues: for each core, Q = 80 authorizer hashes waiting to join its pool |
| <span id="gk-ps-manager">$m$</span> | m | the manager service's id, χ_M |
| <span id="gk-manager" class="gk-wrap">$\chi_M$</span> | chi sub M | the manager: the one service that may change the privileges and grant free storage |
| <span id="gk-ps-assigners" class="gk-wrap">$\mathbf{a}$</span> | a | each core's assigner service id, χ_A |
| <span id="gk-assigners" class="gk-wrap">$\chi_A$</span> | chi sub A | the assigners: for each core, the service that may replace its authorizer queue |
| <span id="gk-ps-delegator">$v$</span> | v | the delegator service's id, χ_V: it sets the next validators |
| <span id="gk-delegator" class="gk-wrap">$\chi_V$</span> | chi sub V | the delegator: the one service that may set the next epoch's validator keys |
| <span id="gk-ps-registrar">$r$</span> | r | the registrar service's id, χ_R: it may create services at small ids |
| <span id="gk-registrar" class="gk-wrap">$\chi_R$</span> | chi sub R | the registrar: the one service that may create services with the reserved low ids |
| <span id="gk-ps-alwaysaccers" class="gk-wrap">$\mathbf{z}$</span> | z | the always-accumulate services with their free gas, χ_Z |
| <span id="gk-local-numberofreportsaccumulated">$n$</span> | n | how many reports the block accumulated: the first n of 𝐑\* |
| <span id="gk-local-servicegasused" class="gk-wrap">$\mathbf{u}$</span> | u | the gas each service used: a pair (service, gas) for every run, over all rounds |
| <span id="gk-local-processedtransfers" class="gk-wrap">$\mathbf{t}$</span> | t | every transfer delivered in the block's rounds |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-justbecameavailable" class="gk-wrap">$\mathbf{R}$</span> | R | the reports this block made available: ready to accumulate |
| <span id="gk-lastaccout" class="gk-wrap">$\theta$</span> | theta | the last block's accumulation outputs: which service yielded which hash |
| <span id="gk-accountspostacc" class="gk-wrap">$\delta^\dagger$</span> | delta dagger | the service accounts right after accumulation, before slots are stamped and the block's preimages filed |

</details>

→ [(12.24), (12.25), (12.26) in plain words](./gray-paper.md#ex-12-24)

:::

In plain words, Δ+ in full is five steps:

1. **The budget.** g = max(G_T, G_A × C + the always-accumulate services' gas). G_A is
   the most gas one report may ask for ([lesson 12.5](../12-guarantees/05-bad-reports.md)), C the number of cores.
2. **A round takes what fits.** Count the transfers' gas and the always-accumulate gas
   first. Then take reports in order while their gas still fits in g: the longest such
   run of reports. The first that doesn't fit, and everything after it, waits.
3. **Stop when there's nothing to do**: no report fits, no transfers, no free gas.
4. **The next round's budget** is g\* = g + the new transfers' gas − the gas the round
   used.
5. **Only reports that ran count.** The history ξ′ and the queue ω′ learn of the reports
   that accumulated, not of any left over.

Why give every core a whole G_A? So a block can always fit one maximal report per core:
the budget is sized for the busiest block guarantees allow. Reports unlocked from the queue
can push past it, and then the rounds share the work out.

Try it with the check questions' reports, or the vector's:

<BudgetRounds />

Here's the vector that needs it. Its two reports ask for 19,800,000 + 200,000 and 2,000,000
gas. (That first one is twice G_A, more than a guaranteed report may ask for: the vector
breaks the limit on purpose, to force a second round.) The first takes the whole 20M, so the second waits for round 2. And the order matters:
round 1 ejects service 2, round 2 creates a service 2 again. Squeezed into one round, both
would happen in the same run of service 0, which ends with *a* service 2 in its accounts,
just as the round began. [Lesson 17.7](./07-ejecting-a-service.md)'s merge looks at which ids are there, not at what they
hold, so the old service 2 would survive and the new one would be lost.

## A red you can read

Before the new vector, a fix to the test that checks whole blocks. Run this vector through
your client as it is, and `checkBlock` finds the accounts differ, as it should. Then
`assert.deepEqual` sets out to print the difference between two whole sets of accounts,
each holding its service's code: hundreds of thousands of bytes, compared line by line.
On a laptop that takes over a minute and a gigabyte of memory, and then the test runner
gives up without a word about what differed. A red you can't read is barely a red.

So `checkBlock` compares the accounts piece by piece: their info first, then storage,
requests and their preimages' hashes, each as a small map by service id. The code itself
is compared last, when everything else already agrees.

**Add to** `test/accumulate.test.ts`

```ts
/** Each account's `part`, by service id: small enough for a diff you can read. */
function each<T>(accounts: Map<number, Account>, part: (a: Account) => T): Map<number, T> {
  return new Map([...accounts].map(([s, a]) => [s, part(a)]));
}
```

**Replace in** `test/accumulate.test.ts`

```ts
/** Checks the whole block of test vector `name`: accounts, privileges, statistics, queue
 * and history. The accounts go piece by piece, their code last, so a red has a short diff. */
function checkBlock(name: string) {
  const vector = vectorJson(`stf/accumulate/tiny/${name}.json`) as BlockVector;
  const before: AccumulationState = accumulationStateFromJson(vector.pre_state);
  const { state, statistics } = accumulateBlock(TINY, before, vector.input.slot, reportsOf(vector));
  const expected: AccumulationState = accumulationStateFromJson(vector.post_state);
  const infos: Map<number, ServiceInfo> = each(state.accounts, (a) => a.info);
  const expectedInfos: Map<number, ServiceInfo> = each(expected.accounts, (a) => a.info);
  assert.deepEqual(infos, expectedInfos);
  const storage: Map<number, Map<string, Bytes>> = each(state.accounts, (a) => a.storage);
  const expectedStorage: Map<number, Map<string, Bytes>> =
    each(expected.accounts, (a) => a.storage);
  assert.deepEqual(storage, expectedStorage);
  const requests: Map<number, Map<string, number[]>> = each(state.accounts, (a) => a.requests);
  const expectedRequests: Map<number, Map<string, number[]>> =
    each(expected.accounts, (a) => a.requests);
  assert.deepEqual(requests, expectedRequests);
  const hashes = (a: Account) => [...a.preimages.keys()].sort(); // the preimages' hashes
  const preimages: Map<number, string[]> = each(state.accounts, hashes);
  const expectedPreimages: Map<number, string[]> = each(expected.accounts, hashes);
  assert.deepEqual(preimages, expectedPreimages);
  assert.deepEqual(state.accounts, expected.accounts); // all of it, the code included
  assert.deepEqual(state.privileges, expected.privileges);
  assert.deepEqual(state.ready, expected.ready);
  assert.deepEqual(state.accumulated, expected.accumulated);
  const stats = vector.post_state.statistics.map(({ id, record: r }) => {
    const gasUsed = BigInt(r.accumulate_gas_used);
    return [id, { count: r.accumulate_count, transfers: r.accumulate_transfer_count, gasUsed }];
  });
  assert.deepEqual(statistics, new Map(stats as [number, unknown][]));
}
```

`each` picks one part out of every account, keeping the ids, so a diff says which service
went wrong:

```ts
  const infos: Map<number, ServiceInfo> = each(state.accounts, (a) => a.info);
  const expectedInfos: Map<number, ServiceInfo> = each(expected.accounts, (a) => a.info);
  assert.deepEqual(infos, expectedInfos);
```

**Run**

```sh
npm test
```

Still green: the same checks, in a better order.

## The tests

One more official vector, and a test that names the rounds:

**Replace in** `test/accumulate.test.ts`

```ts
/** The vectors whose whole block needs nothing beyond this lesson. */
const BLOCK_CASES = [
  "accumulate_ready_queued_reports-1", "always_accumulate-1", "always_accumulate-2",
  "assign_from_non_assigner-1", "assign_from_non_assigner-2", "assign_from_non_assigner-3",
  "create_service-1", "enqueue_and_unlock_chain-1", "enqueue_and_unlock_chain-2",
  "enqueue_and_unlock_chain-3", "enqueue_and_unlock_chain-4", "enqueue_and_unlock_chain_wraps-1",
  "enqueue_and_unlock_chain_wraps-2", "enqueue_and_unlock_chain_wraps-3",
  "enqueue_and_unlock_chain_wraps-4", "enqueue_and_unlock_chain_wraps-5",
  "enqueue_and_unlock_simple-1", "enqueue_and_unlock_simple-2",
  "enqueue_and_unlock_with_sr_lookup-1", "enqueue_and_unlock_with_sr_lookup-2",
  "enqueue_self_referential-1", "enqueue_self_referential-2", "enqueue_self_referential-3",
  "enqueue_self_referential-4", "lookup_foreign_preimage-1", "lookup_foreign_preimage-2",
  "no_available_reports-1", "preimage_len_bound-1", "preimage_len_bound-2", "preimage_len_bound-3",
  "process_one_immediate_report-1", "queues_are_shifted-1", "queues_are_shifted-2",
  "ready_queue_editing-1", "ready_queue_editing-2", "ready_queue_editing-3",
  "recreate_ejected_service-1", "recreate_ejected_service_by_higher_registrar-1",
  "recreate_ejected_service_that_accumulates-1", "recreate_service_ejected_in_earlier_round-1",
  "same_code_different_services-1", "same_round_storage_isolation-1",
  "same_round_storage_isolation-2", "transfer_for_ejected_service-1",
  "transfer_for_ejected_service_that_accumulates_high_ejector-1",
  "transfer_for_ejected_service_that_accumulates_low_ejector-1", "transfer_for_live_service-1",
  "transfer_for_service_ejected_in_same_round_high_ejector-1",
  "transfer_for_service_ejected_in_same_round_low_ejector-1",
  "transfer_to_service_ejected_by_sender_eject_first-1",
  "transfer_to_service_ejected_by_sender_transfer_first-1", "work_for_ejected_service-1",
  "work_for_ejected_service-2", "work_for_service_ejected_in_same_round_high_ejector-1",
  "work_for_service_ejected_in_same_round_low_ejector-1",
];
```

**Add to** `test/accumulate.test.ts`

```ts
test("a block over budget: the second report waits a round, after the eject it needs", () => {
  const name = "stf/accumulate/tiny/recreate_service_ejected_in_earlier_round-1.json";
  const vector = vectorJson(name) as BlockVector;
  const before: AccumulationState = accumulationStateFromJson(vector.pre_state);
  const { state, rounds } = accumulateBlock(TINY, before, vector.input.slot, reportsOf(vector));
  assert.deepEqual(rounds, [1, 1]); // round 1 takes all 20M of the budget, so one report each
  const created: number = state.accounts.get(2)!.info.creation_slot; // was 0
  assert.equal(created, 43); // round 1 ejected service 2, round 2 made a new one
});
```

**Run, expect it to fail**

```sh
npm test
```

```text
...
✖ recreate_service_ejected_in_earlier_round-1: the block ends as the vector says (142.776875ms)
...
✖ a block over budget: the second report waits a round, after the eject it needs (121.250583ms)
...
ℹ tests 571
ℹ suites 0
ℹ pass 569
ℹ fail 2
...
✖ recreate_service_ejected_in_earlier_round-1: the block ends as the vector says (142.776875ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
  + actual - expected
...
  +     balance: 128714n,
  +     bytes: 127594n,
  -     balance: 1201n,
  -     bytes: 1081n,
...
✖ a block over budget: the second report waits a round, after the eject it needs (121.250583ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
  + actual - expected

  + undefined
  - [
  -   1,
  -   1
  - ]
...
```

Two reds, and both say why. The block's account 2 should be a newborn (1,201 balance, 1,081
bytes: just its code request), but yours is the old service 2, alive and well. And
`rounds` is `undefined`: `accumulateBlock` doesn't count rounds yet.

## The code

G_A is [lesson 12.5](../12-guarantees/05-bad-reports.md)'s limit, so the block reads it from there:

**Replace in** `src/guarantors.ts`

```ts
/** G_A: the most accumulation gas a report may ask for, all its digests together. */
export const REPORT_GAS = 10_000_000n;
```

**Replace in** `src/accumulate.ts`

```ts
import { REPORT_GAS } from "./guarantors.ts";

/**
 * A block's accumulation (GP §12): the reports that can go now (R!, then what they and
 * the history unlock from the queue: R*) accumulate in a first round, and the transfers
 * each round sends are delivered in the next, until a round sends none (Δ+). Every
 * service that did anything gets its statistics and its last-accumulation slot; the
 * history ξ moves on one slot, and the reports still waiting go back into the queue ω.
 * The privileges carry from round to round; the cores' new authorizer queues come back
 * beside the statistics. Each round takes as many reports as the block's gas budget
 * allows; `rounds` says how many it took.
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

  const gasOf = (r: WorkReport) => sum(r.results.map((d) => d.accumulate_gas));
  const freeGas = sum([...state.free.values()]);
  const floor = REPORT_GAS * BigInt(config.core_count) + freeGas;
  let budget = config.max_block_gas > floor ? config.max_block_gas : floor; // g
  let accounts = state.accounts;
  let todo = all; // the reports still to accumulate,
  let free = state.free; // the always-accumulate services (first round only),
  let transfers: Transfer[] = []; // and the transfers to deliver
  let privileges = state.privileges;
  const done: WorkReport[] = []; // the reports that did accumulate
  const rounds: number[] = []; // how many reports each round took
  const queues = new Map<number, Bytes[]>(); // the cores' new authorizer queues, for ϕ′
  const used = new Map<number, bigint>(); // G: gas, over every round
  const received = new Map<number, number>(); // T: transfers delivered
  for (;;) {
    // as many of the reports as fit the budget, with the transfers and the free gas
    let spent = sum(transfers.map((t) => t.gas)) + sum([...free.values()]);
    let fit = 0;
    while (fit < todo.length && spent + gasOf(todo[fit]) <= budget) {
      spent += gasOf(todo[fit]);
      fit++;
    }
    if (fit + transfers.length + free.size === 0) break; // nothing to do: done
    for (const t of transfers) received.set(t.dest, (received.get(t.dest) ?? 0) + 1);
    const round = accumulateRound(
      config, accounts, free, state.entropy, slot, todo.slice(0, fit), transfers, privileges,
    );
    done.push(...todo.slice(0, fit));
    rounds.push(fit);
    for (const [s, gas] of round.used) used.set(s, (used.get(s) ?? 0n) + gas);
    for (const [c, queue] of round.queues) queues.set(c, queue);
    accounts = round.accounts;
    privileges = round.privileges;
    budget += sum(round.transfers.map((t) => t.gas)) - sum([...round.used.values()]); // g*
    todo = todo.slice(fit); // the rest wait for the next round, if any
    free = new Map();
    transfers = round.transfers;
  }
  const digests = done.flatMap((r) => r.results);
  const statistics = new Map<number, AccumulationStats>();
  for (const [s, gasUsed] of used) {
    const count = digests.filter((d) => d.service_id === s).length;
    const transfersIn = received.get(s) ?? 0;
    if (count === 0 && transfersIn === 0 && gasUsed === 0n) continue; // S(s) = (0, 0, 0)
    statistics.set(s, { count, transfers: transfersIn, gasUsed });
    const account = accounts.get(s);
    if (account) account.info.last_accumulation_slot = slot;
  }

  const finished = new Set(done.map(packageOf));
  const accumulated = [...state.accumulated.slice(1), finished]; // ξ′: newest last
  const ready: Waiting[][] = []; // ω′, slot by slot back from m
  for (let i = 0; i < E; i++) {
    const at = (m - i + E) % E;
    if (i === 0) ready[at] = edit(queued, finished); // this block's newcomers
    else if (i < slot - state.slot) ready[at] = []; // slots the chain skipped: emptied
    else ready[at] = edit(state.ready[at], finished);
  }
  const after = { ...state, slot, accounts, privileges, ready, accumulated };
  return { state: after, statistics, queues, rounds };
}
```

**Add to** `src/accumulate.ts`

```ts
/** The sum of some amounts of gas. */
const sum = (amounts: bigint[]) => amounts.reduce((n, x) => n + x, 0n);
```

The round loop again, with four changes. `fit` counts the reports the budget allows,
adding them up one at a time:

```ts
    while (fit < todo.length && spent + gasOf(todo[fit]) <= budget) {
      spent += gasOf(todo[fit]);
      fit++;
    }
```

The loop stops when a round would have nothing to do (step 3). `budget` becomes g\* after
each round (step 4). And `done` keeps the reports that actually ran, for the statistics,
the history and the queue (step 5); `rounds` counts how many each round took.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ recreate_service_ejected_in_earlier_round-1: the block ends as the vector says (146.705875ms)
...
✔ a block over budget: the second report waits a round, after the eject it needs (133.31825ms)
...
ℹ tests 571
ℹ suites 0
ℹ pass 571
ℹ fail 0
...
reported 571 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791769462885
...
```

## Watch it

`bin/accumulate.ts` shows the rounds now:

**Rewrite** `bin/accumulate.ts`

```ts
// Accumulates a test vector's block the way Part 17 does so far, and shows the queue (what
// waited, which packages went, what still waits) and the rounds it took; then each service
// next to the vector: the digests it accumulated, the transfers it received, its gas.
// Usage: npm run accumulate [vector], enqueue_and_unlock_simple-2 if not given

import { readFileSync } from "node:fs";
import { accumulateBlock, accumulationStateFromJson } from "../src/accumulate.ts";
import { TINY } from "../src/config.ts";
import { Run } from "../src/obs.ts";
import { WorkReport } from "../src/work.ts";

type Stat = {
  id: number;
  record: {
    accumulate_count: number;
    accumulate_transfer_count: number;
    accumulate_gas_used: number;
  };
};

const DEFAULT = "../vectors/stf/accumulate/tiny/enqueue_and_unlock_simple-2.json";
const vector = JSON.parse(readFileSync(process.argv[2] ?? DEFAULT, "utf8"));
const before = accumulationStateFromJson(vector.pre_state);
const reports = vector.input.reports.map((r: unknown) => WorkReport.fromJson(r));
const slot = vector.input.slot;
const { state, statistics, rounds } = accumulateBlock(TINY, before, slot, reports);

const run = new Run("accumulate");
const short = (hash: string) => hash.slice(0, 10);
const went = [...state.accumulated.at(-1)!].map(short);
console.log(`slot ${slot}: ${reports.length} new report(s), ${before.ready.flat().length} waiting`);
console.log(`accumulated: ${went.join(", ") || "nothing"}`);
console.log(`still waiting: ${state.ready.flat().length}`);
console.log(`rounds: ${rounds.length}, taking ${rounds.join(", then ")} report(s)`);
console.log(`assigners: ${before.privileges.assign} → ${state.privileges.assign}`);
run.event("block", {
  slot,
  went: went.join(", "),
  waiting: state.ready.flat().length,
  assigners: `${before.privileges.assign} → ${state.privileges.assign}`,
  rounds: rounds.join(", "),
});
for (const [s, { count, transfers, gasUsed }] of statistics) {
  const theirs = (vector.post_state.statistics as Stat[]).find((x) => x.id === s)?.record;
  console.log(`service ${s}: ${count} digest(s), ${transfers} transfer(s), ${gasUsed} gas`);
  const said = `${theirs?.accumulate_count} digest(s), ${theirs?.accumulate_transfer_count} ` +
    `transfer(s), ${theirs?.accumulate_gas_used} gas`;
  console.log(`  the vector says: ${said}`);
  const expected = theirs?.accumulate_gas_used;
  run.event("service", { s, count, transfers, used: Number(gasUsed), expected });
}
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

**What flows through it.** Two reports that can't share a round: the first asks for the
whole budget:

::: code-group

```json [what goes in]
{
  "input": {
    "slot": 43,
    "reports": [
      { "package_spec": { "hash": "0x774935b629cc4251…" }, "core_index": 0, "results": [
        { "service_id": 0, "accumulate_gas": 19800000, "result": { "ok": "0x010402000000…" } },
        { "service_id": 2, "accumulate_gas": 200000 }
      ] },
      { "package_spec": { "hash": "0x6af0ea4ced28a7b0…" }, "core_index": 1, "results": [
        { "service_id": 0, "accumulate_gas": 2000000, "result": { "ok": "0x0100c0f2ef8d…" } }
      ] }
    ]
  },
  "pre_state": { "privileges": { "always_acc": [] }, "accounts": [ { "id": 0 }, { "id": 2 } ] }
}
```

```ts [what it computes]
// accumulateBlock's budget and rounds for this block
const computed = {
  budget: 20_000_000n, // g = max(G_T 20,000,000, G_A 10,000,000 × 2 cores + 0 free)
  round1: {
    reports: 1, // 19,800,000 + 200,000 = 20,000,000 fits; + 2,000,000 more wouldn't
    gasUsed: 151_611n, // service 0's, ejecting service 2; service 2's digest counts 0 gas
  },
  round2: {
    budget: 19_848_389n, // g* = 20,000,000 + 0 transfers' gas − 151,611
    reports: 1, // the second report's 2,000,000 fits now
    gasUsed: 203_009n, // service 0 makes a new service 2, code 0xc0f2ef8d…
  },
  rounds: [1, 1], // as accumulateBlock returns them
  service0Gas: 354_620n, // 151,611 + 203,009, both rounds
};
```

```text [what comes out]
accumulated: 0x774935b6, 0x6af0ea4c
rounds: 2, taking 1, then 1 report(s)
service 0: 2 digest(s), 0 transfer(s), 354620 gas
```

:::

The budget splits the block in two. Round 1 can take the first report, whose two digests
ask for exactly 20,000,000 between them, but not the second too. Service 0 ejects
service 2 there. Round 2, with what's left, takes the second report, and service 0
creates a service 2 again, the vector's name for the test: `recreate_service_ejected_in_earlier_round`.

**Run**

```sh
npm pkg set scripts.accumulate-recreate="node bin/accumulate.ts ../vectors/stf/accumulate/tiny/recreate_service_ejected_in_earlier_round-1.json"
npm run accumulate-recreate
```

```text
slot 43: 2 new report(s), 0 waiting
accumulated: 0x774935b6, 0x6af0ea4c
still waiting: 0
rounds: 2, taking 1, then 1 report(s)
assigners: 0,0 → 0,0
service 0: 2 digest(s), 0 transfer(s), 354620 gas
  the vector says: 2 digest(s), 0 transfer(s), 354620 gas
service 2: 1 digest(s), 0 transfer(s), 0 gas
  the vector says: 1 digest(s), 0 transfer(s), 0 gas
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=accumulate-1791769474334
```

[Lesson 17.4](./04-rounds.md)'s gift shows the other way to a second round: a transfer alone.
The *Accumulate* panel, on **7 · Accumulation and import**, has the rounds on the block's line.

![Accumulate panel](./images/09-accumulate.png)

<details>
<summary>lasair: the budget, in <code>conformance/accumulate_stf.ml</code></summary>

```ocaml
  let g_top =
    let floor_ = gas_add_u64 (Int64.mul 10_000_000L
      (Int64.of_int (Stf_config.num_cores ()))) f_sum in
    if Int64.compare (Stf_config.block_acc_gas ()) floor_ > 0
    then (Stf_config.block_acc_gas ()) else floor_
  in
```

Your `floor` and `budget`, line for line: G_A (10,000,000) per core plus the free gas, or
G_T if that's bigger. Each round then takes `affordable_prefix ~g ~fixed`, the reports that
fit after the `fixed` gas of the transfers and the free services. The comment above it
records an old bug (lasair#87): the first round once left the free gas out of `fixed`,
and so took reports the Gray Paper defers. Your `spent` starts with it.

</details>

## Check your understanding

::: check
**On tiny, G_T is 20,000,000 and G_A is 10,000,000. If the always-accumulate services had 5,000,000 gas between them, what would the block's budget be?**

- [ ] 20,000,000: G_T is the block's limit
  > No: the budget is the bigger of two numbers, and here the other one is bigger:
  > 10M × 2 + 5M = 25M.
- [x] 25,000,000
  > Yes: max(20M, 10M × 2 cores + 5M) = 25M. Every core's G_A, and the free gas on top,
  > must fit.
- [ ] 45,000,000
  > No: the two are compared, not added. The budget is max(20M, 25M).

**Four reports can go, asking for 6M, 9M, 7M and 2M gas, in that order. The budget is 20M, with nothing else to pay for. What does round 1 take?**

- [ ] The 6M, 9M and 2M: they make 17M, so skip the 7M
  > No: a round never skips ahead. The first report that doesn't fit waits, and so
  > does everything after it, even the 2M that would fit.
- [ ] All four: the budget is checked once the block is done
  > No: it's checked before each round. All four make 24M, over the 20M.
- [x] The 6M and the 9M
  > Yes: 6 + 9 = 15M fits; 15 + 7 = 22M doesn't. So the 7M and the 2M wait for the
  > next round.

**Round 1 had a 20M budget, used 350,000 gas, and sent no transfers. Reports are left over. What is round 2's budget?**

- [ ] 20M again: each round gets the whole budget
  > No: the budget is for all the rounds together. What round 1 spent is gone.
- [x] 19,650,000
  > Yes: g\* = 20M + 0 (the new transfers' gas) − 0.35M (what round 1 used).
- [ ] 350,000: what round 1 used is what round 2 may use
  > No: it's the other way round. Round 2 gets what round 1 didn't use.

**`recreate_service_ejected_in_earlier_round-1` ends with a newborn service 2, created at slot 43. Why a new one, not the old?**

- [ ] Service 0 ejects and creates in one run, and the creation comes last
  > No: in one run the old service 2 would survive: the id is there before and after,
  > so the merge sees no change ([lesson 17.8](./08-creating-a-service.md)).
- [x] The eject ran in round 1, and the creation in round 2
  > Yes: round 1's merge removed service 2. Round 2 started without it, so its new
  > service 2 joined the accounts.
- [ ] A new service always replaces an old one with the same id
  > No: inside one round it's the other way, and the old one stays. Only a round
  > between the two makes the difference.
:::

## What you have

The block's gas budget: rounds take what fits, the rest wait, and leftover gas carries
over. Fifty-five official vectors pass as whole blocks. Each of the eight left needs a host call
your client doesn't answer yet, and the simplest is a service replacing its own code:
[lesson 17.10](./10-upgrading-a-service.md).

**Say it out loud.** A block has a gas budget. A round takes reports while they fit, and the rest wait for the next round.

Next: [17.10 Upgrading a service](./10-upgrading-a-service.md)
