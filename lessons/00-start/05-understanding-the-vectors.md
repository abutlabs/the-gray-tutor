# Understanding the vectors

Everything you build in this tutorial is graded by one folder: `vectors/`, the official
test vectors. Before you write a line of the client, this lesson opens that folder and
looks at one vector of each kind. By the end you can open any file in it, say what question it
asks and what answer it expects, and name the file of your client that will answer it,
and the lesson that writes it. Nothing here is code to type: it is a map of the road
ahead, so each later part has a place to land.

## New words

- **Vector family.** A folder of vectors that all test one rule. *Example:*
  `stf/disputes` holds 29 tiny vectors, all about disputes.
- **Pre-state and post-state.** The state before a step, and the state a correct client
  must have after it. *Example:* a disputes vector's `pre_state` has an empty list of
  bad reports, and its `post_state` has one.
- **Round trip.** Changing something into another form and back, and getting exactly
  what you started with. *Example:* a work item to bytes and back to the same work item.

## The kinds of vector

The folder has the vectors in five classes, and each one asks a different kind of
question. (The folder's own `README.md` lists four; `trie/` and `shuffle/` sit beside
them without being listed there.) A sixth folder, `lib/`, holds no vectors at all.

| Folder | The question | Which way the check runs |
| --- | --- | --- |
| `codec/` | What are this value's bytes, and what value are these bytes? | Both ways: a round trip |
| `stf/` | Given this state and this input, what is the state after? | Forward only |
| `traces/` | Given this state and this whole block, what is the state after? | Forward only, a block at a time |
| `trie/`, `shuffle/` | What does this one function answer for this input? | Forward only |
| `erasure/` | Split this data into shards; the shards must be these | Forward (not built in this tutorial) |
| `lib/` | None: the type files and scripts that make and check the other folders | Not a vector |

*STF* is the state transition function ([lesson 0.1](./01-what-you-will-build.md)'s
Υ), and `stf/` tests it one rule at a time. `traces/` tests all the rules together, on
real blocks.

Why forward only? A state transition can't be run backwards: many different states lead
to the same next one. A codec can, because bytes and value are the same thing in two
spellings. So a codec vector is checked both ways, and a transition vector one way.

The tour below takes one vector from each of the first three classes, then looks at the
rest, and shows the file
in your client that will answer it. Those files don't exist yet. Each preview says which
lesson writes it, and shows only what goes in and what comes out, because the rule
inside is that lesson's job.

## Codec: one value, two spellings

`codec/tiny/work_item.json` and `work_item.bin` are the same work item, once as readable
fields and once as bytes. The start of the `.json`:

```json
{
    "service": 16909060,
    "code_hash": "0x70a50829851e8f6a8c80f92806ae0e95eb7c06ad064e311cc39107b3219e532e",
    "refine_gas_limit": 42,
    "accumulate_gas_limit": 42,
    "export_count": 4,
    "payload": "0x0102030405",
    ...
}
```

and the start of the `.bin`, in bytes, field by field:

```text
04 03 02 01          service 16909060, as a u32 (4 bytes, smallest byte first)
70 a5 08 ... 9e 53 2e  code_hash (32 bytes)
2a 00 00 00 00 00 00 00  refine_gas_limit 42, as a u64 (8 bytes)
2a 00 00 00 00 00 00 00  accumulate_gas_limit 42, as a u64 (8 bytes)
04 00                export_count 4, as a u16 (2 bytes)
05 01 02 03 04 05    payload: a length of 5, then its 5 bytes
```

Your client checks it in two directions, and both must hold: the `.bin` decodes to the
`.json`'s value, and that value encodes back to exactly the `.bin`. The file that does
it is a codec. A *codec* is one object that knows how to write a value as bytes and read
it back, so the one description of a work item serves both directions.

What you'll write, and where:

```ts
// src/codec/codec.ts, from lesson 2.4: encode and decode, for any codec.
export function encode<T>(codec: Codec<T>, value: T): Bytes;
export function decode<T>(codec: Codec<T>, bytes: Bytes): T;

// src/work.ts, from lesson 2.6: the shape of work_item.json, field by field.
export const WorkItem: Codec<WorkItem>;
```

The same pair, `encode` and `decode`, will serve every other codec vector in the folder:
headers, blocks, every extrinsic. The codec is the bottom layer, and every later file
imports it. That is why [Part 2](../02-codec/index.md) comes first.

## STF: one rule, one question

`stf/disputes/tiny/progress_with_bad_signatures-1.json` is one file with four parts,
and no `.bin` is needed to read it. Here it is, trimmed:

```text
input       disputes: verdicts (a target report, its votes, each vote signed),
            culprits and faults
pre_state   psi (past judgements, all empty), rho (the cores' pending reports),
            tau (the time, 0), kappa and lambda (the validator keys)
output      {"err": "bad_signature"}
post_state  the same five names, the same values: nothing changed
```

The question is the `input` with the `pre_state`. The answer is the `output` and the
`post_state`. Here the answer is a refusal: one signature in the input is wrong, so the
rule must say `bad_signature`, and the state must stay as it was. A vector that expects
`ok` instead lists the new state: the new `psi`, and `rho` with the judged reports
cleared.

Your client has to be *all* of the vector's answer: the same error, or the same `ok` and
the same state afterwards. Getting the error right and the state wrong is a failing
vector.

What you'll write, and where:

```ts
// src/disputes.ts, from lesson 10.1; this function is finished in lesson 10.5.
// Every disputes rule, in the order the Gray Paper lists them.
// Returns the rule's name if the disputes break one, else null.
export function disputesError(
  config: Config,                 // tiny or full: how many validators and cores
  disputes: DisputesExtrinsic,    // the vector's input.disputes
  before: PastJudgements,         // the vector's pre_state.psi
  time: number,                   // the vector's pre_state.tau
  active: ValidatorKey[],         // the vector's pre_state.kappa
  previous: ValidatorKey[],       // the vector's pre_state.lambda
): string | null;                 // "bad_signature", or null for ok
```

Every argument is a field of the vector. That is the habit to take from this lesson:
**a vector's `input` and `pre_state` are the arguments of one function, and its `output`
and `post_state` are what the function must return.** Reading a vector is the same job as
reading a function's signature.

Each of the nine families in `stf/` is one such function, from one part:

| Family | Tiny / full | The rule | Your file | First written in |
| --- | --- | --- | --- | --- |
| `safrole` | 21 / 25 | who may author, and the lottery | `src/safrole.ts` | [8.1](../08-safrole/01-stirring-the-entropy.md) |
| `history` | 4 / 4 | the record of recent blocks | `src/history.ts` | [9.2](../09-recent-history/02-recent-blocks.md) |
| `disputes` | 29 / 31 | judging reports good or bad | `src/disputes.ts` | [10.1](../10-disputes/01-votes-and-verdicts.md) |
| `assurances` | 11 / 11 | which work is now available | `src/assurances.ts` | [11.1](../11-assurances/01-available.md) |
| `reports` | 44 / 48 | which work reports are accepted | `src/guarantors.ts` | [12.1](../12-guarantees/01-who-guarantees-what.md) |
| `authorizations` | 3 / 3 | who may submit work to a core | `src/authorization.ts` | [13.1](../13-authorization/01-the-authorizer-pools.md) |
| `preimages` | 8 / 8 | data that services ask for by hash | `src/services.ts` | [14.1](../14-services/01-providing-preimages.md) |
| `accumulate` | 63 / 63 | running the work's results | `src/accumulate.ts` | [16.7](../16-host-calls/07-a-services-inputs.md), then [Part 17](../17-accumulation/index.md) |
| `statistics` | 4 / 4 | who did what, counted | `src/statistics.ts` | [18.1](../18-statistics/01-who-did-what.md) |

Tiny and full are two sizes of the same chain, with 6 validators or 1,023
([lesson 4.2](../04-blocks/02-tiny-and-full.md) explains). The same file answers both;
only the `config` argument changes.

## Traces: all the rules at once

A trace is a recorded run of real blocks, one JSON file per block. `traces/fallback/` is
a run of 100 blocks on the tiny chain. Each file has a `pre_state`, a `block` (a header and
its extrinsic) and a `post_state`; the states are lists of key and value pairs, the
*whole* state this time, not five named parts:

```text
pre_state   state_root: one hash that fingerprints the whole state
            keyvals:    21 pairs in the first block, each a 31-byte key and a value, such as
                        0x001f00d8...  ->  0x0100000000
block       header:     the block's cover page (its slot, its parent, its seal...)
            extrinsic:  the five parts: tickets, preimages, guarantees,
                        assurances, disputes
post_state  state_root, keyvals: the same, after the block
```

A trace asks the STF's whole question at once: apply this block to this state, and
produce the next state. The answer is judged by its fingerprint, the *state root*, a hash
of the whole state that [Part 6](../06-state-and-merklization/index.md) builds. If your
root matches the vector's, your whole state matches.

What you'll write, and where:

```ts
// src/trie.ts, from lesson 6.1: the fingerprint of a state's pairs.
export function stateRoot(entries: KeyValue[]): Bytes;

// src/import.ts, from lesson 19.1 (importing a block is lesson 19.4):
// Υ, the whole transition. Returns the new pairs, or why the block is refused.
export function importBlock(
  config: Config,
  entries: KeyValue[],     // the trace's pre_state.keyvals
  block: Block,            // the trace's block
): KeyValue[] | Refused;
```

`importBlock` is where the nine functions above meet. It calls them in an order that
respects what each one needs: the same `disputesError` that answered the vector in the last
section answers it again, now inside a block. So an STF vector isn't a separate chore. It
is the test of one piece that block import will later call, run alone while it's easy to
see.

What is that order, and which pieces don't need each other? [Lesson 0.6](./06-how-a-block-is-ordered.md)
draws it as a timeline.

## Is a pre-state something you'd see in the wild?

The states are real; the *pair* is the test's. A running client holds one state, the
chain's memory so far. A block arrives, the client works out the next state, and that
becomes the one it holds. "Pre-state" and "post-state" are only names for the state your
client holds just before a block and just after it. What a vector adds is someone having
written the answer down in advance.

In the wild nobody hands you the post-state. You compute it, and the only check is the
next block: its header carries `parent_state_root`, the root of the state after the block
before it. (The vectors use this too: a trace's `pre_state` must have the root that its
block's header promises.)

The three kinds of vector show the state in different amounts:

| Vectors | What `pre_state` and `post_state` hold | Looks like the wild? |
| --- | --- | --- |
| `codec/`, `trie/`, `shuffle/` | No state at all: a value and its bytes, or an input and an answer | No |
| `stf/` | A *slice*: only the parts of the state this one rule reads or writes | No |
| `traces/` | The *whole* state, as pairs, for every block of a run | Yes |

A slice is what makes an STF vector small enough to read. The `input` is cut down the
same way: it holds only the parts of the block this rule reads. What each family's
`pre_state` holds, from the vectors themselves:

| Family | `pre_state` holds |
| --- | --- |
| `safrole` | `tau`, `eta`, `lambda`, `kappa`, `gamma_k`, `iota`, `gamma_a`, `gamma_s`, `gamma_z`, `post_offenders` |
| `history` | `beta` |
| `disputes` | `psi`, `rho`, `tau`, `kappa`, `lambda` |
| `assurances` | `avail_assignments`, `curr_validators`, `post_validators` |
| `reports` | `avail_assignments`, `curr_validators`, `prev_validators`, `entropy`, `offenders`, `recent_blocks`, `auth_pools`, `accounts`, `cores_statistics`, `services_statistics` |
| `authorizations` | `auth_pools`, `auth_queues` |
| `preimages` | `accounts`, `statistics` |
| `accumulate` | `slot`, `entropy`, `ready_queue`, `accumulated`, `privileges`, `statistics`, `accounts` |
| `statistics` | `vals_curr_stats`, `vals_last_stats`, `slot`, `curr_validators` |

Two things to watch for in them:

- **The names are the vectors' own, and they differ between families.** The current
  validators are `kappa` in `disputes` and `curr_validators` in `assurances`. They are one
  thing under two names ([the symbols page](../symbols.md#synonyms) gathers such groups).
- **A slice's `post_state` is not always a state the chain ever holds.** Block import makes
  some values halfway through a block: the Gray Paper writes them with a dagger or two
  (ρ†, ρ‡). A `disputes` vector's `post_state` has ρ†, and an `assurances` vector's answer
  is ρ‡. Both are a stage in the middle of the block that no chain ever stores. They exist
  so each rule can be checked alone.

So the progression of the chain is what `traces/` checks, block after block with the
whole state, and in [Part 20](../20-facing-the-fuzzer/index.md) the fuzzer, which has no
vectors at all: it sends your client a starting state, then blocks, and compares the state
root you answer with after each one. The nine `stf/` families check the rules that
progression is made of, one at a time.

## The rest of the folder

**`trie/` and `shuffle/`** are the small ones, each a single JSON file of cases. A trie case
is a set of key and value pairs and the root they must give:

```text
input    {"16c72e0c...adb8ec": ""}     one pair: a key, and an empty value
output   "99ecb150...9e076a"           the root of a trie holding just that pair
```

A shuffle case is a length, a 32-byte entropy and the order that comes out:

```text
input    8                             shuffle the numbers 0 to 7
entropy  ff ff ff ... ff               32 bytes, all 0xff
output   [1, 2, 6, 0, 7, 4, 3, 5]
```

The shuffle vector doesn't list the input sequence. It is always the numbers 0 to n - 1,
and your client builds it from the length. (They are checked by `stateRoot` in lesson
[6.1](../06-state-and-merklization/01-the-state-trie.md) and `shuffleWithHash` in lesson
[7.2](../07-time-and-shuffling/02-the-shuffle.md).)

**`erasure/`** holds 12 vectors, six data sizes at each of the two sizes. Erasure
coding is how validators split a work package's data into *shards*, one per validator, so
that the data can be rebuilt from only some of the shards (the Gray Paper's erasure coding
appendix). Each
vector is a `data` and the list of `shards` it must give:

```text
tiny   ec-100   data: 100 bytes     shards: 6 of 34 bytes     (one per tiny validator)
full   ec-100   data: 100 bytes     shards: 1023 of 2 bytes   (one per full validator)
```

The other sizes are 3, 32, 4096, 4104 and 10000 bytes. A block importer never splits or
rebuilds data, so this tutorial doesn't build it and the scoreboard shows these 12 as
*not run yet*. They are part of why the finished board is 1,406 of 1,428, and
[the scoreboard page](../scoreboard.md) gives the rest of the reason.

**`lib/` is not a vector class.** It is the toolbox that makes and checks the others: the
type files (`jam-types.asn`, `tiny-const.asn`, `full-const.asn`) and two Python scripts
(`bin_to_json.py`, `validate_asn1.py`). It asks your client nothing, but it is the best
reference when a `.json` field puzzles you, as the next section shows.

## Where the vectors come from, and the Python scripts

`npm run vectors` downloads the vectors from the official `jam-test-vectors` repository,
at the tag for Gray Paper 0.8.0, so you never make a vector yourself. Knowing how they are
made explains what you see in them. The scripts are Python, and you don't need to run
them: the downloaded folders already hold their output.

**The `.bin` files are the original, and the `.json` files are made from them.** The
vectors' authors write the binary, and a script turns each `.bin` into the readable
`.json` beside it. Three kinds of file take part:

1. **The shape: an `.asn` file.** ASN.1 is a notation for describing the shape of data.
   `lib/jam-types.asn` is the dictionary of every shared type, and its `WorkItem` lists
   the fields of the work item you just met, in the same order as its bytes:
   `service`, `code-hash`, `refine-gas-limit`, `accumulate-gas-limit`, `export-count`,
   `payload`, `import-segments`, and so on. Each family adds a small `.asn` of its own: the
   disputes one defines its `State` (psi, rho, tau, kappa, lambda), its `Input`, its
   `OutputData` (the offenders mark) and its list of error codes. The two `-const.asn`
   files hold the numbers that make tiny and full differ: 6 and 1,023 validators,
   2 and 341 cores, epochs of 12 and 600 slots, a bitfield of 1 and 43 bytes.
2. **The converter: `convert.py` and `bin_to_json.py`.** Each folder's `convert.py` says
   which shape each file has (a trace file is a `pre_state`, a `block` and a `post_state`;
   a state is a `state_root` and a list of `keyvals`) and calls `convert_group`, in
   `lib/bin_to_json.py`. That reads each `.bin` with the `jam_types` Python library, for
   the tiny or the full spec, and writes the `.json` next to it. One detail matters for
   you: the `.bin` of an STF vector holds a *number* for an error, and the converter
   turns it into the name you read in `output`, such as `bad_signature`. The Gray Paper
   doesn't specify these codes, and the schema says to feel free to ignore their value, so
   the names are the vectors' own. This tutorial compares them anyway, because they are
   what tells a vector's refusal apart from another.
3. **The checker: `validate.py` and `validate_asn1.py`.** To prove a `.json` is faithful
   to its schema, the checker rewrites it for ASN.1 (`snake_case` names become
   `kebab-case`, `0x` prefixes go), decodes it against the schema with its size limits
   checked (a `shards` list must have exactly `validators-count` entries), encodes it
   back, and checks that the result is the text it started from: a round trip, like your
   codec's. It finds the shape to use from the file's name, `work_item.json` being a
   `WorkItem` (a trailing number, as in `header_0.json`, is dropped), unless the schema
   names a `TestCase`, as the erasure schema does.

`trie/merkle.py` and `shuffle/main.py` are a different kind of script: they *generate*
`trie.json` and `shuffle_tests.json` from a plain Python version of the Gray Paper's rule.
Their headers cite older Gray Paper versions (0.2.2 and 0.4.3), so read them as the
authors' working notes. What the tutorial checks is the vectors' answers, against the
0.8.0 rules.

With this you can read any vector in the folder: find its `.asn` for the shape, the
constants for the size, and the family's README for what each case is for. If a field is
unclear, the schema comment above it usually says what it is.

## The plan, in one table

Putting the kinds together (`erasure/` is left out: this tutorial doesn't build it):

| Layer | Vectors that test it | Files | Parts |
| --- | --- | --- | --- |
| Bytes | `codec/` | `codec/`, `work.ts`, `block.ts` | [2](../02-codec/index.md) to [5](../05-hashing-and-signatures/index.md) |
| State | `trie/` | `trie.ts`, `state.ts` | [6](../06-state-and-merklization/index.md) |
| Rules | `stf/` and `shuffle/` | one file per row of the table above | [7](../07-time-and-shuffling/index.md) to [18](../18-statistics/index.md) |
| Everything | `traces/` | `whole-state.ts`, `import.ts` | [19](../19-block-import/index.md) |

Four things to take from it when you plan your own client:

1. **One file per Gray Paper idea.** Each row of the STF table is a file you can test
   alone, on its own family.
2. **Bytes first.** Nothing else can be tested until the client can read a vector's
   fields, so the codec comes before every rule.
3. **Each rule is a function from a vector's input to its output.** Pick the arguments
   from the vector's fields, and the function's shape is already settled.
4. **The whole is built from the parts.** Block import only calls what you've already
   tested. If a trace fails, the family that covers the failing rule narrows it down.

The *scoreboard* ([lesson 2.6](../02-codec/06-the-first-test-vectors.md)) counts these
vectors as you go, each run whole, and [Grafana](./03-watch-your-client.md) keeps the
count. Your client starts near zero and climbs with every part.

## Check your understanding

::: check
**A codec vector has a `.bin` and a `.json`. How is it checked?**

- [ ] The `.json` is run through the codec, and the output compared with the `.bin`, and that's all
  > No: that is one direction. An encoder could pass that and still fail to read bytes
  > back.
- [x] The `.bin` decodes to the `.json`'s value, and that value encodes back to exactly the `.bin`
  > Yes: both directions must hold, so the codec is a true round trip.
- [ ] The `.bin` is the question and the `.json` is a hint
  > No: they are the same value in two spellings. Neither is the answer to the other.

**A disputes vector's `output` is `{"err": "bad_signature"}`. What must your client do?**

- [ ] Return `bad_signature` and compute the new state anyway
  > No: a refused input leaves the state as it was. The `post_state` equals the
  > `pre_state`.
- [x] Return `bad_signature`, and leave the state exactly as it was
  > Yes: the error and the unchanged state together are the whole answer.
- [ ] Return the new state, and ignore the error name
  > No: the vector wants this error, and the error is part of the answer.

**Why does a trace come after the `stf/` families in the tutorial?**

- [ ] Traces are about a different part of the Gray Paper
  > No: a trace tests the same rules, together.
- [ ] Traces are smaller, so they are easier
  > No: a trace is a whole block with a whole state, so it needs everything at once.
- [x] A trace applies all the rules to one block, so it needs each rule already working
  > Yes: block import calls the nine STF functions. Each was tested alone first, so
  > a failing trace points at the one that broke.
:::

## What you have

A map of the vectors: what the kinds ask, which way each is checked, the files that will
answer them, and the part that writes each. No code yet; it will be easier to place now
that you know where it's going. The nine STF functions are only half the picture, though:
a block import calls them in an order, and some can run side by side. [The next
lesson](./06-how-a-block-is-ordered.md) draws that order.

Next: [0.6 How a block is ordered](./06-how-a-block-is-ordered.md)
