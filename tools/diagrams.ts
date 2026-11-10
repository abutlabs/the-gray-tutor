// The lessons' diagrams, drawn by code so that they stay right, as the Rust Book draws its
// figures from source files. `npm run diagrams` writes them; tools/diagrams.test.ts checks
// the committed files are what this file draws.
//
//   npm run diagrams

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { LESSONS } from "./lessons.ts";
import { compact } from "../.vitepress/theme/compact.ts";
import { FACES, drawFace, drawLogo } from "../.vitepress/theme/albert.ts";
import { assuranceBytes, authorizerAnatomy, guaranteeParts, readingADefinition, serviceAccountParts, whatRunsWhere } from "./diagrams-pieces.ts";

/** One field of an encoding: its name and value, its bytes, and how they were written. */
interface Field {
  name: string;
  value: string;
  bytes: string; // as hex, "…" for bytes left out
  length?: number; // how many of those bytes are a length in front (amber, as in the widget)
  encoding: string;
  from: number; // its first byte's offset
}

// The first fields of codec/tiny/work_item.bin, the work item of lesson 2.6, in two rows.
const WORK_ITEM: Field[][] = [[
  { name: "service", value: "16909060", bytes: "04 03 02 01", encoding: "ℰ₄", from: 0 },
  { name: "code_hash", value: "0x70a5…532e", bytes: "70 a5 08 29 … 9e 53 2e", encoding: "32 bytes, as is", from: 4 },
  { name: "refine_gas_limit", value: "42", bytes: "2a 00 00 00 00 00 00 00", encoding: "ℰ₈", from: 36 },
], [
  { name: "accumulate_gas_limit", value: "42", bytes: "2a 00 00 00 00 00 00 00", encoding: "ℰ₈", from: 44 },
  { name: "export_count", value: "4", bytes: "04 00", encoding: "ℰ₂", from: 52 },
  { name: "payload", value: "0x0102030405", bytes: "05 01 02 03 04 05", length: 1, encoding: "ℰ(5), then 5 bytes", from: 54 },
]];
const SHOWN_TO = 60; // the payload's last byte + 1
const TOTAL = 236; // work_item.bin's size

const CHAR = 8.4; // monospace at 14px: every character this wide
const GAP = 6;
const PAD = 14;
const ROW = 150;

const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const widthOf = (...texts: string[]) => Math.max(...texts.map((t) => t.length)) * CHAR + 2 * PAD;

/** A field's bytes, a length in front of them marked as one. */
function bytesOf(f: Field): string {
  const pairs = f.bytes.split(" "), n = f.length ?? 0;
  return n ? `<tspan class="len">${pairs.slice(0, n).join(" ")}</tspan> ${escape(pairs.slice(n).join(" "))}` : escape(f.bytes);
}

/** A work item's first bytes, field after field: name and value above, bytes, encoding below. */
export function workItemBytes(): string {
  const parts: string[] = [];
  let width = 0;
  WORK_ITEM.forEach((row, r) => {
    const top = r * ROW;
    let x = 16;
    for (const [i, f] of row.entries()) {
      const w = widthOf(f.name, f.value, f.bytes, f.encoding), mid = x + w / 2;
      parts.push(
        `<text class="name" x="${mid}" y="${top + 22}">${escape(f.name)}</text>`,
        `<text class="value" x="${mid}" y="${top + 42}">${escape(f.value)}</text>`,
        `<rect class="field f${(r + i) % 2}" x="${x}" y="${top + 54}" width="${w}" height="44" rx="6"/>`,
        `<text class="bytes" x="${mid}" y="${top + 82}">${bytesOf(f)}</text>`,
        `<text class="enc" x="${mid}" y="${top + 120}">${escape(f.encoding)}</text>`,
        `<text class="offset" x="${x}" y="${top + 140}">${f.from}</text>`,
      );
      x += w + GAP;
    }
    if (r === WORK_ITEM.length - 1) {
      const rest = `… ${TOTAL - SHOWN_TO} more bytes`, w = widthOf(rest);
      parts.push(
        `<text class="offset" x="${x}" y="${top + 140}">${SHOWN_TO}</text>`,
        `<rect class="field rest" x="${x}" y="${top + 54}" width="${w}" height="44" rx="6"/>`,
        `<text class="enc" x="${x + w / 2}" y="${top + 82}">${escape(rest)}</text>`,
      );
      x += w + GAP;
    }
    width = Math.max(width, x - GAP + 16);
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Math.ceil(width)} ${WORK_ITEM.length * ROW}" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="14">
<style>
  text { fill: #3c3c43; text-anchor: middle; }
  .value, .enc, .offset { fill: #67676c; font-size: 13px; }
  .bytes { fill: #0f766e; font-weight: bold; }
  .len { fill: #a16207; }
  .offset { text-anchor: start; }
  .field { stroke-width: 1.5; }
  .f0 { fill: #e8f0fe; stroke: #5b8def; }
  .f1 { fill: #e6f6ef; stroke: #3fa97a; }
  .rest { fill: none; stroke: #9a9aa0; stroke-dasharray: 5 4; }
  @media (prefers-color-scheme: dark) {
    text { fill: #dfdfd6; }
    .value, .enc, .offset { fill: #a8a8a0; }
    .bytes { fill: #4fd1c5; }
    .len { fill: #e0b04a; }
    .f0 { fill: #1e2a44; stroke: #7aa2f7; }
    .f1 { fill: #1b3329; stroke: #4fc08d; }
  }
</style>
${parts.join("\n")}
</svg>
`;
}

// Lesson 2.2's compact naturals: one byte, two bytes with the top bits zero, two bytes without.
const COMPACT = [127n, 128n, 300n];

/** Lesson 2.2's compact naturals, bit by bit: x as one strip of bits, and ℰ(x) as bytes holding those bits after the marker. */
export function compactNaturals(): string {
  const BIT = 24, BYTE = 8 * BIT, BYTE_GAP = 24, LEFT = 112, X0 = 16 + LEFT, KEY = 56, BLOCK = 190;
  const at = (b: number, i: number) => X0 + b * (BYTE + BYTE_GAP) + i * BIT;
  const cell = (cls: string, x: number, y: number, bit: string) => [
    `<rect class="${cls}" x="${x}" y="${y}" width="${BIT}" height="26"/>`,
    `<text x="${x + BIT / 2}" y="${y + 17}">${bit}</text>`,
    `<rect class="bitbar" x="${x + 4}" y="${y + 21}" width="${BIT - 8}" height="2.5" rx="1"/>`, // bits are copper
  ];
  // The key: a bit is one small square; a byte is a thick box of eight.
  const keyByte = 200;
  const parts: string[] = [
    ...cell("plain", 16, 8, "1"),
    `<text class="sub bits" x="${16 + BIT + 10}" y="26">one bit: 0 or 1</text>`,
    ...[..."10000000"].flatMap((bit, i) => cell("plain", keyByte + i * BIT, 8, bit)),
    `<rect class="byte" x="${keyByte}" y="8" width="${BYTE}" height="26" rx="3"/>`,
    `<text class="sub bytes" x="${keyByte + BYTE + 10}" y="26">one byte: 8 bits</text>`,
  ];
  for (const [k, x] of COMPACT.entries()) {
    const top = KEY + k * BLOCK, { l, bytes, roles } = compact(x);
    if (l > 1) throw new Error(`${x} takes more than two bytes`);
    const bits = bytes.map((byte) => byte.toString(2).padStart(8, "0"));
    const role = (b: number, i: number) => roles[b][i];
    // Row 1 is x's own bits; after the marker, ℰ(x) must hold exactly the same bits in order.
    const xBits = x.toString(2).padStart(7 * (l + 1), "0");
    const carried = bits.map((s, b) => [...s].filter((_, i) => role(b, i) !== "mark").join("")).join("");
    if (carried !== xBits) throw new Error(`ℰ(${x}) doesn't carry x's bits`);
    const topCount = 7 - l, start = at(0, l + 1), lowAt = at(0, 8);
    const yX = top + 30, yE = top + 92;
    const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
    parts.push(
      `<text class="label" x="16" y="${yX + 18}">x = ${x}</text>`,
      `<text class="sub bits" x="16" y="${yX + 36}">${xBits.length} bits</text>`,
      `<text class="label" x="16" y="${yE + 18}">ℰ(${x})</text>`,
      `<text class="sub bytes" x="16" y="${yE + 36}">${plural(bytes.length, "byte")}</text>`,
      `<text class="group" x="${start + (topCount * BIT) / 2}" y="${top + 22}">${l === 0 ? "7 bits" : `top ${topCount} bits`}</text>`,
      // Each group of x's bits, carried down into its place in ℰ(x).
      `<polygon class="carry top" points="${start},${yX + 26} ${lowAt},${yX + 26} ${lowAt},${yE} ${start},${yE}"/>`,
    );
    // x is one number, so its bits are one unbroken strip.
    xBits.split("").forEach((bit, i) => parts.push(...cell(i < topCount ? "top" : "low", start + i * BIT, yX, bit)));
    parts.push(`<rect class="number" x="${start}" y="${yX}" width="${xBits.length * BIT}" height="26" rx="3"/>`);
    if (l > 0) {
      parts.push(
        `<text class="group" x="${lowAt + BYTE / 2}" y="${top + 22}">low 8 bits</text>`,
        `<polygon class="carry low" points="${lowAt},${yX + 26} ${lowAt + BYTE},${yX + 26} ${at(1, 8)},${yE} ${at(1, 0)},${yE}"/>`,
      );
    }
    for (const [b, s] of bits.entries()) {
      for (let i = 0; i < 8; i++) parts.push(...cell(role(b, i), at(b, i), yE, s[i]));
      parts.push(
        `<rect class="byte" x="${at(b, 0)}" y="${yE}" width="${BYTE}" height="26" rx="3"/>`,
        `<text class="hex" x="${at(b, 0) + BYTE / 2}" y="${yE + 46}">0x${bytes[b].toString(16).padStart(2, "0")}</text>`,
      );
    }
    const marker = l === 0 ? "0b0: no more bytes follow" : "0b10: one more byte follows";
    parts.push(`<text class="note" x="${at(0, 0)}" y="${yE + 68}">↑ ${marker}</text>`);
  }
  const width = at(1, 8) + 16;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${KEY + COMPACT.length * BLOCK}" width="${width}" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="14">
<style>
  text { fill: #3c3c43; text-anchor: middle; }
  .label, .sub { text-anchor: start; }
  .group, .hex, .sub { fill: #67676c; font-size: 13px; }
  .note { fill: #a16207; font-size: 12px; text-anchor: start; }
  .group.bits, .sub.bits { fill: #b45309; }
  .sub.bytes, .hex { fill: #0f766e; }
  .bitbar { fill: #b45309; stroke: none; }
  .plain { fill: #f6f6f7; stroke: #9a9aa0; }
  .mark { fill: #fdf3e1; stroke: #d39b2a; }
  .top { fill: #e8f0fe; stroke: #5b8def; }
  .low { fill: #e6f6ef; stroke: #3fa97a; }
  .carry { stroke: none; opacity: 0.45; }
  .number { fill: none; stroke: #9a9aa0; stroke-dasharray: 4 3; }
  .byte { fill: none; stroke: #0f766e; stroke-width: 2; }
  @media (prefers-color-scheme: dark) {
    text { fill: #dfdfd6; }
    .group, .hex, .sub { fill: #a8a8a0; }
    .note { fill: #e0b04a; }
    .sub.bits, .bitbar { fill: #f0a35e; }
    .sub.bytes, .hex { fill: #4fd1c5; }
    .plain { fill: #2a2a2e; stroke: #8a8a90; }
    .mark { fill: #3a2e14; stroke: #e0b04a; }
    .top { fill: #1e2a44; stroke: #7aa2f7; }
    .low { fill: #1b3329; stroke: #4fc08d; }
    .number { stroke: #8a8a90; }
    .byte { stroke: #4fd1c5; }
  }
</style>
${parts.join("\n")}
</svg>
`;
}

/** A node of the little trie in lesson 6.1: where it sits, and what it shows. */
interface TrieNode {
  x: number;
  y: number;
  kind: "branch" | "leaf";
  key?: string; // a leaf's key's first byte, as bits (0b left off)
  path?: number; // how many of those bits lead to it
  note: string;
}

// Lesson 6.1's three keys, 0x01, 0x40 and 0xff, and the trie they make.
const TRIE: TrieNode[] = [
  { x: 330, y: 30, kind: "branch", note: "the root: H(this node)" },
  { x: 170, y: 140, kind: "branch", note: "64 bytes: both sides' hashes" },
  { x: 490, y: 140, kind: "leaf", key: "1111_1111", path: 1, note: "0xff…: alone on the 1 side" },
  { x: 80, y: 250, kind: "leaf", key: "0000_0001", path: 2, note: "0x01…" },
  { x: 290, y: 250, kind: "leaf", key: "0100_0000", path: 2, note: "0x40…" },
];
const EDGES: [number, number, string][] = [[0, 1, "0"], [0, 2, "1"], [1, 3, "0"], [1, 4, "1"]];

/** The bits of a key, written 0b…, the ones that pick its path drawn strong in the edges' blue. */
function keyBits(bits: string, path: number): string {
  let seen = 0, strong = "", rest = "";
  for (const ch of bits) {
    if (ch !== "_" && seen < path) { strong += ch; seen++; } else rest += ch;
  }
  return `0b<tspan class="path">${strong}</tspan>${escape(rest)}`;
}

/** Lesson 6.1's trie: branches and leaves, the bits that sort the keys, the root on top. */
export function stateTrie(): string {
  const W = 130, H = 40;
  const parts = EDGES.map(([a, b, bit]) => {
    const [from, to] = [TRIE[a], TRIE[b]];
    // a branch's edges start under its note, so the note stays clear
    const [x1, y1, x2, y2] = [from.x + W / 2, from.y + H + 26, to.x + W / 2, to.y];
    return `<line class="edge" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>` +
      `<text class="bit" x="${(x1 + x2) / 2 + (bit === "0" ? -14 : 14)}" y="${(y1 + y2) / 2 + 4}">${bit}</text>`;
  });
  for (const n of TRIE) {
    parts.push(
      `<rect class="${n.kind}" x="${n.x}" y="${n.y}" width="${W}" height="${H}" rx="6"/>`,
      `<text x="${n.x + W / 2}" y="${n.y + (n.key ? 17 : 25)}">${n.kind}</text>`,
    );
    if (n.key) parts.push(`<text class="key" x="${n.x + W / 2}" y="${n.y + 33}">${keyBits(n.key, n.path!)}</text>`);
    parts.push(`<text class="note" x="${n.x + W / 2}" y="${n.y + H + 18}">${escape(n.note)}</text>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 660 320" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="14">
<style>
  text { fill: #3c3c43; text-anchor: middle; }
  .note { fill: #67676c; font-size: 12px; }
  .key { fill: #b45309; font-size: 13px; }
  .path { fill: #5b8def; font-weight: bold; }
  .bit { fill: #5b8def; font-weight: bold; }
  .edge { stroke: #9a9aa0; stroke-width: 1.5; }
  .branch { fill: #e8f0fe; stroke: #5b8def; stroke-width: 1.5; }
  .leaf { fill: #e6f6ef; stroke: #3fa97a; stroke-width: 1.5; }
  @media (prefers-color-scheme: dark) {
    text { fill: #dfdfd6; }
    .note { fill: #a8a8a0; }
    .key { fill: #f0a35e; }
    .path { fill: #7aa2f7; }
    .bit { fill: #7aa2f7; }
    .edge { stroke: #6b6b72; }
    .branch { fill: #1e2a44; stroke: #7aa2f7; }
    .leaf { fill: #1b3329; stroke: #4fc08d; }
  }
</style>
${parts.join("\n")}
</svg>
`;
}

/** Z (GP §6): outside in. The first, the last, the second, the second to last, ... */
function outsideIn<T>(items: T[]): T[] {
  const out: T[] = [];
  for (let i = 0; i < items.length; i++) out.push(i % 2 === 0 ? items[i / 2] : items[items.length - 1 - (i - 1) / 2]);
  return out;
}

/** Lesson 8.4's lottery on tiny (E = 12, Y = 10): the close, the winners, their seats, outside in. */
export function ticketContest(): string {
  const E = 12, Y = 10, CELL = 46, PITCH = 52, X0 = 21;
  const x = (i: number) => X0 + i * PITCH;
  const seats = outsideIn([...Array(E).keys()]); // slot s of the next epoch holds ticket seats[s]
  const parts: string[] = [
    `<text class="row" x="${X0}" y="24">this epoch: tickets enter in slots 0 to ${Y - 1}</text>`,
    `<text class="row" x="${X0}" y="138">the ${E} winners, sorted by id: t0 is the lowest, the best</text>`,
    `<text class="row" x="${X0}" y="326">the next epoch: each slot's sealer, outside in</text>`,
  ];
  for (let i = 0; i < E; i++) {
    parts.push(
      `<rect class="${i < Y ? "open" : "closed"}" x="${x(i)}" y="34" width="${CELL}" height="34" rx="5"/>`,
      `<text x="${x(i) + CELL / 2}" y="56">${i}</text>`,
      `<rect class="ticket" x="${x(i)}" y="148" width="${CELL}" height="34" rx="5"/>`,
      `<text x="${x(i) + CELL / 2}" y="170">t${i}</text>`,
      `<line class="seat" x1="${x(i) + CELL / 2}" y1="182" x2="${x(seats.indexOf(i)) + CELL / 2}" y2="242"/>`,
      `<rect class="slot" x="${x(i)}" y="242" width="${CELL}" height="34" rx="5"/>`,
      `<text x="${x(i) + CELL / 2}" y="264">t${seats[i]}</text>`,
      `<text class="small" x="${x(i) + CELL / 2}" y="294">${i}</text>`,
    );
  }
  const close = x(Y) - (PITCH - CELL) / 2;
  parts.push(
    `<line class="close" x1="${close}" y1="28" x2="${close}" y2="76"/>`,
    `<text class="note" x="${X0}" y="92">at the dashed line, Y = ${Y}, the lottery closes:</text>`,
    `<text class="note" x="${X0}" y="108">the block that crosses it carries the tickets mark</text>`,
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 660 336" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="14">
<style>
  text { fill: #3c3c43; text-anchor: middle; }
  .row { text-anchor: start; font-size: 13px; fill: #3c3c43; }
  .note { fill: #c2410c; font-size: 12px; text-anchor: start; }
  .small { fill: #67676c; font-size: 11px; }
  .open { fill: #e8f0fe; stroke: #5b8def; stroke-width: 1.5; }
  .closed { fill: none; stroke: #9a9aa0; stroke-width: 1.5; stroke-dasharray: 4 3; }
  .ticket { fill: #fdf3e1; stroke: #d39b2a; stroke-width: 1.5; }
  .slot { fill: #e6f6ef; stroke: #3fa97a; stroke-width: 1.5; }
  .seat { stroke: #9a9aa0; stroke-width: 1.2; }
  .close { stroke: #c2410c; stroke-width: 2; stroke-dasharray: 5 3; }
  @media (prefers-color-scheme: dark) {
    text, .row { fill: #dfdfd6; }
    .note { fill: #ff9a5c; }
    .small { fill: #a8a8a0; }
    .open { fill: #1e2a44; stroke: #7aa2f7; }
    .closed { stroke: #6b6b72; }
    .ticket { fill: #3a2e14; stroke: #e0b04a; }
    .slot { fill: #1b3329; stroke: #4fc08d; }
    .seat { stroke: #6b6b72; }
    .close { stroke: #ff9a5c; }
  }
</style>
${parts.join("\n")}
</svg>
`;
}

/** Lesson 7.2's shuffle by hand (GP App. F): a b c d with the numbers 1 1 0 0, step by step. */
export function shuffleSteps(): string {
  const CELL = 40, PITCH = 46, LEFT = 128, PICKED = 384, ROW = 74, TOP = 58;
  const left = ["a", "b", "c", "d"];
  const numbers = [1, 1, 0, 0];
  const picked: string[] = [];
  const parts: string[] = [
    `<text class="row" x="${LEFT}" y="22">left</text>`,
    `<text class="row" x="${PICKED}" y="22">picked</text>`,
  ];
  numbers.forEach((n, step) => {
    const y = TOP + step * ROW;
    const l = left.length, at = n % l, last = l - 1;
    const x = (i: number, from = LEFT) => from + i * PITCH;
    parts.push(`<text class="row" x="16" y="${y + 22}">${n} mod ${l} = ${at}</text>`);
    left.forEach((item, i) => {
      const kind = i === at ? "pick" : i === last ? "last" : "item";
      parts.push(
        `<rect class="${kind}" x="${x(i)}" y="${y}" width="${CELL}" height="34" rx="5"/>`,
        `<text x="${x(i) + CELL / 2}" y="${y + 22}">${item}</text>`,
      );
    });
    if (at !== last) { // the last item moves into the gap the pick leaves
      const [from, to, top] = [x(last) + CELL / 2, x(at) + CELL / 2, y - 2];
      parts.push(
        `<path class="move" d="M ${from} ${top} C ${from} ${top - 24} ${to} ${top - 24} ${to} ${top - 6}"/>`,
        `<polygon class="tip" points="${to - 4},${top - 8} ${to + 4},${top - 8} ${to},${top}"/>`,
      );
    }
    parts.push(`<text class="small" x="${(x(3) + CELL + PICKED) / 2}" y="${y + 22}">→</text>`);
    picked.push(left[at]);
    left[at] = left[last];
    left.pop();
    picked.forEach((item, i) => {
      parts.push(
        `<rect class="picked" x="${x(i, PICKED)}" y="${y}" width="${CELL}" height="34" rx="5"/>`,
        `<text x="${x(i, PICKED) + CELL / 2}" y="${y + 22}">${item}</text>`,
      );
    });
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 580 ${TOP + 4 * ROW - 22}" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="14">
<style>
  text { fill: #3c3c43; text-anchor: middle; }
  .row { text-anchor: start; font-size: 13px; fill: #3c3c43; }
  .small { fill: #67676c; }
  .item { fill: #e8f0fe; stroke: #5b8def; stroke-width: 1.5; }
  .last { fill: #e8f0fe; stroke: #5b8def; stroke-width: 1.5; stroke-dasharray: 4 3; }
  .pick { fill: #fdf3e1; stroke: #d39b2a; stroke-width: 2; }
  .picked { fill: #e6f6ef; stroke: #3fa97a; stroke-width: 1.5; }
  .move { fill: none; stroke: #c2410c; stroke-width: 1.5; }
  .tip { fill: #c2410c; }
  @media (prefers-color-scheme: dark) {
    text, .row { fill: #dfdfd6; }
    .small { fill: #a8a8a0; }
    .item, .last { fill: #1e2a44; stroke: #7aa2f7; }
    .pick { fill: #3a2e14; stroke: #e0b04a; }
    .picked { fill: #1b3329; stroke: #4fc08d; }
    .move { stroke: #ff9a5c; }
    .tip { fill: #ff9a5c; }
  }
</style>
${parts.join("\n")}
</svg>
`;
}

/**
 * Lesson 17.4's rounds, on the gift's block (transfer_for_live_service-1): what each round
 * runs, what it sends on, and why Δ+ stops. The numbers are that vector's.
 */
export function accumulationRounds(): string {
  const LABEL = 16, BOX = 118, W = 300, H = 66, GAP = 52;
  const y = (round: number) => 30 + round * (H + GAP);
  const box = (round: number, kind: string, lines: string[]) => [
    `<text class="row" x="${LABEL}" y="${y(round) + 38}">round ${round + 1}</text>`,
    `<rect class="${kind}" x="${BOX}" y="${y(round)}" width="${W}" height="${H}" rx="6"/>`,
    ...lines.map((line, i) =>
      `<text class="${i === 0 ? "" : "small"}" x="${BOX + 14}" y="${y(round) + 24 + i * 18}">${line}</text>`),
  ];
  const arrow = (round: number, label: string[]) => {
    const [x, top, bottom] = [BOX + 40, y(round) + H, y(round + 1)];
    return [
      `<line class="send" x1="${x}" y1="${top}" x2="${x}" y2="${bottom - 7}"/>`,
      `<polygon class="tip" points="${x - 5},${bottom - 9} ${x + 5},${bottom - 9} ${x},${bottom - 1}"/>`,
      ...label.map((line, i) =>
        `<text class="note" x="${x + 14}" y="${top + 21 + i * 16}">${line}</text>`),
    ];
  };
  const parts = [
    ...box(0, "service", ["service 0", "in: 1 operand (its digest)", "used: 255,437 gas"]),
    ...arrow(0, ["sends service 1 a transfer: 100,", "the memo \"gift\", 80,000 gas"]),
    ...box(1, "service", ["service 1", "first, its balance: 227,714 + 100", "in: 1 transfer; used: 61,711 gas"]),
    ...arrow(1, ["sends nothing"]),
    ...box(2, "done", ["no transfers to deliver:", "Δ+ stops"]),
  ];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 ${y(2) + H + 8}" width="560" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="14">
<style>
  text { fill: #3c3c43; text-anchor: start; }
  .row { font-size: 13px; }
  .small { fill: #67676c; font-size: 12px; }
  .note { fill: #c2410c; font-size: 12px; }
  .service { fill: #e6f6ef; stroke: #3fa97a; stroke-width: 1.5; }
  .done { fill: none; stroke: #9a9aa0; stroke-width: 1.5; stroke-dasharray: 4 3; }
  .send { stroke: #c2410c; stroke-width: 1.5; }
  .tip { fill: #c2410c; }
  @media (prefers-color-scheme: dark) {
    text { fill: #dfdfd6; }
    .small { fill: #a8a8a0; }
    .note { fill: #ff9a5c; }
    .service { fill: #1b3329; stroke: #4fc08d; }
    .done { stroke: #6b6b72; }
    .send { stroke: #ff9a5c; }
    .tip { fill: #ff9a5c; }
  }
</style>
${parts.join("\n")}
</svg>
`;
}

/** Every diagram: where it goes, and what draws it. */
/** Lesson 17.11's M_B (GP App. E) over three items: split in half, the first half rounded
 * up; a node hashes "node" and its two halves; a half of one item is the item itself. */
export function wellBalancedTree(): string {
  const W = 200, H = 40;
  type Box = { x: number; y: number; text: string; kind: string; note?: string };
  const boxes: Box[] = [
    { x: 230, y: 16, text: 'K("node" ⌢ n ⌢ c)', kind: "node", note: "the root, M_B([a, b, c])" },
    { x: 90, y: 116, text: 'n = K("node" ⌢ a ⌢ b)', kind: "node", note: "the first half: 2 of 3" },
    { x: 490, y: 116, text: "c", kind: "leaf", note: "a half of one: c itself" },
    { x: 20, y: 216, text: "a", kind: "leaf" },
    { x: 240, y: 216, text: "b", kind: "leaf" },
  ];
  const EDGES: [number, number][] = [[0, 1], [0, 2], [1, 3], [1, 4]];
  const parts = EDGES.map(([from, to]) => {
    const [f, t] = [boxes[from], boxes[to]];
    const y1 = f.y + H + (f.note ? 24 : 0);
    return `<line class="edge" x1="${f.x + W / 2}" y1="${y1}" x2="${t.x + W / 2}" y2="${t.y}"/>`;
  });
  for (const b of boxes) {
    parts.push(
      `<rect class="${b.kind}" x="${b.x}" y="${b.y}" width="${W}" height="${H}" rx="6"/>`,
      `<text x="${b.x + W / 2}" y="${b.y + 25}">${escape(b.text)}</text>`,
    );
    if (b.note) parts.push(`<text class="note" x="${b.x + W / 2}" y="${b.y + H + 17}">${escape(b.note)}</text>`);
  }
  parts.push(
    `<text class="note" x="350" y="286">a, b, c: the items, 36 bytes each (ℰ₄(s) ⌢ h); K: Keccak-256</text>`,
    `<text class="note" x="350" y="306">one item alone is hashed: M_B([a]) = K(a)</text>`,
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 320" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="14">
<style>
  text { fill: #3c3c43; text-anchor: middle; }
  .note { fill: #67676c; font-size: 12px; }
  .edge { stroke: #9a9aa0; stroke-width: 1.5; }
  .node { fill: #e8f0fe; stroke: #5b8def; stroke-width: 1.5; }
  .leaf { fill: #e6f6ef; stroke: #3fa97a; stroke-width: 1.5; }
  @media (prefers-color-scheme: dark) {
    text { fill: #dfdfd6; }
    .note { fill: #a8a8a0; }
    .edge { stroke: #6b6b72; }
    .node { fill: #1e2a44; stroke: #7aa2f7; }
    .leaf { fill: #1b3329; stroke: #4fc08d; }
  }
</style>
${parts.join("\n")}
</svg>
`;
}

export const DIAGRAMS: Record<string, () => string> = {
  "02-codec/images/02-compact-naturals.svg": compactNaturals,
  "02-codec/images/06-work-item-bytes.svg": workItemBytes,
  "06-state-and-merklization/images/01-state-trie.svg": stateTrie,
  "07-time-and-shuffling/images/02-shuffle-steps.svg": shuffleSteps,
  "08-safrole/images/04-ticket-contest.svg": ticketContest,
  "17-accumulation/images/04-rounds.svg": accumulationRounds,
  "17-accumulation/images/11-well-balanced.svg": wellBalancedTree,
  // what the pieces are made of, and where each runs: the appendix and Parts 11 to 14's opening pages
  "images/what-runs-where.svg": whatRunsWhere,
  "images/reading-a-definition.svg": readingADefinition,
  "03-work-and-reports/images/index-what-runs-where.svg": whatRunsWhere, // Part 3 opens with the same map
  "11-assurances/images/index-assurance-bytes.svg": assuranceBytes,
  "12-guarantees/images/index-guarantee-parts.svg": guaranteeParts,
  "13-authorization/images/index-authorizer.svg": authorizerAnatomy,
  "14-services/images/index-service-account.svg": serviceAccountParts,
  // Albert: the logo, and his faces, met in lesson 0.1 (.vitepress/theme/albert.ts)
  "public/logo.svg": drawLogo,
  ...Object.fromEntries(FACES.map((face) => [`00-start/images/01-albert-${face}.svg`, () => drawFace(face)])),
};

if (import.meta.main) {
  for (const [file, draw] of Object.entries(DIAGRAMS)) {
    writeFileSync(join(LESSONS, file), draw());
    console.log(`wrote lessons/${file}`);
  }
}
