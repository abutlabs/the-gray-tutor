// Lesson 16.4's info widget (.vitepress/theme/info-view.ts): info's 96 bytes are the lesson's
// order with a_t worked out, beside lesson 14.2's 89-byte record, and the tests' bytes come out.

import { test } from "node:test";
import assert from "node:assert/strict";
import { INFO, INFO_PARTS, INFO_VIEW, minimumBalance, STATE, TINY_INFO } from "../.vitepress/theme/info-view.ts";
import { lessonCode, lessonText } from "./lessons.ts";

const raw = lessonText("16-host-calls/04-info.md");
const code = lessonCode("16.4");

test("info's order is the lesson's: c, b, a_t, g, m, o (8 bytes each), i (4), f (8), r, a, p (4 each)", () => {
  assert.match(code, /a\.code_hash,\n\s+\.\.\.\[a\.balance, minimumBalance\(a\), a\.min_item_gas, a\.min_memo_gas, a\.bytes\]\.map\(\(x\) =>\n\s+encodeFixed\(x, 8\),/);
  assert.match(code, /encodeFixed\(BigInt\(a\.items\), 4\),\n\s+encodeFixed\(a\.deposit_offset, 8\),/);
  const names = (INFO_VIEW as { record: [string, unknown][] }).record.map(([n]) => n);
  assert.deepEqual(names, ["code_hash", "balance", "min_balance", "min_item_gas", "min_memo_gas", "bytes", "items", "deposit_offset", "creation_slot", "last_accumulation_slot", "parent_service"]);
});

test("the tests: 96 bytes, nines then 232; a_t = 170 at bytes 40 and 41; the state's record is 89", () => {
  assert.equal(INFO.bytes.length, 96);
  assert.deepEqual(INFO.bytes.slice(0, 33), [...Array(32).fill(9), 232]);
  assert.equal(minimumBalance(TINY_INFO), 170);
  assert.deepEqual(INFO.bytes.slice(40, 42), [170, 0]);
  assert.match(code, /balance: 1000n,[\s\S]*?bytes: 50n,[\s\S]*?items: 2,\s+creation_slot: 5,/);
  assert.equal(STATE.bytes.length, 89);
  const at = INFO_PARTS.get("min_balance")!;
  assert.deepEqual([at.start, at.end], [40, 48]);
  assert.match(raw.replace(/\s+/g, " "), /100 \+ 10 per item \+ 1 per byte = 170/);
});

test("lesson 16.4 places the widget once, at the top, and NONE's two meanings send the reader back to it", () => {
  const at = raw.indexOf("<InfoView />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<InfoView />"));
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  const back = raw.indexOf("(#try-it)", raw.indexOf("it says there's no such service."));
  assert.ok(back > 0 && back < raw.indexOf("Accumulation's F hands `info`"));
});
