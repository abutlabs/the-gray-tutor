# Epochs

A slot is six seconds. An *epoch* is 600 of them on the full network, one hour; 12 on
tiny. A few things happen only when a new epoch begins: the validator set can change,
the ticket lottery starts over, and the chain's randomness is set aside. This lesson
teaches your client to tell epochs apart, and to spot the moment one turns over.

## New words

- **Epoch.** A run of slots: 600 (one hour) on the full network, 12 on tiny. The
  validators and the block lottery change when one begins. *Example:* slots 0 to 599 are
  epoch 0.
- **Phase.** Where a slot falls within its epoch, counted from 0. *Example:* on tiny,
  slot 13 is epoch 1, phase 1.
- **Entropy accumulator.** η₀: the randomness every block stirs a little more into.
  *Example:* when an epoch ends, its value moves along to η₁.

All three are in the [glossary](../glossary.md).

## What the Gray Paper says

::: gray-paper 6.1

#### §6.1 Timekeeping {#gp-6-1}

<a id="gp-6-1-p1"></a>Here, $\tau$ defines the most recent block's slot index, which we transition to the slot index as defined in the block's header:

<a id="gp-6-1-p2"></a><a id="eq-6-1"></a>

$$
\begin{equation}
\tau \in \mathbb{N}_T \ ,\quad
\tau' \equiv \mathbf{H}_{T} \tag{6.1}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-thetime" class="gk-wrap">$\tau$</span> | tau | the time: the latest block's timeslot |
| <span id="gk-in">[$\in$](../symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-timeslot" class="gk-wrap">$\mathbb{N}_T$</span> | N sub T | a timeslot: a u32 counting 6-second slots |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-H" class="gk-wrap">$\mathbf{H}$</span> | H | this block's header; 𝐇_T is its timeslot, 𝐇_P its parent's hash |
| <span id="gk--timeslot">$T$</span> | T | a header's timeslot: 𝐇_T is the slot this block was made for |

</details>

→ [(6.1) in plain words](./gray-paper.md#ex-6-1)

<a id="gp-6-1-p3"></a>We track the slot index in state as $\tau$ in order that we are able to easily both identify a new epoch and determine the slot at which the prior block was authored. We denote $e$ as the prior's epoch index and $m$ as the prior's slot phase index within that epoch and $e'$ and $m'$ are the corresponding values for the present block:

<a id="gp-6-1-p4"></a><a id="eq-6-2"></a>

$$
\begin{align}
\mathrm{let}\quad e \,\mathsf{R}\, m = \frac{\tau}{\mathsf{E}} \,,\quad
e' \,\mathsf{R}\, m' = \frac{\tau'}{\mathsf{E}} \tag{6.2}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-remainder">$\,\mathsf{R}\,$</span> | R | the remainder of a division |
| <span id="gk-frac">$\frac{x}{y}$</span> | over | a fraction: the top divided by the bottom |
| <span id="gk-Cepochlen" class="gk-wrap">$\mathsf{E}$</span> | E | an epoch's length in slots: 600 on full, 12 on tiny |

</details>

→ [(6.2) in plain words](./gray-paper.md#ex-6-2)

:::

In plain words, §6.1 (*Timekeeping*): τ, the time in the state, is the slot of the block
before this one ([lesson 6.3](../06-state-and-merklization/03-reading-the-state.md)), and
τ′, the time after this block, is this block's own slot. A slot's epoch is
e = ⌊slot / E⌋, and its *phase*, where it falls within the epoch, is m = slot mod E: the
quotient and the remainder of one division. A block starts a new epoch when its epoch,
e′, is greater than the epoch of the block before it, e.

Two things happen exactly then:

- **The header carries an epoch mark** ([lesson 4.6](../04-blocks/06-the-header.md)): η₀, η₁ and the next validators.
- **The entropy history moves along one**, as below.

The paper keeps the entropy's history in §6.4:

::: gray-paper 6.4 4-5

#### §6.4 Sealing and Entropy Accumulation, continued

<a id="gp-6-4-p4"></a>In addition to the entropy accumulator $\eta_0$, we retain three additional historical values of the accumulator at the point of each of the three most recently ended epochs, $\eta_1$, $\eta_2$ and $\eta_3$. The second-oldest of these $\eta_2$ is utilized to help ensure future entropy is unbiased (see equation [6.30](../08-safrole/07-entering-tickets.md#eq-6-30)) and seed the fallback slot-sealer generation function with randomness (see equation [6.25](../08-safrole/04-the-lotterys-winners.md#eq-6-25)). The oldest is used to regenerate this randomness when verifying the seal above (see equations [6.17](../08-safrole/09-seals.md#eq-6-17) and [6.16](../08-safrole/09-seals.md#eq-6-16)).

<a id="gp-6-4-p5"></a><a id="eq-6-22"></a>

$$
\begin{align}
\eta &\in \left[\!\left[\mathbb{H}_{}\right]\!\right]_{4} \tag{6.22}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-entropy" class="gk-wrap">$\eta$</span> | eta | entropy: four 32-byte values of randomness, the newest mixing in every block |
| <span id="gk-sequence">[$\left[\!\left[x\right]\!\right]$](../symbols.md#sequence)</span> | a sequence of | ⟦T⟧ is an array of T; a subscript is its length, :n at most n, n: at least n |
| <span id="gk-hash">$\mathbb{H}$</span> | H | a 32-byte value, usually a hash |

</details>

→ [(6.22) in plain words](./gray-paper.md#ex-6-22)

:::

and moves it along at a new epoch:

::: gray-paper 6.4 8-9

#### §6.4 Sealing and Entropy Accumulation, continued

<a id="gp-6-4-p8"></a>On an epoch transition (identified as the condition $e' > e$), we therefore rotate the accumulator value into the history $\eta_1$, $\eta_2$ and $\eta_3$:

<a id="gp-6-4-p9"></a><a id="eq-6-24"></a>

$$
\begin{align}
\left(\eta'_1, \eta'_2, \eta'_3\right) &\equiv \begin{cases}
\left(\eta_0, \eta_1, \eta_2\right) &\text{if } e' > e \\
\left(\eta_1, \eta_2, \eta_3\right) &\text{otherwise}
\end{cases} \tag{6.24}
\end{align}
$$

→ [(6.24) in plain words](./gray-paper.md#ex-6-24)

:::

In plain words: η ([lesson 6.3](../06-state-and-merklization/03-reading-the-state.md)) is
four hashes. η₀ is the *entropy accumulator*: every block stirs fresh randomness into it.
η₁, η₂ and η₃ are what η₀ was at the end of each of the last three epochs. So at a new
epoch, η′₁ is the old η₀, η′₂ the old η₁, η′₃ the old η₂, and the oldest is forgotten. In
any other block, they stay as they are.

Why keep old randomness? Some decisions must use randomness nobody could have steered
when the decision was set up. Randomness from a finished epoch is fixed, and the ticket
lottery and the block sealers lean on it. (η₀ itself changes every block, using a
Bandersnatch VRF output. That's [Part 8](../08-safrole/index.md).)

<EpochTurn />

## The tests

**New file** `test/epoch.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { Block } from "../src/block.ts";
import { FULL, TINY } from "../src/config.ts";
import { entropyHistory, epochOf, phaseOf } from "../src/epoch.ts";
import { readEntropy, readTime } from "../src/state.ts";
import { traceState } from "./vectors.ts";
import type { Bytes } from "../src/bytes.ts";

test("an epoch is E slots: 12 on tiny, 600 on full", () => {
  const tinyEpoch: number = epochOf(TINY, 25);
  const tinyPhase: number = phaseOf(TINY, 25);
  assert.deepEqual([tinyEpoch, tinyPhase], [2, 1]);
  const fullEpoch: number = epochOf(FULL, 1234);
  const fullPhase: number = phaseOf(FULL, 1234);
  assert.deepEqual([fullEpoch, fullPhase], [2, 34]);
});

/** Block n of the tiny "safrole" trace, the time before it, and whether it starts an epoch. */
function step(n: number) {
  const { entries, block } = traceState("safrole", n);
  const header = Block(TINY).fromJson(block).header;
  const time = readTime(entries);
  const newEpoch = epochOf(TINY, header.slot) > epochOf(TINY, time);
  return { header, entries, newEpoch };
}

test("an epoch mark is in exactly the blocks that start a new epoch", () => {
  let marks = 0;
  for (let n = 1; n <= 100; n++) {
    const { header, newEpoch } = step(n);
    const hasMark: boolean = header.epoch_mark !== null;
    assert.equal(hasMark, newEpoch, `block ${n}`);
    if (newEpoch) marks++;
  }
  assert.equal(marks, 8);
});

test("at a new epoch the entropy history moves along one; otherwise it stays", () => {
  for (let n = 1; n < 100; n++) {
    const { entries, newEpoch } = step(n);
    const after: Bytes[] = readEntropy(traceState("safrole", n + 1).entries); // after block n
    const afterHistory: Bytes[] = after.slice(1);
    const moved: Bytes[] = entropyHistory(readEntropy(entries), newEpoch);
    assert.deepEqual(afterHistory, moved, `block ${n}`);
  }
});
```

The `safrole` trace's state after block n is the state before block n + 1, so
`traceState("safrole", n + 1)` is block n's *after*. And `after.slice(1)` is η′₁ to η′₃:
η′₀ is left out on purpose, since it changes every block and needs [Part 8](../08-safrole/index.md).

A stub, with a chain where time stands still: every slot in epoch 0, and an entropy
history that never moves along.

**New file** `src/epoch.ts`

```ts
// Epochs (GP §6): the chain's hours. A slot belongs to an epoch, and a few things change
// only when a new epoch begins.

import type { Bytes } from "./bytes.ts";
import type { Config } from "./config.ts";

export function epochOf(config: Config, slot: number): number {
  return 0;
}

export function phaseOf(config: Config, slot: number): number {
  return 0;
}

export function entropyHistory(entropy: Bytes[], newEpoch: boolean): Bytes[] {
  return entropy.slice(1);
}
```

**Run, expect it to fail**

```sh
npm test
```

```text
...
✖ an epoch is E slots: 12 on tiny, 600 on full (1.4ms)
✖ an epoch mark is in exactly the blocks that start a new epoch (28.6ms)
✖ at a new epoch the entropy history moves along one; otherwise it stays (97.1ms)
...
ℹ tests 69
ℹ suites 0
ℹ pass 66
ℹ fail 3
...
test at test/epoch.test.ts:28:1
✖ an epoch mark is in exactly the blocks that start a new epoch (28.6ms)
  AssertionError [ERR_ASSERTION]: block 12

  true !== false

      at TestContext.<anonymous> (…/client/test/epoch.test.ts:33:12)
...
test at test/epoch.test.ts:39:1
✖ at a new epoch the entropy history moves along one; otherwise it stays (97.1ms)
  AssertionError [ERR_ASSERTION]: block 12
...
```

All three red, and both trace tests stopped at block 12, the first of epoch 1. For
blocks 1 to 11 the frozen clock was right by luck; the first boundary gives it away.

## The code

**Replace in** `src/epoch.ts`

```ts

/** e: the epoch a slot falls in, ⌊slot / E⌋. */
export function epochOf(config: Config, slot: number): number {
  return Math.floor(slot / config.epoch_length);
}

/** m: where a slot falls within its epoch, slot mod E, from 0 to E − 1. */
export function phaseOf(config: Config, slot: number): number {
  return slot % config.epoch_length;
}

/** η′₁, η′₂, η′₃: at a new epoch, the entropy history moves along one; otherwise it stays. */
export function entropyHistory(entropy: Bytes[], newEpoch: boolean): Bytes[] {
  return newEpoch ? entropy.slice(0, 3) : entropy.slice(1, 4);
}
```

`entropy.slice(0, 3)` is η₀, η₁, η₂: shifted along by one, ready to become η′₁ to η′₃.
`entropy.slice(1, 4)` is η₁, η₂, η₃, unchanged.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ an epoch mark is in exactly the blocks that start a new epoch (123.7ms)
✔ at a new epoch the entropy history moves along one; otherwise it stays (112.7ms)
...
ℹ tests 69
ℹ suites 0
ℹ pass 69
ℹ fail 0
...
reported 69 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791729464631
...
```

Eight epochs began in those 100 blocks, at slots 12, 24, 36 and so on to 96, and the
headers and the state agree about every one of them.

## Watch it

**New file** `bin/epochs.ts`

```ts
// Walks the 100 blocks of the tiny "safrole" trace and shows where each new epoch begins:
// the header carries an epoch mark, and the entropy history moves along one.

import { readFileSync } from "node:fs";
import { Block } from "../src/block.ts";
import { fromHex, toHex } from "../src/bytes.ts";
import { TINY } from "../src/config.ts";
import { epochOf, phaseOf } from "../src/epoch.ts";
import { Run } from "../src/obs.ts";
import { readEntropy, readTime } from "../src/state.ts";

const run = new Run("epochs");
let epochs = 0;
for (let n = 1; n <= 100; n++) {
  const file = `../vectors/traces/safrole/${String(n).padStart(8, "0")}.json`;
  const trace = JSON.parse(readFileSync(file, "utf8"));
  const entries = trace.pre_state.keyvals.map((e: { key: string; value: string }) => ({
    key: fromHex(e.key),
    value: fromHex(e.value),
  }));
  const { slot, epoch_mark } = Block(TINY).fromJson(trace.block).header;
  const epoch = epochOf(TINY, slot);
  const newEpoch = epoch > epochOf(TINY, readTime(entries));
  const mark = epoch_mark !== null;
  run.event("block", { slot, epoch, phase: phaseOf(TINY, slot), newEpoch, mark });
  if (!newEpoch) continue;
  epochs++;
  const eta0 = toHex(readEntropy(entries)[0]).slice(0, 18); // η₀, shortened
  console.log(`slot ${slot}: epoch ${epoch} begins. Epoch mark: ${mark}. η₁ is now ${eta0}…`);
}
console.log(`${epochs} new epochs in 100 blocks.`);
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

What flows through it, at the first boundary it finds:

::: code-group

```text [what goes in]
00000001.json … 00000100.json — the tiny safrole trace. Block 12's pieces:
  header.slot         12                       the new block's moment
  header.epoch_mark   present                  only an epoch's first block carries one
  state τ             11                       the time before it, still in epoch 0
  state η₀            0xcf7f084efbeefbda…      the entropy about to retire
```

```ts [what it computes]
const boundary = {
  epoch: 1, // ⌊12 / 12⌋: twelve slots to a tiny epoch
  phase: 0, // 12 mod 12: the epoch's first slot
  newEpoch: true, // epoch 1 > epoch ⌊11 / 12⌋ = 0, the state's time
  mark: true, // the header carries its epoch mark, as it must
};
```

```text [what comes out]
slot 12: epoch 1 begins. Epoch mark: true. η₁ is now 0xcf7f084efbeefbda…
8 new epochs in 100 blocks.
```

:::

The walk reads each block's header beside the state before it: when the header's slot
lands in a later epoch than the state's τ, an epoch begins — twelve times a tiny hour,
eight times in this trace's hundred blocks — and the η₀ of the old epoch is found one
slot later living in η₁.

**Run**

```sh
npm pkg set scripts.epochs="node bin/epochs.ts"
npm run epochs
```

```text
slot 12: epoch 1 begins. Epoch mark: true. η₁ is now 0xcf7f084efbeefbda…
slot 24: epoch 2 begins. Epoch mark: true. η₁ is now 0x9624e3672337076c…
slot 36: epoch 3 begins. Epoch mark: true. η₁ is now 0x9e41bb39cea21929…
slot 48: epoch 4 begins. Epoch mark: true. η₁ is now 0x27bea4ecb9542b84…
slot 60: epoch 5 begins. Epoch mark: true. η₁ is now 0x8b313cbbc547b294…
slot 72: epoch 6 begins. Epoch mark: true. η₁ is now 0x4ae60fe5dd387d08…
slot 84: epoch 7 begins. Epoch mark: true. η₁ is now 0x76af9e385ba89964…
slot 96: epoch 8 begins. Epoch mark: true. η₁ is now 0x5a9144b76436afd1…
8 new epochs in 100 blocks.
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=epochs-1791729468062
```

`0xcf7f084e…` should look familiar: it's the η₀ that `bin/read-state.ts` showed you in
[lesson 6.3](../06-state-and-merklization/03-reading-the-state.md), in the state before this very block. One block later it has retired to η₁.
The *Epochs* panel lists every block with its epoch and phase, and flags the eight where
a new epoch begins: watch the phase run 0 to 11, then start again.

![Epochs panel](./images/01-epochs.png)

<details>
<summary>lasair: the turn, in <code>conformance/safrole.ml</code></summary>

```ocaml
      if new_epoch then begin
        match epoch_mark with
        | Some em ->
          (* η'[3] = η[2] (seal entropy) *)
          Bytes.blit entropy 64 new_entropy 96 32;
          (* η'[2] = epoch_mark.tickets_entropy *)
          Bytes.blit em.tickets_entropy 0 new_entropy 64 32;
          (* η'[1] = η[0] (before the new update) *)
          Bytes.blit entropy 0 new_entropy 32 32
```

The same rule, on the state's own bytes: η is four 32-byte values in a row, so η[1] starts
at byte 32, η[2] at 64 and η[3] at 96, and each `Bytes.blit` copies one 32-byte value one
place along. η′[2] comes from the block's epoch mark, which carries the same value as the
old η[1]. Your `entropyHistory` says it with one `slice`.

</details>

## Check your understanding

::: check
**On full, E is 600. Which epoch and phase is slot 1,234?**

- [ ] Epoch 102, phase 10
  > No: that divides by 12, tiny's E. On full, 1,234 = 2 × 600 + 34.
- [x] Epoch 2, phase 34
  > Yes: ⌊1234 / 600⌋ = 2, and 1234 mod 600 = 34. Epochs 0 and 1 took slots 0 to 1,199.
- [ ] Epoch 3, phase 34
  > No: epochs count from 0, like phases. Slots 0 to 599 are epoch 0, so 1,234 is in
  > epoch 2.

**On tiny, a block at slot 13 comes straight after one at slot 11. Does it start a new epoch?**

- [ ] No: only a block at phase 0, slot 12 here, starts an epoch
  > No: there was no block at slot 12, and a slot can be empty. The rule compares epochs,
  > not phases.
- [ ] Only if its header carries an epoch mark
  > No: it's the other way round. The block carries an epoch mark *because* it starts a new
  > epoch, and the test checks that the two always agree.
- [x] Yes: its epoch, 1, is greater than the epoch of the block before it, 0
  > Yes: e′ = ⌊13 / 12⌋ = 1 and e = ⌊11 / 12⌋ = 0. It carries the epoch mark, and the
  > entropy history moves along.

**At a new epoch, what happens to η₃?**

- [ ] It comes round to η₀, so the four values go in a circle
  > No: η₀ is the accumulator, stirred by every block. Nothing old comes back into it.
- [x] It's forgotten: η′₃ is the old η₂
  > Yes: everything moves along one, η₀ to η₁, η₁ to η₂, η₂ to η₃, and the oldest drops
  > off the end.
- [ ] Nothing: η₁, η₂ and η₃ only change inside an epoch
  > No: it's the reverse. Inside an epoch they stay as they are; at a new epoch they move
  > along.

**Why keep η₁, η₂ and η₃ at all, when η₀ is the freshest randomness?**

- [ ] Older randomness has been stirred more times, so it's more random
  > No: η₁ is η₀ as it stood at the end of last epoch. It has been stirred *fewer* times
  > than today's η₀, not more.
- [ ] In case η₀ is lost
  > No: η₀ is in the state like everything else, and every node keeps it. Nothing needs a
  > backup.
- [x] Some decisions need randomness nobody could steer when they were set up, and a finished epoch's is fixed
  > Yes: η₀ changes with every block, so its value depends on who made the latest ones.
  > The ticket lottery and the block sealers lean on the old, settled values.
:::

## What you have

Your client knows what epoch it is, where in the epoch it is, and what has to change when
a new one begins. An epoch also deals jobs out, the same way on every node:
[lesson 7.2](./02-the-shuffle.md) builds the shuffle that does it.

Next: [7.2 The shuffle](./02-the-shuffle.md)
