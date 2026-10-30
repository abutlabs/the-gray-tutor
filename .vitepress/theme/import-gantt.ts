// Lesson 0.6's widget: a block import as a timeline. Every row is one line of the Gray Paper's
// dependency graph (§4.2), the same STEPS lesson 19.1 builds, placed in its wave; the rows are
// grouped under the test-vector family that checks them. A bar starts in its step's wave and
// the ghost after it is its slack: how many waves it could wait without delaying anything. A
// bar's length is never time, only how far the graph lets it move. The header's values are
// placed where a client can first know them. tools/widget-import-gantt.test.ts checks all of
// it against the graph, the lesson's family table and the reference client.

import { LAST_WAVE, STEPS, dependentsOf, inputsOf, keyOf, makerOf, stepAt, stepName, waveOf } from "./import-waves.ts";
import type { Step } from "./import-waves.ts";

/** A lane: the vector family that checks its steps, and the file of the client that answers it. */
export type Lane = { id: string; title: string; about: string; file: string; keys: string[] };

/** The lanes, in the order of lesson 0.5's table of families. `clock` has no family of its own:
 *  the time is checked inside the block-import traces (lesson 4.6). Each key is the first value
 *  its step makes. */
export const LANES: Lane[] = [
  { id: "clock", title: "The clock", about: "what time it is", file: "src/time.ts", keys: ["τ′"] },
  { id: "safrole", title: "Safrole", about: "who may author", file: "src/safrole.ts", keys: ["η′", "κ′", "λ′", "γ′"] },
  { id: "history", title: "History", about: "recent blocks", file: "src/history.ts", keys: ["β_H†", "β_H′"] },
  { id: "disputes", title: "Disputes", about: "judging reports", file: "src/disputes.ts", keys: ["ψ′", "ρ†"] },
  { id: "assurances", title: "Assurances", about: "what is available", file: "src/assurances.ts", keys: ["ρ‡", "𝐑*"] },
  { id: "reports", title: "Reports", about: "accepting work", file: "src/guarantors.ts", keys: ["ρ′"] },
  { id: "authorizations", title: "Authorizations", about: "who may submit", file: "src/authorization.ts", keys: ["α′"] },
  { id: "preimages", title: "Preimages", about: "data by hash", file: "src/services.ts", keys: ["δ′"] },
  { id: "accumulate", title: "Accumulate", about: "run the work", file: "src/accumulate.ts", keys: ["ω′"] },
  { id: "statistics", title: "Statistics", about: "who did what", file: "src/statistics.ts", keys: ["π′"] },
];

/** The lane of a step, by its key. */
export const laneOf = (key: string): Lane => LANES.find((l) => l.keys.includes(key))!;

/** The last wave a step can start in without delaying any step that needs it: the last wave
 *  for a step nothing waits for, else one before the earliest latest start of those that do. */
export function latestOf(key: string): number {
  const waiting = dependentsOf(key);
  return waiting.length === 0 ? LAST_WAVE : Math.min(...waiting.map(latestOf)) - 1;
}

/** Waves a step can wait; 0 means the whole import waits for it. */
export const slackOf = (key: string): number => latestOf(key) - waveOf(key);
export const isCritical = (key: string): boolean => slackOf(key) === 0;

/** The steps that can't wait, in wave order: the chain the import's length is made of. */
export const CRITICAL: string[] = STEPS.map((s) => s.makes[0]).filter(isCritical)
  .sort((a, b) => waveOf(a) - waveOf(b));

/** What the importer does with a value of the block. `given`: the block supplies it and the steps read
 *  it as an input. `checked`: the header states it, the importer works out the real one itself and
 *  refuses the block on a mismatch. `made`: the import makes it, and this block doesn't carry it. */
export type Role = "given" | "checked" | "made";

/** A value of the block or its import, and the earliest wave it is known. */
export type HeaderValue = {
  id: string; role: Role; title: string; detail: string; label: string; says: string; wave: number; after: string | null;
};

/** Everything that comes with the block (given), what its header must match (checked), and what the
 *  import makes for the next block (made). A checked value is placed after the step that works it
 *  out: `after` is that step's key. The ones that need only the old state or the block are at the
 *  start (wave 0), and the new state's root is made by every step, so it waits for all. The checks
 *  are the reference importer's: checkHeader's four, the three marks, and the seal. */
const RAW: Omit<HeaderValue, "label">[] = [
  {
    id: "given-header",
    role: "given",
    title: "Given by the block",
    detail: "slot, entropy source, author index",
    says: "the header's own numbers and signature, read as inputs: the slot becomes the new time, the entropy source feeds the new entropy, and the author index picks the author's key",
    wave: 0,
    after: null,
  },
  {
    id: "given-extrinsic",
    role: "given",
    title: "Given by the block",
    detail: "tickets, disputes, preimages, assurances, guarantees",
    says: "the block's five lists, each read as an input by the steps that use it",
    wave: 0,
    after: null,
  },
  {
    id: "start",
    role: "checked",
    title: "Header must match",
    detail: "parent, prior state root, slot, extrinsic hash",
    says: "the header states each, and the importer works out the real one from the old state and the extrinsic (the newest block's hash, the old state's root, that the slot is after the old time, the extrinsic's hash) and refuses the block if they differ, before any step runs",
    wave: 0,
    after: null,
  },
  {
    id: "offenders",
    role: "checked",
    title: "Header must match",
    detail: "offenders mark",
    says: "the header lists the convicted keys, and the importer works them out from the disputes alone, so it can check as soon as the disputes are judged",
    wave: waveOf("ψ′"),
    after: "ψ′",
  },
  {
    id: "marks",
    role: "checked",
    title: "Header must match",
    detail: "epoch mark, tickets mark",
    says: "the header carries both, and Safrole's step works out what they must be, with the new entropy and validators it needs",
    wave: waveOf("γ′"),
    after: "γ′",
  },
  {
    id: "seal",
    role: "checked",
    title: "Header must match",
    detail: "the author's seal",
    says: "the author's signature on the header, checked against the sealers and entropy that Safrole's step leaves",
    wave: waveOf("γ′"),
    after: "γ′",
  },
  {
    id: "root",
    role: "made",
    title: "Made by the import",
    detail: "the new state's root",
    says: "every step has made its part, so only now; this block's header doesn't carry it, the next block's header does, as its prior state root",
    wave: LAST_WAVE + 1,
    after: null,
  },
];
export const HEADER_VALUES: HeaderValue[] = RAW.map((v) => ({ ...v, label: `${v.title}: ${v.detail}` }));

/** The columns of the timeline: the start, each wave, and the end. */
export const COLUMNS: string[] = ["start", ...Array.from({ length: LAST_WAVE }, (_, i) => String(i + 1)), "end"];

/** What the importer has when the first `at` waves are done (0: only the block and old state). */
export function doneBy(at: number): { steps: string[]; values: HeaderValue[]; checks: HeaderValue[]; running: string[] } {
  const keys = STEPS.map((s) => s.makes[0]);
  return {
    steps: keys.filter((k) => waveOf(k) <= at),
    running: keys.filter((k) => waveOf(k) === at + 1),
    values: HEADER_VALUES.filter((v) => v.wave <= at),
    checks: HEADER_VALUES.filter((v) => v.role === "checked" && v.wave <= at),
  };
}

/** A step's name as a row label: the plain name, shortened where it wouldn't fit beside its symbol. */
const SHORT: Record<string, string> = { "β_H†": "last root filled in", "𝐑*": "ready to accumulate" };
export const rowName = (key: string): string => SHORT[key] ?? stepName(stepAt(key)!);

/** The step behind a key, its name in plain words, and how many it waits for and feeds. */
export function describe(key: string): {
  step: Step; name: string; lane: Lane; wave: number; slack: number;
  waitsFor: string[]; feeds: string[];
} {
  const step = stepAt(key)!;
  return {
    step,
    name: stepName(step),
    lane: laneOf(key),
    wave: waveOf(key),
    slack: slackOf(key),
    waitsFor: inputsOf(key).filter((k) => makerOf(k)),
    feeds: dependentsOf(key),
  };
}

/** One hue (degrees) for each lane, so a family keeps its colour from its summary bar to its steps. */
export const HUES: Record<string, number> = {
  clock: 215, safrole: 268, history: 195, disputes: 8, assurances: 32, reports: 135,
  authorizations: 168, preimages: 322, accumulate: 47, statistics: 88,
};

/** Row heights in pixels: a family's summary row, a step, a header value, a lane of one step. */
export const HEIGHTS = { group: 32, step: 28, mark: 46, solo: 40, edge: 8 } as const;

/** A row of the chart, top to bottom. A step is its key; a header value is `mark:` and its id. */
export type Row =
  | { kind: "solo" | "group" | "step"; id: string; y: number; h: number; lane: Lane; key?: string }
  | { kind: "mark"; id: string; y: number; h: number; value: HeaderValue };

/** The values that sit under a step (the rest are the rows at the top and the last). */
const under = (key: string): HeaderValue[] => HEADER_VALUES.filter((v) => v.after === key);

/** Every row of the chart: what the block gives and its first checks, each lane (a lane of one step is a single
 *  row; a longer one a summary row, then its steps), with each header check right under the step
 *  that settles it, and the new state's root last. */
export function layoutRows(): { rows: Row[]; height: number } {
  const rows: Row[] = [];
  let y = HEIGHTS.edge;
  const put = (row: Row) => { rows.push(row); y += row.h; };
  const markRow = (v: HeaderValue): Row => ({ kind: "mark", id: `mark:${v.id}`, y, h: HEIGHTS.mark, value: v });
  const value = (id: string) => HEADER_VALUES.find((v) => v.id === id)!;
  for (const v of HEADER_VALUES.filter((v) => v.after === null && v.wave === 0)) put(markRow(v));
  for (const lane of LANES) {
    const solo = lane.keys.length === 1 && under(lane.keys[0]).length === 0;
    if (solo) {
      put({ kind: "solo", id: lane.id, y, h: HEIGHTS.solo, lane, key: lane.keys[0] });
      continue;
    }
    put({ kind: "group", id: lane.id, y, h: HEIGHTS.group, lane });
    for (const key of lane.keys) {
      put({ kind: "step", id: key, y, h: HEIGHTS.step, lane, key });
      for (const v of under(key)) put(markRow(v));
    }
  }
  put(markRow(value("root")));
  return { rows, height: y + HEIGHTS.edge };
}

/** Where a header value's diamond sits across the six columns (start, waves 1 to 4, end): at the
 *  right edge of the wave that settles it, or in the middle of the start or end column. */
export const markerX = (v: HeaderValue): number => (v.after ? waveOf(v.after) + 1 : v.wave === 0 ? 0.5 : LAST_WAVE + 1.5);

/** The lines drawn between rows: a step to each step that waits for it, a step to each header
 *  value it settles, and the last wave's steps to the new state's root. Each is a row id pair. */
export function edges(): { from: string; to: string }[] {
  const out: { from: string; to: string }[] = [];
  for (const step of STEPS) {
    const key = step.makes[0];
    for (const d of dependentsOf(key)) out.push({ from: key, to: d });
  }
  for (const v of HEADER_VALUES) if (v.after) out.push({ from: v.after, to: `mark:${v.id}` });
  for (const step of STEPS) if (waveOf(step.makes[0]) === LAST_WAVE) out.push({ from: step.makes[0], to: "mark:root" });
  return out;
}

/** How far a bar stops short of its column's edge, in columns. The gap between two bars is twice this,
 *  and the lines that join them run down it. */
export const PAD = 0.12;

/** One line, in columns across: out of its source bar's end (`x1`), along to its own lane in the gap
 *  before the target (`xv`, where it turns up or down), and in to the target (`x2`). */
export type Route = { from: string; to: string; x1: number; xv: number; x2: number };

/**
 * Where each line runs. A line into a step turns in the gap just before that step's wave, and the
 * lines into one wave each take a lane of their own across the gap, so none runs along another.
 * The source farthest (in rows) from the target takes the lane farthest right: its vertical then
 * passes the nearer sources' stubs without crossing them. A line to a header value turns on the
 * value's own column, and the root's lines on the end column's middle. `yOf` is a row's centre.
 */
export function routes(yOf: (id: string) => number): Route[] {
  const all = edges();
  const into = new Map<string, string[]>(); // a step's key: the sources of its lines
  for (const e of all) if (!e.to.startsWith("mark:")) into.set(e.to, [...(into.get(e.to) ?? []), e.from]);
  // the lines into each wave, nearest source first (they take the left lanes)
  const lane = new Map<string, number>(); // `${from}>${to}` -> lane x
  const waves = new Set([...into.keys()].map(waveOf));
  for (const w of waves) {
    const lines = [...into].filter(([to]) => waveOf(to) === w).flatMap(([to, froms]) => froms.map((from) => ({ from, to })));
    const sources = [...new Set(lines.map((l) => l.from))];
    // order a source by its distance to the nearest of its targets in this wave
    const nearness = (s: string) => Math.min(...lines.filter((l) => l.from === s).map((l) => Math.abs(yOf(l.to) - yOf(s))));
    sources.sort((a, b) => nearness(a) - nearness(b));
    const reach = PAD * 0.75;
    sources.forEach((s, i) => {
      const x = w + (sources.length === 1 ? 0 : -reach + (2 * reach * i) / (sources.length - 1));
      for (const l of lines.filter((l) => l.from === s)) lane.set(`${l.from}>${l.to}`, x);
    });
  }
  return all.map(({ from, to }) => {
    const x1 = waveOf(from) + 1 - PAD;
    if (!to.startsWith("mark:")) return { from, to, x1, xv: lane.get(`${from}>${to}`)!, x2: waveOf(to) + PAD };
    const value = HEADER_VALUES.find((v) => `mark:${v.id}` === to)!;
    const x = markerX(value);
    return { from, to, x1, xv: x, x2: x };
  });
}

/** A family's summary bar: from its first step's start to its last step's end, in waves. */
export const spanOf = (lane: Lane): [number, number] => [
  Math.min(...lane.keys.map(waveOf)), Math.max(...lane.keys.map(waveOf)) + 1,
];

export { LAST_WAVE, keyOf, waveOf };
