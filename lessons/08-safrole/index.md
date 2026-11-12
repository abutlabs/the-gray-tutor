# Part 8 · Safrole

<AlbertGambler />

**In one sentence:** Safrole decides who makes each block, by a lottery whose winners
stay secret until the moment each makes theirs.

By the end of this part your client runs Safrole for every block: the whole state after
it, both marks for its header, tickets entered and their proofs checked, each new epoch's
ring root, and every block's seal. All 46 safrole vectors pass, and the seals of 198 real
blocks.

## The big picture

Safrole answers one question for every slot: *who may make this block?* It answers a whole
epoch ahead, with a lottery whose winners stay secret until their slot comes. That's the
point. If everyone knew who makes the block at 3 pm, an attacker could knock that one
validator offline at 2:59. With Safrole, nobody knows, not even the other winners.

The paper opens §6 with the same purpose:

::: gray-paper 6 1-3

#### §6 Block Production and Chain Growth {#gp-6}

<a id="gp-6-p1"></a>As mentioned earlier, JAM is architected around a hybrid consensus mechanism, similar in nature to that of Polkadot's BABE/GRANDPA hybrid. JAM's block production mechanism, termed Safrole after the novel Sassafras production mechanism of which it is a simplified variant, is a stateful system rather more complex than the <abbr class="gp-term" title="Bitcoin's way of agreeing on blocks: the chain with the most work wins">Nakamoto consensus</abbr> described in the *YP*.

<a id="gp-6-p2"></a>The chief purpose of a block production consensus mechanism is to limit the rate at which new blocks may be authored and, ideally, preclude the possibility of “<abbr class="gp-term" title="two blocks built on the same parent, splitting the chain until one side is dropped">forks</abbr>”: multiple blocks with equal numbers of ancestors.

<a id="gp-6-p3"></a>To achieve this, Safrole limits the possible author of any block within any given six-second timeslot to a single key-holder from within a prespecified sequence of *validators*. Furthermore, under normal operation, the identity of the key-holder of any future timeslot will have a very high degree of anonymity. As a side effect of its operation, we can generate a high-quality pool of entropy which may be used by other parts of the protocol and is accessible to services running on it.

:::

Every epoch, 12 slots on tiny and 600 (an hour) on full, runs the same cycle:

1. **Every block stirs the randomness.** Its maker signs it with a VRF, a signature whose
   output is random yet fixed. That output is hashed into η₀
   ([8.1](./01-stirring-the-entropy.md), [8.6](./06-the-vrf-output.md)). Epochs keep their
   old randomness too, η₁ to η₃, for rules that need a value nobody could have steered.
2. **While the lottery is open, validators enter tickets** for the *next* epoch: up to 3 a
   block on tiny, 16 on full, during the first 10 slots of 12 (500 of 600). A ticket is
   anonymous. Its ring proof says "one of next epoch's validators made me" and nothing
   more ([8.7](./07-entering-tickets.md), [8.8](./08-the-ring-root.md)). Its score is its
   VRF output, and the lottery keeps the best 12 (600), one per slot of the next epoch
   ([8.4](./04-the-lotterys-winners.md)).
3. **At slot 10 (500) the lottery closes.** If it's full, the first block after says so:
   its header's *tickets mark* lists the winners, in the order they'll seal
   ([8.4](./04-the-lotterys-winners.md)).
4. **At the epoch's turn, everything moves along one.**
   - The validators step through their queue, offenders zeroed
     ([8.2](./02-rotating-the-validators.md)).
   - The randomness history shifts ([8.1](./01-stirring-the-entropy.md)).
   - The new epoch's slots get their *sealers*. A full lottery seats its winners. A short
     one seats the *fallback*: validators picked from the randomness by hash, which
     everyone can work out but nobody could steer ([8.3](./03-the-fallback-sealers.md)).
   - The header's *epoch mark* announces the next validators and randomness.

   [8.5](./05-one-step-of-safrole.md) puts the cycle together, one block at a time.
5. **Every block's seal is checked** against its slot's sealer: the holder of the winning
   ticket, who reveals themselves only now by sealing, or the fallback's pick ([8.9](./09-seals.md)).

Every node runs these steps on every block, from the block and the state alone, so every
node seats the same sealers.

The paper names the same pieces in §6's opening, in its own letters: γ for Safrole's
state, γ_S for the sealers, γ_A for the lottery.

::: gray-paper 6 4-6

#### §6 Block Production and Chain Growth, continued

<a id="gp-6-p4"></a>Because of its tightly scoped role, the core of Safrole's state, $\gamma$, is independent of the rest of the protocol. It interacts with other portions of the protocol through $\iota$ and $\kappa$, the prospective and active sequences of validator keys respectively; $\tau$, the most recent block's timeslot; and $\eta$, the entropy accumulator.

<a id="gp-6-p5"></a>The Safrole protocol determines, once per epoch, a *<abbr class="gp-term" title="who may seal each slot of an epoch: E tickets, or E keys">slot-sealer sequence</abbr>* $\gamma_S$ of $\mathsf{E}$ entries, one for each potential block within the epoch. Under normal operation, each entry is a *ticket*: an anonymous claim to a timeslot. Each block header includes its timeslot index $\mathbf{H}_{T}$ (the number of six-second periods since the JAM Common Era began) and a valid seal signature $\mathbf{H}_{S}$, signed by the validator holding the secret key corresponding to the entry at the relevant index of $\gamma_S$. Each ticket is in fact a <abbr class="gp-term" title="a stand-in name: a ticket stands for a validator without saying which">pseudonym</abbr> for some validator which was agreed the privilege of authoring a block in the corresponding timeslot.

<a id="gp-6-p6"></a>In order to generate $\gamma_S$ while keeping the correspondence between tickets and validators anonymous, we use a novel RingVRF cryptographic scheme built on the Bandersnatch curve. This scheme allows validators to provide a proof which simultaneously: (1) guarantees the author controlled a key within the validator key sequence, and (2) produces an <abbr class="gp-term" title="nobody, not even its maker, can steer the value">unbiasable</abbr> deterministic hash output, giving us a secure verifiable random function (VRF). This anonymous VRF output is the *<abbr class="gp-term" title="a ticket's 32-byte random id, the output of its ring proof; lower wins">ticket identifier</abbr>*. Validators submit their tickets throughout the epoch, accumulating them in $\gamma_A$. The tickets with the best scores are then selected to populate the next epoch's slot-sealer sequence $\gamma_S$, determining which validator may author a block in each corresponding timeslot.

:::

Two kinds of cryptography carry this, and you can treat both as black boxes:

- a *VRF* signature: a signature with a random output nobody can choose;
- a *ring* VRF proof: the same, but anonymous within a set of keys.

[Cryptography we use](../cryptography.md) says where they come from.

Here is the cycle on real blocks: the official `safrole` trace, 100 tiny blocks, an epoch a
row. Epochs 0 to 2 collect too few tickets, so the fallback seals the epochs after them.
Epoch 3 fills its lottery at slot 45, the block at slot 46 announces the winners, and
epoch 4 is sealed by tickets, as are 5 and 6. Epoch 6 collects only 9, so epoch 7 falls
back. Tap any slot.

<SafroleTimeline />

**Builds on** [Part 4 · Blocks](../04-blocks/index.md), [Part 5 · Hashing and
signatures](../05-hashing-and-signatures/index.md), [Part 6 · State and
Merklization](../06-state-and-merklization/index.md) and [Part 7 · Time and
shuffling](../07-time-and-shuffling/index.md), and on the foundations every part uses,
[Parts 0 to 2](../index.md#lessons).

## At a glance

The whole part on one map. Boxes are what your client holds, and rounded cards are the
steps between them; a dashed card happens outside your client. Tap any card, or walk
through them in order with *next*.

<PartFlow :part="8" />

**Starting here?** At the repo root, `npm run catch-up -- 7.2` makes your client the one
this part starts from; [How to read it](../index.md#how-to-read-it) says more.

- [8.1 Stirring the entropy](./01-stirring-the-entropy.md)
- [8.2 Rotating the validators](./02-rotating-the-validators.md)
- [8.3 The fallback sealers](./03-the-fallback-sealers.md)
- [8.4 The lottery's winners](./04-the-lotterys-winners.md)
- [8.5 One step of Safrole](./05-one-step-of-safrole.md)
- [8.6 The VRF output](./06-the-vrf-output.md)
- [8.7 Entering tickets](./07-entering-tickets.md)
- [8.8 The ring root](./08-the-ring-root.md)
- [8.9 Seals](./09-seals.md)

## In the Gray Paper

Open **§6, *Block Production and Chain Growth***, the Safrole section, from §6.2 on (§6.1's
clock is [Part 7](../07-time-and-shuffling/index.md)'s), and **Appendix G, *Bandersnatch VRF***,
for the two signature kinds it uses.

| The paper says | We say | The vectors say |
| --- | --- | --- |
| γ ≡ (γ_P pending set, γ_Z epoch root, γ_S slot-sealer sequence, γ_A ticket accumulator) | the next validators, the ring root, the sealers, the lottery | `gamma_k`, `gamma_z`, `gamma_s`, `gamma_a` |
| η, four hashes: η₀ the entropy accumulator, η₁ to η₃ the last three epochs' values | the entropy and its history | `eta` |
| H_E epoch mark, H_W winners mark, H_V VRF signature, H_S seal; Y, the slot the lottery closes (500); 𝒴, a VRF output | the two marks, the entropy source, the seal; slot 10 on tiny; a ticket's id | `epoch_mark`, `tickets_mark`, `entropy_source`, `seal` |
| Z, outside-in ordering; F, the fallback key sequence | seating the winners; the fallback sealers | |

Its defining lines, (6.3) and the slot-sealer rule (6.25), each explained symbol by symbol
in [8.A](./gray-paper.md) with every other formula of the part:

::: gray-paper-eq 6.3

<a id="ex-6-3"></a>The Gray Paper's (6.3), [in its place in the paper's words](./05-one-step-of-safrole.md#eq-6-3):

$$
\begin{align}
\gamma &\equiv \!\left\lgroup
\gamma_P,\,
\gamma_Z,\,
\gamma_S,\,
\gamma_A
\right\rgroup\! \tag{6.3}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-safrole" class="gk-wrap">$\gamma$</span> | gamma | Safrole's state: the ticket lottery for who seals the next epoch's blocks |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-tuple">$\!\left\lgroup x\right\rgroup\!$</span> | the tuple of | a record: named fields, each with its type, like an object in JSON |
| <span id="gk-pendingset" class="gk-wrap">$\gamma_P$</span> | gamma P | the pending validators: the key sets that become active at the next epoch |
| <span id="gk-epochroot" class="gk-wrap">$\gamma_Z$</span> | gamma Z | the ring root of the pending validators' Bandersnatch keys: 144 bytes a ticket's proof is checked against |
| <span id="gk-sealtickets" class="gk-wrap">$\gamma_S$</span> | gamma S | the slot sealers: one entry for each of the epoch's E slots, a winning ticket or, in the fallback, a Bandersnatch key |
| <span id="gk-ticketaccumulator" class="gk-wrap">$\gamma_A$</span> | gamma A | the ticket lottery: the best tickets entered so far for the next epoch, at most E, lowest id first |

</details>

:::

::: gray-paper-eq 6.25

<a id="ex-6-25"></a>The Gray Paper's (6.25), [in its place in the paper's words](./04-the-lotterys-winners.md#eq-6-25):

$$
\begin{align}
\gamma_S' &\equiv \begin{cases}
Z(\gamma_A) &\text{if } e' = e + 1 \wedge m \geq \mathsf{Y} \wedge \left\vert\gamma_A\right\vert = \mathsf{E}\!\!\\
\gamma_S &\text{if } e' = e \\
F(\eta'_2, \kappa') \!\!\!&\text{otherwise}
\end{cases} \tag{6.25}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-wedge">$\wedge$</span> | and | both sides are true |
| <span id="gk-geq">$\geq$</span> | is at least | greater than or equal to |
| <span id="gk-Cepochtailstart" class="gk-wrap">$\mathsf{Y}$</span> | Y | the slot of an epoch at which the ticket lottery closes: 500 on full, 10 on tiny |
| <span id="gk-len">$\left\vert x\right\vert$</span> | the size of | \|x\|: how many items x has, or how many bytes |
| <span id="gk-Cepochlen" class="gk-wrap">$\mathsf{E}$</span> | E | an epoch's length in slots: 600 on full, 12 on tiny |
| <span id="gk-entropy" class="gk-wrap">$\eta$</span> | eta | entropy: four 32-byte values of randomness, the newest mixing in every block |
| <span id="gk-activeset" class="gk-wrap">$\kappa$</span> | kappa | the current validators: the keys of the V validators active this epoch |

</details>

:::

Read it aloud: "gamma is the tuple of gamma P, gamma Z, gamma S and gamma A: the next
validators, their ring root, the sealers and the lottery. The new sealers are: the
lottery's winners, seated outside in, if this block is in the next epoch, the last block
was at or past the lottery's close, and the lottery is full; unchanged, if the epoch hasn't
turned; otherwise the fallback, picked from the entropy η′₂ and the new validators." Three
cases, in that order of preference: [8.4](./04-the-lotterys-winners.md) builds the first,
[8.3](./03-the-fallback-sealers.md) the third, and [8.5](./05-one-step-of-safrole.md) puts
them together.

**Test yourself:** [Ch. 6 Block Production and Chain Growth (Safrole)](https://abutlabs.github.io/jam-learning/lasair/exam.html?chapter=ch06-safrole),
self-test cards on JAM learning.
