<!-- Lesson 10.1: a verdict's votes and what they decide. On tiny, tap each of the 6 judges'
     votes; on full, set the counts. A verdict carries exactly ⌊2V/3⌋ + 1 votes, and is good
     when all say valid, bad when none do, wonky when ⌊V/3⌋ do. Anything else is refused. -->
<script setup lang="ts">
import { computed, ref } from "vue";
import { AFTERMATH, count, judge, votesNeeded, votesOf, wonkyCount } from "./verdict.ts";
import type { Judged, Vote } from "./verdict.ts";

const SIZES = [{ judges: 6, name: "tiny" }, { judges: 1023, name: "full" }];
const GOALS: { id: string; say: string; when: (j: Judged) => boolean }[] = [
  { id: "bad", say: "make the report bad", when: (j) => j === "bad" },
  { id: "wonky", say: "make it wonky", when: (j) => j === "wonky" },
  { id: "split", say: "make a split the chain refuses", when: (j) => j === "bad_vote_split" },
  { id: "count", say: "give the verdict a vote too many, or too few", when: (j) => j === "bad_votes_count" },
];
const CHOICES: { vote: Vote; say: string }[] = [{ vote: "valid", say: "valid" }, { vote: "invalid", say: "invalid" }, { vote: null, say: "no vote" }];

// the lesson's first test: 5 valid votes out of 5, on tiny
const start = (v: number) => votesOf(v, votesNeeded(v), 0);
const judges = ref(6);
const votes = ref<Vote[]>(start(6));
const reached = ref(new Set<string>());

const counted = computed(() => count(votes.value));
const judged = computed(() => judge(counted.value.valid, counted.value.votes, judges.value));
const needed = computed(() => votesNeeded(judges.value));
const wonky = computed(() => wonkyCount(judges.value));
const refused = computed(() => judged.value === "bad_votes_count" || judged.value === "bad_vote_split");
const invalid = computed(() => counted.value.votes - counted.value.valid);
const overThird = computed(() => 3 * invalid.value > judges.value);
const after = computed(() => AFTERMATH[judged.value as keyof typeof AFTERMATH]);

function size(v: number) {
  judges.value = v;
  votes.value = start(v);
}
// a goal counts when the reader's own change brings it about, never on switching size
function change(next: Vote[]) {
  votes.value = next;
  const now = judged.value;
  reached.value = new Set([...reached.value, ...GOALS.filter((g) => g.when(now)).map((g) => g.id)]);
}
const vote = (i: number, v: Vote) => change(votes.value.map((old, j) => (j === i ? v : old)));
// full: the counts, not 1,023 rows. Valid votes come first, then invalid, then the rest.
const clamp = (x: number, most: number) => Math.min(most, Math.max(0, x));
function setCounts(total: number, valid: number) {
  const t = clamp(total, judges.value);
  const v = clamp(valid, t);
  change(votesOf(judges.value, v, t - v));
}
</script>

<template>
  <div class="widget verdict-votes">
    <div class="readout" aria-live="polite">
      <div class="tile" :class="{ off: counted.votes !== needed }">
        <span class="tile-label">votes</span><span class="tile-value">{{ counted.votes }}</span>
      </div>
      <div class="tile"><span class="tile-label">valid</span><span class="tile-value">{{ counted.valid }}</span></div>
      <div class="tile verdict" :class="{ off: refused, [judged]: !refused }">
        <span class="tile-label">verdict</span><span class="tile-value">{{ refused ? "refused" : judged }}</span>
      </div>
    </div>
    <p class="range">
      {{ judges.toLocaleString("en") }} judges. A verdict carries exactly ⌊2·{{ judges }}/3⌋ + 1 = {{ needed }} of their
      votes. Count the ones that say "valid": all {{ needed }} is good, 0 is bad, ⌊{{ judges }}/3⌋ = {{ wonky }} is wonky.
      Any other count, or any other number of votes, and the chain refuses the block.
    </p>
    <div class="controls">
      <button v-for="s in SIZES" :key="s.judges" class="small" :class="{ chosen: s.judges === judges }" @click="size(s.judges)">
        {{ s.judges.toLocaleString("en") }} judges ({{ s.name }})
      </button>
    </div>
    <template v-if="judges <= 12">
      <div v-for="(v, i) in votes" :key="i" class="row" role="group" :aria-label="`judge ${i}`">
        <span class="who">judge {{ i }}</span>
        <button v-for="c in CHOICES" :key="c.say" class="small choice" :class="[c.say.replace(' ', '-'), { chosen: v === c.vote }]"
          :aria-pressed="v === c.vote" @click="vote(i, c.vote)">{{ c.say }}</button>
      </div>
    </template>
    <template v-else>
      <div class="row">
        <span class="who">votes</span>
        <button class="small step" aria-label="one vote fewer" @click="setCounts(counted.votes - 1, counted.valid)">−1</button>
        <span class="number">{{ counted.votes }}</span>
        <button class="small step" aria-label="one vote more" @click="setCounts(counted.votes + 1, counted.valid)">+1</button>
      </div>
      <div class="row">
        <label class="who" for="valid-votes">valid</label>
        <button class="small step" aria-label="one valid vote fewer" @click="setCounts(counted.votes, counted.valid - 1)">−1</button>
        <span class="number">{{ counted.valid }}</span>
        <button class="small step" aria-label="one valid vote more" @click="setCounts(counted.votes, counted.valid + 1)">+1</button>
      </div>
      <input id="valid-votes" class="slider" type="range" min="0" :max="counted.votes" :value="counted.valid"
        @input="setCounts(counted.votes, Number(($event.target as HTMLInputElement).value))">
    </template>
    <p class="line">
      <template v-if="judged === 'bad_votes_count'">
        {{ counted.votes }} votes, not {{ needed }}: refused, <code>bad_votes_count</code>
        (<a href="./04-bad-verdicts">lesson 10.4</a>).
      </template>
      <template v-else-if="judged === 'bad_vote_split'">
        {{ counted.valid }} valid is not {{ needed }}, 0 or {{ wonky }}: refused, <code>bad_vote_split</code>
        (<a href="./04-bad-verdicts">lesson 10.4</a>).
      </template>
      <template v-else-if="judged === 'good'">{{ counted.valid }} valid = ⌊2·{{ judges }}/3⌋ + 1: <b>good</b>.</template>
      <template v-else-if="judged === 'bad'">0 valid: <b>bad</b>.</template>
      <template v-else>{{ counted.valid }} valid = ⌊{{ judges }}/3⌋: <b>wonky</b>, nobody can tell.</template>
    </p>
    <div class="split" aria-hidden="true">
      <div class="bar">
        <span class="seg invalid" :style="{ flexGrow: invalid }"></span>
        <span class="seg valid" :style="{ flexGrow: counted.valid }"></span>
        <span class="seg none" :style="{ flexGrow: judges - counted.votes }"></span>
        <span class="third"></span>
      </div>
      <div class="scale"><span>0</span><span class="third-label">⅓ of the judges</span><span>all {{ judges.toLocaleString("en") }}</span></div>
    </div>
    <p v-if="refused" class="follows">The whole block is invalid, so nothing it says happens.</p>
    <template v-else>
      <p class="follows">
        <template v-if="overThird">
          {{ invalid.toLocaleString("en") }} of {{ judges.toLocaleString("en") }} say invalid: more than a third. Even if
          every judge left out said valid, that's {{ (judges - invalid).toLocaleString("en") }}, short of the
          {{ needed }} good needs, so this report can never be proven good.
        </template>
        <template v-else>Nobody says invalid: a supermajority swears it's right.</template>
      </p>
      <dl class="after">
        <dt>the report (<a href="./03-clearing-the-cores">10.3</a>)</dt><dd>joins ψ's {{ judged }} set, {{ after.report }}</dd>
        <dt>a chain that already accumulated it</dt><dd>{{ after.chain }}</dd>
        <dt>punished (<a href="./02-culprits-and-faults">10.2</a>)</dt><dd>{{ after.punished }}</dd>
      </dl>
    </template>
    <ul class="goals">
      <li v-for="g in GOALS" :key="g.id" :class="{ done: reached.has(g.id) }">{{ reached.has(g.id) ? "✓" : "○" }} <UnitText :text="g.say" /></li>
    </ul>
  </div>
</template>

<style scoped>
.range { font-size: 14px; color: var(--vp-c-text-2); margin: 0 0 12px; line-height: 1.5; }
.controls { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
.controls button, .row button { min-height: 32px; }
.tile.verdict .tile-value { min-width: 7ch; }
.tile.good { border-color: var(--bit-low-line); background: var(--bit-low); }
.tile.bad { border-color: var(--vp-c-danger-1); background: var(--vp-c-danger-soft); }
.tile.off { border-style: dashed; border-color: var(--vp-c-danger-1); }
.tile.off .tile-value { color: var(--vp-c-danger-1); }
.tile.wonky { border-color: var(--bit-mark-line); background: var(--bit-mark); }
.row { display: flex; align-items: center; gap: 6px; margin: 4px 0; flex-wrap: wrap; }
.who { font-size: 13px; color: var(--vp-c-text-2); white-space: nowrap; font-family: var(--vp-font-family-mono); min-width: 7ch; }
.choice.valid.chosen { background: var(--bit-low); border-color: var(--bit-low-line); color: inherit; }
.choice.invalid.chosen { background: var(--vp-c-danger-soft); border-color: var(--vp-c-danger-1); color: inherit; }
.number { font-family: var(--vp-font-family-mono); font-size: 18px; font-weight: 600; min-width: 4ch; text-align: center; }
.slider { width: 100%; max-width: 100%; min-height: 32px; }
.line { font-family: var(--vp-font-family-mono); font-size: 14px; margin: 8px 0 4px; }
.follows { font-size: 14px; margin: 4px 0; line-height: 1.5; }
.split { margin: 10px 0 4px; }
.bar { position: relative; display: flex; height: 18px; border: 1px solid var(--vp-c-divider); border-radius: 4px; overflow: hidden; }
.seg { flex: 0 0 0; }
.seg.invalid { background: var(--vp-c-danger-1); opacity: 0.55; }
.seg.valid { background: var(--bit-low); }
.seg.none { background: var(--vp-c-default-soft); }
.third { position: absolute; top: -2px; bottom: -2px; left: 33.333%; border-left: 2px dashed var(--vp-c-text-1); }
.scale { position: relative; display: flex; justify-content: space-between; font-size: 12px; color: var(--vp-c-text-2); }
.third-label { position: absolute; left: 33.333%; transform: translateX(-50%); white-space: nowrap; }
.after { display: grid; grid-template-columns: max-content 1fr; gap: 2px 12px; font-size: 14px; margin: 8px 0 4px; }
.after dt { color: var(--vp-c-text-2); }
.after dd { margin: 0; font-weight: 600; }
.goals { list-style: none; padding: 0; margin: 12px 0 0; font-size: 14px; color: var(--vp-c-text-2); }
.goals li.done { color: var(--vp-c-green-1); }
@media (max-width: 640px) {
  .row { gap: 4px; }
  .who { min-width: 0; }
  .choice { padding: 2px 6px; }
  .after { grid-template-columns: 1fr; }
  .after dd { margin-bottom: 4px; }
}
</style>
