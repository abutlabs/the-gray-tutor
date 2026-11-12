// Lesson 15.5's alu-corners widget (.vitepress/theme/alu-corners.ts): its operations are the
// lesson's, its nine presets the run's lines, hex and signed, and its answers the check
// questions'.

import { test } from "node:test";
import assert from "node:assert/strict";
import { asSigned, CASES, hex64, neg, OPERATIONS, parse } from "../.vitepress/theme/alu-corners.ts";
import { lessonCode, lessonText } from "./lessons.ts";

const LESSON = "15-the-pvm/05-arithmetic.md";
const raw = lessonText(LESSON);
const code = lessonCode("15.5");

test("the nine corners are the run's lines, each with its hex and signed answer", () => {
  const lines = [...raw.matchAll(/^(\w+)\s+(.+?)\s{2,}(0x[0-9a-f]{16}) = (-?\d+)$/gm)];
  assert.equal(lines.length, 9);
  assert.deepEqual(CASES.map((c) => [c.name, c.what]), lines.map(([, name, what]) => [name, what.trim()]));
  for (const [k, [, , , hex, signed]] of lines.entries()) {
    const c = CASES[k];
    const r = OPERATIONS[c.name](c.r0, c.r1);
    assert.equal(hex64(r), hex, c.what);
    assert.equal(asSigned(r).toString(), signed, c.what);
  }
});

test("the operations are the lesson's lines: add_32's ext32, the three div_s cases, rem_s's %", () => {
  assert.match(code, /add_32: \(p, q\) => ext32\(p \+ q\),/);
  assert.match(code, /if \(a === -\(2n \*\* 63n\) && b === -1n\) return p;/);
  assert.match(code, /return u64\(b === 0n \? a : a % b\);/);
  assert.equal(OPERATIONS.add_32(0x7fffffffn, 1n), 0xffffffff80000000n);
  assert.equal(OPERATIONS.div_u_64(5n, 0n), 2n ** 64n - 1n);
  assert.equal(OPERATIONS.div_s_64(2n ** 63n, neg(1n)), 2n ** 63n);
  assert.equal(OPERATIONS.div_s_64(neg(7n), 2n), neg(3n));
  assert.equal(OPERATIONS.rem_s_64(neg(7n), 2n), neg(1n));
  assert.equal(OPERATIONS.rem_s_64(7n, neg(3n)), 1n);
  assert.equal(OPERATIONS.shar_r_64(neg(8n), 1n), neg(4n));
  assert.equal(OPERATIONS.shlo_r_64(2n ** 63n, 63n), 1n);
  assert.equal(OPERATIONS.rot_r_64(1n, 1n), 2n ** 63n);
  assert.equal(OPERATIONS.mul_upper_u_u(neg(1n), neg(1n)), 2n ** 64n - 2n);
});

test("the check questions: 2^64 − 1 + 2 is 1, and typed inputs read signed, unsigned or hex", () => {
  assert.equal(OPERATIONS.add_64(2n ** 64n - 1n, 2n), 1n);
  assert.match(raw.replace(/\s+/g, " "), /2\^64 \+ 1, modulo 2\^64, is 1/);
  assert.equal(parse("-7"), neg(7n));
  assert.equal(parse("−7"), neg(7n));
  assert.equal(parse("0x7fffffff"), 0x7fffffffn);
  assert.equal(parse("18446744073709551615"), 2n ** 64n - 1n);
  assert.equal(parse("seven"), null);
});

test("lesson 15.5 places the widget once, at the top, and the corners send the reader back to it", () => {
  const at = raw.indexOf("<AluCorners />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<AluCorners />"), "placed once");
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  const back = raw.indexOf("(#try-it)", raw.indexOf("otherwise the destination keeps what it had."));
  assert.ok(back > 0 && back < raw.indexOf("## The tests"));
});
