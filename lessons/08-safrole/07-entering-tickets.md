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

§6, *The Extrinsic and Tickets*. A block's tickets extrinsic is a list of (attempt, ring
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
the numbers side by side — flip to full and step the blocks to see the whole supply flow
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
