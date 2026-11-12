// Lesson 8.7's ticket-rules widget (.vitepress/theme/ticket-rules.ts): its constants are
// the lesson's config, its rules safroleError's in the code's order, its tickets the two
// runs', and its answers the check questions'.

import { test } from "node:test";
import assert from "node:assert/strict";
import { attemptsAllowed, E, ENTERING, K, merged, N, OUT_OF_ORDER, RULES, ticketError, Y } from "../.vitepress/theme/ticket-rules.ts";
import { lessonCode, lessonText } from "./lessons.ts";

const LESSON = "08-safrole/07-entering-tickets.md";
const raw = lessonText(LESSON);
const code = lessonCode("8.7");

test("E, Y, K and n are the lesson's: 12, 10, 3 and ⌈24 / 6⌉ = 4", () => {
  assert.match(code, /epoch_length: 12,\s*epoch_tail_start: 10,\s*max_tickets_per_extrinsic: 3,/);
  assert.deepEqual([E, Y, K, N], [12, 10, 3, 4]);
  assert.match(code, /return Math\.ceil\(\(2 \* config\.epoch_length\) \/ validators\);/);
  assert.equal(attemptsAllowed(1023, 600), 2, "full: ⌈1200 / 1023⌉");
  assert.match(raw.replace(/\s+/g, " "), /4, attempts 0 to 3: ⌈2 × 12 \/ 6⌉/);
});

test("the rules fire in the code's order, each under the vectors' name", () => {
  const order = [...code.matchAll(/return "(unexpected_ticket|bad_ticket_attempt|bad_ticket_order|duplicate_ticket)";/g)].map((m) => m[1]);
  assert.deepEqual(order, ["unexpected_ticket", "bad_ticket_attempt", "bad_ticket_order", "duplicate_ticket"]);
  assert.equal(ticketError(1, ENTERING), null, "no-mark-2's tickets enter");
  assert.deepEqual(ticketError(1, OUT_OF_ORDER), { error: "bad_ticket_order", rule: 4 }, "no-mark-4's");
  assert.deepEqual(ticketError(10, ENTERING), { error: "unexpected_ticket", rule: 1 }, "the check question: phase 10 brings tickets");
  assert.deepEqual(ticketError(1, [...ENTERING, { attempt: 0, id: "0xf4aac2fb…" }]), { error: "unexpected_ticket", rule: 1 }, "more than K");
  assert.deepEqual(ticketError(1, [{ attempt: 4, id: "0x00e51b1c…" }]), { error: "bad_ticket_attempt", rule: 2 });
  assert.deepEqual(ticketError(1, [{ attempt: 0, id: "0x00e51b1c…", held: true }]), { error: "duplicate_ticket", rule: 5 });
  assert.deepEqual(ticketError(1, [{ attempt: 0, id: "0x20164381…" }, { attempt: 1, id: "0x20164381…" }]), { error: "bad_ticket_order", rule: 4 }, "the same id twice isn't strictly up");
  for (const rule of [1, 2, 4, 5]) assert.ok(RULES[rule]);
});

test("the two runs' tickets are the lesson's Output, and the lottery keeps the E lowest ids", () => {
  const lines = [...raw.matchAll(/^a ticket: attempt (\d), id (0x[0-9a-f]+…)$/gm)].map(([, a, id]) => ({ attempt: Number(a), id }));
  assert.deepEqual(lines, [...ENTERING, ...OUT_OF_ORDER]);
  assert.match(raw, /^refused: bad_ticket_order \(the vector says: bad_ticket_order\)$/m);
  assert.equal(merged([], ENTERING).length, 3);
  const full = Array.from({ length: E }, (_, i) => `0xf${i.toString(16)}00…`);
  const after = merged(full, ENTERING.slice(0, 2));
  assert.equal(after.length, E, "the check question: 12, the 2 new ones in, the 2 worst out");
  assert.deepEqual(after.slice(0, 2), [ENTERING[0].id, ENTERING[1].id]);
});

test("lesson 8.7 places the widget once, at the top, and the error names send the reader back to it", () => {
  const at = raw.indexOf("<TicketRules />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<TicketRules />"), "placed once");
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  assert.match(raw, /a block that breaks a rule is simply invalid\.\nBreak each rule \[at the top\]\(#try-it\)/);
});
