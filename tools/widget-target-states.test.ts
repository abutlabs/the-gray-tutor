// Lesson 20.2's target widget (.vitepress/theme/target-states.ts): the target's rules are the
// lesson's answer and FEATURES, and the hashes and roots are the storage trace's.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { answer, BLOCKS, FEATURES, GENESIS, start } from "../.vitepress/theme/target-states.ts";
import type { MessageId } from "../.vitepress/theme/target-states.ts";
import { lessonCode, lessonText, ROOT } from "./lessons.ts";

const raw = lessonText("20-facing-the-fuzzer/02-a-target.md");
const code = lessonCode("20.2");
const run = (ids: MessageId[]) => ids.reduce((acc, id) => { const r = answer(acc.session, id); return { session: r.session, replies: [...acc.replies, r.reply] }; }, { session: start(), replies: [] as string[] });

test("the rules are the lesson's", () => {
  assert.match(code, /const FEATURES = 1 \| 2;/);
  assert.equal(FEATURES, 3);
  assert.match(code, /session\.features = message\.value\.fuzz_features & FEATURES; \/\/ what both can do/);
  assert.match(code, /if \(session\.initialized\) return null; \/\/ one Initialize per session/);
  assert.match(code, /if \(!parent\) return error\("the parent block is unknown"\);/);
  assert.match(code, /if \("error" in after\) return error\(after\.error\); \/\/ the state stays as it was/);
});

test("a session: features 1 & 3 = 1; genesis, block 1, block 2 kept; a refused block keeps nothing; an unknown parent is an Error; a second Initialize closes", () => {
  const r = run(["peer1", "init", "b1bad", "b1", "b2", "b5", "init"]);
  assert.equal(r.session.features, 1);
  assert.deepEqual(r.session.kept.map((k) => [k.label, k.ancestry]), [["genesis", 1], ["block 1", 2], ["block 2", 3]]);
  assert.match(r.replies[2], /^Error: bad_extrinsic_hash/);
  assert.equal(r.replies[5], 'Error: "the parent block is unknown"');
  assert.equal(r.session.closed, true);
  assert.equal(run(["peer1", "b1"]).replies[1], 'Error: "the parent block is unknown"', "no Initialize: no parent");
});

test("the hashes and roots are the storage trace's", { skip: !existsSync(join(ROOT, "vectors/traces/storage/genesis.json")) && "no vectors/" }, () => {
  const read = (f: string) => JSON.parse(readFileSync(join(ROOT, "vectors/traces/storage", f), "utf8"));
  assert.equal(read("genesis.json").state.state_root.slice(0, 18), GENESIS.root);
  const steps = [1, 2, 3].map((n) => read(`${String(n).padStart(8, "0")}.json`));
  assert.equal(steps[0].block.header.parent.slice(0, 18), GENESIS.hash);
  BLOCKS.forEach((b, k) => {
    assert.equal(steps[k].post_state.state_root.slice(0, 18), b.root, `block ${b.n}'s root`);
    assert.equal(steps[k + 1].block.header.parent.slice(0, 18), b.hash, `block ${b.n}'s hash, as block ${b.n + 1} names it`);
  });
});

test("lesson 20.2 places the widget once, at the top, and the protocol's steps send the reader back to it", () => {
  const at = raw.indexOf("<TargetStates />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<TargetStates />"));
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  const back = raw.indexOf("(#try-it)", raw.indexOf("**GetState.**"));
  assert.ok(back > 0 && back < raw.indexOf("## What the Gray Paper says"));
});
