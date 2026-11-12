# The formulas, in plain words

[Part 13](./index.md)'s appendix: every formula of §8, *Authorization*, explained. Three,
(8.1) to (8.3): all the chain does about authorization. Each formula: its key, then read
aloud, in plain words, on a real value, in your client. Notation: [Reading the Gray
Paper](../reading-the-gray-paper.md).

## (8.1): what a pool and a queue are

::: gray-paper-eq 8.1

<a id="ex-8-1"></a>The Gray Paper's (8.1), [in its place in the paper's words](./01-the-authorizer-pools.md#eq-8-1):

$$
\begin{equation}
\alpha \in \left[\!\left[\left[\!\left[\mathbb{H}_{}\right]\!\right]_{:\mathsf{O}}\right]\!\right]_{\mathsf{C}}\ , \qquad
\phi \in \left[\!\left[\left[\!\left[\mathbb{H}_{}\right]\!\right]_{\mathsf{Q}}\right]\!\right]_{\mathsf{C}} \tag{8.1}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-authpool" class="gk-wrap">$\alpha$</span> | alpha | the authorizer pools: for each core, up to O = 8 authorizer hashes it accepts right now |
| <span id="gk-in">[$\in$](../symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-sequence">[$\left[\!\left[x\right]\!\right]$](../symbols.md#sequence)</span> | a sequence of | ⟦T⟧ is an array of T; a subscript is its length, :n at most n, n: at least n |
| <span id="gk-Ccorecount" class="gk-wrap">$\mathsf{C}$</span> | C | the number of cores: 341 on full, 2 on tiny |
| <span id="gk-Cauthpoolsize" class="gk-wrap">$\mathsf{O}$</span> | O | the most authorizers a core's pool holds: 8 |
| <span id="gk-hash">$\mathbb{H}$</span> | H | a 32-byte value, usually a hash |
| <span id="gk-authqueue" class="gk-wrap">$\phi$</span> | phi | the authorizer queues: for each core, Q = 80 authorizer hashes waiting to join its pool |
| <span id="gk-Cauthqueuesize" class="gk-wrap">$\mathsf{Q}$</span> | Q | how many authorizers a core's queue holds: 80 |

</details>

:::

**Read it aloud.** "Alpha is in: a sequence of C things, each a sequence of at most O
hashes. Phi is in: a sequence of C things, each a sequence of exactly Q hashes."

**In plain words.** This is a type line, a schema, not a rule: it says what shape the two
pieces of state have, the way a JSON schema says a field is an array. α holds one list per
core, and each list holds up to O = 8 authorizer hashes: the authorizers that core accepts
right now. ϕ holds one list per core too, and each holds exactly Q = 80 hashes: the line
waiting to join. Both hold names, never code. The `:O` means *at most* O, and a bare `Q`
means *exactly* Q: a pool can be short, a queue is always full.

**On a real value.** The tiny network has C = 2 cores. In the vector
`progress_authorizations-1`, before the block:

```text
α[0]  3eec b6ab baad dbe5 1989 6d74 8da3 332d     8 hashes: as many as O allows
α[1]  8ce6 80ef 510d fae1 e38b 678d af59 73cc     8 hashes
ϕ[0]  80 hashes, entry 42 is f9e9…
ϕ[1]  80 hashes, entry 42 is c874…
```

Each hash is 32 bytes; only its first two are shown. So α is 2 × 8 × 32 = 512 bytes of
hashes here, and ϕ is 2 × 80 × 32 = 5,120.

**In your client.** `POOL_SIZE` and `QUEUE_SIZE` in `src/authorization.ts`, and the codecs
that read both from the state, are [13.1's first step](./01-the-authorizer-pools.md#the-codecs-first).

## (8.2) and (8.3): one out, one in, every block

::: gray-paper-eq 8.2

<a id="ex-8-2"></a>The Gray Paper's (8.2), (8.3), [in its place in the paper's words](./01-the-authorizer-pools.md#eq-8-2):

$$
\begin{align}
&\forall c \in \mathbb{N}_{\mathsf{C}} : \alpha'\left[c\right] \equiv {\overleftarrow{F(c) \mathbin{+\!\!+} {\phi'\left[c\right]\left[\mathbf{H}_{T}\right]}^\circlearrowleft}}^{\mathsf{O}} \tag{8.2} \\
&F(c) \equiv \begin{cases} \alpha[c] \mathbin{\circ\!\!\!-\!\!-} \left\{\,(g_{\mathbf{r}})_{a}\,\right\} &\text{if } \exists g \in \mathbf{E}_G : (g_{\mathbf{r}})_{c} = c \\ \alpha[c] & \text{otherwise} \end{cases} \tag{8.3}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-forall">$\forall$</span> | for all | for every value: ∀c ∈ ℕ_C means for each core c |
| <span id="gk--core">$c$</span> | c | a core's index, 0 to C − 1 |
| <span id="gk-coreindex" class="gk-wrap">$\mathbb{N}_{\mathsf{C}}$</span> | N sub C | the core indices: 0 to C − 1 |
| <span id="gk-subb">[$\left[x\right]$](../symbols.md#sequence)</span> | at | x[i]: the item at index i, or the value at key i |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-overleftarrow">$\overleftarrow{x}$</span> | the last n of | with a number above: keep only the rightmost (newest) n items; with none: the sequence reversed |
| <span id="gk-append">[$\mathbin{+\!\!+}$](../symbols.md#concat)</span> | append | add one item at the end of the sequence |
| <span id="gk-cyclic">${x}^\circlearrowleft$</span> | wrapped around | ↺: the index goes round, counting from 0 again past the end (mod the length) |
| <span id="gk-H" class="gk-wrap">$\mathbf{H}$</span> | H | this block's header; 𝐇_T is its timeslot, 𝐇_P its parent's hash |
| <span id="gk--timeslot">$T$</span> | T | a header's timeslot: 𝐇_T is the slot this block was made for |
| <span id="gk-seqminusl">$\mathbin{\circ\!\!\!-\!\!-}$</span> | without its first | the sequence with the leftmost copy of the item taken out |
| <span id="gk-set">$\left\{\,x\,\right\}$</span> | the set of | a set: values with no order and no repeats |
| <span id="gk-g-workreport" class="gk-wrap">$\mathbf{r}$</span> | r | a guarantee's work-report: 𝐠_𝐫 is the report it vouches for |
| <span id="gk-wr-authorizer">$a$</span> | a | a report's authorizer hash: which gatekeeper let its package onto the core |
| <span id="gk-exists">[$\exists$](../symbols.md#exists)</span> | there exists | there is at least one value such that what follows holds |
| <span id="gk-xtguarantees" class="gk-wrap">$\mathbf{E}_G$</span> | E sub G | the guarantees bag: work-reports with their guarantors' signatures, one per core at most |

</details>

:::

**Read it aloud.** "For every core c in the core indices: the new alpha at c is defined as
F of c, with the new phi at c, at the header's timeslot, wrapped around, appended, keeping
the last O. F of c is defined as: alpha at c without its first copy of the authorizer of
g's report, if there exists a guarantee g in the guarantees extrinsic whose report's core
is c; otherwise, alpha at c."

**In plain words.** Every block, for each core, three things happen in this order:

1. **(8.3), one out.** If this block guarantees a report on the core, the report's
   authorizer leaves the pool: it has been used. The ⟜ sign takes out the *leftmost* copy
   only, the one that has been waiting longest. No guarantee on the core, and the pool
   stays as it was.
2. **(8.2), one in.** The queue's entry for this slot joins at the right. The ↺ on the
   index means it wraps: slot 85 reads entry 85 mod 80 = 5, so the queue is a wheel that
   turns one notch a slot.
3. **(8.2), keep the newest O.** The arrow over the whole thing, with O on top, keeps the
   rightmost 8 items. If the pool was already full and nothing went out, the oldest drops
   off the left.

The primes matter: ϕ′ is the queue *after* this block's accumulation, since an assigner
service may have replaced it in this very block ([17.5](../17-accumulation/05-privileges.md)).
That is why a client computes the new pools late, after accumulation, as the paper's last
paragraph says.

**On a real value.** `progress_authorizations-2` is slot 45, with a guarantee on each core.
Core 1's report used authorizer `510d…`:

```text
α[1]           80ef 510d fae1 e38b 678d af59 73cc c874    before: 8 hashes
F(1)           80ef      fae1 e38b 678d af59 73cc c874    510d out (8.3): 7 hashes
ϕ′[1][45]      9c89                                        45 mod 80 = 45: entry 45
F(1) ++ 9c89   80ef fae1 e38b 678d af59 73cc c874 9c89    8 hashes
α′[1]          80ef fae1 e38b 678d af59 73cc c874 9c89    8 ≤ O: nothing to drop
```

And `progress_authorizations-1`, slot 42, has no guarantees. Core 0's pool loses nothing,
gains entry 42 of its queue, and so holds 9 for a moment; keeping the last 8 drops the
oldest, `3eec`:

```text
α[0]           3eec b6ab baad dbe5 1989 6d74 8da3 332d    before: 8 hashes
F(0)           3eec b6ab baad dbe5 1989 6d74 8da3 332d    no guarantee on core 0
F(0) ++ f9e9   3eec b6ab baad dbe5 1989 6d74 8da3 332d f9e9    9 hashes
α′[0]               b6ab baad dbe5 1989 6d74 8da3 332d f9e9    the last 8: 3eec drops
```

**In your client.** `nextPools` in `src/authorization.ts`, written in [13.1](./01-the-authorizer-pools.md#the-code),
does these three steps for every core, and [Part 19](../19-block-import/index.md) calls it
after accumulation.

## Say it in one breath

Each core has a pool of at most 8 authorizer hashes, the gatekeepers it accepts now (8.1),
fed from a queue of 80 (8.1). Every block, a guarantee on the core takes its authorizer
out of the pool (8.3), the queue's entry for this slot joins (8.2), and the pool keeps its
newest 8 (8.2). The queue is the one after accumulation, because only an assigner
service's accumulate can change it.
