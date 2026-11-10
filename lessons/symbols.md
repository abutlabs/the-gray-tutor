# Gray Paper symbols

<AlbertChalkboard />

The Gray Paper writes its rules in equations. This page is the key to it: every symbol the
tutorial uses, how to say it out loud, what it means, an example, where the Gray Paper
defines it, and where it shows up. Every formula in a lesson has a small key under it that
links here.

You don't need to read this page first. Come back whenever a symbol stops you.

## Reading a formula

Most Gray Paper definitions have the same shape. Here is the one from [lesson
2.1](./02-codec/01-fixed-width-integers.md):

$$
\mathcal{E}_l \colon \left\{
\begin{aligned}
\mathbb{N}_{2^{8l}} &\to \mathbb{B}_l \\
x &\mapsto \begin{cases}
[\,] & \text{if } l = 0 \\
[x \bmod 256] \frown \mathcal{E}_{l-1}\left(\left\lfloor \frac{x}{256} \right\rfloor\right) & \text{otherwise}
\end{cases}
\end{aligned}
\right.
$$

- **The name**, before the colon: ℰₗ, the thing being defined.
- **The type line**: what goes in, an arrow, what comes out. $\mathbb{N}_{2^{8l}} \to \mathbb{B}_l$
  says a whole number that fits in l bytes goes in, and exactly l bytes come out. Read it first:
  it tells you what the definition is for before you read how it works.
- **The cases**, after x ↦: what x becomes. Each line is one case, with its condition on
  the right. Read them top to bottom; the first whose condition holds is the one that
  applies.

When a definition uses its own name (ℰₗ uses $\mathcal{E}_{l-1}$), work it through by hand
on a small value, as [lesson 2.1](./02-codec/01-fixed-width-integers.md) does for 4,807. It stops being mysterious after one go.

## All the symbols

Each notation symbol links to its full entry below.

### Notation

| Symbol | Say it | What it is | First in |
| --- | --- | --- | --- |
| [$\mathbb{N}$, $\mathbb{N}_n$](#naturals) | N, N sub n | the whole numbers from 0 up; ℕₙ the ones below n | [1.2](./01-bytes-and-numbers/02-numbers.md) |
| [$\mathbb{B}$, $\mathbb{B}_n$](#blobs) | B, B sub n | runs of bytes; 𝔹ₙ the ones of exactly n bytes | [1.1](./01-bytes-and-numbers/01-bytes-and-hex.md) |
| [$[\,]$](#sequence) | the sequence | values in a row; \[ \] is the empty one | [2.1](./02-codec/01-fixed-width-integers.md) |
| [$\frown$](#concat) | concatenate | one sequence followed by another | [2.1](./02-codec/01-fixed-width-integers.md) |
| [$\bmod$](#mod) | mod | the remainder after dividing | [2.1](./02-codec/01-fixed-width-integers.md) |
| [$\lfloor\,\rfloor$](#floor) | floor | round down | [2.1](./02-codec/01-fixed-width-integers.md) |
| [$\to$](#to) | to | what a function takes, to what it gives | [2.1](./02-codec/01-fixed-width-integers.md) |
| [$\mapsto$](#maps-to) | maps to | what a function does with its input | [2.1](./02-codec/01-fixed-width-integers.md) |
| [$\mathcal{E}_l$](#encode-fixed) | E sub l | a number in exactly l bytes | [2.1](./02-codec/01-fixed-width-integers.md) |
| [$\mathcal{E}^{-1}$](#decode) | E inverse | decoding: bytes back into a value | [2.1](./02-codec/01-fixed-width-integers.md) |
| [$\mathcal{E}$](#encode) | script E | encoding any value as bytes; a number in 1 to 9 bytes | [2.2](./02-codec/02-compact-naturals.md) |
| [$\in$](#in) | in | belongs to a set | [2.2](./02-codec/02-compact-naturals.md) |
| [$\exists$](#exists) | there exists | there is at least one value that... | [2.2](./02-codec/02-compact-naturals.md) |
| [$\updownarrow$](#length-prefix) | with its length | a value of varying size, its length in front | [2.4](./02-codec/04-codecs.md) |
| [$\equiv$](#defined-as) | is defined as | the left side is, by definition, the right | [0.1](./00-start/01-what-you-will-build.md) |
| [$'$](#prime) | prime | the same thing, after the block | [0.1](./00-start/01-what-you-will-build.md) |
| [$B$](#block) | B | a block: a header and an extrinsic | [0.1](./00-start/01-what-you-will-build.md) |

### Names

The Gray Paper names the state and its big functions with letters, mostly Greek.

| Symbol | Say it | What it is | First in |
| --- | --- | --- | --- |
| [σ](#state) | sigma | the whole state: everything the chain remembers | [0.1](./00-start/01-what-you-will-build.md) |
| [Υ](#transition) | upsilon | the state transition: the state and a block give the next state | [0.1](./00-start/01-what-you-will-build.md) |
| α | alpha | the authorizer pools | [6.2](./06-state-and-merklization/02-state-keys.md) |
| ϕ | phi (straight) | the authorizer queue | [6.2](./06-state-and-merklization/02-state-keys.md) |
| β | beta | recent blocks | [6.2](./06-state-and-merklization/02-state-keys.md) |
| γ | gamma | Safrole's state: the ticket lottery | [6.2](./06-state-and-merklization/02-state-keys.md) |
| ψ | psi | past judgements, from disputes | [6.2](./06-state-and-merklization/02-state-keys.md) |
| η | eta | entropy | [6.2](./06-state-and-merklization/02-state-keys.md) |
| ι | iota | the next validators | [6.2](./06-state-and-merklization/02-state-keys.md) |
| κ | kappa | the active validators: this epoch's set, in order (a `validator_index` is a place in it); its size, \|κ\|, is 6 on tiny and 1,023 on full, and from GP 0.8.0 may change at an epoch | [6.2](./06-state-and-merklization/02-state-keys.md) |
| λ | lambda | the previous validators | [6.2](./06-state-and-merklization/02-state-keys.md) |
| ρ | rho | reports awaiting availability | [6.2](./06-state-and-merklization/02-state-keys.md) |
| τ | tau | the time: the current timeslot | [6.2](./06-state-and-merklization/02-state-keys.md) |
| χ | chi | the privileged services | [6.2](./06-state-and-merklization/02-state-keys.md) |
| π | pi | the statistics | [6.2](./06-state-and-merklization/02-state-keys.md) |
| ω | omega | reports ready to accumulate (the ready queue) | [6.2](./06-state-and-merklization/02-state-keys.md) |
| ξ | xi | recently accumulated work-packages | [6.2](./06-state-and-merklization/02-state-keys.md) |
| θ | theta | the last accumulation outputs | [6.2](./06-state-and-merklization/02-state-keys.md) |
| Φ | capital phi | the filter that keeps offenders out of a validator set | [8.2](./08-safrole/02-rotating-the-validators.md) |
| ζ | zeta | a program's code, followed by zeros forever | [15.2](./15-the-pvm/02-instructions.md) |
| φ | phi (curly) | the PVM's registers: φ₇ is register 7 | [15.3](./15-the-pvm/03-the-machine.md) |
| Ψ | capital psi | running the PVM; Ψ₁ is one step | [15.3](./15-the-pvm/03-the-machine.md) |
| ε | epsilon | how a PVM step ended: carry on, halt, panic, ... | [15.3](./15-the-pvm/03-the-machine.md) |
| μ | mu | the PVM's memory | [15.4](./15-the-pvm/04-memory.md) |
| ν | nu | an instruction's immediate values (ν_X, ν_Y) | [15.4](./15-the-pvm/04-memory.md) |
| Ω | capital omega | the host calls: Ω_G is gas, Ω_Y is fetch, ... | [16.1](./16-host-calls/01-calling-the-host.md) |
| Δ | capital delta | accumulation: Δ₁ one service, Δ* one round, Δ+ every round | [16.7](./16-host-calls/07-a-services-inputs.md) |
| Σ | capital sigma | a sum | [18.2](./18-statistics/02-what-cores-and-services-did.md) |

Two of them are both phi, as in the Gray Paper: the straight ϕ is the authorizer queue, the
curly φ the PVM's registers.

## Synonyms: one thing, several names {#synonyms}

One thing in JAM often answers to three names: the Gray Paper's symbol, this tutorial's
plain word, and the test vectors' field name. Nobody tells you they're the same thing, and
not knowing makes you look lost in a room that does — the super-peak *is* the
`beefy_root`. The ones worth knowing cold:

| Symbol | Say it | The one thing | Also answers to | Taught in |
| --- | --- | --- | --- | --- |
| M_R | M sub R | the whole belt in one hash | the **super-peak**; the vectors' `beefy_root` | [9.1](./09-recent-history/01-the-mountain-belt.md) |
| β_B | beta sub B | the Merkle mountain belt | the history vectors' `mmr` | [9.2](./09-recent-history/02-recent-blocks.md) |
| M_B(θ′) | M sub B of theta prime | a block's accumulation-outputs root | the history vectors' `accumulate_root`: the item the belt appends | [17.11](./17-accumulation/11-what-a-service-yields.md), [9.1](./09-recent-history/01-the-mountain-belt.md) |
| θ | theta | the accumulation outputs | each one a service's **yield** | [17.11](./17-accumulation/11-what-a-service-yields.md) |
| γ_P | gamma sub P | the pending validator set, the next epoch's | the vectors' `gamma_k`, after an older Gray Paper's name γ_k | [8.2](./08-safrole/02-rotating-the-validators.md) |
| η′₂ | eta prime two | the entropy the next epoch's lottery uses | `epoch_mark.tickets_entropy` | [8.3](./08-safrole/03-the-fallback-sealers.md) |
| 𝒴(its proof) | script Y of its proof | a ticket's id | its lottery score: the VRF output of its ring proof | [8.6](./08-safrole/06-the-vrf-output.md) |
| H_S, H_V | H sub S, H sub V | the header's two signatures | `seal` and `entropy_source` | [8.9](./08-safrole/09-seals.md) |
| — | | a work digest | the vectors' **work result** (`result`) | [3.2](./03-work-and-reports/02-work-digests.md) |
| — | | the authorizer's output | the report vectors' `auth_output`; the operand's **trace** (`auth_trace`) | [3.3](./03-work-and-reports/03-a-work-report.md), [16.7](./16-host-calls/07-a-services-inputs.md) |
| χ_M, χ_A, χ_V, χ_R | chi sub M, A, V, R | the manager, the assigners, the delegator, the registrar | the vectors name each after its host call: `bless`, `assign`, `designate`, `register` (whose call is `new`) | [17.5](./17-accumulation/05-privileges.md) |
| ψ_O | psi sub O | the offenders | the header's offenders mark carries a block's new ones | [10.2](./10-disputes/02-culprits-and-faults.md) |
| — | | a judgement | a vote; a verdict with a third voting valid is **wonky**, a split | [10.1](./10-disputes/01-votes-and-verdicts.md) |
| — | | the pipeline | the report vectors' `known_packages` | [12.5](./12-guarantees/05-bad-reports.md) |

And two traps that look like synonyms but aren't: a block's *extrinsic* (its five-part
contents) and a work-item's *extrinsics* (data blobs for refine) are different things
([4.1](./04-blocks/01-tickets-and-preimages.md)), and n (one validator's ticket attempts
for an epoch) is not K (the most tickets one block may carry)
([8.7](./08-safrole/07-entering-tickets.md)).

## The whole chain

### σ: the state {#state}

- **Say it:** "sigma".
- **Means:** everything the chain remembers, in seventeen parts, from the validators' keys
  to the services' accounts.
- **Example:** after the storage trace's first block, the state whose root is
  `0x48dc323d…` ([the start page](./index.md#at-a-glance)).
- **Gray Paper:** §4, *Overview*: *"σ is the prior state, σ′ is the posterior state, B is
  some valid block and Υ is our block-level state-transition function."*
- **Built in:** [Part 6](./06-state-and-merklization/index.md) reads it, [Part 19](./19-block-import/index.md) keeps all of it.

### ′: after {#prime}

- **Say it:** "prime", as in "sigma prime".
- **Means:** the same thing, after the block: σ′ is the state after it, τ′ the timeslot
  after it.
- **Example:** the σ′ of slot 1's block in the storage trace, root `0x48dc323d…`, is the σ
  that slot 2's block starts from.
- **Gray Paper:** §4, *Overview*: *"σ′ is the posterior state"*.
- **Used for:** every rule that says what a part of the state becomes.

### B: a block {#block}

- **Say it:** "B".
- **Means:** one block: a header and an extrinsic, everything it brings from outside.
- **Example:** the storage trace's block for slot 2, made by validator 3, carrying 1 report.
- **Gray Paper:** §4.1, *The Block*: B ≡ (H, E), the header and the extrinsic.
- **Built in:** [Part 4](./04-blocks/index.md).

### Υ: the state transition {#transition}

- **Say it:** "upsilon".
- **Means:** the rules that turn a state and a block into the next state. By the end of the
  tutorial, your client.
- **Example:** Υ turns the storage trace's first state, root `0xd6e78dc0…`, and its
  slot 1 block into the state with root `0x48dc323d…`.
- **Gray Paper:** §4, *Overview*: *"Υ is our block-level state-transition function."*
- **Built in:** [Part 19](./19-block-import/index.md), block import, from every part before it.

### ≡: is defined as {#defined-as}

- **Say it:** "is defined as", or just "is".
- **Means:** the left side is, by definition, the right. Not a question of whether they're
  equal: a statement that they are.
- **Example:** σ′ ≡ Υ(σ, B): the state after is whatever Υ makes of σ and B.
- **Gray Paper:** used for every definition, from its first equation in §4.

## Numbers and bytes

### ℕ and ℕₙ: naturals {#naturals}

- **Say it:** "N" for the naturals, "N sub n" for ℕₙ.
- **Means:** ℕ is every whole number from 0 up: 0, 1, 2 and so on. ℕₙ is the ones below n.
- **Example:** ℕ₈ is 0 to 7. $\mathbb{N}_{2^{32}}$ is 0 to 4,294,967,295: a u32.
- **Gray Paper:** §3, *Numbers*: *"ℕ denotes the set of naturals including zero whereas
  ℕₙ implies a restriction on that set to values less than n."*
- **Used for:** every count, index and amount. $\mathbb{N}_{2^{32}}$ for timeslots and
  service ids, $\mathbb{N}_{2^{64}}$ for gas and balances ([lesson
  1.2](./01-bytes-and-numbers/02-numbers.md)). No JAM number reaches $2^{64}$.

### 𝔹 and 𝔹ₙ: blobs {#blobs}

- **Say it:** "B" for blobs, "B sub n" for 𝔹ₙ.
- **Means:** 𝔹 is every run of bytes, of any length: a *blob*. 𝔹ₙ is the runs of exactly
  n bytes, and $\mathbb{B}_{1:9}$ the runs of 1 to 9 bytes.
- **Example:** `c7 12 00 00` is in 𝔹₄. ℍ, a hash, is 𝔹₃₂.
- **Gray Paper:** §3, *Octets and Blobs*: *"𝔹 denotes the set of octet strings
  ("blobs") of arbitrary length."* It also warns that a byte and a number below 256 look
  alike but aren't the same: a byte encodes as itself, while a number *"may be serialized
  as a sequence of potentially several octets"*. That's why your client keeps `Bytes` and
  numbers apart from [lesson 1.1](./01-bytes-and-numbers/01-bytes-and-hex.md) on.
- **Used for:** everything JAM sends, stores or hashes is a blob in the end.

## Sequences

### [ ]: sequences {#sequence}

- **Say it:** "the sequence a, b, c" for [a, b, c]; "the empty sequence" for [ ].
- **Means:** values in a row, in order. A run of bytes is a sequence of bytes.
- **Example:** [199, 18] is the two bytes `c7 12`. [ ] is no bytes at all.
- **Gray Paper:** §3, *Sequences*: *"A sequence is a series of elements with particular
  ordering not dependent on their values."*
- **Used for:** every list: the bytes of an encoding, a block's tickets, the validators.

### ⌢: concatenate {#concat}

- **Say it:** "concatenate", or just "followed by".
- **Means:** one sequence, then another, joined into one.
- **Example:** [199] ⌢ [18] = [199, 18].
- **Gray Paper:** §3, *Sequences*, *Editing*: *"We define the sequence concatenation
  operator ⌢ such that [x₀, x₁, …, y₀, y₁, …] ≡ x ⌢ y."*
- **In code:** `concatBytes`, from [lesson 2.2](./02-codec/02-compact-naturals.md).
- **Used for:** building every encoding, and every message that gets signed: an
  assurance signs `$jam_available` ⌢ H(...) ([lesson
  5.3](./05-hashing-and-signatures/03-signatures.md)).

## Arithmetic

### mod: remainder {#mod}

- **Say it:** "mod", short for modulo.
- **Means:** the remainder after dividing.
- **Example:** 4,807 mod 256 = 199, because 4,807 = 18 × 256 + 199.
- **Gray Paper:** standard math, so the Gray Paper uses it without defining it.
- **In code:** `%`, or `& 0xffn` for mod 256 ([lesson 2.1](./02-codec/01-fixed-width-integers.md)).

### ⌊ ⌋: floor {#floor}

- **Say it:** "floor": ⌊x / 256⌋ is "floor of x over 256".
- **Means:** round down to a whole number.
- **Example:** ⌊4,807 / 256⌋ = ⌊18.78…⌋ = 18.
- **Gray Paper:** standard math, used without a definition.
- **In code:** `>> 8n` for ⌊x / 256⌋ ([lesson 2.1](./02-codec/01-fixed-width-integers.md)).
  Dividing two `bigint` values rounds down too, as long as neither is negative.

## Functions and logic

### →: to {#to}

- **Say it:** "to".
- **Means:** in a type line, what a function takes, then what it gives.
- **Example:** $\mathcal{E}_l : \mathbb{N}_{2^{8l}} \to \mathbb{B}_l$ is "ℰₗ takes a whole
  number that fits in l bytes, to exactly l bytes".
- **In code:** a function's parameter and return types: `encodeFixed(x: bigint, l:
  number): Bytes`.
- **Gray Paper:** standard math. §3 uses it for sequences too: a sequence of T is
  *"a partial mapping ℕ → T"*, from positions to items.

### ↦: maps to {#maps-to}

- **Say it:** "maps to", or "becomes".
- **Means:** what a function does to its input: x ↦ ... is "x becomes ...".
- **Example:** x ↦ [x mod 256] ⌢ ... is "x becomes its lowest byte, followed by ...".
- **In code:** the function's body.
- **Gray Paper:** standard math. The state uses it for its keys too: C(11) ↦ ℰ₄(τ),
  "key 11 holds the time as four bytes" (Appendix D, [lesson
  6.3](./06-state-and-merklization/03-reading-the-state.md)).

### ∈: in {#in}

- **Say it:** "in", or "is a".
- **Means:** belongs to a set.
- **Example:** l ∈ ℕ₈ is "l is one of 0 to 7".
- **Gray Paper:** standard math, on nearly every page.

### ∃: there exists {#exists}

- **Say it:** "there exists", or "there is some".
- **Means:** at least one value makes the statement after the colon true.
- **Example:** $\exists l \in \mathbb{N}_8 : 2^{7l} \le x < 2^{7(l+1)}$ is "there is some l
  from 0 to 7 with x at least $2^{7l}$ and below $2^{7(l+1)}$". For x = 300, that's l = 1.
- **Gray Paper:** standard math.

## Encoding

### ℰₗ: fixed-length integer encoding {#encode-fixed}

- **Say it:** "E sub l". ℰₗ(x) is "E sub l of x", or "x in l bytes".
- **Means:** a whole number in exactly l bytes, lowest byte first (*little-endian*).
- **Example:** ℰ₂(4,807) = [199, 18], the bytes `c7 12`. ℰ₄(1) is `01 00 00 00`.
- **Gray Paper:** Appendix C, *Fixed-length Integer Encoding*, *"utilized for almost all
  integer encoding across the protocol"*. Its definition is the one at the top of this
  page, under *Reading a formula*.
- **Built from:** [ℕₙ](#naturals), [𝔹ₙ](#blobs), [→](#to), [↦](#maps-to),
  [\[ \]](#sequence), [mod](#mod), [⌢](#concat), [⌊ ⌋](#floor).
- **Used for:** every number with a fixed size. ℰ₄ is the Gray Paper's most used:
  timeslots and service ids. Then ℰ₈ for gas and balances, and ℰ₂ for validator indices
  and a work item's export count. The state keeps the time τ as ℰ₄(τ) (Appendix D), and
  a service's state keys start with ℰ₄ of its id.
- **Built in:** [lesson 2.1](./02-codec/01-fixed-width-integers.md).

### ℰ: the codec, and compact naturals {#encode}

- **Say it:** "script E". ℰ(x) is "E of x", or "x encoded".
- **Means:** the Gray Paper's one way to turn any value into bytes. On a whole number,
  with no subscript, it's the compact encoding: 1 to 9 bytes, the first saying how many
  more follow.
- **Example:** ℰ(5) is `05`, ℰ(128) is `80 80`, ℰ(300) is `81 2c`.
- **Gray Paper:** Appendix C, *Serialization Codec*: *"Our codec function ℰ is used to
  serialize some term into a sequence of octets."* For a whole number:

  $$
  \mathcal{E} \colon \left\{
  \begin{aligned}
  \mathbb{N}_{2^{64}} &\to \mathbb{B}_{1:9} \\
  x &\mapsto \begin{cases}
  [0] & \text{if } x = 0 \\
  \left[2^8 - 2^{8-l} + \left\lfloor \frac{x}{2^{8l}} \right\rfloor\right] \frown \mathcal{E}_l\left(x \bmod 2^{8l}\right) & \text{if } \exists l \in \mathbb{N}_8 : 2^{7l} \le x < 2^{7(l+1)} \\
  [2^8 - 1] \frown \mathcal{E}_8(x) & \text{otherwise if } x < 2^{64}
  \end{cases}
  \end{aligned}
  \right.
  $$

- **Built from:** [ℰₗ](#encode-fixed), [∃](#exists), [∈](#in), and the symbols ℰₗ is
  built from.
- **Used for:** every hash and every signature. §3, *Hashing*: a hash's inputs *"should
  be expected to be passed through our serialization codec ℰ"*. A block's parent hash is
  H(ℰ(the parent header)) (§5). Two clients agree on a hash only when their ℰ agrees byte
  for byte. ℰ also encodes tuples, one element after another ([lesson
  2.3](./02-codec/03-writer-and-reader.md)), and whole structures ([lesson
  2.5](./02-codec/05-sequences-and-records.md)).
- **Built in:** [lesson 2.2](./02-codec/02-compact-naturals.md), for numbers.

### ℰ⁻¹: decode {#decode}

- **Say it:** "E inverse".
- **Means:** decoding: the bytes back into the value ℰ made them from. With a subscript,
  ℰ⁻¹₄ reads exactly four bytes as a number.
- **Example:** ℰ⁻¹₂(`c7 12`) = 4,807.
- **Gray Paper:** Appendix C: *"We define the deserialization function ℰ⁻¹ as the
  inverse of ℰ."*
- **In code:** `decodeFixed` ([lesson 2.1](./02-codec/01-fixed-width-integers.md)) and
  `decodeNatural` ([lesson 2.2](./02-codec/02-compact-naturals.md)).

### ↕︎: with its length {#length-prefix}

- **Say it:** "x with its length". The Gray Paper calls the length a *length
  discriminator*.
- **Means:** a value whose size varies, written with its length first, so a decoder knows
  where it ends.
- **Example:** ↕︎[1, 2, 3] encodes as ℰ(3) ⌢ [1, 2, 3], the bytes `03 01 02 03`.
- **Gray Paper:** Appendix C, *Discriminator Encoding*: ↕︎x is the pair (x's length, x),
  so ℰ(↕︎x) is ℰ of the length, followed by ℰ(x). A hash needs no ↕︎: everyone knows it's
  32 bytes.
- **Built from:** [ℰ](#encode), [⌢](#concat).
- **Used for:** every blob or list whose size varies, such as a work item's payload
  ([lesson 2.6](./02-codec/06-the-first-test-vectors.md)).
- **Built in:** [lesson 2.4](./02-codec/04-codecs.md).

## The paper's own index

Appendix I of the Gray Paper is its own symbols page: every letter it uses, one line each,
with the equation that defines it. It is long, and it is the first place to look with the
paper open: find the letter here, then follow its equation. The constants are under
*Constants*, with their values on full. The lines below are the paper's, word for word.
Where a line names an equation, the link goes to where this tutorial quotes it.

The sets come first: the paper's types, the blackboard letters such as ℕ and ℍ.

::: gray-paper I.1.1

#### Appendix I.1.1 Regular Notation {#gp-I-1-1}

<a id="gp-I-1-1-p1"></a>

- **$\mathbb{F}$** The set of finite fields.
- **$\mathbb{N}$** The set of non-negative integers. Subscript denotes one greater than the maximum. See section [3.4](./reading-the-gray-paper.md#gp-3-4-p1).
  - **$\mathbb{N}^+$** The set of positive integers (not including zero).
  - **$\mathbb{N}_B$** The set of balance values. Equivalent to $\mathbb{N}_{2^{64}}$. See equation [4.21](./what-runs-where.md#eq-4-21).
  - **$\mathbb{N}_G$** The set of unsigned gas values. Equivalent to $\mathbb{N}_{2^{64}}$. See equation [4.23](./what-runs-where.md#eq-4-23).
  - **$\mathbb{N}_L$** The set of blob length values. Equivalent to $\mathbb{N}_{2^{32}}$. See section [3.4](./reading-the-gray-paper.md#gp-3-4-p1).
  - **$\mathbb{N}_R$** The set of register values. Equivalent to $\mathbb{N}_{2^{64}}$. See equation [4.23](./what-runs-where.md#eq-4-23).
  - **$\mathbb{N}_S$** The set from which service indices are drawn. Equivalent to $\mathbb{N}_{2^{32}}$. See section [9.1](./14-services/02-the-service-account.md#eq-9-1).
  - **$\mathbb{N}_T$** The set of timeslot values. Equivalent to $\mathbb{N}_{2^{32}}$. See equation [4.28](./00-start/04-the-jam-clock.md#eq-4-28).
- **$\mathbb{Q}$** The set of rational numbers. Unused.
- **$\mathbb{Z}$** The set of integers. Subscript denotes range. See section [3.4](./reading-the-gray-paper.md#gp-3-4-p1).
  - **$\mathbb{Z}_G$** The set of signed gas values. Equivalent to $\mathbb{Z}_{-2^{63}\dots2^{63}}$. See equation [4.23](./what-runs-where.md#eq-4-23).

:::

::: gray-paper I.1.2

#### Appendix I.1.2 Custom Notation {#gp-I-1-2}

<a id="gp-I-1-2-p1"></a>

- **$\left\langle\!\left\vert K\to V\right\vert\!\right\rangle$** The set of dictionaries making a partial bijection of domain $k$ to range $v$. See section [3.5](./reading-the-gray-paper.md#gp-3-5-p1).
- **$\mathbb{A}$** The set of service $\mathbb{A}$ccounts. See equation [9.3](./14-services/02-the-service-account.md#eq-9-3).
- **$\mathbb{b}_{}$** The set of $\mathbb{b}$itstrings (Boolean sequences). Subscript denotes length. See section [3.7](./reading-the-gray-paper.md#gp-3-7-p1).
- **$\mathbb{B}_{}$** The set of $\mathbb{B}$lobs (<abbr class="gp-term" title="a byte: 8 bits">octet</abbr> sequences). Subscript denotes length. See section [3.7](./reading-the-gray-paper.md#gp-3-7-p1).
  - **$\overset{\mathrm{B\!L\!S}}{\mathbb{B}_{}}$** The set of BLS public keys. A subset of $\mathbb{B}_{144}$. See section [3.8.2](./05-hashing-and-signatures/03-signatures.md#gp-3-8-2-p1).
  - **$\overset{\circ}{\mathbb{B}_{}}$** The set of Bandersnatch ring roots. A subset of $\mathbb{B}_{144}$. See section [3.8](./05-hashing-and-signatures/01-hashes.md#gp-3-8-1-p1) and appendix [G](./08-safrole/06-the-vrf-output.md#gp-G-p1).
- **$\mathbb{C}$** The set of work-$\mathbb{C}$ontexts. See equation [11.4](./03-work-and-reports/01-a-work-package.md#eq-11-4). *Not used as the set of complex numbers.*
- **$\mathbb{D}$** The set of work-$\mathbb{D}$igests. See equation [11.6](./03-work-and-reports/02-work-digests.md#eq-11-6).
- **$\mathbb{E}$** The set of work execution $\mathbb{E}$rrors. See equation [11.7](./03-work-and-reports/02-work-digests.md#eq-11-7).
- **$\mathbb{G}$** The set of work-report $\mathbb{G}$uarantees. See equation [11.24](./12-guarantees/index.md#eq-11-24).
- **$\mathbb{H}_{}$** The set of 32-octet cryptographic values, equivalent to $\mathbb{B}_{32}$. Often a $\mathbb{H}$ash function's result. See section [3.8](./05-hashing-and-signatures/01-hashes.md#gp-3-8-1-p1).
  - **$\bar{\mathbb{H}_{}}$** The set of Ed25519 public keys. A subset of $\mathbb{B}_{32}$. See section [3.8.2](./05-hashing-and-signatures/03-signatures.md#gp-3-8-2-p1).
  - **$\overset{\backsim}{\mathbb{H}_{}}$** The set of Bandersnatch public keys. A subset of $\mathbb{B}_{32}$. See section [3.8](./05-hashing-and-signatures/01-hashes.md#gp-3-8-1-p1) and appendix [G](./08-safrole/06-the-vrf-output.md#gp-G-p1).
- **$\mathbb{I}$** The set representing the state of an $\mathbb{I}$nner PVM instance. See equation [B.4](./16-host-calls/gray-paper.md#eq-B-4).
- **$\mathbb{J}$** The set of data segments, equivalent to $\mathbb{B}_{\mathsf{W}_G}$. See equation [14.1](./03-work-and-reports/gray-paper.md#eq-14-1).
- **$\mathbb{K}$** The set of validator $\mathbb{K}$ey-sets. See equation [6.7](./08-safrole/02-rotating-the-validators.md#eq-6-7).
- **$\mathbb{L}$** The set representing implications of accumulation. See equation [B.7](./16-host-calls/06-checkpoints.md#eq-B-7).
- **$\mathbb{M}$** The set of PVM $\mathbb{M}$emory (RAM) states. See equation [4.24](./what-runs-where.md#eq-4-24).
- **$\mathbb{O}$** The set of single-service accumulation $\mathbb{O}$utputs. See equation [12.22](./17-accumulation/04-rounds.md#eq-12-22).
- **$\mathbb{P}$** The set of work-$\mathbb{P}$ackages. See equation [14.2](./03-work-and-reports/01-a-work-package.md#eq-14-2).
- **$\mathbb{R}$** The set of work-$\mathbb{R}$eports. See equation [11.2](./03-work-and-reports/03-a-work-report.md#eq-11-2). *Note used for the set of real numbers.*
- **$\mathbb{S}$** The set representating a portion of overall $\mathbb{S}$tate, used during accumulation. See equation [12.15](./17-accumulation/05-privileges.md#eq-12-15).
- **$\mathbb{T}$** The set of slot-sealer $\mathbb{T}$ickets. See equation [6.6](./08-safrole/04-the-lotterys-winners.md#eq-6-6).
- **$\mathbb{U}$** The information concerning a single work-item once prepared as an operand for the accumulation function. See equation [12.13](./17-accumulation/03-sending-a-transfer.md#eq-12-13).
- **$\mathbb{V}$** The set of $\mathbb{V}$alidator key-set sizes. See equation [6.8](./08-safrole/02-rotating-the-validators.md#eq-6-8).
- **$\mathbb{V}_{\mu}$** The set of $\mathbb{V}$alidly readable indices for PVM RAM $\mu$. See appendix [A](./15-the-pvm/03-the-machine.md#gp-A-1-p1).
- **$\mathbb{V}_{\mu}^*$** The set of $\mathbb{V}$alidly writable indices for PVM RAM $\mu$. See appendix [A](./15-the-pvm/03-the-machine.md#gp-A-1-p1).
- **$\bar{\mathbb{V}}_{k}\left\langle m\right\rangle$** The set of $\mathbb{V}$alid Ed25519 signatures of the key $k$ and message $m$. A subset of $\mathbb{B}_{64}$. See section [3.8](./05-hashing-and-signatures/01-hashes.md#gp-3-8-1-p1).
- **$\overset{\backsim}{\mathbb{V}}_{k}^{m}\left\langle c\right\rangle$** The set of $\mathbb{V}$alid Bandersnatch signatures of the public key $k$, context $c$ and message $m$. A subset of $\mathbb{B}_{96}$. See section [3.8](./05-hashing-and-signatures/01-hashes.md#gp-3-8-1-p1).
- **$\overset{\circ}{\mathbb{V}}_{r}^{m}\left\langle c\right\rangle$** The set of $\mathbb{V}$alid Bandersnatch RingVRF proofs of the root $r$, context $c$ and message $m$. A subset of $\mathbb{B}_{784}$. See section [3.8](./05-hashing-and-signatures/01-hashes.md#gp-3-8-1-p1).
- **$\mathbb{W}$** The set of $\mathbb{W}$ork items. See equation [14.3](./03-work-and-reports/01-a-work-package.md#eq-14-3).
- **$\mathbb{X}$** The set of deferred transfers. See equation [12.14](./17-accumulation/03-sending-a-transfer.md#eq-12-14).
- **$\mathbb{Y}$** The set of availability specifications. See equation [11.5](./03-work-and-reports/03-a-work-report.md#eq-11-5).

:::

Then the functions, the capital and calligraphic letters: the paper's own, and the ones
it borrows (hashing, signing, encoding).

::: gray-paper I.2

#### Appendix I.2 Functions {#gp-I-2}

<a id="gp-I-2-p1"></a>

- **$\Delta$** The accumulation functions (see section [12.2](./17-accumulation/04-rounds.md#gp-12-2-p1)):
  - **$\Delta_1$** The single-step accumulation function. See equation [12.23](./17-accumulation/04-rounds.md#eq-12-23).
  - **$\Delta_*$** The parallel accumulation function. See equation [12.18](./17-accumulation/01-a-blocks-accumulation.md#eq-12-18).
  - **$\Delta_+$** The full sequential accumulation function. See equation [12.17](./17-accumulation/09-the-blocks-gas-budget.md#eq-12-17).
- **$\Lambda$** The <abbr class="gp-term" title="reading a service's preimage as it was at a past slot">historical lookup</abbr> function. See equation [9.7](./14-services/01-providing-preimages.md#eq-9-7).
- **$\Xi$** The work-report computation function. See equation [14.13](./03-work-and-reports/gray-paper.md#eq-14-13).
- **$B$** The bundle assembly function. See equation [14.16](./03-work-and-reports/gray-paper.md#eq-14-16).
- **$\Upsilon$** The general state transition function. See equations [4.1](./00-start/01-what-you-will-build.md#eq-4-1), [4.5](./19-block-import/01-the-order-of-things.md#eq-4-5).
- **$\Phi$** The key-nullifier function. See equation [6.15](./08-safrole/02-rotating-the-validators.md#eq-6-15).
- **$\Psi$** The whole-program PVM machine state-transition function. See equation [A](./15-the-pvm/03-the-machine.md#gp-A-1-p1).
  - **$\Psi_1$** The single-step (PVM) machine state-transition function. See appendix [A](./15-the-pvm/03-the-machine.md#gp-A-1-p1).
  - **$\Psi_A$** The Accumulate PVM <abbr class="gp-term" title="one run of code in the PVM: Is-Authorized, refine or accumulate">invocation</abbr> function. See appendix [B](./16-host-calls/index.md#gp-B-p1).
  - **$\Psi_H$** The host-function invocation (PVM) with host-function marshalling. See appendix [A](./15-the-pvm/03-the-machine.md#gp-A-1-p1).
  - **$\Psi_I$** The <abbr class="gp-term" title="the authorizer's code, run in the PVM by the guarantors to decide if a package may use the core">Is-Authorized</abbr> PVM invocation function. See appendix [B](./16-host-calls/index.md#gp-B-p1).
  - **$\Psi_M$** The marshalling whole-program PVM machine state-transition function. See appendix [A](./15-the-pvm/03-the-machine.md#gp-A-1-p1).
  - **$\Psi_R$** The Refine PVM invocation function. See appendix [B](./16-host-calls/index.md#gp-B-p1).
- **$\Omega$** Virtual machine host-call functions. See appendix [B](./16-host-calls/index.md#gp-B-p1).
  - **$\Omega_A$** Assign-core host-call.
  - **$\Omega_B$** Empower-service host-call.
  - **$\Omega_C$** Checkpoint host-call.
  - **$\Omega_D$** Designate-validators host-call.
  - **$\Omega_E$** Export segment host-call.
  - **$\Omega_F$** Forget-preimage host-call.
  - **$\Omega_G$** Gas-remaining host-call.
  - **$\Omega_H$** Historical-lookup-preimage host-call.
  - **$\Omega_I$** Information-on-service host-call.
  - **$\Omega_J$** Eject-service host-call.
  - **$\Omega_K$** Kickoff-PVM host-call.
  - **$\Omega_L$** Lookup-preimage host-call.
  - **$\Omega_M$** Make-PVM host-call.
  - **$\Omega_N$** New-service host-call.
  - **$\Omega_O$** Poke-PVM host-call.
  - **$\Omega_P$** Peek-PVM host-call.
  - **$\Omega_Q$** Query-preimage host-call.
  - **$\Omega_R$** Read-storage host-call.
  - **$\Omega_S$** Solicit-preimage host-call.
  - **$\Omega_T$** Transfer host-call.
  - **$\Omega_U$** Upgrade-service host-call.
  - **$\Omega_W$** Write-storage host-call.
  - **$\Omega_X$** Expunge-PVM host-call.
  - **$\Omega_Y$** Fetch data host-call.
  - **$\Omega_Z$** Pages inner-PVM memory host-call.
  - **$\Omega_{\unicode{x2649}}$** Yield accumulation trie result host-call.
  - **$\Omega_{\unicode{x2648}}$** Provide preimage host-call.
  - **$\Omega_{\unicode{x264A}}$** Grow heap host-call.

:::

::: gray-paper I.3

#### Appendix I.3 Utilities, Externalities and Standard Functions {#gp-I-3}

<a id="gp-I-3-p1"></a>

- **$\mathcal{A}(\dots)$** The Merkle mountain range append function. See equation [E.8](./09-recent-history/01-the-mountain-belt.md#eq-E-8).
- **$\mathcal{B}_{n}(\dots)$** The octets-to-bits function for $n$ <abbr class="gp-term" title="bytes: 8 bits each">octets</abbr>. Superscripted ${}^{-1}$ to denote the inverse. See equation [A.15](./15-the-pvm/02-instructions.md#eq-A-15).
- **$\mathcal{C}^{v}_{n}\left(\dots\right)$** The erasure-coding function for $v$ validators and $n$ pieces. See equation [H.5](./cryptography.md#eq-H-5).
- **$\mathcal{D}(\dots)$** The original-chunk-count function. See equation [H.1](./cryptography.md#eq-H-1).
- **$\mathcal{E}_{}\left(\dots\right)$** The octet-sequence encode function. Superscripted ${}^{-1}$ to denote the inverse. See appendix [C](./02-codec/index.md#gp-C-1-p1).
- **$\mathcal{F}(\dots)$** The Fisher-Yates shuffle function. See equation [F.1](./07-time-and-shuffling/02-the-shuffle.md#eq-F-1).
- **$\mathcal{G}(L, \ell)$** The memory-sized gas function. See equation [B.17](./16-host-calls/02-fetch.md#eq-B-17).
- **$\mathcal{H}\left(\dots\right)$** The Blake 2b 256-bit hash function. See section [3.8](./05-hashing-and-signatures/01-hashes.md#gp-3-8-1-p1).
- **$\mathcal{H}_K\left(\dots\right)$** The Keccak 256-bit hash function. See section [3.8](./05-hashing-and-signatures/01-hashes.md#gp-3-8-1-p1).
- **$\mathcal{J}_{x}(\dots)$** The <abbr class="gp-term" title="a proof that some data is inside a Merkle root: the sibling hashes on the way up">justification</abbr> path to a specific $2^x$ size page of a constant-depth Merkle tree. See equation [E.5](./06-state-and-merklization/gray-paper.md#eq-E-5).
- **$\mathcal{K}\left(\dots\right)$** The domain, or set of keys, of a dictionary. See section [3.5](./reading-the-gray-paper.md#gp-3-5-p1).
- **$\mathcal{L}_{x}(\dots)$** The $2^x$ size page function for a constant-depth Merkle tree. See equation [E.6](./06-state-and-merklization/gray-paper.md#eq-E-6).
- **$\mathcal{M}\left(\dots\right)$** The constant-depth binary <abbr class="gp-term" title="hashing many values down to one root through a tree, so one 32-byte hash stands for them all">Merklization</abbr> function. See appendix [E](./06-state-and-merklization/gray-paper.md#gp-E-1-p1).
- **$\mathcal{M}_B\left(\dots\right)$** The well-balanced binary Merklization function. See appendix [E](./06-state-and-merklization/gray-paper.md#gp-E-1-p1).
- **$\mathcal{M}_\sigma\left(\dots\right)$** The state Merklization function. See appendix [D](./06-state-and-merklization/index.md#gp-D-p1).
- **$\mathcal{O}\left(\dots\right)$** The Bandersnatch ring root function. See section [3.8](./05-hashing-and-signatures/01-hashes.md#gp-3-8-1-p1) and appendix [G](./08-safrole/06-the-vrf-output.md#gp-G-p1).
- **$\mathcal{P}_{n}\left(\dots\right)$** The octet-array zero-padding function. See equation [14.19](./03-work-and-reports/gray-paper.md#eq-14-19).
- **$\mathcal{Q}_{}\left(\dots\right)$** The numeric-sequence-from-hash function. See equation [F.3](./07-time-and-shuffling/02-the-shuffle.md#eq-F-3).
- **$\mathcal{R}^{v}_{n}\left(\dots\right)$** The erasure-coding recovery function for $v$ validators and $n$ pieces. See equation [H.6](./cryptography.md#eq-H-6).
- **$\bar{\mathcal{S}}_{k}\left(\dots\right)$** The Ed25519 signing function. See section [3.8](./05-hashing-and-signatures/01-hashes.md#gp-3-8-1-p1).
- **$\overset{\mathrm{B\!L\!S}}{\mathcal{S}}_{k}\left(\dots\right)$** The BLS signing function. See section [3.8](./05-hashing-and-signatures/01-hashes.md#gp-3-8-1-p1).
- **$\mathcal{T}$** The current time expressed in seconds after the start of the JAM Common Era. See section [4.4](./00-start/04-the-jam-clock.md#gp-4-4-p1).
- **$\mathcal{U}\left(\dots\right)$** The substitute-if-nothing function. See equation [3.2](./reading-the-gray-paper.md#eq-3-2).
- **$\mathcal{V}\left(\dots\right)$** The range, or set of values, of a dictionary or sequence. See section [3.5](./reading-the-gray-paper.md#gp-3-5-p1).
- **$\mathcal{X}_{n}\left(\dots\right)$** The signed-extension function for a value in $\mathbb{N}_{2^{8n}}$. See equation [A.19](./15-the-pvm/02-instructions.md#eq-A-19).
- **$\mathcal{Y}\left(\dots\right)$** The alias/output/entropy function of a Bandersnatch VRF signature/proof. See section [3.8](./05-hashing-and-signatures/01-hashes.md#gp-3-8-1-p1) and appendix [G](./08-safrole/06-the-vrf-output.md#gp-G-p1).
- **$\mathcal{Z}_{n}(\dots)$** The into-signed function for a value in $\mathbb{N}_{2^{8n}}$. Superscripted with ${}^{-1}$ to denote the inverse. See equation [A.13](./15-the-pvm/02-instructions.md#eq-A-13).

:::

Then the values: what a block carries, the state's letters, the PVM's parts, the
constants, the gas costs of the host calls, and the signing contexts, the short strings
signed with every message so that a signature made for one purpose can't be reused for
another.

::: gray-paper I.4.1

#### Appendix I.4.1 Block-context Terms {#gp-I-4-1}

<a id="gp-I-4-1-p1"></a>These terms are all contextualized to a single block. They may be superscripted with some other term to alter the context and reference some other block.

<a id="gp-I-4-1-p2"></a>

- **$\mathbf{A}$** The ancestor set of the block. See equation [5.3](./05-hashing-and-signatures/01-hashes.md#eq-5-3).
- **$\mathbf{B}$** The block. See equation [4.2](./19-block-import/04-importing-a-block.md#eq-4-2).
- **$\mathbf{E}$** The block extrinsic. See equation [4.3](./19-block-import/04-importing-a-block.md#eq-4-3).
- **$\mathbf{F}_{v}$** The BEEFY signed <abbr class="gp-term" title="a short hash that stands for some data, so the data can be checked against it later">commitment</abbr> of validator $v$. See equation [18.1](./what-runs-where.md#eq-18-1).
- **$\mathbf{G}$** The set of Ed25519 guarantor keys who made a work-report. See equation [11.28](./12-guarantees/02-signed-and-counted.md#eq-11-28).
- **$\mathbf{H}$** The block header. See equation [5.1](./04-blocks/06-the-header.md#eq-5-1).
- **$\mathbf{S}$** Service-indexed accumulation statistics for this block. See equations [12.27](./17-accumulation/01-a-blocks-accumulation.md#eq-12-27) and [12.28](./17-accumulation/01-a-blocks-accumulation.md#eq-12-28).
- **$\mathbf{M}$** The current core assignments. See section [11.3](./12-guarantees/01-who-guarantees-what.md#gp-11-3-p1).
- **$\mathbf{M}^*$** The core assignments in the previous rotation. See section [11.3](./12-guarantees/01-who-guarantees-what.md#gp-11-3-p1).
- **$\mathbf{R}$** The sequence of work-reports which have now become available and ready for accumulation. See equation [11.17](./11-assurances/01-available.md#eq-11-17).
- **$\mathbf{T}$** The ticketed condition, true if the block was sealed with a ticket signature rather than a fallback. See equations [6.16](./08-safrole/09-seals.md#eq-6-16) and [6.17](./08-safrole/09-seals.md#eq-6-17).
- **$\mathbf{U}$** The audit condition, equal to $\top$ once the block is audited. See section [17](./what-runs-where.md#gp-17-p1).

<a id="gp-I-4-1-p3"></a>Without any superscript, the block is assumed to the block being imported or, if no block is being imported, the head of the best chain (see section [19](./what-runs-where.md#gp-19-p1)). Explicit block-contextualizing superscripts include:

<a id="gp-I-4-1-p4"></a>

- **$\mathbf{B}^\natural$** The latest <abbr class="gp-term" title="voted final by GRANDPA: never undone">finalized</abbr> block. See equation [19](./what-runs-where.md#gp-19-p1).
- **$\mathbf{B}^\flat$** The block at the head of the best chain. See equation [19](./what-runs-where.md#gp-19-p1).

:::

::: gray-paper I.4.2

#### Appendix I.4.2 State components {#gp-I-4-2}

<a id="gp-I-4-2-p1"></a>Here, the prime annotation indicates <abbr class="gp-term" title="after the change: the value once it is made, written with a prime (α′); for state, after the block">posterior</abbr> state. Individual components may be identified with a letter subscript.

<a id="gp-I-4-2-p2"></a>

- **$\alpha$** The core $\alpha$uthorizations pool. See equation [8.1](./13-authorization/01-the-authorizer-pools.md#eq-8-1).
- **$\beta$** Log of recent activity. See equation [7.1](./09-recent-history/02-recent-blocks.md#eq-7-1).
  - **$\beta_H$** Information on the most recent blocks. See equation [7.2](./09-recent-history/02-recent-blocks.md#eq-7-2).
  - **$\beta_B$** The Merkle mountain belt for accumulating Accumulation outputs. See equations [7.3](./09-recent-history/02-recent-blocks.md#eq-7-3) and [7.7](./09-recent-history/01-the-mountain-belt.md#eq-7-7).
- **$\gamma$** State concerning Safrole. See equation [6.3](./08-safrole/05-one-step-of-safrole.md#eq-6-3).
  - **$\gamma_A$** The sealing lottery ticket accumulator. See equation [6.5](./08-safrole/04-the-lotterys-winners.md#eq-6-5).
  - **$\gamma_P$** The keys for the validators of the next epoch, equivalent to those keys which constitute $\gamma_Z$. See equation [6.7](./08-safrole/02-rotating-the-validators.md#eq-6-7).
  - **$\gamma_S$** The <abbr class="gp-term" title="who may seal each slot of an epoch: E tickets, or E keys">slot-sealer sequence</abbr> of the current epoch. See equation [6.5](./08-safrole/04-the-lotterys-winners.md#eq-6-5).
  - **$\gamma_Z$** The Bandersnatch root for the current epoch's ticket submissions. See equation [6.4](./08-safrole/08-the-ring-root.md#eq-6-4).
- **$\delta$** The (prior) state of the service accounts. See equation [9.1](./14-services/02-the-service-account.md#eq-9-1).
  - **$\delta^\dagger$** The post-accumulation, pre-preimage integration intermediate state. See equation [12.26](./17-accumulation/09-the-blocks-gas-budget.md#eq-12-26).
- **$\eta$** The entropy accumulator and epochal randomness. See equation [6.22](./07-time-and-shuffling/01-epochs.md#eq-6-22).
- **$\iota$** The validator keys and metadata to be drawn from next. See equation [6.7](./08-safrole/02-rotating-the-validators.md#eq-6-7).
- **$\kappa$** The validator keys and metadata currently active. See equation [6.7](./08-safrole/02-rotating-the-validators.md#eq-6-7).
- **$\lambda$** The validator keys and metadata which were active in the prior epoch. See equation [6.7](./08-safrole/02-rotating-the-validators.md#eq-6-7).
- **$\rho$** The availability assignments. A core's <abbr class="gp-term" title="a guaranteed report waiting on its core until enough validators hold its pieces">availability assignment</abbr> is the work-report guarantee which is being made available prior to accumulation. See equation [11.1](./11-assurances/01-available.md#eq-11-1).
  - **$\rho^\dagger$** The post-judgment, pre-assurances-extrinsic intermediate state. See equation [10.14](./10-disputes/03-clearing-the-cores.md#eq-10-14).
  - **$\rho^\ddagger$** The post-assurances-extrinsic, pre-guarantees-extrinsic intermediate state. See equation [11.18](./11-assurances/02-timeouts.md#eq-11-18).
- **$\sigma$** The overall state of the system. See equations [4.1](./00-start/01-what-you-will-build.md#eq-4-1), [4.4](./00-start/06-how-a-block-is-imported.md#eq-4-4).
- **$\tau$** The most recent block's timeslot. See equation [6.1](./07-time-and-shuffling/01-epochs.md#eq-6-1).
- **$\phi$** The authorization queue. See equation [8.1](./13-authorization/01-the-authorizer-pools.md#eq-8-1).
- **$\psi$** Past judgments on work-reports and validators. See equation [10.1](./10-disputes/01-votes-and-verdicts.md#eq-10-1).
  - **$\psi_B$** Work-reports judged to be incorrect. See equation [10.16](./10-disputes/01-votes-and-verdicts.md#eq-10-16).
  - **$\psi_G$** Work-reports judged to be correct. See equation [10.15](./10-disputes/01-votes-and-verdicts.md#eq-10-15).
  - **$\psi_W$** Work-reports whose validity is judged to be unknowable. See equation [10.17](./10-disputes/01-votes-and-verdicts.md#eq-10-17).
  - **$\psi_O$** Validators who made a judgment found to be incorrect. See equation [10.18](./10-disputes/01-votes-and-verdicts.md#eq-10-18).
- **$\chi$** The privileged service indices. See equation [9.9](./17-accumulation/05-privileges.md#eq-9-9).
  - **$\chi_M$** The index of the blessed service. See equation [12.26](./17-accumulation/09-the-blocks-gas-budget.md#eq-12-26).
  - **$\chi_A$** The indices of the services able to assign each core's authorizer queue. See equation [12.26](./17-accumulation/09-the-blocks-gas-budget.md#eq-12-26).
  - **$\chi_V$** The index of the designate service. See equation [12.26](./17-accumulation/09-the-blocks-gas-budget.md#eq-12-26).
  - **$\chi_R$** The index of the registrar service. See equation [12.26](./17-accumulation/09-the-blocks-gas-budget.md#eq-12-26).
  - **$\chi_Z$** The always-accumulate service indices and their basic gas allowance. See equation [12.26](./17-accumulation/09-the-blocks-gas-budget.md#eq-12-26).
- **$\pi$** The activity statistics for the validators. See equation [13.1](./18-statistics/01-who-did-what.md#eq-13-1).
- **$\omega$** The accumulation queue. See equation [12.3](./17-accumulation/02-waiting-reports.md#eq-12-3).
- **$\xi$** The accumulation history. See equation [12.1](./17-accumulation/02-waiting-reports.md#eq-12-1).
- **$\theta$** The most recent Accumulation outputs. See equations [7.4](./09-recent-history/02-recent-blocks.md#eq-7-4) and [12.24](./17-accumulation/09-the-blocks-gas-budget.md#eq-12-24).

:::

::: gray-paper I.4.3

#### Appendix I.4.3 Virtual Machine components {#gp-I-4-3}

<a id="gp-I-4-3-p1"></a>

- **$\varepsilon$** The exit-reason resulting from all machine state transitions.
- **$\nu$** The immediate values of an instruction.
- **$\mu$** The memory sequence; a member of the set $\mathbb{M}$.
- **$\varrho$** The gas counter.
- **$\varphi$** The registers.
- **$\zeta$** The instruction sequence.
- **$\varpi$** The sequence of basic blocks of the program.
- **$\imath$** The instruction counter.

:::

::: gray-paper I.4.4

#### Appendix I.4.4 Constants {#gp-I-4-4}

<a id="gp-I-4-4-p1"></a>

- **$\mathsf{A} = 8$** The period, in seconds, between audit tranches. See section [17.3](./what-runs-where.md#gp-17-3-p1).
- **$\mathsf{B}_I = 10$** The additional minimum balance required per item of elective service state. See equation [9.8](./14-services/02-the-service-account.md#eq-9-8).
- **$\mathsf{B}_L = 1$** The additional minimum balance required per octet of elective service state. See equation [9.8](./14-services/02-the-service-account.md#eq-9-8).
- **$\mathsf{B}_S = 100$** The basic minimum balance which all services require. See equation [9.8](./14-services/02-the-service-account.md#eq-9-8).
- **$\mathsf{C} = 341$** The total number of cores.
- **$\mathsf{D} = 19,200$** The period in timeslots after which an unreferenced preimage may be expunged. See `eject` definition in section [B.7](./16-host-calls/09-asking-for-preimages.md#gp-B-7-p1).
- **$\mathsf{E} = 600$** The length of an epoch in timeslots. See section [4.8](./00-start/04-the-jam-clock.md#gp-4-8-p1).
- **$\mathsf{F} = 2$** The audit bias factor, the expected number of additional validators who will audit a work-report in the following <abbr class="gp-term" title="one 8-second round of auditing; each new one can bring in more auditors">tranche</abbr> for each <abbr class="gp-term" title="an auditor who announced an audit but hasn't voted yet">no-show</abbr> in the previous. See equation [17.13](./what-runs-where.md#eq-17-13).
- **$\mathsf{G}_A = 10,000,000$** The gas allocated to invoke a work-report's Accumulation logic.
- **$\mathsf{G}_I = 50,000,000$** The gas allocated to invoke a work-package's Is-Authorized logic.
- **$\mathsf{G}_R = 5,000,000,000$** The gas allocated to invoke a work-package's Refine logic.
- **$\mathsf{G}_T = 3,500,000,000$** The total gas allocated across for all Accumulation. Should be no smaller than $\mathsf{G}_A\cdot\mathsf{C} + \sum_{g \in \mathcal{V}\left(\chi_Z\right)}(g)$.
- **$\mathsf{H} = 8$** The size of recent history, in blocks. See equation [7.8](./09-recent-history/02-recent-blocks.md#eq-7-8).
- **$\mathsf{I} = 16$** The maximum amount of work items in a package. See equations [11.2](./03-work-and-reports/03-a-work-report.md#eq-11-2) and [14.2](./03-work-and-reports/01-a-work-package.md#eq-14-2).
- **$\mathsf{J} = 8$** The maximum sum of dependency items in a work-report. See equation [11.3](./12-guarantees/05-bad-reports.md#eq-11-3).
- **$\mathsf{K} = 16$** The maximum number of tickets which may be submitted in a single extrinsic. See equation [6.31](./08-safrole/07-entering-tickets.md#eq-6-31).
- **$\mathsf{L} = 14,400$** The maximum age in timeslots of the lookup anchor. See equation [11.37](./12-guarantees/05-bad-reports.md#eq-11-37).
- **$\mathsf{M}$** Host-function gas costs, see below.
- **$\mathsf{N}_V = 16$** The maximum number of verdicts which may be included in a single extrinsic. See equation [10.2](./10-disputes/01-votes-and-verdicts.md#eq-10-2).
- **$\mathsf{N}_O = 16$** The maximum number each of culprits or faults which may be included in a single extrinsic. See equation [10.2](./10-disputes/01-votes-and-verdicts.md#eq-10-2).
- **$\mathsf{O} = 8$** The maximum number of items in the authorizations pool. See equation [8.1](./13-authorization/01-the-authorizer-pools.md#eq-8-1).
- **$\mathsf{P} = 6$** The slot period, in seconds. See equation [4.8](./00-start/04-the-jam-clock.md#gp-4-8-p1).
- **$\mathsf{Q} = 80$** The number of items in the authorizations queue. See equation [8.1](./13-authorization/01-the-authorizer-pools.md#eq-8-1).
- **$\mathsf{R} = 10$** The rotation period of validator-core assignments, in timeslots. See sections [11.3](./12-guarantees/01-who-guarantees-what.md#gp-11-3-p1) and [11.4](./12-guarantees/index.md#gp-11-4-p1).
- **$\mathsf{S} = 2^{16}$** The minimum public service index. Services of indices below these may only be created by the Registrar. See equation [B.14](./16-host-calls/06-checkpoints.md#eq-B-14).
- **$\mathsf{T} = 128$** The maximum number of extrinsics in a work-package. See equation [14.5](./03-work-and-reports/gray-paper.md#eq-14-5).
- **$\mathsf{U} = 5$** The period in timeslots after which reported but unavailable work is cleared. See equation [11.18](./11-assurances/02-timeouts.md#eq-11-18).
- **$\mathsf{W}_A = 64,000$** The maximum size of is-authorized code in octets. See equation [B.1](./16-host-calls/index.md#eq-B-1).
- **$\mathsf{W}_B = 13,791,360$** The maximum size of the concatenated variable-size blobs, extrinsics and imported segments of a work-package, in octets. See equation [14.6](./03-work-and-reports/gray-paper.md#eq-14-6).
- **$\mathsf{W}_C = 4,000,000$** The maximum size of service code in octets. See equations [B.5](./16-host-calls/gray-paper.md#eq-B-5), [B.9](./16-host-calls/06-checkpoints.md#eq-B-9) &amp; ??.
- **$\mathsf{W}_G = 4104$** The size of a segment in octets. See section [14.2.1](./03-work-and-reports/gray-paper.md#gp-14-2-1-p1).
- **$\mathsf{W}_F = \mathsf{W}_G + 32\left\lceil\log_2(\mathsf{W}_X)\right\rceil = 4488$** The additional footprint in the Audits DA of a single imported segment. See equation [14.7](./03-work-and-reports/gray-paper.md#eq-14-7).
- **$\mathsf{W}_M = 3,072$** The maximum number of imports in a work-package. See equation [14.5](./03-work-and-reports/gray-paper.md#eq-14-5).
- **$\mathsf{W}_R = 48\cdot2^{10}$** The maximum total size of all unbounded blobs in a work-report, in octets. See equation [11.8](./12-guarantees/05-bad-reports.md#eq-11-8).
- **$\mathsf{W}_T = 128$** The size of a transfer memo in octets. See equation [12.14](./17-accumulation/03-sending-a-transfer.md#eq-12-14).
- **$\mathsf{W}_X = 3,072$** The maximum number of exports in a work-package. See equation [14.5](./03-work-and-reports/gray-paper.md#eq-14-5).
- **$\mathsf{X}$** Context strings, see below.
- **$\mathsf{Y} = 500$** The number of slots into an epoch at which ticket-submission ends. See sections [6.5](./08-safrole/04-the-lotterys-winners.md#gp-6-5-p1), [6.6](./08-safrole/05-one-step-of-safrole.md#gp-6-6-p1) and [6.7](./08-safrole/07-entering-tickets.md#gp-6-7-p1).
- **$\mathsf{Z}_A = 2$** The PVM dynamic address alignment factor. See equation [A.22](./15-the-pvm/03-the-machine.md#eq-A-22).
- **$\mathsf{Z}_I = 2^{24}$** The standard PVM program initialization input data size. See equation [A.7](./15-the-pvm/01-the-program-blob.md#gp-A-7-p1).
- **$\mathsf{Z}_P = 2^{12}$** The PVM memory page size. See equation [4.24](./what-runs-where.md#eq-4-24).
- **$\mathsf{Z}_Z = 2^{16}$** The standard PVM program initialization zone size. See section [A.7](./15-the-pvm/01-the-program-blob.md#gp-A-7-p1).

:::

::: gray-paper I.4.5

#### Appendix I.4.5 Host-function gas costs {#gp-I-4-5}

<a id="gp-I-4-5-p1"></a>These constants are used in the host function gas cost equations in appendix [B](./16-host-calls/index.md#gp-B-p1). The constant term for the host function $\Omega_\square$ is denoted $\mathsf{M}_{\square,c}$, or simply $\mathsf{M}_\square$ if there are no other terms. The octet-linear term, if there is one, is denoted $\mathsf{M}_{\square,\ell}$ and specifies gas per 1024 octets. The page-linear term, again optional, is denoted $\mathsf{M}_{\square,p}$ and specifies gas per page. The gas for a host call with constant term $c$ and octet-linear term $L$ with $\ell$ octets is $c + \mathcal{G}(L, \ell)$ (see equation [B.17](./16-host-calls/02-fetch.md#eq-B-17)).

<a id="gp-I-4-5-p2"></a>

- **$\mathsf{M}_{\emptyset} = 1000$** Gas cost charged for an unknown host-call.
- **$\mathsf{M}_A = 1818$** $\Omega_A$ (`assign`) base gas cost.
- **$\mathsf{M}_{B,c} = 422$** $\Omega_B$ (`bless`) base gas cost.
- **$\mathsf{M}_{B,\ell} = 20$** $\Omega_B$ (`bless`) gas per item.
- **$\mathsf{M}_C = 103$** $\Omega_C$ (`checkpoint`) base gas cost.
- **$\mathsf{M}_{D,c} = 1100$** $\Omega_D$ (`designate`) base gas cost.
- **$\mathsf{M}_{D,\ell} = 302$** $\Omega_D$ (`designate`) gas per validator.
- **$\mathsf{M}_E = 3521$** $\Omega_E$ (`export`) base gas cost.
- **$\mathsf{M}_F = 3250$** $\Omega_F$ (`forget`) base gas cost.
- **$\mathsf{M}_G = 48$** $\Omega_G$ (`gas`) base gas cost.
- **$\mathsf{M}_{H,c} = 1125$** $\Omega_H$ (`historical_lookup`) base gas cost.
- **$\mathsf{M}_{H,\ell} = 264$** $\Omega_H$ (`historical_lookup`) gas per 1024 octets ($\mathcal{G}(\mathsf{M}_{H,\ell}, \ell)$).
- **$\mathsf{M}_I = 703$** $\Omega_I$ (`info`) base gas cost.
- **$\mathsf{M}_J = 458$** $\Omega_J$ (`eject`) base gas cost.
- **$\mathsf{M}_K = 968$** $\Omega_K$ (`invoke`) base gas cost.
- **$\mathsf{M}_{L,c} = 600$** $\Omega_L$ (`lookup`) base gas cost.
- **$\mathsf{M}_{L,\ell} = 248$** $\Omega_L$ (`lookup`) gas per 1024 octets ($\mathcal{G}(\mathsf{M}_{L,\ell}, \ell)$).
- **$\mathsf{M}_{M,c} = 1862$** $\Omega_M$ (`machine`) base gas cost.
- **$\mathsf{M}_{M,\ell} = 112$** $\Omega_M$ (`machine`) gas per 1024 octets, program size ($\mathcal{G}(\mathsf{M}_{M,\ell}, \ell)$).
- **$\mathsf{M}_N = 3855$** $\Omega_N$ (`new`) base gas cost.
- **$\mathsf{M}_{O,c} = 297$** $\Omega_O$ (`poke`) base gas cost.
- **$\mathsf{M}_{O,\ell} = 224$** $\Omega_O$ (`poke`) gas per 1024 octets ($\mathcal{G}(\mathsf{M}_{O,\ell}, \ell)$).
- **$\mathsf{M}_{P,c} = 377$** $\Omega_P$ (`peek`) base gas cost.
- **$\mathsf{M}_{P,\ell} = 336$** $\Omega_P$ (`peek`) gas per 1024 octets ($\mathcal{G}(\mathsf{M}_{P,\ell}, \ell)$).
- **$\mathsf{M}_Q = 643$** $\Omega_Q$ (`query`) base gas cost.
- **$\mathsf{M}_{R,c} = 2407$** $\Omega_R$ (`read`) base gas cost.
- **$\mathsf{M}_{R,\mathrm{k},\ell} = 1736$** $\Omega_R$ (`read`) key gas per 1024 octets ($\mathcal{G}(\mathsf{M}_{R,\mathrm{k},\ell}, \ell)$).
- **$\mathsf{M}_{R,\mathrm{v},\ell} = 248$** $\Omega_R$ (`read`) value gas per 1024 octets ($\mathcal{G}(\mathsf{M}_{R,\mathrm{v},\ell}, \ell)$).
- **$\mathsf{M}_S = 2193$** $\Omega_S$ (`solicit`) base gas cost.
- **$\mathsf{M}_T = 575$** $\Omega_T$ (`transfer`) base gas cost.
- **$\mathsf{M}_U = 1028$** $\Omega_U$ (`upgrade`) base gas cost.
- **$\mathsf{M}_{W,c} = 2442$** $\Omega_W$ (`write`) base gas cost.
- **$\mathsf{M}_{W,\mathrm{v},\ell} = 216$** $\Omega_W$ (`write`) gas per 1024 octets ($\mathcal{G}(\mathsf{M}_{W,\mathrm{v},\ell}, \ell)$).
- **$\mathsf{M}_{W,\mathrm{k},\ell} = 3358$** $\Omega_W$ (`write`) key gas per 1024 octets ($\mathcal{G}(\mathsf{M}_{W,\mathrm{k},\ell}, \ell)$).
- **$\mathsf{M}_X = 335$** $\Omega_X$ (`expunge`) base gas cost.
- **$\mathsf{M}_{Y,0,c} = 390, \mathsf{M}_{Y,0,\ell} = 0$** $\Omega_Y$ (`fetch`) case 0: protocol parameters.
- **$\mathsf{M}_{Y,1,c} = 103, \mathsf{M}_{Y,1,\ell} = 0$** $\Omega_Y$ (`fetch`) case 1: entropy.
- **$\mathsf{M}_{Y,2,c} = 80, \mathsf{M}_{Y,2,\ell} = 96$** $\Omega_Y$ (`fetch`) case 2: auth trace.
- **$\mathsf{M}_{Y,3,c} = 85, \mathsf{M}_{Y,3,\ell} = 96$** $\Omega_Y$ (`fetch`) case 3: any extrinsic, by index.
- **$\mathsf{M}_{Y,4,c} = 85, \mathsf{M}_{Y,4,\ell} = 96$** $\Omega_Y$ (`fetch`) case 4: our extrinsic, by index.
- **$\mathsf{M}_{Y,5,c} = 171, \mathsf{M}_{Y,5,\ell} = 0$** $\Omega_Y$ (`fetch`) case 5: any import, by index.
- **$\mathsf{M}_{Y,6,c} = 171, \mathsf{M}_{Y,6,\ell} = 0$** $\Omega_Y$ (`fetch`) case 6: our import, by index.
- **$\mathsf{M}_{Y,7,c} = 85, \mathsf{M}_{Y,7,\ell} = 96$** $\Omega_Y$ (`fetch`) case 7: encoded work-package.
- **$\mathsf{M}_{Y,8,c} = 84, \mathsf{M}_{Y,8,\ell} = 0$** $\Omega_Y$ (`fetch`) case 8: auth config.
- **$\mathsf{M}_{Y,9,c} = 88, \mathsf{M}_{Y,9,\ell} = 0$** $\Omega_Y$ (`fetch`) case 9: auth token.
- **$\mathsf{M}_{Y,10,c} = 111, \mathsf{M}_{Y,10,\ell} = 0$** $\Omega_Y$ (`fetch`) case 10: refine context.
- **$\mathsf{M}_{Y,11,c} = 317, \mathsf{M}_{Y,11,\ell} = 0$** $\Omega_Y$ (`fetch`) case 11: items summary.
- **$\mathsf{M}_{Y,12,c} = 250, \mathsf{M}_{Y,12,\ell} = 0$** $\Omega_Y$ (`fetch`) case 12: any item summary.
- **$\mathsf{M}_{Y,13,c} = 95, \mathsf{M}_{Y,13,\ell} = 96$** $\Omega_Y$ (`fetch`) case 13: any payload.
- **$\mathsf{M}_{Y,14,c} = 287, \mathsf{M}_{Y,14,\ell} = 400$** $\Omega_Y$ (`fetch`) case 14: accumulate items.
- **$\mathsf{M}_{Y,15,c} = 355, \mathsf{M}_{Y,15,\ell} = 344$** $\Omega_Y$ (`fetch`) case 15: any accumulate item.
- **$\mathsf{M}_{Y,\emptyset,c} = 80, \mathsf{M}_{Y,\emptyset,\ell} = 0$** $\Omega_Y$ (`fetch`) otherwise: nothing.
- **$\mathsf{M}_{Z,a,c} = 275$** $\Omega_Z$ (`pages`) alloc base gas cost.
- **$\mathsf{M}_{Z,a,p} = 121$** $\Omega_Z$ (`pages`) alloc gas per page.
- **$\mathsf{M}_{Z,f,c} = 212$** $\Omega_Z$ (`pages`) free base gas cost.
- **$\mathsf{M}_{Z,f,p} = 118$** $\Omega_Z$ (`pages`) free gas per page.
- **$\mathsf{M}_{Z,s,c} = 130$** $\Omega_Z$ (`pages`) setmode base gas cost.
- **$\mathsf{M}_{Z,s,p} = 29$** $\Omega_Z$ (`pages`) setmode gas per page.
- **$\mathsf{M}_{Z,i} = 80$** $\Omega_Z$ (`pages`) invalid-$r$ base gas cost.
- **$\mathsf{M}_{\unicode{x2649}} = 98$** $\Omega_{\unicode{x2649}}$ (`yield`) base gas cost.
- **$\mathsf{M}_{\unicode{x2648},c} = 3980$** $\Omega_{\unicode{x2648}}$ (`provide`) base gas cost.
- **$\mathsf{M}_{\unicode{x2648},\ell} = 2264$** $\Omega_{\unicode{x2648}}$ (`provide`) gas per 1024 octets ($\mathcal{G}(\mathsf{M}_{\unicode{x2648},\ell}, \ell)$).
- **$\mathsf{M}_{\unicode{x264A},c} = 275$** $\Omega_{\unicode{x264A}}$ (`grow_heap`) base gas cost.
- **$\mathsf{M}_{\unicode{x264A},p} = 121$** $\Omega_{\unicode{x264A}}$ (`grow_heap`) gas per additional page.

:::

::: gray-paper I.4.6

#### Appendix I.4.6 Signing Contexts {#gp-I-4-6}

<a id="gp-I-4-6-p1"></a>

- **$\mathsf{X}_A = \texttt{\$jam\_available}$** *Ed25519* Availability assurances. See equation [11.14](./11-assurances/03-bad-assurances.md#eq-11-14).
- **$\mathsf{X}_B = \texttt{\$jam\_beefy}$** *BLS* Accumulate-result-root-MMR commitment. See equation [18.1](./what-runs-where.md#eq-18-1).
- **$\mathsf{X}_E = \texttt{\$jam\_entropy}$** On-chain entropy generation. See equation [6.18](./08-safrole/09-seals.md#eq-6-18).
- **$\mathsf{X}_F = \texttt{\$jam\_fallback\_seal}$** *Bandersnatch* Fallback block seal. See equation [6.17](./08-safrole/09-seals.md#eq-6-17).
- **$\mathsf{X}_G = \texttt{\$jam\_guarantee}$** *Ed25519* Guarantee statements. See equation [11.28](./12-guarantees/02-signed-and-counted.md#eq-11-28).
- **$\mathsf{X}_I = \texttt{\$jam\_announce}$** *Ed25519* Audit announcement statements. See equation [17.7](./what-runs-where.md#eq-17-7).
- **$\mathsf{X}_T = \texttt{\$jam\_ticket\_seal}$** *Bandersnatch RingVRF* Ticket generation and regular block seal. See equation [6.16](./08-safrole/09-seals.md#eq-6-16).
- **$\mathsf{X}_U = \texttt{\$jam\_audit}$** *Bandersnatch* Audit selection entropy. See equations [17.3](./what-runs-where.md#eq-17-3) and [17.13](./what-runs-where.md#eq-17-13).
- **$\mathsf{X}_\top = \texttt{\$jam\_valid}$** *Ed25519* Judgments for valid work-reports. See equation [17.17](./what-runs-where.md#eq-17-17).
- **$\mathsf{X}_\bot = \texttt{\$jam\_invalid}$** *Ed25519* Judgments for invalid work-reports. See equation [17.17](./what-runs-where.md#eq-17-17).

:::
