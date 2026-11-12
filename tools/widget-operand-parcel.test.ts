// Lesson 16.7's operand widget (.vitepress/theme/operand-parcel.ts): its fields are the
// lesson's Operand after serviceInputs' 0, its values the vector's report and digest.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Type } from "../.vitepress/theme/codec-map.ts";
import { OPERAND, OPERAND_JSON, OPERAND_PARCEL, SERVICE } from "../.vitepress/theme/operand-parcel.ts";
import { codecFields, typeFields } from "./codec-fields.ts";
import { lessonCode, lessonText, ROOT } from "./lessons.ts";

const raw = lessonText("16-host-calls/07-a-services-inputs.md");
const VECTOR = join(ROOT, "vectors/stf/accumulate/tiny/process_one_immediate_report-1.json");

test("the fields are the lesson's Operand, after the 0 serviceInputs puts in front", () => {
  const fields = typeFields(OPERAND, new Map<Type, string>([["result", "WorkResult"]]));
  assert.equal(fields[0], "kind: u8");
  assert.deepEqual(fields.slice(1), codecFields("16.7", "Operand"));
  assert.match(lessonCode("16.7"), /inputs\.push\(concatBytes\(Uint8Array\.of\(0\), encode\(Operand, operand\)\)\);/);
  assert.equal(OPERAND_PARCEL.bytes[0], 0);
});

test("one input for service 1729, its gas the digest's 200,000, as the run says", () => {
  assert.match(raw, /^service 1729: 1 input\(s\), 200000 gas, "halt"$/m);
  assert.equal((OPERAND_JSON as { gas: number }).gas, 200_000);
  assert.equal(SERVICE, 1729);
  const gas = OPERAND_PARCEL.partAt("gas");
  assert.equal(gas.end - gas.start, 3, "200,000 as a compact natural: 3 bytes");
  const trace = OPERAND_PARCEL.partAt("auth_trace");
  assert.equal(trace.end, OPERAND_PARCEL.bytes.length, "the report's trace comes last, after the digest's parts");
});

test("the values are the vector's report and digest, where vectors/ is downloaded", { skip: !existsSync(VECTOR) && "no vectors/" }, () => {
  const report = JSON.parse(readFileSync(VECTOR, "utf8")).input.reports[0];
  const digest = report.results.find((d: { service_id: number }) => d.service_id === SERVICE);
  assert.deepEqual(OPERAND_JSON, {
    kind: 0, package_hash: report.package_spec.hash, exports_root: report.package_spec.exports_root, authorizer_hash: report.authorizer_hash,
    payload_hash: digest.payload_hash, gas: digest.accumulate_gas, result: digest.result, auth_trace: report.auth_output,
  });
});

test("lesson 16.7 places the widget once, at the top, and the encoding sends the reader back to it", () => {
  const at = raw.indexOf("<OperandParcel />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<OperandParcel />"));
  assert.ok(at > raw.indexOf('<a id="try-it"></a>') && at < raw.indexOf("## The idea"));
  const back = raw.indexOf("(#try-it)", raw.indexOf("which start with a 1"));
  assert.ok(back > 0 && back < raw.indexOf("**Δ₁**"));
});
