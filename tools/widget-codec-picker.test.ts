// Lesson 2.4's codec-picker widget (.vitepress/theme/codec-picker.ts): every byte string it
// shows is one the lesson's tests or prose give.

import { test } from "node:test";
import assert from "node:assert/strict";
import { asBlob, asFixedBytes, bytesUnder, CODECS, dump, FIVE, HASH_BYTES, limitOf, parse, PRESETS } from "../.vitepress/theme/codec-picker.ts";
import { lessonCode, lessonText } from "./lessons.ts";

const LESSON = "02-codec/04-codecs.md";
const code = lessonCode("2.4");
const text = lessonText(LESSON).replace(/\s+/g, " ");
const hex = (b: number[]) => `0x${b.map((x) => x.toString(16).padStart(2, "0")).join("")}`;

test("each of the lesson's encode tests is a preset under its codec, with the test's bytes", () => {
  const cases = [...code.matchAll(/toHex\(encode\((\w+), (\d+)n?\)\);\s*assert\.equal\(\w+, "(0x[0-9a-f]+)"\);/g)];
  assert.equal(cases.length, 5, "u8, u16, u32, u64 and natural");
  for (const [, codec, value, want] of cases) {
    assert.ok(PRESETS.includes(BigInt(value)), `${value} is a preset`);
    assert.equal(hex(bytesUnder(codec, BigInt(value))!), want, `${value} as ${codec}`);
  }
  assert.match(code, /decode\(natural32, fromHex\("0xc00040"\)\);\s*assert\.equal\(decoded, 16384\);/);
  assert.equal(hex(bytesUnder("natural", 16384n)!), "0xc00040");
});

test("the check question: 16,384 is 00 40 00 00 as a u32 and c0 00 40 as a natural", () => {
  assert.equal(dump(bytesUnder("u32", 16384n)), "00 40 00 00");
  assert.equal(dump(bytesUnder("natural", 16384n)), "c0 00 40");
  assert.match(text, /`00 40 00 00` as a u32, `c0 00 40` as a natural/);
});

test("a codec that can't hold the value says so, at its limit", () => {
  assert.deepEqual(CODECS.map((c) => c.name), ["u8", "u16", "u32", "u64", "natural"]);
  assert.equal(limitOf("u8"), 255n);
  assert.equal(limitOf("u16"), 65535n);
  assert.equal(bytesUnder("u8", 256n), null);
  assert.equal(bytesUnder("u16", 4807n)!.length, 2);
  assert.equal(bytesUnder("u16", 65536n), null);
  assert.equal(limitOf("natural"), 2n ** 64n - 1n);
  assert.equal(bytesUnder("natural", 2n ** 64n), null);
  assert.equal(bytesUnder("u64", 42n)!.length, 8, "eight bytes, however small");
});

test("the test's five bytes as a blob carry their length; as fixed bytes they don't; a hash is 32", () => {
  assert.match(code, /assert\.equal\(blobHex, "0x050102030405"\);/);
  assert.equal(hex(asBlob(FIVE)), "0x050102030405");
  assert.equal(hex(asFixedBytes(FIVE)), "0x0102030405");
  assert.match(code, /export const hash = fixedBytes\(32\);/);
  assert.equal(HASH_BYTES, 32);
});

test("typed values read as decimal, hex or bits, and junk reads as nothing", () => {
  assert.equal(parse("16384"), 16384n);
  assert.equal(parse("0x4000"), 16384n);
  assert.equal(parse("0b100"), 4n);
  assert.equal(parse("sixteen"), undefined);
});

test("lesson 2.4 places the widget once, at the top to try; Tests sends back to it after the bytes table", () => {
  const raw = lessonText(LESSON);
  const at = raw.indexOf("<CodecPicker />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<CodecPicker />"), "placed once");
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  const back = raw.indexOf("[at the top](#try-it)");
  assert.ok(back > raw.indexOf("A hash is its 32 bytes and nothing else") && back < raw.indexOf("**Run**", raw.indexOf("## Tests")));
});
