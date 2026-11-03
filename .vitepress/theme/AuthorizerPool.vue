<!-- Lesson 13.1: one core's authorizer pool, block by block. A guarantee's authorizer leaves
     (its leftmost copy), the queue's entry τ′ mod 80 joins on the right, and the pool keeps
     its newest 8. The queue is drawn as the Gray Paper reads it: a wheel of 80 entries that
     turns one notch per slot under a fixed pointer. Authorizers are letters, not hashes; the
     pool starts empty to watch it fill. -->
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { distinct, entryAngle, leftmost, MIXED, POOL_SIZE, QUEUE_SIZE, queueIndex, replay, SAME, wheelTurn } from "./authpool.ts";
import type { Entry, Step } from "./authpool.ts";

const MOST = 170; // past slot 160: twice round the wheel
const QUEUES = [
  { id: "mixed", say: "a mixed queue", queue: MIXED },
  { id: "same", say: "the trace's: A, 80 times", queue: SAME },
];
const GOALS = [
  { id: "full", say: "fill the pool to 8" },
  { id: "drop", say: "watch the oldest fall off the front" },
  { id: "twice", say: "use an authorizer that's in the pool twice, and see the leftmost go" },
  { id: "wheel", say: "go round the wheel: reach slot 80, where entry 0 comes round again" },
];

// the wheel's drawing: 80 cells round a ring, entry 0 at the top before it turns
const C = 185; // its centre, in a 370-wide drawing
const [R_OUT, R_IN, R_TEXT, R_TICK] = [168, 126, 147, 112];
const NOTCH = 360 / QUEUE_SIZE;
const at = (r: number, deg: number) => {
  const rad = (deg * Math.PI) / 180;
  return [C + r * Math.sin(rad), C - r * Math.cos(rad)].map((v) => v.toFixed(2)).join(" ");
};
const CELLS = [...Array(QUEUE_SIZE).keys()].map((i) => {
  const [a0, a1, mid] = [entryAngle(i) - NOTCH / 2, entryAngle(i) + NOTCH / 2, entryAngle(i)];
  const path = `M ${at(R_OUT, a0)} A ${R_OUT} ${R_OUT} 0 0 1 ${at(R_OUT, a1)} L ${at(R_IN, a1)} A ${R_IN} ${R_IN} 0 0 0 ${at(R_IN, a0)} Z`;
  const [x, y] = at(R_TEXT, mid).split(" ");
  const [tx, ty] = at(R_TICK, mid).split(" ");
  return { i, path, x, y, tx, ty };
});

const slot = ref(0);
const which = ref("mixed");
/** The authorizer each block's guarantee used, by slot: the reader's own picks. */
const uses = ref<Record<number, string>>({});
/** The authorizer the next block's guarantee will use, or null for no guarantee on the core. */
const pending = ref<string | null>(null);
const reached = ref(new Set<string>());

const queue = computed(() => QUEUES.find((q) => q.id === which.value)!.queue);
const run = computed(() => replay(queue.value, uses.value, slot.value));
const last = computed<Step | null>(() => run.value.last);
const pool = computed<Entry[]>(() => run.value.pool);
const nextOut = computed(() => (pending.value === null ? -1 : leftmost(pool.value, pending.value)));
const before = computed<Entry[]>(() => last.value?.before ?? []);
const dropped = computed(() => (last.value ? last.value.droppedAt.map((i) => before.value[i].auth) : []));
const places = [...Array(POOL_SIZE).keys()];
const turn = computed(() => wheelTurn(slot.value));
const lap = computed(() => Math.floor(slot.value / QUEUE_SIZE) + 1);

const change = computed(() => {
  const s = last.value;
  if (!s) return "—";
  const out = s.usedAt === null ? [] : [`−${s.used}`];
  return [`+${s.joined}`, ...out, ...dropped.value.map((a) => `−${a}`)].join(" ");
});
const grown = (s: Step) => s.before.length - (s.usedAt === null ? 0 : 1) + 1;

const mark = (id: string) => { reached.value = new Set([...reached.value, id]); };
// a goal counts when the reader's own step brings it about
watch([slot, uses, which], () => {
  const s = last.value;
  if (!s) return;
  if (s.after.length === POOL_SIZE) mark("full");
  if (s.droppedAt.length) mark("drop");
  if (s.usedAt !== null && s.before.filter((e) => e.auth === s.used).length >= 2) mark("twice");
  if (s.slot >= QUEUE_SIZE) mark("wheel");
});

function nextBlock() {
  if (slot.value >= MOST) return;
  const s = slot.value + 1;
  const kept = Object.fromEntries(Object.entries(uses.value).filter(([k]) => Number(k) < s)); // later picks no longer hold
  uses.value = pending.value === null ? kept : { ...kept, [s]: pending.value };
  pending.value = null;
  slot.value = s;
}
function back() {
  slot.value = Math.max(0, slot.value - 1);
  pending.value = null;
}
function pick(auth: string | null) {
  pending.value = pending.value === auth ? null : auth;
}
function chooseQueue(id: string) {
  which.value = id;
  uses.value = {};
  pending.value = null;
}
function reset() {
  slot.value = 0;
  uses.value = {};
  pending.value = null;
}
</script>

<template>
  <div class="widget authorizer-pool">
    <div class="readout" aria-live="polite">
      <div class="tile"><span class="tile-label">slot τ′</span><span class="tile-value">{{ slot }}</span></div>
      <div class="tile"><span class="tile-label">queue entry τ′ mod 80</span><span class="tile-value">{{ last ? last.index : "—" }}</span></div>
      <div class="tile"><span class="tile-label">pool size</span><span class="tile-value">{{ pool.length }}/{{ POOL_SIZE }}</span></div>
      <div class="tile change"><span class="tile-label">last change</span><span class="tile-value">{{ change }}</span></div>
    </div>
    <p class="range">
      One core (tiny has 2, each with its own pool and queue, run the same way). Its pool α holds at most O = 8
      authorizers, oldest on the left. Each block: a guarantee's authorizer leaves, its leftmost copy; the queue's
      entry τ′ mod 80 joins on the right; past 8, the oldest drop off the front. Letters stand for 32-byte hashes, and
      the pool starts empty so you can watch it fill.
    </p>

    <div class="controls">
      <button class="small step" aria-label="one block back" :disabled="slot === 0" @click="back">◀</button>
      <input v-model.number="slot" type="range" min="0" :max="MOST" aria-label="the block's slot, τ′" @input="pending = null" />
      <button class="small step" aria-label="next block" :disabled="slot >= MOST" @click="nextBlock">▶</button>
    </div>
    <div class="controls">
      <span class="label">block {{ slot + 1 }}'s guarantee on this core uses:</span>
      <button class="small" :class="{ chosen: pending === null }" :aria-pressed="pending === null" @click="pick(null)">none</button>
      <button v-for="a in distinct(pool)" :key="a" class="small" :class="{ chosen: pending === a }" :aria-pressed="pending === a" @click="pick(a)">{{ a }}</button>
      <button class="small go" :disabled="slot >= MOST" @click="nextBlock">next block ▶</button>
    </div>

    <div class="label">α[c], this core's pool, before block {{ last ? last.slot : 1 }}</div>
    <div class="pool" aria-label="the pool before this block">
      <span v-for="i in places" :key="i" class="chip"
        :class="{ empty: i >= before.length, used: last?.usedAt === i, dropped: last?.droppedAt.includes(i) }">
        <b>{{ before[i]?.auth ?? "·" }}</b>
        <small>{{ last?.usedAt === i ? "used" : last?.droppedAt.includes(i) ? "old" : before[i] ? `τ${before[i].joined}` : "" }}</small>
      </span>
    </div>
    <div class="label">α′[c], after it: this core's pool now</div>
    <div class="pool" aria-label="the pool now">
      <span v-for="i in places" :key="i" class="chip"
        :class="{ empty: i >= pool.length, fresh: last && i === pool.length - 1, out: nextOut === i }">
        <b>{{ pool[i]?.auth ?? "·" }}</b>
        <small>{{ nextOut === i ? "out" : last && i === pool.length - 1 ? "new" : pool[i] ? `τ${pool[i].joined}` : "" }}</small>
      </span>
    </div>

    <ol v-if="last" class="steps">
      <li>
        <template v-if="last.used === null">No guarantee on this core: nothing leaves.</template>
        <template v-else-if="last.usedAt === null">{{ last.used }} isn't in the pool: nothing leaves.</template>
        <template v-else>The guarantee used {{ last.used }}: the leftmost {{ last.used }}, place {{ last.usedAt }}, leaves.</template>
      </li>
      <li>ϕ′[{{ last.slot }} mod 80] = ϕ′[{{ last.index }}] = {{ last.joined }} joins on the right.</li>
      <li>
        <template v-if="last.droppedAt.length">
          {{ grown(last) }} is over 8: {{ dropped.join(", ") }}, the oldest, drops off the front.
        </template>
        <template v-else>{{ grown(last) }} is not over 8: nothing drops off.</template>
      </li>
    </ol>
    <p v-else class="line">No block yet: the pool is empty. Step on a block.</p>
    <p v-if="which === 'same' && last" class="line">
      Every entry is A. Take an A out, put an A in: the pool comes out as it went in.
    </p>

    <div class="controls">
      <span class="label">queue:</span>
      <button v-for="q in QUEUES" :key="q.id" class="small" :class="{ chosen: which === q.id }" :aria-pressed="which === q.id" @click="chooseQueue(q.id)">{{ q.say }}</button>
      <button class="small" @click="reset">back to slot 0</button>
    </div>
    <div class="label">
      ϕ[c], this core's queue: a wheel of 80 entries. Each slot turns it one notch, and the entry under the pointer
      joins. The next block reads entry {{ queueIndex(slot + 1) }}, just clockwise of the pointer. Every core has its own
      wheel, and all of them turn together: at a given slot, each core takes the same entry of its own queue.
    </div>
    <svg class="wheel" viewBox="0 0 370 370" role="img"
      :aria-label="`the queue as a wheel: slot ${slot}, entry ${queueIndex(slot)} under the pointer, round ${lap}`">
      <g class="dial" :style="{ transform: `rotate(${-turn}deg)` }">
        <template v-for="c in CELLS" :key="c.i">
          <path :d="c.path" class="cell"
            :class="{ now: last && last.index === c.i, next: slot < MOST && queueIndex(slot + 1) === c.i }" />
          <text :x="c.x" :y="c.y" class="letter" :style="{ transform: `rotate(${turn}deg)` }">{{ queue[c.i] }}</text>
          <text v-if="c.i % 10 === 0" :x="c.tx" :y="c.ty" class="tick" :style="{ transform: `rotate(${turn}deg)` }">{{ c.i }}</text>
        </template>
      </g>
      <path class="pointer" :d="`M ${C} ${C - R_OUT + 14} L ${C - 8} ${C - R_OUT - 12} L ${C + 8} ${C - R_OUT - 12} Z`" />
      <text :x="C" :y="C - 22" class="hub-label">slot τ′</text>
      <text :x="C" :y="C + 4" class="hub-value">{{ slot }}</text>
      <text :x="C" :y="C + 28" class="hub-label">{{ last ? `entry ${last.index}, round ${lap}` : "no block yet" }}</text>
    </svg>
    <ul class="goals">
      <li v-for="g in GOALS" :key="g.id" :class="{ done: reached.has(g.id) }">{{ reached.has(g.id) ? "✓" : "○" }} <UnitText :text="g.say" /></li>
    </ul>
  </div>
</template>

<style scoped>
.range { font-size: 14px; color: var(--vp-c-text-2); margin: 0 0 12px; line-height: 1.5; }
.tile.change .tile-value { min-width: 8ch; }
.controls { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; margin-bottom: 8px; }
.controls input[type="range"] { flex: 1; min-width: 0; height: 32px; }
.controls .small { min-height: 32px; min-width: 36px; }
.controls button:disabled { opacity: 0.5; cursor: default; }
.step { min-width: 40px; }
.label { font-size: 13px; color: var(--vp-c-text-2); margin-top: 4px; }
.pool { display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 4px; margin: 4px 0 8px; max-width: 480px; }
.chip {
  display: flex; flex-direction: column; align-items: center; min-width: 0; min-height: 40px; padding: 2px 0;
  border: 2px solid var(--vp-c-divider); border-radius: 4px; background: var(--vp-c-bg-soft);
  font-family: var(--vp-font-family-mono); line-height: 1.2; overflow: hidden;
}
.chip b { font-size: 18px; }
.chip small { font-size: 10px; color: var(--vp-c-text-2); white-space: nowrap; }
.chip.empty { border-style: dashed; background: none; }
.chip.empty b { color: var(--vp-c-text-3); }
.chip.used, .chip.out { border-color: var(--bit-mark-line); background: var(--bit-mark); }
.chip.dropped { border-style: dashed; background: none; }
.chip.dropped b { color: var(--vp-c-text-3); }
.chip.fresh { border-color: var(--bit-low-line); background: var(--bit-low); }
.steps { font-size: 14px; margin: 4px 0 8px; padding-left: 20px; line-height: 1.5; }
.line { font-size: 14px; margin: 8px 0; }
.wheel { display: block; width: 100%; max-width: 370px; margin: 4px auto 8px; overflow: visible; }
.dial { transform-box: view-box; transform-origin: 50% 50%; transition: transform 0.35s ease; }
.dial text { transform-box: fill-box; transform-origin: center; transition: transform 0.35s ease; }
.cell { fill: var(--vp-c-bg-soft); stroke: var(--vp-c-divider); stroke-width: 1; }
.cell.now { fill: var(--bit-low); stroke: var(--bit-low-line); stroke-width: 2; }
.cell.next { stroke: var(--bit-top-line); stroke-width: 2; stroke-dasharray: 3 2; }
.letter { font-family: var(--vp-font-family-mono); font-size: 12px; fill: var(--vp-c-text-1); text-anchor: middle; dominant-baseline: central; }
.tick { font-family: var(--vp-font-family-mono); font-size: 10px; fill: var(--vp-c-text-3); text-anchor: middle; dominant-baseline: central; }
.pointer { fill: var(--bit-low-line); }
.hub-label { font-size: 12px; fill: var(--vp-c-text-2); text-anchor: middle; }
.hub-value { font-family: var(--vp-font-family-mono); font-size: 30px; font-weight: 600; fill: var(--vp-c-text-1); text-anchor: middle; dominant-baseline: central; }
@media (prefers-reduced-motion: reduce) { .dial, .dial text { transition: none; } }
.goals { list-style: none; padding: 0; margin: 12px 0 0; font-size: 14px; color: var(--vp-c-text-2); }
.goals li.done { color: var(--vp-c-green-1); }
@media (max-width: 640px) {
  .widget.authorizer-pool { padding: 12px; }
  .chip b { font-size: 16px; }
  .chip small { font-size: 9px; }
  .steps { font-size: 13px; }
}
</style>
