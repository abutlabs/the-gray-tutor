// Lesson 7.1's epoch-turn widget (.vitepress/theme/epoch-turn.ts): its E is the lessons',
// its epochs and phases the lesson's tests and check questions, its η values the epochs
// run's Output, line for line.

import { test } from "node:test";
import assert from "node:assert/strict";
import { entropyHistory, EPOCH_LENGTH, epochOf, ETA_AT_EPOCH, historyIn, newEpoch, phaseOf, PRESETS } from "../.vitepress/theme/epoch-turn.ts";
import { lessonCode, lessonText } from "./lessons.ts";

const LESSON = "07-time-and-shuffling/01-epochs.md";
const raw = lessonText(LESSON);
const text = raw.replace(/\s+/g, " ");

test("E is 12 on tiny and 600 on full, and the lesson's test cases come out as it says", () => {
  assert.match(lessonCode("4.6"), /epoch_length: 12/);
  assert.match(lessonCode("4.6"), /epoch_length: 600/);
  assert.deepEqual(EPOCH_LENGTH, { tiny: 12, full: 600 });
  assert.match(lessonCode("7.1"), /epochOf\(TINY, 25\)[\s\S]*\[2, 1\]/);
  assert.deepEqual([epochOf("tiny", 25), phaseOf("tiny", 25)], [2, 1]);
  assert.match(lessonCode("7.1"), /epochOf\(FULL, 1234\)[\s\S]*\[2, 34\]/);
  assert.deepEqual([epochOf("full", 1234), phaseOf("full", 1234)], [2, 34]);
  assert.match(lessonCode("7.1"), /return newEpoch \? entropy\.slice\(0, 3\) : entropy\.slice\(1, 4\);/);
});

test("13 after 11 starts a new epoch with no block at phase 0; 13 after 12 doesn't: the check question", () => {
  assert.ok(newEpoch("tiny", 11, 13));
  assert.ok(!newEpoch("tiny", 12, 13));
  assert.ok(newEpoch("tiny", 11, 12));
  assert.match(text, /e′ = ⌊13 \/ 12⌋ = 1 and e = ⌊11 \/ 12⌋ = 0/);
  for (const size of ["tiny", "full"] as const) for (const p of PRESETS[size]) assert.ok(p.tau < p.slot, p.says);
  assert.ok(PRESETS.tiny.some((p) => p.tau === 11 && p.slot === 13));
});

test("the η values are the epochs run's eight lines, and the history moves as the lesson's rule", () => {
  const lines = [...raw.matchAll(/^slot (\d+): epoch (\d+) begins\. Epoch mark: true\. η₁ is now (0x[0-9a-f]+…)$/gm)];
  assert.equal(lines.length, 8);
  for (const [, slot, epoch, eta] of lines) {
    assert.equal(Number(slot), Number(epoch) * 12);
    assert.equal(ETA_AT_EPOCH[Number(epoch)], eta, `epoch ${epoch}`);
  }
  assert.deepEqual(historyIn(3), [ETA_AT_EPOCH[3], ETA_AT_EPOCH[2], ETA_AT_EPOCH[1]]);
  assert.deepEqual(historyIn(1), [ETA_AT_EPOCH[1], "—", "—"]);
  assert.deepEqual(entropyHistory(["a", "b", "c", "d"], true), ["a", "b", "c"], "moved along: η₃ forgotten");
  assert.deepEqual(entropyHistory(["a", "b", "c", "d"], false), ["b", "c", "d"], "unchanged");
});

test("lesson 7.1 places the widget once, at the top, and What the Gray Paper says sends the reader back to it", () => {
  const at = raw.indexOf("<EpochTurn />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<EpochTurn />"), "placed once");
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"), "at the top, before The idea");
  const back = raw.indexOf("[at the top](#try-it)");
  assert.ok(back > raw.indexOf("## What the Gray Paper says") && back < raw.indexOf("## The tests"));
});
