// Lesson 9.1's second widget: the super-peak M_R, folded live. The belts are the four tiny
// history vectors' (1, 2, 8 and 9 items), and the page runs real Keccak-256 (@noble/hashes,
// already here for the client's own keccak256): none gives 32 zero bytes, one gives itself,
// and more fold left to right, acc = H("peak" ⌢ acc ⌢ next), 4 + 32 + 32 bytes a step. The
// answer must equal the vector's beefy_root. tools/widget-super-peak.test.ts checks the
// belts and roots against the vectors and the fold against the lesson's superPeak.

import { keccak_256 } from "@noble/hashes/sha3.js";

export const PEAK_LABEL = "peak"; // the $peak marker: the four ASCII letters, without the $

/** A history vector's belt after its block, and the super-peak its newest entry promises. */
export type VectorBelt = { says: string; items: number; peaks: (string | null)[]; beefy: string };

/** The tiny history vectors' belts (progress_blocks_history 1 to 4), plus the empty belt. */
export const BELTS: VectorBelt[] = [
  { says: "no items", items: 0, peaks: [], beefy: "0x0000000000000000000000000000000000000000000000000000000000000000" },
  {
    says: "1 item",
    items: 1,
    peaks: ["0x8720b97ddd6acc0f6eb66e095524038675a4e4067adc10ec39939eaefc47d842"],
    beefy: "0x8720b97ddd6acc0f6eb66e095524038675a4e4067adc10ec39939eaefc47d842",
  },
  {
    says: "2 items",
    items: 2,
    peaks: [null, "0x7076c31882a5953e097aef8378969945e72807c4705e53a0c5aacc9176f0d56b"],
    beefy: "0x7076c31882a5953e097aef8378969945e72807c4705e53a0c5aacc9176f0d56b",
  },
  {
    says: "8 items",
    items: 8,
    peaks: [null, null, null, "0x658b919f734bd39262c10589aa1afc657471d902a6a361c044f78de17d660bc6"],
    beefy: "0x658b919f734bd39262c10589aa1afc657471d902a6a361c044f78de17d660bc6",
  },
  {
    says: "9 items",
    items: 9,
    peaks: ["0xa983417440b618f29ed0b7fa65212fce2d363cb2b2c18871a05c4f67217290b0", null, null, "0x658b919f734bd39262c10589aa1afc657471d902a6a361c044f78de17d660bc6"],
    beefy: "0xebdb6db060afceaa2a99a499a84476847444ffc3787f6a4786e713f5362dbf4d",
  },
];

export const toHex = (b: Uint8Array): string => `0x${Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("")}`;
export const fromHex = (h: string): Uint8Array => Uint8Array.from(h.slice(2).match(/../g)!.map((b) => parseInt(b, 16)));

/** One merge of the fold: the place the next peak came from, and H("peak" ⌢ acc ⌢ next). */
export type FoldStep = { place: number; acc: string; next: string; hash: string };

/**
 * M_R, one step at a time: the peaks that exist, in belt order (smallest mountain first),
 * folded left to right. `places` are their belt places — ∅ places are skipped, so peak i
 * of the fold is the i-th existing peak, not the peak of place i.
 */
export function superPeakSteps(peaks: (string | null)[]): { there: string[]; places: number[]; steps: FoldStep[]; root: string } {
  const indexed = peaks.flatMap((p, i) => (p === null ? [] : [{ p, i }]));
  const there = indexed.map((x) => x.p);
  const places = indexed.map((x) => x.i);
  if (there.length === 0) return { there, places, steps: [], root: toHex(new Uint8Array(32)) };
  const label = new TextEncoder().encode(PEAK_LABEL);
  let acc = there[0];
  const steps: FoldStep[] = [];
  for (const { p: next, i: place } of indexed.slice(1)) {
    const hash = toHex(keccak_256(new Uint8Array([...label, ...fromHex(acc), ...fromHex(next)])));
    steps.push({ place, acc, next, hash });
    acc = hash;
  }
  return { there, places, steps, root: acc };
}
