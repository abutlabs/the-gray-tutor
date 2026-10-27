// JAM beside Aztec's refine-budget widget (.vitepress/theme/refine-budget.ts): every proof's
// gas is the one the page states, and the counts the page gives come out.

import { test } from "node:test";
import assert from "node:assert/strict";
import { fits, PACKAGES, packagesFor, PROOFS } from "../.vitepress/theme/refine-budget.ts";
import { lessonText } from "./lessons.ts";

const raw = lessonText("jam-beside-aztec.md");
const gas = (id: string): number => PROOFS.find((p) => p.id === id)!.gas;
const fmt = (x: number): string => x.toLocaleString("en-US");

test("each measured proof's gas is the page's", () => {
  for (const id of ["ours", "honk", "groth16"]) assert.ok(raw.includes(fmt(gas(id))), `${fmt(gas(id))} is on the page`);
  assert.match(raw, /about 12 billion gas/);
  assert.equal(gas("chonk"), 12_000_000_000);
});

test("the page's counts: 5 of ours a tiny package, 29 a full one; Aztec's needs 2.4 full packages", () => {
  assert.equal(fits(PACKAGES.tiny, gas("ours")), 5);
  assert.equal(fits(PACKAGES.full, gas("ours")), 29);
  assert.match(raw, /5 fit a tiny package, 29 a full one/);
  assert.equal(fits(PACKAGES.full, gas("chonk")), 0);
  assert.equal(packagesFor(PACKAGES.full, gas("chonk")), 2.4);
  assert.match(raw, /2\.4 full packages/);
  assert.match(raw, /1 billion gas on tiny, 5 billion on full/);
});

test("like for like: UltraHonk built for size is about 1.2 times Groth16 built for size", () => {
  assert.equal(Math.round((gas("honk") / gas("groth16")) * 10) / 10, 1.2);
  assert.match(raw, /about 1\.2 times/);
});

test("the page places the widget once, under what it does, measured", () => {
  const at = raw.indexOf("<RefineBudget />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<RefineBudget />"));
  assert.ok(at > raw.indexOf("## What it does, measured") && at < raw.indexOf("## What the build corrected"));
});
