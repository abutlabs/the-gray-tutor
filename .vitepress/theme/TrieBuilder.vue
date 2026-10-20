<!-- Lesson 6.1: the state trie's shape. Each entry's key here is one byte the reader sets,
     then 30 zero bytes; flip its bits, add and remove entries, and the trie sorts them, most
     significant bit first: one entry is a leaf, more split into a branch on the next bit.
     Change a value and the hashes from its leaf up to the root light up. -->
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { bitsOf, toHex } from "./bytes.ts";
import { build, fitsInLeaf, hashesRedone, hashesTaken, keyOf, layout, leafFirstByte, leavesOf, nodesOf, rootIs, SLOT } from "./trie.ts";
import type { Node } from "./trie.ts";

const MAX_ENTRIES = 6;
const MAX_SIZE = 1_000_000;
const LESSON = [0x01, 0x40, 0xff]; // the lesson's picture
const MORE = [0x0b, 0x10, 0x80, 0xc0, 0x00, 0x02, 0x41, 0xfe]; // what "add an entry" reaches for
const GOALS = [
  { id: "deep", say: "send a leaf down to depth 8: two keys that differ only in their last bit" },
  { id: "hashed", say: "type 33 or more in an entry's value box: too big for its leaf, so the leaf holds its hash" },
  { id: "single", say: "leave one entry: the root is then the hash of its leaf" },
];

type Row = { id: number; first: number; size: number };
let nextId = 0;
const rowOf = (first: number): Row => ({ id: nextId++, first, size: 4 });
const rows = ref<Row[]>(LESSON.map(rowOf));
const refused = ref("");
const touched = ref<number | null>(null); // the key byte whose value the reader last changed
const reached = ref(new Set<string>());

const trie = computed(() => build(rows.value.map((r) => ({ key: keyOf(r.first), size: r.size }))));
const nodes = computed(() => nodesOf(trie.value));
const leaves = computed(() => leavesOf(trie.value));
const pathOf = (first: number) => leaves.value.find((l) => l.entry.key[0] === first)?.path ?? "";
const deepest = computed(() => (leaves.value.length ? Math.max(...leaves.value.map((l) => l.path.length)) : 0));
const touchedPath = computed(() => (touched.value === null ? null : pathOf(touched.value)));
const hex = (first: number) => toHex([first]);

// the drawing: one unit is one pixel, so it stays readable; a wide trie scrolls in its strip
const ROW = 48, PAD = 8, TOP = 18;
const drawing = computed(() => layout(trie.value));
const px = (x: number) => x + PAD;
const py = (depth: number) => TOP + depth * ROW;
const onPath = (n: Node) => touchedPath.value !== null && touchedPath.value.startsWith(n.path);

function flipBit(row: Row, bit: number) {
  const first = row.first ^ (1 << (7 - bit));
  if (rows.value.some((r) => r.first === first)) {
    refused.value = `Another entry already has the key ${hex(first)}…: a state holds one value per key.`;
    return;
  }
  refused.value = "";
  if (touched.value === row.first) touched.value = null;
  row.first = first;
}
function setSize(row: Row, text: string) {
  const size = /^\d+$/.test(text.trim()) ? Number(text) : NaN;
  if (!(size <= MAX_SIZE) || size === row.size) return;
  row.size = size;
  touched.value = row.first;
}
function add() {
  const first = MORE.find((f) => !rows.value.some((r) => r.first === f));
  if (first === undefined || rows.value.length >= MAX_ENTRIES) return;
  refused.value = "";
  rows.value.push(rowOf(first));
}
function remove(row: Row) {
  refused.value = "";
  if (touched.value === row.first) touched.value = null;
  rows.value = rows.value.filter((r) => r !== row);
}
function reset() {
  refused.value = "";
  touched.value = null;
  rows.value = LESSON.map(rowOf);
}

// a goal counts when the reader's own change brings it about
const shape = computed(() => JSON.stringify(rows.value.map((r) => [r.first, r.size])));
watch(shape, () => {
  const mark = (id: string) => { reached.value = new Set([...reached.value, id]); };
  if (deepest.value === 8) mark("deep");
  if (rows.value.some((r) => !fitsInLeaf(r.size))) mark("hashed");
  if (rows.value.length === 1) mark("single");
});
</script>

<template>
  <div class="widget trie-builder">
    <div class="readout" aria-live="polite">
      <div class="tile"><span class="tile-label">entries</span><span class="tile-value">{{ rows.length }}</span></div>
      <div class="tile"><span class="tile-label">branches</span><span class="tile-value">{{ nodes.filter((n) => n.kind === "branch").length }}</span></div>
      <div class="tile"><span class="tile-label">deepest leaf</span><span class="tile-value">{{ leaves.length ? deepest : "–" }}</span></div>
      <div class="tile"><span class="tile-label">hashes for the root</span><span class="tile-value">{{ hashesTaken(trie) }}</span></div>
      <div class="tile root"><span class="tile-label">the root is</span><span class="tile-value">{{ rootIs(trie) === "zeros" ? "32 zeros" : rootIs(trie) }}</span></div>
    </div>
    <p class="range">
      Each entry is a key and a value. The key says where its leaf goes: 31 bytes, here one byte you set bit by bit
      and then 30 zeros (the …), read first bit first, 0 left and 1 right. The value is what's filed under that key,
      and the trie only cares how long it is: up to 32 bytes sit inside the leaf; more, and the leaf holds the value's
      32-byte hash instead. In the tiny genesis state, key <code>0x0b…</code> holds the time, 4 bytes, inside its leaf;
      key <code>0x08…</code> holds the validators, 2,017 bytes, so its leaf holds their hash. Every node is 64 bytes;
      the root is a 32-byte hash of the top one.
    </p>
    <div class="controls">
      <button class="small" @click="reset">the lesson's three keys</button>
      <button class="small" :disabled="rows.length >= MAX_ENTRIES" @click="add">add an entry</button>
    </div>
    <div class="strip" tabindex="0" aria-label="the trie, drawn">
      <svg :width="drawing.width + 2 * PAD" :height="py(drawing.depth) + 48" role="img"
        :aria-label="`the trie: ${leaves.map((l) => `${hex(l.entry.key[0])} at depth ${l.path.length}`).join(', ') || 'no entries'}`">
        <g v-for="e in drawing.edges" :key="`e${e.to.node.path}`">
          <line class="edge" :class="{ redone: onPath(e.to.node) }" :x1="px(e.from.x)" :y1="py(e.from.depth)" :x2="px(e.to.x)" :y2="py(e.to.depth)" />
          <text class="bit" :x="px((e.from.x + e.to.x) / 2) + (e.bit === '0' ? -7 : 7)" :y="py(e.from.depth) + ROW / 2 + 4">{{ e.bit }}</text>
        </g>
        <g v-for="p in drawing.placed" :key="`n${p.node.path}`" :class="{ redone: onPath(p.node) }">
          <template v-if="p.node.kind === 'branch'">
            <circle class="branch" :cx="px(p.x)" :cy="py(p.depth)" r="14" />
            <text class="label" :x="px(p.x)" :y="py(p.depth) + 4">{{ p.depth }}</text>
          </template>
          <template v-else-if="p.node.kind === 'leaf'">
            <rect class="leaf" :x="px(p.x) - SLOT.leaf / 2 + 3" :y="py(p.depth) - 14" :width="SLOT.leaf - 6" height="46" rx="5" />
            <text class="label hexkey" :x="px(p.x)" :y="py(p.depth) + 1">{{ hex(p.node.entry.key[0]) }}…</text>
            <text class="key" :x="px(p.x)" :y="py(p.depth) + 14">0b<tspan class="path">{{ p.node.path }}</tspan>{{ bitsOf(p.node.entry.key[0], 8).slice(p.node.path.length, 8) }}</text>
            <text class="label small" :x="px(p.x)" :y="py(p.depth) + 27">{{ fitsInLeaf(p.node.entry.size) ? `${p.node.entry.size} B inside` : `H(${p.node.entry.size.toLocaleString("en-US")} B)` }}</text>
          </template>
          <template v-else>
            <rect class="empty" :x="px(p.x) - 9" :y="py(p.depth) - 9" width="18" height="18" rx="3" />
            <text class="label small" :x="px(p.x)" :y="py(p.depth) + 4">∅</text>
          </template>
        </g>
      </svg>
    </div>
    <p class="legend">
      <span class="dot branch-dot">n</span> a branch, splitting on bit n · <span class="dot leaf-dot">0x40…</span> a leaf, the
      bits that placed it in blue, the edges they follow · <span class="dot empty-dot">∅</span> an empty side, 32 zero bytes
    </p>
    <p class="change" aria-live="polite">
      <template v-if="refused">{{ refused }}</template>
      <template v-else-if="touched !== null && touchedPath !== null">
        You changed <code class="bytes">{{ hex(touched) }}…</code>'s value. Its leaf's hash changes, so the branch above it changes, and its hash,
        and so on up: {{ hashesRedone(touchedPath) }} new hash{{ hashesRedone(touchedPath) === 1 ? "" : "es" }}, the last
        one the root. Every other entry's hash stays as it was.
      </template>
      <template v-else-if="rows.length === 0">No entries: the root is 32 zero bytes.</template>
      <template v-else>Change a value below and watch which hashes it changes.</template>
    </p>
    <ul class="entries">
      <li v-for="r in rows" :key="r.id">
        <div class="key-bits" role="group" :aria-label="`the key ${hex(r.first)}…, bit 0 to 7`">
          <button v-for="b in 8" :key="b" class="bitbtn unit-bit" :class="{ on: bitsOf(r.first, 8)[b - 1] === '1', used: b <= pathOf(r.first).length }"
            :aria-pressed="bitsOf(r.first, 8)[b - 1] === '1'" :aria-label="`bit ${b - 1}`" @click="flipBit(r, b - 1)">
            {{ bitsOf(r.first, 8)[b - 1] }}
          </button>
          <span class="hex bytes">{{ hex(r.first) }}…</span>
        </div>
        <div class="value">
          <label>value, <input :value="r.size" inputmode="numeric" spellcheck="false" :aria-label="`${hex(r.first)}'s value, in bytes`"
            @input="setSize(r, ($event.target as HTMLInputElement).value)" /> bytes long</label>
          <span class="leafbyte">leaf starts <code class="bits">0b{{ bitsOf(leafFirstByte(r.size), 8).slice(0, 2) }}_{{ bitsOf(leafFirstByte(r.size), 8).slice(2) }}</code>:
            {{ fitsInLeaf(r.size) ? `the ${r.size} bytes inside` : "the value's hash" }}</span>
          <button class="small" :aria-label="`remove ${hex(r.first)}…`" @click="remove(r)">remove</button>
        </div>
      </li>
    </ul>
    <ul class="goals">
      <li v-for="g in GOALS" :key="g.id" :class="{ done: reached.has(g.id) }">{{ reached.has(g.id) ? "✓" : "○" }} <UnitText :text="g.say" /></li>
    </ul>
  </div>
</template>

<style scoped>
.range { font-size: 14px; color: var(--vp-c-text-2); margin: 0 0 12px; line-height: 1.5; }
.tile.root .tile-value { min-width: 9ch; }
.controls { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
.controls button { min-height: 32px; }
.controls button:disabled { opacity: 0.5; cursor: default; }
.strip { max-width: 100%; overflow-x: auto; border: 1px dashed var(--vp-c-divider); border-radius: 6px; }
.strip svg { display: block; margin: 0 auto; font-family: var(--vp-font-family-mono); }
.edge { stroke: var(--vp-c-text-3); stroke-width: 1.5; }
.bit { fill: var(--bit-top-line); font-size: 11px; font-weight: 700; text-anchor: middle; }
.branch { fill: var(--bit-top); stroke: var(--bit-top-line); stroke-width: 1.5; }
.leaf { fill: var(--bit-low); stroke: var(--bit-low-line); stroke-width: 1.5; }
.empty { fill: var(--vp-c-bg-soft); stroke: var(--vp-c-text-3); stroke-dasharray: 3 2; }
.label { fill: var(--vp-c-text-1); font-size: 12px; font-weight: 600; text-anchor: middle; }
.label.small { font-size: 11px; font-weight: 400; }
.key { fill: var(--unit-bits); font-size: 10px; text-anchor: middle; }
.label.hexkey { fill: var(--unit-bytes); }
.path { fill: var(--bit-top-line); font-weight: 700; }
.redone .branch, .redone .leaf, .edge.redone { stroke: var(--bit-mark-line); stroke-width: 3; }
.legend { font-size: 13px; color: var(--vp-c-text-2); margin: 6px 0; line-height: 1.8; }
.dot { font-family: var(--vp-font-family-mono); padding: 0 5px; border: 1.5px solid; border-radius: 4px; }
.branch-dot { background: var(--bit-top); border-color: var(--bit-top-line); border-radius: 50%; }
.leaf-dot { background: var(--bit-low); border-color: var(--bit-low-line); }
.empty-dot { border-style: dashed; border-color: var(--vp-c-text-3); }
.change { font-size: 14px; margin: 6px 0 10px; line-height: 1.5; min-height: 3em; }
.entries { list-style: none; padding: 0; margin: 0; }
.entries li { padding: 8px 0; border-top: 1px solid var(--vp-c-divider); }
.key-bits { display: flex; align-items: center; flex-wrap: wrap; }
.bitbtn {
  width: 32px; height: 36px; border: 1px solid var(--vp-c-divider); margin-right: -1px;
  font-family: var(--vp-font-family-mono); font-size: 16px; font-weight: 600; color: var(--vp-c-text-3);
  background: var(--vp-c-bg-soft); cursor: pointer;
}
.bitbtn.on { color: var(--vp-c-text-1); }
.bitbtn.used { background: var(--bit-top); border-color: var(--bit-top-line); }
.bitbtn:hover { border-color: var(--vp-c-brand-1); }
.hex { margin-left: 10px; font-family: var(--vp-font-family-mono); font-weight: 600; }
.value { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 12px; margin-top: 6px; font-size: 14px; }
.value input {
  width: 9ch; min-height: 32px; padding: 2px 8px; border: 1px solid var(--vp-c-divider); border-radius: 6px;
  font-family: var(--vp-font-family-mono); font-size: 15px;
}
.leafbyte { font-family: var(--vp-font-family-mono); font-size: 13px; color: var(--vp-c-text-2); }
.value button { min-height: 32px; }
.goals { list-style: none; padding: 0; margin: 12px 0 0; font-size: 14px; color: var(--vp-c-text-2); }
.goals li.done { color: var(--vp-c-green-1); }
@media (max-width: 640px) {
  .bitbtn { width: 32px; }
  .hex { margin-left: 6px; }
}
</style>
