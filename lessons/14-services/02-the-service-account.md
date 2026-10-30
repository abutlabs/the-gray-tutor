# The service account

Every service has an *account*: its code (by hash), its balance, the least gas it will
accept, and a tally of the state it takes up, because storage on JAM isn't free: a
service must keep enough balance to cover what it stores, like a deposit. This lesson
reads the account out of the state and checks the tally adds up.

## New words

- **Service.** A program that lives on JAM, with an id, code, a balance and storage. It
  runs in two stages: refine, on a core, and accumulate, on the chain. *Example:*
  service 0, in the real state below.
- **Service account.** A service's record in the state: its code hash, balance, gas
  minimums, and counts of what it keeps. *Example:* 89 bytes under C(255, s).
- **Footprint, deposit and minimum balance.** What a service keeps, in items and bytes, is
  its footprint. Keeping it takes a deposit: the balance must stay at least 100 + 10 per
  item + 1 per byte, less a free allowance, its minimum balance. *Example:* service 0's
  footprint is 4 items and 159,534 bytes.

All three are in the [glossary](../glossary.md).

## What the Gray Paper says

§9 (*Service Accounts*) and Appendix D. Under C(255, s) ([lesson 6.2](../06-state-and-merklization/02-state-keys.md)), the state keeps
the account's record, 89 bytes:

| Field | Bytes | Meaning |
| --- | --- | --- |
| version | 1 | 0 |
| c, code hash | 32 | the service's code, which it keeps as a preimage ([lesson 14.1](./01-providing-preimages.md)) |
| b, balance | 8 | its tokens |
| g, m | 8 + 8 | the least gas per work-item, and per transfer memo |
| o, octets | 8 | bytes of state it takes up |
| f, gratis | 8 | storage it gets for free |
| i, items | 4 | things it keeps |
| r, a, p | 4 + 4 + 4 | created at, last accumulated at, created by (its parent) |

<ServiceRecord />

*The footprint*: items is 2 for each request plus 1 for each storage entry; octets is
81 plus the data's length for each request, plus 34 plus the key's and value's lengths
for each storage entry. (The 81 and the 34 are flat amounts for the bookkeeping around
each one, on top of the data itself.)

*The minimum balance*, a_t, is max(0, 100 + 10·i + 1·o − f): a base deposit of 100,
10 per item and 1 per octet, less the free allowance.

<Footprint />

## The tests

**Add to** `test/services.test.ts`

```ts
import { footprint, minimumBalance, readService, ServiceInfo, serviceCode } from "../src/services.ts";
import { fromHex } from "../src/bytes.ts";

test("service 0 in real state: its code beside it, and its footprint adding up", () => {
  const { entries } = traceState("fallback", 1);
  const service: ServiceInfo = readService(entries, 0);
  const codeLength: number | undefined = serviceCode(entries, 0)?.length;
  assert.equal(codeLength, 159322); // its code: lesson 6.1's giant
  const isPreimage = (e: KeyValue) => toHex(e.key) === toHex(preimageKey(0, e.value));
  const preimages: KeyValue[] = entries.filter(isPreimage);
  const requests = preimages.map((p) => ({ length: p.value.length })); // all provided
  const used = footprint([], requests);
  assert.deepEqual(used, { items: service.items, bytes: service.bytes });
});

/** An account in the accumulate vectors: its record, its storage, its requests. */
type VectorAccount = {
  data: {
    service: unknown;
    storage: { key: string; value: string }[];
    preimage_requests: { key: { length: number } }[];
  };
};

test("footprints and minimum balances: 510 accounts in the accumulate vectors", () => {
  let accounts = 0;
  for (const size of ["tiny", "full"]) {
    for (const name of vectorFiles(`stf/accumulate/${size}`)) {
      const { pre_state, post_state } = vectorJson(name) as {
        pre_state: { accounts: VectorAccount[] };
        post_state: { accounts: VectorAccount[] };
      };
      for (const { data } of [...pre_state.accounts, ...post_state.accounts]) {
        const info: ServiceInfo = ServiceInfo.fromJson(data.service);
        const storage: KeyValue[] = data.storage.map((e) => ({
          key: fromHex(e.key),
          value: fromHex(e.value),
        }));
        const requests = data.preimage_requests.map((r) => r.key);
        const used = footprint(storage, requests);
        assert.deepEqual(used, { items: info.items, bytes: info.bytes });
        const minimum: bigint = minimumBalance(info);
        assert.ok(info.balance >= minimum, name);
        accounts++;
      }
    }
  }
  assert.equal(accounts, 510);
});
```

Two sources. In the real state, service 0's code sits beside its account: the value whose
hash is the code hash, [lesson 6.1](../06-state-and-merklization/01-the-state-trie.md)'s 159,322-byte giant. Its footprint is two preimages
with their requests and nothing in storage: 4 items, 81 + 159,322 + 81 + 50 = 159,534
octets. The accumulate vectors ([Part 17](../17-accumulation/index.md)'s) list 510 account snapshots with storage
too, and every footprint and balance checks out.

## The code

**Add to** `src/services.ts`

```ts
import { hash, record, u64, u8 } from "./codec/codec.ts";
import type { Value } from "./codec/codec.ts";
import type { Bytes } from "./bytes.ts";
import { accountKey } from "./state.ts";

/** A service's account record, C(255, s) (GP §9, App. D), under the test vectors' names. */
export const ServiceInfo = record({
  version: u8, // 0
  code_hash: hash, // c: the hash of the service's code, itself a preimage it keeps
  balance: u64, // b
  min_item_gas: u64, // g: the least gas to accumulate each work-item
  min_memo_gas: u64, // m: the least gas for each transfer's memo
  bytes: u64, // o: the octets its storage, preimages and requests take
  deposit_offset: u64, // f: gratis storage, a discount on the deposit below
  items: u32, // i: how many things it keeps
  creation_slot: u32, // r
  last_accumulation_slot: u32, // a
  parent_service: u32, // p: the service that created it
});
export type ServiceInfo = Value<typeof ServiceInfo>;

/** A service's account record, read from the state (lesson 6.2's C(255, s)). */
export function readService(entries: KeyValue[], s: number): ServiceInfo {
  const key = toHex(accountKey(s));
  const entry = entries.find((e) => toHex(e.key) === key);
  if (!entry) throw new Error(`the state has no service ${s}`);
  return decode(ServiceInfo, entry.value);
}

/** A service's code (GP §9): the preimage of its code hash, which it keeps in the state. */
export function serviceCode(entries: KeyValue[], s: number): Bytes | undefined {
  const { code_hash } = readService(entries, s);
  return entries.find((e) => toHex(blake2b256(e.value)) === toHex(code_hash))?.value;
}

/**
 * The footprint (GP §9): items is 2 per request and 1 per storage entry; bytes is 81 plus
 * the length per request, and 34 plus key and value lengths per storage entry.
 */
export function footprint(
  storage: { key: Bytes; value: Bytes }[],
  requests: { length: number }[],
): { items: number; bytes: bigint } {
  const items = 2 * requests.length + storage.length;
  let bytes = 0n;
  for (const { length } of requests) bytes += BigInt(81 + length);
  for (const { key, value } of storage) bytes += BigInt(34 + key.length + value.length);
  return { items, bytes };
}

/** a_t (GP §9): the least balance a service must keep for what it stores. */
export function minimumBalance(info: ServiceInfo): bigint {
  const deposit = 100n + 10n * BigInt(info.items) + info.bytes; // B_S + B_I·i + B_L·o
  const owed = deposit - info.deposit_offset;
  return owed > 0n ? owed : 0n;
}
```

The record uses the vectors' field names, so `fromJson` reads them for free, and the
Gray Paper's letters are in the comments. The 8-byte fields are `u64`, so they're
`bigint` values, and so the footprint's `bytes` is a `bigint` too ([lesson 1.2](../01-bytes-and-numbers/02-numbers.md): a `number` would
lose precision past 2^53).

`minimumBalance` is the Gray Paper's a_t, term by term:

```ts
  const deposit = 100n + 10n * BigInt(info.items) + info.bytes; // B_S + B_I·i + B_L·o
```

`serviceCode` finds a service's code the simplest way there is: the state value whose
hash is the account's code hash. Lessons to come, from [Part 15](../15-the-pvm/index.md) on, run that code, and they all start here.

> [!NOTE]
> **The simple road.** `serviceCode` hashes every value in the state until one matches.
> The Gray Paper keeps a service's code where its preimages go, under C(s, ℰ₄(2^32 − 2) ⌢
> the code hash) ([lesson 6.2](../06-state-and-merklization/02-state-keys.md)), and only there counts: the same bytes in another service's
> preimages aren't this service's code. A real client builds that one key and looks it
> up. (6.2's `preimageKey` takes the data, not its hash, so it can't build it as it
> stands.) The [hardening pass](https://github.com/abutlabs/the-gray-tutor/blob/main/HARDENING.md) has it.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ the reported packages: each one's hash and exports root, sorted by hash (203.5ms)
...
✔ service 0 in real state: its code beside it, and its footprint adding up (11.3ms)
✔ footprints and minimum balances: 510 accounts in the accumulate vectors (294.1ms)
...
ℹ tests 395
ℹ suites 0
ℹ pass 395
ℹ fail 0
...
reported 395 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791736058671
...
```

## Watch it

**New file** `bin/service.ts`

```ts
// Reads a service's account from the state before a trace's block: its record, its code,
// and what it must keep in its balance for what it stores.
// Usage: npm run service <trace.json> [service id, 0 unless you say], e.g.
//        npm run service ../vectors/traces/storage/00000100.json

import { readFileSync } from "node:fs";
import { fromHex, toHex } from "../src/bytes.ts";
import { Run } from "../src/obs.ts";
import { minimumBalance, readService, serviceCode } from "../src/services.ts";
import type { KeyValue } from "../src/trie.ts";

const [file, id] = process.argv.slice(2);
const s = Number(id ?? 0);
const trace = JSON.parse(readFileSync(file, "utf8"));
const entries: KeyValue[] = trace.pre_state.keyvals.map((e: { key: string; value: string }) => ({
  key: fromHex(e.key),
  value: fromHex(e.value),
}));
const service = readService(entries, s);
const code = serviceCode(entries, s);
const run = new Run("service");
const lines = [
  `service ${s}, created at slot ${service.creation_slot} by service ${service.parent_service}`,
  `code hash ${toHex(service.code_hash).slice(0, 18)}…: ${code?.length} bytes of code`,
  `keeps ${service.items} items in ${service.bytes} bytes`,
  `balance ${service.balance}, of which it must keep ${minimumBalance(service)}`,
  `last accumulated at slot ${service.last_accumulation_slot}`,
];
for (const line of lines) {
  console.log(line);
  run.event("fact", { line });
}
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

**What flows through it.** One run, three faces — the state entry going in, the account
the program decodes from it, and the lines it prints. Tab across them:

::: code-group

```json [what goes in]
{ "pre_state": { "keyvals": [
  {
    "key": "0xff000000000000000000000000000000000000000000000000000000000000",
    "value": "0x00128fc8f0578f393b…ffffffffffffffff…"
  },
  … the service's code and storage, entries under keys of their own …
] } }
```

```ts [what it computes]
// bin/service.ts's account for service 0, decoded from that one 89-byte value
const computed = {
  created: 0, // creation_slot, by parent_service 0: there from genesis
  codeHash: "0x128fc8f0578f393b…", // the 32 bytes after the value's leading tag
  codeBytes: 159322, // the preimage those bytes name, stored under a key of its own
  items: 4, // what it keeps: 4 items in 159534 bytes
  balance: 18446744073709551615n, // ffffffffffffffff little-endian: 2^64 - 1
  mustKeep: 0n, // minimumBalance: the bootstrap service never runs short
};
```

```text [what comes out]
service 0, created at slot 0 by service 0
code hash 0x128fc8f0578f393b…: 159322 bytes of code
```

:::

Read the input into the output: the key's first byte is `0xff`, 255, the account-record
recipe, and the zeros after it are the service id, 0. The 89-byte value packs the whole
record — a tag byte, the code hash, the balance (`ffff…` read little-endian is
2^64 − 1), the gas minimums and the counts. The code itself isn't here: those 159,322
bytes sit under another key, found by the hash.

**Run**

```sh
npm pkg set scripts.service="node bin/service.ts"
npm pkg set scripts.service-fallback="node bin/service.ts ../vectors/traces/fallback/00000001.json"
npm run service-fallback
```

```text
service 0, created at slot 0 by service 0
code hash 0x128fc8f0578f393b…: 159322 bytes of code
keeps 4 items in 159534 bytes
balance 18446744073709551615, of which it must keep 0
last accumulated at slot 0
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=service-1791736063580
```

That balance is 2^64 − 1, the largest 8-byte number there is, and its free allowance is
the same. It's the trace's bootstrap service, set up to never run short. Now the same
service a hundred blocks into the `storage` trace,
`../vectors/traces/storage/00000100.json`: 147 items in 170,189 bytes, and last
accumulated at slot 98. It has been busy. The *Service* panel shows the account.

![Service panel](./images/02-service.png)

<details>
<summary>lasair: <code>load_service_account</code>, in <code>conformance/stf_guarantees.ml</code></summary>

```ocaml
        let code_hash = Bytes.sub data 1 32 in
        let balance = if Bytes.length data >= 41 then read_i64_le data 33 else 0L in
        let min_acc_gas = if Bytes.length data >= 49 then read_i64_le data 41 else 0L in
        let min_memo_gas = if Bytes.length data >= 57 then read_i64_le data 49 else 0L in
        let octets = if Bytes.length data >= 65 then Int64.to_int (read_i64_le data 57) else 0 in
```

Every offset worked out by hand, 33, 41, 49, 57 and on to 85. Your `record` does that
arithmetic for you. One more thing worth noticing: OCaml's `Int64` is *signed*, so the
bootstrap service's balance, 2^64 − 1, has the same bits as −1 there, and any code
comparing balances has to remember to compare them as unsigned. Your `bigint` simply
holds 18,446,744,073,709,551,615.

</details>

## Check your understanding

::: check
**Service 0 keeps two preimages and nothing in storage, and its footprint says 4 items. Why 4?**

- [ ] One for the account, one for the code, and one for each preimage
  > No: the account record isn't counted, and the code is one of the two preimages
  > already.
- [x] Each request counts 2 items, and there are two requests
  > Yes: items is 2 per request plus 1 per storage entry, 2 × 2 + 0 = 4. The data and its
  > request each take an entry in the state.
- [ ] Two preimages and two storage entries
  > No: its storage is empty. A storage entry counts 1, and there are none.

**A service keeps 4 items in 159,534 octets, with no free allowance. What is its minimum balance?**

- [ ] 159,534
  > No: that's only the 1 per octet. The base deposit, 100, and 10 per item come on top.
- [ ] 100
  > No: that's only the base deposit. Every item and every octet adds to it.
- [x] 159,674
  > Yes: 100 + 10 × 4 + 1 × 159,534 = 159,674.

**The bootstrap service must keep 0 of its balance. Why 0?**

- [ ] Its balance, 2^64 − 1, is so big that the deposit doesn't apply
  > No: the minimum doesn't look at the balance at all. It's worked out from what the
  > service stores, and the balance is only checked against it.
- [x] Its free allowance, 2^64 − 1, is more than the deposit, and the minimum never goes below 0
  > Yes: 159,674 − (2^64 − 1) is negative, and max(0, …) makes it 0.
- [ ] Bootstrap services are exempt from the deposit rule
  > No: the rule has no exemptions. The same max(0, 100 + 10·i + o − f) applies; this
  > service's f is just enormous.

**Where is service 0's code, all 159,322 bytes of it?**

- [ ] Inside its account record, under C(255, s)
  > No: the record is 89 bytes. It holds only the code's 32-byte hash, c.
- [ ] In a code store of its own, outside the state
  > No: there is no other store. The code is in the state, beside the account.
- [x] In the state, as one of the service's preimages: the value whose hash is c
  > Yes: the account names its code by hash, and `serviceCode` finds the value that
  > hashes to it.
:::

## What you have

[Part 14](./index.md), done: services get the data they asked for, and your client can read any
service's account and check that its footprint and its balance add up. That code
`serviceCode` found is a program for a machine you haven't built yet: [Part 15](../15-the-pvm/index.md) builds
the PVM that runs it.

Next: [Part 15 · The PVM](../15-the-pvm/index.md)
