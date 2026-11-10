# The formulas, in plain words

[Part 15](./index.md)'s appendix: every formula of Appendix A, *Polkadot Virtual Machine*, read for
someone who doesn't read math. There are 65 numbered equations in 54 displayed blocks,
plus thirteen tables of instructions and one table of prices, and they are the whole
machine: how a program blob is cut up (A.1, A.2), how one instruction is read (A.2 to
A.5), what one step does (A.4), what each instruction does (A.5), how a host and a
program's start are wired in (A.6 to A.8), and what code costs (A.9, A.10). [The part's
page](./index.md#the-big-picture) tells who runs the machine and why. Each formula comes
with its key, then the same four steps: read it aloud, say it in plain words, watch it
work on a real value, and find it in your client. The real values come from the bootstrap
service, service 0 of the fallback trace, whose code [lesson
15.1](./01-the-program-blob.md) unpacks, and from the lessons' own small programs. [Reading
the Gray Paper](../reading-the-gray-paper.md) teaches the shapes a line can take, if one of
these stops you.

## (A.1) and (A.2): the machine, and cutting the blob

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

:::

**Read it aloud.** (A.1): "Psi takes a blob, an instruction counter, an amount of gas, a
true-or-false flag, thirteen registers and a memory. It gives back an exit reason, which is
halt, panic or out of gas, or a page fault or a host call with a number; and a counter, gas,
the flag, thirteen registers and a memory. Psi of p, i, rho, rho tilde, phi and mu is: Psi
again, on the primed values, if epsilon is continue; epsilon, zero, and the primed gas,
flag, registers and memory, if epsilon is panic or halt; otherwise, epsilon, the same i,
the primed gas and flag, and the same registers and memory. Where epsilon and the primed
values are Psi one of c, k, j and the rest, if c, k and j are what deblob gives for p and
i; otherwise, panic, with everything as it was."

(A.2): "deblob takes a blob and a counter, and gives a blob, a bit string and a sequence of
counters, or an error. deblob of p and i is c, k, j if there is exactly one c, k, j such
that p is: the encoded length of j, then z in one byte, then the encoded length of c, then
j with each entry in z bytes, then c, then k; and v-blob of c, k and 0 is true, and v-inst
of c, k and i is true. Otherwise, the error. v-blob of c, k, i is true if i is above 0 and
equals the length of k; false if the instruction at i is the last one and its opcode is
not in T; v-blob at the next instruction if v-inst holds at i; and false otherwise. v-inst
of c, k, i says: k is as long as c, i is inside it, bit i of k is 1, and byte i of c is an
opcode in U."

**In plain words.** Ψ is a loop around one step, Ψ₁. It runs a step, and if the step says
carry on (▸), runs again from where the step left the machine. Any other exit stops the
loop, and what comes back depends on why:

- **Halt or panic**: the program is over. ı comes back as 0, with the registers and memory
  as the last step left them.
- **Out of gas, a page fault, a host call**: the program is paused. ı stays *on* the
  instruction that stopped it, and the registers and memory are as they were before it.
  Whoever runs the machine can fix the cause (more gas, a new page, the host's answer) and
  run Ψ again from there.

deblob does two jobs. It cuts the blob into the jump table 𝐣, the code 𝐜 and the bitmask
𝐤, and "exactly one" (∃!) means the cut must use every byte, no more and no less. And it
checks the program before a single instruction runs: v-blob walks it from 0, instruction
by instruction, and every one must have a known opcode (U) and start where the bitmask says
an instruction starts, and the last must be a terminator (T, in (A.5)), so the machine can
never run off the end of the code mid-block. v-inst checks that ı itself starts an
instruction. A blob that fails is not an error to report: the machine simply panics,
with nothing run. The paper writes deblob inside every turn of the loop; only the ı check
changes from one turn to the next, so a client cuts and checks once and keeps the parts.

**On a real value.** deblob on the bootstrap service's program blob, 149,274 bytes:

```text
86 41            ℰ(|𝐣|): a compact natural, 1,601 entries in the jump table
03               ℰ₁(z): each entry is z = 3 bytes
c1 9d f5         ℰ(|𝐜|): a compact natural, 128,413 bytes of code
90 00 00 ef …    𝐣: 1,601 × 3 = 4,803 bytes; the first entry is 144, the second 239
28 9a 39 01 …    𝐜: 128,413 bytes of code
21 92 a4 24 …    𝐤: 16,052 bytes, one bit for each byte of code, 128,413 ÷ 8 rounded up
2+1+3+4,803+128,413+16,052 = 149,274: every byte used, exactly
v-blob: the last instruction, at 128,411, is jump_ind (32 00), a terminator: true
v-inst at ı = 5, accumulation's way in: bit 5 of 𝐤 is 1, and 𝐜₅ = 40 (jump) is in U
```

Then Ψ on [lesson 15.3](./03-the-machine.md)'s `SUM`, which adds 10 + 9 + … + 1, with r0
holding the halt address:

```text
steps 1 to 33     each ends ▸, so Ψ runs again
step 34           jump_ind through r0 = 2^32 − 2^16: ε = ∎, halt
Ψ returns         (∎, 0, …, φ′₂ = 55, …): ı comes back as 0
```

**In your client.** `deblob` and `startsInstruction` in `src/pvm/program.ts`, from [15.1's
code](./01-the-program-blob.md#the-code), cut the blob; `step` and `run` in
`src/pvm/machine.ts`, from [15.3's code](./03-the-machine.md#the-code), are Ψ₁ and Ψ, and
`Exit` grows to all six exits by [15.11](./11-the-gas-meter.md#the-code). Two parts are the
simple road, as the lessons say: `deblob` trusts the sizes and runs no v-blob, and `run`
leaves ı where it stopped instead of setting it to 0 on a halt or panic. The real service is
well formed, so neither shows; the [hardening
pass](https://github.com/abutlabs/the-gray-tutor/blob/main/HARDENING.md) adds both.

## (A.3) and (A.4): where an instruction ends

::: gray-paper-eq A.3

<a id="ex-A-3"></a>The Gray Paper's (A.3), [in its place in the paper's words](./02-instructions.md#eq-A-3):

$$
\begin{equation}
\text{skip}\colon\left\{ \begin{aligned}
\mathbb{N} &\to \mathbb{N}\\
i &\mapsto \min(24,\ j \in \mathbb{N} : \left(\mathbf{k} \frown \left[1, 1, \dots\right]\right)_{i + 1 + j} = 1)
\end{aligned} \right. \tag{A.3}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-Fskip">$\text{skip}$</span> | skip | skip(i): how many bytes follow the opcode at i before the next opcode, at most 24 |
| <span id="gk-N" class="gk-wrap">[$\mathbb{N}$](../symbols.md#naturals)</span> | N | the whole numbers: 0, 1, 2 and up; a subscript is a bound, ℕ₈ is 0 to 7 |
| <span id="gk-min">$\min$</span> | the least of | the smallest of the values given; min(24, j : …) is the smallest j that fits, but no more than 24 |
| <span id="gk-sq">[$\left[x\right]$](../symbols.md#sequence)</span> | the sequence | a sequence written out item by item; [ ] is the empty one |

</details>

:::

::: gray-paper-eq A.4

<a id="ex-A-4"></a>The Gray Paper's (A.4), [in its place in the paper's words](./02-instructions.md#eq-A-4):

$$
\begin{equation}
\zeta \equiv \mathbf{c} \frown \left[0, 0, \dots\right] \tag{A.4}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-instructions" class="gk-wrap">$\zeta$</span> | zeta | the code 𝐜 with zeros after it forever: reading past the end gives 0, which is trap |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |

</details>

:::

**Read it aloud.** (A.3): "skip takes a natural number and gives one: i maps to the least
of 24 and the j for which, in k followed by ones forever, the entry at i plus 1 plus j is
1." (A.4): "zeta is defined as c followed by zeros forever."

**In plain words.** The code is just bytes, and nothing in an instruction says how long it
is. The bitmask does: skip(ı) counts the bytes after the opcode at ı until the next byte
whose bit is 1, so the next instruction starts at ı + 1 + skip(ı). The ones added after 𝐤
make the last instruction end at the end of the code, and the 24 is a cap, so a broken
bitmask can't make one instruction endless. ζ does the same for the code's bytes: after
the end, it reads zeros forever. A zero is `trap`, so a machine that runs off the end
panics, and an instruction whose last argument byte is missing reads it as 0.

**On a real value.** The bootstrap code's first 16 bytes, and their bits in 𝐤:

```text
bytes   28 9a 39 01 00 28 a9 67 01 95 11 a0 7b 10 58 7b
k       1  0  0  0  0  1  0  0  0  1  0  0  1  0  0  1
skip(0)  = 4: the next 1 is at 5, so jump at 0 is 5 bytes
skip(5)  = 3: the next 1 is at 9, jump at 5 is 4 bytes
skip(9)  = 2: the next 1 is at 12, add_imm_64 at 9 is 3 bytes
the last instruction, 32 00 at 128,411: k ⌢ [1, 1, …] has its 1 at 128,413, skip = 1
ζ at 128,413, one past the end: 0, trap
```

**In your client.** `skip` and `readLE` in `src/pvm/instructions.ts`, from [15.2's
code](./02-instructions.md#the-code): `skip` stops at the end of the code (the paper's
ones), and `readLE` reads `?? 0` past it (the paper's zeros).

## (A.5) and (A.6): basic blocks

::: gray-paper-eq A.5

<a id="ex-A-5"></a>The Gray Paper's (A.5), [in its place in the paper's words](./03-the-machine.md#eq-A-5):

$$
\begin{equation}
\varpi \equiv \left(\left\{\,0\,\right\} \cup \left\{\,n + 1 + \text{skip}(n) \;\middle\vert\; n \in \mathbb{N}_{\left\vert\mathbf{c}\right\vert} \wedge \mathbf{k}_{n} = 1 \wedge \mathbf{c}_{n} \in T\,\right\}\right) \cap \left\{\,n \;\middle\vert\; \mathbf{k}_{n} = 1 \wedge \mathbf{c}_{n} \in U\,\right\} \tag{A.5}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-basicblocks" class="gk-wrap">$\varpi$</span> | pi (curly) | where basic blocks start: at 0, and just after every terminator |
| <span id="gk-build">$x \;\middle\vert\; y$</span> | for each, such that | built by a rule: the left-hand value, for every case the right-hand side allows (a set, or a sequence in order) |
| <span id="gk-Nmax">[$\mathbb{N}_{x}$](../symbols.md#naturals)</span> | N sub n | the whole numbers below n: ℕ_C is a core index, 0 to C − 1 |
| <span id="gk-wedge">$\wedge$</span> | and | both sides are true |
| <span id="gk-cap">$\cap$</span> | intersection | only what's in both sides |

</details>

:::

::: gray-paper-eq A.6

<a id="ex-A-6"></a>The Gray Paper's (A.6), [in its place in the paper's words](./03-the-machine.md#eq-A-6):

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

:::

**Read it aloud.** (A.5): "curly pi is defined as: the set of 0, together with n plus 1 plus
skip of n for every n below the length of c where bit n of k is 1 and byte n of c is in T;
all of that, kept only where it is also an n whose bit in k is 1 and whose byte in c is in
U." (A.6): "L takes a counter and gives a counter: i maps to the largest j in curly pi that is
at most i."

**In plain words.** A basic block starts at 0, and just after every terminator: a `trap`, a
`fallthrough`, a jump or a branch (the list before (A.5)). The intersection at the end
drops a "start" that isn't really an instruction, such as the one just past the code's last
instruction. ϖ is the set of those starts, and only they may be jumped to ((A.20) to
(A.22)). 𝔏(ı) walks back from ı to the start of its block: gas is charged for a whole
block, from its start ((A.8)).

**On a real value.** `SUM`, from [lesson 15.3](./03-the-machine.md#the-tests):

```text
terminators     fallthrough at 5, branch_ne_imm at 12, jump_ind at 15
5 + 1 + 0  = 6
12 + 1 + 2 = 15
15 + 1 + 1 = 17: past the end of 17 bytes of code, not an instruction: dropped
ϖ              {0, 6, 15}
𝔏(9)           6: add_imm_64 at 9 is in the loop's block
𝔏(2)           0
```

The bootstrap service's code has 6,229 basic blocks.

**In your client.** `TERMINATORS` (T) and `basicBlocks` (ϖ) in `src/pvm/machine.ts`, from
[15.3's code](./03-the-machine.md#the-code). 𝔏 isn't built: the gas meter charges the block
starting *at* ı, which is the same whenever ı starts a block, and [15.11's
note](./11-the-gas-meter.md#the-code) says when it isn't.

## (A.7): one step

::: gray-paper-eq A.7

<a id="ex-A-7"></a>The Gray Paper's (A.7), [in its place in the paper's words](./03-the-machine.md#eq-A-7):

$$
\begin{equation}
\Psi_1\colon \left\{ \begin{aligned}
\!\left\lgroup\mathbb{B}_{}, \mathbb{b}_{}, \left[\!\left[\mathbb{N}_R\right]\!\right]_{}, \mathbb{N}_R, \mathbb{N}_G, {\left\{\,\bot, \top\,\right\}}, \left[\!\left[\mathbb{N}_R\right]\!\right]_{13}, \mathbb{M}\right\rgroup\! &\to \!\left\lgroup\left\{\,\unicode{x21AF}, \blacksquare, \blacktriangleright \,\right\} \cup \left\{\,\unicode{x2132}, \hbar\,\right\} \times \mathbb{N}_R, \mathbb{N}_R, \mathbb{N}_G, {\left\{\,\bot, \top\,\right\}}, \left[\!\left[\mathbb{N}_R\right]\!\right]_{13}, \mathbb{M}\right\rgroup\!\\
\left(\mathfrak{p}, \mathbf{k}, \mathbf{j}, \imath, \varrho, \tilde{\varrho}, \varphi, {\mu}\right) &\mapsto \left(\varepsilon^*, \imath^*, \varrho^*, \tilde{\varrho}^*, \varphi^*, {\mu}^*\right)
\end{aligned} \right. \tag{A.7}
\end{equation}
$$

:::

**Read it aloud.** "Psi one takes the code, the bitmask, the jump table, a counter, gas,
the flag, thirteen registers and a memory. It gives an exit reason, which is panic, halt or
continue, or a fault or host call with a number; and a counter, gas, the flag, thirteen
registers and a memory. Psi one of all those maps to epsilon star, i star, rho star, rho
tilde star, phi star and mu star."

**In plain words.** One step's type, and a promise: the starred values are the step's
final answer, and the next five formulas build them. (A.8) pays for the block, (A.9) checks
memory, (A.12) and the tables say what the instruction does, and (A.10) and (A.11) pick
which of those wins. The set of exits here leaves out ∞, though (A.8) can end a step with
it; read it as included.

**On a real value.** `SUM`'s step 7:

```text
in      ı = 6, φ₂ = 10, φ₃ = 9; the instruction at 6 is add_64 r2 = r2 + r3
out     ε* = ▸, ı* = 9, φ*₂ = 19; everything else as it was
```

**In your client.** `step`, in [15.3's code](./03-the-machine.md#the-code), and
`stepWithGas`, which wraps it with the gas of (A.8), in [15.11's
code](./11-the-gas-meter.md#the-code).

## (A.8): paying for a block on the way in

::: gray-paper-eq A.8

<a id="ex-A-8"></a>The Gray Paper's (A.8), [in its place in the paper's words](./11-the-gas-meter.md#eq-A-8):

$$
\begin{equation}
\left(\varepsilon^{\varrho}, \varrho^*, \tilde{\varrho}'\right) = \begin{cases}
\left(\blacktriangleright, \varrho, \top\right) &\text{if } \tilde{\varrho} = \top \\
\left(\blacktriangleright, \varrho - \varrho^{\Delta}(\mathbf{c}, \mathbf{k}, \mathfrak{L}(\imath)), \top\right) &\text{otherwise if } \varrho \ge \varrho^{\Delta}(\mathbf{c}, \mathbf{k}, \mathfrak{L}(\imath)) \\
\left(\infty, \varrho, \bot\right) &\text{otherwise}
\end{cases} \tag{A.8}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-gascostforblock" class="gk-wrap">$\varrho^{\Delta}$</span> | rho delta | a basic block's gas cost: its cycles on the model CPU, less 3, and at least 1 |
| <span id="gk-ge">$\ge$</span> | is at least | greater than or equal to |

</details>

:::

**Read it aloud.** "Epsilon rho, rho star and rho tilde prime are: continue, rho and true,
if rho tilde is true; otherwise, continue, rho less the gas cost of the block that i is
in, and true, if rho is at least that cost; otherwise, out of gas, rho, and false."

**In plain words.** Gas is paid a whole basic block at a time, before any of it runs.
Three cases, in order:

1. The block is already paid for (ϱ̃ is true): nothing to pay.
2. It isn't, and there's enough gas: pay ϱ^Δ for the block that ı is in, from its start
   𝔏(ı), and set the flag.
3. There isn't enough: stop, out of gas, and take nothing.

So a machine never runs half a block and then runs dry: either the block is paid for, or
the step stops with ∞ at the block's door, gas untouched.

**On a real value.** [Lesson 15.11](./11-the-gas-meter.md#watch-it)'s run of the bootstrap
service from 5, with 100 gas:

```text
ı = 5         flag off; ϱ^Δ = 15, 100 ≥ 15: pay, ϱ = 85, flag on
ı = 92078     flag off (the jump at 5 ended its block); 26 to pay: ϱ = 59
ı = 123687    27 to pay: ϱ = 32
ı = 121410    73 to pay, 32 < 73: (∞, 32, false), and nothing runs
```

**In your client.** The first lines of `stepWithGas` in `src/pvm/gas.ts`, [15.11's
code](./11-the-gas-meter.md#the-code): `charged` is ϱ̃, and `blockCost` is ϱ^Δ.

## (A.9): touching memory

::: gray-paper-eq A.9

<a id="ex-A-9"></a>The Gray Paper's (A.9), [in its place in the paper's words](./04-memory.md#eq-A-9):

$$
\begin{equation}
\begin{aligned}
\varepsilon^{\mu} &= \begin{cases}
\blacktriangleright &\text{if } \mathbf{x} = \emptyset \\
\unicode{x21AF} &\text{if } \min(\mathbf{x}) \bmod 2^{32} < 2^{16} \\
\unicode{x2132} \times \mathsf{Z}_P\left\lfloor\min(\mathbf{x}) \bmod 2^{32} \div \mathsf{Z}_P\right\rfloor &\text{otherwise}
\end{cases}\\
\text{where } \mathbf{x} &= \left\{\,x \;\middle\vert\; x \in \mathbf{r} \wedge x \bmod 2^{32} \not\in \mathbb{V}_{{\mu}}\ \vee\ x \in \mathbf{w} \wedge x \bmod 2^{32} \not\in \mathbb{V}_{{\mu}}^*\,\right\}
\end{aligned} \tag{A.9}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-mu">$\mu$</span> | mu | the PVM's memory |
| <span id="gk-emptyset">$\emptyset$</span> | empty | the empty set: no items at all |
| <span id="gk-bmod">[$\bmod$](../symbols.md#mod)</span> | mod | the remainder after dividing: 14 mod 4 is 2 |
| <span id="gk-Cpvmpagesize" class="gk-wrap">$\mathsf{Z}_P$</span> | Z sub P | a memory page: 4,096 bytes |
| <span id="gk-floor">[$\left\lfloor x\right\rfloor$](../symbols.md#floor)</span> | floor of | rounded down to a whole number |
| <span id="gk-div">$\div$</span> | divided by | division, exact; rounded only where ⌊ ⌋, ⌈ ⌉ or rtz says so |
| <span id="gk-readable">$\mathbb{V}_{x}$</span> | V sub mu | the addresses of memory μ that may be read |
| <span id="gk-vee">$\vee$</span> | or | at least one side is true |
| <span id="gk-writable">$\mathbb{V}_{x}^*$</span> | V sub mu star | the addresses of memory μ that may be written |

</details>

:::

**Read it aloud.** "Epsilon mu is: continue, when x is empty; panic, when the least of x,
mod 2^32, is below 2^16; otherwise, a fault, times Z sub P times the floor of the least of
x, mod 2^32, over Z sub P. Where x is the set of the x that are in r with x mod 2^32 not
readable in mu, or in w with x mod 2^32 not writable in mu."

**In plain words.** 𝐫 and 𝐰 are the addresses the instruction would read and write. 𝐱 is
the bad ones: read where reading isn't allowed, or written where writing isn't. No bad
ones, carry on. Otherwise the lowest bad one decides, its address wrapped round at 2^32:
below 2^16, the first 64 kB where nothing ever lives, it's a panic; anywhere else, a page
fault, with the start of that page, the address rounded down to a multiple of 4,096.

**On a real value.** The three touches of [lesson 15.4's tests](./04-memory.md#the-tests),
on a machine with one read-only page at 0x10000 and nothing else:

```text
load_u8 from 0x30005         𝐫 = {0x30005}, no page there: 𝐱 = {0x30005}
                             0x30005 ≥ 2^16, so a fault at 4,096 × ⌊0x30005 ÷ 4,096⌋
                             = 4,096 × 48 = 0x30000: (Ⅎ, 0x30000)
load_u8 from 0x0100          𝐱 = {0x100}, and 0x100 < 2^16 = 0x10000: ↯, panic
store_imm_u8 to 0x10000      𝐰 = {0x10000}, readable but not writable: (Ⅎ, 0x10000)
```

**In your client.** `check`, with `readMemory` and `writeMemory`, in
`src/pvm/memory.ts`, [15.4's code](./04-memory.md#the-code).

## (A.10) and (A.11): which exit wins, and when the flag goes off

::: gray-paper-eq A.10

<a id="ex-A-10"></a>The Gray Paper's (A.10), [in its place in the paper's words](./11-the-gas-meter.md#eq-A-10):

$$
\begin{align}
\left(\varepsilon^*, \imath^*, \varphi^*, {\mu}^*\right) &= \begin{cases}
\left(\varepsilon^{\varrho}, \imath, \varphi, {\mu}\right) &\text{if } \varepsilon^{\varrho} \neq \blacktriangleright \\
\left(\varepsilon^{\mu}, \imath, \varphi, {\mu}\right) &\text{otherwise if } \varepsilon^{\mu} \neq \blacktriangleright \\
\left(\varepsilon, \imath', \varphi', {\mu}'\right) &\text{otherwise}
\end{cases} \tag{A.10}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-neq">$\neq$</span> | is not | not equal |

</details>

:::

::: gray-paper-eq A.11

<a id="ex-A-11"></a>The Gray Paper's (A.11), [in its place in the paper's words](./11-the-gas-meter.md#eq-A-11):

$$
\begin{equation}
\tilde{\varrho}^* = \begin{cases}
\bot &\text{if } \tilde{\varrho}' = \bot \lor (\mathbf{c}_\imath \in T \land \varepsilon^* \in \left\{\,\blacktriangleright\,\right\} \cup \left\{\,\hbar\,\right\} \times \mathbb{N}_R) \\
\top &\text{otherwise}
\end{cases} \tag{A.11}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-lor">$\lor$</span> | or | at least one side is true |

</details>

:::

**Read it aloud.** (A.10): "Epsilon star, i star, phi star, mu star are: epsilon rho, i,
phi and mu, when epsilon rho is not continue; otherwise epsilon mu, i, phi and mu, when
epsilon mu is not continue; otherwise epsilon, i prime, phi prime and mu prime." (A.11):
"Rho tilde star is false when rho tilde prime is false, or when the opcode at i is in T and
epsilon star is continue or a host call; true otherwise."

**In plain words.** A step has three verdicts, and (A.10) takes the first that isn't
"carry on": the gas's, then memory's, then the instruction's own. The first two leave ı,
the registers and the memory exactly as they were, which is why a paused machine can be
resumed. (A.11) turns the flag off after a terminator that carried on: the machine is about
to be in a new block, or at the start of the same one again, and the next step must pay.
After a fault, the flag stays on: the block was paid for, and a resumed step needn't pay
twice.

**On a real value.** `SUM` on 1,000 gas: its blocks cost 2, 21 and 22.

```text
step 1, ı = 0      flag off: pay 2 for block 0, flag on, ϱ = 998
step 3, ı = 5      fallthrough, in T, ε* = ▸: flag off
step 4, ı = 6      pay 21 for the loop's block: ϱ = 977
step 6, ı = 12     branch_ne_imm, in T, ε* = ▸: flag off, so step 7 pays 21 again
…                  ten laps of 21
step 34, ı = 15    paid 22 for its block; jump_ind halts: 2 + 10 × 21 + 22 = 234 spent
```

The bootstrap service's `ecalli` at 121,489 is not in T, so after the host answers, the
rest of its block is already paid for.

**In your client.** `stepWithGas` in `src/pvm/gas.ts`, [15.11's
code](./11-the-gas-meter.md#the-code): the gas first, then `step`, which returns a memory
error before the instruction changes anything ([15.4's `failed`](./04-memory.md#the-code)),
and `charged = false` after a terminator that continues.

## (A.12): what an instruction does unless it says otherwise

::: gray-paper-eq A.12

<a id="ex-A-12"></a>The Gray Paper's (A.12), [in its place in the paper's words](./03-the-machine.md#eq-A-12):

$$
\begin{equation}
\varepsilon = \blacktriangleright,\quad \imath' = \imath + 1 + \text{skip}(\imath),\quad \varphi' = \varphi,\quad{\mu}' = {\mu} \text{ except as indicated } \tag{A.12}
\end{equation}
$$

:::

**Read it aloud.** "Epsilon is continue, i prime is i plus 1 plus skip of i, phi prime is
phi, and mu prime is mu, except as indicated."

**In plain words.** The default every row of the tables starts from: carry on, move to the
next instruction, change nothing. A row only says what's different, so `add_64`'s row says
only which register changes, and `jump`'s only where ı goes.

**On a real value.** `load_imm r3, 10` at 2 in `SUM`, bytes `33 03 0a`:

```text
skip(2)   2: the next instruction starts at 5
ı′        2 + 1 + 2 = 5
φ′₃       10, from load_imm's row; every other register and memory as they were
ε         ▸
```

**In your client.** `step`'s `m.pc = ins.next`, before the instruction runs, in [15.3's
code](./03-the-machine.md#the-code): an instruction that jumps overwrites it.

## (A.13) to (A.18): a register, read signed or as bits

::: gray-paper-eq A.13

<a id="ex-A-13"></a>The Gray Paper's (A.13), (A.14), (A.15), (A.16), (A.17), (A.18), [in its place in the paper's words](./02-instructions.md#eq-A-13):

$$
\begin{align}
\mathcal{Z}_{n \in \mathbb{N}}&\colon\left\{ \begin{aligned}
\mathbb{N}_{2^{8n}} &\to \mathbb{Z}_{-2^{8n-1}\dots2^{8n-1}}\\
a &\mapsto \begin{cases}
a &\text{if } a < 2^{8n-1} \\
a -\ 2^{8n} &\text{otherwise}
\end{cases}
\end{aligned} \right. \tag{A.13} \\
\mathcal{Z}_{n \in \mathbb{N}}^{-1} &\colon\left\{ \begin{aligned}
\mathbb{Z}_{-2^{8n-1}\dots2^{8n-1}} &\to \mathbb{N}_{2^{8n}}\\
a &\mapsto (2^{8n} + a) \bmod 2^{8n}
\end{aligned} \right. \tag{A.14} \\
\mathcal{B}_{n\in\mathbb{N}}&\colon\left\{ \begin{aligned}
\mathbb{N}_{2^{8n}} &\to \mathbb{b}_{8n}\\
x &\mapsto \mathbf{y}: \forall i \in \mathbb{N}_{8n} : \mathbf{y}\left[i\right] \Leftrightarrow \left\lfloor\frac{x}{2^i}\right\rfloor\bmod 2
\end{aligned} \right. \tag{A.15} \\
\mathcal{B}_{n\in\mathbb{N}}^{-1}&\colon\left\{ \begin{aligned}
\mathbb{b}_{8n} &\to \mathbb{N}_{2^{8n}}\\
\mathbf{x} &\mapsto y: \sum_{i \in \mathbb{N}_{8n}} \mathbf{x}_{i} \cdot 2^i
\end{aligned} \right. \tag{A.16} \\
\overleftarrow{\mathcal{B}}_{n\in\mathbb{N}}&\colon\left\{ \begin{aligned}
\mathbb{N}_{2^{8n}} &\to \mathbb{b}_{8n}\\
x &\mapsto \mathbf{y}: \forall i \in \mathbb{N}_{8n} : \mathbf{y}[8n - 1 - i] \Leftrightarrow \left\lfloor\frac{x}{2^i}\right\rfloor\bmod 2
\end{aligned} \right. \tag{A.17} \\
\overleftarrow{\mathcal{B}}_{n\in\mathbb{N}}^{-1}&\colon\left\{ \begin{aligned}
\mathbb{b}_{8n} &\to \mathbb{N}_{2^{8n}}\\
\mathbf{x} &\mapsto y: \sum_{i \in \mathbb{N}_{8n}} \mathbf{x}_{8n - 1 - i} \cdot 2^i
\end{aligned} \right. \tag{A.18}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-signfunc">$\mathcal{Z}_{x}$</span> | Z sub n | an n-byte number read as signed: the byte 0xff is −1 |
| <span id="gk-Nbits">[$\mathbb{N}_{2^{x}}$](../symbols.md#naturals)</span> | N sub two to the n | the numbers that fit in n bits: ℕ_{2³²} is a u32 |
| <span id="gk-Z" class="gk-wrap">$\mathbb{Z}$</span> | Z | the integers, negative ones too; a subscript gives the range |
| <span id="gk-unsignfunc">$\mathcal{Z}_{x}^{-1}$</span> | Z sub n inverse | a signed number put back into n bytes: −1 becomes 0xff |
| <span id="gk-bitsfunc">$\mathcal{B}_{x}$</span> | B sub n | a number of n bytes as its 8n bits, the lowest first |
| <span id="gk-forall">$\forall$</span> | for all | for every value: ∀c ∈ ℕ_C means for each core c |
| <span id="gk-Leftrightarrow">$\Leftrightarrow$</span> | exactly when | if and only if: both sides are true together, or false together |
| <span id="gk-ffrac">$\left\lfloor\frac{x}{y}\right\rfloor$</span> | x over y, rounded down | whole-number division, the remainder dropped: ⌊7/3⌋ is 2 |
| <span id="gk-unbitsfunc">$\mathcal{B}_{x}^{-1}$</span> | B sub n inverse | 8n bits, the lowest first, back into a number |
| <span id="gk-sum">$\sum$</span> | the sum of | add up what follows, once for each value the subscript ranges over |
| <span id="gk-cdot">$\cdot$</span> | times | multiply |
| <span id="gk-revbitsfunc">$\overleftarrow{\mathcal{B}}_{x}$</span> | B sub n reversed | a number of n bytes as its 8n bits, the highest first, as people write numbers |
| <span id="gk-revunbitsfunc">$\overleftarrow{\mathcal{B}}_{x}^{-1}$</span> | B sub n reversed, inverse | 8n bits, the highest first, back into a number |

</details>

:::

**Read it aloud.** (A.13): "Z sub n takes a number that fits in 8n bits and gives an
integer from minus 2 to the 8n minus 1 up to 2 to the 8n minus 1: a maps to a if a is
below 2 to the 8n minus 1, else a minus 2 to the 8n." (A.14): "Z sub n inverse maps a to 2
to the 8n plus a, mod 2 to the 8n." (A.15): "B sub n takes a number of 8n bits and gives 8n
bits: x maps to y, where for each i, bit i of y is true exactly when x over 2 to the i,
rounded down, is odd." (A.16): "B sub n inverse maps bits x to the sum, over i, of bit i
times 2 to the i." (A.17) and (A.18): "the same, with the bits the other way round: bit 8n
minus 1 minus i."

**In plain words.** A register is 64 bits, and the same bits mean different numbers
depending on who reads them. Z_n reads n bytes as a signed number: if the top bit is set,
the number is negative, 2^{8n} below what it looks like. Z_n⁻¹ goes back. B_n lists the
bits, the lowest first (bit 0 is the 1s place), and the reversed B lists them the highest
first, as people write numbers; their inverses add the bits back up.

**On a real value.** `load_imm r6, −9` at 121,473 in the bootstrap code, bytes `33 06 f7`,
and a small number's bits:

```text
Z₁(0xf7)        0xf7 = 247, and 247 ≥ 2^7 = 128: 247 − 256 = −9
Z₈⁻¹(−9)        (2^64 − 9) mod 2^64 = 0xfffffffffffffff7, what r6 holds
B₁(5)           5 = 0b101: [1, 0, 1, 0, 0, 0, 0, 0], lowest first
B←₁(5)          [0, 0, 0, 0, 0, 1, 0, 1], highest first
```

**In your client.** `signed` in `src/pvm/instructions.ts`, [15.2's
code](./02-instructions.md#the-code), is Z_n; `s64` and `u64` in `src/pvm/arithmetic.ts`,
[15.5's code](./05-arithmetic.md#the-code), are Z₈ and Z₈⁻¹. [15.7's
code](./07-bits-and-bytes.md#the-code) reads the bits highest first, as a string, the
reversed B.

## (A.19): stretching an immediate to 64 bits

::: gray-paper-eq A.19

<a id="ex-A-19"></a>The Gray Paper's (A.19), [in its place in the paper's words](./02-instructions.md#eq-A-19):

$$
\begin{align}
\mathcal{X}_{n \in \left\{\,0, 1, 2, 3, 4, 8\,\right\}}\colon\left\{ \begin{aligned}
\mathbb{N}_{2^{8n}} &\to \mathbb{N}_R\\
x &\mapsto x + \left\lfloor\frac{x}{2^{8n-1}}\right\rfloor(2^{64}-2^{8n})
\end{aligned} \right. \tag{A.19}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-fnsext">$\mathcal{X}_{x}$</span> | X sub n | sign extension: an n-byte number stretched to 64 bits, its top bit copied into every bit above |

</details>

:::

**Read it aloud.** "X sub n, for n of 0, 1, 2, 3, 4 or 8, takes a number of 8n bits and
gives a register's value: x maps to x, plus x over 2 to the 8n minus 1 rounded down, times
2 to the 64 minus 2 to the 8n."

**In plain words.** "x over 2^{8n−1}, rounded down" is the top bit of the n bytes: 0 or 1.
If it's 0, X adds nothing. If it's 1, X adds 2^64 − 2^{8n}, which is every bit above the n
bytes set to 1. So the number keeps its meaning when read signed: an immediate of 1 byte,
`f7`, is −9, and stretched to 64 bits it is still −9. That lets an instruction carry small
negative numbers in one byte.

**On a real value.**

```text
X₁(0xf7)      top bit ⌊247 ÷ 128⌋ = 1: 247 + (2^64 − 2^8) = 0xfffffffffffffff7, −9
X₂(0x09fe)    top bit ⌊2,558 ÷ 32,768⌋ = 0: 2,558, as it was
X₀            no bytes at all: 0 (load_imm r10, 0 is just 33 0a)
```

**In your client.** `signExtend` in `src/pvm/instructions.ts`, [15.2's
code](./02-instructions.md#the-code).

## (A.20) to (A.22): jumps, branches, and jumps through the table

::: gray-paper-eq A.20

<a id="ex-A-20"></a>The Gray Paper's (A.20), [in its place in the paper's words](./03-the-machine.md#eq-A-20):

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

:::

::: gray-paper-eq A.21

<a id="ex-A-21"></a>The Gray Paper's (A.21), [in its place in the paper's words](./03-the-machine.md#eq-A-21):

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
| <span id="gk-lnot">$\lnot$</span> | not | the opposite: true becomes false, a bit 1 becomes 0 |

</details>

:::

::: gray-paper-eq A.22

<a id="ex-A-22"></a>The Gray Paper's (A.22), [in its place in the paper's words](./03-the-machine.md#eq-A-22):

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
| <span id="gk-Cpvmdynaddralign" class="gk-wrap">$\mathsf{Z}_A$</span> | Z sub A | the jump alignment, 2: a dynamic jump's address is (its jump table index + 1) × 2 |
| <span id="gk-ne">$\ne$</span> | is not | not equal |
| <span id="gk-nicefrac">${}^{x}\!/_{y}$</span> | over | a fraction: the top divided by the bottom |

</details>

:::

**Read it aloud.** (A.20): "`sjump` of b means epsilon and i prime are: panic and i, when b
is not in curly pi; continue and b, otherwise." (A.21): "`branch` of b and C means: panic and i,
when b is not in curly pi or the next instruction is not in curly pi; continue and the next
instruction, when C is false; continue and b, otherwise." (A.22): "`djump` of a means: halt
and i, when a is 2 to the 32 minus 2 to the 16; panic and i, when a is 0, or a is more
than the length of j times Z sub A, or a mod Z sub A is not 0, or entry a over Z sub A
minus 1 of j is not in curly pi; otherwise continue, and that entry."

**In plain words.** Three ways to move ı somewhere new, used by the tables' rows:

- **`sjump`**, a static jump: the target b must start a basic block, or panic.
- **`branch`**, a jump on a condition C: *both* places it could go must start a block,
  checked whether it jumps or not, so a bad branch panics every time, not only on the
  rare day it's taken.
- **`djump`**, a jump to a computed address a, through the jump table: one address,
  2^32 − 2^16, halts the machine. Any other must be a whole entry's address, (index + 1) ×
  Z_A with Z_A = 2: 2 is entry 0, 4 entry 1. 0, an odd number, or one past the table
  panics, and so does an entry that isn't a block start. The table is why a program can
  jump to an address it computed without being able to land mid-instruction.

**On a real value.** From the bootstrap service's start, [15.11's
run](./11-the-gas-meter.md#watch-it):

```text
sjump   jump at 5 → 92,078: a block start, so (▸, 92,078)
branch  branch_ne_imm at 121,444, r7 = 1, ν_X = 0, target 121,467
        121,467 and 121,447 (the next instruction) both start blocks; 1 ≠ 0: (▸, 121,467)
djump   the call at 92,098 left r0 = 2,558; returning through r0:
        2,558 isn't the halt address, isn't 0, is even, and 2,558 ≤ 1,601 × 2 = 3,202
        entry 2,558 ÷ 2 − 1 = 1,278 of 𝐣 is 92,104, a block start: (▸, 92,104)
        92,104 is just after the call, a 6-byte instruction at 92,098
```

And `SUM`'s last instruction, `jump_ind` through r0 = 2^32 − 2^16, is the first case of
(A.22): halt.

**In your client.** `jumpTo`, `branch` and `jumpIndirect` in `src/pvm/machine.ts`, [15.3's
code](./03-the-machine.md#the-code), one function each.

## (A.23): how long the arguments are

::: gray-paper-eq A.23

<a id="ex-A-23"></a>The Gray Paper's (A.23), [in its place in the paper's words](./02-instructions.md#eq-A-23):

$$
\begin{equation}
\ell \equiv \text{skip}(\imath) \tag{A.23}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-ell">$\ell$</span> | ell | a length defined nearby: in §14 the segments exported before an item; in Appendix A, the bytes after an opcode |

</details>

:::

**Read it aloud.** "ell is defined as skip of i."

**In plain words.** ℓ is the number of bytes after the opcode: everything up to the next
instruction. Every table's layout below splits those ℓ bytes into registers and numbers.

**On a real value.** `load_imm_jump` at 92,098, bytes `50 20 fe 09 65 7b`: the next
instruction starts at 92,104, so ℓ = 5, the five bytes after the opcode `50`.

**In your client.** `l` in `decodeInstruction`, [15.2's code](./02-instructions.md#the-code).

## The thirteen tables, (A.24) to (A.37)

A.5 has a table for each layout: the way an instruction's arguments sit in the ℓ bytes
after its opcode. Each table but the first opens with one formula, its layout, quoted in
[lesson 15.2](./02-instructions.md#what-the-gray-paper-says), then lists its instructions,
one row each: the opcode, the name, and what changes, its mutations, against the default
of (A.12). The rows are quoted in the lessons that run them. Below, one heading for each
table: its layout read aloud, then a few rows read in plain words and run on real
registers. Three rules hold in every layout:

- **A register is half a byte.** The byte after the opcode, ζ_{ı+1}, holds one register
  number in its low four bits (mod 16) and another in its high four (÷ 16, rounded down),
  and min(12, …) turns a number over 12 into 12. Three-register instructions put the third
  in the next byte.
- **A number takes the bytes it's given.** An immediate's length is ℓ less the bytes before
  it, at most 4, read little-endian and stretched by X ((A.19)). When there are two, the
  first one's length l_X is written in three bits of a byte, and the second gets what's
  left.
- **An offset is relative.** It's read signed (Z, (A.13)) and added to ı, so ν is the
  target itself.

## A.5.1: no arguments

This table has no layout formula, since there's nothing to read after the opcode.

**In plain words.** Three rows. `trap` (0) panics: ε = ↯. `fallthrough` (1) does
nothing but end a basic block, by an `sjump` to the next instruction, which must therefore
start a block. `unlikely` (2) has no mutations at all: it changes nothing, and only the
gas model notices it ((A.65)).

**On a real value.** `SUM`'s `fallthrough` at 5 is one byte, so skip(5) = 0 and it is
`sjump`(6); 6 is in ϖ, so (▸, 6). Without it, 6 would not start a block and the loop's
branch back to 6 would panic. In the bootstrap code, `unlikely` sits at 95, right after a
`branch_ne`.

**In your client.** `basics` in `src/pvm/machine.ts`, [15.3's
code](./03-the-machine.md#the-code), runs `trap` and `fallthrough`; `decisions`, [15.6's
code](./06-branches-and-calls.md#the-code), runs `unlikely`.

## A.5.2, (A.24): one immediate

::: gray-paper-eq A.24

<a id="ex-A-24"></a>The Gray Paper's (A.24), [in its place in the paper's words](./02-instructions.md#eq-A-24):

$$
\begin{equation}
\begin{aligned}
\text{let } l_X = \min(4, \ell) \,,\quad
\nu_X \equiv \mathcal{X}_{l_X}\left(\mathcal{E}^{-1}_{l_X}\left(\zeta_{\imath+1 \dots+ l_X}\right)\right)
\end{aligned} \tag{A.24}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-immed" class="gk-wrap">$\nu$</span> | nu | an immediate: a number written in the instruction itself; ν_X the first, ν_Y the second |
| <span id="gk-sext">$\mathcal{X}_{x}\left(y\right)$</span> | X sub n of | sign extension: an n-byte number stretched to 64 bits, its top bit copied into every bit above |
| <span id="gk-decode">[$\mathcal{E}^{-1}\left(x\right)$](../symbols.md#decode)</span> | E inverse of | decoding: bytes back into the value they encode |
| <span id="gk-subrange">$_{x \dots+ y}$</span> | from x, y of them | y items, starting at index x |

</details>

:::

**Read it aloud.** "Let l X be the least of 4 and ell; nu X is defined as X sub l X of the
l X bytes from i plus 1, decoded."

**In plain words.** One number, in the bytes after the opcode, up to 4 of them. The one row
is `ecalli` (10): the step ends with ε = ħ × ν_X, a host call, and ν_X says which.

**On a real value.** The `ecalli` at 121,489 that the bootstrap service reaches first
([lesson 15.8](./08-a-real-program.md#watch-it)):

```text
bytes     0a 02
ℓ         1, so l_X = min(4, 1) = 1
ν_X       X₁(02) = 2
row 10    ε = ħ × 2: host call 2, fetch
```

**In your client.** The `"imm"` case of `decodeInstruction`, [15.2's
code](./02-instructions.md#the-code), and `hostCall`, [15.8's
code](./08-a-real-program.md#the-code).

## A.5.3, (A.25): a register and an 8-byte immediate

::: gray-paper-eq A.25

<a id="ex-A-25"></a>The Gray Paper's (A.25), [in its place in the paper's words](./02-instructions.md#eq-A-25):

$$
\begin{equation}
\text{let } r_A = \min(12, \zeta_{\imath+1} \bmod 16) \,,\quad
{\varphi}'_A \equiv {\varphi}'_{r_A} \,,\quad
\nu_X \equiv \mathcal{E}^{-1}_{8}\left(\zeta_{\imath+2 \dots+ 8}\right) \tag{A.25}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-reg" class="gk-wrap">${\varphi}$</span> | phi | the registers: φ_A, φ_B and φ_D are the ones an instruction names, φ′ the values after it runs |

</details>

:::

**Read it aloud.** "Let r A be the least of 12 and byte i plus 1 mod 16; phi prime A is phi
prime at r A; nu X is the 8 bytes from i plus 2, decoded."

**In plain words.** The one way to put a whole 64-bit number in a register: a register in
the byte after the opcode, then exactly 8 bytes. They fill the register as they are, so
there is no X here. The one row, `load_imm_64` (20), is φ′_A = ν_X.

**On a real value.** At 600 in the bootstrap code:

```text
bytes     14 08 e0 ff ff ff 1f 00 00 00
r_A       08 mod 16 = 8
ν_X       e0 ff ff ff 1f 00 00 00, little-endian: 0x1fffffffe0 = 137,438,953,440
row 20    φ′₈ = 137,438,953,440
```

**In your client.** The `"regExtImm"` case of `decodeInstruction`, [15.2's
code](./02-instructions.md#the-code), and `load_imm_64` in `basics`, [15.3's
code](./03-the-machine.md#the-code).

## A.5.4, (A.26): two immediates

::: gray-paper-eq A.26

<a id="ex-A-26"></a>The Gray Paper's (A.26), [in its place in the paper's words](./02-instructions.md#eq-A-26):

$$
\begin{equation}
\begin{aligned}
\text{let } l_X &= \min(4, \zeta_{\imath+1} \bmod 8) \,,\quad&
\nu_X &\equiv \mathcal{X}_{l_X}\left(\mathcal{E}^{-1}_{l_X}\left(\zeta_{\imath+2 \dots+ l_X}\right)\right) \\
\text{let } l_Y &= \min(4, \max(0, \ell - l_X - 1)) \,,\quad&
\nu_Y &\equiv \mathcal{X}_{l_Y}\left(\mathcal{E}^{-1}_{l_Y}\left(\zeta_{\imath+2+l_X \dots+ l_Y}\right)\right)
\end{aligned} \tag{A.26}
\end{equation}
$$

:::

**Read it aloud.** "Let l X be the least of 4 and byte i plus 1 mod 8, and nu X be X sub l X
of the l X bytes from i plus 2. Let l Y be the least of 4 and the greater of 0 and ell less
l X less 1, and nu Y be X sub l Y of the l Y bytes from i plus 2 plus l X."

**In plain words.** Two numbers and no register. The byte after the opcode holds only the
first number's length; the first number follows, and the second takes whatever is left.
The rows, 30 to 33, are `store_imm_u8` to `store_imm_u64`: write ν_Y's low 1, 2, 4 or 8
bytes, little-endian, at address ν_X.

**On a real value.** At 14,230 in the bootstrap code, and [lesson 15.4's
test](./04-memory.md#the-tests):

```text
bytes     1e 03 78 27 03
l_X       03 mod 8 = 3; ν_X = X₃(0x032778) = 206,712 = 0x32778
ℓ = 4     l_Y = min(4, max(0, 4 − 3 − 1)) = 0; ν_Y = 0
row 30    the byte at 0x32778 becomes 0: a heap page, writable

bytes     1e 03 00 00 01 2a
ν_X       X₃(0x010000) = 0x10000; ℓ = 5, l_Y = 1, ν_Y = X₁(2a) = 42
row 30    write 42 at 0x10000; that page is read only: (Ⅎ, 0x10000) by (A.9)
```

**In your client.** The `"immImm"` case of `decodeInstruction`, [15.2's
code](./02-instructions.md#the-code), and `memoryInstructions`, [15.4's
code](./04-memory.md#the-code).

## A.5.5, (A.27): one offset

::: gray-paper-eq A.27

<a id="ex-A-27"></a>The Gray Paper's (A.27), [in its place in the paper's words](./02-instructions.md#eq-A-27):

$$
\begin{equation}
\begin{aligned}
\text{let } l_X = \min(4, \ell) \,,\quad
\nu_X \equiv \imath + \mathcal{Z}_{l_X}(\mathcal{E}^{-1}_{l_X}\left(\zeta_{\imath+1 \dots+ l_X}\right))
\end{aligned} \tag{A.27}
\end{equation}
$$

:::

**Read it aloud.** "Let l X be the least of 4 and ell; nu X is defined as i plus Z sub l X
of the l X bytes from i plus 1, decoded."

**In plain words.** One offset, read signed and added to ı: ν_X is where to go. The one
row, `jump` (40), is `sjump`(ν_X).

**On a real value.** The bootstrap code's two front doors ([lesson
15.2](./02-instructions.md#watch-it)):

```text
at 0      28 9a 39 01 00: l_X = 4, ν_X = 0 + Z₄(0x0001399a) = 80,282, refine's code
at 5      28 a9 67 01:    l_X = 3, ν_X = 5 + Z₃(0x0167a9) = 5 + 92,073 = 92,078
row 40    sjump(92,078): a block start, (▸, 92,078)
```

**In your client.** The `"offset"` case of `decodeInstruction`, [15.2's
code](./02-instructions.md#the-code): `target` is ν_X. `jump` in `basics`, [15.3's
code](./03-the-machine.md#the-code).

## A.5.6, (A.28): a register and an immediate

::: gray-paper-eq A.28

<a id="ex-A-28"></a>The Gray Paper's (A.28), [in its place in the paper's words](./02-instructions.md#eq-A-28):

$$
\begin{equation}
\begin{aligned}
\text{let } r_A &= \min(12, \zeta_{\imath+1} \bmod 16) \,,\quad&
{\varphi}_A &\equiv {\varphi}_{r_A} \,,\quad
{\varphi}'_A \equiv {\varphi}'_{r_A} \\
\text{let } l_X &= \min(4, \max(0, \ell - 1)) \,,\quad&
\nu_X &\equiv \mathcal{X}_{l_X}\left(\mathcal{E}^{-1}_{l_X}\left(\zeta_{\imath+2 \dots+ l_X}\right)\right)
\end{aligned} \tag{A.28}
\end{equation}
$$

:::

**Read it aloud.** "Let r A be the least of 12 and byte i plus 1 mod 16, with phi A and phi
prime A the register r A before and after. Let l X be the least of 4 and the greater of 0
and ell less 1; nu X is X sub l X of the l X bytes from i plus 2."

**In plain words.** A register, then a number. The rows, 50 to 62:

- `jump_ind` (50): `djump`((φ_A + ν_X) mod 2^32), a jump through the table ((A.22)).
- `load_imm` (51): φ′_A = ν_X.
- `load_u8` to `load_u64` (52 to 58): φ′_A = the 1, 2, 4 or 8 bytes at address ν_X,
  little-endian; the `_i` forms stretch them with X, so a byte 0x80 loads as −128.
- `store_u8` to `store_u64` (59 to 62): write φ_A's low 1, 2, 4 or 8 bytes at ν_X.

**On a real value.** Three rows from the bootstrap code:

```text
33 06 f7          at 121,473: r_A = 6; ℓ = 2, l_X = 1, ν_X = X₁(f7) = 2^64 − 9
row 51            φ′₆ = 0xfffffffffffffff7, −9
3e 04 00 00 03    at 106: r_A = 4; ℓ = 4, l_X = 3, ν_X = X₃(0x030000) = 0x30000
row 62            the 8 bytes at 0x30000, where w starts, become ℰ₈(φ₄)
32 00             at 408: r_A = 0; ℓ = 1, l_X = 0, ν_X = 0
row 50            djump(φ₀ mod 2^32): return through r0
```

**In your client.** The `"regImm"` case of `decodeInstruction`, [15.2's
code](./02-instructions.md#the-code); `jump_ind` and `load_imm` in `basics`, [15.3's
code](./03-the-machine.md#the-code), and the loads and stores in `memoryInstructions`,
[15.4's code](./04-memory.md#the-code).

## A.5.7, (A.29): a register and two immediates

::: gray-paper-eq A.29

<a id="ex-A-29"></a>The Gray Paper's (A.29), [in its place in the paper's words](./02-instructions.md#eq-A-29):

$$
\begin{equation}
\begin{aligned}
\text{let } r_A &= \min(12, \zeta_{\imath+1} \bmod 16) \,,\quad&
{\varphi}_A &\equiv {\varphi}_{r_A} \,,\quad
{\varphi}'_A \equiv {\varphi}'_{r_A} \\
\text{let } l_X &= \min(4, \left\lfloor\frac{\zeta_{\imath+1}}{16}\right\rfloor \bmod 8) \,,\quad&
\nu_X &= \mathcal{X}_{l_X}\left(\mathcal{E}^{-1}_{l_X}\left(\zeta_{\imath+2 \dots+ l_X}\right)\right) \\
\text{let } l_Y &= \min(4, \max(0, \ell - l_X - 1)) \,,\quad&
\nu_Y &= \mathcal{X}_{l_Y}\left(\mathcal{E}^{-1}_{l_Y}\left(\zeta_{\imath+2+l_X \dots+ l_Y}\right)\right)
\end{aligned} \tag{A.29}
\end{equation}
$$

:::

**Read it aloud.** "Let r A be the least of 12 and byte i plus 1 mod 16. Let l X be the
least of 4 and byte i plus 1 over 16, rounded down, mod 8; nu X is X sub l X of the l X
bytes from i plus 2. Let l Y be the least of 4 and the greater of 0 and ell less l X less
1; nu Y is X sub l Y of the l Y bytes after."

**In plain words.** The byte after the opcode is shared: its low half is a register, its
high half the first number's length. The rows, 70 to 73, are `store_imm_ind_u8` to
`_u64`: write ν_Y's low bytes at φ_A + ν_X, a constant stored through a register, such as
zeroing a variable on the stack.

**On a real value.** At 123,703, in [15.11's run](./11-the-gas-meter.md#watch-it), with
r1 = 0xfefdf968:

```text
bytes     49 21 b0 00
r_A       21 mod 16 = 1
l_X       ⌊0x21 ÷ 16⌋ mod 8 = 2; ν_X = X₂(0x00b0) = 176
ℓ = 3     l_Y = min(4, max(0, 3 − 2 − 1)) = 0; ν_Y = 0
row 73    the 8 bytes at 0xfefdf968 + 176 = 0xfefdfa18 become 0, on the stack
```

**In your client.** The `"regImmImm"` case of `decodeInstruction`, [15.2's
code](./02-instructions.md#the-code), and `memoryInstructions`, [15.4's
code](./04-memory.md#the-code).

## A.5.8, (A.30): a register, an immediate and an offset

::: gray-paper-eq A.30

<a id="ex-A-30"></a>The Gray Paper's (A.30), [in its place in the paper's words](./02-instructions.md#eq-A-30):

$$
\begin{equation}
\begin{aligned}
\text{let } r_A &= \min(12, \zeta_{\imath+1} \bmod 16) \,,\quad&
{\varphi}_A &\equiv {\varphi}_{r_A} \,,\quad
{\varphi}'_A \equiv {\varphi}'_{r_A} \\
\text{let } l_X &= \min(4, \left\lfloor\frac{\zeta_{\imath+1}}{16}\right\rfloor \bmod 8) \,,\quad&
\nu_X &= \mathcal{X}_{l_X}\left(\mathcal{E}^{-1}_{l_X}\left(\zeta_{\imath+2 \dots+ l_X}\right)\right) \\
\text{let } l_Y &= \min(4, \max(0, \ell - l_X - 1)) \,,\quad&
\nu_Y &= \imath + \mathcal{Z}_{l_Y}(\mathcal{E}^{-1}_{l_Y}\left(\zeta_{\imath+2+l_X \dots+ l_Y}\right))
\end{aligned} \tag{A.30}
\end{equation}
$$

:::

**Read it aloud.** "The same as the last: r A from the low half of byte i plus 1, l X from
its high half, and nu X. Let l Y be the least of 4 and the greater of 0 and ell less l X
less 1; nu Y is i plus Z sub l Y of the l Y bytes after."

**In plain words.** As A.5.7, but the second number is an offset, so ν_Y is a place in the
code. The rows, 80 to 90:

- `load_imm_jump` (80): φ′_A = ν_X and `sjump`(ν_Y), a function call. ν_X is the way back,
  as an address in the jump table.
- `branch_eq_imm` to `branch_gt_s_imm` (81 to 90): branch(ν_Y, φ_A compared with ν_X).
  The `_u` rows compare the two as unsigned numbers, the `_s` rows read both with Z₈
  first, so −1 is less than 1 only in `_s`.

**On a real value.** Two rows on [15.11's run](./11-the-gas-meter.md#watch-it):

```text
50 20 fe 09 65 7b   at 92,098: r_A = 0; l_X = 2, ν_X = X₂(0x09fe) = 2,558
                    ℓ = 5, l_Y = 2, ν_Y = 92,098 + Z₂(0x7b65) = 92,098 + 31,589 = 123,687
row 80              φ′₀ = 2,558, the way back; sjump(123,687), into the function
52 07 17            at 121,444, r7 = 1: r_A = 7; l_X = 0, ν_X = 0 (no bytes)
                    ℓ = 2, l_Y = 1, ν_Y = 121,444 + Z₁(0x17) = 121,467
row 82              branch(121,467, φ₇ ≠ 0): 1 ≠ 0, taken
```

And [lesson 15.6's test](./06-branches-and-calls.md#the-tests) on the two flavors, with
r0 = 3 and the immediate `ff`, which X makes 2^64 − 1: `branch_gt_u_imm` (86) asks
3 > 2^64 − 1, no; `branch_gt_s_imm` (90) asks 3 > −1, yes.

**In your client.** The `"regImmOffset"` case of `decodeInstruction`, [15.2's
code](./02-instructions.md#the-code), and `decisions`, [15.6's
code](./06-branches-and-calls.md#the-code).

## A.5.9, (A.31): two registers

::: gray-paper-eq A.31

<a id="ex-A-31"></a>The Gray Paper's (A.31), [in its place in the paper's words](./02-instructions.md#eq-A-31):

$$
\begin{equation}
\begin{aligned}
\text{let } r_D &= \min(12, (\zeta_{\imath+1}) \bmod 16) \,,\quad&
{\varphi}_D &\equiv {\varphi}_{r_D} \,,\quad
{\varphi}'_D \equiv {\varphi}'_{r_D} \\
\text{let } r_A &= \min(12, \left\lfloor\frac{\zeta_{\imath+1}}{16}\right\rfloor) \,,\quad&
{\varphi}_A &\equiv {\varphi}_{r_A} \,,\quad
{\varphi}'_A \equiv {\varphi}'_{r_A} \\
\end{aligned} \tag{A.31}
\end{equation}
$$

:::

**Read it aloud.** "Let r D be the least of 12 and byte i plus 1 mod 16, and r A the least
of 12 and byte i plus 1 over 16, rounded down; phi D, phi prime D, phi A and phi prime A
are those registers, before and after."

**In plain words.** One byte, two registers: D, the one written, in the low half, and A,
the one read, in the high half. Every row, 100 to 110, makes φ′_D from φ_A alone:
`move_reg` copies it; `count_set_bits`, `leading_zero_bits` and `trailing_zero_bits`
count its bits with B ((A.15)), in 64 or in the low 32; `sign_extend_8` and `_16` read the
lowest one or two bytes as signed; `zero_extend_16` keeps the lowest two; and
`reverse_bytes` turns its 8 bytes round.

**On a real value.** `move_reg` at 92,094, and [lesson 15.7's
tests](./07-bits-and-bytes.md#the-tests):

```text
64 85                 r_D = 85 mod 16 = 5, r_A = ⌊0x85 ÷ 16⌋ = 8
row 100               φ′₅ = φ₈ = 3, the argument length Y put in r8
count_set_bits_64     φ_A = 0b1011: B₈ has three 1s, φ′_D = 3
reverse_bytes         φ_A = 0x0102030405060708: φ′_D = 0x0807060504030201
```

**In your client.** The `"regReg"` case of `decodeInstruction`, [15.2's
code](./02-instructions.md#the-code); `move_reg` in `basics`, [15.3's
code](./03-the-machine.md#the-code), and the rest in `BIT_OPERATIONS`, [15.7's
code](./07-bits-and-bytes.md#the-code).

## A.5.10, (A.32): two registers and an immediate

::: gray-paper-eq A.32

<a id="ex-A-32"></a>The Gray Paper's (A.32), [in its place in the paper's words](./02-instructions.md#eq-A-32):

$$
\begin{equation}
\begin{aligned}
\text{let } r_A &= \min(12, (\zeta_{\imath+1}) \bmod 16) \,,\quad&
{\varphi}_A &\equiv {\varphi}_{r_A} \,,\quad
{\varphi}'_A \equiv {\varphi}'_{r_A} \\
\text{let } r_B &= \min(12, \left\lfloor\frac{\zeta_{\imath+1}}{16}\right\rfloor) \,,\quad&
{\varphi}_B &\equiv {\varphi}_{r_B} \,,\quad
{\varphi}'_B \equiv {\varphi}'_{r_B} \\
\text{let } l_X &= \min(4, \max(0, \ell - 1)) \,,\quad&
\nu_X &\equiv \mathcal{X}_{l_X}\left(\mathcal{E}^{-1}_{l_X}\left(\zeta_{\imath+2 \dots+ l_X}\right)\right)
\end{aligned} \tag{A.32}
\end{equation}
$$

:::

**Read it aloud.** "Let r A be the least of 12 and byte i plus 1 mod 16, and r B the least
of 12 and byte i plus 1 over 16, rounded down, each with its register before and after.
Let l X be the least of 4 and the greater of 0 and ell less 1; nu X is X sub l X of the l X
bytes from i plus 2."

**In plain words.** The biggest table, 120 to 161. Two registers in one byte, then a
number. The first eleven rows are loads and stores through a register, at address
φ_B + ν_X: `store_ind_…` write φ_A there, `load_ind_…` read into φ′_A. The rest are
arithmetic with a constant, φ′_A from φ_B and ν_X: `add_imm_64` is φ_B + ν_X mod 2^64, the
`_32` rows work on the low 32 bits and stretch the answer with X₄, the `set_…` rows give 1
or 0, and the `_alt` rows swap the two, so `shlo_r_imm_alt_64` shifts ν_X by φ_B.

**On a real value.** Four rows the bootstrap service runs in [15.11's
run](./11-the-gas-meter.md#watch-it):

```text
95 11 60 fa    at 92,078, r1 = 0xfefe0000: r_A = 1, r_B = 1; ℓ = 3, l_X = 2
               ν_X = X₂(0xfa60) = 2^64 − 1,440
row 149        φ′₁ = (0xfefe0000 + 2^64 − 1,440) mod 2^64 = 0xfefdfa60: 1,440 bytes of stack
7b 10 98 05    at 92,082: r_A = 0, r_B = 1; ν_X = X₂(0x0598) = 1,432
row 123        8 bytes at 0xfefdfa60 + 1,432 = 0xfefdfff8 become ℰ₈(φ₀), the way back
9c a7 87 4f    at 121,435, r10 = 0: r_A = 7, r_B = 10; ν_X = X₂(0x4f87) = 20,359
row 156        φ′₇ = ⌊20,359 ÷ 2^(0 mod 64)⌋ = 20,359 = 0x4f87
84 77 01       at 121,439: r_A = 7, r_B = 7; ν_X = 1
row 132        φ′₇ = 0x4f87 and 1 = 1, bit by bit
```

**In your client.** The `"regRegImm"` case of `decodeInstruction`, [15.2's
code](./02-instructions.md#the-code); the loads and stores in `memoryInstructions`, [15.4's
code](./04-memory.md#the-code), and the arithmetic in `OPERATIONS`, [15.5's
code](./05-arithmetic.md#the-code).

## A.5.11, (A.33): two registers and an offset

::: gray-paper-eq A.33

<a id="ex-A-33"></a>The Gray Paper's (A.33), [in its place in the paper's words](./02-instructions.md#eq-A-33):

$$
\begin{equation}
\begin{aligned}
\text{let } r_A &= \min(12, (\zeta_{\imath+1}) \bmod 16) \,,\quad&
{\varphi}_A &\equiv {\varphi}_{r_A} \,,\quad
{\varphi}'_A \equiv {\varphi}'_{r_A} \\
\text{let } r_B &= \min(12, \left\lfloor\frac{\zeta_{\imath+1}}{16}\right\rfloor) \,,\quad&
{\varphi}_B &\equiv {\varphi}_{r_B} \,,\quad
{\varphi}'_B \equiv {\varphi}'_{r_B} \\
\text{let } l_X &= \min(4, \max(0, \ell - 1)) \,,\quad&
\nu_X &\equiv \imath + \mathcal{Z}_{l_X}(\mathcal{E}^{-1}_{l_X}\left(\zeta_{\imath+2 \dots+ l_X}\right))
\end{aligned} \tag{A.33}
\end{equation}
$$

:::

**Read it aloud.** "Let r A be the least of 12 and byte i plus 1 mod 16, and r B the least
of 12 and byte i plus 1 over 16, rounded down. Let l X be the least of 4 and the greater of
0 and ell less 1; nu X is i plus Z sub l X of the l X bytes from i plus 2."

**In plain words.** Two registers to compare, and where to go. The rows, 170 to 175, are
branch(ν_X, φ_A compared with φ_B): `eq`, `ne`, and `lt` and `ge` unsigned and signed.
There's no `le` or `gt` with two registers: swap them and use `ge` or `lt`.

**On a real value.** At 91 in the bootstrap code, and [lesson 15.6's
test](./06-branches-and-calls.md#the-tests) on r0 = 2^64 − 1, r1 = 1:

```text
ab 37 3f 01      r_A = 7, r_B = 3; ℓ = 3, l_X = 2, ν_X = 91 + Z₂(0x013f) = 91 + 319 = 410
row 171          branch(410, φ₇ ≠ φ₃)
branch_lt_u      2^64 − 1 < 1? no: falls through
branch_lt_s      Z₈(2^64 − 1) = −1 < 1? yes: jumps
```

**In your client.** The `"regRegOffset"` case of `decodeInstruction`, [15.2's
code](./02-instructions.md#the-code), and `decisions`, [15.6's
code](./06-branches-and-calls.md#the-code).

## A.5.12, (A.34): two registers and two immediates

::: gray-paper-eq A.34

<a id="ex-A-34"></a>The Gray Paper's (A.34), [in its place in the paper's words](./02-instructions.md#eq-A-34):

$$
\begin{equation}
\begin{aligned}
\text{let } r_A &= \min(12, (\zeta_{\imath+1}) \bmod 16) \,,\quad&
{\varphi}_A &\equiv {\varphi}_{r_A} \,,\quad
{\varphi}'_A \equiv {\varphi}'_{r_A} \\
\text{let } r_B &= \min(12, \left\lfloor\frac{\zeta_{\imath+1}}{16}\right\rfloor) \,,\quad&
{\varphi}_B &\equiv {\varphi}_{r_B} \,,\quad
{\varphi}'_B \equiv {\varphi}'_{r_B} \\
\text{let } l_X &= \min(4, \zeta_{\imath+2} \bmod 8) \,,\quad&
\nu_X &= \mathcal{X}_{l_X}\left(\mathcal{E}^{-1}_{l_X}\left(\zeta_{\imath+3 \dots+ l_X}\right)\right) \\
\text{let } l_Y &= \min(4, \max(0, \ell - l_X - 2)) \,,\quad&
\nu_Y &= \mathcal{X}_{l_Y}\left(\mathcal{E}^{-1}_{l_Y}\left(\zeta_{\imath+3+l_X \dots+ l_Y}\right)\right)
\end{aligned} \tag{A.34}
\end{equation}
$$

:::

**Read it aloud.** "r A and r B from the two halves of byte i plus 1, as before. Let l X be
the least of 4 and byte i plus 2 mod 8; nu X is X sub l X of the l X bytes from i plus 3.
Let l Y be the least of 4 and the greater of 0 and ell less l X less 2; nu Y is X sub l Y
of the l Y bytes after."

**In plain words.** Two registers, then a byte for the first number's length, then two
numbers. The one row, `load_imm_jump_ind` (180), is a call through a register: φ′_A = ν_X,
the way back, and `djump`((φ_B + ν_Y) mod 2^32). φ_B is read before φ_A changes, which
matters when they are the same register.

**On a real value.** At 1,075 in the bootstrap code:

```text
bytes     b4 a0 01 18
r_A, r_B  a0: r_A = 0, r_B = 10
l_X       01 mod 8 = 1; ν_X = X₁(18) = 24
ℓ = 3     l_Y = min(4, max(0, 3 − 1 − 2)) = 0; ν_Y = 0
row 180   φ′₀ = 24, and djump(φ₁₀): the function whose address r10 holds
          the way back, 24, is entry 24 ÷ 2 − 1 = 11 of 𝐣: 1,079, just after this call
```

**In your client.** The `"regRegImmImm"` case of `decodeInstruction`, [15.2's
code](./02-instructions.md#the-code), and `decisions`, [15.6's
code](./06-branches-and-calls.md#the-code).

## A.5.13, (A.35) to (A.37): three registers, and two helpers for dividing

::: gray-paper-eq A.35

<a id="ex-A-35"></a>The Gray Paper's (A.35), [in its place in the paper's words](./02-instructions.md#eq-A-35):

$$
\begin{equation}
\begin{aligned}
\text{let } r_A &= \min(12, (\zeta_{\imath+1}) \bmod 16) \,,\quad&
{\varphi}_A &\equiv {\varphi}_{r_A} \,,\quad
{\varphi}'_A \equiv {\varphi}'_{r_A} \\
\text{let } r_B &= \min(12, \left\lfloor\frac{\zeta_{\imath+1}}{16}\right\rfloor) \,,\quad&
{\varphi}_B &\equiv {\varphi}_{r_B} \,,\quad
{\varphi}'_B \equiv {\varphi}'_{r_B} \\
\text{let } r_D &= \min(12, \zeta_{\imath+2}) \,,\quad&
{\varphi}_D &\equiv {\varphi}_{r_D} \,,\quad
{\varphi}'_D \equiv {\varphi}'_{r_D} \\
\end{aligned} \tag{A.35}
\end{equation}
$$

:::

::: gray-paper-eq A.36

<a id="ex-A-36"></a>The Gray Paper's (A.36), [in its place in the paper's words](./05-arithmetic.md#eq-A-36):

$$
\begin{equation}
\text{smod}\colon\left\{ \begin{aligned}
\!\left\lgroup\mathbb{Z}, \mathbb{Z}\right\rgroup\! &\to \mathbb{Z}\\
\left(a, b\right) &\mapsto \begin{cases}
a &\text{if } b = 0\\
\text{sgn}(a) \cdot (\left\vert a\right\vert \bmod \left\vert b\right\vert) &\text{otherwise} \\
\end{cases}
\end{aligned} \right. \tag{A.36}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-smod">$\text{smod}$</span> | signed mod | the remainder of the sizes, with the sign of the number divided: smod(−7, 2) is −1 |

</details>

:::

::: gray-paper-eq A.37

<a id="ex-A-37"></a>The Gray Paper's (A.37), [in its place in the paper's words](./05-arithmetic.md#eq-A-37):

$$
\begin{equation}
\text{rtz}\colon\left\{ \begin{aligned}
\mathbb{Z} &\to \mathbb{Z}\\
x &\mapsto \begin{cases}
\left\lceil x\right\rceil &\text{if } x < 0\\
\left\lfloor x\right\rfloor &\text{otherwise} \\
\end{cases}
\end{aligned} \right. \tag{A.37}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-rtz">$\text{rtz}$</span> | round toward zero | a division's answer rounded toward zero: −3.5 becomes −3, 3.5 becomes 3 |
| <span id="gk-ceil">$\left\lceil x\right\rceil$</span> | ceiling of | rounded up to a whole number |

</details>

:::

**Read it aloud.** (A.35): "Let r A be the least of 12 and byte i plus 1 mod 16, r B the
least of 12 and byte i plus 1 over 16, rounded down, and r D the least of 12 and byte i
plus 2; each with its register before and after." (A.36): "smod takes two integers and
gives one: a and b map to a, when b is 0; otherwise the sign of a, times the size of a mod
the size of b." (A.37): "rtz takes a number and gives an integer: x maps to x rounded up
when x is below 0, and x rounded down otherwise."

**In plain words.** Two inputs, φ_A and φ_B, and an output, φ′_D. The rows, 190 to 230,
are the arithmetic of a real CPU: add, subtract, multiply, divide and remainder, in 32 and
64 bits, signed and unsigned; shifts and rotations; and, or, xor and their inverted forms;
comparisons, conditional moves, min and max. The paper's own corners are worth knowing:

- a `_32` row works mod 2^32 and stretches the answer with X₄, so a 32-bit result that
  looks negative fills the top 32 bits with 1s;
- dividing by zero never fails: `div` gives 2^64 − 1, `rem` gives back φ_A;
- signed division rounds toward zero, which is rtz, and the signed remainder takes the sign
  of the number divided, which is smod.

**On a real value.** `SUM`'s `add_64`, and [lesson 15.5's
tests](./05-arithmetic.md#the-tests):

```text
c8 32 02        add_64 at 6: r_A = 2, r_B = 3, r_D = 2
row 200         at step 7, φ₂ = 10, φ₃ = 9: φ′₂ = (10 + 9) mod 2^64 = 19
add_32          φ_A = 2^31 − 1, φ_B = 1: (2^31) mod 2^32 = 0x80000000
                X₄(0x80000000) = 0xffffffff80000000, which is −2^31
div_u_64        φ_B = 0: φ′_D = 2^64 − 1
div_s_64        −7 ÷ 2 = −3.5; rtz(−3.5) = ⌈−3.5⌉ = −3
rem_s_64        smod(−7, 2) = sgn(−7) × (7 mod 2) = −1 × 1 = −1
                smod(7, −3) = sgn(7) × (7 mod 3) = 1
```

**In your client.** The `"regRegReg"` case of `decodeInstruction`, [15.2's
code](./02-instructions.md#the-code); `OPERATIONS` and `arithmetic`, [15.5's
code](./05-arithmetic.md#the-code). There, rtz and smod come free: JavaScript's `/` on a
`bigint` rounds toward zero, and its `%` keeps the sign of the number divided.

## (A.38) to (A.40): running with a host

::: gray-paper-eq A.38

<a id="ex-A-38"></a>The Gray Paper's (A.38), (A.39), (A.40), [in its place in the paper's words](./08-a-real-program.md#eq-A-38):

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
| <span id="gk-contextmutator">$\Omega\left\langle x\right\rangle$</span> | omega of X | a host's function: given a host call's number, the gas, registers, memory and the host's own context X, it says carry on or stop, with all of them updated |
| <span id="gk-signedgas" class="gk-wrap">$\mathbb{Z}_G$</span> | Z sub G | gas that can go negative: an i64 |
| <span id="gk-bigwedge">$\bigwedge$</span> | all of | every one of the conditions under it is true |

</details>

:::

**Read it aloud.** (A.38): "Psi H star takes a blob, a counter, gas, the flag, thirteen
registers, a memory, a host function f of type Omega of X, and an x in X. It gives an exit,
which is panic, out of gas or halt, or a fault with an address; a counter, gas that may be
negative, the flag, registers, memory and an x. First, let epsilon prime and the primed
values be Psi of the first six. If epsilon prime is halt, panic, out of gas or a fault: give
those back, with x as it was. If epsilon prime is a host call h, and f of h, the primed gas,
registers, memory and x says continue, with double-primed gas, registers, memory and x: Psi
H star again, from i double prime, which is i prime plus 1 plus skip of i prime. If f says
panic, halt or out of gas: give that back, with i prime and the double-primed values."
(A.39): "Psi H of the same, without the flag, is Psi H star with the flag false." (A.40):
"Omega of X is the type of a function from a number, gas, registers, memory and an X to:
continue, halt, panic or out of gas, with gas, registers, memory and an X."

**In plain words.** Ψ stops on every host call and waits. Ψ_H is the loop that answers
them: it hands each call to the host's function f, with x, the host's own context (for
accumulation, the accounts as the service changes them). If f says carry on, the machine
carries on after the `ecalli`, from its next instruction. If f says stop, so does Ψ_H. So Ψ_H
never ends with a host call: it ends with halt, panic, out of gas or a fault. Gas comes back
as Z_G, a signed number, since a host call may charge more than is left. Ψ_H starts with the
flag false, so the first block is paid for, and the flag passes through a host call
unchanged: `ecalli` isn't a terminator.

**On a real value.** Service 1729's accumulation in the vector `always_accumulate-1`, from
[lesson 16.6's run](../16-host-calls/06-checkpoints.md#watch-it), on 100,000 gas:

```text
Ψ stops with ħ × 2     f answers fetch: ▸, φ₇ = 122, 99,367 gas left; Ψ_H runs on
Ψ stops with ħ × 1     grow_heap: ▸, 98,728 left
…                      seven host calls in all, each answered ▸
Ψ stops with ∎         halt: Ψ_H gives back ∎ and the gas left, 83,583
```

**In your client.** `runWithHost`, [16.1's code](../16-host-calls/01-calling-the-host.md#the-code):
`runWithGas` until a host call, the host's answer, and on again.

## (A.41) to (A.45): a standard program, and the room it needs

::: gray-paper-eq A.41

<a id="ex-A-41"></a>The Gray Paper's (A.41), [in its place in the paper's words](./01-the-program-blob.md#eq-A-41):

$$
\begin{equation}
Y\colon\left\{ \begin{aligned}
\!\left\lgroup\mathbb{B}_{}, \mathbb{B}_{:\mathsf{Z}_I}\right\rgroup\! &\to \!\left\lgroup\mathbb{B}_{}, \left[\!\left[\mathbb{N}_R\right]\!\right]_{13}, \mathbb{M}\right\rgroup\!? \\
\left(\mathfrak{j}, \mathbf{a}\right) &\mapsto \begin{cases}
\left(\mathfrak{p}, \varphi, {\mu}\right) &\text{if } \exists! \left(\mathfrak{p}, \mathbf{o}, \mathbf{w}, z, s\right) \text{ which satisfy equation A.42}\\
\emptyset &\text{otherwise}
\end{cases}
\end{aligned} \right. \tag{A.41}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-Cpvminitinputsize" class="gk-wrap">$\mathsf{Z}_I$</span> | Z sub I | the most argument data a program can be given: 2^24 bytes, 16 MiB |
| <span id="gk-jam-blob" class="gk-wrap">$\mathfrak{j}$</span> | j (gothic) | a standard program: four sizes, the read-only and read-write data, then the PVM blob |

</details>

:::

::: gray-paper-eq A.42

<a id="ex-A-42"></a>The Gray Paper's (A.42), (A.43), (A.44), (A.45), [in its place in the paper's words](./01-the-program-blob.md#eq-A-42):

$$
\begin{align}
&\text{let } \mathcal{E}_3(\left\vert\mathbf{o}\right\vert) \frown \mathcal{E}_3(\left\vert\mathbf{w}\right\vert) \frown \mathcal{E}_2(z) \frown \mathcal{E}_3(s) \frown \mathbf{o} \frown \mathbf{w} \frown \mathcal{E}_4(\left\vert\mathfrak{p}\right\vert) \frown \mathfrak{p} = \mathfrak{j} \tag{A.42} \\
&\mathsf{Z}_Z = 2^{16}\ ,\quad\mathsf{Z}_I = 2^{24} \tag{A.43} \\
&\text{let } P(x \in \mathbb{N}) \equiv \mathsf{Z}_P\left\lceil \frac{x}{\mathsf{Z}_P} \right\rceil\quad,\qquad Z(x \in \mathbb{N}) \equiv \mathsf{Z}_Z\left\lceil \frac{x}{\mathsf{Z}_Z} \right\rceil \tag{A.44} \\
&5\mathsf{Z}_Z + Z(\left\vert\mathbf{o}\right\vert) + Z(\left\vert\mathbf{w}\right\vert + z\mathsf{Z}_P) + Z(s) + \mathsf{Z}_I \leq 2^{32} \tag{A.45}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-Cpvminitzonesize" class="gk-wrap">$\mathsf{Z}_Z$</span> | Z sub Z | a zone: 2^16 bytes, 64 KiB; memory's sections start on zones, with an empty one between |
| <span id="gk-rnp">$P(x)$</span> | P of | x rounded up to whole pages of 4,096 bytes |
| <span id="gk-frac">$\frac$</span> | over | a fraction: the top divided by the bottom |
| <span id="gk-rnq">$Z(x)$</span> | Z of | x rounded up to whole zones of 65,536 bytes |
| <span id="gk-leq">$\leq$</span> | at most | less than or equal to |

</details>

:::

**Read it aloud.** (A.41): "Y takes a blob and a blob of at most Z sub I bytes, and gives a
blob, thirteen registers and a memory, or nothing. Y of j and a is p, phi, mu, when exactly
one p, o, w, z, s satisfy the conditions; nothing otherwise." (A.42): "Let the 3-byte size
of o, the 3-byte size of w, z in 2 bytes, s in 3 bytes, o, w, the 4-byte size of p, and p,
joined, be j." (A.43): "Z sub Z is 2 to the 16, and Z sub I is 2 to the 24." (A.44): "Let P
of x be Z sub P times x over Z sub P, rounded up, and Z of x be Z sub Z times x over Z sub
Z, rounded up." (A.45): "Five Z sub Z, plus Z of the size of o, plus Z of the size of w plus
z pages, plus Z of s, plus Z sub I, is at most 2 to the 32."

**In plain words.** A standard program 𝔧 is a PVM blob with a memory plan in front: o, data
the program may only read; w, data it may read and write, with z pages of zeroed heap after
it; and s, the size of its stack. (A.42) is the layout, and exactly one way to read it must
use every byte. Memory is planned in zones of Z_Z = 64 kB: P rounds a size up to whole pages
of 4,096 bytes, and Z up to whole zones. (A.45) says it all fits in 2^32 bytes: the four
sections, each in whole zones, the arguments' Z_I = 16 MiB, and five empty zones: one below
everything, one between each pair of neighbors, and one at the very top. If any of this fails, Y is ∅, and the
machine never starts.

**On a real value.** The bootstrap service's code, after its 80 bytes of metadata:

```text
b0 26 00        ℰ₃(|o|) = 9,904 bytes of read-only data
30 00 00        ℰ₃(|w|) = 48 bytes of read-write data
02 00           ℰ₂(z) = 2 pages of heap
00 20 00        ℰ₃(s) = 8,192 bytes of stack
…               o, 9,904 bytes, then w, 48 bytes
1a 47 02 00     ℰ₄(|𝔭|) = 149,274, then the blob: (A.1)'s 86 41 03 …
(A.45)          5 × 65,536 + Z(9,904) + Z(48 + 2 × 4,096) + Z(8,192) + 2^24
                = 327,680 + 65,536 + 65,536 + 65,536 + 16,777,216
                = 17,301,504 ≤ 4,294,967,296: it fits
```

**In your client.** `unpackCode` in `src/pvm/program.ts`, [15.1's
code](./01-the-program-blob.md#the-code), reads (A.42); `ZONE`, `INPUT_SIZE` and `roundUp`
in `src/pvm/standard.ts`, [15.8's code](./08-a-real-program.md#the-code), are Z_Z, Z_I, P
and Z. The check of (A.45), and Y's ∅, are the simple road that 15.8's note leaves to the
[hardening pass](https://github.com/abutlabs/the-gray-tutor/blob/main/HARDENING.md).

## (A.46) and (A.47): the starting memory and registers

::: gray-paper-eq A.46

<a id="ex-A-46"></a>The Gray Paper's (A.46), [in its place in the paper's words](./08-a-real-program.md#eq-A-46):

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
| <span id="gk-ram-value" class="gk-wrap">$\mathbf{v}$</span> | v | memory's bytes |
| <span id="gk-ram-access" class="gk-wrap">$\mathbf{a}$</span> | a | memory's access: for each page, readable, writable or neither |
| <span id="gk-bracegroup">$\left\{ x \right.$</span> | as follows | a brace grouping cases: the line whose condition holds gives the value |
| <span id="gk-is">$x\mathrel{\unicode{x2AF6}} y$</span> | is a | names a field and gives its type, in a tuple |

</details>

:::

::: gray-paper-eq A.47

<a id="ex-A-47"></a>The Gray Paper's (A.47), [in its place in the paper's words](./08-a-real-program.md#eq-A-47):

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

:::

**Read it aloud.** (A.46): "For every address i below 2 to the 32, the byte at i and the
access of its page are: o's byte i less Z sub Z, read only, from Z sub Z up to Z sub Z plus
the size of o; zero, read only, from there to Z sub Z plus P of the size of o; w's byte, writable,
from 2 Z sub Z plus Z of the size of o, for the size of w; zero, writable, on to the end of
w's pages and z more pages; zero, writable, the P of s bytes below 2 to the 32 less 2 Z sub Z
less Z sub I; a's byte, read only, from 2 to the 32 less Z sub Z less Z sub I, for the size of
a; zero, read only, to the end of a's pages; and otherwise zero, with no access." (A.47):
"For every i below 13, register i is: 2 to the 32 less 2 to the 16, when i is 0; 2 to the 32
less 2 Z sub Z less Z sub I, when i is 1; 2 to the 32 less Z sub Z less Z sub I, when i is 7;
the size of a, when i is 8; and 0 otherwise."

**In plain words.** The memory a program wakes up in, from the bottom: nothing in the first
zone; o, read only, one zone up, padded with zeros to a whole page; an empty zone; w,
writable, padded to a page, then the heap's z pages; then nothing for most of the 4 GB; at
the top, the stack, writable, ending two zones and Z_I below 2^32; an empty zone; the
arguments a, read only; and one last empty zone. The registers tell the program where things
are: r0 is the halt address, so returning from the program ends it; r1 is the top of the
stack, which grows down; r7 is where the arguments start, and r8 how many bytes they are.

**On a real value.** The bootstrap service, started with the arguments `01 00 00` (slot 1,
service 0, no inputs), as [lesson 15.8](./08-a-real-program.md#the-tests) starts it:

```text
0x10000 to 0x126b0         o, 9,904 bytes, read only
0x126b0 to 0x13000         zeros, read only: P(9,904) = 12,288, three pages
0x30000 to 0x30030         w, 48 bytes, writable: 2 × 0x10000 + Z(9,904) = 0x30000
0x30030 to 0x33000         zeros, writable: P(48) + 2 × 4,096 = 0x3000
0xfefde000 to 0xfefe0000   the stack, 8,192 bytes, writable
0xfeff0000 to 0xfeff0003   a, 01 00 00, read only
0xfeff0003 to 0xfeff1000   zeros, read only
everywhere else            no access
φ₀ = 0xffff0000, φ₁ = 0xfefe0000, φ₇ = 0xfeff0000, φ₈ = 3, the rest 0
```

**In your client.** `standardProgram` in `src/pvm/standard.ts`, [15.8's
code](./08-a-real-program.md#the-code): a line for each section, then the four registers.

## (A.48): the call the rest of the paper makes

::: gray-paper-eq A.48

<a id="ex-A-48"></a>The Gray Paper's (A.48), [in its place in the paper's words](./08-a-real-program.md#eq-A-48):

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
| <span id="gk-Nrange">$\mathbb{N}_{x \dots+ y}$</span> | N from x, y of them | the y whole numbers from x on: x, x + 1, up to x + y − 1 |
| <span id="gk-subseteq">$\subseteq$</span> | is a subset of | everything in the left is in the right |

</details>

:::

**Read it aloud.** "Psi M takes a blob, a counter, gas, at most Z sub I bytes of arguments,
a host function and an x. It gives the gas used, the result, which is a blob or panic or out
of gas, and an x. It is: 0, panic and x, when Y of j and a is nothing; otherwise R of the gas
and Psi H of p, i, the gas, the registers, the memory, f and x. Where R gives: u, out of gas
and x prime, when epsilon is out of gas; u, the memory from phi prime 7 for phi prime 8
bytes, and x prime, when epsilon is halt and those bytes are readable; u, an empty blob and
x prime, when it halted but they aren't; and u, panic and x prime otherwise. And u is the
gas given less the greater of the gas left and 0."

**In plain words.** The one door the rest of the paper uses: Is-Authorized, refine and
accumulate all call Ψ_M (Appendix B). It lays the program out with Y, runs it with the
host's f through Ψ_H from ı, and turns how it ended into an answer. A halt's answer is the
bytes the program left at φ′₇, φ′₈ of them; a panic or a fault is ↯, out of gas is ∞. And it
says how much gas was used, never more than was given, even when a host call drove the gas
below 0.

**On a real value.** Service 1729 again, [lesson 16.6's
run](../16-host-calls/06-checkpoints.md#watch-it):

```text
Y            the service's code and a = 2b 86 c1 00 (slot 43, service 1729, 0 inputs)
Ψ_H          from ı = 5, accumulation's way in, on 100,000 gas: ∎, 83,583 left
u            100,000 − max(83,583, 0) = 16,417, what the vector says it used
```

**In your client.** `accumulate` in `src/host.ts`, [16.6's
code](../16-host-calls/06-checkpoints.md#the-code), is Ψ_M for accumulation, written out:
`standardProgram`, `runWithHost` from 5, and `gasUsed`, u. It reads a halt's output only
when it's the 32 bytes accumulation can use.

## (A.49) to (A.53): the model CPU's state

::: gray-paper-eq A.49

<a id="ex-A-49"></a>The Gray Paper's (A.49), [in its place in the paper's words](./10-the-pipeline.md#eq-A-49):

$$
\begin{equation}
\mathbb{S} \equiv \!\left\lgroup
\imath\in \mathbb{N}_R \cup \left\{\,\emptyset\,\right\},
c\in \mathbb{N},
d\in \mathbb{N},
e\in \mathbb{N},
t\in \mathbb{E},
\mathbf{r}\in \left[\!\left[\mathbb{R}\right]\!\right]_{}
\right\rgroup\!\\ \tag{A.49}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-gas-sim-ty" class="gk-wrap">$\mathbb{S}$</span> | S | the model CPU's state: where it decodes, its clock, what is left this cycle, and its reorder buffer |
| <span id="gk-isa">[$x\in y$](../symbols.md#in)</span> | in | belongs to: the field's type |
| <span id="gk-ctr-cycles">$c$</span> | c | the model CPU's clock: the cycles so far |
| <span id="gk-remaining-decodeslots">$d$</span> | d | decode slots left this cycle, out of 4 |
| <span id="gk-remaining-startpercycle">$e$</span> | e | how many more instructions may start this cycle, out of 5 |
| <span id="gk-remaining-execunits">$t$</span> | t | the execution units free right now, of each kind |
| <span id="gk-execunits-ty" class="gk-wrap">$\mathbb{E}$</span> | E | a count of each kind of execution unit: ALU, load, store, multiply, divide |
| <span id="gk-rob" class="gk-wrap">$\mathbf{r}$</span> | r | the reorder buffer: decoded instructions, in order, waiting, running or finished |
| <span id="gk-rob-entry-ty" class="gk-wrap">$\mathbb{R}$</span> | R | a reorder buffer entry: its state, its cycles left, what it waits on, the registers it makes, the units it uses |

</details>

:::

::: gray-paper-eq A.50

<a id="ex-A-50"></a>The Gray Paper's (A.50), [in its place in the paper's words](./10-the-pipeline.md#eq-A-50):

$$
\begin{equation}
\mathbb{R} \equiv \!\left\lgroup
s\in \left\{\,\text{DEC}, \text{WAIT}, \text{EXE}, \text{FIN}, \emptyset\,\right\},
c\in \mathbb{N},
p \subseteq \mathbb{N},
r \subseteq \mathbb{N}_{13},
t\in \mathbb{E}
\right\rgroup\!\\ \tag{A.50}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-rob-state">$s$</span> | s | an entry's state: decoding, waiting, executing, finished, or retired (∅) |
| <span id="gk-rob-state-ty">$\left\{\,\text{DEC}, \text{WAIT}, \text{EXE}, \text{FIN}, \emptyset\,\right\}$</span> | the states | DEC decoding, WAIT waiting, EXE executing, FIN finished, ∅ retired |
| <span id="gk-rob-deps">$p$</span> | p | the entries this one waits on: those making a register it reads |
| <span id="gk-rob-regs">$r$</span> | r | the registers this entry will make, until a later entry takes one over |

</details>

:::

::: gray-paper-eq A.51

<a id="ex-A-51"></a>The Gray Paper's (A.51), [in its place in the paper's words](./10-the-pipeline.md#eq-A-51):

$$
\begin{equation}
\mathbb{E} \equiv \!\left\lgroup
\text{A}\in \mathbb{N},
\text{L}\in \mathbb{N},
\text{S}\in \mathbb{N},
\text{M}\in \mathbb{N},
\text{D}\in \mathbb{N}
\right\rgroup\! \tag{A.51}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-ALU">$\text{A}$</span> | A | arithmetic units: the model CPU has 4 |
| <span id="gk-LOAD">$\text{L}$</span> | L | load units: the model CPU has 4 |
| <span id="gk-STORE">$\text{S}$</span> | S | store units: the model CPU has 4 |
| <span id="gk-MUL">$\text{M}$</span> | M | multiply units: the model CPU has 1 |
| <span id="gk-DIV">$\text{D}$</span> | D | divide units: the model CPU has 1 |

</details>

:::

::: gray-paper-eq A.52

<a id="ex-A-52"></a>The Gray Paper's (A.52), [in its place in the paper's words](./10-the-pipeline.md#eq-A-52):

$$
\begin{equation}
\begin{aligned}
\forall a,b \in \mathbb{E};\forall \oplus \in \left\{\,+, -\,\right\}&: a \oplus b \equiv c\\
\text{where } c \in \mathbb{E}, \forall k \in \left\{\,\text{A}, \text{L}, \text{S}, \text{M}, \text{D}\,\right\}&:c_k \equiv a_k \oplus b_k\\
\end{aligned} \tag{A.52}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-oplus">$\oplus$</span> | o plus | in the instruction tables, xor: one or the other but not both; in the gas model, any one of the operations listed beside it |

</details>

:::

::: gray-paper-eq A.53

<a id="ex-A-53"></a>The Gray Paper's (A.53), [in its place in the paper's words](./10-the-pipeline.md#eq-A-53):

$$
\begin{equation}
\begin{aligned}
&\forall a,b \in \mathbb{E};\forall \oplus \in \left\{\,<, >, \le, \ge\,\right\}: \\
&\quad a \oplus b \equiv \bigwedge_{k \in \left\{\,\text{A}, \text{L}, \text{S}, \text{M}, \text{D}\,\right\}} a_k \oplus b_k
\end{aligned} \tag{A.53}
\end{equation}
$$

:::

**Read it aloud.** (A.49): "S is defined as the tuple of: i, a counter or nothing; c, d and
e, each a natural; t, in E; and r, a sequence of R." (A.50): "R is the tuple of: s, which is
DEC, WAIT, EXE, FIN or nothing; c, a natural; p, a subset of the naturals; r, a subset of
the naturals below 13; and t, in E." (A.51): "E is the tuple of A, L, S, M and D, each a
natural." (A.52): "For all a and b in E, and for plus or minus: a with it b is defined as c,
where c is in E, and for each kind k, c k is a k with it b k." (A.53): "For all a and b in E,
and for less, more, at most or at least: a compared with b is defined as: that comparison
holds for every kind k."

**In plain words.** The gas model prices a block by imagining a small CPU running it. Its
state, 𝕊: ı, the next instruction to decode (∅ once the block's terminator is decoded); c,
the clock; d and e, the decode slots and starts left this cycle; t, the free execution
units; and 𝐫, the reorder buffer, every decoded instruction in order. Each entry, ℝ, holds
its state, its cycles left, p, the entries it waits on, r, the registers it will make, and t,
the units it holds. 𝔼 counts units by kind: ALU, load, store, multiply, divide. (A.52) and
(A.53) let the paper add, take away and compare those counts all at once, kind by kind:
units fit only if every kind fits.

**On a real value.** The block at 92,078, [lesson 15.10](./10-the-pipeline.md#watch-it)'s:

```text
start          ı = 92,078, c = 0, d = 4, e = 5, t = (4, 4, 4, 1, 1), 𝐫 = [ ]
an entry       the store at 92,082 once decoded: (DEC, 25, {0}, { }, (1, 0, 1, 0, 0))
(A.52)         (4, 4, 4, 1, 1) − (1, 0, 1, 0, 0) = (3, 4, 3, 1, 1)
(A.53)         (1, 0, 1, 0, 0) ≤ (1, 4, 1, 1, 1): true, kind by kind
               (1, 0, 1, 0, 0) ≤ (0, 4, 1, 1, 1): false, no ALU left
```

**In your client.** `Cpu`, `Entry`, `State`, `Units` and `plus` in `src/pvm/gas.ts`,
[15.9's code](./09-what-instructions-cost.md#the-code) and [15.10's
code](./10-the-pipeline.md#the-code).

## (A.54): a block's gas

::: gray-paper-eq A.54

<a id="ex-A-54"></a>The Gray Paper's (A.54), [in its place in the paper's words](./10-the-pipeline.md#eq-A-54):

$$
\begin{equation}
\varrho^{\Delta}\colon
\left\{
\begin{array}{@{}l@{}}
\begin{aligned}
\left(\mathbb{B}_{}, \mathbb{b}_{}, \mathbb{N}_R\right) &\to \mathbb{N}\\
\left(\mathbf{c}, \mathbf{k}, \imath\right) &\mapsto \max(\mathbf{x}^{\text{final}}_{c} - 3, 1)\\
\end{aligned}
\\[14pt]
\hspace{8pt}\begin{aligned}
\text{where } &\mathbf{x}^{\text{final}} &=&\text{ }\mathfrak{X}(\mathbf{c}, \mathbf{k}, \mathbf{x}^{\text{init}})\\
&\mathbf{x}^{\text{init}} &=&\text{ }\left(\imath, 0, 4, 5, \left(4, 4, 4, 1, 1\right), \left[\right]\right)
\end{aligned}
\end{array}
\right.
\tag{A.54}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-gas-sim-state" class="gk-wrap">$\mathbf{x}$</span> | x | a state of the model CPU, one of 𝕊 |
| <span id="gk-gas-sim" class="gk-wrap">$\mathfrak{X}$</span> | X (gothic) | the model CPU: runs a basic block step by step until every instruction has retired |
| <span id="gk-const-maxdecodepercycle">$4$</span> | 4 | decode slots each cycle |
| <span id="gk-const-maxstartpercycle">$5$</span> | 5 | the most instructions that may start each cycle |

</details>

:::

**Read it aloud.** "Rho delta takes the code, the bitmask and a counter, and gives a
natural: c, k, i maps to the greater of x final's c less 3, and 1. Where x final is X of c,
k and x initial, and x initial is: i, 0, 4, 5, (4, 4, 4, 1, 1), and an empty buffer."

**In plain words.** A block's gas is the cycles the model CPU takes to run it, from a
standing start until every instruction has retired, less 3, the pipeline's own overhead,
and never less than 1. The CPU starts at the block's first instruction, at cycle 0, with 4
decode slots, 5 starts, 4 ALUs, 4 load units, 4 store units, a multiplier and a divider,
and nothing in its buffer.

**On a real value.**

```text
92,078       x final's c = 29: ϱ^Δ = max(29 − 3, 1) = 26, not the 91 its cycles add up to
SUM, 0       ϱ^Δ = 2; SUM, 6: 21; SUM, 15: 22
a lone trap  2 cycles; a lone jump, 15: one instruction costs its own cycles
```

**In your client.** `blockCost` in `src/pvm/gas.ts`, [15.10's
code](./10-the-pipeline.md#the-code).

## (A.55): the model CPU's loop

::: gray-paper-eq A.55

<a id="ex-A-55"></a>The Gray Paper's (A.55), [in its place in the paper's words](./10-the-pipeline.md#eq-A-55):

$$
\begin{equation}
\mathfrak{X}\colon \left\{ \begin{aligned}
\left(\mathbb{B}_{}, \mathbb{b}_{}, \mathbb{S}\right) &\to \mathbb{S} \\
\left(\mathbf{c}, \mathbf{k}, \mathbf{x}\right) &\mapsto \begin{cases}
\mathfrak{X}(\mathbf{c}, \mathbf{k}, \mathfrak{X}'(\mathbf{c}, \mathbf{k}, \mathbf{x})) &\text{if } \mathbf{x}_{\imath} \neq \emptyset \land \check{d}(\mathbf{c}, \mathbf{k}, \mathbf{x}_{\imath}) \leq \mathbf{x}_{d} \land l < 32 \\
\mathfrak{X}(\mathbf{c}, \mathbf{k}, \mathfrak{X}''(\mathbf{x})) &\text{otherwise if } \mathfrak{S}(\mathbf{x}) \neq \emptyset \land \mathbf{x}_{e} > 0 \\
\mathbf{x} &\text{otherwise if } \mathbf{x}_{\imath} = \emptyset \land l = 0 \\
\mathfrak{X}(\mathbf{c}, \mathbf{k}, \mathfrak{X}'''(\mathbf{x})) &\text{otherwise} \\
\end{cases}\\
\text{where } l &= \left\vert\left[r \;\middle\vert\;  r \mathrel{\unicode{x2B40}} {\mathbf{x}_{\mathbf{r}}}, r_{s} \neq \emptyset \right]\right\vert
\end{aligned} \right. \tag{A.55}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-cost-decodeslots" class="gk-wrap">$\check{d}$</span> | d check | the decode slots an instruction needs: 1 to 4 |
| <span id="gk-find-readytostart" class="gk-wrap">$\mathfrak{S}$</span> | S (gothic) | the first waiting entry whose inputs are ready and whose units are free; ∅ if none |
| <span id="gk-orderedin">$\mathrel{\unicode{x2B40}}$</span> | in order, from | each item of the sequence, in its order |
| <span id="gk-in-rob" class="gk-wrap">${\mathbf{x}_{\mathbf{r}}}$</span> | x sub r | this state's reorder buffer |

</details>

:::

**Read it aloud.** "X takes c, k and a state x, and gives a state. It is: X again, after X
prime, when x's i isn't nothing, the instruction there needs no more decode slots than x
has left, and l is below 32; otherwise X again, after X double prime, when S of x isn't
nothing and x may start more this cycle; otherwise x itself, when x's i is nothing and l
is 0; otherwise X again, after X triple prime. Where l is how many entries of x's buffer,
in order, aren't retired."

**In plain words.** A CPU in a loop. Each turn does the first of four things that it can:

1. **Decode** the next instruction (X′), if there is one, there are slots for it this
   cycle, and fewer than 32 entries are live.
2. Else **start** one that's ready (X″), if one is and this cycle can start more.
3. Else **stop**, if the whole block is decoded and everything has retired.
4. Else **tick** the clock (X‴).

It takes in as much as the front end can, starts what it can, and when it can do neither,
lets a cycle pass. The block is priced when it is all in and all out.

**On a real value.** Cycle 0 of the block at 92,078, with the steps the loop takes:

```text
decode       add_imm_64 (1 slot), then three store_ind_u64 (1 each): d = 0
start?       none: all four are DEC, none WAIT yet
stop?        no: ı is 92,094, not ∅
tick         c = 1, d = 4, e = 5; the four become WAIT
```

**In your client.** `blockCost`'s loop, [15.10's code](./10-the-pipeline.md#the-code): its
four branches in the paper's order.

## (A.56) to (A.58): decoding

::: gray-paper-eq A.56

<a id="ex-A-56"></a>The Gray Paper's (A.56), [in its place in the paper's words](./10-the-pipeline.md#eq-A-56):

$$
\begin{equation}
\mathfrak{X}'\colon \left\{ \begin{aligned}
\left(\mathbb{B}_{}, \mathbb{b}_{}, \mathbb{S}\right) &\to \mathbb{S} \\
\left(\mathbf{c}, \mathbf{k}, \mathbf{x}\right) &\mapsto \begin{cases}
\mathfrak{X}^{\text{mov}}(\mathbf{c}, \mathbf{k}, \mathbf{x}) &\text{if } \imath < \left\vert\mathbf{c}\right\vert \land \mathbf{c}_{\imath} = \texttt{move\_reg} \\
\mathfrak{X}^{\text{dec}}(\mathbf{c}, \mathbf{k}, \mathbf{x}) &\text{otherwise}
\end{cases}
\end{aligned} \right. \tag{A.56}
\end{equation}
$$

:::

::: gray-paper-eq A.57

<a id="ex-A-57"></a>The Gray Paper's (A.57), [in its place in the paper's words](./10-the-pipeline.md#eq-A-57):

$$
\begin{equation}
\mathfrak{X}^{\text{mov}}\colon
\left\{
\begin{array}{@{}l@{}}
\begin{aligned}
\left(\mathbb{B}_{}, \mathbb{b}_{}, \mathbb{S}\right) &\to \mathbb{S} \\
\left(\mathbf{c}, \mathbf{k}, \mathbf{x}\right) &\mapsto \mathbf{x}'
\end{aligned}
\\[14pt]
\hspace{8pt}\begin{aligned}
\text{where } \mathbf{x}' &= \mathbf{x}\text{ except:}\\
\mathbf{x}'_{\imath} &= \mathbf{x}_{\imath} + 1 + \text{skip}(\mathbf{x}_{\imath}) \\
\mathbf{x}'_{d} &= \mathbf{x}_{d} - 1 \\
\mathbf{x}'_{\mathbf{r}} &= {\mathbf{x}_{\mathbf{r}}}\text{ except:}\\
&\begin{aligned}
\forall j &\in \mathbb{N}_{\left\vert{\mathbf{x}_{\mathbf{r}}}\right\vert} : \mathbf{x}'_{\mathbf{r}}\left[j\right]_{r} &= \begin{cases}
{{\mathbf{x}_{\mathbf{r}}}\left[j\right]}_{r} \cup \check{r}(\mathbf{c}, \mathbf{k}, \mathbf{x}_{\imath}) &\text{if } {{\mathbf{x}_{\mathbf{r}}}\left[j\right]}_{r} \cap \check{s}(\mathbf{c}, \mathbf{k}, \mathbf{x}_{\imath}) \neq \emptyset \\
{{\mathbf{x}_{\mathbf{r}}}\left[j\right]}_{r} \setminus \check{r}(\mathbf{c}, \mathbf{k}, \mathbf{x}_{\imath}) &\text{otherwise}
\end{cases} \\
\end{aligned}
\end{aligned}
\end{array}
\right.
\tag{A.57}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-in-rob-len" class="gk-wrap">$\mathbb{N}_{\left\vert{\mathbf{x}_{\mathbf{r}}}\right\vert}$</span> | N sub the size of x sub r | the reorder buffer's indices: 0 up to its length less 1 |
| <span id="gk-rob-entry-field">$x\left[y\right]_{z}$</span> | x at y, its z | field z of entry y of the buffer x |
| <span id="gk-in-rob-field">${{\mathbf{x}_{\mathbf{r}}}\left[x\right]}_{y}$</span> | x sub r at x, its y | field y of entry x of the reorder buffer |
| <span id="gk-inst-dstregs" class="gk-wrap">$\check{r}$</span> | r check | the registers an instruction writes |
| <span id="gk-inst-srcregs" class="gk-wrap">$\check{s}$</span> | s check | the registers an instruction reads |
| <span id="gk-setminus">$\setminus$</span> | without | the left side with every item of the right taken out |

</details>

:::

::: gray-paper-eq A.58

<a id="ex-A-58"></a>The Gray Paper's (A.58), [in its place in the paper's words](./10-the-pipeline.md#eq-A-58):

$$
\begin{equation}
\mathfrak{X}^{\text{dec}}\colon
\left\{
\begin{array}{@{}l@{}}
\begin{aligned}
\left(\mathbb{B}_{}, \mathbb{b}_{}, \mathbb{S}\right) &\to \mathbb{S} \\
\left(\mathbf{c}, \mathbf{k}, \mathbf{x}\right) &\mapsto \mathbf{x}'
\end{aligned}
\\[14pt]
\hspace{8pt}\begin{aligned}
\text{where } \mathbf{x}' &= \mathbf{x}\text{ except:}\\
\mathbf{x}'_{\imath} &= \begin{cases}
\emptyset &\text{if } \zeta_{\imath} \in T \\
\mathbf{x}_{\imath} + 1 + \text{skip}(\mathbf{x}_{\imath}) &\text{otherwise}
\end{cases}\\
\mathbf{c} &\mapsto \zeta \text{ according to A.4}\\
\mathbf{x}'_{d} &= \mathbf{x}_{d} - \check{d}(\mathbf{c}, \mathbf{k}, \mathbf{x}_{\imath}) \\
\mathbf{r} &= {\mathbf{x}_{\mathbf{r}}}\text{ except: } \forall j \in \mathbb{N}_{\left\vert{\mathbf{x}_{\mathbf{r}}}\right\vert} : \mathbf{r}\left[j\right]_{r} = {{\mathbf{x}_{\mathbf{r}}}\left[j\right]}_{r} \setminus r\\
r &= \check{r}(\mathbf{c}, \mathbf{k}, \mathbf{x}_{\imath}) \\
c &= \check{c}(\mathbf{c}, \mathbf{k}, \mathbf{x}_{\imath}) \\
t &= \check{x}(\mathbf{c}, \mathbf{k}, \mathbf{x}_{\imath}) \\
p &= \left\{\,i \;\middle\vert\;  i \in \mathbb{N}_{\left\vert{\mathbf{x}_{\mathbf{r}}}\right\vert}, \check{s}(\mathbf{c}, \mathbf{k}, \mathbf{x}_{\imath}) \cap {{\mathbf{x}_{\mathbf{r}}}\left[i\right]}_{r} \neq \emptyset \,\right\} \\
\mathbf{x}'_{\mathbf{r}} &= \mathbf{r} \mathbin{+\!\!+} \!\left\lgroup\text{DEC}, c, p, r, t\right\rgroup\! \\
\end{aligned}
\end{array}
\right.
\tag{A.58}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-cost-cycles" class="gk-wrap">$\check{c}$</span> | c check | an instruction's cycles: 1 for an add, 25 for a load or store, 60 for a divide |
| <span id="gk-cost-execunits" class="gk-wrap">$\check{x}$</span> | x check | the execution units an instruction needs to start |
| <span id="gk-append">[$\mathbin{+\!\!+}$](../symbols.md#concat)</span> | append | add one item at the end of the sequence |
| <span id="gk-state-decoding">$\text{DEC}$</span> | decoding | DEC: just entered the buffer this cycle |

</details>

:::

**Read it aloud.** (A.56): "X prime is X move when i is inside c and the instruction at i is
move_reg; X decode otherwise." (A.57): "X move gives x prime, which is x except: its i moves to
the next instruction; its d drops by 1; and in its buffer, every entry j's r is: r with the
move's destinations added, if r shares a register with what the move reads; r without the
move's destinations otherwise." (A.58): "X decode gives x prime, which is x except: its i is
nothing if the instruction is a terminator, else the next instruction; c here means zeta;
its d drops by the instruction's decode slots; r is the buffer with the new r taken out of
every entry's registers; the new r is what the instruction writes, c its cycles, t its
units, and p every entry whose registers meet what it reads; and x prime's buffer is r with
a new entry on the end: DEC, c, p, r, t."

**In plain words.** Decoding puts an instruction in the buffer, and works out what it must
wait for: every entry still making a register it reads. Then it takes over the registers it
writes, so a later reader waits on it, not on an older writer. Decoding a terminator ends
the block: ı becomes ∅. `move_reg` is special, as on a real CPU: it never enters the buffer
and costs no cycles. The front end only notes that whatever makes the move's source now
makes its destination too, so a reader of the destination waits for the real producer.

**On a real value.** The block at 92,078:

```text
cycle 0, X^dec   add_imm_64 r1: reads {1}, writes {1}: entry 0 = (DEC, 1, { }, {1}, ALU)
cycle 0, X^dec   store_ind_u64 at 92,082: reads {0, 1}; entry 0 makes r1: p = {0}
cycle 1, X^mov   move_reg r5 = r8: no entry makes r8, and none makes r5: nothing changes
cycle 1, X^dec   load_imm_jump r0: in T, so ı = ∅; entry 4 = (DEC, 15, { }, {0}, none)
```

**In your client.** `decode` in `src/pvm/gas.ts`, [15.10's
code](./10-the-pipeline.md#the-code), with X^mov as its first branch; `registersUsed`
gives š and ř.

## (A.59) and (A.60): starting an instruction

::: gray-paper-eq A.59

<a id="ex-A-59"></a>The Gray Paper's (A.59), [in its place in the paper's words](./10-the-pipeline.md#eq-A-59):

$$
\begin{equation}
\mathfrak{X}''\colon
\left\{
\begin{array}{@{}l@{}}
\begin{aligned}
\mathbb{S} &\to \mathbb{S} \\
\mathbf{x} &\mapsto \mathbf{x}'\\
\end{aligned}
\\[14pt]
\hspace{8pt}\begin{aligned}
\text{where } \mathbf{x}' &= \mathbf{x}\text{ except:}\\
\mathbf{x}'_{e} &= \mathbf{x}_{e} - 1\\
n &= \mathfrak{S}(\mathbf{x})\\
\mathbf{x}'_{t} &= \mathbf{x}_{t} - {{\mathbf{x}_{\mathbf{r}}}\left[n\right]}_{t}\\
\mathbf{x}'_{\mathbf{r}} &= {\mathbf{x}_{\mathbf{r}}}\text{ except: } \mathbf{x}'_{\mathbf{r}}\left[n\right]_{s} = \text{EXE}
\end{aligned}
\end{array}
\right.
\tag{A.59}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-state-executing">$\text{EXE}$</span> | executing | EXE: running on its units |

</details>

:::

::: gray-paper-eq A.60

<a id="ex-A-60"></a>The Gray Paper's (A.60), [in its place in the paper's words](./10-the-pipeline.md#eq-A-60):

$$
\begin{equation}
\mathfrak{S}\colon
\left\{
\begin{array}{@{}l@{}}
\begin{aligned}
\mathbb{S} &\to \mathbb{N} \cup \left\{\,\emptyset\,\right\}\\
\mathbf{x} &\mapsto \begin{cases}
\emptyset &\text{if } s = \emptyset\\
\min(s) &\text{otherwise}
\end{cases}\\
\end{aligned}
\\[14pt]
\hspace{8pt}\begin{aligned}
\\[0.2pt]
\text{where } s &= \left\{\,j \in \mathbb{N}_{\left\vert{\mathbf{x}_{\mathbf{r}}}\right\vert} \;\middle\vert\; {{\mathbf{x}_{\mathbf{r}}}\left[j\right]}_{s} = \text{WAIT} \land {{\mathbf{x}_{\mathbf{r}}}\left[j\right]}_{t} \leq \mathbf{x}_{t} \land (\forall k \in {{\mathbf{x}_{\mathbf{r}}}\left[j\right]}_{p} : {{\mathbf{x}_{\mathbf{r}}}\left[k\right]}_{c} = 0)\,\right\}
\end{aligned}
\end{array}
\right.
\tag{A.60}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-state-waiting">$\text{WAIT}$</span> | waiting | WAIT: decoded, and starts once its inputs are ready and its units free |

</details>

:::

**Read it aloud.** (A.59): "X double prime gives x prime, which is x except: e drops by 1;
n is S of x; t drops by entry n's units; and entry n's state is EXE." (A.60): "S takes a
state and gives a natural or nothing: nothing when s is empty, else the least of s. Where s
is the set of j among the buffer's indices whose entry is WAIT, needs no more units than are
free, and every entry k it waits on has 0 cycles left."

**In plain words.** S finds the oldest entry that can start now: decoded and waiting, its
inputs made, its units free. X″ starts it: it holds its units and begins counting down.

**On a real value.** Cycle 2 of the block at 92,078. The add (entry 0) has run its 1
cycle, so the stores' inputs are made:

```text
S = 1     t = (4, 4, 4, 1, 1) − (1, 0, 1, 0, 0) = (3, 4, 3, 1, 1), e = 4
S = 2     t = (2, 4, 2, 1, 1), e = 3
S = 3     t = (1, 4, 1, 1, 1), e = 2
S = 4     the call needs no units: t stays, e = 1
```

**In your client.** `readyToStart` (S) and `startOne` (X″) in `src/pvm/gas.ts`, [15.10's
code](./10-the-pipeline.md#the-code).

## (A.61): a tick of the clock

::: gray-paper-eq A.61

<a id="ex-A-61"></a>The Gray Paper's (A.61), [in its place in the paper's words](./10-the-pipeline.md#eq-A-61):

$$
\begin{equation}
\mathfrak{X}'''\colon
\left\{
\begin{array}{@{}l@{}}
\begin{aligned}
\mathbb{S} &\to \mathbb{S} \\
\mathbf{x} &\mapsto \mathbf{x}'\\
\end{aligned}
\\[14pt]
\hspace{8pt}\begin{aligned}
\text{where } \mathbf{x}' &= \mathbf{x}\text{ except:}\\
\mathbf{x}'_{d} &= 4, \mathbf{x}'_{e} = 5, \mathbf{x}'_{c} = \mathbf{x}_{c} + 1\\
\mathbf{x}'_{t} &= \mathbf{x}_{t} + \sum_{n \in \mathbb{N}_{\left\vert{\mathbf{x}_{\mathbf{r}}}\right\vert}, {{\mathbf{x}_{\mathbf{r}}}\left[n\right]}_{s} = \text{EXE} \land {{\mathbf{x}_{\mathbf{r}}}\left[n\right]}_{c} = 1} {{\mathbf{x}_{\mathbf{r}}}\left[n\right]}_{t} \\
\mathbf{x}'_{\mathbf{r}} &= {\mathbf{x}_{\mathbf{r}}}\text{ except } \forall j \in \mathbb{N}_{\left\vert{\mathbf{x}_{\mathbf{r}}}\right\vert}: \\
&\begin{aligned}
\mathbf{x}'_{\mathbf{r}}\left[j\right]_{s} &= \begin{cases}
\emptyset &\text{if } \forall k \in \mathbb{N}_{j+1} : {{\mathbf{x}_{\mathbf{r}}}\left[k\right]}_{s} \in \left\{\,\text{FIN}, \emptyset\,\right\} \\
\text{WAIT} &\text{if } {{\mathbf{x}_{\mathbf{r}}}\left[j\right]}_{s} = \text{DEC} \\
\text{FIN} &\text{if } {{\mathbf{x}_{\mathbf{r}}}\left[j\right]}_{s} = \text{EXE} \land {{\mathbf{x}_{\mathbf{r}}}\left[j\right]}_{c} = 0 \\
{{\mathbf{x}_{\mathbf{r}}}\left[j\right]}_{s} &\text{otherwise} \\
\end{cases} \\
\mathbf{x}'_{\mathbf{r}}\left[j\right]_{c} &= \begin{cases}
{{\mathbf{x}_{\mathbf{r}}}\left[j\right]}_{c} - 1 &\text{if } {{\mathbf{x}_{\mathbf{r}}}\left[j\right]}_{s} = \text{EXE} \land {{\mathbf{x}_{\mathbf{r}}}\left[j\right]}_{c} > 0 \\
{{\mathbf{x}_{\mathbf{r}}}\left[j\right]}_{c} &\text{otherwise} \\
\end{cases} \\
\end{aligned}
\end{aligned}
\end{array}
\right.
\tag{A.61}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-state-executed">$\text{FIN}$</span> | finished | FIN: done running, and retires once everything before it has |

</details>

:::

**Read it aloud.** "X triple prime gives x prime, which is x except: d is 4, e is 5, and c
goes up by 1; t gets back the units of every entry that is EXE with 1 cycle left; and for
every entry j, its state becomes: nothing, if every entry up to and including j is FIN or
nothing; WAIT, if it was DEC; FIN, if it was EXE with 0 cycles left; and otherwise stays.
Its cycles drop by 1 if it is EXE with more than 0 left, and otherwise stay."

**In plain words.** A cycle passes. The front end gets its 4 slots and 5 starts back, every
running instruction counts down one, and one finishing now hands its units back. Then the
states move on: decoded becomes waiting, run out becomes finished, and finished entries
retire, but only in order, once everything before them has.

**On a real value.** The block at 92,078, [15.10's printout](./10-the-pipeline.md#watch-it):

```text
cycle 2 → 3    the add, EXE with 0 left: FIN; the stores 25 → 24, the call 15 → 14
cycle 3 → 4    the add: FIN, and nothing before it: retired
cycle 17 → 18  the call, EXE with 0 left: FIN, but the stores before it run on
cycle 26 → 27  the stores, EXE with 1 left: their units come back, t = (4, 4, 4, 1, 1)
cycle 28 → 29  everything FIN: all retired; X stops, and ϱ^Δ = 29 − 3 = 26
```

**In your client.** `tick` in `src/pvm/gas.ts`, [15.10's
code](./10-the-pipeline.md#the-code): `retiring` is the "every entry up to j" in one
running flag.

## (A.62) and (A.63): when the registers change the price

::: gray-paper-eq A.62

<a id="ex-A-62"></a>The Gray Paper's (A.62), [in its place in the paper's words](./09-what-instructions-cost.md#eq-A-62):

$$
\begin{equation}
\mathfrak{P}\colon \left\{ \begin{aligned}
(\mathbb{N}, \mathbb{N}, \mathbb{B}_{}, \mathbb{b}_{}, \mathbb{N}_R) &\to \mathbb{N}\\
(a, b, \mathbf{c}, \mathbf{k}, \imath) &\mapsto \begin{cases}
a &\text{if } \check{s}(\mathbf{c}, \mathbf{k}, \imath) \cap \check{r}(\mathbf{c}, \mathbf{k}, \imath) \neq \emptyset \\
b &\text{otherwise}
\end{cases}
\end{aligned} \right. \tag{A.62}
\end{equation}
$$

:::

::: gray-paper-eq A.63

<a id="ex-A-63"></a>The Gray Paper's (A.63), [in its place in the paper's words](./09-what-instructions-cost.md#eq-A-63):

$$
\begin{equation}
\mathfrak{P}_{S}\colon
\left\{
\begin{array}{@{}l@{}}
\begin{aligned}
(\mathbb{N}, \mathbb{N}, \mathbb{B}_{}, \mathbb{b}_{}, \mathbb{N}_R) &\to \mathbb{N}\\
(a, b, \mathbf{c}, \mathbf{k}, \imath) &\mapsto \begin{cases}
a &\text{if } {\varphi}_A = {\varphi}_D \\
b &\text{otherwise}
\end{cases}\\
\end{aligned}
\\[14pt]
\hspace{8pt}\begin{aligned}
\\[0.2pt]
& \text{where } (\mathbf{c}, \mathbf{k}, \imath) \mapsto ({\varphi}_A, {\varphi}_D) \text{ according to A.2 and A.5} \\
\end{aligned}
\end{array}
\right.
\tag{A.63}
\end{equation}
$$

:::

**Read it aloud.** (A.62): "P of a, b, c, k, i is a when the registers the instruction at i
reads and those it writes share one; b otherwise." (A.63): "P sub S of a, b, c, k, i is a
when phi A is phi D; b otherwise; where phi A and phi D come from decoding the instruction
at i."

**In plain words.** Some rows of the price list have two decode costs, and these pick one.
𝔓 picks the cheaper a when the instruction writes a register it also reads: picture a CPU
whose add always overwrites one of its inputs, so aiming at a third register costs an extra
copy. 𝔓_S, for shifts and rotations by a register, picks a only when the output is the
*first* input. Read literally, "φ_A = φ_D" compares the two registers' values; but a price
is fixed before the code runs, and the note under it says φ_A and φ_D come from decoding, so
it means the same register. Your client and lasair both compare register numbers.

**On a real value.** From the bootstrap code:

```text
add_imm_64 r1 = r1 − 1,440     reads {1}, writes {1}: they share, 𝔓(1, 2) = 1 slot
add_imm_64 r7 = r1 + 200       reads {1}, writes {7}: 𝔓(1, 2) = 2 slots
shlo_l_64 at 43,191, cf 57 07  A = 7, D = 7: 𝔓_S(2, 3) = 2 slots
shlo_l_64 at 53,778, cf 67 08  A = 7, D = 8: 3 slots
rot_l_64 at 118,874, dc 60 06  A = 0, B = 6, D = 6: D is B, not A: 𝔓_S gives 3
```

**In your client.** `p` and `ps` in `instructionCost`, `src/pvm/gas.ts`, [15.9's
code](./09-what-instructions-cost.md#the-code).

## (A.64) and (A.65): memory and branches

::: gray-paper-eq A.64

<a id="ex-A-64"></a>The Gray Paper's (A.64), [in its place in the paper's words](./09-what-instructions-cost.md#eq-A-64):

$$
\begin{equation}
\mathfrak{m} \equiv 25 \tag{A.64}
\end{equation}
$$

:::

::: gray-paper-eq A.65

<a id="ex-A-65"></a>The Gray Paper's (A.65), [in its place in the paper's words](./09-what-instructions-cost.md#eq-A-65):

$$
\begin{equation}
\mathfrak{b}\colon
\left\{
\begin{array}{@{}l@{}}
\begin{aligned}
(\mathbb{B}_{}, \mathbb{N}_R) &\to \mathbb{N}\\
(\mathbf{c}, \imath) &\mapsto \begin{cases}
1 &\text{if } \{ \zeta_{\imath + 1 + \text{skip}(\imath)}, \zeta_{\imath_{\text{target}}} \} \cap \{ \texttt{unlikely}, \texttt{trap} \} \neq \emptyset \\
20 &\text{otherwise}
\end{cases}
\end{aligned}
\\[14pt]
\hspace{8pt}\begin{aligned}
\\[0.2pt]
\text{where } &\mathbf{c} \mapsto \zeta \text{ according to A.4}\\
&\imath_{\text{target}} \text{ is the target of the branch according to A.5}
\end{aligned}
\end{array}
\right.
\tag{A.65}
\end{equation}
$$

:::

**Read it aloud.** (A.64): "m is defined as 25." (A.65): "b takes the code and a counter,
and gives a natural: c and i map to 1, when the instruction after this one or the one at
its target is unlikely or trap; 20 otherwise. Where c means zeta, and i target is where the
branch goes."

**In plain words.** A load or a store takes 𝔪 = 25 cycles, a stand-in: a comment in the
paper's source calls it temporary, until memory and paging are priced properly. A branch takes 20 cycles, the price of a
CPU guessing wrong, unless either way it can go starts with `unlikely` or `trap`: then a
CPU would guess right, and it takes 1. That is what `unlikely` is for.

**On a real value.**

```text
store_ind_u64 at 92,082         𝔪 = 25 cycles
branch_ne_imm at 121,444        next 121,447 is shlo_r_imm_alt_64, target 121,467 a store:
                                neither unlikely nor trap: 𝔟 = 20
branch_ne at 91                 next, at 95, is unlikely: 𝔟 = 1
```

**In your client.** `MEMORY` and `branchCost` in `src/pvm/gas.ts`, [15.9's
code](./09-what-instructions-cost.md#the-code).

## A.10's table: every instruction's price

This table has no formula of its own: it is a row for every instruction, with its cycles
č, its decode slots ď, and the units x̌ it needs, one column for each kind, A, L, S, M and D.
A.9's š, ř, č, ď and x̌ read it.

**In plain words.** Read a row left to right: how long, how much decoding, which parts of
the CPU. The rows come in families that share a price. Simple arithmetic takes 1 cycle and
an ALU, its `_32` forms 2; loads and stores take 𝔪 = 25 and an ALU with a load or store
unit; multiplies 3 to 6 cycles, an ALU and the multiplier; divides and remainders 60 cycles,
4 decode slots, an ALU and the one divider; jumps 15 and 22, with no units; `move_reg` 0 cycles and nothing; `ecalli` 100
cycles, 4 decode slots and an ALU; `unlikely` 40.

**On a real value.** The block at 92,078, row by row, as [15.9](./09-what-instructions-cost.md#watch-it)
prints it:

```text
add_imm_64       č 1    ď 1 (𝔓: r1 = r1 − 1,440)    A
store_ind_u64    č 25   ď 1                          A, S
store_ind_u64    č 25   ď 1                          A, S
store_ind_u64    č 25   ď 1                          A, S
move_reg         č 0    ď 1                          none
move_reg         č 0    ď 1                          none
load_imm_jump    č 15   ď 1                          none
the sum          91 cycles; the model CPU runs them side by side in 29, so 26 gas
```

**In your client.** `COSTS` and `rowOf` in `src/pvm/gas.ts`, [15.9's
code](./09-what-instructions-cost.md#the-code), name the paper's kinds of row once and give
each instruction its kind.

## Say it in one breath

A program blob is cut into a jump table, code and a bitmask, and checked whole before it
runs (A.2). The bitmask says where each instruction starts, skip how far to the next, and
the code reads as zeros past its end (A.3, A.4). Blocks start at 0 and after every
terminator, and a jump or branch may only land on one (A.5, A.20 to A.22). Ψ runs one step
at a time (A.1, A.7): pay for the block on the way in (A.8), check memory (A.9), and do what
the instruction's row says, out of thirteen tables that differ in how their arguments are
packed (A.12 to A.37); gas first, then memory, then the instruction (A.10). Ψ_H answers host
calls (A.38), Y lays out a standard program's memory and registers (A.41 to A.47), and Ψ_M,
the call the rest of the paper makes, puts them together (A.48). A block's gas is what a
small model CPU takes to run it, less 3 (A.49 to A.61), from a price list of cycles,
decode slots and units (A.62 to A.65 and A.10's table).
