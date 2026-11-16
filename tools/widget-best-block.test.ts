// Lesson 21.2's best-block widget (.vitepress/theme/best-block.ts): its rules are the
// lesson's acceptable and bestBlock, on lesson 21.1's real tree.

import { test } from "node:test";
import assert from "node:assert/strict";
import { best, FINALS, ruledOut, TREE } from "../.vitepress/theme/best-block.ts";
import { lessonCode, lessonText } from "./lessons.ts";

const raw = lessonText("21-a-node/02-the-best-block.md");
const code = lessonCode("21.2");

test("the rules are the lesson's", () => {
  assert.match(code, /if \(!ancestors\(chain, hash\)\.some\(\(b\) => b\.hash === chain\.final\)\) return false; \/\/ \(19\.1\)/);
  assert.match(code, /const twice = \(a: Kept\) => seen\.some\(\(b\) => b\.hash !== a\.hash && b\.slot === a\.slot\);/);
  assert.match(code, /return !sinceFinal\(chain, hash\)\.some\(twice\); \/\/ \(19\.3\)/);
  assert.match(code, /if \(length !== bestLength\) better = length > bestLength; \/\/ then the most ancestors/);
  assert.match(code, /let better = b\.hash < best\.hash; \/\/ the last resort/);
});

test("the widget's verdicts are the lesson's tests: an equivocation, then finality settling it", () => {
  const out = (final: string) => TREE.filter((b) => ruledOut(final, b.id)).map((b) => b.id);
  assert.deepEqual(out("g"), ["b2", "b2x", "b3x"]); // both blocks at slot 2, and what is built on one
  assert.equal(best("g").id, "b1");
  assert.match(ruledOut("g", "b3x")!, /^\(19\.3\): block 2′ and block 2 are both at slot 2$/);
  assert.deepEqual(out("b2x"), ["g", "b1", "b2"]); // what came before it, and the other side
  assert.match(ruledOut("b2x", "b1")!, /^\(19\.1\): it comes before the final block, block 2′$/);
  assert.match(ruledOut("b2x", "b2")!, /^\(19\.1\): it doesn't follow the final block, block 2′$/);
  assert.equal(best("b2x").id, "b3x");
  assert.equal(best("b2").id, "b2");
  assert.equal(best("b1").id, "b1");
  assert.deepEqual(FINALS, ["g", "b1", "b2", "b2x"]);
});

test("lesson 21.2 places the widget once, at the top, and the paper's lines send the reader back to it", () => {
  const at = raw.indexOf("<BestBlock />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<BestBlock />"));
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  const back = raw.indexOf("(#try-it)", raw.indexOf("## What the Gray Paper says"));
  assert.ok(back > 0 && back < raw.indexOf("## The tests"));
});
