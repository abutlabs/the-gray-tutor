// The symbols §9, Service Accounts first uses, in plain words (gray-paper-glosses.ts says how a
// key is made from them). Each entry: how to say it aloud, and what it means, in a line a
// reader new to the paper can follow; "skip" for typography a key needn't explain.

import type { Glosses } from "../gray-paper-glosses.ts";

export const S09: Glosses = {
  // \mathbb{A}
  // paper: The set of service \mathbb{A}ccounts.
  serviceaccount: { say: "A", means: "a service account: three dictionaries (storage, preimages, requests) and eight plain fields" },
  // \mathbf{s}
  "sa¬storage": { say: "s", means: "an account's storage: keys to values, both any bytes, written by its own accumulate code" },
  // \mathbf{p}
  "sa¬preimages": { say: "p", means: "an account's preimages: each a blob filed under its own 32-byte hash" },
  // \mathbf{l}
  "sa¬requests": { say: "l", means: "an account's requests: for each (hash, length) asked for, a history of up to 3 slots" },
  // c
  "sa¬codehash": { say: "c", means: "an account's code hash: names the preimage holding its code" },
  // b
  "sa¬balance": { say: "b", means: "an account's balance, in tokens: a u64" },
  // f
  "sa¬gratis": { say: "f", means: "an account's gratis offset: deposit it is let off, taken from its minimum balance" },
  // g
  "sa¬minaccgas": { say: "g", means: "the least gas each work-item for this service must bring to accumulate" },
  // m
  "sa¬minmemogas": { say: "m", means: "the least gas each transfer to this service must bring" },
  // r
  "sa¬created": { say: "r", means: "the slot the service was created at" },
  // a
  "sa¬lastacc": { say: "a", means: "the slot the service last accumulated at" },
  // p
  "sa¬parent": { say: "p", means: "the parent: the id of the service that created this one" },
  // \mathbf{c}
  "sa¬code": { say: "c (bold)", means: "an account's code: the PVM program, the second half of its code-hash preimage; ∅ if there is none" },
  // \mathbf{m}
  "sa¬metadata": { say: "m (bold)", means: "an account's metadata: a blob for people (a name, a version), before the code in its preimage" },
  // \Lambda
  // paper: The historical lookup function.
  histlookup: { say: "lambda (capital)", means: "the historical lookup: the preimage with hash h if the account had it at slot t, else ∅" },
  // \mathsf{D}
  // paper: [19,200] The period in timeslots after which an unreferenced preimage may be expunged. See \texttt{eject} definition in section \ref{sec:accumulatefunctions}.
  Cexpungeperiod: { say: "D", means: "the expunge period: slots a forgotten preimage is kept before it may go, 19,200 on full, 32 on tiny" },
  // \Rightarrow
  Rightarrow: { say: "implies", means: "if the left holds, the right must hold too" },
  // i
  "sa¬items": { say: "i", means: "an account's items: 2 per request plus 1 per storage entry" },
  // o
  "sa¬octets": { say: "o", means: "an account's octets: the bytes it keeps, with 81 per request and 34 per storage entry on top" },
  // t
  "sa¬minbalance": { say: "t", means: "an account's minimum balance: 100, plus 10 per item and 1 per octet, less f, never below 0" },
  // \sum
  sum: { say: "the sum of", means: "add up what follows, once for each value the subscript ranges over" },
  // \limits
  limits: "skip",
  // \max
  max: { say: "max of", means: "the largest of the values in the brackets" },
  // \chi_M
  // paper: The index of the blessed service.
  manager: { say: "chi sub M", means: "the manager: the one service that may change the privileges and grant free storage" },
  // \chi_V
  // paper: The index of the designate service.
  delegator: { say: "chi sub V", means: "the delegator: the one service that may set the next epoch's validator keys" },
  // \chi_R
  // paper: The index of the registrar service.
  registrar: { say: "chi sub R", means: "the registrar: the one service that may create services with the reserved low ids" },
  // \chi_A
  // paper: The indices of the services able to assign each core's authorizer queue.
  assigners: { say: "chi sub A", means: "the assigners: for each core, the service that may replace its authorizer queue" },
  // \chi_Z
  // paper: The always-accumulate service indices and their basic gas allowance.
  alwaysaccers: { say: "chi sub Z", means: "the always-accumulate services: each accumulates every block, with this much gas" },
};
