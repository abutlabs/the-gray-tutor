# Numbers

**In one sentence:** a JavaScript number rounds big whole numbers without a word, so your
client keeps JAM's 64-bit values in a second kind of number that never rounds.

Start at 2^64 − 70, a real gas amount, and nudge it. As a `number` it prints as 2^64 and
stays there, while the `bigint` moves by exactly what you asked. Below 2^53 − 1 the two
agree on every digit.

<a id="try-it"></a>

<NumberKinds />

## The idea

Every JAM program runs on a budget of [*gas*](../glossary.md#gas), JAM's measure of
computing work: each step it takes is paid for from that budget. A gas amount can be
huge: 2^64 − 70 is a real one. Can JavaScript count that high?

Not with its ordinary numbers. A JavaScript `number` is
[*floating point*](../glossary.md#floating-point): about 16 significant digits and an
exponent, like a calculator with a 16-digit display. A whole number with more digits than
that gets rounded. So 2^64 − 70 comes out as 2^64. No error, no warning, just a different
number. And in JAM, 70 units of gas matter.

The trick is a second kind of number. A [*`bigint`*](../glossary.md#bigint) is a whole
number with no size limit. It is slower, and it can't be mixed with plain numbers, but it
never rounds.

So your client follows one rule from here on: small values are `number`, 64-bit values
are `bigint`. This lesson proves the rounding with three tests of JavaScript itself, and
sets that rule.

## What the Gray Paper says

JAM's numbers are naturals (whole numbers from 0 up) with a ceiling. The Gray Paper
writes ℕ_{2^32} for a natural below 2^32 (timeslots, service ids, lengths) and ℕ_{2^64}
for one below 2^64 (gas, balances). Section 4 translates for programmers: a timeslot is
*"a natural less than 2^32 (in compute parlance, a 32-bit unsigned integer)"*. An
[*unsigned integer*](../glossary.md#unsigned-integer) is a whole number that is never
negative, kept in a fixed number of bits (u8, u16, u32, u64): a u32 goes from 0 to
2^32 − 1, which is 4294967295.

**Where a `number` stops.** It holds every whole number exactly up to 2^53 − 1 (that's
`Number.MAX_SAFE_INTEGER`, about 9 quadrillion). Above that, it quietly rounds.

**One letter apart.** An `n` after the digits makes a `bigint`. `2` is the `number` two,
`2n` the `bigint` two, and `typeof 2n` says `"bigint"`. A calculation takes one kind or
the other, never both, so every value in it needs its `n`: 2^64 − 70 as a `bigint` is
`2n ** 64n - 70n`. Mixing them, as in `1n + 1`, stops with
`TypeError: Cannot mix BigInt and other types`.

**Powers.** In JavaScript, `**` raises to a power, and `^` doesn't. `^` is *xor*, a
[*bitwise operator*](../glossary.md#bitwise-operator): one that works on a number's bits.
It compares two numbers bit by bit and keeps the bits set in exactly one of them. 2 is
`0b000010` and 53 is `0b110101`, so `2 ^ 53` is `0b110111`, which is 55. `2 ** 53` is
9007199254740992.

**The rule,** for the whole client:

- **u8, u16 and u32 values are `number`**: timeslots, service ids, indices, lengths.
  Exact, fast, easy.
- **u64 values are `bigint`**: gas, balances, anything that can climb past 2^53.

TypeScript keeps the two apart: `1n + 1` is a type error, so you can't mix them by
accident. You convert on purpose, with `BigInt(x)` and `Number(x)`.

## The tests

Tests usually check your code. These check JavaScript itself, so nobody on the project
has to rediscover its quirks the hard way:

**New file** `test/js-numbers.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

test("a number rounds above 2^53: 2^64 - 70 and 2^64 are the same float", () => {
  const twoTo64Minus70: number = 2 ** 64 - 70;
  const twoTo64: number = 2 ** 64;
  assert.equal(twoTo64Minus70, twoTo64);
});

test("a bigint never rounds", () => {
  const twoTo64Minus70: bigint = 2n ** 64n - 70n;
  const twoTo64: bigint = 2n ** 64n;
  assert.notEqual(twoTo64Minus70, twoTo64);
  assert.equal(twoTo64Minus70, 18446744073709551546n);
});

test("bitwise operators work on signed 32-bit integers", () => {
  const allOnes: number = 0xffffffff;
  const signed: number = allOnes | 0;
  assert.equal(signed, -1);
  const unsigned: number = signed >>> 0;
  assert.equal(unsigned, 0xffffffff);
});
```

Every value says its kind, `: number` or `: bigint`. The first two tests hold the same
two values, once as `number` and once as `bigint`.

The third test is a trap for later. `|`, `&`, `^`, `<<` and `>>` treat numbers as
*signed* 32-bit integers, so `allOnes`, all 32 bits set, comes out of `| 0` as −1. In a
signed number the top bit counts not 2^31 but −2^31. Every bit below it adds up to
2^31 − 1, so all 32 together make −2^31 + 2^31 − 1 = −1.
`>>> 0` turns it back into the unsigned value. JAM's virtual machine will lean on that.

**Run**

```sh
npm test
```

```text
...
✔ hex there and back (0.8ms)
✔ no bytes at all is just 0x (0.1ms)
✔ a number rounds above 2^53: 2^64 - 70 and 2^64 are the same float (0.6ms)
✔ a bigint never rounds (0.1ms)
✔ bitwise operators work on signed 32-bit integers (0.1ms)
✔ slot 0 is the first six seconds of the JAM Common Era (1.3ms)
✔ an hour is 600 slots (0.1ms)
ℹ tests 7
...
ℹ fail 0
...
reported 7 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791726099568
```

All green on the first try: these tests pin down how JavaScript already behaves. Seven
tests on the dashboard now.

Want to watch the trap spring? In `test/js-numbers.test.ts`, put a breakpoint on each
test's last `assert`: lines 7, 14 and 22. With that file open, pick *Tests: the open
file* in *Run and Debug* and press <kbd>F5</kbd>, then <kbd>F5</kbd> again at each stop.
The debugger's *Variables* list shows:

1. `twoTo64Minus70` and `twoTo64` both 18446744073709552000: two different numbers,
   rounded to one.
2. The same two as `bigint` values, 18446744073709551546n and 18446744073709551616n:
   70 apart, as they should be.
3. `allOnes` 4294967295, `signed` −1 and `unsigned` 4294967295 again.

While it's paused, the *Debug Console* runs any JavaScript you type. Try
`twoTo64Minus70 === twoTo64` at the first stop.

> [!NOTE]
> **From here on, the debug configurations are yours.** The lessons after this one won't
> mention `.vscode/launch.json`. *Tests: the open file* and *Program: the open file*
> cover anything new. And when you build something you'll run again and again, give it a
> configuration of its own: copy one, then change its `name` and `program`. It's a good
> habit on any system you build: the next time something goes wrong, you're one keypress
> away from watching it happen.
>
> One trap. To run an npm script with a word after it, as `npm run chain preimages`, give
> every word its own place: `"runtimeArgs": ["run", "chain", "preimages"]`. Written
> `["run", "chain preimages"]`, npm looks for a script called "chain preimages", finds
> none, and your breakpoints never hit.

## The same trap, in another language

lasair, written in OCaml, keeps 64-bit values in OCaml's `int64`, which is *signed*: from
2^63 up, a value looks negative. In one encoding function a plain `<` compared such a
value as negative, so 2^64 − 70 was written down as if it were tiny. The official fuzzer
caught it: a work-report's `auth_gas_used` of 2^64 − 70 got the wrong encoding, so its
hash was wrong, so lasair rejected a perfectly valid block. A `bigint` has no sign bit to
trip over, and [lesson 2.2](../02-codec/02-compact-naturals.md) tests that exact value.

<details>
<summary>lasair: the fix, in <code>lib/serialization.ml</code></summary>

```ocaml
(** A compact natural goes up to 2^64 - 1 and is held in an int64, so it is compared
    UNSIGNED: a value >= 2^63 is negative as an int64 and a signed test put it in the
    1-byte form (official fuzzer GP 0.8.0 session 1790609924_6095: a work report's
    auth_gas_used 2^64 - 70 re-encoded as one byte, so its hash and the block's
    extrinsic hash were wrong and a valid block was rejected). *)
let ult (a : int64) (b : int64) = Int64.unsigned_compare a b < 0
```

`ult` is "unsigned less than", and every comparison in that encoder now goes through it.

</details>

## Check your understanding

::: check
**A gas amount can be as big as 2^64 − 70. What goes wrong if a client keeps it in a JavaScript `number`?**

- [ ] Nothing: a `number` is 64 bits wide, so it holds any 64-bit value
  > No: its 64 bits are floating point, about 16 significant digits and an exponent. It
  > is exact only up to 2^53 − 1.
- [x] Above 2^53 − 1 a value is rounded to a different number, with no error and no warning
  > Yes: 2^64 − 70 comes out as 2^64. The client carries on with the wrong amount, and in
  > JAM 70 units of gas matter.
- [ ] The program stops with an overflow error
  > No: that would be easy to find. The rounding is silent, which is why the lesson pins
  > it down with a test.

**Why not make every number a `bigint`, to be safe?**

- [x] A `bigint` is slower and can't be mixed with plain numbers, and a value of 32 bits or fewer is already exact as a `number`
  > Yes: a timeslot is below 2^32, far under 2^53. So the rule keeps u8, u16 and u32
  > values as `number`, and pays for `bigint` only where a value can climb past 2^53.
- [ ] A `bigint` can't hold a small value
  > No: `2n` is the `bigint` two. It holds a timeslot perfectly well. The rule is about
  > cost, not about what fits.
- [ ] A `bigint` rounds too, only much later
  > No: a `bigint` is exact at any size.

**What stops a `number` and a `bigint` from being mixed in one calculation by accident?**

- [ ] Nothing: JavaScript quietly converts one to the other
  > No: `1n + 1` stops with `TypeError: Cannot mix BigInt and other types`. Nothing is
  > converted unless you ask.
- [ ] A test you write for each calculation
  > No: you don't have to catch it yourself. The type check refuses the line.
- [x] TypeScript: mixing them is a type error, so you convert on purpose, with `BigInt(x)` or `Number(x)`
  > Yes: every conversion is one you wrote, where you can see it.

**`0xffffffff | 0` is −1. Why?**

- [ ] `0xffffffff` is too big for a `number`
  > No: it's 4294967295, far below 2^53. A `number` holds it exactly, as `allOnes` shows.
- [x] Bitwise operators read a number as a signed 32-bit integer, and all 32 bits set is −1
  > Yes: `|` works on the signed reading. `>>> 0` turns the result back into the unsigned
  > one, 4294967295.
- [ ] A number past 2^32 overflows when you add to it
  > No: `|` isn't adding, and `0xffffffff + 0` is still 4294967295. Only the bitwise
  > operators squeeze a number into 32 signed bits.
:::

## What you have

One rule for every number in your client, `number` up to 32 bits and `bigint` for 64,
and three tests that keep JavaScript's quirks in plain sight. Bytes and numbers are the
raw material. [Part 2](../02-codec/index.md) builds what turns any JAM value into them
and back: the codec.

Next: [Part 2 · The codec](../02-codec/index.md)
