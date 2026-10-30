# A session

The official fuzzer runs on its organizers' machines, against a client sent to them; it
isn't something to download and point at your laptop. But its protocol is simple, and the
traces hold everything a fuzzer needs: a genesis state, blocks, and the root after each. So
this lesson writes a small fuzzer of your own, plays a whole trace through your target over
a real Unix socket, and checks every answer. By the end of it your target has survived a
`fuzzy` session, three refused blocks and all.

## New words

- **Session.** One connection between the fuzzer and a target, from handshake to goodbye:
  one Initialize, then as many blocks as the fuzzer sends. *Example:* a trace's 100 blocks.

It's in the [glossary](../glossary.md).

## What a fuzzer does

The protocol's *Workflow*, as your fuzzer does it:

1. **Handshake**, offering ancestry and forks.
2. **Initialize** with the trace's genesis: its header, its state, and an ancestry of one
   block, genesis itself. The answer must be genesis's root.
3. **Each block**, as ImportBlock. A block the trace refuses (its state after is its state
   before) must get an Error; any other, the trace's root.
4. **On the first wrong answer**, GetState for that block, as the official fuzzer does, to
   see the target's state there, and stop.

The session around the fuzzy trace's three refused blocks:

<SessionPlay />

## The code

**New file** `bin/fuzz.ts`

```ts
// A small fuzzer of your own: plays the conformance fuzzer's part (fuzz-proto) with a
// block-import trace, against a target. It starts bin/target.ts itself, unless given the
// socket of a target already running. Each state root is checked against the trace's.
// Usage: npm run fuzz [family] [socket], "fallback" and a fresh target if not given

import { spawn } from "node:child_process";
import type { Socket } from "node:net";
import { connect } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { Block, Header, headerHash } from "../src/block.ts";
import { fromHex, toHex } from "../src/bytes.ts";
import { decode, encode } from "../src/codec/codec.ts";
import { TINY } from "../src/config.ts";
import type { Message } from "../src/fuzz.ts";
import { MessageCodec, frame, readFrames } from "../src/fuzz.ts";
import { Run } from "../src/obs.ts";
import { vectorJson } from "../test/vectors.ts";

type Entries = { key: string; value: string }[];
type Genesis = { header: unknown; state: { state_root: string; keyvals: Entries } };
type TraceStep = {
  pre_state: { state_root: string };
  block: unknown;
  post_state: { state_root: string };
};

const family = process.argv[2] ?? "fallback";
const given = process.argv[3]; // a target already running, if any
const path = given ?? join(tmpdir(), `the-gray-tutor-${process.pid}.sock`);
const start = () => spawn(process.execPath, ["bin/target.ts", path], { stdio: "ignore" });
const target = given ? undefined : start();
/** Connects to the target, trying again for a few seconds while it starts. */
async function connectTo(path: string): Promise<Socket> {
  for (let tries = 0; ; tries++) {
    try {
      return await new Promise((resolve, reject) => {
        const socket = connect(path);
        socket.once("connect", () => resolve(socket));
        socket.once("error", reject);
      });
    } catch (e) {
      if (tries === 100) throw e; // five seconds, and no target
      await sleep(50);
    }
  }
}

const codec = MessageCodec(TINY);
const socket = await connectTo(path);
const replies = readFrames(socket)[Symbol.asyncIterator]();

/** Sends a message and waits for the target's answer. */
async function ask(message: Message): Promise<Message> {
  socket.write(frame(encode(codec, message)));
  const { value } = await replies.next();
  return decode(codec, value!);
}

const run = new Run("fuzz");
const hello = await ask({
  kind: "peer_info",
  value: {
    fuzz_version: 1,
    fuzz_features: 1 | 2, // ancestry and forks
    jam_version: { major: 0, minor: 8, patch: 0 },
    app_version: { major: 0, minor: 1, patch: 0 },
    app_name: new TextEncoder().encode("the-gray-tutor-fuzzer"),
  },
});
const app = hello.kind === "peer_info" ? new TextDecoder().decode(hello.value.app_name) : "?";
console.log(`target: ${app}`);

const genesis = vectorJson(`traces/${family}/genesis.json`) as Genesis;
const header = Header(TINY).fromJson(genesis.header);
const keyvals = genesis.state.keyvals.map((e) => ({
  key: fromHex(e.key),
  value: fromHex(e.value),
}));
const ancestry = [{ slot: header.slot, header_hash: headerHash(TINY, header) }];
const first = await ask({ kind: "initialize", value: { header, keyvals, ancestry } });
const genesisOk =
  first.kind === "state_root" && toHex(first.value) === genesis.state.state_root;
console.log(`initialize: ${genesisOk ? "the genesis root" : "a wrong root"}`);

let agreed = 0;
for (let n = 1; n <= 100; n++) {
  const step = vectorJson(`traces/${family}/${String(n).padStart(8, "0")}.json`) as TraceStep;
  const block = Block(TINY).fromJson(step.block);
  const reply = await ask({ kind: "import_block", value: block });
  const refused = step.post_state.state_root === step.pre_state.state_root;
  const rootOk = reply.kind === "state_root" && toHex(reply.value) === step.post_state.state_root;
  const ok = refused ? reply.kind === "error" : rootOk;
  const why = reply.kind === "error" ? new TextDecoder().decode(reply.value) : "";
  const said = reply.kind === "error" ? `refused, ${why}` : "a root";
  run.event("block", { n, slot: block.header.slot, said, ok });
  if (ok) {
    agreed++;
    continue;
  }
  console.log(`block ${n}: ${said}, not what the trace says`);
  const state = await ask({ kind: "get_state", value: headerHash(TINY, block.header) });
  const entries = state.kind === "state" ? state.value.length : 0;
  console.log(`the target's state there: ${entries} entries`);
  break;
}
console.log(`${agreed} of 100 blocks as the trace has them`);
run.event("done", { family, agreed });
socket.end();
target?.kill();
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

```ts
const start = () => spawn(process.execPath, ["bin/target.ts", path], { stdio: "ignore" });
const target = given ? undefined : start();
```

Unless given a socket, the fuzzer starts a target of its own, `bin/target.ts` on a socket
in your computer's temporary folder, and stops it at the end: one command for a whole
session. Given a socket, it talks to a target you've started yourself, in another
terminal, say, where you can watch what the target logs.

```ts
  const { value } = await replies.next();
```

`ask` sends one message and waits for the next whole frame back: the protocol is strictly
request, then answer. `connectTo` tries again for a few seconds, since a target just started
may not be listening yet.

## Run a session

**What flows through it.** The three faces of a session — the trace replayed as
`fuzz-proto` messages going down the socket, what the fuzzer tracks, the lines it prints:

::: code-group

```text [what goes in]
the fuzzy trace, as fuzz-proto messages, each in its length-prefixed frame:

  peer_info     who's calling: names and versions
  initialize    the genesis header, and its state's 21 key-value pairs
  import_block  slot 1 — then one more per trace step, 100 in all
```

```ts [what it computes]
// the fuzzer's session bookkeeping, family "fuzzy"
const computed = {
  genesisRoot: "0x7cbff2a9…", // the root the target must answer to initialize
  blocks: 100, // one import_block per trace step
  expected: "state_root, or error", // the trace's post root; 3 blocks are made to be refused
  matched: 100, // every answer as the trace has it
};
```

```text [what comes out]
target: the-gray-tutor
initialize: the genesis root
100 of 100 blocks as the trace has them
```

:::

Read the input into the output: `peer_info` comes back with the target's name, the
first line. `initialize` hands over genesis whole, and the target's answering
`state_root` must be the genesis root, `0x7cbff2a9…` — the second line. Then a hundred
`import_block` messages, each answered with the root the trace promises — or, for the three
blocks built to be refused, an `error` — and the last line counts them all matched.

**Run**

```sh
npm pkg set scripts.fuzz="node bin/fuzz.ts"
npm run fuzz fuzzy
```

```text
target: the-gray-tutor
initialize: the genesis root
100 of 100 blocks as the trace has them
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=fuzz-1791774871759
```

A hundred blocks, each answered as the trace has it: the three bad ones with an Error, the
rest with the right root. The *Fuzz session* panel, on **7 · Accumulation and import**, has
every block; the *Target* panel, the target's side.

![Fuzz session panel](./images/03-fuzz-session.png)

The official tools have a fuzzer of this kind too, `minifuzz`, in Python, which replays
recorded sessions. Its recordings so far are for Gray Paper 0.7.0 and 0.7.2, so for 0.8.0
your own fuzzer and the traces stand in for it.

<details>
<summary>lasair: sessions from the traces, in <code>tools/minifuzz080/make_session.py</code></summary>

```python
"""Build a GP 0.8.0 fuzz-proto example SESSION (minifuzz format) from a
jam-test-vectors trace family, using davxy's jam-types-py 0.8.0 as the
encoder/decoder (independent of lasair's codec).

Output files, as in jam-conformance/fuzz-proto/examples:
  NNNNNNNN_fuzzer_<kind>.bin / NNNNNNNN_target_<kind>.bin   (FuzzerMessage, no length prefix)
Session: peer_info, initialize(genesis header + state, no ancestry), then one
import_block per trace step; the expected reply is state_root(post root), or
an `error` when the reference rejected the block (post root == pre root).
```

lasair met the same gap, no 0.8.0 recordings, the same way: sessions made from the
traces, with the same rule for a refused block. It writes them to files in `minifuzz`'s
format and lets the official `minifuzz` play them, so its sessions are encoded by someone
else's codec, the one in the fuzzer's own Python library. Yours encodes with your own
codec, so it can't catch a mistake both sides share; lasair's check does. Worth doing
once you install `minifuzz`.

</details>

## Check your understanding

::: check
**What is a session?**

- [ ] One block, sent and answered
  > No: a session holds many blocks. A trace's 100 can go in one.
- [ ] Everything since the target started
  > No: a target serves one session after another, and each starts fresh, with its
  > own handshake and Initialize.
- [x] One connection, from handshake to goodbye: one Initialize, then as many blocks as the fuzzer sends
  > Yes: your fuzzer's session is a handshake, genesis, then a trace's 100 blocks.

**Your fuzzer sends `fuzzy` block 37. What answer passes?**

- [x] An Error, whatever reason it gives
  > Yes: the trace refuses the block, and doesn't say why. Any Error agrees with it.
- [ ] The root after block 36, since the state stays as it was
  > No: the state does stay as it was, but a refused block gets an Error, not a root.
- [ ] Only an Error saying `bad_code_hash`
  > No: the trace names no rule, so your fuzzer can't hold the target to one. A
  > client that checks in another order could name another.

**On the first wrong answer, why does the fuzzer send GetState?**

- [ ] To reset the target to the state before the block
  > No: GetState only asks. It changes nothing.
- [x] To see the target's state at that block, and find which entries differ
  > Yes: a root says only that something is wrong. The entries say where.
- [ ] To give the target a second try at the block
  > No: it asks for a state, by a header's hash, not for another import.

**Your fuzzer and your target encode with the same codec. What mistake can't that catch?**

- [ ] A wrong state root
  > No: every root is checked against the trace's, which your code didn't make.
- [ ] A block refused that should import
  > No: the trace says which blocks it refuses, and your fuzzer checks each answer
  > against it.
- [x] A codec mistake both sides share
  > Yes: if your codec writes a field wrongly, your fuzzer writes it the same wrong
  > way, and your target reads it back fine. A fuzzer with a codec of its own, as
  > lasair's sessions have, would catch it.
:::

## What you have

A target that has been through a fuzzer's session, over a real socket, on the hardest
trace: a handshake, genesis, a hundred blocks, three refused. One thing is left before the
official fuzzer can meet it: packaging it the way the fuzzer starts targets, [lesson
20.4](./04-ready-to-be-fuzzed.md).

Next: [20.4 Ready to be fuzzed](./04-ready-to-be-fuzzed.md)
