// The Gray Paper's own words in the tutorial (gray-paper-text.ts): every quote is what the
// paper's tex gives, the paper is quoted whole and each piece once, every formula draws,
// and every symbol a quoted formula uses is explained in plain words.

import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { readPaper, expandMath, paperMacros } from "./gray-paper-tex.ts";
import { renderBlock } from "./gray-paper-render.ts";
import { blocksOf, fill, GP, placements, quotesIn, symbolsOf, symbolTex, texts } from "./gray-paper-text.ts";
import { GLOSSES, TERMS } from "./gray-paper-glosses.ts";
import { markSymbols } from "../.vitepress/gray-paper.ts";
import { proseWords, speller } from "./spelling.ts";
import { LESSONS, ROOT } from "./lessons.ts";

const here = existsSync(GP);
const skip = !here && "no Gray Paper beside the tutorial";
const paper = here ? readPaper(GP) : undefined;
const all = texts();

test("every quote opens and closes, and names a piece of the paper that exists", { skip }, () => {
  for (const [file, md] of all) for (const q of quotesIn(file, md)) assert.ok(blocksOf(q, paper!).length > 0, `${file}:${q.open + 1}`);
});

test("every quote is the paper's words as its tex gives them (npm run gray-paper)", { skip }, () => {
  const where = placements(paper!, all);
  const stale = [...all].filter(([file, md]) => fill(file, md, paper!, where) !== md).map(([file]) => file);
  assert.deepEqual(stale, [], "run npm run gray-paper");
});

test("the paper is quoted whole, each piece in one place", { skip }, () => {
  const where = placements(paper!, all);
  assert.deepEqual(where.twice, []);
  const missing = paper!.sections.flatMap((s) => s.blocks).filter((b) => !where.quoted.has(b.id)).map((b) => b.id);
  assert.deepEqual(missing, [], `${missing.length} pieces of the paper no page quotes (npm run gray-paper -- unplaced)`);
});

test("the equations are numbered as the 0.8.0 PDF numbers them", { skip }, () => {
  const numbers = paper!.sections.flatMap((s) => s.blocks.flatMap((b) => b.equations));
  assert.equal(numbers.length, 432);
  assert.equal(paper!.refs.get("eq:authstatecomposition"), "8.1");
  assert.equal(paper!.refs.get("eq:guaranteesextrinsic"), "11.25"); // as §8 cites it
  // amsmath numbers the empty row after a final \\: (17.11) is one, so the PDF has (17.19)
  assert.ok(numbers.includes("17.19") && !numbers.includes("17.20"));
  assert.deepEqual(paper!.sections.find((s) => s.id === "8.2")!.blocks.find((b) => b.kind === "math" && b.equations.length === 2)!.equations, ["8.2", "8.3"]);
});

test("every formula of the paper draws in MathJax, no command unknown", { skip }, () => {
  const require = createRequire(join(ROOT, "package.json"));
  const { mathjax } = require("mathjax-full/js/mathjax.js");
  const { TeX } = require("mathjax-full/js/input/tex.js");
  const { SVG } = require("mathjax-full/js/output/svg.js");
  const { liteAdaptor } = require("mathjax-full/js/adaptors/liteAdaptor.js");
  const { RegisterHTMLHandler } = require("mathjax-full/js/handlers/html.js");
  const { AllPackages } = require("mathjax-full/js/input/tex/AllPackages.js");
  RegisterHTMLHandler(liteAdaptor());
  // as the site draws it (config.ts), but an unknown command is an error, not red text
  const tex = new TeX({ maxBuffer: 50 * 1024, packages: AllPackages.filter((p: string) => p !== "noundefined"), formatError: (_: unknown, e: Error) => { throw e; } });
  const doc = mathjax.document("", { InputJax: tex, OutputJax: new SVG({ fontCache: "none" }) });
  const problems: string[] = [];
  // as each page draws them: its key's symbols marked in its formulas for hover (../.vitepress/gray-paper.ts)
  for (const [file, md] of all) {
    const symbols = [...md.matchAll(/<span id="gk-([\w-]+)" class="gk-wrap">\[?\$(.+?)\$/g)].map((m) => ({ id: m[1], tex: m[2] })).sort((a, b) => b.tex.length - a.tex.length);
    if (symbols.length === 0) continue;
    for (const q of md.matchAll(/^::: gray-paper[^\n]*\n([\s\S]*?)^:::$/gm)) {
      for (const m of q[1].matchAll(/\$\$\n([\s\S]*?)\n\$\$/g)) {
        try { doc.convert(markSymbols(m[1], symbols), { display: true }); } catch (e) { problems.push(`${file}: ${(e as Error).message}`); }
      }
    }
  }
  // every symbol as its key draws it, alone
  for (const name of Object.keys(GLOSSES)) {
    if (GLOSSES[name] === "skip") continue;
    try { doc.convert(symbolTex(name, paper!), { display: false }); } catch (e) { problems.push(`key ${name}: ${(e as Error).message}`); }
  }
  for (const b of paper!.sections.flatMap((s) => s.blocks)) {
    const md = renderBlock(b, paper!, () => undefined).markdown;
    const maths = [...md.matchAll(/\$\$\n([\s\S]*?)\n\$\$|(?<![\\$])\$((?:\\\$|[^$\n])+?)\$/g)];
    for (const m of maths) {
      try { doc.convert(m[1] ?? m[2], { display: !!m[1] }); } catch (e) { problems.push(`${b.id}: ${(e as Error).message}`); }
    }
  }
  assert.deepEqual(problems, []);
});

test("every symbol of every quoted formula is explained, or marked as typography", { skip }, () => {
  const where = placements(paper!, all);
  const blocks = paper!.sections.flatMap((s) => s.blocks).filter((b) => where.quoted.has(b.id) && b.kind === "math");
  const missing = new Set<string>();
  for (const b of blocks) for (const name of symbolsOf(b.tex, paper!)) {
    const g = GLOSSES[name];
    if (g === undefined || (g !== "skip" && (!g.say || !g.means))) missing.add(`${name} (${b.id})`);
  }
  assert.deepEqual([...missing], [], "add them to tools/glosses/");
});

test("a gloss names a symbols-page entry that exists, and its words are spelled right", () => {
  const symbols = readFileSync(join(LESSONS, "symbols.md"), "utf8");
  const entries = new Set([...symbols.matchAll(/\{#([\w-]+)\}/g)].map((m) => m[1]));
  const { known } = speller();
  const problems: string[] = [];
  for (const [name, g] of Object.entries(GLOSSES)) {
    if (g === "skip") continue;
    if (g.entry && !entries.has(g.entry)) problems.push(`${name}: no symbols.md#${g.entry}`);
    // a key's line is plain words: it can't link, so it names no lesson or Part
    if (/\b(Part|lesson) \d/.test(g.means)) problems.push(`${name}: names a Part or lesson it can't link to`);
    for (const { word } of proseWords(`${g.say}. ${g.means}`)) if (!known(word)) problems.push(`${name}: ${word}`);
  }
  for (const t of TERMS) for (const { word } of proseWords(t.means)) if (!known(word)) problems.push(`${t.term}: ${word}`);
  assert.deepEqual(problems, []);
});

test("a symbol is marked in a formula whole, longest first, never inside a longer command", () => {
  const symbols = [{ id: "coreindex", tex: "\\mathbb{N}_{\\mathsf{C}}" }, { id: "Ccorecount", tex: "\\mathsf{C}" }, { id: "authpool", tex: "\\alpha" }];
  assert.equal(
    markSymbols("\\forall c \\in \\mathbb{N}_{\\mathsf{C}} : \\alpha'[c] \\alphabet \\mathsf{C}", symbols),
    "\\forall c \\in \\class{gp-sym gk-coreindex}{\\mathbb{N}_{\\mathsf{C}}} : \\class{gp-sym gk-authpool}{\\alpha}'[c] \\alphabet \\class{gp-sym gk-Ccorecount}{\\mathsf{C}}",
  );
});

test("the paper's macros expand into plain LaTeX: an argument never runs into a command", { skip }, () => {
  const macros = paperMacros(GP);
  assert.equal(expandMath("\\len{p_\\mathbf{w}}", macros), "\\left\\vert p_\\mathbf{w}\\right\\vert");
  assert.equal(expandMath("\\authpool\\subb{\\¬core}", macros), "\\alpha\\left[c\\right]");
  assert.equal(expandMath("x_\\Citemdeposit", macros), "x_{\\mathsf{B}_I}");
});
