// Lesson 17.1's one-round widget (.vitepress/theme/one-round.ts): every number is the
// lesson's run and checks, and the vectors' post-state where vectors/ is downloaded.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { SCENARIOS, SLOT, statistics } from "../.vitepress/theme/one-round.ts";
import { lessonText, ROOT } from "./lessons.ts";

const raw = lessonText("17-accumulation/01-a-blocks-accumulation.md");

test("the run: 1729 and 1730, a digest each, 29,643 and 34,413 gas, each its own key", () => {
  const [iso] = SCENARIOS;
  for (const s of iso.services) {
    assert.match(raw, new RegExp(`^service ${s.id}: ${s.digests} digest\\(s\\), ${s.gas} gas$`, "m"));
    assert.match(raw, new RegExp(`^ {2}storage: ${s.writes[0][0]} = ${s.writes[0][1]}$`, "m"));
  }
  assert.match(raw, /^2 report\(s\) at slot 43: 2 service\(s\)$/m);
  assert.equal(SLOT, 43);
});

test("the checks: no code is (1, 0, 0); always-accumulate with no digest is (0, 0, 16,417)", () => {
  const noCode = SCENARIOS[1].services.find((s) => !s.hasCode)!;
  assert.deepEqual(statistics(noCode), [1, 0, 0]);
  assert.match(raw, /\[x\] One digest, no transfers, 0 gas\n\s+> Yes: \(1, 0, 0\)\./);
  const always = SCENARIOS[2].services[0];
  assert.deepEqual(statistics(always), [0, 0, 16_417]);
  assert.match(raw.replace(/\s+/g, " "), /it has 100,000 free gas, uses 16,417 of it, and gets the statistics \(0, 0,(?: >)? 16,417\) and slot 43/);
});

for (const sc of SCENARIOS) {
  const vector = join(ROOT, `vectors/stf/accumulate/tiny/${sc.name}.json`);
  test(`${sc.name}: the vector's statistics, storage and slots`, { skip: !existsSync(vector) && "no vectors/" }, () => {
    const v = JSON.parse(readFileSync(vector, "utf8"));
    assert.equal(v.input.slot, SLOT);
    for (const s of sc.services) {
      const record = v.post_state.statistics.find((x: { id: number }) => x.id === s.id).record;
      assert.deepEqual(statistics(s), [record.accumulate_count, record.accumulate_transfer_count, record.accumulate_gas_used], `${s.id}`);
      const post = v.post_state.accounts.find((a: { id: number }) => a.id === s.id).data;
      assert.deepEqual(s.writes, (post.storage ?? []).map((x: { key: string; value: string }) => [x.key, x.value]));
      assert.equal(post.service.last_accumulation_slot, SLOT);
      const pre = v.pre_state.accounts.find((a: { id: number }) => a.id === s.id).data;
      assert.equal(pre.preimage_blobs.some((p: { hash: string }) => p.hash === pre.service.code_hash), s.hasCode);
      assert.equal(v.pre_state.privileges.always_acc.find((x: { id: number }) => x.id === s.id)?.gas ?? 0, s.free);
    }
  });
}

test("lesson 17.1 places the widget once, after the Gray Paper's names and before the tests", () => {
  const at = raw.indexOf("<OneRound />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<OneRound />"));
  assert.ok(at > raw.indexOf("Now the Gray Paper's names for those steps.") && at < raw.indexOf("## The tests"));
});
