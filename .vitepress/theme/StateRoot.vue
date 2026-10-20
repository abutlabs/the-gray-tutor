<!-- Lesson 6.2: a real state root. Lesson 6.1's trie over the 21 entries `npm run state-fallback`
     reads, the state before the fallback trace's first block, drawn sideways: the root on the
     left, a column per bit of the key, each leaf named by what its key is. Its root is the one
     the block's header promises. Tap a leaf for its key and value; change a value that sits in
     its leaf and watch the hashes up to the root change, and the promise break. Computed in
     state-root.ts with trie.ts. -->
<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { toHex } from "./bytes.ts";
import { ENTRIES, nameOf, PROMISED, stateRoot } from "./state-root.ts";
import { fitsInLeaf, layout, leavesOf, type Node } from "./trie.ts";

const TIME = ENTRIES.find((e) => e.key.startsWith("0x0b"))!.key; // τ, C(11)
const ONE = "0x01000000"; // slot 1, as τ's 4 bytes hold it (little-endian)

const changed = ref(new Map<string, string>());
const picked = ref(TIME);
const draft = ref("");
const bad = ref(false);

const state = computed(() => stateRoot(changed.value));
const leaves = computed(() => leavesOf(state.value.trie));
const keyHex = (k: number[]) => toHex(k);
const leafOf = (key: string) => leaves.value.find((l) => keyHex(l.entry.key) === key)!;
const entry = computed(() => ENTRIES.find((e) => e.key === picked.value)!);
const leaf = computed(() => leafOf(picked.value));
const valueNow = computed(() => changed.value.get(picked.value) ?? entry.value.value);
const sizeNow = computed(() => (valueNow.value === undefined ? entry.value.size : (valueNow.value.length - 2) / 2));
const twins = computed(() => ENTRIES.filter((e) => e !== entry.value && e.hash && e.hash === entry.value.hash).map((e) => nameOf(e).label));
const deepest = computed(() => Math.max(...leaves.value.map((l) => l.path.length)));
const short = (hex: string) => `${hex.slice(0, 10)}…`;
const fmt = (n: number) => n.toLocaleString("en-US");

function pick(key: string) {
  picked.value = key;
  draft.value = changed.value.get(key) ?? ENTRIES.find((e) => e.key === key)!.value ?? "";
  bad.value = false;
}
function edit(text: string) {
  draft.value = text;
  bad.value = !/^0x([0-9a-fA-F]{2})*$/.test(text);
  if (bad.value) return;
  const next = new Map(changed.value);
  if (text.toLowerCase() === entry.value.value) next.delete(picked.value);
  else next.set(picked.value, text.toLowerCase());
  changed.value = next;
}
function timeIsOne() { pick(TIME); edit(ONE); }
function putBack() { changed.value = new Map(); pick(picked.value); }
pick(TIME);

// the drawing, sideways: a column per bit of the key, a row per leaf; narrower on a phone
const narrow = ref(false);
let query: MediaQueryList | null = null;
const onQuery = () => { narrow.value = !!query?.matches; };
onMounted(() => { query = window.matchMedia("(max-width: 640px)"); onQuery(); query.addEventListener("change", onQuery); });
onUnmounted(() => query?.removeEventListener("change", onQuery));
const D = computed(() => (narrow.value ? { col: 12, label: 124, pad: 6 } : { col: 28, label: 196, pad: 10 }));
const ROW = computed(() => (narrow.value ? { leaf: 36, empty: 18 } : { leaf: 34, empty: 18 })); // a leaf stays 32 px to tap, scaled
const drawing = computed(() => layout(state.value.trie, ROW.value));
const X = (depth: number) => D.value.pad + depth * D.value.col;
const Y = (x: number) => D.value.pad + x;
const width = computed(() => X(drawing.value.depth) + D.value.label + 2 * D.value.pad);
const height = computed(() => drawing.value.width + 2 * D.value.pad);
const onPath = (n: Node) => leaf.value.path.startsWith(n.path);
const isChanged = (n: Node) => n.kind === "leaf" && changed.value.has(keyHex(n.entry.key));
const labelOf = (n: Node) => {
  const e = ENTRIES.find((x) => n.kind === "leaf" && x.key === keyHex(n.entry.key))!;
  return `${narrow.value ? nameOf(e).tag : nameOf(e).label} · ${fmt(n.kind === "leaf" ? n.entry.size : 0)} B`;
};
</script>

<template>
  <div class="widget state-root">
    <div class="readout" aria-live="polite">
      <div class="tile"><span class="tile-label">entries</span><span class="tile-value">{{ ENTRIES.length }}</span></div>
      <div class="tile"><span class="tile-label">deepest leaf</span><span class="tile-value">{{ deepest }}</span></div>
      <div class="tile"><span class="tile-label">the state root</span><span class="tile-value hash">{{ short(state.root) }}</span></div>
      <div class="tile" :class="state.matches ? 'ok' : 'broken'"><span class="tile-label">the header's parent_state_root</span><span class="tile-value">{{ state.matches ? "✓ the same" : "✗ not the same" }}</span></div>
    </div>
    <p class="range">
      The state before the <code>fallback</code> trace's first block: the 21 entries <code>npm run state-fallback</code> reads, built
      into lesson 6.1's trie and hashed up to one root, <code>{{ short(PROMISED) }}</code>, which the block's header promises. Drawn
      on its side: the root on the left, a column for each bit of the key, and each leaf named by what its key is. Tap one.
    </p>
    <div class="controls">
      <button class="small" @click="timeIsOne">set τ to slot 1</button>
      <button class="small" :disabled="!changed.size" @click="putBack">put the state back</button>
    </div>
    <div class="strip" tabindex="0" aria-label="the state trie, drawn on its side">
      <svg :viewBox="`0 0 ${width} ${height}`" :width="width" :height="height" role="group"
        :aria-label="`the state trie: ${ENTRIES.length} leaves, the deepest at depth ${deepest}`">
        <g v-for="e in drawing.edges" :key="`e${e.to.node.path}`">
          <line class="edge" :class="{ redone: onPath(e.to.node) }" :x1="X(e.from.depth)" :y1="Y(e.from.x)" :x2="X(e.to.depth)" :y2="Y(e.to.x)" />
          <text v-if="!narrow" class="bit" :x="(X(e.from.depth) + X(e.to.depth)) / 2" :y="(Y(e.from.x) + Y(e.to.x)) / 2 + (e.bit === '0' ? -3 : 9)">{{ e.bit }}</text>
        </g>
        <g v-for="p in drawing.placed" :key="`n${p.node.path}`" :class="{ redone: onPath(p.node) }">
          <circle v-if="p.node.kind === 'branch'" class="branch" :cx="X(p.depth)" :cy="Y(p.x)" :r="p.depth === 0 ? 7 : 4.5" />
          <rect v-else-if="p.node.kind === 'empty'" class="empty" :x="X(p.depth) - 5" :y="Y(p.x) - 5" width="10" height="10" rx="2" />
          <g v-else class="leaf-g" role="button" tabindex="0" :aria-label="labelOf(p.node)" :aria-pressed="p.node === leaf"
            @click="pick(keyHex(p.node.entry.key))" @keydown.enter.space.prevent="pick(keyHex(p.node.entry.key))">
            <rect class="leaf" :class="{ picked: p.node === leaf, changed: isChanged(p.node), hashed: !fitsInLeaf(p.node.entry.size) }"
              :x="X(p.depth) - 5" :y="Y(p.x) - ROW.leaf / 2 + 1" :width="D.label + 5" :height="ROW.leaf - 2" rx="5" />
            <text class="leaf-label" :x="X(p.depth) + 4" :y="Y(p.x) + 4">{{ labelOf(p.node) }}</text>
          </g>
        </g>
        <text class="root-label" :x="X(0) + 10" :y="Y(drawing.placed.find((p) => p.depth === 0)!.x) - 8">root</text>
      </svg>
    </div>
    <p class="legend">
      <span class="key-dot branch-dot"></span> a branch · <span class="key-dot leaf-dot"></span> a leaf, its value inside ·
      <span class="key-dot hashed-dot"></span> a leaf holding its value's hash · <span class="key-dot empty-dot"></span> an empty side ·
      in orange: the hashes a change to the tapped leaf redoes
    </p>
    <div class="detail" aria-live="polite">
      <p class="title">{{ nameOf(entry).title }}</p>
      <p class="row"><span class="what">key</span><code class="keyhex">{{ entry.key }}</code></p>
      <p class="row"><span class="what">placed by</span><span>its first {{ leaf.path.length }} bit{{ leaf.path.length === 1 ? "" : "s" }}, <code>{{ leaf.path }}</code>: no other key starts with them</span></p>
      <p class="row">
        <span class="what">value</span>
        <template v-if="entry.value !== undefined">
          <input :value="draft" spellcheck="false" autocomplete="off" :aria-label="`${nameOf(entry).title}: its value in hex, from 0x`" @input="edit(($event.target as HTMLInputElement).value)" />
          <span class="note">{{ bad ? "hex, whole bytes, from 0x" : `${sizeNow} byte${sizeNow === 1 ? "" : "s"}, ${fitsInLeaf(sizeNow) ? "inside its leaf" : "too big now: the leaf holds its hash"}` }}</span>
        </template>
        <span v-else>{{ fmt(entry.size) }} bytes, too big for its leaf: the leaf holds its hash, <code>{{ short(entry.hash!) }}</code>{{ twins.length ? `, the same as ${twins.join(" and ")}'s: the same ${fmt(entry.size)} bytes` : "" }}</span>
      </p>
      <p class="row says">
        Change it, and {{ leaf.path.length + 1 }} hashes are redone: its leaf's, then the {{ leaf.path.length }} branch{{ leaf.path.length === 1 ? "" : "es" }} above it, the last
        one the root. {{ state.matches ? "As it is, the root is the one the header promises." : `The root is now ${short(state.root)}: not the state this block was built on.` }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.state-root .readout { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); }
.tile { min-width: 0; }
.tile .tile-value { font-size: 15px; white-space: nowrap; }
.tile.ok { border-color: var(--bit-low-line); background: var(--bit-low); }
.tile.broken { border-color: var(--bit-mark-line); background: var(--bit-mark); }
.range { font-size: 14px; color: var(--vp-c-text-2); margin: 8px 0 10px; line-height: 1.5; }
.controls { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
.controls button { min-height: 32px; }
.controls button:disabled { opacity: 0.5; cursor: default; }
.strip { max-width: 100%; overflow-x: auto; border: 1px dashed var(--vp-c-divider); border-radius: 6px; }
.strip svg { display: block; margin: 0 auto; max-width: 100%; height: auto; font-family: var(--vp-font-family-mono); }
.edge { stroke: var(--vp-c-text-3); stroke-width: 1.2; }
.bit { fill: var(--bit-top-line); font-size: 9px; font-weight: 700; text-anchor: middle; }
.branch { fill: var(--bit-top); stroke: var(--bit-top-line); stroke-width: 1.5; }
.empty { fill: var(--vp-c-bg-soft); stroke: var(--vp-c-text-3); stroke-dasharray: 2 2; }
.leaf-g { cursor: pointer; }
.leaf-g:focus-visible { outline: none; }
.leaf-g:focus-visible .leaf { stroke-width: 3; }
.leaf { fill: var(--bit-low); stroke: var(--bit-low-line); stroke-width: 1.2; }
.leaf.hashed { fill: var(--vp-c-bg-soft); stroke: var(--vp-c-text-3); }
.leaf.picked { stroke: var(--vp-c-text-1); stroke-width: 2.5; }
.leaf.changed { fill: var(--bit-mark); }
.leaf-label { fill: var(--vp-c-text-1); font-size: 11px; dominant-baseline: auto; }
.root-label { fill: var(--vp-c-text-2); font-size: 10px; }
.redone .branch, .redone .leaf, .edge.redone { stroke: var(--bit-mark-line); stroke-width: 2.5; }
.legend { font-size: 13px; color: var(--vp-c-text-2); margin: 6px 0; line-height: 1.8; }
.key-dot { display: inline-block; width: 12px; height: 12px; border: 1.5px solid; border-radius: 3px; vertical-align: middle; }
.branch-dot { background: var(--bit-top); border-color: var(--bit-top-line); border-radius: 50%; }
.leaf-dot { background: var(--bit-low); border-color: var(--bit-low-line); }
.hashed-dot { background: var(--vp-c-bg-soft); border-color: var(--vp-c-text-3); }
.empty-dot { border-style: dashed; border-color: var(--vp-c-text-3); }
.detail { border-top: 1px solid var(--vp-c-divider); padding-top: 6px; min-height: 15em; font-size: 14px; }
.detail p { margin: 4px 0; line-height: 1.5; }
.title { font-weight: 600; }
.row { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 8px; }
.what { color: var(--vp-c-text-3); font-size: 12px; min-width: 5.5em; }
.keyhex { font-size: 12px; overflow-wrap: anywhere; word-break: break-all; }
.row input { width: 26ch; max-width: 100%; min-height: 32px; padding: 2px 8px; border: 1px solid var(--vp-c-divider); border-radius: 6px; font-family: var(--vp-font-family-mono); font-size: 14px; }
.note { font-family: var(--vp-font-family-mono); font-size: 12px; color: var(--vp-c-text-2); }
.says { display: block; color: var(--vp-c-text-2); }
@media (max-width: 640px) { .detail { min-height: 27.5em; } }
</style>
