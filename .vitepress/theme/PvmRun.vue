<!-- Part 15's big picture: a real service on the PVM. The bootstrap service's accumulation,
     38 steps from ı = 5 to its first host call, as the reference client runs it: the basic
     block being run, each block paid for on the way in, the registers, and Y's memory with
     the stack growing down. On 100 gas it runs out at the fourth block's door. Computed in
     pvm-run.ts from the reference machine's run (pvm-trace.ts). -->
<script setup lang="ts">
import { computed, ref } from "vue";
import { BLOCKS, BUDGETS, frames, SECTIONS, sectionOf, STACK, value } from "./pvm-run.ts";
import { STEPS, UNREACHED } from "./pvm-trace.ts";
import { hex, pages } from "./y-layout.ts";

const budget = ref(BUDGETS[0]);
const run = computed(() => frames(budget.value));
const k = ref(0);
const f = computed(() => run.value[Math.min(k.value, run.value.length - 1)]);
const last = computed(() => run.value.length - 1);
const fmt = (n: number) => n.toLocaleString("en-US");

function pick(b: number) { budget.value = b; k.value = Math.min(k.value, run.value.length - 1); }
const go = (d: number) => { k.value = Math.min(Math.max(k.value + d, 0), last.value); };

/** The block on show, and each of its lines: run, being run, still to come, or never. */
const block = computed(() => BLOCKS[f.value.block]);
const lines = computed(() => {
  const ran = f.value.n; // steps run so far; step i (0-based) is the (i + 1)th
  const rows = block.value.steps.map((i) => {
    const [at, name, args] = STEPS[i];
    const state = f.value.stop === "oog" ? "refused" : i + 1 === ran ? "now" : i + 1 < ran ? "ran" : "to-come";
    return { at, text: `${name} ${args}`, state };
  });
  if (block.value === BLOCKS.at(-1)) rows.push({ at: UNREACHED[0], text: UNREACHED[1], state: "never" });
  return rows;
});
/** What each block's chip says: paid, being paid, refused, or not reached yet. */
const chip = (b: number) => {
  if (f.value.stop === "oog" && b === f.value.block) return "refused";
  if (b < f.value.block || (b === f.value.block && f.value.n > 0)) return b === f.value.block ? "here" : "paid";
  return "ahead";
};
const spent = computed(() => BLOCKS.filter((_, b) => chip(b) === "paid" || chip(b) === "here").map((b) => b.cost));
const touched = computed(() => (f.value.step?.[6] ? sectionOf(f.value.step[6][0]) : null));
const depth = computed(() => STACK.to - f.value.regs[1]);
const machine = computed(() => (f.value.stop === "host" ? "host call 2" : f.value.stop === "oog" ? "out of gas" : f.value.n ? "running" : "ready"));
</script>

<template>
  <div class="widget pvm-run">
    <div class="readout" aria-live="polite">
      <div class="tile"><span class="tile-label">steps run</span><span class="tile-value">{{ f.n }} of {{ STEPS.length }}</span></div>
      <div class="tile"><span class="tile-label">gas left</span><span class="tile-value">{{ fmt(f.gas) }} of {{ fmt(budget) }}</span></div>
      <div class="tile" :class="{ stopped: f.stop }"><span class="tile-label">the machine</span><span class="tile-value">{{ machine }}</span></div>
    </div>
    <p class="ins"><code>{{ f.step ? `ı = ${f.step[0]}   ${f.step[1]} ${f.step[2]}` : "ı = 5, nothing run yet" }}</code></p>
    <p class="line">{{ f.says }}</p>
    <div class="controls">
      <button class="small" aria-label="the step before" :disabled="k === 0" @click="go(-1)">← step</button>
      <button class="small" aria-label="the next step" :disabled="k >= last" @click="go(1)">step →</button>
      <button class="small" :disabled="k >= last" @click="k = last">run until it stops</button>
      <button class="small" :disabled="k === 0" @click="k = 0">start again</button>
      <span class="budget" role="group" aria-label="starting gas">
        <button v-for="b in BUDGETS" :key="b" class="small" :class="{ chosen: budget === b }" :aria-pressed="budget === b" @click="pick(b)">{{ fmt(b) }} gas</button>
      </span>
    </div>

    <div class="blocks" role="group" aria-label="the run's basic blocks, each paid for on the way in">
      <button v-for="(b, i) in BLOCKS" :key="b.at" class="chip" :class="chip(i)" :aria-label="`the block at ${b.at}, ${b.cost} gas`"
        @click="k = Math.min(b.steps[0] + 1, last)">
        <span class="at">ı {{ b.at }}</span><span class="cost">{{ b.cost }} gas</span>
      </button>
    </div>
    <div class="bar" :aria-label="`${fmt(budget - f.gas)} of ${fmt(budget)} gas spent`">
      <span v-for="(c, i) in spent" :key="i" class="paid" :class="`b${i}`" :style="{ width: `${(100 * c) / budget}%` }" />
    </div>
    <p class="bar-says">spent {{ spent.length ? spent.join(" + ") + " = " : "" }}{{ fmt(budget - f.gas) }}<template v-if="f.stop === 'oog'">; the next block wants {{ block.cost }}, and {{ f.gas }} is left</template></p>

    <div class="panes">
      <section class="code">
        <h4>the basic block at {{ block.at }}: {{ block.cost }} gas, paid on the way in</h4>
        <ol>
          <li v-for="l in lines" :key="l.at" :class="l.state">
            <span class="pc" aria-hidden="true">{{ l.state === "now" ? "▸" : "" }}</span>
            <span class="at">{{ l.at }}</span><code>{{ l.text }}</code>
          </li>
        </ol>
      </section>
      <section class="side">
        <h4>registers</h4>
        <div class="regs">
          <span v-for="(v, r) in f.regs" :key="r" class="reg" :class="{ set: f.step?.[5]?.[0] === r }"><b>r{{ r }}</b>{{ value(v) }}</span>
        </div>
        <h4>memory, as Y laid it out</h4>
        <ul class="mem">
          <li v-for="s in SECTIONS" :key="s.from" :class="{ touched: touched === s }">
            <span class="from">{{ hex(s.from) }}</span><span class="acc">{{ s.access }}</span><span class="what">{{ s.name }}, {{ pages(s) }} page{{ pages(s) === 1 ? "" : "s" }}</span>
            <template v-if="s === STACK">
              <span class="depth" aria-hidden="true"><span :style="{ width: `${(100 * depth) / (STACK.to - STACK.from)}%` }" /></span>
              <span class="depth-says">in use: {{ fmt(depth) }} of {{ fmt(STACK.to - STACK.from) }} bytes, down from the top to r1</span>
            </template>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<style scoped>
.pvm-run .readout { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); }
.tile { min-width: 0; }
.tile .tile-value { font-size: 15px; white-space: nowrap; }
.tile.stopped { border-color: var(--bit-mark-line); background: var(--bit-mark); }
.ins { margin: 8px 0 0; font-size: 13px; min-height: 1.6em; white-space: pre-wrap; overflow-wrap: anywhere; }
.line { margin: 6px 0 8px; font-size: 14px; line-height: 1.6; min-height: 4.8em; }
.controls { display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 10px; align-items: center; }
.controls button.small { min-height: 32px; }
.controls button:disabled { opacity: 0.5; cursor: default; }
.budget { display: inline-flex; gap: 4px; margin-left: auto; }
.blocks { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 4px; }
.chip { display: flex; flex-direction: column; align-items: center; min-height: 40px; padding: 3px 2px; border: 2px solid var(--vp-c-divider); border-radius: 6px; background: var(--vp-c-bg-soft); cursor: pointer; min-width: 0; }
.chip .at { font-size: 11px; font-family: var(--vp-font-family-mono); color: var(--vp-c-text-2); white-space: nowrap; }
.chip .cost { font-size: 13px; font-weight: 600; }
.chip.paid { border-color: var(--vp-c-brand-1); background: var(--vp-c-brand-soft); }
.chip.here { border-color: var(--vp-c-brand-1); background: var(--vp-c-brand-soft); outline: 3px solid var(--vp-c-text-1); outline-offset: -1px; }
.chip.refused { border-color: var(--bit-mark-line); background: var(--bit-mark); border-style: dashed; }
.chip.ahead { opacity: 0.6; }
.bar { display: flex; height: 12px; margin: 8px 0 2px; border: 1px solid var(--vp-c-divider); border-radius: 4px; overflow: hidden; background: var(--vp-c-bg-soft); }
.bar .paid { height: 100%; background: var(--vp-c-brand-1); border-right: 1px solid var(--vp-c-bg); }
.bar .paid.b1, .bar .paid.b3 { background: var(--vp-c-brand-2); }
.bar-says { margin: 0 0 10px; font-size: 12px; color: var(--vp-c-text-2); font-family: var(--vp-font-family-mono); min-height: 1.6em; }
.panes { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); gap: 10px; }
h4 { margin: 0 0 4px; font-size: 12px; font-weight: 600; color: var(--vp-c-text-2); }
.code ol { list-style: none; margin: 0; padding: 0; min-height: calc(13 * 22px); }
.code li { display: flex; gap: 6px; align-items: baseline; margin: 0; padding: 0 4px; border-radius: 4px; line-height: 22px; font-size: 12px; }
.code li code { font-size: 12px; padding: 0; background: none; overflow-wrap: anywhere; }
.code li .at { font-family: var(--vp-font-family-mono); color: var(--vp-c-text-3); min-width: 6ch; }
.code li .pc { width: 1ch; color: var(--vp-c-brand-1); }
.code li.now { background: var(--bit-top); }
.code li.to-come, .code li.refused { opacity: 0.55; }
.code li.never { opacity: 0.4; text-decoration: line-through; }
.regs { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 3px; margin-bottom: 10px; }
.reg { display: flex; gap: 6px; padding: 1px 6px; border: 1px solid var(--vp-c-divider); border-radius: 4px; font-family: var(--vp-font-family-mono); font-size: 12px; white-space: nowrap; }
.reg b { color: var(--vp-c-text-3); font-weight: 400; min-width: 3ch; }
.reg.set { border-color: var(--vp-c-brand-1); background: var(--vp-c-brand-soft); }
.mem { list-style: none; margin: 0; padding: 0; display: grid; gap: 3px; }
.mem li { display: flex; flex-wrap: wrap; gap: 2px 8px; margin: 0; padding: 3px 6px; border: 1px solid var(--vp-c-divider); border-radius: 4px; font-size: 12px; }
.mem li.touched { border-color: var(--vp-c-brand-1); background: var(--vp-c-brand-soft); }
.mem .from { font-family: var(--vp-font-family-mono); }
.mem .acc { font-family: var(--vp-font-family-mono); font-weight: 700; }
.mem .what { color: var(--vp-c-text-2); }
.depth { flex-basis: 100%; height: 8px; border: 1px solid var(--vp-c-divider); border-radius: 3px; display: flex; justify-content: flex-end; overflow: hidden; }
.depth span { background: var(--vp-c-brand-1); height: 100%; }
.depth-says { flex-basis: 100%; color: var(--vp-c-text-2); }
@media (max-width: 720px) {
  .panes { grid-template-columns: minmax(0, 1fr); }
  .budget { margin-left: 0; }
}
</style>
