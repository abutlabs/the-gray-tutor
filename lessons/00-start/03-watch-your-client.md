# Watch your client

A test tells you whether your code is right. It doesn't tell you what your code *did*.
lasair, a complete JAM client, passed its tests for months before it grew a way to show
what was going on inside, and then wondered how it had ever lived without one. (The
observability course opens with that story:
[Why a JAM network needs observability](https://abutlabs.github.io/jam-learning/observability/lesson.html?lesson=00-welcome/01-why-observe).)

Your client starts the other way round. Before it knows a single JAM rule, it learns to
talk to the stack you started in [lesson 0.2](./02-set-up-the-project.md). By the end of this lesson it has said hello,
and every test run from then on reports itself.

## New words

- **Observability.** Being able to see what a program does, from the outside, while it
  runs. *Example:* a dashboard showing every test of your last `npm test`.
- **Event.** One line saying that something happened, with its details. *Example:*
  `{"step": "hello"}`.
- **Run.** One `npm test`, or one run of a program, with everything it reported labelled
  by one id. *Example:* in Grafana, pick a run to see only what it did.
- **Reporter.** A plug-in for Node's test runner that receives every test's result. Yours
  sends them to the stack. *Example:* `test/grafana.ts`, later in this lesson.
- **Grafana.** The dashboards where your client's runs show up. *Example:* the page a
  `reported to Grafana` link opens.
- **Script.** A command with a name, kept in `package.json`, that `npm run` runs.
  *Example:* `npm run hello` runs `node bin/hello.ts`.

## Two kinds of signal

| Signal | What it answers | Where it goes |
| --- | --- | --- |
| *Events*: one line of JSON per thing that happened | What happened, in what order? | Loki |
| *Numbers*: one value per name, per run | How many tests passed? What slot is it? | Pushgateway, then Prometheus |

A *run* (one `npm test`, or one program) collects its events and numbers and sends
them in one go, at the end, all labelled with the run's id. In Grafana you can pick a
run and see only what it did.

Both stores speak plain HTTP, so `fetch`, built into Node, is all the client needs.

## The module

**New file** `src/obs.ts`

```ts
// Observability: the client tells the observability stack what it does. Events go to
// Loki, numbers to the Pushgateway, and Grafana shows both.

const LOKI = "http://127.0.0.1:3100";
const PUSHGATEWAY = "http://127.0.0.1:9091";
const GRAFANA = "http://127.0.0.1:3300";

/** Who is reporting: "you", unless OBS_CLIENT says otherwise. */
const CLIENT = process.env.OBS_CLIENT ?? "you";

/** One run of the client (its tests, or a program): what it did and what it measured. */
export class Run {
  readonly kind: string;
  readonly id: string;
  #events: [string, string][] = []; // [time in nanoseconds, line], as Loki wants them
  #numbers: string[] = []; // lines of Prometheus text, as the Pushgateway wants them

  constructor(kind: string) {
    this.kind = kind;
    this.id = `${kind}-${Date.now()}`;
  }

  /** Something the client did: the step, and the values worth seeing. */
  event(step: string, fields: Record<string, unknown> = {}): void {
    // nanoseconds; adding the event's number keeps events in the order they happened
    const time = BigInt(Date.now()) * 1_000_000n + BigInt(this.#events.length);
    this.#events.push([time.toString(), line(step, fields)]);
  }

  /** A number the run measured, such as how many tests passed. */
  number(name: string, value: number): void {
    this.#numbers.push(`the_gray_tutor_${name}{run_id="${this.id}"} ${value}\n`);
  }

  /** Sends the run to the stack: where to see it in Grafana, or null if the stack is down. */
  async report(): Promise<string | null> {
    const labels = { job: "the_gray_tutor", client: CLIENT, kind: this.kind, run_id: this.id };
    try {
      const loki = await fetch(`${LOKI}/loki/api/v1/push`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ streams: [{ stream: labels, values: this.#events }] }),
      });
      const group = `${PUSHGATEWAY}/metrics/job/the_gray_tutor/client/${CLIENT}/kind/${this.kind}`;
      const push = await fetch(group, { method: "PUT", body: this.#numbers.join("") });
      if (!loki.ok || !push.ok) throw new Error("the stack said no");
    } catch {
      console.log("not reported: is the observability stack up? (../observability/obs up)");
      return null;
    }
    return `${GRAFANA}/d/the-gray-tutor?var-client=${CLIENT}&var-run_id=${this.id}`;
  }
}

/** An event as Loki stores it: one line of JSON. */
function line(step: string, fields: Record<string, unknown>): string {
  return JSON.stringify({ step, ...fields });
}
```

The tour:

- A `Run` is a little notebook. `event` writes down something that happened, `number`
  writes down something measured, and `report` mails the notebook to the stack.
- `Run` is defined right here, in this file: TypeScript doesn't come with one. `new
  Run("hello")` makes a fresh notebook. The word in brackets is the run's *kind*: Grafana
  files the run under it, and its id starts with it, as `hello-1791724085683` does below.
  Every program you write from here opens one, named for what it does.
- Loki wants each event's time in nanoseconds. `Date.now()` gives milliseconds, so
  multiply by a million, then add the event's number, so two events in the same
  millisecond still come out in order.
- The Pushgateway keeps one group per `client` and `kind`, and each `PUT` replaces it.
  So it always holds the *latest* run's numbers, which is exactly what the dashboard's
  "last run" panels show.
- `CLIENT` is `you`. The tutorial's own checks run with `OBS_CLIENT=tutorial-check`, so
  their runs never mix with yours.
- Stack down? `report` says so in one line and returns `null`. Your client carries on.

## Say hello

**New file** `bin/hello.ts`

```ts
// Says hello to the observability stack: your client's very first report.

import { Run } from "../src/obs.ts";

const run = new Run("hello");
run.event("hello", { message: "my JAM client is alive" });
run.number("hellos", 1);
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

The file is a module, so it can `await` at the top level: Node waits for the report
before it exits.

`node bin/hello.ts` would run it. Give it a *script* instead, a name in `package.json`
that npm runs for you, the way `npm run typecheck` runs `tsc -p .`. `npm pkg set` writes
the line into `package.json`, and `npm run hello` runs it:

**Run**

```sh
npm pkg set scripts.hello="node bin/hello.ts"
npm run hello
```

```text
> hello
> node bin/hello.ts

reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=hello-1791724085683
```

npm first echoes the script's name and the command it stands for, then runs it. Every
program from here on gets its script the same way, the first time you run it, and the
lessons leave npm's echo out of their output. Words after the name go on to the program:
`npm run now 3`, in [the next lesson](./04-the-jam-clock.md), runs `node bin/now.ts 3`.
`npm run` with no name lists every script your client has.

Open the link. In *Everything your client reported* there it is:
`{"step":"hello","message":"my JAM client is alive"}`. Your client's first words. Frame
them.

![The hello line in Grafana](./images/03-its-alive.png)

## Every test run, reported

Node's test runner lets you plug in a *reporter*: a function that gets every test's
result as it happens. This one turns the results into a run (an event per test, the
totals as numbers) and reports it.

**New file** `test/grafana.ts`

```ts
// Reports each npm test run to the observability stack: each test's result as an event,
// the totals as numbers. Prints one line: where to see the run in Grafana.

import { relative } from "node:path";
import type { TestEvent } from "node:test/reporters";
import { Run } from "../src/obs.ts";

export default async function* grafana(source: AsyncIterable<TestEvent>): AsyncGenerator<string> {
  const run = new Run("test");
  let passed = 0;
  let failed = 0;
  for await (const event of source) {
    if (event.type !== "test:pass" && event.type !== "test:fail") continue;
    const { name, file, details } = event.data;
    if (details.type === "suite") continue;
    const ok = event.type === "test:pass";
    const error = event.type === "test:fail" ? String(event.data.details.error.cause) : undefined;
    if (ok) passed++;
    else failed++;
    const where = file && relative(process.cwd(), file);
    run.event("test", { name, file: where, ok, ms: Math.round(details.duration_ms), error });
  }
  run.number("tests_passed", passed);
  run.number("tests_failed", failed);
  const link = await run.report();
  if (link) yield `reported ${passed + failed} tests to Grafana: ${link}\n`;
}
```

A reporter is an *async generator*: `for await` takes each test event as the runner
produces it, and each `yield` writes text to the terminal. This one yields a single line
at the very end. Its name doesn't end in `.test.ts`, so the runner never mistakes it for
a test.

Plug it into `npm test`, next to the usual output (`spec`). The rest of `package.json` is
as it was, `hello` included:

**Rewrite** `package.json`

```json
{
  "name": "jam-client",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test --test-reporter=spec --test-reporter-destination=stdout --test-reporter=./test/grafana.ts --test-reporter-destination=stdout \"test/**/*.test.ts\"",
    "typecheck": "tsc -p .",
    "hello": "node bin/hello.ts"
  },
  "devDependencies": {
    "@types/node": "26.6.4",
    "typescript": "7.0.2"
  }
}
```

**Run**

```sh
npm test
npm run typecheck
```

```text
...
ℹ tests 0
ℹ suites 0
ℹ pass 0
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 31.6
reported 0 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791724085928

> typecheck
> tsc -p .
...
```

Your first look at the test runner's summary, so line by line: `tests` is how many ran,
`pass` and `fail` how they went, `suites` counts groups of tests (you won't need any),
`cancelled`, `skipped` and `todo` count tests that didn't run to the end, and
`duration_ms` is how long it all took. The last line is your reporter's, with a link to
this very run. (Above the summary, cut here, npm first echoes the command it runs.) Then
`typecheck` prints its own name and nothing more: from `tsc`, no news is good news.

Zero tests, zero failures: a perfect record, technically. On the dashboard, *Tests passed*
now says 0. [The next lesson](./04-the-jam-clock.md) writes your first real test, and you'll watch that number
climb for the rest of the tutorial.

<details>
<summary>lasair: the same idea, for its gate</summary>

lasair reports its conformance gate the same way, from Python, in
`scripts/obsreport.py`: one push per run to the Pushgateway, replacing the group's
previous numbers.

```python
def push(cli, job, run_id, net, snapshot):
    """Replace the job's group for this run with the snapshot."""
    if cli:
        obs(cli, "push", job, "--replace", "--group", "run_id=" + run_id, "--group", "net=" + net,
            stdin=snapshot.text())
```

`obs push` is the stack's command-line tool sending the same `PUT` your `report` sends.

</details>

## Check your understanding

::: check
**You want to know what your client did, and in what order. Which signal answers that?**

- [x] Events: one line of JSON per thing that happened, kept in Loki
  > Yes: each event says what happened, with its details, such as
  > `{"step":"hello","message":"my JAM client is alive"}`, and they're kept in order.
- [ ] Numbers: one value per name, per run, kept by the Pushgateway
  > No: a number answers "how many?" or "what slot?", like `tests_passed`. It says
  > nothing about what happened first.
- [ ] The test output: it lists every step
  > No: a test says whether your code is right, not what it did on the way. That's why
  > the client reports.

**When does a run send what it has collected?**

- [ ] Each time something happens, as soon as `event` writes it down
  > No: `event` and `number` only write in the notebook. Nothing is sent until `report`.
- [ ] Never: Grafana reads it straight from the running program
  > No: Grafana only shows what Loki and the Pushgateway were sent. A program that never
  > calls `report` never appears.
- [x] Once, at the end, when `report` sends it, all labelled with the run's id
  > Yes: the events go to Loki and the numbers to the Pushgateway in one go. The id lets
  > Grafana show one run on its own.

**The stack is down, and you run `npm run hello`. What happens?**

- [ ] The program crashes with a connection error
  > No: `report` catches the error, prints one line, and returns `null`.
- [x] It prints `not reported: is the observability stack up?` and carries on
  > Yes: reporting is extra, so a missing stack never stops your client. Your code is
  > fine; it just had no one to tell.
- [ ] The hello is kept, and sent the next time the stack is up
  > No: nothing keeps it. The run lives only in the program's memory, and is gone when
  > the program exits.

**You run `npm test` twice, and 2 tests pass each time. What does the Pushgateway hold afterwards?**

- [ ] 4: the two runs added together
  > No: nothing adds them up. Each report sends its own totals.
- [ ] Both runs' numbers, side by side
  > No: that's Loki's side of things. Every run's events stay there with their run id,
  > but the Pushgateway keeps one group per `client` and `kind`.
- [x] 2: the second run's numbers replaced the first's
  > Yes: each report sends its group with a `PUT`, and a `PUT` replaces what was there.
  > That's why the "last run" panels always show the latest run.
:::

## What you have

A client that reports itself. It has said hello, every `npm test` lands in Grafana, and
any program can report a run with three calls: `new Run`, `event`, `report`. It reports,
but it knows nothing about JAM yet: [lesson 0.4](./04-the-jam-clock.md) gives it its first
rule, the clock, built by test-driven development.

Next: [0.4 The JAM clock](./04-the-jam-clock.md)
