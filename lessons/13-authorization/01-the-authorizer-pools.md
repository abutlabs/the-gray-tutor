# The authorizer pools

Who is allowed to use a core? Not just anyone with a work-package. Each piece of work
must be *authorized*, by an *authorizer*: a small program, identified by a hash, that
decides whether a package may run. Each core keeps a short list of authorizers it
currently accepts, its *pool*, and a long line of them waiting their turn, its
*queue*. Every block, the pool changes a little: one goes out, one comes in. This
lesson keeps the pools moving, and it's all of [Part 13](./index.md).

## New words

- **Authorizer queue.** ϕ[c]. For each core, 80 authorizer hashes waiting their turn; one
  joins the core's pool every block. *Example:* at slot 85, the queue's entry 5 (85 mod
  80) joins.

It's in the [glossary](../glossary.md), with the authorizer ([lesson 3.1](../03-work-and-reports/01-a-work-package.md)) and its
pool ([lesson 12.4](../12-guarantees/04-bad-guarantees.md)).

## What the Gray Paper says

§8 (*Authorization*). For each core c:

- **α[c], the pool**: at most O = 8 authorizer hashes.
- **ϕ[c], the queue**: exactly Q = 80 of them. Only a privileged service can change the
  queue, during accumulation ([Part 17](../17-accumulation/index.md)).

Each block, α′[c] is made in three steps:

1. If a guarantee in this block used core c ([Part 12](../12-guarantees/index.md)), its report's authorizer is
   taken out of the pool: the *leftmost* copy, the one that's been there longest.
2. The queue's entry for this slot joins: ϕ′[c][τ′ mod Q]. The queue is a wheel, read
   one slot at a time and going round every 80 slots.
3. If the pool is now over O, the oldest drop off the front, leaving the newest O.

ϕ′, not ϕ: the queue *after* accumulation, which is why, in a real client, this step
comes late in the block. In C(1) and C(2) ([lesson 6.2](../06-state-and-merklization/02-state-keys.md)) the pools are lists with their
length in front, and the queues are 80 hashes exactly: 514 and 5,120 bytes on tiny.

Try it below, on one core, with letters for hashes. Step on block by block and watch the
pool fill to 8, then slide: the newest in on the right, the oldest out on the left. Give
a block a guarantee using a letter that's in the pool twice, and see the leftmost copy
go. Slide past slot 80 and the queue starts again from entry 0. Then switch to the
trace's queue, A 80 times over: take an A out, put an A in, and the pool never changes.

<AuthorizerPool />

## The codecs first

The tests read pools from real states as well as from vectors, so the codecs come first,
with a `nextPools` that doesn't move anything yet:

**New file** `src/authorization.ts`

```ts
// Authorization (GP §8): which authorizers each core will accept work for. Each core keeps
// a small pool of them, refilled one at a time from a long queue.

import type { ReportGuarantee } from "./block.ts";
import type { Bytes } from "./bytes.ts";
import { toHex } from "./bytes.ts";
import type { Value } from "./codec/codec.ts";
import { hash, record, seq, seqN, u16 } from "./codec/codec.ts";
import type { Config } from "./config.ts";

/** O: the most authorizers a core's pool holds. */
export const POOL_SIZE = 8;

/** Q: the length of each core's queue. */
export const QUEUE_SIZE = 80;

/** α, C(1): each core's pool of authorizers, up to O of them. */
export function AuthPools(config: Config) {
  return seqN(seq(hash), config.core_count);
}

/** ϕ, C(2): each core's queue of authorizers, exactly Q of them. */
export function AuthQueues(config: Config) {
  return seqN(seqN(hash, QUEUE_SIZE), config.core_count);
}

/** An authorizer a guarantee used on a core: its report's core and authorizer hash. */
export const UsedAuthorizer = record({
  core: u16,
  auth_hash: hash,
});
export type UsedAuthorizer = Value<typeof UsedAuthorizer>;

export function nextPools(
  pools: Bytes[][],
  queues: Bytes[][], // ϕ′
  used: UsedAuthorizer[],
  slot: number, // τ′
): Bytes[][] {
  return pools;
}

/** The authorizers a block's guarantees used: one per guaranteed core. */
export function usedAuthorizers(guarantees: ReportGuarantee[]): UsedAuthorizer[] {
  return guarantees.map(({ report }) => ({
    core: report.core_index,
    auth_hash: report.authorizer_hash,
  }));
}
```

`usedAuthorizers` connects [Part 12](../12-guarantees/index.md) to here: each guarantee says which core it used
and which authorizer let it in. And the readers for C(1) and C(2), next to [lesson
6.3](../06-state-and-merklization/03-reading-the-state.md)'s:

**Add to** `src/state.ts`

```ts
import { AuthPools, AuthQueues } from "./authorization.ts";
import type { Config } from "./config.ts";

/** α, C(1): each core's authorizer pool. */
export function readAuthPools(config: Config, entries: KeyValue[]): Bytes[][] {
  return component(entries, 1, AuthPools(config));
}

/** ϕ, C(2): each core's authorizer queue. */
export function readAuthQueues(config: Config, entries: KeyValue[]): Bytes[][] {
  return component(entries, 2, AuthQueues(config));
}
```

## The tests

**New file** `test/authorization.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { AuthPools, AuthQueues, nextPools, UsedAuthorizer } from "../src/authorization.ts";
import { FULL, TINY } from "../src/config.ts";
import { traceState, vectorFiles, vectorJson } from "./vectors.ts";
import { Block } from "../src/block.ts";
import { usedAuthorizers } from "../src/authorization.ts";
import { readAuthPools, readAuthQueues } from "../src/state.ts";
import type { Bytes } from "../src/bytes.ts";

/** An authorizer hash made of one repeated byte, so the test reads like letters. */
const auth = (byte: number) => new Uint8Array(32).fill(byte);
const [A, B, C] = [auth(0xaa), auth(0xbb), auth(0xcc)];

test("the used authorizer leaves, the queue's next one joins", () => {
  const queue: Bytes[] = Array.from({ length: 80 }, (_, i) => (i === 3 ? C : A)); // C waits at 3
  const afterUse: Bytes[][] = nextPools([[A, B]], [queue], [{ core: 0, auth_hash: B }], 3);
  assert.deepEqual(afterUse, [[A, C]]);
  const nextRound: Bytes[][] = nextPools([[A, B]], [queue], [], 83); // 83 mod 80 = 3
  assert.deepEqual(nextRound, [[A, B, C]]);
});

test("a full pool keeps its newest eight", () => {
  const full: Bytes[] = [A, A, A, A, A, A, A, B]; // eight already
  const queue: Bytes[] = Array.from({ length: 80 }, () => C);
  const after: Bytes[][] = nextPools([full], [queue], [], 0);
  assert.deepEqual(after, [[A, A, A, A, A, A, B, C]]);
});

test("α′ on the authorizations vectors", () => {
  let checked = 0;
  for (const config of [TINY, FULL]) {
    for (const name of vectorFiles(`stf/authorizations/${config.name}`)) {
      const { input, pre_state, post_state } = vectorJson(name) as {
        input: { slot: number; auths: unknown[] };
        pre_state: { auth_pools: unknown; auth_queues: unknown };
        post_state: { auth_pools: unknown };
      };
      const pools: Bytes[][] = AuthPools(config).fromJson(pre_state.auth_pools);
      const queues: Bytes[][] = AuthQueues(config).fromJson(pre_state.auth_queues);
      const used: UsedAuthorizer[] = input.auths.map((a) => UsedAuthorizer.fromJson(a));
      const after: Bytes[][] = nextPools(pools, queues, used, input.slot);
      const expected: Bytes[][] = AuthPools(config).fromJson(post_state.auth_pools);
      assert.deepEqual(after, expected, name);
      checked++;
    }
  }
  assert.equal(checked, 6);
});

test("α′ through 99 real blocks, with the authorizers their own guarantees used", () => {
  let used = 0;
  for (let n = 1; n < 100; n++) {
    const before = traceState("preimages", n);
    const after = traceState("preimages", n + 1); // the state after block n
    const block: Block = Block(TINY).fromJson(before.block);
    const auths: UsedAuthorizer[] = usedAuthorizers(block.extrinsic.guarantees);
    const pools: Bytes[][] = readAuthPools(TINY, before.entries);
    const queues: Bytes[][] = readAuthQueues(TINY, after.entries); // ϕ′: after the block
    const next: Bytes[][] = nextPools(pools, queues, auths, block.header.slot);
    const expected: Bytes[][] = readAuthPools(TINY, after.entries);
    assert.deepEqual(next, expected, `block ${n}`);
    used += auths.length;
  }
  assert.equal(used, 85);
});
```

Four tests: the rule by hand twice, with one-byte "letters" for hashes; the six
authorizations vectors; and then a real chain. Through 99 blocks of the `preimages`
trace, the pools after each block are worked out from the pools before it, the queues
after it, and the authorizers the block's *own guarantees* used: 85 of them. That's
[Part 12](../12-guarantees/index.md)'s guarantees and this part's readers, checked together on real state.

**Run, expect it to fail**

```sh
npm test
```

```text
...
✖ the used authorizer leaves, the queue's next one joins (7.9ms)
✖ a full pool keeps its newest eight (3.7ms)
✖ α′ on the authorizations vectors (3.9ms)
✔ α′ through 99 real blocks, with the authorizers their own guarantees used (540.6ms)
...
ℹ tests 390
ℹ suites 0
ℹ pass 387
ℹ fail 3
...
```

Three reds, and one surprising green. The rule's tests fail: a pool that never changes isn't what they expect. But the 99 real blocks
pass, even with a `nextPools` that does nothing. In this trace every pool and every
queue holds the same authorizer, 8 and 80 times over, so taking one out and putting the
next one in leaves each pool exactly as it was. That test checks your readers and
`usedAuthorizers` against real state; only the hand tests and the vectors check the
rule. A test that can't fail on wrong code is worth spotting, and a stub is how you
spot it.

## The code

The three steps, as the Gray Paper lists them:

**Replace in** `src/authorization.ts`

```ts
/**
 * α′ (GP §8): a core's used authorizer leaves its pool (its oldest copy), the queue's entry
 * for this slot joins, and the pool keeps its newest O.
 */
export function nextPools(
  pools: Bytes[][],
  queues: Bytes[][], // ϕ′
  used: UsedAuthorizer[],
  slot: number, // τ′
): Bytes[][] {
  return pools.map((pool, core) => {
    const left = [...pool];
    for (const { auth_hash } of used.filter((u) => u.core === core)) {
      const oldest = left.findIndex((a) => toHex(a) === toHex(auth_hash));
      if (oldest >= 0) left.splice(oldest, 1);
    }
    const next = queues[core][slot % QUEUE_SIZE]; // the queue goes round, a slot at a time
    return [...left, next].slice(-POOL_SIZE);
  });
}
```

Each step is a line or two:

```ts
      if (oldest >= 0) left.splice(oldest, 1);
    const next = queues[core][slot % QUEUE_SIZE]; // the queue goes round, a slot at a time
    return [...left, next].slice(-POOL_SIZE);
```

`splice(oldest, 1)` cuts out one item where it stands, so the rest close up behind it.
`slot % QUEUE_SIZE` turns the wheel. And `.slice(-POOL_SIZE)` keeps the last eight, as
[lesson 9.2](../09-recent-history/02-recent-blocks.md)'s history did.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ the used authorizer leaves, the queue's next one joins (0.9ms)
✔ a full pool keeps its newest eight (0.1ms)
✔ α′ on the authorizations vectors (150.5ms)
✔ α′ through 99 real blocks, with the authorizers their own guarantees used (490.6ms)
...
✔ the reported packages: each one's hash and exports root, sorted by hash (465.4ms)
...
ℹ tests 390
ℹ suites 0
ℹ pass 390
ℹ fail 0
...
reported 390 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791734931482
...
```

## Watch it

**New file** `bin/pools.ts`

```ts
// Shows each core's authorizer pool before and after the block of an authorizations test
// vector: which authorizer left, which joined. Each authorizer as its first 4 hex digits.
// Usage: npm run pools <vector.json>, e.g.
//        npm run pools ../vectors/stf/authorizations/tiny/progress_authorizations-2.json

import { readFileSync } from "node:fs";
import { AuthPools, AuthQueues, nextPools, QUEUE_SIZE, UsedAuthorizer } from "../src/authorization.ts";
import type { Bytes } from "../src/bytes.ts";
import { toHex } from "../src/bytes.ts";
import { FULL, TINY } from "../src/config.ts";
import { Run } from "../src/obs.ts";

const [file] = process.argv.slice(2);
const config = file.includes("/full/") ? FULL : TINY;
const { input, pre_state } = JSON.parse(readFileSync(file, "utf8"));
const pools = AuthPools(config).fromJson(pre_state.auth_pools);
const queues = AuthQueues(config).fromJson(pre_state.auth_queues);
const used: UsedAuthorizer[] = input.auths.map((a: unknown) => UsedAuthorizer.fromJson(a));
const after = nextPools(pools, queues, used, input.slot);
const short = (pool: Bytes[]) => pool.map((a) => toHex(a).slice(2, 6)).join(" ");
const run = new Run("pools");
const entry = input.slot % QUEUE_SIZE; // where each queue is up to
console.log(`slot ${input.slot}: each core's next authorizer is queue entry ${entry}`);
// tiny: every core; full: just the cores that used an authorizer
const shown = config === TINY ? pools.map((_, core) => core) : used.map((u) => u.core);
for (const core of shown) {
  const left = used.find((u) => u.core === core);
  const gone = left ? toHex(left.auth_hash).slice(2, 6) : "nothing";
  const joined = toHex(queues[core][entry]).slice(2, 6);
  console.log(`core ${core}: ${short(pools[core])}`);
  console.log(`  − ${gone}, + ${joined}  →  ${short(after[core])}`);
  run.event("pool", { core, before: short(pools[core]), gone, joined, after: short(after[core]) });
}
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

**What flows through it.** A block at slot 45 where each core's guarantee used one
authorizer, with each core's pool of 8 and its queue of 80 in the state:

::: code-group

```json [what goes in]
{
  "slot": 45,
  "auths": [
    { "core": 0, "auth_hash": "0xb6abd7a7…" },
    { "core": 1, "auth_hash": "0x510d8116…" }
  ],
  "auth_pools": [ [ "0xb6ab…", "0xbaad…", … 8 per core … ], [ … ] ],
  "auth_queues": [ [ … 80 per core; entry 45 is "0x5b83b4f5…" … ], [ … entry 45: "0x9c890e5c…" … ] ]
}
```

```ts [what it computes]
// bin/pools.ts: what leaves each pool, what joins from the queue, per core
const computed = {
  entry: 45, // slot mod 80: where every queue is up to this block
  core0: { gone: "b6ab", joined: "5b83" }, // used its oldest; queue entry 45 joins at the back
  core1: { gone: "510d", joined: "9c89" }, // used its second: just that one goes
};
```

```text [what comes out]
slot 45: each core's next authorizer is queue entry 45
core 0: b6ab baad dbe5 1989 6d74 8da3 332d f9e9
  − b6ab, + 5b83  →  baad dbe5 1989 6d74 8da3 332d f9e9 5b83
```

:::

`auths` says which authorizer each core's work consumed; the pool drops exactly that
one. What joins is nobody's choice: entry `slot mod 80` of the core's queue — at slot
45, entry 45 — so the queue turns like a wheel, one notch per block.

**Run**

```sh
npm pkg set scripts.pools="node bin/pools.ts"
npm pkg set scripts.pools-progress="node bin/pools.ts ../vectors/stf/authorizations/tiny/progress_authorizations-2.json"
npm run pools-progress
```

```text
slot 45: each core's next authorizer is queue entry 45
core 0: b6ab baad dbe5 1989 6d74 8da3 332d f9e9
  − b6ab, + 5b83  →  baad dbe5 1989 6d74 8da3 332d f9e9 5b83
core 1: 80ef 510d fae1 e38b 678d af59 73cc c874
  − 510d, + 9c89  →  80ef fae1 e38b 678d af59 73cc c874 9c89
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=pools-1791734945852
```

Core 0 used `b6ab`, its oldest, so it leaves from the front and `5b83` joins at the
back. Core 1 used `510d`, the *second* in its pool: only that one goes, and the rest close
up behind it. Then try
the full vector `progress_authorizations-3.json`: at slot 645 the queue entry is 5,
because 645 mod 80 = 5. The wheel has gone round eight times. The *Authorizer pools*
panel shows each change.

![Authorizer pools panel](./images/01-authorizer-pools.png)

## The scoreboard

The third test above runs every authorizations vector whole already: α′ is all they
change, and they say nothing back. It becomes the `stf/authorizations` family, and the
test calls it:

**Add to** `test/families.ts`

```ts
import { AuthPools, AuthQueues, nextPools, UsedAuthorizer } from "../src/authorization.ts";

type AuthorizationsInput = { slot: number; auths: unknown[] };
type AuthorizationsState = { auth_pools: unknown; auth_queues: unknown };

/** An authorizations vector: α′, every core's pool after the block. It says nothing back. */
export function checkAuthorizations(name: string) {
  const vector = vectorJson(name) as StfVector<AuthorizationsInput, AuthorizationsState>;
  const config = configOf(name);
  const { input, pre_state } = vector;
  const pools = AuthPools(config).fromJson(pre_state.auth_pools);
  const queues = AuthQueues(config).fromJson(pre_state.auth_queues);
  const used = input.auths.map((a) => UsedAuthorizer.fromJson(a));
  const after = nextPools(pools, queues, used, input.slot);
  const expected = AuthPools(config).fromJson(vector.post_state.auth_pools);
  assert.deepEqual(after, expected, "auth_pools differs");
  assert.equal(vector.output, null, "output differs");
  unchanged(vector, ["auth_pools"]);
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
];
```

**Rewrite** `test/authorization.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { nextPools } from "../src/authorization.ts";
import { traceState, vectorFiles } from "./vectors.ts";
import { Block } from "../src/block.ts";
import { usedAuthorizers } from "../src/authorization.ts";
import { readAuthPools, readAuthQueues } from "../src/state.ts";
import { checkAuthorizations } from "./families.ts";
import { TINY } from "../src/config.ts";
import type { UsedAuthorizer } from "../src/authorization.ts";
import type { Bytes } from "../src/bytes.ts";

/** An authorizer hash made of one repeated byte, so the test reads like letters. */
const auth = (byte: number) => new Uint8Array(32).fill(byte);
const [A, B, C] = [auth(0xaa), auth(0xbb), auth(0xcc)];

test("the used authorizer leaves, the queue's next one joins", () => {
  const queue: Bytes[] = Array.from({ length: 80 }, (_, i) => (i === 3 ? C : A)); // C waits at 3
  const afterUse: Bytes[][] = nextPools([[A, B]], [queue], [{ core: 0, auth_hash: B }], 3);
  assert.deepEqual(afterUse, [[A, C]]);
  const nextRound: Bytes[][] = nextPools([[A, B]], [queue], [], 83); // 83 mod 80 = 3
  assert.deepEqual(nextRound, [[A, B, C]]);
});

test("a full pool keeps its newest eight", () => {
  const full: Bytes[] = [A, A, A, A, A, A, A, B]; // eight already
  const queue: Bytes[] = Array.from({ length: 80 }, () => C);
  const after: Bytes[][] = nextPools([full], [queue], [], 0);
  assert.deepEqual(after, [[A, A, A, A, A, A, B, C]]);
});

test("α′ on the authorizations vectors", () => {
  const names: string[] = [
    ...vectorFiles("stf/authorizations/tiny"),
    ...vectorFiles("stf/authorizations/full"),
  ];
  for (const name of names) checkAuthorizations(name);
  assert.equal(names.length, 6);
});

test("α′ through 99 real blocks, with the authorizers their own guarantees used", () => {
  let used = 0;
  for (let n = 1; n < 100; n++) {
    const before = traceState("preimages", n);
    const after = traceState("preimages", n + 1); // the state after block n
    const block: Block = Block(TINY).fromJson(before.block);
    const auths: UsedAuthorizer[] = usedAuthorizers(block.extrinsic.guarantees);
    const pools: Bytes[][] = readAuthPools(TINY, before.entries);
    const queues: Bytes[][] = readAuthQueues(TINY, after.entries); // ϕ′: after the block
    const next: Bytes[][] = nextPools(pools, queues, auths, block.header.slot);
    const expected: Bytes[][] = readAuthPools(TINY, after.entries);
    assert.deepEqual(next, expected, `block ${n}`);
    used += auths.length;
  }
  assert.equal(used, 85);
});
```

One of the 6 that the milestone counts, a block that uses an authorizer on each core:

::: code-group

```json [what goes in]
{
  "vector": "vectors/stf/authorizations/tiny/progress_authorizations-2.json",
  "input": {
    "slot": 45,
    "auths": [
      {
        "core": 0,
        "auth_hash": "0xb6abd7a763…"
      },
      {
        "core": 1,
        "auth_hash": "0x510d811639…"
      }
    ]
  },
  "pre_state.auth_pools[0] (first of 8)": "0xb6abd7a763…",
  "post_state.auth_pools[0] (first of 8)": "0xbaad1dabb3…",
  "output": null
}
```

```text [console]
stf/authorizations         6 of 6  ✔
236 of 1,428 vectors pass.
```

:::

*Run whole* means your client takes the pools before, the authorizers the block used, and the queue, and must land on the vector's pools after: core 0's `0xb6abd7a7…` was first in its pool, was used, and is gone from the front of `post_state`.

**Run**

```sh
npm test
npm run typecheck
npm run scoreboard
```

```text
...
The official test vectors, each run whole by your client:

codec                    30 of 30  ✔
erasure                  not run yet (12)
shuffle                    1 of 1  ✔
stf/accumulate           not run yet (126)
stf/assurances           22 of 22  ✔
stf/authorizations         6 of 6  ✔
stf/disputes             60 of 60  ✔
stf/history                8 of 8  ✔
stf/preimages            not run yet (16)
stf/reports              62 of 92
    ✘ stf/reports/full/big_work_report_output-1.json: cores_statistics changed
    ✘ stf/reports/full/different_core_same_guarantors-1.json: cores_statistics changed
    ✘ stf/reports/full/high_work_report_gas-1.json: cores_statistics changed
    … and 27 more
stf/safrole              46 of 46  ✔
stf/statistics           not run yet (8)
traces/fallback          not run yet (100)
traces/fuzzy             not run yet (200)
traces/fuzzy_light       not run yet (200)
traces/preimages         not run yet (100)
traces/preimages_light   not run yet (100)
traces/safrole           not run yet (100)
traces/storage           not run yet (100)
traces/storage_light     not run yet (100)
trie                       1 of 1  ✔

236 of 1,428 vectors pass.
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=scoreboard-1791939335722
```

> [!TIP] Milestone
> **Every authorizations vector.** All 6, tiny and full: every core's pool of
> authorizers, block by block, as the vectors keep it.

<details>
<summary>lasair: <code>next_pool</code>, in <code>conformance/authorizations_stf.ml</code></summary>

```ocaml
let next_pool ~(pool : bytes list) ~(used : bytes option) ~(queued : bytes option) : bytes list =
  ...
  let pool = match used with
    | Some hash -> remove_first (fun h -> Bytes.equal h hash) pool
    | None -> pool in
  let pool = match queued with Some q -> pool @ [ q ] | None -> pool in
  drop (List.length pool - pool_size) pool
```

The same three steps: remove the first match, append the queue's entry, drop down to
O. Its comment says this one function serves both lasair's test harness and its block
importer, so they can never disagree. Yet the same file opens with a comment
describing an older rule, "remove first pool entry, shift pool left". The code moved on
and that comment didn't. Comments go stale; tests don't.

</details>

## Check your understanding

::: check
**A core's pool is `A B A C`. A guarantee in this block used A on that core, the slot is 85, and the queue's entry 5 is D. What is the pool after?**

- [ ] `A B C D`
  > No: that takes out the second A, the newer one. The rule takes the *leftmost* copy,
  > the one that's been there longest.
- [x] `B A C D`
  > Yes: the oldest A leaves and the rest close up. Then D, entry 85 mod 80 = 5, joins on
  > the right. Four is under O = 8, so nothing drops off.
- [ ] `B C D`
  > No: one guarantee takes out one copy. The second A stays.

**A pool holds 8 already, `A B C D E F G H`, and no guarantee used the core. The queue's entry for this slot is X. What happens?**

- [ ] X is turned away: the pool is full
  > No: the queue's entry joins every block. A full pool is dealt with afterwards, by
  > step 3.
- [ ] H, the newest, makes room for X
  > No: step 3 keeps the *newest* O. H stays; the oldest goes.
- [x] X joins on the right, and A drops off the front: `B C D E F G H X`
  > Yes: with X the pool holds 9, and step 3 keeps the newest 8. A has been there
  > longest.

**At slot 85, why does the queue's entry 5 join, and not entry 85?**

- [x] The queue is a wheel of 80 entries: 85 mod 80 = 5
  > Yes: the slot picks the entry, ϕ′[c][τ′ mod Q]. On full, at slot 645, it's entry 5
  > again: the wheel has gone round eight times.
- [ ] Entries 0 to 4 have been used up and removed, so entry 5 is next
  > No: joining the pool removes nothing from the queue. It stays 80 hashes, and the same
  > entry is read again 80 slots later.
- [ ] The wheel moves one entry each block, and this is the fifth block
  > No: it's read by the slot number itself. A slot with no block simply skips its entry.

**With the stub `nextPools`, which changes nothing, the 99 real blocks of the `preimages` trace still passed. Why?**

- [ ] Those blocks had no guarantees, so no pool changed
  > No: their guarantees used 85 authorizers between them. Something else hid the stub.
- [x] Every pool and every queue in that trace holds the same authorizer, 8 and 80 times over
  > Yes: take an A out, put an A in, and the pool reads exactly as before. Only the hand
  > tests and the vectors can catch a stub.
- [ ] The test compares the pools after the block with themselves
  > No: it works from the pools *before* the block and compares with the pools after.
  > Only the queues come from after the block, because the rule uses ϕ′.
:::

## What you have

[Part 13](./index.md), done: every core's pool of authorizers, kept moving block by block, checked on
the vectors, whole, and on 99 real blocks. An authorizer lets work onto a core for a service.
[Part 14](../14-services/index.md) opens up the services themselves.

Next: [Part 14 · Services and preimages](../14-services/index.md)
