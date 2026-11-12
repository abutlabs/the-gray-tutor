# The machine

**In one sentence:** the PVM is thirteen boxes for numbers and a finger on the program,
and it runs one instruction at a time until the program finishes or crashes.

Here are three tiny programs. Press **step** and watch the counter move and a register
light up. One program finishes well and two crash: find the instruction that does it.

<a id="try-it"></a>

<PvmStepper />

## The idea

Lessons [15.1](./01-the-program-blob.md) and [15.2](./02-instructions.md) read a program.
This one runs it. What does a computer need, to run a list of instructions?

Very little. It needs somewhere to keep the numbers it is working on: the PVM has
13 [*registers*](../glossary.md#register), each a box that holds one 64-bit number. And it
needs to know where it is in the program: one counter, like a finger on a recipe. To take
a step, do the instruction under the finger, then move the finger to the next one. That is
the whole machine.

A jump moves the finger somewhere else, and here the machine is strict. The code is cut
into [*basic blocks*](../glossary.md#basic-block): runs of instructions with one way in,
at the top, and one way out, at the bottom. A jump may land only on the top of a block.
Anywhere else, and the machine [*panics*](../glossary.md#panic): a crash. A program that
finishes on purpose [*halts*](../glossary.md#halt), by jumping to one special address.

This lesson builds the machine and its first seventeen instructions, enough to run a
loop. Memory comes [next lesson](./04-memory.md), and gas at the end of the Part
(lessons [15.9](./09-what-instructions-cost.md) to [15.11](./11-the-gas-meter.md)).

## What the Gray Paper says

Appendix A.1 opens with the machine itself, Ψ, and with deblob, which cuts a program blob
into the three parts of [lesson 15.1](./01-the-program-blob.md):

::: gray-paper A.1

#### Appendix A.1 Basic Definition {#gp-A-1}

<a id="gp-A-1-p1"></a>We declare the general PVM function $\Psi$. We assume a single-step <abbr class="gp-term" title="one run of code in the PVM: Is-Authorized, refine or accumulate">invocation</abbr> function define $\Psi_1$ and define the full PVM recursively as a sequence of such mutations up until the single-step mutation results in a halting condition. We additionally define the function $\text{deblob}$ which extracts the instruction data, <abbr class="gp-term" title="one bit per byte of code, marking the bytes where an instruction starts">opcode bitmask</abbr> and <abbr class="gp-term" title="the list of places a computed jump may land; an address picks an entry">dynamic jump table</abbr> from a PVM program blob, validates its structure, and verifies whether the given $\imath$ is a valid instruction counter location within the program:

<a id="gp-A-1-p2"></a><a id="eq-A-1"></a><a id="eq-A-2"></a>

$$
\begin{align}
\Psi&\colon \left\{ \begin{aligned}
\!\left\lgroup\mathbb{B}_{}, \mathbb{N}_R, \mathbb{N}_G, {\left\{\,\bot, \top\,\right\}}, \left[\!\left[\mathbb{N}_R\right]\!\right]_{13}, \mathbb{M}\right\rgroup\! &\to \!\left\lgroup\left\{\,\blacksquare, \unicode{x21AF}, \infty\,\right\} \cup \left\{\,\unicode{x2132}, \hbar\,\right\} \times \mathbb{N}_R, \mathbb{N}_R, \mathbb{N}_G, {\left\{\,\bot, \top\,\right\}}, \left[\!\left[\mathbb{N}_R\right]\!\right]_{13}, \mathbb{M}\right\rgroup\!\\
\left(\mathfrak{p}, \imath, \varrho, \tilde{\varrho}, \varphi, {\mu}\right) &\mapsto \begin{cases}
\Psi(\mathfrak{p}, \imath', \varrho', \tilde{\varrho}', \varphi', {\mu}') &\text{if } \varepsilon = \blacktriangleright\\
\left(\varepsilon, 0, \varrho', \tilde{\varrho}', \varphi', {\mu}'\right) &\text{if } \varepsilon \in \left\{\, \unicode{x21AF}, \blacksquare \,\right\}\\
\left(\varepsilon, \imath, \varrho', \tilde{\varrho}', \varphi, {\mu}\right) &\text{otherwise}
\end{cases} \\
\text{where } \left(\varepsilon, \imath', \varrho', \tilde{\varrho}', \varphi', {\mu}'\right) &= \begin{cases}
\Psi_1(\mathbf{c}, \mathbf{k}, \mathbf{j}, \imath, \varrho, \tilde{\varrho}, \varphi, {\mu}) &\text{if } \left(\mathbf{c}, \mathbf{k}, \mathbf{j}\right) = \text{deblob}(\mathfrak{p}, \imath) \\
\left(\unicode{x21AF}, \imath, \varrho, \tilde{\varrho}, \varphi, {\mu}\right) &\text{otherwise}
\end{cases}
\end{aligned} \right. \tag{A.1} \\
\text{deblob}&\colon
\left\{
\begin{array}{@{}l@{}}
\begin{aligned}
(\mathbb{B}_{}, \mathbb{N}_R) &\to \!\left\lgroup\mathbb{B}_{}, \mathbb{b}_{}, \left[\!\left[\mathbb{N}_R\right]\!\right]_{}\right\rgroup\! \cup \nabla \\
(\mathfrak{p}, \imath) &\mapsto \begin{cases}
\left(\mathbf{c}, \mathbf{k}, \mathbf{j}\right) &\text{if } \exists!\,\mathbf{c}, \mathbf{k}, \mathbf{j} : \mathfrak{p} = \mathcal{E}_{}\left(\left\vert\mathbf{j}\right\vert\right) \frown \mathcal{E}_{1}\left(z\right) \frown \mathcal{E}_{}\left(\left\vert\mathbf{c}\right\vert\right) \frown \mathcal{E}_{z}\left(\mathbf{j}\right) \frown \mathcal{E}_{}\left(\mathbf{c}\right) \frown \mathcal{E}_{}\left(\mathbf{k}\right)\,,\ \mathfrak{v}_{\text{blob}}(\mathbf{c}, \mathbf{k}, 0) \land \mathfrak{v}_{\text{inst}}(\mathbf{c}, \mathbf{k}, \imath) \\
\nabla &\text{otherwise}
\end{cases} \\
\end{aligned}
\\[14pt]
\hspace{8pt}\begin{aligned}
\\[0.2pt]
\text{where } \mathfrak{v}_{\text{blob}}\colon&\left\{ \begin{aligned}
\!\left\lgroup\mathbb{B}_{}, \mathbb{b}_{}, \mathbb{N}_R\right\rgroup\! &\to {\left\{\,\bot, \top\,\right\}} \\
(\mathbf{c}, \mathbf{k}, \imath) &\mapsto \begin{cases}
\top &\text{if } \imath > 0 \land \imath = \left\vert\mathbf{k}\right\vert\\
\bot &\text{otherwise if } \imath + 1 + \text{skip}(\imath) = \left\vert\mathbf{k}\right\vert \land \mathbf{c}_\imath \not\in T\\
\mathfrak{v}_{\text{blob}}(\mathbf{c}, \mathbf{k}, \imath + 1 + \text{skip}(\imath)) &\text{otherwise if } \mathfrak{v}_{\text{inst}}(\mathbf{c}, \mathbf{k}, \imath)\\
\bot &\text{otherwise}
\end{cases}
\end{aligned} \right.\\
\mathfrak{v}_{\text{inst}}\colon&\left\{ \begin{aligned}
\!\left\lgroup\mathbb{B}_{}, \mathbb{b}_{}, \mathbb{N}_R\right\rgroup\! &\to {\left\{\,\bot, \top\,\right\}} \\
(\mathbf{c}, \mathbf{k}, \imath) &\mapsto \left\vert\mathbf{k}\right\vert = \left\vert\mathbf{c}\right\vert \land \imath < \left\vert\mathbf{k}\right\vert \land \mathbf{k}_{\imath} = 1 \land \mathbf{c}_\imath \in U
\end{aligned} \right.\\
\\[0.2pt]
&U\text{ and }T\text{ are described in sec. A.3, and \emph{skip} in eq. A.3}
\end{aligned}
\end{array}
\right.
\tag{A.2}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-Psi">$\Psi$</span> | psi (capital) | the PVM: a program, a gas limit, registers and memory in; how it stopped and what's left out |
| <span id="gk-abracegroup">$\left\{ \begin{aligned}x\end{aligned} \right.$</span> | as follows | a brace grouping lines that hold together: for a function, its type on top, then what each input becomes |
| <span id="gk-tuple">$\!\left\lgroup x\right\rgroup\!$</span> | the tuple of | a record: named fields, each with its type, like an object in JSON |
| <span id="gk-blob">[$\mathbb{B}$](../symbols.md#blobs)</span> | B, or B sub n | bytes: any run of them; 𝔹ₙ exactly n of them |
| <span id="gk-pvmreg" class="gk-wrap">$\mathbb{N}_R$</span> | N sub R | a register's value: a u64 |
| <span id="gk-gas" class="gk-wrap">$\mathbb{N}_G$</span> | N sub G | an amount of gas: a u64 |
| <span id="gk-bool">${\left\{\,\bot, \top\,\right\}}$</span> | true or false | a yes-or-no value: true (⊤) or false (⊥) |
| <span id="gk-regs">$\left[\!\left[\mathbb{N}_R\right]\!\right]_{13}$</span> | thirteen registers | a sequence of 13 register values, each a u64 |
| <span id="gk-ram" class="gk-wrap">$\mathbb{M}$</span> | M | a PVM memory: its bytes, and which pages may be read or written |
| <span id="gk-to">[$\to$](../symbols.md#to)</span> | to | what goes in, to what comes out: A → B takes an A and gives a B |
| <span id="gk-set">$\left\{\,x\,\right\}$</span> | the set of | a set: values with no order and no repeats |
| <span id="gk-halt" class="gk-wrap">$\blacksquare$</span> | halt | ∎: the program finished normally |
| <span id="gk-panic">$\unicode{x21AF}$</span> | panic | ↯: the program trapped |
| <span id="gk-oog" class="gk-wrap">$\infty$</span> | out of gas | ∞: the program ran out of gas |
| <span id="gk-cup">$\cup$</span> | union | everything in either side |
| <span id="gk-fault">$\unicode{x2132}$</span> | page fault | Ⅎ: the program touched memory it may not |
| <span id="gk-host" class="gk-wrap">$\hbar$</span> | host call | ħ: the program asked the host for something, and waits |
| <span id="gk-times">$\times$</span> | times | multiply; between sets, every pair of one from each |
| <span id="gk-pvm-blob" class="gk-wrap">$\mathfrak{p}$</span> | p (gothic) | a PVM program blob: the jump table, the code and the bitmask, packed as bytes |
| <span id="gk-imath">$\imath$</span> | i | the instruction counter: the index in the code of the instruction to run next |
| <span id="gk-gascounter" class="gk-wrap">$\varrho$</span> | rho (curly) | the gas left |
| <span id="gk-gaschargedflag" class="gk-wrap">$\tilde{\varrho}$</span> | rho tilde | the gas flag: true once the basic block the machine is in has been paid for |
| <span id="gk-registers" class="gk-wrap">$\varphi$</span> | phi (curly) | the PVM's 13 registers |
| <span id="gk-mem" class="gk-wrap">${\mu}$</span> | mu | the PVM's memory: 2^32 bytes in pages of 4,096, each page readable, writable or neither |
| <span id="gk-mapsto">$\mapsto$</span> | maps to | what a function gives back for an input: x ↦ y says x becomes y |
| <span id="gk-varepsilon">$\varepsilon$</span> | epsilon | the exit reason: how a step or a run ended, from carry on to halt, panic, out of gas, fault or host call |
| <span id="gk-continue" class="gk-wrap">$\blacktriangleright$</span> | continue | ▸: the step went normally, and the next one may run |
| <span id="gk-in">[$\in$](../symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-deblob">$\text{deblob}$</span> | deblob | cuts a program blob into its code 𝐜, bitmask 𝐤 and jump table 𝐣, checking it is well formed; ∇ if it isn't |
| <span id="gk-abracegrouptwo">$\left\{ \begin{array}{@{}l@{}} \begin{aligned} x \end{aligned} \\[14pt] \hspace{8pt}\begin{aligned} y \end{aligned} \end{array} \right.$</span> | as follows | a brace grouping lines that hold together: a function's type, what each input becomes, then its helpers below |
| <span id="gk-bitstring">$\mathbb{b}$</span> | b sub n | bits: a run of true-or-false values; a subscript is how many |
| <span id="gk-sequence">[$\left[\!\left[x\right]\!\right]$](../symbols.md#sequence)</span> | a sequence of | ⟦T⟧ is an array of T; a subscript is its length, :n at most n, n: at least n |
| <span id="gk-error" class="gk-wrap">$\nabla$</span> | error | ∇: an error result |
| <span id="gk-exists">[$\exists$](../symbols.md#exists)</span> | there exists | there is at least one value such that what follows holds |
| <span id="gk-encode">[$\mathcal{E}\left(x\right)$](../symbols.md#encode)</span> | E of | the encoding of what's in the brackets: its bytes, by Appendix C's rules |
| <span id="gk-len">$\left\vert x\right\vert$</span> | the size of | \|x\|: how many items x has, or how many bytes |
| <span id="gk-concat" class="gk-wrap">[$\frown$](../symbols.md#concat)</span> | concatenate | join: the left sequence followed by the right |
| <span id="gk-land">$\land$</span> | and | both sides are true |
| <span id="gk-top">$\top$</span> | top | true |
| <span id="gk-bot">$\bot$</span> | bottom | false, the no of a yes-or-no value |

</details>

→ [(A.1), (A.2) in plain words](./gray-paper.md#ex-A-1)

<a id="gp-A-1-p3"></a>The PVM exit reason $\varepsilon \in \left\{\,\blacksquare, \unicode{x21AF}, \infty\,\right\} \cup \left\{\,\unicode{x2132}, \hbar\,\right\} \times \mathbb{N}_R$ may be one of regular halt $\blacksquare$, panic $\unicode{x21AF}$ or out-of-gas $\infty$, or alternatively a host-call $\hbar$, in which the host-call identifier is associated, or page-fault $\unicode{x2132}$ in which case the address into RAM is associated.

<a id="gp-A-1-p4"></a>In the case of a final halt, either through panic or success, the instruction counter returned is zero. In all other cases, the return value of the instruction counter indexes the one *which caused the exit to happen* and the machine state represents the prior state of said instruction, thus ensuring *de facto* consistency. In order to continue beyond these exit cases, some environmental factor must be adjusted; for a page-fault, RAM must be changed, for a gas-underflow, more gas must be supplied and for a host-call, the instruction-counter must be incremented and the relevant host-call state-transition performed.

:::

**The state**: ı, the instruction counter (the finger), and φ, thirteen *registers* of 64 bits each. (A
curly phi: the straight ϕ of [lesson 6.2](../06-state-and-merklization/02-state-keys.md) is the authorizer queue. Memory comes in [lesson 15.4](./04-memory.md),
the gas counter and its flag in [lesson 15.11](./11-the-gas-meter.md).)

Why thirteen? A Gray Paper footnote says it: RISC-V has 16, but compiled code uses 13.
Two are reserved for the operating system and one is fixed at zero. To the machine they're
all alike. Only a program's start ([lesson 15.8](./08-a-real-program.md)) and the host calls ([Part 16](../16-host-calls/index.md)) give some of
them a job: r0 the way back, r1 the stack, r7 and up the arguments.

**Ψ** steps until ε is anything but ▸: it runs one step, Ψ₁, and if that says carry on,
runs Ψ again on what came out. deblob checks the blob as it cuts: every instruction must
have a known opcode, the last one must be a terminator (below), and ı must start an
instruction. If not, Ψ panics without running anything. When it stops, the exit reason says why:
halt or panic (and then ı comes back as 0), out of gas, a page fault with its address, or
a host call with its number. For the last three, ı stays *on* the instruction that
stopped it, so whoever runs the machine can fix things and carry on.

Then A.3, the basic blocks:

::: gray-paper A.3

#### Appendix A.3 Basic Blocks and Termination Instructions {#gp-A-3}

<a id="gp-A-3-p1"></a>Instructions of the following opcodes are considered basic-block termination instructions; other than $\texttt{trap}$ &amp; $\texttt{fallthrough}$, they correspond to instructions which may define the instruction-counter to be something other than its prior value plus the instruction's skip amount:

<a id="gp-A-3-p2"></a>

- Trap and fallthrough: $\texttt{trap}$ , $\texttt{fallthrough}$
- Jumps: $\texttt{jump}$ , $\texttt{jump\_ind}$
- Load-and-Jumps: $\texttt{load\_imm\_jump}$ , $\texttt{load\_imm\_jump\_ind}$
- Branches: $\texttt{branch\_eq}$ , $\texttt{branch\_ne}$ , $\texttt{branch\_ge\_u}$ , $\texttt{branch\_ge\_s}$ , $\texttt{branch\_lt\_u}$ , $\texttt{branch\_lt\_s}$ , $\texttt{branch\_eq\_imm}$ , $\texttt{branch\_ne\_imm}$
- Immediate branches: $\texttt{branch\_lt\_u\_imm}$ , $\texttt{branch\_lt\_s\_imm}$ , $\texttt{branch\_le\_u\_imm}$ , $\texttt{branch\_le\_s\_imm}$ , $\texttt{branch\_ge\_u\_imm}$ , $\texttt{branch\_ge\_s\_imm}$ , $\texttt{branch\_gt\_u\_imm}$ , $\texttt{branch\_gt\_s\_imm}$

<a id="gp-A-3-p3"></a>We denote this set, as opcode indices rather than names, as $T$, which is a subset of all valid opcode indices $U$. We define the instruction opcode indices denoting the beginning of basic-blocks as $\varpi$:

<a id="gp-A-3-p4"></a><a id="eq-A-5"></a>

$$
\begin{equation}
\varpi \equiv \left(\left\{\,0\,\right\} \cup \left\{\,n + 1 + \text{skip}(n) \;\middle\vert\; n \in \mathbb{N}_{\left\vert\mathbf{c}\right\vert} \wedge \mathbf{k}_{n} = 1 \wedge \mathbf{c}_{n} \in T\,\right\}\right) \cap \left\{\,n \;\middle\vert\; \mathbf{k}_{n} = 1 \wedge \mathbf{c}_{n} \in U\,\right\} \tag{A.5}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-basicblocks" class="gk-wrap">$\varpi$</span> | pi (curly) | where basic blocks start: at 0, and just after every terminator |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-build">$\left\{ x \;\middle\vert\; y \right\}$</span> | for each, such that | built by a rule: the left-hand value, for every case the right-hand side allows (a set, or a sequence in order) |
| <span id="gk-Fskip">$\text{skip}$</span> | skip | skip(i): how many bytes follow the opcode at i before the next opcode, at most 24 |
| <span id="gk-Nmax">[$\mathbb{N}_{x}$](../symbols.md#naturals)</span> | N sub n | the whole numbers below n: ℕ_C is a core index, 0 to C − 1 |
| <span id="gk-wedge">$\wedge$</span> | and | both sides are true |
| <span id="gk-cap">$\cap$</span> | intersection | only what's in both sides |

</details>

→ [(A.5) in plain words](./gray-paper.md#ex-A-5)

<a id="gp-A-3-p5"></a>For convenience we will define function $\mathfrak{L}$ which represents the start of a <abbr class="gp-term" title="a run of instructions with one way in; a jump may only land at its start">basic block</abbr> for any $\imath$ within that basic block. Formally:

<a id="gp-A-3-p6"></a><a id="eq-A-6"></a>

$$
\begin{equation}
\mathfrak{L}\colon \left\{ \begin{aligned}
\mathbb{N}_R &\to \mathbb{N}_R\\
\imath &\mapsto \max(j \in \varpi : j \le \imath)
\end{aligned} \right. \tag{A.6}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-startofbasicblock" class="gk-wrap">$\mathfrak{L}$</span> | L (gothic) | 𝔏(ı): the start of the basic block that ı is in |
| <span id="gk-max">$\max$</span> | max of | the largest of the values in the brackets |
| <span id="gk-le">$\le$</span> | at most | less than or equal to |

</details>

→ [(A.6) in plain words](./gray-paper.md#ex-A-6)

:::

A *basic block* starts at 0, and right after every *terminator*:
`trap`, `fallthrough`, jumps and branches. Apart from `trap` and `fallthrough`, these are
the instructions that can send ı somewhere other than the next instruction. ϖ is the set
of block starts, and 𝔏(ı) the start of the block ı is in ([lesson
15.11](./11-the-gas-meter.md) charges gas by it).

A.4 gives one step, Ψ₁, and what an instruction does unless its row says otherwise:

::: gray-paper A.4 1-2

#### Appendix A.4 Single-Step State Transition {#gp-A-4}

<a id="gp-A-4-p1"></a>We must now define the single-step PVM state-transition function $\Psi_1$:

<a id="gp-A-4-p2"></a><a id="eq-A-7"></a>

$$
\begin{equation}
\Psi_1\colon \left\{ \begin{aligned}
\!\left\lgroup\mathbb{B}_{}, \mathbb{b}_{}, \left[\!\left[\mathbb{N}_R\right]\!\right]_{}, \mathbb{N}_R, \mathbb{N}_G, {\left\{\,\bot, \top\,\right\}}, \left[\!\left[\mathbb{N}_R\right]\!\right]_{13}, \mathbb{M}\right\rgroup\! &\to \!\left\lgroup\left\{\,\unicode{x21AF}, \blacksquare, \blacktriangleright \,\right\} \cup \left\{\,\unicode{x2132}, \hbar\,\right\} \times \mathbb{N}_R, \mathbb{N}_R, \mathbb{N}_G, {\left\{\,\bot, \top\,\right\}}, \left[\!\left[\mathbb{N}_R\right]\!\right]_{13}, \mathbb{M}\right\rgroup\!\\
\left(\mathfrak{p}, \mathbf{k}, \mathbf{j}, \imath, \varrho, \tilde{\varrho}, \varphi, {\mu}\right) &\mapsto \left(\varepsilon^*, \imath^*, \varrho^*, \tilde{\varrho}^*, \varphi^*, {\mu}^*\right)
\end{aligned} \right. \tag{A.7}
\end{equation}
$$

→ [(A.7) in plain words](./gray-paper.md#ex-A-7)

:::

::: gray-paper A.4 12-13

#### Appendix A.4 Single-Step State Transition, continued

<a id="gp-A-4-p12"></a>We define $\varepsilon$ together with the <abbr class="gp-term" title="after the change: the value once it is made, written with a prime (α′); for state, after the block">posterior</abbr> values of regular execution (denoted as prime) of each of the items of the machine state as being in accordance with the table below. When transitioning machine state for an instruction, a number of conditions typically hold true and instructions are defined essentially by their exceptions to these rules. Specifically, the machine does not halt, the instruction counter increments by one and RAM &amp; registers are unchanged. Formally:

<a id="gp-A-4-p13"></a><a id="eq-A-12"></a>

$$
\begin{equation}
\varepsilon = \blacktriangleright,\quad \imath' = \imath + 1 + \text{skip}(\imath),\quad \varphi' = \varphi,\quad{\mu}' = {\mu} \text{ except as indicated } \tag{A.12}
\end{equation}
$$

→ [(A.12) in plain words](./gray-paper.md#ex-A-12)

:::

**One step, Ψ₁**: run the instruction at ı. Unless it says otherwise, an
instruction moves ı on to the next one, ı + 1 + skip(ı), changes no register or memory,
and the step ends with ε = ▸, carry on. A step can also end with *halt* (finished well)
or *panic* (finished badly).

And the three ways an instruction can move ı somewhere else:

::: gray-paper A.4 18-24

#### Appendix A.4 Single-Step State Transition, continued

<a id="gp-A-4-p18"></a>Any alterations of the program counter stemming from an unconditional static jump must be to the start of a basic block or else a panic occurs. Formally:

<a id="gp-A-4-p19"></a><a id="eq-A-20"></a>

$$
\begin{equation}
\texttt{sjump}(b) \implies \left(\varepsilon, \imath'\right) = \begin{cases}
\left(\unicode{x21AF}, \imath\right) &\text{if } b \not\in \varpi \\
\left(\blacktriangleright, b\right) &\text{otherwise}
\end{cases} \tag{A.20}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-token">$\texttt{x}$</span> | the string | a name in typewriter type: an instruction's or helper's name, or fixed bytes written as text: the ASCII bytes of its words; the dollar sign in front only marks them as text and is not one of the bytes |
| <span id="gk-implies">$\implies$</span> | means that | if the left side holds, everything on the right must hold too |

</details>

→ [(A.20) in plain words](./gray-paper.md#ex-A-20)

<a id="gp-A-4-p20"></a>Similarly, conditional jumps are valid if and only if both branches point to the start of a basic block (regardless of whether a branch is taken), otherwise a panic occurs:

<a id="gp-A-4-p21"></a><a id="eq-A-21"></a>

$$
\begin{equation}
\texttt{branch}(b, C) \implies \left(\varepsilon, \imath'\right) = \begin{cases}
\left(\unicode{x21AF}, \imath\right) &\text{if } b \not\in \varpi \lor \imath + 1 + \text{skip}(\imath) \not\in \varpi \\
\left(\blacktriangleright, \imath + 1 + \text{skip}(\imath)\right) &\text{otherwise if } \lnot C \\
\left(\blacktriangleright, b\right) &\text{otherwise}
\end{cases} \tag{A.21}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-lor">$\lor$</span> | or | at least one side is true |
| <span id="gk-lnot">$\lnot$</span> | not | the opposite: true becomes false, a bit 1 becomes 0 |

</details>

→ [(A.21) in plain words](./gray-paper.md#ex-A-21)

<a id="gp-A-4-p22"></a>Jumps whose next instruction is dynamically computed must use an address which may be indexed into the jump-table $\mathbf{j}$. Through a quirk of tooling<sup>1</sup>, we define the dynamic address required by the instructions as the jump table index incremented by one and then multiplied by our jump alignment factor $\mathsf{Z}_A = 2$.

<small class="gp-note"><sup>1</sup> The popular code generation backend LLVM requires and assumes in its code generation that dynamically computed jump destinations always have a certain memory alignment. Since at present we depend on this for our tooling, we must acquiesce to its assumptions.</small>

<a id="gp-A-4-p23"></a>As with other irregular alterations to the program counter, target code index must be the start of a basic block or else a panic occurs. Formally:

<a id="gp-A-4-p24"></a><a id="eq-A-22"></a>

$$
\begin{equation}
\texttt{djump}(a) \implies \left(\varepsilon, \imath'\right) = \begin{cases}
\left(\blacksquare, \imath\right) &\text{if } a = 2^{32} - 2^{16}\\
\left(\unicode{x21AF}, \imath\right) &\text{otherwise if } a = 0 \vee a > \left\vert\mathbf{j}\right\vert\cdot\mathsf{Z}_A \vee a \bmod \mathsf{Z}_A \ne 0 \vee \mathbf{j}_{({}^{a}\!/_{\mathsf{Z}_A}) - 1} \not\in \varpi \\
(\blacktriangleright, \mathbf{j}_{({}^{a}\!/_{\mathsf{Z}_A}) - 1}) &\text{otherwise}
\end{cases} \tag{A.22}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-vee">$\vee$</span> | or | at least one side is true |
| <span id="gk-cdot">$\cdot$</span> | times | multiply |
| <span id="gk-Cpvmdynaddralign" class="gk-wrap">$\mathsf{Z}_A$</span> | Z sub A | the jump alignment, 2: a dynamic jump's address is (its jump table index + 1) × 2 |
| <span id="gk-bmod">[$\bmod$](../symbols.md#mod)</span> | mod | the remainder after dividing: 14 mod 4 is 2 |
| <span id="gk-ne">$\ne$</span> | is not | not equal |
| <span id="gk-nicefrac">${}^{x}\!/_{y}$</span> | over | a fraction: the top divided by the bottom |

</details>

→ [(A.22) in plain words](./gray-paper.md#ex-A-22)

:::

The rule that matters: **a jump or branch may only land at the start of a
basic block**, or the machine panics. A branch checks *both* places it might go, its
target and the next instruction, whether it's taken or not.

**Halting**: `jump_ind` jumps through the jump table by address, and one address is
special: 2^32 − 2^16. Jumping there halts the machine. It's also where r0 points when a
program starts (r0 is the return address), so when the outermost function returns,
the machine stops. Any other address a is (index + 1) × 2: 2 is the table's first entry,
4 its second, and 0 or an odd number panics.

The tables' rows for three of this lesson's instructions (the rest are quoted in the
lessons that finish their families):

::: gray-paper A.5.1

#### Appendix A.5.1 Instructions without Arguments {#gp-A-5-1}

<a id="gp-A-5-1-p1"></a>

| $\zeta_\imath$ | **Name** | **Mutations** |
| --- | --- | --- |
| 0 | `trap` | $\varepsilon = \unicode{x21AF}$ |
| 1 | `fallthrough` | $\texttt{sjump}(\imath + 1 + \text{skip}(\imath))$ |
| 2 | `unlikely` |  |

:::

::: gray-paper A.5.3 2-2

#### Appendix A.5.3 Instructions with Arguments of One Register and One Extended Width Immediate, continued

<a id="gp-A-5-3-p2"></a>

| $\zeta_\imath$ | **Name** | **Mutations** |
| --- | --- | --- |
| 20 | `load_imm_64` | ${\varphi}'_A = \nu_X$ |

:::

::: gray-paper A.5.5 2-2

#### Appendix A.5.5 Instructions with Arguments of One Offset, continued

<a id="gp-A-5-5-p2"></a>

| $\zeta_\imath$ | **Name** | **Mutations** |
| --- | --- | --- |
| 40 | `jump` | $\texttt{sjump}(\nu_X)$ |

:::

This lesson's instructions, from the tables: `trap` (panic), `fallthrough`, `jump`,
`jump_ind`, `load_imm`, `load_imm_64`, `move_reg`, `add_imm_64`, `add_64`, `sub_64`,
`and`, `or`, `xor`, `branch_eq`, `branch_ne`, `branch_eq_imm` and `branch_ne_imm`.
Arithmetic wraps around at 2^64.

Now step the three programs [at the top](#try-it) again. They are this lesson's tests.
The loop adds 10 + 9 + … + 1 into r2: ı moves on by 1 + skip(ı), and ε stays ▸ until the
return halts the machine. The loop without its `fallthrough`, and a jump into the middle,
both panic: each lands where no basic block starts. Each line's first number is its opcode
in decimal, as the Gray Paper's table numbers it (51 is `load_imm`). The bytes after it
are hex, as in the code below.

**Try it in the [playground](../pvm-playground.md).** Press **A branch and a loop**, then **Step** until the loop comes round. Then open **Edit this program**, delete the `fallthrough` line, press **Assemble and reset**, and press **Run**: the branch panics.

## The tests

**New file** `test/machine.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { HALT_ADDRESS, newMachine, run, step } from "../src/pvm/machine.ts";
import { assemble } from "../src/pvm/program.ts";
import type { Exit, Machine } from "../src/pvm/machine.ts";
import type { Program } from "../src/pvm/program.ts";

/** Adds 10 + 9 + … + 1 into r2, then returns through r0. */
const SUM = assemble([
  [51, 0x02], //               0: load_imm r2, 0
  [51, 0x03, 10], //           2: load_imm r3, 10
  [1], //                      5: fallthrough: the loop must start a basic block
  [200, 0x32, 0x02], //        6: add_64 r2 = r2 + r3
  [149, 0x33, 0xff], //        9: add_imm_64 r3 = r3 + (−1)
  [82, 0x03, 0xfa], //        12: branch_ne_imm r3, 0, back 6 bytes to 6
  [50, 0x00], //              15: jump_ind r0 + 0: return
]);

test("a loop adds 10 + 9 + … + 1, and returning through r0 halts", () => {
  const machine: Machine = newMachine(SUM, [HALT_ADDRESS]);
  const exit: Exit = run(machine);
  assert.equal(exit, "halt");
  assert.equal(machine.registers[2], 55n);
  assert.equal(machine.registers[3], 0n);
});

test("a jump must land at the start of a basic block, or the machine panics", () => {
  const toTheStart: Machine = newMachine(assemble([[51, 0x02, 1], [40, 0xfd]])); // jumps to 0
  const twoSteps: Exit[] = [step(toTheStart), step(toTheStart)];
  assert.deepEqual(twoSteps, ["continue", "continue"]);
  assert.equal(toTheStart.pc, 0); // 0 always starts a block
  const program: Program = assemble([[51, 0x02, 1], [51, 0x03, 2], [40, 0xfd]]); // jumps to 3
  const intoTheMiddle: Machine = newMachine(program);
  const steps: Exit[] = [step(intoTheMiddle), step(intoTheMiddle), step(intoTheMiddle)];
  assert.deepEqual(steps, ["continue", "continue", "panic"]); // 3 follows a load_imm
});

test("trap panics; jump_ind to anything else than the halt address, without a table, too", () => {
  const trapped: Exit = step(newMachine(assemble([[0]])));
  assert.equal(trapped, "panic");
  const jumped: Exit = run(newMachine(assemble([[50, 0x00]]), [8n])); // r0 = 8, no table
  assert.equal(jumped, "panic");
});
```

`SUM` is seven instructions you can read from the comments, and [lesson
15.2](./02-instructions.md)'s layouts tell you each byte. `0x32` packs two registers, r2 and r3. `0xff` is −1,
sign-extended. `0xfa` is −6, the jump back. Look at the `fallthrough` at 5. It does
nothing but end a basic block, so that 6, where the loop starts, *begins* one. Without
it the branch back to 6 would panic.

## The code

A tiny assembler first, for programs written by hand:

**Add to** `src/pvm/program.ts`

```ts
/** A tiny assembler for hand-written programs: each array is one instruction's bytes. */
export function assemble(instructions: number[][]): Program {
  const code = Uint8Array.from(instructions.flat());
  const bitmask = new Uint8Array(Math.ceil(code.length / 8));
  let at = 0;
  for (const instruction of instructions) {
    bitmask[Math.floor(at / 8)] |= 1 << at % 8; // this byte starts an instruction
    at += instruction.length;
  }
  return { jumpTable: [], code, bitmask };
}
```

**New file** `src/pvm/machine.ts`

```ts
// The machine (GP App. A): thirteen 64-bit registers and an instruction counter, stepping
// through a program one instruction at a time. Memory and gas come in later lessons.

import type { Instruction } from "./instructions.ts";
import { decodeInstruction, opcodeInfo, skip } from "./instructions.ts";
import type { Program } from "./program.ts";
import { startsInstruction } from "./program.ts";

/** How a step ends (GP's ε): carry on, finish, or fail. */
export type Exit = "continue" | "halt" | "panic";

/** The machine's state: the program, ı, and the registers φ. */
export type Machine = { program: Program; pc: number; registers: bigint[]; blocks: Set<number> };

/** T (GP App. A.3): the instructions that end a basic block. */
const TERMINATORS = new Set([0, 1, 40, 50, 80, 180, 170, 171, 172, 173, 174, 175]);
for (let opcode = 81; opcode <= 90; opcode++) TERMINATORS.add(opcode); // the immediate branches

/** ϖ (GP App. A.3): where basic blocks start, at 0 and just after every terminator. */
export function basicBlocks(program: Program): Set<number> {
  const starts = new Set<number>([0]);
  for (let i = 0; i < program.code.length; i++) {
    if (startsInstruction(program, i) && TERMINATORS.has(program.code[i])) {
      starts.add(i + 1 + skip(program, i));
    }
  }
  const valid = (n: number) => startsInstruction(program, n) && !!opcodeInfo(program.code[n]);
  return new Set([...starts].filter(valid));
}

/** A machine at instruction 0, with every register 0 unless given. */
export function newMachine(program: Program, registers: bigint[] = []): Machine {
  const all = Array.from({ length: 13 }, (_, i) => registers[i] ?? 0n);
  return { program, pc: 0, registers: all, blocks: basicBlocks(program) };
}

/** The address that halts the machine when jumped to: where r0 points at the start. */
export const HALT_ADDRESS = 2n ** 32n - 2n ** 16n;

/** Moves to b, which must start a basic block (sjump). */
function jumpTo(m: Machine, b: number): Exit {
  if (!m.blocks.has(b)) return "panic";
  m.pc = b;
  return "continue";
}

/** A branch to b if `taken`: both b and the next instruction must start basic blocks. */
function branch(m: Machine, ins: Instruction, b: number, taken: boolean): Exit {
  if (!m.blocks.has(b) || !m.blocks.has(ins.next)) return "panic";
  m.pc = taken ? b : ins.next;
  return "continue";
}

/** djump(a): through the jump table, by address a = (index + 1) · 2; HALT_ADDRESS halts. */
function jumpIndirect(m: Machine, a: bigint): Exit {
  if (a === HALT_ADDRESS) return "halt";
  const table = m.program.jumpTable;
  if (a === 0n || a > BigInt(table.length * 2) || a % 2n !== 0n) return "panic";
  return jumpTo(m, table[Number(a / 2n) - 1]);
}

/** Lesson 15.3's instructions: control flow, loading constants, and simple arithmetic. */
function basics(m: Machine, ins: Instruction): Exit | undefined {
  const [a, b, c] = ins.registers; // the GP's register letters, in its order
  const [x] = ins.immediates;
  const reg = m.registers; // φ
  switch (ins.name) {
    case "trap":
      return "panic";
    case "fallthrough":
      return jumpTo(m, ins.next);
    case "jump":
      return jumpTo(m, ins.target as number);
    case "jump_ind":
      return jumpIndirect(m, (reg[a] + x) % 2n ** 32n);
    case "load_imm":
    case "load_imm_64":
      reg[a] = x;
      return "continue";
    case "move_reg": // registers [D, A]: φ′_D = φ_A
      reg[a] = reg[b];
      return "continue";
    case "add_imm_64": // registers [A, B]: φ′_A = φ_B + ν_X
      reg[a] = (reg[b] + x) % 2n ** 64n; // registers hold 64 bits
      return "continue";
    case "add_64": // registers [A, B, D]: φ′_D = φ_A + φ_B
      reg[c] = (reg[a] + reg[b]) % 2n ** 64n;
      return "continue";
    case "sub_64":
      reg[c] = (reg[a] + 2n ** 64n - reg[b]) % 2n ** 64n;
      return "continue";
    case "and":
      reg[c] = reg[a] & reg[b];
      return "continue";
    case "or":
      reg[c] = reg[a] | reg[b];
      return "continue";
    case "xor":
      reg[c] = reg[a] ^ reg[b];
      return "continue";
    case "branch_eq":
      return branch(m, ins, ins.target as number, reg[a] === reg[b]);
    case "branch_ne":
      return branch(m, ins, ins.target as number, reg[a] !== reg[b]);
    case "branch_eq_imm":
      return branch(m, ins, ins.target as number, reg[a] === x);
    case "branch_ne_imm":
      return branch(m, ins, ins.target as number, reg[a] !== x);
    default:
      return undefined; // not one of these
  }
}

/** A family of instructions: runs the instruction if it's one of its own, else undefined. */
type Family = (m: Machine, ins: Instruction) => Exit | undefined;

/** Every family of instructions built so far. */
const FAMILIES: Family[] = [basics];

/** Ψ₁ (GP App. A.4): runs the instruction at ı. Each family has a go at it. */
export function step(m: Machine): Exit {
  const ins = decodeInstruction(m.program, m.pc);
  m.pc = ins.next; // most instructions just move on
  for (const family of FAMILIES) {
    const exit = family(m, ins);
    if (exit !== undefined) return exit;
  }
  throw new Error(`${ins.name} isn't built yet`);
}

/** Ψ, without gas yet: steps until the machine halts or panics. */
export function run(m: Machine): Exit {
  for (;;) {
    const exit = step(m);
    if (exit !== "continue") return exit;
  }
}
```

Four things to notice:

- **The machine is a plain object that `step` changes.** Most of your client works on
  values it doesn't change, but a machine is exactly a thing that changes as it runs, like
  the `Writer` and `Reader` of [lesson 2.3](../02-codec/03-writer-and-reader.md).
- **`step`** decodes the instruction ([lesson 15.2](./02-instructions.md)), moves ı on, and
  offers it to each *family* of instructions in turn. This lesson has one family,
  `basics`. Later lessons add more to `FAMILIES` without touching `step`. Inside a family,
  an instruction can override the move: a jump sets ı itself, a halt or panic stops.
- **The layout says which register is written**, as [lesson 15.2](./02-instructions.md)'s
  comments said: `add_64` writes its *third* register, `add_imm_64` its *first*.
- **An instruction not built yet throws an `Error`.** A panic is the program's fault. A
  thrown `Error` is yours.

> [!NOTE]
> **The simple road.** `step` moves ı on *before* running the instruction, so a jump that
> panics leaves ı at the next instruction, not where it was. And `run` doesn't reset ı
> after the machine stops, as the Gray Paper's Ψ does. Nothing reads ı after a stop until
> [Part 16](../16-host-calls/index.md)'s host calls, and the [hardening pass](https://github.com/abutlabs/the-gray-tutor/blob/main/HARDENING.md) puts both right.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ the reported packages: each one's hash and exports root, sorted by hash (235.9ms)
...
✔ a loop adds 10 + 9 + … + 1, and returning through r0 halts (1.3ms)
✔ a jump must land at the start of a basic block, or the machine panics (0.6ms)
...
ℹ tests 404
ℹ suites 0
ℹ pass 404
ℹ fail 0
...
reported 404 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791736334899
...
```

### Break it on purpose

Delete the `[1]` line (the `fallthrough`) from `SUM` and run the tests. The loop runs
once, r2 reaches 10, and then the branch back panics: its target, now 5, follows a
`load_imm` and starts no basic block. Put it back.

## Watch it

**New file** `bin/run.ts`

```ts
// Runs a hand-written program on your PVM, one step at a time: it adds 10 + 9 + … + 1 into
// r2, then returns through r0, which halts the machine.
// Usage: npm run run

import { decodeInstruction } from "../src/pvm/instructions.ts";
import { HALT_ADDRESS, newMachine, step } from "../src/pvm/machine.ts";
import { assemble } from "../src/pvm/program.ts";
import { Run } from "../src/obs.ts";

const SUM = assemble([
  [51, 0x02], //               0: load_imm r2, 0
  [51, 0x03, 10], //           2: load_imm r3, 10
  [1], //                      5: fallthrough
  [200, 0x32, 0x02], //        6: add_64 r2 = r2 + r3
  [149, 0x33, 0xff], //        9: add_imm_64 r3 = r3 + (−1)
  [82, 0x03, 0xfa], //        12: branch_ne_imm r3, 0, back to 6
  [50, 0x00], //              15: jump_ind r0 + 0
]);

const machine = newMachine(SUM, [HALT_ADDRESS]);
const run = new Run("run");
for (let n = 1; ; n++) {
  const at = machine.pc;
  const { name } = decodeInstruction(SUM, at);
  const before = [...machine.registers];
  const exit = step(machine);
  const changed = machine.registers.flatMap((v, r) => (v !== before[r] ? [`r${r} = ${v}`] : []));
  const where = `step ${String(n).padStart(2)}  at ${String(at).padStart(2)}`;
  console.log(`${where}  ${name.padEnd(14)} ${changed.join(", ")}`);
  run.event("step", { n, at, name, changed: changed.join(", "), exit });
  if (exit !== "continue") {
    console.log(`the machine stops: ${exit}, with r2 = ${machine.registers[2]}`);
    break;
  }
}
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

What flows through it (no file goes in this time: the program is written in the bin
itself):

::: code-group

```text [what goes in]
the SUM program, seven hand-assembled instructions:
  [51, 0x02]         0: load_imm r2, 0
  [51, 0x03, 10]     2: load_imm r3, 10
  [1]                5: fallthrough
  [200, 0x32, 0x02]  6: add_64 r2 = r2 + r3
  [149, 0x33, 0xff]  9: add_imm_64 r3 = r3 + (-1)
  [82, 0x03, 0xfa]  12: branch_ne_imm r3, 0, back to 6
  [50, 0x00]        15: jump_ind r0 + 0
```

```ts [what it computes]
// the machine after step 7, mid-loop: the second add_64 just ran
const computed = {
  pc: 9, // add_64 at 6 finished; add_imm_64 is next
  r2: 19n, // the sum so far: 10 + 9
  r3: 9n, // the counter, on its way down to 0
  trips: 10, // the loop runs ten times, three instructions a trip
  stops: "halt", // jump_ind through r0, which held HALT_ADDRESS from the start
};
```

```text [what comes out]
step  7  at  6  add_64         r2 = 19
the machine stops: halt, with r2 = 55
```

:::

**Run**

```sh
npm pkg set scripts.run="node bin/run.ts"
npm run run
```

```text
step  1  at  0  load_imm
step  2  at  2  load_imm       r3 = 10
step  3  at  5  fallthrough
step  4  at  6  add_64         r2 = 10
step  5  at  9  add_imm_64     r3 = 9
step  6  at 12  branch_ne_imm
step  7  at  6  add_64         r2 = 19
step  8  at  9  add_imm_64     r3 = 8
step  9  at 12  branch_ne_imm
step 10  at  6  add_64         r2 = 27
...
step 33  at 12  branch_ne_imm
step 34  at 15  jump_ind
the machine stops: halt, with r2 = 55
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=run-1791736339857
```

34 steps: two loads, the fallthrough, ten trips round the loop at three instructions
each, and the return, which jumps to the halt address r0 has held from the start. Each step
shows only the registers it changed: watch r2 climb, 10, 19, 27…, to 55, and r3 count down
to 0. The *PVM run* panel, on **6 · The PVM**, has every step.

![PVM run panel](./images/03-pvm-run.png)

<details>
<summary>lasair: <code>djump_index</code>, in <code>lib/pvm.ml</code></summary>

```ocaml
let djump_index (jt : int64 array) (base : int64) (offset : int64) : int =
  let a = Int64.to_int (Int64.logand (Int64.add base offset) 0xFFFFFFFFL) in
  if a = 0xFFFF0000 then -1
  else if a = 0 || a land 1 <> 0 then -2
  else
    let idx = a / 2 - 1 in
    if idx < 0 || idx >= Array.length jt then -2 else idx
```

Your `jumpIndirect`, with two differences. The halt address is written in hex,
`0xFFFF0000`, which is exactly 2^32 − 2^16. And instead of returning "halt" or "panic",
lasair returns −1 or −2 in place of a table index: a little faster, a little harder to
read. `logand … 0xFFFFFFFFL` is the `mod 2^32`.

</details>

## Check your understanding

::: check
**`SUM` adds 10 + 9 + … + 1 into r2. What happens if you delete its `fallthrough`?**

- [ ] Nothing changes: `fallthrough` does no work
  > No: it does no arithmetic, but it ends a basic block, so that the loop's first
  > instruction starts one.
- [x] The loop runs once, r2 reaches 10, and the branch back panics
  > Yes: the loop now starts at 5, right after a `load_imm`, which ends no block. The
  > branch's target starts no basic block, so the machine panics.
- [ ] The loop never ends
  > No: the branch can't go back even once. It's checked, and fails, the first time it
  > runs.

**A sum is too big for a 64-bit register. What does the PVM do?**

- [ ] It panics: overflow is a crash
  > No: overflow is never an error on the PVM. A panic is for a `trap` or a bad jump.
- [ ] It keeps the biggest number a register can hold
  > No: nothing is capped. The sum wraps around.
- [x] It keeps the low 64 bits: arithmetic wraps around at 2^64
  > Yes: that is how adding 2^64 − 1, all ones, takes 1 away. `SUM` counts r3 down from 10
  > that way, with `add_imm_64` and −1.

**The machine stops for a page fault or a host call, and ı stays on the instruction that stopped it. Why?**

- [ ] So the program can be run again from its start
  > No: a restart would want ı at the beginning. It stays where the stop happened.
- [x] So whoever runs the machine can fix things and carry on from that instruction
  > Yes: these stops are not the end of the run. After a halt or a panic there is nothing
  > to carry on, and ı comes back as 0.
- [ ] To tell the service where its program crashed
  > No: these are not crashes. A crash is a panic, and then ı comes back as 0.

**Why does `SUM` stop with halt when it jumps through r0?**

- [ ] `jump_ind` always ends the program
  > No: through any other address it goes via the jump table. With r0 = 8 and no table,
  > the test's machine panics.
- [x] r0 holds 2^32 − 2^16, the halt address
  > Yes: the test starts r0 there, as a real program's start does, so returning from the
  > outermost function stops the machine well.
- [ ] It's the last instruction in the code
  > No: the machine stops because of where it jumps, not where the code ends. Past the end
  > the code reads as zeros, which is `trap`: a panic.

**A branch is not taken. Must its target still start a basic block?**

- [ ] No: only the place it actually goes is checked
  > No: the Gray Paper checks both places, whichever way the branch goes.
- [ ] Only if the target is behind it
  > No: direction doesn't come into it. A forward target is checked just the same.
- [x] Yes: the target and the next instruction must both start basic blocks
  > Yes: a branch with a bad target panics even on a run where it wouldn't jump.
:::

## What you have

A running PVM: registers, an instruction counter, seventeen instructions, basic blocks,
and the two ways a program ends. Everything so far lives in registers, and a real
program needs more room than 13 numbers: [lesson 15.4](./04-memory.md) gives the machine memory.

Next: [15.4 Memory](./04-memory.md)
