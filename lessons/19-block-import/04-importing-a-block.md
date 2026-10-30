# Importing a block

Everything is in place: every step of a block, the whole state, and accounts the host calls
can work on. This lesson puts them together into Υ: give it the state before a block and
the block, and it gives back the state after, or the reason it refuses the block. Then the
official traces check it, as hard as anything can be checked: the state root after every
block must be the trace's, every byte of the state accounted for. By the end of this
lesson the `fallback` and `safrole` traces import, all 200 blocks, every root right.

## New words

- **Header checks.** The checks a header must pass before anything else runs: its parent is
  the newest block the state remembers, its state root is the state's, its slot comes later,
  and its extrinsic hash is its extrinsic's. *Example:* a block whose parent is some other
  block is refused with `bad_parent`.
- **Chained import.** Importing a trace block after block, each into the state your client
  made from the one before, from the first state on. *Example:* `bin/import.ts`.

Both are in the [glossary](../glossary.md).

## What the Gray Paper says

§4: Υ(σ, B) = σ′, a block is valid only if every rule in every part holds, and the state
after it is every step's result, in [lesson 19.1](./01-the-order-of-things.md)'s waves. In plain steps, as your client runs
them:

1. **The header** (§5): its parent and its state root, its slot after the state's τ, its
   extrinsic hash ([lesson 5.2](../05-hashing-and-signatures/02-the-extrinsic-hash.md)).
2. **Disputes** ([Part 10](../10-disputes/index.md)): ψ′, and ρ† without the reports judged bad or wonky.
3. **Safrole** ([Part 8](../08-safrole/index.md)): η′, the validators, γ′; the header's three marks must be the ones
   Safrole makes, and its seal must check out.
4. **Assurances** ([Part 11](../11-assurances/index.md)): 𝐑, the reports now available, and ρ‡.
5. **Guarantees** ([Part 12](../12-guarantees/index.md)): checked, then on their cores: ρ′.
6. **Accumulation** ([Part 17](../17-accumulation/index.md)): the accounts, χ′, ι′, ϕ′, ω′, ξ′, θ′, and what it did.
7. **The rest**: β′ ([Part 9](../09-recent-history/index.md)), α′ ([Part 13](../13-authorization/index.md)), π′ ([Part 18](../18-statistics/index.md)), and last δ′, the preimages provided
   ([lesson 14.1](../14-services/01-providing-preimages.md)).

If any step refuses the block, the block is refused whole, and the state stays as it was
([lesson 11.3](../11-assurances/03-bad-assurances.md)'s rejected block). The traces name no errors, so the reasons are the vectors' names
where a vector has one, and your client's own otherwise.

Break something and see where Υ stops:

<ImportSteps />

## The tests

Each trace step has the state before a block, the block, and the state after. Importing
one is the scoreboard's job too, at the end of this lesson, so the helper goes in
`test/families.ts`:

**Add to** `test/families.ts`

```ts
import { importBlock } from "../src/import.ts";
import { Block } from "../src/block.ts";
import { TINY } from "../src/config.ts";

/** One step of a block-import trace: the state before, the block, the state after. */
type TraceStep = {
  pre_state: { state_root: string; keyvals: { key: string; value: string }[] };
  block: unknown;
  post_state: { state_root: string };
};

/** Block n of a trace, imported into the state before it: the state root it ends with (or
 * why it was refused), and the root the trace says comes next. */
export function importTrace(family: string, n: number) {
  const name = `traces/${family}/${String(n).padStart(8, "0")}.json`;
  const trace = vectorJson(name) as TraceStep;
  const before: KeyValue[] = trace.pre_state.keyvals.map((e) => ({
    key: fromHex(e.key),
    value: fromHex(e.value),
  }));
  const after = importBlock(TINY, before, Block(TINY).fromJson(trace.block));
  const root: string = "error" in after ? after.error : toHex(stateRoot(after));
  const refused = trace.post_state.state_root === trace.pre_state.state_root;
  return { root, expected: refused ? "refused" : trace.post_state.state_root, after };
}
```

**Add to** `test/import.test.ts`

```ts
import { importBlock } from "../src/import.ts";
import type { Refused } from "../src/import.ts";
import { Block } from "../src/block.ts";
import type { Header } from "../src/block.ts";
import { TINY } from "../src/config.ts";
import type { KeyValue } from "../src/trie.ts";
import { importTrace } from "./families.ts";
import { traceState } from "./vectors.ts";

test("Υ on every block of the fallback and safrole traces: each state root, as the trace's", () => {
  for (const family of ["fallback", "safrole"]) {
    for (let n = 1; n <= 100; n++) {
      const { root, expected } = importTrace(family, n);
      assert.equal(root, expected, `${family} block ${n}`);
    }
  }
});

test("a block that isn't the next one is refused, and the state stays as it was", () => {
  const { entries, block } = traceState("fallback", 10);
  const next: Block = Block(TINY).fromJson(block);
  const stale: Header = { ...next.header, parent: new Uint8Array(32) }; // not block 9
  const result: KeyValue[] | Refused = importBlock(TINY, entries, { ...next, header: stale });
  assert.deepEqual(result, { error: "bad_parent" });
});
```

`importTrace` imports one block of a trace into the trace's own state before it, and
returns the root your client ends with next to the trace's. A block the trace refuses
leaves the root as it was, so `expected` says "refused" then.

And a stub that refuses everything:

**Add to** `src/import.ts`

```ts
import type { Config } from "./config.ts";
import type { Block } from "./block.ts";
import type { KeyValue } from "./trie.ts";

/** A block refused: the rule it breaks, as the test vectors name it. */
export type Refused = { error: string };

/** Υ, for now: every block refused. */
export function importBlock(
  config: Config,
  entries: KeyValue[],
  block: Block,
): KeyValue[] | Refused {
  return { error: "not written yet" };
}
```

**Run, expect it to fail**

```sh
npm test
```

```text
...
✖ Υ on every block of the fallback and safrole traces: each state root, as the trace's (1.746875ms)
✖ a block that isn't the next one is refused, and the state stays as it was (1.300791ms)
...
ℹ tests 645
ℹ suites 0
ℹ pass 643
ℹ fail 2
...
  AssertionError [ERR_ASSERTION]: fallback block 1
  + actual - expected

  + 'not written yet'
  - '0x48dc323d05aa152a53fb4f38b690d8198994f9fdb86bf1a6300b306cc79f86f9'
...
```

## The code

Υ itself, short, because each step is a function of its own:

**Replace in** `src/import.ts`

```ts
import { readState, writeState } from "./whole-state.ts";
import { accumulateBlock } from "./accumulate.ts";
import { providePreimages } from "./services.ts";

/** A block refused: the rule it breaks, as the test vectors name it. */
export type Refused = { error: string };

/**
 * Υ (GP §4): imports a block into a state, given as its entries. The state after the
 * block, as entries; or why the block is refused, and then the state stays as it was.
 * The steps are the earlier parts', each after everything it needs (lesson 19.1's waves).
 */
export function importBlock(
  config: Config,
  entries: KeyValue[],
  block: Block,
): KeyValue[] | Refused {
  const state = readState(config, entries);
  const headerProblem = checkHeader(config, state, entries, block);
  if (headerProblem) return { error: headerProblem };
  const judged = judgeDisputes(config, state, block); // ψ′, ρ†
  if (refused(judged)) return judged;
  const sealed = runSafrole(config, state, block, judged.judgements.offenders); // γ′, η′, κ′...
  if (refused(sealed)) return sealed;
  const assured = takeAssurances(state, block, judged.cores, sealed.validators.active); // 𝐑, ρ‡
  if (refused(assured)) return assured;
  const offenders = judged.judgements.offenders; // ψ′_O
  const guaranteed = takeGuarantees(config, state, block, assured.cores, sealed, offenders); // ρ′
  if (refused(guaranteed)) return guaranteed;
  const slot = block.header.slot; // τ′
  const accumulation = accumulateBlock(
    config, accumulationState(state, sealed.entropy[0]), slot, assured.reports,
  );
  const after = nextState(config, state, block, {
    judgements: judged.judgements, sealed, assured, guaranteed, accumulation,
  });
  return providePreimages(writeState(config, after), block.extrinsic.preimages, slot); // δ′
}
```

Each step returns either what it made or `{ error }`, and `refused` tells which, so Υ
stops at the first refusal. The header comes first, since nothing else is worth checking
for a block that isn't the next one:

**Add to** `src/import.ts`

```ts
import { toHex } from "./bytes.ts";
import { extrinsicHash } from "./block.ts";
import { stateRoot } from "./trie.ts";
import type { State } from "./whole-state.ts";

/** Whether a step refused the block. */
const refused = (x: object): x is Refused => "error" in x;

/**
 * The header's own checks (GP §5): its parent is the newest block the state remembers, the
 * state root before it is the state's, its slot is after the parent's and its extrinsic
 * hash is its extrinsic's.
 */
export function checkHeader(
  config: Config,
  state: State,
  entries: KeyValue[],
  block: Block,
): string | null {
  const { header, extrinsic } = block;
  const parent = state[3].history.at(-1);
  if (parent && toHex(parent.header_hash) !== toHex(header.parent)) return "bad_parent";
  if (toHex(stateRoot(entries)) !== toHex(header.parent_state_root)) return "bad_parent_state_root";
  if (header.slot <= state[11]) return "bad_slot";
  if (toHex(extrinsicHash(config, extrinsic)) !== toHex(header.extrinsic_hash)) {
    return "bad_extrinsic_hash";
  }
  return null;
}
```

Then disputes, Safrole, the assurances and the guarantees, each the earlier part's
functions in a row:

**Add to** `src/import.ts`

```ts
import type { Bytes } from "./bytes.ts";
import { disputesError, judges, outcome, recordVerdicts, recordOffenders, clearJudged, offendersMark } from "./disputes.ts";
import type { Safrole } from "./safrole.ts";
import { safroleError, safroleStep, sealError } from "./safrole.ts";
import { vrfOutput } from "./bandersnatch.ts";
import { encode, fixedBytes, option, seq, seqN } from "./codec/codec.ts";
import type { Codec } from "./codec/codec.ts";
import { EpochMark, TicketBody } from "./block.ts";
import { assuranceError, availableCores, nowAvailable, clearCores } from "./assurances.ts";
import type { PendingReport } from "./cores.ts";
import { placeReports } from "./cores.ts";
import { ValidatorKey } from "./state.ts";
import { guarantorAssignments, guaranteeError, reportError } from "./guarantors.ts";

/** ψ′ and ρ† (Part 10): the block's disputes judged, and the cores without the reports
 * found bad or wonky. */
function judgeDisputes(config: Config, state: State, block: Block) {
  const disputes = block.extrinsic.disputes;
  const [time, active, previous] = [state[11], state[8], state[9]];
  const error = disputesError(config, disputes, state[5], time, active, previous);
  if (error) return { error };
  const judged = disputes.verdicts.map((v) => {
    const voters = judges(config, time, v.age, active, previous).length;
    return { target: v.target, outcome: outcome(v, voters) };
  });
  const judgements = recordOffenders(recordVerdicts(state[5], judged), disputes); // ψ′
  return { judgements, cores: clearJudged(state[10], judged) };
}

/** Safrole (Part 8): η′, the validators and γ′ after the block, once its tickets, its
 * header's marks and its seal all check out. */
function runSafrole(config: Config, state: State, block: Block, offenders: Bytes[]) {
  const { header, extrinsic } = block;
  const before: Safrole = {
    time: state[11],
    entropy: state[6],
    validators: {
      staging: state[7], pending: state[4].pending, active: state[8], previous: state[9],
    },
    accumulator: state[4].accumulator,
    sealers: state[4].sealers,
    ringRoot: state[4].ring_root,
  };
  const error = safroleError(config, before, header.slot, extrinsic.tickets, offenders);
  if (error) return { error };
  const output = vrfOutput(header.entropy_source);
  const step = safroleStep(config, before, header.slot, output, offenders, extrinsic.tickets);
  if (!sameValue(option(EpochMark), header.epoch_mark, step.epochMark)) {
    return { error: "bad_epoch_mark" };
  }
  const marks = option(seqN(TicketBody, config.epoch_length));
  if (!sameValue(marks, header.tickets_mark, step.ticketsMark)) {
    return { error: "bad_tickets_mark" };
  }
  const convicted = offendersMark(extrinsic.disputes);
  if (!sameValue(seq(fixedBytes(32)), header.offenders_mark, convicted)) {
    return { error: "bad_offenders_mark" };
  }
  const after = step.after;
  const author = after.validators.active[header.author_index]?.bandersnatch;
  if (!author) return { error: "bad_validator_index" };
  const sealProblem = sealError(config, header, author, after.sealers, after.entropy[3]);
  return sealProblem ? { error: sealProblem } : after;
}

/** Whether two values encode to the same bytes: how a header's marks are compared. */
function sameValue<T>(codec: Codec<T>, x: T, y: T): boolean {
  return toHex(encode(codec, x)) === toHex(encode(codec, y));
}

/** The assurances (Part 11): the reports that became available, 𝐑, and the cores
 * without them, or the ones that timed out, ρ‡. */
function takeAssurances(
  state: State,
  block: Block,
  cores: (PendingReport | null)[], // ρ†
  validators: ValidatorKey[], // κ′
) {
  const assurances = block.extrinsic.assurances;
  const keys = state[8].map((k) => k.ed25519);
  const error = assuranceError(assurances, block.header.parent, keys, cores);
  if (error) return { error };
  const available = availableCores(cores, assurances, state[8].length);
  const reports = nowAvailable(cores, assurances, state[8].length); // 𝐑
  const resized = state[8].length !== validators.length;
  return { reports, cores: clearCores(cores, available, block.header.slot, resized) };
}

/** The guarantees (Part 12): checked against the cores, the guarantors and the recent
 * history, then their reports take their cores, ρ′. */
function takeGuarantees(
  config: Config,
  state: State,
  block: Block,
  cores: (PendingReport | null)[], // ρ‡
  sealed: Safrole, // for η′, κ′ and λ′
  offenders: Bytes[], // ψ′_O
) {
  const { guarantees } = block.extrinsic;
  const { slot } = block.header;
  const { entropy, validators } = sealed;
  const assignments = guarantorAssignments(
    config, slot, entropy, validators.active, validators.previous, offenders,
  );
  const count = validators.active.length;
  const error = guaranteeError(config, guarantees, slot, assignments, cores, state[1], count);
  if (error) return { error };
  const reports = guarantees.map((g) => g.report); // 𝐈
  const problem = reportError(reports, state[3].history, pipeline(state), services(state));
  if (problem) return { error: problem };
  return { cores: placeReports(cores, guarantees, slot), reports };
}
```

```ts
  if (!sameValue(option(EpochMark), header.epoch_mark, step.epochMark)) {
```

Safrole makes the marks this block's header must carry ([lesson 8.5](../08-safrole/05-one-step-of-safrole.md)), and the header carries
its own. They must be the same, byte for byte, which `sameValue` compares: two `null` values
encode the same, and so do two equal marks.

The report checks need two things the test vectors used to hand over: the packages
already on their way, and what each service needs:

**Add to** `src/import.ts`

```ts
import type { ServiceNeeds } from "./guarantors.ts";

/** The packages already on their way through (GP §11): accumulated recently, waiting in
 * the ready queue, or pending on a core. None of them may be reported again. */
function pipeline(state: State): Set<string> {
  const accumulated = state[15].flat().map(toHex);
  const waiting = state[14].flat().map((w) => toHex(w.report.package_spec.hash));
  const pending = state[10].flatMap((p) => (p ? [p.guarantee.report.package_spec.hash] : []));
  return new Set([...accumulated, ...waiting, ...pending.map(toHex)]);
}

/** What the guarantee checks need of each service: its code hash and least item gas. */
function services(state: State): Map<number, ServiceNeeds> {
  return new Map([...state.accounts].map(([s, a]) => [s, a.info]));
}
```

Then accumulation's state, made from the whole state and η′₀, and everything after it:

**Add to** `src/import.ts`

```ts
import { fromHex } from "./bytes.ts";
import { decode } from "./codec/codec.ts";
import { headerHash } from "./block.ts";
import type { AccumulationState } from "./accumulate.ts";
import { outputsRoot } from "./accumulate.ts";
import { recordBlock } from "./history.ts";
import { reportedPackages } from "./cores.ts";
import { nextPools, usedAuthorizers } from "./authorization.ts";
import { updateValidatorStats, coreStats, serviceStats } from "./statistics.ts";
import type { PastJudgements } from "./disputes.ts";
import type { WorkReport } from "./work.ts";

/** The state accumulation reads (lesson 17.2), from the whole state, and η′₀. */
function accumulationState(state: State, entropy: Bytes): AccumulationState {
  const privileges = state[12];
  return {
    slot: state[11],
    accounts: state.accounts,
    free: new Map(privileges.always_acc.map((x) => [x.id, x.gas])),
    privileges: {
      bless: privileges.bless,
      assign: privileges.assign,
      designate: privileges.designate,
      register: privileges.register,
    },
    entropy,
    ready: state[14].map((slot) =>
      slot.map((w) => ({ report: w.report, dependencies: new Set(w.dependencies.map(toHex)) })),
    ),
    accumulated: state[15].map((packages) => new Set(packages.map(toHex))),
  };
}

/** What the steps made, for the state after the block. */
type Made = {
  judgements: PastJudgements; // ψ′
  sealed: Safrole;
  assured: { reports: WorkReport[] };
  guaranteed: { cores: (PendingReport | null)[]; reports: WorkReport[] };
  accumulation: ReturnType<typeof accumulateBlock>;
};

/** σ′ but for δ′'s preimages: every component after the block, from what the steps made,
 * and β′, α′ and π′, which come last. */
function nextState(config: Config, state: State, block: Block, made: Made): State {
  const { header, extrinsic } = block;
  const { sealed, accumulation } = made;
  const after = accumulation.state;
  const recent = recordBlock(state[3], {
    header_hash: headerHash(config, header),
    parent_state_root: header.parent_state_root,
    accumulate_root: outputsRoot(accumulation.outputs),
    slot: header.slot,
    work_packages: reportedPackages(extrinsic.guarantees),
  }); // β′
  const queues = state[2].map((q, c) => accumulation.queues.get(c) ?? q); // ϕ′
  const used = usedAuthorizers(extrinsic.guarantees);
  const statsBefore = { slot: state[11], current: state[13].vals_curr, last: state[13].vals_last };
  const validatorStats = updateValidatorStats(
    config, statsBefore, header.slot, header.author_index, extrinsic, sealed.validators.active,
  );
  const incoming = made.guaranteed.reports;
  const activity = serviceStats(incoming, extrinsic.preimages, accumulation.statistics);
  const byId = <T>(m: Map<number, T>) => [...m].sort(([x], [y]) => x - y);
  const staging = accumulation.staging?.map((k) => decode(ValidatorKey, k)); // ι′, if chosen
  return {
    ...state,
    1: nextPools(state[1], queues, used, header.slot), // α′
    2: queues,
    3: recent,
    4: {
      pending: sealed.validators.pending,
      ring_root: sealed.ringRoot,
      sealers: sealed.sealers,
      accumulator: sealed.accumulator,
    },
    5: made.judgements,
    6: sealed.entropy,
    7: staging ?? sealed.validators.staging,
    8: sealed.validators.active,
    9: sealed.validators.previous,
    10: made.guaranteed.cores,
    11: header.slot,
    12: {
      ...after.privileges,
      always_acc: byId(after.free).map(([id, gas]) => ({ id, gas })),
    },
    13: {
      vals_curr: validatorStats.current,
      vals_last: validatorStats.last,
      cores: coreStats(config, incoming, made.assured.reports, extrinsic.assurances),
      services: byId(activity).map(([id, record]) => ({ id, record })),
    },
    14: after.ready.map((waiting) =>
      waiting.map((w) => ({ report: w.report, dependencies: [...w.dependencies].map(fromHex) })),
    ),
    15: after.accumulated.map((packages) => [...packages].map(fromHex)),
    16: accumulation.outputs,
    accounts: after.accounts,
  };
}
```

`nextState` is the state after the block but for δ′'s preimages, which Υ adds last, on the
entries: [lesson 14.1](../14-services/01-providing-preimages.md)'s `providePreimages` already works on them. The service ids in χ_Z and
π_S go in order, as a dictionary encodes them; so does everything else, since each
earlier part made its piece in the Gray Paper's order.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ Υ on every block of the fallback and safrole traces: each state root, as the trace's (3796.79875ms)
✔ a block that isn't the next one is refused, and the state stays as it was (1.238458ms)
...
ℹ tests 645
ℹ suites 0
ℹ pass 645
ℹ fail 0
...
reported 645 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791773644549
...
```

Two hundred real blocks: every one's state root is the trace's.

## Watch it

The tests import each block into the trace's own state before it. `bin/import.ts` goes
further: from the trace's first state on, each block goes into the state *your client*
made from the one before. Any byte wrong anywhere would carry on, and every root after it
would be wrong.

**New file** `bin/import.ts`

```ts
// Imports a whole block-import trace, block after block, each into the state your client
// made from the one before: from the trace's first state on, nothing else is taken from
// the trace but its blocks. Each state root is shown next to the trace's.
// Usage: npm run import [family], "storage_light" if not given

import { Block } from "../src/block.ts";
import { fromHex, toHex } from "../src/bytes.ts";
import { TINY } from "../src/config.ts";
import { importBlock } from "../src/import.ts";
import { Run } from "../src/obs.ts";
import type { KeyValue } from "../src/trie.ts";
import { stateRoot } from "../src/trie.ts";
import { vectorJson } from "../test/vectors.ts";

type TraceStep = {
  pre_state: { keyvals: { key: string; value: string }[] };
  block: unknown;
  post_state: { state_root: string };
};

const family = process.argv[2] ?? "storage_light";
const step = (n: number) =>
  vectorJson(`traces/${family}/${String(n).padStart(8, "0")}.json`) as TraceStep;
let state: KeyValue[] = step(1).pre_state.keyvals.map((e) => ({
  key: fromHex(e.key),
  value: fromHex(e.value),
}));
const run = new Run("import");
let matched = 0;
for (let n = 1; n <= 100; n++) {
  const { block, post_state } = step(n);
  const header = Block(TINY).fromJson(block).header;
  const result = importBlock(TINY, state, Block(TINY).fromJson(block));
  if (!("error" in result)) state = result; // a refused block leaves the state as it was
  const root = toHex(stateRoot(state));
  const same = root === post_state.state_root;
  if (same) matched++;
  const what = "error" in result ? `refused: ${result.error}` : "imported";
  const compared = `root ${root.slice(0, 10)}… ${same ? "=" : "≠"} the trace's`;
  console.log(`block ${n}, slot ${header.slot}: ${what}; ${compared}`);
  run.event("block", { n, slot: header.slot, what, root: root.slice(0, 10), same });
}
console.log(`${matched} of 100 state roots as the trace's`);
run.event("done", { family, matched });
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

**What flows through it.** The three faces of the run, at its first block — after this
one, the trace's states are never touched again, only its blocks:

::: code-group

```json [what goes in]
{
  "pre_state": { "keyvals": [ "… block 1's 21 pairs: the only state ever taken …" ] },
  "block": { "header": {
    "slot": 1,
    "parent": "0x245becfe…",
    "parent_state_root": "0xd6e78dc0…",
    "author_index": 0,
    "entropy_source": "0x62bc9d23…",
    "seal": "0x39ca4523…"
  }, "extrinsic": "… empty: no tickets, preimages, guarantees, assurances, disputes …" },
  "post_state": { "state_root": "0x48dc323d…" }
}
```

```ts [what it computes]
// importBlock, then stateRoot, for block 1
const computed = {
  checks: "header first", // parent known, slot later, state root the state's (19.4's rules)
  imported: true, // every wave of the plan runs; the new state replaces the old
  root: "0x48dc323d…", // stateRoot(state): the whole state merklized, lesson 6.1
  same: true, // it equals the trace's post_state.state_root, byte for byte
};
```

```text [what comes out]
block 1, slot 1: imported; root 0x48dc323d… = the trace's
100 of 100 state roots as the trace's
```

:::

Read the input into the output: the header's checks pass (its `parent_state_root`
fingerprints the 21-pair pre-state your client holds), the empty extrinsic flows through
every wave, and the root your client computes from its *own* new state — `0x48dc323d…`
— must equal the trace's `post_state.state_root`. From block 2 on, the comparison is the
only thing taken from the trace: the state is yours.

**Run**

```sh
npm pkg set scripts.import="node bin/import.ts"
npm run import safrole
```

```text
block 1, slot 1: imported; root 0x48dc323d… = the trace's
block 2, slot 2: imported; root 0x99275d5f… = the trace's
block 3, slot 3: imported; root 0x391b7afd… = the trace's
...
block 98, slot 98: imported; root 0x797484f7… = the trace's
block 99, slot 99: imported; root 0xd05254e8… = the trace's
block 100, slot 100: imported; root 0x109f30f2… = the trace's
100 of 100 state roots as the trace's
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=import-1791773655822
```

All 100: tickets entered, epochs changed, seals checked, and the same root at every step.
The *Block import* panel, on **7 · Accumulation and import**, has each block.

![Block import panel](./images/04-block-import.png)

## The scoreboard

A trace step runs whole when your client ends at the trace's state root, or refuses the
block the trace refuses. The root is the whole state in 32 bytes ([Part 6](../06-state-and-merklization/index.md)): if it
matches, every key and value does. Your client imports two trace families so far:

**Add to** `test/families.ts`

```ts
/** A block-import trace step: the block imported to the trace's state root, or refused
 * when the trace refuses it, for whatever reason (a trace doesn't say which rule). */
function checkTrace(name: string) {
  const [, family, file] = name.split("/");
  const { root, expected, after } = importTrace(family, Number(file.replace(".json", "")));
  if (expected === "refused" && "error" in after) return;
  assert.equal(root, expected, `${root.slice(0, 18)}, not ${expected.slice(0, 18)}`);
}
```

**Replace in** `test/families.ts`

```ts
/** Every family your client runs so far. */
export const FAMILIES: Family[] = [
  { folders: ["codec/tiny", "codec/full"], check: checkCodec },
  { folders: ["trie"], check: checkTrie },
  { folders: ["shuffle"], check: checkShuffle },
  { folders: ["stf/safrole/tiny", "stf/safrole/full"], check: checkSafrole },
  { folders: ["stf/history/tiny", "stf/history/full"], check: checkHistory },
  { folders: ["stf/disputes/tiny", "stf/disputes/full"], check: checkDisputes },
  { folders: ["stf/assurances/tiny", "stf/assurances/full"], check: checkAssurances },
  { folders: ["stf/reports/tiny", "stf/reports/full"], check: checkReports },
  { folders: ["stf/authorizations/tiny", "stf/authorizations/full"], check: checkAuthorizations },
  { folders: ["stf/preimages/tiny", "stf/preimages/full"], check: checkPreimages },
  { folders: ["stf/accumulate/tiny", "stf/accumulate/full"], check: checkAccumulate },
  { folders: ["stf/statistics/tiny", "stf/statistics/full"], check: checkStatistics },
  { folders: ["traces/fallback", "traces/safrole"], check: checkTrace },
];
```

The milestone's vectors are the traces. Here is the first block of `fallback`, trimmed to what the importer reads and checks, and the board's rows for the two traces:

::: code-group

```json [what goes in]
{
  "vector": "vectors/traces/fallback/00000001.json",
  "pre_state.state_root": "0xd6e78dc0…",
  "block.header": {
    "slot": 1,
    "parent": "0x245becfe…",
    "parent_state_root": "0xd6e78dc0…",
    "author_index": 0,
    "seal": "0x39ca4523…"
  },
  "post_state.state_root": "0x48dc323d…"
}
```

```text [console]
traces/fallback        100 of 100  ✔
traces/safrole         100 of 100  ✔

606 of 1,428 vectors pass.
```

:::

*Run whole* for a trace block: import the block into the state before it, with every rule, and your client's state root must be `post_state.state_root`. The header's `parent_state_root` is the root before the block, the same root `pre_state` starts at. A hundred blocks of `fallback` and a hundred of `safrole` do that in a row.

**Run**

```sh
npm run typecheck
npm run scoreboard
```

```text
...
The official test vectors, each run whole by your client:

codec                    30 of 30  ✔
erasure                  not run yet (12)
shuffle                    1 of 1  ✔
stf/accumulate         126 of 126  ✔
stf/assurances           22 of 22  ✔
stf/authorizations         6 of 6  ✔
stf/disputes             60 of 60  ✔
stf/history                8 of 8  ✔
stf/preimages             6 of 16
    ✘ stf/preimages/full/preimage_not_needed-1.json: accepted, not preimage_unneeded
    ✘ stf/preimages/full/preimage_not_needed-2.json: accepted, not preimage_unneeded
    ✘ stf/preimages/full/preimages_order_check-1.json: accepted, not preimages_not_sorted_unique
    … and 7 more
stf/reports              92 of 92  ✔
stf/safrole              46 of 46  ✔
stf/statistics             8 of 8  ✔
traces/fallback        100 of 100  ✔
traces/fuzzy             not run yet (200)
traces/fuzzy_light       not run yet (200)
traces/preimages         not run yet (100)
traces/preimages_light   not run yet (100)
traces/safrole         100 of 100  ✔
traces/storage           not run yet (100)
traces/storage_light     not run yet (100)
trie                       1 of 1  ✔

606 of 1,428 vectors pass.
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=scoreboard-1791939969821
```

> [!TIP] Milestone
> **The first block-import traces.** All 200 blocks of `fallback` and
> `safrole`, each imported into the state before it with every rule your client knows,
> ending at the trace's state root.

<details>
<summary>lasair: the same order, in <code>conformance/trace_runner.ml</code></summary>

```ocaml
  (* Disputes FIRST (GP 0.8.0 judgments.tex + the overview dependency graph):
     verdict ages are judged against the PRIOR epoch with the prior kappa/lambda,
     and psi' depends only on (E_D, psi). The rest of the block is validated
     against the post-disputes state: assurance bits against rho-dagger, new
     guarantees against rho-double-dagger (from rho-dagger), and every Phi
     (guarantor keys, the epoch mark, the ticket ring) nulls the POSTERIOR
     offenders psi'_o. An invalid block -- disputes or otherwise -- is rejected
     wholesale (post == pre; the caller answers with an Error). *)
```

The comment at the top of lasair's `import_block`, and the reason your `importBlock` runs
`judgeDisputes` before anything else: the offenders it finds, ψ′_O, are who Safrole and the
guarantor assignments leave out. After it, lasair goes step by step through one long
function, each `let state = …` handing the next step the state the last one left. Its steps
change the state's entries as they go; yours make values, and `nextState` puts them
together once, at the end.

</details>

## Check your understanding

::: check
**A header's `parent_state_root` is checked against the root of which state?**

- [x] The state before the block, the one it's being imported into
  > Yes: its parent block left that state, and the header names its root. A header
  > naming another root is refused with `bad_parent_state_root`.
- [ ] The state after the block
  > No: that state records this header's hash, in β′. A header can't carry the root
  > of a state made from its own hash.
- [ ] The genesis state
  > No: only block 1 builds on genesis. Every later block names the state its own
  > parent left.

**Disputes and Safrole run fine, then the guarantees refuse the block. What state does Υ give back?**

- [ ] The state with the disputes and Safrole applied, up to where it stopped
  > No: a block is valid only if every rule holds. There is no half a block.
- [ ] The state with only the slot moved on
  > No: the slot is part of the block too. A refused block doesn't move τ.
- [x] None: the block is refused whole, and the state stays as it was
  > Yes: Υ stops at the first refusal and returns the reason. The entries it was
  > given are untouched.

**The traces name no errors. How does a test know the trace refuses a block?**

- [ ] The block's header carries a flag saying it's bad
  > No: a bad block looks like any other. That's the point: your client has to find
  > what's wrong.
- [x] The trace's state root after the block is its root before it
  > Yes: a good block always changes the state. Its slot must be later than τ, and
  > τ′ is its slot, so the root moves.
- [ ] Its extrinsic is empty
  > No: all 100 `fallback` blocks have empty extrinsics, and every one imports.

**Why does Υ judge the disputes before it runs Safrole?**

- [ ] The Gray Paper's list puts disputes first
  > No: the list puts γ′ third and ψ′ seventh. The order comes from what's made from
  > what.
- [x] Safrole is made from ψ′: the offenders it finds are kept out
  > Yes: γ′ ≺ (…, ψ′). The offenders the disputes convict are left out of the next
  > validator keys, and of the guarantor assignments too.
- [ ] Disputes are the cheapest step, so they weed out bad blocks fastest
  > No: cost doesn't decide the order. The header checks go first, since nothing
  > else is worth checking for a block that isn't the next one. The disputes go next
  > because Safrole needs them.

**`bin/import.ts` imports each block into the state your client made, not the trace's. Why is that the harder test?**

- [ ] It runs more blocks
  > No: both run a trace's 100 blocks. The difference is which state each block goes
  > into.
- [x] A wrong byte anywhere carries on, and every root after it would be wrong
  > Yes: from the first state on, nothing comes from the trace but its blocks. All
  > 100 roots matching means every state your client made was right.
- [ ] It checks every byte of every state, where the test only checks the root
  > No: both check only the root. The root is the whole state in 32 bytes, so that's
  > every byte anyway.
:::

## What you have

Υ, on real blocks: the `fallback` and `safrole` traces, 200 blocks, each root exactly the
trace's, chained from genesis, and both families whole on the scoreboard. Those blocks carry no work. The `storage` and `preimages`
traces do, and they find two things your client still gets wrong: [lesson 19.5](./05-work-on-the-chain.md).

Next: [19.5 Work on the chain](./05-work-on-the-chain.md)
