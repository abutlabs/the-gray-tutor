// Lesson 3.3's work-report widget (.vitepress/theme/work-report.ts): both sizes' reports,
// encoded from their values, checked against 3.3's codecs, every line of 3.3's decode
// trace, and the vectors' own bytes where vectors/ is downloaded.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spaced } from "../.vitepress/theme/codec-map.ts";
import type { Type } from "../.vitepress/theme/codec-map.ts";
import { WORK_DIGEST } from "../.vitepress/theme/work-digest.ts";
import { REFINE_CONTEXT } from "../.vitepress/theme/work-package.ts";
import {
  AVAILABILITY_SPEC, COMPARTMENTS, GOALS, PARCELS, REPORT_JSON, SEGMENT_ROOT_LOOKUP_ITEM, SIZES, WORK_REPORT,
} from "../.vitepress/theme/work-report.ts";
import { codecFields, typeFields } from "./codec-fields.ts";
import { lessonText, ROOT } from "./lessons.ts";

const LESSON = "03-work-and-reports/03-a-work-report.md";
const text = lessonText(LESSON);
const NAMES = new Map<Type, string>([
  [AVAILABILITY_SPEC, "AvailabilitySpec"], [REFINE_CONTEXT, "RefineContext"], [SEGMENT_ROOT_LOOKUP_ITEM, "SegmentRootLookupItem"], [WORK_DIGEST, "WorkDigest"],
]);
/** The client's natural32 is a compact natural too. */
const plain = (fields: string[]) => fields.map((f) => f.replace(/natural32$/, "natural"));

test("the widget's types are lesson 3.3's codecs, field for field", () => {
  assert.deepEqual(typeFields(AVAILABILITY_SPEC, NAMES), codecFields("3.3", "AvailabilitySpec"));
  assert.deepEqual(typeFields(SEGMENT_ROOT_LOOKUP_ITEM, NAMES), codecFields("3.3", "SegmentRootLookupItem"));
  assert.deepEqual(typeFields(WORK_REPORT, NAMES), plain(codecFields("3.3", "WorkReport")));
});

test("every line of 3.3's decode trace of the full report is where the widget puts it", () => {
  assert.match(text, /work_report ..\/vectors\/codec\/full\/work_report\.bin/);
  const trace = /npm run decode-work-report\n```\s*```text\n([\s\S]*?)```/.exec(text);
  assert.ok(trace, "3.3 runs decode-work-report and shows its trace");
  const lines = [...trace[1].matchAll(/^\s*(\d+)\.\.(\d+)\s+(\S+)\s+0x([0-9a-f]+)$/gm)];
  assert.equal(lines.length, 7);
  const full = PARCELS[SIZES.findIndex((s) => s.name === "full")];
  for (const [, from, to, path, hex] of lines) {
    const n = full.partAt(path);
    assert.deepEqual([n.start, n.end], [Number(from), Number(to)], path);
    assert.equal(spaced(full.bytes.slice(n.start, n.end)), hex.match(/../g)!.join(" "), `${path}: the bytes`);
  }
});

test("tiny and full differ in erasure_shards alone: 06 00 and ff 03", () => {
  const [tiny, full] = PARCELS;
  assert.equal(tiny.bytes.length, full.bytes.length);
  const differ = tiny.bytes.flatMap((b, i) => (b === full.bytes[i] ? [] : [i]));
  const shards = tiny.partAt("package_spec.erasure_shards");
  assert.deepEqual(differ, [shards.start, shards.start + 1]);
  assert.equal(spaced(tiny.bytes.slice(shards.start, shards.end)), "06 00");
  assert.equal(spaced(full.bytes.slice(shards.start, shards.end)), "ff 03");
  assert.match(text, /`erasure_shards` is `ff 03` on full and `06 00` on tiny/);
  assert.equal(tiny.saysOf(shards), "How many shards the bundle is cut into: one per validator, 6 on tiny.");
});

for (const [k, size] of SIZES.entries()) {
  const vector = join(ROOT, `vectors/codec/${size.name}/work_report`);
  test(`the ${size.name} report's bytes are the vector's, where vectors/ is downloaded`, { skip: !existsSync(`${vector}.bin`) && "no vectors/" }, () => {
    assert.deepEqual(REPORT_JSON[k], JSON.parse(readFileSync(`${vector}.json`, "utf8")));
    assert.deepEqual(PARCELS[k].bytes, [...readFileSync(`${vector}.bin`)]);
  });
}

test("the receipt holds each top-level part once, every chip says what it is, and every goal is a chip away", () => {
  const p = PARCELS[0];
  const top = p.partAt("").children.map((n) => n.path);
  assert.deepEqual(COMPARTMENTS.flatMap((c) => c.fields).sort(), [...top].sort());
  assert.deepEqual(p.wire.map((w) => w.path), top, "the strip is Appendix C's order");
  assert.equal(top.indexOf("auth_gas_used"), 4, "the authorizer's gas is fifth");
  const digests = p.partAt("results").children.map((n) => n.path);
  const selections = ["", ...digests, ...digests.map((d) => `${d}.refine_load.gas_used`)];
  const shown = new Set(COMPARTMENTS.flatMap((c) => selections.flatMap((sel) => p.chipRows(c.id, sel).flat())));
  for (const path of shown) {
    assert.ok(p.saysOf(p.partAt(path)).length > 0, `${path} says what it is`);
    assert.ok(p.labelOf(path).length > 0, `${path} has a label`);
  }
  for (const g of GOALS) assert.ok([...shown].some(g.reached), `goal ${g.id} can be reached`);
  assert.equal(p.labelOf("results[1]"), "digest 1 · service 84281096");
  assert.match(p.saysOf(p.partAt("results[1]")), /stopped with a panic/);
  assert.equal(p.saysOf(p.partAt("results[1].result")), "How refine went: the tag 2, a panic, and nothing more.");
  assert.equal(p.saysOf(p.partAt("results[0].result")), "How refine went: tag 0, success, then the output as a blob, its length first.");
  assert.equal(p.valueOf(p.partAt("core_index")), "3");
  // core_index at 273, then authorizer_hash 32, auth_gas_used 1, auth_output 1 + 5: 313
  assert.equal(p.bytesOf(p.partAt("segment_root_lookup")), "byte 313, 1 of them, the count first");
});

test("lesson 3.3 opens with the widget, before The idea", () => {
  const at = text.indexOf("<WorkReport />");
  assert.ok(at > 0 && at === text.lastIndexOf("<WorkReport />"), "placed once");
  assert.ok(at < text.indexOf("## The idea"));
});
