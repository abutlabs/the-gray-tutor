<!-- Lesson 21.3: the slot clock. Three early blocks; the reader moves the clock and each
     becomes importable when its slot begins. Computed in slot-clock.ts. -->
<script setup lang="ts">
import { computed, ref } from "vue";
import { LAST_SECOND, slotAt, SLOTS, status } from "./slot-clock.ts";

const second = ref(0);
const move = (by: number) => { second.value = Math.max(0, Math.min(LAST_SECOND, second.value + by)); };
const blocks = computed(() => SLOTS.map((slot) => ({ slot, ...status(second.value, slot) })));
const time = computed(() => `12:00:${String(second.value).padStart(2, "0")}`);
</script>

<template>
  <div class="widget slot-clock">
    <div class="readout" aria-live="polite">
      <div class="tile"><span class="tile-label">the clock, 1 Jan 2025 UTC</span><span class="tile-value">{{ time }}</span></div>
      <div class="tile"><span class="tile-label">𝒯, seconds</span><span class="tile-value">{{ second }}</span></div>
      <div class="tile"><span class="tile-label">the slot now</span><span class="tile-value">{{ slotAt(second) }}</span></div>
    </div>
    <div class="controls">
      <button class="small" @click="move(-1)">− 1 s</button>
      <button class="small" @click="move(1)">+ 1 s</button>
      <button class="small" @click="move(6)">+ 6 s, a slot</button>
      <button class="small" @click="second = 0">start again</button>
    </div>
    <ul class="kept">
      <li v-for="b in blocks" :key="b.slot" class="node" :class="{ held: b.held }">
        <span class="mono">block {{ b.slot }} · slot {{ b.slot }}</span> <span class="why">{{ b.says }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.slot-clock .readout { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); }
.tile .tile-value { font-size: 18px; white-space: nowrap; }
.controls { display: flex; flex-wrap: wrap; gap: 4px; margin: 8px 0; }
.controls button.small { min-height: 32px; font-size: 12px; }
.kept { list-style: none; margin: 0; padding: 0; }
.node { margin: 2px 0; padding: 4px 6px; border: 1px solid var(--vp-c-brand-1); border-radius: 6px; background: var(--vp-c-brand-soft); font-size: 13px; line-height: 1.5; overflow-wrap: anywhere; }
.node.held { border-color: var(--vp-c-divider); background: transparent; }
.mono { font-family: var(--vp-font-family-mono); font-size: 12px; }
.why { color: var(--vp-c-text-2); }
</style>
