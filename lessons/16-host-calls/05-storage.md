# Storage

Every service has a little key-value store of its own in the state: its *storage*. [Lesson
14.2](../14-services/02-the-service-account.md) counted what it costs to keep. This lesson lets a service use it, with two host calls,
`read` and `write`, and with them the first real check on what a service may keep: it has
to be able to afford it. When they're done, eight of the accumulate vectors' services run
to the same gas *and* leave exactly the storage the vectors expect.

## New words

- **Storage.** A service's own key-value store in the state. *Example:* a service writes
  the key "last" with some bytes, and reads it back next time.

It's in the [glossary](../glossary.md).

## What the Gray Paper says

**`read`** (host call 4, App. B.5, Ω_R) looks a key up in a service's storage. φ₇ says
whose (2^64 − 1 for its own), and the key is in memory, at φ₈, φ₉ bytes long. If the key
isn't readable, the machine panics. The value comes out like `fetch`'s items, to φ₁₀,
from byte φ₁₁, at most φ₁₂ bytes; NONE if there's no such key. It costs 2,407, plus 1,736
per KiB of key and 248 per KiB of value asked for.

**`write`** (host call 5, Ω_W) changes the service's *own* storage. The key is at φ₇ (φ₈
bytes) and the value at φ₉ (φ₁₀ bytes); an empty value deletes the key. φ₇ comes back as
the length of the value that was there before, or NONE. It costs 2,442, plus 3,358 per KiB
of key and 216 per KiB of value. The paper's rows for both, in B.5's table, are explained
in [16.A](./gray-paper.md#read-4), with this lesson's values.

The catch: every stored key costs the service deposit. [Lesson 14.2](../14-services/02-the-service-account.md)'s footprint counts one
item and 34 + |key| + |value| bytes for each, and the minimum balance a_t grows with it.
If after the write a_t would be more than the service's balance, nothing is written and
φ₇ is **FULL** (2^64 − 5).

Write to the tests' account, step by step:

<WriteStore />

## The tests

An account now has storage too, empty in the tests:

**Replace in** `test/host.test.ts`

```ts
/** The accounts the tests' accumulation sees: service 0, with tinyInfo's record. */
function tinyAccounts(): Map<number, Account> {
  return new Map([[0, { info: tinyInfo(), storage: new Map() }]]);
}
```

**Add to** `test/host.test.ts`

```ts
import { FULL, read, write } from "../src/host.ts";
import type { Bytes } from "../src/bytes.ts";
import type { HostExit } from "../src/host.ts";
import type { Exit, Machine } from "../src/pvm/machine.ts";
import type { MemoryError } from "../src/pvm/memory.ts";

/** φ₇ on as given, and a writable page at 0x20000: the key "last" there, 1, 2, 3 at 0x20010. */
function storing(...r7on: bigint[]) {
  const memory = new Map();
  addPages(memory, 0x20000, 4096, "W");
  writeMemory(memory, 0x20000n, new TextEncoder().encode("last"));
  writeMemory(memory, 0x20010n, Uint8Array.of(1, 2, 3));
  return newMachine(assemble([[0]]), [0n, 0n, 0n, 0n, 0n, 0n, 0n, ...r7on], memory, 10_000n);
}

test("write stores a value under a key, and the footprint grows", () => {
  const accounts: Map<number, Account> = tinyAccounts();
  const machine: Machine = storing(0x20000n, 4n, 0x20010n, 3n); // the key "last", the value 1, 2, 3
  const exit: HostExit = write(machine, accounts, 0);
  assert.equal(exit, "continue");
  assert.equal(machine.registers[7], NONE); // nothing was there before
  const { info, storage }: Account = accounts.get(0)!;
  const stored: Bytes | undefined = storage.get("0x6c617374"); // "last", in hex
  assert.deepEqual(stored, Uint8Array.of(1, 2, 3));
  assert.deepEqual([info.items, info.bytes], [3, 50n + 34n + 4n + 3n]); // lesson 14.2's sums
  assert.equal(machine.gas, 10_000n - 2442n - 14n - 1n); // and per KiB of key and of value
});

test("read finds it again; writing an empty value deletes it", () => {
  const accounts: Map<number, Account> = tinyAccounts();
  write(storing(0x20000n, 4n, 0x20010n, 3n), accounts, 0);
  const reader: Machine = storing(2n ** 64n - 1n, 0x20000n, 4n, 0x20100n, 0n, 10n); // its own
  const exit: HostExit = read(reader, accounts, 0);
  assert.equal(exit, "continue");
  assert.equal(reader.registers[7], 3n);
  const value: Bytes | MemoryError = readMemory(reader.memory, 0x20100n, 3);
  assert.deepEqual(value, Uint8Array.of(1, 2, 3));
  const eraser: Machine = storing(0x20000n, 4n, 0n, 0n); // no value at all
  write(eraser, accounts, 0);
  assert.equal(eraser.registers[7], 3n); // the old value's length
  assert.equal(accounts.get(0)!.storage.size, 0);
});

test("FULL: a service can't keep more than its balance covers", () => {
  const accounts: Map<number, Account> = tinyAccounts(); // a balance of 1,000
  const machine: Machine = storing(0x20000n, 4n, 0x20010n, 1000n); // 1,000 bytes: a_t, 1,218
  write(machine, accounts, 0);
  assert.equal(machine.registers[7], FULL);
  assert.equal(accounts.get(0)!.storage.size, 0); // nothing changed
});
```

The made-up record has 2 items in 50 bytes and a balance of 1,000. Storing "last" → 1, 2, 3
adds one item and 34 + 4 + 3 bytes. Storing 1,000 bytes instead would push a_t to 100 +
10 · 3 + (50 + 34 + 4 + 1,000) = 1,218, more than the balance: FULL.

## The code

An account gains its storage, keyed by the key's hex (a `Map` compares strings by value,
but `Uint8Array` values only by identity). `accountFromJson` reads it from the vectors:

**Replace in** `src/services.ts`

```ts
import { fromHex } from "./bytes.ts";

/** A service account (GP §9) as accumulation sees it: its record and its storage. */
export type Account = { info: ServiceInfo; storage: Map<string, Bytes> }; // keys in hex

/** An account as the accumulate test vectors write it. */
export type AccountJson = { service: unknown; storage: { key: string; value: string }[] };

/** An account from the accumulate test vectors' JSON. */
export function accountFromJson(json: AccountJson): Account {
  const storage = new Map(json.storage.map((e) => [e.key, fromHex(e.value)]));
  return { info: ServiceInfo.fromJson(json.service), storage };
}
```

`read` is a lookup. `write` has six steps, in this order:

1. **Charge** the gas, before anything else: out of gas, it stops there.
2. **Read** the key from memory, and the value too, unless its length is 0.
3. **Panic** if either can't be read.
4. **Work out the account as it would be after**: one item more for a new key, one fewer
   for a deleted one, and the bytes to match ([lesson 14.2](../14-services/02-the-service-account.md)'s footprint).
5. **FULL** if that account's minimum balance is more than its balance. Nothing changes.
6. **Commit**: store or delete, keep the new footprint, and give back the old value's
   length, or NONE.

**Add to** `src/host.ts`

```ts
import { toHex } from "./bytes.ts";
import { readMemory } from "./pvm/memory.ts";

export const FULL = 2n ** 64n - 5n; // not enough balance to keep that much

/**
 * read (GP App. B.5, Ω_R): from the storage of service φ₇ (its own if φ₇ = 2^64 − 1), the
 * value under the key in memory at φ₈ (φ₉ bytes long), copied out like fetch from φ₁₀ on.
 */
export function read(m: Machine, accounts: Map<number, Account>, s: number): HostExit {
  const [who, keyAt, keyLength, o, from, length] = m.registers.slice(7, 13);
  if (!charge(m, 2407n + memoryGas(1736, keyLength) + memoryGas(248, length))) return "oog";
  const key = readMemory(m.memory, keyAt, Number(keyLength));
  if (!(key instanceof Uint8Array)) return "panic"; // the key isn't readable
  const account = accounts.get(who === 2n ** 64n - 1n ? s : Number(who));
  return copyOut(m, account?.storage.get(toHex(key)), o, from, length);
}

/**
 * write (GP App. B.5, Ω_W): stores the value at φ₉ (φ₁₀ bytes) under the key at φ₇ (φ₈
 * bytes), or deletes the key if the value is empty. φ₇ = the old value's length, or NONE.
 * If the service's balance can't cover its new footprint, nothing changes: FULL.
 */
export function write(m: Machine, accounts: Map<number, Account>, s: number): HostExit {
  const [keyAt, keyLength, valueAt, valueLength] = m.registers.slice(7, 11);
  if (!charge(m, 2442n + memoryGas(3358, keyLength) + memoryGas(216, valueLength))) return "oog";
  const key = readMemory(m.memory, keyAt, Number(keyLength));
  const value = valueLength === 0n ? undefined : readMemory(m.memory, valueAt, Number(valueLength));
  if (!(key instanceof Uint8Array) || !(value === undefined || value instanceof Uint8Array)) {
    return "panic"; // the key or the value isn't readable
  }
  const account = accounts.get(s)!;
  const old = account.storage.get(toHex(key));
  const size = (v: Bytes | undefined) => (v ? 34n + BigInt(key.length + v.length) : 0n);
  const after = {
    ...account.info,
    items: account.info.items + (value ? 1 : 0) - (old ? 1 : 0),
    bytes: account.info.bytes + size(value) - size(old), // lesson 14.2's footprint
  };
  if (minimumBalance(after) > after.balance) {
    m.registers[7] = FULL;
    return "continue";
  }
  if (value) account.storage.set(toHex(key), value);
  else account.storage.delete(toHex(key));
  account.info = after;
  m.registers[7] = old ? BigInt(old.length) : NONE;
  return "continue";
}
```

`write` works out the account as it would be after the write, with [lesson 14.2](../14-services/02-the-service-account.md)'s
footprint sums, and only commits to it if the minimum balance is covered. That's step 5:

```ts
  if (minimumBalance(after) > after.balance) {
    m.registers[7] = FULL;
    return "continue";
  }
```

FULL isn't a crash: the machine carries on, and the service reads φ₇ and decides what to
do. The vectors' accounts arrive with their items and bytes already counted, so adding and
taking away is all it takes to keep them right.

**Replace in** `src/host.ts`

```ts
/**
 * F (GP App. B.4): the host for a service's accumulation. So far it answers gas, grow_heap,
 * fetch (whose items are the constants, 0; the entropy, 1; and the inputs, all of them, 14,
 * or one, 15), info, read and write. Anything else: WHAT.
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
      case "read":
        return read(m, a.accounts, a.id);
      case "write":
        return write(m, a.accounts, a.id);
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
✔ the reported packages: each one's hash and exports root, sorted by hash (230.8ms)
...
✔ write stores a value under a key, and the footprint grows (0.2ms)
✔ read finds it again; writing an empty value deletes it (0.1ms)
✔ FULL: a service can't keep more than its balance covers (0.2ms)
...
ℹ tests 464
ℹ suites 0
ℹ pass 464
ℹ fail 0
...
reported 464 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791738256886
...
```

Across the accumulate vectors, eight services in seven vectors (`always_accumulate-2`,
`process_one_immediate_report-1` and both `same_round_storage_isolation` among them) now
finish with the vectors' gas to the unit and the vectors' storage to the byte. [Lesson
16.7](./07-a-services-inputs.md), which builds each service's inputs from the work reports, puts them all in tests. Most
write a key called "last". Forty more services get as far as `checkpoint`, the next host
call.

<details>
<summary>lasair: FULL, in <code>lib/pvm_host.ml</code></summary>

```ocaml
      (* GP write: FULL when the UPDATED account's threshold (min balance)
         exceeds its balance -- on every non-panic branch, deletes included *)
      let over_threshold (svc : service_account) =
```

The same check, made on the account as it would be after the write. Note the last three
words of the comment: deletes included. Deleting only makes the footprint smaller, so how
can it be FULL? When the service was already short before it started. Your `write` checks
every branch too, since it compares the account as it would be, whatever the write did.

</details>

## Check your understanding

::: check
**Service 0 writes "last" → 1, 2, 3, and its footprint grows by 41 bytes. Why 41, for 7 bytes of data?**

- [ ] Every entry takes 41 bytes, whatever its size
  > No: a 1,000-byte value under "last" counts 34 + 4 + 1,000.
- [x] A flat 34 for the bookkeeping around each entry, plus the key's 4 bytes and the value's 3
  > Yes: 34 + 4 + 3 = 41, and one more item. The deposit grows with both.
- [ ] 41 is what the write cost in gas
  > No: gas and footprint are different things. The write cost 2,442 + 14 + 1 gas; the
  > footprint is what the service must hold deposit for, for as long as it keeps the entry.

**With a balance of 1,000, writing 1,000 bytes under "last" gets FULL. Why?**

- [ ] A value can be at most 1 KiB
  > No: there's no such limit here. What decides it is the deposit.
- [x] a_t would be 100 + 10 × 3 + (50 + 34 + 4 + 1,000) = 1,218, more than the balance
  > Yes: the account as it would be after the write can't afford itself, so nothing is
  > written.
- [ ] The write ran out of gas
  > No: it had 10,000 gas, and paid. FULL is an answer in φ₇, not a way of stopping.

**After that FULL, what has changed?**

- [x] Only the gas: the write was paid for, and the storage and footprint are as they were
  > Yes: the charge comes first, before the check. Then nothing is committed.
- [ ] Nothing at all, gas included
  > No: every host call pays first, whatever its answer turns out to be.
- [ ] The machine has stopped
  > No: FULL isn't a crash. The machine carries on, and the service reads φ₇ and decides
  > what to do.

**"last" holds 1, 2, 3. The service writes "last" with an empty value. What is φ₇?**

- [ ] NONE, because the key is gone now
  > No: φ₇ tells what was there *before*. NONE would mean there was nothing.
- [ ] 0, the new value's length
  > No: there is no new value. An empty one means delete.
- [x] 3, the old value's length, and the key is deleted
  > Yes: the test's eraser gets 3, and the storage is empty after.

**Whose storage can a service change with `write`?**

- [ ] Any service's, named in φ₇
  > No: `write` has no register for whose. Its φ₇ is the key's address.
- [x] Only its own, though `read` can look in any service's
  > Yes: `read`'s φ₇ names a service (2^64 − 1 for itself). `write` always changes the
  > service's own.
- [ ] Only its own, and `read` only reads its own too
  > No: `read` takes a service in φ₇, so it can look in another's storage.
:::

## What you have

Services that can remember things between accumulations, and pay for what they keep. But
a service that writes and then panics leaves half a job behind: [lesson 16.6](./06-checkpoints.md) decides
what survives.

**Say it out loud.** A service's storage is a key-value store in the state, paid for by deposit. A write it can't afford answers FULL, and nothing changes.

Next: [16.6 Checkpoints](./06-checkpoints.md)
