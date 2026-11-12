// Lesson 2.3's reader-walk widget (.vitepress/theme/reader-walk.ts): its bytes are the
// lesson's test's, its reads give the test's values, and its wrong-order read is the
// lesson's 491,538 at offset 3.

import { test } from "node:test";
import assert from "node:assert/strict";
import { BYTES, decodeFixed, decodeNatural, IN_ORDER, inStep, OPS, PIECES, readAt } from "../.vitepress/theme/reader-walk.ts";
import { compact } from "../.vitepress/theme/compact.ts";
import { lessonCode, lessonText } from "./lessons.ts";

const LESSON = "02-codec/03-writer-and-reader.md";
const code = lessonCode("2.3");
const text = lessonText(LESSON).replace(/\s+/g, " ");
const hex = (b: number[]) => `0x${b.map((x) => x.toString(16).padStart(2, "0")).join("")}`;

test("the widget's bytes are what the lesson's Writer writes, and its pieces the three calls", () => {
  assert.match(code, /assert\.equal\(written, "0xc7128080deadbeef"\);/);
  assert.equal(hex(BYTES), "0xc7128080deadbeef");
  for (const p of PIECES) assert.ok(code.includes(p.call), `the test calls ${p.call}`);
  assert.deepEqual(PIECES[1].bytes, compact(128n).bytes, "128 as the theme's compact natural");
});

test("read in the writer's order, the three values come back, each in step", () => {
  assert.deepEqual(IN_ORDER.map((r) => r.value), ["4807n", "128n", "0xdeadbeef"]);
  assert.deepEqual(IN_ORDER.map((r) => r.length), [2, 2, 4]);
  assert.match(code, /assert\.equal\(fixed, 4807n\);[\s\S]*assert\.equal\(natural, 128n\);[\s\S]*fromHex\("0xdeadbeef"\)/);
  for (const r of IN_ORDER) assert.ok(inStep(r), `${r.op} at ${r.from} is in step`);
  assert.equal(IN_ORDER.reduce((n, r) => n + r.length, 0), BYTES.length, "every byte used once");
});

test("a natural read first takes c7 12 80 as 491,538 and leaves #at at 3: the lesson's sentence", () => {
  const wrong = readAt("natural()", 0)!;
  assert.deepEqual([wrong.value, wrong.length], ["491538n", 3]);
  assert.ok(!inStep(wrong));
  assert.match(text, /`c7 12 80`,(?: >)? as 491,538\. The next read would then start at offset 3/);
  assert.deepEqual(decodeNatural([0x80, 0x80], 0), { value: 128n, length: 2 });
  assert.equal(decodeFixed([0xc7, 0x12]), 4807n);
});

test("a read that would run past the end is refused, so every op is tried from everywhere", () => {
  for (const op of OPS) for (let at = 0; at <= BYTES.length; at++) {
    const r = readAt(op, at);
    if (r) assert.ok(r.from + r.length <= BYTES.length, `${op} at ${at} stays inside`);
  }
  assert.equal(readAt("bytes(4)", 6), null);
  assert.equal(readAt("fixed(2)", 8), null);
});

test("lesson 2.3 places the widget once, at the top to try, before The idea; The Reader sends back to it", () => {
  const raw = lessonText(LESSON);
  const at = raw.indexOf("<ReaderWalk />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<ReaderWalk />"), "placed once");
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  const back = raw.indexOf("[at the top](#try-it)");
  assert.ok(back > raw.indexOf("## The Reader") && back < raw.indexOf("**Run**", raw.indexOf("## The Reader")));
});
