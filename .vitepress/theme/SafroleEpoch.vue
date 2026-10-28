<!-- Lesson 8.5: a tiny Safrole chain to drive a block at a time. Enter tickets while the
     lottery is open, watch it close at phase Y, and see the next epoch seated by its
     winners, outside in, or by the fallback. The rules are safrole-epoch.ts's. -->
<script setup lang="ts">
import { computed, ref } from "vue";
import {
  NULL_KEY, START, TINY, comingSealers, epochOf, hexId, nextBlock, phaseOf, sealerOf, step, story, ticketIds,
} from "./safrole-epoch.ts";
import type { State, Ticket } from "./safrole-epoch.ts";

const { E, Y, K } = TINY;
const OFFENDER = "ab00"; // the offender in lesson 8.2's vector
const GOALS = [
  { id: "fill", say: `fill the lottery (${E} tickets) before it closes` },
  { id: "mark", say: "see the tickets mark" },
  { id: "seated", say: "see the winners seated outside in" },
  { id: "short", say: "let the lottery close short and see the fallback" },
];
const SETS = [
  { key: "staging", name: "ι staging" },
  { key: "pending", name: "γ_P pending" },
  { key: "active", name: "κ active" },
  { key: "previous", name: "λ previous" },
] as const;

const state = ref<State>(START);
const skipped = ref(0);
const chosen = ref<Ticket[]>([]);
const offenders = ref<string[]>([]);
const log = ref<string[]>(["slot 0: the state every tiny safrole vector starts from. Press next block."]);
const reached = ref(new Set<string>());

const nextSlot = computed(() => state.value.time + 1 + skipped.value);
const next = computed(() => nextBlock(TINY, state.value, nextSlot.value, offenders.value));
const ids = computed(() => ticketIds(next.value.eta2, next.value.pending.length, next.value.n));
const preview = computed(() => step(TINY, state.value, nextSlot.value, chosen.value, offenders.value));
const sealer = computed(() => sealerOf(TINY, preview.value.after.sealers, nextSlot.value));
const phase = computed(() => phaseOf(TINY, state.value.time));
const open = computed(() => phase.value < Y);
const coming = computed(() => comingSealers(TINY, state.value));
const sealers = computed(() => state.value.sealers);
/** Each winning ticket's rank, t0 the best (lowest id), as lesson 8.4 numbers them. */
const rank = computed(() => {
  const s = state.value.sealers;
  return "tickets" in s ? s.tickets.map((t) => [...s.tickets].sort((x, y) => x.id - y.id).indexOf(t)) : [];
});
const held = computed(() => new Set(next.value.newEpoch ? [] : state.value.accumulator.map((t) => t.id)));

const isChosen = (id: number) => chosen.value.some((t) => t.id === id);
function why(): string {
  if (!next.value.open) return `slot ${nextSlot.value} is phase ${phaseOf(TINY, nextSlot.value)}: the lottery is closed to it, so it carries no tickets`;
  if (next.value.newEpoch) return `slot ${nextSlot.value} starts epoch ${epochOf(TINY, nextSlot.value)}: its tickets open the new lottery, ids from the new η′₂`;
  if (state.value.accumulator.length === E) {
    return `slot ${nextSlot.value}'s block may carry ${K}: the lottery is full, but it keeps the ${E} lowest ids, so a lower id still knocks the highest winner out`;
  }
  return `slot ${nextSlot.value}'s block may carry ${K}: pick up to ${K}. Lower ids are better`;
}
function toggle(by: string, attempt: number, id: number) {
  chosen.value = isChosen(id) ? chosen.value.filter((t) => t.id !== id) : [...chosen.value, { id, attempt, by }];
}
const disabled = (by: string, id: number) =>
  !next.value.open || by === NULL_KEY || held.value.has(id) || (!isChosen(id) && chosen.value.length >= K);

function makeBlock() {
  const before = state.value, result = preview.value, slot = nextSlot.value;
  log.value = story(TINY, before, slot, result, offenders.value);
  state.value = result.after;
  skipped.value = 0;
  chosen.value = [];
  // a goal counts when the reader's own block brings it about
  const mark = (id: string) => { reached.value = new Set([...reached.value, id]); };
  if (before.accumulator.length < E && result.after.accumulator.length === E) mark("fill");
  if (result.mark) mark("mark");
  if (result.byTickets) mark("seated");
  if (result.newEpoch && !result.byTickets && before.accumulator.length < E) mark("short");
}
function skip() {
  skipped.value++;
  chosen.value = [];
}
/** ψ_O gains ab00: from the next epoch change on, ι's ab00 reaches γ_P as a blank key. */
function convict() {
  offenders.value = [OFFENDER];
  chosen.value = []; // the next block's pending set may have changed
}
function restart() {
  state.value = START;
  skipped.value = 0;
  chosen.value = [];
  offenders.value = [];
  log.value = ["slot 0 again: the vectors' starting state."];
}
</script>

<template>
  <div class="widget safrole-epoch">
    <div class="readout" aria-live="polite">
      <div class="tile"><span class="tile-label">slot τ</span><span class="tile-value">{{ state.time }}</span></div>
      <div class="tile"><span class="tile-label">epoch</span><span class="tile-value">{{ epochOf(TINY, state.time) }}</span></div>
      <div class="tile"><span class="tile-label">phase</span><span class="tile-value">{{ phase }}</span></div>
      <div class="tile" :class="{ ok: open }"><span class="tile-label">lottery</span><span class="tile-value wide">{{ open ? "open" : "closed" }}</span></div>
      <div class="tile" :class="{ ok: state.accumulator.length === E }">
        <span class="tile-label">tickets</span><span class="tile-value">{{ state.accumulator.length }}/{{ E }}</span>
      </div>
      <div class="tile"><span class="tile-label">next epoch</span><span class="tile-value wide">{{ coming === "undecided" ? "?" : coming }}</span></div>
    </div>
    <p class="range">
      Tiny: an epoch is E = {{ E }} slots. The lottery is open below phase Y = {{ Y }}: a block carries up to K =
      {{ K }} tickets, each of the 6 pending validators may enter n = ⌈2E / 6⌉ = {{ next.n }}, and it keeps the
      {{ E }} lowest ids. The block that reaches phase {{ Y }} closes it, and the next epoch is sealed by the
      winners if it closed full, else by the fallback.
    </p>
    <div class="controls">
      <button class="small go" :disabled="sealer.who === NULL_KEY" @click="makeBlock">next block: slot {{ nextSlot }}</button>
      <button class="small" @click="skip">skip a slot</button>
      <button class="small" :aria-pressed="offenders.length > 0" :disabled="offenders.length > 0" @click="convict">
        {{ offenders.length ? `${OFFENDER} convicted` : `convict ${OFFENDER}` }}
      </button>
      <button class="small" @click="restart">start over</button>
    </div>
    <p v-if="sealer.who === NULL_KEY" class="warn">
      Slot {{ nextSlot }}'s sealer is a blank key: nobody can make its block. Skip it.
    </p>
    <ul class="log">
      <li v-for="(line, i) in log" :key="i"><UnitText :text="line" /></li>
    </ul>

    <div class="label">tickets for the next block ({{ chosen.length }} of {{ K }}): {{ why() }}</div>
    <div class="tickets">
      <div v-for="(v, row) in next.pending" :key="row" class="ticket-row">
        <span class="who" :class="{ blank: v === NULL_KEY }">{{ v }}</span>
        <button
          v-for="(id, attempt) in ids[row]" :key="attempt" class="small ticket"
          :class="{ chosen: isChosen(id), held: held.has(id) }" :aria-pressed="isChosen(id)"
          :aria-label="`${v}'s attempt ${attempt}: ticket id ${hexId(id)}${held.has(id) ? ', in the lottery' : ''}`"
          :disabled="disabled(v, id)" @click="toggle(v, attempt, id)"
        ><span class="bytes">{{ hexId(id) }}</span></button>
      </div>
    </div>
    <p class="note">
      Each row is a validator of γ′_P, each button one of its {{ next.n }} attempts. A real id is a 32-byte VRF output
      (lesson 8.6) of its key, η′₂ and the attempt; here two hex digits dealt by a stand-in hash of η′₂.
      {{ next.pending.includes(NULL_KEY) ? `${NULL_KEY}, a blank key, can't enter: nobody can sign for it.` : "" }}
    </p>

    <div class="label">γ_A, the lottery: the {{ E }} lowest ids so far, lowest first</div>
    <div class="cells">
      <span v-for="i in E" :key="i" class="cell" :class="{ empty: !state.accumulator[i - 1] }">
        <span :class="{ bytes: state.accumulator[i - 1] }">{{ state.accumulator[i - 1] ? hexId(state.accumulator[i - 1].id) : "··" }}</span>
      </span>
    </div>

    <div class="label">
      γ_S, epoch {{ epochOf(TINY, state.time) }}'s sealers, slot by slot:
      <template v-if="'tickets' in sealers">the winning tickets, outside in (t0 the best)</template>
      <template v-else-if="sealers.real">validators picked by a hash of η₂ and the slot (the real picks, from the vectors)</template>
      <template v-else>validators picked by a hash of η₂ and the slot (illustrative: the widget can't run Blake2b)</template>
    </div>
    <div class="cells">
      <span
        v-for="p in E" :key="p" class="cell seat unit-byte"
        :class="{ now: p - 1 === phase, blank: !('tickets' in sealers) && sealers.keys[p - 1] === NULL_KEY }"
      >
        <small>{{ p - 1 }}</small>
        <template v-if="'tickets' in sealers">
          <span class="bytes">{{ hexId(sealers.tickets[p - 1].id) }}</span><small>t{{ rank[p - 1] }}</small>
        </template>
        <template v-else>{{ sealers.keys[p - 1] }}</template>
      </span>
    </div>

    <div class="label">validator sets, each key by its first 2 bytes: at a new epoch ι → γ_P → κ → λ, offenders blanked</div>
    <div v-for="s in SETS" :key="s.key" class="set">
      <span class="who name">{{ s.name }}</span>
      <span
        v-for="(v, i) in state.sets[s.key]" :key="i" class="cell unit-byte"
        :class="{ blank: v === NULL_KEY, offender: offenders.includes(v) }"
      >{{ v }}</span>
    </div>

    <div class="label">η: η₀ stirred by every block; at a new epoch η₀ → η₁ → η₂ → η₃</div>
    <div class="cells">
      <span v-for="(eta, i) in state.entropy" :key="i" class="cell eta"><small>η{{ "₀₁₂₃"[i] }}</small><span class="bytes">{{ eta.base }}…</span>{{ eta.stirs ? ` +${eta.stirs}` : "" }}</span>
    </div>
    <p class="note">
      A real η is 32 bytes. Each starts as the vectors' value, first 8 hex digits shown; "+3" means 3 blocks have stirred it
      since (η′₀ = H(η₀ ⌢ Y(H_V))), which takes Blake2b, so the widget counts instead.
    </p>

    <ul class="goals">
      <li v-for="g in GOALS" :key="g.id" :class="{ done: reached.has(g.id) }">{{ reached.has(g.id) ? "✓" : "○" }} <UnitText :text="g.say" /></li>
    </ul>
  </div>
</template>

<style scoped>
.range { font-size: 14px; color: var(--vp-c-text-2); margin: 0 0 12px; line-height: 1.5; }
.tile.ok { border-color: var(--bit-low-line); background: var(--bit-low); }
.tile-value.wide { min-width: 8ch; }
.controls { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
.controls button { min-height: 36px; }
.controls button.go { border-color: var(--vp-c-brand-1); color: var(--vp-c-brand-1); font-weight: 600; }
.controls button:disabled { opacity: 0.6; cursor: default; }
.warn { color: var(--vp-c-danger-1); font-size: 14px; margin: 4px 0; }
.log {
  margin: 8px 0; padding: 8px 12px 8px 28px; border-left: 3px solid var(--bit-mark-line); background: var(--bit-mark);
  font-size: 14px; line-height: 1.5; min-height: 5.5em;
}
.label { font-size: 13px; color: var(--vp-c-text-2); margin-top: 14px; line-height: 1.4; }
.note { font-size: 12px; color: var(--vp-c-text-2); margin: 4px 0 0; line-height: 1.4; }
.tickets { display: flex; flex-direction: column; gap: 4px; margin: 6px 0; }
.ticket-row, .set { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.set { margin: 4px 0; }
.who { font-family: var(--vp-font-family-mono); font-size: 13px; color: var(--vp-c-text-2); min-width: 4.5ch; }
.who.name { min-width: 11ch; }
.who.blank { text-decoration: line-through; }
.ticket { min-width: 44px; min-height: 36px; }
.ticket.held { background: var(--bit-low); border-color: var(--bit-low-line); }
.ticket.chosen { background: var(--bit-top); border-color: var(--bit-top-line); color: var(--vp-c-text-1); }
.ticket:disabled:not(.held) { opacity: 0.4; cursor: default; }
.cells { display: flex; gap: 4px; flex-wrap: wrap; margin: 6px 0; }
.cell {
  display: inline-flex; flex-direction: column; align-items: center; justify-content: center; min-width: 40px; padding: 2px 6px;
  border: 1px solid var(--vp-c-divider); border-radius: 4px; font-family: var(--vp-font-family-mono); font-size: 14px;
  background: var(--vp-c-bg-soft);
}
.cell small { font-size: 10px; color: var(--vp-c-text-2); line-height: 1.2; }
.cell.empty { color: var(--vp-c-text-3); border-style: dashed; background: none; }
.cell.now { border: 2px solid var(--vp-c-brand-1); }
.cell.blank { color: var(--vp-c-text-3); border-style: dashed; }
.cell.offender { border-color: var(--vp-c-danger-1); color: var(--vp-c-danger-1); }
.cell.eta { min-width: 9ch; }
.set .cell { min-width: 48px; }
.goals { list-style: none; padding: 0; margin: 12px 0 0; font-size: 14px; color: var(--vp-c-text-2); }
.goals li.done { color: var(--vp-c-green-1); }
@media (max-width: 640px) {
  .widget.safrole-epoch { padding: 12px; }
  .who.name { min-width: 100%; }
  .cell, .set .cell { min-width: 36px; padding: 2px 4px; font-size: 13px; }
}
</style>
