// The symbols Appendix H, erasure coding first uses, in plain words (gray-paper-glosses.ts says how a
// key is made from them). Each entry: how to say it aloud, and what it means, in a line a
// reader new to the paper can follow; "skip" for typography a key needn't explain.

import type { Glosses } from "../gray-paper-glosses.ts";

export const SH: Glosses = {
  // \text{split}_{x}
  spl: { say: "split n of", means: "cuts a blob into equal slices of n bytes each" },
  // \cdots
  cdots: "skip",
  // \text{join}
  join: { say: "join", means: "glues a sequence of blobs back into one, end to end" },
  // \mathcal{R}^{x}_{y}\left(z\right)
  // paper: The erasure-coding recovery function for v validators and n pieces.
  ecrecover: { say: "R of", means: "recovers the D(v) message words from any D(v) of the v coded words, given which validator each came from" },
  // \mathbb{F}
  // paper: The set of finite fields.
  finitefield: { say: "F", means: "a finite field: a fixed set of values that add, subtract, multiply and divide without leaving it; 𝔽 with 2¹⁶ has one value per two-byte word" },
  // \tilde
  tilde: { say: "tilde", means: "x̃: x as a value of the erasure code's field, in the basis its table lists" },
  // \ldots
  ldots: "skip",
  // \widetilde
  widetilde: { say: "tilde", means: "x̃: x as a value of the erasure code's field, in the basis its table lists" },
  // \vdots
  vdots: "skip",
};
