// Lessons 5.1 and 5.2's widgets: H(x) and its avalanche, and the extrinsic hash with its
// proof of one report, checked against the lessons' own values (to be merged into
// tools/widgets.test.ts).

import { test } from "node:test";
import assert from "node:assert/strict";
import { blake2b } from "@noble/hashes/blake2.js";
import { allBits, bitsChanged, changedBits, encodeNumber, flipBit, H, inputBitsChanged, parseHex, spaced, textBytes } from "../.vitepress/theme/hash.ts";
import { apply, BLOCK, bytesHashed, checkProof, EMPTY, extrinsicHash, extrinsicSize, forge, FORGERIES, partHashes, partOf, PARTS, proofOf, proofSize } from "../.vitepress/theme/extrinsic-hash.ts";
import type { Edit, Extrinsic } from "../.vitepress/theme/extrinsic-hash.ts";
import { lessonText } from "./lessons.ts";

const HASHES = "05-hashing-and-signatures/01-hashes.md";
const EXTRINSIC = "05-hashing-and-signatures/02-the-extrinsic-hash.md";
const hex = (bytes: ArrayLike<number>) => Buffer.from(Array.from(bytes)).toString("hex");

test("the hash widget's H is 5.1's: the hash of nothing is the lesson's known answer, 32 bytes", () => {
  const text = lessonText(HASHES);
  const [, start] = /the hash of no\s+bytes\s+at\s+all\s+starts\s+`0x([0-9a-f]{8})`/.exec(text)!;
  const [, full] = /const empty: string = "0x([0-9a-f]{64})";/.exec(text)!;
  assert.ok(full.startsWith(start), "the lesson's two values agree");
  assert.equal(hex(H([])), full);
  // the lesson's bug hunt: without dkLen, 64 bytes come out; H must not be that
  const [, long] = /\+ '0x([0-9a-f]{128})'/.exec(text)!;
  assert.equal(H([]).length, 32);
  assert.notEqual(hex(H([])), long.slice(0, 64));
  // a second known answer, from Python's hashlib.blake2b(b"abc", digest_size=32)
  assert.equal(hex(H(textBytes("abc"))), "bddd813c634239723171ef3fee98579b94964e3bb1cb3e427262c8c068d52319");
});

test("the hash widget counts changed bits right, most significant bit first", () => {
  assert.equal(bitsChanged([0], [0]), 0);
  assert.equal(bitsChanged([0], [255]), 8);
  assert.equal(bitsChanged([0b10100000, 1], [0, 0]), 3);
  assert.deepEqual(changedBits([0], [128]), [true, false, false, false, false, false, false, false]);
  assert.deepEqual(allBits([0xc7]), [1, 1, 0, 0, 0, 1, 1, 1]);
  assert.equal(inputBitsChanged([1, 2], [1]), null, "a change of length isn't a count of bits");
  const input = [0xc7, 0x12];
  for (let byte = 0; byte < 2; byte++) {
    for (let bit = 0; bit < 8; bit++) {
      const flipped = flipBit(input, byte, bit);
      assert.equal(inputBitsChanged(input, flipped), 1, `byte ${byte} bit ${bit}: one input bit`);
      assert.equal(flipped[byte] ^ input[byte], 128 >> bit, "bit 0 is the 128s");
      const n = bitsChanged(H(input), H(flipped));
      assert.equal(n, changedBits(H(input), H(flipped)).filter(Boolean).length);
      assert.ok(n > 80 && n < 176, `byte ${byte} bit ${bit}: about half of 256 change (${n})`);
    }
  }
});

test("the hash widget's inputs: lesson 2.1's 4,807, and 42 in Part 2's three encodings", () => {
  const fixed = lessonText("02-codec/01-fixed-width-integers.md");
  const [, written] = /4,807 is `0x12c7`, and it's written `([0-9a-f ]+)`/.exec(fixed)!;
  assert.deepEqual(parseHex(written), encodeFixed2(4807));
  assert.equal(spaced(parseHex(written)!), written);
  assert.equal(hex(encodeNumber(42, "compact")), "2a");
  assert.equal(hex(encodeNumber(42, "u32")), "2a000000");
  assert.equal(hex(encodeNumber(42, "u64")), "2a00000000000000");
  const hashes = (["compact", "u32", "u64"] as const).map((how) => hex(H(encodeNumber(42, how))));
  assert.equal(new Set(hashes).size, 3, "same number, three encodings, three hashes");
  assert.deepEqual(parseHex("0xC7 12"), [0xc7, 0x12]);
  assert.deepEqual(parseHex(""), []);
  assert.equal(parseHex("c7 1"), null);
  assert.equal(parseHex("zz"), null);
  assert.deepEqual(textBytes("é"), [0xc3, 0xa9]);
});

/** ℰ₂ by hand, for the line above. */
const encodeFixed2 = (x: number) => [x & 0xff, x >> 8];

// ---- 5.2: an independent extrinsic hash, written out byte by byte, to check the widget's ----

const H2 = (bytes: number[]) => Array.from(blake2b(Uint8Array.from(bytes), { dkLen: 32 }));
const le = (x: number, n: number) => Array.from({ length: n }, (_, i) => Math.floor(x / 256 ** i) % 256);
const n1 = (n: number) => { assert.ok(n < 128, "small counts are one byte"); return [n]; };

function independentRoot(x: Extrinsic): string {
  const tickets = [...n1(x.tickets.length), ...x.tickets.flatMap((t) => [t.attempt, ...t.signature])];
  const preimages = [...n1(x.preimages.length), ...x.preimages.flatMap((p) => [...le(p.requester, 4), ...H2(p.blob)])];
  const guarantees = [...n1(x.guarantees.length), ...x.guarantees.flatMap((g) => [
    ...H2(g.report), ...le(g.slot, 4), ...n1(g.signatures.length), ...g.signatures.flatMap((s) => [...le(s.validator, 2), ...s.signature]),
  ])];
  const assurances = [...n1(x.assurances.length), ...x.assurances.flatMap((a) => [...a.anchor, a.bitfield, ...le(a.validator, 2), ...a.signature])];
  const disputes = [0, 0, 0];
  const glued = [tickets, preimages, guarantees, assurances, disputes].flatMap(H2);
  assert.equal(glued.length, 160);
  return hex(H2(glued));
}

const EDITS: Edit[] = [
  { kind: "attempt", ticket: 1 },
  { kind: "blob", preimage: 0, byte: 3 },
  { kind: "report", guarantee: 0, byte: 0 },
  { kind: "slot", guarantee: 1 },
  { kind: "bit", assurance: 0, core: 1 },
];

test("the extrinsic hash widget follows 5.2's three steps, on its block and an empty one", () => {
  const text = lessonText(EXTRINSIC);
  assert.ok(new RegExp(`Appendix C's order: ${PARTS.join(",\\s+")}\\.`).test(text), "the lesson's order of the five parts");
  assert.ok(/Glue the five hashes together, 160 bytes/.test(text), "160 bytes");
  assert.equal(hex(extrinsicHash(BLOCK)), independentRoot(BLOCK));
  for (const e of EDITS) assert.equal(hex(extrinsicHash(apply(BLOCK, e))), independentRoot(apply(BLOCK, e)), e.kind);
  // an empty block's hash: every fallback block carries "0x189d15af...6ca252"
  const [, head, tail] = /the \*same\*\s+extrinsic hash, `0x([0-9a-f]+)\.\.\.([0-9a-f]+)`/.exec(text)!;
  const empty = hex(extrinsicHash(EMPTY));
  assert.ok(empty.startsWith(head) && empty.endsWith(tail), empty);
  assert.equal(empty, independentRoot(EMPTY));
  // the block really is made of what the widget says: 2 tickets of 784-byte proofs, tiny's bitfield
  assert.ok(BLOCK.tickets.every((t) => t.signature.length === 784));
  assert.equal(BLOCK.guarantees.length, 2);
  const twists = BLOCK.preimages[0].blob.length + BLOCK.guarantees.reduce((n, g) => n + g.report.length, 0);
  const encoded = (2 * 785 + 1) + (1 + 36) + (1 + 2 * (32 + 4 + 1 + 2 * 66)) + (1 + 2 * (32 + 1 + 2 + 64)) + 3;
  assert.equal(bytesHashed(BLOCK), twists + encoded + 160);
});

test("a change in one part changes that part's hash and the root, and no other hash", () => {
  const before = partHashes(BLOCK);
  for (const e of EDITS) {
    const after = partHashes(apply(BLOCK, e));
    PARTS.forEach((part, i) => {
      assert.equal(hex(after[i]) !== hex(before[i]), part === partOf(e), `${e.kind} → ${part}`);
    });
    assert.notEqual(hex(extrinsicHash(apply(BLOCK, e))), hex(extrinsicHash(BLOCK)));
  }
  // an attempt goes round 0, 1, 2 and back: three edits, the same block
  const round = [0, 1, 2].reduce((x) => apply(x, { kind: "attempt", ticket: 0 }), BLOCK);
  assert.equal(hex(extrinsicHash(round)), hex(extrinsicHash(BLOCK)));
});

test("a proof of one report recomputes the root, and fails if any piece is changed", () => {
  const root = extrinsicHash(BLOCK);
  for (const index of [0, 1]) {
    const proof = proofOf(BLOCK, index);
    assert.ok(checkProof(proof, root).ok, `report ${index + 1}'s proof holds`);
    // it shows the report, and the other report only as its 32-byte hash
    const other = 1 - index;
    assert.deepEqual(proof.report, BLOCK.guarantees[index].report);
    assert.deepEqual(proof.guarantees[other].report, H2(BLOCK.guarantees[other].report));
    assert.equal(proof.guarantees[index].report, null);
    assert.equal(proof.others.length, 4);
    assert.ok(proofSize(proof) < extrinsicSize(BLOCK));
    for (const piece of FORGERIES) assert.equal(checkProof(forge(proof, piece), root).ok, false, `report ${index + 1}, forged ${piece}`);
    // against another block's root, it fails too
    assert.equal(checkProof(proof, extrinsicHash(apply(BLOCK, EDITS[0]))).ok, false);
  }
  // a proof made for a changed block holds for that block's root
  const changed = apply(BLOCK, { kind: "report", guarantee: 1, byte: 4 });
  assert.ok(checkProof(proofOf(changed, 1), extrinsicHash(changed)).ok);
});

test("lesson 5.2's hash tree: its boxes are the block's real hashes, and proving report 1 hands over what proofOf does", async () => {
  const { CHECK, PART_BODIES, PART_HASHES, REPORTS, ROOT, ROWS, SHOWN } = await import("../.vitepress/theme/extrinsic-tree.ts");
  const hex3 = (b: number[]) => `${b.slice(0, 3).map((x) => x.toString(16).padStart(2, "0")).join("")}…`;
  const hashes = partHashes(BLOCK);
  const proof = proofOf(BLOCK, 0);
  assert.equal(ROOT.value, hex3(extrinsicHash(BLOCK)));
  assert.deepEqual(PART_HASHES.map((b) => b.value), hashes.map(hex3));
  // handed over: the four other part hashes, the guarantees part with report 2 as its hash, report 1
  assert.deepEqual(PART_HASHES.filter((b) => b.role === "given").map((b) => b.label), ["H(tickets)", "H(preimages)", "H(assurances)", "H(disputes)"]);
  assert.deepEqual(proof.others.map(hex3), [0, 1, 3, 4].map((i) => hex3(hashes[i])));
  assert.equal(ROWS[1].role, "given");
  assert.equal(ROWS[1].value, hex3(proof.guarantees[1].report!));
  assert.deepEqual(REPORTS.map((r) => r.role), ["given", "hidden"]);
  assert.equal(REPORTS[0].value, String.fromCharCode(...proof.report));
  // worked out by the checker: report 1's hash, the guarantees part's hash, the root
  assert.deepEqual([ROWS[0].role, PART_HASHES[2].role, ROOT.role], ["worked out", "worked out", "worked out"]);
  assert.equal(ROWS[0].value, hex3(CHECK.reportHash));
  assert.equal(PART_HASHES[2].value, hex3(CHECK.guaranteesHash));
  assert.ok(CHECK.ok);
  // never shown: the other four parts' contents
  assert.deepEqual(PART_BODIES.filter((b) => b.role === "hidden").map((b) => b.id), ["tickets", "preimages", "assurances", "disputes"]);
  assert.deepEqual(SHOWN, { proof: proofSize(proof), block: extrinsicSize(BLOCK) });
  const raw = lessonText("05-hashing-and-signatures/02-the-extrinsic-hash.md");
  const at = raw.indexOf("<ExtrinsicTree />");
  assert.ok(at > raw.indexOf("Nobody needs the other reports themselves") && at < raw.indexOf("<ExtrinsicCommit />"));
});
