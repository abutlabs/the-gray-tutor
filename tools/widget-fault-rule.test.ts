// Lesson 10.5's fault-rule widget (.vitepress/theme/fault-rule.ts): its ⇔ is the lesson's
// `wrong`, its names offenseError's in the code's order, and each case points at the vector
// the lesson's run shows.

import { test } from "node:test";
import assert from "node:assert/strict";
import { BAD_WITHOUT_CULPRITS, offenseError, terms } from "../.vitepress/theme/fault-rule.ts";
import { lessonCode, lessonText } from "./lessons.ts";

const LESSON = "10-disputes/05-bad-culprits-and-faults.md";
const raw = lessonText(LESSON);
const code = lessonCode("10.5");

test("rule 6's three terms agree only for valid on bad, or invalid on good; never on wonky", () => {
  assert.match(code, /const wrong = \(f: Fault\) => \(f\.vote \? bad : good\)\.has\(toHex\(f\.target\)\);/);
  assert.ok(terms("bad", "valid").agree);
  assert.ok(terms("good", "invalid").agree);
  assert.ok(!terms("bad", "invalid").agree);
  assert.ok(!terms("good", "valid").agree);
  assert.ok(!terms("wonky", "valid").agree && !terms("wonky", "invalid").agree, "the check question: a wonky report fails the ⇔");
  assert.deepEqual([terms("wonky", "valid").inBad, terms("wonky", "valid").notGood], [false, true]);
});

test("the names come in offenseError's order, each with the vector the run shows", () => {
  const order = [...code.matchAll(/return "(culprits_verdict_not_bad|fault_verdict_wrong|not_enough_faults)";/g)].map((m) => m[1]);
  assert.deepEqual(order, ["culprits_verdict_not_bad", "fault_verdict_wrong", "not_enough_faults"]);
  assert.deepEqual(offenseError({ verdict: "good", fault: "valid", culprit: false }), { error: "fault_verdict_wrong", vector: "progress_with_faults-7" });
  assert.deepEqual(offenseError({ verdict: "good", fault: null, culprit: false }), { error: "not_enough_faults", vector: "progress_with_faults-1" });
  assert.deepEqual(offenseError({ verdict: "good", fault: "invalid", culprit: true }), { error: "culprits_verdict_not_bad", vector: "progress_with_culprits-5" });
  assert.equal(offenseError({ verdict: "bad", fault: null, culprit: false }), null, "a bad verdict needs no culprit");
  assert.equal(offenseError({ verdict: "bad", fault: "valid", culprit: true }), null);
  for (const line of ["progress_with_faults-7: fault_verdict_wrong", "progress_with_faults-1: not_enough_faults", "progress_with_culprits-5: culprits_verdict_not_bad", `${BAD_WITHOUT_CULPRITS}: accepted`]) {
    assert.match(raw, new RegExp(`^${line}$`, "m"), line);
  }
});

test("lesson 10.5 places the widget once, at the top, before The idea; the ⇔ paragraph sends the reader back to it", () => {
  const at = raw.indexOf("<FaultRule />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<FaultRule />"), "placed once");
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  const names = raw.indexOf("`bad_guarantor_key` and `bad_auditor_key` come from.");
  assert.ok(names > raw.indexOf("try it [at the top](#try-it)") && names < raw.indexOf("## The tests"));
});
