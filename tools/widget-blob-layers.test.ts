// Lesson 15.1's blob-layers widget (.vitepress/theme/blob-layers.ts): its eight bytes are
// the lesson's test's, its parts the lesson's byte table, its real layers the run's lines.

import { test } from "node:test";
import assert from "node:assert/strict";
import { BLOB, BLOB_PARTS, CODE_PREIMAGE, flip, landsOnOne, LAYERS, parts, starts } from "../.vitepress/theme/blob-layers.ts";
import { lessonCode, lessonText } from "./lessons.ts";

const LESSON = "15-the-pvm/01-the-program-blob.md";
const raw = lessonText(LESSON);
const code = lessonCode("15.1");

test("the eight bytes are the test's blob, and its parts the lesson's table", () => {
  assert.match(code, /deblob\(fromHex\("0x01010302" \+ "000102" \+ "05"\)\)/);
  assert.equal(BLOB.map((b) => b.toString(16).padStart(2, "0")).join(""), "0101030200010205");
  const p = parts(BLOB);
  assert.deepEqual(p.map((x) => [x.name, x.from, x.to]), [["|j|", 0, 1], ["z", 1, 2], ["|c|", 2, 3], ["j", 3, 4], ["c", 4, 7], ["k", 7, 8]]);
  assert.match(raw, /^02\s+j: the one jump target, byte 2$/m);
  assert.match(raw, /^05\s+k: 0000 0101, bits 0 and 2 set: bytes 0 and 2 start an instruction$/m);
});

test("bytes 0 and 2 start an instruction, the jump lands on byte 2, and flipping a bit changes that", () => {
  assert.match(code, /assert\.deepEqual\(starts, \[true, false, true\]\);/);
  assert.deepEqual(starts(BLOB[7], 3), [true, false, true]);
  assert.ok(landsOnOne(BLOB[7], 2, 3));
  const flipped = flip(BLOB[7], 2);
  assert.deepEqual(starts(flipped, 3), [true, false, false]);
  assert.ok(!landsOnOne(flipped, 2, 3), "the jump to byte 2 lands mid-instruction");
  assert.equal(flip(flipped, 2), BLOB[7]);
});

test("the real layers are the run's: 159,322 → 80 + 9,904 + 48 + 149,274 → 1,601 jumps, 128,413 code, 16,052 bitmask", () => {
  for (const line of ["the code preimage: 159322 bytes", "metadata: 80 bytes", "read-only data 9904, read-write 48, heap pages 2, stack 8192", "the PVM blob: 149274 bytes", "jump table: 1601 entries", "code: 128413 bytes, 39849 instructions", "bitmask: 16052 bytes"]) {
    assert.match(raw, new RegExp(`^\\s*${line.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "m"), line);
  }
  assert.equal(CODE_PREIMAGE, 159_322);
  assert.equal(LAYERS.bitmask, Math.ceil(LAYERS.code / 8), "one bit per byte of code, rounded up");
  assert.equal(BLOB_PARTS.z, 3, "three-byte jump-table entries");
  assert.equal(BLOB_PARTS.sizes + BLOB_PARTS.jumpTable + BLOB_PARTS.code + BLOB_PARTS.bitmask, LAYERS.blob, "the blob's parts add up");
  assert.equal(BLOB_PARTS.sizes, 6, "ℰ(1601) in two bytes, ℰ₁(3), ℰ(128413) in three");
});

test("lesson 15.1 places the widget once, at the top, and the blob's three parts send the reader back to it", () => {
  const at = raw.indexOf("<BlobLayers />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<BlobLayers />"), "placed once");
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  const back = raw.indexOf("(#try-it)", raw.indexOf("bitfields."));
  assert.ok(back > 0 && back < raw.indexOf("## The tests"));
});
