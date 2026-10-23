# JAM beside Aztec

Optional, and no code: a comparison, not a lesson. [Aztec](https://aztec.network/) is a
privacy network on Ethereum where users prove their own transactions and the network only
checks the proofs. This page sets it beside JAM and answers one question: could JAM run
Aztec's privacy functions as a service?

Numbers are as of October 2026 and will date. The reasoning is what to keep; the
[conclusions](#conclusions) put it in one place.

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

| | Aztec, Alpha V5 | JAM, Gray Paper 0.8.0 |
| --- | --- | --- |
| What it is | A *rollup* on Ethereum, which finalises it | Its own chain, finalised by its own validators (GRANDPA) |
| Who runs it | 3,000 to 4,000 *sequencers*, 200,000 AZTEC each | 1,023 validators, all alike |
| Who checks a block | A *committee* of 48 drawn each epoch; 33 must sign | Everyone: each validator holds a piece of every core's data and audits about 10 reports a slot |
| A slot, an epoch | 72 s; 32 slots, 38 min 24 s | 6 s; 600 slots, one hour |
| Where the heavy work runs | On users' devices (private functions) and on *provers* (the proof of an epoch) | On cores: 3 guarantors run each package, then about 30 *auditors* run it again |
| Smallest validator | 8 cores, 8 GB, 1 TB NVMe, 25 Mbit/s, plus the stake | Assumed 16 cores, 64 GB, 8 TB, 0.5 Gbit/s; stake not in the paper |
| Heaviest machine | A prover agent: 32 cores, 128 GB, no stake | The same validator |
| What a user needs | A phone or browser that can make a proof | Nothing special: anyone may build a work-package |
| Written down where | Aztec's operator docs and L2BEAT | §20 of the Gray Paper, *Discussion* |

Two things in the table the lessons don't build: auditing (§17) and GRANDPA, the finality
vote (§19). Both are what a validator does beside importing blocks.

> [!NOTE]
> Aztec's first product was `zk.money`, a private transfer app on an earlier design called
> Aztec Connect, shut down on 31 March 2024. The network compared here is its successor,
> the Alpha network, on its fifth release (V5) since 21 July 2026. On 27 July 2026 its
> contributors found a critical bug in the V5 proving system, one that could let an
> invalid transaction through; the fix is planned for V6, later in 2026.

## Why one validator is cheap and the other isn't

Aztec's validator never does the expensive work. Users run their private functions on
their own devices and prove them (*client-side proving*, with a proving system called
CHONK built for phones and browsers). Unstaked provers, 32 cores and 128 GB each, turn an
epoch's blocks into one proof for Ethereum, due within 1 hour 16 minutes. The committee
re-runs the public functions, checks the private proofs in milliseconds, and signs. When
a sequencer isn't on the committee, it waits.

JAM's validator can't be cheap that way, because every validator must be able to do every
job. Guarantors and auditors are dealt out by a shuffle nobody can steer
([lesson 12.1](./12-guarantees/01-who-guarantees-what.md)), so a validator that can't run a
report is a hole in the net. The Gray Paper (§20) plans ten audits per validator per slot
and gives them 10 of a validator's 16 CPU cores; each audit is a core's worth of work: a
quarter to a half of a CPU core for six seconds, 2 GB of RAM, 2 MB/s in and out, a 48 KB
result, 5 billion gas ([lesson 15.11](./15-the-pvm/11-the-gas-meter.md)). For scale,
Polkadot's reference validator today is 8 cores, 32 GB, 2 TB and 500 Mbit/s, with a
self-stake of 10,000 DOT.

The security models differ as much as the machines. Aztec's own security post says that
with 4,000 sequencers, about 55% of them (443 million AZTEC) would give a 99% chance of
owning a committee's two-thirds within three days, and the escape-hatch bond of
332 million AZTEC (about $6.5 million then) is the practical ceiling on what an attack can
cost. JAM's check is re-execution: a wrong report must get past about 30 auditors drawn
from all 1,023, and ELVES, the paper JAM's auditing follows (§17), argues that with fewer
than a third dishonest that chance is negligible.

The July 2026 bug shows the other side of Aztec's bargain. When the check is "verify a
proof", the proving system is the thing you trust; a bug in it is a bug in every block.
When the check is "run it again", a proof system is one service's code, and a bug in it
is that service's problem ([lesson 17.10](./17-accumulation/10-upgrading-a-service.md)
upgrades it).

## Could JAM run Aztec as a service?

Take Aztec's design apart into four ideas and try each on JAM.

1. **The user proves, the network checks.** On JAM this is a service, not a protocol
   change. The expensive part, making the proof, happens off the chain, on the user's
   device or the builder's machines, as on Aztec. Refine does the cheap part, verifying it
   on the core; accumulate only writes the result. On lasair's PVM one Groth16 check metered at about 250 million gas under
   0.8.0, a twentieth of a package's 5 billion: about 20 checks a package, 3 a second on
   one core. Groth16 has the cheapest verifier of the common systems and CHONK is heavier,
   so expect fewer until someone measures.
2. **Heavy work by unstaked specialists.** JAM has the shape already: the work-package
   *builder*. The Gray Paper names the builder (§14) and says nothing about who it is, so
   a builder may be a 128 GB prover farm. Aztec pays provers from fees at the protocol
   level; on JAM the service pays its builders itself and buys its own coretime.
3. **A small sampled committee.** JAM samples too: three guarantors a core, about thirty
   auditors a report, one sealer a slot. The difference is the pool. Aztec's committee
   does light work, so its pool can be weak machines; JAM's audits are heavy, so its pool
   must be strong ones.
4. **Settle elsewhere.** Aztec borrows Ethereum's finality and blobs. JAM finalises itself
   and keeps its own data ([lesson 11.1](./11-assurances/01-available.md)). Nothing to
   borrow.

So the function fits. Two limits set its speed, and neither is the proof check.

- **Accumulate's budget.** A work-report gets 10 million gas of accumulate, about 10 ms,
  against refine's 5 billion. One note inserted into a 32-deep tree is 32 hashes, about
  300,000 gas by lasair's measure of a Blake2 hash, so accumulate can insert about 30 notes
  a report. The tree must be updated in refine, from a witness of the old root, with
  accumulate checking that root against the one it holds and storing the new one.
- **One tree, one package a block.** Two packages that start from the same root can't
  both land: the second's root is stale by the time accumulate sees it. So one builder
  orders every package that touches a tree, which is Aztec's sequencer by another name,
  and to pass 20 transfers a package it folds the users' proofs into one, which is Aztec's
  prover. JAM relocates those roles to the builder; it doesn't remove them.

With a folded proof and one package a block, the 48 KB result is the limit: a note
commitment and a nullifier are 32 bytes each and a transfer makes two of each, so about
380 transfers a package, about 60 a second for one tree. More trees need more cores and a
builder each. Don't set that beside Aztec's one transaction a second and call JAM faster:
Aztec's rate isn't a proof-checking limit (its committee checks one in milliseconds too)
but the epoch proof, Ethereum's blobs, and an alpha throttled on purpose.

### What a private service on JAM would need

- **A verifier as PVM code.** CHONK's verifier compiled to the PVM, with its gas measured.
  The one measured point so far is Groth16's.
- **Private state in service storage.** The note tree's root and the nullifier set,
  written by accumulate inside its 10 million gas; the tree rebuilt in refine from a
  witness.
- **A builder that orders.** One package a block for each tree, the users' proofs folded
  into one: Aztec's sequencer and prover, outside the protocol and unstaked unless the
  service stakes them itself.
- **A client.** Something like Aztec's PXE: proves on the user's device, hands the result
  to the builder.
- **Data.** JAM's own availability for the package; the tree witness comes in as imported
  segments ([lesson 3.1](./03-work-and-reports/01-a-work-package.md)).
- **Payment.** Coretime for the service, fees inside it.
- **Who holds the keys.** The service's code is upgraded by whoever accumulate lets
  ([lesson 17.10](./17-accumulation/10-upgrading-a-service.md)). After July 2026, answer
  that first.

## Conclusions

**Yes to the function, no to the economics, and no faster.**

- Aztec's private transfers fit JAM as one service among many: the user proves, refine
  checks, accumulate writes the root and the nullifiers. No protocol change, nothing
  borrowed from Ethereum.
- JAM can't copy Aztec's cheap validator. Aztec secures a block with 48 light machines
  drawn from thousands; JAM secures every package by 1,023 strong validators re-running it.
  That costs more per validator and buys a stronger check: a proving-system bug is one
  service's bug, not every block's.
- The service brings its sequencer with it. One package a block per tree, proofs folded by
  the builder: Aztec's two heavy roles, unstaked, beside the protocol. About 60 transfers a
  second for a tree, by arithmetic nobody has run yet.

For an Aztec fan, in three sentences: JAM could run your private transfers as a service
today, checked by every validator rather than by 48. It wouldn't be cheaper to validate or
faster to transact. What it would give you is a check that doesn't depend on the proving
system being bug-free.

## Check your understanding

::: check
**Why can an Aztec sequencer run on 8 GB when the Gray Paper assumes 64 GB for a JAM validator?**

- [ ] Aztec's blocks are smaller
  > No: the block isn't the cost. A sequencer never runs the expensive work; users and
  > provers do, and the committee checks proofs, which takes milliseconds.
- [x] A sequencer checks proofs; a JAM validator re-runs about ten reports a slot
  > Yes: the Gray Paper gives audits 10 of a validator's 16 CPU cores, each audit a core's
  > worth of work. Aztec moved that work to users and unstaked provers.
- [ ] Aztec has more validators, so each does less
  > No: the thousands who aren't on the committee just wait. The committee's job is light
  > because it checks proofs instead of running the work again.

**Two packages in one block each carry private transfers against the same note tree. What happens?**

- [ ] Both land, and accumulate merges the two new roots
  > No: each refine proved its new root from the old one. Roots don't merge.
- [x] The first lands; the second's old root is stale, so it's refused
  > Yes: only accumulate sees the state, and by then the first package has moved the
  > root. So one builder orders a tree's packages, Aztec's sequencer by another name.
- [ ] Neither lands: refine rejects both
  > No: refine ran both without complaint. It never sees the state, so it can't see the
  > clash.

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
  The validator count moves daily, and V6 will change some parameters.
- JAM's hardware figures are the Gray Paper's own model (§20), which the paper calls
  "a provisional and crude estimation". No 1,023-validator network has run yet.
- The gas figure for a proof check is one measurement, on one client, of one proof system.
- The transfer rate is arithmetic on the 48 KB result and one package a block for a tree.
  The tree's depth, the cost of folding proofs and accumulate's real cost per note are
  unmeasured.

## Sources

- Aztec: [operator guide](https://docs.aztec.network/operate/operators),
  [running a sequencer](https://docs.aztec.network/operate/operators/setup/sequencer_management),
  [running a prover](https://docs.aztec.network/the_aztec_network/guides/run_nodes/how_to_run_prover),
  [slashing and offences](https://docs.aztec.network/operate/operators/sequencer-management/slashing_and_offenses),
  [Alpha network security](https://aztec.network/blog/alpha-network-security-what-to-expect),
  [Alpha V5 proving system vulnerability](https://aztec.network/blog/alpha-v5-proving-system-vulnerability),
  [the end of Aztec Connect](https://medium.com/aztec-protocol/sunsetting-aztec-connect-a786edce5cae),
  and [L2BEAT's page](https://l2beat.com/scaling/projects/aztecnetwork).
- Polkadot: [validator requirements](https://docs.polkadot.com/node-infrastructure/run-a-validator/requirements/).
- JAM: the [Gray Paper](https://graypaper.com/), §14, §17, §19 and §20, and
  [ELVES](https://eprint.iacr.org/2024/961).

Back to [the start](./index.md).
