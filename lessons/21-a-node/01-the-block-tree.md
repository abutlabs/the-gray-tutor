# The block tree

**In one sentence:** a node keeps every block it has imported under the block's hash, each
pointing at its parent, so that when two blocks are built on the same one it holds both.

Send the node blocks in any order and watch the tree grow. Then tap a block to see its
ancestors.

<a id="try-it"></a>

<BlockTree />

## The idea

Your fuzz target kept 32 states because the fuzzer asked it to. Why would a client on a
real network keep more than one?

Because nobody decides who builds next. Two validators can each make a block on the same
parent, and both blocks can be valid. That is a [*fork*](../glossary.md#fork). Until the
network settles on one side, a [*JAM node*](../glossary.md#jam-node), a client that stays
running and follows the chain, has to hold both.

So what it keeps is not a list. It is a family tree: the
[*block tree*](../glossary.md#block-tree). Every block names one parent, by its hash. A
parent can have several children. A block with no child yet is a
[*tip*](../glossary.md#tip): a place the chain could grow next. A block whose parent
hasn't come is an [*orphan*](../glossary.md#orphan). It can't be imported, because there is
no state to import it onto.

Beside each block the node keeps the state after it. A new block is imported onto its
parent's state, whichever branch that is on.

By the end of this lesson your client keeps a tree, and holds a real fork: two official
traces that share their first block and part at the second.

## What the Gray Paper says

The tree is three lines of §5, *The Header*, quoted in
[lesson 5.1](../05-hashing-and-signatures/01-hashes.md):

1. **Every block names its parent.** A header carries H_P, the hash of its parent's
   header: [(5.2)](../05-hashing-and-signatures/01-hashes.md#eq-5-2). Only the genesis
   header has none.
2. **The ancestors.** A block's [*ancestors*](../glossary.md#ancestors), 𝐀, are the block,
   its parent, its parent's parent, and so on back:
   [(5.3)](../05-hashing-and-signatures/01-hashes.md#eq-5-3).
3. **How far back.** A client need only keep the headers of ancestors from the last L
   slots: 24 on tiny, a day's worth on full. That is the ancestry of
   [lesson 20.2](../20-facing-the-fuzzer/02-a-target.md), and each block of the tree
   carries its own.

The paper never says "tree". It doesn't have to. Nothing in (5.2) stops two headers from
naming the same parent, and (5.3) follows parents only, so each tip has its own line of
ancestors. Try it on [the tree at the top](#try-it): tap block 3, then block 3′.

Which tip a node should build on is §19's question. It comes next.

## The tests

All the official traces start from one genesis. Two of them, `fallback` and `storage`,
also share block 1. At slot 2 they part: `fallback`'s block is empty, and `storage`'s
carries a guarantee. That is a real fork, made of blocks your client already imports.

**New file** `test/chain.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { Block, Header } from "../src/block.ts";
import { fromHex } from "../src/bytes.ts";
import type { Chain } from "../src/chain.ts";
import { addBlock, ancestors, startChain } from "../src/chain.ts";
import { TINY } from "../src/config.ts";
import { stateRoot } from "../src/trie.ts";
import { vectorJson } from "./vectors.ts";

type Entries = { key: string; value: string }[];
type Genesis = { header: unknown; state: { state_root: string; keyvals: Entries } };
type TraceStep = { block: unknown; post_state: { state_root: string; keyvals: Entries } };

/** A chain of one block: the traces' genesis, which every trace family starts from. */
function fromGenesis(): Chain {
  const genesis = vectorJson("traces/fallback/genesis.json") as Genesis;
  const entries = genesis.state.keyvals.map((e) => ({
    key: fromHex(e.key),
    value: fromHex(e.value),
  }));
  return startChain(TINY, Header(TINY).fromJson(genesis.header), entries);
}

/** Block n of a trace family, and the state root the trace has after it. */
function traceBlock(family: string, n: number) {
  const step = vectorJson(`traces/${family}/${String(n).padStart(8, "0")}.json`) as TraceStep;
  return { block: Block(TINY).fromJson(step.block), root: fromHex(step.post_state.state_root) };
}

test("a chain: five blocks, each on the one before; one tip; its ancestors back to genesis", () => {
  const chain = fromGenesis();
  for (let n = 1; n <= 5; n++) {
    const { block, root } = traceBlock("fallback", n);
    const kept = addBlock(TINY, chain, block);
    assert.ok(!("error" in kept), `block ${n}`);
    assert.deepEqual(stateRoot(kept.entries), root, `the state after block ${n}`);
  }
  assert.equal(chain.blocks.size, 6);
  const [tip, ...others] = chain.tips;
  assert.equal(others.length, 0); // one line of blocks has one tip
  const slots = ancestors(chain, tip).map((b) => b.slot);
  assert.deepEqual(slots, [5, 4, 3, 2, 1, 0]);
});

test("a fork: two traces part at block 2; two tips, each with its own state", () => {
  const chain = fromGenesis();
  addBlock(TINY, chain, traceBlock("fallback", 1).block);
  const quiet = addBlock(TINY, chain, traceBlock("fallback", 2).block); // an empty block
  const busy = addBlock(TINY, chain, traceBlock("storage", 2).block); // one guarantee
  assert.ok(!("error" in quiet) && !("error" in busy));
  assert.equal(quiet.parent, busy.parent); // both are built on block 1
  assert.equal(quiet.slot, busy.slot); // in the same slot
  assert.notEqual(quiet.hash, busy.hash);
  assert.deepEqual([...chain.tips].sort(), [quiet.hash, busy.hash].sort());
  assert.deepEqual(stateRoot(quiet.entries), traceBlock("fallback", 2).root);
  assert.deepEqual(stateRoot(busy.entries), traceBlock("storage", 2).root);
  const third = addBlock(TINY, chain, traceBlock("storage", 3).block);
  assert.ok(!("error" in third));
  assert.equal(third.parent, busy.hash); // it grows one branch, and leaves the other
  assert.deepEqual([...chain.tips].sort(), [quiet.hash, third.hash].sort());
});

test("an orphan and a refused block change nothing; the same block twice is one block", () => {
  const chain = fromGenesis();
  const orphan = addBlock(TINY, chain, traceBlock("fallback", 3).block); // block 2 never came
  assert.deepEqual(orphan, { error: "unknown_parent" });
  const { block } = traceBlock("fallback", 1);
  const broken = { ...block, header: { ...block.header, slot: 7 } }; // not what was sealed
  assert.ok("error" in addBlock(TINY, chain, broken));
  assert.equal(chain.blocks.size, 1); // only genesis
  const first = addBlock(TINY, chain, block);
  const again = addBlock(TINY, chain, block);
  assert.equal(again, first);
  assert.equal(chain.blocks.size, 2);
});
```

**Run, expect it to fail**

```sh
npm test
```

```text
...
✖ test/chain.test.ts
...
```

There is no `src/chain.ts` yet.

## The code

**New file** `src/chain.ts`

```ts
// A node's chain (GP §5): every block it has imported, under its header's hash, with the
// block it was built on and the state after it. Blocks that share a parent make it a tree.

import { headerHash } from "./block.ts";
import type { Block, Header } from "./block.ts";
import { toHex } from "./bytes.ts";
import type { Config } from "./config.ts";
import type { AncestryItem } from "./fuzz.ts";
import { importBlock } from "./import.ts";
import type { Refused } from "./import.ts";
import type { KeyValue } from "./trie.ts";

/** One block of the tree: where it hangs, and what the node keeps beside it. */
export type Kept = {
  hash: string; // the hash of its header, as hex: the block's name
  parent: string | null; // H_P, the block it is built on; null for the block the node started from
  slot: number; // H_T
  entries: KeyValue[]; // the state after the block
  ancestry: AncestryItem[]; // the last L blocks of its own chain, itself last (lesson 20.2)
};

/** The tree: every kept block by its hash, and the tips, the blocks with no child yet. */
export type Chain = { blocks: Map<string, Kept>; tips: Set<string> };

/** A tree of one block: the block the node starts from, and the state after it. */
export function startChain(config: Config, header: Header, entries: KeyValue[]): Chain {
  const hash = headerHash(config, header);
  const first: Kept = {
    hash: toHex(hash),
    parent: null,
    slot: header.slot,
    entries,
    ancestry: [{ slot: header.slot, header_hash: hash }],
  };
  return { blocks: new Map([[first.hash, first]]), tips: new Set([first.hash]) };
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
    entries,
    ancestry: line.slice(-config.max_lookup_anchor_age),
  };
  chain.blocks.set(kept.hash, kept);
  chain.tips.delete(parent.hash); // the parent has a child now
  chain.tips.add(kept.hash);
  return kept;
}

/** 𝐀 (GP 5.3): a block, its parent, its parent's parent, and so on, newest first. */
export function ancestors(chain: Chain, hash: string): Kept[] {
  const line: Kept[] = [];
  let at = chain.blocks.get(hash);
  while (at) {
    line.push(at);
    at = at.parent === null ? undefined : chain.blocks.get(at.parent);
  }
  return line;
}
```

```ts
  const parent = chain.blocks.get(toHex(block.header.parent));
  if (!parent) return { error: "unknown_parent" }; // an orphan: no state to import it onto
  const entries = importBlock(config, parent.entries, block, parent.ancestry);
```

This is the whole trick. The block says which block it is built on, the tree finds that
block's state, and `importBlock` does what it has always done. A fork needs no code of its
own: two blocks that name one parent are each imported onto that parent's state, and each
gets a state of its own.

```ts
  chain.tips.delete(parent.hash); // the parent has a child now
  chain.tips.add(kept.hash);
```

A new block is always a tip. Its parent stops being one, if it still was: on a fork, the
second child finds its parent already gone from the tips, and deleting it again does
nothing.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ a chain: five blocks, each on the one before; one tip; its ancestors back to genesis (1ms)
✔ a fork: two traces part at block 2; two tips, each with its own state (1ms)
✔ an orphan and a refused block change nothing; the same block twice is one block (1ms)
...
ℹ fail 0
...
```

Your fuzz target and this tree do the same job two ways. The target keeps the newest 32
states, because the fuzzer's forks are one block deep. The tree keeps every block, with
the links between them, because a node must be able to say which chain a block is on.
What it may forget, and when, comes once the chain has a final block to forget behind.

## Check your understanding

::: check
**Why does a node keep a tree of blocks, and not just the newest state?**

- [ ] To be able to undo a block that turns out to be invalid
  > No: an invalid block is refused before anything is kept, so there is nothing to undo.
- [x] Two valid blocks can be built on the same parent, and it can't yet know which the network will keep
  > Yes: that's a fork. Each block is imported onto its parent's state, so the node needs
  > the state after every block that could still be built on.
- [ ] The Gray Paper requires every validator to store every block for ever
  > No: §5 asks only for the headers of the last L slots' ancestors.

**What makes two blocks a fork?**

- [ ] They have the same hash
  > No: the same hash is the same block. A node keeps it once.
- [ ] One of them is invalid
  > No: an invalid block is refused and never joins the tree. Both sides of a fork are
  > valid.
- [x] They name the same parent
  > Yes: both carry the same H_P. From there the chain has two possible futures, each
  > with its own state.

**A block arrives whose parent your node has never seen. Why can't it be imported anyway?**

- [x] Importing needs the state the block was built on, and that is the state after its parent
  > Yes: the block is a change to one particular state. Without the parent there is
  > nothing to apply it to, and no way to tell whether it is valid.
- [ ] A block without a known parent is invalid by the Gray Paper's rules
  > No: it may be perfectly valid. The node just can't tell yet. On a network, it would
  > ask a peer for the parent.
- [ ] Its hash can't be worked out
  > No: a header's hash needs only the header.

**A tree has two tips. What does that tell you about the chain?**

- [ ] One of the two is invalid
  > No: every block in the tree was imported, so every block in it is valid.
- [ ] The node has a bug: a chain has one newest block
  > No: a chain being made by many validators can have several newest blocks for a
  > while.
- [x] The chain could grow from either, and the node doesn't yet know which will win
  > Yes: each tip ends a different line of ancestors. Choosing between them comes next.
:::

## What you have

A block tree: every block under its hash, tied to its parent, with the state after it and
its own ancestry; the tips; and each block's line of ancestors. It imports a block onto
whichever state the block names, and it holds a real fork from the official traces.

Next, the question the tree raises: of several tips, which one does a node build on?
