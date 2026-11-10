// The symbols §11, Reporting and Assurance first uses, in plain words (gray-paper-glosses.ts says how a
// key is made from them). Each entry: how to say it aloud, and what it means, in a line a
// reader new to the paper can follow; "skip" for typography a key needn't explain.

import type { Glosses } from "../gray-paper-glosses.ts";

export const S11: Glosses = {
  // \mathbb{G}
  // paper: The set of work-report \mathbb{G}uarantees.
  guarantee: { say: "G", means: "the set of guarantees: a work-report, the slot it was made at, and two or three guarantors' signatures" },
  // t
  "aa¬timestamp": { say: "t", means: "the slot a pending report arrived on its core" },
  // \rho'
  availassignmentspostguarantees: { say: "rho prime", means: "the cores after this block's guarantees: each core's pending report and its slot, or nothing" },
  // \mathbb{R}
  // paper: The set of work-\mathbb{R}eports. \emph{Note used for the set of real numbers.}
  workreport: { say: "R", means: "the set of work-reports: a core's signed receipt for one work-package" },
  // \mathbf{c}
  "wr¬context": { say: "c", means: "a report's refinement context: the blocks its package was built against, and its prerequisites" },
  // c
  "wr¬core": { say: "c", means: "the core a report's work was done on, 0 to C − 1" },
  // \mathbf{t}
  "wr¬authtrace": { say: "t", means: "the authorizer's trace: the blob its code returned when it said yes (`auth_output`)" },
  // \mathbf{l}
  "wr¬srlookup": { say: "l", means: "the segment-root lookup: for each package whose exports it imports by package hash, that package's segments root" },
  // g
  "wr¬authgasused": { say: "g", means: "the gas the authorizer's code used (`auth_gas_used`)" },
  // \mathbf{d}
  "wr¬digests": { say: "d", means: "the report's digests, one per work-item, 1 to 16 of them (`results`)" },
  // \mathbb{Y}
  // paper: The set of availability specifications.
  avspec: { say: "Y", means: "the set of availability specifications: package hash, bundle length, erasure root, shard count, segments root, segment count" },
  // \mathbb{C}
  // paper: The set of work-\mathbb{C}ontexts. \emph{Not used as the set of complex numbers.}
  workcontext: { say: "C", means: "the set of refinement contexts: the recent blocks a package was built against, and the packages it needs first" },
  // \mathsf{I}
  // paper: [16] The maximum amount of work items in a package.
  Cmaxpackageitems: { say: "I", means: "the most work-items a package holds, so the most digests a report holds: 16" },
  // \mathbb{D}
  // paper: The set of work-\mathbb{D}igests.
  workdigest: { say: "D", means: "the set of work-digests: one item's result card, with its service, hashes, gas limit, result and load" },
  // \mathsf{J}
  // paper: [8] The maximum sum of dependency items in a work-report.
  Cmaxreportdeps: { say: "J", means: "the most dependencies a report may have, prerequisites and segment-root lookups together: 8" },
  // \mathbf{r}
  wrX: { say: "r", means: "a work-report" },
  // \mathbf{p}
  "wc¬prerequisites": { say: "p", means: "a context's prerequisites: hashes of packages that must be accumulated first" },
  // a
  "wc¬anchorhash": { say: "a", means: "the anchor's header hash: a recent block the package was built against" },
  // n
  "wc¬anchortime": { say: "n", means: "the anchor block's timeslot" },
  // s
  "wc¬anchorpoststate": { say: "s", means: "the anchor block's state root: the state after that block" },
  // b
  "wc¬anchoraccoutlog": { say: "b", means: "the anchor block's accumulation-output super-peak, the belt's root (`beefy_root`)" },
  // l
  "wc¬lookupanchorhash": { say: "l", means: "the lookup anchor's header hash: the block whose state code is fetched from" },
  // t
  "wc¬lookupanchortime": { say: "t", means: "the lookup anchor's timeslot: at most L = 14,400 slots old" },
  // r
  "wc¬lookupanchorpoststate": { say: "r", means: "the lookup anchor's state root" },
  // l
  "as¬bundlelen": { say: "l", means: "the bundle's length in bytes: the package with everything needed to refine it again" },
  // u
  "as¬erasureroot": { say: "u", means: "the erasure root: one Merkle root over every validator's shard of the bundle and the exports" },
  // v
  "as¬erasureshards": { say: "v", means: "how many shards the data is cut into: one per validator, 1,023 on full, 6 on tiny" },
  // n
  "as¬segcount": { say: "n", means: "how many segments the package exported" },
  // s
  "wd¬serviceindex": { say: "s", means: "the service the item was for, whose accumulate gets the result" },
  // c
  "wd¬codehash": { say: "c", means: "the service's code hash as the guarantors saw it; it must match the chain's" },
  // y
  "wd¬payloadhash": { say: "y", means: "the hash of the item's payload" },
  // g
  "wd¬gaslimit": { say: "g", means: "the gas the item's accumulation may use (`accumulate_gas`)" },
  // \mathbf{l}
  "wd¬result": { say: "l", means: "the result: the bytes refine returned, or one of six errors" },
  // \mathbb{E}
  // paper: The set of work execution \mathbb{E}rrors.
  workerror: { say: "E", means: "the set of work errors: out of gas, panic, bad exports, oversize, BAD (no code) and BIG (code too big)" },
  // u
  "wd¬gasused": { say: "u", means: "the gas refining the item used" },
  // i
  "wd¬importcount": { say: "i", means: "how many segments the item imported" },
  // x
  "wd¬xtcount": { say: "x", means: "how many extrinsic blobs the item used" },
  // z
  "wd¬xtsize": { say: "z", means: "those extrinsics' total size, in bytes" },
  // e
  "wd¬exportcount": { say: "e", means: "how many segments the item exported" },
  // \circledcirc
  badexports: { say: "bad exports", means: "the error: the item exported a different number of segments than it said it would" },
  // \circleddash
  oversize: { say: "oversize", means: "the error: this output would make the report's outputs bigger than W_R" },
  // \mathsf{W}_C
  // paper: [4,000,000] The maximum size of service code in octets.
  Cmaxservicecodesize: { say: "W sub C", means: "the largest a service's code may be: 4,000,000 bytes" },
  // \mathsf{W}_R
  // paper: [48\cdot2^{10}] The maximum total size of all unbounded blobs in a work-report, in octets.
  Cmaxreportvarsize: { say: "W sub R", means: "the most bytes a report's outputs may take, the trace and every result together: 48 × 1,024 = 49,152" },
  // a
  "xa¬anchor": { say: "a", means: "an assurance's anchor: the parent block's header hash" },
  // f
  "xa¬availabilities": { say: "f", means: "an assurance's bitfield: one bit per core, 1 for \"I hold my piece of its data\"" },
  // v
  "xa¬assurer": { say: "v", means: "the assuring validator's index in κ" },
  // s
  "xa¬signature": { say: "s", means: "the assurer's Ed25519 signature over the parent hash and the bitfield" },
  // \mathsf{X}_A
  Xavailable: { say: "X sub A", means: "the context string an assurance signs: `jam_available`" },
  // c
  cX: { say: "c", means: "a core's index, 0 to C − 1" },
  // \delta'
  accountspost: { say: "delta prime", means: "the service accounts after the block" },
  // \mathsf{U}
  // paper: [5] The period in timeslots after which reported but unavailable work is cleared.
  Cassurancetimeoutperiod: { say: "U", means: "how long a report may wait on its core for its data: 5 slots" },
  // \mathbf{M}
  // paper: The current core assignments.
  guarantorassignments: { say: "M", means: "the guarantor assignments: each validator's core this rotation, and the validators' keys" },
  // \bmod
  bmod: { say: "mod", means: "the remainder after dividing: 14 mod 4 is 2", entry: "mod" },
  // \left
  left: "skip",
  // \mathcal{F}\left(x\right)
  fyshuffle: { say: "F of", means: "the Fisher-Yates shuffle: the sequence reordered by an entropy, the same way on every validator" },
  // \mathsf{R}
  // paper: [10] The rotation period of validator-core assignments, in timeslots.
  Crotationperiod: { say: "R", means: "how often the guarantors move on to another core: every 10 slots on full, 4 on tiny" },
  // \right
  right: "skip",
  // \mathbf{M}^*
  // paper: The core assignments in the previous rotation.
  guarantorassignmentsunderlastrotation: { say: "M star", means: "the guarantor assignments of the rotation before this one" },
  // \mathbf{g}
  gX: { say: "g", means: "a guarantee" },
  // \mathbf{G}
  // paper: The set of Ed25519 guarantor keys who made a work-report.
  reporters: { say: "G", means: "the reporters: the Ed25519 keys of every guarantor who signed a guarantee in this block" },
  // \mathbf{I}
  incomingreports: { say: "I", means: "the incoming reports: the work-reports this block's guarantees carry" },
  // \mathbf{E}
  theextrinsic: { say: "E", means: "this block's extrinsic: all the data it carries besides its header" },
  // \mathsf{G}_A
  // paper: [10,000,000] The gas allocated to invoke a work-report's Accumulation logic.
  Creportaccgas: { say: "G sub A", means: "the most gas a report's accumulation may be given: 10,000,000" },
  // \mathbf{d}
  wdX: { say: "d", means: "a work-digest" },
  // \mathbf{x}
  "local¬incomingcontexts": { say: "x", means: "the contexts of this block's incoming reports" },
  // \mathbf{p}
  "local¬incomingpackagehashes": { say: "p", means: "the package hashes of this block's incoming reports; in (11.43), each with its segments root" },
  // \mathbf{a}
  aaX: { say: "a", means: "one core's entry in ρ: a pending report and its slot" },
  // \bigcup
  bigcup: { say: "the union over", means: "everything in any of the sets it ranges over, together" },
};
