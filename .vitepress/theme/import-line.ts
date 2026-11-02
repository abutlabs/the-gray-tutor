// Lesson 0.6's first widget: a block import end to end, bytes in to state root out, as the
// stations one block passes through in our client. Station 5 is Υ, the state transition; its
// steps are import-gantt.ts's CALLS, the order our importBlock calls them in, so the two
// widgets can't disagree. A wrong block stops at the station that refuses it, and the state
// stays as it was. The numbers are a real block's: the safrole trace's first, which bin/import.ts
// imports in lesson 19.4. tools/widget-import-line.test.ts checks every name here against the
// lessons, the reference client and the vectors.

import { CALLS } from "./import-gantt.ts";

/** Where a station lives in our client: a src file, the functions, the lesson that writes
 *  them, and the npm script that shows it running. */
export type Code = { file: string; fns: string[]; lesson: string; run?: string };

export type Station = {
  id: string;
  title: string;
  gp: string; // the Gray Paper's section, or the protocol it follows
  does: string;
  refuses: string[]; // the errors it refuses a block with, as the reference names them
  ours: Code;
};

/** One of Υ's steps: the call, what it checks, and where the Gray Paper says so. */
export type Step = { call: string; does: string; gp: string; refuses: string[]; lesson: string };

export const STATIONS: Station[] = [
  {
    id: "bytes",
    title: "Bytes arrive",
    gp: "fuzz-proto",
    does: "the fuzzer sends an ImportBlock message: one block, as bytes",
    refuses: [],
    ours: { file: "src/fuzz.ts", fns: ["MessageCodec"], lesson: "20-facing-the-fuzzer/01-speaking-the-protocol", run: "fuzz" },
  },
  {
    id: "decode",
    title: "Decode the block",
    gp: "App. C",
    does: "the bytes become a header and an extrinsic of five lists: tickets, preimages, guarantees, assurances, disputes",
    refuses: [],
    ours: { file: "src/block.ts", fns: ["Block"], lesson: "04-blocks/07-the-block" },
  },
  {
    id: "parent",
    title: "Find the state before",
    gp: "§5",
    does: "the header names its parent by hash; the state before is the one the parent's import left",
    refuses: ["the parent block is unknown"],
    ours: { file: "src/target.ts", fns: ["answer"], lesson: "20-facing-the-fuzzer/02-a-target", run: "target" },
  },
  {
    id: "header",
    title: "Check the header",
    gp: "§5",
    does: "against the state before: its parent is the newest block, its prior state root is that state's root, its slot is later, its extrinsic hash is the extrinsic's",
    refuses: ["bad_parent", "bad_parent_state_root", "bad_slot", "bad_extrinsic_hash"],
    ours: { file: "src/import.ts", fns: ["checkHeader"], lesson: "19-block-import/04-importing-a-block" },
  },
  {
    id: "steps",
    title: "Run the state transition, Υ",
    gp: "§4.2, §6–§13",
    does: "each step makes its part of the new state from the block and checks its own part of the block on the way",
    refuses: [], // its steps', below
    ours: { file: "src/import.ts", fns: ["importBlock"], lesson: "19-block-import/04-importing-a-block", run: "import" },
  },
  {
    id: "all",
    title: "All or nothing",
    gp: "§4",
    does: "every station passed: the new state stands. Any refusal and nothing changes: the answer is an Error and the state before stays, still a parent for another block",
    refuses: [],
    ours: { file: "src/target.ts", fns: ["answer"], lesson: "20-facing-the-fuzzer/02-a-target" },
  },
  {
    id: "root",
    title: "Hash the new state into its root",
    gp: "App. D",
    does: "every key and value of the new state, hashed into one 32-byte root",
    refuses: [],
    ours: { file: "src/trie.ts", fns: ["stateRoot"], lesson: "06-state-and-merklization/01-the-state-trie", run: "state" },
  },
  {
    id: "answer",
    title: "Keep it and answer",
    gp: "fuzz-proto",
    does: "the new state is kept under this block's header hash, for a child to name, and the root goes back in a StateRoot message",
    refuses: [],
    ours: { file: "src/target.ts", fns: ["answer"], lesson: "20-facing-the-fuzzer/02-a-target", run: "target" },
  },
];

/** Υ's steps, for every call after checkHeader (station 4): the Gray Paper's section, and
 *  some of the errors each refuses with. Accumulation and the rest refuse nothing. */
const DETAIL: Record<string, Omit<Step, "call" | "does">> = {
  judgeDisputes: { gp: "§10", refuses: ["bad_vote_split", "bad_votes_count"], lesson: "10-disputes/05-bad-culprits-and-faults" },
  runSafrole: {
    gp: "§6",
    refuses: ["bad_seal", "bad_entropy_source", "bad_epoch_mark", "bad_tickets_mark", "bad_offenders_mark"],
    lesson: "08-safrole/09-seals",
  },
  takeAssurances: { gp: "§11", refuses: ["core_not_engaged", "bad_attestation_parent"], lesson: "11-assurances/03-bad-assurances" },
  takeGuarantees: { gp: "§11", refuses: ["core_engaged", "bad_signature"], lesson: "12-guarantees/04-bad-guarantees" },
  accumulateBlock: { gp: "§12, App. A–B", refuses: [], lesson: "17-accumulation/01-a-blocks-accumulation" },
  nextState: { gp: "§7, §8, §13", refuses: [], lesson: "19-block-import/04-importing-a-block" },
  providePreimages: { gp: "§12", refuses: [], lesson: "14-services/01-providing-preimages" },
};

export const STEPS: Step[] = CALLS.filter((c) => c.call !== "checkHeader")
  .map((c) => ({ call: c.call, does: c.does, ...DETAIL[c.call] }));

/** A block that's wrong in one way, and the error our client refuses it with. */
export type Bad = { id: string; say: string; error: string };

export const BAD_BLOCKS: Bad[] = [
  { id: "parent", say: "names a parent the target never saw", error: "the parent block is unknown" },
  { id: "root", say: "quotes the wrong prior state root", error: "bad_parent_state_root" },
  { id: "slot", say: "has a slot no later than its parent's", error: "bad_slot" },
  { id: "hash", say: "has an extrinsic its hash doesn't match", error: "bad_extrinsic_hash" },
  { id: "split", say: "carries a verdict 3 votes of 5 valid", error: "bad_vote_split" },
  { id: "seal", say: "is sealed by the wrong validator", error: "bad_seal" },
  { id: "core", say: "guarantees a report onto a busy core", error: "core_engaged" },
];

/** Where a block is refused: the station, and for Υ the step, that lists its error. */
export function refusedAt(error: string): { station: string; step?: string } {
  const station = STATIONS.find((s) => s.refuses.includes(error));
  if (station) return { station: station.id };
  const step = STEPS.find((s) => s.refuses.includes(error));
  if (!step) throw new Error(`nothing refuses ${error}`);
  return { station: "steps", step: step.call };
}

/** The real block the line carries when it's valid: the safrole trace's first (lesson 19.4),
 *  its header's values and the root its import makes, which block 2's header quotes. */
export const TRACE = {
  vector: "traces/safrole/00000001.json",
  slot: 1,
  parent: "0x245becfe",
  priorRoot: "0xd6e78dc0",
  extrinsicHash: "0x189d15af",
  author: 0,
  lists: "all five empty",
  root: "0x48dc323d",
} as const;

/** What the station `at` has to show for the valid block: the values it reads or makes. */
export function seen(at: string): string {
  const t = TRACE;
  switch (at) {
    case "bytes": return `ImportBlock: one block's bytes, ${t.vector}`;
    case "decode": return `header: slot ${t.slot}, author ${t.author}, parent ${t.parent}…; extrinsic: ${t.lists}`;
    case "parent": return `the state kept under ${t.parent}…, root ${t.priorRoot}…`;
    case "header": return `prior state root ${t.priorRoot}… = that state's root ✓, slot ${t.slot} > the old time ✓, extrinsic hash ${t.extrinsicHash}… ✓`;
    case "steps": return "τ′ = 1, η′ from the entropy source's VRF output, the sealers unchanged mid-epoch; nothing to judge, assure, guarantee or accumulate";
    case "all": return "nothing refused it";
    case "root": return `the new state's root: ${t.root}…`;
    default: return `StateRoot ${t.root}… — block 2's header quotes it as its prior state root`;
  }
}
