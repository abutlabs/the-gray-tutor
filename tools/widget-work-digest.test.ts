// Lesson 3.2's work-digest widget (.vitepress/theme/work-digest.ts): both tiny vectors,
// encoded from their values, checked against 3.2's codecs, every line of 3.2's decode
// trace, and the vectors' own bytes where vectors/ is downloaded.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spaced } from "../.vitepress/theme/codec-map.ts";
import type { Type } from "../.vitepress/theme/codec-map.ts";
import { COMPARTMENTS, DIGEST_JSON, DIGEST_NAMES, GOALS, PARCELS, REFINE_LOAD, WORK_DIGEST } from "../.vitepress/theme/work-digest.ts";
import { codecFields, typeFields } from "./codec-fields.ts";
import { lessonText, ROOT } from "./lessons.ts";

const LESSON = "03-work-and-reports/02-work-digests.md";
const text = lessonText(LESSON);
const NAMES = new Map<Type, string>([[REFINE_LOAD, "RefineLoad"], ["result", "WorkResult"]]);
/** The client's natural32 is a compact natural too. */
const plain = (fields: string[]) => fields.map((f) => f.replace(/natural32$/, "natural"));

test("the widget's types are lesson 3.2's codecs, field for field", () => {
  assert.deepEqual(typeFields(WORK_DIGEST, NAMES), codecFields("3.2", "WorkDigest"));
  assert.deepEqual(typeFields(REFINE_LOAD, NAMES), plain(codecFields("3.2", "RefineLoad")));
});

test("every line of 3.2's decode trace of work_result_1 is where the widget puts it", () => {
  const trace = /npm run decode-work-result\n```\s*```text\n([\s\S]*?)```/.exec(text);
  assert.ok(trace, "3.2 runs decode-work-result and shows its trace");
  assert.match(text, /work_result ..\/vectors\/codec\/tiny\/work_result_1\.bin/);
  const lines = [...trace[1].matchAll(/^\s*(\d+)\.\.(\d+)\s+(\S+)\s+0x([0-9a-f]+)$/gm)];
  assert.equal(lines.length, 10);
  const { bytes, partAt } = PARCELS[1];
  for (const [, from, to, path, hex] of lines) {
    const n = partAt(path);
    assert.deepEqual([n.start, n.end], [Number(from), Number(to)], path);
    assert.equal(spaced(bytes.slice(n.start, n.end)), hex.match(/../g)!.join(" "), `${path}: the bytes`);
  }
  assert.equal(bytes.length, 82);
});

test("a success is tag 0, the length and the output; a panic is the one byte 02", () => {
  const ok = PARCELS[0].partAt("result");
  assert.deepEqual([ok.tag, ok.prefix, spaced(PARCELS[0].bytes.slice(ok.start, ok.end))], [1, 1, "00 03 aa bb cc"]);
  assert.match(text, /okHex, "0x0003aabbcc"/);
  const panic = PARCELS[1].partAt("result");
  assert.deepEqual([panic.tag, panic.prefix, spaced(PARCELS[1].bytes.slice(panic.start, panic.end))], [1, 0, "02"]);
  assert.equal(PARCELS[0].valueOf(ok), "ok: 3 bytes of output, aa bb cc");
  assert.equal(PARCELS[1].valueOf(panic), "panic: error 2, no output");
  assert.equal(PARCELS[1].bytesOf(panic), "byte 76, 1 of them, its tag first");
  assert.equal(PARCELS[0].bytesOf(ok), "bytes 76 to 80, 5 of them, its tag then its length first");
});

for (const [k, name] of DIGEST_NAMES.entries()) {
  const vector = join(ROOT, `vectors/codec/tiny/${name}`);
  test(`${name}'s bytes are the vector's, where vectors/ is downloaded`, { skip: !existsSync(`${vector}.bin`) && "no vectors/" }, () => {
    assert.deepEqual(DIGEST_JSON[k], JSON.parse(readFileSync(`${vector}.json`, "utf8")));
    assert.deepEqual(PARCELS[k].bytes, [...readFileSync(`${vector}.bin`)]);
  });
}

test("the card holds each top-level part once, every chip says what it is, and every goal is a chip away", () => {
  for (const p of PARCELS) {
    const top = p.partAt("").children.map((n) => n.path);
    assert.deepEqual(COMPARTMENTS.flatMap((c) => c.fields).sort(), [...top].sort());
    assert.deepEqual(p.wire.map((w) => w.path), top, "the strip is Appendix C's order");
    const shown = new Set(COMPARTMENTS.flatMap((c) => p.chipRows(c.id, "").flat()));
    for (const path of shown) assert.ok(p.saysOf(p.partAt(path)).length > 0, `${path} says what it is`);
    for (const g of GOALS) assert.ok([...shown].some(g.reached), `goal ${g.id} can be reached`);
  }
});

test("lesson 3.2 opens with the widget, before The idea", () => {
  const at = text.indexOf("<WorkDigest />");
  assert.ok(at > 0 && at === text.lastIndexOf("<WorkDigest />"), "placed once");
  assert.ok(at < text.indexOf("## The idea"));
});
