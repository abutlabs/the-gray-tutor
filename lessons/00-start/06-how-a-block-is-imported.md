# How a block is imported

[Lesson 0.5](./05-understanding-the-vectors.md) showed the nine small functions that the
vectors test one at a time. A real block uses all of them, and more: before any of them
runs, the block has to arrive, be decoded, find the state it builds on and pass its
header's checks; after them, the new state is hashed into a root and sent back. That whole
journey is a *block import*, and it is what Milestone 1 asks a client to do. By the end of
this lesson you can walk one block through it, station by station, and say where in our
client each station lives. Nothing here is code to type. It is the map the parts you build
next fill in.

## New words

- **Wave.** A group of block-import steps that need only the block, the old state, or
  results from earlier waves, so they could run side by side. *Example:* wave 1 is
  everything made from the block and the old state alone.
- **Slack.** How many waves a step could wait without making anything late. *Example:*
  the guarantees' step finishes in wave 3, but nothing needs it, so it has 1 wave of slack.

## The whole import

Think of a bank posting a day's batch of payments. The batch says which day it follows
and quotes that day's closing balance. The clerk checks it belongs on top of yesterday,
checks every payment in it, posts them all or none, and prints the new closing balance,
which tomorrow's batch must quote. A block import is the same: the block names its parent
and quotes the parent's state root, every part of it is checked, its changes are all made
or none are, and out comes a new state root that the next block quotes.

In our client a block makes eight stops. Pick a block below and press *next*: the real
one goes all the way to its StateRoot, and a wrong one stops at the station that refuses
it.

<ImportLine />

| | station | what happens | refuses the block with | in our client |
| --- | --- | --- | --- | --- |
| 1 | bytes arrive | the fuzzer sends ImportBlock: one block, as bytes ([20.1](../20-facing-the-fuzzer/01-speaking-the-protocol.md)) | — | `src/fuzz.ts`, `MessageCodec` |
| 2 | decode the block | the bytes become a header and the extrinsic's five lists (Appendix C) | — | `src/block.ts`, `Block` |
| 3 | find the state before | the header's parent hash picks the state the parent's import left ([20.2](../20-facing-the-fuzzer/02-a-target.md)) | the parent block is unknown | `src/target.ts`, `answer` |
| 4 | check the header | parent, prior state root, slot and extrinsic hash, against that state (§5) | `bad_parent`, `bad_parent_state_root`, `bad_slot`, `bad_extrinsic_hash` | `src/import.ts`, `checkHeader` |
| 5 | run Υ | disputes, Safrole, assurances, guarantees, accumulation, then the rest of the new state; each step checks its own part of the block ([19.4](../19-block-import/04-importing-a-block.md)) | each step's own, such as `bad_vote_split`, `bad_seal`, `core_engaged` | `src/import.ts`, `importBlock` |
| 6 | all or nothing | no refusal: the new state stands. Any refusal: the answer is an Error, and the state before stays | — | `src/target.ts`, `answer` |
| 7 | hash the new state into its root | every key and value hashed into one 32-byte root (Appendix D, [6.1](../06-state-and-merklization/01-the-state-trie.md)) | — | `src/trie.ts`, `stateRoot` |
| 8 | keep it and answer | the new state kept under this block's header hash, and its root sent back in StateRoot | — | `src/target.ts`, `answer` |

Four things to say about it out loud:

- **Most of the checking is in two places.** Station 4 checks the header against the
  state before, and station 5's steps each check their own part of the block. Everything
  else either reads bytes or writes results.
- **A refusal changes nothing.** The state before is still kept, so a different block
  can still name it as a parent. That is how a fork is handled: two children of one
  parent, each imported onto the same state before.
- **The import never refines.** The heavy work, refine, ran earlier on a core: two or
  three guarantors ran it and signed the report, and the validators' assurances say its
  data is available. Station 5 runs only *accumulate*, the light stage, which folds a
  report's results into its service's state. The budgets show the difference: refine may
  spend 5,000,000,000 gas on one work-package, accumulate 10,000,000 on one report and
  3,500,000,000 on a whole block, on full ([17.9](../17-accumulation/09-the-blocks-gas-budget.md)).
  Re-running refine to check a report is auditing, done off the chain, not by the import.
- **The root closes the loop.** The safrole trace's first block quotes a prior state root
  of `0xd6e78dc0…`, its import makes `0x48dc323d…`, and the trace's second block quotes
  `0x48dc323d…` as its own prior state root. The answer to one block is the check on the
  next.

<details>
<summary>The same stations in lasair</summary>

lasair imports the same block through the same stations, and its files follow our
client's: `conformance/import.ml`'s `import_block` is our `importBlock`, and it calls one
module per Gray Paper chapter, named as our `src/` files are: `disputes.ml`, `safrole.ml`,
`assurances.ml`, `guarantors.ml`, `accumulate.ml`, `history.ml` and the rest. Its fuzzer
target is `bin/conformance_target.ml`.

| station | lasair |
| --- | --- |
| 1, 2 bytes arrive, decode | `handle_import`, `Block_codec.decode_block` |
| 3 find the state before | `find_parent` |
| 4 check the header | `Validate.validate_block_guarantees`, its first checks |
| 5 run Υ | `Disputes.process_disputes`; the rest of `Validate.validate_block_guarantees` (seal, marks, assurances, guarantees); then `Time.update_timeslot`, `Safrole.update_entropy`, `Safrole.update_safrole_epoch`, `Safrole.process_tickets`, `Reports.process_guarantees` (assurances, accumulation, new reports), `Authorization.update_auth_pools`, `Preimages.process_preimage_extrinsic`, the `Statistics` updates and `History.update_history` |
| 6 all or nothing | `import_block` returns `Error` before it writes anything |
| 7 the new state's root | `State_db.root` |
| 8 keep it and answer | `store`, `record_header`, `msg_state_root` |

The one real difference is when the checks run. Our client checks each step's part as
that step runs. lasair checks the whole block first, in `validate.ml`, and only then makes
the new state. Both orders are allowed, since neither keeps anything from a block it
refuses.

</details>

**What an importer leaves out.** Making blocks, talking to other nodes, auditing reports
off the chain, and choosing which chain is best and final are all a validator's work
beside importing. Milestone 1 is the import alone: blocks in, state roots out, every
wrong block refused.

The last of those, choosing a chain, is why a refusal must leave the state before intact.
Two valid blocks can name the same parent, a fork, and an importer imports both. §4.3
says how JAM keeps forks rare and settles them, and §4.5 which block a node treats as the
latest:

::: gray-paper 4.3

#### §4.3 Which History? {#gp-4-3}

<a id="gp-4-3-p1"></a>A blockchain is a sequence of blocks, each cryptographically referencing some prior block by including a hash of its header, all the way back to some first block which references the <abbr class="gp-term" title="the chain's first block and state">genesis</abbr> header. We already presume consensus over this genesis header $\mathbf{H}^0$ and the state it represents already defined as $\sigma^0$.

<a id="gp-4-3-p2"></a>By defining a deterministic function for deriving a single <abbr class="gp-term" title="after the change: the value once it is made, written with a prime (α′); for state, after the block">posterior</abbr> state for any (valid) combination of prior state and block, we are able to define a unique *canonical* state for any given block. We generally call the block with the most ancestors the *head* and its state the *head state*.

<a id="gp-4-3-p3"></a>It is generally possible for two blocks to be valid and yet reference the same prior block in what is known as a *fork*. This implies the possibility of two different heads, each with their own state. While we know of no way to strictly preclude this possibility, for the system to be useful we must nonetheless attempt to minimize it. We therefore strive to ensure that:

<a id="gp-4-3-p4"></a>

1. It be generally unlikely for two heads to form.
1. When two heads do form they be quickly resolved into a single head.
1. It be possible to identify a block not much older than the head which we can be extremely confident will form part of the blockchain's history in perpetuity. When a block becomes identified as such we call it *<abbr class="gp-term" title="voted final by GRANDPA: never undone">finalized</abbr>* and this property naturally extends to all of its ancestor blocks.

<a id="gp-4-3-p5"></a>These goals are achieved through a combination of two consensus mechanisms: *Safrole*, which governs the (not-necessarily forkless) extension of the blockchain; and *Grandpa*, which governs the finalization of some extension into canonical history. Thus, the former delivers point [1](#gp-4-3-p4), the latter delivers point [3](#gp-4-3-p4) and both are important for delivering point [2](#gp-4-3-p4). We describe these portions of the protocol in detail in sections [6](../08-safrole/index.md#gp-6-p1) and [19](../what-runs-where.md#gp-19-p1) respectively.

<a id="gp-4-3-p6"></a>While Safrole limits <abbr class="gp-term" title="two blocks built on the same parent, splitting the chain until one side is dropped">forks</abbr> to a large extent (through cryptography, economics and common-time, below), there may be times when we wish to intentionally fork since we have come to know that a particular chain extension must be reverted. In regular operation this should never happen, however we cannot discount the possibility of malicious or malfunctioning nodes. We therefore define such an extension as any which contains a block in which data is reported which *any other* block's state has tagged as invalid (see section [10](../10-disputes/index.md#gp-10-p1) on how this is done). We further require that Grandpa not finalize any extension which contains such a block. See section [19](../what-runs-where.md#gp-19-p1) for more information here.

:::

::: gray-paper 4.5

#### §4.5 Best block {#gp-4-5}

<a id="gp-4-5-p1"></a>Given the recognition of a number of valid blocks, it is necessary to determine which should be treated as the “best” block, by which we mean the most recent block we believe will ultimately be within of all future JAM chains. The simplest and least risky means of doing this would be to inspect the Grandpa <abbr class="gp-term" title="the point after which a block can't be undone">finality</abbr> mechanism which is able to provide a block for which there is a very high degree of confidence it will remain an ancestor to any future chain head.

<a id="gp-4-5-p2"></a>However, in reducing the risk of the resulting block ultimately not being within the canonical chain, Grandpa will typically return a block some small period older than the most recently authored block. (Existing deployments suggest around 1-2 blocks in the past under regular operation.) There are often circumstances when we may wish to have less latency at the risk of the returned block not ultimately forming a part of the future canonical chain. E.g. we may be in a position of being able to author a block, and we need to decide what its parent should be. Alternatively, we may care to speculate about the most recent state for the purpose of providing information to a downstream application reliant on the state of JAM.

<a id="gp-4-5-p3"></a>In these cases, we define the best block as the head of the best chain, itself defined in section [19](../what-runs-where.md#gp-19-p1).

:::

In plain words: Safrole, which decides who may make each slot's block, keeps two blocks
for one slot rare. GRANDPA, a vote among the validators, makes a block final: from then
on it is in the chain's history for good, and so is everything before it. One fork is on
purpose: a chain holding a report that a dispute has since found bad is abandoned, and
GRANDPA won't finalize it ([Part 10](../10-disputes/index.md)). The best block is the
newest one a node would build on, usually a block or two past the final one.
Your client does none of this choosing: it imports whatever block it is given, onto
whichever parent the block names, and whoever sends the blocks does the choosing: in
[Part 20](../20-facing-the-fuzzer/index.md), the fuzzer. The rules for the best chain are §19,
which [What runs where](../what-runs-where.md#off-the-chain-in-the-gray-paper) quotes.

## Inside station 5: what waits for what

Station 5 is the *state transition function* ([lesson 0.1](./01-what-you-will-build.md)):
a state and a block go in, and out comes the state after the block, or a refusal. In the
Gray Paper it is the Greek capital Υ. Stations 4 and 5 are the Gray Paper's rules, a valid
header and Υ; stations 1 to 3 and 6 to 8 are what a client does around them.

```text
 the state before ─┐
                   ├──►  Υ  ──►  the state after   (or: refused, and the state stays as it was)
 the block ────────┘
```

Inside Υ there is no single rule. There are sixteen small steps, each making one new piece of
state (or, in accumulation's case, eight at once) from some inputs. The vectors of [lesson 0.5](./05-understanding-the-vectors.md)
test those steps one family at a time. What the vectors can't show is how the steps fit
together, and that is the Gray Paper's own question.

## What the Gray Paper says

§4.2 names the pieces of state, seventeen of them, each a Greek letter, and says what each
is for. Then §4.2.1 opens the list of what every new piece is made from, with its reason
for writing it that way:

::: gray-paper 4.2

#### §4.2 The State {#gp-4-2}

<a id="gp-4-2-p1"></a>Our state may be logically partitioned into several largely independent segments which can both help avoid visual clutter within our protocol description and provide formality over elements of computation which may be simultaneously calculated (i.e. parallelized). We therefore pronounce an equivalence between $\sigma$ (some complete state) and a tuple of partitioned segments of that state:

<a id="gp-4-2-p2"></a><a id="eq-4-4"></a>

$$
\begin{align}
\sigma &\equiv \left(\alpha, \beta, \theta, \gamma, \delta, \eta, \iota, \kappa, \lambda, \rho, \tau, \phi, \chi, \psi, \pi, \omega, \xi\right) \tag{4.4}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-thestate" class="gk-wrap">[$\sigma$](../symbols.md#state)</span> | sigma | the state: everything the chain remembers between blocks |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-authpool" class="gk-wrap">$\alpha$</span> | alpha | the authorizer pools: for each core, up to O = 8 authorizer hashes it accepts right now |
| <span id="gk-recent" class="gk-wrap">$\beta$</span> | beta | recent blocks: the last few blocks' hashes and roots, and the belt of accumulation outputs |
| <span id="gk-lastaccout" class="gk-wrap">$\theta$</span> | theta | the last block's accumulation outputs: which service yielded which hash |
| <span id="gk-safrole" class="gk-wrap">$\gamma$</span> | gamma | Safrole's state: the ticket lottery for who seals the next epoch's blocks |
| <span id="gk-accounts" class="gk-wrap">$\delta$</span> | delta | the service accounts: every service's code hash, balance, storage and preimages |
| <span id="gk-entropy" class="gk-wrap">$\eta$</span> | eta | entropy: four 32-byte values of randomness, the newest mixing in every block |
| <span id="gk-stagingset" class="gk-wrap">$\iota$</span> | iota | the next validators: keys queued to become active at the next epoch |
| <span id="gk-activeset" class="gk-wrap">$\kappa$</span> | kappa | the current validators: the keys of the V validators active this epoch |
| <span id="gk-previousset" class="gk-wrap">$\lambda$</span> | lambda | the last epoch's validators: kept to check what they signed before the change |
| <span id="gk-availassignments" class="gk-wrap">$\rho$</span> | rho | the pending reports: for each core, the report waiting to be made available, and when it came |
| <span id="gk-thetime" class="gk-wrap">$\tau$</span> | tau | the time: the latest block's timeslot |
| <span id="gk-authqueue" class="gk-wrap">$\phi$</span> | phi | the authorizer queues: for each core, Q = 80 authorizer hashes waiting to join its pool |
| <span id="gk-privileges" class="gk-wrap">$\chi$</span> | chi | the privileged services: who may manage, assign cores, set validators and accumulate for free |
| <span id="gk-disputes" class="gk-wrap">$\psi$</span> | psi | past judgments: the reports found good, bad or wonky, and the validators who lied |
| <span id="gk-activity" class="gk-wrap">$\pi$</span> | pi | the statistics: tallies per validator, per core and per service |
| <span id="gk-ready" class="gk-wrap">$\omega$</span> | omega | the ready queue: available reports waiting on others before they can accumulate |
| <span id="gk-accumulated" class="gk-wrap">$\xi$</span> | xi | the accumulated history: the packages accumulated in each of the last E slots |

</details>

→ [(4.4) in plain words](../06-state-and-merklization/gray-paper.md#ex-4-4)

<a id="gp-4-2-p3"></a>In summary, $\delta$ is the portion of state dealing with *services*, analogous in JAM to the Yellow Paper's (smart contract) *accounts*, the only state of the *YP*'s Ethereum. The identities of services which hold some privileged status are tracked in $\chi$.

<a id="gp-4-2-p4"></a>Validators, who are the set of economic actors uniquely privileged to help build and maintain the JAM chain, are identified within $\kappa$, archived in $\lambda$ and enqueued from $\iota$. All other state concerning the determination of these keys is held within $\gamma$. Note this is a departure from the *YP* proof-of-work definitions which were mostly stateless, and this set was not enumerated but rather limited to those with sufficient compute power to find a partial hash-collision in the SHA2-256 cryptographic hash function. An on-chain entropy pool is retained in $\eta$.

<a id="gp-4-2-p5"></a>Our state also tracks two aspects of each core: $\alpha$, the authorization requirement which work done on that core must satisfy at the time of being reported on-chain, together with the queue which fills this, $\phi$; and $\rho$, each of the cores' currently assigned *work-report guarantees*, the availability of whose *work-package* must yet be assured by a <abbr class="gp-term" title="more than two thirds of the validators">super-majority</abbr> of validators.

<a id="gp-4-2-p6"></a>Finally, details of the most recent blocks and timeslot index are tracked in $\beta_H$ and $\tau$ respectively, work-reports which are ready to be accumulated and work-packages which were recently accumulated are tracked in $\omega$ and $\xi$ respectively and, judgments are tracked in $\psi$ and validator statistics are tracked in $\pi$.

:::

::: gray-paper 4.2.1 1-1

#### §4.2.1 State Transition Dependency Graph {#gp-4-2-1}

<a id="gp-4-2-1-p1"></a>Much as in the *YP*, we specify $\Upsilon$ as the implication of formulating all items of posterior state in terms of the prior state and block. To aid the architecting of implementations which parallelize this computation, we minimize the depth of the dependency graph where possible. The overall dependency graph is specified here:

:::

In plain words: the state is seventeen parts, and the paper keeps them as separate as it
can so that a client can work on several at once. For every new piece, the list says what
it is made from, and it is written so that as few steps as possible wait for other steps.
The list itself, sixteen lines, is [lesson 19.1](../19-block-import/01-the-order-of-things.md)'s.

That gives an order without anyone choosing one. Steps that need only the block and the
old state go in wave 1. A step whose inputs come from wave 1 goes in wave 2, and so on. Steps
in one wave don't need each other, so they could run side by side. (Lesson
[19.1](../19-block-import/01-the-order-of-things.md) builds the full map, symbols and all.)

## The timeline

The timeline below has one row for each of the 16 lines, under the family that tests it.
Press *next wave* and read it as a schedule. Tap any bar to see what it waits for and what
waits for it.

<ImportGantt />

What to notice:

- **Wave 1 has seven steps and nothing waits to start them.** The clock, the entropy, both
  validator sets, the record of recent blocks, the judgements and the cores after them can all
  begin the moment the block arrives.
- **Safrole is not one step.** It is four, and `γ′`, the lottery's new state, waits for the
  new entropy, the new validators and the disputes' judgements (a convicted validator must
  be kept out of the next set).
- **Accumulation is the pivot.** Four steps wait for it, and it waits for the assurances,
  which wait for the disputes. That chain, `ρ†` to `𝐑*` to accumulation to the last four,
  is what makes the import four waves deep. Its steps are marked ◆: any one of them
  running late makes the whole import late.
- **Some steps can wait.** The guarantees' step (`ρ′`) finishes in wave 3, but nothing in this block
  needs it, so it could run in wave 4 and nothing would be late. The dashed tail is that
  freedom, called *slack*.
- **The cores are a chain.** `ρ†`, `ρ‡` and `ρ′` are three stations that one core, a parking
  space for a single report, passes through in a block. The court comes first, so a guilty
  report can't be called available; the assurances come second, emptying the cores whose
  reports are done; the guarantees come last, because a new report needs a free core. Press
  *follow the cores* to light them, or tap any of the three to read why it sits where it does.
  ([Lesson 10.3](../10-disputes/03-clearing-the-cores.md) draws the same picture.)
- **The chart is the Gray Paper's; the code is ours.** The lines and waves come from §4.2
  alone: what each step is made from, nothing about how it is written. Tap a step to see our
  client's side, the function that makes it and the `npm run` that shows it, and press
  *as importBlock runs it* for the one order our `importBlock` picks. A client may pick
  another, as long as every step still comes after what it needs. The waves say which
  orders are allowed; they are not our code's schedule.
- **A bar's length is not time.** Every bar is one wave wide whatever it costs. Accumulation
  runs services' programs, and the clock copies one number from the header; the timeline
  says only what must come before what, never how long anything takes. Whether a client really runs
  steps side by side is its own choice.

## What the block gives and what the importer works out

The whole header arrives with the block, filled in by its author. So nothing in it is
"worked out by the importer". The question is what the importer *does* with each part, and
the timeline marks three answers:

- **Given (a circle).** The importer reads the value as an input. The header's slot becomes
  the new time, its entropy source feeds the new entropy, and its author index picks whose key
  to check. The block's five lists (tickets, disputes, preimages, assurances and guarantees)
  are read the same way by the steps that use them. All of these are there at the start.
- **Checked (a diamond).** The header states a value, and the importer works out the real one
  itself and refuses the block if they differ. Four checks run before any step: the parent's
  hash, the old state's root, that the slot is after the old time, and the extrinsic's hash. The
  offenders mark needs only the disputes, so it can be checked once they are judged. The epoch
  mark and the tickets mark need Safrole's step, and so does the seal, the author's signature
  on the header. The diamond sits under the step that settles it, and fills in when that
  step is done.
- **Made (a square).** The root of the new state needs every step, so it comes last. This block's
  header has no field for it. The *next* block's header carries it, as its prior state root,
  and that import checks it at its start.

So an import has three moments for the header. Before any step, the header is checked
against the old state and the block. Midway, Safrole's output settles the marks and the
seal. At the end, the new state has a root, ready for the next block to quote.

## Check your understanding

::: check
**A block is sealed by the wrong validator. Where is it refused, and what happens to the state?**

- [ ] At the header check, station 4, and the state before is thrown away
  > No: the seal needs Safrole's sealers, so it's checked in Υ, and a refusal never throws
  > a state away.
- [x] In Υ, at Safrole's step, with `bad_seal`; the state before stays, still a parent
  > Yes: the answer is an Error, and nothing the block did is kept.
- [ ] After the new state's root is made, when the fuzzer compares roots
  > No: the importer refuses it itself, before any root is made.

**The importer answers a block with StateRoot `0x48dc323d…`. Where does that value appear next?**

- [ ] In this block's own header, which is filled in afterwards
  > No: a block's header is signed by its author before anyone imports it. It can't hold
  > its own import's result.
- [x] In the next block's header, as its prior state root, checked at its station 4
  > Yes: the safrole trace's second block quotes exactly `0x48dc323d…`.
- [ ] Nowhere: the fuzzer only uses it to compare with the reference client
  > No: the fuzzer compares it, and the chain also quotes it. The next block's header
  > carries it.

**Which block-import steps could run side by side?**

- [ ] Any two steps on the Gray Paper's list
  > No: the list isn't a schedule. `γ′` comes before `η′` in it, though `γ′` is made from
  > `η′`.
- [x] Steps in the same wave: none of them needs another's result
  > Yes: a wave holds steps whose inputs are the block, the old state, or earlier waves.
- [ ] Steps tested by the same vector family
  > No: a family can span waves. Safrole's entropy is in wave 1 and its lottery in wave 2.

**The guarantees' step has 1 wave of slack. What does that mean?**

- [x] It could start one wave later and nothing in the block would be late
  > Yes: nothing in this block is made from its result, so it can fill any later wave.
- [ ] It takes one wave's time to run
  > No: a bar's length is never time. Slack is about waiting, not duration.
- [ ] A client may skip it when it is busy
  > No: every step runs. Slack only says when it may.

**Why is the new state's root the last value in the header's rows?**

- [ ] Hashing is slow, so it is saved for last
  > No: the order is about what the value is made from, not how long it takes.
- [ ] The header is always checked last
  > No: the header's first checks come before any step runs.
- [x] It is made from the whole new state, so every step must have finished
  > Yes: one more step could change a part of the state, and so change the root.

**A block's header lists an offenders mark that differs from what its disputes convict. What does the importer do?**

- [ ] Uses the header's list, since the author wrote it
  > No: the header is the author's claim, and the importer doesn't take its word on this.
- [x] Works out the list from the disputes itself and refuses the block
  > Yes: the offenders mark is a checked value. A mismatch is the refusal `bad_offenders_mark`.
- [ ] Ignores the mark and carries on
  > No: a header value the importer checks is never ignored. A wrong one refuses the block.
:::

## What you have

A whole block import, end to end: eight stations from bytes in to state root out, where
each one lives in our client, and what refuses a wrong block. And inside station 5, a
timeline: sixteen steps in four waves, the chain that sets its length, the steps that can
wait, and what the block gives against what its header must match. [Part 1](../01-bytes-and-numbers/index.md)
starts at the other end, with the bytes and numbers every vector is made of, so that by
[Part 20](../20-facing-the-fuzzer/index.md) every station is a function you wrote.

Next: [Part 1 · Bytes and numbers](../01-bytes-and-numbers/index.md)
