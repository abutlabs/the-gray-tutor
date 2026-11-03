// Lesson 13.1's authorizer pool widget, checked against the lesson's own values and its
// rule (to be merged into tools/widgets.test.ts).

import { test } from "node:test";
import assert from "node:assert/strict";
import { atPointer, distinct, leftmost, MIXED, names, nextPool, POOL_SIZE, QUEUE_SIZE, queueIndex, replay, SAME, wheelTurn } from "../.vitepress/theme/authpool.ts";
import type { Entry } from "../.vitepress/theme/authpool.ts";
import { lessonCode, lessonText } from "./lessons.ts";

const POOLS = "13-authorization/01-the-authorizer-pools.md";

/** A pool of letters, as the lesson's tests write them, with made-up join slots. */
const entries = (letters: string[]): Entry[] => letters.map((auth, i) => ({ auth, joined: i }));
/** "A, A, B" → ["A", "A", "B"]: a list as the lesson's test code writes it. */
const list = (s: string): string[] => s.split(",").map((x) => x.trim());

test("the pool widget's sizes and wheel are 13.1's: O = 8, Q = 80, slot 85 reads entry 5", () => {
  const text = lessonText(POOLS);
  assert.equal(POOL_SIZE, Number(/at most O = (\d+) authorizer hashes/.exec(text)![1]));
  assert.equal(QUEUE_SIZE, Number(/exactly Q = (\d+) of them/.exec(text)![1]));
  // "at slot 85, the queue's entry 5 (85 mod 80) joins"
  const [, slot, entry, a, q] = /at slot (\d+),\s+the\s+queue's\s+entry\s+(\d+)\s+\((\d+)\s+mod\s+(\d+)\)\s+joins/.exec(text)!;
  assert.equal(slot, a);
  assert.equal(Number(q), QUEUE_SIZE);
  assert.equal(queueIndex(Number(slot)), Number(entry));
  assert.equal(nextPool([], MIXED, null, Number(slot)).index, Number(entry));
  // the lesson's code: the leftmost copy, the slot mod Q, the newest O
  const code = lessonCode("13.1");
  assert.match(code, /const oldest = left\.findIndex\(\(a\) => toHex\(a\) === toHex\(auth_hash\)\);\s+if \(oldest >= 0\) left\.splice\(oldest, 1\);/);
  assert.match(code, /queues\[core\]\[slot % QUEUE_SIZE\]/);
  assert.match(code, /return \[\.\.\.left, next\]\.slice\(-POOL_SIZE\);/);
});

test("the pool widget gives 13.1's hand tests: [A, B] with B used, and a full pool", () => {
  const code = lessonCode("13.1");
  // the queue: C waits at entry 3, A everywhere else
  const [, at] = /\(_, i\) => \(i === (\d+) \? C : A\)\); \/\/ C waits at/.exec(code)!;
  const queue = Array.from({ length: QUEUE_SIZE }, (_, i) => (i === Number(at) ? "C" : "A"));
  // nextPools([[A, B]], [queue], [{ core: 0, auth_hash: B }], 3) gives [[A, C]]
  const used = /nextPools\(\[\[([A-C, ]+)\]\], \[queue\], \[\{ core: 0, auth_hash: ([A-C]) \}\], (\d+)\);\s+assert\.deepEqual\(afterUse, \[\[([A-C, ]+)\]\]\)/.exec(code)!;
  assert.ok(used, "read the lesson's first hand test");
  assert.deepEqual(names(nextPool(entries(list(used[1])), queue, used[2], Number(used[3])).after), list(used[4]));
  // nextPools([[A, B]], [queue], [], 83) gives [[A, B, C]]
  const round = /nextPools\(\[\[([A-C, ]+)\]\], \[queue\], \[\], (\d+)\); \/\/ (\d+) mod 80 = (\d+)\s+assert\.deepEqual\(nextRound, \[\[([A-C, ]+)\]\]\)/.exec(code)!;
  assert.ok(round, "read the lesson's next-round test");
  assert.equal(queueIndex(Number(round[2])), Number(round[4]));
  assert.deepEqual(names(nextPool(entries(list(round[1])), queue, null, Number(round[2])).after), list(round[5]));
  // a full pool [A × 7, B] and a queue of C: [A × 6, B, C]
  const full = /const full: Bytes\[\] = \[([A-C, ]+)\]; \/\/ eight already/.exec(code)!;
  const after = /nextPools\(\[full\], \[queue\], \[\], (\d+)\);\s+assert\.deepEqual\(after, \[\[([A-C, ]+)\]\]\)/.exec(code)!;
  const step = nextPool(entries(list(full[1])), SAME.map(() => "C"), null, Number(after[1]));
  assert.deepEqual(names(step.after), list(after[2]));
  assert.deepEqual(step.droppedAt, [0], "the oldest, at the front, fell off");
});

test("the pool widget's rule over 5,000 random blocks: ≤ 8, leftmost copy out, the wheel's entry in", () => {
  let seed = 13;
  const rand = (n: number) => { seed = (seed * 1103515245 + 12345) % 2 ** 31; return seed % n; };
  for (const queue of [MIXED, SAME]) {
    let pool: Entry[] = [];
    for (let slot = 1; slot <= 5000; slot++) {
      // a guarantee half the time, using an authorizer in the pool (lesson 12.4's rule), or now and then one that isn't
      const roll = rand(10);
      const used = roll < 5 && pool.length ? pool[rand(pool.length)].auth : roll === 9 ? "Z" : null;
      const step = nextPool(pool, queue, used, slot);
      // the Gray Paper's own form: F(c) removes the first copy, then ←O of F(c) ⌢ ϕ′[τ′ mod Q]
      const f = names(pool);
      const i = used === null ? -1 : f.indexOf(used);
      if (i >= 0) f.splice(i, 1);
      const grown = [...f, queue[slot % 80]];
      assert.deepEqual(names(step.after), grown.slice(Math.max(0, grown.length - 8)), `slot ${slot}`);
      assert.ok(step.after.length <= POOL_SIZE, `slot ${slot}: at most 8`);
      assert.equal(step.index, slot % 80, `slot ${slot}: the wheel`);
      assert.ok(step.index >= 0 && step.index < QUEUE_SIZE);
      assert.equal(step.after.at(-1)!.auth, queue[step.index], `slot ${slot}: the newest is on the right`);
      assert.equal(step.after.at(-1)!.joined, slot);
      assert.equal(step.usedAt, i >= 0 ? i : null, `slot ${slot}: the leftmost copy`);
      if (step.usedAt !== null) assert.ok(names(pool).slice(0, step.usedAt).every((a) => a !== used), "no copy further left");
      // what dropped was the front of the pool, after the used one left
      const keptBefore = pool.filter((_, k) => k !== step.usedAt && !step.droppedAt.includes(k));
      assert.deepEqual(step.after.slice(0, -1), keptBefore, `slot ${slot}: the rest keep their order`);
      assert.ok(step.droppedAt.every((k, n) => k === n + (step.usedAt !== null && step.usedAt <= n ? 1 : 0)), `slot ${slot}: oldest first`);
      // joined slots rise left to right: left is oldest
      assert.ok(step.after.every((e, k) => k === 0 || step.after[k - 1].joined < e.joined));
      if (queue === SAME && pool.length === POOL_SIZE) assert.deepEqual(names(step.after), names(pool), "A out, A in: no change");
      pool = step.after;
    }
  }
});

test("the pool widget's replay: fills to 8 by slot 8, wraps at 80, and a used B leaves", () => {
  assert.equal(MIXED.length, QUEUE_SIZE);
  assert.ok(MIXED.every((a) => /^[A-H]$/.test(a)));
  assert.equal(replay(MIXED, {}, 0).last, null);
  assert.equal(replay(MIXED, {}, 7).pool.length, 7);
  assert.equal(replay(MIXED, {}, 8).pool.length, 8);
  const at9 = replay(MIXED, {}, 9);
  assert.deepEqual(at9.last!.droppedAt, [0]);
  assert.deepEqual(names(at9.pool), MIXED.slice(2, 10));
  assert.equal(replay(MIXED, {}, 80).last!.index, 0);
  assert.equal(replay(MIXED, {}, 85).last!.index, 5);
  // the mixed queue puts some letter twice in the pool, so "leftmost copy" matters
  const pool = replay(MIXED, {}, 8).pool;
  const twice = distinct(pool).find((a) => names(pool).filter((b) => b === a).length >= 2)!;
  assert.ok(twice, "a letter twice in the first full pool");
  const step = replay(MIXED, { 9: twice }, 9).last!;
  assert.equal(step.usedAt, leftmost(pool, twice));
  assert.equal(step.droppedAt.length, 0, "one out, one in: nothing drops");
  assert.equal(names(step.after).filter((a) => a === twice).length, names(pool).filter((a) => a === twice).length - 1 + (MIXED[9] === twice ? 1 : 0));
});

test("the drawn wheel puts entry τ′ mod 80 under its pointer, and keeps turning one way past 79", () => {
  for (let slot = 0; slot <= 170; slot++) assert.equal(atPointer(slot), queueIndex(slot), `slot ${slot}`);
  assert.equal(atPointer(85), 5); // the lesson's example: 85 mod 80
  assert.equal(wheelTurn(80), 360); // once round, entry 0 back at the top
  assert.ok(wheelTurn(81) > wheelTurn(80)); // slot 80 to 81 turns one notch on, not 80 notches back
});
