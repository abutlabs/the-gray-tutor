# Compact naturals

**In one sentence:** a compact natural is a whole number written in as few bytes as it
needs, one to nine, with the first byte saying how many more follow.

Try any number. Step from 127 to 128 and a second byte appears; from 16,383 to 16,384, a
third. The colours show the marker, the number's top bits and its low bits.

<a id="try-it"></a>

<CompactNatural />

## The idea

Fixed widths are wasteful. The number 3 in eight bytes is seven bytes of nothing. And JAM
writes a lot of small numbers, because every list carries its length in front.

So why not write a small number in one byte and a big one in more? Because then the
reader can't tell where the number ends. Something has to say how long it is.

The trick: the first byte says so itself. Its first bits are a marker, and the marker
tells the reader how many more bytes follow. The bits left over carry the start of the
number. A small number needs no more bytes at all, so it is one byte, marker included.
A bigger one takes two, then three, up to nine.

That is a [*compact natural*](../glossary.md#compact-natural). A short list costs one
byte of length. A list of a million still has a way to say so.

This lesson builds it both ways: a number to its bytes, and bytes back to the number,
with a count of how many bytes it took.

## What the Gray Paper says

Appendix C defines ℰ without a subscript, for any natural below 2^64, in one to nine
bytes:

::: gray-paper C.1.1 9-10

#### Appendix C.1.1 Trivial Encodings, continued

<a id="gp-C-1-1-p9"></a>We define general natural number <abbr class="gp-term" title="turning a value into bytes, so it can be hashed, signed or sent">serialization</abbr>, able to encode naturals of up to $2^{64}$, as:

<a id="gp-C-1-1-p10"></a><a id="eq-C-5"></a>

$$
\begin{equation}
\mathcal{E}_{}\colon\left\{ \begin{aligned}
\mathbb{N}_{2^{64}} &\to \mathbb{B}_{1:9} \\
x &\mapsto \begin{cases}
\left[0\right] &\text{if } x = 0 \\
\left[2^8-2^{8-l} + \left\lfloor\frac{x}{2^{8l}}\right\rfloor\right] \frown \mathcal{E}_{l}\left(x \bmod 2^{8l}\right) &\text{if } \exists l \in \mathbb{N}_8 : 2^{7l} \le x < 2^{7(l+1)} \\
\left[2^8-1\right] \frown \mathcal{E}_{8}\left(x\right) &\text{otherwise if } x < 2^{64} \\
\end{cases}
\end{aligned} \right. \tag{C.5}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-fnencode">[$\mathcal{E}$](../symbols.md#encode)</span> | E | the codec: a value in, its bytes out; a number alone, as a compact natural of 1 to 9 bytes |
| <span id="gk-abracegroup">$\left\{ \begin{aligned}x\end{aligned} \right.$</span> | as follows | a brace grouping lines that hold together: for a function, its type on top, then what each input becomes |
| <span id="gk-Nbits">[$\mathbb{N}_{2^{x}}$](../symbols.md#naturals)</span> | N sub two to the n | the numbers that fit in n bits: ℕ_{2³²} is a u32 |
| <span id="gk-to">[$\to$](../symbols.md#to)</span> | to | what goes in, to what comes out: A → B takes an A and gives a B |
| <span id="gk-blob">[$\mathbb{B}$](../symbols.md#blobs)</span> | B, or B sub n | bytes: any run of them; 𝔹ₙ exactly n of them |
| <span id="gk-mapsto">$\mapsto$</span> | maps to | what a function gives back for an input: x ↦ y says x becomes y |
| <span id="gk-sq">[$\left[x\right]$](../symbols.md#sequence)</span> | the sequence | a sequence written out item by item; [ ] is the empty one |
| <span id="gk-ffrac">$\left\lfloor\frac{x}{y}\right\rfloor$</span> | x over y, rounded down | whole-number division, the remainder dropped: ⌊7/3⌋ is 2 |
| <span id="gk-concat" class="gk-wrap">[$\frown$](../symbols.md#concat)</span> | concatenate | join: the left sequence followed by the right |
| <span id="gk-encode">[$\mathcal{E}\left(x\right)$](../symbols.md#encode)</span> | E of | the encoding of what's in the brackets: its bytes, by Appendix C's rules |
| <span id="gk-bmod">[$\bmod$](../symbols.md#mod)</span> | mod | the remainder after dividing: 14 mod 4 is 2 |
| <span id="gk-exists">[$\exists$](../symbols.md#exists)</span> | there exists | there is at least one value such that what follows holds |
| <span id="gk-in">[$\in$](../symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-N" class="gk-wrap">[$\mathbb{N}$](../symbols.md#naturals)</span> | N | the whole numbers: 0, 1, 2 and up; a subscript is a bound, ℕ₈ is 0 to 7 |
| <span id="gk-le">$\le$</span> | at most | less than or equal to |

</details>

→ [(C.5) in plain words](./gray-paper.md#ex-C-5)

:::

Take it one length at a time.

**Below 128: one byte.** The first bit is 0: no more bytes follow. That leaves 7 bits for
x, enough for 0 to 127.

Why 127? A byte's eight bits are worth 128, 64, 32, 16, 8, 4, 2 and 1, left to right, as
in [lesson 1.1](../01-bytes-and-numbers/01-bytes-and-hex.md#hex), and the number is the sum of the places holding a 1. `0b01111111` has a 1 in every place but the
first: 64 + 32 + 16 + 8 + 4 + 2 + 1 = 127. Add 1 and every 1 carries, as 999 + 1 does in
decimal: `0b10000000`, 128. So seven bits reach 127 and no further, and 128 is the first
number that needs the eighth. Click the bits to try it:

<BitPlaces />

**128 to 16,383: two bytes.** 128 needs 8 bits, one too many. So the first byte starts
`0b10`: one more byte follows. That leaves 6 bits in the first byte and 8 in the second, 14
in all. Write x in 14 bits, put its top 6 after the `0b10`, and its low 8 in the second
byte.

The 14 places go on doubling past 128: 256, 512, up to 8,192, so the most they hold is
16,383, one less than 16,384 (2^14), as 127 is one less than 128. Click x's bits and watch
its two bytes:

<TwoBytes />

> [!NOTE]
> **A leading 0, or all 8 bits?** It depends on what the byte is, not on its value.
>
> - **A byte that is just a byte uses all 8 bits: 0 to 255.** Every byte of a hash (ℍ,
>   [lesson 1.1](../01-bytes-and-numbers/01-bytes-and-hex.md)), every byte of a
>   fixed-width number such as a block's timeslot (ℰ₄, [lesson
>   2.1](./01-fixed-width-integers.md)), and every byte after a compact natural's first:
>   300's second byte is `0x2c`, and 16,383's is `0xff`, all eight bits x's own.
> - **The first byte of a compact natural gives its first bits to the marker.** One byte
>   alone starts with the 0 that says "no more follow", so it holds only 0 to 127. In JAM
>   every list carries its length as a compact natural: a list of 127 items costs one byte
>   of length, `0x7f`, and a list of 128 costs two, `0x8080`.
>
> The byte `0xff` is 255 in a hash, but as a compact natural's first byte it means "eight
> more bytes follow". Nothing in the byte says which: the Gray Paper's types say what comes
> where, and the decoder reads in that order.

In the picture, each small square is one bit, and each thick teal box is one byte of
eight bits. The top row of each pair is x itself, one unbroken strip of bits, not yet
bytes. The bottom row is ℰ(x), the bytes that go on the wire. The shading shows where
each group of x's bits ends up.

![A key first: a small square is one bit, a thick box of eight squares is one byte. Then 127, 128 and 300. 127 is a strip of seven one-bits; its one byte is a 0, then those seven bits: 0x7f. 128 is a strip of 14 bits, six zero top bits then the low bits 0b10000000; its first byte is the marker 0b10 then the six top bits, 0x80, and its second byte is the low bits, 0x80. 300 has the top bits 0b000001 and the low bits 0b00101100, so its bytes are 0x81 and 0x2c](./images/02-compact-naturals.svg)

128's two bytes are both `0x80`, but only by coincidence. The first is the marker `0b10`
with 128's top bits after it, which are all zero. The second is 128's low 8 bits. 300 has
a top bit set, so its two bytes differ: `0x812c`.

**Bigger numbers.** Each extra byte brings 8 more bits for x but costs one more 1 at the
start of the first byte, so each length holds 7 bits more than the last:

| x is below | bytes | first byte | bits for x |
| --- | --- | --- | --- |
| 2^7 | 1 | `0b0xxxxxxx` | 7 |
| 2^14 | 2 | `0b10xxxxxx` | 6 + 8 = 14 |
| 2^21 | 3 | `0b110xxxxx` | 5 + 16 = 21 |
| ... | ... | ... | ... |
| 2^56 | 8 | `0b11111110` | 0 + 56 = 56 |
| 2^64 | 9 | `0b11111111` | 0 + 64 = 64 |

When two or more bytes follow, they're little-endian, lowest first, as in [lesson
2.1](./01-fixed-width-integers.md): 16,384 is `c0 00 40`. The last row breaks the
pattern: eight ones and no zero, then all of x in eight bytes. Watch each edge
[at the top](#try-it).

A decoder reads the first byte, counts its [*leading ones*](../glossary.md#leading-ones),
and knows exactly how many bytes to read.

> [!NOTE]
> If you know UTF-8, this is a cousin of its trick, but count with care. In UTF-8 the
> leading ones count the first byte too, so `0b110xxxxx` means two bytes in all. Here it
> means two *more*: three in all.

Each case of (C.5) is a row of that table:

- **x = 0** is the byte 0. It needs a line of its own because the middle case asks for x
  to be at least $2^{7l}$, and for l = 0 that's 1.
- **The middle case** is every row up to eight bytes, in three pieces:
  - $2^8 - 2^{8-l}$ is the marker: l ones, then zeros. For l = 1 it's 256 − 128 = 128,
    `0b10000000`; for l = 2 it's 256 − 64 = 192, `0b11000000`.
  - $\lfloor x / 2^{8l} \rfloor$ is x's top bits, added into the zeros after the marker.
  - $\mathcal{E}_l(x \bmod 2^{8l})$ is x's low l bytes, little-endian, from [lesson
    2.1](./01-fixed-width-integers.md).

  Its condition says there is some l from 0 to 7 with x at least $2^{7l}$ and below
  $2^{7(l+1)}$. Exactly one l fits each x: the number of bytes after the first.
- **Otherwise** is the nine-byte row: $2^8 - 1$ is 255, `0b11111111`, and then all of x
  in eight bytes.

## The tests

One value at each of a few lengths, including 2^64 − 70 from [lesson 1.2](../01-bytes-and-numbers/02-numbers.md):

**Add to** `test/numbers.test.ts`

```ts
import { toHex } from "../src/bytes.ts";
import { decodeNatural, encodeNatural } from "../src/codec/numbers.ts";

const NATURALS: [bigint, string][] = [
  [0n, "0x00"],
  [127n, "0x7f"],
  [128n, "0x8080"],
  [16384n, "0xc00040"],
  [2n ** 64n - 70n, "0xffbaffffffffffffff"],
];

test("ℰ, the compact natural, at different lengths", () => {
  for (const [x, hex] of NATURALS) {
    const encodedHex: string = toHex(encodeNatural(x));
    assert.equal(encodedHex, hex, `ℰ(${x})`);
    const decoded: { value: bigint; length: number } = decodeNatural(fromHex(hex));
    const expected: { value: bigint; length: number } = { value: x, length: (hex.length - 2) / 2 };
    assert.deepEqual(decoded, expected);
  }
});

test("decodeNatural can start in the middle of the bytes", () => {
  const decoded: { value: bigint; length: number } = decodeNatural(fromHex("0xaa8080"), 1);
  assert.deepEqual(decoded, { value: 128n, length: 2 });
});
```

Check 128 by hand. It's at least 2^7 and below 2^14, so l = 1. The first byte is
2^8 − 2^7 + ⌊128 / 2^8⌋ = 128 + 0 = `0x80`, then ℰ₁(128 mod 256) = `0x80`. Together:
`0x8080`. 300 the same way: 128 + ⌊300 / 256⌋ = 129 = `0x81`, then ℰ₁(300 mod 256) =
ℰ₁(44) = `0x2c`. Together: `0x812c`, the picture's bytes.

The test's two longer rows, the same way:

```text
c0 00 40                    16,384 = 2^14: past 14 bits, so l = 2 bytes follow
c0                            first byte: 2^8 − 2^6 = 192 = c0, plus ⌊16,384 / 2^16⌋ = 0
00 40                         ℰ₂(16,384): 16,384 is 0x4000, little end first
ff ba ff ff ff ff ff ff ff  2^64 − 70: at least 2^56, so the 9-byte form
ff                            first byte: 255, "eight full bytes follow"
ba ff ff ff ff ff ff ff       ℰ₈(x): x is 0xffffffffffffffba, little end first
```

The last test starts reading at offset 1 of `aa 80 80`: it skips `aa` and reads `80 80`,
128, two bytes long.

Stubs again, so the tests run and fail on the rule:

**Add to** `src/codec/numbers.ts`

```ts
/** ℰ(x): x below 2^64 in 1 to 9 bytes; the first byte says how many follow. */
export function encodeNatural(x: bigint): Bytes {
  return new Uint8Array(0);
}

/** The natural encoded at bytes[offset], and how many bytes it took. */
export function decodeNatural(bytes: Bytes, offset = 0): { value: bigint; length: number } {
  return { value: 0n, length: 0 };
}
```

**Run, expect it to fail**

```sh
npm test
```

```text
...
ℹ tests 11
ℹ suites 0
ℹ pass 9
ℹ fail 2
...
test at test/numbers.test.ts:31:1
✖ ℰ, the compact natural, at different lengths (0.6ms)
  AssertionError [ERR_ASSERTION]: ℰ(0)

  '0x' !== '0x00'
...
```

The first failure carries a label: `ℰ(0)`, the third argument to `assert.equal`. The test
checks five numbers in a loop, and the label says which one it was on. Here the very
first, 0: the stub gave no bytes at all.

## The code

A compact natural is a first byte glued to the rest, so first a little glue. The Gray
Paper writes joining byte strings as ⌢:

**Add to** `src/bytes.ts`

```ts
/** The parts one after another: the GP's ⌢. */
export function concatBytes(...parts: Bytes[]): Bytes {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}
```

**Replace in** `src/codec/numbers.ts`

```ts
import { concatBytes } from "../bytes.ts";

/** ℰ(x): x below 2^64 in 1 to 9 bytes; the first byte says how many follow. */
export function encodeNatural(x: bigint): Bytes {
  for (let l = 0; l < 8; l++) {
    if (x <= 1n << BigInt(7 * (l + 1))) {
      const top = Number(x >> BigInt(8 * l)); // ⌊x / 2^(8l)⌋
      const rest = x & ((1n << BigInt(8 * l)) - 1n); // x mod 2^(8l)
      return concatBytes(Uint8Array.of(256 - (256 >> l) + top), encodeFixed(rest, l));
    }
  }
  return concatBytes(Uint8Array.of(255), encodeFixed(x, 8));
}

/** The natural encoded at bytes[offset], and how many bytes it took. */
export function decodeNatural(bytes: Bytes, offset = 0): { value: bigint; length: number } {
  const first = bytes[offset];
  let l = 0;
  while (l < 8 && first & (0x80 >> l)) l++; // count the leading one-bits
  const rest = decodeFixed(bytes.subarray(offset + 1, offset + 1 + l));
  if (l === 8) return { value: rest, length: 9 };
  const top = BigInt(first & (0x7f >> l)); // the bits after the l ones and the zero
  return { value: (top << BigInt(8 * l)) | rest, length: l + 1 };
}
```

`encodeNatural` tries l = 0, 1, 2 and so on, and takes the first l where x fits below
2^(7(l+1)). (The smaller ones didn't fit, so x is at least 2^(7l): exactly the Gray
Paper's condition.) `256 - (256 >> l)` is 2^8 − 2^(8−l), the l leading ones. If nothing
up to l = 7 fits, x gets `0xff` and all eight bytes.

`decodeNatural` takes an `offset` because it will soon read from the middle of a block,
and returns the `length` so the caller knows where the next value starts.

**Run, expect it to fail**

```sh
npm test
```

```text
...
test at test/numbers.test.ts:31:1
✖ ℰ, the compact natural, at different lengths (0.8ms)
  AssertionError [ERR_ASSERTION]: ℰ(128)

  '0x80' !== '0x8080'
...
```

## Bug hunt

Red, with all the code in place: your third planted bug. This one hides at the edge of a
range. Your tools:

1. **The test output.** One test failed, *ℰ, the compact natural, at different lengths*,
   with `ℰ(128)` and `'0x80' !== '0x8080'`. The label tells you which of the five
   numbers broke. 0 and 127 passed (they come first, and the loop stops at the first
   failure).
2. **The dashboard.** *Tests failed* says 1, and *Test results* has the `FAIL` line, label
   and all.

   ![Failed tests panel](./images/02-failed-tests.png)
3. **The reasoning.** 128 is 2^7: the very first number too big for one byte. One byte
   holds 7 bits of x after its leading zero, so 0 to 127, and nothing more. Your code
   gave 128 one byte, `0x80`, whose first bit is a one: a decoder would expect another
   byte after it. So the code let 128 in at l = 0. Look at the condition: `x <= ...`,
   "at most 2^7". The Gray Paper says x < 2^(7(l+1)): *strictly* below.

`<=` where `<` was meant: an [*off-by-one*](../glossary.md#off-by-one), a bug that's wrong
by exactly one, right at a boundary. It's why the test list has 127 and 128 side by side.
The fix is one character:

**Replace in** `src/codec/numbers.ts`

```ts
/** ℰ(x): x below 2^64 in 1 to 9 bytes; the first byte says how many follow. */
export function encodeNatural(x: bigint): Bytes {
  for (let l = 0; l < 8; l++) {
    if (x < 1n << BigInt(7 * (l + 1))) {
      const top = Number(x >> BigInt(8 * l)); // ⌊x / 2^(8l)⌋
      const rest = x & ((1n << BigInt(8 * l)) - 1n); // x mod 2^(8l)
      return concatBytes(Uint8Array.of(256 - (256 >> l) + top), encodeFixed(rest, l));
    }
  }
  return concatBytes(Uint8Array.of(255), encodeFixed(x, 8));
}
```

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ ℰ, the compact natural, at different lengths (0.6ms)
✔ decodeNatural can start in the middle of the bytes (0.1ms)
...
ℹ tests 11
ℹ suites 0
ℹ pass 11
ℹ fail 0
...
reported 11 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791726350442
...
```

Green. When you write a test for a range, put a value on each side of every edge.

<details>
<summary>lasair: <code>decode_compact</code> (comments trimmed)</summary>

```ocaml
let decode_compact (bs : bytes) (offset : int) : int64 * int =
  let first = Char.code (Bytes.get bs offset) in
  if first = 0 then
    (0L, 1)
  else if first < 0x80 then
    (Int64.of_int first, 1)
  else if first = 0xFF then
    let v = decode_fixed_int bs (offset + 1) 8 in
    (v, 9)
  else
    let rec count_leading_ones byte count =
      if count >= 8 then count
      else if byte land (0x80 lsr count) <> 0 then count_leading_ones byte (count + 1)
      else count
    in
    let l = count_leading_ones first 0 in
    let total_len = l + 1 in
    let high_mask = (1 lsl (8 - l)) - 1 in
    let high_part = Int64.of_int (first land high_mask) in
    let low_part = decode_fixed_int bs (offset + 1) l in
    let shift = l * 8 in
    let value = Int64.logor (Int64.shift_left high_part shift) low_part in
    (value, total_len)
```

Same dance: count the leading ones, mask off the top bits, glue them above the rest. It
returns a pair, `(value, bytes_consumed)`, where yours returns an object.

</details>

## Check your understanding

::: check
**What problem does a compact natural solve?**

- [ ] A fixed width can't be decoded
  > No: fixed widths decode fine, as ℰ₄ does for slots. They waste bytes on small
  > numbers.
- [ ] A fixed width can't hold a number as big as 2^64 − 70
  > No: ℰ₈ holds it exactly. The trouble is the other end: eight bytes for the number 3.
- [x] Most lengths are small, so most should cost one byte, yet any size must still fit
  > Yes: every list carries its length in front. A list of three items costs one byte of
  > length, and a list of a million still has a way to say so.

**What does a compact natural's first byte tell a decoder before anything else?**

- [ ] The whole number, always
  > No: only numbers below 128 fit in the first byte. Bigger ones carry on into more bytes.
- [x] How many more bytes follow, from the one-bits at its start
  > Yes: the leading ones count the bytes after the first, so the decoder knows the
  > number's size before it reads the rest. No separate length is needed.
- [ ] Whether the number is negative
  > No: a natural is never negative. Nothing here is signed.

**Why is 127 one byte as a compact natural, but 128 two?**

- [x] One byte has 7 bits for the number, and 128 needs an eighth
  > Yes: a lone byte starts with the 0 that says "no more follow". The 7 bits left reach
  > 127 and no further.
- [ ] A byte holds 0 to 255, so 128 fits in one, and the second byte is padding
  > No: that is a byte that is only a byte. A compact natural's first byte gives its first
  > bit to the marker.
- [ ] 128 is negative as a signed byte, so it needs a second
  > No: nothing here is signed. The limit is the marker bit, not a sign bit.

**The byte `0xff` sits in a block. Is it the number 255, or "eight more bytes follow"?**

- [ ] 255: a byte's value never changes
  > No: in a hash or a fixed-width number it is 255. As a compact natural's first byte it
  > is a marker.
- [ ] "Eight more bytes follow": the top bit always marks a longer number
  > No: only a compact natural's first byte carries a marker. Every other byte uses all
  > eight bits.
- [x] Nothing in the byte says: the Gray Paper's types say what comes where
  > Yes: the decoder reads in the order the types give, and that order says whether this
  > byte starts a compact natural or is just a byte.

**The bug wrote 128 as the single byte `0x80`. What would a decoder make of it?**

- [ ] 128, since `0x80` is 128
  > No: as a compact natural's first byte, `0x80` isn't 128. Its first bit says another
  > byte follows.
- [x] One more byte follows, and it belongs to the number
  > Yes: `0b10000000` has one leading one, so the decoder takes the next byte as the
  > number's low bits, whatever it really is.
- [ ] Eight more bytes follow
  > No: that's `0xff`, eight leading ones. `0x80` has one.
:::

## What you have

ℰ both ways: any natural below 2^64 in one to nine bytes, its first byte saying how many
follow, read back from anywhere in a row of bytes. Two encodings now, and a JAM structure
mixes them, field after field. [Lesson 2.3](./03-writer-and-reader.md) builds the two
helpers that keep track of where you are in the bytes.

Next: [2.3 Writer and Reader](./03-writer-and-reader.md)
