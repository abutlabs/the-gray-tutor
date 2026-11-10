# The header

The header is a block's cover page: a few hundred bytes that say where the block sits
in the chain, who made it, and what's inside, sealed with the author's signature. Every
node reads every header. It's the most-read structure in JAM, and now your client can
read it too.

## New words

- **Epoch mark.** At an epoch's first block only: fresh randomness, and the keys of the
  validators who take over in the epoch after this one. *Example:* most headers have none.
- **Tickets mark.** At most once per epoch, when the lottery closes having filled every
  slot: the winning ticket for every slot of the next epoch. *Example:* 600 tickets on
  full.
- **Seal.** The author's signature over the rest of the header. *Example:* 96 bytes, the
  last field.
- **Offenders mark.** The Ed25519 keys of the validators a block convicts in its
  disputes. *Example:* empty in almost every block.

All four are in the [glossary](../glossary.md).

## What the Gray Paper says

§5 (*The Header*) opens with its ten fields:

::: gray-paper 5 1-2

#### §5 The Header {#gp-5}

<a id="gp-5-p1"></a>We must first define the header in terms of its components. The header comprises a parent hash and prior state root ($\mathbf{H}_{P}$ and $\mathbf{H}_{R}$), an extrinsic hash $\mathbf{H}_{X}$, a time-slot index $\mathbf{H}_{T}$, the epoch, winning-tickets and offenders markers $\mathbf{H}_{E}$, $\mathbf{H}_{W}$ and $\mathbf{H}_{O}$, a block author index $\mathbf{H}_{I}$ and two Bandersnatch signatures; the entropy-yielding VRF signature $\mathbf{H}_{V}$ and a block seal $\mathbf{H}_{S}$. Headers may be serialized to an <abbr class="gp-term" title="a byte: 8 bits">octet</abbr> sequence with and without the latter seal component using $\mathcal{E}_{}$ and $\mathcal{E}_{U}$ respectively. Formally:

<a id="gp-5-p2"></a><a id="eq-5-1"></a>

$$
\begin{equation}
\mathbf{H} \equiv \left(\mathbf{H}_{P}, \mathbf{H}_{R}, \mathbf{H}_{X}, \mathbf{H}_{T}, \mathbf{H}_{E}, \mathbf{H}_{W}, \mathbf{H}_{O}, \mathbf{H}_{I}, \mathbf{H}_{V}, \mathbf{H}_{S}\right) \tag{5.1}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-theheader" class="gk-wrap">$\mathbf{H}$</span> | H | this block's header |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk--parent">$P$</span> | P | a header's parent hash: 𝐇_P is the hash of the header before it, 32 bytes |
| <span id="gk--priorstateroot">$R$</span> | R | a header's prior state root: 𝐇_R is the root of the state before this block, 32 bytes |
| <span id="gk--extrinsichash">$X$</span> | X | a header's extrinsic hash: 𝐇_X stands for the block's five bags, 32 bytes |
| <span id="gk--timeslot">$T$</span> | T | a header's timeslot: 𝐇_T is the slot this block was made for |
| <span id="gk--epochmark">$E$</span> | E | a header's epoch mark: 𝐇_E, at an epoch's first block only, the next epoch's entropy and validator keys |
| <span id="gk--winnersmark">$W$</span> | W | a header's winning-tickets mark: 𝐇_W, at most once an epoch, a ticket for every slot of the next (12 on tiny, 600 on full) |
| <span id="gk--offendersmark">$O$</span> | O | a header's offenders mark: 𝐇_O, the Ed25519 keys of the validators this block convicts |
| <span id="gk--authorindex">$I$</span> | I | a header's author index: 𝐇_I, which validator made the block, a position in κ′ |
| <span id="gk--vrfsig">$V$</span> | V | a header's VRF signature: 𝐇_V, 96 bytes of the author's fresh randomness; the vectors' entropy source |
| <span id="gk--sealsig">$S$</span> | S | a header's seal: 𝐇_S, the author's 96-byte Bandersnatch signature on the rest of the header |

</details>

→ [(5.1) in plain words](./gray-paper.md#ex-5-1)

:::

In plain words, here are the ten, in the order Appendix C encodes them, with the names the
vectors give them:

| Field | What it says |
| --- | --- |
| `parent` | the parent block's header hash: the link in the chain |
| `parent_state_root` | the state root after the parent block |
| `extrinsic_hash` | a hash committing to this block's extrinsic ([Part 4](./index.md)'s five bags) |
| `slot` | the timeslot ([lesson 0.4](../00-start/04-the-jam-clock.md)), ℰ₄ |
| `epoch_mark` | at an epoch's first block only: fresh randomness, and the keys of the validators who take over in the epoch after it |
| `tickets_mark` | at most once per epoch, when the ticket lottery closes with every slot filled: the winning ticket for every slot of the next epoch |
| `author_index` | which validator made this block, ℰ₂ |
| `entropy_source` | a VRF signature: 96 bytes of verifiable fresh randomness |
| `offenders_mark` | the Ed25519 keys of validators newly convicted in disputes ([lesson 4.4](./04-disputes.md)) |
| `seal` | the author's signature over all of the above |

(C.22) and (C.23), in [lesson 4.7](./07-the-block.md#eq-C-22), are Appendix C's lines for
this order: (C.23) is the header without its seal, the bytes the seal signs, and (C.22)
adds the seal at the end.

§5 gives the slot a rule of its own:

::: gray-paper 5 11-13

#### §5 The Header, continued

<a id="gp-5-p11"></a>A block may only be regarded as valid once the time-slot index $\mathbf{H}_{T}$ is in the past. It is always strictly greater than that of its parent. Formally:

<a id="gp-5-p12"></a><a id="eq-5-8"></a>

$$
\begin{equation}
\mathbf{H}_{T} \in \mathbb{N}_T \,,\quad
P\left(\mathbf{H}\right)_{T} < \mathbf{H}_{T}\ \wedge\ \mathbf{H}_{T}\cdot\mathsf{P} \leq \mathcal{T} \tag{5.8}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-in">[$\in$](../symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-timeslot" class="gk-wrap">$\mathbb{N}_T$</span> | N sub T | a timeslot: a u32 counting 6-second slots |
| <span id="gk-getparent">$P\left(x\right)$</span> | P of | the parent of a header: P(𝐇) is the header of the block before |
| <span id="gk-wedge">$\wedge$</span> | and | both sides are true |
| <span id="gk-cdot">$\cdot$</span> | times | multiply |
| <span id="gk-Cslotseconds" class="gk-wrap">$\mathsf{P}$</span> | P | a slot's length: 6 seconds |
| <span id="gk-leq">$\leq$</span> | at most | less than or equal to |
| <span id="gk-wallclock" class="gk-wrap">$\mathcal{T}$</span> | T | the wall clock: seconds since the JAM Common Era began (2025-01-01 12:00 UTC) |

</details>

→ [(5.8) in plain words](./gray-paper.md#ex-5-8)

<a id="gp-5-p13"></a>Blocks considered invalid by this rule may become valid as $\mathcal{T}$ advances.

:::

In plain words: a block's slot is later than its parent's, and not in the future. Slot
42 began 42 × 6 = 252 seconds after JAM's clock started
([lesson 0.4](../00-start/04-the-jam-clock.md)), so a node whose clock reads less than
that holds the block back, and takes it once its clock catches up. Your client checks the
first half when it imports blocks ([lesson 19.4](../19-block-import/04-importing-a-block.md#the-code));
the vectors carry no clock, so nothing in the tutorial checks the second.

And the author, by number:

::: gray-paper 5 17-18

#### §5 The Header, continued

<a id="gp-5-p17"></a>All blocks have an associated public key to identify the author of the block. We identify this as an index into the <abbr class="gp-term" title="after the change: the value once it is made, written with a prime (α′); for state, after the block">posterior</abbr> current validator set $\kappa'$. We denote the Bandersnatch key of the author as $\mathbf{H}_{A}$ though note that this is merely an equivalence, and is not serialized as part of the header.

<a id="gp-5-p18"></a><a id="eq-5-10"></a>

$$
\begin{equation}
\mathbf{H}_{I} \in \mathbb{N}_{\left\vert\kappa'\right\vert} \,,\quad \mathbf{H}_{A} \equiv \kappa'[\mathbf{H}_{I}]_{b} \tag{5.10}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-Nmax">[$\mathbb{N}_{x}$](../symbols.md#naturals)</span> | N sub n | the whole numbers below n: ℕ_C is a core index, 0 to C − 1 |
| <span id="gk-len">$\left\vert x\right\vert$</span> | the size of | \|x\|: how many items x has, or how many bytes |
| <span id="gk-activeset" class="gk-wrap">$\kappa$</span> | kappa | the current validators: the keys of the V validators active this epoch |
| <span id="gk--authorbskey">$A$</span> | A | the author's Bandersnatch key: 𝐇_A, looked up in κ′ at 𝐇_I, never written in the header |
| <span id="gk-vk-bs">$b$</span> | b | a validator's Bandersnatch key: the first 32 of its 336 bytes |

</details>

→ [(5.10) in plain words](./gray-paper.md#ex-5-10)

:::

In plain words, `author_index` is a position in this epoch's validator list: 3 means the
fourth validator. H_A, its Bandersnatch key, is looked up there, never written in the
header. Two bytes name the author; the key that checks the seal
([Part 8](../08-safrole/index.md)) costs nothing to carry.

Last, the three markers:

::: gray-paper 5.1

#### §5.1 The Markers {#gp-5-1}

<a id="gp-5-1-p1"></a>If not $\emptyset$, then the epoch marker specifies key and entropy relevant to the following epoch in case the ticket contest does not complete adequately (a very much unexpected eventuality). Similarly, the winning-tickets marker, if not $\emptyset$, provides the series of 600 slot sealing “tickets” for the next epoch (see the next section). Finally, the offenders marker is the sequence of Ed25519 keys of newly misbehaving validators, to be fully explained in section [10](../10-disputes/index.md#gp-10-p1). Formally:

<a id="gp-5-1-p2"></a><a id="eq-5-11"></a>

$$
\begin{equation}
\mathbf{H}_{E} \in \!\left\lgroup\mathbb{H}_{}, \mathbb{H}_{}, \left[\!\left[\!\left\lgroup\overset{\backsim}{\mathbb{H}_{}}, \bar{\mathbb{H}_{}}\right\rgroup\!\right]\!\right]_{\mathbb{V}}\right\rgroup\!\boldsymbol{?}\,,\quad
\mathbf{H}_{W} \in \left[\!\left[\mathbb{T}\right]\!\right]_{\mathsf{E}}\boldsymbol{?}\,,\quad
\mathbf{H}_{O} \in \left[\!\left[\bar{\mathbb{H}_{}}\right]\!\right]_{} \tag{5.11}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-optional">$x\boldsymbol{?}$</span> | or nothing | a value of this type, or ∅ (null) |
| <span id="gk-tuple">$\!\left\lgroup x\right\rgroup\!$</span> | the tuple of | a record: named fields, each with its type, like an object in JSON |
| <span id="gk-hash">$\mathbb{H}$</span> | H | a 32-byte value, usually a hash |
| <span id="gk-sequence">[$\left[\!\left[x\right]\!\right]$](../symbols.md#sequence)</span> | a sequence of | ⟦T⟧ is an array of T; a subscript is its length, :n at most n, n: at least n |
| <span id="gk-valcount" class="gk-wrap">$\mathbb{V}$</span> | V (the set) | the validator counts allowed: multiples of 3 from 6 to 3C, which is 1,023 on full and 6 on tiny |
| <span id="gk-bskey" class="gk-wrap">$\overset{\backsim}{\mathbb{H}}$</span> | H tilde | a Bandersnatch public key: 32 bytes |
| <span id="gk-edkey" class="gk-wrap">$\bar{\mathbb{H}}$</span> | H bar | an Ed25519 public key: 32 bytes |
| <span id="gk-Cepochlen" class="gk-wrap">$\mathsf{E}$</span> | E | an epoch's length in slots: 600 on full, 12 on tiny |
| <span id="gk-safroleticket" class="gk-wrap">$\mathbb{T}$</span> | T | a ticket: a 32-byte id, and which of its maker's tries it was (its attempt) |

</details>

→ [(5.11) in plain words](./gray-paper.md#ex-5-11)

<a id="gp-5-1-p3"></a>The terms are fully defined in sections [6.6](../08-safrole/05-one-step-of-safrole.md#gp-6-6-p1) and [10](../10-disputes/index.md#gp-10-p1).

:::

In plain words: two markers that are only sometimes there (the ? after their type means
"or nothing"): that's what `option` is for ([lesson 4.5](./05-maybe-and-exactly-n.md)). And
the tickets mark holds exactly one ticket per slot of an epoch, E of them, 12 on tiny and
600 on full, with no length in front: that's `seqN`. The epoch mark's validator list,
though, *does* carry its length: Gray Paper 0.8.0 lets the validator count change, so the
list says how long it is.

And the order? You know the drill. §5 lists the offenders mark before the author index;
Appendix C writes the author index, the entropy source, *then* the offenders. The encoding
wins.

Here are the two header test vectors, byte by byte, in Appendix C's order. Switch between
them. In `header_1`, the epoch mark is one byte: `00`, nothing. In `header_0`, it's `01`
and then 449 bytes of value. Tap a field to light up its bytes and see its rule worked on
its real value; tap a byte to find its field. Long values fold to their first and last
bytes: tap the fold to see the rest.

<HeaderMap />

## The size grows

The tickets mark needs E, so the config gets its third constant:

**Replace in** `src/config.ts`

```ts
/** The protocol constants that depend on the size of the network. */
export type Config = {
  name: string;
  validators_count: number; // V: validators in a set
  core_count: number; // C: cores doing work in parallel
  epoch_length: number; // E: timeslots in an epoch
};

export const TINY: Config = {
  name: "tiny",
  validators_count: 6,
  core_count: 2,
  epoch_length: 12,
};

export const FULL: Config = {
  name: "full",
  validators_count: 1023,
  core_count: 341,
  epoch_length: 600,
};
```

An epoch is 600 slots of six seconds: one hour. Tiny's epochs last a brisk 72 seconds.

## The tests

**Add to** `test/block.test.ts`

```ts
import { Header } from "../src/block.ts";

testCodecVector("header_0", Header);
testCodecVector("header_1", Header);
```

The two vectors show both markers: `header_0` has an epoch mark and no tickets, `header_1`
a tickets mark and no epoch mark. (Both say slot 42, the middle of an epoch on tiny: a
codec vector only has to have the right shape.)

## The code

**Add to** `src/block.ts`

```ts
import { option, seqN } from "./codec/codec.ts";

/** A validator's two public keys, as an epoch mark lists them. */
export const EpochMarkValidatorKeys = record({
  bandersnatch: fixedBytes(32), // for sealing blocks and the ticket lottery
  ed25519: fixedBytes(32), // for signing everything else
});
export type EpochMarkValidatorKeys = Value<typeof EpochMarkValidatorKeys>;

/** The epoch mark (GP §5): at an epoch's first block, the randomness and validators ahead. */
export const EpochMark = record({
  entropy: hash,
  tickets_entropy: hash,
  validators: seq(EpochMarkValidatorKeys),
});
export type EpochMark = Value<typeof EpochMark>;

/** A winning ticket: its id and attempt. Once a ticket has won, its proof can stay behind. */
export const TicketBody = record({
  id: hash,
  attempt: u8,
});
export type TicketBody = Value<typeof TicketBody>;

/** A block header (GP §5). */
export function Header(config: Config) {
  return record({
    parent: hash, // the parent block's header hash
    parent_state_root: hash, // the state root after the parent block
    extrinsic_hash: hash, // commits to this block's extrinsic
    slot: u32,
    epoch_mark: option(EpochMark), // only in an epoch's first block
    tickets_mark: option(seqN(TicketBody, config.epoch_length)), // when the lottery closes
    author_index: u16, // which validator made this block
    entropy_source: fixedBytes(96), // a VRF signature: fresh randomness for the chain
    offenders_mark: seq(fixedBytes(32)), // Ed25519 keys of newly convicted validators
    seal: fixedBytes(96), // the author's signature over everything above
  });
}
export type Header = Value<ReturnType<typeof Header>>;
```

A winning ticket in the header is just its `id` and `attempt`. The 784-byte proof from
[lesson 4.1](./01-tickets-and-preimages.md) already did its job when the ticket was submitted; by now everyone has checked
it, so the header can travel light.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ header_1 (tiny) (0.7ms)
✔ header_1 (full) (2.0ms)
...
ℹ tests 48
ℹ suites 0
ℹ pass 48
ℹ fail 0
...
reported 48 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791728274365
...
```

## Watch it

**Replace in** `bin/decode.ts`

```ts
import { Header } from "../src/block.ts";

/** The structures this program knows, by the test vectors' names; some depend on the size. */
const CODECS = (config: Config): Record<string, Codec<unknown>> => ({
  refine_context: RefineContext,
  work_item: WorkItem,
  work_package: WorkPackage,
  work_result: WorkDigest,
  work_report: WorkReport,
  tickets_extrinsic: TicketsExtrinsic,
  preimages_extrinsic: PreimagesExtrinsic,
  assurances_extrinsic: AssurancesExtrinsic(config),
  guarantees_extrinsic: GuaranteesExtrinsic,
  disputes_extrinsic: DisputesExtrinsic,
  header: Header(config),
});
```

What flows through this run — the file's bytes, the header they decode to, the trace printed:

::: code-group

```text [what goes in]
header_1.bin, 693 bytes; the first 40:
5c 74 3d bc 51 42 84 b2 ea 57 79 87 87 c5 a1 55 ef 9d 7a c1
e9 49 9e c6 59 10 a7 a3 d6 58 97 b7 25 91 eb d0 47 48 9f 10 …
```

```ts [what it computes]
// Header(TINY).decode(r): the value it returns (trimmed)
const computed = {
  parent: "0x5c743dbc…", // the first 32 bytes
  parent_state_root: "0x2591ebd0…", // the next 32
  extrinsic_hash: "0x74a9e79d…", // and 32 more
  slot: 42, // 4 bytes, ending at byte 100
  epoch_mark: null, // 00: nothing follows
  tickets_mark: [ // 01, then exactly E = 12 tickets, no length in front
    { id: "0x8c25c063…", attempt: 0 }, // ticket 0
    { id: "0xabf4869d…", attempt: 3 }, // ticket 11, the last
  ],
  offenders_mark: [], // 00: a count of none
  author_index: 3,
};
```

```text [what comes out]
    0..32    parent                         0x5c743dbc514284b2ea57798787c5a155ef9d7ac1e9499ec65910a7a3d65897b7
  100..101   epoch_mark.present             0x00
  101..102   tickets_mark.present           0x01
  497..498   tickets_mark.11.attempt        0x03
```

:::

Three hashes and the slot fill the first 100 bytes. Then an option says "no epoch
mark", another says "a tickets mark", and twelve tickets follow with no count, because
the configuration says how many.

**Run**

```sh
npm pkg set scripts.decode-header="node bin/decode.ts header ../vectors/codec/tiny/header_1.bin"
npm run decode-header
```

```text
    0..32    parent                         0x5c743dbc514284b2ea57798787c5a155ef9d7ac1e9499ec65910a7a3d65897b7
...
  100..101   epoch_mark.present             0x00
  101..102   tickets_mark.present           0x01
...
  497..498   tickets_mark.11.attempt        0x03
...
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=decode-1791728274814
```

Read it top to bottom: no epoch mark (`0x00`), a tickets mark (`0x01`), and then twelve
tickets, `tickets_mark.0` to `tickets_mark.11`, one for each slot of tiny's next epoch.
No length anywhere in between: the client knew there'd be twelve.

<details>
<summary>lasair: four headers, in four files</summary>

lasair has a `type header` in `lib/header.ml`, written in the Gray Paper's own notation:

```ocaml
type header = {
  parent: hash;             (** H_p: Hash of parent header *)
  prior_state_root: hash;   (** H_r: Prior state root (BEFORE this block) *)
  extrinsic_hash: hash;     (** H_x: Extrinsic Merkle commitment *)
  timeslot: timeslot;       (** H_t: Timeslot index *)
  epoch_marker: epoch_marker option;    (** H_e: Fallback epoch data *)
  winners_marker: winners_marker option; (** H_w: Next epoch tickets *)
  offenders_marker: ed_key seq;  (** H_o: Misbehaving validators *)
  author_index: val_index;  (** H_i: Block author validator index *)
  vrf_signature: bs_signature;   (** H_v: Entropy VRF signature *)
  seal_signature: bs_signature;  (** H_s: Block seal signature *)
}
```

It also has one in `lib/block_codec.ml`, one in `lib/overview.ml`, and one in
`conformance/codec_tests.ml`: four headers, grown over months, each kept in step with the
others by hand and by tests. Your client has one `Header`, and it is the type, the
encoder, the decoder and the JSON reader at once.

</details>

## Check your understanding

::: check
**§5 lists the offenders mark before the author index. In a header's bytes, what comes straight after the tickets mark?**

- [ ] The offenders mark, as §5 lists it
  > No: §5 says what a header holds, not the order of its bytes. Appendix C moves the
  > offenders mark later.
- [x] The author index, ℰ₂
  > Yes: Appendix C writes the author index, then the entropy source, then the
  > offenders mark, then the seal. The encoding wins.
- [ ] The seal
  > No: the seal is the very last field, a signature over everything before it.

**In `header_1`, the epoch mark is the single byte `00`. What does it say?**

- [ ] An epoch mark with no validators in it
  > No: an epoch mark would start `01`, then its two 32-byte hashes, then the
  > validators' length. `00` is all there is.
- [x] This header has no epoch mark
  > Yes: `00` is the discriminator for "nothing". In `header_0` it's `01`, and the epoch
  > mark follows.
- [ ] Epoch 0
  > No: the byte is a tag, not a number. Which epoch a header is in comes from its
  > slot.

**The tickets mark has no length in front, but the epoch mark's validator list does. Why?**

- [ ] Tickets are small and validator keys are big
  > No: size doesn't decide it. What decides is whether the decoder already knows the
  > count.
- [ ] The tickets mark is optional, so its `01` says how many follow
  > No: the epoch mark is optional too, and its list still has a length. `01` only
  > says "present".
- [x] There's always one ticket per slot of an epoch, but 0.8.0 lets the validator count change
  > Yes: E is fixed, 12 on tiny and 600 on full, so the decoder knows the count. V can
  > change, so the list has to say how long it is.

**On tiny, the epoch mark's value is 449 bytes. Where does 449 come from?**

- [x] Two 32-byte hashes, a 1-byte length, and 6 validators' two 32-byte keys
  > Yes: 32 + 32 + 1 + 6 × 64 = 449. The length byte is `06`.
- [ ] 449 is the epoch mark's fixed size, on every network
  > No: it grows with the validators. On full, 1,023 of them, it's 32 + 32 + 2 +
  > 1,023 × 64 = 65,538 bytes, with a 2-byte length.
- [ ] Twelve tickets, one per slot of tiny's next epoch
  > No: those are the tickets mark, a different field. The epoch mark holds
  > randomness and validators' keys.
:::

## What you have

A client that can read the cover page of any JAM block, at either size. Cover page and
contents together make a block: [lesson 4.7](./07-the-block.md).

Next: [4.7 The block](./07-the-block.md)
