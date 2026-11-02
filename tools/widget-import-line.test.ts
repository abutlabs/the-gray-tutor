// Lesson 0.6's import line, checked against the lessons' code, the reference client, the
// vectors and lasair, so the stations a reader (or an examiner) steps through are the ones the
// client runs. reference/, vectors/ and ../lasair aren't in CI: the tests that read them skip.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { CALLS } from "../.vitepress/theme/import-gantt.ts";
import { BAD_BLOCKS, STATIONS, STEPS, TRACE, refusedAt, seen } from "../.vitepress/theme/import-line.ts";
import { ROOT, lessonCode, lessonText, readParts } from "./lessons.ts";

const LESSON = "00-start/06-how-a-block-is-imported.md";
const text = lessonText(LESSON);
const lessons = readParts().flatMap((p) => p.lessons);
const everything = lessons.map((l) => lessonCode(l.id)).join("\n");
const allText = lessons.map((l) => lessonText(l.file)).join("\n");
const REFERENCE = join(ROOT, "reference/src");
const NO_REFERENCE = !existsSync(join(REFERENCE, "import.ts")) && "no reference client";
const TRACE_FILE = join(ROOT, "vectors", TRACE.vector);
const LASAIR = join(ROOT, "..", "lasair");

test("every station and step points at a real lesson, functions the lessons write, and scripts they add", () => {
  const places = [...STATIONS.map((s) => s.ours.lesson), ...STEPS.map((s) => s.lesson)];
  for (const lesson of places) assert.ok(existsSync(join(ROOT, "lessons", `${lesson}.md`)), lesson);
  for (const s of STATIONS) {
    assert.match(s.ours.file, /^src\/[\w-]+\.ts$/, s.id);
    for (const fn of s.ours.fns) assert.match(everything, new RegExp(`function ${fn}\\b`), `${s.id}: ${fn}`);
    if (s.ours.run) assert.ok(allText.includes(`scripts.${s.ours.run}=`), `${s.id}: npm run ${s.ours.run}`);
  }
});

test("Υ's steps are importBlock's calls after checkHeader, in its order; checkHeader is station 4", () => {
  assert.deepEqual(STEPS.map((s) => s.call), CALLS.map((c) => c.call).filter((c) => c !== "checkHeader"));
  assert.deepEqual(STATIONS.find((s) => s.id === "header")!.ours.fns, ["checkHeader"]);
  assert.ok(STATIONS.findIndex((s) => s.id === "header") < STATIONS.findIndex((s) => s.id === "steps"));
});

test("each wrong block stops at exactly one place, and both kinds are on offer: before Υ and inside it", () => {
  const listed = [...STATIONS.flatMap((s) => s.refuses), ...STEPS.flatMap((s) => s.refuses)];
  assert.equal(new Set(listed).size, listed.length, "no error is refused in two places");
  const where = BAD_BLOCKS.map((b) => refusedAt(b.error));
  assert.ok(where.some((w) => w.station !== "steps") && where.some((w) => w.station === "steps"));
  assert.deepEqual(refusedAt("bad_seal"), { station: "steps", step: "runSafrole" });
  assert.deepEqual(refusedAt("bad_parent_state_root"), { station: "header" });
  assert.throws(() => refusedAt("no_such_error"));
});

test("the lesson's table is the widget's stations, in order, with their refusals and code", () => {
  const rows = [...text.matchAll(/^\| (\d) \| ([^|]+) \| [^|]+ \| ([^|]+) \| `(src\/[\w.]+)`, `(\w+)` \|$/gm)];
  assert.equal(rows.length, STATIONS.length, "a row for each station");
  rows.forEach(([, n, title, refuses, file, fn], i) => {
    const s = STATIONS[i];
    assert.equal(Number(n), i + 1);
    assert.equal(title.trim(), s.id === "steps" ? "run Υ" : s.title.toLowerCase(), `row ${n}`);
    assert.deepEqual([file, fn], [s.ours.file, s.ours.fns[0]], `row ${n}`);
    for (const e of s.refuses) assert.ok(refuses.includes(e), `row ${n} names ${e}`);
  });
  // the "such as" examples in row 5 are errors one of Υ's steps refuses
  for (const [, e] of rows[4][3].matchAll(/`(\w+)`/g)) assert.equal(refusedAt(e).station, "steps", e);
  assert.ok(text.indexOf("<ImportLine />") < text.indexOf("<ImportGantt />"), "the whole import first, then inside Υ");
});

test("every error the line names is one the reference client returns", { skip: NO_REFERENCE }, () => {
  const src = ["import.ts", "disputes.ts", "safrole.ts", "assurances.ts", "guarantors.ts", "target.ts"]
    .map((f) => readFileSync(join(REFERENCE, f), "utf8")).join("\n");
  for (const e of [...STATIONS.flatMap((s) => s.refuses), ...STEPS.flatMap((s) => s.refuses)]) {
    assert.ok(src.includes(`"${e}"`), e);
  }
  for (const s of STATIONS) for (const fn of s.ours.fns) {
    assert.match(readFileSync(join(ROOT, "reference", s.ours.file), "utf8"), new RegExp(`function ${fn}\\b`), `${s.id}: ${fn}`);
  }
});

test("the real block's values are the safrole trace's, and its root is block 2's prior state root", { skip: !existsSync(TRACE_FILE) && "no vectors" }, () => {
  const one = JSON.parse(readFileSync(TRACE_FILE, "utf8"));
  const two = JSON.parse(readFileSync(TRACE_FILE.replace("00000001", "00000002"), "utf8"));
  const h = one.block.header;
  const short = (x: string) => x.slice(0, 10);
  assert.equal(h.slot, TRACE.slot);
  assert.equal(h.author_index, TRACE.author);
  assert.equal(short(h.parent), TRACE.parent);
  assert.equal(short(h.extrinsic_hash), TRACE.extrinsicHash);
  assert.equal(short(h.parent_state_root), TRACE.priorRoot);
  assert.equal(short(one.pre_state.state_root), TRACE.priorRoot, "the header quotes the state before's root");
  assert.equal(short(one.post_state.state_root), TRACE.root);
  assert.equal(short(two.block.header.parent_state_root), TRACE.root, "the next block quotes it");
  const e = one.block.extrinsic;
  assert.ok([e.tickets, e.preimages, e.guarantees, e.assurances, e.disputes.verdicts].every((l) => l.length === 0), TRACE.lists);
  // the lesson and the widget say the same numbers
  assert.ok(text.includes(`${TRACE.priorRoot}…`) && text.includes(`${TRACE.root}…`));
  assert.ok(seen("answer").includes(TRACE.root) && seen("header").includes(TRACE.priorRoot));
});

test("the lesson's lasair table names functions lasair has", { skip: !existsSync(LASAIR) && "no lasair beside the repo" }, () => {
  const files = ["bin/conformance_target.ml", "conformance/trace_runner.ml", "conformance/stf_guarantees.ml",
    "conformance/stf_transitions.ml", "conformance/block_codec.ml", "lib/state_db.ml"];
  const src = files.map((f) => readFileSync(join(LASAIR, f), "utf8")).join("\n");
  const from = text.indexOf("| station | lasair |");
  const table = text.slice(from, text.indexOf("\n\n", from));
  const names = [...table.matchAll(/`(?:\w+\.)?(\w+)`/g)].map((m) => m[1]).filter((n) => n !== "Error" && n !== "Stf_statistics");
  assert.ok(names.length > 15, `read the table: ${names.length}`);
  for (const n of names) assert.ok(new RegExp(`let (rec )?${n}\\b`).test(src), `lasair has ${n}`);
});
