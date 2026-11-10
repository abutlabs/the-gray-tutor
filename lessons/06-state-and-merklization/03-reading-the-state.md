# Reading the state

You know where everything in the state lives ([lesson 6.2](./02-state-keys.md)). Time to open the boxes. Each
value is an encoding, so [Part 2](../02-codec/index.md)'s codecs read it. This lesson reads three components,
the time, the entropy and the validators, and checks each against the blocks themselves.

## New words

- **Validator key.** Everything the chain knows about one validator: three keys for three
  jobs, and some metadata, 336 bytes in all. *Example:* its Ed25519 key signs assurances.
- **Bandersnatch key.** The key a validator uses for the ticket lottery and to seal
  blocks ([Part 8](../08-safrole/index.md)). *Example:* the first 32 of the 336 bytes.
- **BLS key.** A 144-byte key for signatures that can be combined into one. *Example:*
  bytes 64 to 207 of a validator key.

All three are in the [glossary](../glossary.md).

## What the Gray Paper says

Appendix D's T says what each key's value is:

::: gray-paper D.1 4-7

#### Appendix D.1 Serialization, continued

<a id="gp-D-1-p4"></a>The state <abbr class="gp-term" title="turning a value into bytes, so it can be hashed, signed or sent">serialization</abbr> is then defined as the dictionary built from the amalgamation of each of the components. Cryptographic hashing ensures that there will be no duplicate state-keys given that there are no duplicate inputs to $C$. Formally, we define $T$ which transforms some state $\sigma$ into its serialized form:

<a id="gp-D-1-p5"></a><a id="eq-D-2"></a>

$$
\begin{equation}
T(\sigma) \equiv \left\{ \begin{aligned}
&&C(1) &\mapsto \mathcal{E}_{}\left(\left[\left\updownarrow x\right.\! \;\middle\vert\; x \mathrel{\unicode{x2B40}} \alpha\right]\right) \;, \\
&&C(2) &\mapsto \mathcal{E}_{}\left(\phi\right) \;, \\
&&C(3) &\mapsto \mathcal{E}_{}\left(
\left\updownarrow\left[
\left(h, b, s, \mathcal{E}_{4}\left(t\right), \left\updownarrow\mathbf{p}\right.\!\right)
\;\middle\vert\;
\left(h, b, s, t, \mathbf{p}\right) \mathrel{\unicode{x2B40}} \beta_H
\right]\right.\!,
\mathcal{E}_{M}\left(\beta_B\right)
\right) \;, \\
&&C(4) &\mapsto \mathcal{E}_{}\left(
\left\updownarrow\gamma_P\right.\!,
\gamma_Z,
\left\{ \begin{aligned}
0\ &\text{if } \gamma_S \in \left[\!\left[\mathbb{T}\right]\!\right]_{\mathsf{E}}\\
1\ &\text{if } \gamma_S \in \left[\!\left[\overset{\backsim}{\mathbb{H}_{}}\right]\!\right]_{\mathsf{E}}\\
\end{aligned} \right\},
\gamma_S,
\left\updownarrow\gamma_A\right.\!
\right) \;, \\
&&C(5) &\mapsto \mathcal{E}_{}\left(
\left\updownarrow\left[x \in \psi_G\,\wr\,x\right]\right.\!,
\left\updownarrow\left[x \in \psi_B\,\wr\,x\right]\right.\!,
\left\updownarrow\left[x \in \psi_W\,\wr\,x\right]\right.\!,
\left\updownarrow\left[x \in \psi_O\,\wr\,x\right]\right.\!
\right) \;, \\
&&C(6) &\mapsto \mathcal{E}_{}\left(\eta\right) \;, \\
&&C(7) &\mapsto \mathcal{E}_{}\left(\left\updownarrow\iota\right.\!\right) \;, \\
&&C(8) &\mapsto \mathcal{E}_{}\left(\left\updownarrow\kappa\right.\!\right) \;, \\
&&C(9) &\mapsto \mathcal{E}_{}\left(\left\updownarrow\lambda\right.\!\right) \;, \\
&&C(10) &\mapsto \mathcal{E}_{}\left(
\left[
\mathord{\unicode{xBF}}\left(\mathbf{g}, \mathcal{E}_{4}\left(t\right)\right)
\;\middle\vert\;
\left(\mathbf{g}, t\right) \mathrel{\unicode{x2B40}} \rho
\right]
\right) \;, \\
&&C(11) &\mapsto \mathcal{E}_{4}\left(\tau\right) \;, \\
&&C(12) &\mapsto \mathcal{E}_{}\left(
\mathcal{E}_{4}\left(\chi_M, \chi_A, \chi_V, \chi_R\right),
\chi_Z
\right) \;, \\
&&C(13) &\mapsto \mathcal{E}_{}\left(
\left\updownarrow\left[\mathcal{E}_{4}\left(\mathbf{v}\right) \;\middle\vert\; \mathbf{v} \mathrel{\unicode{x2B40}} \pi_V\right]\right.\!,
\left\updownarrow\left[\mathcal{E}_{4}\left(\mathbf{v}\right) \;\middle\vert\; \mathbf{v} \mathrel{\unicode{x2B40}} \pi_L\right]\right.\!,
\pi_C,
\pi_S
\right) \;, \\
&&C(14) &\mapsto \mathcal{E}_{}\left(
\left[
\left\updownarrow\left[
\left(\mathbf{r}, \left\updownarrow\mathbf{d}\right.\!\right)
\;\middle\vert\;
\left(\mathbf{r}, \mathbf{d}\right) \mathrel{\unicode{x2B40}} \mathbf{i}
\right]\right.\!
\;\middle\vert\;
\mathbf{i} \mathrel{\unicode{x2B40}} \omega
\right]
\right) \;, \\
&&C(15) &\mapsto \mathcal{E}_{}\left(
\left[\left\updownarrow\mathbf{i}\right.\! \;\middle\vert\; \mathbf{i} \mathrel{\unicode{x2B40}} \xi\right]
\right) \;, \\
&&C(16) &\mapsto \mathcal{E}_{}\left(
\left\updownarrow\left[\left(\mathcal{E}_{4}\left(s\right), \mathcal{E}_{}\left(h\right)\right) \;\middle\vert\; \left(s, h\right) \mathrel{\unicode{x2B40}} \theta\right]\right.\!
\right) \;, \\
\forall \left(s \mapsto \mathbf{a}\right) \in \delta: &&C(255, s) &\mapsto \mathcal{E}_{}\left(
0,
\mathbf{a}_{c},
\mathcal{E}_{8}\left(
\mathbf{a}_{b},
\mathbf{a}_{g},
\mathbf{a}_{m},
\mathbf{a}_{o},
\mathbf{a}_{f}
\right),
\mathcal{E}_{4}\left(
\mathbf{a}_{i},
\mathbf{a}_{r},
\mathbf{a}_{a},
\mathbf{a}_{p}
\right)
\right) \;, \\
\forall \left(s \mapsto \mathbf{a}\right) \in \delta, \left(\mathbf{k} \mapsto \mathbf{v}\right) \in \mathbf{a}_{\mathbf{s}}:
&&C(s, \mathcal{E}_{4}\left(2^{32}-1\right) \frown \mathbf{k}) &\mapsto \mathbf{v} \;, \\
\forall \left(s \mapsto \mathbf{a}\right) \in \delta, \left(h \mapsto \mathbf{p}\right) \in \mathbf{a}_{\mathbf{p}}:
&&C(s, \mathcal{E}_{4}\left(2^{32}-2\right) \frown h) &\mapsto \mathbf{p} \;, \\
\forall \left(s \mapsto \mathbf{a}\right) \in \delta, \left(\left(h, l\right) \mapsto \mathbf{t}\right) \in \mathbf{a}_{\mathbf{l}}:
&&C(s, \mathcal{E}_{4}\left(l\right) \frown h) &\mapsto \mathcal{E}_{}\left(
\left\updownarrow\left[\mathcal{E}_{4}\left(x\right) \;\middle\vert\; x \mathrel{\unicode{x2B40}} \mathbf{t}\right]\right.\!
\right)
\end{aligned} \right. \tag{D.2}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-thestate" class="gk-wrap">[$\sigma$](../symbols.md#state)</span> | sigma | the state: everything the chain remembers between blocks |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-abracegroup">$\left\{ \begin{aligned}x\end{aligned} \right.$</span> | as follows | a brace grouping lines that hold together: for a function, its type on top, then what each input becomes |
| <span id="gk-mapsto">$\mapsto$</span> | maps to | what a function gives back for an input: x ↦ y says x becomes y |
| <span id="gk-encode">[$\mathcal{E}\left(x\right)$](../symbols.md#encode)</span> | E of | the encoding of what's in the brackets: its bytes, by Appendix C's rules |
| <span id="gk-sq">[$\left[x\right]$](../symbols.md#sequence)</span> | the sequence | a sequence written out item by item; [ ] is the empty one |
| <span id="gk-build">$x \;\middle\vert\; y$</span> | for each, such that | built by a rule: the left-hand value, for every case the right-hand side allows (a set, or a sequence in order) |
| <span id="gk-var">[$\left\updownarrow x\right.\!$](../symbols.md#length-prefix)</span> | with its length | ↕x: x with its length in front, as a compact natural |
| <span id="gk-orderedin">$\mathrel{\unicode{x2B40}}$</span> | in order, from | each item of the sequence, in its order |
| <span id="gk-authpool" class="gk-wrap">$\alpha$</span> | alpha | the authorizer pools: for each core, up to O = 8 authorizer hashes it accepts right now |
| <span id="gk-authqueue" class="gk-wrap">$\phi$</span> | phi | the authorizer queues: for each core, Q = 80 authorizer hashes waiting to join its pool |
| <span id="gk-rh-headerhash">$h$</span> | h | a recent block's header hash |
| <span id="gk-rh-accoutlogsuperpeak">$b$</span> | b | the belt's super-peak just after that block: the vectors' `beefy_root` |
| <span id="gk-rh-stateroot">$s$</span> | s | a recent block's state root: the state just after it; zeros until the next block fills it in |
| <span id="gk-rh-timeslot">$t$</span> | t | a recent block's timeslot |
| <span id="gk-rh-reportedpackagehashes" class="gk-wrap">$\mathbf{p}$</span> | bold p | the packages a block reported: each package's hash, mapped to the root of the segments it exports |
| <span id="gk-recenthistory" class="gk-wrap">$\beta_H$</span> | beta sub H | the last H = 8 blocks: each one's header hash, state root, belt peak and reported packages |
| <span id="gk-mmrencode">$\mathcal{E}_{M}\left(x\right)$</span> | E sub M of | a Merkle mountain range's bytes: its count of peaks, then each peak as maybe (0, or 1 and the hash) |
| <span id="gk-accoutbelt" class="gk-wrap">$\beta_B$</span> | beta sub B | the accumulation output belt: one place per binary digit of the block count, each a peak or nothing |
| <span id="gk-pendingset" class="gk-wrap">$\gamma_P$</span> | gamma P | the pending validators: the key sets that become active at the next epoch |
| <span id="gk-epochroot" class="gk-wrap">$\gamma_Z$</span> | gamma Z | the ring root of the pending validators' Bandersnatch keys: 144 bytes a ticket's proof is checked against |
| <span id="gk-abracegroupboth">$\left\{ \begin{aligned}x\end{aligned} \right\}$</span> | whichever of | the value of the line inside whose condition holds |
| <span id="gk-sealtickets" class="gk-wrap">$\gamma_S$</span> | gamma S | the slot sealers: one entry for each of the epoch's E slots, a winning ticket or, in the fallback, a Bandersnatch key |
| <span id="gk-in">[$\in$](../symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-sequence">[$\left[\!\left[x\right]\!\right]$](../symbols.md#sequence)</span> | a sequence of | ⟦T⟧ is an array of T; a subscript is its length, :n at most n, n: at least n |
| <span id="gk-Cepochlen" class="gk-wrap">$\mathsf{E}$</span> | E | an epoch's length in slots: 600 on full, 12 on tiny |
| <span id="gk-safroleticket" class="gk-wrap">$\mathbb{T}$</span> | T | a ticket: a 32-byte id, and which of its maker's tries it was (its attempt) |
| <span id="gk-bskey" class="gk-wrap">$\overset{\backsim}{\mathbb{H}}$</span> | H tilde | a Bandersnatch public key: 32 bytes |
| <span id="gk-ticketaccumulator" class="gk-wrap">$\gamma_A$</span> | gamma A | the ticket lottery: the best tickets entered so far for the next epoch, at most E, lowest id first |
| <span id="gk-sqorderby">$\left[y\,\wr\,x\right]$</span> | sorted by | the sequence's items, sorted by the key on the right |
| <span id="gk-goodset" class="gk-wrap">$\psi_G$</span> | psi sub G | the good set: hashes of every report a verdict found valid |
| <span id="gk-badset" class="gk-wrap">$\psi_B$</span> | psi sub B | the bad set: hashes of every report a verdict found invalid |
| <span id="gk-wonkyset" class="gk-wrap">$\psi_W$</span> | psi sub W | the wonky set: hashes of every report whose verdict split, so nobody can tell |
| <span id="gk-offenders" class="gk-wrap">$\psi_O$</span> | psi O | the offenders: Ed25519 keys of validators found to have judged a report wrongly |
| <span id="gk-entropy" class="gk-wrap">$\eta$</span> | eta | entropy: four 32-byte values of randomness, the newest mixing in every block |
| <span id="gk-stagingset" class="gk-wrap">$\iota$</span> | iota | the next validators: keys queued to become active at the next epoch |
| <span id="gk-activeset" class="gk-wrap">$\kappa$</span> | kappa | the current validators: the keys of the V validators active this epoch |
| <span id="gk-previousset" class="gk-wrap">$\lambda$</span> | lambda | the last epoch's validators: kept to check what they signed before the change |
| <span id="gk-maybe">$\mathord{\unicode{xBF}}x$</span> | maybe | ¿x: the byte 0 if x is nothing (∅), or the byte 1 and then x |
| <span id="gk-aa-guarantee" class="gk-wrap">$\mathbf{g}$</span> | bold g | the guarantee a core's pending report came with: the report and its guarantors' signatures |
| <span id="gk-availassignments" class="gk-wrap">$\rho$</span> | rho | the pending reports: for each core, the report waiting to be made available, and when it came |
| <span id="gk-thetime" class="gk-wrap">$\tau$</span> | tau | the time: the latest block's timeslot |
| <span id="gk-manager" class="gk-wrap">$\chi_M$</span> | chi sub M | the manager: the one service that may change the privileges and grant free storage |
| <span id="gk-assigners" class="gk-wrap">$\chi_A$</span> | chi sub A | the assigners: for each core, the service that may replace its authorizer queue |
| <span id="gk-delegator" class="gk-wrap">$\chi_V$</span> | chi sub V | the delegator: the one service that may set the next epoch's validator keys |
| <span id="gk-registrar" class="gk-wrap">$\chi_R$</span> | chi sub R | the registrar: the one service that may create services with the reserved low ids |
| <span id="gk-alwaysaccers" class="gk-wrap">$\chi_Z$</span> | chi sub Z | the always-accumulate services: each accumulates every block, with this much gas |
| <span id="gk-valstatsaccumulator" class="gk-wrap">$\pi_V$</span> | pi sub V | this epoch's validator tallies: one record of six counts per validator, still counting |
| <span id="gk-valstatsprevious" class="gk-wrap">$\pi_L$</span> | pi sub L | last epoch's validator tallies: one record of six counts per validator, finished |
| <span id="gk-corestats" class="gk-wrap">$\pi_C$</span> | pi sub C | the cores' tallies: one record per core, for this block only |
| <span id="gk-servicestats" class="gk-wrap">$\pi_S$</span> | pi sub S | the services' tallies: one record per service active in this block, for this block only |
| <span id="gk-ready" class="gk-wrap">$\omega$</span> | omega | the ready queue: available reports waiting on others before they can accumulate |
| <span id="gk-accumulated" class="gk-wrap">$\xi$</span> | xi | the accumulated history: the packages accumulated in each of the last E slots |
| <span id="gk-lastaccout" class="gk-wrap">$\theta$</span> | theta | the last block's accumulation outputs: which service yielded which hash |
| <span id="gk-forall">$\forall$</span> | for all | for every value: ∀c ∈ ℕ_C means for each core c |
| <span id="gk-kv">$\left(x \mapsto y\right)$</span> | k maps to v | a dictionary entry: key k, value v |
| <span id="gk-saX" class="gk-wrap">$\mathbf{a}$</span> | a | a service account: its code hash, balance, gas minimums, storage, preimages and the rest |
| <span id="gk-accounts" class="gk-wrap">$\delta$</span> | delta | the service accounts: every service's code hash, balance, storage and preimages |
| <span id="gk-sa-codehash">$c$</span> | c | an account's code hash: names the preimage holding its code |
| <span id="gk-sa-minaccgas">$g$</span> | g | the least gas each work-item for this service must bring to accumulate |
| <span id="gk-sa-minmemogas">$m$</span> | m | the least gas each transfer to this service must bring |
| <span id="gk-sa-octets">$o$</span> | o | an account's octets: the bytes it keeps, with 81 per request and 34 per storage entry on top |
| <span id="gk-sa-gratis">$f$</span> | f | an account's gratis offset: deposit it is let off, taken from its minimum balance |
| <span id="gk-sa-items">$i$</span> | i | an account's items: 2 per request plus 1 per storage entry |
| <span id="gk-sa-created">$r$</span> | r | the slot the service was created at |
| <span id="gk-sa-lastacc">$a$</span> | a | the slot the service last accumulated at |
| <span id="gk-sa-parent">$p$</span> | p | the parent: the id of the service that created this one |
| <span id="gk-sa-storage" class="gk-wrap">$\mathbf{s}$</span> | s | an account's storage: keys to values, both any bytes, written by its own accumulate code |
| <span id="gk-concat" class="gk-wrap">[$\frown$](../symbols.md#concat)</span> | concatenate | join: the left sequence followed by the right |
| <span id="gk-sa-requests" class="gk-wrap">$\mathbf{l}$</span> | l | an account's requests: for each (hash, length) asked for, a history of up to 3 slots |

</details>

→ [(D.2) in plain words](./gray-paper.md#ex-D-2)

<a id="gp-D-1-p6"></a>Note that most rows describe a single mapping between a key derived from a natural and the serialization of a state component. However, the final four rows each define sets of mappings since these items act over all service accounts and in the case of the final three rows, the keys of a nested dictionary with the service.

<a id="gp-D-1-p7"></a>Also note that all non-discriminator numeric serialization in state is done in fixed-length according to the size of the term.

:::

In plain words, (D.2) is a table: on the left a key, from [lesson 6.2](./02-state-keys.md)'s
C, and on the right the encoding stored under it. The paper's second note is the rule of
thumb for reading one: a number in the state is written fixed-width, ℰ₄ or ℰ₈, unless it
is a length or a discriminator in front of something. This lesson reads three rows:

| Key | Value | Codec |
| --- | --- | --- |
| C(11) | τ, the time: ℰ₄ of the slot of the most recent block | `u32` |
| C(6) | η, entropy: four hashes, newest first, no length in front | `seqN(hash, 4)` |
| C(8) | κ, this epoch's validators, with their length in front | `seq(ValidatorKey)` |

A *validator key* (§6) is 336 bytes: three keys for three jobs, Bandersnatch (32 bytes),
Ed25519 (32) and BLS (144), then 128 bytes of metadata, which the Gray Paper leaves opaque
(a validator's network address, say). You met the first two in [lesson 4.6](../04-blocks/06-the-header.md), where an
epoch mark carries just those. The state keeps all four parts.

<ValidatorKeyMap />

And three facts from elsewhere in the Gray Paper, to check your reading against:

- **τ** (§6): after a block, the time *is* that block's slot. So the time in the state
  before block n is the slot of block n − 1.
- **η** (§6): an epoch mark ([lesson 4.6](../04-blocks/06-the-header.md)) is η₀, η₁ and the next validators, with η₀ and η₁
  as they stood before its block. So `epoch_mark.entropy` must be the state's η₀, and
  `epoch_mark.tickets_entropy` its η₁.
- **κ** (§11): assurances are signed with the validators' Ed25519 keys ([lesson 5.3](../05-hashing-and-signatures/03-signatures.md)). So
  the keys in κ must check out against real assurances.

## The tests

The tests need each trace step's block as well as its state, so `traceState` hands it
over too.

**Replace in** `test/vectors.ts`

```ts
/** The state before block n of a tiny trace, the state root its header promises, the block. */
export function traceState(family: string, n: number) {
  const name = `traces/${family}/${String(n).padStart(8, "0")}.json`;
  const trace = vectorJson(name) as {
    pre_state: { keyvals: { key: string; value: string }[] };
    block: { header: { parent_state_root: string } };
  };
  const entries = trace.pre_state.keyvals.map((e) => ({
    key: fromHex(e.key),
    value: fromHex(e.value),
  }));
  return { entries, promised: trace.block.header.parent_state_root, block: trace.block };
}
```

**Add to** `test/state.test.ts`

```ts
import { Block, assuranceSigned } from "../src/block.ts";
import { TINY } from "../src/config.ts";
import { readEntropy, readTime, readValidators } from "../src/state.ts";
import type { Bytes } from "../src/bytes.ts";
import type { EpochMark } from "../src/block.ts";

test("τ: the time before each block is the slot of the block before it", () => {
  for (let n = 2; n <= 100; n++) {
    const before: Block = Block(TINY).fromJson(traceState("fallback", n - 1).block);
    const time: number = readTime(traceState("fallback", n).entries);
    assert.equal(time, before.header.slot);
  }
});

test("η: each epoch mark carries η₀ and η₁ from the state before its block", () => {
  let marks = 0;
  for (let n = 1; n <= 100; n++) {
    const { entries, block } = traceState("safrole", n);
    const mark: EpochMark | null = Block(TINY).fromJson(block).header.epoch_mark;
    if (mark === null) continue;
    const entropy: Bytes[] = readEntropy(entries);
    const marked: Bytes[] = [mark.entropy, mark.tickets_entropy];
    const fromState: Bytes[] = [entropy[0], entropy[1]];
    assert.deepEqual(marked, fromState);
    marks++;
  }
  assert.ok(marks > 0);
});

test("κ: real assurances check out with the validators' keys from the state", () => {
  let checked = 0;
  for (let n = 1; n <= 100; n++) {
    const { entries, block } = traceState("preimages", n);
    const keys: Bytes[] = readValidators(entries).map((v) => v.ed25519);
    for (const assurance of Block(TINY).fromJson(block).extrinsic.assurances) {
      const signed: boolean = assuranceSigned(keys, assurance);
      assert.ok(signed, `block ${n}`);
      checked++;
    }
  }
  assert.equal(checked, 524);
});
```

Three components, three independent witnesses: 99 headers for τ, the 8 epoch marks of
the `safrole` trace (one every 12 slots, at the start of each tiny epoch) for η, and all
524 assurances of the `preimages` trace for κ. The `assert.ok(marks > 0)` and
`assert.equal(checked, 524)` lines are there so a loop that silently checks nothing
can't pass.

## The code

**Add to** `src/state.ts`

```ts
import { toHex } from "./bytes.ts";
import type { Codec, Value } from "./codec/codec.ts";
import { decode, fixedBytes, hash, record, seq, seqN, u32 } from "./codec/codec.ts";
import type { KeyValue } from "./trie.ts";

/** A validator's keys (GP §6): 336 bytes, the four keys it uses for different jobs. */
export const ValidatorKey = record({
  bandersnatch: fixedBytes(32), // for sealing blocks and the ticket lottery
  ed25519: fixedBytes(32), // for signing everything else
  bls: fixedBytes(144), // for BEEFY, which bridges to other chains
  metadata: fixedBytes(128), // where to reach it on the network
});
export type ValidatorKey = Value<typeof ValidatorKey>;

/** State component i, read from the state's entries with its codec. */
function component<T>(entries: KeyValue[], i: number, codec: Codec<T>): T {
  const key = toHex(componentKey(i));
  const entry = entries.find((e) => toHex(e.key) === key);
  if (!entry) throw new Error(`the state has no component ${i}`);
  return decode(codec, entry.value);
}

/** τ, C(11): the time, as the slot of the most recent block. */
export function readTime(entries: KeyValue[]): number {
  return component(entries, 11, u32);
}

/** η, C(6): four 32-byte hashes of fresh randomness, the newest first. */
export function readEntropy(entries: KeyValue[]): Bytes[] {
  return component(entries, 6, seqN(hash, 4));
}

/** κ, C(8): the validators of this epoch. */
export function readValidators(entries: KeyValue[]): ValidatorKey[] {
  return component(entries, 8, seq(ValidatorKey));
}
```

`component` does the work: build the key with C(i), find its entry, decode the value.
The three readers say which component and which codec.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ τ: the time before each block is the slot of the block before it (171.5ms)
✔ η: each epoch mark carries η₀ and η₁ from the state before its block (158.7ms)
✔ κ: real assurances check out with the validators' keys from the state (787.6ms)
...
ℹ tests 66
ℹ suites 0
ℹ pass 66
ℹ fail 0
...
reported 66 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791728965838
...
```

The κ test: real assurances ([Part 4](../04-blocks/index.md)), checked with Ed25519 ([Part 5](../05-hashing-and-signatures/index.md)) against keys read
from a real state ([Part 6](./index.md)) with your own codecs ([Part 2](../02-codec/index.md)). Four parts, one `assert`.

And the test checks against the right set. The Gray Paper checks an assurance with κ, the
validators as they were *before* the block (§11: κ, with no prime mark), so the test's choice holds
even when the sets start rotating, in [Part 8](../08-safrole/index.md). (In these traces they never do: ι, κ
and λ hold the same six throughout.)

## Watch it

**New file** `bin/read-state.ts`

```ts
// Reads three components of the state before a trace's block: τ, η and κ.
// Usage: npm run read-state <trace.json>, e.g.
//        npm run read-state ../vectors/traces/safrole/00000012.json

import { readFileSync } from "node:fs";
import { fromHex, toHex } from "../src/bytes.ts";
import { Run } from "../src/obs.ts";
import { readEntropy, readTime, readValidators } from "../src/state.ts";

const [file] = process.argv.slice(2);
const trace = JSON.parse(readFileSync(file, "utf8"));
const entries = trace.pre_state.keyvals.map((e: { key: string; value: string }) => ({
  key: fromHex(e.key),
  value: fromHex(e.value),
}));
const run = new Run("read-state");

const slot = readTime(entries);
console.log(`τ, the time: slot ${slot}`);
run.event("time", { slot });

readEntropy(entries).forEach((hash, index) => {
  console.log(`η${index}: ${toHex(hash)}`);
  run.event("entropy", { index, hash });
});

readValidators(entries).forEach((v, index) => {
  console.log(`κ${index}: ed25519 ${toHex(v.ed25519)}`);
  run.event("validator", { index, ed25519: v.ed25519, bandersnatch: v.bandersnatch });
});

const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

What flows through it — three state entries in, three components out:

::: code-group

```json [what goes in]
{ "pre_state": { "keyvals": [
  { "key": "0x0b00000000…", "value": "0x0b000000" },
  { "key": "0x0600000000…", "value": "0xcf7f084efbeefbda10df…" },
  { "key": "0x0800000000…", "value": "0x06ff71c6c03ff88adb5e…" }
] } }
```

```ts [what it computes]
const components = {
  tau: 11, // C(11)'s 4-byte value, 0x0b000000, read as a u32: slot 11
  eta: 4, // C(6)'s 128 bytes: four 32-byte hashes, η₀ first
  kappa: 6, // C(8)'s list of validator keys, 336 bytes each
};
```

```text [what comes out]
τ, the time: slot 11
η0: 0xcf7f084efbeefbda10df98970c403993cfc0039f1c240ba4f2ff075890a1a83b
```

:::

The key of each `keyvals` entry begins with its component's number — 0x0b is 11, τ; 0x06 is 6, η;
0x08 is 8, κ — and the value is that component's encoding, which the readers decode:
the time's four little-endian bytes say slot 11, and η's first 32 bytes are η₀ exactly
as the output prints it.

**Run**

```sh
npm pkg set scripts.read-state="node bin/read-state.ts"
npm pkg set scripts.read-state-safrole="node bin/read-state.ts ../vectors/traces/safrole/00000012.json"
npm run read-state-safrole
```

```text
τ, the time: slot 11
η0: 0xcf7f084efbeefbda10df98970c403993cfc0039f1c240ba4f2ff075890a1a83b
...
κ0: ed25519 0x4418fb8c85bb3985394a8c2756d3643457ce614546202a2f50b093d762499ace
...
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=read-state-1791728969293
```

Block 12 of the `safrole` trace starts an epoch, and its state says the time is slot 11:
one block earlier, as promised. Compare η0 and η1 with that block's epoch mark, in the
trace file: same hashes. And κ0's key, `0x4418fb8c…`, is an old friend: it's validator 0
from [lesson 5.3](../05-hashing-and-signatures/03-signatures.md)'s assurance vectors. The test vectors share one cast of six validators.
The *Reading σ* panel shows all three components.

![Reading σ panel](./images/03-reading-sigma.png)

<details>
<summary>lasair: <code>type validator_keys</code>, in <code>lib/definitions.ml</code></summary>

```ocaml
type validator_keys = {
  ed: ed_key;           (* Ed25519 key for signing *)
  bs: bs_key;           (* Bandersnatch key for VRF *)
  bls: bls_key;         (* BLS key for aggregation *)
  metadata: bytes;      (* Additional metadata *)
}
```

Ed25519 first, Bandersnatch second: the opposite of the bytes. In lasair that's fine,
because its decoders are written by hand and read the bytes in their own order. In your
client the record *is* the byte order ([lesson 2.5](../02-codec/05-sequences-and-records.md)): swap `bandersnatch` and `ed25519`
in `ValidatorKey`, and every Ed25519 key comes out wrong. Try it, and watch the κ test go
red.

</details>

## Check your understanding

::: check
**The state before block 12 of the `safrole` trace says τ is slot 11. Why not 12?**

- [ ] The state lags a slot behind, and catches up later
  > No: it's exactly right. τ is the slot of the most recent block, and in this state
  > block 12 hasn't happened yet.
- [x] τ is the slot of the most recent block, and before block 12 that's block 11
  > Yes: after a block, the time is that block's slot. So the state before block n holds
  > block n − 1's slot: here, 11.
- [ ] Slots count from 0 and blocks from 1, so block 12 is in slot 11
  > No: block 12 is in slot 12; its header says so. The 11 is the block before it.

**κ's value is 2,017 bytes on tiny. Where does that come from?**

- [x] A length byte, `06`, then six validator keys of 336 bytes each
  > Yes: 1 + 6 × 336 = 2,017. Each key is Bandersnatch (32), Ed25519 (32), BLS (144) and
  > metadata (128).
- [ ] A `01` saying κ is there, then six validator keys
  > No: κ isn't optional, so there's no there-or-not byte. The first byte is `06`, how many
  > validators follow.
- [ ] Six validators' Bandersnatch and Ed25519 keys, as in an epoch mark
  > No: those are 64 bytes a validator, 6 × 64 = 384 in all. The state keeps all four
  > parts of each key, 336 bytes.

**The test checks real assurances against keys read from κ. Which key, and where is it in each validator's 336 bytes?**

- [ ] The Bandersnatch key, bytes 0 to 31
  > No: Bandersnatch is for sealing blocks and the ticket lottery. Assurances are signed
  > with Ed25519.
- [ ] The BLS key, bytes 64 to 207
  > No: BLS is for signatures that can be combined into one. An assurance is a plain
  > Ed25519 signature.
- [x] The Ed25519 key, bytes 32 to 63
  > Yes: it comes second, after the 32-byte Bandersnatch key. Read the wrong 32 bytes,
  > as swapping two fields of `ValidatorKey` does, and every assurance fails.

**Block 12 of the `safrole` trace starts an epoch. What must its epoch mark's `entropy` be?**

- [ ] η₀ after block 12, stirred with the block's own randomness
  > No: the mark carries η₀ as it stood *before* its block, the value in the state the
  > block starts from.
- [ ] η₃, the oldest of the four
  > No: the mark carries η₀ and η₁, as `entropy` and `tickets_entropy`.
- [x] η₀ in the state before block 12, `0xcf7f084e…`
  > Yes: the epoch mark carries η₀ and η₁ as they stood before its block. `bin/read-state.ts`
  > printed that η₀, and the trace's epoch mark holds the same hash.
:::

## What you have

Your client can read the state: find any component by its key, decode it with the codecs
it already has, and trust it, because three independent witnesses agree. [Part 7](../07-time-and-shuffling/index.md) turns to
time itself: epochs, and the shuffle that deals validators out to cores.

Next: [Part 7 · Time and shuffling](../07-time-and-shuffling/index.md)
