// The lessons' "lasair:" boxes quote the OCaml client beside ours. Each box that names a file
// in its summary must quote that file as it is: every line of its OCaml (an elided "..."
// line aside) is in the file, word for word. So when lasair moves or changes code, the box
// that shows it fails here instead of quietly showing code lasair no longer runs.
// lasair sits beside this repo only on the author's machine: in CI this test skips.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, readParts, lessonText } from "./lessons.ts";

const LASAIR = join(ROOT, "..", "lasair");
const BOX = /<details>\n<summary>lasair:(.*?)<\/summary>(.*?)<\/details>/gs;

/** Every lasair box: its lesson, its summary, the files it names, and its OCaml lines. */
function boxes() {
  return readParts().flatMap((p) => p.lessons).flatMap((l) =>
    [...lessonText(l.file).matchAll(BOX)].map(([, summary, body]) => ({
      lesson: l.id,
      summary: summary.replace(/<[^>]+>/g, "").trim(),
      files: [...summary.matchAll(/<code>([\w./-]+\.ml)<\/code>/g)].map((m) => m[1]),
      lines: [...body.matchAll(/```ocaml\n(.*?)```/gs)].flatMap((m) => m[1].split("\n"))
        .map((x) => x.trim()).filter((x) => x && !x.includes("...") && !x.includes("…")),
    })));
}

test("the lessons have lasair boxes, and most name the file they quote", () => {
  const all = boxes();
  assert.ok(all.length > 90, `${all.length} boxes`);
  assert.ok(all.filter((b) => b.files.length && b.lines.length).length > 80, "boxes that quote a named file");
});

test("every lasair box quotes its file as it is now", { skip: !existsSync(LASAIR) && "no lasair beside the repo" }, () => {
  const problems: string[] = [];
  for (const b of boxes()) {
    if (!b.files.length) continue;
    const missing = b.files.filter((f) => !existsSync(join(LASAIR, f)));
    if (missing.length) { problems.push(`${b.lesson} "${b.summary}": no ${missing.join(", ")} in lasair`); continue; }
    const src = b.files.map((f) => readFileSync(join(LASAIR, f), "utf8")).join("\n");
    const absent = b.lines.filter((x) => !src.includes(x));
    if (absent.length) problems.push(`${b.lesson} "${b.summary}": ${absent.length} line(s) not in ${b.files.join(", ")}, first: ${absent[0]}`);
  }
  assert.deepEqual(problems, []);
});
