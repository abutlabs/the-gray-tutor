// Lesson 7.2's shuffle-steps widget (.vitepress/theme/shuffle-steps.ts): its two decks are
// the lesson's table and its shuffle-eight run, pick for pick, and splice deals the hand the
// lesson's Break it on purpose says.

import { test } from "node:test";
import assert from "node:assert/strict";
import { DECKS, picks, shuffled } from "../.vitepress/theme/shuffle-steps.ts";
import { lessonCode, lessonText } from "./lessons.ts";

const LESSON = "07-time-and-shuffling/02-the-shuffle.md";
const raw = lessonText(LESSON);
const [LETTERS, EIGHT] = DECKS;

test("a b c d with 1, 1, 0, 0 deals b, d, a, c, step for step as the lesson's table", () => {
  assert.match(lessonCode("7.2"), /shuffle\(\["a", "b", "c", "d"\], \[1, 1, 0, 0\]\);\s*assert\.deepEqual\(shuffled, \["b", "d", "a", "c"\]\);/);
  assert.deepEqual(shuffled(LETTERS), ["b", "d", "a", "c"]);
  const rows = [...raw.matchAll(/^\| (\d) \| ([a-d ]+) \| (\d) \| \d mod (\d) = (\d) \| ([a-d]) \| (.+?) \|$/gm)];
  assert.equal(rows.length, 4);
  const steps = picks(LETTERS);
  for (const [, n, left, number, l, index, pick, then] of rows) {
    const s = steps[Number(n) - 1];
    assert.deepEqual([s.left.join(" "), s.number, s.l, s.index, s.picked], [left.trim(), Number(number), Number(l), Number(index), pick], `step ${n}`);
    if (s.filler) assert.ok(then.startsWith(`${s.filler} fills`), `step ${n}: ${then}`);
  }
});

test("0 to 7 with the all-ff hash's numbers deals the shuffle-eight run, and its third pick is 6", () => {
  const lines = [...raw.matchAll(/^\s*(\d+) mod\s+(\d) = (\d): pick (\d)$/gm)].map(([, number, l, index, pick]) => ({ number: Number(number), l: Number(l), index: Number(index), pick }));
  assert.equal(lines.length, 8);
  assert.deepEqual(EIGHT.numbers, lines.map((x) => x.number));
  const steps = picks(EIGHT);
  for (const [k, x] of lines.entries()) assert.deepEqual([steps[k].l, steps[k].index, steps[k].picked], [x.l, x.index, x.pick], `pick ${k + 1}`);
  assert.match(raw, /^shuffled: 1, 2, 6, 0, 7, 4, 3, 5$/m);
  assert.deepEqual(shuffled(EIGHT), ["1", "2", "6", "0", "7", "4", "3", "5"]);
  assert.deepEqual([steps[2].index, steps[2].picked, steps[2].left.join(" ")], [2, "6", "0 7 6 3 4 5"], "the check question: what's left is 0 7 6 3 4 5");
});

test("closing the gap with splice deals b, c, a, d: fair, but not JAM's", () => {
  assert.match(raw.replace(/\s+/g, " "), /the letters come out b, c, a, d/);
  assert.deepEqual(shuffled(LETTERS, true), ["b", "c", "a", "d"]);
  assert.notDeepEqual(shuffled(EIGHT, true), shuffled(EIGHT));
});

test("lesson 7.2 places the widget once, after the shuffle figure", () => {
  const at = raw.indexOf("<ShuffleSteps />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<ShuffleSteps />"), "placed once");
  assert.ok(at > raw.indexOf("02-shuffle-steps.svg") && at < raw.indexOf("**Q_l(h)**"));
});

test("every pick's division checks: quotient × l + index is the number, and the index is under l", () => {
  for (const deck of DECKS) for (const splice of [false, true]) for (const s of picks(deck, splice)) {
    assert.equal(s.quotient * s.l + s.index, s.number, `${deck.name}: ${s.number} ÷ ${s.l}`);
    assert.ok(s.index >= 0 && s.index < s.l);
    assert.equal(s.after.length, s.l - 1);
  }
});
