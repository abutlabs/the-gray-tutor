# Codecs

**In one sentence:** a codec is one object that knows one kind of value three ways: how to
encode it, how to decode it, and how to read it from the test vectors' JSON.

Put one number under all five codecs. The codec decides the bytes, not the value: 7 is one
byte or eight, depending on which you ask.

<a id="try-it"></a>

<CodecPicker />

## The idea

Every kind of JAM value needs three things: its encoding, from the Gray Paper; its
decoding, the way back; and a way to read it from the test vectors'
[*JSON*](../glossary.md#json), the plain-text format they are written in, so tests can
compare.

Write those three separately for every structure and sooner or later they drift apart. A
field gets added to the encoder but not the decoder. Two fields get read in the wrong
order.

So each kind of value gets one object holding all three: a
[*codec*](../glossary.md#codec). Small codecs, for a 4-byte number or a hash, snap
together into codecs for whole structures, like bricks. The field order is written once,
and every direction follows it.

This lesson builds the smallest bricks: a codec for each width of integer, one for bytes
of a known size, and one for a [*blob*](../glossary.md#blob), a run of bytes of no fixed
length.

## What the Gray Paper says

Appendix C starts from the two simplest values there are, nothing and bytes:

::: gray-paper C.1.1 1-4

#### Appendix C.1.1 Trivial Encodings {#gp-C-1-1}

<a id="gp-C-1-1-p1"></a>We define the <abbr class="gp-term" title="turning a value into bytes, so it can be hashed, signed or sent">serialization</abbr> of $\emptyset$ as the empty sequence:

<a id="gp-C-1-1-p2"></a><a id="eq-C-1"></a>

$$
\begin{equation}
\mathcal{E}_{}\left(\emptyset\right) \equiv \left[\right] \tag{C.1}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-encode">[$\mathcal{E}\left(x\right)$](../symbols.md#encode)</span> | E of | the encoding of what's in the brackets: its bytes, by Appendix C's rules |
| <span id="gk-none" class="gk-wrap">$\emptyset$</span> | nothing | ∅: no value at all, like null |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-sq">[$\left[x\right]$](../symbols.md#sequence)</span> | the sequence | a sequence written out item by item; [ ] is the empty one |

</details>

→ [(C.1) explained](./gray-paper.md#ex-C-1)

<a id="gp-C-1-1-p3"></a>We also define the serialization of an octet-sequence as itself:

<a id="gp-C-1-1-p4"></a><a id="eq-C-2"></a>

$$
\begin{equation}
\mathcal{E}_{}\left(x \in \mathbb{B}_{}\right) \equiv x \tag{C.2}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-in">[$\in$](../symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-blob">[$\mathbb{B}$](../symbols.md#blobs)</span> | B, or B sub n | bytes: any run of them; 𝔹ₙ exactly n of them |

</details>

→ [(C.2) explained](./gray-paper.md#ex-C-2)

:::

Nothing (∅) encodes as no bytes at all (C.1). Bytes encode as themselves (C.2): a hash's
32 bytes go out exactly as they are.

For bytes whose number isn't known in advance, it adds a length in front:

::: gray-paper C.1.3 1-3

#### Appendix C.1.3 Discriminator Encoding {#gp-C-1-3}

<a id="gp-C-1-3-p1"></a>When we have sets of heterogeneous items such as a union of different kinds of tuples or sequences of different length, we require a <abbr class="gp-term" title="a number in front of a value that tells a reader how to read what follows: a length, or which kind">discriminator</abbr> to determine the nature of the encoded item for successful deserialization. Discriminators are encoded as a natural and are encoded immediately prior to the item.

<a id="gp-C-1-3-p2"></a>We generally use a *length discriminator* when serializing sequence terms which have variable length (e.g.  general blobs $\mathbb{B}_{}$ or unbound numeric sequences $\left[\!\left[\mathbb{N}\right]\!\right]_{}$) (though this is omitted in the case of fixed-length terms such as hashes $\mathbb{H}_{}$).<sup>1</sup> In this case, we simply prefix the term its length prior to encoding. Thus, for some term $y \in \left(x \in \mathbb{B}_{}, \dots\right)$, we would generally define its serialized form to be $\mathcal{E}_{}\left(\left\vert x\right\vert\right)\frown\mathcal{E}_{}\left(x\right)\frown\dots$. To avoid repetition of the term in such cases, we define the notation $\left\updownarrow x\right.\!$ to mean that the term of value $x$ is variable in size and requires a length discriminator. Formally:

<small class="gp-note"><sup>1</sup> Note that since specific values may belong to both sets which would need a discriminator and those that would not then we are sadly unable to introduce a function capable of serializing corresponding to the *term*'s limitation. A more sophisticated formalism than basic set-theory would be needed, capable of taking into account not simply the value but the term from which or to which it belongs in order to do this succinctly.</small>

<a id="gp-C-1-3-p3"></a><a id="eq-C-7"></a>

$$
\begin{equation}
\left\updownarrow x\right.\! \equiv \left(\left\vert x\right\vert, x\right)\text{ thus }\mathcal{E}_{}\left(\left\updownarrow x\right.\!\right) \equiv \mathcal{E}_{}\left(\left\vert x\right\vert\right)\frown\mathcal{E}_{}\left(x\right) \tag{C.7}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-var">[$\left\updownarrow x\right.\!$](../symbols.md#length-prefix)</span> | with its length | ↕x: x with its length in front, as a compact natural |
| <span id="gk-len">$\left\vert x\right\vert$</span> | the size of | \|x\|: how many items x has, or how many bytes |
| <span id="gk-concat" class="gk-wrap">[$\frown$](../symbols.md#concat)</span> | concatenate | join: the left sequence followed by the right |

</details>

→ [(C.7) explained](./gray-paper.md#ex-C-7)

:::

A value whose size can vary gets its length in front, as a compact natural from
[lesson 2.2](./02-compact-naturals.md). The paper calls that length a discriminator and
writes ↕x for "x, with its length in front" (C.7). The three bytes 1, 2, 3 as a blob are
`0x03010203`: `03`, the length, then `01 02 03`. A hash needs no length: everyone knows
it's 32 bytes.

That is the whole of this lesson's codecs: numbers as [2.1](./01-fixed-width-integers.md) and
[2.2](./02-compact-naturals.md) write them, fixed bytes as themselves, and a blob as ↕.

## The interface

A TypeScript [*interface*](../glossary.md#interface) lists what an object must have, with
no code in it. This one is [*generic*](../glossary.md#generic): `<T>` is a blank, filled
in where it's used, so `Codec<number>` is a codec for numbers.

**New file** `src/codec/codec.ts`

```ts
// Codec<T>: one kind of value, how it is encoded (GP Appendix C), how it is decoded,
// and how the test vectors write it in JSON.

import type { Bytes } from "../bytes.ts";
import { Reader } from "./reader.ts";
import { Writer } from "./writer.ts";

export interface Codec<T> {
  encode(w: Writer, value: T): void;
  decode(r: Reader): T;
  /** The value, from the way the test vectors write it in JSON. */
  fromJson(json: unknown): T;
}

/** The type of value a codec handles: Value<typeof u32> is number. */
export type Value<C> = C extends Codec<infer T> ? T : never;

/** ℰ(value): the value's encoding. */
export function encode<T>(codec: Codec<T>, value: T): Bytes {
  const w = new Writer();
  codec.encode(w, value);
  return w.finish();
}

/** The value these bytes encode. */
export function decode<T>(codec: Codec<T>, bytes: Bytes): T {
  return codec.decode(new Reader(bytes));
}
```

`Value<C>` uses `infer`: "if C is a `Codec` of some T, give me that T". It lets the type
of a whole structure fall out of its codec, as [the next lesson](./05-sequences-and-records.md) shows.

## Integers

**Add to** `src/codec/codec.ts`

```ts
/** ℰ_l for l = 1, 2 or 4, as a JS number. */
function fixedNumber(l: number): Codec<number> {
  return {
    encode: (w, x) => w.fixed(BigInt(x), l),
    decode: (r) => Number(r.fixed(l)),
    fromJson: (json) => json as number,
  };
}

/** ℰ₁: a u8. */
export const u8 = fixedNumber(1);

/** ℰ₂: a u16. */
export const u16 = fixedNumber(2);

/** ℰ₄: a u32: timeslots, service ids. */
export const u32 = fixedNumber(4);

/** ℰ₈: a u64: gas, balances. */
export const u64: Codec<bigint> = {
  encode: (w, x) => w.fixed(x, 8),
  decode: (r) => r.fixed(8),
  fromJson: (json) => BigInt(json as number),
};

/** ℰ, compact: a natural below 2^64. */
export const natural: Codec<bigint> = {
  encode: (w, x) => w.natural(x),
  decode: (r) => r.natural(),
  fromJson: (json) => BigInt(json as number),
};

/** ℰ, compact, for small counts and lengths, as a JS number. */
export const natural32: Codec<number> = {
  encode: (w, x) => w.natural(BigInt(x)),
  decode: (r) => Number(r.natural()),
  fromJson: (json) => json as number,
};
```

`fixedNumber` isn't exported: it's a recipe the file uses three times. There are two
compact codecs because the same encoding carries two kinds of value: amounts that can
reach 2^64 (`bigint`, [lesson 1.2](../01-bytes-and-numbers/02-numbers.md)) and counts that never come close (`number`).
The 32 in `natural32` says what it's for, counts and lengths that fit in 32 bits, not how
many bytes it writes: its bytes are the same compact ones as `natural`'s, so the count 3 is
the one byte `03`, never four.

`json as number` tells TypeScript "trust me, the vectors write a number here". The test
vectors are well-formed, so the first pass trusts them; checking them is a job for the
[hardening pass](https://github.com/abutlabs/the-gray-tutor/blob/main/HARDENING.md).

## Bytes

**Add to** `src/codec/codec.ts`

```ts
import { fromHex } from "../bytes.ts";

/** 𝔹_n: exactly n bytes, encoded as themselves. */
export function fixedBytes(n: number): Codec<Bytes> {
  return {
    encode: (w, b) => w.bytes(b),
    decode: (r) => r.bytes(n),
    fromJson: (json) => fromHex(json as string),
  };
}

/** ℍ: a 32-byte hash. */
export const hash = fixedBytes(32);

/** ↕x: a blob of any length, its length first. */
export const blob: Codec<Bytes> = {
  encode: (w, b) => {
    w.natural(BigInt(b.length));
    w.bytes(b);
  },
  decode: (r) => r.bytes(Number(r.natural())),
  fromJson: (json) => fromHex(json as string),
};
```

`blob` is (C.7)'s ↕x, "x with its length in front"; `fixedBytes` is (C.2), bytes as
themselves.

## Tests

**New file** `test/codec.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { fromHex, toHex } from "../src/bytes.ts";
import { blob, decode, encode, hash, natural, natural32, u16, u32, u64, u8 } from "../src/codec/codec.ts";
import type { Bytes } from "../src/bytes.ts";

test("integers encode as ℰ_l and ℰ", () => {
  const u8Hex: string = toHex(encode(u8, 7));
  assert.equal(u8Hex, "0x07");
  const u16Hex: string = toHex(encode(u16, 4807));
  assert.equal(u16Hex, "0xc712");
  const u32Hex: string = toHex(encode(u32, 16909060));
  assert.equal(u32Hex, "0x04030201");
  const u64Hex: string = toHex(encode(u64, 42n));
  assert.equal(u64Hex, "0x2a00000000000000");
  const naturalHex: string = toHex(encode(natural, 128n));
  assert.equal(naturalHex, "0x8080");
  const decoded: number = decode(natural32, fromHex("0xc00040"));
  assert.equal(decoded, 16384);
});

test("from the vectors' JSON: u32s stay numbers, u64s become bigints", () => {
  const fromU32: number = u32.fromJson(16909060);
  assert.equal(fromU32, 16909060);
  const fromU64: bigint = u64.fromJson(42);
  assert.equal(fromU64, 42n);
});

test("a hash is 32 bytes as they are; a blob has its length in front", () => {
  const h: Bytes = new Uint8Array(32).fill(0xab);
  const hashEncoded: Bytes = encode(hash, h);
  assert.deepEqual(hashEncoded, h);
  const blobHex: string = toHex(encode(blob, fromHex("0x0102030405")));
  assert.equal(blobHex, "0x050102030405");
  const blobDecoded: Bytes = decode(blob, fromHex("0x050102030405"));
  assert.deepEqual(blobDecoded, fromHex("0x0102030405"));
});
```

The tests' bytes, value by value:

```text
07                        7 as a u8: 1 byte
c7 12                     4,807 as a u16: 2 bytes, little end first
04 03 02 01               16,909,060 (0x01020304) as a u32: 4 bytes
2a 00 00 00 00 00 00 00   42 as a u64: 8 bytes, however small the number
80 80                     128 as a compact natural: 2 bytes
c0 00 40                  16,384 as a compact natural: 3 bytes
05 01 02 03 04 05         a 5-byte blob: its length, 05, then the 5 bytes
```

A hash is its 32 bytes and nothing else: its length is always 32, so none goes in front.

The same number under two codecs gives different bytes: 16,384 is
`00 40 00 00` as a u32, `c0 00 40` as a natural. Try others [at the top](#try-it).

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ integers encode as ℰ_l and ℰ (0.6ms)
✔ from the vectors' JSON: u32s stay numbers, u64s become bigints (0.1ms)
✔ a hash is 32 bytes as they are; a blob has its length in front (1.2ms)
...
ℹ tests 15
ℹ suites 0
ℹ pass 15
ℹ fail 0
...
reported 15 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791726352348
...
```

This time the tests come after the code: the earlier lessons tested the machinery
underneath, so these check the joints. The right width for each integer, a length in
front of a blob, and 16909060 written as `04 03 02 01`, little end first.

<details>
<summary>lasair: separate encoders and decoders</summary>

lasair writes an encoder and a decoder for each structure, as two functions, such as
`encode_refinement_context` and `decode_refinement_context` in `lib/serialization.ml`.
It works, and its tests keep each pair in step. A codec makes the pairing structural
instead: one field list per structure, so encoder and decoder can't disagree about the
order.

</details>

## Check your understanding

::: check
**Why put encoding, decoding and reading the JSON in one codec, instead of three separate functions?**

- [ ] A codec writes fewer bytes than separate functions would
  > No: the bytes are the Gray Paper's either way, however the code is arranged.
- [x] So the three can't drift apart
  > Yes: written separately, a field gets added to the encoder but not the decoder, or two
  > fields get read in the wrong order. In one codec, the order is written once.
- [ ] Because the test vectors are stored with all three in one file
  > No: the vectors hold values (in JSON) and bytes. Grouping the three directions is
  > about keeping your own code in step.

**You know a field holds the number 16,384. Do you know its bytes?**

- [ ] Yes: a number has only one encoding
  > No: the fixed four-byte width writes four bytes, and the compact natural as few as it
  > needs. Same number, different bytes.
- [ ] Yes: the compact form, since it is the shortest
  > No: nothing picks the shortest. A timeslot is four bytes even when it is 1.
- [x] No: the codec decides the bytes, not the value
  > Yes: the Gray Paper's type for the field says which encoding it gets. Until you know
  > the codec, you don't know the bytes.

**Why does a blob carry its length in front, when a hash doesn't?**

- [x] A blob can be any size, so the bytes must say where it ends; a hash is always 32 bytes
  > Yes: that's what ↕ is for. A blob can sit in the middle of a bigger value, with more
  > fields after it, and the length says where it stops.
- [ ] A hash is too short to need one
  > No: size isn't the point. A hash needs no length because everyone knows it is 32
  > bytes.
- [ ] A decoder reads a blob to the end of the input, and the length is a check
  > No: a blob is rarely last. Without the length the decoder could not find the field
  > after it.

**`natural32` gives a count back as a `number`. Does it write four bytes?**

- [ ] Yes: the 32 means 32 bits, so 4 bytes
  > No: the name is about the value in your code, a `number` instead of a `bigint`, not
  > the bytes. On the wire it is the same compact natural as `natural`.
- [x] No: it writes exactly the bytes `natural` does
  > Yes: both use ℰ, the compact natural. Only the type you get back differs: counts never
  > come near 2^64, so a plain `number` holds them.
:::

## What you have

A `Codec`: one description of a value that both encodes and decodes it, for every
integer width and for blobs. JAM's structures are made of these, in lists and in records
of named fields. [Lesson 2.5](./05-sequences-and-records.md) builds those two, and with
them, any JAM structure.

Next: [2.5 Sequences and records](./05-sequences-and-records.md)
