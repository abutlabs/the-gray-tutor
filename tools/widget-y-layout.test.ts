// Lesson 15.8's memory-layout widget (.vitepress/theme/y-layout.ts): its constants are the
// lesson's, TINY_PROGRAM lands where the test's addresses say, and the bootstrap service's
// sections and registers are the start run's.

import { test } from "node:test";
import assert from "node:assert/strict";
import { hex, INPUT_SIZE, layout, pages, PRESETS, touch, ZONE } from "../.vitepress/theme/y-layout.ts";
import { lessonCode, lessonText } from "./lessons.ts";

const LESSON = "15-the-pvm/08-a-real-program.md";
const raw = lessonText(LESSON);
const code = lessonCode("15.8");
const tiny = layout(PRESETS[0].sizes);
const bootstrap = layout(PRESETS[1].sizes);
const at = (address: number) => tiny.rows.find((r) => r.from <= address && address < r.to)!;

test("the constants and the presets are the lesson's", () => {
  assert.match(code, /export const ZONE = 2 \*\* 16;/);
  assert.match(code, /export const INPUT_SIZE = 2 \*\* 24;/);
  assert.deepEqual([ZONE, INPUT_SIZE], [2 ** 16, 2 ** 24]);
  assert.match(code, /readOnly: Uint8Array\.from\(\[1, 2, 3\]\),\s+readWrite: Uint8Array\.from\(\[4, 5\]\),\s+heapPages: 1,\s+stackSize: 100,/);
  assert.match(code, /standardProgram\(TINY_PROGRAM, Uint8Array\.from\(\[9\]\)\)/);
  assert.deepEqual(PRESETS[0].sizes, { o: 3, w: 2, z: 1, s: 100, a: 1 });
  assert.match(lessonText("15-the-pvm/01-the-program-blob.md"), /read-only data 9904, read-write 48, heap pages 2, stack 8192/);
  assert.deepEqual(PRESETS[1].sizes, { o: 9904, w: 48, z: 2, s: 8192, a: 3 });
});

test("TINY_PROGRAM: every address the test touches is where it says", () => {
  assert.equal(at(0x10000).access, "R");
  assert.equal(touch(tiny.rows, 0x10000), "readable, not writable");
  assert.equal(at(0x30000).access, "W");
  assert.equal(at(0x31fff).access, "W", "the heap page, after w's page");
  assert.equal(at(0xfefdf000).access, "W", "the stack's one page");
  assert.equal(at(0xfeff0000).access, "R", "the arguments");
  assert.equal(touch(tiny.rows, 0x32000), "no page: a fault at 0x00032000");
  assert.equal(touch(tiny.rows, 0x0100), "a panic: below 2^16");
  assert.deepEqual(tiny.registers, { r0: 2 ** 32 - 2 ** 16, r1: 0xfefe0000, r7: 0xfeff0000, r8: 1 });
  assert.match(code, /assert\.equal\(registers\[1\], 0xfefe0000n\);/);
  assert.match(code, /assert\.equal\(registers\[7\], 0xfeff0000n\);/);
});

test("the bootstrap service: the start run's four sections and its registers", () => {
  const run = [...raw.matchAll(/^ {2}(0x[0-9a-f]{8}) to (0x[0-9a-f]{8}) {2}([RW]) {2}(\d+) page\(s\)$/gm)];
  assert.equal(run.length, 4);
  const sections = bootstrap.rows.filter((r) => r.access);
  assert.deepEqual(sections.map((r) => [hex(r.from), hex(r.to - 1), r.access, pages(r)]), run.map((m) => [m[1], m[2], m[3], Number(m[4])]));
  const regs = /^registers: r0 = (0x[0-9a-f]{8}), r1 = (0x[0-9a-f]{8}), r7 = (0x[0-9a-f]{8}), r8 = (\d+)$/m.exec(raw)!;
  const { r0, r1, r7, r8 } = bootstrap.registers;
  assert.deepEqual([hex(r0), hex(r1), hex(r7), String(r8)], regs.slice(1));
});

test("the rows cover the address space once, in order, with a gap between every two sections", () => {
  for (const { rows } of [tiny, bootstrap, layout({ o: 0, w: 0, z: 0, s: 0, a: 0 }), layout({ o: 70000, w: 5000, z: 3, s: 1, a: 4097 })]) {
    assert.equal(rows[0].from, 0);
    assert.equal(rows.at(-1)!.to, 2 ** 32);
    rows.forEach((r, k) => {
      assert.ok(r.to > r.from, "no empty rows");
      if (k) assert.equal(r.from, rows[k - 1].to, "back to back");
      if (k && r.access) assert.equal(rows[k - 1].access, null, "a section always follows a gap");
      if (r.access) assert.equal(r.from % 4096, 0, "sections start on pages");
    });
  }
});

test("lesson 15.8 places the widget once, at the top, and the layout table sends the reader back to it", () => {
  const where = raw.indexOf("<YLayout />");
  assert.ok(where > 0 && where === raw.lastIndexOf("<YLayout />"), "placed once");
  assert.ok(where > raw.indexOf('<a id="try-it"></a>') && where < raw.indexOf("## The idea"));
  const back = raw.indexOf("(#try-it)", raw.indexOf("panics below 2^16 ([lesson 15.4]"));
  assert.ok(back > 0 && back < raw.indexOf("And the registers: r0 = 2^32"));
});
