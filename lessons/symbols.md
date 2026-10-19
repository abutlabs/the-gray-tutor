# Gray Paper symbols

The Gray Paper writes its rules in maths. This page is the key to it: every symbol the
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
| κ | kappa | the validators | [6.2](./06-state-and-merklization/02-state-keys.md) |
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
- **Gray Paper:** standard maths, so the Gray Paper uses it without defining it.
- **In code:** `%`, or `& 0xffn` for mod 256 ([lesson 2.1](./02-codec/01-fixed-width-integers.md)).

### ⌊ ⌋: floor {#floor}

- **Say it:** "floor": ⌊x / 256⌋ is "floor of x over 256".
- **Means:** round down to a whole number.
- **Example:** ⌊4,807 / 256⌋ = ⌊18.78…⌋ = 18.
- **Gray Paper:** standard maths, used without a definition.
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
- **Gray Paper:** standard maths. §3 uses it for sequences too: a sequence of T is
  *"a partial mapping ℕ → T"*, from positions to items.

### ↦: maps to {#maps-to}

- **Say it:** "maps to", or "becomes".
- **Means:** what a function does to its input: x ↦ ... is "x becomes ...".
- **Example:** x ↦ [x mod 256] ⌢ ... is "x becomes its lowest byte, followed by ...".
- **In code:** the function's body.
- **Gray Paper:** standard maths. The state uses it for its keys too: C(11) ↦ ℰ₄(τ),
  "key 11 holds the time as four bytes" (Appendix D, [lesson
  6.3](./06-state-and-merklization/03-reading-the-state.md)).

### ∈: in {#in}

- **Say it:** "in", or "is a".
- **Means:** belongs to a set.
- **Example:** l ∈ ℕ₈ is "l is one of 0 to 7".
- **Gray Paper:** standard maths, on nearly every page.

### ∃: there exists {#exists}

- **Say it:** "there exists", or "there is some".
- **Means:** at least one value makes the statement after the colon true.
- **Example:** $\exists l \in \mathbb{N}_8 : 2^{7l} \le x < 2^{7(l+1)}$ is "there is some l
  from 0 to 7 with x at least $2^{7l}$ and below $2^{7(l+1)}$". For x = 300, that's l = 1.
- **Gray Paper:** standard maths.

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
