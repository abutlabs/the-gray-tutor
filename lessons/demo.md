# Demo

**In one sentence:** your finished client, shown in ten minutes with six commands.

Each command is a script your client has by the end of the tutorial, so there's nothing
to look up and no path to type. Each step says what to point at, and links the lesson
that built it, for the questions.

## Before you start

In the tutorial's folder:

```sh
./obs up
npm run demo
cd demo
```

`./obs up` starts the dashboards ([lesson 0.2](./00-start/02-set-up-the-project.md)); open
Grafana at http://localhost:3300 in a tab of its own. `npm run demo` builds the finished
client from the lessons into `demo/`, beside your own `client/`, which it leaves alone,
and installs its packages. Demoing your own client instead? Run the same commands in
`client/`: each lesson gives the scripts it uses.

Forgot a name? `npm run`, on its own, lists every script, each with the command it stands
for. They're all [at the end of this page](#every-script) too, with the lesson that adds
each one.

## The demo

### 1. Every official vector, run whole

```sh
npm run scoreboard
```

```text
traces/fuzzy           200 of 200  ✔
1,406 of 1,428 vectors pass.
```

The vectors every JAM team checks against, each run **whole**: a vector counts only once
nothing in your client's answer differs. The 22 left each have a name: ten blocks with
preimages a client should refuse, and twelve erasure-coding vectors a block importer never
needs. Grafana keeps the board on *8 · Official vectors*, every vector with its result.
([The scoreboard](./scoreboard.md), [lesson 20.4](./20-facing-the-fuzzer/04-ready-to-be-fuzzed.md#the-scoreboard))

### 2. It reads JAM's bytes

```sh
npm run decode-block
```

```text
    0..32    header.parent                  0x5c743dbc514284b2ea57798787c5a155ef9d7ac1e9499ec65910a7a3d65897b7
   32..64    header.parent_state_root       0x2591ebd047489f1006361a4254731466a946174af02fe1d86681d254cfd4a00b
```

A whole block, decoded from the official vector's bytes, every field with the bytes it
came from. Open the link it prints: *Decode trace* on *1 · Basics* shows the same list.
([Lesson 4.7](./04-blocks/07-the-block.md), the decoder from [lesson 2.7](./02-codec/07-watch-a-decode.md))

### 3. It runs the consensus

```sh
npm run safrole-new-epoch
```

```text
a new epoch: true
validators moved along one set; offenders zeroed: 1
the whole state after matches the vector: true
```

A block that starts a new epoch, through Safrole: the entropy stirred, the validators
moved along one set (an offender's key zeroed on the way), the fallback sealers chosen, and
the whole state after it the same as the vector's.
([Lesson 8.5](./08-safrole/05-one-step-of-safrole.md))

### 4. It runs a service's code

```sh
npm run host-transfer
```

```text
host call 21 (transfer): φ₇ = 0, 188133 gas left
sent 100 to service 1, with 80000 gas and the memo "gift"
```

A real service's code on your client's PVM, every call it makes to the host with the gas
left after it, and the transfer it sends.
([Lesson 17.3](./17-accumulation/03-sending-a-transfer.md))

### 5. It imports blocks

```sh
npm run import fuzzy
```

```text
block 37, slot 37: refused: bad_code_hash; root 0xe9a2c0ff… = the trace's
100 of 100 state roots as the trace's
```

A trace of 100 blocks, some of them broken on purpose, imported one by one: each block
imported or refused for the trace's reason, and the state root after every one the same
as the trace's. Block import: what the M1 milestone asks of a client.
([Lesson 19.6](./19-block-import/06-blocks-to-refuse.md))

### 6. It faces the fuzzer

```sh
mkdir -p /tmp/jam
npm run target-tiny > /dev/null 2>&1 &
npm run fuzz-target
kill $!
```

```text
target: the-gray-tutor
100 of 100 blocks as the trace has them
```

Your client as a fuzz target, started the way the official conformance fuzzer starts
one, and a session with it over its socket: the fuzzer's protocol, a block at a time.
`kill $!` stops the target.
([Lesson 20.4](./20-facing-the-fuzzer/04-ready-to-be-fuzzed.md))

## Every script

Every script your client has by the end, in the order the lessons add them, Part by
Part. `npm run NAME` runs one; a program's own script takes words after its name (`npm
run decode header x.bin`).

<!-- every script: written by `node tools/client-scripts.ts --write`, from the lessons -->

### Part 0 · Start

| Script | Runs | Lesson |
| --- | --- | --- |
| `hello` | `node bin/hello.ts` | [0.3](./00-start/03-watch-your-client.md) |
| `now` | `node bin/now.ts` | [0.4](./00-start/04-the-jam-clock.md) |

### Part 2 · The codec

| Script | Runs | Lesson |
| --- | --- | --- |
| `hexdump` | `node bin/hexdump.ts` | [2.6](./02-codec/06-the-first-test-vectors.md) |
| `hexdump-work-item` | `node bin/hexdump.ts ../vectors/codec/tiny/work_item.bin 52` | [2.6](./02-codec/06-the-first-test-vectors.md) |
| `scoreboard` | `node bin/scoreboard.ts` | [2.6](./02-codec/06-the-first-test-vectors.md) |
| `decode` | `node bin/decode.ts` | [2.7](./02-codec/07-watch-a-decode.md) |
| `decode-work-item` | `node bin/decode.ts work_item ../vectors/codec/tiny/work_item.bin` | [2.7](./02-codec/07-watch-a-decode.md) |

### Part 3 · Work and reports

| Script | Runs | Lesson |
| --- | --- | --- |
| `decode-work-package` | `node bin/decode.ts work_package ../vectors/codec/tiny/work_package.bin` | [3.1](./03-work-and-reports/01-a-work-package.md) |
| `decode-work-result` | `node bin/decode.ts work_result ../vectors/codec/tiny/work_result_1.bin` | [3.2](./03-work-and-reports/02-work-digests.md) |
| `decode-work-report` | `node bin/decode.ts work_report ../vectors/codec/full/work_report.bin` | [3.3](./03-work-and-reports/03-a-work-report.md) |

### Part 4 · Blocks

| Script | Runs | Lesson |
| --- | --- | --- |
| `decode-preimages` | `node bin/decode.ts preimages_extrinsic ../vectors/codec/tiny/preimages_extrinsic.bin` | [4.1](./04-blocks/01-tickets-and-preimages.md) |
| `decode-assurances` | `node bin/decode.ts assurances_extrinsic ../vectors/codec/tiny/assurances_extrinsic.bin` | [4.2](./04-blocks/02-tiny-and-full.md) |
| `decode-assurances-full` | `node bin/decode.ts assurances_extrinsic ../vectors/codec/full/assurances_extrinsic.bin` | [4.2](./04-blocks/02-tiny-and-full.md) |
| `decode-guarantees` | `node bin/decode.ts guarantees_extrinsic ../vectors/codec/tiny/guarantees_extrinsic.bin` | [4.3](./04-blocks/03-guarantees.md) |
| `decode-disputes` | `node bin/decode.ts disputes_extrinsic ../vectors/codec/full/disputes_extrinsic.bin` | [4.4](./04-blocks/04-disputes.md) |
| `decode-header` | `node bin/decode.ts header ../vectors/codec/tiny/header_1.bin` | [4.6](./04-blocks/06-the-header.md) |
| `decode-block` | `node bin/decode.ts block ../vectors/codec/tiny/block.bin` | [4.7](./04-blocks/07-the-block.md) |

### Part 5 · Hashing and signatures

| Script | Runs | Lesson |
| --- | --- | --- |
| `chain` | `node bin/chain.ts` | [5.1](./05-hashing-and-signatures/01-hashes.md) |
| `assurances` | `node bin/assurances.ts` | [5.3](./05-hashing-and-signatures/03-signatures.md) |
| `assurances-bad-signature` | `node bin/assurances.ts ../vectors/stf/assurances/tiny/assurances_with_bad_signature-1.json` | [5.3](./05-hashing-and-signatures/03-signatures.md) |

### Part 6 · State and Merklization

| Script | Runs | Lesson |
| --- | --- | --- |
| `state` | `node bin/state.ts` | [6.1](./06-state-and-merklization/01-the-state-trie.md) |
| `state-fallback` | `node bin/state.ts ../vectors/traces/fallback/00000001.json` | [6.1](./06-state-and-merklization/01-the-state-trie.md) |
| `read-state` | `node bin/read-state.ts` | [6.3](./06-state-and-merklization/03-reading-the-state.md) |
| `read-state-safrole` | `node bin/read-state.ts ../vectors/traces/safrole/00000012.json` | [6.3](./06-state-and-merklization/03-reading-the-state.md) |

### Part 7 · Time and shuffling

| Script | Runs | Lesson |
| --- | --- | --- |
| `epochs` | `node bin/epochs.ts` | [7.1](./07-time-and-shuffling/01-epochs.md) |
| `shuffle` | `node bin/shuffle.ts` | [7.2](./07-time-and-shuffling/02-the-shuffle.md) |
| `shuffle-eight` | `node bin/shuffle.ts 8 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff` | [7.2](./07-time-and-shuffling/02-the-shuffle.md) |

### Part 8 · Safrole

| Script | Runs | Lesson |
| --- | --- | --- |
| `entropy` | `node bin/entropy.ts` | [8.1](./08-safrole/01-stirring-the-entropy.md) |
| `entropy-new-epoch` | `node bin/entropy.ts ../vectors/stf/safrole/tiny/enact-epoch-change-with-no-tickets-4.json` | [8.1](./08-safrole/01-stirring-the-entropy.md) |
| `rotation` | `node bin/rotation.ts` | [8.2](./08-safrole/02-rotating-the-validators.md) |
| `rotation-new-epoch` | `node bin/rotation.ts ../vectors/stf/safrole/tiny/enact-epoch-change-with-padding-1.json` | [8.2](./08-safrole/02-rotating-the-validators.md) |
| `sealers` | `node bin/sealers.ts` | [8.3](./08-safrole/03-the-fallback-sealers.md) |
| `sealers-no-tickets` | `node bin/sealers.ts ../vectors/stf/safrole/tiny/enact-epoch-change-with-no-tickets-4.json` | [8.3](./08-safrole/03-the-fallback-sealers.md) |
| `lottery` | `node bin/lottery.ts` | [8.4](./08-safrole/04-the-lotterys-winners.md) |
| `lottery-closes` | `node bin/lottery.ts ../vectors/stf/safrole/tiny/publish-tickets-with-mark-4.json` | [8.4](./08-safrole/04-the-lotterys-winners.md) |
| `safrole` | `node bin/safrole.ts` | [8.5](./08-safrole/05-one-step-of-safrole.md) |
| `safrole-new-epoch` | `node bin/safrole.ts ../vectors/stf/safrole/tiny/enact-epoch-change-with-padding-1.json` | [8.5](./08-safrole/05-one-step-of-safrole.md) |
| `vrf` | `node bin/vrf.ts` | [8.6](./08-safrole/06-the-vrf-output.md) |
| `safrole-tickets-2` | `node bin/safrole.ts ../vectors/stf/safrole/tiny/publish-tickets-no-mark-2.json` | [8.7](./08-safrole/07-entering-tickets.md) |
| `safrole-tickets-4` | `node bin/safrole.ts ../vectors/stf/safrole/tiny/publish-tickets-no-mark-4.json` | [8.7](./08-safrole/07-entering-tickets.md) |
| `safrole-no-tickets` | `node bin/safrole.ts ../vectors/stf/safrole/tiny/enact-epoch-change-with-no-tickets-4.json` | [8.8](./08-safrole/08-the-ring-root.md) |
| `safrole-tickets-5` | `node bin/safrole.ts ../vectors/stf/safrole/tiny/publish-tickets-no-mark-5.json` | [8.8](./08-safrole/08-the-ring-root.md) |
| `seals` | `node bin/seals.ts` | [8.9](./08-safrole/09-seals.md) |

### Part 9 · Recent history

| Script | Runs | Lesson |
| --- | --- | --- |
| `belt` | `node bin/belt.ts` | [9.1](./09-recent-history/01-the-mountain-belt.md) |
| `history` | `node bin/history.ts` | [9.2](./09-recent-history/02-recent-blocks.md) |
| `history-preimages` | `node bin/history.ts ../vectors/traces/preimages/00000050.json` | [9.2](./09-recent-history/02-recent-blocks.md) |

### Part 10 · Disputes

| Script | Runs | Lesson |
| --- | --- | --- |
| `verdicts` | `node bin/verdicts.ts` | [10.1](./10-disputes/01-votes-and-verdicts.md) |
| `verdicts-progress` | `node bin/verdicts.ts ../vectors/stf/disputes/tiny/progress_with_verdicts-4.json` | [10.1](./10-disputes/01-votes-and-verdicts.md) |
| `offenders` | `node bin/offenders.ts` | [10.2](./10-disputes/02-culprits-and-faults.md) |
| `offenders-progress` | `node bin/offenders.ts ../vectors/stf/disputes/tiny/progress_with_verdicts-4.json` | [10.2](./10-disputes/02-culprits-and-faults.md) |
| `cores` | `node bin/cores.ts` | [10.3](./10-disputes/03-clearing-the-cores.md) |
| `cores-invalidated` | `node bin/cores.ts ../vectors/stf/disputes/tiny/progress_invalidates_avail_assignments-1.json` | [10.3](./10-disputes/03-clearing-the-cores.md) |
| `check-disputes` | `node bin/check-disputes.ts` | [10.4](./10-disputes/04-bad-verdicts.md) |

### Part 11 · Assurances

| Script | Runs | Lesson |
| --- | --- | --- |
| `available` | `node bin/available.ts` | [11.1](./11-assurances/01-available.md) |
| `available-some` | `node bin/available.ts ../vectors/stf/assurances/tiny/some_assurances-1.json` | [11.1](./11-assurances/01-available.md) |
| `release` | `node bin/release.ts` | [11.2](./11-assurances/02-timeouts.md) |
| `release-stale` | `node bin/release.ts ../vectors/stf/assurances/tiny/no_assurances_with_stale_report-1.json` | [11.2](./11-assurances/02-timeouts.md) |
| `check-assurances` | `node bin/check-assurances.ts` | [11.3](./11-assurances/03-bad-assurances.md) |

### Part 12 · Guarantees

| Script | Runs | Lesson |
| --- | --- | --- |
| `guarantors` | `node bin/guarantors.ts` | [12.1](./12-guarantees/01-who-guarantees-what.md) |
| `guarantors-prev-rotation` | `node bin/guarantors.ts ../vectors/stf/reports/tiny/report_prev_rotation-1.json` | [12.1](./12-guarantees/01-who-guarantees-what.md) |
| `reporters` | `node bin/reporters.ts` | [12.2](./12-guarantees/02-signed-and-counted.md) |
| `reporters-same-guarantors` | `node bin/reporters.ts ../vectors/stf/reports/tiny/different_core_same_guarantors-1.json` | [12.2](./12-guarantees/02-signed-and-counted.md) |
| `placed` | `node bin/placed.ts` | [12.3](./12-guarantees/03-onto-the-cores.md) |
| `placed-high-gas` | `node bin/placed.ts ../vectors/stf/reports/tiny/high_work_report_gas-1.json` | [12.3](./12-guarantees/03-onto-the-cores.md) |
| `check-guarantees` | `node bin/check-guarantees.ts` | [12.4](./12-guarantees/04-bad-guarantees.md) |

### Part 13 · Authorization

| Script | Runs | Lesson |
| --- | --- | --- |
| `pools` | `node bin/pools.ts` | [13.1](./13-authorization/01-the-authorizer-pools.md) |
| `pools-progress` | `node bin/pools.ts ../vectors/stf/authorizations/tiny/progress_authorizations-2.json` | [13.1](./13-authorization/01-the-authorizer-pools.md) |

### Part 14 · Services and preimages

| Script | Runs | Lesson |
| --- | --- | --- |
| `preimages` | `node bin/preimages.ts` | [14.1](./14-services/01-providing-preimages.md) |
| `preimages-trace` | `node bin/preimages.ts ../vectors/traces/preimages/00000008.json` | [14.1](./14-services/01-providing-preimages.md) |
| `service` | `node bin/service.ts` | [14.2](./14-services/02-the-service-account.md) |
| `service-fallback` | `node bin/service.ts ../vectors/traces/fallback/00000001.json` | [14.2](./14-services/02-the-service-account.md) |

### Part 15 · The PVM

| Script | Runs | Lesson |
| --- | --- | --- |
| `program` | `node bin/program.ts` | [15.1](./15-the-pvm/01-the-program-blob.md) |
| `program-fallback` | `node bin/program.ts ../vectors/traces/fallback/00000001.json` | [15.1](./15-the-pvm/01-the-program-blob.md) |
| `disassemble` | `node bin/disassemble.ts` | [15.2](./15-the-pvm/02-instructions.md) |
| `disassemble-fallback` | `node bin/disassemble.ts ../vectors/traces/fallback/00000001.json 0 4` | [15.2](./15-the-pvm/02-instructions.md) |
| `run` | `node bin/run.ts` | [15.3](./15-the-pvm/03-the-machine.md) |
| `memory` | `node bin/memory.ts` | [15.4](./15-the-pvm/04-memory.md) |
| `alu` | `node bin/alu.ts` | [15.5](./15-the-pvm/05-arithmetic.md) |
| `branches` | `node bin/branches.ts` | [15.6](./15-the-pvm/06-branches-and-calls.md) |
| `bits` | `node bin/bits.ts` | [15.7](./15-the-pvm/07-bits-and-bytes.md) |
| `start` | `node bin/start.ts` | [15.8](./15-the-pvm/08-a-real-program.md) |
| `costs` | `node bin/costs.ts` | [15.9](./15-the-pvm/09-what-instructions-cost.md) |
| `pipeline` | `node bin/pipeline.ts` | [15.10](./15-the-pvm/10-the-pipeline.md) |
| `gas` | `node bin/gas.ts` | [15.11](./15-the-pvm/11-the-gas-meter.md) |

### Part 16 · Host calls

| Script | Runs | Lesson |
| --- | --- | --- |
| `host` | `node bin/host.ts` | [16.1](./16-host-calls/01-calling-the-host.md) |
| `accumulate` | `node bin/accumulate.ts` | [16.7](./16-host-calls/07-a-services-inputs.md) |
| `accumulate-foreign-preimage` | `node bin/accumulate.ts ../vectors/stf/accumulate/tiny/lookup_foreign_preimage-1.json` | [16.8](./16-host-calls/08-lookup.md) |
| `accumulate-len-bound` | `node bin/accumulate.ts ../vectors/stf/accumulate/tiny/preimage_len_bound-1.json` | [16.9](./16-host-calls/09-asking-for-preimages.md) |

### Part 17 · Accumulation

| Script | Runs | Lesson |
| --- | --- | --- |
| `host-transfer` | `node bin/host.ts ../vectors/stf/accumulate/tiny/transfer_for_live_service-1.json 0` | [17.3](./17-accumulation/03-sending-a-transfer.md) |
| `accumulate-transfer` | `node bin/accumulate.ts ../vectors/stf/accumulate/tiny/transfer_for_live_service-1.json` | [17.4](./17-accumulation/04-rounds.md) |
| `host-assign` | `node bin/host.ts ../vectors/stf/accumulate/tiny/assign_from_non_assigner-3.json 0` | [17.5](./17-accumulation/05-privileges.md) |
| `host-assign-refused` | `node bin/host.ts ../vectors/stf/accumulate/tiny/assign_from_non_assigner-1.json 1` | [17.5](./17-accumulation/05-privileges.md) |
| `accumulate-assign` | `node bin/accumulate.ts ../vectors/stf/accumulate/tiny/assign_from_non_assigner-3.json` | [17.6](./17-accumulation/06-who-wins.md) |
| `host-eject` | `node bin/host.ts ../vectors/stf/accumulate/tiny/work_for_ejected_service-2.json 0` | [17.7](./17-accumulation/07-ejecting-a-service.md) |
| `host-new-service` | `node bin/host.ts ../vectors/stf/accumulate/tiny/create_service-1.json 0` | [17.8](./17-accumulation/08-creating-a-service.md) |
| `accumulate-recreate` | `node bin/accumulate.ts ../vectors/stf/accumulate/tiny/recreate_service_ejected_in_earlier_round-1.json` | [17.9](./17-accumulation/09-the-blocks-gas-budget.md) |
| `host-upgrade` | `node bin/host.ts ../vectors/stf/accumulate/tiny/upgrade_service-1.json 0` | [17.10](./17-accumulation/10-upgrading-a-service.md) |
| `accumulate-ejected` | `node bin/accumulate.ts ../vectors/stf/accumulate/tiny/work_for_ejected_service-3.json` | [17.11](./17-accumulation/11-what-a-service-yields.md) |
| `host-provide-1` | `node bin/host.ts ../vectors/stf/accumulate/tiny/provide_preimage-1.json 0` | [17.12](./17-accumulation/12-providing-a-preimage.md) |
| `host-provide-2` | `node bin/host.ts ../vectors/stf/accumulate/tiny/provide_preimage-2.json 0` | [17.12](./17-accumulation/12-providing-a-preimage.md) |
| `host-bless` | `node bin/host.ts ../vectors/stf/accumulate/tiny/bless_from_non_manager-1.json 1` | [17.13](./17-accumulation/13-blessing-and-designating.md) |
| `host-designate` | `node bin/host.ts ../vectors/stf/accumulate/tiny/designate_with_invalid_count-1.json 0` | [17.13](./17-accumulation/13-blessing-and-designating.md) |

### Part 18 · Statistics

| Script | Runs | Lesson |
| --- | --- | --- |
| `statistics` | `node bin/statistics.ts` | [18.1](./18-statistics/01-who-did-what.md) |
| `activity` | `node bin/activity.ts` | [18.2](./18-statistics/02-what-cores-and-services-did.md) |
| `activity-some` | `node bin/activity.ts ../vectors/stf/assurances/tiny/some_assurances-1.json` | [18.2](./18-statistics/02-what-cores-and-services-did.md) |

### Part 19 · Block import

| Script | Runs | Lesson |
| --- | --- | --- |
| `plan` | `node bin/plan.ts` | [19.1](./19-block-import/01-the-order-of-things.md) |
| `whole-state` | `node bin/whole-state.ts` | [19.2](./19-block-import/02-the-whole-state.md) |
| `import` | `node bin/import.ts` | [19.4](./19-block-import/04-importing-a-block.md) |

### Part 20 · Facing the fuzzer

| Script | Runs | Lesson |
| --- | --- | --- |
| `fuzz` | `node bin/fuzz.ts` | [20.3](./20-facing-the-fuzzer/03-a-session.md) |
| `target` | `node bin/target.ts` | [20.4](./20-facing-the-fuzzer/04-ready-to-be-fuzzed.md) |
| `target-tiny` | `JAM_FUZZ=1 JAM_FUZZ_SPEC=tiny JAM_FUZZ_DATA_PATH=/tmp/jam JAM_FUZZ_SOCK_PATH=/tmp/jam/fuzz.sock node bin/target.ts` | [20.4](./20-facing-the-fuzzer/04-ready-to-be-fuzzed.md) |
| `fuzz-target` | `node bin/fuzz.ts safrole /tmp/jam/fuzz.sock` | [20.4](./20-facing-the-fuzzer/04-ready-to-be-fuzzed.md) |

<!-- end of every script -->
