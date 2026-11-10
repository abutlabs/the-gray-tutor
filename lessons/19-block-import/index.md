# Part 19 · Block import

Everything comes together. By the end of this part your client imports real blocks: the
first 100 blocks of all eight official traces, chained from genesis, every state root right
and every bad block refused.

## The big picture

[Lesson 0.6](../00-start/06-how-a-block-is-imported.md) walked a block through eight
stations, like a bank clerk posting a day's payments: check it follows yesterday, check
every payment, post all of them or none, print the new balance. Back then most stations
were only names. You've built nearly all of them now:

| | Station | Built in |
| --- | --- | --- |
| 1 | bytes arrive | [20.1](../20-facing-the-fuzzer/01-speaking-the-protocol.md) |
| 2 | decode the block | [4.7](../04-blocks/07-the-block.md) |
| 3 | find the state before | [20.2](../20-facing-the-fuzzer/02-a-target.md) |
| 4 | check the header | [19.4](./04-importing-a-block.md) |
| 5 | run Υ, the state transition | Parts [8](../08-safrole/index.md) to [18](../18-statistics/index.md), joined in [19.4](./04-importing-a-block.md) |
| 6 | all or nothing | [19.4](./04-importing-a-block.md) |
| 7 | hash the new state into its root | [6.1](../06-state-and-merklization/01-the-state-trie.md) |
| 8 | keep it and answer | [20.2](../20-facing-the-fuzzer/02-a-target.md) |

Every station is on the chain, on every validator. The in-core work, the authorizer and
refine, happened before the block existed and reaches station 5 only as signed reports;
[What runs where](../what-runs-where.md) draws the split. Station 5 is the big one, and
until now each piece of it has only met its own test vectors. This part joins the pieces and runs real blocks through them. The test is as hard
as a test can be: one 32-byte state root, which is wrong if any byte of the state is.

| Question | Lessons | Time |
| --- | --- | --- |
| In what order do the steps run? | [19.1](./01-the-order-of-things.md) | 7 min |
| How does the whole state fit together? | [19.2](./02-the-whole-state.md), [19.3](./03-accounts-from-the-state.md) | 12 min |
| Does a real block go all the way through? | [19.4](./04-importing-a-block.md) | 9 min |
| What did real blocks find that test vectors couldn't? | [19.5](./05-work-on-the-chain.md), [19.6](./06-blocks-to-refuse.md) | 13 min |

**Builds on** [Part 3 · Work and reports](../03-work-and-reports/index.md), [Part 4 ·
Blocks](../04-blocks/index.md), [Part 5 · Hashing and
signatures](../05-hashing-and-signatures/index.md), [Part 6 · State and
Merklization](../06-state-and-merklization/index.md), [Part 8 ·
Safrole](../08-safrole/index.md), [Part 9 · Recent
history](../09-recent-history/index.md), [Part 10 · Disputes](../10-disputes/index.md),
[Part 11 · Assurances](../11-assurances/index.md), [Part 12 ·
Guarantees](../12-guarantees/index.md), [Part 13 ·
Authorization](../13-authorization/index.md), [Part 14 · Services and
preimages](../14-services/index.md), [Part 16 · Host calls](../16-host-calls/index.md),
[Part 17 · Accumulation](../17-accumulation/index.md) and [Part 18 ·
Statistics](../18-statistics/index.md), and on the foundations every part uses, [Parts 0
to 2](../index.md#lessons).

## At a glance

The whole part on one map. Boxes are what your client holds, and rounded cards are the
steps between them; a dashed card happens outside your client. Tap any card, or walk
through them in order with *next*.

<PartFlow :part="19" />

**Starting here?** At the repo root, `npm run catch-up -- 18.2` makes your client the one
this part starts from; [How to read it](../index.md#how-to-read-it) says more.

- [19.1 The order of things](./01-the-order-of-things.md)
- [19.2 The whole state](./02-the-whole-state.md)
- [19.3 Accounts from the state](./03-accounts-from-the-state.md)
- [19.4 Importing a block](./04-importing-a-block.md)
- [19.5 Work on the chain](./05-work-on-the-chain.md)
- [19.6 Blocks to refuse](./06-blocks-to-refuse.md)

## In the Gray Paper

Open **§4, *Overview***: its first equation is the state transition, 4.1 the block, 4.2 the state and, in 4.2.1, the dependency graph, and then every section it names. This is the page an interviewer opens first.

| The paper says | We say | The vectors say |
| --- | --- | --- |
| σ′ ≡ Υ(σ, 𝐁): the posterior state is the state-transition function of the prior state and the block | import a block | `pre_state`, `block`, `post_state` |
| x ≺ y, "x is determined by y": each line of the dependency graph | the order of things | |
| β†, ρ†, ρ‡, δ†, δ‡: intermediate states, after one step and before the next | the dagger states | |

Its defining lines, (4.1) and the graph (4.5) to (4.20), each explained symbol by symbol
in [0.A](../00-start/gray-paper.md) and [19.A](./gray-paper.md):

::: gray-paper-eq 4.1

<a id="ex-4-1"></a>The Gray Paper's (4.1), [in its place in the paper's words](../00-start/01-what-you-will-build.md#eq-4-1):

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
| <span id="gk-theheader" class="gk-wrap">$\mathbf{H}$</span> | H | this block's header |
| <span id="gk-recenthistorypostparentstaterootupdate" class="gk-wrap">$\beta_H^\dagger$</span> | beta sub H dagger | the recent blocks midway: with the parent's state root filled in, before this block's entry |
| <span id="gk-recenthistory" class="gk-wrap">$\beta_H$</span> | beta sub H | the last H = 8 blocks: each one's header hash, state root, belt peak and reported packages |
| <span id="gk-safrole" class="gk-wrap">$\gamma$</span> | gamma | Safrole's state: the ticket lottery for who seals the next epoch's blocks |
| <span id="gk-xttickets" class="gk-wrap">$\mathbf{E}_T$</span> | E sub T | the tickets bag: entries to the block-sealing lottery |
| <span id="gk-stagingset" class="gk-wrap">$\iota$</span> | iota | the next validators: keys queued to become active at the next epoch |
| <span id="gk-entropy" class="gk-wrap">$\eta$</span> | eta | entropy: four 32-byte values of randomness, the newest mixing in every block |
| <span id="gk-activeset" class="gk-wrap">$\kappa$</span> | kappa | the current validators: the keys of the V validators active this epoch |
| <span id="gk-disputes" class="gk-wrap">$\psi$</span> | psi | past judgments: the reports found good, bad or wonky, and the validators who lied |
| <span id="gk-previousset" class="gk-wrap">$\lambda$</span> | lambda | the last epoch's validators: kept to check what they signed before the change |
| <span id="gk-xtdisputes" class="gk-wrap">$\mathbf{E}_D$</span> | E sub D | the disputes bag: verdicts, culprits and faults |
| <span id="gk-availassignmentspostjudgment" class="gk-wrap">$\rho^\dagger$</span> | rho dagger | the pending reports midway: after disputes took the judged-bad ones out |
| <span id="gk-availassignments" class="gk-wrap">$\rho$</span> | rho | the pending reports: for each core, the report waiting to be made available, and when it came |
| <span id="gk-availassignmentspostassurances" class="gk-wrap">$\rho^\ddagger$</span> | rho double dagger | the pending reports midway: after the available ones and the timed-out ones left |
| <span id="gk-xtassurances" class="gk-wrap">$\mathbf{E}_A$</span> | E sub A | the assurances bag: validators saying they hold their pieces of reports |
| <span id="gk-xtguarantees" class="gk-wrap">$\mathbf{E}_G$</span> | E sub G | the guarantees bag: work-reports with their guarantors' signatures, one per core at most |
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
| <span id="gk-xtpreimages" class="gk-wrap">$\mathbf{E}_P$</span> | E sub P | the preimages bag: data a service asked for |
| <span id="gk-authpool" class="gk-wrap">$\alpha$</span> | alpha | the authorizer pools: for each core, up to O = 8 authorizer hashes it accepts right now |
| <span id="gk-activity" class="gk-wrap">$\pi$</span> | pi | the statistics: tallies per validator, per core and per service |

</details>

:::

Read it aloud, (4.1) first: "sigma prime is defined as upsilon of sigma and B." Then a few
of the graph's lines: "the new time is determined by the header. The history with the parent's
root filled in is determined by the header and the old history. The new Safrole state is
determined by the header, the time, the tickets, the old Safrole state, the staging
validators, and the *new* entropy, validators and disputes. The pending reports after
disputes come from the disputes and the old pending reports; after assurances, from the
assurances and that; the final ones from the guarantees, that, the validators and the new
time. The new pools come from the header, the guarantees, the *new* queues and the old
pools." Every prime on the right-hand side is an ordering constraint, and
[19.1](./01-the-order-of-things.md) turns the whole graph into the order your client
runs.

**Test yourself:** [Ch. 4 Overview](https://abutlabs.github.io/jam-learning/lasair/exam.html?chapter=ch04-overview),
self-test cards on JAM learning.
