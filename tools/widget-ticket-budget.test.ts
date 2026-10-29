// Lesson 8.7's ticket-budget widget (.vitepress/theme/ticket-budget.ts): the four caps are
// the lesson's and config.ts's, n is attemptsAllowed, and stepping blocks respects the
// supply, the pipe and the pool.

import { test } from "node:test";
import assert from "node:assert/strict";
import { afterBlocks, FULL, pipeSays, room, supply, theTrap, TINY } from "../.vitepress/theme/ticket-budget.ts";
import { lessonText, lessonCode } from "./lessons.ts";

const raw = lessonText("08-safrole/07-entering-tickets.md");

test("the four caps are the lesson's: n, K, E, Y, both sizes", () => {
  assert.deepEqual([TINY.V, TINY.E, TINY.Y, TINY.K, TINY.n], [6, 12, 10, 3, 4]);
  assert.deepEqual([FULL.V, FULL.E, FULL.Y, FULL.K, FULL.n], [1023, 600, 500, 16, 2]);
  assert.match(raw, /at most K \(3 on tiny, 16 on\s+full\)/);
  assert.match(raw, /on tiny, ⌈24 \/ 6⌉ = 4; on full, ⌈1200 \/ 1023⌉ = 2/);
  const code = lessonCode("8.7");
  assert.match(code, /max_tickets_per_extrinsic: 3,/);
  assert.match(code, /max_tickets_per_extrinsic: 16,/);
});

test("the supply, the room, and the flow through them", () => {
  assert.equal(supply(TINY), 24);
  assert.equal(supply(FULL), 2046);
  assert.equal(room(TINY), 30);
  assert.equal(room(FULL), 8000);
  assert.deepEqual(afterBlocks(TINY, 0), { entered: 0, pool: 0, dropped: 0 });
  assert.deepEqual(afterBlocks(TINY, 4), { entered: 12, pool: 12, dropped: 0 });
  assert.deepEqual(afterBlocks(TINY, 8), { entered: 24, pool: 12, dropped: 12 }, "the supply caps the pipe; the pool keeps E");
  assert.deepEqual(afterBlocks(FULL, 500), { entered: 2046, pool: 600, dropped: 1446 }, "full's whole supply is in long before the room runs out");
  assert.deepEqual(afterBlocks(FULL, 128), { entered: 2046, pool: 600, dropped: 1446 }, "2,046 tickets need only ⌈2046 / 16⌉ = 128 blocks");
  assert.deepEqual(afterBlocks(FULL, 127), { entered: 2032, pool: 600, dropped: 1432 });
});

test("the sentences name the trap and the pipe", () => {
  assert.equal(theTrap(TINY), 'two different "max tickets": n = 4 is what one validator may make for the epoch; K = 3 is what one block may carry');
  assert.equal(theTrap(FULL), 'two different "max tickets": n = 2 is what one validator may make for the epoch; K = 16 is what one block may carry');
  assert.match(pipeSays(FULL), /supply 2,046, room 8,000: K never pinches/);
  assert.match(pipeSays(TINY), /supply 24, room 30/);
});

test("the lesson shows the widget after the six steps, naming the trap", () => {
  assert.match(raw, /<TicketBudget \/>/);
  assert.ok(raw.indexOf("6. **The lottery keeps the E lowest ids**") < raw.indexOf("<TicketBudget />"));
  assert.ok(raw.indexOf("<TicketBudget />") < raw.indexOf("<TicketRules />"));
  assert.match(raw.replace(/\s+/g, " "), /two of them both read as "max tickets": n is what one \*validator\* may make for the epoch, K is what one \*block\* may carry/);
});
