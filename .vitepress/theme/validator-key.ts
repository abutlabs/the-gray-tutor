// Lesson 6.3's widget: κ, this epoch's validators, as the state holds it: a count byte,
// then six validator keys of 336 bytes, each four parts in a fixed order (Bandersnatch 32,
// Ed25519 32, BLS 144, metadata 128). The record's field order is the byte order: swap two
// fields and every key reads the wrong bytes. tools/widget-validator-key.test.ts checks the
// layout against lesson 6.3's codec and check questions, and the keys against the vectors.

import { VALIDATORS } from "./header-map.ts";

/** The four parts of a validator key, in the order lesson 6.3's record writes them. */
export type Part = { name: "bandersnatch" | "ed25519" | "bls" | "metadata"; width: number; job: string };
export const PARTS: Part[] = [
  { name: "bandersnatch", width: 32, job: "seals blocks and enters the ticket lottery (Part 8)" },
  { name: "ed25519", width: 32, job: "signs everything else: assurances, guarantees, votes" },
  { name: "bls", width: 144, job: "signatures that can be combined into one, for bridges" },
  { name: "metadata", width: 128, job: "opaque to the Gray Paper: where to reach the validator, say" },
];
/** One key's size, and κ's on tiny: a count byte, then six keys. */
export const KEY_BYTES = PARTS.reduce((n, p) => n + p.width, 0);
export const VALIDATOR_COUNT = 6;
export const KAPPA_BYTES = 1 + VALIDATOR_COUNT * KEY_BYTES;

/** Where a part sits inside its 336 bytes, under a given field order. */
export function rangeOf(order: Part[], name: Part["name"]): { start: number; end: number } {
  let at = 0;
  for (const p of order) { if (p.name === name) return { start: at, end: at + p.width }; at += p.width; }
  throw new Error(`no part ${name}`);
}
/** Where validator i's key starts inside κ: after the count byte and i keys. */
export const keyStart = (i: number): number => 1 + i * KEY_BYTES;
/** The same order with Bandersnatch and Ed25519 swapped: the lasair box's experiment. Looked
 *  up by name, not by position, so swapping twice puts the fields back. */
export const swapped = (order: Part[]): Part[] => {
  const byName = (name: Part["name"]) => order.find((p) => p.name === name)!;
  return order.map((p) => (p.name === "bandersnatch" ? byName("ed25519") : p.name === "ed25519" ? byName("bandersnatch") : p));
};

/** The six validators' Bandersnatch and Ed25519 keys: the vectors' one cast (header-map.ts). */
export const KEYS: { bandersnatch: string; ed25519: string }[] = VALIDATORS.map(([bandersnatch, ed25519]) => ({ bandersnatch, ed25519 }));
/** What a reader of the bytes gets for a part, under an order: the real key when the bytes
 *  are that key's, "the Ed25519 key's bytes" when a swap put another key there. */
export function readsAs(order: Part[], i: number, name: Part["name"]): string {
  const { start } = rangeOf(order, name);
  const truly = PARTS.find((p) => rangeOf(PARTS, p.name).start === start)!; // whose bytes really sit there
  if (truly.name === "bandersnatch" || truly.name === "ed25519") return `${KEYS[i][truly.name].slice(0, 10)}…`;
  return `${truly.width} bytes`;
}
