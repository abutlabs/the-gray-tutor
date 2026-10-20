# Part 8 · Safrole

Who makes the next block? Safrole, JAM's block-production engine, decides. A lottery picks
the authors of each epoch's slots, and nobody learns who won a slot until its winner
makes the block. This part builds Safrole piece by piece, starting with the randomness
that makes the lottery fair.

By the end of this part your client runs Safrole for every block: the whole state after
it, both marks for its header, tickets entered and their proofs checked, each new epoch's
ring root, and every block's seal. All 46 safrole vectors pass, and the seals of 198 real
blocks.

**Builds on** [Part 4 · Blocks](../04-blocks/index.md), [Part 5 · Hashing and
signatures](../05-hashing-and-signatures/index.md), [Part 6 · State and
Merklization](../06-state-and-merklization/index.md) and [Part 7 · Time and
shuffling](../07-time-and-shuffling/index.md), and on the foundations every part uses,
[Parts 0 to 2](../index.md#lessons).

## The big picture

Safrole answers one question for every slot: *who may make this block?* It answers a whole
epoch ahead, with a lottery whose winners stay secret until their slot comes. That's the
point: if everyone knew who makes the block at 3 pm, an attacker could knock that one
validator offline at 2:59. With Safrole, nobody knows, not even the other winners.

Every epoch, 12 slots on tiny and 600 (an hour) on full, runs the same cycle:

1. **Every block stirs the randomness.** Its maker signs it with a VRF, a signature whose
   output is random yet fixed, and that output is hashed into η₀
   ([8.1](./01-stirring-the-entropy.md), [8.6](./06-the-vrf-output.md)). Epochs keep their old randomness too, η₁ to η₃, for rules that
   need a value nobody could have steered.
2. **While the lottery is open, validators enter tickets** for the *next* epoch: up to 3 a
   block on tiny, 16 on full, during the first 10 slots of 12 (500 of 600). A ticket is
   anonymous: its ring proof says "one of next epoch's validators made me" and nothing
   more ([8.7](./07-entering-tickets.md), [8.8](./08-the-ring-root.md)). Its score is its VRF output, and the lottery keeps the best
   12 (600), one per slot of the next epoch ([8.4](./04-the-lotterys-winners.md)).
3. **At slot 10 (500) the lottery closes.** If it's full, the first block after says so:
   its header's *tickets mark* lists the winners, in the order they'll seal ([8.4](./04-the-lotterys-winners.md)).
4. **At the epoch's turn, everything moves along one.** The validators step through their
   queue, offenders zeroed ([8.2](./02-rotating-the-validators.md)); the randomness history shifts ([8.1](./01-stirring-the-entropy.md)); and the new
   epoch's slots get their *sealers*. A full lottery seats its winners. A short one seats
   the *fallback*: validators picked from the randomness by hash, which everyone can work
   out but nobody could steer ([8.3](./03-the-fallback-sealers.md)). The header's *epoch mark* announces the next validators
   and randomness. [8.5](./05-one-step-of-safrole.md) puts the cycle together, one block at a time.
5. **Every block's seal is checked** against its slot's sealer: the holder of the winning
   ticket, who reveals themselves only now by sealing, or the fallback's pick ([8.9](./09-seals.md)).

Two kinds of cryptography carry this, and you can treat both as black boxes: a *VRF*
signature (a signature with a random output nobody can choose) and a *ring* VRF proof (the
same, but anonymous within a set of keys). [Cryptography we use](../cryptography.md) says where they come from.

Here is the cycle on real blocks: the official `safrole` trace, 100 tiny blocks, an epoch a
row. Epochs 0 to 2 collect too few tickets, so the fallback seals the epochs after them.
Epoch 3 fills its lottery at slot 45, the block at slot 46 announces the winners, and
epoch 4 is sealed by tickets, as are 5 and 6. Epoch 6 collects only 9, so epoch 7 falls
back. Tap any slot.

<SafroleTimeline />

## At a glance

The whole part on one map. Boxes are what your client holds, and rounded cards are the
steps between them; a dashed card happens outside your client. Tap any card, or walk
through them in order with *next*.

<PartFlow :part="8" />

**Starting here?** At the repo root, `npm run catch-up -- 7.2` makes your client the one
this part starts from; [How to read it](../index.md#how-to-read-it) says more.

- [8.1 Stirring the entropy](./01-stirring-the-entropy.md)
- [8.2 Rotating the validators](./02-rotating-the-validators.md)
- [8.3 The fallback sealers](./03-the-fallback-sealers.md)
- [8.4 The lottery's winners](./04-the-lotterys-winners.md)
- [8.5 One step of Safrole](./05-one-step-of-safrole.md)
- [8.6 The VRF output](./06-the-vrf-output.md)
- [8.7 Entering tickets](./07-entering-tickets.md)
- [8.8 The ring root](./08-the-ring-root.md)
- [8.9 Seals](./09-seals.md)

**Test yourself:** [Ch. 6 Block Production and Chain Growth (Safrole)](https://abutlabs.github.io/jam-learning/lasair/exam.html?chapter=ch06-safrole),
self-test cards on JAM learning.
