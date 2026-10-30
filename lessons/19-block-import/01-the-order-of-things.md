# The order of things

Eighteen parts, and you've built nearly every piece of a block import: the clock, Safrole,
disputes, assurances, guarantees, accumulation, statistics. A real block runs them all.
But in what order? Safrole's new state needs the new entropy, accumulation needs to know
which reports became available, the statistics need what accumulation did. The Gray Paper
answers with a list of what each new piece of state is made from. This lesson writes that
list down, works out an order from it, and turns it into a map of the client you've built.

## New words

- **Intermediate value.** A value halfway through a block, marked with a dagger. *Example:*
  ρ† is the cores after the judgments, ρ‡ the cores after the assurances too, and ρ′ the
  cores after the whole block.
- **Dependency graph.** A list of what each value is made from. *Example:* γ′ is made
  from the header, τ, the tickets, γ, ι, η′, κ′ and ψ′.
- **Wave.** This client's name for a group of steps whose ingredients are all ready. Steps
  in one wave don't need each other, so they could run side by side. *Example:* wave 1 is
  everything made only from the block and the state before it.

All three are in the [glossary](../glossary.md).

## What the Gray Paper says

§4.2, *State Transition Dependency Graph*. For every new piece of state, one line says what
it's made from. Read `x ≺ (a, b, c)` as "x is made from a, b and c". Two of them, in plain
English:

- ρ‡ ≺ (E_A, ρ†): the cores after the assurances are made from the assurances, and the
  cores after the judgments.
- γ′ ≺ (H, τ, E_T, γ, ι, η′, κ′, ψ′): Safrole's next state needs the new entropy, the new
  validators and the new offenders (so an offender can be kept out of the next set).

A prime (′) is a value after the block, a dagger a value halfway through it. Anything
without one is either part of the block (the header H and the extrinsic's parts E_T, E_D,
E_P, E_A, E_G) or the state before it, which is there from the start.

Why write it this way? The Gray Paper's own reason is to help clients do the work in
parallel, *"we minimize the depth of the dependency graph"*: the fewer steps that wait for
others, the more can run at once.

Two things to watch for. The list is in the Gray Paper's order, not an order you can run:
γ′ comes before η′, which it needs. And it's a summary: 𝐑*, the reports ready to
accumulate, is listed as made from E_A and ρ† alone, but its full definition ([lesson 17.2](../17-accumulation/02-waiting-reports.md))
also reads the ready queue ω. That's state from before the block, there from the start, so
the order doesn't change.

Here is the whole list as a map. The block and the state before it sit at the top: they're
wave 0. Tap any value. What it's made from turns green, what's made from it turns blue, and
its wave is one more than its latest input's. Try γ′ to see what Safrole waits for. Then
follow the reports from ρ† down, one tap a wave: that chain is what makes the list four
waves deep.

<ImportWaves />

## The tests

**New file** `test/import.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import type { Step } from "../src/import.ts";
import { STEPS, waves } from "../src/import.ts";

/** The values each wave makes, wave by wave. */
const made = (ws: Step[][]) => ws.map((w) => w.flatMap((s) => s.makes));

test("the Gray Paper's list isn't a recipe: γ′ comes before η′, which it's made from", () => {
  const at = (x: string) => STEPS.findIndex((s) => s.makes.includes(x));
  const gammaAt: number = at("γ′");
  const etaAt: number = at("η′");
  assert.ok(gammaAt < etaAt);
  const madeFromEta: boolean = STEPS[gammaAt].from.includes("η′");
  assert.ok(madeFromEta);
});

test("four waves: the first needs only the block and the state before it", () => {
  const ws: string[][] = made(waves(STEPS));
  assert.equal(ws.length, 4);
  assert.deepEqual(ws[0], ["τ′", "β_H†", "η′", "κ′", "λ′", "ψ′", "ρ†"]);
  const safroleWaits: boolean = ws[1].includes("γ′"); // for the new entropy, keys and offenders
  assert.ok(safroleWaits);
  assert.deepEqual(ws[3], ["β_H′", "δ′", "α′", "π′"]); // all waiting for accumulation
});

test("every step comes after everything it's made from", () => {
  const ws: Step[][] = waves(STEPS);
  const madeBy = new Map(ws.flatMap((w, i) => w.flatMap((s) => s.makes.map((x) => [x, i]))));
  ws.forEach((wave, i) => {
    for (const step of wave) {
      for (const x of step.from) {
        const madeIn: number = madeBy.get(x) ?? -1;
        assert.ok(madeIn < i, x);
      }
    }
  });
});

test("steps that wait for each other are caught", () => {
  const loop = [
    { makes: ["a′"], from: ["b′"], lesson: "" },
    { makes: ["b′"], from: ["a′"], lesson: "" },
  ];
  assert.throws(() => waves(loop), /wait for each other/);
});
```

The second test pins down the waves. The first wave is seven steps that need nothing but
the block and the old state. Safrole waits until wave 2, and the last wave is everything
waiting for accumulation.

A stub for the order: every step in one wave, as if the Gray Paper's list could simply run
top to bottom. `Step` and `STEPS` are the real thing already:

**New file** `src/import.ts`

```ts
// Block import (GP §4): the state transition Υ, one block at a time. This file starts with
// its plan: every new piece of state, what it's made from, and an order to make them in.

/**
 * One step of Υ (GP §4.2): the values it makes, the values it's made from, and the lesson
 * that builds it. A prime (′) is a value after the block, a dagger (†, ‡) a value halfway
 * through it; H and the E_ are the block's header and extrinsic parts; the rest is the
 * state before the block.
 */
export type Step = { makes: string[]; from: string[]; lesson: string };

/** The Gray Paper's dependency graph (§4.2, equation transitionfunctioncomposition), in the
 * order it lists the steps. */
export const STEPS: Step[] = [
  { makes: ["τ′"], from: ["H"], lesson: "4.6" },
  { makes: ["β_H†"], from: ["H", "β_H"], lesson: "9.2" },
  { makes: ["γ′"], from: ["H", "τ", "E_T", "γ", "ι", "η′", "κ′", "ψ′"], lesson: "8.5" },
  { makes: ["η′"], from: ["H", "τ", "η"], lesson: "8.1" },
  { makes: ["κ′"], from: ["H", "τ", "κ", "γ"], lesson: "8.2" },
  { makes: ["λ′"], from: ["H", "τ", "λ", "κ"], lesson: "8.2" },
  { makes: ["ψ′"], from: ["E_D", "ψ"], lesson: "10.1, 10.2" },
  { makes: ["ρ†"], from: ["E_D", "ρ"], lesson: "10.3" },
  { makes: ["ρ‡"], from: ["E_A", "ρ†"], lesson: "11.2" },
  { makes: ["ρ′"], from: ["E_G", "ρ‡", "κ", "τ′"], lesson: "12.3" },
  { makes: ["𝐑*"], from: ["E_A", "ρ†"], lesson: "11.1, 17.2" },
  {
    makes: ["ω′", "ξ′", "δ‡", "χ′", "ι′", "ϕ′", "θ′", "𝐒"],
    from: ["𝐑*", "ω", "ξ", "δ", "χ", "ι", "ϕ", "τ", "τ′"],
    lesson: "17",
  },
  { makes: ["β_H′"], from: ["H", "E_G", "β_H†", "θ′"], lesson: "9.2" },
  { makes: ["δ′"], from: ["E_P", "δ‡", "τ′"], lesson: "14.1" },
  { makes: ["α′"], from: ["H", "E_G", "ϕ′", "α"], lesson: "13.1" },
  {
    makes: ["π′"],
    from: ["E_G", "E_P", "E_A", "E_T", "τ", "κ′", "π", "H", "𝐒"],
    lesson: "18",
  },
];

export function waves(steps: Step[]): Step[][] {
  return [steps];
}
```

`STEPS` is the Gray Paper's list, line for line, with the lesson that built each step.

**Run, expect it to fail**

```sh
npm test
```

```text
...
✔ the Gray Paper's list isn't a recipe: γ′ comes before η′, which it's made from (0.5ms)
✖ four waves: the first needs only the block and the state before it (0.6ms)
✖ every step comes after everything it's made from (0.2ms)
✖ steps that wait for each other are caught (0.1ms)
...
ℹ tests 640
ℹ suites 0
ℹ pass 637
ℹ fail 3
...
test at test/import.test.ts:18:1
✖ four waves: the first needs only the block and the state before it (0.6ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:

  1 !== 4
...
```

One green and three red. The green is the first test: the list isn't a recipe, which is
true whatever `waves` does. The reds are the order itself: one wave where there should be
four (`1 !== 4`), steps that come before what they're made from, and a loop of steps that
wait for each other going unnoticed.

## The code

**Replace in** `src/import.ts`

```ts
/**
 * The steps in waves: first every step made only from the block and the state before it,
 * then every step whose inputs the first wave made, and so on. Steps in one wave don't
 * need each other, so a client could run them side by side. Throws if some steps can
 * never run because they wait for each other.
 */
export function waves(steps: Step[]): Step[][] {
  const madeByAStep = new Set(steps.flatMap((s) => s.makes));
  const made = new Set<string>();
  const ready = (s: Step) => s.from.every((x) => made.has(x) || !madeByAStep.has(x));
  const out: Step[][] = [];
  let left = steps;
  while (left.length > 0) {
    const wave = left.filter(ready);
    if (wave.length === 0) throw new Error("these steps wait for each other");
    out.push(wave);
    for (const step of wave) for (const x of step.makes) made.add(x);
    left = left.filter((s) => !wave.includes(s));
  }
  return out;
}
```

`waves` finds the order. `madeByAStep` is everything some step makes. Anything else (the
block, the old state) counts as ready from the start. Each time round, every step whose
ingredients are all ready forms the next wave. If a round finds nothing ready while steps
are left, they're waiting for each other, and no order exists.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ the reported packages: each one's hash and exports root, sorted by hash (260.5ms)
...
✔ the Gray Paper's list isn't a recipe: γ′ comes before η′, which it's made from (0.5ms)
✔ four waves: the first needs only the block and the state before it (0.5ms)
✔ every step comes after everything it's made from (0.2ms)
✔ steps that wait for each other are caught (0.2ms)
...
ℹ tests 640
ℹ suites 0
ℹ pass 640
ℹ fail 0
...
reported 640 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791741143636
...
```

## Watch it

**New file** `bin/plan.ts`

```ts
// Prints the plan of a block import: the Gray Paper's steps in waves, each with what it's
// made from and the lesson that builds it.
// Usage: npm run plan

import { STEPS, waves } from "../src/import.ts";
import { Run } from "../src/obs.ts";

const run = new Run("plan");
waves(STEPS).forEach((wave, i) => {
  console.log(`wave ${i + 1}:`);
  for (const step of wave) {
    const makes = step.makes.join(", ");
    const from = step.from.join(", ");
    console.log(`  ${makes} ← ${from}  (lesson ${step.lesson})`);
    run.event("step", { wave: i + 1, makes, from, lesson: step.lesson });
  }
});
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

**What flows through it.** This program reads no vector — its input is `STEPS`, the
dependency table you just wrote. The three faces of its run:

::: code-group

```text [what goes in]
STEPS, 16 entries of src/import.ts, each "makes ← from", such as:

  { makes: ["τ′"], from: ["H"], lesson: "4.6" }
  { makes: ["γ′"], from: ["H", "τ", "E_T", "γ", "ι", "η′", "κ′", "ψ′"], lesson: "8.5" }
```

```ts [what it computes]
// waves(STEPS): every step whose ingredients are all ready goes in the next wave
const computed = {
  waves: 4, // the whole block import, four rounds of independent steps
  sizes: [7, 3, 2, 4], // how many steps run side by side in each
  example: "γ′ waits for wave 2", // its from list names η′, κ′ and ψ′, made in wave 1
};
```

```text [what comes out]
wave 2:
  γ′ ← H, τ, E_T, γ, ι, η′, κ′, ψ′  (lesson 8.5)
```

:::

Read the input into the output: a step's `from` is everything it's made of; `waves`
seats a step as soon as every name in its `from` exists, so τ′ (made only from H, the
header) runs in wave 1, while γ′ — whose `from` names η′, κ′ and ψ′, all wave-1 products
— must wait for wave 2. The printed plan is just that seating order, with each step's
lesson beside it.

**Run**

```sh
npm pkg set scripts.plan="node bin/plan.ts"
npm run plan
```

```text
wave 1:
  τ′ ← H  (lesson 4.6)
  β_H† ← H, β_H  (lesson 9.2)
  η′ ← H, τ, η  (lesson 8.1)
  κ′ ← H, τ, κ, γ  (lesson 8.2)
  λ′ ← H, τ, λ, κ  (lesson 8.2)
  ψ′ ← E_D, ψ  (lesson 10.1, 10.2)
  ρ† ← E_D, ρ  (lesson 10.3)
wave 2:
  γ′ ← H, τ, E_T, γ, ι, η′, κ′, ψ′  (lesson 8.5)
  ρ‡ ← E_A, ρ†  (lesson 11.2)
  𝐑* ← E_A, ρ†  (lesson 11.1, 17.2)
wave 3:
  ρ′ ← E_G, ρ‡, κ, τ′  (lesson 12.3)
  ω′, ξ′, δ‡, χ′, ι′, ϕ′, θ′, 𝐒 ← 𝐑*, ω, ξ, δ, χ, ι, ϕ, τ, τ′  (lesson 17)
wave 4:
  β_H′ ← H, E_G, β_H†, θ′  (lesson 9.2)
  δ′ ← E_P, δ‡, τ′  (lesson 14.1)
  α′ ← H, E_G, ϕ′, α  (lesson 13.1)
  π′ ← E_G, E_P, E_A, E_T, τ, κ′, π, H, 𝐒  (lesson 18)
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=plan-1791741154262
```

That's the map of your client: every step of a block, in four waves, with the lesson that
built it. The *Block import plan* panel keeps it.

![Block import plan panel](./images/01-block-import-plan.png)

<details>
<summary>lasair: one long function, in <code>conformance/trace_runner.ml</code></summary>

lasair's `import_block` takes the steps one after another, each `let state = ...` handing
the next step the state the last one left:

```ocaml
  (* Update timeslot *)
  let state = Stf_transitions.update_timeslot state header.slot in
```

and a few lines later:

```ocaml
  (* Update entropy (with rotation at epoch boundaries) *)
  let state = Stf_transitions.update_entropy ~new_epoch state header.slot header.entropy_source header.epoch_mark in
```

One order, no waves running side by side: simpler, and fast enough. Note
`header.entropy_source`: that's H_V, the header's VRF signature, whose output [lesson
8.6](../08-safrole/06-the-vrf-output.md) reads.

</details>

## Check your understanding

::: check
**Why can't a client just run the Gray Paper's list from top to bottom?**

- [ ] The list leaves out some of the steps
  > No: it has every new piece of state, sixteen steps in all. The trouble is their
  > order.
- [x] γ′ comes before η′, and γ′ is made from η′
  > Yes: the list is in the Gray Paper's order, not an order you can run. Top to
  > bottom, Safrole would need the new entropy before anything had made it.
- [ ] Every step needs every other step, so nothing can go first
  > No: then no order would exist at all. Seven steps need only the block and the
  > state before it, and they go first.

**Why must ρ† be made before ρ‡?**

- [ ] It needn't: the two could be made in either order
  > No: ρ‡ ≺ (E_A, ρ†). ρ‡ is made from ρ†, so ρ† has to exist first.
- [ ] ρ† is the cores after the whole block, and ρ‡ a draft of it
  > No: that's ρ′. Both daggers are halfway values: ρ† after the judgments, ρ‡ after
  > the assurances too.
- [x] The assurances work on the cores as the judgments leave them
  > Yes: ρ† is the cores with the reports judged bad taken off. Only then do the
  > assurances say which reports became available, and ρ‡ is what's left.

**What puts a step in the first wave?**

- [x] Everything it's made from is in the block or the state before it
  > Yes: η′ ← H, τ, η, all there from the start. A step's wave is one more than its
  > latest input's, and the block and the old state are wave 0.
- [ ] Being near the top of the Gray Paper's list
  > No: γ′ is third in the list and waits until wave 2. ψ′ is seventh and in wave 1.
- [ ] Being quick to compute
  > No: speed doesn't come into it. Only the ingredients do.

**β_H′, δ′, α′ and π′ all land in wave 4. What are they waiting for?**

- [ ] Safrole's γ′, made in wave 2
  > No: none of them is made from γ′. π′ needs κ′, but wave 1 makes that.
- [x] Accumulation, which waits for 𝐑*, which waits for ρ†
  > Yes: ρ† in wave 1, 𝐑* in wave 2, accumulation in wave 3. Then β_H′ needs its θ′,
  > δ′ its δ‡, α′ its ϕ′ and π′ its 𝐒.
- [ ] Nothing: the last wave is just whatever is left over
  > No: a step goes in the first wave where all its inputs are ready. These four are
  > made from what accumulation makes, so wave 4 is their first chance.
:::

## What you have

The plan of a block import: every step the Gray Paper lists, what it's made from, the
order to run them in, and where you built each one. To run real blocks through it, the
client first needs the whole state at once, read from a real state and written back:
[lesson 19.2](./02-the-whole-state.md).

Next: [19.2 The whole state](./02-the-whole-state.md)
