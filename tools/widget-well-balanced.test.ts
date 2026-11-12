// Lesson 17.11's M_B widget (.vitepress/theme/well-balanced.ts): the halving is the lesson's
// node, and the test's three cases come out with real Keccak.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { hex, keccak, treeOf, VECTOR_ROOT, wellBalancedRoot } from "../.vitepress/theme/well-balanced.ts";
import { lessonCode, lessonText, ROOT } from "./lessons.ts";

const raw = lessonText("17-accumulation/11-what-a-service-yields.md");
const code = lessonCode("17.11");
const NODE = [...new TextEncoder().encode("node")];

test("node and the root are the lesson's: halves rounded up, \"node\" ⌢ left ⌢ right; one item hashed", () => {
  assert.match(code, /const half = Math\.ceil\(items\.length \/ 2\);\n\s+return keccak256\(concatBytes\(NODE, node\(items\.slice\(0, half\)\), node\(items\.slice\(half\)\)\)\);/);
  assert.match(code, /return items\.length === 1 \? keccak256\(items\[0\]\) : node\(items\);/);
});

test("the test: nothing is zeros, one item its hash, two items joined under \"node\"; three split two and one", () => {
  const [a, b, c] = [[1], [2], [3]];
  assert.deepEqual(wellBalancedRoot([]), Array(32).fill(0));
  assert.deepEqual(wellBalancedRoot([a]), keccak(a));
  assert.equal(hex(keccak([1])), "0x5fe7f977e71dba2ea1a68e21057beebb9be2ac30c6410aa38d4f3fbe41dcffd2", "Keccak-256, not SHA3");
  assert.deepEqual(wellBalancedRoot([a, b]), keccak([...NODE, ...a, ...b]));
  assert.deepEqual(wellBalancedRoot([a, b, c]), keccak([...NODE, ...keccak([...NODE, ...a, ...b]), ...c]));
  const t = treeOf([a, b, c]);
  assert.ok(t.kind === "node" && t.left.kind === "node" && t.right.kind === "leaf", "two and one");
});

test("the vector's root is 0x16776227…, as the run prints it", { skip: !existsSync(join(ROOT, "vectors/stf/accumulate/tiny/work_for_ejected_service-3.json")) && "no vectors/" }, () => {
  assert.equal(JSON.parse(readFileSync(join(ROOT, "vectors/stf/accumulate/tiny/work_for_ejected_service-3.json"), "utf8")).output.ok, VECTOR_ROOT);
  assert.match(raw, /root 0x16776227 \(vector: 0x16776227\)/);
});

test("lesson 17.11 places the widget once, under the figure", () => {
  const at = raw.indexOf("<WellBalanced />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<WellBalanced />"), "placed once");
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  const back = raw.indexOf("(#try-it)", raw.indexOf("(./images/11-well-balanced.svg)"));
  assert.ok(back > 0 && back < raw.indexOf("## The tests"));
});
