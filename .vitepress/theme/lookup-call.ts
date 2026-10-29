// Lesson 16.8's widget: lookup (Ω_L) answering three questions at once — whose preimages
// (φ₇), which one (the hash at φ₈), which slice (to φ₉, from φ₁₀, at most φ₁₁). The
// accounts are real: service 0 keeping the lesson's test's "hello, JAM", and service 1729
// from the lookup_foreign_preimage vector, whose 8-byte blob spells "preimage". The window
// clamps as fetch's does (f = min(φ₁₀, |v|), l = min(φ₁₁, |v| − f)), φ₇ becomes the full
// length, and the gas is 600 + ⌈248 · φ₁₁ / 1024⌉, charged before the hash is even read —
// NONE and panic pay it too. tools/widget-lookup-call.test.ts checks every value against
// the lesson's code, tests and check questions, and the vector.

export const NONE = "NONE"; // 2^64 − 1 as the register answer
export const BUDGET = 10_000;

/** A preimage the widget knows: its hash, its bytes (or just a length, for a big one). */
export type Preimage = { hash: string; says: string; bytes: number[] };

/** "hello, JAM", the lesson's test's preimage, and its blake2b256 hash. */
export const HELLO: Preimage = {
  hash: "0x0ad87f82460fdf6616935f120783b0056d61eecf17e4a3878a5ac4665c24c715",
  says: '"hello, JAM"\'s hash (service 0 keeps it)',
  bytes: [104, 101, 108, 108, 111, 44, 32, 74, 65, 77],
};

/** Service 1729's 8-byte blob from the lookup_foreign_preimage vector: ASCII "preimage". */
export const FOREIGN: Preimage = {
  hash: "0x943e3d42cf248c99fa6346c24b66741090bd2c78f9ff691c5fd7a88ef51d27e2",
  says: "0x943e3d42…'s hash (service 1729 keeps it)",
  bytes: [0x70, 0x72, 0x65, 0x69, 0x6d, 0x61, 0x67, 0x65],
};

/** "nobody provided this": the test's hash with no preimage behind it, anywhere. */
export const NOBODY: Preimage = {
  hash: "0x5d8edf43bb5d497f24d038bf4c7d5ece4407dc13eb13a0c98e3180bb99631a96",
  says: '"nobody provided this"\'s hash (nobody keeps it)',
  bytes: [],
};

export const HASHES: Preimage[] = [HELLO, FOREIGN, NOBODY];

/** Whose preimages φ₇ can name here. 2^64 − 1 means "my own", like lasair's −1. */
export const WHOSE: { phi7: string; says: string; account: number | null }[] = [
  { phi7: "2^64 − 1", says: "2^64 − 1: my own", account: 0 },
  { phi7: "0", says: "0: my own id, the long way", account: 0 },
  { phi7: "1729", says: "1729: another service's", account: 1729 },
  { phi7: "42", says: "42: a service that isn't there", account: null },
];

/** Which account keeps which preimage, as the test and the vector have it. */
const KEEPS: Record<number, string[]> = { 0: [HELLO.hash], 1729: [FOREIGN.hash] };

export type Call = { whose: number; hash: number; from: number; atMost: number; readable: boolean };
export type Answer = { gas: number; exit: "continue" | "panic"; r7: string; f: number; l: number; landed: number[] };

/** The gas lookup charges, before anything else: 600, plus 248 per KiB asked for. */
export const gasFor = (atMost: number): number => 600 + Math.ceil((248 * atMost) / 1024);

/** lookup, as src/host.ts runs it: charge, read the hash (or panic), find the account, copy out. */
export function call(c: Call): Answer {
  const gas = gasFor(c.atMost);
  if (!c.readable) return { gas, exit: "panic", r7: "—", f: 0, l: 0, landed: [] }; // the hash isn't readable
  const account = WHOSE[c.whose].account;
  const wanted = HASHES[c.hash];
  const found = account !== null && KEEPS[account]?.includes(wanted.hash) ? wanted.bytes : null;
  if (found === null) return { gas, exit: "continue", r7: NONE, f: 0, l: 0, landed: [] };
  const f = Math.min(c.from, found.length);
  const l = Math.min(c.atMost, found.length - f);
  return { gas, exit: "continue", r7: String(found.length), f, l, landed: found.slice(f, f + l) };
}
