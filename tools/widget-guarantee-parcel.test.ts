// Lesson 4.3's guarantee widget (.vitepress/theme/guarantee-parcel.ts): the tiny vector's one
// guarantee, checked against 4.3's codecs, its decode trace, and the vector's bytes where
// vectors/ is downloaded.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spaced } from "../.vitepress/theme/codec-map.ts";
import type { Type } from "../.vitepress/theme/codec-map.ts";
import { GUARANTEE, GUARANTEE_JSON, REPORT_GUARANTEE, VALIDATOR_SIGNATURE } from "../.vitepress/theme/guarantee-parcel.ts";
import { WORK_REPORT } from "../.vitepress/theme/work-report.ts";
import { codecFields, traceLines, typeFields } from "./codec-fields.ts";
import { lessonText, ROOT } from "./lessons.ts";

const text = lessonText("04-blocks/03-guarantees.md");
const NAMES = new Map<Type, string>([[WORK_REPORT, "WorkReport"], [VALIDATOR_SIGNATURE, "ValidatorSignature"]]);
const plain = (fields: string[]) => fields.map((f) => f.replace(/fixedBytes\((\d+)\)$/, '{"bytes":$1}'));

test("the widget's types are lesson 4.3's codecs, field for field", () => {
  assert.deepEqual(typeFields(VALIDATOR_SIGNATURE, NAMES), plain(codecFields("4.3", "ValidatorSignature")));
  assert.deepEqual(typeFields(REPORT_GUARANTEE, NAMES), codecFields("4.3", "ReportGuarantee"));
});

test("every line of 4.3's decode trace is where the widget puts it, one byte on for the count", () => {
  const lines = traceLines(text, "decode-guarantees").filter((l) => l.path !== "length");
  assert.deepEqual(lines.map((l) => l.path), ["slot", "signatures[1].validator_index"]);
  for (const { from, to, path, hex } of lines) {
    const n = GUARANTEE.partAt(path);
    assert.deepEqual([n.start + 1, n.end + 1], [from, to], path);
    assert.equal(spaced(GUARANTEE.bytes.slice(n.start, n.end)), hex.match(/../g)!.join(" "));
  }
  assert.equal(GUARANTEE.partAt("slot").json, 42);
  assert.match(text, /one\s+report, signed at slot 42 by validators 3 and 4/);
});

test("the guarantee's bytes are the vector's, after its count, where vectors/ is downloaded", { skip: !existsSync(join(ROOT, "vectors/codec/tiny/guarantees_extrinsic.bin")) && "no vectors/" }, () => {
  const vector = join(ROOT, "vectors/codec/tiny/guarantees_extrinsic");
  assert.deepEqual([GUARANTEE_JSON], JSON.parse(readFileSync(`${vector}.json`, "utf8")));
  assert.deepEqual([1, ...GUARANTEE.bytes], [...readFileSync(`${vector}.bin`)]);
});

test("the report inside opens part by part, every chip says what it is, every goal is a chip away", () => {
  const deep = ["", "report", "report.package_spec", "report.context", "report.results", "report.results[1]", "report.results[1].refine_load", "signatures", "signatures[0]"];
  const shown = new Set(GUARANTEE.compartments.flatMap((c) => deep.flatMap((s) => GUARANTEE.chipRows(c.id, s).flat())));
  for (const path of shown) assert.ok(GUARANTEE.saysOf(GUARANTEE.partAt(path)).length > 0, `${path} says what it is`);
  for (const g of GUARANTEE.goals) assert.ok([...shown].some(g.reached), g.id);
  assert.ok(shown.has("report.results[1].refine_load.gas_used"), "four levels down");
  assert.equal(GUARANTEE.labelOf("signatures[1]"), "signature 1");
  assert.equal(GUARANTEE.saysOf(GUARANTEE.partAt("report.results[1].result")), "How refine went: the tag 2, a panic, and nothing more.");
});

test("lesson 4.3 opens with the widget, before The idea", () => {
  const at = text.indexOf("<GuaranteeParcel />");
  assert.ok(at > 0 && at === text.lastIndexOf("<GuaranteeParcel />") && at < text.indexOf("## The idea"));
});
