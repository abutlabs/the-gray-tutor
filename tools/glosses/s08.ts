// The symbols §8, Authorization, first uses, in plain words (gray-paper-glosses.ts says how a
// key is made from them).

import type { Glosses } from "../gray-paper-glosses.ts";

export const S08: Glosses = {
  "¬core": { say: "c", means: "a core's index, 0 to C − 1" },
  coreindex: { say: "N sub C", means: "the core indices: 0 to C − 1" },
  Cauthpoolsize: { say: "O", means: "the most authorizers a core's pool holds: 8" },
  Cauthqueuesize: { say: "Q", means: "how many authorizers a core's queue holds: 80" },
  "wr¬authorizer": { say: "a", means: "a report's authorizer hash: which gatekeeper let its package onto the core" },
  qquad: "skip",
};
