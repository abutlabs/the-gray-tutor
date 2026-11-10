// The symbols Appendix C, the codec first uses, in plain words (gray-paper-glosses.ts says how a
// key is made from them). Each entry: how to say it aloud, and what it means, in a line a
// reader new to the paper can follow; "skip" for typography a key needn't explain.

import type { Glosses } from "../gray-paper-glosses.ts";

export const SC: Glosses = {
  // \to: no other part of the paper's glosses holds it, and (C.5) is the first formula a
  // reader meets it in
  to: { say: "to", means: "what goes in, to what comes out: A → B takes an A and gives a B", entry: "to" },
  // \mathcal{E}^{-1}_{}{x}
  fndecode: { say: "E inverse", means: "decoding: bytes back into the value they encode", entry: "decode" },
  // \mathord{\unicode{xBF}}x
  maybe: { say: "maybe", means: "¿x: the byte 0 if x is nothing (∅), or the byte 1 and then x" },
  // y\,\wr\,x
  orderby: { say: "sorted by", means: "[y ≀ x]: the items y, sorted by x, smallest first" },
  // \mathcal{E}_{P}\left(x\right)
  encodepreimages: { say: "E sub P of", means: "the preimages bag's bytes: its length, then each one's service (4 bytes) and its data with its length" },
  // \mathcal{E}_{G}\left(x\right)
  encodeguarantees: { say: "E sub G of", means: "the guarantees bag's bytes: its length, then each guarantee" },
  // \mathcal{E}_{E}\left(x\right)
  encodeepochmark: { say: "E sub E of", means: "the epoch mark's bytes: 0 if there is none; else 1, two entropy hashes and the keys with their length" },
  // \mathbf{x}
  wcX: { say: "x", means: "a refinement context: the anchor block and the lookup anchor a package was made against, and its prerequisites" },
  // \mathbf{x}
  asX: { say: "x", means: "an availability spec: a package's hash and length, its erasure root, shard count, segment root and segment count" },
  // O\left(x\right)
  encoderesult: { say: "O of", means: "a work result's bytes: 0 then the output with its length, or one byte from 1 to 6 naming the error" },
  // I^\#\left(x\right)
  encodeimportrefs: { say: "I hash of", means: "each import reference encoded with I, one after another" },
  // x
  stX: { say: "x", means: "a ticket: its 32-byte id and its attempt" },
  // x
  dxX: { say: "x", means: "a deferred transfer: from, to, amount, memo and gas, made by one service for another" },
  // \mathbf{x}
  otX: { say: "x", means: "an operand tuple: one work item's result, as accumulate reads it" },
  // \infty
  infty: { say: "infinity", means: "∞: in a work result, the program ran out of gas" },
  // I\left(x\right)
  encodeimportref: { say: "I of", means: "one import reference's bytes: a 32-byte hash, then the index in 2 bytes, its top bit set if the hash names a work-package" },
};
