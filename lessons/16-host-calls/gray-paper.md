# The formulas, in plain words

[Part 16](./index.md)'s appendix: every formula of Appendix B, *Virtual Machine
Invocations*, (B.1) to (B.21), explained, and its three tables of host calls, row by row.
Your client builds some: Ψ_A, accumulation, and the host calls it answers. Guarantors run
the others, Is-Authorized and refine, in-core; each section says which. The tables have no
equation numbers, so they are quoted whole, each row explained under them. Each formula: its
key, then read aloud, in plain words, on a real value, in your client. Notation: [Reading
the Gray Paper](../reading-the-gray-paper.md).

One reading tip for the whole appendix. Every machine run returns how it stopped, written
with a sign: ▸ carry on, ∎ halt, ↯ panic, ∞ out of gas. And ϱ is the gas, φ the 13
registers (φ₇ the first one a host call reads), μ the memory.

## (B.1) and (B.2): Is-Authorized, the gatekeeper's run

::: gray-paper-eq B.1

<a id="ex-B-1"></a>The Gray Paper's (B.1), (B.2), [in its place in the paper's words](./index.md#eq-B-1):

$$
\begin{align}
\Psi_I &\colon \left\{ \begin{aligned}
\!\left\lgroup\mathbb{P}, \mathbb{N}_{\mathsf{C}}\right\rgroup\! &\to \!\left\lgroup\mathbb{B}_{} \cup \mathbb{E}, \mathbb{N}_G\right\rgroup\! \\
\left(\mathbf{p}, c\right) &\mapsto \begin{cases}
\left(\texttt{BAD}, 0\right) &\text{if } \mathbf{p}_{\mathbf{u}} = \emptyset \\
\left(\texttt{BIG}, 0\right) &\text{otherwise if } \left\vert\mathbf{p}_{\mathbf{u}}\right\vert > \mathsf{W}_A \\
\left(\mathbf{r}, u\right) &\text{otherwise} \\
\text{where } \left(u, \mathbf{r}, \emptyset\right) = \Psi_M(\mathbf{p}_{\mathbf{u}}, 0, \mathsf{G}_I, \mathcal{E}_{2}\left(c\right), F, \emptyset)\\
\end{cases}\\
\end{aligned} \right. \tag{B.1} \\
F \in \Omega\left\langle\left\{\right\}\right\rangle &\colon
\left(n, \varrho, \varphi, \mu\right) \mapsto \begin{cases}
\Omega_G(\varrho, \varphi, \mu) &\text{if } n = \mathtt{gas} \\
\Omega_{\unicode{x264A}}(\varrho, \varphi, \mu, \mathbf{p}_{\mathbf{u}}) &\text{if } n = \mathtt{grow\_heap} \\
\Omega_Y(\varrho, \varphi, \mu, \mathbf{p}, \emptyset, \emptyset, \emptyset, \emptyset, \emptyset, \emptyset, \emptyset) &\text{if } n = \mathtt{fetch} \\
\left(\infty, \varrho', \varphi', \mu\right) &\text{otherwise if } \varrho' < 0 \\
\left(\blacktriangleright, \varrho', \varphi', \mu\right) &\text{otherwise} \\
\text{where } \varphi' = \varphi \text{ except } \varphi'_7 = \mathtt{WHAT} \\
\text{and } \varrho' = \varrho - \mathsf{M}_{\emptyset}
\end{cases} \tag{B.2}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-Psi">$\Psi$</span> | psi (capital) | the PVM: a program, a gas limit, registers and memory in; how it stopped and what's left out |
| <span id="gk-abracegroup">$\left\{ \begin{aligned}x\end{aligned} \right.$</span> | as follows | a brace grouping lines that hold together: for a function, its type on top, then what each input becomes |
| <span id="gk-tuple">$\!\left\lgroup x\right\rgroup\!$</span> | the tuple of | a record: named fields, each with its type, like an object in JSON |
| <span id="gk-workpackage" class="gk-wrap">$\mathbb{P}$</span> | P | the set of work-packages: up to 16 work-items for one core, with their authorizer and context |
| <span id="gk-coreindex" class="gk-wrap">$\mathbb{N}_{\mathsf{C}}$</span> | N sub C | the core indices: 0 to C − 1 |
| <span id="gk-to">[$\to$](../symbols.md#to)</span> | to | what goes in, to what comes out: A → B takes an A and gives a B |
| <span id="gk-blob">[$\mathbb{B}$](../symbols.md#blobs)</span> | B, or B sub n | bytes: any run of them; 𝔹ₙ exactly n of them |
| <span id="gk-cup">$\cup$</span> | union | everything in either side |
| <span id="gk-workerror" class="gk-wrap">$\mathbb{E}$</span> | E | the set of work errors: out of gas, panic, bad exports, oversize, BAD (no code) and BIG (code too big) |
| <span id="gk-gas" class="gk-wrap">$\mathbb{N}_G$</span> | N sub G | an amount of gas: a u64 |
| <span id="gk-wpX" class="gk-wrap">$\mathbf{p}$</span> | p | a work-package |
| <span id="gk-mapsto">$\mapsto$</span> | maps to | what a function gives back for an input: x ↦ y says x becomes y |
| <span id="gk-token">$\texttt{x}$</span> | the string | a name in typewriter type: an instruction's or helper's name, or fixed bytes written as text: the ASCII bytes of its words; the dollar sign in front only marks them as text and is not one of the bytes |
| <span id="gk-wp-authcode" class="gk-wrap">$\mathbf{u}$</span> | u | the authorizer's code, found in the code host's preimages |
| <span id="gk-none" class="gk-wrap">$\emptyset$</span> | nothing | ∅: no value at all, like null |
| <span id="gk-len">$\left\vert x\right\vert$</span> | the size of | \|x\|: how many items x has, or how many bytes |
| <span id="gk-Cmaxauthcodesize" class="gk-wrap">$\mathsf{W}_A$</span> | W sub A | the most bytes an authorizer's code may have: 64,000 |
| <span id="gk-Cpackageauthgas" class="gk-wrap">$\mathsf{G}_I$</span> | G sub I | the gas an authorizer's run gets: 50,000,000 |
| <span id="gk-encode">[$\mathcal{E}\left(x\right)$](../symbols.md#encode)</span> | E of | the encoding of what's in the brackets: its bytes, by Appendix C's rules |
| <span id="gk-in">[$\in$](../symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-contextmutator">$\Omega\left\langle x\right\rangle$</span> | omega of X | a host's function: given a host call's number, the gas, registers, memory and the host's own context X, it says carry on or stop, with all of them updated |
| <span id="gk-emset">$\left\{\right\}$</span> | the empty set | a set, or a dictionary, with nothing in it |
| <span id="gk-gascounter" class="gk-wrap">$\varrho$</span> | rho (curly) | the gas left |
| <span id="gk-registers" class="gk-wrap">$\varphi$</span> | phi (curly) | the PVM's 13 registers |
| <span id="gk-memory" class="gk-wrap">$\mu$</span> | mu | the PVM's memory |
| <span id="gk-Omega">$\Omega$</span> | omega | a host call's function: Ω_G is gas, Ω_Y fetch, Ω_W write; one letter for each call |
| <span id="gk-Gemini">$\unicode{x264A}$</span> | Gemini | the sign that names grow_heap: Ω_♊ makes a program's heap bigger, a page at a time |
| <span id="gk-oog" class="gk-wrap">$\infty$</span> | out of gas | ∞: the program ran out of gas |
| <span id="gk-continue" class="gk-wrap">$\blacktriangleright$</span> | continue | ▸: the step went normally, and the next one may run |
| <span id="gk-Cgasunknown" class="gk-wrap">$\mathsf{M}_{\emptyset}$</span> | M sub nothing | what a host call this host doesn't know costs: 1,000 gas, and the answer WHAT |

</details>

:::

**Read it aloud.** "Psi I takes a work-package and a core index, and gives bytes or an
error, and an amount of gas. For package p and core c: BAD and 0 if p's authorizer code
is nothing; otherwise BIG and 0 if that code is longer than W sub A; otherwise r and u,
where u, r and nothing are what Psi M gives, running p's authorizer code from instruction
0, with G sub I gas, the core index encoded in 2 bytes as its argument, the host F, and
no context. F takes a call number n, the gas, the registers and the memory: if n is gas,
omega G; if grow_heap, omega Gemini, with the code; if fetch, omega Y, with the package
and nothing for every other item; otherwise, out of gas if the gas left is below zero,
else carry on; where phi 7 becomes WHAT and the gas goes down by M sub nothing."

**In plain words.** This is the authorizer of [Part 13](../13-authorization/index.md)
running, and it is the smallest of the three invocations:

1. **Find the code.** 𝐩_𝐮 is the authorizer's code: the package names it by hash, and
   some service keeps it as a preimage. No such code: BAD. Code over W_A = 64,000 bytes:
   BIG. Either way, no gas spent.
2. **Run it.** Ψ_M is the PVM's standard run ([lesson 15.8](../15-the-pvm/08-a-real-program.md)):
   lay the program out, start at instruction 0 with G_I = 50,000,000 gas, and hand it one
   argument, the core's index in 2 bytes, little-endian. What it returns is the trace,
   𝐫; u is the gas it used. If it panics or runs out of gas, 𝐫 is that error instead.
3. **(B.2), its host.** F answers three calls: `gas`, `grow_heap` and `fetch`. Through
   `fetch` the code reads the package: its token, its configuration, its items. Any other
   call costs M_∅ = 1,000 gas and answers WHAT, the same rule every invocation ends with.
   There's no context to carry (the ⟨{}⟩ after Ω), because the run changes nothing: it
   only says yes or no.

**On a real value.** The accumulate vector `process_one_immediate_report-1` carries a
report from core 1, with the two fields Ψ_I filled. The vectors make up their reports to
test accumulation, so no code really ran here, but the fields are the ones a real run
writes:

```text
c               1
E₂(c)           01 00                the argument: core 1 in 2 bytes, low byte first
gas limit       50,000,000           G_I
u               10                   auth_gas_used in the report
𝐫               (no bytes)           auth_output = 0x: the trace is empty, and still a yes
authorizer      bf52de5a…            the hash the chain checks against core 1's pool
```

**In your client.** Not built: your client never runs an authorizer. It decodes the
report's `auth_gas_used` and `auth_output` in [lesson 3.3](../03-work-and-reports/03-a-work-report.md),
and checks the authorizer's hash is in the core's pool in [13.1](../13-authorization/01-the-authorizer-pools.md).

## (B.3): how long a forgotten preimage stays

::: gray-paper B.3 1-3

#### Appendix B.3 Refine Invocation {#gp-B-3}

<a id="gp-B-3-p1"></a>We define the Refine service-account <abbr class="gp-term" title="one run of code in the PVM: Is-Authorized, refine or accumulate">invocation</abbr> function as $\Psi_R$. It has no general access to the state of the JAM chain, with the slight exception being the ability to make a <abbr class="gp-term" title="reading a service's preimage as it was at a past slot">historical lookup</abbr>. Beyond this it is able to create inner instances of the PVM and dictate pieces of data to export.

<a id="gp-B-3-p2"></a>The historical-lookup host-call function, $\Omega_H$, is designed to give the same result regardless of the state of the chain for any time when auditing may occur (which we bound to be less than two epochs from being accumulated). The lookup anchor may be up to $\mathsf{L}$ timeslots before the recent history and therefore adds to the potential age at the time of audit. We therefore set $\mathsf{D}$ to have a safety margin of eight hours:

<a id="gp-B-3-p3"></a><a id="eq-B-3"></a>

$$
\begin{equation}
\mathsf{D} \equiv \mathsf{L} + 4,800 = 19,200 \tag{B.3}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-Cexpungeperiod" class="gk-wrap">$\mathsf{D}$</span> | D | the expunge period: slots a forgotten preimage is kept before it may go, 19,200 on full, 32 on tiny |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-Cmaxlookupanchorage" class="gk-wrap">$\mathsf{L}$</span> | L | the oldest a lookup anchor may be: 14,400 slots, 24 hours |

</details>

:::

**Read it aloud.** "D is defined as L plus 4,800, which is 19,200."

**In plain words.** Refine may read a service's preimages as they were at the package's
lookup-anchor block, with `historical_lookup`. Auditors re-run refine later, to check the
guarantors, and they must get the same answer. So a preimage a service has forgotten
must stay in the state long enough: the anchor can be up to L = 14,400 slots old, and the
paper adds 4,800 slots, eight hours at 6 seconds a slot, as a margin for auditing. That's
D, the expunge period: [lesson 16.9](./09-asking-for-preimages.md)'s `forget` only drops
a preimage forgotten more than D slots ago.

**On a real value.**

```text
L                14,400 slots        24 hours: the oldest a lookup anchor may be
margin           4,800 slots         8 hours
D = L + 4,800    19,200 slots        32 hours, on the full network
D on tiny        32 slots            set on its own: 24 + 4,800 would be 4,824
```

The tiny network doesn't follow the formula: its D is 32, so tests can watch a preimage
expire in a few dozen slots.

**In your client.** `expunge_period` in `src/config.ts`, which
[16.9](./09-asking-for-preimages.md#the-code)'s `forget` takes.

## (B.4): a machine inside the machine

::: gray-paper B.3 4-5

#### Appendix B.3 Refine Invocation, continued

<a id="gp-B-3-p4"></a>The inner PVM invocation host-calls, meanwhile, depend on an integrated PVM type, which we shall denote $\mathbb{I}$. It holds a PVM program blob, instruction counter, RAM and a flag denoting whether gas was already charged for the currently executing <abbr class="gp-term" title="a run of instructions with one way in; a jump may only land at its start">basic block</abbr>:

<a id="gp-B-3-p5"></a><a id="eq-B-4"></a>

$$
\begin{equation}
\mathbb{I} \equiv \!\left\lgroup\mathfrak{p}\in \mathbb{B}_{}, \mathbf{u}\in \mathbb{M}, i\in \mathbb{N}_R, \tilde{g}\in {\left\{\,\bot, \top\,\right\}}\right\rgroup\! \tag{B.4}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-innerpvm" class="gk-wrap">$\mathbb{I}$</span> | I | an inner machine: a PVM a refining service starts inside its own, with its code, memory, instruction counter and a flag |
| <span id="gk-isa">[$x\in y$](../symbols.md#in)</span> | in | belongs to: the field's type |
| <span id="gk-pg-code" class="gk-wrap">$\mathfrak{p}$</span> | gothic p | an inner machine's program: its code, as bytes |
| <span id="gk-ram" class="gk-wrap">$\mathbb{M}$</span> | M | a PVM memory: its bytes, and which pages may be read or written |
| <span id="gk-pg-pc">$i$</span> | i | an inner machine's instruction counter: where it carries on from |
| <span id="gk-pvmreg" class="gk-wrap">$\mathbb{N}_R$</span> | N sub R | a register's value: a u64 |
| <span id="gk-pg-gaschargedflag" class="gk-wrap">$\tilde{g}$</span> | g tilde | true when gas is already paid for the basic block the inner machine is in |
| <span id="gk-bool">${\left\{\,\bot, \top\,\right\}}$</span> | true or false | a yes-or-no value: true (⊤) or false (⊥) |

</details>

:::

**Read it aloud.** "I is defined as a tuple of: gothic p, in bytes; u, a memory;
i, a register's value; and g tilde, true or false."

**In plain words.** Refine may start whole PVMs of its own, inner machines, and run them
a piece at a time: a virtual machine inside a virtual machine. 𝕀 is what refine keeps
about each one so it can stop it and carry on later: its program 𝔭, its memory 𝐮, its
instruction counter i, and g̃, whether the basic block it stopped in is already paid for
(gas is charged a block at a time, [lesson 15.11](../15-the-pvm/11-the-gas-meter.md), so a
machine stopped halfway through a block mustn't pay for it twice). Refine holds them in
a dictionary, 𝐦, from a number to an 𝕀.

**On a real value.** Made up, since no vector runs refine: a refining service calls
`machine` with a 100-byte program, to start at instruction 0.

```text
n            0                     the lowest number not yet in 𝐦
𝐦[0]         (the 100 bytes, an empty memory, 0, false)
gas          1,862 + 𝒢(112, 100)   the machine call's price, (B.17)
             = 1,862 + 11 = 1,873  112 × 100 = 11,200; / 1,024 = 10.9…, up to 11
```

**In your client.** Not built: inner machines exist only in refine.

## (B.5) and (B.6): Ψ_R, refining one work-item

::: gray-paper B.3 6-8

#### Appendix B.3 Refine Invocation, continued

<a id="gp-B-3-p6"></a>The Export host-call depends on two pieces of context; one sequence of segments (blobs of length $\mathsf{W}_G$) to which it may append, and the other an argument passed to the invocation function to dictate the number of segments prior which may assumed to have already been appended. The latter value ensures that an accurate segment index can be provided to the caller.

<a id="gp-B-3-p7"></a>Unlike the other invocation functions, the Refine invocation function implicitly draws upon some recent service account state item $\delta$. The specific block from which this comes is not important, as long as it is no earlier than its work-package's <abbr class="gp-term" title="the block whose state an in-core run's lookups saw; it must be final and recent">lookup-anchor</abbr> block. It explicitly accepts the work-package $p$ and the index of the work item to be refined, $i$ together with the core which is doing the refining $c$. Additionally, the authorizer trace $\mathbf{r}$ is provided together with all work items' import segments $\overline{\mathbf{i}}$ and an export segment offset $\varsigma$. It results in a tuple of some error $\mathbb{E}$ or the refinement output blob (signalling success), the export sequence in the case of success and the gas used in evaluation. Formally:

<a id="gp-B-3-p8"></a><a id="eq-B-5"></a><a id="eq-B-6"></a>

$$
\begin{align}
&\Psi_R \colon \left\{ \begin{aligned}
\!\left\lgroup\mathbb{N}_{\mathsf{C}}, \mathbb{N}, \mathbb{P}, \mathbb{B}_{}, \left[\!\left[\left[\!\left[\mathbb{J}\right]\!\right]_{}\right]\!\right]_{}, \mathbb{N}\right\rgroup\! &\to \!\left\lgroup\mathbb{B}_{} \cup \mathbb{E}, \left[\!\left[\mathbb{J}\right]\!\right]_{}, \mathbb{N}_G\right\rgroup\! \\
\left(c, i, p, \mathbf{r}, \overline{\mathbf{i}}, \varsigma\right) &\mapsto \begin{cases}
\left(\texttt{BAD}, \left[\right], 0\right) &\text{if } w_{s} \not\in \mathcal{K}\left(\delta\right) \vee \Lambda(\delta\left[w_{s}\right], (p_{\mathbf{c}})_{t}, w_{c}) = \emptyset \\
\left(\texttt{BIG}, \left[\right], 0\right) &\text{otherwise if } \left\vert\Lambda(\delta\left[w_{s}\right], (p_{\mathbf{c}})_{t}, w_{c})\right\vert > \mathsf{W}_C \\
&\text{otherwise}: \\
&\quad\text{let } \mathbf{a} = \mathcal{E}_{}\left(c, i, w_{s}, \left\updownarrow w_{\mathbf{y}}\right.\!, \mathcal{H}\left(p\right)\right)\;,\ \mathcal{E}_{}\left(\left\updownarrow\mathbf{z}\right.\!, \mathfrak{j}\right) = \Lambda(\delta\left[w_{s}\right], (p_{\mathbf{c}})_{t}, w_{c})\\
&\quad \text{and } \left(u, \mathbf{o}, \left(\mathbf{m}, \mathbf{e}\right)\right) = \Psi_M(\mathfrak{j}, 0, w_{g}, \mathbf{a}, F, \left(\emptyset, \left[\right]\right))\ \colon\\
\left(\mathbf{o}, \left[\right], u\right) &\quad\text{if } \mathbf{o} \in \left\{\, \infty, \unicode{x21AF} \,\right\}  \\
\left(\mathbf{o}, \mathbf{e}, u\right) &\quad\text{otherwise} \\
\text{where } w = p_{\mathbf{w}}\left[i\right]
\end{cases} \\
\end{aligned} \right. \tag{B.5} \\
&F \in \Omega\left\langle\!\left\lgroup\left\langle\!\left\vert \mathbb{N}\to\mathbb{I}\right\vert\!\right\rangle, \left[\!\left[\mathbb{J}\right]\!\right]_{}\right\rgroup\!\right\rangle \colon
(n, \varrho, \varphi, \mu, \left(\mathbf{m}, \mathbf{e}\right)) \mapsto \begin{cases}
\Omega_G(\varrho, \varphi, \mu, \left(\mathbf{m}, \mathbf{e}\right)) &\text{if } n = \mathtt{gas} \\
\Omega_{\unicode{x264A}}(\varrho, \varphi, \mu, \mathfrak{j}) &\text{if } n = \mathtt{grow\_heap} \\
\Omega_Y(\varrho, \varphi, \mu, p, \mathbb{H}_{0}, \mathbf{r}, i, \overline{\mathbf{i}}, \overline{\mathbf{x}}, \emptyset, \left(\mathbf{m}, \mathbf{e}\right)) &\text{if } n = \mathtt{fetch}\\
\Omega_H(\varrho, \varphi, \mu, w_{s}, \delta, (p_{\mathbf{c}})_{t}) &\text{if } n = \mathtt{historical\_lookup}\\
\Omega_E(\varrho, \varphi, \mu, \mathbf{e}, \varsigma) &\text{if } n = \mathtt{export}\\
\Omega_M(\varrho, \varphi, \mu, \mathbf{m}) &\text{if } n = \mathtt{machine}\\
\Omega_P(\varrho, \varphi, \mu, \mathbf{m}) &\text{if } n = \mathtt{peek}\\
\Omega_O(\varrho, \varphi, \mu, \mathbf{m}) &\text{if } n = \mathtt{poke}\\
\Omega_Z(\varrho, \varphi, \mu, \mathbf{m}) &\text{if } n = \mathtt{pages}\\
\Omega_K(\varrho, \varphi, \mu, \mathbf{m}) &\text{if } n = \mathtt{invoke}\\
\Omega_X(\varrho, \varphi, \mu, \mathbf{m}) &\text{if } n = \mathtt{expunge}\\
\left(\infty, \varrho', \varphi', \mu\right) &\text{otherwise if } \varrho' < 0\\
\left(\blacktriangleright, \varrho', \varphi', \mu\right) &\text{otherwise}\\
\text{where } \varphi' = \varphi \text{ except } \varphi'_7 = \mathtt{WHAT} \\
\text{and } \varrho' = \varrho - \mathsf{M}_{\emptyset} \\
\text{and } \overline{\mathbf{x}} = \left[
\left[
\mathbf{x}
\;\middle\vert\;
\left(\mathcal{H}\left(\mathbf{x}\right), \left\vert\mathbf{x}\right\vert\right) \mathrel{\unicode{x2B40}} \mathbf{w}_{\mathbf{x}}
\right]
\;\middle\vert\;
\mathbf{w} \mathrel{\unicode{x2B40}} p_{\mathbf{w}}
\right]
\end{cases} \tag{B.6}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-N" class="gk-wrap">[$\mathbb{N}$](../symbols.md#naturals)</span> | N | the whole numbers: 0, 1, 2 and up; a subscript is a bound, ℕ₈ is 0 to 7 |
| <span id="gk-sequence">[$\left[\!\left[x\right]\!\right]$](../symbols.md#sequence)</span> | a sequence of | ⟦T⟧ is an array of T; a subscript is its length, :n at most n, n: at least n |
| <span id="gk-segment" class="gk-wrap">$\mathbb{J}$</span> | J | the set of segments: blobs of exactly W_G = 4,104 bytes, the unit of import and export |
| <span id="gk-overline">$\overline{x}$</span> | bar | over a letter: one entry for each work-item of the package, ī is every item's imported segments |
| <span id="gk-segoff" class="gk-wrap">$\varsigma$</span> | final sigma | how many segments the package's earlier work-items export: the index this item's first export gets |
| <span id="gk-sq">[$\left[x\right]$](../symbols.md#sequence)</span> | the sequence | a sequence written out item by item; [ ] is the empty one |
| <span id="gk-wi-serviceindex">$s$</span> | s | the service the item is for |
| <span id="gk-keys">$\mathcal{K}\left(x\right)$</span> | K of | a dictionary's keys |
| <span id="gk-accounts" class="gk-wrap">$\delta$</span> | delta | the service accounts: every service's code hash, balance, storage and preimages |
| <span id="gk-vee">$\vee$</span> | or | at least one side is true |
| <span id="gk-histlookup" class="gk-wrap">$\Lambda$</span> | lambda (capital) | the historical lookup: the preimage with hash h if the account had it at slot t, else ∅ |
| <span id="gk-wp-context" class="gk-wrap">$\mathbf{c}$</span> | c | the package's refinement context |
| <span id="gk-wc-lookupanchortime">$t$</span> | t | the lookup anchor's timeslot: at most L = 14,400 slots old |
| <span id="gk-wi-codehash">$c$</span> | c | the code hash the item expects its service to have |
| <span id="gk-Cmaxservicecodesize" class="gk-wrap">$\mathsf{W}_C$</span> | W sub C | the largest a service's code may be: 4,000,000 bytes |
| <span id="gk-var">[$\left\updownarrow x\right.\!$](../symbols.md#length-prefix)</span> | with its length | ↕x: x with its length in front, as a compact natural |
| <span id="gk-wi-payload" class="gk-wrap">$\mathbf{y}$</span> | y | the item's payload: the input its refine reads |
| <span id="gk-blake">$\mathcal{H}\left(x\right)$</span> | H of | the Blake2b hash of what's in the brackets: 32 bytes |
| <span id="gk-jam-blob" class="gk-wrap">$\mathfrak{j}$</span> | j (gothic) | a standard program: four sizes, the read-only and read-write data, then the PVM blob |
| <span id="gk-wi-refgaslimit">$g$</span> | g | the gas refine may use on this item |
| <span id="gk-set">$\left\{\,x\,\right\}$</span> | the set of | a set: values with no order and no repeats |
| <span id="gk-panic">$\unicode{x21AF}$</span> | panic | ↯: the program trapped |
| <span id="gk-wp-workitems" class="gk-wrap">$\mathbf{w}$</span> | w | the package's work-items: 1 to 16 |
| <span id="gk-dictionary">$\left\langle\!\left\vert x\to y\right\vert\!\right\rangle$</span> | a dictionary from K to V | a map: keys of type K, each with one value of type V |
| <span id="gk-zerohash" class="gk-wrap">$\mathbb{H}_{0}$</span> | H zero | 32 zero bytes: a placeholder where a hash isn't known yet |
| <span id="gk-build">$\left\{ x \;\middle\vert\; y \right\}$</span> | for each, such that | built by a rule: the left-hand value, for every case the right-hand side allows (a set, or a sequence in order) |
| <span id="gk-orderedin">$\mathrel{\unicode{x2B40}}$</span> | in order, from | each item of the sequence, in its order |
| <span id="gk-wi-extrinsics" class="gk-wrap">$\mathbf{x}$</span> | x | the item's extrinsics: each a blob's hash and length |

</details>

:::

**Read it aloud.** "Psi R takes a core index, a number, a work-package, bytes, a sequence
of sequences of segments, and a number, and gives bytes or an error, a sequence of
segments, and gas. For c, i, p, r, i bar and final sigma: BAD, no exports and 0, if w's
service isn't among the accounts, or the historical lookup of w's code hash in that
service at the lookup anchor's slot finds nothing; otherwise BIG, no exports and 0, if
what it finds is longer than W sub C; otherwise, let a be the encoding of c, i, w's
service, w's payload with its length, and the hash of p, and let the found code's
metadata and the code gothic j be what the lookup gives; and let u, o and the pair m and
e be what Psi M gives, running gothic j from instruction 0 with w's gas limit, argument a,
host F and an empty pair: then o, no exports and u if o is out of gas or a panic; else o,
e and u. Here w is p's work-item i." Then F: "if n is gas, omega G; grow_heap, omega
Gemini; fetch, omega Y with the package, the zero hash, the trace, i, the imports and the
extrinsics; historical_lookup, omega H; export, omega E; and machine, peek, poke, pages,
invoke and expunge, each with m; any other, WHAT for M sub nothing. Here x bar is, for
each work-item, the blob of each of its extrinsics, in order."

**In plain words.** One guarantor, refining work-item i of package p on core c:

1. **Find the service's code**, as it was at the package's lookup anchor (Λ, the
   historical lookup of [lesson 14.1](../14-services/01-providing-preimages.md)). No
   service or no code: BAD. Code over W_C = 4,000,000 bytes: BIG.
2. **Run it from instruction 0** (accumulate starts at 5), with the item's own gas limit
   w_g, and the argument 𝐚: the core, the item's index, the service, the payload with its
   length in front, and the package's hash.
3. **Keep the output, and the exports only on success.** A panic or running out of gas
   gives the error and no exports; anything else, the output and the segments it exported.
4. **(B.6), its host.** Refine's F answers 11 calls: the 3 everyone gets, plus
   `historical_lookup`, `export` and six for inner machines. Its `fetch` can hand out the
   whole package, the authorizer's trace 𝐫, the imports ī and the extrinsics x̄. Entropy,
   item 1, is 32 zero bytes here: refine must give the same answer on every guarantor and
   every auditor, whenever it runs, so there's no fresh randomness to give it.

The context (𝐦, 𝐞) is the inner machines and the exported segments, both empty at the
start. ς, the offset, is how many segments the package's earlier items export, so this
item's first export gets the right index.

**On a real value.** The same `process_one_immediate_report-1` report: work-item 0 of
package `2a762f98…`, on core 1, for service 1729. The service's code is the 19,049-byte
blob your client runs in this part, `fd3f1355…`. The vector records what refine produced,
not a run you can repeat:

```text
c, i, w_s       1, 0, 1729
𝐚               01 00 86 c1 ‖ payload ‖ 2a76…    1 and 0 in a byte each, 1729 in two,
                                                 the payload with its length, H(p)
code size       19,049 ≤ 4,000,000               not BIG
o               ef d3 6b 4c e7 a6 97 29 …        16 bytes: the digest's `result`, ok
```

The payload itself isn't in the vector, only its hash, so 𝐚 can't be written out whole.

**In your client.** Not built. What refine returns becomes a work-digest's result
([lesson 3.2](../03-work-and-reports/02-work-digests.md)), and from there an operand that
`fetch` hands accumulation ([16.7](./07-a-services-inputs.md)).

## (B.7) and (B.8): what an accumulation carries

::: gray-paper-eq B.7

<a id="ex-B-7"></a>The Gray Paper's (B.7), (B.8), [in its place in the paper's words](./06-checkpoints.md#eq-B-7):

$$
\begin{align}
\mathbb{L} &\equiv \!\left\lgroup
s\in \mathbb{N}_S,
\mathbf{e}\in \mathbb{S},
i\in \mathbb{N}_S,
\mathbf{t}\in \left[\!\left[\mathbb{X}\right]\!\right]_{},
y\in \mathbb{H}_{}\boldsymbol{?},
\mathbf{p}\in \left\{\mkern-5mu\left[\,\!\left\lgroup\mathbb{N}_S, \mathbb{B}_{}\right\rgroup\!\,\right]\mkern-5mu\right\}
\right\rgroup\! \tag{B.7} \\
\forall \mathbf{x} \in \mathbb{L} :
\mathbf{x}_{\mathbf{s}} &\equiv (\mathbf{x}_{\mathbf{e}})_{\mathbf{d}}\left[\mathbf{x}_{s}\right] \tag{B.8}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-implications" class="gk-wrap">$\mathbb{L}$</span> | L | an accumulation's context: the service running, the state it sees, the next free service id, its transfers, its yield and its provisions |
| <span id="gk-serviceid" class="gk-wrap">$\mathbb{N}_S$</span> | N sub S | a service id: a whole number below 2³², 4 bytes |
| <span id="gk-im-state" class="gk-wrap">$\mathbf{e}$</span> | e | the state the service sees and changes: the accounts, the staging keys, the authorizer queues and the privileges |
| <span id="gk-partialstate" class="gk-wrap">$\mathbb{S}$</span> | S | a partial state: the parts of the state accumulation may change: accounts, next validators, authorizer queues and the privileges |
| <span id="gk-im-xfers" class="gk-wrap">$\mathbf{t}$</span> | t | the transfers the service has made so far, delivered when it is done |
| <span id="gk-defxfers">$\left[\!\left[\mathbb{X}\right]\!\right]$</span> | a sequence of transfers | a list of deferred transfers, in order |
| <span id="gk-im-yield">$y$</span> | y | the hash the service yields, if any: its answer for the outside world |
| <span id="gk-optional">$x\boldsymbol{?}$</span> | or nothing | a value of this type, or ∅ (null) |
| <span id="gk-hash">$\mathbb{H}$</span> | H | a 32-byte value, usually a hash |
| <span id="gk-protoset">$\left\{\mkern-5mu\left[\,x\,\right]\mkern-5mu\right\}$</span> | the set of | a set written in order: no repeats, kept sorted |
| <span id="gk-forall">$\forall$</span> | for all | for every value: ∀c ∈ ℕ_C means for each core c |
| <span id="gk-im-self" class="gk-wrap">$\mathbf{s}$</span> | s | the account of the service accumulating, as this context holds it |
| <span id="gk-ps-accounts" class="gk-wrap">$\mathbf{d}$</span> | d | a partial state's service accounts, by service id |

</details>

:::

**Read it aloud.** "L is defined as a tuple of: s, a service id; e, a partial state; i, a
service id; t, a sequence of deferred transfers; y, a hash or nothing; and p, a set of
pairs of a service id and bytes. For every x in L, x sub bold s is defined as x's state's
accounts at x's s."

**In plain words.** 𝕃 is the bundle of everything an accumulation can change, the
context, and Ψ_A keeps two of them, 𝐱 and 𝐲 ([16.6](./06-checkpoints.md)):

| Field | What it is | Built in |
| --- | --- | --- |
| s | the service accumulating | [16.4](./04-info.md) |
| 𝐞 | the state it can touch: accounts, staging keys, authorizer queues, privileges | [16.4](./04-info.md), [17.5](../17-accumulation/05-privileges.md) |
| i | the id the next service it creates gets | [17.8](../17-accumulation/08-creating-a-service.md) |
| 𝐭 | the transfers it has sent | [17.3](../17-accumulation/03-sending-a-transfer.md) |
| y | the hash it yields, if any | [17.11](../17-accumulation/11-what-a-service-yields.md) |
| 𝐩 | the preimages it provides | [17.12](../17-accumulation/12-providing-a-preimage.md) |

(B.8) is a shorthand: 𝐱_𝐬 is the service's own account, looked up in the context's state.

**On a real value.** Service 1729's context as its run in `always_accumulate-1` starts
(slot 43), both 𝐱 and 𝐲:

```text
s       1729
𝐞       the vector's state: account 1729, with a balance of 119,250, and the privileges
i       2,454,305,367          worked out in (B.10) below
𝐭       []                     no transfers yet
y       ∅                      nothing yielded
𝐩       {}                     nothing provided
𝐱_𝐬     account 1729: code fd3f1355…, 2 items in 19,130 bytes
```

**In your client.** The `Accumulation` type in `src/host.ts`
([16.6](./06-checkpoints.md#the-code)): its `accounts` are 𝐱's, its `checkpoint` 𝐲's.
[Part 17](../17-accumulation/index.md) adds the rest of the fields, each where its host call needs it.

## (B.9) to (B.13): Ψ_A, one service's accumulation

::: gray-paper-eq B.9

<a id="ex-B-9"></a>The Gray Paper's (B.9), (B.10), (B.11), (B.12), (B.13), [in its place in the paper's words](./06-checkpoints.md#eq-B-9):

$$
\begin{align}
\Psi_A& \colon\left\{ \begin{aligned}
\!\left\lgroup
\mathbb{S}, \mathbb{N}_T, \mathbb{N}_S, \mathbb{N}_G, \left[\!\left[\mathbb{U} \cup \mathbb{X}\right]\!\right]_{}
\right\rgroup\!
&\to \mathbb{O}
\\
\left(\mathbf{e}, t, s, g, \mathbf{i}\right) &\mapsto \begin{cases}
\left(
\mathbf{e}\mathrel{\unicode{x2AF6}}\mathbf{s},
\mathbf{t}\mathrel{\unicode{x2AF6}}\left[\right],
y\mathrel{\unicode{x2AF6}}\emptyset,
u\mathrel{\unicode{x2AF6}}0,
\mathbf{p}\mathrel{\unicode{x2AF6}}\left[\right]
\right)
&\text{if } \mathfrak{j} = \emptyset \vee \left\vert\mathfrak{j}\right\vert > \mathsf{W}_C \\
C(\Psi_M(\mathfrak{j}, 5, g, \mathcal{E}_{}\left(t, s, \left\vert\mathbf{i}\right\vert\right), F, I(\mathbf{s}, s)^2))
&\text{otherwise} \\
\begin{aligned}
&\quad \text{where } \mathfrak{j} = \mathbf{e}_{\mathbf{d}}\left[s\right]_{\mathbf{c}}\\
&\quad \text{and } \mathbf{s} = \mathbf{e} \text{ except } \mathbf{s}_{\mathbf{d}}\left[s\right]_{b} = \mathbf{e}_{\mathbf{d}}\left[s\right]_{b} + \sum_{r \in \mathbf{x}}r_{a}\\
&\quad \text{and } \mathbf{x} = \left[i \;\middle\vert\;
i \mathrel{\unicode{x2B40}} \mathbf{i} ,
i \in \mathbb{X}
\right]
\end{aligned}\\
\end{cases} \\
\end{aligned} \right. \tag{B.9} \\
I&\colon\left\{ \begin{aligned}
\!\left\lgroup\mathbb{S}, \mathbb{N}_S\right\rgroup\! &\to \mathbb{L}\\
\left(\mathbf{e}, s\right) &\mapsto \left(
s,
\mathbf{e},
i,
\mathbf{t}\mathrel{\unicode{x2AF6}}\left[\right],
y\mathrel{\unicode{x2AF6}}\emptyset,
\mathbf{p}\mathrel{\unicode{x2AF6}}\left[\right]
\right)\\
&\qquad \text{where } i = \text{check}((\mathcal{E}^{-1}_{4}\left(\mathcal{H}\left(\mathcal{E}_{}\left(s, \eta_0', \mathbf{H}_{T}\right)\right)\right) \bmod (2^{32}-\mathsf{S}-2^8)) + \mathsf{S}) \\
\end{aligned} \right. \tag{B.10} \\
F \in \Omega\left\langle\!\left\lgroup\mathbb{L}, \mathbb{L}\right\rgroup\!\right\rangle &\colon \left(n, \varrho, \varphi, \mu, \left(\mathbf{x}, \mathbf{y}\right)\right) \mapsto \begin{cases}
\Omega_G(\varrho, \varphi, \mu, \left(\mathbf{x}, \mathbf{y}\right)) &\text{if } n = \mathtt{gas} \\
\Omega_{\unicode{x264A}}(\varrho, \varphi, \mu, \mathfrak{j}) &\text{if } n = \mathtt{grow\_heap} \\
\Omega_Y(\varrho, \varphi, \mu, \emptyset, \eta_0', \emptyset, \emptyset, \emptyset, \emptyset, \mathbf{i}, \left(\mathbf{x}, \mathbf{y}\right)) &\text{if } n = \mathtt{fetch}\\
G(\Omega_R(\varrho, \varphi, \mu, \mathbf{x}_{\mathbf{s}}, \mathbf{x}_{s}, (\mathbf{x}_{\mathbf{e}})_{\mathbf{d}}), \left(\mathbf{x}, \mathbf{y}\right)) &\text{if } n = \mathtt{read} \\
G(\Omega_W(\varrho, \varphi, \mu, \mathbf{x}_{\mathbf{s}}, \mathbf{x}_{s}), \left(\mathbf{x}, \mathbf{y}\right)) &\text{if } n = \mathtt{write} \\
G(\Omega_L(\varrho, \varphi, \mu, \mathbf{x}_{\mathbf{s}}, \mathbf{x}_{s}, (\mathbf{x}_{\mathbf{e}})_{\mathbf{d}}), \left(\mathbf{x}, \mathbf{y}\right)) &\text{if } n = \mathtt{lookup} \\
G(\Omega_I(\varrho, \varphi, \mu, \mathbf{x}_{s}, (\mathbf{x}_{\mathbf{e}})_{\mathbf{d}}), \left(\mathbf{x}, \mathbf{y}\right)) &\text{if } n = \mathtt{info} \\
\Omega_B(\varrho, \varphi, \mu, \left(\mathbf{x}, \mathbf{y}\right)) &\text{if } n = \mathtt{bless}\\
\Omega_A(\varrho, \varphi, \mu, \left(\mathbf{x}, \mathbf{y}\right)) &\text{if } n = \mathtt{assign}\\
\Omega_D(\varrho, \varphi, \mu, \left(\mathbf{x}, \mathbf{y}\right)) &\text{if } n = \mathtt{designate}\\
\Omega_C(\varrho, \varphi, \mu, \left(\mathbf{x}, \mathbf{y}\right)) &\text{if } n = \mathtt{checkpoint} \\
\Omega_N(\varrho, \varphi, \mu, \left(\mathbf{x}, \mathbf{y}\right), \mathbf{H}_{T}) &\text{if } n = \mathtt{new} \\
\Omega_U(\varrho, \varphi, \mu, \left(\mathbf{x}, \mathbf{y}\right)) &\text{if } n = \mathtt{upgrade} \\
\Omega_T(\varrho, \varphi, \mu, \left(\mathbf{x}, \mathbf{y}\right)) &\text{if } n = \mathtt{transfer} \\
\Omega_J(\varrho, \varphi, \mu, \left(\mathbf{x}, \mathbf{y}\right), \mathbf{H}_{T}) &\text{if } n = \mathtt{eject} \\
\Omega_Q(\varrho, \varphi, \mu, \left(\mathbf{x}, \mathbf{y}\right)) &\text{if } n = \mathtt{query} \\
\Omega_S(\varrho, \varphi, \mu, \left(\mathbf{x}, \mathbf{y}\right), \mathbf{H}_{T}) &\text{if } n = \mathtt{solicit} \\
\Omega_F(\varrho, \varphi, \mu, \left(\mathbf{x}, \mathbf{y}\right), \mathbf{H}_{T}) &\text{if } n = \mathtt{forget} \\
\Omega_{\unicode{x2649}}(\varrho, \varphi, \mu, \left(\mathbf{x}, \mathbf{y}\right)) &\text{if } n = \mathtt{yield} \\
\Omega_{\unicode{x2648}}(\varrho, \varphi, \mu, \left(\mathbf{x}, \mathbf{y}\right)) &\text{if } n = \mathtt{provide} \\
\left(\infty, \varrho', \varphi', \mu, \left(\mathbf{x}, \mathbf{y}\right)\right) &\text{otherwise if } \varrho' < 0\\
\left(\blacktriangleright, \varrho', \varphi', \mu, \left(\mathbf{x}, \mathbf{y}\right)\right) &\text{otherwise}\\
\text{where } \varphi' = \varphi \text{ except } \varphi'_7 = \mathtt{WHAT} \\
\text{and } \varrho' = \varrho - \mathsf{M}_{\emptyset}
\end{cases} \tag{B.11} \\
G&\colon\left\{ \begin{aligned}
\!\left\lgroup\!\left\lgroup\left\{\,\blacktriangleright, \blacksquare, \unicode{x21AF}, \infty\,\right\}, \mathbb{N}_G, \left[\!\left[\mathbb{N}_R\right]\!\right]_{13}, \mathbb{M}, \mathbb{A}\right\rgroup\!, \!\left\lgroup\mathbb{L}, \mathbb{L}\right\rgroup\!\right\rgroup\! &\to \!\left\lgroup\left\{\,\blacktriangleright, \blacksquare, \unicode{x21AF}, \infty\,\right\}, \mathbb{N}_G, \left[\!\left[\mathbb{N}_R\right]\!\right]_{13}, \mathbb{M}, \!\left\lgroup\mathbb{L}, \mathbb{L}\right\rgroup\!\right\rgroup\! \\
\left(\left(\varepsilon, \varrho, \varphi, \mu, \mathbf{s}\right), \left(\mathbf{x}, \mathbf{y}\right)\right) &\mapsto \left(\varepsilon, \varrho, \varphi, \mu, \left(\mathbf{x}^*, \mathbf{y}\right)\right) \\
&\qquad  \text{where } \mathbf{x}^* = \mathbf{x} \text{ except } \mathbf{x}^*_{\mathbf{s}} = \mathbf{s}
\end{aligned} \right. \tag{B.12} \\
C&\colon\left\{ \begin{aligned}
\!\left\lgroup\mathbb{N}_G, \mathbb{B}_{} \cup \left\{\,\infty, \unicode{x21AF}\,\right\}, \!\left\lgroup\mathbb{L}, \mathbb{L}\right\rgroup\!\right\rgroup\! &\to \mathbb{O} \\
\left(u, \mathbf{o}, \left(\mathbf{x}, \mathbf{y}\right)\right) &\mapsto \begin{cases}
\left(
\mathbf{e}\mathrel{\unicode{x2AF6}}\mathbf{y}_{\mathbf{e}},
\mathbf{t}\mathrel{\unicode{x2AF6}}\mathbf{y}_{\mathbf{t}},
y\mathrel{\unicode{x2AF6}}\mathbf{y}_{y},
u,
\mathbf{p}\mathrel{\unicode{x2AF6}}\mathbf{y}_{\mathbf{p}}
\right) & \text{if } \mathbf{o} \in \left\{\,\infty, \unicode{x21AF}\,\right\} \\
\left(
\mathbf{e}\mathrel{\unicode{x2AF6}}\mathbf{x}_{\mathbf{e}},
\mathbf{t}\mathrel{\unicode{x2AF6}}\mathbf{x}_{\mathbf{t}},
y\mathrel{\unicode{x2AF6}}\mathbf{o},
u,
\mathbf{p}\mathrel{\unicode{x2AF6}}\left(\mathbf{x}, \mathbf{y}\right)_{\mathbf{p}}
\right) & \text{otherwise if } \mathbf{o} \in \mathbb{H}_{} \\
\left(
\mathbf{e}\mathrel{\unicode{x2AF6}}\mathbf{x}_{\mathbf{e}},
\mathbf{t}\mathrel{\unicode{x2AF6}}\mathbf{x}_{\mathbf{t}},
y\mathrel{\unicode{x2AF6}}\mathbf{x}_{y},
u,
\mathbf{p}\mathrel{\unicode{x2AF6}}\mathbf{x}_{\mathbf{p}}
\right) & \text{otherwise} \\
\end{cases}
\end{aligned} \right. \tag{B.13}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-timeslot" class="gk-wrap">$\mathbb{N}_T$</span> | N sub T | a timeslot: a u32 counting 6-second slots |
| <span id="gk-operandtuple" class="gk-wrap">$\mathbb{U}$</span> | U | an operand: what accumulate is told about one work-digest: package hash, exports root, authorizer, payload hash, gas, trace and result |
| <span id="gk-defxfer" class="gk-wrap">$\mathbb{X}$</span> | X | a deferred transfer: (source, destination, amount, memo, gas), the money moved now, the receiver run in the next round |
| <span id="gk-acconeout" class="gk-wrap">$\mathbb{O}$</span> | O | what one run gives back: its state 𝐞, transfers 𝐭, yield y, gas used u and provisions 𝐩 |
| <span id="gk-is">$x\mathrel{\unicode{x2AF6}} y$</span> | is a | names a field and gives its type, in a tuple |
| <span id="gk-ao-gasused">$u$</span> | u | the gas a run used |
| <span id="gk-sa-balance">$b$</span> | b | an account's balance, in tokens: a u64 |
| <span id="gk-sum">$\sum$</span> | the sum of | add up what follows, once for each value the subscript ranges over |
| <span id="gk-dx-amount">$a$</span> | a | how much balance the transfer moves |
| <span id="gk-decode">[$\mathcal{E}^{-1}\left(x\right)$](../symbols.md#decode)</span> | E inverse of | decoding: bytes back into the value they encode |
| <span id="gk-entropyaccumulator" class="gk-wrap">$\eta_0$</span> | eta zero | the entropy accumulator: 32 bytes that every block's VRF output is hashed into |
| <span id="gk-H" class="gk-wrap">$\mathbf{H}$</span> | H | this block's header; 𝐇_T is its timeslot, 𝐇_P its parent's hash |
| <span id="gk--timeslot">$T$</span> | T | a header's timeslot: 𝐇_T is the slot this block was made for |
| <span id="gk-bmod">[$\bmod$](../symbols.md#mod)</span> | mod | the remainder after dividing: 14 mod 4 is 2 |
| <span id="gk-Cminpublicindex" class="gk-wrap">$\mathsf{S}$</span> | S | the lowest id an ordinary new service can get: 2¹⁶ = 65,536; the ids below it only the registrar hands out |
| <span id="gk-implicationspair">$\!\left\lgroup\mathbb{L}, \mathbb{L}\right\rgroup\!$</span> | a pair of contexts | two accumulation contexts side by side: the regular one and the exceptional one |
| <span id="gk-imXY">$\left(\mathbf{x}, \mathbf{y}\right)$</span> | x and y | the pair of contexts every accumulate host call gets: x as the service changes it, y as at its last checkpoint |
| <span id="gk-Taurus">$\unicode{x2649}$</span> | Taurus | the sign that names yield: Ω_♉ records the hash a service yields |
| <span id="gk-Aries">$\unicode{x2648}$</span> | Aries | the sign that names provide: Ω_♈ hands a preimage to a service that asked for it |
| <span id="gk-halt" class="gk-wrap">$\blacksquare$</span> | halt | ∎: the program finished normally |
| <span id="gk-regs">$\left[\!\left[\mathbb{N}_R\right]\!\right]_{13}$</span> | thirteen registers | a sequence of 13 register values, each a u64 |
| <span id="gk-serviceaccount" class="gk-wrap">$\mathbb{A}$</span> | A | a service account: three dictionaries (storage, preimages, requests) and eight plain fields |
| <span id="gk-execst" class="gk-wrap">$\varepsilon$</span> | epsilon | how the machine goes on after a host call: carry on (▸), halt, panic or out of gas |

</details>

:::

**Read it aloud.** (B.9): "Psi A takes a partial state, a timeslot, a service id, a gas
limit, and a sequence of operands or transfers, and gives an accumulation output. For e,
t, s, g and i: the state bold s, no transfers, no yield, 0 gas used and no provisions, if the
code gothic j is nothing or longer than W sub C; otherwise C of Psi M, run on gothic j
from instruction 5 with g gas, the argument the encoding of t, s and the length of i, the
host F and the context I of bold s and s, twice; where gothic j is s's code in e's accounts,
bold s is e with s's balance raised by the amount of every transfer in x, and x is the
inputs that are transfers." (B.10): "I takes a partial state and a service id to a
context: s, e, i, no transfers, no yield, no provisions, where i is check of: the first 4
bytes of the hash of the encoding of s, eta prime 0 and the header's timeslot, as a
number, mod 2 to the 32 minus S minus 2 to the 8, plus S." (B.11): "F, a host over a pair
of contexts: for each of the 20 calls, its omega; read, write, lookup and info through G;
any other, WHAT for M sub nothing." (B.12): "G takes a host call's result with an account
s, and the pair, and puts s back into x as x's own account." (B.13): "C takes the gas
used, the output and the pair: y's state, transfers, yield and provisions if the output
is out of gas or a panic; otherwise x's, with the output as the yield, if it is a hash;
otherwise x's as they are."

**In plain words.** The whole of one service's accumulation, in five parts:

1. **(B.9), money first.** Transfers to this service add to its balance before anything
   runs, so 𝐬 is the state with that money in. Even if the service has no code (or code
   over W_C = 4,000,000 bytes), the money still arrives, and nothing else happens: 0 gas
   used.
2. **(B.9), then run it.** Lay out the service's code, start at instruction 5,
   accumulate's way in, with g gas and the argument E(t, s, |𝐢|): the slot, the service's
   id, and how many inputs it has. Everything else it asks for with `fetch`.
3. **(B.10), two copies of a fresh context.** I starts the context: this service, the
   state, nothing sent, yielded or provided yet, and the first id a service created now
   would get. The superscript 2 makes it a pair, (𝐱, 𝐲), identical at the start.
4. **(B.11) and (B.12), the host.** F says which Ω answers each call. Four of them
   (`read`, `write`, `lookup`, `info`) are general functions that work on one account,
   so G puts the account they return back into 𝐱. The others take the whole pair.
   Anything else: WHAT, for 1,000.
5. **(B.13), keep one copy.** C looks at how the machine stopped. A panic or out of gas
   keeps 𝐲, the last checkpoint. A halt keeps 𝐱, and if the program's output is exactly a
   32-byte hash, that becomes its yield. (In that middle case the paper writes the
   provisions as (𝐱, 𝐲)_𝐩; your client reads it as 𝐱's, as the case under it says.)

The new id in (B.10) comes from a hash of the service's id, the fresh entropy η′₀ and the
slot, so nobody can know it before the block: B.4's last paragraphs, quoted in
[16.6](./06-checkpoints.md), say why. The paper's text there calls that field a; in the
formula it is i.

**On a real value.** Service 1729 in `always_accumulate-1`, run by your client in
[16.6](./06-checkpoints.md):

```text
t, s, |𝐢|         43, 1729, 0
transfers in 𝐢    none, so 𝐬 = 𝐞            nothing to add to the balance
𝔧                 19,049 bytes ≤ 4,000,000   code found, not too big
argument          2b 86 c1 00                43 in one byte, 1729 in two, 0 in one
start             instruction 5, 100,000 gas
I's i             hash of 86 c1 ‖ ae85d663… ‖ 2b = 57ba4892…
                  first 4 bytes, low first: 0x9248ba57 = 2,454,239,831
                  mod 4,294,901,504 = 2,454,239,831, + 65,536 = 2,454,305,367
the run           7 host calls (fetch, grow_heap, …), then ∎ halt
C                 a halt, no 32-byte output: keep 𝐱, yield nothing
u                 16,417                     the vector's accumulate_gas_used
```

The vector's `output` is 32 zero bytes: the root of every yield, and with none, zeros.

**In your client.** `accumulate` in `src/host.ts`, [16.6](./06-checkpoints.md#the-code):
`standardProgram` and `pc = 5` are (B.9)'s run, `accumulateHost` is F, and `collapse`
is C. [Part 17](../17-accumulation/index.md) grows it: transfers in [17.4](../17-accumulation/04-rounds.md), the new id's
`newIds` in [17.8](../17-accumulation/08-creating-a-service.md), the yield in
[17.11](../17-accumulation/11-what-a-service-yields.md).

## (B.14): the next id nobody has

::: gray-paper-eq B.14

<a id="ex-B-14"></a>The Gray Paper's (B.14), [in its place in the paper's words](./06-checkpoints.md#eq-B-14):

$$
\begin{equation}
\text{check}(i \in \mathbb{N}_S) \equiv \begin{cases}
i &\text{if } i \not\in \mathcal{K}\left(\mathbf{e}_{\mathbf{d}}\right) \\
\text{check}((i - \mathsf{S} + 1) \bmod (2^{32}-2^8-\mathsf{S}) + \mathsf{S})&\text{otherwise}
\end{cases} \tag{B.14}
\end{equation}
$$

:::

**Read it aloud.** "Check of i, a service id, is defined as: i, if i isn't among the
accounts' keys; otherwise check of: i minus S plus 1, mod 2 to the 32 minus 2 to the 8
minus S, plus S."

**In plain words.** If id i is free, it's the answer. If not, try the next one up, and
keep going. The mod and the S make "the next one up" wrap round inside the public range:
from S = 65,536 to 2^32 − 257, so the top 256 ids are never handed out and the ids below
S are left for the registrar to choose ([17.8](../17-accumulation/08-creating-a-service.md)).
B.4's last paragraph adds: if two services still end up with one id in the same block,
the block is invalid.

**On a real value.** Service 1729's first new id, from (B.10) above, and a made-up case
where it was taken:

```text
check(2,454,305,367)      no account has it               → 2,454,305,367
if it were taken:         (2,454,305,367 − 65,536 + 1) mod 4,294,901,504 + 65,536
                          = 2,454,305,368                  and check that one
```

**In your client.** `check` and `newIds` in `src/host.ts`,
[17.8](../17-accumulation/08-creating-a-service.md#the-code). No official vector creates a
service at a public id, so this formula is checked by hand there, as 17.8 says.

## (B.15) and (B.16): every general host call pays first

::: gray-paper-eq B.15

<a id="ex-B-15"></a>The Gray Paper's (B.15), (B.16), [in its place in the paper's words](./01-calling-the-host.md#eq-B-15):

$$
\begin{align}
\varrho' &\equiv \varrho - g\text{ unless $\varrho'$ is explicitly defined below} \tag{B.15} \\
\left(\varepsilon', \varphi', \mu', \mathbf{s}'\right) &\equiv \begin{cases}
\left(\infty, \varphi, \mu, \mathbf{s}\right) &\text{if } \varrho < g\\
\left(\blacktriangleright, \varphi, \mu, \mathbf{s}\right) \text{ except as indicated below} &\text{otherwise}
\end{cases} \tag{B.16}
\end{align}
$$

:::

**Read it aloud.** "Rho prime is defined as rho minus g, unless rho prime is defined
explicitly below. Epsilon prime, phi prime, mu prime and s prime are defined as: out of
gas, with phi, mu and s as they were, if rho is less than g; otherwise carry on, with phi,
mu and s as they were, except as shown below."

**In plain words.** Three rules every row of B.5's table follows, so the table needn't
repeat them:

1. **Pay first.** g is the row's price. It comes off the gas before anything happens.
2. **Too poor, nothing happens.** If the gas was less than g, the machine is out of gas,
   and the registers, the memory and the account 𝐬 stay exactly as they were.
3. **Silence means unchanged.** Whatever a row doesn't mention keeps its value. Only
   `grow_heap` sets the gas itself, since its price depends on what it does.

**On a real value.** [16.1](./01-calling-the-host.md)'s tests, a program that asks `gas`
in a block costing 100:

```text
with 1,000 gas    1,000 − 100 = 900 ≥ 48     pay:  φ₇ = 900 − 48 = 852, carry on
with 147 gas      147 − 100 = 47 < 48        out of gas; φ₇ stays 0
```

**In your client.** `charge` in `src/host.ts`, [16.1](./01-calling-the-host.md#the-code):
take g, then say whether that left too little.

## (B.17): gas for a size

::: gray-paper-eq B.17

<a id="ex-B-17"></a>The Gray Paper's (B.17), [in its place in the paper's words](./02-fetch.md#eq-B-17):

$$
\begin{equation}
\mathcal{G}(L, \ell) \equiv \left\lceil\frac{L \cdot \ell}{1024}\right\rceil \tag{B.17}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-fnmemgas" class="gk-wrap">$\mathcal{G}$</span> | script G | gas for a size: 𝒢(L, ℓ) is ℓ bytes at L gas per 1,024 bytes, rounded up |
| <span id="gk-ell">$\ell$</span> | ell | a length defined nearby: in §14 the segments exported before an item; in Appendix A, the bytes after an opcode |
| <span id="gk-ceil">$\left\lceil x\right\rceil$</span> | ceiling of | rounded up to a whole number |
| <span id="gk-frac">$\frac{x}{y}$</span> | over | a fraction: the top divided by the bottom |
| <span id="gk-cdot">$\cdot$</span> | times | multiply |

</details>

:::

**Read it aloud.** "Script G of L and ell is defined as the ceiling of L times ell over
1,024."

**In plain words.** A host call that moves bytes charges for them: L gas for each 1,024
bytes, and a part of 1,024 rounded up to a whole unit of gas. ℓ is the number of bytes
the registers name, asked for or written, not the number found: asking for a lot costs a
lot, even when there is little to copy.

**On a real value.** [16.5](./05-storage.md)'s `write` of the key "last" (4 bytes) with
the value 1, 2, 3 (3 bytes):

```text
𝒢(3,358, 4)    3,358 × 4 = 13,432;  / 1,024 = 13.1…   → 14     the key
𝒢(216, 3)      216 × 3 = 648;       / 1,024 = 0.63…   → 1      the value
g              2,442 + 14 + 1 = 2,457
```

**In your client.** `memoryGas` in `src/host.ts`, [16.2](./02-fetch.md#the-code). (Its
comment calls it 𝔐; the 0.8.0 paper writes 𝒢.)

## B.5's table: the general host calls

::: gray-paper B.5 9-10

#### Appendix B.5 General Functions, continued

<a id="gp-B-5-p9"></a>

<a id="gp-B-5-p10"></a>

| **Function** <br> **Identifier** <br> **Gas usage (**$g$**)** | **Mutations** |
| --- | --- |
| $\Omega_G(\varrho, \varphi, \dots)$ <br> `gas` = 0 <br> $g = \mathsf{M}_G$ | $\begin{aligned} \varphi'_7 &\equiv \varrho' \end{aligned}$ |
| $\Omega_{\unicode{x264A}}(\varrho, \varphi, \mu, \mathfrak{j})$ <br> `grow_heap` = 1 <br> $g = \mathsf{M}_{\unicode{x264A},c} + (\varphi_7 - h) \cdot \mathsf{M}_{\unicode{x264A},p}$ | $\begin{aligned} \text{let } (\mathbf{o}, s) &\mapsto \mathfrak{j} \text{ according to eq. A.42} \\ \text{let } a &= \frac{2\mathsf{Z}_Z + Z(\left\vert\mathbf{o}\right\vert)}{\mathsf{Z}_P} \\ \text{let } b &= \frac{2^{32} - 3\mathsf{Z}_Z - \mathsf{Z}_I - P(s)}{\mathsf{Z}_P} \\ \text{let } c &= \vert \left\{\,p \in \mathbb{N}_{a \dots b} \;\middle\vert\; \mu_{\mathbf{a}}\left[p\right] = \mathrm{W}\,\right\}\vert  \\ \text{let } h &= a + c \\ \left(\varepsilon', \varrho', \varphi'_7\right) &\equiv \begin{cases} \left(\blacktriangleright, \varrho - \mathsf{M}_{\unicode{x264A},c}, h\right) &\text{if } \varphi_7 \leq h \lor \varphi_7 > b \\ \left(\infty, \varrho, h\right) &\text{otherwise if } \varrho < g \\ \left(\blacktriangleright, \varrho - g, \varphi_7\right) &\text{otherwise} \\ \end{cases}\\ (\mu'_{\mathbf{a}})_{a \dots \varphi_7'} &\equiv \left[\mathrm{W}, \dots, \mathrm{W}\right] \end{aligned}$ |
| $\Omega_Y(\varrho, \varphi, \mu, p, n, \mathbf{r}, i, \overline{\mathbf{i}}, \overline{\mathbf{x}}, \mathbf{i}, \dots)$ <br> `fetch` = 2 <br> $g = \mathsf{M}_{Y,c,c} + \mathcal{G}(\mathsf{M}_{Y,c,\ell}, z)$ | $\begin{aligned} \text{let } c &= \begin{cases} \varphi_{10} &\text{if } \varphi_{10} < 16 \\ \emptyset &\text{otherwise} \end{cases} \\ \text{let } \mathbf{v} &= \begin{cases} \mathbf{c} &\text{if } \varphi_{10} = 0 \\ \text{where } \mathbf{c} = \mathcal{E}_{}\left( \begin{aligned} &\mathcal{E}_{8}\left(\mathsf{B}_I\right), \mathcal{E}_{8}\left(\mathsf{B}_L\right), \mathcal{E}_{8}\left(\mathsf{B}_S\right), \mathcal{E}_{2}\left(\mathsf{C}\right), \mathcal{E}_{4}\left(\mathsf{D}\right), \mathcal{E}_{4}\left(\mathsf{E}\right), \mathcal{E}_{8}\left(\mathsf{G}_A\right),\\ &\mathcal{E}_{8}\left(\mathsf{G}_I\right), \mathcal{E}_{8}\left(\mathsf{G}_R\right), \mathcal{E}_{8}\left(\mathsf{G}_T\right), \mathcal{E}_{2}\left(\mathsf{H}\right), \mathcal{E}_{2}\left(\mathsf{I}\right), \mathcal{E}_{2}\left(\mathsf{J}\right), \mathcal{E}_{2}\left(\mathsf{K}\right),\\ &\mathcal{E}_{4}\left(\mathsf{L}\right), \mathcal{E}_{2}\left(\mathsf{O}\right), \mathcal{E}_{2}\left(\mathsf{P}\right), \mathcal{E}_{2}\left(\mathsf{Q}\right), \mathcal{E}_{2}\left(\mathsf{R}\right), \mathcal{E}_{2}\left(\mathsf{T}\right), \mathcal{E}_{2}\left(\mathsf{U}\right),\\ &\mathcal{E}_{4}\left(\mathsf{W}_A\right), \mathcal{E}_{4}\left(\mathsf{W}_B\right), \mathcal{E}_{4}\left(\mathsf{W}_C\right), \mathcal{E}_{4}\left(\mathsf{W}_M\right), \mathcal{E}_{4}\left(\mathsf{W}_R\right),\\ &\mathcal{E}_{4}\left(\mathsf{W}_T\right), \mathcal{E}_{4}\left(\mathsf{W}_X\right), \mathcal{E}_{4}\left(\mathsf{Y}\right) \end{aligned} \right)\\ n &\text{if } n \ne \emptyset \wedge \varphi_{10} = 1 \\ \mathbf{r} &\text{if } \mathbf{r} \ne \emptyset \wedge \varphi_{10} = 2 \\ \overline{\mathbf{x}}[\varphi_{11}]_{\varphi_{12}} &\text{if } \overline{\mathbf{x}} \ne \emptyset \wedge \varphi_{10} = 3 \wedge \varphi_{11} < \left\vert\overline{\mathbf{x}}\right\vert \wedge \varphi_{12} < \left\vert\overline{\mathbf{x}}[\varphi_{11}]\right\vert \\ \overline{\mathbf{x}}\left[i\right]_{\varphi_{11}} &\text{if } \overline{\mathbf{x}} \ne \emptyset \wedge i \ne \emptyset \wedge \varphi_{10} = 4 \wedge \varphi_{11} < \left\vert\overline{\mathbf{x}}\left[i\right]\right\vert \\ \overline{\mathbf{i}}[\varphi_{11}]_{\varphi_{12}} &\text{if } \overline{\mathbf{i}} \ne \emptyset \wedge \varphi_{10} = 5 \wedge \varphi_{11} < \left\vert\overline{\mathbf{i}}\right\vert \wedge \varphi_{12} < \left\vert\overline{\mathbf{i}}[\varphi_{11}]\right\vert \\ \overline{\mathbf{i}}\left[i\right]_{\varphi_{11}} &\text{if } \overline{\mathbf{i}} \ne \emptyset \wedge i \ne \emptyset \wedge \varphi_{10} = 6 \wedge \varphi_{11} < \left\vert\overline{\mathbf{i}}\left[i\right]\right\vert \\ \mathcal{E}_{}\left(p\right) &\text{if } p \ne \emptyset \wedge \varphi_{10} = 7 \\ p_{\mathbf{f}} &\text{if } p \ne \emptyset \wedge \varphi_{10} = 8 \\ p_{\mathbf{j}} &\text{if } p \ne \emptyset \wedge \varphi_{10} = 9 \\ \mathcal{E}_{}\left(p_{\mathbf{c}}\right) &\text{if } p \ne \emptyset \wedge \varphi_{10} = 10 \\ \mathcal{E}_{}\left(\left\updownarrow\left[S(w) \;\middle\vert\; w \mathrel{\unicode{x2B40}} p_{\mathbf{w}}\right]\right.\!\right) &\text{if } p \ne \emptyset \wedge \varphi_{10} = 11 \\ S(p_{\mathbf{w}}[\varphi_{11}]) &\text{if } p \ne \emptyset \wedge \varphi_{10} = 12 \wedge \varphi_{11} < \left\vert p_{\mathbf{w}}\right\vert \\ \text{where } S(w) \equiv \mathcal{E}_{}\left(\mathcal{E}_{4}\left(w_{s}\right), w_{c}, \mathcal{E}_{8}\left(w_{g}, w_{a}\right), \mathcal{E}_{2}\left(w_{e}, \left\vert w_{\mathbf{i}}\right\vert, \left\vert w_{\mathbf{x}}\right\vert\right), \mathcal{E}_{4}\left(\left\vert w_{\mathbf{y}}\right\vert\right)\right) \\ p_{\mathbf{w}}[\varphi_{11}]_{\mathbf{y}} &\text{if } p \ne \emptyset \wedge \varphi_{10} = 13 \wedge \varphi_{11} < \left\vert p_{\mathbf{w}}\right\vert \\ \mathcal{E}_{}\left(\left\updownarrow\mathbf{i}\right.\!\right) &\text{if } \mathbf{i} \ne \emptyset \wedge \varphi_{10} = 14 \\ \mathcal{E}_{}\left(\mathbf{i}[\varphi_{11}]\right) &\text{if } \mathbf{i} \ne \emptyset \wedge \varphi_{10} = 15 \wedge \varphi_{11} < \left\vert\mathbf{i}\right\vert \\ \emptyset &\text{otherwise} \end{cases} \\ \text{let } \left[o, f_0, z\right] &= \varphi_{7 \dots+ 3} \\ \text{let } f &= \min(f_0, \left\vert\mathbf{v}\right\vert) \\ \text{let } l &= \min(z, \left\vert\mathbf{v}\right\vert - f) \\ \left(\varepsilon', \varphi'_7, \mu'_{o \dots+ l}\right) &\equiv \begin{cases} \left(\unicode{x21AF}, \varphi_7, \mu_{o \dots+ l}\right) &\text{if } \mathbb{N}_{o \dots+ l} \not\subseteq \mathbb{V}_{\mu}^* \\ \left(\blacktriangleright, \mathtt{NONE}, \mu_{o \dots+ l}\right) &\text{otherwise if } \mathbf{v} = \emptyset \\ \left(\blacktriangleright, \left\vert\mathbf{v}\right\vert, \mathbf{v}_{f \dots+ l}\right) &\text{otherwise} \\ \end{cases} \end{aligned}$ |
| $\Omega_L(\varrho, \varphi, \mu, \mathbf{s}, s, \mathbf{d})$ <br> `lookup` = 3 <br> $g = \mathsf{M}_{L,c} + \mathcal{G}(\mathsf{M}_{L,\ell}, z)$ | $\begin{aligned} \text{let } \mathbf{a} &= \begin{cases} \mathbf{s} &\text{if } \varphi_7 \in \left\{\, s, 2^{64} - 1 \,\right\} \\ \mathbf{d}[\varphi_7] &\text{otherwise if } \varphi_7 \in \mathcal{K}\left(\mathbf{d}\right) \\ \emptyset &\text{otherwise} \end{cases} \\ \text{let } \left[h, o\right] &= \varphi_{8 \dots+ 2} \\ \text{let } z &= \varphi_{11} \\ \text{let } \mathbf{v} &= \begin{cases} \nabla &\text{if } \mathbb{N}_{h \dots+ 32} \not\subseteq \mathbb{V}_{\mu} \\ \emptyset &\text{otherwise if } \mathbf{a} = \emptyset \vee \mu_{h \dots+ 32} \not\in \mathcal{K}\left(\mathbf{a}_{\mathbf{p}}\right) \\ \mathbf{a}_{\mathbf{p}}[\mu_{h \dots+ 32}] &\text{otherwise} \\ \end{cases} \\ \text{let } f &= \min(\varphi_{10}, \left\vert\mathbf{v}\right\vert) \\ \text{let } l &= \min(z, \left\vert\mathbf{v}\right\vert - f) \\ \left(\varepsilon', \varphi'_7, \mu'_{o \dots+ l}\right) &\equiv \begin{cases} \left(\unicode{x21AF}, \varphi_7, \mu_{o \dots+ l}\right) &\text{if } \mathbf{v} = \nabla \vee \mathbb{N}_{o \dots+ l} \not\subseteq \mathbb{V}_{\mu}^*\\ \left(\blacktriangleright, \mathtt{NONE}, \mu_{o \dots+ l}\right) &\text{otherwise if } \mathbf{v} = \emptyset \\ \left(\blacktriangleright, \left\vert\mathbf{v}\right\vert, \mathbf{v}_{f \dots+ l}\right) &\text{otherwise} \\ \end{cases} \end{aligned}$ |
| $\Omega_R(\varrho, \varphi, \mu, \mathbf{s}, s, \mathbf{d})$ <br> `read` = 4 <br> $g = \mathsf{M}_{R,c} + \mathcal{G}(\mathsf{M}_{R,\mathrm{k},\ell}, k_Z) + \mathcal{G}(\mathsf{M}_{R,\mathrm{v},\ell}, v_Z)$ | $\begin{aligned} \text{let } s^* &= \begin{cases} s &\text{if } \varphi_7 = 2^{64} - 1 \\ \varphi_7 &\text{otherwise} \end{cases} \\ \text{let } \mathbf{a} &= \begin{cases} \mathbf{s} &\text{if } s^* = s \\ \mathbf{d}[s^*] &\text{otherwise if } s^* \in \mathcal{K}\left(\mathbf{d}\right) \\ \emptyset &\text{otherwise} \end{cases} \\ \text{let } \left[k_O, k_Z, o\right] &= \varphi_{8 \dots+ 3} \\ \text{let } v_Z &= \varphi_{12} \\ \text{let } \mathbf{v} &= \begin{cases} \nabla &\text{if } \mathbb{N}_{k_O \dots+ k_Z} \not\subseteq \mathbb{V}_{\mu} \\ \mathbf{a}_{\mathbf{s}}\left[\mathbf{k}\right] &\text{otherwise if } \mathbf{a} \ne \emptyset \wedge \mathbf{k} \in \mathcal{K}\left(\mathbf{a}_{\mathbf{s}}\right)\,,\  \text{where } \mathbf{k} = \mu_{k_O \dots+ k_Z} \\ \emptyset &\text{otherwise} \end{cases} \\ \text{let } f &= \min(\varphi_{11}, \left\vert\mathbf{v}\right\vert) \\ \text{let } l &= \min(v_Z, \left\vert\mathbf{v}\right\vert - f) \\ \left(\varepsilon', \varphi'_7, \mu'_{o \dots+ l}\right) &\equiv \begin{cases} \left(\unicode{x21AF}, \varphi_7, \mu_{o \dots+ l}\right) &\text{if } \mathbf{v} = \nabla \vee \mathbb{N}_{o \dots+ l} \not\subseteq \mathbb{V}_{\mu}^*\\ \left(\blacktriangleright, \mathtt{NONE}, \mu_{o \dots+ l}\right) &\text{otherwise if } \mathbf{v} = \emptyset \\ \left(\blacktriangleright, \left\vert\mathbf{v}\right\vert, \mathbf{v}_{f \dots+ l}\right) &\text{otherwise} \\ \end{cases} \end{aligned}$ |
| $\Omega_W(\varrho, \varphi, \mu, \mathbf{s}, s)$ <br> `write` = 5 <br> $g = \mathsf{M}_{W,c} + \mathcal{G}(\mathsf{M}_{W,\mathrm{k},\ell}, k_Z) + \mathcal{G}(\mathsf{M}_{W,\mathrm{v},\ell}, v_Z)$ | $\begin{aligned} \text{let } \left[k_O, k_Z, v_O, v_Z\right] &= \varphi_{7 \dots+ 4} \\ \text{let } \mathbf{k} &= \begin{cases} \mu_{k_O \dots+ k_Z} &\text{if } \mathbb{N}_{k_O \dots+ k_Z} \subseteq \mathbb{V}_{\mu} \\ \nabla &\text{otherwise} \end{cases} \\ \text{let } \mathbf{a} &= \begin{cases} \mathbf{s}\,,\ \text{ except } \mathcal{K}\left(\mathbf{a}_{\mathbf{s}}\right) = \mathcal{K}\left(\mathbf{a}_{\mathbf{s}}\right) \setminus \left\{\,k\,\right\} & \text{if } v_Z = 0 \\ \mathbf{s}\,,\ \text{ except } \mathbf{a}_{\mathbf{s}}\left[\mathbf{k}\right] = \mu_{v_O \dots+ v_Z} &\text{otherwise if } \mathbb{N}_{v_O \dots+ v_Z} \subseteq \mathbb{V}_{\mu} \\ \nabla &\text{otherwise} \end{cases} \\ \text{let } l &= \begin{cases} \left\vert\mathbf{s}_{\mathbf{s}}\left[k\right]\right\vert &\text{if } \mathbf{k} \in \mathcal{K}\left(\mathbf{s}_{\mathbf{s}}\right) \\ \mathtt{NONE} &\text{otherwise} \end{cases} \\ \left(\varepsilon', \varphi'_7, \mathbf{s}'\right) &\equiv \begin{cases} \left(\unicode{x21AF}, \varphi_7, \mathbf{s}\right) &\text{if } \mathbf{k} = \nabla \vee \mathbf{a} = \nabla\\ \left(\blacktriangleright, \mathtt{FULL}, \mathbf{s}\right) &\text{otherwise if } \mathbf{a}_{t} > \mathbf{a}_{b} \\ \left(\blacktriangleright, l, \mathbf{a}\right) &\text{otherwise}\\ \end{cases} \end{aligned}$ |
| $\Omega_I(\varrho, \varphi, \mu, s, \mathbf{d})$ <br> `info` = 6 <br> $g = \mathsf{M}_I$ | $\begin{aligned} \text{let } \mathbf{a} &= \begin{cases} \mathbf{d}\left[s\right] &\text{if } \varphi_7 = 2^{64} - 1 \\ \mathbf{d}\left[\varphi_7\right] &\text{otherwise} \end{cases} \\ \text{let } o &= \varphi_8 \\ \text{let } \mathbf{v} &= \begin{cases} \mathcal{E}_{}\left( \mathbf{a}_{c}, \mathcal{E}_{8}\left(\mathbf{a}_{b}, \mathbf{a}_{t}, \mathbf{a}_{g}, \mathbf{a}_{m}, \mathbf{a}_{o}\right), \mathcal{E}_{4}\left(\mathbf{a}_{i}\right), \mathcal{E}_{8}\left(\mathbf{a}_{f}\right), \mathcal{E}_{4}\left(\mathbf{a}_{r}, \mathbf{a}_{a}, \mathbf{a}_{p}\right) \right) &\text{if } \mathbf{a} \ne \emptyset \\ \emptyset &\text{otherwise} \end{cases} \\ \text{let } f &= \min(\varphi_{9}, \left\vert\mathbf{v}\right\vert) \\ \text{let } l &= \min(\varphi_{10}, \left\vert\mathbf{v}\right\vert - f) \\ \left(\varepsilon', \varphi'_7, \mu'_{o \dots+ l}\right) &\equiv \begin{cases} \left(\unicode{x21AF}, \varphi_7, \mu_{o \dots+ l}\right) &\text{if } \mathbf{v} = \nabla \vee \mathbb{N}_{o \dots+ l} \not\subseteq \mathbb{V}_{\mu}^*\\ \left(\blacktriangleright, \mathtt{NONE}, \mu_{o \dots+ l}\right) &\text{otherwise if } \mathbf{v} = \emptyset \\ \left(\blacktriangleright, \left\vert\mathbf{v}\right\vert, \mathbf{v}_{f \dots+ l}\right) &\text{otherwise} \\ \end{cases} \end{aligned}$ |

:::

How to read a row. The left cell says three things: the function and what it's given
(Ω_L gets the gas, registers, memory, the service's account 𝐬, its id s and all the
accounts 𝐝), its name and number (`lookup` = 3), and its price g. The right cell is a
list of *let* lines, the values the call pulls out of the registers and memory, and then
the lines with ≡, what changes. (B.15) and (B.16) cover the rest. 𝕍_μ is the memory you
may read, and 𝕍*_μ the memory you may write.

### gas (0)

**Read it aloud.** "Phi prime 7 is defined as rho prime." Price: M_G = 48.

**In plain words.** The gas left, after paying for the question, goes in φ₇.

**On a real value.** 1,000 gas, a block of 100, then `gas`: φ₇ = 852 (see (B.15)).

**In your client.** `gas` in `src/host.ts`, [16.1](./01-calling-the-host.md#the-code).

### grow_heap (1)

**Read it aloud.** "Let a be twice Z sub Z plus the zone-rounded size of o, over Z sub P;
b be 2 to the 32 minus three Z sub Z minus Z sub I minus the page-rounded stack, over Z
sub P; c the count of pages from a to b that are writable; h is a plus c. Then: carry on,
pay M Gemini c, and phi 7 is h, if phi 7 is at most h or more than b; otherwise out of
gas, gas unchanged, phi 7 is h, if the gas is less than g; otherwise carry on, pay g, and
phi 7 stays; and the pages from a up to the new phi 7 become writable."

**In plain words.** φ₇ asks for the page the heap should end at. a is the heap's first
page, b the furthest it may ever reach, a whole zone short of the stack, and h where it
ends now. Asking for no more than h (or for more than b) changes nothing: it costs 275
and answers h, which is how a program asks "where does my heap end?". Otherwise it costs
275 plus 121 for each new page, and the new pages become writable, all zeros. This is
the one general call that sets the gas itself, because the price depends on the pages.

**On a real value.** Service 1729 in `always_accumulate-1`: 760 bytes of o, 20 of w and 2
heap pages, a stack of 8,192 bytes, and it asks for page 51:

```text
a     (2 × 65,536 + 65,536) / 4,096 = 48
b     (4,294,967,296 − 196,608 − 16,777,216 − 8,192) / 4,096 = 1,044,430
h     48 + 3 writable pages (w's one, the heap's two) = 51
ask   φ₇ = 51 ≤ h: nothing to grow     pay 275, φ₇ = 51
```

**In your client.** `growHeap` in `src/host.ts`, [16.3](./03-growing-the-heap.md#the-code).

### fetch (2)

**Read it aloud.** "Let c be phi 10 if it's below 16, else nothing; let v be: the
encoding of the 29 constants if phi 10 is 0; n if there is one and phi 10 is 1; the trace
if 2; …; the encoding of all the inputs with their count if 14; input phi 11 if 15;
otherwise nothing. Let o, f nought and z be phi 7, 8 and 9; f the smaller of f nought and
v's length; l the smaller of z and what's left of v after f. Then: panic if o to o plus l
isn't writable; otherwise NONE if v is nothing; otherwise phi 7 is v's length, and memory
from o gets v's l bytes from f." Price: item c's own base, plus 𝒢 of its own rate and z.

**In plain words.** φ₁₀ picks an item and each invocation offers only some of them,
because each passes ∅ for the rest: Is-Authorized the constants and the package (0, 7 to
13); refine all but 14 and 15; accumulation the constants, the entropy and its inputs (0,
1, 14 and 15). The bytes are copied as every "copy out" call copies them (below).

| Items | What |
| --- | --- |
| 0 | the 29 constants, in 122 bytes |
| 1 | entropy: η′₀ in accumulation, 32 zero bytes in refine |
| 2 | the authorizer's trace (refine) |
| 3 to 6 | an item's extrinsics or imported segments (refine) |
| 7 to 13 | the package: whole, its configuration, its token, its context, the items' summaries, one summary, one payload |
| 14, 15 | all the service's inputs, or one (accumulation) |

**On a real value.** Service 1729's first host call: item 0, the constants.

```text
φ₁₀ = 0          item 0: c = 0
price            390 + 𝒢(0, z) = 390     item 0 has no per-byte rate
v                122 bytes; φ₇ = 122
```

**In your client.** `fetch` and `protocolConstants` in `src/host.ts`,
[16.2](./02-fetch.md#the-code); accumulation's items in `accumulateHost`.

### The copy-out ending: fetch, lookup, read, info

Four rows end the same way, so learn it once. The call has found a value 𝐯 (or nothing,
∅, or a memory fault, ∇). The registers say where it goes, o, from which byte, f, and how
many bytes at most, z or l:

```text
f   = min(asked start, |𝐯|)        never past the end
l   = min(asked length, |𝐯| − f)   never more than is there
↯   if the hash or key couldn't be read (∇), or o to o + l isn't writable
NONE if there's no value
|𝐯| otherwise, into φ₇, and l bytes of 𝐯 from f, into memory at o
```

φ₇ is always the value's *whole* length, so asking for 0 bytes is how a service learns
the size before it makes room. [16.4](./04-info.md#the-code)'s `copyOut` is this ending.

### lookup (3)

**Read it aloud.** "Let a be this service's account if phi 7 is its id or 2 to the 64
minus 1; else account phi 7, if there is one; else nothing. Let h and o be phi 8 and 9; z
be phi 11. Let v be: a fault, if the 32 bytes at h can't be read; nothing, if there's no
account or it has no preimage for those 32 bytes; else that preimage." Then the copy-out
ending, from φ₁₀. Price: 600 + 𝒢(248, z).

**In plain words.** Any service's preimage, by its hash. Reading another service's is
fine: anyone holding the bytes could check them against the hash anyway.

**On a real value.** `lookup_foreign_preimage`: service 1729 keeps an 8-byte preimage,
the bytes of "preimage". Asking for all 8:

```text
price     600 + 𝒢(248, 8) = 600 + 2 = 602      248 × 8 = 1,984; / 1,024 = 1.9…, up to 2
φ₇        8, and the 8 bytes at o
```

**In your client.** `lookup` in `src/host.ts`, [16.8](./08-lookup.md#the-code).

### read (4)

**Read it aloud.** "Let s star be s if phi 7 is 2 to the 64 minus 1, else phi 7; a the
account s star; the key's offset k O, its size k Z and o be phi 8, 9 and 10; v Z be phi
12. Let v be a fault if the key can't be read; the value under key k in a's storage, if
there is one; else nothing." Then the copy-out ending, from φ₁₁. Price: 2,407 + 𝒢(1,736,
k_Z) + 𝒢(248, v_Z).

**In plain words.** Look a key up in a service's storage, its own or another's. The price
counts the key's bytes and the value's bytes asked for.

**On a real value.** [16.5](./05-storage.md)'s test reads "last" back, asking for up to 10
bytes:

```text
price     2,407 + 𝒢(1,736, 4) + 𝒢(248, 10) = 2,407 + 7 + 3 = 2,417
φ₇        3, and 01 02 03 at o
```

**In your client.** `read` in `src/host.ts`, [16.5](./05-storage.md#the-code).

### write (5)

**Read it aloud.** "Let the key's offset and size, and the value's offset and size, be phi
7 to 10; k the key, or a fault if it can't be read; a be s without key k if the value's
size is 0, or s with the value stored under k if it can be read, else a fault; l the old
value's length, or NONE. Then: panic on a fault; FULL, and s unchanged, if a's minimum
balance would be more than its balance; otherwise phi 7 is l, and s becomes a." Price:
2,442 + 𝒢(3,358, k_Z) + 𝒢(216, v_Z).

**In plain words.** Change the service's *own* storage: store a value, or delete the key
with an empty one. Every stored byte raises the service's minimum balance, so a write the
balance can't cover is refused with FULL. φ₇ comes back as the old value's length, or
NONE if there was none.

**On a real value.** [16.5](./05-storage.md)'s test account: a balance of 1,000, 2 items in
50 bytes.

```text
write "last" → 01 02 03     price 2,457 (see (B.17)); 3 items, 50 + 34 + 4 + 3 = 91 bytes
                            φ₇ = NONE: nothing was there
write 1,000 bytes instead   a_t = 100 + 10 × 3 + (50 + 34 + 4 + 1,000) = 1,218 > 1,000
                            φ₇ = FULL, nothing stored
```

**In your client.** `write` in `src/host.ts`, [16.5](./05-storage.md#the-code).

### info (6)

**Read it aloud.** "Let a be account s if phi 7 is 2 to the 64 minus 1, else account phi
7; o be phi 8; v be the encoding of a's code hash; its balance, minimum balance, least
gases and bytes in 8 bytes each; its items in 4; its gratis storage in 8; and the slots it was
created and last accumulated, and its parent's id, in 4 each, if there is such an
account; else nothing." Then the copy-out ending, from φ₉, at most φ₁₀ bytes. Price: 703.

**In plain words.** A service account's record, in 96 bytes: whose is in φ₇, 2^64 − 1
meaning "mine".

**On a real value.** Service 1729's record in `always_accumulate-1`:

```text
c                  fd3f1355…                          32 bytes
b, a_t, g, m, o    119,250, 19,250, 10, 10, 19,130    8 bytes each: 40
i                  2                                  4 bytes
f                  0                                  8 bytes
r, a, p            0, 0, 0                            4 bytes each: 12
total              32 + 40 + 4 + 8 + 12 = 96 bytes
```

a_t, the minimum balance, isn't stored: `info` works it out, 100 + 10 × 2 + 1 × 19,130 −
0 = 19,250 ([lesson 14.2](../14-services/02-the-service-account.md)).

**In your client.** `info` in `src/host.ts`, [16.4](./04-info.md#the-code).

## (B.18) and (B.19), and B.6's table: refine's own host calls

::: gray-paper B.6

#### Appendix B.6 Refine Functions {#gp-B-6}

<a id="gp-B-6-p1"></a>These assume some refine context pair $\left(\mathbf{m}, \mathbf{e}\right) \in \!\left\lgroup\left\langle\!\left\vert \mathbb{N}\to\mathbb{I}\right\vert\!\right\rangle, \left[\!\left[\mathbb{J}\right]\!\right]_{}\right\rgroup\!$, which are both initially empty. Other than the gas-counter which is explicitly defined, elements of PVM state are each assumed to remain unchanged by the host-call unless explicitly specified.

<a id="gp-B-6-p2"></a><a id="eq-B-18"></a><a id="eq-B-19"></a>

$$
\begin{align}
\varrho' &\equiv \varrho - g \tag{B.18} \\
\left(\varepsilon', \varphi', \mu'\right) &\equiv \begin{cases}
\left(\infty, \varphi, \mu\right) &\text{if } \varrho < g\\
\left(\blacktriangleright, \varphi, \mu\right) \text{ except as indicated below} &\text{otherwise}
\end{cases} \tag{B.19}
\end{align}
$$

<a id="gp-B-6-p3"></a>

| **Function** <br> **Identifier** <br> **Gas usage (**$g$**)** | **Mutations** |
| --- | --- |
| $\Omega_H(\varrho, \varphi, \mu, s, \mathbf{d}, t)$ <br> `historical_lookup` = 7 <br> $g = \mathsf{M}_{H,c} + \mathcal{G}(\mathsf{M}_{H,\ell}, z)$ | $\begin{aligned} \text{let } \mathbf{a} &= \begin{cases} \mathbf{d}\left[s\right] &\text{if } \varphi_7 = 2^{64} - 1 \wedge s \in \mathcal{K}\left(\mathbf{d}\right) \\ \mathbf{d}[\varphi_7] &\text{if } \varphi_7 \in \mathcal{K}\left(\mathbf{d}\right) \\ \emptyset &\text{otherwise} \end{cases} \\ \text{let } \left[h, o\right] &= \varphi_{8 \dots+ 2} \\ \text{let } z &= \varphi_{11} \\ \text{let } \mathbf{v} &= \begin{cases} \nabla &\text{if } \mathbb{N}_{h \dots+ 32} \not\subseteq \mathbb{V}_{\mu} \\ \emptyset &\text{otherwise if } \mathbf{a} = \emptyset \\ \Lambda(\mathbf{a}, t, \mu_{h \dots+ 32}) &\text{otherwise} \\ \end{cases} \\ \text{let } f &= \min(\varphi_{10}, \left\vert\mathbf{v}\right\vert) \\ \text{let } l &= \min(z, \left\vert\mathbf{v}\right\vert - f) \\ \left(\varepsilon', \varphi'_7, \mu'_{o \dots+ l}\right) &\equiv \begin{cases} \left(\unicode{x21AF}, \varphi_7, \mu_{o \dots+ l}\right) &\text{if } \mathbf{v} = \nabla \vee \mathbb{N}_{o \dots+ l} \not\subseteq \mathbb{V}_{\mu}^*\\ \left(\blacktriangleright, \mathtt{NONE}, \mu_{o \dots+ l}\right) &\text{otherwise if } \mathbf{v} = \emptyset \\ \left(\blacktriangleright, \left\vert\mathbf{v}\right\vert, \mathbf{v}_{f \dots+ l}\right) &\text{otherwise} \\ \end{cases} \end{aligned}$ |
| $\Omega_E(\varrho, \varphi, \mu, \mathbf{e}, \varsigma)$ <br> `export` = 8 <br> $g = \mathsf{M}_E$ | $\begin{aligned} \text{let } p &= \varphi_7 \\ \text{let } z &= \min(\varphi_8, \mathsf{W}_G) \\ \text{let } \mathbf{x} &= \begin{cases} \mathcal{P}_{\mathsf{W}_G}\left({\mu}_{p \dots+ z}\right) &\text{if } \mathbb{N}_{p \dots+ z} \subseteq \mathbb{V}_{\mu}\\ \nabla &\text{otherwise} \end{cases}\\ \left(\varepsilon', \varphi'_7, \mathbf{e}'\right) &\equiv \begin{cases} \left(\unicode{x21AF}, \varphi_7, \mathbf{e}\right) &\text{if } \mathbf{x} = \nabla \\ \left(\blacktriangleright, \mathtt{FULL}, \mathbf{e}\right) &\text{otherwise if } \varsigma+\left\vert\mathbf{e}\right\vert \ge \mathsf{W}_X \\ \left(\blacktriangleright, \varsigma + \left\vert\mathbf{e}\right\vert, \mathbf{e} \mathbin{+\!\!+} \mathbf{x}\right) &\text{otherwise} \end{cases} \end{aligned}$ |
| $\Omega_M(\varrho, \varphi, \mu, \mathbf{m})$ <br> `machine` = 9 <br> $g = \mathsf{M}_{M,c} + \mathcal{G}(\mathsf{M}_{M,\ell}, p_Z)$ | $\begin{aligned} \text{let } \left[p_O, p_Z, i\right] &= \varphi_{7 \dots+ 3} \\ \text{let } \mathbf{p} &= \begin{cases} \mu_{p_O \dots+ p_Z} &\text{if } \mathbb{N}_{p_O \dots+ p_Z} \subseteq \mathbb{V}_{\mu} \\ \nabla &\text{otherwise} \end{cases} \\ \text{let } n &= \min(n \in \mathbb{N} : n \not\in \mathcal{K}\left(\mathbf{m}\right)) \\ \text{let } \mathbf{u} &= \left(\mathbf{v}\mathrel{\unicode{x2AF6}}[0, 0, \dots],\mathbf{a}\mathrel{\unicode{x2AF6}}[\emptyset, \emptyset, \dots]\right) \\ \left(\varepsilon', \varphi'_7, \mathbf{m}\right) &\equiv \begin{cases} \left(\blacktriangleright, \mathtt{FULL}, \mathbf{m}\right) &\text{if } \left\vert\mathbf{m}\right\vert \ge 63 \\ \left(\unicode{x21AF}, \varphi_7, \mathbf{m}\right) &\text{otherwise if } \mathbf{p} = \nabla \\ \left(\blacktriangleright, \mathtt{HUH}, \mathbf{m}\right) &\text{otherwise if } \text{deblob}(\mathbf{p}, i) = \nabla \\ \left(\blacktriangleright, n, \mathbf{m} \cup \left\{\,\left(n \mapsto \left(\mathbf{p}, \mathbf{u}, i, \bot\right)\right)\,\right\} \right) &\text{otherwise} \\ \end{cases} \\ \end{aligned}$ |
| $\Omega_P(\varrho, \varphi, \mu, \mathbf{m})$ <br> `peek` = 10 <br> $g = \mathsf{M}_{P,c} + \mathcal{G}(\mathsf{M}_{P,\ell}, z)$ | $\begin{aligned} \text{let } \left[n, o, s, z\right] &= \varphi_{7 \dots+ 4} \\ \left(\varepsilon', \varphi'_7, {\mu}'\right) &\equiv \begin{cases} \left(\unicode{x21AF}, \varphi_7, {\mu}\right) &\text{if } \mathbb{N}_{o \dots+ z} \not\subseteq \mathbb{V}_{\mu}^* \\ \left(\blacktriangleright, \mathtt{WHO}, {\mu}\right) &\text{otherwise if } n \not\in \mathcal{K}\left(\mathbf{m}\right) \\ \left(\blacktriangleright, \mathtt{OOB}, {\mu}\right) &\text{otherwise if } \mathbb{N}_{s \dots+ z} \not\subseteq \mathbb{V}_{\mathbf{m}\left[n\right]_{\mathbf{u}}} \\ \left(\blacktriangleright, \mathtt{OK}, {\mu}'\right) &\text{otherwise} \\ \text{where } {\mu}' = {\mu} \text{ except } {\mu}_{o \dots+ z} = (\mathbf{m}\left[n\right]_{\mathbf{u}})_{s \dots+ z} \end{cases} \\ \end{aligned}$ |
| $\Omega_O(\varrho, \varphi, \mu, \mathbf{m})$ <br> `poke` = 11 <br> $g = \mathsf{M}_{O,c} + \mathcal{G}(\mathsf{M}_{O,\ell}, z)$ | $\begin{aligned} \text{let } \left[n, s, o, z\right] &= \varphi_{7 \dots+ 4} \\ \left(\varepsilon', \varphi'_7, \mathbf{m}'\right) &\equiv \begin{cases} \left(\unicode{x21AF}, \varphi_7, \mathbf{m}\right) &\text{if } \mathbb{N}_{s \dots+ z} \not\subseteq \mathbb{V}_{\mu} \\ \left(\blacktriangleright, \mathtt{WHO}, \mathbf{m}\right) &\text{otherwise if } n \not\in \mathcal{K}\left(\mathbf{m}\right) \\ \left(\blacktriangleright, \mathtt{OOB}, \mathbf{m}\right) &\text{otherwise if } \mathbb{N}_{o \dots+ z} \not\subseteq \mathbb{V}_{\mathbf{m}\left[n\right]_{\mathbf{u}}}^* \\ \left(\blacktriangleright, \mathtt{OK}, \mathbf{m}'\right)  &\text{otherwise} \\ \text{where } \mathbf{m}' = \mathbf{m} \text{ except } (\mathbf{m}'\left[n\right]_{\mathbf{u}})_{o \dots+ z} = {\mu}_{s \dots+ z} \end{cases} \\ \end{aligned}$ |
| $\Omega_Z(\varrho, \varphi, \mu, \mathbf{m})$ <br> `pages` = 12 <br> $g =  \begin{cases} \mathsf{M}_{Z,f,c} + c \cdot \mathsf{M}_{Z,f,p} &\text{if } r = 0 \\ \mathsf{M}_{Z,a,c} + c \cdot \mathsf{M}_{Z,a,p} &\text{if } r \in \left\{\,1, 2\,\right\} \\ \mathsf{M}_{Z,s,c} + c \cdot \mathsf{M}_{Z,s,p} &\text{if } r \in \left\{\,3, 4\,\right\} \\ \mathsf{M}_{Z,i} &\text{otherwise} \end{cases}$ | $\begin{aligned} \text{let } \left[n, p, c, r\right] &= \varphi_{7 \dots+ 4} \\ \text{let } \mathbf{u} &= \begin{cases} \mathbf{m}\left[n\right]_{\mathbf{u}} &\text{if } n \in \mathcal{K}\left(\mathbf{m}\right) \\ \nabla &\text{otherwise}\\ \end{cases} \\ \text{let } \mathbf{u}' &= \mathbf{u} \text{ except } \begin{cases} (\mathbf{u}'_{\mathbf{v}})_{p\mathsf{Z}_P\dots+c\mathsf{Z}_P} = \begin{cases} \left[0, 0, \dots\right] &\text{if } r < 3 \\ (\mathbf{u}_{\mathbf{v}})_{p\mathsf{Z}_P\dots+c\mathsf{Z}_P} &\text{otherwise} \end{cases} \\ (\mathbf{u}'_{\mathbf{a}})_{p \dots+ c} = \begin{cases} \left[\emptyset, \emptyset, \dots\right] &\text{if } r = 0 \\ \left[\mathrm{R}, \mathrm{R}, \dots\right] &\text{if } r = 1 \vee r = 3 \\ \left[\mathrm{W}, \mathrm{W}, \dots\right] &\text{if } r = 2 \vee r = 4 \\ \end{cases} \end{cases}\\ \left(\varphi'_7, \mathbf{m}'\right) &\equiv \begin{cases} \left(\mathtt{WHO}, \mathbf{m}\right) &\text{if } \mathbf{u} = \nabla \\ \left(\mathtt{HUH}, \mathbf{m}\right) &\text{otherwise if } r > 4 \vee p < 16 \vee p+c \ge {}^{2^{32}}\!/_{\mathsf{Z}_P} \\ \left(\mathtt{HUH}, \mathbf{m}\right) &\text{otherwise if } r > 2 \wedge (\mathbf{u}_{\mathbf{a}})_{p \dots+ c} \ni \emptyset \\ \left(\mathtt{OK}, \mathbf{m}'\right) &\text{otherwise}\,,\  \text{where } \mathbf{m}' = \mathbf{m} \text{ except } \mathbf{m}'\left[n\right]_{\mathbf{u}} = \mathbf{u}' \\ \end{cases} \\ \end{aligned}$ |
| $\Omega_K(\varrho, \varphi, \mu, \mathbf{m})$ <br> `invoke` = 13 <br> $g = \mathsf{M}_K + g_R$ | $\begin{aligned} \text{let } \left[n, o\right] &= \varphi_{7, 8} \\ \text{let } \left(g_R, \mathbf{w}\right) &= \begin{cases} \left(g_R, \mathbf{w}\right): \mathcal{E}_{8}\left(g_R\right) \frown \mathcal{E}_{8}\left(\mathbf{w}\right) = {\mu}_{o \dots+ 112} &\text{if } \mathbb{N}_{o \dots+ 112} \subseteq \mathbb{V}_{{\mu}}^* \\ \left(0, \nabla\right) &\text{otherwise} \end{cases} \\ \text{let } \left(c, i', g_R', \tilde{g}', \mathbf{w}', \mathbf{u}'\right) &= \Psi(\mathbf{m}\left[n\right]_{\mathfrak{p}}, \mathbf{m}\left[n\right]_{i}, g_R, \mathbf{m}\left[n\right]_{\tilde{g}}, \mathbf{w}, \mathbf{m}\left[n\right]_{\mathbf{u}})\\ \text{let } {\mu}^* &= {\mu} \text{ except } {\mu}^*_{o \dots+ 112} = \mathcal{E}_{8}\left(g_R'\right) \frown \mathcal{E}_{8}\left(\mathbf{w}'\right)\\ \text{let } \mathbf{m}^* &= \mathbf{m} \text{ except } \begin{cases} \mathbf{m}^*\left[n\right]_{\mathbf{u}} = \mathbf{u}'\\ \mathbf{m}^*\left[n\right]_{i} = \begin{cases} i' + \text{skip}(i') + 1 &\text{if } c \in \left\{\, \hbar \,\right\} \times \mathbb{N}_R\\ i' &\text{otherwise} \end{cases}\\ \mathbf{m}^*\left[n\right]_{\tilde{g}} = \tilde{g}'\\ \end{cases}\\ \varrho' &\equiv \begin{cases} \varrho - g &\text{if } \mathbf{w} = \nabla \vee n \not\in \mathcal{K}\left(\mathbf{m}\right) \vee \varrho < g \\ \varrho - g + g_R' &\text{otherwise} \end{cases}\\ \left(\varepsilon', \varphi'_7, \varphi'_8, {\mu}', \mathbf{m}'\right) &\equiv \begin{cases} \left(\unicode{x21AF}, \varphi_7, \varphi_8, {\mu}, \mathbf{m}\right) &\text{if } \mathbf{w} = \nabla \\ \left(\blacktriangleright, \mathtt{WHO}, \varphi_8, {\mu}, \mathbf{m}\right) &\text{otherwise if } n \not\in \mathbf{m} \\ \left(\blacktriangleright, \mathtt{HOST}, h, {\mu}^*, \mathbf{m}^*\right) &\text{otherwise if } c = \hbar \times h \\ \left(\blacktriangleright, \mathtt{FAULT}, x, {\mu}^*, \mathbf{m}^*\right) &\text{otherwise if } c = \unicode{x2132} \times x \\ \left(\blacktriangleright, \mathtt{OOG}, \varphi_8, {\mu}^*, \mathbf{m}^*\right) &\text{otherwise if } c = \infty \\ \left(\blacktriangleright, \mathtt{PANIC}, \varphi_8, {\mu}^*, \mathbf{m}^*\right) &\text{otherwise if } c = \unicode{x21AF} \\ \left(\blacktriangleright, \mathtt{HALT}, \varphi_8, {\mu}^*, \mathbf{m}^*\right) &\text{otherwise if } c = \blacksquare \\ \end{cases} \\ \end{aligned}$ |
| $\Omega_X(\varrho, \varphi, \mu, \mathbf{m})$ <br> `expunge` = 14 <br> $g = \mathsf{M}_X$ | $\begin{aligned} \text{let } n &= \varphi_7 \\ \left(\varphi'_7, \mathbf{m}'\right) &\equiv \begin{cases} \left(\mathtt{WHO}, \mathbf{m}\right) &\text{if } n \not\in \mathcal{K}\left(\mathbf{m}\right) \\ \left(\mathbf{m}\left[n\right]_{i}, \mathbf{m} \setminus n\right) &\text{otherwise} \\ \end{cases} \\ \end{aligned}$ |

:::

**Read it aloud.** (B.18) and (B.19): "Rho prime is defined as rho minus g. Epsilon prime,
phi prime and mu prime are defined as: out of gas, with phi and mu as they were, if rho is
less than g; otherwise carry on, with phi and mu as they were, except as shown below."

**In plain words.** The same pay-first rule as (B.15) and (B.16), for the eight calls only
refine has. Their context is the pair (𝐦, 𝐞): the inner machines and the exported
segments. None of these runs on your client, so here is each in a line or two:

| Call | What it does | Price |
| --- | --- | --- |
| `historical_lookup` (7) | like `lookup`, but as the preimages were at the lookup anchor's slot, so every auditor gets the same answer | 1,125 + 𝒢(264, z) |
| `export` (8) | appends one segment, the bytes at φ₇ padded to W_G = 4,104; φ₇ = its index, ς + \|𝐞\|; FULL past W_X = 3,072 exports | 3,521 |
| `machine` (9) | starts an inner machine from a program in memory; φ₇ = its number; FULL with 63 already, HUH if the program doesn't decode | 1,862 + 𝒢(112, p_Z) |
| `peek` (10) | copies bytes out of an inner machine's memory into ours; OOB if they can't be read there | 377 + 𝒢(336, z) |
| `poke` (11) | copies bytes from ours into an inner machine's memory; OOB if they can't be written there | 297 + 𝒢(224, z) |
| `pages` (12) | sets c pages of an inner machine from page p: mode 0 frees them, 1 and 2 zero them read-only or writable, 3 and 4 change their access and keep their bytes; HUH for a bad mode or range | by mode, from 80 to 275 + 121 a page |
| `invoke` (13) | runs an inner machine with the gas and 13 registers at φ₈, until it stops; writes back what's left, and says why it stopped: HALT, PANIC, FAULT, HOST or OOG | 968, plus the gas it hands over, minus what comes back |
| `expunge` (14) | throws an inner machine away; φ₇ = where it had got to | 335 |

B.1's second list of result codes, HALT = 0 to OOG = 4, is what `invoke` answers. B.1's
last line, on the values a host-call-request exit may return, is used by no formula in
this appendix, and nothing in your client depends on it.

**On a real value.** Made up, since no vector runs refine: a service exports three
segments in an item whose package's earlier items exported 5 (ς = 5).

```text
export #1     φ₇ = 5 + 0 = 5        3,521 gas
export #2     φ₇ = 5 + 1 = 6        3,521 gas
export #3     φ₇ = 5 + 2 = 7        3,521 gas; 𝐞 holds 3 segments of 4,104 bytes
```

**In your client.** Not built: a block importer never refines.

## (B.20) and (B.21): every accumulate host call pays first, with the pair

::: gray-paper-eq B.20

<a id="ex-B-20"></a>The Gray Paper's (B.20), (B.21), [in its place in the paper's words](./09-asking-for-preimages.md#eq-B-20):

$$
\begin{align}
\varrho' &\equiv \varrho - g \tag{B.20} \\
\left(\varepsilon', \varphi', \mu', \mathbf{x}', \mathbf{y}'\right) &\equiv \begin{cases}
\left(\infty, \varphi, \mu, \mathbf{x}, \mathbf{y}\right) &\text{if } \varrho < g\\
\left(\blacktriangleright, \varphi, \mu, \mathbf{x}, \mathbf{y}\right) \text{ except as indicated below} &\text{otherwise}
\end{cases} \tag{B.21}
\end{align}
$$

:::

**Read it aloud.** "Rho prime is defined as rho minus g. Epsilon prime, phi prime, mu
prime, x prime and y prime are defined as: out of gas, with phi, mu, x and y as they
were, if rho is less than g; otherwise carry on, with all of them as they were, except
as shown below."

**In plain words.** (B.15) and (B.16) again, for B.7's calls, which take the whole pair
of contexts (𝐱, 𝐲). Out of gas changes neither, and then C keeps 𝐲 anyway.

**On a real value.** [16.6](./06-checkpoints.md)'s test: a `checkpoint` with 10,000 gas.

```text
g = 103          10,000 ≥ 103: pay
φ₇               10,000 − 103 = 9,897      the gas left, as Ω_C says
```

**In your client.** `charge` again, at the top of every accumulate call from
[16.6](./06-checkpoints.md#the-code) on.

## B.7's table: the accumulate host calls

::: gray-paper B.7 4-5

#### Appendix B.7 Accumulate Functions, continued

<a id="gp-B-7-p4"></a>

| **Function** <br> **Identifier** <br> **Gas usage (**$g$**)** | **Mutations** |
| --- | --- |
| $\Omega_B(\varrho, \varphi, \mu, \left(\mathbf{x}, \mathbf{y}\right))$ <br> `bless` = 15 <br> $g = \mathsf{M}_{B,c} + n \cdot \mathsf{M}_{B,\ell}$ | $\begin{aligned} \text{let } \left[m, a, v, r, o, n\right] &= \varphi_{7 \dots+ 6} \\ \text{let } \mathbf{a} &= \begin{cases} \mathcal{E}^{-1}_{4}\left(\mu_{a \dots+ 4\mathsf{C}}\right) &\text{if } \mathbb{N}_{a \dots+ 4\mathsf{C}} \subseteq \mathbb{V}_{\mu} \\ \nabla &\text{otherwise} \end{cases} \\ \text{let } \mathbf{z} &= \begin{cases} \left\{\,\left(s \mapsto g\right) \  \text{where } \mathcal{E}_{4}\left(s\right) \frown \mathcal{E}_{8}\left(g\right) = \mu_{o+12i \dots+ 12} \;\middle\vert\; i \in \mathbb{N}_{n}\,\right\} &\text{if } \mathbb{N}_{o \dots+ 12n} \subseteq \mathbb{V}_{\mu} \\ \nabla &\text{otherwise} \end{cases} \\ \left(\varepsilon', \varphi'_7, (\mathbf{x}'_{\mathbf{e}})_{\left(m, \mathbf{a}, v, r, \mathbf{z}\right)}\right) &= \begin{cases} \left(\unicode{x21AF}, \varphi_7, (\mathbf{x}_{\mathbf{e}})_{\left(m, \mathbf{a}, v, r, \mathbf{z}\right)}\right) &\text{if } \left\{\,\mathbf{z}, \mathbf{a}\,\right\} \ni \nabla \\ \left(\blacktriangleright, \mathtt{HUH}, (\mathbf{x}_{\mathbf{e}})_{\left(m, \mathbf{a}, v, r, \mathbf{z}\right)}\right) &\text{otherwise if } \mathbf{x}_{s} \ne (\mathbf{x}_{\mathbf{e}})_{m} \\ \left(\blacktriangleright, \mathtt{WHO}, (\mathbf{x}_{\mathbf{e}})_{\left(m, \mathbf{a}, v, r, \mathbf{z}\right)}\right) &\text{otherwise if } \left(m, v, r\right) \not\in \mathbb{N}_S^3 \\ \left(\blacktriangleright, \mathtt{OK}, \!\left\lgroup m, \mathbf{a}, v, r, \mathbf{z}\right\rgroup\!\right) &\text{otherwise} \\ \end{cases} \end{aligned}$ |
| $\Omega_A(\varrho, \varphi, \mu, \left(\mathbf{x}, \mathbf{y}\right))$ <br> `assign` = 16 <br> $g = \mathsf{M}_A$ | $\begin{aligned} \text{let } \left[c, o, a\right] &= \varphi_{7 \dots+ 3} \\ \text{let } \mathbf{q} &= \begin{cases} \left[\mu_{o + 32i \dots+ 32} \;\middle\vert\; i \mathrel{\unicode{x2B40}} \mathbb{N}_{\mathsf{Q}}\right] &\text{if } \mathbb{N}_{o \dots+ 32\mathsf{Q}} \subseteq \mathbb{V}_{\mu} \\ \nabla &\text{otherwise} \end{cases} \\ \left(\varepsilon', \varphi'_7, (\mathbf{x}'_{\mathbf{e}})_{\mathbf{q}}\left[c\right], (\mathbf{x}'_{\mathbf{e}})_{\mathbf{a}}\left[c\right]\right) &= \begin{cases} \left(\unicode{x21AF}, \varphi_7, (\mathbf{x}_{\mathbf{e}})_{\mathbf{q}}\left[c\right], (\mathbf{x}_{\mathbf{e}})_{\mathbf{a}}\left[c\right]\right) &\text{if } \mathbf{q} = \nabla \\ \left(\blacktriangleright, \mathtt{CORE}, (\mathbf{x}_{\mathbf{e}})_{\mathbf{q}}\left[c\right], (\mathbf{x}_{\mathbf{e}})_{\mathbf{a}}\left[c\right]\right) &\text{otherwise if } c \ge \mathsf{C} \\ \left(\blacktriangleright, \mathtt{HUH}, (\mathbf{x}_{\mathbf{e}})_{\mathbf{q}}\left[c\right], (\mathbf{x}_{\mathbf{e}})_{\mathbf{a}}\left[c\right]\right) &\text{otherwise if } \mathbf{x}_{s} \ne (\mathbf{x}_{\mathbf{e}})_{\mathbf{a}}\left[c\right]\\ \left(\blacktriangleright, \mathtt{WHO}, (\mathbf{x}_{\mathbf{e}})_{\mathbf{q}}\left[c\right], (\mathbf{x}_{\mathbf{e}})_{\mathbf{a}}\left[c\right]\right) &\text{otherwise if } a \not\in \mathbb{N}_S \\ \left(\blacktriangleright, \mathtt{OK}, \mathbf{q}, a\right) &\text{otherwise} \\ \end{cases} \\ \end{aligned}$ |
| $\Omega_D(\varrho, \varphi, \mu, \left(\mathbf{x}, \mathbf{y}\right))$ <br> `designate` = 17 <br> $g = \mathsf{M}_{D,c} + z \cdot \mathsf{M}_{D,\ell}$ | $\begin{aligned} \text{let } \left[o, z\right] &= \varphi_{7 \dots+ 2} \\ \text{let } \mathbf{v} &= \begin{cases} \left[\mu_{o + 336i \dots+ 336} \;\middle\vert\; i \mathrel{\unicode{x2B40}} \mathbb{N}_z\right] &\text{if } \mathbb{N}_{o \dots+ 336z} \subseteq \mathbb{V}_{\mu} \\ \nabla &\text{otherwise} \end{cases} \\ \left(\varepsilon', \varphi'_7, (\mathbf{x}'_{\mathbf{e}})_{\mathbf{i}}\right) &= \begin{cases} \left(\unicode{x21AF}, \varphi_7, (\mathbf{x}_{\mathbf{e}})_{\mathbf{i}}\right) &\text{if } \mathbf{v} = \nabla\\ \left(\blacktriangleright, \mathtt{HUH}, (\mathbf{x}_{\mathbf{e}})_{\mathbf{i}}\right) &\text{otherwise if } z \not\in \mathbb{V} \vee \mathbf{x}_{s} \ne (\mathbf{x}_{\mathbf{e}})_{v}\\ \left(\blacktriangleright, \mathtt{OK}, \mathbf{v}\right) &\text{otherwise} \\ \end{cases} \\ \end{aligned}$ |
| $\Omega_C(\varrho, \varphi, \mu, \left(\mathbf{x}, \mathbf{y}\right))$ <br> `checkpoint` = 18 <br> $g = \mathsf{M}_C$ | $\begin{aligned} \mathbf{y}' &\equiv \mathbf{x} \\ \varphi'_7 &\equiv \varrho' \end{aligned}$ |
| $\Omega_N(\varrho, \varphi, \mu, \left(\mathbf{x}, \mathbf{y}\right), t)$ <br> `new` = 19 <br> $g = \mathsf{M}_N$ | $\begin{aligned} \text{let } \left[o, l, g, m, f, i\right] &= \varphi_{7 \dots+ 6} \\ \text{let } c &= \begin{cases} \mu_{o \dots+ 32} &\text{if } \mathbb{N}_{o \dots+ 32} \subseteq \mathbb{V}_{\mu} \wedge l \in \mathbb{N}_{2^{32}} \\ \nabla &\text{otherwise} \end{cases}\\ \text{let } \mathbf{a} \in \mathbb{A} \cup \left\{\,\nabla\,\right\} &= \begin{cases} \left( c, \mathbf{\mathbf{s}}\mathrel{\unicode{x2AF6}}\left\{\right\}, \mathbf{\mathbf{l}}\mathrel{\unicode{x2AF6}}\left\{\,\left(\left(c, l\right) \mapsto \left[\right]\right)\,\right\}, b\mathrel{\unicode{x2AF6}}\mathbf{a}_{t}, g, m, \mathbf{\mathbf{p}}\mathrel{\unicode{x2AF6}}\left\{\right\}, r\mathrel{\unicode{x2AF6}} t, f, a\mathrel{\unicode{x2AF6}}0, p\mathrel{\unicode{x2AF6}}\mathbf{x}_{s} \right) &\text{if } c \ne \nabla \\ \nabla &\text{otherwise} \end{cases} \\ \text{let } \mathbf{s} &= \mathbf{x}_{\mathbf{s}} \text{ except } \mathbf{s}_{b} = (\mathbf{x}_{\mathbf{s}})_{b} - \mathbf{a}_{t} \\ \left(\varepsilon', \varphi'_7, \mathbf{x}'_{i}, (\mathbf{x}'_{\mathbf{e}})_{\mathbf{d}}\right) &\equiv \begin{cases} \left(\unicode{x21AF}, \varphi_7, \mathbf{x}_{i}, (\mathbf{x}_{\mathbf{e}})_{\mathbf{d}}\right) &\text{if } c = \nabla \\ \left(\blacktriangleright, \mathtt{HUH}, \mathbf{x}_{i}, (\mathbf{x}_{\mathbf{e}})_{\mathbf{d}}\right) &\text{otherwise if } f \ne 0 \wedge \mathbf{x}_{s} \ne (\mathbf{x}_{\mathbf{e}})_{m} \\ \left(\blacktriangleright, \mathtt{CASH}, \mathbf{x}_{i}, (\mathbf{x}_{\mathbf{e}})_{\mathbf{d}}\right) &\text{otherwise if } \mathbf{s}_{b} < (\mathbf{x}_{\mathbf{s}})_{t} \\ \left(\blacktriangleright, \mathtt{FULL}, \mathbf{x}_{i}, (\mathbf{x}_{\mathbf{e}})_{\mathbf{d}}\right) &\text{otherwise if } \mathbf{x}_{s} = (\mathbf{x}_{\mathbf{e}})_{r} \wedge i < \mathsf{S} \wedge i \in \mathcal{K}\left((\mathbf{x}_{\mathbf{e}})_{\mathbf{d}}\right) \\ \left(\blacktriangleright, i, \mathbf{x}_{i}, (\mathbf{x}_{\mathbf{e}})_{\mathbf{d}} \cup \mathbf{d}\right) &\text{otherwise if } \mathbf{x}_{s} = (\mathbf{x}_{\mathbf{e}})_{r} \wedge i < \mathsf{S} \\ \quad  \text{where } \mathbf{d} = \left\{\, \left(i \mapsto \mathbf{a}\right), \left(\mathbf{x}_{s} \mapsto \mathbf{s}\right) \,\right\}\\ \left(\blacktriangleright, \mathbf{x}_{i}, i^*, (\mathbf{x}_{\mathbf{e}})_{\mathbf{d}} \cup \mathbf{d}\right) &\text{otherwise} \\ \quad  \text{where } i^* = \text{check}(\mathsf{S} + (\mathbf{x}_{i} - \mathsf{S} + 42) \bmod (2^{32} - \mathsf{S} - 2^8))\\ \quad  \text{and } \mathbf{d} = \left\{\, \left(\mathbf{x}_{i} \mapsto \mathbf{a}\right), \left(\mathbf{x}_{s} \mapsto \mathbf{s}\right) \,\right\}\\ \end{cases} \\ \end{aligned}$ |
| $\Omega_U(\varrho, \varphi, \mu, \left(\mathbf{x}, \mathbf{y}\right))$ <br> `upgrade` = 20 <br> $g = \mathsf{M}_U$ | $\begin{aligned} \text{let } \left[o, g, m\right] &= \varphi_{7 \dots+ 3} \\ \text{let } c &= \begin{cases} \mu_{o \dots+ 32} &\text{if } \mathbb{N}_{o \dots+ 32} \subseteq \mathbb{V}_{\mu} \\ \nabla &\text{otherwise} \end{cases} \\ \left(\varepsilon', \varphi'_7, (\mathbf{x}'_{\mathbf{s}})_{c}, (\mathbf{x}'_{\mathbf{s}})_{g}, (\mathbf{x}'_{\mathbf{s}})_{m}\right) &\equiv \begin{cases} \left(\unicode{x21AF}, \varphi_7, (\mathbf{x}_{\mathbf{s}})_{c}, (\mathbf{x}_{\mathbf{s}})_{g}, (\mathbf{x}_{\mathbf{s}})_{m}\right) &\text{if } c = \nabla \\ \left(\blacktriangleright, \mathtt{OK}, c, g, m\right) &\text{otherwise} \\ \end{cases} \end{aligned}$ |
| $\Omega_T(\varrho, \varphi, \mu, \left(\mathbf{x}, \mathbf{y}\right))$ <br> `transfer` = 21 <br> $g = \mathsf{M}_T + t$ | $\begin{aligned} \text{let } \left[d, a, l, o\right] &= \varphi_{7 \dots+ 4},  \\ \text{let } \mathbf{d} &= (\mathbf{x}_{\mathbf{e}})_{\mathbf{d}}\\ \text{let } \mathbf{t} \in \mathbb{X} \cup \left\{\,\nabla\,\right\} &= \begin{cases} \left( s\mathrel{\unicode{x2AF6}}\mathbf{x}_{s}, d, a, m\mathrel{\unicode{x2AF6}}\mu_{o \dots+ \mathsf{W}_T}, g\mathrel{\unicode{x2AF6}} l \right) &\text{if } \mathbb{N}_{o \dots+ \mathsf{W}_T} \subseteq \mathbb{V}_{\mu} \\ \nabla &\text{otherwise} \end{cases} \\ \text{let } b &= (\mathbf{x}_{\mathbf{s}})_{b} - a \\ \text{let } \left(c, t\right) &= \begin{cases} \left(\unicode{x21AF}, 0\right) &\text{if } \mathbf{t} = \nabla \\ \left(\mathtt{WHO}, 0\right) &\text{otherwise if } d \not \in \mathcal{K}\left(\mathbf{d}\right) \\ \left(\mathtt{LOW}, 0\right) &\text{otherwise if } l < \mathbf{d}[d]_{m} \\ \left(\mathtt{CASH}, 0\right) &\text{otherwise if } b < (\mathbf{x}_{\mathbf{s}})_{t} \\ \left(\mathtt{OK}, l\right) &\text{otherwise} \end{cases} \\ \left(\varepsilon', \varphi'_7, \mathbf{x}'_{\mathbf{t}}, (\mathbf{x}'_{\mathbf{s}})_{b}\right) &\equiv \begin{cases} \left(\unicode{x21AF}, \varphi_7, \mathbf{x}_{\mathbf{t}}, (\mathbf{x}_{\mathbf{s}})_{b}\right) &\text{if } c = \unicode{x21AF} \\ \left(\blacktriangleright, c, \mathbf{x}_{\mathbf{t}}, (\mathbf{x}_{\mathbf{s}})_{b}\right) &\text{otherwise if } c \ne \mathtt{OK} \\ \left(\blacktriangleright, \mathtt{OK}, \mathbf{x}_{\mathbf{t}} \mathbin{+\!\!+} \mathbf{t}, b\right) &\text{otherwise} \end{cases} \\ \end{aligned}$ |
| $\Omega_J(\varrho, \varphi, \mu, \left(\mathbf{x}, \mathbf{y}\right), t)$ <br> `eject` = 22 <br> $g = \mathsf{M}_J$ | $\begin{aligned} \text{let } \left[d, o\right] &= \varphi_{7, 8} \\ \text{let } h &= \begin{cases} \mu_{o \dots+ 32} &\text{if } \mathbb{N}_{o \dots+ 32} \subseteq \mathbb{V}_{\mu} \\ \nabla &\text{otherwise} \end{cases} \\ \text{let } \mathbf{d} &= \begin{cases} (\mathbf{x}_{\mathbf{e}})_{\mathbf{d}}\left[d\right] &\text{if } d \ne \mathbf{x}_{s} \wedge d \in \mathcal{K}\left((\mathbf{x}_{\mathbf{e}})_{\mathbf{d}}\right) \\ \nabla &\text{otherwise} \\ \end{cases} \\ \text{let } l &= \max(81, \mathbf{d}_{o}) - 81 \\ \text{let } \mathbf{s}' &= \mathbf{x}_{\mathbf{s}} \text{ except } \mathbf{s}'_{b} = (\mathbf{x}_{\mathbf{s}})_{b} + \mathbf{d}_{b} \\ \left(\varepsilon', \varphi'_7, (\mathbf{x}'_{\mathbf{e}})_{\mathbf{d}}\right) &\equiv \begin{cases} \left(\unicode{x21AF}, \varphi_7, (\mathbf{x}_{\mathbf{e}})_{\mathbf{d}}\right) &\text{if } h = \nabla \\ \left(\blacktriangleright, \mathtt{WHO}, (\mathbf{x}_{\mathbf{e}})_{\mathbf{d}}\right) &\text{otherwise if } \mathbf{d} = \nabla \vee \mathbf{d}_{c} \ne \mathcal{E}_{32}\left(\mathbf{x}_{s}\right) \\ \left(\blacktriangleright, \mathtt{HUH}, (\mathbf{x}_{\mathbf{e}})_{\mathbf{d}}\right) &\text{otherwise if } \mathbf{d}_{i} \ne 2 \vee \left(h, l\right) \not\in \mathbf{d}_{\mathbf{l}} \\ \left(\blacktriangleright, \mathtt{OK}, (\mathbf{x}_{\mathbf{e}})_{\mathbf{d}} \setminus \left\{\,d\,\right\} \cup \left\{\, \left(\mathbf{x}_{s} \mapsto \mathbf{s}'\right) \,\right\}\right) &\text{otherwise if } \mathbf{d}_{\mathbf{l}}\left[h, l\right] = \left[x, y\right], y < t - \mathsf{D} \\ \left(\blacktriangleright, \mathtt{HUH}, (\mathbf{x}_{\mathbf{e}})_{\mathbf{d}}\right) &\text{otherwise} \\ \end{cases} \\ \end{aligned}$ |
| $\Omega_Q(\varrho, \varphi, \mu, \left(\mathbf{x}, \mathbf{y}\right))$ <br> `query` = 23 <br> $g = \mathsf{M}_Q$ | $\begin{aligned} \text{let } \left[o, z\right] &= \varphi_{7, 8} \\ \text{let } h &= \begin{cases} \mu_{o \dots+ 32} &\text{if } \mathbb{N}_{o \dots+ 32} \subseteq \mathbb{V}_{\mu} \\ \nabla &\text{otherwise} \end{cases} \\ \text{let } \mathbf{a} &= \begin{cases} (\mathbf{x}_{\mathbf{s}})_{\mathbf{l}}\left[h, z\right] &\text{if } \left(h, z\right) \in \mathcal{K}\left((\mathbf{x}_{\mathbf{s}})_{\mathbf{l}}\right)\\ \nabla &\text{otherwise}\\ \end{cases} \\ \left(\varepsilon', \varphi'_7, \varphi'_8\right) &\equiv \begin{cases} \left(\blacktriangleright, \mathtt{HUH}, \varphi_8\right) &\text{if } z \not\in \mathbb{N}_L \\ \left(\unicode{x21AF}, \varphi_7, \varphi_8\right) &\text{otherwise if } h = \nabla \\ \left(\blacktriangleright, \mathtt{NONE}, 0\right) &\text{otherwise if } \mathbf{a} = \nabla \\ \left(\blacktriangleright, 0, 0\right) &\text{otherwise if } \mathbf{a} = \left[\right] \\ \left(\blacktriangleright, 1 + 2^{32}x, 0\right) &\text{otherwise if } \mathbf{a} = \left[x\right] \\ \left(\blacktriangleright, 2 + 2^{32}x, y\right) &\text{otherwise if } \mathbf{a} = \left[x, y\right] \\ \left(\blacktriangleright, 3 + 2^{32}x, y + 2^{32}z\right) &\text{otherwise if } \mathbf{a} = \left[x, y, z\right] \\ \end{cases} \\ \end{aligned}$ |
| $\Omega_S(\varrho, \varphi, \mu, \left(\mathbf{x}, \mathbf{y}\right), t)$ <br> `solicit` = 24 <br> $g = \mathsf{M}_S$ | $\begin{aligned} \text{let } \left[o, z\right] &= \varphi_{7, 8} \\ \text{let } h &= \begin{cases} \mu_{o \dots+ 32} &\text{if } \mathbb{N}_{o \dots+ 32} \subseteq \mathbb{V}_{\mu} \\ \nabla &\text{otherwise} \end{cases} \\ \text{let } \mathbf{a} &= \begin{cases} \mathbf{x}_{\mathbf{s}} \text{ except: } &\\ \quad \mathbf{a}_{\mathbf{l}}\left[\left(h, z\right)\right] = \left[\right] &\text{if } h \ne \nabla \wedge \left(h, z\right) \not\in \mathcal{K}\left((\mathbf{x}_{\mathbf{s}})_{\mathbf{l}}\right) \\ \quad \mathbf{a}_{\mathbf{l}}\left[\left(h, z\right)\right] = (\mathbf{x}_{\mathbf{s}})_{\mathbf{l}}\left[\left(h, z\right)\right] \mathbin{+\!\!+} t &\text{if } (\mathbf{x}_{\mathbf{s}})_{\mathbf{l}}\left[\left(h, z\right)\right] = \left[x, y\right] \\ \nabla &\text{otherwise}\\ \end{cases} \\ \left(\varepsilon', \varphi'_7, \mathbf{x}'_{\mathbf{s}}\right) &\equiv \begin{cases} \left(\blacktriangleright, \mathtt{HUH}, \mathbf{x}_{\mathbf{s}}\right) &\text{if } z \not \in \mathbb{N}_L \\ \left(\unicode{x21AF}, \varphi_7, \mathbf{x}_{\mathbf{s}}\right) &\text{otherwise if } h = \nabla \\ \left(\blacktriangleright, \mathtt{HUH}, \mathbf{x}_{\mathbf{s}}\right) &\text{otherwise if } \mathbf{a} = \nabla \\ \left(\blacktriangleright, \mathtt{FULL}, \mathbf{x}_{\mathbf{s}}\right) &\text{otherwise if } \mathbf{a}_{b} < \mathbf{a}_{t} \\ \left(\blacktriangleright, \mathtt{OK}, \mathbf{a}\right) &\text{otherwise} \\ \end{cases} \\ \end{aligned}$ |
| $\Omega_F(\varrho, \varphi, \mu, \left(\mathbf{x}, \mathbf{y}\right), t)$ <br> `forget` = 25 <br> $g = \mathsf{M}_F$ | $\begin{aligned} \text{let } \left[o, z\right] &= \varphi_{7, 8} \\ \text{let } h &= \begin{cases} \mu_{o \dots+ 32} &\text{if } \mathbb{N}_{o \dots+ 32} \subseteq \mathbb{V}_{\mu} \\ \nabla &\text{otherwise} \end{cases} \\ \text{let } \mathbf{a} &= \begin{cases} \mathbf{x}_{\mathbf{s}} \text{ except:} &\\ \quad \left. \begin{aligned} \mathcal{K}\left(\mathbf{a}_{\mathbf{l}}\right) &= \mathcal{K}\left((\mathbf{x}_{\mathbf{s}})_{\mathbf{l}}\right) \setminus \left\{\,\left(h, z\right)\,\right\}\ ,\\[2pt] \mathcal{K}\left(\mathbf{a}_{\mathbf{p}}\right) &= \mathcal{K}\left((\mathbf{x}_{\mathbf{s}})_{\mathbf{p}}\right) \setminus \left\{\,h\,\right\} \end{aligned} \ \right\} &\text{if } (\mathbf{x}_{\mathbf{s}})_{\mathbf{l}}\left[h, z\right] \in \left\{\,\left[\right], \left[x, y\right]\,\right\},\ y < t - \mathsf{D} \\ \quad \mathbf{a}_{\mathbf{l}}\left[h, z\right] = \left[x, t\right] &\text{if } (\mathbf{x}_{\mathbf{s}})_{\mathbf{l}}\left[h, z\right] = \left[x\right] \\ \quad \mathbf{a}_{\mathbf{l}}\left[h, z\right] = \left[w, t\right] &\text{if } (\mathbf{x}_{\mathbf{s}})_{\mathbf{l}}\left[h, z\right] = \left[x, y, w\right],\ y < t - \mathsf{D} \\ \nabla &\text{otherwise}\\ \end{cases} \\ \left(\varepsilon', \varphi'_7, \mathbf{x}'_{\mathbf{s}}\right) &\equiv \begin{cases} \left(\blacktriangleright, \mathtt{HUH}, \mathbf{x}_{\mathbf{s}}\right) &\text{if } z \not \in \mathbb{N}_L \\ \left(\unicode{x21AF}, \varphi_7, \mathbf{x}_{\mathbf{s}}\right) &\text{otherwise if } h = \nabla \\ \left(\blacktriangleright, \mathtt{HUH}, \mathbf{x}_{\mathbf{s}}\right) &\text{otherwise if } \mathbf{a} = \nabla \\ \left(\blacktriangleright, \mathtt{OK}, \mathbf{a}\right) &\text{otherwise} \\ \end{cases} \\ \end{aligned}$ |
| $\Omega_{\unicode{x2649}}(\varrho, \varphi, \mu, \left(\mathbf{x}, \mathbf{y}\right))$ <br> `yield` = 26 <br> $g = \mathsf{M}_{\unicode{x2649}}$ | $\begin{aligned} \text{let } o &= \varphi_7 \\ \text{let } h &= \begin{cases} \mu_{o \dots+ 32} &\text{if } \mathbb{N}_{o \dots+ 32} \subseteq \mathbb{V}_{\mu} \\ \nabla &\text{otherwise} \end{cases} \\ \left(\varepsilon', \varphi'_7, \mathbf{x}'_{y}\right) &\equiv \begin{cases} \left(\unicode{x21AF}, \varphi_7, \mathbf{x}_{y}\right) &\text{if } h = \nabla \\ \left(\blacktriangleright, \mathtt{OK}, h\right) &\text{otherwise} \\ \end{cases} \\ \end{aligned}$ |
| $\Omega_{\unicode{x2648}}(\varrho, \varphi, \mu, \left(\mathbf{x}, \mathbf{y}\right))$ <br> `provide` = 27 <br> $g = \mathsf{M}_{\unicode{x2648},c} + \mathcal{G}(\mathsf{M}_{\unicode{x2648},\ell}, z)$ | $\begin{aligned} \text{let } \left[o, z\right] &= \varphi_{8, 9} \\ \text{let } \mathbf{d} &= (\mathbf{x}_{\mathbf{e}})_{\mathbf{d}}\\ \text{let } s &= \begin{cases} \mathbf{x}_{s} &\text{if } \varphi_7 = 2^{64} - 1 \\ \varphi_7 &\text{otherwise} \end{cases} \\ \text{let } \mathbf{i} &= \begin{cases} \mu_{o \dots+ z} &\text{if } \mathbb{N}_{o \dots+ z} \subseteq \mathbb{V}_{\mu} \\ \nabla &\text{otherwise} \end{cases} \\ \text{let } \mathbf{a} &= \begin{cases} \mathbf{d}[s] &\text{if } s \in \mathcal{K}\left(\mathbf{d}\right) \\ \emptyset &\text{otherwise} \end{cases} \\ \left(\varepsilon', \varphi'_7, \mathbf{x}'_{\mathbf{p}}\right) &\equiv \begin{cases} \left(\blacktriangleright, \mathtt{HUH}, \mathbf{x}_{\mathbf{p}}\right) &\text{if } z \not \in \mathbb{N}_L \\ \left(\unicode{x21AF}, \varphi_7, \mathbf{x}_{\mathbf{p}}\right) &\text{otherwise if } \mathbf{i} = \nabla \\ \left(\blacktriangleright, \mathtt{WHO}, \mathbf{x}_{\mathbf{p}}\right) &\text{otherwise if } \mathbf{a} = \emptyset \\ \left(\blacktriangleright, \mathtt{HUH}, \mathbf{x}_{\mathbf{p}}\right) &\text{otherwise if } \mathbf{a}_{\mathbf{l}}[\left(\mathcal{H}\left(\mathbf{i}\right), z\right)] \ne \left[\right] \\ \left(\blacktriangleright, \mathtt{HUH}, \mathbf{x}_{\mathbf{p}}\right) &\text{otherwise if } \left(s, \mathbf{i}\right) \in \mathbf{x}_{\mathbf{p}} \\ \left(\blacktriangleright, \mathtt{OK}, \mathbf{x}_{\mathbf{p}} \cup \left\{\,\left(s, \mathbf{i}\right)\,\right\}\right) &\text{otherwise} \\ \end{cases} \\ \end{aligned}$ |

<a id="gp-B-7-p5"></a>

:::

These are the calls that change the chain, and only accumulation has them. Each reads
its arguments from φ₇ on, and panics if a hash or a list it needs can't be read from
memory. Most are built in [Part 17](../17-accumulation/index.md); each section says where.

### bless (15)

**Read it aloud.** "Let m, a, v, r, o and n be phi 7 to 12; a the C assigners, 4 bytes
each, read at a; z the n always-accumulate entries, a service id and its gas in 12 bytes
each, read at o. Then: panic if either can't be read; HUH if this service isn't the
manager; WHO if m, v or r isn't a service id; otherwise OK, and the privileges become m,
a, v, r and z." Price: 422 + 20 · n.

**In plain words.** The manager hands out every privilege at once: the next manager, each
core's assigner, the delegator, the registrar, and the services that accumulate every
block for free.

**On a real value.** [17.13](../17-accumulation/13-blessing-and-designating.md)'s test, one
always-accumulate entry:

```text
privileges   manager 1, assigners [2, 3], delegator 4, registrar 5
free gas     service 6: 1,000
price        422 + 20 × 1 = 442
```

**In your client.** `bless`, [17.13](../17-accumulation/13-blessing-and-designating.md#the-code).
The 0.8.0 paper answers HUH to anyone but the manager; the test vectors follow a later
change, and 17.13 says so.

### assign (16)

**Read it aloud.** "Let c, o and a be phi 7 to 9; q the Q hashes, 32 bytes each, read at
o. Then: panic if they can't be read; CORE if c is no core; HUH if this service isn't
core c's assigner; WHO if a isn't a service id; otherwise OK, core c's queue becomes q and
its assigner a." Price: 1,818.

**In plain words.** A core's assigner replaces the core's authorizer queue, all 80 hashes
([13.1](../13-authorization/01-the-authorizer-pools.md)), and names the core's next
assigner.

**On a real value.** [17.5](../17-accumulation/05-privileges.md)'s test: service 0, core
0's assigner, hands it to service 1. φ₇ = OK, 10,000 − 1,818 = 8,182 gas left, and core
0's assigner is 1.

**In your client.** `assign`, [17.5](../17-accumulation/05-privileges.md#the-code).

### designate (17)

**Read it aloud.** "Let o and z be phi 7 and 8; v the z validator keys, 336 bytes each,
read at o. Then: panic if they can't be read; HUH if z isn't an allowed number of
validators, or this service isn't the delegator; otherwise OK, and the staging set
becomes v."
Price: 1,100 + 302 · z.

**In plain words.** The delegator picks the keys of the next validators: one 336-byte set
of keys for each validator.

**On a real value.** On tiny, V = 6: [17.13](../17-accumulation/13-blessing-and-designating.md)'s
test designates 6, for 1,100 + 6 × 302 = 2,912 gas, and 3 is HUH.

**In your client.** `designate`, [17.13](../17-accumulation/13-blessing-and-designating.md#the-code).

### checkpoint (18)

**Read it aloud.** "Y prime is defined as x. Phi prime 7 is defined as rho prime." Price:
103.

**In plain words.** Copy everything done so far into 𝐲, so a panic later keeps it. The
only call that ever changes 𝐲.

**On a real value.** [16.6](./06-checkpoints.md)'s test: write `last`, checkpoint, write
`ast`, panic. C keeps 𝐲, so only `last` survives; φ₇ was 9,897 after the checkpoint.

**In your client.** `checkpoint` and `collapse`, [16.6](./06-checkpoints.md#the-code).

### new (19)

**Read it aloud.** "Let o, l, g, m, f and i be phi 7 to 12; c the 32-byte code hash at o,
if it can be read and l fits in 32 bits; a the new account: code hash c, no storage, one
request for c of length l, a balance of its own minimum, gases g and m, created now, f
gratis, parent this service; s this service, less a's balance. Then: panic if c can't be
read; HUH if f isn't 0 and this isn't the manager; CASH if s would fall below its own
minimum; FULL if the registrar asks for a taken id i below S; i, if the registrar asks for
an id below S; otherwise the next free id, and the next free id moves on by 42, checked."
Price: 3,855.

**In plain words.** A service creates another and pays its deposit. The new one starts by
asking for its own code, so a block must provide that code before it can run.

**On a real value.** [17.8](../17-accumulation/08-creating-a-service.md)'s test, a 20-byte
code:

```text
new id       70,000                  the run's next free id
its balance  100 + 2 × 10 + (81 + 20) = 221, paid by the creator: 1,000 → 779
next id      70,042                  42 further on
```

**In your client.** `newService` and `newIds`, [17.8](../17-accumulation/08-creating-a-service.md#the-code).

### upgrade (20)

**Read it aloud.** "Let o, g and m be phi 7 to 9; c the 32 bytes at o. Then: panic if
they can't be read; otherwise OK, and this service's code hash becomes c and its least
gases g and m." Price: 1,028.

**In plain words.** A service replaces its own code, by naming a new code hash.

**On a real value.** [17.10](../17-accumulation/10-upgrading-a-service.md)'s test: new
least gases 123 and 456, φ₇ = OK, 1,028 gas.

**In your client.** `upgrade`, [17.10](../17-accumulation/10-upgrading-a-service.md#the-code).

### transfer (21)

**Read it aloud.** "Let d, a, l and o be phi 7 to 10; t the transfer from this service to
d, of a, with the 128-byte memo at o and l gas; b this service's balance less a. Then
panic if the memo can't be read; WHO if d isn't a service; LOW if l is less than d's least
memo gas; CASH if b would fall below this service's minimum balance; otherwise OK, t joins
the transfers, and the balance becomes b." Price: 575 + t, where t is l on success, and 0
otherwise.

**In plain words.** Send money, and gas for the receiver to run on, to another service.
The money leaves now; the receiver gets it in its own accumulation, later
([17.4](../17-accumulation/04-rounds.md)).

**On a real value.** [17.3](../17-accumulation/03-sending-a-transfer.md)'s test: 30 from a
balance of 1,000, with 25 gas.

```text
price     575 + 25 = 600; 10,000 → 9,400
balance   1,000 − 30 = 970, at once
```

**In your client.** `transfer`, [17.3](../17-accumulation/03-sending-a-transfer.md#the-code).

### eject (22)

**Read it aloud.** "Let d and o be phi 7 and 8; h the 32 bytes at o; d the account d, if
it isn't this service. Then: panic if h can't be read; WHO if there's no such other
account, or its code hash isn't this service's id; HUH if it doesn't hold exactly 2 items,
or no request for h; OK, d removed and its balance added to this service's, if that
request was forgotten more than D slots ago; otherwise HUH." Price: 458.

**In plain words.** A service that has given up on itself names its ejector in its code
hash, and the ejector removes it and takes its balance, once its last preimage has
expired.

**On a real value.** [17.7](../17-accumulation/07-ejecting-a-service.md)'s test: service 0
ejects service 1. Both had 1,000; now service 0 has 2,000 and service 1 is gone.

**In your client.** `eject`, [17.7](../17-accumulation/07-ejecting-a-service.md#the-code).

### query (23), solicit (24) and forget (25)

**Read it aloud.** All three: "let o and z be phi 7 and 8; h the 32 bytes at o; HUH if z
doesn't fit in 32 bits; panic if h can't be read." Then `query`: "NONE if there's no
request for h and z; else phi 7 is the number of slots plus 2 to the 32 times the first,
and phi 8 the second plus 2 to the 32 times the third." `solicit`: "a new request starts
empty; one with two slots gets t added; anything else HUH; FULL if the balance can't
cover it; otherwise OK." `forget`: "an empty request, or one forgotten more than D slots
ago, goes with its preimage; one slot x becomes x, t; three slots x, y, w with y old
enough become w, t; anything else HUH; otherwise OK." Prices: 643, 2,193 and 3,250.

**In plain words.** A request's short history of slots, built in
[16.9](./09-asking-for-preimages.md): `solicit` asks, `query` looks, `forget` gives up.

**On a real value.** [16.9](./09-asking-for-preimages.md)'s tests, with D = 32 on tiny:

```text
solicit (h, 100) at slot 7    a new request: []                 OK
                              items 2 → 4, bytes 50 → 50 + 81 + 100 = 231
the test sets it to [3]       provided at slot 3
forget at slot 9              [3] → [3, 9]                      OK
query                         φ₇ = 2 + 3 × 2^32 = 12,884,901,890, φ₈ = 9
```

**In your client.** `query`, `solicit` and `forget`, [16.9](./09-asking-for-preimages.md#the-code).

### yield (26)

**Read it aloud.** "Let o be phi 7; h the 32 bytes at o. Then: panic if they can't be
read; otherwise OK, and the yield becomes h." Price: 98.

**In plain words.** A service names one hash as its answer to the outside world. A halt
with exactly 32 bytes of output does the same, and wins, as (B.13) says.

**On a real value.** `always_accumulate-1`: service 1729 yields nothing, and the vector's
`output`, the root of every yield, is 32 zero bytes.

**In your client.** `yieldHash` and `collapseYield`,
[17.11](../17-accumulation/11-what-a-service-yields.md#the-code).

### provide (27)

**Read it aloud.** "Let o and z be phi 8 and 9; s this service if phi 7 is 2 to the 64
minus 1, else phi 7; i the z bytes at o. Then: HUH if z doesn't fit in 32 bits; panic if
i can't be read; WHO if s isn't a service; HUH if s's request for i's hash and length
isn't waiting, empty; HUH if this run already provided it; otherwise OK, and the pair s,
i joins the provisions." Price: 3,980 + 𝒢(2,264, z).

**In plain words.** A service hands any service a preimage that service has asked for.
It arrives at the end of the round.

**On a real value.** [17.12](../17-accumulation/12-providing-a-preimage.md)'s test:
service 0 provides service 1729's 8-byte "preimage" at slot 44.

```text
price     3,980 + 𝒢(2,264, 8) = 3,980 + 18 = 3,998     2,264 × 8 = 18,112; / 1,024 = 17.7…
request   [] → [44] at the end of the round
```

**In your client.** `provide` and `applyProvisions`,
[17.12](../17-accumulation/12-providing-a-preimage.md#the-code).

## Say it in one breath

The protocol runs code three ways (Appendix B): Ψ_I runs an authorizer and Ψ_R refines a
work-item, both in-core, on the guarantors (B.1 to B.6); Ψ_A accumulates a service, on
every validator, your client included (B.9). Ψ_A credits incoming money, runs the code
from instruction 5 with two copies of a context 𝕃 (B.7), answers its host calls with F
(B.11), and keeps 𝐱 on a halt or 𝐲, the last checkpoint, on a panic (B.13). Every host
call pays first and changes only what its row says (B.15, B.20), charges 𝒢 per 1,024
bytes it moves (B.17), and answers in φ₇: a length, OK, or one of B.1's "no"s.
