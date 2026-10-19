// The start page's At a glance (.vitepress/theme/stf-step.ts, stf-trace.ts): σ′ ≡ Υ(σ, B) on the
// storage trace's first 12 blocks, each as it is in the trace, each σ′ the next block's σ;
// the equation keyed to the symbols page, whose new entries' examples are these blocks.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { carries, says, short, TRANSITIONS } from "../.vitepress/theme/stf-step.ts";
import { lessonText, ROOT } from "./lessons.ts";

const TRACE = join(ROOT, "vectors/traces/storage");
const START = lessonText("index.md");
const SYMBOLS = lessonText("symbols.md");

test("the 12 transitions are the storage trace's first 12 blocks as they are", { skip: !existsSync(TRACE) && "no vectors/" }, () => {
  const files = readdirSync(TRACE).filter((f) => /^\d+\.json$/.test(f)).sort().slice(0, 12);
  files.forEach((f, i) => {
    const j = JSON.parse(readFileSync(join(TRACE, f), "utf8"));
    const h = j.block.header, x = j.block.extrinsic;
    const d = x.disputes;
    assert.deepEqual(TRANSITIONS[i], [h.slot, h.author_index, j.pre_state.state_root, j.post_state.state_root, h.parent,
      [x.tickets.length, x.preimages.length, x.guarantees.length, x.assurances.length, d.verdicts.length + d.culprits.length + d.faults.length]], f);
  });
});

test("a chain: every block's σ′ is the next block's σ, and every block changes the state", () => {
  for (let i = 0; i + 1 < TRANSITIONS.length; i++) assert.equal(TRANSITIONS[i][3], TRANSITIONS[i + 1][2], `slot ${TRANSITIONS[i][0]}`);
  for (const t of TRANSITIONS) assert.notEqual(t[2], t[3]);
  assert.deepEqual(TRANSITIONS.map((t) => t[0]), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
});

test("each block in words: its slot, its author and what it carries", () => {
  assert.equal(carries([0, 0, 0, 0, 0]), "nothing but its header");
  assert.equal(carries([0, 0, 1, 4, 0]), "1 report and 4 assurances");
  assert.equal(carries([2, 1, 0, 0, 0]), "2 tickets and 1 preimage");
  assert.equal(says(1), "Block for slot 2, made by validator 3, carrying 1 report. Υ applies the rules, and the state changes: a new root.");
  assert.equal(short(TRANSITIONS[0][3]), "0x48dc323d…");
});

test("the start page shows the equation, keyed to the symbols page, then the widget", () => {
  assert.match(START, /\$\$\n\\sigma' \\equiv \\Upsilon\(\\sigma, B\)\n\$\$/);
  const keys = [...START.matchAll(/^\| \[(.+?)\]\(\.\/symbols\.md#([\w-]+)\) \|/gm)].map((m) => [m[1], m[2]]);
  assert.deepEqual(keys, [["σ", "state"], ["B", "block"], ["Υ", "transition"], ["σ′", "prime"], ["≡", "defined-as"]]);
  for (const [, id] of keys) assert.match(SYMBOLS, new RegExp(`^### .+ \\{#${id}\\}$`, "m"), id);
  const at = START.indexOf("<StfStep />");
  assert.ok(at > START.indexOf("## At a glance") && at < START.indexOf("## How to read it"));
  assert.equal(START.split("<StfStep />").length, 2);
});

test("the symbol entries' examples are these blocks' real values", () => {
  const [first, second] = TRANSITIONS;
  assert.match(SYMBOLS, new RegExp(`state whose root is\\s+\`${short(first[3])}\``));
  assert.match(SYMBOLS, new RegExp(`first state, root \`${short(first[2])}\`, and its\\s+slot 1 block into the state with root \`${short(first[3])}\``));
  assert.match(SYMBOLS, new RegExp(`block for slot ${second[0]}, made by validator ${second[1]}, carrying ${carries(second[5])}\\.`));
});
