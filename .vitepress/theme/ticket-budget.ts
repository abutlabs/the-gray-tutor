// Lesson 8.7's second widget: the four numbers that bound an epoch's tickets, and the two
// that both read as "max tickets". Each validator may make n = ⌈2E / |γ′_P|⌉; a block may
// carry at most K; the lottery keeps the lowest E and shuts at phase Y. Stepping blocks
// shows the supply V × n flowing through the K-wide pipe into the pool — and that on full,
// K = 16 never pinches: 2,046 tickets fit in 500 blocks of 16 five times over.
// tools/widget-ticket-budget.test.ts checks every number against the lesson and config.ts.

import { attemptsAllowed } from "./ticket-rules.ts";

/** The constants of one size of JAM, as lesson 8.7 names them. */
export type Budget = {
  name: "tiny" | "full";
  V: number; // validators, |γ′_P|
  E: number; // epoch length: the lottery keeps the lowest E
  Y: number; // the phase the lottery shuts at: Y blocks may bring tickets
  K: number; // tickets one block may carry
  n: number; // tickets one validator may make, ⌈2E / V⌉
};

const budget = (name: "tiny" | "full", V: number, E: number, Y: number, K: number): Budget => ({ name, V, E, Y, K, n: attemptsAllowed(V, E) });

export const TINY: Budget = budget("tiny", 6, 12, 10, 3);
export const FULL: Budget = budget("full", 1023, 600, 500, 16);

/** The epoch's whole supply: every validator using every attempt. */
export const supply = (b: Budget): number => b.V * b.n;

/** The room the open slots offer: K a block, for the Y blocks before the door shuts. */
export const room = (b: Budget): number => b.Y * b.K;

/** After `blocks` full blocks of tickets: how many came in, and how many the pool holds. */
export function afterBlocks(b: Budget, blocks: number): { entered: number; pool: number; dropped: number } {
  const entered = Math.min(blocks * b.K, supply(b));
  const pool = Math.min(entered, b.E);
  return { entered, pool, dropped: entered - pool };
}

/** The two "max tickets", side by side: the sentence the widget leads with. */
export function theTrap(b: Budget): string {
  return `two different "max tickets": n = ${b.n} is what one validator may make for the epoch; K = ${b.K} is what one block may carry`;
}

/** What the pipe's width means at this size, in a sentence. */
export function pipeSays(b: Budget): string {
  const s = supply(b).toLocaleString("en-US");
  const r = room(b).toLocaleString("en-US");
  return b.name === "tiny"
    ? `supply ${s}, room ${r}: even tiny's narrow pipe fits the supply with room over`
    : `supply ${s}, room ${r}: K never pinches; it only keeps one block from bloating with 784-byte proofs`;
}
