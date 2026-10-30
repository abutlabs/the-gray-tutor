# Seals

Every block is signed twice by its author, with Bandersnatch VRF signatures. The *seal*
proves the author may make a block in this slot; the *entropy source* is the randomness
[lesson 8.6](./06-the-vrf-output.md) reads. Until now your client has believed both. This lesson checks them,
Safrole's last rules: a forged seal, a stranger's block, or a block sealed without the
slot's ticket is refused, and 198 real blocks pass.

## New words

- **Unsigned header.** ℰ_U(H). The header's bytes without the seal at the end: what the
  seal signs. *Example:* most of the `safrole` trace's headers are 297 bytes, so 201 unsigned.
- **Ticket-sealed block.** A block sealed by the holder of the slot's winning ticket,
  rather than by a fallback key. *Example:* blocks 48 to 83 of the `safrole` trace.

Both are in the [glossary](../glossary.md). (The *seal* itself is from [lesson 8.3](./03-the-fallback-sealers.md).)

## What the Gray Paper says

§6, *Sealing and Entropy Accumulation*. Let i be the slot's entry in γ′_S, the sealers
after this block ([lesson 8.4](./04-the-lotterys-winners.md)), and H_A the author's Bandersnatch key, κ′[H_I]. Then:

1. **A ticket-sealed slot** (γ′_S holds tickets): H_S is H_A's signature on ℰ_U(H), for the
   context X_T ⌢ η′₃ ⌢ i's attempt, and 𝒴(H_S) must be i's id. Only the validator who
   entered that ticket can make that signature: a ticket's id is the output of the same
   key on the same input, and the seal's output must match it.
2. **A fallback slot** (γ′_S holds keys): i must be H_A itself, and H_S is H_A's signature
   on ℰ_U(H), for X_F ⌢ η′₃ (X_F is "jam_fallback_seal").
3. **The entropy source**: H_V is H_A's signature on nothing, for the context
   X_E ⌢ 𝒴(H_S) (X_E is "jam_entropy").

η′₃ is the entropy as it was three epochs ago: fixed long before the epoch's tickets.
It is the very value the tickets were entered with. They were entered last epoch, against
η′₂ ([lesson 8.7](./07-entering-tickets.md)); at the epoch change the history moved along one place, so that η′₂ is
η′₃ now.

Notice the order: H_V comes before H_S in the header, so the seal signs the entropy source
too. Change one bit of H_V and the seal fails first.

<SealCheck />

To find γ′_S in a real state, your client reads Safrole's own state component, C(4), whole
(Appendix D): γ_P, γ_Z, then γ_S (a 0 and E tickets, or a 1 and E keys), then γ_A.

## The tests

**Add to** `test/safrole.test.ts`

```ts
import { sealError } from "../src/safrole.ts";
import { Block } from "../src/block.ts";
import type { Header } from "../src/block.ts";
import { readEntropy, readSafroleState, readValidators } from "../src/state.ts";
import { traceState } from "./vectors.ts";

/** Block n of a tiny trace, and what its seal is checked against: κ′, γ′_S and η′₃. */
function sealed(family: string, n: number) {
  const { block } = traceState(family, n);
  const header: Header = Block(TINY).fromJson(block).header;
  const after = traceState(family, n + 1).entries; // the state after block n
  const author: Bytes = readValidators(after)[header.author_index].bandersnatch;
  const { sealers } = readSafroleState(TINY, after);
  return { header, author, sealers, eta3: readEntropy(after)[3] };
}

test("the seal and entropy source of 198 real blocks, 36 of them sealed by tickets", () => {
  let tickets = 0;
  for (const family of ["fallback", "safrole"]) {
    for (let n = 1; n < 100; n++) {
      const { header, author, sealers, eta3 } = sealed(family, n);
      const error: string | null = sealError(TINY, header, author, sealers, eta3);
      assert.equal(error, null, `${family} block ${n}`);
      if ("tickets" in sealers) tickets++;
    }
  }
  assert.equal(tickets, 36);
});

test("a forged seal, or a stranger's: refused; and the seal guards the entropy source", () => {
  const { header, author, sealers, eta3 } = sealed("safrole", 5);
  const seal: Bytes = header.seal.slice();
  seal[40] ^= 1; // one bit of the signature's proof flipped
  const forged: string | null = sealError(TINY, { ...header, seal }, author, sealers, eta3);
  assert.equal(forged, "bad_seal");
  const stranger: Bytes = sealed("safrole", 6).author; // another validator's key
  const notTheAuthor: string | null = sealError(TINY, header, stranger, sealers, eta3);
  assert.equal(notTheAuthor, "bad_seal");
  const source: Bytes = header.entropy_source.slice();
  source[40] ^= 1; // the seal signs the header, entropy source and all
  const changed: Header = { ...header, entropy_source: source };
  const badSource: string | null = sealError(TINY, changed, author, sealers, eta3);
  assert.equal(badSource, "bad_seal");
});
```

`sealed` reads what a block's seal is checked against from the state *after* the block:
κ′, γ′_S and η′₃.

First, γ_S from the state:

**Add to** `src/state.ts`

```ts
import type { Config } from "./config.ts";
import { TicketBody } from "./block.ts";
import type { Sealers } from "./safrole.ts";

/** γ_S as the state writes it (GP App. D): 0, then E tickets; or 1, then E keys. */
export function SealersCodec(config: Config): Codec<Sealers> {
  const tickets = seqN(TicketBody, config.epoch_length);
  const keys = seqN(hash, config.epoch_length);
  return {
    encode: (w, sealers) => {
      w.natural("tickets" in sealers ? 0n : 1n);
      if ("tickets" in sealers) tickets.encode(w, sealers.tickets);
      else keys.encode(w, sealers.keys);
    },
    decode: (r) =>
      r.field("kind", () => r.natural()) === 0n
        ? { tickets: tickets.decode(r) }
        : { keys: keys.decode(r) },
    fromJson: (json) => {
      const { tickets: t, keys: k } = json as { tickets?: unknown[]; keys?: unknown[] };
      return t ? { tickets: tickets.fromJson(t) } : { keys: keys.fromJson(k) };
    },
  };
}

/** γ, C(4) (GP App. D): Safrole's own state, γ_P, γ_Z, γ_S and γ_A. */
export function SafroleState(config: Config) {
  return record({
    pending: seq(ValidatorKey), // γ_P
    ring_root: fixedBytes(144), // γ_Z
    sealers: SealersCodec(config), // γ_S
    accumulator: seq(TicketBody), // γ_A
  });
}
export type SafroleState = Value<ReturnType<typeof SafroleState>>;

/** γ, C(4): Safrole's own part of the state. */
export function readSafroleState(config: Config, entries: KeyValue[]): SafroleState {
  return component(entries, 4, SafroleState(config));
}
```

Then a stub that believes every seal:

**Add to** `src/safrole.ts`

```ts
import { Header } from "./block.ts";

/**
 * Why a header's seal or entropy source is wrong (GP §6), or null if both check out. The
 * author's Bandersnatch key (κ′[H_I]) must have signed the header without its seal, for the
 * context of its slot's entry in γ′_S: a winning ticket (X_T ⌢ η′₃ ⌢ its attempt, and the
 * seal's output must be that ticket's id) or a fallback key (X_F ⌢ η′₃, and it must be the
 * author's). The entropy source must be the author's signature on X_E ⌢ the seal's output.
 */
export function sealError(
  config: Config,
  header: Header,
  author: Bytes, // κ′[H_I]: the author's Bandersnatch key
  sealers: Sealers, // γ′_S
  eta3: Bytes, // η′₃
): string | null {
  return null; // for now, every seal is fine
}
```

**Run, expect it to fail**

```sh
npm test
```

```text
...
✔ the seal and entropy source of 198 real blocks, 36 of them sealed by tickets (187.251458ms)
✖ a forged seal, or a stranger's: refused; and the seal guards the entropy source (1.934792ms)
...
ℹ tests 87
ℹ suites 0
ℹ pass 86
ℹ fail 1
...
    actual: null,
    expected: 'bad_seal',
...
```

The real blocks pass, of course: the stub believes them. The forgeries pass too, and
that's the red.

## The code

**Add to** `src/bandersnatch.ts`

```ts
/**
 * Checks a Bandersnatch VRF signature (GP App. G): made with `key`, for `context` (the
 * VRF's input), on `message`. Its output, 𝒴, if it checks out; null if it doesn't.
 */
export function checkSignature(key: Bytes, signature: Bytes, context: Bytes, message: Bytes) {
  const result = library.verifySeal(key, signature, context, message);
  return result[0] === 0 ? Uint8Array.from(result.subarray(1, 33)) : null;
}
```

**Add to** `src/safrole.ts`

```ts
/** X_F and X_E (GP §6): the contexts of a fallback seal and of the entropy source. */
const FALLBACK_SEAL = new TextEncoder().encode("jam_fallback_seal");
const ENTROPY = new TextEncoder().encode("jam_entropy");
```

**Replace in** `src/safrole.ts`

```ts
import { checkSignature } from "./bandersnatch.ts";
import { encode } from "./codec/codec.ts";

/**
 * Why a header's seal or entropy source is wrong (GP §6), or null if both check out. The
 * author's Bandersnatch key (κ′[H_I]) must have signed the header without its seal, for the
 * context of its slot's entry in γ′_S: a winning ticket (X_T ⌢ η′₃ ⌢ its attempt, and the
 * seal's output must be that ticket's id) or a fallback key (X_F ⌢ η′₃, and it must be the
 * author's). The entropy source must be the author's signature on X_E ⌢ the seal's output.
 */
export function sealError(
  config: Config,
  header: Header,
  author: Bytes, // κ′[H_I]: the author's Bandersnatch key
  sealers: Sealers, // γ′_S
  eta3: Bytes, // η′₃
): string | null {
  const encoded = encode(Header(config), header);
  const unsigned = encoded.subarray(0, encoded.length - 96); // ℰ_U(H): all but the seal
  const phase = phaseOf(config, header.slot);
  let output: Bytes | null;
  if ("tickets" in sealers) {
    const ticket = sealers.tickets[phase];
    const context = concatBytes(TICKET_SEAL, eta3, Uint8Array.of(ticket.attempt));
    output = checkSignature(author, header.seal, context, unsigned);
    if (!output || toHex(output) !== toHex(ticket.id)) return "bad_seal";
  } else {
    if (toHex(sealers.keys[phase]) !== toHex(author)) return "bad_seal"; // not this slot's
    output = checkSignature(author, header.seal, concatBytes(FALLBACK_SEAL, eta3), unsigned);
    if (!output) return "bad_seal";
  }
  const context = concatBytes(ENTROPY, output);
  const source = checkSignature(author, header.entropy_source, context, new Uint8Array(0));
  return source ? null : "bad_entropy_source";
}
```

```ts
  const encoded = encode(Header(config), header);
  const unsigned = encoded.subarray(0, encoded.length - 96); // ℰ_U(H): all but the seal
```

The seal is the header's last field and always 96 bytes, so the unsigned header is the
encoded header without its last 96 bytes.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ the seal and entropy source of 198 real blocks, 36 of them sealed by tickets (355.603459ms)
✔ a forged seal, or a stranger's: refused; and the seal guards the entropy source (2.706ms)
...
ℹ tests 87
ℹ suites 0
ℹ pass 87
ℹ fail 0
...
reported 87 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791771418763
...
```

## Watch it

**New file** `bin/seals.ts`

```ts
// Checks the seal and entropy source of real blocks: the first blocks of a block-import
// trace, each against the author's key, the slot's entry in γ′_S, and η′₃.
// Usage: npm run seals [family] [from] [to], blocks 46 to 50 of "safrole" if not given

import { Block } from "../src/block.ts";
import { toHex } from "../src/bytes.ts";
import { TINY } from "../src/config.ts";
import { Run } from "../src/obs.ts";
import { sealError } from "../src/safrole.ts";
import { readEntropy, readSafroleState, readValidators } from "../src/state.ts";
import { traceState } from "../test/vectors.ts";

const family = process.argv[2] ?? "safrole";
const [from, to] = [Number(process.argv[3] ?? 46), Number(process.argv[4] ?? 50)];
const run = new Run("seals");
for (let n = from; n <= to; n++) {
  const header = Block(TINY).fromJson(traceState(family, n).block).header;
  const after = traceState(family, n + 1).entries; // the state after block n
  const author = readValidators(after)[header.author_index].bandersnatch;
  const { sealers } = readSafroleState(TINY, after);
  const error = sealError(TINY, header, author, sealers, readEntropy(after)[3]);
  const by = "tickets" in sealers ? "a winning ticket" : "a fallback key";
  const verdict = error ?? "seal and entropy source check out";
  const who = `validator ${header.author_index} (${toHex(author).slice(0, 10)}…)`;
  console.log(`block ${n}, slot ${header.slot}: ${who}, by ${by}: ${verdict}`);
  run.event("block", { n, slot: header.slot, author: header.author_index, by, verdict });
}
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

**What flows through it.** Real blocks again: each trace file holds a block, and the
*next* file holds the state after it, where the author's key, γ′_S and η′₃ live. Block
46's share, what the program computes, and what it prints:

::: code-group

```json [what goes in]
{
  "block": {
    "header": {
      "slot": 46,
      "author_index": 5,
      "entropy_source": "0xe10ff5e2736f…",
      "seal": "0x53564eb6d683…"
    }
  }
}
```

```ts [what it computes]
// bin/seals.ts's values for block 46, checked against the state after it
const computed = {
  author: "0x21056509…", // κ′[5]'s Bandersnatch key, read from the next file's state
  sealers: "fallback keys", // γ′_S holds keys, not tickets: slot 46 ends a fallback epoch
  context: "X_F ⌢ η′₃", // what the 96-byte seal must sign, under that key
  entropySource: "signs X_E ⌢ 𝒴(seal)", // the second VRF, chained to the first
  error: null, // sealError found nothing wrong: both signatures verify
};
```

```text [what comes out]
block 46, slot 46: validator 5 (0x21056509…), by a fallback key: seal and entropy source check out
```

:::

Read the input into the output: `author_index` 5 names the sealer, and the state after
the block (`../vectors/traces/safrole/00000046.json` is the block; 47's file holds that
state) gives κ′[5]'s Bandersnatch key, the `0x2105…` in the line. γ′_S for slot 46 holds
a fallback *key*, so the 96-byte `seal` must be that validator's VRF over X_F ⌢ η′₃, and
`entropy_source` must sign X_E ⌢ the seal's own output — the chain this lesson built.

**Run**

```sh
npm pkg set scripts.seals="node bin/seals.ts"
npm run seals
```

```text
block 46, slot 46: validator 5 (0x21056509…), by a fallback key: seal and entropy source check out
block 47, slot 47: validator 0 (0xff71c6c0…), by a fallback key: seal and entropy source check out
block 48, slot 48: validator 2 (0x9326edb2…), by a winning ticket: seal and entropy source check out
block 49, slot 49: validator 1 (0xdee6d555…), by a winning ticket: seal and entropy source check out
block 50, slot 50: validator 2 (0x9326edb2…), by a winning ticket: seal and entropy source check out
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=seals-1791771424353
```

Blocks 46 and 47 are the end of a fallback epoch. Block 48 starts a new epoch whose
lottery filled up, so from then on each block's author proves it holds the slot's winning
ticket. The *Seals* panel, on **3 · Consensus**, lists them.

![Seals panel](./images/09-seals.png)

<details>
<summary>lasair: the seal, in <code>conformance/stf_guarantees.ml</code></summary>

```ocaml
    (* fallback identity check (eq. 152) — cheap, no crypto *)
    (match seal_entry with
     | `Fallback k when not (Bytes.equal k author_bs) ->
       raise (Reject "bad_seal")
     | _ -> ());
```

and, after the seal's own signature check:

```ocaml
          (match seal_entry with
           | `Ticket (tid, _) when not (Bytes.equal seal_out tid) ->
             raise (Reject "bad_seal")
           | _ -> ());
```

Steps 1 and 2, as your `sealError` takes them: a fallback slot's key must be the author's,
and a ticket-sealed slot's seal output must be the ticket's id. lasair names its
entropy-source failure `bad_vrf`; your client says `bad_entropy_source`. No test vector
names either, so the names are each client's own. lasair finds the slot's entry in γ′_S by
reading C(4)'s bytes at fixed offsets; the comment above it records a block from the
official fuzzer in which "author 5 claims slot 1, which F assigns to validator 0": the
identity check in step 2, catching a stranger.

</details>

## Check your understanding

::: check
**Most `safrole` trace headers are 297 bytes. How many of them does the seal sign, and why?**

- [x] 201: everything but the seal, the last 96 bytes
  > Yes: ℰ_U(H) is the header without its seal. A signature can't sign itself.
- [ ] 297: the whole header
  > No: the seal is part of the header, and it can't sign its own bytes before they exist.
- [ ] 105: everything but the seal and the entropy source
  > No: the entropy source comes before the seal, so the seal signs it too.
  > 297 − 96 − 96 = 105 would leave it out.

**In a ticket-sealed slot, how does the seal prove its author holds the winning ticket?**

- [ ] The seal carries the ticket's ring proof
  > No: a seal is 96 bytes, and a ring proof 784.
- [x] The seal's output must equal the ticket's id, and only the same key on the same input gives that output
  > Yes: the seal is made for the input the ticket was. Only the validator whose key made
  > the ticket can make a seal whose 𝒴 is its id.
- [ ] The ticket records which validator entered it
  > No: tickets are anonymous; that's what the ring proof is for. Nothing says who holds
  > one until the seal shows it.

**Flip one bit of a block's entropy source. Which check fails?**

- [ ] The entropy source's own check: `bad_entropy_source`
  > No: that check comes second. The seal signs the header, entropy source included, so
  > the seal fails first.
- [x] The seal: `bad_seal`
  > Yes: H_V sits before H_S in the header, inside ℰ_U(H). Change it, and the seal no
  > longer matches what was signed.
- [ ] Neither: the entropy source is only randomness, so any bytes will do
  > No: it must be the author's signature too, on X_E ⌢ the seal's output, and the seal
  > covers it.

**In a fallback slot, validator 5 makes a perfectly good seal with its own key, but F gave the slot to validator 0. What happens?**

- [x] Refused, `bad_seal`: the slot's key in γ′_S must be the author's
  > Yes: that check needs no cryptography at all. The official fuzzer sent lasair just
  > such a block: "author 5 claims slot 1, which F assigns to validator 0".
- [ ] Accepted: the signature checks out
  > No: a good signature only shows who signed. What matters is whether that validator
  > may seal this slot.
- [ ] Accepted, but its randomness doesn't count
  > No: a block is valid or it isn't. This one isn't.
:::

## What you have

All of Safrole: the entropy, the validators, the sealers, the lottery with its tickets and
proofs, the ring root, and every block's seal and entropy source checked. Your client no
longer takes a block's word for anything Safrole decides. [Part 9](../09-recent-history/index.md) builds the other
memory every block updates: the recent history of the chain itself.

Next: [Part 9 · Recent history](../09-recent-history/index.md)
