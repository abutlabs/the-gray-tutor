// The symbols §1 to §3, the notation, first uses, in plain words (gray-paper-glosses.ts says
// how a key is made from them). Each entry: how to say it aloud, and what it means, in a
// line a reader new to the paper can follow; "skip" for typography a key needn't explain.
// These are the paper's grammar: the brackets, arrows and set signs every later part uses.

import type { Glosses } from "../gray-paper-glosses.ts";

export const S03: Glosses = {
  // sets of numbers, bytes and hashes
  N: { say: "N", means: "the whole numbers: 0, 1, 2 and up; a subscript is a bound, ℕ₈ is 0 to 7", entry: "naturals" },
  Nmax: { say: "N sub n", means: "the whole numbers below n: ℕ_C is a core index, 0 to C − 1", entry: "naturals" },
  Nbits: { say: "N sub two to the n", means: "the numbers that fit in n bits: ℕ_{2³²} is a u32", entry: "naturals" },
  Z: { say: "Z", means: "the integers, negative ones too; a subscript gives the range" },
  bloblength: { say: "N sub L", means: "a length of bytes: a u32 (below 2³²)" },
  blob: { say: "B, or B sub n", means: "bytes: any run of them; 𝔹ₙ exactly n of them", entry: "blobs" },
  bitstring: { say: "b sub n", means: "bits: a run of true-or-false values; a subscript is how many" },
  decode: { say: "E inverse of", means: "decoding: bytes back into the value they encode", entry: "decode" },
  hash: { say: "H", means: "a 32-byte value, usually a hash" },
  zerohash: { say: "H zero", means: "32 zero bytes: a placeholder where a hash isn't known yet" },
  bool: { say: "true or false", means: "a yes-or-no value: true (⊤) or false (⊥)" },
  top: { say: "top", means: "true" },
  bot: { say: "bottom", means: "false, the no of a yes-or-no value" },

  // the paper's functions, from outside: hashing, signing, shuffling
  fnblake: { say: "H", means: "Blake2b, the 256-bit hash: any bytes in, 32 bytes out" },
  blake: { say: "H of", means: "the Blake2b hash of what's in the brackets: 32 bytes" },
  keccak: { say: "H sub K of", means: "the Keccak-256 hash, as Ethereum uses it: 32 bytes" },
  fnfyshuffle: { say: "F", means: "the Fisher-Yates shuffle: a sequence and some entropy in, the same items in a fixed random order out" },
  edkey: { say: "H bar", means: "an Ed25519 public key: 32 bytes" },
  edsignature: { say: "V bar sub k of m", means: "the valid Ed25519 signatures by key k on message m: 64 bytes" },
  edsigndata: { say: "S bar sub k of m", means: "signing message m with Ed25519 key k" },
  bskey: { say: "H tilde", means: "a Bandersnatch public key: 32 bytes" },
  bssignature: { say: "V tilde sub k, context c, of m", means: "the valid Bandersnatch signatures by key k on message m in context c: 96 bytes" },
  bsringproof: { say: "V ring sub r, context c, of m", means: "a ring proof: signed by some key in the ring with root r, without saying which: 784 bytes" },
  ringroot: { say: "B ring", means: "a Bandersnatch ring root: one 144-byte commitment to a whole set of keys" },
  getringroot: { say: "O of", means: "the ring root of a list of Bandersnatch keys" },
  banderout: { say: "Y of", means: "the 32-byte random output a Bandersnatch signature or proof carries, used as entropy" },
  blskey: { say: "B BLS", means: "a BLS public key: 144 bytes" },
  blssignature: { say: "V BLS sub k of m", means: "the valid BLS signatures by key k on message m" },
  blssigndata: { say: "S BLS sub k of m", means: "signing message m with BLS key k" },

  // the state and its transition
  thestate: { say: "sigma", means: "the state: everything the chain remembers between blocks", entry: "state" },
  transitionstate: { say: "upsilon", means: "the state transition: the state and a block in, the next state out", entry: "transition" },

  // definitions and logic
  equiv: { say: "is defined as", means: "the left side is, by definition, the right: a definition, not a test", entry: "defined-as" },
  prec: { say: "is defined in terms of", means: "y ≺ x: y can be computed from x alone" },
  in: { say: "in", means: "belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type", entry: "in" },
  isa: { say: "in", means: "belongs to: the field's type", entry: "in" },
  is: { say: "is a", means: "names a field and gives its type, in a tuple" },
  forall: { say: "for all", means: "for every value: ∀c ∈ ℕ_C means for each core c" },
  exists: { say: "there exists", means: "there is at least one value such that what follows holds", entry: "exists" },
  Leftrightarrow: { say: "exactly when", means: "if and only if: both sides are true together, or false together" },
  Longleftrightarrow: { say: "exactly when", means: "if and only if: both sides are true together, or false together" },
  neg: { say: "not", means: "the opposite of what follows" },
  not: "skip",
  vee: { say: "or", means: "at least one side is true" },
  bigwedge: { say: "all of", means: "every one of the conditions under it is true" },
  ne: { say: "is not", means: "not equal" },
  le: { say: "at most", means: "less than or equal to" },
  subifnone: { say: "U of", means: "the first of its arguments that isn't nothing (∅), or ∅ if all are" },
  fnsubifnone: { say: "U", means: "substitute-if-nothing: the first argument that isn't ∅" },
  none: { say: "nothing", means: "∅: no value at all, like null" },
  optional: { say: "or nothing", means: "a value of this type, or ∅ (null)" },
  error: { say: "error", means: "∇: an error result" },

  // sets
  set: { say: "the set of", means: "a set: values with no order and no repeats" },
  protoset: { say: "the set of", means: "a set written in order: no repeats, kept sorted" },
  build: { say: "for each, such that", means: "built by a rule: the left-hand value, for every case the right-hand side allows (a set, or a sequence in order)" },
  cup: { say: "union", means: "everything in either side" },
  cap: { say: "intersection", means: "only what's in both sides" },
  setminus: { say: "without", means: "the left side with every item of the right taken out" },
  subset: { say: "is a proper subset of", means: "everything in the left is in the right, and the right has more" },
  subseteq: { say: "is a subset of", means: "everything in the left is in the right" },
  disjoint: { say: "share nothing with", means: "the two sides have no item in common" },
  len: { say: "the size of", means: "|x|: how many items x has, or how many bytes" },

  // dictionaries and tuples
  dictionary: { say: "a dictionary from K to V", means: "a map: keys of type K, each with one value of type V" },
  keyvalue: { say: "K to V", means: "one key paired with one value" },
  kv: { say: "k maps to v", means: "a dictionary entry: key k, value v" },
  keys: { say: "K of", means: "a dictionary's keys" },
  values: { say: "V of", means: "a dictionary's (or sequence's) values" },
  tuple: { say: "the tuple of", means: "a record: named fields, each with its type, like an object in JSON" },
  tup: "skip",
  times: { say: "times", means: "multiply; between sets, every pair of one from each" },

  // sequences
  sequence: { say: "a sequence of", means: "⟦T⟧ is an array of T; a subscript is its length, :n at most n, n: at least n", entry: "sequence" },
  sq: { say: "the sequence", means: "a sequence written out item by item; [ ] is the empty one", entry: "sequence" },
  order: "skip",
  concat: { say: "concatenate", means: "join: the left sequence followed by the right", entry: "concat" },
  append: { say: "append", means: "add one item at the end of the sequence", entry: "concat" },
  concatall: { say: "all joined", means: "every sequence in it, joined end to end into one" },
  seqminusl: { say: "without its first", means: "the sequence with the leftmost copy of the item taken out" },
  orderedin: { say: "in order, from", means: "each item of the sequence, in its order" },
  sqorderby: { say: "sorted by", means: "the sequence's items, sorted by the key on the right" },
  sqorderuniqby: { say: "sorted, no repeats, by", means: "sorted by the key on the right, each key once" },
  cyclic: { say: "wrapped around", means: "↺: the index goes round, counting from 0 again past the end (mod the length)" },
  overleftarrow: { say: "the last n of", means: "with a number above: keep only the rightmost (newest) n items; with none: the sequence reversed" },
  overrightarrow: { say: "the first n of", means: "with a number above: keep only the leftmost n items" },
  interval: { say: "from x to y", means: "the items from index x up to, not including, y" },
  subrange: { say: "from x, y of them", means: "y items, starting at index x" },
  sub: "skip",
  subb: { say: "at", means: "x[i]: the item at index i, or the value at key i", entry: "sequence" },
  dots: "skip",

  // numbers
  rem: { say: "mod", means: "the remainder after dividing", entry: "mod" },
  remainder: { say: "R", means: "the remainder of a division" },
  div: { say: "divided by", means: "division, exact; rounded only where ⌊ ⌋, ⌈ ⌉ or rtz says so" },
  cdot: { say: "times", means: "multiply" },

  // typography: drawn, never keyed
  mathbf: "skip", mathcal: "skip", mathrm: "skip", text: "skip", otherwise: "skip", quad: "skip",
  begin: "skip", end: "skip", label: "skip", Box: "skip",
  // the paper's words inside formulas ("if", "otherwise", "where"): read as they're written
  when: "skip", otherwhen: "skip", where: "skip", also: "skip", using: "skip", exc: "skip", suchthat: "skip",
};
