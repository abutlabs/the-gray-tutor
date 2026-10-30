# Providing preimages

A JAM service can't download things. If it needs data, say a new version of its own
code, it asks for it *by its hash and length* and waits. A later block brings the data in
its preimages extrinsic ([lesson 4.1](../04-blocks/01-tickets-and-preimages.md)), the chain checks it is what was asked for (its
hash says so), and hands it over. This lesson is that handover.

## New words

- **Request.** A service asking for a preimage by its hash and length. Its *history* is a
  short list of slots: provided, forgotten, available again. *Example:* `[]`, still waiting.
- **`Map`.** JavaScript's lookup table, from keys to values. *Example:* the state's
  entries, each found by its key in hex.

Both are in the [glossary](../glossary.md).

## What the Gray Paper says

§9 and §12. For every piece of data a service has asked for, it keeps a *request*,
under [lesson 6.2](../06-state-and-merklization/02-state-keys.md)'s `requestKey(s, H(data), length)`. Its value is a short *history*,
the slots of its life so far:

| History | Means |
| --- | --- |
| `[]` | asked for, still waiting |
| `[x]` | provided at slot x |
| `[x, y]` | provided at x, forgotten at y |
| `[x, y, z]` | available again from z, after being available from x until y |

**Y, "providable"**: a preimage (s, data) is welcome if service s has a request for
(H(data), length) whose history is `[]`. **I, "provide"**: for each welcome preimage,
the data is stored under `preimageKey(s, data)` ([lesson 6.2](../06-state-and-merklization/02-state-keys.md)), and the request's history
becomes `[τ′]`, the slot of this block.

The data proves itself: its hash is in the key, so nobody can provide the wrong thing.

<ProvidePreimage />

## The tests

Two readers first, beside the other vector helpers: a preimages vector writes each
account's preimages and requests as lists, and your client keeps them as state entries,
under [lesson 6.2](../06-state-and-merklization/02-state-keys.md)'s keys. The tests read them, and so will the scoreboard at the end
of this lesson.

**Add to** `test/vectors.ts`

```ts
import { encode } from "../src/codec/codec.ts";
import { RequestHistory } from "../src/services.ts";
import { preimageKey, requestKey } from "../src/state.ts";
import type { KeyValue } from "../src/trie.ts";
import { toHex } from "../src/bytes.ts";

/** A preimages vector's account, the way the vector writes it. */
export type PreimagesAccount = {
  id: number;
  data: {
    preimage_blobs: { blob: string }[];
    preimage_requests: { key: { hash: string; length: number }; value: number[] }[];
  };
};

/** Accounts as state entries: every preimage and every request, under its key, sorted. */
export function accountEntries(accounts: PreimagesAccount[]): KeyValue[] {
  const entries = accounts.flatMap(({ id, data }) => [
    ...data.preimage_blobs.map(({ blob }) => ({
      key: preimageKey(id, fromHex(blob)),
      value: fromHex(blob),
    })),
    ...data.preimage_requests.map(({ key, value }) => ({
      key: requestKey(id, fromHex(key.hash), key.length),
      value: encode(RequestHistory, value),
    })),
  ]);
  return entries.sort((a, b) => toHex(a.key).localeCompare(toHex(b.key)));
}
```

**New file** `test/services.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { Block, Preimage } from "../src/block.ts";
import { toHex } from "../src/bytes.ts";
import { encode } from "../src/codec/codec.ts";
import { TINY } from "../src/config.ts";
import { blake2b256 } from "../src/hash.ts";
import { providePreimages, RequestHistory } from "../src/services.ts";
import { preimageKey, requestKey } from "../src/state.ts";
import type { KeyValue } from "../src/trie.ts";
import { accountEntries, traceState, vectorFiles, vectorJson } from "./vectors.ts";
import type { PreimagesAccount } from "./vectors.ts";
import type { Bytes } from "../src/bytes.ts";

test("a request's history: [] waiting, [x] provided at slot x", () => {
  const waiting: string = toHex(encode(RequestHistory, []));
  assert.equal(waiting, "0x00");
  const provided: string = toHex(encode(RequestHistory, [5]));
  assert.equal(provided, "0x0105000000");
});

/** The value under a key in a state's entries, as hex, or undefined. */
function valueAt(entries: KeyValue[], key: Uint8Array): string | undefined {
  const entry = entries.find((e) => toHex(e.key) === toHex(key));
  return entry && toHex(entry.value);
}

test("67 real preimages: stored, and their requests marked with the block's slot", () => {
  let provided = 0;
  for (let n = 1; n < 100; n++) {
    const { entries, block } = traceState("preimages", n);
    const { header, extrinsic } = Block(TINY).fromJson(block);
    if (extrinsic.preimages.length === 0) continue;
    const after: KeyValue[] = providePreimages(entries, extrinsic.preimages, header.slot);
    const expected: KeyValue[] = traceState("preimages", n + 1).entries; // after block n
    for (const { requester, blob } of extrinsic.preimages) {
      const request: Bytes = requestKey(requester, blake2b256(blob), blob.length);
      const requestAfter: string | undefined = valueAt(after, request);
      const requestExpected: string | undefined = valueAt(expected, request);
      assert.equal(requestAfter, requestExpected, `block ${n}`);
      const stored: Bytes = preimageKey(requester, blob);
      const storedAfter: string | undefined = valueAt(after, stored);
      const storedExpected: string | undefined = valueAt(expected, stored);
      assert.equal(storedAfter, storedExpected, `block ${n}`);
      provided++;
    }
  }
  assert.equal(provided, 67); // blocks 1 to 99: each needs the next block's state to compare
});

test("the preimages vectors, as state entries", () => {
  let accepted = 0;
  for (const size of ["tiny", "full"]) {
    for (const name of vectorFiles(`stf/preimages/${size}`)) {
      const { input, pre_state, post_state, output } = vectorJson(name) as {
        input: { preimages: unknown[]; slot: number };
        pre_state: { accounts: PreimagesAccount[] };
        post_state: { accounts: PreimagesAccount[] };
        output: { err?: string };
      };
      if (output.err) continue; // a rejected block changes nothing
      const preimages: Preimage[] = input.preimages.map((p) => Preimage.fromJson(p));
      const before: KeyValue[] = accountEntries(pre_state.accounts);
      const after: KeyValue[] = providePreimages(before, preimages, input.slot);
      const sorted: KeyValue[] = after.sort((a, b) => toHex(a.key).localeCompare(toHex(b.key)));
      const expected: KeyValue[] = accountEntries(post_state.accounts);
      assert.deepEqual(sorted, expected, name);
      accepted++;
    }
  }
  assert.equal(accepted, 6); // 3 at each size
});
```

The second test is the big one: every preimage in blocks 1 to 99 of the `preimages`
trace, 67 of them, provided to real state, and compared with the state the chain
actually had after each block. (Block 100 has one more, but no next state in the trace
to compare against.) The third test turns the `preimages` vectors' accounts into state
entries with `accountEntries`, so the same `providePreimages` runs on both.

A stub that provides nothing. `RequestHistory` is real already, since the first test
checks its bytes, and the imports are the ones the real code will need:

**New file** `src/services.ts`

```ts
// Services and their preimages (GP §9, §12): a service asks for some data by its hash and
// length, and a later block provides it.

import type { Preimage } from "./block.ts";
import { toHex } from "./bytes.ts";
import { decode, encode, seq, u32 } from "./codec/codec.ts";
import { blake2b256 } from "./hash.ts";
import { preimageKey, requestKey } from "./state.ts";
import type { KeyValue } from "./trie.ts";

/**
 * A request's history (GP §9), the slots of its life so far: [] asked for, [x] provided
 * at x, [x, y] forgotten at y, [x, y, z] asked for again at z.
 */
export const RequestHistory = seq(u32);

export function providePreimages(
  entries: KeyValue[],
  preimages: Preimage[],
  slot: number, // τ′
): KeyValue[] {
  return entries;
}
```

**Run, expect it to fail**

```sh
npm test
```

```text
...
✔ a request's history: [] waiting, [x] provided at slot x (1.2ms)
✖ 67 real preimages: stored, and their requests marked with the block's slot (37.4ms)
✖ the preimages vectors, as state entries (18.1ms)
...
ℹ tests 393
ℹ suites 0
ℹ pass 391
ℹ fail 2
...
test at test/services.test.ts:28:1
✖ 67 real preimages: stored, and their requests marked with the block's slot (37.4ms)
  AssertionError [ERR_ASSERTION]: block 8
  + actual - expected

  + '0x00'
  - '0x0108000000'
...
```

The history test is green: `RequestHistory` is real. The other two are red, and the
first diff reads well once you know the codec. At block 8 the chain wrote `0x0108000000`,
a list of one slot, `[8]`:

```text
01            the list's length, 1 (a compact natural)
08 00 00 00   slot 8, as a u32: 4 bytes
```

Your stub left `0x00`, the empty list, `[]`: the request is still waiting. (The first
test's `0x0105000000` is the same shape: `[5]`.)

## The code

**Replace in** `src/services.ts`

```ts
/**
 * I (GP §12): give each preimage to the service that asked for it, if it's still waiting
 * (Y, "providable"): store the data, and mark the request provided at this slot.
 */
export function providePreimages(
  entries: KeyValue[],
  preimages: Preimage[],
  slot: number, // τ′
): KeyValue[] {
  const state = new Map(entries.map((entry) => [toHex(entry.key), entry]));
  for (const { requester, blob } of preimages) {
    const request = requestKey(requester, blake2b256(blob), blob.length);
    const history = state.get(toHex(request));
    if (history === undefined) continue; // never asked for
    if (decode(RequestHistory, history.value).length !== 0) continue; // not waiting now
    state.set(toHex(request), { key: request, value: encode(RequestHistory, [slot]) });
    const key = preimageKey(requester, blob);
    state.set(toHex(key), { key, value: blob });
  }
  return [...state.values()];
}
```

`providePreimages` works on the state itself, [Part 6](../06-state-and-merklization/index.md)'s key-value entries, using its
key recipes. A `Map` keyed by hex finds entries quickly. A request that doesn't exist,
or isn't waiting, is skipped:

```ts
    if (history === undefined) continue; // never asked for
    if (decode(RequestHistory, history.value).length !== 0) continue; // not waiting now
```

> [!NOTE]
> **The simple road.** Skipping is right only for a preimage that accumulation made
> unneeded in this same block. The Gray Paper makes a block invalid if it carries a
> preimage nobody is waiting for, or if its preimages aren't sorted by service, then
> data, with no repeats. Five vectors at each size break those rules (both
> `preimage_not_needed` and three of the four `preimages_order_check`), and the test
> above skips refused vectors, so your client never meets them. The [hardening
> pass](https://github.com/abutlabs/the-gray-tutor/blob/main/HARDENING.md) adds the refusals.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ the reported packages: each one's hash and exports root, sorted by hash (211.7ms)
...
✔ a request's history: [] waiting, [x] provided at slot x (0.7ms)
✔ 67 real preimages: stored, and their requests marked with the block's slot (295.3ms)
✔ the preimages vectors, as state entries (19.8ms)
...
ℹ tests 393
ℹ suites 0
ℹ pass 393
ℹ fail 0
...
reported 393 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791736048893
...
```

## Watch it

**New file** `bin/preimages.ts`

```ts
// Provides the preimages of a trace's block to the services that asked for them, and shows
// each request's history before and after.
// Usage: npm run preimages <trace.json>, e.g.
//        npm run preimages ../vectors/traces/preimages/00000008.json

import { readFileSync } from "node:fs";
import { Block } from "../src/block.ts";
import type { Bytes } from "../src/bytes.ts";
import { fromHex, toHex } from "../src/bytes.ts";
import { decode } from "../src/codec/codec.ts";
import { TINY } from "../src/config.ts";
import { blake2b256 } from "../src/hash.ts";
import { Run } from "../src/obs.ts";
import { providePreimages, RequestHistory } from "../src/services.ts";
import { requestKey } from "../src/state.ts";
import type { KeyValue } from "../src/trie.ts";

const [file] = process.argv.slice(2);
const trace = JSON.parse(readFileSync(file, "utf8"));
const entries: KeyValue[] = trace.pre_state.keyvals.map((e: { key: string; value: string }) => ({
  key: fromHex(e.key),
  value: fromHex(e.value),
}));
const { header, extrinsic } = Block(TINY).fromJson(trace.block);
const after = providePreimages(entries, extrinsic.preimages, header.slot);

/** A request's history in a state, as a list of slots, or "none" if there's no request. */
function history(state: KeyValue[], key: Bytes): string {
  const entry = state.find((e) => toHex(e.key) === toHex(key));
  return entry ? `[${decode(RequestHistory, entry.value).join(", ")}]` : "none";
}

const run = new Run("preimages");
console.log(`block at slot ${header.slot}: ${extrinsic.preimages.length} preimages`);
for (const { requester, blob } of extrinsic.preimages) {
  const hash = blake2b256(blob);
  const request = requestKey(requester, hash, blob.length);
  const [was, now] = [history(entries, request), history(after, request)];
  const what = `${blob.length} bytes, hash ${toHex(hash).slice(0, 10)}…`;
  console.log(`service ${requester}: ${what}  request ${was} → ${now}`);
  run.event("provided", { service: requester, bytes: blob.length, hash, was, now });
}
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

**What flows through it.** One run, three faces — the trace's block going in, what the
program makes of each preimage, and the lines it prints. Here they are for the block's
3-byte preimage; tab across them:

::: code-group

```json [what goes in]
{
  "header": { "slot": 8 },
  "extrinsic": { "preimages": [
    { "requester": 0, "blob": "0x06cf2d8f02…" },
    { "requester": 0, "blob": "0xaef804" },
    … two more blobs, 84 and 223 bytes, every requester 0 …
  ] }
}
```

```ts [what it computes]
// bin/preimages.ts's values for the 3-byte preimage, once hashed and looked up
const computed = {
  service: 0, // requester: the service that asked for these bytes
  bytes: 3, // the blob's length: 0xaef804, shown whole above
  hash: "0xd0c7d4d8…", // blake2b256 of the blob; hash and length name the request
  was: "[]", // the request's history before: asked for, never provided
  now: "[8]", // after: provided at this block's slot
};
```

```text [what comes out]
block at slot 8: 4 preimages
service 0: 3 bytes, hash 0xd0c7d4d8…  request [] → [8]
```

:::

Read the input into the output: `requester` names the service, and the `blob` is the
data itself — the 3-byte one is `0xaef804` in full. The program hashes each blob with
Blake2b, finds the request filed under that service, hash and length, and prints its
history stepping from `[]`, asked for, to `[8]`, provided at the block's slot.

**Run**

```sh
npm pkg set scripts.preimages="node bin/preimages.ts"
npm pkg set scripts.preimages-trace="node bin/preimages.ts ../vectors/traces/preimages/00000008.json"
npm run preimages-trace
```

```text
block at slot 8: 4 preimages
service 0: 143 bytes, hash 0x6ae18b8b…  request [] → [8]
service 0: 3 bytes, hash 0xd0c7d4d8…  request [] → [8]
service 0: 84 bytes, hash 0x70e9dc78…  request [] → [8]
service 0: 223 bytes, hash 0x35c3078c…  request [] → [8]
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=preimages-1791736053778
```

Four pieces of data that service 0 was waiting for, from 3 bytes to 223, each one's
request history going from `[]` to `[8]`. Block 14 has ten. The *Preimages* panel, on the
**5 · Services** dashboard, lists every handover.

![Preimages panel](./images/01-preimages.png)

## The scoreboard

The preimages family runs whole too, and it's the honest kind of milestone: the board
shows what your client can't do yet, as well as what it can.

**Add to** `test/families.ts`

```ts
import { Preimage } from "../src/block.ts";
import { providePreimages } from "../src/services.ts";
import { accountEntries } from "./vectors.ts";
import type { PreimagesAccount } from "./vectors.ts";

type PreimagesInput = { preimages: unknown[]; slot: number };
type PreimagesState = { accounts: PreimagesAccount[]; statistics: unknown[] };

/** A preimages vector: δ′, each preimage stored and its request marked. Your client
 * refuses no preimages (the simple road above), so it accepts every block. */
function checkPreimages(name: string) {
  const vector = vectorJson(name) as StfVector<PreimagesInput, PreimagesState>;
  const { input, pre_state } = vector;
  sameError(null, vector);
  const preimages = input.preimages.map((p) => Preimage.fromJson(p));
  const after = providePreimages(accountEntries(pre_state.accounts), preimages, input.slot);
  const sorted = after.sort((a, b) => toHex(a.key).localeCompare(toHex(b.key)));
  assert.deepEqual(sorted, accountEntries(vector.post_state.accounts), "accounts differs");
  unchanged(vector, ["accounts"]);
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
];
```

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
stf/accumulate           not run yet (126)
stf/assurances           22 of 22  ✔
stf/authorizations         6 of 6  ✔
stf/disputes             60 of 60  ✔
stf/history                8 of 8  ✔
stf/preimages             2 of 16
    ✘ stf/preimages/full/preimage_needed-2.json: statistics changed
    ✘ stf/preimages/full/preimage_not_needed-1.json: accepted, not preimage_unneeded
    ✘ stf/preimages/full/preimage_not_needed-2.json: accepted, not preimage_unneeded
    … and 11 more
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

238 of 1,428 vectors pass.
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=scoreboard-1791939482202
```

2 of 16, and the board says why for the rest. Ten are blocks the vectors refuse,
`preimage_unneeded` and `preimages_not_sorted_unique`, which your client accepts: the
simple road the note above took, and the [hardening
pass](https://github.com/abutlabs/the-gray-tutor/blob/main/HARDENING.md) adds the refusals.
Those ten stay red on your board until you take it. The other four store their preimages
exactly as the vectors do, and then the vectors' service statistics count them,
`statistics changed`: [lesson 18.2](../18-statistics/02-what-cores-and-services-did.md) keeps those, and they cross the line there.

> [!TIP] Milestone
> **Preimages on the board.** Every preimage a vector accepts is stored and its
> request marked exactly as the vector says; the board names the two things still to do.

<details>
<summary>lasair: <code>integrate_preimage</code>, in <code>conformance/stf_guarantees.ml</code></summary>

```ocaml
let integrate_preimage (db : Lasair.State_db.t) (slot : int)
    (service_id : int) (blob : bytes) : Lasair.State_db.t =
  let h = hash_bytes blob in
  let rkey = make_request_state_key service_id h (Bytes.length blob) in
  match Lasair.State_db.get db rkey with
  | Some v when decode_request_value v = [] ->
    let db = Lasair.State_db.set db (make_preimage_state_key service_id h) blob in
    Lasair.State_db.set db rkey (encode_request_value [slot])
  | _ -> db
```

Line for line, your loop body: find the request by its key, check its history is
`[]`, store the data, write `[slot]`. lasair also works on its state store directly,
with the same key recipes as [lesson 6.2](../06-state-and-merklization/02-state-keys.md). When a rule is about the state, writing it
against the state keeps it short.

</details>

## Check your understanding

::: check
**What stops someone providing the wrong data for a request?**

- [ ] Validators compare the data with the original
  > No: there is no original to compare with. The service only ever had a hash and a
  > length.
- [x] The request is found by the data's own hash and length, so other bytes find no request
  > Yes: the key is `requestKey(s, H(data), length)`. Different bytes hash differently,
  > land on a key nobody asked under, and aren't providable.
- [ ] The service checks the data the next time it runs
  > No: the chain checks it before the service sees it. Y lets in only data whose hash and
  > length match a waiting request.

**At block 8 the chain wrote a request's history as `0x0108000000`. What does it say?**

- [ ] Service 1 asked for 8 bytes
  > No: the service and the length are in the request's key. Its value is only the
  > history, a list of slots.
- [x] `[8]`: the data was provided at slot 8
  > Yes: `01` is the list's length, a compact natural, and `08 00 00 00` is slot 8 as a
  > u32.
- [ ] Still waiting, since slot 8
  > No: waiting is `[]`, the single byte `0x00`, which is what the stub left. One slot in
  > the list means provided.

**A request's history is `[3, 40]`. What happened?**

- [x] The data was provided at slot 3, and forgotten at slot 40
  > Yes: two slots means provided, then forgotten. A third would say when it became
  > available again.
- [ ] It was asked for at slot 3, and provided at slot 40
  > No: asking leaves the history empty, `[]`. The first slot in the list is when the data
  > arrived.
- [ ] The data was provided twice, at 3 and at 40
  > No: data is welcome only while the history is `[]`. After slot 3 it was `[3]`, so a
  > second copy wasn't providable. The 40 is when it was forgotten.

**A block brings a preimage for a request whose history is already `[5]`. What does the Gray Paper say?**

- [ ] The data is stored again, and the history becomes this block's slot
  > No: only a waiting request, `[]`, is providable. `[5]` has its data already.
- [ ] The preimage is skipped, and the rest of the block goes on
  > No: that's what your client does, the simple road. The Gray Paper lets a preimage pass
  > unused only when accumulation in this same block made it unneeded.
- [x] The block is invalid: every preimage in it must be waited for in the state before it
  > Yes: Y is checked against the state before the block. Your client skips such a
  > preimage for now; the [hardening pass](https://github.com/abutlabs/the-gray-tutor/blob/main/HARDENING.md) adds the refusal, `preimage_unneeded`.
:::

## What you have

Your client can hand services the data they asked for: checked by its hash, stored under
its key, and the request marked done, the same way the real chain did, 67 times over. On
the scoreboard, two of the preimages vectors pass whole, and the board names what the
other fourteen need.
Who asked, though, and what do they own? [Lesson 14.2](./02-the-service-account.md) reads a service's account.

Next: [14.2 The service account](./02-the-service-account.md)
