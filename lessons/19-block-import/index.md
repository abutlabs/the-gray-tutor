# Part 19 · Block import

Everything comes together. By the end of this part your client imports real blocks: the
first 100 blocks of all eight official traces, chained from genesis, every state root right
and every bad block refused.

## The big picture

[Lesson 0.6](../00-start/06-how-a-block-is-imported.md) walked a block through eight
stations, like a bank clerk posting a day's payments: check it follows yesterday, check
every payment, post all of them or none, print the new balance. Back then most stations
were only names. You've built nearly all of them now:

| | Station | Built in |
| --- | --- | --- |
| 1 | bytes arrive | [20.1](../20-facing-the-fuzzer/01-speaking-the-protocol.md) |
| 2 | decode the block | [4.7](../04-blocks/07-the-block.md) |
| 3 | find the state before | [20.2](../20-facing-the-fuzzer/02-a-target.md) |
| 4 | check the header | [19.4](./04-importing-a-block.md) |
| 5 | run Υ, the state transition | Parts [8](../08-safrole/index.md) to [18](../18-statistics/index.md), joined in [19.4](./04-importing-a-block.md) |
| 6 | all or nothing | [19.4](./04-importing-a-block.md) |
| 7 | hash the new state into its root | [6.1](../06-state-and-merklization/01-the-state-trie.md) |
| 8 | keep it and answer | [20.2](../20-facing-the-fuzzer/02-a-target.md) |

Station 5 is the big one, and until now each piece of it has only met its own test
vectors. This part joins the pieces and runs real blocks through them. The test is as hard
as a test can be: one 32-byte state root, which is wrong if any byte of the state is.

| Question | Lessons | Time |
| --- | --- | --- |
| In what order do the steps run? | [19.1](./01-the-order-of-things.md) | 7 min |
| How does the whole state fit together? | [19.2](./02-the-whole-state.md), [19.3](./03-accounts-from-the-state.md) | 12 min |
| Does a real block go all the way through? | [19.4](./04-importing-a-block.md) | 9 min |
| What did real blocks find that test vectors couldn't? | [19.5](./05-work-on-the-chain.md), [19.6](./06-blocks-to-refuse.md) | 13 min |

**Builds on** [Part 3 · Work and reports](../03-work-and-reports/index.md), [Part 4 ·
Blocks](../04-blocks/index.md), [Part 5 · Hashing and
signatures](../05-hashing-and-signatures/index.md), [Part 6 · State and
Merklization](../06-state-and-merklization/index.md), [Part 8 ·
Safrole](../08-safrole/index.md), [Part 9 · Recent
history](../09-recent-history/index.md), [Part 10 · Disputes](../10-disputes/index.md),
[Part 11 · Assurances](../11-assurances/index.md), [Part 12 ·
Guarantees](../12-guarantees/index.md), [Part 13 ·
Authorization](../13-authorization/index.md), [Part 14 · Services and
preimages](../14-services/index.md), [Part 16 · Host calls](../16-host-calls/index.md),
[Part 17 · Accumulation](../17-accumulation/index.md) and [Part 18 ·
Statistics](../18-statistics/index.md), and on the foundations every part uses, [Parts 0
to 2](../index.md#lessons).

## At a glance

The whole part on one map. Boxes are what your client holds, and rounded cards are the
steps between them; a dashed card happens outside your client. Tap any card, or walk
through them in order with *next*.

<PartFlow :part="19" />

**Starting here?** At the repo root, `npm run catch-up -- 18.2` makes your client the one
this part starts from; [How to read it](../index.md#how-to-read-it) says more.

- [19.1 The order of things](./01-the-order-of-things.md)
- [19.2 The whole state](./02-the-whole-state.md)
- [19.3 Accounts from the state](./03-accounts-from-the-state.md)
- [19.4 Importing a block](./04-importing-a-block.md)
- [19.5 Work on the chain](./05-work-on-the-chain.md)
- [19.6 Blocks to refuse](./06-blocks-to-refuse.md)

**Test yourself:** [Ch. 4 Overview](https://abutlabs.github.io/jam-learning/lasair/exam.html?chapter=ch04-overview),
self-test cards on JAM learning.
