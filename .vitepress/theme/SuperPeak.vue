<!-- Lesson 9.1: M_R, the super-peak, folded live on the tiny history vectors' real belts.
     Pick a belt; the fold runs real Keccak-256 in the page, acc = H("peak" ⌢ acc ⌢ next),
     and the answer is checked against the vector's beefy_root. Logic in super-peak.ts. -->
<script setup lang="ts">
import { computed, ref } from "vue";
import { BELTS, superPeakSteps } from "./super-peak.ts";

const k = ref(4); // 9 items: the one belt with a real merge to show
const b = computed(() => BELTS[k.value]);
const fold = computed(() => superPeakSteps(b.value.peaks));
const short = (hex: string) => `${hex.slice(0, 10)}…`;
const matches = computed(() => fold.value.root === b.value.beefy);

const note = computed(() => {
  if (fold.value.there.length === 0) return "No peaks at all: M_R is 32 zero bytes, before any block has accumulated anything.";
  if (fold.value.there.length === 1)
    return "One peak: M_R is the peak itself, no hashing — which is why this belt's beefy_root simply equals its one peak.";
  return `Two peaks, one merge: 4 + 32 + 32 = 68 bytes through Keccak-256, computed live on this page. The "peak" label keeps this hash from ever being mistaken for a branch or a leaf.`;
});
</script>

<template>
  <div class="widget super-peak">
    <div class="readout" aria-live="polite">
      <div class="tile"><span class="tile-label">M_R of this belt</span><span class="tile-value">{{ short(fold.root) }}</span></div>
      <p class="check" :class="{ ok: matches }">{{ matches ? "✓ the vector's beefy_root, byte for byte" : "✗ not the vector's" }}</p>
    </div>
    <div class="controls" role="group" aria-label="which belt">
      <button v-for="(x, i) in BELTS" :key="x.says" class="small" :class="{ chosen: k === i }" :aria-pressed="k === i" @click="k = i">{{ x.says }}</button>
    </div>
    <div class="belt">
      <span v-for="(p, place) in b.peaks" :key="place" class="place" :class="{ empty: p === null }">
        <span class="place-label">2{{ "⁰¹²³"[place] }}</span>
        <code>{{ p === null ? "∅" : short(p) }}</code>
      </span>
      <span v-if="b.peaks.length === 0" class="place empty"><code>an empty belt</code></span>
    </div>
    <ol v-if="fold.steps.length > 0" class="steps">
      <li v-for="(s, i) in fold.steps" :key="i">
        <p class="what">H(<span class="seg tag">"peak" · 4</span><span class="seg acc">{{ short(s.acc) }} · 32</span><span class="seg next">{{ short(s.next) }} · 32</span>)</p>
        <code class="hex">{{ s.hash }}</code>
      </li>
    </ol>
    <p class="note">{{ note }}</p>
  </div>
</template>

<style scoped>
.tile .tile-value { font-size: 18px; min-width: 13ch; }
.check { margin: 0; font-size: 13px; color: var(--changed-line); }
.check.ok { color: var(--vp-c-green-1); }
.controls { display: flex; flex-wrap: wrap; gap: 6px; margin: 4px 0 8px; }
.controls button.small { min-height: 32px; }
.belt { display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 8px; }
.place { display: flex; flex-direction: column; gap: 2px; padding: 6px 8px; border: 1px solid var(--vp-c-divider); border-radius: 4px; }
.place.empty { border-style: dashed; color: var(--vp-c-text-3); }
.place-label { font-size: 11px; color: var(--vp-c-text-3); }
.place code { font-size: 12px; background: none; padding: 0; }
.steps { list-style: none; margin: 0 0 8px; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.steps li { padding: 6px 8px; border: 1px solid var(--vp-c-divider); border-radius: 4px; }
.what { margin: 0 0 4px; font-size: 13px; display: flex; flex-wrap: wrap; align-items: center; gap: 2px; }
.seg { padding: 2px 6px; border: 1px solid var(--vp-c-divider); border-radius: 3px; font-family: var(--vp-font-family-mono); font-size: 11px; }
.seg.tag { background: var(--bit-mark); }
.seg.acc { background: var(--bit-top); }
.seg.next { background: var(--vp-c-default-soft); }
.hex { display: block; font-size: 12px; overflow-wrap: anywhere; word-break: break-all; color: var(--vp-c-text-3); background: none; padding: 0; }
.note { margin: 0; font-size: 13px; color: var(--vp-c-text-2); line-height: 1.5; min-height: 3em; }
</style>
