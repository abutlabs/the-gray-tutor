// Lesson 0.6's import timeline, checked against the graph lesson 19.1 builds, lesson 0.5's
// table of families and the reference client, so the timeline a reader steps through is the
// import the client runs.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { LAST_WAVE, STEPS, WAVES, dependentsOf, makerOf, waveOf } from "../.vitepress/theme/import-waves.ts";
import {
  COLUMNS, CRITICAL, HEADER_VALUES, LANES, PAD, describe, doneBy, edges, isCritical, laneOf, latestOf, layoutRows, routes, slackOf,
} from "../.vitepress/theme/import-gantt.ts";
import { ROOT, lessonText } from "./lessons.ts";

const text = lessonText("00-start/06-how-a-block-is-ordered.md");
const families = lessonText("00-start/05-understanding-the-vectors.md");
const reference = (file: string) => readFileSync(join(ROOT, "reference/src", file), "utf8");
// the reference client is the author's own copy (reference/ is gitignored), and the Gray Paper's
// source sits beside the repo: neither is in CI, so the tests that read them are skipped there
const NO_REFERENCE = !existsSync(join(ROOT, "reference/src/import.ts")) && "no reference client";
const OVERVIEW = join(ROOT, "..", "graypaper/text/overview.tex");

test("every step of the graph is on exactly one lane", () => {
  const keys = LANES.flatMap((l) => l.keys);
  assert.equal(new Set(keys).size, keys.length, "no step on two lanes");
  assert.deepEqual([...keys].sort(), STEPS.map((s) => s.makes[0]).sort());
  for (const k of keys) assert.equal(laneOf(k).keys.includes(k), true);
});

test("the lanes are lesson 0.5's table of families, in its order, with its files", () => {
  const table = families.slice(families.indexOf("| Family | Tiny / full"), families.indexOf("Tiny and full are two sizes"));
  const rows = [...table.matchAll(/^\| `(\w+)` \| \d+ \/ \d+ \|[^|]*\| `(src\/[\w.]+)` \|/gm)].map((m) => ({ id: m[1], file: m[2] }));
  assert.equal(rows.length, 9, "the nine STF families");
  assert.deepEqual(LANES.filter((l) => l.id !== "clock").map((l) => ({ id: l.id, file: l.file })), rows);
});

test("the clock's lane has no vector family: the lesson's families don't include it", () => {
  assert.ok(!/\| `clock`/.test(families));
  assert.equal(LANES[0].id, "clock");
  assert.deepEqual(LANES[0].keys, ["τ′"]);
  assert.equal(makerOf("τ′")!.from.join(), "H", "the time is made from the header alone");
});

test("a bar starts in its step's wave, and the waves are 19.1's four", () => {
  assert.equal(LAST_WAVE, 4);
  assert.deepEqual(WAVES.map((w) => w.length), [7, 3, 2, 4], "the lesson's 'seven steps' in wave 1");
  assert.match(text, /Wave 1 has seven steps/);
  assert.equal(COLUMNS.length, LAST_WAVE + 2, "start, each wave, end");
});

test("slack: the latest a step can start without delaying anything that needs it", () => {
  for (const step of STEPS) {
    const key = step.makes[0];
    const latest = latestOf(key);
    assert.ok(latest >= waveOf(key) && latest <= LAST_WAVE, key);
    for (const d of dependentsOf(key)) assert.ok(latest < latestOf(d), `${key} must start before ${d}`);
    if (dependentsOf(key).length === 0) assert.equal(latest, LAST_WAVE, `${key}: nothing waits, so the last wave`);
  }
  assert.equal(slackOf("ρ′"), 1, "the lesson's example: finishes in wave 3, could run in wave 4");
  assert.equal(waveOf("ρ′"), 3);
  assert.match(text, /guarantees' step \(`ρ′`\) finishes in wave 3/);
});

test("the critical path is the lesson's chain: ρ†, 𝐑*, accumulation, then the four that wait for it", () => {
  assert.deepEqual(CRITICAL, ["ρ†", "𝐑*", "ω′", "β_H′", "δ′", "α′", "π′"]);
  assert.deepEqual(dependentsOf("ω′"), ["β_H′", "δ′", "α′", "π′"], "four steps wait for accumulation");
  assert.match(text, /Four steps wait for it/);
  assert.match(text, /`ρ†` to `𝐑\*` to accumulation to the last four/);
  assert.equal(CRITICAL.map(waveOf).join(), "1,2,3,4,4,4,4", "one step in each wave on the way, then the four");
  for (const k of CRITICAL) assert.ok(isCritical(k));
});

test("Safrole is four steps, and γ′ waits for the entropy, the validators and the judgements", () => {
  assert.equal(LANES.find((l) => l.id === "safrole")!.keys.length, 4);
  const from = makerOf("γ′")!.from;
  for (const x of ["η′", "κ′", "ψ′"]) assert.ok(from.includes(x), x);
  assert.ok(!from.includes("λ′"), "not the previous validators");
});

test("the header's values: each is known in the wave of the step it waits for", () => {
  for (const v of HEADER_VALUES) {
    if (v.after) assert.equal(v.wave, waveOf(v.after), v.id);
  }
  assert.deepEqual(HEADER_VALUES.map((v) => [v.id, v.role, v.wave]), [
    ["given-header", "given", 0], ["given-extrinsic", "given", 0], ["start", "checked", 0],
    ["offenders", "checked", 1], ["marks", "checked", 2], ["seal", "checked", 2], ["root", "made", 5],
  ]);
  const root = HEADER_VALUES.at(-1)!;
  assert.equal(root.wave, LAST_WAVE + 1, "the new state's root waits for every step");
  assert.equal(COLUMNS.at(-1), "end");
});

test("the header values are the reference importer's: its checks, and where it makes them", { skip: NO_REFERENCE }, () => {
  const source = reference("import.ts");
  // before any step: the four checks in checkHeader
  for (const name of ["bad_parent", "bad_parent_state_root", "bad_slot", "bad_extrinsic_hash"]) assert.ok(source.includes(`"${name}"`), name);
  // the marks and the seal come from Safrole's step; the offenders mark from the disputes alone
  assert.match(source, /step\.epochMark/);
  assert.match(source, /step\.ticketsMark/);
  assert.match(source, /offendersMark\(extrinsic\.disputes\)/);
  assert.match(source, /sealError\(config, header, author, after\.sealers, after\.entropy\[3\]\)/);
  // the root of the new state is the next block's prior state root, checked at the start of its import
  assert.match(source, /stateRoot\(entries\)\) !== toHex\(header\.parent_state_root\)/);
});

test("stepping: what is done, what runs next, and which header values are known", () => {
  const start = doneBy(0);
  assert.deepEqual(start.steps, []);
  assert.deepEqual(start.running, WAVES[0].map((s) => s.makes[0]));
  assert.deepEqual(start.values.map((v) => v.id), ["given-header", "given-extrinsic", "start"]);
  assert.deepEqual(start.checks.map((v) => v.id), ["start"]);
  const two = doneBy(2);
  assert.equal(two.steps.length, 7 + 3);
  assert.deepEqual(two.checks.map((v) => v.id), ["start", "offenders", "marks", "seal"]);
  const end = doneBy(LAST_WAVE + 1);
  assert.equal(end.steps.length, STEPS.length);
  assert.equal(end.values.length, HEADER_VALUES.length);
  assert.deepEqual(end.running, []);
});

test("describe: ω′ waits for 𝐑* and the clock, feeds four, and cannot wait", () => {
  const d = describe("ω′");
  assert.equal(d.name, "accumulation");
  assert.equal(d.lane.file, "src/accumulate.ts");
  assert.deepEqual(d.waitsFor, ["𝐑*", "τ′"]);
  assert.equal(d.feeds.length, 4);
  assert.equal(d.slack, 0);
  assert.deepEqual(describe("η′").waitsFor, [], "needs only the block and the old state");
});

test("lesson 0.6 quotes the Gray Paper's §4.2 word for word", { skip: !existsSync(OVERVIEW) && "no Gray Paper beside the tutorial" }, () => {
  const overview = readFileSync(OVERVIEW, "utf8");
  const quote = /we minimize the depth of the\s+dependency graph/.exec(text)?.[0].replace(/\s+/g, " ");
  assert.ok(quote, "the lesson quotes §4.2's reason");
  assert.ok(overview.replace(/\s+/g, " ").includes(quote!), "and it is the Gray Paper's, word for word (overview.tex)");
});

test("lesson 0.6 quotes §4.2's reason and places the widget once, after the timeline section opens", () => {
  assert.match(text.replace(/\s+/g, " "), /we minimize the depth of the dependency graph/);
  assert.equal(text.split("<ImportGantt />").length - 1, 1);
  assert.ok(text.indexOf("<ImportGantt />") > text.indexOf("## The timeline"));
  assert.ok(text.indexOf("<ImportGantt />") < text.indexOf("## What the block gives and what the importer works out"));
});

test("the roles: what the block gives is read as an input; a check is one the importer makes itself", { skip: NO_REFERENCE }, () => {
  const source = reference("import.ts");
  // given: the header's slot, entropy source and author index are read, not compared with anything made
  assert.match(source, /vrfOutput\(header\.entropy_source\)/, "the entropy source is read as an input");
  assert.match(source, /header\.author_index/, "the author index picks the author's key");
  assert.match(source, /const slot = block\.header\.slot; \/\/ τ′/, "the slot becomes the new time");
  assert.equal(makerOf("τ′")!.from.join(), "H");
  // checked: each is a refusal when the header's value differs from the importer's
  for (const name of ["bad_parent", "bad_parent_state_root", "bad_slot", "bad_extrinsic_hash", "bad_epoch_mark", "bad_tickets_mark", "bad_offenders_mark"]) {
    assert.ok(source.includes(`"${name}"`), name);
  }
  assert.deepEqual(HEADER_VALUES.filter((v) => v.role === "checked").map((v) => v.id), ["start", "offenders", "marks", "seal"]);
  // made: the new state's root is no field of this header
  assert.equal(HEADER_VALUES.filter((v) => v.role === "made").length, 1);
  assert.ok(!/new_state_root|posterior_state_root/.test(reference("block.ts")), "the header has no field for the new root");
});

test("the lines: one route per dependency, each in its own lane of the gap before its target", () => {
  const { rows } = layoutRows();
  const y = new Map(rows.map((r) => [r.kind === "mark" ? r.id : (r.key ?? r.id), r.y + r.h / 2]));
  const all = routes((id) => y.get(id)!);
  assert.deepEqual(all.map((r) => `${r.from}>${r.to}`), edges().map((e) => `${e.from}>${e.to}`), "a route for every edge, in order");
  const steps = all.filter((r) => !r.to.startsWith("mark:"));
  for (const r of steps) {
    // out of the source bar's end, down the gap before the target's column, into its start
    assert.equal(r.x1, waveOf(r.from) + 1 - PAD, `${r.from}: leaves its bar's end`);
    assert.equal(r.x2, waveOf(r.to) + PAD, `${r.to}: arrives at its bar's start`);
    assert.ok(Math.abs(r.xv - waveOf(r.to)) <= PAD, `${r.from}>${r.to}: turns inside the gap, not on a bar`);
    assert.ok(r.x1 < r.xv && r.xv < r.x2, `${r.from}>${r.to}: left to right`);
  }
  // lines from different steps into one wave never share a lane; one step's lines may
  for (const w of [2, 3, 4]) {
    const lane = new Map<string, number>();
    for (const r of steps.filter((r) => waveOf(r.to) === w)) {
      for (const [other, x] of lane) if (other !== r.from) assert.ok(Math.abs(x - r.xv) > 0.02, `wave ${w}: ${r.from} and ${other} share a lane`);
      lane.set(r.from, r.xv);
    }
  }
  // a line to a diamond runs straight down its column, and the root's down the end column's middle
  for (const r of all.filter((r) => r.to.startsWith("mark:"))) assert.equal(r.xv, r.x2, `${r.to}: straight down`);
  assert.ok(all.filter((r) => r.to === "mark:root").every((r) => r.x2 === LAST_WAVE + 1.5));
});

test("the lines are drawn in the widget from those routes, and bars and rules are drawn to match", () => {
  const vue = readFileSync(join(ROOT, ".vitepress/theme/ImportGantt.vue"), "utf8");
  assert.match(vue, /routes\(\(id\) => centre\(rowOf\.get\(id\)!\)\)/, "the widget asks routes() for every line");
  assert.match(vue, /left: 12%; right: 12%/, "a bar's inset is the lines' gap, PAD = 0.12 of a column");
  assert.equal(PAD, 0.12);
  // every kind of row is centred on its bar, not top- or baseline-aligned
  assert.match(vue, /\.lab\.group, \.lab\.solo \{[^}]*align-items: center/);
  assert.match(vue, /\.lab\.step \{[^}]*align-items: center/);
});
