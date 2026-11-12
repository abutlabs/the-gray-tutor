// Lesson 3.3's big-picture widget (.vitepress/theme/shard-journey.ts): the six shards under
// their erasure root, each validator's check, and what any mix of holders, offline
// validators and liars comes to, against the lesson's numbers.

import { test } from "node:test";
import assert from "node:assert/strict";
import { H } from "../.vitepress/theme/hash.ts";
import {
  ASSURE, checks, climb, enough, LEAVES, marksFor, NEED, outcome, proof, ROOT, SCENES, SHARDS, STATUSES, TREE, V, type Status,
} from "../.vitepress/theme/shard-journey.ts";
import { originalShards, SIZES, valueAt } from "../.vitepress/theme/shards.ts";
import { lessonText } from "./lessons.ts";

const REPORT = lessonText("03-work-and-reports/03-a-work-report.md");
const GLOSSARY = lessonText("glossary.md");
const NODE = [...new TextEncoder().encode("node")];
const join = (a: number[], b: number[]) => H([...NODE, ...a, ...b]);

test("tiny's numbers, and full's, are the lesson's: 5 of 6 and 683 of 1,023 say yes; 3 and 342 rebuild", () => {
  assert.deepEqual([V, ASSURE, NEED], [6, 5, 3]);
  assert.deepEqual([enough(SIZES.full), originalShards(SIZES.full)], [683, 342]);
  assert.match(REPORT, /more than\s+two-thirds have \(5 of 6, 683 of 1,023\)/);
  assert.match(REPORT, /any third plus one: 3 on tiny, 342 on full/);
  // the liars' sum: a third of the validators lying still leaves enough
  assert.equal(enough(SIZES.full) - SIZES.full / 3, originalShards(SIZES.full));
  assert.equal(ASSURE - V / 3, NEED);
  assert.match(REPORT, /lied, 341,\s+then 683 − 341 = 342 really hold/);
  assert.match(REPORT, /On tiny,\s+5 − 2 = 3\./);
});

test("the shards are the curve's \"JAM\", and the erasure root is M_B of their hashes, split 3 and 3, then 2 and 1", () => {
  assert.deepEqual(SHARDS, [74, 65, 77, 110, 164, 239]);
  assert.match(REPORT, /From 110, 164 and 239 at\s+x = 3, 4 and 5/);
  const [l0, l1, l2, l3, l4, l5] = SHARDS.map((s) => H([s]));
  assert.deepEqual(LEAVES, [l0, l1, l2, l3, l4, l5]);
  assert.deepEqual(ROOT, join(join(join(l0, l1), l2), join(join(l3, l4), l5)));
  assert.ok(TREE.kind === "node" && TREE.left.kind === "node" && TREE.left.right.kind === "leaf");
});

test("every validator's shard hashes back to the root with its proof, and no other byte does", () => {
  for (let i = 0; i < V; i++) {
    assert.ok(checks(i, SHARDS[i]), `v${i}`);
    assert.deepEqual(climb(i).at(-1), ROOT);
    assert.equal(proof(i).length, i === 2 || i === 5 ? 2 : 3, "a leaf alone in its half is one step nearer the top");
    for (let b = 0; b < 256; b++) if (b !== SHARDS[i]) assert.ok(!checks(i, b), `v${i} with ${b}`);
    // the tree lights the leaf's path and, beside it, exactly the proof's halves
    const marks = marksFor(i);
    assert.equal([...marks.values()].filter((m) => m === "proof").length, proof(i).length);
  }
});

test("any mix of holders, offline validators and liars: available at 5 yeses, rebuilt from any 3 real shards", () => {
  const all = (n: number): Status[][] => (n === 0 ? [[]] : all(n - 1).flatMap((s) => STATUSES.map((x) => [...s, x])));
  for (const statuses of all(V)) {
    const o = outcome(statuses);
    const holders = statuses.filter((s) => s === "holds").length;
    const liars = statuses.filter((s) => s === "lies").length;
    assert.equal(o.said, holders + liars);
    assert.equal(o.available, o.said >= 5);
    assert.equal(o.rebuilt, holders >= 3 ? "JAM" : null);
    // the rule's promise: available, with at most a third lying, always rebuilds
    if (o.available && liars <= V / 3) assert.equal(o.rebuilt, "JAM");
  }
});

test("the scenes come out as the lesson tells it: two liars can't stop a rebuild, three can", () => {
  const out = SCENES.map((s) => outcome(s.statuses));
  assert.deepEqual(out.map((o) => [o.said, o.available, o.holders.length, o.rebuilt]), [
    [6, true, 6, "JAM"],
    [4, false, 4, "JAM"],
    [5, true, 3, "JAM"],
    [5, true, 2, null],
  ]);
  assert.deepEqual(SCENES.map((s) => s.says), ["everyone holds", "2 offline", "2 lie, 1 offline", "3 lie, 1 offline"]);
});

test("the erasure root's example is the report's own, in the lesson and the glossary", () => {
  assert.match(REPORT, /package_spec\.erasure_root\s+0x7af11fda/);
  assert.match(REPORT, /the full\s+report's is `0x7af11fda…`/);
  assert.match(GLOSSARY, /\*\*Erasure root\.\*\*[\s\S]*?`0x7af11fda…`/);
});

test("lesson 3.3 places the widget once, in the big picture, before the Gray Paper's fields", () => {
  const at = REPORT.indexOf("<ShardJourney />");
  assert.ok(at > 0 && at === REPORT.lastIndexOf("<ShardJourney />"));
  assert.ok(at > REPORT.indexOf("## The big picture") && at < REPORT.indexOf("## What the Gray Paper says"));
  assert.ok(REPORT.indexOf("<ShardJourney />") < REPORT.indexOf("<ShardRebuild />"), "the picture before the math");
});

test("Shamir's numbers: y = 49 + 7x + 3x² shares 59 to 199; any 3 give 49 back, 2 fit every secret", () => {
  const shares = [1, 2, 3, 4, 5, 6].map((x) => ({ x, y: 49 + 7 * x + 3 * x * x }));
  assert.deepEqual(shares.map((s) => s.y), [59, 75, 97, 125, 159, 199]);
  assert.match(REPORT, /the curve is y = 49 \+ 7x \+ 3x²\. The six shares are its heights at x = 1 to 6: 59, 75, 97,\s+125, 159 and 199\./);
  for (let a = 0; a < 6; a++) for (let b = a + 1; b < 6; b++) for (let c = b + 1; c < 6; c++) {
    assert.equal(valueAt([shares[a], shares[b], shares[c]], 0), 49);
  }
  // two shares: a curve through them and (0, s) for every secret s, read back at x = 0 as s
  for (let s = 0; s < 257; s++) assert.equal(valueAt([{ x: 0, y: s }, shares[0], shares[1]], 0), s);
  // erasure coding's shard 0 is the message's first letter, in plain sight
  assert.equal(SHARDS[0], "J".charCodeAt(0));
  assert.match(REPORT, /shard 0 of\s+"JAM" is 74, the "J" itself/);
});
