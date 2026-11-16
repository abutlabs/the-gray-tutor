# Part 21 · A node

**In one sentence:** a node is a client that stays running: it keeps every block it has
imported as a tree, and imports each new block onto the right one.

This part begins the road to M2, JAM's second milestone: a client that makes blocks, not
only checks them. It is being written. [21.1](./01-the-block-tree.md) and
[21.2](./02-the-best-block.md) are here; the slot clock and the program that stays up
follow.

## The big picture

The parts so far built a function. Hand it a state and a block, and it answers with the next
state or a refusal. Then it forgets both.

A node can't forget. Blocks arrive one after another, from other validators, and each is
built on one that came before. Sometimes two are built on the same one, and both are
valid. So a node keeps what it has imported, and the question changes:

| A block importer asks | A node also asks |
| --- | --- |
| Is this block valid on this state? | Which state is this block built on? |
| What is the state after it? | Which of my blocks has nothing built on it yet? |

Three official traces show it. They share one genesis and one first block. At slot 2
they part: one chain's block is empty, another's carries a guarantee. Same parent, same
slot, same author, two valid blocks. A node that has seen both holds both, and builds
on neither until one is final.

| Question | Lesson | Time |
| --- | --- | --- |
| What must a node keep, when two blocks can share a parent? | [21.1](./01-the-block-tree.md) | 6 min |
| Of all the blocks it holds, which does a node build on? | [21.2](./02-the-best-block.md) | 7 min |

It assumes a client that refuses bad input instead of crashing on it: the list in
[HARDENING.md](https://github.com/abutlabs/the-gray-tutor/blob/main/HARDENING.md), which
gets a page of its own before the first bytes arrive from a network.

**Builds on** [Part 4 · Blocks](../04-blocks/index.md), [Part 5 · Hashing and
signatures](../05-hashing-and-signatures/index.md), [Part 6 · State and
Merklization](../06-state-and-merklization/index.md), [Part 8 ·
Safrole](../08-safrole/index.md), [Part 19 · Block
import](../19-block-import/index.md) and [Part 20 · Facing the
fuzzer](../20-facing-the-fuzzer/index.md), and on the foundations every part uses, [Parts
0 to 2](../index.md#lessons).

## At a glance

The whole part on one map. Boxes are what your client holds, and rounded cards are the
steps between them; a dashed card happens outside your client. Tap any card, or walk
through them in order with *next*.

<PartFlow :part="21" />

**Starting here?** At the repo root, `npm run catch-up -- 20.4` makes your client the one
this part starts from; [How to read it](../index.md#how-to-read-it) says more.

- [21.1 The block tree](./01-the-block-tree.md)
- [21.2 The best block](./02-the-best-block.md)
