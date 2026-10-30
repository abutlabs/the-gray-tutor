# Blocks to refuse

The last two traces come from the conformance fuzzer's own service: work-packages with
random work, and in `fuzzy`, a few blocks that must be refused. An importer that takes a
bad block is as wrong as one that refuses a good one. This lesson runs them, finds one
last difference from the traces, in an out-of-gas rule [lesson 16.3](../16-host-calls/03-growing-the-heap.md) kept as the Gray Paper
wrote it, and ends with your client importing the first 100 blocks of all eight traces,
800 blocks, chained, and refusing exactly the three bad ones among them; the scoreboard
checks all 1,000 steps, one at a time, and all seven bad blocks. That's a block importer: JAM's first milestone.

## New words

- **Fuzzy trace.** A block-import trace made with a service that does random work, from the
  conformance fuzzer's tool kit, with some blocks meant to be refused. *Example:* `fuzzy`
  blocks 37 to 39, each refused with `bad_code_hash`.
- **Worker thread.** A second program running beside the first in the same process, with
  memory of its own, that talks to it by messages. *Example:* the scoreboard runs one per
  processor, each checking vectors.

Both are in the [glossary](../glossary.md).

## The tests

The blocks around `fuzzy`'s three bad ones, and the first 25 of `fuzzy_light`:

**Add to** `test/import.test.ts`

```ts
test("blocks the fuzzy trace refuses, and the ones around them", () => {
  const refused: string[] = [];
  for (let n = 30; n <= 41; n++) {
    const { root, expected, after } = importTrace("fuzzy", n);
    if ("error" in after) refused.push(`${n}: ${after.error}`);
    else assert.equal(root, expected, `fuzzy block ${n}`);
  }
  assert.deepEqual(refused, ["37: bad_code_hash", "38: bad_code_hash", "39: bad_code_hash"]);
});

test("Υ on the first 25 blocks of the fuzzy_light trace", () => {
  for (let n = 1; n <= 25; n++) {
    const { root, expected } = importTrace("fuzzy_light", n);
    assert.equal(root, expected, `fuzzy_light block ${n}`);
  }
});
```

**Run, expect it to fail**

```sh
npm test
```

```text
...
ℹ tests 648
ℹ suites 0
ℹ pass 647
ℹ fail 1
...
  AssertionError [ERR_ASSERTION]: fuzzy block 31
  + actual - expected

  + '0xceb4a36500ea7090eca1842a25647b343e79d9f5d2bb49542b6aaa338624d2a5'
  - '0x74cc2dcbfec453d25471897a5f71fee6d1f54b980f49bb79bb5c141aaab3eb45'
...
```

Block 31's root isn't the trace's. The component that differs is C(13), the statistics:
one service used 1,545,786 gas, and the trace says 2,000,000, every drop it had. That
service grew its heap without enough gas left to pay for it.

## What the Gray Paper says

`grow_heap` ([lesson 16.3](../16-host-calls/03-growing-the-heap.md)), when growing would cost more gas than is left: Gray Paper 0.8.0 stops
the machine out of gas, with the gas as it was. The 0.8.0 test vectors, and the traces,
follow a later change to the paper (pull request 533): the gas is spent, all of it, as for
any other host call that runs out. [HARDENING.md](https://github.com/abutlabs/the-gray-tutor/blob/main/HARDENING.md) listed this from [lesson 16.3](../16-host-calls/03-growing-the-heap.md) on, with
exactly this case: "traces that run a service out of gas while it grows its heap".

Your `charge` ([lesson 16.1](../16-host-calls/01-calling-the-host.md)) already spends gas that way: it takes the gas off first, and
only then says whether there was enough. `growHeap` checked first, and took nothing.

<OogHeap />

## The code

**Replace in** `src/host.ts`

```ts
/**
 * grow_heap (GP App. B.5, Ω_Gemini): makes the read-write zone's pages writable up to page
 * φ₇ (not including it), and says where the heap ends now. The zone starts at page a, may
 * reach b, and ends at h today. Asking for no more than h, or past b, just reports h.
 */
export function growHeap(m: Machine, code: ServiceCode): HostExit {
  const a = (2 * ZONE + roundUp(code.readOnly.length, ZONE)) / PAGE_SIZE;
  const b = (2 ** 32 - 3 * ZONE - INPUT_SIZE - roundUp(code.stackSize, PAGE_SIZE)) / PAGE_SIZE;
  const writable = [...m.memory].filter(([p, page]) => p >= a && p < b && page.access === "W");
  const h = a + writable.length;
  const want = m.registers[7];
  if (want <= BigInt(h) || want > BigInt(b)) {
    m.registers[7] = BigInt(h);
    return charge(m, 275) ? "continue" : "oog";
  }
  const g = 275n + (want - BigInt(h)) * 121n; // and 121 for each new page
  m.registers[7] = BigInt(h);
  if (!charge(m, g)) return "oog"; // all the gas is gone, as for any host call (19.6)
  addPages(m.memory, h * PAGE_SIZE, (Number(want) - h) * PAGE_SIZE, "W");
  m.registers[7] = want;
  return "continue";
}
```

```ts
  if (!charge(m, g)) return "oog"; // all the gas is gone, as for any host call (19.6)
```

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ blocks the fuzzy trace refuses, and the ones around them (4755.47ms)
✔ Υ on the first 25 blocks of the fuzzy_light trace (1764.883416ms)
...
ℹ tests 648
ℹ suites 0
ℹ pass 648
ℹ fail 0
...
reported 648 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791773731003
...
```

The three refusals, as the trace has them, and every other root right.

## Watch it

**Run**

```sh
npm run import fuzzy
```

```text
...
block 36, slot 36: imported; root 0xe9a2c0ff… = the trace's
block 37, slot 37: refused: bad_code_hash; root 0xe9a2c0ff… = the trace's
block 38, slot 38: refused: bad_code_hash; root 0xe9a2c0ff… = the trace's
block 39, slot 39: refused: bad_code_hash; root 0xe9a2c0ff… = the trace's
block 40, slot 40: imported; root 0x09189a2a… = the trace's
...
100 of 100 state roots as the trace's
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=import-1791773751077
```

Blocks 37, 38 and 39 are refused, and the state stays as it was, as the trace's does: the
same root three times. The *Block import* panel lists every block, and ends with the tally.

![Block import panel](./images/06-block-import.png)

## The scoreboard

All eight trace families go on the board: `fuzzy` and `fuzzy_light` hold 200 steps each,
so that's 1,000 blocks, every one imported into the state before it.

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
  {
    folders: [
      "traces/fallback", "traces/safrole", "traces/storage", "traces/storage_light",
      "traces/preimages", "traces/preimages_light", "traces/fuzzy", "traces/fuzzy_light",
    ],
    check: checkTrace,
  },
];
```

A thousand blocks with work in them is a lot to run one after another: the board would
take about four and a half minutes. Your computer has more than one processor, and
`availableParallelism()` says how many. Give each one a worker thread: a second program
running beside the first, with memory of its own, that talks to it by messages.
Each worker takes a vector, runs its family's check, says how it went, and takes the next:

**New file** `test/family-worker.ts`

```ts
// A worker thread of bin/scoreboard.ts: it runs each vector it's handed with its family's
// check, and says whether it passed, and if not, why.

import { parentPort } from "node:worker_threads";
import { FAMILIES } from "./families.ts";

parentPort!.on("message", ({ folder, name }: { folder: string; name: string }) => {
  const family = FAMILIES.find((f) => f.folders.includes(folder))!;
  try {
    family.check(name);
    parentPort!.postMessage({ name, why: null });
  } catch (e) {
    parentPort!.postMessage({ name, why: (e as Error).message.split("\n")[0] });
  }
});
```

The scoreboard hands the vectors out and counts what comes back. The board it prints is
the same as before; threads finish in any order, so the results are sorted first:

**Rewrite** `bin/scoreboard.ts`

```ts
// The scoreboard: every official test vector, run whole by the family your client has for
// it, and counted. A vector passes only if your client's answer is all of the vector's.
// The vectors run side by side, a worker thread per processor (test/family-worker.ts).
// Usage: npm run scoreboard

import { readdirSync } from "node:fs";
import { availableParallelism } from "node:os";
import { Worker } from "node:worker_threads";
import { Run } from "../src/obs.ts";
import { FAMILIES } from "../test/families.ts";
import { VECTORS } from "../test/vectors.ts";

/** Every folder of vectors/ that holds vectors, with their names ("codec/tiny/block.json").
 * A trace's genesis.json is the state it starts from, not a step, so not a vector. */
function folders(dir = ""): { folder: string; names: string[] }[] {
  const entries = readdirSync(VECTORS + dir, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name));
  const names = entries
    .filter((e) => e.isFile() && e.name.endsWith(".json") && e.name !== "genesis.json")
    .map((e) => dir + e.name);
  const below = entries.filter((e) => e.isDirectory()).flatMap((e) => folders(`${dir}${e.name}/`));
  return names.length > 0 ? [{ folder: dir.slice(0, -1), names }, ...below] : below;
}

/** The row a folder counts on: tiny and full share one ("stf/safrole"). */
const rowOf = (folder: string) => folder.replace(/\/(tiny|full)$/, "");

/** A row of the scoreboard: how many passed, of how many, and why the others failed. */
type Row = { passed: number; total: number; run: boolean; failures: string[] };

/** A vector to run, and what a worker says of it: null if it passed, or why it failed. */
type Job = { folder: string; name: string };
type Result = { folder: string; name: string; why: string | null };

/** Runs every job on `threads` worker threads, each taking the next job when it's done. */
function runAll(jobs: Job[], threads: number): Promise<Result[]> {
  const queue = [...jobs];
  const results: Result[] = [];
  const thread = () => new Promise<void>((resolve, reject) => {
    const worker = new Worker(new URL("../test/family-worker.ts", import.meta.url));
    let job: Job | undefined;
    const next = () => {
      job = queue.shift();
      if (job) worker.postMessage(job);
      else worker.terminate().then(() => resolve());
    };
    worker.on("message", ({ why }: { why: string | null }) => {
      results.push({ ...job!, why });
      next();
    });
    worker.on("error", reject);
    next();
  });
  return Promise.all(Array.from({ length: threads }, thread)).then(() => results);
}

const rows = new Map<string, Row>();
const jobs: Job[] = [];
for (const { folder, names } of folders()) {
  const row = rows.get(rowOf(folder)) ?? { passed: 0, total: 0, run: false, failures: [] };
  rows.set(rowOf(folder), row);
  row.total += names.length;
  if (!FAMILIES.some((f) => f.folders.includes(folder))) continue; // not run yet
  row.run = true;
  for (const name of names) jobs.push({ folder, name });
}

const run = new Run("scoreboard");
const results = await runAll(jobs, availableParallelism());
results.sort((a, b) => a.name.localeCompare(b.name)); // threads finish in any order
for (const { folder, name, why } of results) {
  const row = rows.get(rowOf(folder))!;
  if (why === null) row.passed++;
  else row.failures.push(`${name}: ${why}`);
  run.event("vector", { family: rowOf(folder), vector: name, passed: why === null, why });
}

const n = (x: number) => x.toLocaleString("en-US"); // 1,428
console.log("The official test vectors, each run whole by your client:\n");
for (const [name, row] of rows) {
  const count = row.run ? `${n(row.passed)} of ${n(row.total)}`.padStart(10) : "";
  const mark = !row.run ? `not run yet (${n(row.total)})` : row.passed === row.total ? "✔" : "";
  console.log(`${name.padEnd(23)}${count}  ${mark}`.trimEnd());
  for (const failure of row.failures.slice(0, 3)) console.log(`    ✘ ${failure}`);
  if (row.failures.length > 3) console.log(`    … and ${row.failures.length - 3} more`);
  run.event("family", { family: name, passed: row.passed, total: row.total, run: row.run });
}
const passed = [...rows.values()].reduce((sum, row) => sum + row.passed, 0);
const total = [...rows.values()].reduce((sum, row) => sum + row.total, 0);
console.log(`\n${n(passed)} of ${n(total)} vectors pass.`);
run.number("vectors_passed", passed);
run.number("vectors_total", total);
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

`runAll` starts one worker per processor and hands each a vector. When a worker answers,
`next` gives it the next vector, until there are none left and the worker is stopped.
Everything else, the folders, the rows and the board, is as it was.

The milestone's vectors include the traces that carry bad blocks. Here is block 37 of `fuzzy`, one of the three refused, and the board's rows for the two `fuzzy` families:

::: code-group

```json [what goes in]
{
  "vector": "vectors/traces/fuzzy/00000037.json",
  "pre_state.state_root": "0xe9a2c0ff…",
  "block.header": { "slot": 37, "parent_state_root": "0xe9a2c0ff…", "author_index": 4 },
  "block.extrinsic.guarantees": "2 guarantees, a result of the first naming 0xa0b28a40…",
  "post_state.state_root": "0xe9a2c0ff…"
}
```

```text [console]
traces/fuzzy           200 of 200  ✔
traces/fuzzy_light     200 of 200  ✔

1,406 of 1,428 vectors pass.
```

:::

A refused block *runs whole* when it is refused and the state stays put: the trace's `post_state.state_root` is the same `0xe9a2c0ff…` as the `pre_state`'s, so there is no new root to match, only the refusal itself. The board counts a refusal where the trace calls for one as a pass.

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
traces/fuzzy           200 of 200  ✔
traces/fuzzy_light     200 of 200  ✔
traces/preimages       100 of 100  ✔
traces/preimages_light 100 of 100  ✔
traces/safrole         100 of 100  ✔
traces/storage         100 of 100  ✔
traces/storage_light   100 of 100  ✔
trie                       1 of 1  ✔

1,406 of 1,428 vectors pass.
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=scoreboard-1791940142186
```

Under a minute on a laptop with ten processors, and every trace family whole, the seven
bad blocks in `fuzzy` and `fuzzy_light` refused (`npm run import` stops at block 100,
so it never meets `fuzzy_light`'s four, from block 152 on).

> [!TIP] Milestone
> **Every block-import trace.** All 1,000 steps of the eight traces, each
> imported into the state before it and ending at the trace's state root, and the seven
> bad blocks among them refused: a block importer, on the official vectors.

<details>
<summary>lasair: the out-of-gas rule, in <code>lib/pvm_host.ml</code></summary>

```ocaml
      if Int64.compare ctx.gas_remaining g < 0 then
        (* deviation GP #533 (jam-test-vectors 0.8.0): drain to zero, exit OOG *)
        Some { new_gas = 0L; new_regs = set_reg regs 7 (Int64.of_int h); new_mem = mem;
               new_service = None; new_context = Some { ctx with gas_remaining = 0L; heap_limit = -1L } }
```

lasair sets the gas to zero, `new_gas = 0L`, where your `charge` takes it below zero. The
gas used comes out the same either way: [lesson 16.6](../16-host-calls/06-checkpoints.md)'s u = g − max(ϱ′, 0) counts anything
at or below zero as all of it. lasair's comment calls it what it is, a deviation: Gray
Paper 0.8.0 says otherwise, and the vectors follow the paper's next version.

</details>

## Check your understanding

::: check
**Why is an importer that takes a bad block as wrong as one that refuses a good one?**

- [ ] It isn't: taking a block is the safe mistake
  > No: taking it changes the state, its slot at the least. From then on, your
  > client's root is not the chain's.
- [ ] A bad block changes nothing, so taking it does no harm
  > No: only refusing it changes nothing. Taken, block 37 would move τ, and the root
  > after it would no longer be `0xe9a2c0ff…`.
- [x] Either way, your client's state is no longer everyone else's
  > Yes: every client must reach the same state. A wrong yes and a wrong no both
  > leave your client on a state nobody else has.

**`fuzzy` blocks 37, 38 and 39 are refused. What state does block 40 go into?**

- [x] The state after block 36, as if the three never came
  > Yes: the root after blocks 36, 37, 38 and 39 is `0xe9a2c0ff…` every time. Block 40
  > builds on block 36.
- [ ] The state after block 39, with the three bad blocks' slots counted
  > No: a refused block moves nothing, not even τ. There's no state after block 39
  > but the one after block 36.
- [ ] Genesis: after a refusal, the import starts again
  > No: a refusal leaves the state as it was, and the chain carries on from there.

**At `fuzzy` block 31, your client said a service used 1,545,786 gas; the trace says all 2,000,000. Why?**

- [ ] Your client's machine ran different instructions
  > No: every instruction ran the same. Only the rule for running out of gas while
  > growing the heap differed.
- [x] Growing its heap cost more gas than it had left, and the vectors spend all of it then
  > Yes: Gray Paper 0.8.0 leaves the gas as it was. The vectors follow a later change,
  > pull request 533: the gas is spent, as for any host call that runs out.
- [ ] The trace counts each service's gas limit, not the gas it used
  > No: the service really used it all. Running out of gas spends every drop.

**Why did a difference in gas show up in the state root at all?**

- [ ] The gas left is kept in the service's account
  > No: an account keeps its balance, not gas. Gas is only for the run.
- [x] The statistics, C(13), record the gas each service used
  > Yes: π_S keeps each service's gas, and the root covers every byte of it. That's
  > why the component that differed was C(13).
- [ ] Every block's header carries the gas it used
  > No: the header has no gas in it. The difference was in the state, in the
  > statistics.

**The scoreboard runs a worker thread per processor. Why does it sort the results before printing?**

- [ ] Workers may get a vector's answer wrong if it isn't sorted
  > No: each worker runs its vector whole, alone. Sorting changes the printing, not
  > the answers.
- [x] Threads finish in any order, and the board should read the same every run
  > Yes: a quick vector on one thread can finish before a slow one handed out
  > earlier. Sorted, the board is the same as before.
- [ ] The traces must be imported in order, block 1 first
  > No: each trace step goes into the trace's own state before it, so the steps
  > don't depend on each other.
:::

## What you have

A JAM block importer. The first 100 blocks of all eight official block-import traces, 800
blocks, each imported into the state your client made from the one before, every state
root right; on the scoreboard all 1,000 steps, one at a time; and every bad block refused,
the state left as it was. On the scoreboard, 1,406 of the 1,428 official
vectors pass whole, safrole's proofs and ring roots included. The ten preimages refusals
are the [hardening pass](https://github.com/abutlabs/the-gray-tutor/blob/main/HARDENING.md)'s
to add; the other twelve are erasure coding, which validators use to share a
work-package's data and a block importer never needs. JAM's first milestone, M1, asks a
client for the conformance tests and for importing blocks: the second is done, and the
first but for those ten. One thing is left: the official
fuzzer doesn't run your tests, it talks to your client over a socket. [Part
20](../20-facing-the-fuzzer/index.md) teaches it to listen.

Next: [Part 20 · Facing the fuzzer](../20-facing-the-fuzzer/index.md)
