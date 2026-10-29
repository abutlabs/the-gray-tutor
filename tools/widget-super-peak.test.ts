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
    const { there, steps, root } = superPeakSteps(b.peaks);
    assert.equal(root, b.beefy, b.says);
    assert.equal(steps.length, Math.max(0, there.length - 1), `${b.says}: one merge per peak after the first`);
  }
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
  assert.ok(raw.indexOf("<MountainBelt />") < raw.indexOf("<SuperPeak />"));
  assert.match(raw.replace(/\s+/g, " "), /hashed live on this page/);
  assert.match(raw.replace(/\s+/g, " "), /every answer is the vector's own `beefy_root`/);
});
