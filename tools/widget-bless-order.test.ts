// Lesson 17.13's bless widget (.vitepress/theme/bless-order.ts): the byte layout is the
// lesson's bless, and its test and bytes by hand come out.

import { test } from "node:test";
import assert from "node:assert/strict";
import { assignerBytes, entryBytes, gasOf, TEST } from "../.vitepress/theme/bless-order.ts";
import { lessonCode, lessonText } from "./lessons.ts";

const raw = lessonText("17-accumulation/13-blessing-and-designating.md");
const code = lessonCode("17.13");

test("the layout is the lesson's: 4 bytes an assigner, 12 an entry (4 id, 8 gas), 422 + 20 each", () => {
  assert.match(code, /if \(!charge\(m, 422n \+ 20n \* n\)\) return "oog";/);
  assert.match(code, /const assigners = readMemory\(m\.memory, at, 4 \* cores\);/);
  assert.match(code, /free\.set\(Number\(decodeFixed\(entry\.subarray\(0, 4\)\)\), decodeFixed\(entry\.subarray\(4\)\)\);/);
});

test("the test's bytes and result: 02 00 00 00 | 03 00 00 00; 06 00 00 00 e8 03 …; 442 gas", () => {
  assert.match(code, /writeMemory\(memory, 0x20000n, Uint8Array\.of\(2, 0, 0, 0, 3, 0, 0, 0\)\);/);
  assert.deepEqual(assignerBytes(TEST).flat(), [2, 0, 0, 0, 3, 0, 0, 0]);
  assert.match(code, /writeMemory\(memory, 0x20010n, Uint8Array\.of\(6, 0, 0, 0, 0xe8, 3, 0, 0, 0, 0, 0, 0\)\);/);
  assert.deepEqual(entryBytes(TEST).flat(), [6, 0, 0, 0, 0xe8, 3, 0, 0, 0, 0, 0, 0]);
  assert.match(code, /\{ bless: 1, assign: \[2, 3\], designate: 4, register: 5 \}/);
  assert.deepEqual([TEST.manager, TEST.assign, TEST.delegator, TEST.registrar], [1, [2, 3], 4, 5]);
  assert.equal(gasOf(TEST), 442);
  assert.match(raw.replace(/\s+/g, " "), /1,000 is `0x03e8`, so `e8 03` and six zeros/);
});

test("lesson 17.13 places the widget once, at the top, and the bytes by hand send the reader back to it", () => {
  const at = raw.indexOf("<BlessOrder />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<BlessOrder />"));
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  const back = raw.indexOf("(#try-it)", raw.indexOf("so `e8 03` and six zeros)."));
  assert.ok(back > 0 && back < raw.indexOf("`checkBlock` learns to compare the always-accumulate"));
});
