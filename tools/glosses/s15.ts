// The symbols §15 to §22, beyond block import first uses, in plain words (gray-paper-glosses.ts says how a
// key is made from them). Each entry: how to say it aloud, and what it means, in a line a
// reader new to the paper can follow; "skip" for typography a key needn't explain.

import type { Glosses } from "../gray-paper-glosses.ts";

export const S15: Glosses = {
  // \mathbf{q}
  "local¬reports": { say: "q", means: "the reports an auditor may have to audit: one slot per core, holding the report that just became available there, or nothing" },
  // s
  "local¬seed": { say: "s", means: "an auditor's VRF signature: its own lottery ticket for which reports to audit, which anyone can check and nobody could guess" },
  // \mathsf{X}_U
  Xaudit: { say: "X sub U", means: "the 9 bytes `jam_audit`, signed in front of an auditor's lottery ticket" },
  // \mathbf{a}
  "local¬tranche": { say: "a", means: "the reports an auditor audits in one tranche: a₀ those its ticket picks from the first ten cores of its shuffle" },
  // \mathsf{A}
  // paper: [8] The period, in seconds, between audit tranches.
  Ctrancheseconds: { say: "A", means: "the time between audit tranches: 8 seconds" },
  // \mathsf{X}_I
  Xannounce: { say: "X sub I", means: "the 12 bytes `jam_announce`, signed in front of an auditor's promise of which reports it will audit" },
  // \mathsf{F}
  // paper: [2] The audit bias factor, the expected number of additional validators who will audit a work-report in the following tranche for each no-show in the previous.
  Cauditbiasfactor: { say: "F", means: "the audit bias factor: about 2 more auditors for each one who promised and didn't vote" },
  // \mathcal{R}^{x}_{y}
  fnecrecover: { say: "R", means: "erasure recovery: any D(v) chunks, with which validator each came from, in; the original data out" },
  // \ref
  ref: "skip",
  // \bigvee
  bigvee: { say: "any of", means: "at least one of the conditions under it is true" },
  // \emptyset
  emptyset: { say: "empty", means: "the empty set: no items at all" },
  // \mathbf{U}
  // paper: The audit condition, equal to \top once the block is audited.
  isaudited: { say: "U", means: "the audit condition: true once every report the block made available is audited" },
  // \mathbf{F}_{x}
  // paper: The \textsc{Beefy} signed commitment of validator v.
  accoutcommitment: { say: "F sub v", means: "validator v's BEEFY commitment: its BLS signature on the newest root of accumulation outputs" },
  // \mathsf{X}_B
  Xbeefy: { say: "X sub B", means: "the 9 bytes `jam_beefy`, signed in front of the root a BEEFY commitment vouches for" },
  // \natural
  final: { say: "natural", means: "♮ marks the latest final block: B♮ is it, H♮ its header" },
  // \flat
  best: { say: "flat", means: "♭ marks the best block, the one a validator builds on and votes for: B♭ is it, H♭ its header" },
  // \owns
  owns: { say: "contains", means: "the left side has the right as one of its items: x ∋ y is y ∈ x turned round" },
};
