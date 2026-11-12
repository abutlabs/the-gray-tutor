// Lesson 19.6's out-of-gas widget (.vitepress/theme/oog-heap.ts): the two rules give the
// red's 1,545,786 and 2,000,000, and the cost and u are the lessons' growHeap and gas used.

import { test } from "node:test";
import assert from "node:assert/strict";
import { BUDGET, cost, grow, LEFT } from "../.vitepress/theme/oog-heap.ts";
import { lessonCode, lessonText } from "./lessons.ts";

const raw = lessonText("19-block-import/06-blocks-to-refuse.md");

test("the cost and the rules are the lessons'", () => {
  const code = lessonCode("19.6");
  assert.match(code, /const g = 275n \+ \(want - BigInt\(h\)\) \* 121n;/);
  assert.match(code, /if \(!charge\(m, g\)\) return "oog"; \/\/ all the gas is gone, as for any host call \(19\.6\)/);
  assert.match(lessonCode("16.6"), /const gasUsed = gas - \(machine\.gas > 0n \? machine\.gas : 0n\); \/\/ u = g − max\(ϱ′, 0\)/);
  assert.equal(cost(3), 275 + 3 * 121);
});

test("the red: 1,545,786 under the old rule, all 2,000,000 under the vectors'", () => {
  assert.match(raw, /one service used 1,545,786 gas, and the trace says 2,000,000, every drop it had/);
  const pages = 5000;
  assert.ok(cost(pages) > LEFT);
  assert.deepEqual([grow(pages, LEFT, "old").used, grow(pages, LEFT, "vectors").used], [1_545_786, BUDGET]);
  assert.equal(grow(pages, LEFT, "old").left, LEFT, "the old text took nothing");
  assert.equal(grow(10, LEFT, "old").used, grow(10, LEFT, "vectors").used, "when it fits, the rules agree");
});

test("lesson 19.6 places the widget once, at the top, and the rule sends the reader back to it", () => {
  const at = raw.indexOf("<OogHeap />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<OogHeap />"), "placed once");
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  const back = raw.indexOf("(#try-it)", raw.indexOf("`growHeap` checked first, and took nothing."));
  assert.ok(back > 0 && back < raw.indexOf("## The tests"));
});
