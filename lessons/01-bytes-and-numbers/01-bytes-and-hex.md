# Bytes and hex

Before JAM can be clever, it has to be bytes. Hashes, keys, blocks, whole states: all
bytes in the end. This lesson gives your client a word for bytes and a way to read and
write them the way the test vectors do. It also hands you your second bug to catch.

## New words

- **Byte.** Eight bits: a whole number from 0 to 255. The Gray Paper says *octet*.
  *Example:* 255 is the biggest byte there is.
- **Hex.** Writing bytes as text, two digits per byte, with the digits 0-9 and a-f.
  *Example:* the bytes 1, 2 and 255 are `0x0102ff`.
- **`Uint8Array`.** JavaScript's row of bytes. *Example:* `Uint8Array.of(1, 2, 255)`.
- **Type alias.** A second name for a type you already have. *Example:*
  `type Bytes = Uint8Array`.
- **Stack trace.** When a program crashes, the list of function calls it was in the
  middle of, innermost first. *Example:* `at fromHex (src/bytes.ts:13:21)`.

All five are in the [glossary](../glossary.md).

## Bytes in TypeScript

A `Uint8Array`: a row of numbers from 0 to 255, stored as raw bytes. (A plain `number[]`
would take eight times the memory and happily hold 300 or −1.5. Node's `Buffer` is a
`Uint8Array` with a few surprises, and only exists in Node. `Uint8Array` it is.)

## Hex

The test vectors write bytes as text: `0x`, then two hex digits per byte. The bytes 1, 2
and 255 become `"0x0102ff"`. Node 26 speaks hex already: `bytes.toHex()` gives
`"0102ff"`, and `Uint8Array.fromHex("0102ff")` gives the bytes back. Your client's job is
the `0x`.

Why two digits per byte? A byte's eight bits are worth 128, 64, 32, 16, 8, 4, 2 and 1, left
to right: each is worth twice the one on its right, as each decimal digit is worth ten
times the next. The byte is the sum of the places holding a 1. Hex cuts the eight bits
into two halves of four. Four bits make 0 to 15 (8 + 4 + 2 + 1 = 15), more than decimal
has digits for, so hex counts 0 to 9 and then a to f for 10 to 15. Each half is one hex
digit, and the first counts 16 times the second: `2c` is 16 × 2 + 12 = 44, and `ff` is
16 × 15 + 15 = 255, the biggest byte. Click the bits to try it:

<HexByte />

## More than one byte

One byte stops at 255. A bigger number takes more bytes side by side, and each byte counts
256 times the one on its right, as each bit counts twice the one on its right. 300 needs 9
bits, `0b100101100`, one too many for a byte. So it takes two: `01` and `2c`, and 1 × 256 +
44 = 300. In hex that's `0x012c`. Still two digits per byte, so 2 bytes are 4 digits and 4
bytes are 8.

Bits, bytes and decimal digits are easy to mix up, because 0 and 1 are digits in all three.
`10` could be ten, the byte `0x10` (16), or the bits `0b10` (2). So this tutorial writes each
the way JavaScript does: bits start `0b`, hex starts `0x`, and plain digits are decimal. A row
of bytes is hex pairs with a space between, like `10 00 00 00`: the four bytes 16, 0, 0 and
0. (That row is also how JAM writes the number 16 when it gives it four bytes, smallest byte
first: [lesson 2.1](../02-codec/01-fixed-width-integers.md).) On the website, bits are copper
and bytes are teal, in the text and in every widget.

Pick a size in bits or bytes, flip bits, or type a number:

<BitsAndBytes />

## What the Gray Paper says

Section 3 (*Notational Conventions*) names the building blocks. Two you'll meet on nearly
every page:

- **𝔹**, octet strings of any length, which the paper calls *blobs*. 𝔹ₙ are the ones of
  exactly n bytes, a fixed length.
- **ℍ = 𝔹₃₂**, 32-byte values. Every hash in JAM is one.

It also draws a firm line: *"an octet is always serialized to itself, whereas a natural
number may be serialized as a sequence of potentially several octets"*. Written out, the
byte 5 is always the one byte `05`, while the number 5 may take one byte or several ([Part
2](../02-codec/index.md)). Your client keeps byte strings, `Bytes`, apart from numbers from the start.

## The tests

Test-driven development, as always: the test first.

**New file** `test/bytes.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { fromHex, toHex } from "../src/bytes.ts";
import type { Bytes } from "../src/bytes.ts";

test("hex there and back", () => {
  const bytes: Bytes = Uint8Array.of(1, 2, 255);
  const hex: string = toHex(bytes);
  assert.equal(hex, "0x0102ff");
  const back: Bytes = fromHex("0x0102ff");
  assert.deepEqual(back, bytes);
});

test("no bytes at all is just 0x", () => {
  const empty: Bytes = new Uint8Array(0);
  const hex: string = toHex(empty);
  assert.equal(hex, "0x");
  const back: Bytes = fromHex("0x");
  assert.deepEqual(back, empty);
});
```

`assert.deepEqual` compares two arrays byte by byte. (Plain `===` would only ask whether
they are the very same object, which two separate arrays never are.)

As in [lesson 0.4](../00-start/04-the-jam-clock.md), give the test the smallest file that
runs, with answers that are wrong on purpose:

**New file** `src/bytes.ts`

```ts
// Bytes: the Gray Paper's octet strings (GP §3).

/** An octet string: the GP's 𝔹, and fixed-length kinds of it such as ℍ (32 bytes). */
export type Bytes = Uint8Array;

/** The bytes as the test vectors write them: "0x", then two hex digits per byte. */
export function toHex(bytes: Bytes): string {
  return "";
}

/** The bytes back from "0x" hex. */
export function fromHex(hex: string): Bytes {
  return new Uint8Array(0);
}
```

`type Bytes = Uint8Array` is a *type alias*. It checks nothing extra, but from now on
every function that takes bytes says so out loud.

**Run, expect it to fail**

```sh
npm test
```

```text
...
✖ hex there and back (0.9ms)
✖ no bytes at all is just 0x (0.1ms)
✔ slot 0 is the first six seconds of the JAM Common Era (1.3ms)
✔ an hour is 600 slots (0.1ms)
ℹ tests 4
ℹ suites 0
ℹ pass 2
ℹ fail 2
...
test at test/bytes.test.ts:6:1
✖ hex there and back (0.9ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:

  '' !== '0x0102ff'

...
```

Red, and both tests caught the stub. The first says `'' !== '0x0102ff'`: the empty text
the stub gave, against the hex the test wanted. The second, further down, says `'' !==
'0x'`. (Text comes in quotes, so an empty answer still shows.)

## The code

**Replace in** `src/bytes.ts`

```ts
/** The bytes as the test vectors write them: "0x", then two hex digits per byte. */
export function toHex(bytes: Bytes): string {
  return "0x" + bytes.toHex();
}

/** The bytes back from "0x" hex. */
export function fromHex(hex: string): Bytes {
  return Uint8Array.fromHex(hex);
}
```

Node does the hex, your client does the `0x`.

**Run, expect it to fail**

```sh
npm test
```

```text
...
test at test/bytes.test.ts:6:1
✖ hex there and back (0.5ms)
  SyntaxError [Error]: Input string must contain hex characters in even length
      at Uint8Array.fromHex (<anonymous>)
      at fromHex (…/client/src/bytes.ts:13:21)
      at TestContext.<anonymous> (…/client/test/bytes.test.ts:10:23)
...
```

## Bug hunt

Red again, with the file right there. (On purpose: your second planted bug, after 0.4's.)
Last time the code gave a wrong answer. This time it crashes, and a crash leaves a trail.

1. **The test output.** Both tests failed, with the same message: `SyntaxError: Input
   string must contain hex characters in even length`. Under it is a *stack trace*. Skip
   the lines inside Node and find the first one in your own code: `at fromHex
   (…/client/src/bytes.ts:13:21)`. That's line 13, the inside of `fromHex`. The line below
   it, in `test/bytes.test.ts`, is the test that called it.
2. **The dashboard.** *Tests failed* says 2, and *Failed tests* has two `FAIL` lines with
   the same message. Two tests, one cause: both call `fromHex`. And `toHex` is fine: its
   assertions come first, and they passed.

   ![Failed tests panel](./images/01-failed-tests.png)
3. **The reasoning.** The message is odd: `"0x0102ff"` has eight characters, and eight is
   even. An error message is a clue, not a verdict: Node gives this one for any text it
   can't read as hex. So what can't it read? The `x`. `toHex` puts `0x` on the front, so
   `fromHex` has to take it off before Node sees the rest.
4. **The debugger.** See it for yourself, as in [lesson 0.4](../00-start/04-the-jam-clock.md): a breakpoint on line 13
   of `src/bytes.ts`, then *Tests: all (npm test)* in *Run and Debug*, and <kbd>F5</kbd>.
   In *Variables*, `hex` is the whole `0x0102ff`, `0x` and all, about to go to Node.

The fix:

**Replace in** `src/bytes.ts`

```ts
/** The bytes back from "0x" hex. */
export function fromHex(hex: string): Bytes {
  return Uint8Array.fromHex(hex.slice(2)); // slice(2) skips the "0x"
}
```

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ hex there and back (1.1ms)
✔ no bytes at all is just 0x (0.1ms)
✔ slot 0 is the first six seconds of the JAM Common Era (1.4ms)
✔ an hour is 600 slots (0.1ms)
ℹ tests 4
ℹ suites 0
ℹ pass 4
ℹ fail 0
...
reported 4 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791726098816
...
```

Green. Four tests on the dashboard now. Keep the trick from step 1: when something
crashes, find the first line of the stack trace that's yours.

<details>
<summary>lasair: hex by hand, in <code>lib/serialization.ml</code></summary>

OCaml's standard library has no bytes-to-hex function, so lasair does it one *nibble*
(half a byte) at a time:

```ocaml
(** Convert bytes to hex string for debugging *)
let bytes_to_hex (bs : bytes) : string =
  let hex = Bytes.create (Bytes.length bs * 2) in
  for i = 0 to Bytes.length bs - 1 do
    let b = Char.code (Bytes.get bs i) in
    let hi = b lsr 4 in
    let lo = b land 0xF in
    Bytes.set hex (i * 2) (if hi < 10 then Char.chr (hi + 48) else Char.chr (hi + 87));
    Bytes.set hex (i * 2 + 1) (if lo < 10 then Char.chr (lo + 48) else Char.chr (lo + 87))
  done;
  Bytes.to_string hex
```

`b lsr 4` is the top four bits, `b land 0xF` the bottom four. Then a little ASCII magic:
48 is the character `0`, and adding 87 turns 10 into `a`. This is what `toHex` does for
you, inside Node.

</details>

## Check your understanding

::: check
**Why do test vectors write bytes in hex, two characters each, instead of in decimal?**

- [x] Each hex digit is exactly four bits, so every byte is always two characters and a long run of bytes lines up
  > Yes: a byte's two halves are its two digits. In decimal a byte takes one to three
  > digits, and you can't see where one byte ends and the next begins.
- [ ] Hex numbers are smaller than decimal ones
  > No: `0x80` and 128 are the same number. Hex only writes it differently.
- [ ] JSON can't hold numbers above 255
  > No: JSON holds much bigger numbers. The vectors use hex strings so bytes stay bytes.

**How does a test vector write the bytes 1, 2 and 255?**

- [x] `0x0102ff`
  > Yes: two hex digits per byte, always. 1 is `01`, 2 is `02`, and 255 is `ff`.
- [ ] `0x12ff`
  > No: drop the zeros and the bytes run together. `0x12ff` is two bytes, `12` and `ff`:
  > 18 and 255.
- [ ] `0x12255`
  > No: that writes 255 in decimal. In hex it's `ff`, 16 × 15 + 15, and every byte takes
  > exactly two digits.

**What does `0x` on its own mean?**

- [ ] One byte, zero
  > No: the byte zero is `0x00`. The `0x` only says "hex follows".
- [x] No bytes at all
  > Yes: the second test checks it. An empty `Uint8Array` is `"0x"`, and `"0x"` reads back
  > as no bytes. The `0x` is a marker, not a byte.
- [ ] Nothing: it isn't valid hex
  > No: it's exactly what `toHex` writes for an empty row of bytes, and `fromHex` reads it
  > back.

**`fromHex("0x0102ff")` crashed with `hex characters in even length`. The text has eight characters. What was wrong?**

- [ ] `toHex` wrote the wrong hex
  > No: the test checks `toHex` first, and those assertions passed. The crash came later,
  > in `fromHex`.
- [ ] The text really had an odd number of hex digits
  > No: `0102ff` is six digits, three bytes. Node gives this message for any text it can't
  > read as hex.
- [x] Node was handed the `0x` too, and `x` isn't a hex digit
  > Yes: `toHex` puts `0x` on the front, so `fromHex` has to take it off, with
  > `hex.slice(2)`, before Node reads the rest.
:::

## What you have

A word for bytes, `Bytes`, and the two functions that turn them into the test vectors'
hex and back, tested both ways. Bytes are half of what JAM is made of; the other half is
numbers, and JavaScript has a trap waiting there. [Lesson 1.2](./02-numbers.md) shows it.

Next: [1.2 Numbers](./02-numbers.md)
