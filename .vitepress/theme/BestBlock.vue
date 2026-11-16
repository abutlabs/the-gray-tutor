<!-- Lesson 21.2: the best block. The real tree of 21.1; the reader moves the final block
     and sees which blocks stay candidates, why the others don't, and which is best.
     Computed in best-block.ts. -->
<script setup lang="ts">
import { computed, ref } from "vue";
import { best, FINALS, ruledOut, TREE } from "./best-block.ts";
import { rows } from "./block-tree.ts";

const final = ref("g");
const drawn = rows(TREE);
const label = (id: string) => TREE.find((b) => b.id === id)!.label;
const pick = computed(() => best(final.value));
const verdicts = computed(() => new Map(TREE.map((b) => [b.id, ruledOut(final.value, b.id)])));
const candidates = computed(() => [...verdicts.value.values()].filter((v) => v === null).length);
</script>

<template>
  <div class="widget best-block">
    <div class="readout" aria-live="polite">
      <div class="tile"><span class="tile-label">final block</span><span class="tile-value">{{ label(final) }}</span></div>
      <div class="tile"><span class="tile-label">candidates</span><span class="tile-value">{{ candidates }} of {{ TREE.length }}</span></div>
      <div class="tile"><span class="tile-label">best block</span><span class="tile-value">{{ pick.label }}</span></div>
    </div>
    <p class="row-says">make a block final</p>
    <div class="controls">
      <button v-for="id in FINALS" :key="id" class="small" :class="{ on: final === id }" @click="final = id">{{ label(id) }}</button>
    </div>
    <ul class="kept">
      <li v-for="r in drawn" :key="r.block.hash" :style="{ paddingLeft: r.depth * 18 + 'px' }">
        <div class="node" :class="{ best: r.block.id === pick.id, out: verdicts.get(r.block.id) }">
          <span class="mono">{{ r.depth ? "└ " : "" }}{{ r.block.label }} · slot {{ r.block.slot }}</span>
          <span v-if="r.block.id === final" class="tag"> final</span>
          <span v-if="r.block.id === pick.id" class="tag"> best</span>
          <span class="why">{{ verdicts.get(r.block.id) ? ` out, ${verdicts.get(r.block.id)}` : " a candidate" }}</span>
        </div>
      </li>
    </ul>
    <p class="line">All five were sealed by fallback keys, so m = 0 for each (19.4). Among the candidates your client then takes the one with the most ancestors.</p>
  </div>
</template>

<style scoped>
.best-block .readout { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); }
.tile .tile-value { font-size: 16px; white-space: nowrap; }
.row-says { margin: 8px 0 2px; font-size: 12px; color: var(--vp-c-text-2); }
.controls { display: flex; flex-wrap: wrap; gap: 4px; margin: 0 0 8px; }
.controls button.small { min-height: 32px; font-size: 12px; }
.controls button.on { border-color: var(--vp-c-brand-1); background: var(--vp-c-brand-soft); }
.kept { list-style: none; margin: 0; padding: 0; }
.kept li { margin: 2px 0; }
.node { padding: 4px 6px; border: 1px solid var(--vp-c-divider); border-radius: 6px; font-size: 13px; line-height: 1.5; overflow-wrap: anywhere; }
.node.best { border-color: var(--vp-c-brand-1); background: var(--vp-c-brand-soft); }
.node.out .mono { text-decoration: line-through; color: var(--vp-c-text-2); }
.mono { font-family: var(--vp-font-family-mono); font-size: 12px; }
.tag { font-weight: 600; color: var(--vp-c-brand-1); }
.why { color: var(--vp-c-text-2); }
.line { margin: 8px 0; font-size: 14px; line-height: 1.6; }
</style>
