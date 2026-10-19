// The website: the same Markdown files as in VS Code, with a sidebar, search, copy
// buttons and dark mode. `npm run site` serves it at http://localhost:5173; GitHub Pages
// serves it at https://abutlabs.github.io/the-gray-tutor/ (SITE_BASE, set by the workflow).

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { defineConfig } from "vitepress";
import type MarkdownIt from "markdown-it";
import type { ShikiTransformer } from "shiki";
import { readParts } from "../tools/lessons.ts";
import { LEGEND, writeRedirects } from "./urls.ts";
import { type PrintPage, writePrintPage } from "./print.ts";
import { checkBlocks } from "./checks.ts";
import { albert } from "./albert.ts";
import { lineRanges, linesOf, stepView } from "./whole.ts";
import { writeEpub } from "./epub.ts";
import { HEAD as CONCEPTS_HEAD } from "./theme/concepts-link.ts";
import { BESIDE, cited, label, SECTIONS, sorted } from "./gray-paper.ts";
import { unitCodes } from "./units.ts";
import { snippetNumbers, wholeFiles } from "../tools/snapshots.ts";
import type { Snapshot } from "../tools/snapshots.ts";

const parts = readParts();
// which Gray Paper sections each lesson cites, and each part (gray-paper.ts): for the line at
// a lesson's top, the sidebar, and the Gray Paper map page
const grayPaper = (() => {
  const byPage: Record<string, string[]> = {};
  for (const p of parts) {
    for (const l of p.lessons) byPage[l.file] = cited(readFileSync(join("lessons", l.file), "utf8"));
    byPage[`${p.dir}/index.md`] = sorted([...new Set(p.lessons.flatMap((l) => byPage[l.file]))]);
  }
  const lessons = parts.flatMap((p) => p.lessons.map((l) => ({ id: l.id, title: l.title.replace(/^[\d.]+\s+/, ""), link: `/${l.file.replace(/\.md$/, "")}` })));
  return { sections: SECTIONS, byPage, lessons, beside: BESIDE };
})();
/** A part's sections, small, under its name in the sidebar. */
const sectionsLine = (dir: string) => {
  const ids = grayPaper.byPage[`${dir}/index.md`];
  return ids.length ? `<span class="gp-ref">Gray Paper ${ids.map(label).join(" · ")}</span>` : "";
};
// every page in reading order, for the whole tutorial on one page (print.ts)
const printPages: PrintPage[] = [
  { address: "", title: "Start here" },
  ...parts.flatMap((p) => [
    { address: `${p.dir}/`, title: p.title, part: true },
    ...p.lessons.map((l) => ({
      address: l.file.replace(/\.md$/, ""),
      title: `${l.id} ${l.title.replace(/^[\d.]+\s+/, "")}`,
    })),
  ]),
  { address: "scoreboard", title: "The scoreboard", part: true },
  { address: "demo", title: "Demo", part: true },
  { address: "glossary", title: "Glossary", part: true },
  { address: "symbols", title: "Gray Paper symbols", part: true },
  { address: "cryptography", title: "Cryptography we use", part: true },
  { address: "jam-at-a-glance", title: "JAM at a glance", part: true },
  { address: "gray-paper", title: "The Gray Paper, part by part", part: true },
];
// the whole file after each Add to / Replace in snippet, worked out once, shown in its place
// (whole.ts; restart `npm run site` to see a lesson's edits in them)
const whole = wholeFiles();
// each file snippet's number in its lesson, for its anchor: #snippet-2 is the lesson's second
const numbers = snippetNumbers();
// "/" locally; "/the-gray-tutor/" on GitHub Pages (SITE_BASE, set by the workflow)
const base = process.env.SITE_BASE ?? "/";

export default defineConfig({
  title: "The Gray Tutor",
  description: "Build a JAM client in TypeScript, one Gray Paper rule at a time.",
  srcDir: "lessons",
  base,
  cleanUrls: true,
  // Grafana and the stack are on localhost on purpose; every other link must resolve
  ignoreDeadLinks: [/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/],
  lastUpdated: false,
  // concepts-only mode (theme/concepts.ts), from the link or the saved choice, applied
  // before the page draws so code never flashes
  head: [
    ["script", {}, CONCEPTS_HEAD],
    // the professor in the browser tab; head links don't get the base added for them
    ["link", { rel: "icon", type: "image/svg+xml", href: `${base}logo.svg` }],
  ],
  // $$ ... $$ is a Gray Paper formula, drawn as maths when the site is built (MathJax, to
  // SVG: no script in the reader's browser, and print.html gets it too)
  markdown: {
    math: true,
    config: (md) => { snippetLabels(md); stepViews(md); albert(md); textSymbols(md); unitCodes(md); checkBlocks(md); },
    codeTransformers: [shellComments()],
  },
  // pages that moved keep their old address, as a page that sends the reader on; and the
  // whole tutorial on one page, print.html, for printing and reading offline
  buildEnd: async (site) => {
    writeRedirects(site.outDir, site.site.base);
    writePrintPage(site.outDir, site.site.base, printPages);
    // the same pages as an e-book, the concepts edition, for an e-reader (epub.ts): only
    // when asked (npm run epub), so a release carries it, not every build
    if (process.env.EPUB) writeEpub(site.outDir, site.site.base, printPages);
  },
  themeConfig: {
    // the Gray Paper sections, for GrayPaperRefs.vue and GrayPaperMap.vue
    grayPaper,
    // the professor beside the title (lessons/public/logo.svg)
    logo: { src: "/logo.svg", alt: "" },
    // every word you type must match, so "ready queue" finds the ready queue first
    search: { provider: "local", options: { miniSearch: { searchOptions: { combineWith: "AND" } } } },
    nav: [
      { text: "Demo", link: "/demo" },
      { text: "Scoreboard", link: "/scoreboard" },
      { text: "Glossary", link: "/glossary" },
      { text: "Symbols", link: "/symbols" },
      // a plain page outside the app (print.ts): `target` makes the link load it in full
      { text: "One page", link: "/print.html", target: "_self" },
      // the e-book's latest release (.github/workflows/epub.yml)
      { text: "E-book", link: "https://github.com/abutlabs/the-gray-tutor/releases/latest" },
      { text: "JAM learning", link: "https://abutlabs.github.io/jam-learning/" },
    ],
    socialLinks: [{ icon: "github", link: "https://github.com/abutlabs/the-gray-tutor" }],
    outline: { level: [2, 3] },
    docFooter: { prev: "Previous lesson", next: "Next lesson" },
    // in reading order, so the pager and the arrow keys walk the lessons; the glossary is an
    // appendix at the end, as in the Rust Book, and always one click away in the top bar
    sidebar: [
      { text: "Start here", link: "/" },
      ...parts.map((p) => ({
        text: `${p.title}${sectionsLine(p.dir)}`,
        link: `/${p.dir}/`,
        collapsed: false,
        items: p.lessons.map((l) => ({
          text: `${l.id} ${l.title.replace(/^[\d.]+\s+/, "")}`,
          link: `/${l.file.replace(/\.md$/, "")}`,
        })),
      })),
      { text: "The scoreboard", link: "/scoreboard" },
      { text: "Demo", link: "/demo" },
      { text: "Glossary", link: "/glossary" },
      { text: "Gray Paper symbols", link: "/symbols" },
      { text: "Cryptography we use", link: "/cryptography" },
      { text: "JAM at a glance", link: "/jam-at-a-glance" },
      { text: "The Gray Paper, part by part", link: "/gray-paper" },
    ],
  },
});

// The Gray Paper's ↕ (a length in front) and ♈ (Ω_♈, provide) are also emoji, and phones
// draw them as coloured pictures; the text presentation selector, U+FE0E, asks for the
// plain symbol.
function textSymbols(md: MarkdownIt): void {
  md.core.ruler.push("text-symbols", (state) => {
    for (const token of state.tokens) {
      for (const child of token.children ?? []) {
        if (child.type === "text" || child.type === "code_inline") {
          child.content = child.content.replace(/([↕♈])(?!\uFE0E)/g, "$1\uFE0E");
        }
      }
    }
  });
}

// A label line above a code block ("**Add to** `src/x.ts`") becomes a tab on the block, and
// its bold word a link to the list of labels in 0.1 (as the Book's Ferris icons link to theirs).
// A ```text block right after a Run block is its output (tools/output.ts): it gets an Output tab.
// An Add to / Replace in snippet is shown as the whole file after it, the step's lines
// highlighted (stepViews).
// Every file snippet is numbered in its lesson, with an anchor and a link to itself at the
// end of its tab ("snippet 2", #snippet-2), as the Book numbers its listings.
function snippetLabels(md: MarkdownIt): void {
  const LABEL = /^\*\*(New file|Add to|Replace in|Rewrite|Run(?:, expect it to fail)?)\*\*(?: `[^`]+`)?$/;
  const KIND: Record<string, string> = {
    "New file": "new", "Add to": "add", "Replace in": "replace", "Rewrite": "rewrite",
    "Run": "run", "Run, expect it to fail": "run fails",
  };
  md.core.ruler.push("snippet-labels", (state) => {
    const t = state.tokens;
    // lasair's folds are code too: concepts-only mode (theme/concepts.ts) hides them
    for (const token of t) {
      if (token.type === "html_block" && /^<details>\s*<summary>lasair/.test(token.content)) {
        token.content = token.content.replace("<details>", '<details class="lasair">');
      }
    }
    for (let i = 0; i + 3 < t.length; i++) {
      if (t[i].type !== "paragraph_open" || t[i + 2].type !== "paragraph_close" || t[i + 3].type !== "fence") continue;
      const m = LABEL.exec(t[i + 1].content);
      if (!m) continue;
      t[i].attrJoin("class", `snippet-label ${KIND[m[1]]}`);
      const words = t[i + 1].children ?? [];
      const link = new state.Token("link_open", "a", 1);
      link.attrs = [["href", LEGEND], ["class", "snippet-legend"], ["title", "What the labels mean"]];
      const open = words.findIndex((w) => w.type === "strong_open");
      const close = words.findIndex((w) => w.type === "strong_close");
      if (open >= 0 && close > open) {
        words.splice(close + 1, 0, new state.Token("link_close", "a", -1));
        words.splice(open, 0, link);
      }
      const at = `${state.env.relativePath}:${(t[i].map?.[0] ?? -1) + 1}`;
      const n = numbers.get(at);
      if (n !== undefined) {
        t[i].attrSet("id", `snippet-${n}`);
        const self = new state.Token("link_open", "a", 1);
        self.attrs = [["href", `#snippet-${n}`], ["class", "snippet-anchor"], ["title", "A link to this snippet"]];
        const words = new state.Token("text", "", 0);
        words.content = `snippet ${n}`;
        t[i + 1].children?.push(self, words, new state.Token("link_close", "a", -1));
      }
      const snap = whole.get(at);
      if ((m[1] === "Add to" || m[1] === "Replace in") && snap) {
        t[i + 3].meta = { ...t[i + 3].meta, whole: snap };
      }
      if (m[1].startsWith("Run") && t[i + 4]?.type === "fence" && t[i + 4].info.trim() === "text") {
        const tab = new state.Token("html_block", "", 0);
        tab.content = '<p class="snippet-label output"><strong>Output</strong></p>\n';
        t.splice(i + 4, 0, tab);
      }
    }
  });
}

// An Add to / Replace in step as the whole file after it, folded where nothing changed, with
// the snippet itself behind the eye (whole.ts, theme/eye.ts). Without a script, the whole
// file shows, its folds closed.
function stepViews(md: MarkdownIt): void {
  const fence = md.renderer.rules.fence!;
  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const snippet = fence(tokens, idx, options, env, self);
    const snap: Snapshot | undefined = token.meta?.whole;
    if (!snap) return snippet;
    // the same fence again, as the whole file with the step's lines highlighted
    const { content, info } = token;
    const ranges = lineRanges([...snap.changed].map((k) => k + 1));
    token.content = linesOf(snap).join("\n") + "\n";
    token.info = ranges ? `${info.trim()}{${ranges}}` : info;
    const whole = fence(tokens, idx, options, env, self);
    Object.assign(token, { content, info });
    return stepView(whole, snippet, snap);
  };
}

// A comment line in a shell block (`# prints: ...`, `# fails with: ...`) is for reading:
// the copy button leaves it out, so what you paste is only the commands.
function shellComments(): ShikiTransformer {
  return {
    name: "shell-comments",
    line(node, line) {
      const shell = /^(sh|bash|zsh|shell)$/.test(this.options.lang);
      if (shell && /^\s*#/.test(this.source.split("\n")[line - 1] ?? "")) {
        this.addClassToHast(node, "vp-copy-ignore");
      }
    },
  };
}
