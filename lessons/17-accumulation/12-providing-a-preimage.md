# Providing a preimage

**In one sentence:** one service can hand another a preimage it is waiting for, during
accumulation, and the bytes are delivered at the end of the round.

Here is a round with a service waiting for some bytes. Pick a run and who it provides
to, press *provide*, then end the round and see what is delivered and what is dropped.

<a id="try-it"></a>

<ProvideRound />

## The idea

A service that wants some data asks for it by hash and length
([lesson 14.1](../14-services/01-providing-preimages.md)). Usually it waits for someone to
bring the bytes in a block's preimages extrinsic. But what if another service already
holds them?

Then it can hand them over itself, while it accumulates. To
[*provide*](../glossary.md#provide) is for one service to give another, or itself, a
preimage it has asked for.

There is a catch. Every run in a round starts from the same accounts, and nobody writes
in an account that isn't theirs. So the bytes aren't put in the receiver's account during
the run. They are left at the door, as a [*provision*](../glossary.md#provision): a note
of who the bytes are for, and the bytes. When the round is over, each provision is
delivered, if the service is still there and still waiting. Any other is dropped.

By the end of this lesson your client delivers them, and the two `provide_preimage`
vectors pass whole.

## What the Gray Paper says

`provide` is host call 27 (Appendix B.7, Ω_♈). It costs 3,980 gas plus 2,264 for every
1,024 bytes provided (rounded up). Then:

1. **Who for.** Service φ₇, or this service itself if φ₇ is 2^64 − 1. The preimage is the
   φ₉ bytes at φ₈.
2. **Maybe refuse.** `HUH` if φ₉ is 2^32 or more (no blob is that long). Panic if the bytes
   can't be read. `WHO` if there's no such service. `HUH` unless that service's request for
   exactly this hash and length is `[]`: asked for, and not yet provided. `HUH` if this run
   provided the same thing already.
3. **Keep it.** Otherwise the provision joins the run's 𝐩, and φ₇ = `OK`.

Nothing is delivered yet. Provisions collapse like transfers: a halt keeps them all, a
panic only those the last checkpoint kept. At the end of the round, after the accounts are
merged, comes the Gray Paper's I, the preimage integration function, with its test Y:

::: gray-paper 12.2 18-19

#### §12.2 Execution, continued

<a id="gp-12-2-p18"></a>And $I$ is the preimage integration function, which transforms a dictionary of service states and a set of service/blob pairs into a new dictionary of service states. Preimage provisions into services which no longer exist or whose relevant request is dropped are disregarded:

<a id="gp-12-2-p19"></a><a id="eq-12-20"></a><a id="eq-12-21"></a>

$$
\begin{align}
I &\colon\left\{ \begin{aligned}
&\!\left\lgroup\left\langle\!\left\vert \mathbb{N}_S\to\mathbb{A}\right\vert\!\right\rangle, \left\{\mkern-5mu\left[\,\!\left\lgroup\mathbb{N}_S, \mathbb{B}_{}\right\rgroup\!\,\right]\mkern-5mu\right\}\right\rgroup\! \to \left\langle\!\left\vert \mathbb{N}_S\to\mathbb{A}\right\vert\!\right\rangle \\
&\left(\mathbf{d}, \mathbf{p}\right) \mapsto \mathbf{d}'\; \text{where } \mathbf{d}' = \mathbf{d}\;\text{except:} \\
&\quad\forall \left(s, \mathbf{i}\right) \in \mathbf{p},\;
Y(\mathbf{d}, s, \mathbf{i}):\\
&\qquad \mathbf{d}'\left[s\right]_{\mathbf{l}}\left[\left(\mathcal{H}\left(\mathbf{i}\right), \left\vert\mathbf{i}\right\vert\right)\right] =\left[\tau'\right]\\
&\qquad \mathbf{d}'\left[s\right]_{\mathbf{p}}\left[\mathcal{H}\left(\mathbf{i}\right)\right] = \mathbf{i}
\end{aligned} \right. \tag{12.20} \\
Y &\colon\left\{ \begin{aligned}
&\!\left\lgroup\left\langle\!\left\vert \mathbb{N}_S\to\mathbb{A}\right\vert\!\right\rangle, \mathbb{N}_S, \mathbb{B}_{}\right\rgroup\! \to {\left\{\,\bot, \top\,\right\}} \\
&\left(\mathbf{d}, s, \mathbf{i}\right) \mapsto \begin{cases}
\mathbf{d}\left[s\right]_{\mathbf{l}}\left[\left(\mathcal{H}\left(\mathbf{i}\right), \left\vert\mathbf{i}\right\vert\right)\right] = \left[\right] &\text{if } s \in \mathcal{K}\left(\mathbf{d}\right) \\
\bot &\text{otherwise}
\end{cases}
\end{aligned} \right. \tag{12.21}
\end{align}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-local-fnprovide">$I$</span> | I | preimage integration: files each provided blob in its service, if that service still waits for it |
| <span id="gk-abracegroup">$\left\{ \begin{aligned}x\end{aligned} \right.$</span> | as follows | a brace grouping lines that hold together: for a function, its type on top, then what each input becomes |
| <span id="gk-tuple">$\!\left\lgroup x\right\rgroup\!$</span> | the tuple of | a record: named fields, each with its type, like an object in JSON |
| <span id="gk-dictionary">$\left\langle\!\left\vert x\to y\right\vert\!\right\rangle$</span> | a dictionary from K to V | a map: keys of type K, each with one value of type V |
| <span id="gk-serviceid" class="gk-wrap">$\mathbb{N}_S$</span> | N sub S | a service id: a whole number below 2³², 4 bytes |
| <span id="gk-serviceaccount" class="gk-wrap">$\mathbb{A}$</span> | A | a service account: three dictionaries (storage, preimages, requests) and eight plain fields |
| <span id="gk-protoset">$\left\{\mkern-5mu\left[\,x\,\right]\mkern-5mu\right\}$</span> | the set of | a set written in order: no repeats, kept sorted |
| <span id="gk-blob">[$\mathbb{B}$](../symbols.md#blobs)</span> | B, or B sub n | bytes: any run of them; 𝔹ₙ exactly n of them |
| <span id="gk-to">[$\to$](../symbols.md#to)</span> | to | what goes in, to what comes out: A → B takes an A and gives a B |
| <span id="gk-mapsto">$\mapsto$</span> | maps to | what a function gives back for an input: x ↦ y says x becomes y |
| <span id="gk-forall">$\forall$</span> | for all | for every value: ∀c ∈ ℕ_C means for each core c |
| <span id="gk-in">[$\in$](../symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-local-fnprovidable">$Y$</span> | Y | is this blob still wanted? true if the service exists and its request for the blob's hash and length is [ ]: asked, not yet given |
| <span id="gk-subb">[$\left[x\right]$](../symbols.md#sequence)</span> | at | x[i]: the item at index i, or the value at key i |
| <span id="gk-sa-requests" class="gk-wrap">$\mathbf{l}$</span> | l | an account's requests: for each (hash, length) asked for, a history of up to 3 slots |
| <span id="gk-blake">$\mathcal{H}\left(x\right)$</span> | H of | the Blake2b hash of what's in the brackets: 32 bytes |
| <span id="gk-len">$\left\vert x\right\vert$</span> | the size of | \|x\|: how many items x has, or how many bytes |
| <span id="gk-thetime" class="gk-wrap">$\tau$</span> | tau | the time: the latest block's timeslot |
| <span id="gk-sa-preimages" class="gk-wrap">$\mathbf{p}$</span> | p | an account's preimages: each a blob filed under its own 32-byte hash |
| <span id="gk-bool">${\left\{\,\bot, \top\,\right\}}$</span> | true or false | a yes-or-no value: true (⊤) or false (⊥) |
| <span id="gk-keys">$\mathcal{K}\left(x\right)$</span> | K of | a dictionary's keys |
| <span id="gk-bot">$\bot$</span> | bottom | false, the no of a yes-or-no value |

</details>

→ [(12.20), (12.21) explained](./gray-paper.md#ex-12-20)

:::

The last step:

4. **Deliver.** Each provision whose service still exists and still waits for it (its
   request is still `[]`) is stored: the bytes join the service's preimages, and the request
   becomes `[τ′]`, provided in this block's slot. Any other is dropped, quietly.

Try it on [the round at the top](#try-it).

Why wait for the end of the round? Every run in a round starts from the same accounts, and
a provision changes an account the giver doesn't own. Delivering them afterwards keeps the
runs independent, as transfers ([lesson 17.4](./04-rounds.md)) do.

One honest note. Where the Gray Paper's collapse C keeps the provisions of a halt with a
32-byte output, it writes them as coming from X and Y together. Every other case takes one
side, and every other part of that same halt is X's. So read it as X: a halt keeps
everything its run did.

## The tests

**Add to** `test/host.test.ts`

```ts
import { provide } from "../src/host.ts";

test("provide: a preimage for a service that asked for it, once", () => {
  const a: Accumulation = bundle(); // service 0
  const wanted: Bytes = Uint8Array.of(1, 2, 3); // storing's bytes at 0x20010
  a.accounts.get(0)!.requests.set(`${toHex(blake2b256(wanted))}:3`, []); // asked, waiting
  const outbox: Outbox = { transfers: [], kept: [] };
  const toItself: Machine = storing(2n ** 64n - 1n, 0x20010n, 3n); // 2^64 − 1: this service
  provide(toItself, a, outbox);
  assert.equal(toItself.registers[7], OK);
  assert.deepEqual(outbox.provided, [{ service: 0, preimage: wanted }]);
  const answer = (w: bigint, b = a) => {
    const machine = storing(w, 0x20010n, 3n);
    provide(machine, b, outbox);
    return machine.registers[7];
  };
  const twice: bigint = answer(0n); // this run provided it already
  assert.equal(twice, HUH);
  const noSuchService: bigint = answer(7n);
  assert.equal(noSuchService, WHO);
  const notAsked: bigint = answer(0n, bundle()); // a service 0 that never asked
  assert.equal(notAsked, HUH);
});
```

`storing` from [lesson 16.5](../16-host-calls/05-storage.md) puts the bytes 1, 2, 3 at 0x20010, a fine preimage. Service 0
asks for it, then provides it to itself, by 2^64 − 1. A second time is one too many.

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
test("service 0 provides 1729's preimage: it arrives at the end of the round, slot 44", () => {
  const vector = vectorJson("stf/accumulate/tiny/provide_preimage-2.json") as BlockVector;
  const before: AccumulationState = accumulationStateFromJson(vector.pre_state);
  const hash = "0x943e3d42cf248c99fa6346c24b66741090bd2c78f9ff691c5fd7a88ef51d27e2";
  const asked: number[] = before.accounts.get(1729)!.requests.get(`${hash}:8`)!;
  assert.deepEqual(asked, []); // 1729 asked for these 8 bytes, and waits
  const { state } = accumulateBlock(TINY, before, vector.input.slot, reportsOf(vector));
  const account: Account = state.accounts.get(1729)!;
  const arrived: number[] = account.requests.get(`${hash}:8`)!;
  assert.deepEqual(arrived, [44]);
  const preimage: string = new TextDecoder().decode(account.preimages.get(hash));
  assert.equal(preimage, "preimage");
});
```

**Run, expect it to fail**

```sh
npm test
```

```text
...
✖ provide_preimage-1: the block ends as the vector says (145.6745ms)
✖ provide_preimage-2: the block ends as the vector says (72.212084ms)
...
✖ service 0 provides 1729's preimage: it arrives at the end of the round, slot 44 (52.058291ms)
...
ℹ tests 544
ℹ suites 0
ℹ pass 540
ℹ fail 4
...
```

Red where it counts. In both vectors and the new test, service 0's call 27 gets `WHAT`, so
it carries on down another path and uses the wrong gas. (The fourth failure is
`test/host.test.ts`, which can't load until `provide` exists.)

## The code

Provisions travel in the outbox too, and a checkpoint keeps them:

**Replace in** `src/host.ts`

```ts
/** What an accumulation has sent (the GP's 𝐭, y and 𝐩, in X and Y): every transfer so
 * far, and the ones the last checkpoint keeps if the run fails; the same for its yield and
 * the preimages it has provided. */
export type Outbox = {
  transfers: Transfer[];
  kept: Transfer[];
  yielded?: Bytes;
  keptYield?: Bytes;
  provided?: Provision[];
  keptProvided?: Provision[];
};
```

**Add to** `src/host.ts`

```ts
/** A preimage provided to a service that asked for it (GP §12, a pair in 𝐩). */
export type Provision = { service: number; preimage: Bytes };
```

**Replace in** `src/host.ts`

```ts
/** checkpoint (GP App. B.7, Ω_C): what the service has done so far is kept if it fails later. */
export function checkpoint(
  m: Machine,
  a: Accumulation,
  outbox: Outbox = { transfers: [], kept: [] },
  powers: Powers = startPowers(),
): HostExit {
  if (!charge(m, 103)) return "oog";
  a.checkpoint = copyAccounts(a.accounts); // Y′ = X
  outbox.kept = [...outbox.transfers]; // the transfers sent so far, too
  outbox.keptYield = outbox.yielded; // and the yield
  outbox.keptProvided = [...(outbox.provided ?? [])]; // and the preimages provided
  powers.kept = copyPrivileged(powers.now); // and the privileges
  m.registers[7] = m.gas;
  return "continue";
}
```

**Add to** `src/host.ts`

```ts
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
  const slots = account.requests.get(`${toHex(blake2b256(preimage))}:${z}`);
  if (slots?.length !== 0) return setTo(m, HUH); // not asked for, or not waiting for it
  const provided = (outbox.provided ??= []);
  const same = (p: Provision) => p.service === s && toHex(p.preimage) === toHex(preimage);
  if (provided.some(same)) return setTo(m, HUH); // this run gave it already
  provided.push({ service: s, preimage });
  return setTo(m, OK);
}

/** C (GP App. B.4), for provisions: a halt keeps them all; anything else, only those the
 * last checkpoint kept. */
export function collapseProvided(outbox: Outbox, exit: Exit): Provision[] {
  return (exit === "halt" ? outbox.provided : outbox.keptProvided) ?? [];
}
```

```ts
  if (slots?.length !== 0) return setTo(m, HUH); // not asked for, or not waiting for it
```

`slots?.length` is `undefined` when there's no request at all, and `undefined !== 0`, so
one line covers both kinds of `HUH`.

**Replace in** `src/host.ts`

```ts
/** What an accumulation leaves: how it ended, the accounts after it, the gas it used, the
 * transfers it sent, the privileges as it left them, the hash it yielded, if any, and the
 * preimages it provided. */
export type Accumulated = {
  exit: Exit;
  accounts: Map<number, Account>;
  gasUsed: bigint;
  transfers: Transfer[];
  privileged: Privileged;
  yielded?: Bytes;
  provided: Provision[];
};
```

**Replace in** `src/host.ts`

```ts
/**
 * Ψ_A (GP App. B.4), so far: runs service a.id's accumulation at `slot` on `gas`, through
 * accumulation's host, and collapses what it did, the transfers it sent and the privileges
 * included. `watch`, if given, sees each host call.
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
  const outbox: Outbox = { transfers: [], kept: [] }; // every run starts with none sent
  const powers = startPowers(a.privileges);
  const host = accumulateHost(config, a, slot, outbox, powers);
  const exit = runWithHost(machine, (call, m) => {
    const answer = host(call, m);
    watch?.(call, m);
    return answer;
  });
  const gasUsed = gas - (machine.gas > 0n ? machine.gas : 0n); // u = g − max(ϱ′, 0)
  const accounts = collapse(a, exit);
  const transfers = collapseTransfers(outbox, exit);
  const [o, length] = machine.registers.slice(7, 9); // a halt's output: `length` bytes at o
  const output = exit === "halt" && length === 32n ? readMemory(machine.memory, o, 32) : null;
  const yielded = collapseYield(outbox, exit, output instanceof Uint8Array ? output : undefined);
  const privileged = collapsePowers(powers, exit);
  const provided = collapseProvided(outbox, exit);
  return { exit, accounts, gasUsed, transfers, privileged, yielded, provided };
}
```

**Replace in** `src/host.ts`

```ts
/**
 * F (GP App. B.4): the host for a service's accumulation. So far it answers gas, grow_heap,
 * fetch (whose items are the constants, 0; the entropy, 1; and the inputs, all of them, 14,
 * or one, 15), info, lookup, read, write, checkpoint, query, solicit and forget, the last
 * two at `slot`, the time of the block; transfer, into `outbox`; assign, with `powers`;
 * eject; new; upgrade; and yield and provide, into `outbox` too. Anything else: WHAT.
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
      default:
        return unknown(m);
    }
  };
}
```

Then the round collects every run's provisions and delivers them last:

**Add to** `src/accumulate.ts`

```ts
import { blake2b256 } from "./hash.ts";
import type { Provision } from "./host.ts";

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
    const key = `${hash}:${preimage.length}`;
    if (account?.requests.get(key)?.length !== 0) continue; // gone, or not waiting
    account.requests.set(key, [slot]);
    account.preimages.set(hash, preimage);
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
  const { privileges: next, queues } = mergePrivileges(privileges, powers);
  return { accounts: after, used, transfers: sent, privileges: next, queues, outputs };
}
```

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ provide_preimage-1: the block ends as the vector says (53.830666ms)
✔ provide_preimage-2: the block ends as the vector says (53.635833ms)
...
✔ service 0 provides 1729's preimage: it arrives at the end of the round, slot 44 (53.629625ms)
...
✔ provide: a preimage for a service that asked for it, once (0.333959ms)
...
ℹ tests 581
ℹ suites 0
ℹ pass 581
ℹ fail 0
...
reported 581 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791769533387
...
```

## Watch it

**What flows through it.** Two vectors, one difference: whom service 0 provides the bytes to.
The first, with service 1729's waiting request. The second is the same but for one id.

::: code-group

```json [what goes in]
{
  "input": {
    "slot": 43,
    "reports": [ { "results": [ {
      "service_id": 0,
      "accumulate_gas": 2000000,
      "result": { "ok": "0x0111000000000108707265696d6167650000" }
    } ] } ]
  },
  "pre_state": { "accounts": [ { "id": 1729, "data": { "preimage_requests": [ {
    "key": { "hash": "0x943e3d42cf248c99…", "length": 8 },
    "value": []
  } ] } } ] }
}
```

```ts [what it computes]
// service 0's runs, at host call 27, provide; the second vector has c1060000 (1729) for 00000000
const computed = {
  bytes: "preimage", // the φ₉ = 8 bytes at φ₈ = 206,752: 707265696d616765
  hash: "0x943e3d42…", // their Blake2b-256: what a request is keyed by
  first: {
    to: 0, // φ₇: service 0, itself
    request: undefined, // service 0 never asked for these bytes
    answer: HUH, // φ₇ after: nothing to provide to
    gasUsed: 134_567n,
  },
  second: {
    to: 1729, // φ₇
    request: [], // asked for, not yet provided: so it may
    answer: 0n, // OK: joins the run's provisions
    delivered: [44], // the request after the round: provided in slot 44
    gasUsed: 138_939n,
  },
};
```

```text [what comes out]
host call 27 (provide): φ₇ = HUH, 1891713 gas left
the test vector says: 134567
host call 27 (provide): φ₇ = 0, 1887193 gas left
the test vector says: 138939
```

:::

**Run**

```sh
npm pkg set scripts.host-provide-1="node bin/host.ts ../vectors/stf/accumulate/tiny/provide_preimage-1.json 0"
npm run host-provide-1
npm pkg set scripts.host-provide-2="node bin/host.ts ../vectors/stf/accumulate/tiny/provide_preimage-2.json 0"
npm run host-provide-2
```

```text
...
host call 27 (provide): φ₇ = HUH, 1891713 gas left
...
the service stops: "halt", using 134567 gas
the test vector says: 134567
...
host call 27 (provide): φ₇ = 0, 1887193 gas left
...
the service stops: "halt", using 138939 gas
the test vector says: 138939
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=host-1791769545883
```

The same 8 bytes, "preimage", twice. In the first vector service 0 provides them to
itself, and it never asked: `HUH`. In the second it provides them to 1729, which did: `OK`,
and by the end of the round 1729's request reads `[44]`. The *Host calls* panel shows both
runs.

<details>
<summary>lasair: delivering provisions, in <code>conformance/accumulate_stf.ml</code></summary>

```ocaml
    (* P: a provided blob lands iff its service is still there and has an
       unprovided request for exactly that blob *)
    let provide d (sid, blob) =
      let key = (Lasair.Utilities.blake2b_256 blob, Bytes.length blob) in
      List.map (fun (id, (a : Lasair.Pvm_host.service_account)) ->
        if id = sid && List.assoc_opt key a.Lasair.Pvm_host.requests = Some (Some []) then
          (id, { a with
                 Lasair.Pvm_host.requests =
                   (key, Some [input.ai_slot]) :: List.remove_assoc key a.Lasair.Pvm_host.requests;
                 preimages = (fst key, blob) :: List.remove_assoc (fst key) a.Lasair.Pvm_host.preimages })
        else (id, a)) d in
    let d' = List.fold_left provide merged
```

Your `applyProvisions`, run over `merged`: the accounts after the round's merge, as yours
runs over `after`. `Some (Some [])` is "a request, and its history is empty": lasair marks a
removed request with an inner `None`, so it needs two layers where your `?.length !== 0`
needs none. The request becomes `[input.ai_slot]`, the block's slot.

</details>

## Check your understanding

::: check
**A service provides some bytes to itself, and gets `HUH`. In `provide_preimage-1`, service 0 does just that. Why?**

- [ ] A service can't provide a preimage to itself
  > No: it can. φ₇ = 2^64 − 1 means "this service", and the lesson's first test does
  > just that.
- [x] It never asked for those bytes
  > Yes: `provide` hands over only what a service asked for and still waits for: a
  > request that reads `[]`.
- [ ] 8 bytes is too short to be a preimage
  > No: any length below 2^32 will do. The same 8 bytes reach 1729 in the next vector.

**Service 0 provides bytes to a service that asked for them, and gets `OK`. When does that service have them?**

- [ ] As soon as `provide` answers `OK`
  > No: nothing is delivered then. The provision only joins the run's 𝐩.
- [ ] In a later block, through the preimages extrinsic
  > No: that's the other way in, and it isn't needed here.
- [x] At the end of the round, after the accounts are merged
  > Yes: in `provide_preimage-2`, 1729's preimage is stored then, and its request
  > reads `[44]`, this block's slot.

**Why does a provision wait for the end of the round?**

- [x] It changes an account the giver doesn't own
  > Yes: every run starts from the same accounts. Delivering afterwards keeps the runs
  > independent, as with transfers.
- [ ] So the giver can take it back if it changes its mind
  > No: there's no taking back. Only a panic or running out of gas drops a provision,
  > and only one made since the last checkpoint.
- [ ] Because `provide` is paid for at the end of the round
  > No: its gas, 3,980 plus 2,264 for every 1,024 bytes, is charged at the call.

**Services 0 and 5 both provide the same 8 bytes to 1729, in the same round. What happens?**

- [ ] Service 5 gets `HUH`, because service 0 provided them already
  > No: neither run sees the other's provisions. `HUH` is for one run providing the
  > same thing twice.
- [x] Both get `OK`, and 1729 stores the bytes once
  > Yes: both runs see 1729 still waiting. At delivery the first is stored, the
  > request reads `[44]`, and the second, no longer awaited, is dropped.
- [ ] 1729 gets two copies
  > No: a preimage is stored once, under its hash. The extra one is dropped quietly.
:::

## What you have

Preimages handed from service to service, kept or dropped by a checkpoint, and delivered
at the end of the round, so the runs stay independent. Fifty-nine official vectors pass
as whole blocks. The last four need the two privileged calls still missing:
[lesson 17.13](./13-blessing-and-designating.md) builds `bless` and `designate`.

Next: [17.13 Blessing and designating](./13-blessing-and-designating.md)
