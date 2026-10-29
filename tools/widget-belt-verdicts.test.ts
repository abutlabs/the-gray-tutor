// Lesson 9.1's mountain belt widget and lesson 10.1's verdict widget, checked against the
// lessons' own values (to be merged into tools/widgets.test.ts).

import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { keccak_256 } from "@noble/hashes/sha3.js";
import { appendSteps, beltOf, beltPartway, beltSuperPeak, itemMountain, itemsIn, label, mergeMountains, peaksIn, shortHash } from "../.vitepress/theme/belt.ts";
import type { Belt, Mountain } from "../.vitepress/theme/belt.ts";
import { fromHex, toHex } from "../.vitepress/theme/super-peak.ts";
import { count, judge, votesNeeded, votesOf, wonkyCount } from "../.vitepress/theme/verdict.ts";
import { lessonText, lessonCode } from "./lessons.ts";

const BELT = "09-recent-history/01-the-mountain-belt.md";
const WORDS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4 };

test("the belt widget grows lesson 9.1's belt: bin/belt.ts's dots and super-peaks, after each of 16 items", () => {
  const rows = [...lessonText(BELT).matchAll(/^after\s+(\d+): ([●· ]+?)\s+super-peak (0x[0-9a-f]{8})…/gm)];
  assert.equal(rows.length, 16, "read bin/belt.ts's output");
  for (const [, n, dots, top] of rows) {
    const belt = beltOf(Number(n));
    const shape = belt.map((peak) => (peak === null ? "·" : "●")).join(" ");
    assert.equal(shape, dots, `after ${n}`);
    // the widget's hashes are real: its super-peak is the one the lesson's terminal printed
    assert.equal(beltSuperPeak(belt).slice(0, 10), top, `super-peak after ${n}`);
  }
});

test("the widget's mountains hold bin/belt.ts's real 32-byte hashes: item i is H(the byte i), a merge is H(peak ⌢ carried)", () => {
  const five = itemMountain(5);
  assert.equal(five.hash, toHex(keccak_256(new Uint8Array([5]))));
  assert.equal(five.hash.length, 2 + 64, "0x and 32 bytes");
  assert.equal(shortHash(five), `${five.hash.slice(0, 10)}…`);
  const merged = mergeMountains(itemMountain(1), itemMountain(2));
  assert.equal(merged.hash, toHex(keccak_256(new Uint8Array([...fromHex(itemMountain(1).hash), ...fromHex(itemMountain(2).hash)]))));
  assert.deepEqual([merged.first, merged.last], [1, 2]);
  // after 1 item the belt's one peak is the item itself, and M_R of one peak is that peak:
  // bin/belt.ts's first line, "after 1: ● super-peak 0x5fe7f977…", is H(the byte 1)
  assert.equal(beltSuperPeak([itemMountain(1)]), itemMountain(1).hash);
});

test("take one back: the 32-item belt alone cannot give the 31-item belt's five peaks", () => {
  const b31 = beltOf(31);
  const b32 = beltOf(32);
  assert.deepEqual(b31.map((p) => (p === null ? "·" : "●")), ["●", "●", "●", "●", "●"], "31 is 11111");
  assert.deepEqual(b32.map((p) => (p === null ? "·" : "●")), ["·", "·", "·", "·", "·", "●"], "32 is 100000");
  const { steps } = appendSteps(b31, itemMountain(32), mergeMountains);
  assert.equal(steps.filter((s) => s.action === "merge").length, 5, "five merges eat the five peaks");
  // nothing in the 32-item belt equals any of the five peaks: they were hashed away, not kept
  for (const p of b31) assert.ok(!b32.some((q) => q !== null && q.hash === p!.hash));
  // after 33, the one step back is easy: item 33 rests alone in place 0, unhashed
  const b33 = beltOf(33);
  assert.equal(b33[0]!.hash, itemMountain(33).hash);
  assert.deepEqual([null, ...b33.slice(1)], b32, "clear place 0 and 32 items remain");
});

test("the belt widget agrees with 9.1's words: 5 items, the 7 → 8 carry, H(peak ⌢ carried)", () => {
  const text = lessonText(BELT);
  // "5 items make a mountain of 4 and a mountain of 1"
  const [, n, big, small] = /(\d+) items make a mountain of (\d+) and a mountain of (\d+)/.exec(text)!;
  const sizes = beltOf(Number(n)).flatMap((peak, i) => (peak === null ? [] : [2 ** i]));
  assert.deepEqual(sizes, [Number(small), Number(big)]);
  // "after 5 items the peaks are [a hash, ∅, a hash]"
  const [, m, peaks] = /after (\d+) items the peaks are \[([^\]]+)\]/.exec(text)!;
  assert.deepEqual(beltOf(Number(m)).map((p) => (p === null ? "∅" : "a hash")), peaks.split(", "));
  // "the 7 → 8 append carries all the way up, three merges in a row"
  const [, from, to, merges] = /the (\d+) → (\d+) append carries all the way up, (\w+) merges/.exec(text)!;
  assert.equal(Number(to), Number(from) + 1);
  const { steps } = appendSteps(beltOf(Number(from)), itemMountain(Number(to)), mergeMountains);
  assert.equal(steps.filter((s) => s.action === "merge").length, WORDS[merges]);
  // the lesson teaches going backwards right after the widget, and why the super-peak is labelled
  assert.ok(text.indexOf("<MountainBelt />") < text.indexOf("take one back"), "backwards follows the widget");
  assert.ok(text.indexOf("take one back") < text.indexOf("Why the label?"), "the label's why follows");
  assert.ok(text.indexOf("Why the label?") < text.indexOf("<SuperPeak />"), "before the super-peak widget");
  assert.match(text, /Can the client compute the 31-item belt/, "the check asks the backwards question");
  assert.match(text.replace(/\s+/g, " "), /no merge can ever produce/, "68 bytes vs 64");
  // the merge is H(peak ⌢ carried): the peak first, as the lesson's code concatenates
  assert.match(lessonCode("9.1"), /keccak256\(concatBytes\(peak, carry\)\)/);
  let belt: Belt<string> = [];
  for (const item of "abcd") belt = appendSteps(belt, item, (peak, carried) => `H(${peak}⌢${carried})`).belt;
  assert.deepEqual(belt, [null, null, "H(H(a⌢b)⌢H(c⌢d))"]);
  // the lesson's test: two items a give [∅, H(a ⌢ a)], three give [a, H(a ⌢ a)]
  const join = (peak: string, carried: string) => peak + carried;
  const twice = appendSteps<string>(appendSteps<string>([], "a", join).belt, "a", join);
  assert.deepEqual(twice.belt, [null, "aa"]);
  assert.deepEqual(appendSteps<string>(twice.belt, "a", join).belt, ["a", "aa"]);
});

test("peaks are the 1 bits of n, for n = 0 to 1,000, and each step of a carry is merge or rest", () => {
  let belt: Belt<Mountain> = [];
  for (let n = 0; n <= 1000; n++) {
    if (n > 0) {
      const { steps, belt: after } = appendSteps(belt, itemMountain(n), mergeMountains);
      // a carry merges at every 1 bit from the bottom, then rests in the first 0
      const trailingOnes = (n - 1).toString(2).split("").reverse().join("").indexOf("0");
      const merges = trailingOnes === -1 ? (n - 1).toString(2).length : trailingOnes;
      assert.equal(steps.length, merges + 1, `${n}: merges then one rest`);
      assert.ok(steps.slice(0, -1).every((s, i) => s.action === "merge" && s.place === i), `${n}: merges from place 0 up`);
      assert.equal(steps.at(-1)!.action, "rest", `${n}: ends at rest`);
      assert.deepEqual(beltPartway(belt, steps, steps.length), after, `${n}: step by step ends where it should`);
      belt = after;
    }
    const bits = n.toString(2).split("").reverse();
    assert.equal(itemsIn(belt), n);
    assert.equal(peaksIn(belt), bits.filter((b) => b === "1").length, `${n}: peaks = popcount`);
    assert.deepEqual(belt.map((p) => (p === null ? "0" : "1")), n === 0 ? [] : bits, `${n}: peaks at the set bits`);
    // peak i covers 2^i items; higher places hold older items, together all of 1 to n
    let last = n;
    belt.forEach((peak, i) => {
      if (peak === null) return;
      assert.equal(peak.last - peak.first + 1, 2 ** i, `${n}: place ${i} holds 2^${i}`);
      assert.equal(peak.last, last, `${n}: place ${i} follows on`);
      last = peak.first - 1;
    });
    assert.equal(last, 0, `${n}: every item is in a mountain`);
  }
  assert.equal(label({ first: 1, last: 4, hash: "" }), "1–4");
  assert.equal(label({ first: 5, last: 5, hash: "" }), "5");
});

const VERDICTS = "10-disputes/01-votes-and-verdicts.md";

test("the verdict widget decides 10.1's test values: with 6 judges, 5 is good, 0 bad, 2 wonky", () => {
  const text = lessonText(VERDICTS);
  const [, v, good, bad, wonky] = /with (\d+) judges, (\d+) valid votes is good, (\d+) is bad, (\d+) is wonky/.exec(text)!;
  const [judges, votes] = [Number(v), votesNeeded(Number(v))];
  assert.equal(judge(Number(good), votes, judges), "good");
  assert.equal(judge(Number(bad), votes, judges), "bad");
  assert.equal(judge(Number(wonky), votes, judges), "wonky");
  // the table: "(5 on tiny, 683 on full) | **good**" and the wonky row
  const rows = [...text.matchAll(/\((\d+) on tiny, (\d+) on full\) \| \*\*(good|wonky)\*\*/g)];
  assert.equal(rows.length, 2, "read the table's good and wonky rows");
  for (const [, tiny, full, outcome] of rows) {
    assert.equal(judge(Number(tiny), votesNeeded(6), 6), outcome, `tiny ${outcome}`);
    assert.equal(judge(Number(full), votesNeeded(1023), 1023), outcome, `full ${outcome}`);
  }
  // "on tiny, 6 judges, so a verdict needs ⌊2·6/3⌋ + 1 = 5 votes"
  const [, j, needed] = /(\d+) judges, so a verdict needs ⌊2·\d+\/3⌋ \+ 1 = (\d+) votes/.exec(text)!;
  assert.equal(votesNeeded(Number(j)), Number(needed));
  // the errors are named as lesson 10.4 names them
  const rules = lessonText("10-disputes/04-bad-verdicts.md");
  assert.match(rules, /\*\*The right number of votes\.\*\* Exactly two thirds of its judges, plus one\.\s+\(`bad_votes_count`\)/);
  assert.match(rules, /\*\*A meaningful split\.\*\*[^(]+\(`bad_vote_split`\)/);
});

test("the verdict thresholds, for every V from 3 to 1,023: two thirds plus one, none, a third", () => {
  for (let v = 3; v <= 1023; v++) {
    const n = votesNeeded(v), w = wonkyCount(v);
    assert.ok(3 * n > 2 * v && 3 * (n - 1) <= 2 * v, `${v}: ${n} is the least that's more than two thirds`);
    assert.ok(3 * w <= v && v < 3 * (w + 1), `${v}: ${w} is a third, rounded down`);
    for (let valid = 0; valid <= n; valid++) {
      const expected = valid === n ? "good" : valid === 0 ? "bad" : valid === w ? "wonky" : "bad_vote_split";
      assert.equal(judge(valid, n, v), expected, `${v} judges, ${valid} valid`);
      assert.equal(judge(Math.min(valid, n - 1), n - 1, v), "bad_votes_count", `${v}: a vote too few`);
      assert.equal(judge(valid, n + 1, v), "bad_votes_count", `${v}: a vote too many`);
    }
  }
  assert.deepEqual(count(votesOf(6, 2, 3)), { votes: 5, valid: 2 });
  assert.deepEqual(votesOf(4, 1, 2), ["valid", "invalid", "invalid", null]);
});
