# Recent blocks

**In one sentence:** the state remembers the last eight blocks, so that new work can point
at a recent block and a report the chain has already seen can be turned away.

Let block 50 arrive, then 51 and 52. Watch what each one does to the list of eight.

<a id="try-it"></a>

<RecentBlocks />

## The idea

The state has a short memory on purpose: the last eight blocks. Guarantors anchor their
work on these blocks, and the chain uses them to turn away reports it has already seen.

So it keeps a small entry for each: the header hash, the state root after it, the belt's
super-peak ([lesson 9.1](./01-the-mountain-belt.md)), the slot, and the work-packages it
reported. That list, with the belt beside it, is the
[*recent history*](../glossary.md#recent-history).

Each new block does three things to the list. It fills in a blank, adds itself, and
forgets the oldest.

The blank is the odd one. A block's state root comes *after* the block, so it can't be
written when the block is added. The next block brings it. Think of a diary: each
morning you first write how yesterday ended, then start today's page, and tear out the
page from nine days ago.

This lesson keeps that memory up to date, block by block.

## What the Gray Paper says

::: gray-paper 7 2-5

#### §7 Recent History, continued

<a id="gp-7-p2"></a><a id="eq-7-1"></a><a id="eq-7-2"></a><a id="eq-7-3"></a><a id="eq-7-4"></a>

$$
\begin{align}
\beta &\equiv \left(\beta_H, \beta_B\right) \tag{7.1} \\
\beta_H &\in \left[\!\left[\!\left\lgroup
h\in \mathbb{H}_{},
s\in \mathbb{H}_{},
b\in \mathbb{H}_{},
t\in \mathbb{N}_T,
\mathbf{p}\in \left\langle\!\left\vert \mathbb{H}_{}\to\mathbb{H}_{}\right\vert\!\right\rangle
\right\rgroup\!\right]\!\right]_{:\mathsf{H}} \tag{7.2} \\
\beta_B &\in \left[\!\left[\mathbb{H}_{}\boldsymbol{?}\right]\!\right]_{} \tag{7.3} \\
\theta &\in \left[\!\left[\left(\mathbb{N}_S, \mathbb{H}_{}\right)\right]\!\right]_{} \tag{7.4}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-recent" class="gk-wrap">$\beta$</span> | beta | recent blocks: the last few blocks' hashes and roots, and the belt of accumulation outputs |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-recenthistory" class="gk-wrap">$\beta_H$</span> | beta sub H | the last H = 8 blocks: each one's header hash, state root, belt peak and reported packages |
| <span id="gk-accoutbelt" class="gk-wrap">$\beta_B$</span> | beta sub B | the accumulation output belt: one place per binary digit of the block count, each a peak or nothing |
| <span id="gk-in">[$\in$](../symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-sequence">[$\left[\!\left[x\right]\!\right]$](../symbols.md#sequence)</span> | a sequence of | ⟦T⟧ is an array of T; a subscript is its length, :n at most n, n: at least n |
| <span id="gk-Crecenthistorylen" class="gk-wrap">$\mathsf{H}$</span> | H | how many recent blocks the state remembers: 8 |
| <span id="gk-tuple">$\!\left\lgroup x\right\rgroup\!$</span> | the tuple of | a record: named fields, each with its type, like an object in JSON |
| <span id="gk-isa">[$x\in y$](../symbols.md#in)</span> | in | belongs to: the field's type |
| <span id="gk-rh-headerhash">$h$</span> | h | a recent block's header hash |
| <span id="gk-hash">$\mathbb{H}$</span> | H | a 32-byte value, usually a hash |
| <span id="gk-rh-stateroot">$s$</span> | s | a recent block's state root: the state just after it; zeros until the next block fills it in |
| <span id="gk-rh-accoutlogsuperpeak">$b$</span> | b | the belt's super-peak just after that block: the vectors' `beefy_root` |
| <span id="gk-rh-timeslot">$t$</span> | t | a recent block's timeslot |
| <span id="gk-timeslot" class="gk-wrap">$\mathbb{N}_T$</span> | N sub T | a timeslot: a u32 counting 6-second slots |
| <span id="gk-rh-reportedpackagehashes" class="gk-wrap">$\mathbf{p}$</span> | bold p | the packages a block reported: each package's hash, mapped to the root of the segments it exports |
| <span id="gk-dictionary">$\left\langle\!\left\vert x\to y\right\vert\!\right\rangle$</span> | a dictionary from K to V | a map: keys of type K, each with one value of type V |
| <span id="gk-optional">$x\boldsymbol{?}$</span> | or nothing | a value of this type, or ∅ (null) |
| <span id="gk-lastaccout" class="gk-wrap">$\theta$</span> | theta | the last block's accumulation outputs: which service yielded which hash |
| <span id="gk-serviceid" class="gk-wrap">$\mathbb{N}_S$</span> | N sub S | a service id: a whole number below 2³², 4 bytes |

</details>

→ [(7.1), (7.2), (7.3), (7.4) in plain words](./gray-paper.md#ex-7-1)

<a id="gp-7-p3"></a>For each recent block, we retain its header hash, its state root, its accumulation-result MMB and the corresponding work-package hashes of each item reported (which is no more than the total number of cores, $\mathsf{C} = 341$).

<a id="gp-7-p4"></a>During the accumulation stage, a value with the partial transition of this state is provided which contains the correction for the newly-known state-root of the parent block:

<a id="gp-7-p5"></a><a id="eq-7-5"></a>

$$
\begin{equation}
\beta_H^\dagger \equiv \beta_H\quad\text{ except }\quad\beta_H^\dagger\left[\left\vert\beta_H\right\vert - 1\right]_{s} = \mathbf{H}_{R} \tag{7.5}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-recenthistorypostparentstaterootupdate" class="gk-wrap">$\beta_H^\dagger$</span> | beta sub H dagger | the recent blocks midway: with the parent's state root filled in, before this block's entry |
| <span id="gk-subb">[$\left[x\right]$](../symbols.md#sequence)</span> | at | x[i]: the item at index i, or the value at key i |
| <span id="gk-len">$\left\vert x\right\vert$</span> | the size of | \|x\|: how many items x has, or how many bytes |
| <span id="gk-H" class="gk-wrap">$\mathbf{H}$</span> | H | this block's header; 𝐇_T is its timeslot, 𝐇_P its parent's hash |
| <span id="gk--priorstateroot">$R$</span> | R | a header's prior state root: 𝐇_R is the root of the state before this block, 32 bytes |

</details>

→ [(7.5) in plain words](./gray-paper.md#ex-7-5)

:::

::: gray-paper 7 8-10

#### §7 Recent History, continued

<a id="gp-7-p8"></a>The final state transition for $\beta_H$ appends a new item including the new block's header hash, a Merkle <abbr class="gp-term" title="a short hash that stands for some data, so the data can be checked against it later">commitment</abbr> to the block's <abbr class="gp-term" title="β_B, the belt: one running commitment to every block's accumulation outputs">Accumulation Output Log</abbr> and the set of work-reports made into it (for which we use the guarantees extrinsic, $\mathbf{E}_G$). Formally:

<a id="gp-7-p9"></a><a id="eq-7-8"></a>

$$
\begin{equation}
\begin{aligned}
\beta_H' &\equiv {\overleftarrow{\beta_H^\dagger \mathbin{+\!\!+} \left(
h\mathrel{\unicode{x2AF6}}\mathcal{H}\left(\mathbf{H}\right),
s\mathrel{\unicode{x2AF6}}\mathbb{H}_{0},
b\mathrel{\unicode{x2AF6}}\mathcal{M}_R\left(\beta_B'\right),
t\mathrel{\unicode{x2AF6}}\mathbf{H}_{T},
\mathbf{p}
\right)}}^{\mathsf{H}} \\
\text{where } \mathbf{p} &= \left\{\,
\left(
((g_{\mathbf{r}})_{\mathbf{s}})_{p}
\mapsto
((g_{\mathbf{r}})_{\mathbf{s}})_{e}
\right)
\;\middle\vert\;
g \in \mathbf{E}_G
\,\right\}
\end{aligned} \tag{7.8}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-overleftarrow">$\overleftarrow{x}$</span> | the last n of | with a number above: keep only the rightmost (newest) n items; with none: the sequence reversed |
| <span id="gk-append">[$\mathbin{+\!\!+}$](../symbols.md#concat)</span> | append | add one item at the end of the sequence |
| <span id="gk-is">$x\mathrel{\unicode{x2AF6}} y$</span> | is a | names a field and gives its type, in a tuple |
| <span id="gk-blake">$\mathcal{H}\left(x\right)$</span> | H of | the Blake2b hash of what's in the brackets: 32 bytes |
| <span id="gk-zerohash" class="gk-wrap">$\mathbb{H}_{0}$</span> | H zero | 32 zero bytes: a placeholder where a hash isn't known yet |
| <span id="gk-mmrsuperpeak">$\mathcal{M}_R\left(x\right)$</span> | M sub R of | the super-peak: one hash for a whole belt, its peaks folded together under the word `peak` |
| <span id="gk--timeslot">$T$</span> | T | a header's timeslot: 𝐇_T is the slot this block was made for |
| <span id="gk-set">$\left\{\,x\,\right\}$</span> | the set of | a set: values with no order and no repeats |
| <span id="gk-build">$\left\{ x \;\middle\vert\; y \right\}$</span> | for each, such that | built by a rule: the left-hand value, for every case the right-hand side allows (a set, or a sequence in order) |
| <span id="gk-kv">$\left(x \mapsto y\right)$</span> | k maps to v | a dictionary entry: key k, value v |
| <span id="gk-g-workreport" class="gk-wrap">$\mathbf{r}$</span> | r | a guarantee's work-report: 𝐠_𝐫 is the report it vouches for |
| <span id="gk-wr-avspec" class="gk-wrap">$\mathbf{s}$</span> | bold s | a report's availability spec: the package's hash, its bundle's length, and the roots of its pieces and of the segments it exports |
| <span id="gk-as-packagehash">$p$</span> | p | the work-package's hash |
| <span id="gk-as-segroot">$e$</span> | e | the root of the segments a package exports |
| <span id="gk-xtguarantees" class="gk-wrap">$\mathbf{E}_G$</span> | E sub G | the guarantees bag: work-reports with their guarantors' signatures, one per core at most |

</details>

→ [(7.8) in plain words](./gray-paper.md#ex-7-8)

<a id="gp-7-p10"></a>The new state-trie root is the zero hash, $\mathbb{H}_{0}$, which is inaccurate but safe since $\beta'$ is not utilized except to define the next block's $\beta^\dagger$, which contains a corrected value for this, as per equation [7.5](#eq-7-5).

:::

(The belt's own append, in between, is [lesson 9.1](./01-the-mountain-belt.md#what-the-gray-paper-says)'s.)

§7 (*Recent History*): β is two things. β_H is the list of recent blocks, at most H = 8
of them. β_B is the belt. (θ, in the same type line, is the block's accumulation outputs,
which the belt's new root is made from.) Each new block does three things to them, the
three you watched [at the top](#try-it):

1. **Fills in a blank (7.5).** The newest remembered block's state root couldn't be known
   when it was added. Now it is: it's this block's `parent_state_root`
   (H_R, [lesson 4.6](../04-blocks/06-the-header.md)). So it's written in.
2. **Adds itself (7.8).** The block's accumulation outputs go onto the belt
   ([lesson 9.1](./01-the-mountain-belt.md)), and a new entry joins the list: its header
   hash, the belt's new super-peak, its slot, the packages its guarantees reported (each
   package's hash, with the root of the segments it exports), and a state root of 32
   zeros. The Gray Paper calls that zero root "inaccurate but safe": nothing reads it
   before step 1 fixes it, one block later.
3. **Forgets (7.8).** Only the last eight entries are kept: the arrow over the whole
   entry list, with H on top, keeps the rightmost H.

β's two halves live in one state entry, C(3), with very different memories:

| | β_H, the recent blocks | β_B, the belt |
| --- | --- | --- |
| remembers | the last 8 blocks, the oldest dropped as each new one comes | every block since genesis: each adds its accumulation root |
| keeps | a whole entry per block: header hash, state root, super-peak, slot, reported packages | only the peaks, one place per power of two |
| size | always 8 entries at most | one place per binary digit of the block count: 23 after a year of 6-second blocks, 29 after a century |

The belt never resets and never forgets a block, yet it stays tiny. It grows with the
number of *digits* in the block count, not with the count, like
[lesson 9.1](./01-the-mountain-belt.md)'s binary counter. Each peak is a commitment to all
the blocks under it. That is why one super-peak can stand for the chain's whole history
of accumulation outputs.

The history vectors give the new block's parts ready-made: its header hash, its
`parent_state_root`, the root of its accumulation outputs, its slot, and its reported
packages. For now, a block simply brings them. [Part 12](../12-guarantees/index.md) works
out the reported packages. The accumulation root needs the outputs that services hand
back with the `yield` host call, which
[lesson 17.11](../17-accumulation/11-what-a-service-yields.md) builds.

## The records first

The tests read β from real states as well as from the vectors, so its records come first,
with a `recordBlock` that doesn't record anything yet:

**New file** `src/history.ts`

```ts
// Recent history (GP §7): the state remembers the last eight blocks, and keeps a belt of
// every accumulation output.

import type { Bytes } from "./bytes.ts";
import type { Value } from "./codec/codec.ts";
import { hash, option, record, seq, u32 } from "./codec/codec.ts";

/** A work-package reported in a block: its hash, and the root of the segments it exports. */
export const ReportedPackage = record({
  hash: hash,
  exports_root: hash,
});
export type ReportedPackage = Value<typeof ReportedPackage>;

/** One remembered block (GP §7). */
export const RecentBlock = record({
  header_hash: hash,
  beefy_root: hash, // the belt's super-peak, just after this block
  state_root: hash, // the state root after this block: the next block fills it in
  slot: u32,
  reported: seq(ReportedPackage), // the work-packages reported in this block
});
export type RecentBlock = Value<typeof RecentBlock>;

/** β, C(3): the recent blocks, then the belt, each peak an option (GP App. D). */
export const Recent = record({
  history: seq(RecentBlock),
  belt: seq(option(hash)),
});
export type Recent = Value<typeof Recent>;

/** What a new block brings to the history (the history vectors' input). */
export const NewBlock = record({
  header_hash: hash,
  parent_state_root: hash, // H_r: the state root after the newest remembered block
  accumulate_root: hash, // the root of this block's accumulation outputs
  slot: u32,
  work_packages: seq(ReportedPackage),
});
export type NewBlock = Value<typeof NewBlock>;

/** H: how many recent blocks the state remembers. */
export const RECENT_BLOCKS = 8;

export function recordBlock(before: Recent, block: NewBlock): Recent {
  return before;
}
```

Every structure here is a `record`, so it's a type, an encoder, a decoder and a JSON
reader at once ([lesson 2.5](../02-codec/05-sequences-and-records.md)). `Recent` is
exactly how C(3) holds β in the state: the list, then the belt, each peak an `option`
([lesson 4.5](../04-blocks/05-maybe-and-exactly-n.md)), since a belt has gaps.

> [!NOTE]
> The `slot` in each entry is new in Gray Paper 0.8.0; 0.7.2's entries didn't have it.
> Rules change between versions, so a client says which one it follows.

And a reader for β, next to [lesson 6.3](../06-state-and-merklization/03-reading-the-state.md)'s:

**Add to** `src/state.ts`

```ts
import { Recent } from "./history.ts";

/** β, C(3): the recent blocks, and the belt. */
export function readRecent(entries: KeyValue[]): Recent {
  return component(entries, 3, Recent);
}
```

## The tests

**New file** `test/history.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { Block, headerHash } from "../src/block.ts";
import { TINY } from "../src/config.ts";
import { NewBlock, Recent, RECENT_BLOCKS, recordBlock } from "../src/history.ts";
import { readRecent } from "../src/state.ts";
import { traceState, vectorFiles, vectorJson } from "./vectors.ts";
import type { Header } from "../src/block.ts";
import type { Bytes } from "../src/bytes.ts";
import type { RecentBlock } from "../src/history.ts";

/** A history vector's β, as your client's Recent. */
function recent(beta: { history: unknown[]; mmr: { peaks: unknown[] } }): Recent {
  return Recent.fromJson({ history: beta.history, belt: beta.mmr.peaks });
}

test("β′: the last block learns its state root, the new one joins, eight are kept", () => {
  let checked = 0;
  for (const size of ["tiny", "full"]) {
    for (const name of vectorFiles(`stf/history/${size}`)) {
      const { input, pre_state, post_state } = vectorJson(name) as {
        input: unknown;
        pre_state: { beta: { history: unknown[]; mmr: { peaks: unknown[] } } };
        post_state: { beta: { history: unknown[]; mmr: { peaks: unknown[] } } };
      };
      const before: Recent = recent(pre_state.beta);
      const after: Recent = recordBlock(before, NewBlock.fromJson(input));
      const expected: Recent = recent(post_state.beta);
      assert.deepEqual(after, expected, name);
      checked++;
    }
  }
  assert.equal(checked, 8);
});

test("β in real states: the newest block remembered is the block before", () => {
  for (let n = 2; n <= 100; n++) {
    const { history }: Recent = readRecent(traceState("fallback", n).entries);
    const before: Header = Block(TINY).fromJson(traceState("fallback", n - 1).block).header;
    const newest: RecentBlock = history[history.length - 1];
    const beforeHash: Bytes = headerHash(TINY, before);
    assert.deepEqual(newest.header_hash, beforeHash, `block ${n}`);
    assert.deepEqual(newest.state_root, new Uint8Array(32)); // not known yet
    const previous: RecentBlock = history[history.length - 2];
    assert.deepEqual(previous.state_root, before.parent_state_root);
    const kept: number = Math.min(n, RECENT_BLOCKS); // genesis counts too
    assert.equal(history.length, kept);
  }
});
```

Two kinds of check. The vectors check `recordBlock`: all three steps, at both sizes,
including a block that pushes the ninth entry out. Real states check the *codec* and the
rules. Before each of 99 trace blocks, the newest remembered block is the one before, by
header hash ([lesson 5.1](../05-hashing-and-signatures/01-hashes.md)), with its state
root still zeros, and the entry before it filled in. The real chain did that recording,
so this test passes before `recordBlock` does anything.

**Run, expect it to fail**

```sh
npm test
```

```text
...
✖ β′: the last block learns its state root, the new one joins, eight are kept (197.8ms)
✔ β in real states: the newest block remembered is the block before (366.2ms)
...
ℹ tests 92
ℹ suites 0
ℹ pass 91
ℹ fail 1
...
test at test/history.test.ts:17:1
✖ β′: the last block learns its state root, the new one joins, eight are kept (197.8ms)
  AssertionError [ERR_ASSERTION]: stf/history/tiny/progress_blocks_history-1.json
  + actual - expected

    {
  +   belt: [],
  +   history: []
  -   belt: [
...
```

One red, one green, and that's the split you want. The real states pass: your records
and `readRecent` read β exactly as the chain wrote it. The vectors fail on the first one,
which starts from an empty history. Your stub hands it back empty (`+`), where the
vector expects one block remembered and a belt of one mountain (`-`).

## The code

The three steps, one line or two each:

**Replace in** `src/history.ts`

```ts
import type { Belt } from "./belt.ts";
import { appendToBelt, superPeak } from "./belt.ts";

/**
 * β′ (GP §7): the newest remembered block learns its state root, the new block joins the
 * belt and the list, and the list keeps only the last eight.
 */
export function recordBlock(before: Recent, block: NewBlock): Recent {
  const last = before.history.length - 1;
  const fixed = before.history.map((b, i) =>
    i === last ? { ...b, state_root: block.parent_state_root } : b,
  );
  const belt: Belt = appendToBelt(before.belt, block.accumulate_root);
  const entry: RecentBlock = {
    header_hash: block.header_hash,
    beefy_root: superPeak(belt),
    state_root: new Uint8Array(32), // unknown yet: zeros until the next block
    slot: block.slot,
    reported: block.work_packages,
  };
  return { history: [...fixed, entry].slice(-RECENT_BLOCKS), belt };
}
```

`fixed` is step 1: copy every entry, but give the last one its state root.

```ts
    i === last ? { ...b, state_root: block.parent_state_root } : b,
```

`{ ...b, state_root: ... }` copies an object with one field changed. `entry` is step 2,
and step 3 is the last line:

```ts
  return { history: [...fixed, entry].slice(-RECENT_BLOCKS), belt };
```

A negative `slice` counts from the end, so it keeps the last eight.

> [!NOTE]
> **The simple road.** `recordBlock` keeps the reported packages in the order the block
> lists them. The Gray Paper holds them in a *dictionary*, and dictionaries are encoded
> sorted by key ([lesson 3.3](../03-work-and-reports/03-a-work-report.md)), here the
> package hash. The vectors only ever list them in order, so this is fine for now. The
> [hardening pass](https://github.com/abutlabs/the-gray-tutor/blob/main/HARDENING.md) sorts
> them.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ β′: the last block learns its state root, the new one joins, eight are kept (7.5ms)
✔ β in real states: the newest block remembered is the block before (408.1ms)
...
ℹ tests 92
ℹ suites 0
ℹ pass 92
ℹ fail 0
...
reported 92 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791731468082
...
```

## Watch it

**New file** `bin/history.ts`

```ts
// Reads β from the state before a trace's block: the blocks the chain remembers, each with
// the belt's super-peak as it stood after that block (its beefy_root), and the one belt,
// its super-peak folded live and checked against the newest block's.
// Usage: npm run history <trace.json>, e.g.
//        npm run history ../vectors/traces/preimages/00000050.json

import { readFileSync } from "node:fs";
import type { Bytes } from "../src/bytes.ts";
import { fromHex, toHex } from "../src/bytes.ts";
import { superPeak } from "../src/belt.ts";
import { Run } from "../src/obs.ts";
import { readRecent } from "../src/state.ts";

const [file] = process.argv.slice(2);
const trace = JSON.parse(readFileSync(file, "utf8"));
const entries = trace.pre_state.keyvals.map((e: { key: string; value: string }) => ({
  key: fromHex(e.key),
  value: fromHex(e.value),
}));
const { history, belt } = readRecent(entries);
const short = (bytes: Bytes) => `${toHex(bytes).slice(0, 10)}…`;
/** The belt's shape after n items: n in binary, smallest mountain first. */
const dot = (bit: string) => (bit === "1" ? "●" : "·");
const dots = (n: number) => [...n.toString(2)].reverse().map(dot).join(" ");
const items = belt.reduce((n: number, peak, i) => (peak === null ? n : n + 2 ** i), 0);
const run = new Run("history");
for (const [i, { slot, header_hash, state_root, beefy_root, reported }] of history.entries()) {
  const onBelt = items - (history.length - 1 - i); // every block appended one item
  const roots = `header ${short(header_hash)}  state root ${short(state_root)}`;
  const line = `slot ${String(slot).padStart(3)}  ${roots}  beefy ${short(beefy_root)}`;
  console.log(`${line}  reported: ${reported.length}  belt ${dots(onBelt)}`);
  const counted = { reported: reported.length, belt: dots(onBelt) };
  run.event("block", { slot, header_hash, state_root, beefy_root, ...counted });
}
const peaks = belt.map((peak) => (peak === null ? "·" : "●")).join(" ");
const top = superPeak(belt);
const newest = history[history.length - 1];
const same = toHex(top) === toHex(newest.beefy_root);
const agrees = same ? "the newest block's beefy ✓" : "NOT the newest block's beefy ✗";
console.log(`the belt: ${peaks}`);
console.log(`its super-peak, folded live: ${short(top)} — ${agrees}`);
run.event("belt", { peaks, superPeak: top });
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

**What flows through it.** The input is a whole state this time: the trace file's
`pre_state.keyvals`, where β sits under C(3)'s key. One entry in, a decoded β computed,
the rows printed:

::: code-group

```json [what goes in]
{
  "pre_state": {
    "keyvals": [
      {
        "key": "0x0300000000…",
        "value": "0x088492038c11a08a79…"
      },
      { "…": "every other component and account entry, not read here" }
    ]
  }
}
```

```ts [what it computes]
// bin/history.ts's values, once C(3)'s bytes decode as Recent
const computed = {
  component: "the 0x03… entry is β", // its value: 0x08, a count, then 8 blocks
  blocks: 8, // slots 42 to 49: header hash, state root, beefy, reported, each
  items: 49, // the belt's held places read as binary: 110001
  shapes: "each row's belt is one item fewer than the next", // drawn, not rewound
  foldedLive: "0x41063bd0…", // superPeak(belt), equal to slot 49's stored beefy
};
```

```text [what comes out]
slot  42  header 0x8492038c…  state root 0x85e2f9da…  beefy 0xd33299c9…  reported: 0  belt · ● · ● · ●
the belt: ● · · · ● ●
its super-peak, folded live: 0x41063bd0… — the newest block's beefy ✓
```

:::

Read the input into the output. The `value`'s first byte, `0x08`, is `seq`'s count: 8
remembered blocks. The very next 32 bytes are slot 42's `header_hash`, the `0x8492038c…`
that opens the first printed row. Everything the program shows is decoded out of that
one entry's bytes by the codecs this lesson builds.

**Run**

```sh
npm pkg set scripts.history="node bin/history.ts"
npm pkg set scripts.history-preimages="node bin/history.ts ../vectors/traces/preimages/00000050.json"
npm run history-preimages
```

```text
slot  42  header 0x8492038c…  state root 0x85e2f9da…  beefy 0xd33299c9…  reported: 0  belt · ● · ● · ●
slot  43  header 0x083e87af…  state root 0x92b349ae…  beefy 0xf25da2b7…  reported: 0  belt ● ● · ● · ●
slot  44  header 0x0193a9f8…  state root 0xf3d9561f…  beefy 0xddaed19c…  reported: 2  belt · · ● ● · ●
slot  45  header 0xdf827752…  state root 0x1e90a7be…  beefy 0x8e61f98d…  reported: 1  belt ● · ● ● · ●
slot  46  header 0xb3711eed…  state root 0xa61f6f99…  beefy 0xbede1624…  reported: 0  belt · ● ● ● · ●
slot  47  header 0x12d04d3e…  state root 0x2f529bd8…  beefy 0x524e191c…  reported: 1  belt ● ● ● ● · ●
slot  48  header 0x1beca774…  state root 0xd095c60f…  beefy 0xebfeb74b…  reported: 1  belt · · · · ● ●
slot  49  header 0x7c7ee195…  state root 0x00000000…  beefy 0x41063bd0…  reported: 1  belt ● · · · ● ●
the belt: ● · · · ● ●
its super-peak, folded live: 0x41063bd0… — the newest block's beefy ✓
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=history-1793314582825
```

Eight blocks, slots 42 to 49, and only the newest still waiting for its state root. Now
read the belt backwards, as [lesson 9.1](./01-the-mountain-belt.md) taught you: 110001 in
binary is 49, one accumulation root for each block so far.

The `beefy` column is the super-peak as it stood after each block: eight snapshots of the
one belt, a fresh M_R every block because every block appends.

The `belt` column is where [lesson 9.1](./01-the-mountain-belt.md)'s one-way street gets
precise. The old belts' *hashes* are gone for good: only the stored belt, the newest
line's, has real peaks behind its dots. Their *shapes* cost nothing, because a shape is
only the item count in binary, and each block's count is one less than the next. So the
program draws every shape and could recover no peak but the last row's. Watch
slot 47 → 48: `● ● ● ● · ●` collapses to `· · · · ● ●`, four merges in one block,
101111 + 1 = 110000. The *Recent history* panel, on the **3 · Consensus** dashboard,
shows it all.

These eight are the list [at the top](#try-it). Let block 50 arrive there, then 51 and
52: the three steps, on the trace's own β.

![Recent history panel](./images/02-recent-history.png)

## The scoreboard

The first test above runs every history vector whole: β′ is all a history vector's state
holds, and it says nothing back. That's the `stf/history` family. Move the check into
`test/families.ts`, and have the test call it:

**Add to** `test/families.ts`

```ts
import { NewBlock, Recent, recordBlock } from "../src/history.ts";

/** β as the history vectors write it: the blocks, and the belt's peaks as `mmr`. */
type Beta = { history: unknown[]; mmr: { peaks: unknown[] } };

/** A history vector: β′, the last eight blocks and the belt. It says nothing back. */
export function checkHistory(name: string) {
  const vector = vectorJson(name) as StfVector<unknown, { beta: Beta }>;
  const recent = (beta: Beta) => Recent.fromJson({ history: beta.history, belt: beta.mmr.peaks });
  const after = recordBlock(recent(vector.pre_state.beta), NewBlock.fromJson(vector.input));
  assert.deepEqual(after, recent(vector.post_state.beta), "beta differs");
  assert.equal(vector.output, null, "output differs");
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
  { folders: ["stf/history/tiny", "stf/history/full"], check: checkHistory },
];
```

**Rewrite** `test/history.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { Block, headerHash } from "../src/block.ts";
import { TINY } from "../src/config.ts";
import { Recent, RECENT_BLOCKS } from "../src/history.ts";
import { readRecent } from "../src/state.ts";
import { checkHistory } from "./families.ts";
import { traceState, vectorFiles } from "./vectors.ts";
import type { Header } from "../src/block.ts";
import type { Bytes } from "../src/bytes.ts";
import type { RecentBlock } from "../src/history.ts";

test("β′: the last block learns its state root, the new one joins, eight are kept", () => {
  const names: string[] = [...vectorFiles("stf/history/tiny"), ...vectorFiles("stf/history/full")];
  for (const name of names) checkHistory(name);
  assert.equal(names.length, 8);
});

test("β in real states: the newest block remembered is the block before", () => {
  for (let n = 2; n <= 100; n++) {
    const { history }: Recent = readRecent(traceState("fallback", n).entries);
    const before: Header = Block(TINY).fromJson(traceState("fallback", n - 1).block).header;
    const newest: RecentBlock = history[history.length - 1];
    const beforeHash: Bytes = headerHash(TINY, before);
    assert.deepEqual(newest.header_hash, beforeHash, `block ${n}`);
    assert.deepEqual(newest.state_root, new Uint8Array(32)); // not known yet
    const previous: RecentBlock = history[history.length - 2];
    assert.deepEqual(previous.state_root, before.parent_state_root);
    const kept: number = Math.min(n, RECENT_BLOCKS); // genesis counts too
    assert.equal(history.length, kept);
  }
});
```

A history vector is one block's news going into β: its header hash, the item for the belt, and the slot. This one is the ninth item:

::: code-group

```json [what goes in]
{
  "vector": "vectors/stf/history/tiny/progress_blocks_history-4.json",
  "input": {
    "header_hash": "0xad68628754\u2026",
    "accumulate_root": "0xa983417440\u2026",
    "slot": 8
  },
  "post_state.beta.mmr.peaks": [
    "0xa983417440\u2026",
    null,
    null,
    "0x658b919f73\u2026"
  ],
  "beefy_root": "0xebdb6db060\u2026"
}
```

```text [console]
stf/history                8 of 8  ✔
86 of 1,428 vectors pass.
```

:::

Run whole means β after the block, history entries and belt peaks together, equals the vector's, and the new entry's `beefy_root` too. Here the belt ends as `● · · ●`, nine items.

**Run**

```sh
npm test
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
stf/history                8 of 8  ✔
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

86 of 1,428 vectors pass.
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=scoreboard-1791939138847
```

> [!TIP] Milestone
> **Every history vector.** All 8, tiny and full: the chain's short-term
> memory, and the belt's peaks, exactly as the vectors keep them.

<details>
<summary>lasair: <code>recent_history_core</code>, in <code>conformance/history.ml</code></summary>

```ocaml
  let new_entry = {
    e_header_hash = header_hash;
    e_beefy_root = beefy_root;
    e_state_root = Bytes.make 32 '\x00';  (* Corrected next block *)
    e_slot = slot;                         (* GP 0.8.0 (#526): item carries the block's timeslot *)
    e_reported = reported;
  } in
```

The same entry as yours, field for field, and lasair marks the slot as new in 0.8.0 with
the number of the Gray Paper change that added it. Specs move; good code says which
version it follows. Just above this, lasair also sorts the reported packages by hash,
the road yours doesn't take yet (the note above).

</details>

## Check your understanding

::: check
**Why does the state remember recent blocks at all?**

- [ ] So a node can replay the last eight blocks after a crash
  > No: an entry is a few hashes and a slot, not a block. Nothing can be replayed from
  > it.
- [ ] To build the belt
  > No: the belt grows from each block's accumulation root. The list sits beside it.
- [x] Guarantors anchor their work on them, and the chain turns away a report it has already seen
  > Yes: a guarantee's anchor must be one of those eight blocks, and each entry keeps
  > the packages its block reported, so a package reported again is easy to spot.

**Why is the newest entry's state root 32 zeros?**

- [ ] The newest block changed nothing, so its state is empty
  > No: every new entry starts with zeros, whatever its block did.
- [x] A block's state root comes after the block, so the next block writes it in
  > Yes: the next block brings it as `parent_state_root`, H_R. Until then, the zeros are
  > "inaccurate but safe": nothing reads them.
- [ ] Only older blocks keep a state root, to save space
  > No: every other entry has its own. Only the newest is still waiting.

**The list holds slots 42 to 49. Block 50 arrives. What does the list hold after it?**

- [x] Slots 43 to 50, with 49's state root filled in and 50's zeros
  > Yes: all three steps. Fill in the blank, add the new entry, keep the last H = 8.
- [ ] Slots 42 to 50, nine blocks
  > No: H = 8. The ninth entry pushes slot 42 out.
- [ ] Slots 42 to 49, unchanged until the epoch ends
  > No: β changes every block. Each block adds itself and forgets the oldest.

**The belt never forgets a block, and the list forgets all but eight. Why does the belt stay small?**

- [ ] It drops its oldest peaks, as the list drops its oldest entries
  > No: it never resets and never forgets. Every block since genesis is under one of
  > its peaks.
- [x] It has one place per binary digit of the block count, not one per block
  > Yes: each peak commits to all the blocks under it. A year of 6-second blocks needs
  > 23 places.
- [ ] It keeps only the super-peak
  > No: it keeps the peaks. The super-peak is made from them, fresh every block.

**What is an entry's `beefy_root`?**

- [ ] The block's header hash, under another name
  > No: `header_hash` is its own field, a Blake2b hash of the header.
- [ ] The accumulation root that block appended
  > No: that's only the newest item. `beefy_root` covers every item the belt holds.
- [x] The belt's super-peak, just after that block
  > Yes: [lesson 9.1](./01-the-mountain-belt.md)'s M_R of the belt, once the block's accumulation root is on it.
:::

## What you have

The chain's short-term memory: eight blocks, kept up to date, with the blank from last
block filled in every time, and every history vector passing whole. That's what the
chain remembers. [Part 10](../10-disputes/index.md) is how it judges, when a work-report
that validators vouched for turns out to be wrong.

Next: [Part 10 · Disputes](../10-disputes/index.md)
