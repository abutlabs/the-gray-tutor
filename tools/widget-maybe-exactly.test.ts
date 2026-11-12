// Lesson 4.5's maybe-exactly widget (.vitepress/theme/maybe-exactly.ts): its bytes are the
// lesson's two tests', and the seq it compares against is lesson 2.5's.

import { test } from "node:test";
import assert from "node:assert/strict";
import { ITEMS, listCells, optionCells, U32_MAX } from "../.vitepress/theme/maybe-exactly.ts";
import { lessonCode, lessonText } from "./lessons.ts";

const LESSON = "04-blocks/05-maybe-and-exactly-n.md";
const code = lessonCode("4.5");
const hex = (cells: { byte: number }[]) => `0x${cells.map((c) => c.byte.toString(16).padStart(2, "0")).join("")}`;

test("an option is 0, or 1 and the value: the lesson's first test", () => {
  assert.match(code, /assert\.equal\(noneHex, "0x00"\);/);
  assert.match(code, /assert\.equal\(someHex, "0x0107000000"\);/);
  assert.equal(hex(optionCells(null)), "0x00");
  assert.equal(hex(optionCells(7n)), "0x0107000000");
  assert.deepEqual(optionCells(7n).map((c) => c.job), ["tag", "value", "value", "value", "value"]);
  assert.equal(hex(optionCells(0n)), "0x0100000000", "zero is a value, not nothing");
  assert.equal(U32_MAX, 4294967295n);
});

test("a fixed-length sequence is the same six bytes as seq, minus the count: the second test, and 2.5's", () => {
  assert.match(code, /assert\.equal\(fixedHex, "0x010002000300"\);/);
  assert.deepEqual(ITEMS, [1n, 2n, 3n]);
  assert.equal(hex(listCells(true)), "0x010002000300");
  assert.equal(hex(listCells(false)), "0x03010002000300");
  assert.match(lessonCode("2.5"), /assert\.equal\(seqHex, "0x03010002000300"\);/);
  assert.equal(listCells(false)[0].job, "count");
  assert.deepEqual(listCells(true).map((c) => c.job), Array(6).fill("item"));
});

test("lesson 4.5 places the widget once, at the top, and The tests send the reader back to it after the bytes block", () => {
  const raw = lessonText(LESSON);
  const at = raw.indexOf("<MaybeExactly />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<MaybeExactly />"), "placed once");
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  const back = raw.indexOf("[at the top](#try-it)");
  assert.ok(back > raw.indexOf("[1, 2, 3] as exactly three u16s") && back < raw.indexOf("## The code"));
});
