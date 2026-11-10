# The formulas, in plain words

[Part 19](./index.md)'s appendix: the two formulas of §4, *Overview*, that [Part 19](./index.md) quotes, read for
someone who doesn't read math. (4.2) and (4.3) say what a block is; (4.5) to (4.20), one
block of sixteen lines, say what every new piece of state is made from, and so in what
order a client can make them. The rest of §4's formulas, the state transition (4.1) and
the state (4.4) among them, are [Part 0's appendix](../00-start/gray-paper.md). Each comes
with its key, then the same four steps: read it aloud, say it in plain words, watch it
work on a real value, and find it in your client.

## (4.2) and (4.3): a block is a header and five bags

::: gray-paper-eq 4.2

<a id="ex-4-2"></a>The Gray Paper's (4.2), (4.3), [in its place in the paper's words](./04-importing-a-block.md#eq-4-2):

$$
\begin{align}
\mathbf{B} &\equiv \left(\mathbf{H}, \mathbf{E}\right) \tag{4.2} \\
\mathbf{E} &\equiv \left(\mathbf{E}_T, \mathbf{E}_D, \mathbf{E}_P, \mathbf{E}_A, \mathbf{E}_G\right) \tag{4.3}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-block" class="gk-wrap">[$\mathbf{B}$](../symbols.md#block)</span> | B | a block: its header and its extrinsic |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-header" class="gk-wrap">$\mathbf{H}$</span> | H | a block header: the parent's hash, the slot, the seals and markers |
| <span id="gk-extrinsic" class="gk-wrap">$\mathbf{E}$</span> | E | a block's extrinsic: the data it carries in, in five bags |
| <span id="gk-xttickets" class="gk-wrap">$\mathbf{E}_T$</span> | E sub T | the tickets bag: entries to the block-sealing lottery |
| <span id="gk-xtdisputes" class="gk-wrap">$\mathbf{E}_D$</span> | E sub D | the disputes bag: verdicts, culprits and faults |
| <span id="gk-xtpreimages" class="gk-wrap">$\mathbf{E}_P$</span> | E sub P | the preimages bag: data a service asked for |
| <span id="gk-xtassurances" class="gk-wrap">$\mathbf{E}_A$</span> | E sub A | the assurances bag: validators saying they hold their pieces of reports |
| <span id="gk-xtguarantees" class="gk-wrap">$\mathbf{E}_G$</span> | E sub G | the guarantees bag: work-reports with their guarantors' signatures, one per core at most |

</details>

:::

**Read it aloud.** "B is defined as the tuple H and E. E is defined as the tuple E sub T,
E sub D, E sub P, E sub A, E sub G."

**In plain words.** A block is two things: a header, the cover page signed by its author,
and the extrinsic, the data the block carries in from outside. The extrinsic is five lists:
tickets for the sealing lottery, disputes, preimages, availability assurances and
guaranteed reports. Any of them can be empty.

**On a real value.** The `preimages` trace's block for slot 8:

```text
𝐇      the header: parent, prior state root, slot 8, author, seal, …
𝐄_T    tickets       0
𝐄_D    disputes      0 verdicts, 0 culprits, 0 faults
𝐄_P    preimages     4
𝐄_A    assurances    6: one from each of tiny's 6 validators
𝐄_G    guarantees    2: one for each of tiny's 2 cores
```

That is the paper's order. A block's bytes hold the bags in another (tickets, preimages,
guarantees, assurances, disputes), and your client imports them in a third
([19.4](./04-importing-a-block.md#what-the-gray-paper-says)).

**In your client.** `Block` in `src/block.ts`, its header and its five lists, built in
[4.7](../04-blocks/07-the-block.md).

## (4.5) to (4.20): what each new piece of state is made from

::: gray-paper-eq 4.5

<a id="ex-4-5"></a>The Gray Paper's (4.5), (4.6), (4.7), (4.8), (4.9), (4.10), (4.11), (4.12), (4.13), (4.14), (4.15), (4.16), (4.17), (4.18), (4.19), (4.20), [in its place in the paper's words](./01-the-order-of-things.md#eq-4-5):

$$
\begin{align}
\tau' &\prec \mathbf{H} \tag{4.5} \\
\beta_H^\dagger &\prec \left(\mathbf{H}, \beta_H\right) \tag{4.6} \\
\gamma' &\prec \left(\mathbf{H}, \tau, \mathbf{E}_T, \gamma, \iota, \eta', \kappa', \psi'\right) \tag{4.7} \\
\eta' &\prec \left(\mathbf{H}, \tau, \eta\right) \tag{4.8} \\
\kappa' &\prec \left(\mathbf{H}, \tau, \kappa, \gamma\right) \tag{4.9} \\
\lambda' &\prec \left(\mathbf{H}, \tau, \lambda, \kappa\right) \tag{4.10} \\
\psi' &\prec \left(\mathbf{E}_D, \psi\right) \tag{4.11} \\
\rho^\dagger &\prec \left(\mathbf{E}_D, \rho\right) \tag{4.12} \\
\rho^\ddagger &\prec \left(\mathbf{E}_A, \rho^\dagger\right) \tag{4.13} \\
\rho' &\prec \left(\mathbf{E}_G, \rho^\ddagger, \kappa, \tau'\right) \tag{4.14} \\
\mathbf{R}^* &\prec \left(\mathbf{E}_A, \rho^\dagger\right) \tag{4.15} \\
\left(\omega', \xi', \delta^\ddagger, \chi', \iota', \phi', \theta', \mathbf{S}\right) &\prec \left(\mathbf{R}^*, \omega, \xi, \delta, \chi, \iota, \phi, \tau, \tau'\right) \tag{4.16} \\
\beta_H' &\prec \left(\mathbf{H}, \mathbf{E}_G, \beta_H^\dagger, \theta'\right) \tag{4.17} \\
\delta' &\prec \left(\mathbf{E}_P, \delta^\ddagger, \tau'\right) \tag{4.18} \\
\alpha' &\prec \left(\mathbf{H}, \mathbf{E}_G, \phi', \alpha\right) \tag{4.19} \\
\pi' &\prec \left(\mathbf{E}_G, \mathbf{E}_P, \mathbf{E}_A, \mathbf{E}_T, \tau, \kappa', \pi, \mathbf{H}, \mathbf{S}\right)\!\!\!\!\!\!\!\! \tag{4.20}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-thetime" class="gk-wrap">$\tau$</span> | tau | the time: the latest block's timeslot |
| <span id="gk-prec">$\prec$</span> | is defined in terms of | y ≺ x: y can be computed from x alone |
| <span id="gk-recenthistorypostparentstaterootupdate" class="gk-wrap">$\beta_H^\dagger$</span> | beta sub H dagger | the recent blocks midway: with the parent's state root filled in, before this block's entry |
| <span id="gk-recenthistory" class="gk-wrap">$\beta_H$</span> | beta sub H | the last H = 8 blocks: each one's header hash, state root, belt peak and reported packages |
| <span id="gk-safrole" class="gk-wrap">$\gamma$</span> | gamma | Safrole's state: the ticket lottery for who seals the next epoch's blocks |
| <span id="gk-stagingset" class="gk-wrap">$\iota$</span> | iota | the next validators: keys queued to become active at the next epoch |
| <span id="gk-entropy" class="gk-wrap">$\eta$</span> | eta | entropy: four 32-byte values of randomness, the newest mixing in every block |
| <span id="gk-activeset" class="gk-wrap">$\kappa$</span> | kappa | the current validators: the keys of the V validators active this epoch |
| <span id="gk-disputes" class="gk-wrap">$\psi$</span> | psi | past judgments: the reports found good, bad or wonky, and the validators who lied |
| <span id="gk-previousset" class="gk-wrap">$\lambda$</span> | lambda | the last epoch's validators: kept to check what they signed before the change |
| <span id="gk-availassignmentspostjudgment" class="gk-wrap">$\rho^\dagger$</span> | rho dagger | the pending reports midway: after disputes took the judged-bad ones out |
| <span id="gk-availassignments" class="gk-wrap">$\rho$</span> | rho | the pending reports: for each core, the report waiting to be made available, and when it came |
| <span id="gk-availassignmentspostassurances" class="gk-wrap">$\rho^\ddagger$</span> | rho double dagger | the pending reports midway: after the available ones and the timed-out ones left |
| <span id="gk-justbecameavailable" class="gk-wrap">$\mathbf{R}$</span> | R | the reports this block made available: ready to accumulate |
| <span id="gk-ready" class="gk-wrap">$\omega$</span> | omega | the ready queue: available reports waiting on others before they can accumulate |
| <span id="gk-accumulated" class="gk-wrap">$\xi$</span> | xi | the accumulated history: the packages accumulated in each of the last E slots |
| <span id="gk-accountspostxfer" class="gk-wrap">$\delta^\ddagger$</span> | delta double dagger | the service accounts midway: after accumulation |
| <span id="gk-privileges" class="gk-wrap">$\chi$</span> | chi | the privileged services: who may manage, assign cores, set validators and accumulate for free |
| <span id="gk-authqueue" class="gk-wrap">$\phi$</span> | phi | the authorizer queues: for each core, Q = 80 authorizer hashes waiting to join its pool |
| <span id="gk-lastaccout" class="gk-wrap">$\theta$</span> | theta | the last block's accumulation outputs: which service yielded which hash |
| <span id="gk-accumulationstatistics" class="gk-wrap">$\mathbf{S}$</span> | S | this block's accumulation tallies, per service: work-items accumulated, transfers, and gas used |
| <span id="gk-accountspre" class="gk-wrap">$\delta$</span> | delta | the service accounts before the block |
| <span id="gk-accountspostpreimage" class="gk-wrap">$\delta'$</span> | delta prime | the service accounts after the block, the preimages provided included |
| <span id="gk-authpool" class="gk-wrap">$\alpha$</span> | alpha | the authorizer pools: for each core, up to O = 8 authorizer hashes it accepts right now |
| <span id="gk-activity" class="gk-wrap">$\pi$</span> | pi | the statistics: tallies per validator, per core and per service |

</details>

:::

**Read it aloud**, line by line, ≺ as "is made from":

```text
(4.5)   tau prime from the header
(4.6)   beta H dagger from the header and beta H
(4.7)   gamma prime from the header, tau, the tickets, gamma, iota, eta prime, kappa prime, psi prime
(4.8)   eta prime from the header, tau, eta
(4.9)   kappa prime from the header, tau, kappa, gamma
(4.10)  lambda prime from the header, tau, lambda, kappa
(4.11)  psi prime from the disputes and psi
(4.12)  rho dagger from the disputes and rho
(4.13)  rho double dagger from the assurances and rho dagger
(4.14)  rho prime from the guarantees, rho double dagger, kappa, tau prime
(4.15)  R star from the assurances and rho dagger
(4.16)  omega prime, xi prime, delta double dagger, chi prime, iota prime, phi prime,
        theta prime and S, from R star, omega, xi, delta, chi, iota, phi, tau, tau prime
(4.17)  beta H prime from the header, the guarantees, beta H dagger, theta prime
(4.18)  delta prime from the preimages, delta double dagger, tau prime
(4.19)  alpha prime from the header, the guarantees, phi prime, alpha
(4.20)  pi prime from the guarantees, preimages, assurances, tickets, tau, kappa prime,
        pi, the header and S
```

**In plain words.** Not a rule to compute anything, but a list of ingredients: for each
new piece of state, what it needs. Anything with a prime or a dagger on the right is made
by another line, so it must be made first. Anything plain on the right is the state
before the block, or a part of the block, and is there from the start. A dagger is a
value halfway through the block: ρ† is the cores after the disputes, ρ‡ after the
assurances too, β_H† the recent blocks with the parent's state root filled in, δ‡ the
accounts after accumulation. (4.16) is one line for all of accumulation, because one run
makes all eight of its outputs together.

**On a real value.** The order your client works out from it, one step at a time, with
each step's wave one more than the latest wave among its ingredients (the block and the
old state are wave 0):

```text
τ′       ← 𝐇                         latest ingredient: wave 0      wave 1
η′       ← 𝐇, τ, η                   wave 0                         wave 1
κ′       ← 𝐇, τ, κ, γ                wave 0                         wave 1
ψ′       ← 𝐄_D, ψ                    wave 0                         wave 1
ρ†       ← 𝐄_D, ρ                    wave 0                         wave 1
γ′       ← …, η′, κ′, ψ′             wave 1                         wave 2
𝐑*       ← 𝐄_A, ρ†                   wave 1                         wave 2
(4.16)   ← 𝐑*, …                     wave 2                         wave 3
α′       ← 𝐇, 𝐄_G, ϕ′, α             ϕ′ from (4.16): wave 3         wave 4
```

Every step lands in one of four waves, and the chain ρ† → 𝐑* → accumulation → α′ is what
makes it four: `npm run plan` prints all sixteen
([19.1](./01-the-order-of-things.md#watch-it)).

**In your client.** `STEPS`, these sixteen lines as data, and `waves`, which sorts them,
both in `src/import.ts` ([19.1](./01-the-order-of-things.md#the-code)); `importBlock` runs
the steps in one order the waves allow ([19.4](./04-importing-a-block.md#the-code)).

## Say it in one breath

A block is a header and five bags: tickets, disputes, preimages, assurances, guarantees
(4.2), (4.3). The dependency graph lists, for each new piece of state, what it's made from
(4.5) to (4.20): a prime or a dagger on the right means "make that first", and sorted out
that is four waves, with accumulation in the third and the pools, recent blocks, accounts
and statistics waiting for it in the fourth.
