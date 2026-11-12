# The formulas, in plain words

[Part 6](./index.md)'s appendix: every formula this part quotes, explained. How the state
becomes one 32-byte root: (4.4) lists the state, (5.9) puts its root in every header, (D.1)
and (D.2) cut it into keys and values, (D.3) to (D.6) hash those into a trie. Last comes
Appendix E.1, the paper's other Merkle trees, which no lesson here builds. Real values: the
`fallback` trace's genesis state, 21 entries. Each formula: its key, then read aloud, in
plain words, on a real value, in your client. Notation: [Reading the Gray
Paper](../reading-the-gray-paper.md).

## (4.4): the state's seventeen parts

::: gray-paper-eq 4.4

<a id="ex-4-4"></a>The Gray Paper's (4.4), [in its place in the paper's words](../00-start/06-how-a-block-is-imported.md#eq-4-4):

$$
\begin{align}
\sigma &\equiv \left(\alpha, \beta, \theta, \gamma, \delta, \eta, \iota, \kappa, \lambda, \rho, \tau, \phi, \chi, \psi, \pi, \omega, \xi\right) \tag{4.4}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-thestate" class="gk-wrap">[$\sigma$](../symbols.md#state)</span> | sigma | the state: everything the chain remembers between blocks |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-authpool" class="gk-wrap">$\alpha$</span> | alpha | the authorizer pools: for each core, up to O = 8 authorizer hashes it accepts right now |
| <span id="gk-recent" class="gk-wrap">$\beta$</span> | beta | recent blocks: the last few blocks' hashes and roots, and the belt of accumulation outputs |
| <span id="gk-lastaccout" class="gk-wrap">$\theta$</span> | theta | the last block's accumulation outputs: which service yielded which hash |
| <span id="gk-safrole" class="gk-wrap">$\gamma$</span> | gamma | Safrole's state: the ticket lottery for who seals the next epoch's blocks |
| <span id="gk-accounts" class="gk-wrap">$\delta$</span> | delta | the service accounts: every service's code hash, balance, storage and preimages |
| <span id="gk-entropy" class="gk-wrap">$\eta$</span> | eta | entropy: four 32-byte values of randomness, the newest mixing in every block |
| <span id="gk-stagingset" class="gk-wrap">$\iota$</span> | iota | the next validators: keys queued to become active at the next epoch |
| <span id="gk-activeset" class="gk-wrap">$\kappa$</span> | kappa | the current validators: the keys of the V validators active this epoch |
| <span id="gk-previousset" class="gk-wrap">$\lambda$</span> | lambda | the last epoch's validators: kept to check what they signed before the change |
| <span id="gk-availassignments" class="gk-wrap">$\rho$</span> | rho | the pending reports: for each core, the report waiting to be made available, and when it came |
| <span id="gk-thetime" class="gk-wrap">$\tau$</span> | tau | the time: the latest block's timeslot |
| <span id="gk-authqueue" class="gk-wrap">$\phi$</span> | phi | the authorizer queues: for each core, Q = 80 authorizer hashes waiting to join its pool |
| <span id="gk-privileges" class="gk-wrap">$\chi$</span> | chi | the privileged services: who may manage, assign cores, set validators and accumulate for free |
| <span id="gk-disputes" class="gk-wrap">$\psi$</span> | psi | past judgments: the reports found good, bad or wonky, and the validators who lied |
| <span id="gk-activity" class="gk-wrap">$\pi$</span> | pi | the statistics: tallies per validator, per core and per service |
| <span id="gk-ready" class="gk-wrap">$\omega$</span> | omega | the ready queue: available reports waiting on others before they can accumulate |
| <span id="gk-accumulated" class="gk-wrap">$\xi$</span> | xi | the accumulated history: the packages accumulated in each of the last E slots |

</details>

:::

**Read it aloud.** "Sigma is defined as the tuple of alpha, beta, theta, gamma, delta, eta,
iota, kappa, lambda, rho, tau, phi, chi, psi, pi, omega and xi."

**In plain words.** The state is seventeen named parts, each a Greek letter, and nothing
else: everything the chain remembers between blocks is in one of them. The order here is
only a list. Appendix D numbers them differently, C(1) for α up to C(16) for θ, and δ, the
services, gets a key of its own for each service.

**On a real value.** The tiny genesis state:

```text
α, ϕ, β, γ, ψ, η, ι, κ, λ, ρ, τ, χ, π, ω, ξ, θ   16 entries, keys C(1) to C(16)
δ                                                one service, service 0: 5 entries,
                                                 its account and 4 items it keeps
                                                 16 + 5 = 21 entries
```

**In your client.** [19.2](../19-block-import/02-the-whole-state.md) reads all seventeen;
this part reads τ, η and κ ([6.3](./03-reading-the-state.md#the-code)).

## (5.9): the root in every header

::: gray-paper-eq 5.9

<a id="ex-5-9"></a>The Gray Paper's (5.9), [in its place in the paper's words](./01-the-state-trie.md#eq-5-9):

$$
\begin{equation}
\mathbf{H}_{R} \in \mathbb{H}_{} \,,\quad \mathbf{H}_{R} \equiv \mathcal{M}_\sigma\left(\sigma\right) \tag{5.9}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-H" class="gk-wrap">$\mathbf{H}$</span> | H | this block's header; 𝐇_T is its timeslot, 𝐇_P its parent's hash |
| <span id="gk--priorstateroot">$R$</span> | R | a header's prior state root: 𝐇_R is the root of the state before this block, 32 bytes |
| <span id="gk-in">[$\in$](../symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-hash">$\mathbb{H}$</span> | H | a 32-byte value, usually a hash |
| <span id="gk-merklizestate">$\mathcal{M}_\sigma\left(x\right)$</span> | M sigma of | the state root of: the 32-byte Merkle root of the whole state |

</details>

:::

**Read it aloud.** "H sub R is in H; H sub R is defined as M sigma of sigma."

**In plain words.** A header's `parent_state_root` is the Merkle root of the state, the
state as it was *before* this block, after its parent. One 32-byte value stands for every
byte of the state: two nodes with the same root have the same state.

**On a real value.** Block 1 of the `fallback` trace:

```text
σ                 the state before block 1: the tiny genesis state, 21 entries
ℳ_σ(σ)            0xd6e78dc0…4f6b3a0c, computed by (D.5) below
H_R of block 1    0xd6e78dc07a9ae915…4f6b3a0c: the same
```

**In your client.** `stateRoot` in `src/trie.ts` ([6.1](./01-the-state-trie.md#the-code));
`checkHeader` compares it with every block's `parent_state_root`
([19.4](../19-block-import/04-importing-a-block.md#the-code)).

## (D.1): C, the state-key constructor

::: gray-paper-eq D.1

<a id="ex-D-1"></a>The Gray Paper's (D.1), [in its place in the paper's words](./02-state-keys.md#eq-D-1):

$$
\begin{equation}
C\colon\left\{ \begin{aligned}
\mathbb{N}_{2^{8}} \cup \left(\mathbb{N}_{2^{8}}, \mathbb{N}_S\right) \cup \left(\mathbb{N}_S, \mathbb{B}_{}\right) &\to \mathbb{B}_{31} \\
i \in \mathbb{N}_{2^{8}} &\mapsto \left[i, 0, 0, \dots\right] \\
\left(i, s \in \mathbb{N}_S\right) &\mapsto \left[i, n_0, 0, n_1, 0, n_2, 0, n_3, 0, 0, \dots\right]\  \text{where } n = \mathcal{E}_{4}\left(s\right) \\
\left(s, h\right) &\mapsto \left[n_0, a_0, n_1, a_1, n_2, a_2, n_3, a_3, a_4, a_5, \dots, a_{26}\right]\  \text{where } n = \mathcal{E}_{4}\left(s\right), a = \mathcal{H}\left(h\right)
\end{aligned} \right. \tag{D.1}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-abracegroup">$\left\{ \begin{aligned}x\end{aligned} \right.$</span> | as follows | a brace grouping lines that hold together: for a function, its type on top, then what each input becomes |
| <span id="gk-Nbits">[$\mathbb{N}_{2^{x}}$](../symbols.md#naturals)</span> | N sub two to the n | the numbers that fit in n bits: ℕ_{2³²} is a u32 |
| <span id="gk-cup">$\cup$</span> | union | everything in either side |
| <span id="gk-serviceid" class="gk-wrap">$\mathbb{N}_S$</span> | N sub S | a service id: a whole number below 2³², 4 bytes |
| <span id="gk-blob">[$\mathbb{B}$](../symbols.md#blobs)</span> | B, or B sub n | bytes: any run of them; 𝔹ₙ exactly n of them |
| <span id="gk-to">[$\to$](../symbols.md#to)</span> | to | what goes in, to what comes out: A → B takes an A and gives a B |
| <span id="gk-mapsto">$\mapsto$</span> | maps to | what a function gives back for an input: x ↦ y says x becomes y |
| <span id="gk-sq">[$\left[x\right]$](../symbols.md#sequence)</span> | the sequence | a sequence written out item by item; [ ] is the empty one |
| <span id="gk-encode">[$\mathcal{E}\left(x\right)$](../symbols.md#encode)</span> | E of | the encoding of what's in the brackets: its bytes, by Appendix C's rules |
| <span id="gk-blake">$\mathcal{H}\left(x\right)$</span> | H of | the Blake2b hash of what's in the brackets: 32 bytes |

</details>

:::

**Read it aloud.** "C is a function from: a number below 2 to the 8; or a number below 2 to
the 8 and a service index; or a service index and bytes; to 31 bytes. i maps to i and then
zeros. i and s map to i, n zero, 0, n one, 0, n two, 0, n three, 0, then zeros, where n is E
sub 4 of s. s and h map to n zero, a zero, n one, a one, n two, a two, n three, a three,
then a four up to a twenty-six, where n is E sub 4 of s and a is the hash of h."

**In plain words.** Every key in the state is 31 bytes, made one of three ways, picked by
what you hand C. A number alone is a component's key: the number, then 30 zeros. A number
and a service is a service's account: 255, then the service's four bytes with a zero after
each. A service and some bytes is something the service keeps: the service's four bytes
take turns with the first four bytes of the hash of h, and 23 more bytes of that hash
follow. Hashing h makes the key 31 bytes, however long h was.

**On a real value.** Three keys, one per case. The first and last are the genesis
state's; service `0x04030201` is made up, as in [6.2](./02-state-keys.md)'s widget,
because the genesis state's only service is 0, all zero bytes:

```text
C(11)                  0b 00 00 … 00                τ's key: 11 is 0x0b, then 30 zeros
C(255, 0x04030201)     ff 01 00 02 00 03 00 04 00 00 … 00
                       255, then n = ℰ₄(s) = 01 02 03 04, a zero after each, then 22 zeros
C(0, h)                00 62 00 e5 00 5e 00 9a 78 3d ea 63 …
                       service 0 keeps a 50-byte preimage p, whose bytes spell
                       out NULL Authorizer:
                       h = ℰ₄(2³² − 2) ⌢ ℋ(p), a = ℋ(h) = 62 e5 5e 9a 78 3d ea 63 …;
                       n = 00 00 00 00 takes turns with a's first four bytes
```

**In your client.** `componentKey`, `accountKey` and `serviceItemKey` in `src/state.ts`
([6.2](./02-state-keys.md#the-code)).

## (D.2): T, the state as key-value pairs

::: gray-paper-eq D.2

<a id="ex-D-2"></a>The Gray Paper's (D.2), [in its place in the paper's words](./03-reading-the-state.md#eq-D-2):

$$
\begin{equation}
T(\sigma) \equiv \left\{ \begin{aligned}
&&C(1) &\mapsto \mathcal{E}_{}\left(\left[\left\updownarrow x\right.\! \;\middle\vert\; x \mathrel{\unicode{x2B40}} \alpha\right]\right) \;, \\
&&C(2) &\mapsto \mathcal{E}_{}\left(\phi\right) \;, \\
&&C(3) &\mapsto \mathcal{E}_{}\left(
\left\updownarrow\left[
\left(h, b, s, \mathcal{E}_{4}\left(t\right), \left\updownarrow\mathbf{p}\right.\!\right)
\;\middle\vert\;
\left(h, b, s, t, \mathbf{p}\right) \mathrel{\unicode{x2B40}} \beta_H
\right]\right.\!,
\mathcal{E}_{M}\left(\beta_B\right)
\right) \;, \\
&&C(4) &\mapsto \mathcal{E}_{}\left(
\left\updownarrow\gamma_P\right.\!,
\gamma_Z,
\left\{ \begin{aligned}
0\ &\text{if } \gamma_S \in \left[\!\left[\mathbb{T}\right]\!\right]_{\mathsf{E}}\\
1\ &\text{if } \gamma_S \in \left[\!\left[\overset{\backsim}{\mathbb{H}_{}}\right]\!\right]_{\mathsf{E}}\\
\end{aligned} \right\},
\gamma_S,
\left\updownarrow\gamma_A\right.\!
\right) \;, \\
&&C(5) &\mapsto \mathcal{E}_{}\left(
\left\updownarrow\left[x \in \psi_G\,\wr\,x\right]\right.\!,
\left\updownarrow\left[x \in \psi_B\,\wr\,x\right]\right.\!,
\left\updownarrow\left[x \in \psi_W\,\wr\,x\right]\right.\!,
\left\updownarrow\left[x \in \psi_O\,\wr\,x\right]\right.\!
\right) \;, \\
&&C(6) &\mapsto \mathcal{E}_{}\left(\eta\right) \;, \\
&&C(7) &\mapsto \mathcal{E}_{}\left(\left\updownarrow\iota\right.\!\right) \;, \\
&&C(8) &\mapsto \mathcal{E}_{}\left(\left\updownarrow\kappa\right.\!\right) \;, \\
&&C(9) &\mapsto \mathcal{E}_{}\left(\left\updownarrow\lambda\right.\!\right) \;, \\
&&C(10) &\mapsto \mathcal{E}_{}\left(
\left[
\mathord{\unicode{xBF}}\left(\mathbf{g}, \mathcal{E}_{4}\left(t\right)\right)
\;\middle\vert\;
\left(\mathbf{g}, t\right) \mathrel{\unicode{x2B40}} \rho
\right]
\right) \;, \\
&&C(11) &\mapsto \mathcal{E}_{4}\left(\tau\right) \;, \\
&&C(12) &\mapsto \mathcal{E}_{}\left(
\mathcal{E}_{4}\left(\chi_M, \chi_A, \chi_V, \chi_R\right),
\chi_Z
\right) \;, \\
&&C(13) &\mapsto \mathcal{E}_{}\left(
\left\updownarrow\left[\mathcal{E}_{4}\left(\mathbf{v}\right) \;\middle\vert\; \mathbf{v} \mathrel{\unicode{x2B40}} \pi_V\right]\right.\!,
\left\updownarrow\left[\mathcal{E}_{4}\left(\mathbf{v}\right) \;\middle\vert\; \mathbf{v} \mathrel{\unicode{x2B40}} \pi_L\right]\right.\!,
\pi_C,
\pi_S
\right) \;, \\
&&C(14) &\mapsto \mathcal{E}_{}\left(
\left[
\left\updownarrow\left[
\left(\mathbf{r}, \left\updownarrow\mathbf{d}\right.\!\right)
\;\middle\vert\;
\left(\mathbf{r}, \mathbf{d}\right) \mathrel{\unicode{x2B40}} \mathbf{i}
\right]\right.\!
\;\middle\vert\;
\mathbf{i} \mathrel{\unicode{x2B40}} \omega
\right]
\right) \;, \\
&&C(15) &\mapsto \mathcal{E}_{}\left(
\left[\left\updownarrow\mathbf{i}\right.\! \;\middle\vert\; \mathbf{i} \mathrel{\unicode{x2B40}} \xi\right]
\right) \;, \\
&&C(16) &\mapsto \mathcal{E}_{}\left(
\left\updownarrow\left[\left(\mathcal{E}_{4}\left(s\right), \mathcal{E}_{}\left(h\right)\right) \;\middle\vert\; \left(s, h\right) \mathrel{\unicode{x2B40}} \theta\right]\right.\!
\right) \;, \\
\forall \left(s \mapsto \mathbf{a}\right) \in \delta: &&C(255, s) &\mapsto \mathcal{E}_{}\left(
0,
\mathbf{a}_{c},
\mathcal{E}_{8}\left(
\mathbf{a}_{b},
\mathbf{a}_{g},
\mathbf{a}_{m},
\mathbf{a}_{o},
\mathbf{a}_{f}
\right),
\mathcal{E}_{4}\left(
\mathbf{a}_{i},
\mathbf{a}_{r},
\mathbf{a}_{a},
\mathbf{a}_{p}
\right)
\right) \;, \\
\forall \left(s \mapsto \mathbf{a}\right) \in \delta, \left(\mathbf{k} \mapsto \mathbf{v}\right) \in \mathbf{a}_{\mathbf{s}}:
&&C(s, \mathcal{E}_{4}\left(2^{32}-1\right) \frown \mathbf{k}) &\mapsto \mathbf{v} \;, \\
\forall \left(s \mapsto \mathbf{a}\right) \in \delta, \left(h \mapsto \mathbf{p}\right) \in \mathbf{a}_{\mathbf{p}}:
&&C(s, \mathcal{E}_{4}\left(2^{32}-2\right) \frown h) &\mapsto \mathbf{p} \;, \\
\forall \left(s \mapsto \mathbf{a}\right) \in \delta, \left(\left(h, l\right) \mapsto \mathbf{t}\right) \in \mathbf{a}_{\mathbf{l}}:
&&C(s, \mathcal{E}_{4}\left(l\right) \frown h) &\mapsto \mathcal{E}_{}\left(
\left\updownarrow\left[\mathcal{E}_{4}\left(x\right) \;\middle\vert\; x \mathrel{\unicode{x2B40}} \mathbf{t}\right]\right.\!
\right)
\end{aligned} \right. \tag{D.2}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-build">$\left\{ x \;\middle\vert\; y \right\}$</span> | for each, such that | built by a rule: the left-hand value, for every case the right-hand side allows (a set, or a sequence in order) |
| <span id="gk-var">[$\left\updownarrow x\right.\!$](../symbols.md#length-prefix)</span> | with its length | ↕x: x with its length in front, as a compact natural |
| <span id="gk-orderedin">$\mathrel{\unicode{x2B40}}$</span> | in order, from | each item of the sequence, in its order |
| <span id="gk-rh-headerhash">$h$</span> | h | a recent block's header hash |
| <span id="gk-rh-accoutlogsuperpeak">$b$</span> | b | the belt's super-peak just after that block: the vectors' `beefy_root` |
| <span id="gk-rh-stateroot">$s$</span> | s | a recent block's state root: the state just after it; zeros until the next block fills it in |
| <span id="gk-rh-timeslot">$t$</span> | t | a recent block's timeslot |
| <span id="gk-rh-reportedpackagehashes" class="gk-wrap">$\mathbf{p}$</span> | bold p | the packages a block reported: each package's hash, mapped to the root of the segments it exports |
| <span id="gk-recenthistory" class="gk-wrap">$\beta_H$</span> | beta sub H | the last H = 8 blocks: each one's header hash, state root, belt peak and reported packages |
| <span id="gk-mmrencode">$\mathcal{E}_{M}\left(x\right)$</span> | E sub M of | a Merkle mountain range's bytes: its count of peaks, then each peak as maybe (0, or 1 and the hash) |
| <span id="gk-accoutbelt" class="gk-wrap">$\beta_B$</span> | beta sub B | the accumulation output belt: one place per binary digit of the block count, each a peak or nothing |
| <span id="gk-pendingset" class="gk-wrap">$\gamma_P$</span> | gamma P | the pending validators: the key sets that become active at the next epoch |
| <span id="gk-epochroot" class="gk-wrap">$\gamma_Z$</span> | gamma Z | the ring root of the pending validators' Bandersnatch keys: 144 bytes a ticket's proof is checked against |
| <span id="gk-abracegroupboth">$\left\{ \begin{aligned}x\end{aligned} \right\}$</span> | whichever of | the value of the line inside whose condition holds |
| <span id="gk-sealtickets" class="gk-wrap">$\gamma_S$</span> | gamma S | the slot sealers: one entry for each of the epoch's E slots, a winning ticket or, in the fallback, a Bandersnatch key |
| <span id="gk-sequence">[$\left[\!\left[x\right]\!\right]$](../symbols.md#sequence)</span> | a sequence of | ⟦T⟧ is an array of T; a subscript is its length, :n at most n, n: at least n |
| <span id="gk-Cepochlen" class="gk-wrap">$\mathsf{E}$</span> | E | an epoch's length in slots: 600 on full, 12 on tiny |
| <span id="gk-safroleticket" class="gk-wrap">$\mathbb{T}$</span> | T | a ticket: a 32-byte id, and which of its maker's tries it was (its attempt) |
| <span id="gk-bskey" class="gk-wrap">$\overset{\backsim}{\mathbb{H}}$</span> | H tilde | a Bandersnatch public key: 32 bytes |
| <span id="gk-ticketaccumulator" class="gk-wrap">$\gamma_A$</span> | gamma A | the ticket lottery: the best tickets entered so far for the next epoch, at most E, lowest id first |
| <span id="gk-sqorderby">$\left[y\,\wr\,x\right]$</span> | sorted by | the sequence's items, sorted by the key on the right |
| <span id="gk-goodset" class="gk-wrap">$\psi_G$</span> | psi sub G | the good set: hashes of every report a verdict found valid |
| <span id="gk-badset" class="gk-wrap">$\psi_B$</span> | psi sub B | the bad set: hashes of every report a verdict found invalid |
| <span id="gk-wonkyset" class="gk-wrap">$\psi_W$</span> | psi sub W | the wonky set: hashes of every report whose verdict split, so nobody can tell |
| <span id="gk-offenders" class="gk-wrap">$\psi_O$</span> | psi O | the offenders: Ed25519 keys of validators found to have judged a report wrongly |
| <span id="gk-maybe">$\mathord{\unicode{xBF}}x$</span> | maybe | ¿x: the byte 0 if x is nothing (∅), or the byte 1 and then x |
| <span id="gk-aa-guarantee" class="gk-wrap">$\mathbf{g}$</span> | bold g | the guarantee a core's pending report came with: the report and its guarantors' signatures |
| <span id="gk-manager" class="gk-wrap">$\chi_M$</span> | chi sub M | the manager: the one service that may change the privileges and grant free storage |
| <span id="gk-assigners" class="gk-wrap">$\chi_A$</span> | chi sub A | the assigners: for each core, the service that may replace its authorizer queue |
| <span id="gk-delegator" class="gk-wrap">$\chi_V$</span> | chi sub V | the delegator: the one service that may set the next epoch's validator keys |
| <span id="gk-registrar" class="gk-wrap">$\chi_R$</span> | chi sub R | the registrar: the one service that may create services with the reserved low ids |
| <span id="gk-alwaysaccers" class="gk-wrap">$\chi_Z$</span> | chi sub Z | the always-accumulate services: each accumulates every block, with this much gas |
| <span id="gk-valstatsaccumulator" class="gk-wrap">$\pi_V$</span> | pi sub V | this epoch's validator tallies: one record of six counts per validator, still counting |
| <span id="gk-valstatsprevious" class="gk-wrap">$\pi_L$</span> | pi sub L | last epoch's validator tallies: one record of six counts per validator, finished |
| <span id="gk-corestats" class="gk-wrap">$\pi_C$</span> | pi sub C | the cores' tallies: one record per core, for this block only |
| <span id="gk-servicestats" class="gk-wrap">$\pi_S$</span> | pi sub S | the services' tallies: one record per service active in this block, for this block only |
| <span id="gk-forall">$\forall$</span> | for all | for every value: ∀c ∈ ℕ_C means for each core c |
| <span id="gk-kv">$\left(x \mapsto y\right)$</span> | k maps to v | a dictionary entry: key k, value v |
| <span id="gk-saX" class="gk-wrap">$\mathbf{a}$</span> | a | a service account: its code hash, balance, gas minimums, storage, preimages and the rest |
| <span id="gk-sa-codehash">$c$</span> | c | an account's code hash: names the preimage holding its code |
| <span id="gk-sa-minaccgas">$g$</span> | g | the least gas each work-item for this service must bring to accumulate |
| <span id="gk-sa-minmemogas">$m$</span> | m | the least gas each transfer to this service must bring |
| <span id="gk-sa-octets">$o$</span> | o | an account's octets: the bytes it keeps, with 81 per request and 34 per storage entry on top |
| <span id="gk-sa-gratis">$f$</span> | f | an account's gratis offset: deposit it is let off, taken from its minimum balance |
| <span id="gk-sa-items">$i$</span> | i | an account's items: 2 per request plus 1 per storage entry |
| <span id="gk-sa-created">$r$</span> | r | the slot the service was created at |
| <span id="gk-sa-lastacc">$a$</span> | a | the slot the service last accumulated at |
| <span id="gk-sa-parent">$p$</span> | p | the parent: the id of the service that created this one |
| <span id="gk-sa-storage" class="gk-wrap">$\mathbf{s}$</span> | s | an account's storage: keys to values, both any bytes, written by its own accumulate code |
| <span id="gk-concat" class="gk-wrap">[$\frown$](../symbols.md#concat)</span> | concatenate | join: the left sequence followed by the right |
| <span id="gk-sa-requests" class="gk-wrap">$\mathbf{l}$</span> | l | an account's requests: for each (hash, length) asked for, a history of up to 3 slots |

</details>

:::

**Read it aloud.** "T of sigma is defined as the dictionary: C of 1 maps to the encoding of
alpha's pools, each with its length; C of 2 to the encoding of phi;" and so on, one line
per component, then, for every service s and its account a, "C of 255 and s maps to the
encoding of 0, a's code hash, E sub 8 of its balance and four more numbers, E sub 4 of
four more", and its storage, its preimages and its requests under C of s and their keys.

**In plain words.** A table: on the left a key from (D.1), on the right the bytes stored
under it, an encoding by Appendix C's rules. Sixteen lines are the components, one entry
each. The last four lines make many entries, one per service, and one per item a service
keeps: a storage value, a preimage, or a request for one (the times it was requested and
provided, each in 4 bytes). The paper's note under it is the rule of thumb for reading
any line: a number in the state is fixed-width, unless it is a length or a discriminator.

**On a real value.** Three lines, from the state before block 3 of the `fallback` trace:

```text
C(11) ↦ ℰ₄(τ)         02 00 00 00            τ = 2, the slot of block 2: 4 bytes
C(6)  ↦ ℰ(η)          80 87 a0 0e …          four 32-byte hashes, no length: 128 bytes
C(8)  ↦ ℰ(↕κ)         06 ff 71 c6 c0 …       ↕: 6 validators, then 6 × 336 bytes:
                                             1 + 2,016 = 2,017 bytes
```

And two lines that show how empty things look: C(5), ψ, is four empty sets, each with a
length of 0, `00 00 00 00`; C(16), θ, is an empty list, `00`.

**In your client.** `readTime`, `readEntropy` and `readValidators` in `src/state.ts`
([6.3](./03-reading-the-state.md#the-code)); the other lines are read where their Parts
build them, and all of them in [19.2](../19-block-import/02-the-whole-state.md).

## (D.3) and (D.4): a branch, and a leaf

::: gray-paper-eq D.3

<a id="ex-D-3"></a>The Gray Paper's (D.3), (D.4), [in its place in the paper's words](./01-the-state-trie.md#eq-D-3):

$$
\begin{align}
B&\colon\left\{ \begin{aligned}
\!\left\lgroup\mathbb{H}_{}, \mathbb{H}_{}\right\rgroup\! &\to \mathbb{b}_{512}\\
\left(l, r\right) &\mapsto \left[0\right] \frown \text{bits}(l)_{1 \dots } \frown \text{bits}(r)
\end{aligned} \right. \tag{D.3} \\
L&\colon\left\{ \begin{aligned}
\!\left\lgroup\mathbb{B}_{31}, \mathbb{B}_{}\right\rgroup\! &\to \mathbb{b}_{512}\\
\left(k, v\right) &\mapsto \begin{cases}
\left[1, 0\right] \frown \text{bits}(\mathcal{E}_{1}\left(\left\vert v\right\vert\right))_{2 \dots } \frown \text{bits}(k) \frown \text{bits}(v) \frown \left[0, 0, \dots\right] &\text{if } \left\vert v\right\vert \le 32\\
\left[1, 1, 0, 0, 0, 0, 0, 0\right] \frown \text{bits}(k) \frown \text{bits}(\mathcal{H}\left(v\right)) &\text{otherwise}
\end{cases}
\end{aligned} \right. \tag{D.4}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-tuple">$\!\left\lgroup x\right\rgroup\!$</span> | the tuple of | a record: named fields, each with its type, like an object in JSON |
| <span id="gk-bitstring">$\mathbb{b}$</span> | b sub n | bits: a run of true-or-false values; a subscript is how many |
| <span id="gk-interval">$_{x \dots y}$</span> | from x to y | the items from index x up to, not including, y |
| <span id="gk-len">$\left\vert x\right\vert$</span> | the size of | \|x\|: how many items x has, or how many bytes |
| <span id="gk-le">$\le$</span> | at most | less than or equal to |

</details>

:::

**Read it aloud.** "B is a function from a pair of hashes to 512 bits: l and r map to the
bit 0, then the bits of l from the second on, then the bits of r. L is a function from 31
bytes and some bytes to 512 bits: k and v map to: the bits 1 and 0, then the bits of E sub
1 of the size of v from the third on, then the bits of k, then the bits of v, then zeros,
if the size of v is at most 32; otherwise, the bits 1, 1 and six 0s, then the bits of k,
then the bits of the hash of v."

**In plain words.** Every node of the trie is exactly 64 bytes, and its first bit says
which kind. A **branch** (D.3) is a 0, then its two children's hashes, the left one with its
first bit dropped to make room. A **leaf** (D.4) is a 1, then a second bit: 0 if the value
fits in 32 bytes, with its length in the first byte's last six bits, the 31-byte key, and
the value padded with zeros; 1 if it doesn't, with six zero bits, the key, and the value's
hash instead. Here "bits" are read highest first, the opposite of a bitfield's
([4.A](../04-blocks/gray-paper.md#c-9-bits-eight-to-a-byte)).

**On a real value.** τ's entry before block 3, a value of 4 bytes, makes this leaf:

```text
1 0 000100               the first byte: leaf, value inside, length 4 (0b000100)
                         0b1000_0100 = 0x84: 1 byte
0b 00 … 00               the key, C(11): 31 bytes
02 00 00 00 00 … 00      the value, 4 bytes, padded with 28 zeros: 32 bytes
                         1 + 31 + 32 = 64 bytes; its hash 0x17379ec7…
```

Service 0's account has 89 bytes of value, too big to fit, so its leaf holds a hash:

```text
1 1 000000               leaf, value hashed: 0b1100_0000 = 0xc0, 1 byte
ff 00 … 00               the key, C(255, 0): 31 bytes
aa b5 94 3c …            ℋ(value), the hash of its 89 bytes: 32 bytes
                         64 bytes; its hash 0xf801d491…
```

And the top of the genesis trie is a branch. Every component's key starts with a 0 bit
and the account's with a 1 (255 is `0b1111_1111`), so the left side holds 20 entries and
the right side the account's leaf alone:

```text
0                        a branch
4f f6 ef 41 … f8 e3      the left side's hash, M of the 20 entries, first bit dropped:
                         it was 0 already (0x4f is 0b0100_1111), so no byte changes
f8 01 d4 91 … 6c 7a      the right side's hash: the account's leaf, all 32 bytes
                         64 bytes; its hash is the root, 0xd6e78dc0…
```

Had the left hash started `0xcb` (`0b1100_1011`), the branch would start `0x4b`: the
dropped bit is simply lost, and that's safe because the branch's own 0 takes its place.

**In your client.** `leaf` and `branch` in `src/trie.ts` ([6.1](./01-the-state-trie.md#the-code)).

## (D.5) and (D.6): M, the root

::: gray-paper-eq D.5

<a id="ex-D-5"></a>The Gray Paper's (D.5), (D.6), [in its place in the paper's words](./01-the-state-trie.md#eq-D-5):

$$
\begin{align}
\mathcal{M}_\sigma\left(\sigma\right) &\equiv M(\left\{\,\left(\text{bits}(k) \mapsto \left(k, v\right)\right) \;\middle\vert\; \left(k \mapsto v\right) \in T(\sigma) \,\right\}) \tag{D.5} \\
M(d: \left\langle\!\left\vert \mathbb{b}_{}\to\!\left\lgroup\mathbb{B}_{31}, \mathbb{B}_{}\right\rgroup\!\right\vert\!\right\rangle) &\equiv \begin{cases}
\mathbb{H}_{0} &\text{if } \left\vert d\right\vert = 0\\
\mathcal{H}\left(\text{bits}^{-1}(L(k, v))\right) &\text{if } \mathcal{V}\left(d\right) = \left\{\, \left(k, v\right) \,\right\}\\
\mathcal{H}\left(\text{bits}^{-1}(B(M(l), M(r)))\right) &\text{otherwise}\\
\quad \text{where } \forall b, p: \left(b \mapsto p\right) \in d \Leftrightarrow \left(b_{1 \dots } \mapsto p\right) \in \begin{cases}
l &\text{if } b_0 = 0 \\
r &\text{if } b_0 = 1
\end{cases}
\end{cases} \tag{D.6}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-set">$\left\{\,x\,\right\}$</span> | the set of | a set: values with no order and no repeats |
| <span id="gk-dictionary">$\left\langle\!\left\vert x\to y\right\vert\!\right\rangle$</span> | a dictionary from K to V | a map: keys of type K, each with one value of type V |
| <span id="gk-zerohash" class="gk-wrap">$\mathbb{H}_{0}$</span> | H zero | 32 zero bytes: a placeholder where a hash isn't known yet |
| <span id="gk-values">$\mathcal{V}\left(x\right)$</span> | V of | a dictionary's (or sequence's) values |
| <span id="gk-Leftrightarrow">$\Leftrightarrow$</span> | exactly when | if and only if: both sides are true together, or false together |

</details>

:::

**Read it aloud.** "M sigma of sigma is defined as M of the set that maps the bits of k to
the pair k, v, for each k mapping to v in T of sigma. M of d, a dictionary from bit strings
to pairs of 31 bytes and bytes, is defined as: the zero hash, if d is empty; the hash of
the leaf of k and v, if d holds just the one pair k, v; otherwise, the hash of the branch
of M of l and M of r, where every entry of d whose first bit is 0 goes into l, and every
one whose first bit is 1 into r, each with that bit taken off."

**In plain words.** (D.5) files every entry by its key's bits. (D.6) is the root of a set of
entries, one recursive rule with three cases: nothing at all is 32 zero bytes; one entry is
the hash of its leaf (D.4), wherever it sits; more than one, and they split on their next
bit, each half gets its own root the same way, and the two roots make a branch (D.3), whose
hash is the answer. A key's bits are its route down the trie, and an entry becomes a leaf as
soon as no other key shares its route.

**On a real value.** The genesis state's 21 entries, from the top:

```text
21 entries                more than one: split on bit 0
bit 0 = 0: 20 entries     every component, and service 0's four items: split again,
                          deeper, until each is alone: M = 0x4ff6ef41…
bit 0 = 1: 1 entry        the account: one entry, so M = ℋ(its leaf) = 0xf801d491…
the root                  ℋ(B(0x4ff6…, 0xf801…)) = 0xd6e78dc0…, block 1's H_R
```

In all it takes 21 leaves and 22 branches, 55 hashes with the 12 values over 32 bytes,
as [6.1](./01-the-state-trie.md#what-the-gray-paper-says) counts.

**In your client.** `merkle` and `stateRoot` in `src/trie.ts` ([6.1](./01-the-state-trie.md#the-code)).

## The rest of Appendix E.1: the paper's other Merkle trees

Appendix D's trie is not the paper's only Merkle tree. Appendix E.1 defines two more, over a
plain list of items rather than a dictionary of keys, with a node function N they share.
None is built in this part: the well-balanced tree, M_B, is built with Keccak in
[17.11](../17-accumulation/11-what-a-service-yields.md#the-code), for a block's
accumulation outputs; the constant-depth tree, M, makes a work-package's segment root,
which the guarantors compute in-core and the chain only ever carries as a hash
([3.3](../03-work-and-reports/03-a-work-report.md)). They are quoted here, beside the trie
they are cousins of, and explained on a small made-up list: the three one-byte items
`61`, `62` and `63` (the letters a, b and c), hashed with Blake2b, every hash real.

::: gray-paper E.1 1-4

#### Appendix E.1 Binary Merkle Trees {#gp-E-1}

<a id="gp-E-1-p1"></a>The Merkle tree is a cryptographic data structure yielding a hash <abbr class="gp-term" title="a short hash that stands for some data, so the data can be checked against it later">commitment</abbr> to a specific sequence of values. It provides $O(N)$ computation and $O(\log(N))$ proof size for inclusion. This *well-balanced* formulation ensures that the maximum depth of any leaf is minimal and that the number of leaves at that depth is also minimal.

<a id="gp-E-1-p2"></a>The underlying function for our Merkle trees is the *node* function $N$, which accepts some sequence of blobs of some length $n$ and provides either such a blob back or a hash:

<a id="gp-E-1-p3"></a><a id="eq-E-1"></a>

$$
\begin{equation}
N\colon\left\{ \begin{aligned}
\!\left\lgroup\left[\!\left[\mathbb{B}_{n}\right]\!\right]_{}, \mathbb{B}_{} \to \mathbb{H}_{}\right\rgroup\! &\to \mathbb{B}_{n} \cup \mathbb{H}_{} \\
\left(\mathbf{v}, H\right) &\mapsto \begin{cases}
\mathbb{H}_{0} &\text{if } \left\vert\mathbf{v}\right\vert = 0 \\
\mathbf{v}_0 &\text{if } \left\vert\mathbf{v}\right\vert = 1 \\
H(\texttt{\$node} \frown N(\mathbf{v}_{\dots\left\lceil{}^{\left\vert\mathbf{v}\right\vert}\!/_{2}\right\rceil}, H) \frown N(\mathbf{v}_{\left\lceil{}^{\left\vert\mathbf{v}\right\vert}\!/_{2}\right\rceil\dots}, H)) &\text{otherwise}
\end{cases}
\end{aligned} \right. \tag{E.1}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-token">$\texttt{x}$</span> | the string | a name in typewriter type: an instruction's or helper's name, or fixed bytes written as text: the ASCII bytes of its words; the dollar sign in front only marks them as text and is not one of the bytes |
| <span id="gk-ceil">$\left\lceil x\right\rceil$</span> | ceiling of | rounded up to a whole number |
| <span id="gk-nicefrac">${}^{x}\!/_{y}$</span> | over | a fraction: the top divided by the bottom |

</details>

<a id="gp-E-1-p4"></a>The astute reader will realize that if our $\mathbb{B}_{n}$ happens to be equivalent $\mathbb{H}_{}$ then this function will always evaluate into $\mathbb{H}_{}$. That said, for it to be secure care must be taken to ensure there is no possibility of preimage collision. For this purpose we include the hash prefix $\texttt{\$node}$ to minimize the chance of this; simply ensure any items are hashed with a different prefix and the system can be considered secure.

:::

### (E.1): N, a node

**Read it aloud.** "N is a function from a sequence of n-byte blobs and a hash function H,
to an n-byte blob or a hash. v and H map to: the zero hash, if v is empty; v sub 0, if v
has one item; otherwise, H of: the bytes of node, then N of v up to the half, rounded up,
then N of v from the half on."

**In plain words.** A list's tree, built top down. No items is 32 zero bytes. One item is
that item itself, not hashed. More: split the list in two, the left half the bigger when
it is odd, find each half's node the same way, and hash the word `node` with the two. The
word `node` in front keeps a node's hash from ever being mistaken for an item's hash, the
paper's next paragraph says; a different word goes in front of items (E.7's `leaf`).

**On a real value.** N of [a, b, c]:

```text
⌈3 / 2⌉ = 2                 left half [a, b], right half [c]
N([c]) = 63                 one item: itself
N([a, b]) = ℋ("node" ⌢ 61 ⌢ 62) = 0xd8e358d4…    two items: split, each is itself, hash them
N([a, b, c]) = ℋ("node" ⌢ d8e3… ⌢ 63) = 0x019edc44…
```

**In your client.** `node` in `src/belt.ts`, with Keccak
([17.11](../17-accumulation/11-what-a-service-yields.md#the-code)).

::: gray-paper E.1 5-7

#### Appendix E.1 Binary Merkle Trees, continued

<a id="gp-E-1-p5"></a>We also define the *trace* function $T$, which returns each opposite node from top to bottom as the tree is navigated to arrive at some leaf corresponding to the item of a given index into the sequence. It is useful in creating justifications of data inclusion.

<a id="gp-E-1-p6"></a><a id="eq-E-2"></a>

$$
\begin{equation}
T\colon\left\{ \begin{aligned}
\!\left\lgroup\left[\!\left[\mathbb{B}_{n}\right]\!\right]_{}, \mathbb{N}_{\left\vert\mathbf{v}\right\vert}, \mathbb{B}_{} \to \mathbb{H}_{}\right\rgroup\!\ &\to \left[\!\left[\mathbb{B}_{n} \cup \mathbb{H}_{}\right]\!\right]_{}\\
\left(\mathbf{v}, i, H\right) &\mapsto \begin{cases}
\left[N(P^\bot(\mathbf{v}, i), H)\right] \frown T(P^\top(\mathbf{v}, i), i - P_I(\mathbf{v}, i), H) &\text{if } \left\vert\mathbf{v}\right\vert > 1\\
\left[\right] &\text{otherwise}\\
\begin{aligned}
\quad  \text{where } P^s(\mathbf{v}, i) &\equiv \begin{cases}
\mathbf{v}_{\dots\left\lceil{}^{\left\vert\mathbf{v}\right\vert}\!/_{2}\right\rceil} &\text{if } (i < \left\lceil{}^{\left\vert\mathbf{v}\right\vert}\!/_{2}\right\rceil) = s\\
\mathbf{v}_{\left\lceil{}^{\left\vert\mathbf{v}\right\vert}\!/_{2}\right\rceil\dots} &\text{otherwise}
\end{cases}\\[4pt]
\quad  \text{and } P_I(\mathbf{v}, i) &\equiv \begin{cases}
0 &\text{if } i < \left\lceil{}^{\left\vert\mathbf{v}\right\vert}\!/_{2}\right\rceil \\
\left\lceil{}^{\left\vert\mathbf{v}\right\vert}\!/_{2}\right\rceil &\text{otherwise}
\end{cases}\\
\end{aligned}
\end{cases}\\
\end{aligned} \right. \tag{E.2}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-Nmax">[$\mathbb{N}_{x}$](../symbols.md#naturals)</span> | N sub n | the whole numbers below n: ℕ_C is a core index, 0 to C − 1 |
| <span id="gk-bot">$\bot$</span> | bottom | false, the no of a yes-or-no value |
| <span id="gk-top">$\top$</span> | top | true |

</details>

<a id="gp-E-1-p7"></a>From this we define our other <abbr class="gp-term" title="hashing many values down to one root through a tree, so one 32-byte hash stands for them all">Merklization</abbr> functions.

:::

### (E.2): T, the proof of one item

**Read it aloud.** "T is a function from a sequence of blobs, an index i into it, and a hash
function, to a sequence of blobs or hashes. v, i and H map to: the sequence holding N of P
bottom of v and i, then T of P top of v and i, at i minus P sub I of v and i, if v has more
than one item; otherwise, the empty sequence. Where P sub s of v and i is the first half of
v if whether i is in the first half equals s, else the second half; and P sub I of v and i
is 0 if i is in the first half, else the size of the first half."

**In plain words.** To prove that item i is in the list, give the item and, at every level
from the top down, the node of the half it is *not* in. P⊤ is the half holding i, P⊥ the
other one, and P_I moves i to its place inside the half it is in. Whoever has the root can
rebuild it from the item and those nodes, without the rest of the list.

**On a real value.** The proof of c, item 2, in [a, b, c]:

```text
i = 2, ⌈3 / 2⌉ = 2          2 is not below 2: c is in the right half
P⊥ = [a, b]                 the other half: its node, 0xd8e358d4…, goes in the proof
P⊤ = [c], i = 2 − 2 = 0     go on in [c]: one item, so stop
T([a, b, c], 2) = [0xd8e358d4…]
check                       ℋ("node" ⌢ d8e3… ⌢ 63) = 0x019edc44…: the root
```

**In your client.** Not built: the chain never asks your client for a proof.

::: gray-paper E.1.1

#### Appendix E.1.1 Well-Balanced Tree {#gp-E-1-1}

<a id="gp-E-1-1-p1"></a>We define the well-balanced binary Merkle function as $\mathcal{M}_B$:

<a id="gp-E-1-1-p2"></a><a id="eq-E-3"></a>

$$
\begin{equation}
\mathcal{M}_B\colon \left\{ \begin{aligned}
\!\left\lgroup\left[\!\left[\mathbb{B}_{}\right]\!\right]_{}, \mathbb{B}_{} \to \mathbb{H}_{}\right\rgroup\! &\to \mathbb{H}_{} \\
\left(\mathbf{v}, H\right) &\mapsto \begin{cases}
H(\mathbf{v}_0) &\text{if } \left\vert\mathbf{v}\right\vert = 1 \\
N(\mathbf{v}, H) &\text{otherwise}
\end{cases} \\
\end{aligned} \right. \tag{E.3}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-fnmerklizewb" class="gk-wrap">$\mathcal{M}_B$</span> | M sub B | the well-balanced Merkle root: one hash for a list, made by halving it until single items are left |

</details>

<a id="gp-E-1-1-p3"></a>This is suitable for creating proofs on data which is not much greater than 32 <abbr class="gp-term" title="bytes: 8 bits each">octets</abbr> in length since it avoids hashing each item in the sequence. For sequences with larger data items, it is better to hash them beforehand to ensure proof-size is minimal since each proof will generally contain a data item.

<a id="gp-E-1-1-p4"></a>Note: In the case that no hash function argument $H$ is supplied, we may assume Blake 2b.

:::

### (E.3): M_B, the well-balanced root

**Read it aloud.** "M sub B is a function from a sequence of blobs and a hash function to a
hash. v and H map to H of v sub 0, if v has one item; otherwise, N of v and H."

**In plain words.** The well-balanced root is N, with one change: a list of one item is
hashed, so the root is always a 32-byte hash, however short its one item. With no H given,
the hash is Blake2b. Items are joined as they are, not hashed first, so it suits items not
much bigger than a hash, as the paper says.

**On a real value.**

```text
M_B([a])          = ℋ(61) = 0x8928aae6…           one item: hashed
M_B([a, b, c])    = N([a, b, c]) = 0x019edc44…     more: N, as above
```

**In your client.** `wellBalancedRoot` in `src/belt.ts`, with Keccak
([17.11](../17-accumulation/11-what-a-service-yields.md#the-code)).

::: gray-paper E.1.2 1-2

#### Appendix E.1.2 Constant-Depth Tree {#gp-E-1-2}

<a id="gp-E-1-2-p1"></a>We define the constant-depth binary Merkle function as $\mathcal{M}$. We define two corresponding functions for working with subtree pages, $\mathcal{J}_{x}$ and $\mathcal{L}_{x}$. The latter provides a single page of leaves, themselves hashed, prefixed data. The former provides the Merkle path to a single page. Both assume size-aligned pages of size $2^x$ and accept page indices.

<a id="gp-E-1-2-p2"></a><a id="eq-E-4"></a><a id="eq-E-5"></a><a id="eq-E-6"></a>

$$
\begin{align}
\mathcal{M}&\colon \left\{ \begin{aligned}
\!\left\lgroup\left[\!\left[\mathbb{B}_{}\right]\!\right]_{}, \mathbb{B}_{} \to \mathbb{H}_{}\right\rgroup\! &\to \mathbb{H}_{}\\
\left(\mathbf{v}, H\right) &\mapsto N(C(\mathbf{v}, H), H)
\end{aligned} \right. \tag{E.4} \\
\mathcal{J}_{x}&\colon \left\{ \begin{aligned}
\!\left\lgroup\left[\!\left[\mathbb{B}_{}\right]\!\right]_{}, \mathbb{N}_{\left\vert\mathbf{v}\right\vert}, \mathbb{B}_{} \to \mathbb{H}_{}\right\rgroup\! &\to \left[\!\left[\mathbb{H}_{}\right]\!\right]_{}\\
\left(\mathbf{v}, i, H\right) &\mapsto T(C(\mathbf{v}, H), 2^xi, H)_{\dots\max(0, \left\lceil\log_2(\max(1, \left\vert\mathbf{v}\right\vert)) - x\right\rceil)}
\end{aligned} \right. \tag{E.5} \\
\mathcal{L}_{x}&\colon \left\{ \begin{aligned}
\!\left\lgroup\left[\!\left[\mathbb{B}_{}\right]\!\right]_{}, \mathbb{N}_{\left\vert\mathbf{v}\right\vert}, \mathbb{B}_{} \to \mathbb{H}_{}\right\rgroup\! &\to \left[\!\left[\mathbb{H}_{}\right]\!\right]_{}\\
\left(\mathbf{v}, i, H\right) &\mapsto \left[H(\texttt{\$leaf} \frown l) \;\middle\vert\; l \mathrel{\unicode{x2B40}} \mathbf{v}_{2^xi \dots \min(2^xi+2^x, \left\vert\mathbf{v}\right\vert)}\right]
\end{aligned} \right. \tag{E.6}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-fnmerklizecd" class="gk-wrap">$\mathcal{M}$</span> | M | the constant-depth binary Merkle root function |
| <span id="gk-fnmerklejustsubpath">$\mathcal{J}_{x}$</span> | J sub x | the proof for one page of 2^x leaves in a constant-depth tree: the hashes beside its path, from the root down to the page |
| <span id="gk-max">$\max$</span> | max of | the largest of the values in the brackets |
| <span id="gk-log">$\log$</span> | log | the logarithm: log₂ n is the power of 2 that gives n, so log₂ 4,096 is 12 |
| <span id="gk-fnmerklesubtreepage">$\mathcal{L}_{x}$</span> | L sub x | one page of 2^x leaves of a constant-depth tree: each item, hashed with the ASCII bytes of the word leaf in front |
| <span id="gk-min">$\min$</span> | the least of | the smallest of the values given; min(24, j : …) is the smallest j that fits, but no more than 24 |

</details>

:::

### (E.4) to (E.6): M, the constant-depth root, and its pages

**Read it aloud.** "M is a function from a sequence of blobs and a hash function to a hash:
v and H map to N of C of v and H, and H. J sub x maps v, i and H to T of C of v and H, at 2
to the x times i, and H, its first items, as many as the ceiling of log 2 of the larger of 1
and the size of v, minus x, or none. L sub x maps v, i and H to the sequence of H of the
bytes of leaf then l, for each l in order in v, from 2 to the x times i, up to 2 to the x
times i plus 2 to the x, or the end of v."

**In plain words.** The constant-depth root first makes the list a power of two long, every
item hashed (C, in (E.7) below), then takes N of that, so every item sits at the same depth.
Its proofs come by pages of 2^x items: L_x gives the page's hashed leaves, J_x the nodes
beside the path from the root down to the page. Together they prove a whole page at once,
which is how a work-package's exported segments are proven.

**On a real value.**

```text
C([a, b, c]) = [ℋ("leaf" ⌢ 61), ℋ("leaf" ⌢ 62), ℋ("leaf" ⌢ 63), ℍ₀]
             = [0x9d65b687…, 0xb733ce6b…, 0xbe434105…, 0x0000…]   padded to 4
N of those   = ℋ("node" ⌢ 0x3a92935c… ⌢ 0x0f10bc9b…) = 0x07702e81…
             where 0x3a92… = ℋ("node" ⌢ 9d65… ⌢ b733…), 0x0f10… = ℋ("node" ⌢ be43… ⌢ 0000…)
M([a, b, c]) = 0x07702e81…
L₀([a, b, c], 2) = [0xbe434105…]                c's page, of 2⁰ = 1 leaf
J₀([a, b, c], 2) = [0x3a92935c…, 0x0000…]       ⌈log₂ 3⌉ − 0 = 2 nodes: the left half, then ℍ₀
```

**In your client.** Not built: segment roots are the guarantors' work.

::: gray-paper E.1.2 3-6

#### Appendix E.1.2 Constant-Depth Tree, continued

<a id="gp-E-1-2-p3"></a>For the latter <abbr class="gp-term" title="a proof that some data is inside a Merkle root: the sibling hashes on the way up">justification</abbr> $\mathcal{J}_{x}$ to be acceptable, we must assume the target observer also knows not merely the value of the item at the given index, but also all other leaves within its $2^x$ size subtree, given by $\mathcal{L}_{x}$.

<a id="gp-E-1-2-p4"></a>As above, we may assume a default value for $H$ of Blake 2b.

<a id="gp-E-1-2-p5"></a>For justifications and Merkle root calculations, a constancy preprocessor function $C$ is applied which hashes all data items with a fixed prefix “leaf” and then pads the overall size to the next power of two with the zero hash $\mathbb{H}_{0}$:

<a id="gp-E-1-2-p6"></a><a id="eq-E-7"></a>

$$
\begin{equation}
C\colon\left\{ \begin{aligned}
\!\left\lgroup\left[\!\left[\mathbb{B}_{}\right]\!\right]_{}, \mathbb{B}_{} \to \mathbb{H}_{}\right\rgroup\! &\to \left[\!\left[\mathbb{H}_{}\right]\!\right]_{}\\
\left(\mathbf{v}, H\right) &\mapsto \mathbf{v}' \  \text{where } \left\{ \;\begin{aligned}
\left\vert\mathbf{v}'\right\vert &= 2^{\left\lceil\log_2(\max(1, \left\vert\mathbf{v}\right\vert))\right\rceil}\\
\mathbf{v}'_{i} &= \begin{cases}
H(\texttt{\$leaf} \frown \mathbf{v}_{i}) &\text{if } i < \left\vert\mathbf{v}\right\vert\\
\mathbb{H}_{0} &\text{otherwise} \\
\end{cases}
\end{aligned} \right.
\end{aligned} \right. \tag{E.7}
\end{equation}
$$

:::

### (E.7): C, every item hashed, padded to a power of two

**Read it aloud.** "C is a function from a sequence of blobs and a hash function to a
sequence of hashes. v and H map to v prime, where the size of v prime is 2 to the ceiling of
log 2 of the larger of 1 and the size of v, and v prime at i is H of the bytes of leaf then
v at i, if i is below the size of v, otherwise the zero hash."

**In plain words.** Hash each item with the word `leaf` in front, then fill up with zero
hashes to the next power of two: 3 items become 4, 5 become 8. That is what keeps the tree's
depth the same for every item.

**On a real value.** C([a, b, c]) is the first line above: three hashed leaves and one ℍ₀,
4 = 2^⌈log₂ 3⌉ in all.

**In your client.** Not built, with M.

## Say it in one breath

The state is seventeen parts (4.4), and every header carries the root of the state before it
(5.9). To make that root, C gives every entry a 31-byte key (D.1) and T says what bytes sit
under each (D.2); the entries are filed in a binary trie by their keys' bits, every node 64
bytes, a branch two hashes (D.3), a leaf a key and its value or its value's hash (D.4); and
the root is nothing for nothing, a leaf's hash for one entry, or a branch's hash over the
two halves' roots (D.5, D.6). Appendix E's trees do the same for a plain list: N joins
halves under the word `node` (E.1), T proves one item (E.2), M_B is the well-balanced root
(E.3), and M the constant-depth one, every item hashed under `leaf` and padded to a power of
two (E.4 to E.7).
