// Lesson 17.3's transfer widget (.vitepress/theme/transfer-send.ts): the checks are the
// lesson's transfer in its order, and its two tests come out.

import { test } from "node:test";
import assert from "node:assert/strict";
import { MIN_MEMO_GAS, MINIMUM, START, transfer } from "../.vitepress/theme/transfer-send.ts";
import { lessonCode, lessonText } from "./lessons.ts";

const raw = lessonText("17-accumulation/03-sending-a-transfer.md");
const code = lessonCode("17.3");

test("the checks are the lesson's, in its order, and a refusal costs just 575", () => {
  assert.match(code, /if \(!receiver\) return setTo\(m, WHO\);\n\s+if \(gas < receiver\.info\.min_memo_gas\) return setTo\(m, LOW\);/);
  assert.match(code, /if \(balance < minimumBalance\(sender\.info\)\) return setTo\(m, CASH\);\n\s+if \(!charge\(m, gas\)\) return "oog";/);
  assert.match(raw, /a balance of 1000 and a minimum\nbalance of 170/);
  assert.deepEqual([MINIMUM, MIN_MEMO_GAS], [170, 20]);
});

test("the tests: 30 to service 1 with 25 gas leaves 970 and 10,000 − 575 − 25; WHO, LOW and CASH send nothing", () => {
  const sent = transfer(START, 1, 30, 25);
  assert.deepEqual([sent.answer, sent.state.balance, sent.state.gasLeft], ["OK", 970, 10_000 - 575 - 25]);
  assert.equal(sent.state.outbox.length, 1);
  assert.equal(transfer(START, 5, 30, 25).answer, "WHO");
  assert.equal(transfer(START, 0, 30, 10).answer, "LOW");
  assert.equal(transfer(START, 0, 900, 25).answer, "CASH");
  for (const [d, a, g] of [[5, 30, 25], [0, 30, 10], [0, 900, 25]]) {
    const r = transfer(START, d, a, g);
    assert.deepEqual([r.state.outbox, r.state.balance, r.charged], [[], 1000, 575]);
  }
});

test("lesson 17.3 places the widget once, at the top, and the price sends the reader back to it", () => {
  const at = raw.indexOf("<TransferSend />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<TransferSend />"), "placed once");
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  const back = raw.indexOf("(#try-it)", raw.indexOf("for the work the receiver will do with it."));
  assert.ok(back > 0 && back < raw.indexOf("One more rule, from"));
});
