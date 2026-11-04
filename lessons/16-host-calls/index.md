# Part 16 · Host calls

A service is a program in a sealed box. It can compute all it likes, but it can't see the
chain. By the end of this part your client answers the host calls of a service
accumulating, and 13 services in 12 official vectors match, down to the last unit of gas.

## The big picture

A host call is to a service what a system call is to an ordinary program: the only way out
of the box. The program asks with `ecalli`, the machine stops, your client does the work,
answers in a register, and the program carries on. Every validator answers the same way,
and every call has a price.

A real service's conversation, the one you'll have by [lesson
16.3](./03-growing-the-heap.md): what are the chain's rules? (`fetch`) How much memory have
I got? (`grow_heap`) What work did I get? (`fetch`) Then it halts.

The Gray Paper has 28 host calls. A block importer only needs the 20 that accumulation can
use:

| What for | Calls | Built in |
| --- | --- | --- |
| About this run | `gas`, `fetch`, `grow_heap` | [16.1](./01-calling-the-host.md), [16.2](./02-fetch.md), [16.3](./03-growing-the-heap.md) |
| Accounts and storage | `info`, `read`, `write` | [16.4](./04-info.md), [16.5](./05-storage.md) |
| Keeping what's done so far | `checkpoint` | [16.6](./06-checkpoints.md) |
| Preimages | `lookup`, `query`, `solicit`, `forget`, `provide` | [16.8](./08-lookup.md), [16.9](./09-asking-for-preimages.md), [17.12](../17-accumulation/12-providing-a-preimage.md) |
| Services and money | `transfer`, `new`, `upgrade`, `eject` | [17.3](../17-accumulation/03-sending-a-transfer.md), [17.8](../17-accumulation/08-creating-a-service.md), [17.10](../17-accumulation/10-upgrading-a-service.md), [17.7](../17-accumulation/07-ejecting-a-service.md) |
| Privileges | `bless`, `assign`, `designate` | [17.13](../17-accumulation/13-blessing-and-designating.md), [17.5](../17-accumulation/05-privileges.md) |
| A result for the outside world | `yield` | [17.11](../17-accumulation/11-what-a-service-yields.md) |
| Refine only: never run at import | `historical_lookup`, `export`, `machine`, `peek`, `poke`, `pages`, `invoke`, `expunge` | not built |

This part takes about 50 minutes. [16.1](./01-calling-the-host.md) and
[16.6](./06-checkpoints.md) matter most: every other lesson is one more call on the same
pattern.

**Builds on** [Part 3 · Work and reports](../03-work-and-reports/index.md), [Part 4 ·
Blocks](../04-blocks/index.md), [Part 5 · Hashing and
signatures](../05-hashing-and-signatures/index.md), [Part 14 · Services and
preimages](../14-services/index.md) and [Part 15 · The PVM](../15-the-pvm/index.md), and
on the foundations every part uses, [Parts 0 to 2](../index.md#lessons).

## At a glance

The whole part on one map. Boxes are what your client holds, and rounded cards are the
steps between them; a dashed card happens outside your client. Tap any card, or walk
through them in order with *next*.

<PartFlow :part="16" />

**Starting here?** At the repo root, `npm run catch-up -- 15.11` makes your client the one
this part starts from; [How to read it](../index.md#how-to-read-it) says more.

- [16.1 Calling the host](./01-calling-the-host.md)
- [16.2 Fetch](./02-fetch.md)
- [16.3 Growing the heap](./03-growing-the-heap.md)
- [16.4 Info](./04-info.md)
- [16.5 Storage](./05-storage.md)
- [16.6 Checkpoints](./06-checkpoints.md)
- [16.7 A service's inputs](./07-a-services-inputs.md)
- [16.8 Lookup](./08-lookup.md)
- [16.9 Asking for preimages](./09-asking-for-preimages.md)

**Test yourself:** [E · PVM invocations and host calls (Appendix B)](https://abutlabs.github.io/jam-learning/lasair/exam.html?chapter=e-invocations),
self-test cards on JAM learning.
