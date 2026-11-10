# The formulas, in plain words

[Part 0](./index.md)'s appendix: every formula of §4, *Overview*, that [Part 0](./index.md) and the map pages quote,
read for someone who doesn't read math. There are nine blocks: the state transition, the
state's seventeen parts, a balance, the PVM and its gas and memory, and a timeslot. §4's
block and dependency graph are [Part 19's appendix](../19-block-import/gray-paper.md).
Each formula comes with its key, then the same four steps: read it aloud, say it in plain
words, watch it work on a real value, and find it in your client. [Reading the Gray
Paper](../reading-the-gray-paper.md) teaches the shapes a line can take, if one of these
stops you.

## (4.1): one block, one step

::: gray-paper-eq 4.1

<a id="ex-4-1"></a>The Gray Paper's (4.1), [in its place in the paper's words](./01-what-you-will-build.md#eq-4-1):

$$
\begin{align}
\sigma' \equiv \Upsilon(\sigma, \mathbf{B}) \tag{4.1}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-thestate" class="gk-wrap">[$\sigma$](../symbols.md#state)</span> | sigma | the state: everything the chain remembers between blocks |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-transitionstate" class="gk-wrap">[$\Upsilon$](../symbols.md#transition)</span> | upsilon | the state transition: the state and a block in, the next state out |
| <span id="gk-block" class="gk-wrap">[$\mathbf{B}$](../symbols.md#block)</span> | B | a block: its header and its extrinsic |

</details>

:::

**Read it aloud.** "Sigma prime is defined as upsilon of sigma and B."

**In plain words.** The state after a block is a function of two things only: the state
before it and the block. Nothing else goes in: not the time a node imports it, not any
node's own view.
That is why every correct client gets the same answer, byte for byte.

**On a real value.** The `safrole` trace's first block, slot 1:

```text
σ        the state at genesis, τ = 0           root 0xd6e78dc0…
B        the block for slot 1                   its header quotes 0xd6e78dc0… as its parent's state root
Υ(σ, B)  every step of the import
σ′       the state after slot 1, τ′ = 1         root 0x48dc323d…, which block 2 quotes
```

**In your client.** `importBlock` in `src/import.ts` is Υ, built in
[19.4](../19-block-import/04-importing-a-block.md#the-code).

## (4.4): the state's seventeen parts

::: gray-paper-eq 4.4

<a id="ex-4-4"></a>The Gray Paper's (4.4), [in its place in the paper's words](./06-how-a-block-is-imported.md#eq-4-4):

$$
\begin{align}
\sigma &\equiv \left(\alpha, \beta, \theta, \gamma, \delta, \eta, \iota, \kappa, \lambda, \rho, \tau, \phi, \chi, \psi, \pi, \omega, \xi\right) \tag{4.4}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-authpool" class="gk-wrap">$\alpha$</span> | alpha | the authorizer pools: for each core, up to O = 8 authorizer hashes it accepts right now |
| <span id="gk-recent" class="gk-wrap">$\beta$</span> | beta | recent blocks: the last few blocks' hashes and roots, and the belt of accumulation outputs |
| <span id="gk-lastaccout" class="gk-wrap">$\theta$</span> | theta | the last block's accumulation outputs: which service yielded which hash |
| <span id="gk-safrole" class="gk-wrap">$\gamma$</span> | gamma | Safrole's state: the ticket lottery for who seals the next epoch's blocks |
| <span id="gk-accounts" class="gk-wrap">$\delta$</span> | delta | the service accounts: every service's code hash, balance, storage and preimages |
| <span id="gk-entropy" class="gk-wrap">$\eta$</span> | eta | entropy: four 32-byte values of randomness, the newest mixing in every block |
| <span id="gk-stagingset" class="gk-wrap">$\iota$</span> | iota | the next validators: keys queued to become active at the next epoch |
| <span id="gk-activeset" class="gk-wrap">$\kappa$</span> | kappa | the current validators: the keys of the V validators active this epoch |
| <span id="gk-previousset" class="gk-wrap">$\lambda$</span> | lambda | the last epoch's validators: kept to check what they signed before the change |
| <span id="gk-availassignments" class="gk-wrap">$\rho$</span> | rho | the pending reports: for each core, the report waiting to be made available, and when it came |
| <span id="gk-thetime" class="gk-wrap">$\tau$</span> | tau | the time: the latest block's timeslot |
| <span id="gk-authqueue" class="gk-wrap">$\phi$</span> | phi | the authorizer queues: for each core, Q = 80 authorizer hashes waiting to join its pool |
| <span id="gk-privileges" class="gk-wrap">$\chi$</span> | chi | the privileged services: who may manage, assign cores, set validators and accumulate for free |
| <span id="gk-disputes" class="gk-wrap">$\psi$</span> | psi | past judgments: the reports found good, bad or wonky, and the validators who lied |
| <span id="gk-activity" class="gk-wrap">$\pi$</span> | pi | the statistics: tallies per validator, per core and per service |
| <span id="gk-ready" class="gk-wrap">$\omega$</span> | omega | the ready queue: available reports waiting on others before they can accumulate |
| <span id="gk-accumulated" class="gk-wrap">$\xi$</span> | xi | the accumulated history: the packages accumulated in each of the last E slots |

</details>

:::

**Read it aloud.** "Sigma is defined as the tuple alpha, beta, theta, gamma, delta, eta,
iota, kappa, lambda, rho, tau, phi, chi, psi, pi, omega, xi."

**In plain words.** The state is a record of seventeen fields, each a Greek letter. One
word each: pools, recent blocks, last outputs, Safrole, services, entropy, next
validators, current validators, last validators, pending reports, time, queues,
privileges, judgments, statistics, ready queue, accumulated. Sixteen are stored under a
key each, C(1) to C(16), in another order; δ, the services, is stored as one record per
service plus one entry per thing it keeps.

**On a real value.** The `safrole` trace's state before its first block, as it's stored:

```text
21 key-value pairs
16 of them         C(1) to C(16): one component each
  C(1)  α          514 bytes: 2 cores × (1 length byte + 8 hashes × 32)
  C(2)  ϕ          5,120 bytes: 2 cores × 80 hashes × 32
  C(11) τ          4 bytes, 00 00 00 00: slot 0
5 more             service 0, δ: its record at C(255, 0), 89 bytes, and 4 entries
```

**In your client.** The `State` type in `src/whole-state.ts`: one field per stored
component, by number, and the accounts, built in
[19.2](../19-block-import/02-the-whole-state.md#the-code).

## (4.21): a balance

::: gray-paper-eq 4.21

<a id="ex-4-21"></a>The Gray Paper's (4.21), [in its place in the paper's words](../what-runs-where.md#eq-4-21):

$$
\begin{align}
\mathbb{N}_B \equiv \mathbb{N}_{2^{64}} \tag{4.21}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-balance" class="gk-wrap">$\mathbb{N}_B$</span> | N sub B | a balance: a u64 |
| <span id="gk-Nbits">[$\mathbb{N}_{2^{x}}$](../symbols.md#naturals)</span> | N sub two to the n | the numbers that fit in n bits: ℕ_{2³²} is a u32 |

</details>

:::

**Read it aloud.** "N sub B is defined as N sub two to the sixty-four."

**In plain words.** A balance is a whole number of the smallest unit, from 0 up to
2⁶⁴ − 1: a u64. It can't be negative, and it can't be larger.

**On a real value.** Service 0 in the `safrole` trace holds the largest balance (4.21)
allows: its record's bytes 33 to 40 are `ff ff ff ff ff ff ff ff`, which is
2⁶⁴ − 1 = 18,446,744,073,709,551,615.

**In your client.** `balance: u64` in the service record's codec, eight bytes, little end
first ([14.2](../14-services/02-the-service-account.md#the-code)).

## (4.22): the PVM, from outside

::: gray-paper-eq 4.22

<a id="ex-4-22"></a>The Gray Paper's (4.22), [in its place in the paper's words](../what-runs-where.md#eq-4-22):

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
| <span id="gk-tuple">$\!\left\lgroup x\right\rgroup\!$</span> | the tuple of | a record: named fields, each with its type, like an object in JSON |
| <span id="gk-blob">[$\mathbb{B}$](../symbols.md#blobs)</span> | B, or B sub n | bytes: any run of them; 𝔹ₙ exactly n of them |
| <span id="gk-pvmreg" class="gk-wrap">$\mathbb{N}_R$</span> | N sub R | a register's value: a u64 |
| <span id="gk-gas" class="gk-wrap">$\mathbb{N}_G$</span> | N sub G | an amount of gas: a u64 |
| <span id="gk-bool">${\left\{\,\bot, \top\,\right\}}$</span> | true or false | a yes-or-no value: true (⊤) or false (⊥) |
| <span id="gk-sequence">[$\left[\!\left[x\right]\!\right]$](../symbols.md#sequence)</span> | a sequence of | ⟦T⟧ is an array of T; a subscript is its length, :n at most n, n: at least n |
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

</details>

:::

**Read it aloud.** "Psi takes a blob, an N sub R, an N sub G, a true-or-false, a sequence
of 13 N sub R and an M, to: halt, panic or out of gas, or fault or host call with an N sub
R; then an N sub R, an N sub G, a true-or-false, a sequence of 13 N sub R and an M."

**In plain words.** The PVM as a function: in go the program, the instruction counter,
the gas, a flag, the 13 registers and the memory; out come how it stopped and the same
five things after the run. A fault comes back with the address it touched, a host call
with which host function it asked for. The flag says whether the current basic block's
gas has been paid.

**On a real value.** [15.3](../15-the-pvm/03-the-machine.md)'s loop adds 10 + 9 + … + 1:

```text
in     the loop's program, counter 0, r0 = 0xFFFF0000 (the halt address), the rest 0
run    step after step round the loop, then a jump through r0
out    halt (∎), counter 0, r2 = 55
```

**In your client.** `Exit` and `Machine` in `src/pvm/machine.ts`, and `runWithGas` in
`src/pvm/gas.ts`, which runs it to the end ([15.11](../15-the-pvm/11-the-gas-meter.md#the-code)).

## (4.23): gas and registers

::: gray-paper-eq 4.23

<a id="ex-4-23"></a>The Gray Paper's (4.23), [in its place in the paper's words](../what-runs-where.md#eq-4-23):

$$
\begin{equation}
\mathbb{Z}_G \equiv \mathbb{Z}_{-2^{63}\dots2^{63}}\ ,\quad
\mathbb{N}_G \equiv \mathbb{N}_{2^{64}}\ ,\quad
\mathbb{N}_R \equiv \mathbb{N}_{2^{64}} \tag{4.23}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-signedgas" class="gk-wrap">$\mathbb{Z}_G$</span> | Z sub G | gas that can go negative: an i64 |
| <span id="gk-Z" class="gk-wrap">$\mathbb{Z}$</span> | Z | the integers, negative ones too; a subscript gives the range |

</details>

:::

**Read it aloud.** "Z sub G is defined as the integers from minus two to the sixty-three
up to two to the sixty-three; N sub G is defined as N sub two to the sixty-four; N sub R is
defined as N sub two to the sixty-four."

**In plain words.** Gas and a register's value are both u64s. Z_G is gas with a sign, an
i64, which the paper uses inside the PVM's definition where a subtraction could go below
zero.

**On a real value.** On full, refine may spend 5,000,000,000 gas on a package: it fits in
a u64 with room to spare (2⁶⁴ is about 1.8 × 10¹⁹). A register holding −1 is stored as
2⁶⁴ − 1, `ff ff ff ff ff ff ff ff`.

**In your client.** `bigint` for both, `gas` and `registers` in the `Machine` of
[15.11](../15-the-pvm/11-the-gas-meter.md#the-code).

## (4.24) and (4.25): memory

::: gray-paper-eq 4.24

<a id="ex-4-24"></a>The Gray Paper's (4.24), (4.25), [in its place in the paper's words](../what-runs-where.md#eq-4-24):

$$
\begin{align}
\mathbb{M} &\equiv \!\left\lgroup
\mathbf{v}\in \mathbb{B}_{2^{32}},
\mathbf{a}\in \left[\!\left[\left\{\,\text{W}, \text{R}, \emptyset\,\right\}\right]\!\right]_{p}
\right\rgroup\!\,,\ p = \frac{2^{32}}{\mathsf{Z}_P} \tag{4.24} \\
\mathsf{Z}_P &= 2^{12} \tag{4.25}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-isa">[$x\in y$](../symbols.md#in)</span> | in | belongs to: the field's type |
| <span id="gk-ram-value" class="gk-wrap">$\mathbf{v}$</span> | v | memory's bytes |
| <span id="gk-ram-access" class="gk-wrap">$\mathbf{a}$</span> | a | memory's access: for each page, readable, writable or neither |
| <span id="gk-none" class="gk-wrap">$\emptyset$</span> | nothing | ∅: no value at all, like null |
| <span id="gk-frac">$\frac$</span> | over | a fraction: the top divided by the bottom |
| <span id="gk-Cpvmpagesize" class="gk-wrap">$\mathsf{Z}_P$</span> | Z sub P | a memory page: 4,096 bytes |

</details>

:::

**Read it aloud.** "M is defined as the tuple of v, a blob of two to the thirty-two bytes,
and a, a sequence of p items, each W, R or nothing; where p is two to the thirty-two over
Z sub P. Z sub P is two to the twelve."

**In plain words.** Memory is 2³² bytes, and beside them one access mark per 4,096-byte
page: writable, read-only, or not there at all.

**On a real value.**

```text
Z_P = 2¹²          = 4,096 bytes a page
p   = 2³² / 4,096  = 1,048,576 pages
```

**In your client.** `PAGE_SIZE` and `Memory` in `src/pvm/memory.ts`, a `Map` holding only
the pages a program can touch ([15.4](../15-the-pvm/04-memory.md#the-code)).

## (4.26) and (4.27): what may be read and written

::: gray-paper-eq 4.26

<a id="ex-4-26"></a>The Gray Paper's (4.26), (4.27), [in its place in the paper's words](../what-runs-where.md#eq-4-26):

$$
\begin{align}
\mathbb{V}_{\mu} &\equiv \left\{\,i \;\middle\vert\; \mu_{\mathbf{a}}\left[\left\lfloor{}^{i}\!/_{\mathsf{Z}_P}\right\rfloor\right] \ne \emptyset\,\right\} \tag{4.26} \\
\mathbb{V}_{\mu}^* &\equiv \left\{\,i \;\middle\vert\; \mu_{\mathbf{a}}\left[\left\lfloor{}^{i}\!/_{\mathsf{Z}_P}\right\rfloor\right] = \text{W} \,\right\} \tag{4.27}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-readable">$\mathbb{V}_{x}$</span> | V sub mu | the addresses of memory μ that may be read |
| <span id="gk-memory" class="gk-wrap">$\mu$</span> | mu | the PVM's memory |
| <span id="gk-build">$x \;\middle\vert\; y$</span> | for each, such that | built by a rule: the left-hand value, for every case the right-hand side allows (a set, or a sequence in order) |
| <span id="gk-subb">[$\left[x\right]$](../symbols.md#sequence)</span> | at | x[i]: the item at index i, or the value at key i |
| <span id="gk-floor">[$\left\lfloor x\right\rfloor$](../symbols.md#floor)</span> | floor of | rounded down to a whole number |
| <span id="gk-nicefrac">${}^{x}\!/_{y}$</span> | over | a fraction: the top divided by the bottom |
| <span id="gk-ne">$\ne$</span> | is not | not equal |
| <span id="gk-writable">$\mathbb{V}_{x}^*$</span> | V sub mu star | the addresses of memory μ that may be written |

</details>

:::

**Read it aloud.** "V sub mu is defined as the set of i such that mu's access at the
floor of i over Z sub P is not nothing. V sub mu star is the set of i such that it is W."

**In plain words.** An address may be read if its page is there at all, and written only
if its page is marked W. Which page an address is on is the address divided by 4,096,
rounded down.

**On a real value.** Made up, on a memory with one writable page at 0x20000, as
[15.4](../15-the-pvm/04-memory.md) sets up:

```text
address 0x20010 = 131,088    ⌊131,088 / 4,096⌋ = 32    page 32 is W: readable and writable
address 0x21000 = 135,168    ⌊135,168 / 4,096⌋ = 33    page 33 isn't there: neither
```

**In your client.** The page checks in `src/pvm/memory.ts`: a read or write on a page that
doesn't allow it stops with a fault at that page's address
([15.4](../15-the-pvm/04-memory.md#the-code)).

## (4.28): a timeslot

::: gray-paper-eq 4.28

<a id="ex-4-28"></a>The Gray Paper's (4.28), [in its place in the paper's words](./04-the-jam-clock.md#eq-4-28):

$$
\begin{align}
\mathbb{N}_T \equiv \mathbb{N}_{2^{32}} \tag{4.28}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-timeslot" class="gk-wrap">$\mathbb{N}_T$</span> | N sub T | a timeslot: a u32 counting 6-second slots |

</details>

:::

**Read it aloud.** "N sub T is defined as N sub two to the thirty-two."

**In plain words.** A slot number is a u32: 0 to 4,294,967,295, one every six seconds from
the JAM Common Era.

**On a real value.**

```text
largest slot      2³² − 1 = 4,294,967,295
the clock's end   2³² × 6 = 25,769,803,776 seconds after 12:00 UTC, 1 January 2025
                  = 13 August 2841 (the paper says 2840)
```

**In your client.** `slotAt` in `src/time.ts` ([0.4](./04-the-jam-clock.md#the-code)), and
four bytes in every header ([4.6](../04-blocks/06-the-header.md)).

## Say it in one breath

The state after a block is a function of the state before it and the block, nothing else
(4.1). The state is seventeen named parts (4.4). Balances are u64s (4.21). The PVM takes a
program, counter, gas, flag, 13 registers and memory, and says how it stopped (4.22), with
gas and registers as u64s (4.23), memory as 2³² bytes in 4,096-byte pages marked
writable, read-only or absent (4.24) to (4.27). A slot is a u32 (4.28).
