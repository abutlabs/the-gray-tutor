# Maybe, and exactly n

Next up is the block header, and it has two quirks your codec can't handle yet:

- some of its parts are only there *sometimes*. At the start of an epoch, the header
  announces the next validator set; most headers announce nothing.
- one of its lists has a length *everyone already knows*. When the ticket lottery
  closes, the header lists one winning ticket per slot of the next epoch: exactly 12 on
  tiny, 600 on full. Writing the length in front would be redundant, so JAM doesn't.

Two small codecs, and your toolbox covers the whole block.

## New words

- **Option (discriminator).** A value that may be missing, with a byte in front saying
  whether it's there. *Example:* `00` for nothing; `01` and then the value.
- **Fixed-length sequence.** A list whose length everyone already knows, so none is
  written. *Example:* the tickets mark, exactly 12 tickets on tiny.

Both are in the [glossary](../glossary.md).

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

In plain words, a value that might be missing (∅) is written with a **discriminator** in
front, ¿x: the byte 0 for "nothing", or the byte 1 followed by the value. (C.8) says it
as a tuple, (1, x), and a tuple is its parts side by side
([lesson 2.3](../02-codec/03-writer-and-reader.md)), so the bytes are `01` and then x's.

And a sequence whose length is fixed by the protocol (the Gray Paper writes ⟦T⟧ₙ for "n
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
`0x03` in front. Both shapes, byte by byte: flip the option, type a value, switch the
list between `seq` and `seqN`, and tap any byte for its job.

<MaybeExactly />

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
**`option(u32)` writes 7 as `01 07 00 00 00`. What does the `01` say?**

- [ ] The length of what follows: one value
  > No: it isn't a count. A u32 is always 4 bytes, so it needs no length; `01` only
  > says whether there's a value at all.
- [x] "There is a value, and here it comes"
  > Yes: it's the discriminator. `01` for a value, then the value by its own rule, 7 as
  > ℰ₄.
- [ ] It's part of the number 7
  > No: 7 as ℰ₄ is `07 00 00 00`, the four bytes after it. The `01` sits in front.

**How does `option(u32)` write "nothing"?**

- [ ] As no bytes at all
  > No: then the decoder couldn't tell. It would read the next field's first byte as
  > if it were this one.
- [ ] As `00 00 00 00`, a u32 of zero
  > No: zero is a real value, not a missing one. `option(u32)` writes 0 as
  > `01 00 00 00 00`.
- [x] As the single byte `00`
  > Yes: the tag 0, and that's all. The decoder sees `00` and knows no value follows.

**`seq(u16)` writes [1, 2, 3] as `03 01 00 02 00 03 00`. Why can `seqN(u16, 3)` leave off the `03`?**

- [x] Both sides already know there are three
  > Yes: a fixed-length sequence's length is set by the protocol, so writing it would
  > tell the decoder nothing new.
- [ ] Because three is small enough to guess
  > No: size has nothing to do with it. The tickets mark holds 600 tickets on full,
  > and still has no length.
- [ ] Because the decoder reads until the bytes run out
  > No: more fields usually follow. Without knowing n, a decoder couldn't tell where
  > the list ends and the next field begins.
:::

## What you have

Every kind of codec a JAM block needs: integers, bytes, sequences, records, either-or,
maybe, and exactly n. [Lesson 4.6](./06-the-header.md) puts the last two to work in a
block's header.

Next: [4.6 The header](./06-the-header.md)
