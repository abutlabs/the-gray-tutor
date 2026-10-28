// The Gray Paper sections each lesson covers (.vitepress/gray-paper.ts): the titles are the
// Gray Paper 0.8.0's, every citation names a real section, and every section is either
// covered by a lesson or says why a block importer leaves it out.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { BESIDE, cited, label, SECTIONS, sorted } from "../.vitepress/gray-paper.ts";
import { lessonText, readParts, ROOT } from "./lessons.ts";

const GP = join(ROOT, "../graypaper");
const lessons = readParts().flatMap((p) => p.lessons);
const byLesson = new Map(lessons.map((l) => [l.id, cited(lessonText(l.file))]));

test("the sections are the Gray Paper 0.8.0's, numbered and lettered as it numbers them", { skip: !existsSync(GP) && "no Gray Paper beside the tutorial" }, () => {
  const main = readFileSync(join(GP, "graypaper.tex"), "utf8");
  const files = [...main.matchAll(/\\input\{(text\/[^}]+)\}/g)].map((m) => m[1]);
  const appendix = main.indexOf("\\appendix");
  const found: { id: string; title: string }[] = [];
  let n = 0, letter = 0;
  for (const f of files) {
    const after = main.indexOf(`{${f}}`) > appendix;
    for (const m of readFileSync(join(GP, f.endsWith(".tex") ? f : `${f}.tex`), "utf8").matchAll(/\\section\{([^}]*)\}/g)) {
      found.push({ id: after ? `App ${String.fromCharCode(65 + letter++)}` : `§${++n}`, title: m[1] });
    }
  }
  assert.deepEqual(SECTIONS.map(({ id, title }) => ({ id, title })), found);
});

test("every citation names a real section, in the Gray Paper's order", () => {
  const known = new Set(SECTIONS.map((s) => s.id));
  for (const [id, ids] of byLesson) {
    for (const s of ids) assert.ok(known.has(s), `lesson ${id} cites ${s}, which isn't a section`);
    assert.deepEqual(ids, sorted(ids));
  }
  assert.deepEqual(cited("See §11 (*Work Report*), Appendix C, App. A.6 and §3.8; §11 again.\n```ts\n// §99\n```"), ["§3", "§11", "App A", "App C"]);
  assert.deepEqual(byLesson.get("5.2"), ["§5", "App C"]);
  assert.deepEqual(byLesson.get("8.8"), ["§6", "App G"]);
  assert.deepEqual(byLesson.get("15.3"), ["App A"]);
  assert.equal(label("App C"), "App. C");
});

test("every section is a lesson's, or says why a block importer leaves it out", () => {
  const covered = new Set([...byLesson.values()].flat());
  for (const s of SECTIONS) {
    assert.equal(covered.has(s.id), !(s.id in BESIDE), `${s.id} ${s.title}: ${covered.has(s.id) ? "covered, yet given a reason" : "no lesson, and no reason"}`);
  }
});

test("the map page is published and linked from the start page, and the site shows the sections", () => {
  assert.match(lessonText("gray-paper.md"), /<GrayPaperMap \/>/);
  assert.match(readFileSync(join(ROOT, ".vitepress/urls.ts"), "utf8"), /^ {2}"gray-paper",$/m);
  assert.match(lessonText("index.md"), /\[the Gray Paper, part by part\]\(\.\/gray-paper\.md\)/);
  const config = readFileSync(join(ROOT, ".vitepress/config.ts"), "utf8");
  assert.match(config, /text: `\$\{p\.title\}\$\{sectionsLine\(p\.dir\)\}`/);
  const theme = readFileSync(join(ROOT, ".vitepress/theme/index.ts"), "utf8");
  assert.match(theme, /"doc-before": \(\) => h\(GrayPaperRefs\)/);
  // the concepts-only switch rides in the header and the phone menu, not the lesson body
  assert.match(theme, /"nav-bar-content-after": \(\) => h\(ConceptsToggle\)/);
  assert.match(theme, /"nav-screen-content-after": \(\) => h\(ConceptsToggle, \{ screen: true \}\)/);
});
