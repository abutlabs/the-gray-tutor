# JAM beside Aztec

Optional, and no code: a comparison, not a lesson. [Aztec](https://aztec.network/) is a
privacy network on Ethereum where users prove their own transactions and the network only
checks the proofs. This page sets it beside JAM to answer four questions that come up
once you've seen both: what the smallest validator of each has to be, whether JAM could
work the way Aztec does, whether JAM could have more than one kind of validator, and
whether some cores could be bigger than others, big enough to run a language model.

Everything here is as of October 2026. Both designs keep changing, Aztec's by the month,
so the numbers are dated on purpose. The reasoning is what to keep, and the
[conclusions](#conclusions) at the end put it in one place.

## New words

- **Rollup.** A chain that does its work elsewhere and posts the result, with enough data
  to check it, to another chain. *Example:* Aztec posts to Ethereum.
- **Sequencer.** Aztec's name for a validator: a staked machine that proposes blocks and
  signs for others'. *Example:* 200,000 AZTEC to run one.
- **Committee.** The few validators drawn to check blocks for a while, out of the many who
  are staked. *Example:* 48 of Aztec's 3,000 or so, for 38 minutes.
- **Prover.** A machine that turns a batch of finished work into a zero-knowledge proof.
  *Example:* Aztec's provers hold no stake.
- **Zero-knowledge proof.** A small piece of data that shows a computation was done right,
  without redoing it and without showing its inputs. *Example:* a proof that a transfer
  balanced, with the amount hidden.
- **Client-side proving.** The user's own device makes the proof. *Example:* a phone
  proving its own payment before sending it.
- **Auditor.** In JAM, a validator drawn to re-run a work-report once its data is
  available, and to vote against it if it's wrong. *Example:* about 30 auditors per report.
- **Stake and slashing.** Money a validator locks to take part, and loses some of for
  provable misbehaviour. *Example:* 2,000 AZTEC for a missed duty.

All eight are in the [glossary](./glossary.md), with JAM's own words: validator, core,
guarantor, assurance, refine and accumulate.

## The two networks in one table

| | Aztec, V5 alpha | JAM, Gray Paper 0.8.0 |
| --- | --- | --- |
| What it is | A *rollup* on Ethereum, which finalises it | Its own chain, finalised by its own validators (GRANDPA) |
| Who runs it | 3,000 to 4,000 *sequencers*, 200,000 AZTEC each | 1,023 validators, all alike (any multiple of 3 from 6 up) |
| Who checks a block | A *committee* of 48 drawn each epoch; 33 must sign | Everyone: each validator holds a piece of every core's data and audits about 10 reports a slot |
| A slot, an epoch | 72 s; 32 slots, 38 min 24 s | 6 s; 600 slots, one hour |
| Where the heavy work runs | On users' devices (private functions) and on *provers* (the proof of an epoch) | On cores: 3 guarantors run each package, then about 30 *auditors* run it again |
| Smallest validator | 8 cores, 8 GB, 1 TB NVMe, 25 Mbit/s, plus the stake | Assumed 16 cores, 64 GB, 8 TB, 0.5 Gbit/s; stake not in the paper |
| Heaviest machine | A prover agent: 32 cores, 128 GB, no stake | The same validator |
| What a user needs | A phone or browser that can make a proof | Nothing special: anyone may build a work-package |
| Written down where | Aztec's operator docs and L2BEAT | §20 of the Gray Paper, *Discussion* |

Two names in the table that the lessons don't build: your client imports blocks, and
auditing happens off the chain (§17, *Auditing and Judging*). GRANDPA is the finality vote
(§19). Both are what a validator does beside importing.

> [!NOTE]
> Aztec's first product was `zk.money`, a private transfer app on an earlier design called
> Aztec Connect. It stopped taking deposits in March 2023 and its last sequencer stopped
> on 31 March 2024. The network compared here is its successor: V5, in alpha since
> 21 July 2026, with private smart contracts and a token. On 27 July 2026 its contributors
> found a critical bug in the V5 proving system, one that could let an invalid transaction
> through; the fix is planned for V6, later in 2026. That matters below.

## The smallest validator

Aztec's validator is cheap because it never does the expensive thing, and Aztec has two
expensive things.

The first is running a private function. The user does that, on their own device, and
makes a proof of it: *client-side proving*, with a proving system (CHONK) built to run on
phones and in browsers. The network never sees the inputs, only the proof.

The second is turning an epoch's blocks into one proof for Ethereum. Provers do that:
machines with no stake, run by anyone, paid from fees. Aztec's own guide asks for a prover
agent of 32 cores and 128 GB, "data-centre grade". A proof may cover one checkpoint
(72 s of blocks) or a whole epoch, and must land within 1 hour 16 minutes, or the
unproven blocks are dropped.

Between those two sits the committee's job: re-run the public functions, check the private
proofs, sign the block header. Checking a proof takes milliseconds. So the cheapest seat on
Aztec is a full node's hardware plus 200,000 AZTEC, and when a sequencer isn't on the
committee, it waits.

JAM's validator can't be cheap in that way, because every validator must be able to do
every job. The jobs are dealt out by randomness nobody can steer: guarantors by
[lesson 12.1](./12-guarantees/01-who-guarantees-what.md)'s shuffle, auditors the same way. A validator that can't run a report is a
hole in the net. The Gray Paper (§20) plans ten audits per validator per slot and splits
a validator's CPU like this:

| Job | Share of the CPU |
| --- | --- |
| Audits | 10 of 16 |
| Running the block (what your client does) | 2 of 16 |
| Merklization | 1 of 16 |
| GRANDPA and BEEFY | 1 of 16 |
| Erasure coding | 1 of 16 |
| Networking and the rest | 1 of 16 |

Ten audits at once, each a core's worth of work, is where "16 cores and 64 GB" comes from.
A core's worth is the Gray Paper's "virtual hardware" of a core: a quarter to a half of one
CPU core for the whole six seconds, 2 GB of RAM, 2 MB/s of input and output, a result of
at most 48 KB, and 5,000,000,000 gas of refine ([lesson 15.11](./15-the-pvm/11-the-gas-meter.md)).

For scale, Polkadot's reference hardware today is 8 physical cores at 3.4 GHz, 32 GB,
2 TB of NVMe and 500 Mbit/s each way, with a self-stake of 10,000 DOT since March 2026.
The Gray Paper leaves stake, coretime sales and the currency out on purpose (§21).

### Why 3,000 there and 1,023 here

On Aztec most validators wait and 48 work; a bigger set costs nothing per block. On JAM
everyone works every slot: every validator holds a shard of every report
([lesson 11.1](./11-assurances/01-available.md)) and audits ten. Add validators and you add cores (one active core
per three validators, [lesson 12.1](./12-guarantees/01-who-guarantees-what.md)), so you add work, and the data every
validator must take in grows with the set. 1,023 is where the Gray Paper's model of
bandwidth and CPU balances, not a law.

The two security models differ as much as the sizes. Aztec's own security post puts it
plainly: with 4,000 sequencers, about 55% of them (443 million AZTEC of stake) would give
a 99% chance of owning a committee's two-thirds within three days, and the escape-hatch
bond of 332 million AZTEC (about $6.5 million then) is the practical ceiling on what an
attack can cost. JAM's check is re-execution: a wrong report must get past every one of
its ~30 auditors, drawn from the whole set, and ELVES, the paper JAM's auditing follows
(§17), argues that with fewer than a third dishonest that chance is negligible. Finality
waits on the audits.

The July 2026 bug shows the other side of Aztec's bargain. When the check is "verify a
proof", the proving system is the thing you trust; a bug in it is a bug in every block.
When the check is "run it again", as on JAM, a proof system is just one service's code,
and a bug in it is that service's problem ([lesson 17.10](./17-accumulation/10-upgrading-a-service.md) upgrades it).

## Could JAM work the way Aztec does?

Take Aztec's way of working apart into four ideas and try each on JAM.

**1. The user proves, the network checks.** On JAM this is a service, not a protocol
change. The service's refine takes a *zero-knowledge proof* as its input and verifies it
on the core; its accumulate records the result on the chain. The cost is gas. On
lasair's PVM, one Groth16 proof check metered at about 250 million gas under 0.8.0's
costs: a twentieth of a package's 5 billion, so about 20 checks per package, and with
341 cores every 6 s about 1,100 a second across the network, before anyone optimises
anything. Aztec's alpha runs at about one transaction a second and needs more than ten to
leave alpha. Crude, but the right order. The gas costs were set for safety, not speed; the
way to a real number is the gas meter of [lesson 15.11](./15-the-pvm/11-the-gas-meter.md) on a verifier compiled to
PVM. The 48 KB result is the other limit: a note commitment and a nullifier are 32 bytes
each, so one package's result carries about 700 of each.

**2. Heavy work by unstaked specialists.** JAM has this shape already: the work-package
*builder*. The Gray Paper names the builder (§14) and says nothing about who it is, which
means anyone. A builder may be a 128 GB prover farm. The guarantors then run refine, which
only verifies. What JAM lacks that Aztec has is protocol-level pay for the builder: Aztec
pays provers from fees; on JAM a service pays its builders however it likes, off the chain
or with transfers in accumulate ([lesson 17.3](./17-accumulation/03-sending-a-transfer.md)), and the service pays for its
coretime.

**3. A small sampled committee.** JAM samples too: three guarantors per core
([lesson 12.1](./12-guarantees/01-who-guarantees-what.md)), about thirty auditors per report, one sealer per slot
([Part 8](./08-safrole/index.md)). The difference is what the sample is drawn from. Aztec's
committee is light work, so its set can be weak machines; JAM's audits are heavy, so its
set must be strong ones. Same sampling, different floor.

**4. Settle elsewhere.** Aztec borrows Ethereum's finality and keeps its data in
Ethereum's blobs. JAM finalises itself and keeps its own data: the assurances of
[lesson 11.1](./11-assurances/01-available.md), 682 MB/s of it by the Gray Paper's model. Nothing to borrow.

So JAM can host Aztec's model as a service today. What it can't do without a protocol
change is make validators cheap by making them do less, because JAM's security *is* the
whole set doing the work again.

### What a private service on JAM would need

- **A verifier as PVM code.** CHONK's or UltraHonk's verifier compiled to the PVM, with
  its gas measured. The one measured point so far is Groth16's, above.
- **Private state in service storage.** Notes, nullifiers and the Merkle tree they live
  in, with the nullifier set growing for ever; the 48 KB result sets the rate.
- **A client.** Something like Aztec's PXE: builds the package, proves on the user's
  device, hands it to a builder or straight to a guarantor.
- **Data.** JAM's own availability for the package; the tree witness comes in as imported
  segments ([lesson 3.1](./03-work-and-reports/01-a-work-package.md)).
- **Payment.** Coretime for the service, fees inside it.
- **Who holds the keys.** The service's code can be upgraded by whoever accumulate lets
  ([lesson 17.10](./17-accumulation/10-upgrading-a-service.md)). After July 2026, that is the question to answer first.

## More than one kind of validator?

What the Gray Paper fixes today: one set, and every validator in it eligible for every
duty. A validator's key is 336 bytes, and the last 128 are opaque metadata for "practical
identifiers, not least a hardware address" ([lesson 6.3](./06-state-and-merklization/03-reading-the-state.md)). A
tag saying what a validator can do would fit there without touching the codec. The next
set is chosen by the delegator service ([lesson 17.13](./17-accumulation/13-blessing-and-designating.md)), so who gets
in is already a service's decision, and the statistics count what each validator did
([lesson 18.1](./18-statistics/01-who-did-what.md)). The room is there. The question is what uniformity is holding up.

Four things, as it turns out:

1. **Auditing.** Any validator may be drawn for any report. A validator that can't run a
   report is a hole in the net, and the net is the security.
2. **Availability.** Each validator holds one shard of every report, and any 342 shards
   rebuild it ([lesson 11.1](./11-assurances/01-available.md)). A class that can't hold its share weakens recovery
   for every core.
3. **Guaranteeing.** The rotation walks every validator over every core
   ([lesson 12.1](./12-guarantees/01-who-guarantees-what.md)).
4. **Sealing.** Any validator may author a block ([Part 8](./08-safrole/index.md)).

Three ways to add a second kind, and what each costs:

**A. Light and heavy, sharing the cores.** Say light validators skip the audits on heavy
cores. Then heavy cores are judged by the heavy class alone, and the security of those
cores shrinks to the class. With 99 heavy validators, 33 dishonest ones, a third of the
class, are enough to get a bad report through, where the whole set needs 341. And the bad
report's accumulate lands in everyone's state. The Gray Paper's survey of other designs
(§2) warns against exactly this trade: limiting "the validator set size or diversity" and
putting "onerous requirements on the hardware which validators must have".

**B. Classes with their own cores, stake and finality.** That is a second chain. The same
survey says why JAM didn't go that way: validator sets that are chosen separately give no
shared security, so a corrupted one hurts the others.

**C. Aztec's way.** Keep validators uniform. Put the heavy actors outside the protocol,
unstaked, and make their output cheap to check. The uniform set stays the judge; builders
and provers grow with demand, and the validator stays one spec.

So: JAM can have many kinds of *participant* cheaply, and its validator record already has
room to describe one. More than one kind of *validator* costs security per core, and the
paper's authors chose against it on purpose. If a later Gray Paper adds classes, expect
each to come with its own security argument in the ELVES style, and its own availability
rule.

## Are all cores equal? Could one run a language model?

A core isn't a machine ([JAM at a glance](./jam-at-a-glance.md)). It's three guarantors who move on every
10 slots, and a budget: six seconds, a quarter to a half of a CPU core, 2 GB of RAM, 2 MB/s
in and out, a 48 KB result, 5 billion gas, and as many preimage reads as it likes
([lesson 16.8](./16-host-calls/08-lookup.md)).

Cores already differ, in one way: in who may use them. Each core has its own authorizer
pool and queue ([lesson 13.1](./13-authorization/01-the-authorizer-pools.md)) and its own assigner
([lesson 17.5](./17-accumulation/05-privileges.md)). So "core 7 is the model core" is possible today: its
assigner queues the model service's authorizer and nobody else's. What no core can have is
a different budget. Those are constants, the same for all 341.

### A model on a stock core

Rough sums, not measurements. The way to measure is to compile an integer inference loop
to the PVM and run it under the gas meter of [lesson 15.11](./15-the-pvm/11-the-gas-meter.md).

- **Integers only.** The PVM has no floating point and no vector instructions
  ([Part 15](./15-the-pvm/index.md)). A model has to be rounded to 8-bit integers to run at all,
  which is also what re-execution demands: three guarantors and thirty auditors must get
  the same bytes.
- **Compute.** A plain integer core manages a few billion simple operations a second; a
  quarter to a half of one for six seconds is about 10 billion per package. A model costs
  about two operations per parameter per token. So a 500-million-parameter model gives
  about 10 tokens a package, and a 100-million-parameter one about 50. Easily wrong by a
  factor of a few, either way.
- **Memory.** 2 GB holds about 1.5 billion 8-bit parameters, with room to work.
- **Weights.** As preimages: a 500 MB model is 500 MB in each of 1,023 validators' stores,
  paid for at 1 per byte (§9), and dropped 19,200 slots (32 hours) after the last thing
  referring to it goes.
- **Output.** 48 KB, plenty for text.

That is a small model, a handful of tokens every six seconds, on every core at once:
a classifier, a moderation call, an embedding, a short completion. Not a chatbot.

### Bigger models

Billions of parameters, the GPU kind, don't fit the budget. Three roads:

1. **Raise every validator's hardware.** Everyone pays. The Gray Paper's note on Solana
   (§2) is the warning: then the limit is what validators can be asked to buy, and the set
   shrinks to those who can.
2. **A heavy class with heavy cores.** See above: the security of those cores shrinks to
   the class.
3. **Keep the budget, run the model outside, check it inside.** Three ways to check:
   - *A proof of the inference.* In 2026, a GPT-2 class model's 64 tokens took 147.7 s to
     prove on a 192-core, 755 GB machine, against 94.55 ms to run them: about 1,500 times
     slower, and the frontier models aren't provable yet. Where it works, the core checks
     one proof per package, Aztec's shape exactly.
   - *Optimistic.* An unstaked provider posts the answer and a bond; anyone may challenge
     within a window; a challenge re-runs the model on the core, a layer at a time across
     many packages, weights from preimages, each layer's output as exported and imported segments
     ([lesson 3.1](./03-work-and-reports/01-a-work-package.md)). A 7-billion-parameter model's forward pass is about 14
     billion operations a token, so about 1,000 packages a token at the stock budget: slow,
     but only on a challenge. The catch is that the provider's GPU answer must match the
     PVM's integer replay bit for bit. In 2026 that is live research: 16-bit floats differ
     across GPU generations on most prompts, and the fixes (a fixed order of additions, or
     8-bit integers with power-of-two scales) are new. A JAM model service would publish
     its integer kernel as the rule and accept nothing else.
   - *A hardware attestation.* A trusted chip vouches for the run. Cheap, and it trusts the
     chip's maker. Not JAM's model, but a service may choose it for itself.

### What a model service would need

1. A reference inference program, integer only, as PVM code: the rule every replay
   follows.
2. Weights as preimages, with a cheaper rule than 1 per byte for blobs of gigabytes.
3. Chunking across packages: each layer's output as exported segments; 3,072 imports of 4,104
   bytes is 12 MB a package.
4. A challenge game inside the service, not the protocol: accumulate holds the bonds and a
   verdict is a work-result.
5. Measurements before any of it: tokens a package, gas a token, on the PVM you built in
   [Part 15](./15-the-pvm/index.md).

And a last point on future-proofing. A core's budget is a set of constants. Change the
constants and every core grows together, in one protocol upgrade. The future-proof plan
isn't unequal cores; it's one budget that tracks commodity hardware by upgrade, plus the
roads above for work that will never fit a core. Unequal *work* is cheap on JAM. Unequal
*validators* are not.

## Conclusions

Could JAM do what Aztec does, on its general-purpose network? **Yes to the function, no
to the economics.** Private transactions as Aztec runs them, where the user proves on
their own device and the network checks the proof and keeps a tree of notes and a set of
nullifiers, fit JAM as one service among many: refine checks the proof, the tree and the
nullifiers live in the service's storage, and accumulate writes them. JAM's own
availability keeps the data and JAM's own finality settles it, so nothing is borrowed from
Ethereum. What JAM cannot do is Aztec's validator economics: a committee of 48 light
machines drawn from thousands. JAM's whole set still re-runs every package, so a private
service on JAM is secured by 1,023 strong validators, not by 48 of 4,000 cheap ones. That
costs more per validator and buys a stronger check: a bug in the proving system is one
service's bug, not every block's.

The answers, one per question:

1. **The smallest validator.** Aztec: 8 cores, 8 GB, 1 TB, 25 Mbit/s and 200,000 AZTEC,
   because the heavy work is done by users and by unstaked provers. JAM: 16 cores, 64 GB,
   8 TB and 0.5 Gbit/s by the Gray Paper's model, because every validator audits ten
   reports a slot. The gap is the design, not the implementation: JAM's security is the
   set doing the work again.
2. **Could JAM adopt Aztec's ideology?** As a service, today, with no protocol change:
   the user proves, refine checks, accumulate records, and a builder may be a 128 GB
   prover farm. What it takes is listed in
   [What a private service on JAM would need](#what-a-private-service-on-jam-would-need):
   a verifier as PVM code with its gas measured, the note tree and nullifier set in
   service storage, a client that proves on the user's device, coretime and fees.
   Throughput by the one measurement so far: about 20 proof checks a package, about 1,100
   a second across 341 cores, against Aztec's alpha at one a second. Groth16 has the
   cheapest verifier of the common proof systems and Aztec's are heavier, so expect fewer
   than 20 until someone measures. The 48 KB result caps a package at about 700 notes and
   700 nullifiers. What JAM should not adopt is the cheap validator, for the reason in 3.
3. **More than one kind of validator?** No, not as the Gray Paper stands, and not worth
   adding. Auditing, availability, guaranteeing and sealing all draw from the whole set;
   a heavy class judged by itself is a smaller net, where 33 dishonest machines of 99 pass
   what takes 341 of 1,023 today. Keep validators uniform and put the unequal actors
   outside: builders, provers, a model's provider, all unstaked, all checked by the
   uniform set. The validator record's 128 bytes of metadata has room for a tag if a later
   paper wants one.
4. **Unequal cores, and a language model on one?** Cores can differ today in who uses
   them, by assigner and authorizer queue, never in their budget. A stock core runs a
   small integer model: roughly 10 to 50 tokens a package for 100 to 500 million
   parameters, unmeasured. A big model runs outside and is checked inside, by a proof
   (1,500 times slower than the run, GPT-2 class in 2026), by an optimistic challenge with
   a bit-exact integer replay, or by a chip's attestation.

So, for the plan of 1,023 uniform validators: keep one kind of validator and one kind of
core. Plan for the constants to rise by upgrade, and for the heavy work, Aztec's and a
model's, to sit beside the protocol, where JAM already puts the builder.

## Check your understanding

::: check
**Why can an Aztec sequencer run on 8 GB when the Gray Paper assumes 64 GB for a JAM validator?**

- [ ] Aztec's blocks are smaller
  > No: the block isn't the cost. A sequencer never runs the expensive work; users and
  > provers do, and the committee checks proofs, which takes milliseconds.
- [x] A sequencer checks proofs; a JAM validator re-runs about ten reports a slot
  > Yes: the Gray Paper gives audits 10 of a validator's 16 CPU parts, each audit a core's
  > worth of work. Aztec moved that work to users and unstaked provers.
- [ ] Aztec has more validators, so each does less
  > No: the thousands who aren't on the committee just wait. The committee's job is light
  > because it checks proofs instead of running the work again.

**An assigner dedicates core 7 to a model service. What changes about core 7?**

- [ ] Which validators guarantee it
  > No: the rotation deals guarantors to every core the same way, and this one keeps its
  > turn.
- [ ] Its gas budget and RAM
  > No: every core has the same budget, 5 billion gas and 2 GB. Those are constants.
- [x] Which authorizers it accepts, so which packages it runs
  > Yes: the assigner sets the core's authorizer queue, and the model service's authorizer
  > is the only one that fills its pool.

**A heavy class of 99 validators audits the heavy cores alone. How many dishonest validators does it take to get a bad report through on one?**

- [x] About 33, a third of the class
  > Yes: auditing's guarantee rests on fewer than a third of the pool it draws from being
  > dishonest. Shrink the pool and the number shrinks with it.
- [ ] About 341, a third of 1,023
  > No: that is the whole set's figure. A report audited only by the class is judged only
  > by the class.
- [ ] None: the proof catches it
  > No: JAM has no proof. Running it again is the check, and only the class runs it.

**Which of these is the closest thing JAM already has to Aztec's unstaked prover?**

- [ ] The guarantor
  > No: guarantors are staked validators, dealt to a core by the shuffle.
- [ ] The delegator service
  > No: the delegator picks the next validators. It does no heavy work.
- [x] The work-package builder
  > Yes: the Gray Paper names the builder and says nothing about who it is, so anyone,
  > with any hardware, may do the heavy work and hand the package to the guarantors.
:::

## Where this could be wrong

- Aztec's numbers are an alpha network's, read from its docs and L2BEAT in October 2026.
  The validator count moves daily, slots and committee sizes are governance parameters,
  and V6 will change some of them.
- JAM's hardware figures are the Gray Paper's own model (§20), which the paper itself calls
  "a provisional and crude estimation". No 1,023-validator network has run yet.
- The gas figure for a proof check is one measurement, on one client, of one proof system.
- The token counts for a model on a core are arithmetic, not a run. Treat them as the shape
  of the answer, not the answer.

## Sources

- Aztec: [operator guide](https://docs.aztec.network/operate/operators),
  [running a sequencer](https://docs.aztec.network/operate/operators/setup/sequencer_management),
  [running a prover](https://docs.aztec.network/the_aztec_network/guides/run_nodes/how_to_run_prover),
  [slashing and offences](https://docs.aztec.network/operate/operators/sequencer-management/slashing_and_offenses),
  [Alpha network security](https://aztec.network/blog/alpha-network-security-what-to-expect),
  [road map update](https://aztec.network/blog/aztec-network-roadmap-update),
  [the end of Aztec Connect](https://medium.com/aztec-protocol/sunsetting-aztec-connect-a786edce5cae),
  and [L2BEAT's page](https://l2beat.com/scaling/projects/aztecnetwork).
- Polkadot: [validator requirements](https://docs.polkadot.com/node-infrastructure/run-a-validator/requirements/).
- JAM: the [Gray Paper](https://graypaper.com/), §2, §9, §14, §17, §20 and §21, and
  [ELVES](https://eprint.iacr.org/2024/961).
- Proving and replaying models: [zkComposer](https://arxiv.org/abs/2607.08095) (the zkGPT
  figures), [deterministic inference across GPU kernels](https://arxiv.org/abs/2609.00363)
  and [mitigating inference nondeterminism across GPU architectures](https://arxiv.org/abs/2609.25624).

Back to [the start](./index.md).
