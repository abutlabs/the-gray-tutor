# Checkpoints

**In one sentence:** what a service does is kept only if it finishes; if it fails, its
changes roll back to the last moment it chose to say "keep everything up to here".

Here is service 0, [lesson 16.4](./04-info.md)'s made-up record, with a balance of 1,000.
Tap host calls to build a run: the two writes of this lesson's tests, a checkpoint, and a
transfer of a hundred ([lesson 17.3](../17-accumulation/03-sending-a-transfer.md) adds that one). Then stop the machine, and see
what survives.

<a id="try-it"></a>

<CheckpointRun />

## The idea

A service that panics halfway through its accumulation has written half of what it meant
to. What happens to that half? It's thrown away.

The trick is two copies of everything the service may change: a working copy and a
fallback. Both start as the same state. Every host call changes the working copy. Only
one host call touches the fallback: `checkpoint`, which copies the working copy over it.
That is a [*checkpoint*](../glossary.md#checkpoint), the service saying "keep everything
up to here". It works like a save point in a game.

When the machine stops, one copy survives. A halt keeps the working copy, with everything
the service did. A panic, or running out of gas, keeps the fallback: the state at the
last checkpoint, or at the start if there was none.

Take a write, a checkpoint, another write, then a panic: only the first write survives.

This lesson builds the two sets of accounts, the `checkpoint` host call, and the function
that picks the survivor. With those, your client has its first whole accumulation, start
to finish.

## What the Gray Paper says

::: gray-paper B.4

#### Appendix B.4 Accumulate Invocation {#gp-B-4}

<a id="gp-B-4-p1"></a>Since this is a transition which can directly affect a substantial amount of on-chain state, our <abbr class="gp-term" title="one run of code in the PVM: Is-Authorized, refine or accumulate">invocation</abbr> context is accordingly complex. It is a tuple with elements for each of the aspects of state which can be altered through this invocation and beyond the account of the service itself includes the <abbr class="gp-term" title="a payment between services: the money leaves now, and the receiver's code runs on it in the next round">deferred transfer</abbr> list and several dictionaries for alterations to preimage lookup state, core assignments, validator key assignments, newly created accounts and alterations to account privilege levels.

<a id="gp-B-4-p2"></a>Formally, we define our result context to be $\mathbb{L}$, and our invocation context to be a pair of these contexts, $\mathbb{L} \times \mathbb{L}$ (and thus for any value $\mathbf{x} \in \mathbb{L}$ there exists $\mathbf{x}^2 \in \mathbb{L} \times \mathbb{L}$), with one dimension being the <abbr class="gp-term" title="the copy of the context, 𝐱, that host calls change and a halt keeps">regular dimension</abbr> and generally named $\mathbf{x}$ and the other being the <abbr class="gp-term" title="the copy of the context, 𝐲, kept if the run panics or runs out of gas">exceptional dimension</abbr> and being named $\mathbf{y}$. The only function which actually alters this second dimension is $\mathtt{checkpoint}$, $\Omega_C$ and so it is rarely seen.

<a id="gp-B-4-p3"></a><a id="eq-B-7"></a><a id="eq-B-8"></a>

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
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-tuple">$\!\left\lgroup x\right\rgroup\!$</span> | the tuple of | a record: named fields, each with its type, like an object in JSON |
| <span id="gk-isa">[$x\in y$](../symbols.md#in)</span> | in | belongs to: the field's type |
| <span id="gk-im-id">$s$</span> | s | the id of the service accumulating |
| <span id="gk-serviceid" class="gk-wrap">$\mathbb{N}_S$</span> | N sub S | a service id: a whole number below 2³², 4 bytes |
| <span id="gk-im-state" class="gk-wrap">$\mathbf{e}$</span> | e | the state the service sees and changes: the accounts, the staging keys, the authorizer queues and the privileges |
| <span id="gk-partialstate" class="gk-wrap">$\mathbb{S}$</span> | S | a partial state: the parts of the state accumulation may change: accounts, next validators, authorizer queues and the privileges |
| <span id="gk-im-nextfreeid">$i$</span> | i | the id the next service it creates will get |
| <span id="gk-im-xfers" class="gk-wrap">$\mathbf{t}$</span> | t | the transfers the service has made so far, delivered when it is done |
| <span id="gk-defxfers">$\left[\!\left[\mathbb{X}\right]\!\right]$</span> | a sequence of transfers | a list of deferred transfers, in order |
| <span id="gk-im-yield">$y$</span> | y | the hash the service yields, if any: its answer for the outside world |
| <span id="gk-optional">$x\boldsymbol{?}$</span> | or nothing | a value of this type, or ∅ (null) |
| <span id="gk-hash">$\mathbb{H}$</span> | H | a 32-byte value, usually a hash |
| <span id="gk-im-provisions" class="gk-wrap">$\mathbf{p}$</span> | p | the preimages the service provides: pairs of a service id and the bytes |
| <span id="gk-protoset">$\left\{\mkern-5mu\left[\,x\,\right]\mkern-5mu\right\}$</span> | the set of | a set written in order: no repeats, kept sorted |
| <span id="gk-blob">[$\mathbb{B}$](../symbols.md#blobs)</span> | B, or B sub n | bytes: any run of them; 𝔹ₙ exactly n of them |
| <span id="gk-forall">$\forall$</span> | for all | for every value: ∀c ∈ ℕ_C means for each core c |
| <span id="gk-imX" class="gk-wrap">$\mathbf{x}$</span> | x | the regular context: what the host calls change as the service runs, kept if it halts |
| <span id="gk-in">[$\in$](../symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-im-self" class="gk-wrap">$\mathbf{s}$</span> | s | the account of the service accumulating, as this context holds it |
| <span id="gk-ps-accounts" class="gk-wrap">$\mathbf{d}$</span> | d | a partial state's service accounts, by service id |
| <span id="gk-subb">[$\left[x\right]$](../symbols.md#sequence)</span> | at | x[i]: the item at index i, or the value at key i |

</details>

→ [(B.7), (B.8) in plain words](./gray-paper.md#ex-B-7)

<a id="gp-B-4-p4"></a>We define a convenience equivalence $\mathbf{x}_{\mathbf{s}}$ to easily denote the accumulating service account.

<a id="gp-B-4-p5"></a>We track both regular and exceptional dimensions within our <abbr class="gp-term" title="the function that answers a run's host calls and changes its context">context mutator</abbr>, but collapse the result of the invocation to one or the other depending on whether the termination was regular or exceptional (i.e.  out-of-gas or panic).

<a id="gp-B-4-p6"></a>We define $\Psi_A$, the Accumulation invocation function as:

<a id="gp-B-4-p7"></a><a id="eq-B-9"></a><a id="eq-B-10"></a><a id="eq-B-11"></a><a id="eq-B-12"></a><a id="eq-B-13"></a>

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
| <span id="gk-Psi">$\Psi$</span> | psi (capital) | the PVM: a program, a gas limit, registers and memory in; how it stopped and what's left out |
| <span id="gk-abracegroup">$\left\{ \begin{aligned}x\end{aligned} \right.$</span> | as follows | a brace grouping lines that hold together: for a function, its type on top, then what each input becomes |
| <span id="gk-timeslot" class="gk-wrap">$\mathbb{N}_T$</span> | N sub T | a timeslot: a u32 counting 6-second slots |
| <span id="gk-gas" class="gk-wrap">$\mathbb{N}_G$</span> | N sub G | an amount of gas: a u64 |
| <span id="gk-sequence">[$\left[\!\left[x\right]\!\right]$](../symbols.md#sequence)</span> | a sequence of | ⟦T⟧ is an array of T; a subscript is its length, :n at most n, n: at least n |
| <span id="gk-operandtuple" class="gk-wrap">$\mathbb{U}$</span> | U | an operand: what accumulate is told about one work-digest: package hash, exports root, authorizer, payload hash, gas, trace and result |
| <span id="gk-cup">$\cup$</span> | union | everything in either side |
| <span id="gk-defxfer" class="gk-wrap">$\mathbb{X}$</span> | X | a deferred transfer: (source, destination, amount, memo, gas), the money moved now, the receiver run in the next round |
| <span id="gk-to">[$\to$](../symbols.md#to)</span> | to | what goes in, to what comes out: A → B takes an A and gives a B |
| <span id="gk-acconeout" class="gk-wrap">$\mathbb{O}$</span> | O | what one run gives back: its state 𝐞, transfers 𝐭, yield y, gas used u and provisions 𝐩 |
| <span id="gk-mapsto">$\mapsto$</span> | maps to | what a function gives back for an input: x ↦ y says x becomes y |
| <span id="gk-is">$x\mathrel{\unicode{x2AF6}} y$</span> | is a | names a field and gives its type, in a tuple |
| <span id="gk-none" class="gk-wrap">$\emptyset$</span> | nothing | ∅: no value at all, like null |
| <span id="gk-ao-gasused">$u$</span> | u | the gas a run used |
| <span id="gk-jam-blob" class="gk-wrap">$\mathfrak{j}$</span> | j (gothic) | a standard program: four sizes, the read-only and read-write data, then the PVM blob |
| <span id="gk-vee">$\vee$</span> | or | at least one side is true |
| <span id="gk-len">$\left\vert x\right\vert$</span> | the size of | \|x\|: how many items x has, or how many bytes |
| <span id="gk-Cmaxservicecodesize" class="gk-wrap">$\mathsf{W}_C$</span> | W sub C | the largest a service's code may be: 4,000,000 bytes |
| <span id="gk-encode">[$\mathcal{E}\left(x\right)$](../symbols.md#encode)</span> | E of | the encoding of what's in the brackets: its bytes, by Appendix C's rules |
| <span id="gk-sa-code" class="gk-wrap">$\mathbf{c}$</span> | c (bold) | an account's code: the PVM program, the second half of its code-hash preimage; ∅ if there is none |
| <span id="gk-sa-balance">$b$</span> | b | an account's balance, in tokens: a u64 |
| <span id="gk-sum">$\sum$</span> | the sum of | add up what follows, once for each value the subscript ranges over |
| <span id="gk-dx-amount">$a$</span> | a | how much balance the transfer moves |
| <span id="gk-build">$\left\{ x \;\middle\vert\; y \right\}$</span> | for each, such that | built by a rule: the left-hand value, for every case the right-hand side allows (a set, or a sequence in order) |
| <span id="gk-orderedin">$\mathrel{\unicode{x2B40}}$</span> | in order, from | each item of the sequence, in its order |
| <span id="gk-decode">[$\mathcal{E}^{-1}\left(x\right)$](../symbols.md#decode)</span> | E inverse of | decoding: bytes back into the value they encode |
| <span id="gk-blake">$\mathcal{H}\left(x\right)$</span> | H of | the Blake2b hash of what's in the brackets: 32 bytes |
| <span id="gk-entropyaccumulator" class="gk-wrap">$\eta_0$</span> | eta zero | the entropy accumulator: 32 bytes that every block's VRF output is hashed into |
| <span id="gk-H" class="gk-wrap">$\mathbf{H}$</span> | H | this block's header; 𝐇_T is its timeslot, 𝐇_P its parent's hash |
| <span id="gk--timeslot">$T$</span> | T | a header's timeslot: 𝐇_T is the slot this block was made for |
| <span id="gk-bmod">[$\bmod$](../symbols.md#mod)</span> | mod | the remainder after dividing: 14 mod 4 is 2 |
| <span id="gk-Cminpublicindex" class="gk-wrap">$\mathsf{S}$</span> | S | the lowest id an ordinary new service can get: 2¹⁶ = 65,536; the ids below it only the registrar hands out |
| <span id="gk-contextmutator">$\Omega\left\langle x\right\rangle$</span> | omega of X | a host's function: given a host call's number, the gas, registers, memory and the host's own context X, it says carry on or stop, with all of them updated |
| <span id="gk-implicationspair">$\!\left\lgroup\mathbb{L}, \mathbb{L}\right\rgroup\!$</span> | a pair of contexts | two accumulation contexts side by side: the regular one and the exceptional one |
| <span id="gk-gascounter" class="gk-wrap">$\varrho$</span> | rho (curly) | the gas left |
| <span id="gk-registers" class="gk-wrap">$\varphi$</span> | phi (curly) | the PVM's 13 registers |
| <span id="gk-memory" class="gk-wrap">$\mu$</span> | mu | the PVM's memory |
| <span id="gk-imXY">$\left(\mathbf{x}, \mathbf{y}\right)$</span> | x and y | the pair of contexts every accumulate host call gets: x as the service changes it, y as at its last checkpoint |
| <span id="gk-Omega">$\Omega$</span> | omega | a host call's function: Ω_G is gas, Ω_Y fetch, Ω_W write; one letter for each call |
| <span id="gk-Gemini">$\unicode{x264A}$</span> | Gemini | the sign that names grow_heap: Ω_♊ makes a program's heap bigger, a page at a time |
| <span id="gk-Taurus">$\unicode{x2649}$</span> | Taurus | the sign that names yield: Ω_♉ records the hash a service yields |
| <span id="gk-Aries">$\unicode{x2648}$</span> | Aries | the sign that names provide: Ω_♈ hands a preimage to a service that asked for it |
| <span id="gk-oog" class="gk-wrap">$\infty$</span> | out of gas | ∞: the program ran out of gas |
| <span id="gk-continue" class="gk-wrap">$\blacktriangleright$</span> | continue | ▸: the step went normally, and the next one may run |
| <span id="gk-Cgasunknown" class="gk-wrap">$\mathsf{M}_{\emptyset}$</span> | M sub nothing | what a host call this host doesn't know costs: 1,000 gas, and the answer WHAT |
| <span id="gk-set">$\left\{\,x\,\right\}$</span> | the set of | a set: values with no order and no repeats |
| <span id="gk-halt" class="gk-wrap">$\blacksquare$</span> | halt | ∎: the program finished normally |
| <span id="gk-panic">$\unicode{x21AF}$</span> | panic | ↯: the program trapped |
| <span id="gk-regs">$\left[\!\left[\mathbb{N}_R\right]\!\right]_{13}$</span> | thirteen registers | a sequence of 13 register values, each a u64 |
| <span id="gk-ram" class="gk-wrap">$\mathbb{M}$</span> | M | a PVM memory: its bytes, and which pages may be read or written |
| <span id="gk-serviceaccount" class="gk-wrap">$\mathbb{A}$</span> | A | a service account: three dictionaries (storage, preimages, requests) and eight plain fields |
| <span id="gk-execst" class="gk-wrap">$\varepsilon$</span> | epsilon | how the machine goes on after a host call: carry on (▸), halt, panic or out of gas |
| <span id="gk-imY" class="gk-wrap">$\mathbf{y}$</span> | y | the exceptional context: the state at the last checkpoint, kept if the service panics or runs out of gas |

</details>

→ [(B.9), (B.10), (B.11), (B.12), (B.13) in plain words](./gray-paper.md#ex-B-9)

<a id="gp-B-4-p8"></a>The mutator $F$ governs how this context will alter for any given parameterization, and the collapse function $C$ selects one of the two dimensions of context depending on whether the virtual machine's halt was regular or exceptional.

<a id="gp-B-4-p9"></a>The initializer function $I$ maps some partial state along with a service account index to yield a mutator context such that no alterations to the given state are implied in either exit scenario. Note that the component $a$ utilizes the random accumulator $\eta_0'$ and the block's timeslot $\mathbf{H}_{T}$ to create a deterministic sequence of identifiers which are extremely likely to be unique.

<a id="gp-B-4-p10"></a>Concretely, we create the identifier from the Blake2 hash of the identifier of the creating service, the current random accumulator $\eta_0'$ and the block's timeslot. Thus, within a service's accumulation it is almost certainly unique, but it is not necessarily unique across all services, nor at all times in the past. We utilize a *check* function to find the first such index in this sequence which does not already represent a service:

<a id="gp-B-4-p11"></a><a id="eq-B-14"></a>

$$
\begin{equation}
\text{check}(i \in \mathbb{N}_S) \equiv \begin{cases}
i &\text{if } i \not\in \mathcal{K}\left(\mathbf{e}_{\mathbf{d}}\right) \\
\text{check}((i - \mathsf{S} + 1) \bmod (2^{32}-2^8-\mathsf{S}) + \mathsf{S})&\text{otherwise}
\end{cases} \tag{B.14}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-keys">$\mathcal{K}\left(x\right)$</span> | K of | a dictionary's keys |

</details>

→ [(B.14) in plain words](./gray-paper.md#ex-B-14)

<a id="gp-B-4-p12"></a>NB In the highly unlikely event that a block executes to find that a single service index has inadvertently been attached to two different services, then the block is considered invalid. Since no service can predict the identifier sequence ahead of time, they cannot intentionally disadvantage the block author.

<a id="gp-B-4-p13"></a>

:::

The two copies are a *pair* of contexts, X and Y (the paper's bold 𝐱 and 𝐲), and Ψ_A
(App. B.4) runs a service with them. Both start as the same state (I(…)², the Gray Paper
writes: I's context, twice). Every host call changes X, the working copy. Y is the fallback.

- **`checkpoint`** (host call 18, App. B.7, Ω_C): Y′ = X, so everything done so far
  survives whatever comes next. φ₇ = the gas left, after paying 103. Its row is in B.7's
  table, explained in [16.A](./gray-paper.md#checkpoint-18).
- **C, the collapse** (App. B.4): when the machine stops, a halt keeps X; a panic or
  running out of gas keeps Y. So without a checkpoint, a failed accumulation changes
  nothing the service did itself (money transferred to it still arrives, as [Part
  17](../17-accumulation/index.md) shows).
- **Ψ_A** puts it together: lay out the service's code ([lesson 15.8](../15-the-pvm/08-a-real-program.md)'s
  Y, the layout, not the context), arguments E(t, s, |i|), start at 5, answer host calls
  with F, then collapse. The gas used is u = g minus what's left (never counting below
  zero).

B.4 says more than this lesson builds. Money sent to the service is added to its balance
before it runs ([17.4](../17-accumulation/04-rounds.md)). The context also carries the
transfers it sends, its yield and its provisions, each built in [Part 17](../17-accumulation/index.md) where its host call
is. And I picks the id the service's first new service would get, from a hash of its id,
the entropy and the slot, skipping ids already taken (B.14): that's for `new`, in
[17.8](../17-accumulation/08-creating-a-service.md). Every formula of B.4 is worked through
on service 1729 in [16.A](./gray-paper.md#ex-B-9).

In [the widget at the top](#try-it), X and Y sit side by side after each step. Stop the
machine, and see which one survives.

## The tests

The tests' bundles get their checkpoint, and `vectorService` is built from a helper that
the new tests share:

**Replace in** `test/host.test.ts`

```ts
/** Accumulation's host, for service 0 with a tiny program, an entropy of sevens, no inputs. */
const accumulating = accumulateHost(TINY, {
  id: 0,
  accounts: tinyAccounts(),
  checkpoint: tinyAccounts(),
  code: tinyCode(),
  entropy: new Uint8Array(32).fill(7),
  inputs: [],
});

/** Service 1729's accumulation, set up as always_accumulate-1 has it: machine and host. */
function vectorService() {
  const { a, slot, expected } = vectorAccumulation();
  const [t, s] = [BigInt(slot), BigInt(a.id)]; // the slot, the service, no inputs
  const args = Uint8Array.from([...encodeNatural(t), ...encodeNatural(s), ...encodeNatural(0n)]);
  const { memory, registers } = standardProgram(a.code, args);
  const machine = newMachine(deblob(a.code.program), registers, memory, 100_000n);
  machine.pc = 5; // accumulation
  return { machine, host: accumulateHost(TINY, a), expected };
}
```

**Add to** `test/host.test.ts`

```ts
import type { Accumulation } from "../src/host.ts";
import { accumulate, checkpoint, collapse } from "../src/host.ts";
import { copyAccounts } from "../src/services.ts";
import type { Accumulated, HostExit } from "../src/host.ts";
import type { Exit, Machine } from "../src/pvm/machine.ts";

/** always_accumulate-1's service 1729 as an accumulation, its slot, and its gas to use. */
function vectorAccumulation() {
  const vector = vectorJson("stf/accumulate/tiny/always_accumulate-1.json") as AccumulateVector;
  const { id, data } = vector.pre_state.accounts[0];
  const preimage = data.preimage_blobs.find((p) => p.hash === data.service.code_hash)!;
  const accounts = new Map(vector.pre_state.accounts.map((a) => [a.id, accountFromJson(a.data)]));
  const a: Accumulation = {
    id,
    accounts,
    checkpoint: copyAccounts(accounts),
    code: unpackCode(fromHex(preimage.blob)),
    entropy: fromHex(vector.pre_state.entropy),
    inputs: [],
  };
  const expected = BigInt(vector.post_state.statistics[0].record.accumulate_gas_used);
  return { a, slot: vector.input.slot, expected };
}

/** Accumulation's bundle for service 0 of tinyAccounts, about to do something. */
function bundle(): Accumulation {
  const accounts = tinyAccounts();
  return {
    id: 0,
    accounts,
    checkpoint: copyAccounts(accounts),
    code: tinyCode(),
    entropy: new Uint8Array(0),
    inputs: [],
  };
}

test("a panic undoes every write since the last checkpoint", () => {
  const a: Accumulation = bundle();
  write(storing(0x20000n, 4n, 0x20010n, 3n), a.accounts, 0); // "last" → 1, 2, 3
  const afterHalt: Map<number, Account> = collapse(a, "halt"); // a halt keeps it
  assert.equal(afterHalt.get(0)!.storage.size, 1);
  const afterPanic: Map<number, Account> = collapse(a, "panic"); // a panic doesn't
  assert.equal(afterPanic.get(0)!.storage.size, 0);
});

test("checkpoint: what's done before it survives a panic after it", () => {
  const a: Accumulation = bundle();
  write(storing(0x20000n, 4n, 0x20010n, 3n), a.accounts, 0); // "last"
  const machine: Machine = storing();
  const exit: HostExit = checkpoint(machine, a);
  assert.equal(exit, "continue");
  assert.equal(machine.registers[7], 10_000n - 103n); // the gas left, after paying 103
  write(storing(0x20001n, 3n, 0x20010n, 3n), a.accounts, 0); // "ast", after the checkpoint
  const afterPanic: Map<number, Account> = collapse(a, "panic");
  const keys: string[] = [...afterPanic.get(0)!.storage.keys()];
  assert.deepEqual(keys, ["0x6c617374"]);
});

test("accumulate, Ψ_A: service 1729 halts on 16,417 gas, its accounts kept", () => {
  const { a, slot, expected } = vectorAccumulation();
  const { exit, accounts, gasUsed }: Accumulated = accumulate(TINY, a, slot, 100_000n);
  assert.deepEqual([exit, gasUsed], ["halt", expected]);
  assert.equal(accounts, a.accounts); // the halt kept what it did (nothing, this time)
});
```

## The code

Falling back needs a true copy of the accounts: copying the `Map` alone would leave both
sets sharing each account's record and storage, and a write to one would show up in the
other.

**Add to** `src/services.ts`

```ts
/** A copy of the accounts that changes to the originals can't reach. */
export function copyAccounts(accounts: Map<number, Account>): Map<number, Account> {
  const copy = (a: Account) => ({ info: { ...a.info }, storage: new Map(a.storage) });
  return new Map([...accounts].map(([id, a]) => [id, copy(a)]));
}
```

The bundle gets the second set:

**Replace in** `src/host.ts`

```ts
/**
 * What a service's accumulation runs with (GP App. B.4): which service it is, the accounts
 * twice over (as it changes them, and as they'll be if it fails), its code, the entropy
 * η′₀, and its inputs, each one encoded.
 */
export type Accumulation = {
  id: number;
  accounts: Map<number, Account>; // as the service changes them (the GP's X)
  checkpoint: Map<number, Account>; // as they were at the last checkpoint (Y)
  code: ServiceCode;
  entropy: Bytes;
  inputs: Bytes[];
};

/**
 * F (GP App. B.4): the host for a service's accumulation. So far it answers gas, grow_heap,
 * fetch (whose items are the constants, 0; the entropy, 1; and the inputs, all of them, 14,
 * or one, 15), info, read, write and checkpoint. Anything else: WHAT.
 */
export function accumulateHost(config: Config, a: Accumulation): Host {
  const items: Items = (kind, index) => {
    if (kind === 0) return protocolConstants(config);
    if (kind === 1) return a.entropy;
    if (kind === 14) return concatBytes(encodeNatural(BigInt(a.inputs.length)), ...a.inputs);
    if (kind === 15 && index < BigInt(a.inputs.length)) return a.inputs[Number(index)];
    return undefined;
  };
  return (call, m) => {
    switch (HOST_CALLS[call]) {
      case "gas":
        return gas(m);
      case "grow_heap":
        return growHeap(m, a.code);
      case "fetch":
        return fetch(m, items);
      case "info":
        return info(m, a.accounts, a.id);
      case "read":
        return read(m, a.accounts, a.id);
      case "write":
        return write(m, a.accounts, a.id);
      case "checkpoint":
        return checkpoint(m, a);
      default:
        return unknown(m);
    }
  };
}
```

**Add to** `src/host.ts`

```ts
import { newMachine } from "./pvm/machine.ts";
import { deblob } from "./pvm/program.ts";
import { standardProgram } from "./pvm/standard.ts";
import { copyAccounts } from "./services.ts";

/** checkpoint (GP App. B.7, Ω_C): what the service has done so far is kept if it fails later. */
export function checkpoint(m: Machine, a: Accumulation): HostExit {
  if (!charge(m, 103)) return "oog";
  a.checkpoint = copyAccounts(a.accounts); // Y′ = X
  m.registers[7] = m.gas;
  return "continue";
}

/** C (GP App. B.4), so far: a halt keeps the accounts; anything else, the last checkpoint. */
export function collapse(a: Accumulation, exit: Exit): Map<number, Account> {
  return exit === "halt" ? a.accounts : a.checkpoint;
}

/** What an accumulation leaves: how it ended, the accounts after it, and the gas it used. */
export type Accumulated = { exit: Exit; accounts: Map<number, Account>; gasUsed: bigint };

/**
 * Ψ_A (GP App. B.4), so far: runs service a.id's accumulation at `slot` on `gas`, through
 * accumulation's host, and collapses what it did. `watch`, if given, sees each host call.
 */
export function accumulate(
  config: Config,
  a: Accumulation,
  slot: number,
  gas: bigint,
  watch?: (call: number, m: Machine) => void,
): Accumulated {
  const [t, s, n] = [slot, a.id, a.inputs.length].map((x) => encodeNatural(BigInt(x)));
  const { memory, registers } = standardProgram(a.code, concatBytes(t, s, n)); // Ψ_M's Y
  const machine = newMachine(deblob(a.code.program), registers, memory, gas);
  machine.pc = 5; // accumulation's way in
  const host = accumulateHost(config, a);
  const exit = runWithHost(machine, (call, m) => {
    const answer = host(call, m);
    watch?.(call, m);
    return answer;
  });
  const gasUsed = gas - (machine.gas > 0n ? machine.gas : 0n); // u = g − max(ϱ′, 0)
  return { exit, accounts: collapse(a, exit), gasUsed };
}
```

`accumulate` is everything `vectorService` used to do by hand, plus the collapse: [lesson
15.8](../15-the-pvm/08-a-real-program.md)'s start, [lesson 16.1](./01-calling-the-host.md)'s `runWithHost` with accumulation's host, and C at the end. Its
`watch` is for the curious: it sees every host call, once answered.

The bin can stop building machines now:

**Rewrite** `bin/host.ts`

```ts
// Runs a real service's accumulation, Ψ_A, and shows every host call it makes and the
// answer it gets. The service, 1729, comes from the accumulate test vector
// always_accumulate-1, with the 100,000 gas the vector gives it.
// Usage: npm run host

import { readFileSync } from "node:fs";
import { fromHex } from "../src/bytes.ts";
import { TINY } from "../src/config.ts";
import { accumulate, HOST_CALLS, NONE, WHAT } from "../src/host.ts";
import { Run } from "../src/obs.ts";
import { unpackCode } from "../src/pvm/program.ts";
import { accountFromJson, copyAccounts } from "../src/services.ts";

const file = "../vectors/stf/accumulate/tiny/always_accumulate-1.json";
const vector = JSON.parse(readFileSync(file, "utf8"));
const account = vector.pre_state.accounts[0]; // service 1729
const blobs: { hash: string; blob: string }[] = account.data.preimage_blobs;
const preimage = blobs.find((p) => p.hash === account.data.service.code_hash)!; // its code
const accounts = new Map([[account.id, accountFromJson(account.data)]]);
const a = {
  id: account.id,
  accounts,
  checkpoint: copyAccounts(accounts),
  code: unpackCode(fromHex(preimage.blob)),
  entropy: fromHex(vector.pre_state.entropy),
  inputs: [],
};

const run = new Run("host");
const result = accumulate(TINY, a, vector.input.slot, 100_000n, (call, m) => {
  const name = HOST_CALLS[call] ?? (call === 100 ? "log, from JIP-1" : "?");
  const r7 = m.registers[7];
  const said = r7 === WHAT ? "WHAT" : r7 === NONE ? "NONE" : String(r7);
  console.log(`host call ${call} (${name}): φ₇ = ${said}, ${m.gas} gas left`);
  run.event("call", { call, name, said, gas: Number(m.gas) });
});
console.log(`the service stops: ${JSON.stringify(result.exit)}, using ${result.gasUsed} gas`);
console.log(`the test vector says: ${vector.post_state.statistics[0].record.accumulate_gas_used}`);
run.event("stop", { exit: JSON.stringify(result.exit), used: Number(result.gasUsed) });
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ the reported packages: each one's hash and exports root, sorted by hash (246.3ms)
...
✔ a panic undoes every write since the last checkpoint (0.1ms)
✔ checkpoint: what's done before it survives a panic after it (0.1ms)
✔ accumulate, Ψ_A: service 1729 halts on 16,417 gas, its accounts kept (62.2ms)
...
ℹ tests 467
ℹ suites 0
ℹ pass 467
ℹ fail 0
...
reported 467 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791738269977
...
```

## Watch it

What flows through it: the run is the same as [lesson 16.3](./03-growing-the-heap.md)'s. What's new is Ψ_A around it,
the context it keeps and what it hands back:

::: code-group

```json [what goes in]
{
  "input": { "slot": 43 },
  "pre_state": {
    "entropy": "0xae85d6635e9a…",
    "accounts": [ { "id": 1729, "data": {
      "service": { "code_hash": "0xfd3f1355…" },
      "storage": [], "preimage_blobs": [ "… its code …" ], "preimage_requests": [ "…" ]
    } } ]
  },
  "post_state": { "statistics": [ { "id": 1729, "record": { "accumulate_gas_used": 16417 } } ] }
}
```

```ts [what it computes]
// Ψ_A's context for 1729, and its result
const computed = {
  args: [0x2b, 0x86, 0xc1, 0x00], // t = 43, s = 1729, n = 0 inputs, each a compact natural
  accounts: [1729], // X: the accounts as the service changes them
  checkpoint: [1729], // Y: a copy, kept in case the run fails; no checkpoint call refreshes it
  inputs: [], // no operands or transfers this time
  exit: "halt", // how runWithHost ended
  collapsed: "accounts", // C: a halt keeps X; a panic or oog would fall back to Y
  gasUsed: 16_417n, // g − max(ϱ′, 0): 100,000 − 83,583
};
```

```text [what comes out]
the service stops: "halt", using 16417 gas
the test vector says: 16417
```

:::

**Run**

```sh
npm run host
```

```text
host call 2 (fetch): φ₇ = 122, 99367 gas left
host call 1 (grow_heap): φ₇ = 51, 98728 gas left
host call 1 (grow_heap): φ₇ = 51, 97953 gas left
host call 2 (fetch): φ₇ = 122, 96859 gas left
host call 100 (log, from JIP-1): φ₇ = WHAT, 87377 gas left
host call 2 (fetch): φ₇ = 1, 86270 gas left
host call 2 (fetch): φ₇ = 1, 84708 gas left
the service stops: "halt", using 16417 gas
the test vector says: 16417
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=host-1791738276309
```

The same conversation as [lesson 16.3](./03-growing-the-heap.md), through Ψ_A now: the service
halts, so X is kept. And across the accumulate vectors, the services that stopped at
`checkpoint` go on to ask for something new, one family of vectors each: `bless`, `assign`
and `designate` (privileges), `new`, `upgrade`, `eject` and `transfer` (services), `lookup`,
`solicit`, `query` and `provide` (preimages), and `yield`. That's the rest of the host's job.

<details>
<summary>lasair: the checkpoint, in <code>lib/pvm_host.ml</code></summary>

```ocaml
type checkpoint_state = {
  cp_service: service_account;
  cp_other_services: (int * service_account) list;
  cp_acc_ctx: accumulate_context option;
  cp_nextfree: int64;
}
```

lasair's Y. Its `checkpoint` call fills one of these from the live context: the service's
own account, the other accounts, the accumulation context (where the transfers, the
privilege changes and the yield of the host calls still to come will live), and the next
free service id. Your `copyAccounts` is the same snapshot, for the one thing your context
holds so far. It will hold more.

</details>

## Check your understanding

::: check
**A service writes a key, then runs out of gas. It never made a checkpoint. What does it leave?**

- [x] Nothing it did: running out of gas keeps Y, still the state it started from
  > Yes: the collapse treats out of gas just like a panic. Only a halt keeps X.
- [ ] The write: running out of gas isn't the service's fault, so its work is kept
  > No: whatever the reason, a service that didn't halt didn't finish, and its unfinished
  > work goes.
- [ ] The write: it went straight into the chain's state
  > No: every host call changes X, a copy. The chain only gets whichever of X and Y
  > survives at the end.

**It writes "last", calls `checkpoint`, writes `"ast"`, then panics. Which keys are left?**

- [ ] None
  > No: the checkpoint copied X into Y, with "last" in it.
- [x] "last" only
  > Yes: Y has "last" from the checkpoint. `"ast"` was only ever in X, and a panic throws X
  > away.
- [ ] Both
  > No: that's what a halt would keep. A panic keeps Y.

**Who decides when a checkpoint is taken?**

- [ ] The host, after every host call that worked
  > No: then a panic could undo nothing. Only the `checkpoint` host call copies X into Y.
- [ ] The chain, once at the end of every block
  > No: X and Y belong to one accumulation, and one of them is gone when it stops.
- [x] The service itself, by calling `checkpoint`
  > Yes: it is a moment the service chose. A service that halts never needed one: a
  > checkpoint only matters if the service fails, and a halt keeps X, everything.

**Why must Y be a true copy, not the same accounts shared with X?**

- [ ] A true copy takes less memory
  > No: it takes more. Correctness is the reason.
- [x] Otherwise a write after the checkpoint would change Y too, and a panic couldn't undo it
  > Yes: a copy of the `Map` alone shares each account's storage. `"ast"` would land in both,
  > and survive the panic.
- [ ] Y is what gets written to the chain, so it needs its own memory
  > No: only one of X and Y survives, and which one depends on how the service stops.
:::

## What you have

A whole accumulation, Ψ_A, that keeps what a service does when it succeeds, and falls
back to its last checkpoint when it doesn't. So far each service has run with no inputs:
[lesson 16.7](./07-a-services-inputs.md) hands it the work it was actually given.

Next: [16.7 A service's inputs](./07-a-services-inputs.md)
