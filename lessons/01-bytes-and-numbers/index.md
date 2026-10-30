# Part 1 · Bytes and numbers

Before any protocol: the two kinds of data every JAM structure is made of, and the two
places JavaScript gets them wrong if you let it.

Most web code passes text around. One server sends `{"slot": 5, "ok": true}`, another
replies with `{"ok":true,"slot":5}`, and everyone agrees they mean the same thing. JAM
can't work like that, because JAM doesn't compare meanings: it compares hashes. A hash is
a 32-byte fingerprint of some bytes: change one bit, and the fingerprint changes
completely. Those two messages hold the same values in different bytes (the order and
the spaces differ), so their hashes have nothing in common.

And JAM hashes everything. Every client keeps its own copy of the chain's state, and
each block header carries the state root: a hash of the whole state after the block
before it. Every client checks that root against its own. Turn the same state into even
one different byte, and your root differs: your client rejects good blocks, the others
reject yours, and it has fallen off the chain.

So the Gray Paper pins every value down to exactly one row of bytes: which fields, in
which order, how wide each number is, and which end of it comes first. The slot 5 in a
header is always the four bytes `05 00 00 00`, never the text `"5"`. That is the codec,
[Part 2](../02-codec/index.md). This part builds what the codec is made of: bytes, and
numbers kept exact all the way down to them.

> [!NOTE]
> **How a client runs doesn't change its bytes.** A program's own instructions are
> bytes too, but not these bytes. lasair is OCaml, compiled to machine code (the CPU's
> own instructions) before it runs. Your client is TypeScript: Node strips the types and
> runs the JavaScript, which starts as bytecode (instructions for Node's own virtual
> machine) and has its busiest parts compiled to machine code as it runs. TypeScript 7,
> the version you installed, rewrote `tsc` in Go to make it much faster, but `tsc` only
> checks your types: nothing it does reaches the program Node runs. The codec describes
> data, not instructions, so two clients built in completely different ways still agree,
> byte for byte.

By the end of this part your client reads and writes bytes as hex, the way the test
vectors write them, and keeps every number exact: `number` up to 32 bits, `bigint` for
64.

## At a glance

The whole part on one map. Boxes are what your client holds, and rounded cards are the
steps between them; a dashed card happens outside your client. Tap any card, or walk
through them in order with *next*.

<PartFlow :part="1" />

**Starting here?** At the repo root, `npm run catch-up -- 0.6` makes your client the one
this part starts from; [How to read it](../index.md#how-to-read-it) says more.

- [1.1 Bytes and hex](./01-bytes-and-hex.md)
- [1.2 Numbers](./02-numbers.md)
