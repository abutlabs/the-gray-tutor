# Info

A service needs to know what it has: its balance, what it keeps, what it may spend. That's
its *account*, the record and storage [lesson 14.2](../14-services/02-the-service-account.md) read out of the state. Across the
accumulate test vectors, the first call your host can't answer yet is about accounts: `info`,
`read` or `write`. So the host needs the accounts now, and the gentlest of the three goes
first. `info` just looks.

## What the Gray Paper says

**`info`** (host call 6, App. B.5, Ω_I) hands a service an account's record. φ₇ says
whose: a service id, or 2^64 − 1 for the service itself. The record goes out as 96 bytes:

| Bytes | What |
| --- | --- |
| 32 | c, the code hash |
| 8 | b, the balance |
| 8 | a_t, the minimum balance ([lesson 14.2](../14-services/02-the-service-account.md)) |
| 8 | g, the least gas for each work-item |
| 8 | m, the least gas for each transfer's memo |
| 8 | o, the bytes it keeps |
| 4 | i, the items it keeps |
| 8 | f, the gratis storage |
| 4 each | r, the slot it was created; a, the slot it last accumulated; p, its parent |

It costs 703, and then it works exactly like `fetch`, only one register along: φ₈ is the
address, φ₉ the first byte wanted, φ₁₀ how many. No such service: NONE.

NONE is 2^64 − 1 too, the same number that means "the service itself" going in. Which one
it is depends only on the direction: in φ₇ on the way in, it asks about yourself; in φ₇ on
the way out, it says there's no such service.

The same account both ways, the state's record and what `info` hands out:

<InfoView />

Accumulation's F hands `info` two things: X's service id, and the accounts as the context X
holds them. So accumulation needs a little bundle of its own: which service is running,
the accounts, the code, the entropy and the inputs.

## The tests

The 16.2 and 16.3 helpers now build that bundle, the vector's accounts read by a helper
from `services.ts` (you'll write it in a moment):

**Replace in** `test/host.test.ts`

```ts
/** The parts of an accumulate test vector these tests read. */
type AccumulateVector = {
  input: { slot: number };
  pre_state: {
    entropy: string;
    accounts: {
      id: number;
      data: AccountJson & {
        service: { code_hash: string };
        preimage_blobs: { hash: string; blob: string }[];
      };
    }[];
  };
  post_state: { statistics: { record: { accumulate_gas_used: number } }[] };
};

/** Accumulation's host, for service 0 with a tiny program, an entropy of sevens, no inputs. */
const accumulating = accumulateHost(TINY, {
  id: 0,
  accounts: tinyAccounts(),
  code: tinyCode(),
  entropy: new Uint8Array(32).fill(7),
  inputs: [],
});

/** Service 1729's accumulation, set up as always_accumulate-1 has it: machine and host. */
function vectorService() {
  const vector = vectorJson("stf/accumulate/tiny/always_accumulate-1.json") as AccumulateVector;
  const { id, data } = vector.pre_state.accounts[0];
  const preimage = data.preimage_blobs.find((p) => p.hash === data.service.code_hash)!;
  const code = unpackCode(fromHex(preimage.blob));
  const [t, s] = [BigInt(vector.input.slot), BigInt(id)]; // the slot, the service, no inputs
  const args = Uint8Array.from([...encodeNatural(t), ...encodeNatural(s), ...encodeNatural(0n)]);
  const { memory, registers } = standardProgram(code, args);
  const machine = newMachine(deblob(code.program), registers, memory, 100_000n);
  machine.pc = 5; // accumulation
  const accounts = new Map(vector.pre_state.accounts.map((a) => [a.id, accountFromJson(a.data)]));
  const entropy = fromHex(vector.pre_state.entropy);
  const host = accumulateHost(TINY, { id, accounts, code, entropy, inputs: [] });
  const expected = BigInt(vector.post_state.statistics[0].record.accumulate_gas_used);
  return { machine, host, expected };
}
```

**Add to** `test/host.test.ts`

```ts
import { info } from "../src/host.ts";
import type { Account, AccountJson } from "../src/services.ts";
import { accountFromJson, ServiceInfo } from "../src/services.ts";
import type { Bytes } from "../src/bytes.ts";
import type { HostExit } from "../src/host.ts";
import type { Exit, Machine } from "../src/pvm/machine.ts";
import type { MemoryError } from "../src/pvm/memory.ts";

/** A service's record, made up: a balance of 1,000, 2 items in 50 bytes, created at slot 5. */
function tinyInfo(): ServiceInfo {
  return {
    version: 0,
    code_hash: new Uint8Array(32).fill(9),
    balance: 1000n,
    min_item_gas: 10n,
    min_memo_gas: 20n,
    bytes: 50n,
    deposit_offset: 0n,
    items: 2,
    creation_slot: 5,
    last_accumulation_slot: 0,
    parent_service: 0,
  };
}

/** The accounts the tests' accumulation sees: service 0, with tinyInfo's record. */
function tinyAccounts(): Map<number, Account> {
  return new Map([[0, { info: tinyInfo() }]]);
}

/** A machine about to ask info about service `who`, with a writable page at 0x20000. */
function asking(who: bigint) {
  const memory = new Map();
  addPages(memory, 0x20000, 4096, "W");
  const registers = [0n, 0n, 0n, 0n, 0n, 0n, 0n, who, 0x20000n, 0n, 96n];
  return newMachine(assemble([[0]]), registers, memory, 10_000n);
}

test("info: a service's record, 96 bytes, starting with its code hash", () => {
  const machine: Machine = asking(2n ** 64n - 1n); // 2^64 − 1: itself
  const exit: HostExit = info(machine, tinyAccounts(), 0);
  assert.equal(exit, "continue");
  assert.equal(machine.registers[7], 96n);
  const start: Bytes | MemoryError = readMemory(machine.memory, 0x20000n, 33);
  assert.deepEqual(start, Uint8Array.of(...Array(32).fill(9), 232)); // then 1,000's low byte
  assert.equal(machine.gas, 10_000n - 703n);
});

test("its minimum balance comes worked out: 100 + 10 per item + 1 per byte = 170", () => {
  const machine: Machine = asking(0n); // service 0, by number this time
  info(machine, tinyAccounts(), 0);
  const minimum: Bytes | MemoryError = readMemory(machine.memory, 0x20000n + 40n, 2);
  assert.deepEqual(minimum, Uint8Array.of(170, 0));
});

test("info about a service that isn't there: NONE", () => {
  const machine: Machine = asking(42n);
  info(machine, tinyAccounts(), 0);
  assert.equal(machine.registers[7], NONE);
});
```

The made-up record makes the minimum balance easy to check: 100 to exist, 10 for each of
its 2 items and 1 for each of its 50 bytes, 170.

## The code

An account, as accumulation sees it, is just its record so far. It will grow, and
`accountFromJson` will grow with it, so the tests and the bin never need to change when it
does:

**Add to** `src/services.ts`

```ts
/** A service account (GP §9) as accumulation sees it. So far: its record. */
export type Account = { info: ServiceInfo };

/** An account as the accumulate test vectors write it. */
export type AccountJson = { service: unknown };

/** An account from the accumulate test vectors' JSON. */
export function accountFromJson(json: AccountJson): Account {
  return { info: ServiceInfo.fromJson(json.service) };
}
```

`info` copies out exactly as `fetch` does, and `read` and `lookup` will too, so the copying
moves out of `fetch` into a function of its own:

**Replace in** `src/host.ts`

```ts
/**
 * fetch (GP App. B.5, Ω_Y): copies item φ₁₀ (with index φ₁₁) to memory at φ₇: up to φ₉
 * bytes of it, from byte φ₈ on. φ₇ becomes the item's whole length, or NONE if there's no
 * such item. `find` says what each item is, so each invocation offers its own.
 */
export function fetch(m: Machine, find: Items): HostExit {
  const [o, from, length, kind, index] = m.registers.slice(7, 12);
  const [base, rate] = FETCH_GAS[kind < 16n ? Number(kind) : 16];
  if (!charge(m, BigInt(base) + memoryGas(rate, length))) return "oog";
  return copyOut(m, kind < 16n ? find(Number(kind), index) : undefined, o, from, length);
}
```

**Add to** `src/host.ts`

```ts
import type { Account } from "./services.ts";
import { minimumBalance } from "./services.ts";

/**
 * How fetch, info, read and lookup answer (GP App. B.5): `length` bytes of v at most, from
 * byte `from`, go to memory at o, and φ₇ = |v|. No v: NONE. Nowhere to write it: panic.
 */
function copyOut(m: Machine, v: Bytes | undefined, o: bigint, from: bigint, length: bigint) {
  if (v === undefined) {
    m.registers[7] = NONE;
    return "continue";
  }
  const f = from < BigInt(v.length) ? Number(from) : v.length;
  const l = length < BigInt(v.length - f) ? Number(length) : v.length - f;
  if (writeMemory(m.memory, o, v.subarray(f, f + l))) return "panic"; // not writable
  m.registers[7] = BigInt(v.length);
  return "continue";
}

/** info (GP App. B.5, Ω_I): service φ₇'s record (its own if φ₇ = 2^64 − 1), 96 bytes. */
export function info(m: Machine, accounts: Map<number, Account>, s: number): HostExit {
  if (!charge(m, 703)) return "oog";
  const [who, o, from, length] = m.registers.slice(7, 11);
  const a = accounts.get(who === 2n ** 64n - 1n ? s : Number(who))?.info;
  const v = a && concatBytes(
    a.code_hash,
    ...[a.balance, minimumBalance(a), a.min_item_gas, a.min_memo_gas, a.bytes].map((x) =>
      encodeFixed(x, 8),
    ),
    encodeFixed(BigInt(a.items), 4),
    encodeFixed(a.deposit_offset, 8),
    ...[a.creation_slot, a.last_accumulation_slot, a.parent_service].map((x) =>
      encodeFixed(BigInt(x), 4),
    ),
  );
  return copyOut(m, v, o, from, length);
}

/**
 * What a service's accumulation runs with (GP App. B.4): which service it is, the accounts
 * as its context sees them, its code, the entropy η′₀, and its inputs, each one encoded.
 */
export type Accumulation = {
  id: number;
  accounts: Map<number, Account>;
  code: ServiceCode;
  entropy: Bytes;
  inputs: Bytes[];
};
```

`info` builds the 96 bytes in the Gray Paper's order: the five 8-byte numbers and the
three 4-byte ones in one `map` each, and the minimum balance worked out by [lesson 14.2](../14-services/02-the-service-account.md)'s
`minimumBalance`, since the record doesn't store it.

**Replace in** `src/host.ts`

```ts
/**
 * F (GP App. B.4): the host for a service's accumulation. So far it answers gas, grow_heap,
 * fetch (whose items are the constants, 0; the entropy, 1; and the inputs, all of them, 14,
 * or one, 15) and info. Anything else: WHAT.
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
      default:
        return unknown(m);
    }
  };
}
```

The bin hands over the bundle too:

**Replace in** `bin/host.ts`

```ts
import { accountFromJson } from "../src/services.ts";

const answer = accumulateHost(TINY, {
  id: account.id,
  accounts: new Map([[account.id, accountFromJson(account.data)]]),
  code,
  entropy: fromHex(vector.pre_state.entropy),
  inputs: [],
});
```

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ the reported packages: each one's hash and exports root, sorted by hash (402.9ms)
...
✔ service 1729 accumulates on exactly the 16,417 gas the test vector says (127.6ms)
✔ info: a service's record, 96 bytes, starting with its code hash (0.3ms)
✔ its minimum balance comes worked out: 100 + 10 per item + 1 per byte = 170 (0.1ms)
✔ info about a service that isn't there: NONE (0.1ms)
...
ℹ tests 461
ℹ suites 0
ℹ pass 461
ℹ fail 0
...
reported 461 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791738239858
...
```

Service 1729 still matches, to the gas: its accumulation never asks `info`, so nothing
it does has changed. The forty first-round accumulations that start with `info` get
further now, and the next thing they ask for is `read`.

<details>
<summary>lasair: the minimum balance, in <code>lib/pvm_host.ml</code></summary>

```ocaml
    let threshold = service_threshold svc in
    for i = 0 to 7 do
      Bytes.set_uint8 info_data (40 + i)
        (Int64.to_int (Int64.shift_right_logical threshold (i * 8)) land 0xFF)
    done;
```

lasair writes the 96 bytes one field at a time, eight bytes of each number in a loop. The
field worth a second look is a_t. lasair's accounts carry a cached copy of it, and the
comment above these lines says why `info` mustn't use it: once `write` changes a service's
items and bytes in the middle of an accumulation, the cached value is out of date. Worked
out on the spot, as both clients do here, it can't go stale.

</details>

## Check your understanding

::: check
**A service calls `info` with φ₇ = 2^64 − 1. Whose record does it get?**

- [ ] Nobody's: 2^64 − 1 is NONE
  > No: NONE is what the host writes back for "no such item". Going in, the same number
  > means "myself".
- [x] Its own
  > Yes: the test asks with 2^64 − 1 and gets service 0's record, its code hash of nines
  > first.
- [ ] The newest service in the accounts
  > No: a service is named by its id. 2^64 − 1 stands for the one asking.

**The made-up record keeps 2 items in 50 bytes, with no gratis storage. Why is its a_t 170?**

- [ ] The record stores 170
  > No: the record doesn't keep a_t at all. `info` works it out.
- [x] 100 to exist, 10 for each of its 2 items, 1 for each of its 50 bytes: 100 + 20 + 50
  > Yes: the minimum balance, worked out from the footprint, and written as bytes 40 to 47
  > of the 96.
- [ ] It's the balance, 1,000, less what the items cost
  > No: a_t doesn't depend on the balance. It's what the service must keep, whatever it
  > has.

**Why is a_t worked out on the spot, not kept with the record?**

- [x] A `write` in the middle of an accumulation changes the items and bytes, so a kept copy would go stale
  > Yes: lasair's accounts carry a cached copy, and its comment says why `info` mustn't
  > use it.
- [ ] Keeping it would make the 96 bytes longer
  > No: the 96 bytes include a_t either way. The question is only where its value comes
  > from.
- [ ] Working it out costs less gas
  > No: `info` costs a flat 703 either way.

**A service asks `info` about service 42, which doesn't exist. What happens?**

- [ ] A panic
  > No: `info` panics only when it can't write to the memory at φ₈.
- [ ] 96 zero bytes are written
  > No: nothing is written at all.
- [x] φ₇ = NONE, and the machine carries on
  > Yes: no such service is an ordinary answer, and the service decides what to do with
  > it.
:::

## What you have

A host that knows the accounts, and can tell a service about any of them. Looking isn't
touching: [lesson 16.5](./05-storage.md) lets a service read and write its own storage.

**Say it out loud.** `info` shows a service any account's record, with the minimum balance worked out on the spot.

Next: [16.5 Storage](./05-storage.md)
