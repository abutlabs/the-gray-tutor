# Part 0 · Start

**In one sentence:** this Part sets up a client that watches itself, gives it its first
JAM rule, the clock, and maps what it will be checked against.

By the end of this part your client knows JAM's clock, has its first tests, and reports
every run to Grafana, where you'll watch it from now on.

## The big picture

Everything in this Part runs on your own machine. Three things sit side by side:

- **your client**, in `client/`, which starts empty;
- **the observability stack**, in Docker, which the client reports every run to;
- **the official test vectors**, in `vectors/`, which will grade it.

[Lesson 0.1](./01-what-you-will-build.md) says what JAM is, what a client has to do, and
how these lessons work. The client's first rule is the clock: six-second slots, counted
from 12:00 UTC on 1 January 2025. The last two lessons have no code to type. They are
maps: what each kind of vector asks, and the eight stations a block passes through when
it is imported.

## At a glance

The whole part on one map. Boxes are what your client holds, and rounded cards are the
steps between them; a dashed card happens outside your client. Tap any card, or walk
through them in order with *next*.

<PartFlow :part="0" />

- [0.1 What you will build](./01-what-you-will-build.md)
- [0.2 Set up the project](./02-set-up-the-project.md)
- [0.3 Watch your client](./03-watch-your-client.md)
- [0.4 The JAM clock](./04-the-jam-clock.md)
- [0.5 Understanding the vectors](./05-understanding-the-vectors.md)
- [0.6 How a block is imported](./06-how-a-block-is-imported.md)

**Test yourself:** [F0 · Start here: JAM in five minutes](https://abutlabs.github.io/jam-learning/lasair/exam.html?chapter=f00-start-here),
self-test cards on JAM learning.
