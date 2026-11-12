// Lesson 3.1's work-package widget (.vitepress/theme/work-package.ts): the tiny vector,
// encoded from its values, checked against lessons 2.6 and 3.1's codecs, every line of
// 3.1's decode trace, and the vector's own bytes where vectors/ is downloaded.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { flatten, spaced } from "../.vitepress/theme/codec-map.ts";
import type { Type } from "../.vitepress/theme/codec-map.ts";
import { WORK_ITEM } from "../.vitepress/theme/vector-map.ts";
import {
  bytesOf, chipRows, COMPARTMENTS, GOALS, labelOf, PACKAGE, PACKAGE_JSON, partAt, REFINE_CONTEXT, saysOf, WIRE, WORK_PACKAGE,
} from "../.vitepress/theme/work-package.ts";
import { codecFields, typeFields } from "./codec-fields.ts";
import { lessonText, ROOT } from "./lessons.ts";

const LESSON = "03-work-and-reports/01-a-work-package.md";
const text = lessonText(LESSON);
const VECTOR = join(ROOT, "vectors/codec/tiny/work_package");

const NAMES = new Map<Type, string>([[REFINE_CONTEXT, "RefineContext"], [WORK_ITEM, "WorkItem"]]);
const fieldsOf = (t: Type) => typeFields(t, NAMES);

test("the widget's types are lessons 2.6 and 3.1's codecs, field for field", () => {
  assert.deepEqual(fieldsOf(REFINE_CONTEXT), codecFields("2.6", "RefineContext"));
  assert.deepEqual(fieldsOf(WORK_PACKAGE), codecFields("3.1", "WorkPackage"));
});

test("every line of 3.1's decode trace is where the widget puts it", () => {
  const trace = /npm run decode-work-package\n```\s*```text\n([\s\S]*?)```/.exec(text);
  assert.ok(trace, "3.1 runs decode-work-package and shows its trace");
  const lines = [...trace[1].matchAll(/^\s*(\d+)\.\.(\d+)\s+(\S+)\s+0x([0-9a-f]+)$/gm)];
  assert.ok(lines.length >= 14, `${lines.length} lines read`);
  for (const [, from, to, path, hex] of lines) {
    const [start, end] = [Number(from), Number(to)];
    const bytes = spaced(PACKAGE.bytes.slice(start, end));
    assert.equal(bytes, hex.match(/../g)!.join(" "), `${path}: the bytes`);
    const length = /^(.*)\.length$/.exec(path);
    const n = partAt((length ? length[1] : path).replace(/\.(\d+)(?=\.|$)/g, "[$1]"));
    if (length) assert.deepEqual([n.start, n.start + n.prefix], [start, end], `${path}: the count in front`);
    else assert.deepEqual([n.start, n.end], [start, end], path);
  }
});

test("the widget's bytes are the vector's, where vectors/ is downloaded", { skip: !existsSync(`${VECTOR}.bin`) && "no vectors/" }, () => {
  assert.deepEqual(PACKAGE_JSON, JSON.parse(readFileSync(`${VECTOR}.json`, "utf8")));
  assert.deepEqual(PACKAGE.bytes, [...readFileSync(`${VECTOR}.bin`)]);
});

test("the parcel holds each top-level part once, and the bytes split the slip around the postmark", () => {
  const top = PACKAGE.root.children.map((n) => n.path);
  assert.deepEqual(COMPARTMENTS.flatMap((c) => c.fields).sort(), [...top].sort());
  assert.deepEqual(WIRE.map((w) => w.path), top, "the strip is Appendix C's order");
  assert.equal(WIRE.reduce((n, w) => n + w.bytes, 0), PACKAGE.bytes.length);
  const slip = WIRE.flatMap((w, k) => (w.tone === "green" ? [k] : []));
  assert.ok(slip.at(-1)! - slip[0] + 1 > slip.length, "the slip's parts aren't side by side in the bytes");
});

test("every chip says what it is, and every goal is a chip away", () => {
  const items = partAt("items").children.map((n) => n.path);
  const shown = new Set(COMPARTMENTS.flatMap((c) => ["", ...items].flatMap((sel) => chipRows(c.id, sel).flat())));
  for (const p of shown) {
    assert.ok(saysOf(partAt(p)).length > 0, `${p} says what it is`);
    assert.ok(labelOf(p).length > 0, `${p} has a label`);
  }
  for (const g of GOALS) assert.ok([...shown].some(g.reached), `goal ${g.id} can be reached`);
  assert.ok(flatten(PACKAGE.root).length > shown.size, "deeper parts stay in the bytes, not the chips");
});

test("a part with a length or count in front says so", () => {
  assert.equal(bytesOf(partAt("items[1].payload")), "bytes 513 to 516, 4 of them, its length first");
  assert.equal(bytesOf(partAt("items")), "bytes 222 to 694, 473 of them, the count first");
  assert.equal(bytesOf(partAt("auth_code_host")), "bytes 0 to 3, 4 of them");
});

test("lesson 3.1 opens with the widget, and its words match the vector", () => {
  const at = text.indexOf("<WorkPackage />");
  assert.ok(at > 0 && at === text.lastIndexOf("<WorkPackage />"), "placed once");
  assert.ok(at < text.indexOf("## The idea"), "at the top, before The idea");
  assert.equal(partAt("items").children.length, 2);
  assert.match(text.replace(/\s+/g, " "), /two jobs inside/);
});
