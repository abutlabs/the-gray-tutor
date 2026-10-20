<!-- Part 8's big picture: Safrole's cycle on the official safrole trace's 100 real tiny
     blocks, an epoch a row. Each cell is a slot: the tickets its block enters, the lottery
     closed from phase 10, the header's marks, and the epoch's sealing, by last epoch's
     winners or the fallback. Tap a slot for its story. Computed in safrole-timeline.ts. -->
<script setup lang="ts">
import { computed, ref } from "vue";
import { E, EPOCHS, epochSays, SLOTS, slotSays, WIN, Y, type Slot } from "./safrole-timeline.ts";

const picked = ref(46);
const s = computed<Slot>(() => SLOTS.find((x) => x.slot === picked.value)!);
const step = (d: number) => { picked.value = Math.min(Math.max(picked.value + d, SLOTS[0].slot), SLOTS.at(-1)!.slot); };
const cellsOf = (slots: Slot[]) => Array.from({ length: E }, (_, phase) => slots.find((x) => x.phase === phase) ?? null);
</script>

<template>
  <div class="widget safrole-timeline">
    <div class="readout" aria-live="polite">
      <div class="tile"><span class="tile-label">slot</span><span class="tile-value">{{ s.slot }} · epoch {{ s.epoch }}, phase {{ s.phase }}</span></div>
      <div class="tile" :class="s.byTickets ? 'tickets' : 'fallback'"><span class="tile-label">sealed by</span><span class="tile-value">{{ s.byTickets ? "a winning ticket" : "the fallback" }}</span></div>
      <div class="tile"><span class="tile-label">lottery for the next epoch</span><span class="tile-value">{{ s.phase >= Y ? "closed, " : "" }}{{ s.held }} of {{ WIN }}</span></div>
    </div>
    <p class="line">{{ slotSays(s) }}</p>
    <div class="controls">
      <button class="small" aria-label="the slot before" @click="step(-1)">← slot</button>
      <button class="small" aria-label="the slot after" @click="step(1)">slot →</button>
      <button class="small" @click="picked = 46">the first win</button>
    </div>

    <div class="grid" role="group" aria-label="the trace's slots, an epoch a row">
      <div class="phases" aria-hidden="true"><span class="name"><span class="phone">epoch</span></span><span v-for="p in E" :key="p" class="phase" :class="{ closed: p - 1 >= Y }">{{ p - 1 }}</span><span class="end"></span></div>
      <div v-for="e in EPOCHS" :key="e.epoch" class="row">
        <span class="name"><span class="wide">epoch </span>{{ e.epoch }}</span>
        <template v-for="(c, i) in cellsOf(e.slots)" :key="i">
          <button v-if="c" class="cell" :class="{ closed: c.phase >= Y, tickets: c.byTickets, fallback: !c.byTickets, picked: c.slot === picked }"
            :aria-pressed="c.slot === picked" :aria-label="`slot ${c.slot}`" @click="picked = c.slot">
            <span class="dots"><span v-for="t in c.tickets" :key="t" class="dot" /></span>
            <span v-if="c.ticketsMark" class="mark w">W</span><span v-else-if="c.epochMark" class="mark">E</span>
          </button>
          <span v-else class="cell none" aria-hidden="true">·</span>
        </template>
        <span class="end" :class="{ won: e.slots.some((x) => x.held >= WIN) }">{{ Math.max(...e.slots.map((x) => x.held)) }}/{{ WIN }}</span>
      </div>
    </div>
    <p class="says">Epoch {{ s.epoch }}: {{ epochSays(s.epoch) }}.</p>
    <p class="legend">
      <span class="key tickets"></span> sealed by last epoch's winners · <span class="key fallback"></span> by the fallback ·
      <span class="dot inline" /> a ticket entered · grey from phase {{ Y }}: the lottery closed · E the epoch mark · W the winners announced ·
      right: tickets the lottery reached
    </p>
  </div>
</template>

<style scoped>
.safrole-timeline .readout { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); }
.tile { min-width: 0; }
.tile .tile-value { font-size: 15px; white-space: nowrap; }
.tile.tickets { border-color: var(--vp-c-brand-1); background: var(--vp-c-brand-soft); }
.tile.fallback { border-color: var(--bit-mark-line); background: var(--bit-mark); }
.line { margin: 8px 0; font-size: 14px; line-height: 1.6; min-height: 6.4em; }
.controls { display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 10px; }
.controls button.small { min-height: 32px; }
.grid { display: flex; flex-direction: column; gap: 3px; }
.row, .phases { display: grid; grid-template-columns: 54px repeat(12, minmax(0, 1fr)) 36px; gap: 2px; align-items: center; }
.name { font-size: 11px; color: var(--vp-c-text-2); white-space: nowrap; }
.phase { font-size: 10px; text-align: center; color: var(--vp-c-text-3); }
.phase.closed { color: var(--vp-c-text-2); font-weight: 600; }
.cell { position: relative; min-width: 0; height: 32px; padding: 0; border: 2px solid; border-radius: 4px; cursor: pointer; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 5px; }
.cell.tickets { border-color: var(--vp-c-brand-1); background: var(--vp-c-brand-soft); }
.cell.fallback { border-color: var(--bit-mark-line); background: var(--bit-mark); }
.cell.closed { background: var(--vp-c-default-soft); }
.cell.picked { outline: 3px solid var(--vp-c-text-1); outline-offset: -1px; }
.cell.none { border: none; background: none; cursor: default; color: var(--vp-c-text-3); font-size: 11px; }
.dots { display: flex; gap: 2px; }
.dot { width: 6px; height: 6px; border-radius: 50%; background: var(--vp-c-text-1); display: inline-block; }
.dot.inline { vertical-align: middle; }
.mark { position: absolute; top: 1px; left: 0; right: 0; text-align: center; line-height: 1; font-size: 9px; font-weight: 700; color: var(--vp-c-text-2); }
.mark.w { color: var(--vp-c-brand-1); }
.end { font-size: 11px; text-align: right; font-family: var(--vp-font-family-mono); color: var(--vp-c-text-2); }
.end.won { color: var(--vp-c-brand-1); font-weight: 700; }
.says { margin: 8px 0 0; font-size: 13px; line-height: 1.6; min-height: 1.6em; }
.legend { margin: 6px 0 0; font-size: 12px; color: var(--vp-c-text-2); line-height: 1.8; }
.key { display: inline-block; width: 12px; height: 12px; border: 2px solid; border-radius: 3px; vertical-align: middle; }
.key.tickets { border-color: var(--vp-c-brand-1); background: var(--vp-c-brand-soft); }
.key.fallback { border-color: var(--bit-mark-line); background: var(--bit-mark); }
.phone { display: none; }
@media (max-width: 640px) {
  .line { min-height: 12.8em; }
  .says { min-height: 3.2em; }
  /* phones: the epoch's number alone, and smaller dots, so three fit a cell */
  .row, .phases { grid-template-columns: 30px repeat(12, minmax(0, 1fr)) 34px; }
  .wide { display: none; }
  .phone { display: inline; }
  .dots { gap: 1px; }
  .dot { width: 4px; height: 4px; }
}
</style>
