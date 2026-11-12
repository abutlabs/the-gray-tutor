# Part 16 · Host calls

**In one sentence:** a service is a program in a sealed box that can compute all it likes
but can't see the chain, and a host call is how it asks your client for what is outside.

By the end of this part your client answers the host calls of a service accumulating, and
13 services in 12 official vectors match, down to the last unit of gas.

## The big picture

A host call is to a service what a system call is to an ordinary program: the only way out
of the box. The program asks with `ecalli`. The machine stops, your client does the work
and answers in a register, and the program carries on. Every validator answers the same
way, and every call has a price.

A real service's conversation, the one you'll have by [lesson
16.3](./03-growing-the-heap.md): what are the chain's rules? (`fetch`) How much memory have
I got? (`grow_heap`) What work did I get? (`fetch`) Then it halts.

The Gray Paper has 28 host calls. A block importer only needs the 20 that accumulation can
use:

| What for | Calls | Built in |
| --- | --- | --- |
| About this run | `gas`, `fetch`, `grow_heap` | [16.1](./01-calling-the-host.md), [16.2](./02-fetch.md), [16.3](./03-growing-the-heap.md) |
| Accounts and storage | `info`, `read`, `write` | [16.4](./04-info.md), [16.5](./05-storage.md) |
| Keeping what's done so far | `checkpoint` | [16.6](./06-checkpoints.md) |
| Preimages | `lookup`, `query`, `solicit`, `forget`, `provide` | [16.8](./08-lookup.md), [16.9](./09-asking-for-preimages.md), [17.12](../17-accumulation/12-providing-a-preimage.md) |
| Services and money | `transfer`, `new`, `upgrade`, `eject` | [17.3](../17-accumulation/03-sending-a-transfer.md), [17.8](../17-accumulation/08-creating-a-service.md), [17.10](../17-accumulation/10-upgrading-a-service.md), [17.7](../17-accumulation/07-ejecting-a-service.md) |
| Privileges | `bless`, `assign`, `designate` | [17.13](../17-accumulation/13-blessing-and-designating.md), [17.5](../17-accumulation/05-privileges.md) |
| A result for the outside world | `yield` | [17.11](../17-accumulation/11-what-a-service-yields.md) |
| Refine only: never run at import | `historical_lookup`, `export`, `machine`, `peek`, `poke`, `pages`, `invoke`, `expunge` | not built |

This part takes about 50 minutes. [16.1](./01-calling-the-host.md) and
[16.6](./06-checkpoints.md) matter most: every other lesson is one more call on the same
pattern.

Where it runs: the host is whoever runs the machine.

- **For accumulate** that is every validator, your client included. Each call here reads
  and writes the chain's own state, and every validator must get the same answer.
- **For refine and Is-Authorized** the host is one of the core's three guarantors,
  in-core, and those calls can only read. The refine-only row above is the whole
  difference, and it is why a block importer never answers it.

What a service can touch through these calls, its account, is drawn on [Part
14](../14-services/index.md)'s page.

The paper's Appendix B, where all of this is written down, opens with those three runs:

::: gray-paper B

#### Appendix B Virtual Machine Invocations {#gp-B}

<a id="gp-B-p1"></a>We now define the three practical instances where we wish to invoke a PVM instance as part of the protocol. In general, we avoid introducing unbounded data as part of the basic <abbr class="gp-term" title="one run of code in the PVM: Is-Authorized, refine or accumulate">invocation</abbr> arguments in order to minimize the chance of an unexpectedly large RAM allocation, which could lead to gas inflation and unavoidable underflow. This makes for a more cumbersome interface, but one which is more predictable and easier to reason about.

:::

There are three moments when the protocol runs code in the PVM. The paper calls each an
invocation, Ψ with a letter: Ψ_I runs an authorizer, Ψ_R refines a work-item, Ψ_A
accumulates a service.

Each hands the machine only small arguments (a core's index, a slot, a service id; refine
also the item's payload), never everything it might need. A big argument means a big
memory to set up before the program has paid any gas. Anything else, the program asks for
with `fetch`, a piece at a time, paying as it goes. The paper admits this is clumsier, and
keeps it because it is predictable.

Each invocation also brings a host of its own: the list of host calls it will answer.
Only Ψ_A runs on your client.

The first and smallest is the gatekeeper of [Part 13](../13-authorization/index.md) at
work. An authorizer is PVM code plus a configuration blob, and Ψ_I is how a core's
guarantors run that code on a package, in-core:

::: gray-paper B.2

#### Appendix B.2 Is-Authorized Invocation {#gp-B-2}

<a id="gp-B-2-p1"></a>The <abbr class="gp-term" title="the authorizer's code, run in the PVM by the guarantors to decide if a package may use the core">Is-Authorized</abbr> invocation is the first and simplest of the three, being totally stateless. It provides only host-call functions for inspecting its environment and parameters. It accepts as arguments only the core on which it should be executed, $c$. Formally, it is defined as $\Psi_I$:

<a id="gp-B-2-p2"></a><a id="eq-B-1"></a><a id="eq-B-2"></a>

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

<details class="gp-key"><summary>Its symbols</summary>

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

→ [(B.1), (B.2) explained](./gray-paper.md#ex-B-1)

<a id="gp-B-2-p3"></a>Note for the Is-Authorized host-call dispatch function $F$ in equation [B.2](#eq-B-2), we elide the host-call context since, being essentially stateless, it is always $\emptyset$.

:::

The guarantors take the authorizer's code, **u**, which the package names and some
service keeps as a preimage. No such code, and the answer is BAD; code over
W_A = 64,000 bytes, BIG. Otherwise they run it from instruction 0, with G_I = 50,000,000
gas and one argument, the core's index in two bytes. Its host knows only three calls,
`gas`, `grow_heap` and `fetch` (which hands out the package and the chain's constants),
and says WHAT to every other for 1,000 gas. What the code returns is the trace, **r**,
and u the gas it used.

Your client never runs this. It sees only what the guarantors write in the report: the
authorizer's hash, the trace and the gas
([lesson 3.3](../03-work-and-reports/03-a-work-report.md)). And it checks that hash is in
the core's pool ([13.1](../13-authorization/01-the-authorizer-pools.md)).

Refine, Ψ_R, also runs in-core, and your client never runs it either. The paper's B.3 and
B.6, the refine invocation and its eight extra host calls, are in [16.A](./gray-paper.md)
with the rest of the part's formulas, each one explained.

**Builds on** [Part 3 · Work and reports](../03-work-and-reports/index.md), [Part 4 ·
Blocks](../04-blocks/index.md), [Part 5 · Hashing and
signatures](../05-hashing-and-signatures/index.md), [Part 14 · Services and
preimages](../14-services/index.md) and [Part 15 · The PVM](../15-the-pvm/index.md), and
on the foundations every part uses, [Parts 0 to 2](../index.md#lessons).

## At a glance

The whole part on one map. Boxes are what your client holds, and rounded cards are the
steps between them; a dashed card happens outside your client. Tap any card, or walk
through them in order with *next*.

<PartFlow :part="16" />

**Starting here?** At the repo root, `npm run catch-up -- 15.11` makes your client the one
this part starts from; [How to read it](../index.md#how-to-read-it) says more.

- [16.1 Calling the host](./01-calling-the-host.md)
- [16.2 Fetch](./02-fetch.md)
- [16.3 Growing the heap](./03-growing-the-heap.md)
- [16.4 Info](./04-info.md)
- [16.5 Storage](./05-storage.md)
- [16.6 Checkpoints](./06-checkpoints.md)
- [16.7 A service's inputs](./07-a-services-inputs.md)
- [16.8 Lookup](./08-lookup.md)
- [16.9 Asking for preimages](./09-asking-for-preimages.md)

## In the Gray Paper

Open **Appendix B, *Virtual Machine Invocations***: B.1 the result constants, B.2 to B.4 the
three invocations Ψ_I, Ψ_R and Ψ_A, B.5 to B.7 each host call Ω, in three big tables.

| The paper says | We say | The vectors say |
| --- | --- | --- |
| NONE = 2⁶⁴ − 1, WHAT = 2⁶⁴ − 2, OOB, WHO, FULL, CORE, CASH, LOW, HUH, OK = 0 | the answers a host call writes into a register | |
| Ψ_I, the Is-Authorized invocation; Ψ_R, the refine invocation | the authorizer's run and refine, both in-core, never on your client | a report's `auth_gas_used` and `auth_output`; a digest's `result` |
| Ψ_A, the accumulation invocation; its result 𝕆: post-state, deferred transfers, yield, gas used, provisions | one service's accumulation, and what comes out | `post_state.accounts`; `output.ok`, the root of every yield; a statistics record's `accumulate_gas_used` |
| 𝕃, the context, in a pair (𝐱, 𝐲): the regular and the exceptional dimension | `Accumulation`: the accounts as the service changes them, and as at its last checkpoint | |
| the context mutator F: the state a host call may read and change during a run; Ω_G gas, Ω_Y fetch, and the rest | the host, `accumulateHost` | |

Its defining equations, (B.9) to (B.13): Ψ_A, and the four helpers it is built from.

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

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-partialstate" class="gk-wrap">$\mathbb{S}$</span> | S | a partial state: the parts of the state accumulation may change: accounts, next validators, authorizer queues and the privileges |
| <span id="gk-timeslot" class="gk-wrap">$\mathbb{N}_T$</span> | N sub T | a timeslot: a u32 counting 6-second slots |
| <span id="gk-serviceid" class="gk-wrap">$\mathbb{N}_S$</span> | N sub S | a service id: a whole number below 2³², 4 bytes |
| <span id="gk-sequence">[$\left[\!\left[x\right]\!\right]$](../symbols.md#sequence)</span> | a sequence of | ⟦T⟧ is an array of T; a subscript is its length, :n at most n, n: at least n |
| <span id="gk-operandtuple" class="gk-wrap">$\mathbb{U}$</span> | U | an operand: what accumulate is told about one work-digest: package hash, exports root, authorizer, payload hash, gas, trace and result |
| <span id="gk-defxfer" class="gk-wrap">$\mathbb{X}$</span> | X | a deferred transfer: (source, destination, amount, memo, gas), the money moved now, the receiver run in the next round |
| <span id="gk-acconeout" class="gk-wrap">$\mathbb{O}$</span> | O | what one run gives back: its state 𝐞, transfers 𝐭, yield y, gas used u and provisions 𝐩 |
| <span id="gk-local-basestate" class="gk-wrap">$\mathbf{e}$</span> | e | the state an accumulation starts from |
| <span id="gk-is">$x\mathrel{\unicode{x2AF6}} y$</span> | is a | names a field and gives its type, in a tuple |
| <span id="gk-local-postxferstate" class="gk-wrap">$\mathbf{s}$</span> | s | the starting state with the money of every transfer to this service already added to its balance |
| <span id="gk-ao-defxfers" class="gk-wrap">$\mathbf{t}$</span> | t | the transfers a run sent |
| <span id="gk-sq">[$\left[x\right]$](../symbols.md#sequence)</span> | the sequence | a sequence written out item by item; [ ] is the empty one |
| <span id="gk-ao-yield">$y$</span> | y | a run's yield: a 32-byte hash for the outside world, or nothing |
| <span id="gk-ao-gasused">$u$</span> | u | the gas a run used |
| <span id="gk-jam-blob" class="gk-wrap">$\mathfrak{j}$</span> | j (gothic) | a standard program: four sizes, the read-only and read-write data, then the PVM blob |
| <span id="gk-vee">$\vee$</span> | or | at least one side is true |
| <span id="gk-Cmaxservicecodesize" class="gk-wrap">$\mathsf{W}_C$</span> | W sub C | the largest a service's code may be: 4,000,000 bytes |
| <span id="gk-ps-accounts" class="gk-wrap">$\mathbf{d}$</span> | d | a partial state's service accounts, by service id |
| <span id="gk-sa-code" class="gk-wrap">$\mathbf{c}$</span> | c (bold) | an account's code: the PVM program, the second half of its code-hash preimage; ∅ if there is none |
| <span id="gk-sa-balance">$b$</span> | b | an account's balance, in tokens: a u64 |
| <span id="gk-sum">$\sum$</span> | the sum of | add up what follows, once for each value the subscript ranges over |
| <span id="gk-dx-amount">$a$</span> | a | how much balance the transfer moves |
| <span id="gk-build">$\left\{ x \;\middle\vert\; y \right\}$</span> | for each, such that | built by a rule: the left-hand value, for every case the right-hand side allows (a set, or a sequence in order) |
| <span id="gk-orderedin">$\mathrel{\unicode{x2B40}}$</span> | in order, from | each item of the sequence, in its order |
| <span id="gk-implications" class="gk-wrap">$\mathbb{L}$</span> | L | an accumulation's context: the service running, the state it sees, the next free service id, its transfers, its yield and its provisions |
| <span id="gk-im-id">$s$</span> | s | the id of the service accumulating |
| <span id="gk-im-nextfreeid">$i$</span> | i | the id the next service it creates will get |
| <span id="gk-decode">[$\mathcal{E}^{-1}\left(x\right)$](../symbols.md#decode)</span> | E inverse of | decoding: bytes back into the value they encode |
| <span id="gk-blake">$\mathcal{H}\left(x\right)$</span> | H of | the Blake2b hash of what's in the brackets: 32 bytes |
| <span id="gk-entropyaccumulator" class="gk-wrap">$\eta_0$</span> | eta zero | the entropy accumulator: 32 bytes that every block's VRF output is hashed into |
| <span id="gk-H" class="gk-wrap">$\mathbf{H}$</span> | H | this block's header; 𝐇_T is its timeslot, 𝐇_P its parent's hash |
| <span id="gk--timeslot">$T$</span> | T | a header's timeslot: 𝐇_T is the slot this block was made for |
| <span id="gk-bmod">[$\bmod$](../symbols.md#mod)</span> | mod | the remainder after dividing: 14 mod 4 is 2 |
| <span id="gk-Cminpublicindex" class="gk-wrap">$\mathsf{S}$</span> | S | the lowest id an ordinary new service can get: 2¹⁶ = 65,536; the ids below it only the registrar hands out |
| <span id="gk-implicationspair">$\!\left\lgroup\mathbb{L}, \mathbb{L}\right\rgroup\!$</span> | a pair of contexts | two accumulation contexts side by side: the regular one and the exceptional one |
| <span id="gk-imXY">$\left(\mathbf{x}, \mathbf{y}\right)$</span> | x and y | the pair of contexts every accumulate host call gets: x as the service changes it, y as at its last checkpoint |
| <span id="gk-imX" class="gk-wrap">$\mathbf{x}$</span> | x | the regular context: what the host calls change as the service runs, kept if it halts |
| <span id="gk-Taurus">$\unicode{x2649}$</span> | Taurus | the sign that names yield: Ω_♉ records the hash a service yields |
| <span id="gk-Aries">$\unicode{x2648}$</span> | Aries | the sign that names provide: Ω_♈ hands a preimage to a service that asked for it |
| <span id="gk-set">$\left\{\,x\,\right\}$</span> | the set of | a set: values with no order and no repeats |
| <span id="gk-halt" class="gk-wrap">$\blacksquare$</span> | halt | ∎: the program finished normally |
| <span id="gk-panic">$\unicode{x21AF}$</span> | panic | ↯: the program trapped |
| <span id="gk-regs">$\left[\!\left[\mathbb{N}_R\right]\!\right]_{13}$</span> | thirteen registers | a sequence of 13 register values, each a u64 |
| <span id="gk-ram" class="gk-wrap">$\mathbb{M}$</span> | M | a PVM memory: its bytes, and which pages may be read or written |
| <span id="gk-serviceaccount" class="gk-wrap">$\mathbb{A}$</span> | A | a service account: three dictionaries (storage, preimages, requests) and eight plain fields |
| <span id="gk-execst" class="gk-wrap">$\varepsilon$</span> | epsilon | how the machine goes on after a host call: carry on (▸), halt, panic or out of gas |
| <span id="gk-imY" class="gk-wrap">$\mathbf{y}$</span> | y | the exceptional context: the state at the last checkpoint, kept if the service panics or runs out of gas |
| <span id="gk-hash">$\mathbb{H}$</span> | H | a 32-byte value, usually a hash |

</details>

:::

Read the first line aloud: "the accumulation invocation takes a partial state, a timeslot,
a service index, a gas limit and a sequence of operands or deferred transfers, and gives
an accumulation output." 𝕊 is the slice of the state a service may touch: the accounts,
the staging validators, the authorizer queues and the privileges; 𝕌 is one digest made
ready for a service ([16.7](./07-a-services-inputs.md)); 𝕏 a transfer from another
service. The rest says how: run the service's code from instruction 5 with the host F,
starting from two copies of the context I, and at the end keep one of them, C. Each Ω in
B.5 onward is written the same way: a list of cases saying what the call reads from the
registers, what it answers, and the gas it costs, which is why every lesson in this part
has the same shape. Every formula of Appendix B, and every row of its three tables, is
explained symbol by symbol in [16.A](./gray-paper.md).

**Test yourself:** [E · PVM invocations and host calls (Appendix B)](https://abutlabs.github.io/jam-learning/lasair/exam.html?chapter=e-invocations),
self-test cards on JAM learning.
