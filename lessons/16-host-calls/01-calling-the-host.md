# Calling the host

**In one sentence:** a program in the machine can't reach outside it, so it stops and asks
the client running it, which answers and lets it carry on.

Here is a tiny program that asks one question. Pick a run and step it through: the
machine stops, the question is paid for, and the answer lands in a register.

<a id="try-it"></a>

<HostCall />

## The idea

A program in the PVM is shut in a room with no windows. It has its registers, its memory,
and nothing else. But a real service needs things from outside all the time. How much gas
is left? What work came in? What's in my storage?

So the room has a bell. The program rings it with one instruction, `ecalli`, and a number
that says which question it is asking. That is a [*host call*](../glossary.md#host-call).
Since [lesson 15.8](../15-the-pvm/08-a-real-program.md), your machine stops there, and that's where the story ended.

Now someone answers. The host is your client, the program running the machine. The
machine stops, your client does the work, writes the answer into a register, and the
machine carries on at the next instruction.

Two rules hold for every call. The answer is the same on every validator. And every
question has a price in gas, taken before anything else.

This lesson builds the host and teaches it one question: how much gas is left?

## What the Gray Paper says

::: gray-paper B.1

#### Appendix B.1 Host-Call Result Constants {#gp-B-1}

<a id="gp-B-1-p1"></a>

- **$\mathtt{NONE} = 2^{64} - 1$** The return value indicating an item does not exist.
- **$\mathtt{WHAT} = 2^{64} - 2$** Name unknown.
- **$\mathtt{OOB} = 2^{64} - 3$** The inner PVM memory index provided for reading/writing is not accessible.
- **$\mathtt{WHO} = 2^{64} - 4$** Index unknown.
- **$\mathtt{FULL} = 2^{64} - 5$** Storage full or resource already allocated.
- **$\mathtt{CORE} = 2^{64} - 6$** Core index unknown.
- **$\mathtt{CASH} = 2^{64} - 7$** Insufficient funds.
- **$\mathtt{LOW} = 2^{64} - 8$** Gas limit too low.
- **$\mathtt{HUH} = 2^{64} - 9$** The operation is invalid. For example, the item is already solicited, cannot be forgotten, or the service is insufficiently privileged.
- **$\mathtt{OK} = 0$** The return value indicating general success.

<a id="gp-B-1-p2"></a>Inner PVM invocations have their own set of result codes:

<a id="gp-B-1-p3"></a>

- **$\mathtt{HALT} = 0$** The <abbr class="gp-term" title="one run of code in the PVM: Is-Authorized, refine or accumulate">invocation</abbr> completed and halted normally.
- **$\mathtt{PANIC} = 1$** The invocation completed with a panic.
- **$\mathtt{FAULT} = 2$** The invocation completed with a page fault.
- **$\mathtt{HOST} = 3$** The invocation completed with a host-call fault.
- **$\mathtt{OOG} = 4$** The invocation completed by running out of gas.

<a id="gp-B-1-p4"></a>Note return codes for a host-call-request exit are any non-zero value less than $2^{64} - 13$.

:::

::: gray-paper B.5 1-5

#### Appendix B.5 General Functions {#gp-B-5}

<a id="gp-B-5-p1"></a>We come now to defining the host functions which are utilized by the PVM invocations. Generally, these map some PVM state, including invocation context, possibly together with some additional parameters, to a new PVM state.

<a id="gp-B-5-p2"></a>The general functions are all broadly of the form $\left(\varrho' \in \mathbb{Z}_G, \varphi' \in \left[\!\left[\mathbb{N}_R\right]\!\right]_{13}, \mu' \in \mathbb{M}\right) = \Omega_\square(\varrho \in \mathbb{N}_G, \varphi \in \left[\!\left[\mathbb{N}_R\right]\!\right]_{13}, \mu \in \mathbb{M})$. Functions which have a result component which is equivalent to the corresponding argument may have said components elided in the description. Functions may also depend upon particular additional parameters.

<a id="gp-B-5-p3"></a>Unlike the Accumulate functions in appendix [B.7](./09-asking-for-preimages.md#gp-B-7-p1), these do not mutate an accumulation context. Some, such as $\mathtt{write}$ mutate a service account and both accept and return some $\mathbf{s} \in \mathbb{A}$. Others are more general functions, such as $\mathtt{fetch}$ and do not assume any context but have a parameter list suffixed with an ellipsis to denote that the context parameter may be taken and is provided transparently into its result. This allows it to be easily utilized in multiple PVM invocations.

<a id="gp-B-5-p4"></a>Elements of PVM state are each assumed to remain unchanged by the host-call unless explicitly specified.

<a id="gp-B-5-p5"></a><a id="eq-B-15"></a><a id="eq-B-16"></a>

$$
\begin{align}
\varrho' &\equiv \varrho - g\text{ unless $\varrho'$ is explicitly defined below} \tag{B.15} \\
\left(\varepsilon', \varphi', \mu', \mathbf{s}'\right) &\equiv \begin{cases}
\left(\infty, \varphi, \mu, \mathbf{s}\right) &\text{if } \varrho < g\\
\left(\blacktriangleright, \varphi, \mu, \mathbf{s}\right) \text{ except as indicated below} &\text{otherwise}
\end{cases} \tag{B.16}
\end{align}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-gascounter" class="gk-wrap">$\varrho$</span> | rho (curly) | the gas left |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-execst" class="gk-wrap">$\varepsilon$</span> | epsilon | how the machine goes on after a host call: carry on (▸), halt, panic or out of gas |
| <span id="gk-registers" class="gk-wrap">$\varphi$</span> | phi (curly) | the PVM's 13 registers |
| <span id="gk-memory" class="gk-wrap">$\mu$</span> | mu | the PVM's memory |
| <span id="gk-oog" class="gk-wrap">$\infty$</span> | out of gas | ∞: the program ran out of gas |
| <span id="gk-continue" class="gk-wrap">$\blacktriangleright$</span> | continue | ▸: the step went normally, and the next one may run |

</details>

→ [(B.15), (B.16) explained](./gray-paper.md#ex-B-15)

:::

The bell and its answer have a name, **Ψ_H** (App. A.6). It runs the machine, and on each
host call h hands the machine to a host function. The host answers by changing the gas, the registers or the
memory, and then either the machine carries on, at the instruction after the `ecalli`, or
it stops: halt, panic, or out of gas.

App. B sets the rules every host call follows:

- **Each one costs gas**, its g, taken before anything else (B.15). If that's more than is
  left, the machine is out of gas and nothing else happens (B.16): no answer, no change.
- **What a call doesn't say it changes stays as it was.** That's why each host call's row
  in the paper lists only what changes.
- **The answer mostly comes back in φ₇.** B.1's first list is the values right at the top
  of the 64-bit range that mean trouble: NONE is 2^64 − 1, "no such item", and WHAT is
  2^64 − 2, "no such host call", and seven more "no"s count down from there to HUH,
  2^64 − 9. Later lessons meet them one at a time. OK is 0. The second list, HALT to OOG,
  is how refine's machines-inside-a-machine report back, and a block importer never runs
  those.
- **There are 28 host calls**, numbered from `gas` (0) to `provide` (27). Accumulation's
  host function F (App. B.4) knows 20 of them (refine's own, 7 to 14, aren't among them),
  and answers anything else with WHAT, for 1,000 gas.

The first and simplest is **`gas`** (App. B.5, Ω_G): φ₇ becomes the gas left, after paying
48 to ask. Its row, and every other host call's, is in the paper's three big tables, each
explained call by call in [16.A](./gray-paper.md#b-5-s-table-the-general-host-calls).

[The widget at the top](#try-it) steps a host call through, start to finish: a `gas`
that is answered, a call nobody knows, and a `gas` the program is too poor to ask.

**Try it in the [playground](../pvm-playground.md).** Press **Asking the host**, then **Step**. The block's price and the host call's 48 both come off the gas, and the answer lands in φ7.

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

What flows through it:

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
service asked the same). Your host has never heard of `fetch`: WHAT. The service can't
learn the rules of the chain it's running on, so it gives up and panics. Fair enough.
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
  > past it, to the next instruction.
- [ ] The machine halts for good, with the answer as the program's result
  > No: halting is one way a host call can end, but `gas` says carry on. In the test, the
  > return after the `ecalli` still runs.

**Who is the host, and where does it run?**

- [ ] A server the service keeps off the chain, which the machine calls over the network
  > No: nothing leaves the node. The machine stops, and the client running it answers.
- [ ] A routine inside the program, shipped with the service's code
  > No: the program can't reach outside the machine, and that is why it asks. The host is
  > outside the program.
- [x] The client running the machine, yours included, giving the same answer on every validator
  > Yes: the machine stops, your client does the work and writes the answer into a
  > register. Every validator's client must answer alike.

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

**A program has less gas left than a host call costs, and makes the call anyway. What does it get?**

- [x] Nothing: the price is taken first, the machine is out of gas, and no answer is written
  > Yes: once the charge leaves the gas below zero, nothing else happens. No answer, no
  > change.
- [ ] The answer, and then it runs out: the host is paid after it has done the work
  > No: the host is paid first, always. There never was an answer.
- [ ] An error value in φ₇, and the machine carries on
  > No: B.1's values, NONE to HUH, are answers, and an answer has to be paid for. Out of
  > gas stops the machine.
:::

## What you have

A machine that can ask, and a host that answers. One question so far: how much gas is
left? The service you watched wanted something else first, `fetch`, and [lesson 16.2](./02-fetch.md)
answers it.

Next: [16.2 Fetch](./02-fetch.md)
