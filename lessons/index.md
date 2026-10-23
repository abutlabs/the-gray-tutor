# The Gray Tutor

We will build a TypeScript JAM client per the [Gray Paper](https://graypaper.com/) specifications, _from scratch_.
Every line is yours except the cryptography: a few hashes, signatures and VRFs come from
open-source libraries, listed in the [cryptography appendix](./cryptography.md).

The Gray Tutor is a JAM blockchain client built for learning and observability. At its core, AI offers _less truth, more trust_. That is why the solutions we build with AI need to keep the human in the loop. The Gray Tutor exists to show that this is possible, and that AI-assisted development can be more transparent than development before AI. Our goal is to make JAM approachable for new protocol developers, one guided step at a time.

By the end of this tutorial, your JAM client will be able to pass the official test vectors, _byte for byte_.

Stuck on a word? Every JAM word, Gray Paper symbol and programming term is in the
[glossary](./glossary.md).

Which part of the Gray Paper is a lesson about? Its first line says, and
[the Gray Paper, part by part](./gray-paper.md) maps every section to its lessons.

Curious what a JAM network actually does, before you write any code?
[JAM at a glance](./jam-at-a-glance.md) plays a real one in slow motion. It's optional: the
lessons explain every piece as you need it.

Wondering how JAM compares with a network built another way?
[JAM beside Aztec](./jam-beside-aztec.md) sets it against Ethereum's privacy rollup: why
one validator is cheap and the other isn't, whether JAM could run Aztec's private
transfers as a service, what building on it would take, and what a shielded account would
look like on JAM. Optional too.

## At a glance

All of JAM, in one equation from the Gray Paper (§4, *Overview*):

$$
\sigma' \equiv \Upsilon(\sigma, B)
$$

| Symbol | Say it | Here |
| --- | --- | --- |
| [σ](./symbols.md#state) | sigma | the chain's state before a block: everything it remembers |
| [B](./symbols.md#block) | B | the block: a header and its extrinsic |
| [Υ](./symbols.md#transition) | upsilon | the state-transition function: the rules |
| [σ′](./symbols.md#prime) | sigma prime | the state after the block |
| [≡](./symbols.md#defined-as) | is defined as | the left side is, by definition, the right |

Take a state and a block, apply the rules, get the next state. That's the whole of a
blockchain, and your client is Υ: by the end, hand it a state and a block and it answers
with σ′, byte for byte the same as every other JAM client. Here it is on real blocks:

<StfStep />

## How to read it

Each lesson builds on the ones before, and your client grows with
them. Each part's page says what your client can do at its end, and links self-test
for that part of the Gray Paper on our [JAM learning Site](https://abutlabs.github.io/jam-learning/lasair/exam.html).

There's no wrong way to read it, though. To start further in, or to catch up after a
break, run `npm run catch-up -- 14.2` at the repo root: it makes your client the client
after [lesson 14.2](./14-services/02-the-service-account.md), your own files saved to
`.backup/` first. Then `npm install` in `client/`, and begin [Part 15](./15-the-pvm/index.md), the PVM, right
there. `npm run compare -- 14.2` shows how
yours differs instead.

## Built with Reference to Lasair

This tutorial is built with reference to [Lasair](https://github.com/abutlabs/lasair) and how we have passed the M1 fuzzer. Lasair is an oCaml (currently private) JAM client which aims to run as validators on the future network at M4 Full-Speed. The tutorial uses Typescript to drive understanding. Abutlabs hopes that this content opens the door to other developers to becoming involved with the JAM protocol and build on it.

| | lasair | The Gray Tutor |
| --- | --- | --- |
| Language | OCaml | TypeScript |
| Built for | client diversity, conformance, speed | **Understanding** |
| How it runs | compiled to machine code before it runs | Node strips the types and runs the JavaScript: it starts as bytecode, and the busiest parts become machine code as it runs |
| 64-bit numbers | `Int64`: plain machine arithmetic | `bigint`: exact, but much slower |
| Several cores | native multicore | Worker threads; Each worker has isolated event loop, V8 instance, and memory space |

## Lessons

**[Part 0 · Start](./00-start/index.md)**

- [0.1 What you will build](./00-start/01-what-you-will-build.md)
- [0.2 Set up the project](./00-start/02-set-up-the-project.md)
- [0.3 Watch your client](./00-start/03-watch-your-client.md)
- [0.4 The JAM clock](./00-start/04-the-jam-clock.md)

**[Part 1 · Bytes and numbers](./01-bytes-and-numbers/index.md)**

- [1.1 Bytes and hex](./01-bytes-and-numbers/01-bytes-and-hex.md)
- [1.2 Numbers](./01-bytes-and-numbers/02-numbers.md)

**[Part 2 · The codec](./02-codec/index.md)**

- [2.1 Fixed-width integers](./02-codec/01-fixed-width-integers.md)
- [2.2 Compact naturals](./02-codec/02-compact-naturals.md)
- [2.3 Writer and Reader](./02-codec/03-writer-and-reader.md)
- [2.4 Codecs](./02-codec/04-codecs.md)
- [2.5 Sequences and records](./02-codec/05-sequences-and-records.md)
- [2.6 The first test vectors](./02-codec/06-the-first-test-vectors.md)
- [2.7 Watch a decode](./02-codec/07-watch-a-decode.md)

**[Part 3 · Work and reports](./03-work-and-reports/index.md)**

- [3.1 A work-package](./03-work-and-reports/01-a-work-package.md)
- [3.2 Work digests](./03-work-and-reports/02-work-digests.md)
- [3.3 A work-report](./03-work-and-reports/03-a-work-report.md)

**[Part 4 · Blocks](./04-blocks/index.md)**

- [4.1 Tickets and preimages](./04-blocks/01-tickets-and-preimages.md)
- [4.2 Tiny and full](./04-blocks/02-tiny-and-full.md)
- [4.3 Guarantees](./04-blocks/03-guarantees.md)
- [4.4 Disputes](./04-blocks/04-disputes.md)
- [4.5 Maybe, and exactly n](./04-blocks/05-maybe-and-exactly-n.md)
- [4.6 The header](./04-blocks/06-the-header.md)
- [4.7 The block](./04-blocks/07-the-block.md)

**[Part 5 · Hashing and signatures](./05-hashing-and-signatures/index.md)**

- [5.1 Hashes](./05-hashing-and-signatures/01-hashes.md)
- [5.2 The extrinsic hash](./05-hashing-and-signatures/02-the-extrinsic-hash.md)
- [5.3 Signatures](./05-hashing-and-signatures/03-signatures.md)

**[Part 6 · State and Merklization](./06-state-and-merklization/index.md)**

- [6.1 The state trie](./06-state-and-merklization/01-the-state-trie.md)
- [6.2 State keys](./06-state-and-merklization/02-state-keys.md)
- [6.3 Reading the state](./06-state-and-merklization/03-reading-the-state.md)

**[Part 7 · Time and shuffling](./07-time-and-shuffling/index.md)**

- [7.1 Epochs](./07-time-and-shuffling/01-epochs.md)
- [7.2 The shuffle](./07-time-and-shuffling/02-the-shuffle.md)

**[Part 8 · Safrole](./08-safrole/index.md)**

- [8.1 Stirring the entropy](./08-safrole/01-stirring-the-entropy.md)
- [8.2 Rotating the validators](./08-safrole/02-rotating-the-validators.md)
- [8.3 The fallback sealers](./08-safrole/03-the-fallback-sealers.md)
- [8.4 The lottery's winners](./08-safrole/04-the-lotterys-winners.md)
- [8.5 One step of Safrole](./08-safrole/05-one-step-of-safrole.md)
- [8.6 The VRF output](./08-safrole/06-the-vrf-output.md)
- [8.7 Entering tickets](./08-safrole/07-entering-tickets.md)
- [8.8 The ring root](./08-safrole/08-the-ring-root.md)
- [8.9 Seals](./08-safrole/09-seals.md)

**[Part 9 · Recent history](./09-recent-history/index.md)**

- [9.1 The mountain belt](./09-recent-history/01-the-mountain-belt.md)
- [9.2 Recent blocks](./09-recent-history/02-recent-blocks.md)

**[Part 10 · Disputes](./10-disputes/index.md)**

- [10.1 Votes and verdicts](./10-disputes/01-votes-and-verdicts.md)
- [10.2 Culprits and faults](./10-disputes/02-culprits-and-faults.md)
- [10.3 Clearing the cores](./10-disputes/03-clearing-the-cores.md)
- [10.4 Bad verdicts](./10-disputes/04-bad-verdicts.md)
- [10.5 Bad culprits and faults](./10-disputes/05-bad-culprits-and-faults.md)

**[Part 11 · Assurances](./11-assurances/index.md)**

- [11.1 Available](./11-assurances/01-available.md)
- [11.2 Timeouts](./11-assurances/02-timeouts.md)
- [11.3 Bad assurances](./11-assurances/03-bad-assurances.md)

**[Part 12 · Guarantees](./12-guarantees/index.md)**

- [12.1 Who guarantees what](./12-guarantees/01-who-guarantees-what.md)
- [12.2 Signed and counted](./12-guarantees/02-signed-and-counted.md)
- [12.3 Onto the cores](./12-guarantees/03-onto-the-cores.md)
- [12.4 Bad guarantees](./12-guarantees/04-bad-guarantees.md)
- [12.5 Bad reports](./12-guarantees/05-bad-reports.md)

**[Part 13 · Authorization](./13-authorization/index.md)**

- [13.1 The authorizer pools](./13-authorization/01-the-authorizer-pools.md)

**[Part 14 · Services and preimages](./14-services/index.md)**

- [14.1 Providing preimages](./14-services/01-providing-preimages.md)
- [14.2 The service account](./14-services/02-the-service-account.md)

**[Part 15 · The PVM](./15-the-pvm/index.md)**

- [15.1 The program blob](./15-the-pvm/01-the-program-blob.md)
- [15.2 Instructions](./15-the-pvm/02-instructions.md)
- [15.3 The machine](./15-the-pvm/03-the-machine.md)
- [15.4 Memory](./15-the-pvm/04-memory.md)
- [15.5 Arithmetic](./15-the-pvm/05-arithmetic.md)
- [15.6 Branches and calls](./15-the-pvm/06-branches-and-calls.md)
- [15.7 Bits and bytes](./15-the-pvm/07-bits-and-bytes.md)
- [15.8 A real program](./15-the-pvm/08-a-real-program.md)
- [15.9 What instructions cost](./15-the-pvm/09-what-instructions-cost.md)
- [15.10 The pipeline](./15-the-pvm/10-the-pipeline.md)
- [15.11 The gas meter](./15-the-pvm/11-the-gas-meter.md)

**[Part 16 · Host calls](./16-host-calls/index.md)**

- [16.1 Calling the host](./16-host-calls/01-calling-the-host.md)
- [16.2 Fetch](./16-host-calls/02-fetch.md)
- [16.3 Growing the heap](./16-host-calls/03-growing-the-heap.md)
- [16.4 Info](./16-host-calls/04-info.md)
- [16.5 Storage](./16-host-calls/05-storage.md)
- [16.6 Checkpoints](./16-host-calls/06-checkpoints.md)
- [16.7 A service's inputs](./16-host-calls/07-a-services-inputs.md)
- [16.8 Lookup](./16-host-calls/08-lookup.md)
- [16.9 Asking for preimages](./16-host-calls/09-asking-for-preimages.md)

**[Part 17 · Accumulation](./17-accumulation/index.md)**

- [17.1 A block's accumulation](./17-accumulation/01-a-blocks-accumulation.md)
- [17.2 Waiting reports](./17-accumulation/02-waiting-reports.md)
- [17.3 Sending a transfer](./17-accumulation/03-sending-a-transfer.md)
- [17.4 Rounds](./17-accumulation/04-rounds.md)
- [17.5 Privileges](./17-accumulation/05-privileges.md)
- [17.6 Who wins](./17-accumulation/06-who-wins.md)
- [17.7 Ejecting a service](./17-accumulation/07-ejecting-a-service.md)
- [17.8 Creating a service](./17-accumulation/08-creating-a-service.md)
- [17.9 The block's gas budget](./17-accumulation/09-the-blocks-gas-budget.md)
- [17.10 Upgrading a service](./17-accumulation/10-upgrading-a-service.md)
- [17.11 What a service yields](./17-accumulation/11-what-a-service-yields.md)
- [17.12 Providing a preimage](./17-accumulation/12-providing-a-preimage.md)
- [17.13 Blessing and designating](./17-accumulation/13-blessing-and-designating.md)

**[Part 18 · Statistics](./18-statistics/index.md)**

- [18.1 Who did what](./18-statistics/01-who-did-what.md)
- [18.2 What cores and services did](./18-statistics/02-what-cores-and-services-did.md)

**[Part 19 · Block import](./19-block-import/index.md)**

- [19.1 The order of things](./19-block-import/01-the-order-of-things.md)
- [19.2 The whole state](./19-block-import/02-the-whole-state.md)
- [19.3 Accounts from the state](./19-block-import/03-accounts-from-the-state.md)
- [19.4 Importing a block](./19-block-import/04-importing-a-block.md)
- [19.5 Work on the chain](./19-block-import/05-work-on-the-chain.md)
- [19.6 Blocks to refuse](./19-block-import/06-blocks-to-refuse.md)

**[Part 20 · Facing the fuzzer](./20-facing-the-fuzzer/index.md)**

- [20.1 Speaking the protocol](./20-facing-the-fuzzer/01-speaking-the-protocol.md)
- [20.2 A target](./20-facing-the-fuzzer/02-a-target.md)
- [20.3 A session](./20-facing-the-fuzzer/03-a-session.md)
- [20.4 Ready to be fuzzed](./20-facing-the-fuzzer/04-ready-to-be-fuzzed.md)

<a id="still-to-be-written"></a>

## After M1

Every part is written: the road ends at a block importer, JAM's first milestone. A
client that runs a real network goes further: the edge cases in
[HARDENING.md](https://github.com/abutlabs/the-gray-tutor/blob/main/HARDENING.md), each with the
case that needs it; speed, which M3 and M4 measure; and making blocks rather than only
importing them, with networking, which M2 asks for. Those are for another tutorial.
