// Albert (.vitepress/albert.ts, .vitepress/theme/albert.ts): where he perches across the
// lessons, which face he pulls there, and lesson 0.1 meeting every face.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createMarkdownRenderer } from "vitepress";
import type MarkdownIt from "markdown-it";
import { LESSONS, readParts } from "./lessons.ts";
import { albert } from "../.vitepress/albert.ts";
import { checkBlocks } from "../.vitepress/checks.ts";
import { FACES, LOOKS, MIXED, albertFor, type Face } from "../.vitepress/theme/albert.ts";

// the site's renderer; VitePress ships its own copy of markdown-it's types, which differ
// from @types/markdown-it (that albert.ts and checks.ts use) only in utilities neither calls
const md = await createMarkdownRenderer(LESSONS, { math: false }, "/") as unknown as MarkdownIt;
checkBlocks(md);
albert(md);

const lessons = readParts().flatMap((p) => p.lessons)
  .map((l) => ({ id: l.id, file: l.file, text: readFileSync(join(LESSONS, l.file), "utf8") }));

type Perch = { kind: "fails" | "scoreboard" | "break" | "question" | "says"; face: Face };

/** Every Albert on a lesson, in reading order, and what he's sitting on. */
function perches(file: string, text: string): Perch[] {
  const tokens = md.parse(text, { relativePath: file });
  const found: Perch[] = [];
  let heading = "";
  for (const [i, t] of tokens.entries()) {
    if (t.type === "heading_open") heading = tokens[i + 1].content;
    if (t.type === "html_block" && t.meta?.check) {
      const face = /01-albert-(\w+)\.svg/.exec(t.content)?.[1] as Face | undefined;
      assert.ok(face, `${file}: a check with no Albert`);
      found.push({ kind: "question", face });
    }
    if (t.type === "blockquote_open" && t.meta?.albert) found.push({ kind: "says", face: t.meta.albert.face });
    if (t.type !== "fence" || !t.meta?.albert) continue;
    const label = tokens[i - 2]?.content ?? "";
    const kind = label === "**Run, expect it to fail**" ? "fails"
      : label === "**Run**" && /^npm run scoreboard$/m.test(t.content) ? "scoreboard"
      : /^Break it\b/.test(heading) ? "break" : undefined;
    assert.ok(kind, `${file}: Albert on a block he shouldn't be on (${label || t.content.slice(0, 40)})`);
    found.push({ kind, face: t.meta.albert.face });
  }
  return found;
}

const all = lessons.map((l) => ({ ...l, perches: perches(l.file, l.text) }));
const count = (kind: Perch["kind"]) => all.flatMap((l) => l.perches).filter((p) => p.kind === kind).length;

test("Albert's face: the tongue for the scoreboard, a mix elsewhere, the same every build", () => {
  for (let n = 0; n < 20; n++) {
    assert.equal(albertFor("scoreboard", "a.md", n).face, "tongue");
    for (const moment of ["fails", "break", "question", "says"] as const) {
      assert.ok(MIXED.includes(albertFor(moment, "a.md", n).face), `${moment} ${n}`);
      assert.deepEqual(albertFor(moment, "a.md", n), albertFor(moment, "a.md", n));
    }
  }
  const faces = new Set(Array.from({ length: 20 }, (_, n) => albertFor("question", "a.md", n).face));
  assert.equal(faces.size, MIXED.length, "every mixed face turns up");
});

test("Albert sits on every run that fails on purpose, every scoreboard run and every check", () => {
  const fails = lessons.reduce((sum, l) => sum + (l.text.match(/^\*\*Run, expect it to fail\*\*$/gm) ?? []).length, 0);
  const checks = lessons.reduce((sum, l) => sum + (l.text.match(/^::: check$/gm) ?? []).length, 0);
  assert.equal(count("fails"), fails);
  assert.equal(count("question"), checks);
  assert.ok(count("scoreboard") >= 17, `${count("scoreboard")} scoreboard runs`);
  assert.ok(count("break") >= 4, `${count("break")} Break it sections`);
  for (const p of all.flatMap((l) => l.perches)) {
    assert.equal(p.face === "tongue", p.kind === "scoreboard", `${p.kind} with ${p.face}`);
  }
});

test("on a page, Albert never pulls the same face twice in a row", () => {
  for (const l of all) {
    const mixed = l.perches.filter((p) => p.kind !== "scoreboard");
    mixed.slice(1).forEach((p, k) => assert.notEqual(p.face, mixed[k].face, `${l.id}: ${p.kind} after ${mixed[k].kind}`));
  }
});

test("Albert perches on the block, linking to where he's met, his picture relative to the page", () => {
  const html = md.render("**Run, expect it to fail**\n\n```sh\nnpm test\n```\n", { relativePath: "02-codec/03-x.md" });
  assert.match(html, /^<p>.*<\/p>\n<div class="language-sh vp-adaptive-theme has-albert"><a class="albert" href="\.\.\/00-start\/01-what-you-will-build#albert" title="[^"]+"><img src="\.\.\/00-start\/images\/01-albert-\w+\.svg" alt="Albert: [^"]+" width="60" height="60"><\/a><button title="Copy Code" class="copy">/s);
});

test("lesson 0.1 meets Albert under the heading he links to; his other faces wait in class", () => {
  const intro = readFileSync(join(LESSONS, "00-start/01-what-you-will-build.md"), "utf8");
  assert.match(intro, /^### Meet Albert \{#albert\}$/m);
  assert.ok(intro.includes(`![${LOOKS.tongue}](./images/01-albert-tongue.svg)`), "0.1 shows the tongue");
  // the roster of faces was cut (Aodh, 2026-10-30): the reader meets the rest on the blocks
  for (const face of FACES.filter((f) => f !== "tongue")) {
    assert.ok(!intro.includes(`01-albert-${face}.svg`), `0.1 no longer lists ${face}`);
  }
});

test("a quote of his, > **Albert:** …, has him beside it saying it; lesson 3.3's is Knowledge = Truth, not Trust", () => {
  const html = md.render("> **Albert:** Check it yourself.\n", { relativePath: "03-work-and-reports/03-x.md" });
  assert.match(html, /^<blockquote class="albert-says"><a class="albert" href="\.\.\/00-start\/01-what-you-will-build#albert" title="Check it yourself\."><img src="\.\.\/00-start\/images\/01-albert-\w+\.svg" alt="Albert: Check it yourself\."[^>]*><\/a><p><strong>Albert:<\/strong> Check it yourself\.<\/p>\n<\/blockquote>/);
  assert.equal(md.render("> Just a quote.\n", { relativePath: "a.md" }), "<blockquote>\n<p>Just a quote.</p>\n</blockquote>\n");
  const report = all.find((l) => l.id === "3.3")!;
  assert.match(report.text, /^> \*\*Albert:\*\* Knowledge = Truth, not Trust\.$/m);
  assert.equal(report.perches.filter((p) => p.kind === "says").length, 1);
});
