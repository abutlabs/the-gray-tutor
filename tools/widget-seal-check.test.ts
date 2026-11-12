// Lesson 8.9's seal-check widget (.vitepress/theme/seal-check.ts): its five blocks are the
// seals run's, line for line; its checks are sealError's in the code's order; its forgeries
// give the lesson's test's verdicts; its byte bar is the header codec's layout.

import { test } from "node:test";
import assert from "node:assert/strict";
import { BLOCKS, checks, FIELDS, HEADER_BYTES, SEAL_BYTES, UNSIGNED_BYTES, verdict } from "../.vitepress/theme/seal-check.ts";
import { lessonCode, lessonText } from "./lessons.ts";

const LESSON = "08-safrole/09-seals.md";
const raw = lessonText(LESSON);
const code = lessonCode("8.9");
const none = new Set<"seal" | "stranger" | "source">();

test("blocks 46 to 50 are the seals run's lines: validator, key and whether a ticket or a fallback key", () => {
  const lines = [...raw.matchAll(/^block (\d+), slot (\d+): validator (\d) \((0x[0-9a-f]+…)\), by a (fallback key|winning ticket): seal and entropy source check out$/gm)];
  assert.equal(lines.length, 5);
  assert.deepEqual(BLOCKS, lines.map(([, n, slot, author, key, by]) => ({ n: Number(n), slot: Number(slot), author: Number(author), key, by: by === "winning ticket" ? "ticket" : "fallback" })));
  for (const b of BLOCKS) assert.equal(verdict(b, none), null, `block ${b.n} checks out`);
});

test("the checks follow sealError: a fallback slot's key first, the signature, a ticket's id, then the entropy source", () => {
  assert.match(code, /if \(toHex\(sealers\.keys\[phase\]\) !== toHex\(author\)\) return "bad_seal";/);
  assert.match(code, /if \(!output \|\| toHex\(output\) !== toHex\(ticket\.id\)\) return "bad_seal";/);
  assert.match(code, /return source \? null : "bad_entropy_source";/);
  assert.deepEqual(checks(BLOCKS[0], none).map((c) => c.ok), [true, true, true], "a fallback slot: three checks");
  assert.deepEqual(checks(BLOCKS[2], none).map((c) => c.ok), [true, true, true], "a ticket slot: three checks");
  assert.match(checks(BLOCKS[0], none)[1].context!, /^X_F ⌢ η′₃$/);
  assert.match(checks(BLOCKS[2], none)[0].context!, /^X_T ⌢ η′₃ ⌢ the ticket's attempt$/);
});

test("the forgeries: a flipped seal, a stranger's key and a flipped entropy source are all bad_seal, as the test says", () => {
  assert.match(code, /seal\[40\] \^= 1;[\s\S]*assert\.equal\(forged, "bad_seal"\);[\s\S]*assert\.equal\(notTheAuthor, "bad_seal"\);[\s\S]*source\[40\] \^= 1;[\s\S]*assert\.equal\(badSource, "bad_seal"\);/);
  for (const b of BLOCKS) {
    assert.equal(verdict(b, new Set(["seal"])), "bad_seal", `block ${b.n}: a forged seal`);
    assert.equal(verdict(b, new Set(["stranger"])), "bad_seal", `block ${b.n}: a stranger`);
    assert.equal(verdict(b, new Set(["source"])), "bad_seal", `block ${b.n}: the seal signs the entropy source`);
  }
  assert.equal(checks(BLOCKS[0], new Set(["stranger"]))[0].ok, false, "a fallback slot catches a stranger without cryptography");
  assert.match(raw.replace(/\s+/g, " "), /Change one bit of H_V and the seal fails first/);
});

test("the byte bar: 297 bytes, 201 signed, the seal the last 96, as the lesson says", () => {
  assert.match(raw.replace(/\s+/g, " "), /headers are 297 bytes, so 201 unsigned/);
  assert.deepEqual([HEADER_BYTES, UNSIGNED_BYTES, SEAL_BYTES], [297, 201, 96]);
  assert.equal(FIELDS.at(-1)!.name, "seal");
  assert.deepEqual([FIELDS.at(-1)!.from, FIELDS.at(-1)!.to], [201, 297]);
  const source = FIELDS.find((f) => f.name === "entropy_source")!;
  assert.ok(source.to <= UNSIGNED_BYTES, "the entropy source is inside what the seal signs");
});

test("lesson 8.9 places the widget once, at the top, and the order note sends the reader back to it", () => {
  const at = raw.indexOf("<SealCheck />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<SealCheck />"), "placed once");
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  assert.match(raw, /Change one bit of H_V and the seal fails first\. Try it \[at the top\]\(#try-it\)\./);
});
