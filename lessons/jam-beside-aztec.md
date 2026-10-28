# JAM beside Aztec

Optional, and no code: a comparison, not a lesson. [Aztec](https://aztec.network/) is a
privacy network on Ethereum where users prove their own transactions and the network only
checks the proofs. This page asks one question: could JAM run Aztec's private transfers as
a service? In October 2026 we built one to find out,
[aztec-on-jam](https://github.com/abutlabs/aztec-on-jam), and ran it on
six-validator test networks of lasair, of PolkaJam, and of both.

The answer, measured: **yes to the function, no to cheaper or faster.** A payment proved in
a browser tab is checked by refine for a sixth of a tiny package's gas and written by
accumulate for 1% of its budget. But one tree takes one package a slot, and Aztec's own
proofs cost more to check than a whole package can pay. The [conclusions](#conclusions)
put it in one place; [open challenges](#open-challenges) lists what isn't solved.

Numbers are as of October 2026 and will date.

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
- **Noir.** Aztec's language for writing what a zero-knowledge proof proves, with Rust's
  look and privacy as the default. *Example:* a transfer circuit of a few dozen lines.
- **PXE.** Aztec's private execution environment: the library on the user's device that
  holds keys and notes, runs private functions and proves them. *Example:* a wallet's PXE
  proving a payment in 2.5 seconds on a laptop.
- **Shield and unshield.** Moving value from a public account into a private one, and back
  out. *Example:* `zk.money`'s three buttons: shield, send, unshield.
- **Note.** A private coin: its owner's key, an amount and a random number, hashed
  together. The chain sees only the hash. *Example:* a note of 40 for B.
- **Nullifier.** A second hash of a note that only its owner can make, published when the
  note is spent, so it can't be spent twice. *Example:* a transfer spends two notes and
  publishes two nullifiers.
- **Sealed note.** A note's contents encrypted to its receiver and kept on chain, so the
  receiver finds it by trying their key on every one. *Example:* 88 bytes a note.
- **Kernel circuit.** Aztec's protocol circuits that wrap every private call, so the
  network sees note hashes and nullifiers, not which function ran. *Example:* a token
  transfer whose fee is sponsored is 6 circuits folded into one proof.

All fifteen are in the [glossary](./glossary.md), with JAM's own words: validator, core,
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

<a id="could-jam-run-aztec-as-a-service"></a>
<a id="zk-money-on-jam-a-shielded-account-as-a-service"></a>

## What we built: one payment, five steps

`zk.money`'s three moves, shield, send and unshield, as two JAM services: a public token
service and a privacy service. Here is A paying B 40 in private, with the numbers we
measured.

1. **A proves, in a browser tab.** A Noir circuit says: the two *notes* A spends are in the
   note tree, their *nullifiers* are not yet in the nullifier tree, the two new notes add
   up to the same amount, and here are the trees' new roots. Barretenberg, Aztec's prover,
   turns that into an 8,768-byte proof in 1.0 s on a laptop's browser.
2. **A builder submits it.** One work-package, one item: the public inputs, the proof and
   the two *sealed notes*.

   ```text
   c0 01            the public inputs' length, 448, as a u16: 2 bytes
   (448 bytes)      14 public inputs of 32 bytes: roots, nullifiers, ...
   40 22            the proof's length, 8,768, as a u16: 2 bytes
   (8,768 bytes)    the proof
   (176 bytes)      two sealed notes, 88 bytes each
                    2 + 448 + 2 + 8,768 + 176 = 9,396 bytes
   ```

   Our builder is a small relay. The Gray Paper says nothing about who builds a package
   (§14), so anyone may.
3. **Refine checks the proof.** A Rust verifier compiled into the service's code checks it:
   169,112,761 gas, 0.2 s on PolkaJam and under a second on lasair. Refine reads no state,
   so it can't know whether the proof's starting roots are the chain's. It passes them on.
4. **Accumulate checks the roots and writes.** If the proof started from the roots the
   service holds, accumulate writes the new roots, the two nullifiers, the two new notes'
   hashes and their sealed notes: 103,089 gas, 1% of a report's 10 million. A proof whose
   roots are stale, or a replay of one already written, changes nothing.
5. **B scans.** B's wallet tries its key on every sealed note on chain. The one that opens,
   and hashes to a note in the tree, is B's. Nobody told B; nobody else can tell.

Value crosses between the services by deferred transfers
([lesson 17.3](./17-accumulation/03-sending-a-transfer.md)). To shield, the token service
debits A and sends the amount to the privacy service with the new note's hash in the
transfer's 128-byte memo; A's next proof claims it. To unshield, a proof names a public
account and accumulate sends the amount back, the account in the memo. Deposits and
withdrawals are public, as `zk.money`'s were.

<a id="what-a-private-service-on-jam-would-need"></a>

## What we chose, and why

| Question | Our answer | Why | Its price |
| --- | --- | --- | --- |
| Whose circuit? | Our own Noir transfer, built to Aztec's shapes: notes, nullifiers, a sorted nullifier tree, both trees 40 deep | Aztec's own *kernel circuit* proofs cost more to check than a package holds ([below](#open-challenges)) | Aztec's contracts and its PXE don't run on it |
| Which proof system? | UltraHonk, Aztec's own, checked by zkVerify's open-source Rust verifier | It compiles to the PVM unchanged, and Noir proves to it by default | We pin a change to it not yet accepted upstream, for the prover version we use |
| Who updates the trees? | The proof: the circuit computes both trees' new roots | Accumulate only compares and stores, so it never hashes a tree | Every prover needs the trees' current paths, which grow with the chain |
| Where do notes live? | In the service's storage, sealed to the receiver and bound into the proof by a hash | A receiver finds a payment from the chain alone | Each wallet tries every note; storage costs by the byte |
| Who orders a tree's packages? | The builder sends the next only once the last is reported | A core holds one report at a time, so report order is write order | One transfer a slot for a tree |
| Who holds the keys? | The wallet page: its secret stays in the browser, which proves every move | Self-custody, as Aztec's PXE | A browser page is a weak place to keep a key |
| One service or many? | One privacy service; an app would be another circuit inside it | Privacy is the size of the crowd: a second tree is a second, smaller crowd | Every app waits on the same tree |

<a id="building-on-it-noir-the-pxe-and-jam-s-tooling"></a>

## What it does, measured

Each number with what bounds it, so it isn't set beside a number that measures something
else.

| What | Measured | Bounded by |
| --- | --- | --- |
| Checking one proof in refine | 169,112,761 gas: 5 fit a tiny package, 29 a full one | Refine's budget: 1 billion gas on tiny, 5 billion on full |
| Writing one transfer in accumulate | 103,089 gas: about 97 fit a report | Accumulate's 10 million gas a report |
| Proving one transfer | 1.0 s in a laptop's browser | The user's device |
| A transfer, submitted to written | 13.4 s median on PolkaJam; 21.2 s on lasair | Guarantee, availability and accumulation: about two slots |
| One tree's pace | One a slot on PolkaJam, 600 of 600 in an hour; about 0.38 of a slot on lasair | One report a core at a time, and each proof starting from the last one's roots |
| Clients | The same service code on six lasair, six PolkaJam, or three of each | Both must meter gas the same, to the unit |

Pick a proof to see what refine can pay for. The first three are measured on the PVM; the
last is an estimate, from timing Aztec's own verifier beside ours.

<RefineBudget />

Two of the rows are the same kind of proof built two ways. The PVM charges for every
instruction, so a build tuned for small code costs more gas than one tuned for speed.
Groth16's 246,884,255 is from a build tuned for size, so set it beside UltraHonk's
286,136,021 from the same tuning: about 1.2 times, not the several times this page guessed
before the build. Tuned for speed, our transfer proof costs 169,112,761.

## What the build corrected

This page guessed before the service existed. Four guesses were wrong.

| The guess | What the build found |
| --- | --- |
| An UltraHonk check costs several times a Groth16 one, so the builder must fold proofs | About 1.2 times, like for like. 29 of ours fit a full package unfolded |
| Accumulate can't afford the tree: insert in refine, from a witness | Neither does: the proof computes the new roots, and accumulate pays 103,089 gas a transfer |
| About 60 transfers a second for a tree | One transfer a slot for a tree, a sixth of one a second. The 60 needs a builder folding many users' proofs into one, which nobody has built |
| Aztec's kernel circuits run unchanged on a JAM service | They compile, but their proof costs about 12 billion gas to check, 2.4 full packages |

<a id="porting-aztec-s-stack"></a>

## Open challenges

- **One tree, one transfer a slot.** Each proof starts from the roots the last one left,
  so two users can't share a package: the second's proof would start from roots that
  aren't on chain yet. To pass more, a builder folds many users' proofs into one, which is
  Aztec's prover, or the service runs more trees, which means more cores and smaller
  crowds. We built neither.
- **Aztec's own kernels.** We measured them with Aztec's own tools: they compile from
  Aztec's source with Noir, and prove in 2.2 to 8.2 s into 80 or 128 KB. But checking one costs
  70 to 79 times ours on a CPU, about 12 billion gas by that ratio, so refine can't. A port
  needs a builder that checks each kernel proof inside a circuit and hands refine one it
  can afford (Aztec's prover again), Aztec's four trees in accumulate, and the PXE pointed
  at JAM. That is our next plan, not something built.
- **A prover's work grows with the chain.** To prove, a wallet needs the current path to
  its notes in both trees, and ours rebuilds the trees from every note and nullifier on
  chain. Our first version rebuilt them so badly that an hour of one payment a slot fell
  to a quarter of its pace before we found it. Rebuilt well, the cost still grows with the
  chain: a year-old chain needs what Aztec's node gives its PXE, a server that hands out
  paths. Finding notes grows the same way: our wallet tries every sealed note, where Aztec
  tags them.
- **Every client must meter gas the same, to the unit.** A net of three lasair and three
  PolkaJam validators forked because one PolkaJam build and lasair charged one accumulate
  2 gas apart, over one instruction's rule. The state differed by one byte, and the validators
  disagreed on the chain. PolkaJam's v0.8.0 release agrees with lasair, and the mixed net
  now runs the whole demo.
- **lasair's guarantors are slow to take the next package.** One cause, guarantors taking
  packages for a core they were about to leave, is fixed: over two pairs of 20-minute runs,
  packages that expired and had to be sent again fell from 14 and 9 to 5 and 7. The other,
  waiting for a free core across a rotation, holds a tree to about 0.38 of a slot and is
  open.
- **Who holds the keys.** The service's code is upgraded by whoever accumulate lets
  ([lesson 17.10](./17-accumulation/10-upgrading-a-service.md)). After July 2026, answer
  that first.

## Conclusions

**Yes to the function, no to the economics, and no faster. Native, though, and built with
Aztec's own tools.**

- Aztec's private transfers run on JAM as a service, and we ran one: the user proves,
  refine checks, accumulate compares roots and writes. No protocol change, nothing
  borrowed from Ethereum.
- JAM can't copy Aztec's cheap validator. Aztec secures a block with 48 light machines
  drawn from thousands; JAM secures every package by 1,023 strong validators re-running it.
  That costs more per validator and buys a stronger check: a proving-system bug is one
  service's bug, not every block's.
- The service brings its sequencer with it: one builder orders a tree's packages, one a
  slot. Faster needs folding, Aztec's prover, beside the protocol.
- Noir and Barretenberg carry over as they are. Aztec's kernels compile, but their proofs
  are too dear for refine, so Aztec.nr contracts and the PXE wait on that builder.

For an Aztec fan, in four sentences: we ran private transfers on JAM as a service, checked
by every validator rather than by 48. They're not cheaper to validate or faster to send:
one transfer a slot for a tree, until a builder folds proofs. Your Noir circuits run
unchanged; your Aztec.nr contracts and PXE don't yet, because Aztec's kernel proofs cost
2.4 packages to check. What it gives you is a native privacy pool whose check doesn't
depend on the proving system being bug-free.

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

**Two packages in one block each carry a private transfer against the same note tree. What happens?**

- [ ] Both land, and accumulate merges the two new roots
  > No: each proof computed its new root from the old one. Roots don't merge.
- [ ] Neither lands: refine rejects both
  > No: refine checks each proof and passes. It never sees the state, so it can't see the
  > clash.
- [x] The first lands; the second started from a stale root, so it changes nothing
  > Yes: only accumulate sees the state, and by then the first has moved the root. So one
  > builder orders a tree's packages, Aztec's sequencer by another name.

**Why does the service use its own circuit instead of Aztec's kernel circuits?**

- [x] Checking a kernel proof would cost about 12 billion gas, more than a full package
  > Yes: the kernels compile with Noir, but their proof costs 70 to 79 times ours to
  > check. Refine has 5 billion gas on a full package.
- [ ] Aztec's kernels aren't written in Noir
  > No: they are Noir, and they compile from Aztec's source. The cost is in checking
  > their proof, not in building it.
- [ ] The PVM can't run a proof verifier
  > No: refine runs one for every payment, 169,112,761 gas for ours. It's the size of
  > the kernels' proof that doesn't fit.

**Accumulate gets 10 million gas, and a tree 40 deep needs 40 hashes for every new note. How does it afford the tree?**

- [ ] It hashes them: 40 hashes fit easily in 10 million gas
  > No: the circuit's hash has never been measured on the PVM, and a report of many
  > transfers multiplies it. The service avoids the question by never hashing on chain.
- [x] It never hashes the tree: the proof computes the new roots, and accumulate checks the old ones
  > Yes: the circuit proves both insertions, refine checks the proof, and accumulate
  > compares the starting roots with its own and stores the new ones, 103,089 gas a
  > transfer.
- [ ] Refine updates the tree and passes the result on
  > No: refine reads no state, so it can't know the tree. It checks the proof and passes
  > the roots the proof claims.
:::

## Where this could be wrong

- Aztec's numbers are an alpha network's, read from its docs and L2BEAT in October 2026.
  The validator count moves daily, and V6 will change some parameters.
- JAM's hardware figures are the Gray Paper's own model (§20), which the paper calls
  "a provisional and crude estimation". No 1,023-validator network has run yet.
- Our measurements are of six-validator tiny networks on one laptop, two clients, one
  circuit. A full network's timing is untested.
- The 12 billion gas for Aztec's proof is an estimate: our verifier and Aztec's do
  different maths, and the PVM may price them differently. Nobody has compiled Aztec's
  verifier to the PVM.
- The service is a demo: test money anyone can mint, deposits public until claimed, and a
  circuit of ours rather than Aztec's.

## Sources

- Our service: [aztec-on-jam](https://github.com/abutlabs/aztec-on-jam)
  (start with its [ten-minute tour](https://github.com/abutlabs/aztec-on-jam/blob/main/docs/DEMO.md);
  every step and number with the command behind it in its
  [ledger](https://github.com/abutlabs/aztec-on-jam/blob/main/docs/LEDGER.md); Aztec's kernels
  measured in [spikes/chonk](https://github.com/abutlabs/aztec-on-jam/blob/main/spikes/chonk/RESULTS.md)),
  and the wallet page on the `jam` branch of
  [demo-wallet](https://github.com/abutlabs/demo-wallet/tree/jam/jam).
- Aztec: [operator guide](https://docs.aztec.network/operate/operators),
  [running a sequencer](https://docs.aztec.network/operate/operators/setup/sequencer_management),
  [running a prover](https://docs.aztec.network/the_aztec_network/guides/run_nodes/how_to_run_prover),
  [slashing and offences](https://docs.aztec.network/operate/operators/sequencer-management/slashing_and_offenses),
  [Alpha network security](https://aztec.network/blog/alpha-network-security-what-to-expect),
  [Alpha V5 proving system vulnerability](https://aztec.network/blog/alpha-v5-proving-system-vulnerability),
  [the end of Aztec Connect](https://medium.com/aztec-protocol/sunsetting-aztec-connect-a786edce5cae),
  [launching Aztec 2.0 and zk.money](https://aztec.network/blog/launching-aztec-2-0-rollup),
  [zk.money's return](https://decrypt.co/379621/ethereum-privacy-aztec-brings-back-zk-money),
  and [L2BEAT's page](https://l2beat.com/scaling/projects/aztecnetwork).
- Aztec's tools: [the PXE](https://docs.aztec.network/developers/docs/concepts/pxe),
  [Noir](https://aztec.network/noir), [aztec-packages](https://github.com/AztecProtocol/aztec-packages)
  (Barretenberg, the kernel circuits) and the
  [private kernel](https://docs.aztec.network/developers/docs/foundational-topics/advanced/circuits/private_kernel).
- The verifier: [zkVerify's UltraHonk verifier](https://github.com/zkVerify/ultrahonk_verifier).
- JAM's tools: [jam-pvm-common](https://docs.rs/jam-pvm-common/latest/jam_pvm_common/),
  [PolkaJam releases](https://github.com/paritytech/polkajam-releases) and
  [zk-jam-service](https://github.com/abutlabs/zk-jam-service) (the Groth16 measurement).
- Polkadot: [validator requirements](https://docs.polkadot.com/node-infrastructure/run-a-validator/requirements/).
- JAM: the [Gray Paper](https://graypaper.com/), §14, §17, §19 and §20, and
  [ELVES](https://eprint.iacr.org/2024/961).

Back to [the start](./index.md).
