// Lesson 19.3's entry-key widget (.vitepress/theme/entry-key.ts): the markers are the lesson's
// storageKey, preimageHashKey and requestKey, and the check questions' bytes come out.

import { test } from "node:test";
import assert from "node:assert/strict";
import { historyBytes, hx, keyOf, MARKER } from "../.vitepress/theme/entry-key.ts";
import { lessonCode, lessonText } from "./lessons.ts";

const raw = lessonText("19-block-import/03-accounts-from-the-state.md");

test("the markers are the lessons': 2^32 − 1 for storage, 2^32 − 2 for a preimage, l for a request", () => {
  const code = lessonCode("19.3");
  assert.match(code, /return serviceItemKey\(s, concatBytes\(encodeFixed\(2n \*\* 32n - 1n, 4\), k\)\);/);
  assert.match(code, /return serviceItemKey\(s, concatBytes\(encodeFixed\(2n \*\* 32n - 2n, 4\), h\)\);/);
  assert.match(lessonCode("6.2"), /return serviceItemKey\(s, concatBytes\(encodeFixed\(BigInt\(l\), 4\), h\)\);/);
  assert.deepEqual([MARKER.storage(8), MARKER.preimage(8), MARKER.request(8)], [2 ** 32 - 1, 2 ** 32 - 2, 8]);
});

test("the check and the widget: \"hello\" is 00 a5 00 6f … for service 0 and 07 a5 00 6f … for 7; [5, 9] is 02 05 00 00 00 09 00 00 00", () => {
  const first4 = (s: number) => keyOf("storage", s).slice(0, 4).map((c) => hx(c.byte)).join(" ");
  assert.equal(first4(0), "00 a5 00 6f");
  assert.equal(first4(7), "07 a5 00 6f");
  assert.match(raw, /`hello` is at `00 a5 00 6f …` for service 0 and `07 a5 00 6f …` for service\n\s+> 7/);
  const zero = keyOf("storage", 0).map((c) => c.byte);
  const seven = keyOf("storage", 7).map((c) => c.byte);
  assert.deepEqual(zero.flatMap((b, i) => (b === seven[i] ? [] : [i])), [0], "only byte 0 differs");
  assert.equal(historyBytes([5, 9]).map(hx).join(" "), "02 05 00 00 00 09 00 00 00");
});

test("lesson 19.3 places the widget once, at the top, and the three kinds send the reader back to it", () => {
  const at = raw.indexOf("<EntryKey />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<EntryKey />"), "placed once");
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  const back = raw.indexOf("(#try-it)", raw.indexOf("with how many in front."));
  assert.ok(back > 0 && back < raw.indexOf("So a host call that knows the key k"));
});
