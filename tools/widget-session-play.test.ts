// Lesson 20.3's session widget (.vitepress/theme/session-play.ts): the check is the lesson's
// refused/rootOk, and the roots and hashes are the import run's and the fuzzy trace's.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { play, STEPS } from "../.vitepress/theme/session-play.ts";
import { lessonCode, lessonText, ROOT } from "./lessons.ts";

const raw = lessonText("20-facing-the-fuzzer/03-a-session.md");

test("the check is the lesson's: an Error where the trace refuses, its root otherwise", () => {
  const code = lessonCode("20.3");
  assert.match(code, /const refused = step\.post_state\.state_root === step\.pre_state\.state_root;/);
  assert.match(code, /const ok = refused \? reply\.kind === "error" : rootOk;/);
  assert.match(code, /value: headerHash\(TINY, block\.header\)/);
});

test("36 and 40 give the trace's roots, 37 to 39 an Error each; a wrong root at 40 brings GetState, and a stop", () => {
  const all = play(null);
  assert.deepEqual(all.map((l) => l.ok), [true, true, true, true, true]);
  const run = lessonText("19-block-import/06-blocks-to-refuse.md");
  assert.match(run, /^block 36, slot 36: imported; root 0xe9a2c0ff… = the trace's$/m);
  assert.match(run, /^block 40, slot 40: imported; root 0x09189a2a… = the trace's$/m);
  assert.equal(STEPS[0].after.slice(0, 10), "0xe9a2c0ff");
  assert.equal(STEPS[4].after.slice(0, 10), "0x09189a2a");
  const wrong = play(40);
  assert.equal(wrong.length, 6);
  assert.match(wrong.at(-1)!.sent, /^GetState 0x4ba45dc92492be9b/);
});

test("every root and hash is the fuzzy trace's", { skip: !existsSync(join(ROOT, "vectors/traces/fuzzy/00000036.json")) && "no vectors/" }, () => {
  for (const s of STEPS) {
    const t = JSON.parse(readFileSync(join(ROOT, `vectors/traces/fuzzy/000000${s.n}.json`), "utf8"));
    assert.equal(t.pre_state.state_root.slice(0, 18), s.before, `block ${s.n} before`);
    assert.equal(t.post_state.state_root.slice(0, 18), s.after, `block ${s.n} after`);
    if (s.hash) {
      const next = JSON.parse(readFileSync(join(ROOT, `vectors/traces/fuzzy/000000${s.n === 36 ? 37 : 41}.json`), "utf8"));
      assert.equal(next.block.header.parent.slice(0, 18), s.hash, `block ${s.n}'s hash`);
    }
  }
});

test("lesson 20.3 places the widget once, at the top, and the fuzzer's steps send the reader back to it", () => {
  const at = raw.indexOf("<SessionPlay />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<SessionPlay />"));
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  const back = raw.indexOf("(#try-it)", raw.indexOf("**On the first wrong answer**"));
  assert.ok(back > 0 && back < raw.indexOf("## The code"));
});
