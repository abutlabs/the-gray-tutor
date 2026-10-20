// Lesson 5.3's vector step-through (.vitepress/theme/vector-step.ts, assurance-vector.ts): the
// fields its tests read, copied from the official vector as they are; each assurance checked
// as the lesson's assuranceSigned does, with the verdicts its third test expects; and every
// field of the file accounted for, with the lesson that reads the rest.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ASSURANCES, ED25519_KEYS } from "../.vitepress/theme/assurance-vector.ts";
import { FIELDS, FILE, LATER, STEPS } from "../.vitepress/theme/vector-step.ts";
import { lessonCode, lessonText, ROOT } from "./lessons.ts";

const VECTOR = join(ROOT, FILE);
const LESSON = "05-hashing-and-signatures/03-signatures.md";

test("the data is the vector's input.assurances and curr_validators' ed25519 keys, as they are", { skip: !existsSync(VECTOR) && "no vectors/" }, () => {
  const v = JSON.parse(readFileSync(VECTOR, "utf8"));
  assert.deepEqual(ASSURANCES, v.input.assurances);
  assert.deepEqual(ED25519_KEYS, v.pre_state.curr_validators.map((x: { ed25519: string }) => x.ed25519));
  assert.deepEqual(v.output, { err: "bad_signature" });
});

test("each step is the lesson's check: keys[validator_index], jam_available then H(anchor ⌢ bitfield), and the third test's verdicts", () => {
  const code = lessonCode("5.3");
  assert.match(code, /const AVAILABLE = new TextEncoder\(\)\.encode\("jam_available"\);/);
  assert.match(code, /return concatBytes\(AVAILABLE, blake2b256\(concatBytes\(assurance\.anchor, assurance\.bitfield\)\)\);/);
  assert.match(code, /const key = keys\[assurance\.validator_index\];/);
  const expected = /assert\.deepEqual\(signed, \[([^\]]+)\]\);/.exec(code)![1].split(",").map((x) => x.trim() === "true");
  assert.deepEqual(STEPS.map((s) => s.valid), expected);
  for (const s of STEPS) {
    assert.equal(s.key, ED25519_KEYS[ASSURANCES[s.index].validator_index]);
    assert.equal(s.messageBytes, 13 + 32);
  }
});

test("every field of the file is on the map: read today, or with the lesson that reads it", { skip: !existsSync(VECTOR) && "no vectors/" }, () => {
  const v = JSON.parse(readFileSync(VECTOR, "utf8"));
  const paths = [
    ...Object.keys(v.input.assurances[0]).map((k) => `input.assurances[i].${k}`),
    ...Object.keys(v.input).filter((k) => k !== "assurances").map((k) => `input.${k}`),
    ...Object.keys(v.pre_state).filter((k) => k !== "curr_validators").map((k) => `pre_state.${k}`),
    "pre_state.curr_validators[i].ed25519", "output", "post_state",
  ];
  const mapped = FIELDS.map((f) => f.path);
  for (const p of paths) assert.ok(mapped.includes(p), `${p} is on the map`);
  assert.deepEqual(Object.keys(v.pre_state.curr_validators[0]).filter((k) => k !== "ed25519"), ["bandersnatch", "bls", "metadata"]);
  for (const f of FIELDS) assert.equal(Boolean(f.read), !(f.path in LATER), `${f.path}: read today, or a lesson later`);
  // the lessons named really read those fields
  assert.match(lessonText("11-assurances/01-available.md"), /avail_assignments/);
  assert.match(lessonText("11-assurances/02-timeouts.md"), /input\.slot|slot/);
  assert.match(lessonText("11-assurances/03-bad-assurances.md"), /output\.err/);
  assert.match(lessonText("11-assurances/03-bad-assurances.md"), /parent/);
});

test("lesson 5.3 places it once, where the tests meet the vector", () => {
  const raw = lessonText(LESSON);
  const at = raw.indexOf("<VectorStep />");
  assert.ok(at > raw.indexOf("In `assurances_with_bad_signature-1`, one isn't.") && at < raw.indexOf("**New file** `test/signature.test.ts`"));
  assert.equal(raw.split("<VectorStep />").length, 2);
});
