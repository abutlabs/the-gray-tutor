// Part 8's big picture (.vitepress/theme/safrole-timeline.ts, safrole-trace.ts): the safrole
// trace's 100 blocks as Safrole sees them, decoded again from the trace files (γ is state
// component C(4)), and the story the Part 8 page tells about them.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { BLOCKS } from "../.vitepress/theme/safrole-trace.ts";
import { E, EPOCHS, SLOTS, WIN, Y } from "../.vitepress/theme/safrole-timeline.ts";
import { lessonCode, lessonText, ROOT } from "./lessons.ts";

const TRACE = join(ROOT, "vectors/traces/safrole");
const PAGE = lessonText("08-safrole/index.md");

/** γ from a state's C(4): γ_P (a count, then 336 bytes a validator), γ_Z (144), the sealing
 *  mode (0 tickets, 1 keys), γ_S (E tickets of 33 bytes or E keys of 32), γ_A (a count, then
 *  33 bytes a ticket). The lengths must add up to the value's. */
function gamma(state: { keyvals: { key: string; value: string }[] }): { mode: number; held: number } {
  const hex = state.keyvals.find((k) => k.key.startsWith("0x04" + "00".repeat(30)))!.value;
  const v = (hex.slice(2).match(/../g) ?? []).map((b) => parseInt(b, 16));
  const validators = v[0];
  let at = 1 + validators * 336 + 144;
  const mode = v[at];
  at += 1 + E * (mode === 0 ? 33 : 32);
  const held = v[at];
  assert.equal(v.length, at + 1 + held * 33, "γ's parts add up to its value");
  return { mode, held };
}

test("the data is the safrole trace's 100 blocks, decoded again from the files", { skip: !existsSync(TRACE) && "no vectors/" }, () => {
  const files = readdirSync(TRACE).filter((f) => /^\d+\.json$/.test(f)).sort();
  assert.equal(files.length, BLOCKS.length);
  files.forEach((f, i) => {
    const j = JSON.parse(readFileSync(join(TRACE, f), "utf8"));
    const h = j.block.header;
    const { mode, held } = gamma(j.post_state);
    assert.deepEqual(BLOCKS[i], [h.slot, h.author_index, j.block.extrinsic.tickets.length, h.epoch_mark ? 1 : 0, h.tickets_mark ? 1 : 0, mode, held], f);
  });
});

test("tiny's numbers are Part 8's: 12 slots an epoch, the lottery closing at 10, 3 tickets a block", () => {
  const code = lessonCode("8.7");
  assert.match(code, /epoch_length: 12,\n\s+epoch_tail_start: 10,\n\s+max_tickets_per_extrinsic: 3,/);
  assert.deepEqual([E, Y, WIN], [12, 10, 12]);
  for (const s of SLOTS) {
    assert.ok(s.tickets <= 3, `slot ${s.slot}: at most 3 tickets`);
    if (s.phase >= Y) assert.equal(s.tickets, 0, `slot ${s.slot}: no tickets once the lottery closes`);
    assert.ok(s.held <= WIN);
  }
});

test("the story the page tells: lotteries fill in epochs 3, 4 and 5, winners announced at 46, 58, 70, epochs 4 to 6 sealed by tickets", () => {
  const filled = EPOCHS.filter((e) => e.slots.some((s) => s.held >= WIN)).map((e) => [e.epoch, e.slots.find((s) => s.held >= WIN)!.slot]);
  assert.deepEqual(filled, [[3, 45], [4, 57], [5, 69]]);
  assert.deepEqual(SLOTS.filter((s) => s.ticketsMark).map((s) => s.slot), [46, 58, 70]);
  for (const s of SLOTS.filter((x) => x.ticketsMark)) assert.equal(s.phase, Y, "the winners come in the first block after the lottery closes");
  const byTickets = EPOCHS.filter((e) => e.slots.every((s) => s.byTickets)).map((e) => e.epoch);
  assert.deepEqual(byTickets, [4, 5, 6]);
  // an epoch is sealed by tickets exactly when the epoch before filled its lottery
  for (const e of EPOCHS.slice(1)) {
    const before = EPOCHS.find((x) => x.epoch === e.epoch - 1)!;
    assert.equal(e.slots[0].byTickets, before.slots.some((s) => s.held >= WIN), `epoch ${e.epoch}`);
  }
  const epochSix = EPOCHS.find((e) => e.epoch === 6)!;
  assert.equal(Math.max(...epochSix.slots.map((s) => s.held)), 9);
  const text = PAGE.replace(/\s+/g, " ");
  assert.match(text, /Epoch 3 fills its lottery at slot 45, the block at slot 46 announces the winners, and epoch 4 is sealed by tickets, as are 5 and 6\. Epoch 6 collects only 9, so epoch 7 falls back\./);
  assert.match(text, /up to 3 a block on tiny, 16 on full, during the first 10 slots of 12 \(500 of 600\)/);
});

test("Part 8 opens with the big picture, the timeline in it, before the part's map", () => {
  const at = PAGE.indexOf("## The big picture");
  assert.ok(at > 0 && at < PAGE.indexOf("<SafroleTimeline />") && PAGE.indexOf("<SafroleTimeline />") < PAGE.indexOf("## At a glance"));
  for (const n of [1, 2, 3, 4, 5, 6, 7, 8, 9]) assert.ok(PAGE.indexOf(`[8.${n}]`) < PAGE.indexOf("## At a glance"), `the big picture places lesson 8.${n}`);
});
