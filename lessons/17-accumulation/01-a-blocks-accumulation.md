# A block's accumulation

**In one sentence:** to accumulate a block, every validator runs each service the block
has work for, once, all from the same starting state, and writes down what each one did.

Here is one round from three real vectors. Step through it, and watch what each service
starts from and what it keeps.

<a id="try-it"></a>

<OneRound />

## The idea

[Part 16](../16-host-calls/index.md) ran one service at a time. A real block brings work
for many services at once, and every validator must accumulate all of it and reach the
same state. So which service goes first? And does the second see what the first wrote?

It doesn't matter, and it doesn't. The services run in a [*round*](../glossary.md#round),
like an exam: everyone starts from the same paper, and nobody sees a neighbour's answers.
Each service gets the accounts as they were before the round, and keeps its own account
as its run leaves it. Two services that each write a key in the same round can't read
each other's.

After the round, each service that did anything gets a tally: how many digests it
accumulated, how many transfers it received, how much gas it used. Those are its
[*accumulation statistics*](../glossary.md#accumulation-statistics). The block's slot goes
in its account record, as its
[*last-accumulation slot*](../glossary.md#last-accumulation-slot).

Not every report goes at once. One that names a
[*prerequisite*](../glossary.md#prerequisite), a work-package that must be accumulated
before it, waits.

This lesson accumulates a whole block, in its simplest form, and checks it against 29
official test vectors: every account, every statistic.

## What the Gray Paper says

One round is the paper's Δ\*, the parallelized accumulation function. Its body is long:
it also merges privileges, new and removed services and preimages, which later lessons
build. This lesson needs its first lines: 𝐬 (which services run), Δ(s) (each one run
once, from the same state 𝐞) and 𝐮 (the gas each used).

::: gray-paper 12.2 14-15

#### §12.2 Execution, continued

<a id="gp-12-2-p14"></a>We come to define the parallelized accumulation function $\Delta_*$ which, with the help of the single-service accumulation function $\Delta_1$, transforms an initial <abbr class="gp-term" title="the partial state a run of accumulate works on and hands back">state-context</abbr>, together with a sequence of deferred transfers, a sequence of work-reports and a dictionary of privileged always-accumulate services, into a tuple of the <abbr class="gp-term" title="after the change: the value once it is made, written with a prime (α′); for state, after the block">posterior</abbr> state-context, the resultant deferred-transfers and accumulation-output pairings, and the service-indexed gas usage. Note that for the privileges we employ a function $R$ which selects the service to which the manager service changed, or if no change was made, then that which the service itself changed to. This allows privileges to be `owned` and facilitates the removal of the manager service which we see as a helpful possibility. Formally:

<a id="gp-12-2-p15"></a><a id="eq-12-18"></a>

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
| <span id="gk-accpar" class="gk-wrap">$\Delta_*$</span> | Delta star | one round of accumulation: every service with work runs once, all from the same state, and their results are merged |
| <span id="gk-abracegroup">$\left\{ \begin{aligned}x\end{aligned} \right.$</span> | as follows | a brace grouping lines that hold together: for a function, its type on top, then what each input becomes |
| <span id="gk-tuple">$\!\left\lgroup x\right\rgroup\!$</span> | the tuple of | a record: named fields, each with its type, like an object in JSON |
| <span id="gk-partialstate" class="gk-wrap">$\mathbb{S}$</span> | S | a partial state: the parts of the state accumulation may change: accounts, next validators, authorizer queues and the privileges |
| <span id="gk-defxfers">$\left[\!\left[\mathbb{X}\right]\!\right]$</span> | a sequence of transfers | a list of deferred transfers, in order |
| <span id="gk-workreports">$\left[\!\left[\mathbb{R}\right]\!\right]$</span> | a sequence of work-reports | a list of work-reports, in order |
| <span id="gk-dictionary">$\left\langle\!\left\vert x\to y\right\vert\!\right\rangle$</span> | a dictionary from K to V | a map: keys of type K, each with one value of type V |
| <span id="gk-serviceid" class="gk-wrap">$\mathbb{N}_S$</span> | N sub S | a service id: a whole number below 2³², 4 bytes |
| <span id="gk-gas" class="gk-wrap">$\mathbb{N}_G$</span> | N sub G | an amount of gas: a u64 |
| <span id="gk-to">[$\to$](../symbols.md#to)</span> | to | what goes in, to what comes out: A → B takes an A and gives a B |
| <span id="gk-local-fnservouts">$B$</span> | B | the yields: a set of pairs (service, 32-byte hash) |
| <span id="gk-local-fngasused">$U$</span> | U | the gas used: a list of pairs (service, gas), one per run |
| <span id="gk-psX" class="gk-wrap">$\mathbf{e}$</span> | e | a partial state: the accounts, next validators, queues and privileges a run works on |
| <span id="gk-mapsto">$\mapsto$</span> | maps to | what a function gives back for an input: x ↦ y says x becomes y |
| <span id="gk-ps-accounts" class="gk-wrap">$\mathbf{d}$</span> | d | a partial state's service accounts, by service id |
| <span id="gk-ps-stagingset" class="gk-wrap">$\mathbf{i}$</span> | i | a partial state's next validators' keys, ι |
| <span id="gk-ps-authqueue" class="gk-wrap">$\mathbf{q}$</span> | q | a partial state's authorizer queues, ϕ: 80 hashes for each core |
| <span id="gk-ps-manager">$m$</span> | m | the manager service's id, χ_M |
| <span id="gk-ps-assigners" class="gk-wrap">$\mathbf{a}$</span> | a | each core's assigner service id, χ_A |
| <span id="gk-ps-delegator">$v$</span> | v | the delegator service's id, χ_V: it sets the next validators |
| <span id="gk-ps-registrar">$r$</span> | r | the registrar service's id, χ_R: it may create services at small ids |
| <span id="gk-ps-alwaysaccers" class="gk-wrap">$\mathbf{z}$</span> | z | the always-accumulate services with their free gas, χ_Z |
| <span id="gk-concatall">$\overparen{x}$</span> | all joined | every sequence in it, joined end to end into one |
| <span id="gk-set">$\left\{\,x\,\right\}$</span> | the set of | a set: values with no order and no repeats |
| <span id="gk-build">$\left\{ x \;\middle\vert\; y \right\}$</span> | for each, such that | built by a rule: the left-hand value, for every case the right-hand side allows (a set, or a sequence in order) |
| <span id="gk-wd-serviceindex">$s$</span> | s | the service the item was for, whose accumulate gets the result |
| <span id="gk-in">[$\in$](../symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-cup">$\cup$</span> | union | everything in either side |
| <span id="gk-keys">$\mathcal{K}\left(x\right)$</span> | K of | a dictionary's keys |
| <span id="gk-dx-dest">$d$</span> | d | a transfer's receiver: the service it goes to |
| <span id="gk-local-acc" class="gk-wrap">$\Delta$</span> | Delta | inside Δ\*: Δ(s) is service s's run in this round, Δ₁ with the round's inputs |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-accone" class="gk-wrap">$\Delta_1$</span> | Delta one | one service's accumulation: adds up its gas, lines up its inputs, transfers first, and runs its code with Ψ_A |
| <span id="gk-sq">[$\left[x\right]$](../symbols.md#sequence)</span> | the sequence | a sequence written out item by item; [ ] is the empty one |
| <span id="gk-ao-gasused">$u$</span> | u | the gas a run used |
| <span id="gk-orderedin">$\mathrel{\unicode{x2B40}}$</span> | in order, from | each item of the sequence, in its order |
| <span id="gk-ao-yield">$y$</span> | y | a run's yield: a 32-byte hash for the outside world, or nothing |
| <span id="gk-ne">$\ne$</span> | is not | not equal |
| <span id="gk-none" class="gk-wrap">$\emptyset$</span> | nothing | ∅: no value at all, like null |
| <span id="gk-ao-defxfers" class="gk-wrap">$\mathbf{t}$</span> | t | the transfers a run sent |
| <span id="gk-local-fnprovide">$I$</span> | I | preimage integration: files each provided blob in its service, if that service still waits for it |
| <span id="gk-setminus">$\setminus$</span> | without | the left side with every item of the right taken out |
| <span id="gk-bigcup">$\bigcup$</span> | the union over | everything in any of the sets it ranges over, together |
| <span id="gk-ao-provisions" class="gk-wrap">$\mathbf{p}$</span> | p | the preimages a run provided: pairs (service, blob) |
| <span id="gk-local-manpost" class="gk-wrap">$\mathbf{e}^*$</span> | e star | the state the manager's run left behind |
| <span id="gk-forall">$\forall$</span> | for all | for every value: ∀c ∈ ℕ_C means for each core c |
| <span id="gk-coreindex" class="gk-wrap">$\mathbb{N}_{\mathsf{C}}$</span> | N sub C | the core indices: 0 to C − 1 |

</details>

→ [(12.18) in plain words](./gray-paper.md#ex-12-18)

:::

After the block's rounds, the paper counts what each service did, and stamps the slot on
every service that did anything:

::: gray-paper 12.3 3-6

#### §12.3 Final State Integration, continued

<a id="gp-12-3-p3"></a>From this formulation, we also receive $n$, the total number of work-reports accumulated and $\mathbf{u}$, the gas used in the accumulation process for each service. We compose $\mathbf{S}$, our accumulation statistics, which is a mapping from the service indices which were accumulated to the amount of gas used throughout accumulation and the number of work-items and transfers accumulated. Formally:

<a id="gp-12-3-p4"></a><a id="eq-12-27"></a><a id="eq-12-28"></a>

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
| <span id="gk-N" class="gk-wrap">[$\mathbb{N}$](../symbols.md#naturals)</span> | N | the whole numbers: 0, 1, 2 and up; a subscript is a bound, ℕ₈ is 0 to 7 |
| <span id="gk-kv">$\left(x \mapsto y\right)$</span> | k maps to v | a dictionary entry: key k, value v |
| <span id="gk-len">$\left\vert x\right\vert$</span> | the size of | \|x\|: how many items x has, or how many bytes |
| <span id="gk-justbecameavailable" class="gk-wrap">$\mathbf{R}$</span> | R | the reports this block made available: ready to accumulate |
| <span id="gk-sum">$\sum$</span> | the sum of | add up what follows, once for each value the subscript ranges over |

</details>

→ [(12.27), (12.28) in plain words](./gray-paper.md#ex-12-27)

<a id="gp-12-3-p5"></a>The second intermediate state $\delta^\ddagger$ may then be defined with the last-accumulation record being updated for all accumulated services:

<a id="gp-12-3-p6"></a><a id="eq-12-29"></a><a id="eq-12-30"></a>

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
| <span id="gk-accountspostacc" class="gk-wrap">$\delta^\dagger$</span> | delta dagger | the service accounts right after accumulation, before slots are stamped and the block's preimages filed |
| <span id="gk-sa-lastacc">$a$</span> | a | the slot the service last accumulated at |
| <span id="gk-thetime" class="gk-wrap">$\tau$</span> | tau | the time: the latest block's timeslot |

</details>

→ [(12.29), (12.30) in plain words](./gray-paper.md#ex-12-29)

:::

§12 is four steps:

1. **Which reports go now.** Of the reports that just became available ([lesson 11.1](../11-assurances/01-available.md)),
   the ones with no prerequisites, and no segment-root lookups (another kind of
   dependency), are accumulated straight away. The rest wait in a queue: [lesson 17.2](./02-waiting-reports.md).
2. **Which services run.** Every service named by a digest in those reports, plus the
   always-accumulate services, which run every block on free gas ([lesson 16.7](../16-host-calls/07-a-services-inputs.md)).
3. **One round.** Each service runs once, with its inputs and gas from [lesson 16.7](../16-host-calls/07-a-services-inputs.md),
   through [lesson 16.6](../16-host-calls/06-checkpoints.md)'s Ψ_A. All of them start from the same accounts, and each one keeps
   its own account as its run leaves it.
4. **Afterwards.** Every service that did anything (accumulated a digest, or used gas)
   gets its statistics, and its last-accumulation slot becomes this block's slot.

A service with a digest but no code to run (its code's preimage isn't there) runs nothing
and uses no gas. Its digest still counts.

Step 1's reports come at the end of a long trip: guaranteed onto a core, vouched for by
the validators, made available. [Lesson 11.2](../11-assurances/02-timeouts.md) walks one
report through that trip, block by block, until it lands here.

The Gray Paper's names for those steps:

| Here | Gray Paper |
| --- | --- |
| the reports in step 1 | **R!** |
| one round | **Δ\***, parallel accumulation |
| one service's part of it ([lesson 16.7](../16-host-calls/07-a-services-inputs.md)) | **Δ₁** |
| the statistics | **S(s) = (N(s), T(s), G(s))** |
| the last-accumulation slot | an account's **a**, set to **τ′** |

[The round at the top](#try-it) is these steps on three real vectors: two services that
can't read each other, a service with no code, and an always-accumulate service with no
digest.

## The tests

The vector's statistics have more fields now:

**Replace in** `test/accumulate.test.ts`

```ts
/** The parts of an accumulate test vector these tests read. */
type Vector = {
  input: { slot: number; reports: unknown[] };
  pre_state: {
    entropy: string;
    privileges: { always_acc: { id: number; gas: number }[] };
    accounts: {
      id: number;
      data: AccountJson & {
        service: { code_hash: string };
        preimage_blobs: { hash: string; blob: string }[];
      };
    }[];
  };
  post_state: {
    statistics: { id: number; record: Record<string, number> }[];
    accounts: { id: number; data: AccountJson }[];
  };
};
```

**Add to** `test/accumulate.test.ts`

```ts
import { accumulateBlock } from "../src/accumulate.ts";

/** Checks the whole block of test vector `name`: every account, and every service's stats. */
function checkBlock(name: string) {
  const vector = vectorJson(`stf/accumulate/tiny/${name}.json`) as Vector;
  const pre = vector.pre_state;
  const accounts = new Map(pre.accounts.map((a) => [a.id, accountFromJson(a.data)]));
  const free = new Map(pre.privileges.always_acc.map((x) => [x.id, BigInt(x.gas)]));
  const entropy = fromHex(pre.entropy);
  const reports = reportsOf(vector);
  const result = accumulateBlock(TINY, accounts, free, entropy, vector.input.slot, reports);
  const post = vector.post_state;
  const expected = new Map(post.accounts.map((a) => [a.id, accountFromJson(a.data)]));
  assert.deepEqual(result.accounts, expected);
  const stats = post.statistics.map(({ id, record: r }) => {
    const gasUsed = BigInt(r.accumulate_gas_used);
    return [id, { count: r.accumulate_count, transfers: r.accumulate_transfer_count, gasUsed }];
  });
  assert.deepEqual(result.statistics, new Map(stats as [number, unknown][]));
}

/** The vectors whose whole block needs nothing beyond this lesson. */
const BLOCK_CASES = [
  "always_accumulate-1", "always_accumulate-2", "enqueue_and_unlock_chain-1",
  "enqueue_and_unlock_chain-2", "enqueue_and_unlock_chain_wraps-1",
  "enqueue_and_unlock_chain_wraps-2", "enqueue_and_unlock_chain_wraps-3",
  "enqueue_and_unlock_chain_wraps-4", "enqueue_and_unlock_simple-1",
  "enqueue_and_unlock_with_sr_lookup-1", "enqueue_self_referential-1",
  "enqueue_self_referential-2", "enqueue_self_referential-3", "enqueue_self_referential-4",
  "lookup_foreign_preimage-1", "lookup_foreign_preimage-2", "no_available_reports-1",
  "preimage_len_bound-1", "preimage_len_bound-2", "preimage_len_bound-3",
  "process_one_immediate_report-1", "queues_are_shifted-1", "queues_are_shifted-2",
  "ready_queue_editing-1", "ready_queue_editing-2", "same_code_different_services-1",
  "same_round_storage_isolation-1", "same_round_storage_isolation-2",
  "work_for_ejected_service-1",
];

for (const name of BLOCK_CASES) {
  test(`${name}: the block ends as the vector says`, () => checkBlock(name));
}
```

`checkBlock` compares everything the vector records about the block's accounts: every
account, not only the ones that ran (the others must come out untouched), and every
service's statistics. Several vectors in the list have reports with prerequisites. They
pass only if those reports are left alone.

## The code

**Add to** `src/accumulate.ts`

```ts
import { toHex } from "./bytes.ts";
import type { Config } from "./config.ts";
import { accumulate } from "./host.ts";
import type { ServiceCode } from "./pvm/program.ts";
import { unpackCode } from "./pvm/program.ts";
import type { Account } from "./services.ts";
import { copyAccounts } from "./services.ts";

/** A service's code (GP §9, a_c): its preimage of its own code hash, unpacked. */
function codeOf(account: Account): ServiceCode | undefined {
  const preimage = account.preimages.get(toHex(account.info.code_hash));
  return preimage && unpackCode(preimage);
}

/**
 * S(s) (GP §12): what accumulation did for one service in a block: how many digests it
 * accumulated (N), how many transfers it received (T), and the gas it used (G).
 */
export type AccumulationStats = { count: number; transfers: number; gasUsed: bigint };

/**
 * A block's accumulation, at its simplest (GP §12): the reports with no prerequisites
 * (R!) are accumulated in one round (Δ*). Each service runs once, from the same accounts,
 * and keeps its own account as it leaves it. Every service that did anything then gets its
 * statistics, and its last-accumulation slot set to this block's.
 */
export function accumulateBlock(
  config: Config,
  accounts: Map<number, Account>,
  free: Map<number, bigint>, // χ_Z: the services that accumulate every block, and their gas
  entropy: Bytes,
  slot: number,
  reports: WorkReport[],
) {
  const now = reports.filter(
    (r) => r.context.prerequisites.length === 0 && r.segment_root_lookup.length === 0,
  );
  const digests = now.flatMap((r) => r.results);
  const services = new Set([...free.keys(), ...digests.map((d) => d.service_id)]);
  const after = copyAccounts(accounts);
  const statistics = new Map<number, AccumulationStats>();
  for (const s of services) {
    const count = digests.filter((d) => d.service_id === s).length;
    const account = accounts.get(s);
    const code = account && codeOf(account);
    let gasUsed = 0n;
    if (code) {
      const { inputs, gas } = serviceInputs(now, s, free.get(s) ?? 0n);
      const mine = copyAccounts(accounts); // every service starts from the same accounts
      const checkpoint = copyAccounts(accounts);
      const a = { id: s, accounts: mine, checkpoint, code, entropy, inputs };
      const result = accumulate(config, a, slot, gas);
      after.set(s, result.accounts.get(s)!);
      gasUsed = result.gasUsed;
    } // no code to run (or no such service): it used no gas, but its digests still count
    if (count > 0 || gasUsed > 0n) statistics.set(s, { count, transfers: 0, gasUsed });
  }
  for (const s of statistics.keys()) {
    const account = after.get(s);
    if (account) account.info.last_accumulation_slot = slot;
  }
  return { accounts: after, statistics };
}
```

`codeOf` finds a service's code where the Gray Paper keeps it: among its own preimages,
under its code hash. `accumulateBlock` is the four steps in order. Each service gets a
fresh copy of the starting accounts: that is all "the same starting state" takes. `after`
collects each one's own account as it comes back.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ always_accumulate-1: the block ends as the vector says (8.8ms)
...
✔ same_round_storage_isolation-2: the block ends as the vector says (14.6ms)
...
✔ the reported packages: each one's hash and exports root, sorted by hash (205.5ms)
...
ℹ tests 515
ℹ suites 0
ℹ pass 515
ℹ fail 0
...
reported 515 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791738801360
...
```

## Watch it

`bin/accumulate.ts` now accumulates the whole block:

**Rewrite** `bin/accumulate.ts`

```ts
// Accumulates a test vector's block the way lesson 17.1 does, and shows what each service
// did next to what the vector says: its digests, the gas it used, its storage.
// Usage: npm run accumulate [vector], same_round_storage_isolation-1 if not given

import { readFileSync } from "node:fs";
import { accumulateBlock } from "../src/accumulate.ts";
import { fromHex, toHex } from "../src/bytes.ts";
import { TINY } from "../src/config.ts";
import { Run } from "../src/obs.ts";
import type { AccountJson } from "../src/services.ts";
import { accountFromJson } from "../src/services.ts";
import { WorkReport } from "../src/work.ts";

type Stat = { id: number; record: { accumulate_count: number; accumulate_gas_used: number } };

const DEFAULT = "../vectors/stf/accumulate/tiny/same_round_storage_isolation-1.json";
const vector = JSON.parse(readFileSync(process.argv[2] ?? DEFAULT, "utf8"));
const pre = vector.pre_state;
const json: { id: number; data: AccountJson }[] = pre.accounts;
const accounts = new Map(json.map((a) => [a.id, accountFromJson(a.data)]));
const always: { id: number; gas: number }[] = pre.privileges.always_acc;
const free = new Map(always.map((x) => [x.id, BigInt(x.gas)]));
const reports = vector.input.reports.map((r: unknown) => WorkReport.fromJson(r));
const slot = vector.input.slot;
const result = accumulateBlock(TINY, accounts, free, fromHex(pre.entropy), slot, reports);

const run = new Run("accumulate");
console.log(`${reports.length} report(s) at slot ${slot}: ${result.statistics.size} service(s)`);
for (const [s, { count, gasUsed }] of result.statistics) {
  const theirs = (vector.post_state.statistics as Stat[]).find((x) => x.id === s)?.record;
  const storage = [...result.accounts.get(s)!.storage].map(([k, v]) => `${k} = ${toHex(v)}`);
  console.log(`service ${s}: ${count} digest(s), ${gasUsed} gas`);
  const said = `${theirs?.accumulate_count} digest(s), ${theirs?.accumulate_gas_used} gas`;
  console.log(`  the vector says: ${said}`);
  console.log(`  storage: ${storage.join(", ") || "empty"}`);
  const expected = theirs?.accumulate_gas_used;
  run.event("service", { s, count, used: Number(gasUsed), expected, storage: storage.join(", ") });
}
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

**What flows through it.** The default vector again, now as a block: both of its reports,
one round, and what `accumulateBlock` hands back.

::: code-group

```json [what goes in]
{
  "input": { "slot": 43, "reports": [
    { "context": { "prerequisites": [] }, "segment_root_lookup": [],
      "results": [ { "service_id": 1729, "accumulate_gas": 200000,
                     "result": { "ok": "0x033fde3d" } } ] },
    { "context": { "prerequisites": [] }, "segment_root_lookup": [],
      "results": [ { "service_id": 1730, "accumulate_gas": 200000,
                     "result": { "ok": "0x66726561643ac10600006c617374" } } ] }
  ] },
  "pre_state": {
    "privileges": { "always_acc": [] },
    "entropy": "0xae85d6635e9a…",
    "accounts": [ "… 1729 and 1730, both with the code 0xfd3f1355… …" ]
  }
}
```

```ts [what it computes]
// accumulateBlock's result: one round, every service starting from the same accounts
const computed = {
  services: [1729, 1730], // the digests' service ids; always_acc adds none
  statistics: {
    1729: { count: 1, transfers: 0, gasUsed: 29_643n }, // S(1729): N, T and G
    1730: { count: 1, transfers: 0, gasUsed: 34_413n }, // S(1730)
  },
  storage: {
    1729: { "0x6c617374": "0x033fde3d" }, // "last": its digest's result
    1730: { "0x6672656164": "0x00" }, // "fread": 1729's "last" read, from before 1729 wrote it
  },
  lastAccumulationSlot: 43, // set in both accounts: each accumulated in this block
};
```

```text [what comes out]
2 report(s) at slot 43: 2 service(s)
service 1729: 1 digest(s), 29643 gas
service 1730: 1 digest(s), 34413 gas
  storage: 0x6672656164 = 0x00
```

:::

That vector is the bin's default, `../vectors/stf/accumulate/tiny/same_round_storage_isolation-1.json`.
1730's digest asks it to read 1729's `last` key. Every service starts from the accounts
as they were, so it finds nothing and stores 0x00. 1729 stores its own result. Each keeps
its own account, and the gas of both matches the vector.

**Run**

```sh
npm run accumulate
```

```text
2 report(s) at slot 43: 2 service(s)
service 1729: 1 digest(s), 29643 gas
  the vector says: 1 digest(s), 29643 gas
  storage: 0x6c617374 = 0x033fde3d
service 1730: 1 digest(s), 34413 gas
  the vector says: 1 digest(s), 34413 gas
  storage: 0x6672656164 = 0x00
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=accumulate-1791738806530
```

Try `npm run accumulate ../vectors/stf/accumulate/tiny/same_code_different_services-1.json`:
service 1730 has a digest but no code of its own, so it shows 1 digest and 0 gas, just as
the vector does. The *Accumulate* panel, on the **7 · Accumulation and import** dashboard (where all of
[Part 17](./index.md)'s panels are), lines the services up.

![Accumulate panel](./images/01-accumulate.png)

<details>
<summary>lasair: one round, in <code>conformance/accumulate_stf.ml</code></summary>

```ocaml
  (* accpar (eq. accpar): s = the digests' services UNION keys(f) UNION the
     transfers' destinations, ascending; every accone reads the round's
     pre-state d. The posterior is P((d UNION n) \ m, provisions), with n
     each invoked service's own posterior record plus the services it
     created, and m the ids of d its invocation removed. *)
```

The same round, with the parts this lesson leaves for later: transfers' destinations join
the services that run, new services join the accounts (n), removed ones leave them (m), and
provided preimages land at the end (the Gray Paper's I; lasair calls it P). "Every accone reads the round's pre-state d" is
your fresh copy for each service.

</details>

## Check your understanding

::: check
**Refine and accumulate both run a service's code on the PVM. Who runs each?**

- [ ] Every validator runs both, at import
  > No: refine stays off the chain, on a core. Only its report reaches the block.
- [x] A core's guarantors refine, and auditors check them. Every validator accumulates, at import
  > Yes: the heavy work on a few machines, the light work on all of them.
- [ ] The block's author runs both, and the others trust it
  > No: every validator accumulates for itself, or it couldn't check the state root.

**In `same_round_storage_isolation-1`, services 1729 and 1730 accumulate in one round. Can 1730 read the key 1729 writes?**

- [ ] Yes: 1729 has the lower id, so it runs first, and 1730 sees its write
  > No: the order makes no difference. Each service gets its own fresh copy of the
  > accounts as they were before the round, so neither sees what the other writes.
- [x] No: both start from the accounts as they were before the round
  > Yes: that's what a round is. Each keeps its own account as its run leaves it, and
  > the round puts those together afterwards: 1729 with its key, 1730 with its own.
- [ ] Only once 1729 has halted and its write is saved
  > No: the runs' accounts are put together after the whole round, too late for
  > 1730's run, which started from the same accounts as 1729's.

**In `same_code_different_services-1`, service 1730 has a digest but no code to run. What do its statistics say?**

- [ ] Nothing: it ran nothing, so it gets no statistics
  > No: a digest counts even when nothing runs. 1730 accumulated one, so it gets
  > statistics, and its last-accumulation slot becomes 43, the block's.
- [ ] Nothing: the block is invalid, with a digest for a service that has no code
  > No: the block is fine. A service whose code's preimage isn't there simply runs
  > nothing.
- [x] One digest, no transfers, 0 gas
  > Yes: (1, 0, 0). It used no gas because nothing ran, but its digest still counts,
  > and its last-accumulation slot becomes 43.

**Which of a block's newly available reports does step 1 accumulate straight away?**

- [x] Those with no prerequisites and no segment-root lookups
  > Yes: a report with either kind of dependency must wait for other work to go first.
  > It waits in a queue: [lesson 17.2](./02-waiting-reports.md).
- [ ] All of them, in the order they became available
  > No: a report that names a prerequisite waits until that package has been
  > accumulated. Several vectors pass here only because those reports are left alone.
- [ ] Those whose service has enough balance to pay for the gas
  > No: balance doesn't come into it. What decides is whether the report depends on
  > other work.

**`always_accumulate-1` has no reports at all. Does service 1729, an always-accumulate service, run?**

- [ ] No: with no digest, it has nothing to do
  > No: an always-accumulate service runs every block, digests or not. That's its
  > privilege.
- [x] Yes, on its free gas
  > Yes: it has 100,000 free gas, uses 16,417 of it, and gets the statistics (0, 0,
  > 16,417) and slot 43.
- [ ] Yes, but free gas only tops up its digests' gas, so with none it uses 0
  > No: free gas is gas in its own right. 1729 runs on its 100,000 with no digest at
  > all.
:::

## What you have

A whole block's accumulation, in its simplest form, matching 29 official vectors on every
account and every statistic. Every service in a round starts from the same accounts, so
none sees what another does in it. Reports with prerequisites were left alone:
[lesson 17.2](./02-waiting-reports.md) gives them a queue to wait in.

Next: [17.2 Waiting reports](./02-waiting-reports.md)
