# Part 15 · The PVM

**In one sentence:** services are programs, and the PVM is the small, made-up computer
inside every JAM node that runs them, the same way on every validator.

By the end of this part your client has a complete one: 13 registers, memory in pages, a
gas meter and all 139 instructions, and a real service starting up on it.

## The big picture

A service is written in an ordinary language, such as Rust, and compiled. The PVM is the
computer that compiled code runs on.

Why a made-up computer, and not the validator's own? One program on one input must give
one answer, to the last bit and the last unit of gas. If two validators ever disagreed,
the chain would split. So every validator runs the same small CPU.

The Gray Paper compares it to Ethereum's EVM, but simpler:

- It keeps close to RISC-V, a real CPU design, so existing compilers work.
- It fits real hardware well enough to be compiled for it.
- It has no special instructions for cryptography or for reading the chain. Anything
  outside the machine goes through a *host call*, [Part 16](../16-host-calls/index.md).

One machine, three ways in:

| | Runs when | Who runs it | Starts at | Gas, on full |
| --- | --- | --- | --- | --- |
| Is-Authorized | a package reaches a core | its guarantors, then auditors | 0 | 50,000,000 |
| Refine | the package is approved | its guarantors, then auditors | 0 | 5,000,000,000 |
| Accumulate | a block is imported | every validator | 5 | 10,000,000 a report |

A block importer only ever uses the last one, but it needs the whole machine to do it.

What the pieces are:

- A *program* is one preimage, a blob of bytes that a service's account points at by its
  code hash ([14.2](../14-services/02-the-service-account.md)). Inside it are the
  instructions and a memory layout ([15.1](./01-the-program-blob.md)).
- A *service*'s program has two entry points, refine and accumulate. An *authorizer*'s
  program has one, Is-Authorized.
- The machine is the same for all three: registers, memory in pages, a gas meter. What
  differs is where it runs and what the host lets it see, and that is
  [Part 16](../16-host-calls/index.md). [What runs where](../what-runs-where.md) has the map.

| Question | Lessons | Time |
| --- | --- | --- |
| How is the code packed and read? | [15.1](./01-the-program-blob.md), [15.2](./02-instructions.md) | 12 min |
| How does the machine run it? | [15.3](./03-the-machine.md), [15.4](./04-memory.md), [15.5](./05-arithmetic.md), [15.6](./06-branches-and-calls.md), [15.7](./07-bits-and-bytes.md) | 31 min |
| What does a real program look like? | [15.8](./08-a-real-program.md) | 7 min |
| How is it charged for? | [15.9](./09-what-instructions-cost.md), [15.10](./10-the-pipeline.md), [15.11](./11-the-gas-meter.md) | 20 min |

Keep [the PVM playground](../pvm-playground.md) open beside this part: it's this machine,
running, with every step on screen.

**Builds on** [Part 6 · State and Merklization](../06-state-and-merklization/index.md),
[Part 11 · Assurances](../11-assurances/index.md) and [Part 14 · Services and
preimages](../14-services/index.md), and on the foundations every part uses, [Parts 0 to
2](../index.md#lessons).

## At a glance

The whole part on one map. Boxes are what your client holds, and rounded cards are the
steps between them; a dashed card happens outside your client. Tap any card, or walk
through them in order with *next*.

<PartFlow :part="15" />

**Starting here?** At the repo root, `npm run catch-up -- 14.2` makes your client the one
this part starts from; [How to read it](../index.md#how-to-read-it) says more.

- [15.1 The program blob](./01-the-program-blob.md)
- [15.2 Instructions](./02-instructions.md)
- [15.3 The machine](./03-the-machine.md)
- [15.4 Memory](./04-memory.md)
- [15.5 Arithmetic](./05-arithmetic.md)
- [15.6 Branches and calls](./06-branches-and-calls.md)
- [15.7 Bits and bytes](./07-bits-and-bytes.md)
- [15.8 A real program](./08-a-real-program.md)
- [15.9 What instructions cost](./09-what-instructions-cost.md)
- [15.10 The pipeline](./10-the-pipeline.md)
- [15.11 The gas meter](./11-the-gas-meter.md)

## In the Gray Paper

Open **Appendix A, *Polkadot Virtual Machine***: A.1 defines the machine, A.2 the program
blob, A.3 the basic blocks, A.4 one step, A.5 the 139 instructions in thirteen tables, A.6
host calls, A.7 a program's start, A.8 the call the rest of the paper makes, and A.9 and
A.10 the gas model. Appendix B starts the machine for each of its three uses.

| The paper says | We say | Your client says |
| --- | --- | --- |
| Ψ, the PVM function; Ψ₁, one step; the program blob 𝔭; instruction counter ı; gas counter ϱ and the flag ϱ̃; registers φ, thirteen of them; memory μ | the machine, a step, the code, the program counter, gas and "paid for yet?", registers, memory | `run`, `step`, `program`, `pc`, `registers` ([15.3](./03-the-machine.md)); `memory`, `gas` and `charged` as [15.4](./04-memory.md) and [15.11](./11-the-gas-meter.md) add them |
| exit reasons: ∎ halt, ↯ panic, ∞ out of gas, Ⅎ page fault with its address, ħ host call with its index, ▸ carry on | halt, panic, out of gas, page fault, host call, continue | `Exit`: `"halt"`, `"panic"`, `"oog"`, `{ fault }`, `{ host }`, `"continue"` |
| 𝐜 the code, 𝐤 the bitmask, 𝐣 the jump table; ζ the code padded with zeros; ϖ the basic blocks; ν an immediate; ϱ^Δ the gas cost of a basic block | the code, the bitmask, the jump table, the blocks, a number in the instruction, a block's price | `code`, `bitmask`, `jumpTable` ([15.1](./01-the-program-blob.md)); `basicBlocks`, `immediates`, `blockCost` |
| Y, the standard initialization; Ψ_H, with host calls; Ψ_M, with arguments | a program's start, the run with a host, the whole call | `standardProgram` ([15.8](./08-a-real-program.md)); Ψ_H and Ψ_M in [Part 16](../16-host-calls/index.md) |

Its defining line, (A.1) with deblob, (A.2), each explained symbol by symbol in
[15.A](./gray-paper.md) with every other formula of Appendix A:

::: gray-paper-eq A.1

<a id="ex-A-1"></a>The Gray Paper's (A.1), (A.2), [in its place in the paper's words](./03-the-machine.md#eq-A-1):

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

<details class="gp-key"><summary>Its symbols</summary>

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

:::

Read it aloud: "Psi takes a blob, an instruction counter, an amount of gas, a true-or-false
flag, thirteen registers and a memory, and gives back an exit reason, one of halt, panic
or out of gas, or a page fault or a host call with a number, along with the counter, the
gas, the flag, the registers and the memory. If one step, Psi one, says carry on, run Psi
again from where it left off; if it halts or panics, stop, with the counter at 0;
otherwise stop where it is. Each step runs on what deblob cuts from the blob: the code c,
the bitmask k and the jump table j; if deblob can't, panic." The flag ϱ̃ says whether the
current basic block's gas has been paid ([15.11](./11-the-gas-meter.md)).

**Test yourself:** [E · PVM (Appendix A)](https://abutlabs.github.io/jam-learning/lasair/exam.html?chapter=e-pvm),
self-test cards on JAM learning.
