// Lesson 17.12's provide widget (.vitepress/theme/provide-round.ts): provide's refusals and
// the end of the round's delivery are the lesson's, and its tests and run come out.

import { test } from "node:test";
import assert from "node:assert/strict";
import { endOfRound, GAS, HASH, provide, START_REQUESTS } from "../.vitepress/theme/provide-round.ts";
import { lessonCode, lessonText } from "./lessons.ts";

const raw = lessonText("17-accumulation/12-providing-a-preimage.md");
const code = lessonCode("17.12");

test("the rules are the lesson's provide and applyProvisions", () => {
  assert.match(code, /if \(slots\?\.length !== 0\) return setTo\(m, HUH\); \/\/ not asked for, or not waiting for it/);
  assert.match(code, /if \(provided\.some\(same\)\) return setTo\(m, HUH\); \/\/ this run gave it already/);
  assert.match(code, /if \(account\?\.requests\.get\(key\)\?\.length !== 0\) continue; \/\/ gone, or not waiting/);
  assert.match(code, /charge\(m, 3980n \+ memoryGas\(2264, z\)\)/);
  assert.equal(GAS, 3980 + Math.ceil((2264 * 8) / 1024));
});

test("the hash, the run's HUH and OK, and the test's [] → [44] with \"preimage\" stored", () => {
  assert.match(code, /const hash = "0x943e3d42cf248c99fa6346c24b66741090bd2c78f9ff691c5fd7a88ef51d27e2";/);
  assert.equal(HASH, "0x943e3d42cf248c99fa6346c24b66741090bd2c78f9ff691c5fd7a88ef51d27e2");
  const run = { giver: 0, provided: [] as number[] };
  assert.equal(provide(START_REQUESTS, run, "self").answer, "HUH", "provide_preimage-1: to itself, which never asked");
  const ok = provide(START_REQUESTS, run, 1729);
  assert.equal(ok.answer, "OK", "provide_preimage-2: to 1729, which did");
  assert.match(raw, /^host call 27 \(provide\): φ₇ = HUH, 1891713 gas left$/m);
  assert.match(raw, /^host call 27 \(provide\): φ₇ = 0, 1887193 gas left$/m);
  assert.equal(provide(START_REQUESTS, ok.run, 1729).answer, "HUH", "twice in one run");
  assert.equal(provide(START_REQUESTS, run, 7).answer, "WHO");
  const end = endOfRound(START_REQUESTS, [ok.run, { giver: 5, provided: [1729] }]);
  assert.deepEqual([end.requests[1729], end.stored, end.dropped], [[44], [1729], 1]);
  assert.match(code, /assert\.deepEqual\(arrived, \[44\]\);/);
});

test("lesson 17.12 places the widget once, after step 4", () => {
  const at = raw.indexOf("<ProvideRound />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<ProvideRound />"), "placed once");
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  const back = raw.indexOf("(#try-it)", raw.indexOf("Any other is dropped, quietly."));
  assert.ok(back > 0 && back < raw.indexOf("Why wait for the end of the round?"));
});
