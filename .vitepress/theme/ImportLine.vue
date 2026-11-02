<!-- Lesson 0.6: one block's import, end to end, in our client. The block steps down the
     stations, bytes in to state root out, and through Υ's steps one call at a time. Pick a
     wrong block and it stops where it is refused, the state left as it was. The stations, steps
     and values are import-line.ts's. -->
<script setup lang="ts">
import { computed, ref } from "vue";
import { BAD_BLOCKS, STATIONS, STEPS, TRACE, refusedAt, seen } from "./import-line.ts";

const GOALS = [
  { id: "valid", say: "send the real block all the way to its StateRoot" },
  { id: "early", say: "pick a block that's refused before Υ even starts" },
  { id: "inside", say: "pick a block that's refused inside Υ, and see which step refuses it" },
];

/** Every place the block can be, in order: each station, with Υ opened into its steps. */
const PATH: { station: string; step?: string }[] = STATIONS.flatMap((s) =>
  s.id === "steps" ? STEPS.map((p) => ({ station: s.id, step: p.call })) : [{ station: s.id }]);

const choice = ref("valid"); // "valid", or a BAD_BLOCKS id
const at = ref(0);
const reached = ref(new Set<string>());
const mark = (id: string, when: boolean) => { if (when) reached.value = new Set([...reached.value, id]); };

const bad = computed(() => BAD_BLOCKS.find((b) => b.id === choice.value) ?? null);
/** Where this block stops: its refusal's place, or the end of the line. */
const stop = computed(() => {
  if (!bad.value) return PATH.length - 1;
  const r = refusedAt(bad.value.error);
  return PATH.findIndex((p) => p.station === r.station && (r.step === undefined || p.step === r.step));
});
const here = computed(() => PATH[at.value]);
const refused = computed(() => bad.value !== null && at.value === stop.value);
const stationIndex = (id: string) => STATIONS.findIndex((s) => s.id === id);
const hereStation = computed(() => stationIndex(here.value.station));

function state(id: string): "done" | "here" | "refused" | "skipped" | "ahead" {
  const i = stationIndex(id);
  if (i === hereStation.value) return refused.value ? "refused" : "here";
  if (i < hereStation.value) return "done";
  return at.value === stop.value && bad.value ? "skipped" : "ahead";
}
function stepState(call: string): "done" | "here" | "refused" | "ahead" {
  const i = PATH.findIndex((p) => p.step === call);
  if (i === at.value) return refused.value ? "refused" : "here";
  return i < at.value ? "done" : "ahead";
}

function pick(id: string) {
  choice.value = id;
  at.value = 0;
}
function next() {
  at.value = Math.min(at.value + 1, stop.value);
  if (at.value !== stop.value) return;
  if (!bad.value) mark("valid", true);
  else if (refusedAt(bad.value.error).station === "steps") mark("inside", true);
  else mark("early", true);
}
const back = () => { at.value = Math.max(at.value - 1, 0); };
const finished = computed(() => at.value === stop.value);
const href = (lesson: string) => `../${lesson}`;
</script>

<template>
  <div class="widget import-line">
    <div class="controls" role="group" aria-label="which block">
      <button class="small" :class="{ chosen: choice === 'valid' }" @click="pick('valid')">
        a real block: the safrole trace's first
      </button>
      <button v-for="b in BAD_BLOCKS" :key="b.id" class="small" :class="{ chosen: choice === b.id }" @click="pick(b.id)">
        a block that {{ b.say }}
      </button>
    </div>
    <div class="controls">
      <button class="small" :disabled="at === 0" @click="back">◀ back</button>
      <button class="small primary" :disabled="finished" @click="next">next ▶</button>
      <button class="small" @click="at = 0">start over</button>
    </div>

    <p class="answer" aria-live="polite" :class="{ error: refused, ok: finished && !bad }">
      <template v-if="refused">
        Refused: <code>{{ bad!.error }}</code>. The answer is an Error, and the state before stays as it was.
      </template>
      <template v-else-if="finished">Imported. The answer: StateRoot {{ TRACE.root }}…</template>
      <template v-else>The block is at station {{ hereStation + 1 }} of {{ STATIONS.length }}.</template>
    </p>

    <ol class="line">
      <li v-for="(s, i) in STATIONS" :key="s.id" class="station" :class="state(s.id)">
        <div class="head">
          <span class="n">{{ i + 1 }}</span>
          <span class="title">{{ s.title }}</span>
          <span class="gp">{{ s.gp }}</span>
        </div>
        <p class="does">{{ s.does }}</p>
        <p class="code">
          <a :href="href(s.ours.lesson)"><code>{{ s.ours.file }}</code></a>
          <code v-for="f in s.ours.fns" :key="f" class="fn">{{ f }}</code>
          <code v-if="s.ours.run" class="run">npm run {{ s.ours.run }}</code>
        </p>
        <p v-if="s.refuses.length" class="refuses">
          refuses: <code v-for="e in s.refuses" :key="e" :class="{ hit: refused && bad!.error === e }">{{ e }}</code>
        </p>
        <ol v-if="s.id === 'steps'" class="steps">
          <li v-for="p in STEPS" :key="p.call" :class="stepState(p.call)">
            <span class="call"><a :href="href(p.lesson)"><code>{{ p.call }}</code></a></span>
            <span class="gp">{{ p.gp }}</span>
            <span class="what">{{ p.does }}</span>
            <span v-if="p.refuses.length" class="refuses">
              refuses: <code v-for="e in p.refuses" :key="e" :class="{ hit: refused && bad!.error === e }">{{ e }}</code>
            </span>
          </li>
        </ol>
        <p v-if="state(s.id) === 'here' && !bad" class="seen">this block: {{ seen(s.id) }}</p>
      </li>
    </ol>

    <ul class="goals">
      <li v-for="g in GOALS" :key="g.id" :class="{ done: reached.has(g.id) }">{{ reached.has(g.id) ? "✓" : "○" }} {{ g.say }}</li>
    </ul>
  </div>
</template>

<style scoped>
.controls { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
.controls button { min-height: 32px; }
.controls button.primary { font-weight: 600; }
.answer { font-size: 14px; margin: 4px 0 10px; padding: 6px 10px; border-radius: 6px; border: 1px solid var(--vp-c-divider); }
.answer.error { border-color: var(--vp-c-danger-1); background: var(--vp-c-danger-soft); }
.answer.ok { border-color: var(--bit-low-line); background: var(--bit-low); }
.line { list-style: none; padding: 0; margin: 0; }
.station { position: relative; padding: 8px 10px 8px 14px; margin: 0 0 6px; border: 1px solid var(--vp-c-divider); border-left-width: 4px; border-radius: 6px; }
.station + .station::before { content: ""; position: absolute; left: 22px; top: -7px; height: 6px; border-left: 2px solid var(--vp-c-divider); }
.station.done { border-left-color: var(--bit-low-line); }
.station.here { border-color: var(--vp-c-brand-1); background: var(--vp-c-brand-soft); }
.station.refused { border-color: var(--vp-c-danger-1); background: var(--vp-c-danger-soft); }
.station.skipped { opacity: 0.4; }
.head { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
.n { font-family: var(--vp-font-family-mono); font-weight: 700; min-width: 2ch; }
.title { font-weight: 600; }
.gp { font-size: 12px; color: var(--vp-c-text-2); font-family: var(--vp-font-family-mono); }
.does { font-size: 14px; margin: 2px 0; line-height: 1.45; }
.code, .refuses { font-size: 13px; margin: 2px 0; display: flex; gap: 6px; flex-wrap: wrap; align-items: baseline; }
.refuses { color: var(--vp-c-text-2); }
code.hit { background: var(--vp-c-danger-1); color: var(--vp-c-white); }
.seen { font-size: 13px; margin: 4px 0 0; font-family: var(--vp-font-family-mono); color: var(--vp-c-text-1); }
.steps { list-style: none; padding: 0; margin: 6px 0 0; border-left: 2px solid var(--vp-c-divider); }
.steps li { display: flex; flex-wrap: wrap; gap: 4px 8px; align-items: baseline; padding: 3px 0 3px 10px; font-size: 13px; }
.steps li.done .call code { border-color: var(--bit-low-line); }
.steps li.here { background: var(--vp-c-brand-soft); }
.steps li.refused { background: var(--vp-c-danger-soft); }
.steps .what { color: var(--vp-c-text-2); }
.goals { list-style: none; padding: 0; margin: 12px 0 0; font-size: 14px; color: var(--vp-c-text-2); }
.goals li.done { color: var(--vp-c-green-1); }
</style>
