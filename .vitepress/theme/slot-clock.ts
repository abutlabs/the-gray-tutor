// Lesson 21.3's widget: a block is valid only once its slot has begun (GP 5.8,
// H_T · P ≤ 𝒯). Three blocks, for slots 1, 2 and 3, have arrived at second 0; the reader
// moves the clock. tools/widget-slot-clock.test.ts checks the rule against the lesson's.

export const SLOT_SECONDS = 6; // P
export const SLOTS = [1, 2, 3];
export const LAST_SECOND = 20;

/** The slot a second falls in: whole slots since the clock started. */
export const slotAt = (second: number): number => Math.floor(second / SLOT_SECONDS);
/** The second a slot begins: H_T · P. */
export const slotStart = (slot: number): number => slot * SLOT_SECONDS;

/** What the node does with a block for `slot` when its clock reads `second`. */
export function status(second: number, slot: number): { held: boolean; says: string } {
  if (slot > slotAt(second)) {
    const wait = slotStart(slot) - second;
    return { held: true, says: `held: slot ${slot} begins at second ${slotStart(slot)}, in ${wait} s` };
  }
  return { held: false, says: `in the tree: ${slot} × 6 = ${slotStart(slot)} ≤ ${second}` };
}
