// Lesson 10.4's verdict-rules widget (.vitepress/theme/verdict-rules.ts): its seven rules are
// verdictError's, in the code's order and under the vectors' names; each break names the
// vector the lesson's BAD_VERDICTS names; and its answers are the check questions'.

import { test } from "node:test";
import assert from "node:assert/strict";
import { BREAKS, EPOCH, PASSING, RESIZED, RULES, TINY, twoThirdsPlusOne, verdictError } from "../.vitepress/theme/verdict-rules.ts";
import { lessonCode, lessonText } from "./lessons.ts";

const LESSON = "10-disputes/04-bad-verdicts.md";
const raw = lessonText(LESSON);
const code = lessonCode("10.4");

test("the seven rules fire in the code's order, each under the vectors' name", () => {
  const order = [...code.matchAll(/return "([a-z_]+)";/g)].map((m) => m[1]).filter((e) => e !== "null");
  assert.deepEqual(order.slice(0, 7), RULES.map((r) => r.error));
  assert.deepEqual(RULES.map((r) => r.n), [1, 2, 3, 4, 5, 6, 7]);
  assert.equal(verdictError(PASSING, TINY), null, "progress_with_verdicts-4's verdicts pass");
  assert.match(raw, /^progress_with_verdicts-4: verdicts pass \(the vector: accepted\)$/m);
});

test("every break names the rule and the vector BAD_VERDICTS names", () => {
  const bad = new Map([...code.matchAll(/\["([\w-]+)", "([a-z_]+)"\]/g)].map(([, v, e]) => [v, e]));
  assert.equal(bad.size, 10);
  const want: Record<string, string> = { swap: "verdicts_not_sorted_unique", judged: "already_judged", old: "bad_judgement_age", drop: "bad_votes_count", repeat: "judgements_not_sorted_unique", unsign: "bad_signature", split: "bad_vote_split", resized: "bad_votes_count" };
  for (const b of BREAKS) {
    const r = verdictError(b.apply(PASSING), b.judges ?? TINY);
    assert.ok(r, `${b.id} breaks a rule`);
    assert.equal(r.error, want[b.id], b.id);
    assert.equal(bad.get(r.vector), r.error, `${r.vector} shows ${r.error}`);
  }
  assert.equal(verdictError(BREAKS.find((b) => b.id === "resized")!.apply(PASSING), RESIZED)!.vector, "progress_with_verdicts_from_resized_previous_set-2");
});

test("the check questions: 1 of 5 valid is bad_vote_split; κ of 1,023 needs 683; age 1 in epoch 3 is too old", () => {
  assert.equal(twoThirdsPlusOne(6), 5);
  assert.equal(twoThirdsPlusOne(1023), 683);
  assert.match(raw.replace(/\s+/g, " "), /1 is not 5, 0 or 2, so the split means nothing/);
  assert.match(raw.replace(/\s+/g, " "), /⌊2 · 1,023\/3⌋ \+ 1 = 683/);
  const old = [{ ...PASSING[0], age: 1 }];
  assert.equal(verdictError(old, TINY, 3)!.error, "bad_judgement_age");
  assert.equal(verdictError([{ ...PASSING[0], age: 2 }], TINY, 3), null, "the epoch before is fine");
  assert.equal(EPOCH, 0);
});

test("lesson 10.4 places the widget once, at the top, before The idea; The code keeps the seven lines paragraph", () => {
  const at = raw.indexOf("<VerdictRules />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<VerdictRules />"), "placed once");
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  const lines = raw.indexOf("names the same one as the vector, for every disputes vector.");
  assert.ok(lines > raw.indexOf("## The code") && lines < raw.indexOf("> [!NOTE]", raw.indexOf("## The code")));
});
