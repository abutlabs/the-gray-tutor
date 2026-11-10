// The symbols §7, Recent History first uses, in plain words (gray-paper-glosses.ts says how a
// key is made from them). Each entry: how to say it aloud, and what it means, in a line a
// reader new to the paper can follow; "skip" for typography a key needn't explain.

import type { Glosses } from "../gray-paper-glosses.ts";

export const S07: Glosses = {
  // \mathsf{H}
  // paper: [8] The size of recent history, in blocks.
  Crecenthistorylen: { say: "H", means: "how many recent blocks the state remembers: 8" },
  // \beta_B
  // paper: The Merkle mountain belt for accumulating Accumulation outputs.
  accoutbelt: { say: "beta sub B", means: "the accumulation output belt: one place per binary digit of the block count, each a peak or nothing" },
  // h
  "rh¬headerhash": { say: "h", means: "a recent block's header hash" },
  // s
  "rh¬stateroot": { say: "s", means: "a recent block's state root: the state just after it; zeros until the next block fills it in" },
  // b
  "rh¬accoutlogsuperpeak": { say: "b", means: "the belt's super-peak just after that block: the vectors' `beefy_root`" },
  // t
  "rh¬timeslot": { say: "t", means: "a recent block's timeslot" },
  // \mathbf{p}
  "rh¬reportedpackagehashes": { say: "bold p", means: "the packages a block reported: each package's hash, mapped to the root of the segments it exports" },
  // \mathbb{N}_S
  // paper: The set from which service indices are drawn. Equivalent to \mathbb{N}_{2^{32}}.
  serviceid: { say: "N sub S", means: "a service id: a whole number below 2³², 4 bytes" },
  // \mathcal{M}_B
  fnmerklizewb: { say: "M sub B", means: "the well-balanced Merkle root: one hash for a list, made by halving it until single items are left" },
  // \mathcal{A}\left(x\right)
  mmrappend: { say: "A of", means: "append one item to a belt, merging equal mountains on the way, as adding 1 carries in binary" },
  // \mathcal{M}_B\left(x\right)
  // paper: The well-balanced binary Merklization function.
  merklizewb: { say: "M sub B of", means: "the well-balanced Merkle root of a list: one hash for all its items" },
  // \mathcal{H}_K
  fnkeccak: { say: "H sub K", means: "Keccak-256, Ethereum's hash: 32 bytes, for what other chains must check" },
  // \mathcal{M}_R\left(x\right)
  mmrsuperpeak: { say: "M sub R of", means: "the super-peak: one hash for a whole belt, its peaks folded together under the word `peak`" },
  // \mathbf{s}
  "wr¬avspec": { say: "bold s", means: "a report's availability spec: the package's hash, its bundle's length, and the roots of its pieces and of the segments it exports" },
  // p
  "as¬packagehash": { say: "p", means: "the work-package's hash" },
  // e
  "as¬segroot": { say: "e", means: "the root of the segments a package exports" },
  // \beta^\dagger
  recentpostparentstaterootupdate: { say: "beta dagger", means: "recent history midway: the newest entry's state root filled in from this block's header" },
};
