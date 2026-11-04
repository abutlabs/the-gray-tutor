# Part 15 · The PVM

Services are programs, and the PVM is the machine that runs them. By the end of this part
your client has a complete one: 13 registers, memory in pages, a gas meter and all 139
instructions, and a real service starting up on it.

## The big picture

A service is written in an ordinary language, such as Rust, and compiled. The PVM is the
computer that compiled code runs on: a small, made-up CPU, the same on every validator, so
that one program on one input gives one answer, to the last bit and the last unit of gas.
If two validators ever disagreed, the chain would split.

The Gray Paper compares it to Ethereum's EVM, but simpler. It keeps close to RISC-V, a real
CPU design, so existing compilers work, and it fits real hardware well enough to be
compiled for it. There are no special instructions for cryptography or for reading the
chain. Anything outside the machine goes through a *host call*, [Part
16](../16-host-calls/index.md).

One machine, three ways in:

| | Runs when | Who runs it | Starts at | Gas, on full |
| --- | --- | --- | --- | --- |
| Is-Authorized | a package reaches a core | its guarantors, then auditors | 0 | 50,000,000 |
| Refine | the package is approved | its guarantors, then auditors | 0 | 5,000,000,000 |
| Accumulate | a block is imported | every validator | 5 | 10,000,000 a report |

A block importer only ever uses the last one, but it needs the whole machine to do it.

| Question | Lessons | Time |
| --- | --- | --- |
| How is the code packed and read? | [15.1](./01-the-program-blob.md), [15.2](./02-instructions.md) | 12 min |
| How does the machine run it? | [15.3](./03-the-machine.md), [15.4](./04-memory.md), [15.5](./05-arithmetic.md), [15.6](./06-branches-and-calls.md), [15.7](./07-bits-and-bytes.md) | 31 min |
| What does a real program look like? | [15.8](./08-a-real-program.md) | 7 min |
| How is it charged for? | [15.9](./09-what-instructions-cost.md), [15.10](./10-the-pipeline.md), [15.11](./11-the-gas-meter.md) | 20 min |

Keep [the PVM playground](../pvm-playground.md) open beside this part: it's this machine,
running, with every step on screen.

**Builds on** [Part 6 · State and Merklization](../06-state-and-merklization/index.md),
[Part 11 · Assurances](../11-assurances/index.md) and [Part 14 · Services and
preimages](../14-services/index.md), and on the foundations every part uses, [Parts 0 to
2](../index.md#lessons).

## At a glance

The whole part on one map. Boxes are what your client holds, and rounded cards are the
steps between them; a dashed card happens outside your client. Tap any card, or walk
through them in order with *next*.

<PartFlow :part="15" />

**Starting here?** At the repo root, `npm run catch-up -- 14.2` makes your client the one
this part starts from; [How to read it](../index.md#how-to-read-it) says more.

- [15.1 The program blob](./01-the-program-blob.md)
- [15.2 Instructions](./02-instructions.md)
- [15.3 The machine](./03-the-machine.md)
- [15.4 Memory](./04-memory.md)
- [15.5 Arithmetic](./05-arithmetic.md)
- [15.6 Branches and calls](./06-branches-and-calls.md)
- [15.7 Bits and bytes](./07-bits-and-bytes.md)
- [15.8 A real program](./08-a-real-program.md)
- [15.9 What instructions cost](./09-what-instructions-cost.md)
- [15.10 The pipeline](./10-the-pipeline.md)
- [15.11 The gas meter](./11-the-gas-meter.md)

**Test yourself:** [E · PVM (Appendix A)](https://abutlabs.github.io/jam-learning/lasair/exam.html?chapter=e-pvm),
self-test cards on JAM learning.
