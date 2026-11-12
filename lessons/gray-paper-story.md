# The Gray Paper's own story

Optional, and no code. Before its first rule and after its last, the Gray Paper tells a
story: what JAM is for, what came before it and why that wasn't enough, how fast it
might be, and what is still left to do. This page quotes that story whole, the Abstract,
§1, §2 and §20 to §22, with a few words of ours before each part. Read it as you'd read
the "why" section of a design doc: the arguments are the authors', and where they reach
past what the rules show, this page says so.

## What JAM is, in one breath

The Abstract, in short: JAM wants to be one shared computer, as Ethereum is, that
anyone can put a program on (a service), with the heavy work spread across many
machines, as Polkadot does. The work is split in two: in-core, done by a few validators
and checked later, and on the chain, done by every validator. You pay for time on a core,
coretime, the way you pay for gas on Ethereum.

If you build web services: one database everyone writes to, with a fleet of stateless
workers in front of it doing the heavy lifting. [What runs where](./what-runs-where.md)
draws the split.

::: gray-paper abstract

#### Abstract {#gp-abstract}

<a id="gp-abstract-p1"></a>We present a comprehensive and formal definition of JAM, a protocol combining elements of both *Polkadot* and *Ethereum*. In a single coherent model, JAM provides a global singleton permissionless object environment—much like the smart-contract environment pioneered by Ethereum—paired with secure sideband computation parallelized over a scalable node network, a proposition pioneered by Polkadot.

<a id="gp-abstract-p2"></a>JAM introduces a decentralized hybrid system offering smart-contract functionality structured around a secure and scalable <abbr class="gp-term" title="done by a core's guarantors, off the chain; the chain only sees the result">in-core</abbr>/on-chain dualism. While the smart-contract functionality implies some similarities with Ethereum's paradigm, the overall model of the service offered is driven largely by underlying architecture of Polkadot.

<a id="gp-abstract-p3"></a>JAM is permissionless in nature, allowing anyone to deploy code as a service on it for a fee commensurate with the resources this code utilizes and to induce execution of this code through the procurement and allocation of *core-time*, a metric of resilient and ubiquitous computation, somewhat similar to the purchasing of gas in Ethereum. We already envision a Polkadot-compatible *CoreChains* service.

:::

## Why it exists

§1.1 says where JAM comes from: it is meant to be what Polkadot becomes, and its name comes
from the last two steps of collect, refine, join, accumulate, the path every piece of work takes. §1.2
says what it wants: five goals, of which the first two (can't be stopped, can run any
program) are taken for granted, and the next two, fast and coherent, pull against each
other.

::: gray-paper 1.1

#### §1.1 Nomenclature {#gp-1-1}

<a id="gp-1-1-p1"></a>In this paper, we introduce a decentralized, crypto-economic protocol to which the Polkadot Network will transition itself in a major revision on the basis of approval by its governance apparatus.

<a id="gp-1-1-p2"></a>An early, unrefined, version of this protocol was first proposed in Polkadot Fellowship RFC31, known as *CoreJam*. CoreJam takes its name after the collect/refine/join/accumulate model of computation at the heart of its service proposition. While the CoreJam RFC suggested an incomplete, scope-limited alteration to the Polkadot protocol, JAM refers to a complete and coherent overall blockchain protocol.

:::

::: gray-paper 1.2

#### §1.2 Driving Factors {#gp-1-2}

<a id="gp-1-2-p1"></a>Within the realm of blockchain and the wider Web3, we are driven by the need first and foremost to deliver resilience. A proper Web3 digital system should honor a declared service profile—and ideally meet even perceived expectations—regardless of the desires, wealth or power of any economic actors including individuals, organizations and, indeed, other Web3 systems. Inevitably this is aspirational, and we must be pragmatic over how perfectly this may really be delivered. Nonetheless, a Web3 system should aim to provide such radically strong guarantees that, for practical purposes, the system may be described as *unstoppable*.

<a id="gp-1-2-p2"></a>While Bitcoin is, perhaps, the first example of such a system within the economic domain, it was not general purpose in terms of the nature of the service it offered. A rules-based service is only as useful as the generality of the rules which may be conceived and placed within it. Bitcoin's rules allowed for an initial use-case, namely a fixed-issuance token, ownership of which is well-approximated and autonomously enforced through knowledge of a secret, as well as some further elaborations on this theme.

<a id="gp-1-2-p3"></a>Later, Ethereum would provide a categorically more general-purpose rule set, one which was practically Turing complete.<sup>1</sup> In the context of Web3 where we are aiming to deliver a massively multiuser application platform, generality is crucial, and thus we take this as a given.

<small class="gp-note"><sup>1</sup> The gas mechanism did restrict what programs can execute on it by placing an upper bound on the number of steps which may be executed, but some restriction to avoid infinite-computation must surely be introduced in a permissionless setting.</small>

<a id="gp-1-2-p4"></a>Beyond resilience and generality, things get more interesting, and we must look a little deeper to understand what our driving factors are. For the present purposes, we identify three additional goals:

<a id="gp-1-2-p5"></a>

1. Resilience: highly resistant from being stopped, corrupted and censored.
1. Generality: able to perform Turing-complete computation.
1. Performance: able to perform computation quickly and at low cost.
1. Coherency: the causal relationship possible between different elements of state and thus how well individual applications may be composed.
1. Accessibility: negligible barriers to innovation; easy, fast, cheap and permissionless.

<a id="gp-1-2-p6"></a>As a declared Web3 technology, we make an implicit assumption of the first two items. Interestingly, items [3](#gp-1-2-p5) and [4](#gp-1-2-p5) are antagonistic according to an information theoretic principle which we are sure must already exist in some form but are nonetheless unaware of a name for it. For argument's sake we shall name it *<abbr class="gp-term" title="the bigger a system's state, the slower its parts can see each other's changes">size-coherency antagonism</abbr>*.

:::

## The trade-off at its heart

Coherent means one part of the state can see and react to another right away, as one
contract calling another does on Ethereum. §1.3's argument: the more state a system holds,
the further apart its pieces sit, and the longer news takes to travel between them, so a
big system drifts out of step with itself.

If you build web services, you've met this. One database is coherent: a transaction sees
everything. Split into shards across regions it scales, but a write in one shard reaches another
only by an asynchronous message. Most chains scale the second way, by splitting into
pieces that talk slowly. JAM's answer is a pipeline: a wide, mostly independent stage
(the cores) feeding one narrow stage that sees everything (accumulation, on the chain).
The delay is bounded by the length of the pipeline, not left open.

::: gray-paper 1.3

#### §1.3 Scaling under Size-Coherency Antagonism {#gp-1-3}

<a id="gp-1-3-p1"></a>Size-coherency antagonism is a simple principle implying that as the state-space of information systems grow, then the system necessarily becomes less coherent. It is a direct implication of principle that causality is limited by speed. The maximum speed allowed by physics is $C$ the speed of light in a vacuum, however other information systems may have lower bounds: In biological system this is largely determined by various chemical processes whereas in electronic systems is it determined by the speed of electrons in various substances. Distributed software systems will tend to have much lower bounds still, being dependent on a substrate of software, hardware and packet-switched networks of varying reliability.

<a id="gp-1-3-p2"></a>The argument goes:

<a id="gp-1-3-p3"></a>

1. The more state a system utilizes for its data-processing, the greater the amount of space this state must occupy.
1. The more space used, then the greater the mean and variance of distances between state-components.
1. As the mean and variance increase, then time for causal resolution (i.e. all correct implications of an event to be felt) becomes divergent across the system, causing incoherence.

<a id="gp-1-3-p4"></a>Setting the question of overall security aside for a moment, we can manage incoherence by fragmenting the system into causally-independent subsystems, each of which is small enough to be coherent. In a resource-rich environment, a bacterium may split into two rather than growing to double its size. This pattern is rather a crude means of dealing with incoherency under growth: intra-system processing has low size and total coherence, inter-system processing supports higher overall sizes but without coherence. It is the principle behind meta-networks such as Polkadot, Cosmos and the predominant vision of a scaled Ethereum (all to be discussed in depth shortly). Such systems typically rely on asynchronous and simplistic communication with “settlement areas” which provide a small-scoped coherent state-space to manage specific interactions such as a token transfer.

<a id="gp-1-3-p5"></a>The present work explores a middle-ground in the antagonism, avoiding the persistent fragmentation of state-space of the system as with existing approaches. We do this by introducing a new model of computation which pipelines a highly scalable, *mostly coherent* element to a synchronous, fully coherent element. Asynchrony is not avoided, but we bound it to the length of the pipeline and substitute the crude partitioning we see in scalable systems so far with a form of “cache affinity” as it typically seen in multi-CPU systems with a shared RAM.

<a id="gp-1-3-p6"></a>Unlike with SNARK-based L2-blockchain techniques for scaling, this model draws upon crypto-economic mechanisms and inherits their low-cost and high-performance profiles and averts a bias toward centralization.

:::

§1.4 is the paper's table of contents in prose. [Reading the Gray
Paper](./reading-the-gray-paper.md#where-things-are) has the same map as a table, with the
Part of this tutorial that builds each section.

::: gray-paper 1.4

#### §1.4 Document Structure {#gp-1-4}

<a id="gp-1-4-p1"></a>We begin with a brief overview of present scaling approaches in blockchain technology in section [2](#gp-2-p1). In section [3](./reading-the-gray-paper.md#gp-3-p1) we define and clarify the notation from which we will draw for our formalisms.

<a id="gp-1-4-p2"></a>We follow with a broad overview of the protocol in section [4](./00-start/01-what-you-will-build.md#gp-4-p1) outlining the major areas including the Polkadot Virtual Machine (PVM), the consensus protocols Safrole and GRANDPA, the common clock and build the foundations of the formalism.

<a id="gp-1-4-p3"></a>We then continue with the full protocol definition split into two parts: firstly the correct on-chain state-transition formula helpful for all nodes wishing to validate the chain state, and secondly, in sections [14](./03-work-and-reports/index.md#gp-14-1-p1) and [19](./what-runs-where.md#gp-19-p1) the honest strategy for the off-chain actions of any actors who wield a validator key.

<a id="gp-1-4-p4"></a>The main body ends with a discussion over the performance characteristics of the protocol in section [20](#gp-20-1-p1) and finally conclude in section [21](#gp-21-p1).

<a id="gp-1-4-p5"></a>The appendix contains various additional material important for the protocol definition including the PVM in appendices [A](./15-the-pvm/03-the-machine.md#gp-A-1-p1) &amp; [B](./16-host-calls/index.md#gp-B-p1), <abbr class="gp-term" title="turning a value into bytes, so it can be hashed, signed or sent">serialization</abbr> and <abbr class="gp-term" title="hashing many values down to one root through a tree, so one 32-byte hash stands for them all">Merklization</abbr> in appendices [C](./02-codec/index.md#gp-C-1-p1) &amp; [D](./06-state-and-merklization/index.md#gp-D-p1) and cryptography in appendices [E](./06-state-and-merklization/gray-paper.md#gp-E-1-p1), [G](./08-safrole/06-the-vrf-output.md#gp-G-p1) &amp; [H](./cryptography.md#gp-H-p1). We finish with an index of terms which includes the values of all simple constant terms used in the work in appendix [I](./symbols.md#gp-I-1-1-p1), and close with the bibliography.

:::

## What came before

§2 compares JAM with four other ways to scale. Each subsection is an argument, not a
measurement of JAM, and the numbers in it are the ones the authors could cite in 2024; some
will have moved since. Read each for the one question it asks of the other design:

| § | Design | The paper's question of it |
| --- | --- | --- |
| 2.1 | Polkadot: parachains, each its own chain | its chains are isolated, and a slot takes a big deposit won at auction: who can join, and how do they compose? |
| 2.2 | Ethereum: one chain, scaled by roll-ups | many vendors' roll-ups, each with its own rules: does it add up to one system? |
| 2.2.1 | roll-ups proved with SNARKs | proving costs far more than running: can it ever be cheaper than checking by people with stake? |
| 2.3 | many chains with their own validators (Cosmos) | each chain is only as safe as its own validators: what stops one from dragging down the rest? |
| 2.4 | one very fast chain (Solana) | one code base and one machine's limits: what happens when either gives out? |

::: gray-paper 2

#### §2 Previous Work and Present Trends {#gp-2}

<a id="gp-2-p1"></a>In the years since the initial publication of the Ethereum *YP*, the field of blockchain development has grown immensely. Other than scalability, development has been done around underlying consensus algorithms, smart-contract languages and machines and overall state environments. While interesting, these latter subjects are mostly out scope of the present work since they generally do not impact underlying scalability.

:::

Polkadot first, because JAM borrows its security machinery, ELVES: the way a few
validators do work and the rest audit it, which [What runs
where](./what-runs-where.md#off-the-chain-in-the-gray-paper) quotes from §17. What JAM
changes is what's offered on top: not a slot for a whole chain, but time on a core for any
program.

::: gray-paper 2.1

#### §2.1 Polkadot {#gp-2-1}

<a id="gp-2-1-p1"></a>In order to deliver its service, JAM co-opts much of the same game-theoretic and cryptographic machinery as Polkadot known as ELVES and described by [Burdges et al. 2024](https://eprint.iacr.org/2024/961). However, major differences exist in the actual service offered with JAM, providing an abstraction much closer to the actual computation model generated by the validator nodes its economy incentivizes.

<a id="gp-2-1-p2"></a>It was a major point of the original Polkadot proposal, a scalable heterogeneous multichain, to deliver high-performance through partition and distribution of the workload over multiple host machines. In doing so it took an explicit position that composability would be lowered. Polkadot's constituent components, parachains are, practically speaking, highly isolated in their nature. Though a message passing system (XCMP) exists it is asynchronous, coarse-grained and practically limited by its reliance on a high-level slowly evolving interaction language XCM.

<a id="gp-2-1-p3"></a>As such, the composability offered by Polkadot between its constituent chains is lower than that of Ethereum-like smart-contract systems offering a single and universal object environment and allowing for the kind of agile and innovative integration which underpins their success. Polkadot, as it stands, is a collection of independent ecosystems with only limited opportunity for collaboration, very similar in ergonomics to bridged blockchains though with a categorically different security profile. A technical proposal known as SPREE would utilize Polkadot's unique shared-security and improve composability, though blockchains would still remain isolated.

<a id="gp-2-1-p4"></a>Implementing and launching a blockchain is hard, time-consuming and costly. By its original design, Polkadot limits the clients able to utilize its service to those who are both able to do this and raise a sufficient deposit to win an auction for a long-term slot, one of around 50 at the present time. While not permissioned per se, accessibility is categorically and substantially lower than for smart-contract systems similar to Ethereum.

<a id="gp-2-1-p5"></a>Enabling as many innovators to participate and interact, both with each other and each other's user-base, appears to be an important component of success for a Web3 application platform. Accessibility is therefore crucial.

:::

Ethereum next, defined in the Yellow Paper, whose style and notation the Gray Paper
follows. The argument is about roll-ups: each is a separate system with its own
rules for speed, safety and cost, and the paper doubts they will ever behave as one.

::: gray-paper 2.2

#### §2.2 Ethereum {#gp-2-2}

<a id="gp-2-2-p1"></a>The Ethereum protocol was formally defined in this paper's spiritual predecessor, the *Yellow Paper*, by Wood 2014. This was derived in large part from the initial concept paper by [Buterin 2013](https://github.com/ethereum/wiki/wiki/White-Paper). In the decade since the *YP* was published, the *de facto* Ethereum protocol and public network instance have gone through a number of evolutions, primarily structured around introducing flexibility via the transaction format and the instruction set and “precompiles” (niche, sophisticated bonus instructions) of its scripting core, the Ethereum virtual machine (EVM).

<a id="gp-2-2-p2"></a>Almost one million crypto-economic actors take part in the validation for Ethereum.<sup>1</sup> Block extension is done through a randomized leader-rotation method where the physical address of the leader is public in advance of their block production.<sup>2</sup> Ethereum uses Casper-FFG introduced by Buterin and Griffith 2019 to determine <abbr class="gp-term" title="the point after which a block can't be undone">finality</abbr>, which with the large validator base finalizes the chain extension around every 13 minutes.

<small class="gp-note"><sup>1</sup> Practical matters do limit the level of real decentralization. Validator software expressly provides functionality to allow a single instance to be configured with multiple key sets, systematically facilitating a much lower level of actual decentralization than the apparent number of actors, both in terms of individual operators and hardware. Using data collated by [Dune and hildobby 2024](https://dune.com/hildobby/eth2-staking) on Ethereum 2, one can see one major node operator, Lido, has steadily accounted for almost one-third of the almost one million crypto-economic participants.<br>
<sup>2</sup> Ethereum's developers hope to change this to something more secure, but no timeline is fixed.</small>

<a id="gp-2-2-p3"></a>Ethereum's direct computational performance remains broadly similar to that with which it launched in 2015, with a notable exception that an additional service now allows 1MB of *<abbr class="gp-term" title="a short hash that stands for some data, so the data can be checked against it later">commitment</abbr> data* to be hosted per block (all nodes to store it for a limited period). The data cannot be directly utilized by the main state-transition function, but special functions provide proof that the data (or some subsection thereof) is available. According to [Ethereum Foundation 2024](https://ethereum.org/en/roadmap/danksharding/), the present design direction is to improve on this over the coming years by splitting responsibility for its storage amongst the validator base in a protocol known as *Dank-sharding*.

<a id="gp-2-2-p4"></a>According to [Ethereum Foundation 2024](https://ethereum.org/en/roadmap/vision/), the scaling strategy of Ethereum would be to couple this data availability with a private market of *<abbr class="gp-term" title="chains whose results are posted to, and checked by, a main chain">roll-ups</abbr>*, sideband computation facilities of various design, with ZK-SNARK-based roll-ups being a stated preference. Each vendor's roll-up design, execution and operation comes with its own implications.

<a id="gp-2-2-p5"></a>One might reasonably assume that a diversified market-based approach for scaling via multivendor roll-ups will allow well-designed solutions to thrive. However, there are potential issues facing the strategy. A research report by [Sharma 2023](https://public.bnbstatic.com/static/files/research/ethereums-rollups-are-centralized-a-look-into-decentralized-sequencers.pdf) on the level of decentralization in the various roll-ups found a broad pattern of centralization, but notes that work is underway to attempt to mitigate this. It remains to be seen how decentralized they can yet be made.

<a id="gp-2-2-p6"></a>Heterogeneous communication properties (such as datagram latency and semantic range), security properties (such as the costs for reversion, corruption, stalling and censorship) and economic properties (the cost of accepting and processing some incoming message or transaction) may differ, potentially quite dramatically, between major areas of some grand patchwork of roll-ups by various competing vendors. While the overall Ethereum network may eventually provide some or even most of the underlying machinery needed to do the sideband computation it is far from clear that there would be a “grand consolidation” of the various properties should such a thing happen. We have not found any good discussion of the negative ramifications of such a fragmented approach.<sup>1</sup>

<small class="gp-note"><sup>1</sup> Some initial thoughts on the matter resulted in a proposal by [Sadana 2024](https://ethresear.ch/t/bringing-polkadot-tech-to-ethereum/17104) to utilize Polkadot technology as a means of helping create a modicum of compatibility between roll-up ecosystems!</small>

:::

SNARKs are proofs that a computation was done right, which anyone can check quickly
without redoing it. The paper's case against them is cost: one 2024 benchmark had making
the proof take over 61,000 times as long as just running the program. Compare like with
like here: that figure is the cost of *proving* one computation against *running* it once,
not a throughput of either network. JAM's alternative is to have the work redone by a few
staked validators, the auditors, and to punish a liar. [JAM beside Aztec](./jam-beside-aztec.md)
sets the two side by side on one real question.

::: gray-paper 2.2.1

#### §2.2.1 SNARK Roll-ups {#gp-2-2-1}

<a id="gp-2-2-1-p1"></a>While the protocol's foundation makes no great presuppositions on the nature of roll-ups, Ethereum's strategy for sideband computation does centre around SNARK-based rollups and as such the protocol is being evolved into a design that makes sense for this. SNARKs are the product of an area of exotic cryptography which allow proofs to be constructed to demonstrate to a neutral observer that the purported result of performing some predefined computation is correct. The complexity of the verification of these proofs tends to be sub-linear in their size of computation to be proven and will not give away any of the internals of said computation, nor any dependent witness data on which it may rely.

<a id="gp-2-2-1-p2"></a>ZK-SNARKs come with constraints. There is a trade-off between the proof's size, verification complexity and the computational complexity of generating it. Non-trivial computation, and especially the sort of general-purpose computation laden with binary manipulation which makes smart-contracts so appealing, is hard to fit into the model of SNARKs.

<a id="gp-2-2-1-p3"></a>To give a practical example, RISC-zero (as assessed by Bögli 2024) is a leading project and provides a platform for producing SNARKs of computation done by a RISC-V virtual machine, an open-source and succinct RISC machine architecture well-supported by tooling. A recent benchmarking report by [PolkaVM Project 2024](https://github.com/koute/risc0-benchmark/blob/master/README.md) showed that compared to RISC-zero's own benchmark, proof generation alone takes over 61,000 times as long as simply recompiling and executing even when executing on 32 times as many cores, using 20,000 times as much RAM and an additional state-of-the-art GPU. According to hardware rental agents <https://cloud-gpus.com/>, the cost multiplier of proving using RISC-zero is 66,000,000x of the cost<sup>1</sup> to execute using the PolkaVM recompiler.

<small class="gp-note"><sup>1</sup> In all likelihood actually substantially more as this was using low-tier “spare” hardware in consumer units, and our recompiler was unoptimized.</small>

<a id="gp-2-2-1-p4"></a>Many cryptographic primitives become too expensive to be practical to use and specialized algorithms and structures must be substituted. Often times they are otherwise suboptimal. In expectation of the use of SNARKs (such as PLONK as proposed by [Gabizon et al. 2019](https://eprint.iacr.org/2019/953)), the prevailing design of the Ethereum project's Dank-sharding availability system uses a form of erasure coding centered around polynomial commitments over a large prime field in order to allow SNARKs to get acceptably performant access to subsections of data. Compared to alternatives, such as a binary field and Merklization in the present work, it leads to a load on the validator nodes orders of magnitude higher in terms of CPU usage.

<a id="gp-2-2-1-p5"></a>In addition to their basic cost, SNARKs present no great escape from decentralization and the need for redundancy, leading to further cost multiples. While the need for some benefits of staked decentralization is averted through their verifiable nature, the need to incentivize multiple parties to do much the same work is a requirement to ensure that a single party not form a monopoly (or several not form a cartel). Proving an incorrect state-transition should be impossible, however service integrity may be compromised in other ways; a temporary suspension of proof-generation, even if only for minutes, could amount to major economic ramifications for real-time financial applications.

<a id="gp-2-2-1-p6"></a>Real-world examples exist of the pit of centralization giving rise to monopolies. One would be the aforementioned SNARK-based exchange framework; while notionally serving decentralized exchanges, it is in fact centralized with Starkware itself wielding a monopoly over enacting trades through the generation and submission of proofs, leading to a single point of failure—should Starkware's service become compromised, then the liveness of the system would suffer.

<a id="gp-2-2-1-p7"></a>It has yet to be demonstrated that SNARK-based strategies for eliminating the trust from computation will ever be able to compete on a cost-basis with a multi-party crypto-economic platform. All as-yet proposed SNARK-based solutions are heavily reliant on crypto-economic systems to frame them and work around their issues. Data availability and sequencing are two areas well understood as requiring a crypto-economic solution.

<a id="gp-2-2-1-p8"></a>We would note that SNARK technology is improving and the cryptographers and engineers behind them do expect improvements in the coming years. In a recent article by [Thaler 2023](https://a16zcrypto.com/posts/article/a-technical-faq-on-lasso-jolt-and-recent-advancements-in-snark-design/) we see some credible speculation that with some recent advancements in cryptographic techniques, slowdowns for proof generation could be as little as 50,000x from regular native execution and much of this could be parallelized. This is substantially better than the present situation, but still several orders of magnitude greater than would be required to compete on a cost-basis with established crypto-economic techniques such as ELVES.

:::

Chains that each bring their own validators (Cosmos, Avalanche) are cheap to add, but each
is only as safe as its own validator set. The paper weighs three fixes and picks the last,
ELVES: one validator set, split across the work, with auditing, and nothing final until
everything it depends on is checked.

::: gray-paper 2.3

#### §2.3 Fragmented Meta-Networks {#gp-2-3}

<a id="gp-2-3-p1"></a>Directions for general-purpose computation scalability taken by other projects broadly centre around one of two approaches; either what might be termed a *fragmentation* approach or alternatively a *centralization* approach. We argue that neither approach offers a compelling solution.

<a id="gp-2-3-p2"></a>The fragmentation approach is heralded by projects such as Cosmos (proposed by Kwon and Buchman 2019) and Avalanche (by Tanana 2019). It involves a system fragmented by networks of a homogenous consensus mechanic, yet staffed by separately motivated sets of validators. This is in contrast to Polkadot's single validator set and Ethereum's declared strategy of heterogeneous roll-ups secured partially by the same validator set operating under a coherent incentive framework. The homogeneity of said fragmentation approach allows for reasonably consistent messaging mechanics, helping to present a fairly unified interface to the multitude of connected networks.

<a id="gp-2-3-p3"></a>However, the apparent consistency is superficial. The networks are trustless only by assuming correct operation of their validators, who operate under a crypto-economic security framework ultimately conjured and enforced by economic incentives and punishments. To do twice as much work with the same levels of security and no special coordination between validator sets, then such systems essentially prescribe forming a new network with the same overall levels of incentivization.

<a id="gp-2-3-p4"></a>Several problems arise. Firstly, there is a similar downside as with Polkadot's isolated parachains and Ethereum's isolated roll-up chains: a lack of coherency due to a persistently sharded state preventing synchronous composability.

<a id="gp-2-3-p5"></a>More problematically, the scaling-by-fragmentation approach, proposed specifically by Cosmos, provides no homogenous security—and therefore trustlessness—guarantees. Validator sets between networks must be assumed to be independently selected and incentivized with no relationship, causal or probabilistic, between the Byzantine actions of a party on one network and potential for appropriate repercussions on another. Essentially, this means that should validators conspire to corrupt or revert the state of one network, the effects may be felt across other networks of the ecosystem.

<a id="gp-2-3-p6"></a>That this is an issue is broadly accepted, and projects propose for it to be addressed in one of two ways. Firstly, to fix the expected cost-of-attack (and thus level of security) across networks by drawing from the same validator set. The massively redundant way of doing this, as proposed by [Cosmos Project 2023](https://blog.cosmos.network/interchain-security-begins-a-new-era-for-cosmos-a2dc3c0be63) under the name *replicated security*, would be to require each validator to validate on all networks and for the same incentives and punishments. This is economically inefficient in the cost of security provision as each network would need to independently provide the same level of incentives and punishment-requirements as the most secure with which it wanted to interoperate. This is to ensure the economic proposition remain unchanged for validators and the security proposition remained equivalent for all networks. At the present time, replicated security is not a readily available permissionless service. We might speculate that these punishing economics have something to do with it.

<a id="gp-2-3-p7"></a>The more efficient approach, proposed by the OmniLedger team, [Kokoris-Kogias et al. 2017](https://eprint.iacr.org/2017/406), would be to make the validators non-redundant, partitioning them between different networks and periodically, securely and randomly repartitioning them. A reduction in the cost to attack over having them all validate on a single network is implied since there is a chance of having a single network accidentally have a compromising number of malicious validators even with less than this proportion overall. This aside it presents an effective means of scaling under a basis of weak-coherency.

<a id="gp-2-3-p8"></a>Alternatively, as in ELVES by [Burdges et al. 2024](https://eprint.iacr.org/2024/961), we may utilize non-redundant partitioning, combine this with a proposal-and-auditing game which validators play to weed out and punish invalid computations, and then require that the finality of one network be contingent on all causally-entangled networks. This is the most secure and economically efficient solution of the three, since there is a mechanism for being highly confident that invalid transitions will be recognized and corrected before their effect is <abbr class="gp-term" title="voted final by GRANDPA: never undone">finalized</abbr> across the ecosystem of networks. However, it requires substantially more sophisticated logic and their causal-entanglement implies some upper limit on the number of networks which may be added.

:::

The last design is one very fast chain on very big machines (Solana). The paper's two
objections: a protocol defined by one optimized code base falls over with it, and one
machine's memory and disk cap how far it can grow.

::: gray-paper 2.4

#### §2.4 High-Performance Fully Synchronous Networks {#gp-2-4}

<a id="gp-2-4-p1"></a>Another trend in the recent years of blockchain development has been to make “tactical” optimizations over data throughput by limiting the validator set size or diversity, focusing on software optimizations, requiring a higher degree of coherency between validators, onerous requirements on the hardware which validators must have, or limiting data availability.

<a id="gp-2-4-p2"></a>The Solana blockchain is underpinned by technology introduced by Yakovenko 2018 and boasts theoretical figures of over 700,000 transactions per second, though according to [Ng 2024](https://cointelegraph.com/magazine/blockchain-transactions-per-second-tps-stupid-big-questions/) the network is only seen processing a small fraction of this. The underlying throughput is still substantially more than most blockchain networks and is owed to various engineering optimizations in favor of maximizing synchronous performance. The result is a highly-coherent smart-contract environment with an API not unlike that of *YP* Ethereum (albeit using a different underlying VM), but with a near-instant time to inclusion and finality which is taken to be immediate upon inclusion.

<a id="gp-2-4-p3"></a>Two issues arise with such an approach: firstly, defining the protocol as the outcome of a heavily optimized codebase creates structural centralization and can undermine resilience. [Jha 2024](https://cointelegraph.com/news/solana-outage-client-diversity-beta) writes “since January 2022, 11 significant outages gave rise to 15 days in which major or partial outages were experienced”. This is an outlier within the major blockchains as the vast majority of major chains have no downtime. There are various causes to this downtime, but they are generally due to bugs found in various subsystems.

<a id="gp-2-4-p4"></a>Ethereum, at least until recently, provided the most contrasting alternative with its well-reviewed specification, clear research over its crypto-economic foundations and multiple clean-room implementations. It is perhaps no surprise that the network very notably continued largely unabated when a flaw in its most deployed implementation was found and maliciously exploited, as described by [Hertig 2016](https://www.coindesk.com/markets/2016/10/06/so-ethereums-blockchain-is-still-under-attack/).

<a id="gp-2-4-p5"></a>The second issue is concerning ultimate scalability of the protocol when it provides no means of distributing workload beyond the hardware of a single machine.

<a id="gp-2-4-p6"></a>In major usage, both historical transaction data and state would grow impractically. Solana illustrates how much of a problem this can be. Unlike classical blockchains, the Solana protocol offers no solution for the archival and subsequent review of historical data, crucial if the present state is to be proven correct from first principle by a third party. There is little information on how Solana manages this in the literature, but according to [Solana Foundation 2023](https://solana.com/news/solana-data-live-on-google-cloud-bigquery), nodes simply place the data onto a centralized database hosted by Google.<sup>1</sup>

<small class="gp-note"><sup>1</sup> Earlier node versions utilized Arweave network, a decentralized data store, but this was found to be unreliable for the data throughput which Solana required.</small>

<a id="gp-2-4-p7"></a>Solana validators are encouraged to install large amounts of RAM to help hold its large state in memory (512 GB is the current recommendation according to [Solana Labs 2024](https://docs.solanalabs.com/operations/requirements)). Without a divide-and-conquer approach, Solana shows that the level of hardware which validators can reasonably be expected to provide dictates the upper limit on the performance of a totally synchronous, coherent execution model. Hardware requirements represent barriers to entry for the validator set and cannot grow without sacrificing decentralization and, ultimately, transparency.

:::

## How fast it might be

§20 is the paper's estimate of what JAM can do: the hardware a validator needs, how its
time and bandwidth split, and comparisons with Polkadot and Ethereum. Three cautions
before the numbers:

- **These are models, not measurements.** The paper says so itself, near the end of
  §20.2.3. No JAM network ran them.
- **Name what bounds each number.** The 341 work-packages a slot are bounded by the
  cores: 1,023 validators in threes. The 85 times a single CPU core is the total compute of all
  cores at once, not how fast any one program runs. A transactions-per-second figure here
  assumes a particular design for the transfers, bounded first by the 48 KB a work-result
  may carry, not by compute.
- **Compare one step with the same step.** The Ethereum column is one chain's measured
  limits; the JAM columns are modelled. The marks † and ‡ in its last table say that a
  column's figures share one budget: on average each is a quarter (Ethereum) or a half
  (JAM) of the figure shown.

::: gray-paper 20.1

#### §20.1 Technical Characteristics {#gp-20-1}

<a id="gp-20-1-p1"></a>In total, with our stated target of 1,023 validators and three validators per core, along with requiring a mean of ten audits per validator per timeslot, and thus 30 audits per work-report, JAM is capable of trustlessly processing and integrating 341 work-packages per timeslot.

<a id="gp-20-1-p2"></a>We assume node hardware is a modern 16 core CPU with 64GB RAM, 8TB secondary storage and 0.5Gbe networking.

<a id="gp-20-1-p3"></a>Our performance models assume a rough split of CPU time as follows:

<a id="gp-20-1-p4"></a>

|  | *Proportion* |
| --- | --- |
| Audits | ${}^{10}\!/_{16}$ |
| Merklization | ${}^{1}\!/_{16}$ |
| Block execution | ${}^{2}\!/_{16}$ |
| GRANDPA and BEEFY | ${}^{1}\!/_{16}$ |
| Erasure coding | ${}^{1}\!/_{16}$ |
| Networking &amp; misc | ${}^{1}\!/_{16}$ |

<a id="gp-20-1-p5"></a>Estimates for network bandwidth requirements are as follows:

<a id="gp-20-1-p6"></a>

| Throughput, MB/slot | *Tx* | *Rx* |
| --- | --- | --- |
| Guaranteeing | 106 | 48 |
| Assuring | 144 | 13 |
| Auditing | 0 | 133 |
| Authoring | 53 | 87 |
| GRANDPA and BEEFY | 4 | 4 |
| **Total** | **304** | **281** |
| **Implied bandwidth**, Mb/s | **387** | **357** |

<a id="gp-20-1-p7"></a>Thus, a connection able to sustain 500Mb/s should leave a sufficient margin of error and headroom to serve other validators as well as some public connections, though the burstiness of block publication would imply validators are best to ensure that peak bandwidth is higher.

<a id="gp-20-1-p8"></a>Under these conditions, we would expect an overall network-provided data availability capacity of 2PB, with each node dedicating at most $6$TB to availability storage.

<a id="gp-20-1-p9"></a>Estimates for memory usage are as follows:

<a id="gp-20-1-p10"></a>

|  | GB |  |
| --- | --- | --- |
| Auditing | 20 | 2 $\times$ 10 PVM instances |
| Block execution | 2 | 1 PVM instance |
| State cache | 40 |  |
| Misc | 2 |  |
| **Total** | **64** |  |

<a id="gp-20-1-p11"></a>As a rough guide, each <abbr class="gp-term" title="a chain of its own whose blocks Polkadot's validators check, one core's worth at a time">parachain</abbr> has an average footprint of around 2MB in the Polkadot Relay chain; a 40GB state would allow 20,000 parachains' information to be retained in state.

<a id="gp-20-1-p12"></a>What might be called the “virtual hardware” of a JAM core is essentially a regular CPU core executing at somewhere between 25% and 50% of regular speed for the whole six-second portion and which may draw and provide 2MB/s average in general-purpose I/O and utilize up to 2GB in RAM. The I/O includes any trustless reads from the JAM chain state, albeit in the recent past. This virtual hardware also provides unlimited reads from a semi-static preimage-lookup database.

<a id="gp-20-1-p13"></a>Each work-package may occupy this hardware and execute arbitrary code on it in six-second segments to create some result of at most 48KB. This work-result is then entitled to 10ms on the same machine, this time with no “external” I/O, but instead with full and immediate access to the JAM chain state and may alter the service(s) to which the results belong.

:::

§20.1 ends with a picture of one core: a CPU core at a quarter to half
speed for six seconds, 2 MB/s of input and output, 2 GB of memory, producing at most 48 KB;
then that result gets 10 ms with the whole chain state. That is refine, then accumulate.

::: gray-paper 20.2

#### §20.2 Illustrating Performance {#gp-20-2}

<a id="gp-20-2-p1"></a>In terms of pure processing power, the JAM machine architecture can deliver extremely high levels of homogeneous trustless computation. However, the core model of JAM is a classic parallelized compute architecture, and for solutions to be able to utilize the architecture well they must be designed with it in mind to some extent. Accordingly, until such use-cases appear on JAM with similar semantics to existing ones, it is very difficult to make direct comparisons to existing systems. That said, if we indulge ourselves with some assumptions then we can make some crude comparisons.

:::

::: gray-paper 20.2.1

#### §20.2.1 Comparison to Polkadot {#gp-20-2-1}

<a id="gp-20-2-1-p1"></a>Polkadot is at present capable of validating at most 80 parachains each doing one second of native computation and 5MB of I/O in every six. This corresponds to an aggregate compute performance of around 13x native CPU and a total 24-hour distributed availability of around 67MB/s. Accumulation is beyond Polkadot's capabilities and so not comparable.

<a id="gp-20-2-1-p2"></a>For comparison, in our basic models, JAM should be capable of attaining around 85x the computation load of a single native CPU core and a distributed availability of 682MB/s.

:::

::: gray-paper 20.2.2

#### §20.2.2 Simple Transfers {#gp-20-2-2}

<a id="gp-20-2-2-p1"></a>We might also attempt to model a simple transactions-per-second amount, with each transaction requiring a signature verification and the modification of two account balances. Once again, until there are clear designs for precisely how this would work we must make some assumptions. Our most naive model would be to use the JAM cores (i.e.  refinement) simply for transaction verification and account lookups. The JAM chain would then hold and alter the balances in its state. This is unlikely to give great performance since almost all the needed I/O would be synchronous, but it can serve as a basis.

<a id="gp-20-2-2-p2"></a>A 12MB work-package can hold around 96k transactions at 128 bytes per transaction. However, a 48KB work-result could only encode around 6k account updates when each update is given as a pair of a 4 byte account index and 4 byte balance, resulting in a limit of 3k transactions per package, or 171k TPS in total. It is possible that the eight bytes could typically be compressed by a byte or two, increasing maximum throughput a little. Our expectations are that state updates, with highly parallelized Merklization, can be done at between 500k and 1 million reads/write per second, implying around 250k-350k TPS, depending on which turns out to be the bottleneck.

<a id="gp-20-2-2-p3"></a>A more sophisticated model would be to use the JAM cores for balance updates as well as transaction verification. We would have to assume that state and the transactions which operate on them can be partitioned between work-packages with some degree of efficiency, and that the 12MB of the work-package would be split between transaction data and state witness data. Our basic models predict that a 32-bit account system paginated into $2^{10}$ accounts/page and 128 bytes per transaction could, assuming only around 1% of oraclized accounts were useful, average upwards of 1.4mTPS depending on partitioning and usage characteristics. Partitioning could be done with a fixed fragmentation (essentially sharding state), a rotating partition pattern or a dynamic partitioning (which would require specialized sequencing).

<a id="gp-20-2-2-p4"></a>Interestingly, we expect neither model to be bottlenecked in computation, meaning that transactions could be substantially more sophisticated, perhaps with more flexible cryptography or smart-contract functionality, without a significant impact on performance.

:::

::: gray-paper 20.2.3

#### §20.2.3 Computation Throughput {#gp-20-2-3}

<a id="gp-20-2-3-p1"></a>The TPS metric does not lend itself well to measuring distributed systems' computational performance, so we now turn to another slightly more compute-focussed benchmark: the EVM. The basic *YP* Ethereum network, now approaching a decade old, is probably the best known example of general purpose decentralized computation and makes for a reasonable yardstick. It is able to sustain a computation and I/O rate of 1.25M gas/sec, with a peak throughput of twice that. The EVM gas metric was designed to be a time-proportional metric for predicting and constraining program execution. Attempting to determine a concrete comparison to PVM throughput is non-trivial and necessarily opinionated owing to the disparity between the two platforms, including word size, endianness, stack/register architecture and memory model. However, we will attempt to determine a reasonable range of values.

<a id="gp-20-2-3-p2"></a>EVM gas does not directly translate into native execution as it also combines state reads and writes as well as transaction input data, implying it is able to process some combination of up to 595 storage reads, 57 storage writes and 1.25M computation-gas as well as 78KB input data in each second, trading one against the other.<sup>1</sup> We cannot find any analysis of the typical breakdown between storage I/O and pure computation, so to make a very conservative estimate, we assume it does all four. In reality, we would expect it to be able to do on average 1/4 of each.

<small class="gp-note"><sup>1</sup> The latest “proto-danksharding” changes allow it to accept 87.3KB/s in committed-to data though this is not directly available within state, so we exclude it from this illustration, though including it with the input data would change the results little.</small>

<a id="gp-20-2-3-p3"></a>Our experiments<sup>1</sup> show that on modern, high-end consumer hardware with a high-quality EVM implementation, we can expect somewhere between 100 and 500 gas/µs in throughput on pure-compute workloads (we specifically utilized Odd-Product, Triangle-Number and several implementations of the Fibonacci calculation). To make a conservative comparison to PVM, we propose transpilation of the EVM code into PVM code and then re-execution of it under the PolkaVM prototype.<sup>2</sup>

<small class="gp-note"><sup>1</sup> This is detailed at <https://hackmd.io/@XXX9CM1uSSCWVNFRYaSB5g/HJarTUhJA> and intended to be updated as we get more information.<br>
<sup>2</sup> It is conservative since we don't take into account that the source code was originally compiled into EVM code and thus the PVM machine code will replicate architectural artifacts and thus is very likely to be pessimistic. As an example, all arithmetic operations in EVM are 256-bit and 64-bit native PVM is being forced to honor this even if the source code only actually required 64-bit values.</small>

<a id="gp-20-2-3-p4"></a>To help estimate a reasonable lower-bound of EVM gas/µs, e.g.  for workloads which are more memory and I/O intensive, we look toward real-world permissionless deployments of the EVM and see that the Moonbeam network, after correcting for the slowdown of executing within the recompiled WebAssembly platform on the somewhat conservative Polkadot hardware platform, implies a throughput of around 100 gas/µs. We therefore assert that in terms of computation, 1µs approximates to around 100-500 EVM gas on modern high-end consumer hardware.<sup>1</sup>

<small class="gp-note"><sup>1</sup> We speculate that the substantial range could possibly be caused in part by the major architectural differences between the EVM ISA and typical modern hardware.</small>

<a id="gp-20-2-3-p5"></a>Benchmarking and regression tests show that the prototype PVM engine has a fixed preprocessing overhead of around 5ns/byte of program code and, for arithmetic-heavy tasks at least, a marginal factor of 1.6-2% compared to EVM execution, implying an asymptotic speedup of around 50-60x. For machine code 1MB in size expected to take of the order of a second to compute, the compilation cost becomes only 0.5% of the overall time. <sup>1</sup> For code not inherently suited to the 256-bit EVM ISA, we would expect substantially improved relative execution times on PVM, though more work must be done in order to gain confidence that these speed-ups are broadly applicable.

<small class="gp-note"><sup>1</sup> As an example, our odd-product benchmark, a very much pure-compute arithmetic task, execution takes 58s on EVM, and 1.04s within our PVM prototype, including all preprocessing.</small>

<a id="gp-20-2-3-p6"></a>If we allow for preprocessing to take up to the same component within execution as the marginal cost (owing to, for example, an extremely large but short-running program) and for the PVM metering to imply a safety overhead of 2x to execution speeds, then we can expect a JAM core to be able to process the equivalent of around 1,500 EVM gas/µs. Owing to the crudeness of our analysis we might reasonably predict it to be somewhere within a factor of three either way—i.e.  500-5,000 EVM gas/µs.

<a id="gp-20-2-3-p7"></a>JAM cores are each capable of 2MB/s bandwidth, which must include any state I/O and data which must be newly introduced (e.g.  transactions). While writes come at comparatively little cost to the core, only requiring hashing to determine an eventual updated Merkle root, reads must be witnessed, with each one costing around 640 bytes of witness conservatively assuming a one-million entry binary Merkle trie. This would result in a maximum of a little over 3k reads/second/core, with the exact amount dependent upon how much of the bandwidth is used for newly introduced input data.

<a id="gp-20-2-3-p8"></a>Aggregating everything across JAM, excepting accumulation which could add further throughput, numbers can be multiplied by 341 (with the caveat that each one's computation cannot interfere with any of the others' except through state oraclization and accumulation). Unlike for *roll-up chain* designs such as Polkadot and Ethereum, there is no need to have persistently fragmented state. Smart-contract state may be held in a coherent format on the JAM chain so long as any updates are made through the 8KB/core/sec work-results, which would need to contain only the hashes of the altered contracts' state roots.

<a id="gp-20-2-3-p9"></a>Under our modelling assumptions, we can therefore summarize:

<a id="gp-20-2-3-p10"></a>

|  | Eth. L1 | JAM Core | JAM |
| --- | --- | --- | --- |
| Compute (EVM gas/µs) | $1.25^\dagger$ | 500-5,000 | 0.15-1.5M |
| State writes (s$^{-1}$) | $57^\dagger$ | n/a | n/a |
| State reads (s$^{-1}$) | $595^\dagger$ | 4K${}^\ddagger$ | 1.4M${}^\ddagger$ |
| Input data (s$^{-1}$) | 78KB${}^\dagger$ | 2MB${}^\ddagger$ | 682MB${}^\ddagger$ |

<a id="gp-20-2-3-p11"></a>What we can see is that JAM's overall predicted performance profile implies it could be comparable to many thousands of that of the basic Ethereum L1 chain. The large factor here is essentially due to three things: spacial parallelism, as JAM can host several hundred cores under its security apparatus; temporal parallelism, as JAM targets continuous execution for its cores and pipelines much of the computation between blocks to ensure a constant, optimal workload; and platform optimization by using a VM and gas model which closely fits modern hardware architectures.

<a id="gp-20-2-3-p12"></a>It must however be understood that this is a provisional and crude estimation only. It is included only for the purpose of expressing JAM's performance in tangible terms. Specifically, it does not take into account:

<a id="gp-20-2-3-p13"></a>

- that these numbers are based on real performance of Ethereum and performance modelling of JAM (though our models are based on real-world performance of the components);
- any L2 scaling which may be possible with either JAM or Ethereum;
- the state partitioning which uses of JAM would imply;
- the as-yet unfixed gas model for the PVM;
- that PVM/EVM comparisons are necessarily imprecise;
- (${}^\dagger$) all figures for Ethereum L1 are drawn from the same resource: on average each figure will be only ${}^{1}\!/_{4}$ of this maximum.
- (${}^\ddagger$) the state reads and input data figures for JAM are drawn from the same resource: on average each figure will be only ${}^{1}\!/_{2}$ of this maximum.

<a id="gp-20-2-3-p14"></a>We leave it as further work for an empirical analysis of performance and an analysis and comparison between JAM and the aggregate of a hypothetical Ethereum ecosystem which included some maximal amount of L2 deployments together with full Dank-sharding and any other additional consensus elements which they would require. This, however, is out of scope for the present work.

:::

## Where it ends

§21 sums up in one name: collect, refine, join, accumulate. The paper defines the
on-chain half, join and accumulate, which is the half your client builds. §21.1 lists what
is still open, and it is worth knowing when someone asks what JAM can't do yet: how fast
it really is, synchronous calls between services, a networking protocol.

::: gray-paper 21

#### §21 Conclusion {#gp-21}

<a id="gp-21-p1"></a>We have introduced a novel computation model which is able to make use of pre-existing crypto-economic mechanisms in order to deliver major improvements in scalability without causing persistent state-fragmentation and thus sacrificing overall cohesion. We call this overall pattern collect-refine-join-accumulate. Furthermore, we have formally defined the on-chain portion of this logic, essentially the join-accumulate portion. We call this protocol the JAM chain.

<a id="gp-21-p2"></a>We argue that the model of JAM provides a novel “sweet spot”, allowing for massive amounts of computation to be done in secure, resilient consensus compared to fully-synchronous models, and yet still have strict guarantees about both timing and integration of the computation into some singleton state machine unlike persistently fragmented models.

:::

One line of §21.1 reads older than the rest: its last paragraph says validator
performance isn't tracked on the chain yet, while §13 of the same version keeps a tally for every validator
on the chain, and [Part 18](./18-statistics/index.md) builds it. Treat that sentence as
left over from an earlier version.

::: gray-paper 21.1

#### §21.1 Further Work {#gp-21-1}

<a id="gp-21-1-p1"></a>While we are able to estimate theoretical computation possible given some basic assumptions and even make broad comparisons to existing systems, practical numbers are invaluable. We believe the model warrants further empirical research in order to better understand how these theoretical limits translate into real-world performance. We feel a proper cost analysis and comparison to pre-existing protocols would also be an excellent topic for further work.

<a id="gp-21-1-p2"></a>We can be reasonably confident that the design of JAM allows it to host a service under which Polkadot *parachains* could be validated, however further prototyping work is needed to understand the possible throughput which a PVM-powered metering system could support. We leave such a report as further work. Likewise, we have also intentionally omitted details of higher-level protocol elements including cryptocurrency, <abbr class="gp-term" title="time on a core, bought ahead: the right to have work run there for a while">coretime</abbr> sales, staking and regular smart-contract functionality.

<a id="gp-21-1-p3"></a>A number of potential alterations to the protocol described here are being considered in order to make practical utilization of the protocol easier. These include:

<a id="gp-21-1-p4"></a>

- Synchronous calls between services in accumulate.
- Restrictions on the `transfer` function in order to allow for substantial parallelism over accumulation.
- The possibility of reserving substantial additional computation capacity during accumulate under certain conditions.
- Introducing Merklization into the Work Package format in order to obviate the need to have the whole package downloaded in order to evaluate its authorization.

<a id="gp-21-1-p5"></a>The networking protocol is also left intentionally undefined at this stage and its description must be done in a follow-up proposal.

<a id="gp-21-1-p6"></a>Validator performance is not presently tracked on-chain. We do expect this to be tracked on-chain in the final revision of the JAM protocol, but its specific format is not yet certain and it is therefore omitted at present.

:::

## Who it thanks

§22 names the people behind the pieces: ELVES, Safrole, the PVM, and the merklization and
I/O design from the PolkaJam team. Safrole, it says, is a simplification of Sassafras.

::: gray-paper 22

#### §22 Acknowledgements {#gp-22}

<a id="gp-22-p1"></a>Much of this present work is based in large part on the work of others. The Web3 Foundation research team and in particular Alistair Stewart and Jeff Burdges are responsible for ELVES, the security apparatus of Polkadot which enables the possibility of in-core computation for JAM. The same team is responsible for Sassafras, GRANDPA and BEEFY.

<a id="gp-22-p2"></a>Safrole is a mild simplification of Sassafras and was made under the careful review of Davide Galassi and Alistair Stewart.

<a id="gp-22-p3"></a>The original CoreJam RFC was refined under the review of Bastian Köcher and Robert Habermeier and most of the key elements of that proposal have made their way into the present work.

<a id="gp-22-p4"></a>The PVM is a formalization of a partially simplified *PolkaVM* software prototype, developed by Jan Bujak. Cyrill Leutwiler contributed to the empirical analysis of the PVM reported in the present work.

<a id="gp-22-p5"></a>The *PolkaJam* team and in particular Arkadiy Paronyan, Emeric Chevalier and Dave Emett have been instrumental in the design of the lower-level aspects of the JAM protocol, especially concerning Merklization and I/O.

<a id="gp-22-p6"></a>Numerous contributors to the repository since publication have helped correct errors. Thank you to all.

<a id="gp-22-p7"></a>And, of course, thanks to the awesome Lemon Jelly, a.k.a. Fred Deakin and Nick Franglen, for three of the most beautiful albums ever produced, the cover art of the first of which was inspiration for this paper's background art.

:::

Ready to build? [Start here](./index.md).
