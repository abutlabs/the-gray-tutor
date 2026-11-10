# Reading the Gray Paper

Optional, and no code. The tutorial taught you JAM in its own words and your client's
names. The [Gray Paper](https://graypaper.com/) says the same things in equations, and an
interview, a review or a bug report will have the paper open, not this site. This page
is how to read a page of it: where things are, what a letter's typeface tells you before
you know what the letter means, the six shapes a definition takes, and thirteen of its
lines read aloud, one symbol at a time. Every line is quoted from version 0.8.0, and so is
the paper's own key to its notation, §3, each part beside what it explains here.

Every Part page from [3](./03-work-and-reports/index.md) on ends with *In the Gray Paper*:
the sections to open and that Part's one defining line. This page is what those sections
assume you can do. The [symbols page](./symbols.md) has an entry per symbol; this one is
about reading whole lines.

## Where things are

The paper is twenty-two sections and nine appendices. For a block importer, the ones that
matter are these. The sections a validator needs for producing blocks, auditing and
networking, §15 on, are the next milestone's reading, not this one's.

| Open | It defines | Here |
| --- | --- | --- |
| §3, *Notational Conventions* | every bracket, arrow and typeface below | this page |
| §4, *Overview* | the block, the state's seventeen parts, and the order they're computed in | [Part 19](./19-block-import/index.md) |
| §5, *The Header* | the header's ten fields, and the parent and extrinsic hashes | [Part 4](./04-blocks/index.md), [Part 5](./05-hashing-and-signatures/index.md) |
| §6, *Block Production and Chain Growth* | Safrole: time, entropy, the validator sets, tickets and seals | [Part 7](./07-time-and-shuffling/index.md), [Part 8](./08-safrole/index.md) |
| §7, *Recent History* | the last blocks and the mountain belt | [Part 9](./09-recent-history/index.md) |
| §8, *Authorization* | the pools and queues of authorizer hashes | [Part 13](./13-authorization/index.md) |
| §9, *Service Accounts* | an account: its record, storage, preimages and requests; the deposit | [Part 14](./14-services/index.md) |
| §10, *Disputes, Verdicts and Judgments* | verdicts, culprits, faults, and the sets they fill | [Part 10](./10-disputes/index.md) |
| §11, *Reporting and Assurance* | the work-report, the pending reports, assurances and guarantees | [Part 3](./03-work-and-reports/index.md), [Part 11](./11-assurances/index.md), [Part 12](./12-guarantees/index.md) |
| §12, *Accumulation* | the ready queue, the rounds, and what a service may do on the chain | [Part 17](./17-accumulation/index.md) |
| §13, *Statistics* | the scorecards | [Part 18](./18-statistics/index.md) |
| §14, *Work Packages and Work Reports* | the package, its items, and how a report is computed in-core | [Part 3](./03-work-and-reports/index.md) |
| §15, *Guaranteeing*; §16, *Availability Assurance*; §17, *Auditing and Judging*; §18, *Beefy Distribution*; §19, *Grandpa and the Best Chain* | what guarantors, assurers and auditors do off the chain, and how a validator picks and finalizes a chain | [What runs where](./what-runs-where.md#off-the-chain-in-the-gray-paper) |
| §1, §2, §20 to §22: the introduction, earlier work, performance, conclusion | why JAM exists and how fast it might be | [The Gray Paper's own story](./gray-paper-story.md) |
| Appendix A, *Polkadot Virtual Machine* | the PVM: its program blob, instructions, memory and gas | [Part 15](./15-the-pvm/index.md) |
| Appendix B, *Virtual Machine Invocations* | Is-Authorized, Refine and Accumulate, and every host call | [Part 16](./16-host-calls/index.md) |
| Appendix C, *Serialization Codec* | ℰ: how every value becomes bytes | [Part 2](./02-codec/index.md) |
| Appendix D, *State Merklization* | the state's keys and its root | [Part 6](./06-state-and-merklization/index.md) |
| Appendix E, *General Merklization* | the trie, the Merkle tree and the mountain range | [Part 6](./06-state-and-merklization/index.md), [Part 9](./09-recent-history/index.md) |
| Appendix F, *Shuffling* | the Fisher-Yates shuffle from a hash | [Part 7](./07-time-and-shuffling/index.md) |
| Appendix G, *Bandersnatch VRF*; Appendix H, *Erasure Coding* | the cryptography the libraries do for you | [Cryptography we use](./cryptography.md) |
| Appendix I, *Index of Notation* | every symbol, one line each, with the equation that defines it | [the symbols page](./symbols.md#the-paper-s-own-index), this page's best friend |

Two habits make the paper navigable. When a symbol stops you, open Appendix I first: its
*Sets*, *Functions* and *Values* lists say in a line what the symbol is and which equation
defines it, and the constants (C, Q, O, V, U) are all under *Values* with their numbers.
And when a section stops you, read its first equation's type line before its prose: the
paper puts the shape of a thing before the rules about it.

## The typeface tells you what a thing is

§3 opens by naming its model, the Yellow Paper that defined Ethereum, and §3.1 fixes what
each kind of letter means:

::: gray-paper 3

#### §3 Notational Conventions {#gp-3}

<a id="gp-3-p1"></a>Much as in the Ethereum Yellow Paper, a number of notational conventions are used throughout the present work. We define them here for clarity. The Ethereum Yellow Paper itself may be referred to henceforth as the *YP*.

:::

::: gray-paper 3.1

#### §3.1 Typography {#gp-3-1}

<a id="gp-3-1-p1"></a>We use a number of different typefaces to denote different kinds of terms. Where a term is used to refer to a value only relevant within some localized section of the document, we use a lower-case roman letter e.g.  $x$, $y$ (typically used for an item of a set or sequence) or e.g.  $i$, $j$ (typically used for numerical indices). Where we refer to a Boolean term or a function in a local context, we tend to use a capitalized roman alphabet letter such as $A$, $F$. If particular emphasis is needed on the fact a term is sophisticated or multidimensional, then we may use a bold typeface, especially in the case of sequences and sets.

<a id="gp-3-1-p2"></a>For items which retain their definition throughout the present work, we use other typographic conventions. Sets are usually referred to with a blackboard typeface, e.g.  $\mathbb{N}$ refers to all natural numbers including zero. Sets which may be parameterized may be subscripted or be followed by parenthesized arguments. Imported functions, used by the present work but not specifically introduced by it, are written in calligraphic typeface, e.g.  $\mathcal{H}$ the Blake2 cryptographic hashing function. For other non-context dependent functions introduced in the present work, we use upper case Greek letters, e.g.  $\Upsilon$ denotes the state transition function.

<a id="gp-3-1-p3"></a>Values which are not fixed but nonetheless hold some consistent meaning throughout the present work are denoted with lower case Greek letters such as $\sigma$, the state identifier. These may be placed in bold typeface to denote that they refer to an abnormally complex value.

:::

In plain words: a glance at a line tells you which of its letters are types, which are
values and which are functions, before you know any of them.

| It looks like | It is | Examples |
| --- | --- | --- |
| a blackboard letter: ℕ, 𝔹, ℍ, 𝔸, ℝ, 𝔾 | a **set**: a type, what a value may be | ℕ the whole numbers, ℍ the 32-byte hashes, 𝔸 the service accounts, ℝ the work-reports |
| a lower-case Greek letter: σ, α, ρ, τ, δ | a **value the chain keeps**: a piece of the state | α the pools, ρ the pending reports, τ the time |
| a capital Greek letter: Υ, Ψ, Δ, Ω | a **function of the paper's own**: a rule with inputs and outputs | Υ the state transition, Ψ the PVM, Δ accumulation, Ω the host calls |
| a calligraphic letter: ℰ, ℋ | a **function borrowed from outside**: hashing, encoding, signing | ℰ the codec, ℋ Blake2b, ℋ_K Keccak |
| an upright sans-serif letter: C, Q, O, V, E, U | a **constant**, a number fixed by the protocol | C cores, V validators, E slots an epoch, U the assurance timeout |
| a bold letter: 𝐇, 𝐄, 𝐫, 𝐬 | a **complex value**: a tuple or sequence, local to the section | 𝐇 the header, 𝐄 the extrinsic, 𝐫 a report in a rule about reports |
| a plain lower-case letter: x, i, c, g | a **local value**: one item, one index, in this line only | c a core index, g a guarantee |
| a capital Roman letter: A, F, M | a **local function or test**, defined beside the line that uses it | F(c) in the pool rule, M the Merkle root |

So in α′[c] ≡ …, the α is state (Greek, lower case), the prime says "after the block",
the c is a local index (plain, lower case), and the square brackets pick entry c.
You can say that much about a line before you know what it computes.

A subscript narrows a thing. On a set, it's a bound or a length: ℕ_C is the numbers below
C (the core indices), 𝔹₃₂ the blobs of exactly 32 bytes, ⟦ℍ⟧_Q the sequences of exactly Q
hashes. On a value, it's a field: for a report 𝐫, 𝐫_c is its core and 𝐫_a its authorizer
hash, the letters named in the tuple that defined ℝ. On a function, it's a parameter: ℰ₄
encodes in four bytes, Ψ₁ runs one step. A superscript is mostly a mark: a prime for the
state after the block, a dagger or double dagger for the state midway through it, and a
star for a value a section computes on the way.

## The six shapes a definition takes

Nearly every line in the paper is one of these. Read the shape first, then the letters.

### 1. "Is defined as": X ≡ Y

::: gray-paper-eq 4.1

<a id="ex-4-1"></a>The Gray Paper's (4.1), [in its place in the paper's words](./00-start/01-what-you-will-build.md#eq-4-1):

$$
\begin{align}
\sigma' \equiv \Upsilon(\sigma, \mathbf{B}) \tag{4.1}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-thestate" class="gk-wrap">[$\sigma$](./symbols.md#state)</span> | sigma | the state: everything the chain remembers between blocks |
| <span id="gk-equiv">[$\equiv$](./symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-transitionstate" class="gk-wrap">[$\Upsilon$](./symbols.md#transition)</span> | upsilon | the state transition: the state and a block in, the next state out |
| <span id="gk-block" class="gk-wrap">[$\mathbf{B}$](./symbols.md#block)</span> | B | a block: its header and its extrinsic |

</details>

:::

The three-barred ≡ is a definition, not a test: the left side *is* the right, from now on.
The paper's first equation, (4.1): "the state after the block is the state transition
applied to the state before it and the block." Your client is the Υ
([Part 19](./19-block-import/index.md)).

### 2. "Lives in": x ∈ S

::: gray-paper-eq 8.1

<a id="ex-8-1"></a>The Gray Paper's (8.1), [in its place in the paper's words](./13-authorization/01-the-authorizer-pools.md#eq-8-1):

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
| <span id="gk-in">[$\in$](./symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-sequence">[$\left[\!\left[x\right]\!\right]$](./symbols.md#sequence)</span> | a sequence of | ⟦T⟧ is an array of T; a subscript is its length, :n at most n, n: at least n |
| <span id="gk-Ccorecount" class="gk-wrap">$\mathsf{C}$</span> | C | the number of cores: 341 on full, 2 on tiny |
| <span id="gk-Cauthpoolsize" class="gk-wrap">$\mathsf{O}$</span> | O | the most authorizers a core's pool holds: 8 |
| <span id="gk-hash">$\mathbb{H}$</span> | H | a 32-byte value, usually a hash |
| <span id="gk-authqueue" class="gk-wrap">$\phi$</span> | phi | the authorizer queues: for each core, Q = 80 authorizer hashes waiting to join its pool |
| <span id="gk-Cauthqueuesize" class="gk-wrap">$\mathsf{Q}$</span> | Q | how many authorizers a core's queue holds: 80 |

</details>

:::

∈ gives a value its type, as a schema gives a JSON field one. (8.1): "the pools are a
sequence of C things, each a sequence of at most O hashes." The double brackets ⟦T⟧ mean
"a sequence of T" (an array), and their subscript says how long: $[\![ T ]\!]_n$ exactly
n, $[\![ T ]\!]_{:n}$ at most n, $[\![ T ]\!]_{n:}$ at least n. If you've written a JSON
schema, you know every one of these shapes already:

| The paper writes | Say it | In a schema you'd write |
| --- | --- | --- |
| $\mathbb{N}_{2^{32}}$, $\mathbb{N}_{2^{64}}$ | N sub two to the thirty-two | a u32; a u64 (and ℕ_S, ℕ_T, ℕ_G, ℕ_B are u32 service ids and timeslots, u64 gas and balances) |
| $\mathbb{B}$, $\mathbb{B}_{32}$, $\mathbb{H}$ | B; B sub 32; H | bytes of any length; exactly 32 bytes; a hash (the same 32 bytes) |
| $[\![ T ]\!]$, $[\![ T ]\!]_n$ | a sequence of T | an array of T; one of exactly n items |
| $\left\langle\!\left\vert K\to V\right\vert\!\right\rangle$ | a dictionary from K to V | a map or object: keys of type K, values of type V |
| $\left\lgroup a \in X,\ b \in Y \right\rgroup$ | a tuple of a in X and b in Y | a record with named fields a and b |
| $S\boldsymbol{?}$, or $S \cup \{\varnothing\}$ | S or nothing | a field that may be null |
| $\mathbb{b}_n$ | b sub n | n bits, a bitfield |
| $\{\top, \bot\}$ | true or false | a boolean |

The paper sets these types out in §3.3 to §3.7. The numbers:

::: gray-paper 3.4

#### §3.4 Numbers {#gp-3-4}

<a id="gp-3-4-p1"></a>$\mathbb{N}$ denotes the set of naturals including zero whereas $\mathbb{N}_{n}$ implies a restriction on that set to values less than $n$. Formally, $\mathbb{N} = \left\{\,0, 1, \dots\,\right\}$ and $\mathbb{N}_{n} = \left\{\,x \;\middle\vert\; x \in \mathbb{N}, x < n\,\right\}$.

<a id="gp-3-4-p2"></a>$\mathbb{Z}$ denotes the set of integers. We denote $\mathbb{Z}_{a \dots b}$ to be the set of integers within the interval $[a, b)$. Formally, $\mathbb{Z}_{a \dots b} = \left\{\,x \;\middle\vert\; x \in \mathbb{Z}, a \le x < b\,\right\}$. E.g. $\mathbb{Z}_{2 \dots 5} = \left\{\,2, 3, 4\,\right\}$. We denote the offset/length form of this set as $\mathbb{Z}_{a \dots+ b}$, a short form of $\mathbb{Z}_{a \dots a+b}$.

<a id="gp-3-4-p3"></a>It can sometimes be useful to represent lengths of sequences and yet limit their size, especially when dealing with sequences of <abbr class="gp-term" title="bytes: 8 bits each">octets</abbr> which must be stored practically. Typically, these lengths can be defined as the set $\mathbb{N}_{2^{32}}$. To improve clarity, we denote $\mathbb{N}_L$ as the set of lengths of <abbr class="gp-term" title="a byte: 8 bits">octet</abbr> sequences and is equivalent to $\mathbb{N}_{2^{32}}$.

<a id="gp-3-4-p4"></a>We denote the $\ \%\$ operator as the modulo operator, e.g.  $5 \ \%\  3 = 2$. Furthermore, we may occasionally express a division result as a quotient and remainder with the separator $\,\mathsf{R}\,$, e.g.  $5 \div 3 = 1 \,\mathsf{R}\, 2$.

:::

In plain words: ℕ is 0 and up, and a subscript caps it from above, so ℕ₂₅₆ is a byte's
range and ℕ_C a core index. ℤ adds the negatives, and its subscript is a range: ℤ with
−2⁶³ to 2⁶³ is an i64. "mod" is JavaScript's `%` on numbers that aren't negative: slot 85
mod 80 is 5.

The records, which a schema calls objects:

::: gray-paper 3.6

#### §3.6 Tuples {#gp-3-6}

<a id="gp-3-6-p1"></a>Tuples are groups of values where each item may belong to a different set. They are denoted with parentheses, e.g.  the tuple $t$ of the naturals $3$ and $5$ is denoted $t = \left(3, 5\right)$, and it exists in the set of natural pairs sometimes denoted $\mathbb{N} \times \mathbb{N}$, but denoted in the present work as $\!\left\lgroup\mathbb{N}, \mathbb{N}\right\rgroup\!$.

<a id="gp-3-6-p2"></a>We have frequent need to refer to a specific item within a tuple value and as such find it convenient to declare a name for each item. E.g. we may denote a tuple with two named natural components $a$ and $b$ as $T = \!\left\lgroup a\in \mathbb{N},\,b\in \mathbb{N}\right\rgroup\!$. We would denote an item $t \in T$ through subscripting its name, thus for some $t = \left(a\mathrel{\unicode{x2AF6}}3,\,b\mathrel{\unicode{x2AF6}}5\right)$, $t_{a} = 3$ and $t_{b} = 5$.

:::

In plain words: a tuple is a record with named fields, and a subscript reads a field. With
t = (a: 3, b: 5), t_a is 3, as `t.a` is in TypeScript. The paper writes a field's
type with ∈ inside the tuple's brackets, as a schema writes a field's type.

The arrays:

::: gray-paper 3.7

#### §3.7 Sequences {#gp-3-7}

<a id="gp-3-7-p1"></a>A sequence is a series of elements with particular ordering not dependent on their values. The set of sequences of elements all of which are drawn from some set $T$ is denoted $\left[\!\left[T\right]\!\right]_{}$, and it defines a partial mapping $\mathbb{N} \to T$. The set of sequences containing exactly $n$ elements each a member of the set $T$ may be denoted $\left[\!\left[T\right]\!\right]_{n}$ and accordingly defines a complete mapping $\mathbb{N}_{n} \to T$. Similarly, sets of sequences of at most $n$ elements and at least $n$ elements may be denoted $\left[\!\left[T\right]\!\right]_{:n}$ and $\left[\!\left[T\right]\!\right]_{n:}$ respectively. Finally, the set of sequences with length in set $N$ may be denoted $\left[\!\left[T\right]\!\right]_{N}$.

<a id="gp-3-7-p2"></a>Sequences are subscriptable, thus a specific item at index $i$ within a sequence $\mathbf{s}$ may be denoted $\mathbf{s}\left[i\right]$, or where unambiguous, $\mathbf{s}_{i}$. A range may be denoted using an ellipsis for example: $\left[0, 1, 2, 3\right]_{\dots2} = \left[0, 1\right]$ and $\left[0, 1, 2, 3\right]_{1\dots+2} = \left[1, 2\right]$. The length of such a sequence may be denoted $\left\vert\mathbf{s}\right\vert$.

<a id="gp-3-7-p3"></a>We denote modulo subscription as ${\mathbf{s}\left[i\right]}^\circlearrowleft \equiv \mathbf{s}[\,i \ \%\  \left\vert\mathbf{s}\right\vert\,]$. We denote the final element $x$ of a sequence $\mathbf{s} = \left[..., x\right]$ through the function $\text{last}(\mathbf{s}) \equiv x$.

:::

In plain words: ⟦T⟧ is an array of T, and its subscript fixes the length: n exactly, :n at
most, n: at least. s[i] is the item at index i, from 0; s with a range under it is a
slice, `s.slice(1, 3)` for [0, 1, 2, 3]₁…₊₂ = [1, 2]. The circle-arrow index wraps round
the end, which is how the authorizer queue turns: slot 85 reads entry 85 mod 80 = 5.

Sets, nothing and errors:

::: gray-paper 3.3

#### §3.3 Sets {#gp-3-3}

<a id="gp-3-3-p1"></a>Given some set $\mathbf{s}$, its <abbr class="gp-term" title="every subset of a set">power set</abbr> and <abbr class="gp-term" title="how many items a set has">cardinality</abbr> are denoted as $\left\{\mkern-5mu\left[\,s\,\right]\mkern-5mu\right\}$ and $\left\vert\mathbf{s}\right\vert$. When forming a power set, we may use a numeric subscript in order to restrict the resultant expansion to a particular cardinality. E.g. $\left\{\mkern-5mu\left[\,\left\{\,1, 2, 3\,\right\}\,\right]\mkern-5mu\right\}_2 = \left\{\, \left\{\,1, 2\,\right\}, \left\{\,1, 3\,\right\}, \left\{\,2, 3\,\right\} \,\right\}$.

<a id="gp-3-3-p2"></a>Sets may be operated on with scalars, in which case the result is a set with the operation applied to each element, e.g.  $\left\{\,1, 2, 3\,\right\} + 3 = \left\{\,4, 5, 6\,\right\}$. Functions may also be applied to all members of a set to yield a new set, but for clarity we denote this with a $\#$ superscript, e.g.  $f^{\#}(\left\{\,1, 2\,\right\}) \equiv \left\{\,f(1), f(2)\,\right\}$.

<a id="gp-3-3-p3"></a>We denote set-disjointness with the relation $\mathrel{\unicode{x2AEF}}$. Formally:

<a id="gp-3-3-p4"></a>

$$
\begin{equation}
A \cap B = \emptyset \Longleftrightarrow A \mathrel{\unicode{x2AEF}} B
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-cap">$\cap$</span> | intersection | only what's in both sides |
| <span id="gk-none" class="gk-wrap">$\emptyset$</span> | nothing | ∅: no value at all, like null |
| <span id="gk-Longleftrightarrow">$\Longleftrightarrow$</span> | exactly when | if and only if: both sides are true together, or false together |
| <span id="gk-disjoint">$\mathrel{\unicode{x2AEF}}$</span> | share nothing with | the two sides have no item in common |

</details>

<a id="gp-3-3-p5"></a>We commonly use $\emptyset$ to indicate that some term is validly left without a specific value. Its cardinality is defined as zero. We define the operation $\boldsymbol{?}$ such that $A\boldsymbol{?} \equiv A \cup \left\{\,\emptyset\,\right\}$ indicating the same set but with the addition of the $\emptyset$ element.

<a id="gp-3-3-p6"></a>The term $\nabla$ is utilized to indicate the unexpected failure of an operation or that a value is invalid or unexpected. (We try to avoid the use of the more conventional $\bot$ here to avoid confusion with Boolean false, which may be interpreted as some successful result in some contexts.)

:::

In plain words: braces make a set, unordered and with no repeats, and |s| is its size. ∅
is "no value", null; T? is "a T or null", the optional field of a schema. ∇ is "this went
wrong", kept apart from ⊥ (false) because false can be a perfectly good answer. Only one
line above is displayed as a formula, the one for ⫫:

**Read it aloud.** "A intersect B is nothing exactly when A shares nothing with B."
**In plain words.** Two sets are disjoint when no item is in both. **On a value.** {1, 2}
and {3} are disjoint: their intersection is ∅. {1, 2} and {2, 3} aren't: both hold 2.
The paper uses it twice: a block's new tickets must share no id with those already
held (§6.7), and a block's verdicts must name no report already judged (§10.2).

### 3. A function: name, type line, body

![The shape of a definition, on the two-byte encoding: the name, then the type line saying a number below 65,536 goes in and two bytes come out, then the body saying x becomes its lowest byte followed by the rest encoded in one byte, then the same on 4,807, which gives the bytes c7 12](./images/reading-a-definition.svg)

::: gray-paper-eq C.12

<a id="ex-C-12"></a>The Gray Paper's (C.12), [in its place in the paper's words](./02-codec/01-fixed-width-integers.md#eq-C-12):

$$
\begin{equation}
\mathcal{E}_{l \in \mathbb{N}}\colon\left\{ \begin{aligned}
\mathbb{N}_{2^{8l}} &\to \mathbb{B}_{l} \\
x &\mapsto \begin{cases}
\left[\right] &\text{if } l = 0 \\
\left[x \bmod 256\right] \frown \mathcal{E}_{l - 1}\left(\left\lfloor\frac{x}{256}\right\rfloor\right) &\text{otherwise}
\end{cases}
\end{aligned} \right. \tag{C.12}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-fnencode">[$\mathcal{E}$](./symbols.md#encode)</span> | E | the codec: a value in, its bytes out; a number alone, as a compact natural of 1 to 9 bytes |
| <span id="gk-N" class="gk-wrap">[$\mathbb{N}$](./symbols.md#naturals)</span> | N | the whole numbers: 0, 1, 2 and up; a subscript is a bound, ℕ₈ is 0 to 7 |
| <span id="gk-abracegroup">$\left\{ \begin{aligned}x\end{aligned} \right.$</span> | as follows | a brace grouping lines that hold together: for a function, its type on top, then what each input becomes |
| <span id="gk-Nbits">[$\mathbb{N}_{2^{x}}$](./symbols.md#naturals)</span> | N sub two to the n | the numbers that fit in n bits: ℕ_{2³²} is a u32 |
| <span id="gk-to">[$\to$](./symbols.md#to)</span> | to | what goes in, to what comes out: A → B takes an A and gives a B |
| <span id="gk-blob">[$\mathbb{B}$](./symbols.md#blobs)</span> | B, or B sub n | bytes: any run of them; 𝔹ₙ exactly n of them |
| <span id="gk-mapsto">$\mapsto$</span> | maps to | what a function gives back for an input: x ↦ y says x becomes y |
| <span id="gk-sq">[$\left[x\right]$](./symbols.md#sequence)</span> | the sequence | a sequence written out item by item; [ ] is the empty one |
| <span id="gk-bmod">[$\bmod$](./symbols.md#mod)</span> | mod | the remainder after dividing: 14 mod 4 is 2 |
| <span id="gk-concat" class="gk-wrap">[$\frown$](./symbols.md#concat)</span> | concatenate | join: the left sequence followed by the right |
| <span id="gk-encode">[$\mathcal{E}\left(x\right)$](./symbols.md#encode)</span> | E of | the encoding of what's in the brackets: its bytes, by Appendix C's rules |
| <span id="gk-floor">[$\left\lfloor x\right\rfloor$](./symbols.md#floor)</span> | floor of | rounded down to a whole number |
| <span id="gk-frac">$\frac$</span> | over | a fraction: the top divided by the bottom |

</details>

:::

A function has a name before a colon, then a brace holding two lines: the type line, with
a → between what goes in and what comes out, and the body, with a ↦ between the input's
name and what it becomes. When the body has cases, read them top to bottom; the first
whose condition holds is the one that applies. Appendix C's ℰ_l, worked through in
[2.1](./02-codec/01-fixed-width-integers.md): "a number that fits in l bytes, to exactly
l bytes; x becomes nothing if l is zero, else its lowest byte followed by the rest in one
byte fewer."

Some functions §3 only names, and defines in an appendix. The shuffle is one: §3.7.5
says what goes in and what comes out, which is the type line in words, and Appendix F
gives the body ([7.2](./07-time-and-shuffling/02-the-shuffle.md)).

::: gray-paper 3.7.5

#### §3.7.5 Shuffling {#gp-3-7-5}

<a id="gp-3-7-5-p1"></a>We define the sequence-shuffle function $\mathcal{F}$, originally introduced by Fisher and Yates 1938, with an efficient in-place algorithm described by [Wikipedia 2024](https://en.wikipedia.org/wiki/Fisher\%E2\%80\%93Yates_shuffle\#The_modern_algorithm). This accepts a sequence and some entropy and returns a sequence of the same length with the same elements but in an order determined by the entropy. The entropy may be provided as either an indefinite sequence of naturals or a hash. For a full definition see appendix [F](./07-time-and-shuffling/02-the-shuffle.md#gp-F-p1).

:::

### 4. A rule for every one: ∀ x ∈ S : condition

::: gray-paper-eq 11.32

<a id="ex-11-32"></a>The Gray Paper's (11.32), [in its place in the paper's words](./12-guarantees/04-bad-guarantees.md#eq-11-32):

$$
\begin{equation}
\forall \mathbf{r} \in \mathbf{I} :
\rho^\ddagger\left[\mathbf{r}_{c}\right] = \emptyset \wedge \mathbf{r}_{a} \in \alpha\left[\mathbf{r}_{c}\right] \tag{11.32}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-forall">$\forall$</span> | for all | for every value: ∀c ∈ ℕ_C means for each core c |
| <span id="gk-wrX" class="gk-wrap">$\mathbf{r}$</span> | r | a work-report |
| <span id="gk-incomingreports" class="gk-wrap">$\mathbf{I}$</span> | I | the incoming reports: the work-reports this block's guarantees carry |
| <span id="gk-availassignmentspostassurances" class="gk-wrap">$\rho^\ddagger$</span> | rho double dagger | the pending reports midway: after the available ones and the timed-out ones left |
| <span id="gk-wr-core">$c$</span> | c | the core a report's work was done on, 0 to C − 1 |
| <span id="gk-wedge">$\wedge$</span> | and | both sides are true |
| <span id="gk-wr-authorizer">$a$</span> | a | a report's authorizer hash: which gatekeeper let its package onto the core |

</details>

:::

∀ is "for every"; the colon is "it holds that"; ∧ is "and"; ∅ is "nothing". (11.32), a
block's rule on its incoming reports 𝐈: "for every report r in the block: the core r
names holds nothing after the assurances, and r's authorizer hash is in that core's pool."
A rule like this is a check your client runs, and a block that breaks it is refused
([12.4](./12-guarantees/04-bad-guarantees.md)).

### 5. A built sequence or set: [f(x) | x ∈ S, condition]

::: gray-paper-eq 11.17

<a id="ex-11-17"></a>The Gray Paper's (11.17), [in its place in the paper's words](./11-assurances/01-available.md#eq-11-17):

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
| <span id="gk-availassignmentspostjudgment" class="gk-wrap">$\rho^\dagger$</span> | rho dagger | the pending reports midway: after disputes took the judged-bad ones out |
| <span id="gk-aa-guarantee" class="gk-wrap">$\mathbf{g}$</span> | bold g | the guarantee a core's pending report came with: the report and its guarantors' signatures |
| <span id="gk-orderedin">$\mathrel{\unicode{x2B40}}$</span> | in order, from | each item of the sequence, in its order |
| <span id="gk-coreindex" class="gk-wrap">$\mathbb{N}_{\mathsf{C}}$</span> | N sub C | the core indices: 0 to C − 1 |
| <span id="gk-sum">$\sum$</span> | the sum of | add up what follows, once for each value the subscript ranges over |
| <span id="gk-xtassurances" class="gk-wrap">$\mathbf{E}_A$</span> | E sub A | the assurances bag: validators saying they hold their pieces of reports |
| <span id="gk-xa-availabilities">$f$</span> | f | an assurance's bitfield: one bit per core, 1 for "I hold my piece of its data" |
| <span id="gk-twothirds">${}^{2}\!/_{3}$</span> | two thirds | two thirds: ⌊⅔ · 6⌋ + 1 is 5 judgments on tiny, 683 of 1,023 on full |
| <span id="gk-len">$\left\vert x\right\vert$</span> | the size of | \|x\|: how many items x has, or how many bytes |
| <span id="gk-activeset" class="gk-wrap">$\kappa$</span> | kappa | the current validators: the keys of the V validators active this epoch |

</details>

:::

Brackets with a bar build a sequence: what each entry is, a bar, where the entries come
from and which ones to keep. Braces do the same for a set. (11.17): "the newly available
reports are, for each core c in order, the report of the guarantee pending on core c, for
every core whose bits, summed over the block's assurances, come to more than two thirds of
the validator count." The Σ adds one bit per assurance, so the sum is a count of
validators, and |κ| with bars is the size of κ, the validator set
([11.1](./11-assurances/01-available.md)). The paper's mark for "in order" is ∈ with a bar
under it: the entries keep the source's order, here core 0 first. Plain ∈ leaves it open.
§3.7.1 sets out every way to build a sequence:

::: gray-paper 3.7.1

#### §3.7.1 Construction {#gp-3-7-1}

<a id="gp-3-7-1-p1"></a>We may wish to define a sequence in terms of incremental subscripts of other values: $\left[\mathbf{x}_0, \mathbf{x}_1, \dots \right]_{\dots n}$ denotes a sequence of $n$ values beginning $\mathbf{x}_0$ continuing up to $\mathbf{x}_{n-1}$. Furthermore, we may also wish to define a sequence as elements each of which are a function of their index $i$; in this case we denote $\left[f(i) \;\middle\vert\; i \mathrel{\unicode{x2B40}} \mathbb{N}_{n}\right] \equiv \left[f(0), f(1), \dots, f(n - 1)\right]$. Thus, when the ordering of elements matters we use $\mathrel{\unicode{x2B40}}$ rather than the unordered notation $\in$. The latter may also be written in short form $\left[f(i \mathrel{\unicode{x2B40}} \mathbb{N}_{n})\right]$. This applies to any set which has an unambiguous ordering, particularly sequences, thus $\left[i^2 \;\middle\vert\; i \mathrel{\unicode{x2B40}} \left[1, 2, 3\right]\right] = \left[1, 4, 9\right]$. Multiple sequences may be combined, thus $\left[i \cdot j \;\middle\vert\; i \mathrel{\unicode{x2B40}} \left[1, 2, 3\right], j \mathrel{\unicode{x2B40}} \left[2, 3, 4\right]\right] = \left[2, 6, 12\right]$.

<a id="gp-3-7-1-p2"></a>As with sets, we use explicit notation $f^{\#}$ to denote a function mapping over all items of a sequence.

<a id="gp-3-7-1-p3"></a>Sequences may be constructed from sets or other sequences whose order should be ignored through sequence ordering notation $\left[i \in X\,\wr\,f(i)\right]$, which is defined to result in the set or sequence of its argument except that all elements $i$ are placed in ascending order of the corresponding value $f(i)$.

<a id="gp-3-7-1-p4"></a>The key component may be elided in which case it is assumed to be ordered by the elements directly; i.e.  $\left[i \in X\right] \equiv \left[i \in X\,\wr\,i\right]$. $\left[i \in X\,\wr\!\wr\,i\right]$ does the same, but excludes any duplicate values of $i$. E.g. assuming $\mathbf{s} = \left[1, 3, 2, 3\right]$, then $\left[i \in \mathbf{s}\,\wr\!\wr\,i\right] = \left[1, 2, 3\right]$ and $\left[i \in \mathbf{s}\,\wr\,-i\right] = \left[3, 3, 2, 1\right]$.

<a id="gp-3-7-1-p5"></a>Sets may be constructed from sequences with the regular set construction syntax, e.g.  assuming $\mathbf{s} = \left[1, 2, 3, 1\right]$, then $\left\{\,a \;\middle\vert\; a \in \mathbf{s}\,\right\}$ would be equivalent to $\left\{\,1, 2, 3\,\right\}$.

<a id="gp-3-7-1-p6"></a>Sequences of values which themselves have a defined ordering have an implied ordering akin to a regular dictionary, thus $\left[1, 2, 3\right] < \left[1, 2, 4\right]$ and $\left[1, 2, 3\right] < \left[1, 2, 3, 1\right]$.

:::

In plain words: [f(i) | i ∈ ℕₙ] with the in-order mark is `Array.from({ length: n }, (_, i) =>
f(i))`; with two sources it walks them side by side, like a zip. The sorting brackets
sort by the key on the left, as `sort((a, b) => f(a) - f(b))` would, and the version with
a dot drops repeats. Two sequences compare as words in a dictionary do: [1, 2, 3] comes
before [1, 2, 4].

### 6. "Depends on": y ≺ x

::: gray-paper-eq 4.5

<a id="ex-4-5"></a>The Gray Paper's (4.5), (4.6), (4.7), (4.8), (4.9), (4.10), (4.11), (4.12), (4.13), (4.14), (4.15), (4.16), (4.17), (4.18), (4.19), (4.20), [in its place in the paper's words](./19-block-import/01-the-order-of-things.md#eq-4-5):

$$
\begin{align}
\tau' &\prec \mathbf{H} \tag{4.5} \\
\beta_H^\dagger &\prec \left(\mathbf{H}, \beta_H\right) \tag{4.6} \\
\gamma' &\prec \left(\mathbf{H}, \tau, \mathbf{E}_T, \gamma, \iota, \eta', \kappa', \psi'\right) \tag{4.7} \\
\eta' &\prec \left(\mathbf{H}, \tau, \eta\right) \tag{4.8} \\
\kappa' &\prec \left(\mathbf{H}, \tau, \kappa, \gamma\right) \tag{4.9} \\
\lambda' &\prec \left(\mathbf{H}, \tau, \lambda, \kappa\right) \tag{4.10} \\
\psi' &\prec \left(\mathbf{E}_D, \psi\right) \tag{4.11} \\
\rho^\dagger &\prec \left(\mathbf{E}_D, \rho\right) \tag{4.12} \\
\rho^\ddagger &\prec \left(\mathbf{E}_A, \rho^\dagger\right) \tag{4.13} \\
\rho' &\prec \left(\mathbf{E}_G, \rho^\ddagger, \kappa, \tau'\right) \tag{4.14} \\
\mathbf{R}^* &\prec \left(\mathbf{E}_A, \rho^\dagger\right) \tag{4.15} \\
\left(\omega', \xi', \delta^\ddagger, \chi', \iota', \phi', \theta', \mathbf{S}\right) &\prec \left(\mathbf{R}^*, \omega, \xi, \delta, \chi, \iota, \phi, \tau, \tau'\right) \tag{4.16} \\
\beta_H' &\prec \left(\mathbf{H}, \mathbf{E}_G, \beta_H^\dagger, \theta'\right) \tag{4.17} \\
\delta' &\prec \left(\mathbf{E}_P, \delta^\ddagger, \tau'\right) \tag{4.18} \\
\alpha' &\prec \left(\mathbf{H}, \mathbf{E}_G, \phi', \alpha\right) \tag{4.19} \\
\pi' &\prec \left(\mathbf{E}_G, \mathbf{E}_P, \mathbf{E}_A, \mathbf{E}_T, \tau, \kappa', \pi, \mathbf{H}, \mathbf{S}\right)\!\!\!\!\!\!\!\! \tag{4.20}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-thetime" class="gk-wrap">$\tau$</span> | tau | the time: the latest block's timeslot |
| <span id="gk-prec">$\prec$</span> | is defined in terms of | y ≺ x: y can be computed from x alone |
| <span id="gk-theheader" class="gk-wrap">$\mathbf{H}$</span> | H | this block's header |
| <span id="gk-recenthistorypostparentstaterootupdate" class="gk-wrap">$\beta_H^\dagger$</span> | beta sub H dagger | the recent blocks midway: with the parent's state root filled in, before this block's entry |
| <span id="gk-recenthistory" class="gk-wrap">$\beta_H$</span> | beta sub H | the last H = 8 blocks: each one's header hash, state root, belt peak and reported packages |
| <span id="gk-safrole" class="gk-wrap">$\gamma$</span> | gamma | Safrole's state: the ticket lottery for who seals the next epoch's blocks |
| <span id="gk-xttickets" class="gk-wrap">$\mathbf{E}_T$</span> | E sub T | the tickets bag: entries to the block-sealing lottery |
| <span id="gk-stagingset" class="gk-wrap">$\iota$</span> | iota | the next validators: keys queued to become active at the next epoch |
| <span id="gk-entropy" class="gk-wrap">$\eta$</span> | eta | entropy: four 32-byte values of randomness, the newest mixing in every block |
| <span id="gk-disputes" class="gk-wrap">$\psi$</span> | psi | past judgments: the reports found good, bad or wonky, and the validators who lied |
| <span id="gk-previousset" class="gk-wrap">$\lambda$</span> | lambda | the last epoch's validators: kept to check what they signed before the change |
| <span id="gk-xtdisputes" class="gk-wrap">$\mathbf{E}_D$</span> | E sub D | the disputes bag: verdicts, culprits and faults |
| <span id="gk-availassignments" class="gk-wrap">$\rho$</span> | rho | the pending reports: for each core, the report waiting to be made available, and when it came |
| <span id="gk-xtguarantees" class="gk-wrap">$\mathbf{E}_G$</span> | E sub G | the guarantees bag: work-reports with their guarantors' signatures, one per core at most |
| <span id="gk-ready" class="gk-wrap">$\omega$</span> | omega | the ready queue: available reports waiting on others before they can accumulate |
| <span id="gk-accumulated" class="gk-wrap">$\xi$</span> | xi | the accumulated history: the packages accumulated in each of the last E slots |
| <span id="gk-accountspostxfer" class="gk-wrap">$\delta^\ddagger$</span> | delta double dagger | the service accounts midway: after accumulation |
| <span id="gk-privileges" class="gk-wrap">$\chi$</span> | chi | the privileged services: who may manage, assign cores, set validators and accumulate for free |
| <span id="gk-lastaccout" class="gk-wrap">$\theta$</span> | theta | the last block's accumulation outputs: which service yielded which hash |
| <span id="gk-accumulationstatistics" class="gk-wrap">$\mathbf{S}$</span> | S | this block's accumulation tallies, per service: work-items accumulated, transfers, and gas used |
| <span id="gk-accountspre" class="gk-wrap">$\delta$</span> | delta | the service accounts before the block |
| <span id="gk-accountspostpreimage" class="gk-wrap">$\delta'$</span> | delta prime | the service accounts after the block, the preimages provided included |
| <span id="gk-xtpreimages" class="gk-wrap">$\mathbf{E}_P$</span> | E sub P | the preimages bag: data a service asked for |
| <span id="gk-activity" class="gk-wrap">$\pi$</span> | pi | the statistics: tallies per validator, per core and per service |

</details>

:::

≺ is "is computed from", and §4.2.1's graph of them is the order your client runs. Three
of its sixteen lines, (4.12) to (4.14), are the ones for ρ, the pending reports: "the
pending reports after the disputes come from the disputes extrinsic and the old pending reports; after the assurances, from the assurances and
that; the final ones from the guarantees, that, the validators and the new time." A
dagger is a value midway through the block, and a prime on the right-hand side means
"compute that first" ([19.1](./19-block-import/01-the-order-of-things.md)).

§3.2 defines ≺ itself, and one small function the paper uses for "the first of these that
isn't nothing":

::: gray-paper 3.2

#### §3.2 Functions and Operators {#gp-3-2}

<a id="gp-3-2-p1"></a>We define the precedes relation to indicate that one term is defined in terms of another. E.g. $y \prec x$ indicates that $y$ may be defined purely in terms of $x$:

<a id="gp-3-2-p2"></a><a id="eq-3-1"></a>

$$
\begin{align}
y \prec x \Longleftrightarrow \exists f: y = f(x) \tag{3.1}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-exists">[$\exists$](./symbols.md#exists)</span> | there exists | there is at least one value such that what follows holds |

</details>

<a id="gp-3-2-p3"></a>The substitute-if-nothing function $\mathcal{U}$ is equivalent to the first argument which is not $\emptyset$, or $\emptyset$ if no such argument exists:

<a id="gp-3-2-p4"></a><a id="eq-3-2"></a>

$$
\begin{align}
\mathcal{U}\left(a_0, \dots a_{n}\right) \equiv a_{x} : (a_{x} \ne \emptyset \vee x = n), \bigwedge_{i=0}^{x-1} a_{i} = \emptyset \tag{3.2}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-subifnone">$\mathcal{U}\left(x\right)$</span> | U of | the first of its arguments that isn't nothing (∅), or ∅ if all are |
| <span id="gk-ne">$\ne$</span> | is not | not equal |
| <span id="gk-vee">$\vee$</span> | or | at least one side is true |
| <span id="gk-bigwedge">$\bigwedge$</span> | all of | every one of the conditions under it is true |

</details>

<a id="gp-3-2-p5"></a>Thus, e.g.  $\mathcal{U}\left(\emptyset, 1, \emptyset, 2\right) = 1$ and $\mathcal{U}\left(\emptyset, \emptyset\right) = \emptyset$.

:::

**(3.1), read it aloud.** "y precedes x exactly when there exists a function f such that y
is f of x." **In plain words.** y ≺ x says y can be worked out from x alone, nothing
else needed. It names no f: it only promises one exists. **On a value.** τ′ ≺ 𝐇, the first
line of (4.5): the new time needs only the header, and it is the header's slot, so a block
for slot 42 leaves τ′ = 42.

**(3.2), read it aloud.** "U of a-zero to a-n is defined as the a-x such that a-x is not
nothing, or x is n, and every a before it is nothing." **In plain words.** The first
argument that isn't ∅, as `a ?? b ?? c` is in JavaScript; if every one is ∅, the answer
is ∅ too. **On a value.** The paper's own example, U(∅, 1, ∅, 2): a₀ is ∅, a₁ is 1, so the
answer is 1, and a₃ = 2 is never looked at.

## Thirteen lines, read aloud

Each is quoted, said in English, and pinned to one value or one trap. They go in the
order a block importer meets them.

### 1. The state's seventeen letters

::: gray-paper-eq 4.4

<a id="ex-4-4"></a>The Gray Paper's (4.4), [in its place in the paper's words](./00-start/06-how-a-block-is-imported.md#eq-4-4):

$$
\begin{align}
\sigma &\equiv \left(\alpha, \beta, \theta, \gamma, \delta, \eta, \iota, \kappa, \lambda, \rho, \tau, \phi, \chi, \psi, \pi, \omega, \xi\right) \tag{4.4}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-recent" class="gk-wrap">$\beta$</span> | beta | recent blocks: the last few blocks' hashes and roots, and the belt of accumulation outputs |

</details>

:::

(4.4): "the state is alpha, beta, theta, gamma, delta, eta, iota, kappa, lambda, rho,
tau, phi, chi, psi, pi, omega, xi." Say them with a word each: pools, history, outputs,
Safrole, services, entropy, staging, active, previous, pending reports, time, queues,
privileges, judgements, statistics, ready, accumulated. The paper lists them in this
order; the state is stored by key number, C(1) to C(16), which is a different order
([6.2](./06-state-and-merklization/02-state-keys.md)), and δ, the services, is not one
key but one per service.

### 2. The block and its extrinsic

::: gray-paper-eq 4.2

<a id="ex-4-2"></a>The Gray Paper's (4.2), (4.3), [in its place in the paper's words](./19-block-import/04-importing-a-block.md#eq-4-2):

$$
\begin{align}
\mathbf{B} &\equiv \left(\mathbf{H}, \mathbf{E}\right) \tag{4.2} \\
\mathbf{E} &\equiv \left(\mathbf{E}_T, \mathbf{E}_D, \mathbf{E}_P, \mathbf{E}_A, \mathbf{E}_G\right) \tag{4.3}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-extrinsic" class="gk-wrap">$\mathbf{E}$</span> | E | a block's extrinsic: the data it carries in, in five bags |

</details>

:::

(4.2) and (4.3): "a block is a header and an extrinsic; the extrinsic is the tickets,
the disputes, the preimages, the assurances and the guarantees." The trap: Appendix C
encodes them as tickets, preimages, guarantees, assurances, disputes, and so does
[4.7](./04-blocks/07-the-block.md). The paper's tuple order and its byte order are two
different things, here and for the header.

### 3. The parent hash

::: gray-paper-eq 5.2

<a id="ex-5-2"></a>The Gray Paper's (5.2), [in its place in the paper's words](./05-hashing-and-signatures/01-hashes.md#eq-5-2):

$$
\begin{equation}
\mathbf{H}_{P} \in \mathbb{H}_{} \,,\quad \mathbf{H}_{P} \equiv \mathcal{H}\left(\mathcal{E}_{}\left(P\left(\mathbf{H}\right)\right)\right) \tag{5.2}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk--parent">$P$</span> | P | a header's parent hash: 𝐇_P is the hash of the header before it, 32 bytes |
| <span id="gk-blake">$\mathcal{H}\left(x\right)$</span> | H of | the Blake2b hash of what's in the brackets: 32 bytes |
| <span id="gk-getparent">$P\left(x\right)$</span> | P of | the parent of a header: P(𝐇) is the header of the block before |

</details>

:::

(5.2), §5's first rule: "the parent hash is a hash, and it is the Blake2b hash of the encoding
of the parent header," P being the function from a header to its parent. Every hash in
the paper works this way, by §3's rule: encode with ℰ first, then hash, which is why two
clients agree on a hash only when their codecs agree byte for byte
([5.1](./05-hashing-and-signatures/01-hashes.md)).

### 4. Two codec rules that make every byte dump

::: gray-paper-eq C.3

<a id="ex-C-3"></a>The Gray Paper's (C.3), [in its place in the paper's words](./02-codec/03-writer-and-reader.md#eq-C-3):

$$
\begin{equation}
\mathcal{E}_{}\left(\left(a, b, \dots\right)\right) \equiv \mathcal{E}_{}\left(a\right) \frown \mathcal{E}_{}\left(b\right) \frown \dots \tag{C.3}
\end{equation}
$$

:::

::: gray-paper-eq C.7

<a id="ex-C-7"></a>The Gray Paper's (C.7), [in its place in the paper's words](./02-codec/04-codecs.md#eq-C-7):

$$
\begin{equation}
\left\updownarrow x\right.\! \equiv \left(\left\vert x\right\vert, x\right)\text{ thus }\mathcal{E}_{}\left(\left\updownarrow x\right.\!\right) \equiv \mathcal{E}_{}\left(\left\vert x\right\vert\right)\frown\mathcal{E}_{}\left(x\right) \tag{C.7}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-var">[$\left\updownarrow x\right.\!$](./symbols.md#length-prefix)</span> | with its length | ↕x: x with its length in front, as a compact natural |

</details>

:::

Appendix C, (C.3) and (C.7): "a tuple encodes as its parts' encodings, one after another; a value marked
↕ is the pair of its length and itself, so it encodes as its length, then itself." The
first rule is why a decoder reads a record field by field with nothing between them
([2.3](./02-codec/03-writer-and-reader.md)); the second is the length in front of every
blob and list whose size varies, and never in front of a hash
([2.4](./02-codec/04-codecs.md)). On a real value: ↕[1, 2, 3] is `03 01 02 03`.

### 5. A state key

::: gray-paper-eq D.1

<a id="ex-D-1"></a>The Gray Paper's (D.1), [in its place in the paper's words](./06-state-and-merklization/02-state-keys.md#eq-D-1):

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
| <span id="gk-cup">$\cup$</span> | union | everything in either side |
| <span id="gk-serviceid" class="gk-wrap">$\mathbb{N}_S$</span> | N sub S | a service id: a whole number below 2³², 4 bytes |

</details>

:::

Appendix D's key constructor, (D.1): a function whose type line takes three shapes of input, with
∪ joining them, and whose body has a case for each. "A byte i becomes i and thirty zeros;
a byte and a service id become the byte, then the id's four bytes with zeros between; a
service id and a blob become the id's four bytes and the blob's hash interleaved, then
the rest of the hash, cut to 31 bytes." The time lives at C(11): the key `0b 00 00 …`,
whose value is ℰ₄(τ) ([6.3](./06-state-and-merklization/03-reading-the-state.md)); a
service's record at C(255, s); its storage under the third shape.

### 6. The pools and queues

(8.1), the line of [shape 2](#_2-lives-in-x-∈-s) above, in full: "the pools are, for each of C cores, at most O hashes; the queues, for each core,
exactly Q hashes." On tiny, two lists of up to 8, and two lists of exactly 80. The hashes
name authorizers: each is ℋ of a PVM program's code hash followed by its configuration
blob (§14.3), and the program itself runs in-core, never on the chain
([13.1](./13-authorization/01-the-authorizer-pools.md)). When asked what an authorizer
is, this is the line to point at, and then §14.3.

### 7. The pool rule

::: gray-paper-eq 8.2

<a id="ex-8-2"></a>The Gray Paper's (8.2), (8.3), [in its place in the paper's words](./13-authorization/01-the-authorizer-pools.md#eq-8-2):

$$
\begin{align}
&\forall c \in \mathbb{N}_{\mathsf{C}} : \alpha'\left[c\right] \equiv {\overleftarrow{F(c) \mathbin{+\!\!+} {\phi'\left[c\right]\left[\mathbf{H}_{T}\right]}^\circlearrowleft}}^{\mathsf{O}} \tag{8.2} \\
&F(c) \equiv \begin{cases} \alpha[c] \mathbin{\unicode{x27DC}} \left\{\,(g_{\mathbf{r}})_{a}\,\right\} &\text{if } \exists g \in \mathbf{E}_G : (g_{\mathbf{r}})_{c} = c \\ \alpha[c] & \text{otherwise} \end{cases} \tag{8.3}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-overleftarrow">$\overleftarrow$</span> | the last n of | with a number above: keep only the rightmost (newest) n items; with none: the sequence reversed |
| <span id="gk-append">[$\mathbin{+\!\!+}$](./symbols.md#concat)</span> | append | add one item at the end of the sequence |
| <span id="gk-cyclic">${x}^\circlearrowleft$</span> | wrapped around | ↺: the index goes round, counting from 0 again past the end (mod the length) |
| <span id="gk--timeslot">$T$</span> | T | a header's timeslot: 𝐇_T is the slot this block was made for |
| <span id="gk-seqminusl">$\mathbin{\unicode{x27DC}}$</span> | without its first | the sequence with the leftmost copy of the item taken out |
| <span id="gk-set">$\left\{\,x\,\right\}$</span> | the set of | a set: values with no order and no repeats |

</details>

:::

(8.2), four shapes in one line: a rule for every core, a definition, a helper F with
cases, and an arrow. "For every core c, the new pool is F of c followed by the queue's
entry at the slot mod Q, keeping the rightmost O. F of c is the old pool with this
block's report's authorizer taken out, if a guarantee in the block names core c, else
the old pool." The left-pointing arrow over a sequence with a superscript n keeps its
last n entries; the right-pointing one keeps its first n. The ++ adds one item at the
end, and the ⟜ takes one matching item out of a sequence, the leftmost. $(g_{\mathbf{r}})_a$
is "the guarantee's report's authorizer field": two subscripts, read inside out. §3.7.2
defines these editing signs:

::: gray-paper 3.7.2

#### §3.7.2 Editing {#gp-3-7-2}

<a id="gp-3-7-2-p1"></a>We define the sequence concatenation operator $\frown$ such that $\left[\mathbf{x}_0, \mathbf{x}_1, \dots, \mathbf{y}_0, \mathbf{y}_1, \dots\right] \equiv \mathbf{x} \frown \mathbf{y}$. For sequences of sequences, we define a unary concatenate-all operator: $\overparen{\mathbf{x}}\equiv\mathbf{x}_0 \frown \mathbf{x}_1 \frown \dots$. Further, we denote element concatenation as $x \mathbin{+\!\!+} i \equiv x \frown \left[i\right]$. We denote the sequence made up of the first $n$ elements of sequence $\mathbf{s}$ to be ${\overrightarrow{\mathbf{s}}}^n \equiv \left[\mathbf{s}_0, \mathbf{s}_1, \dots, \mathbf{s}_{n-1}\right]$, and only the final elements as ${\overleftarrow{\mathbf{s}}}^n$.

<a id="gp-3-7-2-p2"></a>We define ${}^\text{T}\mathbf{x}$ as the transposition of the sequence-of-sequences $\mathbf{x}$, fully defined in equation [H.4](./cryptography.md#eq-H-4). We may also apply this to sequences-of-tuples to yield a tuple of sequences.

<a id="gp-3-7-2-p3"></a>We denote sequence subtraction with a slight modification of the set subtraction operator; specifically, some sequence $\mathbf{s}$ excepting the left-most element equal to $v$ would be denoted $\mathbf{s}\mathbin{\unicode{x27DC}}\left\{\,v\,\right\}$.

:::

In plain words: ⌢ joins two sequences, `[...x, ...y]`; an arc drawn over a list of lists
joins them all, `xs.flat()`; ++ appends one item, `[...x, i]`. The arrow with n on top
keeps the first n, as `s.slice(0, n)` does, or, pointing left, the last n, as
`s.slice(-n)` does. A T
at the top left flips a list of lists, rows into columns, as erasure coding does to its
pieces ([Cryptography we use](./cryptography.md#erasure-coding-appendix-h)). ⟜ removes one
copy, the leftmost: [a, b, a] ⟜ {a} is [b, a].

### 8. The services

::: gray-paper-eq 9.1

<a id="ex-9-1"></a>The Gray Paper's (9.1), (9.2), [in its place in the paper's words](./14-services/02-the-service-account.md#eq-9-1):

$$
\begin{align}
\mathbb{N}_S &\equiv \mathbb{N}_{2^{32}} \tag{9.1} \\
\delta &\in \left\langle\!\left\vert \mathbb{N}_S\to\mathbb{A}\right\vert\!\right\rangle \tag{9.2}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-dictionary">$\left\langle\!\left\vert x\to y\right\vert\!\right\rangle$</span> | a dictionary from K to V | a map: keys of type K, each with one value of type V |
| <span id="gk-serviceaccount" class="gk-wrap">$\mathbb{A}$</span> | A | a service account: three dictionaries (storage, preimages, requests) and eight plain fields |

</details>

:::

(9.1) and (9.2), §9's first lines: "a service id is a number below 2³²; the services are
a dictionary from service id to account." A
dictionary is looked up with square brackets, δ[s], and the paper warns in §3.5 that
writing δ[s] asserts s is there: a block that relies on a missing key is invalid. 𝔸, the
account, is the tuple of (9.3), three of its fields dictionaries of their own
([14.2](./14-services/02-the-service-account.md)). §3.5 defines the dictionary, and
nearly all of it is formulas:

::: gray-paper 3.5

#### §3.5 Dictionaries {#gp-3-5}

<a id="gp-3-5-p1"></a>A *dictionary* is a possibly partial mapping from some domain into some co-domain in much the same manner as a regular function. Unlike functions however, with dictionaries the total set of pairings are necessarily enumerable, and we represent them in some data structure as the set of all $\left(key \mapsto value\right)$ pairs. (In such data-defined mappings, it is common to name the values within the domain a *key* and the values within the co-domain a *value*, hence the naming.)

<a id="gp-3-5-p2"></a>Thus, we define the formalism $\left\langle\!\left\vert \mathrm{K}\to\mathrm{V}\right\vert\!\right\rangle$ to denote a dictionary which maps from the domain $\mathrm{K}$ to the range $\mathrm{V}$. It is a subset of the power set of pairs $\!\left\lgroup K, V\right\rgroup\!$:

<a id="gp-3-5-p3"></a><a id="eq-3-3"></a>

$$
\begin{equation}
\left\langle\!\left\vert \mathrm{K}\to\mathrm{V}\right\vert\!\right\rangle \subset \left\{\mkern-5mu\left[\,\!\left\lgroup\mathrm{K}, \mathrm{V}\right\rgroup\!\,\right]\mkern-5mu\right\} \tag{3.3}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-subset">$\subset$</span> | is a proper subset of | everything in the left is in the right, and the right has more |
| <span id="gk-protoset">$\left\{\mkern-5mu\left[\,x\,\right]\mkern-5mu\right\}$</span> | the set of | a set written in order: no repeats, kept sorted |
| <span id="gk-tuple">$\!\left\lgroup x\right\rgroup\!$</span> | the tuple of | a record: named fields, each with its type, like an object in JSON |

</details>

<a id="gp-3-5-p4"></a>The subset is caused by a constraint that a dictionary's members must associate at most one unique value for any given key $k$:

<a id="gp-3-5-p5"></a><a id="eq-3-4"></a>

$$
\begin{equation}
\forall \mathrm{K}, \mathrm{V}, \mathbf{d} \in \left\langle\!\left\vert \mathrm{K}\to\mathrm{V}\right\vert\!\right\rangle : \forall \left(k, v\right) \in \mathbf{d} : \exists! v' : \left(k, v'\right) \in \mathbf{d} \tag{3.4}
\end{equation}
$$

<a id="gp-3-5-p6"></a>In the context of a dictionary we denote the pairs with a mapping notation:

<a id="gp-3-5-p7"></a><a id="eq-3-5"></a><a id="eq-3-6"></a>

$$
\begin{align}
&\left\langle\!\left\vert \mathrm{K}\to\mathrm{V}\right\vert\!\right\rangle \equiv \left\{\mkern-5mu\left[\,\!\left\lgroup\mathrm{K} \to \mathrm{V}\right\rgroup\!\,\right]\mkern-5mu\right\} \tag{3.5} \\
&\mathbf{p} \in \!\left\lgroup\mathrm{K} \to \mathrm{V}\right\rgroup\! \Leftrightarrow \exists k \in \mathrm{K}, v \in \mathrm{V}, \mathbf{p} \equiv \left(k \mapsto v\right) \tag{3.6}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-keyvalue">$\!\left\lgroup x \to y\right\rgroup\!$</span> | K to V | one key paired with one value |
| <span id="gk-Leftrightarrow">$\Leftrightarrow$</span> | exactly when | if and only if: both sides are true together, or false together |
| <span id="gk-kv">$\left(x \mapsto y\right)$</span> | k maps to v | a dictionary entry: key k, value v |

</details>

<a id="gp-3-5-p8"></a>This assertion allows us to unambiguously define the subscript and subtraction operator for a dictionary $d$:

<a id="gp-3-5-p9"></a><a id="eq-3-7"></a><a id="eq-3-8"></a>

$$
\begin{align}
&\forall \mathrm{K}, \mathrm{V}, \mathbf{d} \in \left\langle\!\left\vert \mathrm{K}\to\mathrm{V}\right\vert\!\right\rangle: \mathbf{d}\left[k\right] \equiv \begin{cases}
v & \text{if}\ \exists k : \left(k \mapsto v\right) \in \mathbf{d} \\
\emptyset & \text{otherwise}
\end{cases} \tag{3.7} \\
&\begin{aligned}
&\forall \mathrm{K}, \mathrm{V}, \mathbf{d} \in \left\langle\!\left\vert \mathrm{K}\to\mathrm{V}\right\vert\!\right\rangle, \mathbf{s} \subseteq K:\\
&\quad \mathbf{d} \setminus \mathbf{s} \equiv \left\{\, \left(k \mapsto v\right): \left(k \mapsto v\right) \in \mathbf{d}, k \not\in \mathbf{s} \,\right\}
\end{aligned} \tag{3.8}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-subseteq">$\subseteq$</span> | is a subset of | everything in the left is in the right |
| <span id="gk-setminus">$\setminus$</span> | without | the left side with every item of the right taken out |

</details>

<a id="gp-3-5-p10"></a>Note that when using a subscript, it is an implicit assertion that the key exists in the dictionary. Should the key not exist, the result is undefined and any block which relies on it must be considered invalid.

<a id="gp-3-5-p11"></a>To denote the active domain (i.e.  set of keys) of a dictionary $\mathbf{d} \in \left\langle\!\left\vert K\to V\right\vert\!\right\rangle$, we use $\mathcal{K}\left(\mathbf{d}\right) \subseteq K$ and for the range (i.e.  set of values), $\mathcal{V}\left(\mathbf{d}\right) \subseteq V$. Formally:

<a id="gp-3-5-p12"></a><a id="eq-3-9"></a><a id="eq-3-10"></a>

$$
\begin{align}
\forall \mathrm{K}, \mathrm{V}, \mathbf{d} \in \left\langle\!\left\vert \mathrm{K}\to\mathrm{V}\right\vert\!\right\rangle : \mathcal{K}\left(\mathbf{d}\right) &\equiv \left\{\,k \;\middle\vert\; \exists v : \left(k \mapsto v\right) \in \mathbf{d}\,\right\} \tag{3.9} \\
\forall \mathrm{K}, \mathrm{V}, \mathbf{d} \in \left\langle\!\left\vert \mathrm{K}\to\mathrm{V}\right\vert\!\right\rangle : \mathcal{V}\left(\mathbf{d}\right) &\equiv \left\{\,v \;\middle\vert\; \exists k : \left(k \mapsto v\right) \in \mathbf{d}\,\right\} \tag{3.10}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-keys">$\mathcal{K}\left(x\right)$</span> | K of | a dictionary's keys |
| <span id="gk-values">$\mathcal{V}\left(x\right)$</span> | V of | a dictionary's (or sequence's) values |

</details>

<a id="gp-3-5-p13"></a>Note that since the co-domain of $\mathcal{V}\left(\right)$ is a set, should different keys with equal values appear in the dictionary, the set will only contain one such value.

<a id="gp-3-5-p14"></a>Dictionaries may be combined through the union operator $\cup$, which priorities the right-side operand in the case of a key-collision:

<a id="gp-3-5-p15"></a><a id="eq-3-11"></a>

$$
\begin{equation}
\forall \mathbf{d} \in \mathrm{K}, \mathrm{V}, \left(\mathbf{d}, \mathbf{e}\right) \in \left\langle\!\left\vert \mathrm{K}\to\mathrm{V}\right\vert\!\right\rangle^2 : \mathbf{d} \cup \mathbf{e} \equiv (\mathbf{d} \setminus \mathcal{K}\left(\mathbf{e}\right)) \cup \mathbf{e} \tag{3.11}
\end{equation}
$$

:::

In plain words, the whole of §3.5 is a JavaScript `Map` with rules you already follow:

- **(3.3) and (3.4).** A dictionary is a set of key and value pairs in which no key
  appears twice. Read (3.4) aloud: "for every dictionary d, for every pair (k, v) in d,
  there is exactly one v′ such that (k, v′) is in d." The ∃! is "there is exactly one".
- **(3.5) and (3.6).** The pairs are written k ↦ v, "k maps to v".
- **(3.7).** d[k] is the value at key k, or ∅ if there is none; the text after it adds
  that writing d[k] at all claims k is there, and a block that leans on a missing key is
  invalid. **(3.8).** d ∖ s is d with every key in s removed, `keys.forEach((k) =>
  d.delete(k))` on a copy.
- **(3.9) and (3.10).** 𝒦(d) is the set of keys, `new Set(d.keys())`; 𝒱(d) the set of
  values, repeats collapsed.
- **(3.11).** d ∪ e joins two dictionaries, and on a clash the right side wins: read it
  aloud, "d union e is d without e's keys, union e". That is `new Map([...d, ...e])`, or
  `{ ...d, ...e }`.

**On a real value.** The `always_accumulate-1` vector's always-accumulate services, χ_Z,
are the dictionary {1729 ↦ 100,000}: service 1729, with 100,000 gas. Then:

```text
χ_Z[1729]          100,000          the value at key 1729
χ_Z[5]             ∅                no key 5: a block relying on it is invalid
𝒦(χ_Z)             {1729}           the keys
𝒱(χ_Z)             {100,000}        the values
χ_Z ∪ e            {1729 ↦ 50,000, 5 ↦ 10}   with a made-up e = {1729 ↦ 50,000, 5 ↦ 10}:
                                    1729 clashes, and e's value wins
```

**In your client.** A `Map` wherever the paper writes ⟨|K → V|⟩: the accounts by service
id, an account's storage by key ([19.2](./19-block-import/02-the-whole-state.md)).

### 9. The disputes state

::: gray-paper-eq 10.1

<a id="ex-10-1"></a>The Gray Paper's (10.1), [in its place in the paper's words](./10-disputes/01-votes-and-verdicts.md#eq-10-1):

$$
\begin{equation}
\psi \equiv \left(\psi_G, \psi_B, \psi_W, \psi_O\right) \tag{10.1}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-goodset" class="gk-wrap">$\psi_G$</span> | psi sub G | the good set: hashes of every report a verdict found valid |
| <span id="gk-badset" class="gk-wrap">$\psi_B$</span> | psi sub B | the bad set: hashes of every report a verdict found invalid |
| <span id="gk-wonkyset" class="gk-wrap">$\psi_W$</span> | psi sub W | the wonky set: hashes of every report whose verdict split, so nobody can tell |
| <span id="gk-offenders" class="gk-wrap">$\psi_O$</span> | psi O | the offenders: Ed25519 keys of validators found to have judged a report wrongly |

</details>

:::

(10.1), §10.1's first line: "the disputes state is the good set, the bad set, the wonky set and the
offenders." Four sets of hashes and keys, each named by a capital subscript. The paper's
word *judgement* is one validator's vote; a *verdict* is the collected votes on one
report, and it lands the report's hash in one of the first three sets
([10.1](./10-disputes/01-votes-and-verdicts.md)).

### 10. An assurance

::: gray-paper-eq 11.11

<a id="ex-11-11"></a>The Gray Paper's (11.11), [in its place in the paper's words](./11-assurances/01-available.md#eq-11-11):

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
| <span id="gk-isa">[$x\in y$](./symbols.md#in)</span> | in | belongs to: the field's type |
| <span id="gk-bitstring">$\mathbb{b}$</span> | b sub n | bits: a run of true-or-false values; a subscript is how many |
| <span id="gk-xa-assurer">$v$</span> | v | the assuring validator's index in κ |
| <span id="gk-Nmax">[$\mathbb{N}_{x}$](./symbols.md#naturals)</span> | N sub n | the whole numbers below n: ℕ_C is a core index, 0 to C − 1 |
| <span id="gk-xa-signature">$s$</span> | s | the assurer's Ed25519 signature over the parent hash and the bitfield |
| <span id="gk-edsignaturebase" class="gk-wrap">$\bar{\mathbb{V}}$</span> | V bar | an Ed25519 signature: 64 bytes |

</details>

:::

(11.11): "the assurances extrinsic is a sequence of tuples: an anchor hash, a bitstring
of C bits, a validator index below the validator count, and an Ed25519 signature."
The barred 𝕍 is the set of valid Ed25519 signatures. One bit per core: on tiny, two
bits in one byte, and the vectors' `bitfield` of `0x01` says "I hold core 0's data"
([11.1](./11-assurances/01-available.md)). §3.7.3 defines the bitstring 𝕓:

::: gray-paper 3.7.3

#### §3.7.3 Boolean values {#gp-3-7-3}

<a id="gp-3-7-3-p1"></a>$\mathbb{b}_{s}$ denotes the set of Boolean strings of length $s$, thus $\mathbb{b}_{s} = \left[\!\left[{\left\{\,\bot, \top\,\right\}}\right]\!\right]_{s}$. When dealing with Boolean values we may assume an implicit equivalence mapping to a bit whereby $\top = 1$ and $\bot = 0$, thus $\mathbb{b}_{\Box} = \left[\!\left[\mathbb{N}_2\right]\!\right]_{\Box}$. We use the function $\text{bits}(\mathbb{B}_{}) \in \mathbb{b}_{}$ to denote the sequence of bits, ordered with the most significant first, which represent the octet sequence $\mathbb{B}_{}$, thus $\text{bits}(\left[160, 0\right]) = \left[1, 0, 1, 0, 0, \dots\right]$.

<a id="gp-3-7-3-p2"></a>The unary-not operator applies to both boolean values and sequences of boolean values, thus $\neg \top = \bot$ and $\neg \left[\top, \bot\right] = \left[\bot, \top\right]$.

:::

In plain words: 𝕓_C is C true-or-false values, and the paper treats ⊤ as 1 and ⊥ as 0.
bits(·) reads bytes as bits, highest bit first: 160 is `10100000`. ¬ flips each bit.
Which bit of a byte is which core is the codec's business, Appendix C, and it reads the
lowest bit first ([11.1](./11-assurances/01-available.md)).

### 11. A guarantee

::: gray-paper-eq 11.24

<a id="ex-11-24"></a>The Gray Paper's (11.24), [in its place in the paper's words](./12-guarantees/index.md#eq-11-24):

$$
\begin{equation}
\mathbb{G} \equiv \!\left\lgroup
\mathbf{r}\in \mathbb{R},\,
t\in \mathbb{N}_T,\,
a\in \left[\!\left[\!\left\lgroup\mathbb{N}, \bar{\mathbb{V}}\right\rgroup\!\right]\!\right]_{2:3}
\right\rgroup\! \tag{11.24}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-guarantee" class="gk-wrap">$\mathbb{G}$</span> | G | the set of guarantees: a work-report, the slot it was made at, and two or three guarantors' signatures |
| <span id="gk-workreport" class="gk-wrap">$\mathbb{R}$</span> | R | the set of work-reports: a core's signed receipt for one work-package |
| <span id="gk-g-timeslot">$t$</span> | t | a guarantee's timeslot: the slot its guarantors signed it in |
| <span id="gk-timeslot" class="gk-wrap">$\mathbb{N}_T$</span> | N sub T | a timeslot: a u32 counting 6-second slots |

</details>

:::

(11.24): "a guarantee is a work-report, a timeslot, and a credential of two to three pairs
of a validator index and a signature." The subscript 2:3 on the sequence is a range: at
least two, at most three. The report inside is the in-core work; the credential is what
the chain checks ([12.2](./12-guarantees/02-signed-and-counted.md)).

### 12. The PVM

::: gray-paper-eq 4.22

<a id="ex-4-22"></a>The Gray Paper's (4.22), [in its place in the paper's words](./what-runs-where.md#eq-4-22):

$$
\begin{equation}
\Psi\colon
\!\left\lgroup\,
\begin{alignedat}{2}
&\mathbb{B}_{},\,\ \ &&\mathbb{N}_R\\
&\mathbb{N}_G,\,\ \ &&{\left\{\,\bot, \top\,\right\}}\\
&\left[\!\left[\mathbb{N}_R\right]\!\right]_{13},\,\ \ &&\mathbb{M}\\
\end{alignedat}
\,\right\rgroup\!
\to
\!\left\lgroup\,
\begin{aligned}
&\left\{\,\blacksquare, \unicode{x21AF}, \infty\,\right\} \cup \left\{\,\unicode{x2132},\hbar\,\right\} \times \mathbb{N}_R, \mathbb{N}_R,\\
&\mathbb{N}_G,\ \ \ {\left\{\,\bot, \top\,\right\}},\ \ \ \left[\!\left[\mathbb{N}_R\right]\!\right]_{13},\ \ \ \mathbb{M}
\end{aligned}
\,\right\rgroup\! \tag{4.22}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-Psi">$\Psi$</span> | psi (capital) | the PVM: a program, a gas limit, registers and memory in; how it stopped and what's left out |
| <span id="gk-pvmreg" class="gk-wrap">$\mathbb{N}_R$</span> | N sub R | a register's value: a u64 |
| <span id="gk-gas" class="gk-wrap">$\mathbb{N}_G$</span> | N sub G | an amount of gas: a u64 |
| <span id="gk-bool">${\left\{\,\bot, \top\,\right\}}$</span> | true or false | a yes-or-no value: true (⊤) or false (⊥) |
| <span id="gk-ram" class="gk-wrap">$\mathbb{M}$</span> | M | a PVM memory: its bytes, and which pages may be read or written |
| <span id="gk-halt" class="gk-wrap">$\blacksquare$</span> | halt | ∎: the program finished normally |
| <span id="gk-panic">$\unicode{x21AF}$</span> | panic | ↯: the program trapped |
| <span id="gk-oog" class="gk-wrap">$\infty$</span> | out of gas | ∞: the program ran out of gas |
| <span id="gk-fault">$\unicode{x2132}$</span> | page fault | Ⅎ: the program touched memory it may not |
| <span id="gk-host" class="gk-wrap">$\hbar$</span> | host call | ħ: the program asked the host for something, and waits |
| <span id="gk-times">$\times$</span> | times | multiply; between sets, every pair of one from each |

</details>

:::

(4.22), §4.7's type line for the whole machine, which Appendix A's (A.1) repeats before its body: "the PVM takes a program blob, an
instruction counter, a gas amount, a flag, thirteen registers and a memory, and gives
back how it stopped, the counter, the gas, the flag, the registers and the memory." The
× in the output joins a reason with a number: a fault comes with the address that caused
it, a host call with its index. The paper draws the five ways to stop as small pictures,
a black square for halt, a lightning bolt for panic, ∞ for out of gas, an upside-down F
for a fault and ħ for a host call, and says which is which right under Ψ's definition. The
flag is new in 0.8.0: whether the current basic block's gas has been charged
([15.3](./15-the-pvm/03-the-machine.md)).

### 13. Accumulation's type

::: gray-paper-eq 12.17

<a id="ex-12-17"></a>The Gray Paper's (12.17), [in its place in the paper's words](./17-accumulation/09-the-blocks-gas-budget.md#eq-12-17):

$$
\begin{equation}
\Delta_+\colon\left\{ \begin{aligned}
&\!\left\lgroup\mathbb{N}_G, \left[\!\left[\mathbb{X}\right]\!\right]_{}, \left[\!\left[\mathbb{R}\right]\!\right]_{}, \mathbb{S}, \left\langle\!\left\vert \mathbb{N}_S\to\mathbb{N}_G\right\vert\!\right\rangle\right\rgroup\! \to \!\left\lgroup\mathbb{N}, \mathbb{S}, B, U, \left[\!\left[\mathbb{X}\right]\!\right]_{}\right\rgroup\! \\
&\left(g, \mathbf{t}, \mathbf{r}, \mathbf{e}, \mathbf{f}\right) \!\mapsto\! \begin{cases}
\left(0, \mathbf{e}, \left\{\right\}, \left[\right], \left[\right]\right) &
\text{if } n = 0 \\
\left(i + j, \mathbf{e}', \mathbf{b}^* \!\cup \mathbf{b}, \mathbf{u}^* \!\!\frown \mathbf{u}, \mathbf{t} \frown \mathbf{t}^\dagger\right)\!\!\!\! &
\text{o/w}\!\!\!\!\!\!\!\! \\
\end{cases} \\
&\quad \text{where } i = \max(\mathbb{N}_{\left\vert\mathbf{r}\right\vert + 1}): \\
&\qquad \sum_{r \in \mathbf{r}_{\dots i}, d \in r_{\mathbf{d}}}\!\!\!\!\!\!\!\!(d_{g}) + \sum_{t \in \mathbf{t}}(t_{g}) + \!\!\!\!\sum_{x \in \mathcal{V}\left(\mathbf{f}\right)}\!\!\!\!(x) \le g \\
&\quad \text{and } n = i + \left\vert\mathbf{t}\right\vert + \left\vert\mathbf{f}\right\vert \\
&\quad \text{and } \left(\mathbf{e}^*\!\!, \mathbf{t}^*\!\!, \mathbf{b}^*\!\!, \mathbf{u}^*\right) = \Delta_*(\mathbf{e}, \mathbf{t},\mathbf{r}_{\dots i}, \mathbf{f}) \\
&\quad \text{and } \left(j, \mathbf{e}'\!, \mathbf{b}, \mathbf{u}, \mathbf{t}^\dagger\right) = \Delta_+(g^*, \mathbf{t}^*\!\!, \mathbf{r}_{i\dots}, \mathbf{e}^*\!\!, \left\{\right\})\\
&\quad \text{and } g^* = g + \sum_{t \in \mathbf{t^*}}(t_{g}) - \!\!\!\!\!\!\sum_{\left(s, u\right) \in \mathbf{u}^*}\!\!\!\!\!\!(u)
\end{aligned} \right. \tag{12.17}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-accseq" class="gk-wrap">$\Delta_+$</span> | Delta plus | the outer accumulation: rounds of Δ\*, each taking the reports that fit the gas left, until no reports fit and no transfers wait |
| <span id="gk-defxfers">$\left[\!\left[\mathbb{X}\right]\!\right]$</span> | a sequence of transfers | a list of deferred transfers, in order |
| <span id="gk-workreports">$\left[\!\left[\mathbb{R}\right]\!\right]$</span> | a sequence of work-reports | a list of work-reports, in order |
| <span id="gk-partialstate" class="gk-wrap">$\mathbb{S}$</span> | S | a partial state: the parts of the state accumulation may change: accounts, next validators, authorizer queues and the privileges |
| <span id="gk-local-fnservouts">$B$</span> | B | the yields: a set of pairs (service, 32-byte hash) |
| <span id="gk-local-fngasused">$U$</span> | U | the gas used: a list of pairs (service, gas), one per run |
| <span id="gk-psX" class="gk-wrap">$\mathbf{e}$</span> | e | a partial state: the accounts, next validators, queues and privileges a run works on |
| <span id="gk-emset">$\left\{\right\}$</span> | the empty set | a set, or a dictionary, with nothing in it |
| <span id="gk-dagger">$\dagger$</span> | dagger | a mark making a new name from an old one: δ† is δ partway through the block, 𝐭† another list of transfers |
| <span id="gk-max">$\max$</span> | max of | the largest of the values in the brackets |
| <span id="gk-wr-digests" class="gk-wrap">$\mathbf{d}$</span> | d | the report's digests, one per work-item, 1 to 16 of them (`results`) |
| <span id="gk-wd-gaslimit">$g$</span> | g | the gas the item's accumulation may use (`accumulate_gas`) |
| <span id="gk-le">$\le$</span> | at most | less than or equal to |
| <span id="gk-accpar" class="gk-wrap">$\Delta_*$</span> | Delta star | one round of accumulation: every service with work runs once, all from the same state, and their results are merged |

</details>

:::

(12.17): "the outer accumulation takes a gas limit, the transfers to deliver, the reports
to accumulate, a partial state and the free services with their gas, and gives back how
many reports it took, the new partial state, the yields, the gas each service used, and
the transfers still to deliver." A type line this long is a list of what a function needs
and what it changes, and it answers the interview's question on its own: accumulation
runs on the chain, on every validator, over a partial state 𝕊 that a service may change,
with the reports as its inputs ([17.4](./17-accumulation/04-rounds.md)).

## Traps

- **⟦T⟧ and [a, b].** Double brackets are a *set* of sequences, a type; single brackets
  are one sequence, a value. "x ∈ ⟦ℍ⟧" is "x is a list of hashes"; "[h]" is a list of one.
- **𝔹 and ℕ.** A byte is in 𝔹₁, and a number below 256 is in ℕ₂₅₆; the paper keeps them
  apart (§3.7.4, below) because a byte encodes as itself and a number as one to nine bytes.
- **Two phis.** The straight ϕ is the authorizer queue; the curly φ is the PVM's
  registers. Both appear in Appendix B's accumulate invocation.
- **The paper's order and the bytes' order.** The header (5.1) and the extrinsic (4.3)
  list their fields in one order and Appendix C encodes them in another. Point at the
  equation for the fields; at Appendix C for a dump.
- **Judgement and verdict.** A judgement is one vote; a verdict is a report's collected
  votes. ψ holds verdicts' results, by report hash.
- **ρ and ω.** ρ holds reports waiting to be *available*, one per core; ω holds reports
  that are available and waiting on their *dependencies* to accumulate. Both are "pending".
- **A prime on the right.** In y ≺ (…, x′), the prime says x′ must be computed first. In
  α′[c] ≡ …, it says this is the new value. Same mark, two jobs.
- **Who runs it.** A type line never says where its function runs. Υ, Δ and the state
  rules run on every validator; Ψ_I and Ψ_R, the authorizer and refine, run in-core on
  three; a work-package is built off the chain ([What runs where](./what-runs-where.md)).

The 𝔹 and ℕ trap is the last sentence of §3.7.4:

::: gray-paper 3.7.4

#### §3.7.4 Octets and Blobs {#gp-3-7-4}

<a id="gp-3-7-4-p1"></a>$\mathbb{B}_{}$ denotes the set of octet strings (“blobs”) of arbitrary length. As might be expected, $\mathbb{B}_{x}$ denotes the set of such sequences of length $x$. $\mathbb{B}_{\$}$ denotes the subset of $\mathbb{B}_{}$ which are ASCII-encoded strings. Note that while an octet has an implicit and obvious bijective relationship with natural numbers less than 256, and we may implicitly coerce between octet form and natural number form, we do not treat them as exactly equivalent entities. In particular for the purpose of <abbr class="gp-term" title="turning a value into bytes, so it can be hashed, signed or sent">serialization</abbr>, an octet is always serialized to itself, whereas a natural number may be serialized as a sequence of potentially several octets, depending on its magnitude and the encoding variant.

:::

In plain words: 𝔹 is bytes, any number of them, and 𝔹₃₂ exactly 32. 𝔹 with a dollar sign
is text in ASCII. A byte and a small number look the same, but the codec writes the byte
`80` as `80` and the number 128 as `80 80` ([2.2](./02-codec/02-compact-naturals.md)).

## With the paper open

Asked about a thing, with the paper in front of you, do these four in order. They take
under a minute and they are what an interviewer listens for.

1. **Find its line.** Appendix I for the symbol ([quoted whole on the symbols
   page](./symbols.md#the-paper-s-own-index)), then the equation it names. If you know
   the section, its first equation is the type.
2. **Read the type line aloud.** What it's made from, field by field, with the paper's
   names: "an authorizer hash is ℋ of the code hash followed by the configuration blob."
3. **Say where it runs.** Off the chain, in-core on a core's three guarantors, or on the
   chain on every validator, and what the chain sees of it: for an authorizer, only the
   hash, in a pool.
4. **Then the rule.** The one equation that uses it, read as in the examples above: for
   an authorizer, (11.32), "its hash must be in its core's pool," and (8.2), how the pool
   turns over.

The same four steps answer "what is a work-report" (§11.1, its tuple, made in-core, checked
on the chain, (11.32) again), "what is a service" (§9, 𝔸, lives on the chain, runs in-core
for refine and on the chain for accumulate, (12.17)), and "what is the state" ((4.4), the
seventeen letters, kept on every validator, Appendix D for its root). Practice them on the
[Part pages](./index.md): each ends with the sections, the names and the line.
