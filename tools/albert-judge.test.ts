// Part 10's Albert the judge (.vitepress/theme/albert.ts, drawJudge; AlbertJudge.vue slams
// the gavel on hover): the same head as every Albert, the eyebrow face, and the moving
// parts in the groups the page animates.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { drawFace, drawJudge, drawLogo } from "../.vitepress/theme/albert.ts";
import { lessonText, ROOT } from "./lessons.ts";

const svg = drawJudge();

test("the judge is Albert himself: the logo's hair and head, the eyebrow face", () => {
  const hair = /<path fill="#b9b9c2" d="([^"]+)"/;
  assert.equal(hair.exec(svg)![1], hair.exec(drawLogo())![1], "the one hair, never redrawn");
  const brows = /<path d="(M23[^"]+)" fill="none" stroke="#8f8f99"/;
  assert.equal(brows.exec(svg)![1], brows.exec(drawFace("eyebrow"))![1], "the eyebrow face's brows");
  assert.match(svg, /aria-label="Albert the judge in his robe, one eyebrow up, gavel raised"/);
  assert.match(svg, /viewBox="0 0 100 64"/, "wide enough for the gavel beside him");
  // the robe: the dark gown under his chin, the white jabot down its front
  const robe = /<g class="robe">([\s\S]*?)<\/g>/.exec(svg);
  assert.ok(robe, "the robe has a group of its own");
  assert.match(robe![1], /fill="#2a2a30"/, "a dark gown");
  assert.match(robe![1], /fill="#f4f4f6"/, "a white jabot");
});

test("the gavel and the bang are the groups the page animates, hinged where the fist is", () => {
  assert.equal(svg.match(/<g class="gavel">/g)?.length, 1);
  assert.equal(svg.match(/<g class="bang"/g)?.length, 1);
  // the fist the gavel swings on, inside the gavel's own group
  const gavel = /<g class="gavel">([\s\S]*?)<\/g>/.exec(svg)![1];
  assert.match(gavel, /<circle cx="69" cy="40"/, "the fist, the hinge");
  assert.match(gavel, /<rect [^>]*transform="rotate\(41 85 21\)"/, "the mallet, square to the handle");
  const vue = readFileSync(join(ROOT, ".vitepress/theme/AlbertJudge.vue"), "utf8");
  assert.match(vue, /transform-origin: 69px 40px/, "the page hinges the swing on the fist");
  assert.match(vue, /prefers-reduced-motion/, "still for readers who asked for still");
});

test("he sits on Part 10's opening page, once, before the map", () => {
  const raw = lessonText("10-disputes/index.md");
  const at = raw.indexOf("<AlbertJudge />");
  assert.ok(at > 0 && at === raw.lastIndexOf("<AlbertJudge />"), "placed once");
  assert.ok(at < raw.indexOf("<PartFlow"), "beside the opening words, before the map");
  const theme = readFileSync(join(ROOT, ".vitepress/theme/index.ts"), "utf8");
  assert.match(theme, /app\.component\("AlbertJudge", AlbertJudge\)/);
});
