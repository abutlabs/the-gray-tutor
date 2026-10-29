// Lesson 9.1's super-peak widget (.vitepress/theme/super-peak.ts): the belts are the tiny
// history vectors' own, the fold is the lesson's superPeak (none → zeros, one → itself,
// else H("peak" ⌢ acc ⌢ next) left to right, with real Keccak), and every root is the
// vector's beefy_root.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { BELTS, PEAK_LABEL, superPeakSteps } from "../.vitepress/theme/super-peak.ts";
import { lessonText, ROOT } from "./lessons.ts";

const raw = lessonText("09-recent-history/01-the-mountain-belt.md");
const TINY_HISTORY = join(ROOT, "vectors/stf/history/tiny");

test("every belt's fold lands on its beefy_root, and the three cases behave", () => {
  for (const b of BELTS) {
    const { there, places, steps, root } = superPeakSteps(b.peaks);
    assert.equal(root, b.beefy, b.says);
    assert.equal(steps.length, Math.max(0, there.length - 1), `${b.says}: one merge per peak after the first`);
    // peak i of the fold is the i-th existing peak: ∅ places are skipped, subscripts slide
    assert.deepEqual(places, b.peaks.flatMap((p, i) => (p === null ? [] : [i])), `${b.says}: places`);
    assert.deepEqual(steps.map((s) => s.place), places.slice(1), `${b.says}: each step folds the next place in`);
  }
  // the 9-item belt of the lesson's prose: peak₀ is place 0, peak₁ is place 3
  assert.deepEqual(superPeakSteps(BELTS[4].peaks).places, [0, 3]);
  assert.equal(PEAK_LABEL, "peak");
  assert.match(BELTS[0].beefy, /^0x0{64}$/, "no peaks: 32 zero bytes");
  assert.equal(BELTS[1].beefy, BELTS[1].peaks[0], "one peak: itself, no hashing");
  assert.equal(BELTS[4].peaks[3], BELTS[3].peaks[3], "9 items: 8 items' mountain still standing, plus one");
  assert.deepEqual(BELTS.map((b) => b.items), [0, 1, 2, 8, 9]);
});

test("the belts and roots are the tiny history vectors', where vectors/ is downloaded", { skip: !existsSync(TINY_HISTORY) && "no vectors/" }, () => {
  for (const n of [1, 2, 3, 4]) {
    const v = JSON.parse(readFileSync(join(TINY_HISTORY, `progress_blocks_history-${n}.json`), "utf8"));
    const b = BELTS[n];
    assert.deepEqual(b.peaks, v.post_state.beta.mmr.peaks, `belt ${n}`);
    assert.equal(b.beefy, v.post_state.beta.history.at(-1).beefy_root, `beefy ${n}`);
  }
});

test("the lesson shows the widget after M_R's definition", () => {
  assert.match(raw, /<SuperPeak \/>/);
  assert.ok(raw.indexOf("the four letters `peak`") < raw.indexOf("<SuperPeak />"));
  // the fold is unrolled visually, and the subscript rule is said where the trace is
  assert.match(raw, /M_R = H\("peak" ⌢ acc ⌢ peak₃\)/, "the 15-item trace's last line");
  assert.ok(raw.indexOf("acc = peak₀") < raw.indexOf("<SuperPeak />"), "the trace comes before the widget");
  assert.match(raw.replace(/\s+/g, " "), /∅ places are skipped/);
  // the three names are equated in one place: M_R = super-peak = beefy_root
  assert.match(raw.replace(/\s+/g, " "), /One value, three names: \*\*M_R\*\*/);
  assert.ok(raw.indexOf("<MountainBelt />") < raw.indexOf("<SuperPeak />"));
  assert.match(raw.replace(/\s+/g, " "), /hashed live on this page/);
  assert.match(raw.replace(/\s+/g, " "), /every answer is the vector's own `beefy_root`/);
});
