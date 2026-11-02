# Debugging: the launcher and every npm script

Run and Debug (⇧⌘D), pick a configuration, F5. A breakpoint is a click left of a line
number; F10 steps over, F11 steps into, ⇧F11 steps out, F5 runs on. Hover a variable, or
add it to *Watch*. To find a function, ⌘T (Ctrl+T) and type its name.

| configuration | what it runs |
| --- | --- |
| ▶ Any npm script | any script below, from a list you can type to filter |
| ▶ Import a trace, block by block | `npm run import <trace>`: 100 blocks, each into the state the one before left, each root against the trace's |
| ▶ Fuzz session | `npm run fuzz <trace>`: our fuzzer starts our target and speaks fuzz-proto to it; a breakpoint in the target pauses it too |
| Tests: all, Tests: the open file | `npm test`, or the test file open in the editor |
| Program: the open file | the `bin/` program open in the editor |

## Walk a block import

Start *▶ Import a trace* with `safrole`, or *▶ Fuzz session* to come in through the
target as the official fuzzer does, with a breakpoint in each station you want to stop
at. The stations are [lesson 0.6](../lessons/00-start/06-how-a-block-is-imported.md)'s.

| station | break in | refuses with |
| --- | --- | --- |
| 1 bytes arrive | `src/fuzz.ts` · `MessageCodec` | — |
| 2 decode the block | `src/block.ts` · `Block` | — |
| 3 find the state before | `src/target.ts` · `answer` | `the parent block is unknown` |
| 4 check the header | `src/import.ts` · `checkHeader` | `bad_parent`, `bad_parent_state_root`, `bad_slot`, `bad_extrinsic_hash` |
| 5 run the state transition, Υ | `src/import.ts` · `importBlock` | — |
| ↳ the court | `judgeDisputes` | `bad_vote_split`, `bad_votes_count` |
| ↳ who may author: entropy, validators, the lottery, the seal | `runSafrole` | `bad_seal`, `bad_entropy_source`, `bad_epoch_mark`, `bad_tickets_mark`, `bad_offenders_mark` |
| ↳ what is available, and what timed out | `takeAssurances` | `core_not_engaged`, `bad_attestation_parent` |
| ↳ new reports onto the free cores | `takeGuarantees` | `core_engaged`, `bad_signature` |
| ↳ each service folds in its refined results: accumulate, never refine | `accumulateBlock` | — |
| ↳ the rest of the new state, from what the steps made | `nextState` | — |
| ↳ the data services asked for | `providePreimages` | — |
| 6 all or nothing | `src/target.ts` · `answer` | — |
| 7 hash the new state into its root | `src/trie.ts` · `stateRoot` | — |
| 8 keep it and answer | `src/target.ts` · `answer` | — |

- **To stop at one block:** right-click a breakpoint, *Edit Condition*, `block.header.slot === 37`.
- **To print without stopping:** right-click left of a line, *Add Logpoint*, `slot {block.header.slot}`.
- **To see a refusal:** *▶ Import a trace* with `fuzzy`. Its blocks 37 to 39 are refused,
  `bad_code_hash`, by the guarantees' report checks; every other trace imports all 100.

## Every npm script

In the order the lessons add them. Each runs with `npm run <script>` in `client/`, or from
*▶ Any npm script*, once you've reached its lesson.

### Part 0 · Start

| script | lesson | what it shows |
| --- | --- | --- |
| `hello` | [0.3 Watch your client](../lessons/00-start/03-watch-your-client.md) | Says hello to the observability stack |
| `now` | [0.4 The JAM clock](../lessons/00-start/04-the-jam-clock.md) | The JAM clock |

### Part 2 · The codec

| script | lesson | what it shows |
| --- | --- | --- |
| `hexdump` | [2.6 The first test vectors](../lessons/02-codec/06-the-first-test-vectors.md) | Prints the first bytes of a file in hex, 16 to a line. |
| `hexdump-work-item` | [2.6 The first test vectors](../lessons/02-codec/06-the-first-test-vectors.md) | Prints the first bytes of a file in hex, 16 to a line. — on `codec/tiny/work_item.bin 52` |
| `scoreboard` | [2.6 The first test vectors](../lessons/02-codec/06-the-first-test-vectors.md) | The scoreboard |
| `decode` | [2.7 Watch a decode](../lessons/02-codec/07-watch-a-decode.md) | Decodes a structure's bytes and shows, field by field, which bytes became what. |
| `decode-work-item` | [2.7 Watch a decode](../lessons/02-codec/07-watch-a-decode.md) | Decodes a structure's bytes and shows, field by field, which bytes became what. — on `work_item codec/tiny/work_item.bin` |

### Part 3 · Work and reports

| script | lesson | what it shows |
| --- | --- | --- |
| `decode-work-package` | [3.1 A work-package](../lessons/03-work-and-reports/01-a-work-package.md) | Decodes a structure's bytes and shows, field by field, which bytes became what. — on `work_package codec/tiny/work_package.bin` |
| `decode-work-result` | [3.2 Work digests](../lessons/03-work-and-reports/02-work-digests.md) | Decodes a structure's bytes and shows, field by field, which bytes became what. — on `work_result codec/tiny/work_result_1.bin` |
| `decode-work-report` | [3.3 A work-report](../lessons/03-work-and-reports/03-a-work-report.md) | Decodes a structure's bytes and shows, field by field, which bytes became what. — on `work_report codec/full/work_report.bin` |

### Part 4 · Blocks

| script | lesson | what it shows |
| --- | --- | --- |
| `decode-preimages` | [4.1 Tickets and preimages](../lessons/04-blocks/01-tickets-and-preimages.md) | Decodes a structure's bytes and shows, field by field, which bytes became what. — on `preimages_extrinsic codec/tiny/preimages_extrinsic.bin` |
| `decode-assurances` | [4.2 Tiny and full](../lessons/04-blocks/02-tiny-and-full.md) | Decodes a structure's bytes and shows, field by field, which bytes became what. — on `assurances_extrinsic codec/tiny/assurances_extrinsic.bin` |
| `decode-assurances-full` | [4.2 Tiny and full](../lessons/04-blocks/02-tiny-and-full.md) | Decodes a structure's bytes and shows, field by field, which bytes became what. — on `assurances_extrinsic codec/full/assurances_extrinsic.bin` |
| `decode-guarantees` | [4.3 Guarantees](../lessons/04-blocks/03-guarantees.md) | Decodes a structure's bytes and shows, field by field, which bytes became what. — on `guarantees_extrinsic codec/tiny/guarantees_extrinsic.bin` |
| `decode-disputes` | [4.4 Disputes](../lessons/04-blocks/04-disputes.md) | Decodes a structure's bytes and shows, field by field, which bytes became what. — on `disputes_extrinsic codec/full/disputes_extrinsic.bin` |
| `decode-header` | [4.6 The header](../lessons/04-blocks/06-the-header.md) | Decodes a structure's bytes and shows, field by field, which bytes became what. — on `header codec/tiny/header_1.bin` |
| `decode-block` | [4.7 The block](../lessons/04-blocks/07-the-block.md) | Decodes a structure's bytes and shows, field by field, which bytes became what. — on `block codec/tiny/block.bin` |

### Part 5 · Hashing and signatures

| script | lesson | what it shows |
| --- | --- | --- |
| `chain` | [5.1 Hashes](../lessons/05-hashing-and-signatures/01-hashes.md) | Walks the 100 blocks of a tiny trace ("fallback", unless you name another) and checks each one |
| `assurances` | [5.3 Signatures](../lessons/05-hashing-and-signatures/03-signatures.md) | Checks the signature on every assurance in an assurances test vector, with the Ed25519 keys of the validators in the vector's state. |
| `assurances-bad-signature` | [5.3 Signatures](../lessons/05-hashing-and-signatures/03-signatures.md) | Checks the signature on every assurance in an assurances test vector, with the Ed25519 keys of the validators in the vector's state. — on `stf/assurances/tiny/assurances_with_bad_signature-1.json` |

### Part 6 · State and Merklization

| script | lesson | what it shows |
| --- | --- | --- |
| `state` | [6.1 The state trie](../lessons/06-state-and-merklization/01-the-state-trie.md) | Builds the trie of the state before a trace's block, shows where each entry lands and what it is, and checks the root against the one the block's header promises. |
| `state-fallback` | [6.1 The state trie](../lessons/06-state-and-merklization/01-the-state-trie.md) | Builds the trie of the state before a trace's block, shows where each entry lands and what it is, and checks the root against the one the block's header promises. — on `traces/fallback/00000001.json` |
| `read-state` | [6.3 Reading the state](../lessons/06-state-and-merklization/03-reading-the-state.md) | Reads three components of the state before a trace's block |
| `read-state-safrole` | [6.3 Reading the state](../lessons/06-state-and-merklization/03-reading-the-state.md) | Reads three components of the state before a trace's block — on `traces/safrole/00000012.json` |

### Part 7 · Time and shuffling

| script | lesson | what it shows |
| --- | --- | --- |
| `epochs` | [7.1 Epochs](../lessons/07-time-and-shuffling/01-epochs.md) | Walks the 100 blocks of the tiny "safrole" trace and shows where each new epoch begins |
| `shuffle` | [7.2 The shuffle](../lessons/07-time-and-shuffling/02-the-shuffle.md) | Shuffles the numbers 0 to n − 1 with a hash, as the shuffle vectors do, and shows each pick on the way. |
| `shuffle-eight` | [7.2 The shuffle](../lessons/07-time-and-shuffling/02-the-shuffle.md) | Shuffles the numbers 0 to n − 1 with a hash, as the shuffle vectors do, and shows each pick on the way. — on `8 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff` |

### Part 8 · Safrole

| script | lesson | what it shows |
| --- | --- | --- |
| `entropy` | [8.1 Stirring the entropy](../lessons/08-safrole/01-stirring-the-entropy.md) | Shows how one block changes η, from a safrole test vector |
| `entropy-new-epoch` | [8.1 Stirring the entropy](../lessons/08-safrole/01-stirring-the-entropy.md) | Shows how one block changes η, from a safrole test vector — on `stf/safrole/tiny/enact-epoch-change-with-no-tickets-4.json` |
| `rotation` | [8.2 Rotating the validators](../lessons/08-safrole/02-rotating-the-validators.md) | Shows the four validator sets before and after a block, from a safrole test vector, each validator by the first four hex digits of its Ed25519 key. |
| `rotation-new-epoch` | [8.2 Rotating the validators](../lessons/08-safrole/02-rotating-the-validators.md) | Shows the four validator sets before and after a block, from a safrole test vector, each validator by the first four hex digits of its Ed25519 key. — on `stf/safrole/tiny/enact-epoch-change-with-padding-1.json` |
| `sealers` | [8.3 The fallback sealers](../lessons/08-safrole/03-the-fallback-sealers.md) | Shows who seals each slot of the new epoch when a safrole test vector falls back to F |
| `sealers-no-tickets` | [8.3 The fallback sealers](../lessons/08-safrole/03-the-fallback-sealers.md) | Shows who seals each slot of the new epoch when a safrole test vector falls back to F — on `stf/safrole/tiny/enact-epoch-change-with-no-tickets-4.json` |
| `lottery` | [8.4 The lottery's winners](../lessons/08-safrole/04-the-lotterys-winners.md) | Shows a lottery's result from a safrole test vector |
| `lottery-closes` | [8.4 The lottery's winners](../lessons/08-safrole/04-the-lotterys-winners.md) | Shows a lottery's result from a safrole test vector — on `stf/safrole/tiny/publish-tickets-with-mark-4.json` |
| `safrole` | [8.5 One step of Safrole](../lessons/08-safrole/05-one-step-of-safrole.md) | Runs one block of Safrole from a safrole test vector, tickets and all, tells what happened (or why the block is refused), and checks the result against the vector. |
| `safrole-new-epoch` | [8.5 One step of Safrole](../lessons/08-safrole/05-one-step-of-safrole.md) | Runs one block of Safrole from a safrole test vector, tickets and all, tells what happened (or why the block is refused), and checks the result against the vector. — on `stf/safrole/tiny/enact-epoch-change-with-padding-1.json` |
| `vrf` | [8.6 The VRF output](../lessons/08-safrole/06-the-vrf-output.md) | Reads the VRF output of real blocks' entropy sources, and stirs it into η₀ |
| `safrole-tickets-2` | [8.7 Entering tickets](../lessons/08-safrole/07-entering-tickets.md) | Runs one block of Safrole from a safrole test vector, tickets and all, tells what happened (or why the block is refused), and checks the result against the vector. — on `stf/safrole/tiny/publish-tickets-no-mark-2.json` |
| `safrole-tickets-4` | [8.7 Entering tickets](../lessons/08-safrole/07-entering-tickets.md) | Runs one block of Safrole from a safrole test vector, tickets and all, tells what happened (or why the block is refused), and checks the result against the vector. — on `stf/safrole/tiny/publish-tickets-no-mark-4.json` |
| `safrole-no-tickets` | [8.8 The ring root](../lessons/08-safrole/08-the-ring-root.md) | Runs one block of Safrole from a safrole test vector, tickets and all, tells what happened (or why the block is refused), and checks the result against the vector. — on `stf/safrole/tiny/enact-epoch-change-with-no-tickets-4.json` |
| `safrole-tickets-5` | [8.8 The ring root](../lessons/08-safrole/08-the-ring-root.md) | Runs one block of Safrole from a safrole test vector, tickets and all, tells what happened (or why the block is refused), and checks the result against the vector. — on `stf/safrole/tiny/publish-tickets-no-mark-5.json` |
| `seals` | [8.9 Seals](../lessons/08-safrole/09-seals.md) | Checks the seal and entropy source of real blocks |

### Part 9 · Recent history

| script | lesson | what it shows |
| --- | --- | --- |
| `belt` | [9.1 The mountain belt](../lessons/09-recent-history/01-the-mountain-belt.md) | Grows a mountain belt one item at a time and shows its peaks after each append |
| `history` | [9.2 Recent blocks](../lessons/09-recent-history/02-recent-blocks.md) | Reads β from the state before a trace's block |
| `history-preimages` | [9.2 Recent blocks](../lessons/09-recent-history/02-recent-blocks.md) | Reads β from the state before a trace's block — on `traces/preimages/00000050.json` |

### Part 10 · Disputes

| script | lesson | what it shows |
| --- | --- | --- |
| `verdicts` | [10.1 Votes and verdicts](../lessons/10-disputes/01-votes-and-verdicts.md) | Shows each verdict in a disputes test vector |
| `verdicts-progress` | [10.1 Votes and verdicts](../lessons/10-disputes/01-votes-and-verdicts.md) | Shows each verdict in a disputes test vector — on `stf/disputes/tiny/progress_with_verdicts-4.json` |
| `offenders` | [10.2 Culprits and faults](../lessons/10-disputes/02-culprits-and-faults.md) | Shows the offenders in a disputes test vector |
| `offenders-progress` | [10.2 Culprits and faults](../lessons/10-disputes/02-culprits-and-faults.md) | Shows the offenders in a disputes test vector — on `stf/disputes/tiny/progress_with_verdicts-4.json` |
| `cores` | [10.3 Clearing the cores](../lessons/10-disputes/03-clearing-the-cores.md) | Shows which cores lose their pending report to the verdicts of a disputes test vector. |
| `cores-invalidated` | [10.3 Clearing the cores](../lessons/10-disputes/03-clearing-the-cores.md) | Shows which cores lose their pending report to the verdicts of a disputes test vector. — on `stf/disputes/tiny/progress_invalidates_avail_assignments-1.json` |
| `check-disputes` | [10.4 Bad verdicts](../lessons/10-disputes/04-bad-verdicts.md) | Checks the disputes of every disputes test vector of one size against the rules (the verdicts', then the culprits' and faults'), and shows each verdict next to the vector's |

### Part 11 · Assurances

| script | lesson | what it shows |
| --- | --- | --- |
| `available` | [11.1 Available](../lessons/11-assurances/01-available.md) | Counts, core by core, how many validators of an assurances test vector hold each pending report's data, and which reports become available. |
| `available-some` | [11.1 Available](../lessons/11-assurances/01-available.md) | Counts, core by core, how many validators of an assurances test vector hold each pending report's data, and which reports become available. — on `stf/assurances/tiny/some_assurances-1.json` |
| `release` | [11.2 Timeouts](../lessons/11-assurances/02-timeouts.md) | Shows what happens to each core's pending report in an assurances test vector |
| `release-stale` | [11.2 Timeouts](../lessons/11-assurances/02-timeouts.md) | Shows what happens to each core's pending report in an assurances test vector — on `stf/assurances/tiny/no_assurances_with_stale_report-1.json` |
| `check-assurances` | [11.3 Bad assurances](../lessons/11-assurances/03-bad-assurances.md) | Checks the assurances of every assurances test vector of one size against the rules, and shows each verdict next to the vector's |

### Part 12 · Guarantees

| script | lesson | what it shows |
| --- | --- | --- |
| `guarantors` | [12.1 Who guarantees what](../lessons/12-guarantees/01-who-guarantees-what.md) | Shows who guarantees which core in a reports test vector, this rotation and the last, and checks each guarantee's signers against the assignment it answers to. |
| `guarantors-prev-rotation` | [12.1 Who guarantees what](../lessons/12-guarantees/01-who-guarantees-what.md) | Shows who guarantees which core in a reports test vector, this rotation and the last, and checks each guarantee's signers against the assignment it answers to. — on `stf/reports/tiny/report_prev_rotation-1.json` |
| `reporters` | [12.2 Signed and counted](../lessons/12-guarantees/02-signed-and-counted.md) | Checks the signatures on every guarantee of a reports test vector and lists the reporters |
| `reporters-same-guarantors` | [12.2 Signed and counted](../lessons/12-guarantees/02-signed-and-counted.md) | Checks the signatures on every guarantee of a reports test vector and lists the reporters — on `stf/reports/tiny/different_core_same_guarantors-1.json` |
| `placed` | [12.3 Onto the cores](../lessons/12-guarantees/03-onto-the-cores.md) | Puts the guaranteed reports of a reports test vector onto their cores, and lists the packages the block reports, sorted by hash. |
| `placed-high-gas` | [12.3 Onto the cores](../lessons/12-guarantees/03-onto-the-cores.md) | Puts the guaranteed reports of a reports test vector onto their cores, and lists the packages the block reports, sorted by hash. — on `stf/reports/tiny/high_work_report_gas-1.json` |
| `check-guarantees` | [12.4 Bad guarantees](../lessons/12-guarantees/04-bad-guarantees.md) | Checks the guarantees and reports of every reports test vector of one size against the rules (the guarantees' first, then the reports'), and shows each verdict next to the vector's |

### Part 13 · Authorization

| script | lesson | what it shows |
| --- | --- | --- |
| `pools` | [13.1 The authorizer pools](../lessons/13-authorization/01-the-authorizer-pools.md) | Shows each core's authorizer pool before and after the block of an authorizations test vector |
| `pools-progress` | [13.1 The authorizer pools](../lessons/13-authorization/01-the-authorizer-pools.md) | Shows each core's authorizer pool before and after the block of an authorizations test vector — on `stf/authorizations/tiny/progress_authorizations-2.json` |

### Part 14 · Services and preimages

| script | lesson | what it shows |
| --- | --- | --- |
| `preimages` | [14.1 Providing preimages](../lessons/14-services/01-providing-preimages.md) | Provides the preimages of a trace's block to the services that asked for them, and shows each request's history before and after. |
| `preimages-trace` | [14.1 Providing preimages](../lessons/14-services/01-providing-preimages.md) | Provides the preimages of a trace's block to the services that asked for them, and shows each request's history before and after. — on `traces/preimages/00000008.json` |
| `service` | [14.2 The service account](../lessons/14-services/02-the-service-account.md) | Reads a service's account from the state before a trace's block |
| `service-fallback` | [14.2 The service account](../lessons/14-services/02-the-service-account.md) | Reads a service's account from the state before a trace's block — on `traces/fallback/00000001.json` |

### Part 15 · The PVM

| script | lesson | what it shows |
| --- | --- | --- |
| `program` | [15.1 The program blob](../lessons/15-the-pvm/01-the-program-blob.md) | Unpacks a service's code from the state before a trace's block, layer by layer |
| `program-fallback` | [15.1 The program blob](../lessons/15-the-pvm/01-the-program-blob.md) | Unpacks a service's code from the state before a trace's block, layer by layer — on `traces/fallback/00000001.json` |
| `disassemble` | [15.2 Instructions](../lessons/15-the-pvm/02-instructions.md) | Disassembles a stretch of a service's code from the state before a trace's block |
| `disassemble-fallback` | [15.2 Instructions](../lessons/15-the-pvm/02-instructions.md) | Disassembles a stretch of a service's code from the state before a trace's block — on `traces/fallback/00000001.json 0 4` |
| `run` | [15.3 The machine](../lessons/15-the-pvm/03-the-machine.md) | Runs a hand-written program on your PVM, one step at a time |
| `memory` | [15.4 Memory](../lessons/15-the-pvm/04-memory.md) | Runs two tiny programs on your PVM's memory |
| `alu` | [15.5 Arithmetic](../lessons/15-the-pvm/05-arithmetic.md) | Runs the arithmetic edge cases the Gray Paper spells out, each as one instruction on your PVM, and shows the answers in hex and as signed numbers. |
| `branches` | [15.6 Branches and calls](../lessons/15-the-pvm/06-branches-and-calls.md) | Runs every branch on your PVM with r0 = −1 and r1 = 1 (ν_X = 1 for the immediate ones), and shows which of them jump |
| `bits` | [15.7 Bits and bytes](../lessons/15-the-pvm/07-bits-and-bytes.md) | Runs the ten bit-and-byte instructions on one number, on your PVM, and shows its bits and every answer. |
| `start` | [15.8 A real program](../lessons/15-the-pvm/08-a-real-program.md) | Starts a real service |
| `costs` | [15.9 What instructions cost](../lessons/15-the-pvm/09-what-instructions-cost.md) | Shows the cost sheet of a real basic block |
| `pipeline` | [15.10 The pipeline](../lessons/15-the-pvm/10-the-pipeline.md) | Runs a real basic block through the model CPU, the one the bootstrap service's accumulation jumps to first, and draws its reorder buffer cycle by cycle. |
| `gas` | [15.11 The gas meter](../lessons/15-the-pvm/11-the-gas-meter.md) | Runs the bootstrap service from accumulation's entry point with a gas budget, and shows each basic block it pays for on the way to its first host call. |

### Part 16 · Host calls

| script | lesson | what it shows |
| --- | --- | --- |
| `host` | [16.1 Calling the host](../lessons/16-host-calls/01-calling-the-host.md) | Runs a real service's accumulation, Ψ_A, and shows every host call it makes, the answer it gets, and the transfers it sends. |
| `accumulate` | [16.7 A service's inputs](../lessons/16-host-calls/07-a-services-inputs.md) | Accumulates a test vector's block the way Part 17 does so far, and shows the queue (what waited, which packages went, what still waits), the rounds it took and the outputs and their root; then each service next to the vector |
| `accumulate-foreign-preimage` | [16.8 Lookup](../lessons/16-host-calls/08-lookup.md) | Accumulates a test vector's block the way Part 17 does so far, and shows the queue (what waited, which packages went, what still waits), the rounds it took and the outputs and their root; then each service next to the vector — on `stf/accumulate/tiny/lookup_foreign_preimage-1.json` |
| `accumulate-len-bound` | [16.9 Asking for preimages](../lessons/16-host-calls/09-asking-for-preimages.md) | Accumulates a test vector's block the way Part 17 does so far, and shows the queue (what waited, which packages went, what still waits), the rounds it took and the outputs and their root; then each service next to the vector — on `stf/accumulate/tiny/preimage_len_bound-1.json` |

### Part 17 · Accumulation

| script | lesson | what it shows |
| --- | --- | --- |
| `host-transfer` | [17.3 Sending a transfer](../lessons/17-accumulation/03-sending-a-transfer.md) | Runs a real service's accumulation, Ψ_A, and shows every host call it makes, the answer it gets, and the transfers it sends. — on `stf/accumulate/tiny/transfer_for_live_service-1.json 0` |
| `accumulate-transfer` | [17.4 Rounds](../lessons/17-accumulation/04-rounds.md) | Accumulates a test vector's block the way Part 17 does so far, and shows the queue (what waited, which packages went, what still waits), the rounds it took and the outputs and their root; then each service next to the vector — on `stf/accumulate/tiny/transfer_for_live_service-1.json` |
| `host-assign` | [17.5 Privileges](../lessons/17-accumulation/05-privileges.md) | Runs a real service's accumulation, Ψ_A, and shows every host call it makes, the answer it gets, and the transfers it sends. — on `stf/accumulate/tiny/assign_from_non_assigner-3.json 0` |
| `host-assign-refused` | [17.5 Privileges](../lessons/17-accumulation/05-privileges.md) | Runs a real service's accumulation, Ψ_A, and shows every host call it makes, the answer it gets, and the transfers it sends. — on `stf/accumulate/tiny/assign_from_non_assigner-1.json 1` |
| `accumulate-assign` | [17.6 Who wins](../lessons/17-accumulation/06-who-wins.md) | Accumulates a test vector's block the way Part 17 does so far, and shows the queue (what waited, which packages went, what still waits), the rounds it took and the outputs and their root; then each service next to the vector — on `stf/accumulate/tiny/assign_from_non_assigner-3.json` |
| `host-eject` | [17.7 Ejecting a service](../lessons/17-accumulation/07-ejecting-a-service.md) | Runs a real service's accumulation, Ψ_A, and shows every host call it makes, the answer it gets, and the transfers it sends. — on `stf/accumulate/tiny/work_for_ejected_service-2.json 0` |
| `host-new-service` | [17.8 Creating a service](../lessons/17-accumulation/08-creating-a-service.md) | Runs a real service's accumulation, Ψ_A, and shows every host call it makes, the answer it gets, and the transfers it sends. — on `stf/accumulate/tiny/create_service-1.json 0` |
| `accumulate-recreate` | [17.9 The block's gas budget](../lessons/17-accumulation/09-the-blocks-gas-budget.md) | Accumulates a test vector's block the way Part 17 does so far, and shows the queue (what waited, which packages went, what still waits), the rounds it took and the outputs and their root; then each service next to the vector — on `stf/accumulate/tiny/recreate_service_ejected_in_earlier_round-1.json` |
| `host-upgrade` | [17.10 Upgrading a service](../lessons/17-accumulation/10-upgrading-a-service.md) | Runs a real service's accumulation, Ψ_A, and shows every host call it makes, the answer it gets, and the transfers it sends. — on `stf/accumulate/tiny/upgrade_service-1.json 0` |
| `accumulate-ejected` | [17.11 What a service yields](../lessons/17-accumulation/11-what-a-service-yields.md) | Accumulates a test vector's block the way Part 17 does so far, and shows the queue (what waited, which packages went, what still waits), the rounds it took and the outputs and their root; then each service next to the vector — on `stf/accumulate/tiny/work_for_ejected_service-3.json` |
| `host-provide-1` | [17.12 Providing a preimage](../lessons/17-accumulation/12-providing-a-preimage.md) | Runs a real service's accumulation, Ψ_A, and shows every host call it makes, the answer it gets, and the transfers it sends. — on `stf/accumulate/tiny/provide_preimage-1.json 0` |
| `host-provide-2` | [17.12 Providing a preimage](../lessons/17-accumulation/12-providing-a-preimage.md) | Runs a real service's accumulation, Ψ_A, and shows every host call it makes, the answer it gets, and the transfers it sends. — on `stf/accumulate/tiny/provide_preimage-2.json 0` |
| `host-bless` | [17.13 Blessing and designating](../lessons/17-accumulation/13-blessing-and-designating.md) | Runs a real service's accumulation, Ψ_A, and shows every host call it makes, the answer it gets, and the transfers it sends. — on `stf/accumulate/tiny/bless_from_non_manager-1.json 1` |
| `host-designate` | [17.13 Blessing and designating](../lessons/17-accumulation/13-blessing-and-designating.md) | Runs a real service's accumulation, Ψ_A, and shows every host call it makes, the answer it gets, and the transfers it sends. — on `stf/accumulate/tiny/designate_with_invalid_count-1.json 0` |

### Part 18 · Statistics

| script | lesson | what it shows |
| --- | --- | --- |
| `statistics` | [18.1 Who did what](../lessons/18-statistics/01-who-did-what.md) | Moves the validators' tallies on by one block, as a statistics test vector sets it up, and shows what changed for whom. |
| `activity` | [18.2 What cores and services did](../lessons/18-statistics/02-what-cores-and-services-did.md) | One block's core and service activity, from a reports test vector (new work taken on) or an assurances one (data now available), and what each core and service did. |
| `activity-some` | [18.2 What cores and services did](../lessons/18-statistics/02-what-cores-and-services-did.md) | One block's core and service activity, from a reports test vector (new work taken on) or an assurances one (data now available), and what each core and service did. — on `stf/assurances/tiny/some_assurances-1.json` |

### Part 19 · Block import

| script | lesson | what it shows |
| --- | --- | --- |
| `plan` | [19.1 The order of things](../lessons/19-block-import/01-the-order-of-things.md) | Prints the plan of a block import |
| `whole-state` | [19.2 The whole state](../lessons/19-block-import/02-the-whole-state.md) | Reads a real state whole |
| `import` | [19.4 Importing a block](../lessons/19-block-import/04-importing-a-block.md) | Imports a whole block-import trace, block after block, each into the state your client made from the one before |

### Part 20 · Facing the fuzzer

| script | lesson | what it shows |
| --- | --- | --- |
| `fuzz` | [20.3 A session](../lessons/20-facing-the-fuzzer/03-a-session.md) | A small fuzzer of your own |
| `target` | [20.4 Ready to be fuzzed](../lessons/20-facing-the-fuzzer/04-ready-to-be-fuzzed.md) | Your client as a fuzz target |
| `target-tiny` | [20.4 Ready to be fuzzed](../lessons/20-facing-the-fuzzer/04-ready-to-be-fuzzed.md) | Your client as a fuzz target |
| `fuzz-target` | [20.4 Ready to be fuzzed](../lessons/20-facing-the-fuzzer/04-ready-to-be-fuzzed.md) | A small fuzzer of your own — on `safrole /tmp/jam/fuzz.sock` |
