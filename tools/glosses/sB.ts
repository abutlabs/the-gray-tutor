// The symbols Appendix B, the PVM invocations first uses, in plain words (gray-paper-glosses.ts says how a
// key is made from them). Each entry: how to say it aloud, and what it means, in a line a
// reader new to the paper can follow; "skip" for typography a key needn't explain.

import type { Glosses } from "../gray-paper-glosses.ts";

export const SB: Glosses = {
  // \mathtt
  mathtt: "skip",
  // \mathsf{W}_A
  // paper: [64,000] The maximum size of is-authorized code in octets.
  Cmaxauthcodesize: { say: "W sub A", means: "the most bytes an authorizer's code may have: 64,000" },
  // \mathsf{G}_I
  // paper: [50,000,000] The gas allocated to invoke a work-package's Is-Authorized logic.
  Cpackageauthgas: { say: "G sub I", means: "the gas an authorizer's run gets: 50,000,000" },
  // \Omega
  // paper: Virtual machine host-call functions.
  Omega: { say: "omega", means: "a host call's function: Ω_G is gas, Ω_Y fetch, Ω_W write; one letter for each call" },
  // \unicode{x264A}
  Gemini: { say: "Gemini", means: "the sign that names grow_heap: Ω_♊ makes a program's heap bigger, a page at a time" },
  // \mathsf{M}_{\emptyset}
  // paper: [1000] Gas cost charged for an unknown host-call.
  Cgasunknown: { say: "M sub nothing", means: "what a host call this host doesn't know costs: 1,000 gas, and the answer WHAT" },
  // \mathbb{I}
  // paper: The set representing the state of an \mathbb{I}nner \textsc{pvm} instance.
  innerpvm: { say: "I", means: "an inner machine: a PVM a refining service starts inside its own, with its code, memory, instruction counter and a flag" },
  // \mathfrak{p}
  "pg¬code": { say: "gothic p", means: "an inner machine's program: its code, as bytes" },
  // \mathbf{u}
  "pg¬ram": { say: "u", means: "an inner machine's memory" },
  // i
  "pg¬pc": { say: "i", means: "an inner machine's instruction counter: where it carries on from" },
  // \tilde{g}
  "pg¬gaschargedflag": { say: "g tilde", means: "true when gas is already paid for the basic block the inner machine is in" },
  // \overline
  overline: { say: "bar", means: "over a letter: one entry for each work-item of the package, ī is every item's imported segments" },
  // \varsigma
  segoff: { say: "final sigma", means: "how many segments the package's earlier work-items export: the index this item's first export gets" },
  // \mathbb{L}
  // paper: The set representing implications of accumulation.
  implications: { say: "L", means: "an accumulation's context: the service running, the state it sees, the next free service id, its transfers, its yield and its provisions" },
  // \mathbf{x}
  imX: { say: "x", means: "the regular context: what the host calls change as the service runs, kept if it halts" },
  // \mathbf{y}
  imY: { say: "y", means: "the exceptional context: the state at the last checkpoint, kept if the service panics or runs out of gas" },
  // s
  "im¬id": { say: "s", means: "the id of the service accumulating" },
  // \mathbf{e}
  "im¬state": { say: "e", means: "the state the service sees and changes: the accounts, the staging keys, the authorizer queues and the privileges" },
  // i
  "im¬nextfreeid": { say: "i", means: "the id the next service it creates will get" },
  // \mathbf{t}
  "im¬xfers": { say: "t", means: "the transfers the service has made so far, delivered when it is done" },
  // y
  "im¬yield": { say: "y", means: "the hash the service yields, if any: its answer for the outside world" },
  // \mathbf{p}
  "im¬provisions": { say: "p", means: "the preimages the service provides: pairs of a service id and the bytes" },
  // \mathbf{s}
  "im¬self": { say: "s", means: "the account of the service accumulating, as this context holds it" },
  // \mathbf{e}
  "local¬basestate": { say: "e", means: "the state an accumulation starts from" },
  // \mathbf{s}
  "local¬postxferstate": { say: "s", means: "the starting state with the money of every transfer to this service already added to its balance" },
  // \mathsf{S}
  // paper: [2^{16}] The minimum public service index. Services of indices below these may only be created by the Registrar.
  Cminpublicindex: { say: "S", means: "the lowest id an ordinary new service can get: 2¹⁶ = 65,536; the ids below it only the registrar hands out" },
  // \!\left\lgroup\mathbb{L}, \mathbb{L}\right\rgroup\!
  implicationspair: { say: "a pair of contexts", means: "two accumulation contexts side by side: the regular one and the exceptional one" },
  // \left(\mathbf{x}, \mathbf{y}\right)
  imXY: { say: "x and y", means: "the pair of contexts every accumulate host call gets: x as the service changes it, y as at its last checkpoint" },
  // \unicode{x2649}
  Taurus: { say: "Taurus", means: "the sign that names yield: Ω_♉ records the hash a service yields" },
  // \unicode{x2648}
  Aries: { say: "Aries", means: "the sign that names provide: Ω_♈ hands a preimage to a service that asked for it" },
  // \varepsilon
  execst: { say: "epsilon", means: "how the machine goes on after a host call: carry on (▸), halt, panic or out of gas" },
  // \square
  square: { say: "box", means: "a placeholder: Ω_□ stands for any one of the host calls" },
  // \mathcal{G}
  // paper: The memory-sized gas function.
  fnmemgas: { say: "script G", means: "gas for a size: 𝒢(L, ℓ) is ℓ bytes at L gas per 1,024 bytes, rounded up" },
  // \mathsf{M}_G
  // paper: [48] \Omega_G (\texttt{gas}) base gas cost.
  CgasG: { say: "M sub G", means: "what gas costs: 48" },
  // \mathsf{M}_{\unicode{x264A},c}
  // paper: [275] \Omega_{\unicode{x264A}} (\texttt{grow\_heap}) base gas cost.
  CgasGeminiconst: { say: "M sub Gemini, c", means: "what grow_heap costs before any page: 275" },
  // \mathsf{M}_{\unicode{x264A},p}
  // paper: [121] \Omega_{\unicode{x264A}} (\texttt{grow\_heap}) gas per additional page.
  CgasGeminilinear: { say: "M sub Gemini, p", means: "what grow_heap adds for each new page: 121" },
  // \mathsf{M}_{Y,x,c}
  // paper: [390, \CgasYl{0}] \Omega_Y (\texttt{fetch}) case 0: protocol parameters.
  CgasYc: { say: "M sub Y, x, c", means: "what fetch costs for item x before the bytes: 390 for the constants, 103 for the entropy" },
  // \mathsf{M}_{Y,x,\ell}
  CgasYl: { say: "M sub Y, x, ell", means: "what fetch adds per 1,024 bytes asked for, for item x: 0 for the constants, 400 for all the inputs at once" },
  // \mathsf{M}_{L,c}
  // paper: [600] \Omega_L (\texttt{lookup}) base gas cost.
  CgasLconst: { say: "M sub L, c", means: "what lookup costs before the bytes: 600" },
  // \mathsf{M}_{L,\ell}
  // paper: [248] \Omega_L (\texttt{lookup}) gas per 1024 octets (\mathcal{G}(\mathsf{M}_{L,\ell}, \ell)).
  CgasLlinear: { say: "M sub L, ell", means: "what lookup adds per 1,024 bytes asked for: 248" },
  // \mathsf{M}_{R,c}
  // paper: [2407] \Omega_R (\texttt{read}) base gas cost.
  CgasRconst: { say: "M sub R, c", means: "what read costs before the bytes: 2,407" },
  // \mathsf{M}_{R,\mathrm{k},\ell}
  // paper: [1736] \Omega_R (\texttt{read}) key gas per 1024 octets (\mathcal{G}(\mathsf{M}_{R,\mathrm{k},\ell}, \ell)).
  CgasRkeylinear: { say: "M sub R, k, ell", means: "what read adds per 1,024 bytes of key: 1,736" },
  // \mathsf{M}_{R,\mathrm{v},\ell}
  // paper: [248] \Omega_R (\texttt{read}) value gas per 1024 octets (\mathcal{G}(\mathsf{M}_{R,\mathrm{v},\ell}, \ell)).
  CgasRvallinear: { say: "M sub R, v, ell", means: "what read adds per 1,024 bytes of value asked for: 248" },
  // \mathsf{M}_{W,c}
  // paper: [2442] \Omega_W (\texttt{write}) base gas cost.
  CgasWconst: { say: "M sub W, c", means: "what write costs before the bytes: 2,442" },
  // \mathsf{M}_{W,\mathrm{k},\ell}
  // paper: [3358] \Omega_W (\texttt{write}) key gas per 1024 octets (\mathcal{G}(\mathsf{M}_{W,\mathrm{k},\ell}, \ell)).
  CgasWkeylinear: { say: "M sub W, k, ell", means: "what write adds per 1,024 bytes of key: 3,358" },
  // \mathsf{M}_{W,\mathrm{v},\ell}
  // paper: [216] \Omega_W (\texttt{write}) gas per 1024 octets (\mathcal{G}(\mathsf{M}_{W,\mathrm{v},\ell}, \ell)).
  CgasWvallinear: { say: "M sub W, v, ell", means: "what write adds per 1,024 bytes of value: 216" },
  // \mathsf{M}_I
  // paper: [703] \Omega_I (\texttt{info}) base gas cost.
  CgasI: { say: "M sub I", means: "what info costs: 703" },
  // \mathsf{M}_{H,c}
  // paper: [1125] \Omega_H (\texttt{historical\_lookup}) base gas cost.
  CgasHconst: { say: "M sub H, c", means: "what historical_lookup costs before the bytes: 1,125" },
  // \mathsf{M}_{H,\ell}
  // paper: [264] \Omega_H (\texttt{historical\_lookup}) gas per 1024 octets (\mathcal{G}(\mathsf{M}_{H,\ell}, \ell)).
  CgasHlinear: { say: "M sub H, ell", means: "what historical_lookup adds per 1,024 bytes asked for: 264" },
  // \mathsf{M}_E
  // paper: [3521] \Omega_E (\texttt{export}) base gas cost.
  CgasE: { say: "M sub E", means: "what export costs: 3,521" },
  // \mathsf{M}_{M,c}
  // paper: [1862] \Omega_M (\texttt{machine}) base gas cost.
  CgasMconst: { say: "M sub M, c", means: "what machine costs before the program's bytes: 1,862" },
  // \mathsf{M}_{M,\ell}
  // paper: [112] \Omega_M (\texttt{machine}) gas per 1024 octets, program size (\mathcal{G}(\mathsf{M}_{M,\ell}, \ell)).
  CgasMlinear: { say: "M sub M, ell", means: "what machine adds per 1,024 bytes of the inner program: 112" },
  // \mathsf{M}_{P,c}
  // paper: [377] \Omega_P (\texttt{peek}) base gas cost.
  CgasPconst: { say: "M sub P, c", means: "what peek costs before the bytes: 377" },
  // \mathsf{M}_{P,\ell}
  // paper: [336] \Omega_P (\texttt{peek}) gas per 1024 octets (\mathcal{G}(\mathsf{M}_{P,\ell}, \ell)).
  CgasPlinear: { say: "M sub P, ell", means: "what peek adds per 1,024 bytes copied: 336" },
  // \mathsf{M}_{O,c}
  // paper: [297] \Omega_O (\texttt{poke}) base gas cost.
  CgasOconst: { say: "M sub O, c", means: "what poke costs before the bytes: 297" },
  // \mathsf{M}_{O,\ell}
  // paper: [224] \Omega_O (\texttt{poke}) gas per 1024 octets (\mathcal{G}(\mathsf{M}_{O,\ell}, \ell)).
  CgasOlinear: { say: "M sub O, ell", means: "what poke adds per 1,024 bytes copied: 224" },
  // \mathsf{M}_{Z,f,c}
  // paper: [212] \Omega_Z (\texttt{pages}) free base gas cost.
  CgasZfreeconst: { say: "M sub Z, f, c", means: "what pages costs to free pages, before any page: 212" },
  // \mathsf{M}_{Z,f,p}
  // paper: [118] \Omega_Z (\texttt{pages}) free gas per page.
  CgasZfreelinear: { say: "M sub Z, f, p", means: "what pages adds for each page it frees: 118" },
  // \mathsf{M}_{Z,a,c}
  // paper: [275] \Omega_Z (\texttt{pages}) alloc base gas cost.
  CgasZallocconst: { say: "M sub Z, a, c", means: "what pages costs to give pages, before any page: 275" },
  // \mathsf{M}_{Z,a,p}
  // paper: [121] \Omega_Z (\texttt{pages}) alloc gas per page.
  CgasZalloclinear: { say: "M sub Z, a, p", means: "what pages adds for each page it gives: 121" },
  // \mathsf{M}_{Z,s,c}
  // paper: [130] \Omega_Z (\texttt{pages}) setmode base gas cost.
  CgasZsetmodeconst: { say: "M sub Z, s, c", means: "what pages costs to change pages' access, before any page: 130" },
  // \mathsf{M}_{Z,s,p}
  // paper: [29] \Omega_Z (\texttt{pages}) setmode gas per page.
  CgasZsetmodelinear: { say: "M sub Z, s, p", means: "what pages adds for each page whose access it changes: 29" },
  // \mathsf{M}_{Z,i}
  // paper: [80] \Omega_Z (\texttt{pages}) invalid-r base gas cost.
  CgasZinvalid: { say: "M sub Z, i", means: "what pages costs when the mode it is asked for doesn't exist: 80" },
  // \ni
  ni: { say: "contains", means: "the left side has the right side in it: x ∋ y is y ∈ x turned round" },
  // \mathsf{M}_K
  // paper: [968] \Omega_K (\texttt{invoke}) base gas cost.
  CgasK: { say: "M sub K", means: "what invoke costs, before the gas the inner machine is given: 968" },
  // \mathsf{M}_X
  // paper: [335] \Omega_X (\texttt{expunge}) base gas cost.
  CgasX: { say: "M sub X", means: "what expunge costs: 335" },
  // \mathsf{M}_{B,c}
  // paper: [422] \Omega_B (\texttt{bless}) base gas cost.
  CgasBconst: { say: "M sub B, c", means: "what bless costs before its list: 422" },
  // \mathsf{M}_{B,\ell}
  // paper: [20] \Omega_B (\texttt{bless}) gas per item.
  CgasBlinear: { say: "M sub B, ell", means: "what bless adds for each always-accumulate service it names: 20" },
  // \mathsf{M}_A
  // paper: [1818] \Omega_A (\texttt{assign}) base gas cost.
  CgasA: { say: "M sub A", means: "what assign costs: 1,818" },
  // \mathsf{M}_{D,c}
  // paper: [1100] \Omega_D (\texttt{designate}) base gas cost.
  CgasDconst: { say: "M sub D, c", means: "what designate costs before its keys: 1,100" },
  // \mathsf{M}_{D,\ell}
  // paper: [302] \Omega_D (\texttt{designate}) gas per validator.
  CgasDlinear: { say: "M sub D, ell", means: "what designate adds for each validator's keys: 302" },
  // \mathsf{M}_C
  // paper: [103] \Omega_C (\texttt{checkpoint}) base gas cost.
  CgasC: { say: "M sub C", means: "what checkpoint costs: 103" },
  // \mathsf{M}_N
  // paper: [3855] \Omega_N (\texttt{new}) base gas cost.
  CgasN: { say: "M sub N", means: "what new costs: 3,855" },
  // i
  "local¬desiredid": { say: "i", means: "the id the registrar asks for when it creates a service with an id below S" },
  // \mathsf{M}_U
  // paper: [1028] \Omega_U (\texttt{upgrade}) base gas cost.
  CgasU: { say: "M sub U", means: "what upgrade costs: 1,028" },
  // \mathsf{M}_T
  // paper: [575] \Omega_T (\texttt{transfer}) base gas cost.
  CgasT: { say: "M sub T", means: "what transfer costs, before the gas it sends along: 575" },
  // \mathsf{M}_J
  // paper: [458] \Omega_J (\texttt{eject}) base gas cost.
  CgasJ: { say: "M sub J", means: "what eject costs: 458" },
  // \mathsf{M}_Q
  // paper: [643] \Omega_Q (\texttt{query}) base gas cost.
  CgasQ: { say: "M sub Q", means: "what query costs: 643" },
  // \mathsf{M}_S
  // paper: [2193] \Omega_S (\texttt{solicit}) base gas cost.
  CgasS: { say: "M sub S", means: "what solicit costs: 2,193" },
  // \mathsf{M}_F
  // paper: [3250] \Omega_F (\texttt{forget}) base gas cost.
  CgasF: { say: "M sub F", means: "what forget costs: 3,250" },
  // \mathsf{M}_{\unicode{x2649}}
  // paper: [98] \Omega_{\unicode{x2649}} (\texttt{yield}) base gas cost.
  CgasTaurus: { say: "M sub Taurus", means: "what yield costs: 98" },
  // \mathsf{M}_{\unicode{x2648},c}
  // paper: [3980] \Omega_{\unicode{x2648}} (\texttt{provide}) base gas cost.
  CgasAriesconst: { say: "M sub Aries, c", means: "what provide costs before the bytes: 3,980" },
  // \mathsf{M}_{\unicode{x2648},\ell}
  // paper: [2264] \Omega_{\unicode{x2648}} (\texttt{provide}) gas per 1024 octets (\mathcal{G}(\mathsf{M}_{\unicode{x2648},\ell}, \ell)).
  CgasArieslinear: { say: "M sub Aries, ell", means: "what provide adds per 1,024 bytes of the preimage: 2,264" },
};
