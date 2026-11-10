# The pipeline

[Lesson 15.9](./09-what-instructions-cost.md)'s block from the bootstrap service adds up to 91 cycles. Yet a real CPU would
run it in far fewer, because it doesn't do one thing at a time. While one instruction
waits on memory, others start; while a store crawls along, three more crawl beside it.
The Gray Paper's gas model builds exactly such a CPU, small and made up, and charges a
basic block the cycles that CPU needs.

It's the kitchen from [lesson 15.9](./09-what-instructions-cost.md). Orders are taken in
sequence, and dishes that don't depend on each other cook side by side, up to the number of
stations. A dish that needs another's output waits for it. Dishes go out in the order they
were taken, however fast each one cooked. The bill is how long the whole kitchen took, not
the sum of the recipes. That's the whole idea; the rest of this lesson is its exact rules.

## What the Gray Paper says

App. A.9 first sets up the model CPU's state:

::: gray-paper A.9 1-11

#### Appendix A.9 Gas Cost Model {#gp-A-9}

<a id="gp-A-9-p1"></a>The gas cost model for the PVM is a simplified model of a modern CPU microarchitecture, heavily inspired by what's used by production-grade compilers to predict how much time a given piece of code will take. For each <abbr class="gp-term" title="a run of instructions with one way in; a jump may only land at its start">basic block</abbr> in the program the model simulates its execution flow and computes the required number of virtual CPU cycles that would be needed to execute it.

<a id="gp-A-9-p2"></a>A gas simulation state, of set $\mathbb{S}$, contains the current instruction counter $\imath$, a cycle counter $c$, the number of decode slots $d$ remaining in the current cycle, the maximum number of instructions $e$ which are still allowed to start execution in the current cycle, the remaining available execution units $t$, and the <abbr class="gp-term" title="where a CPU keeps decoded instructions, in order, until each has run and retired">reorder buffer</abbr> $\mathbf{r}$. Formally:

<a id="gp-A-9-p3"></a><a id="eq-A-49"></a>

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
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-tuple">$\!\left\lgroup x\right\rgroup\!$</span> | the tuple of | a record: named fields, each with its type, like an object in JSON |
| <span id="gk-isa">[$x\in y$](../symbols.md#in)</span> | in | belongs to: the field's type |
| <span id="gk-imath">$\imath$</span> | i | the instruction counter: the index in the code of the instruction to run next |
| <span id="gk-pvmreg" class="gk-wrap">$\mathbb{N}_R$</span> | N sub R | a register's value: a u64 |
| <span id="gk-cup">$\cup$</span> | union | everything in either side |
| <span id="gk-set">$\left\{\,x\,\right\}$</span> | the set of | a set: values with no order and no repeats |
| <span id="gk-none" class="gk-wrap">$\emptyset$</span> | nothing | ∅: no value at all, like null |
| <span id="gk-ctr-cycles">$c$</span> | c | the model CPU's clock: the cycles so far |
| <span id="gk-N" class="gk-wrap">[$\mathbb{N}$](../symbols.md#naturals)</span> | N | the whole numbers: 0, 1, 2 and up; a subscript is a bound, ℕ₈ is 0 to 7 |
| <span id="gk-remaining-decodeslots">$d$</span> | d | decode slots left this cycle, out of 4 |
| <span id="gk-remaining-startpercycle">$e$</span> | e | how many more instructions may start this cycle, out of 5 |
| <span id="gk-remaining-execunits">$t$</span> | t | the execution units free right now, of each kind |
| <span id="gk-execunits-ty" class="gk-wrap">$\mathbb{E}$</span> | E | a count of each kind of execution unit: ALU, load, store, multiply, divide |
| <span id="gk-rob" class="gk-wrap">$\mathbf{r}$</span> | r | the reorder buffer: decoded instructions, in order, waiting, running or finished |
| <span id="gk-sequence">[$\left[\!\left[x\right]\!\right]$](../symbols.md#sequence)</span> | a sequence of | ⟦T⟧ is an array of T; a subscript is its length, :n at most n, n: at least n |
| <span id="gk-rob-entry-ty" class="gk-wrap">$\mathbb{R}$</span> | R | a reorder buffer entry: its state, its cycles left, what it waits on, the registers it makes, the units it uses |

</details>

→ [(A.49) in plain words](./gray-paper.md#ex-A-49)

<a id="gp-A-9-p4"></a>A reorder buffer entry, of set $\mathbb{R}$, contains its current state $s$, the number of cycles left $c$, a set of reorder buffer indices considered its dependencies $p$, a set of clobbered registers $r$, and the execution units used $t$. Formally:

<a id="gp-A-9-p5"></a><a id="eq-A-50"></a>

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
| <span id="gk-subseteq">$\subseteq$</span> | is a subset of | everything in the left is in the right |
| <span id="gk-rob-regs">$r$</span> | r | the registers this entry will make, until a later entry takes one over |
| <span id="gk-Nmax">[$\mathbb{N}_{x}$](../symbols.md#naturals)</span> | N sub n | the whole numbers below n: ℕ_C is a core index, 0 to C − 1 |

</details>

→ [(A.50) in plain words](./gray-paper.md#ex-A-50)

<a id="gp-A-9-p6"></a>A tuple of the set $\mathbb{E}$ maps each execution unit kind (${\text{A}, \text{L}, \text{S}, \text{M}, \text{D}}$) into a number:

<a id="gp-A-9-p7"></a><a id="eq-A-51"></a>

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

→ [(A.51) in plain words](./gray-paper.md#ex-A-51)

<a id="gp-A-9-p8"></a>For convenience we define addition and subtraction of two tuples of the set $\mathbb{E}$ to be equivalent to the memberwise operation of the same kind; formally:

<a id="gp-A-9-p9"></a><a id="eq-A-52"></a>

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
| <span id="gk-forall">$\forall$</span> | for all | for every value: ∀c ∈ ℕ_C means for each core c |
| <span id="gk-in">[$\in$](../symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-oplus">$\oplus$</span> | o plus | in the instruction tables, xor: one or the other but not both; in the gas model, any one of the operations listed beside it |

</details>

→ [(A.52) in plain words](./gray-paper.md#ex-A-52)

<a id="gp-A-9-p10"></a>Similarly, a comparison between two tuples of the set $\mathbb{E}$ is true if and only if the chosen comparison holds for all corresponding members:

<a id="gp-A-9-p11"></a><a id="eq-A-53"></a>

$$
\begin{equation}
\begin{aligned}
&\forall a,b \in \mathbb{E};\forall \oplus \in \left\{\,<, >, \le, \ge\,\right\}: \\
&\quad a \oplus b \equiv \bigwedge_{k \in \left\{\,\text{A}, \text{L}, \text{S}, \text{M}, \text{D}\,\right\}} a_k \oplus b_k
\end{aligned} \tag{A.53}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-le">$\le$</span> | at most | less than or equal to |
| <span id="gk-ge">$\ge$</span> | is at least | greater than or equal to |
| <span id="gk-bigwedge">$\bigwedge$</span> | all of | every one of the conditions under it is true |

</details>

→ [(A.53) in plain words](./gray-paper.md#ex-A-53)

:::

then prices a block by running it, cycle by cycle:

::: gray-paper A.9 14-29

#### Appendix A.9 Gas Cost Model, continued

<a id="gp-A-9-p14"></a>The gas cost of a given basic block starting at instruction opcode index $\imath \in \varpi$ and given the instruction data $\mathbf{c}$ and the <abbr class="gp-term" title="one bit per byte of code, marking the bytes where an instruction starts">opcode bitmask</abbr> $\mathbf{k}$ is defined by the number of virtual CPU cycles as determined by the gas cost model transition function, up until every instruction of the basic block it has ingested has been retired and the simulation has converged. Formally:

<a id="gp-A-9-p15"></a><a id="eq-A-54"></a>

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
| <span id="gk-gascostforblock" class="gk-wrap">$\varrho^{\Delta}$</span> | rho delta | a basic block's gas cost: its cycles on the model CPU, less 3, and at least 1 |
| <span id="gk-abracegrouptwo">$\left\{ \begin{array}{@{}l@{}} \begin{aligned} x \end{aligned} \\[14pt] \hspace{8pt}\begin{aligned} y \end{aligned} \end{array} \right.$</span> | as follows | a brace grouping lines that hold together: a function's type, what each input becomes, then its helpers below |
| <span id="gk-blob">[$\mathbb{B}$](../symbols.md#blobs)</span> | B, or B sub n | bytes: any run of them; 𝔹ₙ exactly n of them |
| <span id="gk-bitstring">$\mathbb{b}$</span> | b sub n | bits: a run of true-or-false values; a subscript is how many |
| <span id="gk-to">[$\to$](../symbols.md#to)</span> | to | what goes in, to what comes out: A → B takes an A and gives a B |
| <span id="gk-mapsto">$\mapsto$</span> | maps to | what a function gives back for an input: x ↦ y says x becomes y |
| <span id="gk-max">$\max$</span> | max of | the largest of the values in the brackets |
| <span id="gk-gas-sim-state" class="gk-wrap">$\mathbf{x}$</span> | x | a state of the model CPU, one of 𝕊 |
| <span id="gk-gas-sim" class="gk-wrap">$\mathfrak{X}$</span> | X (gothic) | the model CPU: runs a basic block step by step until every instruction has retired |
| <span id="gk-const-maxdecodepercycle">$4$</span> | 4 | decode slots each cycle |
| <span id="gk-const-maxstartpercycle">$5$</span> | 5 | the most instructions that may start each cycle |
| <span id="gk-sq">[$\left[x\right]$](../symbols.md#sequence)</span> | the sequence | a sequence written out item by item; [ ] is the empty one |

</details>

→ [(A.54) in plain words](./gray-paper.md#ex-A-54)

<a id="gp-A-9-p16"></a>The gas cost model simulation function $\mathfrak{X}$ is defined as follows:

<a id="gp-A-9-p17"></a><a id="eq-A-55"></a>

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
| <span id="gk-abracegroup">$\left\{ \begin{aligned}x\end{aligned} \right.$</span> | as follows | a brace grouping lines that hold together: for a function, its type on top, then what each input becomes |
| <span id="gk-neq">$\neq$</span> | is not | not equal |
| <span id="gk-land">$\land$</span> | and | both sides are true |
| <span id="gk-cost-decodeslots" class="gk-wrap">$\check{d}$</span> | d check | the decode slots an instruction needs: 1 to 4 |
| <span id="gk-leq">$\leq$</span> | at most | less than or equal to |
| <span id="gk-find-readytostart" class="gk-wrap">$\mathfrak{S}$</span> | S (gothic) | the first waiting entry whose inputs are ready and whose units are free; ∅ if none |
| <span id="gk-len">$\left\vert x\right\vert$</span> | the size of | \|x\|: how many items x has, or how many bytes |
| <span id="gk-build">$\left\{ x \;\middle\vert\; y \right\}$</span> | for each, such that | built by a rule: the left-hand value, for every case the right-hand side allows (a set, or a sequence in order) |
| <span id="gk-orderedin">$\mathrel{\unicode{x2B40}}$</span> | in order, from | each item of the sequence, in its order |
| <span id="gk-in-rob" class="gk-wrap">${\mathbf{x}_{\mathbf{r}}}$</span> | x sub r | this state's reorder buffer |

</details>

→ [(A.55) in plain words](./gray-paper.md#ex-A-55)

<a id="gp-A-9-p18"></a>The state transition function $\mathfrak{X}'$ which decodes the instructions without triggering the virtual CPU pipeline simulation is defined as follows:

<a id="gp-A-9-p19"></a><a id="eq-A-56"></a>

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

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-token">$\texttt{x}$</span> | the string | a name in typewriter type: an instruction's or helper's name, or fixed bytes written as text: the ASCII bytes of its words; the dollar sign in front only marks them as text and is not one of the bytes |

</details>

→ [(A.56) in plain words](./gray-paper.md#ex-A-56)

<a id="gp-A-9-p20"></a>The `move_reg` instruction is special-cased to be handled by the frontend of our virtual CPU, without being added to the reorder buffer:

<a id="gp-A-9-p21"></a><a id="eq-A-57"></a>

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
| <span id="gk-Fskip">$\text{skip}$</span> | skip | skip(i): how many bytes follow the opcode at i before the next opcode, at most 24 |
| <span id="gk-in-rob-len" class="gk-wrap">$\mathbb{N}_{\left\vert{\mathbf{x}_{\mathbf{r}}}\right\vert}$</span> | N sub the size of x sub r | the reorder buffer's indices: 0 up to its length less 1 |
| <span id="gk-rob-entry-field">$x\left[y\right]_{z}$</span> | x at y, its z | field z of entry y of the buffer x |
| <span id="gk-in-rob-field">${{\mathbf{x}_{\mathbf{r}}}\left[x\right]}_{y}$</span> | x sub r at x, its y | field y of entry x of the reorder buffer |
| <span id="gk-inst-dstregs" class="gk-wrap">$\check{r}$</span> | r check | the registers an instruction writes |
| <span id="gk-cap">$\cap$</span> | intersection | only what's in both sides |
| <span id="gk-inst-srcregs" class="gk-wrap">$\check{s}$</span> | s check | the registers an instruction reads |
| <span id="gk-setminus">$\setminus$</span> | without | the left side with every item of the right taken out |

</details>

→ [(A.57) in plain words](./gray-paper.md#ex-A-57)

<a id="gp-A-9-p22"></a>Every other instruction is fully decoded and added to the reorder buffer as follows:

<a id="gp-A-9-p23"></a><a id="eq-A-58"></a>

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
| <span id="gk-instructions" class="gk-wrap">$\zeta$</span> | zeta | the code 𝐜 with zeros after it forever: reading past the end gives 0, which is trap |
| <span id="gk-cost-cycles" class="gk-wrap">$\check{c}$</span> | c check | an instruction's cycles: 1 for an add, 25 for a load or store, 60 for a divide |
| <span id="gk-cost-execunits" class="gk-wrap">$\check{x}$</span> | x check | the execution units an instruction needs to start |
| <span id="gk-append">[$\mathbin{+\!\!+}$](../symbols.md#concat)</span> | append | add one item at the end of the sequence |
| <span id="gk-state-decoding">$\text{DEC}$</span> | decoding | DEC: just entered the buffer this cycle |

</details>

→ [(A.58) in plain words](./gray-paper.md#ex-A-58)

<a id="gp-A-9-p24"></a>The state transition function $\mathfrak{X}''$ which starts the execution of the next pending instruction is defined as follows:

<a id="gp-A-9-p25"></a><a id="eq-A-59"></a>

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

→ [(A.59) in plain words](./gray-paper.md#ex-A-59)

<a id="gp-A-9-p26"></a>The function $\mathfrak{S}$ which checks which instruction inside of the reorder buffer is ready to start executing (and whether such an instruction even exists) is defined as follows:

<a id="gp-A-9-p27"></a><a id="eq-A-60"></a>

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
| <span id="gk-min">$\min$</span> | the least of | the smallest of the values given; min(24, j : …) is the smallest j that fits, but no more than 24 |
| <span id="gk-state-waiting">$\text{WAIT}$</span> | waiting | WAIT: decoded, and starts once its inputs are ready and its units free |

</details>

→ [(A.60) in plain words](./gray-paper.md#ex-A-60)

<a id="gp-A-9-p28"></a>The state transition function $\mathfrak{X}'''$ which simulates the rest of the virtual CPU pipeline is defined as follows:

<a id="gp-A-9-p29"></a><a id="eq-A-61"></a>

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
| <span id="gk-sum">$\sum$</span> | the sum of | add up what follows, once for each value the subscript ranges over |
| <span id="gk-state-executed">$\text{FIN}$</span> | finished | FIN: done running, and retires once everything before it has |

</details>

→ [(A.61) in plain words](./gray-paper.md#ex-A-61)

:::

In plain words, the model CPU works like this:

1. **Decode.** Each cycle, the front end decodes instructions in order, up to 4 decode
   slots' worth ([lesson 15.9](./09-what-instructions-cost.md)'s ď), into a *reorder buffer*. At most 32 instructions can
   be in it, not yet retired. Decoding stops at the block's terminator.
2. **Wait.** The next cycle, a decoded instruction is waiting. It can start once every
   earlier instruction that writes a register it reads has finished its cycles, and once
   the units it needs are free. The CPU has 4 ALUs, 4 load units, 4 store units, 1
   multiplier and 1 divider. Up to 5 instructions start each cycle.
3. **Execute.** It runs for its cycles (č), then gives its units back and is finished.
4. **Retire.** Finished instructions leave the buffer *in order*: one retires only once
   everything before it has.

`move_reg` never enters the buffer at all: the front end just notes that whatever
produces its source register now produces its destination too, and anything that reads
the destination waits on that. It's free, but the wait follows the value through it.

When everything has been decoded and retired, the block's gas is the cycles taken, less
3, and at least 1. (Run one instruction alone and it costs exactly its own cycles: the 3
is the pipeline's own overhead.)

The Gray Paper writes those stages as steps on a state 𝕊: X′ decodes, X″ starts, X‴ ticks
the clock, and X picks which comes next: decode if it can, else start, else stop if
everything has retired, else tick.

Step through it below. Pick one of this lesson's blocks, or build your own, and move a
cycle at a time. Each row is a line of the block; each column is the start of a cycle,
as the printout further down catches it. Four loads start together and finish together.
In a chain, each load waits for the register the one before it is making. Two divides
take turns at the one divider. When everything has retired, the block's cost appears.

<PipelineCycles />

**Try it in the [playground](../pvm-playground.md).** Press **What a block really costs**, then **Run**. The Gas panel lists three prices: 5 for four sums side by side, 8 for the same four in a chain, 60 for one division.

## The tests

**Add to** `test/gas.test.ts`

```ts
import { blockCost } from "../src/pvm/gas.ts";
import { deblob, unpackCode } from "../src/pvm/program.ts";
import { bootstrapCode } from "./vectors.ts";
import type { Program, ServiceCode } from "../src/pvm/program.ts";

/** The gas a hand-made block costs, from its first instruction. */
const gas = (...instructions: number[][]) => blockCost(assemble(instructions), 0);

// load_ind_u64 is [130, A + 16·B]: φ_A from memory at φ_B. trap ends each block.
test("one instruction on its own costs its cycles: the 3 is the pipeline's overhead", () => {
  const trap: number = gas([0]); // trap
  assert.equal(trap, 2);
  const jump: number = gas([40, 0]); // jump
  assert.equal(jump, 15);
});

test("independent loads run side by side: four cost no more than one, a fifth waits", () => {
  const oneLoad: number = gas([130, 0x12], [0]); // r2 = [r1]
  assert.equal(oneLoad, 25);
  const fourLoads: number = gas([130, 0x12], [130, 0x13], [130, 0x14], [130, 0x15], [0]);
  assert.equal(fourLoads, 25);
  const fiveLoads: number = gas(
    [130, 0x12], [130, 0x13], [130, 0x14], [130, 0x15], [130, 0x16], [0],
  );
  assert.equal(fiveLoads, 50);
});

test("a load that needs another's answer waits for it", () => {
  const chainOfTwo: number = gas([130, 0x12], [130, 0x23], [0]); // r2 = [r1], then r3 = [r2]
  assert.equal(chainOfTwo, 50);
  const chainOfThree: number = gas([130, 0x12], [130, 0x23], [130, 0x34], [0]);
  assert.equal(chainOfThree, 75);
});

test("move_reg is free, and the wait follows the value through it", () => {
  const throughMove: number = gas([130, 0x12], [100, 0x25], [130, 0x53], [0]); // r5 = r2, r3 = [r5]
  assert.equal(throughMove, 50);
});

test("there's one divide unit: two divides take turns", () => {
  const oneDivide: number = gas([203, 0x10, 2], [0]); // div_u_64 r2 = r0 ÷ r1
  assert.equal(oneDivide, 60);
  const twoDivides: number = gas([203, 0x10, 2], [203, 0x10, 3], [0]);
  assert.equal(twoDivides, 120);
});

test("a real block: the bootstrap service's first costs 26, not the 91 its cycles add to", () => {
  const program: Program = deblob(unpackCode(bootstrapCode()).program);
  const first: number = blockCost(program, 92078);
  assert.equal(first, 26);
});
```

Loads make the clearest examples: 25 cycles each, and 4 load units. Four independent
loads cost what one does. A load whose address comes from another load must wait for it.

## The code

The model decodes until the block's terminator, so it needs [lesson 15.3](./03-the-machine.md)'s T:

**Replace in** `src/pvm/machine.ts`

```ts
/** T (GP App. A.3): the instructions that end a basic block. */
export const TERMINATORS = new Set([0, 1, 40, 50, 80, 180, 170, 171, 172, 173, 174, 175]);
for (let opcode = 81; opcode <= 90; opcode++) TERMINATORS.add(opcode); // the immediate branches
```

**Add to** `src/pvm/gas.ts`

```ts
import { decodeInstruction } from "./instructions.ts";
import { TERMINATORS } from "./machine.ts";

/** A reorder buffer entry's state: decoding, waiting, executing, finished, or retired. */
type State = "DEC" | "WAIT" | "EXE" | "FIN" | null;

/** An instruction in the reorder buffer (GP's ℝ): its state, cycles to go, what it waits on. */
type Entry = { state: State; cycles: number; deps: number[]; regs: number[]; units: Units };

/**
 * The model CPU (GP's 𝕊): where it's decoding, its clock, what's left this cycle, and the
 * reorder buffer, where decoded instructions wait, run and retire.
 */
export type Cpu = {
  pc: number | null; // ı: the next instruction to decode, or null once the block is decoded
  cycles: number; // c
  decode: number; // d: decode slots left this cycle
  start: number; // e: instructions that may still start this cycle
  units: Units; // t: execution units free
  rob: Entry[]; // r
};

/** Units added up, kind by kind (or taken away, with a sign of −1). */
const plus = (a: Units, b: Units, sign = 1) => a.map((u, k) => u + sign * b[k]) as Units;

/** S (GP App. A.9): the first waiting instruction whose units are free and inputs ready. */
function readyToStart(cpu: Cpu): number | null {
  const ready = cpu.rob.findIndex(
    (e) =>
      e.state === "WAIT" &&
      e.units.every((u, k) => u <= cpu.units[k]) &&
      e.deps.every((k) => cpu.rob[k].cycles === 0),
  );
  return ready === -1 ? null : ready;
}

/** X′ (GP App. A.9): decodes one instruction into the reorder buffer. */
function decode(cpu: Cpu, program: Program, ins: Instruction): void {
  const { reads, writes } = registersUsed(ins);
  if (ins.name === "move_reg") {
    // X^mov: no work at all. Whatever makes the register it reads now makes its destination.
    for (const e of cpu.rob) {
      const feeds = e.regs.some((r) => reads.includes(r));
      e.regs = feeds ? [...e.regs, ...writes] : e.regs.filter((r) => !writes.includes(r));
    }
    cpu.pc = ins.next;
    cpu.decode -= 1;
    return;
  }
  // X^dec: it waits on every entry that makes a register it reads.
  const { cycles, slots, units } = instructionCost(program, ins);
  const deps = cpu.rob.flatMap((e, i) => (e.regs.some((r) => reads.includes(r)) ? [i] : []));
  for (const e of cpu.rob) e.regs = e.regs.filter((r) => !writes.includes(r));
  cpu.rob.push({ state: "DEC", cycles, deps, regs: writes, units });
  cpu.pc = TERMINATORS.has(ins.opcode) ? null : ins.next;
  cpu.decode -= slots;
}

/** X″ (GP App. A.9): starts the first instruction that's ready. */
function startOne(cpu: Cpu, n: number): void {
  cpu.start -= 1;
  cpu.units = plus(cpu.units, cpu.rob[n].units, -1);
  cpu.rob[n].state = "EXE";
}

/** X‴ (GP App. A.9): one tick of the clock. */
function tick(cpu: Cpu): void {
  cpu.cycles += 1;
  cpu.decode = 4;
  cpu.start = 5;
  let retiring = true; // has everything up to here finished? Then it retires, in order
  for (const e of cpu.rob) {
    retiring &&= e.state === "FIN" || e.state === null;
    const executing = e.state === "EXE";
    if (executing && e.cycles === 1) cpu.units = plus(cpu.units, e.units); // done: units free
    if (retiring) e.state = null;
    else if (e.state === "DEC") e.state = "WAIT";
    else if (executing && e.cycles === 0) e.state = "FIN";
    if (executing && e.cycles > 0) e.cycles -= 1;
  }
}

/**
 * ϱ^Δ (GP App. A.9): the gas a basic block costs. The model CPU decodes up to 4 slots and
 * starts up to 5 instructions a cycle, runs them on (4, 4, 4, 1, 1) units, and retires
 * them in order. The cost is its cycles until all are retired, less 3, and at least 1.
 * `watch`, if given, sees the CPU after every tick.
 */
export function blockCost(program: Program, start: number, watch?: (cpu: Cpu) => void): number {
  const cpu: Cpu = { pc: start, cycles: 0, decode: 4, start: 5, units: [4, 4, 4, 1, 1], rob: [] };
  for (;;) {
    const live = cpu.rob.filter((e) => e.state !== null).length;
    const ins = cpu.pc === null ? null : decodeInstruction(program, cpu.pc);
    const ready = readyToStart(cpu);
    if (ins && instructionCost(program, ins).slots <= cpu.decode && live < 32) {
      decode(cpu, program, ins);
    } else if (ready !== null && cpu.start > 0) {
      startOne(cpu, ready);
    } else if (cpu.pc === null && live === 0) {
      return Math.max(cpu.cycles - 3, 1);
    } else {
      tick(cpu);
      watch?.(cpu); // lets a watcher see each cycle
    }
  }
}
```

Each Gray Paper function is one small function here. `decode` is X′, with X^mov as its
first branch. Its dependencies are worked out *before* the new instruction takes over its
registers, so it waits on the old writer, not on itself. `startOne` is X″, and `tick` is
X‴. In `tick`, `retiring` stays true only while every entry so far has finished: that's
"retire in order" in one line. `blockCost` is X, its four cases in the Gray Paper's
order.

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ one instruction on its own costs its cycles: the 3 is the pipeline's overhead (0.3ms)
✔ independent loads run side by side: four cost no more than one, a fifth waits (0.3ms)
✔ a load that needs another's answer waits for it (0.3ms)
✔ move_reg is free, and the wait follows the value through it (0.2ms)
✔ there's one divide unit: two divides take turns (0.3ms)
✔ a real block: the bootstrap service's first costs 26, not the 91 its cycles add to (13.1ms)
...
✔ the reported packages: each one's hash and exports root, sorted by hash (254.0ms)
...
ℹ tests 443
ℹ suites 0
ℹ pass 443
ℹ fail 0
...
reported 443 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791737113888
...
```

## Watch it

**New file** `bin/pipeline.ts`

```ts
// Runs a real basic block through the model CPU, the one the bootstrap service's
// accumulation jumps to first, and draws its reorder buffer cycle by cycle.
// Usage: npm run pipeline

import { readFileSync } from "node:fs";
import { fromHex } from "../src/bytes.ts";
import { Run } from "../src/obs.ts";
import { blockCost } from "../src/pvm/gas.ts";
import { decodeInstruction } from "../src/pvm/instructions.ts";
import { deblob, unpackCode } from "../src/pvm/program.ts";
import { serviceCode } from "../src/services.ts";
import type { KeyValue } from "../src/trie.ts";

const trace = JSON.parse(readFileSync("../vectors/traces/fallback/00000001.json", "utf8"));
const entries: KeyValue[] = trace.pre_state.keyvals.map((e: { key: string; value: string }) => ({
  key: fromHex(e.key),
  value: fromHex(e.value),
}));
const program = deblob(unpackCode(serviceCode(entries, 0)!).program);
const start = decodeInstruction(program, 5).target as number; // where accumulation jumps

const LETTER = { DEC: "D", WAIT: "W", EXE: "E", FIN: "F" } as const;
const run = new Run("pipeline");
let last = "";
const cost = blockCost(program, start, (cpu) => {
  const row = cpu.rob.map((e) => (e.state === null ? "." : LETTER[e.state])).join(" ");
  if (row === last) return; // only the cycles where something changes
  last = row;
  console.log(`cycle ${String(cpu.cycles).padStart(2)}  ${row}`);
  run.event("cycle", { cycle: cpu.cycles, row });
});
console.log(`the block at ${start} costs ${cost} gas`);
run.event("cost", { block: start, cost });
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

**What flows through it.** The same basic block going in as
[lesson 15.9](./09-what-instructions-cost.md) priced, the model CPU's buffer mid-flight, and the lines printed:

::: code-group

```text [what goes in]
the basic block at 92078 of service 0's code (the fallback trace):
  add_imm_64, three store_ind_u64s, two move_regs, load_imm_jump —
  91 cycles if each instruction waited for the one before
```

```ts [what it computes]
// the reorder buffer at cycle 3, one column per buffered instruction
const computed = {
  rob: "F E E E E", // the add finished; three stores and the call, side by side
  why: "the stores needed the add's r1; from here they overlap", // cycle 2's W W W W
  retired: 29, // everything finished at 28, retired at 29
  gas: 26, // 29 - 3: far under the 91 of one-at-a-time
};
```

```text [what comes out]
cycle  3  F E E E E
the block at 92078 costs 26 gas
```

:::

**Run**

```sh
npm pkg set scripts.pipeline="node bin/pipeline.ts"
npm run pipeline
```

```text
cycle  1  W W W W
cycle  2  E W W W W
cycle  3  F E E E E
cycle  4  . E E E E
cycle 18  . E E E F
cycle 28  . F F F F
cycle 29  . . . . .
the block at 92078 costs 26 gas
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=pipeline-1791737119776
```

One column per instruction in the buffer: the stack-pointer add, the three stores and the
call (the two `move_reg` instructions never get a column). W is waiting, E executing, F finished, and
a dot is retired. (Decoding lasts only until the next tick, so you never catch a D.) Read
it top down. At cycle 2 the add runs while the
stores wait: they need its r1. From cycle 3 all three stores run side by side, with the
15-cycle call beside them. The call finishes at 18 but can't retire before the stores
ahead of it. At 28 everything is finished, at 29 everything is retired: 29 − 3 = 26 gas.
The *Pipeline* panel, on **6 · The PVM**, keeps the picture.

![Pipeline panel](./images/10-pipeline.png)

<details>
<summary>lasair: the clock tick, in <code>lib/pvm_gas.ml</code></summary>

```ocaml
             let all_done = ref true in
             for j = !head to !rob_len - 1 do
               let en = !rob.(j) in
               let old_st = en.st and old_cyc = en.cycles_left in
               if not (old_st = Fin || old_st = Retired) then all_done := false;
               en.st <- (if !all_done then Retired
                         else if old_st = Dec then Wait
                         else if old_st = Exe && old_cyc = 0 then Fin
                         else old_st);
```

The same single pass as your `tick`, with `all_done` for your `retiring`. lasair adds
speed: it skips the retired entries at the front of the buffer with `head`, and
remembers each block's cost once worked out. On the bootstrap service's 6,229 basic
blocks, the two give the same cost every time.

</details>

## Check your understanding

::: check
**Four independent loads cost 25, the same as one. Why does a fifth make it 50?**

- [ ] Every load after the fourth costs double
  > No: every load takes 25 cycles. The fifth just can't start until one is done.
- [x] The CPU has 4 load units, so the fifth waits for one to come free
  > Yes: four start together and finish 25 cycles later. The fifth starts then, and takes
  > 25 more.
- [ ] The reorder buffer holds only 4 instructions
  > No: it holds 32. It's the units that run out.

**`r2 = [r1]`, then `r3 = [r2]`, costs 50. Why not 25, as two loads side by side?**

- [x] The second load's address is the first load's answer, so it waits for it
  > Yes: it reads r2, which the first load is still making. It starts only once that one
  > has finished its 25 cycles.
- [ ] Two loads always take turns
  > No: four independent loads run side by side, for 25. It's the shared register that
  > makes these two wait.
- [ ] They might read the same memory, so they mustn't overlap
  > No: the model never looks at addresses, only at registers and units.

**`r2 = [r1]`, `move_reg r5 = r2`, `r3 = [r5]` costs 50 too. What does `move_reg` change?**

- [ ] It adds a cycle for the copy
  > No: `move_reg` never enters the reorder buffer, and costs nothing.
- [ ] Nothing, so the third load runs beside the first
  > No: then the block would cost 25. The third load waits.
- [x] It costs nothing, but the third load still waits for the first
  > Yes: the front end notes that whatever makes r2 now makes r5 too, so a read of r5
  > waits on the first load. 25 + 25 = 50.

**In the real block, the 15-cycle call finishes at cycle 18. Why isn't the block done then?**

- [ ] The CPU must decode where the call goes first
  > No: decoding stops at the block's terminator, which is the call. Nothing beyond it is
  > decoded.
- [x] Instructions retire in order, and the stores ahead of the call are still running
  > Yes: the three stores run from cycle 3 to 28. The call can't retire before them, so
  > everything retires at 29, and 29 − 3 = 26 gas.
- [ ] The call takes 15 more cycles to come back
  > No: its 15 cycles are over at 18. It's waiting on the stores, not on itself.
:::

## What you have

A price for every basic block, worked out the Gray Paper's way. One piece of gas is left:
the meter that charges those prices as the machine runs, and [lesson 15.11](./11-the-gas-meter.md) builds it.

**Say it out loud.** Gas is the cycles a small model CPU takes to run a basic block, less 3. Work side by side is cheap; waiting is what costs.

Next: [15.11 The gas meter](./11-the-gas-meter.md)
