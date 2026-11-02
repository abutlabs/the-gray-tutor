// Lesson 15.4's store-load widget (.vitepress/theme/store-load.ts): its register, its page
// after the store and its two loads are the lesson's test and run, byte for byte.

import { test } from "node:test";
import assert from "node:assert/strict";
import { asSigned, CELLS, hex64, load, LOADS, R2 } from "../.vitepress/theme/store-load.ts";
import { lessonCode, lessonText } from "./lessons.ts";

const LESSON = "15-the-pvm/04-memory.md";
const raw = lessonText(LESSON);
const code = lessonCode("15.4");
const by = (name: string) => LOADS.find((l) => l.name === name)!;

test("r2 is the test's, and the page after the store is the run's, lowest byte first", () => {
  assert.match(code, /const r2: bigint = 0x1122334455667780n;/);
  assert.equal(R2, 0x1122334455667780n);
  assert.match(raw, /^page 0x20000 after:\s+0x8077665544332211/m);
  assert.equal(CELLS.map((c) => c.toString(16).padStart(2, "0")).join(""), "8077665544332211");
});

test("load_ind_u64 gives all 8 bytes back; load_ind_i8 gives 0xffffffffffffff80, −128; u8 gives 128", () => {
  assert.match(raw, /^r3 = 0x1122334455667780/m);
  assert.equal(load(by("load_ind_u64")), R2);
  assert.match(raw, /^r4 = 0xffffffffffffff80/m);
  assert.match(code, /assert\.equal\(machine\.registers\[4\], 2n \*\* 64n - 128n\);/);
  assert.equal(load(by("load_ind_i8")), 2n ** 64n - 128n);
  assert.equal(hex64(load(by("load_ind_i8"))), "0xffffffffffffff80");
  assert.equal(asSigned(load(by("load_ind_i8"))), -128n);
  assert.equal(load(by("load_ind_u8")), 0x80n);
  assert.equal(load(by("load_ind_u16")), 0x7780n);
  assert.equal(load(by("load_ind_i16")), 0x7780n, "its top bit is 0");
  assert.equal(load(by("load_ind_u32")), 0x55667780n);
  assert.match(raw, /`load_ind_u8` and `load_ind_i8` read the same byte/, "the check asks what signed means");
});

test("lesson 15.4 places the store-load widget once, in Watch it after the little-endian paragraph", () => {
  const at = raw.indexOf("<StoreLoad />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<StoreLoad />"), "placed once");
  assert.ok(at > raw.indexOf("has the run.") && at < raw.indexOf("<details>", raw.indexOf("## Watch it")));
});
