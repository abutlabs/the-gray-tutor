<!-- Lesson 5.3: which fields of the official vector the tests read, and the test itself one
     assurance at a time: validator_index picks the key, the message is built, the signature
     checked with real Ed25519. Computed in vector-step.ts. -->
<script setup lang="ts">
import { computed, ref } from "vue";
import { ASSURANCES } from "./assurance-vector.ts";
import { FIELDS, FILE, LATER, short, STEPS } from "./vector-step.ts";

const i = ref(1);
const s = computed(() => STEPS[i.value]);
const a = computed(() => ASSURANCES[i.value]);
</script>

<template>
  <div class="widget vector-step">
    <div class="readout" aria-live="polite">
      <div class="tile"><span class="tile-label">assurance</span><span class="tile-value">{{ i }} of 0 to 5</span></div>
      <div class="tile"><span class="tile-label">its key, curr_validators[{{ s.validator }}].ed25519</span><span class="tile-value hash">{{ short(s.key) }}</span></div>
      <div class="tile" :class="s.valid ? 'ok' : 'no'"><span class="tile-label">verifyEd25519</span><span class="tile-value">{{ s.valid ? "true ✓" : "false ✗ forged" }}</span></div>
    </div>
    <div class="controls" role="group" aria-label="the six assurances">
      <button v-for="t in STEPS" :key="t.index" class="small" :class="{ chosen: i === t.index }" :aria-pressed="i === t.index" @click="i = t.index">{{ t.index }} {{ t.valid ? "✓" : "✗" }}</button>
    </div>

    <ol class="steps">
      <li><code>json = input.assurances[{{ i }}]</code>: anchor <code>{{ short(a.anchor) }}</code>, bitfield <code>{{ a.bitfield }}</code>, validator_index <code>{{ a.validator_index }}</code>, signature <code>{{ short(a.signature) }}</code></li>
      <li><code>key = keys[{{ s.validator }}]</code>, from <code>pre_state.curr_validators[{{ s.validator }}].ed25519</code>: <code>{{ short(s.key) }}</code></li>
      <li><code>assuranceMessage</code>: "jam_available", 13 bytes, then H(anchor ⌢ bitfield) <code>{{ short(s.hashed) }}</code>, {{ s.messageBytes }} bytes in all</li>
      <li><code>verifyEd25519(key, message, signature)</code> → <b>{{ s.valid }}</b>{{ s.valid ? "" : ": the vector's forged one, the false in the test's [true, false, true, true, true, true]" }}</li>
    </ol>

    <p class="map-title">The whole file, <code>{{ FILE }}</code>: what the tests read today, and where the rest is read</p>
    <ul class="map">
      <li v-for="f in FIELDS" :key="f.path" :class="{ read: f.read }">
        <code>{{ f.path }}</code> <span class="what">{{ f.what }}</span>
        <span class="tag">{{ f.read ?? `later: ${LATER[f.path]}` }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.vector-step .readout { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
.tile { min-width: 0; }
.tile .tile-value { font-size: 15px; white-space: nowrap; }
.tile.ok { border-color: var(--bit-low-line); background: var(--bit-low); }
.tile.no { border-color: var(--bit-mark-line); background: var(--bit-mark); }
.controls { display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0; }
.controls button.small { min-height: 32px; min-width: 52px; font-family: var(--vp-font-family-mono); }
.steps { margin: 4px 0 10px; padding-left: 1.4em; font-size: 13px; line-height: 1.7; min-height: 13.8em; } /* the forged one's longer verdict, kept room for */
@media (max-width: 640px) { .steps { min-height: 27.2em; } }
.steps li { overflow-wrap: anywhere; }
.map-title { margin: 8px 0 4px; font-size: 13px; color: var(--vp-c-text-2); overflow-wrap: anywhere; }
.map { margin: 0; padding: 0; list-style: none; font-size: 12px; }
.map li { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 8px; padding: 4px 6px; border-left: 3px solid var(--vp-c-divider); margin: 2px 0; opacity: 0.6; }
.map li.read { opacity: 1; border-left-color: var(--vp-c-brand-1); background: var(--vp-c-brand-soft); }
.map code { overflow-wrap: anywhere; }
.what { color: var(--vp-c-text-2); }
.tag { margin-left: auto; font-size: 11px; color: var(--vp-c-text-2); }
.map li.read .tag { color: var(--vp-c-brand-1); font-weight: 600; }
</style>
