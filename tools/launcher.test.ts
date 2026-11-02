// The debug launcher (tools/launcher.ts): .vscode/launch.json's ▶ configurations and
// .vscode/launch.json.md are what the lessons make them, so every script a lesson adds can be
// run under the debugger, and the sheet says what it shows.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { FAMILIES, LAUNCH, SHEET, format, launchFile, lessonScripts, sheet } from "./launcher.ts";
import { ROOT, lessonText } from "./lessons.ts";

const scripts = lessonScripts();
const onDisk = readFileSync(LAUNCH, "utf8");
const launch = JSON.parse(onDisk.replace(/^\s*\/\/.*$/gm, ""));

test("launch.json and launch.json.md are what npm run launcher makes from the lessons", () => {
  assert.equal(onDisk, launchFile(onDisk, scripts), "run npm run launcher");
  assert.equal(readFileSync(SHEET, "utf8"), sheet(scripts), "run npm run launcher");
});

test("the script picker has every script the lessons add, once, each under the lesson that adds it", () => {
  assert.ok(scripts.length > 100, `${scripts.length} scripts`);
  const options = launch.inputs.find((i: { id: string }) => i.id === "script").options as { label: string; value: string }[];
  assert.deepEqual(options.map((o) => o.value), scripts.map((s) => s.name));
  assert.equal(new Set(options.map((o) => o.value)).size, options.length, "no script twice");
  for (const s of scripts) {
    assert.ok(lessonText(s.lesson.file).includes(`npm pkg set scripts.${s.name}="${s.command}"`), `${s.name} in ${s.lesson.id}`);
  }
  // the ones lesson 0.6's walk and the sheet lean on
  for (const name of ["import", "fuzz", "target", "seals", "verdicts-progress"]) assert.ok(options.some((o) => o.value === name), name);
  // most programs say what they do; the sheet shows it
  assert.ok(scripts.filter((s) => s.about).length > 100, "the programs' own words");
});

test("the ▶ configurations come first, and the ones a reader had are kept", () => {
  const names = launch.configurations.map((c: { name: string }) => c.name) as string[];
  assert.deepEqual(names.slice(0, 3).map((n) => n.split(" ")[0]), ["▶", "▶", "▶"]);
  for (const n of ["Tests: all (npm test)", "Tests: the open file", "Program: the open file", "Program: hello (0.3)", "Program: now (0.4)"]) {
    assert.ok(names.includes(n), n);
  }
  // a ▶ name never looks like a lesson's own program ("… (0.3)"): lessons.test.ts checks those
  for (const n of names.slice(0, 3)) assert.doesNotMatch(n, /\(\d+\.\d+\)$/);
  assert.equal(format({ a: ["x", "y"] }), '{\n  "a": ["x", "y"]\n}');
});

test("the trace picker is vectors/traces' block-import families", { skip: !existsSync(join(ROOT, "vectors/traces")) && "no vectors" }, () => {
  const dirs = readdirSync(join(ROOT, "vectors/traces"), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
  assert.deepEqual([...FAMILIES].sort(), dirs.sort());
});
