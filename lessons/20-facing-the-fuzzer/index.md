# Part 20 · Facing the fuzzer

JAM clients are checked against the conformance fuzzer, and this is the last part: by the
end of it your client speaks the fuzzer's protocol, keeps its states, and starts the way
the official fuzzer starts its targets.

## The big picture

The test vectors are an exam with the questions known in advance. The traces are past
papers. The fuzzer is an examiner who writes new questions as you sit there.

| Test | Who picks the input | What it catches |
| --- | --- | --- |
| Test vectors | fixed files, one rule at a time | a rule that's wrong on its own |
| Traces | fixed chains of real blocks | rules that are wrong together |
| The fuzzer | generated from a seed, then broken on purpose | what nobody wrote a test for |

It's black-box: it knows nothing of your code or your language. It also plays only the
chain's side: it is a block author and your client is a validator importing its blocks.
Nothing in-core is tested here, because a block importer never runs it. For each block it
makes:

1. It imports the block itself, and works out the state root.
2. It sends the block to your client, over a socket.
3. It compares your client's root with its own.

Same root, and it goes on to the next block. A wrong root ends the session: it asks for
your client's whole state, and writes a report with the seed, so anyone can replay the
failure exactly.

| Question | Lesson | Time |
| --- | --- | --- |
| What do the two sides say to each other? | [20.1](./01-speaking-the-protocol.md) | 6 min |
| What must a client keep to answer? | [20.2](./02-a-target.md) | 6 min |
| What does a whole session look like, and what does it find? | [20.3](./03-a-session.md) | 5 min |
| What does passing prove? | [20.4](./04-ready-to-be-fuzzed.md) | 7 min |

**Builds on** [Part 4 · Blocks](../04-blocks/index.md), [Part 5 · Hashing and
signatures](../05-hashing-and-signatures/index.md), [Part 6 · State and
Merklization](../06-state-and-merklization/index.md) and [Part 19 · Block
import](../19-block-import/index.md), and on the foundations every part uses, [Parts 0 to
2](../index.md#lessons).

## At a glance

The whole part on one map. Boxes are what your client holds, and rounded cards are the
steps between them; a dashed card happens outside your client. Tap any card, or walk
through them in order with *next*.

<PartFlow :part="20" />

**Starting here?** At the repo root, `npm run catch-up -- 19.6` makes your client the one
this part starts from; [How to read it](../index.md#how-to-read-it) says more.

- [20.1 Speaking the protocol](./01-speaking-the-protocol.md)
- [20.2 A target](./02-a-target.md)
- [20.3 A session](./03-a-session.md)
- [20.4 Ready to be fuzzed](./04-ready-to-be-fuzzed.md)
