// Lessons 6.1 and 6.2's widgets, checked against the keys, depths and layouts the lessons
// print, so the trie and the state keys a reader pokes at are the lessons' own.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { bitsOf, toHex } from "../.vitepress/theme/bytes.ts";
import { accountKey, bytesOf, COMPONENTS, componentKey, HASH_BYTES_USED, LESSON_HASH, padHash, parseHashBytes, parseNumber, wovenKey } from "../.vitepress/theme/state-keys.ts";
import { build, fitsInLeaf, hashesOf, hashesRedone, hashesTaken, keyOf, leafNode, rootOf, valueBytes, layout, leafFirstByte, leavesOf, nodesOf, rootIs } from "../.vitepress/theme/trie.ts";
import type { Entry } from "../.vitepress/theme/trie.ts";
import { lessonCode, lessonText, ROOT } from "./lessons.ts";

const TRIE = "06-state-and-merklization/01-the-state-trie.md";
const KEYS = "06-state-and-merklization/02-state-keys.md";
const fromHex = (hex: string) => [...hex.replace(/^0x/, "").matchAll(/../g)].map(([b]) => parseInt(b, 16));

/** 6.1's Watch it listing: each leaf's depth, key and value size, in the order it printed them. */
function listing() {
  const rows = [...lessonText(TRIE).matchAll(/^depth +(\d+) {2}(0x[0-9a-f]{62}) {2}(\d+)-byte value, (in the leaf|hashed)$/gm)];
  return rows.map(([, depth, key, size, where]) => ({ depth: Number(depth), key, size: Number(size), inLeaf: where === "in the leaf" }));
}

test("the trie widget puts each of 6.1's 21 real entries at the depth the lesson's client printed", () => {
  const rows = listing();
  assert.equal(rows.length, Number(/^(\d+) entries, state root/m.exec(lessonText(TRIE))![1]), "read every leaf");
  // the state in another order: the trie sorts it, whatever order it came in
  const entries: Entry[] = rows.map((r) => ({ key: fromHex(r.key), size: r.size })).reverse();
  const leaves = leavesOf(build(entries));
  assert.deepEqual(leaves.map((l) => toHex(l.entry.key)), rows.map((r) => r.key), "the leaves, left to right, in the listing's order");
  assert.deepEqual(leaves.map((l) => l.path.length), rows.map((r) => r.depth), "each leaf's depth");
  for (const l of leaves) assert.equal(l.path, [...Array(l.path.length).keys()].map((i) => (l.entry.key[i >> 3] >> (7 - (i & 7))) & 1).join(""), "a leaf's path is its key's first bits");
  for (const r of rows) assert.equal(fitsInLeaf(r.size), r.inLeaf, `${r.size} bytes: ${r.inLeaf ? "in the leaf" : "hashed"}`);
});

test("the trie widget draws the lesson's three keys as its picture: 0xff alone on the 1 side", () => {
  const [, a, aBits, b, bBits, c, cBits] = /Three keys starting `(0x[0-9a-f]{2})` \(`0b([01_]+)`\), `(0x[0-9a-f]{2})` \(`0b([01_]+)`\) and `(0x[0-9a-f]{2})`\s+\(`0b([01_]+)`\)/.exec(lessonText(TRIE))!;
  for (const [hex, bits] of [[a, aBits], [b, bBits], [c, cBits]]) assert.equal(bits.replaceAll("_", ""), bitsOf(parseInt(hex, 16), 8), `${hex}'s bits`);
  const root = build([a, b, c].map((h) => ({ key: keyOf(parseInt(h, 16)), size: 4 })));
  const where = Object.fromEntries(leavesOf(root).map((l) => [toHex([l.entry.key[0]]), l.path]));
  assert.deepEqual(where, { "0x01": "00", "0x40": "01", "0xff": "1" });
  assert.deepEqual(nodesOf(root).filter((n) => n.kind === "branch").map((n) => n.path), ["", "0"], "two branches: the root, and its 0 side");
  assert.equal(rootIs(root), "H(branch)");
  // New words: "keys starting 0x01 and 0x40 part ways at their second bit", bit 1
  assert.match(lessonText(TRIE), /keys starting `0x01` and `0x40` part ways at their second bit/);
  assert.equal(hashesRedone(where["0x40"]), 3, "0x40's leaf, the branch above it, and the root");
});

test("the trie widget's root: 32 zero bytes, one leaf's hash, or a branch's", () => {
  assert.equal(rootIs(build([])), "zeros");
  assert.equal(rootIs(build([{ key: keyOf(0x40), size: 1 }])), "H(leaf)");
  assert.equal(build([{ key: keyOf(0x40), size: 1 }]).path, "", "one entry is a leaf at depth 0");
  // two keys apart only in their last shown bit: a chain of branches, each with an empty side
  const deep = build([{ key: keyOf(0x00), size: 1 }, { key: keyOf(0x01), size: 1 }]);
  assert.deepEqual(leavesOf(deep).map((l) => l.path), ["00000000", "00000001"]);
  assert.equal(nodesOf(deep).filter((n) => n.kind === "empty").length, 7, "bits 0 to 6 each split off an empty 1 side");
  assert.throws(() => build([{ key: keyOf(7), size: 1 }, { key: keyOf(7), size: 2 }]), /share a key/);
});

test("a leaf's first byte is 6.1's: 1, 0 and the length up to 32 bytes; 1, 1 past it", () => {
  assert.equal(leafFirstByte(5), 0b10000101);
  assert.equal(leafFirstByte(0), 0b10000000);
  assert.equal(leafFirstByte(32), 0b10100000);
  assert.equal(leafFirstByte(33), 0b11000000);
  assert.equal(leafFirstByte(159322), 0b11000000);
  assert.match(lessonText(TRIE), /value\.length <= 32[\s\S]*0b10000000 \| value\.length[\s\S]*0b11000000/);
});

test("the trie drawing: every branch above the middle of its two sides, each slot side by side", () => {
  const root = build(["0x01", "0x40", "0xff", "0x00"].map((h) => ({ key: keyOf(parseInt(h, 16)), size: 4 })));
  const { placed, edges, width, depth } = layout(root);
  assert.equal(placed.length, nodesOf(root).length);
  assert.equal(edges.length, placed.length - 1, "a tree: one edge into every node but the root");
  assert.equal(depth, 8);
  const at = new Map(placed.map((p) => [p.node.path, p]));
  for (const p of placed) if (p.node.kind === "branch") assert.equal(p.x, (at.get(`${p.node.path}0`)!.x + at.get(`${p.node.path}1`)!.x) / 2);
  const bottom = placed.filter((p) => p.node.kind !== "branch").sort((a, b) => a.x - b.x);
  assert.deepEqual(bottom.map((p) => p.node.path), [...bottom.map((p) => p.node.path)].sort(), "left to right in key order");
  assert.ok(width > 0 && bottom.at(-1)!.x < width);
});

test("the state key widget makes 6.2's test keys: C(11) and service 0x04030201's account", () => {
  const code = lessonText(KEYS);
  const [, i, ci, zi] = /componentKey\((\d+)\)\);\s*assert\.equal\(key, "(0x[0-9a-f]+)" \+ "00"\.repeat\((\d+)\)\)/.exec(code)!;
  assert.equal(toHex(bytesOf(componentKey(Number(i)))), ci + "00".repeat(Number(zi)));
  const [, s, cs, zs] = /accountKey\((0x[0-9a-f]+)\)\);\s*assert\.equal\(key, "(0x[0-9a-f]+)" \+ "00"\.repeat\((\d+)\)\)/.exec(code)!;
  assert.equal(toHex(bytesOf(accountKey(Number(s)))), cs + "00".repeat(Number(zs)));
  // the prose: "its account key reads `ff 01 00 02 00 03 00 04 00`, then zeros"
  const [, spaced] = /account key reads `([0-9a-f ]+)`, then zeros/.exec(code)!;
  assert.equal(toHex(bytesOf(accountKey(0x04030201)).slice(0, 9)), `0x${spaced.replaceAll(" ", "")}`);
});

test("each byte of a state key says where it came from, as 6.2's table does", () => {
  const tag = (key: ReturnType<typeof componentKey>) => key.map((c) => (c.from.kind === "zero" ? "0" : c.from.kind === "lead" ? "i" : `${c.from.kind}${c.from.index}`)).join(" ");
  assert.equal(tag(componentKey(11)), ["i", ...Array(30).fill("0")].join(" "));
  assert.equal(tag(accountKey(7)), ["i", "n0", "0", "n1", "0", "n2", "0", "n3", "0", ...Array(22).fill("0")].join(" "));
  const a = Array.from({ length: 32 }, (_, k) => k + 100);
  const woven = ["n0", "a0", "n1", "a1", "n2", "a2", "n3", "a3", ...Array.from({ length: 23 }, (_, k) => `a${k + 4}`)];
  assert.equal(tag(wovenKey(7, a)), woven.join(" "));
  assert.equal(woven.at(-1), "a26", "the table's last byte, a₂₆");
  assert.match(lessonText(KEYS), /n₀ a₀ n₁ a₁ n₂ a₂ n₃ a₃ a₄ … a₂₆/);
  for (const key of [componentKey(255), accountKey(2 ** 32 - 1), wovenKey(2 ** 32 - 1, a)]) assert.equal(key.length, 31);
  assert.throws(() => wovenKey(0, a.slice(0, HASH_BYTES_USED - 1)), /27 bytes/);
});

test("6.1's keys are 6.2's recipes: 16 components, service 0's account, and woven keys of service 0", () => {
  const keys = listing().map((r) => r.key);
  for (let i = 1; i <= 16; i++) assert.ok(keys.includes(toHex(bytesOf(componentKey(i)))), `C(${i})`);
  assert.ok(keys.includes(toHex(bytesOf(accountKey(0)))), "C(255, 0)");
  const woven = keys.filter((k) => /^0x00..00..00..00/.test(k)) // service 0: n₀ to n₃ all zero;
  assert.equal(woven.length, 4, "the four keys starting 0x00 that go deeper");
  for (const k of woven) {
    const b = fromHex(k);
    const a = [b[1], b[3], b[5], b[7], ...b.slice(8)]; // a₀ to a₂₆, read back out of the key
    assert.equal(toHex(bytesOf(wovenKey(0, padHash(a)))), k);
  }
  assert.equal(toHex(bytesOf(wovenKey(0, parseHashBytes(LESSON_HASH)!))), woven[0], "the widget's preset is the first of them");
});

test("the state key widget's component names are 6.2's table", () => {
  const rows = [...lessonText(KEYS).matchAll(/^\| C\((\d+)\) \| (\S+) \| ([^|]+) \| [\d,]+ \|$/gm)];
  assert.equal(rows.length, 16);
  for (const [, i, letter, name] of rows) assert.equal(COMPONENTS[Number(i)], `${letter}, ${name.trim()}`);
});

test("the state key widget reads what the reader types", () => {
  assert.equal(parseNumber("0x04030201", 2 ** 32 - 1), 0x04030201);
  assert.equal(parseNumber("67,305,985", 2 ** 32 - 1), 0x04030201);
  assert.equal(parseNumber("4294967296", 2 ** 32 - 1), null);
  assert.equal(parseNumber("-1", 255), null);
  assert.equal(parseNumber("", 255), null);
  assert.deepEqual(parseHashBytes("0x1f d8"), [0x1f, 0xd8]);
  assert.equal(parseHashBytes("1fd"), null, "half a byte");
  assert.equal(parseHashBytes("00".repeat(28)), null, "more than the key uses");
  assert.deepEqual(padHash([1, 2]), [1, 2, ...Array(25).fill(0)]);
});

const GENESIS = join(ROOT, "vectors/traces/storage/genesis.json");
test("6.1's counts: three keys take five hashes; the tiny genesis state's 21 entries take 55", { skip: !existsSync(GENESIS) && "no vectors/" }, () => {
  const three = build([0x01, 0x40, 0xff].map((first) => ({ key: keyOf(first), size: 4 })));
  assert.equal(hashesTaken(three), 5);
  const genesis = JSON.parse(readFileSync(GENESIS, "utf8"));
  const keyvals: { key: string; value: string }[] = (genesis.state ?? genesis.pre_state).keyvals;
  const trie = build(keyvals.map((k) => ({ key: fromHex(k.key), size: fromHex(k.value).length })));
  const branches = nodesOf(trie).filter((n) => n.kind === "branch");
  const oneSided = branches.filter((b) => b.kind === "branch" && (b.left.kind === "empty" || b.right.kind === "empty"));
  const leaves = leavesOf(trie);
  const big = leaves.filter((l) => !fitsInLeaf(l.entry.size));
  assert.deepEqual([keyvals.length, leaves.length, branches.length, oneSided.length, Math.max(...leaves.map((l) => l.path.length)), big.length, hashesTaken(trie)], [21, 21, 22, 2, 11, 12, 55]);
  assert.match(lessonText(TRIE).replace(/\s+/g, " "), /of the tiny genesis state's 22 branches, only 2 have an empty side\./);
  assert.match(lessonText(TRIE).replace(/\s+/g, " "), /has 21 entries, which make 21 leaves and 22 branches \(two with an empty side\), the deepest leaf 11 bits down\. Its 12 values over 32 bytes are hashed first, so its root takes 55 hashes\./);
});

test("6.1's widget says what a value is, with the genesis state's own: 0x0b… the time, 4 bytes; 0x08… the validators, 2,017", { skip: !existsSync(GENESIS) && "no vectors/" }, () => {
  const genesis = JSON.parse(readFileSync(GENESIS, "utf8"));
  const keyvals: { key: string; value: string }[] = (genesis.state ?? genesis.pre_state).keyvals;
  const size = (first: string) => fromHex(keyvals.find((k) => k.key.startsWith(first))!.value).length;
  assert.equal(size("0x0b00"), 4);
  assert.equal(size("0x0800"), 2017);
  assert.ok(fitsInLeaf(4) && !fitsInLeaf(2017));
  const widget = readFileSync(join(ROOT, ".vitepress/theme/TrieBuilder.vue"), "utf8").replace(/\s+/g, " ");
  assert.match(widget, /key <code>0x0b…<\/code> holds the time, 4 bytes, inside its leaf; key <code>0x08…<\/code> holds the validators, 2,017 bytes, so its leaf holds their hash/);
});

const TRIE_VECTORS = join(ROOT, "vectors/trie/trie.json");
test("6.1's widget hashes every node as the lesson's merkle does: all 11 official trie vectors' roots", { skip: !existsSync(TRIE_VECTORS) && "no vectors/" }, () => {
  const code = lessonCode("6.1");
  assert.match(code, /node\[0\] = 0b10000000 \| value\.length;/);
  assert.match(code, /node\[0\] = 0b11000000;/);
  assert.match(code, /node\[0\] = node\[0\] & 0b01111111;/);
  const cases = JSON.parse(readFileSync(TRIE_VECTORS, "utf8")) as { input: Record<string, string>; output: string }[];
  assert.equal(cases.length, 11);
  for (const c of cases) {
    const entries = Object.entries(c.input).map(([k, v]) => {
      const value = fromHex(v);
      return { key: fromHex(k).slice(0, 31), size: value.length, value };
    });
    assert.equal(toHex(rootOf(build(entries))), `0x${c.output}`);
  }
  // a 32-byte value sits inside its leaf, a 33-byte one is hashed: both edges are in the vectors
  const sizes = cases.flatMap((c) => Object.values(c.input).map((v) => v.length / 2));
  assert.ok(sizes.includes(32) && sizes.includes(33));
});

test("a typed value is its text's bytes, or hex from 0x; the leaf holds it inside up to 32 bytes", () => {
  assert.deepEqual(valueBytes("hello"), { bytes: [104, 101, 108, 108, 111], as: "text" });
  assert.deepEqual(valueBytes("0x2a00"), { bytes: [42, 0], as: "hex" });
  assert.deepEqual(valueBytes("0x2a0"), { bytes: [...new TextEncoder().encode("0x2a0")], as: "text" }, "half a byte isn't hex");
  const leaf = leafNode(keyOf(0x01), valueBytes("hello").bytes);
  assert.equal(leaf.length, 64);
  assert.equal(leaf[0], 0b10000000 | 5);
  assert.deepEqual(leaf.slice(32, 37), [104, 101, 108, 108, 111]);
  const big = Array<number>(33).fill(7);
  assert.equal(leafNode(keyOf(0x01), big)[0], 0b11000000);
  // the lesson's three keys with the widget's values: three leaves, two branches, five hashes
  const three = build([0x01, 0x40, 0xff].map((first, i) => { const value = valueBytes(["hello", "JAM", "Gray Paper"][i]).bytes; return { key: keyOf(first), size: value.length, value }; }));
  assert.equal(hashesTaken(three), 5);
  assert.equal(hashesOf(three).size, 5);
});

test("6.1 describes the trie vectors as they are: 11 cases of 0 to 10 entries, single values of 0, 1, 32, 33 and 60 bytes", { skip: !existsSync(TRIE_VECTORS) && "no vectors/" }, () => {
  const cases = JSON.parse(readFileSync(TRIE_VECTORS, "utf8")) as { input: Record<string, string> }[];
  const counts = cases.map((c) => Object.keys(c.input).length);
  assert.deepEqual(counts, [0, 1, 1, 1, 1, 1, 2, 2, 2, 5, 10]);
  const singles = cases.filter((c) => Object.keys(c.input).length === 1).map((c) => Object.values(c.input)[0].length / 2);
  assert.deepEqual(singles, [0, 1, 32, 33, 60]);
  const text = lessonText(TRIE).replace(/\s+/g, " ");
  assert.match(text, /holds 11 cases, each a set of entries, key → value in hex, and the root they must make/);
  assert.match(text, /`vectorJson`, from your `test\/vectors\.ts` of \[lesson 2\.6\]\(\.\.\/02-codec\/06-the-first-test-vectors\.md\), finds `vectors\/` from its own file's place/);
  assert.match(text, /The cases hold 0, 1, 1, 1, 1, 1, 2, 2, 2, 5 and 10 entries, and the single entries' values are 0, 1, 32, 33 and 60 bytes long/);
});
