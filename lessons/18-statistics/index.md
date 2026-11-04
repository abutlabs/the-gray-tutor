# Part 18 · Statistics

The chain keeps score: which validators made blocks, guaranteed work and confirmed they
hold data, and how much work each core and each service did. JAM itself pays nobody; the
tallies are there so that whoever does pay can see who earned it. This part builds them,
validators first.

By the end of this part your client keeps all three scorecards, the validators', the
cores' and the services', matching every reports and preimages vector.

**Builds on** [Part 3 · Work and reports](../03-work-and-reports/index.md), [Part 4 ·
Blocks](../04-blocks/index.md), [Part 6 · State and
Merklization](../06-state-and-merklization/index.md), [Part 11 ·
Assurances](../11-assurances/index.md), [Part 12 · Guarantees](../12-guarantees/index.md)
and [Part 17 · Accumulation](../17-accumulation/index.md), and on the foundations every
part uses, [Parts 0 to 2](../index.md#lessons).

## The big picture

The chain hands out no rewards. The Gray Paper leaves that to a staking system, and asks
the chain only to get it the facts. Three scorecards hold them:

| Card | Counts | Lasts | Who it's for |
| --- | --- | --- | --- |
| Validators | blocks, tickets, preimages, guarantees, assurances | an epoch, and the last one is kept | the staking system, to pay them |
| Cores | work taken on, data load, popularity | one block | the Gray Paper names nobody |
| Services | work, preimages provided, accumulation | one block | the Gray Paper names nobody |

It looks like bookkeeping, and it can still sink your client. The cards are chapter 13 of
the state, so they're in the state root: one count wrong, and the root is wrong, and your
client refuses a good block. [Lesson 19.6](../19-block-import/06-blocks-to-refuse.md) shows
a real case, where a difference in gas did exactly that.

The part takes about 20 minutes: 18.1 is the validators, 18.2 the cores and services.

## At a glance

The whole part on one map. Boxes are what your client holds, and rounded cards are the
steps between them; a dashed card happens outside your client. Tap any card, or walk
through them in order with *next*.

<PartFlow :part="18" />

**Starting here?** At the repo root, `npm run catch-up -- 17.13` makes your client the one
this part starts from; [How to read it](../index.md#how-to-read-it) says more.

- [18.1 Who did what](./01-who-did-what.md)
- [18.2 What cores and services did](./02-what-cores-and-services-did.md)

**Test yourself:** [Ch. 13 Statistics](https://abutlabs.github.io/jam-learning/lasair/exam.html?chapter=ch13-statistics),
self-test cards on JAM learning.
