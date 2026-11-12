// Lesson 0.4's slot clock widget (.vitepress/theme/slot-clock.ts): its constants are the
// lesson's, its moments are the lesson's tests and check questions, and its rounding bug is
// the one the lesson hunts.

import { test } from "node:test";
import assert from "node:assert/strict";
import { divisionOf, JAM_COMMON_ERA, MOMENTS, roundedSlot, SLOT_SECONDS, slotAt, slotsAround, utcOf } from "../.vitepress/theme/slot-clock.ts";
import { lessonCode, lessonText } from "./lessons.ts";

const LESSON = "00-start/04-the-jam-clock.md";
const code = lessonCode("0.4");
const text = lessonText(LESSON).replace(/\s+/g, " ");
const moment = (name: string) => MOMENTS.find((m) => m.name === name)!.ms;
const era = (iso: string) => new Date(iso).getTime() - JAM_COMMON_ERA * 1000;

test("the widget's constants are the lesson's src/time.ts", () => {
  assert.match(code, new RegExp(`export const JAM_COMMON_ERA = ${JAM_COMMON_ERA.toLocaleString("en-US").replace(/,/g, "_")};`));
  assert.match(code, new RegExp(`export const SLOT_SECONDS = ${SLOT_SECONDS};`));
  assert.equal(utcOf(0), "2025-01-01 12:00:00.000", "the era starts at midday on 1 January 2025");
});

test("the widget's moments are the lesson's test moments, with the slots the tests expect", () => {
  const cases = [...code.matchAll(/const (\w+): number = at\("([^"]+)"\);\s*assert\.equal\(\1, (\d+)\);/g)]
    .map(([, , iso, slot]) => ({ ms: era(iso), slot: Number(slot) }));
  assert.equal(cases.length, 4, "four assertions in test/time.test.ts");
  for (const c of cases) {
    assert.ok(MOMENTS.some((m) => m.ms === c.ms), `the widget offers the moment ${c.ms} ms in`);
    assert.equal(slotAt(c.ms), c.slot);
  }
  assert.equal(slotAt(moment("a day in")), 14_400, "the check question's day");
  assert.match(text, /86,400 seconds \/ 6 = 14,400 slots/);
});

test("the planted bug: Math.round says 1 at 5.999 seconds in, and the lesson shows 1 !== 0", () => {
  assert.equal(roundedSlot(moment("5.999 s in")), 1);
  assert.equal(slotAt(moment("5.999 s in")), 0);
  assert.match(code, /return Math\.round\(ms \/ \(SLOT_SECONDS \* 1000\)\);/, "the bug is in the lesson's first slotAt");
  assert.match(code, /return Math\.floor\(ms \/ \(SLOT_SECONDS \* 1000\)\);/, "and the fix after it");
  assert.match(text, /1 !== 0/);
  assert.equal(divisionOf(5_999), "5999 / 6000 = 0.9998", "the debugger's 0.9998");
  assert.match(text, /0\.9998/);
  for (const m of MOMENTS) if (m.name !== "5.999 s in") assert.equal(roundedSlot(m.ms), slotAt(m.ms), `${m.name}: the bug hides`);
});

test("the slots under the clock surround the moment's, from 0 at the start", () => {
  assert.deepEqual(slotsAround(0), [0, 1, 2, 3, 4, 5]);
  assert.deepEqual(slotsAround(3_600_000), [599, 600, 601, 602, 603, 604]);
});

test("lesson 0.4 places the widget once, at the top, under try-it and before The idea", () => {
  const raw = lessonText(LESSON);
  const at = raw.indexOf("<SlotClock />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<SlotClock />"), "placed once");
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  assert.ok(raw.indexOf("## The idea") < raw.indexOf("## What the Gray Paper says"));
});
