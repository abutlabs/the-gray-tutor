# Votes and verdicts

**In one sentence:** when validators challenge a work-report, more than two thirds of them
sign a vote on it, and your client checks the signatures, counts the votes and records the
verdict: good, bad or wonky.

Here is a verdict on the tiny network: six judges, five votes, all saying valid. Make the
report bad, then wonky. Then try 3 valid out of 5, a split that means nothing.

<a id="try-it"></a>

<VerdictVotes />

## The idea

Some validators say a work-report is wrong. How does the chain settle it?

Not by running the work again. That happens off the chain: validators re-run the work,
and each signs a vote, a [*judgement*](../glossary.md#judgement), saying valid or invalid.
The signed votes are gathered into a verdict, and a block carries it.

Your client is the court clerk. For each verdict it does three things:

1. Check every signature against the right [*judges*](../glossary.md#judges).
2. Count the votes that say valid. That count is the [*vote split*](../glossary.md#vote-split).
3. File the result in the state, for good.

Only three counts mean anything. Picture a batch of food and a team of inspectors.

- **Good.** More than two thirds pass it. It ships, and the ones who cried poison get a
  black mark.
- **Bad.** As many find poison. It's binned, any of it already sold is recalled, and the
  cooks who signed it off are fired.
- **Wonky.** A real split. Binned and recalled all the same, because you don't serve food
  you can't vouch for. Nobody is fired, because nobody is proven to have lied.

[Lesson 4.4](../04-blocks/04-disputes.md) decoded disputes. This lesson builds the clerk:
the signature check, the count and the record.

## What the Gray Paper says

::: gray-paper 10.2 1-4

#### §10.2 Extrinsic {#gp-10-2}

<a id="gp-10-2-p1"></a>The disputes extrinsic $\mathbf{E}_D$ is functional grouping of three otherwise independent extrinsics. It comprises *verdicts* $\mathbf{E}_V$, *culprits* $\mathbf{E}_C$, and *faults* $\mathbf{E}_F$. Verdicts are a compilation of judgments coming from either the active validator set or the previous epoch's validator set, i.e.  the Ed25519 keys of $\kappa$ or $\lambda$. Culprits and faults are proofs of the misbehavior of one or more validators, respectively either by guaranteeing a work-report found to be invalid, or by signing a judgment found to be in contradiction to a work-report's validity. Both of these are considered a kind of *offense*. Formally:

<a id="gp-10-2-p2"></a><a id="eq-10-2"></a>

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

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-xtdisputes" class="gk-wrap">$\mathbf{E}_D$</span> | E sub D | the disputes bag: verdicts, culprits and faults |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
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

→ [(10.2) in plain words](./gray-paper.md#ex-10-2)

<a id="gp-10-2-p3"></a>The signatures of all judgments must be valid in terms of one of the two allowed validator key-sets, identified by the verdict's second term which must be either the epoch index of the prior state or one less. Each verdict must contain judgments from exactly two-thirds plus one of the identified validators. Formally:

<a id="gp-10-2-p4"></a><a id="eq-10-3"></a><a id="eq-10-4"></a><a id="eq-10-5"></a>

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

<details class="gp-key"><summary>Its symbols, in plain words</summary>

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

→ [(10.3), (10.4), (10.5) in plain words](./gray-paper.md#ex-10-3)

:::

§10.2, from the top.

**What a block carries.** The disputes extrinsic 𝐄_D is three lists: verdicts 𝐄_V (at
most N_V = 16), culprits 𝐄_C and faults 𝐄_F (at most N_O = 16 each). A verdict is a
report's hash r, an epoch index a, and its judgments 𝐣. Each judgment is a vote v (⊤ valid
or ⊥ invalid), a validator index i and an Ed25519 signature s. Culprits and faults are the
[next lesson](./02-culprits-and-faults.md)'s.

**Who votes.** A verdict's `age`, its [*verdict age*](../glossary.md#verdict-age), names
the epoch its votes were cast in. Only this epoch or the one before will do: in epoch 3,
ages 3 and 2 are fine, age 1 isn't. The judges are κ, the current validators, if the age
is the current epoch, and λ, the previous ones, otherwise. That rule is K. On tiny that is
6 judges, so a verdict needs ⌊2·6/3⌋ + 1 = 5 votes.

**What a vote signs.** Ed25519 ([lesson 5.3](../05-hashing-and-signatures/03-signatures.md)), over a prefix and the report's hash:
`$jam_valid` for "this report is good", `$jam_invalid` for "it isn't". The `$` is
notation, as always: the bytes are `jam_valid` and `jam_invalid`. The prefix is part of
the message, so a "valid" signature can't be passed off as an "invalid" one.

::: gray-paper 10.2 11-12

#### §10.2 Extrinsic, continued

<a id="gp-10-2-p11"></a>We define $\mathbf{v}$ to derive from the sequence of verdicts introduced in the block's extrinsic. For each verdict, $\mathbf{v}$ contains only the report hash and whether the report is good ($\top$), bad ($\bot$) or wonky ($\emptyset$), which is determined from the sum of positive judgments. We require this sum to be either exactly two-thirds-plus-one, zero or one-third of the validator set indicating, respectively, that the report is good, that it's bad, or that it's wonky.<sup>1</sup> Formally:

<small class="gp-note"><sup>1</sup> This requirement may seem somewhat arbitrary, but these happen to be the decision thresholds for our three possible actions and are acceptable since the security assumptions include the requirement that at least two-thirds-plus-one validators are live ([Burdges et al. 2024](https://eprint.iacr.org/2024/961) discusses the security implications in depth).</small>

<a id="gp-10-2-p12"></a><a id="eq-10-12"></a>

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

<details class="gp-key"><summary>Its symbols, in plain words</summary>

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

→ [(10.12) in plain words](./gray-paper.md#ex-10-12)

:::

**What it decides.** A verdict never carries a vote from every judge: it carries exactly
⌊2·|K|/3⌋ + 1 of them, a supermajority: 5 of tiny's 6 judges, 683 of full's 1,023.
Count the carried votes that say "valid". That count, t, is the vote split, and only
three splits mean anything (on tiny, 5, 0 or 2):

| the votes saying "valid" | on tiny | on full | the report is |
| --- | --- | --- | --- |
| all of them: t = ⌊2·\|K\|/3⌋ + 1 | 5 of 5 | 683 of 683 | **good**: a supermajority swears it's right |
| none: t = 0 | 0 of 5 | 0 of 683 | **bad**: the same supermajority, swearing it's wrong |
| a third of the judges say "valid", the rest of the carried votes "invalid": t = ⌊\|K\|/3⌋ | 2 of 5 | 341 of 683 | **wonky**: a genuine split, nobody can tell |
| anything else | 1, 3 or 4 of 5 | any other count | no verdict at all: the block is refused, as [lesson 10.4](./04-bad-verdicts.md)'s `bad_vote_split` |

What about a middling split, 200 of the 683 swearing the report is bad? It never reaches
this table. A judgement isn't an opinion. A judge votes after re-running the report's work
on the same data. (That is the work of an [*auditor*](../glossary.md#auditor). Your client
never audits: it only checks verdicts.) The computation is deterministic, so honest judges
all come out the same door.

The verdict is the *proof* an accuser assembles from the signed judgements afterwards:

- **Good:** ⌊2·|K|/3⌋ + 1 signatures saying "valid", and *exactly* that many. All 6 of 6
  is refused too (`bad_votes_count`). A sixth signature proves nothing five haven't
  already put beyond challenge, and a fixed count gives every verdict exactly one shape on
  the wire.
- **Bad:** that many saying "invalid". That is the 0-of-683 row: every carried vote is an
  "invalid" one.
- **Wonky:** exactly a third saying "valid", evidence of a true split.

If the signatures to complete one of those three patterns don't exist, no verdict can be
written at all, and the chain records nothing. There are no tiers: only proven right,
proven wrong, and a proven stalemate.

**What each one does next.** The Gray Paper calls the three splits "the decision
thresholds for our three possible actions". On trial is one work-report, one core's work,
and the verdict decides three things about it:

| the verdict | the report on its core ([10.3](./03-clearing-the-cores.md)) | a chain that already accumulated it | who is punished ([10.2](./02-culprits-and-faults.md)) |
| --- | --- | --- | --- |
| **good** | stays on its core | kept | whoever signed "invalid" (faults) |
| **bad** | taken off its core | abandoned | its guarantors (culprits), and whoever signed "valid" (faults) |
| **wonky** | taken off its core | abandoned | nobody |

Why exactly ⌊|K|/3⌋ saying "valid"? Look at the other side: the rest of the carried votes,
3 of tiny's 6 judges and 342 of full's 1,023, say "invalid". That's more than a third,
and two rules turn on that line:

- **It can never be good.** Even if every judge left out of the verdict said "valid",
  that's 6 − 3 = 3 on tiny and 1,023 − 342 = 681 on full, short of the 5 and 683 good
  needs.
- **A chain that took it is dropped.** The Gray Paper's auditing rules: nodes disregard
  any chain that accumulated a report at least a third of the validators judge invalid.
  They build on an earlier block instead, one from before the report went in.

So wonky proves the report can't be accepted, without proving that anyone lied. The Gray
Paper doesn't say what causes an honest split. One likely cause is a bug: two clients
computing the same work differently, each judge voting honestly on what their own client
says. Fining a third of the network for a bug would be a disaster, so nobody is fined.
Stopping such bugs before they reach a network is what the fuzzer is for, in
[Part 20](../20-facing-the-fuzzer/index.md).

**Not a rejected block.** None of the three rejects the block that carries the verdict.
That block is accepted, and its verdict is the evidence. A bad or wonky verdict removes
the report and, if it was already accumulated, the earlier block that took it and every
block built on that. A block is refused only when its verdict is malformed: the wrong
number of votes, or a split that isn't in the table ([lesson 10.4](./04-bad-verdicts.md)).

::: gray-paper 10.1

#### §10.1 The State {#gp-10-1}

<a id="gp-10-1-p1"></a>The *disputes* state includes four items, three of which concern verdicts: a good-set ($\psi_G$), a bad-set ($\psi_B$) and a wonky-set ($\psi_W$) containing the hashes of all work-reports which were respectively judged to be correct, incorrect or that it appears impossible to judge. The fourth item, the <abbr class="gp-term" title="ψ_O: the keys of validators found guilty">punish-set</abbr> ($\psi_O$), is a set of Ed25519 keys representing validators which were found to have misjudged a work-report.

<a id="gp-10-1-p2"></a><a id="eq-10-1"></a>

$$
\begin{equation}
\psi \equiv \left(\psi_G, \psi_B, \psi_W, \psi_O\right) \tag{10.1}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-disputes" class="gk-wrap">$\psi$</span> | psi | past judgments: the reports found good, bad or wonky, and the validators who lied |
| <span id="gk-goodset" class="gk-wrap">$\psi_G$</span> | psi sub G | the good set: hashes of every report a verdict found valid |
| <span id="gk-badset" class="gk-wrap">$\psi_B$</span> | psi sub B | the bad set: hashes of every report a verdict found invalid |
| <span id="gk-wonkyset" class="gk-wrap">$\psi_W$</span> | psi sub W | the wonky set: hashes of every report whose verdict split, so nobody can tell |
| <span id="gk-offenders" class="gk-wrap">$\psi_O$</span> | psi O | the offenders: Ed25519 keys of validators found to have judged a report wrongly |

</details>

→ [(10.1) in plain words](./gray-paper.md#ex-10-1)

:::

::: gray-paper 10.2 17-18

#### §10.2 Extrinsic, continued

<a id="gp-10-2-p17"></a>The state's good-set, bad-set and wonky-set assimilate the hashes of the reports from each verdict. Finally, the punish-set accumulates the keys of any validators who have been found guilty of offending. Formally:

<a id="gp-10-2-p18"></a><a id="eq-10-15"></a><a id="eq-10-16"></a><a id="eq-10-17"></a><a id="eq-10-18"></a>

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

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-cup">$\cup$</span> | union | everything in either side |
| <span id="gk--offenderindex">$f$</span> | f | an offender's Ed25519 key: 32 bytes |

</details>

→ [(10.15), (10.16), (10.17), (10.18) in plain words](./gray-paper.md#ex-10-15)

:::

**What the state keeps.** ψ (C(5), [lesson 6.2](../06-state-and-merklization/02-state-keys.md)) holds three sets of report hashes, good,
bad and wonky, plus the offenders' keys ([next lesson](./02-culprits-and-faults.md)). Each verdict's report joins the
set of its outcome. Sets in the state are kept sorted.

Try each split on [the verdict at the top](#try-it). It starts as the first test below
does, all five saying valid, with judge 5 left out. Set 3 valid out of 5, a split the
table doesn't have, and the chain refuses the whole block, as
[lesson 10.4](./04-bad-verdicts.md) will make your client do. Full has 1,023 judges and
683 votes, so there you set the counts.

## The tests

**New file** `test/disputes.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { DisputesExtrinsic } from "../src/block.ts";
import type { Verdict } from "../src/block.ts";
import { FULL, TINY } from "../src/config.ts";
import { judges, outcome, PastJudgements, recordVerdicts, votesSigned } from "../src/disputes.ts";
import { ValidatorKey } from "../src/state.ts";
import { vectorFiles, vectorJson } from "./vectors.ts";
import type { Outcome } from "../src/disputes.ts";

/** A verdict with `valid` "valid" votes out of `count`, unsigned: enough for counting. */
function verdictWith(valid: number, count: number): Verdict {
  const votes = Array.from({ length: count }, (_, index) => ({
    vote: index < valid,
    index,
    signature: new Uint8Array(64),
  }));
  return { target: new Uint8Array(32), age: 0, votes };
}

test("V: with 6 judges, 5 valid votes is good, 0 is bad, 2 is wonky", () => {
  const fiveValid: Outcome = outcome(verdictWith(5, 5), 6);
  assert.equal(fiveValid, "good"); // ⌊2 × 6 / 3⌋ + 1 = 5
  const noneValid: Outcome = outcome(verdictWith(0, 5), 6);
  assert.equal(noneValid, "bad");
  const twoValid: Outcome = outcome(verdictWith(2, 5), 6);
  assert.equal(twoValid, "wonky"); // ⌊6 / 3⌋ = 2
});

/** A disputes test vector: the parts of it this lesson uses. */
type DisputesVector = {
  input: { disputes: unknown };
  pre_state: {
    psi: unknown; // ψ: past judgements: good, bad and wonky report hashes, and the offenders
    tau: number; // τ: the time: the slot of the most recent block
    kappa: unknown[]; // κ: the validators now: the judges of a verdict from this epoch
    lambda: unknown[]; // λ: last epoch's validators: the judges of a verdict from the last
  };
  post_state: {
    psi: unknown; // ψ′: past judgements after the block: each verdict's report filed
  };
  output: { err?: string };
};

/** A disputes vector's verdicts, each with its judges' keys (κ or λ, by its age). */
function judgedVerdicts(config: typeof TINY, vector: DisputesVector) {
  const { input, pre_state } = vector;
  const keys = (list: unknown[]) => list.map((key) => ValidatorKey.fromJson(key));
  const [active, previous] = [keys(pre_state.kappa), keys(pre_state.lambda)];
  return DisputesExtrinsic.fromJson(input.disputes).verdicts.map((verdict) => ({
    verdict,
    keys: judges(config, pre_state.tau, verdict.age, active, previous),
  }));
}

/** The accepted disputes vectors of a size: a rejected block changes nothing. */
function acceptedVectors(config: typeof TINY): { name: string; vector: DisputesVector }[] {
  return vectorFiles(`stf/disputes/${config.name}`)
    .map((name) => ({ name, vector: vectorJson(name) as DisputesVector }))
    .filter(({ vector }) => !vector.output.err);
}

test("every vote is signed by its judge (tiny: full verdicts are 683 votes each)", () => {
  for (const { name, vector } of acceptedVectors(TINY)) {
    for (const { verdict, keys } of judgedVerdicts(TINY, vector)) {
      const signed: boolean = votesSigned(verdict, keys);
      assert.ok(signed, name);
    }
  }
});

test("each judged report joins the set of its verdict's outcome", () => {
  let accepted = 0;
  for (const config of [TINY, FULL]) {
    for (const { name, vector } of acceptedVectors(config)) {
      const outcomes = judgedVerdicts(config, vector).map(({ verdict, keys }) => ({
        target: verdict.target,
        outcome: outcome(verdict, keys.length),
      }));
      const before: PastJudgements = PastJudgements.fromJson(vector.pre_state.psi);
      const after: PastJudgements = recordVerdicts(before, outcomes);
      const { good, bad, wonky }: PastJudgements = PastJudgements.fromJson(vector.post_state.psi);
      assert.deepEqual([after.good, after.bad, after.wonky], [good, bad, wonky], name);
      accepted++;
    }
  }
  assert.equal(accepted, 21); // 10 tiny, 11 full
});

test("a forged vote is caught", () => {
  const vector = vectorJson("stf/disputes/tiny/progress_with_bad_signatures-1.json");
  const [{ verdict, keys }] = judgedVerdicts(TINY, vector as DisputesVector);
  const signed: boolean = votesSigned(verdict, keys);
  assert.equal(signed, false);
});
```

`verdictWith` builds a fake verdict with blank signatures: enough to test the count.
The signatures get their own test, on tiny only. A full verdict has 683 votes, and
checking the 7,500-odd votes of the full vectors would take your test run from about
three seconds to about ten.

## The code

**New file** `src/disputes.ts`

```ts
// Disputes (GP §10): when a work-report is challenged, validators vote on it, and the chain
// records the verdict for good.

import type { Verdict } from "./block.ts";
import type { Bytes } from "./bytes.ts";
import { concatBytes, toHex } from "./bytes.ts";
import type { Value } from "./codec/codec.ts";
import { fixedBytes, hash, record, seq } from "./codec/codec.ts";
import type { Config } from "./config.ts";
import { epochOf } from "./epoch.ts";
import { verifyEd25519 } from "./signature.ts";
import type { ValidatorKey } from "./state.ts";

/** ψ, C(5): the reports judged good, bad or wonky so far, and the offenders' Ed25519 keys. */
export const PastJudgements = record({
  good: seq(hash),
  bad: seq(hash),
  wonky: seq(hash),
  offenders: seq(fixedBytes(32)),
});
export type PastJudgements = Value<typeof PastJudgements>;

/** X_⊺ and X_⊥: "$jam_valid" and "$jam_invalid" in the GP. */
const VALID = new TextEncoder().encode("jam_valid");
const INVALID = new TextEncoder().encode("jam_invalid");

/** What a vote signs: its prefix, valid or invalid, then the report's hash. */
export function voteMessage(vote: boolean, target: Bytes): Bytes {
  return concatBytes(vote ? VALID : INVALID, target);
}

/** K: whose keys a verdict's votes are signed with. κ if its age is this epoch, else λ. */
export function judges(
  config: Config,
  time: number, // τ
  age: number, // the verdict's epoch
  active: ValidatorKey[], // κ
  previous: ValidatorKey[], // λ
): ValidatorKey[] {
  return age === epochOf(config, time) ? active : previous;
}

/** Whether every vote of a verdict is signed by the validator it names. */
export function votesSigned(verdict: Verdict, keys: ValidatorKey[]): boolean {
  return verdict.votes.every((vote) => {
    const message = voteMessage(vote.vote, verdict.target);
    return verifyEd25519(keys[vote.index].ed25519, message, vote.signature);
  });
}

/** A verdict's outcome: the report is good, bad, or wonky (nobody can tell). */
export type Outcome = "good" | "bad" | "wonky";

/** V: a verdict's outcome, by how many of its judges said "valid": all, none, or a third. */
export function outcome(verdict: Verdict, judges: number): Outcome {
  const valid = verdict.votes.filter((vote) => vote.vote).length;
  if (valid === Math.floor((2 * judges) / 3) + 1) return "good";
  if (valid === 0) return "bad";
  return "wonky"; // ⌊judges / 3⌋ said "valid": no side won
}

/** Hashes as a set: sorted, the way the state keeps them. */
const sorted = (hashes: Bytes[]) => [...hashes].sort((a, b) => toHex(a).localeCompare(toHex(b)));

/** ψ′'s three sets: each judged report joins the set of its outcome. */
export function recordVerdicts(
  before: PastJudgements,
  judged: { target: Bytes; outcome: Outcome }[],
): PastJudgements {
  const after = { ...before };
  for (const set of ["good", "bad", "wonky"] as const) {
    const reports = judged.filter((j) => j.outcome === set).map((j) => j.target);
    after[set] = sorted([...before[set], ...reports]);
  }
  return after;
}
```

`PastJudgements` is ψ as a `record`, so it's C(5)'s codec too. `outcome` is the table,
row by row:

```ts
  if (valid === Math.floor((2 * judges) / 3) + 1) return "good";
  if (valid === 0) return "bad";
  return "wonky"; // ⌊judges / 3⌋ said "valid": no side won
```
It takes the *judges'* number, not always V: a verdict from the previous epoch is counted
against λ's size. `recordVerdicts` copies ψ with `{ ...before }`, then rebuilds each set,
sorted. The sort compares hex strings, which sort in the same order as the bytes they spell.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ V: with 6 judges, 5 valid votes is good, 0 is bad, 2 is wonky (0.6ms)
✔ every vote is signed by its judge (tiny: full verdicts are 683 votes each) (321.8ms)
✔ each judged report joins the set of its verdict's outcome (385.9ms)
✔ a forged vote is caught (8.9ms)
...
ℹ tests 96
ℹ suites 0
ℹ pass 96
ℹ fail 0
...
reported 96 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791731877727
...
```

21 accepted blocks, every verdict recorded where it belongs: 10 on tiny, 11 on full.

> [!NOTE]
> **The simple road, for now.** `outcome` says *wonky* for any count that isn't all or
> nothing, but the Gray Paper only allows exactly ⌊|K|/3⌋. A block whose votes split any
> other way must be rejected. [Lesson 10.4](./04-bad-verdicts.md) adds that check, and lasair has a story about
> it (below).

## Watch it

**New file** `bin/verdicts.ts`

```ts
// Shows each verdict in a disputes test vector: whose judges voted, how they voted, whether
// every vote is really theirs, and what the verdict decides.
// Usage: npm run verdicts <vector.json>, e.g.
//        npm run verdicts ../vectors/stf/disputes/tiny/progress_with_verdicts-4.json

import { readFileSync } from "node:fs";
import { DisputesExtrinsic } from "../src/block.ts";
import { toHex } from "../src/bytes.ts";
import { FULL, TINY } from "../src/config.ts";
import { judges, outcome, votesSigned } from "../src/disputes.ts";
import { Run } from "../src/obs.ts";
import { ValidatorKey } from "../src/state.ts";

const [file] = process.argv.slice(2);
const config = file.includes("/full/") ? FULL : TINY;
const { input, pre_state } = JSON.parse(readFileSync(file, "utf8"));
const keys = (list: unknown[]) => list.map((key) => ValidatorKey.fromJson(key));
const [active, previous] = [keys(pre_state.kappa), keys(pre_state.lambda)];
const run = new Run("verdicts");
for (const verdict of DisputesExtrinsic.fromJson(input.disputes).verdicts) {
  const judgeKeys = judges(config, pre_state.tau, verdict.age, active, previous);
  const set = judgeKeys === active ? "κ" : "λ";
  const valid = verdict.votes.filter((vote) => vote.vote).length;
  const votes = verdict.votes.length;
  const signed = votesSigned(verdict, judgeKeys);
  const decided = outcome(verdict, judgeKeys.length);
  const report = `${toHex(verdict.target).slice(0, 10)}…`;
  console.log(`report ${report}: ${valid} of ${votes} say valid, judged by ${set}`);
  console.log(`  every vote signed by its judge: ${signed}. The report is ${decided}.`);
  run.event("verdict", { report: verdict.target, set, valid, votes, signed, decided });
}
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

**What flows through it**, for the vector's first verdict:

::: code-group

```json [what goes in]
{
  "target": "0x11da6d1f761ddf9bdb4c9d6e5303ebd41f61858d0a5647a1a7bfe089bf921be9",
  "age": 0,
  "votes": [
    { "vote": true, "index": 0, "signature": "0x370cc0cc…" },
    { "vote": true, "index": 1, "signature": "0xeec6859e…" },
    … three more votes, every one of the five "vote": true …
  ]
}
```

```ts [what it computes]
// bin/verdicts.ts's values for that verdict, once decoded and judged
const computed = {
  set: "κ", // age 0 in epoch 0: judged by the current validators
  judges: 6, // |K|: κ's six keys
  votes: 5, // carried: ⌊2·6/3⌋ + 1, the supermajority
  valid: 5, // t, how many of them say "valid"
  signed: true, // all 5 Ed25519 checks pass (votesSigned)
  decided: "good", // t equals every carried vote
};
```

```text [what comes out]
report 0x11da6d1f…: 5 of 5 say valid, judged by κ
  every vote signed by its judge: true. The report is good.
```

:::

`target` is the accused report's hash, the first word of the output. `age` 0 with
`pre_state.tau` at 0 is the same epoch, so the judges are κ. Each of the 5 votes is one
judge's judgement:

- `vote`: true for "valid".
- `index`: which judge cast it. Here 0 to 4: judge 5 is the one left out.
- `signature`: that judge's Ed25519 signature over the prefix and the target, which
  `votesSigned` checks.

The vector's second verdict has the same shape with every `vote` false: the 0-of-5 the
output calls bad.

**Run**

```sh
npm pkg set scripts.verdicts="node bin/verdicts.ts"
npm pkg set scripts.verdicts-progress="node bin/verdicts.ts ../vectors/stf/disputes/tiny/progress_with_verdicts-4.json"
npm run verdicts-progress
```

```text
report 0x11da6d1f…: 5 of 5 say valid, judged by κ
  every vote signed by its judge: true. The report is good.
report 0x7b0aa173…: 0 of 5 say valid, judged by κ
  every vote signed by its judge: true. The report is bad.
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=verdicts-1791731881564
```

Two trials in one block: one report cleared, one condemned. Now try two more:

- `progress_with_bad_signatures-1.json` prints `every vote signed by its judge: false`: a
  forged vote.
- `progress_with_verdict_signatures_from_previous_set-1.json` is judged by λ. Its report's
  hash, `0x0e5751c0…`, should ring a bell: it's the Blake2b of no bytes at all, from
  [lesson 5.1](../05-hashing-and-signatures/01-hashes.md). Test vectors need report hashes from somewhere!

The *Verdicts* panel, on the **4 · Checks** dashboard (where [Part 10](./index.md)'s panels are), has every trial.

![Verdicts panel](./images/01-verdicts.png)

<details>
<summary>lasair: <code>classify_verdict</code>, in <code>conformance/disputes_stf.ml</code></summary>

```ocaml
let classify_verdict (k : validator_key list) (judgements : judgement_vote list) : verdict_result =
  let valid_count = List.length (List.filter (fun j -> j.is_valid) judgements) in
  if valid_count = verdict_threshold_for k then VerdictGood
  else if valid_count = 0 then VerdictBad
  else if valid_count = wonky_tally_for k then VerdictWonky
  else VerdictBadSplit
```

Four answers, not three: lasair rejects every other split as `VerdictBadSplit`. Its
comment tells why it's there. An older version treated almost *any* split as wonky, as
your `outcome` does today, and nobody noticed, because no test vector votes 3 of 5 or 342
of 683. (One votes 1 of 5, which that version already refused; [lesson 10.4](./04-bad-verdicts.md) uses it.) A
part of a rule the vectors never exercise is a part you have to read the Gray Paper for.

</details>

## Check your understanding

::: check
**A work-report is challenged. Who decides whether its work was right, and where?**

- [ ] Every validator, on the chain: each re-runs the report's work when the block arrives
  > No: the chain never re-runs the work. On the chain, every validator checks the
  > signatures and counts the votes, and that is all your client does.
- [x] The judges, off the chain: each re-runs the work and signs a vote, and a block carries the signed votes
  > Yes: the judging is done before the block exists. The verdict is the proof of how it
  > went, and every validator checks that proof.
- [ ] The author of the block that carries the verdict
  > No: the author only carries signed votes. Without the signatures of two thirds of the
  > judges plus one, there is no verdict to carry.

**Why does a verdict carry exactly two thirds of the judges plus one, never a vote more?**

- [x] That many signatures already put it beyond challenge, and a fixed count gives every verdict one shape
  > Yes: one more signature proves nothing the others haven't. One more or one fewer, and
  > the block is refused.
- [ ] The judges left out didn't vote
  > No: a judge left out may well have voted. The verdict carries the votes that prove
  > it, not every vote cast.
- [ ] It is only the least a verdict needs: any count above it is accepted too
  > No: the count is exact. A verdict with a vote from every judge is refused, as one
  > with too few is.

**A report is judged wonky. What happens to it, and who is punished?**

- [ ] It stays on its core, since nobody proved it wrong
  > No: more than a third of the judges said invalid, so it can never be proven good.
- [ ] It's taken off its core, and its guarantors are punished
  > No: culprits need a bad verdict. A wonky one punishes nobody.
- [x] It's taken off its core, any chain that accumulated it is dropped, and nobody is punished
  > Yes: treated as bad for the chain's sake, but nobody is proven to have lied. An honest
  > split may be a bug, and a bug shouldn't fine a third of the network.

**A block carries a bad verdict. Is that block refused?**

- [ ] Yes: anything short of a good verdict rejects the block
  > No: the verdict is evidence, and evidence of the right shape is accepted.
- [x] No: the block is accepted; it's the report, and any earlier block that accumulated it, that go
  > Yes: a block is refused only when its verdict is malformed: the wrong count, or a split
  > not in the table.
- [ ] Only if the report was already accumulated
  > No: the block carrying the verdict is fine either way. An *earlier* block that
  > accumulated the report is the one dropped.

**Why does a vote sign `jam_valid` or `jam_invalid` before the report's hash, not the hash alone?**

- [x] So a "valid" signature can't be passed off as an "invalid" one
  > Yes: the prefix is part of the message. Same judge, same report, but the two votes
  > sign different bytes.
- [ ] A longer message makes the signature harder to forge
  > No: an Ed25519 signature is 64 bytes, and as strong, whatever it signs.
- [ ] To say which epoch the vote was cast in
  > No: the epoch is the verdict's age, a separate field. The prefix says only which way
  > the vote went.
:::

## What you have

A court clerk: every vote's signature checked against the right judges, every verdict
counted and filed in ψ. A verdict is only half a trial, though: [lesson 10.2](./02-culprits-and-faults.md) names
the validators who were on the wrong side of it.

Next: [10.2 Culprits and faults](./02-culprits-and-faults.md)
