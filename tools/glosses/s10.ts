// The symbols §10, Disputes first uses, in plain words (gray-paper-glosses.ts says how a
// key is made from them). Each entry: how to say it aloud, and what it means, in a line a
// reader new to the paper can follow; "skip" for typography a key needn't explain.

import type { Glosses } from "../gray-paper-glosses.ts";

export const S10: Glosses = {
  // \psi_G
  // paper: Work-reports judged to be correct.
  goodset: { say: "psi sub G", means: "the good set: hashes of every report a verdict found valid" },
  // \psi_B
  // paper: Work-reports judged to be incorrect.
  badset: { say: "psi sub B", means: "the bad set: hashes of every report a verdict found invalid" },
  // \psi_W
  // paper: Work-reports whose validity is judged to be unknowable.
  wonkyset: { say: "psi sub W", means: "the wonky set: hashes of every report whose verdict split, so nobody can tell" },
  // \mathbf{E}_V
  xtverdicts: { say: "E sub V", means: "the block's verdicts: each a report's hash, an epoch, and the judges' signed votes" },
  // \mathbf{E}_C
  xtculprits: { say: "E sub C", means: "the block's culprits: guarantors of a bad report, each with the guarantee they signed" },
  // \mathbf{E}_F
  xtfaults: { say: "E sub F", means: "the block's faults: judges who voted against a verdict, each with the vote they signed" },
  // \mathsf{N}_V
  // paper: [16] The maximum number of verdicts which may be included in a single extrinsic.
  Cmaxextrinsicverdicts: { say: "N sub V", means: "the most verdicts one block may carry: 16" },
  // \left\lfloor\frac{x}{y}\right\rfloor
  ffrac: { say: "x over y, rounded down", means: "whole-number division, the remainder dropped: ⌊7/3⌋ is 2" },
  // \bar{\mathbb{V}}
  edsignaturebase: { say: "V bar", means: "an Ed25519 signature: 64 bytes" },
  // \mathsf{N}_O
  // paper: [16] The maximum number each of culprits or faults which may be included in a single extrinsic.
  Cmaxextrinsicoffenses: { say: "N sub O", means: "the most culprits, and the most faults, one block may carry: 16 each" },
  // a
  "xv¬epochindex": { say: "a", means: "a verdict's epoch: this epoch's index or the one before, saying whose validators judged" },
  // \displaystyle
  displaystyle: "skip",
  // r
  "xv¬reporthash": { say: "r", means: "the hash of the work-report on trial" },
  // \mathbf{j}
  "xv¬judgments": { say: "bold j", means: "a verdict's judgments: the judges' signed votes, two thirds of the judges plus one" },
  // {}^{2}\!/_{3}
  twothirds: { say: "two thirds", means: "two thirds: ⌊⅔ · 6⌋ + 1 is 5 judgments on tiny, 683 of 1,023 on full" },
  // v
  "xvj¬validity": { say: "v", means: "a judgment's vote: ⊤ (true) the report is valid, ⊥ (false) it isn't" },
  // i
  "xvj¬judgeindex": { say: "i", means: "the judge's index in the validator set the verdict's epoch picks" },
  // s
  "xvj¬signature": { say: "s", means: "the judge's Ed25519 signature on the vote" },
  // \mathsf{X}_{x}
  Xvalidif: { say: "X sub v", means: "the signing prefix for vote v: X sub top for valid, X sub bottom for invalid" },
  // \mathsf{X}_\top
  Xvalid: { say: "X sub top", means: "the 9 bytes `jam_valid`, signed in front of a report's hash to vote it valid" },
  // \small
  small: "skip",
  // \texttt
  texttt: "skip",
  // \mathsf{X}_\bot
  Xinvalid: { say: "X sub bottom", means: "the 11 bytes `jam_invalid`, signed in front of a report's hash to vote it invalid" },
  // r
  "xc¬reporthash": { say: "r", means: "the hash of the bad report the culprit guaranteed" },
  // f
  "xc¬offenderindex": { say: "f", means: "the culprit's Ed25519 key: 32 bytes" },
  // s
  "xc¬signature": { say: "s", means: "the culprit's own guarantee signature on that report" },
  // \mathsf{X}_G
  Xguarantee: { say: "X sub G", means: "the 13 bytes `jam_guarantee`, signed in front of a report's hash to guarantee it" },
  // r
  "xf¬reporthash": { say: "r", means: "the hash of the report the fault voted on" },
  // v
  "xf¬validity": { say: "v", means: "the fault's vote: ⊤ valid or ⊥ invalid" },
  // f
  "xf¬offenderindex": { say: "f", means: "the fault's Ed25519 key: 32 bytes" },
  // s
  "xf¬signature": { say: "s", means: "the fault's own signature on that vote" },
  // \mathbf{v}
  verdicts: { say: "bold v", means: "this block's verdicts boiled down: each report's hash with ⊤ good, ⊥ bad or ∅ wonky" },
  // {}^{1}\!/_{3}
  onethird: { say: "one third", means: "one third: ⌊⅓ · 6⌋ is 2 votes on tiny, 341 on full" },
  // r
  "¬reporthash": { say: "r", means: "a work-report's hash" },
  // \mathbf{g}
  "aa¬guarantee": { say: "bold g", means: "the guarantee a core's pending report came with: the report and its guarantors' signatures" },
  // v
  "vs¬valid": { say: "v", means: "a verdict's outcome: ⊤ good, ⊥ bad or ∅ wonky" },
  // r
  "vs¬reporthash": { say: "r", means: "the judged report's hash" },
  // f
  "¬offenderindex": { say: "f", means: "an offender's Ed25519 key: 32 bytes" },
};
