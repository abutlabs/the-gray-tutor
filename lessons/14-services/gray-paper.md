# The formulas, explained

[Part 14](./index.md)'s appendix: every formula of §9, *Service Accounts*, and of §12.4,
*Preimage Integration*, explained. Nine: what an account is made of (9.1) to (9.3), where
its code is (9.4), how refine looks a preimage up at a past slot (9.5) to (9.7), what its
storage costs (9.8), and how a block hands preimages over (12.34) to (12.37). Each formula:
its key, then read aloud, what it means, on a real value, in your client. Notation:
[Reading the Gray Paper](../reading-the-gray-paper.md).

## (9.1) and (9.2): a service id, and the accounts

::: gray-paper-eq 9.1

<a id="ex-9-1"></a>The Gray Paper's (9.1), (9.2), [in its place in the paper's words](./02-the-service-account.md#eq-9-1):

$$
\begin{align}
\mathbb{N}_S &\equiv \mathbb{N}_{2^{32}} \tag{9.1} \\
\delta &\in \left\langle\!\left\vert \mathbb{N}_S\to\mathbb{A}\right\vert\!\right\rangle \tag{9.2}
\end{align}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-serviceid" class="gk-wrap">$\mathbb{N}_S$</span> | N sub S | a service id: a whole number below 2³², 4 bytes |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-Nbits">[$\mathbb{N}_{2^{x}}$](../symbols.md#naturals)</span> | N sub two to the n | the numbers that fit in n bits: ℕ_{2³²} is a u32 |
| <span id="gk-accounts" class="gk-wrap">$\delta$</span> | delta | the service accounts: every service's code hash, balance, storage and preimages |
| <span id="gk-in">[$\in$](../symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-dictionary">$\left\langle\!\left\vert x\to y\right\vert\!\right\rangle$</span> | a dictionary from K to V | a map: keys of type K, each with one value of type V |
| <span id="gk-serviceaccount" class="gk-wrap">$\mathbb{A}$</span> | A | a service account: three dictionaries (storage, preimages, requests) and eight plain fields |

</details>

:::

**Read it aloud.** "N sub S is defined as the 32-bit naturals. Delta is in: a dictionary
from N sub S to A."

**What it means.** Two type lines. A service's id is a whole number that fits in 4
bytes, 0 to 4,294,967,295. δ, the service accounts, is a dictionary from those ids to
accounts: look a service up by its id, get its account, or nothing if there is no such
service. The paper calls it a partial mapping: most ids have no service.

**On a real value.** The tiny accumulate vector `assign_from_non_assigner-2`, before its
block:

```text
δ keys        0, 1, 1729                   three services
δ[1]          an account: code hash dd0e…, balance 227714, …
δ[7]          no entry: there is no service 7
```

**In your client.** `readService(entries, s)` in `src/services.ts`, [14.2's
code](./02-the-service-account.md#the-code), looks δ[s] up in the state, under C(255, s).

## (9.3): what an account holds

::: gray-paper-eq 9.3

<a id="ex-9-3"></a>The Gray Paper's (9.3), [in its place in the paper's words](./02-the-service-account.md#eq-9-3):

$$
\begin{align}
\mathbb{A} \equiv \!\left\lgroup\ \begin{aligned}
\mathbf{s} &\in \left\langle\!\left\vert \mathbb{B}_{}\to\mathbb{B}_{}\right\vert\!\right\rangle\,,\
\mathbf{p} \in \left\langle\!\left\vert \mathbb{H}_{}\to\mathbb{B}_{}\right\vert\!\right\rangle\,,\\
\mathbf{l} &\in \left\langle\!\left\vert \!\left\lgroup\mathbb{H}_{},\mathbb{N}_L\right\rgroup\!\to\left[\!\left[\mathbb{N}_T\right]\!\right]_{:3}\right\vert\!\right\rangle\,,\\
f &\in \mathbb{N}_B\,,\
c \in \mathbb{H}_{}\,,\
b \in \mathbb{N}_B\,,\
g \in \mathbb{N}_G\,,\\
m &\in \mathbb{N}_G\,,\
r \in \mathbb{N}_T\,,\
a \in \mathbb{N}_T\,,\
p \in \mathbb{N}_S\\
\end{aligned}\,\right\rgroup\! \tag{9.3}
\end{align}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-tuple">$\!\left\lgroup x\right\rgroup\!$</span> | the tuple of | a record: named fields, each with its type, like an object in JSON |
| <span id="gk-sa-storage" class="gk-wrap">$\mathbf{s}$</span> | s | an account's storage: keys to values, both any bytes, written by its own accumulate code |
| <span id="gk-blob">[$\mathbb{B}$](../symbols.md#blobs)</span> | B, or B sub n | bytes: any run of them; 𝔹ₙ exactly n of them |
| <span id="gk-sa-preimages" class="gk-wrap">$\mathbf{p}$</span> | p | an account's preimages: each a blob filed under its own 32-byte hash |
| <span id="gk-hash">$\mathbb{H}$</span> | H | a 32-byte value, usually a hash |
| <span id="gk-sa-requests" class="gk-wrap">$\mathbf{l}$</span> | l | an account's requests: for each (hash, length) asked for, a history of up to 3 slots |
| <span id="gk-bloblength" class="gk-wrap">$\mathbb{N}_L$</span> | N sub L | a length of bytes: a u32 (below 2³²) |
| <span id="gk-sequence">[$\left[\!\left[x\right]\!\right]$](../symbols.md#sequence)</span> | a sequence of | ⟦T⟧ is an array of T; a subscript is its length, :n at most n, n: at least n |
| <span id="gk-timeslot" class="gk-wrap">$\mathbb{N}_T$</span> | N sub T | a timeslot: a u32 counting 6-second slots |
| <span id="gk-sa-gratis">$f$</span> | f | an account's gratis offset: deposit it is let off, taken from its minimum balance |
| <span id="gk-balance" class="gk-wrap">$\mathbb{N}_B$</span> | N sub B | a balance: a u64 |
| <span id="gk-sa-codehash">$c$</span> | c | an account's code hash: names the preimage holding its code |
| <span id="gk-sa-balance">$b$</span> | b | an account's balance, in tokens: a u64 |
| <span id="gk-sa-minaccgas">$g$</span> | g | the least gas each work-item for this service must bring to accumulate |
| <span id="gk-gas" class="gk-wrap">$\mathbb{N}_G$</span> | N sub G | an amount of gas: a u64 |
| <span id="gk-sa-minmemogas">$m$</span> | m | the least gas each transfer to this service must bring |
| <span id="gk-sa-created">$r$</span> | r | the slot the service was created at |
| <span id="gk-sa-lastacc">$a$</span> | a | the slot the service last accumulated at |
| <span id="gk-sa-parent">$p$</span> | p | the parent: the id of the service that created this one |

</details>

:::

**Read it aloud.** "A is defined as the tuple of: s, in a dictionary from blobs to blobs;
p, in a dictionary from hashes to blobs; l, in a dictionary from a hash and a length to a
sequence of at most 3 timeslots; f, in N sub B; c, in H; b, in N sub B; g, in N sub G; m,
in N sub G; r, in N sub T; a, in N sub T; p, in N sub S."

**What it means.** An account is a record, the way an app's row is: three bags of entries
and eight plain fields.

1. **Three bags.** Storage 𝐬, whatever keys and values the service writes. Preimages 𝐩,
   blobs filed under their hashes. Requests 𝐥, what it has asked for, by hash and length,
   each with a history of up to three slots.
2. **Money.** b, the balance, and f, the gratis offset, how much deposit it is let off.
3. **Code and gas.** c, the hash that names its code, and g and m, the least gas a
   work-item and a transfer must bring.
4. **Its life.** r, the slot it was created; a, the slot it last accumulated; p, the
   service that created it.

A balance is a u64, gas a u64, a slot a u32, an id a u32.

**On a real value.** Service 1 in `assign_from_non_assigner-2`:

```text
s    3 entries: 00 → 01000000; 0100000000 → 7749… (34 bytes); a 35-byte key → 010109
p    dd0e… → 127,513 bytes                                       1 entry
l    (dd0e…, 127513) → [0]                                       provided at slot 0
f    0
c    dd0e…                                                       the one preimage it has
b    227714
g    10                                                          min_item_gas
m    10                                                          min_memo_gas
r    0                                                           created at genesis
a    43                                                          last accumulated, slot 43
p    0                                                           made by service 0
```

**In your client.** `ServiceInfo` in `src/services.ts`, [14.2's
code](./02-the-service-account.md#the-code), is the eight plain fields with the two counts
of (9.8), under the vectors' names. The three bags are separate state entries, under
[lesson 6.2](../06-state-and-merklization/02-state-keys.md)'s keys.

## (9.4): where the code is

::: gray-paper-eq 9.4

<a id="ex-9-4"></a>The Gray Paper's (9.4), [in its place in the paper's words](./02-the-service-account.md#eq-9-4):

$$
\begin{align}
\forall \mathbf{a} \in \mathbb{A} : \left(\mathbf{a}_{\mathbf{m}}, \mathbf{a}_{\mathbf{c}}\right) \equiv \begin{cases}
\left(\mathbf{m}, \mathbf{c}\right) &\text{if } \mathcal{E}_{}\left(\left\updownarrow\mathbf{m}\right.\!, \mathbf{c}\right) = \mathbf{a}_{\mathbf{p}}[\mathbf{a}_{c}] \\
\left(\emptyset, \emptyset\right) &\text{otherwise}
\end{cases} \tag{9.4}
\end{align}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-forall">$\forall$</span> | for all | for every value: ∀c ∈ ℕ_C means for each core c |
| <span id="gk-sa-metadata" class="gk-wrap">$\mathbf{m}$</span> | m (bold) | an account's metadata: a blob for people (a name, a version), before the code in its preimage |
| <span id="gk-sa-code" class="gk-wrap">$\mathbf{c}$</span> | c (bold) | an account's code: the PVM program, the second half of its code-hash preimage; ∅ if there is none |
| <span id="gk-encode">[$\mathcal{E}\left(x\right)$](../symbols.md#encode)</span> | E of | the encoding of what's in the brackets: its bytes, by Appendix C's rules |
| <span id="gk-var">[$\left\updownarrow x\right.\!$](../symbols.md#length-prefix)</span> | with its length | ↕x: x with its length in front, as a compact natural |
| <span id="gk-none" class="gk-wrap">$\emptyset$</span> | nothing | ∅: no value at all, like null |

</details>

:::

**Read it aloud.** "For every account a: the pair a sub m, a sub c is defined as m, c, if
the encoding of m with its length, then c, is a's preimage at a's code hash; otherwise,
nothing and nothing."

**What it means.** The record holds only a hash, c. To find the code, look c up in the
account's own preimages. The bytes there are two blobs in a row. First the metadata 𝐦, a
name and a version for people, with its length in front. Then the code 𝐜, the PVM
program. If the preimage is missing, or its bytes don't split that way, the service has
no code (∅): it exists, holds a balance, and can't run.

**On a real value.** Service 1's preimage at `dd0e…`, 127,513 bytes:

```text
50                                 ↕m: a compact length, 0x50 = 80
00 15 6a 61 6d 2d 62 6f 6f …       𝐦: 80 bytes, "jam-bootstrap-service", "0.1.29", "Apache-2.0", …
…                                  𝐜: the other 127,513 − 1 − 80 = 127,432 bytes
```

**In your client.** `serviceCode` in `src/services.ts`, [14.2's
code](./02-the-service-account.md#the-code), finds the preimage; [lesson
15.1](../15-the-pvm/01-the-program-blob.md) splits it into 𝐦 and 𝐜.

## (9.5): the historical lookup, its type

::: gray-paper-eq 9.5

<a id="ex-9-5"></a>The Gray Paper's (9.5), [in its place in the paper's words](./01-providing-preimages.md#eq-9-5):

$$
\begin{equation}
\begin{aligned}
\Lambda\colon \left\{ \ \begin{aligned}
\!\left\lgroup\mathbb{A}, \mathbb{N}_{(\mathbf{H}_{T} - \mathsf{D}) \dots \mathbf{H}_{T}}, \mathbb{H}_{}\right\rgroup\! &\to \mathbb{B}_{}\boldsymbol{?} \\
(\mathbf{a}, t, \mathcal{H}\left(\mathbf{p}\right)) &\mapsto v : v \in \left\{\, \mathbf{p}, \emptyset \,\right\}
\end{aligned} \right.
\end{aligned} \tag{9.5}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-histlookup" class="gk-wrap">$\Lambda$</span> | lambda (capital) | the historical lookup: the preimage with hash h if the account had it at slot t, else ∅ |
| <span id="gk-abracegroup">$\left\{ \begin{aligned}x\end{aligned} \right.$</span> | as follows | a brace grouping lines that hold together: for a function, its type on top, then what each input becomes |
| <span id="gk-Nmax">[$\mathbb{N}_{x}$](../symbols.md#naturals)</span> | N sub n | the whole numbers below n: ℕ_C is a core index, 0 to C − 1 |
| <span id="gk-H" class="gk-wrap">$\mathbf{H}$</span> | H | this block's header; 𝐇_T is its timeslot, 𝐇_P its parent's hash |
| <span id="gk--timeslot">$T$</span> | T | a header's timeslot: 𝐇_T is the slot this block was made for |
| <span id="gk-Cexpungeperiod" class="gk-wrap">$\mathsf{D}$</span> | D | the expunge period: slots a forgotten preimage is kept before it may go, 19,200 on full, 32 on tiny |
| <span id="gk-to">[$\to$](../symbols.md#to)</span> | to | what goes in, to what comes out: A → B takes an A and gives a B |
| <span id="gk-optional">$x\boldsymbol{?}$</span> | or nothing | a value of this type, or ∅ (null) |
| <span id="gk-blake">$\mathcal{H}\left(x\right)$</span> | H of | the Blake2b hash of what's in the brackets: 32 bytes |
| <span id="gk-mapsto">$\mapsto$</span> | maps to | what a function gives back for an input: x ↦ y says x becomes y |
| <span id="gk-set">$\left\{\,x\,\right\}$</span> | the set of | a set: values with no order and no repeats |

</details>

:::

**Read it aloud.** "Lambda is a function from: an account, a slot from H T minus D up to
H T, and a hash; to a blob or nothing. Given a, t and the hash of p, it gives v, where v is
either p or nothing."

**What it means.** Before saying how, the paper says what Λ promises. Ask it about a
service, a recent slot and a hash, and it answers with the very bytes whose hash that is,
or with nothing. It never answers with other bytes. The slot must be within the last D
slots, 32 on tiny and 19,200 on full, about 32 hours: the window in which a forgotten
preimage is still kept, so the answer can still be worked out.

**On a real value.** On tiny, in a block at slot 43, Λ may be asked about slots 11 to 43:
43 − 32 = 11.

**In your client.** Not built: only refine's `historical_lookup` host call asks Λ, and
your client never runs refine. [14.1](./01-providing-preimages.md#what-the-history-is-for)
says why the history is kept for it.

## (9.6): a preimage matches its hash, and was asked for

::: gray-paper-eq 9.6

<a id="ex-9-6"></a>The Gray Paper's (9.6), [in its place in the paper's words](./01-providing-preimages.md#eq-9-6):

$$
\begin{equation}
\forall \mathbf{a} \in \mathbb{A}, \left(h \mapsto \mathbf{d}\right) \in \mathbf{a}_{\mathbf{p}} \Rightarrow
h = \mathcal{H}\left(\mathbf{d}\right)\wedge
\left(h , \left\vert\mathbf{d}\right\vert\right) \in \mathcal{K}\left(\mathbf{a}_{\mathbf{l}}\right) \tag{9.6}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-kv">$\left(x \mapsto y\right)$</span> | k maps to v | a dictionary entry: key k, value v |
| <span id="gk-Rightarrow">$\Rightarrow$</span> | implies | if the left holds, the right must hold too |
| <span id="gk-wedge">$\wedge$</span> | and | both sides are true |
| <span id="gk-len">$\left\vert x\right\vert$</span> | the size of | \|x\|: how many items x has, or how many bytes |
| <span id="gk-keys">$\mathcal{K}\left(x\right)$</span> | K of | a dictionary's keys |

</details>

:::

**Read it aloud.** "For every account a, and every entry h maps to d in a's preimages,
implies: h equals the hash of d, and the pair h, the size of d, is among the keys of a's
requests."

**What it means.** Two rules that always hold, for every stored preimage. Its key is its
own hash, so nobody can file other bytes under it. And it has a request for that hash and
its exact length, so no preimage sits in an account that never asked for it. A client
that keeps the second rule can find a preimage's history from the preimage alone.

**On a real value.** Service 3 in the preimages vector `preimage_needed-2`, after the
block:

```text
p entry        9e0e… → 46 bytes
H(the 46)      9e0e…                       = the key: the first rule holds
(9e0e…, 46)    a key of l, history [43]    the second rule holds
p entry        b9de… → 48 bytes
H(the 48)      b9de…                       the first rule holds
(b9de…, 48)    a key of l, history [37, 40]    the second rule holds
```

**In your client.** `providePreimages` in `src/services.ts`, [14.1's
code](./01-providing-preimages.md#the-code), keeps both: it files the data under
`preimageKey(s, data)`, built from the data's own hash, and only where a request for its
hash and length exists.

## (9.7): the historical lookup, worked out

::: gray-paper-eq 9.7

<a id="ex-9-7"></a>The Gray Paper's (9.7), [in its place in the paper's words](./01-providing-preimages.md#eq-9-7):

$$
\begin{equation}
\begin{aligned}
&\Lambda\colon \!\left\lgroup\mathbb{A}, \mathbb{N}_T, \mathbb{H}_{}\right\rgroup\! \to \mathbb{B}_{}\boldsymbol{?} \\
&\Lambda(\mathbf{a}, t, h) \equiv \begin{cases}
\mathbf{a}_{\mathbf{p}}\left[h\right]\!\!\!\! &\text{if } h \in \mathcal{K}\left(\mathbf{a}_{\mathbf{p}}\right) \wedge I(\mathbf{a}_{\mathbf{l}}\left[h, \left\vert\mathbf{a}_{\mathbf{p}}\left[h\right]\right\vert\right], t) \!\!\!\!\! \\
\emptyset &\text{otherwise}
\end{cases}\\
& \text{where } I(\mathbf{l}, t) = \begin{cases}
\bot &\text{if } \left[\right] = \mathbf{l} \\
x \le t &\text{if } \left[x\right] = \mathbf{l} \\
x \le t < y &\text{if } \left[x, y\right] = \mathbf{l} \\
x \le t < y \vee z \le t &\text{if } \left[x, y, z\right] = \mathbf{l} \\
\end{cases}
\end{aligned} \tag{9.7}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-subb">[$\left[x\right]$](../symbols.md#sequence)</span> | at | x[i]: the item at index i, or the value at key i |
| <span id="gk-bot">$\bot$</span> | bottom | false, the no of a yes-or-no value |
| <span id="gk-le">$\le$</span> | at most | less than or equal to |
| <span id="gk-vee">$\vee$</span> | or | at least one side is true |

</details>

:::

**Read it aloud.** "Lambda of a, t, h is defined as: a's preimage at h, if h is among the
keys of a's preimages and I of a's request at h and that preimage's size, and t, holds;
otherwise nothing. Where I of l and t is: false, if l is empty; x at most t, if l is x;
x at most t and t less than y, if l is x, y; x at most t and t less than y, or z at most
t, if l is x, y, z."

**What it means.** Λ needs two things: the bytes are still in the account, and the
request's history says they were there at slot t. The helper I reads the history:

| History | Available at slot t when |
| --- | --- |
| `[]` | never: asked for, not yet provided |
| `[x]` | from x on |
| `[x, y]` | from x, until just before y |
| `[x, y, z]` | from x until just before y, and again from z on |

The ≤ and < matter: at slot y itself it is already gone. This I is a helper of its own,
not §12's I that provides preimages; the paper reuses the letter.

**On a real value.** Service 3 in `preimage_needed-2`, before the block, has the 48 bytes
at `b9de…` with history `[37, 40]`:

```text
Λ(a, 38, b9de…)    I([37, 40], 38): 37 ≤ 38 < 40, true     the 48 bytes
Λ(a, 40, b9de…)    I([37, 40], 40): 40 < 40 is false        ∅
Λ(a, 36, b9de…)    I([37, 40], 36): 37 ≤ 36 is false        ∅
Λ(a, 38, 9e0e…)    9e0e… is not a key of p yet              ∅
```

**In your client.** Not built, for the reason under (9.5). The history it reads is what
`providePreimages` writes, [14.1's code](./01-providing-preimages.md#the-code).

## (9.8): the footprint, and the minimum balance

::: gray-paper-eq 9.8

<a id="ex-9-8"></a>The Gray Paper's (9.8), [in its place in the paper's words](./02-the-service-account.md#eq-9-8):

$$
\begin{align}
\forall \mathbf{a} \in \mathcal{V}\left(\delta\right)\colon \left\{ \begin{aligned}
\mathbf{a}_{i} \in \mathbb{N}_{2^{32}} &\equiv
2\cdot\left\vert\,\mathbf{a}_{\mathbf{l}}\,\right\vert + \left\vert\,\mathbf{a}_{\mathbf{s}}\,\right\vert \\
\mathbf{a}_{o} \in \mathbb{N}_{2^{64}} &\equiv
\sum\limits_{\,\left(h, z\right) \in \mathcal{K}\left(\mathbf{a}_{\mathbf{l}}\right)\,} \!\!\!\!81 + z \\
&\phantom{\equiv\ } + \sum\limits_{\left(x, y\right) \in \mathbf{a}_{\mathbf{s}}} 34 + \left\vert y\right\vert + \left\vert x\right\vert \\
\mathbf{a}_{t} \in \mathbb{N}_B &\equiv
\max(0,
\mathsf{B}_S
+ \mathsf{B}_I \cdot \mathbf{a}_{i}
+ \mathsf{B}_L \cdot \mathbf{a}_{o}
- \mathbf{a}_{f}
)
\end{aligned} \right. \tag{9.8}
\end{align}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-values">$\mathcal{V}\left(x\right)$</span> | V of | a dictionary's (or sequence's) values |
| <span id="gk-sa-items">$i$</span> | i | an account's items: 2 per request plus 1 per storage entry |
| <span id="gk-cdot">$\cdot$</span> | times | multiply |
| <span id="gk-sa-octets">$o$</span> | o | an account's octets: the bytes it keeps, with 81 per request and 34 per storage entry on top |
| <span id="gk-sum">$\sum$</span> | the sum of | add up what follows, once for each value the subscript ranges over |
| <span id="gk-sa-minbalance">$t$</span> | t | an account's minimum balance: 100, plus 10 per item and 1 per octet, less f, never below 0 |
| <span id="gk-max">$\max$</span> | max of | the largest of the values in the brackets |
| <span id="gk-Cbasedeposit" class="gk-wrap">$\mathsf{B}_S$</span> | B sub S | the deposit every service holds just to exist: 100 |
| <span id="gk-Citemdeposit" class="gk-wrap">$\mathsf{B}_I$</span> | B sub I | the deposit a service holds for each item it stores: 10 |
| <span id="gk-Cbytedeposit" class="gk-wrap">$\mathsf{B}_L$</span> | B sub L | the deposit a service holds for each byte it stores: 1 |

</details>

:::

**Read it aloud.** "For every account a among delta's values: a sub i, a 32-bit natural,
is defined as two times the size of a's requests, plus the size of a's storage. a sub o, a
64-bit natural, is defined as the sum, over each hash h and length z among the keys of a's
requests, of 81 plus z; plus the sum, over each key x and value y in a's storage, of 34
plus the size of y plus the size of x. a sub t, a balance, is defined as the max of 0 and:
B sub S, plus B sub I times a sub i, plus B sub L times a sub o, less a sub f."

**What it means.** What an account keeps, counted two ways, then priced.

1. **Items, i.** Each request counts 2, as if for the request and the preimage it
   brings. Each storage entry counts 1.
2. **Octets, o.** Each request costs 81 bytes of bookkeeping plus the length it asked
   for. Each storage entry costs 34 plus its key's and its value's bytes. The preimages
   themselves are counted through their requests' lengths, so a request is paid for
   before its data arrives.
3. **The minimum balance, t.** A base of B_S = 100, plus B_I = 10 per item, plus B_L = 1
   per octet, less the gratis offset f, and never below 0. The balance b must stay at
   least t: a service that wants to keep more must hold more.

**On a real value.** Service 1 in `assign_from_non_assigner-2`, with 1 request (for
127,513 bytes) and 3 storage entries:

```text
i    2·1 + 3                                           = 5
o    requests: 81 + 127513                             = 127594
     storage:  (34 + 4 + 1) + (34 + 34 + 5) + (34 + 3 + 35)
             = 39 + 73 + 72                            = 184
     127594 + 184                                      = 127778
t    max(0, 100 + 10·5 + 1·127778 − 0)                 = 127928
b    227714 ≥ 127928                                   enough
```

The vector's record says `items: 5, bytes: 127778`, the same.

**In your client.** `footprint` and `minimumBalance` in `src/services.ts`, [14.2's
code](./02-the-service-account.md#the-code), checked on 510 accounts.

## (12.34) to (12.36): the preimages a block may carry

::: gray-paper-eq 12.34

<a id="ex-12-34"></a>The Gray Paper's (12.34), (12.35), (12.36), [in its place in the paper's words](./01-providing-preimages.md#eq-12-34):

$$
\begin{align}
\mathbf{E}_P &\in \left[\!\left[\!\left\lgroup \mathbb{N}_S,\, \mathbb{B}_{} \right\rgroup\!\right]\!\right]_{} \tag{12.34} \\
\mathbf{E}_P &= \left[i \in \mathbf{E}_P\,\wr\!\wr\,i\right] \tag{12.35} \\
\forall \left(s, \mathbf{d}\right) &\in \mathbf{E}_P : Y(\delta, s, \mathbf{d}) \tag{12.36}
\end{align}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-xtpreimages" class="gk-wrap">$\mathbf{E}_P$</span> | E sub P | the preimages bag: data a service asked for |
| <span id="gk-sqorderuniqby">$\left[y\,\wr\!\wr\,x\right]$</span> | sorted, no repeats, by | sorted by the key on the right, each key once |
| <span id="gk-xp-serviceindex">$s$</span> | s | a preimage's service: the id of the service that asked for it, 4 bytes |
| <span id="gk-xp-data" class="gk-wrap">$\mathbf{d}$</span> | d | a preimage's data: the bytes themselves |
| <span id="gk-local-fnprovidable">$Y$</span> | Y | is this blob still wanted? true if the service exists and its request for the blob's hash and length is [ ]: asked, not yet given |

</details>

:::

**Read it aloud.** "E sub P is in: a sequence of tuples of a service id and a blob. E sub P
equals itself, sorted and without repeats. For every s and d in E sub P: Y of delta, s, d."

**What it means.** Three rules about the block's preimages, each checked by every
validator:

1. **(12.34), the shape.** A list of pairs: which service, and the bytes for it.
2. **(12.35), the order.** Sorted by service, then by the bytes themselves, and no pair
   twice. A list that isn't already in that order breaks the rule, and so does the block.
3. **(12.36), the welcome.** Every pair must be providable, Y, in δ, the state before
   the block: the service has a request for the data's hash and length, still waiting at
   `[]`. Bytes nobody asked for make the block invalid.

**On a real value.** The tiny preimages vectors, each a block at slot 42 or 43:

```text
order_check-3   (36, 1ecd…) (36, 41d1…) (36, bc89…) (45, 1ecd…) (45, 32c8…)   sorted: ok
order_check-2   (36, 1ecd…) (36, bc89…) (36, 41d1…) …                        bc > 41: not sorted
order_check-4   … (36, 41d1…) (36, 41d1…) …                                   a repeat
not_needed-1    (3, the 48 bytes hashing to b9de…)                           no request for b9de…: not providable
```

The last three end in `preimages_not_sorted_unique`, `preimages_not_sorted_unique` and
`preimage_unneeded`.

**In your client.** Not built yet: `providePreimages`, [14.1's
code](./01-providing-preimages.md#the-code), skips an unwelcome preimage instead of
refusing the block, and doesn't check the order. The [hardening
pass](https://github.com/abutlabs/the-gray-tutor/blob/main/HARDENING.md) adds both refusals.

## (12.37): the preimages, handed over

::: gray-paper-eq 12.37

<a id="ex-12-37"></a>The Gray Paper's (12.37), [in its place in the paper's words](./01-providing-preimages.md#eq-12-37):

$$
\begin{equation}
\delta' = I(\delta^\ddagger, \mathbf{E}_P) \tag{12.37}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-accountspostpreimage" class="gk-wrap">$\delta'$</span> | delta prime | the service accounts after the block, the preimages provided included |
| <span id="gk-local-fnprovide">$I$</span> | I | preimage integration: files each provided blob in its service, if that service still waits for it |
| <span id="gk-accountspostxfer" class="gk-wrap">$\delta^\ddagger$</span> | delta double dagger | the service accounts midway: after accumulation |

</details>

:::

**Read it aloud.** "Delta prime equals I of delta double dagger and E sub P."

**What it means.** The accounts after the block are the accounts after accumulation,
δ‡, with I applied. For each preimage that is providable in δ‡, the data is filed in
the service's preimages and its request's history becomes `[τ′]`. Why δ‡, not δ?
Accumulation in this block may have removed the service or dropped the request. Then the
preimage is passed over, and the block stays valid. (12.20), explained in
[17.A](../17-accumulation/gray-paper.md#ex-12-20), says what I does, step by step.

**On a real value.** `preimage_needed-2`, slot 43, carries one preimage for service 3:

```text
(3, 46 bytes)             H(the 46) = 9e0e…
δ‡[3] l[(9e0e…, 46)]      []                       waiting: providable
δ′[3] p[9e0e…]            the 46 bytes             filed
δ′[3] l[(9e0e…, 46)]      [43]                     provided at slot 43
```

**In your client.** `providePreimages(entries, preimages, slot)` in `src/services.ts`,
[14.1's code](./01-providing-preimages.md#the-code), and [Part
19](../19-block-import/index.md) calls it after accumulation.

## Say it in one breath

A service id is a u32, and δ maps each to an account (9.1, 9.2): three bags, storage,
preimages and requests, and eight plain fields (9.3). Its code is the preimage its code
hash names, metadata first (9.4). Every preimage sits under its own hash, with a request
for its hash and length (9.6), whose history of up to three slots tells refine, through
Λ, whether the bytes were there at a given recent slot (9.5, 9.7). What the account keeps
counts as items and octets, and its balance must cover 100 + 10 per item + 1 per octet,
less its gratis offset (9.8). A block's preimages come sorted, once each, and each one
asked for (12.34 to 12.36). After accumulation, each still-wanted one is filed and its
request marked with the block's slot (12.37).
