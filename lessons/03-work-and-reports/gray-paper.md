# The formulas, in plain words

[Part 3](./index.md)'s appendix: every formula of the paper the part quotes, explained. The first half is the shapes your client decodes: a package and its
items (§14.3), a context (§11.1.2), a digest (§11.1.4) and a report with its availability
specification (§11.1.1, §11.1.3). The second half is the rest of §14, what the guarantors
do in-core to turn a package into a report: your client never runs it, but a report's
every field comes from it, and an interview may ask. Each formula comes with its key, then
the same four steps: read it aloud, say it in plain words, watch it work on a real value,
and find it in your client. [Reading the Gray Paper](../reading-the-gray-paper.md) teaches
the shapes a line can take, if one of these stops you.

All the real values here come from the codec vectors, `vectors/codec/tiny/`: one
`work_package`, one `work_report` and two `work_result` vectors (the old name for a digest). They
were made one by one, so the report is not the one the package would really give: its
digests don't hash this package's payloads. Each is real on its own, and that's how they
are used below.

## (14.2) and (14.3): a package and its items

::: gray-paper-eq 14.2

<a id="ex-14-2"></a>The Gray Paper's (14.2), [in its place in the paper's words](./01-a-work-package.md#eq-14-2):

$$
\begin{equation}
\mathbb{P} \equiv \!\left\lgroup
\mathbf{j}\in \mathbb{B}_{},\
h\in \mathbb{N}_S,\
u\in \mathbb{H}_{},\
\mathbf{f}\in \mathbb{B}_{},\
\mathbf{c}\in \mathbb{C},\
\mathbf{w}\in \left[\!\left[\mathbb{W}\right]\!\right]_{1:\mathsf{I}}
\right\rgroup\! \tag{14.2}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-workpackage" class="gk-wrap">$\mathbb{P}$</span> | P | the set of work-packages: up to 16 work-items for one core, with their authorizer and context |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-tuple">$\!\left\lgroup x\right\rgroup\!$</span> | the tuple of | a record: named fields, each with its type, like an object in JSON |
| <span id="gk-isa">[$x\in y$](../symbols.md#in)</span> | in | belongs to: the field's type |
| <span id="gk-wp-authtoken" class="gk-wrap">$\mathbf{j}$</span> | j | the authorization token: a blob the authorizer's code reads, a signature say (`authorization`) |
| <span id="gk-blob">[$\mathbb{B}$](../symbols.md#blobs)</span> | B, or B sub n | bytes: any run of them; 𝔹ₙ exactly n of them |
| <span id="gk-wp-authcodehost">$h$</span> | h | the service whose preimages hold the authorizer's code (`auth_code_host`) |
| <span id="gk-serviceid" class="gk-wrap">$\mathbb{N}_S$</span> | N sub S | a service id: a whole number below 2³², 4 bytes |
| <span id="gk-wp-authcodehash">$u$</span> | u | the hash of the authorizer's code (`auth_code_hash`) |
| <span id="gk-hash">$\mathbb{H}$</span> | H | a 32-byte value, usually a hash |
| <span id="gk-wp-authconfig" class="gk-wrap">$\mathbf{f}$</span> | f | the authorizer's configuration blob, its settings (`authorizer_config`) |
| <span id="gk-wp-context" class="gk-wrap">$\mathbf{c}$</span> | c | the package's refinement context |
| <span id="gk-workcontext" class="gk-wrap">$\mathbb{C}$</span> | C | the set of refinement contexts: the recent blocks a package was built against, and the packages it needs first |
| <span id="gk-wp-workitems" class="gk-wrap">$\mathbf{w}$</span> | w | the package's work-items: 1 to 16 |
| <span id="gk-sequence">[$\left[\!\left[x\right]\!\right]$](../symbols.md#sequence)</span> | a sequence of | ⟦T⟧ is an array of T; a subscript is its length, :n at most n, n: at least n |
| <span id="gk-Cmaxpackageitems" class="gk-wrap">$\mathsf{I}$</span> | I | the most work-items a package holds, so the most digests a report holds: 16 |
| <span id="gk-workitem" class="gk-wrap">$\mathbb{W}$</span> | W | the set of work-items: one job for one service, with its payload, gas limits, imports, extrinsics and export count |

</details>

:::

::: gray-paper-eq 14.3

<a id="ex-14-3"></a>The Gray Paper's (14.3), [in its place in the paper's words](./01-a-work-package.md#eq-14-3):

$$
\begin{equation}
\mathbb{W} \equiv \!\left\lgroup\begin{aligned}
&s\in \mathbb{N}_S,
c\in \mathbb{H}_{},
\mathbf{y}\in \mathbb{B}_{},
g\in \mathbb{N}_G,
a\in \mathbb{N}_G,
e\in \mathbb{N}, \\
&\mathbf{i}\in \left[\!\left[\!\left\lgroup\mathbb{H}_{} \cup (\mathbb{H}_{}^\boxplus),\mathbb{N}\right\rgroup\!\right]\!\right]_{},
\mathbf{x}\in \left[\!\left[\!\left\lgroup\mathbb{H}_{}, \mathbb{N}\right\rgroup\!\right]\!\right]_{}
\end{aligned}\right\rgroup\! \tag{14.3}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-wi-serviceindex">$s$</span> | s | the service the item is for |
| <span id="gk-wi-codehash">$c$</span> | c | the code hash the item expects its service to have |
| <span id="gk-wi-payload" class="gk-wrap">$\mathbf{y}$</span> | y | the item's payload: the input its refine reads |
| <span id="gk-wi-refgaslimit">$g$</span> | g | the gas refine may use on this item |
| <span id="gk-gas" class="gk-wrap">$\mathbb{N}_G$</span> | N sub G | an amount of gas: a u64 |
| <span id="gk-wi-accgaslimit">$a$</span> | a | the gas accumulate may use on this item's result |
| <span id="gk-wi-exportcount">$e$</span> | e | how many segments the item says it will export |
| <span id="gk-N" class="gk-wrap">[$\mathbb{N}$](../symbols.md#naturals)</span> | N | the whole numbers: 0, 1, 2 and up; a subscript is a bound, ℕ₈ is 0 to 7 |
| <span id="gk-wi-importsegments" class="gk-wrap">$\mathbf{i}$</span> | i | the segments the item imports: each a segments root (or a package hash) and an index |
| <span id="gk-cup">$\cup$</span> | union | everything in either side |
| <span id="gk-boxplus">$\boxplus$</span> | boxed | H⊞ marks a hash as a package's hash, to be swapped for that package's segments root |
| <span id="gk-wi-extrinsics" class="gk-wrap">$\mathbf{x}$</span> | x | the item's extrinsics: each a blob's hash and length |

</details>

:::

**Read it aloud.** "P is defined as the tuple of: j, a blob; h, a service id; u, a hash;
f, a blob; c, a refinement context; and w, a sequence of one to I work-items. W is
defined as the tuple of: s, a service id; c, a hash; y, a blob; g and a, two gas amounts;
e, a natural; i, a sequence of pairs, each a hash (plain or boxed) and a natural; and x,
a sequence of pairs, each a hash and a natural."

**In plain words.** Two type lines, each a schema. A package is a permission slip (the
token 𝐣, and the authorizer named by its code host h, code hash u and configuration 𝐟),
a postmark (the context 𝐜) and 1 to 16 jobs (𝐰). A job, a work-item, says which service
runs it (s) and with which code (c), what input it gets (𝐲), how much gas refine and
accumulate may burn (g and a), and its manifest: the segments it imports (𝐢), the
extrinsic blobs it reads (𝐱) and how many segments it will export (e). An import names
its segment by a segments root and an index; a boxed hash, ℍ⊞, names the exporting
package instead, and the guarantors swap it for that package's segments root.

**On a real value.** The `work_package` vector:

```text
𝐣  authorization          0x0102030405              a token of 5 bytes
h  auth_code_host         305419896                 the service holding the code
u  auth_code_hash         0x022e5e16…               which code
𝐟  authorizer_config      0x00010203040506070809    settings: 10 bytes
𝐜  context                anchor slot 11, lookup anchor slot 33, no prerequisites
𝐰  items                  2 items: 1 ≤ 2 ≤ I = 16
𝐰[0]  s 16909060, g 42, a 42, e 4, 𝐲 0x0102030405, 3 imports, 2 extrinsics (16 and 17 bytes)
𝐰[1]  s 84281096, g 77, a 77, e 7, 𝐲 0x030201, 2 imports, 3 extrinsics (32, 33, 34 bytes)
```

Encoded, that's 695 bytes. Every import here has index 0, 1 or 2, under 2^15, so all five
are plain segments roots: none is a boxed package hash.

**In your client.** `WorkPackage` in `src/work.ts`, written in [3.1](./01-a-work-package.md#the-code);
`WorkItem` came first, in [lesson 2.6](../02-codec/06-the-first-test-vectors.md#the-structures).

## (11.4): the refinement context

::: gray-paper-eq 11.4

<a id="ex-11-4"></a>The Gray Paper's (11.4), [in its place in the paper's words](./01-a-work-package.md#eq-11-4):

$$
\begin{equation}
\mathbb{C} \equiv \!\left\lgroup\,\begin{alignedat}{5}
a&\in \mathbb{H}_{}\,,\;
&n&\in \mathbb{N}_T\,,\;
&s&\in \mathbb{H}_{}\,,\;
&b&\in \mathbb{H}_{}\,,\;\\
l&\in \mathbb{H}_{}\,,\;
&t&\in \mathbb{N}_T\,,\;
&r&\in \mathbb{H}_{}\,,\;
&\mathbf{p}&\in \left\{\mkern-5mu\left[\,\mathbb{H}_{}\,\right]\mkern-5mu\right\}
\end{alignedat}\right\rgroup\! \tag{11.4}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-wc-anchortime">$n$</span> | n | the anchor block's timeslot |
| <span id="gk-timeslot" class="gk-wrap">$\mathbb{N}_T$</span> | N sub T | a timeslot: a u32 counting 6-second slots |
| <span id="gk-wc-anchoraccoutlog">$b$</span> | b | the anchor block's accumulation-output super-peak, the belt's root (`beefy_root`) |
| <span id="gk-wc-lookupanchorhash">$l$</span> | l | the lookup anchor's header hash: the block whose state code is fetched from |
| <span id="gk-wc-lookupanchortime">$t$</span> | t | the lookup anchor's timeslot: at most L = 14,400 slots old |
| <span id="gk-wc-lookupanchorpoststate">$r$</span> | r | the lookup anchor's state root |
| <span id="gk-wc-prerequisites" class="gk-wrap">$\mathbf{p}$</span> | p | a context's prerequisites: hashes of packages that must be accumulated first |
| <span id="gk-protoset">$\left\{\mkern-5mu\left[\,x\,\right]\mkern-5mu\right\}$</span> | the set of | a set written in order: no repeats, kept sorted |

</details>

:::

**Read it aloud.** "C is defined as the tuple of: a, a hash; n, a timeslot; s, a hash; b,
a hash; l, a hash; t, a timeslot; r, a hash; and p, a set of hashes."

**In plain words.** The chain as the package saw it, named by two recent blocks. The
anchor (a, n, s, b: its header hash, slot, state root and belt root) is a block the
chain must still remember when the report arrives, at most H = 8 blocks back, so a report
can't be built against a fork or a stale chain. The lookup anchor (l, t, r) is the block
whose state the code and preimages are read from: it may be older, up to L = 14,400
slots, a day. Then 𝐩, the packages that must be accumulated before this one may be.

**On a real value.** The `refine_context` vector, 169 bytes:

```text
a  anchor                    0xc0564c5e…   32 bytes
n  anchor_slot               11            4 bytes
s  state_root                0xf6967658…   32 bytes
b  beefy_root                0x9329de63…   32 bytes
l  lookup_anchor             0x60751ab5…   32 bytes
t  lookup_anchor_slot        33            4 bytes
r  lookup_anchor_state_root  0x8f665c40…   32 bytes
𝐩  prerequisites             none          1 byte: the count, 0
                                           32 × 5 + 4 × 2 + 1 = 169 bytes
```

**In your client.** `RefineContext` in `src/work.ts`, from [lesson 2.6](../02-codec/06-the-first-test-vectors.md#the-structures);
[12.5](../12-guarantees/05-bad-reports.md) checks the anchor against the recent blocks.

## (14.11): the authorizer's name, and its code

::: gray-paper-eq 14.11

<a id="ex-14-11"></a>The Gray Paper's (14.11), [in its place in the paper's words](./01-a-work-package.md#eq-14-11):

$$
\begin{equation}
\forall \mathbf{p} \in \mathbb{P}: \left\{ \,\begin{aligned}
\mathbf{p}_{a} &\equiv \mathcal{H}\left(\mathbf{p}_{u} \frown \mathbf{p}_{\mathbf{f}}\right) \\
\mathcal{E}_{}\left(\left\updownarrow\mathbf{p}_{\mathbf{m}}\right.\!, \mathbf{p}_{\mathbf{u}}\right) &\equiv \Lambda(\delta\left[\mathbf{p}_{h}\right], (\mathbf{p}_{\mathbf{c}})_{t}, \mathbf{p}_{u}) \\
\left(\mathbf{p}_{\mathbf{m}}, \mathbf{p}_{\mathbf{u}}\right) &\in \!\left\lgroup\mathbb{B}_{}, \mathbb{B}_{}\right\rgroup\!
\end{aligned} \right. \tag{14.11}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-forall">$\forall$</span> | for all | for every value: ∀c ∈ ℕ_C means for each core c |
| <span id="gk-in">[$\in$](../symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-abracegroup">$\left\{ \begin{aligned}x\end{aligned} \right.$</span> | as follows | a brace grouping lines that hold together: for a function, its type on top, then what each input becomes |
| <span id="gk-blake">$\mathcal{H}\left(x\right)$</span> | H of | the Blake2b hash of what's in the brackets: 32 bytes |
| <span id="gk-concat" class="gk-wrap">[$\frown$](../symbols.md#concat)</span> | concatenate | join: the left sequence followed by the right |
| <span id="gk-encode">[$\mathcal{E}\left(x\right)$](../symbols.md#encode)</span> | E of | the encoding of what's in the brackets: its bytes, by Appendix C's rules |
| <span id="gk-var">[$\left\updownarrow x\right.\!$](../symbols.md#length-prefix)</span> | with its length | ↕x: x with its length in front, as a compact natural |
| <span id="gk-wp-metadata" class="gk-wrap">$\mathbf{m}$</span> | m | the metadata stored in front of the code in its preimage |
| <span id="gk-wp-authcode" class="gk-wrap">$\mathbf{u}$</span> | u | the authorizer's code, found in the code host's preimages |
| <span id="gk-histlookup" class="gk-wrap">$\Lambda$</span> | lambda (capital) | the historical lookup: the preimage with hash h if the account had it at slot t, else ∅ |
| <span id="gk-accounts" class="gk-wrap">$\delta$</span> | delta | the service accounts: every service's code hash, balance, storage and preimages |
| <span id="gk-subb">[$\left[x\right]$](../symbols.md#sequence)</span> | at | x[i]: the item at index i, or the value at key i |

</details>

:::

**Read it aloud.** "For every package p: p's a is defined as H of p's u concatenated with
p's f. The encoding of p's m, with its length, followed by p's u bold, is defined as the
historical lookup, Lambda, of the account delta at p's h, at the slot of p's context's
lookup anchor, of p's u. And m and u bold are two blobs."

**In plain words.** Two things, both made from the package's own fields. First, the
authorizer's *name* is the hash of its code hash followed by its configuration: 32 + the
configuration's length bytes in, 32 out. That name is what a report carries and what
[Part 13](../13-authorization/index.md)'s pools hold. Second, the authorizer's *code*: look
up the preimage of the code hash in the code host's account, as it stood at the lookup
anchor's slot. That preimage is a small metadata blob, with its length in front, and then
the code. Fetching it as of a fixed past slot means every guarantor, and every auditor
later, gets the same program.

**On a real value.** The `work_package` vector:

```text
u          0x022e5e165cc8bd586404257f5cd6f5a31177b5c951eb076c7c10174f90006eef    32 bytes
𝐟          0x00010203040506070809                                                10 bytes
u ⌢ 𝐟      0x022e…6eef00010203040506070809                                       42 bytes
a = H(…)   0x6fb4f1d7261c1c403b401a55ffc41e95b423773e2787c53162c9e503094b78ed    32 bytes
```

(The `work_report` vector's `authorizer_hash` is `0x022e5e16…`, the code hash itself: the
two vectors were made apart.) Change one byte of 𝐟 and a is a different authorizer.

**In your client.** Nowhere, on purpose: block import never runs or names an authorizer
from a package. It only checks the report's a against the core's pool, in
[12.4](../12-guarantees/04-bad-guarantees.md).

## (11.6) and (11.7): a digest, and how work fails

::: gray-paper-eq 11.6

<a id="ex-11-6"></a>The Gray Paper's (11.6), [in its place in the paper's words](./02-work-digests.md#eq-11-6):

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
| <span id="gk-wd-payloadhash">$y$</span> | y | the hash of the item's payload |
| <span id="gk-wd-result" class="gk-wrap">$\mathbf{l}$</span> | l | the result: the bytes refine returned, or one of six errors |
| <span id="gk-workerror" class="gk-wrap">$\mathbb{E}$</span> | E | the set of work errors: out of gas, panic, bad exports, oversize, BAD (no code) and BIG (code too big) |
| <span id="gk-wd-importcount">$i$</span> | i | how many segments the item imported |
| <span id="gk-wd-xtcount">$x$</span> | x | how many extrinsic blobs the item used |
| <span id="gk-wd-xtsize">$z$</span> | z | those extrinsics' total size, in bytes |

</details>

:::

::: gray-paper-eq 11.7

<a id="ex-11-7"></a>The Gray Paper's (11.7), [in its place in the paper's words](./02-work-digests.md#eq-11-7):

$$
\begin{equation}
\mathbb{E} \in \left\{\, \infty, \unicode{x21AF}, \circledcirc, \circleddash, \texttt{BAD}, \texttt{BIG} \,\right\} \tag{11.7}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-set">$\left\{\,x\,\right\}$</span> | the set of | a set: values with no order and no repeats |
| <span id="gk-oog" class="gk-wrap">$\infty$</span> | out of gas | ∞: the program ran out of gas |
| <span id="gk-panic">$\unicode{x21AF}$</span> | panic | ↯: the program trapped |
| <span id="gk-badexports" class="gk-wrap">$\circledcirc$</span> | bad exports | the error: the item exported a different number of segments than it said it would |
| <span id="gk-oversize" class="gk-wrap">$\circleddash$</span> | oversize | the error: this output would make the report's outputs bigger than W_R |
| <span id="gk-token">$\texttt{x}$</span> | the string | a name in typewriter type: an instruction's or helper's name, or fixed bytes written as text: the ASCII bytes of its words; the dollar sign in front only marks them as text and is not one of the bytes |

</details>

:::

**Read it aloud.** "D is defined as the tuple of: s, a service id; c, a hash; y, a hash;
g, an amount of gas; l, a blob or a work error; u, an amount of gas; and i, x, z and e,
four naturals. E is in the set of: infinity, the lightning bolt, bad exports, oversize,
BAD and BIG."

**In plain words.** A digest is one work-item's result card, ten fields. Four say whose
it is and what to do next: the service s, the code hash c it ran, the payload's hash y,
and the gas g its accumulate may use. One is the result 𝐥: refine's output bytes, or one
of six errors. The last five are the load, what refining cost: gas used u, segments
imported i, extrinsics read x and their size z, segments exported e. The six errors are ∞
(out of gas), ☇ (panic), ⊚ (exported a different count than it promised), ⊖ (output too
big), BAD (the code wasn't found at the lookup anchor) and BIG (the code was over W_C =
4,000,000 bytes).

**On a real value.** `work_result_1`, 82 bytes, a panic:

```text
s  service_id      84281096        08 07 06 05     4 bytes
c  code_hash       0xfcfc857d…                     32 bytes
y  payload_hash    0xd55e0743…                     32 bytes
g  accumulate_gas  33              21 00 … 00      8 bytes
𝐥  result          panic           02              1 byte: tag 2, nothing after
u i x z e          0 0 0 0 0       00 00 00 00 00  5 bytes, compact
                                   4 + 32 + 32 + 8 + 1 + 5 = 82 bytes
```

`work_result_0` succeeded with `0xaabbcc`: its 𝐥 is `00 03 aa bb cc`, tag 0, the
length 3, the three bytes, so 86 bytes in all.

**In your client.** `WorkResult` and `WorkDigest` in `src/work.ts`, written in
[3.2](./02-work-digests.md#the-code).

## (14.10): from item to digest

::: gray-paper-eq 14.10

<a id="ex-14-10"></a>The Gray Paper's (14.10), [in its place in the paper's words](./02-work-digests.md#eq-14-10):

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
| <span id="gk-to">[$\to$](../symbols.md#to)</span> | to | what goes in, to what comes out: A → B takes an A and gives a B |
| <span id="gk-mapsto">$\mapsto$</span> | maps to | what a function gives back for an input: x ↦ y says x becomes y |
| <span id="gk-is">$x\mathrel{\unicode{x2AF6}} y$</span> | is a | names a field and gives its type, in a tuple |
| <span id="gk-len">$\left\vert x\right\vert$</span> | the size of | \|x\|: how many items x has, or how many bytes |
| <span id="gk-sum">$\sum$</span> | the sum of | add up what follows, once for each value the subscript ranges over |

</details>

:::

**Read it aloud.** "C maps a work-item, a blob or a work error, and an amount of gas, to
a work-digest. The item, with its s, c, y, a, e, i and x, and a result l and gas used u,
go to: s; c; y, which is H of the payload; g, which is a; l; u; i, which is the length of
i bold; e; x, which is the length of x bold; and z, which is the sum of z over the pairs
of h and z in x bold."

**In plain words.** Most of a digest is copied or counted, not computed. From the item:
the service, the code hash, the accumulate gas limit (renamed g) and the export count.
Hashed: the payload, so the report carries 32 bytes however big the input was. Counted:
the imports and the extrinsics, and the extrinsics' total length. Only two fields come
from running the code: the result 𝐥 and the gas used u, the function's other two inputs.

**On a real value.** Item 0 of the `work_package` vector, if its refine returned
`0xaabbcc` using 0 gas:

```text
s  16909060                 copied
c  0x70a50829…              copied
y  H(0x0102030405)          0x02b8394a…: the payload, hashed
g  42                       a, copied
𝐥  0xaabbcc                 refine's output
u  0                        gas refine used
i  3                        3 imports
e  4                        copied: it said it exports 4
x  2                        2 extrinsics
z  16 + 17 = 33             their lengths, summed
```

The `work_result_0` vector has the same s, c, g and result, but its y is `0xfa99b97e…` and
its counts are all 0: it was made apart from the package, as the start of this page says.

**In your client.** Nowhere: building a digest is the guarantors' job. Your client only
decodes it ([3.2](./02-work-digests.md#the-code)).

## (11.2): the report

::: gray-paper-eq 11.2

<a id="ex-11-2"></a>The Gray Paper's (11.2), [in its place in the paper's words](./03-a-work-report.md#eq-11-2):

$$
\begin{equation}
\mathbb{R} \equiv \!\left\lgroup
\begin{aligned}
&\mathbf{s}\in \mathbb{Y},\
\mathbf{c}\in \mathbb{C},\
c\in \mathbb{N}_{\mathsf{C}},\
a\in \mathbb{H}_{},\
\mathbf{t}\in \mathbb{B}_{},\\
&\mathbf{l}\in \left\langle\!\left\vert \mathbb{H}_{}\to\mathbb{H}_{}\right\vert\!\right\rangle,\
\mathbf{d}\in \left[\!\left[\mathbb{D}\right]\!\right]_{1:\mathsf{I}},\
g\in \mathbb{N}_G
\end{aligned}
\right\rgroup\! \tag{11.2}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-workreport" class="gk-wrap">$\mathbb{R}$</span> | R | the set of work-reports: a core's signed receipt for one work-package |
| <span id="gk-wr-avspec" class="gk-wrap">$\mathbf{s}$</span> | bold s | a report's availability spec: the package's hash, its bundle's length, and the roots of its pieces and of the segments it exports |
| <span id="gk-avspec" class="gk-wrap">$\mathbb{Y}$</span> | Y | the set of availability specifications: package hash, bundle length, erasure root, shard count, segments root, segment count |
| <span id="gk-coreindex" class="gk-wrap">$\mathbb{N}_{\mathsf{C}}$</span> | N sub C | the core indices: 0 to C − 1 |
| <span id="gk-wr-authtrace" class="gk-wrap">$\mathbf{t}$</span> | t | the authorizer's trace: the blob its code returned when it said yes (`auth_output`) |
| <span id="gk-dictionary">$\left\langle\!\left\vert x\to y\right\vert\!\right\rangle$</span> | a dictionary from K to V | a map: keys of type K, each with one value of type V |
| <span id="gk-wr-digests" class="gk-wrap">$\mathbf{d}$</span> | d | the report's digests, one per work-item, 1 to 16 of them (`results`) |

</details>

:::

**Read it aloud.** "R is defined as the tuple of: s, an availability specification; c, a
refinement context; c, a core index; a, a hash; t, a blob; l, a dictionary from hash to
hash; d, a sequence of one to I work-digests; and g, an amount of gas."

**In plain words.** The receipt for one whole package, made in-core and read on the chain.
𝐬 says how to find the package's data again; 𝐜 is the package's own context, copied; c is
the core that did the work; a, 𝐭 and g are the authorizer's name, its trace (what its code
returned when it said yes) and the gas it burned; 𝐥 maps each package this one imported
from *by package hash* to that package's segments root; 𝐝 has one digest per item, in the
items' order. The paper uses c twice, bold for the context and plain for the core.

**On a real value.** The `work_report` vector, 483 bytes on tiny:

```text
𝐬  package_spec         hash 0x30466e0a…, length 42, 6 shards, 69 exports
𝐜  context              the refine_context above
c  core_index           3                compact: 1 byte
a  authorizer_hash      0x022e5e16…      32 bytes
g  auth_gas_used        0                compact: 1 byte
𝐭  auth_output          0x0102030405     a 5-byte blob
𝐥  segment_root_lookup  empty            1 byte: the count, 0
𝐝  results              2 digests: 0xaabbcc, and a panic
```

On full only the shard count changes, 6 to 1,023: two bytes as a u16 either way. (The
vectors' byte order is Appendix C's, not the formula's: g comes before 𝐭 there.)

**In your client.** `WorkReport` in `src/work.ts`, written in [3.3](./03-a-work-report.md#the-code).

## (11.5): the availability specification

::: gray-paper-eq 11.5

<a id="ex-11-5"></a>The Gray Paper's (11.5), [in its place in the paper's words](./03-a-work-report.md#eq-11-5):

$$
\begin{align}
\mathbb{Y} &\equiv \!\left\lgroup
p\in \mathbb{H}_{}\,,\;
l\in \mathbb{N}_L\,,\;
u\in \mathbb{H}_{}\,,\;
v\in \mathbb{V}\,,\;
e\in \mathbb{H}_{}\,,\;
n\in \mathbb{N}
\right\rgroup\! \tag{11.5}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-as-packagehash">$p$</span> | p | the work-package's hash |
| <span id="gk-bloblength" class="gk-wrap">$\mathbb{N}_L$</span> | N sub L | a length of bytes: a u32 (below 2³²) |
| <span id="gk-as-erasureshards">$v$</span> | v | how many shards the data is cut into: one per validator, 1,023 on full, 6 on tiny |
| <span id="gk-valcount" class="gk-wrap">$\mathbb{V}$</span> | V (the set) | the validator counts allowed: multiples of 3 from 6 to 3C, which is 1,023 on full and 6 on tiny |

</details>

:::

**Read it aloud.** "Y is defined as the tuple of: p, a hash; l, a blob length; u, a
hash; v, a validator count; e, a hash; and n, a natural."

**In plain words.** How to find the package's data again, and check it. p is the package's
hash. l is the length of its bundle, the package with everything needed to refine it
again. u, the erasure root, is one Merkle root over every validator's shard, so a
validator can check its own shard alone. v is how many shards: one per validator. e, the
segments root, commits to the segments the package exported, so a later package that
imports one can check it; n is how many there were.

**On a real value.** The `work_report` vector's `package_spec`:

```text
p  hash            0x30466e0a…   32 bytes
l  length          42            u32: 4 bytes
u  erasure_root    0x7af11fda…   32 bytes
v  erasure_shards  6             u16: 2 bytes (1,023 on full)
e  exports_root    0xe8e52949…   32 bytes
n  exports_count   69            u16: 2 bytes
                                 32 + 4 + 32 + 2 + 32 + 2 = 104 bytes
```

**In your client.** `AvailabilitySpec` in `src/work.ts`, written in [3.3](./03-a-work-report.md#the-code);
[12.4](../12-guarantees/04-bad-guarantees.md) checks v against the number of validators.

## The rest of §14: what the guarantors compute

Everything below runs in-core, on a core's guarantors, and again on its auditors: never in
block import, so your client builds none of it. It is here because every field of a
report is made by it, and because "where does the erasure root come from?" is a fair
interview question. The paper's words come first, then what they say. The *On a real
value* steps use the codec vectors' package where they can and say so where an example is
made up, since no vector runs a guarantor.

### Segments, and why packages are small

::: gray-paper 14.2

#### §14.2 Segments and the Manifest {#gp-14-2}

<a id="gp-14-2-p1"></a>Work-packages are generally small to ensure guarantors need not invest a lot of bandwidth in order to discover whether they can get paid for their evaluation into a work-report. Rather than having much data inline, they instead *reference* data through commitments. The simplest commitments are extrinsic data.

<a id="gp-14-2-p2"></a>Extrinsic data are blobs which are being introduced into the system alongside the work-package itself generally by the work-package builder. They are exposed to the Refine logic as an argument. We commit to them through including each of their hashes in the work-package.

<a id="gp-14-2-p3"></a>Work-packages have two other types of external data associated with them: A cryptographic <abbr class="gp-term" title="a short hash that stands for some data, so the data can be checked against it later">commitment</abbr> to each *imported* segment and finally the number of segments which are *exported*.

:::

::: gray-paper 14.2.1

#### §14.2.1 Segments, Imports and Exports {#gp-14-2-1}

<a id="gp-14-2-1-p1"></a>The ability to communicate large amounts of data from one work-package to some subsequent work-package is a key feature of the JAM availability system. An export segment, defined as the set $\mathbb{J}$, is an <abbr class="gp-term" title="a byte: 8 bits">octet</abbr> sequence of fixed length $\mathsf{W}_G = 4104$. It is the smallest datum which may individually be imported from—or exported to—the long-term D$^3$L during the Refine function of a work-package.

<a id="gp-14-2-1-p2"></a><a id="eq-14-1"></a>

$$
\begin{equation}
\mathbb{J} \equiv \mathbb{B}_{\mathsf{W}_G} \tag{14.1}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-segment" class="gk-wrap">$\mathbb{J}$</span> | J | the set of segments: blobs of exactly W_G = 4,104 bytes, the unit of import and export |
| <span id="gk-Csegmentsize" class="gk-wrap">$\mathsf{W}_G$</span> | W sub G | a segment's size: 4,104 bytes |

</details>

<a id="gp-14-2-1-p3"></a>Exported segments are data which are *generated* through the execution of the Refine logic and thus are a side effect of transforming the work-package into a work-report. Since their data is deterministic based on the execution of the Refine logic, we do not require any particular commitment to them in the work-package beyond knowing how many are associated with each Refine <abbr class="gp-term" title="one run of code in the PVM: Is-Authorized, refine or accumulate">invocation</abbr> in order that we can supply an exact index.

<a id="gp-14-2-1-p4"></a>On the other hand, imported segments are segments which were exported by previous work-packages. In order for them to be easily fetched and verified they are referenced not by hash but rather the root of a Merkle tree which includes any other segments introduced at the time, together with an index into this sequence. This allows for justifications of correctness to be generated, stored, included alongside the fetched data and verified. This is described in depth in the next section.

:::

::: gray-paper 14.2.2

#### §14.2.2 Data Collection and Justification {#gp-14-2-2}

<a id="gp-14-2-2-p1"></a>It is the task of a guarantor to reconstitute all imported segments through fetching said segments' <abbr class="gp-term" title="cut into one piece per validator, so that any third of the pieces rebuild the whole">erasure-coded</abbr> chunks from enough unique validators. Reconstitution alone is not enough since corruption of the data would occur if one or more validators provided an incorrect chunk. For this reason we ensure that the import segment specification (a Merkle root and an index into the tree) be a kind of cryptographic commitment capable of having a <abbr class="gp-term" title="a proof that some data is inside a Merkle root: the sibling hashes on the way up">justification</abbr> applied to demonstrate that any particular segment is indeed correct.

<a id="gp-14-2-2-p2"></a>Justification data must be available to any node over the course of its segment's potential requirement. At around 350 bytes to justify a single segment, justification data is too voluminous to have all validators store all data. We therefore use the same overall availability framework for hosting justification metadata as the data itself.

<a id="gp-14-2-2-p3"></a>The guarantor is able to use this proof to justify to themselves that they are not wasting their time on incorrect behavior. We do not force auditors to go through the same process. Instead, guarantors build an *Auditable Work Package*, and place this in the <abbr class="gp-term" title="the short-term store of bundles for auditors, kept until finality">Audit DA</abbr> system. This is the original work-package, its extrinsic data, its imported data and a concise proof of correctness of that imported data. This tactic routinely duplicates data between the D$^3$L and the Audit DA, however it is acceptable in order to reduce the bandwidth cost for auditors who must justify the correctness as cheaply as possible as auditing happens on average 30 times for each work-package whereas guaranteeing happens only twice or thrice.

:::

**Read it aloud** (14.1)**.** "J is defined as the blobs of W sub G bytes."

**In plain words.** A package travels light: it carries hashes of its extrinsics and
roots of the segments it imports, not the data itself, so a guarantor can decide cheaply
whether the work is worth doing. The heavy data moves on its own:

- an extrinsic is a blob the builder sends beside the package, named in the item by its
  hash and length;
- a segment is exactly W_G = 4,104 bytes. Refine exports segments into the data lake,
  the D³L, where they stay 28 days, and a later package imports them by the root of their
  export tree and an index in it.

Why 4,104 and not 4,096? It is 6 × 684, and 684 is 2 × 342, twice the number of shards
that rebuild data on full: so a segment erasure-codes into whole pieces without padding.
To import a segment, a guarantor fetches its shards from about a third of the validators,
rebuilds it, and checks it against the export tree's root with a Merkle proof of about
350 bytes, so a validator that sent a bad shard can't spoil it. Auditors skip the
fetching: the guarantors put the package, its extrinsics, its imports and their proofs
into one bundle in the audit store, and auditors, about 30 a package against two or
three guarantors, fetch just that.

**On a real value.** Item 0 of the `work_package` vector imports three segments: 3 ×
4,104 = 12,312 bytes the package itself never carries, named by 3 × (32 + 2) = 102 bytes
of roots and indices.

### The package's limits

::: gray-paper 14.3 5-13

#### §14.3 Packages and Items, continued

<a id="gp-14-3-p5"></a>Note that an imported data segment's work-package is identified through the union of sets $\mathbb{H}_{}$ and a tagged variant $\mathbb{H}_{}^\boxplus$. A value drawn from the regular $\mathbb{H}_{}$ implies the hash value is of the segment-root containing the export, whereas a value drawn from $\mathbb{H}_{}^\boxplus$ implies the hash value is the hash of the exporting work-package. In the latter case it must be converted into a segment-root by the guarantor and this conversion reported in the work-report for on-chain validation. Work-packages referenced in this manner are considered dependencies, as are work-packages explicitly listed as prerequisites in the context $\mathbf{c}$. We limit the total number of dependencies to $\mathsf{J} = 8$:

<a id="gp-14-3-p6"></a><a id="eq-14-4"></a>

$$
\begin{equation}
\forall \mathbf{p} \in \mathbb{P}: \left\vert\left\{\,h \;\middle\vert\; \mathbf{w} \in \mathbf{p}_{\mathbf{w}}, \left(h^\boxplus, n\right) \in \mathbf{w}_{\mathbf{i}}\,\right\}\right\vert + \left\vert(\mathbf{p}_{\mathbf{c}})_{\mathbf{p}}\right\vert \le \mathsf{J} \tag{14.4}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-build">$\left\{ x \;\middle\vert\; y \right\}$</span> | for each, such that | built by a rule: the left-hand value, for every case the right-hand side allows (a set, or a sequence in order) |
| <span id="gk-le">$\le$</span> | at most | less than or equal to |
| <span id="gk-Cmaxreportdeps" class="gk-wrap">$\mathsf{J}$</span> | J | the most dependencies a report may have, prerequisites and segment-root lookups together: 8 |

</details>

<a id="gp-14-3-p7"></a>We limit the total number of exported items to $\mathsf{W}_X = 3072$, the total number of imported items to $\mathsf{W}_M = 3072$, and the total number of extrinsics to $\mathsf{T} = 128$:

<a id="gp-14-3-p8"></a><a id="eq-14-5"></a>

$$
\begin{equation}
\!\!\!\!
\begin{aligned}
&\forall \mathbf{p} \in \mathbb{P}: \\
&\ \sum_{\mathbf{w} \in \mathbf{p}_{\mathbf{w}}} \mathbf{w}_{e} \le \mathsf{W}_X \wedge\
\sum_{\mathbf{w} \in \mathbf{p}_{\mathbf{w}}} \left\vert\mathbf{w}_{\mathbf{i}}\right\vert \le \mathsf{W}_M \wedge\
\sum_{\mathbf{w} \in \mathbf{p}_{\mathbf{w}}} \left\vert\mathbf{w}_{\mathbf{x}}\right\vert \le \mathsf{T}
\end{aligned} \tag{14.5}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-Cmaxpackageexports" class="gk-wrap">$\mathsf{W}_X$</span> | W sub X | the most segments a package may export: 3,072 |
| <span id="gk-wedge">$\wedge$</span> | and | both sides are true |
| <span id="gk-Cmaxpackageimports" class="gk-wrap">$\mathsf{W}_M$</span> | W sub M | the most segments a package may import: 3,072 |
| <span id="gk-Cmaxpackagexts" class="gk-wrap">$\mathsf{T}$</span> | T | the most extrinsics a package may use: 128 |

</details>

<a id="gp-14-3-p9"></a>We make an assumption that the preimage to each extrinsic hash in each work-item is known by the guarantor. In general this data will be passed to the guarantor alongside the work-package.

<a id="gp-14-3-p10"></a>We limit the total size of the auditable *work-bundle*, containing the work-package, import and extrinsic items, together with all payloads, the authorizer configuration and the authorization token to around 13.6MB. This limit allows 2MB/s/core D$^{3}$L imports, and thus a full complement of 3,072 imports, assuming no extrinsics, 64 bytes for each of the authorization token and trace, and a work-item payload of 4KB:

<a id="gp-14-3-p11"></a><a id="eq-14-6"></a><a id="eq-14-7"></a><a id="eq-14-8"></a>

$$
\begin{align}
&\begin{aligned}
&\forall \mathbf{p} \in \mathbb{P}: \Big(\left\vert\mathbf{p}_{\mathbf{j}}\right\vert + \left\vert\mathbf{p}_{\mathbf{f}}\right\vert +
\!\!\sum_{\mathbf{w} \in \mathbf{p}_{\mathbf{w}}}\!\!S(\mathbf{w})\Big) \le \mathsf{W}_B \\
& \text{where } S(\mathbf{w} \in \mathbb{W}) \equiv \left\vert\mathbf{w}_{\mathbf{y}}\right\vert + \left\vert\mathbf{w}_{\mathbf{i}}\right\vert\cdot\mathsf{W}_F + \!\!\!\!\!\!\sum_{\left(h, l\right) \in \mathbf{w}_{\mathbf{x}}} \!\!\!l
\end{aligned} \tag{14.6} \\
&\mathsf{W}_F \equiv \mathsf{W}_G + 32\left\lceil\log_2(\mathsf{W}_X)\right\rceil \tag{14.7} \\
&\mathsf{W}_B \equiv \mathsf{W}_M\cdot\mathsf{W}_F + 4096 + 64 + 64 = 13,791,360 \tag{14.8}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-Cmaxbundlesize" class="gk-wrap">$\mathsf{W}_B$</span> | W sub B | the most bytes of blobs, extrinsics and imports a package may bring: 13,791,360 |
| <span id="gk-cdot">$\cdot$</span> | times | multiply |
| <span id="gk-Csegmentfootprint" class="gk-wrap">$\mathsf{W}_F$</span> | W sub F | the room one imported segment takes in a bundle, with its proof: 4,104 + 32 × 12 = 4,488 bytes |
| <span id="gk-ceil">$\left\lceil x\right\rceil$</span> | ceiling of | rounded up to a whole number |
| <span id="gk-log">$\log$</span> | log | the logarithm: log₂ n is the power of 2 that gives n, so log₂ 4,096 is 12 |

</details>

<a id="gp-14-3-p12"></a>We limit the sums of each of the two gas limits to be at most the maximum gas allocated to a core for the corresponding operation:

<a id="gp-14-3-p13"></a><a id="eq-14-9"></a>

$$
\begin{equation}
\forall \mathbf{p} \in \mathbb{P}:\ \;
\sum_{\mathbf{w} \in \mathbf{p}_{\mathbf{w}}}(\mathbf{w}_{a}) < \mathsf{G}_A
\quad\wedge\ \;
\sum_{\mathbf{w} \in \mathbf{p}_{\mathbf{w}}}(\mathbf{w}_{g}) < \mathsf{G}_R \tag{14.9}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-Creportaccgas" class="gk-wrap">$\mathsf{G}_A$</span> | G sub A | the most gas a report's accumulation may be given: 10,000,000 |
| <span id="gk-Cpackagerefgas" class="gk-wrap">$\mathsf{G}_R$</span> | G sub R | the most gas refining a package may use: 5,000,000,000 |

</details>

:::

**Read it aloud.**

- (14.4): "For every package p: the number of distinct h such that some item of p imports
  a boxed h, plus the number of p's context's prerequisites, is at most J."
- (14.5): "For every package p: the sum over its items of e is at most W sub X, and the sum
  of the lengths of i bold is at most W sub M, and the sum of the lengths of x bold is at
  most T."
- (14.6) to (14.8): "For every package p: the length of j, plus the length of f, plus the
  sum over its items of S of w, is at most W sub B; where S of w is the payload's length,
  plus the number of imports times W sub F, plus the sum of the extrinsics' lengths. W sub
  F is defined as W sub G plus 32 times the ceiling of log two of W sub X. W sub B is
  defined as W sub M times W sub F, plus 4,096, plus 64, plus 64: 13,791,360."
- (14.9): "For every package p: the sum of its items' a is less than G sub A, and the sum
  of its items' g is less than G sub R."

**In plain words.** Four caps on one package, so no package can swamp a core:

1. **Dependencies** (14.4): at most J = 8 other packages it waits on, counting the
   packages it imports from by package hash and its prerequisites. A report must keep the
   same cap, (11.3), checked on the chain in [12.5](../12-guarantees/05-bad-reports.md).
2. **Counts** (14.5): at most 3,072 segments exported, 3,072 imported and 128 extrinsics,
   across all its items.
3. **Bytes** (14.6): the bundle's variable parts fit in W_B. Each import costs W_F = 4,104
   + 32 × 12 = 4,488 bytes, the segment and a proof of 12 hashes (log₂ 3,072 is just over
   11, so 12). W_B is room for 3,072 imports, a 4,096-byte payload and 64 bytes each of
   token and trace.
4. **Gas** (14.9): the items' accumulate limits together stay under G_A = 10,000,000, and
   their refine limits under G_R = 5,000,000,000.

The assumption in the middle matters too: the guarantor is expected to have every
extrinsic's data, sent beside the package by its builder.

**On a real value.** The `work_package` vector, step by step:

```text
(14.4)  boxed imports: 0, prerequisites: 0              0 ≤ 8
(14.5)  exports 4 + 7 = 11                              11 ≤ 3,072
        imports 3 + 2 = 5                               5 ≤ 3,072
        extrinsics 2 + 3 = 5                            5 ≤ 128
(14.6)  S(𝐰[0]) = 5 + 3 × 4,488 + (16 + 17)            = 13,502
        S(𝐰[1]) = 3 + 2 × 4,488 + (32 + 33 + 34)       = 9,078
        5 + 10 + 13,502 + 9,078                         = 22,595 ≤ 13,791,360
(14.9)  accumulate 42 + 77 = 119                        119 < 10,000,000
        refine 42 + 77 = 119                            119 < 5,000,000,000
```

**In your client.** Nowhere: the chain never sees a package. The report-side twins of
(14.4) and (14.9), (11.3) and (11.33), are in [12.5](../12-guarantees/05-bad-reports.md#the-code).

### Exporting, and the paged proofs

::: gray-paper 14.3.1

#### §14.3.1 Exporting {#gp-14-3-1}

<a id="gp-14-3-1-p1"></a>Any of a work-package's work-items may *export* segments and a *segments-root* is placed in the work-report committing to these, ordered according to the work-item which is exporting. It is formed as the root of a constant-depth binary Merkle tree as defined in equation [E.4](../06-state-and-merklization/gray-paper.md#eq-E-4).

<a id="gp-14-3-1-p2"></a>Guarantors are required to erasure-code and distribute two data sets: one blob, the auditable *bundle* containing the encoded work-package, extrinsic data and self-justifying imported segments which is placed in the short-term Audit DA store; and a second set of exported-segments data together with the *Paged-Proofs* metadata. Items in the first store are short-lived; assurers are expected to keep them only until <abbr class="gp-term" title="the point after which a block can't be undone">finality</abbr> of the block in which the availability of the work-result's work-package is assured. Items in the second, meanwhile, are long-lived and expected to be kept for a minimum of 28 days (672 complete epochs) following the reporting of the work-report. This latter store is referred to as the *Distributed, Decentralized, Data Lake* or D$^3$L owing to its large size.

<a id="gp-14-3-1-p3"></a>We define the paged-proofs function $P$ which accepts a series of exported segments $\mathbf{s}$ and defines some series of additional segments placed into the D$^3$L via erasure-coding and distribution. The function evaluates to pages of hashes, together with subtree proofs, such that justifications of correctness based on a segments-root may be made from it:

<a id="gp-14-3-1-p4"></a><a id="eq-14-12"></a>

$$
\begin{equation}
\!\!P\colon\left\{ \begin{aligned}
\left[\!\left[\mathbb{J}\right]\!\right]_{} \to \,&\left[\!\left[\mathbb{J}\right]\!\right]_{} \\
\mathbf{s} \mapsto \,&\left[
\mathcal{P}_{l}\left(\mathcal{E}_{}\left(
\left\updownarrow\mathcal{J}_{6}\left(\mathbf{s}, i\right)\right.\!,
\left\updownarrow\mathcal{L}_{6}\left(\mathbf{s}, i\right)\right.\!
\right)\right)
\;\middle\vert\;
i \mathrel{\unicode{x2B40}} \mathbb{N}_{\left\lceil{}^{\left\vert\mathbf{s}\right\vert}\!/_{64}\right\rceil}
\right] \\
&  \text{where } l = \mathsf{W}_G
\end{aligned} \right.\!\!\!\! \tag{14.12}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-pagedproofs">$P$</span> | P | paged proofs: for every 64 exported segments, a page of their hashes and a proof, itself one segment |
| <span id="gk-zeropad">$\mathcal{P}_{x}\left(y\right)$</span> | P sub n of | zero-padding: the blob with zeros added until its length is a multiple of n |
| <span id="gk-merklejustsubpath">$\mathcal{J}_{x}\left(y\right)$</span> | J sub x of | a Merkle proof: the sibling hashes from a leaf, or a page of leaves, up to the root |
| <span id="gk-merklesubtreepage">$\mathcal{L}_{x}\left(y\right)$</span> | L sub x of | a page of leaves: the hashes of the 64 segments in page i |
| <span id="gk-orderedin">$\mathrel{\unicode{x2B40}}$</span> | in order, from | each item of the sequence, in its order |
| <span id="gk-Nmax">[$\mathbb{N}_{x}$](../symbols.md#naturals)</span> | N sub n | the whole numbers below n: ℕ_C is a core index, 0 to C − 1 |
| <span id="gk-nicefrac">${}^{x}\!/_{y}$</span> | over | a fraction: the top divided by the bottom |

</details>

:::

**Read it aloud** (14.12)**.** "P maps a sequence of segments to a sequence of segments:
s goes to the sequence, for each i in order below the ceiling of the length of s over 64,
of the zero-padding to l of the encoding of J six of s and i, with its length, and L six
of s and i, with its length; where l is W sub G."

**In plain words.** The guarantors erasure-code two things and send every validator a
shard of each: the bundle, kept only until the block that made the report available is
final, for the auditors; and the exported segments, kept at least 28 days (672 epochs), in
the D³L, for later packages. Beside the segments go paged proofs: for every 64 exported
segments, one more segment holding the hashes of those 64 (L₆, a page of leaves) and the
Merkle path from that page up to the segments root (J₆), zero-padded to 4,104 bytes. A
guarantor importing segment 70 fetches its page, page 1, and can check it, and its 63
neighbors, against the root with one path.

**On a real value.** Made up from the `work_report` vector's 69 exports:

```text
pages            ⌈69 / 64⌉ = 2
page 0           hashes of segments 0 to 63: 64 × 32 = 2,048 bytes
page 1           hashes of segments 64 to 68: 5 × 32 = 160 bytes
the tree         69 leaves padded to 128: depth 7
each path J₆     7 − 6 = 1 hash, the other half of the top of the tree
page 0 encoded   1 + 32 + 1 + 2,048 = 2,082 bytes, zero-padded to 4,104
page 1 encoded   1 + 32 + 1 + 160 = 194 bytes, zero-padded to 4,104
```

So the D³L gets 69 + 2 = 71 segments from this package.

**In your client.** Nowhere: block import never handles a segment.

### Computing the report: Ξ

::: gray-paper 14.4 1-5

#### §14.4 Computation of Work-Report {#gp-14-4}

<a id="gp-14-4-p1"></a>We now come to the work-report computation function $\Xi$. This forms the basis for all utilization of cores on JAM. It accepts some work-package $\mathbf{p}$, nominated core $c$, segment-root dictionary $\mathbf{l}$, and assurer set size $v$, and results in either an error $\nabla$ or the work-report. This function is deterministic and requires only that it be evaluated within eight epochs of a recently <abbr class="gp-term" title="voted final by GRANDPA: never undone">finalized</abbr> block thanks to the <abbr class="gp-term" title="reading a service's preimage as it was at a past slot">historical lookup</abbr> functionality. It can thus comfortably be evaluated by any node within the auditing period, even allowing for practicalities of imperfect synchronization. Formally:

<a id="gp-14-4-p2"></a><a id="eq-14-13"></a>

$$
\begin{equation}
\Xi \colon \left\{ \begin{aligned}
&\!\left\lgroup\mathbb{P}, \mathbb{N}_{\mathsf{C}}, \left\langle\!\left\vert \mathbb{H}_{}\to\mathbb{H}_{}\right\vert\!\right\rangle, \mathbb{V}\right\rgroup\! \to \mathbb{R} \cup \left\{\,\nabla\,\right\} \\
&\left(\mathbf{p}, c, \mathbf{l}, v\right) \mapsto \begin{cases}
\nabla &\text{if } E \\
\left(\begin{aligned}
&\mathbf{s}, \mathbf{c}\mathrel{\unicode{x2AF6}}\mathbf{p}_{\mathbf{c}}, c, \\
&a\mathrel{\unicode{x2AF6}}\mathbf{p}_{a}, \mathbf{t}, \mathbf{l}, \mathbf{d}, g
\end{aligned}\right) &\text{otherwise}
\end{cases}
\end{aligned} \right. \tag{14.13}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-computereport" class="gk-wrap">$\Xi$</span> | Xi | the work-report computation: from a package, a core, a lookup and a shard count, a report or an error |
| <span id="gk-error" class="gk-wrap">$\nabla$</span> | error | ∇: an error result |

</details>

<a id="gp-14-4-p3"></a>Where:

<a id="gp-14-4-p4"></a>

$$
\begin{align}
\left(\mathbf{t}, g\right) &= \Psi_I(\mathbf{p}, c) \notag \\
E &= \mathbf{t} \not\in \mathbb{B}_{:\mathsf{W}_R} \vee \mathcal{K}\left(\mathbf{l}\right) \ne \left\{\,h \;\middle\vert\; \mathbf{w} \in \mathbf{p}_{\mathbf{w}}, \left(h^\boxplus, n\right) \in \mathbf{w}_{\mathbf{i}}\,\right\} \notag \\
\left(\mathbf{d}, \overline{\mathbf{e}}\right) &= {}^\text{T} \left[
(C(\mathbf{p}_{\mathbf{w}}\left[j\right], r, u), \mathbf{e})
\;\middle\vert\;
\left(r, u, \mathbf{e}\right) = I(\mathbf{p}, j),\,
j \mathrel{\unicode{x2B40}} \mathbb{N}_{\left\vert\mathbf{p}_{\mathbf{w}}\right\vert}
\right] \notag \\
I(\mathbf{p}, j) &\equiv \begin{cases}
\left(\circleddash, u, \left[\mathbb{J}_0, \mathbb{J}_0, \dots\right]_{ \dots m_{e}}\right) &\text{if } \left\vert r\right\vert + z > \mathsf{W}_R\\
\left(\circledcirc, u, \left[\mathbb{J}_0, \mathbb{J}_0, \dots\right]_{ \dots m_{e}}\right) &\text{otherwise if } \left\vert\mathbf{e}\right\vert \ne m_{e} \\
\left(r, u, \left[\mathbb{J}_0, \mathbb{J}_0, \dots\right]_{ \dots m_{e}}\right) &\text{otherwise if } r \not\in \mathbb{B}_{} \\
\left(r, u, \mathbf{e}\right) &\text{otherwise} \\
\text{where } \left(r, \mathbf{e}, u\right) = \Psi_R(
c, j, \mathbf{p}, \mathbf{t}, S^\#_{\mathbf{l}}(\mathbf{p}_{\mathbf{w}}), \ell
)\\
\text{and } h = \mathcal{H}\left(\mathbf{p}\right)\,,\; m = \mathbf{p}_{\mathbf{w}}\left[j\right]\,,\; \ell = \sum_{k < j}\mathbf{p}_{\mathbf{w}}\left[k\right]_{e}\\
\text{and } z = \left\vert\mathbf{t}\right\vert + \sum_{k < j, \left(r \in \mathbb{B}_{}, \dots\right) = I(\mathbf{p}, k)} \left\vert r\right\vert
\end{cases} \notag
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-Psi">$\Psi$</span> | psi (capital) | the PVM: a program, a gas limit, registers and memory in; how it stopped and what's left out |
| <span id="gk-Cmaxreportvarsize" class="gk-wrap">$\mathsf{W}_R$</span> | W sub R | the most bytes a report's outputs may take, the trace and every result together: 48 × 1,024 = 49,152 |
| <span id="gk-vee">$\vee$</span> | or | at least one side is true |
| <span id="gk-keys">$\mathcal{K}\left(x\right)$</span> | K of | a dictionary's keys |
| <span id="gk-ne">$\ne$</span> | is not | not equal |
| <span id="gk-allexports" class="gk-wrap">$\overline{\mathbf{e}}$</span> | e bar | every segment the package's items exported, item after item |
| <span id="gk-transpose" class="gk-wrap">${}^\text{T}$</span> | transposed | rows become columns: a list of pairs becomes a pair of lists |
| <span id="gk-countupexports">$I$</span> | I | refines item j: its result, the gas it used and its exports, with an error swapped in where one is due |
| <span id="gk-interval">$_{x \dots y}$</span> | from x to y | the items from index x up to, not including, y |
| <span id="gk-local-theitem">$m$</span> | m | the item being refined: item j of the package |
| <span id="gk-importsegmentdata">$S$</span> | S | the segments an item imports, fetched and matched to their roots |
| <span id="gk-ell">$\ell$</span> | ell | a length defined nearby: in §14 the segments exported before an item; in Appendix A, the bytes after an opcode |

</details>

<a id="gp-14-4-p5"></a>Note that we gracefully handle both the case where the size of the work output would take the work-report beyond its acceptable size and where number of segments exported by a work-item's Refinement execution is incorrectly reported in the work-item's export segment count. In both cases, the work-package continues to be valid as a whole, but the work-item's exported segments are replaced by a sequence of zero-segments equal in size to the export segment count and its output is replaced by an error.

:::

**Read it aloud** (14.13)**.** "Xi maps a package, a core index, a dictionary from hash to
hash, and a validator count to a work-report or an error. p, c, l and v go to: the error,
when E; otherwise the report of s, c (which is p's c), c, a (which is p's a), t, l, d and
g. Where: t and g are Psi I of p and c. E is: t is not a blob of at most W sub R bytes, or
the keys of l are not the set of h such that some item of p imports a boxed h. d and e bar
are the transpose of: for each j in order below the number of items, the pair of C of
item j, r and u, and e bold, where r, u and e bold are I of p and j. I of p and j is:
oversize, u and e zero-segments, when the length of r plus z is over W sub R; otherwise
bad exports, u and e zero-segments, when the length of e bold isn't m's e; otherwise r, u
and e zero-segments, when r isn't a blob; otherwise r, u and e bold. Where r, e bold and u
are Psi R of c, j, p, t, the imports, and ell; h is H of p; m is item j; ell is the sum of
the export counts of the items before j; and z is the length of t plus the lengths of the
earlier items' successful outputs."

**In plain words.** This is the guarantors' recipe, the function that turns a package
into a report. In order:

1. **Authorize.** Run the authorizer, Ψ_I ([Part 13](../13-authorization/index.md)'s
   gatekeeper, in the PVM), on the package and core. Out come the trace 𝐭 and its gas g.
2. **Give up early** (E) if the authorizer said no, if its trace is over W_R = 49,152
   bytes, or if the lookup 𝐥 doesn't have exactly one entry per package the items import
   from by package hash. No report at all.
3. **Refine each item**, I(p, j): run its service's refine code, Ψ_R, with the imports and
   ℓ, the number of segments earlier items exported, so its exports are numbered on from
   theirs. Then check, in order:
   - output too big, with the trace and the earlier outputs (z), for W_R: ⊖, oversize;
   - exported a different number of segments than it said (e): ⊚, bad exports;
   - refine itself failed (out of gas, panic, BAD, BIG): that error.

   In each of those three cases its exports are replaced by e segments of zeros, so later
   items' numbering stays right. Otherwise, its output and its exports stand.
4. **Make the digests** with C (14.10), and collect every item's exports into ē. The ᵀ
   turns the list of (digest, exports) pairs into a pair of lists.
5. **Assemble the report**: the spec 𝐬 (14.17, below), the context copied, the core, the
   authorizer's name from (14.11), the trace, the lookup, the digests and the gas.

The note after says why a bad item doesn't sink the package: the others' results stand,
and the bad one carries an error instead of its output. The function is deterministic,
and it needs only state from the recent past (that's what the lookup anchor is for), so an
auditor can run it again, up to eight epochs later, and must get the very same report.

**On a real value.** Made up, on the `work_package` vector, with the results of the
`work_report` vector: the authorizer returns the trace `0x0102030405` with 0 gas; item 0
returns `0xaabbcc` and its 4 segments; item 1 panics.

```text
Ψ_I              𝐭 = 0x0102030405 (5 bytes), g = 0
E                5 ≤ 49,152; no boxed imports and 𝐥 empty: no error
item 0           ℓ = 0; z = 5; 3 + 5 = 8 ≤ 49,152; 4 exports, as promised
                 → digest 0xaabbcc, exports 4 segments
item 1           ℓ = 4; Ψ_R panics
                 → digest ☇, exports 7 zero-segments
ē                4 + 7 = 11 segments
the report       core c, a = 0x6fb4f1d7…, 𝐭, 𝐥 empty, 2 digests, g = 0
```

(The real `work_report` vector says 69 exports and another authorizer: the vectors were
made apart.)

**In your client.** Nowhere: Ψ_I and Ψ_R are the PVM invocations of
[Part 15](../15-the-pvm/index.md)'s machine, run by guarantors and auditors.

::: gray-paper 14.4 6-10

#### §14.4 Computation of Work-Report, continued

<a id="gp-14-4-p6"></a>The first term to be introduced, $\left(\mathbf{t}, g\right)$, is the authorization trace, the result of the <abbr class="gp-term" title="the authorizer's code, run in the PVM by the guarantors to decide if a package may use the core">Is-Authorized</abbr> function together with the amount of gas it used. The Is-Authorized logic must be executed first in order to ensure that the work-package warrants the needed core-time.

<a id="gp-14-4-p7"></a>The next term, $E$, is $\top$ if there is no valid report for the given arguments. This is the case if the Is-Authorized function fails, or if the segment-root dictionary $\mathbf{l}$ does not contain the expected entries. $\mathbf{l}$ is expected to have entries for all unique work-package hashes of imported segments not identified directly via a segment-root but rather through a work-package hash.

<a id="gp-14-4-p8"></a>In order to expect to be compensated for a work-report they are building, guarantors must compose a value for $\mathbf{l}$ to ensure not only the above but also a further constraint that all pairs of work-package hashes and segment-roots do properly correspond:

<a id="gp-14-4-p9"></a><a id="eq-14-14"></a>

$$
\begin{equation}
\begin{aligned}
&\forall \left(h \mapsto e\right) \in \mathbf{l} : \exists \mathbf{p}, c, \mathbf{d}, v \in \mathbb{P}, \mathbb{N}_{\mathsf{C}}, \left\langle\!\left\vert \mathbb{H}_{}\to\mathbb{H}_{}\right\vert\!\right\rangle, \mathbb{V} :\\
&\mathcal{H}\left(\mathbf{p}\right) = h \wedge (\Xi(\mathbf{p}, c, \mathbf{d}, v)_{\mathbf{s}})_{e} = e
\end{aligned} \tag{14.14}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-kv">$\left(x \mapsto y\right)$</span> | k maps to v | a dictionary entry: key k, value v |
| <span id="gk-exists">[$\exists$](../symbols.md#exists)</span> | there exists | there is at least one value such that what follows holds |

</details>

<a id="gp-14-4-p10"></a>As long as the guarantor is unable to satisfy the above constraints, then it should consider the work-package unable to be guaranteed. Auditors are not expected to populate $\mathbf{l}$ but rather to reuse the value in the work-report they are auditing.

:::

**Read it aloud** (14.14)**.** "For every pair h to e in l: there exist p, c, d and v in
the packages, the cores, the dictionaries and the validator counts, such that H of p is h,
and the segments root of the spec of Xi of p, c, d and v is e."

**In plain words.** Every entry of the lookup must be true: a package whose hash is h
really exists, and computing its report really gives segments root e. The paper doesn't
ask a guarantor to prove this on the spot; it says a guarantor who can't be sure should
not guarantee, since the chain later checks the lookup against the packages it has seen
reported ([12.5](../12-guarantees/05-bad-reports.md), (11.43)). An auditor never builds 𝐥:
it takes the report's own.

**On a real value.** Made up: a package importing segment 3 of package `0xab…` by its hash
puts one entry in 𝐥, `0xab…` ↦ `0xcd…`, and that is true only if `0xab…`'s own report says
`exports_root` `0xcd…`. The `work_report` vector's 𝐥 is empty: nothing to check.

**In your client.** The chain's side of it, (11.43), is in [12.5](../12-guarantees/05-bad-reports.md#the-code).

::: gray-paper 14.4 11-14

#### §14.4 Computation of Work-Report, continued

<a id="gp-14-4-p11"></a>The third term, $\left(\mathbf{d}, \overline{\mathbf{e}}\right)$ is the sequence of results for each of the work-items in the work-package together with all segments exported by each work-item. The fourth definition $I$ performs an ordered accumulation (i.e.  counter) in order to ensure that the Refine function has access to the total number of exports made from the work-package up to the current work-item.

<a id="gp-14-4-p12"></a>The above relies on two functions, $S_{\mathbf{l}}$ and $X$ which, respectively, define the import segment data (utilising the segment-root dictionary $\mathbf{l}$) and the extrinsic data for some work-item argument $\mathbf{w}$. We also define the segment-root lookup function $L_{\mathbf{l}}$, which collapses a segment-root or work-package hash into a segment-root, and $J_{\mathbf{l}}$, which compiles justifications of segment data:

<a id="gp-14-4-p13"></a><a id="eq-14-15"></a>

$$
\begin{equation}
\begin{aligned}
X(\mathbf{w} \in \mathbb{W}) &\equiv \left[\mathbf{d} \;\middle\vert\; (\mathcal{H}\left(\mathbf{d}\right), \left\vert\mathbf{d}\right\vert) \mathrel{\unicode{x2B40}} \mathbf{w}_{\mathbf{x}}\right] \\
\forall \mathbf{l} \in \left\langle\!\left\vert \mathbb{H}_{}\to\mathbb{H}_{}\right\vert\!\right\rangle &: \\
L_{\mathbf{l}}(r \in \mathbb{H}_{} \cup \mathbb{H}_{}^\boxplus) &\equiv \begin{cases}
r &\text{if } r \in \mathbb{H}_{} \\
\mathbf{l}\left[h\right] &\text{if } \exists h \in \mathbb{H}_{}: r = h^\boxplus
\end{cases} \\
S_{\mathbf{l}}(\mathbf{w} \in \mathbb{W}) &\equiv \left[\mathbf{b}\left[n\right] \;\middle\vert\; \mathcal{M}\left(\mathbf{b}\right) = L_{\mathbf{l}}(r), \left(r, n\right) \mathrel{\unicode{x2B40}} \mathbf{w}_{\mathbf{i}}\right] \\
J_{\mathbf{l}}(\mathbf{w} \in \mathbb{W}) &\equiv \left[\left\updownarrow\mathcal{J}_{0}\left(\mathbf{b}, n\right)\right.\! \;\middle\vert\; \mathcal{M}\left(\mathbf{b}\right) = L_{\mathbf{l}}(r), \left(r, n\right) \mathrel{\unicode{x2B40}} \mathbf{w}_{\mathbf{i}}\right]
\end{aligned} \tag{14.15}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-extrinsicdata">$X$</span> | X | an item's extrinsic blobs, found by their hashes and lengths |
| <span id="gk-segrootlookup">$L$</span> | L | turns an import's reference into a segments root: kept as it is, or looked up by package hash |
| <span id="gk-segsX" class="gk-wrap">$\mathbf{b}$</span> | b | all the segments under one segments root: the export list an import points into |
| <span id="gk-merklizecd">$\mathcal{M}\left(x\right)$</span> | M of | the constant-depth binary Merkle root of a list of segments |
| <span id="gk-justifysegmentdata">$J$</span> | J | for each imported segment, the proof that it is the one its root commits to |

</details>

<a id="gp-14-4-p14"></a>Note that while the formulations of $S_{\mathbf{l}}$ and $J_{\mathbf{l}}$ seem to require (due to the inner term $\mathbf{b}$) all segments exported by all work-packages exporting a segment to be imported, such a vast amount of data is not generally needed. In particular, each justification can be derived through a single paged-proof. This reduces the worst case data fetching for a guarantor to two segments for every one to be imported. In the case that contiguously exported segments are imported (which we might assume is a fairly common situation), then a single proof-page should be sufficient to justify many imported segments.

:::

**Read it aloud** (14.15)**.** "X of w is the sequence of d, for each pair of H of d and
the length of d in order in w's x. For every l, a dictionary from hash to hash: L sub l of
r is r, when r is a hash; and l at h, when r is boxed h. S sub l of w is the sequence of b
at n, where M of b is L sub l of r, for each pair r and n in order in w's i. J sub l of w
is the sequence of J zero of b and n, with its length, under the same conditions."

**In plain words.** Four helpers, each run on one item:

- **X**: the item's extrinsic blobs, the actual data behind each (hash, length) pair.
- **L**: one import reference to a segments root. A plain hash is a root already; a boxed
  package hash is looked up in 𝐥.
- **S**: the imported segments themselves: find the export list 𝐛 whose root is the
  reference's root, and take segment n.
- **J**: for each import, the Merkle path proving segment n is in that list.

The paper's note: S and J read as if a guarantor must fetch every segment of every list it
imports from. It needn't: one paged proof justifies a segment, so the worst case is two
fetches per import, and imports that sit together share a page.

**On a real value.** Item 0 of the `work_package` vector: X gives its 2 extrinsics, 16 and
17 bytes, whose hashes must be `0x381a0e35…` and `0x6c437d85…`; S gives 3 segments, 3 ×
4,104 = 12,312 bytes, one from each of the roots `0x461236a7…`, `0xe7cb5365…` and
`0xb0a487a4…`, at indices 0, 1 and 2; J gives 3 paths.

**In your client.** Nowhere: fetching and proving segments is the guarantors' work.

::: gray-paper 14.4 15-17

#### §14.4 Computation of Work-Report, continued

<a id="gp-14-4-p15"></a>Using these three functions, we may now define the *Bundle Assembly* function $B$, which assembles an audit-friendly bundle from a work-package and a segment-root dictionary. The bundle comprises the work-package itself, the extrinsic data, and the concatenated import segments along with their proofs of correctness.

<a id="gp-14-4-p16"></a><a id="eq-14-16"></a>

$$
\begin{equation}
B \colon \left\{ \begin{aligned}
&\!\left\lgroup\mathbb{P}, \left\langle\!\left\vert \mathbb{H}_{}\to\mathbb{H}_{}\right\vert\!\right\rangle\right\rgroup\! \to \mathbb{B}_{} \\
&\left(\mathbf{p}, \mathbf{l}\right) \mapsto \mathcal{E}_{}\left(
\mathbf{p},
X^\#(\mathbf{p}_{\mathbf{w}}),
S_{\mathbf{l}}^\#(\mathbf{p}_{\mathbf{w}}),
J_{\mathbf{l}}^\#(\mathbf{p}_{\mathbf{w}})
\right)
\end{aligned} \right. \tag{14.16}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-makebundle">$B$</span> | B | bundle assembly: the package, its extrinsics, its imports and their proofs, encoded as one blob |

</details>

<a id="gp-14-4-p17"></a>Note the lack of length prefixes: only the Merkle paths for the justifications have a length prefix. All other sequence lengths are determinable through the work package itself.

:::

**Read it aloud** (14.16)**.** "B maps a package and a dictionary from hash to hash to a
blob: p and l go to the encoding of p, X for each of p's items, S sub l for each of p's
items, and J sub l for each of p's items."

**In plain words.** The bundle: one blob holding everything an auditor needs to refine
the package again. The package, encoded; then every item's extrinsics; then every item's
imported segments; then every import's proof. Only the proofs carry their length: the
package already says how many extrinsics and imports there are and how long each is.

**On a real value.** For the `work_package` vector, the bundle would be:

```text
E(p)          695 bytes, the encoded package
X#            16 + 17 + 32 + 33 + 34 = 132 bytes
S#            5 × 4,104 = 20,520 bytes
J#            5 proofs, each a length and some 32-byte hashes
              695 + 132 + 20,520 = 21,347 bytes, plus the proofs
```

How long each proof is depends on the export trees it points into, which the vector
doesn't give. (Its report vector says length 42: made apart, again.)

**In your client.** Nowhere: your client only reads the bundle's length, `length` in the
report's spec.

::: gray-paper 14.4 18-22

#### §14.4 Computation of Work-Report, continued

<a id="gp-14-4-p18"></a>Finally, we may define $\mathbf{s}$ as the data availability specification of the package using $B$ together with the yet to be defined *Availability Specifier* function $A$ (see section [14.4.1](#gp-14-4-1-p1)):

<a id="gp-14-4-p19"></a><a id="eq-14-17"></a>

$$
\begin{equation}
\mathbf{s} = A(
\mathcal{H}\left(\mathbf{p}\right),
B(\mathbf{p}, \mathbf{l}),
\overparen{\overline{\mathbf{e}}},
v
) \tag{14.17}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-newavailabilityspecifier">$A$</span> | A | the availability specifier: from a package hash, bundle, exports and shard count, the report's spec |
| <span id="gk-concatall">$\overparen{x}$</span> | all joined | every sequence in it, joined end to end into one |

</details>

<a id="gp-14-4-p20"></a>Before executing the Refine function, the guarantor should ensure that all segment-tree roots which form imported segment commitments are known and have not expired. Additionally, the guarantor should ensure that they can fetch all preimage data referenced as the commitments of extrinsic segments.

<a id="gp-14-4-p21"></a>The guarantor must reconstruct imported segments, though this process may in fact be lazy as the Refine function makes no usage of the data until the *fetch* host-call is made. Fetching generally implies that, for each imported segment, erasure-coded chunks are retrieved from enough unique validators (approximately one third) and is described in more depth in appendix [H](../cryptography.md#gp-H-p1). (Since we specify systematic erasure-coding, its reconstruction is trivial in the case that the correct validators are responsive.) Chunks must be fetched for both the data itself and for justification metadata which allows us to ensure that the data is correct.

<a id="gp-14-4-p22"></a>Validators, in their role as availability assurers, should index such chunks according to the index of the segments-tree whose reconstruction they facilitate. Since the data for segment chunks is so small (12 <abbr class="gp-term" title="bytes: 8 bits each">octets</abbr> in the case of 1023 assurers), fixed communications costs should be kept to a bare minimum. A good network protocol (out of scope at present) will allow guarantors to specify only the segments-tree root and index together with a Boolean to indicate whether the proof chunk need be supplied. Since we assume enough other validators are online and benevolent, we can assume that the guarantor can compute $S_{\mathbf{l}}$ and $J_{\mathbf{l}}$ above with confidence, based on the general availability of data committed to with $\mathbf{s}^\clubsuit$, which is specified below. Note that each imported segment must be fetched from the validator set which assured its availability; this set may no longer be active and its size may differ from that of the active validator set.

:::

**Read it aloud** (14.17)**.** "s is A of: H of p, B of p and l, all of e bar joined, and
v."

**In plain words.** The report's spec, its 𝐬, is made by the availability specifier A,
from the package's hash, its bundle, every segment it exported, and how many validators
will hold shards. The paragraphs after are a guarantor's practical duties: before
refining, check every import's root is known and unexpired and every extrinsic can be
fetched; rebuild imports from about a third of the validators' shards, lazily, when refine
first asks for them; and, as an assurer, index segment shards by their export tree, each
just 12 bytes on full. An import must be fetched from the validators who assured it, who
may no longer be the current set.

**On a real value.** For the made-up run above:

```text
p's hash     H(E(p)), the package's 695 bytes hashed
B(p, 𝐥)      the bundle, about 21 KB plus proofs
ē            the 11 segments, 4 real and 7 of zeros
v            6 on tiny, 1,023 on full
𝐬            A(…): its six fields are the next section
```

**In your client.** Nowhere: your client reads 𝐬 ([3.3](./03-a-work-report.md#the-code)).

### The availability specifier: A

::: gray-paper 14.4.1 1-7

#### §14.4.1 Availability Specifier {#gp-14-4-1}

<a id="gp-14-4-1-p1"></a>We define the availability specifier function $A$, which creates an availability specifier from the package hash, an octet sequence of the audit-friendly <abbr class="gp-term" title="a package with everything needed to redo its work, as auditors fetch it">work-package bundle</abbr>, the sequence of exported segments, and the size of the assuring validator set:

<a id="gp-14-4-1-p2"></a><a id="eq-14-18"></a>

$$
\begin{equation}
\!\!\!
A\colon\left\{ \,\begin{aligned}
\!\left\lgroup\mathbb{H}_{}, \mathbb{B}_{}, \left[\!\left[\mathbb{J}\right]\!\right]_{}, \mathbb{V}\right\rgroup\! &\to \mathbb{Y}\\
\left(p, \mathbf{b},\,\mathbf{s}, v\right) &\mapsto \left(
p,\,
l\mathrel{\unicode{x2AF6}}\left\vert\mathbf{b}\right\vert,\,
u,\,
v,\,
e\mathrel{\unicode{x2AF6}}\mathcal{M}\left(\mathbf{s}\right),\,
n\mathrel{\unicode{x2AF6}}\left\vert\mathbf{s}\right\vert
\right)
\end{aligned} \right.\!\!\!\!\! \tag{14.18}
\end{equation}
$$

<a id="gp-14-4-1-p3"></a>

$$
\begin{align}
\text{where } u &= \mathcal{M}_B\left(
\left[\overparen{\mathbf{x}} \;\middle\vert\; \mathbf{x} \mathrel{\unicode{x2B40}} {}^\text{T} \left[\mathbf{b}^\clubsuit, \mathbf{s}^\clubsuit\right]\right]
\right) \notag \\
\text{and } \mathbf{b}^\clubsuit &= \mathcal{H}^\#\left(\mathcal{C}^{v}_{\left\lceil{}^{\left\vert\mathbf{b}\right\vert}\!/_{z}\right\rceil}\left(\mathcal{P}_{z}\left(\mathbf{b}\right)\right)\right) \notag \\
\text{and } \mathbf{s}^\clubsuit &= \mathcal{M}_B^\#\left({}^\text{T}\mathcal{C}^{v\#}_{{}^{\mathsf{W}_G}\!/_{z}}\left(\mathbf{s} \frown P(\mathbf{s})\right)\right) \notag \\
\text{and } z &= 2 \cdot \mathcal{D}(v) \notag
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-merklizewb">$\mathcal{M}_B\left(x\right)$</span> | M sub B of | the well-balanced Merkle root of a list: one hash for all its items |
| <span id="gk-clubsuit">$\clubsuit$</span> | club | x♣: one hash (or root) for each validator's shard of x |
| <span id="gk-blakemany">$\mathcal{H}^\#\left(x\right)$</span> | H hash of | hash each item: ℋ#([a, b]) is [ℋ(a), ℋ(b)], a sequence of 32-byte hashes |
| <span id="gk-erasurecode">$\mathcal{C}^{x}_{y}\left(z\right)$</span> | C, v shards, k pieces, of | erasure-code: cut data of k pieces into v shards, any D(v) of which rebuild it |
| <span id="gk-merklizewbmany">$\mathcal{M}_B^\#\left(x\right)$</span> | M sub B, for each | the simple binary Merkle root of each list in a sequence |
| <span id="gk-erasurecodemany">$\mathcal{C}^{x\#}_{y}\left(z\right)$</span> | C for each, v shards, k pieces, of | erasure-code each item of a sequence the same way |
| <span id="gk-fnecoriginalshards" class="gk-wrap">$\mathcal{D}$</span> | D | how many shards rebuild the data: 342 of 1,023 on full, 3 of 6 on tiny |

</details>

<a id="gp-14-4-1-p4"></a>The paged-proofs function $P$, defined earlier in equation [14.12](#eq-14-12), accepts a sequence of segments and returns a sequence of paged-proofs sufficient to justify the correctness of every segment. There are exactly $\left\lceil{}^{1}\!/_{64}\right\rceil$ paged-proof segments as the number of yielded segments, each composed of a page of 64 hashes of segments, together with a Merkle proof from the root to the subtree-root which includes those 64 segments.

<a id="gp-14-4-1-p5"></a>The functions $\mathcal{M}$ and $\mathcal{M}_B$ are the fixed-depth and simple binary Merkle root functions, defined in equations [E.4](../06-state-and-merklization/gray-paper.md#eq-E-4) and [E.3](../06-state-and-merklization/gray-paper.md#eq-E-3). The functions $\mathcal{C}^{}_{}$ and $\mathcal{D}$ are the erasure-coding and original-chunk-count functions, defined in appendix [H](../cryptography.md#gp-H-p1).

<a id="gp-14-4-1-p6"></a>And $\mathcal{P}_{}$ is the zero-padding function to take an octet array to some multiple of $n$ in length:

<a id="gp-14-4-1-p7"></a><a id="eq-14-19"></a>

$$
\begin{equation}
\mathcal{P}_{n \in \mathbb{N}_{1 \dots }}\colon\left\{ \begin{aligned}
\mathbb{B}_{} &\to \mathbb{B}_{k \cdot n}\\
\mathbf{x} &\mapsto \mathbf{x} \frown \left[0, 0, \dots\right]_{((\left\vert x\right\vert + n - 1) \bmod n) + 1 \dots n}
\end{aligned} \right. \tag{14.19}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-fnzeropad">$\mathcal{P}_{x}$</span> | P | the zero-padding function |
| <span id="gk-Nclamp">$\mathbb{N}_{x \dots y}$</span> | N from x to y | the whole numbers from x up to, not including, y |
| <span id="gk-bmod">[$\bmod$](../symbols.md#mod)</span> | mod | the remainder after dividing: 14 mod 4 is 2 |

</details>

:::

**Read it aloud** (14.18)**.** "A maps a hash, a blob, a sequence of segments and a
validator count to an availability specification: p, b, s and v go to: p; l, which is
the length of b; u; v; e, which is M of s; and n, which is the length of s. Where u is
M sub B of the sequence of x joined, for each x in order in the transpose of b club and s
club; b club is H for each of C of v shards and the ceiling of the length of b over z
pieces of P sub z of b; s club is M sub B for each of the transpose of C for each of v
shards and W sub G over z pieces of s followed by P of s; and z is 2 times D of v."

**In plain words.** Six fields, four of them easy: p is handed in, l is the bundle's length,
e is the constant-depth Merkle root of the exported segments, n is how many. The work is
u, the erasure root, in four steps:

1. **z = 2 × D(v)** bytes is one piece: D(v) is how many shards rebuild the data, 342 on
   full and 3 on tiny, so z is 684 or 6.
2. **The bundle's shards, b♣.** Pad the bundle with zeros to a multiple of z (𝒫_z, (14.19)),
   cut it into ⌈|b|/z⌉ pieces, erasure-code into v shards, one per validator, and hash
   each: v hashes.
3. **The segments' shards, s♣.** Erasure-code every exported segment and every paged-proof
   page the same way, each into v shards; give each validator its shard of every one, in
   order, and take the Merkle root of that list: v roots.
4. **u.** For each validator, join its bundle-shard hash and its segments root, 64 bytes,
   and take the well-balanced Merkle root of all v of those.

So one 32-byte root vouches for every validator's every shard, which is how each
assurer checks its own ([Part 11](../11-assurances/index.md)). The notes after define
the pieces: 𝒫 pads, ℳ and ℳ_B are the two Merkle roots of Appendix E, 𝒞 and 𝒟 the erasure
code of Appendix H. Then (14.19), the zero-padding: add zeros until the length is a
multiple of n. ((|x| + n − 1) mod n) + 1 is the length of the last, partial chunk, from 1
to n, so the zeros fill the gap from there to n.

**On a real value.** The `work_report` vector's spec says length 42 and 69 exports. On
tiny (v = 6) and full (v = 1,023):

```text
                      tiny                     full
D(v)                  3                        342
z = 2 × D(v)          6                        684
𝒫_z(b): zeros added   42 is 7 × 6: none        684 − 42 = 642 zeros
pieces ⌈|b| / z⌉      7                        1
each bundle shard     7 × 2 = 14 bytes         1 × 2 = 2 bytes
a segment's pieces    4,104 / 6 = 684          4,104 / 684 = 6
each segment shard    684 × 2 = 1,368 bytes    6 × 2 = 12 bytes
segments coded        69 + 2 pages = 71        71
u's leaves            6, each 32 + 32 bytes    1,023, each 32 + 32 bytes
```

The erasure vectors confirm the sizes: `vectors/erasure/tiny/ec-4104` codes one segment,
4,104 bytes, into 6 shards of 1,368 bytes, and `full/ec-4104` into 1,023 shards of 12.
Shards 0, 1 and 2 of the tiny one, joined, are the segment itself (it starts
`0x41598a5f…`, and so does shard 0): the code is systematic, so the first D(v) shards are
the data, and rebuilding from them is just joining them.

And (14.19) on 42 bytes, n = 684: ((42 + 683) mod 684) + 1 = 41 + 1 = 42, so 684 − 42
= 642 zeros: 684 bytes. On 684 bytes: ((684 + 683) mod 684) + 1 = 684, no zeros.

**In your client.** Nowhere: the erasure root is checked by the assurers, off the chain,
against their shards. Your client carries u and v, and checks that v is the number of
validators ([12.4](../12-guarantees/04-bad-guarantees.md)). [Lesson
3.3](./03-a-work-report.md#the-big-picture) draws the idea.

::: gray-paper 14.4.1 8-10

#### §14.4.1 Availability Specifier, continued

<a id="gp-14-4-1-p8"></a>Validators are incentivized to distribute each newly erasure-coded data chunk to the relevant validator, since they are not paid for guaranteeing unless a work-report is considered to be *available* by a <abbr class="gp-term" title="more than two thirds of the validators">super-majority</abbr> of validators. Given our work-package $\mathbf{p}$, we should therefore send the corresponding work-package bundle chunk and exported segments chunks to each validator, together with proofs such that each validator can justify completeness according to the work-report's *erasure-root*. In the case of a coming epoch change, they may also maximize expected reward by distributing to the new validator set. Note that as erasure-coding depends on the size of the assuring validator set, distribution to two validator sets of different sizes necessitates performing erasure-coding twice and production of two distinct work-reports, only one of which may be reported on-chain.

<a id="gp-14-4-1-p9"></a>We will see this function utilized in the next sections, for guaranteeing, auditing and judging.

<a id="gp-14-4-1-p10"></a>

:::

The last words of §14 are about money: guarantors are paid only for a report that
becomes available, so they gain by sending every validator its shards. Near an epoch's
end they may send to the next validator set too, but a different number of validators
means a different erasure coding and a different report, and only one of the two can go on
the chain.

## Say it in one breath

A package is a token, an authorizer (code host, code hash, configuration: its name is
H(code hash ⌢ configuration)), a context naming two recent blocks, and 1 to 16 items, each
a service, a payload, two gas limits and a manifest of imports, extrinsics and an export
count (14.2, 14.3, 11.4, 14.11). The guarantors run Ξ: the authorizer first, then each
item's refine, turning each into a digest of ten fields whose result is bytes or one of six
errors (14.13, 14.10, 11.6, 11.7), and wrap them in a report with the trace, the lookup
and a spec (11.2). The spec's erasure root commits to every validator's shard of the
bundle and the exports, so each validator can check its own (14.18, 11.5). The chain sees
only the report.
