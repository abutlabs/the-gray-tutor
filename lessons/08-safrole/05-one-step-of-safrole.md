# One step of Safrole

Four lessons, four pieces: entropy, rotation, fallback sealers, the lottery's winners.
Time to snap them together. This lesson writes `safroleStep`: give it Safrole's state and
one block, and it hands back the state after the block, plus the two marks the block's
header must carry. Then the test throws the whole post-state of every vector it can at it.

## What the Gray Paper says

Nothing new in principle: it's §6, all at once. A few last rules join in:

- **τ′** is the block's slot ([lesson 7.1](../07-time-and-shuffling/01-epochs.md)).
- **The epoch mark** ([lesson 4.6](../04-blocks/06-the-header.md)) appears exactly at a new epoch ([lesson 7.1](../07-time-and-shuffling/01-epochs.md)), and carries
  η₀ and η₁ *as they were* ([lesson 6.3](../06-state-and-merklization/03-reading-the-state.md)), and the Bandersnatch and Ed25519 keys of γ′_P,
  the newly pending validators ([lesson 8.2](./02-rotating-the-validators.md)).
- **γ′_A**: a new epoch starts a new lottery, so the ticket accumulator starts again, from
  only the block's own tickets. Otherwise it keeps its tickets, plus any the block brings.

And three things this step can't do yet, all to do with the Bandersnatch VRF:

- **blocks that bring tickets**: a ticket's id is the output of its ring proof ([lessons
  8.6](./06-the-vrf-output.md) and [8.7](./07-entering-tickets.md));
- **γ′_Z**, the ring root of the new pending set ([lesson 8.8](./08-the-ring-root.md));
- **rejecting bad blocks**, most of which come down to checking tickets ([lessons 8.7](./07-entering-tickets.md)
  and [8.8](./08-the-ring-root.md)).

So `safroleStep` takes blocks with no tickets, and its test skips the rest, honestly
counted.

Here is all of it at once, on tiny, for you to drive. It starts at slot 0, from the state
every tiny safrole vector starts from. Press *next block* to make a block. While the
lottery is open, pick up to 3 tickets to go in it: lower ids are better. Fill the lottery
before phase 10, and the block that reaches phase 10 carries the tickets mark. Then the
next epoch's slots go to the winners, outside in. Or let it close short, and see the
fallback. Two things are stand-ins. A ticket id here is two hex digits, not a 32-byte VRF
output. And the page can't run Blake2b, so only the first fallback's picks are the real
ones; later picks are illustrative, and each says so.

<SafroleEpoch />

## The tests

The vector type learns about the block's tickets and the epoch mark:

**Replace in** `test/safrole.test.ts`

```ts
/** A safrole test vector: the parts of it the lessons use so far. */
type SafroleVector = {
  input: { slot: number; entropy: string; extrinsic: unknown[] }; // extrinsic: tickets
  pre_state: SafroleState;
  post_state: SafroleState;
  output: { err?: string; ok?: { epoch_mark: unknown; tickets_mark: unknown[] | null } };
};
```

**Add to** `test/safrole.test.ts`

```ts
import { safroleFromJson, safroleStep } from "../src/safrole.ts";
import { EpochMark } from "../src/block.ts";
import type { Bytes } from "../src/bytes.ts";
import type { Safrole } from "../src/safrole.ts";

test("a whole step of Safrole: the state and both marks, for each block without tickets", () => {
  let steps = 0;
  for (const { config, name, vector } of acceptedVectors()) {
    const { input, pre_state, post_state, output } = vector;
    if (input.extrinsic.length > 0) continue; // reading tickets needs Bandersnatch
    const vrfOutput: Bytes = fromHex(input.entropy);
    const offenders: Bytes[] = pre_state.post_offenders.map(fromHex);
    const before: Safrole = safroleFromJson(pre_state);
    const step = safroleStep(config, before, input.slot, vrfOutput, offenders);
    const after: Safrole = safroleFromJson(post_state);
    assert.deepEqual(step.after, after, name);
    const epochMarkJson = output.ok?.epoch_mark;
    const ticketsMarkJson = output.ok?.tickets_mark;
    const epochMark: EpochMark | null = epochMarkJson ? EpochMark.fromJson(epochMarkJson) : null;
    assert.deepEqual(step.epochMark, epochMark, name);
    const ticketsMark: TicketBody[] | null = ticketsMarkJson ? tickets(ticketsMarkJson) : null;
    assert.deepEqual(step.ticketsMark, ticketsMark, name);
    steps++;
  }
  assert.equal(steps, 22); // 10 tiny, 12 full
});
```

One `deepEqual` checks the *entire* state after the block: τ, η, all four validator sets,
the accumulator and the sealers. Only γ_Z is left out. Two more check the marks.

## The code

`safroleStep` takes Safrole's state and one block, and does six things, in order:

1. **Is it a new epoch?** The block's epoch against the previous block's ([lesson 7.1](../07-time-and-shuffling/01-epochs.md)).
2. **Stir the entropy**, and at a new epoch move it along one ([lesson 8.1](./01-stirring-the-entropy.md)).
3. **At a new epoch, rotate the validators**, keeping offenders out ([lesson 8.2](./02-rotating-the-validators.md)).
4. **Choose the sealers:** the lottery's winners if it closed full ([lesson 8.4](./04-the-lotterys-winners.md)); if not,
   at a new epoch, the fallback keys ([lesson 8.3](./03-the-fallback-sealers.md)); otherwise, keep this epoch's.
5. **At a new epoch, empty the ticket accumulator.**
6. **Write the two marks:** the epoch mark at a new epoch, the tickets mark when the
   lottery closes.

**Add to** `src/safrole.ts`

```ts
import { TicketBody } from "./block.ts";
import type { EpochMark } from "./block.ts";
import { ValidatorKey } from "./state.ts";
import { fromHex } from "./bytes.ts";

/** γ_S, who seals each slot of this epoch: the lottery's winning tickets, or fallback keys. */
export type Sealers = { tickets: TicketBody[] } | { keys: Bytes[] };

/** Safrole's part of the state (GP §6), as your client keeps it. */
export type Safrole = {
  time: number; // τ: the slot of the most recent block
  entropy: Bytes[]; // η
  validators: ValidatorSets; // ι, γ_P, κ, λ
  accumulator: TicketBody[]; // γ_A: the lottery's best tickets so far
  sealers: Sealers; // γ_S
};

/**
 * One block of Safrole (GP §6), for a block that brings no tickets: the state after it,
 * and the two marks its header must carry.
 */
export function safroleStep(
  config: Config,
  before: Safrole,
  slot: number, // the block's slot, τ′
  vrfOutput: Bytes, // Y(H_v), from the block's entropy source
  offenders: Bytes[], // ψ′_O: Ed25519 keys convicted in disputes
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
  const after: Safrole = {
    time: slot,
    entropy,
    validators,
    accumulator: newEpoch ? [] : before.accumulator, // a new epoch starts a new lottery
    sealers,
  };
  // the epoch mark: η₀ and η₁ as they were, and γ′_P, the validators after next, by two keys
  const keys = validators.pending.map(({ bandersnatch, ed25519 }) => ({ bandersnatch, ed25519 }));
  const epochMark: EpochMark | null = newEpoch
    ? { entropy: before.entropy[0], tickets_entropy: before.entropy[1], validators: keys }
    : null;
  const tickets = ticketsMark(config, before.time, slot, before.accumulator);
  return { after, epochMark, ticketsMark: tickets };
}

/** Safrole's state as the test vectors write it, under the Gray Paper's Greek names. */
export type SafroleJson = {
  tau: number;
  eta: string[];
  iota: unknown[];
  gamma_k: unknown[];
  kappa: unknown[];
  lambda: unknown[];
  gamma_a: unknown[];
  gamma_s: { keys?: string[]; tickets?: unknown[] };
};

/** Safrole's state, from the vectors' JSON. */
export function safroleFromJson(json: SafroleJson): Safrole {
  const keys = (list: unknown[]) => list.map((key) => ValidatorKey.fromJson(key));
  const tickets = (list: unknown[]) => list.map((ticket) => TicketBody.fromJson(ticket));
  const { keys: fallback, tickets: winners } = json.gamma_s;
  return {
    time: json.tau,
    entropy: json.eta.map(fromHex),
    validators: {
      staging: keys(json.iota),
      pending: keys(json.gamma_k),
      active: keys(json.kappa),
      previous: keys(json.lambda),
    },
    accumulator: tickets(json.gamma_a),
    sealers: winners ? { tickets: tickets(winners) } : { keys: (fallback ?? []).map(fromHex) },
  };
}
```

Two imports change shape here. `src/safrole.ts` already imports the *types* `ValidatorKey`
([lesson 8.2](./02-rotating-the-validators.md)) and `TicketBody` ([lesson 8.4](./04-the-lotterys-winners.md)). Now it needs their *values* too, for `fromJson`,
and a value import brings the type along. So take those two names out of the
`import type` lines, and drop a line that's left empty. TypeScript would complain about a
name imported twice.

`Sealers` is either tickets or keys: `{ tickets } | { keys }`. The `"tickets" in sealers`
check in the next program tells them apart. `safroleFromJson` is to Safrole's state what
`fromJson` is to a codec: the vectors' form, with its Greek names, turned into your
client's.

`safroleStep` itself reads like a summary of [Part 8](./index.md), the six steps in order. Every line of
it is a lesson you've done. The one place three lessons meet is step 4, the sealers:

```ts
  let sealers = before.sealers;
  if (sealedByTickets(config, before.time, slot, before.accumulator)) {
    sealers = { tickets: outsideIn(before.accumulator) };
  } else if (newEpoch) {
    sealers = { keys: fallbackKeys(config, entropy[2], validators.active) };
  }
```

The order matters. `sealedByTickets` is true only at a new epoch that follows straight on
from a lottery that closed full, so the winners are tried first. Any other new epoch falls
back to keys picked from η′₂ and κ′: `entropy[2]` and `validators.active` are the values
*after* this block's stir and rotation, as F(η′₂, κ′) asks. In the middle of an epoch
neither branch runs, and the sealers stay as they are.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ a whole step of Safrole: the state and both marks, for each block without tickets (648.7ms)
...
ℹ tests 79
ℹ suites 0
ℹ pass 79
ℹ fail 0
...
reported 79 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791730491045
...
```

22 whole steps, every field right: 10 on tiny, 12 on full. The 11 accepted vectors left
over all bring tickets.

## Watch it

**New file** `bin/safrole.ts`

```ts
// Runs one block of Safrole from a safrole test vector (one whose block brings no tickets),
// tells what happened, and checks the result against the vector.
// Usage: npm run safrole <vector.json>, e.g.
//        npm run safrole ../vectors/stf/safrole/tiny/enact-epoch-change-with-padding-1.json

import { readFileSync } from "node:fs";
import { isDeepStrictEqual } from "node:util";
import { fromHex, toHex } from "../src/bytes.ts";
import { FULL, TINY } from "../src/config.ts";
import { Run } from "../src/obs.ts";
import { safroleFromJson, safroleStep } from "../src/safrole.ts";

const [file] = process.argv.slice(2);
const config = file.includes("/full/") ? FULL : TINY;
const { input, pre_state, post_state } = JSON.parse(readFileSync(file, "utf8"));
if (input.extrinsic.length > 0) {
  const count = input.extrinsic.length;
  console.log(`this block brings ${count} tickets: reading them needs Bandersnatch`);
  process.exit(0);
}
const before = safroleFromJson(pre_state);
const offenders = pre_state.post_offenders.map(fromHex);
const step = safroleStep(config, before, input.slot, fromHex(input.entropy), offenders);
const { after, epochMark, ticketsMark } = step;

const run = new Run("safrole");
const told = (what: string) => {
  console.log(what);
  run.event("told", { what });
};
told(`slot ${before.time} → ${after.time}`);
const short = (hash: Uint8Array) => `${toHex(hash).slice(0, 10)}…`;
told(`η₀ stirred: ${short(before.entropy[0])} → ${short(after.entropy[0])}`);
told(`a new epoch: ${epochMark !== null}`);
const zeroed = after.validators.pending.filter((k) => k.ed25519.every((b) => b === 0)).length;
if (epochMark) told(`validators moved along one set; offenders zeroed: ${zeroed}`);
const sealers = "tickets" in after.sealers ? "the lottery's winners" : "fallback keys";
told(`sealers: ${sealers}; tickets mark: ${ticketsMark !== null}`);
const matches = isDeepStrictEqual(after, safroleFromJson(post_state));
told(`the whole state after matches the vector: ${matches}`);
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

**What flows through it.** The vector fields the one step reads — this one's extrinsic
is empty, which is what lets the program run it — the values it computes, and the lines
it prints:

::: code-group

```json [what goes in]
{
  "input": {
    "slot": 48,
    "entropy": "0x8c2e6d327dfaa6ff…",
    "extrinsic": []
  },
  "pre_state": {
    "tau": 45,
    "eta": ["0x03170a2e75…", "…", "…", "…"],
    "post_offenders": ["0xab0084d01534b31c…"],
    "…": "the four validator sets and the sealers, as safroleFromJson reads them"
  }
}
```

```ts [what it computes]
// bin/safrole.ts's step, the whole engine turned once
const computed = {
  newEpoch: true, // slot 45 is epoch 3, slot 48 epoch 4: everything turns at once
  eta0: "0xa0243a82…", // H(η₀ ⌢ input.entropy); the other three step down
  zeroed: 1, // Φ: post_offenders' key arrives in pending as zeros
  sealers: "fallback keys", // no full lottery closed, so F deals from η′₂ and κ′
  ticketsMark: false, // and the header gets no mark for it
  matches: true, // the whole state after equals the vector's post_state
};
```

```text [what comes out]
slot 45 → 48
η₀ stirred: 0x03170a2e… → 0xa0243a82…
a new epoch: true
the whole state after matches the vector: true
```

:::

Read the input into the output: an empty `extrinsic` is the program's admission ticket —
tickets would need Bandersnatch, [lesson 8.7](./07-entering-tickets.md)'s work. `slot` 48 against `tau` 45 turns
the epoch, so every piece of the last four lessons fires in one step: `input.entropy`
stirs η₀, `post_offenders` zeroes one pending key, and with no closed lottery the sealers
fall back. The final line is the point of the program: your step's entire state equals
the vector's.

**Run**

```sh
npm pkg set scripts.safrole="node bin/safrole.ts"
npm pkg set scripts.safrole-new-epoch="node bin/safrole.ts ../vectors/stf/safrole/tiny/enact-epoch-change-with-padding-1.json"
npm run safrole-new-epoch
```

```text
slot 45 → 48
η₀ stirred: 0x03170a2e… → 0xa0243a82…
a new epoch: true
validators moved along one set; offenders zeroed: 1
sealers: fallback keys; tickets mark: false
the whole state after matches the vector: true
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=safrole-1791730495403
```

That's the busiest vector of all: a new epoch, an offender, fallback sealers. Try the
others too: `enact-epoch-change-with-no-tickets-1.json` (one slot on, and only η₀
stirs), and `publish-tickets-with-mark-5.json` (a new epoch sealed by tickets). A vector
whose block brings tickets, such as `publish-tickets-no-mark-2.json`, gets a polite
refusal. The *Safrole* panel tells each step's story.

![Safrole panel](./images/05-safrole.png)

<details>
<summary>lasair: the missing piece, in <code>conformance/stf_transitions.ml</code></summary>

```ocaml
      (* Update η[0] with new accumulation *)
      let eta0 = Bytes.sub entropy 0 32 in
      let gamma = Bytes.sub entropy_source 0 32 in
      let banderout = Bandersnatch_ffi.banderout gamma in
      let new_eta0 = Lasair.Merklization.blake2b256 (Bytes.cat eta0 banderout) in
```

Here's what your client still trusts the vectors for. lasair takes the first 32 bytes of
the header's 96-byte entropy source, a point on the Bandersnatch curve, and asks its
Bandersnatch library (`Bandersnatch_ffi`, Rust underneath) for the VRF output. The
vectors handed you that output as `input.entropy`. The line after it is your
`nextEntropy`, word for word.

</details>

## Check your understanding

::: check
**A new epoch, and no full lottery. Do the fallback keys use η and κ from before this block's changes, or after?**

- [ ] Before: η₂ and κ, as the block found them
  > No: F(η′₂, κ′) asks for the values after. The old κ is the set leaving active duty; it
  > would seat last epoch's validators.
- [x] After: η′₂ and κ′, once the entropy has moved along and the validators rotated
  > Yes: that's why step 4 comes after steps 2 and 3. `entropy[2]` and `validators.active`
  > are the new values.
- [ ] It makes no difference: η₂ and η′₂ are always the same
  > No: at a new epoch the history moves along, and η′₂ is the old η₁.

**What does the epoch mark carry?**

- [ ] η′₀ and η′₁ from after the block, and κ′'s keys
  > No: the entropy is η₀ and η₁ as they were. The validators are γ′_P, the next epoch's.
- [x] η₀ and η₁ as they were, and the Bandersnatch and Ed25519 keys of γ′_P
  > Yes: γ′_P is the newly pending set, active from the next epoch, and two keys each are
  > all the mark holds.
- [ ] η₀ and η₁ as they were, and all four parts of κ′'s keys
  > No: just two keys a validator, and of γ′_P, the next epoch's, not of the validators
  > taking over now.

**The first block of a new epoch brings no tickets. What is γ′_A?**

- [x] Empty: a new epoch starts a new lottery
  > Yes: the old tickets have done their job, sealing this epoch if the lottery filled. The
  > next lottery starts from nothing.
- [ ] The old γ_A, since its winners still have slots to seal
  > No: if they won, they're copied into γ′_S first, outside in. γ_A is free to start
  > again.
- [ ] The old γ_A, minus the tickets that won
  > No: every old ticket goes. Losers from last epoch's lottery don't carry over.

**A block in the middle of an epoch, with no tickets. What changes?**

- [ ] τ, η₀, and the sealers, which are worked out again every block
  > No: γ_S changes only at a new epoch. In the middle of one, neither branch of step 4
  > runs.
- [ ] Nothing: Safrole only acts when an epoch begins
  > No: every block moves the time on and stirs η₀.
- [x] τ becomes the block's slot, and η₀ is stirred; everything else stays
  > Yes: `enact-epoch-change-with-no-tickets-1` is one such block. The time moves on, η₀
  > stirs, and nothing else does.
:::

## What you have

Safrole, end to end, for every block that brings no tickets: the whole state after it, and
both marks for its header, right on every vector it can run. The next four lessons fill
in what it still takes on trust, starting with the one value the vectors hand over every
block: the VRF output, in [lesson 8.6](./06-the-vrf-output.md).

Next: [8.6 The VRF output](./06-the-vrf-output.md)
