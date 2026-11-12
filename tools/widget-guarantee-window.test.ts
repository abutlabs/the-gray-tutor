// Lesson 12.4's guarantee-window widget (.vitepress/theme/guarantee-window.ts): its R and C
// are the lessons' config, its window and core rules the lesson's code, and its answers
// the check questions'.

import { test } from "node:test";
import assert from "node:assert/strict";
import { activeCores, assignmentOf, coreError, SIZES, slotError, windowStart } from "../.vitepress/theme/guarantee-window.ts";
import { lessonCode, lessonText } from "./lessons.ts";

const LESSON = "12-guarantees/04-bad-guarantees.md";
const raw = lessonText(LESSON);
const text = raw.replace(/\s+/g, " ");

test("R and C are the lessons' config: 4 and 2 on tiny, 10 and 341 on full", () => {
  const config = lessonCode("12.1");
  assert.match(config, /core_count: 2,[\s\S]*?rotation_period: 4,/);
  assert.match(config, /core_count: 341,[\s\S]*?rotation_period: 10,/);
  assert.deepEqual([SIZES.tiny.R, SIZES.tiny.C, SIZES.full.R, SIZES.full.C], [4, 2, 10, 341]);
});

test("the window is R(⌊τ′/R⌋ − 1) ≤ slot ≤ τ′: at slot 13 on tiny, 8 to 13", () => {
  assert.match(lessonCode("12.4"), /const recent = \(g: G\) => g\.slot >= R \* \(Math\.floor\(slot \/ R\) - 1\);/);
  assert.match(lessonCode("12.4"), /const notFuture = \(g: G\) => g\.slot <= slot;/);
  assert.equal(windowStart("tiny", 13), 8);
  assert.equal(slotError("tiny", 13, 8), null);
  assert.equal(slotError("tiny", 13, 7), "report_epoch_before_last");
  assert.equal(slotError("tiny", 13, 14), "future_report_slot");
  assert.equal(slotError("tiny", 13, 13), null);
  assert.match(text, /R\(⌊13\/4⌋ − 1\) = 8 ≤ slot ≤ 13/);
  assert.equal(assignmentOf("tiny", 13, 8), "M*", "the rotation before: M*");
  assert.equal(assignmentOf("tiny", 13, 12), "M");
});

test("active cores are ⌊|κ′|/3⌋, capped at C: 6 validators keep cores 0 and 1, so core 340 is bad_core_index", () => {
  assert.match(lessonCode("12.4"), /const activeCore = \(g: G\) => core\(g\) < config\.core_count && core\(g\) < validators \/ 3;/);
  assert.equal(activeCores("tiny", 6), 2);
  assert.equal(activeCores("full", 6), 2);
  assert.equal(activeCores("full", 1023), 341);
  assert.equal(coreError("full", 6, 340), "bad_core_index");
  assert.equal(coreError("full", 1023, 340), null);
  assert.equal(coreError("tiny", 6, 2), "bad_core_index");
  assert.match(text, /an active core is below \|κ′\|\/3 = 2/);
});

test("lesson 12.4 places the widget once, at the top, and the window paragraph sends the reader back to it", () => {
  const at = raw.indexOf("<GuaranteeWindow />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<GuaranteeWindow />"), "placed once");
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  const back = raw.indexOf("(#try-it)", raw.indexOf("one from slot 7 is too old."));
  assert.ok(back > 0 && back < raw.indexOf("## The tests"));
});
