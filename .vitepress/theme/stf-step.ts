// The start page's At a glance: σ′ ≡ Υ(σ, B) on a real chain, one block at a time. Each step is a
// block of the storage trace: the state it found (σ, by its root), the block (B), and the
// state it left (σ′), which is the next block's σ. tools/widget-stf-step.test.ts checks it.

import { TRANSITIONS } from "./stf-trace.ts";

export { TRANSITIONS };

/** A hash shortened as the lessons write them: "0x48dc323d…". */
export const short = (hex: string): string => `${hex.slice(0, 10)}…`;

const PARTS = ["ticket", "preimage", "report", "assurance", "dispute"];

/** What a block brings, in words: "1 report and 4 assurances", or "nothing but its header". */
export function carries(counts: number[]): string {
  const said = counts.flatMap((n, i) => (n ? [`${n} ${PARTS[i]}${n === 1 ? "" : "s"}`] : []));
  if (!said.length) return "nothing but its header";
  return said.length === 1 ? said[0] : `${said.slice(0, -1).join(", ")} and ${said.at(-1)}`;
}

/** One step in a sentence. */
export function says(i: number): string {
  const [slot, author, , , , counts] = TRANSITIONS[i];
  return `Block for slot ${slot}, made by validator ${author}, carrying ${carries(counts)}. Υ applies the rules, and the state changes: a new root.`;
}
