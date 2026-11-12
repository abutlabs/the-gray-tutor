// Lesson 12.5's report-anchor widget (.vitepress/theme/report-anchor.ts): its rules are
// reportError's, in the code's order and under the vectors' names from the run; its recent
// blocks are lesson 9.2's; its answers are the check questions'.

import { test } from "node:test";
import assert from "node:assert/strict";
import { RECENT, REPORT_GAS, reportError, RULES, START } from "../.vitepress/theme/report-anchor.ts";
import { lessonCode, lessonText } from "./lessons.ts";

const LESSON = "12-guarantees/05-bad-reports.md";
const raw = lessonText(LESSON);
const text = raw.replace(/\s+/g, " ");
const code = lessonCode("12.5");

test("the rules come in reportError's order, under the vectors' names", () => {
  const order = [...code.matchAll(/return "([a-z_]+)";/g)].map((m) => m[1]);
  const mine = RULES.map((r) => r.error);
  assert.deepEqual(order.filter((e) => mine.includes(e)), mine, "the same order as the code, the rules the widget turns on");
  assert.match(code, /const REPORT_GAS = 10_000_000n;/);
  assert.equal(REPORT_GAS, 10_000_000);
  for (const r of RULES.slice(2)) assert.match(raw, new RegExp(`^${r.vector}: ${r.error}$`, "m"), `${r.vector} in the run`);
  assert.equal(reportError(START), null);
});

test("the check questions: a nudged state root, a package reported two blocks ago, 6M + 5M gas", () => {
  assert.equal(reportError({ ...START, rootMatches: false })!.error, "bad_state_root");
  assert.match(text, /Refused, `bad_state_root`(?: >)? Yes: rule 7/);
  assert.equal(reportError({ ...START, package: "reported" })!.error, "duplicate_package");
  assert.equal(reportError({ ...START, package: "pipeline" })!.error, "duplicate_package");
  assert.equal(reportError({ ...START, gas: [6_000_000, 5_000_000] })!.error, "work_report_gas_too_high");
  assert.match(text, /Refused, `work_report_gas_too_high`: 11,000,000 is over G_A/);
  assert.equal(reportError({ ...START, anchor: null })!.error, "anchor_not_recent");
  assert.equal(reportError({ ...START, beltMatches: false })!.error, "bad_beefy_mmr_root");
  assert.equal(reportError({ ...START, slotMatches: false })!.error, "bad_anchor_slot");
  assert.equal(reportError({ ...START, anchor: null, rootMatches: false })!.error, "anchor_not_recent", "the anchor comes before its details");
});

test("the recent blocks are lesson 9.2's eight, slots 42 to 49", () => {
  assert.deepEqual(RECENT.map((b) => b.slot), [42, 43, 44, 45, 46, 47, 48, 49]);
  assert.equal(RECENT.at(-1)!.header_hash, "0x7c7ee195…");
});

test("lesson 12.5 places the widget once, at the top, and the text after the rules sends the reader back to it", () => {
  const at = raw.indexOf("<ReportAnchor />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<ReportAnchor />"), "placed once");
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  const back = raw.indexOf("(#try-it)", raw.indexOf("(`service_item_gas_too_low`)."));
  assert.ok(back > 0 && back < raw.indexOf("## The tests"));
});
