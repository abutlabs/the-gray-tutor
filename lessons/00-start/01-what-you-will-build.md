# What you will build

Welcome! By the end of this tutorial you will have written a JAM client: a TypeScript
program that takes a JAM block, checks it against every rule in the Gray Paper, and works
out what the chain looks like afterwards. Byte for byte the same answer every other JAM
client gets.

## New words

- **JAM.** A blockchain protocol that blends ideas from Polkadot and Ethereum: anyone can
  put a program (a *service*) on it, and the work for those programs runs in parallel on
  many *cores*. The name comes from "join-accumulate", part of its model of computing.
  *Example:* in [Part 15](../15-the-pvm/index.md) you'll run a real JAM service's code.
  [Lesson 11.2](../11-assurances/02-timeouts.md) lets you walk one piece of work across a core, block by block.
- **Gray Paper (GP).** JAM's specification: the document that defines every rule, mostly
  in maths. It is still being improved, and new versions change rules; this tutorial
  follows version 0.8.0. *Example:* "§4" means its section 4.
- **Client.** A program that follows a protocol's rules. A JAM client reads blocks and
  works out the chain's state, the same way every other JAM client does. *Example:*
  lasair is a JAM client, and so will yours be.
- **Block.** A batch of new information added to the chain, at most one every six
  seconds. *Example:* the test vectors include runs of 100 real blocks.
- **State.** Everything the chain remembers between blocks: who the validators are, every
  service's data, the time, and more. *Example:* "it's slot 43" is part of the state.
- **State transition.** The rule that takes the state before a block, and the block, to
  the state after it: the Gray Paper's Υ. *Example:* the state at slot 43, and the block
  for slot 44, give the state at slot 44.
- **Test vector.** An official example: an input, with the exact output a correct client
  must produce from it. *Example:* a block, and the state it must lead to.

Every word like these is also in the [glossary](../glossary.md). Each lesson starts with
the ones it brings in.

## The whole thing in one line

In plain words: the chain remembers a *state*. Each *block* changes that state, following
fixed rules. A client is a program that applies those rules, and every client that applies
them correctly gets exactly the same new state. The Gray Paper says all of that in one
equation (§4, *Overview*):

```text
σ′ ≡ Υ(σ, B)
```

- **σ** (sigma) is the chain's state before a block: seventeen parts, sixteen fixed ones
  from validator keys to the last few blocks, plus the service accounts.
- **B** is the block.
- **σ′** (sigma prime) is the state after it.
- **Υ** (upsilon) is the *state-transition function*, the machine that turns one into
  the other.

That's it. A blockchain, says the Gray Paper, is a starting state plus Υ, and almost
every other page of the paper describes one piece of Υ.

A program that computes Υ is a **block importer**. Hand it a state and a block, and it
answers either "valid, and here is the new state" or "invalid, go away". It is the first
milestone (M1) of a JAM implementation, and it is what you will have at the end.

## The road

| Part | You build |
| --- | --- |
| 0 · Start | your project, its dashboard, the JAM clock |
| 1 · Bytes and numbers | hex, and numbers too big for JavaScript |
| 2 · The codec | turning JAM values into bytes and back |
| 3 to 6 | work-reports, blocks, hashes and signatures, the state and its root |
| 7 to 18 | every part of the state, and how a block changes it |
| 19 · Block import | Υ, all of it |
| 20 · Facing the fuzzer | the official tester, throwing blocks at your client |

The [home page](../index.md) has the full map.

## How a lesson works

A rule from the Gray Paper, the code for it in small snippets, then you run it. The line
above each snippet says what to do with it:

- **New file** `src/bytes.ts`: create the file.
- **Add to** `src/bytes.ts`: paste it at the end of the file.
- **Replace in** `src/bytes.ts`: swap out the function (or type, or constant) of the
  same name, its comment included.
- **Rewrite** `package.json`: replace the whole file.
- **Run**: type it in a terminal in `client/`. It should work.
- **Run, expect it to fail**: it should fail, the way the lesson says (on the website, its
  block is tinted red). This tutorial uses test-driven development: we often write the
  test first and watch it go red, because a test that has never failed has never proved
  anything.

After each **Run** block comes the output you should see, in a block of its own
(*Output* on the website; an `npm install` has none, since it only prints downloads): put
it next to your terminal. A line `...` marks where lines are cut, and `…` a part that
changes from run to run; times, durations and run ids will differ too, and so may a line
number in an error, by one or two, if your imports sit differently. Paths are inside
`client/`. A code block with no label above it is for reading, unless the words around it
say to type it and where, as the setup commands in [lesson 0.2](./02-set-up-the-project.md) do. On the
website, a label is a link back to this list, and an **Add to** or **Replace in** block shows
the whole file after that step: the lines the step adds or changes are highlighted, the rest
dimmed, and a long stretch you haven't touched folds to a line such as *⋯ 42 unchanged
lines*, which a tap opens. The eye in its corner shows just the step's lines, and back.

### Meet Albert {#albert}

Meet Albert. You'll probably see him around class.

![Albert sticking his tongue out](./images/01-albert-tongue.svg)

## You will see everything

From [lesson 0.3](./03-watch-your-client.md) on, your client tells an observability stack (Grafana stack)
everything it does: each test run, each program, and later
each step of importing a block. Building documentation and observability from the initial steps.

## The referee

The official *test vectors* (the `davxy/jam-test-vectors` repository, which every JAM
team tests against) are inputs paired with the exact outputs a correct client produces.
They are the referee: when your code and a vector disagree, the vector wins. (Unless the
vectors' own changelog says otherwise. Even referees publish corrections.)

From [lesson 2.6](../02-codec/06-the-first-test-vectors.md) on, your client keeps score: a program of yours runs every official
vector and counts how many it passes, all of each vector, not just a piece of it. The
[scoreboard](../scoreboard.md) page lists the lessons where a family of vectors crosses the line.

## Stuck?

From the repo root, `compare` shows how your client differs from the client after a
lesson (here 2.3), and `catch-up` makes your client that client:

```sh
npm run compare -- 2.3
npm run catch-up -- 2.3
```

`compare` leaves out what changes nothing: spaces, blank lines, the newline at a file's
end, and how your imports are grouped. A file with the same code in another order gets one
line saying so. What's left is what your client does differently.

`catch-up` backs your files up to `.backup/` first, so nothing is ever lost.

## Check your understanding

::: check
**In σ′ ≡ Υ(σ, B), what does your client work out?**

- [ ] B, the next block, from the state σ
  > No: the block comes in from outside. A block importer is handed σ and B, and works out
  > what follows from them.
- [x] σ′, the state after the block, from the state before it and the block
  > Yes: that is Υ. Hand it the state at slot 43 and the block for slot 44, and out comes
  > the state at slot 44.
- [ ] Whether B is valid, and nothing more
  > No: checking the rules is half the job. When the block is valid, the importer also
  > answers with the new state, σ′.

**Two clients import the same block onto the same state, and both follow the rules correctly. What do they get?**

- [ ] Two states that mean the same thing, though the details may differ
  > No: the rules are exact, so there is no room for "close enough". Every correct client
  > gets the same answer, byte for byte.
- [x] Exactly the same new state
  > Yes: that's what makes them clients of the same chain. Applying Υ correctly leaves no
  > choices to make.
- [ ] It depends on the language each client is written in
  > No: lasair is OCaml and yours is TypeScript, and they must still agree. The rules say
  > what the answer is, not how a program gets there.

**Your client and an official test vector disagree. Which is right?**

- [ ] Your client, if all its tests pass
  > No: your tests are only as right as what you wrote in them. A vector holds the exact
  > output a correct client must produce.
- [ ] Whichever answer most JAM clients give
  > No: clients don't vote. The vectors are the referee every team tests against.
- [x] The vector
  > Yes: when your code and a vector disagree, the vector wins. (Unless the vectors' own
  > changelog corrects it: even referees publish corrections.)

**Why do the lessons often watch a test fail before writing the code?**

- [x] A test that has never failed has never proved anything
  > Yes: watching it go red shows it really checks the rule. Then the code turns it green.
- [ ] Because the lesson's code isn't finished yet
  > No: the red is planned. Each run that should fail says how it should fail, and every
  > lesson is followed from an empty folder before you see it.
- [ ] To show what an error looks like, and move on
  > No: the failure is part of the proof, not a demo. A test that passes from the start
  > might be passing because it checks nothing.
:::

## What you have

The map: what JAM is, what your client will do, how a lesson works, and where to turn
when you're stuck. Nothing to run yet. [Lesson 0.2](./02-set-up-the-project.md) sets up
the project, because every lesson after this one runs code and watches it.

Next: [0.2 Set up the project](./02-set-up-the-project.md)
