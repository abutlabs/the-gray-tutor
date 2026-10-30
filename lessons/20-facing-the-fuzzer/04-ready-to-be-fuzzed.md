# Ready to be fuzzed

The official fuzzer starts each target the same way: as a Docker image for Linux on Intel
chips (`linux/amd64`), told what to do by a few environment variables, with nothing typed
on a command line. This lesson packages your target that way. It's short, and it's the
last: at the end of it, your client is a block importer that the conformance fuzzer could
start and talk to, as it does every JAM client.

## New words

- **Environment variable.** A named setting a program reads from the environment it was
  started in, not from its arguments. *Example:* `JAM_FUZZ_SPEC=tiny`.
- **Docker image.** A program packaged with everything it needs to run, from the operating
  system up, so that [Docker](../00-start/02-set-up-the-project.md) can start it anywhere the same way. *Example:* the
  `node:26.11.1-bookworm-slim` image, with Node 26 on Debian.

Both are in the [glossary](../glossary.md).

## What the protocol says

`fuzz-proto`, *Standard Target Packaging*:

1. **An image for `linux/amd64`**, kept small.
2. **The variables.** `JAM_FUZZ` turns fuzz mode on. Then `JAM_FUZZ_SPEC` (`tiny` or
   `full`), `JAM_FUZZ_DATA_PATH` (a folder the target may keep things in) and
   `JAM_FUZZ_SOCK_PATH` (where to listen) must all be set, and a target must refuse to start
   if any is missing. `JAM_FUZZ_LOG_LEVEL` is optional.
3. **One session after another.** When the fuzzer disconnects, the target keeps listening
   for the next session, without a restart. Yours already does ([lesson 20.2](./02-a-target.md)).

## The code

**Rewrite** `bin/target.ts`

```ts
// Your client as a fuzz target: listens on a Unix socket, and answers the conformance
// fuzzer's messages (fuzz-proto), one session after another, until stopped (Ctrl+C).
// Usage: npm run target [socket], /tmp/jam_target.sock if not given; or, as the
// official fuzzer starts it, with JAM_FUZZ, JAM_FUZZ_SPEC, JAM_FUZZ_DATA_PATH and
// JAM_FUZZ_SOCK_PATH set, and no arguments.

import { chmodSync, existsSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { toHex } from "../src/bytes.ts";
import { decode, encode } from "../src/codec/codec.ts";
import { FULL, TINY } from "../src/config.ts";
import { MessageCodec, frame, readFrames } from "../src/fuzz.ts";
import type { Message } from "../src/fuzz.ts";
import { Run } from "../src/obs.ts";
import { answer, newSession } from "../src/target.ts";

const fuzzing = process.env.JAM_FUZZ !== undefined; // started by the official fuzzer
const needed = ["JAM_FUZZ_SPEC", "JAM_FUZZ_DATA_PATH", "JAM_FUZZ_SOCK_PATH"];
const missing = needed.filter((name) => !process.env[name]);
if (fuzzing && missing.length > 0) {
  console.log(`refusing to start: ${missing.join(", ")} not set`);
  process.exit(1);
}
const config = fuzzing && process.env.JAM_FUZZ_SPEC === "full" ? FULL : TINY;
const path = (fuzzing ? process.env.JAM_FUZZ_SOCK_PATH : process.argv[2]) ?? "/tmp/jam_target.sock";
const codec = MessageCodec(config);
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
      const reply = answer(config, session, request);
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
server.listen(path, () => {
  chmodSync(path, 0o666); // the fuzzer may run as another user
  console.log(`listening on ${path}`);
});
```

```ts
if (fuzzing && missing.length > 0) {
  console.log(`refusing to start: ${missing.join(", ")} not set`);
  process.exit(1);
}
```

Run without `JAM_FUZZ`, the target works as before, on the socket you give it. With it,
everything comes from the environment, and nothing missing is guessed. One more line,
`chmodSync(path, 0o666)`, lets anyone on the computer use the socket: the fuzzer may run as
another user than your target.

**Run, expect it to fail**

```sh
npm pkg set scripts.target="node bin/target.ts"
JAM_FUZZ=1 npm run target
```

```text
refusing to start: JAM_FUZZ_SPEC, JAM_FUZZ_DATA_PATH, JAM_FUZZ_SOCK_PATH not set
```

**Run**

```sh
mkdir -p /tmp/jam
npm pkg set scripts.target-tiny="JAM_FUZZ=1 JAM_FUZZ_SPEC=tiny JAM_FUZZ_DATA_PATH=/tmp/jam JAM_FUZZ_SOCK_PATH=/tmp/jam/fuzz.sock node bin/target.ts"
npm pkg set scripts.fuzz-target="node bin/fuzz.ts safrole /tmp/jam/fuzz.sock"
npm run target-tiny > /dev/null 2>&1 &
npm run fuzz-target
kill $!
```

```text
target: the-gray-tutor
initialize: the genesis root
100 of 100 blocks as the trace has them
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=fuzz-1791774913630
```

The target, started the fuzzer's way, and a session with it: `target-tiny` is the
target with the four variables set, `&` runs it in the background, your fuzzer talks to it
on the socket the variables named, and `kill $!` stops it.

## The image

**New file** `Dockerfile`

```dockerfile
# The client as a fuzz target, packaged as the official fuzzer runs targets: a linux/amd64
# image whose entry point is bin/target.ts, set up by JAM_FUZZ_* environment variables.
FROM node:26.11.1-bookworm-slim
WORKDIR /client
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY src ./src
COPY bin/target.ts ./bin/target.ts
ENTRYPOINT ["node", "bin/target.ts"]
```

**New file** `.dockerignore`

```text
node_modules
```

The image installs only what the client runs on (`npm ci --omit=dev`: no TypeScript, no
type definitions; Node strips the types itself), and copies `src/` and the target. Its
entry point is `bin/target.ts`, so the variables are all it needs. `.dockerignore` keeps
your own `node_modules`, built for your computer, out of it.

Building it for `linux/amd64` on a computer with another chip (an Apple Silicon Mac, say)
takes a little longer, since Docker emulates the other chip. These two commands aren't
part of the tutorial's checks: they need Docker, and its first build downloads a few
hundred megabytes. When this lesson was written, the image built, the Bandersnatch
library loaded in it as native code, and the target started and listened:

```sh
docker build --platform linux/amd64 -t the-gray-tutor-target .
docker run --platform linux/amd64 -e JAM_FUZZ=1 -e JAM_FUZZ_SPEC=tiny -e JAM_FUZZ_DATA_PATH=/tmp/jam/data -e JAM_FUZZ_SOCK_PATH=/tmp/jam/fuzz.sock the-gray-tutor-target
```

The official fuzzer starts the image itself, with its own socket path, and connects.
Its *lanes* (from replays of recorded sessions, through generated blocks with mutations,
to changing validator sets) go further than any trace, and the rows of
[HARDENING.md](https://github.com/abutlabs/the-gray-tutor/blob/main/HARDENING.md) are where to look when a session ends with a wrong root.

## The scoreboard

The whole board rests on vectors like this one, block 50 of the `storage` trace, and the board's rows for the two storage traces:

::: code-group

```json [what goes in]
{
  "vector": "vectors/traces/storage/00000050.json",
  "pre_state.keyvals": "171 entries",
  "block.header": {
    "slot": 50,
    "parent": "0xdc20a8a8…",
    "parent_state_root": "0x9a67c892…",
    "author_index": 2
  },
  "post_state.state_root": "0x112c2842…"
}
```

```text [console]
traces/storage         100 of 100  ✔
traces/storage_light   100 of 100  ✔

1,406 of 1,428 vectors pass.
```

:::

Same rule as every trace: import the block into the state before it, and your root must be the trace's. The `storage` and `storage_light` rows are 100 blocks each of exactly that, and the totals line below them is the whole board's.

One last look at the board, with everything your client does:

**Run**

```sh
npm run scoreboard
```

```text
...
The official test vectors, each run whole by your client:

codec                    30 of 30  ✔
erasure                  not run yet (12)
shuffle                    1 of 1  ✔
stf/accumulate         126 of 126  ✔
stf/assurances           22 of 22  ✔
stf/authorizations         6 of 6  ✔
stf/disputes             60 of 60  ✔
stf/history                8 of 8  ✔
stf/preimages             6 of 16
    ✘ stf/preimages/full/preimage_not_needed-1.json: accepted, not preimage_unneeded
    ✘ stf/preimages/full/preimage_not_needed-2.json: accepted, not preimage_unneeded
    ✘ stf/preimages/full/preimages_order_check-1.json: accepted, not preimages_not_sorted_unique
    … and 7 more
stf/reports              92 of 92  ✔
stf/safrole              46 of 46  ✔
stf/statistics             8 of 8  ✔
traces/fallback        100 of 100  ✔
traces/fuzzy           200 of 200  ✔
traces/fuzzy_light     200 of 200  ✔
traces/preimages       100 of 100  ✔
traces/preimages_light 100 of 100  ✔
traces/safrole         100 of 100  ✔
traces/storage         100 of 100  ✔
traces/storage_light   100 of 100  ✔
trie                       1 of 1  ✔

1,406 of 1,428 vectors pass.
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=scoreboard-1791940234821
```

1,406 of 1,428. Each of the 22 left has a name: ten blocks with preimages your client
should refuse, the [hardening pass](https://github.com/abutlabs/the-gray-tutor/blob/main/HARDENING.md)'s to add, and twelve erasure-coding vectors,
the code validators use to share a work-package's data, which a block importer never
needs. Every other question the official vectors ask, your client answers as they do,
whole. The *8 · Official vectors* dashboard in Grafana has the climb, run by run, from the
4 of [lesson 2.6](../02-codec/06-the-first-test-vectors.md) to here, and its *Each family (last run)* panel has the finished board:

![The Each family panel: every family passing all its vectors but stf/preimages, 6 of 16, and erasure, not run yet](./images/04-each-family-last-run.png)

> [!TIP] Milestone
> **The finished board.** 1,406 of the 1,428 official test vectors, whole:
> every codec, trie and shuffle vector, every state-transition family but ten preimages
> refusals, and every block of all eight traces.

<details>
<summary>lasair: the same variables, in <code>Dockerfile</code></summary>

```dockerfile
# The conformance harness configures the target via ENVIRONMENT VARIABLES
# (jam-conformance fuzz-proto/README), not CLI args. It runs:
#   docker run -e JAM_FUZZ=1 -e JAM_FUZZ_SPEC=tiny \
#     -e JAM_FUZZ_DATA_PATH=<dir> -e JAM_FUZZ_SOCK_PATH=<dir>/fuzz.sock \
#     -e JAM_FUZZ_LOG_LEVEL=info  ghcr.io/abutlabs/lasair:1.3.1
# The target binds JAM_FUZZ_SOCK_PATH (chmod 0666 so a different-uid fuzzer
# can connect) and refuses to start if a required var is missing.
```

The comment at the top of lasair's `Dockerfile`: the same variables, the same refusal, and
the socket's `0666`, which is where your target's came from. lasair's image is built in
two stages, compiling OCaml and Rust in a large image and copying only the finished
program into a small one; yours needs no compiler, since Node runs TypeScript as it is.

</details>

## Check your understanding

::: check
**With `JAM_FUZZ` set but no `JAM_FUZZ_SPEC`, why does the target refuse to start?**

- [ ] Node can't run the target without it
  > No: without `JAM_FUZZ`, the target runs fine with none of the variables.
- [x] Guessing tiny for a full session would get every block wrong, so nothing missing is guessed
  > Yes: the protocol says to refuse. A target that stops at once shows the mistake
  > straight away, not as a wrong root later.
- [ ] To save memory until the fuzzer is ready
  > No: memory has nothing to do with it. The target can't know which network's sizes
  > to use.

**Why does the target set its socket's permissions to `0666`?**

- [ ] To make the socket a program that can be run
  > No: `0666` has no permission to run in it. It's read and write, for everyone.
- [ ] So that only the target can write to it
  > No: it's the other way round. Everyone on the computer may use it.
- [x] The fuzzer may run as a different user from the target
  > Yes: without it, a fuzzer running as another user couldn't connect.

**The fuzzer disconnects. What must the target do?**

- [ ] Exit, so the fuzzer can start a fresh one
  > No: the protocol asks for one session after another, without a restart.
- [x] Keep listening, and start the next session fresh
  > Yes: each connection gets a new session, with its own handshake and its own
  > Initialize.
- [ ] Keep the last session's states for the next one
  > No: a new session starts with nothing kept. Its Initialize gives the state to
  > start from.

**What does the Docker image give the fuzzer?**

- [ ] Your source code, to read and check
  > No: the fuzzer never reads code. It starts the image and talks to it over the
  > socket.
- [x] Your target with everything it needs, started the same way on any machine
  > Yes: an image for `linux/amd64`, set up by the `JAM_FUZZ_*` variables, with
  > nothing typed on a command line.
- [ ] A faster client
  > No: it runs the same code. Packaging is about how it starts, not how fast it
  > runs.

**1,406 of the 1,428 vectors pass. Why aren't the twelve erasure vectors a gap in your block importer?**

- [x] Erasure coding is how validators share a work-package's data, and importing blocks never uses it
  > Yes: they're not run because your client has no erasure coding, and a block
  > importer doesn't need any.
- [ ] They pass, but the board doesn't count them
  > No: they're not run at all. The board says "not run yet".
- [ ] They're too slow to run, so the board skips them
  > No: speed isn't why. Your client has no erasure coding at all, so there's
  > nothing to run them with.
:::

## What you have

A JAM block importer, built from an empty folder. It passes 1,406 of the 1,428 official
test vectors whole, every state-transition family among them but for ten preimages
refusals, and imports all eight block-import traces, each block into the state it made
itself, every root right and every bad block refused. It speaks the
conformance fuzzer's protocol, keeps the chain's ancestry for the one check the state
can't make, and starts the way the fuzzer starts its targets. That's what JAM's first
milestone, M1, asks of a client, with the [hardening pass](https://github.com/abutlabs/the-gray-tutor/blob/main/HARDENING.md)'s ten refusals still to add. Lesson [0.1](../00-start/01-what-you-will-build.md)
promised a program that answers "valid, and here is the new state" or "invalid, go away".
It's yours.
