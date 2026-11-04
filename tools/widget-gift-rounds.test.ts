// Lesson 17.4's rounds widget (.vitepress/theme/gift-rounds.ts): every number is the
// lesson's tests, figure and run.

import { test } from "node:test";
import assert from "node:assert/strict";
import { GIFT, phases, RECEIVER_BEFORE } from "../.vitepress/theme/gift-rounds.ts";
import { lessonCode, lessonText } from "./lessons.ts";

const raw = lessonText("17-accumulation/04-rounds.md");
const code = lessonCode("17.4");

test("the gift: 100 into 227,714, with 80,000 gas and the memo \"gift\", as the figure says", () => {
  assert.match(code, /assert\.equal\(received, 227_714n \+ 100n\);/);
  assert.equal(RECEIVER_BEFORE, 227_714);
  assert.match(raw, /sends service 1 a transfer of 100 with the memo "gift" and 80,000 gas/);
  assert.deepEqual([GIFT.amount, GIFT.gas, GIFT.memo], [100, 80_000, "gift"]);
});

test("the statistics after the rounds: (1, 0, 255,437) and (0, 1, 61,711), as the run and the test say; no code, (0, 1, 0)", () => {
  const end = phases(true).at(-1)!;
  assert.deepEqual(end.stats[0], { count: 1, transfers: 0, gas: 255_437 });
  assert.deepEqual(end.stats[1], { count: 0, transfers: 1, gas: 61_711 });
  assert.match(raw, /^service 0: 1 digest\(s\), 0 transfer\(s\), 255437 gas$/m);
  assert.match(raw, /^service 1: 0 digest\(s\), 1 transfer\(s\), 61711 gas$/m);
  assert.match(code, /assert\.deepEqual\(stats, \{ count: 0, transfers: 1, gasUsed: 61_711n \}\);/);
  const noCode = phases(false).at(-1)!;
  assert.deepEqual([noCode.stats[1].gas, noCode.balance1], [0, 227_814]);
  assert.match(code, /assert\.equal\(used, 0n\);/);
});

test("the money comes first: the balance rises before service 1 runs", () => {
  const all = phases(true);
  const first = all.findIndex((p) => p.balance1 === RECEIVER_BEFORE + 100);
  const runs = all.findIndex((p) => p.stats[1]);
  assert.ok(first > 0 && first < runs);
});

test("lesson 17.4 places the widget once, under the figure", () => {
  const at = raw.indexOf("<GiftRounds />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<GiftRounds />"));
  assert.ok(at > raw.indexOf("(./images/04-rounds.svg)") && at < raw.indexOf("In the Gray Paper the loop is"));
});
