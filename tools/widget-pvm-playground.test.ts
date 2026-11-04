// The PVM playground, checked three ways: every program step by step beside the finished
// client (reference/, where it's here), every program's ending and every "Try this" on the page
// (always, the site's build included), and the real service against the trace it came from.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { assemble, AssemblyError, bootstrapRun, BOOTSTRAP_INFO, disassemble, exitWords, hexRows, regions, render, replay, Session } from "../.vitepress/theme/pvm-playground.ts";
import type { Exit, Run } from "../.vitepress/theme/pvm-playground.ts";
import { DEMO, REAL, SCENARIOS } from "../.vitepress/theme/pvm-scenarios.ts";
import { blake2b256 } from "../.vitepress/theme/pvm-engine/src/hash.ts";
import { toHex } from "../.vitepress/theme/pvm-engine/src/bytes.ts";
import { ROOT, lessonText } from "./lessons.ts";

const REFERENCE = join(ROOT, "reference/src");
const PREIMAGE = new Uint8Array(readFileSync(join(ROOT, "lessons/public/pvm/bootstrap-service.bin")));

const source = (id: string) => SCENARIOS.find((s) => s.id === id)!.source;
/** A program with one piece of its text changed: what a "Try this" asks the reader to do. */
const edit = (id: string, from: string, to: string) => {
  assert.ok(source(id).includes(from), `${id} has no "${from}"`);
  return source(id).replace(from, to);
};
/** Runs a program to its stop. */
function runToStop(text: string): Session {
  const s = new Session(assemble(text));
  while (s.stopped === null && s.n < 100_000) s.advance();
  return s;
}
const costs = (s: Session) => s.blocks.map((b) => Number(b.cost));
const reg = (s: Session, i: number) => s.machine.registers[i];

test("every program ends as its text says", () => {
  const ends: Record<string, { exit: Exit; n: number; left: bigint; check?: (s: Session) => void }> = {
    registers: { exit: "halt", n: 7, left: 976n, check: (s) => assert.deepEqual(s.machine.registers.slice(7), [3n, 4n, 7n, 49n, 1n, 49n]) },
    immediates: {
      exit: "halt", n: 8, left: 976n,
      check: (s) => {
        assert.equal(reg(s, 9), 2n ** 64n - 1n);
        assert.equal(reg(s, 12), 2n ** 64n - 2n ** 31n); // −2,147,483,648
      },
    },
    loop: { exit: "halt", n: 19, left: 871n, check: (s) => assert.equal(reg(s, 7), 15n) },
    memory: { exit: { fault: 0x30000 }, n: 5, left: 1974n, check: (s) => assert.equal(reg(s, 8), 0x7788n) },
    "no-page": { exit: { fault: 0x21000 }, n: 3, left: 974n },
    "out-of-gas": { exit: "oog", n: 10, left: 16n, check: (s) => assert.equal(reg(s, 7), 1000n + 999n) },
    jumps: { exit: "panic", n: 5, left: 954n, check: (s) => assert.equal(reg(s, 8), 2n) },
    "host-call": {
      exit: "halt", n: 5, left: 850n,
      check: (s) => {
        assert.equal(reg(s, 8), 1850n);
        assert.equal(reg(s, 9), 2n ** 64n - 2n); // WHAT
        assert.equal(s.hostCalls, 2);
      },
    },
    "block-cost": { exit: "halt", n: 12, left: 927n, check: (s) => assert.deepEqual(costs(s), [5, 8, 60]) },
    array: {
      exit: "halt", n: 25, left: 1869n,
      check: (s) => {
        assert.equal(reg(s, 7), 100n);
        assert.equal(s.machine.memory.get(0x20)!.bytes[0x20], 100); // the total, past the numbers
      },
    },
  };
  for (const s of SCENARIOS) {
    if (s.id === REAL) continue;
    const end = ends[s.id];
    assert.ok(end, `no ending checked for ${s.id}`);
    const session = runToStop(s.source);
    assert.deepEqual(session.stopped, end.exit, s.id);
    assert.equal(session.n, end.n, s.id);
    assert.equal(session.machine.gas, end.left, s.id);
    end.check?.(session);
  }
});

test("the page's plain words are the machine's numbers", () => {
  const says = (text: string) => {
    const s = runToStop(text);
    return s.frames.map((f) => f.says);
  };
  const registers = says(source("registers"));
  assert.ok(registers.includes("φ9 = φ7 + φ8: 3 + 4 = 7"));
  assert.ok(registers.includes("φ10 = φ9 × φ9: 7 × 7 = 49"));
  assert.ok(says(source("loop")).includes("φ8 = φ8 − 1: 5 − 1 = 4"));
  assert.ok(says(source("loop")).includes("4 ≠ 0? yes: jump to 6"));
  assert.ok(says(source("loop")).includes("1 ≠ 0? yes: jump to 6"));
  assert.ok(says(source("loop")).includes("0 ≠ 0? no: carry on to 18"));
  assert.ok(says(source("memory")).includes("φ8 = 2 bytes at 0x20008: 30600"));
  assert.ok(says(source("out-of-gas")).at(-1)!.includes("costs 21, and only 16 is left"));
  assert.ok(says(source("host-call"))[0].includes("It answers φ7 = 1850"));
});

test("every Try this on the page does what it says", () => {
  // the 13 registers
  assert.equal(reg(runToStop(edit("registers", "load_imm r7, 3", "load_imm r7, 300")), 9), 304n);
  assert.equal(runToStop(`load_imm r0, 0\n${source("registers")}`).stopped, "panic");
  assert.throws(() => assemble("add_64 r13, r7, r8"), /there are 13 registers/);
  // immediates
  assert.equal(reg(runToStop(edit("immediates", "add_imm_32", "add_imm_64")), 12), 2147483648n);
  const line = disassemble(assemble(edit("immediates", "load_imm r8, 128", "load_imm r8, 255")).program)[1];
  assert.equal(line.bytes.length, 4); // opcode, register, ff 00
  // the loop
  assert.equal(runToStop(source("loop").replace("  fallthrough               ; end this block, so that the next line starts one\n", "")).stopped, "panic");
  assert.equal(runToStop(edit("loop", "load_imm r8, 5", "load_imm r8, 50")).stopped, "oog");
  assert.equal(runToStop(edit("loop", "load_imm r8, 5", "load_imm r8, 50").replace(".gas 1000", ".gas 5000")).stopped, "halt");
  // memory
  assert.equal(runToStop(edit("memory", ".page 0x30000 R", ".page 0x30000 W")).stopped, "halt");
  const touched = (text: string) => runToStop(text).frames[2].bytes.length;
  assert.equal(touched(edit("memory", "load_ind_u16", "load_ind_u8")), 1);
  assert.equal(touched(edit("memory", "load_ind_u16", "load_ind_u64")), 8);
  // memory that isn't there
  const pageEnd = edit("no-page", "load_ind_u64 r8, r1, 0x1000", "load_ind_u64 r8, r1, 8");
  assert.equal(runToStop(pageEnd).stopped, "halt");
  assert.equal(runToStop(edit("no-page", "load_ind_u64 r8, r1, 0x1000", "load_u64 r8, 0x100")).stopped, "panic");
  assert.deepEqual(runToStop(edit("no-page", "load_ind_u64 r8, r1, 0x1000", "load_ind_u64 r8, r1, 4092")).stopped, { fault: 0x21000 });
  // out of gas
  assert.equal(reg(runToStop(edit("out-of-gas", ".gas 60", ".gas 23")), 7), 1000n); // one pass
  assert.equal(reg(runToStop(edit("out-of-gas", ".gas 60", ".gas 22")), 7), 0n); // none
  // jumps
  const entry0 = runToStop(edit("jumps", "load_imm r7, 4", "load_imm r7, 2"));
  assert.equal(entry0.stopped, "halt");
  assert.equal(reg(entry0, 8), 1n);
  assert.equal(runToStop(edit("jumps", "load_imm r7, 3", "load_imm r7, 6")).stopped, "panic");
  // the host
  assert.equal(runToStop(edit("host-call", ".gas 2000", ".gas 1000")).stopped, "oog");
  const later = edit("host-call", "  ecalli 0            ; gas: how much is left?\n", "").replace("  move_reg r9, r7\n", "  move_reg r9, r7\n  ecalli 0\n");
  assert.equal(reg(runToStop(later), 7), 849n); // about 1,000 less: its block costs 1 more here
  // what a block costs
  assert.deepEqual(costs(runToStop(source("block-cost").replaceAll("add_32", "add_64"))).slice(0, 2), [4, 4]);
  const load = edit("block-cost", ".gas 1000", ".gas 1000\n.page 0x20000 W\n  load_u64 r2, 0x20000");
  assert.ok(costs(runToStop(load))[0] >= 25);
  // the small real program
  const low = runToStop(edit("array", ".gas 2000", ".gas 100"));
  assert.equal(low.stopped, "oog");
  assert.equal(low.machine.memory.get(0x20)!.bytes[0x20], 0);
});

test("the assembler says what's wrong, by line", () => {
  const wrong: [string, RegExp][] = [
    ["bogus r1", /line 1: there's no instruction bogus/],
    ["\nadd_64 r1, r2", /line 2: add_64 takes 3 arguments/],
    ["load_imm 3, r7", /line 1: load_imm: argument 1 should be a register/],
    ["jump nowhere", /no label called nowhere/],
    [".data 0x20000 ef\ntrap", /line 1: \.data at 0x20000 needs a \.page there/],
    ["load_imm r7, 0x1ffffffff", /needs more than 4 bytes/],
    ["; only a comment", /there are no instructions/],
  ];
  for (const [text, message] of wrong) assert.throws(() => assemble(text), (e: unknown) => e instanceof AssemblyError && message.test(e.message), text);
});

test("a program written back out assembles to the same bytes", () => {
  for (const s of SCENARIOS) {
    if (s.id === REAL) continue;
    const { program } = assemble(s.source);
    const lines = disassemble(program);
    const text = lines.map((l) => `at_${l.at}: ${l.text.replace(/@(\d+)/, "at_$1")}`).join("\n");
    assert.deepEqual([...assemble(text).program.code], [...program.code], s.id);
  }
});

test("going back is the same machine: replay reaches every step exactly", () => {
  for (const s of SCENARIOS) {
    if (s.id === REAL) continue;
    const forward = runToStop(s.source);
    for (const frame of forward.frames) {
      const back = replay(assemble(s.source), frame.n);
      assert.deepEqual(back.last, frame, `${s.id}, step ${frame.n}`);
    }
  }
});

test("memory touches: the bytes shown are the bytes that changed, and no others", () => {
  const snapshot = (s: Session) => new Map([...s.machine.memory].map(([page, p]) => [page, [...p.bytes]]));
  for (const c of SCENARIOS) {
    if (c.id === REAL) continue;
    const s = new Session(assemble(c.source));
    while (s.stopped === null) {
      const before = snapshot(s);
      const f = s.advance()!;
      const changed: number[] = [];
      for (const [page, bytes] of snapshot(s)) {
        bytes.forEach((b, k) => {
          if (b !== before.get(page)![k]) changed.push(page * 4096 + k);
        });
      }
      if (f.touch?.write && f.exit === "continue") {
        const from = f.touch.address;
        for (const at of changed) assert.ok(at >= from && at < from + f.touch.size, `${c.id}: wrote ${at}`);
        f.bytes.forEach((b, k) => assert.equal(b, s.machine.memory.get(Math.floor((from + k) / 4096))!.bytes[(from + k) % 4096]));
      } else {
        assert.deepEqual(changed, [], `${c.id}, step ${f.n}: nothing should change`);
      }
    }
  }
});

test("the memory panel's map and rows are the machine's", () => {
  const s = runToStop(source("memory"));
  assert.deepEqual(regions(s.machine.memory), [{ start: 0x20000, pages: 1, access: "W" }, { start: 0x30000, pages: 1, access: "R" }]);
  const rows = hexRows(s.machine.memory, 0x20008);
  assert.deepEqual(rows[1].bytes!.slice(8), [0x88, 0x77, 0x66, 0x55, 0x44, 0x33, 0x22, 0x11]);
  assert.equal(hexRows(s.machine.memory, 0x40000)[1].bytes, null);
});

test("every way of stopping has words for it", () => {
  const stops: Exit[] = ["halt", "panic", "oog", { fault: 0x30000 }, { host: 0 }, "continue"];
  for (const exit of stops) assert.ok(exitWords(exit).means.length > 20);
  assert.equal(exitWords({ fault: 0x30000 }).name, "page fault");
});

test("the real service: the file is the code service 0 keeps, and it runs to a clean halt", () => {
  // the code hash in the fallback trace's account record, C(255, 0)
  assert.equal(toHex(blake2b256(PREIMAGE)), "0x128fc8f0578f393bd12da1e73e030afe53fde62069fc8f6f87a5c914b1843135");
  assert.equal(PREIMAGE.length, 159322);
  const s = new Session(bootstrapRun(PREIMAGE, 1_000_000n));
  assert.equal(s.machine.pc, 5); // Ψ_A's way in
  assert.equal(s.machine.registers[7], 0xfeff0000n); // where the arguments are
  assert.equal(s.machine.registers[8], 3n); // and how long
  assert.deepEqual([...s.machine.memory.get(0xfeff0000 / 4096)!.bytes.slice(0, 3)], [1, 0, 0]);
  const calls: string[] = [];
  while (s.stopped === null) {
    const f = s.advance()!;
    if (f.hostAnswer) calls.push(f.hostAnswer.split(":")[0]);
  }
  assert.equal(s.stopped, "halt");
  assert.equal(s.n, 3318);
  assert.equal(1_000_000n - s.machine.gas, 20273n);
  assert.deepEqual(calls, ["fetch", "grow_heap", "grow_heap", "fetch", "info", "100", "fetch", "fetch"]);
  const short = new Session(bootstrapRun(PREIMAGE, 5000n));
  while (short.stopped === null) short.advance();
  assert.equal(short.stopped, "oog"); // the Try this
  assert.ok(lessonText("15-the-pvm/02-instructions.md").includes("accumulate* at byte 5"));
});

test("the demo goes through programs that exist, and says true numbers", () => {
  for (const d of DEMO) assert.ok(SCENARIOS.some((s) => s.id === d.scenario), d.scenario);
  assert.equal(DEMO.at(-1)!.scenario, REAL);
  const all = DEMO.map((d) => d.say).join(" ");
  assert.ok(all.includes("159,322"));
  assert.ok(all.includes("3,318"));
  assert.ok(all.includes("5 and 8"));
});

/** The account the trace vectors give service 0, where they're here. */
test("the real service's account is the one in the fallback trace", async (t) => {
  const trace = join(ROOT, "vectors/traces/fallback/00000001.json");
  if (!existsSync(REFERENCE) || !existsSync(trace)) return t.skip("no reference/ or vectors/");
  const { fromHex } = await import(`${REFERENCE}/bytes.ts`);
  const { readService, serviceCode } = await import(`${REFERENCE}/services.ts`);
  const { keyvals } = JSON.parse(readFileSync(trace, "utf8")).pre_state;
  const entries = keyvals.map((e: { key: string; value: string }) => ({ key: fromHex(e.key), value: fromHex(e.value) }));
  const info = readService(entries, 0);
  assert.deepEqual([...serviceCode(entries, 0)], [...PREIMAGE]);
  const { code_hash: _, ...rest } = info;
  assert.deepEqual(rest, BOOTSTRAP_INFO);
});

/** Steps the finished client's machine beside the playground's and compares every step. */
async function lockstep(name: string, run: Run, host: (call: number, m: never) => string) {
  const { stepWithGas } = await import(`${REFERENCE}/pvm/gas.ts`);
  const { newMachine } = await import(`${REFERENCE}/pvm/machine.ts`);
  const { skip } = await import(`${REFERENCE}/pvm/instructions.ts`);
  const m = newMachine(run.program, [...run.registers], run.memory(), run.gas);
  m.pc = run.pc;
  const s = new Session(run);
  for (;;) {
    let exit = stepWithGas(m);
    if (typeof exit === "object" && "host" in exit) {
      const answer = host(exit.host, m as never);
      if (answer === "continue") m.pc += 1 + skip(m.program, m.pc);
      else exit = answer;
    }
    const f = s.advance()!;
    const where = `${name}, step ${f.n}`;
    assert.equal(f.pc, m.pc, `${where}: ı`);
    assert.deepEqual(f.after, m.registers, `${where}: registers`);
    assert.equal(f.gasAfter, m.gas, `${where}: gas`);
    assert.deepEqual(f.exit, exit, `${where}: exit`);
    const stopped = !(exit === "continue" || (typeof exit === "object" && "host" in exit));
    if (stopped || f.touch?.write) {
      assert.deepEqual(s.machine.memory, m.memory, `${where}: memory`);
    }
    if (stopped) return s;
  }
}

test("every program, step by step, beside the finished client", async (t) => {
  if (!existsSync(REFERENCE)) return t.skip("no reference/");
  const { gas, unknown, HOST_CALLS } = await import(`${REFERENCE}/host.ts`);
  const host = (call: number, m: never) => (HOST_CALLS[call] === "gas" ? gas(m) : unknown(m));
  for (const s of SCENARIOS) if (s.id !== REAL) await lockstep(s.id, assemble(s.source), host);
});

test("the real service, every step, beside the finished client's own accumulate", async (t) => {
  if (!existsSync(REFERENCE)) return t.skip("no reference/");
  const { accumulate, accumulateHost } = await import(`${REFERENCE}/host.ts`);
  const { TINY } = await import(`${REFERENCE}/config.ts`);
  const { unpackCode } = await import(`${REFERENCE}/pvm/program.ts`);
  const code = unpackCode(PREIMAGE);
  const account = () => ({ info: { ...BOOTSTRAP_INFO, code_hash: blake2b256(PREIMAGE) }, storage: new Map(), preimages: new Map(), requests: new Map() });
  const a = () => ({ id: 0, accounts: new Map([[0, account()]]), checkpoint: new Map([[0, account()]]), code, entropy: new Uint8Array(32), inputs: [] });
  const s = await lockstep("the real service", bootstrapRun(PREIMAGE, 1_000_000n), accumulateHost(TINY, a(), 1));
  assert.equal(s.stopped, "halt");
  const whole = accumulate(TINY, a(), 1, 1_000_000n);
  assert.equal(whole.exit, "halt");
  assert.equal(whole.gasUsed, 20273n);
});
