# The JAM clock

Your first piece of real JAM, tiny and everywhere: every block says *when* it belongs,
and that "when" comes from this clock. By the end of this lesson your client can tell
what slot it is, with tests to prove it, and keeps a clock that reports every slot to
Grafana as it begins. On the way you write your first test before its code, and hunt
down your first bug.

## New words

- **Timeslot (slot).** One tick of JAM's clock: six seconds, numbered from 0. *Example:*
  slot 1 runs from 12:00:06 to 12:00:12 UTC on 1 January 2025.
- **JAM Common Era.** The moment JAM's clock starts: 12:00 UTC on 1 January 2025.
  *Example:* slot 0 begins right then.
- **Unix epoch.** The moment most computer clocks count from: 00:00 UTC on 1 January
  1970. (Nothing to do with a JAM epoch, which arrives in [lesson 7.1](../07-time-and-shuffling/01-epochs.md).) *Example:* the JAM
  Common Era is 1,735,732,800 seconds after it.
- **Header.** A block's cover page; among other things, it names the block's slot
  ([lesson 4.6](../04-blocks/06-the-header.md)). *Example:* a header saying slot 43.
- **Test.** A small program that checks one thing your code should do, and fails loudly
  if it doesn't. *Example:* "an hour is 600 slots", below.
- **Test-driven development (TDD).** Writing a test before the code it tests, watching it
  fail, then writing the code that makes it pass. *Example:* this lesson's `slotAt`.
- **Assertion.** One check inside a test: if the value isn't what it should be, the test
  fails and says what it got. *Example:* `assert.equal(anHourIn, 600)`.
- **Debugger.** A tool that pauses a running program so you can read its variables, then
  lets it go on. *Example:* VS Code's *Run and Debug*.
- **Breakpoint.** A line where the debugger pauses the program. *Example:* the red dot
  left of line 12 in `src/time.ts`.
- **Command-line argument.** A word you type after a program's name, which the program
  reads from `process.argv`. *Example:* the `3` in `npm run now 3`.

## What the Gray Paper says

JAM keeps time in six-second *timeslots*, counted from the *JAM Common Era*: 12:00
UTC on 1 January 2025 (GP §4, *Time*), which is 1,735,732,800 seconds after the Unix
epoch. One slot lasts P = 6 seconds (§4, *Epochs and Slots*). So slot 0 is the first six
seconds of the era, slot 1 the next six, and slot 600 starts exactly one hour in.

Every block header names its slot, and a block may not come from the future: its slot
times P can't be later than the current time (§5). Why midday? So that all the major
time zones share the same date at every whole day of the era.

Try the clock. Pick a moment, or nudge it a millisecond at a time, and watch which slot
it falls in. Stop at 5.999 seconds in: rounding down says slot 0, and rounding to the
nearest whole number says 1. That difference is the bug you will hunt in a minute.

<SlotClock />

## The test comes first

You are about to write a test for a function that doesn't exist yet. That's the plan:
test-driven development. The test says what `slotAt` must do, then you write `slotAt`
to make it true.

**New file** `test/time.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { slotAt } from "../src/time.ts";

const at = (iso: string) => slotAt(new Date(iso));

test("slot 0 is the first six seconds of the JAM Common Era", () => {
  const eraStart: number = at("2025-01-01T12:00:00Z");
  assert.equal(eraStart, 0);
  const lastMoment: number = at("2025-01-01T12:00:05.999Z");
  assert.equal(lastMoment, 0);
  const sixSecondsIn: number = at("2025-01-01T12:00:06Z");
  assert.equal(sixSecondsIn, 1);
});

test("an hour is 600 slots", () => {
  const anHourIn: number = at("2025-01-01T13:00:00Z");
  assert.equal(anHourIn, 600);
});
```

`node:test` gives you `test(name, fn)`. `node:assert/strict` gives you assertions that
compare exactly, so `assert.equal(1, "1")` fails, as it should.

Every test in this tutorial is written in steps: each value the code works out gets a
name and a type (`const lastMoment: number = ...`), and the assertion below it checks the
name. Longer than `assert.equal(at("..."), 0)` on one line, and on purpose: you can read
what each test compares, and when you stop a test in the debugger (this lesson's bug
hunt shows how), every step's value is there with its name.

The test imports `slotAt` from a file that doesn't exist yet. Give it the smallest file
that runs: the era's two numbers, and a `slotAt` that always says 0. Wrong on purpose. A
test that fails because a file is missing proves only that the file is missing; a test
that fails on its assertions proves it really checks the clock.

**New file** `src/time.ts`

```ts
// Time: JAM counts six-second timeslots from the JAM Common Era (GP §4).

/** The JAM Common Era began at 12:00 UTC on 1 January 2025: seconds after the Unix epoch. */
export const JAM_COMMON_ERA = 1_735_732_800;

/** P: a timeslot lasts six seconds. */
export const SLOT_SECONDS = 6;

/** The timeslot a moment falls in: whole slots since the JAM Common Era. */
export function slotAt(date: Date): number {
  return 0;
}
```

**Run, expect it to fail**

```sh
npm test
```

```text
...
✖ slot 0 is the first six seconds of the JAM Common Era (2.1ms)
✖ an hour is 600 slots (0.1ms)
ℹ tests 2
ℹ suites 0
ℹ pass 0
ℹ fail 2
...
test at test/time.test.ts:16:1
✖ an hour is 600 slots (0.1ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:

  0 !== 600

      at TestContext.<anonymous> (…/client/test/time.test.ts:18:10)
...
    actual: 0,
    expected: 600,
...
reported 2 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791725866613
```

Red, for the right reason: both tests ran, and both caught the stub. Reading a failure:
`0 !== 600` is *actual !== expected*, the test wanted 600 and got 0, as the `actual` and
`expected` lines below say in words; `time.test.ts:18` is the assertion that failed. Now
you know the tests really check the clock.

Over in Grafana, this failed run is already there: *Tests failed* is no longer 0, and
*Test results* says which test failed and why.

## The code

**Replace in** `src/time.ts`

```ts
/** The timeslot a moment falls in: whole slots since the JAM Common Era. */
export function slotAt(date: Date): number {
  const ms = date.getTime() - JAM_COMMON_ERA * 1000;
  return Math.round(ms / (SLOT_SECONDS * 1000));
}
```

Milliseconds since the era, divided by the milliseconds in a slot, rounded to a whole
number. Run the tests:

**Run, expect it to fail**

```sh
npm test
```

```text
...
✖ slot 0 is the first six seconds of the JAM Common Era (1.6ms)
✔ an hour is 600 slots (0.2ms)
ℹ tests 2
ℹ suites 0
ℹ pass 1
ℹ fail 1
...
✖ failing tests:

test at test/time.test.ts:7:1
✖ slot 0 is the first six seconds of the JAM Common Era (1.6ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:

  1 !== 0

      at TestContext.<anonymous> (…/client/test/time.test.ts:11:10)
...
```

## Bug hunt

Red again, and this time the code is real. Something in it is wrong, on purpose: every
so often a lesson hands you a bug, so that finding one becomes a habit before it matters.
Four places tell you what happened:

1. **The test output.** One test failed, `slot 0 is the first six seconds of the JAM
   Common Era`, and below it: `1 !== 0`. Your code said 1 where the test wanted 0. The
   other test, *an hour is 600 slots*, passed.
2. **The dashboard.** *Tests failed* now says 1, and *Failed tests* has a `FAIL` line
   with the same message. Every run is kept, so you can put this run next to the last
   one.

   ![Failed tests panel](./images/04-failed-tests.png)
3. **The line.** The failing test has three assertions; the output points at the second,
   `assert.equal(lastMoment, 0)`. `lastMoment` is `at("2025-01-01T12:00:05.999Z")`: 5.999
   seconds into the era. In slots that's 5.999 / 6 = 0.9998, and `Math.round` turns
   0.9998 into 1. But slot 1 doesn't start until the sixth second. A slot number counts the *whole* slots that have gone by, so
   it must round *down*.
4. **The debugger.** Step 3 worked it out; a *debugger* lets you watch it happen. In
   `src/time.ts`, click just left of line 12's number, the `return` line. A red dot
   appears: a *breakpoint*. Open *Run and Debug* (<kbd>⇧⌘D</kbd>, or
   <kbd>Ctrl+Shift+D</kbd> on Windows and Linux), pick *Tests: all (npm test)* at the
   top, and press <kbd>F5</kbd>. The test pauses on line 12, and the debugger's *Variables* list
   shows `ms: 0`: the first assertion, 12:00:00 sharp. Press <kbd>F5</kbd> to go on, and it
   pauses again with `ms: 5999`, the second. In the *Debug Console* (next to the
   terminal), type `ms / (SLOT_SECONDS * 1000)` and press Enter: `0.9998333333333334`,
   a hair under 1, and `Math.round` is about to make it 1. Press <kbd>⇧F5</kbd> to stop,
   and click the red dot to remove it.

> [!NOTE]
> *Tests: all (npm test)* comes from `.vscode/launch.json`, which the tutorial ships. Two
> more work in any lesson: *Tests: the open file* runs the test file you're looking at,
> and *Program: the open file* the program. Each program gets one of its own:
> *Program: hello (0.3)*, and *Program: now (0.4)* for the program you'll make below.

The fix is one word:

**Replace in** `src/time.ts`

```ts
/** The timeslot a moment falls in: whole slots since the JAM Common Era. */
export function slotAt(date: Date): number {
  const ms = date.getTime() - JAM_COMMON_ERA * 1000;
  return Math.floor(ms / (SLOT_SECONDS * 1000));
}
```

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ slot 0 is the first six seconds of the JAM Common Era (0.5ms)
✔ an hour is 600 slots (0.1ms)
ℹ tests 2
ℹ suites 0
ℹ pass 2
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 48.3
reported 2 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=…&var-run_id=test-1791722258705

> typecheck
> tsc -p .
...
```

Green, and on the dashboard *Tests passed* jumps to 2 and *Tests failed* drops back to
0. Milliseconds since the era, divided by the milliseconds in a slot, rounded down: that's
the whole JAM clock.

Why two commands? Node strips the types and runs the code without ever looking at them,
so a type error would sail straight through `npm test`. `npm run typecheck` is the one
that catches it. Run both after every change.

## What time is it in JAM?

**New file** `bin/now.ts`

```ts
// Prints the JAM timeslot it is right now, and reports it to the observability stack.

import { Run } from "../src/obs.ts";
import { slotAt } from "../src/time.ts";

const run = new Run("now");
const slot = slotAt(new Date());
console.log(`It is JAM timeslot ${slot}.`);
run.event("slot", { slot });
run.number("slot", slot);
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

What flows through it — the input, the values worked out, the line printed:

::: code-group

```text [what goes in]
new Date()        the wall clock — say 13:00:00 UTC on 1 January 2025, an hour into the era
JAM_COMMON_ERA    1735732800, seconds from the Unix epoch to 12:00 UTC that day
SLOT_SECONDS      6
```

```ts [what it computes]
const computed = {
  sinceEra: 3600, // seconds from 12:00 to 13:00 UTC on 1 January 2025
  slot: 600, // ⌊3600 / 6⌋: the test's own "an hour is 600 slots"
};
```

```text [what comes out]
It is JAM timeslot ….
```

:::

At that moment the line would read `It is JAM timeslot 600.`; run it today and the
number is in the millions, which is why the output below leaves it as `…` — your clock
decides.

**Run**

```sh
npm pkg set scripts.now="node bin/now.ts"
npm run now
```

```text
It is JAM timeslot ….
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=now-1791725866841
```

A number in the millions: every six-second slot since the start of 2025. On the
dashboard, *JAM timeslot (last reported)* shows the same number, and there it stays:
`bin/now.ts` read the clock once, reported, and quit.

## Start the clock

A JAM node never stops keeping time, so neither should yours. Give `bin/now.ts` a loop:
wait for each slot to begin, then report it.

**Rewrite** `bin/now.ts`

```ts
// The JAM clock: prints each timeslot as it begins, and reports it to the observability
// stack. `npm run now 3` keeps time for three slots; with no number, until Ctrl+C.

import { setTimeout as sleep } from "node:timers/promises";
import { Run } from "../src/obs.ts";
import { JAM_COMMON_ERA, SLOT_SECONDS, slotAt } from "../src/time.ts";

const slots = Number(process.argv[2] ?? Infinity);
const first = slotAt(new Date());

for (let slot = first; slot < first + slots; slot++) {
  await sleep(untilSlot(slot));
  const run = new Run("now");
  console.log(`It is JAM timeslot ${slot}.`);
  run.event("slot", { slot });
  run.number("slot", slot);
  const link = await run.report();
  if (link) console.log(`reported to Grafana: ${link}`);
}

/** Milliseconds until a slot begins: 0 for the slot we're in, which has begun already. */
function untilSlot(slot: number): number {
  return Math.max(0, (JAM_COMMON_ERA + slot * SLOT_SECONDS) * 1000 - Date.now());
}
```

Three things are new:

- **How long to run.** `process.argv[2]` is the first *command-line argument*, the word
  after the file's name. `npm run now 3` means three slots. With no number, `slots`
  is `Infinity`, and the loop never ends.
- **Waiting.** `sleep` is Node's `setTimeout` in a form you can `await`. `untilSlot` works
  out how long until a slot begins: the slot's first second, counted from the JAM Common
  Era, minus now. The slot you're in has begun already, so for that one it's 0, and the
  first line prints at once.
- **A run per slot.** A run reports its numbers once (the stack refuses the same number
  twice in one report), so a clock that reports every slot makes a `Run` for each.

**Run**

```sh
npm run now 3
```

```text
It is JAM timeslot ….
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=now-1791731852333
It is JAM timeslot ….
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=now-1791731856001
It is JAM timeslot ….
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=now-1791731862002
```

Three slots, one after the other: the first at once, the next two six seconds apart,
each as its slot begins. Every slot is a run of its own, with its own link.

Now start the clock for real, with no number: `npm run now`. On the dashboard, set
the refresh (top right) to 5s and watch *JAM timeslot (last reported)* tick up by one
every six seconds, with each slot's event arriving in *Everything your client reported*.
The panel runs a few seconds behind your terminal, and now and then skips a slot: the
stack collects numbers every five seconds, and slots come every six. That's JAM's
heartbeat. When you've seen enough, press <kbd>Ctrl+C</kbd> to stop the clock.

<details>
<summary>lasair: the same clock, in <code>lib/overview.ml</code></summary>

```ocaml
(** Unix timestamp of JAM Common Era start *)
let jam_common_era_unix : int64 = 1_735_732_800L

(** Convert Unix timestamp to JAM timeslot *)
let timeslot_of_unix (unix_ts : int64) : timeslot option =
  let open Int64 in
  let diff = sub unix_ts jam_common_era_unix in
  if diff < 0L then None
  else Some (Int32.of_int (to_int (div diff (of_int Constants.c_slot_seconds))))
```

The same division. lasair also refuses moments before the era: it returns `None`, OCaml's
"no value here", and the caller must deal with it. (Your clock will learn that in the
[hardening pass](https://github.com/abutlabs/the-gray-tutor/blob/main/HARDENING.md); nobody is importing blocks from 2024.) `let open Int64 in` lets the
function write `sub` and `div` for `Int64.sub` and `Int64.div`.

JAM time is this simple on purpose: every node works out the same slot from its own
clock, without sending a single message.

</details>

## Check your understanding

::: check
**At 12:00:05.999 UTC on 1 January 2025, which slot is it?**

- [ ] Slot 1: 5.999 seconds is 0.9998 of a slot, nearer 1 than 0
  > No: that's the bug you hunted. `Math.round` said 1, but slot 1 doesn't begin until
  > 12:00:06.
- [x] Slot 0: not even one whole slot has gone by
  > Yes: a slot number counts the whole slots that have gone by, so it rounds down.
  > 0.9998 rounds down to 0.
- [ ] Slot 5: five whole seconds have gone by
  > No: that counts seconds. A slot is six seconds, so 5.999 seconds isn't one slot yet.

**Which slot begins at 12:00 UTC on 2 January 2025, one day into the era?**

- [ ] 86,400
  > No: that's the seconds in a day, 24 × 60 × 60. A slot is six of them.
- [ ] 1,440
  > No: that's the minutes in a day. It would be right if a slot lasted a minute.
- [x] 14,400
  > Yes: 86,400 seconds / 6 = 14,400 slots. Or 24 hours × 600, since an hour is 600
  > slots.

**Before writing the real `slotAt`, the lesson gave it one that always says 0. Why?**

- [x] So the tests fail on their assertions, which proves they check the clock
  > Yes: `0 !== 600` shows the test asked for the right answer and caught a wrong one.
  > That's red for the right reason.
- [ ] Because 0 is the right answer at the start of the era
  > No: it's right for the first six seconds only, and the stub says 0 forever. It's wrong
  > on purpose.
- [ ] Without the file, the tests would pass
  > No: they'd fail, with `Cannot find module`. That proves only that a file is missing,
  > not that the tests check anything.

**`npm test` is green. Why run `npm run typecheck` too?**

- [ ] Without it, Node can't run the `.ts` files
  > No: Node strips the types and runs the files itself; `npm test` just did.
- [x] Node strips the types without looking at them, so a type error passes `npm test`
  > Yes: Node only runs the code. `tsc`, behind `npm run typecheck`, is the one that
  > catches a type mix-up.
- [ ] It runs the tests again, more strictly
  > No: it runs no tests at all. It only reads the code and checks the types.
:::

## What you have

Your first JAM rule, its tests, and a clock that reports every slot as it begins. From
here on, every lesson's `npm test` lands in Grafana. The clock was one number you could
check by hand. Everything after it is checked against the official test vectors, so
[the next lesson](./05-understanding-the-vectors.md) opens that folder and shows what each kind of
vector asks, and which file of your client will answer it.

Next: [0.5 Understanding the vectors](./05-understanding-the-vectors.md)
