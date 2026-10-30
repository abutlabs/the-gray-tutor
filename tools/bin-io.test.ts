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

/** Lessons whose bins still await their three tabs. Convert one, remove it here. #87. */
const PENDING = new Set([
  "00-start/03-watch-your-client.md",
  "00-start/04-the-jam-clock.md",
  "02-codec/06-the-first-test-vectors.md",
  "02-codec/07-watch-a-decode.md",
  "05-hashing-and-signatures/01-hashes.md",
  "05-hashing-and-signatures/03-signatures.md",
  "06-state-and-merklization/01-the-state-trie.md",
  "06-state-and-merklization/03-reading-the-state.md",
  "07-time-and-shuffling/01-epochs.md",
  "07-time-and-shuffling/02-the-shuffle.md",
  "08-safrole/01-stirring-the-entropy.md",
  "08-safrole/02-rotating-the-validators.md",
  "08-safrole/03-the-fallback-sealers.md",
  "08-safrole/04-the-lotterys-winners.md",
  "08-safrole/05-one-step-of-safrole.md",
  "08-safrole/06-the-vrf-output.md",
  "08-safrole/09-seals.md",
  "09-recent-history/01-the-mountain-belt.md",
  "09-recent-history/02-recent-blocks.md",
  "10-disputes/02-culprits-and-faults.md",
  "10-disputes/03-clearing-the-cores.md",
  "10-disputes/04-bad-verdicts.md",
  "11-assurances/01-available.md",
  "11-assurances/02-timeouts.md",
  "11-assurances/03-bad-assurances.md",
  "12-guarantees/01-who-guarantees-what.md",
  "12-guarantees/02-signed-and-counted.md",
  "12-guarantees/03-onto-the-cores.md",
  "12-guarantees/04-bad-guarantees.md",
  "13-authorization/01-the-authorizer-pools.md",
  "14-services/01-providing-preimages.md",
  "14-services/02-the-service-account.md",
  "15-the-pvm/01-the-program-blob.md",
  "15-the-pvm/02-instructions.md",
  "15-the-pvm/03-the-machine.md",
  "15-the-pvm/04-memory.md",
  "15-the-pvm/05-arithmetic.md",
  "15-the-pvm/06-branches-and-calls.md",
  "15-the-pvm/07-bits-and-bytes.md",
  "15-the-pvm/08-a-real-program.md",
  "15-the-pvm/09-what-instructions-cost.md",
  "15-the-pvm/10-the-pipeline.md",
  "15-the-pvm/11-the-gas-meter.md",
  "16-host-calls/01-calling-the-host.md",
  "16-host-calls/07-a-services-inputs.md",
  "18-statistics/01-who-did-what.md",
  "18-statistics/02-what-cores-and-services-did.md",
  "19-block-import/01-the-order-of-things.md",
  "19-block-import/02-the-whole-state.md",
  "19-block-import/04-importing-a-block.md",
  "20-facing-the-fuzzer/02-a-target.md",
  "20-facing-the-fuzzer/03-a-session.md",
]);

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
