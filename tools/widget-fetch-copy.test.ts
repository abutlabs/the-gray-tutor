// Lesson 16.2's fetch widget (.vitepress/theme/fetch-copy.ts): every preset is one of the
// lesson's tests, with its φ₇, bytes and gas; the gas table and clamping are its fetch's.

import { test } from "node:test";
import assert from "node:assert/strict";
import { fetchItem, FETCH_GAS, NONE } from "../.vitepress/theme/fetch-copy.ts";
import { lessonCode, lessonText } from "./lessons.ts";

const raw = lessonText("16-host-calls/02-fetch.md");
const code = lessonCode("16.2");

test("the clamping and the gas are the lesson's fetch", () => {
  assert.match(code, /const f = from < BigInt\(v\.length\) \? Number\(from\) : v\.length;/);
  assert.match(code, /const l = z < BigInt\(v\.length - f\) \? Number\(z\) : v\.length - f;/);
  const table = /const FETCH_GAS: \[number, number\]\[\] = \[\n\s+(\[[\s\S]*?)\n\s+\[80, 0\], \/\/ any other item/.exec(code);
  assert.ok(table);
  const rows = [...table[1].matchAll(/\[(\d+), (\d+)\]/g)].map((m) => [Number(m[1]), Number(m[2])]);
  for (const [kind, row] of Object.entries(FETCH_GAS)) assert.deepEqual(row, rows[Number(kind)], `item ${kind}`);
});

test("the tests: all 122 constants; 0 bytes; 2 sevens from byte 30; NONE; a panic", () => {
  const all = fetchItem(0, 0x20000, 0n, 122n);
  assert.deepEqual([all.exit, all.r7, all.landed.length, all.gas], ["halt", 122n, 122, 10_000n - 100n - 390n]);
  const none = fetchItem(0, 0x20000, 0n, 0n);
  assert.deepEqual([none.r7, none.landed], [122n, []]);
  const part = fetchItem(1, 0x20000, 30n, 10n);
  assert.deepEqual([part.r7, part.f, part.l, part.landed], [32n, 30, 2, [7, 7]]);
  assert.match(code, /fetching\(0x20000n, 30n, 10n, 1n\); \/\/ the entropy, from byte 30: 2 left/);
  assert.equal(fetchItem(7, 0x20000, 0n, 10n).r7, NONE);
  assert.equal(fetchItem(0, 0x50000, 0n, 122n).exit, "panic");
  assert.match(raw.replace(/\s+/g, " "), /Item 0 is a flat 390, item 1 a flat 103\./);
});

test("lesson 16.2 places the widget once, at the top, and the copying rule sends the reader back to it", () => {
  const at = raw.indexOf("<FetchCopy />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<FetchCopy />"));
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  const back = raw.indexOf("(#try-it)", raw.indexOf("If the memory\nthere isn't writable, the machine panics."));
  assert.ok(back > 0 && back < raw.indexOf("The price depends on the item"));
});
