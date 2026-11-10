// The symbols Appendix D, state merklization first uses, in plain words (gray-paper-glosses.ts says how a
// key is made from them). Each entry: how to say it aloud, and what it means, in a line a
// reader new to the paper can follow; "skip" for typography a key needn't explain.

import type { Glosses } from "../gray-paper-glosses.ts";

export const SD: Glosses = {
  // \mathcal{E}_{M}\left(x\right)
  mmrencode: { say: "E sub M of", means: "a Merkle mountain range's bytes: its count of peaks, then each peak as maybe (0, or 1 and the hash)" },
  // \left\{ \begin{aligned}x\end{aligned} \right\}{y}
  abracegroupboth: { say: "whichever of", means: "the value of the line inside whose condition holds" },
  // \mathbf{a}
  saX: { say: "a", means: "a service account: its code hash, balance, gas minimums, storage, preimages and the rest" },
};
