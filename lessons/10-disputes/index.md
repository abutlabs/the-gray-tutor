# Part 10 · Disputes

<AlbertJudge />

What happens when a guaranteed work-report turns out to be wrong? A trial, held in the
blocks themselves: validators vote, the verdict is recorded forever, and whoever vouched
for a bad report, or voted against the truth, is named an offender and loses their seat.

By the end of this part your client is the court: every verdict, culprit and fault
checked, and every disputes vector accepted or refused just as it should be.

**Builds on** [Part 3 · Work and reports](../03-work-and-reports/index.md), [Part 4 ·
Blocks](../04-blocks/index.md), [Part 5 · Hashing and
signatures](../05-hashing-and-signatures/index.md), [Part 6 · State and
Merklization](../06-state-and-merklization/index.md) and [Part 7 · Time and
shuffling](../07-time-and-shuffling/index.md), and on the foundations every part uses,
[Parts 0 to 2](../index.md#lessons).

## At a glance

The whole part on one map. Boxes are what your client holds, and rounded cards are the
steps between them; a dashed card happens outside your client. Tap any card, or walk
through them in order with *next*.

<PartFlow :part="10" />

**Starting here?** At the repo root, `npm run catch-up -- 9.2` makes your client the one
this part starts from; [How to read it](../index.md#how-to-read-it) says more.

- [10.1 Votes and verdicts](./01-votes-and-verdicts.md)
- [10.2 Culprits and faults](./02-culprits-and-faults.md)
- [10.3 Clearing the cores](./03-clearing-the-cores.md)
- [10.4 Bad verdicts](./04-bad-verdicts.md)
- [10.5 Bad culprits and faults](./05-bad-culprits-and-faults.md)

**Test yourself:** [Ch. 10 Disputes, Verdicts and Judgments](https://abutlabs.github.io/jam-learning/lasair/exam.html?chapter=ch10-disputes),
self-test cards on JAM learning.
