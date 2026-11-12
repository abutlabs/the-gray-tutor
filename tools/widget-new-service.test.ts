// Lesson 17.8's new-service widget (.vitepress/theme/new-service.ts): the balance, the ids and
// the refusals are the lesson's newService and check, and its tests come out.

import { test } from "node:test";
import assert from "node:assert/strict";
import { check, create, MIN_PUBLIC_ID, newBalance, PUBLIC_IDS, start } from "../.vitepress/theme/new-service.ts";
import { lessonCode, lessonText } from "./lessons.ts";

const raw = lessonText("17-accumulation/08-creating-a-service.md");
const code = lessonCode("17.8");
const ask = { length: 20, gratis: false, registrar: false, wanted: 5 };

test("the constants and the step are the lesson's", () => {
  assert.match(code, /const MIN_PUBLIC_ID = 2 \*\* 16;/);
  assert.match(code, /const PUBLIC_IDS = 2 \*\* 32 - MIN_PUBLIC_ID - 2 \*\* 8;/);
  assert.equal(PUBLIC_IDS, 2 ** 32 - MIN_PUBLIC_ID - 2 ** 8);
  assert.match(code, /ids\.next = check\(\(\(id - MIN_PUBLIC_ID \+ 42\) % PUBLIC_IDS\) \+ MIN_PUBLIC_ID, ids\.taken\);/);
  assert.equal(check(70_042, new Set([70_042])), 70_043);
});

test("the tests: id 70,000, 221 for it, 779 left, next 70,042; the registrar gets 5 and the counter stays", () => {
  assert.equal(newBalance(20), 221);
  const r = create(start(), ask);
  assert.deepEqual([r.answer, r.state.balance, r.state.next], ["70000", 1000 - 221, 70_042]);
  const chosen = create(r.state, { ...ask, registrar: true, wanted: 5 });
  assert.deepEqual([chosen.answer, chosen.state.next], ["5", 70_042]);
  assert.match(raw.replace(/\s+/g, " "), /100 \+ 2 × 10 \+ 101 = 221/);
});

test("the refusals: gratis is HUH, 900 bytes is CASH (1,101), a taken id is FULL", () => {
  assert.equal(create(start(), { ...ask, gratis: true }).answer, "HUH");
  assert.equal(newBalance(900), 1101);
  assert.equal(create(start(), { ...ask, length: 900 }).answer, "CASH");
  assert.equal(create(start(), { ...ask, registrar: true, wanted: 0 }).answer, "FULL");
  assert.match(raw, /With 900 bytes of code the new one would need 1101: `CASH`\./);
});

test("lesson 17.8 places the widget once, after the numbers by hand", () => {
  const at = raw.indexOf("<NewService />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<NewService />"), "placed once");
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  const back = raw.indexOf("(#try-it)", raw.indexOf("would need 1101: `CASH`."));
  assert.ok(back > 0 && back < raw.indexOf("Then whole blocks:"));
});
