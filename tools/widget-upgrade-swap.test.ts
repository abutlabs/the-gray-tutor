// Lesson 17.10's upgrade widget (.vitepress/theme/upgrade-swap.ts): the record's values
// are the upgrade_service-1 vector's, the cost and run gas are the lesson's, and the two
// roads end where the lesson's check questions say — new code, or a stalled service.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { holdsItsCode, NEW_GASES, NEW_HASH, OLD_GASES, OLD_HASH, record, says, UPGRADE_COST, VECTOR_RUN_GAS, type Story } from "../.vitepress/theme/upgrade-swap.ts";
import { lessonText, ROOT } from "./lessons.ts";

const raw = lessonText("17-accumulation/10-upgrading-a-service.md");
const VECTOR = join(ROOT, "vectors/stf/accumulate/tiny/upgrade_service-1.json");

test("the record's values are the vector's, where vectors/ is downloaded", { skip: !existsSync(VECTOR) && "no vectors/" }, () => {
  const v = JSON.parse(readFileSync(VECTOR, "utf8"));
  const pre = v.pre_state.accounts[0].data.service;
  const post = v.post_state.accounts[0].data.service;
  assert.ok(pre.code_hash.startsWith(OLD_HASH.slice(0, 12)), "the old hash");
  assert.ok(post.code_hash.startsWith(NEW_HASH.slice(0, 12)), "the new hash");
  assert.deepEqual([pre.min_item_gas, pre.min_memo_gas], OLD_GASES);
  assert.deepEqual([post.min_item_gas, post.min_memo_gas], NEW_GASES);
});

test("the cost and the run's gas are the lesson's", () => {
  assert.equal(UPGRADE_COST, 1028);
  assert.equal(VECTOR_RUN_GAS, 139_939);
  assert.match(raw, /for 1,028 gas/);
  assert.match(raw, /139939/);
});

test("upgrade swaps the record; only the hasty road stalls", () => {
  assert.deepEqual(record([]), { codeHash: OLD_HASH, gases: OLD_GASES });
  assert.deepEqual(record(["upgraded"]), { codeHash: NEW_HASH, gases: NEW_GASES });
  assert.equal(holdsItsCode([]), true, "the old code was always there");
  assert.equal(holdsItsCode(["upgraded"]), false, "the new hash names a preimage nobody provided");
  assert.equal(holdsItsCode(["solicited", "upgraded"]), true, "asked first: the safe road");
  assert.equal(holdsItsCode(["upgraded", "ranNext", "provided"]), true, "a block unsticks it");
});

test("each step says what the lesson teaches", () => {
  const hasty: Story = ["upgraded", "ranNext"];
  assert.match(says(["upgraded"]), /1,028 gas, φ₇ = OK/);
  assert.match(says(["upgraded"]), /carries on with the old code already loaded/);
  assert.match(says(hasty), /finds nothing: no preimage under the code hash means no code/);
  assert.match(says(["solicited", "upgraded", "ranNext"]), /runs the new code — the vector's run uses exactly 139,939 gas/);
  assert.match(says(["upgraded", "ranNext", "provided"]), /The stalled service has code again/);
});

test("the lesson shows the widget before its tests", () => {
  assert.match(raw, /<UpgradeSwap \/>/);
  assert.ok(raw.indexOf("<UpgradeSwap />") < raw.indexOf("## The tests"));
  assert.match(raw.replace(/\s+/g, " "), /one road runs `0xc0f2…`, the other stalls the service/);
});
