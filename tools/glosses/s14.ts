// The symbols §14, Work Packages and Work Reports first uses, in plain words (gray-paper-glosses.ts says how a
// key is made from them). Each entry: how to say it aloud, and what it means, in a line a
// reader new to the paper can follow; "skip" for typography a key needn't explain.

import type { Glosses } from "../gray-paper-glosses.ts";

export const S14: Glosses = {
  // \mathbb{J}
  // paper: The set of data segments, equivalent to \mathbb{B}_{\mathsf{W}_G}.
  segment: { say: "J", means: "the set of segments: blobs of exactly W_G = 4,104 bytes, the unit of import and export" },
  // \mathbb{P}
  // paper: The set of work-\mathbb{P}ackages.
  workpackage: { say: "P", means: "the set of work-packages: up to 16 work-items for one core, with their authorizer and context" },
  // \mathbb{W}
  // paper: The set of \mathbb{W}ork items.
  workitem: { say: "W", means: "the set of work-items: one job for one service, with its payload, gas limits, imports, extrinsics and export count" },
  // \mathbf{j}
  "wp¬authtoken": { say: "j", means: "the authorization token: a blob the authorizer's code reads, a signature say (`authorization`)" },
  // h
  "wp¬authcodehost": { say: "h", means: "the service whose preimages hold the authorizer's code (`auth_code_host`)" },
  // u
  "wp¬authcodehash": { say: "u", means: "the hash of the authorizer's code (`auth_code_hash`)" },
  // \mathbf{f}
  "wp¬authconfig": { say: "f", means: "the authorizer's configuration blob, its settings (`authorizer_config`)" },
  // \mathbf{c}
  "wp¬context": { say: "c", means: "the package's refinement context" },
  // \mathbf{w}
  "wp¬workitems": { say: "w", means: "the package's work-items: 1 to 16" },
  // s
  "wi¬serviceindex": { say: "s", means: "the service the item is for" },
  // c
  "wi¬codehash": { say: "c", means: "the code hash the item expects its service to have" },
  // \mathbf{y}
  "wi¬payload": { say: "y", means: "the item's payload: the input its refine reads" },
  // g
  "wi¬refgaslimit": { say: "g", means: "the gas refine may use on this item" },
  // a
  "wi¬accgaslimit": { say: "a", means: "the gas accumulate may use on this item's result" },
  // \mathbf{i}
  "wi¬importsegments": { say: "i", means: "the segments the item imports: each a segments root (or a package hash) and an index" },
  // \mathbf{x}
  "wi¬extrinsics": { say: "x", means: "the item's extrinsics: each a blob's hash and length" },
  // e
  "wi¬exportcount": { say: "e", means: "how many segments the item says it will export" },
  // \boxplus
  boxplus: { say: "boxed", means: "H⊞ marks a hash as a package's hash, to be swapped for that package's segments root" },
  // \mathbf{p}
  wpX: { say: "p", means: "a work-package" },
  // \mathbf{w}
  wiX: { say: "w", means: "a work-item" },
  // \mathsf{W}_X
  // paper: [3,072] The maximum number of exports in a work-package.
  Cmaxpackageexports: { say: "W sub X", means: "the most segments a package may export: 3,072" },
  // \mathsf{W}_M
  // paper: [3,072] The maximum number of imports in a work-package.
  Cmaxpackageimports: { say: "W sub M", means: "the most segments a package may import: 3,072" },
  // \mathsf{T}
  // paper: [128] The maximum number of extrinsics in a work-package.
  Cmaxpackagexts: { say: "T", means: "the most extrinsics a package may use: 128" },
  // \Big
  Big: "skip",
  // \mathsf{W}_B
  // paper: [13,791,360] The maximum size of the concatenated variable-size blobs, extrinsics and imported segments of a work-package, in octets.
  Cmaxbundlesize: { say: "W sub B", means: "the most bytes of blobs, extrinsics and imports a package may bring: 13,791,360" },
  // \mathsf{W}_F
  // paper: [\Csegmentsize + 32\ceil{\log_2(\Cmaxpackageexports)}] The additional footprint in the Audits DA of a single imported segment.
  Csegmentfootprint: { say: "W sub F", means: "the room one imported segment takes in a bundle, with its proof: 4,104 + 32 × 12 = 4,488 bytes" },
  // \log
  log: { say: "log", means: "the logarithm: log₂ n is the power of 2 that gives n, so log₂ 4,096 is 12" },
  // \mathsf{G}_R
  // paper: [5,000,000,000] The gas allocated to invoke a work-package's Refine logic.
  Cpackagerefgas: { say: "G sub R", means: "the most gas refining a package may use: 5,000,000,000" },
  // C
  itemtodigest: { say: "C", means: "item to digest: makes a work-digest from a work-item, its result and the gas it used" },
  // s
  "¬serviceindex": { say: "s", means: "a service's id" },
  // c
  "¬codehash": { say: "c", means: "a code hash" },
  // \mathbf{y}
  "¬payload": { say: "y", means: "a payload: the input to refine" },
  // a
  "wp¬authorizer": { say: "a", means: "the package's authorizer: the hash of its code hash and configuration" },
  // \mathbf{u}
  "wp¬authcode": { say: "u", means: "the authorizer's code, found in the code host's preimages" },
  // \mathbf{m}
  "wp¬metadata": { say: "m", means: "the metadata stored in front of the code in its preimage" },
  // P
  pagedproofs: { say: "P", means: "paged proofs: for every 64 exported segments, a page of their hashes and a proof, itself one segment" },
  // \mathcal{P}_{x}\left(y\right)
  // paper: The octet-array zero-padding function.
  zeropad: { say: "P sub n of", means: "zero-padding: the blob with zeros added until its length is a multiple of n" },
  // \mathcal{J}_{x}\left(y\right)
  merklejustsubpath: { say: "J sub x of", means: "a Merkle proof: the sibling hashes from a leaf, or a page of leaves, up to the root" },
  // \mathcal{L}_{x}\left(y\right)
  merklesubtreepage: { say: "L sub x of", means: "a page of leaves: the hashes of the 64 segments in page i" },
  // \Xi
  // paper: The work-report computation function.
  computereport: { say: "Xi", means: "the work-report computation: from a package, a core, a lookup and a shard count, a report or an error" },
  // \overline{\mathbf{e}}
  allexports: { say: "e bar", means: "every segment the package's items exported, item after item" },
  // {}^\text{T}
  transpose: { say: "transposed", means: "rows become columns: a list of pairs becomes a pair of lists" },
  // I
  countupexports: { say: "I", means: "refines item j: its result, the gas it used and its exports, with an error swapped in where one is due" },
  // m
  "local¬theitem": { say: "m", means: "the item being refined: item j of the package" },
  // S
  importsegmentdata: { say: "S", means: "the segments an item imports, fetched and matched to their roots" },
  // \ell
  ell: { say: "ell", means: "a length defined nearby: in §14 the segments exported before an item; in Appendix A, the bytes after an opcode" },
  // X
  extrinsicdata: { say: "X", means: "an item's extrinsic blobs, found by their hashes and lengths" },
  // L
  segrootlookup: { say: "L", means: "turns an import's reference into a segments root: kept as it is, or looked up by package hash" },
  // J
  justifysegmentdata: { say: "J", means: "for each imported segment, the proof that it is the one its root commits to" },
  // \mathbf{b}
  segsX: { say: "b", means: "all the segments under one segments root: the export list an import points into" },
  // \mathcal{M}\left(x\right)
  // paper: The constant-depth binary Merklization function.
  merklizecd: { say: "M of", means: "the constant-depth binary Merkle root of a list of segments" },
  // B
  // paper: The bundle assembly function.
  makebundle: { say: "B", means: "bundle assembly: the package, its extrinsics, its imports and their proofs, encoded as one blob" },
  // A
  newavailabilityspecifier: { say: "A", means: "the availability specifier: from a package hash, bundle, exports and shard count, the report's spec" },
  // \clubsuit
  clubsuit: { say: "club", means: "x♣: one hash (or root) for each validator's shard of x" },
  // \mathcal{C}^{x}_{y}\left(z\right)
  // paper: The erasure-coding function for v validators and n pieces.
  erasurecode: { say: "C, v shards, k pieces, of", means: "erasure-code: cut data of k pieces into v shards, any D(v) of which rebuild it" },
  // \mathcal{M}_B^\#\left(x\right)
  merklizewbmany: { say: "M sub B, for each", means: "the simple binary Merkle root of each list in a sequence" },
  // \mathcal{C}^{x\#}_{y}\left(z\right)
  erasurecodemany: { say: "C for each, v shards, k pieces, of", means: "erasure-code each item of a sequence the same way" },
  // \mathcal{D}
  // paper: The original-chunk-count function.
  fnecoriginalshards: { say: "D", means: "how many shards rebuild the data: 342 of 1,023 on full, 3 of 6 on tiny" },
  // \mathcal{M}
  fnmerklizecd: { say: "M", means: "the constant-depth binary Merkle root function" },
  // \mathcal{C}^{x}_{y}
  fnerasurecode: { say: "C", means: "the erasure-coding function" },
  // \mathcal{P}_{x}
  fnzeropad: { say: "P", means: "the zero-padding function" },
};
