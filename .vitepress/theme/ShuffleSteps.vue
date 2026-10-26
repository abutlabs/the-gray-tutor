<!-- Lesson 7.2: F one pick at a time. Step through a deck, each pick broken into its three
     moves: divide the number by l and keep the remainder, take the item at that index, and
     fill the gap with the last item; the picks so far build the result. Switch to splice,
     the obvious way to close the gap, and see a fair shuffle that isn't JAM's. Computed in
     shuffle-steps.ts. -->
<script setup lang="ts">
import { computed, ref } from "vue";
import { DECKS, movedHere, picks, shuffled } from "./shuffle-steps.ts";

const deck = ref(DECKS[0]);
const splice = ref(false);
const at = ref(0); // picks made so far
const all = computed(() => picks(deck.value, splice.value));
const done = computed(() => at.value >= all.value.length);
const pick = computed(() => all.value[Math.min(at.value, all.value.length - 1)]);
const result = computed(() => shuffled(deck.value, splice.value));
const jam = computed(() => shuffled(deck.value, false));
const choose = (d: typeof DECKS[number]) => { deck.value = d; at.value = 0; };
const fmt = (n: number) => n.toLocaleString("en-US");
// the item this index held before any pick, and why another sits there now (null: it doesn't)
const first = computed(() => deck.value.items[pick.value.index]);
const why = computed(() => movedHere(deck.value, pick.value, splice.value));
// in the row after the pick, the items that moved: JAM's filler, or everything splice shifted
const moved = (i: number) => splice.value ? i >= pick.value.index : pick.value.filler !== null && i === pick.value.index;
</script>

<template>
  <div class="widget shuffle-steps">
    <div class="readout" aria-live="polite">
      <div class="tile"><span class="tile-label">pick</span><span class="tile-value">{{ Math.min(at + 1, all.length) }} of {{ all.length }}</span></div>
      <div class="tile wide"><span class="tile-label">number mod l = index</span><span class="tile-value">{{ fmt(pick.number) }} mod {{ pick.l }} = {{ pick.index }}</span></div>
      <div class="tile"><span class="tile-label">picked</span><span class="tile-value">{{ pick.picked }}</span></div>
      <div class="tile"><span class="tile-label">fills the gap</span><span class="tile-value">{{ splice ? "nothing: closed up" : pick.filler ?? "nothing: it was last" }}</span></div>
    </div>
    <p class="line">
      <template v-if="!done">Of the {{ pick.l }} left, take index {{ pick.index }}: {{ pick.picked }}. {{ splice ? "Then close the gap, shifting everything after it." : pick.filler ? `Then the last item, ${pick.filler}, fills the gap, and the last place is dropped.` : "It was the last item, so the last place is simply dropped." }}</template>
      <template v-else>Done: {{ result.join(", ") }}. <template v-if="splice"><span class="bug">Fair, but not JAM's:</span> JAM deals {{ jam.join(", ") }}. A shuffle every node must agree on agrees to the last detail.</template><template v-else>The same numbers deal the same hand on every node.</template></template>
    </p>
    <div class="controls">
      <button v-for="d in DECKS" :key="d.name" class="small" :class="{ chosen: deck === d }" :aria-pressed="deck === d" @click="choose(d)">{{ d.name }}</button>
    </div>
    <div class="controls">
      <button class="small" :disabled="at === 0" @click="at = 0">reset</button>
      <button class="small" :disabled="at === 0" @click="at--">◀ back</button>
      <button class="small go" :disabled="done" @click="at++">pick ▶</button>
      <button class="small" :class="{ chosen: splice }" :aria-pressed="splice" @click="splice = !splice; at = 0">{{ splice ? "closing the gap with splice" : "JAM: the last item fills the gap" }}</button>
    </div>

    <ol v-if="!done" class="stages">
      <li class="stage">
        <p class="stage-says"><strong>1 · Divide.</strong> The number by l, the items left. Keep the remainder.</p>
        <p class="sum">{{ fmt(pick.number) }} ÷ {{ pick.l }} = {{ fmt(pick.quotient) }}, remainder <span class="rem">{{ pick.index }}</span></p>
        <p class="sum check">check: {{ fmt(pick.quotient) }} × {{ pick.l }} + {{ pick.index }} = {{ fmt(pick.number) }}</p>
        <p class="why">{{ pick.quotient === 0 ? `${fmt(pick.number)} is smaller than ${pick.l}, so it's its own remainder.` : `The ${fmt(pick.quotient)} is thrown away: only the remainder counts.` }} Dividing by {{ pick.l }} leaves 0 to {{ pick.l - 1 }}, so the remainder is always one of the {{ pick.l }} indexes.</p>
      </li>
      <li class="stage">
        <p class="stage-says"><strong>2 · Pick.</strong> The remainder is an index, not an item: take what sits there.</p>
        <div class="row" aria-label="the items left, before this pick, with their indexes">
          <span v-for="(x, i) in pick.left" :key="i" class="slot"><span class="item" :class="{ picked: i === pick.index, filler: !splice && pick.filler !== null && i === pick.l - 1 }">{{ x }}</span><span class="idx">{{ i }}</span></span>
        </div>
        <p class="why">Index {{ pick.index }} holds {{ pick.picked }}<template v-if="why">, not {{ first }}: {{ why }}</template>. {{ pick.picked }} goes to the picks.</p>
      </li>
      <li class="stage">
        <p class="stage-says"><strong>3 · Fill the gap.</strong> {{ splice ? "Splice: close it up." : "The last item moves into it; the last place goes." }}</p>
        <div class="row" aria-label="the items left after this pick, with their indexes">
          <span v-for="(x, i) in pick.after" :key="i" class="slot"><span class="item" :class="{ filler: moved(i) }">{{ x }}</span><span class="idx">{{ i }}</span></span>
          <span v-if="pick.after.length === 0" class="muted">none</span>
        </div>
        <p class="why">
          <template v-if="pick.after.length === 0">Nothing left: this was the last pick.</template>
          <template v-else-if="splice">Everything after index {{ pick.index }} shifts one place left. </template>
          <template v-else-if="pick.filler">{{ pick.filler }} moves from index {{ pick.l - 1 }} to {{ pick.index }}; nothing else moves. </template>
          <template v-else>{{ pick.picked }} was the last item, so only the last place goes. </template>
          <template v-if="pick.after.length > 0">{{ pick.after.length }} left, so the next pick divides by {{ pick.after.length }}.</template>
        </p>
      </li>
    </ol>

    <p class="row-says">picks so far</p>
    <div class="row" aria-label="the picks so far">
      <span v-for="(x, i) in result.slice(0, at)" :key="i" class="item out">{{ x }}</span>
      <span v-if="at === 0" class="muted">none yet</span>
    </div>
  </div>
</template>

<style scoped>
.tile .tile-value { min-width: 5ch; }
.tile.wide .tile-value { font-size: 16px; min-width: 20ch; }
.bug { color: var(--changed-line); font-weight: 600; }
.line { margin: 8px 0; font-size: 14px; line-height: 1.6; min-height: 4.8em; }
.controls { display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 8px; }
.controls button.small { min-height: 32px; }
.go { border-color: var(--vp-c-brand-1); color: var(--vp-c-brand-1); font-weight: 600; }
.stages { list-style: none; margin: 12px 0 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.stage { margin: 0; padding: 10px 12px; border-radius: 6px; background: var(--vp-c-bg-soft); }
.stage p { margin: 0; }
.stage-says { font-size: 13px; line-height: 1.5; color: var(--vp-c-text-2); margin-bottom: 6px !important; }
.stage-says strong { color: var(--vp-c-text-1); }
.sum { font-family: var(--vp-font-family-mono); font-size: 14px; line-height: 1.7; overflow-wrap: anywhere; }
.sum.check { color: var(--vp-c-text-2); font-size: 13px; }
.rem { padding: 0 4px; border-radius: 4px; border: 2px solid var(--vp-c-brand-1); background: var(--vp-c-brand-soft); font-weight: 700; }
.why { font-size: 13px; line-height: 1.6; margin-top: 6px !important; min-height: 3.2em; }
.row-says { margin: 10px 0 4px; font-size: 12px; color: var(--vp-c-text-2); }
.row { display: flex; flex-wrap: wrap; gap: 4px; min-height: 36px; font-family: var(--vp-font-family-mono); font-size: 14px; }
.slot { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.idx { font-size: 11px; color: var(--vp-c-text-3); }
.item { min-width: 2.2em; padding: 6px 8px; text-align: center; border: 1px solid var(--vp-c-divider); border-radius: 4px; background: var(--vp-c-bg); }
.row > .item { background: var(--vp-c-bg-soft); }
.item.picked { border: 2px solid var(--vp-c-brand-1); background: var(--vp-c-brand-soft); font-weight: 700; }
/* the last item, about to move into the gap, and where it lands: amber, like anything that tells what happens next */
.item.filler { background: var(--bit-mark); border-color: var(--bit-mark-line); }
.item.out { background: var(--bit-low); border-color: var(--bit-low-line); }
.muted { color: var(--vp-c-text-3); font-size: 13px; align-self: center; }
</style>
