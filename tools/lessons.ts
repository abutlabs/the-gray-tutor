// Reads the lessons: their order, titles and steps. A step is a code block with a
// label on the line above it, the same label the reader follows:
//
//   **New file** `src/bytes.ts`      the file must not exist yet
//   **Add to** `src/bytes.ts`        add the code at the end of the file
//   **Replace in** `src/bytes.ts`    each declaration replaces the one with its name
//   **Rewrite** `package.json`       replace the whole file
//   **Run**                          run the commands; they must succeed
//   **Run, expect it to fail**       run the commands; they must fail
//
// A ```text block right after a Run block is its output, checked against the real run
// (tools/output.ts).
//
// Paths are relative to client/. A code block without a label is only for reading.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = fileURLToPath(new URL("..", import.meta.url));
export const LESSONS = join(ROOT, "lessons");

export type FileOp = "new" | "add" | "replace" | "rewrite";

export type Step =
  | { kind: "file"; op: FileOp; path: string; code: string; line: number }
  | { kind: "run"; command: string; fails: boolean; line: number; output?: string };

export interface Lesson {
  id: string; // "2.3": part 2, lesson 3
  file: string; // relative to lessons/, e.g. "02-codec/03-writer-and-reader.md"
  title: string;
  steps: Step[];
}

export interface Part {
  number: number;
  dir: string; // e.g. "02-codec"
  title: string; // the H1 of the part's index.md
  lessons: Lesson[];
}

const OPS: Record<string, FileOp> = {
  "New file": "new",
  "Add to": "add",
  "Replace in": "replace",
  "Rewrite": "rewrite",
};
const FILE_LABEL = /^\*\*(New file|Add to|Replace in|Rewrite)\*\* `([^`]+)`$/;
const RUN_LABEL = /^\*\*Run(, expect it to fail)?\*\*$/;
const LOOKS_LIKE_LABEL = /^\*\*(New file|Add to|Replace in|Rewrite|Run)\b/;
const NUMBERED = /^(\d+)-[a-z0-9-]+$/;

export function readParts(): Part[] {
  const parts: Part[] = [];
  for (const dir of readdirSync(LESSONS).sort()) {
    const m = NUMBERED.exec(dir);
    if (!m) continue;
    const number = Number(m[1]);
    const lessons: Lesson[] = [];
    for (const name of readdirSync(join(LESSONS, dir)).sort()) {
      const n = NUMBERED.exec(name.replace(/\.md$/, ""));
      if (!n || !name.endsWith(".md")) continue;
      lessons.push(parseLesson(`${number}.${Number(n[1])}`, `${dir}/${name}`));
    }
    const title = titleOf(readFileSync(join(LESSONS, dir, "index.md"), "utf8"), `${dir}/index.md`);
    parts.push({ number, dir, title, lessons });
  }
  return parts;
}

export function readLessons(): Lesson[] {
  return readParts().flatMap((p) => p.lessons);
}

/** The lessons up to and including `id`; throws on an unknown id. */
export function lessonsThrough(id: string): Lesson[] {
  const all = readLessons();
  const i = all.findIndex((l) => l.id === id);
  if (i < 0) throw new Error(`no lesson ${id}; lessons are ${all[0]?.id} to ${all.at(-1)?.id}`);
  return all.slice(0, i + 1);
}

export function titleOf(markdown: string, where: string): string {
  const h1 = /^# (.+)$/m.exec(markdown);
  if (!h1) throw new Error(`${where}: no "# " title`);
  return h1[1].trim();
}

export function parseLesson(id: string, file: string): Lesson {
  const text = readFileSync(join(LESSONS, file), "utf8");
  const lines = text.split("\n");
  const steps: Step[] = [];
  const fail = (line: number, why: string): never => {
    throw new Error(`lessons/${file}:${line}: ${why}`);
  };
  let fence: { marker: string; start: number } | null = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (fence) {
      if (line.trimEnd() === fence.marker) fence = null;
      continue;
    }
    const open = /^(`{3,}|~{3,})/.exec(line);
    if (open) {
      fence = { marker: open[1], start: i };
      continue;
    }
    if (!LOOKS_LIKE_LABEL.test(line)) continue;
    const file = FILE_LABEL.exec(line);
    const run = RUN_LABEL.exec(line);
    if (!file && !run) fail(i + 1, `a label must be exactly one of the forms in tools/lessons.ts: ${line}`);
    let j = i + 1;
    while (j < lines.length && lines[j].trim() === "") j++;
    const block = /^(`{3,}|~{3,})(\S*)/.exec(lines[j] ?? "");
    if (!block) fail(i + 1, "a label must be followed by a code block");
    const marker = block![1];
    const end = lines.findIndex((l, k) => k > j && l.trimEnd() === marker);
    if (end < 0) fail(j + 1, "the code block never closes");
    const code = lines.slice(j + 1, end).join("\n");
    if (file) {
      steps.push({ kind: "file", op: OPS[file[1]], path: file[2], code, line: i + 1 });
    } else {
      if (!["sh", "bash", "shell"].includes(block![2])) fail(j + 1, "a Run block must be ```sh");
      const step: Step = { kind: "run", command: code, fails: Boolean(run![1]), line: i + 1 };
      steps.push(step);
      let k = end + 1;
      while (k < lines.length && lines[k].trim() === "") k++;
      if (/^```text\s*$/.test(lines[k] ?? "")) {
        const close = lines.findIndex((l, n) => n > k && l.trimEnd() === "```");
        if (close < 0) fail(k + 1, "the output block never closes");
        step.output = lines.slice(k + 1, close).join("\n");
        i = close;
        continue;
      }
    }
    i = end;
  }
  if (fence) fail(fence.start + 1, "the code block never closes");
  return { id, file, title: titleOf(text, file), steps };
}

/** Every package any lesson puts in client/package.json, name to version: what the client
 * needs from npm, all tutorial long (npm run offline). Throws if two lessons pin one
 * package at different versions, since one install can't hold both. */
export function clientPackages(): Record<string, string> {
  const pinned: Record<string, { version: string; by: string }> = {};
  for (const lesson of readLessons()) {
    for (const step of lesson.steps) {
      if (step.kind !== "file" || step.path !== "package.json") continue;
      const pkg = JSON.parse(step.code);
      for (const [name, version] of Object.entries<string>({ ...pkg.dependencies, ...pkg.devDependencies })) {
        const before = pinned[name];
        if (before && before.version !== version) {
          throw new Error(`${name} is ${before.version} in lesson ${before.by} but ${version} in ${lesson.id}`);
        }
        pinned[name] ??= { version, by: lesson.id };
      }
    }
  }
  return Object.fromEntries(Object.entries(pinned).map(([name, p]) => [name, p.version]));
}

/** A lesson's Markdown, by its file under lessons/ ("02-codec/02-compact-naturals.md"). */
export const lessonText = (file: string): string => readFileSync(join(LESSONS, file), "utf8");

/** The code of lesson id's file snippets, all together: what the widget tests check
 * a widget's logic against, so a widget can't teach what the lesson's code doesn't do. */
export const lessonCode = (id: string): string =>
  readLessons().find((l) => l.id === id)!.steps.map((s) => (s.kind === "file" ? s.code : "")).join("\n");
