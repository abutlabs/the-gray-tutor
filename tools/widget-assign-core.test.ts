// Lesson 17.5's assign widget (.vitepress/theme/assign-core.ts): the checks are the lesson's
// assign, in its order, and its two tests come out.

import { test } from "node:test";
import assert from "node:assert/strict";
import { assign, NOBODY, START } from "../.vitepress/theme/assign-core.ts";
import { lessonCode, lessonText } from "./lessons.ts";

const raw = lessonText("17-accumulation/05-privileges.md");
const code = lessonCode("17.5");

test("the checks are the lesson's, in its order: CORE, then HUH, then WHO", () => {
  assert.match(code, /if \(c >= BigInt\(cores\)\) return setTo\(m, CORE\);\n[\s\S]*?if \(privileges\.assign\[Number\(c\)\] !== s\) return setTo\(m, HUH\);\n\s+if \(to >= 2n \*\* 32n\) return setTo\(m, WHO\);/);
  assert.match(code, /if \(!charge\(m, 1818\)\)/);
  assert.match(code, /const ZERO_HOLDS_ALL: Privileges = \{ bless: 0, assign: \[0, 0\], designate: 0, register: 0 \};/);
  assert.deepEqual(START.assign, [0, 0]);
});

test("the tests: core 0 to service 1 is OK and [1, 0]; CORE, HUH and WHO change nothing; asking again after is HUH", () => {
  const r = assign(START, 0, 0, 1);
  assert.deepEqual([r.answer, r.state.assign], ["OK", [1, 0]]);
  assert.equal(assign(START, 0, 2, 1).answer, "CORE");
  assert.equal(assign(START, 5, 0, 1).answer, "HUH");
  assert.equal(assign(START, 0, 0, NOBODY).answer, "WHO");
  for (const [c, k, n] of [[0, 2, 1], [5, 0, 1], [0, 0, NOBODY]]) assert.deepEqual(assign(START, c, k, n).state.assign, [0, 0]);
  assert.equal(assign(r.state, 0, 0, 1).answer, "HUH");
  assert.match(raw.replace(/\s+/g, " "), /if it asked again, it would get `HUH`/);
});

test("lesson 17.5 places the widget once, after the hand-over", () => {
  const at = raw.indexOf("<AssignCore />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<AssignCore />"), "placed once");
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  const back = raw.indexOf("(#try-it)", raw.indexOf("It costs 1,818 gas."));
  assert.ok(back > 0 && back < raw.indexOf("And the checkpoint rule holds again"));
});
