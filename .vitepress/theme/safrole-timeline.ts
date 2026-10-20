// Part 8's big picture: Safrole's cycle on real blocks. The safrole trace's 100 tiny blocks
// by epoch: the tickets each block enters, the lottery filling (12 to win) and closing at
// phase Y = 10, the header's marks, and each epoch sealed by the last epoch's winners or by
// the fallback. tools/widget-safrole-timeline.test.ts checks it against the trace.

import { BLOCKS, type Block } from "./safrole-trace.ts";

export const E = 12; // slots an epoch, on tiny
export const Y = 10; // the phase the lottery closes at
export const WIN = 12; // tickets that win: one a slot of the next epoch

export interface Slot {
  slot: number; epoch: number; phase: number; author: number; tickets: number;
  epochMark: boolean; ticketsMark: boolean; byTickets: boolean; held: number;
}
export const SLOTS: Slot[] = BLOCKS.map(([slot, author, tickets, em, tm, mode, held]: Block) => ({
  slot, epoch: Math.floor(slot / E), phase: slot % E, author, tickets,
  epochMark: em === 1, ticketsMark: tm === 1, byTickets: mode === 0, held,
}));

/** The trace's epochs, each with its slots (epoch 0 starts at slot 1: the genesis block is 0). */
export const EPOCHS: { epoch: number; slots: Slot[] }[] = [...new Set(SLOTS.map((s) => s.epoch))]
  .map((epoch) => ({ epoch, slots: SLOTS.filter((s) => s.epoch === epoch) }));

/** An epoch's story in a few words: how it's sealed, and how its own lottery ends. */
export function epochSays(epoch: number): string {
  const slots = EPOCHS.find((e) => e.epoch === epoch)!.slots;
  const sealed = slots[0].byTickets ? "sealed by the last epoch's winners" : "sealed by the fallback";
  const last = slots.at(-1)!;
  const filled = slots.find((s) => s.held >= WIN);
  const lottery = filled ? `its lottery fills at slot ${filled.slot}` : last.phase === E - 1 ? `its lottery ends with ${last.held} of ${WIN}` : `${last.held} tickets so far`;
  return `${sealed}; ${lottery}`;
}

/** One block in plain words. */
export function slotSays(s: Slot): string {
  const parts = [`Slot ${s.slot}, epoch ${s.epoch}, phase ${s.phase}. Validator ${s.author} makes the block, sealed ${s.byTickets ? "as the holder of this slot's winning ticket" : "as the fallback's pick for this slot"}.`];
  if (s.epochMark) parts.push("A new epoch begins: its slots get their sealers, everyone moves one place along, and the header's epoch mark announces the validators and randomness to come.");
  if (s.tickets) parts.push(`It enters ${s.tickets} ticket${s.tickets === 1 ? "" : "s"} in the lottery for the next epoch: ${s.held} held.`);
  else if (s.phase < Y) parts.push(`No tickets in this block; the lottery holds ${s.held}.`);
  if (s.phase >= Y && !s.ticketsMark) parts.push(`The lottery is closed (phase ${Y} on): ${s.held >= WIN ? "the winners are set" : `${s.held} of ${WIN}, too few, so the next epoch falls back`}.`);
  if (s.ticketsMark) parts.push(`The lottery has closed with ${s.held} tickets: the header's tickets mark announces the winners, one a slot of the next epoch.`);
  return parts.join(" ");
}
