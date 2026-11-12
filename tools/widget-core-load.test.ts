// Lesson 18.2's core-load widget (.vitepress/theme/core-load.ts): the load is the lesson's
// dataLoad, and the test's and run's two cores come out.

import { test } from "node:test";
import assert from "node:assert/strict";
import { ASSURED, available, BUNDLE, dataLoad, pages } from "../.vitepress/theme/core-load.ts";
import { lessonCode, lessonText } from "./lessons.ts";

const raw = lessonText("18-statistics/02-what-cores-and-services-did.md");
const code = lessonCode("18.2");

test("the load is the lesson's dataLoad: the bundle, plus 4104 for each segment and proof page", () => {
  assert.match(code, /const SEGMENT_SIZE = 4104;/);
  assert.match(code, /spec\.length \+ SEGMENT_SIZE \* Math\.ceil\(\(spec\.exports_count \* 65\) \/ 64\)/);
  assert.deepEqual([pages(3), pages(64), pages(65)], [4, 65, 67]);
  assert.match(raw, /Three segments: ⌈3\.046875⌉ = 4\./);
});

test("the test and the run: core 0 is 12345 + 4104 × 4 with 5 assurances; core 1, 4 and nothing", () => {
  assert.match(code, /\[12345 \+ 4104 \* 4, 5\]/);
  assert.match(code, /\[0, 4\]\); \/\/ 4 of 6 isn't enough/);
  assert.deepEqual(ASSURED, [5, 4]);
  assert.equal(dataLoad(BUNDLE, 3), 12345 + 4104 * 4);
  assert.match(raw, /^core 0: da_load 28761, popularity 5$/m);
  assert.equal(dataLoad(BUNDLE, 3), 28761);
  assert.deepEqual([available(5), available(4)], [true, false]);
});

test("lesson 18.2 places the widget once, at the top, and the D(c) example sends the reader back to it", () => {
  const at = raw.indexOf("<CoreLoad />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<CoreLoad />"));
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  const back = raw.indexOf("(#try-it)", raw.indexOf("Three segments: ⌈3.046875⌉ = 4."));
  assert.ok(back > 0 && back < raw.indexOf("## The tests"));
});
