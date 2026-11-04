// The PVM Playground's programs, and the five-minute demo. Each program is text the reader can
// edit and run again; the real service's isn't, it's 159,322 bytes of compiled code.
// tools/widget-pvm-playground.test.ts runs them all, and checks where each one ends.

/** A program to learn from: what to watch as it runs, and things to try. */
export type Scenario = {
  id: string;
  title: string;
  source: string; // the assembler's text; empty for the real service
  watch: string;
  tries: string[];
};

export const REAL = "real-service";

export const SCENARIOS: Scenario[] = [
  {
    id: "registers",
    title: "The 13 registers",
    source: `; The PVM has no variables. It has 13 registers, r0 to r12, 64 bits each.
.gas 1000

  load_imm r7, 3      ; put a number in a register
  load_imm r8, 4
  add_64 r9, r7, r8   ; r9 = r7 + r8
  mul_64 r10, r9, r9  ; r10 = r9 × r9
  sub_64 r11, r8, r7  ; r11 = r8 − r7
  move_reg r12, r10   ; copy a register
  halt                ; jump to the address in r0, which ends the program
`,
    watch:
      "Step through it. Each instruction reads the registers lit blue and writes the one lit green, and the line above the panels says the sum in plain numbers. Look at the gas: the whole block is paid for before its first instruction runs, so gas drops once, not once per instruction.",
    tries: [
      "Change 3 to 300 and press Assemble: the sums follow.",
      "r0 holds the halt address before anything runs. Add load_imm r0, 0 at the top: halt now jumps somewhere else, and the program panics.",
      "Write to r13. The assembler refuses: there are only 13 registers, r0 to r12.",
    ],
  },
  {
    id: "immediates",
    title: "Numbers inside instructions",
    source: `; A number written in an instruction is an immediate. It takes 0 to 4 bytes,
; and the top bit of its last byte is copied up to fill all 64 bits.
.gas 1000

  load_imm r7, 127         ; 1 byte: 7f
  load_imm r8, 128         ; 2 bytes: 80 00, or 80 alone would read as negative
  load_imm r9, -1          ; 1 byte: ff, stretched to 64 bits of ones
  load_imm r10, 0          ; 0 bytes at all
  load_imm_64 r11, 0x1122334455667788 ; the one instruction with 8 bytes
  load_imm r12, 0x7fffffff ; the biggest positive 32-bit number
  add_imm_32 r12, r12, 1   ; a 32-bit sum goes negative, and is stretched too
  halt
`,
    watch:
      "Read the bytes at the end of each line in the code panel. load_imm r10, 0 has no immediate bytes: a missing byte reads as zero, which is how the PVM packs code small. Watch r9 become −1, every bit set: that's sign extension. The last sum shows why add_32 and add_64 are different instructions.",
    tries: [
      "Change add_imm_32 to add_imm_64: r12 becomes 2,147,483,648, not negative.",
      "Change load_imm r8, 128 to load_imm r8, 255 and read its bytes: still two of them.",
    ],
  },
  {
    id: "loop",
    title: "A branch and a loop",
    source: `; Add 5 + 4 + 3 + 2 + 1. A branch may only land on the start of a basic block,
; and a block starts at 0 or just after a block-ending instruction.
.gas 1000

  load_imm r7, 0            ; the total
  load_imm r8, 5            ; the counter
  fallthrough               ; end this block, so that the next line starts one
loop:
  add_64 r7, r7, r8
  add_imm_64 r8, r8, -1
  branch_ne_imm r8, 0, loop ; back to the top, until r8 is 0
  halt
`,
    watch:
      "Lines marked ▌ start a basic block. Step through and watch the gas panel: every pass round the loop pays for the block again, the same price each time. The list of blocks paid for grows by one per pass.",
    tries: [
      "Delete the fallthrough line and press Assemble. The branch now points at the middle of a block: the program panics at its first branch back.",
      "Change the 5 to 50. Gas runs out before the loop ends. Raise .gas and it finishes.",
      "Click loop's first line to set a breakpoint, then press Run: it stops there every pass.",
    ],
  },
  {
    id: "memory",
    title: "Reading and writing memory",
    source: `; Memory is 2^32 bytes in pages of 4,096. A page is read-and-write, read-only, or
; not there at all. Numbers are stored little end first.
.gas 2000
.page 0x20000 W
.page 0x30000 R
.data 0x30000 ef be ad de
.reg r1 = 0x20000

  load_imm_64 r7, 0x1122334455667788
  store_ind_u64 r7, r1, 8  ; 8 bytes at r1 + 8
  load_ind_u16 r8, r1, 8   ; the first 2 of them back: 0x7788
  load_u32 r9, 0x30000     ; read-only pages can be read
  store_u8 r7, 0x30000     ; but not written: a page fault
  halt
`,
    watch:
      "The memory panel jumps to each address touched, and lights the bytes. After the store, look at the order: 88 77 66 55 44 33 22 11, the smallest byte first. Then the store to the read-only page stops with a page fault: nothing is written, and ı stays on that instruction, so the code that started this machine can see exactly what failed.",
    tries: [
      "Change .page 0x30000 R to W: the store works, and the program halts.",
      "Change load_ind_u16 to load_ind_u8, then to load_ind_u64, and watch how many bytes light up.",
    ],
  },
  {
    id: "no-page",
    title: "Memory that isn't there",
    source: `; Touching a page that doesn't exist is a fault at that page's address.
; Touching anything below 64 KiB is worse: a panic, with no way back.
.gas 1000
.page 0x20000 W
.reg r1 = 0x20000

  load_imm r7, 42
  store_ind_u64 r7, r1, 0     ; fine
  load_ind_u64 r8, r1, 0x1000 ; one page on: nothing there
  halt
`,
    watch:
      "The load lands one page past the only page there is. The fault names the page's start, not the byte's address. At the top of a service a fault ends the run, like a panic. An inner machine started with the invoke host call is different: the fault goes back to the code that started it, which can give it the page and carry on.",
    tries: [
      "Change the last offset to 8: same page, so the load works, and reads zeros.",
      "Replace the load with load_u64 r8, 0x100: nothing is there, and it's below 64 KiB, so that's a panic, not a fault.",
      "Change the offset to 4092 with r1 as it is: 8 bytes straddling two pages, and the fault names the second.",
    ],
  },
  {
    id: "out-of-gas",
    title: "Out of gas",
    source: `; The same loop on a budget. A block is paid for in full on the way in, or not at all.
.gas 60

  load_imm r7, 0
  load_imm r8, 1000
  fallthrough
loop:
  add_64 r7, r7, r8
  add_imm_64 r8, r8, -1
  branch_ne_imm r8, 0, loop
  halt
`,
    watch:
      "Press Run. The machine stops at the door of a block it can't pay for: nothing in that block ran, so r7 holds the total of whole passes only. That's what makes gas exact: every validator stops at the same instruction, at the same gas.",
    tries: [
      "Set the starting gas to 23, then 22. The first block costs 2 and a pass costs 21: 23 buys one pass, and 22 buys none.",
      "Compare the gas left at the stop with the block's price: the gas left is what couldn't be spent.",
    ],
  },
  {
    id: "jumps",
    title: "Jumps through the table",
    source: `; jump_ind can't go just anywhere. Its address is a place in the jump table:
; address 2 is entry 0, address 4 is entry 1, and so on. Odd addresses panic.
.gas 1000
.jump_table one, two

  load_imm r7, 4    ; entry 1, which is the label two
  jump_ind r7, 0
one:
  load_imm r8, 1
  halt
two:
  load_imm r8, 2
  load_imm r7, 3    ; odd: not a place in the table
  jump_ind r7, 0
`,
    watch:
      "The first jump goes through the table to two. Code can't compute a jump into the middle of an instruction: every target is one the table lists. That's a big part of why the PVM can be compiled ahead of time. The second jump is to an odd address, and panics.",
    tries: [
      "Change load_imm r7, 4 to 2: it takes entry 0 instead, and halts.",
      "Change the 3 to 6: past the end of the table, also a panic.",
    ],
  },
  {
    id: "host-call",
    title: "Asking the host",
    source: `; The PVM can't reach anything outside itself. ecalli stops it, the host does the
; work and answers in r7, and it carries on after the ecalli.
.gas 2000

  ecalli 0            ; gas: how much is left?
  move_reg r8, r7
  ecalli 99           ; a call nobody knows
  move_reg r9, r7
  halt
`,
    watch:
      "Step to the first ecalli. The host call has its own price on top of the block: gas costs 48, and the answer in r7 is the gas left after paying. The second call doesn't exist, so the answer is WHAT, 2^64 − 2, which shows as −2, and it costs 1,000: asking for nonsense isn't free.",
    tries: [
      "Set .gas to 1000. The unknown call can't be paid for, and the machine runs out of gas inside the host.",
      "Move ecalli 0 after the second call: its answer is about 1,000 lower, which is what asking for nonsense cost.",
    ],
  },
  {
    id: "block-cost",
    title: "What a block really costs",
    source: `; Gas isn't a price list added up. The Gray Paper models a CPU that runs several
; instructions at once, and a block costs the cycles that CPU takes, less 3.
.gas 1000

  add_32 r1, r2, r3     ; four sums that don't need each other
  add_32 r4, r5, r6
  add_32 r7, r8, r9
  add_32 r10, r11, r12
  fallthrough
chained:
  add_32 r1, r1, r1     ; four sums, each needing the one before
  add_32 r1, r1, r1
  add_32 r1, r1, r1
  add_32 r1, r1, r1
  fallthrough
divide:
  div_u_64 r1, r2, r3
  halt
`,
    watch:
      "Press Run and compare the three prices in the gas panel. In the first block nothing depends on anything, so the model CPU runs the additions side by side: 5. In the second each addition needs the one before, so they run one after another: 8, for the same four instructions. The third has one instruction, a division, and it costs 60.",
    tries: [
      "Change add_32 to add_64 everywhere: both sums take one cycle now, and the first two blocks both cost 4.",
      "Add .page 0x20000 W at the top and load_u64 r2, 0x20000 as the first instruction: a load takes 25 cycles, and the block's price jumps.",
    ],
  },
  {
    id: "array",
    title: "A small real program",
    source: `; Everything together: add up four numbers in memory and store the total,
; the way compiled code does it.
.gas 2000
.page 0x20000 W
.data 0x20000 0a 00 00 00 00 00 00 00 14 00 00 00 00 00 00 00
.data 0x20010 1e 00 00 00 00 00 00 00 28 00 00 00 00 00 00 00
.reg r1 = 0x20000

  load_imm r7, 0            ; the total
  load_imm r8, 4            ; how many are left
  fallthrough
next:
  load_ind_u64 r9, r1, 0    ; read one
  add_64 r7, r7, r9         ; add it on
  add_imm_64 r1, r1, 8      ; move to the next
  add_imm_64 r8, r8, -1
  branch_ne_imm r8, 0, next
  store_ind_u64 r7, r1, 0   ; store the total after them
  halt
`,
    watch:
      "Four numbers, 10, 20, 30 and 40, sit in memory. Watch r1 walk along them eight bytes at a time, r7 climb, and each pass pay for its block, memory cost included. At the end the total, 100, is written just past the numbers: 0x64 in the memory panel.",
    tries: [
      "Change the numbers in .data, and the count in r8, and press Assemble.",
      "Set the gas too low and see where it stops: the store at the end never happens.",
    ],
  },
  {
    id: REAL,
    title: "A real service: bootstrap's accumulate",
    source: "",
    watch:
      "This isn't a toy. It's the 159,322 bytes of code that service 0 keeps in the fallback trace's state, on the same PVM, starting where the Gray Paper says accumulate starts: ı = 5, with r7 holding where its arguments are and r8 how long they are. Press Next host call and watch it talk to the host: it fetches the protocol's constants, grows its heap, and asks for its own account. Then press Run: 3,318 instructions, then a clean halt, every step decoded and gas-metered live in your browser.",
    tries: [
      "Set a breakpoint and run to it: the same debugger on real compiled code.",
      "Set the starting gas to 5,000: a real service, out of gas at the same instruction on every validator.",
      "Open memory at 0xfeff0000, r7's first value: the arguments are the three bytes 01 00 00, slot 1, service 0, no inputs.",
    ],
  },
];

/** A step of the demo: where to go, what to do, and what to say. */
export type DemoStep = {
  scenario: string;
  do: string;
  say: string;
  /** Runs this many instructions on arrival, so the screen is ready; undefined: from the start. */
  run?: number | "end" | "host";
};

/** The five-minute demo: the machine, then gas, then memory, then the real thing. */
export const DEMO: DemoStep[] = [
  {
    scenario: "registers",
    do: "Press Step four times.",
    say: "This page runs our client's PVM in the browser: the same TypeScript the tutorial's readers write. Thirteen registers, a counter, gas, memory. That's the whole machine, and every number here comes from it, live. Watch: the block is paid for once, on the way in.",
  },
  {
    scenario: "loop",
    do: "Press Next block a few times. Point at the blocks list.",
    say: "Gas in JAM is charged per basic block, not per instruction. Each pass round this loop pays for the block again. It means a validator can price code before running it, which is what lets the PVM compile ahead of time.",
  },
  {
    scenario: "block-cost",
    do: "Press Run. Compare the three prices.",
    say: "Same four additions, different price: 5 and 8. The Gray Paper's gas model is a small CPU pipeline: when instructions don't depend on each other they run side by side. Gas tracks the time code takes on a real CPU, not a flat price list, and the tutorial implements that model from the paper's own tables.",
    run: "end",
  },
  {
    scenario: "out-of-gas",
    do: "Press Run. Point at the stop.",
    say: "Here's why that matters. Run out of gas and you stop at the door of a block, with none of it run. Every validator stops at the same instruction, with the same gas left. That's deterministic metering.",
    run: "end",
  },
  {
    scenario: "memory",
    do: "Press Run. Point at the bytes, then the fault.",
    say: "Memory is pages, each read-write, read-only, or absent. Little-endian, byte by byte. A store to a read-only page faults, and ı stays on that instruction, naming the page. In a service that ends the run; in an inner machine it goes back to the parent.",
    run: "end",
  },
  {
    scenario: "host-call",
    do: "Press Step twice. Point at the host-call line.",
    say: "The PVM can't touch anything outside itself. ecalli stops the machine, the host answers in r7, and it carries on. Everything a service does to the chain goes through here, and every call has a price.",
  },
  {
    scenario: REAL,
    do: "Press Next host call three times, then Run.",
    say: "And this is a real service: 159,322 bytes of compiled code from the trace vectors, entered at instruction 5 as the Gray Paper says for accumulate. Fetch, grow heap, info. Then it runs to a clean halt: 3,318 instructions, every one decoded and metered live. This is the PVM the tutorial's client uses to pass the trace vectors.",
  },
];
