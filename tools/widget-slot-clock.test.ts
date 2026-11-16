// Lesson 21.3's slot-clock widget (.vitepress/theme/slot-clock.ts): its rule is the
// lesson's receiveBlock, and its numbers are the client's time.ts.

import { test } from "node:test";
import assert from "node:assert/strict";
import { SLOT_SECONDS, slotAt, slotStart, status } from "../.vitepress/theme/slot-clock.ts";
import { lessonCode, lessonText } from "./lessons.ts";

const raw = lessonText("21-a-node/03-the-slot-clock.md");
const code = lessonCode("21.3");

test("the rule is the lesson's, and a slot is the client's six seconds", () => {
  assert.match(code, /if \(block\.header\.slot > slotAt\(now\)\) \{/);
  assert.match(code, /return new Date\(\(JAM_COMMON_ERA \+ slot \* SLOT_SECONDS\) \* 1000\);/);
  assert.match(lessonCode("0.4"), /export const SLOT_SECONDS = 6;/);
  assert.equal(SLOT_SECONDS, 6);
});

test("a block is held until its slot's first second, and not a second longer", () => {
  assert.equal(slotStart(3), 18);
  assert.equal(slotAt(17), 2);
  assert.deepEqual(status(17, 3), { held: true, says: "held: slot 3 begins at second 18, in 1 s" });
  assert.deepEqual(status(18, 3), { held: false, says: "in the tree: 3 × 6 = 18 ≤ 18" });
  assert.equal(status(0, 1).held, true);
  assert.equal(status(6, 1).held, false);
  assert.equal(status(6, 2).held, true);
});

test("the lesson's own numbers are the widget's: slot 3 at second 18", () => {
  assert.match(raw, /Slot 3 begins 18 seconds after JAM's clock\s+started\./);
  assert.match(raw, /arrives at second 17 is not valid\. At second 18, the\s+same block is\./);
});

test("lesson 21.3 places the widget once, at the top", () => {
  const at = raw.indexOf("<SlotClock />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<SlotClock />"));
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
});
