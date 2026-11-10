# The formulas, in plain words

[Part 11](./index.md)'s appendix: every formula of §11.1 and §11.2 the part quotes, read for someone who
doesn't read math. There are seven blocks, (11.1) and (11.11) to (11.18): what a core
holds, what an assurance is, the five rules it keeps, when a report becomes available,
and when a core lets go. [The part's page](./index.md#the-big-picture) tells who makes the
shards and the assurances; all of this is the chain's side, on every validator, your
client included. Each formula comes with its key, then the same four steps: read it aloud,
say it in plain words, watch it work on a real vector, and find it in your client.
[Reading the Gray Paper](../reading-the-gray-paper.md) teaches the shapes a line can take,
if one of these stops you.

The real values come from the tiny assurances vectors: 6 validators, 2 cores, and a block
at slot 12 whose parent's header hash is `0xd61a38a0…`.

## (11.1): what a core holds

::: gray-paper-eq 11.1

<a id="ex-11-1"></a>The Gray Paper's (11.1), [in its place in the paper's words](./01-available.md#eq-11-1):

$$
\begin{equation}
\rho \in \left[\!\left[
\!\left\lgroup
\mathbf{g}\in \mathbb{G} ,\,
t\in \mathbb{N}_T
\right\rgroup\!\boldsymbol{?}
\right]\!\right]_{\mathsf{C}} \tag{11.1}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-availassignments" class="gk-wrap">$\rho$</span> | rho | the pending reports: for each core, the report waiting to be made available, and when it came |
| <span id="gk-in">[$\in$](../symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-sequence">[$\left[\!\left[x\right]\!\right]$](../symbols.md#sequence)</span> | a sequence of | ⟦T⟧ is an array of T; a subscript is its length, :n at most n, n: at least n |
| <span id="gk-Ccorecount" class="gk-wrap">$\mathsf{C}$</span> | C | the number of cores: 341 on full, 2 on tiny |
| <span id="gk-optional">$x\boldsymbol{?}$</span> | or nothing | a value of this type, or ∅ (null) |
| <span id="gk-tuple">$\!\left\lgroup x\right\rgroup\!$</span> | the tuple of | a record: named fields, each with its type, like an object in JSON |
| <span id="gk-isa">[$x\in y$](../symbols.md#in)</span> | in | belongs to: the field's type |
| <span id="gk-aa-guarantee" class="gk-wrap">$\mathbf{g}$</span> | bold g | the guarantee a core's pending report came with: the report and its guarantors' signatures |
| <span id="gk-guarantee" class="gk-wrap">$\mathbb{G}$</span> | G | the set of guarantees: a work-report, the slot it was made at, and two or three guarantors' signatures |
| <span id="gk-aa-timestamp">$t$</span> | t | the slot a pending report arrived on its core |
| <span id="gk-timeslot" class="gk-wrap">$\mathbb{N}_T$</span> | N sub T | a timeslot: a u32 counting 6-second slots |

</details>

:::

**Read it aloud.** "Rho is in: a sequence of C things, each either nothing or a tuple of
g, a guarantee, and t, a timeslot."

**In plain words.** A type line. ρ has one place per core, and each place is empty (∅) or
holds one report waiting for its data: the whole guarantee that brought it, report and
signatures, and the slot it arrived, t. One per core, never more: that is why a core can
take a new report only when its place is empty. ρ†, ρ‡ and ρ′ have the same shape; they
are ρ after the block's disputes, assurances and guarantees.

**On a real value.** `some_assurances-1`, before the block:

```text
ρ[0]   a guarantee for package 0x63c03371…, t = 11
ρ[1]   a guarantee for package 0xc7e675b7…, t = 11
```

Two cores, two places, both busy.

**In your client.** `PendingReport` and `PendingReports` in `src/cores.ts`, written in
[lesson 10.3](../10-disputes/03-clearing-the-cores.md#the-cores): `registered_slot` is t.

## (11.11): an assurance

::: gray-paper-eq 11.11

<a id="ex-11-11"></a>The Gray Paper's (11.11), [in its place in the paper's words](./01-available.md#eq-11-11):

$$
\begin{align}
\mathbf{E}_A \in \left[\!\left[\!\left\lgroup
a\in \mathbb{H}_{},\,
f\in \mathbb{b}_{\mathsf{C}},\,
v\in \mathbb{N}_{\left\vert\kappa\right\vert},\,
s\in \bar{\mathbb{V}}
\right\rgroup\!\right]\!\right]_{} \tag{11.11}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-xtassurances" class="gk-wrap">$\mathbf{E}_A$</span> | E sub A | the assurances bag: validators saying they hold their pieces of reports |
| <span id="gk-xa-anchor">$a$</span> | a | an assurance's anchor: the parent block's header hash |
| <span id="gk-hash">$\mathbb{H}$</span> | H | a 32-byte value, usually a hash |
| <span id="gk-xa-availabilities">$f$</span> | f | an assurance's bitfield: one bit per core, 1 for "I hold my piece of its data" |
| <span id="gk-bitstring">$\mathbb{b}$</span> | b sub n | bits: a run of true-or-false values; a subscript is how many |
| <span id="gk-xa-assurer">$v$</span> | v | the assuring validator's index in κ |
| <span id="gk-Nmax">[$\mathbb{N}_{x}$](../symbols.md#naturals)</span> | N sub n | the whole numbers below n: ℕ_C is a core index, 0 to C − 1 |
| <span id="gk-len">$\left\vert x\right\vert$</span> | the size of | \|x\|: how many items x has, or how many bytes |
| <span id="gk-activeset" class="gk-wrap">$\kappa$</span> | kappa | the current validators: the keys of the V validators active this epoch |
| <span id="gk-xa-signature">$s$</span> | s | the assurer's Ed25519 signature over the parent hash and the bitfield |
| <span id="gk-edsignaturebase" class="gk-wrap">$\bar{\mathbb{V}}$</span> | V bar | an Ed25519 signature: 64 bytes |

</details>

:::

**Read it aloud.** "E sub A is in: a sequence of tuples of a, a hash; f, a bitstring of C
bits; v, a natural below the number of validators; and s, an Ed25519 signature."

**In plain words.** The assurances extrinsic is a list, at most one entry per validator.
Each says: the block I looked at (a), which cores' data I hold, one bit per core (f), who
I am (v, my place in κ), and my signature (s). The bit is a promise the chain can't check:
the footnote says a false one has no on-chain consequence, since a missing shard only shows
off the chain, when someone asks for it.

**On a real value.** Validator 0's assurance in `some_assurances-1`:

```text
a   anchor           0xd61a38a0…   32 bytes: the parent's header hash
f   bitfield         0x02          1 byte on tiny: core 1's bit only
v   validator_index  0             2 bytes, below |κ| = 6
s   signature        0xf23ddcfb…   64 bytes
                                   32 + 1 + 2 + 64 = 99 bytes
```

On full, f is 341 bits, so 43 bytes, and an assurance is 141.

**In your client.** `AssurancesExtrinsic` in `src/block.ts`, from [lesson
4.2](../04-blocks/02-tiny-and-full.md#a-codec-that-depends-on-the-size).

## (11.12) and (11.13): on the parent, in order

::: gray-paper-eq 11.12

<a id="ex-11-12"></a>The Gray Paper's (11.12), (11.13), [in its place in the paper's words](./03-bad-assurances.md#eq-11-12):

$$
\begin{align}
\forall a &\in \mathbf{E}_A : a_{a} = \mathbf{H}_{P} \tag{11.12} \\
\forall i &\in \left\{\, 1 \dots \left\vert\mathbf{E}_A\right\vert \,\right\} : \mathbf{E}_A\left[i - 1\right]_{v} < \mathbf{E}_A\left[i\right]_{v} \tag{11.13}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-forall">$\forall$</span> | for all | for every value: ∀c ∈ ℕ_C means for each core c |
| <span id="gk-H" class="gk-wrap">$\mathbf{H}$</span> | H | this block's header; 𝐇_T is its timeslot, 𝐇_P its parent's hash |
| <span id="gk--parent">$P$</span> | P | a header's parent hash: 𝐇_P is the hash of the header before it, 32 bytes |
| <span id="gk-set">$\left\{\,x\,\right\}$</span> | the set of | a set: values with no order and no repeats |
| <span id="gk-subb">[$\left[x\right]$](../symbols.md#sequence)</span> | at | x[i]: the item at index i, or the value at key i |

</details>

:::

**Read it aloud.** "For every a in E sub A: a's anchor equals H sub P. For every i from 1
to the length of E sub A: the assurer of entry i minus 1 is less than the assurer of
entry i."

**In plain words.** Two rules. Every assurance is anchored on this block's parent, H_P,
so it speaks about the cores as the parent left them and can't be replayed in a later
block. And the validator indices go strictly up, so the list is sorted and no validator
appears twice.

**On a real value.** `some_assurances-1`:

```text
H_P        0xd61a38a0…
anchors    0xd61a38a0…  six times              all equal H_P: rule (11.12) holds
indices    0 < 1 < 2 < 3 < 4 < 5               strictly up: rule (11.13) holds
```

`assurers_not_sorted_or_unique-1` sends 0, 2, 1, 3, 4, 5, and `-2` sends 0, 1, 1, 3, 4,
5: 2 < 1 fails, and so does 1 < 1. Both blocks are refused with
`not_sorted_or_unique_assurers`.

**In your client.** `assuranceError` in `src/assurances.ts`, written in [lesson
11.3](./03-bad-assurances.md#the-code): `bad_attestation_parent` and
`not_sorted_or_unique_assurers`.

## (11.14) and (11.15): signed

::: gray-paper-eq 11.14

<a id="ex-11-14"></a>The Gray Paper's (11.14), (11.15), [in its place in the paper's words](./03-bad-assurances.md#eq-11-14):

$$
\begin{align}
&\forall a \in \mathbf{E}_A : a_{s} \in \bar{\mathbb{V}}_{\kappa\left[a_{v}\right]_{e}}\left\langle\mathsf{X}_A \frown \mathcal{H}\left(\mathcal{E}_{}\left(\mathbf{H}_{P}, a_{f}\right)\right)\right\rangle \tag{11.14} \\
&\mathsf{X}_A \equiv \texttt{\$jam\_available} \tag{11.15}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-edsignature">$\bar{\mathbb{V}}_{x}\left\langle y\right\rangle$</span> | V bar sub k of m | the valid Ed25519 signatures by key k on message m: 64 bytes |
| <span id="gk-vk-ed">$e$</span> | e | a validator's Ed25519 key: the 32 bytes after its Bandersnatch key |
| <span id="gk-Xavailable" class="gk-wrap">$\mathsf{X}_A$</span> | X sub A | the context string an assurance signs: `jam_available` |
| <span id="gk-concat" class="gk-wrap">[$\frown$](../symbols.md#concat)</span> | concatenate | join: the left sequence followed by the right |
| <span id="gk-blake">$\mathcal{H}\left(x\right)$</span> | H of | the Blake2b hash of what's in the brackets: 32 bytes |
| <span id="gk-encode">[$\mathcal{E}\left(x\right)$](../symbols.md#encode)</span> | E of | the encoding of what's in the brackets: its bytes, by Appendix C's rules |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-token">$\texttt{x}$</span> | the string | a name in typewriter type: an instruction's or helper's name, or fixed bytes written as text: the ASCII bytes of its words; the dollar sign in front only marks them as text and is not one of the bytes |

</details>

:::

**Read it aloud.** "For every a in E sub A: a's signature is in the Ed25519 signatures,
by the Ed25519 key of kappa at a's v, of X sub A concatenated with H of the encoding of
H sub P and a's f. X sub A is defined as the token jam available."

**In plain words.** The signature must be the assurer's own: made with the Ed25519 key of
validator v in the current set κ, over a message of two parts. First the context string
`jam_available`, 13 bytes, so a signature made for anything else can never pass as an
assurance. Then the hash of the parent hash followed by the bitfield: change a bit, or
the anchor, and the signature fails.

**On a real value.** Validator 0's assurance in `some_assurances-1`:

```text
X_A                   6a616d5f617661696c61626c65    "jam_available": 13 bytes
ℰ(H_P, f)             0xd61a38a0…24a8e ⌢ 0x02       32 + 1 = 33 bytes
H(ℰ(H_P, f))          0xbf5537ed…2ef6985e           32 bytes
message               X_A ⌢ the hash                13 + 32 = 45 bytes
key κ[0]'s Ed25519    0x4418fb8c…
s                     0xf23ddcfb…                   verifies: true
```

**In your client.** `assuranceSigned` in `src/block.ts`, from [lesson
5.3](../05-hashing-and-signatures/03-signatures.md#the-tests), which `assuranceError` calls
last, since it's the slow check.

## (11.16): only cores with a report

::: gray-paper-eq 11.16

<a id="ex-11-16"></a>The Gray Paper's (11.16), [in its place in the paper's words](./03-bad-assurances.md#eq-11-16):

$$
\begin{equation}
\forall a \in \mathbf{E}_A, c \in \mathbb{N}_{\mathsf{C}} :
\quad a_{f}\left[c\right] \Rightarrow \rho^\dagger\left[c\right] \ne \emptyset \tag{11.16}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-cX">$c$</span> | c | a core's index, 0 to C − 1 |
| <span id="gk-coreindex" class="gk-wrap">$\mathbb{N}_{\mathsf{C}}$</span> | N sub C | the core indices: 0 to C − 1 |
| <span id="gk-Rightarrow">$\Rightarrow$</span> | implies | if the left holds, the right must hold too |
| <span id="gk-availassignmentspostjudgment" class="gk-wrap">$\rho^\dagger$</span> | rho dagger | the pending reports midway: after disputes took the judged-bad ones out |
| <span id="gk-ne">$\ne$</span> | is not | not equal |
| <span id="gk-none" class="gk-wrap">$\emptyset$</span> | nothing | ∅: no value at all, like null |

</details>

:::

**Read it aloud.** "For every a in E sub A and every core c: a's bit at c implies rho
dagger at c is not nothing."

**In plain words.** A bit may be 1 only for a core that has a report waiting, after this
block's disputes have cleared any judged bad. "Implies" reads: if the bit is set, then the
core must be busy; a 0 bit says nothing, so it's always allowed.

**On a real value.** `assurance_for_not_engaged_core-1`:

```text
ρ†[0]   a report (t = 11)       ρ†[1]   ∅
f       0x03 = 0b0000_0011       bits for cores 0 and 1
core 0  bit 1, ρ†[0] busy        fine
core 1  bit 1, ρ†[1] = ∅         broken: core_not_engaged, the block is refused
```

**In your client.** `assuranceError`, its `engaged` check ([lesson
11.3](./03-bad-assurances.md#the-code)).

## (11.17): available

::: gray-paper-eq 11.17

<a id="ex-11-17"></a>The Gray Paper's (11.17), [in its place in the paper's words](./01-available.md#eq-11-17):

$$
\begin{align}
\mathbf{R} &\equiv \left[
(\rho^\dagger\left[c\right]_{\mathbf{g}})_{\mathbf{r}}
\;\middle\vert\;
c \mathrel{\unicode{x2B40}} \mathbb{N}_{\mathsf{C}},\;
\sum_{a \in \mathbf{E}_A}\!a_{f}\left[c\right]\,>\,{}^{2}\!/_{3}\,\left\vert\kappa\right\vert
\right] \tag{11.17}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-justbecameavailable" class="gk-wrap">$\mathbf{R}$</span> | R | the reports this block made available: ready to accumulate |
| <span id="gk-build">$x \;\middle\vert\; y$</span> | for each, such that | built by a rule: the left-hand value, for every case the right-hand side allows (a set, or a sequence in order) |
| <span id="gk-g-workreport" class="gk-wrap">$\mathbf{r}$</span> | r | a guarantee's work-report: 𝐠_𝐫 is the report it vouches for |
| <span id="gk-orderedin">$\mathrel{\unicode{x2B40}}$</span> | in order, from | each item of the sequence, in its order |
| <span id="gk-sum">$\sum$</span> | the sum of | add up what follows, once for each value the subscript ranges over |
| <span id="gk-twothirds">${}^{2}\!/_{3}$</span> | two thirds | two thirds: ⌊⅔ · 6⌋ + 1 is 5 judgments on tiny, 683 of 1,023 on full |

</details>

:::

**Read it aloud.** "R is defined as the sequence of: the report of rho dagger at c's
guarantee, for each c in order in the core indices, such that the sum over a in E sub A
of a's bit at c is greater than two thirds of the number of validators."

**In plain words.** For each core, in order, count the assurances whose bit for that core
is 1. More than two thirds of the validators, and the core's report joins 𝐑, the newly
available reports, which go on to accumulation. Bits are 0 or 1, so the sum is the count.
To stay in whole numbers, check 3 × count > 2 × |κ|.

**On a real value.** `some_assurances-1`, 6 validators:

```text
f by validator   0x02  0x01  0x03  0x03  0x03  0x01
core 0's bits    0     1     1     1     1     1      sum 5;  3 × 5 = 15 > 2 × 6 = 12: available
core 1's bits    1     0     1     1     1     0      sum 4;  3 × 4 = 12 > 12? no
𝐑                [core 0's report, package 0x63c03371…]
```

On full, with 1,023 validators: 3 × 682 = 2,046 is not more than 2,046, and 3 × 683 =
2,049 is, so 683.

**In your client.** `nowAvailable` and `assuredCount` in `src/assurances.ts`, written in
[lesson 11.1](./01-available.md#the-code); [lesson 11.2](./02-timeouts.md#splitting-a-function)
splits out `availableCores`.

## (11.18): the cores let go

::: gray-paper-eq 11.18

<a id="ex-11-18"></a>The Gray Paper's (11.18), [in its place in the paper's words](./02-timeouts.md#eq-11-18):

$$
\begin{equation}
\begin{aligned}
\forall c \in \mathbb{N}_{\mathsf{C}}: \rho^\ddagger\left[c\right] \equiv {} &\begin{cases}
\emptyset &\text{if } p = \emptyset \vee (p_{\mathbf{g}})_{\mathbf{r}} \in \mathbf{R} \vee {} \\
&\phantom{\text{if }} \mathbf{H}_{T} \ge p_{t} + \mathsf{U} \vee \left\vert\kappa\right\vert \ne \left\vert\kappa'\right\vert \\
p &\text{otherwise}
\end{cases} \\
& \text{where } p = \rho^\dagger\left[c\right]
\end{aligned} \tag{11.18}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-availassignmentspostassurances" class="gk-wrap">$\rho^\ddagger$</span> | rho double dagger | the pending reports midway: after the available ones and the timed-out ones left |
| <span id="gk-vee">$\vee$</span> | or | at least one side is true |
| <span id="gk--timeslot">$T$</span> | T | a header's timeslot: 𝐇_T is the slot this block was made for |
| <span id="gk-ge">$\ge$</span> | is at least | greater than or equal to |
| <span id="gk-Cassurancetimeoutperiod" class="gk-wrap">$\mathsf{U}$</span> | U | how long a report may wait on its core for its data: 5 slots |

</details>

:::

**Read it aloud.** "For every core c: rho double-dagger at c is defined as: nothing, when p
is nothing, or p's report is in R, or the header's timeslot is at least p's t plus U, or
the number of validators now is not the number next; otherwise p. Where p is rho dagger at
c."

**In plain words.** Take each core's report after the disputes, p. The core empties if any
of four things holds:

1. it was empty already;
2. its report just became available (it is in 𝐑);
3. it has waited too long: the slot is at least t + U, U = 5 slots, 30 seconds;
4. the validator set is changing size, |κ| ≠ |κ′|: then every core empties.

Otherwise the report stays and waits another block. The paper's note after calls the last
case timing out early.

**On a real value.** Four tiny vectors, all at slot 12:

```text
some_assurances-1                  ρ†: t = 11, t = 11
  core 0  in 𝐑                                          → ∅
  core 1  12 ≥ 11 + 5? no; not in 𝐑                     → stays
no_assurances_with_stale_report-1  ρ†: t = 7, t = 11
  core 0  12 ≥ 7 + 5 = 12: timed out                    → ∅
  core 1  12 ≥ 16? no                                   → stays
assurances_for_stale_report-1      ρ†: t = 7, t = 11, every bit set
  core 0  in 𝐑, and timed out too                       → ∅, and accumulated
  core 1  in 𝐑                                          → ∅
val_set_size_change_clears_pending_reports-1   |κ| = 6, |κ′| = 3
  both cores                                            → ∅
```

The third shows the order matters: core 0's report is late, yet it still became
available in this block, so it goes on to accumulation rather than being thrown away.

**In your client.** `clearCores` in `src/assurances.ts`, written in [lesson
11.2](./02-timeouts.md#the-code).

## Say it in one breath

Each core holds at most one report waiting for its data, with the slot it arrived (11.1).
Each validator may send one assurance a block: the parent's hash, one bit per core, its
index and its signature (11.11), anchored on the parent, in index order (11.12, 11.13),
signed over `jam_available` and the hash of the parent and bits (11.14, 11.15), with bits
only for busy cores (11.16). A core whose bit more than two thirds of the validators set
has its report made available (11.17), and a core lets go when its report became
available, waited 5 slots, or the validator set changed size (11.18).
