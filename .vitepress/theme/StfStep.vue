<!-- The start page's At a glance: σ′ ≡ Υ(σ, B), one real block at a time. The state before (σ),
     the block (B), the rules (Υ), the state after (σ′); "next block" makes σ′ the new σ.
     Computed in stf-step.ts. -->
<script setup lang="ts">
import { computed, ref } from "vue";
import { carries, says, short, TRANSITIONS } from "./stf-step.ts";

const i = ref(0);
const t = computed(() => TRANSITIONS[i.value]);
const next = () => { i.value = (i.value + 1) % TRANSITIONS.length; };
const back = () => { i.value = 0; };
</script>

<template>
  <div class="widget stf-step">
    <div class="readout" aria-live="polite">
      <div class="tile"><span class="tile-label">block</span><span class="tile-value">slot {{ t[0] }}, {{ i + 1 }} of {{ TRANSITIONS.length }}</span></div>
      <div class="tile"><span class="tile-label">σ, the state before</span><span class="tile-value hash">{{ short(t[2]) }}</span></div>
      <div class="tile"><span class="tile-label">σ′, the state after</span><span class="tile-value hash">{{ short(t[3]) }}</span></div>
    </div>
    <p class="line">{{ says(i) }}</p>
    <div class="controls">
      <button class="small" @click="next">next block: σ′ becomes σ</button>
      <button class="small" @click="back">start again</button>
    </div>

    <div class="equation" aria-hidden="true">
      <div class="card state"><span class="sym">σ</span><span class="what">the state before</span><span class="val">{{ short(t[2]) }}</span></div>
      <span class="op">+</span>
      <div class="card block"><span class="sym">B</span><span class="what">the block for slot {{ t[0] }}</span><span class="val">by validator {{ t[1] }}: {{ carries(t[5]) }}</span></div>
      <span class="op">→</span>
      <div class="card rules"><span class="sym">Υ</span><span class="what">the rules: your client</span></div>
      <span class="op">→</span>
      <div class="card state after"><span class="sym">σ′</span><span class="what">the state after</span><span class="val">{{ short(t[3]) }}</span></div>
    </div>
    <p class="note">Real blocks: the first 12 of the official storage trace, on tiny. A state is huge, so each is shown by its root, one hash that sums it up (Part 6). Every block's σ′ is the next block's σ: that's all a chain is.</p>
  </div>
</template>

<style scoped>
.stf-step .readout { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); }
.tile { min-width: 0; }
.tile .tile-value { font-size: 15px; white-space: nowrap; }
.line { margin: 8px 0; font-size: 14px; line-height: 1.6; min-height: 3.2em; }
@media (max-width: 640px) { .line { min-height: 6.4em; } }
.controls { display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 10px; }
.controls button.small { min-height: 32px; }
.equation { display: flex; align-items: stretch; gap: 6px; flex-wrap: nowrap; }
.card { flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 8px 6px; border: 2px solid var(--vp-c-divider); border-radius: 8px; text-align: center; background: var(--vp-c-bg-soft); }
.card.block { flex-grow: 1.4; border-color: var(--vp-c-brand-1); background: var(--vp-c-brand-soft); }
.card.rules { border-style: dashed; }
.card.after { border-color: var(--bit-low-line); background: var(--bit-low); }
.sym { font-size: 24px; font-weight: 700; font-family: var(--vp-font-family-mono); }
.what { font-size: 12px; color: var(--vp-c-text-2); }
.val { font-size: 12px; font-family: var(--vp-font-family-mono); overflow-wrap: anywhere; min-height: 4.2em; } /* the longest, "by validator 3: 1 report and 4 assurances", is three lines */
.op { align-self: center; font-size: 20px; color: var(--vp-c-text-2); }
/* side by side, every card as tall as the B card's longest text, so nothing jumps */
@media (min-width: 641px) { .card { min-height: 144px; box-sizing: border-box; } }
/* a phone stacks the equation, top to bottom */
@media (max-width: 640px) {
  .equation { flex-direction: column; }
  .op { transform: rotate(90deg); }
  .op:first-of-type { transform: none; }
}
.note { margin: 8px 0 0; font-size: 13px; color: var(--vp-c-text-2); line-height: 1.5; }
</style>
