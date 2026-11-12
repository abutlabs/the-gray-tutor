// Lesson 17.9's budget widget (.vitepress/theme/budget-rounds.ts): the budget and the fit loop
// are the lesson's, and the check questions and the vector's two rounds come out.

import { test } from "node:test";
import assert from "node:assert/strict";
import { budgetOf, G_A, G_T, rounds } from "../.vitepress/theme/budget-rounds.ts";
import { lessonCode, lessonText } from "./lessons.ts";

const raw = lessonText("17-accumulation/09-the-blocks-gas-budget.md");
const code = lessonCode("17.9");

test("the budget and the fit are the lesson's", () => {
  assert.match(code, /export const REPORT_GAS = 10_000_000n;/);
  assert.match(code, /const floor = REPORT_GAS \* BigInt\(config\.core_count\) \+ freeGas;/);
  assert.match(code, /while \(fit < todo\.length && spent \+ gasOf\(todo\[fit\]\) <= budget\) \{/);
  assert.match(code, /budget \+= sum\(round\.transfers\.map\(\(t\) => t\.gas\)\) - sum\(\[\.\.\.round\.used\.values\(\)\]\); \/\/ g\*/);
  assert.deepEqual([G_T, G_A], [20_000_000, 10_000_000]);
});

test("the checks: 25M with 5M free; 6M + 9M fit and 7M, 2M wait; g* = 19,650,000", () => {
  assert.equal(budgetOf(5_000_000), 25_000_000);
  const [first, second] = rounds([6e6, 9e6, 7e6, 2e6], 0, 350_000);
  assert.deepEqual([first.took, first.waiting], [[6e6, 9e6], [7e6, 2e6]]);
  assert.equal(second.budget, 19_650_000);
  assert.match(raw, /Yes: g\\\* = 20M \+ 0 \(the new transfers' gas\) − 0\.35M \(what round 1 used\)\./);
});

test("the vector: 20,000,000 then 2,000,000, one report each round", () => {
  assert.match(raw, /19,800,000 \+ 200,000 and 2,000,000/);
  assert.deepEqual(rounds([20_000_000, 2_000_000], 0, 350_000).map((r) => r.took.length), [1, 1]);
  assert.match(raw, /^rounds: 2, taking 1, then 1 report\(s\)$/m);
  assert.match(code, /assert\.deepEqual\(rounds, \[1, 1\]\);/);
});

test("lesson 17.9 places the widget once, before the vector that needs it", () => {
  const at = raw.indexOf("<BudgetRounds />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<BudgetRounds />"), "placed once");
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  const back = raw.indexOf("(#try-it)", raw.indexOf("the rounds share the work out."));
  assert.ok(back > 0 && back < raw.indexOf("Here's the vector that needs it."));
});
