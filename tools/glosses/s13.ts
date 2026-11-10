// The symbols §13, Statistics first uses, in plain words (gray-paper-glosses.ts says how a
// key is made from them). Each entry: how to say it aloud, and what it means, in a line a
// reader new to the paper can follow; "skip" for typography a key needn't explain.

import type { Glosses } from "../gray-paper-glosses.ts";

export const S13: Glosses = {
  // \pi_L
  valstatsprevious: { say: "pi sub L", means: "last epoch's validator tallies: one record of six counts per validator, finished" },
  // \pi_V
  valstatsaccumulator: { say: "pi sub V", means: "this epoch's validator tallies: one record of six counts per validator, still counting" },
  // \pi_C
  corestats: { say: "pi sub C", means: "the cores' tallies: one record per core, for this block only" },
  // \pi_S
  servicestats: { say: "pi sub S", means: "the services' tallies: one record per service active in this block, for this block only" },
  // b
  "vs¬blocks": { say: "b", means: "blocks the validator made" },
  // t
  "vs¬tickets": { say: "t", means: "tickets the validator put in its blocks" },
  // p
  "vs¬preimagecount": { say: "p", means: "preimages the validator put in its blocks" },
  // d
  "vs¬preimagesize": { say: "d", means: "the bytes of those preimages, all together" },
  // g
  "vs¬guarantees": { say: "g", means: "blocks in which the validator signed a guarantee, once a block" },
  // a
  "vs¬assurances": { say: "a", means: "availability assurances the validator made" },
  // \ddagger
  ddagger: { say: "double dagger", means: "a second midway value: after the dagger step, before the prime" },
  // d
  "cs¬daload": { say: "d", means: "a core's data load: bytes its newly available reports ask validators to keep" },
  // p
  "cs¬popularity": { say: "p", means: "a core's popularity: how many of the block's assurances have its bit set" },
  // i
  "cs¬importcount": { say: "i", means: "segments imported by the work of the reports the core took on" },
  // x
  "cs¬xtcount": { say: "x", means: "work-item extrinsics in those reports: blobs sent along for refine" },
  // z
  "cs¬xtsize": { say: "z", means: "the bytes of those extrinsics" },
  // e
  "cs¬exportcount": { say: "e", means: "segments exported by the work of the reports the core took on" },
  // l
  "cs¬bundlelen": { say: "l", means: "the bytes of those reports' bundles, all together" },
  // u
  "cs¬gasused": { say: "u", means: "the gas refine used for the reports the core took on" },
  // p
  "ss¬provision": { say: "p", means: "a service's provisions: how many preimages were provided for it, and their bytes" },
  // r
  "ss¬refinement": { say: "r", means: "a service's refinement: how many of its digests were reported, and the gas they used" },
  // i
  "ss¬importcount": { say: "i", means: "segments imported by the service's reported work" },
  // x
  "ss¬xtcount": { say: "x", means: "work-item extrinsics in the service's reported work" },
  // z
  "ss¬xtsize": { say: "z", means: "the bytes of those extrinsics" },
  // e
  "ss¬exportcount": { say: "e", means: "segments exported by the service's reported work" },
  // a
  "ss¬accumulation": { say: "a", means: "a service's accumulation this block: work-items and transfers accumulated, and gas used" },
  // i
  "¬importcount": { say: "i", means: "imports: segments a work-item imported" },
  // x
  "¬xtcount": { say: "x", means: "extrinsics: blobs sent along with a work-item for refine" },
  // z
  "¬xtsize": { say: "z", means: "the bytes of those extrinsics" },
  // e
  "¬exportcount": { say: "e", means: "exports: segments a work-item exported" },
  // u
  "¬gasused": { say: "u", means: "gas used" },
  //
  span: "skip",
  // \mathsf{W}_G
  // paper: [4104] The size of a segment in octets.
  Csegmentsize: { say: "W sub G", means: "a segment's size: 4,104 bytes" },
  // \mathbf{s}
  "local¬servicesactive": { say: "s", means: "the services active in this block: reported, provided for, or accumulated" },
  // n
  "local¬counter": { say: "n", means: "a count: 1 for each digest, so the sum counts them" },
  // \mathbf{s}^R
  "local¬servicesreported": { say: "s sup R", means: "the services with a digest in a report guaranteed in this block" },
  // \mathbf{s}^P
  "local¬servicesprovided": { say: "s sup P", means: "the services a preimage was provided for in this block" },
};
