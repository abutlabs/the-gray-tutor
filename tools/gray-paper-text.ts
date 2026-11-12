// The Gray Paper's own words in the lessons: every `::: gray-paper` block is filled from the
// paper's tex (gray-paper-tex.ts), never typed, so the quote is the paper's, word for word,
// with its equation numbers and a key of its symbols (gray-paper-glosses.ts).
//
//   ::: gray-paper 8.2          the whole of §8.2 (its own text, not its subsections')
//   ::: gray-paper 11.4 3-7     pieces 3 to 7 of §11.4; "3-" is 3 to the end, "3" piece 3 alone
//   ::: gray-paper-eq 8.2       the displayed formula holding (8.2) again, for a Part's
//                               appendix that explains it: not counted as the paper's place
//   :::
//
// Each piece of the paper is quoted in exactly one place (tools/gray-paper-text.test.ts),
// so a reference in the paper ("see equation 11.25") links to where 11.25 is quoted.
//
//   npm run gray-paper                 fill every block from the paper
//   npm run gray-paper -- list 11.4    the pieces of §11.4, numbered, to choose a range
//   npm run gray-paper -- unplaced     the pieces no page quotes yet
//   npm run gray-paper -- fill a.md    fill only these pages (paths under lessons/)

import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { type Block, type Paper, controlAt, expandMath, readPaper } from "./gray-paper-tex.ts";
import { anchor, renderBlock, renderTitle } from "./gray-paper-render.ts";
import { GLOSSES, TERMS, type Gloss } from "./gray-paper-glosses.ts";
import { LESSONS, ROOT } from "./lessons.ts";

export const GP = join(ROOT, "../graypaper");
export const OPEN = /^::: gray-paper (\S+)(?: (\d+)(-)?(\d*))?$/;
export const EQ_OPEN = /^::: gray-paper-eq (\S+)$/;
export const CLOSE = ":::";

/** A block of a page: where it opens and closes, and what it quotes. */
export interface Quote {
  file: string;
  /** 0-based lines of the opening and the closing ::: */
  open: number;
  close: number;
  kind: "text" | "eq";
  section: string;
  from: number;
  /** inclusive; Infinity for "to the end" */
  to: number;
  /** for gray-paper-eq: the equation */
  equation?: string;
}

/** Every page of the site, relative to lessons/. */
export const pages = (): string[] =>
  readdirSync(LESSONS, { recursive: true }).map(String).filter((f) => f.endsWith(".md") && !f.startsWith("public")).sort();

/** The quotes on a page, in order. Throws on one that never closes. */
export function quotesIn(file: string, markdown: string): Quote[] {
  const lines = markdown.split("\n");
  const found: Quote[] = [];
  for (let i = 0; i < lines.length; i++) {
    const m = OPEN.exec(lines[i]);
    const e = EQ_OPEN.exec(lines[i]);
    if (!m && !e) {
      if (lines[i].startsWith("::: gray-paper")) throw new Error(`${file}:${i + 1}: not a Gray Paper quote's opening: ${lines[i]}`);
      continue;
    }
    const close = lines.findIndex((l, j) => j > i && l === CLOSE);
    if (close < 0) throw new Error(`${file}:${i + 1}: a Gray Paper quote that never closes with ${CLOSE}`);
    found.push(m
      // "8.2" all of it, "8.2 3" piece 3, "8.2 3-5" pieces 3 to 5, "8.2 3-" 3 to the end
      ? { file, open: i, close, kind: "text", section: m[1], from: m[2] ? Number(m[2]) : 1, to: !m[2] ? Infinity : !m[3] ? Number(m[2]) : m[4] ? Number(m[4]) : Infinity }
      : { file, open: i, close, kind: "eq", section: "", from: 0, to: 0, equation: e![1] });
    i = close;
  }
  return found;
}

/** The blocks a quote holds. */
export function blocksOf(q: Quote, paper: Paper): Block[] {
  if (q.kind === "eq") {
    const b = paper.sections.flatMap((s) => s.blocks).find((x) => x.equations.includes(q.equation!));
    if (!b) throw new Error(`${q.file}:${q.open + 1}: the paper has no equation (${q.equation})`);
    return [b];
  }
  const s = paper.sections.find((x) => x.id === q.section);
  if (!s) throw new Error(`${q.file}:${q.open + 1}: the paper has no section ${q.section}`);
  const to = Math.min(q.to, s.blocks.length);
  if (q.from < 1 || q.from > to) throw new Error(`${q.file}:${q.open + 1}: §${q.section} has pieces 1 to ${s.blocks.length}, not ${q.from}-${q.to === Infinity ? "" : q.to}`);
  return s.blocks.slice(q.from - 1, to);
}

/** Where each piece of the paper is quoted (the gray-paper blocks, not the -eq ones), and
 *  where each equation is explained (the -eq ones). */
export function placements(paper: Paper, texts: Map<string, string>): { quoted: Map<string, string>; explained: Map<string, string>; twice: string[] } {
  const quoted = new Map<string, string>();
  const explained = new Map<string, string>();
  const twice: string[] = [];
  for (const [file, md] of texts) {
    for (const q of quotesIn(file, md)) {
      for (const b of blocksOf(q, paper)) {
        // a Part's appendix (its gray-paper.md) is where an equation is explained
        if (q.kind === "eq") { for (const n of b.equations) if (!explained.has(n) || file.endsWith("/gray-paper.md")) explained.set(n, file); continue; }
        if (quoted.has(b.id)) twice.push(`${b.id}: ${quoted.get(b.id)} and ${file}`);
        else quoted.set(b.id, file);
      }
    }
  }
  return { quoted, explained, twice };
}

/** A link from one page to an anchor on another, as Markdown writes it. */
const linkFrom = (from: string, to: string, hash: string) =>
  from === to ? `#${hash}` : `${relative(dirname(from), to).replace(/^(?!\.)/, "./")}#${hash}`;

/** The symbols a block's source names, in order, that have a gloss: its key. */
export function symbolsOf(tex: string, paper: Paper): string[] {
  const math = /^\\begin/.test(tex) ? tex : [...tex.matchAll(/(?<!\\)\$((?:\\\$|[^$])*)\$/g)].map((m) => m[1]).join(" ");
  const names: string[] = [];
  for (let i = 0; i < math.length; i++) {
    if (math[i] !== "\\") continue;
    const { name, end } = controlAt(math, i);
    i = end - 1;
    if (!/^[A-Za-z¬]+$/.test(name) || names.includes(name)) continue;
    const g = GLOSSES[name];
    if (g && g !== "skip") names.push(name);
    else if (g === undefined && (paper.macros.has(name) || /^[A-Za-z]+$/.test(name))) names.push(name); // unglossed: the test names it
  }
  return names;
}

/** Symbols that can't be drawn alone as they are written: a command's arguments, or the
 *  bar of a set built by a rule, which needs its braces around it. */
const ALONE: Record<string, string> = {
  build: "\\left\\{ x \\;\\middle\\vert\\; y \\right\\}",
  frac: "\\frac{x}{y}", tilde: "\\tilde{x}", widetilde: "\\widetilde{x}", bar: "\\bar{x}",
  check: "\\check{x}", overline: "\\overline{x}", overleftarrow: "\\overleftarrow{x}",
  overrightarrow: "\\overrightarrow{x}", overset: "\\overset{y}{x}", overbrace: "\\overbrace{x}",
  overparen: "\\overparen{x}", sqrt: "\\sqrt{x}", hat: "\\hat{x}", dot: "\\dot{x}", vec: "\\vec{x}",
  middle: "\\vert", left: "", right: "", not: "\\not=", boldsymbol: "\\boldsymbol{x}",
};

/** A symbol as its key shows it: the macro drawn alone, its arguments as x, y, z. */
export function symbolTex(name: string, paper: Paper): string {
  if (name in ALONE) return ALONE[name];
  const m = paper.macros.get(name);
  if (!m) return `\\${name}`;
  // an optional argument left out, as the paper mostly writes it: \hash is ℍ, not ℍ_n
  const args = ["x", "y", "z", "w", "v"].slice(0, m.args - (m.optional !== undefined ? 1 : 0)).map((a) => `{${a}}`).join("");
  return expandMath(`\\${name}${args}`, paper.macros).replace(/_\{\}/g, "").replace(/\s+/g, " ").trim();
}

const cell = (s: string) => s.replace(/\|/g, "\\|");

/** A symbol's id on the page: its key row is #gk-<this>, its marks in formulas class gk-<this>. */
export const keyId = (name: string) => name.replace(/¬/g, "-");

/** The key of a formula: a row for each symbol not yet keyed on this page. */
function keyOf(block: Block, paper: Paper, keyed: Set<string>, file: string): string {
  const rows: string[] = [];
  for (const name of symbolsOf(block.tex, paper)) {
    const g = GLOSSES[name] as Gloss | undefined;
    if (!g || !g.means || keyed.has(name)) continue;
    keyed.add(name);
    // two macros drawn alike (\H and \theheader, both 𝐇) are one symbol to a reader
    if (keyed.has(`tex:${symbolTex(name, paper)}`)) continue;
    keyed.add(`tex:${symbolTex(name, paper)}`);
    const tex = `$${symbolTex(name, paper)}$`;
    const symbol = g.entry ? `[${tex}](${linkFrom(file, "symbols.md", g.entry)})` : tex;
    // a symbol the site can mark in the formulas themselves, for hover (../.vitepress/gray-paper.ts):
    // a noun of the paper's own, drawn by a command; operators keep their spacing unmarked
    // (and nothing with spacing in it, whose ends a regex can't see: \rem is "\ \%\ ")
    const drawn = symbolTex(name, paper);
    const wrap = paper.macros.get(name)?.args === 0 && /\\/.test(drawn) && !/^\\(mathbin|mathrel|mathop|mathord|left|right|text|unicode)/.test(drawn) && !/\\[ ,;:!]|\\$/.test(drawn);
    rows.push(`| <span id="gk-${keyId(name)}"${wrap ? ` class="gk-wrap"` : ""}>${symbol}</span> | ${cell(g.say)} | ${cell(g.means)} |`);
  }
  if (rows.length === 0) return "";
  // folded on the site, where hovering a symbol says the same; open in the e-book (epub.ts)
  return `<details class="gp-key"><summary>Its symbols</summary>\n\n| Symbol | Say it | Means |\n| --- | --- | --- |\n${rows.join("\n")}\n\n</details>`;
}

/** Each glossed prose word, the first time the page quotes it, underlined with its meaning. */
function withTerms(markdown: string, termed: Set<string>): string {
  // only in plain words: math, links, code and tags (an underline's own title too) are kept
  const PROTECTED = /(\$[^$]*\$|\[[^\]]*\]\([^)]*\)|`[^`]*`|<abbr[^>]*>[^<]*<\/abbr>|<[^>]*>)/;
  for (const t of TERMS) {
    if (termed.has(t.term)) continue;
    const re = new RegExp(`(?<![\\w-])${t.term.replace(/[-]/g, "\\-")}(?![\\w-])`);
    const parts = markdown.split(PROTECTED);
    const k = parts.findIndex((part, n) => n % 2 === 0 && re.test(part));
    if (k < 0) continue;
    termed.add(t.term);
    parts[k] = parts[k].replace(re, `<abbr class="gp-term" title="${t.means.replace(/"/g, "&quot;")}">${t.term}</abbr>`);
    markdown = parts.join("");
  }
  return markdown;
}

/** A page with every quote filled from the paper. */
export function fill(file: string, markdown: string, paper: Paper, where: ReturnType<typeof placements>): string {
  const lines = markdown.split("\n");
  const keyed = new Set<string>();
  const termed = new Set<string>();
  const link = (label: string): string | undefined => {
    const home = paper.homes.get(label);
    if (!home) return undefined;
    if (home.includes(":")) {
      const to = where.quoted.get(home);
      const block = paper.sections.flatMap((s) => s.blocks).find((b) => b.id === home)!;
      const eq = Object.entries(block.labels).find(([l]) => l === label)?.[1];
      return to && linkFrom(file, to, eq && block.equations.includes(eq) ? anchor.equation(eq) : anchor.block(home));
    }
    // a section: the first piece of it, or of its first subsection, that a page quotes
    const first = paper.sections.filter((s) => s.id === home || s.id.startsWith(`${home}.`)).flatMap((s) => s.blocks)[0];
    const to = first && where.quoted.get(first.id);
    return to && linkFrom(file, to, anchor.block(first.id));
  };
  const out: string[] = [];
  let at = 0;
  for (const q of quotesIn(file, markdown)) {
    out.push(...lines.slice(at, q.open + 1));
    const parts: string[] = [];
    const blocks = blocksOf(q, paper);
    if (q.kind === "text") {
      const s = paper.sections.find((x) => x.id === q.section)!;
      const name = /^\d/.test(s.id) ? `§${s.id}` : s.id === "abstract" ? "" : `Appendix ${s.id}`;
      parts.push(`#### ${[name, renderTitle(s, paper)].filter(Boolean).join(" ")}${q.from > 1 ? ", continued" : ` {#${anchor.section(s.id)}}`}`);
    } else {
      const b = blocks[0];
      const home = where.quoted.get(b.id);
      const numbers = b.equations.map((n) => `(${n})`).join(", ");
      parts.push(`<a id="ex-${q.equation!.replace(/\./g, "-")}"></a>The Gray Paper's ${numbers}${home ? `, [in its place in the paper's words](${linkFrom(file, home, anchor.equation(b.equations[0]))})` : ""}:`);
    }
    for (const b of blocks) {
      const r = renderBlock(b, paper, link);
      let md = q.kind === "eq" ? r.markdown.replace(/<a id="[^"]*"><\/a>/g, "") : r.markdown;
      if (b.kind === "text" || b.kind === "list") md = withTerms(md, termed);
      parts.push(md.trim());
      if (b.kind === "math") {
        const key = keyOf(b, paper, keyed, file);
        if (key) parts.push(key);
        const explained = b.equations.map((n) => where.explained.get(n)).find(Boolean);
        if (q.kind === "text" && explained && explained !== file) {
          parts.push(`→ [${b.equations.map((n) => `(${n})`).join(", ")} explained](${linkFrom(file, explained, `ex-${b.equations[0].replace(/\./g, "-")}`)})`);
        }
      }
    }
    out.push("", parts.join("\n\n"), "");
    at = q.close;
  }
  out.push(...lines.slice(at));
  return out.join("\n");
}

/** Every page's text, by its path under lessons/. */
export const texts = (): Map<string, string> => new Map(pages().map((f) => [f, readFileSync(join(LESSONS, f), "utf8")]));

// ---- the command ------------------------------------------------------------------------

if (import.meta.url === `file://${process.argv[1]}`) {
  if (!existsSync(GP)) throw new Error(`no Gray Paper at ${GP}: it's the graypaper submodule beside the tutorial`);
  const paper = readPaper(GP);
  const [command, arg] = process.argv.slice(2);
  const all = texts();
  const where = placements(paper, all);
  if (command === "list") {
    const s = paper.sections.find((x) => x.id === arg);
    if (!s) throw new Error(`no section ${arg}`);
    console.log(`§${s.id} ${s.title}`);
    for (const b of s.blocks) {
      const words = b.tex.replace(/\s+/g, " ").slice(0, 90);
      console.log(`  ${String(b.id.split(":")[1]).padStart(2)}  ${b.kind.padEnd(5)} ${b.equations.length ? `(${b.equations.join(", ")}) ` : ""}${where.quoted.get(b.id) ? `[${where.quoted.get(b.id)}] ` : ""}${words}`);
    }
  } else if (command === "unplaced") {
    for (const s of paper.sections) {
      const missing = s.blocks.filter((b) => !where.quoted.has(b.id));
      if (missing.length) console.log(`§${s.id} ${s.title}: ${missing.map((b) => b.id.split(":")[1]).join(", ")}`);
    }
  } else {
    // "fill a.md b.md": only those pages (another writer may be busy with the rest)
    const only = command === "fill" ? new Set(process.argv.slice(3).map((f) => f.replace(/^lessons\//, ""))) : undefined;
    let changed = 0;
    for (const [file, md] of all) {
      if (only && !only.has(file)) continue;
      const next = fill(file, md, paper, where);
      if (next !== md) { writeFileSync(join(LESSONS, file), next); changed++; console.log(`filled ${file}`); }
    }
    console.log(`${changed} page(s) changed; ${where.quoted.size} of ${paper.sections.reduce((n, s) => n + s.blocks.length, 0)} pieces of the paper quoted`);
    if (where.twice.length) { console.error(`quoted twice:\n  ${where.twice.join("\n  ")}`); process.exitCode = 1; }
  }
}
