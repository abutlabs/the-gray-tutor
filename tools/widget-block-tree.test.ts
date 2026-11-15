// Lesson 21.1's block-tree widget (.vitepress/theme/block-tree.ts): its rules are the
// lesson's addBlock, and its blocks are the traces' own.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { add, ancestors, BLOCKS, GENESIS, rows, start, tips } from "../.vitepress/theme/block-tree.ts";
import { lessonCode, lessonText, ROOT } from "./lessons.ts";

const raw = lessonText("21-a-node/01-the-block-tree.md");
const code = lessonCode("21.1");
const run = (ids: string[]) => ids.reduce((acc, id) => { const r = add(acc.tree, id); return { tree: r.tree, replies: [...acc.replies, r.reply] }; }, { tree: start(), replies: [] as string[] });

test("the rules are the lesson's", () => {
  assert.match(code, /if \(had\) return had; \/\/ the same block twice is one block/);
  assert.match(code, /if \(!parent\) return \{ error: "unknown_parent" \}; \/\/ an orphan: no state to import it onto/);
  assert.match(code, /chain\.tips\.delete\(parent\.hash\); \/\/ the parent has a child now/);
  assert.match(code, /at = at\.parent === null \? undefined : chain\.blocks\.get\(at\.parent\);/);
});

test("a tree: a line has one tip; a fork has two; an orphan and a repeat keep nothing; ancestors follow parents", () => {
  const line = run(["b1", "b2", "b3"]);
  assert.deepEqual(tips(line.tree).map((t) => t.id), ["b3"]);
  assert.deepEqual(ancestors(line.tree, BLOCKS[3].hash).map((b) => b.id), ["b3", "b2", "b1", "g"]);
  const fork = run(["b1", "b2", "b2x", "b3x"]);
  assert.match(fork.replies[2], /a fork, block 1 has two children now$/);
  assert.deepEqual(tips(fork.tree).map((t) => t.id).sort(), ["b2", "b3x"]);
  assert.deepEqual(ancestors(fork.tree, BLOCKS[4].hash).map((b) => b.id), ["b3x", "b2x", "b1", "g"]);
  assert.deepEqual(rows(fork.tree).map((r) => [r.block.id, r.depth]), [["g", 0], ["b1", 1], ["b2", 2], ["b2x", 2], ["b3x", 3]]);
  const odd = run(["b3", "b1", "b1"]);
  assert.match(odd.replies[0], /^block 3 is an orphan/);
  assert.match(odd.replies[2], /^block 1 is already kept/);
  assert.equal(odd.tree.length, 2);
});

test("the blocks are the traces': one genesis, a shared block 1, then fallback's and storage's", { skip: !existsSync(join(ROOT, "vectors/traces/storage/genesis.json")) && "no vectors/" }, () => {
  const read = (family: string, n: number) => JSON.parse(readFileSync(join(ROOT, "vectors/traces", family, `${String(n).padStart(8, "0")}.json`), "utf8"));
  const parentOf = (family: string, n: number) => read(family, n).block.header.parent.slice(0, 18);
  assert.equal(parentOf("fallback", 1), GENESIS.hash);
  assert.equal(parentOf("storage", 1), GENESIS.hash);
  const [b1, b2, b2x, b3, b3x] = BLOCKS;
  assert.equal(parentOf("fallback", 2), b1.hash);
  assert.equal(parentOf("storage", 2), b1.hash, "the two traces share block 1");
  assert.equal(parentOf("fallback", 3), b2.hash);
  assert.equal(parentOf("storage", 3), b2x.hash);
  assert.equal(parentOf("fallback", 4), b3.hash);
  assert.equal(parentOf("storage", 4), b3x.hash);
  for (const [b, family, n] of [[b2, "fallback", 2], [b2x, "storage", 2], [b3, "fallback", 3], [b3x, "storage", 3]] as const) {
    const { header, extrinsic } = read(family, n).block;
    assert.equal(header.slot, b.slot, b.label);
    const has = [extrinsic.guarantees.length, extrinsic.assurances.length];
    const says = { empty: [0, 0], "one guarantee": [1, 0], "one guarantee, four assurances": [1, 4] }[b.carries];
    assert.deepEqual(has, says, `${b.label} carries ${b.carries}`);
  }
});

test("lesson 21.1 places the widget once, at the top, and the paper's lines send the reader back to it", () => {
  const at = raw.indexOf("<BlockTree />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<BlockTree />"));
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  const back = raw.indexOf("(#try-it)", raw.indexOf("## What the Gray Paper says"));
  assert.ok(back > 0 && back < raw.indexOf("## The tests"));
});
