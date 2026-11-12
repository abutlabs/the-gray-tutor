// Lesson 6.3's opening widget: the Gray Paper's (D.2), the state serialization T(σ), as a
// table to open. One real state, the one before block 12 of the tiny safrole trace (the one
// the lesson's own run reads): sixteen components and service 0's account, each row with its
// 31-byte key, what (D.2) stores under it in plain words, and its real bytes. The three rows
// the lesson reads, τ, η and κ, open all the way, part by part.
// tools/widget-state-rows.test.ts checks the names against lesson 6.2's, the values against
// the lesson's run, and every size and byte against the trace where vectors/ is downloaded.

import { COMPONENTS } from "./state-keys.ts";
import { KEY_BYTES as VALIDATOR_KEY_BYTES, KEYS } from "./validator-key.ts";

/** The trace file the state is read from, under vectors/. */
export const TRACE = "traces/safrole/00000012.json";
/** How many entries that state has: 16 components, the account, and 4 things service 0 keeps. */
export const ENTRIES = 21;

/** A line of a value's breakdown: some of its bytes, and what they are. */
export type Piece = { bytes: string; what: string };

export interface Row {
  /** 1 to 16 for a component, 255 for service 0's account. */
  i: number;
  /** "C(11)", "C(255, 0)". */
  key: string;
  /** The key's first byte in hex, and what follows it. */
  keyBytes: string;
  keySays: string;
  /** Its Gray Paper letter and its name, as lesson 6.2's table has them. */
  letter: string;
  name: string;
  /** (D.2)'s right-hand side for this row, in plain words. */
  says: string;
  /** Its value in this state: how many bytes, how it starts, and how the size adds up. */
  size: number;
  starts: string;
  adds: string;
  /** Where the tutorial builds it: a Part's number and folder, or this lesson. */
  built: { part: number; dir: string } | "here";
  /** The whole value, part by part: only for the three rows the lesson reads. */
  pieces?: Piece[];
}

const short = (hex: string): string => `${hex.slice(2, 10)}…${hex.slice(-4)}`;

/** η's four hashes in that state, newest first. */
export const ETA = [
  "0xcf7f084efbeefbda10df98970c403993cfc0039f1c240ba4f2ff075890a1a83b",
  "0xb3230cec228f726817c9fb23f7ffcca477dacd8203a6f0fd3c781ec6232e84a9",
  "0x5e625757e94324fdef8fe7de30d5cdc8a4c4612717c84fa87f4d98434afc2af7",
  "0x5710c5f909acecaec8afe31f4eddd93c495bac0618e715a3f22abc90670e5aab",
];
/** τ in that state: the slot of block 11, the block before. */
export const TAU = 11;

const PARTS: Record<number, string> = {
  8: "08-safrole", 9: "09-recent-history", 10: "10-disputes", 11: "11-assurances",
  13: "13-authorization", 14: "14-services", 17: "17-accumulation", 18: "18-statistics",
};
const built = (part: number): { part: number; dir: string } => ({ part, dir: PARTS[part] });

type Told = Pick<Row, "says" | "size" | "starts" | "adds" | "built" | "pieces">;
const TOLD: Record<number, Told> = {
  1: { says: "for each core, its pool of authorizer hashes, with their count in front", size: 514, starts: "08 23 57 42", adds: "2 cores × (1 count byte + 8 hashes × 32) = 514", built: built(13) },
  2: { says: "for each core, its queue of 80 authorizer hashes, with no count: it is always 80", size: 5120, starts: "23 57 42 6f", adds: "2 cores × 80 hashes × 32 = 5,120", built: built(13) },
  3: { says: "the recent blocks with their count in front, each one's header hash, belt root, state root, slot and reported packages; then the belt", size: 910, starts: "08 c2 4a f4", adds: "it starts 08: eight recent blocks follow", built: built(9) },
  4: { says: "the pending validators with their count, the ring root, one byte saying tickets or keys, the sealers, then the lottery's tickets with their count", size: 2547, starts: "06 ff 71 c6", adds: "it starts 06: six pending validators' keys come first", built: built(8) },
  5: { says: "four sets, each sorted, each with its count in front: good, bad, wonky, offenders", size: 4, starts: "00 00 00 00", adds: "four empty sets, a count of 0 each: 4 bytes", built: built(10) },
  6: {
    says: "four 32-byte hashes, the newest first, with no count: it is always four", size: 128, starts: "cf 7f 08 4e", adds: "4 hashes × 32 = 128", built: "here",
    pieces: ETA.map((hash, n) => ({ bytes: short(hash), what: `η${"₀₁₂₃"[n]}${n === 0 ? ", the newest" : n === 3 ? ", the oldest" : ""}: a hash, 32 bytes` })),
  },
  7: { says: "the next validators' keys, with their count in front", size: 2017, starts: "06 ff 71 c6", adds: "1 count byte + 6 keys × 336 = 2,017: read like κ", built: built(8) },
  8: {
    says: "this epoch's validators' keys, with their count in front", size: 2017, starts: "06 ff 71 c6", adds: "1 count byte + 6 keys × 336 = 2,017", built: "here",
    pieces: [
      { bytes: "06", what: "six validator keys follow: 1 byte" },
      ...KEYS.map((k, n) => ({ bytes: `${short(k.bandersnatch)} ${short(k.ed25519)}`, what: `κ${n}: Bandersnatch 32, Ed25519 32, then BLS 144 and metadata 128: ${VALIDATOR_KEY_BYTES} bytes` })),
    ],
  },
  9: { says: "the last epoch's validators' keys, with their count in front", size: 2017, starts: "06 ff 71 c6", adds: "1 count byte + 6 keys × 336 = 2,017: read like κ", built: built(8) },
  10: { says: "for each core, maybe a pending report and the slot it came in: 0 for none, or 1 and then both", size: 2, starts: "00 00", adds: "2 cores, nothing pending on either: 2 bytes", built: built(11) },
  11: {
    says: "the slot of the most recent block, in 4 bytes", size: 4, starts: "0b 00 00 00", adds: "one u32: 4", built: "here",
    pieces: [{ bytes: "0b 00 00 00", what: `slot ${TAU} as a u32, lowest byte first: 4 bytes` }],
  },
  12: { says: "the manager, each core's assigner, the delegator and the registrar, each a 4-byte service id; then the always-accumulate services with their count", size: 21, starts: "00 00 00 00", adds: "4 + 2 cores × 4 + 4 + 4, then a count of 0: 21", built: built(17) },
  13: { says: "this epoch's validator tallies and last epoch's, each list with its count in front; then the cores' tallies and the services'", size: 307, starts: "06 02 00 00", adds: "it starts 06: six validators' tallies come first", built: built(18) },
  14: { says: "for each slot of an epoch, the reports waiting there on other work, with their count in front", size: 12, starts: "00 00 00 00", adds: "12 slots, nothing waiting in any: 12 bytes", built: built(17) },
  15: { says: "for each slot of an epoch, the hashes of the packages accumulated then, with their count in front", size: 12, starts: "00 00 00 00", adds: "12 slots, nothing accumulated in any: 12 bytes", built: built(17) },
  16: { says: "the last block's accumulation outputs, a service id and a hash each, with their count in front", size: 1, starts: "00", adds: "no outputs, a count of 0: 1 byte", built: built(17) },
  255: { says: "a 0 byte, the code hash, five 8-byte numbers (balance, two gas minimums, octets, gratis), then four 4-byte numbers (items, created, last accumulated, parent)", size: 89, starts: "00 12 8f c8", adds: "1 + 32 + 5 × 8 + 4 × 4 = 89", built: built(14) },
};

const hex = (n: number): string => n.toString(16).padStart(2, "0");

/** The table's rows, in key order: C(1) to C(16), then the account. */
export const ROWS: Row[] = [
  ...COMPONENTS.slice(1).map((component, k): Row => {
    const i = k + 1;
    const letter = component.split(",")[0];
    return {
      i, key: `C(${i})`, keyBytes: `${hex(i)} 00 00 … 00`, keySays: `the number ${i}, then 30 zero bytes: 31 in all`,
      letter, name: component.slice(component.indexOf(",") + 2), ...TOLD[i],
    };
  }),
  {
    i: 255, key: "C(255, 0)", keyBytes: "ff 00 00 … 00", keySays: "the number 255, then service 0's id with a zero after each of its bytes: all zeros here, 31 in all",
    letter: "δ", name: "service 0's account", ...TOLD[255],
  },
];

/** The rows this lesson reads all the way: τ, η and κ, in the order it reads them. */
export const READ_HERE = [11, 6, 8];

export const rowOf = (i: number): Row => {
  const row = ROWS.find((r) => r.i === i);
  if (!row) throw new Error(`(D.2) has no row ${i}`);
  return row;
};

/** Whether every byte of a row's value in this state is zero: an empty set, list or slot. */
export const allZero = (row: Row): boolean => ZEROS.includes(row.i);
const ZEROS = [5, 10, 12, 14, 15, 16];

/** The three validator sets hold the same six keys in this state: the same 2,017 bytes. */
export const SAME_BYTES = [7, 8, 9];
