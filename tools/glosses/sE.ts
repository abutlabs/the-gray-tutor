// The symbols Appendix E, general merklization first uses, in plain words (gray-paper-glosses.ts says how a
// key is made from them). Each entry: how to say it aloud, and what it means, in a line a
// reader new to the paper can follow; "skip" for typography a key needn't explain.

import type { Glosses } from "../gray-paper-glosses.ts";

export const SE: Glosses = {
  // \mathcal{J}_{x}
  // paper: The justification path to a specific 2^x size page of a constant-depth Merkle tree.
  fnmerklejustsubpath: { say: "J sub x", means: "the proof for one page of 2^x leaves in a constant-depth tree: the hashes beside its path, from the root down to the page" },
  // \mathcal{L}_{x}
  // paper: The 2^x size page function for a constant-depth Merkle tree.
  fnmerklesubtreepage: { say: "L sub x", means: "one page of 2^x leaves of a constant-depth tree: each item, hashed with the ASCII bytes of the word leaf in front" },
  // \mathcal{A}
  // paper: The Merkle mountain range append function.
  fnmmrappend: { say: "A", means: "append to a Merkle mountain range: its peaks and one more item in, the new peaks out" },
  // \left\{ \,\begin{aligned}x\vphantom{x'_i}\end{aligned} \right.
  deffunc: { say: "as follows", means: "a brace grouping lines that hold together: for a function, its type on top, then what each input becomes" },
  // \mathcal{E}_{M}
  fnmmrencode: { say: "E sub M", means: "a Merkle mountain range's encoding: its peaks, each maybe empty, with their count in front" },
  // \mathcal{M}_R
  fnmmrsuperpeak: { say: "M sub R", means: "the super-peak: a mountain range's peaks hashed down to one 32-byte root, with Keccak" },
};
