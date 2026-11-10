import type MarkdownIt from "markdown-it";

// Which Gray Paper sections each lesson is about, read from the lesson's own citations
// ("§11 (*Work Report*)", "Appendix C", "App. A.6"): its prose, not its code, lasair's folds
// or its checks. config.ts hands the result to the theme, which puts a lesson's sections at
// its top (GrayPaperRefs.vue), a part's under its name in the sidebar, and every section on
// the Gray Paper map page (GrayPaperMap.vue). tools/gray-paper.test.ts checks the titles
// against the Gray Paper 0.8.0 tex.

/** A section of the Gray Paper 0.8.0: "§11" or "App C", its title, and a page anchor. */
export interface Section { id: string; title: string; anchor: string }

const NUMBERED = [
  "Introduction", "Previous Work and Present Trends", "Notational Conventions", "Overview", "The Header",
  "Block Production and Chain Growth", "Recent History", "Authorization", "Service Accounts",
  "Disputes, Verdicts and Judgments", "Reporting and Assurance", "Accumulation", "Statistics",
  "Work Packages and Work Reports", "Guaranteeing", "Availability Assurance", "Auditing and Judging",
  "Beefy Distribution", "Grandpa and the Best Chain", "Discussion", "Conclusion", "Acknowledgements",
];
const APPENDICES = [
  "Polkadot Virtual Machine", "Virtual Machine Invocations", "Serialization Codec", "State Merklization",
  "General Merklization", "Shuffling", "Bandersnatch VRF", "Erasure Coding", "Index of Notation",
];

export const SECTIONS: Section[] = [
  ...NUMBERED.map((title, i) => ({ id: `§${i + 1}`, title, anchor: `s${i + 1}` })),
  ...APPENDICES.map((title, i) => ({ id: `App ${String.fromCharCode(65 + i)}`, title, anchor: `app-${String.fromCharCode(97 + i)}` })),
];
const ORDER = new Map(SECTIONS.map((s, i) => [s.id, i]));

/** The sections a lesson cites, in the Gray Paper's order. */
export function cited(markdown: string): string[] {
  // a quote of the paper cites the section it quotes, not the ones its words mention
  markdown = markdown.replace(/^::: gray-paper (\S+)[^\n]*\n[\s\S]*?^:::$/gm, (_, id: string) => (/^\d/.test(id) ? `§${id}` : `App ${id}`))
    .replace(/^::: gray-paper-eq [^\n]*\n[\s\S]*?^:::$/gm, "");
  const prose = markdown.replace(/```[\s\S]*?```|<details>[\s\S]*?<\/details>|::: check[\s\S]*?\n:::/g, "");
  const ids = new Set<string>();
  for (const m of prose.matchAll(/§\s?(\d+)(?:\.\d+)*|\bApp(?:endix|\.)\s?([A-I])\b/g)) ids.add(m[1] ? `§${m[1]}` : `App ${m[2]}`);
  return sorted([...ids]);
}

/** Section ids in the Gray Paper's order; an unknown one (a typo) last, so a test can find it. */
export const sorted = (ids: string[]): string[] => [...ids].sort((a, b) => (ORDER.get(a) ?? 1e9) - (ORDER.get(b) ?? 1e9));

/** A section as the site writes it: "§11", "App. C". */
export const label = (id: string): string => id.replace("App ", "App. ");

/** The sections no lesson cites, and why a block importer leaves them out. */
export const BESIDE: Record<string, string> = {
  "§1": "the introduction", "§2": "the history before JAM", "§15": "what guarantors do off the chain",
  "§16": "how validators share the pieces", "§17": "auditing, off the chain", "§18": "signing for bridges",
  "§20": "the discussion", "§21": "the conclusion", "§22": "the thanks",
  "App H": "erasure coding, done beside block import (lesson 3.3 shows the idea)",
};

// ---- the paper's own words in a lesson ---------------------------------------------------

/** A `::: gray-paper` block (tools/gray-paper-text.ts fills it from the paper's tex) as a box
 *  that says whose words these are; a `::: gray-paper-eq` one, a formula again, as a quieter
 *  box. The Markdown inside is the lesson's own, rendered in place. */
export function grayPaperQuotes(md: MarkdownIt): void {
  md.block.ruler.before("fence", "gray-paper", (state, startLine, endLine, silent) => {
    const line = (n: number) => state.src.slice(state.bMarks[n] + state.tShift[n], state.eMarks[n]);
    const m = /^::: gray-paper(-eq)? \S/.exec(line(startLine));
    if (!m) return false;
    let end = startLine + 1;
    while (end < endLine && line(end) !== ":::") end++;
    if (end >= endLine) return false;
    if (silent) return true;
    const open = state.push("html_block", "", 0);
    open.meta = { grayPaper: "open" };
    open.content = m[1]
      ? `<div class="gray-paper again">\n`
      : `<div class="gray-paper">\n<p class="gray-paper-says">The Gray Paper says</p>\n`;
    open.map = [startLine, startLine + 1];
    const [parent, max] = [state.parentType, state.lineMax];
    state.parentType = "blockquote";
    state.lineMax = end;
    state.md.block.tokenize(state, startLine + 1, end);
    state.parentType = parent;
    state.lineMax = max;
    const close = state.push("html_block", "", 0);
    close.content = "</div>\n";
    close.meta = { grayPaper: "close" };
    state.line = end + 1;
    return true;
  }, { alt: ["paragraph", "reference", "blockquote", "list"] });

  // the page's glossed symbols, from its keys' rows: <span id="gk-authpool" class="gk-wrap">$\alpha$
  md.core.ruler.before("block", "gray-paper-symbols", (state) => {
    // a check's questions are rendered inline with the page's env (checks.ts): leave it be
    if (state.inlineMode) return;
    const found = [...state.src.matchAll(/<span id="gk-([\w-]+)" class="gk-wrap">\[?\$(.+?)\$/g)].map((m) => ({ id: m[1], tex: m[2] }));
    state.env.grayPaperSymbols = found.sort((a, b) => b.tex.length - a.tex.length);
  });
  // the math inside a quote, marked, so its symbols can be
  md.core.ruler.after("inline", "gray-paper-math", (state) => {
    let depth = 0;
    for (const t of state.tokens) {
      if (t.meta?.grayPaper === "open") depth++;
      else if (t.meta?.grayPaper === "close") depth--;
      if (depth === 0) continue;
      if (t.type === "math_block") t.meta = { ...t.meta, grayPaper: "math" };
      for (const c of t.children ?? []) if (c.type === "math_inline") c.meta = { ...c.meta, grayPaper: "math" };
    }
  });
  // each glossed symbol in a quoted formula drawn inside \class{gp-sym gk-…}, which MathJax
  // keeps as a class on the symbol's SVG: hover or tap it for its key row (theme/gray-paper.ts)
  for (const rule of ["math_block", "math_inline"] as const) {
    const draw = md.renderer.rules[rule];
    if (!draw) continue;
    md.renderer.rules[rule] = (tokens, idx, options, env, self) => {
      const t = tokens[idx];
      const symbols: { id: string; tex: string }[] = env?.grayPaperSymbols ?? [];
      if (t.meta?.grayPaper !== "math" || symbols.length === 0) return draw(tokens, idx, options, env, self);
      const content = t.content;
      t.content = markSymbols(content, symbols);
      try { return draw(tokens, idx, options, env, self); } finally { t.content = content; }
    };
  }
}

/** The formula with each of the symbols in it wrapped in \class{gp-sym gk-<id>}{…}, longest
 *  first, never inside another, never the start of a longer command (\alpha in \alphabet). */
export function markSymbols(tex: string, symbols: { id: string; tex: string }[]): string {
  if (symbols.length === 0) return tex;
  const escape = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const byTex = new Map(symbols.map((s) => [s.tex, s.id]));
  const re = new RegExp(symbols.map((s) => `${escape(s.tex)}(?![A-Za-z])`).join("|"), "g");
  return tex.replace(re, (m) => `\\class{gp-sym gk-${byTex.get(m)}}{${m}}`);
}
