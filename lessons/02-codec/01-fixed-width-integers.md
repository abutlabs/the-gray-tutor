# Fixed-width integers

Time to turn numbers into bytes. JAM, like most of computing, writes them a little
backwards: the small end first.

This is a different job from [lesson 1.1](../01-bytes-and-numbers/01-bytes-and-hex.md)'s.
Hex only writes bytes you already have as text. Here you start with a number and work
out its bytes. Hex still appears, but only to show the bytes you made:

```text
4,807  ──encode (this lesson)──▶  bytes 199, 18  ──toHex (lesson 1.1)──▶  "0xc712"
```

## New words

- **Encode, decode.** Encoding turns a value into bytes; decoding turns the bytes back
  into the value. *Example:* 4,807 encodes as the two bytes `c7 12`.
- **Little-endian.** Least significant byte first: the small end of the number leads.
  *Example:* 4,807 is `0x12c7`, and it's written `c7 12`.
- **Fixed-width integer.** A number always written in the same number of bytes, however
  small it is. *Example:* a u32 is always four bytes, so 1 is `01 00 00 00`.
- **Recursive.** Defined in terms of a smaller case of itself, down to a case simple
  enough to answer straight away. *Example:* ℰ₂ is defined using ℰ₁, ℰ₁ using ℰ₀, and ℰ₀
  is just no bytes.

All four are in the [glossary](../glossary.md).

## Small end first

One byte only reaches 255, so a bigger number spreads over several, like digits: each
byte counts 256 times the one after it. Take any number too big for one byte, say 4,807:
4,807 = 18 × 256 + 199. 18 is `0x12` and 199 is
`0xc7`, so 4,807 is `0x12c7`: the bytes `12` and `c7`. JAM writes them the other way
round, `c7 12`: the low byte first. Like writing a date as day-month-year.

And the width never changes. A timeslot is a u32, so it takes four bytes in every block
header, even when it's 1: `01 00 00 00`.

## What the Gray Paper says

Appendix C, *Fixed-length Integer Encoding*, defines it one byte at a time:

::: gray-paper C.1.7

#### Appendix C.1.7 Fixed-length Integer Encoding {#gp-C-1-7}

<a id="gp-C-1-7-p1"></a>We first define the trivial natural number <abbr class="gp-term" title="turning a value into bytes, so it can be hashed, signed or sent">serialization</abbr> functions which are subscripted by the number of <abbr class="gp-term" title="bytes: 8 bits each">octets</abbr> of the final sequence. Values are encoded in a regular little-endian fashion. This is utilized for almost all integer encoding across the protocol. Formally:

<a id="gp-C-1-7-p2"></a><a id="eq-C-12"></a>

$$
\begin{equation}
\mathcal{E}_{l \in \mathbb{N}}\colon\left\{ \begin{aligned}
\mathbb{N}_{2^{8l}} &\to \mathbb{B}_{l} \\
x &\mapsto \begin{cases}
\left[\right] &\text{if } l = 0 \\
\left[x \bmod 256\right] \frown \mathcal{E}_{l - 1}\left(\left\lfloor\frac{x}{256}\right\rfloor\right) &\text{otherwise}
\end{cases}
\end{aligned} \right. \tag{C.12}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-fnencode">[$\mathcal{E}$](../symbols.md#encode)</span> | E | the codec: a value in, its bytes out; a number alone, as a compact natural of 1 to 9 bytes |
| <span id="gk-in">[$\in$](../symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-N" class="gk-wrap">[$\mathbb{N}$](../symbols.md#naturals)</span> | N | the whole numbers: 0, 1, 2 and up; a subscript is a bound, ℕ₈ is 0 to 7 |
| <span id="gk-abracegroup">$\left\{ \begin{aligned}x\end{aligned} \right.$</span> | as follows | a brace grouping lines that hold together: for a function, its type on top, then what each input becomes |
| <span id="gk-Nbits">[$\mathbb{N}_{2^{x}}$](../symbols.md#naturals)</span> | N sub two to the n | the numbers that fit in n bits: ℕ_{2³²} is a u32 |
| <span id="gk-to">[$\to$](../symbols.md#to)</span> | to | what goes in, to what comes out: A → B takes an A and gives a B |
| <span id="gk-blob">[$\mathbb{B}$](../symbols.md#blobs)</span> | B, or B sub n | bytes: any run of them; 𝔹ₙ exactly n of them |
| <span id="gk-mapsto">$\mapsto$</span> | maps to | what a function gives back for an input: x ↦ y says x becomes y |
| <span id="gk-sq">[$\left[x\right]$](../symbols.md#sequence)</span> | the sequence | a sequence written out item by item; [ ] is the empty one |
| <span id="gk-bmod">[$\bmod$](../symbols.md#mod)</span> | mod | the remainder after dividing: 14 mod 4 is 2 |
| <span id="gk-concat" class="gk-wrap">[$\frown$](../symbols.md#concat)</span> | concatenate | join: the left sequence followed by the right |
| <span id="gk-encode">[$\mathcal{E}\left(x\right)$](../symbols.md#encode)</span> | E of | the encoding of what's in the brackets: its bytes, by Appendix C's rules |
| <span id="gk-floor">[$\left\lfloor x\right\rfloor$](../symbols.md#floor)</span> | floor of | rounded down to a whole number |
| <span id="gk-frac">$\frac$</span> | over | a fraction: the top divided by the bottom |

</details>

→ [(C.12) in plain words](./gray-paper.md#ex-C-12)

<a id="gp-C-1-7-p3"></a>For non-natural arguments, $\mathcal{E}_{l \in \mathbb{N}}$ corresponds to the definitions of $\mathcal{E}_{}$, except that recursive elements are made as $\mathcal{E}_{l}$ rather than $\mathcal{E}_{}$. Thus:

<a id="gp-C-1-7-p4"></a><a id="eq-C-13"></a><a id="eq-C-14"></a><a id="eq-C-15"></a>

$$
\begin{align}
\mathcal{E}_{l \in \mathbb{N}}\left(a, b, \dots\right) &\equiv \mathcal{E}_{l}\left(\left(a, b, \dots\right)\right) \tag{C.13} \\
\mathcal{E}_{l \in \mathbb{N}}\left(\left(a, b, \dots\right)\right) &\equiv \mathcal{E}_{l}\left(a\right) \frown \mathcal{E}_{l}\left(b\right) \frown \dots \tag{C.14} \\
\mathcal{E}_{l \in \mathbb{N}}\left(\left[\mathbf{i}_0, \mathbf{i}_1, \dots\right]\right) &\equiv \mathcal{E}_{l}\left(\mathbf{i}_0\right) \frown \mathcal{E}_{l}\left(\mathbf{i}_1\right) \frown \dots \tag{C.15}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |

</details>

→ [(C.13), (C.14), (C.15) in plain words](./gray-paper.md#ex-C-13)

<a id="gp-C-1-7-p5"></a>And so on.

:::

In plain words, (C.12)'s first line is a promise: give ℰₗ a number that fits in l bytes,
and you get back exactly l bytes. The second says how, like a recipe: write down the
lowest byte, chop it off, and repeat with one byte fewer, until no bytes are left. ℰ₄ is
a u32, ℰ₈ a u64. (C.13) to (C.15) only stretch the same ℰₗ over several numbers at once:
ℰ₄(a, b) is ℰ₄(a) then ℰ₄(b), four bytes each, side by side.

ℰₗ is defined using $\mathcal{E}_{l-1}$, a smaller case of itself: it's *recursive*. Work
it through for 4,807 in two bytes, and each step hands one byte fewer to the next, until
l reaches 0 and the recipe stops:

$$
\begin{aligned}
\mathcal{E}_2(4807) &= [4807 \bmod 256] \frown \mathcal{E}_1(\lfloor 4807 / 256 \rfloor) \\
&= [199] \frown \mathcal{E}_1(18) \\
&= [199] \frown [18 \bmod 256] \frown \mathcal{E}_0(\lfloor 18 / 256 \rfloor) \\
&= [199] \frown [18] \frown [\,] \\
&= [199, 18]
\end{aligned}
$$

| Symbol | Say it | Here |
| --- | --- | --- |
| [$\mathcal{E}_l$](../symbols.md#encode-fixed) | E sub l | x in exactly l bytes |
| [$\bmod$](../symbols.md#mod) | mod | the remainder: x mod 256 is x's lowest byte |
| [$\frown$](../symbols.md#concat) | concatenate | followed by |
| [$\lfloor\,\rfloor$](../symbols.md#floor) | floor | round down: ⌊x / 256⌋ is x without its lowest byte |
| [$[\,]$](../symbols.md#sequence) | the empty sequence | no bytes at all |

199 is `c7` and 18 is `12`: `c7 12`.

Run the recipe on any number. Type x and pick l: each step writes x mod 256 and passes
⌊x / 256⌋ on. The two rows are the same bytes, as the number reads (biggest first) and as
JAM writes them (smallest first):

<FixedWidth />

## The code

One function for every width, working on `bigint` so that ℰ₈ is exact ([lesson 1.2](../01-bytes-and-numbers/02-numbers.md)'s
rule). [Lesson 2.4](./04-codecs.md) converts to `number` for the smaller widths.

**New file** `test/numbers.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { fromHex } from "../src/bytes.ts";
import { decodeFixed, encodeFixed } from "../src/codec/numbers.ts";
import type { Bytes } from "../src/bytes.ts";

test("ℰ_l writes the least significant byte first", () => {
  const twoBytes: Bytes = encodeFixed(4807n, 2);
  assert.deepEqual(twoBytes, fromHex("0xc712"));
  const fourBytes: Bytes = encodeFixed(1n, 4);
  assert.deepEqual(fourBytes, fromHex("0x01000000"));
});

test("decoding reads the bytes back", () => {
  const decoded: bigint = decodeFixed(fromHex("0xc712"));
  assert.equal(decoded, 4807n);
  const big: bigint = 2n ** 64n - 70n;
  const encoded: Bytes = encodeFixed(big, 8);
  const back: bigint = decodeFixed(encoded);
  assert.equal(back, big);
});
```

A stub to make the tests run, wrong on purpose: every number comes out as zeros.

**New file** `src/codec/numbers.ts`

```ts
// The Gray Paper's integer encodings (Appendix C).

import type { Bytes } from "../bytes.ts";

/** ℰ_l(x): x in exactly l bytes, least significant first. */
export function encodeFixed(x: bigint, l: number): Bytes {
  return new Uint8Array(l);
}

/** The inverse of ℰ_l: the bytes as an unsigned little-endian integer. */
export function decodeFixed(bytes: Bytes): bigint {
  return 0n;
}
```

**Run, expect it to fail**

```sh
npm test
```

```text
...
ℹ tests 9
ℹ suites 0
ℹ pass 7
ℹ fail 2
...
test at test/numbers.test.ts:7:1
✖ ℰ_l writes the least significant byte first (1.2ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
  + actual - expected

    Uint8Array(2) [
  +   0,
  +   0
  -   199,
  -   18
    ]

      at TestContext.<anonymous> (…/client/test/numbers.test.ts:9:10)
...
```

Comparing two byte arrays, `assert.deepEqual` shows a diff: lines with `+` are what your
code gave (*actual*), lines with `-` what the test expected. Your stub wrote 0 and 0; the
test wanted 199 and 18, which are `c7` and `12`: 4807, least significant byte first.

**Replace in** `src/codec/numbers.ts`

```ts
/** ℰ_l(x): x in exactly l bytes, least significant first. */
export function encodeFixed(x: bigint, l: number): Bytes {
  const bytes = new Uint8Array(l);
  let rest = x;
  for (let i = 0; i < l; i++) {
    bytes[i] = Number(rest & 0xffn); // x mod 256
    rest >>= 8n; // ⌊x / 256⌋
  }
  return bytes;
}

/** The inverse of ℰ_l: the bytes as an unsigned little-endian integer. */
export function decodeFixed(bytes: Bytes): bigint {
  let x = 0n;
  for (let i = bytes.length - 1; i >= 0; i--) x = (x << 8n) | BigInt(bytes[i]);
  return x;
}
```

The Gray Paper's recursion, unrolled into a loop: `rest & 0xffn` is `x mod 256` (the low
byte), and `rest >>= 8n` is `⌊x / 256⌋` (chop it off). Decoding runs the other way: start
at the last, most significant byte and shift each one in.

The promise is yours to keep. Give `encodeFixed` a number too big for its bytes and
nothing complains: `encodeFixed(70000n, 2)` keeps the two lowest bytes, `70 11`, which
read back as 4,464. The rest of 70,000 is simply gone.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ ℰ_l writes the least significant byte first (2.9ms)
✔ decoding reads the bytes back (0.8ms)
...
ℹ tests 9
ℹ suites 0
ℹ pass 9
ℹ fail 0
...
reported 9 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791726348334
...
```

Your client can now write numbers the way JAM does. Nine tests and counting.

<details>
<summary>lasair: <code>encode_fixed_int</code></summary>

```ocaml
(** Encode unsigned integer as l bytes, little-endian *)
let encode_fixed_int (n : int) (value : int64) : bytes =
  let result = Bytes.create n in
  let rec fill i v =
    if i < n then begin
      Bytes.set result i (Char.chr (Int64.to_int (Int64.logand v 0xFFL)));
      fill (i + 1) (Int64.shift_right_logical v 8)
    end
  in
  fill 0 value;
  result
```

The same algorithm. `let rec fill` is a recursive helper instead of a loop (OCaml
prefers recursion), `Int64.logand v 0xFFL` is `v & 0xff`, and `shift_right_logical`
is `>>>` on a `number`, the shift that treats the value as unsigned. (A `bigint` has no
`>>>`; your values are never negative, so `>>` does the same job.)

</details>

## Check your understanding

::: check
**Why does 4,807 take two bytes?**

- [ ] It has four digits, and a byte holds two
  > No: bytes count in 256s, not in decimal digits. 255 has three digits and fits in one
  > byte; 256 has three too, and needs two.
- [x] One byte only reaches 255, and 4,807 = 18 × 256 + 199
  > Yes: like digits, each byte counts 256 times the one after it. 4,807 is 18 times 256,
  > plus 199 left over: two bytes, 18 and 199.
- [ ] Every number in JAM takes two bytes
  > No: the width depends on the type. A timeslot is a u32, and takes four bytes even
  > when it's 1.

**How does ℰ₂ write 4,807?**

- [ ] `12 c7`
  > No: that's the number as you'd read it, biggest byte first, `0x12c7`. JAM writes the
  > low byte first.
- [ ] `c7 12 00 00`
  > No: that's ℰ₄, four bytes. ℰ₂ is exactly two.
- [x] `c7 12`
  > Yes: 199 is `c7` and 18 is `12`, and the low byte, 199, comes first.

**ℰ₂(4807) first writes 4807 mod 256, which is 199. What does it hand on to ℰ₁?**

- [x] 18: ⌊4807 / 256⌋, 4,807 with its lowest byte chopped off
  > Yes: ℰ₁(18) writes `12`, then ℰ₀ ends it with no bytes. Each step hands on one byte
  > fewer.
- [ ] 4,608: 4,807 minus the 199 just written
  > No: taking away 199 leaves 4,608, which is 18 × 256, still counted in 256s. Dividing
  > by 256 is what turns it into 18, the next byte.
- [ ] 199 again, for the second byte
  > No: 199 is already written. Each step hands on what's left of the number, one byte
  > smaller.

**A timeslot is a u32. How is slot 1 written in a block header?**

- [ ] `01`
  > No: a fixed width never shrinks. A u32 takes four bytes, even for 1.
- [x] `01 00 00 00`
  > Yes: ℰ₄(1). The low byte, 1, comes first, then three zero bytes.
- [ ] `00 00 00 01`
  > No: that's biggest byte first. JAM writes the small end first.
:::

## What you have

ℰ_l both ways: any whole number in exactly l bytes, least significant first, and back,
exact up to 64 bits. A fixed width spends all l bytes even on a tiny number, though.
[Lesson 2.2](./02-compact-naturals.md) adds JAM's other way to write a number: one byte
when it's small, more only when it must.

Next: [2.2 Compact naturals](./02-compact-naturals.md)
