# Creating a service

Services can make services. A running service calls `new` with the hash of the new one's
code, pays its starting balance, and gets back the new service's id. This lesson builds
the call, including one place where JAM picks a number nobody could have guessed. Four
more official vectors pass whole, among them three that eject a service and then create
one at the same id.

## New words

- **Public id.** A service id of 2^16 or more (S = 65,536). Anyone may create a service
  with one; ids below S are the registrar's to hand out. *Example:* 70,000 is public, 5
  isn't.
- **Next free id.** The id a run's next `new` will hand out: worked out from the creating
  service's id, η′₀ and the slot, so no one can aim for a particular id, then 42 further on
  after each use. *Example:* 70,000, then 70,042.
- **Gratis storage.** A discount on a service's deposit: storage it may keep without
  paying for it. Only the manager may give it. *Example:* gratis 5 from anyone else: `HUH`.

All three are in the [glossary](../glossary.md).

## What the Gray Paper says

`new` is host call 19 (Appendix B.7, Ω_N). Service s asks for a new service:

1. **Read.** The code's hash is the 32 bytes at φ₇ (unreadable: panic), the code's length
   φ₈ (2^32 or more: panic), its least gas per item φ₉ and per memo φ₁₀, its gratis storage
   φ₁₁, and an id it would like, φ₁₂.
2. **The new account.** It keeps one request, for its own code, φ₈ bytes long: two items,
   81 + φ₈ bytes. Its balance is its own minimum balance for that, and s pays it. Created
   now, last accumulated never, parent s.
3. **Maybe refuse.** `HUH` if it asks for gratis storage and s isn't the manager. `CASH`
   if paying would leave s below its own minimum balance. `FULL` if s is the registrar
   asking for an id below S that's taken.
4. **Its id.** If s is the registrar asking for an id below S: that id. Otherwise the run's
   next free id, which then moves 42 further on (round the public range, skipping any id
   already taken). φ₇ = the new id. It costs 3,855 gas.

Where does a run's first free id come from? Hash s's id, η′₀ and the slot, take the first
four bytes as a number, fold it into the public range, and skip ids already taken. Nobody
knows η′₀ until the block, so nobody can aim for an id.

One honest note: no official vector creates a service at a public id, so that formula is
checked against the Gray Paper and by hand, not by a vector. It's in
[HARDENING.md](https://github.com/abutlabs/the-gray-tutor/blob/main/HARDENING.md), to confirm against the conformance fuzzer (no block-import trace
creates a service).

**The round** already handles new accounts: [lesson 17.7](./07-ejecting-a-service.md) taught it that an id a run created
joins the accounts after the round. One case surprises: a run that ejects service 2 and
then creates a service at id 2 leaves the *old* service 2 in place. The id was there before
the round and is there after, so to the Gray Paper's merge it is neither created (n) nor
removed (m). Three of the new vectors do exactly that, and end with the old service 2.

## The tests

**Add to** `test/host.test.ts`

```ts
import { newIds, newService, NO_PRIVILEGES } from "../src/host.ts";
import type { Exit, Machine } from "../src/pvm/machine.ts";
import type { NewIds } from "../src/host.ts";
import type { Bytes } from "../src/bytes.ts";

/** A machine about to create a service: code HASH, `length` bytes, `gratis`, id `wanted`. */
function creating(length: bigint, gratis = 0n, wanted = 0n) {
  const memory = new Map();
  addPages(memory, 0x20000, 4096, "W");
  writeMemory(memory, 0x20000n, HASH);
  const registers = [0n, 0n, 0n, 0n, 0n, 0n, 0n, 0x20000n, length, 10n, 10n, gratis, wanted];
  return newMachine(assemble([[0]]), registers, memory, 10_000n);
}

test("new: a service pays for another, which gets the next id, or the registrar's choice", () => {
  const a: Accumulation = bundle(); // service 0: 1000, of which 170 must stay
  const ids: NewIds = { next: 70_000, taken: new Set([0]) };
  const machine: Machine = creating(20n); // 20 bytes of code: 81 + 20 bytes, 2 items
  const exit: HostExit = newService(machine, a, 7, ids, NO_PRIVILEGES);
  assert.equal(exit, "continue");
  assert.equal(machine.registers[7], 70_000n); // its id
  assert.equal(a.accounts.get(70_000)!.info.balance, 221n); // 100 + 2 × 10 + 101
  assert.equal(a.accounts.get(0)!.info.balance, 1000n - 221n); // paid by service 0
  assert.equal(ids.next, 70_042); // the next one: 42 further on
  const registrar: Privileges = { ...NO_PRIVILEGES, register: 0 };
  const chosen: Machine = creating(20n, 0n, 5n); // service 0, the registrar, asks for id 5
  newService(chosen, a, 7, ids, registrar);
  assert.equal(chosen.registers[7], 5n);
  assert.equal(ids.next, 70_042); // a chosen id doesn't move the next one
});

test("new refuses: gratis from a non-manager, not enough money, a registrar's id taken", () => {
  const answer = (machine: ReturnType<typeof creating>, privileges = NO_PRIVILEGES) => {
    newService(machine, bundle(), 7, { next: 70_000, taken: new Set([0]) }, privileges);
    return machine.registers[7];
  };
  const gratis: bigint = answer(creating(20n, 5n)); // only the manager gives gratis storage
  assert.equal(gratis, HUH);
  const tooPoor: bigint = answer(creating(900n)); // 1101 for it would leave too little
  assert.equal(tooPoor, CASH);
  const taken: bigint = answer(creating(20n, 0n, 0n), { ...NO_PRIVILEGES, register: 0 });
  assert.equal(taken, FULL);
});

test("a run's first new id is public, and skips ids already taken", () => {
  const entropy: Bytes = new Uint8Array(32);
  const { next }: NewIds = newIds(0, entropy, 7, new Set());
  assert.ok(next >= 2 ** 16);
  const skipped: NewIds = newIds(0, entropy, 7, new Set([next])); // taken: one up
  assert.equal(skipped.next, next + 1);
});
```

The numbers, by hand: a new service with 20 bytes of code keeps 2 items and 81 + 20 = 101
bytes, so its minimum balance is 100 + 2 × 10 + 101 = 221. Service 0 has 1000 and must keep
170, so it can pay. With 900 bytes of code the new one would need 1101: `CASH`.

<NewService />

Then whole blocks:

**Replace in** `test/accumulate.test.ts`

```ts
/** The vectors whose whole block needs nothing beyond this lesson. */
const BLOCK_CASES = [
  "accumulate_ready_queued_reports-1", "always_accumulate-1", "always_accumulate-2",
  "assign_from_non_assigner-1", "assign_from_non_assigner-2", "assign_from_non_assigner-3",
  "create_service-1", "enqueue_and_unlock_chain-1", "enqueue_and_unlock_chain-2",
  "enqueue_and_unlock_chain-3", "enqueue_and_unlock_chain-4", "enqueue_and_unlock_chain_wraps-1",
  "enqueue_and_unlock_chain_wraps-2", "enqueue_and_unlock_chain_wraps-3",
  "enqueue_and_unlock_chain_wraps-4", "enqueue_and_unlock_chain_wraps-5",
  "enqueue_and_unlock_simple-1", "enqueue_and_unlock_simple-2",
  "enqueue_and_unlock_with_sr_lookup-1", "enqueue_and_unlock_with_sr_lookup-2",
  "enqueue_self_referential-1", "enqueue_self_referential-2", "enqueue_self_referential-3",
  "enqueue_self_referential-4", "lookup_foreign_preimage-1", "lookup_foreign_preimage-2",
  "no_available_reports-1", "preimage_len_bound-1", "preimage_len_bound-2", "preimage_len_bound-3",
  "process_one_immediate_report-1", "queues_are_shifted-1", "queues_are_shifted-2",
  "ready_queue_editing-1", "ready_queue_editing-2", "ready_queue_editing-3",
  "recreate_ejected_service-1", "recreate_ejected_service_by_higher_registrar-1",
  "recreate_ejected_service_that_accumulates-1", "same_code_different_services-1",
  "same_round_storage_isolation-1", "same_round_storage_isolation-2",
  "transfer_for_ejected_service-1", "transfer_for_ejected_service_that_accumulates_high_ejector-1",
  "transfer_for_ejected_service_that_accumulates_low_ejector-1", "transfer_for_live_service-1",
  "transfer_for_service_ejected_in_same_round_high_ejector-1",
  "transfer_for_service_ejected_in_same_round_low_ejector-1",
  "transfer_to_service_ejected_by_sender_eject_first-1",
  "transfer_to_service_ejected_by_sender_transfer_first-1", "work_for_ejected_service-1",
  "work_for_ejected_service-2", "work_for_service_ejected_in_same_round_high_ejector-1",
  "work_for_service_ejected_in_same_round_low_ejector-1",
];
```

**Add to** `test/accumulate.test.ts`

```ts
import type { AccumulationState } from "../src/accumulate.ts";
import type { ServiceInfo } from "../src/services.ts";
test("the registrar creates service 5, which gets its endowment a round later", () => {
  const vector = vectorJson("stf/accumulate/tiny/create_service-1.json") as BlockVector;
  const before: AccumulationState = accumulationStateFromJson(vector.pre_state);
  const { state, statistics } = accumulateBlock(TINY, before, vector.input.slot, reportsOf(vector));
  const made: ServiceInfo = state.accounts.get(5)!.info;
  assert.deepEqual([made.parent_service, made.creation_slot], [0, 43]); // service 0, this block
  assert.equal(made.balance, 1201n + 500n); // its minimum (100 + 2 × 10 + 1081), and a gift
  const delivered: number = statistics.get(5)!.transfers; // the gift, delivered in round 2
  assert.equal(delivered, 1);
});
```

## The code

**Add to** `src/host.ts`

```ts
import { decodeFixed } from "./codec/numbers.ts";
import { blake2b256 } from "./hash.ts";

/** S: below this id, only the registrar may create services, and only by choosing the id. */
const MIN_PUBLIC_ID = 2 ** 16;

/** How many ids `new` hands out in turn: every id from S up, but the top 256. */
const PUBLIC_IDS = 2 ** 32 - MIN_PUBLIC_ID - 2 ** 8;

/** The ids a run hands out to new services (the GP's i), and the ids already taken. */
export type NewIds = { next: number; taken: Set<number> };

/** check (GP App. B.4): id i if nobody has it, else the next one up that's free. */
function check(i: number, taken: Set<number>): number {
  while (taken.has(i)) i = ((i - MIN_PUBLIC_ID + 1) % PUBLIC_IDS) + MIN_PUBLIC_ID;
  return i;
}

/**
 * The first id a run of service s may give a new service (GP App. B.4, I): from the hash
 * of s, η′₀ and the slot, so no service can guess it ahead of time.
 */
export function newIds(s: number, entropy: Bytes, slot: number, taken: Set<number>): NewIds {
  const seed = concatBytes(encodeNatural(BigInt(s)), entropy, encodeNatural(BigInt(slot)));
  const start = decodeFixed(blake2b256(seed).subarray(0, 4)); // its first 4 bytes, as ℰ₄
  return { next: check(Number(start % BigInt(PUBLIC_IDS)) + MIN_PUBLIC_ID, taken), taken };
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
  const requests = new Map([[`${toHex(codeHash)}:${length}`, [] as number[]]]);
  a.accounts.set(id, { info, storage: new Map(), preimages: new Map(), requests });
  self.info = { ...self.info, balance: left };
  if (!chosen) { // the next free id: 42 further on, round the public range
    ids.next = check(((id - MIN_PUBLIC_ID + 42) % PUBLIC_IDS) + MIN_PUBLIC_ID, ids.taken);
  }
  return setTo(m, BigInt(id));
}
```

`newIds` makes the run's id counter, and `check` steps past ids already taken. `ids` lives
for one run only. Unlike the accounts, transfers and privileges, it needs no checkpoint
copy: nothing reads it once the run is over.

The host gives every run its counter, and answers call 19:

**Replace in** `src/host.ts`

```ts
/**
 * F (GP App. B.4): the host for a service's accumulation. So far it answers gas, grow_heap,
 * fetch (whose items are the constants, 0; the entropy, 1; and the inputs, all of them, 14,
 * or one, 15), info, lookup, read, write, checkpoint, query, solicit and forget, the last
 * two at `slot`, the time of the block; transfer, into `outbox`; assign, with `powers`;
 * eject; and new. Anything else: WHAT.
 */
export function accumulateHost(
  config: Config,
  a: Accumulation,
  slot: number,
  outbox: Outbox = { transfers: [], kept: [] },
  powers: Powers = startPowers(),
): Host {
  const ids = newIds(a.id, a.entropy, slot, new Set(a.accounts.keys())); // for `new`
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
        return checkpoint(m, a, outbox, powers);
      case "query":
        return query(m, a);
      case "solicit":
        return solicit(m, a, slot);
      case "forget":
        return forget(m, a, slot, config.expunge_period);
      case "transfer":
        return transfer(m, a, outbox);
      case "assign":
        return assign(m, a.id, powers, config.core_count);
      case "eject":
        return eject(m, a, slot, config.expunge_period);
      case "new":
        return newService(m, a, slot, ids, powers.now.privileges);
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
✔ create_service-1: the block ends as the vector says (73.6ms)
...
✔ recreate_ejected_service-1: the block ends as the vector says (104.1ms)
...
✔ the reported packages: each one's hash and exports root, sorted by hash (271.8ms)
...
✔ new: a service pays for another, which gets the next id, or the registrar's choice (0.3ms)
✔ new refuses: gratis from a non-manager, not enough money, a registrar's id taken (0.3ms)
...
ℹ tests 569
ℹ suites 0
ℹ pass 569
ℹ fail 0
...
reported 569 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791740238119
...
```

## Watch it

**What flows through it.** Service 0, the registrar, is told to create a service with 1,000
bytes of code and give it 500:

::: code-group

```json [what goes in]
{
  "input": {
    "slot": 43,
    "reports": [ { "results": [ {
      "service_id": 0,
      "accumulate_gas": 2000000,
      "result": { "ok": "0x0100c0f2ef8d435ea95467e5e1a5e0e768e3555044487699c625dbc2fd11e407761ce803…" }
    } ] } ]
  },
  "pre_state": {
    "privileges": { "bless": 0, "register": 0 },
    "accounts": [ { "id": 0, "data": { "service": { "balance": 1127714 } } }, { "id": 1729 } ]
  }
}
```

```ts [what it computes]
// service 0's run: host call 19, new, then 21, transfer, to the service it made
const computed = {
  codeHash: "0xc0f2ef8d…", // the 32 bytes at φ₇: the new service's code, still to come
  codeLength: 1000n, // φ₈, the output's e803: 1,000
  minItemGas: 10n, // φ₉
  minMemoGas: 10n, // φ₁₀
  gratis: 0n, // φ₁₁: none, so no manager needed
  wanted: 5n, // φ₁₂: an id below S = 2^16, which only the registrar may ask for
  account5: {
    items: 2, // one request for its code
    bytes: 1081, // 81 + 1,000
    balance: 1201n, // its minimum: 100 + 2 × 10 + 1,081, paid by service 0
    creationSlot: 43, // created now
    parent: 0, // by service 0
  },
  answer: 5n, // φ₇ after new: the id it got
  transfer: { dest: 5, amount: 500n, gas: 10n, memo: "welcome" },
  balance0: 1_126_013n, // 1,127,714 − 1,201 − 500
};
```

```text [what comes out]
host call 19 (new): φ₇ = 5, 1858461 gas left
sent 500 to service 5, with 10 gas and the memo "welcome"
the service stops: "halt", using 196983 gas
```

:::

Service 0 is the registrar and asks for id 5, so it gets id 5, pays the new account's 1,201
minimum, and sends it 500 more: the vector's service 5 ends the block with 1,701, and
service 0 with 1,126,013.

**Run**

```sh
npm pkg set scripts.host-new-service="node bin/host.ts ../vectors/stf/accumulate/tiny/create_service-1.json 0"
npm run host-new-service
```

```text
host call 2 (fetch): φ₇ = 122, 1999367 gas left
...
host call 19 (new): φ₇ = 5, 1858461 gas left
host call 1 (grow_heap): φ₇ = 51, 1856927 gas left
host call 100 (log, from JIP-1): φ₇ = WHAT, 1839711 gas left
host call 3 (lookup): φ₇ = NONE, 1838339 gas left
host call 0 (gas): φ₇ = 1838170, 1838170 gas left
host call 100 (log, from JIP-1): φ₇ = WHAT, 1833399 gas left
host call 21 (transfer): φ₇ = 0, 1832203 gas left
host call 1 (grow_heap): φ₇ = 51, 1826498 gas left
host call 1 (grow_heap): φ₇ = 51, 1821660 gas left
host call 100 (log, from JIP-1): φ₇ = WHAT, 1815867 gas left
host call 5 (write): φ₇ = 1, 1807016 gas left
sent 500 to service 5, with 10 gas and the memo "welcome"
the service stops: "halt", using 196983 gas
the test vector says: 196983
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=host-1791740247569
```

The new service has no code to run yet, so in round 2 it just receives the money:
`npm run accumulate` on the same vector shows it with one transfer and no gas.

<details>
<summary>lasair: <code>check</code>, in <code>lib/pvm_host.ml</code></summary>

```ocaml
          let rec check i =
            if taken i then
              check (Int64.add 0x10000L
                (Int64.rem (Int64.add (Int64.sub i 0x10000L) 1L) range))
            else i
          in
```

The same skip as yours: past S (`0x10000`), one up, round the range. The comments around
this code in lasair record two bugs the official fuzzer found here. An early version
checked new ids only against the services the run itself had touched, so it once handed
out an id a service in the state already had, and overwrote that service. Another stepped
the 42 from the id it *started* with rather than the one it actually used. Your `newIds`
checks against every account the run starts with, and `newService` steps from the id it
handed out.

</details>

## Check your understanding

::: check
**In the test, service 0 creates a service with 20 bytes of code, and the new one starts with 221. Where does 221 come from?**

- [ ] Every new service starts with the same balance
  > No: it grows with the code. With 900 bytes of code, the new one would need 1,101.
- [x] It's the new service's own minimum balance, and service 0 pays it
  > Yes: 2 items and 81 + 20 = 101 bytes make 100 + 2 × 10 + 101 = 221. Service 0 is
  > left with 779.
- [ ] The chain creates it, as a welcome gift
  > No: the chain makes no money here. Service 0's balance goes down by exactly 221.

**Why is a run's first free id worked out from η′₀?**

- [ ] So that ids go up in order, one after another
  > No: the first id is hashed, so it lands anywhere in the public range. Only after
  > it do the ids step 42 at a time.
- [ ] To keep new ids small
  > No: a free id is always public, 2^16 or more. The small ids are the registrar's.
- [x] So that nobody can aim for a particular id
  > Yes: nobody knows η′₀ until the block, so nobody can work the id out in advance.

**One run ejects service 2, then, as the registrar, creates a service at id 2. What does the round end with?**

- [ ] The new service 2, because it was made last
  > No: the merge doesn't look at what an id holds, only at whether it's there.
- [x] The old service 2
  > Yes: id 2 was there before the round and is there after, so the merge sees nothing
  > created and nothing removed. Three of the vectors end exactly so.
- [ ] No service 2, because the eject wins
  > No: an id is removed only if it's missing when the run ends, and 2 isn't missing.

**In `create_service-1`, service 0 creates service 5, then sends it 500. In round 2, service 5 gets the money but uses no gas. Why?**

- [x] Its code isn't there yet: `new` only asked for it
  > Yes: the new account keeps one request, for its own code, not yet provided. No
  > code means nothing to run, but the money still arrives.
- [ ] A service can't accumulate in the block it was created in
  > No: there's no such rule. Given its code, it could run.
- [ ] 500 is too little to pay for a run
  > No: a run is paid for in gas, not balance. The transfer brought 10 gas, and even
  > that went unused, because there was no code.
:::

## What you have

Services that make services: paid for, numbered so nobody can aim, and the registrar's
small ids. Fifty-four official vectors pass as whole blocks. Until now, every report in a
block went in round 1, however much gas it asked for. A block only has so much:
[lesson 17.9](./09-the-blocks-gas-budget.md) gives it a budget.

**Say it out loud.** A service can create another and pays its deposit. The new id comes from a hash of fresh entropy, so nobody can aim for one.

Next: [17.9 The block's gas budget](./09-the-blocks-gas-budget.md)
