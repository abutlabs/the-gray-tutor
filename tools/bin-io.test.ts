// Every bin a lesson introduces deserves the three-tab view lesson 10.1 started (#87;
// Aodh: "Every bin deserves the level of attention"): a ::: code-group before its first
// Run showing *what goes in* (the input, every value real), *what it computes* (the
// derived structures) and *what comes out* (terminal lines the verified output block
// also shows). This file is the law and the ratchet: PENDING names the lessons not yet
// converted, and it may only shrink.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { LESSONS, ROOT, readParts } from "./lessons.ts";

const lessons = readParts().flatMap((p) => p.lessons)
  .map((l) => ({ file: l.file, text: readFileSync(join(LESSONS, l.file), "utf8") }));

/** The three tabs, in order: input (json, or text for raw bytes), computed (ts), output. */
const TABS = /```(?:json|text|sh) \[what goes in\]\n([\s\S]*?)\n```\s+```(?:ts|js) \[what it computes\]\n([\s\S]*?)\n```\s+```text \[what comes out\]\n([\s\S]*?)\n```/g;

/** A scoreboard run's two tabs: a vector of the family crossing the line, and the console. */
const SCORE_TABS = /```json \[what goes in\]\n([\s\S]*?)\n```\s+```text \[console\]\n([\s\S]*?)\n```/g;

/** Lessons whose bins still await their three tabs. Convert one, remove it here. #87. */
const PENDING = new Set([
  // 20.2's bin/target.ts has no Run or output of its own (20.3 runs it, and carries the tabs)
  "20-facing-the-fuzzer/02-a-target.md",
]);

/** Scoreboard milestones still awaiting their what-goes-in + console tabs. #87's second half. */
const PENDING_SCOREBOARD = new Set([
  "02-codec/06-the-first-test-vectors.md",
  "04-blocks/07-the-block.md",
  "06-state-and-merklization/01-the-state-trie.md",
  "07-time-and-shuffling/02-the-shuffle.md",
  "08-safrole/08-the-ring-root.md",
  "09-recent-history/02-recent-blocks.md",
  "10-disputes/05-bad-culprits-and-faults.md",
  "11-assurances/03-bad-assurances.md",
  "12-guarantees/05-bad-reports.md",
  "13-authorization/01-the-authorizer-pools.md",
  "14-services/01-providing-preimages.md",
  "17-accumulation/13-blessing-and-designating.md",
  "18-statistics/01-who-did-what.md",
  "18-statistics/02-what-cores-and-services-did.md",
  "19-block-import/04-importing-a-block.md",
  "19-block-import/06-blocks-to-refuse.md",
  "20-facing-the-fuzzer/04-ready-to-be-fuzzed.md",
]);

test("every scoreboard milestone shows the vector going in and the console, or is still pending (#87)", () => {
  const missing: string[] = [];
  for (const l of lessons) {
    if (!/^npm run scoreboard$/m.test(l.text)) continue;
    if ([...l.text.matchAll(SCORE_TABS)].length === 0) missing.push(l.file);
  }
  assert.deepEqual(missing.sort(), [...PENDING_SCOREBOARD].sort(),
    "PENDING_SCOREBOARD must be exactly the unconverted milestones: shrink it, never grow it");
});

test("every console tab repeats verified scoreboard lines, and its input names and matches its vector", () => {
  for (const l of lessons) {
    for (const m of l.text.matchAll(SCORE_TABS)) {
      for (const line of m[2].split("\n").map((s) => s.trimEnd()).filter(Boolean)) {
        assert.ok(l.text.split(line).length > 2, `${l.file}: a console line the verified output lacks: ${line}`);
      }
      // the input tab says which vector it excerpts, and holds only that vector's bytes
      const path = /vectors\/[\w./-]+\.(?:json|bin)/.exec(m[1])?.[0];
      assert.ok(path, `${l.file}: a what-goes-in tab that doesn't name its vector file`);
      if (!path!.endsWith(".json") || !existsSync(join(ROOT, path!))) continue;
      const raw = readFileSync(join(ROOT, path!), "utf8");
      for (const [hex] of m[1].matchAll(/0x[0-9a-f]{6,}/g)) {
        assert.ok(raw.includes(hex), `${l.file}: ${hex.slice(0, 14)}… is not in ${path}`);
      }
    }
  }
});

test("every lesson that introduces a bin shows what flows through it, or is still pending (#87)", () => {
  const missing: string[] = [];
  for (const l of lessons) {
    if (!/^\*\*New file\*\* `bin\//m.test(l.text)) continue;
    if ([...l.text.matchAll(TABS)].length === 0) missing.push(l.file);
  }
  assert.deepEqual(missing.sort(), [...PENDING].sort(),
    "PENDING must be exactly the unconverted lessons: shrink it as bins gain their tabs, never grow it");
});

test("every what-comes-out tab repeats lines the lesson's verified output also shows", () => {
  for (const l of lessons) {
    for (const [, , , out] of l.text.matchAll(TABS)) {
      for (const line of out.split("\n").map((s) => s.trimEnd()).filter(Boolean)) {
        assert.ok(l.text.split(line).length > 2, `${l.file}: an output-tab line the verified output lacks: ${line}`);
      }
    }
  }
});

test("every what-goes-in tab holds the vector's own bytes, where vectors/ is downloaded", () => {
  for (const l of lessons) {
    for (const m of l.text.matchAll(TABS)) {
      // the vector this group feeds is the first one named after it (its Run's argument)
      const rest = l.text.slice(m.index! + m[0].length);
      const path = /\.\.\/(vectors\/[\w./-]+\.json)/.exec(rest)?.[1];
      if (!path || !existsSync(join(ROOT, path))) continue;
      const raw = readFileSync(join(ROOT, path), "utf8");
      for (const [hex] of m[1].matchAll(/0x[0-9a-f]{6,}/g)) {
        assert.ok(raw.includes(hex), `${l.file}: ${hex.slice(0, 14)}… is not in ${path}`);
      }
    }
  }
});
