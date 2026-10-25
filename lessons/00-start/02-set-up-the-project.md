# Set up the project

Four things to set up, then you never think about them again: Node, the tutorial's own
tools, the observability stack, and an empty client. About ten minutes of your time,
plus the downloads (the test vectors are about 1.4 GB). You need git,
VS Code (or any editor) and Docker Desktop.

## New words

- **TypeScript.** JavaScript with types: you write down what kind of value each thing is,
  and a checker, `tsc`, catches mix-ups before you run anything. *Example:* `const slot:
  number = 42`.
- **Node.** The program that runs JavaScript (and, in recent versions, TypeScript) outside a
  browser. *Example:* `node --version` says which one you have.
- **nvm.** A tool that installs Node versions and switches between them. *Example:*
  `nvm use` switches to the version the project asks for.
- **npm.** Node's package manager: it downloads libraries and runs a project's scripts.
  *Example:* `npm install` fetches everything a project needs.
- **tsc.** The TypeScript compiler. Here it only checks your types, and writes nothing.
  *Example:* `npm run typecheck` runs it.
- **Docker.** Runs ready-made programs in *containers*, so a whole set of tools starts
  with one command. *Example:* `./obs up` starts the observability stack in Docker.
- **Module.** A file that shares code with other files through `import` and `export`.
  *Example:* [lesson 0.4](./04-the-jam-clock.md)'s `src/time.ts` exports `slotAt`, and its test imports it.

## Node 26

The repo's `.nvmrc` says `26`. With [nvm](https://github.com/nvm-sh/nvm), at the repo
root, install it once:

```sh
nvm install
```

Then, in every new terminal, switch to it and check:

```sh
nvm use
node --version
```

It should say `v26.` and something.

Why Node 26? Like other recent versions, it runs TypeScript files directly: it strips off
the type annotations and runs what's left. No build step, so the code you type is the
code that runs. (The types still get checked, by the TypeScript compiler `tsc`, whenever
you ask.) Node 26 also has the newest JavaScript built-ins, like turning bytes into hex,
which you'll meet in [lesson 1.1](../01-bytes-and-numbers/01-bytes-and-hex.md), and it's
the version every lesson is checked with.

## The tutorial's tools

Still at the repo root, once: `npm install` fetches the website and the lesson tools,
and `npm run vectors` downloads the official test vectors (about 1.4 GB, into
`vectors/`).

```sh
npm install
npm run vectors
```

## The observability stack

From [the next lesson](./03-watch-your-client.md) on, your client tells this stack everything it does. Grafana to
look at, Prometheus for numbers, Loki for events: the same stack lasair reports into.
It runs in Docker, so start Docker Desktop first.

The stack is its own repo, [abutlabs/observability](https://github.com/abutlabs/observability).
Clone it next door, so the two folders sit side by side, and start it. `cd ..` takes
you to the folder that holds `the-gray-tutor/`, and the clone is needed only once:

```sh
cd ..
git clone https://github.com/abutlabs/observability.git
cd observability
./obs up
cd ../the-gray-tutor
```

Now open Grafana at http://localhost:3300 and go to *Dashboards*. There's a folder
**the-gray-tutor** holding the tutorial's dashboards: **0 · Your client**, where every run
lands, and one per theme, from **1 · Basics** to **7 · Accumulation and import**. A bar at
the top of each links them all. (The stack found them in this repo's
`observability/dashboards/` because the folders are neighbours. If yours aren't,
start it with `OBS_PROJECT_DIRS=/path/to/the-gray-tutor ./obs up`.)

They're empty. Nothing has said anything yet. [Lesson 0.3](./03-watch-your-client.md) fixes that.

Leave the stack running while you work. `./obs down` stops it and keeps your data for the
next `./obs up`. Curious how it all works? There's a whole course:
[Learning Observability](https://abutlabs.github.io/jam-learning/observability/).

## Your client

Everything from here on happens in `client/`, which is empty. It's also git-ignored: your
code never lands in the tutorial's history, and `git pull` brings new lessons without
touching it. Want a history of your own? Run `git init` inside `client/`, and it becomes
your own repository. Open a terminal there:

```sh
cd client
```

**New file** `package.json`

```json
{
  "name": "jam-client",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test \"test/**/*.test.ts\"",
    "typecheck": "tsc -p ."
  },
  "devDependencies": {
    "@types/node": "26.6.4",
    "typescript": "7.0.2"
  }
}
```

- `"type": "module"` makes every file a module, so files share code with `import` and
  `export`.
- `npm test` runs Node's built-in test runner on every `.test.ts` file in `test/`.
  (Spell the pattern out: without it, Node runs *every* file in a `test/` folder, helpers
  and all.)
- `npm run typecheck` asks `tsc` to check the types. It writes nothing.
- The versions are exact, so your client and the tutorial's behave the same.

**New file** `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "esnext",
    "lib": ["esnext"],
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "types": ["node"],
    "strict": true,
    "noEmit": true,
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "erasableSyntaxOnly": true,
    "skipLibCheck": true
  },
  "include": ["src", "test", "bin"]
}
```

Two settings to know: `strict` turns on every check (no forgotten `null` cases, no untyped
parameters), and `noEmit` means `tsc` only checks, because Node runs the `.ts` files
itself. The rest make sure Node and `tsc` agree on what your files mean: imports name the
real file (`./bytes.ts`), type-only imports say `import type`, and no TypeScript feature
needs translating (so no `enum`), because Node can only strip types away, not rewrite
code.

Your code will live in three folders: `src/` for the client, `test/` for its tests, and
`bin/` for little programs you run.

**Run**

```sh
npm install
```

```text
...
found 0 vulnerabilities
```

## Troubleshooting

When something here doesn't work, it's almost always one of these:

- **`Could not find '.../test/**/*.test.ts'`, or `ERR_UNKNOWN_FILE_EXTENSION` for a `.ts`
  file.** This terminal is on an older Node. `nvm use`, then `node --version` should say
  `v26.` and something. (At the repo root, the tutorial's own commands say it in words:
  `The Gray Tutor needs Node 26`.)
- **`./obs up` says it `failed to connect to the docker API`** (older Docker: `Cannot
  connect to the Docker daemon`). Docker isn't running. Start Docker Desktop, wait until
  it's running, and `./obs up` again.
- **`Bind for 127.0.0.1:3300 failed: port is already allocated`** (or `address already in
  use`). Another program holds one of the stack's ports, such as 3300 (Grafana) or 3100
  (Loki). Often it's an older copy of the stack: `docker ps` lists what's running. Stop
  it, then `./obs up` again.
- **A run prints `not reported: is the observability stack up?`** The stack isn't
  running: `../observability/obs up` from the repo root. Your code is fine; it just had
  no one to tell.
- **`npm run vectors` fails or stops part way** (a dropped connection, say). Run it again.
  If it keeps failing, delete the `vectors/` folder and run it once more.

## Working offline

Everything runs on your own machine, so a flight is fine, if you download what the
tutorial needs while you're still online. One command, in the tutorial's folder, does it
all:

```sh
npm run offline
```

It installs the tutorial's packages, puts every package the lessons will add to your
client into npm's cache (without touching `client/`), fetches the test vectors, and runs
`./obs up` so that Docker keeps the stack's images. Then it checks that npm can install
your client's packages without the network. Run it again after every `git pull`, while
you're online: a new lesson can bring a new package. The appendix
[Working offline](../offline.md) explains each step.

On the plane, where a lesson says `npm install`, type `npm install --offline`: npm takes
everything from its cache. The lessons, in VS Code or on the website (`npm run site`),
need no network at all.

## Check your understanding

::: check
**Node runs your `.ts` files itself. So what is `tsc` for?**

- [ ] Turning the `.ts` files into the `.js` files Node runs
  > No: `noEmit` means `tsc` writes nothing. Node strips the types off and runs what's
  > left, with no build step.
- [x] Checking the types, and nothing else
  > Yes: `npm run typecheck` asks `tsc` to look for mix-ups, such as a `number` where text
  > was expected. It changes no file.
- [ ] Starting Node 26 with the right settings
  > No: `nvm use` picks the Node version. `tsc` only ever reads your code.

**You've run `./obs up` and opened Grafana. The dashboards are empty. What's wrong?**

- [x] Nothing: your client hasn't reported anything yet
  > Yes: the stack is running and waiting. Your client is still empty, and [lesson
  > 0.3](./03-watch-your-client.md) gives it its first words.
- [ ] Docker isn't running
  > No: with Docker stopped, `./obs up` fails with `failed to connect to the docker API`,
  > and there's no Grafana to open.
- [ ] The test vectors haven't finished downloading
  > No: the vectors are files in `vectors/` for your tests to read. The dashboards show
  > what your client reports, and so far it has reported nothing.

**Why does the tutorial's git ignore `client/`?**

- [ ] So that your code can never be kept in git
  > No: `git init` inside `client/` makes it a repository of your own, with your own
  > history.
- [ ] Because the tutorial ships a finished client there
  > No: `client/` starts empty, and you write every line in it.
- [x] So `git pull` brings new lessons without touching your code
  > Yes: your code stays out of the tutorial's history, and the tutorial's updates stay
  > out of your code.

**You'll work on a plane. What must you fetch while you're still online?**

- [ ] Nothing: the lessons need no network
  > No: the lessons don't, but the code does. The vectors, the Docker images and the
  > packages have to be on your machine first.
- [x] The vectors, the stack's Docker images, and every package, yours and the tutorial's
  > Yes: `npm run offline` fetches all of them, and checks that npm's cache holds your
  > client's packages. On the plane, `npm install --offline` takes packages from that
  > cache.
- [ ] Only the test vectors, since they're the big download
  > No: size isn't the problem. A small package missing from npm's cache stops a lesson
  > just as surely as missing vectors.
:::

## What you have

Node 26, the official test vectors, an observability stack waiting for its first word,
and an empty client that knows how to test and type-check itself. It has nothing to say
yet, and no one to say it to: [lesson 0.3](./03-watch-your-client.md) connects it to the
stack, so that every run from then on shows up in Grafana.

Next: [0.3 Watch your client](./03-watch-your-client.md)
