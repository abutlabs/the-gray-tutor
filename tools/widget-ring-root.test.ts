// Lesson 8.8's ring-root widget (.vitepress/theme/ring-root.ts): the seats are the tiny
// vector enact-epoch-change-with-padding-1.json's staging keys, and the precomputed roots
// carry the vector's facts: zeroing just the offender gives the vector's own γ′_Z;
// validator 3's off-curve key never changes a root; the last 48 bytes never change at all.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { bytesChanged, describeRing, maskOf, rootFor, SEATS, VECTOR_ROOT } from "../.vitepress/theme/ring-root.ts";
import { lessonText, ROOT } from "./lessons.ts";

const raw = lessonText("08-safrole/08-the-ring-root.md");
const VECTOR = join(ROOT, "vectors/stf/safrole/tiny/enact-epoch-change-with-padding-1.json");
const zeroedOnly = (...indexes: number[]) => SEATS.map((s) => indexes.includes(s.index));

test("the seats and γ′_Z are the vector's, where vectors/ is downloaded", { skip: !existsSync(VECTOR) && "no vectors/" }, () => {
  const v = JSON.parse(readFileSync(VECTOR, "utf8"));
  assert.deepEqual(SEATS.map((s) => s.key), v.pre_state.iota.map((k: { bandersnatch: string }) => k.bandersnatch));
  // the offender is validator 1, named by its Ed25519 key, and Φ zeroes its seat in γ′_P
  assert.equal(v.pre_state.iota[1].ed25519, v.pre_state.post_offenders[0]);
  assert.deepEqual(SEATS.map((s) => s.offender), [false, true, false, false, false, false]);
  assert.match(v.post_state.gamma_k[1].bandersnatch, /^0x0{64}$/);
  assert.equal(rootFor(zeroedOnly(1)), v.post_state.gamma_z, "the offender zeroed: the vector's γ′_Z");
  assert.equal(VECTOR_ROOT, v.post_state.gamma_z);
});

test("64 rings: every root is 144 bytes, and only validator 3's bit never matters", () => {
  const masks = Array.from({ length: 64 }, (_, m) => m);
  const roots = masks.map((m) => rootFor(SEATS.map((s) => Boolean(m & (1 << s.index)))));
  for (const root of roots) assert.match(root, /^0x[0-9a-f]{288}$/);
  assert.equal(new Set(roots).size, 32, "each root is shared by a pair of masks");
  for (const m of masks) {
    assert.equal(roots[m], roots[m ^ 8], `zeroing validator 3 changes nothing: its key isn't on the curve (mask ${m})`);
    for (const i of [0, 1, 2, 4, 5]) assert.notEqual(roots[m], roots[m ^ (1 << i)], `zeroing validator ${i} makes a new root (mask ${m})`);
  }
  assert.deepEqual(SEATS.map((s) => s.onCurve), [true, true, true, false, true, true]);
});

test("the avalanche, and the point that sits still: the last 48 bytes come from the setup", () => {
  const all = rootFor(zeroedOnly());
  const fixed = all.slice(2 + 192);
  for (let m = 0; m < 64; m++) {
    const root = rootFor(SEATS.map((s) => Boolean(m & (1 << s.index))));
    assert.equal(root.slice(2 + 192), fixed, `mask ${m}'s last 48 bytes`);
    for (const i of [0, 1, 2, 4, 5]) {
      const other = rootFor(SEATS.map((s) => (s.index === i ? !(m & (1 << i)) : Boolean(m & (1 << s.index)))));
      assert.ok(bytesChanged(root, other) >= 90, `one key moves most of the 96 pressed bytes (mask ${m}, validator ${i})`);
    }
  }
});

test("maskOf and describeRing say what the widget shows", () => {
  assert.equal(maskOf(zeroedOnly(1)), 2);
  assert.equal(maskOf(zeroedOnly(0, 5)), 33);
  assert.equal(describeRing(zeroedOnly()), "5 seats hold a key; one is the padding point: validator 3's key, never on the curve");
  assert.equal(
    describeRing(zeroedOnly(1)),
    "4 seats hold a key; 2 are the padding point: validator 1's zeros; validator 3's key, never on the curve",
  );
});

test("the lesson shows the widget, between the rules and the library", () => {
  assert.match(raw, /<RingRoot \/>/);
  assert.ok(raw.indexOf("<RingRoot />") < raw.indexOf("### A library, not code of your own"));
  assert.match(raw.replace(/\s+/g, " "), /the real ring the tiny vector `enact-epoch-change-with-padding-1\.json` rotates in/);
  assert.match(raw.replace(/\s+/g, " "), /validator 3's key isn't a point on the curve/);
});
