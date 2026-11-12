// A formula wider than its column is drawn smaller to fit (.vitepress/theme/fit.ts has the
// rule, fit-formulas.ts applies it in the browser): the Gray Paper's (D.2) is 1,211 px wide
// in an 876 px box, and ran over the page's outline.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fitScale } from "../.vitepress/theme/fit.ts";
import { ROOT } from "./lessons.ts";

test("a formula that fits is left at full size, a pixel of rounding included", () => {
  assert.equal(fitScale(600, 876), 1);
  assert.equal(fitScale(876, 876), 1);
  assert.equal(fitScale(876.8, 876), 1);
});

test("a wider one shrinks to its column, and never past it", () => {
  const scale: number = fitScale(1211, 876);
  assert.equal(scale, 0.723);
  assert.ok(1211 * scale <= 876);
  // on a phone, 343 px of column
  assert.ok(1211 * fitScale(1211, 343) <= 343);
});

test("nothing to measure yet (a formula in a closed fold) changes nothing", () => {
  assert.equal(fitScale(0, 876), 1);
  assert.equal(fitScale(1211, 0), 1);
  assert.equal(fitScale(Number.NaN, 876), 1);
});

test("the theme fits the formulas when a page arrives, and listens for clicks on them", () => {
  const theme = readFileSync(join(ROOT, ".vitepress/theme/index.ts"), "utf8");
  assert.match(theme, /listenForFormulas\(\);/);
  assert.equal(theme.match(/fitFormulas\(\);/g)?.length, 2, "on the first page, and after each new one");
});
