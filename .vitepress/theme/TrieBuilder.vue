<!-- Lesson 6.1: the state trie. Each entry is a key (one byte the reader sets, then 30 zero
     bytes) and a value the reader types (text, or hex from 0x); the trie sorts the keys, most
     significant bit first: one entry is a leaf, more split into a branch on the next bit.
     Every node shows its real hash, as 6.1's merkle makes it; change a value and the hashes
     from its leaf up to the root light up. -->
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { bitsOf, toHex } from "./bytes.ts";
import { build, fitsInLeaf, hashesOf, hashesRedone, hashesTaken, keyOf, layout, leafFirstByte, leavesOf, nodesOf, rootIs, SLOT, valueBytes } from "./trie.ts";
import type { Node } from "./trie.ts";

const MAX_ENTRIES = 6;
const LESSON = [0x01, 0x40, 0xff]; // the lesson's picture
const VALUES = ["hello", "JAM", "Gray Paper"]; // their values, each well inside a leaf
const MORE = [0x0b, 0x10, 0x80, 0xc0, 0x00, 0x02, 0x41, 0xfe]; // what "add an entry" reaches for
const GOALS = [
  { id: "deep", say: "send a leaf down to depth 8: two keys that differ only in their last bit" },
  { id: "hashed", say: "type a value over 32 bytes (33 letters will do): too big for its leaf, so the leaf holds its hash" },
  { id: "single", say: "leave one entry: the root is then the hash of its leaf" },
];

type Row = { id: number; first: number; text: string };
let nextId = 0;
const rowOf = (first: number, text = "data"): Row => ({ id: nextId++, first, text });
const lessonRows = () => LESSON.map((first, i) => rowOf(first, VALUES[i]));
const rows = ref<Row[]>(lessonRows());
const valueOf = (r: Row) => valueBytes(r.text);
const sizeOf = (r: Row) => valueOf(r).bytes.length;
const refused = ref("");
const touched = ref<number | null>(null); // the key byte whose value the reader last changed
const rootBefore = ref<string | null>(null); // the root before that change
const reached = ref(new Set<string>());

const trie = computed(() => build(rows.value.map((r) => { const value = valueOf(r).bytes; return { key: keyOf(r.first), size: value.length, value }; })));
const hashes = computed(() => hashesOf(trie.value));
/** A hash as the drawing writes it: its first four bytes. */
const short = (path: string) => toHex((hashes.value.get(path) ?? []).slice(0, 4)).slice(2);
/** A value as a leaf shows it: its text, or its hex, cut to fit. */
const shown = (value: number[] | undefined, r?: Row) => {
  const v = r ?? rows.value.find((x) => valueOf(x).bytes === value);
  const t = v ? (valueOf(v).as === "text" ? `"${v.text}"` : v.text) : "";
  return t.length > 13 ? `${t.slice(0, 12)}…` : t;
};
const rowAt = (first: number) => rows.value.find((r) => r.first === first);
const nodes = computed(() => nodesOf(trie.value));
const leaves = computed(() => leavesOf(trie.value));
const pathOf = (first: number) => leaves.value.find((l) => l.entry.key[0] === first)?.path ?? "";
const deepest = computed(() => (leaves.value.length ? Math.max(...leaves.value.map((l) => l.path.length)) : 0));
const touchedPath = computed(() => (touched.value === null ? null : pathOf(touched.value)));
const hex = (first: number) => toHex([first]);

// the drawing: one unit is one pixel, so it stays readable; a wide trie scrolls in its strip
const ROW = 92, PAD = 8, TOP = 36;
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
function setText(row: Row, text: string) {
  if (text === row.text) return;
  rootBefore.value = short("");
  row.text = text;
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
  rows.value = lessonRows();
}

// a goal counts when the reader's own change brings it about
const shape = computed(() => JSON.stringify(rows.value.map((r) => [r.first, r.text])));
watch(shape, () => {
  const mark = (id: string) => { reached.value = new Set([...reached.value, id]); };
  if (deepest.value === 8) mark("deep");
  if (rows.value.some((r) => !fitsInLeaf(sizeOf(r)))) mark("hashed");
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
      <div class="tile root"><span class="tile-label">the state root, {{ rootIs(trie) === "zeros" ? "no entries" : rootIs(trie) }}</span><span class="tile-value hash">0x{{ short("") }}…</span></div>
    </div>
    <p class="range">
      Each entry is a key and a value. The key says where its leaf goes: 31 bytes, here one byte you set bit by bit
      and then 30 zeros (the …), read first bit first, 0 left and 1 right. The value is what's filed under that key:
      type any text (each letter a byte) or hex from <code>0x</code>. Up to 32 bytes sit inside the leaf; more, and the
      leaf holds the value's 32-byte hash instead. In the tiny genesis state, key <code>0x0b…</code> holds the time,
      4 bytes, inside its leaf; key <code>0x08…</code> holds the validators, 2,017 bytes, so its leaf holds their
      hash. Every node is 64 bytes, and each shows its own hash (the first 4 of its 32 bytes), as your client's
      <code>merkle</code> makes it; the top one's is the state root.
    </p>
    <div class="controls">
      <button class="small" @click="reset">the lesson's three keys</button>
      <button class="small" :disabled="rows.length >= MAX_ENTRIES" @click="add">add an entry</button>
    </div>
    <div class="strip" tabindex="0" aria-label="the trie, drawn">
      <svg :viewBox="`0 0 ${drawing.width + 2 * PAD} ${py(drawing.depth) + (leaves.some((l) => !fitsInLeaf(l.entry.size)) ? 112 : 70)}`"
        :style="{ minWidth: `${drawing.width + 2 * PAD}px`, maxWidth: `${1.5 * (drawing.width + 2 * PAD)}px` }" :width="drawing.width + 2 * PAD" :height="py(drawing.depth) + (leaves.some((l) => !fitsInLeaf(l.entry.size)) ? 112 : 70)" role="img"
        :aria-label="`the trie: ${leaves.map((l) => `${hex(l.entry.key[0])} at depth ${l.path.length}`).join(', ') || 'no entries'}`">
        <g v-for="e in drawing.edges" :key="`e${e.to.node.path}`">
          <line class="edge" :class="{ redone: onPath(e.to.node) }" :x1="px(e.from.x)" :y1="py(e.from.depth)" :x2="px(e.to.x)" :y2="py(e.to.depth)" />
          <text class="bit" :x="px((e.from.x + e.to.x) / 2) + (e.bit === '0' ? -7 : 7)" :y="py(e.from.depth) + ROW / 2 + 4">{{ e.bit }}</text>
        </g>
        <g v-for="p in drawing.placed" :key="`n${p.node.path}`" :class="{ redone: onPath(p.node) }">
          <template v-if="p.node.kind === 'branch'">
            <circle class="branch" :cx="px(p.x)" :cy="py(p.depth)" r="15" />
            <text class="label" :x="px(p.x)" :y="py(p.depth) + 4">{{ p.depth }}</text>
            <text class="hashtext" :x="px(p.x)" :y="py(p.depth) - 20">{{ short(p.node.path) }}…</text>
          </template>
          <template v-else-if="p.node.kind === 'leaf'">
            <rect class="leaf" :x="px(p.x) - SLOT.leaf / 2 + 3" :y="py(p.depth) - 16" :width="SLOT.leaf - 6" height="78" rx="6" />
            <text class="label hexkey" :x="px(p.x)" :y="py(p.depth)"><tspan class="part">key</tspan> {{ hex(p.node.entry.key[0]) }}…</text>
            <text class="key" :x="px(p.x)" :y="py(p.depth) + 13">0b<tspan class="path">{{ p.node.path }}</tspan>{{ bitsOf(p.node.entry.key[0], 8).slice(p.node.path.length, 8) }}</text>
            <text class="label valuetext" :x="px(p.x)" :y="py(p.depth) + 29"><tspan class="part">value</tspan> {{ shown(p.node.entry.value, rowAt(p.node.entry.key[0])) }}</text>
            <text class="label small" :x="px(p.x)" :y="py(p.depth) + 43">{{ fitsInLeaf(p.node.entry.size) ? `${p.node.entry.size} B, inside` : `${p.node.entry.size.toLocaleString("en-US")} B, so its hash` }}</text>
            <text class="hashtext" :x="px(p.x)" :y="py(p.depth) + 56">hash {{ short(p.node.path) }}…</text>
            <!-- a value over 32 bytes: kept outside the trie; the leaf holds its hash -->
            <template v-if="!fitsInLeaf(p.node.entry.size)">
              <line class="outside-line" :x1="px(p.x)" :y1="py(p.depth) + 62" :x2="px(p.x)" :y2="py(p.depth) + 74" />
              <text class="outside-h" :x="px(p.x) + 6" :y="py(p.depth) + 71">↑ H</text>
              <rect class="outside" :x="px(p.x) - SLOT.leaf / 2 + 10" :y="py(p.depth) + 74" :width="SLOT.leaf - 20" height="30" rx="5" />
              <text class="label small" :x="px(p.x)" :y="py(p.depth) + 86">the value, {{ p.node.entry.size.toLocaleString("en-US") }} B</text>
              <text class="hashtext" :x="px(p.x)" :y="py(p.depth) + 99">kept outside the trie</text>
            </template>
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
        You changed <code class="bytes">{{ hex(touched) }}…</code>'s value{{ rowAt(touched) && !fitsInLeaf(sizeOf(rowAt(touched)!)) ? ", now too big for its leaf: the leaf stays where it is and holds the value's hash instead" : "" }}.
        Its leaf's hash changes, so the branch above it changes, and so on up: {{ hashesRedone(touchedPath) }} new
        hash{{ hashesRedone(touchedPath) === 1 ? "" : "es" }}, the last one the root, <code>0x{{ rootBefore }}…</code> → <code>0x{{ short("") }}…</code>.
        Every other entry's hash stays as it was.
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
          <label>value <input :value="r.text" spellcheck="false" autocomplete="off" :aria-label="`${hex(r.first)}'s value: text, or hex from 0x`"
            @input="setText(r, ($event.target as HTMLInputElement).value)" /></label>
          <span class="size">{{ sizeOf(r) }} byte{{ sizeOf(r) === 1 ? "" : "s" }}, as {{ valueOf(r).as }}</span>
          <span class="leafbyte">leaf starts <code class="bits">0b{{ bitsOf(leafFirstByte(sizeOf(r)), 8).slice(0, 2) }}_{{ bitsOf(leafFirstByte(sizeOf(r)), 8).slice(2) }}</code>:
            {{ fitsInLeaf(sizeOf(r)) ? `the ${sizeOf(r)} bytes inside` : "the value's hash" }}</span>
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
/* as wide as the widget, up to half as big again; a wider trie keeps its size and scrolls */
.strip svg { display: block; margin: 0 auto; width: 100%; height: auto; font-family: var(--vp-font-family-mono); }
.edge { stroke: var(--vp-c-text-3); stroke-width: 1.5; }
.bit { fill: var(--bit-top-line); font-size: 11px; font-weight: 700; text-anchor: middle; }
.branch { fill: var(--bit-top); stroke: var(--bit-top-line); stroke-width: 1.5; }
.leaf { fill: var(--bit-low); stroke: var(--bit-low-line); stroke-width: 1.5; }
.empty { fill: var(--vp-c-bg-soft); stroke: var(--vp-c-text-3); stroke-dasharray: 3 2; }
.label { fill: var(--vp-c-text-1); font-size: 12px; font-weight: 600; text-anchor: middle; }
.label.small { font-size: 11px; font-weight: 400; }
.key { fill: var(--unit-bits); font-size: 10px; text-anchor: middle; }
.label.hexkey { fill: var(--unit-bytes); }
.label .part { fill: var(--vp-c-text-3); font-weight: 400; font-size: 10px; }
.label.valuetext { font-size: 12px; font-weight: 600; }
.hashtext { fill: var(--vp-c-text-2); font-size: 10px; text-anchor: middle; }
.outside { fill: var(--vp-c-bg); stroke: var(--vp-c-text-3); stroke-dasharray: 4 3; }
.outside-line { stroke: var(--vp-c-text-3); stroke-width: 1.5; stroke-dasharray: 3 2; }
.outside-h { fill: var(--vp-c-text-2); font-size: 10px; font-weight: 700; }
.path { fill: var(--bit-top-line); font-weight: 700; }
.redone .branch, .redone .leaf, .edge.redone { stroke: var(--bit-mark-line); stroke-width: 3; }
.legend { font-size: 13px; color: var(--vp-c-text-2); margin: 6px 0; line-height: 1.8; }
.dot { font-family: var(--vp-font-family-mono); padding: 0 5px; border: 1.5px solid; border-radius: 4px; }
.branch-dot { background: var(--bit-top); border-color: var(--bit-top-line); border-radius: 50%; }
.leaf-dot { background: var(--bit-low); border-color: var(--bit-low-line); }
.empty-dot { border-style: dashed; border-color: var(--vp-c-text-3); }
.change { font-size: 14px; margin: 6px 0 10px; line-height: 1.5; min-height: 6em; } /* its longest: a value grown too big */
@media (max-width: 640px) { .change { min-height: 12em; } }
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
.size { font-family: var(--vp-font-family-mono); font-size: 13px; font-weight: 600; }
.value input {
  width: 22ch; max-width: 100%; min-height: 32px; padding: 2px 8px; border: 1px solid var(--vp-c-divider); border-radius: 6px;
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
