// Lesson 16.3's grow_heap widget (.vitepress/theme/grow-heap.ts): a, b and h are the lesson's
// formulas on tinyCode, and both tests come out: 50 for 275, then 53 for 275 + 3 × 121.

import { test } from "node:test";
import assert from "node:assert/strict";
import { A, B, growHeap, H0 } from "../.vitepress/theme/grow-heap.ts";
import { lessonCode, lessonText } from "./lessons.ts";

const raw = lessonText("16-host-calls/03-growing-the-heap.md");
const code = lessonCode("16.3");

test("a, b and h are the lesson's, on tinyCode", () => {
  assert.match(code, /const a = \(2 \* ZONE \+ roundUp\(code\.readOnly\.length, ZONE\)\) \/ PAGE_SIZE;/);
  assert.match(code, /const b = \(2 \*\* 32 - 3 \* ZONE - INPUT_SIZE - roundUp\(code\.stackSize, PAGE_SIZE\)\) \/ PAGE_SIZE;/);
  assert.match(code, /readOnly: Uint8Array\.of\(1, 2, 3\),\s+readWrite: Uint8Array\.of\(4, 5\),\s+heapPages: 1,\s+stackSize: 100,/);
  assert.deepEqual([A, H0], [48, 50]);
  assert.equal(B, (2 ** 32 - 3 * 2 ** 16 - 2 ** 24 - 4096) / 4096);
  assert.match(raw.replace(/\s+/g, " "), /a is \(2 · 65,536 \+ 65,536\) \/ 4,096 = 48\. w takes page 48 and the heap page 49, so h is 50/);
});

test("the tests: asking for 0 reports 50 for 275; asking for 53 grows 3 pages for 638", () => {
  assert.deepEqual([growHeap(50, 0).r7, growHeap(50, 0).gas, growHeap(50, 0).grew], [50, 275, false]);
  assert.match(code, /assert\.deepEqual\(\[machine\.registers\[7\], machine\.gas\], \[50n, 10_000n - 275n\]\);/);
  const grown = growHeap(50, 53);
  assert.deepEqual([grown.r7, grown.gas, grown.after], [53, 275 + 3 * 121, 53]);
  assert.match(code, /\[53n, 10_000n - 275n - 3n \* 121n\]/);
  assert.equal(growHeap(50, B + 1).r7, 50, "past b: just h");
  assert.equal(growHeap(53, 51).r7, 53, "less than h: just h");
});

test("lesson 16.3 places the widget once, at the top, and grow_heap's rules send the reader back to it", () => {
  const at = raw.indexOf("<GrowHeap />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<GrowHeap />"));
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  const back = raw.indexOf("(#try-it)", raw.indexOf("works out the pages first, then the price."));
  assert.ok(back > 0 && back < raw.indexOf("## The tests"));
});
