// Lesson 15.2's decode-instruction widget (.vitepress/theme/decode-instruction.ts): its
// program is the lesson's napkin, its sign rules the lesson's X and Z, its decodes the
// lesson's test, and its edits the check questions' wrong answers.

import { test } from "node:test";
import assert from "node:assert/strict";
import { asSigned, BITMASK, CODE, decode, signed, signExtend, skip, STARTS } from "../.vitepress/theme/decode-instruction.ts";
import { lessonCode, lessonText } from "./lessons.ts";

const LESSON = "15-the-pvm/02-instructions.md";
const raw = lessonText(LESSON);
const code = lessonCode("15.2");

test("the napkin program and its bitmask are the lesson's test's, with instructions at 0, 3, 6 and 8", () => {
  assert.match(code, /Uint8Array\.from\(\[51, 0x01, 0xff, 200, 0x21, 0x03, 40, 0xfd, 0\]\)/);
  assert.match(code, /bitmask: Uint8Array\.from\(\[0x49, 0x01\]\)/);
  assert.deepEqual(CODE, [51, 0x01, 0xff, 200, 0x21, 0x03, 40, 0xfd, 0]);
  assert.deepEqual(BITMASK, [0x49, 0x01]);
  assert.deepEqual(STARTS, [0, 3, 6, 8]);
  assert.deepEqual([skip(CODE, 0), skip(CODE, 3), skip(CODE, 6), skip(CODE, 8)], [2, 2, 1, 0]);
});

test("X and Z are the lesson's: ff sign-extends to 2^64 − 1, 0x8000 to 0xffffffffffff8000, fd reads as −3", () => {
  assert.match(code, /signExtend\(1, 0xffn\);\s*assert\.equal\(minusOne, 2n \*\* 64n - 1n\);/);
  assert.equal(signExtend(1, 0x7fn), 0x7fn);
  assert.equal(signExtend(1, 0xffn), 2n ** 64n - 1n);
  assert.equal(signExtend(2, 0x8000n), 0xffffffffffff8000n);
  assert.equal(signed(1, 0xfdn), -3n);
  assert.equal(asSigned(2n ** 64n - 1n), -1n);
});

test("load_imm r1, −1; add_64 r3 = r1 + r2, next at 6; jump back to 3: the lesson's decodes and questions", () => {
  const load = decode(CODE, 0);
  assert.deepEqual([load.name, load.registers, load.immediate!.extended], ["load_imm", [1], 2n ** 64n - 1n]);
  assert.deepEqual(load.immediate!.bytes, [0xff]);
  assert.match(raw, /Why are an instruction's short immediates sign-extended/, "the check asks why, not what");
  const add = decode(CODE, 3);
  assert.deepEqual([add.name, add.registers, add.next], ["add_64", [1, 2, 3], 6]);
  assert.deepEqual(add.nibbles, { low: 1, high: 2 });
  const jump = decode(CODE, 6);
  assert.deepEqual([jump.name, jump.offset!.signed, jump.offset!.target, jump.offset!.lands], ["jump", -3n, 3, true]);
  assert.match(raw, /A jump's offset is counted from where\?/);
  assert.equal(decode(CODE, 8).name, "trap");
});

test("editing the immediate to 7f gives 127; an offset of fe lands at 4, mid-instruction", () => {
  const edited = [...CODE]; edited[2] = 0x7f;
  assert.equal(decode(edited, 0).immediate!.extended, 127n);
  const moved = [...CODE]; moved[7] = 0xfe;
  const jump = decode(moved, 6);
  assert.deepEqual([jump.offset!.signed, jump.offset!.target, jump.offset!.lands], [-2n, 4, false]);
});

test("lesson 15.2 places the widget once, at the top, and the reading rules send the reader back to it", () => {
  const at = raw.indexOf("<DecodeInstruction />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<DecodeInstruction />"), "placed once");
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  const back = raw.indexOf("(#try-it)", raw.indexOf("so a jump\n  back is a negative number."));
  assert.ok(back > 0 && back < raw.indexOf("## The tests"));
});
