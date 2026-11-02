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

Three things to say about it out loud:

- **Most of the checking is in two places.** Station 4 checks the header against the
  state before, and station 5's steps each check their own part of the block. Everything
  else either reads bytes or writes results.
- **A refusal changes nothing.** The state before is still kept, so a different block
  can still name it as a parent. That is how a fork is handled: two children of one
  parent, each imported onto the same state before.
- **The root closes the loop.** The safrole trace's first block quotes a prior state root
  of `0xd6e78dc0…`, its import makes `0x48dc323d…`, and the trace's second block quotes
  `0x48dc323d…` as its own prior state root. The answer to one block is the check on the
  next.

<details>
<summary>The same stations in lasair</summary>

lasair imports the same block through the same stations, with its files laid out
differently. Its fuzzer target is `bin/conformance_target.ml`, and the import itself is
`conformance/trace_runner.ml`'s `import_block`, which calls into
`conformance/stf_guarantees.ml`, `stf_transitions.ml` and `stf_statistics.ml`.

| station | lasair |
| --- | --- |
| 1, 2 bytes arrive, decode | `handle_import`, `Block_codec.decode_block` |
| 3 find the state before | `find_parent` |
| 4 check the header | `validate_block_guarantees`, its first checks |
| 5 run Υ | `process_disputes`; the rest of `validate_block_guarantees` (seal, marks, assurances, guarantees); then `update_timeslot`, `update_entropy`, `update_safrole_epoch`, `process_tickets`, `process_guarantees` (assurances, accumulation, new reports), `update_auth_pools`, `process_preimage_extrinsic`, the `Stf_statistics` updates and `update_history` |
| 6 all or nothing | `import_block` returns `Error` before it writes anything |
| 7 the new state's root | `State_db.root` |
| 8 keep it and answer | `store`, `record_header`, `msg_state_root` |

The one real difference is when the checks run. Our client checks each step's part as
that step runs. lasair checks the whole block first, in `validate_block_guarantees`, and
only then makes the new state. Both orders are allowed, since neither keeps anything from
a block it refuses. lasair's `lib/` chapter files (`header.ml`, `safrole.ml` and the rest)
are its early study models; the import doesn't call them.

</details>

**What an importer leaves out.** Making blocks, talking to other nodes, auditing reports
off the chain, and choosing which chain is best and final are all a validator's work
beside importing. Milestone 1 is the import alone: blocks in, state roots out, every
wrong block refused.

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

§4.2 lists, for every new piece of state, what it is made from. Its reason for writing the
list this way is to help clients do the work in parallel: *"we minimize the depth of the
dependency graph"*. In plain words, the list is written so that as few steps as possible
wait for other steps.

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
