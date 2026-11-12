// Lesson 11.3's assurance-rules widget (.vitepress/theme/assurance-rules.ts): its five rules
// are assuranceError's, in the code's order and under the vectors' names, each with the
// vector the lesson's run refuses; and 2, 1, 6 gives the check question's answer.

import { test } from "node:test";
import assert from "node:assert/strict";
import { assuranceError, ENGAGED, RULES, START, TWO_ONE_SIX, VALIDATORS } from "../.vitepress/theme/assurance-rules.ts";
import { lessonCode, lessonText } from "./lessons.ts";

const LESSON = "11-assurances/03-bad-assurances.md";
const raw = lessonText(LESSON);
const code = lessonCode("11.3");

test("the five rules fire in the code's order, each under the vectors' name", () => {
  const order = [...code.matchAll(/return "([a-z_]+)";/g)].map((m) => m[1]);
  assert.deepEqual(order.slice(0, 5), RULES.map((r) => r.error));
  assert.equal(assuranceError(START), null);
  assert.deepEqual([VALIDATORS, ENGAGED], [6, [true, false]]);
  for (const r of RULES) assert.match(raw, new RegExp(`^${r.vector}: ${r.error}$`, "m"), `${r.vector} in the run`);
});

test("each break is named by the right rule, and 2, 1, 6 is bad_validator_index before the order", () => {
  const one = (patch: Partial<(typeof START)[number]>) => [{ ...START[0], bits: [...START[0].bits], ...patch }];
  assert.equal(assuranceError(one({ onParent: false }))!.error, "bad_attestation_parent");
  assert.equal(assuranceError(one({ index: 6 }))!.error, "bad_validator_index");
  assert.equal(assuranceError([START[1], START[0]])!.error, "not_sorted_or_unique_assurers");
  assert.equal(assuranceError([START[0], START[0]])!.error, "not_sorted_or_unique_assurers", "the same validator twice");
  assert.equal(assuranceError(one({ bits: [true, true] }))!.error, "core_not_engaged");
  assert.equal(assuranceError(one({ signed: false }))!.error, "bad_signature");
  assert.equal(assuranceError(TWO_ONE_SIX)!.error, "bad_validator_index");
  assert.match(raw.replace(/\s+/g, " "), /`bad_validator_index`: 6 isn't below \|κ\| = 6/);
  assert.equal(assuranceError([{ ...START[0], onParent: false, signed: false }])!.error, "bad_attestation_parent", "the signature is checked last");
});

test("lesson 11.3 places the widget once, at the top, and the order paragraph sends the reader back to it", () => {
  const at = raw.indexOf("<AssuranceRules />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<AssuranceRules />"), "placed once");
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  const back = raw.indexOf("(#try-it)", raw.indexOf("once everything cheap has passed."));
  assert.ok(back > 0 && back < raw.indexOf("## The tests"));
});
