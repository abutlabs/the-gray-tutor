// Lesson 16.8's lookup widget (.vitepress/theme/lookup-call.ts): the hashes really are
// blake2b of the bytes, the foreign blob is the vector's, the window clamps as the
// lesson's code does, and the gas matches the lesson's test (600 + 25 for 100 asked for).

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { call, FOREIGN, gasFor, HELLO, NOBODY, WHOSE } from "../.vitepress/theme/lookup-call.ts";
import { H } from "../.vitepress/theme/hash.ts";
import { lessonText, ROOT } from "./lessons.ts";

const raw = lessonText("16-host-calls/08-lookup.md");
const VECTOR = join(ROOT, "vectors/stf/accumulate/tiny/lookup_foreign_preimage-1.json");
const hx = (bytes: number[]) => `0x${bytes.map((b) => b.toString(16).padStart(2, "0")).join("")}`;
const ascii = (s: string) => Array.from(new TextEncoder().encode(s));

test("each hash is blake2b of its bytes, and the words are the lesson's tests'", () => {
  assert.deepEqual(HELLO.bytes, ascii("hello, JAM"));
  assert.equal(HELLO.hash, hx(H(HELLO.bytes)));
  assert.equal(NOBODY.hash, hx(H(ascii("nobody provided this"))));
  assert.equal(FOREIGN.hash, hx(H(FOREIGN.bytes)));
  assert.equal(new TextDecoder().decode(Uint8Array.from(FOREIGN.bytes)), "preimage");
});

test("the foreign blob is service 1729's in the vector, where vectors/ is downloaded", { skip: !existsSync(VECTOR) && "no vectors/" }, () => {
  const v = JSON.parse(readFileSync(VECTOR, "utf8"));
  const svc = v.pre_state.accounts.find((a: { id: number }) => a.id === 1729);
  const blob = svc.data.preimage_blobs.find((p: { hash: string }) => p.hash === FOREIGN.hash);
  assert.equal(blob.blob, hx(FOREIGN.bytes));
});

test("the gas is 600 plus 248 per KiB asked for, charged whatever comes back", () => {
  assert.equal(gasFor(100), 625, "the lesson's test: 10,000 − 600 − 25");
  assert.deepEqual([gasFor(0), gasFor(10), gasFor(4096)], [600, 603, 1592]);
  assert.equal(call({ whose: 3, hash: 0, from: 0, atMost: 100, readable: true }).gas, 625, "NONE pays too");
  assert.equal(call({ whose: 0, hash: 0, from: 0, atMost: 100, readable: false }).gas, 625, "a panic pays too");
});

test("whose preimages: own by id or 2^64 − 1, another service's, or NONE", () => {
  assert.deepEqual(WHOSE.map((w) => w.account), [0, 0, 1729, null]);
  const found = call({ whose: 0, hash: 0, from: 0, atMost: 100, readable: true });
  assert.deepEqual([found.exit, found.r7, found.landed], ["continue", "10", HELLO.bytes], "the lesson's first test");
  assert.equal(call({ whose: 1, hash: 0, from: 0, atMost: 100, readable: true }).r7, "10", "the id works like 2^64 − 1");
  const foreign = call({ whose: 2, hash: 1, from: 0, atMost: 100, readable: true });
  assert.deepEqual([foreign.r7, foreign.landed], ["8", FOREIGN.bytes], "lookup_foreign_preimage's read");
  assert.equal(call({ whose: 2, hash: 0, from: 0, atMost: 100, readable: true }).r7, "NONE", "1729 doesn't keep hello, JAM");
  assert.equal(call({ whose: 0, hash: 2, from: 0, atMost: 100, readable: true }).r7, "NONE", "the lesson's second test");
  assert.equal(call({ whose: 3, hash: 0, from: 0, atMost: 100, readable: true }).r7, "NONE", "service 42 isn't there");
  assert.equal(call({ whose: 0, hash: 0, from: 0, atMost: 100, readable: false }).exit, "panic");
});

test("the window clamps as fetch's does, and φ₇ is the full length either way", () => {
  const slice = call({ whose: 0, hash: 0, from: 4, atMost: 10, readable: true });
  assert.deepEqual([slice.f, slice.l, slice.r7], [4, 6, "10"]);
  assert.equal(new TextDecoder().decode(Uint8Array.from(slice.landed)), "o, JAM");
  const past = call({ whose: 0, hash: 0, from: 100, atMost: 10, readable: true });
  assert.deepEqual([past.f, past.l, past.landed, past.r7], [10, 0, [], "10"], "asking past the end copies nothing, φ₇ still the length");
  const nothing = call({ whose: 0, hash: 0, from: 0, atMost: 0, readable: true });
  assert.deepEqual([nothing.l, nothing.r7, nothing.gas], [0, "10", 600]);
});

test("the lesson shows the widget before its tests", () => {
  assert.match(raw, /<LookupCall \/>/);
  assert.ok(raw.indexOf("<LookupCall />") < raw.indexOf("## The tests"));
  assert.match(raw.replace(/\s+/g, " "), /its bytes spell "preimage"/);
  assert.match(raw.replace(/\s+/g, " "), /charged before the preimage is even found/);
});
