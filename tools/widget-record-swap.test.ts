// Lesson 2.5's record-swap widget (.vitepress/theme/record-swap.ts): its twelve bytes are
// the lesson's, read right they give the values written, swapped they give the lesson's
// values, and its list is the lesson's test's.

import { test } from "node:test";
import assert from "node:assert/strict";
import { decodeAs, dump, faithful, FIELDS, GAS, ITEMS, RECORD_BYTES, SEQ_BYTES, SLOT, swapped } from "../.vitepress/theme/record-swap.ts";
import { lessonCode, lessonText } from "./lessons.ts";

const LESSON = "02-codec/05-sequences-and-records.md";
const code = lessonCode("2.5");
const text = lessonText(LESSON).replace(/\s+/g, " ");

test("the twelve bytes are the lesson's slot 42 and gas 7, 4 then 8", () => {
  assert.equal(dump(RECORD_BYTES.slice(0, 4)), "2a 00 00 00");
  assert.equal(dump(RECORD_BYTES.slice(4)), "07 00 00 00 00 00 00 00");
  assert.match(text, /2a 00 00 00 slot: 42 as a u32, exactly 4 bytes 07 00 00 00 00 00 00 00 gas: 7 as a u64, exactly 8 bytes/);
  assert.deepEqual(FIELDS.map((f) => `${f.name}: ${f.codec}`), ["slot: u32", "gas: u64"]);
  assert.match(code, /record\(\{ slot: u32, gas: u64 \}\)/);
});

test("in the written order the values come back; swapped, gas reads 30,064,771,114 and slot 0", () => {
  const right = decodeAs(FIELDS);
  assert.deepEqual(right.map((r) => r.value), [SLOT, GAS]);
  assert.ok(faithful(right));
  const wrong = decodeAs(swapped(FIELDS));
  assert.deepEqual(wrong.map((r) => [r.field.name, r.from, r.to, r.value]), [["gas", 0, 8, 30_064_771_114n], ["slot", 8, 12, 0n]]);
  assert.ok(!faithful(wrong));
  assert.match(text, /gas reads `2a 00 00 00 07 00 00 00`, 30,064,771,114, and slot reads four zeros,(?: >)? 0/);
});

test("the list 1, 2, 3 as u16s is its count then its items: the lesson's 0x03010002000300", () => {
  assert.match(code, /assert\.equal\(seqHex, "0x03010002000300"\);/);
  assert.deepEqual(ITEMS, [1n, 2n, 3n]);
  assert.equal(SEQ_BYTES[0].role, "count");
  assert.equal(`0x${SEQ_BYTES.flatMap((g) => g.bytes).map((b) => b.toString(16).padStart(2, "0")).join("")}`, "0x03010002000300");
});

test("lesson 2.5 places the widget once, at the top to try; the Gray Paper's rule sends back to it", () => {
  const raw = lessonText(LESSON);
  const at = raw.indexOf("<RecordSwap />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<RecordSwap />"), "placed once");
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  const back = raw.indexOf("[at the top](#try-it)");
  assert.ok(back > raw.indexOf("## What the Gray Paper says") && back < raw.indexOf("## Sequences"));
});
