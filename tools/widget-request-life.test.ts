// Lesson 16.9's request widget (.vitepress/theme/request-life.ts): solicit, forget and query
// are the lesson's, and its tests and check questions come out.

import { test } from "node:test";
import assert from "node:assert/strict";
import { apply, D, START } from "../.vitepress/theme/request-life.ts";
import { lessonCode, lessonText } from "./lessons.ts";

const raw = lessonText("16-host-calls/09-asking-for-preimages.md");
const code = lessonCode("16.9");

test("the rules are the lesson's", () => {
  assert.match(code, /if \(slots && slots\.length !== 2\) return setTo\(m, HUH\);/);
  assert.match(code, /items: items \+ 2, bytes: bytes \+ 81n \+ length/);
  assert.match(code, /const expired = \(y: number\) => y < t - D;/);
  assert.match(code, /m\.registers\[7\] = BigInt\(slots\.length\) \+ \(x \?\? 0n\) \* 2n \*\* 32n;/);
  assert.match(code, /if \(!charge\(m, 2193\)\)/);
  assert.equal(D, 32);
});

test("the tests: [] with 4 items and 231 bytes, query 0 and 0; asking twice is HUH; [3] forgotten at 9 is [3, 9], query 2 + 3 · 2^32 and 9", () => {
  const asked = apply(START, "solicit", 7);
  assert.deepEqual([asked.answer, asked.state.history, asked.state.items, asked.state.bytes], ["OK", [], 4, 50 + 81 + 100]);
  const q = apply(asked.state, "query", 7);
  assert.deepEqual([q.r7, q.r8], [0n, 0n]);
  assert.equal(apply(asked.state, "solicit", 8).answer, "HUH");
  assert.equal(apply(asked.state, "forget", 9).state.history, null, "never provided: it just goes");
  const provided = apply(asked.state, "provide", 3).state;
  const forgotten = apply(provided, "forget", 9).state;
  assert.deepEqual(forgotten.history, [3, 9]);
  const q2 = apply(forgotten, "query", 9);
  assert.deepEqual([q2.r7, q2.r8], [2n + 3n * 2n ** 32n, 9n]);
});

test("the check: [3, 9] forgotten at 40 is HUH; at 42 it goes, deposit and all; asked again it's [3, 9, t]", () => {
  const s = { ...START, history: [3, 9], items: 4, bytes: 231 };
  assert.equal(apply(s, "forget", 40).answer, "HUH");
  assert.match(raw, /At slot 42, 9 < 10, and it would go\./);
  const gone = apply(s, "forget", 42).state;
  assert.deepEqual([gone.history, gone.items, gone.bytes], [null, 2, 50]);
  const again = apply(s, "solicit", 50).state;
  assert.deepEqual([again.history, again.items], [[3, 9, 50], 4], "asking again costs no more deposit");
  const reforgotten = apply(again, "forget", 50);
  assert.deepEqual([reforgotten.answer, reforgotten.state.history], ["OK", [50, 50]], "y = 9 < 50 − 32 = 18: [x, y, w] becomes [w, t]");
});

test("lesson 16.9 places the widget once, at the top, and D sends the reader back to it", () => {
  const at = raw.indexOf("<RequestLife />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<RequestLife />"));
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  const back = raw.indexOf("(#try-it)", raw.indexOf("so accumulation's host needs to know it now."));
  assert.ok(back > 0 && back < raw.indexOf("## The tests"));
});
