# How a block is ordered

[Lesson 0.5](./05-understanding-the-vectors.md) showed the nine small functions that the
vectors test one at a time. A real block uses all of them. In what order, and which of them
need each other? By the end of this lesson you can read a timeline of a whole block import:
what must come before what, what could run side by side, and when each value in the block's
header can first be checked. Nothing here is code to type. It is the map that lets the
parts you build next find their place.

## New words

- **Wave.** A group of block-import steps that need only the block, the old state, or
  results from earlier waves, so they could run side by side. *Example:* wave 1 is
  everything made from the block and the old state alone.
- **Slack.** How many waves a step could wait without making anything late. *Example:*
  the guarantees' step finishes in wave 3, but nothing needs it, so it has 1 wave of slack.

## The whole transition

A block import is the *state transition function* ([lesson 0.1](./01-what-you-will-build.md)):
a state and a block go in, and out comes the state after the block, or a refusal. In the
Gray Paper it is the Greek capital Υ.

```text
 the state before ─┐
                   ├──►  Υ  ──►  the state after   (or: refused, and the state stays as it was)
 the block ────────┘
```

Inside Υ there is no single rule. There are sixteen small steps, each making one new piece of
state (or, in accumulation's case, eight at once) from some inputs. The vectors of [lesson 0.5](./05-understanding-the-vectors.md)
test those steps one family at a time. What the vectors can't show is how the steps fit
together, and that is the Gray Paper's own question.

## What the Gray Paper says

§4.2 lists, for every new piece of state, what it is made from. Its reason for writing the
list this way is to help clients do the work in parallel: *"we minimize the depth of the
dependency graph"*. In plain words, the list is written so that as few steps as possible
wait for other steps.

That gives an order without anyone choosing one. Steps that need only the block and the
old state go in wave 1. A step whose inputs come from wave 1 goes in wave 2, and so on. Steps
in one wave don't need each other, so they could run side by side. (Lesson
[19.1](../19-block-import/01-the-order-of-things.md) builds the full map, symbols and all.)

## The timeline

The timeline below has one row for each of the 16 lines, under the family that tests it.
Press *next wave* and read it as a schedule. Tap any bar to see what it waits for and what
waits for it.

<ImportGantt />

What to notice:

- **Wave 1 has seven steps and nothing waits to start them.** The clock, the entropy, both
  validator sets, the record of recent blocks, the judgements and the cores after them can all
  begin the moment the block arrives.
- **Safrole is not one step.** It is four, and `γ′`, the lottery's new state, waits for the
  new entropy, the new validators and the disputes' judgements (a convicted validator must
  be kept out of the next set).
- **Accumulation is the pivot.** Four steps wait for it, and it waits for the assurances,
  which wait for the disputes. That chain, `ρ†` to `𝐑*` to accumulation to the last four,
  is what makes the import four waves deep. Its steps are marked ◆: any one of them
  running late makes the whole import late.
- **Some steps can wait.** The guarantees' step (`ρ′`) finishes in wave 3, but nothing in this block
  needs it, so it could run in wave 4 and nothing would be late. The dashed tail is that
  freedom, called *slack*.
- **A bar's length is not time.** Every bar is one wave wide whatever it costs. Accumulation
  runs services' programs, and the clock copies one number from the header; the timeline
  says only what must come before what, never how long anything takes. Whether a client really runs
  steps side by side is its own choice.

## What the block gives and what the importer works out

The whole header arrives with the block, filled in by its author. So nothing in it is
"worked out by the importer". The question is what the importer *does* with each part, and
the timeline marks three answers:

- **Given (a circle).** The importer reads the value as an input. The header's slot becomes
  the new time, its entropy source feeds the new entropy, and its author index picks whose key
  to check. The block's five lists (tickets, disputes, preimages, assurances and guarantees)
  are read the same way by the steps that use them. All of these are there at the start.
- **Checked (a diamond).** The header states a value, and the importer works out the real one
  itself and refuses the block if they differ. Four checks run before any step: the parent's
  hash, the old state's root, that the slot is after the old time, and the extrinsic's hash. The
  offenders mark needs only the disputes, so it can be checked once they are judged. The epoch
  mark and the tickets mark need Safrole's step, and so does the seal, the author's signature
  on the header. The diamond sits under the step that settles it, and fills in when that
  step is done.
- **Made (a square).** The root of the new state needs every step, so it comes last. This block's
  header has no field for it. The *next* block's header carries it, as its prior state root,
  and that import checks it at its start.

So an import has three moments for the header. Before any step, the header is checked
against the old state and the block. Midway, Safrole's output settles the marks and the
seal. At the end, the new state has a root, ready for the next block to quote.

## Check your understanding

::: check
**Which block-import steps could run side by side?**

- [ ] Any two steps on the Gray Paper's list
  > No: the list isn't a schedule. `γ′` comes before `η′` in it, though `γ′` is made from
  > `η′`.
- [x] Steps in the same wave: none of them needs another's result
  > Yes: a wave holds steps whose inputs are the block, the old state, or earlier waves.
- [ ] Steps tested by the same vector family
  > No: a family can span waves. Safrole's entropy is in wave 1 and its lottery in wave 2.

**The guarantees' step has 1 wave of slack. What does that mean?**

- [x] It could start one wave later and nothing in the block would be late
  > Yes: nothing in this block is made from its result, so it can fill any later wave.
- [ ] It takes one wave's time to run
  > No: a bar's length is never time. Slack is about waiting, not duration.
- [ ] A client may skip it when it is busy
  > No: every step runs. Slack only says when it may.

**Why is the new state's root the last value in the header's rows?**

- [ ] Hashing is slow, so it is saved for last
  > No: the order is about what the value is made from, not how long it takes.
- [ ] The header is always checked last
  > No: the header's first checks come before any step runs.
- [x] It is made from the whole new state, so every step must have finished
  > Yes: one more step could change a part of the state, and so change the root.

**A block's header lists an offenders mark that differs from what its disputes convict. What does the importer do?**

- [ ] Uses the header's list, since the author wrote it
  > No: the header is the author's claim, and the importer doesn't take its word on this.
- [x] Works out the list from the disputes itself and refuses the block
  > Yes: the offenders mark is a checked value. A mismatch is the refusal `bad_offenders_mark`.
- [ ] Ignores the mark and carries on
  > No: a header value the importer checks is never ignored. A wrong one refuses the block.
:::

## What you have

A timeline of a whole block import: sixteen steps in four waves, the chain that sets its
length, the steps that can wait, and what the block gives against what its header must match. [Part 1](../01-bytes-and-numbers/index.md)
starts at the other end, with the bytes and numbers every vector is made of, so that by
[Part 19](../19-block-import/index.md) each box on this timeline is a function you wrote.

Next: [Part 1 · Bytes and numbers](../01-bytes-and-numbers/index.md)
