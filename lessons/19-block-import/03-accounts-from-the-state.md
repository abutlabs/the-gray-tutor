# Accounts from the state

**In one sentence:** everything a service keeps sits in the state under a key made by
hashing, so a host call finds a thing by working out its key again, never by searching.

Pick a kind of entry and a service. Watch what gets hashed, and where the service's id
lands in the key.

<a id="try-it"></a>

<EntryKey />

## The idea

Real blocks mean real accounts, and those look nothing like the test vectors'. An account
read from the state is its record and a bag of entries, each under a hashed key. The host
calls you wrote in [Part 16](../16-host-calls/index.md) and
[Part 17](../17-accumulation/index.md) look things up in the vectors' tidy accounts. Here
they'd find nothing.

Think of a wall of lockers, where a locker's number is worked out from the name of the
thing inside. Know the name, and you walk straight to the locker. Stand in front of a
locker, and its number tells you nothing about the name.

A host call always knows the name: the service says which storage key, which hash, or
which hash and length it wants. From that, the client works out where the entry is, and
looks there. It can never go the other way. It never needs to.

This lesson writes six small functions that know where each thing lives, in either kind
of account. Each is a [*helper function*](../glossary.md#helper-function): it hides one
detail from the code that calls it. Then the host calls are rewritten to use them, one at
a time, without changing what they do.

## What the Gray Paper says

Appendix D, the last three rows of T(σ): service s keeps

- the value under storage key k at C(s, ℰ₄(2^32 − 1) ⌢ k),
- the preimage whose hash is h at C(s, ℰ₄(2^32 − 2) ⌢ h),
- its request for h, l bytes long, at C(s, ℰ₄(l) ⌢ h), as the request's history encoded:
  the slots, four bytes each, with how many in front.

Try all three on [the key at the top](#try-it).

So a host call that knows the key k, the hash h or the length l can work out exactly
where the entry is, and look it up. It can never go the other way, from an entry back to
its k. That's all your client needs: every host call starts from a key the service names.

## The tests

**Add to** `test/whole-state.test.ts`

```ts
import { serviceCode, preimageOf, setStorageValue, storageValue } from "../src/services.ts";
import type { Account } from "../src/services.ts";
import type { Bytes } from "../src/bytes.ts";
import { storageKey } from "../src/state.ts";

test("an account read from the state: the helpers find its code and keep its storage", () => {
  const { entries } = traceState("storage", 50);
  const account: Account = readState(TINY, entries).accounts.get(0)!;
  const code: Bytes | undefined = preimageOf(account, 0, toHex(account.info.code_hash));
  assert.deepEqual(code, serviceCode(entries, 0)); // found by its state key
  const key: Bytes = new TextEncoder().encode("hello");
  setStorageValue(account, 0, key, Uint8Array.of(1, 2, 3));
  const value: Bytes | undefined = storageValue(account, 0, key);
  assert.deepEqual(value, Uint8Array.of(1, 2, 3));
  const kept: boolean = account.items!.has(toHex(storageKey(0, key))); // C(0, ℰ₄(2^32 − 1) ⌢ k)
  assert.ok(kept);
});
```

Service 0's code, found by the hash in its record, is the same bytes [lesson 14.2](../14-services/02-the-service-account.md)'s
`serviceCode` finds by trying every entry. And a value stored through the helper lands
under its state key.

## The code

The two keys [lesson 6.2](../06-state-and-merklization/02-state-keys.md) didn't need:

**Add to** `src/state.ts`

```ts
/** Where service s keeps the preimage whose hash is h: C(s, ℰ₄(2^32 − 2) ⌢ h). */
export function preimageHashKey(s: number, h: Bytes): Bytes {
  return serviceItemKey(s, concatBytes(encodeFixed(2n ** 32n - 2n, 4), h));
}

/** Where service s keeps the value under storage key k: C(s, ℰ₄(2^32 − 1) ⌢ k). */
export function storageKey(s: number, k: Bytes): Bytes {
  return serviceItemKey(s, concatBytes(encodeFixed(2n ** 32n - 1n, 4), k));
}
```

Then the helpers, one pair for each kind of entry:

**Add to** `src/services.ts`

```ts
import { storageKey, preimageHashKey } from "./state.ts";

/** The value service s keeps under storage key k: by k itself in a test vector's account,
 * by its state key in an account read from the state. */
export function storageValue(a: Account, s: number, k: Bytes): Bytes | undefined {
  return a.items ? a.items.get(toHex(storageKey(s, k))) : a.storage.get(toHex(k));
}

/** Keeps `value` under storage key k for service s, or drops the key if there's none. */
export function setStorageValue(a: Account, s: number, k: Bytes, value: Bytes | undefined) {
  const [map, key] = a.items ? [a.items, toHex(storageKey(s, k))] : [a.storage, toHex(k)];
  if (value) map.set(key, value);
  else map.delete(key);
}

/** The preimage of hash h (in hex) that service s keeps, if any. */
export function preimageOf(a: Account, s: number, h: string): Bytes | undefined {
  return a.items ? a.items.get(toHex(preimageHashKey(s, fromHex(h)))) : a.preimages.get(h);
}

/** Keeps the preimage of hash h for service s, or drops it. */
export function setPreimage(a: Account, s: number, h: string, preimage: Bytes | undefined) {
  const [map, key] = a.items ? [a.items, toHex(preimageHashKey(s, fromHex(h)))] : [a.preimages, h];
  if (preimage) map.set(key, preimage);
  else map.delete(key);
}

/** Service s's request for the preimage of hash h (in hex), l bytes long: its history. */
export function requestOf(a: Account, s: number, h: string, l: bigint): number[] | undefined {
  if (!a.items) return a.requests.get(`${h}:${l}`);
  const value = a.items.get(toHex(requestKey(s, fromHex(h), Number(l))));
  return value && decode(RequestHistory, value);
}

/** Records service s's request for hash h, l bytes long, as `slots`, or drops it. */
export function setRequest(a: Account, s: number, h: string, l: bigint, slots?: number[]) {
  if (!a.items) {
    if (slots) a.requests.set(`${h}:${l}`, slots);
    else a.requests.delete(`${h}:${l}`);
    return;
  }
  const key = toHex(requestKey(s, fromHex(h), Number(l)));
  if (slots) a.items.set(key, encode(RequestHistory, slots));
  else a.items.delete(key);
}
```

```ts
  return a.items ? a.items.get(toHex(storageKey(s, k))) : a.storage.get(toHex(k));
```

Each one asks the same question first: was this account read from the state? If so, its
`items` has the entry under its state key. If not, the old map has it under its own key.
A request's history is stored encoded, so `requestOf` decodes it and `setRequest` encodes
it.

**Run**

```sh
npm test
```

```text
...
✔ an account read from the state: the helpers find its code and keep its storage (13.448416ms)
...
ℹ tests 643
ℹ suites 0
ℹ pass 643
ℹ fail 0
...
```

### The host calls, one at a time

Now the refactor. Every host call that reads or changes an account's storage, preimages or
requests swaps its own lookup for a helper's, and nothing else. After each swap the tests
still pass: the test vectors' accounts are found where they always were.

`read` and `write`, for storage:

**Replace in** `src/host.ts`

```ts
import { storageValue, setStorageValue, preimageOf, setPreimage, requestOf, setRequest } from "./services.ts";

/**
 * read (GP App. B.5, Ω_R): from the storage of service φ₇ (its own if φ₇ = 2^64 − 1), the
 * value under the key in memory at φ₈ (φ₉ bytes long), copied out like fetch from φ₁₀ on.
 */
export function read(m: Machine, accounts: Map<number, Account>, s: number): HostExit {
  const [who, keyAt, keyLength, o, from, length] = m.registers.slice(7, 13);
  if (!charge(m, 2407n + memoryGas(1736, keyLength) + memoryGas(248, length))) return "oog";
  const key = readMemory(m.memory, keyAt, Number(keyLength));
  if (!(key instanceof Uint8Array)) return "panic"; // the key isn't readable
  const owner = who === 2n ** 64n - 1n ? s : Number(who);
  const account = accounts.get(owner);
  return copyOut(m, account && storageValue(account, owner, key), o, from, length);
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
  const old = storageValue(account, s, key);
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
  setStorageValue(account, s, key, value);
  account.info = after;
  m.registers[7] = old ? BigInt(old.length) : NONE;
  return "continue";
}
```

```ts
  const owner = who === 2n ** 64n - 1n ? s : Number(who);
  const account = accounts.get(owner);
  return copyOut(m, account && storageValue(account, owner, key), o, from, length);
```

`read` may read another service's storage, so the helper is told whose: the owner's id is
part of every state key.

`lookup`, for preimages, and `query`, `solicit` and `forget`, for requests:

**Replace in** `src/host.ts`

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
  const owner = who === 2n ** 64n - 1n ? s : Number(who);
  const account = accounts.get(owner);
  return copyOut(m, account && preimageOf(account, owner, toHex(hash)), o, from, length);
}

/**
 * query (GP App. B.7, Ω_Q): what has become of the service's request for the preimage of
 * φ₇'s hash, φ₈ bytes long. The slots in its history come back packed into φ₇ and φ₈:
 * their count in φ₇'s low 32 bits, the first above it, the second and third in φ₈.
 */
export function query(m: Machine, a: Accumulation): HostExit {
  if (!charge(m, 643)) return "oog";
  const [length, hash] = [m.registers[8], requestedHash(m)];
  if (length >= 2n ** 32n) return setTo(m, HUH); // no preimage is that long
  if (!hash) return "panic"; // the hash isn't readable
  const slots = requestOf(a.accounts.get(a.id)!, a.id, hash, length);
  if (!slots) {
    [m.registers[7], m.registers[8]] = [NONE, 0n];
    return "continue";
  }
  const [x, y, z] = slots.map(BigInt);
  m.registers[7] = BigInt(slots.length) + (x ?? 0n) * 2n ** 32n;
  m.registers[8] = (y ?? 0n) + (z ?? 0n) * 2n ** 32n;
  return "continue";
}

/**
 * solicit (GP App. B.7, Ω_S): asks for the preimage of φ₇'s hash, φ₈ bytes long. A new
 * request starts with no slots; one already provided and since forgotten ([x, y]) is asked
 * for again at slot t. Anything else: HUH. A request costs deposit (lesson 14.2): FULL if
 * the balance can't cover it.
 */
export function solicit(m: Machine, a: Accumulation, t: number): HostExit {
  if (!charge(m, 2193)) return "oog";
  const [length, hash] = [m.registers[8], requestedHash(m)];
  if (length >= 2n ** 32n) return setTo(m, HUH);
  if (!hash) return "panic";
  const account = a.accounts.get(a.id)!;
  const slots = requestOf(account, a.id, hash, length);
  if (slots && slots.length !== 2) return setTo(m, HUH);
  const { items, bytes } = account.info;
  const added = { ...account.info, items: items + 2, bytes: bytes + 81n + length }; // 14.2
  const info = slots ? account.info : added;
  if (info.balance < minimumBalance(info)) return setTo(m, FULL);
  setRequest(account, a.id, hash, length, slots ? [...slots, t] : []);
  account.info = info;
  return setTo(m, OK);
}

/**
 * forget (GP App. B.7, Ω_F): gives up on the preimage of φ₇'s hash, φ₈ bytes long. A
 * request never provided, or provided and forgotten more than D slots ago, goes, preimage
 * and all. One provided at x is marked forgotten now, [x, t]; one asked for again after
 * that ([x, y, w], y long enough ago) becomes [w, t]. Anything else: HUH.
 */
export function forget(m: Machine, a: Accumulation, t: number, D: number): HostExit {
  if (!charge(m, 3250)) return "oog";
  const [length, hash] = [m.registers[8], requestedHash(m)];
  if (length >= 2n ** 32n) return setTo(m, HUH);
  if (!hash) return "panic";
  const account = a.accounts.get(a.id)!;
  const slots = requestOf(account, a.id, hash, length);
  const expired = (y: number) => y < t - D;
  if (slots?.length === 0 || (slots?.length === 2 && expired(slots[1]))) {
    setRequest(account, a.id, hash, length); // gone, and the preimage with it
    setPreimage(account, a.id, hash, undefined);
    const { items, bytes } = account.info;
    account.info = { ...account.info, items: items - 2, bytes: bytes - 81n - length };
  } else if (slots?.length === 1) {
    setRequest(account, a.id, hash, length, [slots[0], t]);
  } else if (slots?.length === 3 && expired(slots[1])) {
    setRequest(account, a.id, hash, length, [slots[2], t]);
  } else {
    return setTo(m, HUH);
  }
  return setTo(m, OK);
}
```

`eject`, `new` and `provide`, which look at another service's requests, or make a service
with one:

**Replace in** `src/host.ts`

```ts
/**
 * eject (GP App. B.7, Ω_J): removes service φ₇ and takes its balance, if this service may.
 * The other service must have named this one as its ejector (its code hash is this
 * service's id, in 32 bytes), hold nothing but one request, for the preimage at φ₈ (as
 * long as its footprint minus 81), and have forgotten that preimage more than D slots ago.
 * WHO if it doesn't exist or names someone else, HUH if it isn't ready; nothing changes.
 */
export function eject(m: Machine, a: Accumulation, t: number, D: number): HostExit {
  if (!charge(m, 458)) return "oog";
  const [d, o] = m.registers.slice(7, 9);
  const hash = readMemory(m.memory, o, 32);
  if (!(hash instanceof Uint8Array)) return "panic"; // the hash isn't readable
  const other = Number(d) === a.id ? undefined : a.accounts.get(Number(d));
  const ejector = toHex(encodeFixed(BigInt(a.id), 32)); // E₃₂(this service's id)
  if (!other || toHex(other.info.code_hash) !== ejector) return setTo(m, WHO);
  const length = (other.info.bytes > 81n ? other.info.bytes : 81n) - 81n; // l
  const slots = requestOf(other, Number(d), toHex(hash), length);
  if (other.info.items !== 2 || !slots) return setTo(m, HUH);
  if (slots.length !== 2 || slots[1] >= t - D) return setTo(m, HUH); // not forgotten long ago
  const self = a.accounts.get(a.id)!;
  self.info = { ...self.info, balance: self.info.balance + other.info.balance };
  a.accounts.delete(Number(d));
  return setTo(m, OK);
}

/**
 * new (GP App. B.7, Ω_N): creates a service whose code is the preimage of the 32-byte hash
 * at φ₇, φ₈ bytes long, which it asks for; with least gases φ₉ (to accumulate) and φ₁₀ (per
 * memo), and φ₁₁ of gratis storage. Its balance is its own minimum, paid by this service.
 * Its id: φ₁₂ if this is the registrar asking for an id below S, otherwise the run's next
 * free id. φ₇ = the new id. HUH: gratis from anyone but the manager; CASH: this service
 * can't afford it; FULL: the registrar's id is taken.
 */
export function newService(
  m: Machine,
  a: Accumulation,
  t: number,
  ids: NewIds,
  privileges: Privileges,
): HostExit {
  if (!charge(m, 3855)) return "oog";
  const [o, length, minGas, memoGas, gratis, wanted] = m.registers.slice(7, 13);
  const codeHash = readMemory(m.memory, o, 32);
  if (!(codeHash instanceof Uint8Array) || length >= 2n ** 32n) return "panic";
  const info = {
    version: 0, code_hash: codeHash, balance: 0n, min_item_gas: minGas, min_memo_gas: memoGas,
    bytes: 81n + length, deposit_offset: gratis, items: 2, creation_slot: t,
    last_accumulation_slot: 0, parent_service: a.id,
  };
  info.balance = minimumBalance(info); // a_t: just enough to keep what it keeps
  const self = a.accounts.get(a.id)!;
  const left = self.info.balance - info.balance; // what this service has after paying
  if (gratis !== 0n && a.id !== privileges.bless) return setTo(m, HUH);
  if (left < minimumBalance(self.info)) return setTo(m, CASH);
  const chosen = a.id === privileges.register && wanted < BigInt(MIN_PUBLIC_ID);
  if (chosen && a.accounts.has(Number(wanted))) return setTo(m, FULL);
  const id = chosen ? Number(wanted) : ids.next;
  const made: Account = { info, storage: new Map(), preimages: new Map(), requests: new Map() };
  if (self.items) made.items = new Map(); // read from the state, so its new service is too
  setRequest(made, id, toHex(codeHash), length, []); // it asks for its own code
  a.accounts.set(id, made);
  self.info = { ...self.info, balance: left };
  if (!chosen) { // the next free id: 42 further on, round the public range
    ids.next = check(((id - MIN_PUBLIC_ID + 42) % PUBLIC_IDS) + MIN_PUBLIC_ID, ids.taken);
  }
  return setTo(m, BigInt(id));
}

/**
 * provide (GP App. B.7, Ω_♈): hands service φ₇ (or this service, if φ₇ is 2^64 − 1) the φ₉
 * bytes at φ₈, a preimage it asked for. It arrives at the end of the round. HUH if φ₉ can't
 * be a length, the service hasn't asked for exactly this preimage or already has it, or
 * this run provided it already; WHO if there's no such service; unreadable bytes: panic.
 */
export function provide(m: Machine, a: Accumulation, outbox: Outbox): HostExit {
  const [w, o, z] = m.registers.slice(7, 10);
  if (!charge(m, 3980n + memoryGas(2264, z))) return "oog";
  if (z >= 2n ** 32n) return setTo(m, HUH); // not a blob's length
  const preimage = readMemory(m.memory, o, Number(z));
  if (!(preimage instanceof Uint8Array)) return "panic"; // the bytes aren't readable
  const s = w === 2n ** 64n - 1n ? a.id : Number(w);
  const account = w < 2n ** 32n || s === a.id ? a.accounts.get(s) : undefined;
  if (!account) return setTo(m, WHO);
  const slots = requestOf(account, s, toHex(blake2b256(preimage)), z);
  if (slots?.length !== 0) return setTo(m, HUH); // not asked for, or not waiting for it
  const provided = (outbox.provided ??= []);
  const same = (p: Provision) => p.service === s && toHex(p.preimage) === toHex(preimage);
  if (provided.some(same)) return setTo(m, HUH); // this run gave it already
  provided.push({ service: s, preimage });
  return setTo(m, OK);
}
```

```ts
  const made: Account = { info, storage: new Map(), preimages: new Map(), requests: new Map() };
  if (self.items) made.items = new Map(); // read from the state, so its new service is too
  setRequest(made, id, toHex(codeHash), length, []); // it asks for its own code
```

A service made by an account from the state is made the same way, so its first request
goes where the state will look for it.

**Run**

```sh
npm test
```

And accumulation, which finds each service's code and delivers provided preimages:

**Replace in** `src/accumulate.ts`

```ts
import { preimageOf, requestOf, setRequest, setPreimage } from "./services.ts";

/** Service s's code (GP §9, a_c): its preimage of its own code hash, unpacked. */
function codeOf(account: Account, s: number): ServiceCode | undefined {
  const preimage = preimageOf(account, s, toHex(account.info.code_hash));
  return preimage && unpackCode(preimage);
}

/**
 * P (GP §12): the preimages provided in a round reach their services. Each one a service
 * still waits for (its request is still []) is stored, and the request says it arrived at
 * `slot`, the block's. One for a service that's gone, or no longer waiting, is dropped.
 */
export function applyProvisions(
  accounts: Map<number, Account>,
  provided: Provision[],
  slot: number,
) {
  for (const { service, preimage } of provided) {
    const account = accounts.get(service);
    const hash = toHex(blake2b256(preimage));
    const length = BigInt(preimage.length);
    const waiting = account && requestOf(account, service, hash, length)?.length === 0;
    if (!waiting) continue; // gone, or not waiting for it
    setRequest(account, service, hash, length, [slot]);
    setPreimage(account, service, hash, preimage);
  }
}
```

**Replace in** `src/accumulate.ts`

```ts
/**
 * Δ* (GP §12), one round: every service with work in `reports`, every always-accumulate
 * service, and every service a transfer is sent to, runs once from the same accounts and
 * keeps its own account as its run leaves it. The transfers' money arrives before its code
 * runs, even if it has none. Every run starts from the same privileges too, and they are
 * merged after the round. Returns the accounts after the round, the gas each service used,
 * the transfers they sent (service by service in order of id), the privileges after the
 * round, and the cores' new authorizer queues.
 */
export function accumulateRound(
  config: Config,
  accounts: Map<number, Account>,
  free: Map<number, bigint>, // χ_Z: the services that accumulate every block, and their gas
  entropy: Bytes,
  slot: number,
  reports: WorkReport[],
  transfers: Transfer[], // the transfers sent in the round before
  privileges = NO_PRIVILEGES, // χ as the round starts
) {
  const digests = reports.flatMap((r) => r.results);
  const ids = [...free.keys(), ...digests.map((d) => d.service_id)];
  const services = [...new Set([...ids, ...transfers.map((t) => t.dest)])].sort((x, y) => x - y);
  const after = copyAccounts(accounts);
  const used = new Map<number, bigint>();
  const sent: Transfer[] = [];
  const powers = new Map<number, Privileged>(); // each run's privileges, as it left them
  const removed = new Set<number>(); // accounts some run ejected
  const outputs: AccumulationOutput[] = []; // b: what each run yielded
  const provided: Provision[] = []; // 𝐩: the preimages runs provided
  for (const s of services) {
    const mine = copyAccounts(accounts); // every service starts from the same accounts
    const account = mine.get(s);
    const money = transfers.filter((t) => t.dest === s).reduce((n, t) => n + t.amount, 0n);
    if (account) account.info = { ...account.info, balance: account.info.balance + money };
    const code = account && codeOf(account, s);
    if (!code) {
      if (account) after.set(s, account); // no code to run: it keeps the money, that's all
      used.set(s, 0n);
      continue;
    }
    const { inputs, gas } = serviceInputs(reports, s, free.get(s) ?? 0n, transfers);
    const checkpoint = copyAccounts(mine);
    const a = { id: s, accounts: mine, checkpoint, code, entropy, inputs, privileges };
    const result = accumulate(config, a, slot, gas);
    const left = result.accounts; // the accounts as this run left them
    after.set(s, left.get(s)!);
    for (const [id, account] of left) if (!accounts.has(id)) after.set(id, account); // new
    for (const id of accounts.keys()) if (!left.has(id)) removed.add(id); // ejected
    used.set(s, result.gasUsed);
    sent.push(...result.transfers);
    powers.set(s, result.privileged);
    if (result.yielded) outputs.push({ service: s, hash: result.yielded });
    provided.push(...result.provided);
  }
  for (const id of removed) after.delete(id); // a removal wins over any run's own copy
  applyProvisions(after, provided, slot); // the preimages provided, last of all
  const { privileges: next, queues, free: nextFree, staging } = mergePrivileges(privileges, powers);
  const merged = { privileges: next, queues, free: nextFree, staging };
  return { accounts: after, used, transfers: sent, ...merged, outputs };
}
```

```ts
    const code = account && codeOf(account, s);
```

The only change in `accumulateRound`: `codeOf` needs the service's id now.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ an account read from the state: the helpers find its code and keep its storage (11.530792ms)
...
ℹ tests 643
ℹ suites 0
ℹ pass 643
ℹ fail 0
...
reported 643 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791773622404
...
```

Green, and every accumulate vector passes as before. The refactor changed where things are
looked up, not what any call does. Whether services run right on accounts from the state
is [lesson 19.4](./04-importing-a-block.md)'s test, on real blocks.

<details>
<summary>lasair: the same markers, in <code>lib/merklization.ml</code></summary>

```ocaml
(** Storage key marker: 2^32 - 1 *)
let storage_key_marker = 0xFFFFFFFF

(** Preimage key marker: 2^32 - 2 *)
let preimage_key_marker = 0xFFFFFFFE
```

The four bytes in front of a storage key or a preimage's hash, the same as your
`storageKey` and `preimageHashKey` put there. A request puts its length in their place.
lasair's host calls work out these keys directly, since its state is only
entries; it has no second kind of account to tell apart.

</details>

## Check your understanding

::: check
**A host call wants service 0's value under storage key `hello`. How does it find it among 154 entries?**

- [ ] It reads every entry until it finds the one for `hello`
  > No: it couldn't tell which one that is, since a hash can't be turned back into
  > `hello`. And it doesn't need to.
- [x] It works out the state key from 0 and `hello`, and looks that key up
  > Yes: the value is at C(0, ℰ₄(2^32 − 1) ⌢ `hello`). Knowing s and k is knowing
  > where the entry is.
- [ ] It can't: storage can only be found in a test vector's account
  > No: that was the problem this lesson solves. From s and k, the call works out
  > where the value is.

**Why does a storage key get ℰ₄(2^32 − 1) in front of it, and a preimage's hash ℰ₄(2^32 − 2)?**

- [ ] They're the value's length
  > No: a request puts its length there. Storage and preimages put a fixed marker.
- [ ] They're the service's id
  > No: the id goes in separately, woven into bytes 0, 2, 4 and 6 of the state key.
- [x] They keep the kinds apart, so the same 32 bytes as a storage key and as a preimage's hash land on different entries
  > Yes: the marker is hashed along with what follows it, so the two state keys come
  > out different.

**`read` asks for `hello` in service 7's storage. Why must it tell the helper whose storage?**

- [x] The owner's id is part of every state key
  > Yes: `hello` is at `00 a5 00 6f …` for service 0 and `07 a5 00 6f …` for service
  > 7. Only byte 0, the id's lowest byte, differs.
- [ ] It needn't: a storage key lands on the same entry for every service
  > No: the id is woven into the state key, so the same `hello` lands on a different
  > entry for each service.
- [ ] To check that service 7 lets other services read it
  > No: `read` may read any service's storage. The id is needed to find the entry,
  > not to ask permission.

**Could your client list every storage key service 0 has, from the state alone?**

- [ ] Yes: each key is in its state key
  > No: a state key holds a hash of the storage key, and a hash can't be turned back.
- [x] No: it can go from a key to its entry, never from an entry to its key
  > Yes: and it never needs to, because every host call starts from a key the service
  > names.
- [ ] Yes, but only by asking the service
  > No: a service reads a key it already knows. Nothing in the host calls lists them.

**Every accumulate vector still passes after the host calls switch to the helpers. What does that show?**

- [ ] That services run right on accounts from the state
  > No: the vectors' accounts aren't from the state. Whether those run right is
  > [lesson 19.4](./04-importing-a-block.md)'s test, on real blocks.
- [x] That the switch changed where things are looked up, not what any call does
  > Yes: the vectors' accounts are found where they always were. A refactor should
  > leave every result as it was, and the vectors show it did.
- [ ] Nothing: the accumulate vectors never make host calls
  > No: their services' code calls the host as it runs, and those calls now go
  > through the helpers.
:::

## What you have

Host calls that work on both kinds of account: the test vectors', and the state's. With
the whole state read, and every step able to run on it, a real block can go all the way
through: [lesson 19.4](./04-importing-a-block.md).

**Say it out loud.** A state key is mostly a hash, so a key finds its entry but an entry can't give back its key. That's enough: every host call starts from a key the service names.

Next: [19.4 Importing a block](./04-importing-a-block.md)
