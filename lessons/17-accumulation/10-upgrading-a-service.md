# Upgrading a service

Code isn't forever. A service can swap its own code for new code, the way an app updates
itself: it names the new code by its hash, and from the next run on, that's what runs.
This lesson builds the `upgrade` host call. It's the simplest of the five calls still
missing, and one more official vector passes whole.

## New words

- **Upgrade.** A service replacing its own code hash, and its least gas per item and per
  memo ([lesson 14.2](../14-services/02-the-service-account.md)), with new ones. *Example:* service 0's code hash goes from
  `0xdd0e…` to `0xc0f2…`, and its least gases from 10 and 10 to 123 and 456.

It's in the [glossary](../glossary.md).

## What the Gray Paper says

`upgrade` is host call 20 (Appendix B.7, Ω_U). It costs 1,028 gas, then:

1. **Read.** The new code hash is the 32 bytes at φ₇. Unreadable: panic.
2. **Change.** The service's own code hash becomes those 32 bytes, its least gas per item
   φ₈, and per memo φ₉. φ₇ = `OK`.

That's all. No privilege is needed and nothing can be refused: a service may change only
itself, so it may always do so. The new code doesn't run now. Code is found by its hash
among the service's preimages ([lesson 17.1](./01-a-blocks-accumulation.md)), so the next run looks for the new hash, and if
the service doesn't hold that preimage yet, it can't run at all until it does. Upgrading
safely (asking for the new code first, with `solicit`) is the service's job, not the
chain's.

Walk both roads with the vector's own record. Upgrade right away and ask for the next run,
or solicit the new code first — one road runs `0xc0f2…`, the other stalls the service:

<UpgradeSwap />

## The tests

**Add to** `test/host.test.ts`

```ts
import { upgrade } from "../src/host.ts";

/** A machine about to upgrade to the code hash HASH, at o, with least gases 123 and 456. */
function upgrading(o = 0x20000n) {
  const memory = new Map();
  addPages(memory, 0x20000, 4096, "W");
  writeMemory(memory, 0x20000n, HASH);
  return newMachine(assemble([[0]]), [0n, 0n, 0n, 0n, 0n, 0n, 0n, o, 123n, 456n], memory, 10_000n);
}

test("upgrade: new code and new least gases, for 1,028 gas", () => {
  const a: Accumulation = bundle();
  const machine: Machine = upgrading();
  const exit: HostExit = upgrade(machine, a);
  assert.equal(exit, "continue");
  assert.equal(machine.registers[7], OK);
  const info: ServiceInfo = a.accounts.get(0)!.info;
  assert.deepEqual([info.code_hash, info.min_item_gas, info.min_memo_gas], [HASH, 123n, 456n]);
  const used: bigint = 10_000n - machine.gas;
  assert.equal(used, 1028n);
  const unreadable: HostExit = upgrade(upgrading(0n), bundle()); // nothing to read at 0
  assert.equal(unreadable, "panic");
});
```

`upgrading` writes `HASH` at 0x20000 and points φ₇ at it. Asked to read at 0, where nothing
is mapped, `upgrade` panics.

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
  "recreate_ejected_service_that_accumulates-1", "recreate_service_ejected_in_earlier_round-1",
  "same_code_different_services-1", "same_round_storage_isolation-1",
  "same_round_storage_isolation-2", "transfer_for_ejected_service-1",
  "transfer_for_ejected_service_that_accumulates_high_ejector-1",
  "transfer_for_ejected_service_that_accumulates_low_ejector-1", "transfer_for_live_service-1",
  "transfer_for_service_ejected_in_same_round_high_ejector-1",
  "transfer_for_service_ejected_in_same_round_low_ejector-1",
  "transfer_to_service_ejected_by_sender_eject_first-1",
  "transfer_to_service_ejected_by_sender_transfer_first-1", "upgrade_service-1",
  "work_for_ejected_service-1", "work_for_ejected_service-2",
  "work_for_service_ejected_in_same_round_high_ejector-1",
  "work_for_service_ejected_in_same_round_low_ejector-1",
];
```

**Run, expect it to fail**

```sh
npm test
```

```text
...
✖ upgrade_service-1: the block ends as the vector says (49.372625ms)
...
ℹ tests 538
ℹ suites 0
ℹ pass 536
ℹ fail 2
...
✖ upgrade_service-1: the block ends as the vector says (49.372625ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
  + actual - expected

    Map(2) {
      0 => {
        balance: 227714n,
  +     bytes: 127776n,
...
```

Red where it counts: in the vector, service 0's call 20 gets `WHAT`, so it carries on
with its old code hash. (The other failure is `test/host.test.ts`, which can't load until
`upgrade` exists.)

## The code

**Add to** `src/host.ts`

```ts
/**
 * upgrade (GP App. B.7, Ω_U): this service's code becomes the preimage of the 32-byte hash
 * at φ₇, and its least gas per item and per memo φ₈ and φ₉. A service may always change its
 * own code: no privilege needed. An unreadable hash: panic.
 */
export function upgrade(m: Machine, a: Accumulation): HostExit {
  if (!charge(m, 1028)) return "oog";
  const [o, minGas, memoGas] = m.registers.slice(7, 10);
  const codeHash = readMemory(m.memory, o, 32);
  if (!(codeHash instanceof Uint8Array)) return "panic"; // the hash isn't readable
  const self = a.accounts.get(a.id)!;
  self.info = { ...self.info, code_hash: codeHash, min_item_gas: minGas, min_memo_gas: memoGas };
  return setTo(m, OK);
}
```

**Replace in** `src/host.ts`

```ts
/**
 * F (GP App. B.4): the host for a service's accumulation. So far it answers gas, grow_heap,
 * fetch (whose items are the constants, 0; the entropy, 1; and the inputs, all of them, 14,
 * or one, 15), info, lookup, read, write, checkpoint, query, solicit and forget, the last
 * two at `slot`, the time of the block; transfer, into `outbox`; assign, with `powers`;
 * eject; new; and upgrade. Anything else: WHAT.
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
      case "upgrade":
        return upgrade(m, a);
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
✔ upgrade_service-1: the block ends as the vector says (59.405167ms)
...
✔ upgrade: new code and new least gases, for 1,028 gas (0.158584ms)
...
ℹ tests 573
ℹ suites 0
ℹ pass 573
ℹ fail 0
...
reported 573 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791769486717
...
```

## Watch it

**Run**

```sh
npm pkg set scripts.host-upgrade="node bin/host.ts ../vectors/stf/accumulate/tiny/upgrade_service-1.json 0"
npm run host-upgrade
```

```text
...
host call 20 (upgrade): φ₇ = 0, 1889085 gas left
...
the service stops: "halt", using 139939 gas
the test vector says: 139939
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=host-1791769501847
```

Call 20 answers 0, `OK`, and service 0 uses exactly the vector's gas. Its new code hash is
in the *Host calls* panel's run too, on **7 · Accumulation and import**: the vector's
post-state has `0xc0f2…`, with 123 and 456 as its least gases.

<details>
<summary>lasair: <code>upgrade</code>, in <code>lib/pvm_host.ml</code></summary>

```ocaml
  if not (is_range_readable mem o 32) then None
  else
    match read_mem_bytes mem o 32 with
    | None -> None
    | Some c ->
      let svc = { ctx.service with code_hash = c; min_acc_gas = g; min_memo_gas = m } in
      Some { new_gas; new_regs = set_reg regs 7 result_ok; new_mem = mem;
             new_service = Some svc; new_context = None }
```

`None` is lasair's panic; otherwise the service record comes back with three fields
changed and φ₇ set to `OK`, as in yours. One thing to smile at: the comment above this
function calls it host call 19, but the dispatch table further down sends call 20 here,
and that's the one that counts. Comments don't fail tests.

</details>

## Check your understanding

::: check
**Service 0 calls `upgrade` partway through its run. Which code runs for the rest of that run?**

- [ ] The new code, from the next instruction
  > No: the machine already has the old code loaded. `upgrade` only changes the hash
  > in the account.
- [x] The old code; the new one from the next run
  > Yes: code is found by its hash when a run starts. This run carries on, and the
  > next one looks for `0xc0f2…`.
- [ ] None: the run stops at the upgrade
  > No: φ₇ = `OK`, and it carries on. Service 0 uses exactly the vector's 139,939 gas.

**Why does `upgrade` need no privilege, and never refuse?**

- [x] A service may change only its own code, so it may always do so
  > Yes: nobody else is touched. The one way it can fail is a hash it can't read, and
  > that's a panic.
- [ ] The chain checks the new code first, so nothing can go wrong
  > No: the chain checks nothing. The new hash needn't even have code behind it.
- [ ] It does need one: only the manager may upgrade
  > No: any service may upgrade itself. None of the five privileges is about a
  > service's own code.

**A service upgrades to a hash whose preimage it doesn't hold. What happens at its next run?**

- [ ] Its old code keeps running until the new code arrives
  > No: the old hash is gone from its account. The next run looks only for the new
  > one.
- [ ] Nothing changed: the upgrade was refused with `HUH`
  > No: `upgrade` never refuses. It answered `OK` and changed the hash.
- [x] It can't run at all until it gets that preimage
  > Yes: no preimage under its code hash means no code. Asking for the new code
  > first, with `solicit`, is the service's job.

**Service 0 upgrades, then panics before any checkpoint. Which code hash does it end with?**

- [x] The old one
  > Yes: the code hash is part of the service's account, and a panic takes the
  > accounts back to the last checkpoint, from before the upgrade.
- [ ] The new one: an upgrade can't be undone
  > No: it's undone like any other change the run made to its account.
- [ ] None: it's left with no code hash at all
  > No: a panic restores the checkpoint's account whole, code hash included.
:::

## What you have

A service that can rewrite itself. Fifty-six official vectors pass as whole blocks. A
service can also hand the chain a hash at the end of its run, for other chains to check:
[lesson 17.11](./11-what-a-service-yields.md) builds `yield`.

Next: [17.11 What a service yields](./11-what-a-service-yields.md)
