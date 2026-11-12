# The formulas, explained

[Part 10](./index.md)'s appendix: every formula of §10, *Disputes, Verdicts and Judgments*,
explained. Eleven blocks, (10.1) to (10.19): what the state keeps, what a block carries, how
a verdict is counted and recorded, what it does to the cores, who is named an offender, and
the rules of order. Each formula: its key, then read aloud, what it means, on a real value,
in your client. Notation: [Reading the Gray Paper](../reading-the-gray-paper.md).

Most real values here come from one vector, `progress_invalidates_avail_assignments-1` on
tiny. It has six validators, slot τ = 0 (epoch 0), and two reports pending on the two cores.
Its block judges both, one good (`0xa78b…`) and one bad (`0xf907…`). It names the bad one's
two guarantors as culprits, and one validator who voted against the good one as a fault.

## (10.1): what the state keeps

::: gray-paper-eq 10.1

<a id="ex-10-1"></a>The Gray Paper's (10.1), [in its place in the paper's words](./01-votes-and-verdicts.md#eq-10-1):

$$
\begin{equation}
\psi \equiv \left(\psi_G, \psi_B, \psi_W, \psi_O\right) \tag{10.1}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-disputes" class="gk-wrap">$\psi$</span> | psi | past judgments: the reports found good, bad or wonky, and the validators who lied |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-goodset" class="gk-wrap">$\psi_G$</span> | psi sub G | the good set: hashes of every report a verdict found valid |
| <span id="gk-badset" class="gk-wrap">$\psi_B$</span> | psi sub B | the bad set: hashes of every report a verdict found invalid |
| <span id="gk-wonkyset" class="gk-wrap">$\psi_W$</span> | psi sub W | the wonky set: hashes of every report whose verdict split, so nobody can tell |
| <span id="gk-offenders" class="gk-wrap">$\psi_O$</span> | psi O | the offenders: Ed25519 keys of validators found to have judged a report wrongly |

</details>

:::

**Read it aloud.** "Psi is defined as the four-tuple psi-G, psi-B, psi-W, psi-O."

**What it means.** ψ, the past judgments, is four sets that only ever grow. Three hold the
hashes of reports: those judged good (ψ_G), bad (ψ_B) and wonky (ψ_W). The fourth holds the
Ed25519 keys of every validator found guilty, the offenders (ψ_O). They are written sorted,
as every set in the state is.

**On a real value.** Before the block, all four are empty. After it:

```text
ψ_G   [0xa78b…]                         the report judged good
ψ_B   [0xf907…]                         the report judged bad
ψ_W   []                                no split verdict this block
ψ_O   [0x4418…, 0xad93…, 0xf30a…]       two culprits and a fault, sorted
```

**In your client.** `PastJudgements` in `src/disputes.ts`, ψ as a record and so C(5)'s
codec too, written in [10.1](./01-votes-and-verdicts.md#the-code).

## (10.2): what a block carries

::: gray-paper-eq 10.2

<a id="ex-10-2"></a>The Gray Paper's (10.2), [in its place in the paper's words](./01-votes-and-verdicts.md#eq-10-2):

$$
\begin{equation}
\begin{aligned}
\mathbf{E}_D &\equiv \!\left\lgroup\mathbf{E}_V, \mathbf{E}_C, \mathbf{E}_F\right\rgroup\! \\
\text{where } \mathbf{E}_V &\in \left[\!\left[\!\left\lgroup
\mathbb{H}_{},
\left\lfloor\frac{\tau}{\mathsf{E}}\right\rfloor - \mathbb{N}_2,
\left[\!\left[\!\left\lgroup
\left\{\,\top, \bot\,\right\},
\mathbb{N},
\bar{\mathbb{V}}
\right\rgroup\!\right]\!\right]_{}
\right\rgroup\!\right]\!\right]_{:\mathsf{N}_V}\\
\text{and } \mathbf{E}_C &\in \left[\!\left[\!\left\lgroup\mathbb{H}_{}, \bar{\mathbb{H}_{}}, \bar{\mathbb{V}}\right\rgroup\!\right]\!\right]_{:\mathsf{N}_O} \\
\text{and } \mathbf{E}_F &\in \left[\!\left[\!\left\lgroup\mathbb{H}_{}, \left\{\,\top,\bot\,\right\}, \bar{\mathbb{H}_{}}, \bar{\mathbb{V}}\right\rgroup\!\right]\!\right]_{:\mathsf{N}_O}
\end{aligned} \tag{10.2}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-xtdisputes" class="gk-wrap">$\mathbf{E}_D$</span> | E sub D | the disputes bag: verdicts, culprits and faults |
| <span id="gk-tuple">$\!\left\lgroup x\right\rgroup\!$</span> | the tuple of | a record: named fields, each with its type, like an object in JSON |
| <span id="gk-xtverdicts" class="gk-wrap">$\mathbf{E}_V$</span> | E sub V | the block's verdicts: each a report's hash, an epoch, and the judges' signed votes |
| <span id="gk-xtculprits" class="gk-wrap">$\mathbf{E}_C$</span> | E sub C | the block's culprits: guarantors of a bad report, each with the guarantee they signed |
| <span id="gk-xtfaults" class="gk-wrap">$\mathbf{E}_F$</span> | E sub F | the block's faults: judges who voted against a verdict, each with the vote they signed |
| <span id="gk-in">[$\in$](../symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-sequence">[$\left[\!\left[x\right]\!\right]$](../symbols.md#sequence)</span> | a sequence of | ⟦T⟧ is an array of T; a subscript is its length, :n at most n, n: at least n |
| <span id="gk-Cmaxextrinsicverdicts" class="gk-wrap">$\mathsf{N}_V$</span> | N sub V | the most verdicts one block may carry: 16 |
| <span id="gk-hash">$\mathbb{H}$</span> | H | a 32-byte value, usually a hash |
| <span id="gk-ffrac">$\left\lfloor\frac{x}{y}\right\rfloor$</span> | x over y, rounded down | whole-number division, the remainder dropped: ⌊7/3⌋ is 2 |
| <span id="gk-thetime" class="gk-wrap">$\tau$</span> | tau | the time: the latest block's timeslot |
| <span id="gk-Cepochlen" class="gk-wrap">$\mathsf{E}$</span> | E | an epoch's length in slots: 600 on full, 12 on tiny |
| <span id="gk-N" class="gk-wrap">[$\mathbb{N}$](../symbols.md#naturals)</span> | N | the whole numbers: 0, 1, 2 and up; a subscript is a bound, ℕ₈ is 0 to 7 |
| <span id="gk-set">$\left\{\,x\,\right\}$</span> | the set of | a set: values with no order and no repeats |
| <span id="gk-top">$\top$</span> | top | true |
| <span id="gk-bot">$\bot$</span> | bottom | false, the no of a yes-or-no value |
| <span id="gk-edsignaturebase" class="gk-wrap">$\bar{\mathbb{V}}$</span> | V bar | an Ed25519 signature: 64 bytes |
| <span id="gk-Cmaxextrinsicoffenses" class="gk-wrap">$\mathsf{N}_O$</span> | N sub O | the most culprits, and the most faults, one block may carry: 16 each |
| <span id="gk-edkey" class="gk-wrap">$\bar{\mathbb{H}}$</span> | H bar | an Ed25519 public key: 32 bytes |

</details>

:::

**Read it aloud.** "E-D is defined as the triple E-V, E-C, E-F. Where E-V is in: a
sequence of at most N-V tuples, each a hash, tau over E rounded down minus N-2, and a
sequence of triples, each true-or-false, a natural number and an Ed25519 signature. And
E-C is in: a sequence of at most N-O triples, a hash, an Ed25519 key and a signature. And
E-F is in: a sequence of at most N-O tuples, a hash, true-or-false, an Ed25519 key and a
signature."

**What it means.** The disputes part of a block is three lists:

- **verdicts**, at most N_V = 16: each the report's hash, an epoch, and the judgments.
  ⌊τ/E⌋ − ℕ₂ is "this epoch's index minus 0 or 1": this epoch or the one before, nothing
  else. A judgment is a vote (⊤ valid, ⊥ invalid), a validator index and a 64-byte
  signature.
- **culprits**, at most N_O = 16: the bad report's hash, the guarantor's 32-byte Ed25519
  key, and their guarantee signature.
- **faults**, at most N_O = 16: the report's hash, the vote, the voter's key, and their
  vote signature.

A culprit or fault names a validator by key, not by index. It may be about a validator of
either set, κ or λ, and the same validator can sit at different indices in the two
(`0x4418…` is κ[0] and λ[2] in this vector).

**On a real value.** The block's three lists:

```text
E_V   (0xa78b…, 0, 5 judgments: (⊤, 0, …) (⊤, 1, …) (⊤, 2, …) (⊤, 3, …) (⊤, 4, …))
      (0xf907…, 0, 5 judgments: (⊥, 0, …) (⊥, 1, …) (⊥, 2, …) (⊥, 3, …) (⊥, 4, …))
      2 verdicts ≤ 16; epoch 0 = ⌊0 / 12⌋ − 0
E_C   (0xf907…, 0x4418…, 0xec20…)   (0xf907…, 0xad93…, 0xa5fe…)     2 ≤ 16
E_F   (0xa78b…, ⊥, 0xf30a…, 0xa376…)                                 1 ≤ 16
```

**In your client.** `Verdict`, `Judgement`, `Culprit`, `Fault` and `DisputesExtrinsic`
in `src/block.ts`, written in [lesson 4.4](../04-blocks/04-disputes.md#the-code) (the
vectors call a verdict's fields `target`, `age` and `votes`). The codec doesn't refuse a
17th verdict; no vector has one.

## (10.3) to (10.5): who votes, how many, and what they sign

::: gray-paper-eq 10.3

<a id="ex-10-3"></a>The Gray Paper's (10.3), (10.4), (10.5), [in its place in the paper's words](./01-votes-and-verdicts.md#eq-10-3):

$$
\begin{gather}
K(a) \equiv \begin{cases}
\kappa &\text{if } a = \displaystyle \left\lfloor\frac{\tau}{\mathsf{E}}\right\rfloor\\
\lambda &\text{otherwise}
\end{cases} \tag{10.3} \\
\begin{aligned}
\forall \left(r, a, \mathbf{j}\right) \in \mathbf{E}_V : \bigwedge &\left\{ \begin{aligned}
&\left\vert\mathbf{j}\right\vert = \left\lfloor{}^{2}\!/_{3}\left\vert\mathbf{k}\right\vert\right\rfloor + 1 \,,\\
&\forall \left(v, i, s\right) \in \mathbf{j} :\\
&\quad i < \left\vert\mathbf{k}\right\vert \wedge s \in \bar{\mathbb{V}}_{\mathbf{k}[i]_{e}}\left\langle\mathsf{X}_{v} \frown r\right\rangle
\end{aligned} \right.\\
& \text{where } \mathbf{k} = K(a)
\end{aligned} \tag{10.4} \\
\mathsf{X}_\top \equiv \text{{ \texttt{\$jam\_valid}}}\,,\ \mathsf{X}_\bot \equiv \text{{ \texttt{\$jam\_invalid}}} \tag{10.5}
\end{gather}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-xv-epochindex">$a$</span> | a | a verdict's epoch: this epoch's index or the one before, saying whose validators judged |
| <span id="gk-activeset" class="gk-wrap">$\kappa$</span> | kappa | the current validators: the keys of the V validators active this epoch |
| <span id="gk-previousset" class="gk-wrap">$\lambda$</span> | lambda | the last epoch's validators: kept to check what they signed before the change |
| <span id="gk-forall">$\forall$</span> | for all | for every value: ∀c ∈ ℕ_C means for each core c |
| <span id="gk-xv-reporthash">$r$</span> | r | the hash of the work-report on trial |
| <span id="gk-xv-judgments" class="gk-wrap">$\mathbf{j}$</span> | bold j | a verdict's judgments: the judges' signed votes, two thirds of the judges plus one |
| <span id="gk-bigwedge">$\bigwedge$</span> | all of | every one of the conditions under it is true |
| <span id="gk-abracegroup">$\left\{ \begin{aligned}x\end{aligned} \right.$</span> | as follows | a brace grouping lines that hold together: for a function, its type on top, then what each input becomes |
| <span id="gk-len">$\left\vert x\right\vert$</span> | the size of | \|x\|: how many items x has, or how many bytes |
| <span id="gk-floor">[$\left\lfloor x\right\rfloor$](../symbols.md#floor)</span> | floor of | rounded down to a whole number |
| <span id="gk-twothirds">${}^{2}\!/_{3}$</span> | two thirds | two thirds: ⌊⅔ · 6⌋ + 1 is 5 judgments on tiny, 683 of 1,023 on full |
| <span id="gk-xvj-validity">$v$</span> | v | a judgment's vote: ⊤ (true) the report is valid, ⊥ (false) it isn't |
| <span id="gk-xvj-judgeindex">$i$</span> | i | the judge's index in the validator set the verdict's epoch picks |
| <span id="gk-xvj-signature">$s$</span> | s | the judge's Ed25519 signature on the vote |
| <span id="gk-wedge">$\wedge$</span> | and | both sides are true |
| <span id="gk-edsignature">$\bar{\mathbb{V}}_{x}\left\langle y\right\rangle$</span> | V bar sub k of m | the valid Ed25519 signatures by key k on message m: 64 bytes |
| <span id="gk-vk-ed">$e$</span> | e | a validator's Ed25519 key: the 32 bytes after its Bandersnatch key |
| <span id="gk-Xvalidif">$\mathsf{X}_{x}$</span> | X sub v | the signing prefix for vote v: X sub top for valid, X sub bottom for invalid |
| <span id="gk-concat" class="gk-wrap">[$\frown$](../symbols.md#concat)</span> | concatenate | join: the left sequence followed by the right |
| <span id="gk-Xvalid" class="gk-wrap">$\mathsf{X}_\top$</span> | X sub top | the 9 bytes `jam_valid`, signed in front of a report's hash to vote it valid |
| <span id="gk-Xinvalid" class="gk-wrap">$\mathsf{X}_\bot$</span> | X sub bottom | the 11 bytes `jam_invalid`, signed in front of a report's hash to vote it invalid |

</details>

:::

**Read it aloud.** "K of a is defined as kappa if a equals tau over E rounded down, and
lambda otherwise. For every verdict r, a, bold j in E-V, all of: the length of bold j
equals two thirds of the length of bold k, rounded down, plus one; and for every
judgment v, i, s in bold j: i is less than the length of bold k, and s is an Ed25519
signature by bold k at i's e key on X-sub-v joined with r. Where bold k is K of a.
X-sub-top is defined as the string jam_valid, X-sub-bottom as the string jam_invalid."

**What it means.** Three rules for every verdict:

1. **(10.3) Who the judges are.** K(a) picks the validator set: κ, this epoch's
   validators, if the verdict's epoch a is this one; λ, the last epoch's, otherwise.
   (10.2) already allowed only those two epochs.
2. **(10.4) How many votes.** Exactly ⌊⅔ |𝐤|⌋ + 1, two thirds of the judges plus one:
   not fewer, and not more.
3. **(10.4), (10.5) Each vote is signed.** Its index i names a judge that exists    (i <
   |𝐤|). s is that judge's Ed25519 signature (the e part of their keys) on the    prefix
   X_v, then the report's hash r. The prefix is `jam_valid` for ⊤ and `jam_invalid`    for ⊥
   (the `$` in the paper is notation, not a byte). So a "valid" signature can never    pass
   as an "invalid" one.

**On a real value.** τ = 0, E = 12, the good verdict's judgment from validator 2:

```text
⌊τ / E⌋             ⌊0 / 12⌋ = 0; the verdict's a = 0, so K(0) = κ    6 judges
⌊⅔ · 6⌋ + 1         4 + 1 = 5; the verdict carries 5 judgments        count kept
judgment            (⊤, 2, 0x7d8a…)       i = 2 < 6                    a real judge
𝐤[2]_e              0xcab2…               κ[2]'s Ed25519 key
X_⊤ ⌢ r             6a61 6d5f 7661 6c69 64 a78b 526a …   9 + 32 = 41 bytes
verify              Ed25519(0xcab2…, those 41 bytes, 0x7d8a…) = true
the same, X_⊥       6a61 6d5f 696e 7661 6c69 64 a78b …   43 bytes: false
```

The bytes `6a 61 6d 5f 76 61 6c 69 64` are the ASCII letters `jam_valid`. On another vector,
`progress_with_verdict_signatures_from_previous_set-1`, τ = 36 is epoch 3. Its verdict's a =
2 is not 3, so K(2) = λ, the last epoch's six keys, and the signatures check against those.
Its twin, `-2`, says a = 1. (10.2) allows only 3 or 2, so the block is refused,
`bad_judgement_age`.

On full, 1,023 validators: ⌊⅔ · 1,023⌋ + 1 = 682 + 1 = 683 judgments a verdict.

**In your client.** `judges` (K), `voteMessage` and `votesSigned` in `src/disputes.ts`,
written in [10.1](./01-votes-and-verdicts.md#the-code). The count, the index check and the
age are three of `verdictError`'s rules, in [10.4](./04-bad-verdicts.md#the-code).

## (10.12): good, bad or wonky

::: gray-paper-eq 10.12

<a id="ex-10-12"></a>The Gray Paper's (10.12), [in its place in the paper's words](./01-votes-and-verdicts.md#eq-10-12):

$$
\begin{equation}
\begin{aligned}
\mathbf{v} &\in \left[\!\left[\left(\mathbb{H}_{}, \left\{\,\top, \bot, \emptyset\,\right\}\right)\right]\!\right]_{} \\
\mathbf{v} &\equiv \left[
\left(r, V(a, \mathbf{j})\right)
\;\middle\vert\;
\left(r, a, \mathbf{j}\right) \mathrel{\unicode{x2B40}} \mathbf{E}_V
\right] \\
V(a, \mathbf{j}) &\equiv \begin{cases}
\top &\text{if } t = \left\lfloor{}^{2}\!/_{3}\left\vert\mathbf{k}\right\vert\right\rfloor + 1 \\
\bot &\text{if } t = 0 \\
\emptyset &\text{if } t = \left\lfloor{}^{1}\!/_{3}\left\vert\mathbf{k}\right\vert\right\rfloor
\end{cases} \\
\text{where } t &= \sum_{\left(v, i, s\right) \in \mathbf{j}}\!\!\!\! v \\
\text{and } \mathbf{k} &= K(a)
\end{aligned} \tag{10.12}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-verdicts" class="gk-wrap">$\mathbf{v}$</span> | bold v | this block's verdicts boiled down: each report's hash with ⊤ good, ⊥ bad or ∅ wonky |
| <span id="gk-none" class="gk-wrap">$\emptyset$</span> | nothing | ∅: no value at all, like null |
| <span id="gk-sq">[$\left[x\right]$](../symbols.md#sequence)</span> | the sequence | a sequence written out item by item; [ ] is the empty one |
| <span id="gk-build">$\left\{ x \;\middle\vert\; y \right\}$</span> | for each, such that | built by a rule: the left-hand value, for every case the right-hand side allows (a set, or a sequence in order) |
| <span id="gk-orderedin">$\mathrel{\unicode{x2B40}}$</span> | in order, from | each item of the sequence, in its order |
| <span id="gk-onethird">${}^{1}\!/_{3}$</span> | one third | one third: ⌊⅓ · 6⌋ is 2 votes on tiny, 341 on full |
| <span id="gk-sum">$\sum$</span> | the sum of | add up what follows, once for each value the subscript ranges over |

</details>

:::

**Read it aloud.** "Bold v is in: a sequence of pairs, a hash and one of true, false or
nothing. Bold v is defined as the sequence of: r and V of a and bold j, for each verdict
r, a, bold j of E-V, in order. V of a and bold j is defined as: true if t equals two
thirds of the length of bold k, rounded down, plus one; false if t is zero; nothing if t
equals a third of the length of bold k, rounded down. Where t is the sum of v over every
judgment v, i, s in bold j, and bold k is K of a."

**What it means.** Boil each verdict down to its report's hash and one answer. Count t,
the votes saying "valid" (the sum treats ⊤ as 1 and ⊥ as 0). Then:

- t is every vote, ⌊⅔ |𝐤|⌋ + 1: **⊤, good**;
- t is 0: **⊥, bad**;
- t is ⌊⅓ |𝐤|⌋: **∅, wonky**, a real split nobody can settle.

The cases leave every other t without an answer, and a verdict must have one. So any other
split makes the block invalid ([10.4](./04-bad-verdicts.md)'s `bad_vote_split`). The paper's
footnote gives the reason for these three. They are the thresholds for the three things a
verdict can do, and the network assumes at least two thirds plus one of the validators are
live.

**On a real value.** Tiny has |𝐤| = 6, so the three counts are 5, 0 and 2:

```text
verdict 0xa78b…   votes ⊤ ⊤ ⊤ ⊤ ⊤   t = 5 = ⌊⅔ · 6⌋ + 1   (0xa78b…, ⊤)   good
verdict 0xf907…   votes ⊥ ⊥ ⊥ ⊥ ⊥   t = 0                  (0xf907…, ⊥)   bad
𝐯                 [(0xa78b…, ⊤), (0xf907…, ⊥)]
```

And from `progress_with_verdicts-6`, a split: votes ⊤ ⊤ ⊥ ⊥ ⊥, t = 2 = ⌊6 / 3⌋, so
(`0xe12c…`, ∅), wonky. In `progress_with_verdicts-5`, t = 1: no case fits, and the block
is refused.

**In your client.** `outcome` in `src/disputes.ts`, written in
[10.1](./01-votes-and-verdicts.md#the-code); the "no case fits" refusal is `split` in
`verdictError`, [10.4](./04-bad-verdicts.md#the-code).

## (10.15) to (10.18): the record

::: gray-paper-eq 10.15

<a id="ex-10-15"></a>The Gray Paper's (10.15), (10.16), (10.17), (10.18), [in its place in the paper's words](./01-votes-and-verdicts.md#eq-10-15):

$$
\begin{align}
\psi_G' &\equiv \psi_G \cup \left\{\,
r
\;\middle\vert\;
\left(r, \top\right) \in \mathbf{v}
\,\right\} \tag{10.15} \\
\psi_B' &\equiv \psi_B \cup \left\{\,
r
\;\middle\vert\;
\left(r, \bot\right) \in \mathbf{v}
\,\right\} \tag{10.16} \\
\psi_W' &\equiv \psi_W \cup \left\{\,
r
\;\middle\vert\;
\left(r, \emptyset\right) \in \mathbf{v}
\,\right\} \tag{10.17} \\
\begin{split}
\psi_O' &\equiv \psi_O \cup \left\{\,
f
\;\middle\vert\;
\left(f, \dots\right) \in \mathbf{E}_C
\,\right\} \\
&\phantom{{} \equiv \psi_O {}} \cup \left\{\,
f
\;\middle\vert\;
\left(f, \dots\right) \in \mathbf{E}_F
\,\right\}
\end{split} \tag{10.18}
\end{align}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-cup">$\cup$</span> | union | everything in either side |
| <span id="gk--offenderindex">$f$</span> | f | an offender's Ed25519 key: 32 bytes |

</details>

:::

**Read it aloud.** "Psi-G prime is defined as psi-G union the set of r such that r, true
is in bold v. Psi-B prime: psi-B union every r such that r, false is in bold v. Psi-W
prime: psi-W union every r such that r, nothing is in bold v. Psi-O prime: psi-O union
every f such that f and the rest is in E-C, union every f such that f and the rest is in
E-F."

**What it means.** Each judged report's hash joins the set of its answer, and every
culprit's and fault's key joins the offenders. Union, ∪, adds without repeats. The "…" in
(f, …) means "whatever else the tuple holds", so only the key f is taken.

**On a real value.**

```text
ψ_G ∪ {r | (r, ⊤) ∈ 𝐯}     [] ∪ {0xa78b…}                    = [0xa78b…]
ψ_B ∪ {r | (r, ⊥) ∈ 𝐯}     [] ∪ {0xf907…}                    = [0xf907…]
ψ_W ∪ {r | (r, ∅) ∈ 𝐯}     [] ∪ {}                           = []
ψ_O ∪ culprits' keys       [] ∪ {0x4418…, 0xad93…}
    ∪ faults' keys            ∪ {0xf30a…}                    = [0x4418…, 0xad93…, 0xf30a…]
```

**In your client.** `recordVerdicts` (the three sets), written in
[10.1](./01-votes-and-verdicts.md#the-code), and `recordOffenders` (ψ′_O), written in
[10.2](./02-culprits-and-faults.md#the-code), both in `src/disputes.ts`.

## (10.14): the cores cleared

::: gray-paper-eq 10.14

<a id="ex-10-14"></a>The Gray Paper's (10.14), [in its place in the paper's words](./03-clearing-the-cores.md#eq-10-14):

$$
\begin{equation}
\forall c \in \mathbb{N}_{\mathsf{C}} : \rho^\dagger\left[c\right] = \begin{cases}
\emptyset &\!\!\!\!\text{if }
\left(\mathcal{H}\left((\rho\left[c\right]_{\mathbf{g}})_{\mathbf{r}}\right), v\right) \in \mathbf{v},
v \in \left\{\,\bot, \emptyset\,\right\} \\
\rho\left[c\right] &\!\!\!\!\text{otherwise}
\end{cases}\!\!\!\!\!\!\! \tag{10.14}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-coreindex" class="gk-wrap">$\mathbb{N}_{\mathsf{C}}$</span> | N sub C | the core indices: 0 to C − 1 |
| <span id="gk-availassignmentspostjudgment" class="gk-wrap">$\rho^\dagger$</span> | rho dagger | the pending reports midway: after disputes took the judged-bad ones out |
| <span id="gk-blake">$\mathcal{H}\left(x\right)$</span> | H of | the Blake2b hash of what's in the brackets: 32 bytes |
| <span id="gk-availassignments" class="gk-wrap">$\rho$</span> | rho | the pending reports: for each core, the report waiting to be made available, and when it came |
| <span id="gk-aa-guarantee" class="gk-wrap">$\mathbf{g}$</span> | bold g | the guarantee a core's pending report came with: the report and its guarantors' signatures |
| <span id="gk-g-workreport" class="gk-wrap">$\mathbf{r}$</span> | r | a guarantee's work-report: 𝐠_𝐫 is the report it vouches for |

</details>

:::

**Read it aloud.** "For every core c: rho dagger at c is nothing, if the hash of rho at
c's guarantee's report, with some v, is in bold v, and v is false or nothing; otherwise
rho at c."

**What it means.** ρ holds, for each core, the report waiting there for its data to be
made available. For each core, hash its pending report (ℋ, Blake2b of the report's
bytes) and look the hash up in 𝐯. Judged bad (⊥) or wonky (∅): the core is emptied.
Judged good, or not judged at all: it stays. ρ† is this midway value, which the
assurances then work on.

**On a real value.**

```text
core 0   ℋ(its report) = 0xf907…   (0xf907…, ⊥) ∈ 𝐯   bad    ρ†[0] = ∅
core 1   ℋ(its report) = 0xa78b…   (0xa78b…, ⊤) ∈ 𝐯   good   ρ†[1] = ρ[1], kept
```

**In your client.** `clearJudged` in `src/disputes.ts`, written in
[10.3](./03-clearing-the-cores.md#the-code).

## (10.6) and (10.7): culprits and faults

::: gray-paper-eq 10.6

<a id="ex-10-6"></a>The Gray Paper's (10.6), (10.7), [in its place in the paper's words](./05-bad-culprits-and-faults.md#eq-10-6):

$$
\begin{align}
\forall \left(r, f, s\right) &\in \mathbf{E}_C : \bigwedge \left\{ \begin{aligned}
&r \in \psi_B' \,,\\
&f \in \mathbf{k} \,,\\
&s \in \bar{\mathbb{V}}_{f}\left\langle\mathsf{X}_G \frown r\right\rangle
\end{aligned} \right. \tag{10.6} \\
\forall \left(r, v, f, s\right) &\in \mathbf{E}_F : \bigwedge \left\{ \begin{aligned}
&r \in \psi_B' \Leftrightarrow r \not\in \psi_G' \Leftrightarrow v \,,\\
&f \in \mathbf{k} \,,\\
&s \in \bar{\mathbb{V}}_{f}\left\langle\mathsf{X}_{v} \frown r\right\rangle\\
\end{aligned} \right. \tag{10.7} \\
\text{where } \mathbf{k} &= \left\{\,i_{e} \;\middle\vert\; i \in \lambda \cup \kappa\,\right\} \setminus \psi_O \notag
\end{align}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-Xguarantee" class="gk-wrap">$\mathsf{X}_G$</span> | X sub G | the 13 bytes `jam_guarantee`, signed in front of a report's hash to guarantee it |
| <span id="gk-Leftrightarrow">$\Leftrightarrow$</span> | exactly when | if and only if: both sides are true together, or false together |
| <span id="gk-setminus">$\setminus$</span> | without | the left side with every item of the right taken out |

</details>

:::

**Read it aloud.** "For every culprit r, f, s in E-C, all of: r is in psi-B prime; f is
in bold k; s is an Ed25519 signature by f on X-G joined with r. For every fault r, v, f,
s in E-F, all of: r in psi-B prime if and only if r not in psi-G prime if and only if v;
f is in bold k; s is an Ed25519 signature by f on X-sub-v joined with r. Where bold k is
the set of the e keys of every validator in lambda or kappa, minus psi-O."

**What it means.** An accusation must be true, about a validator, and signed by them:

- **A culprit**'s report is now in the bad set. Its key belongs to a validator of this
  epoch or the last who isn't already an offender. (That is 𝐤: κ's and λ's Ed25519 keys,
  with ψ_O taken out, ∖.) Its signature is that validator's guarantee of the report,   on
  `jam_guarantee` ⌢ r.
- **A fault**'s vote contradicts the verdict. ⇔ ties three statements together, all true
  or all false: "r is bad", "r is not good", "v". So either the report is bad and the
  fault voted ⊤ valid, or it is good and the fault voted ⊥ invalid. A wonky report is
  neither bad nor good, so no fault about it fits. The key and the signature are checked
  as a culprit's, with the vote's own prefix.

**On a real value.**

```text
culprit (0xf907…, 0x4418…, 0xec20…)
  r ∈ ψ′_B           0xf907… is bad                                    yes
  f ∈ 𝐤              0x4418… is κ[0], not in ψ_O                       yes
  X_G ⌢ r            6a61 6d5f 6775 6172 616e 7465 65 f907 …   13 + 32 = 45 bytes
  signature          Ed25519(0x4418…, those 45 bytes, 0xec20…) = true
fault (0xa78b…, ⊥, 0xf30a…, 0xa376…)
  r ∈ ψ′_B?          no: 0xa78b… is good
  r ∉ ψ′_G?          no
  v                  ⊥, false                       no ⇔ no ⇔ false: all false, kept
  f ∈ 𝐤              0xf30a… is κ[3]                                   yes
  X_⊥ ⌢ r            43 bytes, Ed25519(0xf30a…, …, 0xa376…) = true
```

Two that fail. In `progress_with_faults-7`, a second fault on the good report `0x11da…`
voted ⊤. "Bad" is false, "not good" is false, v is true, and the ⇔ breaks
(`fault_verdict_wrong`). In `progress_with_culprits-4`, `0x4418…` is already in ψ_O, so it
isn't in 𝐤 (`offender_already_reported`).

**In your client.** `culpritSigned` and `faultSigned`, written in
[10.2](./02-culprits-and-faults.md#the-code), and the other rules in `offenseError`,
[10.5](./05-bad-culprits-and-faults.md#the-code), all in `src/disputes.ts`.

## (10.19): the offenders mark

::: gray-paper-eq 10.19

<a id="ex-10-19"></a>The Gray Paper's (10.19), [in its place in the paper's words](./02-culprits-and-faults.md#eq-10-19):

$$
\begin{align}
\mathbf{H}_{O} &\equiv
\left[f \;\middle\vert\; \left(f,\dots\right) \mathrel{\unicode{x2B40}} \mathbf{E}_C\right]
\frown
\left[f \;\middle\vert\; \left(f,\dots\right) \mathrel{\unicode{x2B40}} \mathbf{E}_F\right] \tag{10.19}
\end{align}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-H" class="gk-wrap">$\mathbf{H}$</span> | H | this block's header; 𝐇_T is its timeslot, 𝐇_P its parent's hash |
| <span id="gk--offendersmark">$O$</span> | O | a header's offenders mark: 𝐇_O, the Ed25519 keys of the validators this block convicts |

</details>

:::

**Read it aloud.** "H-O is defined as the sequence of f for each culprit f and the rest
in E-C, in order, joined with the sequence of f for each fault f and the rest in E-F, in
order."

**What it means.** The header's offenders mark is the new offenders' keys: every
culprit's, in the order the block lists them, then every fault's. A list, not a set, so
the order is the block's.

**On a real value.** The vector's `offenders_mark`:

```text
culprits   0x4418…, 0xad93…
faults     0xf30a…
𝐇_O        [0x4418…, 0xad93…, 0xf30a…]     2 + 1 = 3 keys
```

**In your client.** `offendersMark` in `src/disputes.ts`, written in
[10.2](./02-culprits-and-faults.md#the-code).

## (10.8) to (10.11): in order, and never twice

::: gray-paper-eq 10.8

<a id="ex-10-8"></a>The Gray Paper's (10.8), (10.9), (10.10), [in its place in the paper's words](./04-bad-verdicts.md#eq-10-8):

$$
\begin{align}
&\mathbf{E}_V = \left[\left(r, a, \mathbf{j}\right) \in \mathbf{E}_V\,\wr\!\wr\,r\right] \tag{10.8} \\
&\mathbf{E}_C = \left[\left(r, f, s\right) \in \mathbf{E}_C\,\wr\!\wr\,f\right] \,,\
\mathbf{E}_F = \left[\left(r, v, f, s\right) \in \mathbf{E}_F\,\wr\!\wr\,f\right]\!\!\!\!\!\! \tag{10.9} \\
&\left\{\,r \;\middle\vert\; \left(r, a, \mathbf{j}\right) \in \mathbf{E}_V\,\right\} \mathrel{\unicode{x2AEF}} \psi_G \cup \psi_B \cup \psi_W \tag{10.10}
\end{align}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-sqorderuniqby">$\left[y\,\wr\!\wr\,x\right]$</span> | sorted, no repeats, by | sorted by the key on the right, each key once |
| <span id="gk-disjoint">$\mathrel{\unicode{x2AEF}}$</span> | share nothing with | the two sides have no item in common |

</details>

:::

::: gray-paper-eq 10.11

<a id="ex-10-11"></a>The Gray Paper's (10.11), [in its place in the paper's words](./04-bad-verdicts.md#eq-10-11):

$$
\begin{equation}
\forall \left(r, a, \mathbf{j}\right) \in \mathbf{E}_V : \mathbf{j} = \left[\left(v, i, s\right) \in \mathbf{j}\,\wr\!\wr\,i\right] \tag{10.11}
\end{equation}
$$

:::

**Read it aloud.** "E-V equals the sequence of its verdicts ordered by r, unique. E-C
equals its culprits ordered by f, unique; E-F, its faults ordered by f, unique. The set
of every r of E-V is disjoint from psi-G union psi-B union psi-W. For every verdict r,
a, bold j of E-V: bold j equals its judgments ordered by i, unique."

**What it means.** The ≀≀ sign before a key means "sorted by this key, with no key twice".
A list equal to its own sorted, unique self is already sorted and has no repeats.

- **(10.8)** Verdicts are sorted by report hash, no report twice.
- **(10.9)** Culprits are sorted by key, and so are faults, no key twice in either.
- **(10.10)** No verdict judges a report already in the good, bad or wonky set: ⫯ means
  the two sets share nothing.
- **(10.11)** Inside a verdict, the judgments are sorted by validator index, no judge
  twice.

Uniqueness is the point. A vote counted twice could make a split look like a verdict, and a
key named twice would be punished twice. Sorting makes a repeat cheap to spot: it must sit
right next to its twin.

**On a real value.** The good examples keep every rule: `0xa78b…` before `0xf907…`;
culprits `0x4418…` before `0xad93…`; judges 0, 1, 2, 3, 4. Vectors that break them:

```text
progress_with_verdicts-3     verdicts 0x7b0a…, 0x11da…: not sorted    (10.8)
progress_with_culprits-1     culprits 0xcab2…, 0x4418…: not sorted    (10.9)
progress_with_culprits-3     0x11da… already in ψ_B                   (10.10)
progress_with_verdicts-1     judges 0, 2, 1, 3, 4: not sorted         (10.11)
progress_with_verdicts-2     judges 0, 2, 2, 3, 4: judge 2 twice      (10.11)
```

**In your client.** `targetsInOrder`, the `already_judged` check and `votesInOrder` in
`verdictError`, written in [10.4](./04-bad-verdicts.md#the-code); `byKey` in
`offenseError`, written in [10.5](./05-bad-culprits-and-faults.md#the-code).

## (10.13): a good verdict needs a fault

::: gray-paper-eq 10.13

<a id="ex-10-13"></a>The Gray Paper's (10.13), [in its place in the paper's words](./05-bad-culprits-and-faults.md#eq-10-13):

$$
\begin{align}
\forall \left(r, \top\right) \in \mathbf{v} &:
\exists \left(r, \dots\right) \in \mathbf{E}_F \tag{10.13}
\end{align}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-exists">[$\exists$](../symbols.md#exists)</span> | there exists | there is at least one value such that what follows holds |

</details>

:::

**Read it aloud.** "For every r, true in bold v: there exists a fault r and the rest in
E-F."

**What it means.** A report judged good must have at least one fault about it in the same
block. A dispute starts only when someone votes "invalid". If the report turns out good,
that someone was wrong, and the block must name them. A bad verdict has no such rule: its
culprits may come in a later block.

**On a real value.**

```text
progress_invalidates_avail_assignments-1   (0xa78b…, ⊤); fault (0xa78b…, ⊥, 0xf30a…)   kept
progress_with_faults-1                     (0x11da…, ⊤); no faults at all               refused
```

**In your client.** The `not_enough_faults` rule in `offenseError`, written in
[10.5](./05-bad-culprits-and-faults.md#the-code).

## Say it in one breath

The state keeps the reports judged good, bad and wonky, and the offenders' keys (10.1). A
block carries verdicts, culprits and faults (10.2). Each verdict holds exactly two thirds of
this epoch's or last epoch's validators plus one, each vote signed on `jam_valid` or
`jam_invalid` and the report's hash (10.3 to 10.5). All of them valid is good, none is bad,
a third is wonky, and anything else sinks the block (10.12). The judged reports join their
sets, and the offenders' keys join ψ_O (10.15 to 10.18). A report judged bad or wonky leaves
its core (10.14). A culprit is a guarantor of a bad report, a fault a voter against the
verdict. Each is a validator of this epoch or the last, not yet punished, and convicted by
their own signature (10.6, 10.7). The header lists them (10.19). Everything is sorted with
no repeats, no report is judged twice (10.8 to 10.11), and a good verdict comes with a fault
(10.13).
