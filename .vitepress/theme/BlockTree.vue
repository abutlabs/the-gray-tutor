<!-- Lesson 21.1: the block tree. Send the node blocks in any order: each hangs from its
     parent, two on one parent fork, an orphan is not kept. Tap a kept block for its
     ancestors. Computed in block-tree.ts. -->
<script setup lang="ts">
import { computed, ref } from "vue";
import { add, ancestors, BLOCKS, rows, start, tips } from "./block-tree.ts";

const tree = ref(start());
const reply = ref("");
const chosen = ref<string | null>(null);
const send = (id: string) => { const r = add(tree.value, id); tree.value = r.tree; reply.value = r.reply; };
const reset = () => { tree.value = start(); reply.value = ""; chosen.value = null; };
const drawn = computed(() => rows(tree.value));
const tipHashes = computed(() => new Set(tips(tree.value).map((t) => t.hash)));
const line = computed(() => (chosen.value ? ancestors(tree.value, chosen.value) : []));
const onLine = computed(() => new Set(line.value.map((b) => b.hash)));
</script>

<template>
  <div class="widget block-tree">
    <div class="readout" aria-live="polite">
      <div class="tile"><span class="tile-label">blocks kept</span><span class="tile-value">{{ tree.length }}</span></div>
      <div class="tile"><span class="tile-label">tips</span><span class="tile-value">{{ tipHashes.size }}</span></div>
    </div>
    <p class="line">{{ reply || "The node starts from genesis. Send it a block." }}</p>
    <div class="controls">
      <button v-for="b in BLOCKS" :key="b.id" class="small" @click="send(b.id)">{{ b.label }}</button>
      <button class="small" @click="reset">start again</button>
    </div>
    <p class="row-says">the tree: each block under its parent. Tap one for its ancestors</p>
    <ul class="kept">
      <li v-for="r in drawn" :key="r.block.hash" :style="{ paddingLeft: r.depth * 18 + 'px' }">
        <button class="node mono" :class="{ on: onLine.has(r.block.hash) }" @click="chosen = r.block.hash">
          {{ r.depth ? "└ " : "" }}{{ r.block.label }} · slot {{ r.block.slot }} · {{ r.block.hash }}… · {{ r.block.carries }}<span v-if="tipHashes.has(r.block.hash)" class="tip"> tip</span>
        </button>
      </li>
    </ul>
    <p class="line ancestors" aria-live="polite">{{ line.length ? `its ancestors, newest first: ${line.map((b) => b.label).join(", ")}` : "" }}</p>
  </div>
</template>

<style scoped>
.block-tree .readout { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); }
.tile .tile-value { font-size: 18px; white-space: nowrap; }
.line { margin: 8px 0; font-size: 14px; line-height: 1.6; min-height: 3.2em; overflow-wrap: anywhere; }
.line.ancestors { min-height: 1.6em; }
.controls { display: flex; flex-wrap: wrap; gap: 4px; margin: 0 0 6px; }
.controls button.small { min-height: 32px; font-size: 12px; }
.row-says { margin: 8px 0 2px; font-size: 12px; color: var(--vp-c-text-2); }
.kept { list-style: none; margin: 0; padding: 0; min-height: 9em; }
.kept li { margin: 2px 0; }
.node { display: block; width: 100%; text-align: left; padding: 4px 6px; border: 1px solid var(--vp-c-divider); border-radius: 6px; background: transparent; color: inherit; overflow-wrap: anywhere; }
.node.on { border-color: var(--vp-c-brand-1); background: var(--vp-c-brand-soft); }
.mono { font-family: var(--vp-font-family-mono); font-size: 12px; }
.tip { font-weight: 600; color: var(--vp-c-brand-1); }
</style>
