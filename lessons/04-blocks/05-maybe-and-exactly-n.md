# Maybe, and exactly n

**In one sentence:** two small codecs finish the toolbox: one for a value that may be
missing, and one for a list whose length everyone already knows.

Here are both, byte by byte. Flip the option, type a value, switch the list between `seq`
and `seqN`, and tap any byte for its job.

<a id="try-it"></a>

<MaybeExactly />

## The idea

Next up is the block header, and it asks two questions your codec can't answer yet.

**How do you write something that may not be there?** At the start of an epoch, the
header announces the next validator set. Most headers announce nothing. The bytes carry no
labels, so "nothing" can't be no bytes at all: the decoder would take the next field for
this one. So a yes-or-no byte goes in front, like the tick box on a form: "attachment
enclosed?" No, and that is all. Yes, and the value follows. That is an
[*option*](../glossary.md#option).

**Why write a length that everyone knows?** When the ticket lottery closes, the header
lists one winning ticket per slot of the next epoch: exactly 12 on tiny, 600 on full.
Nobody writes "7" in front of the days of a week. JAM doesn't write the length either:
the items come one after another, and both sides count. That is a
[*fixed-length sequence*](../glossary.md#fixed-length-sequence).

This lesson builds both codecs. With them, your toolbox covers the whole block.

## What the Gray Paper says

Appendix C, *Discriminator Encoding*, ends with a sign for a value that might be missing:

::: gray-paper C.1.3 4-5

#### Appendix C.1.3 Discriminator Encoding, continued

<a id="gp-C-1-3-p4"></a>We also define a convenient <abbr class="gp-term" title="a number in front of a value that tells a reader how to read what follows: a length, or which kind">discriminator</abbr> operator $\mathord{\unicode{xBF}}x$ specifically for terms defined by some serializable set in union with $\emptyset$ (generally denoted for some set $S$ as $S\boldsymbol{?}$):

<a id="gp-C-1-3-p5"></a><a id="eq-C-8"></a>

$$
\begin{align}
\mathord{\unicode{xBF}}x \equiv \begin{cases}
0 &\text{if } x = \emptyset \\
\left(1, x\right) &\text{otherwise}
\end{cases} \tag{C.8}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-maybe">$\mathord{\unicode{xBF}}x$</span> | maybe | ¿x: the byte 0 if x is nothing (∅), or the byte 1 and then x |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-none" class="gk-wrap">$\emptyset$</span> | nothing | ∅: no value at all, like null |

</details>

→ [(C.8) in plain words](./gray-paper.md#ex-C-8)

:::

A value that might be missing (∅) is written with a **discriminator** in front, ¿x: the
byte 0 for "nothing", or the byte 1 followed by the value. (C.8) says it as a tuple,
(1, x), and a tuple is its parts side by side
([lesson 2.3](../02-codec/03-writer-and-reader.md)), so the bytes are `01` and then x's.

A sequence whose length is fixed by the protocol (the Gray Paper writes ⟦T⟧ₙ for "n
things of type T") is just its items, one after another, no length in front.

To watch both at work in a real block header, try the widget in [lesson 4.6](./06-the-header.md).

## The tests

**Add to** `test/codec.test.ts`

```ts
import { option, seqN } from "../src/codec/codec.ts";

test("an option is 0, or 1 and the value", () => {
  const noneHex: string = toHex(encode(option(u32), null));
  assert.equal(noneHex, "0x00");
  const someHex: string = toHex(encode(option(u32), 7));
  assert.equal(someHex, "0x0107000000");
  const none: number | null = decode(option(u32), fromHex("0x00"));
  assert.equal(none, null);
  const some: number | null = decode(option(u32), fromHex("0x0107000000"));
  assert.equal(some, 7);
});

test("a fixed-length sequence has no length in front", () => {
  const fixedHex: string = toHex(encode(seqN(u16, 3), [1, 2, 3]));
  assert.equal(fixedHex, "0x010002000300");
  const fixedDecoded: number[] = decode(seqN(u16, 3), fromHex("0x010002000300"));
  assert.deepEqual(fixedDecoded, [1, 2, 3]);
});
```

The tests' bytes:

```text
00                   nothing (null): the tag 0, and that's all
01 07 00 00 00       7: the tag 1, then 7 as a u32, 4 bytes
01 00 02 00 03 00    [1, 2, 3] as exactly three u16s: 6 bytes, no length in front
```

Compare `seqN(u16, 3)` with [lesson 2.5](../02-codec/05-sequences-and-records.md)'s `seq(u16)`: the same three numbers, minus the
`0x03` in front. These are the bytes of the widget [at the top](#try-it).

## The code

**Add to** `src/codec/codec.ts`

```ts
/** ¿x: 0 for nothing (null), or 1 and the value. */
export function option<T>(item: Codec<T>): Codec<T | null> {
  return {
    encode: (w, x) => {
      if (x === null) {
        w.natural(0n);
      } else {
        w.natural(1n);
        item.encode(w, x);
      }
    },
    decode: (r) => (r.field("present", () => r.natural()) === 0n ? null : item.decode(r)),
    fromJson: (json) => (json === null ? null : item.fromJson(json)),
  };
}

/** [...]_n: exactly n items, with no length in front: everyone knows n already. */
export function seqN<T>(item: Codec<T>, n: number): Codec<T[]> {
  return {
    encode: (w, items) => {
      for (const x of items) item.encode(w, x);
    },
    decode: (r) => Array.from({ length: n }, (_, i) => r.field(String(i), () => item.decode(r))),
    fromJson: (json) => (json as unknown[]).map((j) => item.fromJson(j)),
  };
}
```

"Nothing" is `null` in your client, just as it is in the vectors' JSON. Both codecs name
what they read for the decode trace ([lesson 2.7](../02-codec/07-watch-a-decode.md)): an option's tag shows up as `present`,
and a fixed sequence's items as `0`, `1`, `2`, just like `seq`'s, minus the `length`.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ an option is 0, or 1 and the value (0.1ms)
✔ a fixed-length sequence has no length in front (0.1ms)
...
ℹ tests 44
ℹ suites 0
ℹ pass 44
ℹ fail 0
...
reported 44 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791728308105
...
```

<details>
<summary>lasair: <code>encode_maybe</code>, in <code>lib/serialization.ml</code></summary>

```ocaml
(** Encode optional value *)
let encode_maybe (encode_inner : 'a -> bytes) (opt : 'a option) : bytes =
  match opt with
  | None -> Bytes.make 1 '\x00'
  | Some v ->
    let inner = encode_inner v in
    let result = Bytes.create (1 + Bytes.length inner) in
    Bytes.set result 0 '\x01';
    Bytes.blit inner 0 result 1 (Bytes.length inner);
    result
```

OCaml's `option` is the same idea built into the language: `None`, or `Some v`. lasair
copies bytes around by hand (`Bytes.blit`); your Writer just writes the tag, then the
value.

</details>

## Check your understanding

::: check
**A header field is missing in most blocks. Why not write a missing value as no bytes at all?**

- [ ] That would work: the decoder sees the field isn't there and moves on
  > No: the bytes carry no labels. With nothing written, the decoder would read the next
  > field's first byte as if it were this one.
- [x] The decoder couldn't tell missing from present, so one byte in front says which
  > Yes: the discriminator. 0 and that's all, or 1 and then the value by its own rule.
- [ ] It would change the block's hash
  > No: any change to the bytes changes a hash. The trouble is earlier: the bytes couldn't
  > be read back at all.

**Why not write a missing number as zero, and save the byte in front?**

- [ ] Zero takes more bytes than the discriminator does
  > No: that's true of a u32, but it isn't the reason. The saving would cost the meaning.
- [ ] Zero is not a number the codec can write
  > No: ℰ₄ writes 0 as four zero bytes without trouble.
- [x] Zero is a real value: a reader could no longer tell "0" from "nothing"
  > Yes: an option keeps the two apart. Nothing is one byte, 0. The number zero is the
  > byte 1 and then zero's own bytes.

**When may a list be written with no length in front?**

- [x] When the protocol fixes its length, so both sides already know it
  > Yes: writing it would tell the decoder nothing new. The tickets mark is exactly one
  > ticket per slot of an epoch.
- [ ] When it is short enough to guess
  > No: size has nothing to do with it. The tickets mark holds 600 tickets on full,
  > and still has no length.
- [ ] When it is the last field, so the decoder can read until the bytes run out
  > No: more fields usually follow. Without knowing n, a decoder couldn't tell where
  > the list ends and the next field begins.

**The tickets mark is exactly 12 tickets on tiny and 600 on full, with no length written. What must a decoder have before it reads one?**

- [ ] Nothing: the first ticket says how many follow
  > No: a ticket holds no count. A fixed-length list is its items and nothing else.
- [x] The configuration of the network it is reading
  > Yes: n comes from outside the bytes. A decoder set for tiny would read 12 tickets of a
  > full header's 600 and take the rest for the next fields.
- [ ] The block's extrinsic, which lists the tickets again
  > No: the header is read by itself. Its lists don't lean on the extrinsic for their
  > lengths.
:::

## What you have

Every kind of codec a JAM block needs: integers, bytes, sequences, records, either-or,
maybe, and exactly n. [Lesson 4.6](./06-the-header.md) puts the last two to work in a
block's header.

Next: [4.6 The header](./06-the-header.md)
