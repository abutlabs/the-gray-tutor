<!-- Lesson 0.6: a block import as a Gantt chart. Each family has a colour and a summary bar over its
     steps; a line runs from every step to the steps that wait for it; each header value is a
     diamond under the step that settles it. Step through the waves to see what is known when. A
     bar's length is never time. Layout and lines are computed in import-gantt.ts. -->
<script setup lang="ts">
import { computed, h, ref } from "vue";
import { builtIn, stepAt, symbolParts } from "./import-waves.ts";
import {
  COLUMNS, CRITICAL, HEADER_VALUES, HUES, LAST_WAVE, PAD, describe, doneBy, isCritical, layoutRows, markerX,
  routes, rowName, slackOf, spanOf, waveOf,
} from "./import-gantt.ts";
import type { HeaderValue, Row } from "./import-gantt.ts";

const GOALS = [
  { id: "wait", say: "tap a step with slack: it could wait a wave or more and nothing would be late" },
  { id: "chain", say: "tap accumulation, the step four others are waiting for" },
  { id: "end", say: "step to the end, where the new state's root is finally known" },
];

/** A symbol as the Gray Paper writes it: β_H is β with a subscript H. */
const Sym = (props: { x: string }) => {
  const p = symbolParts(props.x);
  return h("span", { class: "sym" }, [p.base, p.sub ? h("sub", p.sub) : null, p.mark]);
};

const COLS = COLUMNS.length;
const CHECKS = HEADER_VALUES.filter((v) => v.role === "checked").length;
const { rows, height } = layoutRows();
const centre = (r: Row) => r.y + r.h / 2;
const rowOf = new Map<string, Row>();
for (const r of rows) rowOf.set(r.kind === "mark" ? r.id : (r.key ?? r.id), r);
const hueOf = (r: Row) => (r.kind === "mark" ? 0 : HUES[r.lane.id]);

const at = ref(0);
const selected = ref<string | null>(null);
const picked = ref<HeaderValue | null>(null);
const reached = ref(new Set<string>());
const mark = (id: string, when: boolean) => { if (when) reached.value = new Set([...reached.value, id]); };

const now = computed(() => doneBy(at.value));
const known = computed(() => new Set(now.value.values.map((v) => v.id)));
const detail = computed(() => (selected.value ? describe(selected.value) : null));
const where = computed(() => (at.value === 0 ? "the start" : at.value > LAST_WAVE ? "the end" : `wave ${at.value}`));

function go(to: number) {
  at.value = Math.min(Math.max(to, 0), LAST_WAVE + 1);
  mark("end", at.value === LAST_WAVE + 1);
}
function tap(key: string) {
  selected.value = key;
  picked.value = null;
  mark("wait", slackOf(key) > 0);
  mark("chain", key === "ω′");
}
function tapMark(v: HeaderValue) {
  picked.value = v;
  selected.value = null;
}
const state = (key: string) => {
  const w = waveOf(key);
  return w <= at.value ? "done" : w === at.value + 1 ? "next" : "later";
};

/** A line between two rows, as a path in columns across and pixels down: out of the end of a bar,
 *  along to its own lane in the gap before the next wave, down or up it, and in to the next bar
 *  (or onto a diamond). import-gantt.ts gives each line its lane, so no two run along each other. */
const lines = routes((id) => centre(rowOf.get(id)!)).map(({ from, to, x1, xv, x2 }) => {
  const [y1, y2] = [centre(rowOf.get(from)!), centre(rowOf.get(to)!)];
  const d = x2 === xv ? `M${x1} ${y1}H${xv}V${y2}` : `M${x1} ${y1}H${xv}V${y2}H${x2}`;
  return { from, to, d, hue: hueOf(rowOf.get(from)!) };
});
const lineClass = (l: { from: string; to: string }) => ({
  out: selected.value === l.from,
  in: selected.value === l.to,
  dim: selected.value !== null && selected.value !== l.from && selected.value !== l.to,
});
const label = (key: string) => {
  const d = describe(key);
  return `${d.name}, wave ${d.wave}, ${d.slack ? `can wait ${d.slack} more` : "cannot wait"}`;
};
const names = (keys: string[]) => keys.map((k) => describe(k).name).join(", ");
const pct = (x: number) => `calc(${x} * 100% / ${COLS})`;
</script>

<template>
  <div class="widget import-gantt">
    <div class="readout" aria-live="polite">
      <div class="tile"><span class="tile-label">after</span><span class="tile-value">{{ where }}</span></div>
      <div class="tile"><span class="tile-label">steps done</span><span class="tile-value">{{ now.steps.length }} of 16</span></div>
      <div class="tile"><span class="tile-label">header checks passed</span><span class="tile-value">{{ now.checks.length }} of {{ CHECKS }}</span></div>
    </div>
    <p class="range">
      Each colour is a family of test vectors, with a summary bar over its steps, and a line runs from a step
      to every step that waits for it. A bar starts in the first wave its step can run; the dashed tail is
      how long it could wait. The columns are waves, and a bar's length is <b>not time</b>. The whole header
      arrives with the block. The shapes say what the importer does with each part: it
      <b>reads</b> it (<span class="shape given"></span>), it <b>works out the real value itself and refuses
      the block if the header differs</b> (<span class="shape checked"></span>), or it <b>makes</b> it
      (<span class="shape made"></span>).
    </p>

    <div class="controls">
      <button :disabled="at === 0" @click="go(at - 1)">◀ back</button>
      <button :disabled="at === LAST_WAVE + 1" @click="go(at + 1)">next wave ▶</button>
      <button :disabled="at === 0" @click="go(0)">reset</button>
    </div>

    <div class="chart" role="group" aria-label="the block import as a Gantt chart">
      <div class="axis">
        <span class="who"></span>
        <span class="top start" :class="{ now: at === 0 }">start</span>
        <span class="top waves"><span class="long">wave</span></span>
        <span class="top end" :class="{ now: at === LAST_WAVE + 1 }">end</span>
        <span v-for="w in LAST_WAVE" :key="w" class="num" :class="{ now: at === w }" :style="{ gridColumn: w + 2 }">{{ w }}</span>
      </div>

      <div class="body" :style="{ height: `${height}px` }">
        <span
          v-for="r in rows" :key="`rule-${r.id}`" class="rule" :class="r.kind"
          :style="{ top: `${r.y}px`, height: `${r.h}px` }" aria-hidden="true"
        ></span>
        <div class="labels">
          <div
            v-for="r in rows" :key="r.id" class="lab" :class="[r.kind, { chosen: r.kind !== 'mark' && r.kind !== 'group' && selected === r.key }]"
            :style="{ top: `${r.y}px`, height: `${r.h}px` }"
          >
            <template v-if="r.kind === 'mark'">
              <b>{{ r.value.title }} <span class="shape" :class="r.value.role"></span></b>
              <small>{{ r.value.detail }}</small>
            </template>
            <template v-else-if="r.kind === 'group'"><b>{{ r.lane.title }}</b> <small>{{ r.lane.about }}</small></template>
            <template v-else-if="r.kind === 'solo'">
              <b>{{ r.lane.title }}</b>
              <small>{{ r.lane.about }}</small>
            </template>
            <template v-else>{{ rowName(r.key!) }} <small><Sym :x="r.key!" /></small><span v-if="isCritical(r.key!)" class="crit"> ◆</span></template>
          </div>
        </div>

        <div class="plot">
          <span v-for="(c, i) in COLUMNS" :key="c" class="band" :class="{ now: i === at }" :style="{ left: pct(i), width: pct(1) }"></span>

          <svg class="lines" :viewBox="`0 0 ${COLS} ${height}`" preserveAspectRatio="none" aria-hidden="true">
            <path
              v-for="l in lines" :key="`${l.from}>${l.to}`" :d="l.d" class="line" :class="lineClass(l)"
              :style="{ '--h': l.hue }" vector-effect="non-scaling-stroke"
            />
          </svg>

          <template v-for="r in rows" :key="r.id">
            <span
              v-if="r.kind === 'group'" class="summary" :style="{
                '--h': hueOf(r), top: `${centre(r) - 8}px`,
                left: pct(spanOf(r.lane)[0] + PAD), width: pct(spanOf(r.lane)[1] - spanOf(r.lane)[0] - 2 * PAD),
              }"
            ></span>
            <template v-if="r.kind === 'solo' || r.kind === 'step'">
              <span
                v-if="slackOf(r.key!) > 0" class="ghost" aria-hidden="true"
                :style="{ '--h': hueOf(r), top: `${centre(r) - 5}px`, left: pct(waveOf(r.key!) + 1 - PAD), width: pct(slackOf(r.key!)) }"
              ></span>
              <button
                class="bar" :class="[state(r.key!), { critical: isCritical(r.key!), chosen: selected === r.key }]"
                :style="{ '--h': hueOf(r), top: `${centre(r) - 12}px`, left: pct(waveOf(r.key!)), width: pct(1) }"
                :aria-pressed="selected === r.key" :aria-label="label(r.key!)" @click="tap(r.key!)"
              ><i></i></button>
            </template>
            <button
              v-if="r.kind === 'mark'" class="shape mark-btn" :class="[r.value.role, { lit: known.has(r.value.id), chosen: picked?.id === r.value.id }]"
              :style="{ top: `${centre(r)}px`, left: pct(markerX(r.value)) }"
              :aria-label="`${r.value.label}: ${r.value.says}`" @click="tapMark(r.value)"
            ></button>
          </template>
        </div>
      </div>
    </div>

    <div class="legend">
      <p>
        <span class="key"><i class="sw summary-sw"></i> a family</span>
        <span class="key"><i class="sw pill-sw"></i> a step</span>
        <span class="key"><i class="sw thick-sw"></i> ◆ can't wait</span>
        <span class="key"><i class="sw ghost-sw"></i> could wait this long</span>
        <span class="key"><i class="sw line-sw"></i> waits for</span>
      </p>
      <p>
        <span class="key"><span class="shape given lit"></span> given: read as an input</span>
        <span class="key"><span class="shape checked lit"></span> checked: the header must match (filled once checked)</span>
        <span class="key"><span class="shape made lit"></span> made by the import</span>
      </p>
    </div>

    <div class="detail" aria-live="polite">
      <template v-if="picked">
        <p><b>{{ picked.label }}</b></p>
        <p>{{ picked.role === "given" ? "Read as an input" : picked.role === "checked" ? "The header states it, the importer works it out" : "Made by the import" }}: {{ picked.says }}.</p>
      </template>
      <template v-else-if="!detail">Tap a bar or a shape. Then step the waves, and watch the header's values appear.</template>
      <template v-else>
        <p>
          <b>{{ detail.name }}</b> (<Sym :x="selected!" />) is checked by the <b>{{ detail.lane.id === "clock" ? "block-import traces" : detail.lane.id }}</b>
          vectors, and answered by <code>{{ detail.lane.file }}</code>. It runs in wave {{ detail.wave }}.
        </p>
        <p v-if="detail.waitsFor.length">It waits for {{ names(detail.waitsFor) }}.</p>
        <p v-else>It needs only the block and the state before it, so it can start the moment the block arrives.</p>
        <p v-if="detail.feeds.length">Waiting for it: {{ names(detail.feeds) }}.</p>
        <p v-else>Nothing in this block waits for it: its result goes straight into the state after the block.</p>
        <p v-if="detail.slack">It could wait {{ detail.slack }} {{ detail.slack === 1 ? "wave" : "waves" }} and nothing would be late.</p>
        <p v-else>It can't wait: the import ends a wave later if this one does.</p>
        <p>
          Built in
          <template v-for="(b, j) in builtIn(stepAt(selected!)!)" :key="b.href">{{ j ? " and " : "" }}<a :href="b.href">{{ b.label }}</a></template>.
        </p>
      </template>
    </div>

    <ul class="goals">
      <li v-for="g in GOALS" :key="g.id" :class="{ done: reached.has(g.id) }">{{ reached.has(g.id) ? "✓" : "○" }} {{ g.say }}</li>
    </ul>
    <p class="muted fine">Critical path: {{ CRITICAL.map((k) => describe(k).name).join(" → ") }}.</p>
  </div>
</template>

<style scoped>
.range { font-size: 14px; color: var(--vp-c-text-2); margin: 0 0 8px; line-height: 1.5; }
.controls { display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 10px; }
.controls button {
  min-height: 36px; padding: 0 12px; border: 1px solid var(--vp-c-divider); border-radius: 6px;
  background: var(--vp-c-bg-soft); color: var(--vp-c-text-1); cursor: pointer;
}
.controls button:disabled { opacity: 0.45; cursor: default; }

.chart { --label: 232px; border: 1px solid var(--vp-c-divider); border-radius: 10px; overflow: hidden; background: var(--vp-c-bg); }
.axis { display: grid; grid-template-columns: var(--label) repeat(6, minmax(0, 1fr)); border-bottom: 1px solid var(--vp-c-divider); }
.axis > * { font-size: 12px; text-align: center; color: var(--vp-c-text-2); padding: 5px 0; }
.axis .top { grid-row: 1; font-weight: 600; color: var(--vp-c-text-1); }
.axis .start { grid-column: 2; }
.axis .waves { grid-column: 3 / span 4; border-left: 1px solid var(--vp-c-divider); border-right: 1px solid var(--vp-c-divider); }
.axis .end { grid-column: 7; }
.axis .num { grid-row: 2; padding-top: 2px; }
.axis .now { background: var(--bit-mark); }

.body { position: relative; }
.labels { position: absolute; left: 0; top: 0; width: var(--label); }
.lab {
  position: absolute; left: 0; right: 0; display: flex; flex-direction: column; flex-wrap: nowrap; align-items: flex-end;
  justify-content: center; padding: 0 10px 0 6px; text-align: right; font-size: 13px; line-height: 1.2;
  color: var(--vp-c-text-1); overflow: hidden;
}
.lab.group, .lab.solo { flex-direction: row; flex-wrap: nowrap; align-items: center; justify-content: flex-end; gap: 6px; }
.lab.group b, .lab.solo b { font-size: 14px; white-space: nowrap; }
.lab.group small, .lab.solo small { font-size: 12px; color: var(--vp-c-text-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lab.step { flex-direction: row; justify-content: flex-end; align-items: center; gap: 5px; flex-wrap: nowrap; white-space: nowrap; }
.lab.chosen { font-weight: 600; color: var(--vp-c-brand-1); }
.rule { position: absolute; left: 0; right: 0; pointer-events: none; }
.rule.group, .rule.solo { border-top: 1px solid var(--vp-c-divider); }
.rule.step { border-top: 1px dotted color-mix(in srgb, var(--vp-c-divider) 55%, transparent); }
.rule.mark { background: color-mix(in srgb, var(--vp-c-default-soft) 55%, transparent); }
.lab.step small { font-size: 11px; color: var(--vp-c-text-2); }
.lab.mark { gap: 1px; font-size: 12px; }
.lab.mark b { font-weight: 600; white-space: nowrap; }
.lab.mark small { font-size: 11px; line-height: 1.15; color: var(--vp-c-text-2); }
.lab .crit { color: var(--vp-c-brand-1); }
.import-gantt :deep(.sym) { font-family: var(--vp-font-family-mono); white-space: nowrap; }
.import-gantt :deep(.sym sub) { font-size: 9px; }

.plot {
  position: absolute; left: var(--label); right: 0; top: 0; bottom: 0; border-left: 1px solid var(--vp-c-divider);
  background-image: linear-gradient(to right, var(--vp-c-divider) 1px, transparent 1px);
  background-size: calc(100% / 6) 100%;
}
.band { position: absolute; top: 0; bottom: 0; }
.band.now { background: var(--bit-mark); opacity: 0.4; }
.lines { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
.line { fill: none; stroke: hsl(var(--h) 55% 58%); stroke-width: 1.5px; opacity: 0.55; stroke-linejoin: round; }
.line.out, .line.in { stroke-width: 2.5px; opacity: 1; }
.line.dim { opacity: 0.12; }

.summary { position: absolute; height: 16px; border-radius: 999px; background: hsl(var(--h) 58% 46%); }
.ghost {
  position: absolute; height: 10px; border-radius: 999px; box-sizing: border-box;
  background: hsl(var(--h) 60% 58% / 0.18); border: 1px dashed hsl(var(--h) 60% 58% / 0.7);
}
.bar { position: absolute; height: 24px; padding: 0; border: 0; background: transparent; cursor: pointer; }
.bar i {
  position: absolute; left: 12%; right: 12%; top: 50%; height: 10px; transform: translateY(-50%); border-radius: 999px;
  background: hsl(var(--h) 72% 66%); transition: opacity 0.15s;
}
.bar.critical i { height: 14px; background: hsl(var(--h) 70% 60%); box-shadow: 0 0 0 2px var(--vp-c-bg), 0 0 0 3.5px hsl(var(--h) 60% 45%); }
.bar.later i { opacity: 0.35; }
.bar.chosen i { box-shadow: 0 0 0 2px var(--vp-c-bg), 0 0 0 4px var(--vp-c-brand-1); }
.shape { display: inline-block; width: 11px; height: 11px; box-sizing: border-box; vertical-align: -1px; border: 2px solid var(--vp-c-text-3); background: var(--vp-c-bg); }
.shape.given { border-radius: 50%; }
.shape.checked { transform: rotate(45deg); border-radius: 2px; margin: 0 1px; }
.shape.made { border-radius: 2px; }
.shape.given.lit { background: var(--vp-c-text-2); border-color: var(--vp-c-text-2); }
.shape.checked.lit { background: var(--vp-c-green-1); border-color: var(--vp-c-green-1); }
.shape.made.lit { background: var(--vp-c-brand-1); border-color: var(--vp-c-brand-1); }
.mark-btn { position: absolute; width: 14px; height: 14px; padding: 0; cursor: pointer; }
.mark-btn.given { transform: translate(-50%, -50%); }
.mark-btn.checked { transform: translate(-50%, -50%) rotate(45deg); }
.mark-btn.made { transform: translate(-50%, -50%); }
.mark-btn.chosen { outline: 2px solid var(--vp-c-brand-1); outline-offset: 2px; }
.legend { font-size: 12px; color: var(--vp-c-text-2); margin: 10px 0 0; }
.legend p { display: flex; flex-wrap: wrap; gap: 4px 14px; align-items: center; margin: 0 0 4px; }
.key { display: inline-flex; align-items: center; gap: 5px; }
.sw { display: inline-block; width: 22px; }
.summary-sw { height: 12px; border-radius: 999px; background: hsl(215 58% 46%); }
.pill-sw { height: 8px; border-radius: 999px; background: hsl(215 72% 66%); }
.thick-sw { height: 12px; border-radius: 999px; background: hsl(215 70% 60%); box-shadow: 0 0 0 1.5px var(--vp-c-bg), 0 0 0 2.5px hsl(215 60% 45%); }
.ghost-sw { height: 8px; border-radius: 999px; border: 1px dashed hsl(215 60% 58% / 0.7); background: hsl(215 60% 58% / 0.18); box-sizing: border-box; }
.line-sw { height: 0; border-top: 2px solid hsl(215 55% 58%); }
.detail {
  margin: 12px 0 0; padding: 8px 12px; border-left: 3px solid var(--bit-mark-line); background: var(--bit-mark);
  font-size: 14px; line-height: 1.5; min-height: 6em;
}
.detail p { margin: 0 0 4px; }
.goals { list-style: none; padding: 0; margin: 12px 0 0; font-size: 14px; color: var(--vp-c-text-2); }
.goals li.done { color: var(--vp-c-green-1); }
.fine { font-size: 12px; margin: 8px 0 0; }
@media (max-width: 640px) {
  .widget.import-gantt { padding: 12px; }
  .chart { --label: 118px; }
  .lab { font-size: 11.5px; padding: 0 6px 0 4px; }
  .lab.group small, .lab.solo small { display: none; }
  .lab.step { white-space: normal; flex-wrap: wrap; line-height: 1.1; font-size: 11px; }
  .lab.group b, .lab.solo b { font-size: 12.5px; }
  .axis .long { display: none; }
  .axis .top, .axis .num { font-size: 10.5px; }
}
</style>
