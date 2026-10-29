// Albert's posed appearances (.vitepress/theme/albert.ts; one Vue component each slams,
// draws, pours or fans on hover): every pose is Albert himself — the logo's own hair, a
// face from his set — with its moving parts in the group the page animates, placed once
// on its page, registered, and still for readers who prefer reduced motion.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { drawChalkboard, drawChemist, drawClimber, drawGambler, drawJailbird, drawJudge, drawLogo } from "../.vitepress/theme/albert.ts";
import { lessonText, ROOT } from "./lessons.ts";

const POSES = [
  { tag: "AlbertJudge", svg: drawJudge(), moving: "gavel", css: "\\.gavel", clothes: "robe", page: "10-disputes/index.md" },
  { tag: "AlbertChalkboard", svg: drawChalkboard(), moving: "chalk", css: "\\.chalk", clothes: "cardigan", page: "symbols.md" },
  { tag: "AlbertChemist", svg: drawChemist(), moving: "tube", css: "\\.tube", clothes: "coat", page: "02-codec/index.md" },
  { tag: "AlbertGambler", svg: drawGambler(), moving: "tickets", css: "\\.ticket", clothes: "vest", page: "08-safrole/index.md" },
  { tag: "AlbertClimber", svg: drawClimber(), moving: "flag", css: "\\.flag", clothes: "jacket", page: "09-recent-history/01-the-mountain-belt.md" },
  { tag: "AlbertJailbird", svg: drawJailbird(), moving: "cell", css: "\\.cell", clothes: "suit", page: "10-disputes/05-bad-culprits-and-faults.md" },
];

test("every pose is Albert himself: the logo's one hair path, head and a face, never redrawn", () => {
  const hair = /<path fill="#b9b9c2" d="([^"]+)"/;
  const logoHair = hair.exec(drawLogo())![1];
  for (const p of POSES) {
    assert.equal(hair.exec(p.svg)![1], logoHair, `${p.tag}'s hair is the logo's`);
    assert.match(p.svg, /<ellipse cx="32" cy="37" rx="12" ry="14"/, `${p.tag}'s head is the logo's`);
    assert.match(p.svg, /aria-label="Albert[ ,]/, `${p.tag} says who he is`);
    assert.match(p.svg, new RegExp(`<g class="${p.clothes}">`), `${p.tag} is dressed: his ${p.clothes}`);
  }
  const labels = new Set(POSES.map((p) => /aria-label="([^"]+)"/.exec(p.svg)![1]));
  assert.equal(labels.size, POSES.length, "each pose described in its own words");
});

test("each pose's moving part is a group of its own, and its page plays it carefully", () => {
  for (const p of POSES) {
    assert.equal(p.svg.match(new RegExp(`<g class="${p.moving}"`, "g"))?.length, 1, `${p.tag}'s ${p.moving}`);
    const vue = readFileSync(join(ROOT, `.vitepress/theme/${p.tag}.vue`), "utf8");
    assert.match(vue, new RegExp(p.css), `${p.tag}.vue animates ${p.css.replace("\\", "")}`);
    assert.match(vue, /prefers-reduced-motion/, `${p.tag}.vue is still for readers who asked for still`);
    assert.match(vue, /transform-box: view-box/, `${p.tag}.vue pins its hinge in the drawing's own units`);
    assert.match(vue, /href="\.\.?\/00-start\/01-what-you-will-build#albert"/, `${p.tag} links to where he's met`);
  }
});

test("each pose sits on its one page, once, and is registered for it", () => {
  const theme = readFileSync(join(ROOT, ".vitepress/theme/index.ts"), "utf8");
  for (const p of POSES) {
    const raw = lessonText(p.page);
    const at = raw.indexOf(`<${p.tag} />`);
    assert.ok(at > 0 && at === raw.lastIndexOf(`<${p.tag} />`), `${p.tag} once on ${p.page}`);
    assert.match(theme, new RegExp(`app\\.component\\("${p.tag}", ${p.tag}\\)`), `${p.tag} registered`);
  }
});
