// Lesson 17.7's eject widget (.vitepress/theme/eject-service.ts): the checks are the lesson's
// eject, its tests come out, and the check question's 42 and 43.

import { test } from "node:test";
import assert from "node:assert/strict";
import { D, eject, FORGOTTEN_AT, START } from "../.vitepress/theme/eject-service.ts";
import { lessonCode, lessonText } from "./lessons.ts";

const raw = lessonText("17-accumulation/07-ejecting-a-service.md");
const code = lessonCode("17.7");

test("the rules are the lesson's", () => {
  assert.match(code, /if \(slots\.length !== 2 \|\| slots\[1\] >= t - D\) return setTo\(m, HUH\);/);
  assert.match(code, /const other = Number\(d\) === a\.id \? undefined : a\.accounts\.get\(Number\(d\)\);/);
  assert.match(code, /zombie\.requests = new Map\(\[\[`\$\{toHex\(HASH\)\}:20`, \[5, 10\]\]\]\);/);
  assert.deepEqual([D, FORGOTTEN_AT], [32, 10]);
});

test("the tests: OK at 100, 2,000 and service 1 gone, then WHO; WHO for itself and for 5; HUH at 10 + 32", () => {
  const r = eject(START, 1, 100);
  assert.deepEqual([r.answer, r.state.balance0, r.state.one], ["OK", 2000, null]);
  assert.equal(eject(r.state, 1, 100).answer, "WHO");
  assert.equal(eject(START, 0, 100).answer, "WHO");
  assert.equal(eject(START, 5, 100).answer, "WHO");
  assert.equal(eject(START, 1, 10 + 32).answer, "HUH");
  assert.match(raw.replace(/\s+/g, " "), /at slot 42 it isn't, by one slot: 10 < 42 − 32 is false/);
  assert.equal(eject(START, 1, 43).answer, "OK");
});

test("lesson 17.7 places the widget once, after step 4", () => {
  const at = raw.indexOf("<EjectService />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<EjectService />"), "placed once");
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  const back = raw.indexOf("(#try-it)", raw.indexOf("It costs 458 gas."));
  assert.ok(back > 0 && back < raw.indexOf("Why such a fuss?"));
});
