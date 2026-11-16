# The slot clock

**In one sentence:** a block is not valid until its slot has begun, so a node checks every
arriving block against its clock, and holds the early ones until their time comes.

Three blocks have arrived at once, for slots 1, 2 and 3. Move the clock and watch each
one become importable.

<a id="try-it"></a>

<SlotClock />

## The idea

Your importer never looked at a clock. It checked that a block's slot came after its
parent's, and that was all it could check: a function has no idea what time it is.

A node does. And the Gray Paper has a second half to that rule, which only a node can
apply: a block's slot must have started. Slot 3 begins 18 seconds after JAM's clock
started. A block for slot 3 that arrives at second 17 is not valid. At second 18, the
same block is.

Notice what kind of "invalid" this is. A bad seal stays bad for ever. This refusal wears
off, with nothing but time. So a node doesn't throw an early block away. It keeps it to one
side, and when the clock reaches the block's slot, imports it like any other.

By the end of this lesson your node takes the time with every block, holds the early
ones, and lets them in when their slot begins.

## What the Gray Paper says

One line of §5, quoted in [lesson 4.6](../04-blocks/06-the-header.md#eq-5-8):

**(5.8)** P(H)_T < H_T ∧ H_T · P ≤ 𝒯

- H_T is the block's slot, and P(H)_T its parent's.
- P is the length of a slot: 6 seconds.
- 𝒯 is the wall clock: seconds since the
  [*JAM Common Era*](../glossary.md#jam-common-era).

Read it aloud: "the parent's slot is less than the block's, and the block's slot times six
is at most the time now."

The first half your importer checks already: `bad_slot`, in
[lesson 19.4](../19-block-import/04-importing-a-block.md). The second half says the slot's
first second has come. H_T · P is the moment the slot begins, which is what `slotAt`
turned the other way round in [lesson 0.4](../00-start/04-the-jam-clock.md).

Then the paper adds one sentence, and it is the one that shapes the code: "Blocks
considered invalid by this rule may become valid as 𝒯 advances."

## The tests

A test can't wait six seconds for a slot. So the node never reads the clock itself: every
function that needs the time is handed it. In a test the time is whatever the test says.

**New file** `test/clock.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { Block, Header } from "../src/block.ts";
import { fromHex } from "../src/bytes.ts";
import type { Chain } from "../src/chain.ts";
import { admitEarly, receiveBlock, startChain } from "../src/chain.ts";
import { TINY } from "../src/config.ts";
import { slotAt, slotStart } from "../src/time.ts";
import { vectorJson } from "./vectors.ts";

type Entries = { key: string; value: string }[];
type Genesis = { header: unknown; state: { keyvals: Entries } };
type TraceStep = { block: unknown };

/** A chain of one block: the traces' genesis. */
function fromGenesis(): Chain {
  const genesis = vectorJson("traces/fallback/genesis.json") as Genesis;
  const entries = genesis.state.keyvals.map((e) => ({
    key: fromHex(e.key),
    value: fromHex(e.value),
  }));
  return startChain(TINY, Header(TINY).fromJson(genesis.header), entries);
}

/** Block n of the fallback trace: its slot is n. */
function block(n: number): Block {
  const step = vectorJson(`traces/fallback/${String(n).padStart(8, "0")}.json`) as TraceStep;
  return Block(TINY).fromJson(step.block);
}

test("a slot's start: slot 5 begins 30 seconds in, and slotStart undoes slotAt", () => {
  assert.equal(slotStart(5).toISOString(), "2025-01-01T12:00:30.000Z");
  assert.equal(slotAt(slotStart(47)), 47);
  assert.equal(slotAt(new Date(slotStart(47).getTime() - 1)), 46); // a millisecond before
});

test("a block from the future is held, then let in when its slot begins", () => {
  const chain = fromGenesis();
  assert.ok(!("error" in receiveBlock(TINY, chain, block(1), slotStart(1))));
  const tooSoon = new Date(slotStart(2).getTime() - 1);
  assert.deepEqual(receiveBlock(TINY, chain, block(2), tooSoon), { error: "too_early" });
  assert.equal(chain.blocks.size, 2); // genesis and block 1: block 2 is not in the tree
  assert.equal(chain.early.length, 1); // it is held
  assert.deepEqual(admitEarly(TINY, chain, tooSoon), []); // still too soon
  const admitted = admitEarly(TINY, chain, slotStart(2));
  assert.deepEqual(admitted.map((b) => b.slot), [2]);
  assert.equal(chain.blocks.size, 3);
  assert.equal(chain.early.length, 0);
});

test("held blocks join in slot order, whatever order they came in", () => {
  const chain = fromGenesis();
  receiveBlock(TINY, chain, block(1), slotStart(1));
  receiveBlock(TINY, chain, block(3), slotStart(1)); // two slots early
  receiveBlock(TINY, chain, block(2), slotStart(1)); // one slot early
  assert.equal(chain.blocks.size, 2);
  const admitted = admitEarly(TINY, chain, slotStart(3));
  assert.deepEqual(admitted.map((b) => b.slot), [2, 3]); // block 3 needs block 2 first
  const [tip] = chain.tips;
  assert.equal(chain.blocks.get(tip)?.slot, 3);
});
```

## The code

First the moment a slot begins, beside `slotAt`:

**Add to** `src/time.ts`

```ts
/** H_T · P as a moment: when a timeslot begins. It undoes slotAt. */
export function slotStart(slot: number): Date {
  return new Date((JAM_COMMON_ERA + slot * SLOT_SECONDS) * 1000);
}
```

Then the tree gets a place for early blocks:

**Replace in** `src/chain.ts`

```ts
import { slotAt } from "./time.ts";

/** The tree: every kept block by its hash, the tips, the final block, and the early blocks. */
export type Chain = {
  blocks: Map<string, Kept>;
  tips: Set<string>;
  final: string; // the newest block known to be final
  early: Block[]; // blocks whose slot hasn't begun: not valid yet (5.8)
};

/** A tree of one block: the block the node starts from, and the state after it. */
export function startChain(config: Config, header: Header, entries: KeyValue[]): Chain {
  const hash = headerHash(config, header);
  const first: Kept = {
    hash: toHex(hash),
    parent: null,
    slot: header.slot,
    ticketed: false, // the node takes it as given, whatever its seal
    entries,
    ancestry: [{ slot: header.slot, header_hash: hash }],
  };
  return {
    blocks: new Map([[first.hash, first]]),
    tips: new Set([first.hash]),
    final: first.hash, // the node starts from a block it trusts: final, until a later one is
    early: [],
  };
}
```

**Add to** `src/chain.ts`

```ts
/**
 * A block arrives, at a moment in time. If its slot hasn't begun it isn't valid yet
 * (GP 5.8, H_T · P ≤ 𝒯): the node holds it and says so. Otherwise it joins the tree.
 */
export function receiveBlock(
  config: Config,
  chain: Chain,
  block: Block,
  now: Date,
): Kept | Refused {
  if (block.header.slot > slotAt(now)) {
    chain.early.push(block);
    return { error: "too_early" };
  }
  return addBlock(config, chain, block);
}

/**
 * The clock has moved on: adds the held blocks whose slot has begun, lowest slot first,
 * so that a parent is in the tree before its child. Returns the blocks that joined; one
 * that is refused now is dropped.
 */
export function admitEarly(config: Config, chain: Chain, now: Date): Kept[] {
  const due = chain.early.filter((b) => b.header.slot <= slotAt(now));
  chain.early = chain.early.filter((b) => b.header.slot > slotAt(now));
  const joined: Kept[] = [];
  for (const block of due.sort((a, b) => a.header.slot - b.header.slot)) {
    const kept = addBlock(config, chain, block);
    if (!("error" in kept)) joined.push(kept);
  }
  return joined;
}
```

```ts
  if (block.header.slot > slotAt(now)) {
```

This is H_T · P ≤ 𝒯, turned round. `slotAt(now)` is the slot the clock is in. A block for
that slot or an earlier one has begun. A block for a later one hasn't.

The check sits in front of `addBlock`, not inside `importBlock`. The rules you built for
the importer stay a function of a state and a block, with the same answer whenever you
ask. Time is the node's business.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ a slot's start: slot 5 begins 30 seconds in, and slotStart undoes slotAt (1ms)
✔ a block from the future is held, then let in when its slot begins (1ms)
✔ held blocks join in slot order, whatever order they came in (1ms)
...
ℹ fail 0
...
```

Two things this leaves for later. Nothing calls `admitEarly` yet: the program that stays
up does, each time a slot begins. And a real clock is never exactly right, so two honest
nodes can disagree for a moment about whether a block is early. The paper's rule has no
allowance for that, and neither does this code.

## Check your understanding

::: check
**A block's slot must have begun before the block is valid. Why can't the importer of the earlier parts check that?**

- [ ] The header doesn't carry the slot
  > No: it does, as H_T. The importer already compares it with the parent's.
- [x] The importer is a function of a state and a block, and the answer depends on when you ask
  > Yes: the same block is invalid at second 17 and valid at second 18. Only something
  > with a clock can tell, and that is the node.
- [ ] The Gray Paper leaves the check to GRANDPA
  > No: it is (5.8), a rule on the header.

**A valid block arrives four seconds before its slot begins. What should a node do with it?**

- [ ] Import it: four seconds won't matter
  > No: until its slot begins, (5.8) says it is not valid.
- [ ] Refuse it for good, like a block with a bad seal
  > No: the paper says a block invalid by this rule may become valid as time advances.
- [x] Hold it, and import it when its slot begins
  > Yes: this is the one refusal that wears off.

**Blocks for slots 2 and 3 are both held. The clock reaches slot 3. Why does the order they are let in matter?**

- [ ] The lower slot has the better seal
  > No: the seal has nothing to do with it.
- [ ] It doesn't: the tree sorts itself out
  > No: a block whose parent isn't in the tree yet is an orphan, and is not kept.
- [x] Block 3 is built on block 2, so block 2 must be in the tree first
  > Yes: a block is imported onto its parent's state. Lowest slot first puts every
  > parent in before its child.

**What does the slot of the newest block in a node's tree tell it about the time?**

- [ ] The time exactly: the newest block's slot is the current slot
  > No: slots can pass with no block, and a node can be behind.
- [x] Only a lower bound: the clock is at that slot or later
  > Yes: by (5.8) that block's slot had begun when it was imported. How much later it
  > is now, only the clock says.
- [ ] Nothing at all
  > No: a block can't be from the future, so the time is at least its slot's start.
:::

## What you have

A node that knows what time it is in slots: `slotStart` for the moment a slot begins,
`receiveBlock` to check an arriving block against the clock, and `admitEarly` to let the
held blocks in once their slot has come. The rules of import are untouched.

Next, the program that stays running: it reads the clock, takes blocks as they come, and
says which block is best.
