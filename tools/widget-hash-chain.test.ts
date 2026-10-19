// Lesson 5.1's hash-chain widget (.vitepress/theme/hash-chain.ts): its four headers are the
// fallback trace's, its hashes really link them (the widget's own encode-then-hash is the
// lesson's rule), and a flipped bit breaks exactly the links it should.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { FALLBACK_HEADERS } from "../.vitepress/theme/fallback-headers.ts";
import { byteOf, encodeHeader, flip, hashOf, linkHolds, linksHolding, ORIGINAL, parentOf, SPOTS } from "../.vitepress/theme/hash-chain.ts";
import { lessonCode, lessonText, ROOT } from "./lessons.ts";

const LESSON = "05-hashing-and-signatures/01-hashes.md";
const raw = lessonText(LESSON);
const trace = (n: number) => join(ROOT, `vectors/traces/fallback/${String(n).padStart(8, "0")}.json`);

test("the four headers are the fallback trace's blocks 1 to 4, where vectors/ is downloaded", { skip: !existsSync(trace(4)) && "no vectors/" }, () => {
  for (let n = 1; n <= 4; n++) {
    assert.deepEqual(FALLBACK_HEADERS[n - 1], JSON.parse(readFileSync(trace(n), "utf8")).block.header, `block ${n}`);
  }
});

test("each block names the hash of the header before it: encode, then Blake2b-256, as the lesson's headerHash", () => {
  assert.match(lessonCode("5.1"), /return blake2b256\(encode\(Header\(config\), header\)\);/);
  assert.match(lessonCode("5.1"), /return blake2b\(data, \{ dkLen: 32 \}\);/);
  assert.equal(ORIGINAL.length, 4);
  for (let n = 1; n < 4; n++) assert.ok(linkHolds(ORIGINAL, n), `block ${n + 1} holds block ${n}`);
  assert.equal(linksHolding(ORIGINAL), 3);
  assert.deepEqual(ORIGINAL.map((b) => b.slot), [1, 2, 3, 4]);
  assert.equal(encodeHeader(FALLBACK_HEADERS[0]).bytes.length, 297, "a header with no marks is 297 bytes (lesson 8.9)");
  assert.match(raw.replace(/\s+/g, " "), /99 links, checked: every one of these blocks really does follow the one before it/);
});

test("one flipped bit breaks the link after the block; in its parent field, the link before too", () => {
  for (const s of SPOTS) assert.ok(byteOf(FALLBACK_HEADERS[1], s.field) >= 0, s.field);
  assert.equal(byteOf(FALLBACK_HEADERS[1], "parent"), 0);
  assert.equal(byteOf(FALLBACK_HEADERS[1], "slot"), 96);
  const seal = flip(ORIGINAL, 2, "seal");
  assert.notDeepEqual(hashOf(seal[1].bytes), hashOf(ORIGINAL[1].bytes), "its hash is a stranger");
  assert.deepEqual([linkHolds(seal, 1), linkHolds(seal, 2), linkHolds(seal, 3)], [true, false, true]);
  const parent = flip(ORIGINAL, 2, "parent");
  assert.notDeepEqual(parentOf(parent[1]), parentOf(ORIGINAL[1]));
  assert.deepEqual([linkHolds(parent, 1), linkHolds(parent, 2), linkHolds(parent, 3)], [false, false, true]);
  assert.equal(linksHolding(flip(seal, 2, "seal")), 3, "flipped back, the chain holds again");
});

test("lesson 5.1 places the widget once, after the 99 links line", () => {
  const at = raw.indexOf("<HashChain />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<HashChain />"), "placed once");
  assert.ok(at > raw.indexOf("99 links, checked") && at < raw.indexOf("## Watch the chain"));
});

const PREIMAGES = join(ROOT, "vectors/traces/preimages");
test("lesson 5.2's preimages trace carries what it says: 27 blocks with preimages (up to 10), 65 with a report, 99 with assurances", { skip: !existsSync(PREIMAGES) && "no vectors/" }, () => {
  const counts = { preimages: 0, most: 0, guarantees: 0, assurances: 0 };
  for (let n = 1; n <= 100; n++) {
    const x = JSON.parse(readFileSync(join(PREIMAGES, `${String(n).padStart(8, "0")}.json`), "utf8")).block.extrinsic;
    if (x.preimages.length) counts.preimages++;
    counts.most = Math.max(counts.most, x.preimages.length);
    if (x.guarantees.length) counts.guarantees++;
    if (x.assurances.length) counts.assurances++;
  }
  assert.deepEqual(counts, { preimages: 27, most: 10, guarantees: 65, assurances: 99 });
  const text = lessonText("05-hashing-and-signatures/02-the-extrinsic-hash.md").replace(/\s+/g, " ");
  assert.match(text, /27 of them preimages \(up to 10 in one block\), 65 a report, 99 assurances/);
  assert.match(text, /`process\.argv\[2\]` is that word, `"preimages"`; with none, `"fallback"`/);
  assert.match(lessonCode("5.2"), /const trace = process\.argv\[2\] \?\? "fallback";/);
});
