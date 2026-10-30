// Lesson 2.6's vector map widget: the tiny work_item's bytes, encoded from its JSON in
// vector-map.ts, checked against the lesson's own hex dump, bullets, JSON and WorkItem codec
// (to be merged into tools/widgets.test.ts).

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  crossesRow, DUMP_FIELD, explain, EXTRINSIC_SPEC, flatten, fromHex, IMPORT_SPEC, isNumber, ITEM, ownerOf, pieces, rowsOf, shades, spaced, WORK_ITEM, WORK_ITEM_JSON,
} from "../.vitepress/theme/vector-map.ts";
import type { Node, Type } from "../.vitepress/theme/vector-map.ts";
import { lessonCode, lessonText } from "./lessons.ts";

const VECTORS = "02-codec/06-the-first-test-vectors.md";
const text = lessonText(VECTORS);
const nodes = new Map(flatten(ITEM.root).map((n) => [n.path, n]));
const node = (path: string): Node => nodes.get(path)!;
const bytesOf = (path: string): string => spaced(ITEM.bytes.slice(node(path).start, node(path).end));

/** The lesson's hexdump command's byte count, and the rows its output block prints. */
function lessonDump(): { count: number; rows: string[] } {
  const m = /scripts\.hexdump-work-item="node bin\/hexdump\.ts \.\.\/vectors\/codec\/tiny\/work_item\.bin (\d+)"[\s\S]*?\nnpm run hexdump-work-item\n```\s*```text\n([\s\S]*?)```/.exec(text);
  assert.ok(m, "the lesson runs hexdump on work_item.bin and shows its output");
  const rows = m[2].split("\n").filter((l) => /^[0-9a-f]{2}( [0-9a-f]{2})*$/.test(l));
  return { count: Number(m[1]), rows };
}

test("the widget's bytes begin with the lesson's hex dump, and stop where it says", () => {
  const { count, rows } = lessonDump();
  assert.ok(rows.length >= 3, "read the dump's rows");
  for (const row of rows.slice(0, -1)) assert.equal(row.split(" ").length, 16, "hexdump prints 16 to a row");
  const dumped = rows.join(" ");
  assert.equal(dumped.split(" ").length, count, `the dump shows ${count} bytes`);
  assert.equal(spaced(ITEM.bytes.slice(0, count)), dumped);
  // the widget marks where the dump stops: right after the field the lesson names
  assert.equal(node(DUMP_FIELD).end, count);
  const [, total, shown, sum] = /file is (\d+) bytes\. Show its first (\d+),\s+which is exactly its first four fields: ([\d + ]+?) bytes\./.exec(text)!;
  assert.equal(Number(shown), count);
  const widths = sum.split("+").map((s) => Number(s.trim()));
  assert.deepEqual(ITEM.root.children.slice(0, 4).map((n) => n.end - n.start), widths);
  assert.equal(ITEM.bytes.length, Number(total));
  assert.equal(ITEM.bytes.length, 236);
});

test("the fields' bytes tile all 236, with no gaps and no overlaps, and every byte has its field", () => {
  const ps = pieces(ITEM.root);
  assert.equal(ps[0].start, 0);
  for (let i = 1; i < ps.length; i++) assert.equal(ps[i].start, ps[i - 1].end, `${ps[i].path} starts where ${ps[i - 1].path} ends`);
  assert.equal(ps.at(-1)!.end, ITEM.bytes.length);
  for (const n of flatten(ITEM.root)) {
    assert.ok(n.end > n.start, `${n.path || "the item"} has bytes`);
    if (n.children.length) {
      assert.equal(n.children[0].start, n.start + n.prefix, `${n.path}: its first part comes right after its count`);
      assert.equal(n.children.at(-1)!.end, n.end, `${n.path}: its last part ends it`);
    }
  }
  for (let i = 0; i < ITEM.bytes.length; i++) {
    const owner = node(ownerOf(ITEM.root, i)!);
    assert.ok(owner.start <= i && i < owner.end, `byte ${i} is inside ${owner.path}`);
  }
  assert.equal(ownerOf(ITEM.root, 60), "import_segments", "a count byte belongs to its list");
  assert.equal(ownerOf(ITEM.root, 54), "payload", "a length byte belongs to its blob");
  assert.equal(shades(ITEM.root).length, ITEM.bytes.length);
  // lengths and counts are amber: exactly payload's 05 and the lists' 03 and 02
  const lengths = shades(ITEM.root).flatMap((s, i) => (s === "mark" ? [spaced([ITEM.bytes[i]])] : []));
  assert.deepEqual(lengths, ["05", "03", "02"]);
});

test("the lesson's read-the-bytes bullets and diagram are the widget's ranges", () => {
  // "`04 03 02 01` is `service`" and "`2a 00 00 00 00 00 00 00` is `refine_gas_limit`"
  const plain = [...text.matchAll(/^- `([0-9a-f ]+)` is `(\w+)`/gm)];
  assert.ok(plain.length >= 2, "read the bullets");
  for (const [, hex, field] of plain) assert.equal(bytesOf(field), hex, field);
  // "The next 32 bytes, `70 a5 08 29 ...`, are `code_hash`"
  const [, n, start, field] = /The next (\d+) bytes, `([0-9a-f ]+) \.\.\.`, are `(\w+)`/.exec(text)!;
  assert.equal(node(field).end - node(field).start, Number(n));
  assert.ok(bytesOf(field).startsWith(start), field);
  // "The last eight are `accumulate_gas_limit`, ...: `2a 00 00 00` at the end of the third row, and `00 00 00 00` on the fourth"
  const last = /The last eight are `(\w+)`[^`]*`([0-9a-f ]+)` at the end of\s+the third row, and `([0-9a-f ]+)` on the fourth/.exec(text)!;
  assert.ok(last, "read the last bullet");
  assert.equal(bytesOf(last[1]), `${last[2]} ${last[3]}`);
  assert.deepEqual(rowsOf(node(last[1])), [3, 4]);
  assert.ok(crossesRow(node(last[1])));
  assert.ok(!crossesRow(node("service")) && !crossesRow(node("refine_gas_limit")));
  // the diagram: "export_count 4 as 04 00 (ℰ₂)", "the payload as its length 5 then its five bytes", "first 60 bytes ... 176 more"
  const alt = /!\[The work item's first (\d+) bytes([^\]]*)\]/.exec(text)!;
  assert.equal(bytesOf("export_count"), /export_count 4 as ([0-9a-f ]+) \(ℰ₂\)/.exec(alt[2])![1]);
  assert.equal(bytesOf("payload"), "05 01 02 03 04 05");
  assert.equal(node("payload").end, Number(alt[1]));
  assert.equal(Number(alt[1]) + Number(/with (\d+) more bytes after/.exec(alt[2])![1]), ITEM.bytes.length);
});

test("the widget's values are the JSON the lesson shows", () => {
  // the lesson's work item JSON, not the scoreboard group's excerpt of another vector
  const workItem = text.replace(/::: code-group[\s\S]*?\n:::/g, "");
  const shown = [...workItem.matchAll(/^ {4}"(\w+)": (.+?),?$/gm)];
  assert.ok(shown.length >= 3, "read the JSON");
  const json = WORK_ITEM_JSON as Record<string, unknown>;
  for (const [, field, value] of shown) assert.equal(json[field], JSON.parse(value), field);
});

test("the widget's field types and order are the lesson's WorkItem codec", () => {
  const code = lessonCode("2.6");
  const records = new Map([...code.matchAll(/export const (\w+) = record\(\{([\s\S]*?)\}\);/g)].map(([, name, body]) => [
    name,
    [...body.matchAll(/^\s*(\w+): ([\w()]+),/gm)].map(([, field, codec]) => `${field}: ${codec}`),
  ]));
  const NAMES = new Map<Type, string>([[IMPORT_SPEC, "ImportSpec"], [EXTRINSIC_SPEC, "ExtrinsicSpec"]]);
  const spell = (t: Type): string => (typeof t === "string" ? t : "seq" in t ? `seq(${NAMES.get(t.seq)})` : "record");
  const record = (t: Type) => (typeof t === "object" && "record" in t ? t.record : []);
  for (const [name, t] of [["WorkItem", WORK_ITEM], ["ImportSpec", IMPORT_SPEC], ["ExtrinsicSpec", EXTRINSIC_SPEC]] as const) {
    assert.deepEqual(record(t).map(([f, ft]) => `${f}: ${spell(ft)}`), records.get(name), name);
  }
});

test("the line explains each field on its real value, with its own bytes", () => {
  const say = (path: string) => explain(node(path), ITEM.bytes);
  assert.equal(say("service"), "service = 16,909,060 = 0x01020304, a u32 (ℰ₄): 4 bytes, least significant first → 04 03 02 01");
  assert.equal(say("payload"), "payload: 5 bytes, so first its length 5 as a compact natural → 05, then the bytes as they are → 01 02 03 04 05");
  assert.match(say("import_segments"), /^import_segments: 3 of them, so first the count 3 as a compact natural → 03, then each one: its 32-byte tree_root, then its index as a u16 \(ℰ₂\)\. 1 \+ 3 × 34 = 103 bytes\.$/);
  assert.match(say("extrinsic"), /2 of them.* → 02, .*its len as a u32 \(ℰ₄\)\. 1 \+ 2 × 36 = 73 bytes/);
  assert.match(say("import_segments[2].index"), /= 2, a u16 \(ℰ₂\): 2 bytes.* → 02 00$/);
  assert.match(say("extrinsic[0].len"), /= 16 = 0x10, a u32 \(ℰ₄\).* → 10 00 00 00$/);
  assert.match(say("code_hash"), /→ 70 a5 08 29 … 9e 53 2e$/);
  for (const n of flatten(ITEM.root).filter((n) => isNumber(n.type))) {
    assert.ok(explain(n, ITEM.bytes).endsWith(bytesOf(n.path)), `${n.path}'s line ends with its bytes`);
  }
  assert.deepEqual(fromHex("0x0102ff"), [1, 2, 255]);
});

test("lesson 2.6 places the widget after the read-the-bytes bullets, before the vectors helper", () => {
  const at = text.indexOf("<VectorMap />");
  assert.ok(at > text.indexOf("The last eight are"), "after the bullets");
  assert.ok(at > text.indexOf("The `tiny` and `full` folders"), "after the tiny and full paragraph");
  assert.ok(at < text.indexOf("## A helper for vectors"), "before the helper");
  assert.equal(text.split("<VectorMap />").length, 2, "once");
});
