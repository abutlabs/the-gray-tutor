# The ring root

Two things in Safrole need real cryptography, not just a hash. Every ticket carries a
*ring proof*, which says "one of these validators made me" without saying which, and it
must be checked. And the set of validators it's checked against, the *ring*, is
summed up in γ_Z, the ring root, which changes whenever the validators do. Both need the
Bandersnatch curve's arithmetic, so this lesson brings in a library that has it. By the end
of it your client checks every ticket's proof, makes each new epoch's ring root, and passes
all 46 safrole vectors.

## New words

- **Ring root.** γ_Z, 144 bytes. A commitment to a list of Bandersnatch keys, the ring:
  short to keep, and enough to check a ring proof against. *Example:* a new one at every
  epoch, from the validators just rotated into γ_P.
- **Padding point.** The stand-in for a missing key in a ring, or for one that isn't a point on
  the curve. *Example:* an offender's key, zeroed by [lesson 8.2](./02-rotating-the-validators.md), becomes padding.
- **WebAssembly.** A compact program format that JavaScript engines run at close to native
  speed, so a library written in Rust can run in Node. *Example:* the Bandersnatch library
  this lesson installs.

All three are in the [glossary](../glossary.md).

## What the Gray Paper says

§6 and Appendix G, in plain steps:

1. **The ring root.** At a new epoch, γ′_Z = 𝒪(the Bandersnatch keys of γ′_P): the ring
   root of the validators who will be active in the *next* epoch. Tickets entered this
   epoch are for that epoch, so they're checked against its validators. Within an epoch,
   γ′_Z = γ_Z.
2. **The ring has a fixed size.** A key that isn't a point on the curve becomes the
   *padding point*, and the ring is filled up with padding to the chain's validator count:
   6 on tiny, 1,023 on full.
3. **A ticket's proof** must check out against γ′_Z, for the input X_T ⌢ η′₂ ⌢ its attempt
   (X_T is "jam_ticket_seal", the same `$` rule as [lesson 5.3](../05-hashing-and-signatures/03-signatures.md)'s "jam_available"). η′₂ is two
   epochs' old entropy, fixed before anyone could have made a ticket for it.
4. **A proof that fails** makes the block invalid: `bad_ticket_proof`.

That's [lesson 8.7](./07-entering-tickets.md)'s last missing rule.

You already built a commitment like this: [lesson 6.1](../06-state-and-merklization/01-the-state-trie.md)'s state root squeezes the whole
state into 32 bytes you can check facts against. γ_Z squeezes the validator list into 144
bytes you can check *membership* against — anonymously, which a plain hash can't offer.
Here is the real ring the tiny vector `enact-epoch-change-with-padding-1.json` rotates in,
and its real γ′_Z. Tap a seat to zero its key, the way [lesson 8.2](./02-rotating-the-validators.md) zeroes an offender's,
and the root answers:

<RingRoot />

One seat is strange on purpose: validator 3's key isn't a point on the curve at all, so
the ring holds the padding point there whether you zero it or not — the vector exists to
test exactly that. And the root's last 48 bytes never move: that third point comes from
the fixed setup, not from the keys.

### A library, not code of your own

Making a ring root and checking a ring proof is serious cryptography: elliptic curves,
pairings, and a structured reference string of 590 KB. Writing it would be its own
tutorial, and getting it one byte wrong would make every check fail. So your client uses
`@typeberry/native`, a library made by another JAM team, Fluffy Labs, for their client,
typeberry. It wraps ark-vrf, the Rust library the Gray Paper points to, as native code and
as WebAssembly. Your client calls three of its functions: `ringCommitment`,
`batchVerifyTickets`, and in [lesson 8.9](./09-seals.md), `verifySeal`.

Two honest notes. The library makes rings of 6 or 1,023 keys only, the two sizes the
official networks use; that's all your client needs. And it checks a block's ring proofs
all together, in one go: when one fails it can't say which, so neither can your client.

The wrapper is the only borrowed part, and it's small. lasair, an OCaml client, writes
its own: a hundred lines of FFI glue calling the same ark-vrf, compiled to native code
instead of WebAssembly. Every client ends at that one Rust library; teams differ only in
the bridge to it. [Cryptography we use](../cryptography.md) compares the two bridges.

## Install it

**Rewrite** `package.json`

```json
{
  "name": "jam-client",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test --test-reporter=spec --test-reporter-destination=stdout --test-reporter=./test/grafana.ts --test-reporter-destination=stdout \"test/**/*.test.ts\"",
    "typecheck": "tsc -p .",
    "hello": "node bin/hello.ts",
    "now": "node bin/now.ts",
    "hexdump": "node bin/hexdump.ts",
    "hexdump-work-item": "node bin/hexdump.ts ../vectors/codec/tiny/work_item.bin 52",
    "scoreboard": "node bin/scoreboard.ts",
    "decode": "node bin/decode.ts",
    "decode-work-item": "node bin/decode.ts work_item ../vectors/codec/tiny/work_item.bin",
    "decode-work-package": "node bin/decode.ts work_package ../vectors/codec/tiny/work_package.bin",
    "decode-work-result": "node bin/decode.ts work_result ../vectors/codec/tiny/work_result_1.bin",
    "decode-work-report": "node bin/decode.ts work_report ../vectors/codec/full/work_report.bin",
    "decode-preimages": "node bin/decode.ts preimages_extrinsic ../vectors/codec/tiny/preimages_extrinsic.bin",
    "decode-assurances": "node bin/decode.ts assurances_extrinsic ../vectors/codec/tiny/assurances_extrinsic.bin",
    "decode-assurances-full": "node bin/decode.ts assurances_extrinsic ../vectors/codec/full/assurances_extrinsic.bin",
    "decode-guarantees": "node bin/decode.ts guarantees_extrinsic ../vectors/codec/tiny/guarantees_extrinsic.bin",
    "decode-disputes": "node bin/decode.ts disputes_extrinsic ../vectors/codec/full/disputes_extrinsic.bin",
    "decode-header": "node bin/decode.ts header ../vectors/codec/tiny/header_1.bin",
    "decode-block": "node bin/decode.ts block ../vectors/codec/tiny/block.bin",
    "chain": "node bin/chain.ts",
    "assurances": "node bin/assurances.ts",
    "assurances-bad-signature": "node bin/assurances.ts ../vectors/stf/assurances/tiny/assurances_with_bad_signature-1.json",
    "state": "node bin/state.ts",
    "state-fallback": "node bin/state.ts ../vectors/traces/fallback/00000001.json",
    "read-state": "node bin/read-state.ts",
    "read-state-safrole": "node bin/read-state.ts ../vectors/traces/safrole/00000012.json",
    "epochs": "node bin/epochs.ts",
    "shuffle": "node bin/shuffle.ts",
    "shuffle-eight": "node bin/shuffle.ts 8 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
    "entropy": "node bin/entropy.ts",
    "entropy-new-epoch": "node bin/entropy.ts ../vectors/stf/safrole/tiny/enact-epoch-change-with-no-tickets-4.json",
    "rotation": "node bin/rotation.ts",
    "rotation-new-epoch": "node bin/rotation.ts ../vectors/stf/safrole/tiny/enact-epoch-change-with-padding-1.json",
    "sealers": "node bin/sealers.ts",
    "sealers-no-tickets": "node bin/sealers.ts ../vectors/stf/safrole/tiny/enact-epoch-change-with-no-tickets-4.json",
    "lottery": "node bin/lottery.ts",
    "lottery-closes": "node bin/lottery.ts ../vectors/stf/safrole/tiny/publish-tickets-with-mark-4.json",
    "safrole": "node bin/safrole.ts",
    "safrole-new-epoch": "node bin/safrole.ts ../vectors/stf/safrole/tiny/enact-epoch-change-with-padding-1.json",
    "vrf": "node bin/vrf.ts",
    "safrole-tickets-2": "node bin/safrole.ts ../vectors/stf/safrole/tiny/publish-tickets-no-mark-2.json",
    "safrole-tickets-4": "node bin/safrole.ts ../vectors/stf/safrole/tiny/publish-tickets-no-mark-4.json"
  },
  "dependencies": {
    "@noble/curves": "2.4.0",
    "@noble/hashes": "2.4.0",
    "@typeberry/native": "0.5.1-4e90642"
  },
  "devDependencies": {
    "@types/node": "26.6.4",
    "typescript": "7.0.2"
  }
}
```

**Run**

```sh
npm install
```

## The tests

The vectors' Safrole state has γ_Z:

**Replace in** `test/safrole.test.ts`

```ts
/** The parts of a safrole vector's state the lessons use so far. */
type SafroleState = {
  tau: number;
  eta: string[];
  iota: unknown[];
  gamma_k: unknown[];
  kappa: unknown[];
  lambda: unknown[];
  post_offenders: string[];
  gamma_a: unknown[]; // γ_A: the lottery's best tickets so far
  gamma_s: { keys?: string[]; tickets?: unknown[] }; // γ_S: the sealers, keys or tickets
  gamma_z: string; // γ_Z: the ring root of γ_P
};
```

**Add to** `test/safrole.test.ts`

```ts
import { ringRootOf } from "../src/safrole.ts";

test("γ′_Z: at a new epoch, the ring root of the new pending validators", () => {
  let roots = 0;
  for (const { config, name, vector, newEpoch } of acceptedVectors()) {
    if (!newEpoch) continue;
    const offenders: Bytes[] = vector.pre_state.post_offenders.map(fromHex);
    const { pending }: ValidatorSets = rotateValidators(validatorSets(vector.pre_state), offenders);
    const root: string = toHex(ringRootOf(config, pending));
    assert.equal(root, vector.post_state.gamma_z, name);
    if (vector.post_state.gamma_z !== vector.pre_state.gamma_z) roots++;
  }
  assert.equal(roots, 13); // 6 tiny, 7 full: a new root, whenever the keys changed
});

test("a forged ring proof: bad_ticket_proof", () => {
  for (const config of [TINY, FULL]) {
    const name = `stf/safrole/${config.name}/publish-tickets-no-mark-5.json`;
    const vector = vectorJson(name) as SafroleVector;
    const before: Safrole = safroleFromJson(vector.pre_state);
    const entered = vector.input.extrinsic.map((t) => TicketEnvelope.fromJson(t));
    const error: string | null = safroleError(config, before, vector.input.slot, entered);
    assert.equal(error, "bad_ticket_proof", name);
  }
});
```

[Lesson 8.5](./05-one-step-of-safrole.md)'s whole-step test now checks γ′_Z too, since γ_Z is about to join your `Safrole`.

## The code

The library first, in the file that already holds [lesson 8.6](./06-the-vrf-output.md)'s `vrfOutput`:

**Add to** `src/bandersnatch.ts`

```ts
import { bandersnatch } from "@typeberry/native";

/** The Bandersnatch library, started once: it loads native or WebAssembly code first. */
const library = await bandersnatch.default();

/**
 * 𝒪 (GP App. G): the ring root of some Bandersnatch keys, the 144 bytes ring proofs are
 * checked against. The ring has a fixed size, the chain's validator count: missing keys,
 * and keys that aren't points on the curve (such as an offender's zeros), are padding.
 */
export function ringRoot(keys: Bytes[], size: number): Bytes {
  const padding = Array.from({ length: size - keys.length }, () => new Uint8Array(32));
  const result = library.ringCommitment(concatBytes(...keys, ...padding));
  if (result[0] !== 0) throw new Error("the Bandersnatch library made no ring root");
  return Uint8Array.from(result.subarray(1)); // a plain copy: the library may hand back a Buffer
}

/** A ring proof (784 bytes) and the input it claims to be made for. */
export type RingProof = { proof: Bytes; input: Bytes };

/**
 * Whether every ring proof checks out against the ring root, a ring of `size` keys: made
 * by one of the ring's keys, for its input. All or nothing: the library checks them in
 * one batch, so it can't say which proof failed.
 */
export function ringProofsHold(root: Bytes, size: number, proofs: RingProof[]): boolean {
  if (proofs.length === 0) return true;
  const data = concatBytes(...proofs.flatMap((p) => [p.proof, p.input]));
  return library.batchVerifyTickets(size, root, data, proofs[0].input.length)[0] === 0;
}
```

```ts
const library = await bandersnatch.default();
```

The library loads its native code (or its WebAssembly, where there's none for your
computer) when it starts, which takes a moment, so it starts once, when the file is first
imported. `await` at the top of a module waits for it before anything uses it.

```ts
  return Uint8Array.from(result.subarray(1)); // a plain copy: the library may hand back a Buffer
```

Each answer starts with a status byte: 0 for done. A *Buffer* is Node's own kind of byte
array; your tests compare plain `Uint8Array` values, so `ringRoot` copies the root into one.

Then Safrole keeps γ_Z:

**Replace in** `src/safrole.ts`

```ts
import { ringRoot, ringProofsHold } from "./bandersnatch.ts";

/** Safrole's part of the state (GP §6), as your client keeps it. */
export type Safrole = {
  time: number; // τ: the slot of the most recent block
  entropy: Bytes[]; // η
  validators: ValidatorSets; // ι, γ_P, κ, λ
  accumulator: TicketBody[]; // γ_A: the lottery's best tickets so far
  sealers: Sealers; // γ_S
  ringRoot: Bytes; // γ_Z: the ring root of γ_P's Bandersnatch keys
};

/** Safrole's state as the test vectors write it, under the Gray Paper's Greek names. */
export type SafroleJson = {
  tau: number;
  eta: string[];
  iota: unknown[];
  gamma_k: unknown[];
  kappa: unknown[];
  lambda: unknown[];
  gamma_a: unknown[];
  gamma_s: { keys?: string[]; tickets?: unknown[] };
  gamma_z: string;
};

/** Safrole's state, from the vectors' JSON. */
export function safroleFromJson(json: SafroleJson): Safrole {
  const keys = (list: unknown[]) => list.map((key) => ValidatorKey.fromJson(key));
  const tickets = (list: unknown[]) => list.map((ticket) => TicketBody.fromJson(ticket));
  const { keys: fallback, tickets: winners } = json.gamma_s;
  return {
    time: json.tau,
    entropy: json.eta.map(fromHex),
    validators: {
      staging: keys(json.iota),
      pending: keys(json.gamma_k),
      active: keys(json.kappa),
      previous: keys(json.lambda),
    },
    accumulator: tickets(json.gamma_a),
    sealers: winners ? { tickets: tickets(winners) } : { keys: (fallback ?? []).map(fromHex) },
    ringRoot: fromHex(json.gamma_z),
  };
}
```

**Add to** `src/safrole.ts`

```ts
/** γ_Z (GP §6): the ring root of some validators' Bandersnatch keys, in a ring as big as
 * the chain's validator set. */
export function ringRootOf(config: Config, validators: ValidatorKey[]): Bytes {
  return ringRoot(validators.map((v) => v.bandersnatch), config.validators_count);
}

/** X_T (GP §6): the context of a ticket's ring proof, "$jam_ticket_seal" without the $. */
const TICKET_SEAL = new TextEncoder().encode("jam_ticket_seal");

/** What a ticket's ring proof signs: X_T ⌢ η′₂ ⌢ its attempt, one byte. */
export function ticketInput(eta2: Bytes, attempt: number): Bytes {
  return concatBytes(TICKET_SEAL, eta2, Uint8Array.of(attempt));
}
```

`safroleStep` makes a new ring root at each new epoch:

**Replace in** `src/safrole.ts`

```ts
/**
 * One block of Safrole (GP §6): the state after it, and the two marks its header must
 * carry. Its tickets join the lottery: each one's id is its proof's VRF output, and the
 * lottery keeps the E lowest ids, old and new (none old at a new epoch).
 */
export function safroleStep(
  config: Config,
  before: Safrole,
  slot: number, // the block's slot, τ′
  vrfOutput: Bytes, // Y(H_v), from the block's entropy source
  offenders: Bytes[], // ψ′_O: Ed25519 keys convicted in disputes
  tickets: TicketEnvelope[] = [], // the block's tickets extrinsic, already checked
) {
  const newEpoch = epochOf(config, slot) > epochOf(config, before.time);
  const entropy = nextEntropy(before.entropy, vrfOutput, newEpoch);
  const validators = newEpoch ? rotateValidators(before.validators, offenders) : before.validators;
  let sealers = before.sealers;
  if (sealedByTickets(config, before.time, slot, before.accumulator)) {
    sealers = { tickets: outsideIn(before.accumulator) };
  } else if (newEpoch) {
    sealers = { keys: fallbackKeys(config, entropy[2], validators.active) };
  }
  const entered = tickets.map((t) => ({ id: ticketId(t), attempt: t.attempt }));
  const kept = newEpoch ? [] : before.accumulator; // a new epoch starts a new lottery
  const accumulator = [...kept, ...entered].sort(byId).slice(0, config.epoch_length);
  const ring = newEpoch ? ringRootOf(config, validators.pending) : before.ringRoot; // γ′_Z
  const after: Safrole = { time: slot, entropy, validators, accumulator, sealers, ringRoot: ring };
  // the epoch mark: η₀ and η₁ as they were, and γ′_P, the validators after next, by two keys
  const keys = validators.pending.map(({ bandersnatch, ed25519 }) => ({ bandersnatch, ed25519 }));
  const epochMark: EpochMark | null = newEpoch
    ? { entropy: before.entropy[0], tickets_entropy: before.entropy[1], validators: keys }
    : null;
  const marked = ticketsMark(config, before.time, slot, before.accumulator);
  return { after, epochMark, ticketsMark: marked };
}
```

```ts
  const ring = newEpoch ? ringRootOf(config, validators.pending) : before.ringRoot; // γ′_Z
```

And `safroleError` checks the proofs, last, since they're the slow part:

**Replace in** `src/safrole.ts`

```ts
/**
 * Why Safrole refuses a block (GP §6), or null if it doesn't: its slot isn't after the last
 * block's (bad_slot); it brings tickets once the lottery has closed, or more than K
 * (unexpected_ticket); a ticket's attempt is n or more (bad_ticket_attempt); the ids don't
 * go strictly up (bad_ticket_order); one is in the lottery already (duplicate_ticket); or
 * a ring proof doesn't check out against γ′_Z (bad_ticket_proof).
 */
export function safroleError(
  config: Config,
  before: Safrole,
  slot: number,
  tickets: TicketEnvelope[],
  offenders: Bytes[] = [], // ψ′_O, for γ′_P at a new epoch
): string | null {
  if (slot <= before.time) return "bad_slot";
  const open = phaseOf(config, slot) < config.epoch_tail_start;
  if (tickets.length > (open ? config.max_tickets_per_extrinsic : 0)) return "unexpected_ticket";
  if (tickets.length === 0) return null;
  const newEpoch = epochOf(config, slot) > epochOf(config, before.time);
  const { pending } = newEpoch ? rotateValidators(before.validators, offenders) : before.validators;
  const n = attemptsAllowed(config, pending.length); // γ′_P's size
  if (tickets.some((t) => t.attempt >= n)) return "bad_ticket_attempt";
  const ids = tickets.map((t) => toHex(ticketId(t)));
  if (ids.some((id, i) => i > 0 && id <= ids[i - 1])) return "bad_ticket_order";
  const held = new Set(before.accumulator.map((t) => toHex(t.id)));
  if (ids.some((id) => held.has(id))) return "duplicate_ticket";
  const ring = newEpoch ? ringRootOf(config, pending) : before.ringRoot; // γ′_Z
  const eta2 = newEpoch ? before.entropy[1] : before.entropy[2]; // η′₂
  const proofs = tickets.map((t) => ({ proof: t.signature, input: ticketInput(eta2, t.attempt) }));
  if (!ringProofsHold(ring, config.validators_count, proofs)) return "bad_ticket_proof";
  return null;
}
```

```ts
  const ring = newEpoch ? ringRootOf(config, pending) : before.ringRoot; // γ′_Z
  const eta2 = newEpoch ? before.entropy[1] : before.entropy[2]; // η′₂
```

At a new epoch the ring is the one this block makes, and η′₂ is η₁, moved along one
([lesson 8.1](./01-stirring-the-entropy.md)). It needs the offenders now, for γ′_P, so it takes them as its last argument.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ a whole step of Safrole: the state and both marks, for each block without tickets (1528.694583ms)
...
✔ γ′_Z: at a new epoch, the ring root of the new pending validators (1461.491125ms)
✔ a forged ring proof: bad_ticket_proof (15.362583ms)
...
ℹ tests 85
ℹ suites 0
ℹ pass 85
ℹ fail 0
...
reported 85 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791771407614
...
```

Every safrole vector passes now: 33 accepted blocks, ring roots and all, and 13 refused.

## Watch it

`bin/safrole.ts` shows the ring root, and passes the offenders on:

**Rewrite** `bin/safrole.ts`

```ts
// Runs one block of Safrole from a safrole test vector, tickets and all, tells what
// happened (or why the block is refused), and checks the result against the vector.
// Usage: npm run safrole <vector.json>, e.g.
//        npm run safrole ../vectors/stf/safrole/tiny/enact-epoch-change-with-padding-1.json

import { readFileSync } from "node:fs";
import { isDeepStrictEqual } from "node:util";
import { fromHex, toHex } from "../src/bytes.ts";
import { FULL, TINY } from "../src/config.ts";
import { Run } from "../src/obs.ts";
import { safroleError, safroleFromJson, safroleStep, ticketId } from "../src/safrole.ts";
import { TicketEnvelope } from "../src/block.ts";

const [file] = process.argv.slice(2);
const config = file.includes("/full/") ? FULL : TINY;
const { input, pre_state, post_state, output } = JSON.parse(readFileSync(file, "utf8"));
const before = safroleFromJson(pre_state);
const offenders = pre_state.post_offenders.map(fromHex);
const tickets = input.extrinsic.map((t: unknown) => TicketEnvelope.fromJson(t));

const run = new Run("safrole");
const told = (what: string) => {
  console.log(what);
  run.event("told", { what });
};
const short = (hash: Uint8Array) => `${toHex(hash).slice(0, 10)}…`;
for (const t of tickets) told(`a ticket: attempt ${t.attempt}, id ${short(ticketId(t))}`);
const error = safroleError(config, before, input.slot, tickets, offenders);
if (error) {
  told(`refused: ${error} (the vector says: ${output.err})`);
  const link = await run.report();
  if (link) console.log(`reported to Grafana: ${link}`);
  process.exit(0);
}
const step = safroleStep(config, before, input.slot, fromHex(input.entropy), offenders, tickets);
const { after, epochMark, ticketsMark } = step;
told(`slot ${before.time} → ${after.time}`);
told(`η₀ stirred: ${short(before.entropy[0])} → ${short(after.entropy[0])}`);
told(`a new epoch: ${epochMark !== null}`);
const zeroed = after.validators.pending.filter((k) => k.ed25519.every((b) => b === 0)).length;
if (epochMark) told(`validators moved along one set; offenders zeroed: ${zeroed}`);
const ring = toHex(after.ringRoot) === toHex(before.ringRoot) ? "unchanged" : "new";
told(`ring root γ_Z: ${ring}, ${short(after.ringRoot)}`);
const sealers = "tickets" in after.sealers ? "the lottery's winners" : "fallback keys";
told(`sealers: ${sealers}; tickets mark: ${ticketsMark !== null}`);
const best = after.accumulator[0]; // the lowest id: the best ticket
const held = after.accumulator.length;
if (best) told(`the lottery holds ${held} ticket(s), the best ${short(best.id)}`);
const matches = isDeepStrictEqual(after, safroleFromJson(post_state));
told(`the whole state after matches the vector: ${matches}`);
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

**Run**

```sh
npm pkg set scripts.safrole-no-tickets="node bin/safrole.ts ../vectors/stf/safrole/tiny/enact-epoch-change-with-no-tickets-4.json"
npm run safrole-no-tickets
npm pkg set scripts.safrole-tickets-5="node bin/safrole.ts ../vectors/stf/safrole/tiny/publish-tickets-no-mark-5.json"
npm run safrole-tickets-5
```

```text
slot 10 → 15
η₀ stirred: 0xf164ce89… → 0x760612c5…
a new epoch: true
validators moved along one set; offenders zeroed: 0
ring root γ_Z: new, 0xa778826f…
sealers: fallback keys; tickets mark: false
the whole state after matches the vector: true
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=safrole-1791771413102
a ticket: attempt 3, id 0x34341918…
a ticket: attempt 1, id 0x5af49b10…
a ticket: attempt 3, id 0xd6feae23…
refused: bad_ticket_proof (the vector says: bad_ticket_proof)
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=safrole-1791771413261
```

A new epoch, a new ring root; and three tickets whose ids are in order and whose attempts
are fine, refused anyway: their proofs don't check out.

## The scoreboard

With ticket proofs checked, Safrole can run its family whole. `stf/safrole` is the first
of the state-transition families, and they all share a shape: `pre_state` is the part of
the state the rule reads, `input` the part of the block, and what comes out is
`post_state` and `output`. The output is `ok`, with what the rule says back (here, the
header's two marks), or `err`, the name of the rule a refused block breaks.

Run whole means all of it. A refused block must be refused for the vector's reason, and
then it changes nothing. An accepted block must leave every part of the state as the
vector says. A part the rule doesn't make (Safrole doesn't touch `post_offenders`) must
stay as it was, and the check makes sure the vector agrees:

**Add to** `test/families.ts`

```ts
import { EpochMark, TicketBody, TicketEnvelope } from "../src/block.ts";
import type { SafroleJson } from "../src/safrole.ts";
import { safroleError, safroleFromJson, safroleStep } from "../src/safrole.ts";

/** A state-transition vector: the input, the state before and after, and the output. */
type StfVector<Input, State> = {
  input: Input;
  pre_state: State;
  post_state: State;
  output: { ok?: unknown; err?: string } | null;
};

/** Your client's error for a vector's block, or null: the vector's, or null if it has none. */
function sameError(error: string | null, vector: StfVector<unknown, object>) {
  const expected = vector.output?.err ?? null;
  assert.equal(error, expected, `${error ?? "accepted"}, not ${expected ?? "accepted"}`);
}

/** The parts of a vector's state your client didn't make: each must be as it was before.
 * A refused block makes nothing, so all of its state stays. */
function unchanged(vector: StfVector<unknown, object>, made: string[]) {
  const before = vector.pre_state as Record<string, unknown>;
  const after = vector.post_state as Record<string, unknown>;
  for (const key of Object.keys(after)) {
    if (!made.includes(key)) assert.deepEqual(after[key], before[key], `${key} changed`);
  }
}

type SafroleInput = { slot: number; entropy: string; extrinsic: unknown[] };
type SafroleVector = StfVector<SafroleInput, SafroleJson & { post_offenders: string[] }>;

/** A Safrole vector: τ′, η′, the four validator sets, the lottery, the sealers and the ring
 * root, and the header's two marks. */
function checkSafrole(name: string) {
  const vector = vectorJson(name) as SafroleVector;
  const config = configOf(name);
  const { input, pre_state } = vector;
  const before = safroleFromJson(pre_state);
  const tickets = input.extrinsic.map((t) => TicketEnvelope.fromJson(t));
  const offenders = pre_state.post_offenders.map(fromHex);
  const error = safroleError(config, before, input.slot, tickets, offenders);
  sameError(error, vector);
  if (error) return unchanged(vector, []);
  const vrfOutput = fromHex(input.entropy);
  const step = safroleStep(config, before, input.slot, vrfOutput, offenders, tickets);
  assert.deepEqual(step.after, safroleFromJson(vector.post_state), "the state after differs");
  const ok = vector.output?.ok as { epoch_mark: unknown; tickets_mark: unknown[] | null };
  const epochMark = ok.epoch_mark ? EpochMark.fromJson(ok.epoch_mark) : null;
  assert.deepEqual(step.epochMark, epochMark, "epoch_mark differs");
  const ticketsMark = ok.tickets_mark?.map((t) => TicketBody.fromJson(t)) ?? null;
  assert.deepEqual(step.ticketsMark, ticketsMark, "tickets_mark differs");
  unchanged(vector, [
    "tau", "eta", "iota", "gamma_k", "kappa", "lambda", "gamma_a", "gamma_s", "gamma_z",
  ]);
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
];
```

`safroleFromJson` reads every part of Safrole's state, so one `deepEqual` compares nine
of them at once. Every vector runs at its own size, `configOf` reading it from the folder.

The vector that needs the ring root most is an epoch change: the staging keys become the new ring, and the state must end with the matching `gamma_z`.

::: code-group

```json [what goes in]
{
  "vector": "vectors/stf/safrole/tiny/enact-epoch-change-with-padding-1.json",
  "input": {
    "slot": 48,
    "entropy": "0x8c2e6d327d\u2026"
  },
  "pre_state": {
    "gamma_z": "0xaf39b7de5fcf\u2026"
  },
  "post_state": {
    "gamma_z": "0xa6c2f622ccf6\u2026"
  }
}
```

```text [console]
stf/safrole              46 of 46  ✔
78 of 1,428 vectors pass.
```

:::

Run whole means the state after slot 48 equals the vector's, `gamma_z` included, byte for byte; a ring root that was one key off would fail it, and with it the family row.

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
stf/accumulate           not run yet (126)
stf/assurances           not run yet (22)
stf/authorizations       not run yet (6)
stf/disputes             not run yet (60)
stf/history              not run yet (8)
stf/preimages            not run yet (16)
stf/reports              not run yet (92)
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

78 of 1,428 vectors pass.
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=scoreboard-1791939093198
```

> [!TIP] Milestone
> **Every Safrole vector.** All 46, tiny and full, whole: the state after each
> block, both header marks, and every refused block refused for the vector's reason,
> forged ticket proofs included. Your first state-transition family.

<details>
<summary>lasair: ark-vrf too, in <code>rust/bandersnatch-ffi/src/lib.rs</code></summary>

lasair wraps ark-vrf itself, in a small Rust library of its own that OCaml calls. Its
ring root, comments trimmed:

```rust
    let mut ring: Vec<AffinePoint> = Vec::with_capacity(ring_size);
    for i in 0..ring_size {
        let key_slice = &keys_bytes[i * 32..(i + 1) * 32];
        match AffinePoint::deserialize_compressed_unchecked(key_slice) {
            Ok(point) => ring.push(point),
            Err(_) => {
                // Use padding point for undecodable keys
                ring.push(RingProofParams::padding_point());
            }
        }
    }
```

Step 2, line for line: each key that decodes as a point stays, and any other becomes the
padding point. The comment it trims explains one subtle choice: `unchecked` decodes a key
without a stricter test (that the point is in the curve's main subgroup), because ark-vrf
skips that test too, and a stricter client would turn some keys into padding and make a
different ring root. No vector has such a key, so the HARDENING list keeps it, for the
fuzzer.

</details>

## Check your understanding

::: check
**γ′_Z is the ring root of which validators?**

- [ ] κ′, the validators active this epoch
  > No: tickets entered this epoch win slots in the next one, so they're checked against
  > the next epoch's validators.
- [x] γ′_P, the validators who'll be active next epoch
  > Yes: a ticket proves "one of next epoch's validators made me", so the ring is theirs.
- [ ] Every validator in all four sets
  > No: one ring, one set: γ′_P, the newly pending validators.

**Why does a ticket carry a ring proof, and not an ordinary signature?**

- [x] It proves one of the ring's validators made it, without saying which
  > Yes: so nobody knows who holds a winning ticket until that validator makes its block,
  > and nobody can plan an attack on it.
- [ ] A ring proof is shorter
  > No: it's 784 bytes; an Ed25519 signature is 64. Keeping the author secret is worth the
  > size.
- [ ] An ordinary signature can't be checked against keys in the state
  > No: assurances are, against κ's Ed25519 keys ([lesson 6.3](../06-state-and-merklization/03-reading-the-state.md)). But an ordinary
  > signature says who signed, and a ticket mustn't.

**On tiny, one validator's key in γ′_P is an offender's, zeroed. What does the ring hold in its place?**

- [ ] Nothing: the ring shrinks to 5 keys
  > No: the ring has a fixed size, the chain's validator count, 6 on tiny.
- [ ] The 32 zero bytes, as they are
  > No: a ring is made of points on the curve. A key that isn't one is swapped out.
- [x] The padding point
  > Yes: a key that isn't a point on the curve becomes padding, and the ring stays at 6.

**A ticket's proof is made for X_T ⌢ η′₂ ⌢ its attempt. Why η′₂?**

- [ ] It shouldn't matter: any entropy would do, even η₀
  > No: η₀ changes with every block. A proof made for one η₀ would stop checking out a
  > block later, and block authors stir it.
- [x] It's entropy from two epochs back, fixed before anyone could make a ticket for it
  > Yes: nobody could have shaped it to suit their tickets, and it stays the same for the
  > whole epoch the tickets are entered in.
- [ ] No entropy is needed: the attempt alone would do
  > No: a VRF's output depends only on its key and input. Without entropy, each validator's
  > ids would be the same every epoch, and so would the lottery's result.
:::

## What you have

Safrole with real cryptography: ring roots for each new set of validators, and ticket
proofs checked against them. All 46 safrole vectors pass, whole. One check is left, on every
block rather than every ticket: is the block's seal real? [Lesson 8.9](./09-seals.md).

Next: [8.9 Seals](./09-seals.md)
