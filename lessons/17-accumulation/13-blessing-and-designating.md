# Blessing and designating

Two privileged calls are left. `bless` is the manager's big lever: it sets every privilege
at once, and the list of always-accumulate services with them. `designate` is the
delegator's: it chooses the validators for a coming epoch. By the end of this lesson your
client answers both, and every one of the 63 official accumulate vectors passes as a
whole block.

## New words

- **Bless.** Setting every privilege in one call: the manager, each core's assigner, the
  delegator, the registrar, and the always-accumulate services with their gas. *Example:*
  service 1 blesses service 2 as the delegator.
- **Designate.** The delegator choosing the next validators, ι: a list of keys, 336 bytes
  for each validator. *Example:* 6 validators on tiny, 2,016 bytes.
- **Validator counts (V).** The sizes the chain allows for a set of validators: a multiple
  of 3, from 6 up to 3 for each core. *Example:* on tiny, with 2 cores, only 6.

All three are in the [glossary](../glossary.md).

## What the Gray Paper says

`bless` is host call 15 (Appendix B.7, Ω_B). It costs 422 gas, plus 20 for each
always-accumulate entry. Then:

1. **Read.** The manager is φ₇, the delegator φ₉, the registrar φ₁₀. The cores' assigners
   are C numbers of 4 bytes at φ₈. The always-accumulate services are φ₁₂ entries at φ₁₁,
   each a 4-byte service id and 8 bytes of gas. Unreadable: panic.
2. **Maybe refuse.** `WHO` if φ₇, φ₉ or φ₁₀ can't be a service id.
3. **Set** all of it in the run's privileges. φ₇ = `OK`.

`designate` is host call 17 (Ω_D). It costs 1,100 gas, plus 302 per validator. It reads
φ₈ sets of keys, 336 bytes each, at φ₇ (unreadable: panic). `HUH` unless φ₈ is in V and
this service is the delegator; otherwise the keys become the run's ι, and φ₇ = `OK`.

Then the round's merge ([lesson 17.6](./06-who-wins.md)) gains two lines:

4. **The always-accumulate services** after the round are the manager's, as the manager's
   run left them. So only a manager's `bless` changes them.
5. **The next validators**, ι′, are the delegator's, as the delegator's run left them (the
   delegator as the round started).

The rest of a `bless` goes through R as before. The manager's own run decides the next
manager; for the assigners, the delegator and the registrar, a manager's change wins over
the holder's own.

### Who may bless?

Here the test vectors and the Gray Paper part ways. Gray Paper 0.8.0 says `bless` answers
`HUH` to anyone but the manager. The 0.8.0 test vectors follow a later change to the paper
(GP pull request 519): anyone may call it, and the merge decides what counts. In
`bless_from_non_manager-1`, service 1 is the delegator, not the manager, and blesses
service 2 as the delegator. Strictly, that's `HUH`. In the vectors it's `OK`, and since the
manager left the delegator alone, R takes the holder's own choice: service 2.

Your client follows the vectors: they're what a client is checked against. Both bless
vectors fail under
the strict rule; the switch is one line, noted in
[HARDENING.md](https://github.com/abutlabs/the-gray-tutor/blob/main/HARDENING.md) for when a new version of the paper settles it.

## The tests

**Add to** `test/host.test.ts`

```ts
import { bless, designate } from "../src/host.ts";

/** A machine about to bless: manager 1, the assigners 2 and 3 (at 0x20000), delegator 4,
 * registrar 5, and one always-accumulate service, 6 with 1,000 gas (at 0x20010). */
function blessing() {
  const memory = new Map();
  addPages(memory, 0x20000, 4096, "W");
  writeMemory(memory, 0x20000n, Uint8Array.of(2, 0, 0, 0, 3, 0, 0, 0));
  writeMemory(memory, 0x20010n, Uint8Array.of(6, 0, 0, 0, 0xe8, 3, 0, 0, 0, 0, 0, 0));
  const registers = [0n, 0n, 0n, 0n, 0n, 0n, 0n, 1n, 0x20000n, 4n, 5n, 0x20010n, 1n];
  return newMachine(assemble([[0]]), registers, memory, 10_000n);
}

test("bless: every privilege at once, and the always-accumulate services", () => {
  const powers: Powers = startPowers(ZERO_HOLDS_ALL);
  const machine: Machine = blessing();
  const exit: HostExit = bless(machine, powers, 2);
  assert.equal(exit, "continue");
  assert.equal(machine.registers[7], OK);
  const privileges: Privileges = powers.now.privileges;
  assert.deepEqual(privileges, { bless: 1, assign: [2, 3], designate: 4, register: 5 });
  const free: Map<number, bigint> | undefined = powers.now.free;
  assert.deepEqual(free, new Map([[6, 1000n]]));
  const used: bigint = 10_000n - machine.gas; // 422, and 20 for the one entry
  assert.equal(used, 442n);
});

/** A machine about to designate `z` validators, whose keys are all 7s (at 0x20000). */
function designating(z: bigint) {
  const memory = new Map();
  addPages(memory, 0x20000, 3 * 4096, "W");
  writeMemory(memory, 0x20000n, new Uint8Array(336 * 6).fill(7));
  return newMachine(assemble([[0]]), [0n, 0n, 0n, 0n, 0n, 0n, 0n, 0x20000n, z], memory, 10_000n);
}

test("designate: the delegator picks the next validators; a count tiny can't have, HUH", () => {
  const powers: Powers = startPowers(ZERO_HOLDS_ALL); // service 0 is the delegator
  const six: Machine = designating(6n); // tiny's 2 cores allow exactly 6
  designate(six, 0, powers, 2);
  assert.equal(six.registers[7], OK);
  const staging: Bytes[] = powers.now.staging!;
  assert.deepEqual([staging.length, staging[5].length], [6, 336]);
  const three: Machine = designating(3n); // fewer than 6
  designate(three, 0, powers, 2);
  assert.equal(three.registers[7], HUH);
  const notTheDelegator: Machine = designating(6n);
  designate(notTheDelegator, 1, powers, 2);
  assert.equal(notTheDelegator.registers[7], HUH);
});
```

The bytes by hand: the assigners are 2 and 3, four bytes each, little end first; the one
always-accumulate entry is service 6 (`06 00 00 00`), then 1,000 gas in 8 bytes (1,000 is
`0x03e8`, so `e8 03` and six zeros).

<BlessOrder />

`checkBlock` learns to compare the always-accumulate services, which only a `bless` could
change:

**Replace in** `test/accumulate.test.ts`

```ts
/** Checks the whole block of test vector `name`: accounts, privileges, statistics, queue
 * and history, and the root of its outputs. The accounts go piece by piece, their code
 * last, so a red has a short diff. */
function checkBlock(name: string) {
  const vector = vectorJson(`stf/accumulate/tiny/${name}.json`) as BlockVector;
  const before: AccumulationState = accumulationStateFromJson(vector.pre_state);
  const { state, statistics, outputs } =
    accumulateBlock(TINY, before, vector.input.slot, reportsOf(vector));
  const expected: AccumulationState = accumulationStateFromJson(vector.post_state);
  const root: string = toHex(outputsRoot(outputs)); // the vector's output: θ′'s root
  assert.equal(root, vector.output.ok);
  const infos: Map<number, ServiceInfo> = each(state.accounts, (a) => a.info);
  const expectedInfos: Map<number, ServiceInfo> = each(expected.accounts, (a) => a.info);
  assert.deepEqual(infos, expectedInfos);
  const storage: Map<number, Map<string, Bytes>> = each(state.accounts, (a) => a.storage);
  const expectedStorage: Map<number, Map<string, Bytes>> =
    each(expected.accounts, (a) => a.storage);
  assert.deepEqual(storage, expectedStorage);
  const requests: Map<number, Map<string, number[]>> = each(state.accounts, (a) => a.requests);
  const expectedRequests: Map<number, Map<string, number[]>> =
    each(expected.accounts, (a) => a.requests);
  assert.deepEqual(requests, expectedRequests);
  const hashes = (a: Account) => [...a.preimages.keys()].sort(); // the preimages' hashes
  const preimages: Map<number, string[]> = each(state.accounts, hashes);
  const expectedPreimages: Map<number, string[]> = each(expected.accounts, hashes);
  assert.deepEqual(preimages, expectedPreimages);
  assert.deepEqual(state.accounts, expected.accounts); // all of it, the code included
  assert.deepEqual(state.privileges, expected.privileges);
  assert.deepEqual(state.free, expected.free);
  assert.deepEqual(state.ready, expected.ready);
  assert.deepEqual(state.accumulated, expected.accumulated);
  const stats = vector.post_state.statistics.map(({ id, record: r }) => {
    const gasUsed = BigInt(r.accumulate_gas_used);
    return [id, { count: r.accumulate_count, transfers: r.accumulate_transfer_count, gasUsed }];
  });
  assert.deepEqual(statistics, new Map(stats as [number, unknown][]));
}
```

**Replace in** `test/accumulate.test.ts`

```ts
/** The vectors whose whole block needs nothing beyond this lesson. */
const BLOCK_CASES = [
  "accumulate_ready_queued_reports-1", "always_accumulate-1", "always_accumulate-2",
  "assign_from_non_assigner-1", "assign_from_non_assigner-2", "assign_from_non_assigner-3",
  "bless_from_non_manager-1", "bless_from_non_manager-2", "create_service-1",
  "designate_with_invalid_count-1", "designate_with_invalid_count-2", "enqueue_and_unlock_chain-1",
  "enqueue_and_unlock_chain-2", "enqueue_and_unlock_chain-3", "enqueue_and_unlock_chain-4",
  "enqueue_and_unlock_chain_wraps-1", "enqueue_and_unlock_chain_wraps-2",
  "enqueue_and_unlock_chain_wraps-3", "enqueue_and_unlock_chain_wraps-4",
  "enqueue_and_unlock_chain_wraps-5", "enqueue_and_unlock_simple-1", "enqueue_and_unlock_simple-2",
  "enqueue_and_unlock_with_sr_lookup-1", "enqueue_and_unlock_with_sr_lookup-2",
  "enqueue_self_referential-1", "enqueue_self_referential-2", "enqueue_self_referential-3",
  "enqueue_self_referential-4", "lookup_foreign_preimage-1", "lookup_foreign_preimage-2",
  "no_available_reports-1", "preimage_len_bound-1", "preimage_len_bound-2", "preimage_len_bound-3",
  "provide_preimage-1", "provide_preimage-2", "process_one_immediate_report-1",
  "queues_are_shifted-1", "queues_are_shifted-2", "ready_queue_editing-1", "ready_queue_editing-2",
  "ready_queue_editing-3", "recreate_ejected_service-1",
  "recreate_ejected_service_by_higher_registrar-1", "recreate_ejected_service_that_accumulates-1",
  "recreate_service_ejected_in_earlier_round-1", "same_code_different_services-1",
  "same_round_storage_isolation-1", "same_round_storage_isolation-2",
  "transfer_for_ejected_service-1", "transfer_for_ejected_service_that_accumulates_high_ejector-1",
  "transfer_for_ejected_service_that_accumulates_low_ejector-1", "transfer_for_live_service-1",
  "transfer_for_service_ejected_in_same_round_high_ejector-1",
  "transfer_for_service_ejected_in_same_round_low_ejector-1",
  "transfer_to_service_ejected_by_sender_eject_first-1",
  "transfer_to_service_ejected_by_sender_transfer_first-1", "upgrade_service-1",
  "work_for_ejected_service-1", "work_for_ejected_service-2", "work_for_ejected_service-3",
  "work_for_service_ejected_in_same_round_high_ejector-1",
  "work_for_service_ejected_in_same_round_low_ejector-1",
];
```

**Add to** `test/accumulate.test.ts`

```ts
test("the delegator blesses service 2 as the delegator, though it isn't the manager", () => {
  const vector = vectorJson("stf/accumulate/tiny/bless_from_non_manager-1.json") as BlockVector;
  const before: AccumulationState = accumulationStateFromJson(vector.pre_state);
  const { state } = accumulateBlock(TINY, before, vector.input.slot, reportsOf(vector));
  const managers: number[] = [before.privileges.bless, state.privileges.bless];
  assert.deepEqual(managers, [0, 0]); // service 0 manages throughout; service 1 ran
  const delegators: number[] = [before.privileges.designate, state.privileges.designate];
  assert.deepEqual(delegators, [1, 2]); // service 1's own choice, as R allows
});
```

**Run, expect it to fail**

```sh
npm test
```

```text
...
✖ bless_from_non_manager-1: the block ends as the vector says (50.248875ms)
✖ bless_from_non_manager-2: the block ends as the vector says (93.123708ms)
...
✖ designate_with_invalid_count-1: the block ends as the vector says (193.0045ms)
✖ designate_with_invalid_count-2: the block ends as the vector says (296.069916ms)
...
✖ the delegator blesses service 2 as the delegator, though it isn't the manager (48.067333ms)
...
ℹ tests 549
ℹ suites 0
ℹ pass 543
ℹ fail 6
...
```

Red where it counts: in four vectors and the new test, the services get `WHAT` for
`bless` and `designate`, and go wrong from there. (The sixth failure is
`test/host.test.ts`, which can't load until they exist.)

## The code

A run's privileged changes gain the two new parts:

**Replace in** `src/host.ts`

```ts
/**
 * What a run's privileged calls change (part of the GP's ψ): the privileges, and the new
 * authorizer queue (80 hashes) of each core this run has set one for; the always-accumulate
 * services (χ_Z) and the next validators' keys (ι), once the run has set them.
 */
export type Privileged = {
  privileges: Privileges;
  queues: Map<number, Bytes[]>;
  free?: Map<number, bigint>;
  staging?: Bytes[];
};
```

**Replace in** `src/host.ts`

```ts
/** A copy of p that changes on its own. */
export function copyPrivileged(p: Privileged): Privileged {
  return {
    privileges: { ...p.privileges, assign: [...p.privileges.assign] },
    queues: new Map(p.queues),
    free: p.free && new Map(p.free),
    staging: p.staging && [...p.staging],
  };
}
```

**Add to** `src/host.ts`

```ts
/**
 * bless (GP App. B.7, Ω_B): sets every privilege at once. Service φ₇ becomes the manager,
 * the C service ids at φ₈ (4 bytes each) the cores' assigners, φ₉ the delegator, φ₁₀ the
 * registrar, and the φ₁₂ entries at φ₁₁ (a 4-byte service id and 8 bytes of gas each) the
 * always-accumulate services. WHO if φ₇, φ₉ or φ₁₀ can't be a service id; unreadable
 * assigners or entries: panic. The 0.8.0 paper also answers HUH to anyone but the manager;
 * the test vectors follow a later change, and let anyone call it (lesson 17.13).
 */
export function bless(m: Machine, powers: Powers, cores: number): HostExit {
  const [manager, at, delegator, registrar, o, n] = m.registers.slice(7, 13);
  if (!charge(m, 422n + 20n * n)) return "oog";
  const assigners = readMemory(m.memory, at, 4 * cores);
  const entries = readMemory(m.memory, o, 12 * Number(n));
  if (!(assigners instanceof Uint8Array) || !(entries instanceof Uint8Array)) return "panic";
  if ([manager, delegator, registrar].some((id) => id >= 2n ** 32n)) return setTo(m, WHO);
  const assign = Array.from({ length: cores }, (_, c) =>
    Number(decodeFixed(assigners.subarray(4 * c, 4 * c + 4))));
  const free = new Map<number, bigint>();
  for (let i = 0; i < Number(n); i++) {
    const entry = entries.subarray(12 * i, 12 * i + 12);
    free.set(Number(decodeFixed(entry.subarray(0, 4))), decodeFixed(entry.subarray(4)));
  }
  const [bless, designate, register] = [manager, delegator, registrar].map(Number);
  powers.now.privileges = { bless, assign, designate, register };
  powers.now.free = free;
  return setTo(m, OK);
}

/**
 * designate (GP App. B.7, Ω_D): the φ₈ sets of validator keys at φ₇ (336 bytes each)
 * become the next validators, ι. Only the delegator may; and φ₈ must be a size the chain
 * allows, a multiple of 3 from 6 to 3 × the cores (else HUH). Unreadable keys: panic.
 */
export function designate(m: Machine, s: number, powers: Powers, cores: number): HostExit {
  const [o, z] = m.registers.slice(7, 9);
  if (!charge(m, 1100n + 302n * z)) return "oog";
  const keys = readMemory(m.memory, o, 336 * Number(z));
  if (!(keys instanceof Uint8Array)) return "panic"; // the keys aren't readable
  const allowed = z % 3n === 0n && z >= 6n && z <= 3n * BigInt(cores); // V
  if (!allowed || s !== powers.now.privileges.designate) return setTo(m, HUH);
  powers.now.staging = Array.from({ length: Number(z) }, (_, i) =>
    keys.slice(336 * i, 336 * i + 336));
  return setTo(m, OK);
}
```

```ts
  const allowed = z % 3n === 0n && z >= 6n && z <= 3n * BigInt(cores); // V
  if (!allowed || s !== powers.now.privileges.designate) return setTo(m, HUH);
```

`powers.now.privileges` is the run's own copy, so a `bless` earlier in the same run counts:
a service that blesses itself as the delegator may then designate. It gets `OK`, but its
keys count only if it was already the delegator when the round started: the merge takes
ι′ from that service's run alone.

**Replace in** `src/host.ts`

```ts
/**
 * F (GP App. B.4): the host for a service's accumulation. So far it answers gas, grow_heap,
 * fetch (whose items are the constants, 0; the entropy, 1; and the inputs, all of them, 14,
 * or one, 15), info, lookup, read, write, checkpoint, query, solicit and forget, the last
 * two at `slot`, the time of the block; transfer, into `outbox`; assign, with `powers`;
 * eject; new; upgrade; yield and provide, into `outbox` too; and bless and designate, with
 * `powers`. Anything else: WHAT.
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
      case "yield":
        return yieldHash(m, outbox);
      case "provide":
        return provide(m, a, outbox);
      case "bless":
        return bless(m, powers, config.core_count);
      case "designate":
        return designate(m, a.id, powers, config.core_count);
      default:
        return unknown(m);
    }
  };
}
```

The merge takes the always-accumulate services from the manager, and ι from the
delegator:

**Replace in** `src/accumulate.ts`

```ts
/**
 * The privileges after a round (GP §12, Δ*), from those at its start and each run's, as
 * it left them. A service that didn't run changed nothing. Each core's new authorizer
 * queue is the one its assigner at the start set, if it set one. The always-accumulate
 * services are the manager's, if it set them; the next validators, the delegator's.
 */
export function mergePrivileges(before: Privileges, after: Map<number, Privileged>) {
  const post = (s: number) => after.get(s)?.privileges ?? before;
  const manager = post(before.bless); // what the manager left
  const privileges: Privileges = {
    bless: manager.bless,
    assign: before.assign.map((o, c) => R(o, manager.assign[c], post(o).assign[c])),
    designate: R(before.designate, manager.designate, post(before.designate).designate),
    register: R(before.register, manager.register, post(before.register).register),
  };
  const queues = new Map<number, Bytes[]>();
  before.assign.forEach((o, c) => {
    const queue = after.get(o)?.queues.get(c);
    if (queue) queues.set(c, queue);
  });
  const free = after.get(before.bless)?.free; // χ_Z′, if the manager blessed
  const staging = after.get(before.designate)?.staging; // ι′, if the delegator designated
  return { privileges, queues, free, staging };
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
    const code = account && codeOf(account);
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

**Replace in** `src/accumulate.ts`

```ts
/**
 * A block's accumulation (GP §12): the reports that can go now (R!, then what they and
 * the history unlock from the queue: R*) accumulate in a first round, and the transfers
 * each round sends are delivered in the next, until a round sends none (Δ+). Every
 * service that did anything gets its statistics and its last-accumulation slot; the
 * history ξ moves on one slot, and the reports still waiting go back into the queue ω.
 * The privileges carry from round to round; the cores' new authorizer queues come back
 * beside the statistics. Each round takes as many reports as the block's gas budget
 * allows; `rounds` says how many it took. `outputs` are the hashes services yielded, θ′;
 * `staging` the next validators, ι′, if the delegator chose them.
 */
export function accumulateBlock(
  config: Config,
  state: AccumulationState,
  slot: number, // τ′
  reports: WorkReport[], // the reports that just became available
) {
  const E = config.epoch_length;
  const waits = (r: WorkReport) =>
    r.context.prerequisites.length > 0 || r.segment_root_lookup.length > 0;
  const dependencies = (r: WorkReport) => [
    ...r.context.prerequisites,
    ...r.segment_root_lookup.map((l) => l.work_package_hash),
  ];
  const history = new Set(state.accumulated.flatMap((x) => [...x])); // ξ∪
  const now = reports.filter((r) => !waits(r)); // R!
  const fresh = reports.filter(waits).map((r) => ({
    report: r,
    dependencies: new Set(dependencies(r).map(toHex)),
  }));
  const queued = edit(fresh, history); // R^Q
  const m = slot % E;
  const ring = [...state.ready.slice(m), ...state.ready.slice(0, m)].flat();
  const all = [...now, ...unlock(edit([...ring, ...queued], new Set(now.map(packageOf))))];

  const gasOf = (r: WorkReport) => sum(r.results.map((d) => d.accumulate_gas));
  const freeGas = sum([...state.free.values()]);
  const floor = REPORT_GAS * BigInt(config.core_count) + freeGas;
  let budget = config.max_block_gas > floor ? config.max_block_gas : floor; // g
  let accounts = state.accounts;
  let todo = all; // the reports still to accumulate,
  let free = state.free; // the always-accumulate services (first round only),
  let transfers: Transfer[] = []; // and the transfers to deliver
  let privileges = state.privileges;
  let alwaysAccumulate = state.free; // χ_Z, as the rounds leave it
  let staging: Bytes[] | undefined; // ι′, if the delegator chose new validators
  const done: WorkReport[] = []; // the reports that did accumulate
  const rounds: number[] = []; // how many reports each round took
  const outputs: AccumulationOutput[] = []; // b, over every round: θ′
  const queues = new Map<number, Bytes[]>(); // the cores' new authorizer queues, for ϕ′
  const used = new Map<number, bigint>(); // G: gas, over every round
  const received = new Map<number, number>(); // T: transfers delivered
  for (;;) {
    // as many of the reports as fit the budget, with the transfers and the free gas
    let spent = sum(transfers.map((t) => t.gas)) + sum([...free.values()]);
    let fit = 0;
    while (fit < todo.length && spent + gasOf(todo[fit]) <= budget) {
      spent += gasOf(todo[fit]);
      fit++;
    }
    if (fit + transfers.length + free.size === 0) break; // nothing to do: done
    for (const t of transfers) received.set(t.dest, (received.get(t.dest) ?? 0) + 1);
    const round = accumulateRound(
      config, accounts, free, state.entropy, slot, todo.slice(0, fit), transfers, privileges,
    );
    done.push(...todo.slice(0, fit));
    rounds.push(fit);
    for (const [s, gas] of round.used) used.set(s, (used.get(s) ?? 0n) + gas);
    for (const [c, queue] of round.queues) queues.set(c, queue);
    for (const o of round.outputs) if (!outputs.some((x) => sameOutput(x, o))) outputs.push(o);
    accounts = round.accounts;
    privileges = round.privileges;
    alwaysAccumulate = round.free ?? alwaysAccumulate;
    staging = round.staging ?? staging;
    budget += sum(round.transfers.map((t) => t.gas)) - sum([...round.used.values()]); // g*
    todo = todo.slice(fit); // the rest wait for the next round, if any
    free = new Map();
    transfers = round.transfers;
  }
  const digests = done.flatMap((r) => r.results);
  const statistics = new Map<number, AccumulationStats>();
  for (const [s, gasUsed] of used) {
    const count = digests.filter((d) => d.service_id === s).length;
    const transfersIn = received.get(s) ?? 0;
    if (count === 0 && transfersIn === 0 && gasUsed === 0n) continue; // S(s) = (0, 0, 0)
    statistics.set(s, { count, transfers: transfersIn, gasUsed });
    const account = accounts.get(s);
    if (account) account.info.last_accumulation_slot = slot;
  }

  const finished = new Set(done.map(packageOf));
  const accumulated = [...state.accumulated.slice(1), finished]; // ξ′: newest last
  const ready: Waiting[][] = []; // ω′, slot by slot back from m
  for (let i = 0; i < E; i++) {
    const at = (m - i + E) % E;
    if (i === 0) ready[at] = edit(queued, finished); // this block's newcomers
    else if (i < slot - state.slot) ready[at] = []; // slots the chain skipped: emptied
    else ready[at] = edit(state.ready[at], finished);
  }
  const after = { ...state, slot, accounts, privileges, ready, accumulated };
  after.free = alwaysAccumulate; // χ_Z′
  outputs.sort((x, y) => x.service - y.service || (toHex(x.hash) < toHex(y.hash) ? -1 : 1));
  return { state: after, statistics, queues, staging, rounds, outputs };
}
```

`accumulateBlock` carries both through the rounds. The block's new χ_Z goes into the
state; ι′, when a delegator chose one, comes back beside the authorizer queues, for block
import ([Part 19](../19-block-import/index.md)) to put in the state.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ bless_from_non_manager-1: the block ends as the vector says (106.303875ms)
✔ bless_from_non_manager-2: the block ends as the vector says (142.883792ms)
...
✔ designate_with_invalid_count-1: the block ends as the vector says (204.880042ms)
✔ designate_with_invalid_count-2: the block ends as the vector says (474.575333ms)
...
✔ the delegator blesses service 2 as the delegator, though it isn't the manager (63.69025ms)
...
✔ bless: every privilege at once, and the always-accumulate services (0.214834ms)
✔ designate: the delegator picks the next validators; a count tiny can't have, HUH (1.675125ms)
...
ℹ tests 588
ℹ suites 0
ℹ pass 588
ℹ fail 0
...
reported 588 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791769561954
...
```

## Watch it

**Run**

```sh
npm pkg set scripts.host-bless="node bin/host.ts ../vectors/stf/accumulate/tiny/bless_from_non_manager-1.json 1"
npm run host-bless
npm pkg set scripts.host-designate="node bin/host.ts ../vectors/stf/accumulate/tiny/designate_with_invalid_count-1.json 0"
npm run host-designate
```

```text
...
host call 15 (bless): φ₇ = 0, 1882652 gas left
...
the service stops: "halt", using 161878 gas
the test vector says: 161878
...
host call 17 (designate): φ₇ = HUH, 1526031 gas left
...
the service stops: "halt", using 507819 gas
the test vector says: 507819
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=host-1791769574399
```

Service 1 blesses (`OK`, the vectors' rule), and service 0 tries to designate a number of
validators tiny can't have (`HUH`). Both use exactly the vector's gas. The *Host calls*
panel shows the two runs.

## The scoreboard

`checkBlock` compares whole blocks piece by piece, so that a red stays short, and only at
the tiny size. The scoreboard runs the family at both sizes, and asks
one question of each part of the state: the same as the vector's, or not?

**Add to** `test/families.ts`

```ts
import { accumulateBlock, accumulationStateFromJson, outputsRoot } from "../src/accumulate.ts";
import type { AccumulationStateJson } from "../src/accumulate.ts";

type AccumulateInput = { slot: number; reports: unknown[] };
type ServiceRecord = Record<string, number>;
type AccumulateStatistics = { id: number; record: ServiceRecord }[];
type AccumulateState = AccumulationStateJson & { statistics: AccumulateStatistics };

/** An accumulate vector: every account, the privileges, the queue and history, τ′, the
 * services' accumulation statistics, and the root of what services yielded. */
function checkAccumulate(name: string) {
  const vector = vectorJson(name) as StfVector<AccumulateInput, AccumulateState>;
  const config = configOf(name);
  const { input, pre_state, post_state } = vector;
  const reports = input.reports.map((r) => WorkReport.fromJson(r));
  const before = accumulationStateFromJson(pre_state);
  const { state, statistics, outputs } = accumulateBlock(config, before, input.slot, reports);
  assert.equal(toHex(outputsRoot(outputs)), vector.output?.ok, "output differs");
  const expected = accumulationStateFromJson(post_state);
  assert.deepEqual(state.accounts, expected.accounts, "accounts differs");
  assert.deepEqual(state.privileges, expected.privileges, "privileges differs");
  assert.deepEqual(state.free, expected.free, "privileges' always_acc differs");
  assert.deepEqual(state.ready, expected.ready, "ready_queue differs");
  assert.deepEqual(state.accumulated, expected.accumulated, "accumulated differs");
  assert.equal(input.slot, post_state.slot, "slot differs"); // τ′ is the block's slot
  const stats = post_state.statistics.map(({ id, record: r }) => [id, {
    count: r.accumulate_count,
    transfers: r.accumulate_transfer_count,
    gasUsed: BigInt(r.accumulate_gas_used),
  }] as const);
  assert.deepEqual(statistics, new Map(stats), "statistics differs");
  unchanged(vector, ["accounts", "privileges", "ready_queue", "accumulated", "slot", "statistics"]);
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
  { folders: ["stf/accumulate/tiny", "stf/accumulate/full"], check: checkAccumulate },
];
```

The full vectors run the same services under the full network's parameters: 341 cores'
worth of gas budget, and a full epoch's queue.

One of the 126 that the milestone counts, `bless_from_non_manager-1`, shown by its input and its privileges before and after:

::: code-group

```json [what goes in]
{
  "vector": "vectors/stf/accumulate/tiny/bless_from_non_manager-1.json",
  "input": {
    "slot": 43,
    "reports[0]": {
      "package_spec.hash": "0x774935b629cc42513a66c8ed1a09f88b00fe35689032bafd5a26d52f464c4808",
      "core_index": 0,
      "results": [
        {
          "service_id": 1,
          "accumulate_gas": 2000000
        }
      ]
    }
  },
  "pre_state.privileges": {
    "bless": 0,
    "assign": [
      0,
      0
    ],
    "designate": 1,
    "register": 0,
    "always_acc": []
  },
  "post_state.privileges": {
    "bless": 0,
    "assign": [
      0,
      0
    ],
    "designate": 2,
    "register": 0,
    "always_acc": []
  },
  "output": {
    "ok": "0x0000000000…"
  }
}
```

```text [console]
stf/accumulate         126 of 126  ✔
364 of 1,428 vectors pass.
```

:::

*Run whole* means your client runs service 1's real code on the PVM and must land on every part of the vector: the privileges after (here the delegator `designate` moves from 1 to 2, the manager `bless` stays 0), and the yielded root in `output`. The `stf/accumulate` row counts it only when every part matches.

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

364 of 1,428 vectors pass.
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=scoreboard-1791939598350
```

> [!TIP] Milestone
> **Every accumulate vector.** All 126, tiny and full, whole: real services
> run on your PVM, every account, privilege, queue and statistic after the block, and the
> root of what they yielded, as the vectors have them.

<details>
<summary>lasair: one switch, in <code>lib/pvm_host.ml</code></summary>

```ocaml
(** GP 0.8.0 pvm_invocations.tex Omega_B answers HUH when the invoker is not
    the manager. jam-test-vectors 0.8.0 follow the #519 deviation instead (a
    non-manager may call bless; the writeback keeps only the roles it owns --
    [Stf_guarantees.apply_privileged_writeback]) and GP #558 will make that
    the rule. ONE switch: flip to [true] to get the strict 0.8.0 text. *)
let bless_refuses_non_manager = false
```

lasair made the same choice you did, and kept the strict rule one word away. Its comment
also names the paper's pull request (558) expected to make the vectors' rule the official
one.

</details>

## Check your understanding

::: check
**In `bless_from_non_manager-1`, service 1, the delegator but not the manager, blesses service 2 as the delegator. The manager leaves the delegator alone. Who is the delegator after?**

- [ ] Service 1: only the manager may bless
  > No: that's Gray Paper 0.8.0's text, but the vectors follow the later change:
  > anyone may call `bless`, and the merge decides what counts.
- [x] Service 2
  > Yes: R(1, 1, 2) = 2. The manager made no change, so the holder's own choice goes
  > through.
- [ ] Service 0, the manager
  > No: the manager's run left the delegator at 1, and leaving it is no change.

**Suppose service 1's `bless` also lists new always-accumulate services. What does the list look like after the round?**

- [ ] The new list: in the vectors, anyone may bless
  > No: anyone may call it, but the always-accumulate services come from the
  > manager's run alone.
- [x] The old list: only a manager's `bless` changes it
  > Yes: χ_Z after the round is what the manager's run left. Service 1 isn't the
  > manager, so its list counts for nothing.
- [ ] The old and the new lists, merged
  > No: the lists aren't merged. It's the manager's list, whole.

**On tiny, with 2 cores, service 0, the delegator, designates 3 validators. What does it get?**

- [x] `HUH`
  > Yes: tiny allows only 6: multiples of 3, from 6 up to 3 × 2 cores. 3 isn't one
  > of them.
- [ ] `OK`: 3 is a multiple of 3
  > No: it's also below 6, the fewest the chain allows.
- [ ] A panic
  > No: only keys it can't read make it panic. A count the chain doesn't allow is
  > `HUH`.

**At the round's start, service 1 is the delegator. In one run, service 0, the manager, blesses itself as the delegator, then designates 6 validators. Service 1 designates nothing. Do service 0's 6 become ι′?**

- [ ] Yes: its `designate` answered `OK`
  > No: `OK` only says its own run allowed it, because its `bless` came first. The
  > merge decides what counts.
- [x] No: ι′ comes only from the run of the delegator at the round's start
  > Yes: that's service 1, which chose nothing, so ι stays as it was. By R, service 0
  > is the delegator from the next round on, and may designate then.
- [ ] No: `designate` answers `HUH`, as service 0 isn't the delegator
  > No: in its own run it is, since its `bless` came first. It gets `OK`.
:::

## What you have

Every accumulate host call a block needs, and whole blocks that match all 63 official
accumulate vectors, and all 126 at both sizes on the scoreboard: the gas budget, upgrades,
yields and their root, provisions, and every privilege. That's [Part 17](./index.md) done. Next, the chain keeps score of all this work:
[Part 18](../18-statistics/index.md) builds the statistics.

Next: [Part 18 · Statistics](../18-statistics/index.md)
