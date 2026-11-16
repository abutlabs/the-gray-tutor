// Lesson 21.2's widget: which of a node's blocks is best (GP §19), on lesson 21.1's real
// tree. A candidate follows the final block (19.1) and has no ancestor since the final
// block that shares its slot with another block (19.3). Of the candidates, the most
// ticket-sealed ancestors wins (19.4); these five were all sealed by fallback keys, so m
// ties at 0 and the lesson's own tie-break decides: the most ancestors, then the lower
// hash. tools/widget-best-block.test.ts checks the rules against the lesson's code.

import { ancestors, BLOCKS, GENESIS } from "./block-tree.ts";
import type { Piece } from "./block-tree.ts";

/** The tree of the lesson's tests: genesis, block 1, both blocks at slot 2, and block 3′.
 *  (Block 3 is left out: it shares slot 3 with block 3′, a second equivocation.) */
export const TREE: Piece[] = [GENESIS, ...BLOCKS.filter((b) => b.id !== "b3")];
/** The blocks the reader may make final. */
export const FINALS = ["g", "b1", "b2", "b2x"];

const byId = (id: string) => TREE.find((b) => b.id === id)!;

/** Why a block is not a candidate, or null if it is one. */
export function ruledOut(final: string, id: string): string | null {
  const line = ancestors(TREE, byId(id).hash);
  const settled = new Set(ancestors(TREE, byId(final).hash).map((b) => b.hash));
  if (!line.some((b) => b.id === final)) {
    const before = settled.has(byId(id).hash);
    return `(19.1): it ${before ? "comes before" : "doesn't follow"} the final block, ${byId(final).label}`;
  }
  for (const a of line.filter((b) => !settled.has(b.hash))) {
    const other = TREE.find((b) => b.hash !== a.hash && b.slot === a.slot);
    if (other) return `(19.3): ${a.label} and ${other.label} are both at slot ${a.slot}`;
  }
  return null;
}

/** The best block: of the candidates, the most ancestors (m ties at 0), then the lower hash. */
export function best(final: string): Piece {
  let pick = byId(final);
  for (const b of TREE) {
    if (ruledOut(final, b.id)) continue;
    const length = ancestors(TREE, b.hash).length, bestLength = ancestors(TREE, pick.hash).length;
    if (length !== bestLength ? length > bestLength : b.hash < pick.hash) pick = b;
  }
  return pick;
}
