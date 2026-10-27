// Lesson 6.3's validator-key widget (.vitepress/theme/validator-key.ts): its parts are the
// lesson's ValidatorKey record, its sizes the lesson's 336 and 2,017, and its keys the
// vectors' six validators.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { componentKeyHex } from "../.vitepress/theme/part-flow.ts";
import { KAPPA_BYTES, KEY_BYTES, KEYS, keyStart, PARTS, rangeOf, readsAs, swapped, VALIDATOR_COUNT } from "../.vitepress/theme/validator-key.ts";
import { lessonCode, lessonText } from "./lessons.ts";
import { ROOT } from "./lessons.ts";

const LESSON = "06-state-and-merklization/03-reading-the-state.md";
const raw = lessonText(LESSON);
const text = raw.replace(/\s+/g, " ");
const TRACE = join(ROOT, "vectors/traces/safrole/00000012.json");

test("the four parts are lesson 6.3's ValidatorKey, in its order, with its widths", () => {
  const m = /export const ValidatorKey = record\(\{([\s\S]*?)\}\);/.exec(lessonCode("6.3"));
  assert.ok(m);
  const fields = [...m[1].matchAll(/^\s+(\w+): fixedBytes\((\d+)\)/gm)].map(([, name, w]) => `${name}:${w}`);
  assert.deepEqual(PARTS.map((p) => `${p.name}:${p.width}`), fields);
  assert.equal(KEY_BYTES, 336);
  assert.deepEqual([rangeOf(PARTS, "bandersnatch"), rangeOf(PARTS, "ed25519"), rangeOf(PARTS, "bls"), rangeOf(PARTS, "metadata")],
    [{ start: 0, end: 32 }, { start: 32, end: 64 }, { start: 64, end: 208 }, { start: 208, end: 336 }]);
  assert.match(text, /The Ed25519 key, bytes 32 to 63/);
  assert.match(text, /The BLS key, bytes 64 to 207/);
});

test("κ is a count byte then six keys: 1 + 6 × 336 = 2,017, the check question's", () => {
  assert.equal(VALIDATOR_COUNT, 6);
  assert.equal(KAPPA_BYTES, 2017);
  assert.match(text, /1 \+ 6 × 336 = 2,017/);
  assert.equal(keyStart(0), 1);
  assert.equal(keyStart(5) + KEY_BYTES, KAPPA_BYTES);
});

test("κ0's Ed25519 key is the lesson's 0x4418fb8c…, and swapping the fields reads the other key", () => {
  assert.match(raw, /κ0: ed25519 0x4418fb8c85bb3985394a8c2756d3643457ce614546202a2f50b093d762499ace/);
  assert.equal(KEYS[0].ed25519, "0x4418fb8c85bb3985394a8c2756d3643457ce614546202a2f50b093d762499ace");
  assert.equal(readsAs(PARTS, 0, "ed25519"), "0x4418fb8c…");
  const s = swapped(PARTS);
  assert.deepEqual(s.map((p) => p.name), ["ed25519", "bandersnatch", "bls", "metadata"]);
  assert.equal(readsAs(s, 0, "ed25519"), `${KEYS[0].bandersnatch.slice(0, 10)}…`, "the Bandersnatch bytes, read as Ed25519");
  assert.equal(readsAs(s, 0, "bls"), "144 bytes");
  assert.deepEqual(swapped(s), PARTS, "swapping again puts the fields back");
});

test("the six keys are the ones in κ before block 12 of the safrole trace, where vectors/ is downloaded", { skip: !existsSync(TRACE) && "no vectors/" }, () => {
  const kv = JSON.parse(readFileSync(TRACE, "utf8")).pre_state.keyvals as { key: string; value: string }[];
  const kappa = kv.find((e) => e.key === componentKeyHex(8))!.value.slice(2);
  assert.equal(kappa.length / 2, KAPPA_BYTES);
  assert.equal(kappa.slice(0, 2), "06");
  for (let i = 0; i < VALIDATOR_COUNT; i++) {
    const key = kappa.slice(2 + i * KEY_BYTES * 2, 2 + (i + 1) * KEY_BYTES * 2);
    assert.equal(`0x${key.slice(0, 64)}`, KEYS[i].bandersnatch, `κ${i} bandersnatch`);
    assert.equal(`0x${key.slice(64, 128)}`, KEYS[i].ed25519, `κ${i} ed25519`);
  }
});

test("lesson 6.3 places the widget once, in What the Gray Paper says after the validator key paragraph", () => {
  const at = raw.indexOf("<ValidatorKeyMap />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<ValidatorKeyMap />"), "placed once");
  assert.ok(at > raw.indexOf("The state keeps all four parts.") && at < raw.indexOf("## The tests"));
});
