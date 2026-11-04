// The PVM Playground's engine: the lessons' own PVM (pvm-engine/, copied from the lessons by
// tools/pvm-engine.ts) driven one instruction at a time, with everything a debugger shows
// recorded for each step. Nothing here decides what the machine does: stepWithGas and the
// lessons' host calls do, and this file only watches. It also holds the small assembler the
// playground's programs are written in. tools/widget-pvm-playground.test.ts runs every program
// beside the finished client and compares every step.

import { assemble as assembleBytes, deblob, startsInstruction, unpackCode } from "./pvm-engine/src/pvm/program.ts";
import type { Program } from "./pvm-engine/src/pvm/program.ts";
import { decodeInstruction, opcodeInfo, skip } from "./pvm-engine/src/pvm/instructions.ts";
import type { Instruction, Layout } from "./pvm-engine/src/pvm/instructions.ts";
import { blockCost, instructionCost, registersUsed, stepWithGas } from "./pvm-engine/src/pvm/gas.ts";
import type { Cost } from "./pvm-engine/src/pvm/gas.ts";
import { HALT_ADDRESS, newMachine, TERMINATORS } from "./pvm-engine/src/pvm/machine.ts";
import type { Exit, Machine } from "./pvm-engine/src/pvm/machine.ts";
import { addPages, PAGE_SIZE, readMemory } from "./pvm-engine/src/pvm/memory.ts";
import type { Access, Memory } from "./pvm-engine/src/pvm/memory.ts";
import { standardProgram } from "./pvm-engine/src/pvm/standard.ts";
import { accumulateHost, gas as gasCall, HOST_CALLS, unknown } from "./pvm-engine/src/host.ts";
import type { Accumulation, Host } from "./pvm-engine/src/host.ts";
import { TINY } from "./pvm-engine/src/config.ts";
import { blake2b256 } from "./pvm-engine/src/hash.ts";
import type { Account } from "./pvm-engine/src/services.ts";

export { HOST_CALLS, HALT_ADDRESS, PAGE_SIZE, TERMINATORS };
export type { Exit, Machine, Program, Instruction, Cost };

const M64 = 2n ** 64n;

/** A value in hex, as many digits as it needs. */
export const hex = (x: bigint | number): string => `0x${BigInt(x).toString(16)}`;

/** A register as the program means it: above 2^63 it's a negative number. */
export const signedText = (x: bigint): string => (x >= 2n ** 63n ? `−${M64 - x}` : `${x}`);

/** How a step ended, in words, for the exit panel: its name and what it means. */
export function exitWords(exit: Exit | null): { name: string; means: string } {
  if (exit === null) return { name: "ready", means: "The machine hasn't stopped: step it on." };
  if (exit === "continue") return { name: "running", means: "The instruction ran, and the machine carries on to the next one." };
  if (exit === "halt") return { name: "halt", means: "The program finished on purpose: it jumped to the halt address. Its answer stands." };
  if (exit === "panic") return { name: "panic", means: "The program did something the PVM forbids, such as trap or a jump to a bad address, or touched memory below 64 KiB. It stops for good and its changes are thrown away." };
  if (exit === "oog") return { name: "out of gas", means: "The next basic block costs more than the gas left. Blocks are paid for in full on the way in, so none of it ran." };
  if ("fault" in exit) return { name: "page fault", means: `The instruction touched page ${hex(exit.fault)}, which it isn't allowed to. ı stays on that instruction, and the registers are as they were.` };
  return { name: "host call", means: `The program asked the host for call ${exit.host}, ${HOST_CALLS[exit.host] ?? "one that doesn't exist"}.` };
}

/** The memory one instruction touches, worked out as the machine will before it runs. */
export type Touch = { address: number; size: number; write: boolean };

/** Where a load or store will land: the same sums as the machine's, for showing, not doing. */
export function touchOf(m: Machine, ins: Instruction): Touch | null {
  const [a, b] = ins.registers;
  const [x] = ins.immediates;
  const reg = m.registers;
  const at = (address: bigint) => Number(address % 2n ** 32n);
  const load = /^load_(ind_)?[ui](8|16|32|64)$/.exec(ins.name);
  if (load) return { address: at(load[1] ? reg[b] + x : x), size: Number(load[2]) / 8, write: false };
  const store = /^store_(imm_)?(ind_)?u(8|16|32|64)$/.exec(ins.name);
  if (!store) return null;
  const [, imm, indirect, bits] = store;
  const base = !indirect ? 0n : imm ? reg[a] : reg[b];
  return { address: at(base + x), size: Number(bits) / 8, write: true };
}

/** The symbol of an arithmetic instruction, for its line of plain words. */
const SYMBOLS: Record<string, string> = {
  add: "+", sub: "−", mul: "×", div_u: "÷", div_s: "÷", rem_u: "mod", rem_s: "mod",
  and: "AND", or: "OR", xor: "XOR", shlo_l: "<<", shlo_r: ">>", shar_r: ">>",
};
const COMPARE: Record<string, string> = {
  eq: "=", ne: "≠", lt_u: "<", le_u: "≤", ge_u: "≥", gt_u: ">", lt_s: "<", le_s: "≤", ge_s: "≥", gt_s: ">",
};

/** An instruction's text, as the assembler writes it: rD before rA, as the sums read. */
export function render(ins: Instruction): string {
  const r = (i: number) => `r${ins.registers[i]}`;
  const [x, y] = ins.immediates;
  const n = (v: bigint) => (v >= 2n ** 63n ? `-${M64 - v}` : v > 255n ? hex(v) : `${v}`);
  const to = ins.target === undefined ? "" : `@${ins.target}`;
  const parts: Record<Layout, () => string[]> = {
    none: () => [],
    imm: () => [n(x)],
    regExtImm: () => [r(0), hex(x)],
    immImm: () => [n(x), n(y)],
    offset: () => [to],
    regImm: () => [r(0), n(x)],
    regImmImm: () => [r(0), n(x), n(y)],
    regImmOffset: () => [r(0), n(x), to],
    regReg: () => [r(0), r(1)],
    regRegImm: () => [r(0), r(1), n(x)],
    regRegOffset: () => [r(0), r(1), to],
    regRegImmImm: () => [r(0), r(1), n(x), n(y)],
    regRegReg: () => [r(2), r(0), r(1)],
  };
  return `${ins.name} ${parts[ins.layout]().join(", ")}`.trim();
}

/** One line of plain words saying what an instruction did, from the values before and after. */
export function words(ins: Instruction, before: bigint[], after: bigint[], m: Machine, touch: Touch | null, exit: Exit): string {
  const [a, b, d] = ins.registers;
  const [x] = ins.immediates;
  const v = (reg: bigint[], i: number) => signedText(reg[i]);
  if (typeof exit === "object" && "fault" in exit) return `${ins.name} touched ${hex(touch?.address ?? exit.fault)}: not allowed there, so it stops.`;
  if (exit === "panic" && ins.name === "trap") return "trap: stop, this should never be reached.";
  if (touch) {
    const size = `${touch.size} byte${touch.size > 1 ? "s" : ""} at ${hex(touch.address)}`;
    if (exit === "panic") return `${ins.name} touched ${hex(touch.address)}, below 64 KiB: that's a panic.`;
    if (!touch.write) return `φ${a} = ${size}: ${v(after, a)}`;
    const stored = ins.name.startsWith("store_imm") ? "the value in the instruction" : `φ${a}`;
    return `${size} = ${stored}`;
  }
  const math = /^([a-z]+(?:_[a-z])?)(?:_imm)?(?:_(32|64))?$/.exec(ins.name);
  if (ins.layout === "regRegReg" && math && SYMBOLS[math[1]]) {
    return `φ${d} = φ${a} ${SYMBOLS[math[1]]} φ${b}: ${v(before, a)} ${SYMBOLS[math[1]]} ${v(before, b)} = ${v(after, d)}`;
  }
  if (ins.layout === "regRegImm" && math && SYMBOLS[math[1]]) {
    const down = math[1] === "add" && x >= 2n ** 63n; // adding −1 reads as taking 1 away
    const [symbol, right] = down ? ["−", `${M64 - x}`] : [SYMBOLS[math[1]], signedText(x)];
    return `φ${a} = φ${b} ${symbol} ${right}: ${v(before, b)} ${symbol} ${right} = ${v(after, a)}`;
  }
  if (ins.name.startsWith("branch_")) {
    const test = ins.name.slice("branch_".length).replace("_imm", "");
    const right = ins.name.endsWith("_imm") ? signedText(x) : v(before, b);
    if (exit === "panic") return `A branch may only land on the start of a basic block, and ${ins.target} isn't one: panic.`;
    const taken = m.pc === ins.target;
    return `${v(before, a)} ${COMPARE[test]} ${right}? ${taken ? `yes: jump to ${ins.target}` : `no: carry on to ${ins.next}`}`;
  }
  switch (ins.name) {
    case "load_imm":
    case "load_imm_64":
      return `φ${a} = ${v(after, a)}`;
    case "move_reg":
      return `φ${a} = φ${b}: ${v(after, a)}`;
    case "jump":
      return exit === "panic" ? `${ins.target} doesn't start a basic block: panic.` : `Jump to ${ins.target}.`;
    case "jump_ind": {
      const address = (before[a] + x) % 2n ** 32n;
      if (exit === "halt") return `Jump to ${hex(HALT_ADDRESS)}, the halt address: the program ends.`;
      if (exit === "panic") return `Jump to address ${address}: not an even place in the jump table, so panic.`;
      return `Jump to address ${address}: entry ${address / 2n - 1n} of the jump table, instruction ${m.pc}.`;
    }
    case "ecalli":
      return `Ask the host for call ${x}, ${HOST_CALLS[Number(x)] ?? "which doesn't exist"}.`;
    case "fallthrough":
      return `End this basic block and carry on to ${ins.next}.`;
    case "unlikely":
      return "Does nothing: a hint that this path is rarely taken.";
  }
  const { writes } = registersUsed(ins);
  return writes.length ? `${ins.name}: φ${writes[0]} = ${v(after, writes[0])}` : ins.name;
}

/** What one step did: enough to draw every panel, and to compare with another machine. */
export type Frame = {
  n: number; // steps run so far, this one included
  at: number; // ı before it
  ins: Instruction | null; // null when the next block couldn't be paid for
  pc: number; // ı after it
  before: bigint[];
  after: bigint[];
  reads: number[];
  writes: number[];
  gasBefore: bigint;
  gasAfter: bigint;
  paid: bigint; // the basic block paid for on the way in, or 0
  hostPaid: bigint; // what the host call charged, or 0
  touch: Touch | null;
  bytes: number[]; // the bytes read or written
  exit: Exit;
  hostAnswer: string | null;
  says: string;
};

/** A basic block paid for: where, how much, and the gas spent once it was. */
export type Paid = { at: number; cost: bigint; spent: bigint };

/** Everything needed to start a run, and to start it again. */
export type Run = {
  program: Program;
  pc: number;
  gas: bigint;
  registers: bigint[];
  memory: () => Memory;
  host: () => Host;
  labels?: Map<number, string>;
};

/** How many steps of detail a session keeps; earlier ones are replayed if asked for. */
const KEPT = 4096;

/** A machine, run one instruction at a time, with a record of each step. */
export class Session {
  readonly run: Run;
  machine: Machine;
  host: Host;
  frames: Frame[] = [];
  blocks: Paid[] = [];
  n = 0;
  stopped: Exit | null = null;
  hostCalls = 0;

  constructor(run: Run) {
    this.run = run;
    this.machine = newMachine(run.program, [...run.registers], run.memory(), run.gas);
    this.machine.pc = run.pc;
    this.host = run.host();
  }

  get last(): Frame | null {
    return this.frames.at(-1) ?? null;
  }

  /** The block the next instruction would pay for, if it isn't paid for yet. */
  get nextCost(): number | null {
    return this.machine.charged ? null : blockCost(this.machine.program, this.machine.pc);
  }

  /** Runs one instruction: Ψ₁ with gas, and the host's answer if it asked for one. */
  advance(): Frame | null {
    if (this.stopped !== null) return null;
    const m = this.machine;
    const [at, gasBefore, wasCharged] = [m.pc, m.gas, m.charged];
    const before = [...m.registers];
    const ins = decodeInstruction(m.program, at);
    const cost = wasCharged ? 0n : BigInt(blockCost(m.program, at));
    const touch = m.gas >= cost ? touchOf(m, ins) : null;
    const used = registersUsed(ins);
    let exit = stepWithGas(m);
    if (exit === "oog") {
      this.stopped = exit;
      const says = `The block at ${at} costs ${cost}, and only ${gasBefore} is left: out of gas. None of it ran.`;
      return this.record({ at, ins: null, before, reads: [], writes: [], gasBefore, paid: 0n, hostPaid: 0n, touch: null, bytes: [], exit, hostAnswer: null, says });
    }
    const paid = cost;
    if (paid > 0n) this.blocks.push({ at, cost, spent: this.run.gas - gasBefore + cost });
    let bytes: number[] = [];
    if (touch && (exit === "continue")) {
      const read = readMemory(m.memory, BigInt(touch.address), touch.size);
      if (read instanceof Uint8Array) bytes = [...read];
    }
    let says = words(ins, before, m.registers, m, touch, exit);
    let hostPaid = 0n;
    let hostAnswer: string | null = null;
    if (typeof exit === "object" && "host" in exit) {
      const call = exit.host;
      this.hostCalls++;
      const gasHere = m.gas;
      const answer = this.host(call, m);
      hostPaid = gasHere - m.gas;
      const name = HOST_CALLS[call] ?? `${call}`;
      hostAnswer = `${name}: φ7 = ${signedText(m.registers[7])} (${hex(m.registers[7])}), ${hostPaid} gas`;
      if (answer === "continue") {
        m.pc += 1 + skip(m.program, m.pc); // ı″: the one after the ecalli, as runWithHost does
        says += ` It answers φ7 = ${signedText(m.registers[7])}.`;
      } else {
        exit = answer;
        this.stopped = answer;
        says += ` It stops the machine: ${exitWords(answer).name}.`;
      }
    } else if (exit !== "continue") {
      this.stopped = exit;
    }
    const writes = hostAnswer ? [...used.writes, 7] : used.writes; // the host answers in φ7
    return this.record({ at, ins, before, reads: used.reads, writes, gasBefore, paid, hostPaid, touch, bytes, exit, hostAnswer, says });
  }

  private record(f: Omit<Frame, "n" | "pc" | "after" | "gasAfter">): Frame {
    this.n++;
    const frame: Frame = { ...f, n: this.n, pc: this.machine.pc, after: [...this.machine.registers], gasAfter: this.machine.gas };
    this.frames.push(frame);
    if (this.frames.length > KEPT) this.frames.shift();
    return frame;
  }
}

/** A new session on the same run, stepped on to `n`: how the debugger goes backwards. */
export function replay(run: Run, n: number): Session {
  const session = new Session(run);
  while (session.n < n && session.stopped === null) session.advance();
  return session;
}

/** Each instruction of a program, in order, for the code panel. */
export type Line = { at: number; text: string; bytes: number[]; block: boolean; terminator: boolean; label?: string; cost: Cost };

/** The program's instructions, from byte 0: what the code panel lists. */
export function disassemble(program: Program, labels?: Map<number, string>): Line[] {
  const machine = newMachine(program);
  const lines: Line[] = [];
  for (let i = 0; i < program.code.length; i++) {
    if (!startsInstruction(program, i) || !opcodeInfo(program.code[i])) continue;
    const ins = decodeInstruction(program, i);
    lines.push({
      at: i,
      text: render(ins),
      bytes: [...program.code.slice(i, ins.next)],
      block: machine.blocks.has(i),
      terminator: TERMINATORS.has(ins.opcode),
      label: labels?.get(i),
      cost: instructionCost(program, ins),
    });
  }
  return lines;
}

/** The answer a machine's pages give the memory panel: runs of pages with the same access. */
export type Region = { start: number; pages: number; access: Access };

export function regions(memory: Memory): Region[] {
  const out: Region[] = [];
  for (const page of [...memory.keys()].sort((a, b) => a - b)) {
    const access = memory.get(page)!.access;
    const last = out.at(-1);
    if (last && last.access === access && last.start / PAGE_SIZE + last.pages === page) last.pages++;
    else out.push({ start: page * PAGE_SIZE, pages: 1, access });
  }
  return out;
}

/** The hex view's rows around an address: `width` bytes each, or null where there's no page. */
export function hexRows(memory: Memory, address: number, count = 8, width = 16): { address: number; bytes: number[] | null; access: Access | null }[] {
  const first = Math.max(0, Math.floor(address / width) - 1) * width;
  return Array.from({ length: count }, (_, k) => {
    const start = first + k * width;
    const page = memory.get(Math.floor(start / PAGE_SIZE));
    if (!page) return { address: start, bytes: null, access: null };
    const from = start % PAGE_SIZE;
    return { address: start, bytes: [...page.bytes.slice(from, from + width)], access: page.access };
  });
}

// ─── The assembler ───────────────────────────────────────────────────────────

/** A line the assembler couldn't read. */
export class AssemblyError extends Error {
  readonly line: number;
  constructor(line: number, message: string) {
    super(`line ${line}: ${message}`);
    this.line = line;
  }
}

const OPCODES = new Map<string, { opcode: number; layout: Layout }>();
for (let opcode = 0; opcode < 256; opcode++) {
  const info = opcodeInfo(opcode);
  if (info) OPCODES.set(info.name, { opcode, layout: info.layout });
}

/** Every instruction name the assembler knows, for the help under the editor. */
export const INSTRUCTIONS = [...OPCODES.keys()];

/** x as n little-endian bytes. */
const le = (x: bigint, n: number): number[] => {
  const value = ((x % 2n ** BigInt(8 * n)) + 2n ** BigInt(8 * n)) % 2n ** BigInt(8 * n);
  return Array.from({ length: n }, (_, k) => Number((value >> BigInt(8 * k)) & 255n));
};

/** The fewest bytes (0 to 4) that sign-extend back to x, as the GP's encoding allows. */
function shortest(x: bigint): number[] {
  for (let n = 0; n <= 4; n++) {
    const half = n === 0 ? 0n : 2n ** BigInt(8 * n - 1);
    if (n === 0 ? x === 0n : x >= -half && x < half) return le(x, n);
  }
  throw new Error(`${x} needs more than 4 bytes: use load_imm_64`);
}

type Operand = { reg?: number; value?: bigint; label?: string };

function operand(text: string, line: number): Operand {
  const t = text.trim();
  const reg = /^r(\d+)$/.exec(t);
  if (reg) {
    if (Number(reg[1]) > 12) throw new AssemblyError(line, `there are 13 registers, r0 to r12: not ${t}`);
    return { reg: Number(reg[1]) };
  }
  if (/^-?(0x[0-9a-f_]+|[0-9_]+)$/i.test(t)) {
    const negative = t.startsWith("-");
    const value = BigInt(t.replace("-", "").replaceAll("_", ""));
    return { value: negative ? -value : value };
  }
  if (/^[a-z_][a-z0-9_]*$/i.test(t)) return { label: t };
  throw new AssemblyError(line, `can't read "${t}"`);
}

type Parsed = { line: number; name: string; args: Operand[] };

/** The registers, numbers and labels each layout takes, in the order the text writes them. */
const SHAPES: Record<Layout, string> = {
  none: "", imm: "n", regExtImm: "rn", immImm: "nn", offset: "l", regImm: "rn", regImmImm: "rnn",
  regImmOffset: "rnl", regReg: "rr", regRegImm: "rrn", regRegOffset: "rrl", regRegImmImm: "rrnn", regRegReg: "rrr",
};

/** An instruction's bytes. Without labels, just the right number of them: the first pass. */
function encode(p: Parsed, at: number, labels: Map<string, number> | null): number[] {
  const { opcode, layout } = OPCODES.get(p.name)!;
  const shape = SHAPES[layout];
  if (p.args.length !== shape.length) throw new AssemblyError(p.line, `${p.name} takes ${shape.length} argument${shape.length === 1 ? "" : "s"}`);
  const reg = (i: number) => {
    const r = p.args[i].reg;
    if (r === undefined) throw new AssemblyError(p.line, `${p.name}: argument ${i + 1} should be a register`);
    return r;
  };
  const num = (i: number) => {
    const v = p.args[i].value;
    if (v === undefined) throw new AssemblyError(p.line, `${p.name}: argument ${i + 1} should be a number`);
    return v;
  };
  const imm = (i: number) => {
    try {
      return shortest(num(i));
    } catch (e) {
      if (e instanceof AssemblyError) throw e;
      throw new AssemblyError(p.line, (e as Error).message);
    }
  };
  const offset = (i: number) => {
    const name = p.args[i].label;
    if (name === undefined) throw new AssemblyError(p.line, `${p.name}: argument ${i + 1} should be a label`);
    const target = labels === null ? at : labels.get(name); // null: only the size matters yet
    if (target === undefined) throw new AssemblyError(p.line, `no label called ${name}`);
    return le(BigInt(target - at), 4);
  };
  const pair = (low: number, high: number) => low | (high << 4);
  switch (layout) {
    case "none": return [opcode];
    case "imm": return [opcode, ...imm(0)];
    case "regExtImm": return [opcode, reg(0), ...le(num(1), 8)];
    case "immImm": { const x = imm(0); return [opcode, x.length, ...x, ...imm(1)]; }
    case "offset": return [opcode, ...offset(0)];
    case "regImm": return [opcode, reg(0), ...imm(1)];
    case "regImmImm": { const x = imm(1); return [opcode, pair(reg(0), x.length), ...x, ...imm(2)]; }
    case "regImmOffset": { const x = imm(1); return [opcode, pair(reg(0), x.length), ...x, ...offset(2)]; }
    case "regReg": return [opcode, pair(reg(0), reg(1))]; // rD, rA
    case "regRegImm": return [opcode, pair(reg(0), reg(1)), ...imm(2)];
    case "regRegOffset": return [opcode, pair(reg(0), reg(1)), ...offset(2)];
    case "regRegImmImm": { const x = imm(2); return [opcode, pair(reg(0), reg(1)), x.length, ...x, ...imm(3)]; }
    case "regRegReg": return [opcode, pair(reg(1), reg(2)), reg(0)]; // written rD, rA, rB
  }
}

/** A program as text, assembled: what a run needs, and the labels for the code panel. */
export type Assembled = Run & { source: string };

/**
 * Assembles a program. Lines are `label:`, an instruction, or a directive; `;` starts a
 * comment. `halt` is shorthand for jump_ind r0, 0, with r0 holding the halt address.
 *   .gas 1000                 the starting gas
 *   .reg r7 = 3               a register's starting value
 *   .page 0x20000 W [count]   pages of memory, W (read and write) or R (read only)
 *   .data 0x20000 ef be       bytes in memory at the start
 *   .jump_table one, two      the jump table's entries, by label
 */
export function assemble(source: string): Assembled {
  const parsed: Parsed[] = [];
  const pending = new Map<number, string[]>(); // the labels waiting for the next instruction
  const pages: { start: number; length: number; access: Access }[] = [];
  const data: { address: number; bytes: number[]; line: number }[] = [];
  const registers = Array<bigint>(13).fill(0n);
  registers[0] = HALT_ADDRESS; // as Y sets it: returning from the program ends it
  let gas = 10_000n;
  let table: { names: string[]; line: number } = { names: [], line: 0 };
  source.split("\n").forEach((raw, index) => {
    const line = index + 1;
    let text = raw.replace(/;.*$/, "").trim();
    if (!text) return;
    if (text.startsWith(".")) {
      const [directive, ...rest] = text.split(/\s+/);
      const number = (t: string) => {
        const { value } = operand(t, line);
        if (value === undefined) throw new AssemblyError(line, `${directive} needs a number, not ${t}`);
        return value;
      };
      if (directive === ".gas") gas = number(rest[0]);
      else if (directive === ".reg") {
        const m = /^(r\d+)\s*=\s*(.+)$/.exec(rest.join(" "));
        const reg = m ? operand(m[1], line).reg : undefined;
        if (!m || reg === undefined) throw new AssemblyError(line, "write .reg r7 = 3");
        registers[reg] = ((number(m[2]) % M64) + M64) % M64;
      } else if (directive === ".page") {
        const access = rest[1] as Access;
        if (access !== "R" && access !== "W") throw new AssemblyError(line, "a page is R or W");
        pages.push({ start: Number(number(rest[0])), length: Number(rest[2] ?? 1) * PAGE_SIZE, access });
      } else if (directive === ".data") {
        data.push({ address: Number(number(rest[0])), bytes: rest.slice(1).map((b) => parseInt(b, 16)), line });
      } else if (directive === ".jump_table") {
        table = { names: rest.join(" ").split(",").map((s) => s.trim()).filter(Boolean), line };
      } else throw new AssemblyError(line, `there's no directive ${directive}`);
      return;
    }
    const label = /^([a-z_][a-z0-9_]*):\s*(.*)$/i.exec(text);
    if (label) {
      pending.set(parsed.length, [...(pending.get(parsed.length) ?? []), label[1]]);
      text = label[2];
      if (!text) return;
    }
    const space = text.search(/\s/);
    const name = space < 0 ? text : text.slice(0, space);
    const rest = space < 0 ? "" : text.slice(space + 1);
    if (name === "halt") {
      parsed.push({ line, name: "jump_ind", args: [{ reg: 0 }, { value: 0n }] });
      return;
    }
    if (!OPCODES.has(name)) throw new AssemblyError(line, `there's no instruction ${name}`);
    parsed.push({ line, name, args: rest.trim() ? rest.split(",").map((a) => operand(a, line)) : [] });
  });
  if (parsed.length === 0) throw new AssemblyError(1, "there are no instructions");
  const lastOp = OPCODES.get(parsed.at(-1)!.name)!.opcode;
  if (!TERMINATORS.has(lastOp)) parsed.push({ line: 0, name: "trap", args: [] }); // ζ past the end reads as trap
  // twice: the first pass finds where each instruction lands, the second writes the offsets
  const place = (known: Map<string, number> | null) => {
    let at = 0;
    const labels = new Map<string, number>();
    const code = parsed.map((p, i) => {
      for (const name of pending.get(i) ?? []) labels.set(name, at);
      const bytes = encode(p, at, known);
      at += bytes.length;
      return bytes;
    });
    return { code, labels };
  };
  const { labels } = place(null);
  const { code } = place(labels);
  const program = assembleBytes(code);
  program.jumpTable = table.names.map((name) => {
    const target = labels.get(name);
    if (target === undefined) throw new AssemblyError(table.line, `no label called ${name}`);
    return target;
  });
  for (const { address, line } of data) {
    if (!pages.some((p) => address >= p.start && address < p.start + p.length)) {
      throw new AssemblyError(line, `.data at ${hex(address)} needs a .page there`);
    }
  }
  const memory = () => {
    const m: Memory = new Map();
    for (const p of pages) addPages(m, p.start, p.length, p.access);
    for (const { address, bytes } of data) {
      bytes.forEach((byte, k) => {
        m.get(Math.floor((address + k) / PAGE_SIZE))!.bytes[(address + k) % PAGE_SIZE] = byte;
      });
    }
    return m;
  };
  const names = new Map([...labels].map(([name, at]) => [at, name]));
  return { program, pc: 0, gas, registers, memory, host: () => toyHost, labels: names, source };
}

/** The small programs' host: gas, as the lessons answer it, and WHAT for anything else. */
export const toyHost: Host = (call, m) => (HOST_CALLS[call] === "gas" ? gasCall(m) : unknown(m));

// ─── The real service ────────────────────────────────────────────────────────

/** Service 0's account record in the fallback trace's state, code hash aside. */
export const BOOTSTRAP_INFO = {
  version: 0,
  balance: 2n ** 64n - 1n,
  min_item_gas: 10n,
  min_memo_gas: 10n,
  bytes: 159534n,
  deposit_offset: 2n ** 64n - 1n,
  items: 4,
  creation_slot: 0,
  last_accumulation_slot: 0,
  parent_service: 0,
};

/**
 * The bootstrap service's accumulation, on the code it keeps in the fallback trace's state:
 * Ψ_A's way in, ı = 5, with Y's memory and registers, slot 1, and no work to accumulate.
 */
export function bootstrapRun(preimage: Uint8Array, gas: bigint): Run {
  const code = unpackCode(preimage);
  const args = Uint8Array.from([1, 0, 0]); // the slot, the service and the input count, E(1, 0, 0)
  const start = () => standardProgram(code, args);
  const program = deblob(code.program);
  return {
    program,
    pc: 5,
    gas,
    registers: start().registers,
    memory: () => start().memory,
    host: () => {
      const account = (): Account => ({ info: { ...BOOTSTRAP_INFO, code_hash: blake2b256(preimage) }, storage: new Map(), preimages: new Map(), requests: new Map() });
      const a: Accumulation = { id: 0, accounts: new Map([[0, account()]]), checkpoint: new Map([[0, account()]]), code, entropy: new Uint8Array(32), inputs: [] };
      return accumulateHost(TINY, a, 1);
    },
  };
}
