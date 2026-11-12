// Lesson 4.4's disputes widget (.vitepress/theme/disputes-parcel.ts): the tiny vector,
// checked against 4.4's codecs and the vector's bytes where vectors/ is downloaded.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Type } from "../.vitepress/theme/codec-map.ts";
import { CULPRIT, DISPUTES, DISPUTES_EXTRINSIC, FAULT, JUDGEMENT, VERDICT } from "../.vitepress/theme/disputes-parcel.ts";
import { DISPUTES_JSON } from "../.vitepress/theme/extrinsic-vectors.ts";
import { codecFields, typeFields } from "./codec-fields.ts";
import { lessonText, ROOT } from "./lessons.ts";

const text = lessonText("04-blocks/04-disputes.md");
const NAMES = new Map<Type, string>([[JUDGEMENT, "Judgement"], [VERDICT, "Verdict"], [CULPRIT, "Culprit"], [FAULT, "Fault"]]);
const plain = (fields: string[]) => fields.map((f) => f.replace(/fixedBytes\((\d+)\)$/, '{"bytes":$1}'));

test("the widget's types are lesson 4.4's codecs, field for field", () => {
  for (const [t, name] of [[JUDGEMENT, "Judgement"], [VERDICT, "Verdict"], [CULPRIT, "Culprit"], [FAULT, "Fault"], [DISPUTES_EXTRINSIC, "DisputesExtrinsic"]] as const) {
    assert.deepEqual(typeFields(t, NAMES), plain(codecFields("4.4", name)), name);
  }
});

test("the disputes' bytes are the vector's, where vectors/ is downloaded", { skip: !existsSync(join(ROOT, "vectors/codec/tiny/disputes_extrinsic.bin")) && "no vectors/" }, () => {
  const vector = join(ROOT, "vectors/codec/tiny/disputes_extrinsic");
  assert.deepEqual(DISPUTES_JSON, JSON.parse(readFileSync(`${vector}.json`, "utf8")));
  assert.deepEqual(DISPUTES.bytes, [...readFileSync(`${vector}.bin`)]);
});

test("5 votes a verdict on tiny, each vote one byte that says yes, and the tiny vector's 1,132 bytes", () => {
  assert.equal(DISPUTES.bytes.length, 1132);
  assert.equal(DISPUTES.partAt("verdicts[0].votes").children.length, 5);
  assert.match(text, /\*Example:\* 5 votes on tiny\./);
  const vote = DISPUTES.partAt("verdicts[0].votes[0].vote");
  assert.deepEqual([vote.end - vote.start, DISPUTES.bytes[vote.start]], [1, vote.json ? 1 : 0]);
  assert.equal(DISPUTES.valueOf(vote), vote.json ? "yes (1)" : "no (0)");
  assert.match(text, /A vote needs one new primitive: a boolean, one byte, 1 for yes and 0 for no\./);
});

test("verdicts open to their votes, every chip says what it is, every goal is a chip away", () => {
  const deep = ["", "verdicts[0]", "verdicts[0].votes", "verdicts[0].votes[2]", "culprits[1]", "faults[0]"];
  const shown = new Set(DISPUTES.compartments.flatMap((c) => deep.flatMap((s) => DISPUTES.chipRows(c.id, s).flat())));
  for (const path of shown) assert.ok(DISPUTES.saysOf(DISPUTES.partAt(path)).length > 0, `${path} says what it is`);
  for (const g of DISPUTES.goals) assert.ok([...shown].some(g.reached), g.id);
  assert.equal(DISPUTES.labelOf("verdicts[0].votes[2]"), "vote 2");
  assert.match(DISPUTES.saysOf(DISPUTES.partAt("verdicts[0]")), /^A verdict: \d of 5 votes say valid\.$/);
});

test("lesson 4.4 opens with the widget, before The idea", () => {
  const at = text.indexOf("<DisputesParcel />");
  assert.ok(at > 0 && at === text.lastIndexOf("<DisputesParcel />") && at < text.indexOf("## The idea"));
});
