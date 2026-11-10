// Lesson 17.6's merge widget (.vitepress/theme/merge-rule.ts): R is the lesson's, the test's
// runs merge to [5, 7] with core 1's queue kept, and the checks' R(1, 5, 7) and R(1, 1, 7) come out.

import { test } from "node:test";
import assert from "node:assert/strict";
import { BEFORE, merge, R, TEST } from "../.vitepress/theme/merge-rule.ts";
import { lessonCode, lessonText } from "./lessons.ts";

const raw = lessonText("17-accumulation/06-who-wins.md");
const code = lessonCode("17.6");

test("R is the lesson's: b if a = o, otherwise a", () => {
  // the paper's (12.19), quoted, and the lesson's reading of it
  assert.match(raw, /R\(o, a, b\) \\equiv \\begin\{cases\}\nb &\\text\{if \} a = o \\\\\na &\\text\{otherwise\}/);
  assert.match(raw.replace(/\s+/g, " "), /if the manager left it as it was \(a = o\), the holder's choice b wins; otherwise the manager's a does/);
  assert.match(code, /assign: before\.assign\.map\(\(o, c\) => R\(o, manager\.assign\[c\], post\(o\)\.assign\[c\]\)\),/);
  assert.deepEqual([R(1, 5, 7), R(1, 1, 7)], [5, 7]);
});

test("the test: before [1, 1], manager [5, 1], holder [7, 7] merge to [5, 7], with core 1's queue only", () => {
  assert.match(code, /const before: Privileges = \{ bless: 0, assign: \[1, 1\], designate: 0, register: 0 \};/);
  assert.deepEqual(BEFORE, [1, 1]);
  assert.match(code, /\[0, left\(\[5, 1\]\)\]/);
  assert.match(code, /\[1, left\(\[7, 7\], new Map\(\[\[1, queue\]\]\)\)\]/);
  const rows = merge(TEST);
  assert.deepEqual(rows.map((r) => r.after), [5, 7]);
  assert.deepEqual(rows.filter((r) => r.queue).map((r) => r.core), [1]);
  assert.match(code, /assert\.deepEqual\(after\.privileges\.assign, \[5, 7\]\);/);
});

test("lesson 17.6 places the widget once, after R", () => {
  const at = raw.indexOf("<MergeRule />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<MergeRule />"));
  assert.ok(at > raw.indexOf("where e* is the manager's run.") && at < raw.indexOf("## The tests"));
});
