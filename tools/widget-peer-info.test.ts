// Lesson 20.1's PeerInfo widget (.vitepress/theme/peer-info.ts): it encodes to the README's
// example byte for byte, its fields are the lesson's PeerInfo, and the frame is 0x21000000.

import { test } from "node:test";
import assert from "node:assert/strict";
import { EXAMPLE, frameOf, PEER_INFO, peerParcel, STATE_ROOT } from "../.vitepress/theme/peer-info.ts";
import { codecFields } from "./codec-fields.ts";
import { lessonCode, lessonText } from "./lessons.ts";

const raw = lessonText("20-facing-the-fuzzer/01-speaking-the-protocol.md");
const code = lessonCode("20.1");
const hex = (b: number[]) => `0x${b.map((x) => x.toString(16).padStart(2, "0")).join("")}`;

test("the fields are the lesson's PeerInfo, after the kind byte 0", () => {
  const names = (PEER_INFO as { record: [string, unknown][] }).record.map(([n]) => n);
  assert.deepEqual(names.slice(1), codecFields("20.1", "PeerInfo").map((f) => f.split(":")[0]));
  assert.match(code, /peer_info: \[0, PeerInfo\],/);
});

test("the README's examples: the PeerInfo byte for byte, and the StateRoot's frame, 33 bytes", () => {
  assert.match(code, new RegExp(`"${EXAMPLE}"`));
  assert.equal(hex(peerParcel(2, "fuzzer").bytes), EXAMPLE);
  assert.match(code, new RegExp(`"${STATE_ROOT}"`));
  assert.equal(hex(frameOf(STATE_ROOT)), "0x21000000");
  assert.match(code, /assert\.equal\(toHex\(framed\.subarray\(0, 4\)\), "0x21000000"\);/);
  assert.match(raw, /^02 00 00 00 {13}fuzz_features 2, a u32: the forks flag$/m);
  const forks = peerParcel(3, "fuzzer").bytes;
  assert.deepEqual(forks.slice(2, 6), [3, 0, 0, 0], "features 3 redraws its four bytes");
  assert.equal(peerParcel(2, "the-gray-tutor").bytes.at(-15), 14, "a 14-byte name: its length first");
});

test("lesson 20.1 places the widget once, at the top, and the bytes by hand send the reader back to it", () => {
  const at = raw.indexOf("<PeerInfo />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<PeerInfo />"));
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  const back = raw.indexOf("(#try-it)", raw.indexOf("app_name: its length, 6, then \"fuzzer\" in UTF-8"));
  assert.ok(back > 0 && back < raw.indexOf("The third test feeds two frames"));
});
