<!-- The PVM Playground: a debugger on the lessons' own PVM. Every number on it comes from the
     machine in pvm-playground.ts, stepped live in the browser: registers, gas, memory, the
     host's answers. Programs are text the reader can edit; the real service is the code
     service 0 keeps in the fallback trace. The Demo walks a five-minute script. -->
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef } from "vue";
import { withBase } from "vitepress";
import {
  assemble, AssemblyError, bootstrapRun, disassemble, exitWords, hex, hexRows, INSTRUCTIONS, PAGE_SIZE,
  regions, replay, Session, signedText,
} from "./pvm-playground.ts";
import type { Frame, Line, Run } from "./pvm-playground.ts";
import { around, BREAKS, DEMO, LAB, mended, REAL, SCENARIOS, WORKS } from "./pvm-scenarios.ts";

const NAMES = Array.from({ length: 13 }, (_, i) => i);
/** What Y uses a register for when a service starts; the rest are the program's own. */
const ROLES: Record<number, string> = { 0: "return", 1: "stack", 7: "args, answers", 8: "args length" };
const WINDOW = { before: 10, after: 16 };
const BUDGET = 4000; // instructions between repaints, while running

const chosen = ref(SCENARIOS[0].id);
const source = ref(SCENARIOS[0].source);
const problem = ref("");
const edited = ref(false);
const loading = ref(false);
const running = ref(false);
const demoOn = ref(false);
const demoAt = ref(0);
const notesOn = ref(true);
const instruction = ref("add_64");
const gasText = ref("1000");
const breakpoints = ref(new Set<number>());
const focus = ref<number | null>(null);
const columns = ref(16); // bytes in a row of the hex view: 8 on a phone
const addressText = ref("");
const root = ref<HTMLElement | null>(null);
let preimage: Uint8Array | null = null;
let stop = false;

const run = shallowRef<Run>(assemble(source.value));
const session = shallowRef(new Session(run.value));
const lines = shallowRef<Line[]>(disassemble(run.value.program, run.value.labels));
/** Bumped after the machine moves: the session changes in place, and Vue can't see inside it. */
const moved = ref(0);

const scenario = computed(() => SCENARIOS.find((s) => s.id === chosen.value)!);
const isReal = computed(() => chosen.value === REAL);
const view = computed(() => {
  void moved.value;
  const s = session.value;
  return { s, m: s.machine, last: s.last, n: s.n, stopped: s.stopped, gas: s.machine.gas, pc: s.machine.pc };
});
const last = computed<Frame | null>(() => view.value.last);
const exit = computed(() => exitWords(view.value.stopped ?? (last.value ? last.value.exit : null)));
const exitKind = computed(() => {
  const e = view.value.stopped;
  if (e === null) return "";
  return e === "halt" ? "good" : e === "oog" ? "warn" : "bad";
});

const indexOf = computed(() => new Map(lines.value.map((l, i) => [l.at, i])));
const shown = computed(() => {
  const all = lines.value;
  if (all.length <= WINDOW.before + WINDOW.after + 8) return all;
  const at = indexOf.value.get(view.value.pc) ?? 0;
  return all.slice(Math.max(0, at - WINDOW.before), at + WINDOW.after);
});
const nextLine = computed(() => lines.value[indexOf.value.get(view.value.pc) ?? -1]);
/** Where the machine is: the next instruction, or once stopped the one it stopped on. */
const at = computed(() => (view.value.stopped === null ? view.value.pc : (last.value?.at ?? view.value.pc)));
const explained = computed(() => lines.value[indexOf.value.get(at.value) ?? -1]);

const spent = computed(() => run.value.gas - view.value.gas);
const leftShare = computed(() => {
  if (run.value.gas === 0n) return 0;
  const share = Number((view.value.gas * 1000n) / run.value.gas) / 10;
  return Math.max(0, share);
});
const nextCost = computed(() => (view.value.stopped === null ? view.value.s.nextCost : null));
const recent = computed(() => view.value.s.blocks.slice(-6).reverse());
/** The gas spent, block by block, as a line: thinned to 200 points on a long run. */
const chart = computed(() => {
  const blocks = view.value.s.blocks;
  if (blocks.length === 0) return "";
  const every = Math.max(1, Math.ceil(blocks.length / 200));
  const points = blocks.filter((_, i) => i % every === 0 || i === blocks.length - 1);
  const most = Number(points.at(-1)!.spent) || 1;
  const [w, h] = [300, 56];
  const line = points.map((b, i) => {
    const x = points.length === 1 ? w : (i / (points.length - 1)) * w;
    return `${x.toFixed(1)},${(h - (Number(b.spent) / most) * (h - 4) - 2).toFixed(1)}`;
  });
  return line.join(" ");
});

const hostLog = computed(() => {
  void moved.value;
  return session.value.frames.filter((f) => f.hostAnswer).slice(-5).reverse();
});

const memoryMap = computed(() => {
  void moved.value;
  return regions(session.value.machine.memory);
});
const faultPage = computed(() => {
  const e = view.value.stopped;
  return typeof e === "object" && e !== null && "fault" in e ? e.fault : null;
});
const looking = computed(() => {
  if (focus.value !== null) return focus.value;
  if (faultPage.value !== null) return last.value?.touch?.address ?? faultPage.value;
  return last.value?.touch?.address ?? memoryMap.value[0]?.start ?? 0x20000;
});
const rows = computed(() => {
  void moved.value;
  return hexRows(session.value.machine.memory, looking.value, 8, columns.value);
});
const touched = computed(() => {
  const t = last.value?.touch;
  if (!t || faultPage.value !== null) return null;
  return { from: t.address, to: t.address + t.size, write: t.write };
});
const lit = (address: number) => {
  const t = touched.value;
  return t && address >= t.from && address < t.to ? (t.write ? "wrote" : "read") : "";
};
/** What Y put in a region of the real service's memory. */
const regionName = (r: { start: number; pages: number }) => {
  if (!isReal.value) return "";
  if (r.start === 0x10000) return "read-only data";
  if (r.start === 0x30000) return "data and heap";
  if (r.start === Number(run.value.registers[7])) return "arguments";
  return r.start + r.pages * PAGE_SIZE === Number(run.value.registers[1]) ? "stack" : "";
};
const pageOf = (address: number) => address - (address % PAGE_SIZE);
/** Under a program that broke: why, and what to change. Once it's changed, what happens now. */
const showFix = computed(() => {
  const e = view.value.stopped;
  return scenario.value.fix !== undefined && !edited.value && e !== null && e !== "halt";
});
const isMended = computed(() => scenario.value.fix !== undefined && edited.value && source.value === mended(scenario.value));

function restart(next: Run) {
  run.value = next;
  session.value = new Session(next);
  lines.value = disassemble(next.program, next.labels);
  gasText.value = `${next.gas}`;
  focus.value = null;
  moved.value++;
}

function withGas(r: Run): Run {
  const g = gasText.value.replaceAll(",", "").trim();
  return /^\d+$/.test(g) ? { ...r, gas: BigInt(g) } : r;
}

async function loadReal(): Promise<Run> {
  if (!preimage) {
    loading.value = true;
    const response = await fetch(withBase("/pvm/bootstrap-service.bin"));
    preimage = new Uint8Array(await response.arrayBuffer());
    loading.value = false;
  }
  return bootstrapRun(preimage, 1_000_000n);
}

async function choose(id: string) {
  halt();
  chosen.value = id;
  breakpoints.value = new Set();
  problem.value = "";
  edited.value = false;
  const s = SCENARIOS.find((c) => c.id === id)!;
  if (id === LAB) instruction.value = "add_64";
  source.value = s.source;
  restart(id === REAL ? await loadReal() : assemble(s.source));
}

function build() {
  halt();
  try {
    problem.value = "";
    edited.value = source.value !== scenario.value.source;
    restart(assemble(source.value));
    breakpoints.value = new Set();
  } catch (e) {
    if (e instanceof AssemblyError) problem.value = e.message;
    else throw e;
  }
}

function applyFix() {
  source.value = mended(scenario.value);
  build();
}

function setGas() {
  halt();
  const line = gasText.value;
  const next = withGas(run.value);
  restart(next);
  gasText.value = line;
}

function reset() {
  halt();
  restart(run.value);
}

function step() {
  focus.value = null;
  session.value.advance();
  moved.value++;
}

function back() {
  halt();
  const n = session.value.n;
  if (n === 0) return;
  focus.value = null;
  session.value = replay(run.value, n - 1);
  moved.value++;
}

function halt() {
  stop = true;
  running.value = false;
}

/** Steps until `done` says so, a breakpoint or a stop, repainting every so often. */
async function runUntil(done: (f: Frame) => boolean) {
  if (running.value || session.value.stopped !== null) return;
  stop = false;
  running.value = true;
  focus.value = null;
  const s = session.value;
  for (;;) {
    for (let k = 0; k < BUDGET; k++) {
      const f = s.advance();
      if (!f || s.stopped !== null || done(f) || breakpoints.value.has(s.machine.pc)) {
        running.value = false;
        moved.value++;
        return;
      }
    }
    moved.value++;
    await new Promise((resolve) => requestAnimationFrame(resolve));
    if (stop || s !== session.value) {
      running.value = false;
      moved.value++;
      return;
    }
  }
}

const nextBlock = () => runUntil(() => !session.value.machine.charged);
const nextHost = () => runUntil((f) => f.hostAnswer !== null);
const runAll = () => runUntil(() => false);

function toggleBreakpoint(at: number) {
  const next = new Set(breakpoints.value);
  if (!next.delete(at)) next.add(at);
  breakpoints.value = next;
}

function goTo() {
  const t = addressText.value.trim();
  if (/^(0x[0-9a-f]+|\d+)$/i.test(t)) focus.value = Number(t);
}

function onKey(e: KeyboardEvent) {
  const target = e.target as HTMLElement;
  if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || e.metaKey || e.ctrlKey || e.altKey) return;
  const keys: Record<string, () => void> = { s: step, ArrowRight: step, ArrowLeft: back, b: nextBlock, h: nextHost, r: runAll, x: reset };
  const action = keys[e.key];
  if (action) {
    e.preventDefault();
    e.stopPropagation(); // the site's arrow keys turn the page
    action();
  }
}

const step_ = computed(() => DEMO[demoAt.value]);

async function showDemo(i: number) {
  demoAt.value = Math.max(0, Math.min(DEMO.length - 1, i));
  const d = DEMO[demoAt.value];
  await choose(d.scenario);
  await nextTick();
  root.value?.scrollIntoView({ block: "start" });
}

function toggleDemo() {
  demoOn.value = !demoOn.value;
  notesOn.value = true;
  if (demoOn.value) showDemo(0);
}

function fullScreen() {
  if (document.fullscreenElement) document.exitFullscreen();
  else root.value?.requestFullscreen();
}

function pickInstruction() {
  source.value = around(instruction.value);
  build();
}

function fit() {
  columns.value = window.innerWidth < 560 ? 8 : 16;
}

onMounted(() => {
  fit();
  window.addEventListener("resize", fit);
});
onBeforeUnmount(() => {
  halt();
  window.removeEventListener("resize", fit);
});
</script>

<template>
  <div ref="root" class="widget playground" tabindex="0" @keydown="onKey">
    <div class="picker">
      <button class="small demo" :class="{ chosen: demoOn }" :aria-pressed="demoOn" @click="toggleDemo">▶ Demo</button>
      <p class="picker-head">Step through it: everything works</p>
      <div class="picker-row">
        <button v-for="c in WORKS" :key="c.id" class="small" :class="{ chosen: chosen === c.id }" :aria-pressed="chosen === c.id" @click="choose(c.id)">{{ c.title }}</button>
      </div>
      <p class="picker-head">Break it, then fix it: each one stops and says what to change</p>
      <div class="picker-row">
        <button v-for="c in BREAKS" :key="c.id" class="small" :class="{ chosen: chosen === c.id }" :aria-pressed="chosen === c.id" @click="choose(c.id)">{{ c.title }}</button>
      </div>
    </div>

    <section v-if="demoOn" class="presenter" aria-label="presenter notes">
      <div class="presenter-top">
        <strong>Demo {{ demoAt + 1 }} of {{ DEMO.length }}</strong>
        <span class="spacer" />
        <button class="small" :disabled="demoAt === 0" @click="showDemo(demoAt - 1)">◀ previous</button>
        <button class="small" :disabled="demoAt === DEMO.length - 1" @click="showDemo(demoAt + 1)">next ▶</button>
        <button class="small" :aria-pressed="!notesOn" @click="notesOn = !notesOn">{{ notesOn ? "hide notes" : "show notes" }}</button>
        <button class="small" title="the debugger alone, for a projector" @click="fullScreen">full screen</button>
      </div>
      <template v-if="notesOn">
        <p class="do">{{ step_.do }}</p>
        <p class="say">{{ step_.say }}</p>
      </template>
    </section>

    <section v-else class="brief">
      <p v-if="!isMended">{{ scenario.watch }}</p>
      <details v-if="scenario.tries.length">
        <summary>Try this</summary>
        <ul>
          <li v-for="t in scenario.tries" :key="t">{{ t }}</li>
        </ul>
      </details>
      <label v-if="chosen === LAB" class="lab">instruction
        <select v-model="instruction" aria-label="the instruction to try" @change="pickInstruction">
          <option v-for="name in INSTRUCTIONS" :key="name" :value="name">{{ name }}</option>
        </select>
      </label>
    </section>

    <div class="controls" role="toolbar" aria-label="run the machine">
      <button class="small" :disabled="view.n === 0" title="back one (←)" @click="back">◀ Back</button>
      <button class="small go" :disabled="view.stopped !== null || running" title="one instruction (s or →)" @click="step">Step ▶</button>
      <button class="small" :disabled="view.stopped !== null || running" title="to the next basic block (b)" @click="nextBlock">Next block</button>
      <button class="small" :disabled="view.stopped !== null || running" title="to the next host call (h)" @click="nextHost">Next host call</button>
      <button v-if="!running" class="small" :disabled="view.stopped !== null" title="to the end or a breakpoint (r)" @click="runAll">Run</button>
      <button v-else class="small" @click="halt">Stop</button>
      <button class="small" title="start again (x)" @click="reset">Reset</button>
      <label class="gas-input">gas <input v-model="gasText" inputmode="numeric" aria-label="starting gas" @change="setGas" /></label>
    </div>

    <div class="readout" aria-live="polite">
      <div class="tile"><span class="tile-label">instructions run</span><span class="tile-value">{{ view.n.toLocaleString("en") }}</span></div>
      <div class="tile"><span class="tile-label">{{ view.stopped === null ? "ı, next instruction" : "ı, stopped at" }}</span><span class="tile-value">{{ at.toLocaleString("en") }}</span></div>
      <div class="tile"><span class="tile-label">gas left</span><span class="tile-value">{{ view.gas.toLocaleString("en") }}</span></div>
      <div class="tile exit" :class="exitKind"><span class="tile-label">state</span><span class="tile-value">{{ exit.name }}</span></div>
      <div v-if="explained" class="tile about">
        <span class="tile-label">{{ view.stopped === null ? "next" : "stopped on" }}: <code>{{ explained.text }}</code></span>
        <span class="about-text">{{ explained.about }}</span>
      </div>
    </div>

    <p class="says" aria-live="polite">{{ last ? last.says : loading ? "Loading the service's code…" : "Nothing has run yet. Press Step." }}</p>
    <p v-if="view.stopped !== null" class="means" :class="exitKind">{{ exit.means }}</p>

    <section v-if="showFix" class="fix" aria-label="how to fix it">
      <p><strong>Why it stopped.</strong> {{ scenario.fix!.why }}</p>
      <p><strong>What to change.</strong> In the program, replace</p>
      <pre>{{ scenario.fix!.from }}</pre>
      <p>with</p>
      <pre>{{ scenario.fix!.to }}</pre>
      <button class="small go" @click="applyFix">Make this change</button>
    </section>
    <section v-else-if="isMended" class="fix mended" aria-label="fixed">
      <p><strong>{{ view.stopped === "halt" ? "Fixed." : "Changed. Press Run." }}</strong> {{ scenario.fix!.after }}</p>
      <button class="small" @click="choose(chosen)">Break it again</button>
    </section>

    <div class="panels">
      <section class="panel code" aria-label="the code">
        <h4>Code <small>{{ lines.length.toLocaleString("en") }} instructions. ▌ starts a basic block. Click a line for a breakpoint.</small></h4>
        <ol class="lines">
          <li v-for="l in shown" :key="l.at" :class="{ next: l.at === view.pc && view.stopped === null, ran: last?.at === l.at, stop: l.at === at && view.stopped !== null && view.stopped !== 'halt', broken: breakpoints.has(l.at) }">
            <div v-if="l.label" class="label">{{ l.label }}:</div>
            <button class="line" :aria-label="`instruction at ${l.at}: ${l.text}. Toggle breakpoint`" @click="toggleBreakpoint(l.at)">
              <span class="dot">{{ breakpoints.has(l.at) ? "●" : "" }}</span>
              <span class="block">{{ l.block ? "▌" : "" }}</span>
              <span class="at">{{ l.at }}</span>
              <span class="text">{{ l.text }}</span>
              <span class="raw">{{ l.bytes.map((b) => b.toString(16).padStart(2, "0")).join(" ") }}</span>
            </button>
          </li>
        </ol>
        <p v-if="nextLine && view.stopped === null" class="row-cost">Next: {{ nextLine.text.split(" ")[0] }} takes {{ nextLine.cost.cycles }} cycle{{ nextLine.cost.cycles === 1 ? "" : "s" }} and {{ nextLine.cost.slots }} decode slot{{ nextLine.cost.slots === 1 ? "" : "s" }} in the gas model.</p>
      </section>

      <section class="panel registers" aria-label="the registers">
        <h4>Registers φ <small>r0 to r12 in code. Blue was read, green was written.</small></h4>
        <div class="reg-grid">
          <div v-for="r in NAMES" :key="r" class="reg" :class="{ read: last?.reads.includes(r), wrote: last?.writes.includes(r) }">
            <span class="reg-name">φ{{ r }}</span>
            <span class="reg-role">{{ isReal || r === 0 ? ROLES[r] : "" }}</span>
            <span class="reg-dec">{{ signedText(view.m.registers[r]) }}</span>
            <span class="reg-hex">{{ hex(view.m.registers[r]) }}</span>
          </div>
        </div>
      </section>

      <section class="panel gas" aria-label="the gas">
        <h4>Gas <small>Each basic block is paid for in full on the way in.</small></h4>
        <div class="gas-bar" role="img" :aria-label="`${leftShare} percent of the gas left`"><span :style="{ width: `${leftShare}%` }" /></div>
        <dl class="gas-numbers">
          <div><dt>started with</dt><dd>{{ run.gas.toLocaleString("en") }}</dd></div>
          <div><dt>spent</dt><dd>{{ spent.toLocaleString("en") }}</dd></div>
          <div><dt>next block costs</dt><dd>{{ view.stopped !== null ? "—" : nextCost === null ? "paid" : nextCost.toLocaleString("en") }}</dd></div>
        </dl>
        <svg v-if="view.s.blocks.length > 1" class="gas-chart" viewBox="0 0 300 56" preserveAspectRatio="none" role="img" aria-label="gas spent, block by block">
          <polyline :points="chart" vector-effect="non-scaling-stroke" />
        </svg>
        <div class="paid">
          <div class="paid-head">{{ view.s.blocks.length.toLocaleString("en") }} block{{ view.s.blocks.length === 1 ? "" : "s" }} paid for<template v-if="recent.length">, newest first</template></div>
          <div v-for="(b, i) in recent" :key="`${view.s.blocks.length}-${i}`" class="paid-row">
            <span>at {{ b.at }}</span><span>{{ b.cost.toLocaleString("en") }}</span>
          </div>
        </div>
        <div v-if="hostLog.length" class="host-log">
          <div class="paid-head">Host calls</div>
          <div v-for="f in hostLog" :key="f.n" class="paid-row"><span>{{ f.hostAnswer }}</span></div>
        </div>
      </section>

      <section class="panel memory" aria-label="the memory">
        <h4>Memory <small>Pages of 4,096 bytes. Everything else isn't there.</small></h4>
        <ul class="regions">
          <li v-if="memoryMap.length === 0" class="none">No pages at all.</li>
          <li v-for="r in memoryMap.slice(0, 8)" :key="r.start">
            <button class="region" :class="{ here: pageOf(looking) >= r.start && pageOf(looking) < r.start + r.pages * PAGE_SIZE }" @click="focus = r.start">
              <span class="access" :class="r.access">{{ r.access === "W" ? "read, write" : "read only" }}</span>
              <span>{{ hex(r.start) }}</span>
              <span class="pages">{{ r.pages.toLocaleString("en") }} page{{ r.pages === 1 ? "" : "s" }}<template v-if="regionName(r)">, {{ regionName(r) }}</template></span>
            </button>
          </li>
          <li v-if="faultPage !== null" class="faulted"><span class="access none-access">fault</span> {{ hex(faultPage) }}</li>
        </ul>
        <div class="goto">
          <label>go to <input v-model="addressText" placeholder="0x20000" aria-label="go to address" @keydown.enter="goTo" /></label>
          <button class="small" @click="goTo">Show</button>
        </div>
        <table class="hex">
          <tbody>
            <tr v-for="row in rows" :key="row.address" :class="{ missing: !row.bytes }">
              <th>{{ row.address.toString(16).padStart(8, "0") }}</th>
              <template v-if="row.bytes">
                <td v-for="(b, k) in row.bytes" :key="k" :class="lit(row.address + k)">{{ b.toString(16).padStart(2, "0") }}</td>
              </template>
              <td v-else :colspan="columns" class="nothing">no page here</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>

    <details v-if="!isReal" class="editor" :open="chosen === LAB">
      <summary>Edit this program</summary>
      <textarea v-model="source" rows="14" spellcheck="false" aria-label="the program's text" />
      <div class="controls">
        <button class="small go" @click="build">Assemble and reset</button>
        <button v-if="source !== scenario.source" class="small" @click="source = scenario.source; build()">Back to the original</button>
        <span v-if="edited" class="note">Running your version.</span>
      </div>
      <p v-if="problem" class="problem" role="alert">{{ problem }}</p>
      <p class="help">
        Registers are r0 to r12; a <code>;</code> starts a comment; <code>label:</code> names the next instruction; <code>halt</code> is <code>jump_ind r0, 0</code>.
        Set things up with <code>.gas 1000</code>, <code>.reg r7 = 3</code>, <code>.page 0x20000 W</code> (or R, and a count), <code>.data 0x20000 ef be</code> and <code>.jump_table one, two</code>.
        Three-register sums read <code>add_64 rD, rA, rB</code>.
      </p>
      <details>
        <summary>All {{ INSTRUCTIONS.length }} instructions</summary>
        <p class="names">{{ INSTRUCTIONS.join(" ") }}</p>
      </details>
    </details>

    <p class="keys">Keys: <kbd>s</kbd> step, <kbd>←</kbd> back, <kbd>b</kbd> next block, <kbd>h</kbd> next host call, <kbd>r</kbd> run, <kbd>x</kbd> reset.</p>
  </div>
</template>

<style scoped>
.playground { outline: none; font-size: 14px; scroll-margin-top: 80px; }
.playground:fullscreen { overflow: auto; padding: 16px; background: var(--vp-c-bg); }
.lab { display: inline-flex; align-items: center; gap: 8px; margin-top: 8px; font-size: 13px; color: var(--vp-c-text-2); }
.lab select {
  padding: 4px 6px; border: 1px solid var(--vp-c-brand-1); border-radius: 4px; background: var(--vp-c-bg);
  font-family: var(--vp-font-family-mono); font-size: 13px; color: var(--vp-c-text-1);
}
.playground:focus-visible { outline: 2px solid var(--vp-c-brand-1); outline-offset: 2px; }
.picker { margin-bottom: 12px; }
.picker-row { display: flex; flex-wrap: wrap; gap: 6px; }
.picker-head { margin: 10px 0 4px; font-size: 13px; font-weight: 600; color: var(--vp-c-text-2); }
.picker .demo { font-weight: 600; }
.picker .small, .presenter .small { min-height: 34px; }
.brief { margin-bottom: 12px; line-height: 1.55; }
.brief p { margin: 0 0 6px; }
.brief ul { margin: 6px 0 0; padding-left: 20px; }
.presenter { margin-bottom: 12px; padding: 10px 12px; border: 2px solid var(--bit-mark-line); border-radius: 6px; background: var(--bit-mark); }
.presenter-top { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.spacer { flex: 1; }
.presenter .do { font-weight: 600; margin: 8px 0 4px; }
.presenter .say { margin: 0; line-height: 1.55; font-size: 15px; }
.controls { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-bottom: 8px; }
.controls .small { min-height: 34px; }
.controls button:disabled { opacity: 0.45; cursor: default; }
.controls .go { font-weight: 600; border-color: var(--vp-c-brand-1); }
.gas-input { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--vp-c-text-2); }
.gas-input input, .goto input {
  width: 11ch; padding: 4px 6px; border: 1px solid var(--vp-c-divider); border-radius: 4px; background: var(--vp-c-bg);
  font-family: var(--vp-font-family-mono); font-size: 13px; color: var(--vp-c-text-1);
}
.tile.exit.good { border-color: var(--bit-low-line); background: var(--bit-low); }
.tile.exit.bad { border-color: var(--changed-line); background: var(--changed); }
.tile.exit.warn { border-color: var(--bit-mark-line); background: var(--bit-mark); }
.tile.about { flex: 1 1 260px; min-width: 0; }
.tile.about code { padding: 0; background: none; font-size: 12px; color: var(--vp-c-text-1); overflow-wrap: anywhere; }
.about-text { display: block; margin-top: 2px; font-size: 14px; line-height: 1.4; }
.says { margin: 0 0 4px; padding: 8px 10px; min-height: 2.6em; border-left: 3px solid var(--vp-c-brand-1); background: var(--vp-c-bg-soft); font-family: var(--vp-font-family-mono); font-size: 14px; line-height: 1.5; overflow-wrap: anywhere; }
.means { margin: 0 0 8px; padding: 6px 10px; font-size: 13px; line-height: 1.5; border-left: 3px solid var(--vp-c-divider); }
.means.good { border-left-color: var(--bit-low-line); }
.means.bad { border-left-color: var(--changed-line); }
.means.warn { border-left-color: var(--bit-mark-line); }
.fix { margin: 0 0 8px; padding: 8px 10px; border-left: 3px solid var(--changed-line); background: var(--vp-c-bg-soft); font-size: 14px; line-height: 1.5; }
.fix.mended { border-left-color: var(--bit-low-line); }
.fix p { margin: 0 0 6px; }
.fix pre { margin: 0 0 6px; padding: 4px 8px; border-radius: 4px; background: var(--vp-c-bg); font-family: var(--vp-font-family-mono); font-size: 13px; white-space: pre-wrap; overflow-wrap: anywhere; }
.panels { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 8px; }
.panel { min-width: 0; padding: 8px 10px; border: 1px solid var(--vp-c-divider); border-radius: 6px; }
.panel h4 { margin: 0 0 6px; font-size: 14px; font-weight: 600; letter-spacing: 0; }
.panel h4 small { display: block; margin-top: 1px; font-weight: 400; font-size: 12px; color: var(--vp-c-text-2); }
.lines { list-style: none; margin: 0; padding: 0; max-height: 440px; overflow-y: auto; font-family: var(--vp-font-family-mono); font-size: 13px; }
.lines li { margin: 0; }
.label { padding: 2px 0 0 4ch; color: var(--vp-c-brand-1); }
.line {
  display: grid; grid-template-columns: 1.4ch 1.4ch 6ch minmax(0, 1fr) auto; gap: 4px; width: 100%; padding: 1px 4px; text-align: left;
  border-radius: 3px; font: inherit; color: inherit; cursor: pointer;
}
.line:hover { background: var(--vp-c-bg-soft); }
.dot { color: var(--changed-line); }
.block { color: var(--bit-mark-line); }
.at { color: var(--vp-c-text-3); text-align: right; }
.text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.raw { color: var(--vp-c-text-3); font-size: 11px; white-space: nowrap; overflow: hidden; max-width: 14ch; }
li.ran .line { background: var(--vp-c-bg-soft); }
li.next .line { background: var(--bit-top); box-shadow: inset 2px 0 0 var(--bit-top-line); }
li.stop .line { background: var(--changed); box-shadow: inset 2px 0 0 var(--changed-line); }
.row-cost { margin: 6px 0 0; font-size: 12px; color: var(--vp-c-text-2); }
.reg-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 1px; }
.reg { display: grid; grid-template-columns: 3.5ch 11ch minmax(0, 1fr) minmax(0, 1fr); gap: 6px; align-items: baseline; padding: 1px 4px; border-radius: 3px; font-family: var(--vp-font-family-mono); font-size: 13px; }
.reg-name { color: var(--vp-c-text-2); }
.reg-role { font-family: var(--vp-font-family-base); font-size: 11px; color: var(--vp-c-text-3); white-space: nowrap; }
.reg-dec { text-align: right; font-weight: 600; overflow-wrap: anywhere; }
.reg-hex { text-align: right; color: var(--vp-c-text-2); font-size: 12px; overflow-wrap: anywhere; }
.reg.read { background: var(--bit-top); box-shadow: inset 2px 0 0 var(--bit-top-line); }
.reg.wrote { background: var(--bit-low); box-shadow: inset 2px 0 0 var(--bit-low-line); }
.gas-bar { height: 10px; border-radius: 5px; background: var(--vp-c-bg-soft); overflow: hidden; border: 1px solid var(--vp-c-divider); }
.gas-bar span { display: block; height: 100%; background: var(--bit-low-line); transition: width 0.15s ease; }
.gas-numbers { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; margin: 8px 0; }
.gas-numbers dt { font-size: 11px; color: var(--vp-c-text-2); }
.gas-numbers dd { margin: 0; font-family: var(--vp-font-family-mono); font-weight: 600; overflow-wrap: anywhere; }
.gas-chart { display: block; width: 100%; height: 56px; margin-bottom: 6px; }
.gas-chart polyline { fill: none; stroke: var(--bit-mark-line); stroke-width: 2; }
.paid, .host-log { font-family: var(--vp-font-family-mono); font-size: 12px; }
.host-log { margin-top: 8px; }
.paid-head { font-family: var(--vp-font-family-base); color: var(--vp-c-text-2); margin-bottom: 2px; }
.paid-row { display: flex; justify-content: space-between; gap: 8px; overflow-wrap: anywhere; }
.regions { list-style: none; margin: 0 0 8px; padding: 0; font-family: var(--vp-font-family-mono); font-size: 12px; }
.regions li { margin: 0; }
.region { display: flex; gap: 8px; width: 100%; padding: 2px 4px; border-radius: 3px; font: inherit; color: inherit; text-align: left; cursor: pointer; flex-wrap: wrap; }
.region:hover, .region.here { background: var(--vp-c-bg-soft); }
.access { padding: 0 4px; border-radius: 3px; font-family: var(--vp-font-family-base); font-size: 11px; }
.access.W { background: var(--bit-low); }
.access.R { background: var(--bit-top); }
.none-access { background: var(--changed); }
.faulted { padding: 2px 4px; }
.pages { color: var(--vp-c-text-2); }
.goto { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; font-size: 13px; color: var(--vp-c-text-2); }
.hex { display: table; width: 100%; margin: 0; border-collapse: collapse; font-family: var(--vp-font-family-mono); font-size: 10.5px; table-layout: fixed; }
.hex tr, .hex th, .hex td { border: none; background: none; padding: 0; }
.hex th { width: 9ch; font-weight: 400; text-align: left; color: var(--vp-c-text-3); }
.hex td { text-align: center; }
.hex td.read { background: var(--bit-top); font-weight: 700; }
.hex td.wrote { background: var(--bit-low); font-weight: 700; }
.hex .nothing { text-align: left; padding-left: 4px; color: var(--vp-c-text-3); font-style: italic; }
.editor { margin-top: 12px; }
.editor textarea {
  display: block; width: 100%; margin: 8px 0; padding: 8px; border: 1px solid var(--vp-c-divider); border-radius: 4px; background: var(--vp-c-bg-soft);
  font-family: var(--vp-font-family-mono); font-size: 13px; line-height: 1.5; color: var(--vp-c-text-1); resize: vertical;
}
.problem { margin: 4px 0; padding: 6px 10px; border-left: 3px solid var(--changed-line); background: var(--changed); font-family: var(--vp-font-family-mono); font-size: 13px; }
.note { font-size: 13px; color: var(--vp-c-text-2); }
.help { font-size: 13px; line-height: 1.6; color: var(--vp-c-text-2); }
.names { font-family: var(--vp-font-family-mono); font-size: 12px; line-height: 1.6; overflow-wrap: anywhere; }
.keys { margin: 10px 0 0; font-size: 12px; color: var(--vp-c-text-2); }
kbd { padding: 0 4px; border: 1px solid var(--vp-c-divider); border-radius: 3px; font-family: var(--vp-font-family-mono); font-size: 11px; }
@media (max-width: 760px) {
  .panels { grid-template-columns: minmax(0, 1fr); }
  .raw { display: none; }
  .line { grid-template-columns: 1.4ch 1.4ch 5ch minmax(0, 1fr); }
  .widget.playground { padding: 10px; }
  .line, .region { min-height: 32px; align-items: center; }
  .hex { font-size: 12px; }
  .reg { grid-template-columns: 3.5ch minmax(0, 1fr) minmax(0, 1fr); }
  .reg-role { display: none; }
}
</style>
