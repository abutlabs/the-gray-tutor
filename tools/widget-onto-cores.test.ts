// Lesson 12.3's onto-the-cores widget (.vitepress/theme/onto-cores.ts): placeReports and
// reportedPackages are the lesson's, and on the run's vector they give its Output; the
// guarantees and the result are the vector's where vectors/ is downloaded.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { GUARANTEES, placeReports, reportedPackages, SLOT } from "../.vitepress/theme/onto-cores.ts";
import { lessonCode, lessonText, ROOT } from "./lessons.ts";

const raw = lessonText("12-guarantees/03-onto-the-cores.md");
const VECTOR = join(ROOT, "vectors/stf/reports/tiny/high_work_report_gas-1.json");

test("the rules are the lesson's: a report takes its core at τ′, and packages sort by hash", () => {
  const code = lessonCode("12.3");
  assert.match(code, /after\[guarantee\.report\.core_index\] = \{ guarantee, registered_slot: slot \};/);
  assert.match(code, /return packages\.sort\(\(a, b\) => toHex\(a\.hash\)\.localeCompare\(toHex\(b\.hash\)\)\); \/\/ a dictionary/);
});

test("the run: both cores take a package since 14, and the reported list is in hash order", () => {
  const placed = [...raw.matchAll(/^core (\d) \(empty\): now holds package (0x[0-9a-f]{8})…, since (\d+)$/gm)];
  assert.equal(placed.length, 2);
  const after = placeReports(GUARANTEES.length);
  for (const [, core, pkg, since] of placed) {
    assert.equal(after[Number(core)]!.pkg.slice(0, 10), pkg);
    assert.equal(after[Number(core)]!.since, Number(since));
  }
  assert.equal(SLOT, 14);
  assert.match(raw, /^cores holding a report now: 2 of 2$/m);
  const reported = [...raw.matchAll(/^reported: package (0x[0-9a-f]{8})…, exports root (0x[0-9a-f]{8})…$/gm)].map((m) => [m[1], m[2]]);
  assert.deepEqual(reportedPackages(GUARANTEES.length).map((r) => [r.pkg.slice(0, 10), r.exportsRoot.slice(0, 10)]), reported);
  assert.notDeepEqual(reportedPackages(2).map((r) => r.pkg), GUARANTEES.map((g) => g.pkg), "sorting changes the order here");
  assert.deepEqual(placeReports(0), [null, null]);
  assert.deepEqual(placeReports(1)[1], null);
});

test("the guarantees and the result are the vector's, where vectors/ is downloaded", { skip: !existsSync(VECTOR) && "no vectors/" }, () => {
  const v = JSON.parse(readFileSync(VECTOR, "utf8"));
  assert.equal(v.input.slot, SLOT);
  assert.deepEqual(GUARANTEES, v.input.guarantees.map((g: { report: { core_index: number; package_spec: { hash: string; exports_root: string } } }) => ({ core: g.report.core_index, pkg: g.report.package_spec.hash, exportsRoot: g.report.package_spec.exports_root })));
  assert.deepEqual(reportedPackages(2).map((r) => ({ work_package_hash: r.pkg, segment_tree_root: r.exportsRoot })), v.output.ok.reported);
  assert.deepEqual(placeReports(2).map((c) => c && [c.pkg, c.since]), v.post_state.avail_assignments.map((a: { guarantee: { report: { package_spec: { hash: string } } }; registered_slot: number } | null) => a && [a.guarantee.report.package_spec.hash, a.registered_slot]));
});

test("lesson 12.3 places the widget once, at the top, and sends the reader back to it once the reported packages are defined", () => {
  const at = raw.indexOf("<OntoCores />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<OntoCores />"));
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  const back = raw.indexOf("(#try-it)", raw.indexOf("Here the vectors insist on it.)"));
  assert.ok(back > 0 && back < raw.indexOf("## The tests"));
});
