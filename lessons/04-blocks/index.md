# Part 4 · Blocks

**In one sentence:** this Part builds the codec for a whole JAM block, the header and the
five lists of things a block brings in from outside, and checks it against the official
vectors.

By the end of this part your client reads any JAM block, at either size, and can show you
every byte of it. Checking one is [Part 5](../05-hashing-and-signatures/index.md)'s job.

## The big picture

A block is what the chain adds in one slot. It is a header, the cover page, and an
*extrinsic*: five bags of things from the outside world.

Everything in a block was made before the block, by someone else. Your client only reads
and checks. Who made each bag, and where:

| Bag | Made by | Where | Checked in |
| --- | --- | --- | --- |
| tickets | a validator entering next epoch's lottery | off the chain, with a ring proof from its key | [Part 8](../08-safrole/index.md) |
| preimages | anyone holding bytes a service asked for | off the chain | [14.1](../14-services/01-providing-preimages.md) |
| guarantees | a core's three guarantors | in-core: the work, then their signatures | [Part 12](../12-guarantees/index.md) |
| assurances | each validator, for the shards it holds | off the chain, one per validator | [Part 11](../11-assurances/index.md) |
| disputes | validators who audited a report and voted | off the chain, after re-running the work | [Part 10](../10-disputes/index.md) |

The header is the slot's author's, who also puts the five bags together. [What runs
where](../what-runs-where.md) draws the whole journey.

This Part encodes all of it, piece by piece: the bags, then the header, then the block.

**Builds on** [Part 3 · Work and reports](../03-work-and-reports/index.md), and on the
foundations every part uses, [Parts 0 to 2](../index.md#lessons).

## How much a block carries

Every block has all five bags, always in the same order. Each holds only what that block
needs, and often nothing:

| Bag | A block holds | In the traces |
| --- | --- | --- |
| tickets | 0 to 3 on tiny, 0 to 16 on full; none once the lottery closes, at slot 10 of 12 (500 of 600) | 0 to 2 |
| preimages | any number, each one data a service asked for | 0 to 10 |
| guarantees | 0 to 2 on tiny, 0 to 341 on full: one per core | 0 to 2 |
| assurances | 0 to 6 on tiny, 0 to 1,023 on full: one per validator | 0 to 6 |
| disputes | 0 to 16 each of verdicts, culprits and faults (§10) | none |

The traces are 1,000 real tiny blocks. All 100 of the fallback trace's carry nothing: an
empty extrinsic is 7 bytes of `00`, a count of 0 for each of its seven lists (disputes
holds three).

## At a glance

Here is a whole block, the tiny test vector's: the header, then the extrinsic's five
bags. It's a codec vector, so it fills every bag to show them all; a real block rarely
does. Tap any part, down to its bytes.

<BlockParcel />

And the order this part builds those pieces in, lesson by lesson. Boxes are what your
client holds, rounded cards the steps between them.

<PartFlow :part="4" />

**Starting here?** At the repo root, `npm run catch-up -- 3.3` makes your client the one
this part starts from; [How to read it](../index.md#how-to-read-it) says more.

- [4.1 Tickets and preimages](./01-tickets-and-preimages.md)
- [4.2 Tiny and full](./02-tiny-and-full.md)
- [4.3 Guarantees](./03-guarantees.md)
- [4.4 Disputes](./04-disputes.md)
- [4.5 Maybe, and exactly n](./05-maybe-and-exactly-n.md)
- [4.6 The header](./06-the-header.md)
- [4.7 The block](./07-the-block.md)

## In the Gray Paper

Open **§4.1, *The Block***, **§5, *The Header***, and **Appendix C, *Serialization Codec*** for the byte order.

| The paper says | We say | The vectors say |
| --- | --- | --- |
| block 𝐁 = (𝐇, 𝐄); extrinsic 𝐄 = (E_T tickets, E_D disputes, E_P preimages, E_A assurances, E_G guarantees, which §4.1 calls *reports*) | the header and the five bags | `header`, `extrinsic.tickets`, `disputes`, `preimages`, `assurances`, `guarantees` |
| header fields H_P parent, H_R prior state root, H_X extrinsic hash, H_T timeslot, H_E epoch mark, H_W winners mark, H_O offenders mark, H_I author index, H_V VRF signature, H_S seal | the same, calling H_V the entropy source | `parent`, `parent_state_root`, `extrinsic_hash`, `slot`, `epoch_mark`, `tickets_mark`, `offenders_mark`, `author_index`, `entropy_source`, `seal` |

Its defining lines, (4.2), (4.3) and (5.1), each explained symbol by symbol in
[4.A](./gray-paper.md), with every other formula this part quotes:

::: gray-paper-eq 4.2

<a id="ex-4-2"></a>The Gray Paper's (4.2), (4.3), [in its place in the paper's words](../19-block-import/04-importing-a-block.md#eq-4-2):

$$
\begin{align}
\mathbf{B} &\equiv \left(\mathbf{H}, \mathbf{E}\right) \tag{4.2} \\
\mathbf{E} &\equiv \left(\mathbf{E}_T, \mathbf{E}_D, \mathbf{E}_P, \mathbf{E}_A, \mathbf{E}_G\right) \tag{4.3}
\end{align}
$$

<details class="gp-key"><summary>Its symbols</summary>

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

::: gray-paper-eq 5.1

<a id="ex-5-1"></a>The Gray Paper's (5.1), [in its place in the paper's words](./06-the-header.md#eq-5-1):

$$
\begin{equation}
\mathbf{H} \equiv \left(\mathbf{H}_{P}, \mathbf{H}_{R}, \mathbf{H}_{X}, \mathbf{H}_{T}, \mathbf{H}_{E}, \mathbf{H}_{W}, \mathbf{H}_{O}, \mathbf{H}_{I}, \mathbf{H}_{V}, \mathbf{H}_{S}\right) \tag{5.1}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk--parent">$P$</span> | P | a header's parent hash: 𝐇_P is the hash of the header before it, 32 bytes |
| <span id="gk--priorstateroot">$R$</span> | R | a header's prior state root: 𝐇_R is the root of the state before this block, 32 bytes |
| <span id="gk--extrinsichash">$X$</span> | X | a header's extrinsic hash: 𝐇_X stands for the block's five bags, 32 bytes |
| <span id="gk--timeslot">$T$</span> | T | a header's timeslot: 𝐇_T is the slot this block was made for |
| <span id="gk--epochmark">$E$</span> | E | a header's epoch mark: 𝐇_E, at an epoch's first block only, the next epoch's entropy and validator keys |
| <span id="gk--winnersmark">$W$</span> | W | a header's winning-tickets mark: 𝐇_W, at most once an epoch, a ticket for every slot of the next (12 on tiny, 600 on full) |
| <span id="gk--offendersmark">$O$</span> | O | a header's offenders mark: 𝐇_O, the Ed25519 keys of the validators this block convicts |
| <span id="gk--authorindex">$I$</span> | I | a header's author index: 𝐇_I, which validator made the block, a position in κ′ |
| <span id="gk--vrfsig">$V$</span> | V | a header's VRF signature: 𝐇_V, 96 bytes of the author's fresh randomness; the vectors' entropy source |
| <span id="gk--sealsig">$S$</span> | S | a header's seal: 𝐇_S, the author's 96-byte Bandersnatch signature on the rest of the header |

</details>

:::

Read it aloud: "a block is a header and an extrinsic; the extrinsic is the tickets, the
disputes, the preimages, the assurances and the guarantees. The header is the tuple of H
sub P, H sub R, H sub X, H sub T, H sub E, H sub W, H sub O, H sub I, H sub V and H sub
S."

The paper's order of the bags here is not the encoding's: Appendix C writes tickets,
preimages, guarantees, assurances, disputes, which is what [4.7](./07-the-block.md)
decodes. The same goes for the header: the paper lists the seal last and the author index
before the two signatures, and Appendix C writes the author index, the entropy source,
the offenders, then the seal. When an interviewer points at (5.1), say the fields; when
they point at a byte dump, say Appendix C.

**Test yourself:** [Ch. 5 The Header](https://abutlabs.github.io/jam-learning/lasair/exam.html?chapter=ch05-header),
self-test cards on JAM learning.
