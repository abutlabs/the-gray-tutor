// Lesson 19.5's β† widget (.vitepress/theme/beta-dagger.ts): β, the header's root and the
// report's anchor are the storage_light trace's before block 1; the fix is the lesson's line.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ANCHOR, anchorCheck, BETA, dagger, PARENT, PARENT_STATE_ROOT, ZERO_ROOT } from "../.vitepress/theme/beta-dagger.ts";
import { lessonCode, lessonText, ROOT } from "./lessons.ts";

const raw = lessonText("19-block-import/05-work-on-the-chain.md");
const TRACE = join(ROOT, "vectors/traces/storage_light/00000001.json");

test("the fix is the lesson's: the newest block's root from the header, then the check", () => {
  assert.match(lessonCode("19.5"), /i === all\.length - 1 \? \{ \.\.\.b, state_root: block\.header\.parent_state_root \} : b,/);
  assert.equal(anchorCheck(BETA), "bad_state_root");
  assert.equal(anchorCheck(dagger(BETA, PARENT_STATE_ROOT)), null);
  assert.match(raw, /A report anchored on the parent block is the usual case, and\s+against β it fails\./);
});

test("the values are the trace's before storage_light block 1", { skip: !existsSync(TRACE) && "no vectors/" }, () => {
  const t = JSON.parse(readFileSync(TRACE, "utf8"));
  const h = t.block.header;
  assert.equal(h.parent.slice(0, 18), PARENT);
  assert.equal(h.parent_state_root.slice(0, 18), PARENT_STATE_ROOT);
  const c = t.block.extrinsic.guarantees[0].report.context;
  assert.deepEqual([c.anchor.slice(0, 18), c.state_root.slice(0, 18)], [ANCHOR.header, ANCHOR.stateRoot]);
  const beta = Buffer.from(t.pre_state.keyvals.find((e: { key: string }) => e.key.startsWith("0x03000000")).value.slice(2), "hex");
  assert.equal(beta[0], 1, "one block in β");
  assert.equal(`0x${beta.subarray(1, 9).toString("hex")}`, PARENT);
  assert.equal(`0x${beta.subarray(65, 97).toString("hex")}`, ZERO_ROOT, "its state root: zeros");
});

test("lesson 19.5 places the widget once, at the top, and the rule sends the reader back to it", () => {
  const at = raw.indexOf("<BetaDagger />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<BetaDagger />"), "placed once");
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  const back = raw.indexOf("(#try-it)", raw.indexOf("against β it fails."));
  assert.ok(back > 0 && back < raw.indexOf("## The tests"));
});
