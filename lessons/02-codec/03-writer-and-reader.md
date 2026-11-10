# Writer and Reader

A block header has ten fields. A work-report has eight, some of them lists of other
structures. Gluing byte arrays by hand and counting offsets would bury every structure in
bookkeeping. Two little helpers make it disappear:

- a **Writer**, which collects the pieces of an encoding as you write them;
- a **Reader**, which walks through bytes front to back, keeping its own place.

## New words

- **Class and method.** A blueprint for objects that keep their own data and come with their own
  functions, called *methods*. *Example:* `new Writer()` makes a writer, and `w.natural(5n)`
  calls one of its methods.
- **Private field.** A field whose name starts with `#`: only the class's own methods can
  touch it. *Example:* the Reader's `#at`.
- **Offset.** A position in a row of bytes, counted from 0. *Example:* in `c7 12 80 80`
  (4,807 in two bytes, then 128 in two), the 128 starts at offset 2.

All three are in the [glossary](../glossary.md).

## What the Gray Paper says

Appendix C encodes a structure by putting its parts' encodings one after another:

::: gray-paper C.1.1 5-8

#### Appendix C.1.1 Trivial Encodings, continued

<a id="gp-C-1-1-p5"></a>We define anonymous tuples to be encoded as the concatenation of their encoded elements:

<a id="gp-C-1-1-p6"></a><a id="eq-C-3"></a>

$$
\begin{equation}
\mathcal{E}_{}\left(\left(a, b, \dots\right)\right) \equiv \mathcal{E}_{}\left(a\right) \frown \mathcal{E}_{}\left(b\right) \frown \dots \tag{C.3}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-encode">[$\mathcal{E}\left(x\right)$](../symbols.md#encode)</span> | E of | the encoding of what's in the brackets: its bytes, by Appendix C's rules |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-concat" class="gk-wrap">[$\frown$](../symbols.md#concat)</span> | concatenate | join: the left sequence followed by the right |

</details>

→ [(C.3) in plain words](./gray-paper.md#ex-C-3)

<a id="gp-C-1-1-p7"></a>Passing multiple arguments to the <abbr class="gp-term" title="turning a value into bytes, so it can be hashed, signed or sent">serialization</abbr> functions is equivalent to passing a tuple of those arguments. Formally:

<a id="gp-C-1-1-p8"></a><a id="eq-C-4"></a>

$$
\begin{align}
\mathcal{E}_{}\left(a, b, \dots\right) &\equiv \mathcal{E}_{}\left(\left(a, b, \dots\right)\right) \tag{C.4}
\end{align}
$$

→ [(C.4) in plain words](./gray-paper.md#ex-C-4)

:::

In plain words: a tuple, a structure of a few parts, is its parts' encodings glued end to
end, with nothing between them. (C.4) only saves brackets: ℰ(a, b) means the same as
ℰ((a, b)). A Writer does exactly that gluing, and a Reader undoes it, in the same order.

## The test

**New file** `test/writer-reader.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { fromHex, toHex } from "../src/bytes.ts";
import { Reader } from "../src/codec/reader.ts";
import { Writer } from "../src/codec/writer.ts";
import type { Bytes } from "../src/bytes.ts";

test("a reader reads back what a writer wrote, in the same order", () => {
  const w: Writer = new Writer();
  w.fixed(4807n, 2);
  w.natural(128n);
  w.bytes(fromHex("0xdeadbeef"));
  const bytes: Bytes = w.finish();
  const written: string = toHex(bytes);
  assert.equal(written, "0xc7128080deadbeef");

  const r: Reader = new Reader(bytes);
  const fixed: bigint = r.fixed(2);
  assert.equal(fixed, 4807n);
  const natural: bigint = r.natural();
  assert.equal(natural, 128n);
  const tail: Bytes = r.bytes(4);
  assert.deepEqual(tail, fromHex("0xdeadbeef"));
});
```

Three values in, eight bytes out, three values back:

```text
c7 12         4,807 as ℰ₂: 2 bytes, little end first
80 80         128 as a compact natural: 2 bytes
de ad be ef   four bytes as they are: deadbeef, well, a classic
              2 + 2 + 4 = 8 bytes, one after another
```

The first is [lesson 2.1](./01-fixed-width-integers.md)'s ℰ₂, the second [lesson 2.2](./02-compact-naturals.md)'s compact natural.

## The Writer

**New file** `src/codec/writer.ts`

```ts
// Writer: collects the parts of an encoding, then glues them together.

import type { Bytes } from "../bytes.ts";
import { concatBytes } from "../bytes.ts";
import { encodeFixed, encodeNatural } from "./numbers.ts";

export class Writer {
  #parts: Bytes[] = [];

  /** Bytes as they are: in the GP a blob encodes to itself. */
  bytes(b: Bytes): void {
    this.#parts.push(b);
  }

  /** ℰ_l(x) */
  fixed(x: bigint, l: number): void {
    this.bytes(encodeFixed(x, l));
  }

  /** ℰ(x) */
  natural(x: bigint): void {
    this.bytes(encodeNatural(x));
  }

  /** Everything written so far, as one byte string. */
  finish(): Bytes {
    return concatBytes(...this.#parts);
  }
}
```

A Writer is a list of pieces, and `finish` glues them with [lesson 2.2](./02-compact-naturals.md)'s ⌢. Names
starting with `#` are private: only the class's own methods can touch them, and
JavaScript enforces it.

So where does `w.fixed(4807n, 2)` go? Nothing comes back from it: the two bytes go onto
the end of the Writer's own list. The test's three calls, then `finish`:

```text
w.fixed(4807n, 2)                 #parts: [c7 12]
w.natural(128n)                   #parts: [c7 12] [80 80]
w.bytes(fromHex("0xdeadbeef"))    #parts: [c7 12] [80 80] [de ad be ef]
w.finish()                        returns c7 12 80 80 de ad be ef
```

## The Reader

**New file** `src/codec/reader.ts`

```ts
// Reader: walks through the bytes of an encoding, front to back.

import type { Bytes } from "../bytes.ts";
import { decodeFixed, decodeNatural } from "./numbers.ts";

export class Reader {
  #bytes: Bytes;
  #at = 0; // where the next read starts

  constructor(bytes: Bytes) {
    this.#bytes = bytes;
  }

  /** The next n bytes. */
  bytes(n: number): Bytes {
    const out = this.#bytes.slice(this.#at, this.#at + n);
    this.#at += n;
    return out;
  }

  /** The inverse of ℰ_l. */
  fixed(l: number): bigint {
    return decodeFixed(this.bytes(l));
  }

  /** The inverse of ℰ. */
  natural(): bigint {
    const { value, length } = decodeNatural(this.#bytes, this.#at);
    this.#at += length;
    return value;
  }
}
```

The whole trick is `#at`:

```ts
  #at = 0; // where the next read starts
    const out = this.#bytes.slice(this.#at, this.#at + n);
    this.#at += n;
```

Every read starts at `#at` and moves it along, so nobody calling the Reader ever counts a
byte again. (`slice` hands back a copy, so what you read can't change under your feet if
someone reuses the input.)

Walk it. Read the eight bytes back in the Writer's order and the three values return.
Then reset and read a natural first: nothing in a byte says what it is, so the Reader
takes three bytes as 491,538, and every read after starts in the wrong place.

<ReaderWalk />

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ a reader reads back what a writer wrote, in the same order (1.5ms)
ℹ tests 12
ℹ suites 0
ℹ pass 12
ℹ fail 0
...
reported 12 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791726351783
...
```

<details>
<summary>lasair: offsets by hand</summary>

lasair's decoders take the input and an offset, and return the value along with the
number of bytes they used. The caller keeps the position in a mutable reference, `pos`,
and adds each size to it by hand, from `lib/serialization.ml`:

```ocaml
let (context, sz) = decode_refinement_context bs !pos in pos := !pos + sz;
```

`!pos` reads the reference and `pos := ...` writes it. Your Reader keeps that position
inside itself, so no caller can forget to add a size.

</details>

## Check your understanding

::: check
**You call `w.fixed(4807n, 2)`. Where does it go?**

- [ ] The Writer keeps the number 4,807 and encodes it when you call `finish`
  > No: the Writer never holds numbers. `fixed` encodes 4,807 straight away, with ℰ₂,
  > and keeps only the bytes it made.
- [x] It becomes the two bytes `c7 12`, added as the next piece on the Writer's list
  > Yes: the Writer is a list of pieces, each a few bytes. `c7 12` waits there, after
  > anything written before it, until `finish` glues every piece into one byte string.
- [ ] Its bytes are handed straight back to you, to glue on yourself
  > No: `fixed` gives nothing back. Keeping the pieces, in order, is the Writer's whole
  > job, so you never glue by hand.

**The Reader has just read 4,807 from `c7 12 80 80 de ad be ef`. Where does its next read start?**

- [ ] At offset 0: you tell the Reader where each value starts
  > No: you never pass a position. The Reader keeps its own, `#at`, and moves it after
  > every read.
- [ ] At offset 1: the Reader moves one place for each value it reads
  > No: it moves by the bytes it used. 4,807 as ℰ₂ took two bytes, so `#at` moved by 2.
- [x] At offset 2, the first `80`
  > Yes: `c7 12` sat at offsets 0 and 1, so the next value, 128 as `80 80`, starts at 2.

**What if the Reader read a compact natural first, instead of the ℰ₂?**

- [ ] It would notice `c7` isn't a compact natural and stop with an error
  > No: nothing in a byte says what it is ([lesson 2.2](./02-compact-naturals.md)).
  > Any byte can start a compact natural, so the Reader just reads one.
- [x] It would read a wrong number, and every value after it would start in the wrong place
  > Yes: `c7` is `0b11000111`, two leading ones, so it would take three bytes, `c7 12 80`,
  > as 491,538. The next read would then start at offset 3, halfway through the 128.
- [ ] It would still find 4,807, just a little more slowly
  > No: the same bytes read by a different rule give a different number. Only reading in
  > the order they were written gives back 4,807, 128 and the four bytes.

**`finish` gives back `c7 12 80 80 de ad be ef`, the three pieces with nothing between them. How does the Reader know where each one ends?**

- [x] Each value's rule says its size: ℰ₂ is always 2 bytes, a compact natural's first byte says how many follow, and the test asks for 4
  > Yes: the sizes come from the rules, not from the bytes, so nothing needs to sit
  > between the pieces. 2 + 2 + 4 = 8 bytes.
- [ ] `finish` drops the gaps it kept between the pieces
  > No: there were never any gaps. The pieces are `c7 12`, `80 80` and `de ad be ef`,
  > and `finish` puts them end to end.
- [ ] The Reader looks for the next value that makes sense
  > No: the Reader never guesses. It reads exactly the bytes each rule asks for, in the
  > order it is asked.
:::

## What you have

A Writer that collects an encoding piece by piece, and a Reader that walks back through
it, keeping its own place. Each value still needs its own two calls, one to write and
one to read, kept in step by hand. [Lesson 2.4](./04-codecs.md) pairs them up, so one
description of a value does both.

Next: [2.4 Codecs](./04-codecs.md)
