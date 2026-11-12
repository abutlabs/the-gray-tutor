// Lesson 19.2's whole-state widget (.vitepress/theme/whole-state.ts): every size, letter and
// count is the lesson's run.

import { test } from "node:test";
import assert from "node:assert/strict";
import { ACCOUNT_ENTRIES, parts, TOTAL } from "../.vitepress/theme/whole-state.ts";
import { lessonText } from "./lessons.ts";

const raw = lessonText("19-block-import/02-the-whole-state.md");

test("every component's letter and size is the run's", () => {
  const lines = [...raw.matchAll(/^C\((\d+)\) (\S): (\d+) bytes$/gm)];
  const seen = new Map(lines.map(([, i, letter, size]) => [Number(i), [letter, Number(size)]]));
  assert.equal(seen.size, 16);
  for (const p of parts) assert.deepEqual([p.letter, p.size], seen.get(p.i), `C(${p.i})`);
});

test("service 0's 154 entries, 171 in all", () => {
  assert.match(raw, /^service 0: balance 18446744073709551615, 154 entries$/m);
  assert.match(raw, /^171 entries in all, every one read$/m);
  assert.deepEqual([ACCOUNT_ENTRIES, TOTAL], [154, 171]);
});

test("lesson 19.2 places the widget once, at the top, and the five new components send the reader back to it", () => {
  const at = raw.indexOf("<WholeState />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<WholeState />"), "placed once");
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  const back = raw.indexOf("(#try-it)", raw.indexOf("the last block's accumulation outputs"));
  assert.ok(back > 0 && back < raw.indexOf("And the accounts: a service s"));
});
