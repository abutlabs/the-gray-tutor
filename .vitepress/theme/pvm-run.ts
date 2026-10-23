// Part 15's big picture: the bootstrap service's accumulation, step by step, on a budget.
// The steps are the reference machine's (pvm-trace.ts); this file replays them as frames,
// one a step, with the gas, the registers, the stack and a line of plain words each, and
// stops where the machine would: at the host call, or out of gas at the door of a block it
// can't afford. The memory is Y's (y-layout.ts). tools/widget-pvm-run.test.ts checks it.

import { REGISTERS, STEPS, UNREACHED, type Step } from "./pvm-trace.ts";
import { hex, layout, PRESETS } from "./y-layout.ts";

export const BUDGETS = [1000, 100];

/** Y's sections for the bootstrap service: the four with pages. */
const Y = layout(PRESETS.find((p) => p.name === "the bootstrap service")!.sizes);
export const SECTIONS = Y.rows.filter((r) => r.access);
export const STACK = SECTIONS.find((r) => r.name === "the stack")!;

/** A basic block of the run: where it starts, its price, and its steps (indexes into STEPS). */
export interface Block { at: number; cost: number; steps: number[] }
export const BLOCKS: Block[] = STEPS.reduce<Block[]>((blocks, s, i) => {
  if (s[3] > 0) blocks.push({ at: s[0], cost: s[3], steps: [] });
  blocks.at(-1)!.steps.push(i);
  return blocks;
}, []);

/** How the run stands after some steps: n of them run, the one just run, and what's next. */
export interface Frame {
  n: number; step: Step | null; next: number; gas: number; regs: number[];
  block: number; stop: null | "host" | "oog"; says: string;
}

/** Every frame of the run on a budget: before the first step, then one a step, to the stop. */
export function frames(budget: number): Frame[] {
  const out: Frame[] = [{ n: 0, step: null, next: STEPS[0][0], gas: budget, regs: [...REGISTERS], block: 0, stop: null, says: "" }];
  for (let i = 0; i < STEPS.length; i++) {
    const before = out.at(-1)!;
    const s = STEPS[i];
    const block = BLOCKS.findIndex((b) => b.steps.includes(i));
    if (s[3] > before.gas) {
      out.push({ ...before, block, stop: "oog", says: "" });
      break;
    }
    const regs = [...before.regs];
    if (s[5]) regs[s[5][0]] = s[5][1];
    const last = i === STEPS.length - 1;
    out.push({ n: i + 1, step: s, next: last ? s[0] : STEPS[i + 1][0], gas: before.gas - s[3], regs, block, stop: last ? "host" : null, says: "" });
  }
  out.forEach((f, k) => (f.says = say(f, k === 0 ? null : out[k - 1])));
  return out;
}

/** A register's value as the lessons write one: an address in hex, a small number as is. */
export const value = (v: number): string => (v > 0xffff ? hex(v) : String(v));
const bytes = (n: number) => n.toLocaleString("en-US");

/** Where an address lives in Y's memory. */
export const sectionOf = (address: number) => SECTIONS.find((r) => r.from <= address && address < r.to)!;

/** The last step before step i to store at an address, if any (1-based, as the lessons count). */
function storedBy(address: number, i: number): number | null {
  for (let k = i - 1; k >= 0; k--) if (STEPS[k][6]?.[0] === address && STEPS[k][6]?.[2] === 1) return k + 1;
  return null;
}

/** One frame in plain words. */
function say(f: Frame, before: Frame | null): string {
  if (!before) return `Y has laid out memory and the registers: r0 = ${value(REGISTERS[0])} is the halt address, r1 = ${value(REGISTERS[1])} the top of the stack, r7 = ${value(REGISTERS[7])} points at the 3 argument bytes, r8 = 3 says how many. Accumulation starts at ı = 5.`;
  if (f.stop === "oog") {
    const b = BLOCKS[f.block];
    return `Out of gas. The block at ${b.at} costs ${b.cost} and only ${f.gas} is left, so the machine stops at its door, as it was: no part of a block runs unpaid.`;
  }
  const s = f.step!;
  const [, name, args, paid] = s;
  const r = args.match(/r\d+/g) ?? [];
  const nums = args.replace(/r\d+|→ \d+/g, "").match(/-?\d+/g)?.map(Number) ?? [];
  const target = Number(/→ (\d+)/.exec(args)?.[1]);
  const pay = paid ? `A new basic block: the meter takes all ${paid} gas before any of it runs. ` : "";
  const set = s[5] ? value(s[5][1]) : "";
  const mem = s[6];
  const i = STEPS.indexOf(s);
  let words: string;
  switch (name) {
    case "jump":
      words = `Jumps from 5, accumulation's door, on into the program: to ${target}.`;
      break;
    case "add_imm_64":
      words = r[0] === "r1" && r[1] === "r1"
        ? `r1, the stack pointer, goes down ${bytes(-nums[0])} bytes to ${set}: room on the stack for this function's own values.`
        : `${r[0]} = ${r[1]} + ${nums[0]} = ${set}, an address on the stack.`;
      break;
    case "store_ind_u64":
      words = `Saves ${r[0]} (${value(mem![1])}) in the 8 bytes at ${r[1]} + ${nums[0]} = ${value(mem![0])}, on ${sectionOf(mem![0]).name}.`;
      break;
    case "store_imm_ind_u64":
      words = `Stores ${nums[1]} in the 8 bytes at ${r[0]} + ${nums[0]} = ${value(mem![0])}, on ${sectionOf(mem![0]).name}.`;
      break;
    case "move_reg":
      words = `${r[0]} = ${r[1]}: ${set}.`;
      break;
    case "load_imm_jump":
      words = `A call: ${r[0]} = ${nums[0]}, the way back, then on to ${target}. A jump ends the basic block.`;
      break;
    case "load_ind_u64": {
      const by = storedBy(mem![0], i);
      words = `Loads the 8 bytes at ${r[1]} + ${nums[0]} = ${value(mem![0])} into ${r[0]}: ${set}, ${by ? `the ${value(mem![1])} step ${by} stored there` : "since nothing was stored there and fresh memory is 0"}.`;
      break;
    }
    case "load_imm":
      words = `${r[0]} = ${nums[0]}.`;
      break;
    case "shlo_r_imm_alt_64":
      words = `${r[0]} = ${nums[0]} shifted right by ${r[1]} (${value(before.regs[Number(r[1].slice(1))])}) bits: ${set}.`;
      break;
    case "and_imm":
      words = `${r[0]} = ${r[1]} AND ${nums[0]}: ${set}, its lowest bit.`;
      break;
    case "branch_ne_imm": {
      const v = before.regs[Number(r[0].slice(1))];
      const taken = f.next === target;
      words = `${r[0]} is ${value(v)}, ${v !== nums[0] ? "not" : ""} ${nums[0]}, so the branch is ${taken ? `taken: on to ${target}` : "not taken"}. A branch ends the basic block.`.replace("  ", " ");
      break;
    }
    case "ecalli":
      words = `The machine stops on ecalli ${nums[0]}, a host call: ${nums[0]} is fetch, and r10 = ${value(f.regs[10])} asks for item ${value(f.regs[10])}, the protocol constants. ı stays on the ecalli until the host answers, in Part 16. The block's ${UNREACHED[1]}, at ${UNREACHED[0]}, never runs, but was paid for.`;
      break;
    default:
      words = `${name} ${args}.`;
  }
  return pay + words;
}
