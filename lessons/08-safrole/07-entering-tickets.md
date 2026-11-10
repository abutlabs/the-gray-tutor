# Entering tickets

The lottery has run without anyone entering it: a ticket's id is a VRF output, which
[lesson 8.6](./06-the-vrf-output.md) can read now. This lesson lets tickets in: it checks a block's tickets as the
Gray Paper says, refuses the block if they break a rule, and merges the good ones into the
lottery. By the end your client runs Safrole for every safrole vector but two.

## New words

- **Attempt, attempts allowed.** n. Which of its tickets a validator is entering, from 0 up
  to n − 1; n = ⌈2E / |γ′_P|⌉ is how many it may enter. *Example:* 4 each on tiny,
  attempts 0 to 3; 2 each on full.

It's in the [glossary](../glossary.md). A block that breaks a rule is a *rejected block*,
as in [lesson 11.3](../11-assurances/03-bad-assurances.md), and the vectors give its error name.

## What the Gray Paper says

::: gray-paper 6.7

#### §6.7 The Extrinsic and Tickets {#gp-6-7}

<a id="gp-6-7-p1"></a>The extrinsic $\mathbf{E}_T$ is a sequence of proofs of valid tickets; a ticket implies an entry in our epochal “contest” to determine which validators are privileged to author a block for each timeslot in the following epoch. Tickets specify an entry index (a natural number less than the maximum number of ticket entries per validator, defined in equation [6.30](#eq-6-30)) together with a proof of ticket's validity. The proof implies a <abbr class="gp-term" title="a ticket's 32-byte random id, the output of its ring proof; lower wins">ticket identifier</abbr>, a high-entropy <abbr class="gp-term" title="nobody, not even its maker, can steer the value">unbiasable</abbr> 32-octet sequence, which is used both as a score in the aforementioned contest and as input for the block's entropy source $\text{VRF}$ signature.

<a id="gp-6-7-p2"></a>Towards the end of the epoch (i.e.  $\mathsf{Y}$ slots from the start) this contest is closed implying successive blocks within the same epoch must have an empty tickets extrinsic. At this point, the following epoch's <abbr class="gp-term" title="who may seal each slot of an epoch: E tickets, or E keys">slot-sealer sequence</abbr> becomes fixed.

<a id="gp-6-7-p3"></a>We define the extrinsic as a sequence of proofs of valid tickets, each of which is a tuple of an entry index and a proof of ticket validity. To ensure the accumulator can be saturated, when there are fewer validators, each validator is permitted more tickets. Formally:

<a id="gp-6-7-p4"></a><a id="eq-6-30"></a><a id="eq-6-31"></a>

$$
\begin{align}
\begin{split}
\mathbf{E}_T &\in \left[\!\left[\!\left\lgroup
e\in \mathbb{N}_{n},\,
p\in \overset{\circ}{\mathbb{V}}_{\gamma_Z'}^{\left[\right]}\left\langle\mathsf{X}_T \frown \eta'_2 \mathbin{+\!\!+} e\right\rangle
\right\rgroup\!\right]\!\right]_{} \\
&\phantom{{}\in{}}  \text{where } n = \left\lceil\frac{2\mathsf{E}}{\left\vert\gamma_P'\right\vert}\right\rceil
\end{split} \tag{6.30} \\
\left\vert\mathbf{E}_T\right\vert &\le \begin{cases}
\mathsf{K} &\text{if } m' < \mathsf{Y} \\
0 &\text{otherwise}
\end{cases} \tag{6.31}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-xttickets" class="gk-wrap">$\mathbf{E}_T$</span> | E sub T | the tickets bag: entries to the block-sealing lottery |
| <span id="gk-in">[$\in$](../symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-sequence">[$\left[\!\left[x\right]\!\right]$](../symbols.md#sequence)</span> | a sequence of | ⟦T⟧ is an array of T; a subscript is its length, :n at most n, n: at least n |
| <span id="gk-tuple">$\!\left\lgroup x\right\rgroup\!$</span> | the tuple of | a record: named fields, each with its type, like an object in JSON |
| <span id="gk-isa">[$x\in y$](../symbols.md#in)</span> | in | belongs to: the field's type |
| <span id="gk-xt-entryindex">$e$</span> | e | an entered ticket's attempt number, 0 to n − 1: which of its maker's tickets this is |
| <span id="gk-Nmax">[$\mathbb{N}_{x}$](../symbols.md#naturals)</span> | N sub n | the whole numbers below n: ℕ_C is a core index, 0 to C − 1 |
| <span id="gk-xt-proof">$p$</span> | p | an entered ticket's ring proof: 784 bytes proving a pending validator made it, without saying which |
| <span id="gk-bsringproof">$\overset{\circ}{\mathbb{V}}_{x}^{z}\left\langle y\right\rangle$</span> | V ring sub r, context c, of m | a ring proof: signed by some key in the ring with root r, without saying which: 784 bytes |
| <span id="gk-epochroot" class="gk-wrap">$\gamma_Z$</span> | gamma Z | the ring root of the pending validators' Bandersnatch keys: 144 bytes a ticket's proof is checked against |
| <span id="gk-Xticket" class="gk-wrap">$\mathsf{X}_T$</span> | X sub T | the context of a ticket and its seal: the bytes of "jam_ticket_seal" |
| <span id="gk-concat" class="gk-wrap">[$\frown$](../symbols.md#concat)</span> | concatenate | join: the left sequence followed by the right |
| <span id="gk-entropy" class="gk-wrap">$\eta$</span> | eta | entropy: four 32-byte values of randomness, the newest mixing in every block |
| <span id="gk-append">[$\mathbin{+\!\!+}$](../symbols.md#concat)</span> | append | add one item at the end of the sequence |
| <span id="gk-sq">[$\left[x\right]$](../symbols.md#sequence)</span> | the sequence | a sequence written out item by item; [ ] is the empty one |
| <span id="gk-ceil">$\left\lceil x\right\rceil$</span> | ceiling of | rounded up to a whole number |
| <span id="gk-frac">$\frac$</span> | over | a fraction: the top divided by the bottom |
| <span id="gk-Cepochlen" class="gk-wrap">$\mathsf{E}$</span> | E | an epoch's length in slots: 600 on full, 12 on tiny |
| <span id="gk-len">$\left\vert x\right\vert$</span> | the size of | \|x\|: how many items x has, or how many bytes |
| <span id="gk-pendingset" class="gk-wrap">$\gamma_P$</span> | gamma P | the pending validators: the key sets that become active at the next epoch |
| <span id="gk-le">$\le$</span> | at most | less than or equal to |
| <span id="gk-Cmaxblocktickets" class="gk-wrap">$\mathsf{K}$</span> | K | the most tickets one block may carry: 16 on full, 3 on tiny |
| <span id="gk-Cepochtailstart" class="gk-wrap">$\mathsf{Y}$</span> | Y | the slot of an epoch at which the ticket lottery closes: 500 on full, 10 on tiny |

</details>

→ [(6.30), (6.31) in plain words](./gray-paper.md#ex-6-30)

<a id="gp-6-7-p5"></a>We define $\mathbf{n}$ as the sequence of new tickets, with the ticket identifier, a hash, defined as the output component of the Bandersnatch RingVRF proof:

<a id="gp-6-7-p6"></a><a id="eq-6-32"></a>

$$
\begin{align}
\mathbf{n} &\equiv \left[
\left(
y\mathrel{\unicode{x2AF6}}\mathcal{Y}\left(i_{p}\right),\,
e\mathrel{\unicode{x2AF6}} i_{e}
\right)
\;\middle\vert\;
i \mathrel{\unicode{x2B40}} \mathbf{E}_T
\right] \tag{6.32}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-build">$x \;\middle\vert\; y$</span> | for each, such that | built by a rule: the left-hand value, for every case the right-hand side allows (a set, or a sequence in order) |
| <span id="gk-is">$x\mathrel{\unicode{x2AF6}} y$</span> | is a | names a field and gives its type, in a tuple |
| <span id="gk-st-id">$y$</span> | y | a ticket's id: 32 random bytes, the output of its ring proof; a lower id wins |
| <span id="gk-banderout">$\mathcal{Y}\left(x\right)$</span> | Y of | the 32-byte random output a Bandersnatch signature or proof carries, used as entropy |
| <span id="gk-orderedin">$\mathrel{\unicode{x2B40}}$</span> | in order, from | each item of the sequence, in its order |

</details>

→ [(6.32) in plain words](./gray-paper.md#ex-6-32)

<a id="gp-6-7-p7"></a>The tickets submitted via the extrinsic must already have been placed in order of their implied identifier. Duplicate identifiers are never allowed lest a validator submit the same ticket multiple times:

<a id="gp-6-7-p8"></a><a id="eq-6-33"></a><a id="eq-6-34"></a>

$$
\begin{align}
\mathbf{n} &= \left[x \in \mathbf{n}\,\wr\!\wr\,x_{y}\right] \tag{6.33} \\
\left\{\,  x_{y}  \;\middle\vert\;  x \in \mathbf{n} \,\right\} &\mathrel{\unicode{x2AEF}} \left\{\,  x_{y}  \;\middle\vert\;  x \in \gamma_A \,\right\} \tag{6.34}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-sqorderuniqby">$\left[y\,\wr\!\wr\,x\right]$</span> | sorted, no repeats, by | sorted by the key on the right, each key once |
| <span id="gk-set">$\left\{\,x\,\right\}$</span> | the set of | a set: values with no order and no repeats |
| <span id="gk-disjoint">$\mathrel{\unicode{x2AEF}}$</span> | share nothing with | the two sides have no item in common |
| <span id="gk-ticketaccumulator" class="gk-wrap">$\gamma_A$</span> | gamma A | the ticket lottery: the best tickets entered so far for the next epoch, at most E, lowest id first |

</details>

→ [(6.33), (6.34) in plain words](./gray-paper.md#ex-6-33)

<a id="gp-6-7-p9"></a>The new ticket accumulator $\gamma_A'$ is constructed by merging new tickets into the previous accumulator value (or the empty sequence if it is a new epoch):

<a id="gp-6-7-p10"></a><a id="eq-6-35"></a>

$$
\begin{equation}
\begin{aligned}
\gamma_A' &\equiv  {\overrightarrow{\left[x \in \mathbf{n} \cup \begin{cases} \emptyset\ &\text{if } e' > e \\ \gamma_A\ &\text{otherwise} \end{cases}\,\wr\,x_{y}\right]~}}^{\mathsf{E}} \\
\end{aligned} \tag{6.35}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-overrightarrow">$\overrightarrow$</span> | the first n of | with a number above: keep only the leftmost n items |
| <span id="gk-sqorderby">$\left[y\,\wr\,x\right]$</span> | sorted by | the sequence's items, sorted by the key on the right |
| <span id="gk-cup">$\cup$</span> | union | everything in either side |
| <span id="gk-none" class="gk-wrap">$\emptyset$</span> | nothing | ∅: no value at all, like null |

</details>

→ [(6.35) in plain words](./gray-paper.md#ex-6-35)

<a id="gp-6-7-p11"></a>The maximum size of the ticket accumulator is $\mathsf{E}$. On each block, the accumulator becomes the lowest items of the sorted union of tickets from prior accumulator $\gamma_A$ and the submitted tickets. It is invalid to include useless tickets in the extrinsic, so all submitted tickets must exist in their <abbr class="gp-term" title="after the change: the value once it is made, written with a prime (α′); for state, after the block">posterior</abbr> ticket accumulator. Formally:

<a id="gp-6-7-p12"></a><a id="eq-6-36"></a>

$$
\begin{align}
\mathbf{n} \subseteq \gamma_A' \tag{6.36}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-subseteq">$\subseteq$</span> | is a subset of | everything in the left is in the right |

</details>

→ [(6.36) in plain words](./gray-paper.md#ex-6-36)

<a id="gp-6-7-p13"></a>Note that it can be shown that in the case of an empty extrinsic $\mathbf{E}_T = \left[\right]$, as implied by $m' \ge \mathsf{Y}$, and unchanged epoch ($e' = e$), then $\gamma_A' = \gamma_A$.

:::

In plain words, §6.7, *The Extrinsic and Tickets*. A block's tickets extrinsic is a list of (attempt, ring
proof). In plain steps:

1. **Only while the lottery is open, and only K at a time.** Once the block's phase m′ is
   Y or more, the block may bring no tickets; before that, at most K (3 on tiny, 16 on
   full).
2. **Each validator may enter n tickets**, attempts 0 to n − 1, where
   n = ⌈2E / |γ′_P|⌉: enough for the validators to fill the lottery twice over. Fewer
   validators get more tickets each: on tiny, ⌈24 / 6⌉ = 4; on full, ⌈1200 / 1023⌉ = 2.
3. **Each ticket's id is 𝒴 of its proof** ([lesson 8.6](./06-the-vrf-output.md)).
4. **The ids go strictly up**, in the order the block lists them, so no ticket comes twice.
5. **None is in the lottery already.**
6. **The lottery keeps the E lowest ids** of its old tickets and the new ones together; at
   a new epoch it starts empty.

Steps 1, 2 and 6 are three different caps, and two of them both read as "max tickets": n
is what one *validator* may make for the epoch, K is what one *block* may carry. Here are
the numbers side by side. Flip to full and step the blocks to see the whole supply flow
through the pipe:

<TicketBudget />

The test vectors name what's broken: `bad_slot` (the block's slot isn't after the last
one's, from [lesson 7.1](../07-time-and-shuffling/01-epochs.md)), `unexpected_ticket` (step 1), `bad_ticket_attempt` (step 2),
`bad_ticket_order` (step 4), `duplicate_ticket` (step 5). The Gray Paper itself names no
errors: a block that breaks a rule is simply invalid.

<TicketRules />

Two honest notes. The vectors' README still says each validator gets 3 tickets; Gray Paper
0.8.0 changed that to n (pull request 514), and the vectors follow the paper. And step 3
has a second half, the proof itself must check out against the ring root, which needs
Bandersnatch's arithmetic: [lesson 8.8](./08-the-ring-root.md). Until then a forged proof gets in, and the two
`bad_ticket_proof` vectors wait.

## The tests

Blocks with tickets get a test of their own. [Lesson 8.5](./05-one-step-of-safrole.md)'s still skips them, and its
comment says why it had to: that half of the job was waiting for Bandersnatch.

**Add to** `test/safrole.test.ts`

```ts
import { safroleError } from "../src/safrole.ts";
import { TicketEnvelope } from "../src/block.ts";

test("blocks with tickets: each joins the lottery, which keeps the E lowest ids", () => {
  let steps = 0;
  for (const { config, name, vector } of acceptedVectors()) {
    const { input, pre_state, post_state } = vector;
    if (input.extrinsic.length === 0) continue; // the test above has those
    const entered: TicketEnvelope[] = input.extrinsic.map((t) => TicketEnvelope.fromJson(t));
    const before: Safrole = safroleFromJson(pre_state);
    const error: string | null = safroleError(config, before, input.slot, entered);
    assert.equal(error, null, name);
    const offenders: Bytes[] = pre_state.post_offenders.map(fromHex);
    const vrfOutput: Bytes = fromHex(input.entropy);
    const step = safroleStep(config, before, input.slot, vrfOutput, offenders, entered);
    const after: Safrole = safroleFromJson(post_state);
    assert.deepEqual(step.after, after, name);
    steps++;
  }
  assert.equal(steps, 11); // 5 tiny, 6 full
});

test("the blocks Safrole refuses, each for the vector's reason", () => {
  let refused = 0;
  for (const config of [TINY, FULL]) {
    for (const name of vectorFiles(`stf/safrole/${config.name}`)) {
      const vector = vectorJson(name) as SafroleVector;
      const reason = vector.output.err;
      if (!reason || reason === "bad_ticket_proof") continue; // proofs: lesson 8.8
      const before: Safrole = safroleFromJson(vector.pre_state);
      const entered = vector.input.extrinsic.map((t) => TicketEnvelope.fromJson(t));
      const error: string | null = safroleError(config, before, vector.input.slot, entered);
      assert.equal(error, reason, name);
      refused++;
    }
  }
  assert.equal(refused, 11); // tiny and full: bad_slot, unexpected_ticket, and three more
});
```

And a stub that refuses nothing:

**Add to** `src/safrole.ts`

```ts
import type { TicketEnvelope } from "./block.ts";

/**
 * Why Safrole refuses a block (GP §6), or null if it doesn't: its slot isn't after the last
 * block's (bad_slot); it brings tickets once the lottery has closed, or more than K
 * (unexpected_ticket); a ticket's attempt is n or more (bad_ticket_attempt); the ids don't
 * go strictly up (bad_ticket_order); or one is in the lottery already (duplicate_ticket).
 */
export function safroleError(
  config: Config,
  before: Safrole,
  slot: number,
  tickets: TicketEnvelope[],
): string | null {
  return null; // for now, every block is fine
}
```

**Run, expect it to fail**

```sh
npm test
```

```text
...
✖ blocks with tickets: each joins the lottery, which keeps the E lowest ids (157.082917ms)
✖ the blocks Safrole refuses, each for the vector's reason (0.836292ms)
...
ℹ tests 83
ℹ suites 0
ℹ pass 81
ℹ fail 2
...
✖ blocks with tickets: each joins the lottery, which keeps the E lowest ids (157.082917ms)
  AssertionError [ERR_ASSERTION]: stf/safrole/tiny/publish-tickets-no-mark-2.json
  + actual - expected

...
  -   accumulator: [
...
```

Two reds, each about the rule. The tickets never reach the lottery, so the state after
is wrong; and the stub refuses nothing, where the vectors expect a reason.

## The code

K joins the constants that depend on the network's size:

**Replace in** `src/config.ts`

```ts
/** The protocol constants that depend on the size of the network. */
export type Config = {
  name: string;
  validators_count: number; // V: validators in a set
  core_count: number; // C: cores doing work in parallel
  epoch_length: number; // E: timeslots in an epoch
  epoch_tail_start: number; // Y: the slot of an epoch at which the ticket lottery closes
  max_tickets_per_extrinsic: number; // K: tickets a block may carry
};

export const TINY: Config = {
  name: "tiny",
  validators_count: 6,
  core_count: 2,
  epoch_length: 12,
  epoch_tail_start: 10,
  max_tickets_per_extrinsic: 3,
};

export const FULL: Config = {
  name: "full",
  validators_count: 1023,
  core_count: 341,
  epoch_length: 600,
  epoch_tail_start: 500,
  max_tickets_per_extrinsic: 16,
};
```

**Add to** `src/safrole.ts`

```ts
import { vrfOutput } from "./bandersnatch.ts";

/** A ticket's id (GP §6): the VRF output of its proof. */
export function ticketId(ticket: TicketEnvelope): Bytes {
  return vrfOutput(ticket.signature);
}

/** Orders tickets by id, the lowest (the best) first. */
const byId = (x: TicketBody, y: TicketBody) => (toHex(x.id) < toHex(y.id) ? -1 : 1);

/** n (GP §6): the tickets each validator may enter, ⌈2E / |γ′_P|⌉: fewer validators, more each. */
export function attemptsAllowed(config: Config, validators: number): number {
  return Math.ceil((2 * config.epoch_length) / validators);
}
```

**Replace in** `src/safrole.ts`

```ts
/**
 * Why Safrole refuses a block (GP §6), or null if it doesn't: its slot isn't after the last
 * block's (bad_slot); it brings tickets once the lottery has closed, or more than K
 * (unexpected_ticket); a ticket's attempt is n or more (bad_ticket_attempt); the ids don't
 * go strictly up (bad_ticket_order); or one is in the lottery already (duplicate_ticket).
 */
export function safroleError(
  config: Config,
  before: Safrole,
  slot: number,
  tickets: TicketEnvelope[],
): string | null {
  if (slot <= before.time) return "bad_slot";
  const open = phaseOf(config, slot) < config.epoch_tail_start;
  if (tickets.length > (open ? config.max_tickets_per_extrinsic : 0)) return "unexpected_ticket";
  const newEpoch = epochOf(config, slot) > epochOf(config, before.time);
  const pending = newEpoch ? before.validators.staging : before.validators.pending; // γ′_P
  const n = attemptsAllowed(config, pending.length);
  if (tickets.some((t) => t.attempt >= n)) return "bad_ticket_attempt";
  const ids = tickets.map((t) => toHex(ticketId(t)));
  if (ids.some((id, i) => i > 0 && id <= ids[i - 1])) return "bad_ticket_order";
  const held = new Set(before.accumulator.map((t) => toHex(t.id)));
  if (ids.some((id) => held.has(id))) return "duplicate_ticket";
  return null;
}
```

```ts
  const ids = tickets.map((t) => toHex(ticketId(t)));
  if (ids.some((id, i) => i > 0 && id <= ids[i - 1])) return "bad_ticket_order";
```

Hex strings of the same length sort the way their bytes do, so `<=` on them is "not
strictly up". And n counts γ′_P, the pending validators *after* this block: at a new
epoch, that's ι, the next in line ([lesson 8.2](./02-rotating-the-validators.md)).

`safroleStep` takes the tickets, already checked, and merges them in:

**Replace in** `src/safrole.ts`

```ts
/**
 * One block of Safrole (GP §6): the state after it, and the two marks its header must
 * carry. Its tickets join the lottery: each one's id is its proof's VRF output, and the
 * lottery keeps the E lowest ids, old and new (none old at a new epoch).
 */
export function safroleStep(
  config: Config,
  before: Safrole,
  slot: number, // the block's slot, τ′
  vrfOutput: Bytes, // Y(H_v), from the block's entropy source
  offenders: Bytes[], // ψ′_O: Ed25519 keys convicted in disputes
  tickets: TicketEnvelope[] = [], // the block's tickets extrinsic, already checked
) {
  const newEpoch = epochOf(config, slot) > epochOf(config, before.time);
  const entropy = nextEntropy(before.entropy, vrfOutput, newEpoch);
  const validators = newEpoch ? rotateValidators(before.validators, offenders) : before.validators;
  let sealers = before.sealers;
  if (sealedByTickets(config, before.time, slot, before.accumulator)) {
    sealers = { tickets: outsideIn(before.accumulator) };
  } else if (newEpoch) {
    sealers = { keys: fallbackKeys(config, entropy[2], validators.active) };
  }
  const entered = tickets.map((t) => ({ id: ticketId(t), attempt: t.attempt }));
  const kept = newEpoch ? [] : before.accumulator; // a new epoch starts a new lottery
  const accumulator = [...kept, ...entered].sort(byId).slice(0, config.epoch_length);
  const after: Safrole = { time: slot, entropy, validators, accumulator, sealers };
  // the epoch mark: η₀ and η₁ as they were, and γ′_P, the validators after next, by two keys
  const keys = validators.pending.map(({ bandersnatch, ed25519 }) => ({ bandersnatch, ed25519 }));
  const epochMark: EpochMark | null = newEpoch
    ? { entropy: before.entropy[0], tickets_entropy: before.entropy[1], validators: keys }
    : null;
  const marked = ticketsMark(config, before.time, slot, before.accumulator);
  return { after, epochMark, ticketsMark: marked };
}
```

```ts
  const entered = tickets.map((t) => ({ id: ticketId(t), attempt: t.attempt }));
  const kept = newEpoch ? [] : before.accumulator; // a new epoch starts a new lottery
  const accumulator = [...kept, ...entered].sort(byId).slice(0, config.epoch_length);
```

`tickets` comes last, and defaults to none, so [lesson 8.5](./05-one-step-of-safrole.md)'s calls still work unchanged.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ blocks with tickets: each joins the lottery, which keeps the E lowest ids (228.298375ms)
✔ the blocks Safrole refuses, each for the vector's reason (171.179ms)
...
ℹ tests 83
ℹ suites 0
ℹ pass 83
ℹ fail 0
...
reported 83 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791771400406
...
```

## Watch it

`bin/safrole.ts` takes any safrole vector now, tickets and all:

**Rewrite** `bin/safrole.ts`

```ts
// Runs one block of Safrole from a safrole test vector, tickets and all, tells what
// happened (or why the block is refused), and checks the result against the vector.
// Usage: npm run safrole <vector.json>, e.g.
//        npm run safrole ../vectors/stf/safrole/tiny/enact-epoch-change-with-padding-1.json

import { readFileSync } from "node:fs";
import { isDeepStrictEqual } from "node:util";
import { fromHex, toHex } from "../src/bytes.ts";
import { FULL, TINY } from "../src/config.ts";
import { Run } from "../src/obs.ts";
import { safroleError, safroleFromJson, safroleStep, ticketId } from "../src/safrole.ts";
import { TicketEnvelope } from "../src/block.ts";

const [file] = process.argv.slice(2);
const config = file.includes("/full/") ? FULL : TINY;
const { input, pre_state, post_state, output } = JSON.parse(readFileSync(file, "utf8"));
const before = safroleFromJson(pre_state);
const offenders = pre_state.post_offenders.map(fromHex);
const tickets = input.extrinsic.map((t: unknown) => TicketEnvelope.fromJson(t));

const run = new Run("safrole");
const told = (what: string) => {
  console.log(what);
  run.event("told", { what });
};
const short = (hash: Uint8Array) => `${toHex(hash).slice(0, 10)}…`;
for (const t of tickets) told(`a ticket: attempt ${t.attempt}, id ${short(ticketId(t))}`);
const error = safroleError(config, before, input.slot, tickets);
if (error) {
  told(`refused: ${error} (the vector says: ${output.err})`);
  const link = await run.report();
  if (link) console.log(`reported to Grafana: ${link}`);
  process.exit(0);
}
const step = safroleStep(config, before, input.slot, fromHex(input.entropy), offenders, tickets);
const { after, epochMark, ticketsMark } = step;
told(`slot ${before.time} → ${after.time}`);
told(`η₀ stirred: ${short(before.entropy[0])} → ${short(after.entropy[0])}`);
told(`a new epoch: ${epochMark !== null}`);
const zeroed = after.validators.pending.filter((k) => k.ed25519.every((b) => b === 0)).length;
if (epochMark) told(`validators moved along one set; offenders zeroed: ${zeroed}`);
const sealers = "tickets" in after.sealers ? "the lottery's winners" : "fallback keys";
told(`sealers: ${sealers}; tickets mark: ${ticketsMark !== null}`);
const best = after.accumulator[0]; // the lowest id: the best ticket
const held = after.accumulator.length;
if (best) told(`the lottery holds ${held} ticket(s), the best ${short(best.id)}`);
const matches = isDeepStrictEqual(after, safroleFromJson(post_state));
told(`the whole state after matches the vector: ${matches}`);
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

What flows through these two runs — the tickets each block carries, the ids and checks your rules work out, and the lines printed:

::: code-group

```text [what goes in]
publish-tickets-no-mark-2.json, input:
{
  "slot": 1,
  "entropy": "0x8c2e6d327dfa…",
  "extrinsic": [
    { "attempt": 0, "signature": "0xe5055ade89ab…" },
    { "attempt": 1, "signature": "0x177a2a70e85e…" },
    { "attempt": 2, "signature": "0x74210b31ef06…" }
  ]
}

publish-tickets-no-mark-4.json: three tickets again, attempts 3, 1 and 2, at slot 2.
```

```ts [what it computes]
// bin/safrole.ts's values, one run per vector
const two = {
  ids: ["0x00e51b1c…", "0x015d2d6f…", "0x20164381…"], // ticketId: each proof's VRF output
  ascending: true, // each id above the one before, as a block must carry them
  error: null, // safroleError finds nothing
  time: [0, 1], // τ before → after
  accumulator: 3, // all three kept, the best first
};
const four = {
  ids: ["0xd6feae23…", "0x5af49b10…", "0x34341918…"], // attempts 3, 1, 2
  ascending: false, // 0xd6… before 0x5a…: going down
  error: "bad_ticket_order", // the whole block is refused, nothing changes
};
```

```text [what comes out]
a ticket: attempt 0, id 0x00e51b1c…
the lottery holds 3 ticket(s), the best 0x00e51b1c…
refused: bad_ticket_order (the vector says: bad_ticket_order)
```

:::

A ticket's id isn't in the block: your rules work it out from the proof, the VRF output
of [lesson 8.6](./06-the-vrf-output.md). The first block's ids climb, so all three join the lottery; the second's
fall, so the block is refused before any state moves.

**Run**

```sh
npm pkg set scripts.safrole-tickets-2="node bin/safrole.ts ../vectors/stf/safrole/tiny/publish-tickets-no-mark-2.json"
npm run safrole-tickets-2
npm pkg set scripts.safrole-tickets-4="node bin/safrole.ts ../vectors/stf/safrole/tiny/publish-tickets-no-mark-4.json"
npm run safrole-tickets-4
```

```text
a ticket: attempt 0, id 0x00e51b1c…
a ticket: attempt 1, id 0x015d2d6f…
a ticket: attempt 2, id 0x20164381…
slot 0 → 1
η₀ stirred: 0x03170a2e… → 0xa0243a82…
a new epoch: false
sealers: fallback keys; tickets mark: false
the lottery holds 3 ticket(s), the best 0x00e51b1c…
the whole state after matches the vector: true
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=safrole-1791771403660
a ticket: attempt 3, id 0xd6feae23…
a ticket: attempt 1, id 0x5af49b10…
a ticket: attempt 2, id 0x34341918…
refused: bad_ticket_order (the vector says: bad_ticket_order)
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=safrole-1791771403778
```

The first block's three tickets go up (`0x00e5…`, `0x015d…`, `0x2016…`) and all enter.
The second block's start at `0xd6fe…` and then drop to `0x5af4…`: refused, for the reason
the vector gives. The *Safrole* panel, on **3 · Consensus**, shows the refusal.

![Safrole panel](./images/07-safrole.png)

<details>
<summary>lasair: the checks, in <code>conformance/safrole_stf.ml</code></summary>

```ocaml
  (* GP 0.8.0 safrole.tex eq. ticketsextrinsic: the entry index is bounded by
     n = ⌈2E / |gamma_k'|⌉ -- fewer validators get more attempts each so the
     accumulator can saturate (tiny 6 validators, E=12 -> 4; full 1023 -> 2).
     (The 0.7.2 constant C_ticketentries and the old "no gaps" heuristic are gone.) *)
  let attempt_bound =
    let gk = List.length gamma_k_post in
    if gk = 0 then 0 else (2 * Stf_config.epoch_length () + gk - 1) / gk in
  if List.exists (fun (t : ticket_extrinsic) -> t.attempt >= attempt_bound) input.extrinsic then
    Result.Error "bad_ticket_attempt"
```

Your `attemptsAllowed`, in integers: `(2E + gk − 1) / gk` is ⌈2E / gk⌉ without a
fraction. The comment remembers the rule's history: Gray Paper 0.7.2 had a fixed number of
attempts, and 0.8.0 replaced it with n. lasair runs the same checks as yours, but checks
the ring proofs first (it has the library), then the order, the duplicates and the
attempts: one rule per `if`, each returning the vectors' name. A block breaks at most one
rule in every vector, so the order of the checks never shows.

</details>

## Check your understanding

::: check
**On tiny, how many tickets may each validator enter, and with which attempts?**

- [ ] 3, attempts 0 to 2, as the vectors' README says
  > No: that's the old fixed number. Gray Paper 0.8.0 made it n, and the vectors follow
  > the paper.
- [x] 4, attempts 0 to 3: ⌈2 × 12 / 6⌉
  > Yes: n = ⌈2E / |γ′_P|⌉ = ⌈24 / 6⌉ = 4. Six validators with four tickets each can fill
  > the 12-ticket lottery twice over.
- [ ] 2, attempts 0 and 1, the same as on full
  > No: full's 2 is ⌈1200 / 1023⌉. Tiny has fewer validators, so each gets more.

**A block brings tickets whose ids start `0xd6fe`, `0x5af4` and `0x3434`. Why is it refused?**

- [ ] Their ids are too high to win
  > No: a high ticket still gets in if the lottery has room. What breaks the rule is the
  > order.
- [ ] Attempt 3 is too high on tiny
  > No: tiny allows attempts 0 to 3, so 3 is fine.
- [x] The ids don't go strictly up: `0x5af4…` comes after `0xd6fe…`
  > Yes: `bad_ticket_order`. Strictly up also means no ticket can come twice.

**In `publish-tickets-no-mark-7`, a tiny block at slot 10 brings tickets. What happens?**

- [x] It's refused: `unexpected_ticket`
  > Yes: phase 10 is Y, and once m′ ≥ Y the lottery is closed. A block may bring no
  > tickets at all.
- [ ] They enter the lottery, as long as there are no more than K = 3
  > No: K is the limit while the lottery is open. From phase 10 on, the limit is 0.
- [ ] They're kept for the next epoch's lottery
  > No: nothing carries over. A block that breaks a rule is refused whole.

**Tiny's lottery holds 12 tickets, and a block brings 2, both with lower ids than the lottery's worst two. What does it hold afterwards?**

- [ ] 14 tickets
  > No: it keeps at most E, 12 on tiny.
- [ ] The same 12: a full lottery takes no more tickets
  > No: a full lottery still takes better ones. The worst drop out to make room.
- [x] 12: the 2 new ones in, the 2 worst old ones out
  > Yes: it keeps the E lowest ids, old and new together.
:::

## What you have

Tickets entering the lottery, checked by every rule but one, and refused blocks named as
the vectors name them: 33 accepted blocks and 11 refusals. The rule left is the proof
itself, and it needs the real curve: [lesson 8.8](./08-the-ring-root.md) brings in a Bandersnatch library, for
the ring root and the proofs.

Next: [8.8 The ring root](./08-the-ring-root.md)
