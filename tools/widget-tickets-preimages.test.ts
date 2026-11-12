// Lesson 4.1's bags widget (.vitepress/theme/tickets-preimages.ts): both tiny vectors,
// encoded from their values, checked against 4.1's codecs, its decode trace, and the
// vectors' own bytes where vectors/ is downloaded.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spaced } from "../.vitepress/theme/codec-map.ts";
import { PREIMAGES_JSON, TICKETS_JSON } from "../.vitepress/theme/extrinsic-vectors.ts";
import { BAGS, PREIMAGE, PREIMAGES, TICKET_ENVELOPE, TICKETS } from "../.vitepress/theme/tickets-preimages.ts";
import { codecFields, traceLines, typeFields } from "./codec-fields.ts";
import { lessonText, ROOT } from "./lessons.ts";

const text = lessonText("04-blocks/01-tickets-and-preimages.md");
const plain = (fields: string[]) => fields.map((f) => f.replace(/^signature: fixedBytes\(784\)$/, 'signature: {"bytes":784}'));

test("the widget's types are lesson 4.1's codecs, field for field", () => {
  assert.deepEqual(typeFields(TICKET_ENVELOPE, new Map()), plain(codecFields("4.1", "TicketEnvelope")));
  assert.deepEqual(typeFields(PREIMAGE, new Map()), codecFields("4.1", "Preimage"));
});

test("every line of 4.1's decode trace of the preimages is where the widget puts it", () => {
  const lines = traceLines(text, "decode-preimages", "preimages");
  assert.equal(lines.length, 2);
  for (const { from, to, path, hex } of lines) {
    const n = PREIMAGES.partAt(path);
    assert.deepEqual(path === "preimages" ? [n.start, n.start + n.prefix] : [n.start, n.end], [from, to], path);
    assert.equal(spaced(PREIMAGES.bytes.slice(from, to)), hex.match(/../g)!.join(" "), `${path}: the bytes`);
  }
});

for (const [name, parcel, json] of [["tickets_extrinsic", TICKETS, TICKETS_JSON], ["preimages_extrinsic", PREIMAGES, PREIMAGES_JSON]] as const) {
  const vector = join(ROOT, `vectors/codec/tiny/${name}`);
  test(`${name}'s bytes are the vector's, where vectors/ is downloaded`, { skip: !existsSync(`${vector}.bin`) && "no vectors/" }, () => {
    assert.deepEqual(json, JSON.parse(readFileSync(`${vector}.json`, "utf8")));
    assert.deepEqual(parcel.bytes, [...readFileSync(`${vector}.bin`)]);
  });
}

test("each bag: its strip is the count then each item, every chip says what it is, every goal is a chip away", () => {
  for (const { name, parcel } of BAGS) {
    assert.equal(parcel.wire.reduce((n, w) => n + w.bytes, 0), parcel.bytes.length, `${name}: the strip covers every byte`);
    assert.equal(parcel.wire[0].bytes, 1, `${name}: the count, one byte`);
    const items = parcel.partAt(name).children.map((n) => n.path);
    const shown = new Set(parcel.compartments.flatMap((c) => ["", ...items, ...items.map((i) => parcel.partAt(i).children[0].path)].flatMap((s) => parcel.chipRows(c.id, s).flat())));
    for (const path of shown) assert.ok(parcel.saysOf(parcel.partAt(path)).length > 0, `${path} says what it is`);
    for (const g of parcel.goals) assert.ok([...shown].some(g.reached), `${name}: goal ${g.id}`);
  }
  assert.equal(TICKETS.partAt("tickets[0].signature").end - TICKETS.partAt("tickets[0].signature").start, 784);
  assert.equal(TICKETS.labelOf("tickets[2]"), "ticket 2");
  assert.equal(PREIMAGES.bytesOf(PREIMAGES.partAt("preimages[0].blob")), "bytes 5 to 21, 17 of them, its length first");
});

test("lesson 4.1 opens with the widget, before The idea", () => {
  const at = text.indexOf("<TicketsPreimages />");
  assert.ok(at > 0 && at === text.lastIndexOf("<TicketsPreimages />") && at < text.indexOf("## The idea"));
});
