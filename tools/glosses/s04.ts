// The symbols §4, Overview, first uses, in plain words (gray-paper-glosses.ts says how a key
// is made from them). §4 names the block, its parts and the state's seventeen components,
// so most of the paper's letters start here.

import type { Glosses } from "../gray-paper-glosses.ts";

export const S04: Glosses = {
  // the block
  block: { say: "B", means: "a block: its header and its extrinsic", entry: "block" },
  H: { say: "H", means: "this block's header; 𝐇_T is its timeslot, 𝐇_P its parent's hash" },
  header: { say: "H", means: "a block header: the parent's hash, the slot, the seals and markers" },
  theheader: { say: "H", means: "this block's header" },
  extrinsic: { say: "E", means: "a block's extrinsic: the data it carries in, in five bags" },
  xttickets: { say: "E sub T", means: "the tickets bag: entries to the block-sealing lottery" },
  xtdisputes: { say: "E sub D", means: "the disputes bag: verdicts, culprits and faults" },
  xtpreimages: { say: "E sub P", means: "the preimages bag: data a service asked for" },
  xtassurances: { say: "E sub A", means: "the assurances bag: validators saying they hold their pieces of reports" },
  xtguarantees: { say: "E sub G", means: "the guarantees bag: work-reports with their guarantors' signatures, one per core at most" },

  // the state's components, σ's letters
  authpool: { say: "alpha", means: "the authorizer pools: for each core, up to O = 8 authorizer hashes it accepts right now" },
  authqueue: { say: "phi", means: "the authorizer queues: for each core, Q = 80 authorizer hashes waiting to join its pool" },
  recent: { say: "beta", means: "recent blocks: the last few blocks' hashes and roots, and the belt of accumulation outputs" },
  recenthistory: { say: "beta sub H", means: "the last H = 8 blocks: each one's header hash, state root, belt peak and reported packages" },
  recenthistorypostparentstaterootupdate: { say: "beta sub H dagger", means: "the recent blocks midway: with the parent's state root filled in, before this block's entry" },
  lastaccout: { say: "theta", means: "the last block's accumulation outputs: which service yielded which hash" },
  safrole: { say: "gamma", means: "Safrole's state: the ticket lottery for who seals the next epoch's blocks" },
  accounts: { say: "delta", means: "the service accounts: every service's code hash, balance, storage and preimages" },
  accountspre: { say: "delta", means: "the service accounts before the block" },
  accountspostxfer: { say: "delta double dagger", means: "the service accounts midway: after accumulation" },
  accountspostpreimage: { say: "delta prime", means: "the service accounts after the block, the preimages provided included" },
  entropy: { say: "eta", means: "entropy: four 32-byte values of randomness, the newest mixing in every block" },
  stagingset: { say: "iota", means: "the next validators: keys queued to become active at the next epoch" },
  activeset: { say: "kappa", means: "the current validators: the keys of the V validators active this epoch" },
  previousset: { say: "lambda", means: "the last epoch's validators: kept to check what they signed before the change" },
  availassignments: { say: "rho", means: "the pending reports: for each core, the report waiting to be made available, and when it came" },
  availassignmentspostjudgment: { say: "rho dagger", means: "the pending reports midway: after disputes took the judged-bad ones out" },
  availassignmentspostassurances: { say: "rho double dagger", means: "the pending reports midway: after the available ones and the timed-out ones left" },
  thetime: { say: "tau", means: "the time: the latest block's timeslot" },
  privileges: { say: "chi", means: "the privileged services: who may manage, assign cores, set validators and accumulate for free" },
  disputes: { say: "psi", means: "past judgments: the reports found good, bad or wonky, and the validators who lied" },
  activity: { say: "pi", means: "the statistics: tallies per validator, per core and per service" },
  ready: { say: "omega", means: "the ready queue: available reports waiting on others before they can accumulate" },
  accumulated: { say: "xi", means: "the accumulated history: the packages accumulated in each of the last E slots" },
  justbecameavailable: { say: "R", means: "the reports this block made available: ready to accumulate" },
  accumulationstatistics: { say: "S", means: "this block's accumulation tallies, per service: work-items accumulated, transfers, and gas used" },

  // time
  wallclock: { say: "T", means: "the wall clock: seconds since the JAM Common Era began (2025-01-01 12:00 UTC)" },
  Cslotseconds: { say: "P", means: "a slot's length: 6 seconds" },
  Cepochlen: { say: "E", means: "an epoch's length in slots: 600 on full, 12 on tiny" },
  timeslot: { say: "N sub T", means: "a timeslot: a u32 counting 6-second slots" },

  // economics
  balance: { say: "N sub B", means: "a balance: a u64" },
  Citemdeposit: { say: "B sub I", means: "the deposit a service holds for each item it stores: 10" },
  Cbytedeposit: { say: "B sub L", means: "the deposit a service holds for each byte it stores: 1" },
  Cbasedeposit: { say: "B sub S", means: "the deposit every service holds just to exist: 100" },

  // the PVM and gas
  Psi: { say: "psi (capital)", means: "the PVM: a program, a gas limit, registers and memory in; how it stopped and what's left out" },
  pvmreg: { say: "N sub R", means: "a register's value: a u64" },
  registers: { say: "phi (curly)", means: "the PVM's 13 registers" },
  ram: { say: "M", means: "a PVM memory: its bytes, and which pages may be read or written" },
  "ram¬value": { say: "v", means: "memory's bytes" },
  "ram¬access": { say: "a", means: "memory's access: for each page, readable, writable or neither" },
  memory: { say: "mu", means: "the PVM's memory" },
  readable: { say: "V sub mu", means: "the addresses of memory μ that may be read" },
  writable: { say: "V sub mu star", means: "the addresses of memory μ that may be written" },
  Cpvmpagesize: { say: "Z sub P", means: "a memory page: 4,096 bytes" },
  gas: { say: "N sub G", means: "an amount of gas: a u64" },
  signedgas: { say: "Z sub G", means: "gas that can go negative: an i64" },
  gascounter: { say: "rho (curly)", means: "the gas left" },
  halt: { say: "halt", means: "∎: the program finished normally" },
  panic: { say: "panic", means: "↯: the program trapped" },
  oog: { say: "out of gas", means: "∞: the program ran out of gas" },
  fault: { say: "page fault", means: "Ⅎ: the program touched memory it may not" },
  host: { say: "host call", means: "ħ: the program asked the host for something, and waits" },

  // notation first seen here
  colon: "skip",
  frac: { say: "over", means: "a fraction: the top divided by the bottom" },
  floor: { say: "floor of", means: "rounded down to a whole number", entry: "floor" },
  nicefrac: { say: "over", means: "a fraction: the top divided by the bottom" },
};
