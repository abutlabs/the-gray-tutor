// Lesson 1.2's number-kinds widget (.vitepress/theme/number-kinds.ts): its values and
// answers are the lesson's three tests and its check questions, and nothing else.

import { test } from "node:test";
import assert from "node:assert/strict";
import { asBigint, asNumber, bitsOf, exact, MAX_SAFE, PATTERNS, sameAsNumber, signed, unsigned, VALUES, wrongDigits } from "../.vitepress/theme/number-kinds.ts";
import { lessonCode, lessonText } from "./lessons.ts";

const LESSON = "01-bytes-and-numbers/02-numbers.md";
const code = lessonCode("1.2");
const text = lessonText(LESSON).replace(/\s+/g, " ");
const value = (name: string) => VALUES.find((v) => v.name === name)!.value;

test("a number rounds above 2^53: the lesson's first two tests, on the widget's values", () => {
  assert.match(code, /const twoTo64Minus70: number = 2 \*\* 64 - 70;[\s\S]*assert\.equal\(twoTo64Minus70, twoTo64\);/);
  assert.equal(sameAsNumber(value("2^64"), -70n), true, "2^64 − 70 and 2^64 are the same float");
  assert.match(code, /assert\.equal\(twoTo64Minus70, 18446744073709551546n\);/);
  assert.equal(asBigint(value("2^64 − 70")), "18446744073709551546n");
  assert.equal(asNumber(value("2^64 − 70")), "18446744073709552000", "as the lesson's debugger shows it");
  assert.match(text, /both 18446744073709552000/);
  assert.equal(wrongDigits(value("2^64 − 70")).filter(Boolean).length, 4, "its last four digits are not the value's");
});

test("exact up to 2^53 − 1, the lesson's MAX_SAFE_INTEGER, and rounding from 2^53 + 1", () => {
  assert.equal(MAX_SAFE, 2n ** 53n - 1n);
  assert.match(text, /exactly up to 2\^53 − 1 \(that's `Number\.MAX_SAFE_INTEGER`/);
  assert.equal(exact(value("2^53 − 1")), true);
  assert.equal(exact(value("2^53 + 1")), false);
  assert.equal(sameAsNumber(value("2^53 − 1"), -70n), false, "below the line, neighbours differ");
  assert.equal(sameAsNumber(value("2^53 + 1"), -1n), true, "2^53 + 1 rounds onto 2^53");
});

test("the third trap: all 32 bits set is −1 signed, 4294967295 unsigned", () => {
  assert.match(code, /const signed: number = allOnes \| 0;\s*assert\.equal\(signed, -1\);/);
  assert.match(code, /const unsigned: number = signed >>> 0;\s*assert\.equal\(unsigned, 0xffffffff\);/);
  assert.equal(PATTERNS[0].value, 0xffffffff);
  assert.equal(signed(0xffffffff), -1);
  assert.equal(unsigned(0xffffffff), 0xffffffff);
  assert.equal(signed(0x80000000), -(2 ** 31), "the top bit alone is −2^31");
  assert.equal(signed(0x7fffffff), 2 ** 31 - 1);
  assert.equal(bitsOf(0xffffffff), "1".repeat(32));
  assert.equal(bitsOf(0x80000000), "1" + "0".repeat(31));
});

test("lesson 1.2 places the widget once, at the top, under try-it and before The idea", () => {
  const raw = lessonText(LESSON);
  const at = raw.indexOf("<NumberKinds />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<NumberKinds />"), "placed once");
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  assert.ok(raw.indexOf("## The idea") < raw.indexOf("## What the Gray Paper says"));
});
