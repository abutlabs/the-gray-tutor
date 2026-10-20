// Lesson 5.2's hash tree: the extrinsic hash as a tree over lesson 5.2's made-up block
// (extrinsic-hash.ts), every hash real. The root over five part hashes; under the
// guarantees part, each report's row (its hash, slot, signatures), and under each row the
// report. Proving report 1 colours each box: handed over, worked out by the checker, or
// never shown. tools/widget-hashes.test.ts checks it against the widget's own proof.

import { BLOCK, checkProof, extrinsicHash, extrinsicSize, partHashes, PARTS, proofOf, proofSize } from "./extrinsic-hash.ts";
import { H } from "./hash.ts";

/** How a box takes part in proving report 1. */
export type Role = "given" | "worked out" | "hidden";

export interface Box { id: string; label: string; value: string; role: Role }

const short = (b: number[]) => `${b.slice(0, 3).map((x) => x.toString(16).padStart(2, "0")).join("")}…`;
const hashes = partHashes(BLOCK);
const proof = proofOf(BLOCK, 0);
export const CHECK = checkProof(proof, extrinsicHash(BLOCK));

/** The root, and the header field it must equal. */
export const ROOT: Box = { id: "root", label: "extrinsic hash", value: short(extrinsicHash(BLOCK)), role: "worked out" };

/** The five part hashes: report 1's part is worked out, the other four handed over. */
export const PART_HASHES: Box[] = PARTS.map((p, i) => ({
  id: `h-${p}`, label: `H(${p})`, value: short(hashes[i]), role: p === "guarantees" ? "worked out" : "given",
}));

/** What each part holds: only the guarantees part is handed over. */
const CONTENTS: Record<string, string> = {
  tickets: `${BLOCK.tickets.length} tickets`, preimages: `${BLOCK.preimages.length} preimage`,
  assurances: `${BLOCK.assurances.length} assurances`, disputes: "no disputes",
};
export const PART_BODIES: Box[] = PARTS.map((p) => (p === "guarantees"
  ? { id: "guarantees", label: "the guarantees part", value: `${BLOCK.guarantees.length} rows`, role: "given" as Role }
  : { id: p, label: p, value: CONTENTS[p], role: "hidden" as Role }));

/** The guarantees part's rows: report 1's hash is worked out from report 1; report 2's is
 *  handed over as it is, 32 bytes, in place of the report. */
export const ROWS: Box[] = BLOCK.guarantees.map((g, i) => ({
  id: `row-${i + 1}`,
  label: `H(report ${i + 1}), slot ${g.slot}, ${g.signatures.length} signatures`,
  value: short(H(g.report)),
  role: i === 0 ? "worked out" : "given",
}));

/** The reports themselves: report 1 handed over whole, report 2 never shown. */
export const REPORTS: Box[] = BLOCK.guarantees.map((g, i) => ({
  id: `report-${i + 1}`, label: `report ${i + 1}`, value: String.fromCharCode(...g.report), role: i === 0 ? "given" : "hidden",
}));

/** How much of the block the proof shows. */
export const SHOWN = { proof: proofSize(proof), block: extrinsicSize(BLOCK) };
