// Lesson 4.6's header map widget: the two tiny header vectors, encoded from their values in
// header-map.ts with codec-map.ts's encoder, checked against lessons 4.5 and 4.6's own codec,
// table, decode trace and byte values (to be merged into tools/widgets.test.ts).

import { test } from "node:test";
import assert from "node:assert/strict";
import { encodeMapped, flatten, ownerOf, pieces, spaced } from "../.vitepress/theme/codec-map.ts";
import type { Node, Type } from "../.vitepress/theme/codec-map.ts";
import {
  APPENDIX_C, cellsOf, chainOf, E, EPOCH_MARK, explain, goalsOf, HEADER, HEADER_0_JSON, HEADER_1_JSON, HEADERS, isMissing, nearest, nodesOf,
  orderNote, ruleOf, SECTION_5, shades, TICKET_BODY, VALIDATOR_KEYS,
} from "../.vitepress/theme/header-map.ts";
import { lessonCode, lessonText } from "./lessons.ts";

const HEADER_LESSON = "04-blocks/06-the-header.md";
const MAYBE_LESSON = "04-blocks/05-maybe-and-exactly-n.md";
const text = lessonText(HEADER_LESSON);
const maybe = lessonText(MAYBE_LESSON);
const flat = (s: string) => s.replace(/\s+/g, " ");
const [h0, h1] = HEADERS;
const nodes = HEADERS.map(nodesOf);
const node = (k: number, path: string): Node => nodes[k].get(path)!;
const bytesOf = (k: number, n: Node): string => spaced(HEADERS[k].bytes.slice(n.start, n.end));

test("the widget's E is tiny's epoch length in lesson 4.6's config, and the lessons' 12", () => {
  const tiny = /export const TINY: Config = \{[\s\S]*?epoch_length: (\d+)/.exec(lessonCode("4.6"));
  assert.ok(tiny, "read TINY's epoch_length");
  assert.equal(E, Number(tiny[1]));
  assert.equal(E, Number(/exactly (\d+) on\s+tiny/.exec(maybe)![1]), "lesson 4.5: exactly 12 on tiny");
  assert.equal(E, Number(/E of them, (\d+) on tiny/.exec(flat(text))![1]), "lesson 4.6: E of them, 12 on tiny");
});

test("the widget's types and field order are lesson 4.6's Header codec", () => {
  const code = lessonCode("4.6");
  const fieldsIn = (body: string) => [...body.matchAll(/^\s*(\w+): (.+?),(?:\s*\/\/.*)?$/gm)].map(([, f, c]) => `${f}: ${c}`);
  const records = new Map([...code.matchAll(/export const (\w+) = record\(\{([\s\S]*?)\}\);/g)].map(([, name, body]) => [name, fieldsIn(body)]));
  const header = /export function Header\(config: Config\) \{\s*return record\(\{([\s\S]*?)\}\);/.exec(code);
  assert.ok(header, "read the Header codec");
  records.set("Header", fieldsIn(header[1]));
  const NAMES = new Map<Type, string>([[VALIDATOR_KEYS, "EpochMarkValidatorKeys"], [EPOCH_MARK, "EpochMark"], [TICKET_BODY, "TicketBody"]]);
  const spell = (t: Type): string => {
    if (NAMES.has(t)) return NAMES.get(t)!;
    if (typeof t === "string") return t;
    if ("bytes" in t) return `fixedBytes(${t.bytes})`;
    if ("seq" in t) return `seq(${spell(t.seq)})`;
    if ("seqN" in t) return `seqN(${spell(t.seqN)}, ${t.n === E ? "config.epoch_length" : t.n})`;
    if ("option" in t) return `option(${spell(t.option)})`;
    return "record";
  };
  const fields = (t: Type) => (typeof t === "object" && "record" in t ? t.record : []);
  for (const [name, t] of [["Header", HEADER], ["EpochMark", EPOCH_MARK], ["EpochMarkValidatorKeys", VALIDATOR_KEYS], ["TicketBody", TICKET_BODY]] as const) {
    assert.deepEqual(fields(t).map(([f, ft]) => `${f}: ${spell(ft)}`), records.get(name), name);
  }
  assert.deepEqual(h0.root.children.map((n) => n.path), APPENDIX_C);
});

test("the lesson's field table is Appendix C's order, and §5's differs exactly where it says", () => {
  const table = [...text.matchAll(/^\| `(\w+)` \|/gm)].map(([, f]) => f);
  assert.deepEqual(table, APPENDIX_C, "the table's ten fields, in the order the bytes hold them");
  // "§5 lists the offenders mark before the author index; Appendix C writes the author index,
  //  the entropy source, *then* the offenders."
  assert.match(flat(text), /§5 lists the offenders mark before the author index; Appendix C writes the author index, the entropy source, \*then\* the offenders\./);
  assert.ok(SECTION_5.indexOf("offenders_mark") < SECTION_5.indexOf("author_index"));
  assert.deepEqual(["author_index", "entropy_source", "offenders_mark"].map((f) => APPENDIX_C.indexOf(f)), [6, 7, 8]);
  // and nothing else moves: §5 is Appendix C with the offenders mark lifted to before the author index
  const lifted = APPENDIX_C.filter((f) => f !== "offenders_mark");
  lifted.splice(lifted.indexOf("author_index"), 0, "offenders_mark");
  assert.deepEqual(SECTION_5, lifted);
  assert.match(orderNote("offenders_mark"), /§5 lists it 7th, before author_index; Appendix C writes it 9th, after entropy_source/);
  assert.equal(orderNote("slot"), "");
  // the table's rules: slot ℰ₄, author_index ℰ₂, entropy_source 96 bytes; the seal is 96 bytes, the last field
  const rules = [...text.matchAll(/^\| `(\w+)` \|.*?, (ℰ[₂₄])/gm)];
  assert.deepEqual(rules.map(([, field]) => field), ["slot", "author_index"], "read the table's rules");
  for (const [, field, rule] of rules) assert.equal(ruleOf(node(0, field)), rule, field);
  const size = (f: string) => node(0, f).end - node(0, f).start;
  assert.equal(size("entropy_source"), Number(/`entropy_source` \| a VRF signature: (\d+) bytes/.exec(text)![1]));
  assert.equal(size("seal"), Number(/The seal is (\d+) bytes, the\s+last field/.exec(text)![1]));
  assert.equal(APPENDIX_C.at(-1), "seal");
});

test("the widget's headers are the vectors the lesson describes", () => {
  // "`header_0` has an epoch mark and no tickets, `header_1` a tickets mark and no epoch mark"
  assert.match(flat(text), /`header_0` has an epoch mark and no tickets, `header_1` a tickets mark and no epoch mark/);
  assert.deepEqual(HEADERS.map((v) => v.name), ["header_0", "header_1"]);
  assert.ok(HEADER_0_JSON.epoch_mark !== null && HEADER_0_JSON.tickets_mark === null);
  assert.ok(HEADER_1_JSON.epoch_mark === null && HEADER_1_JSON.tickets_mark !== null);
  const slot = Number(/Both say slot (\d+)/.exec(text)![1]);
  assert.equal(HEADER_0_JSON.slot, slot);
  assert.equal(HEADER_1_JSON.slot, slot);
});

test("header_1's bytes are lesson 4.6's decode trace, range by range", () => {
  const trace = [...text.matchAll(/^\s+(\d+)\.\.(\d+)\s+([\w.]+)\s+0x([0-9a-f]+)$/gm)];
  assert.ok(trace.length >= 4, "read the trace");
  for (const [, from, to, path, hex] of trace) {
    // the trace names a maybe's tag `present` and a fixed list's items 0, 1, 2; the widget writes [0]
    const present = path.endsWith(".present");
    const n = node(1, path.replace(/\.present$/, "").replace(/\.(\d+)(?=\.|$)/g, "[$1]"));
    const [start, end] = present ? [n.start, n.start + n.tag] : [n.start, n.end];
    assert.deepEqual([start, end], [Number(from), Number(to)], path);
    assert.equal(spaced(h1.bytes.slice(start, end)).replace(/ /g, ""), hex, path);
  }
  // "no epoch mark (`0x00`), a tickets mark (`0x01`), and then twelve tickets, `tickets_mark.0` to `tickets_mark.11`"
  const read = /no epoch mark \(`0x(\w+)`\), a tickets mark \(`0x(\w+)`\), and then twelve tickets, `tickets_mark\.0` to `tickets_mark\.(\d+)`/.exec(flat(text))!;
  assert.equal(bytesOf(1, node(1, "epoch_mark")), read[1]);
  assert.equal(spaced([h1.bytes[node(1, "tickets_mark").start]]), read[2]);
  assert.equal(node(1, "tickets_mark").children.length, Number(read[3]) + 1);
});

test("lesson 4.5's ¿x and ⟦T⟧ₙ bytes are the widget encoder's", () => {
  const options = [...maybe.matchAll(/encode\(option\(u32\), (\w+)\)\);\s*assert\.equal\(\w+, "0x([0-9a-f]+)"\);/g)];
  assert.equal(options.length, 2, "read the option tests");
  for (const [, value, hex] of options) {
    const json = value === "null" ? null : Number(value);
    const { bytes, root } = encodeMapped({ option: "u32" }, json);
    assert.equal(spaced(bytes).replace(/ /g, ""), hex, value);
    assert.equal(root.tag, 1);
    assert.equal(bytes[0], json === null ? 0 : 1, "the tag: 0 for nothing, 1 then the value");
  }
  const fixed = /encode\(seqN\(u16, (\d+)\), \[([\d, ]+)\]\)\);\s*assert\.equal\(\w+, "0x([0-9a-f]+)"\);/.exec(maybe)!;
  const items = fixed[2].split(",").map(Number);
  const { bytes } = encodeMapped({ seqN: "u16", n: Number(fixed[1]) }, items);
  assert.equal(spaced(bytes).replace(/ /g, ""), fixed[3]);
  // the lesson's byte table, in the widget's spacing
  const table = [...maybe.matchAll(/^((?:[0-9a-f]{2} )*[0-9a-f]{2}) +(?:nothing|7:|\[1, 2, 3\])/gm)];
  assert.equal(table.length, 3, "read the byte table");
  for (const [, hex] of table) {
    assert.ok([spaced(encodeMapped({ option: "u32" }, null).bytes), spaced(encodeMapped({ option: "u32" }, 7).bytes), spaced(bytes)].includes(hex), hex);
  }
  assert.throws(() => encodeMapped({ seqN: TICKET_BODY, n: E }, HEADER_1_JSON.tickets_mark.slice(1)), /exactly 12/);
  assert.throws(() => encodeMapped({ bytes: 96 }, "0x00"), /not 96/);
});

test("every header's bytes are tiled by its fields, with every byte owned", () => {
  for (const [k, v] of HEADERS.entries()) {
    const ps = pieces(v.root);
    assert.equal(ps[0].start, 0);
    for (let i = 1; i < ps.length; i++) assert.equal(ps[i].start, ps[i - 1].end, `${v.name}: ${ps[i].path} starts where ${ps[i - 1].path} ends`);
    assert.equal(ps.at(-1)!.end, v.bytes.length);
    const fields = v.root.children;
    assert.equal(fields[0].start, 0);
    for (let i = 1; i < fields.length; i++) assert.equal(fields[i].start, fields[i - 1].end, `${fields[i].path} follows ${fields[i - 1].path}, nothing between`);
    assert.equal(fields.at(-1)!.end, v.bytes.length);
    for (const n of flatten(v.root).filter((n) => n.children.length)) {
      assert.equal(n.children[0].start, n.start + n.tag + n.prefix, `${n.path}: its first part follows its tag and count`);
      assert.equal(n.children.at(-1)!.end, n.end, `${n.path}: its last part ends it`);
    }
    for (let i = 0; i < v.bytes.length; i++) {
      const owner = node(k, ownerOf(v.root, i)!);
      assert.ok(owner.start <= i && i < owner.end, `${v.name}: byte ${i} is inside ${owner.path}`);
    }
    assert.equal(shades(v.root).length, v.bytes.length);
  }
  // sizes the lesson gives: three 32-byte hashes, slot ℰ₄, author ℰ₂, 96-byte entropy and seal;
  // a validator's two 32-byte keys; a ticket's 32-byte id and u8 attempt
  const fixed = 3 * 32 + 4 + 2 + 96 + 96;
  assert.equal(h0.bytes.length, fixed + (1 + 32 + 32 + 1 + 6 * 64) + 1 + (1 + 32));
  assert.equal(h1.bytes.length, fixed + 1 + (1 + E * 33) + 1);
});

test("a maybe is 00 when missing, and 01 then exactly its value's bytes when there", () => {
  for (const [k, v] of HEADERS.entries()) {
    // the only tag bytes in a header are its two marks', 00 or 01
    const tags = shades(v.root).flatMap((s, i) => (s === "tag" ? [i] : []));
    assert.deepEqual(tags, ["epoch_mark", "tickets_mark"].map((f) => node(k, f).start), v.name);
    for (const f of ["epoch_mark", "tickets_mark"]) {
      const n = node(k, f);
      const json = (k === 0 ? HEADER_0_JSON : HEADER_1_JSON)[f as "epoch_mark" | "tickets_mark"];
      if (json === null) {
        assert.equal(bytesOf(k, n), "00", `${v.name}.${f}: nothing is the one byte 00`);
        assert.ok(isMissing(n));
      } else {
        const type = (HEADER as { record: [string, Type][] }).record.find(([name]) => name === f)![1] as { option: Type };
        const value = encodeMapped(type.option, json).bytes;
        assert.equal(v.bytes[n.start], 1, `${v.name}.${f}: the tag 1`);
        assert.deepEqual(v.bytes.slice(n.start + 1, n.end), value, `${v.name}.${f}: then exactly the value, nothing more`);
        assert.equal(n.end - n.start, 1 + value.length);
        assert.ok(!isMissing(n));
      }
    }
  }
  // the same mark, missing and there: one byte against one byte plus the value
  const there = node(0, "epoch_mark"), missing = node(1, "epoch_mark");
  assert.equal(there.end - there.start - (missing.end - missing.start), encodeMapped(EPOCH_MARK, HEADER_0_JSON.epoch_mark).bytes.length);
  // the lead-in: "In `header_0`, it's `01` and then 449 bytes of value."
  assert.equal(there.end - there.start - 1, Number(/it's `01`\s+and then (\d+) bytes of value/.exec(text)![1]));
});

test("the tickets mark has no count in front; the epoch mark's validators and the offenders do", () => {
  const tickets = node(1, "tickets_mark");
  assert.equal(tickets.prefix, 0, "no count");
  assert.equal(tickets.children.length, E);
  assert.equal(tickets.children[0].start, tickets.start + 1, "the first ticket comes right after the tag");
  assert.equal(tickets.end - tickets.start, 1 + E * 33);
  const validators = node(0, "epoch_mark.validators");
  assert.equal(validators.prefix, 1);
  assert.equal(h0.bytes[validators.start], validators.children.length, "its count: 6 validators → 06");
  assert.equal(bytesOf(0, node(0, "offenders_mark")).slice(0, 2), "01", "one offender: the count 1");
  assert.equal(bytesOf(1, node(1, "offenders_mark")), "00", "no offenders: the count 0, a list with nothing in it");
  assert.ok(!isMissing(node(1, "offenders_mark")), "an empty list isn't a missing maybe");
});

test("folded, every byte is still shown or counted, in order", () => {
  for (const v of HEADERS) {
    for (const open of [() => false, () => true]) {
      let at = 0;
      for (const f of v.root.children) {
        for (const c of cellsOf(v.root, f, open)) {
          const start = c.kind === "byte" ? c.i : c.start;
          assert.equal(start, at, `${v.name}.${f.path}: nothing skipped`);
          at = c.kind === "byte" ? c.i + 1 : c.end;
        }
        assert.equal(at, f.end, `${v.name}.${f.path}: its strip ends where it does`);
      }
      assert.equal(at, v.bytes.length);
    }
    const all = v.root.children.flatMap((f) => cellsOf(v.root, f, () => true));
    assert.ok(all.every((c) => c.kind === "byte"), "show all: no folds");
  }
  // a 96-byte seal folds to its first 4, a fold of 89, its last 3
  const seal = cellsOf(h0.root, node(0, "seal"), () => false);
  assert.deepEqual(seal.map((c) => c.kind), ["byte", "byte", "byte", "byte", "fold", "byte", "byte", "byte"]);
  assert.equal(seal[4].kind === "fold" && seal[4].end - seal[4].start, 89);
  // a one-byte missing mark is one cell
  assert.deepEqual(cellsOf(h1.root, node(1, "epoch_mark"), () => false), [{ kind: "byte", i: 100 }]);
});

test("the line works each rule on the real value", () => {
  assert.equal(explain(node(0, "slot"), h0.bytes), "slot = 42 = 0x2a, a u32 (ℰ₄): 4 bytes, least significant first, zeros to fill → 2a 00 00 00.");
  assert.match(explain(node(0, "author_index"), h0.bytes), /^author_index = 3, a u16 \(ℰ₂\): 2 bytes.* → 03 00\. §5 lists it 8th/);
  assert.match(explain(node(1, "epoch_mark"), h1.bytes), /^epoch_mark: nothing \(null\).*the tag 0 → 00\. The whole field is one byte\.$/);
  assert.match(explain(node(0, "tickets_mark"), h0.bytes), /tag 0 → 00/);
  assert.match(explain(node(1, "tickets_mark"), h1.bytes), /tag 1 → 01, then exactly E = 12 tickets.*no count in front: both sides know E\. Each is its 32-byte id, then its attempt as a u8 \(ℰ₁\)\. 1 \+ 12 × 33 = 397 bytes\./);
  assert.match(explain(node(0, "epoch_mark"), h0.bytes), /tag 1 → 01, .*validators starts with its count → 06\. 1 \+ 32 \+ 32 \+ 385 = 450 bytes\./);
  assert.match(explain(node(0, "epoch_mark.validators"), h0.bytes), /count 6 as a compact natural → 06\. Gray Paper 0\.8\.0 lets the validator count change/);
  assert.match(explain(node(1, "offenders_mark"), h1.bytes), /empty list, so just its count 0 → 00\./);
  assert.match(explain(node(1, "tickets_mark[11].attempt"), h1.bytes), /= 3, a u8 \(ℰ₁\): 1 byte → 03\.$/);
  assert.match(explain(node(0, "seal"), h0.bytes), /96 bytes, written as they are.* → 31 dc 5b 1e … 83 f7 b0\.$/);
  assert.equal(ruleOf(node(1, "epoch_mark")), "¿x: nothing → 00");
  assert.equal(ruleOf(node(1, "tickets_mark")), "¿x: 01 + exactly 12");
  for (const [k, v] of HEADERS.entries()) for (const n of nodes[k].values()) assert.ok(explain(n, v.bytes).length > 0, n.path);
});

test("goals tick only for what they ask", () => {
  const hits = (k: number) => new Map([...nodes[k].values()].map((n) => [n.path, goalsOf(n)]).filter(([, g]) => g.length) as [string, string[]][]);
  assert.deepEqual([...hits(0)], [["tickets_mark", ["missing"]], ["author_index", ["two"]], ["offenders_mark", ["order"]], ["offenders_mark[0]", ["order"]]]);
  assert.deepEqual([...hits(1)], [["epoch_mark", ["missing"]], ["tickets_mark", ["no-length"]], ["author_index", ["two"]], ["offenders_mark", ["order"]]]);
});

test("switching headers keeps the part, or falls back to the nearest one there", () => {
  assert.equal(nearest(nodes[0], "tickets_mark[3].id").path, "tickets_mark");
  assert.equal(nearest(nodes[1], "epoch_mark.validators[2].ed25519").path, "epoch_mark");
  assert.equal(nearest(nodes[1], "offenders_mark[0]").path, "offenders_mark");
  assert.equal(nearest(nodes[0], "slot").path, "slot");
  assert.deepEqual(chainOf(h1.root, "tickets_mark[3].id").map((n) => n.path), ["tickets_mark", "tickets_mark[3]", "tickets_mark[3].id"]);
});

test("the lessons place the widget, and lesson 4.5 points to it", () => {
  const at = text.indexOf("<HeaderMap />");
  assert.ok(at > text.indexOf('<a id="try-it"></a>') && at < text.indexOf("## The idea"), "at the top, before The idea");
  const back = text.indexOf("[at the top](#try-it)");
  assert.ok(back > text.indexOf("The encoding\nwins.") && back < text.indexOf("## The size grows"), "the order paragraph sends the reader back to it");
  assert.equal(text.split("<HeaderMap />").length, 2, "once");
  const said = maybe.slice(maybe.indexOf("## What the Gray Paper says"), maybe.indexOf("## The tests"));
  assert.match(said, /widget in \[lesson 4\.6\]\(\.\/06-the-header\.md\)/);
});
