// Lesson 15.6's signed-or-unsigned widget (.vitepress/theme/signed-branches.ts): its
// comparisons are the lesson's COMPARISONS, line for line, and with r0 = −1 and r1 = 1 every
// branch jumps or falls through exactly as the branches run prints it.

import { test } from "node:test";
import assert from "node:assert/strict";
import { COMPARISONS, flipSign, parse, ROWS, signed, WITH_REGISTERS } from "../.vitepress/theme/signed-branches.ts";
import { lessonCode, lessonText } from "./lessons.ts";

const LESSON = "15-the-pvm/06-branches-and-calls.md";
const raw = lessonText(LESSON);
const code = lessonCode("15.6");
const MAX = 2n ** 64n - 1n;

test("the comparisons are the lesson's COMPARISONS, line for line", () => {
  const block = /const COMPARISONS: Record<string, \(p: bigint, q: bigint\) => boolean> = \{\n([\s\S]*?)\n\};/.exec(code);
  assert.ok(block, "15.6 defines COMPARISONS");
  const lines = block[1].split("\n").map((l) => l.trim().replace(/signed\(8, (\w)\)/g, "signed($1)"));
  assert.deepEqual(lines.map((l) => l.split(":")[0]), Object.keys(COMPARISONS));
  for (const line of lines) {
    const [name, body] = /^(\w+): (.*),$/.exec(line)!.slice(1);
    assert.equal(COMPARISONS[name].toString().replace(/\s+/g, " "), body, name);
  }
});

test("r0 = −1 and r1 = 1: every branch as the run prints it", () => {
  assert.match(raw, /^r0 = −1, against r1 = 1 or ν_X = 1:$/m);
  const lines = [...raw.matchAll(/^branch_(\w+?)(_imm)?\s+(jumps|falls through)$/gm)];
  assert.equal(lines.length, 16);
  for (const [, name, imm, said] of lines) assert.equal(COMPARISONS[name](MAX, 1n), said === "jumps", `branch_${name}${imm ?? ""}`);
  const registers = lines.filter(([, , imm]) => !imm).map(([, name]) => name);
  assert.deepEqual(new Set(registers), WITH_REGISTERS, "six with two registers");
  assert.deepEqual(new Set(lines.filter(([, , imm]) => imm).map(([, name]) => name)), new Set(Object.keys(COMPARISONS)), "ten with an immediate");
});

test("the tests' answers: lt_u and lt_s disagree on −1 and 1; the immediates against 3", () => {
  assert.equal(COMPARISONS.lt_u(MAX, 1n), false);
  assert.equal(COMPARISONS.lt_s(MAX, 1n), true);
  assert.equal(COMPARISONS.le_u(3n, 3n), true);
  assert.equal(COMPARISONS.lt_u(3n, 3n), false);
  assert.equal(COMPARISONS.gt_u(3n, MAX), false);
  assert.equal(COMPARISONS.gt_s(3n, MAX), true);
});

test("the grid holds every comparison once, eq and ne with no twin; flipping a sign bit and typing work", () => {
  assert.deepEqual(ROWS.flatMap((r) => r.twins).sort(), Object.keys(COMPARISONS).sort());
  for (const r of ROWS) assert.equal(r.twins.length, r.op === "eq" || r.op === "ne" ? 1 : 2, r.op);
  // twins agree whenever both registers have the same sign bit
  for (const [p, q] of [[3n, 5n], [MAX, MAX - 4n], [0n, 0n]]) for (const r of ROWS) if (r.twins.length === 2) assert.equal(COMPARISONS[r.twins[0]](p, q), COMPARISONS[r.twins[1]](p, q), `${r.op} ${p} ${q}`);
  assert.equal(flipSign(1n), 2n ** 63n + 1n);
  assert.equal(signed(flipSign(0n)), -(2n ** 63n));
  assert.equal(parse("-1"), MAX);
  assert.equal(parse("−1"), MAX);
  assert.equal(parse("0xff"), 255n);
  assert.equal(parse("2^63"), 2n ** 63n);
  assert.equal(parse("x"), null);
});

test("lesson 15.6 places the widget once, at the top, and −1 against 1 sends the reader back to it", () => {
  const at = raw.indexOf("<SignedBranches />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<SignedBranches />"), "placed once");
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  const back = raw.indexOf("(#try-it)", raw.indexOf("Same bits, opposite answers."));
  assert.ok(back > 0 && back < raw.indexOf("## The tests"));
});
