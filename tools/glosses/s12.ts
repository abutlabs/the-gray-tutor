// The symbols §12, Accumulation first uses, in plain words (gray-paper-glosses.ts says how a
// key is made from them). Each entry: how to say it aloud, and what it means, in a line a
// reader new to the paper can follow; "skip" for typography a key needn't explain.

import type { Glosses } from "../gray-paper-glosses.ts";

export const S12: Glosses = {
  // \overbrace{\xi}
  accumulatedcup: { say: "all of xi", means: "every work-package hash in the history ξ, its E sets joined into one: what was accumulated in the last epoch" },
  // \left\{\right\}
  emset: { say: "the empty set", means: "a set, or a dictionary, with nothing in it" },
  // \mid
  mid: { say: "such that", means: "in a sequence built from a rule: the items on the left, for every choice on the right" },
  // \left[\!\left[\mathbb{R}\right]\!\right]_{}
  workreports: { say: "a sequence of work-reports", means: "a list of work-reports, in order" },
  // P
  "local¬fnsrmap": { say: "P", means: "the package hashes of some reports: P(𝐫) is the set of each report's work-package hash" },
  // z
  multicolumn: "skip",
  // \Delta_+
  // paper: The full sequential accumulation function.
  accseq: { say: "Delta plus", means: "the outer accumulation: rounds of Δ\\*, each taking the reports that fit the gas left, until no reports fit and no transfers wait" },
  // \Delta_*
  // paper: The parallel accumulation function.
  accpar: { say: "Delta star", means: "one round of accumulation: every service with work runs once, all from the same state, and their results are merged" },
  // \mathbb{U}
  // paper: The information concerning a single work-item once prepared as an operand for the accumulation function.
  operandtuple: { say: "U", means: "an operand: what accumulate is told about one work-digest: package hash, exports root, authorizer, payload hash, gas, trace and result" },
  // \mathbb{X}
  // paper: The set of deferred transfers.
  defxfer: { say: "X", means: "a deferred transfer: (source, destination, amount, memo, gas), the money moved now, the receiver run in the next round" },
  // m
  "dx¬memo": { say: "m", means: "a transfer's memo: 128 bytes the sender writes for the receiver's code" },
  // \mathsf{W}_T
  // paper: [128] The size of a transfer memo in octets.
  Cmemosize: { say: "W sub T", means: "the size of a transfer's memo: 128 bytes" },
  // s
  "dx¬source": { say: "s", means: "a transfer's sender: the service it comes from" },
  // d
  "dx¬dest": { say: "d", means: "a transfer's receiver: the service it goes to" },
  // a
  "dx¬amount": { say: "a", means: "how much balance the transfer moves" },
  // g
  "dx¬gas": { say: "g", means: "the gas the sender pays for the receiver's run on this transfer" },
  // p
  "ot¬packagehash": { say: "p", means: "the operand's work-package hash" },
  // e
  "ot¬segroot": { say: "e", means: "the operand's exports root: the root of the segments its package exported" },
  // a
  "ot¬authorizer": { say: "a", means: "the authorizer hash of the report the digest came from" },
  // y
  "ot¬payloadhash": { say: "y", means: "the hash of the work-item's payload" },
  // g
  "ot¬gaslimit": { say: "g", means: "the gas the digest asked for, to accumulate it" },
  // \mathbf{t}
  "ot¬authtrace": { say: "t", means: "the authorizer's trace: the blob its code gave back when it said yes" },
  // \mathbf{l}
  "ot¬result": { say: "l", means: "what refine produced for the work-item: a blob, or an error" },
  // \mathbb{B}_{\mathsf{W}_T}
  memo: { say: "a blob of W sub T bytes", means: "exactly 128 bytes" },
  // \mathbb{S}
  // paper: The set representating a portion of overall \mathbb{S}tate, used during accumulation.
  partialstate: { say: "S", means: "a partial state: the parts of the state accumulation may change: accounts, next validators, authorizer queues and the privileges" },
  // \mathbf{d}
  "ps¬accounts": { say: "d", means: "a partial state's service accounts, by service id" },
  // \mathbf{i}
  "ps¬stagingset": { say: "i", means: "a partial state's next validators' keys, ι" },
  // \mathbf{q}
  "ps¬authqueue": { say: "q", means: "a partial state's authorizer queues, ϕ: 80 hashes for each core" },
  // m
  "ps¬manager": { say: "m", means: "the manager service's id, χ_M" },
  // \mathbf{a}
  "ps¬assigners": { say: "a", means: "each core's assigner service id, χ_A" },
  // v
  "ps¬delegator": { say: "v", means: "the delegator service's id, χ_V: it sets the next validators" },
  // r
  "ps¬registrar": { say: "r", means: "the registrar service's id, χ_R: it may create services at small ids" },
  // \mathbf{z}
  "ps¬alwaysaccers": { say: "z", means: "the always-accumulate services with their free gas, χ_Z" },
  // B
  "local¬fnservouts": { say: "B", means: "the yields: a set of pairs (service, 32-byte hash)" },
  // U
  "local¬fngasused": { say: "U", means: "the gas used: a list of pairs (service, gas), one per run" },
  // \left[\!\left[\mathbb{X}\right]\!\right]_{}
  defxfers: { say: "a sequence of transfers", means: "a list of deferred transfers, in order" },
  // \mathbf{e}
  psX: { say: "e", means: "a partial state: the accounts, next validators, queues and privileges a run works on" },
  // \dagger
  dagger: { say: "dagger", means: "a mark making a new name from an old one: δ† is δ partway through the block, 𝐭† another list of transfers" },
  // \Delta_1
  // paper: The single-step accumulation function.
  accone: { say: "Delta one", means: "one service's accumulation: adds up its gas, lines up its inputs, transfers first, and runs its code with Ψ_A" },
  // \Delta
  "local¬acc": { say: "Delta", means: "inside Δ\\*: Δ(s) is service s's run in this round, Δ₁ with the round's inputs" },
  // u
  "ao¬gasused": { say: "u", means: "the gas a run used" },
  // y
  "ao¬yield": { say: "y", means: "a run's yield: a 32-byte hash for the outside world, or nothing" },
  // \mathbf{t}
  "ao¬defxfers": { say: "t", means: "the transfers a run sent" },
  // I
  "local¬fnprovide": { say: "I", means: "preimage integration: files each provided blob in its service, if that service still waits for it" },
  // \mathbf{p}
  "ao¬provisions": { say: "p", means: "the preimages a run provided: pairs (service, blob)" },
  // \mathbf{e}^*
  "local¬manpost": { say: "e star", means: "the state the manager's run left behind" },
  // \mathbf{e}
  "ao¬poststate": { say: "e", means: "the state a run left behind" },
  // Y
  "local¬fnprovidable": { say: "Y", means: "is this blob still wanted? true if the service exists and its request for the blob's hash and length is [ ]: asked, not yet given" },
  // \mathbb{O}
  // paper: The set of single-service accumulation \mathbb{O}utputs.
  acconeout: { say: "O", means: "what one run gives back: its state 𝐞, transfers 𝐭, yield y, gas used u and provisions 𝐩" },
  // \delta^\dagger
  // paper: The post-accumulation, pre-preimage integration intermediate state.
  accountspostacc: { say: "delta dagger", means: "the service accounts right after accumulation, before slots are stamped and the block's preimages filed" },
  // \mathsf{G}_T
  // paper: [3,500,000,000] The total gas allocated across for all Accumulation. Should be no smaller than \mathsf{G}_A\cdot\mathsf{C} + \sum_{g \in \mathcal{V}\left(\chi_Z\right)}(g).
  Cblockaccgas: { say: "G sub T", means: "the gas for a whole block's accumulation: 3,500,000,000 on full, 20,000,000 on tiny" },
  // \textstyle
  textstyle: "skip",
  // n
  "local¬numberofreportsaccumulated": { say: "n", means: "how many reports the block accumulated: the first n of 𝐑\\*" },
  // \mathbf{u}
  "local¬servicegasused": { say: "u", means: "the gas each service used: a pair (service, gas) for every run, over all rounds" },
  // \mathbf{t}
  "local¬processedtransfers": { say: "t", means: "every transfer delivered in the block's rounds" },
};
