---
aside: false
---

# The PVM playground

The PVM is the small computer every JAM service runs on. This page is that computer,
working, in your browser: it's the same TypeScript you write in [Part 15](./15-the-pvm/index.md)
and [Part 16](./16-host-calls/index.md), not a drawing of it. Every number below comes from
the machine as it runs.

Pick a program, press **Step**, and watch four things: the code, the 13 registers, the gas
and the memory. Each program says what to watch and what to try, and you can edit any of
them. The last one is a real service, the code service 0 keeps in the official trace
vectors. **Demo** walks through the machine in five minutes, with notes to read out.

<PvmPlayground />

## The machine on one page

If you're reading this without the playground, here's what it shows.

| Part | What it is |
| --- | --- |
| Registers | 13 numbers of 64 bits each, φ0 to φ12, written r0 to r12 in code. There are no variables. |
| ı | The instruction counter: where in the code the machine is. |
| Gas | What's left to spend. A basic block is paid for in full on the way in, or not at all. |
| Memory | 2^32 bytes in pages of 4,096. A page is read-and-write, read-only, or not there. |

A *basic block* is a run of instructions that ends at a jump, a branch, a trap or a
fallthrough. Jumps and branches may only land on the start of one. That's why gas can be
charged per block: once a block starts, all of it runs, unless memory faults.

A run ends in one of these ways:

| Stop | What happened |
| --- | --- |
| halt | The program jumped to the halt address, the one r0 holds at the start. It finished. |
| panic | A trap, a jump to a bad address, or touching memory below 64 KiB. |
| out of gas | The next block cost more than the gas left. None of that block ran. |
| page fault | It touched a page it may not. ı stays on that instruction. |

And there's one way to pause: `ecalli` asks the host to do something, and the host answers
in r7. A service can't reach anything outside the machine any other way.

The programs on this page, in order: the registers; immediates and sign extension; a loop;
reading and writing memory; memory that isn't there; running out of gas; the jump table; host
calls; what a block really costs; a small program that adds up numbers in memory; and a real
service's accumulate, from ı = 5 to a clean halt.

## Where this is in the tutorial

| To see | Read |
| --- | --- |
| How a program is packed | [lesson 15.1](./15-the-pvm/01-the-program-blob.md) |
| How instructions are decoded | [lesson 15.2](./15-the-pvm/02-instructions.md) |
| The machine stepping | [lesson 15.3](./15-the-pvm/03-the-machine.md) |
| Memory | [lesson 15.4](./15-the-pvm/04-memory.md) |
| Host calls | [Part 16](./16-host-calls/index.md) |
