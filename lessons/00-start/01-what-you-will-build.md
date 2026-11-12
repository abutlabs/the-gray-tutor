# What you will build

**In one sentence:** you will write a JAM client, a program that takes a block, checks it
against every rule of the Gray Paper, and works out what the chain looks like afterwards,
byte for byte as every other JAM client does.

Want the whole system on one page first? [What runs where](../what-runs-where.md) is the
map. This lesson gives you the words for it.

## The idea

How can programs written by different teams, in different languages, agree on what a chain
holds? They all follow one rule book. [*JAM*](../glossary.md#jam) is a blockchain
protocol, and the [*Gray Paper*](../glossary.md#gray-paper) is its specification: every
rule, mostly in equations.

The chain remembers a [*state*](../glossary.md#state): who the validators are, every
service's data, the time. "It's slot 43" is part of the state. A
[*block*](../glossary.md#block) is a batch of new information, at most one every six
seconds. Each block changes the state, by fixed rules. Taken together, those rules are the
[*state transition*](../glossary.md#state-transition): the state at slot 43, and the block
for slot 44, give the state at slot 44.

A [*client*](../glossary.md#client) is a program that applies those rules. They leave no
choices to make, so every correct client gets exactly the same new state.

How do you know yours is correct? The official
[*test vectors*](../glossary.md#test-vector): an input, with the exact output a correct
client must produce from it.

This lesson is the map: the one equation the tutorial builds, the road to it, and how a
lesson works.

## What the Gray Paper says

The Gray Paper is still being improved, and new versions change rules. This tutorial
follows version 0.8.0. "§4" means its section 4, and §4, *Overview*, opens with the whole
thing in one equation:

::: gray-paper 4

#### §4 Overview {#gp-4}

<a id="gp-4-p1"></a>As in the Yellow Paper, we begin our formalisms by recalling that a blockchain may be defined as a pairing of some initial state together with a block-level state-transition function. The latter defines the <abbr class="gp-term" title="after the change: the value once it is made, written with a prime (α′); for state, after the block">posterior</abbr> state given a pairing of some prior state and a block of data applied to it. Formally, we say:

<a id="gp-4-p2"></a><a id="eq-4-1"></a>

$$
\begin{align}
\sigma' \equiv \Upsilon(\sigma, \mathbf{B}) \tag{4.1}
\end{align}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-thestate" class="gk-wrap">[$\sigma$](../symbols.md#state)</span> | sigma | the state: everything the chain remembers between blocks |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-transitionstate" class="gk-wrap">[$\Upsilon$](../symbols.md#transition)</span> | upsilon | the state transition: the state and a block in, the next state out |
| <span id="gk-block" class="gk-wrap">[$\mathbf{B}$](../symbols.md#block)</span> | B | a block: its header and its extrinsic |

</details>

→ [(4.1) explained](./gray-paper.md#ex-4-1)

<a id="gp-4-p3"></a>Where $\sigma$ is the prior state, $\sigma'$ is the posterior state, $B$ is some valid block and $\Upsilon$ is our block-level state-transition function.

<a id="gp-4-p4"></a>Broadly speaking, JAM (and indeed blockchains in general) may be defined simply by specifying $\Upsilon$ and some *<abbr class="gp-term" title="the chain's first block and state">genesis</abbr> state* $\sigma^0$.<sup>1</sup> We also make several additional assumptions of agreed knowledge: a universally known clock, and the practical means of sharing data with other systems operating under the same consensus rules. The latter two were both assumptions silently made in the *YP*.

<small class="gp-note"><sup>1</sup> Practically speaking, blockchains sometimes make assumptions of some fraction of participants whose behavior is simply *honest*, and not provably incorrect nor otherwise economically disincentivized. While the assumption may be reasonable, it must nevertheless be stated apart from the rules of state-transition.</small>

:::

Read (4.1) as "sigma prime is defined as upsilon of sigma and B":

- **σ** (sigma) is the chain's state before a block: seventeen parts, sixteen fixed ones
  from validator keys to the last few blocks, plus the service accounts.
- **B** is the block.
- **σ′** (sigma prime) is the state after it.
- **Υ** (upsilon) is the state transition, the machine that turns one into the other.

So a blockchain, says the Gray Paper, is a starting state (the genesis state) plus Υ.
Almost every other page of the paper describes one piece of Υ. The paper also assumes two
things it doesn't define: a clock every node agrees on
([lesson 0.4](./04-the-jam-clock.md)), and a way for nodes to share data.

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

After each **Run** block comes the output you should see, in a block of its own (*Output*
on the website; an `npm install` has none, since it only prints downloads). Put it next to
your terminal. A line `...` marks where lines are cut, and `…` a part that changes from
run to run. Times, durations and run ids will differ too. So may a line number in an
error, by one or two, if your imports sit differently. Paths are inside `client/`.

A code block with no label above it is for reading, unless the words around it say to type
it and where, as the setup commands in [lesson 0.2](./02-set-up-the-project.md) do.

On the website, a label is a link back to this list. An **Add to** or **Replace in** block
shows the whole file after that step: the lines the step adds or changes are highlighted,
the rest dimmed. A long stretch you haven't touched folds to a line such as *⋯ 42
unchanged lines*, which a tap opens. The eye in its corner shows just the step's lines,
and back.

A word in italics that is a link, like *state* above, opens its entry in the
[glossary](../glossary.md).

### Meet Albert {#albert}

Meet Albert. You'll probably see him around class.

![Albert sticking his tongue out](./images/01-albert-tongue.svg)

## You will see everything

From [lesson 0.3](./03-watch-your-client.md) on, your client tells an observability stack
(the Grafana stack) everything it does: each test run, each program, and later each step
of importing a block.

## The referee

The official test vectors live in the `davxy/jam-test-vectors` repository, and every JAM
team tests against them. They are the referee: when your code and a vector disagree, the
vector wins. (Unless the vectors' own changelog says otherwise. Even referees publish
corrections.)

From [lesson 2.6](../02-codec/06-the-first-test-vectors.md) on, your client keeps score: a
program of yours runs every official vector and counts how many it passes, all of each
vector, not just a piece of it. The [scoreboard](../scoreboard.md) page lists the lessons
where a family of vectors crosses the line.

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
**What, by the Gray Paper, defines a blockchain?**

- [ ] The list of every block so far
  > No: blocks are what gets applied. The definition is a starting state, plus the rule
  > that applies a block to a state.
- [ ] The network of nodes that share blocks
  > No: the paper assumes nodes can share data, and have a clock they agree on. It defines
  > neither.
- [x] A starting state, and a function that takes a state and a block to the next state
  > Yes: the genesis state plus Υ. Almost every other page of the paper describes one
  > piece of Υ.

**What is a block importer, and what does it answer?**

- [ ] A program that makes the next block from the state
  > No: the block comes in from outside. An importer is handed a state and a block, and
  > works out what follows from them.
- [x] A program that computes Υ: it answers "valid, and here is the new state", or "invalid"
  > Yes: hand it the state at slot 43 and the block for slot 44, and out comes the state
  > at slot 44. It is the first milestone, M1.
- [ ] A program that says whether a block is valid, and nothing more
  > No: checking the rules is half the job. When the block is valid, the importer also
  > answers with the new state, σ′.

**Two clients import the same block onto the same state, and both follow the rules correctly. What do they get?**

- [x] Exactly the same new state
  > Yes: that's what makes them clients of the same chain. Applying Υ correctly leaves no
  > choices to make.
- [ ] Two states that mean the same thing, though the details may differ
  > No: the rules are exact, so there is no room for "close enough". Every correct client
  > gets the same answer, byte for byte.
- [ ] It depends on the language each client is written in
  > No: a client in OCaml and yours in TypeScript must still agree. The rules say what the
  > answer is, not how a program gets there.

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

- [ ] Because the lesson's code isn't finished yet
  > No: the red is planned. Each run that should fail says how it should fail, and every
  > lesson is followed from an empty folder before you see it.
- [x] A test that has never failed has never proved anything
  > Yes: watching it go red shows it really checks the rule. Then the code turns it green.
- [ ] To show what an error looks like, and move on
  > No: the failure is part of the proof, not a demo. A test that passes from the start
  > might be passing because it checks nothing.
:::

## What you have

The map: what JAM is, what your client will do, how a lesson works, and where to turn
when you're stuck. Nothing to run yet. [Lesson 0.2](./02-set-up-the-project.md) sets up
the project, because every lesson after this one runs code and watches it.

Next: [0.2 Set up the project](./02-set-up-the-project.md)
