# Part 17 · Accumulation

Accumulation is the moment a block's finished work reaches the chain: each service folds
the results of its work into its own state. By the end of this part your client does that
for whole blocks, and all 63 official accumulate vectors pass.

## The big picture

A core is a workshop and the chain is a ledger. The heavy work happens in the workshop, and
only its result is written into the ledger. *Refine* is the workshop. *Accumulate* is the
writing down, and every validator does it, the same way, so that they all end up with the
same ledger.

| | Refine | Accumulate |
| --- | --- | --- |
| Where | on one core, off the chain | on the chain, inside block import |
| Who runs it | that core's guarantors, then the auditors | every validator |
| Gas, on full | 5,000,000,000 a package | 10,000,000 a report, 3,500,000,000 a block |
| Touches the state? | no: it makes a report | yes: this is how a service's state changes |

Service code runs in both, but block import never refines. So why does accumulation need 13
lessons? Because many services accumulate in one block, and they can affect each other. One
real block from the vectors shows most of it:

1. A report for service 0 became available, so service 0 runs, using 255,437 gas.
2. Its code pays service 1 a hundred. The money leaves service 0 at once, but nothing
   reaches another service inside a round, so it waits for the next one.
3. A second round runs for that transfer: the 100 lands first, then service 1 runs, using
   61,711 gas. It sends nothing, so there's no third round.

Everything else is what can go right or wrong around those three steps. Read this part in
this order, not necessarily the sidebar's, which is the order the code gets built in:

| Question | Lessons | Time |
| --- | --- | --- |
| How does a block's work flow through? | [17.1](./01-a-blocks-accumulation.md), [17.2](./02-waiting-reports.md), [17.3](./03-sending-a-transfer.md), [17.4](./04-rounds.md), [17.9](./09-the-blocks-gas-budget.md) | 37 min |
| Who may change the rules? | [17.5](./05-privileges.md), [17.6](./06-who-wins.md), [17.13](./13-blessing-and-designating.md) | 22 min |
| How does a service begin, change and end? | [17.8](./08-creating-a-service.md), [17.10](./10-upgrading-a-service.md), [17.7](./07-ejecting-a-service.md) | 18 min |
| What leaves a service? | [17.11](./11-what-a-service-yields.md), [17.12](./12-providing-a-preimage.md) | 13 min |

**Builds on** [Part 3 · Work and reports](../03-work-and-reports/index.md), [Part 4 ·
Blocks](../04-blocks/index.md), [Part 5 · Hashing and
signatures](../05-hashing-and-signatures/index.md), [Part 9 · Recent
history](../09-recent-history/index.md), [Part 13 · Authorization](../13-authorization/index.md), [Part 14 · Services and
preimages](../14-services/index.md), [Part 15 · The PVM](../15-the-pvm/index.md) and [Part
16 · Host calls](../16-host-calls/index.md), and on the foundations every part uses,
[Parts 0 to 2](../index.md#lessons).

## At a glance

The whole part on one map. Boxes are what your client holds, and rounded cards are the
steps between them; a dashed card happens outside your client. Tap any card, or walk
through them in order with *next*.

<PartFlow :part="17" />

**Starting here?** At the repo root, `npm run catch-up -- 16.9` makes your client the one
this part starts from; [How to read it](../index.md#how-to-read-it) says more.

- [17.1 A block's accumulation](./01-a-blocks-accumulation.md)
- [17.2 Waiting reports](./02-waiting-reports.md)
- [17.3 Sending a transfer](./03-sending-a-transfer.md)
- [17.4 Rounds](./04-rounds.md)
- [17.5 Privileges](./05-privileges.md)
- [17.6 Who wins](./06-who-wins.md)
- [17.7 Ejecting a service](./07-ejecting-a-service.md)
- [17.8 Creating a service](./08-creating-a-service.md)
- [17.9 The block's gas budget](./09-the-blocks-gas-budget.md)
- [17.10 Upgrading a service](./10-upgrading-a-service.md)
- [17.11 What a service yields](./11-what-a-service-yields.md)
- [17.12 Providing a preimage](./12-providing-a-preimage.md)
- [17.13 Blessing and designating](./13-blessing-and-designating.md)

**Test yourself:** [Ch. 12 Accumulation](https://abutlabs.github.io/jam-learning/lasair/exam.html?chapter=ch12-accumulation),
self-test cards on JAM learning.
