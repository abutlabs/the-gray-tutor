# Bad reports

**In one sentence:** a report is accepted only if it is a sensible size, was built on a
block the chain remembers, leans on work the chain knows, names real services, and is
new.

One report, to break. Anchor it on a block nobody remembers, change a detail of its
context, or raise its gas, and see which rule refuses it.

<a id="try-it"></a>

<ReportAnchor />

## The idea

[Lesson 12.4](./04-bad-guarantees.md) checked who vouched for each report, and when. The
right three signatures say nothing about the report itself. What could be wrong with it?

The guarantors built the report in-core, looking at a recent block. The chain wasn't
there. So it compares the report's story with what it remembers, and asks five things:

- **A sensible size?** Not too many results, not too much output, not too much gas.
- **Built against a block the chain really had, as it really was?** The report names
  that block: its [*report anchor*](../glossary.md#report-anchor).
- **Leaning on work that exists?** Its prerequisites and its
  [*segment-root lookups*](../glossary.md#segment-root-lookup) must name packages the
  chain knows.
- **Naming real services, with the right code?**
- **New?** A package the chain is already dealing with, one in its
  [*pipeline*](../glossary.md#pipeline), can't be reported again.

This lesson writes those down as ten rules. With them and
[lesson 12.4](./04-bad-guarantees.md)'s, your client agrees with every reports vector.

## What the Gray Paper says

A report's own limits come first, from §11.1.1 and §11.1.4, where the report and its
digests are defined ([lessons 3.3](../03-work-and-reports/03-a-work-report.md) and
[3.2](../03-work-and-reports/02-work-digests.md)), and from the end of §11.4:

::: gray-paper 11.1.1 3-4

#### §11.1.1 Work Report, continued

<a id="gp-11-1-1-p3"></a>We limit the sum of the number of items in the segment-root lookup dictionary and the number of prerequisites to $\mathsf{J} = 8$:

<a id="gp-11-1-1-p4"></a><a id="eq-11-3"></a>

$$
\begin{equation}
\forall \mathbf{r} \in \mathbb{R} : \left\vert\mathbf{r}_{\mathbf{l}}\right\vert + \left\vert(\mathbf{r}_{\mathbf{c}})_{\mathbf{p}}\right\vert \le \mathsf{J} \tag{11.3}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-forall">$\forall$</span> | for all | for every value: ∀c ∈ ℕ_C means for each core c |
| <span id="gk-wrX" class="gk-wrap">$\mathbf{r}$</span> | r | a work-report |
| <span id="gk-in">[$\in$](../symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-workreport" class="gk-wrap">$\mathbb{R}$</span> | R | the set of work-reports: a core's signed receipt for one work-package |
| <span id="gk-len">$\left\vert x\right\vert$</span> | the size of | \|x\|: how many items x has, or how many bytes |
| <span id="gk-wr-srlookup" class="gk-wrap">$\mathbf{l}$</span> | l | the segment-root lookup: for each package whose exports it imports by package hash, that package's segments root |
| <span id="gk-wr-context" class="gk-wrap">$\mathbf{c}$</span> | c | a report's refinement context: the blocks its package was built against, and its prerequisites |
| <span id="gk-wc-prerequisites" class="gk-wrap">$\mathbf{p}$</span> | p | a context's prerequisites: hashes of packages that must be accumulated first |
| <span id="gk-le">$\le$</span> | at most | less than or equal to |
| <span id="gk-Cmaxreportdeps" class="gk-wrap">$\mathsf{J}$</span> | J | the most dependencies a report may have, prerequisites and segment-root lookups together: 8 |

</details>

→ [(11.3) explained](./gray-paper.md#ex-11-3)

:::

::: gray-paper 11.1.4 9-10

#### §11.1.4 Work Digest, continued

<a id="gp-11-1-4-p9"></a>In order to ensure fair use of a block's extrinsic space, work-reports are limited in the maximum total size of the successful refinement output blobs together with the authorizer trace, effectively limiting their overall size:

<a id="gp-11-1-4-p10"></a><a id="eq-11-8"></a><a id="eq-11-9"></a><a id="eq-11-10"></a>

$$
\begin{align}
\forall \mathbf{r} \in \mathbb{R} &:
\left\vert\mathbf{r}_{\mathbf{t}}\right\vert + \sum\limits_{i=0}^{i<\left\vert\mathbf{r}_{\mathbf{d}}\right\vert} L(\mathbf{r}_{\mathbf{d}}\left[i\right]_{\mathbf{l}}) \le \mathsf{W}_R \tag{11.8} \\
L(\mathbf{l} \in \mathbb{B}_{} \cup \mathbb{E}) &\equiv \begin{cases}
\left\vert\mathbf{l}\right\vert &\text{if } \mathbf{l} \in \mathbb{B}_{} \\
0 &\text{otherwise}
\end{cases} \tag{11.9} \\
\mathsf{W}_R &\equiv 48\cdot2^{10} \tag{11.10}
\end{align}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-wr-authtrace" class="gk-wrap">$\mathbf{t}$</span> | t | the authorizer's trace: the blob its code returned when it said yes (`auth_output`) |
| <span id="gk-sum">$\sum$</span> | the sum of | add up what follows, once for each value the subscript ranges over |
| <span id="gk-wr-digests" class="gk-wrap">$\mathbf{d}$</span> | d | the report's digests, one per work-item, 1 to 16 of them (`results`) |
| <span id="gk-subb">[$\left[x\right]$](../symbols.md#sequence)</span> | at | x[i]: the item at index i, or the value at key i |
| <span id="gk-Cmaxreportvarsize" class="gk-wrap">$\mathsf{W}_R$</span> | W sub R | the most bytes a report's outputs may take, the trace and every result together: 48 × 1,024 = 49,152 |
| <span id="gk-blob">[$\mathbb{B}$](../symbols.md#blobs)</span> | B, or B sub n | bytes: any run of them; 𝔹ₙ exactly n of them |
| <span id="gk-cup">$\cup$</span> | union | everything in either side |
| <span id="gk-workerror" class="gk-wrap">$\mathbb{E}$</span> | E | the set of work errors: out of gas, panic, bad exports, oversize, BAD (no code) and BIG (code too big) |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-cdot">$\cdot$</span> | times | multiply |

</details>

→ [(11.8), (11.9), (11.10) explained](./gray-paper.md#ex-11-8)

:::

::: gray-paper 11.4 16-17

#### §11.4 Work Report Guarantees, continued

<a id="gp-11-4-p16"></a>We require that the gas allotted for accumulation of each work-digest in each work-report respects its service's minimum gas requirements. We also require that all work-reports' total allotted accumulation gas is no greater than the overall gas limit $\mathsf{G}_A$:

<a id="gp-11-4-p17"></a><a id="eq-11-33"></a>

$$
\begin{equation}
\forall \mathbf{r} \in \mathbf{I}:
\sum_{\mathbf{d} \in \mathbf{r}_{\mathbf{d}}}\!(\mathbf{d}_{g}) \le \mathsf{G}_A \ \wedge \
\forall \mathbf{d} \in \mathbf{r}_{\mathbf{d}}: \mathbf{d}_{g} \ge \delta\left[\mathbf{d}_{s}\right]_{g} \tag{11.33}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-incomingreports" class="gk-wrap">$\mathbf{I}$</span> | I | the incoming reports: the work-reports this block's guarantees carry |
| <span id="gk-wd-gaslimit">$g$</span> | g | the gas the item's accumulation may use (`accumulate_gas`) |
| <span id="gk-Creportaccgas" class="gk-wrap">$\mathsf{G}_A$</span> | G sub A | the most gas a report's accumulation may be given: 10,000,000 |
| <span id="gk-wedge">$\wedge$</span> | and | both sides are true |
| <span id="gk-ge">$\ge$</span> | is at least | greater than or equal to |
| <span id="gk-accounts" class="gk-wrap">$\delta$</span> | delta | the service accounts: every service's code hash, balance, storage and preimages |
| <span id="gk-wd-serviceindex">$s$</span> | s | the service the item was for, whose accumulate gets the result |

</details>

→ [(11.33) explained](./gray-paper.md#ex-11-33)

:::

Then the report against the chain:

::: gray-paper 11.4.1

#### §11.4.1 Contextual Validity of Reports {#gp-11-4-1}

<a id="gp-11-4-1-p1"></a>For convenience, we define two equivalences $\mathbf{x}$ and $\mathbf{p}$ to be, respectively, the set of all contexts and work-package hashes within the extrinsic:

<a id="gp-11-4-1-p2"></a><a id="eq-11-34"></a>

$$
\begin{equation}
\text{let } \mathbf{x} \equiv \left\{\,  \mathbf{r}_{\mathbf{c}}  \;\middle\vert\;  \mathbf{r} \in \mathbf{I}  \,\right\}\ ,\quad
\mathbf{p} \equiv \left\{\,  (\mathbf{r}_{\mathbf{s}})_{p}  \;\middle\vert\;  \mathbf{r} \in \mathbf{I}  \,\right\} \tag{11.34}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-local-incomingcontexts" class="gk-wrap">$\mathbf{x}$</span> | x | the contexts of this block's incoming reports |
| <span id="gk-set">$\left\{\,x\,\right\}$</span> | the set of | a set: values with no order and no repeats |
| <span id="gk-build">$\left\{ x \;\middle\vert\; y \right\}$</span> | for each, such that | built by a rule: the left-hand value, for every case the right-hand side allows (a set, or a sequence in order) |
| <span id="gk-wr-avspec" class="gk-wrap">$\mathbf{s}$</span> | bold s | a report's availability spec: the package's hash, its bundle's length, and the roots of its pieces and of the segments it exports |
| <span id="gk-as-packagehash">$p$</span> | p | the work-package's hash |

</details>

→ [(11.34) explained](./gray-paper.md#ex-11-34)

<a id="gp-11-4-1-p3"></a>There must be no duplicate work-package hashes (i.e.  two work-reports of the same package). Therefore, we require the <abbr class="gp-term" title="how many items a set has">cardinality</abbr> of $\mathbf{p}$ to be the length of the work-report sequence $\mathbf{I}$:

<a id="gp-11-4-1-p4"></a><a id="eq-11-35"></a>

$$
\begin{equation}
\left\vert\mathbf{p}\right\vert = \left\vert\mathbf{I}\right\vert \tag{11.35}
\end{equation}
$$

→ [(11.35) explained](./gray-paper.md#ex-11-35)

<a id="gp-11-4-1-p5"></a>We require that the anchor block be within the last $\mathsf{H}$ blocks and that its details be correct by ensuring that it appears within our most recent blocks $\beta_H^\dagger$:

<a id="gp-11-4-1-p6"></a><a id="eq-11-36"></a>

$$
\begin{align}
\forall x \in \mathbf{x} : \exists y \in \beta_H^\dagger : x_{a} = y_{h} \wedge x_{s} = y_{s} \wedge x_{b} = y_{b} \wedge x_{n} = y_{t} \!\!\!\!\!\! \tag{11.36}
\end{align}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-exists">[$\exists$](../symbols.md#exists)</span> | there exists | there is at least one value such that what follows holds |
| <span id="gk-recenthistorypostparentstaterootupdate" class="gk-wrap">$\beta_H^\dagger$</span> | beta sub H dagger | the recent blocks midway: with the parent's state root filled in, before this block's entry |
| <span id="gk-wc-anchorhash">$a$</span> | a | the anchor's header hash: a recent block the package was built against |
| <span id="gk-rh-headerhash">$h$</span> | h | a recent block's header hash |
| <span id="gk-wc-anchoraccoutlog">$b$</span> | b | the anchor block's accumulation-output super-peak, the belt's root (`beefy_root`) |
| <span id="gk-wc-anchortime">$n$</span> | n | the anchor block's timeslot |
| <span id="gk-rh-timeslot">$t$</span> | t | a recent block's timeslot |

</details>

→ [(11.36) explained](./gray-paper.md#ex-11-36)

<a id="gp-11-4-1-p7"></a>We require that each <abbr class="gp-term" title="the block whose state an in-core run's lookups saw; it must be final and recent">lookup-anchor</abbr> block be within the last $\mathsf{L}$ timeslots:

<a id="gp-11-4-1-p8"></a><a id="eq-11-37"></a>

$$
\begin{align}
\forall x \in \mathbf{x} :\ x_{t} \ge \mathbf{H}_{T} - \mathsf{L} \tag{11.37}
\end{align}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-H" class="gk-wrap">$\mathbf{H}$</span> | H | this block's header; 𝐇_T is its timeslot, 𝐇_P its parent's hash |
| <span id="gk--timeslot">$T$</span> | T | a header's timeslot: 𝐇_T is the slot this block was made for |
| <span id="gk-Cmaxlookupanchorage" class="gk-wrap">$\mathsf{L}$</span> | L | the oldest a lookup anchor may be: 14,400 slots, 24 hours |

</details>

→ [(11.37) explained](./gray-paper.md#ex-11-37)

<a id="gp-11-4-1-p9"></a>We also require that we have a record of it; this is one of the few conditions which cannot be checked purely with on-chain state and must be checked by virtue of retaining the series of the last $\mathsf{L}$ headers as the ancestor set $\mathbf{A}$. Since it is determined through the header chain, it is still deterministic and calculable. Formally:

<a id="gp-11-4-1-p10"></a><a id="eq-11-38"></a>

$$
\begin{equation}
\forall x \in \mathbf{x} : \exists h, h' \in \mathbf{A} : \bigwedge \left\{ \begin{aligned}
h_{T} &= x_{t} \\
\mathcal{H}\left(h\right) &= x_{l} \\
h'_{P} &= \mathcal{H}\left(h\right) \\
h'_{R} &= x_{r}
\end{aligned} \right. \tag{11.38}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-ancestors" class="gk-wrap">$\mathbf{A}$</span> | A | the ancestors: this header, its parent, its parent's parent, and so on back to genesis |
| <span id="gk-bigwedge">$\bigwedge$</span> | all of | every one of the conditions under it is true |
| <span id="gk-abracegroup">$\left\{ \begin{aligned}x\end{aligned} \right.$</span> | as follows | a brace grouping lines that hold together: for a function, its type on top, then what each input becomes |
| <span id="gk-blake">$\mathcal{H}\left(x\right)$</span> | H of | the Blake2b hash of what's in the brackets: 32 bytes |
| <span id="gk-wc-lookupanchorhash">$l$</span> | l | the lookup anchor's header hash: the block whose state code is fetched from |
| <span id="gk--parent">$P$</span> | P | a header's parent hash: 𝐇_P is the hash of the header before it, 32 bytes |
| <span id="gk--priorstateroot">$R$</span> | R | a header's prior state root: 𝐇_R is the root of the state before this block, 32 bytes |
| <span id="gk-wc-lookupanchorpoststate">$r$</span> | r | the lookup anchor's state root |

</details>

→ [(11.38) explained](./gray-paper.md#ex-11-38)

<a id="gp-11-4-1-p11"></a>We require that the work-package of the report not be the work-package of some other report made in the past. We ensure that the work-package not appear anywhere within our pipeline. Formally:

<a id="gp-11-4-1-p12"></a><a id="eq-11-39"></a><a id="eq-11-40"></a><a id="eq-11-41"></a>

$$
\begin{align}
&\text{let } \mathbf{q} = \left\{\,
(\mathbf{r}_{\mathbf{s}})_{p}
\;\middle\vert\;
\left(\mathbf{r}, \mathbf{d}\right) \in \overparen{\omega}
\,\right\} \tag{11.39} \\
&\text{let } \mathbf{a} = \left\{\,
(((\mathbf{a}_{\mathbf{g}})_{\mathbf{r}})_{\mathbf{s}})_{p}
\;\middle\vert\;
\mathbf{a} \in \rho, \mathbf{a} \ne \emptyset
\,\right\} \tag{11.40} \\
&\forall p \in \mathbf{p},
p \not\in \bigcup_{x \in \beta_H}\mathcal{K}\left(x_{\mathbf{p}}\right)
\cup
\bigcup_{x \in \xi}x
\cup \mathbf{q}
\cup \mathbf{a} \tag{11.41}
\end{align}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-concatall">$\overparen{x}$</span> | all joined | every sequence in it, joined end to end into one |
| <span id="gk-ready" class="gk-wrap">$\omega$</span> | omega | the ready queue: available reports waiting on others before they can accumulate |
| <span id="gk-aaX" class="gk-wrap">$\mathbf{a}$</span> | a | one core's entry in ρ: a pending report and its slot |
| <span id="gk-aa-guarantee" class="gk-wrap">$\mathbf{g}$</span> | bold g | the guarantee a core's pending report came with: the report and its guarantors' signatures |
| <span id="gk-availassignments" class="gk-wrap">$\rho$</span> | rho | the pending reports: for each core, the report waiting to be made available, and when it came |
| <span id="gk-ne">$\ne$</span> | is not | not equal |
| <span id="gk-none" class="gk-wrap">$\emptyset$</span> | nothing | ∅: no value at all, like null |
| <span id="gk-bigcup">$\bigcup$</span> | the union over | everything in any of the sets it ranges over, together |
| <span id="gk-recenthistory" class="gk-wrap">$\beta_H$</span> | beta sub H | the last H = 8 blocks: each one's header hash, state root, belt peak and reported packages |
| <span id="gk-keys">$\mathcal{K}\left(x\right)$</span> | K of | a dictionary's keys |
| <span id="gk-accumulated" class="gk-wrap">$\xi$</span> | xi | the accumulated history: the packages accumulated in each of the last E slots |

</details>

→ [(11.39), (11.40), (11.41) explained](./gray-paper.md#ex-11-39)

<a id="gp-11-4-1-p13"></a>We require that the prerequisite work-packages, if present, and any work-packages mentioned in the segment-root lookup, be either in the extrinsic or in our recent history.

<a id="gp-11-4-1-p14"></a><a id="eq-11-42"></a>

$$
\begin{align}
&\begin{aligned}
&\forall \mathbf{r} \in \mathbf{I},
\forall p \in (\mathbf{r}_{\mathbf{c}})_{\mathbf{p}} \cup
\mathcal{K}\left(\mathbf{r}_{\mathbf{l}}\right) :\\
&\quad p \in \mathbf{p} \cup \left\{\,
x \;\middle\vert\; x \in \mathcal{K}\left(b_{\mathbf{p}}\right),\, b \in \beta_H\,\right\}
\end{aligned} \tag{11.42}
\end{align}
$$

→ [(11.42) explained](./gray-paper.md#ex-11-42)

<a id="gp-11-4-1-p15"></a>We require that any segment roots mentioned in the segment-root lookup be verified as correct based on our recent work-package history and the present block:

<a id="gp-11-4-1-p16"></a><a id="eq-11-43"></a><a id="eq-11-44"></a>

$$
\begin{align}
&\text{let } \mathbf{p} = \left\{\,
\left(
((g_{\mathbf{r}})_{\mathbf{s}})_{p}
\mapsto
((g_{\mathbf{r}})_{\mathbf{s}})_{e}
\right)
\;\middle\vert\;
g \in \mathbf{E}_G
\,\right\} \tag{11.43} \\
&\forall \mathbf{r} \in \mathbf{I}: \mathbf{r}_{\mathbf{l}} \subseteq \mathbf{p} \cup \bigcup_{b \in \beta_H} b_{\mathbf{p}} \tag{11.44}
\end{align}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-kv">$\left(x \mapsto y\right)$</span> | k maps to v | a dictionary entry: key k, value v |
| <span id="gk-as-segroot">$e$</span> | e | the root of the segments a package exports |
| <span id="gk-xtguarantees" class="gk-wrap">$\mathbf{E}_G$</span> | E sub G | the guarantees bag: work-reports with their guarantors' signatures, one per core at most |
| <span id="gk-subseteq">$\subseteq$</span> | is a subset of | everything in the left is in the right |

</details>

→ [(11.43), (11.44) explained](./gray-paper.md#ex-11-43)

<a id="gp-11-4-1-p17"></a>(Note that these checks leave open the possibility of accepting work-reports in apparent dependency loops. We do not consider this a problem: the pre-accumulation stage effectively guarantees that accumulation never happens in these cases and the reports are simply ignored.)

<a id="gp-11-4-1-p18"></a>Finally, we require that all work-digests within the extrinsic predicted the correct code hash for their corresponding service:

<a id="gp-11-4-1-p19"></a><a id="eq-11-45"></a>

$$
\begin{align}
\forall \mathbf{r} \in \mathbf{I}, \forall \mathbf{d} \in \mathbf{r}_{\mathbf{d}} : \mathbf{d}_{c} = \delta\left[\mathbf{d}_{s}\right]_{c} \tag{11.45}
\end{align}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-wd-codehash">$c$</span> | c | the service's code hash as the guarantors saw it; it must match the chain's |

</details>

→ [(11.45) explained](./gray-paper.md#ex-11-45)

:::

The limits above and §11.4.1 (*Contextual Validity of Reports*) make ten rules and
fourteen checks, in two groups.

**The report on its own:**

1. One to sixteen results (I = 16). (`missing_work_results`)
2. At most eight dependencies, prerequisites and lookups together (J = 8).
   (`too_many_dependencies`)
3. Its outputs, the authorizer's and every result's, fit in 48 KiB (W_R).
   (`work_report_too_big`)
4. Its results ask for at most 10,000,000 accumulation gas in all (G_A).
   (`work_report_gas_too_high`)

**The report against the chain:**

5. A new package: not twice in this block, not in the recent blocks' reported packages,
   not in the pipeline. (`duplicate_package`)
6. Its anchor is one of the recent blocks (β_H†, [Part 9](../09-recent-history/index.md)'s history after this block's
   first step). (`anchor_not_recent`)
7. And matches it: the same state root (`bad_state_root`), belt root
   (`bad_beefy_mmr_root`) and slot (`bad_anchor_slot`).
8. Its prerequisites are packages this block or a recent one reported.
   (`dependency_missing`)
9. Every lookup names such a package, with that package's real segments root.
   (`segment_root_lookup_invalid`)
10. Every result names a service that exists (`bad_service_id`), with that service's
    code hash (`bad_code_hash`), and asks for at least the service's minimum gas
    (`service_item_gas_too_low`).

Three words in those rules:

- **The anchor** (rules 6 and 7) is the recent block the report was built against: its
  hash, slot, state root and belt root, all in the report's context.
- **A lookup** (rule 9) is one entry of the report's segment-root lookup: a work-package
  whose exported segments it imported, with the root of those segments.
- **The pipeline** (rule 5) is every package the chain is already dealing with:
  accumulated recently, waiting in the ready queue, or pending on a core. The vectors
  hand these over as `known_packages`.

Rule 8 and the first half of rule 9 are one rule in the Gray Paper: every prerequisite
and every looked-up package must be known. The second half, the right segments root, is
a rule of its own, the equation after it. The vectors give a looked-up package that
isn't known its own name too, `segment_root_lookup_invalid`, so your client checks rules
8 and 9 separately.

This lesson leaves two more rules out. The report's *lookup* anchor must be at most L
slots old, and must be one of the last L blocks' headers. Checking the second needs the
header chain itself, which no state holds, and no vector tests either. They wait in
[HARDENING.md](https://github.com/abutlabs/the-gray-tutor/blob/main/HARDENING.md).

Break the rules one at a time on [the report at the top](#try-it).

## The tests

The vectors give the recent blocks, the services and the pipeline too:

**Replace in** `test/guarantors.test.ts`

```ts
/** A reports test vector: the parts of it this lesson uses. */
type ReportsVector = {
  input: { guarantees: unknown[]; slot: number; known_packages: string[] };
  pre_state: {
    curr_validators: unknown[];
    prev_validators: unknown[];
    entropy: string[];
    offenders: string[];
    avail_assignments: unknown;
    auth_pools: string[][];
    recent_blocks: { history: unknown[] };
    accounts: { id: number; data: { service: { code_hash: string; min_item_gas: number } } }[];
  };
  post_state: { avail_assignments: unknown };
  output: { err?: string; ok?: { reporters: string[]; reported: unknown[] } };
};
```

**Add to** `test/guarantors.test.ts`

```ts
import { reportError } from "../src/guarantors.ts";
import { RecentBlock } from "../src/history.ts";

/** What lesson 12.5's rules say of reports vector `name`: null (they pass) or the rule broken. */
function reportVerdict(name: string) {
  const { input, pre_state } = vectorJson(name) as ReportsVector;
  const reports = GuaranteesExtrinsic.fromJson(input.guarantees).map((g) => g.report);
  const history = pre_state.recent_blocks.history.map((b) => RecentBlock.fromJson(b));
  const services = new Map(pre_state.accounts.map(({ id, data: { service } }) => [id, {
    code_hash: fromHex(service.code_hash),
    min_item_gas: BigInt(service.min_item_gas),
  }]));
  return reportError(reports, history, new Set(input.known_packages), services);
}

test("a report anchored on a block nobody remembers is refused", () => {
  const broken: string | null = reportVerdict("stf/reports/tiny/anchor_not_recent-1.json");
  assert.equal(broken, "anchor_not_recent");
});

for (const config of [TINY, FULL]) {
  for (const name of vectorFiles(`stf/reports/${config.name}`)) {
    test(`${name}: accepted or refused, as the vector says`, () => {
      const { err } = (vectorJson(name) as ReportsVector).output;
      const broken: string | null = guaranteeVerdict(config, name) ?? reportVerdict(name);
      const expected: string | null = err ?? null;
      assert.equal(broken, expected);
    });
  }
}
```

The last test is the whole reports step: [lesson 12.4](./04-bad-guarantees.md)'s rules first, then these. Every
reports vector, tiny and full, must come out exactly as the vector says: accepted, or
refused for the very same reason. The services come straight from the JSON. A report
only needs a service's code hash and minimum gas, and [Part 14](../14-services/index.md) builds the full service
account later.

A stub that passes every report, with the four limits and `ServiceNeeds` already in
place:

**Add to** `src/guarantors.ts`

```ts
import type { WorkDigest } from "./work.ts";
import type { RecentBlock } from "./history.ts";

/** I: the most work items (so digests) a report may carry. */
const MAX_DIGESTS = 16;
/** J: the most dependencies (prerequisites and segment-root lookups) a report may have. */
const MAX_DEPENDENCIES = 8;
/** W_R: the most bytes a report's outputs (its digests' and its authorizer's) may take. */
const MAX_OUTPUT = 48 * 1024;
/** G_A: the most accumulation gas a report may ask for, all its digests together. */
const REPORT_GAS = 10_000_000n;

/** What a report needs of a service: its code hash, and the least gas it accumulates on. */
export type ServiceNeeds = { code_hash: Bytes; min_item_gas: bigint };

export function reportError(
  reports: WorkReport[], // 𝐈
  history: RecentBlock[],
  known: Set<string>,
  services: Map<number, ServiceNeeds>,
): string | null {
  return null;
}
```

**Run, expect it to fail**

```sh
npm test
```

```text
...
✖ a report anchored on a block nobody remembers is refused (1.3ms)
...
ℹ tests 386
ℹ suites 0
ℹ pass 353
ℹ fail 33
...
test at test/guarantors.test.ts:209:1
✖ a report anchored on a block nobody remembers is refused (1.3ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected

  + null
  - 'anchor_not_recent'
...
```

Thirty-three reds this time: the anchor test, and the sixteen vectors at each size whose
guarantees are fine but whose reports aren't. [Lesson 12.4](./04-bad-guarantees.md)'s refusals are green
already, because the full check asks the guarantee rules first.

## The code

**Replace in** `src/guarantors.ts`

```ts
/**
 * Are a block's reports valid (GP §11)? The first rule they break, under the test vectors'
 * name for it, or null if they keep every rule. `history` is the recent blocks (β_H†),
 * `known` the packages already in the pipeline (accumulated, waiting, or on a core: the
 * vectors' `known_packages`), and `services` what each service needs, by id.
 */
export function reportError(
  reports: WorkReport[], // 𝐈
  history: RecentBlock[],
  known: Set<string>,
  services: Map<number, ServiceNeeds>,
): string | null {
  const incoming = new Map(reports.map((r) => [toHex(r.package_spec.hash), r])); // 𝐩
  const reported = new Map(history.flatMap((b) => b.reported.map((p) => [toHex(p.hash), p])));
  const rootOf = (hash: Bytes) =>
    incoming.get(toHex(hash))?.package_spec.exports_root ?? reported.get(toHex(hash))?.exports_root;
  const anchor = (r: WorkReport) =>
    history.find((b) => toHex(b.header_hash) === toHex(r.context.anchor));
  const digests = reports.flatMap((r) => r.results);
  const outputOf = (d: WorkDigest) => ("ok" in d.result ? d.result.ok.length : 0);
  const output = (r: WorkReport) =>
    r.auth_output.length + r.results.reduce((n, d) => n + outputOf(d), 0);
  // the report on its own
  const someWork = (r: WorkReport) => r.results.length >= 1 && r.results.length <= MAX_DIGESTS;
  const fewDependencies = (r: WorkReport) =>
    r.context.prerequisites.length + r.segment_root_lookup.length <= MAX_DEPENDENCIES;
  const gas = (r: WorkReport) => r.results.reduce((n, d) => n + d.accumulate_gas, 0n);
  // the report against the chain
  const fresh = (hash: string) => !reported.has(hash) && !known.has(hash);
  const anchored = (r: WorkReport) => anchor(r) !== undefined;
  const sameRoot = (r: WorkReport) => toHex(anchor(r)!.state_root) === toHex(r.context.state_root);
  const sameBelt = (r: WorkReport) => toHex(anchor(r)!.beefy_root) === toHex(r.context.beefy_root);
  const sameSlot = (r: WorkReport) => anchor(r)!.slot === r.context.anchor_slot;
  const prerequisitesKnown = (r: WorkReport) =>
    r.context.prerequisites.every((p) => rootOf(p) !== undefined);
  const lookupsRight = (r: WorkReport) =>
    r.segment_root_lookup.every((l) => {
      const root = rootOf(l.work_package_hash);
      return root !== undefined && toHex(root) === toHex(l.segment_tree_root);
    });
  if (!reports.every(someWork)) return "missing_work_results";
  if (!reports.every(fewDependencies)) return "too_many_dependencies";
  if (!reports.every((r) => output(r) <= MAX_OUTPUT)) return "work_report_too_big";
  if (!reports.every((r) => gas(r) <= REPORT_GAS)) return "work_report_gas_too_high";
  if (incoming.size < reports.length || ![...incoming.keys()].every(fresh)) {
    return "duplicate_package";
  }
  if (!reports.every(anchored)) return "anchor_not_recent";
  if (!reports.every(sameRoot)) return "bad_state_root";
  if (!reports.every(sameBelt)) return "bad_beefy_mmr_root";
  if (!reports.every(sameSlot)) return "bad_anchor_slot";
  if (!reports.every(prerequisitesKnown)) return "dependency_missing";
  if (!reports.every(lookupsRight)) return "segment_root_lookup_invalid";
  if (!digests.every((d) => services.has(d.service_id))) return "bad_service_id";
  const service = (d: WorkDigest) => services.get(d.service_id)!;
  if (!digests.every((d) => toHex(service(d).code_hash) === toHex(d.code_hash))) {
    return "bad_code_hash";
  }
  if (!digests.every((d) => d.accumulate_gas >= service(d).min_item_gas)) {
    return "service_item_gas_too_low";
  }
  return null;
}
```

Fourteen checks, in the order above. `rootOf` looks a package up first in this block,
then in the recent blocks. That one helper serves rules 8 and 9: a prerequisite needs any
root, a lookup the right one. The four limits get names, so the numbers say what they
are.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ the reported packages: each one's hash and exports root, sorted by hash (1169.6ms)
...
✔ a report anchored on a block nobody remembers is refused (0.6ms)
...
ℹ tests 386
ℹ suites 0
ℹ pass 386
ℹ fail 0
...
reported 386 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791734631104
...
```

## Watch it

`bin/check-guarantees.ts` checks both lessons' rules now, and mentions the vector only
when the two disagree:

**Rewrite** `bin/check-guarantees.ts`

```ts
// Checks the guarantees and reports of every reports test vector of one size against the
// rules (the guarantees' first, then the reports'), and shows each verdict next to the
// vector's: accepted, or the first rule broken.
// Usage: npm run check-guarantees [tiny or full], tiny if not given

import { readdirSync, readFileSync } from "node:fs";
import { GuaranteesExtrinsic } from "../src/block.ts";
import { fromHex } from "../src/bytes.ts";
import { FULL, TINY } from "../src/config.ts";
import { PendingReports } from "../src/cores.ts";
import type { ServiceNeeds } from "../src/guarantors.ts";
import { guaranteeError, guarantorAssignments, reportError } from "../src/guarantors.ts";
import { RecentBlock } from "../src/history.ts";
import { Run } from "../src/obs.ts";
import { ValidatorKey } from "../src/state.ts";

type Service = { code_hash: string; min_item_gas: number };

const config = process.argv[2] === "full" ? FULL : TINY;
const dir = `../vectors/stf/reports/${config.name}`;
const keys = (list: unknown[]) => list.map((key) => ValidatorKey.fromJson(key));
const run = new Run("guarantee-check");
for (const file of readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
  const { input, pre_state: pre, output } = JSON.parse(readFileSync(`${dir}/${file}`, "utf8"));
  const assignments = guarantorAssignments(config, input.slot, pre.entropy.map(fromHex),
    keys(pre.curr_validators), keys(pre.prev_validators), pre.offenders.map(fromHex));
  const guarantees = GuaranteesExtrinsic.fromJson(input.guarantees);
  const cores = PendingReports(config).fromJson(pre.avail_assignments);
  const pools = pre.auth_pools.map((pool: string[]) => pool.map(fromHex));
  const history = pre.recent_blocks.history.map((b: unknown) => RecentBlock.fromJson(b));
  const services = new Map<number, ServiceNeeds>();
  for (const { id, data } of pre.accounts as { id: number; data: { service: Service } }[]) {
    const { code_hash, min_item_gas } = data.service;
    services.set(id, { code_hash: fromHex(code_hash), min_item_gas: BigInt(min_item_gas) });
  }
  const error =
    guaranteeError(config, guarantees, input.slot, assignments, cores, pools,
      pre.curr_validators.length) ??
    reportError(guarantees.map((g) => g.report), history, new Set(input.known_packages), services);
  const ours = error ?? "accepted";
  const theirs = output.err ?? "accepted";
  const name = file.replace(".json", "");
  console.log(`${name}: ${ours}${ours === theirs ? "" : ` (the vector says ${theirs})`}`);
  run.event("vector", { name, ours, theirs, agree: ours === theirs });
}
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

**What flows through it.** Every tiny reports vector in turn. Two of the refused ones,
trimmed to the fields the report rules compare:

::: code-group

```json [what goes in]
{
  "anchor_not_recent-1.json": {
    "input.guarantees[0].report.context": { "anchor": "0x6900f39559…", "anchor_slot": 12 },
    "pre_state.recent_blocks.history[*].header_hash": [
      "0xa4551aeaa3…", "0x7ea9180615…", "0x1cf21d2cad…", "0xc21212481c…",
      "0x16bda47e5a…", "0x0717b89329…", "0x39cb518983…", "0x37fe33f96d…"
    ]
  },
  "bad_code_hash-1.json": {
    "input.guarantees[0].report.results": [{ "service_id": 42, "code_hash": "0x7a3a6a6011…" }],
    "pre_state.accounts": [{ "id": 42, "data.service.code_hash": "0x6470fd2198…" }]
  }
}
```

```ts [what it computes]
// what reportError compares for each vector's one report, in its order of rules
const computed = {
  "anchor_not_recent-1": {
    anchor: "0x6900f39559…", // the block the report was built on
    recent: 8, // β's header hashes, the last 8 blocks: none is the anchor
    anchored: false, // so the first context rule fails
    error: "anchor_not_recent",
  },
  "bad_code_hash-1": {
    digest: { service_id: 42, code_hash: "0x7a3a6a6011…" }, // the code the work was refined with
    service: { code_hash: "0x6470fd2198…" }, // the code service 42 has in the state
    same: false, // the anchor and the other context rules passed; this one doesn't
    error: "bad_code_hash",
  },
};
```

```text [what comes out]
anchor_not_recent-1: anchor_not_recent
bad_code_hash-1: bad_code_hash
```

:::

The first report names an anchor block that isn't one of the eight β remembers: it was
built on a chain this one doesn't know. The second passes every context rule but says it
ran service 42's code `0x7a3a6a6011…`, while the state has `0x6470fd2198…`. Either way
the line agrees with the vector, so no "the vector says" follows it.

**Run**

```sh
npm run check-guarantees
```

```text
anchor_not_recent-1: anchor_not_recent
bad_anchor_slot-1: bad_anchor_slot
bad_beefy_mmr-1: bad_beefy_mmr_root
bad_code_hash-1: bad_code_hash
bad_core_index-1: bad_core_index
bad_erasure_shards-1: bad_erasure_shards
bad_service_id-1: bad_service_id
bad_signature-1: bad_signature
bad_state_root-1: bad_state_root
bad_validator_index-1: bad_validator_index
banned_validator_guarantee-1: banned_validator
big_work_report_output-1: accepted
core_engaged-1: core_engaged
...
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=guarantee-check-1791734639549
```

Forty-four vectors, and not one "the vector says": your client's reports step agrees with
all of them. `npm run check-guarantees full` says the same of the full ones. The
*Guarantee checks* panel, on **4 · Checks**, keeps the list.

![Guarantee checks panel](./images/05-guarantee-checks.png)

## The scoreboard

Every rule the reports vectors check, your client checks. Run them whole: the block
refused for the vector's reason, or accepted. An accepted block is checked further: ρ′
with the new reports on their cores, and the output, the reporters 𝐆 and the reported
packages. The rest of a reports vector's state is only read, or so it looks:

**Add to** `test/families.ts`

```ts
import { GuaranteesExtrinsic } from "../src/block.ts";
import { placeReports, reportedPackages } from "../src/cores.ts";
import { assignmentFor, guaranteeError, guarantorAssignments, reportError, reporters, signerKeys } from "../src/guarantors.ts";
import { RecentBlock } from "../src/history.ts";

type ReportsInput = { guarantees: unknown[]; slot: number; known_packages: string[] };
type ReportsState = {
  curr_validators: unknown[];
  prev_validators: unknown[];
  entropy: string[];
  offenders: string[];
  avail_assignments: unknown;
  auth_pools: string[][];
  recent_blocks: { history: unknown[] };
  accounts: { id: number; data: { service: { code_hash: string; min_item_gas: number } } }[];
};

/** A reports vector: ρ′, the reporters and the reported packages, or the rule broken. */
function checkReports(name: string) {
  const vector = vectorJson(name) as StfVector<ReportsInput, ReportsState>;
  const config = configOf(name);
  const { input, pre_state: pre } = vector;
  const offenders = pre.offenders.map(fromHex);
  const [active, previous] = [keys(pre.curr_validators), keys(pre.prev_validators)];
  const entropy = pre.entropy.map(fromHex);
  const assignments =
    guarantorAssignments(config, input.slot, entropy, active, previous, offenders);
  const guarantees = GuaranteesExtrinsic.fromJson(input.guarantees);
  const cores = PendingReports(config).fromJson(pre.avail_assignments);
  const pools = pre.auth_pools.map((pool) => pool.map(fromHex));
  const reports = guarantees.map((g) => g.report);
  const history = pre.recent_blocks.history.map((b) => RecentBlock.fromJson(b));
  const services = new Map(pre.accounts.map(({ id, data: { service } }) => [id, {
    code_hash: fromHex(service.code_hash),
    min_item_gas: BigInt(service.min_item_gas),
  }]));
  const known = new Set(input.known_packages);
  const count = active.length;
  const error = guaranteeError(config, guarantees, input.slot, assignments, cores, pools, count) ??
    reportError(reports, history, known, services);
  sameError(error, vector);
  if (error) return unchanged(vector, []);
  const after = placeReports(cores, guarantees, input.slot);
  const expected = PendingReports(config).fromJson(vector.post_state.avail_assignments);
  assert.deepEqual(after, expected, "avail_assignments differs");
  const signers = guarantees.flatMap((g) =>
    signerKeys(g, assignmentFor(config, input.slot, g.slot, assignments).keys));
  const ok = vector.output?.ok as { reporters: string[]; reported: unknown[] };
  assert.deepEqual(reporters(signers).map(toHex), ok.reporters, "reporters differs");
  const reported = reportedPackages(guarantees).map((p) => ({
    work_package_hash: toHex(p.hash),
    segment_tree_root: toHex(p.exports_root),
  }));
  assert.deepEqual(reported, ok.reported, "reported differs");
  unchanged(vector, ["avail_assignments"]);
}
```

**Replace in** `test/families.ts`

```ts
/** Every family your client runs so far. */
export const FAMILIES: Family[] = [
  { folders: ["codec/tiny", "codec/full"], check: checkCodec },
  { folders: ["trie"], check: checkTrie },
  { folders: ["shuffle"], check: checkShuffle },
  { folders: ["stf/safrole/tiny", "stf/safrole/full"], check: checkSafrole },
  { folders: ["stf/history/tiny", "stf/history/full"], check: checkHistory },
  { folders: ["stf/disputes/tiny", "stf/disputes/full"], check: checkDisputes },
  { folders: ["stf/assurances/tiny", "stf/assurances/full"], check: checkAssurances },
  { folders: ["stf/reports/tiny", "stf/reports/full"], check: checkReports },
];
```

One of the refusals the milestone counts, a guarantee for a core that does not exist:

::: code-group

```json [what goes in]
{
  "vector": "vectors/stf/reports/tiny/bad_core_index-1.json",
  "input": {
    "slot": 14,
    "guarantees": [
      {
        "slot": 14,
        "report": {
          "core_index": 3,
          "package_spec.hash": "0x63c03371b9dad9f1c60473ec0326c970984e9c90c0b5ed90eba6ada471ba4d86"
        },
        "signatures": [
          {
            "validator_index": 0,
            "signature": "0xed25d1700e…"
          },
          {
            "validator_index": 2,
            "signature": "0xd979bfe3b6…"
          },
          {
            "validator_index": 3,
            "signature": "0x434cf33017…"
          }
        ]
      }
    ]
  },
  "output": {
    "err": "bad_core_index"
  }
}
```

```text [console]
stf/reports              62 of 92
230 of 1,428 vectors pass.
```

:::

*Run whole* means every rule on a report is checked, and a vector that should be refused
only counts when it is refused for its own reason: here core 3 on tiny, which has only
cores 0 and 1. The row's `62 of 92` is the 62 refusals. The other 30 vectors are
accepted, and wait for the statistics.

**Run**

```sh
npm run typecheck
npm run scoreboard
```

```text
...
The official test vectors, each run whole by your client:

codec                    30 of 30  ✔
erasure                  not run yet (12)
shuffle                    1 of 1  ✔
stf/accumulate           not run yet (126)
stf/assurances           22 of 22  ✔
stf/authorizations       not run yet (6)
stf/disputes             60 of 60  ✔
stf/history                8 of 8  ✔
stf/preimages            not run yet (16)
stf/reports              62 of 92
    ✘ stf/reports/full/big_work_report_output-1.json: cores_statistics changed
    ✘ stf/reports/full/different_core_same_guarantors-1.json: cores_statistics changed
    ✘ stf/reports/full/high_work_report_gas-1.json: cores_statistics changed
    … and 27 more
stf/safrole              46 of 46  ✔
stf/statistics           not run yet (8)
traces/fallback          not run yet (100)
traces/fuzzy             not run yet (200)
traces/fuzzy_light       not run yet (200)
traces/preimages         not run yet (100)
traces/preimages_light   not run yet (100)
traces/safrole           not run yet (100)
traces/storage           not run yet (100)
traces/storage_light     not run yet (100)
trie                       1 of 1  ✔

230 of 1,428 vectors pass.
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=scoreboard-1791939267270
```

62 of 92: every refused block, and not one accepted block. The board says why:
`cores_statistics changed`. A block that seats reports also counts work for the
statistics, each core's and each service's, and the vector's state holds those counts
too. Your client doesn't keep statistics yet. Every part it does make matches. The
accepted 30 cross the line in [lesson 18.2](../18-statistics/02-what-cores-and-services-did.md), when it does.

> [!TIP] Milestone
> **Every bad report refused.** All 62 refusals in the reports vectors, tiny
> and full, for the vector's own reason. The accepted 30 wait for the statistics.

<details>
<summary>lasair: a lookup, in <code>conformance/reports_stf.ml</code></summary>

```ocaml
                (match find_exports_root entry.work_package_hash with
                 | None -> true  (* Not in history = in current batch, can't verify yet *)
                 | Some exports_root -> Bytes.equal entry.segment_tree_root exports_root)
```

Rule 9 in lasair's reports harness. For a looked-up package from the recent blocks, it
checks the segments root, just like yours. For one reported in this same block, it says
"can't verify yet" and lets it through. But the root is right there, in that report's
`package_spec`, and the Gray Paper checks it: its lookup map is this block's packages and
the recent ones'. Your `rootOf` checks both. No vector has a wrong root for a package in
the same block, which is how a gap like this can sit unnoticed.

</details>

## Check your understanding

::: check
**A report's anchor is one of the recent blocks, but its state root differs from that block's. What happens?**

- [ ] Accepted: the anchor is recent, and that's what matters
  > No: it must match the block too, as the block really was.
- [ ] Refused, `anchor_not_recent`
  > No: the anchor is found among the recent blocks. It's its details that are wrong.
- [x] Refused, `bad_state_root`
  > Yes: rule 7. Same state root, belt root and slot as the recent block it names.

**Why does the chain check a report's anchor at all?**

- [x] To know the report was built against a block this chain really had, as it really was
  > Yes: an anchor none of the recent blocks matches means the report was built on a
  > chain this one doesn't know.
- [ ] To find the guarantors who signed it
  > No: the signers answer to the guarantee's slot and the assignments
  > ([lesson 12.4](./04-bad-guarantees.md)). The anchor is about the report's context.
- [ ] To run the report's work again against that block
  > No: these rules run nothing. They compare what the report says with what the chain
  > remembers.

**A package was reported two blocks ago. A guarantee reports it again. What happens?**

- [ ] Accepted, if new guarantors sign it
  > No: who signs doesn't matter. The package isn't new.
- [x] Refused, `duplicate_package`
  > Yes: rule 5. It's in the recent blocks' reported packages, kept for exactly this
  > ([lesson 9.2](../09-recent-history/02-recent-blocks.md)).
- [ ] Accepted, once the first report has been accumulated
  > No: a package accumulated recently is in the pipeline, and refused too.

**A report looks up segments from package A, reported in this same block. Is the lookup's segments root checked?**

- [x] Yes: it must match A's exports root, from A's report in this block
  > Yes: the Gray Paper's lookup map is this block's packages and the recent ones'.
  > `rootOf` looks here first.
- [ ] No: a package in the same block can't be checked yet
  > No: its root is right there, in that report's `package_spec`.
- [ ] Refused: a lookup may only name a package from an earlier block
  > No: this block's packages count, for prerequisites and lookups both.

**A report's two results ask for 6,000,000 and 5,000,000 accumulation gas. What happens?**

- [ ] Accepted: each is under 10,000,000
  > No: G_A limits the results together, not each one.
- [ ] Accepted, if each meets its service's minimum gas
  > No: that's a floor, rule 10. G_A is a ceiling, and this report is over it.
- [x] Refused, `work_report_gas_too_high`: 11,000,000 is over G_A
  > Yes: rule 4. All of a report's results together get at most 10,000,000.
:::

## What you have

The whole reports step, checked: thirteen checks on the guarantees, fourteen on the
reports, and every reports vector accepted or refused exactly as it should be. The
refused 62 pass whole. The accepted 30 wait for the statistics. [Part 12](./index.md) is
done.

One rule leaned on something you haven't built: [lesson 12.4](./04-bad-guarantees.md)'s authorizer pools.
[Part 13](../13-authorization/index.md) keeps them moving, block by block.

Next: [Part 13 · Authorization](../13-authorization/index.md)
