# Part 2 · The codec

<AlbertChemist />

Appendix C of the Gray Paper defines the codec ℰ, which turns any JAM value into bytes,
and its inverse, which reads the value back. It matters more than it looks. JAM hashes
encodings: a block's hash is the hash of its header's encoding, a work-report is known
by the hash of its encoding. One byte out of place anywhere, and your hashes differ from
every other client's.

Appendix C opens with the codec's one promise:

::: gray-paper C.1

#### Appendix C.1 Common Terms {#gp-C-1}

<a id="gp-C-1-p1"></a>Our codec function $\mathcal{E}$ is used to serialize some term into a sequence of <abbr class="gp-term" title="bytes: 8 bits each">octets</abbr>. We define the deserialization function $\mathcal{E}^{-1}_{}$ as the inverse of $\mathcal{E}$ and able to decode some sequence into the original value. The codec is designed such that exactly one value is encoded into any given sequence of octets, and in cases where this is not desirable then we use special codec functions.

:::

"Exactly one value" for any bytes, and, the other way round, exactly one way to write
each value: that is what lets two clients that never talk agree on a hash.

If you've passed JSON between services, the codec is `JSON.stringify` with the schema baked
in and the field names left out: every structure has a fixed list of fields in a fixed
order, so the bytes carry only values, and a reader needs the same list to make sense of
them. There is no server-side and client-side format. Every validator runs this one codec
on everything, which is why the test vectors can give a structure as JSON and as bytes and
insist on both.

By the end of this part your client encodes and decodes its first two JAM structures
and agrees with the official test vectors, byte for byte.

## At a glance

The whole part on one map. Boxes are what your client holds, and rounded cards are the
steps between them; a dashed card happens outside your client. Tap any card, or walk
through them in order with *next*.

<PartFlow :part="2" />

**Starting here?** At the repo root, `npm run catch-up -- 1.2` makes your client the one
this part starts from; [How to read it](../index.md#how-to-read-it) says more.

- [2.1 Fixed-width integers](./01-fixed-width-integers.md)
- [2.2 Compact naturals](./02-compact-naturals.md)
- [2.3 Writer and Reader](./03-writer-and-reader.md)
- [2.4 Codecs](./04-codecs.md)
- [2.5 Sequences and records](./05-sequences-and-records.md)
- [2.6 The first test vectors](./06-the-first-test-vectors.md)
- [2.7 Watch a decode](./07-watch-a-decode.md)

Every formula of Appendix C these lessons quote is read aloud and worked on a real value
in [2.A](./gray-paper.md). The rest of Appendix C, the bits, the maybe and the block's own
lines, waits for [Part 4](../04-blocks/index.md), the first Part that needs them.

**Test yourself:** [E · Serialization and Merklization (Appendices C and D)](https://abutlabs.github.io/jam-learning/lasair/exam.html?chapter=e-codec-merklization),
self-test cards on JAM learning.
