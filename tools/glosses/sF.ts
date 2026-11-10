// The symbols Appendix F, shuffling first uses, in plain words (gray-paper-glosses.ts says how a
// key is made from them). Each entry: how to say it aloud, and what it means, in a line a
// reader new to the paper can follow; "skip" for typography a key needn't explain.

import type { Glosses } from "../gray-paper-glosses.ts";

export const SF: Glosses = {
  // \mathcal{Q}_{x}
  fnseqfromhash: { say: "Q sub l", means: "numbers from a hash: l numbers of 4 bytes each, read from hashes of a 32-byte seed, for the shuffle" },
  // \mathcal{Q}_{x}\left(y\right)
  // paper: The numeric-sequence-from-hash function.
  seqfromhash: { say: "Q sub l of h", means: "l numbers drawn from the hash h: 4 bytes each, from the hashes of h with a counter after it" },
};
