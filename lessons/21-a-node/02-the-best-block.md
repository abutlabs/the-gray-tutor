# The best block

**In one sentence:** of all the blocks a node holds, the best block is the one it builds
on and votes for: it follows the final block, no validator sealed twice on the way to it,
and it has the most ticket-sealed blocks behind it.

Here are five blocks of the tree from the last lesson, fork and all. Move the final block and watch which
blocks stay candidates, and which one is best.

<a id="try-it"></a>

<BestBlock />

## The idea

Your tree has two tips. A validator about to make a block has to pick one block to build
on. Which?

Not "the newest", and not "the longest". The Gray Paper picks in two steps. First it
throws out the blocks a node shouldn't trust. Then, of what is left, it takes the one with
the best seals.

A block is thrown out for one of three reasons:

- **It doesn't follow the final block.** A [*final block*](../glossary.md#final-block) is
  one the validators have voted never to undo. Anything not built on it is dead.
- **Somebody sealed twice.** Two valid blocks in one slot are an
  [*equivocation*](../glossary.md#equivocation). Both blocks are out, and so is every
  block built on either, until one of the two is final.
- **It isn't audited.** The work in it hasn't been checked yet.

Of the blocks that survive, the [*best block*](../glossary.md#best-block) is the one with
the most ancestors sealed by a ticket. The paper gives the rule and not the reason. One
that fits Safrole's design ([Part 8](../08-safrole/index.md)): a ticket's winner stays
secret until their slot comes, and a fallback slot's author is known to everyone from the
start of the epoch.

Your fork is an equivocation: two blocks at slot 2, sealed by the same author. So neither
side is a candidate. That leaves genesis and block 1, and block 1 is best. The next author
builds on block 1, and both slot-2 blocks are left behind unless the validators make one
of them final. By the end of this lesson your client works that out.

## What the Gray Paper says

§19, *Grandpa and the Best Chain*, is quoted whole in
[What runs where](../what-runs-where.md#gp-19). Its four lines:

1. **(19.1) It follows the final block.** The final block's header, H♮, is among the best
   block's ancestors, 𝐀(H♭). ♮ marks the final block and ♭ the best one.
2. **(19.2) It is audited.** Auditing happens off the chain, and your client doesn't do
   it yet. Until it does, every block it has imported counts as audited.
3. **(19.3) Nobody sealed twice.** There are no two headers A and B where: A is not B,
   they have the same slot, A is one of the best block's ancestors, and A is not one of
   the final block's. A block counts among its own ancestors (5.3), so A can be the
   candidate itself. B can be any valid block the node has seen. The rule asks only for
   the same slot, not the same author.
4. **(19.4) The most tickets.** m is the sum of 𝐓 over the best block's ancestors, where
   𝐓 is 1 for a [*ticket-sealed block*](../glossary.md#ticket-sealed-block) and 0 for a
   fallback one ([lesson 8.9](../08-safrole/09-seals.md)). The best block is the
   candidate with the largest m.

Read (19.3)'s last condition again: A is *not* an ancestor of the final block. Once one
side of an equivocation is final, the rule stops applying to it, and the chain can grow
again. Try it [at the top](#try-it): make block 2′ final.

The paper doesn't say what (19.3) is for. What it does is plain to see: two nodes that
received the slot-2 blocks in opposite orders still agree on what to build on, because
neither block is a candidate for either of them.

Two things the paper leaves open, and what your client does:

- **Who says a block is final?** [*GRANDPA*](../glossary.md#grandpa), the validators'
  voting protocol, which your client doesn't speak. So the tree holds the final block's
  hash and something else sets it. It starts at the block the node started from.
- **A tie on m.** In a fallback epoch every block has 𝐓 = 0, so every candidate has the
  same m. Your client then takes the candidate with the most ancestors, and after that
  the lower hash. That is our choice, not the paper's. It is why block 1 beats genesis
  above: both have m = 0, and block 1 has two ancestors to genesis's one.

## The tests

Three real cases. The fork of [lesson 21.1](./01-the-block-tree.md) is an equivocation.
Making one side final settles it. And the `safrole` trace's blocks 48 to 50 are sealed by
tickets, so m can be counted on real seals.

**New file** `test/best.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { acceptable, bestBlock, ticketed } from "../src/best.ts";
import { Block, Header } from "../src/block.ts";
import { fromHex } from "../src/bytes.ts";
import type { Chain, Kept } from "../src/chain.ts";
import { addBlock, startChain } from "../src/chain.ts";
import { TINY } from "../src/config.ts";
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

/** Adds block n of a trace family to the tree, and gives back what was kept. */
function add(chain: Chain, family: string, n: number): Kept {
  const step = vectorJson(`traces/${family}/${String(n).padStart(8, "0")}.json`) as TraceStep;
  const kept = addBlock(TINY, chain, Block(TINY).fromJson(step.block));
  assert.ok(!("error" in kept), `${family} block ${n}`);
  return kept;
}

test("one line of blocks: every block is a candidate, and the best is the tip", () => {
  const chain = fromGenesis();
  let tip = add(chain, "fallback", 1);
  for (let n = 2; n <= 5; n++) tip = add(chain, "fallback", n);
  for (const hash of chain.blocks.keys()) assert.ok(acceptable(chain, hash));
  assert.equal(ticketed(chain, tip.hash), 0); // a fallback epoch: no ticket behind any block
  assert.equal(bestBlock(chain).hash, tip.hash); // a tie on m: the most ancestors wins
});

test("an equivocation: two blocks at slot 2; neither side is a candidate; block 1 is best", () => {
  const chain = fromGenesis();
  const one = add(chain, "fallback", 1);
  const quiet = add(chain, "fallback", 2);
  const busy = add(chain, "storage", 2);
  const third = add(chain, "storage", 3);
  assert.equal(quiet.slot, busy.slot);
  assert.ok(!acceptable(chain, quiet.hash));
  assert.ok(!acceptable(chain, busy.hash));
  assert.ok(!acceptable(chain, third.hash)); // built on one of the two
  assert.ok(acceptable(chain, one.hash));
  assert.equal(bestBlock(chain).hash, one.hash);
});

test("finality settles it: with block 2′ final, the best block is the one built on it", () => {
  const chain = fromGenesis();
  add(chain, "fallback", 1);
  const quiet = add(chain, "fallback", 2);
  const busy = add(chain, "storage", 2);
  const third = add(chain, "storage", 3);
  chain.final = busy.hash; // as if the validators had voted it final
  assert.ok(acceptable(chain, third.hash)); // (19.3) no longer counts slot 2
  assert.ok(!acceptable(chain, quiet.hash)); // (19.1): it doesn't follow the final block
  assert.equal(bestBlock(chain).hash, third.hash);
});

test("m counts ticket-sealed ancestors: the safrole trace's blocks 48, 49 and 50", () => {
  const chain = fromGenesis();
  let tip = add(chain, "safrole", 1);
  for (let n = 2; n <= 50; n++) tip = add(chain, "safrole", n);
  assert.equal(tip.ticketed, true);
  assert.equal(ticketed(chain, tip.hash), 3);
  assert.equal(bestBlock(chain).hash, tip.hash);
});
```

## The code

A kept block remembers how it was sealed, and the tree remembers which block is final.

**Replace in** `src/chain.ts`

```ts
import { readSafroleState } from "./state.ts";

/** One block of the tree: where it hangs, and what the node keeps beside it. */
export type Kept = {
  hash: string; // the hash of its header, as hex: the block's name
  parent: string | null; // H_P, the block it is built on; null for the block the node started from
  slot: number; // H_T
  ticketed: boolean; // 𝐓: sealed with a ticket, not a fallback key
  entries: KeyValue[]; // the state after the block
  ancestry: AncestryItem[]; // the last L blocks of its own chain, itself last (lesson 20.2)
};

/** The tree: every kept block by its hash, the tips, and the newest block known to be final. */
export type Chain = { blocks: Map<string, Kept>; tips: Set<string>; final: string };

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
  };
}

/**
 * Adds a block to the tree: imports it onto its parent's state (Υ, lesson 19.4) and keeps
 * the state it makes under the block's hash. A block the tree has already is returned as
 * it was kept. An orphan, or a block that is refused, changes nothing.
 */
export function addBlock(config: Config, chain: Chain, block: Block): Kept | Refused {
  const hash = headerHash(config, block.header);
  const had = chain.blocks.get(toHex(hash));
  if (had) return had; // the same block twice is one block
  const parent = chain.blocks.get(toHex(block.header.parent));
  if (!parent) return { error: "unknown_parent" }; // an orphan: no state to import it onto
  const entries = importBlock(config, parent.entries, block, parent.ancestry);
  if ("error" in entries) return entries; // refused: the tree stays as it was
  const line = [...parent.ancestry, { slot: block.header.slot, header_hash: hash }];
  const kept: Kept = {
    hash: toHex(hash),
    parent: parent.hash,
    slot: block.header.slot,
    ticketed: "tickets" in readSafroleState(config, entries).sealers, // γ′_S, which sealed it
    entries,
    ancestry: line.slice(-config.max_lookup_anchor_age),
  };
  chain.blocks.set(kept.hash, kept);
  chain.tips.delete(parent.hash); // the parent has a child now
  chain.tips.add(kept.hash);
  return kept;
}
```

```ts
    ticketed: "tickets" in readSafroleState(config, entries).sealers, // γ′_S, which sealed it
```

A block is sealed against γ′_S, the sealers in the state *after* it
([lesson 8.9](../08-safrole/09-seals.md)). If that list holds tickets, the block's seal
was a ticket's.

**New file** `src/best.ts`

```ts
// The best block (GP §19): of the blocks a node holds, the one to build on and to vote
// for. A candidate follows the final block and has no equivocation behind it (19.1, 19.3);
// the best candidate has the most ticket-sealed ancestors (19.4).

import { ancestors } from "./chain.ts";
import type { Chain, Kept } from "./chain.ts";

/** A block's ancestors since the final block: 𝐀(H) without 𝐀(H♮). */
function sinceFinal(chain: Chain, hash: string): Kept[] {
  const settled = new Set(ancestors(chain, chain.final).map((b) => b.hash));
  return ancestors(chain, hash).filter((b) => !settled.has(b.hash));
}

/**
 * May this block be the best block? (19.1): the final block is among its ancestors.
 * (19.3): none of its ancestors since the final block shares its slot with another block.
 * (19.2), audited, holds for every block until the client audits.
 */
export function acceptable(chain: Chain, hash: string): boolean {
  if (!ancestors(chain, hash).some((b) => b.hash === chain.final)) return false; // (19.1)
  const seen = [...chain.blocks.values()];
  const twice = (a: Kept) => seen.some((b) => b.hash !== a.hash && b.slot === a.slot);
  return !sinceFinal(chain, hash).some(twice); // (19.3)
}

/** m (19.4): how many of a block's ancestors, itself among them, were sealed with a ticket. */
export function ticketed(chain: Chain, hash: string): number {
  return ancestors(chain, hash).filter((b) => b.ticketed).length;
}

/**
 * The best block, B♭: of the acceptable blocks, the one with the largest m. The paper
 * names no tie-break; here the one with the most ancestors wins, then the lower hash.
 */
export function bestBlock(chain: Chain): Kept {
  const rank = (b: Kept) => [ticketed(chain, b.hash), ancestors(chain, b.hash).length];
  let best = chain.blocks.get(chain.final)!; // always a candidate: it follows itself
  for (const b of chain.blocks.values()) {
    if (!acceptable(chain, b.hash)) continue;
    const [m, length] = rank(b);
    const [bestM, bestLength] = rank(best);
    let better = b.hash < best.hash; // the last resort
    if (length !== bestLength) better = length > bestLength; // then the most ancestors
    if (m !== bestM) better = m > bestM; // first, the most tickets (19.4)
    if (better) best = b;
  }
  return best;
}
```

```ts
  const twice = (a: Kept) => seen.some((b) => b.hash !== a.hash && b.slot === a.slot);
  return !sinceFinal(chain, hash).some(twice); // (19.3)
```

(19.3) in two lines. `seen` is every block the node holds, on any branch: the other block
of an equivocation is never on the candidate's own line, so it has to be looked for across
the whole tree. `sinceFinal` leaves out the final block and everything before it, which is
how making one side final ends the matter.

Every block is a candidate to be best, not only the tips. That is why the answer to an
equivocation at slot 2 can be block 1, which has two children.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ one line of blocks: every block is a candidate, and the best is the tip (98.824717ms)
✔ an equivocation: two blocks at slot 2; neither side is a candidate; block 1 is best (90.010752ms)
✔ finality settles it: with block 2′ final, the best block is the one built on it (58.157704ms)
✔ m counts ticket-sealed ancestors: the safrole trace's blocks 48, 49 and 50 (1405.67323ms)
...
ℹ tests 660
ℹ suites 0
ℹ pass 660
ℹ fail 0
...
reported 660 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1794823507478
...
```

What this doesn't do yet. It walks the whole tree on every call, which is fine for six
blocks and wrong for a day's worth. It trusts that every block is audited. And nothing
sets the final block. Each of those comes with the part that needs it.

## Check your understanding

::: check
**Two tips: one has 9 blocks behind it, the other 7. Which is the best block?**

- [ ] The one with 9: the longest chain wins
  > No: JAM doesn't count blocks. It counts the ticket-sealed ones, among the blocks that
  > are candidates at all. Length only breaks a tie in your client, and that is our rule.
- [x] It can't be told from the lengths
  > Yes: first each must follow the final block, be audited, and have no equivocation
  > behind it. Then the one with more ticket-sealed ancestors is best.
- [ ] The one whose newest block has the later slot
  > No: the slot of the tip plays no part in §19.

**In a fallback epoch no block is sealed by a ticket. What does (19.4) say about two candidates then?**

- [ ] The one with the later slot is best
  > No: (19.4) counts ticket-sealed ancestors and nothing else.
- [x] Nothing: both have the same m
  > Yes: every 𝐓 is 0, so m ties, and the paper names no tie-break. Your client takes
  > the candidate with the most ancestors, which is its own rule.
- [ ] Neither is a candidate
  > No: being a candidate is (19.1) to (19.3). A fallback seal doesn't rule a block out.

**A validator seals two different blocks in the same slot. What does a node that sees both do?**

- [ ] Keeps the one that arrived first as a candidate
  > No: arrival order differs from node to node, so they would disagree.
- [ ] Refuses the second block
  > No: both are valid, and both go into the tree.
- [x] Treats neither, and nothing built on either, as a candidate, until one of them is final
  > Yes: (19.3). The best block falls back to the last block before the two. Once the
  > validators finalise one side, the rule no longer counts it, and that side can grow.

**What would break if nodes chose the best block without (19.1), the final block?**

- [ ] Nothing: (19.4) alone picks the same block
  > No: a branch that left the chain before the final block could gather more tickets
  > and win.
- [ ] Blocks could no longer be imported
  > No: importing needs only the parent's state. Choosing comes after.
- [x] A node could build on a chain that undoes a block everyone agreed was final
  > Yes: final means never undone. A best block that doesn't follow it would be exactly
  > that undoing.
:::

## What you have

Your node can say which of its blocks is best: `acceptable` for (19.1) and (19.3),
`ticketed` for m, and `bestBlock` for the choice. Each kept block knows whether a ticket
sealed it, and the tree knows which block is final. On the real fork, the answer is block
1, until one side is final.

Next, [the clock](./03-the-slot-clock.md): a block is made in a slot, and a node has to know which slot it is.
