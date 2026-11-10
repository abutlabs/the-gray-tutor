// The symbols §5, The Header first uses, in plain words (gray-paper-glosses.ts says how a
// key is made from them). Each entry: how to say it aloud, and what it means, in a line a
// reader new to the paper can follow; "skip" for typography a key needn't explain.

import type { Glosses } from "../gray-paper-glosses.ts";

export const S05: Glosses = {
  // P
  "¬parent": { say: "P", means: "a header's parent hash: 𝐇_P is the hash of the header before it, 32 bytes" },
  // R
  "¬priorstateroot": { say: "R", means: "a header's prior state root: 𝐇_R is the root of the state before this block, 32 bytes" },
  // X
  "¬extrinsichash": { say: "X", means: "a header's extrinsic hash: 𝐇_X stands for the block's five bags, 32 bytes" },
  // T
  "¬timeslot": { say: "T", means: "a header's timeslot: 𝐇_T is the slot this block was made for" },
  // E
  "¬epochmark": { say: "E", means: "a header's epoch mark: 𝐇_E, at an epoch's first block only, the next epoch's entropy and validator keys" },
  // W
  "¬winnersmark": { say: "W", means: "a header's winning-tickets mark: 𝐇_W, at most once an epoch, a ticket for every slot of the next (12 on tiny, 600 on full)" },
  // O
  "¬offendersmark": { say: "O", means: "a header's offenders mark: 𝐇_O, the Ed25519 keys of the validators this block convicts" },
  // I
  "¬authorindex": { say: "I", means: "a header's author index: 𝐇_I, which validator made the block, a position in κ′" },
  // V
  "¬vrfsig": { say: "V", means: "a header's VRF signature: 𝐇_V, 96 bytes of the author's fresh randomness; the vectors' entropy source" },
  // S
  "¬sealsig": { say: "S", means: "a header's seal: 𝐇_S, the author's 96-byte Bandersnatch signature on the rest of the header" },
  // \mathcal{E}_{}{x}
  fnencode: { say: "E", means: "the codec: a value in, its bytes out; a number alone, as a compact natural of 1 to 9 bytes", entry: "encode" },
  // \mathcal{E}_{U}
  fnencodeunsignedheader: { say: "E sub U", means: "a header's encoding without its seal: the bytes the seal signs" },
  // \mathbf{H}^0
  genesisheader: { say: "H zero", means: "the genesis header: the first header of all, agreed on before the chain starts" },
  // \sigma^0
  genesisstate: { say: "sigma zero", means: "the genesis state: the state the chain starts from" },
  // {x}^-
  parentheader: { say: "x minus", means: "the parent of: 𝐇⁻ is the header of the block before this one" },
  // P\left(x\right)
  getparent: { say: "P of", means: "the parent of a header: P(𝐇) is the header of the block before" },
  // \mathcal{E}_{}\left(x\right){y}
  // paper: The octet-sequence encode function. Superscripted {}^{-1} to denote the inverse.
  encode: { say: "E of", means: "the encoding of what's in the brackets: its bytes, by Appendix C's rules", entry: "encode" },
  // P
  fngetparent: { say: "P", means: "the parent function: a header in, the header of the block before out" },
  // \mathbf{A}
  // paper: The ancestor set of the block.
  ancestors: { say: "A", means: "the ancestors: this header, its parent, its parent's parent, and so on back to genesis" },
  // \mathsf{L}
  // paper: [14,400] The maximum age in timeslots of the lookup anchor.
  Cmaxlookupanchorage: { say: "L", means: "the oldest a lookup anchor may be: 14,400 slots, 24 hours" },
  // \mathcal{H}^\#\left(x\right)
  blakemany: { say: "H hash of", means: "hash each item: ℋ#([a, b]) is [ℋ(a), ℋ(b)], a sequence of 32-byte hashes" },
  // \mathcal{E}_{T}\left(x\right)
  encodetickets: { say: "E sub T of", means: "the tickets bag's bytes: its length, then each ticket's attempt (1 byte) and 784-byte proof" },
  // \mathcal{E}_{A}\left(x\right)
  encodeassurances: { say: "E sub A of", means: "the assurances bag's bytes: its length, then each one's anchor, bitfield, validator index (2 bytes) and signature" },
  // \mathcal{E}_{D}\left(x\right)
  encodedisputes: { say: "E sub D of", means: "the disputes bag's bytes: the verdicts, the culprits and the faults, each list with its length in front" },
  // \left\updownarrow x\right.\!
  var: { say: "with its length", means: "↕x: x with its length in front, as a compact natural", entry: "length-prefix" },
  // s
  "xp¬serviceindex": { say: "s", means: "a preimage's service: the id of the service that asked for it, 4 bytes" },
  // \mathbf{d}
  "xp¬data": { say: "d", means: "a preimage's data: the bytes themselves" },
  // \mathbf{r}
  "g¬workreport": { say: "r", means: "a guarantee's work-report: 𝐠_𝐫 is the report it vouches for" },
  // t
  "g¬timeslot": { say: "t", means: "a guarantee's timeslot: the slot its guarantors signed it in" },
  // a
  "g¬credential": { say: "a", means: "a guarantee's credential: two or three pairs of a validator index and its Ed25519 signature" },
  // \wedge
  wedge: { say: "and", means: "both sides are true" },
  // \leq
  leq: { say: "at most", means: "less than or equal to" },
  // \mathcal{M}_\sigma\left(x\right)
  // paper: The state Merklization function.
  merklizestate: { say: "M sigma of", means: "the state root of: the 32-byte Merkle root of the whole state" },
  // \mathcal{M}_\sigma
  fnmerklizestate: { say: "M sigma", means: "state Merklization: a whole state in, its 32-byte root out" },
  // A
  "¬authorbskey": { say: "A", means: "the author's Bandersnatch key: 𝐇_A, looked up in κ′ at 𝐇_I, never written in the header" },
  // b
  "vk¬bs": { say: "b", means: "a validator's Bandersnatch key: the first 32 of its 336 bytes" },
  // \mathbb{V}
  // paper: The set of \mathbb{V}alidator key-set sizes.
  valcount: { say: "V (the set)", means: "the validator counts allowed: multiples of 3 from 6 to 3C, which is 1,023 on full and 6 on tiny" },
  // \mathbb{T}
  // paper: The set of slot-sealer \mathbb{T}ickets.
  safroleticket: { say: "T", means: "a ticket: a 32-byte id, and which of its maker's tries it was (its attempt)" },
};
