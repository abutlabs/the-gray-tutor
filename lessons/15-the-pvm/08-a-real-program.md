# A real program

Every program so far was a handful of bytes you assembled yourself. Now the real thing:
the bootstrap service, a 149,274-byte PVM program from the test vectors' state. It expects
its memory laid out just so before it starts, and sooner or later it asks the outside
world for something, with `ecalli`. Build both and watch a real service wake up and ask
its first question.

## What the Gray Paper says

`ecalli`'s row, the only one in the table with one immediate (its layout is [lesson
15.2](./02-instructions.md)'s):

::: gray-paper A.5.2 2-2

#### Appendix A.5.2 Instructions with Arguments of One Immediate, continued

<a id="gp-A-5-2-p2"></a>

| $\zeta_\imath$ | **Name** | **Mutations** |
| --- | --- | --- |
| 10 | `ecalli` | $\varepsilon = \hbar \times \nu_X$ |

:::

In plain words, **`ecalli`** (opcode 10): ε = ħ × ν_X. The machine stops with a *host
call*, and ν_X says which one. The machine hands back ı pointing *at* the `ecalli`, with
registers and memory as they were. A.6 says what happens next:

::: gray-paper A.6

#### Appendix A.6 Host Call Definition {#gp-A-6}

<a id="gp-A-6-p1"></a>An extended version of the PVM <abbr class="gp-term" title="one run of code in the PVM: Is-Authorized, refine or accumulate">invocation</abbr> which is able to progress an inner *host-call* state-machine in the case of a host-call halt condition is defined as $\Psi_H$:

<a id="gp-A-6-p2"></a><a id="eq-A-38"></a><a id="eq-A-39"></a><a id="eq-A-40"></a>

$$
\begin{align}
&\Psi_H^*\colon \left\{ \begin{aligned}
\!\left\lgroup\begin{aligned}
&\mathbb{B}_{}, \mathbb{N}_R, \mathbb{N}_G, {\left\{\,\bot, \top\,\right\}},\\&\left[\!\left[\mathbb{N}_R\right]\!\right]_{13}, \mathbb{M}, \Omega\left\langle X\right\rangle, X
\end{aligned}
\right\rgroup\!
&\to
\!\left\lgroup\left\{\,\unicode{x21AF}, \infty, \blacksquare\,\right\} \cup \left\{\,\unicode{x2132}\,\right\} \times \mathbb{N}_R, \mathbb{N}_R, \mathbb{Z}_G, {\left\{\,\bot, \top\,\right\}}, \left[\!\left[\mathbb{N}_R\right]\!\right]_{13}, \mathbb{M}, X\right\rgroup\!\\
\left(\mathfrak{p}, \imath, \varrho, \tilde{\varrho}, \varphi, {\mu}, f, \mathbf{x}\right) &\mapsto \begin{cases}
\text{let }(\varepsilon', \imath', \varrho', \tilde{\varrho}', \varphi', {\mu}') = \Psi(\mathfrak{p}, \imath, \varrho, \tilde{\varrho}, \varphi, {\mu}): \\[8pt]
\left(\varepsilon', \imath', \varrho', \tilde{\varrho}', \varphi', {\mu}', \mathbf{x}\right) &\text{if } \varepsilon' \in \left\{\, \blacksquare, \unicode{x21AF}, \infty \,\right\} \cup \left\{\,\unicode{x2132}\,\right\} \times \mathbb{N}_R \\[4pt]
\begin{aligned}
&\Psi_H^*(\mathfrak{p}, \imath'', \varrho'', \tilde{\varrho}', \varphi'', {\mu}'', f, \mathbf{x}'')\\[2pt]
&\quad  \text{where } \imath'' = \imath' + 1 + \text{skip}(\imath')
\end{aligned}
&\text{if } \bigwedge\left\{ \;\begin{aligned}
&\varepsilon' = \hbar \times h\\[2pt]
&\left(\blacktriangleright, \varrho'', \varphi'', {\mu}'', \mathbf{x}''\right) = f(h, \varrho', \varphi', {\mu}', \mathbf{x})
\end{aligned} \right.\\[8pt]
\left(\varepsilon'', \imath', \varrho'', \tilde{\varrho}', \varphi'', {\mu}'', \mathbf{x}''\right) &\text{if }  \bigwedge\left\{ \;\begin{aligned}
&\varepsilon' = \hbar \times h\\[2pt]
&\left(\varepsilon'', \varrho'', \varphi'', {\mu}'', \mathbf{x}''\right) = f(h, \varrho', \varphi', {\mu}', \mathbf{x})\\[2pt]
&\varepsilon'' \in \left\{\,\unicode{x21AF}, \blacksquare, \infty\,\right\}
\end{aligned} \right.\\[8pt]
\end{cases} \\
\end{aligned} \right.\!\!\!\!\!\!\!\! \tag{A.38} \\
&\Psi_H(\mathfrak{p}, \imath, \varrho, \varphi, {\mu}, f, \mathbf{x}) \equiv \Psi_H^*(\mathfrak{p}, \imath, \varrho, \bot, \varphi, {\mu}, f, \mathbf{x}) \tag{A.39} \\
&\Omega\left\langle X\right\rangle \equiv \!\left\lgroup\mathbb{N}, \mathbb{N}_G, \left[\!\left[\mathbb{N}_R\right]\!\right]_{13}, \mathbb{M}, X\right\rgroup\! \to \!\left\lgroup\left\{\,\blacktriangleright, \blacksquare, \unicode{x21AF}, \infty\,\right\}, \mathbb{N}_G, \left[\!\left[\mathbb{N}_R\right]\!\right]_{13}, \mathbb{M}, X\right\rgroup\! \tag{A.40}
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
| <span id="gk-contextmutator">$\Omega\left\langle x\right\rangle$</span> | omega of X | a host's function: given a host call's number, the gas, registers, memory and the host's own context X, it says carry on or stop, with all of them updated |
| <span id="gk-to">[$\to$](../symbols.md#to)</span> | to | what goes in, to what comes out: A → B takes an A and gives a B |
| <span id="gk-set">$\left\{\,x\,\right\}$</span> | the set of | a set: values with no order and no repeats |
| <span id="gk-panic">$\unicode{x21AF}$</span> | panic | ↯: the program trapped |
| <span id="gk-oog" class="gk-wrap">$\infty$</span> | out of gas | ∞: the program ran out of gas |
| <span id="gk-halt" class="gk-wrap">$\blacksquare$</span> | halt | ∎: the program finished normally |
| <span id="gk-cup">$\cup$</span> | union | everything in either side |
| <span id="gk-fault">$\unicode{x2132}$</span> | page fault | Ⅎ: the program touched memory it may not |
| <span id="gk-times">$\times$</span> | times | multiply; between sets, every pair of one from each |
| <span id="gk-signedgas" class="gk-wrap">$\mathbb{Z}_G$</span> | Z sub G | gas that can go negative: an i64 |
| <span id="gk-pvm-blob" class="gk-wrap">$\mathfrak{p}$</span> | p (gothic) | a PVM program blob: the jump table, the code and the bitmask, packed as bytes |
| <span id="gk-imath">$\imath$</span> | i | the instruction counter: the index in the code of the instruction to run next |
| <span id="gk-gascounter" class="gk-wrap">$\varrho$</span> | rho (curly) | the gas left |
| <span id="gk-gaschargedflag" class="gk-wrap">$\tilde{\varrho}$</span> | rho tilde | the gas flag: true once the basic block the machine is in has been paid for |
| <span id="gk-registers" class="gk-wrap">$\varphi$</span> | phi (curly) | the PVM's 13 registers |
| <span id="gk-mem" class="gk-wrap">${\mu}$</span> | mu | the PVM's memory: 2^32 bytes in pages of 4,096, each page readable, writable or neither |
| <span id="gk-mapsto">$\mapsto$</span> | maps to | what a function gives back for an input: x ↦ y says x becomes y |
| <span id="gk-varepsilon">$\varepsilon$</span> | epsilon | the exit reason: how a step or a run ended, from carry on to halt, panic, out of gas, fault or host call |
| <span id="gk-in">[$\in$](../symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-Fskip">$\text{skip}$</span> | skip | skip(i): how many bytes follow the opcode at i before the next opcode, at most 24 |
| <span id="gk-bigwedge">$\bigwedge$</span> | all of | every one of the conditions under it is true |
| <span id="gk-host" class="gk-wrap">$\hbar$</span> | host call | ħ: the program asked the host for something, and waits |
| <span id="gk-continue" class="gk-wrap">$\blacktriangleright$</span> | continue | ▸: the step went normally, and the next one may run |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-bot">$\bot$</span> | bottom | false, the no of a yes-or-no value |
| <span id="gk-N" class="gk-wrap">[$\mathbb{N}$](../symbols.md#naturals)</span> | N | the whole numbers: 0, 1, 2 and up; a subscript is a bound, ℕ₈ is 0 to 7 |

</details>

→ [(A.38), (A.39), (A.40) in plain words](./gray-paper.md#ex-A-38)

<a id="gp-A-6-p3"></a>As with $\Phi$, on exit the instruction counter references the instruction *which caused the exit* and the machine state is that prior to this instruction. Should the machine be invoked again using this instruction counter and code, then the same instruction which caused the exit would be executed on the proper (prior) machine state.

<a id="gp-A-6-p4"></a>With $\Phi_H$, host-calls (i.e.  `ecalli` instructions) are in effect handled internally with the state-mutator function provided as an argument, preventing the possibility of the result being a host-call fault. Note that in the case of a successful host-call transition, we must provide the new instruction counter value $\imath''$ explicitly alongside the fresh <abbr class="gp-term" title="after the change: the value once it is made, written with a prime (α′); for state, after the block">posterior</abbr> state for said instruction.

:::

In plain words, Ψ_H runs Ψ, and whenever it stops on a host call, hands the call to f, the
host's function, with the gas, registers and memory and some context x of the host's own.
If f says carry on, the machine carries on from the next instruction, ı + 1 + skip(ı),
with whatever f changed. Any other exit ends Ψ_H. The host calls are numbered in App. B:
`gas` is 0, `grow_heap` 1, `fetch` 2, and so on up to `provide`, 27. [Part
16](../16-host-calls/index.md) and [Part 17](../17-accumulation/index.md) build the 20 that
accumulation uses. The other 8 (`historical_lookup`, `export`, `machine`, `peek`, `poke`,
`pages`, `invoke`, `expunge`) only run in refine, on the cores, which a block importer
never does.

The start: [lesson 15.1](./01-the-program-blob.md) quoted the first half of A.7, the
standard program's layout and Y's conditions. The second half says what Y gives:

::: gray-paper A.7 6-8

#### Appendix A.7 Standard Program Initialization, continued

<a id="gp-A-7-p6"></a>Thus, if the above conditions cannot be satisfied with unique values, then the result is $\emptyset$, otherwise it is a tuple of $\mathfrak{p}$ as above and ${\mu}$, $\varphi$ such that:

<a id="gp-A-7-p7"></a><a id="eq-A-46"></a>

$$
\begin{equation}
\forall i \in \mathbb{N}_{2^{32}} : (({\mu}_{\mathbf{v}})_{i}, ({\mu}_{\mathbf{a}})_{\left\lfloor{}^{i}\!/_{\mathsf{Z}_P}\right\rfloor}) = \left\{ \begin{alignedat}{5}
&\left(\mathbf{v}\mathrel{\unicode{x2AF6}}\mathbf{o}_{i - \mathsf{Z}_Z},\,\mathbf{a}\mathrel{\unicode{x2AF6}} R\right) &&\ \text{if }
\mathsf{Z}_Z
&\ \leq i < \ &&
\mathsf{Z}_Z + \left\vert\mathbf{o}\right\vert\\
&\left(0, R\right) &&\ \text{if }
\mathsf{Z}_Z + \left\vert\mathbf{o}\right\vert
&\ \leq i < \ &&
\mathsf{Z}_Z + P(\left\vert\mathbf{o}\right\vert) \\
&(\mathbf{w}_{i - (2\mathsf{Z}_Z + Z(\left\vert\mathbf{o}\right\vert))}, W) &&\ \text{if }
2\mathsf{Z}_Z + Z(\left\vert\mathbf{o}\right\vert)
&\ \leq i < \ &&
2\mathsf{Z}_Z + Z(\left\vert\mathbf{o}\right\vert) + \left\vert\mathbf{w}\right\vert\\
&\left(0, W\right) &&\ \text{if }
2\mathsf{Z}_Z + Z(\left\vert\mathbf{o}\right\vert) + \left\vert\mathbf{w}\right\vert
&\ \leq i < \ &&
2\mathsf{Z}_Z + Z(\left\vert\mathbf{o}\right\vert) + P(\left\vert\mathbf{w}\right\vert) + z\mathsf{Z}_P\\
&\left(0, W\right) &&\ \text{if }
2^{32} - 2\mathsf{Z}_Z - \mathsf{Z}_I - P(s)
&\ \leq i < \ &&
2^{32} - 2\mathsf{Z}_Z - \mathsf{Z}_I\\
&(\mathbf{a}_{i - (2^{32} - \mathsf{Z}_Z - \mathsf{Z}_I)}, R) &&\ \text{if }
2^{32} - \mathsf{Z}_Z - \mathsf{Z}_I
&\ \leq i < \ &&
2^{32} - \mathsf{Z}_Z - \mathsf{Z}_I + \left\vert\mathbf{a}\right\vert\\
&\left(0, R\right) &&\ \text{if }
2^{32} - \mathsf{Z}_Z - \mathsf{Z}_I + \left\vert\mathbf{a}\right\vert
&\ \leq i < \ &&
2^{32} - \mathsf{Z}_Z - \mathsf{Z}_I + P(\left\vert\mathbf{a}\right\vert)\\
&\left(0, \emptyset\right) &&\text{otherwise}&&&
\end{alignedat} \right.\\ \tag{A.46}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-forall">$\forall$</span> | for all | for every value: ∀c ∈ ℕ_C means for each core c |
| <span id="gk-Nbits">[$\mathbb{N}_{2^{x}}$](../symbols.md#naturals)</span> | N sub two to the n | the numbers that fit in n bits: ℕ_{2³²} is a u32 |
| <span id="gk-ram-value" class="gk-wrap">$\mathbf{v}$</span> | v | memory's bytes |
| <span id="gk-ram-access" class="gk-wrap">$\mathbf{a}$</span> | a | memory's access: for each page, readable, writable or neither |
| <span id="gk-floor">[$\left\lfloor x\right\rfloor$](../symbols.md#floor)</span> | floor of | rounded down to a whole number |
| <span id="gk-nicefrac">${}^{x}\!/_{y}$</span> | over | a fraction: the top divided by the bottom |
| <span id="gk-Cpvmpagesize" class="gk-wrap">$\mathsf{Z}_P$</span> | Z sub P | a memory page: 4,096 bytes |
| <span id="gk-bracegroup">$\left\{ x \right.$</span> | as follows | a brace grouping cases: the line whose condition holds gives the value |
| <span id="gk-is">$x\mathrel{\unicode{x2AF6}} y$</span> | is a | names a field and gives its type, in a tuple |
| <span id="gk-Cpvminitzonesize" class="gk-wrap">$\mathsf{Z}_Z$</span> | Z sub Z | a zone: 2^16 bytes, 64 KiB; memory's sections start on zones, with an empty one between |
| <span id="gk-leq">$\leq$</span> | at most | less than or equal to |
| <span id="gk-len">$\left\vert x\right\vert$</span> | the size of | \|x\|: how many items x has, or how many bytes |
| <span id="gk-rnp">$P(x)$</span> | P of | x rounded up to whole pages of 4,096 bytes |
| <span id="gk-rnq">$Z(x)$</span> | Z of | x rounded up to whole zones of 65,536 bytes |
| <span id="gk-Cpvminitinputsize" class="gk-wrap">$\mathsf{Z}_I$</span> | Z sub I | the most argument data a program can be given: 2^24 bytes, 16 MiB |
| <span id="gk-none" class="gk-wrap">$\emptyset$</span> | nothing | ∅: no value at all, like null |

</details>

→ [(A.46) in plain words](./gray-paper.md#ex-A-46)

<a id="gp-A-7-p8"></a><a id="eq-A-47"></a>

$$
\begin{equation}
\forall i \in \mathbb{N}_{13} : \varphi_{i} = \begin{cases}
2^{32} - 2^{16} &\text{if } i = 0\\
2^{32} - 2\mathsf{Z}_Z - \mathsf{Z}_I &\text{if } i = 1\\
2^{32} - \mathsf{Z}_Z - \mathsf{Z}_I &\text{if } i = 7\\
\left\vert\mathbf{a}\right\vert&\text{if } i = 8\\
0 &\text{otherwise}
\end{cases} \tag{A.47}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-Nmax">[$\mathbb{N}_{x}$](../symbols.md#naturals)</span> | N sub n | the whole numbers below n: ℕ_C is a core index, 0 to C − 1 |

</details>

→ [(A.47) in plain words](./gray-paper.md#ex-A-47)

:::

In plain words, **Y** turns a standard program ([lesson 15.1](./01-the-program-blob.md)
unpacked its parts: o, w, z, s and the code) and some argument bytes a into a starting
memory and registers. Memory is laid out in *zones* of Z_Z = 2^16 bytes, with an empty zone
between sections, so a program that runs off the end of one section hits nothing at all
instead of the next one:

| From | What | Access |
| --- | --- | --- |
| 2^16 | o, the read-only data, padded with zeros to a whole page | R |
| 2 · 2^16 + Z(\|o\|) | w, the read-write data, padded to a page, then z pages of heap | W |
| below 2^32 − 2 · 2^16 − 2^24 | the stack: s bytes rounded up to pages | W |
| 2^32 − 2^16 − 2^24 | the arguments a, at most Z_I = 2^24 bytes, padded to a page | R |

P rounds up to whole pages, Z to whole zones (not to be confused with Z_Z, a zone's size).
Everything else isn't there: touch it and the machine faults, or panics below 2^16
([lesson 15.4](./04-memory.md)).

Lay out the test's tiny program or the real service, or sizes of your own:

<YLayout />

And the registers: r0 = 2^32 − 2^16, the halt address ([lesson 15.3](./03-the-machine.md)), so that when the
program returns, it ends. r1 = the top of the stack, which grows down. r7 = where the
arguments are, r8 = how many bytes. Every other register starts at 0.

A.8 puts the three together:

::: gray-paper A.8

#### Appendix A.8 Argument Invocation Definition {#gp-A-8}

<a id="gp-A-8-p1"></a>The three instances where the PVM is utilized each expect to be able to pass argument data in and receive some return data back. We thus define the common PVM program-argument invocation function $\Psi_M$:

<a id="gp-A-8-p2"></a><a id="eq-A-48"></a>

$$
\begin{equation}
\Psi_M\colon \left\{ \begin{aligned}
\!\left\lgroup
\mathbb{B}_{}, \mathbb{N}_R, \mathbb{N}_G, \mathbb{B}_{:\mathsf{Z}_I}, \Omega\left\langle X\right\rangle, X
\right\rgroup\! &\to \!\left\lgroup\mathbb{N}_G, \mathbb{B}_{} \cup \left\{\,\unicode{x21AF}, \infty\,\right\}, X\right\rgroup\!\\
\left(\mathfrak{j}, \imath, \varrho, \mathbf{a}, f, \mathbf{x}\right) &\mapsto \begin{cases}
\left(0, \unicode{x21AF}, \mathbf{x}\right) &\text{if } Y(\mathfrak{j}, \mathbf{a}) = \emptyset\\
R(\varrho, \Psi_H(\mathfrak{p}, \imath, \varrho, \varphi, {\mu}, f, \mathbf{x})) &\text{if } Y(\mathfrak{j}, \mathbf{a}) = \left(\mathfrak{p}, \varphi, {\mu}\right)\\
\quad  \text{where } R \colon \left(\varrho, \left(\begin{alignedat}{5}
&\varepsilon,\, &&\imath',\, &&\varrho',\\
&\varphi',\, &&{\mu}',\, &&\mathbf{x}'
\end{alignedat}
\right)\right) \mapsto \begin{cases}
\left(u, \infty, \mathbf{x}'\right) &\text{if } \varepsilon = \infty \\
\left(u, \mu'_{\varphi'_{7}\dots+\varphi'_{8}}, \mathbf{x}'\right) &\text{if } \varepsilon = \blacksquare \wedge \mathbb{N}_{\varphi'_{7} \dots+ \varphi'_{8}} \subseteq \mathbb{V}_{{\mu}'} \\
\left(u, \left[\right], \mathbf{x}'\right) &\text{if } \varepsilon = \blacksquare \wedge \mathbb{N}_{\varphi'_{7} \dots+ \varphi'_{8}} \not\subseteq \mathbb{V}_{{\mu}'} \\
\left(u, \unicode{x21AF}, \mathbf{x}'\right) &\text{otherwise} \\
\quad  \text{where } u = \varrho - \max(\varrho', 0)
\end{cases}
\!\!\!\!\!\!\!\!
\end{cases}
\end{aligned} \right. \tag{A.48}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-jam-blob" class="gk-wrap">$\mathfrak{j}$</span> | j (gothic) | a standard program: four sizes, the read-only and read-write data, then the PVM blob |
| <span id="gk-memory" class="gk-wrap">$\mu$</span> | mu | the PVM's memory |
| <span id="gk-wedge">$\wedge$</span> | and | both sides are true |
| <span id="gk-Nrange">$\mathbb{N}_{x \dots+ y}$</span> | N from x, y of them | the y whole numbers from x on: x, x + 1, up to x + y − 1 |
| <span id="gk-subseteq">$\subseteq$</span> | is a subset of | everything in the left is in the right |
| <span id="gk-readable">$\mathbb{V}_{x}$</span> | V sub mu | the addresses of memory μ that may be read |
| <span id="gk-sq">[$\left[x\right]$](../symbols.md#sequence)</span> | the sequence | a sequence written out item by item; [ ] is the empty one |
| <span id="gk-max">$\max$</span> | max of | the largest of the values in the brackets |

</details>

→ [(A.48) in plain words](./gray-paper.md#ex-A-48)

<a id="gp-A-8-p3"></a>Note that the first tuple item is the amount of gas consumed by the operation, but never greater than the amount of gas provided for the operation.

:::

In plain words, Ψ_M is what the rest of the paper calls: Y lays out the program (and if it
can't, that's a panic, with no gas used), Ψ_H runs it with the host's f, and R reads the
answer. A halt returns the bytes from φ′₇, φ′₈ of them; if those aren't readable, the
answer is empty. Out of gas is ∞, and anything else a panic. It also says how much gas was
used, never more than was given.

**Where to start.** A program has more than one way in. App. B starts authorization and
refinement at instruction 0, and accumulation at 5, with the arguments E(t, s, |i|): the
slot, the service's id, and how many inputs it has, each a compact natural ([lesson 2.2](../02-codec/02-compact-naturals.md)).

**Try it in the [playground](../pvm-playground.md).** Press **A real service: bootstrap's accumulate**. Before anything runs, r7, r8, r0 and r1 already hold what this lesson says. Press **Next host call**: it stops after 38 instructions, on the `fetch` this lesson ends with.

## The tests

**New file** `test/standard.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { encodeNatural } from "../src/codec/numbers.ts";
import { HALT_ADDRESS, newMachine, run, step } from "../src/pvm/machine.ts";
import { readMemory, writeMemory } from "../src/pvm/memory.ts";
import { assemble, deblob, unpackCode } from "../src/pvm/program.ts";
import { standardProgram } from "../src/pvm/standard.ts";
import { bootstrapCode } from "./vectors.ts";
import type { Bytes } from "../src/bytes.ts";
import type { MemoryError } from "../src/pvm/memory.ts";
import type { Exit, Machine } from "../src/pvm/machine.ts";
import type { ServiceCode } from "../src/pvm/program.ts";

/** A tiny standard program: 3 bytes of o, 2 of w, a page of heap, 100 bytes of stack. */
const TINY_PROGRAM = {
  metadata: new Uint8Array(0),
  readOnly: Uint8Array.from([1, 2, 3]),
  readWrite: Uint8Array.from([4, 5]),
  heapPages: 1,
  stackSize: 100,
  program: new Uint8Array(0),
};

test("Y lays out memory: o a zone up, w a zone after it, the stack and arguments up top", () => {
  const { memory } = standardProgram(TINY_PROGRAM, Uint8Array.from([9]));
  const o: Bytes | MemoryError = readMemory(memory, 0x10000n, 3);
  assert.deepEqual(o, Uint8Array.from([1, 2, 3]));
  const zero: Bytes = Uint8Array.of(0);
  const intoO: MemoryError | null = writeMemory(memory, 0x10000n, zero); // o is read only
  assert.deepEqual(intoO, { fault: 0x10000 });
  const w: Bytes | MemoryError = readMemory(memory, 0x30000n, 2);
  assert.deepEqual(w, Uint8Array.from([4, 5]));
  // the heap page, after w's page
  const intoHeap: MemoryError | null = writeMemory(memory, 0x31fffn, zero);
  assert.equal(intoHeap, null);
  const intoStack: MemoryError | null = writeMemory(memory, 0xfefdf000n, zero); // its one page
  assert.equal(intoStack, null);
  const args: Bytes | MemoryError = readMemory(memory, 0xfeff0000n, 1);
  assert.deepEqual(args, Uint8Array.from([9]));
  const gap: Bytes | MemoryError = readMemory(memory, 0x32000n, 1); // and gaps between
  assert.deepEqual(gap, { fault: 0x32000 });
});

test("Y's registers: the halt address, the stack pointer, and where the arguments are", () => {
  const { registers } = standardProgram(TINY_PROGRAM, Uint8Array.from([9]));
  assert.equal(registers[0], HALT_ADDRESS);
  assert.equal(registers[1], 0xfefe0000n); // 2^32 − 2·2^16 − 2^24: the top of the stack
  assert.equal(registers[7], 0xfeff0000n); // 2^32 − 2^16 − 2^24
  assert.equal(registers[8], 1n);
});

test("ecalli stops the machine to call the host, and stays on the ecalli", () => {
  const machine: Machine = newMachine(assemble([[10, 2]])); // ecalli 2
  const exit: Exit = step(machine);
  assert.deepEqual(exit, { host: 2 });
  assert.equal(machine.pc, 0);
});

test("a real service starts: the bootstrap service runs until it calls fetch", () => {
  const code: ServiceCode = unpackCode(bootstrapCode());
  const args: Bytes = Uint8Array.from([
    ...encodeNatural(1n),
    ...encodeNatural(0n),
    ...encodeNatural(0n),
  ]);
  const { memory, registers } = standardProgram(code, args); // slot 1, service 0, 0 inputs
  const machine: Machine = newMachine(deblob(code.program), registers, memory);
  machine.pc = 5; // where accumulation starts
  const exit: Exit = run(machine);
  assert.deepEqual(exit, { host: 2 }); // host call 2 is fetch
  assert.equal(machine.registers[10], 0n); // asking for item 0: the protocol constants
});
```

`TINY_PROGRAM` has every part, each as small as it can be, so the addresses are easy to
work out by hand. o is one zone up, at 0x10000. It's 3 bytes, so Z(3) is one zone, and w
starts at 2 · 0x10000 + 0x10000 = 0x30000: one page for w, then one of heap. The stack's
top is 2^32 − 2 · 2^16 − 2^24 = 0xfefe0000, with one page below it. The last test runs the
real thing: the bootstrap service, entered at 5 with slot 1, service 0 and no inputs.

## The code

**New file** `src/pvm/standard.ts`

```ts
// The standard program (GP App. A.7, Y): how a service's program starts. Its data, heap,
// stack and arguments are laid out in memory, and a few registers say where things are.

import type { Bytes } from "../bytes.ts";
import type { Memory } from "./memory.ts";
import { addPages, PAGE_SIZE } from "./memory.ts";
import type { ServiceCode } from "./program.ts";

/** Z_Z: memory is laid out in zones of 64 KiB. */
export const ZONE = 2 ** 16;
/** Z_I: room for up to 16 MiB of arguments. */
export const INPUT_SIZE = 2 ** 24;

/** x rounded up to a whole number of `size`s: the GP's P (pages) and Q (zones). */
const roundUp = (x: number, size: number) => Math.ceil(x / size) * size;

/** Copies bytes into memory at `address`, whatever the pages allow: setting up is allowed. */
function place(memory: Memory, address: number, bytes: Bytes): void {
  bytes.forEach((byte, k) => {
    const i = address + k;
    memory.get(Math.floor(i / PAGE_SIZE))!.bytes[i % PAGE_SIZE] = byte;
  });
}

/** Y (GP App. A.7): a standard program's memory and registers at the start, given arguments. */
export function standardProgram(code: ServiceCode, args: Bytes) {
  const { readOnly, readWrite, heapPages, stackSize } = code;
  const memory: Memory = new Map();
  addPages(memory, ZONE, readOnly.length, "R"); // o, one zone up
  place(memory, ZONE, readOnly);
  const heap = 2 * ZONE + roundUp(readOnly.length, ZONE); // w, a zone after o's zones
  addPages(memory, heap, roundUp(readWrite.length, PAGE_SIZE) + heapPages * PAGE_SIZE, "W");
  place(memory, heap, readWrite);
  const stackTop = 2 ** 32 - 2 * ZONE - INPUT_SIZE; // the stack grows down from here
  const stack = roundUp(stackSize, PAGE_SIZE);
  addPages(memory, stackTop - stack, stack, "W");
  const input = 2 ** 32 - ZONE - INPUT_SIZE; // the arguments, read only
  addPages(memory, input, args.length, "R");
  place(memory, input, args);
  const registers = Array<bigint>(13).fill(0n);
  registers[0] = 2n ** 32n - 2n ** 16n; // the halt address: returning from the program ends it
  registers[1] = BigInt(stackTop); // the stack pointer
  registers[7] = BigInt(input); // where the arguments are,
  registers[8] = BigInt(args.length); // and how long they are
  return { memory, registers };
}
```

Y, a line of code for each row of the table. `place` writes bytes in without asking the
pages' permission: o is read only *for the program*, not for whoever sets it up.

> [!NOTE]
> **The simple road.** Y has an answer only if every section fits: the zones, o, w with
> its heap, the stack and the arguments must add up to no more than 2^32 bytes, and the
> arguments must fit in Z_I. If not, the machine panics without running anything.
> `standardProgram` lays out whatever it's given, which is fine for the real service
> here; the [hardening pass](https://github.com/abutlabs/the-gray-tutor/blob/main/HARDENING.md) adds the check, since a service's code comes from
> anyone.

Now the machine learns its last instruction. A host call is a new way to stop:

**Replace in** `src/pvm/machine.ts`

```ts
/** How a step ends (GP's ε): carry on, finish, fail, fault on a page, or call the host. */
export type Exit = "continue" | "halt" | "panic" | { fault: number } | { host: number };

/** Ψ, without gas yet: steps until the machine halts, panics, faults or calls the host. */
export function run(m: Machine): Exit {
  for (;;) {
    const exit = step(m);
    if (exit !== "continue") return exit;
  }
}

/** Every family of instructions built so far. */
const FAMILIES: Family[] = [
  basics,
  memoryInstructions,
  arithmetic,
  decisions,
  bitsAndBytes,
  hostCall,
];
```

**Add to** `src/pvm/machine.ts`

```ts
/** Lesson 15.8's instruction: ecalli stops the machine, to ask the host for something. */
function hostCall(m: Machine, ins: Instruction): Exit | undefined {
  if (ins.name !== "ecalli") return undefined;
  m.pc = ins.at; // ı stays on the ecalli; the host moves it on once it has answered
  return { host: Number(ins.immediates[0]) };
}
```

TypeScript now spots something in [lesson 15.4](./04-memory.md)'s `bin/memory.ts`. It reads `exit.fault`
from any exit that's an object, and a host call is an object too. Ask which it is, with
`in`:

**Replace in** `bin/memory.ts`

```ts
const shown =
  typeof exit === "object" && "fault" in exit ? `a fault at 0x${exit.fault.toString(16)}` : exit;
say(`load from 0x30005, where there's no page: ${shown}`);
```

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ the reported packages: each one's hash and exports root, sorted by hash (206.8ms)
...
✔ Y lays out memory: o a zone up, w a zone after it, the stack and arguments up top (1.2ms)
✔ Y's registers: the halt address, the stack pointer, and where the arguments are (0.2ms)
✔ ecalli stops the machine to call the host, and stays on the ecalli (0.6ms)
✔ a real service starts: the bootstrap service runs until it calls fetch (50.1ms)
...
ℹ tests 431
ℹ suites 0
ℹ pass 431
ℹ fail 0
...
reported 431 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791736885963
...
```

## Watch it

**New file** `bin/start.ts`

```ts
// Starts a real service: the bootstrap service, from the state before the first block of
// the fallback trace. Y lays out its memory and registers, and the machine runs from
// accumulation's entry point until the program calls the host.
// Usage: npm run start

import { readFileSync } from "node:fs";
import { fromHex } from "../src/bytes.ts";
import { encodeNatural } from "../src/codec/numbers.ts";
import { Run } from "../src/obs.ts";
import { decodeInstruction } from "../src/pvm/instructions.ts";
import { newMachine, step } from "../src/pvm/machine.ts";
import { PAGE_SIZE } from "../src/pvm/memory.ts";
import { deblob, unpackCode } from "../src/pvm/program.ts";
import { standardProgram } from "../src/pvm/standard.ts";
import { serviceCode } from "../src/services.ts";
import type { KeyValue } from "../src/trie.ts";

const trace = JSON.parse(readFileSync("../vectors/traces/fallback/00000001.json", "utf8"));
const entries: KeyValue[] = trace.pre_state.keyvals.map((e: { key: string; value: string }) => ({
  key: fromHex(e.key),
  value: fromHex(e.value),
}));
const code = unpackCode(serviceCode(entries, 0)!);

const run = new Run("start");
const say = (line: string) => {
  console.log(line);
  run.event("line", { line });
};
const hex = (x: number | bigint) => `0x${x.toString(16).padStart(8, "0")}`;

// Accumulation's arguments (GP App. B): the slot, the service, and how many inputs.
const args = Uint8Array.from([...encodeNatural(1n), ...encodeNatural(0n), ...encodeNatural(0n)]);
const { memory, registers } = standardProgram(code, args);
say("memory, as Y lays it out:");
const pages = [...memory.keys()].sort((a, b) => a - b);
let first = pages[0]; // the first page of a run of pages with the same access
pages.forEach((page, i) => {
  const next = pages[i + 1];
  const access = memory.get(page)!.access;
  if (next === page + 1 && memory.get(next)!.access === access) return; // the run goes on
  const [from, to] = [hex(first * PAGE_SIZE), hex((page + 1) * PAGE_SIZE - 1)];
  say(`  ${from} to ${to}  ${access}  ${page - first + 1} page(s)`);
  first = next;
});
const [r0, r1, r7, r8] = [0, 1, 7, 8].map((r) => registers[r]);
say(`registers: r0 = ${hex(r0)}, r1 = ${hex(r1)}, r7 = ${hex(r7)}, r8 = ${r8}`);

const program = deblob(code.program);
const machine = newMachine(program, registers, memory);
machine.pc = 5; // where accumulation starts
for (let n = 1; ; n++) {
  const at = machine.pc;
  const { name } = decodeInstruction(program, at);
  const exit = step(machine);
  say(`step ${String(n).padStart(2)}  at ${String(at).padStart(6)}  ${name}`);
  if (exit !== "continue") {
    say(`the machine stops: ${JSON.stringify(exit)}, with r10 = ${machine.registers[10]}`);
    break;
  }
}
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

**What flows through it.** The code and arguments going in, the
world Y builds for them, and the lines printed:

::: code-group

```text [what goes in]
service 0's unpacked code — the 159,322-byte preimage of the fallback trace —
and accumulation's argument blob, three compact naturals:
  01 00 00   the slot, 1; the service, 0; its inputs, 0
Y turns those into memory and registers; the machine starts at byte 5
```

```ts [what it computes]
// what Y laid out, before the first step
const computed = {
  readOnly: "0x00010000, 3 pages R", // the program's constant data
  stack: "0xfefde000, 2 pages W", // ending under r1, the stack pointer
  args: "0xfeff0000, 1 page R", // the 3 argument bytes, where r7 points
  r8: 3n, // the arguments' length
  stops: '{"host":2}', // step 38, ecalli 2: the fetch host call
};
```

```text [what comes out]
registers: r0 = 0xffff0000, r1 = 0xfefe0000, r7 = 0xfeff0000, r8 = 3
the machine stops: {"host":2}, with r10 = 0
```

:::

**Run**

```sh
npm pkg set scripts.start="node bin/start.ts"
npm run start
```

```text
memory, as Y lays it out:
  0x00010000 to 0x00012fff  R  3 page(s)
  0x00030000 to 0x00032fff  W  3 page(s)
  0xfefde000 to 0xfefdffff  W  2 page(s)
  0xfeff0000 to 0xfeff0fff  R  1 page(s)
registers: r0 = 0xffff0000, r1 = 0xfefe0000, r7 = 0xfeff0000, r8 = 3
step  1  at      5  jump
step  2  at  92078  add_imm_64
step  3  at  92082  store_ind_u64
step  4  at  92086  store_ind_u64
step  5  at  92090  store_ind_u64
step  6  at  92094  move_reg
step  7  at  92096  move_reg
step  8  at  92098  load_imm_jump
step  9  at 123687  add_imm_64
step 10  at 123691  store_ind_u64
step 11  at 123695  store_ind_u64
step 12  at 123699  store_ind_u64
step 13  at 123703  store_imm_ind_u64
step 14  at 123707  add_imm_64
step 15  at 123711  add_imm_64
step 16  at 123715  load_imm_jump
...
step 38  at 121489  ecalli
the machine stops: {"host":2}, with r10 = 0
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=start-1791736891343
```

Four sections, with empty zones between them, as the table said. Then 38 steps of real
compiled code. Step 1 jumps from 5 into the program. Step 2 moves the stack pointer r1
down by 1,440 bytes, and steps 3 to 5 save registers there: Y's stack pages, in use
already. Step 8 is a `load_imm_jump`, a call, leaving the way back in
r0 exactly as in [lesson 15.6](./06-branches-and-calls.md), and step 16 is another. Step 38 is `ecalli 2`: `fetch`. And
r10 = 0 says what it wants: in `fetch`'s table, item 0 is the chain's protocol constants.
The service's first question is "what are the rules here?" Fair enough. The *A real
program starts* panel, on **6 · The PVM**, has the whole run.

![A real program starts panel](./images/08-a-real-program-starts.png)

<details>
<summary>lasair: <code>init_registers</code>, in <code>lib/pvm_program.ml</code></summary>

```ocaml
let init_registers (args : bytes) : int64 array =
  let regs = Array.make 13 0L in
  regs.(0) <- Int64.of_int (0x100000000 - 0x10000);  (* RA = 2^32 - 64KB *)
  regs.(1) <- Int64.of_int (0x100000000 - 2 * init_zone_size - init_input_size);  (* SP *)
  regs.(7) <- Int64.of_int (0x100000000 - init_zone_size - init_input_size);  (* A0 = args ptr *)
  regs.(8) <- Int64.of_int (Bytes.length args);  (* A1 = args len *)
  regs
```

RA, SP, A0, A1: lasair's comments use the register names from RISC-V, the instruction set
the PVM is based on. The return address, the stack pointer, the first two arguments: the
same jobs your registers 0, 1, 7 and 8 do. lasair also checks Y's size rule, the one the
note above leaves for the [hardening pass](https://github.com/abutlabs/the-gray-tutor/blob/main/HARDENING.md).

</details>

## Check your understanding

::: check
**`ecalli 2` stops the machine. Where is ı?**

- [ ] At the next instruction, so the program carries on by itself
  > No: the machine stops and hands over to the host, and it carries on only once the
  > host has answered.
- [x] On the `ecalli` itself, until the host has answered
  > Yes: registers and memory are as they were. The host changes what it must, then the
  > machine carries on from the next instruction.
- [ ] At jump-table address 2
  > No: the 2 isn't a place in the program. It says which host call: 2 is `fetch`.

**Why does Y leave an empty zone between a program's sections?**

- [x] So a program that runs off the end of one section hits nothing at all, instead of reading the next one
  > Yes: the gap is a guard. An access there stops the program, instead of quietly reading
  > or writing other data.
- [ ] To leave room for the section to grow
  > No: sections don't grow into the gap. The heap grows in its own place.
- [ ] Pages have to be 64 kB apart
  > No: pages are 4,096 bytes, and inside a section they sit side by side: w and its heap
  > page at 0x30000 and 0x31000.

**The bootstrap service starts with r8 = 3. What is the 3?**

- [ ] The service has three inputs
  > No: it has none. r8 counts bytes of arguments.
- [x] Three bytes of arguments: slot 1, service 0 and 0 inputs, each a one-byte compact natural
  > Yes: E(t, s, |i|) is `01 00 00`, and r7 says where it is, 0xfeff0000.
- [ ] It's service 3
  > No: it's service 0. r8 is the arguments' length.
:::

## What you have

A machine that runs every instruction in the Gray Paper, and a real service started on
it, right up to its first question for the host. Answering that question is [Part 16](../16-host-calls/index.md).
Before that, the machine needs to charge for its work, or a program could run forever:
[lesson 15.9](./09-what-instructions-cost.md) prices every instruction.

**Say it out loud.** A service starts with its memory in sections, empty zones between them, and four registers set: the way out, the stack, and where its arguments are. Accumulate enters at 5.

Next: [15.9 What instructions cost](./09-what-instructions-cost.md)
