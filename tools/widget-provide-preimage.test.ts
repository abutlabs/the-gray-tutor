// Lesson 14.1's provide-preimage widget (.vitepress/theme/provide-preimage.ts): its block
// is the lesson's run, line for line; its history bytes are the lesson's test's; its skips
// are the code's two; its meanings are the lesson's table.

import { test } from "node:test";
import assert from "node:assert/strict";
import { historyBytes, keyOf, MEANS, PREIMAGES, provide, SLOT } from "../.vitepress/theme/provide-preimage.ts";
import { lessonCode, lessonText } from "./lessons.ts";

const LESSON = "14-services/01-providing-preimages.md";
const raw = lessonText(LESSON);
const code = lessonCode("14.1");

test("block 8's four preimages are the run's lines, each [] → [8]", () => {
  assert.match(raw, /^block at slot 8: 4 preimages$/m);
  const lines = [...raw.matchAll(/^service (\d): (\d+) bytes, hash (0x[0-9a-f]+…)\s+request \[\] → \[8\]$/gm)].map(([, s, b, h]) => ({ service: Number(s), bytes: Number(b), hash: h }));
  assert.equal(lines.length, 4);
  assert.deepEqual(PREIMAGES.slice(0, 4).map(({ service, bytes, hash }) => ({ service, bytes, hash })), lines);
  assert.equal(SLOT, 8);
  for (const p of PREIMAGES.slice(0, 4)) assert.deepEqual(provide(p), { provided: true, after: [8], why: provide(p).why });
});

test("a history's bytes are the test's: [] is 00, [5] is 01 05 00 00 00, and the chain wrote [8] as 0x0108000000", () => {
  assert.match(code, /assert\.equal\(waiting, "0x00"\);[\s\S]*assert\.equal\(provided, "0x0105000000"\);/);
  assert.equal(historyBytes([]), "00");
  assert.equal(historyBytes([5]), "01 05 00 00 00");
  assert.equal(historyBytes([8]), "01 08 00 00 00");
  assert.match(raw.replace(/\s+/g, " "), /At block 8 the chain wrote `0x0108000000`, a list of one slot, `\[8\]`/);
});

test("the two skips are the code's: never asked for, and not waiting now", () => {
  assert.match(code, /if \(history === undefined\) continue; \/\/ never asked for\s*if \(decode\(RequestHistory, history\.value\)\.length !== 0\) continue; \/\/ not waiting now/);
  assert.equal(provide(PREIMAGES[4]).provided, false);
  assert.deepEqual(provide(PREIMAGES[4]).after, [5]);
  assert.equal(provide(PREIMAGES[5]).provided, false);
  assert.equal(provide(PREIMAGES[5]).after, null);
  assert.match(keyOf(PREIMAGES[0]), /^requestKey\(0, 0x6ae18b8b…, 143\)$/);
});

test("a history's meaning is the lesson's table, and the check question's [3, 40]", () => {
  assert.equal(MEANS([]), "asked for, still waiting");
  assert.equal(MEANS([5]), "provided at slot 5");
  assert.equal(MEANS([3, 40]), "provided at 3, forgotten at 40");
  assert.match(raw.replace(/\s+/g, " "), /The data was provided at slot 3, and forgotten at slot 40/);
  assert.equal(MEANS([3, 40, 50]), "available again from 50, after 3 until 40");
});

test("lesson 14.1 places the widget once, at the top, and the history table sends the reader back to it", () => {
  const at = raw.indexOf("<ProvidePreimage />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<ProvidePreimage />"), "placed once");
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  const back = raw.indexOf("(#try-it)", raw.indexOf("so nobody can provide the wrong thing."));
  assert.ok(back > 0 && back < raw.indexOf("### What the history is for"));
});
