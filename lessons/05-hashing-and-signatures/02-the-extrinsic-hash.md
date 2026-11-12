# The extrinsic hash

**In one sentence:** the extrinsic hash is a header's 32-byte promise of exactly what its
block carries, built so that one report or one preimage can be proven to be in the block
without showing the rest.

Below is a small made-up block, with every hash real. Change a byte of its preimage and
watch which hashes change.

<a id="try-it"></a>

<ExtrinsicCommit />

## The idea

Nodes pass headers around on their own, ahead of the rest of the block. A header is a few
hundred bytes. The extrinsic behind it can be many times that. So how does a header say
*exactly* which extrinsic belongs to it?

With one field, the [*extrinsic hash*](../glossary.md#extrinsic-hash): 32 bytes that
promise the whole contents. Swap one ticket, drop one signature, and the promise is
broken.

One hash over everything would do that much. But to prove later that one report was in
the block, you would have to show the whole extrinsic. So the hash is built in layers.

Picture five sealed envelopes, each stamped with its fingerprint, and one fingerprint
taken over the five stamps. To show what one envelope held, you open that one and show
the other four stamps. The extrinsic's five parts are the envelopes. Inside two of them,
each report and each preimage is swapped for its own hash first, so one of those can be
shown alone too.

A hash of hashes built this way is a
[*Merkle commitment*](../glossary.md#merkle-commitment). This lesson computes the
extrinsic hash, then checks it in 400 real blocks.

## What the Gray Paper says

§5 (*The Header*):

::: gray-paper 5 9-10

#### §5 The Header, continued

<a id="gp-5-p9"></a>The extrinsic hash is a Merkle <abbr class="gp-term" title="a short hash that stands for some data, so the data can be checked against it later">commitment</abbr> to the block's extrinsic data, taking care to allow for the possibility of reports and preimages to individually have their inclusion proven. Given any block $\mathbf{B} = \left(\mathbf{H}, \mathbf{E}\right)$, then formally:

<a id="gp-5-p10"></a><a id="eq-5-4"></a><a id="eq-5-5"></a><a id="eq-5-6"></a><a id="eq-5-7"></a>

$$
\begin{align}
\mathbf{H}_{X} &\in \mathbb{H}_{} \ ,\quad
\mathbf{H}_{X} \equiv \mathcal{H}\left(\mathcal{E}_{}\left(\mathcal{H}^\#\left(\mathbf{a}\right)\right)\right) \tag{5.4} \\
\text{where } \mathbf{a} &= \left[
\mathcal{E}_{T}\left(\mathbf{E}_T\right),
\mathbf{p},
\mathbf{g},
\mathcal{E}_{A}\left(\mathbf{E}_A\right),
\mathcal{E}_{D}\left(\mathbf{E}_D\right)
\right] \tag{5.5} \\
\text{and } \mathbf{p} &= \mathcal{E}_{}\left(\left\updownarrow\left[
\left(\mathcal{E}_{4}\left(s\right), \mathcal{H}\left(\mathbf{d}\right)\right)
\;\middle\vert\;
\left(s, \mathbf{d}\right) \mathrel{\unicode{x2B40}} \mathbf{E}_P
\right]\right.\!\right) \tag{5.6} \\
\text{and } \mathbf{g} &= \mathcal{E}_{}\left(\left\updownarrow\left[
\left(\mathcal{H}\left(\mathbf{r}\right), \mathcal{E}_{4}\left(t\right), \left\updownarrow a\right.\!\right)
\;\middle\vert\;
\left(\mathbf{r}, t, a\right) \mathrel{\unicode{x2B40}} \mathbf{E}_G
\right]\right.\!\right) \tag{5.7}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-H" class="gk-wrap">$\mathbf{H}$</span> | H | this block's header; 𝐇_T is its timeslot, 𝐇_P its parent's hash |
| <span id="gk--extrinsichash">$X$</span> | X | a header's extrinsic hash: 𝐇_X stands for the block's five bags, 32 bytes |
| <span id="gk-in">[$\in$](../symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-hash">$\mathbb{H}$</span> | H | a 32-byte value, usually a hash |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-blake">$\mathcal{H}\left(x\right)$</span> | H of | the Blake2b hash of what's in the brackets: 32 bytes |
| <span id="gk-encode">[$\mathcal{E}\left(x\right)$](../symbols.md#encode)</span> | E of | the encoding of what's in the brackets: its bytes, by Appendix C's rules |
| <span id="gk-blakemany">$\mathcal{H}^\#\left(x\right)$</span> | H hash of | hash each item: ℋ#([a, b]) is [ℋ(a), ℋ(b)], a sequence of 32-byte hashes |
| <span id="gk-sq">[$\left[x\right]$](../symbols.md#sequence)</span> | the sequence | a sequence written out item by item; [ ] is the empty one |
| <span id="gk-encodetickets">$\mathcal{E}_{T}\left(x\right)$</span> | E sub T of | the tickets bag's bytes: its length, then each ticket's attempt (1 byte) and 784-byte proof |
| <span id="gk-xttickets" class="gk-wrap">$\mathbf{E}_T$</span> | E sub T | the tickets bag: entries to the block-sealing lottery |
| <span id="gk-encodeassurances">$\mathcal{E}_{A}\left(x\right)$</span> | E sub A of | the assurances bag's bytes: its length, then each one's anchor, bitfield, validator index (2 bytes) and signature |
| <span id="gk-xtassurances" class="gk-wrap">$\mathbf{E}_A$</span> | E sub A | the assurances bag: validators saying they hold their pieces of reports |
| <span id="gk-encodedisputes">$\mathcal{E}_{D}\left(x\right)$</span> | E sub D of | the disputes bag's bytes: the verdicts, the culprits and the faults, each list with its length in front |
| <span id="gk-xtdisputes" class="gk-wrap">$\mathbf{E}_D$</span> | E sub D | the disputes bag: verdicts, culprits and faults |
| <span id="gk-var">[$\left\updownarrow x\right.\!$](../symbols.md#length-prefix)</span> | with its length | ↕x: x with its length in front, as a compact natural |
| <span id="gk-build">$\left\{ x \;\middle\vert\; y \right\}$</span> | for each, such that | built by a rule: the left-hand value, for every case the right-hand side allows (a set, or a sequence in order) |
| <span id="gk-xp-serviceindex">$s$</span> | s | a preimage's service: the id of the service that asked for it, 4 bytes |
| <span id="gk-xp-data" class="gk-wrap">$\mathbf{d}$</span> | d | a preimage's data: the bytes themselves |
| <span id="gk-orderedin">$\mathrel{\unicode{x2B40}}$</span> | in order, from | each item of the sequence, in its order |
| <span id="gk-xtpreimages" class="gk-wrap">$\mathbf{E}_P$</span> | E sub P | the preimages bag: data a service asked for |
| <span id="gk-g-workreport" class="gk-wrap">$\mathbf{r}$</span> | r | a guarantee's work-report: 𝐠_𝐫 is the report it vouches for |
| <span id="gk-g-timeslot">$t$</span> | t | a guarantee's timeslot: the slot its guarantors signed it in |
| <span id="gk-g-credential">$a$</span> | a | a guarantee's credential: two or three pairs of a validator index and its Ed25519 signature |
| <span id="gk-xtguarantees" class="gk-wrap">$\mathbf{E}_G$</span> | E sub G | the guarantees bag: work-reports with their guarantors' signatures, one per core at most |

</details>

→ [(5.4), (5.5), (5.6), (5.7) in plain words](./gray-paper.md#ex-5-4)

:::

(5.4) to (5.7) are three steps:

1. Encode each of the extrinsic's five parts, in Appendix C's order: tickets, preimages,
   guarantees, assurances, disputes.
2. Hash each encoding. That's five hashes.
3. Glue the five hashes together, 160 bytes, and hash *that*.

Two parts get a twist before step 1:

- a **preimage** goes in as its requester and the *hash* of its data, not the data;
- a **guarantee** goes in as the *hash* of its work-report, then its slot and signatures.

Why? The paper's first sentence says it: each report and each preimage can be proven to
be in the block on its own. To prove one report was in a block, you show three things:
the report, the guarantees part (every other report shrunk to its 32-byte hash), and the
other four parts' hashes. Nobody needs the other reports themselves. As a tree, from the
root down:

<ExtrinsicTree />

Try it on [the block at the top](#try-it):

- **Change a byte of its preimage.** Two hashes change: the preimages part's, and the
  root. The other four stay as they were.
- **Prove report 1.** Hand over the report, the guarantees part with report 2 as its
  hash, and four hashes. The sums come back to the root. Change any piece, and they
  don't.
- **Empty the block.** You'll meet its root again further down.

## The tests

The test vectors have block traces besides `fallback`, and they carry different things.
Over their 100 blocks each:

| Trace | What its blocks carry |
| --- | --- |
| `fallback` | nothing at all: every extrinsic is empty |
| `safrole` | 80 tickets |
| `preimages` | 68 preimages, 87 guarantees, 524 assurances |
| `storage` | 86 guarantees, 520 assurances |

Together they put four of the five parts to work. No trace carries a dispute, so here the
disputes part is only ever empty. ([Lesson 4.4](../04-blocks/04-disputes.md)'s vectors
already checked its bytes.) First, let `traceBlock` read any of them:

**Replace in** `test/hash.test.ts`

```ts
/** Block n of a tiny trace ("fallback" unless said): a chain of 100 real blocks. */
function traceBlock(n: number, family = "fallback"): Block {
  const name = `traces/${family}/${String(n).padStart(8, "0")}.json`;
  const trace = vectorJson(name) as { block: unknown };
  return Block(TINY).fromJson(trace.block);
}
```

Then check every block's promise, in all four traces:

**Add to** `test/hash.test.ts`

```ts
import { extrinsicHash } from "../src/block.ts";
import type { Bytes } from "../src/bytes.ts";

test("every block's header promises its extrinsic by hash", () => {
  for (const family of ["fallback", "safrole", "preimages", "storage"]) {
    for (let n = 1; n <= 100; n++) {
      const { header, extrinsic }: Block = traceBlock(n, family);
      const hashed: Bytes = extrinsicHash(TINY, extrinsic);
      assert.deepEqual(hashed, header.extrinsic_hash, `${family} ${n}`);
    }
  }
});
```

The last argument to `deepEqual` is the message for a failure. If block 42 of `preimages`
disagrees, the test says `preimages 42`.

## The code

**Add to** `src/block.ts`

```ts
import { concatBytes } from "./bytes.ts";

/** A preimage as the extrinsic hash sees it: its requester, and the hash of its data. */
const HashedPreimage = record({
  requester: u32,
  hash: hash,
});

/** A guarantee as the extrinsic hash sees it: the report's hash in place of the report. */
const HashedGuarantee = record({
  report: hash,
  slot: u32,
  signatures: seq(ValidatorSignature),
});

/**
 * The extrinsic hash (GP §5): the hash of the five parts' hashes. Preimages and reports
 * go in by their own hashes, so that each can be proven part of the block on its own.
 */
export function extrinsicHash(config: Config, extrinsic: Extrinsic): Bytes {
  const preimages = extrinsic.preimages.map((p) => ({
    requester: p.requester,
    hash: blake2b256(p.blob),
  }));
  const guarantees = extrinsic.guarantees.map((g) => ({
    report: blake2b256(encode(WorkReport, g.report)),
    slot: g.slot,
    signatures: g.signatures,
  }));
  const parts = [
    encode(TicketsExtrinsic, extrinsic.tickets),
    encode(seq(HashedPreimage), preimages),
    encode(seq(HashedGuarantee), guarantees),
    encode(AssurancesExtrinsic(config), extrinsic.assurances),
    encode(DisputesExtrinsic, extrinsic.disputes),
  ];
  return blake2b256(concatBytes(...parts.map(blake2b256)));
}
```

The Gray Paper's three steps close the function: `parts` is step 1,
`parts.map(blake2b256)` is step 2, and `blake2b256(concatBytes(...))` is step 3. The two
twists are plain records from [Part 2](../02-codec/index.md), built for this one job.
They aren't exported: nothing else in the client needs them.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ every block's header promises its extrinsic by hash (457.8ms)
...
ℹ tests 55
ℹ suites 0
ℹ pass 55
ℹ fail 0
...
reported 55 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791728702707
...
```

400 promises, all kept. And look: all 100 `fallback` blocks carry the *same*
extrinsic hash, `0x189d15af...6ca252`. Five empty parts always encode the same way, so
they always hash the same way. That's the fingerprint of an empty block.

## Watch it

`bin/chain.ts` gets the second check, and learns to walk any trace you name.

**Rewrite** `bin/chain.ts`

```ts
// Walks the 100 blocks of a tiny trace ("fallback", unless you name another) and checks
// each one: does it name the hash of the block before it as its parent, and does its
// header's extrinsic hash match the extrinsic it carries?

import { readFileSync } from "node:fs";
import { Block, extrinsicHash, headerHash } from "../src/block.ts";
import type { Bytes } from "../src/bytes.ts";
import { toHex } from "../src/bytes.ts";
import { TINY } from "../src/config.ts";
import { Run } from "../src/obs.ts";

const trace = process.argv[2] ?? "fallback";
const run = new Run("chain");
let previous: Bytes | null = null; // the hash of the last block's header
let holding = 0;
let matching = 0;
for (let n = 1; n <= 100; n++) {
  const file = `../vectors/traces/${trace}/${String(n).padStart(8, "0")}.json`;
  const json = JSON.parse(readFileSync(file, "utf8"));
  const { header, extrinsic } = Block(TINY).fromJson(json.block);
  const hash = headerHash(TINY, header);
  const linked = previous !== null && toHex(header.parent) === toHex(previous);
  if (linked) holding++;
  const matches = toHex(extrinsicHash(TINY, extrinsic)) === toHex(header.extrinsic_hash);
  if (matches) matching++;
  run.event("block", { slot: header.slot, hash, parent: header.parent, linked, matches });
  previous = hash;
}
console.log(`${holding} of 99 links hold.`);
console.log(`${matching} of 100 extrinsics match their headers.`);
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

What `npm run chain preimages` does:

- `npm run chain` runs `node bin/chain.ts` (the script from [lesson 5.1](./01-hashes.md)), and npm passes
  on the word after it. `process.argv[2]` is that word, `"preimages"`; with none,
  `"fallback"`.
- The word names a trace: a folder of the official vectors holding real blocks in a row,
  `00000001.json`, `00000002.json` and on. This one, `../vectors/traces/preimages/`, is a
  chain where services ask for data and blocks deliver it. `bin/chain.ts` walks the first
  100 blocks of any trace.
  The folders are `fallback`, `safrole`, `storage`, `preimages` and `fuzzy`, and a lighter version of the last three: any of them works.
- For each block, two checks. Its `parent` is the hash of the block before
  ([lesson 5.1](./01-hashes.md)'s check). And the hash of the extrinsic it carries equals
  the `extrinsic_hash` its header promised (this lesson's).

Why not plain `fallback`, [lesson 5.1](./01-hashes.md)'s trace? No work happens in it, so
its blocks are all empty, every extrinsic hash is the same, and the check hardly checks.
The preimages trace's blocks carry things:
27 of them preimages (up to 10 in one block), 65 a report, 99 assurances.

What flows through one turn of the loop: block 8 of the preimages trace, the two hashes it
checks, and the lines the walk prints.

::: code-group

```json [what goes in]
{
  "block": {
    "header": {
      "parent": "0xb8f2d3623aad…",
      "slot": 8,
      "extrinsic_hash": "0xdd3582f271b4…"
    },
    "extrinsic": { "tickets": [], "preimages": [ …4… ], "guarantees": [ …2… ], "assurances": [ …6… ] }
  }
}
```

```ts [what it computes]
// bin/chain.ts's values for block 8 (vectors/traces/preimages/00000008.json)
const computed = {
  previous: "0xb8f2d362…", // headerHash of block 7, kept from the last turn
  linked: true, // header.parent is that same hash
  extrinsicHash: "0xdd3582f2…", // this lesson's hash of the 4 + 2 + 6 items carried
  matches: true, // equal to header.extrinsic_hash
  hash: "0x6095311d…", // headerHash of block 8: block 9's parent
};
```

```text [what comes out]
99 of 99 links hold.
100 of 100 extrinsics match their headers.
```

:::

Each turn hashes the header it just read and keeps it, to compare with the next block's
`parent`. It also hashes the extrinsic the block carries, to compare with the
`extrinsic_hash` its header promised. A hundred turns add up to the two counts.

**Run**

```sh
npm run chain preimages
```

```text
99 of 99 links hold.
100 of 100 extrinsics match their headers.
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=chain-1791728703751
```

The *Chain* panel now ends each block's line with `extrinsic matches: true`. Try the
others too: `npm run chain safrole`, `npm run chain storage`, and plain
`npm run chain` for `fallback`.

![Chain panel](./images/02-chain.png)

### Break it on purpose

In Gray Paper 0.7.2, preimages went into the extrinsic hash *whole*: only reports were
swapped for their hashes. 0.8.0 shrinks preimages too. Travel back in time: in
`extrinsicHash`, change

```ts
    encode(seq(HashedPreimage), preimages),
```

to

```ts
    encode(PreimagesExtrinsic, extrinsic.preimages),
```

and run `npm run chain preimages` again. 73 of 100 extrinsics match. The 27 blocks that
carry a preimage now break their promise. Every block without one is fine, because an
empty list encodes the same way under both rules. The links still hold: the headers
didn't change, only your idea of what they promise. Put the line back, and the 100 come
back.

<details>
<summary>lasair: <code>compute_extrinsic_hash</code>, in <code>conformance/validate.ml</code></summary>

lasair's lives beside the other checks on a block, and it builds each part's bytes by
hand. Its preimages:

```ocaml
  let preimages = cat (compact (List.length e.preimages) ::
    List.map (fun (req, blob) ->
      cat [u32 req; hash_bytes blob]) e.preimages) in
```

A count, then each requester as four bytes and its data's hash: exactly your
`seq(HashedPreimage)`, spelled out byte by byte, and the same for the other four parts.
Your version reuses the codecs you already trust, so it has one less place to be wrong.

</details>

## Check your understanding

::: check
**Why does a header carry an extrinsic hash at all?**

- [x] Headers travel ahead of the rest of the block, and the hash ties each to exactly one extrinsic
  > Yes: 32 bytes promise the whole contents. Swap one ticket or drop one signature, and
  > the extrinsic no longer matches its header.
- [ ] So that a node can rebuild the extrinsic from the header
  > No: a hash can't be turned back into what was hashed. It checks an extrinsic. It
  > doesn't contain one.
- [ ] It is the author's signature over the block's contents
  > No: it is a plain hash, and anyone holding the extrinsic can work it out again. That
  > is exactly what your client does.

**Why is it a hash of five hashes, and not one hash of the whole encoded extrinsic?**

- [ ] Five small hashes are faster than one big one
  > No: it's more work, not less. Every byte still gets hashed, and then the five hashes
  > are hashed once more.
- [x] So one piece can be proven to be in the block without showing the rest
  > Yes: to prove a report, you show it, its part with the other reports as hashes, and
  > the other four parts' hashes. They hash back to the root: a Merkle commitment.
- [ ] Because the five parts arrive in five separate messages
  > No: the five parts travel together, as the extrinsic. The split is for proofs.

**To prove report 1 was in a block that also has report 2, what do you hand over?**

- [ ] The whole extrinsic, report 2 included
  > No: that works, but the point is not having to. Report 2 goes in only as its
  > 32-byte hash.
- [ ] Just report 1's hash
  > No: a hash alone doesn't show where it sits. The checker needs everything that
  > leads from report 1 up to the root.
- [x] Report 1, the guarantees part with report 2 as its hash, and the other four parts' hashes
  > Yes: from those, the checker rebuilds the guarantees part's hash, then the root,
  > and compares it with the header's `extrinsic_hash`.

**Two blocks that carry nothing have the same extrinsic hash. Is that a fault?**

- [ ] Yes: one block could then be passed off as the other
  > No: each block has its own slot and parent, so their header hashes differ. That is
  > how 99 links can hold between a hundred empty blocks.
- [x] No: the same bytes always hash the same, and the blocks still differ in their headers
  > Yes: five empty parts encode the same way every time, so the root is the same. It
  > is the fingerprint of an empty block.
- [ ] It can't happen: the extrinsic hash covers the slot too
  > No: it covers the five parts and nothing else. The slot is the header's own field.

**Gray Paper 0.7.2 hashed preimages whole; 0.8.0 swaps each for its hash. Under the old rule, which blocks still match their headers?**

- [x] The ones with no preimage: an empty list encodes the same under both rules
  > Yes: both rules write an empty list as `00`. Only a block that carries a preimage
  > changes, and breaks its promise.
- [ ] Most of them: the two rules usually give the same hash
  > No: for a block with a preimage they never do. The data and its 32-byte hash are
  > different bytes.
- [ ] All of them, since the links between the blocks still hold
  > No: the links do hold, but that's a different promise. The headers didn't change,
  > only what your code thinks they promise.
:::

## What you have

A client that checks two promises in every block: the link to its parent, and the
contents of its extrinsic. One kind of promise is left in [Part 5](./index.md):
signatures, a validator's word that *it* made something.

Next: [5.3 Signatures](./03-signatures.md)
