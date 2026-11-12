// Lesson 2.7's trace-shift widget (.vitepress/theme/trace-shift.ts): its original trace is
// the lesson's Output block line for line; export_count moved above the gas limits gives
// the lesson's second Output; and payload starts at 54 either way, as the check question says.

import { test } from "node:test";
import assert from "node:assert/strict";
import { BYTES, compare, HOME, MOVED, NAMES, ORIGINAL, orderWith, trace } from "../.vitepress/theme/trace-shift.ts";
import { lessonText } from "./lessons.ts";

const LESSON = "02-codec/07-watch-a-decode.md";
const raw = lessonText(LESSON);
/** The lines of an Output block: "0..4 service 0x04030201". */
const outputLines = (block: string) => [...block.matchAll(/^\s*(\d+)\.\.(\d+)\s+(\S+)\s+(0x[0-9a-f]+)$/gm)]
  .map(([, from, to, path, hex]) => ({ path, from: Number(from), to: Number(to), hex }));
const blocks = [...raw.matchAll(/```text\n([\s\S]*?)```/g)].map((m) => m[1]);

test("the original trace is the lesson's decode-work-item Output, line for line", () => {
  const shown = outputLines(blocks.find((b) => b.includes("extrinsic.1.len"))!);
  assert.equal(shown.length, 18);
  assert.deepEqual(ORIGINAL, shown);
  assert.equal(ORIGINAL.at(-1)!.to, BYTES.length, "the trace covers every byte");
  assert.equal(NAMES[HOME], MOVED);
  assert.equal(HOME, 4, "export_count is the fifth field");
});

test("export_count moved above the gas limits reads the lesson's second Output", () => {
  const shown = outputLines(blocks.find((b) => b.includes("0x0000000000002a00"))!);
  assert.equal(shown.length, 6);
  const moved = compare(2);
  assert.deepEqual(orderWith(2).slice(0, 5), ["service", "code_hash", "export_count", "refine_gas_limit", "accumulate_gas_limit"]);
  assert.deepEqual(moved.lines.slice(0, 6).map(({ path, from, to, hex }) => ({ path, from, to, hex })), shown);
  assert.deepEqual(moved.lines.slice(2, 5).map((l) => l.changed), [true, true, true]);
  assert.equal(moved.wrong, 3);
  assert.equal(moved.backAt?.path, "payload");
  assert.equal(moved.backAt?.from, 54, "payload starts at 54 either way");
  assert.equal(moved.ranOut, null);
  assert.match(raw.replace(/\s+/g, " "), /`payload` starts at 54 either way/);
});

test("in its own place nothing changes; moved below the payload the trace runs out", () => {
  const home = compare(HOME);
  assert.equal(home.wrong, 0);
  assert.equal(home.ranOut, null);
  const below = compare(NAMES.length - 1);
  assert.ok(below.wrong > 0);
  assert.ok(below.ranOut !== null || below.lines.at(-1)!.to <= BYTES.length, "never reads past the file");
  for (let at = 0; at < NAMES.length; at++) {
    for (const l of trace(orderWith(at)).lines) assert.ok(l.to <= BYTES.length, `${l.path} at position ${at} stays inside`);
  }
});

test("lesson 2.7 places the widget once, at the top to try; Break it again sends back to it", () => {
  const at = raw.indexOf("<TraceShift />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<TraceShift />"), "placed once");
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  const back = raw.indexOf("[at the top](#try-it)");
  assert.ok(back > raw.indexOf("Put `export_count` back afterwards.") && back < raw.indexOf("<details>", raw.indexOf("## Break it again")));
});
