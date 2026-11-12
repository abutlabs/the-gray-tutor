// Lesson 15.7's bits widget (.vitepress/theme/bit-counts.ts): its operations are the
// lesson's BIT_OPERATIONS, every answer for 0x1f0 is the run's line, the tests' values come
// out, and the bits it lights are the ones each count counted.

import { test } from "node:test";
import assert from "node:assert/strict";
import { asSigned, BIT_OPERATIONS, counted, hex64, NAMES, parse } from "../.vitepress/theme/bit-counts.ts";
import { lessonCode, lessonText } from "./lessons.ts";

const LESSON = "15-the-pvm/07-bits-and-bytes.md";
const raw = lessonText(LESSON);
const code = lessonCode("15.7");
const MAX = 2n ** 64n - 1n;

test("the operations are the lesson's BIT_OPERATIONS, by name and in order", () => {
  const block = /export const BIT_OPERATIONS: Record<string, \(x: bigint\) => bigint> = \{\n([\s\S]*?)\n\};/.exec(code);
  assert.ok(block, "15.7 defines BIT_OPERATIONS");
  const lines = block[1].split("\n").map((l) => l.trim());
  assert.deepEqual(lines.map((l) => l.split(":")[0]), NAMES);
  for (const line of lines.slice(0, 9)) {
    const [name, body] = /^(\w+): (.*),$/.exec(line)!.slice(1);
    assert.equal(BIT_OPERATIONS[name].toString(), body, name);
  }
  assert.match(lines[9], /reverse_bytes: \(x\) => decodeFixed\(encodeFixed\(x, 8\)\.reverse\(\)\)/);
});

test("0x1f0: every answer is the run's line, hex and signed", () => {
  assert.match(raw, /^r0 = 0x00000000000001f0, in bits:$/m);
  const lines = [...raw.matchAll(/^(\w+)\s+(0x[0-9a-f]{16}) = (-?\d+)$/gm)];
  assert.equal(lines.length, 10);
  assert.deepEqual(lines.map((m) => m[1]), NAMES);
  for (const [, name, hex, signed] of lines) {
    const v = BIT_OPERATIONS[name](0x1f0n);
    assert.equal(hex64(v), hex, name);
    assert.equal(asSigned(v).toString(), signed, name);
  }
});

test("the tests' values", () => {
  assert.equal(BIT_OPERATIONS.count_set_bits_64(0b1011n), 3n);
  assert.equal(BIT_OPERATIONS.leading_zero_bits_64(1n), 63n);
  assert.equal(BIT_OPERATIONS.trailing_zero_bits_64(0b1000n), 3n);
  assert.equal(BIT_OPERATIONS.count_set_bits_32(MAX), 32n);
  assert.equal(BIT_OPERATIONS.leading_zero_bits_32(1n), 31n);
  assert.equal(BIT_OPERATIONS.leading_zero_bits_64(0n), 64n);
  assert.equal(BIT_OPERATIONS.trailing_zero_bits_32(0n), 32n);
  assert.equal(BIT_OPERATIONS.sign_extend_8(0x180n), MAX - 127n);
  assert.equal(BIT_OPERATIONS.sign_extend_16(0x12345n), 0x2345n);
  assert.equal(BIT_OPERATIONS.zero_extend_16(MAX), 0xffffn);
  assert.equal(BIT_OPERATIONS.reverse_bytes(0x0102030405060708n), 0x0807060504030201n);
});

test("the bits lit are the bits counted: a count's answer is how many are lit", () => {
  for (const x of [0n, 1n, 0x1f0n, 0b1011n, MAX, 0xdeadbeefn, 2n ** 63n, 0x80000000n]) {
    for (const name of NAMES.filter((n) => /^(count_set|leading_zero|trailing_zero)/.test(n))) {
      assert.equal(BigInt(counted(name, x).size), BIT_OPERATIONS[name](x), `${name} of ${x}`);
      if (name.endsWith("_32")) for (const k of counted(name, x)) assert.ok(k < 32, `${name} looks at the low 32 bits only`);
    }
  }
  assert.deepEqual([...counted("sign_extend_8", 0x1f0n)].sort((a, b) => a - b), [0, 1, 2, 3, 4, 5, 6, 7]);
  assert.equal(counted("zero_extend_16", 0n).size, 16);
  assert.equal(parse("-1"), MAX);
  assert.equal(parse("0x1F0"), 0x1f0n);
  assert.equal(parse("nope"), null);
});

test("lesson 15.7 places the widget once, at the top, and the ten instructions send the reader back to it", () => {
  const at = raw.indexOf("<BitCounts />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<BitCounts />"), "placed once");
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  const back = raw.indexOf("(#try-it)", raw.indexOf("it's how your code will too."));
  assert.ok(back > 0 && back < raw.indexOf("## The tests"));
});
