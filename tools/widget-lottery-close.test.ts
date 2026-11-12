// Lesson 8.4's lottery-close widget (.vitepress/theme/lottery-close.ts): its Y and E are
// the lesson's config, its cases the lesson's boundary test, its lottery run and its
// check questions.

import { test } from "node:test";
import assert from "node:assert/strict";
import { E, hasMark, lotteryCloses, PRESETS, sealedByTickets, verdict, Y } from "../.vitepress/theme/lottery-close.ts";
import { lessonCode, lessonText } from "./lessons.ts";

const LESSON = "08-safrole/04-the-lotterys-winners.md";
const raw = lessonText(LESSON);
const code = lessonCode("8.4");

test("Y is 10 and E is 12 on tiny, as the lesson's config says", () => {
  assert.match(code, /name: "tiny",\s*validators_count: 6,\s*core_count: 2,\s*epoch_length: 12,\s*epoch_tail_start: 10,/);
  assert.deepEqual([E, Y], [12, 10]);
});

test("the boundaries: 9 → 10 closes, 10 → 11 doesn't, and a short lottery gives no mark", () => {
  assert.match(code, /ticketsMark\(TINY, 9, 10, full\);\s*assert\.notEqual\(closing, null\);/);
  assert.match(code, /ticketsMark\(TINY, 10, 11, full\);\s*assert\.equal\(closedAlready, null\);/);
  assert.match(code, /ticketsMark\(TINY, 9, 10, full\.slice\(1\)\);\s*assert\.equal\(notFull, null\);/);
  assert.ok(lotteryCloses(9, 10) && hasMark(9, 10, 12));
  assert.ok(!lotteryCloses(10, 11));
  assert.ok(!hasMark(9, 10, 11));
  assert.match(code, /return sameEpoch && phaseOf\(config, before\) < Y && Y <= phaseOf\(config, after\);/);
});

test("3 → 11 carries the mark, and a skipped epoch falls back: the run and the check questions", () => {
  assert.match(raw, /^slot 3 → 11, the lottery closes at phase 10\n12 of 12 tickets: a tickets mark$/m);
  assert.ok(hasMark(3, 11, 12));
  assert.ok(sealedByTickets(11, 12, 12), "the next epoch, straight after a full close");
  assert.ok(!sealedByTickets(11, 25, 12), "an epoch skipped");
  assert.match(verdict(11, 25, 12).sealer, /^the fallback: the chain skipped an epoch/);
  assert.match(raw.replace(/\s+/g, " "), /the winners need e′ = e \+ 1\. Any other new epoch is sealed by(?: >)? \[lesson 8\.3\]/);
  assert.match(code, /const next = epochOf\(config, after\) === epochOf\(config, before\) \+ 1;\s*const closed = phaseOf\(config, before\) >= config\.epoch_tail_start;/);
  assert.ok(!sealedByTickets(9, 12, 12), "the block before was before the close");
  for (const p of PRESETS) assert.ok(p.before < p.after && p.tickets <= E, p.says);
});

test("lesson 8.4 places the widget once, at the top, and the two rules send the reader back to it", () => {
  const at = raw.indexOf("<LotteryClose />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<LotteryClose />"), "placed once");
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  const rules = raw.indexOf("Otherwise it's [lesson 8.3]");
  assert.ok(rules > 0 && raw.indexOf("Try both rules [at the top](#try-it)") > rules);
});
