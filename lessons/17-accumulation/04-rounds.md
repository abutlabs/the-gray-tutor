# Rounds

[Lesson 17.3](./03-sending-a-transfer.md)'s gift left service 0 and went nowhere. Time to deliver it. A block's
accumulation doesn't happen all at once: it happens in *rounds*, and the transfers sent in
one round arrive in the next. By the end of this lesson, the gift's whole block matches
its official vector, receiver and all.

## New words

- **Δ+ (accumulating in rounds).** The Gray Paper's loop over rounds: one round, then
  another for the transfers it sent, and so on until a round sends none (with the gas
  budget, [lesson 17.9](./09-the-blocks-gas-budget.md), reports left over make rounds too). *Example:* the gift's
  block takes two rounds.
- **Delivery.** What happens to a transfer in the round after it was sent: its money goes
  into the receiver's balance, and the transfer itself becomes one of the receiver's
  inputs. *Example:* service 1's balance grows by 100, then its code reads "gift".
- **Transfer input.** An input that starts with a 1, followed by one transfer, encoded.
  Operands start with a 0. *Example:* service 1's only input in round 2.

All three are in the [glossary](../glossary.md). (*Round* itself is from [lesson 17.1](./01-a-blocks-accumulation.md).)

## What the Gray Paper says

§12.2 opens with why accumulation runs in rounds at all:

::: gray-paper 12.2 1-4

#### §12.2 Execution {#gp-12-2}

<a id="gp-12-2-p1"></a>We work with a limited amount of gas per block and therefore may not be able to process all items in $\mathbf{R}^*$ in a single block. There are two slightly antagonistic factors allowing us to optimize the amount of work-items, and thus work-reports, accumulated in a single block:

<a id="gp-12-2-p2"></a>Firstly, while we have a well-known gas-limit for each work-item to be accumulated, accumulation may still result in a lower amount of gas used. Only after a work-item is accumulated can it be known if it uses less gas than the advertised limit. This implies a sequential execution pattern.

<a id="gp-12-2-p3"></a>Secondly, since PVM setup cannot be expected to be zero-cost, we wish to amortize this cost over as many work-items as possible. This can be done by aggregating work-items associated with the same service into the same PVM <abbr class="gp-term" title="one run of code in the PVM: Is-Authorized, refine or accumulate">invocation</abbr>. This implies a non-sequential execution pattern.

<a id="gp-12-2-p4"></a>We resolve this by defining a function $\Delta_+$ which accumulates work-reports sequentially, and which itself utilizes a function $\Delta_*$ which accumulates work-reports in a non-sequential, service-aggregated manner. In all but the first invocation of $\Delta_+$, we also integrate the effects of any *deferred-transfers* implied by the previous round of accumulation, thus the accumulation function must accept both the information contained in work-digests and that of deferred-transfers.

:::

In plain words, §12.2's rounds are five steps:

1. **Round 1 is the block you already have**: every report that can go, and the
   always-accumulate services. It may send transfers.
2. **If it did, round 2 runs, for those transfers only.** Every service a transfer was
   sent to runs once, all from the same accounts, as in any round. Its transfers come
   first among its inputs, then any operands; its gas is all of their gas added up.
3. **The money comes first.** Before a receiver's code runs, the amounts go into its
   balance. That happens even if it has no code at all, and then nothing else does. And
   it stays even if the receiver's code then panics: a panic undoes what the run did, and
   the money was there before the run began.
4. **Again and again.** Round 2's transfers make round 3, and so on, until a round
   sends nothing.
5. **The statistics count every round.** G adds up each service's gas over all the
   rounds, and T counts the transfers it received ([lesson 17.1](./01-a-blocks-accumulation.md) left T at 0). A service
   that only received a transfer still counts, and gets its last-accumulation slot.

Inside a round the services go in order of their ids, and so do the transfers they send:
that's the order the next round hands them out in.

![The gift's block in rounds. Round 1 runs service 0 with its one operand; it uses 255,437 gas and sends service 1 a transfer of 100 with the memo "gift" and 80,000 gas. Round 2 runs service 1: first 100 goes into its balance, from 227,714, then it runs with the transfer as its input and uses 61,711 gas, sending nothing. So there is nothing for a round 3, and Δ+ stops.](./images/04-rounds.svg)

<GiftRounds />

In the Gray Paper the loop is *Δ+*, one round *Δ\**, and one service in a round *Δ₁*,
whose inputs are *i^T ⌢ i^U*: transfers, then operands. Here is Δ₁, whose g and
inputs your `serviceInputs` builds below:

::: gray-paper 12.2 21-24

#### §12.2 Execution, continued

<a id="gp-12-2-p21"></a>The single-service accumulation function, $\Delta_1$, transforms an initial <abbr class="gp-term" title="the partial state a run of accumulate works on and hands back">state-context</abbr>, a sequence of deferred-transfers, a sequence of work-reports, a dictionary of services enjoying free accumulation (with the values indicating the amount of free gas) and a service index into an alterations state-context, a sequence of *transfers*, a possible accumulation-output, the actual PVM gas used and a set of preimage provisions. This function wrangles the work-digests of a particular service from a set of work-reports and invokes PVM execution with said data:

<a id="gp-12-2-p22"></a><a id="eq-12-22"></a>

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
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-tuple">$\!\left\lgroup x\right\rgroup\!$</span> | the tuple of | a record: named fields, each with its type, like an object in JSON |
| <span id="gk-isa">[$x\in y$](../symbols.md#in)</span> | in | belongs to: the field's type |
| <span id="gk-ao-poststate" class="gk-wrap">$\mathbf{e}$</span> | e | the state a run left behind |
| <span id="gk-partialstate" class="gk-wrap">$\mathbb{S}$</span> | S | a partial state: the parts of the state accumulation may change: accounts, next validators, authorizer queues and the privileges |
| <span id="gk-ao-defxfers" class="gk-wrap">$\mathbf{t}$</span> | t | the transfers a run sent |
| <span id="gk-defxfers">$\left[\!\left[\mathbb{X}\right]\!\right]$</span> | a sequence of transfers | a list of deferred transfers, in order |
| <span id="gk-ao-yield">$y$</span> | y | a run's yield: a 32-byte hash for the outside world, or nothing |
| <span id="gk-optional">$x\boldsymbol{?}$</span> | or nothing | a value of this type, or ∅ (null) |
| <span id="gk-hash">$\mathbb{H}$</span> | H | a 32-byte value, usually a hash |
| <span id="gk-ao-gasused">$u$</span> | u | the gas a run used |
| <span id="gk-gas" class="gk-wrap">$\mathbb{N}_G$</span> | N sub G | an amount of gas: a u64 |
| <span id="gk-ao-provisions" class="gk-wrap">$\mathbf{p}$</span> | p | the preimages a run provided: pairs (service, blob) |
| <span id="gk-protoset">$\left\{\mkern-5mu\left[\,x\,\right]\mkern-5mu\right\}$</span> | the set of | a set written in order: no repeats, kept sorted |
| <span id="gk-serviceid" class="gk-wrap">$\mathbb{N}_S$</span> | N sub S | a service id: a whole number below 2³², 4 bytes |
| <span id="gk-blob">[$\mathbb{B}$](../symbols.md#blobs)</span> | B, or B sub n | bytes: any run of them; 𝔹ₙ exactly n of them |

</details>

→ [(12.22) in plain words](./gray-paper.md#ex-12-22)

<a id="gp-12-2-p23"></a><a id="eq-12-23"></a>

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
| <span id="gk-accone" class="gk-wrap">$\Delta_1$</span> | Delta one | one service's accumulation: adds up its gas, lines up its inputs, transfers first, and runs its code with Ψ_A |
| <span id="gk-abracegroup">$\left\{ \begin{aligned}x\end{aligned} \right.$</span> | as follows | a brace grouping lines that hold together: for a function, its type on top, then what each input becomes |
| <span id="gk-workreports">$\left[\!\left[\mathbb{R}\right]\!\right]$</span> | a sequence of work-reports | a list of work-reports, in order |
| <span id="gk-dictionary">$\left\langle\!\left\vert x\to y\right\vert\!\right\rangle$</span> | a dictionary from K to V | a map: keys of type K, each with one value of type V |
| <span id="gk-to">[$\to$](../symbols.md#to)</span> | to | what goes in, to what comes out: A → B takes an A and gives a B |
| <span id="gk-mapsto">$\mapsto$</span> | maps to | what a function gives back for an input: x ↦ y says x becomes y |
| <span id="gk-Psi">$\Psi$</span> | psi (capital) | the PVM: a program, a gas limit, registers and memory in; how it stopped and what's left out |
| <span id="gk-thetime" class="gk-wrap">$\tau$</span> | tau | the time: the latest block's timeslot |
| <span id="gk-concat" class="gk-wrap">[$\frown$](../symbols.md#concat)</span> | concatenate | join: the left sequence followed by the right |
| <span id="gk-subifnone">$\mathcal{U}\left(x\right)$</span> | U of | the first of its arguments that isn't nothing (∅), or ∅ if all are |
| <span id="gk-sum">$\sum$</span> | the sum of | add up what follows, once for each value the subscript ranges over |
| <span id="gk-in">[$\in$](../symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-dx-dest">$d$</span> | d | a transfer's receiver: the service it goes to |
| <span id="gk-dx-gas">$g$</span> | g | the gas the sender pays for the receiver's run on this transfer |
| <span id="gk-wr-digests" class="gk-wrap">$\mathbf{d}$</span> | d | the report's digests, one per work-item, 1 to 16 of them (`results`) |
| <span id="gk-wd-serviceindex">$s$</span> | s | the service the item was for, whose accumulate gets the result |
| <span id="gk-sq">[$\left[x\right]$](../symbols.md#sequence)</span> | the sequence | a sequence written out item by item; [ ] is the empty one |
| <span id="gk-build">$x \;\middle\vert\; y$</span> | for each, such that | built by a rule: the left-hand value, for every case the right-hand side allows (a set, or a sequence in order) |
| <span id="gk-orderedin">$\mathrel{\unicode{x2B40}}$</span> | in order, from | each item of the sequence, in its order |
| <span id="gk-is">$x\mathrel{\unicode{x2AF6}} y$</span> | is a | names a field and gives its type, in a tuple |
| <span id="gk-ot-result" class="gk-wrap">$\mathbf{l}$</span> | l | what refine produced for the work-item: a blob, or an error |
| <span id="gk-ot-segroot">$e$</span> | e | the operand's exports root: the root of the segments its package exported |
| <span id="gk-wr-avspec" class="gk-wrap">$\mathbf{s}$</span> | bold s | a report's availability spec: the package's hash, its bundle's length, and the roots of its pieces and of the segments it exports |
| <span id="gk-ot-packagehash">$p$</span> | p | the operand's work-package hash |
| <span id="gk-ot-authorizer">$a$</span> | a | the authorizer hash of the report the digest came from |

</details>

→ [(12.23) in plain words](./gray-paper.md#ex-12-23)

<a id="gp-12-2-p24"></a>This draws upon $g$, the gas limit implied by the selected deferred-transfers, work-reports and gas-privileges.

:::

In plain words: one service's run gets its free gas, plus the gas of every transfer sent
to it, plus the gas limit of every digest for it, all added up as g; its inputs are the
transfers to it, in order, then its operands, in order; and Ψ_A runs its code on them. What
comes back, an 𝕆, is the state it left (𝐞), the transfers it sent (𝐭), its yield (y), the
gas it used (u) and the preimages it provided (𝐩).

> [!NOTE]
> **The simple road.** Δ+ also keeps a gas budget for the whole block, max(G_T, G_A · C +
> the always-accumulate gas): reports join round 1 only while their gas still fits, and
> the rest wait for a later round. This lesson takes every report in round 1. One
> official vector needs the budget: in `recreate_service_ejected_in_earlier_round-1`, the
> two reports ask for 22,000,000 gas, tiny's budget is 20,000,000, so the second report
> waits for round 2. That vector waits for [lesson 17.9](./09-the-blocks-gas-budget.md), which builds the budget.

## The tests

One more official vector passes whole:

**Replace in** `test/accumulate.test.ts`

```ts
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
  "same_round_storage_isolation-2", "transfer_for_live_service-1", "work_for_ejected_service-1",
];
```

**Add to** `test/accumulate.test.ts`

```ts
import { accumulateRound } from "../src/accumulate.ts";
import { toHex } from "../src/bytes.ts";
import type { Account, AccountJson } from "../src/services.ts";
import type { AccumulationState } from "../src/accumulate.ts";
import type { AccumulationStats } from "../src/accumulate.ts";
import type { Bytes } from "../src/bytes.ts";

test("the gift arrives a round later: the money first, then service 1 runs", () => {
  const vector = vectorJson("stf/accumulate/tiny/transfer_for_live_service-1.json") as BlockVector;
  const before: AccumulationState = accumulationStateFromJson(vector.pre_state);
  const { state, statistics } = accumulateBlock(TINY, before, vector.input.slot, reportsOf(vector));
  const receiver: Account = state.accounts.get(1)!;
  const received: bigint = receiver.info.balance; // the gift arrived
  assert.equal(received, 227_714n + 100n);
  const stats: AccumulationStats | undefined = statistics.get(1);
  assert.deepEqual(stats, { count: 0, transfers: 1, gasUsed: 61_711n });
  const note: Bytes = receiver.storage.get(toHex(new TextEncoder().encode("transfer0")))!;
  const memo: string = new TextDecoder().decode(note.subarray(12, 16)); // it read the memo
  assert.equal(memo, "gift");
});

test("a transfer to a service with no code: the money arrives, and nothing runs", () => {
  const vector = vectorJson("stf/accumulate/tiny/transfer_for_live_service-1.json") as BlockVector;
  const { accounts, entropy } = accumulationStateFromJson(vector.pre_state);
  accounts.get(1)!.preimages.clear(); // service 1 can't find its code now
  const gift: Transfer = { source: 0, dest: 1, amount: 100n, memo: new Uint8Array(128), gas: 10n };
  const round = accumulateRound(TINY, accounts, new Map(), entropy, 43, [], [gift]);
  const balance: bigint = round.accounts.get(1)!.info.balance; // the money, still
  assert.equal(balance, 227_714n + 100n);
  const used: bigint | undefined = round.used.get(1); // no code: no gas
  assert.equal(used, 0n);
  assert.deepEqual(round.transfers, []); // and nothing sent on
});
```

The first test follows the gift to the end: service 1's balance, its statistics (no
digests, one transfer, 61,711 gas) and the note its code wrote down, memo included. Bytes
12 to 16 of that note are the memo's first four: the service writes the sender (4 bytes)
and the amount (8) before it. The second test takes service 1's code away and delivers
by hand, with `accumulateRound`.

**Run, expect it to fail**

```sh
npm test
```

```text
...
✖ transfer_for_live_service-1: the block ends as the vector says (360.3ms)
...
✖ the gift arrives a round later: the money first, then service 1 runs (80.8ms)
✖ a transfer to a service with no code: the money arrives, and nothing runs (1.0ms)
...
ℹ tests 537
ℹ suites 0
ℹ pass 534
ℹ fail 3
...
test at test/accumulate.test.ts:184:1
✖ the gift arrives a round later: the money first, then service 1 runs (80.8ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected

  + 227714n
  - 227814n
...
```

Three red: the gift never arrives. Read the second: the receiver's balance is 227,714
where the vector has 227,814, the hundred that never came. These fail on an assertion,
not a missing name: the tests use only functions you already have, so the red is the
rule itself, missing.

## The code

First, a service's inputs: its transfers, then its operands.

**Replace in** `src/accumulate.ts`

```ts
import { accumulate, Transfer } from "./host.ts";

/**
 * Service s's share of a round (GP §12, Δ₁): its inputs, first the transfers sent to it,
 * then one operand for each of its digests, in order; and its gas: `free` gas, plus every
 * one of those transfers' and digests' gas. Each input starts with what it is: 1 for a
 * transfer, 0 for an operand.
 */
export function serviceInputs(
  reports: WorkReport[],
  s: number,
  free = 0n,
  transfers: Transfer[] = [],
) {
  const inputs: Bytes[] = [];
  let gas = free;
  for (const t of transfers.filter((t) => t.dest === s)) {
    inputs.push(concatBytes(Uint8Array.of(1), encode(Transfer, t)));
    gas += t.gas;
  }
  for (const report of reports) {
    for (const digest of report.results.filter((d) => d.service_id === s)) {
      const operand = {
        package_hash: report.package_spec.hash,
        exports_root: report.package_spec.exports_root,
        authorizer_hash: report.authorizer_hash,
        payload_hash: digest.payload_hash,
        gas: digest.accumulate_gas,
        result: digest.result,
        auth_trace: report.auth_output,
      };
      inputs.push(concatBytes(Uint8Array.of(0), encode(Operand, operand)));
      gas += digest.accumulate_gas;
    }
  }
  return { inputs, gas };
}
```

The new parameter has a default, `[]`, so every earlier caller still works unchanged.

Then a round. Three changes: the services a transfer is sent to run too, the money
arrives before anything else, and the round hands back what its services sent.

**Replace in** `src/accumulate.ts`

```ts
/**
 * Δ* (GP §12), one round: every service with work in `reports`, every always-accumulate
 * service, and every service a transfer is sent to, runs once from the same accounts and
 * keeps its own account as its run leaves it. The transfers' money arrives before its code
 * runs, even if it has none. Returns the accounts after the round, the gas each service
 * used, and the transfers they sent, service by service in order of id.
 */
export function accumulateRound(
  config: Config,
  accounts: Map<number, Account>,
  free: Map<number, bigint>, // χ_Z: the services that accumulate every block, and their gas
  entropy: Bytes,
  slot: number,
  reports: WorkReport[],
  transfers: Transfer[], // the transfers sent in the round before
) {
  const digests = reports.flatMap((r) => r.results);
  const ids = [...free.keys(), ...digests.map((d) => d.service_id)];
  const services = [...new Set([...ids, ...transfers.map((t) => t.dest)])].sort((x, y) => x - y);
  const after = copyAccounts(accounts);
  const used = new Map<number, bigint>();
  const sent: Transfer[] = [];
  for (const s of services) {
    const mine = copyAccounts(accounts); // every service starts from the same accounts
    const account = mine.get(s);
    const money = transfers.filter((t) => t.dest === s).reduce((n, t) => n + t.amount, 0n);
    if (account) account.info = { ...account.info, balance: account.info.balance + money };
    const code = account && codeOf(account);
    if (!code) {
      if (account) after.set(s, account); // no code to run: it keeps the money, that's all
      used.set(s, 0n);
      continue;
    }
    const { inputs, gas } = serviceInputs(reports, s, free.get(s) ?? 0n, transfers);
    const a = { id: s, accounts: mine, checkpoint: copyAccounts(mine), code, entropy, inputs };
    const result = accumulate(config, a, slot, gas);
    after.set(s, result.accounts.get(s)!);
    used.set(s, result.gasUsed);
    sent.push(...result.transfers);
  }
  return { accounts: after, used, transfers: sent };
}
```

Then the block: round after round, while there's anything to do.

**Replace in** `src/accumulate.ts`

```ts
/**
 * A block's accumulation (GP §12): the reports that can go now (R!, then what they and
 * the history unlock from the queue: R*) accumulate in a first round, and the transfers
 * each round sends are delivered in the next, until a round sends none (Δ+). Every
 * service that did anything gets its statistics and its last-accumulation slot; the
 * history ξ moves on one slot, and the reports still waiting go back into the queue ω.
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

  let accounts = state.accounts;
  let todo = all; // the first round: every report that can go,
  let free = state.free; // the always-accumulate services,
  let transfers: Transfer[] = []; // and no transfers yet
  const used = new Map<number, bigint>(); // G: gas, over every round
  const received = new Map<number, number>(); // T: transfers delivered
  while (todo.length + free.size + transfers.length > 0) {
    for (const t of transfers) received.set(t.dest, (received.get(t.dest) ?? 0) + 1);
    const round = accumulateRound(config, accounts, free, state.entropy, slot, todo, transfers);
    for (const [s, gas] of round.used) used.set(s, (used.get(s) ?? 0n) + gas);
    accounts = round.accounts;
    todo = []; // from now on, only transfers
    free = new Map();
    transfers = round.transfers;
  }
  const digests = all.flatMap((r) => r.results);
  const statistics = new Map<number, AccumulationStats>();
  for (const [s, gasUsed] of used) {
    const count = digests.filter((d) => d.service_id === s).length;
    const transfersIn = received.get(s) ?? 0;
    if (count === 0 && transfersIn === 0 && gasUsed === 0n) continue; // S(s) = (0, 0, 0)
    statistics.set(s, { count, transfers: transfersIn, gasUsed });
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

The `while` is Δ+. After the first round, `todo` and `free` are empty for good, so only
transfers can keep it going. And it always stops: a service in a later round has only the
gas its transfers brought, and every transfer it sends on costs at least 575 of that. So
each round has less gas to share than the one before.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ transfer_for_live_service-1: the block ends as the vector says (109.0ms)
...
✔ the gift arrives a round later: the money first, then service 1 runs (97.6ms)
✔ a transfer to a service with no code: the money arrives, and nothing runs (1.5ms)
...
✔ the reported packages: each one's hash and exports root, sorted by hash (280.6ms)
...
ℹ tests 537
ℹ suites 0
ℹ pass 537
ℹ fail 0
...
reported 537 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791739179951
...
```

## Watch it

`bin/accumulate.ts` shows each service's digests and gas; now it shows the transfers it
received too.

**Rewrite** `bin/accumulate.ts`

```ts
// Accumulates a test vector's block the way Part 17 does so far, and shows the queue: what
// waited, which packages went, what still waits; then each service next to the vector:
// the digests it accumulated, the transfers it received, and the gas it used.
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
const { state, statistics } = accumulateBlock(TINY, before, slot, reports);

const run = new Run("accumulate");
const short = (hash: string) => hash.slice(0, 10);
const went = [...state.accumulated.at(-1)!].map(short);
console.log(`slot ${slot}: ${reports.length} new report(s), ${before.ready.flat().length} waiting`);
console.log(`accumulated: ${went.join(", ") || "nothing"}`);
console.log(`still waiting: ${state.ready.flat().length}`);
run.event("block", { slot, went: went.join(", "), waiting: state.ready.flat().length });
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

**What flows through it.** The same block as [lesson 17.3](./03-sending-a-transfer.md)'s, this time whole: one
report for service 0, nothing waiting, and service 1 there to receive:

::: code-group

```json [what goes in]
{
  "input": {
    "slot": 43,
    "reports": [ {
      "package_spec": { "hash": "0x774935b629cc4251…" },
      "results": [ { "service_id": 0, "accumulate_gas": 400000 } ]
    } ]
  },
  "pre_state": {
    "ready_queue": [ [], [], [], [], [], [], [], [], [], [], [], [] ],
    "accounts": [ { "id": 0 }, { "id": 1, "data": { "service": { "balance": 227714 } } } ]
  }
}
```

```ts [what it computes]
// accumulateBlock's rounds for this block, as bin/accumulate.ts reads them back
const computed = {
  rounds: [
    { services: [0], operands: 1, transfersIn: 0, sent: 1 }, // round 1: service 0 runs its digest
    { services: [1], operands: 0, transfersIn: 1, sent: 0 }, // round 2: the transfer arrives
  ], // round 2 sent nothing, so Δ+ stops
  accumulated: ["0x774935b6…"], // the package that went, this slot's entry in ξ′
  waiting: 0, // nothing left in the ready queue
  balance1: 227_814n, // service 1's, 227,714 + 100: paid before its code ran
  statistics: {
    0: { count: 1, transfers: 0, gasUsed: 255_437n },
    1: { count: 0, transfers: 1, gasUsed: 61_711n }, // its run on the transfer
  },
};
```

```text [what comes out]
accumulated: 0x774935b6
service 0: 1 digest(s), 0 transfer(s), 255437 gas
service 1: 0 digest(s), 1 transfer(s), 61711 gas
```

:::

Round 1 runs service 0, which sends the transfer. Round 2 delivers it: the 100 into service
1's balance first, then service 1's code on its one transfer input. Round 3 would have
nothing to run, so there isn't one.

**Run**

```sh
npm pkg set scripts.accumulate-transfer="node bin/accumulate.ts ../vectors/stf/accumulate/tiny/transfer_for_live_service-1.json"
npm run accumulate-transfer
```

```text
slot 43: 1 new report(s), 0 waiting
accumulated: 0x774935b6
still waiting: 0
service 0: 1 digest(s), 0 transfer(s), 255437 gas
  the vector says: 1 digest(s), 0 transfer(s), 255437 gas
service 1: 0 digest(s), 1 transfer(s), 61711 gas
  the vector says: 0 digest(s), 1 transfer(s), 61711 gas
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=accumulate-1791739188404
```

Each service's line is next to the vector's in the *Accumulate* panel, on **7 · Accumulation and import**.

![Accumulate panel](./images/04-accumulate.png)

<details>
<summary>lasair: Δ+ calls itself, in <code>conformance/accumulate_stf.ml</code></summary>

The stop rule and the round:

```ocaml
    let n = List.length transfers + List.length round_reports
            + (if first then List.length always else 0) in
    if n = 0 then (state, gas_acc, stats_acc, yields_acc, n_acc)
    else begin
      let (state, used, stats, yields, new_transfers) =
        round state ~transfers ~first round_reports in
```

and, at the end of the round, the next one:

```ocaml
      let g' = Int64.sub (gas_add_u64 g (transfers_gas new_transfers)) used in
      go state g' new_transfers rest false
```

lasair writes Δ+ the way the Gray Paper does: as a function, `go`, that calls itself with
the transfers the round just sent. Your `while` loop is the same thing. `first` marks
round 1, the only one with the always-accumulate services. And `g'` is the gas budget your
first pass leaves out: what's left, plus the new transfers' gas, minus what the round
used.

</details>

## Check your understanding

::: check
**Why does the gift's block take two rounds?**

- [ ] Two services accumulate, and each needs a round of its own
  > No: one round can run many services. In `same_round_storage_isolation-1`, two ran
  > side by side in one.
- [x] Round 1 sends a transfer, round 2 delivers it, and round 2 sends nothing
  > Yes: a transfer arrives in the round after it was sent. Service 1 runs in round 2
  > with the gift and sends nothing, so there's no round 3.
- [ ] Service 0 used up round 1's gas
  > No: it used 255,437 of tiny's 20,000,000. The second round is for the transfer
  > alone.

**Service 1 receives the 100, then its code panics, with no checkpoint. Does it keep the 100?**

- [ ] No: a panic undoes everything, as it undid the sending in [lesson 17.3](./03-sending-a-transfer.md)
  > No: a panic undoes what the run itself did. The money went in before service 1's
  > code ran, so it's part of the state the run started from.
- [ ] No: the money goes back to service 0
  > No: nothing goes back. Service 0 paid in round 1, and its run is over.
- [x] Yes: the money arrives before the code runs
  > Yes: the amounts go into the balance first, and both the run and its checkpoint
  > start from there. The money would arrive even with no code at all.

**After the block, service 1's statistics are (0, 1, 61,711). Does its last-accumulation slot change?**

- [x] Yes: a service that only received a transfer still counts
  > Yes: no digests, one transfer, 61,711 gas in round 2. S(s) isn't (0, 0, 0), so
  > service 1 gets this block's slot.
- [ ] No: it accumulated no digests, so it didn't really accumulate
  > No: receiving a transfer is accumulating too. T counts the transfers, and any
  > S(s) that isn't (0, 0, 0) sets the slot.
- [ ] Only if the transfer brought more gas than it used
  > No: leftover gas doesn't come into it. What counts is that S(s) isn't (0, 0, 0).

**Why is Δ+ sure to stop?**

- [ ] A service may send only one transfer in a block
  > No: a run may send as many as it can pay for.
- [ ] The Gray Paper allows at most three rounds
  > No: there's no fixed number of rounds. Δ+ stops when a round sends nothing.
- [x] Each later round has less gas than the one before
  > Yes: after round 1, a service has only the gas its transfers brought, and every
  > transfer it sends on costs at least 575 of that. The gas shrinks, so the
  > transfers must stop.
:::

## What you have

A block's accumulation in rounds: transfers sent, carried over, and delivered, the money
before the code. Thirty-seven official vectors now match as whole blocks. Money is one
thing a service can hand on; [lesson 17.5](./05-privileges.md) turns to rights.

**Say it out loud.** Transfers arrive in the next round: the money first, then the receiver's code. So one block can take several rounds.

Next: [17.5 Privileges](./05-privileges.md)
