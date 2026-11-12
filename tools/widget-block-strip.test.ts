// Lesson 4.7's block-strip widget (.vitepress/theme/block-strip.ts): its layouts are what
// the lessons' decoder reports for the two block vectors, as the lesson's Output and prose
// show, and, where a tangled client and the vectors are at hand, as that decoder prints.

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { FULL, LAYOUTS, partAt, share, TINY } from "../.vitepress/theme/block-strip.ts";
import { lessonText, ROOT } from "./lessons.ts";

const LESSON = "04-blocks/07-the-block.md";
const raw = lessonText(LESSON);
const text = raw.replace(/\s+/g, " ");
/** A client the lessons built, to run bin/decode.ts: the reference, or a demo. */
const CLIENT = ["reference", "demo", ".tangled"].map((d) => join(ROOT, d)).find((d) => existsSync(join(d, "bin/decode.ts")) && existsSync(join(d, "node_modules")));
const haveVectors = existsSync(join(ROOT, "vectors/codec/full/block.bin"));

test("each layout's parts are back to back from 0 to the total, in Appendix C's order", () => {
  for (const l of LAYOUTS) {
    assert.deepEqual(l.parts.map((p) => p.name), ["header", "tickets", "preimages", "guarantees", "assurances", "disputes"]);
    let at = 0;
    for (const p of l.parts) { assert.equal(p.from, at, `${l.size} ${p.name} starts where the last stopped`); at = p.to; }
    assert.equal(at, l.total);
    assert.equal(l.parts.reduce((n, p) => n + p.fields, 0), l.fields, `${l.size}: the fields add up`);
    for (const p of l.parts) assert.ok(share(p, l) > 0 && share(p, l) <= 1);
  }
  assert.equal(partAt(TINY, 5086)?.name, "disputes");
});

test("the lesson's Output lines and prose: 145 fields to byte 5,150 on tiny; 161,177 bytes on full", () => {
  assert.match(raw, /^\s+0\.\.32\s+header\.parent/m);
  assert.match(raw, /^\s+32\.\.64\s+header\.parent_state_root/m);
  assert.match(raw, /^\s+5086\.\.5150\s+extrinsic\.disputes\.faults\.0\.signature/m);
  assert.equal(TINY.parts[0].first, "header.parent");
  assert.equal(TINY.parts.at(-1)!.last, "extrinsic.disputes.faults.0.signature");
  assert.equal(TINY.parts.at(-1)!.to - 64, 5086, "the last fault's 64-byte signature ends the block");
  assert.match(text, /145 fields, from `header\.parent` at byte 0 to the last fault's signature ending at byte 5,150/);
  assert.deepEqual([TINY.fields, TINY.total], [145, 5150]);
  assert.match(text, /161,177 bytes, most of them a 1,023-validator epoch mark and two juries of 683/);
  assert.equal(FULL.total, 161177);
});

test("the layouts are what the lessons' decoder prints, where a client and the vectors are at hand", { skip: !(CLIENT && haveVectors) && "no tangled client or vectors/" }, () => {
  for (const l of LAYOUTS) {
    const out = spawnSync("node", ["bin/decode.ts", "block", `../vectors/codec/${l.size}/block.bin`], { cwd: CLIENT, encoding: "utf8", maxBuffer: 64 << 20 });
    const lines = [...out.stdout.matchAll(/^\s*(\d+)\.\.(\d+)\s+(\S+)/gm)].map(([, from, to, path]) => ({ from: Number(from), to: Number(to), path }));
    assert.equal(lines.length, l.fields, `${l.size}: fields`);
    assert.equal(lines.at(-1)!.to, l.total, `${l.size}: total`);
    for (const p of l.parts) {
      const mine = lines.filter((x) => x.path.startsWith(p.name === "header" ? "header." : `extrinsic.${p.name}.`));
      assert.deepEqual([mine[0].from, mine.at(-1)!.to, mine.length, mine[0].path, mine.at(-1)!.path], [p.from, p.to, p.fields, p.first, p.last], `${l.size} ${p.name}`);
      if (p.items !== null) assert.equal(Number(/0x([0-9a-f]+)/.exec(out.stdout.split("\n").find((s) => s.includes(` ${p.first} `))!)![1]), p.items, `${l.size} ${p.name}: items`);
    }
  }
});

test("lesson 4.7 places the widget once, at the top, and Watch a whole block sends the reader back to it", () => {
  const at = raw.indexOf("<BlockStrip />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<BlockStrip />"), "placed once");
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"), "at the top, before The idea");
  const back = raw.indexOf("[at the top](#try-it)");
  assert.ok(back > raw.indexOf("## Watch a whole block") && back < raw.indexOf("## The scoreboard"), "Watch a whole block sends the reader back to it");
});
