// Lesson 12.2's reporters widget (.vitepress/theme/signed-counted.ts): the message is the
// lesson's, all six real signatures check, 𝐆 is the run's three keys in its order, and an
// offender's zeroed key fails its signature; the guarantees and keys are the vector's.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { checked, GUARANTEES, KEYS, reporters } from "../.vitepress/theme/signed-counted.ts";
import { lessonCode, lessonText, ROOT } from "./lessons.ts";

const raw = lessonText("12-guarantees/02-signed-and-counted.md");
const VECTOR = join(ROOT, "vectors/stf/reports/tiny/different_core_same_guarantors-1.json");

test("the message and the set are the lesson's: X_G ⌢ H(ℰ(report)), and each key once, sorted", () => {
  const code = lessonCode("12.2");
  assert.match(code, /const message = guaranteeMessage\(blake2b256\(encode\(WorkReport, guarantee\.report\)\)\);/);
  assert.match(code, /return concatBytes\(GUARANTEE, reportHash\);/);
  assert.match(code, /return \[\.\.\.new Set\(signers\.map\(toHex\)\)\]\.sort\(\)\.map\(fromHex\);/);
});

test("the run: both cores signed by the same three keys, all real, and 𝐆 is 3 of 6", () => {
  const out = checked(new Set());
  const lines = [...raw.matchAll(/^core (\d): signed by (.+); all real: (true|false)$/gm)];
  assert.equal(lines.length, 2);
  for (const [k, [, core, signers, real]] of lines.entries()) {
    assert.equal(out[k].core, Number(core));
    assert.deepEqual(out[k].signatures.map((s) => `${s.key.slice(0, 10)}…`), signers.split(", "));
    assert.equal(out[k].signatures.every((s) => s.ok), real === "true");
  }
  const G = reporters(out.flatMap((g) => g.signatures.map((s) => s.key)));
  assert.match(raw, /^𝐆, the reporters: 3 of 6 signatures' keys$/m);
  const listed = [...raw.matchAll(/^ {2}(0x[0-9a-f]{64})$/gm)].map((m) => m[1]);
  assert.deepEqual(G, listed);
});

test("an offender's key is zeros, so its genuine signature fails, on every guarantee it signed", () => {
  for (const v of Object.keys(KEYS).map(Number)) {
    const out = checked(new Set([v]));
    for (const g of out) for (const s of g.signatures) assert.equal(s.ok, s.validator !== v, `validator ${s.validator} with ${v} an offender`);
  }
  assert.match(raw, /an offender's key is all zeros\.\s+So even a genuine signature from an offender can't check out\./);
});

test("the guarantees and keys are the vector's, and 𝐆 its reporters, where vectors/ is downloaded", { skip: !existsSync(VECTOR) && "no vectors/" }, () => {
  const v = JSON.parse(readFileSync(VECTOR, "utf8"));
  assert.deepEqual(GUARANTEES.map((g) => ({ report: g.report, slot: g.slot, signatures: g.signatures })), v.input.guarantees);
  for (const [i, key] of Object.entries(KEYS)) assert.equal(key, v.pre_state.curr_validators[Number(i)].ed25519);
  assert.deepEqual(reporters(checked(new Set()).flatMap((g) => g.signatures.map((s) => s.key))), v.output.ok.reporters);
});

test("lesson 12.2 places the widget once, at the top, and sends the reader back to it once 𝐆 is defined", () => {
  const at = raw.indexOf("<SignedCounted />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<SignedCounted />"));
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  const back = raw.indexOf("(#try-it)", raw.indexOf("each key once, however many guarantees it signed."));
  assert.ok(back > 0 && back < raw.indexOf("## Sharing a message"));
});
