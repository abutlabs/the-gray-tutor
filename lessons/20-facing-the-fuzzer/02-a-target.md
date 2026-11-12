# A target

**In one sentence:** a fuzz target is a client that listens on a socket and answers the
fuzzer, keeping every state it has made so that a block can be imported onto any of them.

Send a target messages, in any order, and watch which states it keeps.

<a id="try-it"></a>

<TargetStates />

## The idea

A [*fuzz target*](../glossary.md#fuzz-target) is a client that answers the fuzzer. It
listens on a socket, takes the messages one at a time, and replies to each.

Why would it keep more than one state? The fuzzer sends a few broken versions of a block
before the real one, each built on the same parent. So a target must be able to import
onto any state it has made, not just the newest. Think of a chess player asked to try
several moves from one position: the position has to stay on the board.

There is also one rule of block import your client hasn't been able to check until now,
because it needs blocks older than the state remembers. A report names its
[*lookup anchor*](../glossary.md#lookup-anchor): the block a work-package read its
preimages from while it was refined. To check that the anchor really is one of the
chain's blocks, a client keeps the [*ancestry*](../glossary.md#ancestry): the last L
blocks of the chain, by slot and header hash.

By the end of this lesson your client is a target. Everything but the socket is tested,
and the socket comes with it.

## What the protocol says

`fuzz-proto`'s message table and *General Rules*, in plain steps:

1. **PeerInfo first.** The fuzzer introduces itself; the target answers with its own. The
   *features* both offer, combined bit by bit with AND, are the session's: ancestry (1) and forks (2).
2. **Initialize, once.** A header, a state's entries and its ancestry. The target keeps the
   state under the header's hash, exactly as given, and answers with its root. A second
   Initialize in the same session closes the connection.
3. **ImportBlock.** The block's parent must be a state the target has; it imports the block
   onto it and answers with the new root, keeping the new state under the block's hash.
   A refused block gets an Error, and changes nothing. Forks are one block deep: several
   blocks may share a parent, but none builds on a refused one.
4. **GetState.** The entries of the state under a header's hash: the fuzzer asks when a
   root came out wrong, to see why.

Try each rule on [the target at the top](#try-it): a second Initialize, a block on a
parent it doesn't have, two blocks on one parent.

## What the Gray Paper says

§11, *Contextual Validity of Reports*: each report's lookup anchor must be

1. **recent**: its slot at least the block's slot minus L (24 on tiny, 14,400 on full);
2. **known**: one of the last L blocks of the chain, the ancestry, with that same hash and
   slot.

<AnchorWindow />

The first is on-chain arithmetic. The second needs headers the state doesn't keep (β
remembers only eight), so a client keeps them itself. When the fuzzer and the target both
offer the ancestry feature, the fuzzer sends the last L blocks in Initialize, and the
target adds each block it imports. Without the feature, the protocol says to skip the
check. The traces never needed it: their tests gave your importer no ancestry, so
`importBlock` skips the check when it gets none.

One honest note. The Gray Paper also asks that the lookup anchor's state root be the one
its child block names. The protocol's ancestry gives only slots and hashes, so the base
rule here checks those two. [HARDENING.md](https://github.com/abutlabs/the-gray-tutor/blob/main/HARDENING.md) keeps the rest.

## The tests

**New file** `test/target.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { Block, Header, headerHash } from "../src/block.ts";
import { fromHex, toHex } from "../src/bytes.ts";
import { TINY } from "../src/config.ts";
import type { Message } from "../src/fuzz.ts";
import type { Session } from "../src/target.ts";
import { answer, newSession } from "../src/target.ts";
import { vectorJson } from "./vectors.ts";

type Entries = { key: string; value: string }[];
type Genesis = { header: unknown; state: { state_root: string; keyvals: Entries } };
type TraceStep = { block: unknown; post_state: { state_root: string; keyvals: Entries } };

/** The fuzzer's first two messages for a trace: a PeerInfo, and Initialize with genesis. */
function opening(family: string, features: number): Message[] {
  const genesis = vectorJson(`traces/${family}/genesis.json`) as Genesis;
  const header = Header(TINY).fromJson(genesis.header);
  const keyvals = genesis.state.keyvals.map((e) => ({
    key: fromHex(e.key),
    value: fromHex(e.value),
  }));
  const version = { major: 0, minor: 8, patch: 0 };
  const peer = {
    fuzz_version: 1,
    fuzz_features: features,
    jam_version: version,
    app_version: version,
    app_name: new TextEncoder().encode("test"),
  };
  const ancestry = [{ slot: 0, header_hash: headerHash(TINY, header) }];
  return [
    { kind: "peer_info", value: peer },
    { kind: "initialize", value: { header, keyvals, ancestry } },
  ];
}

/** Block n of a trace, as an ImportBlock message, and the trace's state after it. */
function importing(family: string, n: number) {
  const step = vectorJson(`traces/${family}/${String(n).padStart(8, "0")}.json`) as TraceStep;
  const message: Message = { kind: "import_block", value: Block(TINY).fromJson(step.block) };
  return { message, after: step.post_state };
}

test("a session: a handshake, genesis, ten blocks with each root the trace's, a state", () => {
  const session: Session = newSession();
  const [hello, initialize] = opening("storage", 1); // the fuzzer offers ancestry only
  const reply = answer(TINY, session, hello);
  assert.equal(reply?.kind, "peer_info");
  assert.equal(session.features, 1); // what both can do: 1 & (1 | 2)
  const genesis = vectorJson("traces/storage/genesis.json") as Genesis;
  const first = answer(TINY, session, initialize);
  assert.deepEqual(first, { kind: "state_root", value: fromHex(genesis.state.state_root) });
  for (let n = 1; n <= 10; n++) {
    const { message, after } = importing("storage", n);
    const root = answer(TINY, session, message);
    assert.deepEqual(root, { kind: "state_root", value: fromHex(after.state_root) }, `block ${n}`);
  }
  const { message, after } = importing("storage", 10);
  const hash = headerHash(TINY, (message as { value: Block }).value.header);
  const state = answer(TINY, session, { kind: "get_state", value: hash });
  const entries: number = state?.kind === "state" ? state.value.length : 0;
  assert.equal(entries, after.keyvals.length);
});

test("a block whose parent the target never saw: an Error; a second Initialize: goodbye", () => {
  const session: Session = newSession();
  const [hello, initialize] = opening("fallback", 3);
  answer(TINY, session, hello);
  answer(TINY, session, initialize);
  const { message } = importing("fallback", 5); // its parent, block 4, never came
  const reply = answer(TINY, session, message);
  const said: string = reply?.kind === "error" ? new TextDecoder().decode(reply.value) : "";
  assert.equal(said, "the parent block is unknown");
  const again = answer(TINY, session, initialize);
  assert.equal(again, null); // close the connection
});
```

## The code

The lookup anchors first:

**Replace in** `src/import.ts`

```ts
import type { AncestryItem } from "./fuzz.ts";

/**
 * Υ (GP §4): imports a block into a state, given as its entries. The state after the
 * block, as entries; or why the block is refused, and then the state stays as it was.
 * The steps are the earlier parts', each after everything it needs (lesson 19.1's waves).
 */
export function importBlock(
  config: Config,
  entries: KeyValue[],
  block: Block,
  ancestry?: AncestryItem[], // the last L blocks, when the importer keeps them (lesson 20.2)
): KeyValue[] | Refused {
  const state = readState(config, entries);
  const headerProblem = checkHeader(config, state, entries, block);
  if (headerProblem) return { error: headerProblem };
  const judged = judgeDisputes(config, state, block); // ψ′, ρ†
  if (refused(judged)) return judged;
  const sealed = runSafrole(config, state, block, judged.judgements.offenders); // γ′, η′, κ′...
  if (refused(sealed)) return sealed;
  const assured = takeAssurances(state, block, judged.cores, sealed.validators.active); // 𝐑, ρ‡
  if (refused(assured)) return assured;
  const offenders = judged.judgements.offenders; // ψ′_O
  const guaranteed = takeGuarantees(config, state, block, assured.cores, sealed, offenders); // ρ′
  if (refused(guaranteed)) return guaranteed;
  const anchorProblem = anchorError(config, guaranteed.reports, block.header.slot, ancestry);
  if (anchorProblem) return { error: anchorProblem };
  const slot = block.header.slot; // τ′
  const accumulation = accumulateBlock(
    config, accumulationState(state, sealed.entropy[0]), slot, assured.reports,
  );
  const after = nextState(config, state, block, {
    judgements: judged.judgements, sealed, assured, guaranteed, accumulation,
  });
  return providePreimages(writeState(config, after), block.extrinsic.preimages, slot); // δ′
}
```

**Add to** `src/import.ts`

```ts
/**
 * The lookup anchors (GP §11): each report's lookup anchor is at most L slots old, and,
 * when the importer keeps the last L blocks, one of them, by its hash and its slot.
 */
function anchorError(
  config: Config,
  reports: WorkReport[],
  slot: number, // H_T
  ancestry?: AncestryItem[],
): string | null {
  const known = new Map(ancestry?.map((a) => [toHex(a.header_hash), a.slot]));
  for (const { context } of reports) {
    if (context.lookup_anchor_slot < slot - config.max_lookup_anchor_age) {
      return "lookup_anchor_too_old";
    }
    if (ancestry && known.get(toHex(context.lookup_anchor)) !== context.lookup_anchor_slot) {
      return "lookup_anchor_unknown";
    }
  }
  return null;
}
```

```ts
  const anchorProblem = anchorError(config, guaranteed.reports, block.header.slot, ancestry);
```

`ancestry` is the last argument and may be left out. The tests from
[lesson 19.4](../19-block-import/04-importing-a-block.md) on pass no ancestry, and their
blocks import as before.

Then the target's side of a session, with no socket in sight:

**New file** `src/target.ts`

```ts
// A fuzz target (fuzz-proto): the client's side of a session with the conformance fuzzer.
// It keeps every state it has made, by its block's header hash, and answers each message.

import { toHex } from "./bytes.ts";
import type { Config } from "./config.ts";
import { headerHash } from "./block.ts";
import type { Message, PeerInfo, AncestryItem } from "./fuzz.ts";
import { importBlock } from "./import.ts";
import type { KeyValue } from "./trie.ts";
import { stateRoot } from "./trie.ts";

/** The features this target supports (fuzz-proto): ancestry (1) and simple forks (2). */
const FEATURES = 1 | 2;

/** How this target introduces itself. */
const ME: PeerInfo = {
  fuzz_version: 1,
  fuzz_features: FEATURES,
  jam_version: { major: 0, minor: 8, patch: 0 },
  app_version: { major: 0, minor: 1, patch: 0 },
  app_name: new TextEncoder().encode("the-gray-tutor"),
};

/** A state the target has made: its entries, and the last L blocks of its chain. */
type Kept = { entries: KeyValue[]; ancestry: AncestryItem[] };

/** One session: the features both sides have, and every state made, by header hash. */
export type Session = { features: number; initialized: boolean; states: Map<string, Kept> };

/** A session before its handshake. */
export function newSession(): Session {
  return { features: 0, initialized: false, states: new Map() };
}

/** How many states a session keeps: forks are one block deep, so a few are plenty. */
const KEEP = 32;

/**
 * The target's answer to one of the fuzzer's messages (fuzz-proto), or null to close the
 * connection: after a second Initialize, or a message no target should get.
 */
export function answer(config: Config, session: Session, message: Message): Message | null {
  switch (message.kind) {
    case "peer_info":
      session.features = message.value.fuzz_features & FEATURES; // what both can do
      return { kind: "peer_info", value: ME };
    case "initialize": {
      if (session.initialized) return null; // one Initialize per session
      session.initialized = true;
      session.states.clear();
      const { header, keyvals, ancestry } = message.value;
      keep(session, toHex(headerHash(config, header)), { entries: keyvals, ancestry });
      return { kind: "state_root", value: stateRoot(keyvals) };
    }
    case "import_block": {
      const block = message.value;
      const parent = session.states.get(toHex(block.header.parent));
      if (!parent) return error("the parent block is unknown");
      const ancestry = session.features & 1 ? parent.ancestry : undefined;
      const after = importBlock(config, parent.entries, block, ancestry);
      if ("error" in after) return error(after.error); // the state stays as it was
      const hash = headerHash(config, block.header);
      const chain = [...parent.ancestry, { slot: block.header.slot, header_hash: hash }];
      const L = config.max_lookup_anchor_age;
      keep(session, toHex(hash), { entries: after, ancestry: chain.slice(-L) });
      return { kind: "state_root", value: stateRoot(after) };
    }
    case "get_state":
      return { kind: "state", value: session.states.get(toHex(message.value))?.entries ?? [] };
    default:
      return null; // the fuzzer never sends the other kinds
  }
}

/** An Error message, with a reason for whoever reads the logs. */
function error(reason: string): Message {
  return { kind: "error", value: new TextEncoder().encode(reason) };
}

/** Keeps a state under its header's hash, forgetting the oldest beyond KEEP. */
function keep(session: Session, hash: string, kept: Kept) {
  session.states.set(hash, kept);
  if (session.states.size > KEEP) session.states.delete(session.states.keys().next().value!);
}
```

```ts
      const chain = [...parent.ancestry, { slot: block.header.slot, header_hash: hash }];
      const L = config.max_lookup_anchor_age;
      keep(session, toHex(hash), { entries: after, ancestry: chain.slice(-L) });
```

Each state keeps the last L blocks of its own chain, so a block built on any kept state is
checked against the right ancestry, fork or no fork. A session keeps 32 states, plenty for
forks one block deep.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ a session: a handshake, genesis, ten blocks with each root the trace's, a state (6249.407583ms)
✔ a block whose parent the target never saw: an Error; a second Initialize: goodbye (7.073583ms)
...
ℹ tests 653
ℹ suites 0
ℹ pass 653
ℹ fail 0
...
reported 653 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791774851666
...
```

And the socket around it:

**New file** `bin/target.ts`

```ts
// Your client as a fuzz target: listens on a Unix socket, and answers the conformance
// fuzzer's messages (fuzz-proto), one session after another, until stopped (Ctrl+C).
// Usage: npm run target [socket], /tmp/jam_target.sock if not given

import { existsSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { toHex } from "../src/bytes.ts";
import { decode, encode } from "../src/codec/codec.ts";
import { TINY } from "../src/config.ts";
import { MessageCodec, frame, readFrames } from "../src/fuzz.ts";
import type { Message } from "../src/fuzz.ts";
import { Run } from "../src/obs.ts";
import { answer, newSession } from "../src/target.ts";

const path = process.argv[2] ?? "/tmp/jam_target.sock";
const codec = MessageCodec(TINY);
if (existsSync(path)) rmSync(path); // a socket left by an earlier run

/** One line about a message, for the console and Grafana. */
function describe(m: Message): string {
  if (m.kind === "peer_info") return `peer_info from ${new TextDecoder().decode(m.value.app_name)}`;
  if (m.kind === "import_block") return `import_block, slot ${m.value.header.slot}`;
  if (m.kind === "state_root") return `state_root ${toHex(m.value).slice(0, 10)}…`;
  if (m.kind === "error") return `error: ${new TextDecoder().decode(m.value)}`;
  if (m.kind === "state") return `state, ${m.value.length} entries`;
  return m.kind;
}

const server = createServer(async (socket) => {
  const session = newSession();
  const run = new Run("target");
  try {
    for await (const bytes of readFrames(socket)) {
      const request = decode(codec, bytes);
      const reply = answer(TINY, session, request);
      const said = reply ? describe(reply) : "closing";
      console.log(`${describe(request)} → ${said}`);
      run.event("message", { request: describe(request), reply: said });
      if (!reply) break;
      socket.write(frame(encode(codec, reply)));
    }
  } catch (e) {
    console.log(`closing: ${(e as Error).message}`); // a message no codec could read
  }
  socket.end();
  const link = await run.report();
  if (link) console.log(`session over; reported to Grafana: ${link}`);
});
/** Stopping (Ctrl+C, or kill): the socket's file goes too, so no fuzzer finds a dead one. */
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    rmSync(path, { force: true });
    process.exit(0);
  });
}

server.listen(path, () => console.log(`listening on ${path}`));
```

```ts
  try {
    for await (const bytes of readFrames(socket)) {
```

A Node socket is a stream of bytes, so `readFrames` reads it as is. Anything wrong inside
a session, a message no codec can read, say, ends that session, not the target. The
`catch` closes the socket, and the server keeps listening for the next one. When the
target is stopped, it removes its socket's file: a file left behind would look like a
target to the next fuzzer, with nobody there.

[Lesson 20.3](./03-a-session.md) runs it, with a fuzzer to talk to.

<details>
<summary>lasair: its ancestry, in <code>bin/conformance_target.ml</code></summary>

```ocaml
(* ---- feature-ancestry: lookup-anchor record check (Conformance.Ancestry) --
   A report's lookup-anchor must reference one of the last L headers on the
   importing block's chain, with the right slot and (GP 0.8.0) the right
   posterior state root where its child header is known. The window is the chain ending
   at the block's parent, walked over parent links that are seeded from
   the Initialize ancestry and extended by every imported block. This is
   an importer-level check (the STF state β keeps only 8 blocks, so the
   trace vectors cannot and do not exercise it); it runs ONLY when
   ancestry was negotiated — "when this feature is disabled the check
   should also be skipped". *)
```

The same rule, and the same reason it lives in the target rather than the state
transition: β keeps eight blocks, and L is 24. lasair walks parent links back from the
block's parent; your target keeps each state's own last L blocks beside it. lasair also
checks the anchor's state root where it knows the child header, the part your client
leaves to [HARDENING.md](https://github.com/abutlabs/the-gray-tutor/blob/main/HARDENING.md).

</details>

## Check your understanding

::: check
**Why must a target keep more than one state?**

- [ ] To undo a refused block
  > No: a refused block changes nothing, so there's nothing to undo.
- [x] Several blocks may be built on the same parent, so it must import onto any state it has made
  > Yes: the fuzzer sends a few broken versions of a block before the real one, each
  > on the same parent. Each needs that parent's state, not the newest.
- [ ] So GetState can answer for every block of the session
  > No: it keeps only 32 states. Forks are one block deep, so that's plenty.

**Why can't the state transition check, alone, that a lookup anchor is one of the chain's blocks?**

- [x] β remembers only eight blocks, and an anchor can be up to L = 24 slots old on tiny
  > Yes: the state hasn't kept the blocks to check against. So the target keeps the
  > last L blocks itself, the ancestry.
- [ ] An anchor is a hash, and a hash can't be checked
  > No: it's checked the easy way, by finding a block with that hash and slot in the
  > ancestry.
- [ ] The Gray Paper makes the check optional
  > No: §11 asks for it. The protocol says to skip it only when the ancestry feature
  > is off, since then the target has nothing to check against.

**The fuzzer offers features 1 (ancestry); your target offers 1 | 2 = 3. What does the session use?**

- [ ] 3: everything either side can do
  > No: that's OR. A feature only works if both sides do it.
- [x] 1: ancestry only
  > Yes: 1 AND 3 = 1. The fuzzer doesn't do forks, so the session doesn't.
- [ ] 2: forks only
  > No: the fuzzer didn't offer forks. 2 is the bit only your target has.

**The fuzzer sends a broken block, and the target answers with an Error. What happens to the states it keeps?**

- [ ] The parent's state is dropped, since a bad block was built on it
  > No: the parent is still good, and the real block will need it next.
- [x] Nothing: no new state is kept, and the parent's is still there
  > Yes: a refused block changes nothing. The next block on the same parent imports
  > as if the broken one never came.
- [ ] The session ends, and the fuzzer must start a new one
  > No: an Error is an answer like any other, and the session goes on to the next
  > message.
:::

## What you have

A fuzz target: the handshake, a state from Initialize, blocks imported onto any state it
has kept, refusals answered with an Error, states handed over when asked, and the lookup
anchors checked against the chain's own ancestry. What it needs now is a fuzzer.
[Lesson 20.3](./03-a-session.md) writes a small one.

**Say it out loud.** A target keeps several states, because the fuzzer sends broken versions of a block on the same parent. A refused block changes nothing.

Next: [20.3 A session](./03-a-session.md)
