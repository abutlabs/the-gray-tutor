# Lookup

A service can keep *preimages*: blobs of data, each filed under its own hash. [Lesson 14.1](../14-services/01-providing-preimages.md)
put them into the state when a block provided them, and [lesson 14.2](../14-services/02-the-service-account.md) counted what they
cost. The service's own code is one ([lesson 15.1](../15-the-pvm/01-the-program-blob.md) found it that way). This lesson lets a
running service read them, any service's, with `lookup`.

## What the Gray Paper says

**`lookup`** (host call 3, App. B.5, Ω_L) finds a preimage by its hash. φ₇ says whose
preimages to look in: the service's own if φ₇ is its id or 2^64 − 1, otherwise service φ₇'s.
The 32-byte hash is in memory at φ₈; if it isn't readable, the machine panics. The preimage
comes out like `fetch`'s items: to φ₉, from byte φ₁₀, at most φ₁₁ bytes, and φ₇ becomes its
length. A service that doesn't exist, or doesn't have that preimage: NONE. It costs 600,
plus 248 per KiB asked for.

Reading another service's preimages is fine: preimages are public by nature. Anyone
holding the data could check it against the hash.

Three questions in one call, answered on real values: the test's "hello, JAM" under
service 0, and the 8-byte blob service 1729 keeps in the `lookup_foreign_preimage` vector
(its bytes spell "preimage"). Pick whose, which hash, and the window, and watch φ₇ and the
gas answer — the gas is for the bytes *asked for*, and it's charged before the preimage is
even found:

<LookupCall />

## The tests

The tests' account gets an empty set of preimages:

**Replace in** `test/host.test.ts`

```ts
/** The accounts the tests' accumulation sees: service 0, with tinyInfo's record. */
function tinyAccounts(): Map<number, Account> {
  return new Map([[0, { info: tinyInfo(), storage: new Map(), preimages: new Map() }]]);
}
```

**Add to** `test/host.test.ts`

```ts
import { toHex } from "../src/bytes.ts";
import { lookup } from "../src/host.ts";
import { blake2b256 } from "../src/hash.ts";
import type { Bytes } from "../src/bytes.ts";
import type { HostExit } from "../src/host.ts";
import type { Exit, Machine } from "../src/pvm/machine.ts";
import type { MemoryError } from "../src/pvm/memory.ts";

/** A machine about to look up `data` by its hash, which sits in memory at 0x20000. */
function lookingUp(who: bigint, data: Uint8Array) {
  const memory = new Map();
  addPages(memory, 0x20000, 4096, "W");
  writeMemory(memory, 0x20000n, blake2b256(data));
  const registers = [0n, 0n, 0n, 0n, 0n, 0n, 0n, who, 0x20000n, 0x20100n, 0n, 100n];
  return newMachine(assemble([[0]]), registers, memory, 10_000n);
}

test("lookup: a preimage the service keeps, found by its hash", () => {
  const data: Bytes = new TextEncoder().encode("hello, JAM");
  const accounts: Map<number, Account> = tinyAccounts();
  accounts.get(0)!.preimages.set(toHex(blake2b256(data)), data);
  const machine: Machine = lookingUp(2n ** 64n - 1n, data);
  const exit: HostExit = lookup(machine, accounts, 0);
  assert.equal(exit, "continue");
  assert.equal(machine.registers[7], 10n);
  const found: Bytes | MemoryError = readMemory(machine.memory, 0x20100n, 10);
  assert.deepEqual(found, data);
  assert.equal(machine.gas, 10_000n - 600n - 25n); // and 248 per KiB of the 100 bytes asked for
});

test("lookup of a hash the service doesn't keep, or of a service that isn't there: NONE", () => {
  const data: Bytes = new TextEncoder().encode("nobody provided this");
  const missing: Machine = lookingUp(2n ** 64n - 1n, data);
  lookup(missing, tinyAccounts(), 0);
  assert.equal(missing.registers[7], NONE);
  const nobody: Machine = lookingUp(42n, data);
  lookup(nobody, tinyAccounts(), 0);
  assert.equal(nobody.registers[7], NONE);
});
```

And two more vectors join the list: in `lookup_foreign_preimage`, service 0 looks up a
preimage that belongs to *another* service.

**Replace in** `test/accumulate.test.ts`

```ts
/** The vectors whose services need no host calls beyond this part's so far. */
const CASES: [string, number][] = [
  ["always_accumulate-1", 1729],
  ["always_accumulate-2", 1729],
  ["lookup_foreign_preimage-1", 0],
  ["lookup_foreign_preimage-2", 0],
  ["process_one_immediate_report-1", 1729],
  ["queues_are_shifted-1", 1729],
  ["same_code_different_services-1", 1729],
  ["same_round_storage_isolation-1", 1729],
  ["same_round_storage_isolation-1", 1730],
  ["same_round_storage_isolation-2", 1730],
];
```

## The code

An account gains its preimages, and everything that makes or copies accounts learns them:

**Replace in** `src/services.ts`

```ts
/**
 * A service account (GP §9) as accumulation sees it: its record, its storage, and the
 * preimages it keeps, each under its hash. Keys are in hex.
 */
export type Account = {
  info: ServiceInfo;
  storage: Map<string, Bytes>;
  preimages: Map<string, Bytes>;
};

/** An account as the accumulate test vectors write it. */
export type AccountJson = {
  service: unknown;
  storage: { key: string; value: string }[];
  preimage_blobs: { hash: string; blob: string }[];
};

/** An account from the accumulate test vectors' JSON. */
export function accountFromJson(json: AccountJson): Account {
  const storage = new Map(json.storage.map((e) => [e.key, fromHex(e.value)]));
  const preimages = new Map(json.preimage_blobs.map((p) => [p.hash, fromHex(p.blob)]));
  return { info: ServiceInfo.fromJson(json.service), storage, preimages };
}

/** A copy of the accounts that changes to the originals can't reach. */
export function copyAccounts(accounts: Map<number, Account>): Map<number, Account> {
  const copy = (a: Account) => ({
    info: { ...a.info },
    storage: new Map(a.storage),
    preimages: new Map(a.preimages),
  });
  return new Map([...accounts].map(([id, a]) => [id, copy(a)]));
}
```

**Add to** `src/host.ts`

```ts
/**
 * lookup (GP App. B.5, Ω_L): the preimage of the hash in memory at φ₈, among those service
 * φ₇ keeps (its own if φ₇ is its id or 2^64 − 1), copied out like fetch to φ₉, from byte
 * φ₁₀, at most φ₁₁ bytes. NONE if the service doesn't have it.
 */
export function lookup(m: Machine, accounts: Map<number, Account>, s: number): HostExit {
  const [who, hashAt, o, from, length] = m.registers.slice(7, 12);
  if (!charge(m, 600n + memoryGas(248, length))) return "oog";
  const hash = readMemory(m.memory, hashAt, 32);
  if (!(hash instanceof Uint8Array)) return "panic"; // the hash isn't readable
  const account = accounts.get(who === 2n ** 64n - 1n ? s : Number(who));
  return copyOut(m, account?.preimages.get(toHex(hash)), o, from, length);
}
```

**Replace in** `src/host.ts`

```ts
/**
 * F (GP App. B.4): the host for a service's accumulation. So far it answers gas, grow_heap,
 * fetch (whose items are the constants, 0; the entropy, 1; and the inputs, all of them, 14,
 * or one, 15), info, lookup, read, write and checkpoint. Anything else: WHAT.
 */
export function accumulateHost(config: Config, a: Accumulation): Host {
  const items: Items = (kind, index) => {
    if (kind === 0) return protocolConstants(config);
    if (kind === 1) return a.entropy;
    if (kind === 14) return concatBytes(encodeNatural(BigInt(a.inputs.length)), ...a.inputs);
    if (kind === 15 && index < BigInt(a.inputs.length)) return a.inputs[Number(index)];
    return undefined;
  };
  return (call, m) => {
    switch (HOST_CALLS[call]) {
      case "gas":
        return gas(m);
      case "grow_heap":
        return growHeap(m, a.code);
      case "fetch":
        return fetch(m, items);
      case "info":
        return info(m, a.accounts, a.id);
      case "lookup":
        return lookup(m, a.accounts, a.id);
      case "read":
        return read(m, a.accounts, a.id);
      case "write":
        return write(m, a.accounts, a.id);
      case "checkpoint":
        return checkpoint(m, a);
      default:
        return unknown(m);
    }
  };
}
```

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ lookup_foreign_preimage-1: service 0 ends as the vector says (201.2ms)
✔ lookup_foreign_preimage-2: service 0 ends as the vector says (101.9ms)
...
✔ the reported packages: each one's hash and exports root, sorted by hash (220.2ms)
...
✔ lookup: a preimage the service keeps, found by its hash (1.0ms)
✔ lookup of a hash the service doesn't keep, or of a service that isn't there: NONE (0.4ms)
...
ℹ tests 480
ℹ suites 0
ℹ pass 480
ℹ fail 0
...
reported 480 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791738514291
...
```

Ten services in nine official vectors now match them.

## Watch it

**Run**

```sh
npm pkg set scripts.accumulate-foreign-preimage="node bin/accumulate.ts ../vectors/stf/accumulate/tiny/lookup_foreign_preimage-1.json"
npm run accumulate-foreign-preimage
```

```text
service 0: 1 input(s), 2000000 gas, "halt"
  gas used 140681; the vector says 140681
  storage: 0x0100000000 = 0x774935b629cc42513a66c8ed1a09f88b00fe35689032bafd5a26d52f464c48080000, 0x00 = 0x01000000, 0x02774935b629cc42513a66c8ed1a09f88b00fe35689032bafd5a26d52f464c48080000 = 0x010106
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=accumulate-1791738519670
```

The bin from [lesson 16.7](./07-a-services-inputs.md) needs no change: point it at the new vector, and service 0's gas
lines up with the vector's. The *Accumulate* panel, on **7 · Accumulation and import**, shows it beside the
others.

![Accumulate panel](./images/08-accumulate.png)

<details>
<summary>lasair: finding the service, in <code>lib/pvm_host.ml</code></summary>

```ocaml
let resolve_service (ctx : host_context) (r : int64) =
  if r = -1L then Some ctx.service
  else if Int64.unsigned_compare r 0x1_0000_0000L >= 0 then None
  else
    let id = Int64.to_int r in
    if id = ctx.service_id then Some ctx.service
    else match List.assoc_opt id ctx.other_services with
      | Some svc -> Some svc
      | None -> (match ctx.lookup_service with Some f -> f id | None -> None)
```

The first half of `lookup`, `read` and `info`: which account is meant. −1 is lasair's 2^64 −
1 (its registers are signed), anything at or past 2^32 can't be a service id, and then it
looks in the service itself, the other accounts in its context, and finally the chain's
state, through a function, for an account the context didn't bring along. Your client puts
every account into the context, which keeps it to one `Map` lookup.

</details>

## Check your understanding

::: check
**`write` can only change the service's own storage. Why may `lookup` read another service's preimages?**

- [x] Preimages are public by nature: anyone holding the data could check it against its hash
  > Yes: there's nothing secret to protect. In `lookup_foreign_preimage`, service 0 reads
  > another service's preimage and matches the vector.
- [ ] Reading is cheaper than writing, so it's allowed more freely
  > No: price has nothing to do with it. What matters is that preimages are no secret.
- [ ] It can't: a lookup in another service's preimages always gets NONE
  > No: φ₇ names whose preimages to look in, any service. NONE means that service, or
  > that preimage, isn't there.

**The test asks for up to 100 bytes, and "hello, JAM" is 10. Why does it cost 600 + 25?**

- [ ] 248 gas per KiB of the 10 bytes found, rounded up
  > No: that would be ⌈2,480 / 1,024⌉ = 3. The price is set before the preimage is even
  > found.
- [x] 248 gas per KiB of the 100 bytes asked for, rounded up: ⌈24,800 / 1,024⌉ = 25
  > Yes: like `fetch`, `lookup` charges for what's asked for, φ₁₁, first.
- [ ] A flat 25 for reading the hash from memory
  > No: the 25 grows with the bytes asked for. The flat part is the 600.

**The hash is readable, but the service keeps no preimage for it. What happens?**

- [ ] A panic
  > No: `lookup` panics only when the 32-byte hash can't be read from memory.
- [ ] φ₇ = WHAT
  > No: WHAT means "no such host call", and accumulation's host knows `lookup`.
- [x] φ₇ = NONE, and the machine carries on
  > Yes: no such preimage is an ordinary answer, as the test's "nobody provided this"
  > shows.
:::

## What you have

Services that can read any preimage on the chain, and ten services in nine official
accumulate vectors matching them. Reading a preimage needs someone to have asked for it first:
[lesson 16.9](./09-asking-for-preimages.md) lets a service ask.

Next: [16.9 Asking for preimages](./09-asking-for-preimages.md)
