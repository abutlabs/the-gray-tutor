<!-- Lesson 5.2's hash tree: the extrinsic hash over its five parts, and the guarantees part
     over its reports, every hash real. "Prove report 1" colours what you hand over, what
     the checker works out, and what's never shown. Computed in extrinsic-tree.ts. -->
<script setup lang="ts">
import { computed, ref } from "vue";
import { CHECK, PART_BODIES, PART_HASHES, REPORTS, ROOT, ROWS, SHOWN, type Box } from "./extrinsic-tree.ts";

const proving = ref(false);
const role = (b: Box) => (proving.value ? b.role.replace(" ", "-") : "");
const fmt = (n: number) => n.toLocaleString("en-US");
const says = computed(() => (proving.value
  ? "Hand over the blue boxes. The checker hashes report 1, fits that into the guarantees part, hashes the part, then all five: if it equals the header's extrinsic_hash, report 1 was in this block. Report 2 is only ever its hash."
  : "Each hash is made from what's under it: a part's hash from the part, the extrinsic hash from the five part hashes. A report goes into its part as its hash."));
</script>

<template>
  <div class="widget extrinsic-tree">
    <div class="readout" aria-live="polite">
      <div class="tile"><span class="tile-label">extrinsic hash (the root)</span><span class="tile-value hash">{{ ROOT.value }}</span></div>
      <div class="tile"><span class="tile-label">proving report 1 shows</span><span class="tile-value">{{ fmt(SHOWN.proof) }} of {{ fmt(SHOWN.block) }} bytes</span></div>
      <div class="tile" :class="{ ok: proving && CHECK.ok }"><span class="tile-label">the checker's root</span><span class="tile-value">{{ proving ? (CHECK.ok ? "✓ the header's" : "✗ not the header's") : "·" }}</span></div>
    </div>
    <p class="line">{{ says }}</p>
    <div class="controls" role="group" aria-label="view">
      <button class="small" :class="{ chosen: !proving }" :aria-pressed="!proving" @click="proving = false">the whole block</button>
      <button class="small" :class="{ chosen: proving }" :aria-pressed="proving" @click="proving = true">prove report 1</button>
    </div>

    <div class="tree">
      <div class="box root" :class="role(ROOT)"><b>{{ ROOT.label }}</b><span>{{ ROOT.value }}</span></div>
      <div class="down">↓ H of the five below, 160 bytes</div>
      <div class="five">
        <div v-for="b in PART_HASHES" :key="b.id" class="box" :class="role(b)"><b>{{ b.label }}</b><span>{{ b.value }}</span></div>
      </div>
      <div class="five">
        <div v-for="b in PART_BODIES" :key="b.id" class="box body" :class="[role(b), { wide: b.id === 'guarantees' }]">
          <b>{{ b.id === "guarantees" ? "↓ below" : b.label }}</b><span>{{ b.id === "guarantees" ? "" : b.value }}</span>
        </div>
      </div>
      <div class="box part" :class="role(PART_BODIES[2])">
        <b>the guarantees part</b>
        <div class="rows">
          <div v-for="(r, i) in ROWS" :key="r.id" class="column">
            <div class="box row" :class="role(r)"><b>{{ r.label }}</b><span>{{ r.value }}</span></div>
            <div class="down small">↑ H of</div>
            <div class="box report" :class="role(REPORTS[i])"><b>{{ REPORTS[i].label }}</b><span>"{{ REPORTS[i].value }}"</span></div>
          </div>
        </div>
      </div>
    </div>
    <p class="legend" :class="{ off: !proving }" :aria-hidden="!proving"><span class="key given">handed over</span> <span class="key worked-out">worked out by the checker</span> <span class="key hidden">never shown</span></p>
  </div>
</template>

<style scoped>
.extrinsic-tree .readout { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); }
.tile { min-width: 0; }
.tile .tile-value { font-size: 15px; white-space: nowrap; }
.tile.ok { border-color: var(--bit-low-line); background: var(--bit-low); }
.line { margin: 8px 0; font-size: 14px; line-height: 1.6; min-height: 4.8em; }
@media (max-width: 640px) { .line { min-height: 9.6em; } }
.controls { display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 10px; }
.controls button.small { min-height: 32px; }
.tree { display: flex; flex-direction: column; align-items: stretch; gap: 6px; }
.five { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 4px; }
.rows { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 6px; }
.column { display: flex; flex-direction: column; gap: 4px; }
.box { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 5px 4px; border: 2px solid var(--vp-c-divider); border-radius: 6px; background: var(--vp-c-bg-soft); text-align: center; min-width: 0; transition: opacity 0.3s; }
.box b { font-size: 12px; font-weight: 600; overflow-wrap: anywhere; }
.box span { font-size: 11px; font-family: var(--vp-font-family-mono); color: var(--vp-c-text-2); overflow-wrap: anywhere; }
.box.root { align-self: center; min-width: 50%; }
.box.part { background: var(--vp-c-bg); }
.down { text-align: center; font-size: 11px; color: var(--vp-c-text-3); }
.down.small { font-size: 10px; }
.box.given { border-color: var(--vp-c-brand-1); background: var(--vp-c-brand-soft); }
.box.worked-out { border-style: dashed; border-color: var(--bit-low-line); background: var(--bit-low); }
.box.hidden { opacity: 0.35; }
.legend { margin: 8px 0 0; font-size: 12px; display: flex; flex-wrap: wrap; gap: 8px; }
.legend.off { visibility: hidden; } /* its room kept, so the widget doesn't jump */
.key { padding: 2px 8px; border: 2px solid; border-radius: 4px; }
.key.given { border-color: var(--vp-c-brand-1); background: var(--vp-c-brand-soft); }
.key.worked-out { border-style: dashed; border-color: var(--bit-low-line); background: var(--bit-low); }
.key.hidden { border-color: var(--vp-c-divider); opacity: 0.5; }
</style>
