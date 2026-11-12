# The order of things

**In one sentence:** a block changes the state in sixteen steps, and the Gray Paper's list
of what each step is made from is enough to work out an order to run them in.

Here is every step of a block import, and what it is made from. Tap any value: what it's
made from turns green, and what's made from it turns blue.

<a id="try-it"></a>

<ImportWaves />

## The idea

You've built nearly every piece of a block import: the clock, Safrole, disputes,
assurances, guarantees, accumulation, statistics. A real block runs them all. In what
order?

Think of cooking a dinner. The sauce needs the stock, so the stock comes first. The salad
needs neither, so anyone can make it while the stock simmers. Nobody has to hand you an
order. A list of what each dish is made from is enough.

The Gray Paper gives that list: for each new piece of state, what it is made from.
Safrole's new state needs the new entropy. Accumulation needs to know which reports
became available. The statistics need what accumulation did. Such a list is a
[*dependency graph*](../glossary.md#dependency-graph), and a value made halfway through
a block is an [*intermediate value*](../glossary.md#intermediate-value).

From the list, the order falls out. First, every step that needs only the block and the
state before it. Then every step whose ingredients those made. And so on. Each group is a
[*wave*](../glossary.md#wave). The steps in one wave don't need each other, so they could
run side by side.

This lesson writes the list down, works out the waves, and prints a map of the client
you've built.

## What the Gray Paper says

§4.2.1, *State Transition Dependency Graph*. [Lesson 0.6](../00-start/06-how-a-block-is-imported.md#what-the-gray-paper-says)
quoted its opening sentence, the reason for it; here is the list itself, and what the
paper says of its daggers:

::: gray-paper 4.2.1 2-

#### §4.2.1 State Transition Dependency Graph, continued

<a id="gp-4-2-1-p2"></a><a id="eq-4-5"></a><a id="eq-4-6"></a><a id="eq-4-7"></a><a id="eq-4-8"></a><a id="eq-4-9"></a><a id="eq-4-10"></a><a id="eq-4-11"></a><a id="eq-4-12"></a><a id="eq-4-13"></a><a id="eq-4-14"></a><a id="eq-4-15"></a><a id="eq-4-16"></a><a id="eq-4-17"></a><a id="eq-4-18"></a><a id="eq-4-19"></a><a id="eq-4-20"></a>

$$
\begin{align}
\tau' &\prec \mathbf{H} \tag{4.5} \\
\beta_H^\dagger &\prec \left(\mathbf{H}, \beta_H\right) \tag{4.6} \\
\gamma' &\prec \left(\mathbf{H}, \tau, \mathbf{E}_T, \gamma, \iota, \eta', \kappa', \psi'\right) \tag{4.7} \\
\eta' &\prec \left(\mathbf{H}, \tau, \eta\right) \tag{4.8} \\
\kappa' &\prec \left(\mathbf{H}, \tau, \kappa, \gamma\right) \tag{4.9} \\
\lambda' &\prec \left(\mathbf{H}, \tau, \lambda, \kappa\right) \tag{4.10} \\
\psi' &\prec \left(\mathbf{E}_D, \psi\right) \tag{4.11} \\
\rho^\dagger &\prec \left(\mathbf{E}_D, \rho\right) \tag{4.12} \\
\rho^\ddagger &\prec \left(\mathbf{E}_A, \rho^\dagger\right) \tag{4.13} \\
\rho' &\prec \left(\mathbf{E}_G, \rho^\ddagger, \kappa, \tau'\right) \tag{4.14} \\
\mathbf{R}^* &\prec \left(\mathbf{E}_A, \rho^\dagger\right) \tag{4.15} \\
\left(\omega', \xi', \delta^\ddagger, \chi', \iota', \phi', \theta', \mathbf{S}\right) &\prec \left(\mathbf{R}^*, \omega, \xi, \delta, \chi, \iota, \phi, \tau, \tau'\right) \tag{4.16} \\
\beta_H' &\prec \left(\mathbf{H}, \mathbf{E}_G, \beta_H^\dagger, \theta'\right) \tag{4.17} \\
\delta' &\prec \left(\mathbf{E}_P, \delta^\ddagger, \tau'\right) \tag{4.18} \\
\alpha' &\prec \left(\mathbf{H}, \mathbf{E}_G, \phi', \alpha\right) \tag{4.19} \\
\pi' &\prec \left(\mathbf{E}_G, \mathbf{E}_P, \mathbf{E}_A, \mathbf{E}_T, \tau, \kappa', \pi, \mathbf{H}, \mathbf{S}\right)\!\!\!\!\!\!\!\! \tag{4.20}
\end{align}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-thetime" class="gk-wrap">$\tau$</span> | tau | the time: the latest block's timeslot |
| <span id="gk-prec">$\prec$</span> | is defined in terms of | y ≺ x: y can be computed from x alone |
| <span id="gk-theheader" class="gk-wrap">$\mathbf{H}$</span> | H | this block's header |
| <span id="gk-recenthistorypostparentstaterootupdate" class="gk-wrap">$\beta_H^\dagger$</span> | beta sub H dagger | the recent blocks midway: with the parent's state root filled in, before this block's entry |
| <span id="gk-recenthistory" class="gk-wrap">$\beta_H$</span> | beta sub H | the last H = 8 blocks: each one's header hash, state root, belt peak and reported packages |
| <span id="gk-safrole" class="gk-wrap">$\gamma$</span> | gamma | Safrole's state: the ticket lottery for who seals the next epoch's blocks |
| <span id="gk-xttickets" class="gk-wrap">$\mathbf{E}_T$</span> | E sub T | the tickets bag: entries to the block-sealing lottery |
| <span id="gk-stagingset" class="gk-wrap">$\iota$</span> | iota | the next validators: keys queued to become active at the next epoch |
| <span id="gk-entropy" class="gk-wrap">$\eta$</span> | eta | entropy: four 32-byte values of randomness, the newest mixing in every block |
| <span id="gk-activeset" class="gk-wrap">$\kappa$</span> | kappa | the current validators: the keys of the V validators active this epoch |
| <span id="gk-disputes" class="gk-wrap">$\psi$</span> | psi | past judgments: the reports found good, bad or wonky, and the validators who lied |
| <span id="gk-previousset" class="gk-wrap">$\lambda$</span> | lambda | the last epoch's validators: kept to check what they signed before the change |
| <span id="gk-xtdisputes" class="gk-wrap">$\mathbf{E}_D$</span> | E sub D | the disputes bag: verdicts, culprits and faults |
| <span id="gk-availassignmentspostjudgment" class="gk-wrap">$\rho^\dagger$</span> | rho dagger | the pending reports midway: after disputes took the judged-bad ones out |
| <span id="gk-availassignments" class="gk-wrap">$\rho$</span> | rho | the pending reports: for each core, the report waiting to be made available, and when it came |
| <span id="gk-availassignmentspostassurances" class="gk-wrap">$\rho^\ddagger$</span> | rho double dagger | the pending reports midway: after the available ones and the timed-out ones left |
| <span id="gk-xtassurances" class="gk-wrap">$\mathbf{E}_A$</span> | E sub A | the assurances bag: validators saying they hold their pieces of reports |
| <span id="gk-xtguarantees" class="gk-wrap">$\mathbf{E}_G$</span> | E sub G | the guarantees bag: work-reports with their guarantors' signatures, one per core at most |
| <span id="gk-justbecameavailable" class="gk-wrap">$\mathbf{R}$</span> | R | the reports this block made available: ready to accumulate |
| <span id="gk-ready" class="gk-wrap">$\omega$</span> | omega | the ready queue: available reports waiting on others before they can accumulate |
| <span id="gk-accumulated" class="gk-wrap">$\xi$</span> | xi | the accumulated history: the packages accumulated in each of the last E slots |
| <span id="gk-accountspostxfer" class="gk-wrap">$\delta^\ddagger$</span> | delta double dagger | the service accounts midway: after accumulation |
| <span id="gk-privileges" class="gk-wrap">$\chi$</span> | chi | the privileged services: who may manage, assign cores, set validators and accumulate for free |
| <span id="gk-authqueue" class="gk-wrap">$\phi$</span> | phi | the authorizer queues: for each core, Q = 80 authorizer hashes waiting to join its pool |
| <span id="gk-lastaccout" class="gk-wrap">$\theta$</span> | theta | the last block's accumulation outputs: which service yielded which hash |
| <span id="gk-accumulationstatistics" class="gk-wrap">$\mathbf{S}$</span> | S | this block's accumulation tallies, per service: work-items accumulated, transfers, and gas used |
| <span id="gk-accountspre" class="gk-wrap">$\delta$</span> | delta | the service accounts before the block |
| <span id="gk-accountspostpreimage" class="gk-wrap">$\delta'$</span> | delta prime | the service accounts after the block, the preimages provided included |
| <span id="gk-xtpreimages" class="gk-wrap">$\mathbf{E}_P$</span> | E sub P | the preimages bag: data a service asked for |
| <span id="gk-authpool" class="gk-wrap">$\alpha$</span> | alpha | the authorizer pools: for each core, up to O = 8 authorizer hashes it accepts right now |
| <span id="gk-activity" class="gk-wrap">$\pi$</span> | pi | the statistics: tallies per validator, per core and per service |

</details>

→ [(4.5), (4.6), (4.7), (4.8), (4.9), (4.10), (4.11), (4.12), (4.13), (4.14), (4.15), (4.16), (4.17), (4.18), (4.19), (4.20) explained](./gray-paper.md#ex-4-5)

<a id="gp-4-2-1-p3"></a>The only synchronous entanglements are visible through the intermediate components superscripted with a dagger and defined in equations [4.6](#eq-4-6), [4.12](#eq-4-12), [4.13](#eq-4-13), [4.14](#eq-4-14), [4.16](#eq-4-16), [4.17](#eq-4-17) and [4.18](#eq-4-18). The latter two mark a merge and join in the dependency graph and, concretely, imply that the availability extrinsic may be fully processed and accumulation of work happen before the preimage lookup extrinsic is folded into state.

:::

For every new piece of state, one line says what it's made from. Read `x ≺ (a, b, c)` as
"x is made from a, b and c". Two of them:

- ρ‡ ≺ (E_A, ρ†): the cores after the assurances are made from the assurances, and the
  cores after the judgments.
- γ′ ≺ (H, τ, E_T, γ, ι, η′, κ′, ψ′): Safrole's next state needs the new entropy, the new
  validators and the new offenders (so an offender can be kept out of the next set).

A prime (′) is a value after the block. A dagger is a value halfway through it. Anything
without one is either part of the block (the header H and the extrinsic's parts E_T, E_D,
E_P, E_A, E_G) or the state before it, which is there from the start.

Why a list, and not an order? The paper's reason, in
[lesson 0.6](../00-start/06-how-a-block-is-imported.md#what-the-gray-paper-says)'s quote,
is to help clients work in parallel by keeping the graph shallow: the fewer steps that
wait for others, the more can run at once.

Its last paragraph names the seven lines where one step hands a half-made value to the
next: the daggers and three primes. The last two, (4.17) and (4.18), say accumulation is
done before the preimages extrinsic touches the accounts. That is why δ′ is made from δ‡
and comes so late.

Two things to watch for:

- **The list is not an order you can run.** It is in the Gray Paper's order: γ′ comes
  before η′, which it needs.
- **The list is a summary.** 𝐑*, the reports ready to accumulate, is listed as made from
  E_A and ρ† alone. Its full definition ([lesson 17.2](../17-accumulation/02-waiting-reports.md))
  also reads the ready queue ω. That is state from before the block, there from the
  start, so the order doesn't change.

[The map at the top](#try-it) is this list. The block and the state before it sit at the
top: they're wave 0. A value's wave is one more than its latest input's. Tap γ′ to see
what Safrole waits for. Then follow the reports from ρ† down, one tap a wave: that chain
is what makes the list four waves deep.

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

The second test pins the waves: seven steps first, Safrole in wave 2, and everything
waiting for accumulation last.

A stub for the order: every step in one wave, as if the list could run top to bottom.
`Step` and `STEPS` are the real thing already:

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

One green and three red. The first test is true whatever `waves` does. The reds are the
order itself: one wave where there should be four (`1 !== 4`), steps that come before
what they're made from, and a loop that goes unnoticed.

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

`madeByAStep` is everything some step makes. Anything else (the block, the old state) is
ready from the start. Each time round, every step whose ingredients are all ready forms
the next wave. If nothing is ready while steps are left, they wait for each other, and no
order exists.

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

**What flows through it.** This program reads no vector. Its input is `STEPS`, the
dependency table you just wrote:

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

`waves` seats a step as soon as everything in its `from` exists. So τ′, made only from
the header, runs in wave 1. γ′ needs η′, κ′ and ψ′, and waits for wave 2.

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
<summary>lasair: one long function, in <code>conformance/import.ml</code></summary>

lasair's `import_block` takes the steps one after another, each `let state = ...` handing
the next step the state the last one left:

```ocaml
  (* Update timeslot *)
  let state = Time.update_timeslot state header.slot in
```

and a few lines later:

```ocaml
  (* Update entropy (with rotation at epoch boundaries) *)
  let state = Safrole.update_entropy ~new_epoch state header.slot header.entropy_source header.epoch_mark in
```

One order, no waves running side by side: simpler, and fast enough. Note
`header.entropy_source`: that's H_V, the header's VRF signature, whose output [lesson
8.6](../08-safrole/06-the-vrf-output.md) reads.

</details>

## Check your understanding

::: check
**Why does the Gray Paper give a list of what each value is made from, and not one fixed order of steps?**

- [ ] Because the right order is different for every block
  > No: the same sixteen lines hold for every block. What a step is made from never
  > changes.
- [ ] Because a client may leave out the steps it doesn't need
  > No: the new state is everything the sixteen lines make. None of them is optional.
- [x] So a client can see which steps don't wait for each other, and run those at once
  > Yes: the paper's own reason is to help clients work in parallel. The fewer steps
  > that wait for others, the more can run side by side.

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

**Say it out loud.** The Gray Paper lists what each piece of new state is made from. Sorted out, that's four waves, and accumulation is what makes it four.

Next: [19.2 The whole state](./02-the-whole-state.md)
