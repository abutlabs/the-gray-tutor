// Lesson 8.6's VRF-output widget (.vitepress/theme/vrf-output.ts): the steps are the
// lesson's vrfOutput, and on the run's five blocks they give the run's 𝒴 and η′₀, each the
// next block's η₀; where vectors/ is downloaded, every value is the trace's.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { BLOCKS, ETA0_AFTER_5, STEPS, SUITE } from "../.vitepress/theme/vrf-output.ts";
import { lessonCode, lessonText, ROOT } from "./lessons.ts";

const raw = lessonText("08-safrole/06-the-vrf-output.md");
const code = lessonCode("8.6");
const hx = (bytes: number[]) => `0x${bytes.map((b) => b.toString(16).padStart(2, "0")).join("")}`;

test("the steps are the lesson's vrfOutput: the suite, 3, the first 32 bytes, 0, SHA-512, cut to 32", () => {
  assert.match(code, /const SUITE = new TextEncoder\(\)\.encode\("Bandersnatch_SHA-512_ELL2"\);/);
  assert.equal(SUITE, "Bandersnatch_SHA-512_ELL2");
  assert.match(code, /const point = signature\.subarray\(0, 32\);/);
  assert.match(code, /sha512\(concatBytes\(SUITE, Uint8Array\.of\(3\), point, Uint8Array\.of\(0\)\)\)\.subarray\(0, 32\)/);
  for (const s of STEPS) {
    assert.equal(s.signature.length, 96);
    assert.equal(s.input.length, 25 + 1 + 32 + 1);
    assert.deepEqual(s.output, s.hash.slice(0, 32));
  }
});

test("the run's five blocks: entropy source, 𝒴 and η′₀ as it prints them, each η′₀ the next block's η₀", () => {
  const lines = [...raw.matchAll(/^block (\d), slot (\d): entropy source (0x[0-9a-f]{8})…\n {2}VRF output (0x[0-9a-f]{8})…, η′₀ (0x[0-9a-f]{8})… \(the trace: (0x[0-9a-f]{8})…\)$/gm)];
  assert.equal(lines.length, 5);
  for (const [k, [, n, slot, source, output, eta0, theirs]] of lines.entries()) {
    assert.deepEqual([BLOCKS[k].n, BLOCKS[k].slot], [Number(n), Number(slot)]);
    assert.equal(BLOCKS[k].source.slice(0, 10), source);
    assert.equal(hx(STEPS[k].output).slice(0, 10), output);
    assert.equal(hx(STEPS[k].eta0).slice(0, 10), eta0);
    assert.equal(eta0, theirs);
    const next = k + 1 < BLOCKS.length ? BLOCKS[k + 1].eta0Before : ETA0_AFTER_5;
    assert.equal(hx(STEPS[k].eta0), next, `block ${n}'s η′₀ is the next state's η₀`);
  }
  assert.equal(BLOCKS[1].source, BLOCKS[2].source, "blocks 2 and 3: the same entropy source");
  assert.deepEqual([BLOCKS[1].author, BLOCKS[2].author], [3, 3]);
  assert.match(raw.replace(/\s+/g, " "), /blocks 2 and 3: the same entropy source, byte for byte\. Both were made by validator 3/);
});

test("every block and η₀ is the safrole trace's, where vectors/ is downloaded", { skip: !existsSync(join(ROOT, "vectors/traces/safrole/00000001.json")) && "no vectors/" }, () => {
  for (const b of BLOCKS) {
    const t = JSON.parse(readFileSync(join(ROOT, `vectors/traces/safrole/0000000${b.n}.json`), "utf8"));
    const eta = t.pre_state.keyvals.find((e: { key: string }) => e.key.startsWith("0x06000000")).value;
    assert.equal(b.eta0Before, eta.slice(0, 66), `block ${b.n}'s η₀`);
    assert.deepEqual([b.source, b.slot, b.author], [t.block.header.entropy_source, t.block.header.slot, t.block.header.author_index]);
  }
});

test("lesson 8.6 places the widget once, at the top, and the three steps send the reader back to it", () => {
  const at = raw.indexOf("<VrfOutput />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<VrfOutput />"));
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  const steps = raw.indexOf("**Keep the first 32 bytes**");
  const back = raw.indexOf("[The five blocks at the top](#try-it)");
  assert.ok(steps > 0 && back > steps && back < raw.indexOf("Two places use it."));
});
