// Lesson 0.6's import timeline, checked against the graph lesson 19.1 builds, lesson 0.5's
// table of families and the reference client, so the timeline a reader steps through is the
// import the client runs.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { LAST_WAVE, STEPS, WAVES, dependentsOf, makerOf, waveOf } from "../.vitepress/theme/import-waves.ts";
import {
  BUILT, CALLS, COLUMNS, CORE_CHAIN, CRITICAL, HEADER_VALUES, LANES, PAD, WHY, describe, doneBy, edges, isCritical, laneOf, latestOf, layoutRows, routes, slackOf,
} from "../.vitepress/theme/import-gantt.ts";
import { ROOT, lessonCode, lessonText, readParts } from "./lessons.ts";

const text = lessonText("00-start/06-how-a-block-is-imported.md");
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

test("the cores are a chain, ρ† then ρ‡ then ρ′, each with its reason, and the chart can follow them", () => {
  assert.deepEqual(CORE_CHAIN, ["ρ†", "ρ‡", "ρ′"]);
  // each is made from the one before it: the lines the chart lights
  for (const [from, to] of [["ρ†", "ρ‡"], ["ρ‡", "ρ′"]]) {
    assert.ok(edges().some((e) => e.from === from && e.to === to), `${to} waits for ${from}`);
    assert.ok(waveOf(to) > waveOf(from), `${to} runs after ${from}`);
  }
  assert.deepEqual(Object.keys(WHY), CORE_CHAIN, "a reason for each station, in order");
  // the reasons are lesson 10.3's: the court first, the assurances on what is left, the guarantees on free cores
  assert.match(WHY["ρ†"].why, /before anything can call it available/);
  assert.match(WHY["ρ‡"].why, /5 slots/);
  assert.match(WHY["ρ′"].why, /core_engaged/);
  const tenThree = lessonText("10-disputes/03-clearing-the-cores.md");
  assert.match(tenThree, /ρ†\s+1\s+DISPUTES[\s\S]*ρ‡\s+2\s+ASSURANCES[\s\S]*ρ′\s+3\s+GUARANTEES/, "the same order as 10.3's picture");
  assert.match(tenThree, /`core_engaged`/);
  // the widget: a button that follows them, the reasons in its panel, and a symbol on single-step rows
  const vue = readFileSync(join(ROOT, ".vitepress/theme/ImportGantt.vue"), "utf8");
  assert.match(vue, /follow the cores/);
  assert.match(vue, /WHY\[selected!\]/, "tapping a station shows why it sits there");
  assert.match(vue, /class="solo-sym"/, "Reports, Authorizations and the rest show their symbol");
  // and the lesson says so
  assert.match(text.replace(/\s+/g, " "), /The cores are a chain\.\*\* `ρ†`, `ρ‡` and `ρ′`/);
  assert.match(text, /\*follow the cores\*/);
});

// every function and bin the chart names is real: in the code the lessons write, and (where the
// completed client is here) in reference/. The chart is built from src/, with bins as viewers.
const everything = readParts().flatMap((p) => p.lessons).map((l) => lessonCode(l.id)).join("\n");
const allText = readParts().flatMap((p) => p.lessons).map((l) => lessonText(l.file)).join("\n");

test("each of the 16 steps is built by named functions in a src file, shown by bins the lessons add", () => {
  assert.deepEqual(Object.keys(BUILT).sort(), STEPS.map((s) => s.makes[0]).sort(), "a source for every step, and no other");
  for (const [key, b] of Object.entries(BUILT)) {
    assert.match(b.file, /^src\/[\w-]+\.ts$/, `${key}: a src file`);
    for (const fn of b.fns) assert.match(everything, new RegExp(`function ${fn}\\b`), `${key}: ${fn} is a function the lessons write`);
    assert.ok(b.bins.length > 0, `${key}: a bin that shows it`);
    for (const bin of b.bins) assert.ok(allText.includes(`scripts.${bin}=`), `${key}: npm run ${bin} is a script a lesson adds`);
  }
  // the chart's own lanes say the same file as the sources
  for (const lane of LANES) for (const k of lane.keys) {
    const mine = BUILT[k].file;
    assert.ok(mine === lane.file || mine === "src/import.ts" || (k === "ρ′" && mine === "src/cores.ts") || (k === "𝐑*" && mine === lane.file), `${k}: ${mine} vs lane ${lane.file}`);
  }
});

test("importBlock runs one line, in this order, and every step is made in exactly one call", () => {
  assert.equal(CALLS.map((c) => c.call).join(" > "), "checkHeader > judgeDisputes > runSafrole > takeAssurances > takeGuarantees > accumulateBlock > nextState > providePreimages");
  const made = CALLS.flatMap((c) => c.makes);
  assert.deepEqual([...made].sort(), STEPS.map((s) => s.makes[0]).sort(), "each step once");
  // a step's call never runs before a call whose steps it needs: the line is a valid order of the graph
  const at = (key: string) => CALLS.findIndex((c) => c.makes.includes(key));
  for (const s of STEPS) for (const need of s.from) if (made.includes(need)) assert.ok(at(need) <= at(s.makes[0]), `${s.makes[0]} comes after ${need}`);
  for (const c of CALLS) assert.match(everything, new RegExp(`\\b${c.call}\\b`), `${c.call} is in the lessons' code`);
});

const REF_IMPORT = join(ROOT, "reference/src/import.ts");
test("the call order and the sources are the completed client's, where reference/ is here", { skip: !existsSync(REF_IMPORT) && "no reference client" }, () => {
  const body = reference("import.ts");
  const start = body.indexOf("export function importBlock");
  const run = body.slice(start, body.indexOf("\n}\n", start));
  const order = CALLS.map((c) => run.indexOf(`${c.call}(`));
  assert.ok(order.every((i) => i > 0), `every call is in importBlock: ${order}`);
  assert.deepEqual(order, [...order].sort((a, b) => a - b), "in the order importBlock calls them");
  for (const [key, b] of Object.entries(BUILT)) {
    const src = readFileSync(join(ROOT, "reference", b.file), "utf8");
    for (const fn of b.fns) assert.match(src, new RegExp(`function ${fn}\\b`), `${key}: ${fn} in reference/${b.file}`);
    for (const bin of b.bins) assert.ok(existsSync(join(ROOT, "reference/bin", `${bin}.ts`)), `${key}: reference/bin/${bin}.ts`);
  }
});

// The chart's dependencies are the Gray Paper's, not our implementation's (Aodh, 2026-10-31): §4.2's
// equation transitionfunctioncomposition, read straight from the paper's TeX, is the oracle for the
// graph, the waves and the lines. Our code (BUILT, CALLS, the reference client) is checked against it
// and never feeds it.
const TEX: Record<string, string> = {
  theheader: "H", thetime: "τ", xtdisputes: "E_D", xttickets: "E_T", xtassurances: "E_A", xtguarantees: "E_G",
  xtpreimages: "E_P", recenthistory: "β_H", recenthistorypostparentstaterootupdate: "β_H†", safrole: "γ",
  stagingset: "ι", entropy: "η", activeset: "κ", previousset: "λ", disputes: "ψ", availassignments: "ρ",
  availassignmentspostjudgment: "ρ†", availassignmentspostassurances: "ρ‡", justbecameavailable: "𝐑",
  ready: "ω", accumulated: "ξ", accountspostxfer: "δ‡", accountspre: "δ", privileges: "χ", authqueue: "ϕ",
  lastaccout: "θ", accumulationstatistics: "𝐒", accountspostpreimage: "δ′", authpool: "α", activity: "π",
};

/** The symbols of one side of a row, in order: `\thetime'` is τ′, `\justbecameavailable^*` is 𝐑*. */
function symbols(side: string): string[] {
  return [...side.matchAll(/\\([a-z]+)(\^\*)?('?)/g)]
    .filter(([, name]) => name !== "tup")
    .map(([, name, star, prime]) => {
      assert.ok(TEX[name], `a macro the test doesn't know: \\${name}`);
      return `${TEX[name]}${star ? "*" : ""}${prime ? "′" : ""}`;
    });
}

test("the graph, the waves and the lines are the Gray Paper's §4.2, read from its TeX", { skip: !existsSync(OVERVIEW) && "no Gray Paper beside the tutorial" }, () => {
  const tex = readFileSync(OVERVIEW, "utf8");
  const eq = /\\begin\{align\}\\label\{eq:transitionfunctioncomposition\}([\s\S]*?)\\end\{align\}/.exec(tex)![1];
  const rows = eq.split("\\\\").map((r) => r.replace(/\\label\{[^}]*\}/g, "")).filter((r) => r.includes("\\prec"));
  assert.equal(rows.length, STEPS.length, "the paper's sixteen lines, one step each");
  rows.forEach((row, i) => {
    const [lhs, rhs] = row.split("&\\prec");
    // the paper's primes read δ′ where the graph keeps δ′ for the post-preimage state: the same symbol
    const makes = symbols(lhs).map((x) => (x === "𝐑" ? "𝐑*" : x));
    const from = symbols(rhs).map((x) => (x === "𝐑" ? "𝐑*" : x));
    const step = STEPS[i];
    assert.deepEqual(step.makes, makes.map((m) => (m === "δ′" ? "δ′" : m)), `line ${i + 1} makes the same values`);
    assert.deepEqual([...new Set(step.from)].sort(), [...new Set(from)].sort(), `${makes[0]} is made from what the paper says`);
  });
  // the chart's lines between steps are exactly "an input some other step makes", per the paper
  const maker = new Map(STEPS.flatMap((s) => s.makes.map((m) => [m, s.makes[0]] as const)));
  const fromPaper = new Set<string>();
  rows.forEach((row) => {
    const [lhs, rhs] = row.split("&\\prec");
    const to = symbols(lhs).map((x) => (x === "𝐑" ? "𝐑*" : x))[0];
    for (const input of symbols(rhs).map((x) => (x === "𝐑" ? "𝐑*" : x))) if (maker.has(input) && maker.get(input) !== to) fromPaper.add(`${maker.get(input)}>${to}`);
  });
  const drawn = new Set(edges().filter((e) => !e.to.startsWith("mark:")).map((e) => `${e.from}>${e.to}`));
  assert.deepEqual([...drawn].sort(), [...fromPaper].sort(), "the drawn lines between steps are the paper's, no more, no fewer");
});

test("our implementation's layer never feeds the chart's layout: waves, rows and lines are from the graph alone", () => {
  const ts = readFileSync(join(ROOT, ".vitepress/theme/import-gantt.ts"), "utf8");
  for (const fn of ["latestOf", "slackOf", "layoutRows", "edges", "routes", "doneBy", "spanOf"]) {
    const at = ts.indexOf(`function ${fn}`) >= 0 ? ts.indexOf(`function ${fn}`) : ts.indexOf(`const ${fn}`);
    assert.ok(at >= 0, fn);
    const body = ts.slice(at, ts.indexOf("\n}\n", at) > 0 ? ts.indexOf("\n}\n", at) : at + 600);
    assert.ok(!/\bBUILT\b|\bCALLS\b/.test(body), `${fn} reads the graph, not BUILT or CALLS`);
  }
  const waves = readFileSync(join(ROOT, ".vitepress/theme/import-waves.ts"), "utf8");
  assert.ok(!/BUILT|CALLS|reference\/|bin\//.test(waves.replace(/\/\/.*$/gm, "")), "the graph module knows nothing of our code");
});

test("the widget shows our client's side apart from the paper's, and the lesson says which is which", () => {
  const vue = readFileSync(join(ROOT, ".vitepress/theme/ImportGantt.vue"), "utf8");
  assert.match(vue, /as importBlock runs it/);
  assert.match(vue, /The chart is the Gray Paper's; this is our client\./, "the panel says whose is whose");
  assert.match(vue, /BUILT\[selected!\]/, "a tapped step shows the function and bin that make it");
  assert.match(vue, /class="call"/, "each call can be tapped to light its steps");
  const prose = text.replace(/\s+/g, " ");
  assert.match(prose, /The chart is the Gray Paper's; the code is ours\./);
  assert.match(prose, /The waves say which orders are allowed; they are not our code's schedule\./);
});
