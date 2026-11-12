# Asking for preimages

**In one sentence:** a service gets the chain to keep a piece of data by asking for it by
hash and length, can check how the asking is going, and can give it up, paying deposit
for as long as the request lasts.

Here is one request. Walk it through its life: ask, provide, forget, wait, ask again, and
watch its history change at each step.

<a id="try-it"></a>

<RequestLife />

## The idea

[Lesson 16.8](./08-lookup.md)'s `lookup` reads the preimages a service already has. But how does a preimage
get there? The service *asks* for it.

It files a [*request*](../glossary.md#request): "I want the data with this hash, this
many bytes long". It is like ordering a book by its catalogue number. Later a block
provides the data ([lesson 14.1](../14-services/01-providing-preimages.md)). Later still the service may let it go.

The chain keeps a short history for each request: when it was provided, when it was
forgotten, when it was asked for again. So a preimage has a life: asked for, provided,
forgotten, and after a waiting period, gone. A request holds deposit while it lasts.

A running service steers that life with three host calls: `solicit` to ask, `query` to
see how the asking is going, and `forget` to give up. This lesson builds all three.

## What the Gray Paper says

::: gray-paper B.7 1-3

#### Appendix B.7 Accumulate Functions {#gp-B-7}

<a id="gp-B-7-p1"></a>This defines a number of functions broadly of the form $(\varrho' \in \mathbb{Z}_G, \varphi' \in \left[\!\left[\mathbb{N}_R\right]\!\right]_{13}, \mu', \left(\mathbf{x}', \mathbf{y}'\right)) = \Omega_\square(\varrho \in \mathbb{N}_G, \varphi \in \left[\!\left[\mathbb{N}_R\right]\!\right]_{13}, \mu \in \mathbb{M}, \left(\mathbf{x}, \mathbf{y}\right) \in \mathbb{L}^2, \dots)$. Functions which have a result component which is equivalent to the corresponding argument may have said components elided in the description. Functions may also depend upon particular additional parameters.

<a id="gp-B-7-p2"></a>Other than the gas-counter which is explicitly defined, elements of PVM state are each assumed to remain unchanged by the host-call unless explicitly specified.

<a id="gp-B-7-p3"></a><a id="eq-B-20"></a><a id="eq-B-21"></a>

$$
\begin{align}
\varrho' &\equiv \varrho - g \tag{B.20} \\
\left(\varepsilon', \varphi', \mu', \mathbf{x}', \mathbf{y}'\right) &\equiv \begin{cases}
\left(\infty, \varphi, \mu, \mathbf{x}, \mathbf{y}\right) &\text{if } \varrho < g\\
\left(\blacktriangleright, \varphi, \mu, \mathbf{x}, \mathbf{y}\right) \text{ except as indicated below} &\text{otherwise}
\end{cases} \tag{B.21}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-gascounter" class="gk-wrap">$\varrho$</span> | rho (curly) | the gas left |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-execst" class="gk-wrap">$\varepsilon$</span> | epsilon | how the machine goes on after a host call: carry on (▸), halt, panic or out of gas |
| <span id="gk-registers" class="gk-wrap">$\varphi$</span> | phi (curly) | the PVM's 13 registers |
| <span id="gk-memory" class="gk-wrap">$\mu$</span> | mu | the PVM's memory |
| <span id="gk-imX" class="gk-wrap">$\mathbf{x}$</span> | x | the regular context: what the host calls change as the service runs, kept if it halts |
| <span id="gk-oog" class="gk-wrap">$\infty$</span> | out of gas | ∞: the program ran out of gas |
| <span id="gk-continue" class="gk-wrap">$\blacktriangleright$</span> | continue | ▸: the step went normally, and the next one may run |

</details>

→ [(B.20), (B.21) in plain words](./gray-paper.md#ex-B-20)

:::

Every host call of accumulation follows the same rule as the general ones,
now with the pair of contexts (𝐱, 𝐲): pay first; too little gas, and nothing changes;
whatever a call doesn't mention stays as it was. The three calls of this lesson are rows
23 to 25 of B.7's table, each explained in
[16.A](./gray-paper.md#query-23-solicit-24-and-forget-25).

Each request is a pair, the hash h and the length z, and its value is a short history of
up to three slots (§9):

| History | Meaning |
| --- | --- |
| [] | asked for, not provided yet |
| [x] | provided at slot x |
| [x, y] | provided at x, forgotten at y |
| [x, y, w] | provided at x, forgotten at y, asked for again at w, and available again from w |

The three calls (App. B.7) all take the hash from memory at φ₇ and the length from φ₈.
A length of 2^32 or more is HUH (no preimage is that long); an unreadable hash, a panic.
Then:

- **`solicit`** (24, 2,193 gas) asks. A new request starts as []; one that's been forgotten,
  [x, y], is asked for again: [x, y, t]. Anything else is HUH. A request takes deposit
  ([lesson 14.2](../14-services/02-the-service-account.md): 2 items, and 81 + z bytes), so if the balance can't cover it: FULL.
  Asking again for a forgotten one costs nothing more: [x, y] never left the footprint, so
  its deposit is already counted.
- **`forget`** (25, 3,250 gas) gives up. A request never provided, [], goes, and so does one
  forgotten more than D slots ago, [x, y] with y < t − D: the request and the preimage, and
  the deposit with them. One that's provided, [x], is marked forgotten now: [x, t]. One asked
  for again, [x, y, w] with y long enough ago, becomes [w, t]. Anything else: HUH.
- **`query`** (23, 643 gas) reports: φ₇ = the number of slots plus 2^32 times the first,
  φ₈ = the second plus 2^32 times the third. No such request: NONE, and φ₈ = 0.

D is the expunge period, `expunge_period` in the config: 32 slots on tiny. t is the slot of
the block, so accumulation's host needs to know it now.

[The widget at the top](#try-it) walks one request through this life, slot by slot.

## The tests

The tests' accounts get requests, and the helpers pass the slot:

**Replace in** `test/host.test.ts`

```ts
/** The accounts the tests' accumulation sees: service 0, with tinyInfo's record. */
function tinyAccounts(): Map<number, Account> {
  const account = { info: tinyInfo(), storage: new Map(), preimages: new Map() };
  return new Map([[0, { ...account, requests: new Map() }]]);
}

/** Accumulation's host, for service 0 with a tiny program, an entropy of sevens, no inputs. */
const accumulating = accumulateHost(TINY, {
  id: 0,
  accounts: tinyAccounts(),
  checkpoint: tinyAccounts(),
  code: tinyCode(),
  entropy: new Uint8Array(32).fill(7),
  inputs: [],
}, 0);

/** Service 1729's accumulation, set up as always_accumulate-1 has it: machine and host. */
function vectorService() {
  const { a, slot, expected } = vectorAccumulation();
  const [t, s] = [BigInt(slot), BigInt(a.id)]; // the slot, the service, no inputs
  const args = Uint8Array.from([...encodeNatural(t), ...encodeNatural(s), ...encodeNatural(0n)]);
  const { memory, registers } = standardProgram(a.code, args);
  const machine = newMachine(deblob(a.code.program), registers, memory, 100_000n);
  machine.pc = 5; // accumulation
  return { machine, host: accumulateHost(TINY, a, slot), expected };
}
```

**Add to** `test/host.test.ts`

```ts
import { forget, HUH, OK, query, solicit } from "../src/host.ts";
import type { HostExit } from "../src/host.ts";
import type { Exit, Machine } from "../src/pvm/machine.ts";

const HASH = new Uint8Array(32).fill(5);

/** A machine about to make a request: φ₇ points at a hash of fives, φ₈ = the length. */
function requesting(length: bigint) {
  const memory = new Map();
  addPages(memory, 0x20000, 4096, "W");
  writeMemory(memory, 0x20000n, HASH);
  const registers = [0n, 0n, 0n, 0n, 0n, 0n, 0n, 0x20000n, length];
  return newMachine(assemble([[0]]), registers, memory, 10_000n);
}

test("solicit: a request with no slots yet, and 2 items and 81 + 100 bytes more to pay for", () => {
  const a: Accumulation = bundle();
  const machine: Machine = requesting(100n);
  const exit: HostExit = solicit(machine, a, 7);
  assert.equal(exit, "continue");
  assert.equal(machine.registers[7], OK);
  const account: Account = a.accounts.get(0)!;
  const request: number[] | undefined = account.requests.get(`${toHex(HASH)}:100`);
  assert.deepEqual(request, []);
  assert.deepEqual([account.info.items, account.info.bytes], [4, 50n + 81n + 100n]);
  const asking: Machine = requesting(100n);
  query(asking, a);
  const slots: bigint[] = asking.registers.slice(7, 9); // asked for, no slots yet
  assert.deepEqual(slots, [0n, 0n]);
});

test("asking twice is HUH, and so is a length no preimage can have", () => {
  const a: Accumulation = bundle();
  solicit(requesting(100n), a, 7);
  const again: Machine = requesting(100n);
  solicit(again, a, 8);
  assert.equal(again.registers[7], HUH);
  const huge: Machine = requesting(2n ** 32n);
  solicit(huge, a, 8);
  assert.equal(huge.registers[7], HUH);
});

test("forget: a request never provided just goes; one provided at x becomes [x, t]", () => {
  const a: Accumulation = bundle();
  solicit(requesting(100n), a, 7);
  forget(requesting(100n), a, 9, TINY.expunge_period);
  assert.equal(a.accounts.get(0)!.requests.size, 0);
  a.accounts.get(0)!.requests.set(`${toHex(HASH)}:100`, [3]); // provided at slot 3
  forget(requesting(100n), a, 9, TINY.expunge_period);
  const asking: Machine = requesting(100n);
  query(asking, a);
  const slots: bigint[] = asking.registers.slice(7, 9); // 2 slots: 3, 9
  assert.deepEqual(slots, [2n + 3n * 2n ** 32n, 9n]);
});
```

The vector checks look at requests and footprints too now, and three more vectors join:
in `preimage_len_bound`, service 0 solicits, queries and forgets around the length bound.

**Replace in** `test/accumulate.test.ts`

```ts
import type { Account } from "../src/services.ts";
/** Checks service s's accumulation in test vector `name` against the vector's post-state. */
function checkVector(name: string, s: number) {
  const { result, gas, after } = runVector(name, s);
  assert.equal(result.gasUsed, gas);
  const mine: Account = result.accounts.get(s)!;
  assert.deepEqual(mine.storage, after.storage);
  assert.deepEqual(mine.requests, after.requests);
  assert.deepEqual([mine.info.items, mine.info.bytes], [after.info.items, after.info.bytes]);
}

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
];
```

## The code

An account gains its requests. The key is the hash and length as one string,
"hash:length", since a `Map` can't compare pairs:

**Replace in** `src/services.ts`

```ts
/**
 * A service account (GP §9) as accumulation sees it: its record, its storage, the
 * preimages it keeps, each under its hash, and its requests for preimages: for each hash
 * and length ("hash:length"), the slots it was asked for, provided, and so on. Keys in hex.
 */
export type Account = {
  info: ServiceInfo;
  storage: Map<string, Bytes>;
  preimages: Map<string, Bytes>;
  requests: Map<string, number[]>;
};

/** An account as the accumulate test vectors write it. */
export type AccountJson = {
  service: unknown;
  storage: { key: string; value: string }[];
  preimage_blobs: { hash: string; blob: string }[];
  preimage_requests: { key: { hash: string; length: number }; value: number[] }[];
};

/** An account from the accumulate test vectors' JSON. */
export function accountFromJson(json: AccountJson): Account {
  const storage = new Map(json.storage.map((e) => [e.key, fromHex(e.value)]));
  const preimages = new Map(json.preimage_blobs.map((p) => [p.hash, fromHex(p.blob)]));
  const requests = new Map(
    json.preimage_requests.map((r) => [`${r.key.hash}:${r.key.length}`, r.value]),
  );
  return { info: ServiceInfo.fromJson(json.service), storage, preimages, requests };
}

/** A copy of the accounts that changes to the originals can't reach. */
export function copyAccounts(accounts: Map<number, Account>): Map<number, Account> {
  const copy = (a: Account) => ({
    info: { ...a.info },
    storage: new Map(a.storage),
    preimages: new Map(a.preimages),
    requests: new Map([...a.requests].map(([k, slots]) => [k, [...slots]])),
  });
  return new Map([...accounts].map(([id, a]) => [id, copy(a)]));
}
```

**Add to** `src/host.ts`

```ts
export const HUH = 2n ** 64n - 9n; // that can't be done now

/** The hash a request names, in memory at φ₇, in hex; none if it isn't readable. */
function requestedHash(m: Machine): string | undefined {
  const hash = readMemory(m.memory, m.registers[7], 32);
  return hash instanceof Uint8Array ? toHex(hash) : undefined;
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
  const slots = a.accounts.get(a.id)!.requests.get(`${hash}:${length}`);
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
  const key = `${hash}:${length}`;
  const slots = account.requests.get(key);
  if (slots && slots.length !== 2) return setTo(m, HUH);
  const { items, bytes } = account.info;
  const added = { ...account.info, items: items + 2, bytes: bytes + 81n + length }; // 14.2
  const info = slots ? account.info : added;
  if (info.balance < minimumBalance(info)) return setTo(m, FULL);
  account.requests.set(key, slots ? [...slots, t] : []);
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
  const key = `${hash}:${length}`;
  const slots = account.requests.get(key);
  const expired = (y: number) => y < t - D;
  if (slots?.length === 0 || (slots?.length === 2 && expired(slots[1]))) {
    account.requests.delete(key);
    account.preimages.delete(hash);
    const { items, bytes } = account.info;
    account.info = { ...account.info, items: items - 2, bytes: bytes - 81n - length };
  } else if (slots?.length === 1) {
    account.requests.set(key, [slots[0], t]);
  } else if (slots?.length === 3 && expired(slots[1])) {
    account.requests.set(key, [slots[2], t]);
  } else {
    return setTo(m, HUH);
  }
  return setTo(m, OK);
}

/** φ₇ = an answer, and carry on. */
function setTo(m: Machine, answer: bigint): HostExit {
  m.registers[7] = answer;
  return "continue";
}
```

All three decide on the length *before* the hash, in the Gray Paper's order: an absurd
length is HUH even when the hash is unreadable too. `solicit` works out the account with
the request's deposit added, exactly as `write` did with storage, and keeps it only if the
balance covers it.

Accumulation's host takes the slot, and Ψ_A hands it over:

**Replace in** `src/host.ts`

```ts
/**
 * F (GP App. B.4): the host for a service's accumulation. So far it answers gas, grow_heap,
 * fetch (whose items are the constants, 0; the entropy, 1; and the inputs, all of them, 14,
 * or one, 15), info, lookup, read, write, checkpoint, query, solicit and forget, the last
 * two at `slot`, the time of the block. Anything else: WHAT.
 */
export function accumulateHost(config: Config, a: Accumulation, slot: number): Host {
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
        return checkpoint(m, a);
      case "query":
        return query(m, a);
      case "solicit":
        return solicit(m, a, slot);
      case "forget":
        return forget(m, a, slot, config.expunge_period);
      default:
        return unknown(m);
    }
  };
}

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
  const host = accumulateHost(config, a, slot);
  const exit = runWithHost(machine, (call, m) => {
    const answer = host(call, m);
    watch?.(call, m);
    return answer;
  });
  const gasUsed = gas - (machine.gas > 0n ? machine.gas : 0n); // u = g − max(ϱ′, 0)
  return { exit, accounts: collapse(a, exit), gasUsed };
}
```

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ preimage_len_bound-1: service 0 ends as the vector says (96.0ms)
✔ preimage_len_bound-2: service 0 ends as the vector says (126.8ms)
✔ preimage_len_bound-3: service 0 ends as the vector says (110.5ms)
...
✔ the reported packages: each one's hash and exports root, sorted by hash (205.3ms)
...
✔ solicit: a request with no slots yet, and 2 items and 81 + 100 bytes more to pay for (0.2ms)
✔ asking twice is HUH, and so is a length no preimage can have (0.1ms)
✔ forget: a request never provided just goes; one provided at x becomes [x, t] (0.2ms)
...
ℹ tests 486
ℹ suites 0
ℹ pass 486
ℹ fail 0
...
reported 486 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791738525132
...
```

Thirteen services in twelve official vectors now match them, and the checks are stricter:
storage, requests, items and bytes, all as the vectors leave them.

## Watch it

What flows through it: service 0 is handed a hash and a length, and asks for the
preimage with that length. What goes in, its `solicit`, and the lines it prints:

::: code-group

```json [what goes in]
{
  "input": { "slot": 43, "reports": [ { "results": [ {
    "service_id": 0,
    "accumulate_gas": 2000000,
    "result": { "ok": "0x0106943e3d42cf248c99…" }
  } ] } ] },
  "pre_state": { "accounts": [ { "id": 0, "data": {
    "service": { "code_hash": "0xdd0eb77dee67…" },
    "preimage_requests": [ { "key": { "hash": "0xdd0eb77dee67…", "length": 127513 }, "value": [0] } ]
  } } ] },
  "post_state": { "statistics": [ { "id": 0, "record": { "accumulate_gas_used": 133691 } } ] }
}
```

```ts [what it computes]
// service 0's solicit, as your host handles it
const computed = {
  solicit: {
    hash: "0x943e3d42…", // the 32 bytes at φ₇, from the operand
    z: 4_294_967_296n, // φ₈: the length asked for, 2^32, one past the largest a blob may be
    answer: 2n ** 64n - 9n, // HUH: checked before the hash is even read
    gas: [1_894_363n, 1_892_170n], // before and after
  },
  requests: 1, // service 0's requests after: still only its own code's, nothing filed
  used: 133_691n, // 2,000,000 − 1,866,309 left at the halt
};
```

```text [what comes out]
service 0: 1 input(s), 2000000 gas, "halt"
  gas used 133691; the vector says 133691
```

:::

**Run**

```sh
npm pkg set scripts.accumulate-len-bound="node bin/accumulate.ts ../vectors/stf/accumulate/tiny/preimage_len_bound-1.json"
npm run accumulate-len-bound
```

```text
service 0: 1 input(s), 2000000 gas, "halt"
  gas used 133691; the vector says 133691
  storage: 0x0100000000 = 0x774935b629cc42513a66c8ed1a09f88b00fe35689032bafd5a26d52f464c48080000, 0x00 = 0x01000000, 0x02774935b629cc42513a66c8ed1a09f88b00fe35689032bafd5a26d52f464c48080000 = 0x010101
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=accumulate-1791738530109
```

Service 0 asks with a length of 2^32, gets HUH and files no request, on exactly the vector's
gas, and its storage is the vector's too. The bin is [lesson 16.7](./07-a-services-inputs.md)'s, unchanged: each new host call
only had to join the host.

<details>
<summary>lasair: the length bound, in <code>lib/pvm_host.ml</code></summary>

```ocaml
  (* GP 0.8.0 solicit: HUH when z is not a valid blob length (z >= 2^32),
     checked BEFORE the hash read (so no panic on an unreadable o). *)
  if Int64.unsigned_compare z_u64 0x1_0000_0000L >= 0 then
    Some { new_gas; new_regs = set_reg regs 7 result_huh; new_mem = mem;
           new_service = None; new_context = None }
```

The same order as yours, spelled out in the comment because it's the kind of detail that
slips: read the hash first and an unreadable one panics the machine, where the Gray Paper
says HUH and carry on. lasair's registers are signed 64-bit integers, so it compares them
with `unsigned_compare`; your `bigint` values just compare.

</details>

## Check your understanding

::: check
**A service solicits a preimage for the first time. What does the chain hold for it right after?**

- [x] A request with an empty history, asked for and not provided, and its deposit counted from that moment
  > Yes: a new request has no slots. The footprint grows by 2 items and 81 + z bytes as
  > soon as it's asked for.
- [ ] A request marked provided at the block's slot
  > No: asking isn't providing. A slot in the history would mean the data had arrived.
- [ ] The preimage itself
  > No: nothing is provided yet. A block will provide it later, if someone sends it.

**A service forgets a preimage that has been provided. Is it gone?**

- [ ] Yes: the request, the preimage and the deposit go at once
  > No: only a request never provided, or one forgotten long ago, goes. A provided one is
  > first marked forgotten.
- [x] Not yet: it is marked forgotten at this slot, and goes only if it is forgotten again more than D slots later
  > Yes: [3] forgotten at slot 9 becomes [3, 9]. It goes only if y < t − D. On tiny, where
  > D is 32, a second `forget` at slot 40 is HUH: 40 − 32 = 8. At slot 42, 9 < 10, and it would go.
- [ ] No, and it never can be: a provided preimage can't be forgotten
  > No: it can. HUH is for a request in no state to be forgotten, like one forgotten too
  > recently.

**Who provides the data a service asked for?**

- [ ] The service, which hands the bytes to `solicit`
  > No: `solicit` takes a hash and a length, and files the request. No data comes with it.
- [ ] The host, which finds the data while it answers the call
  > No: the host only changes the request's history. The answer is OK, HUH or FULL.
- [x] A block, later, as [lesson 14.1](../14-services/01-providing-preimages.md) built
  > Yes: asking and providing are two steps. Until a block provides it, the request's
  > history stays empty.

**`solicit` gets a length of 2^32, and a hash it can't read. What happens?**

- [ ] A panic, because the hash can't be read
  > No: the length is checked first, as the Gray Paper orders it, and it never gets to
  > the hash.
- [x] φ₇ = HUH, and the machine carries on
  > Yes: no preimage is 2^32 bytes long. Checking the hash first would panic where the
  > Gray Paper says HUH.
- [ ] FULL: no balance could pay for 2^32 bytes
  > No: the deposit is never worked out. The length alone is HUH.

**A service asks again for a preimage it had forgotten. Why does that cost no more deposit?**

- [x] The forgotten request never left the footprint, so its deposit is already counted
  > Yes: a request holds deposit while it lasts, forgotten or not. It is given back only
  > when the request goes.
- [ ] The deposit was returned at `forget`, and a second asking is free
  > No: marking a request forgotten returns nothing. The deposit goes with the request,
  > more than D slots later.
- [ ] Deposit is charged for storage, and requests aren't counted
  > No: a request takes deposit: 2 items, and 81 + z bytes.
:::

## What you have

Services that ask for data, check on it, and let it go, paying deposit for each request
while it lasts. Thirteen services in twelve official vectors matching, and [Part 16](./index.md)'s first
stretch is done ([Part 17](../17-accumulation/index.md) adds the ones that act on other services). So
far every report in a block is accumulated at once, in one go. [Part 17](../17-accumulation/index.md) is about
which reports go when, and what a service's actions do to the others.

Next: [Part 17 · Accumulation](../17-accumulation/index.md)
