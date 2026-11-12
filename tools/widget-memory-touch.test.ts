// Lesson 15.4's memory-touch widget (.vitepress/theme/memory-touch.ts): its pages and
// outcomes are the lesson's tests', its rule the lesson's check.

import { test } from "node:test";
import assert from "node:assert/strict";
import { accessAt, PAGE_SIZE, pageOf, PAGES, PANIC_BELOW, PRESETS, touch } from "../.vitepress/theme/memory-touch.ts";
import { lessonCode, lessonText } from "./lessons.ts";

const LESSON = "15-the-pvm/04-memory.md";
const raw = lessonText(LESSON);
const code = lessonCode("15.4");

test("pages are 4,096 bytes, one writable at 0x20000 and one read-only at 0x10000, as the tests add them", () => {
  assert.match(code, /export const PAGE_SIZE = 4096;/);
  assert.equal(PAGE_SIZE, 4096);
  assert.match(code, /addPages\(memory, 0x20000, 4096, "W"\);/);
  assert.match(code, /addPages\(memory, 0x10000, 4096, "R"\);/);
  assert.deepEqual(PAGES, [{ start: 0x10000, access: "R" }, { start: 0x20000, access: "W" }]);
  assert.equal(pageOf(0x20000), 0x20);
  assert.equal(accessAt(0x20fff), "W");
  assert.equal(accessAt(0x21000), null);
});

test("the tests' outcomes: a fault at 0x30000, a panic at 0x0100, a fault writing the read-only page", () => {
  assert.match(code, /assert\.deepEqual\(farExit, \{ fault: 0x30000 \}\);/);
  assert.deepEqual(touch(0x30005, 1, false), { ok: false, fault: 0x30000 });
  assert.match(code, /assert\.equal\(lowExit, "panic"\);/);
  assert.deepEqual(touch(0x0100, 1, false), { ok: false, panic: true });
  assert.match(code, /assert\.deepEqual\(exit, \{ fault: 0x10000 \}\);/);
  assert.deepEqual(touch(0x10000, 1, true), { ok: false, fault: 0x10000 });
  assert.deepEqual(touch(0x10000, 1, false), { ok: true }, "reading the read-only page is fine");
  assert.deepEqual(touch(0x20000, 8, false), { ok: true });
  assert.deepEqual(touch(0x20ffc, 8, false), { ok: false, fault: 0x21000 }, "the lowest bad byte is on the next page");
  assert.equal(PANIC_BELOW, 0x10000);
  assert.match(raw.replace(/\s+/g, " "), /0x10000 is 2\^16 exactly\. A panic is only for addresses \*below\* 2\^16/);
  for (const p of PRESETS) assert.ok(p.width >= 1 && p.address >= 0, p.says);
});

test("lesson 15.4 places the touch widget once, at the top, and the instruction families send the reader back to it", () => {
  const at = raw.indexOf("<MemoryTouch />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<MemoryTouch />"), "placed once");
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  const back = raw.indexOf("(#try-it)", raw.indexOf("A store keeps only the low bytes"));
  assert.ok(back > 0 && back < raw.indexOf("## The tests"));
});
