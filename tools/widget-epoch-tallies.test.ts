// Lesson 18.1's tallies widget (.vitepress/theme/epoch-tallies.ts): the steps are the
// lesson's updateValidatorStats in its order, and they end as the run and the vector say.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { BLOCK, newEpoch, steps } from "../.vitepress/theme/epoch-tallies.ts";
import { lessonCode, lessonText, ROOT } from "./lessons.ts";

const raw = lessonText("18-statistics/01-who-did-what.md");
const code = lessonCode("18.1");
const VECTOR = join(ROOT, "vectors/stf/statistics/tiny/stats_with_epoch_change-1.json");

test("the order is the lesson's: assurances, then the page turns, then the rest", () => {
  const at = (s: string) => code.indexOf(s);
  assert.ok(at("current[a.validator_index].assurances += 1") < at("last = current;") && at("last = current;") < at("mine.blocks += 1;"));
  assert.ok(newEpoch(BLOCK.from, BLOCK.to));
  assert.match(raw, /^slot 123455 → 123456: a new epoch begins$/m);
});

test("the run: every validator's fresh tally", () => {
  const end = steps().at(-1)!;
  const lines = [...raw.matchAll(/^validator (\d): fresh → ([\d ]+)$/gm)];
  assert.equal(lines.length, 6);
  for (const [, v, row] of lines) assert.deepEqual(end.current[Number(v)], row.split(" ").map(Number), `validator ${v}`);
});

test("the vector: the assurances land in what becomes the last epoch's tally", { skip: !existsSync(VECTOR) && "no vectors/" }, () => {
  const v = JSON.parse(readFileSync(VECTOR, "utf8"));
  const f = (s: Record<string, number>[]) => s.map((x) => [x.blocks, x.tickets, x.pre_images, x.pre_images_size, x.guarantees, x.assurances]);
  const end = steps().at(-1)!;
  assert.deepEqual(end.current, f(v.post_state.vals_curr_stats));
  assert.deepEqual(end.last, f(v.post_state.vals_last_stats));
  assert.deepEqual(steps()[0].current, f(v.pre_state.vals_curr_stats));
  const e = v.input.extrinsic;
  assert.deepEqual([v.pre_state.slot, v.input.slot, v.input.author_index, e.tickets.length], [BLOCK.from, BLOCK.to, BLOCK.author, BLOCK.tickets]);
  assert.deepEqual(e.assurances.map((a: { validator_index: number }) => a.validator_index), BLOCK.assurers);
  assert.deepEqual(e.preimages.map((p: { blob: string }) => (p.blob.length - 2) / 2), BLOCK.preimageSizes);
});

test("with no epoch change, everything lands in one tally", () => {
  const end = steps(false).at(-1)!;
  assert.equal(end.current[0][5], steps()[0].current[0][5] + 1);
  assert.deepEqual(end.last, steps()[0].last);
});

test("lesson 18.1 places the widget once, at the top, and the three steps send the reader back to it before why", () => {
  const at = raw.indexOf("<EpochTallies />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<EpochTallies />"));
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  const back = raw.indexOf("(#try-it)", raw.indexOf("Every reporter gets one more guarantee."));
  assert.ok(back > 0 && back < raw.indexOf("Why track only these?"));
});
