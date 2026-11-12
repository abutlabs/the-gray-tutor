// Lesson 10.2's offenders widget (.vitepress/theme/offenders.ts): its offenders are the
// lesson's run, line for line, its messages the lesson's code, its mark and ψ_O the check
// question's two orders, and its forgery the lesson's test.

import { test } from "node:test";
import assert from "node:assert/strict";
import { because, FORGED_SECOND_CULPRIT, message, OFFENDERS, offendersMark, recordOffenders, REPORTS } from "../.vitepress/theme/offenders.ts";
import { lessonCode, lessonText } from "./lessons.ts";

const LESSON = "10-disputes/02-culprits-and-faults.md";
const raw = lessonText(LESSON);
const code = lessonCode("10.2");

test("the offenders are the run's lines: two culprits of the bad report, one fault on the good one", () => {
  const culprits = [...raw.matchAll(/^culprit (0x[0-9a-f]+…): guaranteed report (0x[0-9a-f]+…)$/gm)].map(([, key, report]) => ({ kind: "culprit", key, report }));
  const faults = [...raw.matchAll(/^fault (0x[0-9a-f]+…): voted (valid|invalid) on report (0x[0-9a-f]+…)$/gm)].map(([, key, vote, report]) => ({ kind: "fault", key, report, vote }));
  assert.deepEqual(OFFENDERS, [...culprits, ...faults]);
  assert.match(raw, /^offenders mark: 0xad93247b…, 0xcab2b9ff…, 0x4418fb8c…$/m);
  assert.deepEqual(offendersMark(OFFENDERS), ["0xad93247b…", "0xcab2b9ff…", "0x4418fb8c…"]);
  assert.deepEqual(REPORTS.map((r) => r.verdict), ["bad", "good"]);
  assert.match(raw.replace(/\s+/g, " "), /Report `0x7b0a…` was judged bad[\s\S]*Report `0x11da…` was judged good/);
});

test("the evidence signs the lesson's messages: jam_guarantee ⌢ r, or the vote jam_invalid ⌢ r", () => {
  assert.match(code, /const GUARANTEE = new TextEncoder\(\)\.encode\("jam_guarantee"\);/);
  assert.match(code, /verifyEd25519\(culprit\.key, concatBytes\(GUARANTEE, culprit\.target\), culprit\.signature\)/);
  assert.match(code, /verifyEd25519\(fault\.key, voteMessage\(fault\.vote, fault\.target\), fault\.signature\)/);
  assert.equal(message(OFFENDERS[0]), "jam_guarantee ⌢ 0x7b0aa173…");
  assert.equal(message(OFFENDERS[2]), "jam_invalid ⌢ 0x11da6d1f…");
  assert.match(because(OFFENDERS[2]), /invalid on a report judged good/);
});

test("the mark keeps the block's order, ψ_O a sorted set; the bad-signatures vector forges the second culprit", () => {
  assert.match(code, /return \[\.\.\.disputes\.culprits\.map\(\(c\) => c\.key\), \.\.\.disputes\.faults\.map\(\(f\) => f\.key\)\];/);
  assert.deepEqual(recordOffenders([], OFFENDERS), ["0x4418fb8c…", "0xad93247b…", "0xcab2b9ff…"]);
  assert.match(raw.replace(/\s+/g, " "), /ψ_O keeps them as `0x4418…`, `0xad93…`, `0xcab2…`, sorted/);
  assert.match(code, /const signed: boolean\[\] = culprits\.map\(culpritSigned\);\s*assert\.deepEqual\(signed, \[true, false\]\);/);
  assert.deepEqual(FORGED_SECOND_CULPRIT, [true, false]);
});

test("lesson 10.2 places the widget once, at the top, before The idea; the four rules follow it", () => {
  const at = raw.indexOf("<Offenders />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<Offenders />"), "placed once");
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  assert.ok(raw.indexOf("in the order the block gives them.") > at && raw.indexOf("in the order the block gives them.") < raw.indexOf("## The tests"));
});
