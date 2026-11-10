// The pictures that say what JAM's pieces are made of and where each one runs, for the
// appendix "What runs where" and the opening pages of Parts 11 to 14. Every value is a
// real one: the codec vector's work-package, the reports and assurances vectors' first
// entries, the storage trace's first report, and the vectors' service 0. Drawn by code
// (tools/diagrams.ts registers them) so that they stay right when a lesson changes.

import { H } from "../.vitepress/theme/hash.ts";

const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** The bytes of a hex string, "0x" or not. */
const hexBytes = (hex: string): number[] => (hex.replace(/^0x/, "").match(/../g) ?? []).map((b) => parseInt(b, 16));
const toHex = (bytes: number[]): string => "0x" + bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
/** A hash shortened as the lessons shorten them: the first four bytes, an ellipsis, the last two. */
const short = (hex: string): string => `${hex.slice(0, 10)}…${hex.slice(-4)}`;

/** One style block for all of these: light and dark, the lessons' colours. */
const STYLE = `<style>
  text { fill: #3c3c43; text-anchor: start; }
  .title { font-weight: bold; }
  .small { fill: #67676c; font-size: 12px; }
  .bytes { fill: #0f766e; }
  .who { fill: #c2410c; font-size: 12px; }
  .place { fill: none; stroke: #9a9aa0; stroke-width: 1.5; stroke-dasharray: 5 4; }
  .thing { fill: #e8f0fe; stroke: #5b8def; stroke-width: 1.5; }
  .code { fill: #e6f6ef; stroke: #3fa97a; stroke-width: 1.5; }
  .chain { fill: #fdf3e1; stroke: #d19a2a; stroke-width: 1.5; }
  .line { stroke: #9a9aa0; stroke-width: 1.5; fill: none; }
  .tip { fill: #9a9aa0; }
  @media (prefers-color-scheme: dark) {
    text { fill: #dfdfd6; }
    .small { fill: #a8a8a0; }
    .bytes { fill: #4fd1c5; }
    .who { fill: #ff9a5c; }
    .place { stroke: #6b6b72; }
    .thing { fill: #1e2a44; stroke: #7aa2f7; }
    .code { fill: #1b3329; stroke: #4fc08d; }
    .chain { fill: #3a2e14; stroke: #e0b04a; }
    .line { stroke: #6b6b72; }
    .tip { fill: #6b6b72; }
  }
</style>`;

const svg = (width: number, height: number, parts: string[], shownWidth?: number): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"${shownWidth ? ` width="${shownWidth}"` : ""} font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="14">
${STYLE}
${parts.join("\n")}
</svg>
`;

/** A box with a bold first line and smaller lines under it. */
function box(kind: string, x: number, y: number, w: number, lines: string[], lineHeight = 17): string[] {
  const h = 30 + (lines.length - 1) * lineHeight;
  return [
    `<rect class="${kind}" x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/>`,
    ...lines.map((line, i) =>
      `<text class="${i === 0 ? "title" : "small"}" x="${x + 12}" y="${y + 20 + i * lineHeight}">${escape(line)}</text>`),
  ];
}
const boxHeight = (lines: number, lineHeight = 17) => 30 + (lines - 1) * lineHeight;

/** An arrow from (x1, y1) to (x2, y2), straight. */
function arrow(x1: number, y1: number, x2: number, y2: number): string[] {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
  const [ex, ey] = [x2 - ux * 8, y2 - uy * 8];
  const [px, py] = [-uy * 5, ux * 5];
  return [
    `<line class="line" x1="${x1}" y1="${y1}" x2="${ex}" y2="${ey}"/>`,
    `<polygon class="tip" points="${ex + px},${ey + py} ${ex - px},${ey - py} ${x2},${y2}"/>`,
  ];
}

// --- What runs where ---------------------------------------------------------------------

/**
 * The appendix's map: three places, who is in each, and the pieces that pass between them.
 * A builder off the chain makes a work-package; a core's three guarantors run the
 * authorizer and refine in the PVM and sign a work-report; every validator checks the
 * block and accumulates, in the PVM again, and writes the state.
 */
export function whatRunsWhere(): string {
  const COL = 272, GAP = 24, X = [16, 16 + COL + GAP, 16 + 2 * (COL + GAP)];
  const W = COL - 16; // a box inside its column
  const parts: string[] = [];
  const places = [
    ["Off the chain", "anyone: a builder, a wallet, a rollup"],
    ["In-core", "the 3 guarantors of one core (2 cores on tiny, 341 on full)"],
    ["On the chain", "every validator (6 on tiny, 1,023 on full): your client"],
  ];
  const H_ALL = 560;
  places.forEach(([name, who], i) => {
    parts.push(
      `<rect class="place" x="${X[i] - 4}" y="8" width="${COL - 16}" height="${H_ALL - 16}" rx="10"/>`,
      `<text class="title" x="${X[i] + 8}" y="32">${escape(name)}</text>`,
    );
    const words = who.split(" "), lines: string[] = [];
    for (const w of words) {
      if (lines.length && (lines.at(-1)! + " " + w).length <= 30) lines[lines.length - 1] += " " + w;
      else lines.push(w);
    }
    lines.forEach((l, j) => parts.push(`<text class="who" x="${X[i] + 8}" y="${52 + j * 15}">${escape(l)}</text>`));
  });
  const top = 96;
  // column 1: the package
  parts.push(...box("thing", X[0] + 4, top, W, [
    "a work-package",
    "an authorization token (a blob)",
    "an authorizer: code hash, config",
    "a context: which block it saw",
    "1 to 16 work-items, each:",
    "  service, payload, gas limits",
  ]));
  parts.push(`<text class="small" x="${X[0] + 4}" y="${top + 150}">lesson 3.1</text>`);
  parts.push(`<text class="small" x="${X[0] + 4}" y="${top + 190}">Never runs on the chain:</text>`);
  parts.push(`<text class="small" x="${X[0] + 4}" y="${top + 207}">a block carries reports about</text>`);
  parts.push(`<text class="small" x="${X[0] + 4}" y="${top + 224}">packages, never a package.</text>`);
  // column 2: in-core
  const c2 = [
    box("code", X[1] + 4, top, W, ["Is-Authorized (PVM)", "the authorizer's code checks", "the token; out: a trace"]),
    box("code", X[1] + 4, top + 86, W, ["Refine (PVM)", "each item's service code runs", "on its payload; out: a digest"]),
    box("thing", X[1] + 4, top + 172, W, [
      "a work-report",
      "the package's hash and size",
      "its context, its core",
      "authorizer hash, trace, gas",
      "one digest per item",
    ]),
    box("thing", X[1] + 4, top + 290, W, ["a guarantee", "the report, the slot,", "2 or 3 signatures"]),
  ];
  parts.push(...c2.flat());
  parts.push(...arrow(X[1] + 4 + W / 2, top + boxHeight(3), X[1] + 4 + W / 2, top + 86));
  parts.push(...arrow(X[1] + 4 + W / 2, top + 86 + boxHeight(3), X[1] + 4 + W / 2, top + 172));
  parts.push(...arrow(X[1] + 4 + W / 2, top + 172 + boxHeight(5), X[1] + 4 + W / 2, top + 290));
  parts.push(`<text class="small" x="${X[1] + 4}" y="${top + 374}">lessons 3.2, 3.3, 4.3; Part 12</text>`);
  parts.push(`<text class="small" x="${X[1] + 4}" y="${top + 414}">Shards of the package go to</text>`);
  parts.push(`<text class="small" x="${X[1] + 4}" y="${top + 431}">every validator (lesson 3.3).</text>`);
  // column 3: on-chain
  const c3 = [
    box("chain", X[2] + 4, top, W, ["a block", "guarantees, assurances,", "preimages, tickets, disputes"]),
    box("chain", X[2] + 4, top + 86, W, [
      "checks, Parts 10 to 13",
      "authorizer in the core's pool?",
      "guarantors assigned? signed?",
      "> 2/3 assured the data?",
    ]),
    box("code", X[2] + 4, top + 190, W, ["Accumulate (PVM), Parts 15-17", "each service's accumulate", "code runs on its digests, on", "every validator; writes state"]),
    box("chain", X[2] + 4, top + 294, W, ["the state σ′ and its root", "accounts, pools, queues,", "scorecards: Parts 18, 19"]),
  ];
  parts.push(...c3.flat());
  parts.push(...arrow(X[2] + 4 + W / 2, top + boxHeight(3), X[2] + 4 + W / 2, top + 86));
  parts.push(...arrow(X[2] + 4 + W / 2, top + 86 + boxHeight(4), X[2] + 4 + W / 2, top + 190));
  parts.push(...arrow(X[2] + 4 + W / 2, top + 190 + boxHeight(4), X[2] + 4 + W / 2, top + 294));
  // between columns
  parts.push(...arrow(X[0] + 4 + W, top + 40, X[1] + 4, top + 40));
  parts.push(...arrow(X[1] + 4 + W, top + 290 + 30, X[2] + 4, top + 30));
  parts.push(`<text class="small" x="${X[2] + 4}" y="${top + 390}">Same block, same code, same</text>`);
  parts.push(`<text class="small" x="${X[2] + 4}" y="${top + 407}">answer on every machine, or</text>`);
  parts.push(`<text class="small" x="${X[2] + 4}" y="${top + 424}">the chain splits.</text>`);
  return svg(3 * COL + 2 * GAP + 16, H_ALL, parts);
}

// --- An authorizer -----------------------------------------------------------------------

/** The codec vector's work-package (vectors/codec/tiny/work_package.json), its permission slip. */
export const PACKAGE_AUTH = {
  auth_code_host: 305419896,
  auth_code_hash: "0x022e5e165cc8bd586404257f5cd6f5a31177b5c951eb076c7c10174f90006eef",
  authorizer_config: "0x00010203040506070809",
  authorization: "0x0102030405",
};

/** The package's implied authorizer, GP §14: H(code hash ⌢ config). */
export const authorizerHash = (codeHash: string, config: string): string =>
  toHex(H([...hexBytes(codeHash), ...hexBytes(config)]));

/** The storage trace's first report (block 2) and the pool it was checked against. */
export const TRACE_AUTH = {
  authorizer_hash: "0x2357426f2313559a271d6782dc00197b379f79cbe3c6a1e72f61f7b592c509f8",
  auth_gas_used: 22,
  auth_output: "0x",
  core: 1,
  pool_size: 8, // the pool: this hash, 8 times
  queue_size: 80, // the queue: this hash, 80 times
};

/**
 * Part 13's picture: an authorizer is a program and its settings, named by one hash. The
 * package carries the four parts; the guarantors run the code in-core; the chain checks
 * the hash against the core's pool and keeps the result in the report.
 */
export function authorizerAnatomy(): string {
  const parts: string[] = [];
  const W = 400, L = 16, R = 456;
  const hash = authorizerHash(PACKAGE_AUTH.auth_code_hash, PACKAGE_AUTH.authorizer_config);
  // the package's four fields
  parts.push(`<text class="title" x="${L}" y="24">In the work-package (lesson 3.1):</text>`);
  parts.push(...box("thing", L, 36, W, [
    "auth_code_host: 305419896",
    "the service whose preimages hold the authorizer's code",
  ]));
  parts.push(...box("code", L, 90, W, [
    `auth_code_hash: ${short(PACKAGE_AUTH.auth_code_hash)}`,
    "which code: a PVM program, 32 bytes name it",
  ]));
  parts.push(...box("code", L, 144, W, [
    `authorizer_config: ${PACKAGE_AUTH.authorizer_config}`,
    "the program's settings: 10 bytes here, any blob",
  ]));
  parts.push(...box("thing", L, 198, W, [
    `authorization: ${PACKAGE_AUTH.authorization}`,
    "the token: this package's case for using the core",
  ]));
  // the hash
  parts.push(...arrow(L + W, 90 + 23, R, 120));
  parts.push(...arrow(L + W, 144 + 23, R, 128));
  parts.push(`<text class="title" x="${R}" y="24">The authorizer's name:</text>`);
  parts.push(...box("chain", R, 100, 408, [
    "H(code hash ⌢ config)",
    `= ${short(hash)}`,
    "32 bytes. Other settings: another authorizer.",
  ]));
  // where it goes
  parts.push(`<text class="title" x="${L}" y="286">Who uses it, and where:</text>`);
  parts.push(...box("code", L, 298, W, [
    "In-core: the 3 guarantors run the code",
    "on the package and its token, in the PVM,",
    "with 50,000,000 gas on full. Out: a trace (a blob).",
    `The storage trace's report: ${TRACE_AUTH.auth_gas_used} gas used, trace 0x.`,
  ]));
  parts.push(...box("chain", R, 298, 408, [
    "On the chain, every validator (lesson 12.4):",
    `is the hash in core ${TRACE_AUTH.core}'s pool α? ${TRACE_AUTH.pool_size} hashes, else refused.`,
    "The pool moves one a block from the queue ϕ,",
    `${TRACE_AUTH.queue_size} hashes an assigner service put there (Part 13).`,
  ]));
  parts.push(...box("thing", L, 390, 848, [
    `In the work-report (lesson 3.3): authorizer_hash ${short(TRACE_AUTH.authorizer_hash)}, auth_gas_used ${TRACE_AUTH.auth_gas_used}, auth_output ${TRACE_AUTH.auth_output}`,
    "the storage trace's first report, block 2, core 1. The chain never sees the code or the token: only this.",
  ]));
  return svg(880, 450, parts);
}

// --- An assurance's bytes -------------------------------------------------------------------

/** The first assurance of vectors/stf/assurances/tiny/some_assurances-1.json. */
export const ASSURANCE = {
  anchor: "0xd61a38a0f73beda90e8c1dfba731f65003742539f4260694f44e22cabef24a8e",
  bitfield: "0x02",
  validator_index: 0,
  signature: "0xf23ddcfb8239e6b9fe943b085b5661b587d3cee9a5db2d3098ed69a1debc621ef17fc6960b39fb90a7e6675a1c7ad1c0eed37894f3ba240f918620a597075e0d",
};

const spacedEnds = (hex: string, n = 4): string => {
  const pairs = hex.replace(/^0x/, "").match(/../g) ?? [];
  return pairs.length <= 2 * n ? pairs.join(" ") : `${pairs.slice(0, n).join(" ")} … ${pairs.slice(-2).join(" ")}`;
};

/**
 * Part 11's picture: one assurance, 99 bytes on tiny, field by field: which block it
 * stands on, which cores the validator holds data for, who says so, and the signature.
 */
export function assuranceBytes(): string {
  const fields = [
    { name: "anchor", say: "the parent block's hash", bytes: spacedEnds(ASSURANCE.anchor), width: "32 bytes" },
    { name: "bitfield", say: "one bit per core: 0b10, core 1", bytes: spacedEnds(ASSURANCE.bitfield), width: "1 byte on tiny (2 cores), 43 on full" },
    { name: "validator_index", say: `validator ${ASSURANCE.validator_index}, as a u16`, bytes: "00 00", width: "2 bytes" },
    { name: "signature", say: "Ed25519, by that validator's key", bytes: spacedEnds(ASSURANCE.signature), width: "64 bytes" },
  ];
  const parts: string[] = [];
  const L = 16, W = 848;
  parts.push(`<text class="title" x="${L}" y="24">One assurance: "I hold my share of core 1's data", 99 bytes on tiny</text>`);
  let y = 40;
  for (const [i, f] of fields.entries()) {
    parts.push(`<rect class="${i % 2 ? "code" : "thing"}" x="${L}" y="${y}" width="${W}" height="54" rx="6"/>`);
    parts.push(`<text class="title" x="${L + 12}" y="${y + 21}">${escape(f.name)}</text>`);
    parts.push(`<text class="small" x="${L + 12}" y="${y + 41}">${escape(f.say)}</text>`);
    parts.push(`<text class="bytes" x="${L + 330}" y="${y + 21}">${escape(f.bytes)}</text>`);
    parts.push(`<text class="small" x="${L + 330}" y="${y + 41}">${escape(f.width)}</text>`);
    y += 62;
  }
  parts.push(`<text class="small" x="${L}" y="${y + 12}">32 + 1 + 2 + 64 = 99 bytes. Six of these in the block at slot 12, one per validator: five say core 0, so its report is</text>`);
  parts.push(`<text class="small" x="${L}" y="${y + 29}">available (more than two thirds of 6); four say core 1, not enough, so core 1's report waits.</text>`);
  return svg(880, y + 44, parts);
}

// --- A guarantee's parts --------------------------------------------------------------------

/** The guarantee of vectors/stf/reports/tiny/anchor_not_recent-1.json: its report's values. */
export const GUARANTEE = {
  slot: 14,
  signatures: [
    { validator_index: 1, signature: "0x933f1e97567ed03d0de25c216adc89b4a384425b39d71842ee87b8ff86aa1a2ce45d1a36e75c0d895c8c10521f41cf7548eb6e6fcbd65dbdc69f4a96a5956301" },
    { validator_index: 4, signature: "0x31387b7f2421ca26c5a7c5bf4b7d5e844cf2f92572a8bc0599a8f2d9da01ae13efea48667ecc188db9d2727f9d0f49404f59fd6b80e2a2fd605a273a0d3fbf0d" },
    { validator_index: 5, signature: "0xf097bb3a48fdef7cc9d3ca53730b54c67e2810fc8647b7dc2d0ad8a35b0ebe8ad4206ca86691ca9eeb9098571d102ed25dbb4831a329781d622f111153524e09" },
  ],
  report: {
    package_hash: "0x63c03371b9dad9f1c60473ec0326c970984e9c90c0b5ed90eba6ada471ba4d86",
    length: 17180,
    erasure_shards: 6,
    exports_count: 3,
    anchor_slot: 12,
    lookup_anchor_slot: 6,
    core_index: 0,
    authorizer_hash: "0x9a3a97d1950356ef6d3c20acb5ab6699be454b1498ecd513bdc6d849497e42eb",
    auth_gas_used: 0,
    result: { service_id: 42, accumulate_gas: 18012, ok_bytes: 12, gas_used: 821, imports: 8, extrinsic_count: 8, extrinsic_size: 1526, exports: 17 },
  },
};

/**
 * Part 12's picture: a guarantee is a work-report with a slot and two or three signatures
 * round it, and the report is the core's whole statement about one package.
 */
export function guaranteeParts(): string {
  const r = GUARANTEE.report, parts: string[] = [];
  const L = 16;
  parts.push(`<rect class="thing" x="${L}" y="8" width="848" height="512" rx="10"/>`);
  parts.push(`<text class="title" x="${L + 12}" y="30">a guarantee: "we three ran this package, and this is what came out"</text>`);
  // the report, inside
  parts.push(`<rect class="chain" x="${L + 12}" y="44" width="824" height="330" rx="8"/>`);
  parts.push(`<text class="title" x="${L + 24}" y="66">the work-report (lesson 3.3): what the core says about one package</text>`);
  const col = (x: number, y: number, lines: string[]) =>
    lines.map((l, i) => `<text class="${i === 0 ? "title" : "small"}" x="${x}" y="${y + i * 17}">${escape(l)}</text>`);
  parts.push(...box("thing", L + 24, 78, 390, [
    "package spec",
    `hash ${short(r.package_hash)}, ${r.length.toLocaleString("en-US")} bytes`,
    `erasure root, ${r.erasure_shards} shards; exports root, ${r.exports_count} exports`,
  ]));
  parts.push(...box("thing", L + 426, 78, 398, [
    "context: the chain as the package saw it",
    `anchor: a block at slot ${r.anchor_slot}, its state and belt roots`,
    `lookup anchor at slot ${r.lookup_anchor_slot}; no prerequisites`,
  ]));
  parts.push(...box("code", L + 24, 160, 390, [
    `core ${r.core_index}, authorizer ${short(r.authorizer_hash)}`,
    `auth_gas_used ${r.auth_gas_used}, auth_output 0x (the trace)`,
    "the gatekeeper that let it in, and what it said",
  ]));
  parts.push(...box("thing", L + 426, 160, 398, [
    "segment_root_lookup: []",
    "which earlier packages' exports it imported",
  ]));
  parts.push(...box("code", L + 24, 242, 800, [
    `results: one digest per work-item, here 1, for service ${r.result.service_id}`,
    `code hash, payload hash, accumulate_gas ${r.result.accumulate_gas.toLocaleString("en-US")}: what accumulate may spend on it`,
    `result: ok, ${r.result.ok_bytes} bytes: what refine produced, to hand to accumulate`,
    `refine_load: ${r.result.gas_used} gas, ${r.result.imports} imports, ${r.result.extrinsic_count} extrinsics of ${r.result.extrinsic_size.toLocaleString("en-US")} bytes, ${r.result.exports} exports: what refining cost the core`,
  ]));
  parts.push(...col(L + 24, 352, ["", "not in a report: the payloads, the code, the package itself. Those reach the validators as erasure-coded shards."]).slice(1));
  // slot and signatures
  parts.push(...box("thing", L + 12, 386, 200, [`slot ${GUARANTEE.slot}`, "when the guarantors signed"]));
  parts.push(...box("code", L + 224, 386, 612, [
    "signatures: 2 or 3 of the core's guarantors, by validator index",
    ...GUARANTEE.signatures.map((s) => `validator ${s.validator_index}: ${short(s.signature)} (Ed25519, 64 bytes)`),
  ]));
  parts.push(`<text class="small" x="${L + 12}" y="492">The chain checks the signers and signatures (Part 12) and the authorizer (Part 13).</text>`);
  parts.push(`<text class="small" x="${L + 12}" y="509">It never re-runs the work: auditors do, off the chain.</text>`);
  return svg(880, 528, parts);
}

// --- A service account's parts ---------------------------------------------------------------

/**
 * Part 14's picture: a service account is one record in the state and three bags of
 * entries beside it, each under its own kind of key. Service 0 of the vectors' state.
 */
export function serviceAccountParts(): string {
  const parts: string[] = [];
  const L = 16;
  parts.push(`<rect class="place" x="${L}" y="8" width="848" height="416" rx="10"/>`);
  parts.push(`<text class="title" x="${L + 12}" y="30">service 0's account, in the state (Part 14): a record and three bags of entries</text>`);
  parts.push(...box("chain", L + 12, 44, 400, [
    "the record, C(255, 0): 89 bytes",
    "code_hash: which preimage is my code",
    "balance: what I hold",
    "min_item_gas, min_memo_gas: the least gas I accept",
    "bytes, items: my footprint (the deposit it costs)",
    "deposit_offset: my free allowance",
    "creation_slot, last_accumulation_slot",
    "parent_service: who created me",
  ]));
  parts.push(...box("thing", L + 424, 44, 412, [
    "storage: my key-value store",
    "one entry per key k, at C(0, ℰ₄(2³² − 1) ⌢ k) (19.3);",
    "read and write by host call (16.5)",
    "service 0 here: nothing stored",
  ]));
  parts.push(...box("code", L + 424, 139, 412, [
    "preimages: blobs filed under their hash",
    "one entry per hash h, at C(0, ℰ₄(2³² − 2) ⌢ h);",
    "my code is one of them: 159,322 bytes (15.1, 16.8)",
  ]));
  parts.push(...box("thing", L + 424, 217, 412, [
    "requests: what I asked for, by hash and length",
    "one entry per (h, z), at C(0, ℰ₄(z) ⌢ h): a history of slots",
    "solicit asks (16.9); a block's preimages answer (14.1)",
  ]));
  parts.push(`<text class="small" x="${L + 12}" y="206">Footprint: 4 items, 159,534 bytes: 2 preimages</text>`);
  parts.push(`<text class="small" x="${L + 12}" y="223">and their 2 requests, nothing in storage. Balance</text>`);
  parts.push(`<text class="small" x="${L + 12}" y="240">must stay ≥ 100 + 10 × items + bytes, less the offset.</text>`);
  parts.push(...box("code", L + 12, 296, 824, [
    "Who changes it: its own accumulate code, by host calls, on every validator (Parts 16, 17);",
    "and a block's preimages extrinsic, filling a request (14.1). Refine, in-core, can only read (historical_lookup).",
    "No private key owns this account, and no transaction moves its balance. Its code does, or nothing does.",
  ]));
  parts.push(`<text class="small" x="${L + 12}" y="400">The state root covers every byte of all of this, so one wrong count in a record refuses a good block (Part 19).</text>`);
  return svg(880, 432, parts);
}

// --- Reading a definition ------------------------------------------------------------------

/**
 * The appendix "Reading the Gray Paper": the shape every definition in the paper takes,
 * on ℰ₂, the two-byte encoding of lesson 2.1, worked on 4,807. The name, the type line
 * (read it first), the body, and the same body on a real value.
 */
export function readingADefinition(): string {
  const parts: string[] = [];
  const LEFT = 16, CALL = 452, W = 412;
  const rows: [string, string, string[]][] = [
    ["ℰ₂ :", "thing", ["The name", "what is being defined; the subscript is a", "parameter: 2 bytes"]],
    ["N₆₅₅₃₆ → B₂", "chain", ["The type line: read it first", "what goes in → what comes out: a number below", "65,536 in, exactly two bytes out"]],
    ["x ↦ [x mod 256] ⌢ ℰ₁(⌊x / 256⌋)", "code", ["The body", "what x becomes; with cases, one per line,", "and the first whose condition holds applies"]],
    ["4,807 ↦ [199] ⌢ ℰ₁(18) = [199, 18]", "thing", ["Work it on a value", "4,807 = 18 × 256 + 199, so the bytes are", "c7 12: lesson 2.1's first vector"]],
  ];
  const ROW = 76, TOP = 18;
  rows.forEach(([formula, kind, lines], i) => {
    const y = TOP + i * ROW;
    const h = boxHeight(lines.length);
    parts.push(`<text x="${LEFT}" y="${y + h / 2 + 6}" font-size="18">${escape(formula)}</text>`);
    parts.push(...arrow(CALL - 60, y + h / 2, CALL - 4, y + h / 2));
    parts.push(...box(kind, CALL, y, W, lines));
  });
  return svg(880, TOP + rows.length * ROW, parts);
}
