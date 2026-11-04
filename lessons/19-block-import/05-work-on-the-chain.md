# Work on the chain

The `fallback` and `safrole` traces carry no work: no reports, no accumulation. The
`storage` and `preimages` traces do. Real services refine, guarantee and accumulate in
them, write storage and ask for preimages. This lesson runs your importer on them, and the
traces find two things it gets wrong, neither of which any test vector could show. By the
end of it all four traces with work import, chained, every root right.

## New words

- **β†.** The recent history halfway through a block: the newest block it remembers now
  has its state root, the one this block's header gives. *Example:* a report anchored on
  the parent block is checked against β†, which knows the parent's state root; β doesn't.
- **Canonical order.** The one order a set is written in, so that every client writes it
  the same: sorted. *Example:* the packages in each slot of ξ, smallest hash first.

Both are in the [glossary](../glossary.md).

## The tests

The light traces, with one work-item per report, are quicker to import:

**Add to** `test/import.test.ts`

```ts
test("Υ with work: the first 25 blocks of the storage_light and preimages_light traces", () => {
  for (const family of ["storage_light", "preimages_light"]) {
    for (let n = 1; n <= 25; n++) {
      const { root, expected } = importTrace(family, n);
      assert.equal(root, expected, `${family} block ${n}`);
    }
  }
});
```

**Run, expect it to fail**

```sh
npm test
```

```text
...
ℹ tests 646
ℹ suites 0
ℹ pass 645
ℹ fail 1
...
  AssertionError [ERR_ASSERTION]: storage_light block 1
  + actual - expected

  + 'bad_state_root'
  - '0xcf7ecaf55c657f55300aa11cdbd11f4f588db3271743925044eb0ca8ecef9ccf'
...
```

Block 1 of `storage_light` is refused with `bad_state_root`: a report's anchor block says
its state root is one thing, and your client thinks it's another. The block is good. Your
client is reading the wrong history.

## What the Gray Paper says

§7, *Recent History*, and §4's dependency graph ([lesson 19.1](./01-the-order-of-things.md)), which lists β_H† as its own step:
the history halfway through the block. Every block in β has its state root, but the newest
one's is still zeros ([lesson 9.2](../09-recent-history/02-recent-blocks.md)): nobody knew it until the next block, *this* block, named it
in its header, as `parent_state_root`. β† is β with that root filled in, and §11's report
checks use β†, not β. A report anchored on the parent block is the usual case, and
against β it fails.

<BetaDagger />

[Lesson 12.5](../12-guarantees/05-bad-reports.md)'s vectors never showed this: they hand over a history whose roots are all known.

## The code

**Replace in** `src/import.ts`

```ts
/** The guarantees (Part 12): checked against the cores, the guarantors and the recent
 * history, then their reports take their cores, ρ′. */
function takeGuarantees(
  config: Config,
  state: State,
  block: Block,
  cores: (PendingReport | null)[], // ρ‡
  sealed: Safrole, // for η′, κ′ and λ′
  offenders: Bytes[], // ψ′_O
) {
  const { guarantees } = block.extrinsic;
  const { slot } = block.header;
  const { entropy, validators } = sealed;
  const assignments = guarantorAssignments(
    config, slot, entropy, validators.active, validators.previous, offenders,
  );
  const count = validators.active.length;
  const error = guaranteeError(config, guarantees, slot, assignments, cores, state[1], count);
  if (error) return { error };
  const reports = guarantees.map((g) => g.report); // 𝐈
  const history = state[3].history.map((b, i, all) => // β†: the newest block's root, known now
    i === all.length - 1 ? { ...b, state_root: block.header.parent_state_root } : b,
  );
  const problem = reportError(reports, history, pipeline(state), services(state));
  if (problem) return { error: problem };
  return { cores: placeReports(cores, guarantees, slot), reports };
}
```

```ts
  const history = state[3].history.map((b, i, all) => // β†: the newest block's root, known now
    i === all.length - 1 ? { ...b, state_root: block.header.parent_state_root } : b,
  );
```

**Run, expect it to fail**

```sh
npm test
```

```text
...
ℹ tests 646
ℹ suites 0
ℹ pass 645
ℹ fail 1
...
  AssertionError [ERR_ASSERTION]: storage_light block 6
  + actual - expected

  + '0xdb92c20d9930f30e90dc05911b23435f295341649f9ef1ee1c8026796c7b9bda'
  - '0x1a75fe79a3bb1fc635030f6dd1466d071da06dd00b79d5a7b55552f295efa9de'
...
```

Further: block 6 imports, but its root isn't the trace's. A whole state is a lot of bytes
to compare by eye, so compare the states component by component. The difference is in
C(15), ξ: the same packages, in another order.

## What the Gray Paper says, again

ξ holds *sets* of packages, one per slot. A set has no order of its own, but bytes do, so
Appendix D writes every set in one order, sorted: the *canonical order*. Your
`accumulateBlock` collects a slot's packages in the order they accumulated, which is right
for accumulating and wrong for writing down.

<SetOrder />

Sorting hex strings sorts their bytes, so:

**Replace in** `src/import.ts`

```ts
/** σ′ but for δ′'s preimages: every component after the block, from what the steps made,
 * and β′, α′ and π′, which come last. */
function nextState(config: Config, state: State, block: Block, made: Made): State {
  const { header, extrinsic } = block;
  const { sealed, accumulation } = made;
  const after = accumulation.state;
  const recent = recordBlock(state[3], {
    header_hash: headerHash(config, header),
    parent_state_root: header.parent_state_root,
    accumulate_root: outputsRoot(accumulation.outputs),
    slot: header.slot,
    work_packages: reportedPackages(extrinsic.guarantees),
  }); // β′
  const queues = state[2].map((q, c) => accumulation.queues.get(c) ?? q); // ϕ′
  const used = usedAuthorizers(extrinsic.guarantees);
  const statsBefore = { slot: state[11], current: state[13].vals_curr, last: state[13].vals_last };
  const validatorStats = updateValidatorStats(
    config, statsBefore, header.slot, header.author_index, extrinsic, sealed.validators.active,
  );
  const incoming = made.guaranteed.reports;
  const activity = serviceStats(incoming, extrinsic.preimages, accumulation.statistics);
  const byId = <T>(m: Map<number, T>) => [...m].sort(([x], [y]) => x - y);
  const staging = accumulation.staging?.map((k) => decode(ValidatorKey, k)); // ι′, if chosen
  return {
    ...state,
    1: nextPools(state[1], queues, used, header.slot), // α′
    2: queues,
    3: recent,
    4: {
      pending: sealed.validators.pending,
      ring_root: sealed.ringRoot,
      sealers: sealed.sealers,
      accumulator: sealed.accumulator,
    },
    5: made.judgements,
    6: sealed.entropy,
    7: staging ?? sealed.validators.staging,
    8: sealed.validators.active,
    9: sealed.validators.previous,
    10: made.guaranteed.cores,
    11: header.slot,
    12: {
      ...after.privileges,
      always_acc: byId(after.free).map(([id, gas]) => ({ id, gas })),
    },
    13: {
      vals_curr: validatorStats.current,
      vals_last: validatorStats.last,
      cores: coreStats(config, incoming, made.assured.reports, extrinsic.assurances),
      services: byId(activity).map(([id, record]) => ({ id, record })),
    },
    14: after.ready.map((waiting) =>
      waiting.map((w) => ({ report: w.report, dependencies: [...w.dependencies].map(fromHex) })),
    ),
    15: after.accumulated.map((packages) => [...packages].sort().map(fromHex)), // sorted sets
    16: accumulation.outputs,
    accounts: after.accounts,
  };
}
```

```ts
    15: after.accumulated.map((packages) => [...packages].sort().map(fromHex)), // sorted sets
```

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ Υ with work: the first 25 blocks of the storage_light and preimages_light traces (7966.316625ms)
...
ℹ tests 646
ℹ suites 0
ℹ pass 646
ℹ fail 0
...
reported 646 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791773679824
...
```

## Watch it

`bin/import.ts` takes the trace's first state, then imports each block into the state it
made from the one before, and compares the root with the trace's. Its first block:

::: code-group

```json [what goes in]
{
  "traces/storage_light/00000001.json": {
    "pre_state.keyvals": "… 21 entries: the state before block 1 …",
    "block.header": { "slot": 1, "parent": "0x245becfe7f…", "parent_state_root": "0xd6e78dc07a…" },
    "block.extrinsic": {
      "guarantees": [
        { "report": { "core_index": 1, "results": [{ "service_id": 0, "code_hash": "0x128fc8f057…" }] } }
      ],
      "tickets": [], "preimages": [], "assurances": []
    },
    "post_state.state_root": "0xcf7ecaf55c…"
  }
}
```

```ts [what it computes]
// one turn of the loop: importBlock, then the root of what it made
const computed = {
  state: 21, // KeyValue[] in: entries of the state before block 1
  result: "21 entries", // importBlock's answer: a new state (no "error" in it), still 21 entries
  root: "0xcf7ecaf55c…", // stateRoot(result): the new state's 32-byte root
  same: true, // root === post_state.state_root: matched becomes 1
};
```

```text [what comes out]
block 1, slot 1: imported; root 0xcf7ecaf5… = the trace's
```

:::

The guarantee for core 1 is real work now, what this lesson brings onto the chain, and the root your client
makes from it is the one the trace wrote down. The loop then hands that state to block 2.

**Run**

```sh
npm run import storage_light
```

```text
block 1, slot 1: imported; root 0xcf7ecaf5… = the trace's
block 2, slot 2: imported; root 0x435a89d7… = the trace's
...
block 99, slot 99: imported; root 0x660d19aa… = the trace's
block 100, slot 100: imported; root 0xdee30047… = the trace's
100 of 100 state roots as the trace's
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=import-1791773693155
```

A hundred blocks with work, chained, every root right. The full `storage` and `preimages`
traces, with six work-items to a report, take a minute or so each; try them too:
`npm run import storage`.

<details>
<summary>lasair: the same two fixes, in <code>conformance/accumulate.ml</code> and <code>conformance/guarantors.ml</code></summary>

The anchor's state root, when the anchor is the newest block:

```ocaml
        let expected_root =
          if is_latest then gc.gc_parent_state_root else e.e_state_root in
        if not (Bytes.equal expected_root r.tr_context.rc_state_root) then
          reject "bad_state_root";
```

and ξ's newest slot:

```ocaml
  (* xi entries are SETS of package hashes; JAM serializes sets in
     lexicographic order (first divergence from core order: block 25). *)
  new_rings.(epoch_len - 1) <- List.sort Bytes.compare pkg_hashes;
```

lasair met both of these the same way you did, against the traces. Its comment even
remembers the block where the order first went wrong in its own run: 25, of a trace your
client's test met at block 6. lasair checks against `gc_parent_state_root` only when the
anchor is the newest block, where your client fills that root into β† first; the effect
is the same.

</details>

## Check your understanding

::: check
**Block 1 of `storage_light` is a good block, yet your client refused it with `bad_state_root`. Why?**

- [ ] The trace was made with an older Gray Paper
  > No: the traces are 0.8.0, as your client is. The mistake was your client's.
- [x] It checked the report's anchor against β, where the newest block's root is still zeros
  > Yes: the report was anchored on the parent block. β doesn't know the parent's
  > state root yet; β†, with the root from this header, does.
- [ ] The report's anchor block was too old to be checked
  > No: the anchor was the parent, the newest block there is. That's exactly the one
  > whose root β is missing.

**Why is the newest block's state root zeros in β?**

- [ ] Zeros mean that block was empty
  > No: every block gets zeros there when it's recorded, empty or not.
- [ ] β keeps only header hashes, never roots
  > No: every other block in β has its root. Only the newest one's is missing.
- [x] Nobody knew it until the next block named it, as `parent_state_root`
  > Yes: a block's state root is only known once the block is imported. The next
  > block's header names it, and β† fills it in.

**[Lesson 12.5](../12-guarantees/05-bad-reports.md)'s report vectors all passed. Why didn't they catch this?**

- [x] They hand over a history whose roots are all known
  > Yes: with every root filled in already, β and β† are the same. Only a real chain
  > has a newest block with its root still zeros.
- [ ] They have no reports with an anchor
  > No: every report has a context with an anchor. The vectors' anchors just never
  > hit a missing root.
- [ ] Report checks aren't part of the state transition
  > No: they are, in §11. A bad report refuses the block.

**After block 6, ξ held the right packages in another order, and the root was wrong. Why does the order matter?**

- [ ] The order says which package accumulated first, and the state must remember it
  > No: ξ holds a set for each slot. It says which packages accumulated in it, not in
  > what order.
- [x] A set has no order, but bytes do, so every client writes it one way: sorted
  > Yes: the root fingerprints the bytes. Two clients writing the same set in two
  > orders get two roots, so Appendix D says sorted.
- [ ] Sorted lists are quicker to search
  > No: speed has nothing to do with it. The point is that everyone writes the same
  > bytes.
:::

## What you have

Υ on blocks with work: four more traces, 400 blocks, every root right. Two families are
left, `fuzzy` and `fuzzy_light`, made by the conformance fuzzer's own service, and the
first with blocks that must be refused: [lesson 19.6](./06-blocks-to-refuse.md).

**Say it out loud.** Real blocks found what vectors couldn't: reports are checked against a history that knows the parent's state root, and sets must be written sorted.

Next: [19.6 Blocks to refuse](./06-blocks-to-refuse.md)
