# Work digests

**In one sentence:** a work digest is the small card a core sends back for one job: whose
job it was, how it went, and how hard the core worked.

Here are both tiny vectors, one job that succeeded and one that panicked. Tap any part for
what it's for, its value and where its bytes are.

<a id="try-it"></a>

<WorkDigest />

## The idea

A core has run a job. What should the chain hear about it? Not the computation: that
stayed on the core. Every validator has to read whatever comes back, so it must be small.

It is a card, the [*work digest*](../glossary.md#work-digest), with three things on it.

- **Whose job.** The service, its code, and a hash of the job's input.
- **How it went.** Either the output, or the reason it failed. Never both.
- **How hard the core worked.** Gas used, and how much data went in and out.

A job has two stages. [*Refine*](../glossary.md#refine) runs the service's code on a core, off the
chain, and produces the output. [*Accumulate*](../glossary.md#accumulate) comes later, on the chain,
and folds that output into the service's state. The digest is the note passed from the
first stage to the second.

"Either the output or an error" is the one new idea here. In the bytes, a number in front,
a [*tag*](../glossary.md#tag), says which case follows. In TypeScript it is a
[*union type*](../glossary.md#union-type). This lesson builds both.

## What the Gray Paper says

::: gray-paper 11.1.4 1-8

#### §11.1.4 Work Digest {#gp-11-1-4}

<a id="gp-11-1-4-p1"></a>We finally come to define a *work-digest*, $\mathbb{D}$, which is the data conduit by which services' states may be altered through the computation done within a work-package.

<a id="gp-11-1-4-p2"></a><a id="eq-11-6"></a>

$$
\begin{equation}
\mathbb{D} \equiv \!\left\lgroup
\begin{alignedat}{9}
s&\in \mathbb{N}_S\,,\;
&c&\in \mathbb{H}_{}\,,\;
&y&\in \mathbb{H}_{}\,,\;
&g&\in \mathbb{N}_G\,,\;
&\mathbf{l}&\in \mathbb{B}_{} \cup \mathbb{E}\,,\;\\
u&\in \mathbb{N}_G\,,\;
&i&\in \mathbb{N}\,,\;
&x&\in \mathbb{N}\,,\;
&z&\in \mathbb{N}\,,\;
&e&\in \mathbb{N}
\end{alignedat}
\right\rgroup\! \tag{11.6}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-workdigest" class="gk-wrap">$\mathbb{D}$</span> | D | the set of work-digests: one item's result card, with its service, hashes, gas limit, result and load |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-tuple">$\!\left\lgroup x\right\rgroup\!$</span> | the tuple of | a record: named fields, each with its type, like an object in JSON |
| <span id="gk-isa">[$x\in y$](../symbols.md#in)</span> | in | belongs to: the field's type |
| <span id="gk-wd-serviceindex">$s$</span> | s | the service the item was for, whose accumulate gets the result |
| <span id="gk-serviceid" class="gk-wrap">$\mathbb{N}_S$</span> | N sub S | a service id: a whole number below 2³², 4 bytes |
| <span id="gk-wd-codehash">$c$</span> | c | the service's code hash as the guarantors saw it; it must match the chain's |
| <span id="gk-hash">$\mathbb{H}$</span> | H | a 32-byte value, usually a hash |
| <span id="gk-wd-payloadhash">$y$</span> | y | the hash of the item's payload |
| <span id="gk-wd-gaslimit">$g$</span> | g | the gas the item's accumulation may use (`accumulate_gas`) |
| <span id="gk-gas" class="gk-wrap">$\mathbb{N}_G$</span> | N sub G | an amount of gas: a u64 |
| <span id="gk-wd-result" class="gk-wrap">$\mathbf{l}$</span> | l | the result: the bytes refine returned, or one of six errors |
| <span id="gk-blob">[$\mathbb{B}$](../symbols.md#blobs)</span> | B, or B sub n | bytes: any run of them; 𝔹ₙ exactly n of them |
| <span id="gk-cup">$\cup$</span> | union | everything in either side |
| <span id="gk-workerror" class="gk-wrap">$\mathbb{E}$</span> | E | the set of work errors: out of gas, panic, bad exports, oversize, BAD (no code) and BIG (code too big) |
| <span id="gk-wd-gasused">$u$</span> | u | the gas refining the item used |
| <span id="gk-wd-importcount">$i$</span> | i | how many segments the item imported |
| <span id="gk-N" class="gk-wrap">[$\mathbb{N}$](../symbols.md#naturals)</span> | N | the whole numbers: 0, 1, 2 and up; a subscript is a bound, ℕ₈ is 0 to 7 |
| <span id="gk-wd-xtcount">$x$</span> | x | how many extrinsic blobs the item used |
| <span id="gk-wd-xtsize">$z$</span> | z | those extrinsics' total size, in bytes |
| <span id="gk-wd-exportcount">$e$</span> | e | how many segments the item exported |

</details>

→ [(11.6) in plain words](./gray-paper.md#ex-11-6)

<a id="gp-11-1-4-p3"></a>Work-digests are a tuple comprising several items. Firstly $s$, the index of the service whose state is to be altered and thus whose refine code was already executed. We include the hash of the code of the service at the time of being reported $c$, which must be accurately predicted within the work-report according to equation [11.45](../12-guarantees/05-bad-reports.md#eq-11-45).

<a id="gp-11-1-4-p4"></a>Next, the hash of the payload ($y$) within the work item which was executed in the refine stage to give this result. This has no immediate relevance, but is something provided to the accumulation logic of the service. We follow with the gas limit $g$ for executing this item's accumulate.

<a id="gp-11-1-4-p5"></a>There is the work *result*, the output blob or error of the execution of the code, $\mathbf{l}$, which may be either an <abbr class="gp-term" title="a byte: 8 bits">octet</abbr> sequence in case it was successful, or a member of the set $\mathbb{E}$, if not. This latter set is defined as the set of possible errors, formally:

<a id="gp-11-1-4-p6"></a><a id="eq-11-7"></a>

$$
\begin{equation}
\mathbb{E} \in \left\{\, \infty, \unicode{x21AF}, \circledcirc, \circleddash, \texttt{BAD}, \texttt{BIG} \,\right\} \tag{11.7}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-in">[$\in$](../symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-set">$\left\{\,x\,\right\}$</span> | the set of | a set: values with no order and no repeats |
| <span id="gk-oog" class="gk-wrap">$\infty$</span> | out of gas | ∞: the program ran out of gas |
| <span id="gk-panic">$\unicode{x21AF}$</span> | panic | ↯: the program trapped |
| <span id="gk-badexports" class="gk-wrap">$\circledcirc$</span> | bad exports | the error: the item exported a different number of segments than it said it would |
| <span id="gk-oversize" class="gk-wrap">$\circleddash$</span> | oversize | the error: this output would make the report's outputs bigger than W_R |
| <span id="gk-token">$\texttt{x}$</span> | the string | a name in typewriter type: an instruction's or helper's name, or fixed bytes written as text: the ASCII bytes of its words; the dollar sign in front only marks them as text and is not one of the bytes |

</details>

→ [(11.7) in plain words](./gray-paper.md#ex-11-7)

<a id="gp-11-1-4-p7"></a>The first two are special values concerning execution of the virtual machine, $\infty$ denoting an out-of-gas error and $\unicode{x21AF}$ denoting an unexpected program termination. Of the remaining four, the first indicates that the number of exports made was invalidly reported, the second that the size of the digest (refinement output) would cross the acceptable limit, the third indicates that the service's code was not available for lookup in state at the <abbr class="gp-term" title="after the change: the value once it is made, written with a prime (α′); for state, after the block">posterior</abbr> state of the <abbr class="gp-term" title="the block whose state an in-core run's lookups saw; it must be final and recent">lookup-anchor</abbr> block. The fourth indicates that the code was available but was beyond the maximum size allowed $\mathsf{W}_C$.

<a id="gp-11-1-4-p8"></a>Finally, we have five fields describing the level of activity which this workload imposed on the core in bringing the result to bear. We include $u$ the actual amount of gas used during refinement; $i$ and $e$ the number of segments imported from, and exported into, the D$^3$L respectively; and $x$ and $z$ the number of, and total size in <abbr class="gp-term" title="bytes: 8 bits each">octets</abbr> of, the extrinsics used in computing the workload. See section [14](./index.md#gp-14-1-p1) for more information on the meaning of these values.

:::

A guarantor makes each digest from its item, the item's result and the gas refining it
used, with §14.3's function C:

::: gray-paper 14.3 14-15

#### §14.3 Packages and Items, continued

<a id="gp-14-3-p14"></a>Given the result $\mathbf{l}$ and gas used $u$ of some work-item, we define the item-to-digest function $C$ as:

<a id="gp-14-3-p15"></a><a id="eq-14-10"></a>

$$
\begin{equation}
C\colon\left\{ \begin{aligned}
\!\left\lgroup\mathbb{W}, \mathbb{B}_{} \cup \mathbb{E}, \mathbb{N}_G\right\rgroup\! &\to \mathbb{D}\\
\left(\left(\begin{aligned}
&s, c, \mathbf{y},\\
&a, e, \mathbf{i}, \mathbf{x}
\end{aligned}
\right), \mathbf{l}, u\right) &\mapsto \left(\begin{aligned}
&s,\,
c,\,
y\mathrel{\unicode{x2AF6}}\mathcal{H}\left(\mathbf{y}\right),\,
g\mathrel{\unicode{x2AF6}}a,\,
\mathbf{l},\,
u,\\
&i\mathrel{\unicode{x2AF6}}\left\vert\mathbf{i}\right\vert,\,
e,\,
x\mathrel{\unicode{x2AF6}}\left\vert\mathbf{x}\right\vert,\,
z\mathrel{\unicode{x2AF6}}\!\!\!\!\sum_{\left(h, z\right) \in \mathbf{x}}\!\!\!\!z
\end{aligned}\right)\!\!\!\!
\end{aligned} \right. \tag{14.10}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-itemtodigest">$C$</span> | C | item to digest: makes a work-digest from a work-item, its result and the gas it used |
| <span id="gk-abracegroup">$\left\{ \begin{aligned}x\end{aligned} \right.$</span> | as follows | a brace grouping lines that hold together: for a function, its type on top, then what each input becomes |
| <span id="gk-workitem" class="gk-wrap">$\mathbb{W}$</span> | W | the set of work-items: one job for one service, with its payload, gas limits, imports, extrinsics and export count |
| <span id="gk-to">[$\to$](../symbols.md#to)</span> | to | what goes in, to what comes out: A → B takes an A and gives a B |
| <span id="gk--payload" class="gk-wrap">$\mathbf{y}$</span> | y | a payload: the input to refine |
| <span id="gk-wi-accgaslimit">$a$</span> | a | the gas accumulate may use on this item's result |
| <span id="gk-wi-importsegments" class="gk-wrap">$\mathbf{i}$</span> | i | the segments the item imports: each a segments root (or a package hash) and an index |
| <span id="gk-wi-extrinsics" class="gk-wrap">$\mathbf{x}$</span> | x | the item's extrinsics: each a blob's hash and length |
| <span id="gk-mapsto">$\mapsto$</span> | maps to | what a function gives back for an input: x ↦ y says x becomes y |
| <span id="gk-is">$x\mathrel{\unicode{x2AF6}} y$</span> | is a | names a field and gives its type, in a tuple |
| <span id="gk-blake">$\mathcal{H}\left(x\right)$</span> | H of | the Blake2b hash of what's in the brackets: 32 bytes |
| <span id="gk-len">$\left\vert x\right\vert$</span> | the size of | \|x\|: how many items x has, or how many bytes |
| <span id="gk-sum">$\sum$</span> | the sum of | add up what follows, once for each value the subscript ranges over |

</details>

→ [(14.10) in plain words](./gray-paper.md#ex-14-10)

:::

§11.1.4 (*Work Digest*) defines a digest as ten things:

- the **service** it is for, that service's **code hash**, and the hash of the item's
  **payload**;
- the **gas limit** for accumulating it later (the vectors call it `accumulate_gas`);
- the **result**: the output bytes if refine succeeded, or one of six errors if not:
  out of gas, panic, bad exports, oversize, bad code (BAD) and code too big (BIG);
- the **load**: gas used, segments imported, extrinsics read and their total size, and
  segments exported.

C (14.10) shows where each comes from. The service, code hash and accumulate gas are
copied from the item. The payload is hashed. The counts are the lengths of the item's
import and extrinsic lists. Only the result and the gas used come from running the code.

Appendix C encodes the result with its own function, O: a successful result is the tag 0
and then the output as a blob; a failure is just its tag, 1 to 6. The five load numbers are compact
naturals. (The Gray Paper's own comment on why: "space is at a premium here".)

The test vectors call digests `work_result`, the name the Gray Paper used before it
renamed them.

Pick a case and watch the tag in front. An error is one byte and nothing more. A success
is the tag 0, the output's length, then the output.

<ResultTag />

## Either this or that

In TypeScript, "either output or an error" is a union of two object shapes. A result is
`{ ok: Bytes }` or `{ error: WorkError }`, and `"ok" in result` tells you which one you
hold. After that check `result.ok` only compiles where it's safe.

## The tests

**Add to** `test/work.test.ts`

```ts
import assert from "node:assert/strict";
import { fromHex, toHex } from "../src/bytes.ts";
import { encode } from "../src/codec/codec.ts";
import { WorkDigest, WorkResult } from "../src/work.ts";

test("a result is tag 0 and the output, or just an error's tag", () => {
  const okHex: string = toHex(encode(WorkResult, { ok: fromHex("0xaabbcc") }));
  assert.equal(okHex, "0x0003aabbcc");
  const outOfGasHex: string = toHex(encode(WorkResult, { error: "out_of_gas" }));
  assert.equal(outOfGasHex, "0x01");
  const panicHex: string = toHex(encode(WorkResult, { error: "panic" }));
  assert.equal(panicHex, "0x02");
});

for (const spec of ["tiny", "full"]) {
  const dir = `codec/${spec}`;
  test(`work_result_0 (${spec})`, () => checkCodecVector(WorkDigest, `${dir}/work_result_0`));
  test(`work_result_1 (${spec})`, () => checkCodecVector(WorkDigest, `${dir}/work_result_1`));
}
```

`0x00 03 aabbcc`: tag 0, length 3, the three output bytes. A panic is the single byte
`0x02`. The two vectors are one of each: `work_result_0` succeeded, `work_result_1`
panicked.

## The code

**Add to** `src/work.ts`

```ts
import type { Bytes } from "./bytes.ts";
import { fromHex } from "./bytes.ts";
import type { Codec } from "./codec/codec.ts";
import { natural, natural32 } from "./codec/codec.ts";

/** The six ways refine can fail, in tag order 1 to 6 (GP §11 and Appendix C, O). */
const ERRORS = [
  "out_of_gas", "panic", "bad_exports", "output_oversize", "bad_code", "code_oversize",
] as const;
export type WorkError = (typeof ERRORS)[number];

/** What refine produced: its output, or why there is none. */
export type WorkResult = { ok: Bytes } | { error: WorkError };

/** O(result): tag 0 and the output as a blob, or just the error's tag. */
export const WorkResult: Codec<WorkResult> = {
  encode: (w, result) => {
    if ("ok" in result) {
      w.natural(0n);
      blob.encode(w, result.ok);
    } else {
      w.natural(BigInt(ERRORS.indexOf(result.error) + 1));
    }
  },
  decode: (r) => {
    const tag = Number(r.natural());
    return tag === 0 ? { ok: blob.decode(r) } : { error: ERRORS[tag] };
  },
  fromJson: (json) => {
    const [name, value] = Object.entries(json as object)[0];
    return name === "ok" ? { ok: fromHex(value as string) } : { error: name as WorkError };
  },
};

/** How hard refine worked: gas used, segments imported and exported, extrinsics read. */
export const RefineLoad = record({
  gas_used: natural,
  imports: natural32,
  extrinsic_count: natural32,
  extrinsic_size: natural32,
  exports: natural32,
});
export type RefineLoad = Value<typeof RefineLoad>;

/** A work digest (GP §11): one work item's result, as a work-report carries it. */
export const WorkDigest = record({
  service_id: u32,
  code_hash: hash,
  payload_hash: hash,
  accumulate_gas: u64, // the gas this result may use when it is accumulated
  result: WorkResult,
  refine_load: RefineLoad,
});
export type WorkDigest = Value<typeof WorkDigest>;
```

The tour:

- `ERRORS` lists the failures in tag order, so a tag is just a position in the list (plus
  one, because 0 means success). `as const` tells TypeScript the list will never change,
  which lets `WorkError` be exactly those six names and nothing else.
- `WorkResult` is a hand-made codec, the first since [lesson 2.4](../02-codec/04-codecs.md). A union doesn't fit
  `record` or `seq`, so it gets written out: on the way in, check which shape you hold; on
  the way out, read the tag and build the right shape.
- In the vectors' JSON a result is `{"ok": "0xaabbcc"}` or `{"panic": null}`: one key,
  named after the case. `Object.entries(...)[0]` grabs that key and its value.
- `RefineLoad` is a record inside the digest, matching the JSON's `refine_load` object. On
  the wire there's no nesting, just five compact numbers in a row, and a nested record
  encodes to exactly that.

**Run, expect it to fail**

```sh
npm test
```

```text
...
test at test/work.test.ts:30:3
✖ work_result_1 (tiny) (1.5ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
  + actual - expected
  ... Skipped lines

    {
      accumulate_gas: 33n,
      code_hash: Uint8Array(32) [
        252,
        252,
  ...
      result: {
  +     error: 'bad_exports'
  -     error: 'panic'
      },
      service_id: 84281096
    }

      at checkCodecVector (…/client/test/vectors.ts:28:10)
      at TestContext.<anonymous> (…/client/test/work.test.ts:30:41)
...
```

## Bug hunt

Red, and your own new test passed. (Your fourth planted bug, and a new kind: a codec
whose two directions disagree.) Here's the trail:

1. **The test output.** *a result is tag 0 and the output, or just an error's tag* passed.
   So did `work_result_0`, the successful digest. Only `work_result_1` failed, tiny and
   full, and its diff points at one line:

   ```text
   result: {
   +     error: 'bad_exports'
   -     error: 'panic'
   ```

   `+` is what your code produced, `-` what the vector expected. Your client read a panic
   as "bad exports".
2. **The dashboard.** *Tests failed* says 2, and *Test results* has the two `FAIL` lines,
   both `work_result_1`.

   ![Failed tests panel](./images/02-failed-tests.png)
3. **The reasoning.** Your encode test proved a panic *writes* as `0x02`, and the vector's
   bytes say `02` too. So the bytes are right and the *reading* is wrong. `decode` turns
   tag 2 into `ERRORS[2]`, the third name in the list: `"bad_exports"`. But tags start at
   1 (0 means success), and list positions start at 0. Encoding remembered the `+ 1`;
   decoding forgot the `- 1`.

That's why the vectors check both directions: decode the bytes into the value, *and*
encode the value back into the bytes. A test of one direction can't catch the other.
The fix:

**Replace in** `src/work.ts`

```ts
/** O(result): tag 0 and the output as a blob, or just the error's tag. */
export const WorkResult: Codec<WorkResult> = {
  encode: (w, result) => {
    if ("ok" in result) {
      w.natural(0n);
      blob.encode(w, result.ok);
    } else {
      w.natural(BigInt(ERRORS.indexOf(result.error) + 1));
    }
  },
  decode: (r) => {
    const tag = Number(r.natural());
    return tag === 0 ? { ok: blob.decode(r) } : { error: ERRORS[tag - 1] };
  },
  fromJson: (json) => {
    const [name, value] = Object.entries(json as object)[0];
    return name === "ok" ? { ok: fromHex(value as string) } : { error: name as WorkError };
  },
};
```

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ work_result_0 (tiny) (0.2ms)
✔ work_result_1 (tiny) (0.2ms)
✔ work_result_0 (full) (0.2ms)
✔ work_result_1 (full) (0.1ms)
...
ℹ tests 30
ℹ suites 0
ℹ pass 30
ℹ fail 0
...
reported 30 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791727155485
...
```

## Watch it

**Replace in** `bin/decode.ts`

```ts
import { WorkDigest } from "../src/work.ts";

/** The structures this program knows, by the test vectors' names for them. */
const CODECS: Record<string, Codec<unknown>> = {
  refine_context: RefineContext,
  work_item: WorkItem,
  work_package: WorkPackage,
  work_result: WorkDigest,
};
```

What flows through this run: the file's 82 bytes, the digest they decode to, the trace printed:

::: code-group

```text [what goes in]
work_result_1.bin, 82 bytes:
08 07 06 05 fc fc 85 7d ab 21 6d af 41 f4 09 c2
01 26 85 84 6e 4d 34 ae df ea ca f8 4d 9a df eb
da 73 fa e6 d5 5e 07 43 8a ee eb 0d 65 09 ab 28
af 8a 75 8d 1f b7 04 24 db 6b 27 c7 e1 ef 64 73
e7 21 c3 28 21 00 00 00 00 00 00 00 02 00 00 00
00 00
```

```ts [what it computes]
// WorkDigest.decode(r): the value it returns, field by field
const computed = {
  service_id: 84281096, // 08 07 06 05, little end first: 0x05060708
  code_hash: "0xfcfc857d…", // 32 bytes, as they are
  payload_hash: "0xd55e0743…", // 32 bytes, as they are
  accumulate_gas: 33, // 8 bytes, 21 00 00 00 00 00 00 00
  result: { error: "panic" }, // tag 02: ERRORS[2 − 1], no bytes follow
  refine_load: { gas_used: 0, imports: 0, extrinsic_count: 0, extrinsic_size: 0, exports: 0 },
};
```

```text [what comes out]
    0..4     service_id                     0x08070605
   68..76    accumulate_gas                 0x2100000000000000
   76..77    result                         0x02
```

:::

Read left to right: four fixed bytes of service, two hashes, eight bytes of gas, then
the tag `02`, which `WorkResult`'s codec turns into `{ error: "panic" }` with nothing
after it. The five zeros left are the load's compact naturals, a byte each.

**Run**

```sh
npm pkg set scripts.decode-work-result="node bin/decode.ts work_result ../vectors/codec/tiny/work_result_1.bin"
npm run decode-work-result
```

```text
    0..4     service_id                     0x08070605
    4..36    code_hash                      0xfcfc857dab216daf41f409c2012685846e4d34aedfeacaf84d9adfebda73fae6
   36..68    payload_hash                   0xd55e07438aeeeb0d6509ab28af8a758d1fb70424db6b27c7e1ef6473e721c328
   68..76    accumulate_gas                 0x2100000000000000
   76..77    result                         0x02
   77..78    refine_load.gas_used           0x00
   78..79    refine_load.imports            0x00
   79..80    refine_load.extrinsic_count    0x00
   80..81    refine_load.extrinsic_size     0x00
   81..82    refine_load.exports            0x00
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=decode-1791727155961
```

The whole story of `work_result_1` is one byte: `result 0x02`, a panic. Then five compact
zeros for the load, one byte each, as [lesson 2.2](../02-codec/02-compact-naturals.md) wrote them.

<details>
<summary>lasair: a variant and a <code>match</code>, in <code>lib/serialization.ml</code></summary>

OCaml has either-or values built in. A *variant* type lists its cases, and `match`
handles each one:

```ocaml
type work_result =
  | ResultOk of bytes
  | ResultOOG        (* Out of gas / ∞ *)
  | ResultPanic
  | ResultBadExports
  | ResultOversize
  | ResultBAD
  | ResultBIG

let encode_work_result (r : work_result) : bytes =
  match r with
  | ResultOk data ->
    let inner = encode_var data in
    let result = Bytes.create (1 + Bytes.length inner) in
    Bytes.set result 0 '\x00';
    Bytes.blit inner 0 result 1 (Bytes.length inner);
    result
  | ResultOOG -> Bytes.make 1 '\x01'
  | ResultPanic -> Bytes.make 1 '\x02'
  | ResultBadExports -> Bytes.make 1 '\x03'
  | ResultOversize -> Bytes.make 1 '\x04'
  | ResultBAD -> Bytes.make 1 '\x05'
  | ResultBIG -> Bytes.make 1 '\x06'
```

Seven cases, seven tags: the same O function as yours, with the tags written out one by
one where yours count along the `ERRORS` list.

</details>

## Check your understanding

::: check
**What is a work digest, and who makes it?**

- [x] The summary of one refined work-item, made by the core's guarantors
  > Yes: the service, how it went, and the load. The guarantors build it from the item
  > and from running it.
- [ ] The hash of a work-package, made by its builder
  > No: a digest is about one item, not the package, and the builder can't make it: it
  > records what running the item did.
- [ ] A service's state after accumulation, made by every validator
  > No: that comes later. The digest is what refine hands to accumulate.

**Which parts of a digest come from running the code, and which are copied from the item?**

- [ ] All of it comes from running the code
  > No: most of it is known before anything runs. The service, the code hash and the
  > accumulate gas are the item's own.
- [x] Only the result and the gas used come from running it; the rest is copied, hashed or counted from the item
  > Yes: that is (14.10). The payload is hashed, the counts are the lengths of the item's
  > lists.
- [ ] Only the service is copied; the rest is computed
  > No: the code hash and the accumulate gas are copied too.

**Refine failed. What does the digest carry in place of the output?**

- [ ] An empty output
  > No: an empty output is a success with nothing in it. A failure is a different case.
- [x] Which of six errors it was, and nothing else
  > Yes: out of gas, panic, bad exports, oversize, bad code, or code too big. The result is
  > either an output or one of these, never both.
- [ ] The error and whatever output there was so far
  > No: a failed refine has no output to pass on.

**Why is a digest kept so small, with its numbers in the compact form?**

- [ ] So a core can refine it faster
  > No: the digest is written after refining. Its size doesn't change the work.
- [x] It goes on the chain inside a report, where every validator reads and keeps it
  > Yes: the work stays on one core, the digest goes to everyone. The Gray Paper says
  > space is at a premium here.
- [ ] The codec can't write big numbers
  > No: it can. Compact is a choice: small numbers take one byte.

**What happens to a digest's output after refine?**

- [ ] Nothing: refine is the end of the job
  > No: refine only computes. A service's state changes in the second stage.
- [ ] The guarantors write it into the service's state themselves
  > No: guarantors work in-core and can't touch the state. Only the chain can.
- [x] Accumulate, on the chain, folds it into the service's state
  > Yes: refine runs on a core and returns a result; accumulate runs on every validator
  > and applies it ([Part 16](../16-host-calls/index.md)).
:::

## What you have

The card a core sends back for every work item, and your client's first value that is one
thing *or* another. [Lesson 3.3](./03-a-work-report.md) wraps the cards in the
work-report that guarantors sign.

Next: [3.3 A work-report](./03-a-work-report.md)
