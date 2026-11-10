// The symbols §6, Safrole first uses, in plain words (gray-paper-glosses.ts says how a
// key is made from them). Each entry: how to say it aloud, and what it means, in a line a
// reader new to the paper can follow; "skip" for typography a key needn't explain.

import type { Glosses } from "../gray-paper-glosses.ts";

export const S06: Glosses = {
  // \gamma_S
  // paper: The slot-sealer sequence of the current epoch.
  sealtickets: { say: "gamma S", means: "the slot sealers: one entry for each of the epoch's E slots, a winning ticket or, in the fallback, a Bandersnatch key" },
  // \gamma_A
  // paper: The sealing lottery ticket accumulator.
  ticketaccumulator: { say: "gamma A", means: "the ticket lottery: the best tickets entered so far for the next epoch, at most E, lowest id first" },
  // \gamma_P
  // paper: The keys for the validators of the next epoch, equivalent to those keys which constitute \gamma_Z.
  pendingset: { say: "gamma P", means: "the pending validators: the key sets that become active at the next epoch" },
  // \gamma_Z
  // paper: The Bandersnatch root for the current epoch's ticket submissions.
  epochroot: { say: "gamma Z", means: "the ring root of the pending validators' Bandersnatch keys: 144 bytes a ticket's proof is checked against" },
  // y
  "st¬id": { say: "y", means: "a ticket's id: 32 random bytes, the output of its ring proof; a lower id wins" },
  // e
  "st¬entryindex": { say: "e", means: "a ticket's entry index: which of its maker's attempts it is, counted from 0" },
  // \mathsf{C}
  // paper: [341] The total number of cores.
  Ccorecount: { say: "C", means: "the number of cores: 341 on full, 2 on tiny" },
  // \left[\!\left[\mathbb{K}\right]\!\right]_{\mathbb{V}}
  allvalkeys: { say: "a sequence of K, of a size in V", means: "a validator set: a 336-byte key set for each validator; 6 on tiny, 1,023 on full" },
  // \mathbb{N}_{x \dots y}
  Nclamp: { say: "N from x to y", means: "the whole numbers from x up to, not including, y" },
  // \mathbb{K}
  // paper: The set of validator \mathbb{K}ey-sets.
  valkey: { say: "K", means: "a validator's key set: 336 bytes holding its Bandersnatch, Ed25519 and BLS keys and its metadata" },
  // e
  "vk¬ed": { say: "e", means: "a validator's Ed25519 key: the 32 bytes after its Bandersnatch key" },
  // l
  "vk¬bls": { say: "l", means: "a validator's BLS key: the 144 bytes from byte 64" },
  // m
  "vk¬metadata": { say: "m", means: "a validator's metadata: its last 128 bytes, an address and other details the chain never reads" },
  // k
  vkX: { say: "k", means: "one validator's key set: 336 bytes" },
  // \mathbb{B}_{128}
  metadatakey: { say: "B sub 128", means: "128 bytes: room for a validator's metadata" },
  // \Phi
  // paper: The key-nullifier function.
  Phi: { say: "Phi", means: "the key nullifier: each key set as it is, or 336 zero bytes if its Ed25519 key is an offender's" },
  // \nonumber
  nonumber: "skip",
  // \psi_O
  // paper: Validators who made a judgment found to be incorrect.
  offenders: { say: "psi O", means: "the offenders: Ed25519 keys of validators found to have judged a report wrongly" },
  // \implies
  implies: { say: "means that", means: "if the left side holds, everything on the right must hold too" },
  // \left\{ \begin{aligned}x\end{aligned} \right.{y}
  abracegroup: { say: "as follows", means: "a brace grouping lines that hold together: for a function, its type on top, then what each input becomes" },
  // \mathsf{X}_T
  Xticket: { say: "X sub T", means: "the context of a ticket and its seal: the bytes of \"jam_ticket_seal\"" },
  // \mathcal{E}_{U}\left(x\right)
  encodeunsignedheader: { say: "E sub U of", means: "the header's bytes without its seal: what the seal signs" },
  // \mathbf{T}
  // paper: The ticketed condition, true if the block was sealed with a ticket signature rather than a fallback.
  isticketed: { say: "T", means: "ticketed: 1 if the block was sealed with a ticket, 0 if by the fallback" },
  // \mathsf{X}_F
  Xfallback: { say: "X sub F", means: "the context of a fallback seal: the bytes of \"jam_fallback_seal\"" },
  // \mathsf{X}_E
  Xentropy: { say: "X sub E", means: "the context of the entropy source: the bytes of \"jam_entropy\"" },
  // \texttt{x}
  token: { say: "the string", means: "a name in typewriter type: an instruction's or helper's name, or fixed bytes written as text: the ASCII bytes of its words; the dollar sign in front only marks them as text and is not one of the bytes" },
  // \eta_0
  entropyaccumulator: { say: "eta zero", means: "the entropy accumulator: 32 bytes that every block's VRF output is hashed into" },
  // \geq
  geq: { say: "is at least", means: "greater than or equal to" },
  // \mathsf{Y}
  // paper: [500] The number of slots into an epoch at which ticket-submission ends.
  Cepochtailstart: { say: "Y", means: "the slot of an epoch at which the ticket lottery closes: 500 on full, 10 on tiny" },
  // \mapsto
  mapsto: { say: "maps to", means: "what a function gives back for an input: x ↦ y says x becomes y" },
  // \mathbb{N}_{\mathsf{E}}
  epochindex: { say: "N sub E", means: "a slot's place within its epoch: 0 to E − 1" },
  // \text{x}
  textsc: "skip",
  // e
  "xt¬entryindex": { say: "e", means: "an entered ticket's attempt number, 0 to n − 1: which of its maker's tickets this is" },
  // p
  "xt¬proof": { say: "p", means: "an entered ticket's ring proof: 784 bytes proving a pending validator made it, without saying which" },
  // \phantom
  phantom: "skip",
  // \left\lceil x\right\rceil
  ceil: { say: "ceiling of", means: "rounded up to a whole number" },
  // \mathsf{K}
  // paper: [16] The maximum number of tickets which may be submitted in a single extrinsic.
  Cmaxblocktickets: { say: "K", means: "the most tickets one block may carry: 16 on full, 3 on tiny" },
  // \ge
  ge: { say: "is at least", means: "greater than or equal to" },
};
