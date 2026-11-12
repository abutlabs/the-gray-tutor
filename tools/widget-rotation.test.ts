// Lesson 8.2's rotation widget (.vitepress/theme/rotation.ts): its sets are the lesson's
// rotation run, before and after, row for row, and its Φ is the lesson's.

import { test } from "node:test";
import assert from "node:assert/strict";
import { BEFORE, OFFENDERS, rotate, SET_NAMES, withoutOffenders, ZERO } from "../.vitepress/theme/rotation.ts";
import { lessonCode, lessonText } from "./lessons.ts";

const LESSON = "08-safrole/02-rotating-the-validators.md";
const raw = lessonText(LESSON);

test("the sets before and after are the lesson's rotation Output, row for row", () => {
  assert.match(raw, /^slot 45 → 48: a new epoch$/m);
  const rows = [...raw.matchAll(/^(staging|pending|active|previous)\s+((?:[0-9a-f]{4} ?){6})\s+→\s+((?:[0-9a-f]{4} ?){6})$/gm)];
  assert.equal(rows.length, 4);
  const after = rotate(BEFORE, OFFENDERS);
  for (const [, set, before, got] of rows) {
    assert.deepEqual(BEFORE[set as keyof typeof BEFORE], before.trim().split(" "), `${set} before`);
    assert.deepEqual(after[set as keyof typeof after], got.trim().split(" "), `${set} after`);
  }
  assert.deepEqual(SET_NAMES, ["staging", "pending", "active", "previous"]);
});

test("Φ zeros an offender in place, and the rotation is the lesson's rotateValidators", () => {
  assert.match(lessonCode("8.2"), /pending: withoutOffenders\(sets\.staging, offenders\),\s*active: sets\.pending,\s*previous: sets\.active,/);
  assert.deepEqual(OFFENDERS, ["ab00"]);
  assert.deepEqual(withoutOffenders(BEFORE.staging, OFFENDERS), ["cab2", ZERO, "4418", "8b8c", "ad93", "f30a"]);
  assert.equal(withoutOffenders(BEFORE.staging, OFFENDERS).length, 6, "the list stays six long");
  const after = rotate(BEFORE, OFFENDERS);
  assert.deepEqual(after.staging, BEFORE.staging, "ι stays");
  assert.deepEqual(after.active, BEFORE.pending);
  assert.deepEqual(after.previous, BEFORE.active);
  assert.deepEqual(rotate(BEFORE, []).pending, BEFORE.staging, "no offenders: Φ changes nothing");
  assert.match(raw.replace(/\s+/g, " "), /`ab00` is an offender, and arrived in pending as `0000`/);
});

test("lesson 8.2 places the widget once, at the top, and Φ sends the reader back to it", () => {
  const at = raw.indexOf("<Rotation />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<Rotation />"), "placed once");
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  assert.match(raw, /Nobody can sign with a zero key\. Try it \[at the top\]\(#try-it\)/);
});
