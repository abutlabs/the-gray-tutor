// Lesson 8.1's entropy-stairs widget (.vitepress/theme/entropy-stairs.ts): its three
// vectors are the safrole vectors' values, its stirring gives each one's post-state, and
// the new-epoch case is the lesson's Output, line for line.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { epochsSkipped, ETA_VECTORS, isNewEpoch, nextEntropy, SAYS, short } from "../.vitepress/theme/entropy-stairs.ts";
import { lessonCode, lessonText, ROOT } from "./lessons.ts";

const LESSON = "08-safrole/01-stirring-the-entropy.md";
const raw = lessonText(LESSON);
const vector = (name: string) => join(ROOT, `vectors/stf/safrole/tiny/${name}.json`);
const by = (name: string) => ETA_VECTORS.find((v) => v.name === name)!;

test("the three vectors are the safrole vectors' own values, where vectors/ is downloaded", { skip: !existsSync(vector("skip-epochs-1")) && "no vectors/" }, () => {
  for (const v of ETA_VECTORS) {
    const j = JSON.parse(readFileSync(vector(v.name), "utf8"));
    assert.deepEqual([v.tau, v.slot, v.vrf, v.before, v.after], [j.pre_state.tau, j.input.slot, j.input.entropy, j.pre_state.eta, j.post_state.eta], v.name);
  }
});

test("η′ stirred in the page is each vector's post-state: the lesson's nextEntropy", () => {
  assert.match(lessonCode("8.1"), /const accumulator = blake2b256\(concatBytes\(entropy\[0\], vrfOutput\)\);\s*return \[accumulator, \.\.\.entropyHistory\(entropy, newEpoch\)\];/);
  for (const v of ETA_VECTORS) assert.deepEqual(nextEntropy(v), v.after, v.name);
  assert.equal(ETA_VECTORS.length, 3);
  for (const v of ETA_VECTORS) assert.ok(SAYS[v.name], `${v.name} has its words`);
});

test("the new-epoch vector is the lesson's entropy run, line for line, and the skip moves once", () => {
  const v = by("enact-epoch-change-with-no-tickets-4");
  assert.match(raw, /^slot 10 → 15: a new epoch$/m);
  assert.deepEqual([v.tau, v.slot, isNewEpoch(v)], [10, 15, true]);
  assert.match(raw, new RegExp(`^VRF output ${short(v.vrf).replace(/\./g, "\\.")}$`, "m"));
  const after = nextEntropy(v);
  for (let k = 0; k < 4; k++) assert.match(raw, new RegExp(`^η${k}  ${short(v.before[k])}  →  ${short(after[k])}$`, "m"), `η${k}`);
  const same = by("publish-tickets-no-mark-2");
  assert.ok(!isNewEpoch(same));
  assert.deepEqual(nextEntropy(same).slice(1), same.before.slice(1), "only η₀ changes");
  const skip = by("skip-epochs-1");
  assert.deepEqual([skip.tau, skip.slot, epochsSkipped(skip)], [10, 46, 3]);
  assert.deepEqual(nextEntropy(skip).slice(1), skip.before.slice(0, 3), "moved along just one place");
  assert.match(raw.replace(/\s+/g, " "), /jumps from slot 10 to slot 46, straight over two whole epochs/);
});

test("lesson 8.1 places the widget once, at the top, and the rule sends the reader back to it", () => {
  const at = raw.indexOf("<EntropyStairs />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<EntropyStairs />"), "placed once");
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  assert.match(raw, /\[The stairs at the top\]\(#try-it\)/);
  assert.match(raw, /shows the same staircase\./);
});
