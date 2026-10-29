// Lesson 9.1's widget: a Merkle mountain belt (Gray Paper, Appendix E), appended to one item
// at a time. Appending carries the item up from place 0, merging with every peak it meets,
// until it rests in an empty place: adding 1 in binary — except that each "digit" is a real
// 32-byte Keccak hash, computed live. The items are bin/belt.ts's own (item i is Keccak-256
// of the byte i), so every peak and super-peak here matches what `npm run belt` prints.
// tools/widget-belt-verdicts.test.ts checks it against the lesson's own values.

import { keccak_256 } from "@noble/hashes/sha3.js";
import { fromHex, superPeakSteps, toHex } from "./super-peak.ts";

/** A belt: peak i is the root of a mountain of 2^i items, or null (∅) if there's none. */
export type Belt<T> = (T | null)[];

/** One place the carry visits: a peak there to merge with, or an empty place to rest in. */
export type Step<T> =
  | { place: number; action: "merge"; peak: T; carried: T; merged: T }
  | { place: number; action: "rest"; carried: T; newPlace: boolean };

/**
 * A (GP App. E) one place at a time, as lesson 9.1's appendToBelt runs it: the steps the
 * carry takes, and the belt after. `merge(peak, carried)` is H(peak ⌢ carried).
 */
export function appendSteps<T>(belt: Belt<T>, item: T, merge: (peak: T, carried: T) => T): { steps: Step<T>[]; belt: Belt<T> } {
  const peaks = [...belt];
  const steps: Step<T>[] = [];
  let carried = item;
  for (let place = 0; place < peaks.length; place++) {
    const peak = peaks[place];
    if (peak === null) {
      peaks[place] = carried; // an empty place: the mountain rests here
      steps.push({ place, action: "rest", carried, newPlace: false });
      return { steps, belt: peaks };
    }
    const merged = merge(peak, carried); // two mountains of 2^place make one of 2^(place+1)
    steps.push({ place, action: "merge", peak, carried, merged });
    peaks[place] = null;
    carried = merged;
  }
  steps.push({ place: peaks.length, action: "rest", carried, newPlace: true }); // a new, biggest mountain
  peaks.push(carried);
  return { steps, belt: peaks };
}

/** The belt after the carry's first `taken` steps: merged places empty, nothing rested yet. */
export function beltPartway<T>(belt: Belt<T>, steps: Step<T>[], taken: number): Belt<T> {
  const peaks = [...belt];
  for (const step of steps.slice(0, taken)) {
    if (step.action === "merge") peaks[step.place] = null;
    else if (step.newPlace) peaks.push(step.carried);
    else peaks[step.place] = step.carried;
  }
  return peaks;
}

/** A mountain in the widget: items first to last (counting from 1), and its real 32-byte peak. */
export type Mountain = { first: number; last: number; hash: string };

/** A mountain's label: "5" for one item, "1–4" for items 1 to 4. */
export const label = (m: Mountain): string => (m.first === m.last ? `${m.first}` : `${m.first}–${m.last}`);

/** The first 4 of a peak's 32 bytes, for a narrow box: "0x3ef0aafe…". */
export const shortHash = (m: Mountain): string => `${m.hash.slice(0, 10)}…`;

/** Item i as bin/belt.ts makes it: Keccak-256 of the one byte i — any 32 bytes will do. */
export const itemMountain = (i: number): Mountain => ({ first: i, last: i, hash: toHex(keccak_256(new Uint8Array([i]))) });

/** H(peak ⌢ carried): real Keccak-256 over the two 32-byte peaks, 64 bytes in, 32 out. */
export const mergeMountains = (peak: Mountain, carried: Mountain): Mountain => ({
  first: peak.first,
  last: carried.last,
  hash: toHex(keccak_256(new Uint8Array([...fromHex(peak.hash), ...fromHex(carried.hash)]))),
});

/** The belt of items 1 to n, appended one at a time. */
export function beltOf(n: number): Belt<Mountain> {
  let belt: Belt<Mountain> = [];
  for (let item = 1; item <= n; item++) belt = appendSteps(belt, itemMountain(item), mergeMountains).belt;
  return belt;
}

/** M_R of the widget's belt, with super-peak.ts's live fold: what bin/belt.ts prints per line. */
export const beltSuperPeak = (belt: Belt<Mountain>): string => superPeakSteps(belt.map((p) => (p === null ? null : p.hash))).root;

/** How many items a belt holds: 2^i for each place i holding a peak. */
export const itemsIn = <T>(belt: Belt<T>): number => belt.reduce((n: number, peak, i) => (peak === null ? n : n + 2 ** i), 0);

/** How many peaks a belt has: the places that aren't ∅. */
export const peaksIn = <T>(belt: Belt<T>): number => belt.filter((peak) => peak !== null).length;
