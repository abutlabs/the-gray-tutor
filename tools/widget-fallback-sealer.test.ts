// Lesson 8.3's fallback-sealer widget (.vitepress/theme/fallback-sealer.ts): every slot's
// draw seats the validator the run prints, its key is the vector's γ_S, and the steps are
// the lesson's fallbackKeys line for line.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { DRAWS, ETA_2, KAPPA, TALLY } from "../.vitepress/theme/fallback-sealer.ts";
import { lessonCode, lessonText, ROOT } from "./lessons.ts";

const raw = lessonText("08-safrole/03-the-fallback-sealers.md");
const code = lessonCode("8.3");
const VECTOR = join(ROOT, "vectors/stf/safrole/tiny/enact-epoch-change-with-no-tickets-4.json");

test("the steps are fallbackKeys': H(r ⌢ ℰ₄(i)), the first four bytes, mod the set", () => {
  assert.match(code, /const hash = blake2b256\(concatBytes\(r, encodeFixed\(BigInt\(i\), 4\)\)\);/);
  assert.match(code, /const index = Number\(decodeFixed\(hash\.subarray\(0, 4\)\)\) % validators\.length;/);
  for (const d of DRAWS) {
    assert.deepEqual(d.input.slice(32), [d.slot, 0, 0, 0], "ℰ₄(i): little-endian, 4 bytes");
    assert.equal(d.validator, d.number % 6);
    assert.ok(d.number < 2 ** 32);
  }
});

test("every slot seats the validator the run prints, and the tally is the lesson's", () => {
  const lines = [...raw.matchAll(/^slot +(\d+) of the epoch: validator (\d)$/gm)].map((m) => [Number(m[1]), Number(m[2])]);
  assert.equal(lines.length, 12);
  assert.deepEqual(DRAWS.map((d) => [d.slot, d.validator]), lines);
  assert.match(raw.replace(/\s+/g, " "), /validator 1 seals 5 of the 12 slots, validators 2, 3 and 4 just one each/);
  assert.deepEqual([TALLY[1], TALLY[2], TALLY[3], TALLY[4]], [5, 1, 1, 1]);
  assert.equal(TALLY.reduce((a, b) => a + b, 0), 12);
});

test("η′₂ and κ′ are the vector's old η₁ and γ_K, and the keys its γ_S, where vectors/ is downloaded", { skip: !existsSync(VECTOR) && "no vectors/" }, () => {
  const { pre_state, post_state } = JSON.parse(readFileSync(VECTOR, "utf8"));
  assert.equal(ETA_2, pre_state.eta[1]);
  assert.deepEqual(KAPPA, pre_state.gamma_k.map((k: { bandersnatch: string }) => k.bandersnatch));
  assert.deepEqual(DRAWS.map((d) => d.key), post_state.gamma_s.keys);
});

test("lesson 8.3 places the widget once, at the top, and F's steps send the reader back to it", () => {
  const at = raw.indexOf("<FallbackSealer />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<FallbackSealer />"));
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  assert.ok(raw.indexOf("take that validator of the *new* active set") > raw.indexOf("## What the Gray Paper says"));
  assert.match(raw, /\[The draw at the top\]\(#try-it\) is F on the run's real epoch/);
});
