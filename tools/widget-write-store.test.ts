// Lesson 16.5's write widget (.vitepress/theme/write-store.ts): the gas, the footprint, FULL
// and φ₇ are the lesson's write, and its three tests come out.

import { test } from "node:test";
import assert from "node:assert/strict";
import { minimumBalance, START, write } from "../.vitepress/theme/write-store.ts";
import { lessonCode, lessonText } from "./lessons.ts";

const raw = lessonText("16-host-calls/05-storage.md");
const code = lessonCode("16.5");

test("the rules are the lesson's write", () => {
  assert.match(code, /charge\(m, 2442n \+ memoryGas\(3358, keyLength\) \+ memoryGas\(216, valueLength\)\)/);
  assert.match(code, /const size = \(v: Bytes \| undefined\) => \(v \? 34n \+ BigInt\(key\.length \+ v\.length\) : 0n\);/);
  assert.match(code, /if \(minimumBalance\(after\) > after\.balance\) \{\n\s+m\.registers\[7\] = FULL;/);
  assert.equal(minimumBalance(START), 170);
});

test("the tests: \"last\" → 3 bytes adds an item and 41 bytes for 2,457 gas; 1,000 bytes is FULL at 1,218; an empty value deletes and answers 3", () => {
  const w = write(START, "last", 3);
  assert.deepEqual([w.r7, w.after.items, w.after.bytes, w.gas], ["NONE", 3, 50 + 34 + 4 + 3, 2442 + 14 + 1]);
  assert.match(code, /assert\.equal\(machine\.gas, 10_000n - 2442n - 14n - 1n\);/);
  const full = write(START, "last", 1000);
  assert.deepEqual([full.full, full.r7, full.aT, full.after], [true, "FULL", 1218, START]);
  assert.match(raw.replace(/\s+/g, " "), /a_t to 100 \+ 10 · 3 \+ \(50 \+ 34 \+ 4 \+ 1,000\) = 1,218, more than the balance: FULL/);
  const erased = write(w.after, "last", 0);
  assert.deepEqual([erased.r7, erased.after.items, erased.after.bytes, Object.keys(erased.after.storage)], ["3", 2, 50, []]);
});

test("lesson 16.5 places the widget once, at the top, and FULL sends the reader back to it", () => {
  const at = raw.indexOf("<WriteStore />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<WriteStore />"));
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  const back = raw.indexOf("(#try-it)", raw.indexOf("φ₇ is **FULL** (2^64 − 5)."));
  assert.ok(back > 0 && back < raw.indexOf("## The tests"));
});
