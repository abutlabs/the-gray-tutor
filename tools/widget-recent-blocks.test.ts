// Lesson 9.2's recent-blocks widget (.vitepress/theme/recent-blocks.ts): its β before block
// 50 is the lesson's run, line for line; each recorded block is what the chain really wrote
// (the next step's β); and the data is the vectors', where vectors/ is downloaded.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { componentKeyHex } from "../.vitepress/theme/part-flow.ts";
import { beltCount, drawBelt, recordBlock, RECENT_BLOCKS, STEPS, ZERO_ROOT } from "../.vitepress/theme/recent-blocks.ts";
import { lessonCode, lessonText, ROOT } from "./lessons.ts";

const LESSON = "09-recent-history/02-recent-blocks.md";
const raw = lessonText(LESSON);
const trace = (n: number) => join(ROOT, `vectors/traces/preimages/${String(n).padStart(8, "0")}.json`);

test("β before block 50 is the lesson's history run, line for line, and the belt reads 49", () => {
  const lines = [...raw.matchAll(/^slot\s+(\d+)\s+header (0x[0-9a-f]+…)\s+state root (0x[0-9a-f]+…)\s+beefy (0x[0-9a-f]+…)\s+reported: (\d)\s+belt ([●· ]+)$/gm)];
  assert.equal(lines.length, 8);
  const before = STEPS[0].before;
  assert.deepEqual(
    before.history.map((b) => [b.slot, b.header_hash, b.state_root, b.beefy_root, b.reported]),
    lines.map(([, s, h, r, by, n]) => [Number(s), h, r, by, Number(n)]),
  );
  // the belt column is each block's count in binary: 42 to 49 items, newest = the stored belt
  for (const [k, [, s, , , , , shape]] of lines.entries()) {
    const expected = [...(42 + k).toString(2)].reverse().map((b) => (b === "1" ? "●" : "·")).join(" ");
    assert.equal(shape, expected, `slot ${s}'s shape is its count in binary`);
  }
  assert.equal(lines.at(-1)![6], drawBelt(before.belt), "the newest row's shape is the stored belt's");
  assert.match(raw, /^the belt: ● · · · ● ●$/m);
  // the live fold's line lands on the newest block's beefy, as the program checks itself
  const fold = /^its super-peak, folded live: (0x[0-9a-f]+…) — the newest block's beefy ✓$/m.exec(raw);
  assert.ok(fold, "the folded-live line, with its check mark");
  assert.equal(fold![1], before.history.at(-1)!.beefy_root);
  assert.equal(drawBelt(before.belt), "● · · · ● ●");
  assert.equal(beltCount(before.belt), 49, "110001 in binary is 49");
  assert.match(lessonCode("9.2"), /export const RECENT_BLOCKS = 8;/);
  assert.equal(RECENT_BLOCKS, 8);
});

test("each block recorded by the lesson's three steps is the β the chain wrote before the next block", () => {
  for (let k = 0; k + 1 < STEPS.length; k++) {
    const { history, filled, dropped } = recordBlock(k);
    assert.deepEqual(history, STEPS[k + 1].before.history, `after block ${STEPS[k].block.slot}`);
    assert.equal(filled, STEPS[k].before.history.at(-1)!.slot);
    assert.equal(dropped, STEPS[k].before.history[0].slot, "the ninth entry pushes the oldest out");
    assert.equal(history.at(-1)!.state_root, ZERO_ROOT, "the new entry's root is zeros");
    assert.equal(beltCount(STEPS[k + 1].before.belt), beltCount(STEPS[k].before.belt) + 1, "the belt counts up one");
  }
  assert.deepEqual(recordBlock(0).history.map((b) => b.slot), [43, 44, 45, 46, 47, 48, 49, 50], "the check question: slots 43 to 50");
  assert.match(raw.replace(/\s+/g, " "), /Slots 43 to 50, with 49's state root filled in and 50's zeros/);
});

test("the steps are the preimages trace's own β and headers, where vectors/ is downloaded", { skip: !existsSync(trace(53)) && "no vectors/" }, () => {
  const key = componentKeyHex(3);
  for (const step of STEPS) {
    const t = JSON.parse(readFileSync(trace(step.n), "utf8"));
    const v = (t.pre_state.keyvals as { key: string; value: string }[]).find((e) => e.key === key)!.value.slice(2);
    let at = 0;
    const take = (n: number) => { const s = v.slice(at, at + 2 * n); at += 2 * n; return s; };
    const nat = () => { const b = parseInt(take(1), 16); assert.ok(b < 128); return b; };
    const short = (h: string) => `0x${h.slice(0, 8)}…`;
    const count = nat();
    assert.equal(count, step.before.history.length);
    for (const b of step.before.history) {
      const [header, beefy, root] = [short(take(32)), short(take(32)), short(take(32))];
      const slot = parseInt(take(4).match(/../g)!.reverse().join(""), 16);
      const r = nat(); for (let i = 0; i < r; i++) { take(32); take(32); }
      assert.deepEqual([slot, header, beefy, root, r], [b.slot, b.header_hash, b.beefy_root, b.state_root, b.reported], `block ${step.n}, slot ${slot}`);
    }
    const peaks = nat();
    assert.equal(peaks, step.before.belt.length);
    assert.equal(step.block.parent_state_root, short(t.block.header.parent_state_root.slice(2)));
    assert.equal(step.block.slot, t.block.header.slot);
  }
});

test("lesson 9.2 places the widget once, in Watch it after the run's reading", () => {
  const at = raw.indexOf("<RecentBlocks />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<RecentBlocks />"), "placed once");
  assert.ok(at > raw.indexOf("shows it all.") && at < raw.indexOf("## The scoreboard"));
});
