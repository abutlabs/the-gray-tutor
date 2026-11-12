# Sending a transfer

**In one sentence:** a service can send another money while it accumulates: the money
leaves the sender at once, and reaches the receiver in a later round of the same block.

Send from the tests' service 0. Change the receiver, the amount and the gas, and see
which orders are refused and what each one costs.

<a id="try-it"></a>

<TransferSend />

## The idea

Services can pay each other. In one official vector, service 0 sends service 1 a hundred,
with a note that says "gift". But the services in a round can't see each other
([lesson 17.1](./01-a-blocks-accumulation.md)). So how does money get across?

Like a cheque in the post. The money leaves service 0's balance the moment it is sent.
It reaches service 1 when service 1 accumulates next, in a later round of the same block.
That is a [*deferred transfer*](../glossary.md#deferred-transfer).

Two things travel with it. One is a [*memo*](../glossary.md#memo): a short note for the
receiver's code to read. The other is gas, which the sender pays up front, for the work
the receiver will do with the money.

Until the run ends, what it has sent sits in a list. This client calls it the
[*outbox*](../glossary.md#outbox). If the run panics, everything sent since its last
checkpoint never happened, the money included.

This lesson builds the sending half. [Lesson 17.4](./04-rounds.md) delivers it.

## What the Gray Paper says

`transfer` is host call 21 (Appendix B.7, Ω_T). It has three steps:

1. **Read the order.** The receiver's id is in φ₇, the amount in φ₈, the gas in φ₉, and
   the memo is the 128 bytes at φ₁₀ (unreadable memory: panic, as always).
2. **Maybe refuse.** Nothing is sent, and φ₇ says why, if there's no such service
   (`WHO`), if the gas is below the least the receiver asks for a memo (`LOW`, its
   `min_memo_gas` from [lesson 14.2](../14-services/02-the-service-account.md)), or if paying would leave the sender below its own
   minimum balance (`CASH`).
3. **Send.** Take the amount off the sender's balance, right now, and add the transfer to
   the list of transfers this run has sent. φ₇ = `OK`.

It costs 575 gas, plus the transfer's own gas when it's sent: the sender pays up front
for the work the receiver will do with it.

Try each refusal on [the transfer at the top](#try-it).

One more rule, from [lesson 16.6](../16-host-calls/06-checkpoints.md): a checkpoint keeps
*everything* the run has done so far, and the list of transfers is part of it. Send, then
panic, and the transfer never happened, the money included.

What a transfer is made from, in §12.2, beside the operand tuple 𝕌 that a digest becomes
([lesson 16.7](../16-host-calls/07-a-services-inputs.md)):

::: gray-paper 12.2 5-7

#### §12.2 Execution, continued

<a id="gp-12-2-p5"></a>Rather than passing whole work-digests into accumulate, we extract the salient information from them and combine with information implied by their work-reports. We call this kind of combined value an *operand tuple*, $\mathbb{U}$. Likewise, we denote the set characterizing a *<abbr class="gp-term" title="a payment between services: the money leaves now, and the receiver's code runs on it in the next round">deferred transfer</abbr>* as $\mathbb{X}$, noting that a transfer includes a memo component $m$ of $\mathsf{W}_T = 128$ <abbr class="gp-term" title="bytes: 8 bits each">octets</abbr>, together with the service index of the sender $s$, the service index of the receiver $d$, the balance to be transferred $a$ and the gas limit $g$ for the transfer. Formally:

<a id="gp-12-2-p6"></a><a id="eq-12-13"></a><a id="eq-12-14"></a>

$$
\begin{align}
\mathbb{U} &\equiv \!\left\lgroup
\begin{alignedat}{5}
p&\in \mathbb{H}_{},\;
&e&\in \mathbb{H}_{},\;
&a&\in \mathbb{H}_{},\;
y\in \mathbb{H}_{},\;\\
g&\in \mathbb{N}_G,\;
&\mathbf{t}&\in \mathbb{B}_{},\;
&\mathbf{l}&\in \mathbb{B}_{} \cup \mathbb{E}
\end{alignedat}
\right\rgroup\! \tag{12.13} \\
\mathbb{X} &\equiv \!\left\lgroup
s\in \mathbb{N}_S ,
d\in \mathbb{N}_S ,
a\in \mathbb{N}_B ,
m\in \mathbb{B}_{\mathsf{W}_T} ,
g\in \mathbb{N}_G
\right\rgroup\! \tag{12.14}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-operandtuple" class="gk-wrap">$\mathbb{U}$</span> | U | an operand: what accumulate is told about one work-digest: package hash, exports root, authorizer, payload hash, gas, trace and result |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-tuple">$\!\left\lgroup x\right\rgroup\!$</span> | the tuple of | a record: named fields, each with its type, like an object in JSON |
| <span id="gk-isa">[$x\in y$](../symbols.md#in)</span> | in | belongs to: the field's type |
| <span id="gk-ot-packagehash">$p$</span> | p | the operand's work-package hash |
| <span id="gk-hash">$\mathbb{H}$</span> | H | a 32-byte value, usually a hash |
| <span id="gk-ot-segroot">$e$</span> | e | the operand's exports root: the root of the segments its package exported |
| <span id="gk-ot-authorizer">$a$</span> | a | the authorizer hash of the report the digest came from |
| <span id="gk-ot-payloadhash">$y$</span> | y | the hash of the work-item's payload |
| <span id="gk-ot-gaslimit">$g$</span> | g | the gas the digest asked for, to accumulate it |
| <span id="gk-gas" class="gk-wrap">$\mathbb{N}_G$</span> | N sub G | an amount of gas: a u64 |
| <span id="gk-ot-authtrace" class="gk-wrap">$\mathbf{t}$</span> | t | the authorizer's trace: the blob its code gave back when it said yes |
| <span id="gk-blob">[$\mathbb{B}$](../symbols.md#blobs)</span> | B, or B sub n | bytes: any run of them; 𝔹ₙ exactly n of them |
| <span id="gk-ot-result" class="gk-wrap">$\mathbf{l}$</span> | l | what refine produced for the work-item: a blob, or an error |
| <span id="gk-cup">$\cup$</span> | union | everything in either side |
| <span id="gk-workerror" class="gk-wrap">$\mathbb{E}$</span> | E | the set of work errors: out of gas, panic, bad exports, oversize, BAD (no code) and BIG (code too big) |
| <span id="gk-defxfer" class="gk-wrap">$\mathbb{X}$</span> | X | a deferred transfer: (source, destination, amount, memo, gas), the money moved now, the receiver run in the next round |
| <span id="gk-dx-source">$s$</span> | s | a transfer's sender: the service it comes from |
| <span id="gk-serviceid" class="gk-wrap">$\mathbb{N}_S$</span> | N sub S | a service id: a whole number below 2³², 4 bytes |
| <span id="gk-dx-dest">$d$</span> | d | a transfer's receiver: the service it goes to |
| <span id="gk-balance" class="gk-wrap">$\mathbb{N}_B$</span> | N sub B | a balance: a u64 |
| <span id="gk-dx-memo">$m$</span> | m | a transfer's memo: 128 bytes the sender writes for the receiver's code |
| <span id="gk-memo" class="gk-wrap">$\mathbb{B}_{\mathsf{W}_T}$</span> | a blob of W sub T bytes | exactly 128 bytes |

</details>

→ [(12.13), (12.14) in plain words](./gray-paper.md#ex-12-13)

<a id="gp-12-2-p7"></a>Note that the union of the two characterizes inputs to the Accumulation <abbr class="gp-term" title="one run of code in the PVM: Is-Authorized, refine or accumulate">invocation</abbr> function $\Psi_A$ (defined in equation [B.9](../16-host-calls/06-checkpoints.md#eq-B-9)).

:::

A transfer is (s, d, a, m, g): source, destination, amount, memo and gas. Transfers are
the set **𝕏** (a blackboard X, not the context X). A memo is **W_T** = 128 bytes long.
The run's list is the context's **𝐭**, one in X and one in Y, just like the accounts. A
service's inputs are these two kinds side by side: transfers and operands.

## The tests

**Add to** `test/host.test.ts`

```ts
import type { Outbox } from "../src/host.ts";
import { CASH, checkpoint, collapseTransfers, LOW, OK, transfer, WHO } from "../src/host.ts";
import type { Exit, Machine } from "../src/pvm/machine.ts";
import type { Transfer } from "../src/host.ts";

/** A machine about to send `amount` to service `dest` with `gas`, and the memo "gift". */
function sending(dest: bigint, amount: bigint, gas: bigint) {
  const memory = new Map();
  addPages(memory, 0x20000, 4096, "W");
  writeMemory(memory, 0x20000n, new TextEncoder().encode("gift"));
  const registers = [0n, 0n, 0n, 0n, 0n, 0n, 0n, dest, amount, gas, 0x20000n];
  return newMachine(assemble([[0]]), registers, memory, 10_000n);
}

test("transfer: the money leaves at once, and a checkpoint keeps what was sent", () => {
  const a: Accumulation = bundle();
  a.accounts.set(1, copyAccounts(a.accounts).get(0)!); // a second service, to send to
  const outbox: Outbox = { transfers: [], kept: [] };
  const machine: Machine = sending(1n, 30n, 25n); // 30 to service 1, with 25 gas for it
  const exit: HostExit = transfer(machine, a, outbox);
  assert.equal(exit, "continue");
  assert.equal(machine.registers[7], OK);
  assert.equal(machine.gas, 10_000n - 575n - 25n); // the call, and the transfer's gas
  assert.equal(a.accounts.get(0)!.info.balance, 970n); // gone from the sender now
  assert.equal(a.accounts.get(1)!.info.balance, 1000n); // not there yet: next round
  checkpoint(storing(), a, outbox); // the first transfer is kept now
  transfer(sending(1n, 40n, 25n), a, outbox); // and a second one, after the checkpoint
  const afterHalt: Transfer[] = collapseTransfers(outbox, "halt"); // a halt sends both
  assert.equal(afterHalt.length, 2);
  const afterPanic: Transfer[] = collapseTransfers(outbox, "panic"); // only the kept one
  assert.equal(afterPanic.length, 1);
});

test("transfer refuses: no such service, too little gas, too little money", () => {
  const a: Accumulation = bundle();
  const outbox: Outbox = { transfers: [], kept: [] };
  const answer = (machine: ReturnType<typeof sending>) => {
    transfer(machine, a, outbox);
    return machine.registers[7];
  };
  const toNobody: bigint = answer(sending(5n, 30n, 25n)); // there's no service 5
  assert.equal(toNobody, WHO);
  const tooLittleGas: bigint = answer(sending(0n, 30n, 10n)); // service 0 wants at least 20 gas
  assert.equal(tooLittleGas, LOW);
  const tooLittleMoney: bigint = answer(sending(0n, 900n, 25n)); // 1000 − 900 is below its 170
  assert.equal(tooLittleMoney, CASH);
  assert.deepEqual(outbox.transfers, []); // nothing was sent
});
```

`bundle()` from [lesson 16.6](../16-host-calls/06-checkpoints.md) has one service, 0, with a balance of 1000 and a minimum
balance of 170. The first test gives it someone to send to. The second needs no second
service: each refusal comes before anything is sent.

In the official vectors, eight services send a transfer and need nothing more. Their runs
join the list:

**Replace in** `test/accumulate.test.ts`

```ts
/** The vectors whose services need no host calls beyond this part's so far. */
const CASES: [string, number][] = [
  ["always_accumulate-1", 1729],
  ["always_accumulate-2", 1729],
  ["lookup_foreign_preimage-1", 0],
  ["lookup_foreign_preimage-2", 0],
  ["preimage_len_bound-1", 0],
  ["preimage_len_bound-2", 0],
  ["preimage_len_bound-3", 0],
  ["process_one_immediate_report-1", 1729],
  ["queues_are_shifted-1", 1729],
  ["same_code_different_services-1", 1729],
  ["same_round_storage_isolation-1", 1729],
  ["same_round_storage_isolation-1", 1730],
  ["same_round_storage_isolation-2", 1730],
  ["transfer_for_live_service-1", 0], // from here on: services that send a transfer
  ["transfer_for_ejected_service-1", 0],
  ["transfer_for_ejected_service_that_accumulates_high_ejector-1", 1],
  ["transfer_for_ejected_service_that_accumulates_low_ejector-1", 1],
  ["transfer_for_service_ejected_in_same_round_high_ejector-1", 1],
  ["transfer_for_service_ejected_in_same_round_low_ejector-1", 1],
  ["recreate_ejected_service_by_higher_registrar-1", 1],
  ["recreate_ejected_service_that_accumulates-1", 1],
];
```

**Add to** `test/accumulate.test.ts`

```ts
import type { Transfer } from "../src/host.ts";
test("a gift: service 0 sends service 1 a hundred, with a memo", () => {
  const { result, after } = runVector("transfer_for_live_service-1", 0);
  const [gift]: Transfer[] = result.transfers;
  assert.deepEqual([gift.source, gift.dest, gift.amount, gift.gas], [0, 1, 100n, 80_000n]);
  const memo: string = new TextDecoder().decode(gift.memo.subarray(0, 4));
  assert.equal(memo, "gift");
  const balance: bigint = result.accounts.get(0)!.info.balance; // 227,714 − 100
  assert.equal(balance, after.info.balance);
});
```

## The code

First the transfer itself, the outbox, and the call:

**Add to** `src/host.ts`

```ts
import type { Value } from "./codec/codec.ts";
import { fixedBytes, record, u32, u64 } from "./codec/codec.ts";

/**
 * A deferred transfer (GP §12, X): `amount` of service `source`'s balance, on its way to
 * service `dest`, with a 128-byte memo and `gas` for the receiver to handle it with.
 */
export const Transfer = record({
  source: u32,
  dest: u32,
  amount: u64,
  memo: fixedBytes(128), // W_T
  gas: u64,
});
export type Transfer = Value<typeof Transfer>;

/** What an accumulation has sent (the GP's 𝐭, in X and Y): every transfer so far, and the
 * ones the last checkpoint keeps if the run fails. */
export type Outbox = { transfers: Transfer[]; kept: Transfer[] };

/** C (GP App. B.4), for transfers: a halt sends them all; anything else, only those the
 * last checkpoint kept. */
export function collapseTransfers(outbox: Outbox, exit: Exit): Transfer[] {
  return exit === "halt" ? outbox.transfers : outbox.kept;
}

export const WHO = 2n ** 64n - 4n; // no such service
export const CASH = 2n ** 64n - 7n; // not enough balance
export const LOW = 2n ** 64n - 8n; // not enough gas

/**
 * transfer (GP App. B.7, Ω_T): sends φ₈ of the service's balance to service φ₇, with the
 * memo at φ₁₀ and φ₉ gas for the receiver to spend on it. The money leaves the sender now;
 * it arrives in the next round. Nothing is sent if there's no such service (WHO), the gas
 * is below the receiver's minimum (LOW), or the sender would drop below its own (CASH).
 * Costs 575, and the transfer's gas on top if it's sent.
 */
export function transfer(m: Machine, a: Accumulation, outbox: Outbox): HostExit {
  if (!charge(m, 575)) return "oog";
  const [dest, amount, gas, memoAt] = m.registers.slice(7, 11);
  const memo = readMemory(m.memory, memoAt, 128);
  if (!(memo instanceof Uint8Array)) return "panic"; // the memo isn't readable
  const sender = a.accounts.get(a.id)!;
  const receiver = a.accounts.get(Number(dest));
  if (!receiver) return setTo(m, WHO);
  if (gas < receiver.info.min_memo_gas) return setTo(m, LOW);
  const balance = sender.info.balance - amount;
  if (balance < minimumBalance(sender.info)) return setTo(m, CASH);
  if (!charge(m, gas)) return "oog";
  sender.info = { ...sender.info, balance };
  outbox.transfers.push({ source: a.id, dest: Number(dest), amount, memo, gas });
  return setTo(m, OK);
}
```

`charge` takes the transfer's gas only once the transfer is sure to go: a refusal costs
just the 575. `balance` is a `bigint`, so paying too much simply makes it negative, which
is below any minimum: one check covers both.

Then four small changes, so the outbox goes where it should. The host gets it, and
answers call 21:

**Replace in** `src/host.ts`

```ts
/**
 * F (GP App. B.4): the host for a service's accumulation. So far it answers gas, grow_heap,
 * fetch (whose items are the constants, 0; the entropy, 1; and the inputs, all of them, 14,
 * or one, 15), info, lookup, read, write, checkpoint, query, solicit and forget, the last
 * two at `slot`, the time of the block, and transfer, into `outbox`. Anything else: WHAT.
 */
export function accumulateHost(
  config: Config,
  a: Accumulation,
  slot: number,
  outbox: Outbox = { transfers: [], kept: [] },
): Host {
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
        return checkpoint(m, a, outbox);
      case "query":
        return query(m, a);
      case "solicit":
        return solicit(m, a, slot);
      case "forget":
        return forget(m, a, slot, config.expunge_period);
      case "transfer":
        return transfer(m, a, outbox);
      default:
        return unknown(m);
    }
  };
}
```

A checkpoint saves it:

**Replace in** `src/host.ts`

```ts
/** checkpoint (GP App. B.7, Ω_C): what the service has done so far is kept if it fails later. */
export function checkpoint(
  m: Machine,
  a: Accumulation,
  outbox: Outbox = { transfers: [], kept: [] },
): HostExit {
  if (!charge(m, 103)) return "oog";
  a.checkpoint = copyAccounts(a.accounts); // Y′ = X
  outbox.kept = [...outbox.transfers]; // the transfers sent so far, too
  m.registers[7] = m.gas;
  return "continue";
}
```

And the run hands back what it sent, after the collapse:

**Replace in** `src/host.ts`

```ts
/** What an accumulation leaves: how it ended, the accounts after it, the gas it used, and
 * the transfers it sent. */
export type Accumulated = {
  exit: Exit;
  accounts: Map<number, Account>;
  gasUsed: bigint;
  transfers: Transfer[];
};
```

**Replace in** `src/host.ts`

```ts
/**
 * Ψ_A (GP App. B.4), so far: runs service a.id's accumulation at `slot` on `gas`, through
 * accumulation's host, and collapses what it did, the transfers it sent included. `watch`,
 * if given, sees each host call.
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
  const host = accumulateHost(config, a, slot, outbox);
  const exit = runWithHost(machine, (call, m) => {
    const answer = host(call, m);
    watch?.(call, m);
    return answer;
  });
  const gasUsed = gas - (machine.gas > 0n ? machine.gas : 0n); // u = g − max(ϱ′, 0)
  return { exit, accounts: collapse(a, exit), gasUsed, transfers: collapseTransfers(outbox, exit) };
}
```

Every run starts with an empty outbox, like the Gray Paper's context does. The `= { ...
}` after the outbox parameters is a *default*: a caller that has no outbox, such as an
older test, gets an empty one.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ transfer_for_live_service-1: service 0 ends as the vector says (118.6ms)
...
✔ a gift: service 0 sends service 1 a hundred, with a memo (65.6ms)
...
✔ the reported packages: each one's hash and exports root, sorted by hash (249.3ms)
...
✔ transfer: the money leaves at once, and a checkpoint keeps what was sent (0.2ms)
✔ transfer refuses: no such service, too little gas, too little money (0.2ms)
...
ℹ tests 534
ℹ suites 0
ℹ pass 534
ℹ fail 0
...
reported 534 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791738822352
...
```

## Watch it

`bin/host.ts` only ran service 1729. Now it takes a vector and a service:

**Rewrite** `bin/host.ts`

```ts
// Runs a real service's accumulation, Ψ_A, and shows every host call it makes, the answer
// it gets, and the transfers it sends. The service, its inputs and its gas come from an
// accumulate test vector: service 1729 of always_accumulate-1 if you don't say.
// Usage: npm run host [vector] [service]

import { readFileSync } from "node:fs";
import { serviceInputs } from "../src/accumulate.ts";
import { fromHex } from "../src/bytes.ts";
import { TINY } from "../src/config.ts";
import { accumulate, HOST_CALLS, NONE, WHAT } from "../src/host.ts";
import { Run } from "../src/obs.ts";
import { unpackCode } from "../src/pvm/program.ts";
import type { AccountJson } from "../src/services.ts";
import { accountFromJson, copyAccounts } from "../src/services.ts";
import { WorkReport } from "../src/work.ts";

const file = process.argv[2] ?? "../vectors/stf/accumulate/tiny/always_accumulate-1.json";
const s = Number(process.argv[3] ?? 1729);
const vector = JSON.parse(readFileSync(file, "utf8"));
const pre = vector.pre_state;
const json: { id: number; data: AccountJson }[] = pre.accounts;
const accounts = new Map(json.map((x) => [x.id, accountFromJson(x.data)]));
const data = pre.accounts.find((x: { id: number }) => x.id === s).data;
const blobs: { hash: string; blob: string }[] = data.preimage_blobs;
const preimage = blobs.find((p) => p.hash === data.service.code_hash)!; // its code
const reports = vector.input.reports.map((r: unknown) => WorkReport.fromJson(r));
const free = pre.privileges.always_acc.find((x: { id: number }) => x.id === s)?.gas ?? 0;
const { inputs, gas } = serviceInputs(reports, s, BigInt(free));
const a = {
  id: s,
  accounts,
  checkpoint: copyAccounts(accounts),
  code: unpackCode(fromHex(preimage.blob)),
  entropy: fromHex(pre.entropy),
  inputs,
};

const run = new Run("host");
const result = accumulate(TINY, a, vector.input.slot, gas, (call, m) => {
  const name = HOST_CALLS[call] ?? (call === 100 ? "log, from JIP-1" : "?");
  const r7 = m.registers[7];
  const said = r7 === WHAT ? "WHAT" : r7 === NONE ? "NONE" : String(r7);
  console.log(`host call ${call} (${name}): φ₇ = ${said}, ${m.gas} gas left`);
  run.event("call", { call, name, said, gas: Number(m.gas) });
});
for (const t of result.transfers) {
  const memo = new TextDecoder().decode(t.memo).replace(/\0+$/, ""); // without trailing zeros
  console.log(`sent ${t.amount} to service ${t.dest}, with ${t.gas} gas and the memo "${memo}"`);
  run.event("sent", { dest: t.dest, amount: Number(t.amount), gas: Number(t.gas), memo });
}
const expected = vector.post_state.statistics.find((x: { id: number }) => x.id === s);
console.log(`the service stops: ${JSON.stringify(result.exit)}, using ${result.gasUsed} gas`);
console.log(`the test vector says: ${expected.record.accumulate_gas_used}`);
run.event("stop", { exit: JSON.stringify(result.exit), used: Number(result.gasUsed) });
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

**What flows through it.** The vector hands service 0 one work result whose output is its
order: send service 1 a hundred, with 80,000 gas and a memo.

::: code-group

```json [what goes in]
{
  "input": {
    "slot": 43,
    "reports": [ { "results": [ {
      "service_id": 0,
      "accumulate_gas": 400000,
      "result": { "ok": "0x0102010000006400000000000000803801000000000067696674…" }
    } ] } ]
  },
  "pre_state": { "accounts": [
    { "id": 0, "data": { "service": { "code_hash": "0xdd0eb77dee…", "balance": 227714 } } },
    { "id": 1, "data": { "service": { "balance": 227714 } } }
  ] }
}
```

```ts [what it computes]
// bin/host.ts's values for service 0's run, and the one transfer it leaves behind
const computed = {
  service: 0, // s, the second argument
  inputs: 1, // one operand: the report's result for service 0
  gas: 400_000n, // its accumulate_gas; service 0 has no free gas
  transfer: { // host call 21, read from the registers
    dest: 1, // φ₇, from the output's bytes 01000000
    amount: 100n, // φ₈, from 6400000000000000
    gas: 80_000n, // φ₉, from 8038010000000000
    memo: "gift", // the 128 bytes at φ₁₀: 67696674, then zeros
  },
  answer: 0n, // φ₇ after the call: OK
  balance: 227_614n, // service 0's, 227,714 − 100: the money leaves now
  gasUsed: 255_437n, // the 80,000 handed to the receiver included
};
```

```text [what comes out]
host call 21 (transfer): φ₇ = 0, 188133 gas left
sent 100 to service 1, with 80000 gas and the memo "gift"
the service stops: "halt", using 255437 gas
the test vector says: 255437
```

:::

Service 0 finds its order in the work result's output bytes, loads it into φ₇ to φ₁₀ and
calls `transfer`, which answers `OK`, takes the 100 from its balance and puts the transfer on
the run's list.

**Run**

```sh
npm pkg set scripts.host-transfer="node bin/host.ts ../vectors/stf/accumulate/tiny/transfer_for_live_service-1.json 0"
npm run host-transfer
```

```text
host call 2 (fetch): φ₇ = 122, 399367 gas left
...
host call 21 (transfer): φ₇ = 0, 188133 gas left
host call 1 (grow_heap): φ₇ = 51, 181528 gas left
host call 1 (grow_heap): φ₇ = 51, 177844 gas left
host call 100 (log, from JIP-1): φ₇ = WHAT, 159107 gas left
host call 5 (write): φ₇ = 1, 148562 gas left
sent 100 to service 1, with 80000 gas and the memo "gift"
the service stops: "halt", using 255437 gas
the test vector says: 255437
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=host-1791738827853
```

It stops having used exactly the vector's gas, the transfer's 80,000 included. Service 1's
balance hasn't moved yet: that's [lesson 17.4](./04-rounds.md). The *Host calls* panel, on
**7 · Accumulation and import**, shows the call and the transfer.

![Host calls panel](./images/03-host-calls.png)

<details>
<summary>lasair: the CASH check, in <code>lib/pvm_host.ml</code></summary>

```ocaml
        (* Check source has sufficient balance *)
        else if Int64.unsigned_compare ctx.service.balance amount < 0
                || Int64.unsigned_compare (Int64.sub ctx.service.balance amount)
                     (service_threshold ctx.service) < 0 then begin
          let regs' = set_reg regs 7 result_cash in
```

Two checks where yours has one. lasair keeps balances in OCaml's 64-bit `int64`, where
taking 100 from 30 gives −70, which read as unsigned is a huge number. So it first asks
whether the amount is more than the balance at all. And `unsigned_compare` is [lesson 1.2](../01-bytes-and-numbers/02-numbers.md)'s
trap again: from 2^63 up, an `int64` looks negative. A `bigint` has neither problem.

</details>

## Check your understanding

::: check
**Service 0 sends service 1 a hundred, the gift. When does service 1's balance grow?**

- [ ] At once, when `transfer` answers `OK`
  > No: only the sender's balance changes then. In the test, service 1 still has its
  > 1,000 right after the call.
- [x] In a later round of the same block, when service 1 accumulates
  > Yes: the money leaves service 0 now and arrives in the next round:
  > [lesson 17.4](./04-rounds.md) delivers it.
- [ ] In the next block
  > No: it doesn't wait that long. A transfer arrives in the block it was sent in, a
  > round later.

**The gift carries 80,000 gas, for service 1 to handle it with. Who pays that gas?**

- [x] Service 0, out of its own run's gas, when it sends the gift
  > Yes: the call costs 575, plus the transfer's gas. Service 0's 255,437 gas includes
  > the 80,000.
- [ ] Service 1, out of the gas of its own digests
  > No: service 1 has no digests in that block. The transfer brings its own gas.
- [ ] Service 1's balance, when the gift arrives
  > No: gas and balance are different things. The gas was paid in gas, by the sender,
  > up front.

**Service 0 sends service 1 thirty, then panics, with no checkpoint since. What's left of the transfer?**

- [ ] Service 1 still gets 30: money once sent can't be called back
  > No: nothing was delivered yet, and the panic undoes the sending. The list of
  > transfers is part of what a checkpoint keeps.
- [ ] The 30 is gone from service 0, but never arrives
  > No: the balance change is undone too. Service 0's account goes back to the last
  > checkpoint's, the 30 included.
- [x] Nothing: it never happened, the money included
  > Yes: a panic keeps only what the last checkpoint kept, and both the transfer and
  > the balance change came after it.

**A service has more than enough balance to cover a transfer, and `transfer` still answers `CASH`. Why?**

- [ ] The gas it sent along is below the least the receiver asks for
  > No: that refusal is `LOW`. `CASH` is about the sender's balance, not the gas.
- [x] Paying would leave it below its own minimum balance
  > Yes: in the test, service 0 has 1,000 and must keep 170, so sending 900 would leave
  > 100. Nothing is sent, and the refusal costs just the 575.
- [ ] The receiver would end up above the most a service may hold
  > No: the checks never look at the receiver's balance. They ask whether the receiver
  > exists (`WHO`), whether the gas is enough (`LOW`), and what the sender would have left.
:::

## What you have

Services that pay each other: the money leaves at once, with gas paid up front for the
receiver, and a failure takes it back. Eight official service runs that send transfers
match their vectors. The money has left. It hasn't arrived.
[Lesson 17.4](./04-rounds.md) delivers it, in a second round.

Next: [17.4 Rounds](./04-rounds.md)
