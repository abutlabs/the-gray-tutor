# Calling the host

Since [lesson 15.8](../15-the-pvm/08-a-real-program.md), your machine stops at `ecalli`, the program's way of asking the
outside world for something, and that's where the story ended. A real service asks all
the time: how much gas is left? What work came in? What's in my storage? This lesson
gives the machine a host that answers, so it can carry on. It answers just one question,
for now.

## New words

- **Host call.** A program asking the client running it for something it can't do alone:
  the gas left, an input, a storage read. *Example:* `ecalli 0`, "how much gas is left?".

It's in the [glossary](../glossary.md).

## What the Gray Paper says

**Ψ_H** (App. A.6) runs the machine, and on each *host call* h hands the machine to a host
function. The host answers by changing the gas, the registers or the memory, and then
either the machine carries on, at the instruction after the `ecalli`, or it stops: halt,
panic, or out of gas.

App. B sets the rules every host call follows:

- **Each one costs gas**, its g, taken before anything else. If that's more than is left,
  the machine is out of gas and nothing else happens.
- **The answer mostly comes back in φ₇.** Some values right at the top of the 64-bit
  range mean trouble (App. B.1): NONE is 2^64 − 1, "no such item", and WHAT is
  2^64 − 2, "no such host call". OK is 0.
- **There are 28 host calls**, numbered from `gas` (0) to `provide` (27). Accumulation's
  host function F (App. B.4) knows 20 of them (refine's own, 7 to 14, aren't among them),
  and answers anything else with WHAT, for 1,000 gas.

The first and simplest is **`gas`** (App. B.5, Ω_G): φ₇ becomes the gas left, after paying
48 to ask.

Step a host call through, start to finish:

<HostCall />

## The tests

**New file** `test/host.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import type { Host } from "../src/host.ts";
import { gas, HOST_CALLS, runWithHost, unknown, WHAT } from "../src/host.ts";
import { HALT_ADDRESS, newMachine } from "../src/pvm/machine.ts";
import { assemble } from "../src/pvm/program.ts";
import type { Exit, Machine } from "../src/pvm/machine.ts";

/** A host that answers gas, and nothing else. */
const host: Host = (call, m) => (HOST_CALLS[call] === "gas" ? gas(m) : unknown(m));

/** ecalli `call`, then return through r0: one basic block, costing 100 gas. */
const calling = (call: number, budget: bigint) =>
  newMachine(assemble([[10, call], [50, 0x00]]), [HALT_ADDRESS], new Map(), budget);

test("gas: the program asks how much is left, pays 48 to ask, and carries on", () => {
  const machine: Machine = calling(0, 1000n);
  const exit: Exit = runWithHost(machine, host);
  assert.equal(exit, "halt"); // the return after the ecalli ran
  assert.equal(machine.registers[7], 1000n - 100n - 48n); // the block, then the question
});

test("a host call nobody knows: WHAT, for 1,000 gas", () => {
  const machine: Machine = calling(99, 2000n);
  const exit: Exit = runWithHost(machine, host);
  assert.equal(exit, "halt");
  assert.deepEqual([machine.registers[7], machine.gas], [WHAT, 900n]);
});

test("too poor to ask: a host call can run out of gas too", () => {
  const machine: Machine = calling(0, 147n); // 100 for the block leaves 47, and gas costs 48
  const exit: Exit = runWithHost(machine, host);
  assert.equal(exit, "oog");
  assert.equal(machine.registers[7], 0n); // no answer
});

test("28 host calls, numbered as in the GP: fetch is 2, provide 27", () => {
  const fetch: string = HOST_CALLS[2];
  const provide: string = HOST_CALLS[27];
  assert.deepEqual([fetch, provide, HOST_CALLS.length], ["fetch", "provide", 28]);
});
```

A tiny program: one `ecalli`, then a return through r0. Both are in one basic block,
which costs 100 (the `ecalli`'s 100 cycles, from [lesson 15.9](../15-the-pvm/09-what-instructions-cost.md)). So with 1,000 gas, the
block leaves 900, and asking leaves 852.

## The code

**New file** `src/host.ts`

```ts
// Host calls (GP App. A.6 and B): when a program says ecalli, the machine stops, the host
// answers (in registers, memory and gas), and the machine carries on after the ecalli.

import type { Exit, Machine } from "./pvm/machine.ts";
import { runWithGas } from "./pvm/gas.ts";
import { skip } from "./pvm/instructions.ts";

/** The answers a host call can give in φ₇ when it can't do what was asked (GP App. B.1). */
export const NONE = 2n ** 64n - 1n; // no such item
export const WHAT = 2n ** 64n - 2n; // no such host call
export const OK = 0n;

/** The host calls, by number (GP App. B.5 and B.7): gas is 0, fetch is 2, provide 27. */
export const HOST_CALLS = [
  "gas", "grow_heap", "fetch", "lookup", "read", "write", "info", "historical_lookup",
  "export", "machine", "peek", "poke", "pages", "invoke", "expunge", "bless", "assign",
  "designate", "checkpoint", "new", "upgrade", "transfer", "eject", "query", "solicit",
  "forget", "yield", "provide",
];

/** How a host call ends: carry on, or stop the machine for good. */
export type HostExit = "continue" | "halt" | "panic" | "oog";

/** A host: answers host call number `call` by changing the machine. */
export type Host = (call: number, m: Machine) => HostExit;

/**
 * Ψ_H (GP App. A.6): runs the machine, and every time it calls the host, lets the host
 * answer and carries on after the ecalli. Stops when the machine or the host says so.
 */
export function runWithHost(m: Machine, host: Host): Exit {
  for (;;) {
    const exit = runWithGas(m);
    if (typeof exit !== "object" || !("host" in exit)) return exit;
    const answer = host(exit.host, m);
    if (answer !== "continue") return answer;
    m.pc += 1 + skip(m.program, m.pc); // ı″ = ı′ + 1 + skip(ı′): the one after the ecalli
  }
}

/** Every host call costs gas: g is taken first, and if that leaves too little, oog. */
export function charge(m: Machine, g: number): boolean {
  m.gas -= BigInt(g);
  return m.gas >= 0n;
}

/** gas (GP App. B.5, Ω_G): φ₇ = the gas left, after paying 48 to ask. */
export function gas(m: Machine): HostExit {
  if (!charge(m, 48)) return "oog";
  m.registers[7] = m.gas;
  return "continue";
}

/** A host call nobody knows (GP App. B.4, the end of F): φ₇ = WHAT, for 1,000 gas. */
export function unknown(m: Machine): HostExit {
  m.registers[7] = WHAT;
  return charge(m, 1000) ? "continue" : "oog";
}
```

`runWithHost` is Ψ_H: [lesson 15.11](../15-the-pvm/11-the-gas-meter.md)'s `runWithGas` until a host call, the host's answer,
and on again. The machine is still on the `ecalli` when it stops ([lesson 15.8](../15-the-pvm/08-a-real-program.md)), so carrying
on means stepping past it, exactly as the Gray Paper's ı″ says. A `Host` is a plain
function, so each invocation can bring its own; the tests' host knows `gas` and nothing
else.

`charge` takes the gas first and asks questions afterwards. If that leaves the gas below
zero, it's out of gas. (The Gray Paper's gas can dip below zero here, to say by how much
it ran out.)

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ the reported packages: each one's hash and exports root, sorted by hash (339.5ms)
...
✔ gas: the program asks how much is left, pays 48 to ask, and carries on (1.9ms)
✔ a host call nobody knows: WHAT, for 1,000 gas (0.8ms)
✔ too poor to ask: a host call can run out of gas too (0.2ms)
✔ 28 host calls, numbered as in the GP: fetch is 2, provide 27 (0.1ms)
...
ℹ tests 450
ℹ suites 0
ℹ pass 450
ℹ fail 0
...
reported 450 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791738006180
...
```

## Watch it

**New file** `bin/host.ts`

```ts
// Runs a real service's accumulation with a host that only knows the gas host call, and
// shows every host call it makes and the answer it gets. The service, 1729, comes from the
// accumulate test vector always_accumulate-1, with the 100,000 gas the vector gives it.
// Usage: npm run host

import { readFileSync } from "node:fs";
import { fromHex } from "../src/bytes.ts";
import { encodeNatural } from "../src/codec/numbers.ts";
import type { Host } from "../src/host.ts";
import { gas, HOST_CALLS, runWithHost, unknown } from "../src/host.ts";
import { Run } from "../src/obs.ts";
import { newMachine } from "../src/pvm/machine.ts";
import { deblob, unpackCode } from "../src/pvm/program.ts";
import { standardProgram } from "../src/pvm/standard.ts";

const file = "../vectors/stf/accumulate/tiny/always_accumulate-1.json";
const vector = JSON.parse(readFileSync(file, "utf8"));
const account = vector.pre_state.accounts[0]; // service 1729
const blobs: { hash: string; blob: string }[] = account.data.preimage_blobs;
const preimage = blobs.find((p) => p.hash === account.data.service.code_hash)!; // its code
const code = unpackCode(fromHex(preimage.blob));

// Accumulation's arguments: the slot, the service, and how many inputs (none here).
const [t, s] = [BigInt(vector.input.slot), BigInt(account.id)];
const args = Uint8Array.from([...encodeNatural(t), ...encodeNatural(s), ...encodeNatural(0n)]);
const { memory, registers } = standardProgram(code, args);
const machine = newMachine(deblob(code.program), registers, memory, 100_000n);
machine.pc = 5; // accumulation

const run = new Run("host");
const host: Host = (call, m) => {
  const name = HOST_CALLS[call] ?? "?";
  const answer = name === "gas" ? gas(m) : unknown(m);
  const said = name === "gas" ? `${m.registers[7]} gas left` : "WHAT";
  console.log(`host call ${call} (${name}): ${said}, ${m.gas} gas left`);
  run.event("call", { call, name, said, gas: Number(m.gas) });
  return answer;
};
const exit = runWithHost(machine, host);
console.log(`the service stops: ${JSON.stringify(exit)}, with ${machine.gas} gas left`);
run.event("stop", { exit: JSON.stringify(exit), gas: Number(machine.gas) });
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

**What flows through it.** One run, three faces — the vector going in, what the program
builds from it, the lines the terminal prints:

::: code-group

```json [what goes in]
{
  "input": { "slot": 43, "reports": [] },
  "pre_state": { "accounts": [ {
    "id": 1729,
    "data": {
      "service": { "code_hash": "0xfd3f1355…" },
      "preimage_blobs": [ { "hash": "0xfd3f1355…", "blob": "… 19,049 bytes of code …" } ]
    }
  } ] }
}
```

```ts [what it computes]
// bin/host.ts's values, once the service's code is found and the machine built
const computed = {
  service: 1729n, // s, the account's id, one of accumulate's arguments
  slot: 43n, // t, input.slot, another
  inputs: 0n, // and the third: no operands or transfers are handed over
  codeBytes: 19_049, // the blob whose hash is the account's code_hash
  gas: 100_000n, // the always-accumulate gas the vector grants 1729
  entry: 5, // machine.pc: accumulation's entry point
};
```

```text [what comes out]
host call 2 (fetch): WHAT, 98757 gas left
the service stops: "panic", with 98733 gas left
```

:::

Read the input into the output: the account's `code_hash` picks the 19,049-byte blob out
of its own `preimage_blobs` (same hash — a service holds its code as a preimage of
itself), `slot` and `id` become the argument bytes, and the machine starts with the
100,000 gas. The output's one host call is number 2, `fetch` — which this lesson's host
doesn't know, so WHAT — and the service, refused, panics with 98,733 gas unspent.

**Run**

```sh
npm pkg set scripts.host="node bin/host.ts"
npm run host
```

```text
host call 2 (fetch): WHAT, 98757 gas left
the service stops: "panic", with 98733 gas left
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=host-1791738012768
```

A real service this time: 1729, from the accumulate test vectors. Its very first host call
is `fetch`, asking for item 0, the chain's protocol constants ([lesson 15.8](../15-the-pvm/08-a-real-program.md)'s bootstrap
service asked the same). Your host has never heard of `fetch`: WHAT. And the service,
unable to learn the rules of the chain it's running on, gives up and panics. Fair enough.
The *Host calls* panel, on the **7 · Accumulation and import** dashboard (where all of [Part 16](./index.md)'s
panels are), has the conversation, short as it is. `fetch` is next.

![Host calls panel](./images/01-host-calls.png)

<details>
<summary>lasair: the <code>log</code> host call, in <code>lib/pvm_host.ml</code></summary>

```ocaml
(** Host call 100: log (JIP-1). GP 0.8.0 has no log host call, so it behaves as an
    unknown one: Cgas-unknown = 1000 (jam-test-vectors traces/README: "charged as an
    unknown host call: 1000 gas"), r7 = WHAT, no side effects. Input: r7 = level,
    r8-r9 = target range (unused), r10-r11 = message range.
```

JIP-1, a proposal JAM implementers share, adds a `log` host call, number 100, for
services to print messages. The Gray Paper has no such call, so it's an unknown one: WHAT,
for 1,000 gas, and the test vectors' README says the same. lasair keeps a separate function for it only so that,
when debugging, it can print the message before saying WHAT.

</details>

## Check your understanding

::: check
**The program reaches `ecalli 0`. What happens next?**

- [ ] It jumps to a routine inside the program that works out the gas
  > No: the program can't see its own gas. The host is the client running it, outside the
  > program, and only the host can answer.
- [x] The machine stops, the host answers by changing the gas, registers or memory, and the machine carries on after the `ecalli`
  > Yes: that's Ψ_H. The machine stops still on the `ecalli`, so carrying on means stepping
  > past it, to the return in the test.
- [ ] The machine halts for good, with the answer as the program's result
  > No: halting is one way a host call can end, but `gas` says carry on. In the test, the
  > return after the `ecalli` still runs.

**The test program starts with 1,000 gas and asks `gas`. Why is φ₇ 852, not 900?**

- [ ] The host reads the gas before paying for the question
  > No: a host call's price is taken before anything else. φ₇ is the gas after paying 48.
- [ ] Asking costs 148
  > No: `gas` costs 48. The other 100 isn't the host call's at all.
- [x] The block's 100 is paid first, then the question's 48: 1,000 − 100 − 48 = 852
  > Yes: the `ecalli` and the return are one basic block, paid for as it starts. Then the
  > host call takes its own 48, and φ₇ reports what's left.

**A program makes host call 99, which nobody knows. What does it get?**

- [ ] A panic: the machine stops
  > No: an unknown host call isn't a reason to stop. The machine carries on, a little
  > poorer.
- [x] φ₇ = WHAT, for 1,000 gas, and the machine carries on
  > Yes: with 2,000 gas, the block takes 100 and WHAT 1,000, leaving 900, and the program
  > halts normally after.
- [ ] φ₇ = NONE
  > No: NONE, 2^64 − 1, is "no such item", from a host call that exists. "No such host
  > call" is WHAT, 2^64 − 2.

**With 147 gas, the program asks `gas`. Why does it run out, with φ₇ still 0?**

- [x] The block leaves 47, and asking costs 48, taken first: out of gas, and no answer
  > Yes: once the charge leaves the gas below zero, nothing else happens. φ₇ is never
  > written.
- [ ] The host answers first and is paid after, so the answer is lost
  > No: the host is paid first, always. There never was an answer.
- [ ] φ₇ = 0 is the host's way of saying "no gas left"
  > No: φ₇ was 0 before the call too. It's the gas counter that dips below zero, to say by
  > how much it ran out.
:::

## What you have

A machine that can ask, and a host that answers. One question so far: how much gas is
left? The service you watched wanted something else first, `fetch`, and [lesson 16.2](./02-fetch.md)
answers it.

Next: [16.2 Fetch](./02-fetch.md)
