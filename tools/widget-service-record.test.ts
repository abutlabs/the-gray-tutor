// Lesson 14.2's service-record widget (.vitepress/theme/service-record.ts): its fields are
// the lesson's ServiceInfo, field for field and width for width; its values are the run's
// lines; and its 89 bytes are what the lessons' client encodes for service 0.

import { test } from "node:test";
import assert from "node:assert/strict";
import { FIELDS, LETTER, RECORD, RECORD_BYTES, SERVICE_INFO, valueOf } from "../.vitepress/theme/service-record.ts";
import { lessonCode, lessonText } from "./lessons.ts";

const LESSON = "14-services/02-the-service-account.md";
const raw = lessonText(LESSON);
const WIDTH: Record<string, number> = { u8: 1, hash: 32, u64: 8, u32: 4 };

test("the fields are lesson 14.2's ServiceInfo record, in order, each its codec's width", () => {
  const m = /export const ServiceInfo = record\(\{([\s\S]*?)\}\);/.exec(lessonCode("14.2"));
  assert.ok(m);
  const fields = [...m[1].matchAll(/^\s+(\w+): (u8|hash|u64|u32),/gm)].map(([, f, c]) => [f, c]);
  assert.deepEqual((SERVICE_INFO as { record: [string, string][] }).record, fields);
  assert.deepEqual(FIELDS.map((f) => f.end - f.start), fields.map(([, c]) => WIDTH[c]));
  assert.equal(RECORD_BYTES, 89);
  assert.match(raw.replace(/\s+/g, " "), /the record that Appendix D keeps under C\(255, s\), 89 bytes/);
  for (const f of FIELDS) assert.ok(LETTER[f.path], `${f.path} has its letter`);
});

test("the values are the run's: the code hash, 4 items in 159534 bytes, a balance of 2^64 − 1 kept at 0", () => {
  assert.match(raw, /^code hash 0x128fc8f0578f393b…: 159322 bytes of code$/m);
  assert.match(raw, /^keeps 4 items in 159534 bytes$/m);
  assert.match(raw, /^balance 18446744073709551615, of which it must keep 0$/m);
  const at = (p: string) => FIELDS.find((f) => f.path === p)!;
  assert.equal(valueOf(at("code_hash")), "12 8f c8 f0 … 84 31 35", "the run's 0x128fc8f0578f393b…, shortened as the diagrams do");
  assert.equal(valueOf(at("items")), "4");
  assert.equal(valueOf(at("bytes")), "159,534");
  assert.equal(valueOf(at("balance")), "2^64 − 1 = 18,446,744,073,709,551,615");
  assert.equal(valueOf(at("deposit_offset")), valueOf(at("balance")), "the free allowance is the same");
});

test("the 89 bytes are what the lessons' client encodes for service 0 (reference/bin/service.ts's state)", () => {
  // encode(ServiceInfo, readService(entries, 0)) on traces/fallback/00000001.json's state, from the tangled client
  const expected = "00128fc8f0578f393bd12da1e73e030afe53fde62069fc8f6f87a5c914b1843135ffffffffffffffff0a000000000000000a000000000000002e6f020000000000ffffffffffffffff04000000000000000000000000000000";
  assert.equal(RECORD.bytes.map((b) => b.toString(16).padStart(2, "0")).join(""), expected);
});

test("lesson 14.2 places the record widget once, after the field table", () => {
  const at = raw.indexOf("<ServiceRecord />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<ServiceRecord />"), "placed once");
  assert.ok(at > raw.indexOf("| r, a, p |") && at < raw.indexOf("*the footprint*"));
});
