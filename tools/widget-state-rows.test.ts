// Lesson 6.3's opening widget (.vitepress/theme/state-rows.ts): the Gray Paper's (D.2) as a
// table to open, on the state before block 12 of the tiny safrole trace. Its names are
// lesson 6.2's, its values the ones lesson 6.3's run prints, and every size and byte is the
// trace's, where vectors/ is downloaded.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { componentKeyHex } from "../.vitepress/theme/part-flow.ts";
import { COMPONENTS } from "../.vitepress/theme/state-keys.ts";
import { KAPPA_BYTES, KEYS } from "../.vitepress/theme/validator-key.ts";
import { allZero, ENTRIES, ETA, READ_HERE, rowOf, ROWS, SAME_BYTES, TAU, TRACE } from "../.vitepress/theme/state-rows.ts";
import { LESSONS, lessonText, readParts, ROOT } from "./lessons.ts";

const LESSON = "06-state-and-merklization/03-reading-the-state.md";
const raw = lessonText(LESSON);
const text = raw.replace(/\s+/g, " ");
const FILE = join(ROOT, "vectors", TRACE);

test("the rows are (D.2)'s: C(1) to C(16) named as lesson 6.2 names them, then service 0's account", () => {
  assert.deepEqual(ROWS.map((r) => r.i), [...Array.from({ length: 16 }, (_, k) => k + 1), 255]);
  for (const r of ROWS.slice(0, 16)) {
    assert.equal(`${r.letter}, ${r.name}`, COMPONENTS[r.i], r.key);
    assert.equal(r.key, `C(${r.i})`);
    assert.equal(r.keyBytes.slice(0, 2), componentKeyHex(r.i).slice(2, 4), `${r.key}'s first byte`);
  }
  assert.equal(rowOf(255).key, "C(255, 0)");
  assert.equal(rowOf(255).keyBytes.slice(0, 2), "ff");
  // the Gray Paper's (D.2), quoted in the lesson, has a row for each
  for (const r of ROWS.slice(0, 16)) assert.ok(raw.includes(`&&C(${r.i}) &\\mapsto`), `(D.2) has ${r.key}`);
  assert.ok(raw.includes("&&C(255, s) &\\mapsto"));
  assert.throws(() => rowOf(17));
});

test("the three rows opened part by part are the three the lesson reads, with the lesson's own values", () => {
  assert.deepEqual(READ_HERE, [11, 6, 8]);
  assert.deepEqual(ROWS.filter((r) => r.pieces).map((r) => r.i).sort((a, b) => a - b), [6, 8, 11]);
  assert.deepEqual(ROWS.filter((r) => r.built === "here").map((r) => r.i).sort((a, b) => a - b), [6, 8, 11]);
  for (const key of ["| C(11) | τ, the time", "| C(6) | η, entropy", "| C(8) | κ, this epoch's validators"]) assert.ok(raw.includes(key), key);
  // τ: the run's "τ, the time: slot 11", and its tab's 0x0b000000
  assert.equal(TAU, 11);
  assert.match(raw, /^τ, the time: slot 11$/m);
  assert.ok(raw.includes('"value": "0x0b000000"'));
  assert.equal(rowOf(11).starts, "0b 00 00 00");
  assert.equal(rowOf(11).pieces![0].what, "slot 11 as a u32, lowest byte first: 4 bytes");
  // η: four hashes, the first the run's η0
  assert.equal(ETA.length, 4);
  assert.ok(raw.includes(`η0: ${ETA[0]}`));
  assert.equal(rowOf(6).size, 4 * 32);
  assert.deepEqual(rowOf(6).pieces!.map((p) => p.bytes), ETA.map((h) => `${h.slice(2, 10)}…${h.slice(-4)}`));
  // κ: the count byte and the six keys of the validator-key widget, 2,017 bytes
  assert.equal(rowOf(8).size, KAPPA_BYTES);
  assert.match(text, /1 \+ 6 × 336 = 2,017/);
  assert.equal(rowOf(8).pieces!.length, 1 + KEYS.length);
  assert.equal(rowOf(8).pieces![0].bytes, "06");
  assert.ok(rowOf(8).pieces![1].bytes.includes("4418fb8c"), "κ0's Ed25519 key, the lesson's old friend");
});

test("what each row adds up to is its size, where the sum is written out", () => {
  const sums: Record<number, number> = {
    1: 2 * (1 + 8 * 32), 2: 2 * 80 * 32, 6: 4 * 32, 7: 1 + 6 * 336, 8: 1 + 6 * 336, 9: 1 + 6 * 336,
    12: 4 + 2 * 4 + 4 + 4 + 1, 255: 1 + 32 + 5 * 8 + 4 * 4,
  };
  for (const [i, sum] of Object.entries(sums)) {
    const row = rowOf(Number(i));
    assert.equal(row.size, sum, row.key);
    assert.ok(row.adds.replaceAll(",", "").includes(String(sum)), `${row.key}: "${row.adds}" says ${sum}`);
  }
  assert.deepEqual(SAME_BYTES.map((i) => rowOf(i).size), [2017, 2017, 2017]);
  assert.ok(ROWS.filter(allZero).length > 0 && ROWS.filter(allZero).every((r) => /^(00 ?)+$/.test(r.starts)));
});

test("a row built elsewhere links a Part that exists", () => {
  const dirs = new Map(readParts().map((p) => [p.number, p.dir]));
  for (const r of ROWS) {
    if (r.built === "here") continue;
    assert.equal(dirs.get(r.built.part), r.built.dir, r.key);
    assert.ok(existsSync(join(LESSONS, r.built.dir, "index.md")), r.built.dir);
  }
});

test("lesson 6.3 opens with the widget, before The idea, and says so where it explains (D.2)", () => {
  const at = raw.indexOf("<StateRows />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<StateRows />") && at < raw.indexOf("## The idea"));
  assert.match(text, /\(D\.2\) is a table, the one you opened \[at the top\]\(#try-it\), row for row/);
  const widget = readFileSync(join(ROOT, ".vitepress/theme/StateRows.vue"), "utf8");
  assert.ok(widget.includes("before block 12 of the tiny <code>safrole</code> trace"));
  assert.equal(TRACE, "traces/safrole/00000012.json");
  assert.match(raw, /scripts\.read-state-safrole="node bin\/read-state\.ts \.\.\/vectors\/traces\/safrole\/00000012\.json"/);
});

test("every size and byte is the trace's, where vectors/ is downloaded", { skip: !existsSync(FILE) && "no vectors/" }, () => {
  const kv = JSON.parse(readFileSync(FILE, "utf8")).pre_state.keyvals as { key: string; value: string }[];
  assert.equal(kv.length, ENTRIES);
  const spaced = (hex: string) => (hex.match(/../g) ?? []).join(" ");
  for (const r of ROWS) {
    const key = r.i === 255 ? `0xff${"00".repeat(30)}` : componentKeyHex(r.i);
    const value = kv.find((e) => e.key === key)!.value.slice(2);
    assert.equal(value.length / 2, r.size, `${r.key}'s size`);
    assert.equal(spaced(value.slice(0, 8)), r.starts, `${r.key}'s first bytes`);
    assert.equal(/^(00)+$/.test(value), allZero(r), `${r.key}: all zero or not`);
  }
  const of = (i: number) => kv.find((e) => e.key === componentKeyHex(i))!.value.slice(2);
  assert.deepEqual(ETA, [0, 1, 2, 3].map((n) => `0x${of(6).slice(n * 64, (n + 1) * 64)}`));
  assert.equal(new Set(SAME_BYTES.map(of)).size, 1, "ι, κ and λ hold the same bytes");
  assert.equal(of(8).slice(2 + 64, 2 + 128), KEYS[0].ed25519.slice(2));
});
