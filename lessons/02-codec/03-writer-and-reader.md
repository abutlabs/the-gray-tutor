# Writer and Reader

**In one sentence:** a Writer collects the pieces of an encoding in the order you write
them, and a Reader walks back through the bytes in the same order, keeping its own place.

Walk it. Read the eight bytes back in the order they were written and three values
return. Then reset and read them in another order.

<a id="try-it"></a>

<ReaderWalk />

## The idea

A block header has ten fields. A work-report has eight, some of them lists of other
structures. How do you put that many values into one row of bytes, and get them out
again, without counting positions by hand?

Writing is the easy half. Encode each value, keep the pieces in order, and glue them end
to end when you are done. Nothing goes between them. That is the Writer.

Reading is where the counting was. The Reader keeps a finger on the bytes, like a finger
under a line of text. Each read starts at the finger and moves it past what it read. You
ask for the next value, never for a position.

One thing the Reader cannot do is check you. Nothing in a byte says what it is. Ask for
the values in the order they were written and they come back. Ask in another order and
you get wrong numbers, with no error.

This lesson builds both helpers. Every structure after it is made of them.

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

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-encode">[$\mathcal{E}\left(x\right)$](../symbols.md#encode)</span> | E of | the encoding of what's in the brackets: its bytes, by Appendix C's rules |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-concat" class="gk-wrap">[$\frown$](../symbols.md#concat)</span> | concatenate | join: the left sequence followed by the right |

</details>

→ [(C.3) explained](./gray-paper.md#ex-C-3)

<a id="gp-C-1-1-p7"></a>Passing multiple arguments to the <abbr class="gp-term" title="turning a value into bytes, so it can be hashed, signed or sent">serialization</abbr> functions is equivalent to passing a tuple of those arguments. Formally:

<a id="gp-C-1-1-p8"></a><a id="eq-C-4"></a>

$$
\begin{align}
\mathcal{E}_{}\left(a, b, \dots\right) &\equiv \mathcal{E}_{}\left(\left(a, b, \dots\right)\right) \tag{C.4}
\end{align}
$$

→ [(C.4) explained](./gray-paper.md#ex-C-4)

:::

A tuple, a structure of a few parts, is its parts' encodings glued end to end, with
nothing between them. (C.4) only saves brackets: ℰ(a, b) means the same as ℰ((a, b)). A
Writer does that gluing, and a Reader undoes it, in the same order.

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

A Writer is a [*class*](../glossary.md#class): a blueprint for objects that keep their own
data. Its functions are its [*methods*](../glossary.md#method).

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

A Writer is a list of pieces, and `finish` glues them with [lesson 2.2](./02-compact-naturals.md)'s ⌢. A name
starting with `#` is a [*private field*](../glossary.md#private-field): only the class's
own methods can touch it, and JavaScript enforces it.

Nothing comes back from `w.fixed(4807n, 2)`: the two bytes go onto the end of the
Writer's own list. The test's three calls, then `finish`:

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

The whole trick is `#at`, the Reader's [*offset*](../glossary.md#offset): its position in
the row of bytes, counted from 0.

```ts
  #at = 0; // where the next read starts
    const out = this.#bytes.slice(this.#at, this.#at + n);
    this.#at += n;
```

Every read starts at `#at` and moves it along, so nobody calling the Reader ever counts a
byte again. (`slice` hands back a copy, so what you read can't change under your feet if
someone reuses the input.)

Try it on the eight bytes [at the top](#try-it). In the Writer's order, the three values
return. Read a natural first and the Reader takes three bytes, `c7 12 80`, as 491,538.
The next read would then start at offset 3, halfway through the 128.

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
**What does a Writer hold between your first call and `finish`?**

- [ ] The values you gave it, to encode all at once at the end
  > No: the Writer never holds values. Each call encodes straight away and keeps only the
  > bytes it made.
- [x] A list of pieces, each already bytes, in the order you wrote them
  > Yes: each call adds its bytes to the end of the list, and `finish` glues every piece
  > into one byte string.
- [ ] Nothing: each call hands its bytes back to you to glue on yourself
  > No: the calls give nothing back. Keeping the pieces, in order, is the Writer's whole
  > job.

**Why does a Reader keep its own position, when a caller could pass one in?**

- [x] So no caller can forget to move it: every read moves it by the bytes it used
  > Yes: the position lives in one private place, and only the Reader's own methods touch
  > it. Nobody calling the Reader counts a byte.
- [ ] A position can't be passed to a function
  > No: it can, and `decodeNatural` takes one. The caller then has to add each size by
  > hand, every time.
- [ ] So it can jump back and read a value twice
  > No: the Reader only walks forward, front to back.

**The pieces are glued with nothing between them. How does the Reader know where each one ends?**

- [ ] `finish` leaves a marker after each piece
  > No: there are no markers and no gaps. The pieces sit end to end.
- [ ] The Reader looks for the next value that makes sense
  > No: the Reader never guesses. It reads exactly the bytes each rule asks for, in the
  > order it is asked.
- [x] Each value's rule says its size: a fixed width is always its width, and a compact natural's first byte says how many follow
  > Yes: the sizes come from the rules, not from separators, so nothing needs to sit
  > between the pieces.

**What happens if the Reader is asked for the values in a different order from the one they were written in?**

- [ ] It notices the bytes don't fit and stops with an error
  > No: nothing in a byte says what it is ([lesson 2.2](./02-compact-naturals.md)). Any
  > byte can start a compact natural, so the Reader reads one.
- [x] It returns a wrong value, and every read after it starts in the wrong place
  > Yes: the same bytes read by a different rule give a different number and use a
  > different count of bytes. Only the writer's order gives the values back.
- [ ] It still finds the right values, a little more slowly
  > No: the Reader does not search. It reads what it is asked for, where it stands.
:::

## What you have

A Writer that collects an encoding piece by piece, and a Reader that walks back through
it, keeping its own place. Each value still needs its own two calls, one to write and
one to read, kept in step by hand. [Lesson 2.4](./04-codecs.md) pairs them up, so one
description of a value does both.

Next: [2.4 Codecs](./04-codecs.md)
