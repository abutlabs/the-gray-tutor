// Every bin a lesson introduces deserves the three-tab view lesson 10.1 started (#87;
// Aodh: "Every bin deserves the level of attention"): a ::: code-group before its first
// Run showing *what goes in* (the input, every value real), *what it computes* (the
// derived structures) and *what comes out* (terminal lines the verified output block
// also shows). This file is the law and the ratchet: PENDING names the lessons not yet
// converted, and it may only shrink.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { LESSONS, ROOT, readParts } from "./lessons.ts";

const lessons = readParts().flatMap((p) => p.lessons)
  .map((l) => ({ file: l.file, text: readFileSync(join(LESSONS, l.file), "utf8") }));

/** The three tabs, in order: input (json, or text for raw bytes), computed (ts), output. */
const TABS = /```(?:json|text|sh) \[what goes in\]\n([\s\S]*?)\n```\s+```(?:ts|js) \[what it computes\]\n([\s\S]*?)\n```\s+```text \[what comes out\]\n([\s\S]*?)\n```/g;

/** A scoreboard run's two tabs: a vector of the family crossing the line, and the console. */
const SCORE_TABS = /```json \[what goes in\]\n((?:(?!```)[\s\S])*?)\n```\s+```text \[console\]\n((?:(?!```)[\s\S])*?)\n```/g;

/** Lessons whose bins still await their three tabs. Convert one, remove it here. #87. */
const PENDING = new Set([
  // 20.2's bin/target.ts has no Run or output of its own (20.3 runs it, and carries the tabs)
  "20-facing-the-fuzzer/02-a-target.md",
]);

/** Scoreboard milestones still awaiting their what-goes-in + console tabs (none: #87's second half is done). */
const PENDING_SCOREBOARD = new Set<string>([]);

test("every scoreboard milestone shows the vector going in and the console, or is still pending (#87)", () => {
  const missing: string[] = [];
  for (const l of lessons) {
    if (!/^npm run scoreboard$/m.test(l.text)) continue;
    if ([...l.text.matchAll(SCORE_TABS)].length === 0) missing.push(l.file);
  }
  assert.deepEqual(missing.sort(), [...PENDING_SCOREBOARD].sort(),
    "PENDING_SCOREBOARD must be exactly the unconverted milestones: shrink it, never grow it");
});

test("every console tab repeats verified scoreboard lines, and its input names and matches its vector", () => {
  for (const l of lessons) {
    for (const m of l.text.matchAll(SCORE_TABS)) {
      for (const line of m[2].split("\n").map((s) => s.trimEnd()).filter(Boolean)) {
        assert.ok(l.text.split(line).length > 2, `${l.file}: a console line the verified output lacks: ${line}`);
      }
      // the input tab says which vector it excerpts, and holds only that vector's bytes
      const path = /vectors\/[\w./-]+\.(?:json|bin)/.exec(m[1])?.[0];
      assert.ok(path, `${l.file}: a what-goes-in tab that doesn't name its vector file`);
      if (!path!.endsWith(".json") || !existsSync(join(ROOT, path!))) continue;
      const raw = readFileSync(join(ROOT, path!), "utf8");
      for (const [hex] of m[1].matchAll(/0x[0-9a-f]{6,}/g)) {
        assert.ok(raw.includes(hex), `${l.file}: ${hex.slice(0, 14)}… is not in ${path}`);
      }
    }
  }
});

/** Every run of a bin's script, not only a lesson's first (#87, Aodh 2026-10-31: "we agreed to add that
 *  to every npm script + every scoreboard run"). A run whose commands include `npm run <bin script>`
 *  needs a three-tab group between the Run before it and itself. These runs don't have one yet; the
 *  list may only shrink. Keyed "lesson: the scripts it runs". */
const PENDING_RUNS = new Set<string>([]);

/** The scripts that aren't a bin's: tests, typecheck, the scoreboard (its own two tabs), the tools. */
const NOT_A_BIN = new Set(["test", "typecheck", "scoreboard", "compare", "catch-up", "verify", "site", "check"]);

/** Every Run of a bin's script in the lessons, and whether a three-tab group comes before it. */
function binRuns(): { key: string; covered: boolean }[] {
  const out: { key: string; covered: boolean }[] = [];
  for (const l of lessons) {
    for (const m of l.text.matchAll(/^\*\*Run(?:, expect it to fail)?\*\*\n\n```sh\n([\s\S]*?)```/gm)) {
      const cmds = [...m[1].matchAll(/^npm run ([\w-]+)/gm)].map((c) => c[1]).filter((c) => !NOT_A_BIN.has(c));
      if (cmds.length === 0) continue;
      const before = l.text.lastIndexOf("**Run", m.index! - 1);
      const covered = l.text.slice(Math.max(before, 0), m.index).includes("[what goes in]");
      out.push({ key: `${l.file}: ${cmds.join(" ")}`, covered });
    }
  }
  return out;
}

test("every run of a bin's script has its three tabs before it, or is still pending (#87)", () => {
  const missing = binRuns().filter((r) => !r.covered).map((r) => r.key);
  assert.deepEqual(missing.sort(), [...PENDING_RUNS].sort(),
    "PENDING_RUNS must be exactly the runs without tabs: shrink it as they gain them, never grow it");
});

test("every lesson that introduces a bin shows what flows through it, or is still pending (#87)", () => {
  const missing: string[] = [];
  for (const l of lessons) {
    if (!/^\*\*New file\*\* `bin\//m.test(l.text)) continue;
    if ([...l.text.matchAll(TABS)].length === 0) missing.push(l.file);
  }
  assert.deepEqual(missing.sort(), [...PENDING].sort(),
    "PENDING must be exactly the unconverted lessons: shrink it as bins gain their tabs, never grow it");
});

test("every what-comes-out tab repeats lines the lesson's verified output also shows", () => {
  for (const l of lessons) {
    for (const [, , , out] of l.text.matchAll(TABS)) {
      for (const line of out.split("\n").map((s) => s.trimEnd()).filter(Boolean)) {
        assert.ok(l.text.split(line).length > 2, `${l.file}: an output-tab line the verified output lacks: ${line}`);
      }
    }
  }
});

/** Every script the lessons define, by name: what it runs (`npm pkg set scripts.x="…"`). */
const SCRIPTS = new Map<string, string>(
  lessons.flatMap((l) => [...l.text.matchAll(/npm pkg set scripts\.([\w-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]] as const)),
);

/** The vector files a group's Run reads: the paths in its commands and in the scripts it runs,
 *  plus any vector the group names itself. A folder (a trace) means every file in it. */
function vectorsOf(text: string, group: string, after: number): string[] {
  const run = /\*\*Run[^*]*\*\*\n\n```sh\n([\s\S]*?)```/.exec(text.slice(after))?.[1] ?? "";
  const commands = [run, ...[...run.matchAll(/^npm run ([\w-]+)/gm)].map((m) => SCRIPTS.get(m[1]) ?? "")].join("\n");
  const named = [...commands.matchAll(/\.\.\/(vectors\/[\w./-]+)/g), ...group.matchAll(/(?<![\w/])(vectors\/[\w./-]+\.(?:json|bin))/g)]
    .map((m) => m[1].replace(/\/$/, ""));
  const files: string[] = [];
  for (const p of new Set(named)) {
    const full = join(ROOT, p);
    if (!existsSync(full)) continue;
    if (statSync(full).isDirectory()) files.push(...readdirSync(full).filter((f) => /\.(json|bin)$/.test(f)).map((f) => join(p, f)));
    else files.push(p);
    if (p.endsWith(".bin") && existsSync(join(ROOT, p.replace(/\.bin$/, ".json")))) files.push(p.replace(/\.bin$/, ".json"));
  }
  return files;
}

/** A file's text for the hex check: a .bin as its bytes in hex, so `0x0403…` from a hexdump matches. */
const asText = (p: string): string =>
  p.endsWith(".bin") ? `0x${readFileSync(join(ROOT, p)).toString("hex")}` : readFileSync(join(ROOT, p), "utf8");

test("every what-goes-in tab holds only bytes of the vectors its own Run reads, where vectors/ is downloaded", () => {
  let checked = 0;
  for (const l of lessons) {
    for (const m of l.text.matchAll(TABS)) {
      const files = vectorsOf(l.text, m[1], m.index! + m[0].length);
      if (files.length === 0) continue; // nothing to read: argv, the clock, hand-made bytes
      const texts = files.map(asText);
      for (const [hex] of m[1].matchAll(/0x[0-9a-f]{6,}/g)) {
        const bytes = hex.slice(2);
        assert.ok(texts.some((t) => t.includes(hex) || t.includes(bytes)), `${l.file}: ${hex.slice(0, 14)}… is in none of ${files.slice(0, 3).join(", ")}`);
        checked++;
      }
    }
  }
  if (existsSync(join(ROOT, "vectors"))) assert.ok(checked > 100, `${checked} hex values checked against their runs' vectors`);
});
