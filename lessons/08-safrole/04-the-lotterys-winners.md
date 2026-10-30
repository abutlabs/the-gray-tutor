# The lottery's winners

Safrole's big idea. For the first Y slots of every epoch, validators enter a **lottery**
with anonymous tickets: each proves "a validator made me" without saying which. The best
tickets win a slot in the *next* epoch, and nobody knows who holds one until that
validator makes its block, so nobody can plan an attack on the next author. This lesson
handles the result: closing the lottery, announcing the winners, handing out their slots.

(Entering a ticket waits for [lesson 8.7](./07-entering-tickets.md), and checking its ring proof for [lesson 8.8](./08-the-ring-root.md). The
winners, though, are already in the state, so everything here works today.)

## New words

- **Ticket accumulator.** γ_A. The best tickets entered so far in this epoch's lottery, at
  most E of them, sorted by id, lowest first. *Example:* at a new epoch it starts again,
  from only that block's own tickets.
- **Outside-in order.** Z. The order the winning tickets take their slots: the first, the
  last, the second, the second to last, and so on inwards. *Example:* slot 0 gets the best
  ticket, slot 1 the worst of the winners.

Both are in the [glossary](../glossary.md).

## What the Gray Paper says

§6. The state keeps γ_A, the *ticket accumulator*: the best tickets entered so far,
at most E of them, sorted by id. A ticket's id is random (a VRF output), and lower is
better.

**Y** (not 8.1's Y(·), the VRF output: the Gray Paper uses two different letters) is the
phase at which the lottery closes: slot 500 of a 600-slot epoch on full, 10
of 12 on tiny. Slots tick with the clock whether or not their block arrives: a slot whose
sealer stays silent is simply empty, so there may be no block *at* slot 10 to make the
announcement. Both rules below therefore compare two consecutive *blocks*: the parent, at
phase m of its epoch, and the block itself, at phase m′, however many empty slots lie
between them. Then two things can happen:

- **The tickets mark** (*The Markers*): the block that crosses phase Y, in the same epoch
  (m < Y ≤ m′), puts the winners in its header, if the lottery filled up, with all E
  tickets. Everyone learns the winning *tickets*, though still not who holds them.
- **The sealers** (*The Slot-Sealer Sequence*): at the next epoch, if it follows on
  directly (e′ = e + 1), the block before was past the close (m ≥ Y), and the lottery
  was full, then γ′_S is the winners. Otherwise it's [lesson 8.3](./03-the-fallback-sealers.md)'s fallback.

<LotteryClose />

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

The second test pins the boundaries, because "m < Y ≤ m′" is exactly where off-by-one
bugs live: the block from slot 9 to 10 closes tiny's lottery, and the one from 10 to 11
doesn't, since by then it's closed. The vectors only cross Y from further away (slot 3 to
11, say), so without this test a `<=` where a `<` belongs would slip through.

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

**What flows through it.** The vector fields the program reads — the accumulator is
already sorted, lowest id first — the values it computes, and the lines it prints:

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

Read the input into the output: `tau` 3 to `slot` 11 steps over phase 10 — Y, where the
lottery closes — and `gamma_a` holds all 12 tickets, so there *is* a mark. The order the
output shows is Z on the input's order: `gamma_a[0]`, the `0x00e5…` id, takes slot 0;
`gamma_a[11]`, the `0xff0a…` one, takes slot 1; and the zip walks inwards from there.

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

Read the ticket column down: 0, 11, 1, 10, 2, 9, … the zip of two lists, one counting
up, one counting down, meeting at 5 and 6 in the middle. And the ids show what "best"
means: ticket 0's id starts `0x00e5`, ticket 11's `0xff0a`. The *Lottery* panel has every
seat. Try `publish-tickets-with-mark-3.json`, one block earlier: no mark yet.

![Lottery panel](./images/04-lottery.png)

<details>
<summary>lasair: outside in, in <code>conformance/stf_transitions.ml</code></summary>

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
**Twelve winners, sorted from t0, the best, to t11. Which ticket seals slot 3 of the next epoch?**

- [ ] t3
  > No: that's sorted order. Z goes outside in: t0, t11, t1, t10, and so on.
- [x] t10
  > Yes: slot 0 gets t0, slot 1 t11, slot 2 t1, slot 3 t10. Even slots count up from the
  > front, odd ones down from the back.
- [ ] t1
  > No: t1 is slot 2's. Slot 3 takes the next one from the back, t10.

**Tiny's lottery is full. A block at slot 3 is followed by one at slot 11, in the same epoch. Does the slot-11 block carry the tickets mark?**

- [x] Yes: it's the block that crosses phase 10, since m = 3 < Y ≤ m′ = 11
  > Yes: there was no block at slot 10, and none is needed. The mark goes in the first
  > block to reach Y. That's `publish-tickets-with-mark-4`.
- [ ] No: only a block at exactly phase 10 can carry it
  > No: slots can be empty. The rule is m < Y ≤ m′, and a jump from 3 to 11 meets it.
- [ ] No: the lottery closed at phase 10, so slot 11 is too late
  > No: the mark announces the close, in the first block after it. Only a block whose
  > previous block was already at Y or past it is too late.

**Two tickets' ids start `0x00e5` and `0xff0a`. Which is better?**

- [ ] `0xff0a`, the higher
  > No: lower is better. `0xff0a…` was ticket 11, the worst of the twelve winners.
- [x] `0x00e5`, the lower
  > Yes: γ_A keeps its tickets sorted by id, lowest first, and ticket 0, `0x00e5…`, took
  > slot 0.
- [ ] Neither: ids are random, so they don't rank
  > No: an id is random when it's made, but then it's a number, and the lottery keeps the
  > lowest. Chance decides who gets a low one, not whether low wins.

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
in, in the epoch they'll seal. [Lesson 8.5](./05-one-step-of-safrole.md) puts
every piece together into one step of Safrole.

Next: [8.5 One step of Safrole](./05-one-step-of-safrole.md)
