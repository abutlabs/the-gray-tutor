# The lottery's winners

**In one sentence:** validators enter a lottery with tickets that don't say whose they
are, and each of the best tickets wins one slot of the next epoch, so nobody knows who
makes a block until it arrives.

Move the two slots and the number of tickets. See which block announces the winners, and
who seals the next epoch.

<a id="try-it"></a>

<LotteryClose />

## The idea

If everyone knows who makes the next block, anyone can plan an attack on that validator.
So Safrole hides the answer.

For most of every epoch, validators enter a lottery with anonymous tickets. Each ticket
proves "a validator made me" without saying which. Each carries a random number, and
lower is better. The chain keeps the best ones, as many as an epoch has slots. That pile
is the [*ticket accumulator*](../glossary.md#ticket-accumulator).

Near the end of the epoch the lottery closes. The first block after the close announces
the winning tickets in its header. At the next epoch, each winner gets one slot. Everyone
can see which ticket has which slot. Nobody knows who holds it until that validator
makes its block.

It is a raffle where the winning stubs are pinned to the board, and each holder shows up
only when their number is called.

The winners take their slots in an order of their own, the
[*outside-in order*](../glossary.md#outside-in-order): best, worst, second best, and so on
inwards.

This lesson builds the lottery's end: closing it, announcing the winners, seating them.
Entering a ticket waits for [lesson 8.7](./07-entering-tickets.md), and checking its ring
proof for [lesson 8.8](./08-the-ring-root.md).

## What the Gray Paper says

::: gray-paper 6.2 5-8

#### §6.2 Safrole Basic State, continued

<a id="gp-6-2-p5"></a>Finally, $\gamma_A$ is the ticket accumulator, a sequence of highest-scoring ticket identifiers to be used for the next epoch. $\gamma_S$ is the current epoch's <abbr class="gp-term" title="who may seal each slot of an epoch: E tickets, or E keys">slot-sealer sequence</abbr>, which is either a full complement of $\mathsf{E}$ tickets or, in the case of a fallback mode, a sequence of $\mathsf{E}$ Bandersnatch keys:

<a id="gp-6-2-p6"></a><a id="eq-6-5"></a>

$$
\begin{align}
\gamma_A \in \left[\!\left[\mathbb{T}\right]\!\right]_{:\mathsf{E}} \,,\quad
\gamma_S \in \left[\!\left[\mathbb{T}\right]\!\right]_{\mathsf{E}} \cup \left[\!\left[\overset{\backsim}{\mathbb{H}_{}}\right]\!\right]_{\mathsf{E}} \tag{6.5}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-ticketaccumulator" class="gk-wrap">$\gamma_A$</span> | gamma A | the ticket lottery: the best tickets entered so far for the next epoch, at most E, lowest id first |
| <span id="gk-in">[$\in$](../symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-sequence">[$\left[\!\left[x\right]\!\right]$](../symbols.md#sequence)</span> | a sequence of | ⟦T⟧ is an array of T; a subscript is its length, :n at most n, n: at least n |
| <span id="gk-Cepochlen" class="gk-wrap">$\mathsf{E}$</span> | E | an epoch's length in slots: 600 on full, 12 on tiny |
| <span id="gk-safroleticket" class="gk-wrap">$\mathbb{T}$</span> | T | a ticket: a 32-byte id, and which of its maker's tries it was (its attempt) |
| <span id="gk-sealtickets" class="gk-wrap">$\gamma_S$</span> | gamma S | the slot sealers: one entry for each of the epoch's E slots, a winning ticket or, in the fallback, a Bandersnatch key |
| <span id="gk-cup">$\cup$</span> | union | everything in either side |
| <span id="gk-bskey" class="gk-wrap">$\overset{\backsim}{\mathbb{H}}$</span> | H tilde | a Bandersnatch public key: 32 bytes |

</details>

→ [(6.5) in plain words](./gray-paper.md#ex-6-5)

<a id="gp-6-2-p7"></a>Here, $\mathbb{T}$ is used to denote the set of *tickets*, a combination of a verifiably random <abbr class="gp-term" title="a ticket's 32-byte random id, the output of its ring proof; lower wins">ticket identifier</abbr> $y$ and the ticket's entry-index $e$:

<a id="gp-6-2-p8"></a><a id="eq-6-6"></a>

$$
\begin{align}
\mathbb{T} &\equiv \!\left\lgroup
y\in \mathbb{H}_{},\,
e\in \mathbb{N}
\right\rgroup\! \tag{6.6}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-tuple">$\!\left\lgroup x\right\rgroup\!$</span> | the tuple of | a record: named fields, each with its type, like an object in JSON |
| <span id="gk-isa">[$x\in y$](../symbols.md#in)</span> | in | belongs to: the field's type |
| <span id="gk-st-id">$y$</span> | y | a ticket's id: 32 random bytes, the output of its ring proof; a lower id wins |
| <span id="gk-hash">$\mathbb{H}$</span> | H | a 32-byte value, usually a hash |
| <span id="gk-st-entryindex">$e$</span> | e | a ticket's entry index: which of its maker's attempts it is, counted from 0 |
| <span id="gk-N" class="gk-wrap">[$\mathbb{N}$](../symbols.md#naturals)</span> | N | the whole numbers: 0, 1, 2 and up; a subscript is a bound, ℕ₈ is 0 to 7 |

</details>

→ [(6.6) in plain words](./gray-paper.md#ex-6-6)

:::

§6.2. A ticket is two things:

- its id, y: 32 random bytes, a VRF output. Lower is better;
- its entry index, e: which of its maker's attempts it was.

The state keeps γ_A, the ticket accumulator: the best tickets entered so far, at most E
of them, sorted by id. And γ_S, this epoch's sealers, always has exactly E entries: E
tickets or, in the fallback, E Bandersnatch keys.

**Y** is the phase at which the lottery closes: slot 500 of a 600-slot epoch on full, 10
of 12 on tiny. (It is not [lesson 8.1](./01-stirring-the-entropy.md)'s Y(·), the VRF
output: the Gray Paper uses two different letters.)

Slots tick with the clock whether or not their block arrives. A slot whose sealer stays
silent is simply empty, so there may be no block *at* slot 10 to make the announcement.
Both rules below therefore compare two consecutive *blocks*: the parent, at phase m of
its epoch, and the block itself, at phase m′, however many empty slots lie between them.

The paper's two rules, the tickets mark and the sealers:

::: gray-paper 6.6 4-5

#### §6.6 The Markers, continued

<a id="gp-6-6-p4"></a>The winning-tickets marker $\mathbf{H}_{W}$ is either empty or, if the block is the first after the end of the submission period for tickets and if the ticket accumulator is saturated, then the final sequence of ticket identifiers. Formally:

<a id="gp-6-6-p5"></a><a id="eq-6-29"></a>

$$
\begin{align}
\mathbf{H}_{W} &\equiv \begin{cases}
Z(\gamma_A) &\text{if } e' = e \wedge m < \mathsf{Y} \le m' \wedge \left\vert\gamma_A\right\vert = \mathsf{E} \\
\emptyset & \text{otherwise}
\end{cases} \tag{6.29}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-H" class="gk-wrap">$\mathbf{H}$</span> | H | this block's header; 𝐇_T is its timeslot, 𝐇_P its parent's hash |
| <span id="gk--winnersmark">$W$</span> | W | a header's winning-tickets mark: 𝐇_W, at most once an epoch, a ticket for every slot of the next (12 on tiny, 600 on full) |
| <span id="gk-wedge">$\wedge$</span> | and | both sides are true |
| <span id="gk-Cepochtailstart" class="gk-wrap">$\mathsf{Y}$</span> | Y | the slot of an epoch at which the ticket lottery closes: 500 on full, 10 on tiny |
| <span id="gk-le">$\le$</span> | at most | less than or equal to |
| <span id="gk-len">$\left\vert x\right\vert$</span> | the size of | \|x\|: how many items x has, or how many bytes |
| <span id="gk-none" class="gk-wrap">$\emptyset$</span> | nothing | ∅: no value at all, like null |

</details>

→ [(6.29) in plain words](./gray-paper.md#ex-6-29)

:::

::: gray-paper 6.5 1-4

#### §6.5 The Slot-Sealer Sequence {#gp-6-5}

<a id="gp-6-5-p1"></a>The <abbr class="gp-term" title="after the change: the value once it is made, written with a prime (α′); for state, after the block">posterior</abbr> slot-sealer sequence $\gamma_S'$ is one of three expressions depending on the circumstance of the block. If the block is not the first in an epoch, then it remains unchanged from the prior $\gamma_S$. If the block signals the next epoch (by epoch index) and the previous block's slot was within the closing period of the previous epoch, then it takes the value of the prior ticket accumulator $\gamma_A$. Otherwise, it takes the value of the fallback key sequence. Formally:

<a id="gp-6-5-p2"></a><a id="eq-6-25"></a>

$$
\begin{align}
\gamma_S' &\equiv \begin{cases}
Z(\gamma_A) &\text{if } e' = e + 1 \wedge m \geq \mathsf{Y} \wedge \left\vert\gamma_A\right\vert = \mathsf{E}\!\!\\
\gamma_S &\text{if } e' = e \\
F(\eta'_2, \kappa') \!\!\!&\text{otherwise}
\end{cases} \tag{6.25}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-geq">$\geq$</span> | is at least | greater than or equal to |
| <span id="gk-entropy" class="gk-wrap">$\eta$</span> | eta | entropy: four 32-byte values of randomness, the newest mixing in every block |
| <span id="gk-activeset" class="gk-wrap">$\kappa$</span> | kappa | the current validators: the keys of the V validators active this epoch |

</details>

→ [(6.25) in plain words](./gray-paper.md#ex-6-25)

<a id="gp-6-5-p3"></a>Here, we use $Z$ as the outside-in sequencer function, defined as follows:

<a id="gp-6-5-p4"></a><a id="eq-6-26"></a>

$$
\begin{equation}
Z\colon\left\{ \,\begin{aligned}
\left[\!\left[\mathbb{T}\right]\!\right]_{\mathsf{E}} &\to \left[\!\left[\mathbb{T}\right]\!\right]_{\mathsf{E}}\\
\mathbf{s} &\mapsto \left[\mathbf{s}_0, \mathbf{s}_{\left\vert\mathbf{s}\right\vert - 1}, \mathbf{s}_1, \mathbf{s}_{\left\vert\mathbf{s}\right\vert - 2}, \dots\right]\\
\end{aligned} \right. \tag{6.26}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-abracegroup">$\left\{ \begin{aligned}x\end{aligned} \right.$</span> | as follows | a brace grouping lines that hold together: for a function, its type on top, then what each input becomes |
| <span id="gk-to">[$\to$](../symbols.md#to)</span> | to | what goes in, to what comes out: A → B takes an A and gives a B |
| <span id="gk-mapsto">$\mapsto$</span> | maps to | what a function gives back for an input: x ↦ y says x becomes y |
| <span id="gk-sq">[$\left[x\right]$](../symbols.md#sequence)</span> | the sequence | a sequence written out item by item; [ ] is the empty one |

</details>

→ [(6.26) in plain words](./gray-paper.md#ex-6-26)

:::

Two things can happen:

- **The tickets mark** (*The Markers*): the block that crosses phase Y, in the same epoch
  (m < Y ≤ m′), puts the winners in its header, if the lottery filled up, with all E
  tickets. Everyone learns the winning *tickets*, though still not who holds them.
- **The sealers** (*The Slot-Sealer Sequence*): at the next epoch, if it follows on
  directly (e′ = e + 1), the block before was past the close (m ≥ Y), and the lottery
  was full, then γ′_S is the winners. Otherwise it's [lesson 8.3](./03-the-fallback-sealers.md)'s fallback.

Try both rules [at the top](#try-it): step the two slots across phase 10, then take a
ticket away.

Either way the winners go in *outside-in* order, Z: the first, the last, the second,
the second to last, and so on inwards. Slot 0 gets the best ticket, slot 1 the worst of
the winners, slot 2 the second best. [Lesson 8.5](./05-one-step-of-safrole.md) has a
tiny epoch you can drive: fill its lottery, and watch the winners take their slots.

![A tiny epoch's lottery. In this epoch, tickets enter during slots 0 to 9; at Y = 10 the lottery closes, and the block that crosses it carries the tickets mark. The 12 winners, sorted by id from t0, the best, to t11, are seated in the next epoch outside in: slot 0 gets t0, slot 1 t11, slot 2 t1, slot 3 t10, and so on inwards to t5 and t6 in the last two slots.](./images/04-ticket-contest.svg)

<OutsideIn />

## The size grows again

**Replace in** `src/config.ts`

```ts
/** The protocol constants that depend on the size of the network. */
export type Config = {
  name: string;
  validators_count: number; // V: validators in a set
  core_count: number; // C: cores doing work in parallel
  epoch_length: number; // E: timeslots in an epoch
  epoch_tail_start: number; // Y: the slot of an epoch at which the ticket lottery closes
};

export const TINY: Config = {
  name: "tiny",
  validators_count: 6,
  core_count: 2,
  epoch_length: 12,
  epoch_tail_start: 10,
};

export const FULL: Config = {
  name: "full",
  validators_count: 1023,
  core_count: 341,
  epoch_length: 600,
  epoch_tail_start: 500,
};
```

## The tests

The tests read the accumulator, the sealers' tickets, and the tickets mark from the
vectors:

**Replace in** `test/safrole.test.ts`

```ts
/** The parts of a safrole vector's state the lessons use so far. */
type SafroleState = {
  tau: number;
  eta: string[];
  iota: unknown[];
  gamma_k: unknown[];
  kappa: unknown[];
  lambda: unknown[];
  post_offenders: string[];
  gamma_a: unknown[]; // γ_A: the lottery's best tickets so far
  gamma_s: { keys?: string[]; tickets?: unknown[] }; // γ_S: the sealers, keys or tickets
};

/** A safrole test vector: the parts of it the lessons use so far. */
type SafroleVector = {
  input: { slot: number; entropy: string };
  pre_state: SafroleState;
  post_state: SafroleState;
  output: { err?: string; ok?: { tickets_mark: unknown[] | null } };
};
```

**Add to** `test/safrole.test.ts`

```ts
import { outsideIn, sealedByTickets, ticketsMark } from "../src/safrole.ts";
import { TicketBody } from "../src/block.ts";

test("Z: outside in, from both ends to the middle", () => {
  const odd: number[] = outsideIn([1, 2, 3, 4, 5]);
  assert.deepEqual(odd, [1, 5, 2, 4, 3]);
  const even: number[] = outsideIn([1, 2, 3, 4]);
  assert.deepEqual(even, [1, 4, 2, 3]);
});

/** Tickets from a vector's JSON. */
const tickets = (json: unknown[]) => json.map((ticket) => TicketBody.fromJson(ticket));

test("the lottery closes as phase Y is reached: slot 9 → 10 on tiny, but not 10 → 11", () => {
  const full: TicketBody[] = Array.from({ length: 12 }, () => ({
    id: new Uint8Array(32),
    attempt: 0,
  }));
  const closing: TicketBody[] | null = ticketsMark(TINY, 9, 10, full);
  assert.notEqual(closing, null);
  const closedAlready: TicketBody[] | null = ticketsMark(TINY, 10, 11, full);
  assert.equal(closedAlready, null);
  const notFull: TicketBody[] | null = ticketsMark(TINY, 9, 10, full.slice(1));
  assert.equal(notFull, null);
});

test("the tickets mark: in the block that closes a full lottery, and in no other", () => {
  let marks = 0;
  for (const { config, name, vector } of acceptedVectors()) {
    const { input, pre_state, output } = vector;
    const accumulator: TicketBody[] = tickets(pre_state.gamma_a);
    const mark: TicketBody[] | null = ticketsMark(config, pre_state.tau, input.slot, accumulator);
    const markJson = output.ok?.tickets_mark;
    const expected: TicketBody[] | null = markJson ? tickets(markJson) : null;
    assert.deepEqual(mark, expected, name);
    if (mark) marks++;
  }
  assert.equal(marks, 2); // 1 tiny, 1 full
});

test("γ′_S: a new epoch is sealed by the winners, outside in, if the lottery closed full", () => {
  let ticketed = 0;
  for (const { config, name, vector, newEpoch } of acceptedVectors()) {
    if (!newEpoch) continue;
    const { input, pre_state, post_state } = vector;
    const accumulator: TicketBody[] = tickets(pre_state.gamma_a);
    const closedFull: boolean = sealedByTickets(config, pre_state.tau, input.slot, accumulator);
    if (closedFull) {
      const sealers: TicketBody[] = tickets(post_state.gamma_s.tickets ?? []);
      const winners: TicketBody[] = outsideIn(accumulator);
      assert.deepEqual(sealers, winners, name);
      ticketed++;
    } else {
      assert.ok(post_state.gamma_s.keys, name); // the fallback, as in lesson 8.3
    }
  }
  assert.equal(ticketed, 2); // 1 tiny, 1 full
});
```

The second test pins the boundaries: "m < Y ≤ m′" is exactly where off-by-one bugs live.
The block from slot 9 to 10 closes tiny's lottery. The one from 10 to 11 doesn't: by then
it's closed. The vectors only cross Y from further away (slot 3 to 11, say), so without
this test a `<=` where a `<` belongs would slip through.

## The code

**Add to** `src/safrole.ts`

```ts
import { epochOf, phaseOf } from "./epoch.ts";
import type { TicketBody } from "./block.ts";

/** Z: outside in. The first, the last, the second, the second to last, and so on inwards. */
export function outsideIn<T>(items: T[]): T[] {
  const out: T[] = [];
  let front = 0;
  let back = items.length - 1;
  while (front <= back) {
    out.push(items[front]);
    if (front < back) out.push(items[back]);
    front++;
    back--;
  }
  return out;
}

/** Whether the lottery closes in this block: the same epoch, and phase Y is reached now. */
function lotteryCloses(config: Config, before: number, after: number): boolean {
  const Y = config.epoch_tail_start;
  const sameEpoch = epochOf(config, after) === epochOf(config, before);
  return sameEpoch && phaseOf(config, before) < Y && Y <= phaseOf(config, after);
}

/** H_W, the tickets mark: in the block that closes a full lottery, the winners, outside in. */
export function ticketsMark(
  config: Config,
  before: number, // the slot of the block before, τ
  after: number, // this block's slot, τ′
  accumulator: TicketBody[], // γ_A: the best tickets so far, by id
): TicketBody[] | null {
  const full = accumulator.length === config.epoch_length;
  return lotteryCloses(config, before, after) && full ? outsideIn(accumulator) : null;
}

/**
 * Whether a new epoch is sealed by the lottery's winners rather than the fallback: the
 * last epoch's lottery closed full, and this block follows on from that epoch directly.
 */
export function sealedByTickets(
  config: Config,
  before: number,
  after: number,
  accumulator: TicketBody[],
): boolean {
  const next = epochOf(config, after) === epochOf(config, before) + 1;
  const closed = phaseOf(config, before) >= config.epoch_tail_start;
  return next && closed && accumulator.length === config.epoch_length;
}
```

`outsideIn` walks in from both ends at once: `front` and `back` take turns until they
meet. `if (front < back)` stops the middle item of an odd-length list from going in
twice.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ Z: outside in, from both ends to the middle (0.7ms)
...
✔ the tickets mark: in the block that closes a full lottery, and in no other (300.3ms)
...
ℹ tests 78
ℹ suites 0
ℹ pass 78
ℹ fail 0
...
reported 78 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791730482308
...
```

The tickets mark is right in every accepted vector: present in the two that close a full
lottery, absent in the other 31. And both epochs sealed by tickets got their winners
outside in.

## Watch it

**New file** `bin/lottery.ts`

```ts
// Shows a lottery's result from a safrole test vector: if this block closes a full lottery,
// which slot of the next epoch each winning ticket will seal, outside in.
// Usage: npm run lottery <vector.json>, e.g.
//        npm run lottery ../vectors/stf/safrole/tiny/publish-tickets-with-mark-4.json

import { readFileSync } from "node:fs";
import { TicketBody } from "../src/block.ts";
import { toHex } from "../src/bytes.ts";
import { FULL, TINY } from "../src/config.ts";
import { Run } from "../src/obs.ts";
import { ticketsMark } from "../src/safrole.ts";

const [file] = process.argv.slice(2);
const config = file.includes("/full/") ? FULL : TINY;
const { input, pre_state } = JSON.parse(readFileSync(file, "utf8"));
const accumulator = pre_state.gamma_a.map((ticket: unknown) => TicketBody.fromJson(ticket));
const mark = ticketsMark(config, pre_state.tau, input.slot, accumulator);
const run = new Run("lottery");
const closesAt = config.epoch_tail_start; // Y
console.log(`slot ${pre_state.tau} → ${input.slot}, the lottery closes at phase ${closesAt}`);
const verdict = mark ? "a tickets mark" : "no mark";
console.log(`${accumulator.length} of ${config.epoch_length} tickets: ${verdict}`);
run.event("lottery", { before: pre_state.tau, after: input.slot, mark: mark !== null });
mark?.forEach((ticket, phase) => {
  const rank = accumulator.indexOf(ticket); // 0: the best ticket, with the lowest id
  const id = `${toHex(ticket.id).slice(0, 10)}…`;
  console.log(`slot ${String(phase).padStart(3)} of the next epoch: ticket ${rank}, ${id}`);
  run.event("seat", { phase, rank, id: ticket.id });
});
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

What flows through it. The accumulator is already sorted, lowest id first:

::: code-group

```json [what goes in]
{
  "input": { "slot": 11 },
  "pre_state": {
    "tau": 3,
    "gamma_a": [
      { "id": "0x00e51b1c…", "attempt": 0 },
      { "id": "0x015d2d6f…", "attempt": 1 },
      { "…": "nine more, in id order" },
      { "id": "0xff0aa173…", "attempt": 2 }
    ]
  }
}
```

```ts [what it computes]
// bin/lottery.ts's values, once Z decides whether and how the lottery closes
const computed = {
  closesAt: 10, // Y, the epoch's tail: phase 3 is before it, phase 11 after
  crossed: true, // this block steps over the close with a full accumulator
  mark: "12 tickets, outside in", // Z zips the sorted list: best, worst, 2nd best…
  slot0: "ticket 0, 0x00e51b1c…", // the lowest id of all: the epoch's first sealer
  slot1: "ticket 11, 0xff0aa173…", // the highest: the outside-in partner
};
```

```text [what comes out]
slot 3 → 11, the lottery closes at phase 10
12 of 12 tickets: a tickets mark
slot   0 of the next epoch: ticket 0, 0x00e51b1c…
slot   1 of the next epoch: ticket 11, 0xff0aa173…
```

:::

`tau` 3 to `slot` 11 steps over phase 10: Y, where the lottery closes. `gamma_a` holds
all 12 tickets, so there *is* a mark. The order the output shows is Z on the input's
order: `gamma_a[0]`, the `0x00e5…` id, takes slot 0; `gamma_a[11]`, the `0xff0a…` one,
takes slot 1; and the zip walks inwards from there.

**Run**

```sh
npm pkg set scripts.lottery="node bin/lottery.ts"
npm pkg set scripts.lottery-closes="node bin/lottery.ts ../vectors/stf/safrole/tiny/publish-tickets-with-mark-4.json"
npm run lottery-closes
```

```text
slot 3 → 11, the lottery closes at phase 10
12 of 12 tickets: a tickets mark
slot   0 of the next epoch: ticket 0, 0x00e51b1c…
slot   1 of the next epoch: ticket 11, 0xff0aa173…
slot   2 of the next epoch: ticket 1, 0x015d2d6f…
slot   3 of the next epoch: ticket 10, 0xff039ff7…
slot   4 of the next epoch: ticket 2, 0x20164381…
slot   5 of the next epoch: ticket 9, 0xf4aac2fb…
slot   6 of the next epoch: ticket 3, 0x420cb7b0…
slot   7 of the next epoch: ticket 8, 0xe12c22d4…
slot   8 of the next epoch: ticket 4, 0x4c82dbb7…
slot   9 of the next epoch: ticket 7, 0xd96bb363…
slot  10 of the next epoch: ticket 5, 0x5af49b10…
slot  11 of the next epoch: ticket 6, 0xd6feae23…
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=lottery-1791730487634
```

Read the ticket column down: 0, 11, 1, 10, 2, 9 and so on. It is the zip of two lists,
one counting up, one counting down, meeting at 5 and 6 in the middle. The ids show what
"best" means: ticket 0's id starts `0x00e5`, ticket 11's `0xff0a`. The *Lottery* panel has
every seat. Try `publish-tickets-with-mark-3.json`, one block earlier: no mark yet.

![Lottery panel](./images/04-lottery.png)

<details>
<summary>lasair: outside in, in <code>conformance/safrole.ml</code></summary>

```ocaml
          for slot = 0 to (epoch_length ()) - 1 do
            let ticket_idx =
              if slot mod 2 = 0 then slot / 2
              else (epoch_length ()) - 1 - (slot / 2)
            in
```

lasair works out each slot's ticket with a formula instead of walking two pointers: an
even slot s takes ticket ⌊s/2⌋ from the front, an odd one ticket E − 1 − ⌊s/2⌋ from the
back. Same order, a different way to see it. Try a few slots by hand: both give 0, 11,
1, 10…

</details>

## Check your understanding

::: check
**Why does Safrole seat block makers by anonymous tickets, when a hash could deal the slots out just as fairly?**

- [ ] A hash can be steered, and tickets can't
  > No: [lesson 8.3](./03-the-fallback-sealers.md)'s fallback draws by hash, and nobody
  > could have steered it. What it gives up is secrecy, not fairness.
- [x] So that nobody knows who makes a block until it arrives, and nobody can plan an attack on the next author
  > Yes: a ticket proves "a validator made me" without saying which. Its holder is known
  > only when that validator makes its block.
- [ ] To keep the winning tickets themselves hidden
  > No: the tickets mark puts the winning tickets in a header, for everyone. What stays
  > hidden is who holds them.

**The lottery is full, but no block is made in the slot where it closes. Which block carries the tickets mark?**

- [x] The first block to reach or pass the close, in the same epoch
  > Yes: slots can be empty, so the rule compares two blocks: m < Y ≤ m′. On tiny, a block
  > at slot 3 followed by one at slot 11 meets it. That's `publish-tickets-with-mark-4`.
- [ ] None: only a block at exactly the closing phase can carry it
  > No: no block is needed *at* Y. The mark goes in the first block to get there.
- [ ] Every block from the close to the end of the epoch
  > No: one block announces the close. A block whose previous block was already at Y or
  > past it is too late.

**More tickets are entered than an epoch has slots. Which ones win?**

- [ ] The first E to be entered
  > No: γ_A keeps the best tickets entered so far, not the earliest.
- [ ] None can be ranked: ids are random
  > No: an id is random when it's made, but then it's a number, and the lottery keeps the
  > lowest. Chance decides who gets a low one, not whether low wins.
- [x] The E with the lowest ids
  > Yes: γ_A is sorted by id, lowest first, and holds at most E. In the run, ticket 0's id
  > starts `0x00e5` and ticket 11's `0xff0a`.

**The winners are sorted, best first. Which of them seals the second slot of the next epoch?**

- [ ] The second best
  > No: that's sorted order. The second best seals the third slot.
- [x] The worst of the winners
  > Yes: Z goes outside in: the first, the last, the second, the second to last. Even slots
  > count up from the front, odd ones down from the back.
- [ ] Whichever validator the entropy picks
  > No: that is the fallback. A full lottery seats tickets, and Z alone decides the order.

**The lottery fills up, but the chain then skips a whole epoch. Who seals the epoch it lands in?**

- [ ] The winners, outside in, as usual
  > No: they won slots in the epoch straight after theirs, e′ = e + 1, and that epoch went
  > by without a block.
- [ ] Nobody, until the next lottery
  > No: JAM never leaves a slot unclaimed. That's what the fallback is for.
- [x] The fallback keys
  > Yes: the winners need e′ = e + 1. Any other new epoch is sealed by
  > [lesson 8.3](./03-the-fallback-sealers.md)'s fallback.
:::

## What you have

The lottery's endgame: closing on time, announcing the winners, and seating them, outside
in, in the epoch they'll seal. [Lesson 8.5](./05-one-step-of-safrole.md) puts every piece
together into one step of Safrole.

Next: [8.5 One step of Safrole](./05-one-step-of-safrole.md)
