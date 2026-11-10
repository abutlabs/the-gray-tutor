// The symbols Appendix A, the PVM first uses, in plain words (gray-paper-glosses.ts says how a
// key is made from them). Each entry: how to say it aloud, and what it means, in a line a
// reader new to the paper can follow; "skip" for typography a key needn't explain.

import type { Glosses } from "../gray-paper-glosses.ts";

export const SA: Glosses = {
  // the machine and its state (A.1)
  // \text{deblob}
  deblob: { say: "deblob", means: "cuts a program blob into its code 𝐜, bitmask 𝐤 and jump table 𝐣, checking it is well formed; ∇ if it isn't" },
  // \imath
  // paper: The instruction counter.
  imath: { say: "i", means: "the instruction counter: the index in the code of the instruction to run next" },
  // \left[\!\left[\mathbb{N}_R\right]\!\right]_{13}
  regs: { say: "thirteen registers", means: "a sequence of 13 register values, each a u64" },
  // \mathfrak{p}
  "pvm¬blob": { say: "p (gothic)", means: "a PVM program blob: the jump table, the code and the bitmask, packed as bytes" },
  // \tilde{\varrho}
  gaschargedflag: { say: "rho tilde", means: "the gas flag: true once the basic block the machine is in has been paid for" },
  // {\mu}
  mem: { say: "mu", means: "the PVM's memory: 2^32 bytes in pages of 4,096, each page readable, writable or neither" },
  // \varepsilon
  // paper: The exit-reason resulting from all machine state transitions.
  varepsilon: { say: "epsilon", means: "the exit reason: how a step or a run ended, from carry on to halt, panic, out of gas, fault or host call" },
  // \blacktriangleright
  continue: { say: "continue", means: "▸: the step went normally, and the next one may run" },
  //  \left\{ \begin{array}{@{}l@{}} \begin{aligned} x \end{aligned} \\[14pt] \hspace{8pt}\begin{aligned} y \end{aligned} \end{array} \right.
  abracegrouptwo: { say: "as follows", means: "a brace grouping lines that hold together: a function's type, what each input becomes, then its helpers below" },
  // \mathfrak
  mathfrak: "skip",
  // \land
  land: { say: "and", means: "both sides are true" },
  // \emph
  emph: "skip",

  // instructions and blocks (A.2, A.3)
  // \text{skip}
  Fskip: { say: "skip", means: "skip(i): how many bytes follow the opcode at i before the next opcode, at most 24" },
  // \min
  min: { say: "the least of", means: "the smallest of the values given; min(24, j : …) is the smallest j that fits, but no more than 24" },
  // \zeta
  instructions: { say: "zeta", means: "the code 𝐜 with zeros after it forever: reading past the end gives 0, which is trap" },
  // \varpi
  basicblocks: { say: "pi (curly)", means: "where basic blocks start: at 0, and just after every terminator" },
  // \mathfrak{L}
  startofbasicblock: { say: "L (gothic)", means: "𝔏(ı): the start of the basic block that ı is in" },
  // \varrho^{\Delta}
  gascostforblock: { say: "rho delta", means: "a basic block's gas cost: its cycles on the model CPU, less 3, and at least 1" },

  // one step (A.4)
  // \mu
  mu: { say: "mu", means: "the PVM's memory" },
  // \neq
  neq: { say: "is not", means: "not equal" },
  // \lor
  lor: { say: "or", means: "at least one side is true" },
  // \mathcal{Z}_{x}
  signfunc: { say: "Z sub n", means: "an n-byte number read as signed: the byte 0xff is −1" },
  // \mathcal{Z}_{x}^{-1}
  unsignfunc: { say: "Z sub n inverse", means: "a signed number put back into n bytes: −1 becomes 0xff" },
  // \mathcal{B}_{x}
  bitsfunc: { say: "B sub n", means: "a number of n bytes as its 8n bits, the lowest first" },
  // \mathcal{B}_{x}^{-1}
  unbitsfunc: { say: "B sub n inverse", means: "8n bits, the lowest first, back into a number" },
  // \overleftarrow{\mathcal{B}}_{x}
  revbitsfunc: { say: "B sub n reversed", means: "a number of n bytes as its 8n bits, the highest first, as people write numbers" },
  // \overleftarrow{\mathcal{B}}_{x}^{-1}
  revunbitsfunc: { say: "B sub n reversed, inverse", means: "8n bits, the highest first, back into a number" },
  // \mathcal{X}_{x}
  fnsext: { say: "X sub n", means: "sign extension: an n-byte number stretched to 64 bits, its top bit copied into every bit above" },
  // \lnot
  lnot: { say: "not", means: "the opposite: true becomes false, a bit 1 becomes 0" },
  // \mathsf{Z}_A
  // paper: [2] The \textsc{pvm} dynamic address alignment factor.
  Cpvmdynaddralign: { say: "Z sub A", means: "the jump alignment, 2: a dynamic jump's address is (its jump table index + 1) × 2" },

  // the instruction tables (A.5)
  // \nu
  immed: { say: "nu", means: "an immediate: a number written in the instruction itself; ν_X the first, ν_Y the second" },
  // \mathcal{X}_{x}\left(y\right)
  // paper: The signed-extension function for a value in \mathbb{N}_{2^{8n}}.
  sext: { say: "X sub n of", means: "sign extension: an n-byte number stretched to 64 bits, its top bit copied into every bit above" },
  // {\varphi}
  reg: { say: "phi", means: "the registers: φ_A, φ_B and φ_D are the ones an instruction names, φ′ the values after it runs" },
  // {{\mu}'}^\circlearrowleft
  memwr: { say: "mu prime, wrapped", means: "memory after the instruction, written at an address taken mod 2^32" },
  // {{\mu}}^\circlearrowleft
  memr: { say: "mu, wrapped", means: "memory, read at an address taken mod 2^32" },
  // \mathcal{Z}_{8}(x)
  signed: { say: "Z sub 8 of", means: "a register read as a signed 64-bit number: all 64 bits set is −1" },
  // \mathcal{Z}_{8}^{-1} (x)
  unsigned: { say: "Z sub 8 inverse of", means: "a signed number put back into a register's 64 bits: −1 becomes all 64 bits set" },
  // \mathcal{Z}_{x}(y)
  signedn: { say: "Z sub n of", means: "the low n bytes read as a signed number" },
  // \mathcal{B}_{8}(x)
  bits: { say: "B sub 8 of", means: "a register's 64 bits, the lowest first" },
  // \oplus
  oplus: { say: "o plus", means: "in the instruction tables, xor: one or the other but not both; in the gas model, any one of the operations listed beside it" },
  // \text{rtz}
  rtz: { say: "round toward zero", means: "a division's answer rounded toward zero: −3.5 becomes −3, 3.5 becomes 3" },
  // \text{smod}
  smod: { say: "signed mod", means: "the remainder of the sizes, with the sign of the number divided: smod(−7, 2) is −1" },

  // host calls, a program's start, its arguments (A.6 to A.8)
  // \Omega\left\langle x\right\rangle
  contextmutator: { say: "omega of X", means: "a host's function: given a host call's number, the gas, registers, memory and the host's own context X, it says carry on or stop, with all of them updated" },
  // \mathfrak{j}
  "jam¬blob": { say: "j (gothic)", means: "a standard program: four sizes, the read-only and read-write data, then the PVM blob" },
  // \mathsf{Z}_I
  // paper: [2^{24}] The standard \textsc{pvm} program initialization input data size.
  Cpvminitinputsize: { say: "Z sub I", means: "the most argument data a program can be given: 2^24 bytes, 16 MiB" },
  // \mathsf{Z}_Z
  // paper: [2^{16}] The standard \textsc{pvm} program initialization zone size.
  Cpvminitzonesize: { say: "Z sub Z", means: "a zone: 2^16 bytes, 64 KiB; memory's sections start on zones, with an empty one between" },
  // P(x)
  rnp: { say: "P of", means: "x rounded up to whole pages of 4,096 bytes" },
  // Z(x)
  rnq: { say: "Z of", means: "x rounded up to whole zones of 65,536 bytes" },
  // \left\{ x \right.
  bracegroup: { say: "as follows", means: "a brace grouping cases: the line whose condition holds gives the value" },
  // \mathbb{N}_{x \dots+ y}
  Nrange: { say: "N from x, y of them", means: "the y whole numbers from x on: x, x + 1, up to x + y − 1" },

  // the gas model (A.9, A.10)
  // \mathbb{S}
  "gas¬sim¬ty": { say: "S", means: "the model CPU's state: where it decodes, its clock, what is left this cycle, and its reorder buffer" },
  // c
  "ctr¬cycles": { say: "c", means: "the model CPU's clock: the cycles so far" },
  // d
  "remaining¬decodeslots": { say: "d", means: "decode slots left this cycle, out of 4" },
  // e
  "remaining¬startpercycle": { say: "e", means: "how many more instructions may start this cycle, out of 5" },
  // t
  "remaining¬execunits": { say: "t", means: "the execution units free right now, of each kind" },
  // \mathbf{r}
  rob: { say: "r", means: "the reorder buffer: decoded instructions, in order, waiting, running or finished" },
  // \mathbb{E}
  "execunits¬ty": { say: "E", means: "a count of each kind of execution unit: ALU, load, store, multiply, divide" },
  // \mathbb{R}
  "rob¬entry¬ty": { say: "R", means: "a reorder buffer entry: its state, its cycles left, what it waits on, the registers it makes, the units it uses" },
  // s
  "rob¬state": { say: "s", means: "an entry's state: decoding, waiting, executing, finished, or retired (∅)" },
  // c
  "rob¬cyclesleft": { say: "c", means: "an entry's cycles left to run" },
  // p
  "rob¬deps": { say: "p", means: "the entries this one waits on: those making a register it reads" },
  // r
  "rob¬regs": { say: "r", means: "the registers this entry will make, until a later entry takes one over" },
  // t
  "rob¬execunits": { say: "t", means: "the execution units this entry holds while it runs" },
  // \left\{\,\text{DEC}, \text{WAIT}, \text{EXE}, \text{FIN}, \emptyset\,\right\}
  "rob¬state¬ty": { say: "the states", means: "DEC decoding, WAIT waiting, EXE executing, FIN finished, ∅ retired" },
  // \text{A}
  ALU: { say: "A", means: "arithmetic units: the model CPU has 4" },
  // \text{L}
  LOAD: { say: "L", means: "load units: the model CPU has 4" },
  // \text{S}
  STORE: { say: "S", means: "store units: the model CPU has 4" },
  // \text{M}
  MUL: { say: "M", means: "multiply units: the model CPU has 1" },
  // \text{D}
  DIV: { say: "D", means: "divide units: the model CPU has 1" },
  // \check{s}
  "inst¬srcregs": { say: "s check", means: "the registers an instruction reads" },
  // \check{r}
  "inst¬dstregs": { say: "r check", means: "the registers an instruction writes" },
  // \check{c}
  "cost¬cycles": { say: "c check", means: "an instruction's cycles: 1 for an add, 25 for a load or store, 60 for a divide" },
  // \check{d}
  "cost¬decodeslots": { say: "d check", means: "the decode slots an instruction needs: 1 to 4" },
  // \check{x}
  "cost¬execunits": { say: "x check", means: "the execution units an instruction needs to start" },
  // \mathbf{x}
  "gas¬sim¬state": { say: "x", means: "a state of the model CPU, one of 𝕊" },
  // \mathfrak{X}
  "gas¬sim": { say: "X (gothic)", means: "the model CPU: runs a basic block step by step until every instruction has retired" },
  // 4
  "const¬maxdecodepercycle": { say: "4", means: "decode slots each cycle" },
  // 5
  "const¬maxstartpercycle": { say: "5", means: "the most instructions that may start each cycle" },
  // \mathfrak{S}
  "find¬readytostart": { say: "S (gothic)", means: "the first waiting entry whose inputs are ready and whose units are free; ∅ if none" },
  // {\mathbf{x}_{\mathbf{r}}}
  "in¬rob": { say: "x sub r", means: "this state's reorder buffer" },
  // \mathbb{N}_{\left\vert{\mathbf{x}_{\mathbf{r}}}\right\vert}
  "in¬rob¬len": { say: "N sub the size of x sub r", means: "the reorder buffer's indices: 0 up to its length less 1" },
  // x\left[y\right]_{z}
  "rob¬entry¬field": { say: "x at y, its z", means: "field z of entry y of the buffer x" },
  // {{\mathbf{x}_{\mathbf{r}}}\left[x\right]}_{y}
  "in¬rob¬field": { say: "x sub r at x, its y", means: "field y of entry x of the reorder buffer" },
  // \text{DEC}
  "state¬decoding": { say: "decoding", means: "DEC: just entered the buffer this cycle" },
  // \text{EXE}
  "state¬executing": { say: "executing", means: "EXE: running on its units" },
  // \text{WAIT}
  "state¬waiting": { say: "waiting", means: "WAIT: decoded, and starts once its inputs are ready and its units free" },
  // \text{FIN}
  "state¬executed": { say: "finished", means: "FIN: done running, and retires once everything before it has" },
};
