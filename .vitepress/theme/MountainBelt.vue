<!-- Lesson 9.1: a Merkle mountain belt, appended to one item at a time. The new item is
     carried up from place 0, merging with every peak it meets, until it rests in an empty
     place: adding 1 in binary, except each "digit" is a real 32-byte Keccak hash, computed
     live — the same items and hashes bin/belt.ts prints. Step by step shows the carry one
     place at a time; take one back shows that only replaying the items can go backwards. -->
<script setup lang="ts">
import { computed, ref } from "vue";
import { appendSteps, beltOf, beltPartway, beltSuperPeak, itemMountain, itemsIn, label, mergeMountains, peaksIn, shortHash } from "./belt.ts";
import type { Belt, Mountain, Step } from "./belt.ts";

const MOST = 63; // six places, 111111: the row still fits a phone
const START = 5; // the lesson's example: a mountain of 4 and a mountain of 1
const GOALS = [
  { id: "three", say: "make the belt need 3 peaks" },
  { id: "carry", say: "watch a carry go 3 places" },
  { id: "four", say: "make a new mountain of 4" },
  { id: "back", say: "take item 32 back (the hard way)" },
];

const belt = ref<Belt<Mountain>>(beltOf(START));
const stepping = ref(false);
/** The append under way in step-by-step mode: its steps, and how many are taken. */
const pending = ref<{ before: Belt<Mountain>; steps: Step<Mountain>[]; after: Belt<Mountain>; taken: number } | null>(null);
/** The last append's steps, for the log, and the count it started from. */
const last = ref<{ from: number; steps: Step<Mountain>[] } | null>(null);
/** The last take-one-back: where from, and how many merges that append had made. */
const wentBack = ref<{ from: number; merges: number } | null>(null);
const reached = ref(new Set<string>());

const n = computed(() => itemsIn(belt.value));
const width = computed(() => Math.max(1, belt.value.length));
const binary = (x: number) => x.toString(2).padStart(width.value, "0");
const shown = computed(() => (pending.value ? beltPartway(pending.value.before, pending.value.steps, pending.value.taken) : belt.value));
const carry = computed(() => {
  const p = pending.value;
  return p && p.taken < p.steps.length ? p.steps[p.taken] : null;
});
const places = computed(() => Math.max(shown.value.length, carry.value ? carry.value.place + 1 : 0));
const log = computed(() => (pending.value ? pending.value.steps.slice(0, pending.value.taken) : last.value?.steps ?? []));
const merges = (steps: Step<Mountain>[]) => steps.filter((s) => s.action === "merge").length;
const top = computed(() => `${beltSuperPeak(belt.value).slice(0, 10)}…`);
const mark = (id: string) => { reached.value = new Set([...reached.value, id]); };

const backNote = computed(() => {
  const w = wentBack.value;
  if (!w) return null;
  if (w.merges === 0)
    return `Back from ${w.from} to ${w.from - 1} items — and this one needed no cheating: item ${w.from} sat alone in place 0, its 32 bytes unhashed, so clearing the place was the whole step.`;
  return (
    `Back from ${w.from} to ${w.from - 1} items — but only because this page kept the items and replayed 1 to ${w.from - 1} from an empty belt. ` +
    `The ${w.from}-item belt alone can never do it: appending item ${w.from} merged ${w.merges} time${w.merges === 1 ? "" : "s"}, and each H(peak ⌢ carried) destroyed the two 32-byte peaks it read. Keccak only goes forward.`
  );
});

function finish(steps: Step<Mountain>[], after: Belt<Mountain>) {
  last.value = { from: n.value, steps };
  belt.value = after;
  pending.value = null;
  // a goal counts when the reader's append brings it about
  const rest = steps[steps.length - 1];
  if (peaksIn(after) === 3) mark("three");
  if (merges(steps) >= 3) mark("carry");
  if (rest.place === 2) mark("four");
}
function append() {
  if (n.value >= MOST || pending.value) return;
  wentBack.value = null;
  const { steps, belt: after } = appendSteps(belt.value, itemMountain(n.value + 1), mergeMountains);
  if (stepping.value) pending.value = { before: belt.value, steps, after, taken: 0 };
  else finish(steps, after);
}
function jumpTo(items: number) {
  if (pending.value) return;
  belt.value = beltOf(items);
  last.value = null;
  wentBack.value = null;
}
function takeOneBack() {
  const from = n.value;
  if (from === 0 || pending.value) return;
  const before = beltOf(from - 1);
  wentBack.value = { from, merges: merges(appendSteps(before, itemMountain(from), mergeMountains).steps) };
  belt.value = before;
  last.value = null;
  if (from === 32) mark("back");
}
function next() {
  const p = pending.value;
  if (!p) return;
  p.taken++;
  if (p.taken === p.steps.length) finish(p.steps, p.after);
}
function toggleStepping() {
  stepping.value = !stepping.value;
  const p = pending.value;
  if (!stepping.value && p) finish(p.steps, p.after);
}
function reset() {
  belt.value = [];
  pending.value = null;
  last.value = null;
  wentBack.value = null;
}
const size = (place: number) => 2 ** place;
const said = (s: Step<Mountain>) =>
  s.action === "merge"
    ? `place ${s.place} holds ${label(s.peak)}: merge. H(${label(s.peak)} ⌢ ${label(s.carried)}) = ${label(s.merged)}, carried on; place ${s.place} empties.`
    : s.newPlace
      ? `past the last place: rest. ${label(s.carried)} is a new, biggest mountain in place ${s.place}.`
      : `place ${s.place} is empty: rest. ${label(s.carried)} stays there.`;
</script>

<template>
  <div class="widget mountain-belt">
    <div class="readout" aria-live="polite">
      <div class="tile"><span class="tile-label">items n</span><span class="tile-value">{{ n }}</span></div>
      <div class="tile"><span class="tile-label">peaks</span><span class="tile-value">{{ peaksIn(belt) }}</span></div>
      <div class="tile"><span class="tile-label">n in binary</span><span class="tile-value">{{ n.toString(2) }}</span></div>
      <div class="tile"><span class="tile-label">super-peak M_R</span><span class="tile-value top">{{ top }}</span></div>
    </div>
    <p class="range">
      Place i holds the peak of a mountain of 2^i items, or ∅ — so the belt is n in binary, written backwards. But
      where a counter's digit is a bare 1, a held place here stores exactly 32 bytes: a real Keccak-256 hash, computed
      live on this page, the same values <code>npm run belt</code> prints. The label is just for reading — 1–4 means
      the mountain over items 1 to 4; the bytes below it are the peak itself. Appending carries the new item up from
      place 0: a peak there merges with it, H(peak ⌢ carried), and the carry moves on; an empty place, and it rests.
    </p>
    <div class="belt" :style="{ gridTemplateColumns: `repeat(${places}, minmax(0, 1fr))` }">
      <template v-for="i in places" :key="`c${i}`">
        <span class="carry" :style="{ gridColumn: i, gridRow: 1 }">
          <template v-if="carry && carry.place === i - 1">↓ {{ label(carry.carried) }}</template>
        </span>
      </template>
      <div v-for="i in places" :key="i" class="place" :style="{ gridColumn: i, gridRow: 2 }"
        :class="{ held: shown[i - 1], here: carry && carry.place === i - 1 }">
        <span class="name"><span class="word">place </span>{{ i - 1 }}</span>
        <span class="peak">{{ shown[i - 1] ? label(shown[i - 1]!) : "∅" }}</span>
        <span class="hex">{{ shown[i - 1] ? shortHash(shown[i - 1]!) : "" }}</span>
        <span class="name">of {{ size(i - 1) }}</span>
        <span class="bit unit-bit">{{ shown[i - 1] ? 1 : 0 }}</span>
      </div>
    </div>
    <p v-if="!places" class="line">An empty belt: no places yet, n = 0.</p>
    <p v-else class="line">
      {{ n }} in binary is <code class="bits">0b{{ n.toString(2) }}</code>. Read the places from the right: the peaks
      are its 1s, each one 32 bytes that remember everything they merged.
    </p>
    <div class="controls">
      <button class="small" :disabled="n >= MOST || !!pending" @click="append">append item {{ n + 1 }}</button>
      <button class="small" :aria-pressed="stepping" :class="{ chosen: stepping }" @click="toggleStepping">step by step</button>
      <button v-if="stepping" class="small" :disabled="!pending" @click="next">next step</button>
      <button class="small" :disabled="n === 32 || !!pending" @click="jumpTo(32)">jump to 32 items</button>
      <button class="small" :disabled="n === 0 || !!pending" @click="takeOneBack">take one back</button>
      <button class="small" @click="reset">empty the belt</button>
    </div>
    <p v-if="backNote" class="line back"><UnitText :text="backNote" /></p>
    <div v-if="pending || last" class="log">
      <p class="sum">
        <template v-if="pending">appending item {{ n + 1 }}: carrying {{ carry ? label(carry.carried) : "" }}</template>
        <template v-else-if="last">
          appended item {{ last.from + 1 }}: <code class="bits">0b{{ binary(last.from) }}</code> + 1 = <code class="bits">0b{{ binary(n) }}</code>,
          {{ merges(last.steps) }} merge{{ merges(last.steps) === 1 ? "" : "s" }}
        </template>
      </p>
      <ol>
        <li v-for="s in log" :key="s.place" :class="s.action"><UnitText :text="said(s)" /></li>
      </ol>
    </div>
    <p v-if="n >= MOST" class="line">63 items fill six places: <code class="bits">0b111111</code>. Empty the belt to start again.</p>
    <ul class="goals">
      <li v-for="g in GOALS" :key="g.id" :class="{ done: reached.has(g.id) }">{{ reached.has(g.id) ? "✓" : "○" }} <UnitText :text="g.say" /></li>
    </ul>
  </div>
</template>

<style scoped>
.range { font-size: 14px; color: var(--vp-c-text-2); margin: 0 0 12px; line-height: 1.5; }
.belt { display: grid; gap: 4px; max-width: 100%; }
.carry { min-height: 22px; text-align: center; font-family: var(--vp-font-family-mono); font-size: 13px; color: var(--bit-mark-line); font-weight: 600; }
.place {
  display: flex; flex-direction: column; align-items: center; min-width: 0; padding: 6px 2px;
  border: 1px solid var(--vp-c-divider); border-radius: 6px; background: var(--vp-c-bg-soft);
  font-family: var(--vp-font-family-mono);
}
.place.held { background: var(--bit-low); border-color: var(--bit-low-line); }
.place.here { border-color: var(--bit-mark-line); box-shadow: 0 0 0 2px var(--bit-mark-line); }
.name { font-size: 12px; color: var(--vp-c-text-2); white-space: nowrap; }
.peak { font-size: 16px; font-weight: 600; white-space: nowrap; }
.hex { font-size: 10px; color: var(--vp-c-text-3); min-height: 14px; max-width: 100%; overflow: hidden; }
.tile-value.top { font-size: 16px; }
.line.back { color: var(--vp-c-text-2); }
.place:not(.held) .peak { color: var(--vp-c-text-3); }
.bit { font-size: 18px; font-weight: 600; }
.place:not(.held) .bit { color: var(--vp-c-text-3); }
.line { font-size: 14px; margin: 8px 0; }
.controls { display: flex; gap: 6px; flex-wrap: wrap; }
.controls button { min-height: 32px; }
.controls button:disabled { opacity: 0.5; cursor: default; }
.sum { font-family: var(--vp-font-family-mono); font-size: 14px; margin: 12px 0 4px; }
.log ol { margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.5; }
.goals { list-style: none; padding: 0; margin: 12px 0 0; font-size: 14px; color: var(--vp-c-text-2); }
.goals li.done { color: var(--vp-c-green-1); }
@media (max-width: 640px) {
  .peak { font-size: 12px; }
  .hex { font-size: 8px; }
  .word { display: none; }
  .name { font-size: 11px; }
  .place { padding: 4px 1px; }
}
</style>
