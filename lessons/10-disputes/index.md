# Part 10 · Disputes

<AlbertJudge />

What happens when a guaranteed work-report turns out to be wrong? A trial, held in the
blocks themselves: validators vote, the verdict is recorded forever, and whoever vouched
for a bad report, or voted against the truth, is named an offender and loses their seat.

By the end of this part your client is the court: every verdict, culprit and fault
checked, and every disputes vector accepted or refused just as it should be.

## The big picture

The chain never re-runs a core's work; three guarantors' signatures carry it ([Part
12](../12-guarantees/index.md)). What keeps the three honest is that anyone may check
them afterwards. The paper opens §10 with what this part records, and why it's rare but
needed:

::: gray-paper 10 1-2

#### §10 Disputes, Verdicts and Judgments {#gp-10}

<a id="gp-10-p1"></a>JAM provides a means of recording *judgments*: consequential votes amongst most of the validators over the validity of a *work-report* (a unit of work done within JAM, see section [11](../11-assurances/index.md#gp-11-p1)). Such collections of judgments are known as *verdicts*. JAM also provides a means of registering *offenses*, judgments and guarantees which dissent with an established *verdict*. Together these form the *disputes* system.

<a id="gp-10-p2"></a>The registration of a verdict is not expected to happen very often in practice, however it is an important security backstop for removing and banning invalid work-reports from the processing pipeline as well as removing troublesome keys from the validator set where there is consensus over their malfunction. It also helps coordinate nodes to revert chain-extensions containing invalid work-reports and provides a convenient means of aggregating all offending validators for punishment in a higher-level system.

:::

Who does what, and where:

1. **Off the chain**, validators act as *auditors*: they pick reports, rebuild the package
   from the shards they were sent ([Part 11](../11-assurances/index.md)), run the
   authorizer and refine again on their own machine, and compare. None of that is a block
   importer's job, and none of it is in Milestone 1.
2. **Off the chain**, an auditor who disagrees signs a vote, and others vote too. Two
   thirds of the validators plus one, all signed, on one report is a *verdict*: good, bad
   or wonky (split).
3. **On the chain**, the votes arrive in a block's disputes extrinsic, and every validator
   is the court clerk: it checks every signature and count ([10.1](./01-votes-and-verdicts.md),
   [10.4](./04-bad-verdicts.md), [10.5](./05-bad-culprits-and-faults.md)), records the
   verdict for good, names the offenders ([10.2](./02-culprits-and-faults.md)), and throws
   a report judged bad off its core ([10.3](./03-clearing-the-cores.md)).

| Thing | Made from | Lesson |
| --- | --- | --- |
| verdict | the report's hash, its age (which epoch's validators voted), and two thirds plus one votes, each a yes or no, a validator index and a signature: 5 votes on tiny | [10.1](./01-votes-and-verdicts.md) |
| culprit | the report's hash, a guarantor's key, and the guarantee signature that convicts them | [10.2](./02-culprits-and-faults.md) |
| fault | the report's hash, the vote, the voter's key, and the vote signature that convicts them | [10.2](./02-culprits-and-faults.md) |

The trial happened elsewhere. The block is the court record, and the clerk's whole job is
to check that the signatures on it are real and the arithmetic adds up. The paper says the
same, and what a verdict does to the chain:

::: gray-paper 10 3-7

#### §10 Disputes, Verdicts and Judgments, continued

<a id="gp-10-p3"></a>Judgement statements come about naturally as part of the auditing process and are expected to be positive, further affirming the guarantors' assertion that the work-report is valid. In the event of a negative judgment, then all validators audit said work-report and we assume a verdict will be reached. Auditing and guaranteeing are off-chain processes properly described in sections [14](../03-work-and-reports/index.md#gp-14-1-p1) and [17](../what-runs-where.md#gp-17-p1).

<a id="gp-10-p4"></a>A judgment against a report implies that the chain is already reverted to some point prior to the accumulation of said report, usually forking at the block immediately prior to that at which accumulation happened. The specific strategy for chain selection is described fully in section [19](../what-runs-where.md#gp-19-p1). Authoring a block with a non-positive verdict has the effect of cancelling its imminent accumulation, as can be seen in equation [10.14](./03-clearing-the-cores.md#eq-10-14).

<a id="gp-10-p5"></a>Registering a verdict also has the effect of placing a permanent record of the event on-chain and allowing any offending keys to be placed on-chain both immediately or in forthcoming blocks, again for permanent record.

<a id="gp-10-p6"></a>Having a persistent on-chain record of misbehavior is helpful in a number of ways. It provides a very simple means of recognizing the circumstances under which action against a validator must be taken by any higher-level validator-selection logic. Should JAM be used for a public network such as *Polkadot*, this would imply the <abbr class="gp-term" title="taking part of a validator's staked money as a punishment">slashing</abbr> of the offending validator's stake on the staking <abbr class="gp-term" title="a chain of its own whose blocks Polkadot's validators check, one core's worth at a time">parachain</abbr>.

<a id="gp-10-p7"></a>As mentioned, recording reports found to have a high confidence of invalidity is important to ensure that said reports are not allowed to be resubmitted. Conversely, recording reports found to be valid ensures that additional disputes cannot be raised in the future of the chain.

:::

In plain words: judgments come from auditing, off the chain, and nearly all of them say
"valid". A verdict against a report means validators have already stopped building on
any chain that accumulated it, and a block carrying the verdict also stops the report
being accumulated now ([10.3](./03-clearing-the-cores.md)). The record lasts forever,
for the reasons the paper gives: offenders can be punished by whatever system stakes the
validators (on Polkadot, by taking their stake: slashing), a report found bad must not
come back, and a report found good can't be disputed again. In 0.8.0 the one rule that
reads the three sets is §10's own: a report already in one can't get a second verdict
([10.4](./04-bad-verdicts.md)'s `already_judged`). The offenders' keys are read again
when the next validator set is chosen ([lesson 8.2](../08-safrole/02-rotating-the-validators.md)).

If you build web services: a verdict is a signed incident report, filed once enough
reviewers have reproduced the bug; the good, bad and wonky sets are the incident log,
append-only; and the offenders are the engineers named in it.

**Builds on** [Part 3 · Work and reports](../03-work-and-reports/index.md), [Part 4 ·
Blocks](../04-blocks/index.md), [Part 5 · Hashing and
signatures](../05-hashing-and-signatures/index.md), [Part 6 · State and
Merklization](../06-state-and-merklization/index.md) and [Part 7 · Time and
shuffling](../07-time-and-shuffling/index.md), and on the foundations every part uses,
[Parts 0 to 2](../index.md#lessons).

## At a glance

The whole part on one map. Boxes are what your client holds, and rounded cards are the
steps between them; a dashed card happens outside your client. Tap any card, or walk
through them in order with *next*.

<PartFlow :part="10" />

**Starting here?** At the repo root, `npm run catch-up -- 9.2` makes your client the one
this part starts from; [How to read it](../index.md#how-to-read-it) says more.

- [10.1 Votes and verdicts](./01-votes-and-verdicts.md)
- [10.2 Culprits and faults](./02-culprits-and-faults.md)
- [10.3 Clearing the cores](./03-clearing-the-cores.md)
- [10.4 Bad verdicts](./04-bad-verdicts.md)
- [10.5 Bad culprits and faults](./05-bad-culprits-and-faults.md)

## In the Gray Paper

Open **§10, *Disputes, Verdicts and Judgments***, three pages: §10.1 the state, §10.2 the
extrinsic and every rule this part checks, §10.3 the header's offenders mark. §17 is the
auditing that produces the votes, and §6.3 is where offenders are kept out of the next
validator set.

| The paper says | We say | The vectors say |
| --- | --- | --- |
| ψ ≡ (ψ_G good, ψ_B bad, ψ_W wonky, ψ_O offenders) | the past judgements and the offenders | `psi.good`, `psi.bad`, `psi.wonky`, `psi.offenders` |
| 𝐄_D ≡ (𝐄_V verdicts, 𝐄_C culprits, 𝐄_F faults) | the trial record | `verdicts`, `culprits`, `faults` |
| a verdict (r, a, 𝐣): report hash, epoch index, judgments; a *judgment* (v, i, s) is one signed vote | a verdict: target, age, votes | `target`, `age`, `votes` (`vote`, `index`, `signature`) |
| K(a), the judges' keys: κ if a is this epoch, else λ; ⌊⅔\|𝐤\|⌋ + 1 judgments a verdict | the judges, and two thirds plus one | |
| 𝐯, each verdict boiled down to (r, ⊤ good, ⊥ bad or ∅ wonky) | the outcome | |
| ρ†, the cores after the judgments | the cores with the condemned reports cleared | `rho` |
| the offenders mark 𝐇_O | the header's list of this block's new offenders | `offenders_mark` |

Its defining lines, (10.1), (10.12) and (10.15) to (10.18), each explained symbol by
symbol in [10.A](./gray-paper.md), with every other rule of the part:

::: gray-paper-eq 10.1

<a id="ex-10-1"></a>The Gray Paper's (10.1), [in its place in the paper's words](./01-votes-and-verdicts.md#eq-10-1):

$$
\begin{equation}
\psi \equiv \left(\psi_G, \psi_B, \psi_W, \psi_O\right) \tag{10.1}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

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

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-verdicts" class="gk-wrap">$\mathbf{v}$</span> | bold v | this block's verdicts boiled down: each report's hash with ⊤ good, ⊥ bad or ∅ wonky |
| <span id="gk-in">[$\in$](../symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-sequence">[$\left[\!\left[x\right]\!\right]$](../symbols.md#sequence)</span> | a sequence of | ⟦T⟧ is an array of T; a subscript is its length, :n at most n, n: at least n |
| <span id="gk-hash">$\mathbb{H}$</span> | H | a 32-byte value, usually a hash |
| <span id="gk-set">$\left\{\,x\,\right\}$</span> | the set of | a set: values with no order and no repeats |
| <span id="gk-top">$\top$</span> | top | true |
| <span id="gk-bot">$\bot$</span> | bottom | false, the no of a yes-or-no value |
| <span id="gk-none" class="gk-wrap">$\emptyset$</span> | nothing | ∅: no value at all, like null |
| <span id="gk-sq">[$\left[x\right]$](../symbols.md#sequence)</span> | the sequence | a sequence written out item by item; [ ] is the empty one |
| <span id="gk-build">$\left\{ x \;\middle\vert\; y \right\}$</span> | for each, such that | built by a rule: the left-hand value, for every case the right-hand side allows (a set, or a sequence in order) |
| <span id="gk-xv-reporthash">$r$</span> | r | the hash of the work-report on trial |
| <span id="gk-xv-epochindex">$a$</span> | a | a verdict's epoch: this epoch's index or the one before, saying whose validators judged |
| <span id="gk-xv-judgments" class="gk-wrap">$\mathbf{j}$</span> | bold j | a verdict's judgments: the judges' signed votes, two thirds of the judges plus one |
| <span id="gk-orderedin">$\mathrel{\unicode{x2B40}}$</span> | in order, from | each item of the sequence, in its order |
| <span id="gk-xtverdicts" class="gk-wrap">$\mathbf{E}_V$</span> | E sub V | the block's verdicts: each a report's hash, an epoch, and the judges' signed votes |
| <span id="gk-floor">[$\left\lfloor x\right\rfloor$](../symbols.md#floor)</span> | floor of | rounded down to a whole number |
| <span id="gk-twothirds">${}^{2}\!/_{3}$</span> | two thirds | two thirds: ⌊⅔ · 6⌋ + 1 is 5 judgments on tiny, 683 of 1,023 on full |
| <span id="gk-len">$\left\vert x\right\vert$</span> | the size of | \|x\|: how many items x has, or how many bytes |
| <span id="gk-onethird">${}^{1}\!/_{3}$</span> | one third | one third: ⌊⅓ · 6⌋ is 2 votes on tiny, 341 on full |
| <span id="gk-sum">$\sum$</span> | the sum of | add up what follows, once for each value the subscript ranges over |
| <span id="gk-xvj-validity">$v$</span> | v | a judgment's vote: ⊤ (true) the report is valid, ⊥ (false) it isn't |
| <span id="gk-xvj-judgeindex">$i$</span> | i | the judge's index in the validator set the verdict's epoch picks |
| <span id="gk-xvj-signature">$s$</span> | s | the judge's Ed25519 signature on the vote |

</details>

:::

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

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-cup">$\cup$</span> | union | everything in either side |
| <span id="gk--offenderindex">$f$</span> | f | an offender's Ed25519 key: 32 bytes |
| <span id="gk-xtculprits" class="gk-wrap">$\mathbf{E}_C$</span> | E sub C | the block's culprits: guarantors of a bad report, each with the guarantee they signed |
| <span id="gk-xtfaults" class="gk-wrap">$\mathbf{E}_F$</span> | E sub F | the block's faults: judges who voted against a verdict, each with the vote they signed |

</details>

:::

Read it aloud: "psi is the four-tuple psi-G, psi-B, psi-W, psi-O. Bold v is a sequence of
pairs, a hash and one of true, false or none: for each verdict r, a, j of the verdicts
extrinsic, in order, the pair r and V of a and j. V is true when t is two thirds of the
length of k, rounded down, plus one; false when t is zero; none when t is a third of the
length of k, rounded down; where t is the sum of the judgments' votes v and k is K of
a. The new good set is the old one union every r whose pair says true; the bad set, every
r whose pair says false; the wonky set, every r whose pair says none; and the new
offenders are the old ones union every culprit's key and every fault's key." The sum t
counts the "valid" votes, since the paper counts ⊤ as 1 and ⊥ as 0. Note the paper's
words: a *judgment* is a single validator's signed vote, a *verdict* is the collection,
and *offender* covers both culprits and faults.

**Test yourself:** [Ch. 10 Disputes, Verdicts and Judgments](https://abutlabs.github.io/jam-learning/lasair/exam.html?chapter=ch10-disputes),
self-test cards on JAM learning.
