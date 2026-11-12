<!-- Lesson 6.3, at its top: the Gray Paper's (D.2) as a table to open. One real state, the
     one before block 12 of the tiny safrole trace. Tap a row: its 31-byte key, what (D.2)
     stores under it in plain words, and its real bytes; τ, η and κ, the three the lesson
     reads, open part by part. Data in state-rows.ts. -->
<script setup lang="ts">
import { computed, ref } from "vue";
import { withBase } from "vitepress";
import { allZero, ENTRIES, READ_HERE, rowOf, ROWS, SAME_BYTES } from "./state-rows.ts";

const picked = ref(11);
const row = computed(() => rowOf(picked.value));
const fmt = (n: number) => n.toLocaleString("en-US");

const GOALS = [
  { id: "read", say: "open τ, η and κ, the three rows this lesson reads" },
  { id: "zero", say: "find a row whose bytes are all zero, and say what is empty" },
  { id: "same", say: "find the three rows that hold the same 2,017 bytes" },
];
const seen = ref(new Set<number>([11]));
const reached = computed(() => new Set(GOALS.filter((g) =>
  g.id === "read" ? READ_HERE.every((i) => seen.value.has(i))
    : g.id === "zero" ? ROWS.some((r) => allZero(r) && seen.value.has(r.i))
      : SAME_BYTES.every((i) => seen.value.has(i))).map((g) => g.id)));
function pick(i: number) {
  picked.value = i;
  seen.value = new Set([...seen.value, i]);
}
</script>

<template>
  <div class="widget state-rows">
    <div class="readout" aria-live="polite">
      <div class="tile"><span class="tile-label">key</span><span class="tile-value small">{{ row.key }}</span></div>
      <div class="tile wide"><span class="tile-label">holds</span><span class="tile-value small">{{ row.letter }}, {{ row.name }}</span></div>
      <div class="tile"><span class="tile-label">its value</span><span class="tile-value small">{{ fmt(row.size) }} {{ row.size === 1 ? "byte" : "bytes" }}</span></div>
    </div>
    <p class="line">A real state, the one before block 12 of the tiny <code>safrole</code> trace: {{ ENTRIES }} entries, a key and a value each. Sixteen components and service 0's account are (D.2)'s rows. Tap one to open it.</p>
    <div class="chips" role="group" aria-label="the rows of (D.2)">
      <button
        v-for="r in ROWS" :key="r.i" class="small" :class="{ chosen: picked === r.i, read: READ_HERE.includes(r.i) }"
        :aria-pressed="picked === r.i" @click="pick(r.i)"
      >{{ r.key }} {{ r.letter }}</button>
    </div>
    <dl class="open">
      <dt>its key</dt>
      <dd><code class="bytes">{{ row.keyBytes }}</code> <span class="note">{{ row.keySays }}</span></dd>
      <dt>(D.2) stores</dt>
      <dd>{{ row.says }}</dd>
      <dt>its bytes here</dt>
      <dd><code class="bytes">{{ row.starts }}{{ row.size > 4 ? " …" : "" }}</code> <span class="note">{{ row.adds }}</span></dd>
    </dl>
    <table v-if="row.pieces" class="pieces">
      <caption>{{ row.letter }}'s {{ fmt(row.size) }} bytes, part by part</caption>
      <tbody>
        <tr v-for="(p, n) in row.pieces" :key="n"><td><code class="bytes">{{ p.bytes }}</code></td><td>{{ p.what }}</td></tr>
      </tbody>
    </table>
    <p class="next">
      <template v-if="row.built === 'here'">This lesson reads it, with a codec you already have.</template>
      <template v-else>Reading it takes a codec of its own, which <a :href="withBase(`/${row.built.dir}/`)">Part {{ row.built.part }}</a> builds.</template>
    </p>
    <ul class="goals"><li v-for="g in GOALS" :key="g.id" :class="{ done: reached.has(g.id) }">{{ reached.has(g.id) ? "✓" : "○" }} {{ g.say }}</li></ul>
  </div>
</template>

<style scoped>
.tile .tile-value.small { min-width: 0; font-size: 16px; line-height: 1.5; }
.tile.wide { flex: 1 1 14rem; }
.line { margin: 8px 0; font-size: 14px; line-height: 1.6; }
.chips { display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 12px; }
.chips button.small { min-height: 32px; }
/* the three rows this lesson reads: a dot, so the eye finds them */
.chips button.read::before { content: "● "; color: var(--vp-c-brand-1); font-size: 10px; vertical-align: 2px; }
.open { display: grid; grid-template-columns: max-content 1fr; gap: 6px 14px; margin: 0 0 10px; font-size: 14px; line-height: 1.6; }
.open dt { color: var(--vp-c-text-2); font-size: 13px; }
.open dd { margin: 0; min-width: 0; overflow-wrap: anywhere; }
.note { color: var(--vp-c-text-2); }
.pieces { display: table; width: 100%; margin: 0 0 10px; font-size: 13px; border-collapse: collapse; }
.pieces caption { caption-side: top; padding: 0 0 4px; text-align: left; color: var(--vp-c-text-2); }
.pieces td { padding: 4px 8px; border: 1px solid var(--vp-c-divider); vertical-align: top; overflow-wrap: anywhere; }
.pieces td:first-child { white-space: nowrap; }
.pieces tr { background: none; }
.next { margin: 0 0 8px; font-size: 14px; }
.goals { list-style: none; margin: 0; padding: 0; font-size: 13px; color: var(--vp-c-text-2); }
.goals li { margin: 2px 0; }
.goals li.done { color: var(--vp-c-green-1); }
@media (max-width: 480px) {
  .open { grid-template-columns: 1fr; gap: 0 0; }
  .open dd { margin-bottom: 6px; }
  .pieces td:first-child { white-space: normal; }
}
</style>
