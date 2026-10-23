# Glossary

Every word this tutorial uses that a newcomer might not know, in plain English first,
with a small example. Where the Gray Paper (the GP, JAM's specification) has a symbol for
it, the symbol comes next, and the link at the end goes to the lesson that builds it.

You don't need to read this page first. Come back whenever a word stops you. The groups go
from the most everyday words to the most JAM-specific ones.

## Gray Paper symbols

The Gray Paper's symbols, from ℕ and ⌢ to σ and Ψ, have a page of their own: [Gray Paper
symbols](./symbols.md), with how to say each one, what it means, and where it's used.

## The big picture

**JAM.** A blockchain protocol that blends ideas from Polkadot and Ethereum: anyone can put
a program (a service) on it, and the work for those programs runs in parallel on many
cores. *Example:* in [Part 15](./15-the-pvm/index.md) you run a real service's code.
([0.1](./00-start/01-what-you-will-build.md))

**Gray Paper (GP).** JAM's specification: the document that defines every rule, mostly in
maths. It is still being improved, and new versions change rules; this tutorial follows
version 0.8.0. *Example:* "§4" is its section 4.
([0.1](./00-start/01-what-you-will-build.md))

**Client.** A program that follows a protocol's rules. A JAM client reads blocks and works
out the chain's state, the same way every other client does. *Example:* lasair, and yours.
([0.1](./00-start/01-what-you-will-build.md))

## Programming words

**TypeScript.** JavaScript with types: you write down what kind of value each thing is
(a number, a list of bytes...), and a checker, `tsc`, catches mix-ups before you run
anything. *Example:* `const slot: number = 42`. ([0.2](./00-start/02-set-up-the-project.md))

**Node.** The program that runs your TypeScript files, outside a browser. *Example:*
`node bin/now.ts` runs the clock program. ([0.2](./00-start/02-set-up-the-project.md))

**npm.** Node's tool for downloading libraries and running a project's scripts.
*Example:* `npm test` runs every test. ([0.2](./00-start/02-set-up-the-project.md))

**Script.** A command with a name, kept in `package.json`'s `scripts`, that `npm run`
runs; words after the name go on to the command, or the script carries its own. *Example:*
`npm run decode work_item x.bin` runs `node bin/decode.ts work_item x.bin`, and `npm run
decode-work-item` runs it on the vectors' work item. ([0.3](./00-start/03-watch-your-client.md))

**Test.** A small program that checks one thing your code should do, and fails loudly if
it doesn't. This tutorial uses test-driven development: the test first, then the code.
*Example:* "slot 0 is the first six seconds of the JAM Common Era".
([0.4](./00-start/04-the-jam-clock.md))

**Test vector.** An official example from JAM's test suite: an input and the exact output
a correct client must produce, as files. Matching them is how you know your client is
right. *Example:* `codec/tiny/work_item.bin` and its `.json`.
([2.6](./02-codec/06-the-first-test-vectors.md))

**Vector family.** One kind of test vector, in a folder of its own, all checked the same
way. *Example:* `codec`, `stf/safrole`, `traces/fallback`.
([2.6](./02-codec/06-the-first-test-vectors.md))

**Scoreboard.** Your client's tally of every official test vector, each one run whole:
your client's answer must be all of the vector's. `npm run scoreboard` prints it, and
Grafana's *8 · Official vectors* dashboard keeps it. *Example:* 4 of 1,428, the first time it runs.
([2.6](./02-codec/06-the-first-test-vectors.md))

**nvm.** A tool that installs Node versions and switches between them. *Example:*
`nvm use`. ([0.2](./00-start/02-set-up-the-project.md))

**tsc.** The TypeScript compiler; in this tutorial it only checks types and writes
nothing. *Example:* `npm run typecheck`. ([0.2](./00-start/02-set-up-the-project.md))

**Docker.** Runs ready-made programs in containers, so a whole set of tools starts with one
command. *Example:* `./obs up`. ([0.2](./00-start/02-set-up-the-project.md))

**Module.** A file that shares code with other files through `import` and `export`.
*Example:* `src/time.ts` exports `slotAt`. ([0.2](./00-start/02-set-up-the-project.md))

**Assertion.** One check inside a test: if the value is wrong, the test fails and says what
it got. *Example:* `assert.equal(slot, 600)`. ([0.4](./00-start/04-the-jam-clock.md))

**Test-driven development (TDD).** Writing a test before the code it tests, watching it
fail, then writing the code that makes it pass. *Example:* [lesson 0.4](./00-start/04-the-jam-clock.md)'s `slotAt`. ([0.4](./00-start/04-the-jam-clock.md))

**Debugger.** A tool that pauses a running program so you can read its variables, then
lets it go on. In VS Code, *Run and Debug*, with the configurations in
`.vscode/launch.json`. *Example:* *Tests: all (npm test)*. ([0.4](./00-start/04-the-jam-clock.md))

**Breakpoint.** A line where the debugger pauses the program: click left of the line's
number, and a red dot appears. *Example:* line 12 of `src/time.ts`, where `slotAt`
rounds. ([0.4](./00-start/04-the-jam-clock.md))

**Command-line argument.** A word you type after a program's name, which the program reads
from `process.argv` (`process.argv[2]` is the first). *Example:* the `3` in
`npm run now 3`. ([0.4](./00-start/04-the-jam-clock.md))

**Reporter.** A plug-in for Node's test runner that receives every test's result; yours
sends them to Grafana. *Example:* `test/grafana.ts`. ([0.3](./00-start/03-watch-your-client.md))

**Observability, event and run.** Observability is seeing what a program does while it
runs. An event is one line saying something happened; a run is one `npm test` or one
program, everything it reported labelled with one id. *Example:* pick a run in Grafana to
see only its events. ([0.3](./00-start/03-watch-your-client.md))

**Unix epoch.** 00:00 UTC on 1 January 1970, the moment most computer clocks count from
(nothing to do with a JAM epoch). *Example:* the JAM Common Era is 1,735,732,800 seconds
after it. ([0.4](./00-start/04-the-jam-clock.md))

**`bigint`.** A JavaScript whole number with no size limit, written with an `n` after its
digits: `2n` is the `bigint` two, `2` the `number` two, and one calculation can't mix them.
Ordinary numbers lose precision past about 9 quadrillion (2^53); JAM's 64-bit numbers
need `bigint`. *Example:* `2n ** 64n - 1n`. ([1.2](./01-bytes-and-numbers/02-numbers.md))

**Floating point.** How a JavaScript `number` is stored: about 16 significant digits and
an exponent, so a huge whole number gets rounded. *Example:* `2 ** 64 - 70 === 2 ** 64`
is `true`. ([1.2](./01-bytes-and-numbers/02-numbers.md))

**Unsigned integer (u8, u16, u32, u64).** A whole number that is never negative, kept in
a fixed number of bits. The GP writes a u32 as ℕ_{2^32}, a natural below 2^32.
*Example:* a u32 goes from 0 to 4294967295. ([1.2](./01-bytes-and-numbers/02-numbers.md))

**Bitwise operator.** An operator that works on a number's bits: `|`, `&`, `^` and the
shifts `<<`, `>>`, `>>>`. In JavaScript they treat numbers as signed 32-bit integers.
*Example:* `6 & 3` is 2. ([1.2](./01-bytes-and-numbers/02-numbers.md))

**`Uint8Array`.** A row of bytes, the type this client uses for raw data.
*Example:* `Uint8Array.of(1, 2, 3)` is three bytes.
([1.1](./01-bytes-and-numbers/01-bytes-and-hex.md))

**Type alias.** A second name for a type you already have; it checks nothing extra, but
says what a value is for. *Example:* `type Bytes = Uint8Array`.
([1.1](./01-bytes-and-numbers/01-bytes-and-hex.md))

**Stack trace.** When a program crashes, the list of function calls it was in the middle
of, innermost first. Look for the first line in your own code. *Example:* `at fromHex
(src/bytes.ts:13:21)`. ([1.1](./01-bytes-and-numbers/01-bytes-and-hex.md))

**Recursive.** Defined in terms of a smaller case of itself, down to a case simple enough
to answer straight away. *Example:* ℰ₂ is defined using ℰ₁, ℰ₁ using ℰ₀, and ℰ₀ is just
no bytes. ([2.1](./02-codec/01-fixed-width-integers.md))

**Off-by-one.** A bug that's wrong by exactly one, usually at the edge of a range: `<=`
where `<` was meant, or a count that starts at 1 instead of 0. *Example:* treating 128
as if it fitted in one byte. ([2.2](./02-codec/02-compact-naturals.md))

**Class, method.** A class is a blueprint for objects that keep their own data; its
functions are methods. *Example:* `new Writer()` makes a writer; `w.natural(5n)` calls a
method. ([2.3](./02-codec/03-writer-and-reader.md))

**Private field.** A field of a class whose name starts with `#`: only the class's own
methods can touch it. *Example:* the Reader's `#at`. ([2.3](./02-codec/03-writer-and-reader.md))

**Offset.** A position in a row of bytes, counted from 0. *Example:* in `c7 12 80 80`, the
compact 128 starts at offset 2. ([2.3](./02-codec/03-writer-and-reader.md))

**JSON.** The plain-text format the test vectors are written in. *Example:* `{"slot":
42}`. ([2.4](./02-codec/04-codecs.md))

**Interface.** A TypeScript list of what an object must have, with no code in it.
*Example:* every `Codec` has `encode`, `decode` and `fromJson`. ([2.4](./02-codec/04-codecs.md))

**Generic (`<T>`).** A type with a blank in it, filled in where it's used. *Example:*
`Codec<number>` is a codec for numbers. ([2.4](./02-codec/04-codecs.md))

**Optional field.** A field written with a `?`, which an object may leave out; reading a
missing one gives `undefined`. *Example:* `output: { err?: string }`, a vector's output.
([8.1](./08-safrole/01-stirring-the-entropy.md))

**Mapped type.** A TypeScript type built by going through another type's field names one
by one. *Example:* `{ [K in keyof F]: Value<F[K]> }` gives each field its codec's type.
([2.5](./02-codec/05-sequences-and-records.md))

**Union type.** A TypeScript type that is one shape or another; a check like `"ok" in x`
tells which. *Example:* `{ ok: Bytes } | { error: WorkError }`.
([3.2](./03-work-and-reports/02-work-digests.md))

**Tag.** A number in front of an encoded value saying which case follows. *Example:* in a
work result, 0 is "the output follows", 2 is "it panicked".
([3.2](./03-work-and-reports/02-work-digests.md))

**Library (dependency).** Code someone else wrote and published, which your project
installs and uses. *Example:* `@noble/hashes`, from `npm install`.
([5.1](./05-hashing-and-signatures/01-hashes.md))

**Known-answer test.** A test whose expected value comes from a source you trust, not from
your own code. *Example:* the published Blake2b-256 of nothing at all.
([5.1](./05-hashing-and-signatures/01-hashes.md))

**`Map`.** JavaScript's lookup table, from keys to values. *Example:* a service's storage
maps each key to its value. ([14.1](./14-services/01-providing-preimages.md))

**Grafana.** The dashboards where your client's runs show up, with Loki (for events) and a
Pushgateway (for numbers) behind them. *Example:* the *Chain* panel, on *2 · Blocks and
state*, lists 100 blocks.
([0.3](./00-start/03-watch-your-client.md))

**WebAssembly.** A compact program format that JavaScript engines run at close to native
speed, so a library written in Rust can run in Node. *Example:* the Bandersnatch library.
([8.8](./08-safrole/08-the-ring-root.md))

**Helper function.** A small function that hides one detail, so the code calling it doesn't
have to know it. *Example:* `storageValue` knows where an account keeps a value.
([19.3](./19-block-import/03-accounts-from-the-state.md))

## Bytes and encoding

**Byte (octet).** Eight bits: a number from 0 to 255. The GP says *octet*, and writes a
row of them as 𝔹. Everything JAM sends or stores is bytes. *Example:* 255, the biggest
byte, is `0xff` in hex. ([1.1](./01-bytes-and-numbers/01-bytes-and-hex.md))

**Hex.** Writing bytes as pairs of the digits 0-9 and a-f, after `0x`. *Example:* `0xff`
is the byte 255; `0x0102` is the bytes 1 and 2. ([1.1](./01-bytes-and-numbers/01-bytes-and-hex.md))

**Little-endian.** Writing a number's bytes smallest first. JAM does this everywhere.
*Example:* 258 in two bytes is `0x0201`. ([2.1](./02-codec/01-fixed-width-integers.md))

**Fixed-width integer.** ℰ_l. A number always written in the same l bytes, however small
it is. *Example:* a u32 always takes four bytes, so 1 is `01 00 00 00`.
([2.1](./02-codec/01-fixed-width-integers.md))

**Encode, decode and codec.** Encoding turns a value into bytes; decoding turns the
bytes back. A codec is one object that does both for one kind of value, and reads it from
the test vectors' JSON too. The GP writes encoding as ℰ (Appendix C). *Example:* the
number 5 in one byte encodes as `0x05`.
([2.1](./02-codec/01-fixed-width-integers.md)), codec ([2.4](./02-codec/04-codecs.md))

**Compact natural.** JAM's space-saving way to encode a whole number: small numbers take
one byte, bigger ones more, and the first byte says how many follow. *Example:* 5 is
`0x05`, one byte; 300 takes two. ([2.2](./02-codec/02-compact-naturals.md))

**Leading ones.** The one-bits at the very start of a byte, before its first zero; in a
compact natural, how many more bytes follow. *Example:* `0b110xxxxx` has two.
([2.2](./02-codec/02-compact-naturals.md))

**Blob.** Any run of bytes of no fixed length. Encoded with its length in front (the GP's
↕). *Example:* the three bytes 1, 2, 3 encode as `0x03010203`.
([2.4](./02-codec/04-codecs.md))

**Fixed-length sequence.** A list whose length the protocol fixes, so it's written with no
length in front. The GP writes ⟦T⟧ₙ. *Example:* the tickets mark.
([4.5](./04-blocks/05-maybe-and-exactly-n.md))

**Sequence and record.** A sequence is a list of the same kind of thing, a record a fixed
set of named fields, encoded one after another. *Example:* a work-item is a record; the
items of a package are a sequence. ([2.5](./02-codec/05-sequences-and-records.md))

**Codec factory.** A function that takes codecs and builds a new codec from them.
*Example:* `seq(u8)` is a codec for lists of bytes. ([2.5](./02-codec/05-sequences-and-records.md))

**Hex dump.** A file's bytes printed as hex, a few to a line, to read by eye. *Example:*
`npm run hexdump work_item.bin` prints `04 03 02 01 70 a5 ...`.
([2.6](./02-codec/06-the-first-test-vectors.md))

**Round trip.** Decoding bytes, encoding the result, and getting the very same bytes back:
how a codec proves it agrees with a test vector. *Example:* `work_item.bin` → a work item
→ `work_item.bin`. ([2.6](./02-codec/06-the-first-test-vectors.md))

**Decode trace.** A list of every innermost field a decoder read, each with its field
path and where its bytes were; every byte covered once. Not a block trace. *Example:*
`0..4 service`. ([2.7](./02-codec/07-watch-a-decode.md))

**Field path.** A field's place inside a value, from the outside in, with dots.
*Example:* `import_segments.0.index`. ([2.7](./02-codec/07-watch-a-decode.md))

**Innermost field.** A field with no fields inside it: a number, a hash, a length.
*Example:* `service` is one; `import_segments` isn't. ([2.7](./02-codec/07-watch-a-decode.md))

**Option (discriminator).** A value that may be missing: one byte, 0 for "nothing" or 1 and then the
value. *Example:* a header's epoch mark is only there at an epoch's start.
([4.5](./04-blocks/05-maybe-and-exactly-n.md))

## Time and the chain

**JAM Common Era.** The moment JAM's clock starts: 12:00 UTC on 1 January 2025,
1,735,732,800 seconds after the Unix epoch. *Example:* slot 0 begins right then.
([0.4](./00-start/04-the-jam-clock.md))

**Timeslot (slot).** τ. A six-second tick of JAM's clock, counted from 0 at 12:00 UTC on
1 January 2025, the *JAM Common Era*. At most one block is made per slot. *Example:* 12:00:06
that day was slot 1. ([0.4](./00-start/04-the-jam-clock.md))

**Epoch.** A run of E slots: 600 (one hour) on full, 12 on tiny. Validators and the block-making lottery change at epoch boundaries.
([7.1](./07-time-and-shuffling/01-epochs.md))

**Phase.** m. Where a slot falls within its epoch, counted from 0: the slot mod E.
*Example:* on tiny, slot 13 is epoch 1, phase 1. ([7.1](./07-time-and-shuffling/01-epochs.md))

**Fisher-Yates shuffle.** F (Appendix F). Shuffling by picking items one at a time, each
pick from the items still left, with the numbers for the picks read from a hash everyone
shares. *Example:* a b c d with the numbers 1, 1, 0, 0 gives b d a c.
([7.2](./07-time-and-shuffling/02-the-shuffle.md))

**Entropy accumulator.** η₀. The randomness every block stirs a little more into; at each
new epoch its value moves along to η₁. *Example:* the first of η's four hashes.
([7.1](./07-time-and-shuffling/01-epochs.md))

**Configuration.** The numbers that make one JAM bigger than another: validators, cores,
epoch length. *Example:* `TINY` has 6 validators and 2 cores.
([4.2](./04-blocks/02-tiny-and-full.md))

**Tiny and full.** JAM's two configurations, with the same rules: *full* is a realistic
picture of the future network, with the Gray Paper's own numbers (1,023 validators, 341
cores); *tiny* is small enough to run on one machine (6 validators, 2 cores). The test vectors
come in both. ([4.2](./04-blocks/02-tiny-and-full.md))

**Block.** What the chain adds each slot: a header plus an extrinsic.
([4.7](./04-blocks/07-the-block.md))

**Header.** H. A block's cover page: its parent's hash, its slot, who made it, and a
seal. *Example:* `header.slot` says when the block was made. ([4.6](./04-blocks/06-the-header.md))

**Extrinsic.** E. The block's contents from the outside world, in five parts: tickets,
preimages, guarantees, assurances and disputes, each as long as that block needs, often
empty. *Example:* a tiny block carries 0 to 3 tickets and 0 to 2 guarantees. A
work-item's *extrinsics* ([lesson 3.1](./03-work-and-reports/01-a-work-package.md)) are
something else: data blobs sent along with the item, for refine to read, such as
`items.1.extrinsic.0`. ([4.1](./04-blocks/01-tickets-and-preimages.md))

**Anchor (of an assurance).** The block an assurance was made on top of; it must be the
parent of the block carrying it. *Example:* an assurance anchored two blocks back is
refused. ([11.3](./11-assurances/03-bad-assurances.md))

**Rejected block.** A block that breaks any rule: refused whole, nothing in it counts, and
the state stays as it was. *Example:* one bad signature sinks the block.
([11.3](./11-assurances/03-bad-assurances.md))

**Error name.** The test vectors' name for the rule a rejected block breaks. *Example:*
`bad_signature`. ([11.3](./11-assurances/03-bad-assurances.md))

**Parent.** The block before this one. Each header names its parent by hash, which is
what makes the blocks a chain. ([5.1](./05-hashing-and-signatures/01-hashes.md))

**Hash.** H(x). A 32-byte fingerprint of some data (JAM uses Blake2b-256). Change one bit
of the data and the fingerprint changes completely. *Example:* the hash of no bytes at
all starts `0x0e5751c0`. ([5.1](./05-hashing-and-signatures/01-hashes.md))

**Blake2b.** The hash function JAM uses: fingerprints of any size up to 64 bytes, of which
JAM asks for 32. *Example:* the hash of no bytes at all starts `0e5751c0`.
([5.1](./05-hashing-and-signatures/01-hashes.md))

**Keccak-256.** Ethereum's hash function: 32 bytes, like Blake2b, but different ones. JAM
uses it where other chains must check the result. *Example:* the Keccak-256 of no bytes
at all starts `0xc5d24601`. ([9.1](./09-recent-history/01-the-mountain-belt.md))

**Extrinsic hash.** A header's 32-byte promise of exactly which extrinsic belongs to it: a
hash of the five parts' hashes. *Example:* swap one ticket, and it no longer matches.
([5.2](./05-hashing-and-signatures/02-the-extrinsic-hash.md))

**Merkle commitment.** A hash of hashes, built so that one piece can be proven to be inside
without showing the rest. *Example:* one report, plus the other parts' hashes.
([5.2](./05-hashing-and-signatures/02-the-extrinsic-hash.md))

**Secret key and public key.** A pair: the secret key signs, the public key checks. Only
the holder knows the secret one. *Example:* a validator's 32-byte Ed25519 public key.
([5.3](./05-hashing-and-signatures/03-signatures.md))

**Ed25519.** The signature scheme for JAM's everyday signatures (RFC 8032): 32-byte public
keys, 64-byte signatures. *Example:* every assurance's signature.
([5.3](./05-hashing-and-signatures/03-signatures.md))

**Domain prefix.** A few ASCII bytes put in front of a signed message, so a signature for
one job can't pass for another. *Example:* `jam_available`, `jam_guarantee`.
([5.3](./05-hashing-and-signatures/03-signatures.md))

**Signature.** Proof that the holder of a secret key approved some bytes; anyone with the
matching public key can check it. JAM's everyday kind is Ed25519.
([5.3](./05-hashing-and-signatures/03-signatures.md))

**State.** σ. Everything the chain remembers between blocks: the validators, the
entropy, every service's account, and more, each part a *component* with a Greek letter.
*Example:* τ is the time, η the entropy.
([6.3](./06-state-and-merklization/03-reading-the-state.md))

**Intermediate value.** A value halfway through a block, marked with a dagger. *Example:*
ρ† is the cores after the judgments, ρ‡ after the assurances, ρ′ after the whole block.
([19.1](./19-block-import/01-the-order-of-things.md))

**Dependency graph.** ≺. What each new piece of state is made from (GP §4.2). *Example:*
ρ‡ ≺ (E_A, ρ†). ([19.1](./19-block-import/01-the-order-of-things.md))

**Wave.** This client's name for a group of block-import steps whose ingredients are all
ready; steps in one wave don't need each other. *Example:* wave 1 is τ′, β_H†, η′, κ′, λ′,
ψ′ and ρ†. ([19.1](./19-block-import/01-the-order-of-things.md))

**Trie, leaf and branch.** A trie files entries by the bits of their keys, 0 left, 1
right; a leaf holds one entry, a branch the hashes of its two subtries. *Example:* every
node is 64 bytes. ([6.1](./06-state-and-merklization/01-the-state-trie.md))

**Merklization.** Hashing a whole trie down to one root, so any one entry can later be
proven with a few hashes. The GP writes the root as M. *Example:* a state, down to 32
bytes. ([6.1](./06-state-and-merklization/01-the-state-trie.md))

**Merkle mountain belt, peak and super-peak.** A list of Merkle tree roots, one per power
of two, grown one item at a time like a binary counter. Each root is a *peak* (∅ where
there's no mountain of that size), and the *super-peak*, M_R, is one hash for the whole
belt. JAM keeps one of every block's accumulation outputs, for bridges to other chains.
*Example:* 5 items make a mountain of 4 and a mountain of 1.
([9.1](./09-recent-history/01-the-mountain-belt.md))

**Recent history.** β. What the state remembers of the last eight blocks (β_H: each one's
header hash, state root, belt super-peak, slot and reported packages), with the belt of
accumulation outputs (β_B). *Example:* a guarantee's anchor must be one of those eight
blocks. ([9.2](./09-recent-history/02-recent-blocks.md))

**State key and state component.** The state is 16 components, C(1) to C(16), each a Greek
letter, filed under 31-byte keys; services' data have keys of their own. *Example:* C(11)
is τ, the time. ([6.2](./06-state-and-merklization/02-state-keys.md))

**State root.** One 32-byte hash that fingerprints the whole state, through a tree of
hashes (a *trie*). Two clients agree on the state exactly when they agree on the root.
([6.1](./06-state-and-merklization/01-the-state-trie.md))

**State transition.** Υ. The rule that takes the state before a block, and the block, to
the state after it. A JAM client is, at heart, this one function.
([0.1](./00-start/01-what-you-will-build.md))

**Trace.** A recorded run of real blocks, each with the state before and after it, from
the test vectors. *Example:* the tiny `fallback` trace has 100 blocks.
([5.1](./05-hashing-and-signatures/01-hashes.md))

**Preimage.** The data behind a hash: if h = H(d), d is h's preimage. Services ask for
preimages by hash, and blocks provide them. ([14.1](./14-services/01-providing-preimages.md))

## Validators and making blocks

**Validator key.** The 336 bytes the chain keeps for one validator: a Bandersnatch key
(32), an Ed25519 key (32), a BLS key (144) and metadata (128). *Example:* κ is a list of
them. ([6.3](./06-state-and-merklization/03-reading-the-state.md))

**Bandersnatch key.** A validator's key for the ticket lottery and for sealing blocks.
*Example:* the first 32 bytes of a validator key.
([6.3](./06-state-and-merklization/03-reading-the-state.md))

**BLS key.** A 144-byte key for signatures that can be combined. *Example:* bytes 64 to 207
of a validator key. ([6.3](./06-state-and-merklization/03-reading-the-state.md))

**Validator.** One of the V machines (1,023 on full, 6 on tiny) that run JAM: they make
blocks, check work and vote. ([4.2](./04-blocks/02-tiny-and-full.md))

**Validator sets.** Four lists of validators: κ the active ones, λ last epoch's, γ_P the
next epoch's (pending), and ι the ones queued after that (staging). Each epoch they move
along one. ([8.2](./08-safrole/02-rotating-the-validators.md))

**Entropy.** η. Randomness the chain gathers from every block, so that no one can predict
the future lotteries. ([8.1](./08-safrole/01-stirring-the-entropy.md))

**Safrole.** JAM's way of choosing who makes each block: a lottery run one epoch ahead.
([8.5](./08-safrole/05-one-step-of-safrole.md))

**Ticket accumulator.** γ_A. The best tickets entered so far in this epoch's lottery, at
most E of them, sorted by id, lowest first. *Example:* at a new epoch it starts again, from
only that block's own tickets. ([8.4](./08-safrole/04-the-lotterys-winners.md))

**Outside-in order.** Z. The order the winning tickets take their slots: the first, the
last, the second, the second to last, and so on inwards. *Example:* slot 0 gets the best
ticket, slot 1 the worst of the winners. ([8.4](./08-safrole/04-the-lotterys-winners.md))

**VRF.** A signature whose output is random, yet can't be chosen by the signer: for a given
key and input (the Gray Paper's *context*) it comes out one way only, and anyone can check
it. *Example:* the
header's 96-byte `entropy_source`. ([8.1](./08-safrole/01-stirring-the-entropy.md))

**Ring VRF proof.** Cryptography proving that *some* validator in a set made something,
without saying which. *Example:* every ticket carries a 784-byte one.
([4.1](./04-blocks/01-tickets-and-preimages.md))

**Epoch mark.** At an epoch's first block only: fresh randomness and the keys of the
validators who take over in the epoch after it. *Example:* most headers have none.
([4.6](./04-blocks/06-the-header.md))

**Tickets mark.** At most once per epoch, when the ticket lottery closes with every slot
filled: the winning ticket for every slot of the next epoch. *Example:* 12 tickets on tiny, 600 on full.
([4.6](./04-blocks/06-the-header.md))

**Offenders mark.** The Ed25519 keys of the validators a block convicts in its disputes.
*Example:* empty in almost every block. ([4.6](./04-blocks/06-the-header.md))

**Ticket.** A validator's anonymous entry in the lottery for the next epoch's slots.
([4.1](./04-blocks/01-tickets-and-preimages.md), [8.4](./08-safrole/04-the-lotterys-winners.md))

**Sealer and seal.** The sealer is the validator allowed to make the block in a slot; the
seal is its signature on the header. When the lottery didn't fill the epoch, fallback
sealers are picked from the entropy instead. ([8.3](./08-safrole/03-the-fallback-sealers.md))

**Output point.** The first 32 bytes of a Bandersnatch VRF signature: a point on the curve
that only the signer's key makes for that input. *Example:* the first 32 bytes of a header's
`entropy_source`. ([8.6](./08-safrole/06-the-vrf-output.md))

**SHA-512.** A hash function, like Blake2b, with a 64-byte result. *Example:* the VRF output
is the first 32 bytes of one. ([8.6](./08-safrole/06-the-vrf-output.md))

**Ticket id.** A ticket's score in the lottery: the VRF output of its ring proof; lower is
better. *Example:* `0x00e51b1c…` beats `0x20164381…`. ([8.6](./08-safrole/06-the-vrf-output.md))

**Attempt, attempts allowed.** n. Which of its tickets a validator enters, from 0 up to
n − 1, where n = ⌈2E / |γ′_P|⌉. *Example:* 4 attempts each on tiny, 2 on full.
([8.7](./08-safrole/07-entering-tickets.md))

**Ring root.** γ_Z. A 144-byte commitment to a ring of Bandersnatch keys, which ring proofs
are checked against. *Example:* a new one at every epoch, for γ′_P.
([8.8](./08-safrole/08-the-ring-root.md))

**Padding point.** The stand-in for a missing key in a ring, or for one that isn't a point
on the curve. *Example:* an offender's zeroed key. ([8.8](./08-safrole/08-the-ring-root.md))

**Unsigned header.** ℰ_U(H). A header's bytes without the seal at the end: what the seal
signs. *Example:* 201 of a 297-byte header's bytes. ([8.9](./08-safrole/09-seals.md))

**Ticket-sealed block.** A block sealed by the holder of the slot's winning ticket, not by a
fallback key. *Example:* blocks 48 to 83 of the `safrole` trace. ([8.9](./08-safrole/09-seals.md))

## Work, cores and reports

**Core.** One of C parallel lanes (341 on full, 2 on tiny) where work gets done, a few
validators at a time. ([4.2](./04-blocks/02-tiny-and-full.md))

**Service.** A program that lives on JAM, with an id, code, a balance and storage. It
runs in two stages: refine, on a core, and accumulate, on the chain.
([14.2](./14-services/02-the-service-account.md))

**Work-item and work-package.** A work-item is one job for one service, with its input
(the *payload*) and gas limits; a work-package bundles up to 16 of them for one core.
([3.1](./03-work-and-reports/01-a-work-package.md))

**In-core and on-chain.** The two places JAM does its work. In-core work runs on one of
the cores, by its guarantors, before any block: authorizing a package and refining its
items. On-chain work is what every client does as it imports a block. *Example:* refine
runs in-core; accumulate runs on-chain. ([3.1](./03-work-and-reports/01-a-work-package.md))

**Refine.** The heavy, off-chain stage: a core runs each work-item's service code on its
payload and gets a result. ([3.2](./03-work-and-reports/02-work-digests.md))

**Work digest (work result).** What refining one work-item produced: an output, or an
error, plus the gas it may use when accumulated. ([3.2](./03-work-and-reports/02-work-digests.md))

**Bundle.** A work-package together with everything needed to refine it: its extrinsics,
and the segments it imports with their proofs. Its length is in the report's
`package_spec`. *Example:* a 17180-byte bundle.
([18.2](./18-statistics/02-what-cores-and-services-did.md))

**Segment.** A 4104-byte piece of data (W_G) that a work-item exports, for later packages
to import. Every 64 of them come with a proof page. *Example:* a report exporting 3
segments. ([18.2](./18-statistics/02-what-cores-and-services-did.md))

**Refinement context.** The chain as a work-package saw it when built: an anchor block (its
hash, slot, state root and belt root), a lookup anchor to read preimages from, and the
packages that must be accumulated first. *Example:* every package and report carries one.
([3.1](./03-work-and-reports/01-a-work-package.md))

**Availability specification.** How to find a package's data again: its hash, its
bundle's length, the erasure root and shard count, and its exported segments' root and
count. *Example:* a report's `package_spec`. ([3.3](./03-work-and-reports/03-a-work-report.md))

**Erasure coding.** Chopping data into one piece (shard) per validator so that a third of
the pieces, plus one, can rebuild it all. *Example:* 1,023 shards on full, any 342 of which
will do; on tiny, 6, any 3.
([3.3](./03-work-and-reports/03-a-work-report.md))

**Erasure root.** One hash that vouches for every validator's shard: the top of a Merkle
tree over the shards' hashes, so one shard can be checked without the rest. *Example:* the
full work-report vector's `0x7af11fda…`.
([3.3](./03-work-and-reports/03-a-work-report.md))

**Shamir's secret sharing.** Erasure coding's twin for secrets: a secret cut into shares
so that enough of them reveal it and fewer reveal nothing. *Example:* a wallet's seed
backed up as any 3 of 6 cards. ([3.3](./03-work-and-reports/03-a-work-report.md))

**Work-report.** A core's statement about one package: its digests, and enough detail to
check and fetch everything. ([3.3](./03-work-and-reports/03-a-work-report.md))

**Authorizer.** Code that decides whether a package may use a core at all. Each core keeps
a small pool of authorizers. ([13.1](./13-authorization/01-the-authorizer-pools.md))

**Rotation.** R slots (4 on tiny, 10 on full) after which the guarantors move on to the
next core. *Example:* on tiny, slots 12 to 15 are one rotation.
([12.1](./12-guarantees/01-who-guarantees-what.md))

**Active core.** One of the first |κ′|/3 cores, the ones the current validators can staff
three apiece. *Example:* 6 validators keep 2 cores active.
([12.1](./12-guarantees/01-who-guarantees-what.md))

**Authorizer pool.** α[c]. The authorizers core c accepts right now; a report's authorizer
must be in its core's pool. *Example:* refused as `core_unauthorized` if it isn't.
([12.4](./12-guarantees/04-bad-guarantees.md))

**Credential.** The signatures on a guarantee, two or three of them, each a guarantor's
validator index and its Ed25519 signature. *Example:* index 3 and 64 bytes, then index 4
and 64 bytes. ([4.3](./04-blocks/03-guarantees.md))

**Guarantee and guarantor.** Two or three validators (the guarantors) sign a work-report
to vouch that it's right; that bundle is a guarantee, and it puts the report onto its
core. ([12.1](./12-guarantees/01-who-guarantees-what.md))

**Assurance and availability.** Each validator signs one bit per core: "I hold my piece of
this core's data". When more than two thirds do, the report is *available*.
([11.1](./11-assurances/01-available.md))

**Accumulate.** The light, on-chain stage: a service folds the results of its refined
work into its own state. ([16.6](./16-host-calls/06-checkpoints.md))

**Gas.** A count of how much computing something takes; every program has a budget, and
runs out when it's spent. ([15.9](./15-the-pvm/09-what-instructions-cost.md))

## Disputes

**Judgement and verdict.** When a work-report is challenged, validators vote on it
(judgements); enough of them together make a verdict: good, bad, or *wonky* (split).
([10.1](./10-disputes/01-votes-and-verdicts.md))

**Judges.** K. The validators whose votes a verdict carries: κ if the verdict's age is this
epoch, λ if it's the last. *Example:* on tiny, 6 judges, so a verdict needs 5 votes.
([10.1](./10-disputes/01-votes-and-verdicts.md))

**Verdict age.** The epoch a verdict's votes were cast in; only this epoch or the last will
do. *Example:* in epoch 3, ages 3 and 2 are fine, 1 isn't.
([10.1](./10-disputes/01-votes-and-verdicts.md))

**Vote split.** How many of a verdict's votes say "valid": all (good), none (bad) or a
third of the judges (wonky); any other split rejects the block. *Example:* on tiny, 5, 0
or 2. ([10.1](./10-disputes/01-votes-and-verdicts.md))

**Evidence.** What makes an accusation stick: the accused validator's own signature. A
culprit carries its signed guarantee, a fault its signed vote.
([10.5](./10-disputes/05-bad-culprits-and-faults.md))

**If and only if (⇔).** Two statements true together or false together. *Example:* "the
report is bad ⇔ the fault voted valid". ([10.5](./10-disputes/05-bad-culprits-and-faults.md))

**Culprit, fault and offender.** A culprit guaranteed a report that turned out bad; a
fault voted against the verdict. Both become *offenders* (their keys go into ψ_O), and
lose their part in the validator sets. ([10.2](./10-disputes/02-culprits-and-faults.md))

## Services and their accounts

**Service account.** A service's record in the state: its code hash, balance, gas
minimums, and counts of what it keeps. ([14.2](./14-services/02-the-service-account.md))

**Storage.** A service's own key-value store in the state. *Example:* a service writes the
key "last" with some bytes, and reads it back next time. ([16.5](./16-host-calls/05-storage.md))

**Eject, ejector.** Removing a finished service for good; its ejector is the service it
named to do it, by setting its code hash to the ejector's id in 32 bytes. *Example:* a code
hash of 32 zero bytes names service 0. ([17.7](./17-accumulation/07-ejecting-a-service.md))

**Expunge period.** D. How many slots a forgotten preimage must wait before it may go: 32
on tiny, 19,200 on full. *Example:* forgotten at slot 10, gone from slot 43 on tiny.
([17.7](./17-accumulation/07-ejecting-a-service.md))

**Public id.** A service id of 2^16 (S) or more: anyone may create a service with one;
ids below S are the registrar's. *Example:* 70,000 is public, 5 isn't.
([17.8](./17-accumulation/08-creating-a-service.md))

**Next free id.** i. The id a run's next `new` hands out: from the creating service's id,
η′₀ and the slot, then 42 further on after each use. *Example:* 70,000, then 70,042.
([17.8](./17-accumulation/08-creating-a-service.md))

**Gratis storage.** f. A discount on a service's deposit: storage it keeps without paying
for it. Only the manager may give it. *Example:* gratis from anyone else: `HUH`.
([17.8](./17-accumulation/08-creating-a-service.md))

**Upgrade.** A service replacing its own code hash and its least gas per item and per
memo. *Example:* service 0's code hash goes from `0xdd0e…` to `0xc0f2…`.
([17.10](./17-accumulation/10-upgrading-a-service.md))

**Request.** A service asking for a preimage by hash and length. Its history is a short
list of slots: provided, forgotten, available again. ([14.1](./14-services/01-providing-preimages.md))

**Footprint, deposit and minimum balance.** What a service keeps (items and bytes) costs
deposit: it must hold at least 100 + 10 per item + 1 per byte, its minimum balance.
([14.2](./14-services/02-the-service-account.md))

**Host call.** A program asking the client running it for something it can't do alone:
the gas left, an input, a storage read. ([16.1](./16-host-calls/01-calling-the-host.md))

**Checkpoint.** A moment a service marks as "keep everything up to here": if it fails
later, its changes roll back to the last checkpoint. ([16.6](./16-host-calls/06-checkpoints.md))

## Accumulating a block

**Always-accumulate service.** χ_Z. A service that accumulates in every block, on a
fixed amount of free gas, whether or not work came in for it. *Example:* in the
`always_accumulate` vectors, service 1729 runs with 100,000 free gas.
([16.7](./16-host-calls/07-a-services-inputs.md))

**Report anchor.** The recent block a report was built against: its hash, slot, state root
and belt root, in the report's context; it must match a block the chain remembers.
*Example:* refused as `anchor_not_recent` if it doesn't. ([12.5](./12-guarantees/05-bad-reports.md))

**Segment-root lookup.** A report's list of the packages whose exported segments it
imported, each with those segments' root. *Example:* "package A, segments root R".
([12.5](./12-guarantees/05-bad-reports.md))

**Pipeline.** Every package the chain is already dealing with: recently accumulated,
waiting, or pending on a core; none may be reported again. *Example:* the vectors'
`known_packages`. (The PVM's pipeline, in [lesson 15.10](./15-the-pvm/10-the-pipeline.md), is something else: the model CPU's
stages, which instructions pass through one behind another.)
([12.5](./12-guarantees/05-bad-reports.md))

**Prerequisite.** A work-package that a report says must be accumulated before it.
*Example:* if package B names package A, B's report waits until A's has been accumulated.
([17.1](./17-accumulation/01-a-blocks-accumulation.md))

**Round.** Several services accumulated side by side, all from the same starting state;
none sees what the others do in that round. The GP's Δ\*.
([17.1](./17-accumulation/01-a-blocks-accumulation.md))

**Dependency.** Anything a report waits for: its prerequisites, and any work-packages its
segment-root lookups name. *Example:* report D depends on package A.
([17.2](./17-accumulation/02-waiting-reports.md))

**Ready queue.** ω. Where reports with dependencies wait: one list for each slot of an
epoch, used as a ring. *Example:* a report arriving at slot 43 on tiny waits in list 7.
([17.2](./17-accumulation/02-waiting-reports.md))

**Accumulated history.** ξ. For each of the last E blocks, the set of work-packages
accumulated in it; dependencies are checked against it.
([17.2](./17-accumulation/02-waiting-reports.md))

**Unlock.** A waiting report goes once its last dependency is accumulated, possibly in
the same block. *Example:* A accumulates, so D, waiting for A, goes right after it.
([17.2](./17-accumulation/02-waiting-reports.md))

**Deferred transfer.** 𝕏. Money one service sends another while it accumulates: the
sender pays at once, the receiver gets it in the next round of the same block.
*Example:* service 0 sends service 1 a hundred. ([17.3](./17-accumulation/03-sending-a-transfer.md))

**Memo.** W_T = 128 bytes. A note that travels with a transfer, for the receiver's code to
read. *Example:* the bytes of "gift", then 124 zeros.
([17.3](./17-accumulation/03-sending-a-transfer.md))

**Outbox.** This client's name for the transfers a run has sent so far (the GP's 𝐭), and
the ones its last checkpoint kept. *Example:* two sent, one before the checkpoint.
([17.3](./17-accumulation/03-sending-a-transfer.md))

**Δ+ (accumulating in rounds).** The loop over a block's rounds: one round, then another
for the transfers it sent, until a round sends none (or, with the gas budget, until no
reports are left either). *Example:* a block with one transfer
takes two rounds. ([17.4](./17-accumulation/04-rounds.md))

**Delivery.** A transfer arriving, in the round after it was sent: its money goes into the
receiver's balance before its code runs, and the transfer becomes one of its inputs.
*Example:* service 1's balance grows by 100, then it reads "gift".
([17.4](./17-accumulation/04-rounds.md))

**Operand.** U. What accumulation learns of one work-digest: the package, its exports
root, the authorizer and its trace, the payload's hash, the gas and the result. An input
that starts with a 0. *Example:* a report with two digests for one service gives that
service two operands. ([16.7](./16-host-calls/07-a-services-inputs.md))

**Transfer input.** An accumulation input that starts with a 1, then one transfer; an
operand starts with a 0. *Example:* service 1's only input in round 2.
([17.4](./17-accumulation/04-rounds.md))

**Privilege.** χ. A right held by one service (always-accumulate, by a list): the manager (χ_M, may change
the others), an assigner for each core (χ_A), the delegator (χ_V, picks the next
validators), the registrar (χ_R, creates services with small ids), and the
always-accumulate services (χ_Z). *Example:* service 0 is core 0's assigner.
([17.5](./17-accumulation/05-privileges.md))

**Assigner.** χ_A[c]. The service that may set core c's authorizer queue and hand that
right on. *Example:* service 0 hands core 0 to service 1 with `assign`.
([17.5](./17-accumulation/05-privileges.md))

**Authorizer queue.** ϕ[c]. For each core, 80 authorizer hashes; one joins the core's pool
every slot. *Example:* the 80 hashes `assign` hands over with a core.
([13.1](./13-authorization/01-the-authorizer-pools.md))

**Holder.** The service holding a privilege when a round starts. *Example:* service 1
holds core 0's assignment. ([17.6](./17-accumulation/06-who-wins.md))

**Merge (of privileges).** Turning every run's version of the privileges into one after a
round. *Example:* two runs left different assigners for core 0; the merge picks one.
([17.6](./17-accumulation/06-who-wins.md))

**R (replace if changed).** R(o, a, b): the manager's change a wins; if the manager left
it as o, the holder's own change b. *Example:* R(1, 5, 7) = 5, R(1, 1, 7) = 7.
([17.6](./17-accumulation/06-who-wins.md))

**Gas budget.** g. The gas a block's accumulation may use, all rounds together: the bigger
of G_T and G_A for every core plus the always-accumulate services' gas. *Example:*
20,000,000 on tiny. ([17.9](./17-accumulation/09-the-blocks-gas-budget.md))

**G_T.** The protocol's gas limit for a whole block's accumulation. *Example:* 20,000,000
on tiny, 3,500,000,000 on full. ([17.9](./17-accumulation/09-the-blocks-gas-budget.md))

**Leftover budget.** g\*. The next round's budget: the last round's, plus the gas its new
transfers carry, minus the gas it used. *Example:* 20M + 0 − 0.35M = 19.65M.
([17.9](./17-accumulation/09-the-blocks-gas-budget.md))

**Yield.** The hash a run hands the chain as its accumulation output, by the `yield` host
call or by halting with a 32-byte output. *Example:* service 1 yields `0xb8fe9f7f…`.
([17.11](./17-accumulation/11-what-a-service-yields.md))

**Accumulation outputs.** θ. A block's yields, each with the service that yielded it,
sorted by service, then hash; their Keccak root joins the belt. *Example:* (service 1,
`0xb8fe…`). ([17.11](./17-accumulation/11-what-a-service-yields.md))

**Well-balanced Merkle root.** M_B. One hash for a list: halve it (the first half rounded
up), take each half's root, and hash "node" and the two together; one item alone is
hashed. *Example:* M_B([a, b]) = Keccak("node" ⌢ a ⌢ b). ([17.11](./17-accumulation/11-what-a-service-yields.md))

**Provide, provision.** 𝐩. Handing a service a preimage it asked for, during
accumulation; a provision waits for the end of the round, then is stored if the service
still waits for it. *Example:* service 0 gives 1729 the 8 bytes "preimage".
([17.12](./17-accumulation/12-providing-a-preimage.md))

**Bless.** Setting every privilege in one call: the manager, the assigners, the
delegator, the registrar and the always-accumulate services. *Example:* service 1 blesses
service 2 as the delegator. ([17.13](./17-accumulation/13-blessing-and-designating.md))

**Designate.** The delegator choosing the next validators, ι: 336 bytes of keys for each.
*Example:* 6 validators on tiny, 2,016 bytes. ([17.13](./17-accumulation/13-blessing-and-designating.md))

**Validator counts.** V. The sizes a validator set may have: a multiple of 3 from 6 to 3
per core. *Example:* on tiny, with 2 cores, only 6. ([17.13](./17-accumulation/13-blessing-and-designating.md))

**Accumulation statistics.** S(s) = (N, T, G). For each service, per block: the digests
it accumulated, the transfers it received, the gas it used. *Example:* (1, 0, 29,643).
([17.1](./17-accumulation/01-a-blocks-accumulation.md))

**Last-accumulation slot.** The slot in which a service last accumulated, kept in its
account. *Example:* 43, after accumulating in slot 43.
([17.1](./17-accumulation/01-a-blocks-accumulation.md))

**Account entry.** One thing a service keeps in the state under its own key: a storage
value, a preimage, or a request's history. *Example:* 154 entries for service 0 of the
`storage` trace before block 50. ([19.2](./19-block-import/02-the-whole-state.md))

**Dictionary encoding.** How the state writes a map: how many pairs, then each pair, sorted
by key. *Example:* χ_Z, each always-accumulate service's id and its gas.
([19.2](./19-block-import/02-the-whole-state.md))

**Header checks.** What a header must pass before anything else: its parent is the newest
block remembered, its state root the state's, its slot later, its extrinsic hash right.
*Example:* another block's child is refused with `bad_parent`. ([19.4](./19-block-import/04-importing-a-block.md))

**Chained import.** Importing a trace block after block, each into the state your client
made from the one before. *Example:* `bin/import.ts`. ([19.4](./19-block-import/04-importing-a-block.md))

**β†.** The recent history halfway through a block: the newest block it remembers has its
state root now, from this block's header. *Example:* reports are checked against β†.
([19.5](./19-block-import/05-work-on-the-chain.md))

**Canonical order.** The one order a set is written in, so every client writes the same
bytes: sorted. *Example:* each slot's packages in ξ. ([19.5](./19-block-import/05-work-on-the-chain.md))

**Fuzzy trace.** A block-import trace made with a service doing random work, with some
blocks meant to be refused. *Example:* `fuzzy` blocks 37 to 39. ([19.6](./19-block-import/06-blocks-to-refuse.md))

**Worker thread.** A second program running beside the first in the same process, with
memory of its own, that talks to it by messages. *Example:* the scoreboard runs one per
processor, each checking vectors. ([19.6](./19-block-import/06-blocks-to-refuse.md))

## Statistics

**Validator statistics.** π_V and π_L. A tally of each validator's work, for the epoch in
progress and the one before: blocks, tickets, preimages and their bytes, guarantees,
assurances. *Example:* 1 block, 2 tickets, 3 preimages of 51 bytes.
([18.1](./18-statistics/01-who-did-what.md))

**Core statistics.** π_C. One block's scorecard for each core: the work in the reports it
took on, its data load and its popularity. *Example:* core 0: 821 gas, a 17180-byte
bundle. ([18.2](./18-statistics/02-what-cores-and-services-did.md))

**Service statistics.** π_S. One block's scorecard for each active service: its share of
the work refined, the preimages provided for it, its accumulation. *Example:* service 42:
2 digests, 1518 gas. ([18.2](./18-statistics/02-what-cores-and-services-did.md))

**Data load.** The bytes a core's newly available reports ask validators to keep: each
bundle, plus its segments and their proof pages. *Example:* 12345 + 4 × 4104 = 28761.
([18.2](./18-statistics/02-what-cores-and-services-did.md))

**Popularity.** How many of a block's assurances have a core's bit set. *Example:* 4 of
6 validators assure core 1: popularity 4.
([18.2](./18-statistics/02-what-cores-and-services-did.md))

**Author.** H_I. The validator that made a block, named in its header by index.
*Example:* `author_index: 1`. ([18.1](./18-statistics/01-who-did-what.md))

**Reporters.** 𝐆. Every validator who signed a guarantee in a block, counted once.
*Example:* guarantees signed by 0 and 1, and by 2 and 3: four reporters.
([12.2](./12-guarantees/02-signed-and-counted.md))

## Facing the fuzzer

**Conformance fuzzer.** The JAM testing program: it makes blocks, often mutated
into bad ones, has a client import them, and compares the state roots. ([20.1](./20-facing-the-fuzzer/01-speaking-the-protocol.md))

**Unix socket.** A connection between two programs on one computer, through a file path,
used like a network connection. *Example:* `/tmp/jam_target.sock`. ([20.1](./20-facing-the-fuzzer/01-speaking-the-protocol.md))

**Frame.** One message on a stream of bytes: its length first, so the reader knows where it
ends. *Example:* `21 00 00 00`, then 33 bytes. ([20.1](./20-facing-the-fuzzer/01-speaking-the-protocol.md))

**Fuzz target.** A client answering the fuzzer: the other end of the socket. *Example:*
`bin/target.ts`. ([20.2](./20-facing-the-fuzzer/02-a-target.md))

**Lookup anchor.** The block a work-package read its preimages from while it was refined,
named in its report by hash and slot. *Example:* a block from up to 24 slots ago, on tiny.
([20.2](./20-facing-the-fuzzer/02-a-target.md))

**Ancestry.** The last L blocks of a chain, by slot and header hash: what a client keeps to
check lookup anchors. *Example:* 24 blocks on tiny. ([20.2](./20-facing-the-fuzzer/02-a-target.md))

**Session.** One connection between the fuzzer and a target, from handshake to goodbye:
one Initialize, then any number of blocks. *Example:* a trace's 100 blocks. ([20.3](./20-facing-the-fuzzer/03-a-session.md))

**Environment variable.** A named setting a program reads from where it was started, not
from its arguments. *Example:* `JAM_FUZZ_SPEC=tiny`. ([20.4](./20-facing-the-fuzzer/04-ready-to-be-fuzzed.md))

**Docker image.** A program packaged with everything it needs to run, from the operating
system up. *Example:* `node:26.11.1-bookworm-slim`. ([20.4](./20-facing-the-fuzzer/04-ready-to-be-fuzzed.md))

## The PVM

**PVM.** The Polkadot Virtual Machine: a small, made-up computer, based on RISC-V, that
runs every service's code exactly the same way on every validator.
([15.1](./15-the-pvm/01-the-program-blob.md))

**Register.** One of the PVM's 13 little 64-bit boxes for numbers, named r0 to r12.
Instructions work on registers. ([15.3](./15-the-pvm/03-the-machine.md))

**Instruction and opcode.** An instruction is one small step (add, load, jump...); its
opcode is the number that says which. *Example:* opcode 200 is `add_64`.
([15.1](./15-the-pvm/01-the-program-blob.md))

**Memory and page.** The PVM's memory is 2^32 bytes, handed out in pages of 4,096. Touch a
page you don't have, and the machine stops. ([15.4](./15-the-pvm/04-memory.md))

**Program blob.** A service's code as bytes: the instructions, a bitmask saying where
each starts, and a jump table. ([15.1](./15-the-pvm/01-the-program-blob.md))

**Basic block.** A run of instructions with one way in, its first instruction, and one
way out, a jump or branch (or a stop) at its end. Gas is paid one basic block at a time.
([15.3](./15-the-pvm/03-the-machine.md))

**Halt, panic and out of gas.** The ways a program stops: halt is finishing on purpose,
panic is a crash, out of gas (oog) is running out of budget.
([15.3](./15-the-pvm/03-the-machine.md), [15.11](./15-the-pvm/11-the-gas-meter.md))

**Fault.** The machine stopping because a program touched a page of memory it wasn't
given. It reports the page's address, so whoever runs the machine could add the page
and go on. *Example:* a load from 0x30005 with no page there faults at 0x30000.
([15.4](./15-the-pvm/04-memory.md))

## Beside JAM

Words from [JAM beside Aztec](./jam-beside-aztec.md), the appendix that sets JAM against
Aztec, Ethereum's privacy rollup. None of them is a JAM word.

**Rollup.** A chain that does its work elsewhere and posts the result, with enough data to
check it, to another chain. *Example:* Aztec posts to Ethereum.

**Sequencer.** Aztec's name for a validator: a staked machine that proposes blocks and
signs for others'. *Example:* 200,000 AZTEC to run one.

**Committee.** The few validators drawn to check blocks for a while, out of the many who
are staked. *Example:* 48 of Aztec's 3,000 or so, for 38 minutes.

**Prover.** A machine that turns a batch of finished work into a zero-knowledge proof.
*Example:* Aztec's provers hold no stake.

**Zero-knowledge proof.** A small piece of data that shows a computation was done right,
without redoing it and without showing its inputs. *Example:* a proof that a transfer
balanced, with the amount hidden.

**Client-side proving.** The user's own device makes the proof. *Example:* a phone proving
its own payment before sending it.

**Auditor.** In JAM, a validator drawn to re-run a work-report once its data is available,
and to vote against it if it's wrong. Your client doesn't audit; §17 of the Gray Paper
describes it. *Example:* about 30 auditors per report.

**Stake and slashing.** Money a validator locks to take part, and loses some of for
provable misbehaviour. *Example:* 2,000 AZTEC for a missed duty.

**Noir.** Aztec's language for writing what a zero-knowledge proof proves, with Rust's look
and privacy as the default. It compiles to a form several provers take, so it isn't tied to
Aztec. *Example:* a transfer circuit of a few dozen lines.

**PXE.** Aztec's private execution environment: the library on the user's device that holds
keys and notes, runs private functions and proves them. *Example:* a wallet's PXE proving a
payment in 2.5 seconds on a laptop.

**Shield and unshield.** Moving value from a public account into a private one, and back
out. On JAM, a deferred transfer into the privacy service and one out of it. *Example:*
`zk.money`'s three buttons: shield, send, unshield.
