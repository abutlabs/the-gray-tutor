// Lesson 15.9's cost-row widget (.vitepress/theme/cost-row.ts): registersUsed and the rows
// offered are the lesson's gas.ts, and they give its tests' answers and its run's rows.

import { test } from "node:test";
import assert from "node:assert/strict";
import { INSTRUCTIONS, registersUsed, rowOf, unitsOf } from "../.vitepress/theme/cost-row.ts";
import { lessonCode, lessonText } from "./lessons.ts";

const raw = lessonText("15-the-pvm/09-what-instructions-cost.md");
const code = lessonCode("15.9");

test("registersUsed and the rows are the lesson's, line for line", () => {
  assert.match(code, /if \(\/\^\(store\|branch\|jump_ind\)\/\.test\(name\)\) return \{ reads: r, writes: \[\] \};/);
  assert.match(code, /return \{ reads: name\.startsWith\("cmov"\) \? r : r\.slice\(0, 2\), writes: \[r\[2\]\] \}; \/\/ \[A, B, D\]/);
  assert.match(code, /const simple: Row = \(\{ p \}\) => cost\(1, p\(1, 2\), ALU\);/);
  assert.match(code, /const shift: Row = \(\{ ps \}\) => cost\(1, ps\(2, 3\), ALU\);/);
  assert.match(code, /mul_32: \(\{ p \}\) => cost\(4, p\(2, 3\), MUL\)/);
  assert.match(code, /cmov_iz: fixed\(2, 2, ALU\)/);
  assert.match(code, /move_reg: fixed\(0, 1, NONE\)/);
  assert.match(code, /ecalli: fixed\(100, 4, ALU\)/);
  assert.match(code, /return ways\.some\(\(i\) => \[0, 2\]\.includes\(opcodeAt\(i\)\)\) \? 1 : 20;/);
  assert.match(code, /add_64: simple/);
  assert.match(code, /shlo_l_64: shift/);
  assert.match(code, /div_u_64: divide/);
});

test("the tests' answers", () => {
  assert.deepEqual(registersUsed("add_64", "regRegReg", [0, 1, 2]), { reads: [0, 1], writes: [2] });
  assert.deepEqual(registersUsed("load_ind_u64", "regRegImm", [0, 1]), { reads: [1], writes: [0] });
  assert.deepEqual(registersUsed("store_ind_u64", "regRegImm", [0, 1]), { reads: [0, 1], writes: [] });
  assert.deepEqual(registersUsed("cmov_iz", "regRegReg", [0, 1, 2]), { reads: [0, 1, 2], writes: [2] });
  assert.deepEqual(rowOf("add_64", [0, 1, 2]).cost, { cycles: 1, slots: 2, units: [1, 0, 0, 0, 0] });
  assert.equal(rowOf("add_64", [0, 1, 0]).cost.slots, 1, "r0 = r0 + r1");
  assert.deepEqual(rowOf("load_ind_u64", [0, 1]).cost, { cycles: 25, slots: 1, units: [1, 1, 0, 0, 0] });
  assert.deepEqual(rowOf("store_ind_u64", [0, 1]).cost, { cycles: 25, slots: 1, units: [1, 0, 1, 0, 0] });
  assert.equal(rowOf("div_u_64", [0, 1, 2]).cost.cycles, 60);
  assert.equal(rowOf("ecalli", []).cost.cycles, 100);
  assert.equal(rowOf("branch_eq", [0, 1], "fallthrough", "fallthrough").cost.cycles, 20);
  assert.equal(rowOf("branch_eq", [0, 1], "fallthrough", "trap").cost.cycles, 1);
  assert.equal(rowOf("branch_eq", [0, 1], "unlikely", "fallthrough").cost.cycles, 1);
  assert.equal(rowOf("shlo_l_64", [2, 1, 2]).cost.slots, 2, "D is A");
  assert.equal(rowOf("shlo_l_64", [0, 1, 2]).cost.slots, 3);
});

test("the run's rows for the instructions offered", () => {
  const rows = [...raw.matchAll(/^(\w+)\s+cycles\s+(\d+)\s+slots (\d)\s+(\S+)$/gm)];
  let seen = 0;
  for (const [, name, cycles, slots, units] of rows) {
    if (!INSTRUCTIONS.some((i) => i.name === name)) continue;
    const c = rowOf(name as (typeof INSTRUCTIONS)[number]["name"], [0, 1, 2]).cost;
    assert.deepEqual([c.cycles, c.slots, unitsOf(c.units)], [Number(cycles), Number(slots), units], name);
    seen++;
  }
  assert.ok(seen >= 5, "store_ind_u64 and move_reg rows");
});

test("lesson 15.9 places the widget once, at the top, and the three functions send the reader back to it", () => {
  const at = raw.indexOf("<CostRow />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<CostRow />"));
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  const back = raw.indexOf("(#try-it)", raw.indexOf("might keep it."));
  assert.ok(back > 0 && back < raw.indexOf("## The tests"));
});
