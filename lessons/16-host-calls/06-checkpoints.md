# Checkpoints

A service that panics halfway through its accumulation has written half of what it meant
to. What happens to that half? The Gray Paper's answer: it's thrown away, back to the last
*checkpoint*, a moment the service itself chose to say "keep everything up to here". This
lesson gives accumulation its two sets of accounts, the `checkpoint` host call that copies
one into the other, and the function that decides at the end which one survives. And with
those, your client has its first Ψ_A: a whole accumulation, start to finish.

## New words

- **Checkpoint.** A moment a service marks as "keep everything up to here": if it fails
  later, its changes roll back to the last checkpoint. *Example:* a write, a checkpoint,
  another write, then a panic: only the first write survives.

It's in the [glossary](../glossary.md).

## What the Gray Paper says

Ψ_A (App. B.4) runs a service with a *pair* of contexts, X and Y. Both start as the same
state (I(…)², the Gray Paper writes: I's context, twice). Every host call changes X. Y is
the fallback.

- **`checkpoint`** (host call 18, App. B.7, Ω_C): Y′ = X, so everything done so far
  survives whatever comes next. φ₇ = the gas left, after paying 103.
- **C, the collapse** (App. B.4): when the machine stops, a halt keeps X; a panic or
  running out of gas keeps Y. So without a checkpoint, a failed accumulation changes
  nothing the service did itself (money transferred to it still arrives, as [Part
  17](../17-accumulation/index.md) shows).
- **Ψ_A** puts it together: lay out the service's code with Y ([lesson 15.8](../15-the-pvm/08-a-real-program.md)), arguments
  E(t, s, |i|), start at 5, answer host calls with F, then collapse. The gas used is u = g
  minus what's left (never counting below zero).

Try it below. Service 0 is [lesson 16.4](./04-info.md)'s made-up record, with a balance of
1,000. Tap host calls to build a run: the two writes of this lesson's tests, a checkpoint,
and a transfer of a hundred ([lesson 17.3](../17-accumulation/03-sending-a-transfer.md) adds that one). X and Y sit side by side after
each step. Then stop the machine, and see which one survives.

<CheckpointRun />

## The tests

The tests' bundles get their checkpoint, and `vectorService` is built from a helper that
the new tests share:

**Replace in** `test/host.test.ts`

```ts
/** Accumulation's host, for service 0 with a tiny program, an entropy of sevens, no inputs. */
const accumulating = accumulateHost(TINY, {
  id: 0,
  accounts: tinyAccounts(),
  checkpoint: tinyAccounts(),
  code: tinyCode(),
  entropy: new Uint8Array(32).fill(7),
  inputs: [],
});

/** Service 1729's accumulation, set up as always_accumulate-1 has it: machine and host. */
function vectorService() {
  const { a, slot, expected } = vectorAccumulation();
  const [t, s] = [BigInt(slot), BigInt(a.id)]; // the slot, the service, no inputs
  const args = Uint8Array.from([...encodeNatural(t), ...encodeNatural(s), ...encodeNatural(0n)]);
  const { memory, registers } = standardProgram(a.code, args);
  const machine = newMachine(deblob(a.code.program), registers, memory, 100_000n);
  machine.pc = 5; // accumulation
  return { machine, host: accumulateHost(TINY, a), expected };
}
```

**Add to** `test/host.test.ts`

```ts
import type { Accumulation } from "../src/host.ts";
import { accumulate, checkpoint, collapse } from "../src/host.ts";
import { copyAccounts } from "../src/services.ts";
import type { Accumulated, HostExit } from "../src/host.ts";
import type { Exit, Machine } from "../src/pvm/machine.ts";

/** always_accumulate-1's service 1729 as an accumulation, its slot, and its gas to use. */
function vectorAccumulation() {
  const vector = vectorJson("stf/accumulate/tiny/always_accumulate-1.json") as AccumulateVector;
  const { id, data } = vector.pre_state.accounts[0];
  const preimage = data.preimage_blobs.find((p) => p.hash === data.service.code_hash)!;
  const accounts = new Map(vector.pre_state.accounts.map((a) => [a.id, accountFromJson(a.data)]));
  const a: Accumulation = {
    id,
    accounts,
    checkpoint: copyAccounts(accounts),
    code: unpackCode(fromHex(preimage.blob)),
    entropy: fromHex(vector.pre_state.entropy),
    inputs: [],
  };
  const expected = BigInt(vector.post_state.statistics[0].record.accumulate_gas_used);
  return { a, slot: vector.input.slot, expected };
}

/** Accumulation's bundle for service 0 of tinyAccounts, about to do something. */
function bundle(): Accumulation {
  const accounts = tinyAccounts();
  return {
    id: 0,
    accounts,
    checkpoint: copyAccounts(accounts),
    code: tinyCode(),
    entropy: new Uint8Array(0),
    inputs: [],
  };
}

test("a panic undoes every write since the last checkpoint", () => {
  const a: Accumulation = bundle();
  write(storing(0x20000n, 4n, 0x20010n, 3n), a.accounts, 0); // "last" → 1, 2, 3
  const afterHalt: Map<number, Account> = collapse(a, "halt"); // a halt keeps it
  assert.equal(afterHalt.get(0)!.storage.size, 1);
  const afterPanic: Map<number, Account> = collapse(a, "panic"); // a panic doesn't
  assert.equal(afterPanic.get(0)!.storage.size, 0);
});

test("checkpoint: what's done before it survives a panic after it", () => {
  const a: Accumulation = bundle();
  write(storing(0x20000n, 4n, 0x20010n, 3n), a.accounts, 0); // "last"
  const machine: Machine = storing();
  const exit: HostExit = checkpoint(machine, a);
  assert.equal(exit, "continue");
  assert.equal(machine.registers[7], 10_000n - 103n); // the gas left, after paying 103
  write(storing(0x20001n, 3n, 0x20010n, 3n), a.accounts, 0); // "ast", after the checkpoint
  const afterPanic: Map<number, Account> = collapse(a, "panic");
  const keys: string[] = [...afterPanic.get(0)!.storage.keys()];
  assert.deepEqual(keys, ["0x6c617374"]);
});

test("accumulate, Ψ_A: service 1729 halts on 16,417 gas, its accounts kept", () => {
  const { a, slot, expected } = vectorAccumulation();
  const { exit, accounts, gasUsed }: Accumulated = accumulate(TINY, a, slot, 100_000n);
  assert.deepEqual([exit, gasUsed], ["halt", expected]);
  assert.equal(accounts, a.accounts); // the halt kept what it did (nothing, this time)
});
```

## The code

Falling back needs a true copy of the accounts: copying the `Map` alone would leave both
sets sharing each account's record and storage, and a write to one would show up in the
other.

**Add to** `src/services.ts`

```ts
/** A copy of the accounts that changes to the originals can't reach. */
export function copyAccounts(accounts: Map<number, Account>): Map<number, Account> {
  const copy = (a: Account) => ({ info: { ...a.info }, storage: new Map(a.storage) });
  return new Map([...accounts].map(([id, a]) => [id, copy(a)]));
}
```

The bundle gets the second set:

**Replace in** `src/host.ts`

```ts
/**
 * What a service's accumulation runs with (GP App. B.4): which service it is, the accounts
 * twice over (as it changes them, and as they'll be if it fails), its code, the entropy
 * η′₀, and its inputs, each one encoded.
 */
export type Accumulation = {
  id: number;
  accounts: Map<number, Account>; // as the service changes them (the GP's X)
  checkpoint: Map<number, Account>; // as they were at the last checkpoint (Y)
  code: ServiceCode;
  entropy: Bytes;
  inputs: Bytes[];
};

/**
 * F (GP App. B.4): the host for a service's accumulation. So far it answers gas, grow_heap,
 * fetch (whose items are the constants, 0; the entropy, 1; and the inputs, all of them, 14,
 * or one, 15), info, read, write and checkpoint. Anything else: WHAT.
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
      case "checkpoint":
        return checkpoint(m, a);
      default:
        return unknown(m);
    }
  };
}
```

**Add to** `src/host.ts`

```ts
import { newMachine } from "./pvm/machine.ts";
import { deblob } from "./pvm/program.ts";
import { standardProgram } from "./pvm/standard.ts";
import { copyAccounts } from "./services.ts";

/** checkpoint (GP App. B.7, Ω_C): what the service has done so far is kept if it fails later. */
export function checkpoint(m: Machine, a: Accumulation): HostExit {
  if (!charge(m, 103)) return "oog";
  a.checkpoint = copyAccounts(a.accounts); // Y′ = X
  m.registers[7] = m.gas;
  return "continue";
}

/** C (GP App. B.4), so far: a halt keeps the accounts; anything else, the last checkpoint. */
export function collapse(a: Accumulation, exit: Exit): Map<number, Account> {
  return exit === "halt" ? a.accounts : a.checkpoint;
}

/** What an accumulation leaves: how it ended, the accounts after it, and the gas it used. */
export type Accumulated = { exit: Exit; accounts: Map<number, Account>; gasUsed: bigint };

/**
 * Ψ_A (GP App. B.4), so far: runs service a.id's accumulation at `slot` on `gas`, through
 * accumulation's host, and collapses what it did. `watch`, if given, sees each host call.
 */
export function accumulate(
  config: Config,
  a: Accumulation,
  slot: number,
  gas: bigint,
  watch?: (call: number, m: Machine) => void,
): Accumulated {
  const [t, s, n] = [slot, a.id, a.inputs.length].map((x) => encodeNatural(BigInt(x)));
  const { memory, registers } = standardProgram(a.code, concatBytes(t, s, n)); // Ψ_M's Y
  const machine = newMachine(deblob(a.code.program), registers, memory, gas);
  machine.pc = 5; // accumulation's way in
  const host = accumulateHost(config, a);
  const exit = runWithHost(machine, (call, m) => {
    const answer = host(call, m);
    watch?.(call, m);
    return answer;
  });
  const gasUsed = gas - (machine.gas > 0n ? machine.gas : 0n); // u = g − max(ϱ′, 0)
  return { exit, accounts: collapse(a, exit), gasUsed };
}
```

`accumulate` is everything `vectorService` used to do by hand, plus the collapse: [lesson
15.8](../15-the-pvm/08-a-real-program.md)'s start, [lesson 16.1](./01-calling-the-host.md)'s `runWithHost` with accumulation's host, and C at the end. Its
`watch` is for the curious: it sees every host call, once answered.

The bin can stop building machines now:

**Rewrite** `bin/host.ts`

```ts
// Runs a real service's accumulation, Ψ_A, and shows every host call it makes and the
// answer it gets. The service, 1729, comes from the accumulate test vector
// always_accumulate-1, with the 100,000 gas the vector gives it.
// Usage: npm run host

import { readFileSync } from "node:fs";
import { fromHex } from "../src/bytes.ts";
import { TINY } from "../src/config.ts";
import { accumulate, HOST_CALLS, NONE, WHAT } from "../src/host.ts";
import { Run } from "../src/obs.ts";
import { unpackCode } from "../src/pvm/program.ts";
import { accountFromJson, copyAccounts } from "../src/services.ts";

const file = "../vectors/stf/accumulate/tiny/always_accumulate-1.json";
const vector = JSON.parse(readFileSync(file, "utf8"));
const account = vector.pre_state.accounts[0]; // service 1729
const blobs: { hash: string; blob: string }[] = account.data.preimage_blobs;
const preimage = blobs.find((p) => p.hash === account.data.service.code_hash)!; // its code
const accounts = new Map([[account.id, accountFromJson(account.data)]]);
const a = {
  id: account.id,
  accounts,
  checkpoint: copyAccounts(accounts),
  code: unpackCode(fromHex(preimage.blob)),
  entropy: fromHex(vector.pre_state.entropy),
  inputs: [],
};

const run = new Run("host");
const result = accumulate(TINY, a, vector.input.slot, 100_000n, (call, m) => {
  const name = HOST_CALLS[call] ?? (call === 100 ? "log, from JIP-1" : "?");
  const r7 = m.registers[7];
  const said = r7 === WHAT ? "WHAT" : r7 === NONE ? "NONE" : String(r7);
  console.log(`host call ${call} (${name}): φ₇ = ${said}, ${m.gas} gas left`);
  run.event("call", { call, name, said, gas: Number(m.gas) });
});
console.log(`the service stops: ${JSON.stringify(result.exit)}, using ${result.gasUsed} gas`);
console.log(`the test vector says: ${vector.post_state.statistics[0].record.accumulate_gas_used}`);
run.event("stop", { exit: JSON.stringify(result.exit), used: Number(result.gasUsed) });
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ the reported packages: each one's hash and exports root, sorted by hash (246.3ms)
...
✔ a panic undoes every write since the last checkpoint (0.1ms)
✔ checkpoint: what's done before it survives a panic after it (0.1ms)
✔ accumulate, Ψ_A: service 1729 halts on 16,417 gas, its accounts kept (62.2ms)
...
ℹ tests 467
ℹ suites 0
ℹ pass 467
ℹ fail 0
...
reported 467 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791738269977
...
```

## Watch it

**What flows through it.** The run is the same as [lesson 16.3](./03-growing-the-heap.md)'s; what's new is Ψ_A around it,
the context it keeps and what it hands back:

::: code-group

```json [what goes in]
{
  "input": { "slot": 43 },
  "pre_state": {
    "entropy": "0xae85d6635e9a…",
    "accounts": [ { "id": 1729, "data": {
      "service": { "code_hash": "0xfd3f1355…" },
      "storage": [], "preimage_blobs": [ "… its code …" ], "preimage_requests": [ "…" ]
    } } ]
  },
  "post_state": { "statistics": [ { "id": 1729, "record": { "accumulate_gas_used": 16417 } } ] }
}
```

```ts [what it computes]
// Ψ_A's context for 1729, and its result
const computed = {
  args: [0x2b, 0x86, 0xc1, 0x00], // t = 43, s = 1729, n = 0 inputs, each a compact natural
  accounts: [1729], // X: the accounts as the service changes them
  checkpoint: [1729], // Y: a copy, kept in case the run fails; no checkpoint call refreshes it
  inputs: [], // no operands or transfers this time
  exit: "halt", // how runWithHost ended
  collapsed: "accounts", // C: a halt keeps X; a panic or oog would fall back to Y
  gasUsed: 16_417n, // g − max(ϱ′, 0): 100,000 − 83,583
};
```

```text [what comes out]
the service stops: "halt", using 16417 gas
the test vector says: 16417
```

:::

**Run**

```sh
npm run host
```

```text
host call 2 (fetch): φ₇ = 122, 99367 gas left
host call 1 (grow_heap): φ₇ = 51, 98728 gas left
host call 1 (grow_heap): φ₇ = 51, 97953 gas left
host call 2 (fetch): φ₇ = 122, 96859 gas left
host call 100 (log, from JIP-1): φ₇ = WHAT, 87377 gas left
host call 2 (fetch): φ₇ = 1, 86270 gas left
host call 2 (fetch): φ₇ = 1, 84708 gas left
the service stops: "halt", using 16417 gas
the test vector says: 16417
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=host-1791738276309
```

The same conversation as [lesson 16.3](./03-growing-the-heap.md), through Ψ_A now: the service
halts, so X is kept. And across the accumulate vectors, the services that stopped at
`checkpoint` go on to ask for something new, one family of vectors each: `bless`, `assign`
and `designate` (privileges), `new`, `upgrade`, `eject` and `transfer` (services), `lookup`,
`solicit`, `query` and `provide` (preimages), and `yield`. That's the rest of the host's job.

<details>
<summary>lasair: the checkpoint, in <code>lib/pvm_host.ml</code></summary>

```ocaml
type checkpoint_state = {
  cp_service: service_account;
  cp_other_services: (int * service_account) list;
  cp_acc_ctx: accumulate_context option;
  cp_nextfree: int64;
}
```

lasair's Y. Its `checkpoint` call fills one of these from the live context: the service's
own account, the other accounts, the accumulation context (where the transfers, the
privilege changes and the yield of the host calls still to come will live), and the next
free service id. Your `copyAccounts` is the same snapshot, for the one thing your context
holds so far. It will hold more.

</details>

## Check your understanding

::: check
**A service writes a key, then runs out of gas. It never made a checkpoint. What does it leave?**

- [x] Nothing it did: running out of gas keeps Y, still the state it started from
  > Yes: the collapse treats out of gas just like a panic. Only a halt keeps X.
- [ ] The write: running out of gas isn't the service's fault, so its work is kept
  > No: whatever the reason, a service that didn't halt didn't finish, and its unfinished
  > work goes.
- [ ] The write: it went straight into the chain's state
  > No: every host call changes X, a copy. The chain only gets whichever of X and Y
  > survives at the end.

**It writes "last", calls `checkpoint`, writes `"ast"`, then panics. Which keys are left?**

- [ ] None
  > No: the checkpoint copied X into Y, with "last" in it.
- [x] "last" only
  > Yes: Y has "last" from the checkpoint. `"ast"` was only ever in X, and a panic throws X
  > away.
- [ ] Both
  > No: that's what a halt would keep. A panic keeps Y.

**The same run, but at the end it halts instead. Which keys are left?**

- [ ] "last" only, as the checkpoint said
  > No: a checkpoint only matters if the service fails. A halt keeps X, everything.
- [ ] None
  > No: a halt keeps every change the service made.
- [x] Both, "last" and `"ast"`
  > Yes: X has both writes, and a halt keeps X.

**Why must Y be a true copy, not the same accounts shared with X?**

- [x] Otherwise a write after the checkpoint would change Y too, and a panic couldn't undo it
  > Yes: a copy of the `Map` alone shares each account's storage. `"ast"` would land in both,
  > and survive the panic.
- [ ] A true copy takes less memory
  > No: it takes more. Correctness is the reason.
- [ ] Y is what gets written to the chain, so it needs its own memory
  > No: only one of X and Y survives, and which one depends on how the service stops.
:::

## What you have

A whole accumulation, Ψ_A, that keeps what a service does when it succeeds, and falls
back to its last checkpoint when it doesn't. So far each service has run with no inputs:
[lesson 16.7](./07-a-services-inputs.md) hands it the work it was actually given.

**Say it out loud.** Accumulation keeps two copies of what a service does. A halt keeps the new one; a panic or running out of gas falls back to the last checkpoint.

Next: [16.7 A service's inputs](./07-a-services-inputs.md)
