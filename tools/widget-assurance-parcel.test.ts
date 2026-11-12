// Lesson 4.2's assurance widget (.vitepress/theme/assurance-parcel.ts): the vectors' first
// assurance, tiny and full, checked against 4.2's codec, both decode traces, and the
// vectors' bytes where vectors/ is downloaded.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spaced } from "../.vitepress/theme/codec-map.ts";
import { assurance, PARCELS, SIZES } from "../.vitepress/theme/assurance-parcel.ts";
import { traceLines, typeFields } from "./codec-fields.ts";
import { lessonCode, lessonText, ROOT } from "./lessons.ts";

const text = lessonText("04-blocks/02-tiny-and-full.md");

test("the widget's type is lesson 4.2's Assurance(config), and its sizes the lesson's configs", () => {
  const body = /export function Assurance\(config: Config\) \{\n\s+return record\(\{([\s\S]*?)\n\s+\}\);/.exec(lessonCode("4.2"));
  assert.ok(body, "4.2 defines Assurance(config)");
  const fields = [...body[1].matchAll(/^\s+(\w+): (.+?),(?:\s*\/\/.*)?$/gm)].map(([, f, c]) => `${f}: ${c}`);
  assert.deepEqual(fields, ["anchor: hash", "bitfield: fixedBytes(Math.ceil(config.core_count / 8))", "validator_index: u16", "signature: fixedBytes(64)"]);
  assert.deepEqual(typeFields(assurance(341), new Map()), ["anchor: hash", 'bitfield: {"bytes":43}', "validator_index: u16", 'signature: {"bytes":64}']);
  assert.match(lessonCode("4.2"), /export const TINY: Config = \{ name: "tiny", validators_count: 6, core_count: 2 \};/);
  assert.match(lessonCode("4.2"), /export const FULL: Config = \{ name: "full", validators_count: 1023, core_count: 341 \};/);
  assert.deepEqual(SIZES.map((s) => [s.name, s.cores]), [["tiny", 2], ["full", 341]]);
});

test("both decode traces: the bitfield is byte 33 on tiny, bytes 33 to 75 on full", () => {
  // the two runs share one Output: tiny's trace, then full's, each starting at its count
  const all = traceLines(text, "decode-assurances");
  const starts = all.flatMap((l, i) => (l.path === "length" ? [i] : []));
  assert.equal(starts.length, 2, "two traces");
  for (const k of [0, 1]) {
    const lines = all.slice(starts[k] + 1, starts[k + 1]);
    assert.ok(lines.length >= 1);
    for (const { from, to, path, hex } of lines) {
      const n = PARCELS[k].partAt(path);
      assert.deepEqual([n.start + 1, n.end + 1], [from, to], `${SIZES[k].name} ${path}: one byte on, after the count`);
      assert.equal(spaced(PARCELS[k].bytes.slice(n.start, n.end)), hex.match(/../g)!.join(" "));
    }
  }
  const [tiny, full] = PARCELS.map((p) => p.partAt("bitfield"));
  assert.deepEqual([tiny.end - tiny.start, full.end - full.start], [1, 43]);
  assert.equal(PARCELS[1].bytes.length - PARCELS[0].bytes.length, 42, "only the bitfield grows");
});

for (const [k, s] of SIZES.entries()) {
  const vector = join(ROOT, `vectors/codec/${s.name}/assurances_extrinsic`);
  test(`the ${s.name} assurance's bytes are the vector's first, where vectors/ is downloaded`, { skip: !existsSync(`${vector}.bin`) && "no vectors/" }, () => {
    assert.deepEqual(s.json, JSON.parse(readFileSync(`${vector}.json`, "utf8")));
    const bin = [...readFileSync(`${vector}.bin`)];
    assert.equal(bin[0], 2, "two assurances");
    assert.deepEqual(PARCELS[k].bytes, bin.slice(1, 1 + PARCELS[k].bytes.length));
  });
}

test("lesson 4.2 opens with the widget, before The idea", () => {
  const at = text.indexOf("<AssuranceParcel />");
  assert.ok(at > 0 && at === text.lastIndexOf("<AssuranceParcel />") && at < text.indexOf("## The idea"));
  for (const p of PARCELS) for (const g of p.goals) assert.ok(p.compartments.some((c) => p.chipRows(c.id, "").flat().some(g.reached)), g.id);
});
