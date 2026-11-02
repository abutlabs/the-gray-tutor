// A Part's opening page draws the Part as a flow (PartFlow.vue): the things your client
// holds, and the steps that turn one into the next, each with a plain-words line, a real
// value and the lesson that builds it. A step your client never takes (a guarantor's,
// in-core) says who takes it, and one it takes in a later Part says which. A flow that
// crosses from off the chain to in-core to on-chain bands its rows by place.
// tools/widget-part-flow.test.ts checks every value, field and lesson here against the
// lessons' own code.

import { bytesFor, needed } from "./bitfield.ts";
import { encodeFixed, spacedHex, toHex } from "./bytes.ts";
import { compact } from "./compact.ts";

/** A thing your client holds, or a step that turns one thing into the next. */
export type Card = {
  kind: "thing" | "step";
  name: string;
  says: string; // what it is, in plain words
  example?: string; // a real value from the lessons
  fields?: string[]; // what it's made of, in the order it's encoded
  record?: string; // where those fields are defined: "3.1 WorkPackage", a record in that lesson's code
  lessons: string[]; // the lessons that build it, "1.1"; none for a card the client never makes
  elsewhere?: string; // a card the client never makes: a sentence saying who does instead
  ahead?: number[]; // a step the client takes in later Parts, not this one
};

/**
 * Where work happens: off the chain (a builder), in-core (on one of JAM's cores, by its
 * guarantors, before any block) or on-chain (in a block, which every client checks).
 */
export type Place = "off-chain" | "in-core" | "on-chain";

/** A run of a flow's rows that all happen in one place. */
export type Band = { place: Place; rows: number };

/**
 * A Part as a flow: its cards in rows (each row's cards side by side), and the order to walk
 * them. A flow that crosses places has bands: its rows, top to bottom, run by run.
 */
export type Flow = { part: number; rows: string[][]; walk: string[]; cards: Record<string, Card>; bands?: Band[] };

/** Where each lesson the flows name is, under the site's base (checked against the lesson files). */
export const LESSON_PATHS: Record<string, string> = {
  "0.2": "00-start/02-set-up-the-project",
  "0.3": "00-start/03-watch-your-client",
  "0.4": "00-start/04-the-jam-clock",
  "1.1": "01-bytes-and-numbers/01-bytes-and-hex",
  "1.2": "01-bytes-and-numbers/02-numbers",
  "2.1": "02-codec/01-fixed-width-integers",
  "2.2": "02-codec/02-compact-naturals",
  "2.3": "02-codec/03-writer-and-reader",
  "2.4": "02-codec/04-codecs",
  "2.5": "02-codec/05-sequences-and-records",
  "2.6": "02-codec/06-the-first-test-vectors",
  "2.7": "02-codec/07-watch-a-decode",
  "3.1": "03-work-and-reports/01-a-work-package",
  "3.2": "03-work-and-reports/02-work-digests",
  "3.3": "03-work-and-reports/03-a-work-report",
  "4.1": "04-blocks/01-tickets-and-preimages",
  "4.2": "04-blocks/02-tiny-and-full",
  "4.3": "04-blocks/03-guarantees",
  "4.4": "04-blocks/04-disputes",
  "4.5": "04-blocks/05-maybe-and-exactly-n",
  "4.6": "04-blocks/06-the-header",
  "4.7": "04-blocks/07-the-block",
  "5.1": "05-hashing-and-signatures/01-hashes",
  "5.2": "05-hashing-and-signatures/02-the-extrinsic-hash",
  "5.3": "05-hashing-and-signatures/03-signatures",
  "6.1": "06-state-and-merklization/01-the-state-trie",
  "6.2": "06-state-and-merklization/02-state-keys",
  "6.3": "06-state-and-merklization/03-reading-the-state",
  "7.1": "07-time-and-shuffling/01-epochs",
  "7.2": "07-time-and-shuffling/02-the-shuffle",
  "8.1": "08-safrole/01-stirring-the-entropy",
  "8.2": "08-safrole/02-rotating-the-validators",
  "8.3": "08-safrole/03-the-fallback-sealers",
  "8.4": "08-safrole/04-the-lotterys-winners",
  "8.5": "08-safrole/05-one-step-of-safrole",
  "8.6": "08-safrole/06-the-vrf-output",
  "8.7": "08-safrole/07-entering-tickets",
  "8.8": "08-safrole/08-the-ring-root",
  "8.9": "08-safrole/09-seals",
  "9.1": "09-recent-history/01-the-mountain-belt",
  "9.2": "09-recent-history/02-recent-blocks",
  "10.1": "10-disputes/01-votes-and-verdicts",
  "10.2": "10-disputes/02-culprits-and-faults",
  "10.3": "10-disputes/03-clearing-the-cores",
  "10.4": "10-disputes/04-bad-verdicts",
  "10.5": "10-disputes/05-bad-culprits-and-faults",
  "11.1": "11-assurances/01-available",
  "11.2": "11-assurances/02-timeouts",
  "11.3": "11-assurances/03-bad-assurances",
  "12.1": "12-guarantees/01-who-guarantees-what",
  "12.2": "12-guarantees/02-signed-and-counted",
  "12.3": "12-guarantees/03-onto-the-cores",
  "12.4": "12-guarantees/04-bad-guarantees",
  "12.5": "12-guarantees/05-bad-reports",
  "13.1": "13-authorization/01-the-authorizer-pools",
  "14.1": "14-services/01-providing-preimages",
  "14.2": "14-services/02-the-service-account",
  "15.1": "15-the-pvm/01-the-program-blob",
  "15.2": "15-the-pvm/02-instructions",
  "15.3": "15-the-pvm/03-the-machine",
  "15.4": "15-the-pvm/04-memory",
  "15.5": "15-the-pvm/05-arithmetic",
  "15.6": "15-the-pvm/06-branches-and-calls",
  "15.7": "15-the-pvm/07-bits-and-bytes",
  "15.8": "15-the-pvm/08-a-real-program",
  "15.9": "15-the-pvm/09-what-instructions-cost",
  "15.10": "15-the-pvm/10-the-pipeline",
  "15.11": "15-the-pvm/11-the-gas-meter",
  "16.1": "16-host-calls/01-calling-the-host",
  "16.2": "16-host-calls/02-fetch",
  "16.3": "16-host-calls/03-growing-the-heap",
  "16.4": "16-host-calls/04-info",
  "16.5": "16-host-calls/05-storage",
  "16.6": "16-host-calls/06-checkpoints",
  "16.7": "16-host-calls/07-a-services-inputs",
  "16.8": "16-host-calls/08-lookup",
  "16.9": "16-host-calls/09-asking-for-preimages",
  "17.1": "17-accumulation/01-a-blocks-accumulation",
  "17.2": "17-accumulation/02-waiting-reports",
  "17.3": "17-accumulation/03-sending-a-transfer",
  "17.4": "17-accumulation/04-rounds",
  "17.5": "17-accumulation/05-privileges",
  "17.6": "17-accumulation/06-who-wins",
  "17.7": "17-accumulation/07-ejecting-a-service",
  "17.8": "17-accumulation/08-creating-a-service",
  "17.9": "17-accumulation/09-the-blocks-gas-budget",
  "17.10": "17-accumulation/10-upgrading-a-service",
  "17.11": "17-accumulation/11-what-a-service-yields",
  "17.12": "17-accumulation/12-providing-a-preimage",
  "17.13": "17-accumulation/13-blessing-and-designating",
  "18.1": "18-statistics/01-who-did-what",
  "18.2": "18-statistics/02-what-cores-and-services-did",
  "19.1": "19-block-import/01-the-order-of-things",
  "19.2": "19-block-import/02-the-whole-state",
  "19.3": "19-block-import/03-accounts-from-the-state",
  "19.4": "19-block-import/04-importing-a-block",
  "19.5": "19-block-import/05-work-on-the-chain",
  "19.6": "19-block-import/06-blocks-to-refuse",
  "20.1": "20-facing-the-fuzzer/01-speaking-the-protocol",
  "20.2": "20-facing-the-fuzzer/02-a-target",
  "20.3": "20-facing-the-fuzzer/03-a-session",
  "20.4": "20-facing-the-fuzzer/04-ready-to-be-fuzzed",
};

/** A Part's folder, from its lessons' paths: 12 → "12-guarantees". */
export const partPath = (part: number): string | undefined =>
  Object.entries(LESSON_PATHS).find(([id]) => id.split(".")[0] === String(part))?.[1].split("/")[0];

const SLOT = 5n; // a timeslot, as the lessons first meet one
/** The JAM Common Era, 2025-01-01 12:00 UTC, in seconds since 1970 (0.4), and a slot's length. */
export const JAM_COMMON_ERA = Date.UTC(2025, 0, 1, 12) / 1000;
export const SLOT_SECONDS = 6;
const slotAt = (iso: string) => Math.floor((Date.parse(iso) / 1000 - JAM_COMMON_ERA) / SLOT_SECONDS);
/** E, an epoch's length in slots: tiny and full (7.1). */
export const EPOCH_LENGTH = { tiny: 12, full: 600 };
/** F(s, r), the shuffle (7.2): take item r₀ of what's left, put the last in its place, again. */
export function shuffle<T>(items: T[], numbers: number[]): T[] {
  const left = [...items];
  const out: T[] = [];
  for (const r of numbers.slice(0, items.length)) {
    const k = r % left.length;
    out.push(left[k]);
    left[k] = left[left.length - 1];
    left.pop();
  }
  return out;
}
/** Z, outside in (8.4): the first, the last, the second, the second to last, and inwards. */
export function outsideIn<T>(items: T[]): T[] {
  const out: T[] = [];
  for (let i = 0, j = items.length - 1; i <= j; i++, j--) out.push(...(i === j ? [items[i]] : [items[i], items[j]]));
  return out;
}
/** β_H's length: the blocks the recent history remembers (9.2). */
export const RECENT_BLOCKS = 8;
/** U: the slots a report may wait on its core to become available (11.2). */
export const AVAILABILITY_TIMEOUT = 5;
/** R, the slots between guarantor rotations (12.1), and the authorizer pool and queue sizes (13.1). */
export const ROTATION_PERIOD = { tiny: 4, full: 10 };
export const POOL_SIZE = 8;
export const QUEUE_SIZE = 80;
/** The PVM (Part 15): its registers, its page size, its arithmetic instructions, all its instructions. */
export const PVM = { registers: 13, page: 4096, arithmetic: 72, instructions: 139 };
/** The conformance fuzzer's messages (20.1), in the order a session meets them. */
export const FUZZ_MESSAGES = ["peer_info", "initialize", "import_block", "state_root", "get_state", "state", "error"];
/** Tiny's validators, for the vote and assurance counts. */
const V = 6;
/** C(i), a state component's key (6.2): the byte i, then 30 zeros, as hex. */
export const componentKeyHex = (i: number): string => toHex([i, ...new Array<number>(30).fill(0)]);
/** An assurance's signed message starts with these ASCII bytes (5.3, X_A in the GP). */
export const AVAILABLE = "jam_available";
const BIG = 2n ** 64n - 70n; // 1.2's number that a float can't hold

export const FLOWS: Flow[] = [
  {
    part: 0,
    rows: [["now"], ["slotAt"], ["slot", "tests"], ["report"], ["stack"]],
    walk: ["now", "slotAt", "slot", "tests", "report", "stack"],
    cards: {
      now: {
        kind: "thing",
        name: "The time now",
        says: "Your computer's clock: a date and a time, to the millisecond.",
        example: "1 January 2025 at 1 pm UTC: an hour after the JAM Common Era began",
        lessons: ["0.4"],
      },
      slotAt: {
        kind: "step",
        name: "slotAt",
        says: `Count the seconds since the JAM Common Era, 2025-01-01 at 12:00 UTC, and divide by ${SLOT_SECONDS}. JAM's clock ticks once every ${SLOT_SECONDS} seconds.`,
        example: `6 seconds in → slot ${slotAt("2025-01-01T12:00:06Z")}, an hour in → slot ${slotAt("2025-01-01T13:00:00Z")}`,
        lessons: ["0.4"],
      },
      slot: {
        kind: "thing",
        name: "A timeslot",
        says: "JAM's own time: which 6-second tick it is. Every block names the slot it was made in.",
        example: `an hour in: slot ${slotAt("2025-01-01T13:00:00Z")}`,
        lessons: ["0.4"],
      },
      tests: {
        kind: "thing",
        name: "Tests",
        says: "Small programs that check one thing each. Write the test first, watch it fail, then write the code that makes it pass.",
        example: "slot 0 is the first six seconds of the JAM Common Era",
        lessons: ["0.2", "0.4"],
      },
      report: {
        kind: "step",
        name: "Report a run",
        says: "Every run, a program or npm test, sends what it did as events and what it measured as numbers, in one go at the end.",
        example: `{"step":"hello","message":"my JAM client is alive"}`,
        lessons: ["0.3"],
      },
      stack: {
        kind: "step",
        name: "Keep it, and show it",
        says: "Loki keeps the events, the Pushgateway and Prometheus keep the numbers, and Grafana draws both, run after run.",
        lessons: [],
        elsewhere: "Docker runs this, not your client: lesson 0.2 starts the stack.",
      },
    },
  },
  {
    part: 1,
    rows: [["hex", "number"], ["fromHex", "exact"], ["bytes", "kept"], ["codec"]],
    walk: ["hex", "fromHex", "bytes", "number", "exact", "kept", "codec"],
    cards: {
      hex: {
        kind: "thing",
        name: "Hex, as the test vectors write it",
        says: "The official test vectors are text files. Every byte in them is two hex digits, so 255 is 0xff.",
        example: toHex([1, 2, 255]),
        lessons: ["1.1"],
      },
      fromHex: {
        kind: "step",
        name: "fromHex, and toHex back",
        says: "Read every two hex digits as one byte, and write a byte back as two digits. Going there and back must give the same thing.",
        example: `${toHex([1, 2, 255])} ⇄ [1, 2, 255]`,
        lessons: ["1.1"],
      },
      bytes: {
        kind: "thing",
        name: "Bytes",
        says: "A row of numbers from 0 to 255: what every JAM value is in the end, and what gets hashed.",
        example: "Uint8Array [1, 2, 255]",
        lessons: ["1.1"],
      },
      number: {
        kind: "thing",
        name: "A JAM number",
        says: "Slots, ids, counts and gas. Some are small, and some go right up to 64 bits.",
        example: `slot ${SLOT}, or gas ${BIG}`,
        lessons: ["1.2"],
      },
      exact: {
        kind: "step",
        name: "Keep it exact",
        says: "A JavaScript number rounds above 2^53, so 2^64 − 70 and 2^64 come out the same. Use number up to 32 bits, and bigint for 64.",
        example: `${BIG}n`,
        lessons: ["1.2"],
      },
      kept: {
        kind: "thing",
        name: "An exact number",
        says: "The same value in every client, down to the last digit, ready to be turned into bytes.",
        example: `${SLOT} (a number), ${BIG}n (a bigint)`,
        lessons: ["1.2"],
      },
      codec: {
        kind: "step",
        name: "On to the codec",
        says: "Numbers in, bytes out, the same in every client.",
        lessons: [],
        ahead: [2],
      },
    },
  },
  {
    part: 2,
    rows: [["value"], ["encode"], ["bytes"], ["decode"], ["again"], ["vectors"], ["trace"]],
    walk: ["value", "encode", "bytes", "decode", "again", "vectors", "trace"],
    cards: {
      value: {
        kind: "thing",
        name: "A JAM value",
        says: "Anything JAM keeps: a number, a hash, a list, or a whole structure of named fields, such as a work item.",
        example: `slot ${SLOT}, or 300 as a count`,
        lessons: ["2.4", "2.5"],
      },
      encode: {
        kind: "step",
        name: "Encode: ℰ",
        says: "Write the value as bytes, field after field, in the Gray Paper's order. A Writer collects them. A fixed-width number always takes the same bytes; a compact one takes only as many as it needs.",
        example: `ℰ₄(${SLOT}) = ${spacedHex(encodeFixed(SLOT, 4))}, ℰ(300) = ${spacedHex(compact(300n).bytes)}`,
        lessons: ["2.1", "2.2", "2.3"],
      },
      bytes: {
        kind: "thing",
        name: "The bytes",
        says: "Exactly one row of bytes for each value: the same in every client, so the same hash.",
        example: spacedHex(encodeFixed(SLOT, 4)),
        lessons: ["2.1"],
      },
      decode: {
        kind: "step",
        name: "Decode",
        says: "A Reader walks back through the bytes, keeping its place, and rebuilds the value. One codec describes a value both ways, so encode and decode can't drift apart.",
        example: `${spacedHex(encodeFixed(SLOT, 4))} → ${SLOT}`,
        lessons: ["2.3", "2.4"],
      },
      again: {
        kind: "thing",
        name: "The same value, back",
        says: "Decoding what you encoded gives back exactly what you started with. Lists and records work the same way, field by field.",
        example: `${SLOT}`,
        lessons: ["2.4", "2.5"],
      },
      vectors: {
        kind: "step",
        name: "Check against the official vectors",
        says: "Decode the vector's bytes and compare them with its JSON, then encode again and compare the bytes. A vector passes only when both match.",
        example: "work_item and refine_context, tiny and full: 4 of 1,428",
        lessons: ["2.6"],
      },
      trace: {
        kind: "thing",
        name: "A decode trace",
        says: "Which bytes became which field, so a mistake shows exactly where it is.",
        example: "0..4  service  0x04030201",
        lessons: ["2.7"],
      },
    },
  },
  {
    part: 3,
    rows: [["job"], ["package"], ["authorize"], ["refine"], ["digests"], ["report"], ["guarantee"], ["chain"]],
    walk: ["job", "package", "authorize", "refine", "digests", "report", "guarantee", "chain"],
    bands: [{ place: "off-chain", rows: 2 }, { place: "in-core", rows: 5 }, { place: "on-chain", rows: 1 }],
    cards: {
      job: {
        kind: "thing",
        name: "A job to do",
        says: "Someone wants a service's code run on some input, its payload, using one of JAM's cores.",
        lessons: [],
        elsewhere: "A builder does this: anyone with work for a service, off the chain. Your client never sees the job, only the package it becomes.",
      },
      package: {
        kind: "thing",
        name: "Work-package",
        says: "The parcel: up to 16 work items, the chain as it looked when the parcel was built, and a permission slip for the core.",
        fields: ["auth_code_host", "auth_code_hash", "context", "authorization", "authorizer_config", "items"],
        record: "3.1 WorkPackage",
        lessons: ["3.1"],
      },
      authorize: {
        kind: "step",
        name: "Authorize",
        says: "A guarantor runs the package's authorizer: may this package use the core at all?",
        lessons: [],
        elsewhere: "One of the core's guarantors does this, in-core. Block import never runs an authorizer, so your client never will.",
      },
      refine: {
        kind: "step",
        name: "Refine",
        says: "The guarantor runs each item's service code on its payload: one result for each item.",
        lessons: [],
        elsewhere: "The core's guarantors do this, in-core. Your client never refines; it reads the results, in the digests.",
      },
      digests: {
        kind: "thing",
        name: "Work digests",
        says: "One summary card for each item: which service, what it was given, the gas it may use, and its result, which is either an output or an error.",
        fields: ["service_id", "code_hash", "payload_hash", "accumulate_gas", "result", "refine_load"],
        record: "3.2 WorkDigest",
        lessons: ["3.2"],
      },
      report: {
        kind: "thing",
        name: "Work-report",
        says: "The receipt that ties it all together: which package, on which core, who authorized it, and every item's digest.",
        fields: ["package_spec", "context", "core_index", "authorizer_hash", "auth_gas_used", "auth_output", "segment_root_lookup", "results"],
        record: "3.3 WorkReport",
        lessons: ["3.3"],
      },
      guarantee: {
        kind: "step",
        name: "Guarantee",
        says: "Two or three of the core's guarantors sign the report: they vouch that it's right.",
        lessons: [],
        elsewhere: "The core's guarantors do this, in-core. Your client checks their signatures, in Part 12.",
      },
      chain: {
        kind: "step",
        name: "Onto the chain",
        says: "A block carries the signed report to the chain, where every client checks it, yours included.",
        lessons: [],
        ahead: [4, 12],
      },
    },
  },
  {
    part: 4,
    rows: [["tickets", "preimages", "guarantees", "assurances", "disputes"], ["extrinsic", "header"], ["block"], ["sizes"], ["read"]],
    walk: ["tickets", "preimages", "guarantees", "assurances", "disputes", "extrinsic", "header", "block", "sizes", "read"],
    cards: {
      tickets: {
        kind: "thing",
        name: "Tickets",
        says: "Entries in the lottery that decides who writes the blocks of a coming epoch.",
        lessons: ["4.1"],
      },
      preimages: {
        kind: "thing",
        name: "Preimages",
        says: "Data a service asked for by its hash, now delivered.",
        lessons: ["4.1"],
      },
      guarantees: {
        kind: "thing",
        name: "Guarantees",
        says: "Part 3's work-reports, each signed by the guarantors that vouch for it.",
        lessons: ["4.3"],
      },
      assurances: {
        kind: "thing",
        name: "Assurances",
        says: `Validators saying "I hold my piece of this core's data": one bit for each core, so the block's size depends on the network's.`,
        lessons: ["4.2"],
      },
      disputes: {
        kind: "thing",
        name: "Disputes",
        says: "Judgments on reports: the validators' verdict on whether a report was good, and who is to blame for a bad one.",
        lessons: ["4.4"],
      },
      extrinsic: {
        kind: "thing",
        name: "The extrinsic",
        says: "Everything the block brings in from outside: the five lists, always in this order.",
        fields: ["tickets", "preimages", "guarantees", "assurances", "disputes"],
        record: "4.7 Extrinsic",
        lessons: ["4.4", "4.7"],
      },
      header: {
        kind: "thing",
        name: "The header",
        says: "The block's cover page: its parent, the state it builds on, a hash that commits to the extrinsic, its slot, its author and its seal. Two of its fields are only sometimes there.",
        fields: ["parent", "parent_state_root", "extrinsic_hash", "slot", "epoch_mark", "tickets_mark", "author_index", "entropy_source", "offenders_mark", "seal"],
        record: "4.6 Header",
        lessons: ["4.5", "4.6"],
      },
      block: {
        kind: "thing",
        name: "A block",
        says: "The header and the extrinsic, together.",
        fields: ["header", "extrinsic"],
        record: "4.7 Block",
        lessons: ["4.7"],
      },
      sizes: {
        kind: "step",
        name: "Tiny or full",
        says: "The same codec in both configurations. Tiny is for tests and full uses the Gray Paper's own numbers, and a few lists change length to match.",
        example: `tiny: 6 validators, 2 cores (an assurance is ${bytesFor(2)} byte); full: 1023 validators, 341 cores (${bytesFor(341)} bytes)`,
        lessons: ["4.2"],
      },
      read: {
        kind: "step",
        name: "Read any block",
        says: "Decode a whole block, at either size, and show every byte of it. Checking that the block is valid comes in Part 5.",
        example: "all 30 codec vectors pass whole",
        lessons: ["4.7"],
      },
    },
  },
  {
    part: 5,
    rows: [["header"], ["hash"], ["link"], ["extrinsic"], ["exthash"], ["sign"], ["assurance"], ["verify"]],
    walk: ["header", "hash", "link", "extrinsic", "exthash", "sign", "assurance", "verify"],
    cards: {
      header: {
        kind: "thing",
        name: "A block's header",
        says: "The cover page from Part 4, from a chain of 100 real blocks in a test trace.",
        lessons: ["5.1"],
      },
      hash: {
        kind: "step",
        name: "Hash it: blake2b-256",
        says: "Encode the header, and boil its bytes down to a 32-byte fingerprint. Change one bit of the header and the fingerprint changes completely.",
        example: "H(ℰ(header)): 32 bytes",
        lessons: ["5.1"],
      },
      link: {
        kind: "step",
        name: "Check the link",
        says: "The next block's header names its parent by exactly that hash. If they match, the two blocks are a chain.",
        example: "block 2's parent is the hash of block 1's header",
        lessons: ["5.1"],
      },
      extrinsic: {
        kind: "thing",
        name: "The block's extrinsic",
        says: "Everything the block brings in. Its header promises it by hash, before anyone has looked inside.",
        lessons: ["5.2"],
      },
      exthash: {
        kind: "step",
        name: "Check the extrinsic hash",
        says: "Hash each of the five lists, then hash those hashes together. The result must be the header's extrinsic_hash.",
        example: "100 of 100 extrinsics match their headers",
        lessons: ["5.2"],
      },
      sign: {
        kind: "step",
        name: "Sign",
        says: `A validator signs with its secret key. What it signs starts with a few letters naming the job, ${AVAILABLE}, so a signature for one job can't pass for another.`,
        lessons: [],
        elsewhere: "Each validator does this, with a secret key only it has. Your client checks signatures; it never makes them.",
      },
      assurance: {
        kind: "thing",
        name: "A signed assurance",
        says: "A validator's word that it holds its piece of some cores' data, with its signature.",
        fields: ["anchor", "bitfield", "validator_index", "signature"],
        record: "4.2 Assurance",
        lessons: ["5.3"],
      },
      verify: {
        kind: "step",
        name: "Check the signature: Ed25519",
        says: "Put the validator's public key, the message and the signature together: either it was made with that validator's key, or it wasn't.",
        example: `the message: the ${AVAILABLE.length} bytes of ${AVAILABLE}, then H(ℰ(anchor, bitfield))`,
        lessons: ["5.3"],
      },
    },
  },
  {
    part: 6,
    rows: [["state"], ["keys"], ["trie", "read"], ["root", "values"], ["check"]],
    walk: ["state", "keys", "trie", "root", "check", "read", "values"],
    cards: {
      state: {
        kind: "thing",
        name: "The state",
        says: "All of JAM's memory: the time, the entropy, the validators and the rest, plus every service's account and storage, as entries of a key and a value.",
        example: "a real state: 16 components, an account, preimages, requests",
        lessons: ["6.2"],
      },
      keys: {
        kind: "step",
        name: "File each entry under its key",
        says: "Every entry has a 31-byte key. A component's key is its number, then zeros; a service's things weave the service id into theirs.",
        example: `C(11), τ the time: ${componentKeyHex(11).slice(0, 4)} then 30 zero bytes`,
        lessons: ["6.2"],
      },
      trie: {
        kind: "step",
        name: "Merklize: build the trie",
        says: "Sort the entries by their keys' bits into a binary tree. Each entry becomes a 64-byte leaf, each fork a branch holding its two children's hashes, and each node is hashed.",
        example: "a leaf: 64 bytes, with the value inside if it fits in 32",
        lessons: ["6.1"],
      },
      root: {
        kind: "thing",
        name: "The state root",
        says: "The top node's hash: one 32-byte fingerprint of the whole state. Change any byte anywhere, and the root changes.",
        example: "the official trie vector's root, matched whole",
        lessons: ["6.1"],
      },
      check: {
        kind: "step",
        name: "Check the header's parent_state_root",
        says: "Every header names the state root after its parent block. Compute your own, and compare.",
        lessons: ["6.1"],
      },
      read: {
        kind: "step",
        name: "Read a component",
        says: "Look a component up by its key, and decode its bytes with the codecs you already have.",
        lessons: ["6.3"],
      },
      values: {
        kind: "thing",
        name: "The time, the entropy, the validators",
        says: "Three components, read back as values. A validator key is three keys for three jobs, and some metadata.",
        example: "a validator key: 336 bytes",
        fields: ["bandersnatch", "ed25519", "bls", "metadata"],
        record: "6.3 ValidatorKey",
        lessons: ["6.3"],
      },
    },
  },
  {
    part: 7,
    rows: [["slot"], ["epochOf"], ["epoch"], ["entropy"], ["numbers"], ["shuffle"], ["hand"]],
    walk: ["slot", "epochOf", "epoch", "entropy", "numbers", "shuffle", "hand"],
    cards: {
      slot: {
        kind: "thing",
        name: "A timeslot",
        says: "JAM's clock from Part 0: one tick every 6 seconds.",
        example: "slot 25",
        lessons: ["7.1"],
      },
      epochOf: {
        kind: "step",
        name: "Which epoch, and where in it",
        says: `Divide the slot by E, the epoch's length: the whole part is the epoch, the remainder the phase. E is ${EPOCH_LENGTH.tiny} slots on tiny and ${EPOCH_LENGTH.full}, an hour, on full.`,
        example: `tiny: slot 25 is epoch ${Math.floor(25 / EPOCH_LENGTH.tiny)}, phase ${25 % EPOCH_LENGTH.tiny}`,
        lessons: ["7.1"],
      },
      epoch: {
        kind: "thing",
        name: "An epoch",
        says: "JAM's slower hand. When a block starts a new epoch, the validators change and the entropy history moves along one place.",
        example: `epoch ${Math.floor(25 / EPOCH_LENGTH.tiny)}, phase ${25 % EPOCH_LENGTH.tiny}`,
        lessons: ["7.1"],
      },
      entropy: {
        kind: "thing",
        name: "A hash nobody could steer",
        says: "32 bytes of randomness the whole chain agrees on. Part 8 makes it; here it's the seed for a shuffle.",
        lessons: ["7.2"],
      },
      numbers: {
        kind: "step",
        name: "Q: numbers from the hash",
        says: "Hash the seed together with ℰ₄(0), then ℰ₄(1), and so on. Each 32-byte hash that comes out is eight 4-byte numbers.",
        lessons: ["7.2"],
      },
      shuffle: {
        kind: "step",
        name: "F: deal",
        says: "Take the item each number points at among those left, put the last item in its place, and go again. The same hash deals the same hand, on every node.",
        example: `a b c d with 1, 1, 0, 0 → ${shuffle(["a", "b", "c", "d"], [1, 1, 0, 0]).join(" ")}`,
        lessons: ["7.2"],
      },
      hand: {
        kind: "thing",
        name: "The dealt hand",
        says: "The list in an order every client agrees on. Lesson 12.1 uses it to deal guarantors to cores.",
        example: "the shuffle vectors: 0 to 341 items",
        lessons: ["7.2"],
      },
    },
  },
  {
    part: 8,
    rows: [["vrf", "enter"], ["stir", "tickets"], ["rotate", "lottery"], ["sealers", "seats"], ["seal"]],
    walk: ["vrf", "stir", "rotate", "sealers", "enter", "tickets", "lottery", "seats", "seal"],
    cards: {
      vrf: {
        kind: "thing",
        name: "A VRF output",
        says: "Randomness from the block author's signature: nobody could have picked it, and anyone can check it. SHA-512 is all it takes to read it.",
        lessons: ["8.6"],
      },
      stir: {
        kind: "step",
        name: "Stir the entropy",
        says: "Every block, hash the entropy together with the VRF output. At a new epoch, the last three epochs' entropy moves along one place.",
        example: "η′₀ = H(η₀ ⌢ VRF output)",
        lessons: ["8.1"],
      },
      rotate: {
        kind: "step",
        name: "Rotate the validators",
        says: "At each new epoch the four validator sets move along: the queued set becomes pending, pending becomes active, and active becomes last epoch's. Convicted offenders are left out.",
        example: "ι → γ_P → κ → λ",
        lessons: ["8.2"],
      },
      sealers: {
        kind: "thing",
        name: "Fallback sealers",
        says: "Plan B: if the lottery didn't fill every slot, each slot's author is picked by hash from the new validators, the same on every node.",
        lessons: ["8.3"],
      },
      enter: {
        kind: "step",
        name: "Enter the lottery",
        says: "A validator makes an anonymous ticket: proof that it is one of the validators, without saying which.",
        lessons: [],
        elsewhere: "Each validator does this, with its own Bandersnatch key. Your client checks each ticket's ring proof; it never makes one.",
      },
      tickets: {
        kind: "thing",
        name: "Tickets",
        says: "Lottery entries, each with an id and a ring proof checked against the epoch's ring root.",
        lessons: ["8.7", "8.8"],
      },
      lottery: {
        kind: "step",
        name: "Run the lottery",
        says: "Keep the best tickets, lowest ids first, at most one for each slot of an epoch, until the lottery closes.",
        lessons: ["8.4"],
      },
      seats: {
        kind: "step",
        name: "Z: seat the winners",
        says: "Outside in: the best ticket gets the first slot, the next best the last, and so on towards the middle. The block that closes a full lottery announces them in its header.",
        example: `[1, 2, 3, 4, 5] → [${outsideIn([1, 2, 3, 4, 5]).join(", ")}]`,
        lessons: ["8.4", "8.5"],
      },
      seal: {
        kind: "step",
        name: "Check every seal",
        says: "Each block is sealed by its slot's author, a winner or a fallback sealer. Check that the seal and the entropy source are really theirs.",
        example: "all 46 safrole vectors pass, whole",
        lessons: ["8.8", "8.9"],
      },
    },
  },
  {
    part: 9,
    rows: [["block"], ["append"], ["belt"], ["superpeak"], ["record"], ["recent"]],
    walk: ["block", "append", "belt", "superpeak", "record", "recent"],
    cards: {
      block: {
        kind: "thing",
        name: "A new block",
        says: "What the chain wants to remember of it: its header hash, the state root it builds on, the root of what it accumulated, its slot, and the work-packages it reported.",
        fields: ["header_hash", "parent_state_root", "accumulate_root", "slot", "work_packages"],
        record: "9.2 NewBlock",
        lessons: ["9.2"],
      },
      append: {
        kind: "step",
        name: "Append to the belt",
        says: "Add the block's accumulation root to the mountain belt. Like counting in binary, two mountains of one size merge into one of the next size, so a block costs only a handful of hashes.",
        example: "Keccak-256, Ethereum's hash, so bridges can read it",
        lessons: ["9.1"],
      },
      belt: {
        kind: "thing",
        name: "The mountain belt",
        says: "A list of Merkle roots, one for each power of two, with a gap where there's no mountain of that size.",
        lessons: ["9.1"],
      },
      superpeak: {
        kind: "step",
        name: "Fold it to a super-peak",
        says: "Hash the peaks together into one 32-byte hash for the whole belt.",
        lessons: ["9.1"],
      },
      record: {
        kind: "step",
        name: "Record the block",
        says: `Fill in the state root left blank for the block before, add this block, and keep only the last ${RECENT_BLOCKS}.`,
        example: `the last ${RECENT_BLOCKS} blocks`,
        lessons: ["9.2"],
      },
      recent: {
        kind: "thing",
        name: "Recent history",
        says: "The chain's short-term memory. Guarantors must anchor their work in one of these blocks, so it can't claim a chain that never was.",
        fields: ["header_hash", "beefy_root", "state_root", "slot", "reported"],
        record: "9.2 RecentBlock",
        lessons: ["9.2"],
      },
    },
  },
  {
    part: 10,
    rows: [["report"], ["vote"], ["verdict"], ["count"], ["outcome"], ["offenders", "clear"], ["refuse"]],
    walk: ["report", "vote", "verdict", "count", "outcome", "offenders", "clear", "refuse"],
    cards: {
      report: {
        kind: "thing",
        name: "A report under suspicion",
        says: "A work-report that guarantors vouched for, but that may be wrong.",
        lessons: ["10.1"],
      },
      vote: {
        kind: "step",
        name: "Judge it",
        says: "Validators check the work again, and each signs a vote: valid, or invalid.",
        lessons: [],
        elsewhere: "The validators do this: they redo the work to judge it. Your client counts the votes.",
      },
      verdict: {
        kind: "thing",
        name: "A verdict",
        says: "The report's hash and the judges' signed votes, brought to the chain in a block.",
        lessons: ["10.1"],
      },
      count: {
        kind: "step",
        name: "Check and count the votes",
        says: "Check each vote's signature against the right judges, and count the valid votes. Only three splits mean anything: all of them, none, or a third.",
        example: `tiny, ${V} judges: ${needed(V)}, 0 or ${V / 3} valid votes`,
        lessons: ["10.1"],
      },
      outcome: {
        kind: "thing",
        name: "Good, bad or wonky",
        says: "The verdict, filed in ψ for good. A report judged bad or wonky can never come back.",
        fields: ["good", "bad", "wonky", "offenders"],
        record: "10.1 PastJudgements",
        lessons: ["10.1"],
      },
      offenders: {
        kind: "step",
        name: "Name the offenders",
        says: "Culprits vouched for a bad report, and faults voted against the verdict. With their own signatures as evidence, their keys go into ψ_O and the header's offenders mark.",
        lessons: ["10.2"],
      },
      clear: {
        kind: "step",
        name: "Clear the cores",
        says: "A report judged bad or wonky comes off its core, before it can do any harm.",
        lessons: ["10.3"],
      },
      refuse: {
        kind: "step",
        name: "Refuse a broken trial",
        says: "A block whose verdicts, culprits or faults break any rule is refused whole: seven rules for verdicts, more for the accusations.",
        example: "all 60 disputes vectors pass, whole",
        lessons: ["10.4", "10.5"],
      },
    },
  },
  {
    part: 11,
    rows: [["waiting"], ["assure"], ["assurances"], ["count"], ["available", "timeout"], ["refuse"]],
    walk: ["waiting", "assure", "assurances", "count", "available", "timeout", "refuse"],
    cards: {
      waiting: {
        kind: "thing",
        name: "A report on its core",
        says: "Work that guarantors vouched for, its data cut into pieces and spread among the validators.",
        lessons: ["11.1"],
      },
      assure: {
        kind: "step",
        name: "Assure",
        says: "Each validator checks which cores' pieces it holds, and signs one bit for each core: 1 if it holds its piece.",
        lessons: [],
        elsewhere: "Each validator does this, every block. Your client counts the bits.",
      },
      assurances: {
        kind: "thing",
        name: "Assurances",
        says: "Each one is a validator's bitfield and signature, made on top of the block's parent.",
        fields: ["anchor", "bitfield", "validator_index", "signature"],
        record: "4.2 Assurance",
        lessons: ["11.1"],
      },
      count: {
        kind: "step",
        name: "Count each core",
        says: "Count the validators that assure each core in this block. More than two thirds, and the report is available.",
        example: `tiny: ${needed(V)} of ${V}`,
        lessons: ["11.1"],
      },
      available: {
        kind: "thing",
        name: "An available report",
        says: "Its data is safe, so JAM can act on it: off the core, on to accumulation (Part 17).",
        lessons: ["11.1", "11.2"],
      },
      timeout: {
        kind: "step",
        name: "Time out",
        says: `A report that isn't available within U = ${AVAILABILITY_TIMEOUT} slots of reaching its core is dropped, and the core is free again.`,
        example: `registered at slot 7: out at slot ${7 + AVAILABILITY_TIMEOUT}`,
        lessons: ["11.2"],
      },
      refuse: {
        kind: "step",
        name: "Refuse bad assurances",
        says: "Five rules: anchored on the parent, from a real validator, one per validator in order, bits only for cores with something on them, and signed. Break one, and the block is refused.",
        example: "every assurances vector, tiny and full, passes whole",
        lessons: ["11.3"],
      },
    },
  },
  {
    part: 12,
    rows: [["validators"], ["deal"], ["assignment"], ["sign"], ["guarantee"], ["check"], ["reporters", "seat"], ["refuse"]],
    bands: [{ place: "on-chain", rows: 3 }, { place: "in-core", rows: 1 }, { place: "on-chain", rows: 4 }],
    walk: ["validators", "deal", "assignment", "sign", "guarantee", "check", "reporters", "seat", "refuse"],
    cards: {
      validators: {
        kind: "thing",
        name: "The validators and the entropy",
        says: "This epoch's validators, and randomness nobody could steer, from Parts 7 and 8.",
        lessons: ["12.1"],
      },
      deal: {
        kind: "step",
        name: "Deal guarantors to cores",
        says: `Shuffle the validators with the entropy, three to a core. Every R slots, everyone moves on to the next core.`,
        example: `tiny: ${V} validators keep ${V / 3} cores, R = ${ROTATION_PERIOD.tiny} slots; full: R = ${ROTATION_PERIOD.full}`,
        lessons: ["12.1"],
      },
      assignment: {
        kind: "thing",
        name: "Who guarantees what",
        says: "For each validator, the core it may vouch for, in this rotation and in the last.",
        lessons: ["12.1"],
      },
      sign: {
        kind: "step",
        name: "Guarantee a report",
        says: "Two or three of a core's guarantors run a package and sign its report: Part 3's journey.",
        lessons: [],
        elsewhere: "The core's guarantors do this, in-core. Your client checks what they signed.",
      },
      guarantee: {
        kind: "thing",
        name: "A guarantee",
        says: "A report and its guarantors' signatures, in a block's extrinsic.",
        lessons: ["12.2"],
      },
      check: {
        kind: "step",
        name: "Check the signatures",
        says: "Every signature must be real, every signer assigned to that core, and no offender's word is taken.",
        lessons: ["12.2"],
      },
      reporters: {
        kind: "thing",
        name: "The reporters",
        says: "Every validator who signed a guarantee in the block, each counted once, for the statistics in Part 18.",
        lessons: ["12.2"],
      },
      seat: {
        kind: "step",
        name: "Put reports on their cores",
        says: "Each good report takes its free core, and its package is noted for the recent history.",
        lessons: ["12.3"],
      },
      refuse: {
        kind: "step",
        name: "Refuse a bad guarantee",
        says: "Thirteen rules for the guarantees, fourteen for the reports inside them. Break one, and the block is refused whole.",
        example: "all 62 refusals in the reports vectors",
        lessons: ["12.4", "12.5"],
      },
    },
  },
  {
    part: 13,
    rows: [["queue", "used"], ["step"], ["pool"]],
    walk: ["queue", "used", "step", "pool"],
    cards: {
      queue: {
        kind: "thing",
        name: "A core's queue",
        says: `ϕ[c]: exactly ${QUEUE_SIZE} authorizer hashes, waiting their turn. Only a privileged service can change it.`,
        lessons: ["13.1"],
      },
      used: {
        kind: "thing",
        name: "The authorizers reports used",
        says: "Each report a block guarantees names the authorizer that let its package onto the core.",
        fields: ["core", "auth_hash"],
        record: "13.1 UsedAuthorizer",
        lessons: ["13.1"],
      },
      step: {
        kind: "step",
        name: "One in, one out",
        says: `Every block: take out the authorizer a report used, add the queue's entry for this slot, and keep the newest ${POOL_SIZE}.`,
        example: `slot 85 takes the queue's entry 85 mod ${QUEUE_SIZE} = ${85 % QUEUE_SIZE}`,
        lessons: ["13.1"],
      },
      pool: {
        kind: "thing",
        name: "A core's pool",
        says: `α[c]: at most ${POOL_SIZE} authorizers the core accepts right now. A report's authorizer must be in its core's pool (lesson 12.4 checks it).`,
        example: "kept moving on 99 real blocks",
        lessons: ["13.1"],
      },
    },
  },
  {
    part: 14,
    rows: [["request", "provide"], ["preimage"], ["check"], ["store"], ["account"], ["read"]],
    walk: ["request", "provide", "preimage", "check", "store", "account", "read"],
    cards: {
      request: {
        kind: "thing",
        name: "A request",
        says: "A service asks for some data by its hash and its length, and the state remembers the request.",
        lessons: ["14.1"],
      },
      provide: {
        kind: "step",
        name: "Bring the data",
        says: "Someone who has the data puts it in a block's preimages, from lesson 4.1.",
        lessons: [],
        elsewhere: "Whoever has the data does this, by putting it in a block. Your client checks it was asked for.",
      },
      preimage: {
        kind: "thing",
        name: "A preimage",
        says: "The data itself, with the id of the service that asked for it.",
        lessons: ["14.1"],
      },
      check: {
        kind: "step",
        name: "Check it by its hash",
        says: "Its hash and length must match a request still open: asked for, and not yet provided.",
        lessons: ["14.1"],
      },
      store: {
        kind: "step",
        name: "Store it, and close the request",
        says: "File the data under its key, and mark the request done with this slot.",
        example: "the same as the real chain did, 67 times over",
        lessons: ["14.1"],
      },
      account: {
        kind: "thing",
        name: "A service account",
        says: "What the state keeps for each service: its code's hash, its balance, its gas minimums, and how much it stores.",
        fields: ["version", "code_hash", "balance", "min_item_gas", "min_memo_gas", "bytes", "deposit_offset", "items", "creation_slot", "last_accumulation_slot", "parent_service"],
        record: "14.2 ServiceInfo",
        lessons: ["14.2"],
      },
      read: {
        kind: "step",
        name: "Read it, and check it adds up",
        says: "Read any service's account from the state, and check that what it keeps matches its footprint, and that its balance covers the deposit.",
        lessons: ["14.2"],
      },
    },
  },
  {
    part: 15,
    rows: [["blob"], ["unpack"], ["program"], ["setup"], ["machine"], ["step", "price"], ["gas"], ["stop"]],
    walk: ["blob", "unpack", "program", "setup", "machine", "step", "price", "gas", "stop"],
    cards: {
      blob: {
        kind: "thing",
        name: "A program blob",
        says: "A service's code, as bytes: its metadata, how to lay out its memory, a jump table, the instructions, and a bitmask saying where each instruction starts.",
        lessons: ["15.1"],
      },
      unpack: {
        kind: "step",
        name: "Unpack it, and disassemble",
        says: "Take the blob apart, then read each instruction: its opcode, its name and its arguments.",
        example: `${PVM.instructions} instructions in all`,
        lessons: ["15.1", "15.2"],
      },
      program: {
        kind: "thing",
        name: "A program",
        says: "Instructions, one after another, grouped into basic blocks: runs with one way in and one way out.",
        lessons: ["15.2", "15.3"],
      },
      setup: {
        kind: "step",
        name: "Set it up",
        says: "Lay the program out in memory, its data, a heap, a stack and its arguments, and set the registers it starts with.",
        lessons: ["15.8"],
      },
      machine: {
        kind: "thing",
        name: "The machine",
        says: `${PVM.registers} registers of 64 bits each, r0 to r12, an instruction counter, a gas counter, and 2^32 bytes (4 GiB) of addresses, handed out in pages of ${PVM.page.toLocaleString("en-US")}, each one readable, writable, or neither: a program has only the pages it's given.`,
        example: `${PVM.registers} registers; 4 GiB of addresses, in pages of ${PVM.page.toLocaleString("en-US")} bytes`,
        lessons: ["15.3", "15.4", "15.11"],
      },
      step: {
        kind: "step",
        name: "Run an instruction",
        says: "Do what it says: arithmetic and logic, a load or a store, a branch or a call, counting and shuffling bits. Then on to the next.",
        example: `${PVM.arithmetic} arithmetic and logic instructions`,
        lessons: ["15.3", "15.4", "15.5", "15.6", "15.7"],
      },
      price: {
        kind: "step",
        name: "Price each block",
        says: "Give every instruction a cost, then add a basic block's costs up the way a real CPU's pipeline would run them, side by side.",
        lessons: ["15.9", "15.10"],
      },
      gas: {
        kind: "step",
        name: "Charge gas",
        says: "Charge each basic block's price as the machine enters it. When the gas runs out, the machine stops.",
        lessons: ["15.11"],
      },
      stop: {
        kind: "thing",
        name: "How it stops",
        says: "A halt on purpose, a panic, a fault for touching memory it wasn't given, out of gas, or ecalli: a question for the host, which Part 16 answers.",
        lessons: ["15.3", "15.4", "15.8", "15.11"],
      },
    },
  },
  {
    part: 16,
    rows: [["inputs"], ["run"], ["ecalli"], ["charge"], ["ask", "change"], ["resume"], ["collapse"], ["result"]],
    walk: ["inputs", "run", "ecalli", "charge", "ask", "change", "resume", "collapse", "result"],
    cards: {
      inputs: {
        kind: "thing",
        name: "A service's inputs",
        says: "What it has been given to accumulate: one operand for each of its work-digests in the block's reports.",
        lessons: ["16.7"],
      },
      run: {
        kind: "step",
        name: "Run the service",
        says: "Start its code on the PVM from Part 15, with its gas limit.",
        lessons: ["16.6"],
      },
      ecalli: {
        kind: "thing",
        name: "A question for the host",
        says: "The machine stops at ecalli: the program wants something it can't do inside its sealed box.",
        lessons: ["16.1"],
      },
      charge: {
        kind: "step",
        name: "Charge for the call",
        says: "Each host call costs gas, taken before anything else. If there isn't enough, the program is out of gas.",
        lessons: ["16.1"],
      },
      ask: {
        kind: "step",
        name: "Answer a question",
        says: "gas, fetch, info, read, lookup and query: how much gas is left, its inputs, an account, its own storage, a preimage, a request.",
        lessons: ["16.1", "16.2", "16.4", "16.5", "16.8", "16.9"],
      },
      change: {
        kind: "step",
        name: "Make a change",
        says: "grow_heap, write, solicit and forget: more memory, a stored value, asking for data or letting it go. Each change to storage is paid for with a deposit.",
        lessons: ["16.3", "16.5", "16.9"],
      },
      resume: {
        kind: "step",
        name: "Resume",
        says: "Put the answer in φ₇, the register r7, and carry on from the next instruction.",
        lessons: ["16.1"],
      },
      collapse: {
        kind: "step",
        name: "Keep it, or roll it back",
        says: "When the program stops, a halt keeps everything it did. A panic or running out of gas goes back to its last checkpoint.",
        lessons: ["16.6"],
      },
      result: {
        kind: "thing",
        name: "An accumulation",
        says: "The service's state after its turn, and the gas it used.",
        example: "thirteen services in twelve official vectors, matching to the last unit of gas",
        lessons: ["16.3", "16.6", "16.9"],
      },
    },
  },
  {
    part: 17,
    rows: [["reports"], ["wait"], ["budget"], ["round"], ["transfers", "privileges", "lifecycle"], ["merge"], ["yields", "provisions"], ["root"], ["after"]],
    walk: ["reports", "wait", "budget", "round", "transfers", "privileges", "lifecycle", "merge", "yields", "provisions", "root", "after"],
    cards: {
      reports: {
        kind: "thing",
        name: "Finished work",
        says: "The block's newly available work-reports from Part 11, each carrying its digests for the services that asked for the work.",
        lessons: ["17.1"],
      },
      wait: {
        kind: "step",
        name: "Wait for what comes first",
        says: "A report whose prerequisites haven't been accumulated yet waits in the ready queue, ω. The accumulated history, ξ, remembers what's done, so the waiting ones unlock in the right order.",
        lessons: ["17.2"],
      },
      budget: {
        kind: "step",
        name: "Fit the gas budget",
        says: "A block's accumulation has so much gas. Each round takes the reports that fit, the rest wait for the next, and leftover gas carries over.",
        lessons: ["17.9"],
      },
      round: {
        kind: "step",
        name: "Run a round",
        says: "Every service with work accumulates side by side, all starting from the same state: Part 16's run, once for each service.",
        lessons: ["17.1", "17.4"],
      },
      transfers: {
        kind: "thing",
        name: "Transfers",
        says: "Money one service sends another, with a 128-byte memo. It leaves at once, and arrives in the next round, before the receiver's code runs.",
        lessons: ["17.3", "17.4"],
      },
      privileges: {
        kind: "thing",
        name: "Privileges",
        says: "Rights a few services hold: the manager, each core's assigner, the delegator who picks the next validators, and the services that accumulate every block. bless sets them all; designate picks the validators.",
        lessons: ["17.5", "17.6", "17.13"],
      },
      lifecycle: {
        kind: "thing",
        name: "Services come and go",
        says: "A service can create another, upgrade its own code, or be ejected for good by the service it named, its balance passed on.",
        lessons: ["17.7", "17.8", "17.10"],
      },
      merge: {
        kind: "step",
        name: "Merge the round",
        says: "Turn every run's version of the state into one. For a privilege, the manager's change wins first, then the holder's.",
        lessons: ["17.6", "17.7"],
      },
      yields: {
        kind: "thing",
        name: "Yields",
        says: "A hash each run may hand the chain at its end, for other chains to check.",
        lessons: ["17.11"],
      },
      provisions: {
        kind: "thing",
        name: "Provisions",
        says: "Preimages one service handed another during its run, delivered at the end of the round.",
        lessons: ["17.12"],
      },
      root: {
        kind: "step",
        name: "Commit to the outputs",
        says: "Sort the block's yields, and fold them into one Keccak Merkle root: the accumulation root Part 9 adds to the belt.",
        lessons: ["17.11"],
      },
      after: {
        kind: "thing",
        name: "The state after accumulation",
        says: "Every service's account, storage and privileges, as the block's work left them.",
        example: "all 63 official accumulate vectors pass, whole",
        lessons: ["17.13"],
      },
    },
  },
  {
    part: 18,
    rows: [["block"], ["tally"], ["validators", "cores", "services"], ["epoch", "pay"]],
    walk: ["block", "tally", "validators", "cores", "services", "epoch", "pay"],
    cards: {
      block: {
        kind: "thing",
        name: "A block's work",
        says: "Who made the block, the tickets and preimages in it, who guaranteed and assured what, and the work its reports carried and its services accumulated.",
        lessons: ["18.1"],
      },
      tally: {
        kind: "step",
        name: "Keep score",
        says: "Count it all up: for each validator, for each core and for each service.",
        lessons: ["18.1", "18.2"],
      },
      validators: {
        kind: "thing",
        name: "Each validator's tally",
        says: "What each validator did this epoch.",
        fields: ["blocks", "tickets", "pre_images", "pre_images_size", "guarantees", "assurances"],
        record: "18.1 ValidatorStats",
        lessons: ["18.1"],
      },
      cores: {
        kind: "thing",
        name: "Each core's scorecard",
        says: "What each core did in this block: the data it must keep available, how many assurances it got, and the work in its reports.",
        fields: ["da_load", "popularity", "imports", "extrinsic_count", "extrinsic_size", "exports", "bundle_size", "gas_used"],
        record: "18.2 CoreStats",
        lessons: ["18.2"],
      },
      services: {
        kind: "thing",
        name: "Each service's scorecard",
        says: "What each busy service did in this block: preimages it was given, the work refined for it, and what it accumulated.",
        fields: ["provided_count", "provided_size", "refinement_count", "refinement_gas_used", "imports", "extrinsic_count", "extrinsic_size", "exports", "accumulate_count", "accumulate_transfer_count", "accumulate_gas_used"],
        record: "18.2 ServiceStats",
        lessons: ["18.2"],
      },
      epoch: {
        kind: "step",
        name: "Start a new epoch's tally",
        says: "At a new epoch, this epoch's validator tallies become last epoch's, and the count starts again from zero.",
        lessons: ["18.1"],
      },
      pay: {
        kind: "step",
        name: "Pay who earned it",
        says: "JAM itself pays nobody. The tallies are there so that whoever does pay can see who earned it.",
        lessons: [],
        elsewhere: "Whoever pays the validators does this, reading the tallies. Your client only keeps them.",
      },
    },
  },
  {
    part: 19,
    rows: [["before", "block"], ["plan"], ["checks"], ["run"], ["after"], ["root", "refuse"]],
    walk: ["before", "block", "plan", "checks", "run", "after", "root", "refuse"],
    cards: {
      before: {
        kind: "thing",
        name: "The state before",
        says: "The whole state at once, read from its keys and values into every component, accounts and all.",
        lessons: ["19.2", "19.3"],
      },
      block: {
        kind: "thing",
        name: "The next block",
        says: "A real block from an official trace, read with Part 4's codec.",
        lessons: ["19.4"],
      },
      plan: {
        kind: "step",
        name: "Plan the import: Υ",
        says: "Write down which value is made from which, and group the steps into waves whose ingredients are all ready.",
        lessons: ["19.1"],
      },
      checks: {
        kind: "step",
        name: "Check the header first",
        says: "Before anything else runs: its parent is the newest block the state remembers, its state root is the state's, its slot comes later, and its extrinsic hash is its extrinsic's.",
        lessons: ["19.4"],
      },
      run: {
        kind: "step",
        name: "Run every step, in order",
        says: "Safrole, disputes, assurances, guarantees, accumulation, statistics: every piece from Parts 5 to 18, in the Gray Paper's order.",
        lessons: ["19.4", "19.5"],
      },
      after: {
        kind: "thing",
        name: "The state after",
        says: "Every component written back as keys and values, ready for the next block.",
        lessons: ["19.2", "19.5"],
      },
      root: {
        kind: "step",
        name: "Check the root, and go on",
        says: "Its state root must be the trace's. Then import the next block onto the state your client just made.",
        example: "the first 100 blocks of all eight traces: 800 blocks, every root right",
        lessons: ["19.4", "19.6"],
      },
      refuse: {
        kind: "step",
        name: "Refuse a bad block",
        says: "A block that breaks any rule is refused whole, and the state is left as it was.",
        example: "1,406 of the 1,428 official vectors pass whole",
        lessons: ["19.6"],
      },
    },
  },
  {
    part: 20,
    rows: [["fuzzer"], ["frames"], ["speak"], ["target"], ["answer"], ["session"], ["image"]],
    walk: ["fuzzer", "frames", "speak", "target", "answer", "session", "image"],
    cards: {
      fuzzer: {
        kind: "step",
        name: "The fuzzer sends blocks",
        says: "The conformance fuzzer makes blocks, breaks some on purpose, sends them to your client, and compares every state root it gets back.",
        lessons: [],
        elsewhere: "The official conformance fuzzer does this: a separate program that talks to your client.",
      },
      frames: {
        kind: "thing",
        name: "Frames on a socket",
        says: "Messages on a Unix socket, a file two programs share, each with its length in front so the reader knows where it ends.",
        lessons: ["20.1"],
      },
      speak: {
        kind: "step",
        name: "Read and write every message",
        says: `The handshake, then a state to start from, blocks to import, roots to answer with, states to hand over, and errors.`,
        example: FUZZ_MESSAGES.join(", "),
        lessons: ["20.1"],
      },
      target: {
        kind: "thing",
        name: "A fuzz target",
        says: "Your client, listening on the socket, keeping every state it makes so a block can be imported onto any of them.",
        lessons: ["20.2"],
      },
      answer: {
        kind: "step",
        name: "Import and answer",
        says: "Import each block onto the state the fuzzer names, and answer with the new root, or with an error for a block that must be refused.",
        lessons: ["20.2"],
      },
      session: {
        kind: "step",
        name: "Run a session",
        says: "A small fuzzer of your own, over a real socket: the handshake, genesis, then block after block.",
        example: "the hardest trace: a hundred blocks, three refused",
        lessons: ["20.3"],
      },
      image: {
        kind: "thing",
        name: "Ready to be fuzzed",
        says: "Packaged the way the official fuzzer starts targets: a Docker image, set up by environment variables.",
        example: "JAM_FUZZ=1 JAM_FUZZ_SPEC=tiny",
        lessons: ["20.4"],
      },
    },
  },
];

export const flowOf = (part: number): Flow | undefined => FLOWS.find((f) => f.part === part);
