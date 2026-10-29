<!-- Lesson 8.7: the ticket arithmetic. Four tiles (n each, K a block, E kept, shuts at Y),
     a tiny/full switch, and blocks to step: the supply V × n flows at most K a block into
     the pool, which keeps the lowest E. Leads with the trap: n and K are different "max
     tickets". Computed in ticket-budget.ts. -->
<script setup lang="ts">
import { computed, ref } from "vue";
import { afterBlocks, FULL, pipeSays, room, supply, theTrap, TINY, type Budget } from "./ticket-budget.ts";

const b = ref<Budget>(TINY);
const blocks = ref(0);
const fmt = (x: number) => x.toLocaleString("en-US");
const state = computed(() => afterBlocks(b.value, blocks.value));
const atDoor = computed(() => blocks.value >= b.value.Y);

function pick(next: Budget) {
  b.value = next;
  blocks.value = 0;
}
const step = (by: number) => (blocks.value = Math.min(b.value.Y, blocks.value + by));
</script>

<template>
  <div class="widget ticket-budget">
    <div class="readout" aria-live="polite">
      <div class="tile"><span class="tile-label">n: each validator makes</span><span class="tile-value">{{ b.n }}</span></div>
      <div class="tile"><span class="tile-label">K: a block carries</span><span class="tile-value">{{ b.K }}</span></div>
      <div class="tile"><span class="tile-label">E: the lottery keeps</span><span class="tile-value">{{ fmt(b.E) }}</span></div>
      <div class="tile"><span class="tile-label">Y: the door shuts at</span><span class="tile-value">{{ fmt(b.Y) }}</span></div>
    </div>
    <p class="trap">{{ theTrap(b) }}</p>
    <div class="controls" role="group" aria-label="which size of JAM">
      <button class="small" :class="{ chosen: b.name === 'tiny' }" :aria-pressed="b.name === 'tiny'" @click="pick(TINY)">tiny</button>
      <button class="small" :class="{ chosen: b.name === 'full' }" :aria-pressed="b.name === 'full'" @click="pick(FULL)">full</button>
      <span class="sep" aria-hidden="true"></span>
      <button class="small" :disabled="atDoor" @click="step(1)">+1 block</button>
      <button class="small" v-if="b.name === 'full'" :disabled="atDoor" @click="step(50)">+50</button>
      <button class="small" :disabled="atDoor" @click="step(b.Y)">to Y</button>
      <button class="small" :disabled="blocks === 0" @click="blocks = 0">reset</button>
    </div>
    <div class="flow">
      <div class="stage">
        <span class="stage-label">supply: {{ b.V === 6 ? "6" : fmt(b.V) }} validators × {{ b.n }}</span>
        <span class="stage-value">{{ fmt(supply(b)) }} tickets</span>
      </div>
      <div class="stage pipe">
        <span class="stage-label">{{ fmt(blocks) }} of {{ fmt(b.Y) }} open blocks, ≤ {{ b.K }} each</span>
        <span class="stage-value">{{ fmt(state.entered) }} in{{ atDoor ? " — the door shuts" : "" }}</span>
      </div>
      <div class="stage">
        <span class="stage-label">the pool keeps the lowest {{ fmt(b.E) }}</span>
        <span class="stage-value">{{ fmt(state.pool) }} kept{{ state.dropped > 0 ? `, ${fmt(state.dropped)} knocked out` : "" }}</span>
      </div>
    </div>
    <div class="bar" role="img" :aria-label="`${fmt(state.pool)} of ${fmt(b.E)} kept`">
      <div class="fill" :style="{ width: `${(100 * state.pool) / b.E}%` }"></div>
    </div>
    <p class="note">{{ pipeSays(b) }} The room is {{ fmt(room(b)) }}: {{ fmt(b.Y) }} blocks × {{ b.K }}.</p>
  </div>
</template>

<style scoped>
.readout { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
@media (max-width: 480px) { .readout { grid-template-columns: repeat(2, 1fr); } }
.tile .tile-value { font-size: 18px; }
.trap { margin: 8px 0; font-size: 13px; color: var(--vp-c-text-2); line-height: 1.5; }
.controls { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin: 4px 0 8px; }
.controls button.small { min-height: 32px; }
.sep { width: 8px; }
.flow { display: flex; flex-direction: column; gap: 6px; }
.stage { display: flex; justify-content: space-between; gap: 8px; padding: 6px 8px; border: 1px solid var(--vp-c-divider); border-radius: 4px; font-size: 13px; }
.stage.pipe { border-style: dashed; }
.stage-label { color: var(--vp-c-text-2); }
.stage-value { font-variant-numeric: tabular-nums; white-space: nowrap; }
.bar { height: 8px; margin: 8px 0 0; border: 1px solid var(--vp-c-divider); border-radius: 4px; overflow: hidden; }
.fill { height: 100%; background: var(--vp-c-green-1); transition: width 0.2s; }
.note { margin: 8px 0 0; font-size: 13px; color: var(--vp-c-text-2); line-height: 1.5; min-height: 3em; }
</style>
