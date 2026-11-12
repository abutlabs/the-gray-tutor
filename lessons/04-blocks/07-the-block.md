# The block

**In one sentence:** a block is a header and then an extrinsic, back to back: everything
the chain adds in one slot.

Here is a whole block as a strip, each part as wide as its bytes. Tap a part for where it
sits and what the trace names there. Then switch to full and watch the header and the
disputes swallow the rest.

<a id="try-it"></a>

<BlockStrip />

## The idea

You have a header ([lesson 4.6](./06-the-header.md)) and all five parts of an extrinsic
([lessons 4.1](./01-tickets-and-preimages.md) to [4.4](./04-disputes.md)). What is left
to make a [*block*](../glossary.md#block)?

Almost nothing. A block is the cover page and then the five lists, one after another.
Think of pages stapled together with no dividers between them. There is no table of
contents and no length in front of any part.

So how does a reader know where the header stops and the tickets start? Each part ends
where its own rule says it ends. A list says how many items it has, or the network's size
says it. The decoder never has to look ahead.

One thing carries over from the parts. Two of them change shape with the size of the
network: the assurances' bitfield and the header's tickets mark. So the block's codec
takes the configuration too.

This lesson is short on purpose: two little records, and then your client reads real JAM
blocks, at both sizes, and passes every codec vector.

## What the Gray Paper says

§4 says a block B is a header H and an extrinsic E, and the extrinsic is its five parts.
Appendix C's *Block Serialization* is the byte order of all of it, the whole of this
Part on one page:

::: gray-paper C.2

#### Appendix C.2 Block Serialization {#gp-C-2}

<a id="gp-C-2-p1"></a>A block $\mathbf{B}$ is serialized as a tuple of its elements in regular order, as implied in equations [4.2](../19-block-import/04-importing-a-block.md#eq-4-2), [4.3](../19-block-import/04-importing-a-block.md#eq-4-3) and [5.1](./06-the-header.md#eq-5-1). For the header, we define both the regular <abbr class="gp-term" title="turning a value into bytes, so it can be hashed, signed or sent">serialization</abbr> and the unsigned serialization $\mathcal{E}_{U}$. Formally:

<a id="gp-C-2-p2"></a><a id="eq-C-16"></a><a id="eq-C-17"></a><a id="eq-C-18"></a><a id="eq-C-19"></a><a id="eq-C-20"></a><a id="eq-C-21"></a><a id="eq-C-22"></a><a id="eq-C-23"></a><a id="eq-C-24"></a><a id="eq-C-25"></a><a id="eq-C-26"></a><a id="eq-C-27"></a><a id="eq-C-28"></a><a id="eq-C-29"></a><a id="eq-C-30"></a><a id="eq-C-31"></a><a id="eq-C-32"></a><a id="eq-C-33"></a><a id="eq-C-34"></a><a id="eq-C-35"></a><a id="eq-C-36"></a><a id="eq-C-37"></a>

$$
\begin{align}
\mathcal{E}_{}\left(\mathbf{B}\right) &= \mathcal{E}_{}\left(
\mathbf{H},
\mathcal{E}_{T}\left(\mathbf{E}_T\right),
\mathcal{E}_{P}\left(\mathbf{E}_P\right),
\mathcal{E}_{G}\left(\mathbf{E}_G\right),
\mathcal{E}_{A}\left(\mathbf{E}_A\right),
\mathcal{E}_{D}\left(\mathbf{E}_D\right)
\right) \tag{C.16} \\
\mathcal{E}_{T}\left(\mathbf{E}_T\right) &= \mathcal{E}_{}\left(
\left\updownarrow\left[
\left(\mathcal{E}_{1}\left(e\right), p\right)
\;\middle\vert\;
\left(e, p\right) \mathrel{\unicode{x2B40}} \mathbf{E}_T
\right]\right.\!\right) \tag{C.17} \\
\mathcal{E}_{P}\left(\mathbf{E}_P\right) &= \mathcal{E}_{}\left(
\left\updownarrow\left[
\left(\mathcal{E}_{4}\left(s\right), \left\updownarrow\mathbf{d}\right.\!\right)
\;\middle\vert\;
\left(s, \mathbf{d}\right) \mathrel{\unicode{x2B40}} \mathbf{E}_P
\right]\right.\!\right) \tag{C.18} \\
\mathcal{E}_{G}\left(\mathbf{E}_G\right) &= \mathcal{E}_{}\left(\left\updownarrow\mathbf{E}_G\right.\!\right) \tag{C.19} \\
\mathcal{E}_{A}\left(\mathbf{E}_A\right) &= \mathcal{E}_{}\left(
\left\updownarrow\left[
\left(a, f, \mathcal{E}_{2}\left(v\right), s\right)
\;\middle\vert\;
\left(a, f, v, s\right) \mathrel{\unicode{x2B40}} \mathbf{E}_A
\right]\right.\!\right) \tag{C.20} \\
\mathcal{E}_{D}\left(\left(\mathbf{v}, \mathbf{c}, \mathbf{f}\right)\right) &= \mathcal{E}_{}\left(
\left\updownarrow\left[
\left(r, \mathcal{E}_{4}\left(a\right),
\left\updownarrow\left[
\left(v, \mathcal{E}_{2}\left(i\right), s\right)
\;\middle\vert\;
\left(v, i, s\right) \mathrel{\unicode{x2B40}} \mathbf{j}
\right]
\right.\!\right)
\;\middle\vert\;
\left(r, a, \mathbf{j}\right) \mathrel{\unicode{x2B40}} \mathbf{v}
\right]\right.\!,
\left\updownarrow\mathbf{c}\right.\!,
\left\updownarrow\mathbf{f}\right.\!
\right) \tag{C.21} \\
\mathcal{E}_{}\left(\mathbf{H}\right) &= \mathcal{E}_{}\left(
\mathcal{E}_{U}\left(\mathbf{H}\right),
\mathbf{H}_{S}
\right) \tag{C.22} \\
\mathcal{E}_{U}\left(\mathbf{H}\right) &= \mathcal{E}_{}\left(
\mathbf{H}_{P},
\mathbf{H}_{R},
\mathbf{H}_{X},
\mathcal{E}_{4}\left(\mathbf{H}_{T}\right),
\mathcal{E}_{E}\left(\mathbf{H}_{E}\right),
\mathord{\unicode{xBF}}\mathbf{H}_{W},
\mathcal{E}_{2}\left(\mathbf{H}_{I}\right),
\mathbf{H}_{V},
\left\updownarrow\mathbf{H}_{O}\right.\!
\right) \tag{C.23} \\
\mathcal{E}_{E}\left(\emptyset\right) &= \mathcal{E}_{}\left(0\right) \tag{C.24} \\
\mathcal{E}_{E}\left(\left(\eta_0, \eta_1, \mathbf{k}\right)\right) &= \mathcal{E}_{}\left(1, \eta_0, \eta_1, \left\updownarrow\mathbf{k}\right.\!\right) \tag{C.25} \\
\mathcal{E}_{}\left(\mathbf{x} \in \mathbb{C}\right) &\equiv \mathcal{E}_{}\left(
\mathbf{x}_{a},
\mathcal{E}_{4}\left(\mathbf{x}_{n}\right),
\mathbf{x}_{s},
\mathbf{x}_{b},
\mathbf{x}_{l},
\mathcal{E}_{4}\left(\mathbf{x}_{t}\right),
\mathbf{x}_{r},
\left\updownarrow\mathbf{x}_{\mathbf{p}}\right.\!
\right) \tag{C.26} \\
\mathcal{E}_{}\left(\mathbf{x} \in \mathbb{Y}\right) &\equiv \mathcal{E}_{}\left(
\mathbf{x}_{p},
\mathcal{E}_{4}\left(\mathbf{x}_{l}\right),
\mathbf{x}_{u},
\mathcal{E}_{2}\left(\mathbf{x}_{v}\right),
\mathbf{x}_{e},
\mathcal{E}_{2}\left(\mathbf{x}_{n}\right)
\right) \tag{C.27} \\
\mathcal{E}_{}\left(\mathbf{d} \in \mathbb{D}\right) &\equiv \mathcal{E}_{}\left(
\mathcal{E}_{4}\left(\mathbf{d}_{s}\right),
\mathbf{d}_{c},
\mathbf{d}_{y},
\mathcal{E}_{8}\left(\mathbf{d}_{g}\right),
O\left(\mathbf{d}_{\mathbf{l}}\right),
\mathbf{d}_{u},
\mathbf{d}_{i},
\mathbf{d}_{x},
\mathbf{d}_{z},
\mathbf{d}_{e}
\right) \tag{C.28} \\
\mathcal{E}_{}\left(\mathbf{r} \in \mathbb{R}\right) &\equiv \mathcal{E}_{}\left(
\mathbf{r}_{\mathbf{s}},
\mathbf{r}_{\mathbf{c}},
\mathbf{r}_{c},
\mathbf{r}_{a},
\mathbf{r}_{g},
\left\updownarrow\mathbf{r}_{\mathbf{t}}\right.\!,
\left\updownarrow\mathbf{r}_{\mathbf{l}}\right.\!,
\left\updownarrow\mathbf{r}_{\mathbf{d}}\right.\!
\right) \tag{C.29} \\
\mathcal{E}_{}\left(\mathbf{g} \in \mathbb{G}\right) &\equiv \mathcal{E}_{}\left(
\mathbf{g}_{\mathbf{r}},
\mathcal{E}_{4}\left(\mathbf{g}_{t}\right),
\left\updownarrow\left[\left(\mathcal{E}_{2}\left(v\right), s\right) \;\middle\vert\; \left(v, s\right) \mathrel{\unicode{x2B40}} \mathbf{g}_{a}\right]\right.\!
\right) \tag{C.30} \\
\mathcal{E}_{}\left(\mathbf{p} \in \mathbb{P}\right) &\equiv \mathcal{E}_{}\left(
\mathcal{E}_{4}\left(\mathbf{p}_{h}\right),
\mathbf{p}_{u},
\mathbf{p}_{\mathbf{c}},
\left\updownarrow\mathbf{p}_{\mathbf{j}}\right.\!,
\left\updownarrow\mathbf{p}_{\mathbf{f}}\right.\!,
\left\updownarrow\mathbf{p}_{\mathbf{w}}\right.\!
\right) \tag{C.31} \\
\mathcal{E}_{}\left(\mathbf{w} \in \mathbb{W}\right) &\equiv \mathcal{E}_{}\left(
\mathcal{E}_{4}\left(\mathbf{w}_{s}\right),
\mathbf{w}_{c},
\mathcal{E}_{8}\left(\mathbf{w}_{g}\right),
\mathcal{E}_{8}\left(\mathbf{w}_{a}\right),
\mathcal{E}_{2}\left(\mathbf{w}_{e}\right),
\left\updownarrow\mathbf{w}_{\mathbf{y}}\right.\!,
\left\updownarrow I^\#\left(\mathbf{w}_{\mathbf{i}}\right)\right.\!,
\left\updownarrow\left[
\left(h, \mathcal{E}_{4}\left(i\right)\right)
\;\middle\vert\;
\left(h, i\right) \mathrel{\unicode{x2B40}} \mathbf{w}_{\mathbf{x}}
\right]\right.\!
\right) \tag{C.32} \\
\mathcal{E}_{}\left(x \in \mathbb{T}\right) &\equiv \mathcal{E}_{}\left(
x_{y},
\mathcal{E}_{1}\left(x_{e}\right)
\right) \tag{C.33} \\
\mathcal{E}_{}\left(x \in \mathbb{X}\right) &\equiv \mathcal{E}_{}\left(
1,
\mathcal{E}_{4}\left(x_{s}\right),
\mathcal{E}_{4}\left(x_{d}\right),
\mathcal{E}_{8}\left(x_{a}\right),
x_{m},
\mathcal{E}_{8}\left(x_{g}\right)
\right) \tag{C.34} \\
\mathcal{E}_{}\left(\mathbf{x} \in \mathbb{U}\right) &\equiv \mathcal{E}_{}\left(
0,
\mathbf{x}_{p},
\mathbf{x}_{e},
\mathbf{x}_{a},
\mathbf{x}_{y},
\mathbf{x}_{g},
O\left(\mathbf{x}_{\mathbf{l}}\right),
\left\updownarrow\mathbf{x}_{\mathbf{t}}\right.\!
\right) \tag{C.35} \\
O\left(o \in \mathbb{E} \cup \mathbb{B}_{}\right) &\equiv \begin{cases}
\left(0, \left\updownarrow o\right.\!\right) &\text{if } o \in \mathbb{B}_{} \\
1 &\text{if } o = \infty \\
2 &\text{if } o = \unicode{x21AF} \\
3 &\text{if } o = \circledcirc \\
4 &\text{if } o = \circleddash \\
5 &\text{if } o = \texttt{BAD} \\
6 &\text{if } o = \texttt{BIG}
\\
\end{cases} \tag{C.36} \\
I\left(\left(
h \in \mathbb{H}_{} \cup \mathbb{H}_{}^\boxplus,
i \in \mathbb{N}_{2^{15}}
\right)\right) &\equiv \begin{cases}
\left(h, \mathcal{E}_{2}\left(i\right)\right) &\text{if } h \in \mathbb{H}_{}\\
\left(r, \mathcal{E}_{2}\left(i + 2^{15}\right)\right) &\text{if } \exists r \in \mathbb{H}_{}, h = r^\boxplus\\
\end{cases} \tag{C.37}
\end{align}
$$

<details class="gp-key"><summary>Its symbols, in plain words</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-encode">[$\mathcal{E}\left(x\right)$](../symbols.md#encode)</span> | E of | the encoding of what's in the brackets: its bytes, by Appendix C's rules |
| <span id="gk-block" class="gk-wrap">[$\mathbf{B}$](../symbols.md#block)</span> | B | a block: its header and its extrinsic |
| <span id="gk-header" class="gk-wrap">$\mathbf{H}$</span> | H | a block header: the parent's hash, the slot, the seals and markers |
| <span id="gk-encodetickets">$\mathcal{E}_{T}\left(x\right)$</span> | E sub T of | the tickets bag's bytes: its length, then each ticket's attempt (1 byte) and 784-byte proof |
| <span id="gk-xttickets" class="gk-wrap">$\mathbf{E}_T$</span> | E sub T | the tickets bag: entries to the block-sealing lottery |
| <span id="gk-encodepreimages">$\mathcal{E}_{P}\left(x\right)$</span> | E sub P of | the preimages bag's bytes: its length, then each one's service (4 bytes) and its data with its length |
| <span id="gk-xtpreimages" class="gk-wrap">$\mathbf{E}_P$</span> | E sub P | the preimages bag: data a service asked for |
| <span id="gk-encodeguarantees">$\mathcal{E}_{G}\left(x\right)$</span> | E sub G of | the guarantees bag's bytes: its length, then each guarantee |
| <span id="gk-xtguarantees" class="gk-wrap">$\mathbf{E}_G$</span> | E sub G | the guarantees bag: work-reports with their guarantors' signatures, one per core at most |
| <span id="gk-encodeassurances">$\mathcal{E}_{A}\left(x\right)$</span> | E sub A of | the assurances bag's bytes: its length, then each one's anchor, bitfield, validator index (2 bytes) and signature |
| <span id="gk-xtassurances" class="gk-wrap">$\mathbf{E}_A$</span> | E sub A | the assurances bag: validators saying they hold their pieces of reports |
| <span id="gk-encodedisputes">$\mathcal{E}_{D}\left(x\right)$</span> | E sub D of | the disputes bag's bytes: the verdicts, the culprits and the faults, each list with its length in front |
| <span id="gk-xtdisputes" class="gk-wrap">$\mathbf{E}_D$</span> | E sub D | the disputes bag: verdicts, culprits and faults |
| <span id="gk-var">[$\left\updownarrow x\right.\!$](../symbols.md#length-prefix)</span> | with its length | ↕x: x with its length in front, as a compact natural |
| <span id="gk-sq">[$\left[x\right]$](../symbols.md#sequence)</span> | the sequence | a sequence written out item by item; [ ] is the empty one |
| <span id="gk-build">$\left\{ x \;\middle\vert\; y \right\}$</span> | for each, such that | built by a rule: the left-hand value, for every case the right-hand side allows (a set, or a sequence in order) |
| <span id="gk-xt-entryindex">$e$</span> | e | an entered ticket's attempt number, 0 to n − 1: which of its maker's tickets this is |
| <span id="gk-xt-proof">$p$</span> | p | an entered ticket's ring proof: 784 bytes proving a pending validator made it, without saying which |
| <span id="gk-orderedin">$\mathrel{\unicode{x2B40}}$</span> | in order, from | each item of the sequence, in its order |
| <span id="gk-xp-serviceindex">$s$</span> | s | a preimage's service: the id of the service that asked for it, 4 bytes |
| <span id="gk-xp-data" class="gk-wrap">$\mathbf{d}$</span> | d | a preimage's data: the bytes themselves |
| <span id="gk-xa-anchor">$a$</span> | a | an assurance's anchor: the parent block's header hash |
| <span id="gk-xa-availabilities">$f$</span> | f | an assurance's bitfield: one bit per core, 1 for "I hold my piece of its data" |
| <span id="gk-xa-assurer">$v$</span> | v | the assuring validator's index in κ |
| <span id="gk-xv-reporthash">$r$</span> | r | the hash of the work-report on trial |
| <span id="gk-xvj-judgeindex">$i$</span> | i | the judge's index in the validator set the verdict's epoch picks |
| <span id="gk-xv-judgments" class="gk-wrap">$\mathbf{j}$</span> | bold j | a verdict's judgments: the judges' signed votes, two thirds of the judges plus one |
| <span id="gk-encodeunsignedheader">$\mathcal{E}_{U}\left(x\right)$</span> | E sub U of | the header's bytes without its seal: what the seal signs |
| <span id="gk--sealsig">$S$</span> | S | a header's seal: 𝐇_S, the author's 96-byte Bandersnatch signature on the rest of the header |
| <span id="gk--parent">$P$</span> | P | a header's parent hash: 𝐇_P is the hash of the header before it, 32 bytes |
| <span id="gk--priorstateroot">$R$</span> | R | a header's prior state root: 𝐇_R is the root of the state before this block, 32 bytes |
| <span id="gk--extrinsichash">$X$</span> | X | a header's extrinsic hash: 𝐇_X stands for the block's five bags, 32 bytes |
| <span id="gk--timeslot">$T$</span> | T | a header's timeslot: 𝐇_T is the slot this block was made for |
| <span id="gk-encodeepochmark">$\mathcal{E}_{E}\left(x\right)$</span> | E sub E of | the epoch mark's bytes: 0 if there is none; else 1, two entropy hashes and the keys with their length |
| <span id="gk--epochmark">$E$</span> | E | a header's epoch mark: 𝐇_E, at an epoch's first block only, the next epoch's entropy and validator keys |
| <span id="gk-maybe">$\mathord{\unicode{xBF}}x$</span> | maybe | ¿x: the byte 0 if x is nothing (∅), or the byte 1 and then x |
| <span id="gk--winnersmark">$W$</span> | W | a header's winning-tickets mark: 𝐇_W, at most once an epoch, a ticket for every slot of the next (12 on tiny, 600 on full) |
| <span id="gk--authorindex">$I$</span> | I | a header's author index: 𝐇_I, which validator made the block, a position in κ′ |
| <span id="gk--vrfsig">$V$</span> | V | a header's VRF signature: 𝐇_V, 96 bytes of the author's fresh randomness; the vectors' entropy source |
| <span id="gk--offendersmark">$O$</span> | O | a header's offenders mark: 𝐇_O, the Ed25519 keys of the validators this block convicts |
| <span id="gk-none" class="gk-wrap">$\emptyset$</span> | nothing | ∅: no value at all, like null |
| <span id="gk-entropyaccumulator" class="gk-wrap">$\eta_0$</span> | eta zero | the entropy accumulator: 32 bytes that every block's VRF output is hashed into |
| <span id="gk-entropy" class="gk-wrap">$\eta$</span> | eta | entropy: four 32-byte values of randomness, the newest mixing in every block |
| <span id="gk-wcX" class="gk-wrap">$\mathbf{x}$</span> | x | a refinement context: the anchor block and the lookup anchor a package was made against, and its prerequisites |
| <span id="gk-in">[$\in$](../symbols.md#in)</span> | in | belongs to: x ∈ ℕ says x is a whole number; in a type line, the value's type |
| <span id="gk-workcontext" class="gk-wrap">$\mathbb{C}$</span> | C | the set of refinement contexts: the recent blocks a package was built against, and the packages it needs first |
| <span id="gk-equiv">[$\equiv$](../symbols.md#defined-as)</span> | is defined as | the left side is, by definition, the right: a definition, not a test |
| <span id="gk-wc-anchortime">$n$</span> | n | the anchor block's timeslot |
| <span id="gk-wc-anchoraccoutlog">$b$</span> | b | the anchor block's accumulation-output super-peak, the belt's root (`beefy_root`) |
| <span id="gk-wc-lookupanchorhash">$l$</span> | l | the lookup anchor's header hash: the block whose state code is fetched from |
| <span id="gk-wc-lookupanchortime">$t$</span> | t | the lookup anchor's timeslot: at most L = 14,400 slots old |
| <span id="gk-wc-prerequisites" class="gk-wrap">$\mathbf{p}$</span> | p | a context's prerequisites: hashes of packages that must be accumulated first |
| <span id="gk-avspec" class="gk-wrap">$\mathbb{Y}$</span> | Y | the set of availability specifications: package hash, bundle length, erasure root, shard count, segments root, segment count |
| <span id="gk-as-erasureroot">$u$</span> | u | the erasure root: one Merkle root over every validator's shard of the bundle and the exports |
| <span id="gk-workdigest" class="gk-wrap">$\mathbb{D}$</span> | D | the set of work-digests: one item's result card, with its service, hashes, gas limit, result and load |
| <span id="gk-wd-codehash">$c$</span> | c | the service's code hash as the guarantors saw it; it must match the chain's |
| <span id="gk-wd-payloadhash">$y$</span> | y | the hash of the item's payload |
| <span id="gk-wd-gaslimit">$g$</span> | g | the gas the item's accumulation may use (`accumulate_gas`) |
| <span id="gk-encoderesult">$O\left(x\right)$</span> | O of | a work result's bytes: 0 then the output with its length, or one byte from 1 to 6 naming the error |
| <span id="gk-wd-result" class="gk-wrap">$\mathbf{l}$</span> | l | the result: the bytes refine returned, or one of six errors |
| <span id="gk-wd-xtcount">$x$</span> | x | how many extrinsic blobs the item used |
| <span id="gk-wd-xtsize">$z$</span> | z | those extrinsics' total size, in bytes |
| <span id="gk-wrX" class="gk-wrap">$\mathbf{r}$</span> | r | a work-report |
| <span id="gk-workreport" class="gk-wrap">$\mathbb{R}$</span> | R | the set of work-reports: a core's signed receipt for one work-package |
| <span id="gk-wr-avspec" class="gk-wrap">$\mathbf{s}$</span> | bold s | a report's availability spec: the package's hash, its bundle's length, and the roots of its pieces and of the segments it exports |
| <span id="gk-wr-context" class="gk-wrap">$\mathbf{c}$</span> | c | a report's refinement context: the blocks its package was built against, and its prerequisites |
| <span id="gk-wr-authtrace" class="gk-wrap">$\mathbf{t}$</span> | t | the authorizer's trace: the blob its code returned when it said yes (`auth_output`) |
| <span id="gk-gX" class="gk-wrap">$\mathbf{g}$</span> | g | a guarantee |
| <span id="gk-guarantee" class="gk-wrap">$\mathbb{G}$</span> | G | the set of guarantees: a work-report, the slot it was made at, and two or three guarantors' signatures |
| <span id="gk-workpackage" class="gk-wrap">$\mathbb{P}$</span> | P | the set of work-packages: up to 16 work-items for one core, with their authorizer and context |
| <span id="gk-wp-authcodehost">$h$</span> | h | the service whose preimages hold the authorizer's code (`auth_code_host`) |
| <span id="gk-wp-authconfig" class="gk-wrap">$\mathbf{f}$</span> | f | the authorizer's configuration blob, its settings (`authorizer_config`) |
| <span id="gk-wp-workitems" class="gk-wrap">$\mathbf{w}$</span> | w | the package's work-items: 1 to 16 |
| <span id="gk-workitem" class="gk-wrap">$\mathbb{W}$</span> | W | the set of work-items: one job for one service, with its payload, gas limits, imports, extrinsics and export count |
| <span id="gk-wi-payload" class="gk-wrap">$\mathbf{y}$</span> | y | the item's payload: the input its refine reads |
| <span id="gk-encodeimportrefs">$I^\#\left(x\right)$</span> | I hash of | each import reference encoded with I, one after another |
| <span id="gk-wi-importsegments" class="gk-wrap">$\mathbf{i}$</span> | i | the segments the item imports: each a segments root (or a package hash) and an index |
| <span id="gk-safroleticket" class="gk-wrap">$\mathbb{T}$</span> | T | a ticket: a 32-byte id, and which of its maker's tries it was (its attempt) |
| <span id="gk-defxfer" class="gk-wrap">$\mathbb{X}$</span> | X | a deferred transfer: (source, destination, amount, memo, gas), the money moved now, the receiver run in the next round |
| <span id="gk-dx-dest">$d$</span> | d | a transfer's receiver: the service it goes to |
| <span id="gk-dx-memo">$m$</span> | m | a transfer's memo: 128 bytes the sender writes for the receiver's code |
| <span id="gk-operandtuple" class="gk-wrap">$\mathbb{U}$</span> | U | an operand: what accumulate is told about one work-digest: package hash, exports root, authorizer, payload hash, gas, trace and result |
| <span id="gk-workerror" class="gk-wrap">$\mathbb{E}$</span> | E | the set of work errors: out of gas, panic, bad exports, oversize, BAD (no code) and BIG (code too big) |
| <span id="gk-cup">$\cup$</span> | union | everything in either side |
| <span id="gk-blob">[$\mathbb{B}$](../symbols.md#blobs)</span> | B, or B sub n | bytes: any run of them; 𝔹ₙ exactly n of them |
| <span id="gk-infty">$\infty$</span> | infinity | ∞: in a work result, the program ran out of gas |
| <span id="gk-panic">$\unicode{x21AF}$</span> | panic | ↯: the program trapped |
| <span id="gk-badexports" class="gk-wrap">$\circledcirc$</span> | bad exports | the error: the item exported a different number of segments than it said it would |
| <span id="gk-oversize" class="gk-wrap">$\circleddash$</span> | oversize | the error: this output would make the report's outputs bigger than W_R |
| <span id="gk-token">$\texttt{x}$</span> | the string | a name in typewriter type: an instruction's or helper's name, or fixed bytes written as text: the ASCII bytes of its words; the dollar sign in front only marks them as text and is not one of the bytes |
| <span id="gk-encodeimportref">$I\left(x\right)$</span> | I of | one import reference's bytes: a 32-byte hash, then the index in 2 bytes, its top bit set if the hash names a work-package |
| <span id="gk-hash">$\mathbb{H}$</span> | H | a 32-byte value, usually a hash |
| <span id="gk-boxplus">$\boxplus$</span> | boxed | H⊞ marks a hash as a package's hash, to be swapped for that package's segments root |
| <span id="gk-Nbits">[$\mathbb{N}_{2^{x}}$](../symbols.md#naturals)</span> | N sub two to the n | the numbers that fit in n bits: ℕ_{2³²} is a u32 |
| <span id="gk-exists">[$\exists$](../symbols.md#exists)</span> | there exists | there is at least one value such that what follows holds |

</details>

→ [(C.16), (C.17), (C.18), (C.19), (C.20), (C.21), (C.22), (C.23), (C.24), (C.25), (C.26), (C.27), (C.28), (C.29), (C.30), (C.31), (C.32), (C.33), (C.34), (C.35), (C.36), (C.37) in plain words](./gray-paper.md#ex-C-16)

<a id="gp-C-2-p3"></a>Note the use of $O$ above to succinctly encode the result of a work item and the slight transformations of e.g.  $\mathbf{E}_G$ and $\mathbf{E}_P$ to take account of the fact their inner tuples contain variable-length sequence terms $a$ and $p$ which need length discriminators.

:::

(C.16) is this lesson: the header, then the five parts in Appendix C's own order, tickets,
preimages, guarantees, assurances, disputes
([lesson 4.1](./01-tickets-and-preimages.md) had the table). Nothing in between, no
lengths around the parts beyond their own.

The lines under it are the lessons you've done:

| Lines | What they encode | Lesson |
| --- | --- | --- |
| (C.17), (C.18) | tickets and preimages | [4.1](./01-tickets-and-preimages.md) |
| (C.19), (C.30) | guarantees | [4.3](./03-guarantees.md) |
| (C.20) | assurances | [4.2](./02-tiny-and-full.md) |
| (C.21) | disputes | [4.4](./04-disputes.md) |
| (C.22) to (C.25) | the header | [4.6](./06-the-header.md) |

The rest, (C.26) to (C.37), are the work-package, the work-report and their parts, from
[Part 3](../03-work-and-reports/index.md), and a few structures later Parts meet.
[4.A](./gray-paper.md#c-16-to-c-37-the-block-line-by-line) reads every line.

## The tests

**Add to** `test/block.test.ts`

```ts
import { Block, Extrinsic } from "../src/block.ts";

testCodecVector("extrinsic", Extrinsic);
testCodecVector("block", Block);
```

## The code

**Add to** `src/block.ts`

```ts
/** A block's extrinsic (GP §4): the five parts, in Appendix C's order. */
export function Extrinsic(config: Config) {
  return record({
    tickets: TicketsExtrinsic,
    preimages: PreimagesExtrinsic,
    guarantees: GuaranteesExtrinsic,
    assurances: AssurancesExtrinsic(config),
    disputes: DisputesExtrinsic,
  });
}
export type Extrinsic = Value<ReturnType<typeof Extrinsic>>;

/** A block (GP §4): a header and an extrinsic. */
export function Block(config: Config) {
  return record({
    header: Header(config),
    extrinsic: Extrinsic(config),
  });
}
export type Block = Value<ReturnType<typeof Block>>;
```

That's the whole thing. Both are functions of the config because two of their bricks
are: the assurances' bitfield ([lesson 4.2](./02-tiny-and-full.md)) and the header's
tickets mark ([lesson 4.6](./06-the-header.md)).

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ block (tiny) (0.8ms)
✔ block (full) (7.4ms)
...
ℹ tests 52
ℹ suites 0
ℹ pass 52
ℹ fail 0
...
reported 52 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791728275436
...
```

`block (tiny)` and `block (full)`: your client decodes complete JAM blocks, byte for
byte, at both sizes. That's every structure a block can carry.

## Watch a whole block

**Replace in** `bin/decode.ts`

```ts
import { Block, Extrinsic } from "../src/block.ts";

/** The structures this program knows, by the test vectors' names; some depend on the size. */
const CODECS = (config: Config): Record<string, Codec<unknown>> => ({
  refine_context: RefineContext,
  work_item: WorkItem,
  work_package: WorkPackage,
  work_result: WorkDigest,
  work_report: WorkReport,
  tickets_extrinsic: TicketsExtrinsic,
  preimages_extrinsic: PreimagesExtrinsic,
  assurances_extrinsic: AssurancesExtrinsic(config),
  guarantees_extrinsic: GuaranteesExtrinsic,
  disputes_extrinsic: DisputesExtrinsic,
  header: Header(config),
  extrinsic: Extrinsic(config),
  block: Block(config),
});
```

What flows through this run:

::: code-group

```text [what goes in]
block.bin, 5,150 bytes; the first 34:
5c 74 3d bc 51 42 84 b2 ea 57 79 87 87 c5 a1 55 ef
9d 7a c1 e9 49 9e c6 59 10 a7 a3 d6 58 97 b7 25 91 …
```

```ts [what it computes]
// Block(TINY).decode(r): a header, then the five lists of the extrinsic
const computed = {
  header: { // 4.6's shape, with other marks
    parent: "0x5c743dbc…", // the same parent as 4.6's header
    slot: 42,
    epoch_mark: { entropy: "0xae85d663…", validators: 6 }, // 01: present
    tickets_mark: null, // 00: absent
    offenders_mark: ["0x4418fb8c…"], // one convicted key
  },
  extrinsic: {
    tickets: 3, // each list with its count in front
    preimages: 3,
    guarantees: 1,
    assurances: 2,
    disputes: { verdicts: 2, culprits: 2, faults: 1 },
  },
  traced: 5150, // every byte of the block, one field at a time
};
```

```text [what comes out]
    0..32    header.parent                  0x5c743dbc514284b2ea57798787c5a155ef9d7ac1e9499ec65910a7a3d65897b7
   32..64    header.parent_state_root       0x2591ebd047489f1006361a4254731466a946174af02fe1d86681d254cfd4a00b
 5086..5150  extrinsic.disputes.faults.0.signature 0x557e5ee3660be9247c4908c74a46c91eebd713925dd7f2ede3ef4900ba277039f7d46ec15432116176cce8ce39d8ae21eabafdf71796eeb724ee7e4ff1dd1fd7
```

:::

The header comes first, shaped as in [lesson 4.6](./06-the-header.md) but with an epoch
mark where that one had tickets, then the extrinsic's five lists in order, the disputes
last. The trace ends exactly at byte 5,150, the file's length.

**Run**

```sh
npm pkg set scripts.decode-block="node bin/decode.ts block ../vectors/codec/tiny/block.bin"
npm run decode-block
```

```text
    0..32    header.parent                  0x5c743dbc514284b2ea57798787c5a155ef9d7ac1e9499ec65910a7a3d65897b7
   32..64    header.parent_state_root       0x2591ebd047489f1006361a4254731466a946174af02fe1d86681d254cfd4a00b
...
 5086..5150  extrinsic.disputes.faults.0.signature 0x557e5ee3660be9247c4908c74a46c91eebd713925dd7f2ede3ef4900ba277039f7d46ec15432116176cce8ce39d8ae21eabafdf71796eeb724ee7e4ff1dd1fd7
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=decode-1791728275906
```

145 fields, from `header.parent` at byte 0 to the last fault's signature ending at byte
5,150: every byte of a tiny block, accounted for. Now try the full one,
`../vectors/codec/full/block.bin`: 161,177 bytes, most of them a 1,023-validator epoch
mark and two juries of 683. It scrolls by in a blink, and the whole trace lands in
Grafana's *Decode trace* panel, where you can search it.

The strip [at the top](#try-it) is this same block: tap a part there and it names the
trace lines you just printed.

![Decode trace panel](./images/07-decode-trace.png)

## The scoreboard

Every structure the codec vectors hold now has a codec: the work items and reports of
[Part 3](../03-work-and-reports/index.md), each extrinsic part, the header and the block.
Give the scoreboard all of them. The sized ones come as functions of the config, as
`testCodecVector` takes them, and the size comes from the vector's folder:

**Replace in** `test/families.ts`

```ts
import type { Config } from "../src/config.ts";
import { RefineContext, WorkItem, WorkPackage, WorkDigest, WorkReport } from "../src/work.ts";
import { TicketsExtrinsic, PreimagesExtrinsic, AssurancesExtrinsic, GuaranteesExtrinsic, DisputesExtrinsic, Header, Extrinsic, Block } from "../src/block.ts";

/** The codecs for the codec vectors, by the vectors' names for the structures. A codec
 * whose shape depends on the size comes as a function of the config. */
const CODECS: Record<string, Codec<unknown> | ((config: Config) => Codec<unknown>)> = {
  refine_context: RefineContext,
  work_item: WorkItem,
  work_package: WorkPackage,
  work_result_0: WorkDigest,
  work_result_1: WorkDigest,
  work_report: WorkReport,
  tickets_extrinsic: TicketsExtrinsic,
  preimages_extrinsic: PreimagesExtrinsic,
  assurances_extrinsic: AssurancesExtrinsic,
  guarantees_extrinsic: GuaranteesExtrinsic,
  disputes_extrinsic: DisputesExtrinsic,
  header_0: Header,
  header_1: Header,
  extrinsic: Extrinsic,
  block: Block,
};

/** A codec vector, such as "codec/tiny/work_item.json", by its round trip. */
function checkCodec(name: string) {
  const structure = name.split("/").at(-1)!.replace(".json", "");
  const codec = CODECS[structure];
  assert.ok(codec, `no codec for ${structure} yet`);
  const sized = typeof codec === "function" ? codec(configOf(name)) : codec;
  checkCodecVector(sized, name.replace(".json", ""));
}
```

**Add to** `test/families.ts`

```ts
import { FULL, TINY } from "../src/config.ts";

/** The size a vector is written for, from its folder: full or tiny. */
const configOf = (name: string): Config => (name.includes("/full/") ? FULL : TINY);
```

The whole block is the biggest codec vector. Its header and the five-part extrinsic, trimmed:

::: code-group

```json [what goes in]
{
  "vector": "vectors/codec/tiny/block.json",
  "header": {
    "parent": "0x5c743dbc51\u2026",
    "slot": 42,
    "author_index": 3,
    "seal": "0x31dc5b1e94\u2026"
  },
  "extrinsic": "{ tickets, preimages, guarantees, assurances, disputes }"
}
```

```text [console]
codec                    30 of 30  ✔
30 of 1,428 vectors pass.
```

:::

Run whole, a vector like this one decodes to a header and an extrinsic, then encodes back to its exact bytes. Every one of the 30 does that now, so the family's row is complete.

**Run**

```sh
npm run typecheck
npm run scoreboard
```

```text
...
The official test vectors, each run whole by your client:

codec                    30 of 30  ✔
erasure                  not run yet (12)
shuffle                  not run yet (1)
stf/accumulate           not run yet (126)
stf/assurances           not run yet (22)
stf/authorizations       not run yet (6)
stf/disputes             not run yet (60)
stf/history              not run yet (8)
stf/preimages            not run yet (16)
stf/reports              not run yet (92)
stf/safrole              not run yet (46)
stf/statistics           not run yet (8)
traces/fallback          not run yet (100)
traces/fuzzy             not run yet (200)
traces/fuzzy_light       not run yet (200)
traces/preimages         not run yet (100)
traces/preimages_light   not run yet (100)
traces/safrole           not run yet (100)
traces/storage           not run yet (100)
traces/storage_light     not run yet (100)
trie                     not run yet (1)

30 of 1,428 vectors pass.
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=scoreboard-1791938953569
```

> [!TIP] Milestone
> **Every codec vector.** All 30, tiny and full: every JAM structure the
> official vectors encode, decoded and encoded back byte for byte.

<details>
<summary>lasair: <code>decode_block</code>, in <code>conformance/block_codec.ml</code></summary>

```ocaml
let decode_block b off : raw_block * int =
  let (header, off) = decode_header b off in
  let (extrinsic, off) = decode_extrinsic b off in
  ({ rb_header = header; rb_extrinsic = extrinsic }, off)
```

Three lines at the top, sitting on a few hundred lines of hand-written decoders below.
Yours sits on `record`, `seq` and friends: the same block, a lot less code to get wrong.

</details>

## Check your understanding

::: check
**How are a block's bytes laid out?**

- [ ] The header and each extrinsic part, each with its length in front
  > No: there's nothing in between. The parts carry only the lengths their own rules
  > give them, such as each list's length.
- [ ] The extrinsic first, then the header that describes it
  > No: the header comes first, the extrinsic after.
- [x] The header, then the five parts in Appendix C's order, back to back
  > Yes: tickets, preimages, guarantees, assurances, disputes, straight after the
  > header's seal.

**Nothing marks where the header ends and the tickets begin. How does a decoder find the place?**

- [x] Every field ends where its own rule says, so the header's end is wherever its last field stops
  > Yes: a fixed-size field has its size, a list has its count or the configuration's, an
  > option has its byte in front. Read them in order and you arrive.
- [ ] It searches for the tickets' first byte
  > No: no byte value is kept for marking places. Any byte can turn up inside a hash or a
  > signature.
- [ ] The header is the same number of bytes in every block
  > No: an epoch mark or a tickets mark makes one header far longer than another.

**Why are `Block` and `Extrinsic` functions of the config?**

- [ ] Because a full block is much bigger than a tiny one
  > No: bigger alone doesn't matter. A verdict on full has 683 votes, and
  > `DisputesExtrinsic` is still a plain codec, because the votes carry their length.
- [x] Because two of their bricks are: the assurances' bitfield and the header's tickets mark
  > Yes: the bitfield has ⌈C/8⌉ bytes and the tickets mark holds E tickets. Anything
  > built from them needs the config too.
- [ ] Because every block says in its first byte whether it's tiny or full
  > No: nothing in the bytes says which size. The vectors' folders do, which is why
  > the code reads the size from the path.

**All 30 codec vectors pass. What can't your client do yet?**

- [ ] Read a full-size block
  > No: it does, 161,177 bytes of the full `block.bin`, byte for byte.
- [x] Check that a block is genuine: its parent hash, its extrinsic hash and its signatures
  > Yes: it reads all of those as plain bytes but checks none of them. That's
  > [Part 5](../05-hashing-and-signatures/index.md)'s job.
- [ ] Turn a block back into bytes
  > No: every vector checks the round trip, decoding and encoding back to exactly the
  > same bytes.
:::

## What you have

[Part 4](./index.md), done: your client reads any JAM block, at either size, and can show you every
byte of it, and every one of the 30 codec vectors passes whole. What it can't do yet is check one. A block names its parent by *hash*, and
promises its extrinsic by hash, and is sealed with signatures. [Part 5](../05-hashing-and-signatures/index.md) brings the
cryptography.

Next: [Part 5 · Hashing and signatures](../05-hashing-and-signatures/index.md)
