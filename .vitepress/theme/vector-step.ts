// Lesson 5.3's vector, step by step: which fields of assurances_with_bad_signature-1.json the
// tests read, which they leave for later lessons, and the test itself one assurance at a
// time: its validator_index picks the key, the message is built, the signature checked.
// tools/widget-vector-step.test.ts checks every step against the lesson's code and output.

import { ASSURANCES, ED25519_KEYS } from "./assurance-vector.ts";
import { H } from "./hash.ts";
import { ascii, verify } from "./sign-check.ts";

export const FILE = "vectors/stf/assurances/tiny/assurances_with_bad_signature-1.json";
const fromHex = (hex: string): number[] => (hex.slice(2).match(/../g) ?? []).map((b) => parseInt(b, 16));
export const short = (hex: string, head = 8): string => (hex.length > head + 6 ? `${hex.slice(0, head + 2)}…` : hex);
const hex = (b: number[]) => `0x${b.map((x) => x.toString(16).padStart(2, "0")).join("")}`;

/** One assurance, checked as assuranceSigned does: the key its validator_index names, the
 *  message (jam_available, then the hash of anchor and bitfield), and the signature's verdict. */
export interface Step { index: number; validator: number; key: string; hashed: string; message: string; messageBytes: number; signature: string; valid: boolean }

export const STEPS: Step[] = ASSURANCES.map((a, index) => {
  const key = ED25519_KEYS[a.validator_index];
  const hashed = H([...fromHex(a.anchor), ...fromHex(a.bitfield)]);
  const message = [...ascii("jam_available"), ...hashed];
  return {
    index, validator: a.validator_index, key, hashed: hex(hashed), message: hex(message), messageBytes: message.length,
    signature: a.signature, valid: verify(fromHex(key), message, fromHex(a.signature)),
  };
});

/** The vector's fields: what the tests read now, and where the rest is read. */
export interface Field { path: string; what: string; read: string | null }
export const FIELDS: Field[] = [
  { path: "input.assurances[i].anchor", what: "the block the assurance is about", read: "5.3: signed, in the message" },
  { path: "input.assurances[i].bitfield", what: "one bit per core: I hold my pieces", read: "5.3: signed, in the message" },
  { path: "input.assurances[i].validator_index", what: "who made it", read: "5.3: picks the key" },
  { path: "input.assurances[i].signature", what: "64 bytes of Ed25519", read: "5.3: checked" },
  { path: "input.slot", what: "the block's slot", read: null },
  { path: "input.parent", what: "the parent block's hash", read: null },
  { path: "pre_state.curr_validators[i].ed25519", what: "each validator's signing key", read: "5.3: checks the signature" },
  { path: "pre_state.curr_validators[i].bandersnatch, .bls, .metadata", what: "its other keys", read: null },
  { path: "pre_state.avail_assignments", what: "the report waiting on each core", read: null },
  { path: "pre_state.post_validators", what: "the validators after the block", read: null },
  { path: "output", what: "the vector's verdict: err bad_signature", read: null },
  { path: "post_state", what: "the state after the block", read: null },
];
/** Where a field the tests skip today is read. */
export const LATER: Record<string, string> = {
  "input.slot": "11.2, timeouts",
  "input.parent": "11.3: an anchor must be the parent",
  "pre_state.curr_validators[i].bandersnatch, .bls, .metadata": "never by assurances: Part 8, BEEFY, the network",
  "pre_state.avail_assignments": "11.1: which cores have a report",
  "pre_state.post_validators": "11.2",
  "output": "11.3: your verdict must match",
  "post_state": "11.2 and 11.3",
};
