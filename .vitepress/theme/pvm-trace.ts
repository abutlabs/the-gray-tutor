// Part 15's big picture: the bootstrap service's accumulation, run on the reference
// client's PVM from the state before the fallback trace's first block, as lessons 15.8 and
// 15.11 run it: 1,000 gas, ı = 5, until its first host call. Per step: where it is (ı), the
// instruction, its arguments, the gas its basic block cost (0 inside a block), the gas left,
// the register it sets and its value, and the 8 bytes it stores (1) or loads (0) and where.
// Copied from the reference machine; tools/widget-pvm-run.test.ts runs it again to check.

/** [ı, name, arguments, gas paid, gas left, [register, value] or null, [address, value, stored] or null] */
export type Step = [number, string, string, number, number, [number, number] | null, [number, number, 0 | 1] | null];

/** The registers Y sets up, r0 to r12, signed. */
export const REGISTERS: number[] = [0xffff0000, 0xfefe0000, 0, 0, 0, 0, 0, 0xfeff0000, 3, 0, 0, 0, 0];

export const STEPS: Step[] = [
  [5, "jump", "→ 92078", 15, 985, null, null],
  [92078, "add_imm_64", "r1, r1, -1440", 26, 959, [1, 0xfefdfa60], null],
  [92082, "store_ind_u64", "r0, r1, 1432", 0, 959, null, [0xfefdfff8, 0xffff0000, 1]],
  [92086, "store_ind_u64", "r5, r1, 1424", 0, 959, null, [0xfefdfff0, 0, 1]],
  [92090, "store_ind_u64", "r6, r1, 1416", 0, 959, null, [0xfefdffe8, 0, 1]],
  [92094, "move_reg", "r5, r8", 0, 959, [5, 3], null],
  [92096, "move_reg", "r6, r7", 0, 959, [6, 0xfeff0000], null],
  [92098, "load_imm_jump", "r0, 2558, → 123687", 0, 959, [0, 2558], null],
  [123687, "add_imm_64", "r1, r1, -248", 27, 932, [1, 0xfefdf968], null],
  [123691, "store_ind_u64", "r0, r1, 240", 0, 932, null, [0xfefdfa58, 2558, 1]],
  [123695, "store_ind_u64", "r5, r1, 232", 0, 932, null, [0xfefdfa50, 3, 1]],
  [123699, "store_ind_u64", "r6, r1, 224", 0, 932, null, [0xfefdfa48, 0xfeff0000, 1]],
  [123703, "store_imm_ind_u64", "r1, 176, 0", 0, 932, null, [0xfefdfa18, 0, 1]],
  [123707, "add_imm_64", "r7, r1, 200", 0, 932, [7, 0xfefdfa30], null],
  [123711, "add_imm_64", "r8, r1, 176", 0, 932, [8, 0xfefdfa18], null],
  [123715, "load_imm_jump", "r0, 3154, → 121410", 0, 932, [0, 3154], null],
  [121410, "add_imm_64", "r1, r1, -64", 73, 859, [1, 0xfefdf928], null],
  [121413, "store_ind_u64", "r0, r1, 56", 0, 859, null, [0xfefdf960, 3154, 1]],
  [121416, "store_ind_u64", "r5, r1, 48", 0, 859, null, [0xfefdf958, 3, 1]],
  [121419, "store_ind_u64", "r6, r1, 40", 0, 859, null, [0xfefdf950, 0xfeff0000, 1]],
  [121422, "store_ind_u64", "r7, r1, 32", 0, 859, null, [0xfefdf948, 0xfefdfa30, 1]],
  [121425, "load_ind_u64", "r10, r8, 0", 0, 859, [10, 0], [0xfefdfa18, 0, 0]],
  [121427, "load_ind_u64", "r9, r8, 8", 0, 859, [9, 0], [0xfefdfa20, 0, 0]],
  [121430, "load_ind_u64", "r8, r8, 16", 0, 859, [8, 0], [0xfefdfa28, 0, 0]],
  [121433, "load_imm", "r11, 0", 0, 859, [11, 0], null],
  [121435, "shlo_r_imm_alt_64", "r7, r10, 20359", 0, 859, [7, 20359], null],
  [121439, "and_imm", "r7, r7, 1", 0, 859, [7, 1], null],
  [121442, "load_imm", "r12, 0", 0, 859, [12, 0], null],
  [121444, "branch_ne_imm", "r7, 0, → 121467", 0, 859, null, null],
  [121467, "store_ind_u64", "r8, r1, 8", 102, 757, null, [0xfefdf930, 0, 1]],
  [121470, "store_ind_u64", "r9, r1, 16", 0, 757, null, [0xfefdf938, 0, 1]],
  [121473, "load_imm", "r6, -9", 0, 757, [6, -9], null],
  [121476, "load_imm", "r7, 0", 0, 757, [7, 0], null],
  [121478, "load_imm", "r8, 0", 0, 757, [8, 0], null],
  [121480, "load_imm", "r9, 0", 0, 757, [9, 0], null],
  [121482, "store_ind_u64", "r10, r1, 24", 0, 757, null, [0xfefdf940, 0, 1]],
  [121485, "load_imm", "r0, 3134", 0, 757, [0, 3134], null],
  [121489, "ecalli", "2", 0, 757, null, null],
];

/** The last block's end, never reached: the host call stops the machine first. Its price
 *  counts it all the same. [ı, name] */
export const UNREACHED: [number, string] = [121491, "fallthrough"];
