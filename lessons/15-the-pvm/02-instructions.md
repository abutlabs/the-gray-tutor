# Instructions

[Lesson 15.1](./01-the-program-blob.md) found 39,849 instructions in a real service's code, as opcode numbers.
Now your client *reads* each one: its name and its arguments, which registers it uses,
which numbers it carries, where it jumps. That's a disassembler, and by the end you're
reading real JAM service code the way a computer does.

## What the Gray Paper says

Three parts of Appendix A tell you how to read one instruction. A.2 says where it ends:

::: gray-paper A.2 4-9

#### Appendix A.2 Instructions, Opcodes and Skip-distance, continued

<a id="gp-A-2-p4"></a>We define the Skip function $\text{skip}$ which provides the number of <abbr class="gp-term" title="bytes: 8 bits each">octets</abbr>, minus one, to the next instruction's opcode, given the index of instruction's opcode index into $\mathbf{c}$ (and by extension $\mathbf{k}$):

<a id="gp-A-2-p5"></a><a id="eq-A-3"></a>

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
| <span id="gk-abracegroup">$\left\{ \begin{aligned}x\end{aligned} \right.$</span> | as follows | a brace grouping lines that hold together: for a function, its type on top, then what each input becomes |
| <span id="gk-N" class="gk-wrap">[$\mathbb{N}$](../symbols.md#naturals)</span> | N | the whole numbers: 0, 1, 2 and up; a subscript is a bound, ℕ₈ is 0 to 7 |
| <span id="gk-to">[$\to$](../symbols.md#to)</span> | to | what goes in, to what comes out: A → B takes an A and gives a B |
| <span id="gk-mapsto">$\mapsto$</span> | maps to | what a function gives back for an input: x ↦ y says x becomes y |
| <span id="gk-min">$\min$</span> | the least of | the smallest of the values given; min(24, j : …) is the smallest j that fits, but no more than 24 |
| <span id="gk-in">[$\in$](../symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-concat" class="gk-wrap">[$\frown$](../symbols.md#concat)</span> | concatenate | join: the left sequence followed by the right |
| <span id="gk-sq">[$\left[x\right]$](../symbols.md#sequence)</span> | the sequence | a sequence written out item by item; [ ] is the empty one |

</details>

→ [(A.3) in plain words](./gray-paper.md#ex-A-3)

<a id="gp-A-2-p6"></a>The Skip function appends $\mathbf{k}$ with a sequence of set bits in order to ensure a well-defined result for the final instruction $\text{skip}(\left\vert\mathbf{c}\right\vert - 1)$.

<a id="gp-A-2-p7"></a>Given some instruction-index $i$, its opcode is readily expressed as $\mathbf{c}_i$ and the distance in octets to move forward to the next instruction is $1 + \text{skip}(i)$. However, each instruction's “length” (defined as the number of contiguous octets starting with the opcode which are needed to fully define the instruction's semantics) is left implicit though limited to being at most 16.

<a id="gp-A-2-p8"></a>We define $\zeta$ as being equivalent to the instructions $\mathbf{c}$ except with an indefinite sequence of zeroes suffixed to ensure that no out-of-bounds access is possible. This effectively defines any otherwise-undefined arguments to the final instruction and ensures that a trap will occur if the program counter passes beyond the program code. Formally:

<a id="gp-A-2-p9"></a><a id="eq-A-4"></a>

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

→ [(A.4) in plain words](./gray-paper.md#ex-A-4)

:::

In plain words: **skip(ı)** is the distance from an opcode to the next one, minus one,
never over 24. An instruction ends where the next begins, and the bitmask k of [lesson
15.1](./01-the-program-blob.md) is how you find the next. ζ is the code with zeros added
forever after it, so reading past the end never fails: it reads 0, which is `trap`.

A.4 says how the numbers inside an instruction are read:

::: gray-paper A.4 14-17

#### Appendix A.4 Single-Step State Transition, continued

<a id="gp-A-4-p14"></a>We define signed/unsigned transitions for various <abbr class="gp-term" title="a byte: 8 bits">octet</abbr> widths:

<a id="gp-A-4-p15"></a><a id="eq-A-13"></a><a id="eq-A-14"></a><a id="eq-A-15"></a><a id="eq-A-16"></a><a id="eq-A-17"></a><a id="eq-A-18"></a>

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
| <span id="gk-bmod">[$\bmod$](../symbols.md#mod)</span> | mod | the remainder after dividing: 14 mod 4 is 2 |
| <span id="gk-bitsfunc">$\mathcal{B}_{x}$</span> | B sub n | a number of n bytes as its 8n bits, the lowest first |
| <span id="gk-bitstring">$\mathbb{b}$</span> | b sub n | bits: a run of true-or-false values; a subscript is how many |
| <span id="gk-forall">$\forall$</span> | for all | for every value: ∀c ∈ ℕ_C means for each core c |
| <span id="gk-Nmax">[$\mathbb{N}_{x}$](../symbols.md#naturals)</span> | N sub n | the whole numbers below n: ℕ_C is a core index, 0 to C − 1 |
| <span id="gk-Leftrightarrow">$\Leftrightarrow$</span> | exactly when | if and only if: both sides are true together, or false together |
| <span id="gk-ffrac">$\left\lfloor\frac{x}{y}\right\rfloor$</span> | x over y, rounded down | whole-number division, the remainder dropped: ⌊7/3⌋ is 2 |
| <span id="gk-unbitsfunc">$\mathcal{B}_{x}^{-1}$</span> | B sub n inverse | 8n bits, the lowest first, back into a number |
| <span id="gk-sum">$\sum$</span> | the sum of | add up what follows, once for each value the subscript ranges over |
| <span id="gk-cdot">$\cdot$</span> | times | multiply |
| <span id="gk-revbitsfunc">$\overleftarrow{\mathcal{B}}_{x}$</span> | B sub n reversed | a number of n bytes as its 8n bits, the highest first, as people write numbers |
| <span id="gk-revunbitsfunc">$\overleftarrow{\mathcal{B}}_{x}^{-1}$</span> | B sub n reversed, inverse | 8n bits, the highest first, back into a number |

</details>

→ [(A.13), (A.14), (A.15), (A.16), (A.17), (A.18) in plain words](./gray-paper.md#ex-A-13)

<a id="gp-A-4-p16"></a>Immediate arguments are encoded in little-endian format with the most-significant bit being the sign bit. They may be compactly encoded by eliding more significant octets. Elided octets are assumed to be zero if the MSB of the value is zero, and 255 otherwise. This allows for compact representation of both positive and negative encoded values. We thus define the signed extension function operating on an input of $n$ octets as $\mathcal{X}_{n}$:

<a id="gp-A-4-p17"></a><a id="eq-A-19"></a>

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
| <span id="gk-set">$\left\{\,x\,\right\}$</span> | the set of | a set: values with no order and no repeats |
| <span id="gk-pvmreg" class="gk-wrap">$\mathbb{N}_R$</span> | N sub R | a register's value: a u64 |

</details>

→ [(A.19) in plain words](./gray-paper.md#ex-A-19)

:::

In plain words: a register holds 64 bits, and the same bits can be read two ways. Z_n
reads n bytes as a *signed* number (0xff is −1), and Z_n⁻¹ turns it back. X_n stretches an
n-byte immediate to 64 bits, copying its top bit into all the bytes above: 0xff becomes
2^64 − 1, which is −1 read signed. (B_n and its reverse list a number's bits, lowest or
highest first; [lesson 15.7](./07-bits-and-bytes.md) counts with them.)

And A.5, where the tables start, says how long the arguments are, ℓ, then opens each table
with its **layout**, the one line that says where each register and number sits. The
tables themselves come in the lessons that run their instructions; here are the twelve
layouts:

::: gray-paper A.5

#### Appendix A.5 Instruction Tables {#gp-A-5}

<a id="gp-A-5-p1"></a>We assume the skip length $\ell$ is well-defined:

<a id="gp-A-5-p2"></a><a id="eq-A-23"></a>

$$
\begin{equation}
\ell \equiv \text{skip}(\imath) \tag{A.23}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-ell">$\ell$</span> | ell | a length defined nearby: in §14 the segments exported before an item; in Appendix A, the bytes after an opcode |
| <span id="gk-imath">$\imath$</span> | i | the instruction counter: the index in the code of the instruction to run next |

</details>

→ [(A.23) in plain words](./gray-paper.md#ex-A-23)

:::

::: gray-paper A.5.2 1-1

#### Appendix A.5.2 Instructions with Arguments of One Immediate {#gp-A-5-2}

<a id="gp-A-5-2-p1"></a><a id="eq-A-24"></a>

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

→ [(A.24) in plain words](./gray-paper.md#ex-A-24)

:::

::: gray-paper A.5.3 1-1

#### Appendix A.5.3 Instructions with Arguments of One Register and One Extended Width Immediate {#gp-A-5-3}

<a id="gp-A-5-3-p1"></a><a id="eq-A-25"></a>

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

→ [(A.25) in plain words](./gray-paper.md#ex-A-25)

:::

::: gray-paper A.5.4 1-1

#### Appendix A.5.4 Instructions with Arguments of Two Immediates {#gp-A-5-4}

<a id="gp-A-5-4-p1"></a><a id="eq-A-26"></a>

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

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-max">$\max$</span> | max of | the largest of the values in the brackets |

</details>

→ [(A.26) in plain words](./gray-paper.md#ex-A-26)

:::

::: gray-paper A.5.5 1-1

#### Appendix A.5.5 Instructions with Arguments of One Offset {#gp-A-5-5}

<a id="gp-A-5-5-p1"></a><a id="eq-A-27"></a>

$$
\begin{equation}
\begin{aligned}
\text{let } l_X = \min(4, \ell) \,,\quad
\nu_X \equiv \imath + \mathcal{Z}_{l_X}(\mathcal{E}^{-1}_{l_X}\left(\zeta_{\imath+1 \dots+ l_X}\right))
\end{aligned} \tag{A.27}
\end{equation}
$$

→ [(A.27) in plain words](./gray-paper.md#ex-A-27)

:::

::: gray-paper A.5.6 1-1

#### Appendix A.5.6 Instructions with Arguments of One Register &amp; One Immediate {#gp-A-5-6}

<a id="gp-A-5-6-p1"></a><a id="eq-A-28"></a>

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

→ [(A.28) in plain words](./gray-paper.md#ex-A-28)

:::

::: gray-paper A.5.7 1-1

#### Appendix A.5.7 Instructions with Arguments of One Register &amp; Two Immediates {#gp-A-5-7}

<a id="gp-A-5-7-p1"></a><a id="eq-A-29"></a>

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

→ [(A.29) in plain words](./gray-paper.md#ex-A-29)

:::

::: gray-paper A.5.8 1-1

#### Appendix A.5.8 Instructions with Arguments of One Register, One Immediate and One Offset {#gp-A-5-8}

<a id="gp-A-5-8-p1"></a><a id="eq-A-30"></a>

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

→ [(A.30) in plain words](./gray-paper.md#ex-A-30)

:::

::: gray-paper A.5.9 1-1

#### Appendix A.5.9 Instructions with Arguments of Two Registers {#gp-A-5-9}

<a id="gp-A-5-9-p1"></a><a id="eq-A-31"></a>

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

→ [(A.31) in plain words](./gray-paper.md#ex-A-31)

:::

::: gray-paper A.5.10 1-1

#### Appendix A.5.10 Instructions with Arguments of Two Registers &amp; One Immediate {#gp-A-5-10}

<a id="gp-A-5-10-p1"></a><a id="eq-A-32"></a>

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

→ [(A.32) in plain words](./gray-paper.md#ex-A-32)

:::

::: gray-paper A.5.11 1-1

#### Appendix A.5.11 Instructions with Arguments of Two Registers &amp; One Offset {#gp-A-5-11}

<a id="gp-A-5-11-p1"></a><a id="eq-A-33"></a>

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

→ [(A.33) in plain words](./gray-paper.md#ex-A-33)

:::

::: gray-paper A.5.12 1-1

#### Appendix A.5.12 Instruction with Arguments of Two Registers and Two Immediates {#gp-A-5-12}

<a id="gp-A-5-12-p1"></a><a id="eq-A-34"></a>

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

→ [(A.34) in plain words](./gray-paper.md#ex-A-34)

:::

::: gray-paper A.5.13 1-1

#### Appendix A.5.13 Instructions with Arguments of Three Registers {#gp-A-5-13}

<a id="gp-A-5-13-p1"></a><a id="eq-A-35"></a>

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

→ [(A.35) in plain words](./gray-paper.md#ex-A-35)

:::

In plain words: 139 instructions, in 13 groups (A.5.1 has no arguments, so no layout).
Each group shares one **layout**, the way its arguments sit in the bytes after the opcode:

| Layout | Opcodes | Arguments |
| --- | --- | --- |
| no arguments | 0 to 2 | `trap`, `fallthrough`, `unlikely` |
| one immediate | 10 | `ecalli`, a host call ([Part 16](../16-host-calls/index.md)) |
| register, 8-byte immediate | 20 | `load_imm_64` |
| two immediates | 30 to 33 | `store_imm_…` |
| one offset | 40 | `jump` |
| register, immediate | 50 to 62 | `jump_ind`, `load_imm`, loads, stores |
| register, two immediates | 70 to 73 | `store_imm_ind_…` |
| register, immediate, offset | 80 to 90 | `load_imm_jump`, `branch_…_imm` |
| two registers | 100 to 110 | `move_reg`, bit counts, extensions |
| two registers, immediate | 120 to 161 | indirect loads and stores, arithmetic with a constant |
| two registers, offset | 170 to 175 | `branch_eq` and friends |
| two registers, two immediates | 180 | `load_imm_jump_ind` |
| three registers | 190 to 230 | arithmetic, logic, comparisons |

The rules for reading them, in brief:

- **Registers** are four bits each: the byte after the opcode holds one in its low half
  and one in its high half. There are 13 registers, so a number over 12 counts as 12:
  that's the min(12, …) in every layout.
- **Immediates** are little-endian, 0 to 4 bytes long, and **sign-extended** to 64 bits
  (X): if their top bit is set, they're negative, and the missing high bytes fill with
  `ff`. Their length isn't written down: it's whatever the instruction's bytes leave,
  ℓ less the bytes before it, which is why [lesson 15.1](./01-the-program-blob.md)'s
  bitmask matters. With two immediates, the first one's length is written, in 3 bits of
  a byte (the one after the opcode, or after the registers), and the second gets what's
  left.
- **Offsets** are signed (Z) and relative: the target is ı plus the offset, so a jump
  back is a negative number.
- `load_imm_64` is the one exception: its 8 bytes are read as they are, nothing to extend.

<DecodeInstruction />

**Try it in the [playground](../pvm-playground.md).** Press **Numbers inside instructions** and read the bytes at the end of each line in the Code panel. `load_imm r10, 0` has no bytes for its number at all: a missing byte reads as zero.

## The tests

**New file** `test/instructions.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { decodeInstruction, signed, signExtend } from "../src/pvm/instructions.ts";
import type { Program } from "../src/pvm/program.ts";
import { deblob, startsInstruction, unpackCode } from "../src/pvm/program.ts";
import { bootstrapCode } from "./vectors.ts";
import type { Instruction } from "../src/pvm/instructions.ts";

test("immediates: sign-extended to 64 bits, or read as signed", () => {
  const small: bigint = signExtend(1, 0x7fn);
  assert.equal(small, 0x7fn);
  const minusOne: bigint = signExtend(1, 0xffn);
  assert.equal(minusOne, 2n ** 64n - 1n); // −1, as 64 unsigned bits
  const twoBytes: bigint = signExtend(2, 0x8000n);
  assert.equal(twoBytes, 0xffffffffffff8000n);
  const minusThree: bigint = signed(1, 0xfdn);
  assert.equal(minusThree, -3n);
});

test("three instructions by hand: load_imm, add_64, and a jump back", () => {
  // load_imm r1, −1 | add_64 r3 = r1 + r2 | jump back 3 bytes | trap
  const code = Uint8Array.from([51, 0x01, 0xff, 200, 0x21, 0x03, 40, 0xfd, 0]);
  const program: Program = { jumpTable: [], code, bitmask: Uint8Array.from([0x49, 0x01]) };
  const loadImm: Instruction = decodeInstruction(program, 0); // they start at 0, 3, 6 and 8
  assert.deepEqual([loadImm.name, loadImm.registers, loadImm.immediates], [
    "load_imm",
    [1],
    [2n ** 64n - 1n],
  ]);
  const add: Instruction = decodeInstruction(program, 3);
  assert.deepEqual([add.name, add.registers, add.next], ["add_64", [1, 2, 3], 6]);
  const jump: Instruction = decodeInstruction(program, 6);
  assert.deepEqual([jump.name, jump.target], ["jump", 3]); // 6 + (−3)
});

test("the bootstrap service: 39,849 instructions, all known, every jump on target", () => {
  const program: Program = deblob(unpackCode(bootstrapCode()).program);
  let instructions = 0;
  let targets = 0;
  for (let i = 0; i < program.code.length; i = decodeInstruction(program, i).next) {
    const instruction: Instruction = decodeInstruction(program, i);
    instructions++;
    if (instruction.target === undefined) continue;
    const lands: boolean = startsInstruction(program, instruction.target);
    assert.ok(lands, `${instruction.name} at ${i}`);
    targets++;
  }
  assert.deepEqual([instructions, targets], [39849, 4767]);
});
```

The second test is a three-instruction program you could write on a napkin. The third
walks the whole real program by `next`, decoding every instruction, and checks every
jump and branch: 4,767 of them, each landing exactly on the start of an instruction.
Get the sign of an offset wrong, or its length, and they'd land in the middle of one.

## The code

The opcode table is long, and its names are the Gray Paper's own.

**New file** `src/pvm/instructions.ts`

```ts
// Instructions (GP App. A): reading one instruction out of the code, its opcode and its
// arguments. What each one *does* comes in the following lessons.

import type { Program } from "./program.ts";
import { startsInstruction } from "./program.ts";

/** How an instruction's arguments are laid out after its opcode: 13 ways (GP App. A.5). */
export type Layout =
  | "none" // trap, fallthrough
  | "imm" // one immediate
  | "regExtImm" // a register and an 8-byte immediate
  | "immImm" // two immediates
  | "offset" // one jump offset
  | "regImm" // a register and an immediate
  | "regImmImm" // a register and two immediates
  | "regImmOffset" // a register, an immediate and an offset
  | "regReg" // two registers
  | "regRegImm" // two registers and an immediate
  | "regRegOffset" // two registers and an offset
  | "regRegImmImm" // two registers and two immediates
  | "regRegReg"; // three registers

/** Each layout's opcodes, which run consecutively from `first`, by their GP names. */
const LAYOUTS: { layout: Layout; first: number; names: string[] }[] = [
  { layout: "none", first: 0, names: ["trap", "fallthrough", "unlikely"] },
  { layout: "imm", first: 10, names: ["ecalli"] },
  { layout: "regExtImm", first: 20, names: ["load_imm_64"] },
  {
    layout: "immImm",
    first: 30,
    names: [
      "store_imm_u8", "store_imm_u16", "store_imm_u32", "store_imm_u64"
    ],
  },
  { layout: "offset", first: 40, names: ["jump"] },
  {
    layout: "regImm",
    first: 50,
    names: [
      "jump_ind", "load_imm", "load_u8", "load_i8", "load_u16", "load_i16", "load_u32",
      "load_i32", "load_u64", "store_u8", "store_u16", "store_u32", "store_u64"
    ],
  },
  {
    layout: "regImmImm",
    first: 70,
    names: [
      "store_imm_ind_u8", "store_imm_ind_u16", "store_imm_ind_u32", "store_imm_ind_u64"
    ],
  },
  {
    layout: "regImmOffset",
    first: 80,
    names: [
      "load_imm_jump", "branch_eq_imm", "branch_ne_imm", "branch_lt_u_imm", "branch_le_u_imm",
      "branch_ge_u_imm", "branch_gt_u_imm", "branch_lt_s_imm", "branch_le_s_imm",
      "branch_ge_s_imm", "branch_gt_s_imm"
    ],
  },
  {
    layout: "regReg",
    first: 100,
    names: [
      "move_reg", "count_set_bits_64", "count_set_bits_32", "leading_zero_bits_64",
      "leading_zero_bits_32", "trailing_zero_bits_64", "trailing_zero_bits_32", "sign_extend_8",
      "sign_extend_16", "zero_extend_16", "reverse_bytes"
    ],
  },
  {
    layout: "regRegImm",
    first: 120,
    names: [
      "store_ind_u8", "store_ind_u16", "store_ind_u32", "store_ind_u64", "load_ind_u8",
      "load_ind_i8", "load_ind_u16", "load_ind_i16", "load_ind_u32", "load_ind_i32",
      "load_ind_u64", "add_imm_32", "and_imm", "xor_imm", "or_imm", "mul_imm_32",
      "set_lt_u_imm", "set_lt_s_imm", "shlo_l_imm_32", "shlo_r_imm_32", "shar_r_imm_32",
      "neg_add_imm_32", "set_gt_u_imm", "set_gt_s_imm", "shlo_l_imm_alt_32",
      "shlo_r_imm_alt_32", "shar_r_imm_alt_32", "cmov_iz_imm", "cmov_nz_imm", "add_imm_64",
      "mul_imm_64", "shlo_l_imm_64", "shlo_r_imm_64", "shar_r_imm_64", "neg_add_imm_64",
      "shlo_l_imm_alt_64", "shlo_r_imm_alt_64", "shar_r_imm_alt_64", "rot_r_64_imm",
      "rot_r_64_imm_alt", "rot_r_32_imm", "rot_r_32_imm_alt"
    ],
  },
  {
    layout: "regRegOffset",
    first: 170,
    names: [
      "branch_eq", "branch_ne", "branch_lt_u", "branch_lt_s", "branch_ge_u", "branch_ge_s"
    ],
  },
  { layout: "regRegImmImm", first: 180, names: ["load_imm_jump_ind"] },
  {
    layout: "regRegReg",
    first: 190,
    names: [
      "add_32", "sub_32", "mul_32", "div_u_32", "div_s_32", "rem_u_32", "rem_s_32", "shlo_l_32",
      "shlo_r_32", "shar_r_32", "add_64", "sub_64", "mul_64", "div_u_64", "div_s_64",
      "rem_u_64", "rem_s_64", "shlo_l_64", "shlo_r_64", "shar_r_64", "and", "xor", "or",
      "mul_upper_s_s", "mul_upper_u_u", "mul_upper_s_u", "set_lt_u", "set_lt_s", "cmov_iz",
      "cmov_nz", "rot_l_64", "rot_l_32", "rot_r_64", "rot_r_32", "and_inv", "or_inv", "xnor",
      "max", "max_u", "min", "min_u"
    ],
  },
];

/** An opcode's name and layout, or undefined for a byte that isn't an opcode. */
export function opcodeInfo(opcode: number): { name: string; layout: Layout } | undefined {
  for (const { layout, first, names } of LAYOUTS) {
    const name = names[opcode - first];
    if (name !== undefined) return { name, layout };
  }
  return undefined;
}

/** skip(i) (GP App. A): how many bytes after the opcode at i until the next opcode, at most 24. */
export function skip(program: Program, i: number): number {
  let j = 0;
  while (j < 24 && i + 1 + j < program.code.length && !startsInstruction(program, i + 1 + j)) j++;
  return j;
}

/** n bytes of code from i, little-endian; past the end, the code reads as zeros (GP's ζ). */
function readLE(program: Program, i: number, n: number): bigint {
  let value = 0n;
  for (let k = n - 1; k >= 0; k--) value = (value << 8n) | BigInt(program.code[i + k] ?? 0);
  return value;
}

/** X_n (GP App. A): an n-byte value sign-extended to 64 bits, as an unsigned number. */
export function signExtend(n: number, x: bigint): bigint {
  if (n === 0) return 0n;
  const negative = x >> BigInt(8 * n - 1) === 1n; // the top bit of the n bytes
  return negative ? x + (2n ** 64n - 2n ** BigInt(8 * n)) : x;
}

/** Z_n (GP App. A): an n-byte value read as a signed number. */
export function signed(n: number, x: bigint): bigint {
  if (n === 0) return 0n;
  return x < 2n ** BigInt(8 * n - 1) ? x : x - 2n ** BigInt(8 * n);
}

/** One decoded instruction: what it is, and its arguments in the order the GP names them. */
export type Instruction = {
  at: number; // ı: where its opcode is
  opcode: number;
  name: string;
  layout: Layout;
  registers: number[]; // register numbers, 0 to 12
  immediates: bigint[]; // sign-extended to 64 bits
  target?: number; // where an offset points: ı plus the signed offset
  next: number; // where the next instruction starts: ı + 1 + skip(ı)
};

/** Decodes the instruction at i (GP App. A.5): its opcode, then its layout's arguments. */
export function decodeInstruction(program: Program, i: number): Instruction {
  const opcode = program.code[i];
  const info = opcodeInfo(opcode);
  if (!info) throw new Error(`no instruction has opcode ${opcode}`);
  const l = skip(program, i);
  const byte = (k: number) => program.code[i + k] ?? 0;
  const low = Math.min(12, byte(1) % 16); // a register number in the low four bits
  const high = Math.min(12, Math.floor(byte(1) / 16)); // and another in the high four
  const imm = (at: number, n: number) => signExtend(n, readLE(program, i + at, n));
  const offset = (at: number, n: number) => i + Number(signed(n, readLE(program, i + at, n)));
  const next = i + 1 + l; // ı + 1 + skip(ı)
  const result: Instruction = { at: i, opcode, ...info, registers: [], immediates: [], next };
  switch (info.layout) {
    case "none":
      break;
    case "imm":
      result.immediates = [imm(1, Math.min(4, l))];
      break;
    case "regExtImm":
      result.registers = [low];
      result.immediates = [readLE(program, i + 2, 8)];
      break;
    case "immImm": {
      const lX = Math.min(4, byte(1) % 8);
      const lY = Math.min(4, Math.max(0, l - lX - 1));
      result.immediates = [imm(2, lX), imm(2 + lX, lY)];
      break;
    }
    case "offset":
      result.target = offset(1, Math.min(4, l));
      break;
    case "regImm":
      result.registers = [low];
      result.immediates = [imm(2, Math.min(4, Math.max(0, l - 1)))];
      break;
    case "regImmImm":
    case "regImmOffset": {
      const lX = Math.min(4, Math.floor(byte(1) / 16) % 8);
      const lY = Math.min(4, Math.max(0, l - lX - 1));
      result.registers = [low];
      result.immediates = [imm(2, lX)];
      if (info.layout === "regImmImm") result.immediates.push(imm(2 + lX, lY));
      else result.target = offset(2 + lX, lY);
      break;
    }
    case "regReg":
      result.registers = [low, high]; // r_D, then r_A
      break;
    case "regRegImm":
      result.registers = [low, high];
      result.immediates = [imm(2, Math.min(4, Math.max(0, l - 1)))];
      break;
    case "regRegOffset":
      result.registers = [low, high];
      result.target = offset(2, Math.min(4, Math.max(0, l - 1)));
      break;
    case "regRegImmImm": {
      const lX = Math.min(4, byte(2) % 8);
      const lY = Math.min(4, Math.max(0, l - lX - 2));
      result.registers = [low, high];
      result.immediates = [imm(3, lX), imm(3 + lX, lY)];
      break;
    }
    case "regRegReg":
      result.registers = [low, high, Math.min(12, byte(2))]; // r_A, r_B, r_D
      break;
  }
  return result;
}
```

`decodeInstruction` is one big `switch` over the layouts, each case a line of the Gray
Paper. `low` and `high` are the two register halves of byte ı + 1. `imm` reads and
sign-extends, `offset` reads, makes signed and adds ı. Reading past the end of the code
gives zeros (`?? 0`), just like the Gray Paper's ζ, which pads the code with zeros
forever.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ the reported packages: each one's hash and exports root, sorted by hash (226.5ms)
...
✔ immediates: sign-extended to 64 bits, or read as signed (0.5ms)
✔ three instructions by hand: load_imm, add_64, and a jump back (0.7ms)
✔ the bootstrap service: 39,849 instructions, all known, every jump on target (84.8ms)
...
ℹ tests 401
ℹ suites 0
ℹ pass 401
ℹ fail 0
...
reported 401 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791736324569
...
```

## Watch it

**New file** `bin/disassemble.ts`

```ts
// Disassembles a stretch of a service's code from the state before a trace's block: each
// instruction's place, name, registers, immediates and jump target.
// Usage: npm run disassemble <trace.json> [from, 0 unless you say] [how many, 12], e.g.
//        npm run disassemble ../vectors/traces/fallback/00000001.json 80282

import { readFileSync } from "node:fs";
import { fromHex } from "../src/bytes.ts";
import { Run } from "../src/obs.ts";
import type { Instruction } from "../src/pvm/instructions.ts";
import { decodeInstruction } from "../src/pvm/instructions.ts";
import { deblob, unpackCode } from "../src/pvm/program.ts";
import { serviceCode } from "../src/services.ts";
import type { KeyValue } from "../src/trie.ts";

const [file, from, count] = process.argv.slice(2);
const trace = JSON.parse(readFileSync(file, "utf8"));
const entries: KeyValue[] = trace.pre_state.keyvals.map((e: { key: string; value: string }) => ({
  key: fromHex(e.key),
  value: fromHex(e.value),
}));
const preimage = serviceCode(entries, 0);
if (!preimage) throw new Error("service 0's code isn't in this state");
const program = deblob(unpackCode(preimage).program);

/** An immediate as a person would write it: negative if its top bit is set. */
const show = (x: bigint) => String(x >= 2n ** 63n ? x - 2n ** 64n : x);

/** An instruction in one line: name, registers, immediates, target. */
function line({ name, registers, immediates, target }: Instruction): string {
  const args = [...registers.map((r) => `r${r}`), ...immediates.map(show)];
  if (target !== undefined) args.push(`→ ${target}`);
  return `${name.padEnd(16)} ${args.join(", ")}`;
}

const run = new Run("disassemble");
let at = Number(from ?? 0);
for (let n = 0; n < Number(count ?? 12) && at < program.code.length; n++) {
  const instruction = decodeInstruction(program, at);
  console.log(`${String(at).padStart(7)}  ${line(instruction)}`);
  run.event("instruction", { at, text: line(instruction) });
  at = instruction.next;
}
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

**What flows through it.** The raw code bytes going in, the
instruction decoded from them, and the lines printed:

::: code-group

```text [what goes in]
argv: ../vectors/traces/fallback/00000001.json 0 4
code bytes 0 to 15 of the unpacked blob:
  28 9a 39 01 00   28 a9 67 01   95 11 a0   7b 10 58
bitmask: 21 92 … — its 1 bits mark bytes 0, 5, 9 and 12 as instruction starts
```

```ts [what it computes]
// bin/disassemble.ts's first instruction, decoded from 28 9a 39 01 00
const computed = {
  opcode: 0x28, // 40: jump
  immediates: [80282n], // 9a 39 01 00 read little-endian
  next: 5, // the bitmask's next 1 bit: this instruction took 5 bytes
  target: 80282, // where the jump goes: refine's front door
};
```

```text [what comes out]
      0  jump             → 80282
      5  jump             → 92078
```

:::

The gaps between the bytes are the bitmask's doing: without it, the same sixteen bytes could
be sliced a dozen ways.

**Run**

```sh
npm pkg set scripts.disassemble="node bin/disassemble.ts"
npm pkg set scripts.disassemble-fallback="node bin/disassemble.ts ../vectors/traces/fallback/00000001.json 0 4"
npm run disassemble-fallback
```

```text
      0  jump             → 80282
      5  jump             → 92078
      9  add_imm_64       r1, r1, -96
     12  store_ind_u64    r0, r1, 88
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=disassemble-1791736329537
```

The very first two instructions are jumps, and that's no accident: the PVM starts
*refine* at byte 0 and *accumulate* at byte 5 (App. B; §9 just numbers them 0 and 1). They're the code's two
front doors. Follow the first one, `npm run disassemble
../vectors/traces/fallback/00000001.json 80282`, and you're reading the start of a
function: `add_imm_64 r1, r1, -752` makes room on the stack (r1 is the stack pointer),
and `store_ind_u64 r0, r1, 744` saves the return address (r0) there. Then [lesson 15.1](./01-the-program-blob.md)'s
most common opcodes have names: `load_ind_u64` and `store_ind_u64`, moving 8-byte values
between registers and memory, and `load_imm`. The *Disassembly* panel, on **6 · The PVM**,
shows each instruction.

![Disassembly panel](./images/02-disassembly.png)

<details>
<summary>lasair: one variant per instruction, in <code>lib/pvm_decode.ml</code></summary>

```ocaml
  (* One register + two immediates: l_X from byte[1]/16 mod 8 *)
  | 70 | 71 | 72 | 73 ->
    let byte1 = get_byte code pc 1 in
    let ra = decode_reg byte1 in
    let l_x = min 4 ((byte1 / 16) mod 8) in
    let imm_x = sign_extend l_x (decode_le code pc 2 l_x) in
    let l_y = min 4 (max 0 (l - l_x - 1)) in
    let imm_y = sign_extend l_y (decode_le code pc (2 + l_x) l_y) in
    (match opcode with
     | 70 -> Store_imm_ind_u8 { ra; offset = imm_x; value = imm_y }
```

The same formulas, line for line. The difference is what comes out: lasair gives every
instruction its own OCaml variant with named fields, `offset` and `value`, so the
compiler checks that the executor uses each one right. Your `Instruction` is one record
for all 139, with lists of registers and immediates. Simpler to write; the names come
from the Gray Paper's order instead. lasair also leaves an offset relative until it
runs, where yours works out the target straight away.

</details>

## Check your understanding

::: check
**Why are an instruction's short immediates sign-extended into the 64-bit register?**

- [x] So one byte can stand for a small negative number, like −1, as well as a small positive one
  > Yes: a set top bit means negative, and sign extension fills the bytes above with ones,
  > so the register holds the same number in 64 bits.
- [ ] So that every immediate comes out positive
  > No: that's zero extension. Sign extension is what lets an immediate be negative.
- [ ] To use less gas
  > No: extension costs nothing extra. It decides which number the bytes mean.

**A jump's offset is counted from where?**

- [ ] From the next instruction
  > No: that's how many CPUs do it, but not the PVM.
- [x] From the jump's own opcode, ı
  > Yes: the target is ı plus the offset, and offsets are signed, so a jump can go back
  > as well as forward. The target must start an instruction.
- [ ] From the start of the program
  > No: that would be an absolute address. Jump offsets are relative to the jump.

**How does the PVM know that `load_imm`'s immediate is one byte long?**

- [ ] A length byte comes in front of it
  > No: no length is written down anywhere.
- [ ] Every immediate is 4 bytes
  > No: an immediate takes 0 to 4 bytes. Four here would swallow the start of the
  > `add_64`.
- [x] The bitmask says the next instruction starts at 3
  > Yes: so skip(0) is 2, one byte for the register and one left for the immediate. An
  > instruction ends where the next begins.

**`add_64` names three registers. Which one does it write?**

- [ ] The first one named
  > No: the first two are the inputs.
- [x] The third: the first two are added, and the sum goes into the third
  > Yes: two registers share one byte, four bits each, as the inputs; the next byte names
  > the register written.
- [ ] Whichever is lowest numbered
  > No: the order the registers are named in decides, not their numbers.
:::

## What you have

A disassembler: any JAM service's code, read instruction by instruction, every
argument decoded and every jump checked against the real thing. Reading a program isn't
running it: [lesson 15.3](./03-the-machine.md) builds the machine that steps through one.

**Say it out loud.** 139 instructions in 13 layouts. An instruction's length isn't written anywhere: the bitmask says where the next one starts.

Next: [15.3 The machine](./03-the-machine.md)
