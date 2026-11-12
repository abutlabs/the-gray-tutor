// Lesson 16.1's host-call widget (.vitepress/theme/host-call.ts): each run ends as the
// lesson's tests say, and the steps follow its runWithHost, charge, gas and unknown.

import { test } from "node:test";
import assert from "node:assert/strict";
import { steps, WHAT } from "../.vitepress/theme/host-call.ts";
import { lessonCode, lessonText } from "./lessons.ts";

const raw = lessonText("16-host-calls/01-calling-the-host.md");
const code = lessonCode("16.1");
const end = (call: number, budget: bigint) => steps(call, budget).at(-1)!;

test("the rules are the lesson's: gas charges 48 then answers; unknown answers WHAT then charges 1,000", () => {
  assert.match(code, /export const WHAT = 2n \*\* 64n - 2n;/);
  assert.equal(WHAT, 2n ** 64n - 2n);
  assert.match(code, /if \(!charge\(m, 48\)\) return "oog";\n\s+m\.registers\[7\] = m\.gas;/);
  assert.match(code, /m\.registers\[7\] = WHAT;\n\s+return charge\(m, 1000\) \? "continue" : "oog";/);
  assert.match(code, /m\.pc \+= 1 \+ skip\(m\.program, m\.pc\);/);
});

test("the tests: 852 and a halt; WHAT with 900 left; out of gas at 147 with no answer", () => {
  assert.deepEqual([end(0, 1000n).exit, end(0, 1000n).r7, end(0, 1000n).gas], ["halt", 852n, 852n]);
  assert.match(code, /assert\.equal\(machine\.registers\[7\], 1000n - 100n - 48n\);/);
  assert.deepEqual([end(99, 2000n).exit, end(99, 2000n).r7, end(99, 2000n).gas], ["halt", WHAT, 900n]);
  assert.deepEqual([end(0, 147n).exit, end(0, 147n).r7], ["oog", 0n]);
  assert.match(raw.replace(/\s+/g, " "), /with 1,000 gas, the block leaves 900, and asking leaves 852/);
  for (const [call, budget] of [[0, 1000n], [99, 2000n]] as const) {
    const all = steps(call, budget);
    assert.equal(all.find((s) => s.says.startsWith("ecalli"))!.pc, 0, "ı stays on the ecalli");
    assert.equal(all.at(-2)!.pc, 2, "then the one after it");
  }
});

test("lesson 16.1 places the widget once, at the top, and gas's rule sends the reader back to it", () => {
  const at = raw.indexOf("<HostCall />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<HostCall />"));
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  const back = raw.indexOf("(#try-it)", raw.indexOf("48 to ask."));
  assert.ok(back > 0 && back < raw.indexOf("## The tests"));
});
