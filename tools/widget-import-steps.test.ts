// Lesson 19.4's import widget (.vitepress/theme/import-steps.ts): the header's four names are
// checkHeader's, in its order; the steps are importBlock's; each later refusal is a real name
// from its Part, and the guarantees' is the fuzzy trace's, with the root it keeps.

import { test } from "node:test";
import assert from "node:assert/strict";
import { HEADER_CHECKS, importWith, ROOT_BEFORE, STEPS } from "../.vitepress/theme/import-steps.ts";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { lessonCode, lessonText, ROOT } from "./lessons.ts";

const raw = lessonText("19-block-import/04-importing-a-block.md");
const code = lessonCode("19.4");

test("the header's checks are checkHeader's, in its order", () => {
  const names = [...code.matchAll(/return "(bad_[a-z_]+)";/g)].map((m) => m[1]);
  assert.deepEqual(HEADER_CHECKS.map((h) => h.error), names.slice(0, 4));
});

test("the steps are importBlock's order, and each later refusal is a name its Part's lessons use", () => {
  const order = ["checkHeader", "judgeDisputes", "runSafrole", "takeAssurances", "takeGuarantees", "accumulateBlock", "nextState"].map((f) => code.indexOf(`${f}(`));
  order.forEach((at, k) => { if (k) assert.ok(at > order[k - 1], `step ${k} after step ${k - 1}`); });
  const dirs: Record<string, string> = { "Part 10": "10-disputes", "Part 8": "08-safrole", "Part 11": "11-assurances", "Part 12": "12-guarantees" };
  for (const s of STEPS.filter((x) => x.error)) {
    const dir = join(ROOT, "lessons", dirs[s.part]);
    const text = readdirSync(dir).filter((f) => f.endsWith(".md")).map((f) => readFileSync(join(dir, f), "utf8")).join("");
    assert.ok(text.includes(`\`${s.error}\``), `${s.error} is a ${s.part} error`);
  }
  assert.match(lessonText("19-block-import/06-blocks-to-refuse.md"), /^block 37, slot 37: refused: bad_code_hash; root 0xe9a2c0ff… = the trace's$/m);
  assert.equal(ROOT_BEFORE, "0xe9a2c0ff…");
});

test("a refusal stops Υ there; nothing broken imports", () => {
  assert.deepEqual(importWith({ header: 0 }), { reached: 0, error: "bad_parent" });
  assert.deepEqual(importWith({ step: 4 }), { reached: 4, error: "bad_code_hash" });
  assert.deepEqual(importWith({}), { reached: STEPS.length, error: null });
  assert.match(raw, /If any step refuses the block, the block is refused whole, and the state stays as it was/);
});

test("lesson 19.4 places the widget once, at the top, and the refusal rule sends the reader back to it", () => {
  const at = raw.indexOf("<ImportSteps />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<ImportSteps />"), "placed once");
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  const back = raw.indexOf("(#try-it)", raw.indexOf("and your client's own otherwise."));
  assert.ok(back > 0 && back < raw.indexOf("## The tests"));
});
