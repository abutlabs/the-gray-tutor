# The formulas, in plain words

[Part 8](./index.md)'s appendix: every formula of §6 that the part quotes, and the two of Appendix G,
read for someone who doesn't read math. They come in the paper's order, which is not the
lessons' order: §6.2 names Safrole's state, §6.3 rotates the validators, §6.4 seals the
block and stirs the randomness, §6.5 seats the sealers, §6.6 writes the two marks, §6.7
enters the tickets, and Appendix G says what a VRF signature and a ring proof are. (§6.1's
clock and the entropy's history, (6.1), (6.2), (6.22) and (6.24), are in
[7.A](../07-time-and-shuffling/gray-paper.md).) [The part's page](./index.md#the-big-picture)
tells the cycle they make together, one epoch long. Each formula comes with its key, then
the same four steps: read it aloud, say it in plain words, watch it work on a real value,
and find it in your client. The real values are the tiny network's: 6 validators, E = 12
slots an epoch, the lottery closing at Y = 10, at most K = 3 tickets a block. Each hash or
key is shown by its first two bytes. [Reading the Gray Paper](../reading-the-gray-paper.md)
teaches the shapes a line can take, if one of these stops you.

## (6.3): Safrole's four fields

::: gray-paper-eq 6.3

<a id="ex-6-3"></a>The Gray Paper's (6.3), [in its place in the paper's words](./05-one-step-of-safrole.md#eq-6-3):

$$
\begin{align}
\gamma &\equiv \!\left\lgroup
\gamma_P,\,
\gamma_Z,\,
\gamma_S,\,
\gamma_A
\right\rgroup\! \tag{6.3}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-safrole" class="gk-wrap">$\gamma$</span> | gamma | Safrole's state: the ticket lottery for who seals the next epoch's blocks |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-tuple">$\!\left\lgroup x\right\rgroup\!$</span> | the tuple of | a record: named fields, each with its type, like an object in JSON |
| <span id="gk-pendingset" class="gk-wrap">$\gamma_P$</span> | gamma P | the pending validators: the key sets that become active at the next epoch |
| <span id="gk-epochroot" class="gk-wrap">$\gamma_Z$</span> | gamma Z | the ring root of the pending validators' Bandersnatch keys: 144 bytes a ticket's proof is checked against |
| <span id="gk-sealtickets" class="gk-wrap">$\gamma_S$</span> | gamma S | the slot sealers: one entry for each of the epoch's E slots, a winning ticket or, in the fallback, a Bandersnatch key |
| <span id="gk-ticketaccumulator" class="gk-wrap">$\gamma_A$</span> | gamma A | the ticket lottery: the best tickets entered so far for the next epoch, at most E, lowest id first |

</details>

:::

**Read it aloud.** "Gamma is defined as the tuple of gamma P, gamma Z, gamma S and gamma
A."

**In plain words.** γ is Safrole's own part of the state, one record of four fields, like
an object with four keys: γ_P, the validators who become active at the next epoch; γ_Z,
the ring root of their Bandersnatch keys; γ_S, who seals each slot of this epoch; and γ_A,
the ticket lottery for the next epoch. Safrole also changes τ, η, κ and λ, and reads ι,
but those belong to the whole state, not to γ.

**On a real value.** The vectors name the four fields `gamma_k`, `gamma_z`, `gamma_s` and
`gamma_a`. In the state they are one component, C(4), and after block 48 of the `safrole`
trace it is 2,625 bytes:

```text
γ_P   1 + 6 × 336  = 2,017 bytes   a length byte, then 6 validators' key sets
γ_Z   144          =   144 bytes   the ring root
γ_S   1 + 12 × 33  =   397 bytes   a 0 (tickets, not keys), then 12 tickets
γ_A   1 + 2 × 33   =    67 bytes   a length byte, then 2 tickets: block 48 entered 2
C(4)                 2,625 bytes
```

**In your client.** The `Safrole` type and `safroleStep` in `src/safrole.ts`, written in
[8.5](./05-one-step-of-safrole.md#the-code), hold and change all four; `SafroleState`
reads C(4) whole ([8.9](./09-seals.md#the-code)).

## (6.4) to (6.6): the ring root, the lottery, the sealers, and a ticket

::: gray-paper-eq 6.4

<a id="ex-6-4"></a>The Gray Paper's (6.4), [in its place in the paper's words](./08-the-ring-root.md#eq-6-4):

$$
\begin{align}
\gamma_Z &\in \overset{\circ}{\mathbb{B}_{}} \tag{6.4}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-in">[$\in$](../symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-ringroot" class="gk-wrap">$\overset{\circ}{\mathbb{B}}$</span> | B ring | a Bandersnatch ring root: one 144-byte commitment to a whole set of keys |

</details>

:::

::: gray-paper-eq 6.5

<a id="ex-6-5"></a>The Gray Paper's (6.5), [in its place in the paper's words](./04-the-lotterys-winners.md#eq-6-5):

$$
\begin{align}
\gamma_A \in \left[\!\left[\mathbb{T}\right]\!\right]_{:\mathsf{E}} \,,\quad
\gamma_S \in \left[\!\left[\mathbb{T}\right]\!\right]_{\mathsf{E}} \cup \left[\!\left[\overset{\backsim}{\mathbb{H}_{}}\right]\!\right]_{\mathsf{E}} \tag{6.5}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-sequence">[$\left[\!\left[x\right]\!\right]$](../symbols.md#sequence)</span> | a sequence of | ⟦T⟧ is an array of T; a subscript is its length, :n at most n, n: at least n |
| <span id="gk-Cepochlen" class="gk-wrap">$\mathsf{E}$</span> | E | an epoch's length in slots: 600 on full, 12 on tiny |
| <span id="gk-safroleticket" class="gk-wrap">$\mathbb{T}$</span> | T | a ticket: a 32-byte id, and which of its maker's tries it was (its attempt) |
| <span id="gk-cup">$\cup$</span> | union | everything in either side |
| <span id="gk-bskey" class="gk-wrap">$\overset{\backsim}{\mathbb{H}}$</span> | H tilde | a Bandersnatch public key: 32 bytes |

</details>

:::

::: gray-paper-eq 6.6

<a id="ex-6-6"></a>The Gray Paper's (6.6), [in its place in the paper's words](./04-the-lotterys-winners.md#eq-6-6):

$$
\begin{align}
\mathbb{T} &\equiv \!\left\lgroup
y\in \mathbb{H}_{},\,
e\in \mathbb{N}
\right\rgroup\! \tag{6.6}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-isa">[$x\in y$](../symbols.md#in)</span> | in | belongs to: the field's type |
| <span id="gk-st-id">$y$</span> | y | a ticket's id: 32 random bytes, the output of its ring proof; a lower id wins |
| <span id="gk-hash">$\mathbb{H}$</span> | H | a 32-byte value, usually a hash |
| <span id="gk-st-entryindex">$e$</span> | e | a ticket's entry index: which of its maker's attempts it is, counted from 0 |
| <span id="gk-N" class="gk-wrap">[$\mathbb{N}$](../symbols.md#naturals)</span> | N | the whole numbers: 0, 1, 2 and up; a subscript is a bound, ℕ₈ is 0 to 7 |

</details>

:::

**Read it aloud.** "Gamma Z is in B ring." "Gamma A is in a sequence of at most E tickets;
gamma S is in a sequence of exactly E tickets, or a sequence of exactly E Bandersnatch
keys." "T is defined as the tuple of y, in H, and e, in N."

**In plain words.** Three type lines, a schema for γ's last three fields.

- **(6.4)** γ_Z is a ring root: 144 bytes that stand for a whole list of Bandersnatch
  keys, as a hash stands for its data.
- **(6.5)** γ_A holds *at most* E tickets (the `:E`): the lottery fills up as the epoch
  goes. γ_S holds *exactly* E entries, one per slot, and the ∪ says it is one of two
  kinds: all tickets, the lottery's winners, or all Bandersnatch keys, the fallback. Never
  a mix.
- **(6.6)** A ticket 𝕋 is two fields: y, its id, 32 bytes; and e, its entry index, which
  of its maker's attempts it was. The id is random, the output of a VRF, and a lower id
  is a better ticket.

**On a real value.** From the tiny vectors:

```text
γ_Z       a778 …                144 bytes, after enact-epoch-change-with-no-tickets-4
γ_A       12 tickets            the most it may hold: E = 12 (publish-tickets-with-mark-4)
γ_A[0]    y = 00e5 …, e = 0     the best ticket: the lowest id; its maker's attempt 0
γ_A[1]    y = 015d …, e = 1     the next best
γ_S       12 keys: 9326 dee6 2105 ff71 …   the fallback (enact-epoch-change-with-no-tickets-4)
γ_S       12 tickets: 00e5 ff0a 015d …     the winners (publish-tickets-with-mark-5)
```

**In your client.** `Sealers` and `Safrole` in `src/safrole.ts`, written in
[8.5](./05-one-step-of-safrole.md#the-code); `TicketBody` is the ticket, from
[lesson 4.6](../04-blocks/06-the-header.md).

## (6.7) and (6.8): four validator sets, and their sizes

::: gray-paper-eq 6.7

<a id="ex-6-7"></a>The Gray Paper's (6.7), (6.8), [in its place in the paper's words](./02-rotating-the-validators.md#eq-6-7):

$$
\begin{gather}
\iota \in \left[\!\left[\mathbb{K}\right]\!\right]_{\mathbb{V}} \;,\quad
\gamma_P \in \left[\!\left[\mathbb{K}\right]\!\right]_{\mathbb{V}} \;,\quad
\kappa \in \left[\!\left[\mathbb{K}\right]\!\right]_{\mathbb{V}} \;,\quad
\lambda \in \left[\!\left[\mathbb{K}\right]\!\right]_{\mathbb{V}} \tag{6.7} \\
\mathbb{V} \equiv \left\{\,3c \;\middle\vert\; c \in \mathbb{N}_{2 \dots \mathsf{C}+1}\,\right\} \tag{6.8}
\end{gather}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-stagingset" class="gk-wrap">$\iota$</span> | iota | the next validators: keys queued to become active at the next epoch |
| <span id="gk-allvalkeys">$\left[\!\left[\mathbb{K}\right]\!\right]_{\mathbb{V}}$</span> | a sequence of K, of a size in V | a validator set: a 336-byte key set for each validator; 6 on tiny, 1,023 on full |
| <span id="gk-activeset" class="gk-wrap">$\kappa$</span> | kappa | the current validators: the keys of the V validators active this epoch |
| <span id="gk-previousset" class="gk-wrap">$\lambda$</span> | lambda | the last epoch's validators: kept to check what they signed before the change |
| <span id="gk-valcount" class="gk-wrap">$\mathbb{V}$</span> | V (the set) | the validator counts allowed: multiples of 3 from 6 to 3C, which is 1,023 on full and 6 on tiny |
| <span id="gk-set">$\left\{\,x\,\right\}$</span> | the set of | a set: values with no order and no repeats |
| <span id="gk-build">$x \;\middle\vert\; y$</span> | for each, such that | built by a rule: the left-hand value, for every case the right-hand side allows (a set, or a sequence in order) |
| <span id="gk-Nclamp">$\mathbb{N}_{x \dots y}$</span> | N from x to y | the whole numbers from x up to, not including, y |
| <span id="gk-Ccorecount" class="gk-wrap">$\mathsf{C}$</span> | C | the number of cores: 341 on full, 2 on tiny |

</details>

:::

**Read it aloud.** "Iota, gamma P, kappa and lambda are each in a sequence of K, of a size
in V. V is defined as the set of 3c, such that c is in N from 2 to C plus 1."

**In plain words.** The four validator sets have one type: a list of validator key sets
(𝕂, each 336 bytes, in (6.9)). ι is the staging set, γ_P the pending set, κ the active
set, λ the previous one. (6.8) says how long such a list may be: 3 times a number from 2
up to, not including, C + 1. So a multiple of 3, from 6 to 3C. Three, because validators
are dealt out to the cores in threes, each core's guarantors.

**On a real value.**

```text
tiny    C = 2      c in 2 … 3: only 2       𝕍 = { 6 }: every set holds exactly 6
full    C = 341    c in 2 … 342: 2 to 341   𝕍 = { 6, 9, 12, …, 1,023 }
```

Every tiny vector's ι, γ_P, κ and λ holds 6 key sets; the full network runs 1,023.

**In your client.** `ValidatorSets` in `src/safrole.ts`, written in
[8.2](./02-rotating-the-validators.md#the-code), holds the four sets.

## (6.9) to (6.13): a validator's 336 bytes

::: gray-paper-eq 6.9

<a id="ex-6-9"></a>The Gray Paper's (6.9), (6.10), (6.11), (6.12), (6.13), [in its place in the paper's words](./02-rotating-the-validators.md#eq-6-9):

$$
\begin{align}
\mathbb{K} &\equiv \mathbb{B}_{336} \tag{6.9} \\
\forall k \in \mathbb{K} : k_{b} \in \overset{\backsim}{\mathbb{H}_{}} &\equiv k_{0 \dots+ 32} \tag{6.10} \\
\forall k \in \mathbb{K} : k_{e} \in \bar{\mathbb{H}_{}} &\equiv k_{32 \dots+ 32} \tag{6.11} \\
\forall k \in \mathbb{K} : k_{l} \in \overset{\mathrm{B\!L\!S}}{\mathbb{B}_{}} &\equiv k_{64 \dots+ 144} \tag{6.12} \\
\forall k \in \mathbb{K} : k_{m} \in \mathbb{B}_{128} &\equiv k_{208 \dots+ 128} \tag{6.13}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-valkey" class="gk-wrap">$\mathbb{K}$</span> | K | a validator's key set: 336 bytes holding its Bandersnatch, Ed25519 and BLS keys and its metadata |
| <span id="gk-blob">[$\mathbb{B}$](../symbols.md#blobs)</span> | B, or B sub n | bytes: any run of them; 𝔹ₙ exactly n of them |
| <span id="gk-forall">$\forall$</span> | for all | for every value: ∀c ∈ ℕ_C means for each core c |
| <span id="gk-vkX">$k$</span> | k | one validator's key set: 336 bytes |
| <span id="gk-vk-bs">$b$</span> | b | a validator's Bandersnatch key: the first 32 of its 336 bytes |
| <span id="gk-subrange">$_{x \dots+ y}$</span> | from x, y of them | y items, starting at index x |
| <span id="gk-edkey" class="gk-wrap">$\bar{\mathbb{H}}$</span> | H bar | an Ed25519 public key: 32 bytes |
| <span id="gk-vk-bls">$l$</span> | l | a validator's BLS key: the 144 bytes from byte 64 |
| <span id="gk-blskey">$\overset{\mathrm{B\!L\!S}}{\mathbb{B}}$</span> | B BLS | a BLS public key: 144 bytes |
| <span id="gk-vk-metadata">$m$</span> | m | a validator's metadata: its last 128 bytes, an address and other details the chain never reads |
| <span id="gk-metadatakey" class="gk-wrap">$\mathbb{B}_{128}$</span> | B sub 128 | 128 bytes: room for a validator's metadata |

</details>

:::

**Read it aloud.** "K is defined as B 336. For all k in K: k sub b, a Bandersnatch key, is
k from 0, 32 of them. k sub e, an Ed25519 key, is k from 32, 32 of them. k sub l, a BLS
key, is k from 64, 144 of them. k sub m, 128 bytes, is k from 208, 128 of them."

**In plain words.** A validator's key set is 336 bytes laid end to end, and the four lines
name its four slices, by where each starts and how long it is:

| Bytes | Name | For |
| --- | --- | --- |
| 0 to 31 | k_b, Bandersnatch | sealing blocks and entering tickets |
| 32 to 63 | k_e, Ed25519 | signing everything else: guarantees, assurances, votes |
| 64 to 207 | k_l, BLS | BEEFY, the signatures that bridges to other chains read; outside this tutorial |
| 208 to 335 | k_m, metadata | an address and other details; the chain never reads it |

**On a real value.** ι[0] in `enact-epoch-change-with-no-tickets-4`:

```text
k[0 … 32]      9326 edb2 …      k_b, the Bandersnatch key
k[32 … 64]     cab2 b9ff …      k_e, the Ed25519 key
k[64 … 208]    00 00 … 00       k_l: the vectors leave the BLS key as zeros
k[208 … 336]   0000 … 2d7d …    k_m: the metadata, 128 bytes
```

**In your client.** `ValidatorKey` in `src/state.ts`, the codec of these four fields,
written in [6.3](../06-state-and-merklization/03-reading-the-state.md#the-code).

## (6.14) and (6.15): the sets move along, offenders zeroed

::: gray-paper-eq 6.14

<a id="ex-6-14"></a>The Gray Paper's (6.14), (6.15), [in its place in the paper's words](./02-rotating-the-validators.md#eq-6-14):

$$
\begin{align}
\left(\gamma_P', \kappa', \lambda', \gamma_Z'\right) &\equiv \begin{cases}
(\Phi(\iota), \gamma_P, \kappa, z) &\text{if } e' > e \\ \left(\gamma_P, \kappa, \lambda, \gamma_Z\right) &\text{otherwise}
\end{cases} \tag{6.14} \\
\text{where } z &= \mathcal{O}\left(\left[k_{b} \;\middle\vert\; k \mathrel{\unicode{x2B40}} \gamma_P'\right]\right) \notag \\
\Phi(\mathbf{k}) &\equiv \left[
\begin{rcases}
\left[0, 0, \dots\right] &\text{if } k_{e} \in \psi_O' \\
k &\text{otherwise}
\end{rcases}
\;\middle\vert\;
k \mathrel{\unicode{x2B40}} \mathbf{k}
\right] \tag{6.15}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-Phi">$\Phi$</span> | Phi | the key nullifier: each key set as it is, or 336 zero bytes if its Ed25519 key is an offender's |
| <span id="gk-getringroot">$\mathcal{O}\left(x\right)$</span> | O of | the ring root of a list of Bandersnatch keys |
| <span id="gk-sq">[$\left[x\right]$](../symbols.md#sequence)</span> | the sequence | a sequence written out item by item; [ ] is the empty one |
| <span id="gk-orderedin">$\mathrel{\unicode{x2B40}}$</span> | in order, from | each item of the sequence, in its order |
| <span id="gk-offenders" class="gk-wrap">$\psi_O$</span> | psi O | the offenders: Ed25519 keys of validators found to have judged a report wrongly |

</details>

:::

**Read it aloud.** "Gamma P prime, kappa prime, lambda prime, gamma Z prime are defined as:
Phi of iota, gamma P, kappa, and z, if e prime is greater than e; otherwise gamma P, kappa,
lambda, gamma Z; where z is O of the sequence of k sub b, for each k in order from gamma P
prime. Phi of k is defined as the sequence of, for each k in order from k: a run of zeros
if k's Ed25519 key is in psi O prime; otherwise k."

**In plain words.** At a new epoch, the four sets move along one place, as people in a
queue:

1. **κ′ = γ_P**: the pending validators become active;
2. **λ′ = κ**: the active ones become the previous;
3. **γ′_P = Φ(ι)**: the staging set becomes pending, through Φ;
4. **γ′_Z = z**: a new ring root, made from the new γ′_P's Bandersnatch keys, in order.

Φ, (6.15), is the bouncer: it goes through the list and replaces each validator whose
Ed25519 key is among the offenders, ψ′_O, with 336 zero bytes. The place is kept, so
everyone else keeps their index. ι itself doesn't move: only a privileged service changes
it. In any other block, nothing moves.

**On a real value.** `enact-epoch-change-with-no-tickets-4`, a new epoch, no offenders:

```text
ι      9326 2105 ff71 151e dee6 0746
γ_P    ff71 dee6 9326 0746 151e 2105
κ      2105 0746 151e ff71 dee6 9326
γ′_P   9326 2105 ff71 151e dee6 0746    Φ(ι): no offenders, so ι as it is
κ′     ff71 dee6 9326 0746 151e 2105    the old γ_P
λ′     2105 0746 151e ff71 dee6 9326    the old κ
γ′_Z   af39 → a778                      the ring root of γ′_P's keys
```

And Φ at work, in `enact-epoch-change-with-padding-1`, where ψ′_O holds one Ed25519 key,
`ab00`:

```text
ι      (9326, cab2) (2105, ab00) (ff71, 4418) …    (Bandersnatch, Ed25519)
ψ′_O   { ab00 }
γ′_P   (9326, cab2) (0000, 0000) (ff71, 4418) …    validator 1: 336 zero bytes
```

**In your client.** `rotateValidators` and `withoutOffenders` (Φ) in `src/safrole.ts`,
written in [8.2](./02-rotating-the-validators.md#the-code); `ringRootOf` (z), in
[8.8](./08-the-ring-root.md#the-code).

## (6.16) to (6.21): the seal and the entropy source

::: gray-paper-eq 6.16

<a id="ex-6-16"></a>The Gray Paper's (6.16), (6.17), (6.18), (6.19), (6.20), (6.21), [in its place in the paper's words](./09-seals.md#eq-6-16):

$$
\begin{align}
\text{let } i = {\gamma_S'[\mathbf{H}_{T}]}^\circlearrowleft\colon \notag \\
\gamma_S' \in \left[\!\left[\mathbb{T}\right]\!\right]_{} &\implies \left\{ \,\begin{aligned}
&i_{y} = \mathcal{Y}\left(\mathbf{H}_{S}\right)\,,\\
&\mathbf{H}_{S} \in \overset{\backsim}{\mathbb{V}}_{\mathbf{H}_{A}}^{\mathcal{E}_{U}\left(\mathbf{H}\right)}\left\langle\mathsf{X}_T \frown \eta'_3 \mathbin{+\!\!+} i_{e}\right\rangle\,,\\
&\mathbf{T} = 1
\end{aligned} \right. \tag{6.16} \\
\gamma_S' \in \left[\!\left[\overset{\backsim}{\mathbb{H}_{}}\right]\!\right]_{} &\implies \left\{ \,\begin{aligned}
&i = \mathbf{H}_{A}\,,\\
&\mathbf{H}_{S} \in \overset{\backsim}{\mathbb{V}}_{\mathbf{H}_{A}}^{\mathcal{E}_{U}\left(\mathbf{H}\right)}\left\langle\mathsf{X}_F \frown \eta'_3\right\rangle\,,\\
&\mathbf{T} = 0
\end{aligned} \right. \tag{6.17} \\
\mathbf{H}_{V} &\in \overset{\backsim}{\mathbb{V}}_{\mathbf{H}_{A}}^{\left[\right]}\left\langle\mathsf{X}_E \frown \mathcal{Y}\left(\mathbf{H}_{S}\right)\right\rangle \tag{6.18} \\
\mathsf{X}_E &= \texttt{\$jam\_entropy} \tag{6.19} \\
\mathsf{X}_F &= \texttt{\$jam\_fallback\_seal} \tag{6.20} \\
\mathsf{X}_T &= \texttt{\$jam\_ticket\_seal} \tag{6.21}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-cyclic">${x}^\circlearrowleft$</span> | wrapped around | ↺: the index goes round, counting from 0 again past the end (mod the length) |
| <span id="gk-H" class="gk-wrap">$\mathbf{H}$</span> | H | this block's header; 𝐇_T is its timeslot, 𝐇_P its parent's hash |
| <span id="gk--timeslot">$T$</span> | T | a header's timeslot: 𝐇_T is the slot this block was made for |
| <span id="gk-implies">$\implies$</span> | means that | if the left side holds, everything on the right must hold too |
| <span id="gk-abracegroup">$\left\{ \begin{aligned}x\end{aligned} \right.$</span> | as follows | a brace grouping lines that hold together: for a function, its type on top, then what each input becomes |
| <span id="gk-banderout">$\mathcal{Y}\left(x\right)$</span> | Y of | the 32-byte random output a Bandersnatch signature or proof carries, used as entropy |
| <span id="gk--sealsig">$S$</span> | S | a header's seal: 𝐇_S, the author's 96-byte Bandersnatch signature on the rest of the header |
| <span id="gk-bssignature">$\overset{\backsim}{\mathbb{V}}_{x}^{z}\left\langle y\right\rangle$</span> | V tilde sub k, context c, of m | the valid Bandersnatch signatures by key k on message m in context c: 96 bytes |
| <span id="gk--authorbskey">$A$</span> | A | the author's Bandersnatch key: 𝐇_A, looked up in κ′ at 𝐇_I, never written in the header |
| <span id="gk-Xticket" class="gk-wrap">$\mathsf{X}_T$</span> | X sub T | the context of a ticket and its seal: the bytes of "jam_ticket_seal" |
| <span id="gk-concat" class="gk-wrap">[$\frown$](../symbols.md#concat)</span> | concatenate | join: the left sequence followed by the right |
| <span id="gk-entropy" class="gk-wrap">$\eta$</span> | eta | entropy: four 32-byte values of randomness, the newest mixing in every block |
| <span id="gk-append">[$\mathbin{+\!\!+}$](../symbols.md#concat)</span> | append | add one item at the end of the sequence |
| <span id="gk-encodeunsignedheader">$\mathcal{E}_{U}\left(x\right)$</span> | E sub U of | the header's bytes without its seal: what the seal signs |
| <span id="gk-isticketed" class="gk-wrap">$\mathbf{T}$</span> | T | ticketed: 1 if the block was sealed with a ticket, 0 if by the fallback |
| <span id="gk-Xfallback" class="gk-wrap">$\mathsf{X}_F$</span> | X sub F | the context of a fallback seal: the bytes of "jam_fallback_seal" |
| <span id="gk--vrfsig">$V$</span> | V | a header's VRF signature: 𝐇_V, 96 bytes of the author's fresh randomness; the vectors' entropy source |
| <span id="gk-Xentropy" class="gk-wrap">$\mathsf{X}_E$</span> | X sub E | the context of the entropy source: the bytes of "jam_entropy" |
| <span id="gk-token">$\texttt{x}$</span> | the string | a name in typewriter type: an instruction's or helper's name, or fixed bytes written as text: the ASCII bytes of its words; the dollar sign in front only marks them as text and is not one of the bytes |

</details>

:::

**Read it aloud.** "Let i be gamma S prime at the header's timeslot, wrapped around. If
gamma S prime is a sequence of tickets, that means: i's y equals Y of H sub S; H sub S is a
Bandersnatch signature by H sub A, on E sub U of H, in the context X T, eta three prime,
and i's e; and T is 1. If gamma S prime is a sequence of Bandersnatch keys, that means: i
is H sub A; H sub S is a Bandersnatch signature by H sub A, on E sub U of H, in the context
X F and eta three prime; and T is 0. H sub V is a Bandersnatch signature by H sub A, on
nothing, in the context X E and Y of H sub S. X E is the string jam entropy; X F, jam
fallback seal; X T, jam ticket seal."

**In plain words.** Every header carries two Bandersnatch VRF signatures by its author,
H_A (the Bandersnatch key of validator H_I in κ′, from
[(5.10)](../04-blocks/06-the-header.md#eq-5-10)). A signature here has a key (under the
V), a message (above it) and a context (in the angle brackets). First find i, this slot's
entry in the sealers: γ′_S at the slot, wrapped round E, so at the phase.

1. **(6.16), a ticket's slot.** The seal H_S signs the header without its seal, ℰ_U(H),
   in the context X_T ⌢ η′₃ ⌢ the ticket's attempt. Its output must equal the ticket's id.
   Only the validator who made that ticket can do this, since the id was the same key's
   output on the same input.
2. **(6.17), a fallback slot.** The entry is a key, and it must be the author's own. The
   seal signs ℰ_U(H) in the context X_F ⌢ η′₃.
3. **(6.18), the entropy source.** H_V signs nothing, in the context X_E ⌢ the seal's
   output. Its output is what (6.23) stirs into η₀: nobody, the author included, could
   pick it, since the seal fixed it first.
4. **(6.19) to (6.21)** are the three contexts' fixed bytes: `jam_entropy`,
   `jam_fallback_seal`, `jam_ticket_seal`. The `$` only marks them as text; it isn't one of
   the bytes.

T is a flag for later rules, 1 for a ticket-sealed block: when choosing which chain to
build on, §19 counts the ticket-sealed blocks, since a ticket's seal is the more secure.

**On a real value.** Block 48 of the `safrole` trace, sealed by a ticket:

```text
H_T = 48              48 mod 12 = 0: i = γ′_S[0], the ticket (y = 2752 …, e = 0)
H_I = 2               H_A = κ′[2]'s Bandersnatch key, 9326 …
context of H_S        "jam_ticket_seal" ⌢ η′₃ (9624 …) ⌢ 0
𝒴(H_S)                2752 42ae …: equals i's y, so the seal holds the slot's ticket
context of H_V        "jam_entropy" ⌢ 2752 42ae …, on no message
T                     1
```

And block 46, in a fallback epoch:

```text
H_T = 46              46 mod 12 = 10: i = γ′_S[10], a key, 2105 …
H_I = 5               H_A = κ′[5] = 2105 …: equals i, so this is the slot's sealer
context of H_S        "jam_fallback_seal" ⌢ η′₃ (cf7f …)
T                     0
```

Both seals and both entropy sources check out under the author's key.

**In your client.** `sealError` and `checkSignature` in `src/safrole.ts` and
`src/bandersnatch.ts`, written in [8.9](./09-seals.md#the-code).

## (6.23): every block stirs the randomness

::: gray-paper-eq 6.23

<a id="ex-6-23"></a>The Gray Paper's (6.23), [in its place in the paper's words](./01-stirring-the-entropy.md#eq-6-23):

$$
\begin{align}
\eta_0' &\equiv \mathcal{H}\left(\eta_0 \frown \mathcal{Y}\left(\mathbf{H}_{V}\right)\right) \tag{6.23}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-entropyaccumulator" class="gk-wrap">$\eta_0$</span> | eta zero | the entropy accumulator: 32 bytes that every block's VRF output is hashed into |
| <span id="gk-blake">$\mathcal{H}\left(x\right)$</span> | H of | the Blake2b hash of what's in the brackets: 32 bytes |

</details>

:::

**Read it aloud.** "Eta zero prime is defined as the hash of eta zero concatenated with Y
of H sub V."

**In plain words.** Every block, the accumulator η₀ takes in fresh randomness: the output
of the header's entropy source, H_V, 32 bytes nobody could steer. Join the old η₀ and that
output, 64 bytes, and hash them with Blake2b; the 32 bytes that come out are the new η₀.
Hashing the old value in means one block can't wipe out what the blocks before it added.

**On a real value.** Block 1 of the `safrole` trace:

```text
η₀                1579 1ce2 …    the accumulator, before the block
H_V               62bc 9d23 …    96 bytes: the header's entropy_source
𝒴(H_V)            8319 9eec …    its output, (G.2)
H(η₀ ⌢ 𝒴(H_V))    5b8e 9d7c …    η′₀: the next state in the trace holds the same
```

**In your client.** `nextEntropy` in `src/safrole.ts`, written in
[8.1](./01-stirring-the-entropy.md#the-code).

## (6.25) and (6.26): who seals the new epoch, seated outside in

::: gray-paper-eq 6.25

<a id="ex-6-25"></a>The Gray Paper's (6.25), [in its place in the paper's words](./04-the-lotterys-winners.md#eq-6-25):

$$
\begin{align}
\gamma_S' &\equiv \begin{cases}
Z(\gamma_A) &\text{if } e' = e + 1 \wedge m \geq \mathsf{Y} \wedge \left\vert\gamma_A\right\vert = \mathsf{E}\!\!\\
\gamma_S &\text{if } e' = e \\
F(\eta'_2, \kappa') \!\!\!&\text{otherwise}
\end{cases} \tag{6.25}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-wedge">$\wedge$</span> | and | both sides are true |
| <span id="gk-geq">$\geq$</span> | is at least | greater than or equal to |
| <span id="gk-Cepochtailstart" class="gk-wrap">$\mathsf{Y}$</span> | Y | the slot of an epoch at which the ticket lottery closes: 500 on full, 10 on tiny |
| <span id="gk-len">$\left\vert x\right\vert$</span> | the size of | \|x\|: how many items x has, or how many bytes |

</details>

:::

::: gray-paper-eq 6.26

<a id="ex-6-26"></a>The Gray Paper's (6.26), [in its place in the paper's words](./04-the-lotterys-winners.md#eq-6-26):

$$
\begin{equation}
Z\colon\left\{ \,\begin{aligned}
\left[\!\left[\mathbb{T}\right]\!\right]_{\mathsf{E}} &\to \left[\!\left[\mathbb{T}\right]\!\right]_{\mathsf{E}}\\
\mathbf{s} &\mapsto \left[\mathbf{s}_0, \mathbf{s}_{\left\vert\mathbf{s}\right\vert - 1}, \mathbf{s}_1, \mathbf{s}_{\left\vert\mathbf{s}\right\vert - 2}, \dots\right]\\
\end{aligned} \right. \tag{6.26}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-to">[$\to$](../symbols.md#to)</span> | to | what goes in, to what comes out: A → B takes an A and gives a B |
| <span id="gk-mapsto">$\mapsto$</span> | maps to | what a function gives back for an input: x ↦ y says x becomes y |

</details>

:::

**Read it aloud.** "Gamma S prime is defined as: Z of gamma A, if e prime equals e plus 1,
and m is at least Y, and the size of gamma A is E; gamma S, if e prime equals e; F of eta
two prime and kappa prime, otherwise." And: "Z maps a sequence of E tickets to a sequence
of E tickets: s maps to s 0, s at its size minus 1, s 1, s at its size minus 2, and so on."

**In plain words.** The sealers change only when a new epoch begins, and then the paper
tries three cases in order:

1. **The winners**, if all three hold: this block is in the very next epoch (e′ = e + 1,
   no epoch skipped), the block before it was past the lottery's close (m ≥ Y), and the
   lottery is full (|γ_A| = E).
2. **Unchanged**, if the epoch hasn't turned (e′ = e).
3. **The fallback** otherwise: F, (6.27), picks keys from η′₂ and the new active set.

Z seats the winners *outside in*: the best, the worst, the second best, the second worst,
and so on inwards. The lottery is sorted by id, so slot 0 gets the lowest id.

**On a real value.** `publish-tickets-with-mark-5`: τ = 11, and the block is at slot 12.

```text
e, m     11 ÷ 12 = 0, remainder 11     e  = 0, m = 11
e′       12 ÷ 12 = 1                   e′ = 1 = e + 1   ✓
m ≥ Y    11 ≥ 10                       ✓
|γ_A|    12 = E                        ✓   so γ′_S = Z(γ_A)
γ_A      00e5 015d 2016 420c 4c82 5af4 d6fe d96b e12c f4aa ff03 ff0a
Z        s₀ s₁₁ s₁ s₁₀ s₂ s₉ s₃ s₈ s₄ s₇ s₅ s₆
γ′_S     00e5 ff0a 015d ff03 2016 f4aa 420c e12c 4c82 d96b 5af4 d6fe
```

Two vectors that hold a full lottery and still fall back: `skip-epoch-tail-1` goes from
slot 45 (m = 9) to 48, so m ≥ Y fails: no block crossed the close, and the winners were
never announced. `skip-epochs-1` goes from slot 10 to 46, epoch 0 to 3, so e′ = e + 1
fails.

**In your client.** `sealedByTickets` and `outsideIn` (Z) in `src/safrole.ts`, written in
[8.4](./04-the-lotterys-winners.md#the-code); `safroleStep` chooses the case
([8.5](./05-one-step-of-safrole.md#the-code)).

## (6.27): the fallback sealers

::: gray-paper-eq 6.27

<a id="ex-6-27"></a>The Gray Paper's (6.27), [in its place in the paper's words](./03-the-fallback-sealers.md#eq-6-27):

$$
\begin{equation}
F\colon \left\{ \ \begin{aligned}
\!\left\lgroup\mathbb{H}_{},\,\left[\!\left[\mathbb{K}\right]\!\right]_{}\right\rgroup\! &\to \left[\!\left[\overset{\backsim}{\mathbb{H}_{}}\right]\!\right]_{\mathsf{E}}\\
\left(r,\, \mathbf{k}\right) &\mapsto \left[
{\mathbf{k}_{\mathcal{E}^{-1}_{4}\left(\mathcal{H}\left(r \frown \mathcal{E}_{4}\left(i\right)\right)_{\dots 4}\right)}}^\circlearrowleft_{b}
\;\middle\vert\;
i \in \mathbb{N}_{\mathsf{E}}
\right]
\end{aligned} \right.\!\!\! \tag{6.27}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-decode">[$\mathcal{E}^{-1}\left(x\right)$](../symbols.md#decode)</span> | E inverse of | decoding: bytes back into the value they encode |
| <span id="gk-encode">[$\mathcal{E}\left(x\right)$](../symbols.md#encode)</span> | E of | the encoding of what's in the brackets: its bytes, by Appendix C's rules |
| <span id="gk-epochindex" class="gk-wrap">$\mathbb{N}_{\mathsf{E}}$</span> | N sub E | a slot's place within its epoch: 0 to E − 1 |

</details>

:::

**Read it aloud.** "F maps a hash and a sequence of validator key sets to a sequence of E
Bandersnatch keys. r and k map to: for each i in N sub E, the Bandersnatch key of k at E-4
inverse of the first 4 bytes of the hash of r concatenated with E-4 of i, wrapped around."

**In plain words.** For each slot i of the epoch, 0 to E − 1:

1. write i as 4 bytes, little-endian, and put it after r, the randomness;
2. hash the 36 bytes with Blake2b;
3. read the hash's first 4 bytes as a little-endian number;
4. take that validator of k, wrapping round the list's length (mod 6 on tiny), and keep
   its Bandersnatch key.

(6.25) calls it with r = η′₂, randomness two epochs old, and k = κ′, the new active set:
both fixed before anyone could aim at a slot.

**On a real value.** `enact-epoch-change-with-no-tickets-4`: r = η′₂ = `ee15 5ace …`, and
κ′ = `ff71 dee6 9326 0746 151e 2105`.

```text
i = 0   H(r ⌢ 00 00 00 00) starts fc 04 28 db   0xdb2804fc = 3,676,833,020   mod 6 = 2   κ′[2] = 9326
i = 1   H(r ⌢ 01 00 00 00) starts b5 b2 76 46   0x4676b2b5 = 1,182,184,117   mod 6 = 1   κ′[1] = dee6
i = 2   H(r ⌢ 02 00 00 00) starts e5 f2 38 93   0x9338f2e5 = 2,469,982,949   mod 6 = 5   κ′[5] = 2105
…
γ′_S    9326 dee6 2105 ff71 ff71 0746 dee6 2105 dee6 dee6 151e dee6
```

A validator may get several slots, or none: here dee6 gets five.

**In your client.** `fallbackKeys` in `src/safrole.ts`, written in
[8.3](./03-the-fallback-sealers.md#the-code).

## (6.28) and (6.29): the two marks

::: gray-paper-eq 6.28

<a id="ex-6-28"></a>The Gray Paper's (6.28), [in its place in the paper's words](./05-one-step-of-safrole.md#eq-6-28):

$$
\begin{align}
\mathbf{H}_{E} &\equiv \begin{cases}
\left( \eta_0, \eta_1, \left[
\left(k_{b}, k_{e}\right)
\;\middle\vert\;
k \mathrel{\unicode{x2B40}} \gamma_P'
\right] \right) &\text{if } e' > e \\
\emptyset & \text{otherwise}
\end{cases} \tag{6.28}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk--epochmark">$E$</span> | E | a header's epoch mark: 𝐇_E, at an epoch's first block only, the next epoch's entropy and validator keys |
| <span id="gk-none" class="gk-wrap">$\emptyset$</span> | nothing | ∅: no value at all, like null |

</details>

:::

::: gray-paper-eq 6.29

<a id="ex-6-29"></a>The Gray Paper's (6.29), [in its place in the paper's words](./04-the-lotterys-winners.md#eq-6-29):

$$
\begin{align}
\mathbf{H}_{W} &\equiv \begin{cases}
Z(\gamma_A) &\text{if } e' = e \wedge m < \mathsf{Y} \le m' \wedge \left\vert\gamma_A\right\vert = \mathsf{E} \\
\emptyset & \text{otherwise}
\end{cases} \tag{6.29}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk--winnersmark">$W$</span> | W | a header's winning-tickets mark: 𝐇_W, at most once an epoch, a ticket for every slot of the next (12 on tiny, 600 on full) |
| <span id="gk-le">$\le$</span> | at most | less than or equal to |

</details>

:::

**Read it aloud.** "H sub E is defined as: the tuple of eta zero, eta one, and the
sequence of the pair k sub b, k sub e, for each k in order from gamma P prime, if e prime
is greater than e; nothing otherwise." And: "H sub W is defined as: Z of gamma A, if e
prime equals e, and m is less than Y, which is at most m prime, and the size of gamma A is
E; nothing otherwise."

**In plain words.** Two header fields that let a node follow the validators from headers
alone, without the state:

- **The epoch mark**, H_E, (6.28): in the first block of a new epoch, the randomness as it
  was before the block, η₀ and η₁ (without a prime), and the two keys, Bandersnatch and Ed25519,
  of each validator in γ′_P, the set that becomes active at the epoch after. ∅ in every
  other block.
- **The tickets mark**, H_W, (6.29): in the block that crosses the lottery's close within
  one epoch (its parent before phase Y, itself at Y or after) and only if the lottery is
  full, the winners in the order they'll seal. ∅ otherwise.

**On a real value.** The epoch mark in `enact-epoch-change-with-no-tickets-4`, slot 10 to
15, so e′ > e:

```text
η₀        f164 …          the accumulator before this block
η₁        ee15 …
keys      (9326, cab2) (2105, ab00) (ff71, 4418) (151e, 8b8c) (dee6, ad93) (0746, f30a)
          γ′_P's (Bandersnatch, Ed25519) pairs
```

The tickets mark in `publish-tickets-with-mark-4`, slot 3 to 11:

```text
e′ = e      3 and 11 are both in epoch 0          ✓
m < Y ≤ m′  3 < 10 ≤ 11                          ✓
|γ_A| = E   12                                    ✓
H_W         00e5 ff0a 015d ff03 2016 f4aa 420c e12c 4c82 d96b 5af4 d6fe    Z(γ_A)
```

**In your client.** `ticketsMark` in `src/safrole.ts`, written in
[8.4](./04-the-lotterys-winners.md#the-code); `safroleStep` makes the epoch mark
([8.5](./05-one-step-of-safrole.md#the-code)).

## (6.30) and (6.31): what a block may enter

::: gray-paper-eq 6.30

<a id="ex-6-30"></a>The Gray Paper's (6.30), (6.31), [in its place in the paper's words](./07-entering-tickets.md#eq-6-30):

$$
\begin{align}
\begin{split}
\mathbf{E}_T &\in \left[\!\left[\!\left\lgroup
e\in \mathbb{N}_{n},\,
p\in \overset{\circ}{\mathbb{V}}_{\gamma_Z'}^{\left[\right]}\left\langle\mathsf{X}_T \frown \eta'_2 \mathbin{+\!\!+} e\right\rangle
\right\rgroup\!\right]\!\right]_{} \\
&\phantom{{}\in{}}  \text{where } n = \left\lceil\frac{2\mathsf{E}}{\left\vert\gamma_P'\right\vert}\right\rceil
\end{split} \tag{6.30} \\
\left\vert\mathbf{E}_T\right\vert &\le \begin{cases}
\mathsf{K} &\text{if } m' < \mathsf{Y} \\
0 &\text{otherwise}
\end{cases} \tag{6.31}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-xttickets" class="gk-wrap">$\mathbf{E}_T$</span> | E sub T | the tickets bag: entries to the block-sealing lottery |
| <span id="gk-Nmax">[$\mathbb{N}_{x}$](../symbols.md#naturals)</span> | N sub n | the whole numbers below n: ℕ_C is a core index, 0 to C − 1 |
| <span id="gk-xt-proof">$p$</span> | p | an entered ticket's ring proof: 784 bytes proving a pending validator made it, without saying which |
| <span id="gk-bsringproof">$\overset{\circ}{\mathbb{V}}_{x}^{z}\left\langle y\right\rangle$</span> | V ring sub r, context c, of m | a ring proof: signed by some key in the ring with root r, without saying which: 784 bytes |
| <span id="gk-ceil">$\left\lceil x\right\rceil$</span> | ceiling of | rounded up to a whole number |
| <span id="gk-frac">$\frac$</span> | over | a fraction: the top divided by the bottom |
| <span id="gk-Cmaxblocktickets" class="gk-wrap">$\mathsf{K}$</span> | K | the most tickets one block may carry: 16 on full, 3 on tiny |

</details>

:::

**Read it aloud.** "E sub T is in a sequence of tuples of: e, in N sub n; and p, a ring
proof against gamma Z prime, on nothing, in the context X T, eta two prime and e; where n
is the ceiling of 2 E over the size of gamma P prime. The size of E sub T is at most: K, if
m prime is less than Y; 0 otherwise."

**In plain words.** The tickets extrinsic is a list of entries, each two fields:

- **e**, the attempt, below n. n = ⌈2E / |γ′_P|⌉ is how many tickets each validator may
  enter in an epoch: enough for the validators to fill the lottery twice over.
- **p**, a 784-byte ring proof: made by one of the keys in the ring γ′_Z, without saying
  which, for the input X_T ⌢ η′₂ ⌢ e. η′₂ is randomness fixed before the epoch began, so
  nobody could have chosen it to favor their tickets.

(6.31) caps the list: at most K tickets while the lottery is open (m′ < Y), none after.

**On a real value.**

```text
tiny   n = ⌈2 × 12 / 6⌉    = ⌈4⌉    = 4   attempts 0 to 3
full   n = ⌈2 × 600 / 1,023⌉ = ⌈1.17⌉ = 2   attempts 0 and 1
proof input   "jam_ticket_seal" (15 bytes) ⌢ η′₂ (32) ⌢ e (1 byte) = 48 bytes
```

`publish-tickets-no-mark-1` enters a ticket with attempt 4: not below n = 4, so
`bad_ticket_attempt`. `publish-tickets-no-mark-7` is at slot 10, so m′ = 10 is not below
Y = 10 and the cap is 0; it brings one ticket, so `unexpected_ticket`.

**In your client.** `attemptsAllowed` (n) and `safroleError` in `src/safrole.ts`, written
in [8.7](./07-entering-tickets.md#the-code); `ticketInput` and `ringProofsHold`, in
[8.8](./08-the-ring-root.md#the-code).

## (6.32) to (6.34): the new tickets, in order, none twice

::: gray-paper-eq 6.32

<a id="ex-6-32"></a>The Gray Paper's (6.32), [in its place in the paper's words](./07-entering-tickets.md#eq-6-32):

$$
\begin{align}
\mathbf{n} &\equiv \left[
\left(
y\mathrel{\unicode{x2AF6}}\mathcal{Y}\left(i_{p}\right),\,
e\mathrel{\unicode{x2AF6}} i_{e}
\right)
\;\middle\vert\;
i \mathrel{\unicode{x2B40}} \mathbf{E}_T
\right] \tag{6.32}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-is">$x\mathrel{\unicode{x2AF6}} y$</span> | is a | names a field and gives its type, in a tuple |

</details>

:::

::: gray-paper-eq 6.33

<a id="ex-6-33"></a>The Gray Paper's (6.33), (6.34), [in its place in the paper's words](./07-entering-tickets.md#eq-6-33):

$$
\begin{align}
\mathbf{n} &= \left[x \in \mathbf{n}\,\wr\!\wr\,x_{y}\right] \tag{6.33} \\
\left\{\,  x_{y}  \;\middle\vert\;  x \in \mathbf{n} \,\right\} &\mathrel{\unicode{x2AEF}} \left\{\,  x_{y}  \;\middle\vert\;  x \in \gamma_A \,\right\} \tag{6.34}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-sqorderuniqby">$\left[y\,\wr\!\wr\,x\right]$</span> | sorted, no repeats, by | sorted by the key on the right, each key once |
| <span id="gk-disjoint">$\mathrel{\unicode{x2AEF}}$</span> | share nothing with | the two sides have no item in common |

</details>

:::

**Read it aloud.** "n is defined as the sequence of tuples: y is Y of i's p, e is i's e,
for each i in order from E sub T." And: "n equals n sorted by x's y, no repeats. The set of
x's y for each x in n shares nothing with the set of x's y for each x in gamma A."

**In plain words.** (6.32) turns each entered ticket into a ticket of the lottery: its id
y is the output of its ring proof, (G.5), and its attempt e is kept. (6.33) says the block
must list them already sorted by id, with no id twice: the list must equal itself sorted,
duplicates removed. (6.34) says none of them may be in the lottery already. A block that
breaks either is invalid.

**On a real value.** `publish-tickets-no-mark-6`, where γ_A holds `00e5`, `015d` and
`2016`:

```text
E_T[0]   e = 2, proof 33ac …   y = 𝒴(proof) = 3434 …
E_T[1]   e = 1, proof 2b4b …   y = 5af4 …
E_T[2]   e = 3, proof 6ce2 …   y = d6fe …
(6.33)   3434 < 5af4 < d6fe     sorted, none twice   ✓
(6.34)   none is 00e5, 015d or 2016                   ✓
```

`publish-tickets-no-mark-4` lists the same three as d6fe, 5af4, 3434: not sorted, so
`bad_ticket_order`. `publish-tickets-no-mark-3` enters `00e5` again: `duplicate_ticket`.

**In your client.** `ticketId` and `safroleError` in `src/safrole.ts`, written in
[8.7](./07-entering-tickets.md#the-code).

## (6.35) and (6.36): the lottery keeps the best E

::: gray-paper-eq 6.35

<a id="ex-6-35"></a>The Gray Paper's (6.35), [in its place in the paper's words](./07-entering-tickets.md#eq-6-35):

$$
\begin{equation}
\begin{aligned}
\gamma_A' &\equiv  {\overrightarrow{\left[x \in \mathbf{n} \cup \begin{cases} \emptyset\ &\text{if } e' > e \\ \gamma_A\ &\text{otherwise} \end{cases}\,\wr\,x_{y}\right]~}}^{\mathsf{E}} \\
\end{aligned} \tag{6.35}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-overrightarrow">$\overrightarrow$</span> | the first n of | with a number above: keep only the leftmost n items |
| <span id="gk-sqorderby">$\left[y\,\wr\,x\right]$</span> | sorted by | the sequence's items, sorted by the key on the right |

</details>

:::

::: gray-paper-eq 6.36

<a id="ex-6-36"></a>The Gray Paper's (6.36), [in its place in the paper's words](./07-entering-tickets.md#eq-6-36):

$$
\begin{align}
\mathbf{n} \subseteq \gamma_A' \tag{6.36}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-subseteq">$\subseteq$</span> | is a subset of | everything in the left is in the right |

</details>

:::

**Read it aloud.** "Gamma A prime is defined as the first E of: x in n union (nothing if e
prime is greater than e, gamma A otherwise), sorted by x's y." And: "n is a subset of
gamma A prime."

**In plain words.** The new lottery is the new tickets together with the old ones (none
at a new epoch: a new lottery starts empty), sorted by id, cut to the best E. (6.36) adds
that every new ticket must survive the cut: a ticket too poor to make the lottery is a
waste of space, and a block that brings one is invalid.

**On a real value.** `publish-tickets-no-mark-6`, three in, three new:

```text
γ_A ∪ n, sorted   00e5 015d 2016 3434 5af4 d6fe    6 tickets
first E = 12      all 6                           γ′_A
n ⊆ γ′_A          3434, 5af4, d6fe are all in it   ✓
```

And `publish-tickets-with-mark-3`, a full lottery and three better tickets:

```text
γ_A        420c 4c82 5af4 d6fe d96b e12c f4aa ff03 ff0a ff35 ffa0 ffda    12
n          00e5 015d 2016                                               3 better ones
sorted     00e5 015d 2016 420c … ff0a ff35 ffa0 ffda                    15
γ′_A       00e5 015d 2016 420c … ff0a                                   the first 12: ff35, ffa0, ffda drop
```

**In your client.** `safroleStep` in `src/safrole.ts`, written in
[8.5](./05-one-step-of-safrole.md#the-code), with the tickets joining in
[8.7](./07-entering-tickets.md#the-code).

## (G.1) and (G.2): a VRF signature and its output

::: gray-paper-eq G.1

<a id="ex-G-1"></a>The Gray Paper's (G.1), (G.2), [in its place in the paper's words](./06-the-vrf-output.md#eq-G-1):

$$
\begin{align}
\overset{\backsim}{\mathbb{V}}_{k \in \overset{\backsim}{\mathbb{H}_{}}}^{m \in \mathbb{B}_{}}\left\langle c \in \mathbb{B}_{}\right\rangle \subset \mathbb{B}_{96} &\equiv \left\{\,x \;\middle\vert\; x \in \mathbb{B}_{96}, \text{verify}(k, c, m, x) = \top \,\right\} \tag{G.1} \\
\mathcal{Y}\left(s \in \overset{\backsim}{\mathbb{V}}_{k}^{m}\left\langle c\right\rangle\right) \in \mathbb{H}_{} &\equiv \text{output}(x \mid x \in \overset{\backsim}{\mathbb{V}}_{k}^{m}\left\langle c\right\rangle)_{ \dots 32} \tag{G.2}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-subset">$\subset$</span> | is a proper subset of | everything in the left is in the right, and the right has more |
| <span id="gk-top">$\top$</span> | top | true |
| <span id="gk-mid">$\mid$</span> | such that | in a sequence built from a rule: the items on the left, for every choice on the right |
| <span id="gk-interval">$_{x \dots y}$</span> | from x to y | the items from index x up to, not including, y |

</details>

:::

**Read it aloud.** "The Bandersnatch signatures by key k, on message m, in context c, a
subset of B 96, are defined as the set of x in B 96 such that verify of k, c, m and x is
true. Y of s is defined as the output of the signature, its first 32 bytes."

**In plain words.** (G.1) defines a signature by what checks: the valid ones are the
96-byte strings that `verify` accepts for this key, context and message. The paper leaves
`verify` to the Bandersnatch VRF specification it cites; your client calls a library for
it. (G.2) names the part that makes this a VRF: every valid signature carries an output,
32 bytes that depend only on the key and the context. The signer can't choose them, yet
anyone can check them. In the library JAM uses, ark-vrf, the output is a hash of the
signature's first 32 bytes, a point on the curve.

**On a real value.** Block 48's seal, H_S:

```text
H_S             96 bytes, starting bbd9 8b31 …
the point       its first 32 bytes, bbd9 8b31 … 7376 c2
SHA-512 of      "Bandersnatch_SHA-512_ELL2" ⌢ 03 ⌢ the point ⌢ 00
first 32 bytes  2752 42ae …: 𝒴(H_S), the id of slot 48's ticket
```

**In your client.** `vrfOutput` in `src/bandersnatch.ts`, written in
[8.6](./06-the-vrf-output.md#the-code); checking the signature itself, `checkSignature`,
in [8.9](./09-seals.md#the-code).

## (G.3) to (G.5): the ring root and ring proofs

::: gray-paper-eq G.3

<a id="ex-G-3"></a>The Gray Paper's (G.3), (G.4), (G.5), [in its place in the paper's words](./08-the-ring-root.md#eq-G-3):

$$
\begin{align}
\mathcal{O}\left(\left[\!\left[\overset{\backsim}{\mathbb{H}_{}}\right]\!\right]_{}\right) \in \overset{\circ}{\mathbb{B}_{}} &\equiv \text{commit}(\left[\!\left[\overset{\backsim}{\mathbb{H}_{}}\right]\!\right]_{}) \tag{G.3} \\
\overset{\circ}{\mathbb{V}}_{r \in \overset{\circ}{\mathbb{B}_{}}}^{m \in \mathbb{B}_{}}\left\langle c \in \mathbb{B}_{}\right\rangle \subset \mathbb{B}_{784} &\equiv \left\{\,x \;\middle\vert\; x \in \mathbb{B}_{784}, \text{verify}(r, c, m, x) = \top \,\right\} \tag{G.4} \\
\mathcal{Y}\left(p \in \overset{\circ}{\mathbb{V}}_{r}^{m}\left\langle c\right\rangle\right) \in \mathbb{H}_{} &\equiv \text{output}(x \mid x \in \overset{\circ}{\mathbb{V}}_{r}^{m}\left\langle c\right\rangle)_{ \dots 32} \tag{G.5}
\end{align}
$$

:::

**Read it aloud.** "O of a sequence of Bandersnatch keys, in B ring, is defined as the
commitment to that sequence. The ring proofs against root r, on message m, in context c, a
subset of B 784, are defined as the set of x in B 784 such that verify of r, c, m and x is
true. Y of p is defined as the output of the proof, its first 32 bytes."

**In plain words.** The same three ideas, for anonymous signatures:

- **(G.3)** O turns a list of keys into a ring root, a 144-byte commitment: one short
  value that stands for the whole list.
- **(G.4)** A ring proof is 784 bytes that `verify` accepts against the root: proof that
  *some* key in the list made it, without saying which.
- **(G.5)** Like a signature, a proof carries an output: a ticket's id.

The note under them: a key that isn't a point on the curve, such as an offender's zeros,
becomes the *padding point* in the ring.

**On a real value.** `enact-epoch-change-with-padding-1`, the ring of γ′_P:

```text
γ′_P's keys   9326  0000  ff71  1ecc  dee6  0746
              0000: the offender's zeros, not a point: the padding point
              1ecc: not a point on the curve either: the padding point
O(…)          a6c2 f622 …, 144 bytes: γ′_Z
```

And a proof's output, from `publish-tickets-no-mark-6`: the 784-byte proof starting
`33ac db76` has 𝒴 = `3434 1918 …`, the ticket's id.

**In your client.** `ringRoot` and `ringProofsHold` in `src/bandersnatch.ts`, written in
[8.8](./08-the-ring-root.md#the-code), with a library doing the curve's arithmetic.

## Say it in one breath

Safrole's state is four fields: the next validators, their ring root, this epoch's sealers
and the lottery (6.3 to 6.6). Validator sets are lists of 336-byte key sets, a multiple of
3 long (6.7 to 6.13), and at each new epoch they move along one, offenders zeroed and a new
ring root made (6.14, 6.15). Every block's seal is its author's VRF signature, matching the
slot's ticket or key (6.16, 6.17), and its entropy source signs the seal's output (6.18),
which every block hashes into η₀ (6.23). A new epoch is sealed by the lottery's winners,
outside in, if the lottery closed full just before, and by fallback keys drawn from η′₂
otherwise (6.25 to 6.27). The first block of an epoch announces the next validators, and
the block that closes a full lottery announces the winners (6.28, 6.29). While the lottery
is open a block may enter up to K anonymous tickets, sorted, new, and good enough to stay
among the best E (6.30 to 6.36). Underneath, a VRF signature or ring proof is whatever
`verify` accepts, and its output is randomness nobody could choose (G.1 to G.5).
