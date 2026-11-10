// The Gray Paper 0.8.0, read from its own LaTeX source (submodules/graypaper, beside the
// tutorial) and turned into Markdown the site draws: its sections, its paragraphs, its
// numbered equations and its tables, word for word. The tutorial quotes the paper from this,
// never by hand (tools/gray-paper-text.ts puts each piece in its lesson), so a quote can't
// drift from the paper and every equation keeps the number the PDF gives it.
//
// The paper's math is written with its own macros (\authpool for α, \sequence for ⟦⟧). They
// are expanded here into plain LaTeX that MathJax and VS Code's preview both draw, through
// the paper's own preamble; the few its packages draw and MathJax can't are in OVERRIDES.
// Every semantic macro a formula uses is remembered, so a formula can carry a key of its
// symbols (gray-paper-glosses.ts).

import { readFileSync } from "node:fs";
import { join } from "node:path";

// ---- reading TeX ------------------------------------------------------------------------

const LETTER = /[A-Za-z¬@]/;

/** The index just past the group that opens at s[i] ("{" ... "}"), counting escaped braces out. */
export function groupEnd(s: string, i: number, open = "{", close = "}"): number {
  let depth = 0;
  for (let j = i; j < s.length; j++) {
    const c = s[j];
    if (c === "\\") { j++; continue; }
    if (c === open) depth++;
    else if (c === close && --depth === 0) return j + 1;
  }
  throw new Error(`unclosed ${open} at ${i}: ${s.slice(i, i + 60)}`);
}

/** The control sequence at s[i] (a backslash): its name and where it ends. */
export function controlAt(s: string, i: number): { name: string; end: number } {
  let j = i + 1;
  if (j < s.length && LETTER.test(s[j])) {
    while (j < s.length && LETTER.test(s[j])) j++;
    return { name: s.slice(i + 1, j), end: j };
  }
  return { name: s[j] ?? "", end: j + 1 };
}

const skipSpace = (s: string, i: number) => { while (i < s.length && /\s/.test(s[i])) i++; return i; };

/** One undelimited argument at s[i]: a group's inside, a control sequence, or one character. */
export function readArg(s: string, i: number): { arg: string; end: number; braced: boolean } {
  i = skipSpace(s, i);
  if (s[i] === "{") { const end = groupEnd(s, i); return { arg: s.slice(i + 1, end - 1), end, braced: true }; }
  if (s[i] === "\\") { const { end } = controlAt(s, i); return { arg: s.slice(i, end), end, braced: false }; }
  return { arg: s[i] ?? "", end: i + 1, braced: false };
}

/** An optional argument "[...]" at s[i], if there is one (spaces before it allowed). */
function readOptional(s: string, i: number): { arg: string; end: number } | undefined {
  const j = skipSpace(s, i);
  if (s[j] !== "[") return undefined;
  let depth = 0;
  for (let k = j; k < s.length; k++) {
    const c = s[k];
    if (c === "\\") { k++; continue; }
    if (c === "{") depth++;
    else if (c === "}") depth--;
    else if (c === "]" && depth === 0) return { arg: s.slice(j + 1, k), end: k + 1 };
  }
  throw new Error(`unclosed [ at ${j}`);
}

/** The text with its comments taken out: "%" to the end of the line, unless escaped. */
export function stripComments(tex: string): string {
  return tex.split("\n").map((line) => {
    for (let i = 0; i < line.length; i++) {
      if (line[i] === "\\") { i++; continue; }
      if (line[i] === "%") return line.slice(0, i);
    }
    return line;
  }).join("\n");
}

// ---- macros -------------------------------------------------------------------------------

export interface Macro { name: string; args: number; optional?: string; body: string }

/** The macros a piece of TeX defines with \newcommand, \renewcommand or \providecommand. */
export function readMacros(tex: string, into = new Map<string, Macro>()): Map<string, Macro> {
  const re = /\\(?:new|renew|provide)command\*?\s*/g;
  for (let m = re.exec(tex); m; m = re.exec(tex)) {
    let i = m.index + m[0].length;
    let name: string;
    if (tex[i] === "{") { const end = groupEnd(tex, i); name = tex.slice(i + 1, end - 1).trim().slice(1); i = end; }
    else { const c = controlAt(tex, i); name = c.name; i = c.end; }
    let args = 0;
    let optional: string | undefined;
    const n = readOptional(tex, i);
    if (n) { args = Number(n.arg); i = n.end; const d = readOptional(tex, i); if (d) { optional = d.arg; i = d.end; } }
    i = skipSpace(tex, i);
    if (tex[i] !== "{") continue; // \newcommand\foo\bar: not used for math
    const end = groupEnd(tex, i);
    if (!SKIP_DEFINITION.has(name)) into.set(name, { name, args, optional, body: tex.slice(i + 1, end - 1) });
    re.lastIndex = end;
  }
  return into;
}

// \left and \right are redefined by the preamble for spacing only; the rest are typesetting
// MathJax does differently (OVERRIDES) or text the converter handles itself
const SKIP_DEFINITION = new Set(["left", "right", "tightlist", "superimpose"]);

/** What MathJax draws for a macro whose definition it can't follow (packages it lacks:
 *  mathabx, MnSymbol, stackengine, accents, nicefrac), as a macro of the same arguments. */
export const OVERRIDES: Record<string, Macro> = Object.fromEntries(([
  ["sequence", 2, "", "\\left[\\!\\left[#2\\right]\\!\\right]_{#1}"],
  ["doubleplus", 0, undefined, "\\mathbin{+\\!\\!+}"],
  // ⟜ and ⊸ drawn from MathJax's own shapes, so the e-book's pictures of them need no font
  ["seqminusl", 0, undefined, "\\mathbin{\\circ\\!\\!\\!-\\!\\!-}"],
  ["seqminusr", 0, undefined, "\\mathbin{\\multimap}"],
  ["disjoint", 0, undefined, "\\mathrel{\\unicode{x2AEF}}"],
  ["anglebar", 1, undefined, "\\left\\langle\\!\\left\\vert #1\\right\\vert\\!\\right\\rangle"],
  ["orderby", 2, undefined, "#2\\,\\wr\\,#1"],
  ["orderuniqby", 2, undefined, "#2\\,\\wr\\!\\wr\\,#1"],
  ["orderedin", 0, undefined, "\\mathrel{\\unicode{x2B40}}"],
  ["tricolon", 0, undefined, "\\mathrel{\\unicode{x2AF6}}"],
  ["fold", 0, undefined, "\\ \\thicksim\\!\\!\\!\\!\\!\\int"],
  ["rem", 0, undefined, "\\ \\%\\ "],
  ["remainder", 0, undefined, "\\,\\mathsf{R}\\,"],
  ["nicefrac", 2, undefined, "{}^{#1}\\!/_{#2}"],
  ["accentset", 2, undefined, "\\overset{#1}{#2}"],
  ["wideparen", 1, undefined, "\\overparen{#1}"],
  ["lightning", 0, undefined, "\\unicode{x21AF}"],
  ["fault", 0, undefined, "\\unicode{x2132}"],
  ["maybe", 1, undefined, "\\mathord{\\unicode{xBF}}#1"],
  ["bm", 1, undefined, "\\boldsymbol{#1}"],
  ["token", 1, undefined, "\\texttt{#1}"],
  ["Jam", 0, undefined, "\\text{JAM}"],
  ["Gemini", 0, undefined, "\\unicode{x264A}"],
  ["Taurus", 0, undefined, "\\unicode{x2649}"],
  ["Aries", 0, undefined, "\\unicode{x2648}"],
  ["eg", 0, undefined, "\\text{e.g. }"],
  ["ie", 0, undefined, "\\text{i.e. }"],
  ["etc", 0, undefined, "\\text{\\&c.}"],
  ["twothirds", 0, undefined, "{}^{2}\\!/_{3}"],
  ["onethird", 0, undefined, "{}^{1}\\!/_{3}"],
  ["textsc", 1, undefined, "\\text{#1}"],
  ["smaller", 0, undefined, ""],
  ["small", 0, undefined, ""],
  ["footnotesize", 0, undefined, ""],
  ["scriptsize", 0, undefined, ""],
  ["xspace", 0, undefined, ""],
  ["@", 0, undefined, ""],
  ["mrule", 0, undefined, ""],
  ["multicolumn", 3, undefined, "#3"],
  ["ensuremath", 1, undefined, "#1"],
  // \span joins alignment cells in TeX (statistics.tex's \span\span); MathJax has no \span,
  // and the rows it's in end there, so the cell simply runs on
  ["span", 0, undefined, ""],
] as [string, number, string | undefined, string][]).map(([name, args, optional, body]) => [name, { name, args, optional, body }]));

/** The paper's macros, from its preamble, with the overrides MathJax needs. */
export function paperMacros(gp: string): Map<string, Macro> {
  const macros = readMacros(stripComments(readFileSync(join(gp, "preamble.tex"), "utf8")));
  for (const [name, m] of Object.entries(OVERRIDES)) macros.set(name, m);
  return macros;
}

/** The math with every macro the paper defines expanded, and each semantic one it met noted
 *  in `used` (the names a formula's key looks up). */
export function expandMath(s: string, macros: Map<string, Macro>, used?: Set<string>, depth = 0): string {
  if (depth > 40) throw new Error(`macros nest too deep: ${s.slice(0, 80)}`);
  let out = "";
  for (let i = 0; i < s.length;) {
    if (s[i] !== "\\") { out += s[i++]; continue; }
    const { name, end } = controlAt(s, i);
    const m = macros.get(name);
    if (!m || (name.length === 1 && !LETTER.test(name))) { out += s.slice(i, end); i = end; continue; }
    let j = end;
    const args: string[] = [];
    if (m.optional !== undefined) {
      const o = readOptional(s, j);
      args.push(o ? o.arg : m.optional);
      if (o) j = o.end;
    }
    while (args.length < m.args) { const a = readArg(s, j); args.push(a.arg); j = a.end; }
    used?.add(name);
    // small capitals, as the PDF prints \textsc{vrf}: capitals, there being no small ones in math
    if (name === "textsc") { out += `\\text{${args[0].toUpperCase()}}`; i = j; continue; }
    // an argument after a control word must not run into it: \vert#1 with p is \vert p
    const body = m.body.replace(/(\\[A-Za-z¬]+)?#(\d)/g, (_, cs: string | undefined, k: string) => {
      const a = args[Number(k) - 1] ?? "";
      return cs ? `${cs}${LETTER.test(a[0] ?? "") ? " " : ""}${a}` : a;
    });
    let expanded = expandMath(body, macros, used, depth + 1);
    // a macro right after _ or ^ is one argument there, as TeX reads it
    if (/[_^]\s*$/.test(out)) expanded = `{${expanded}}`;
    // nor one before it run into the letter it starts with: \lgroup then a\in
    else if (/\\[A-Za-z]+$/.test(out) && LETTER.test(expanded[0] ?? "")) expanded = ` ${expanded}`;
    // a control word at the end must not run into a letter after it
    else if (/\\[A-Za-z]+$/.test(expanded) && LETTER.test(s[j] ?? "")) expanded += " ";
    out += expanded;
    i = j;
  }
  return out;
}

// ---- the paper's structure ----------------------------------------------------------------

export type BlockKind = "text" | "math" | "list" | "table";

/** One piece of a section: a paragraph, a displayed formula, a list or a table. */
export interface Block {
  /** "8.2:3": the third piece of §8.2 (its own pieces, not its subsections') */
  id: string;
  section: string;
  kind: BlockKind;
  /** its TeX, comments out */
  tex: string;
  /** equation numbers it gives, in order: ["8.2", "8.3"] */
  equations: string[];
  /** its labels, each with what a \ref to it prints */
  labels: Record<string, string>;
}

export interface Section {
  /** "8", "8.2", "A.5.3"; "abstract" for the abstract */
  id: string;
  title: string;
  depth: number;
  label?: string;
  blocks: Block[];
}

export interface Paper {
  sections: Section[];
  /** every \label: what a \ref to it prints ("8.2", "11.25", "C") */
  refs: Map<string, string>;
  /** which section or block a label belongs to: a section id, or a block id */
  homes: Map<string, string>;
  macros: Map<string, Macro>;
  bib: Map<string, string>;
  /** the version, from the paper's VERSION file */
  version: string;
}

const DISPLAY = new Set(["equation", "equation*", "align", "align*", "gather", "gather*"]);
const LISTS = new Set(["description", "itemize", "enumerate"]);
const TABLES = new Set(["longtable", "tabular"]);

/** The paper read whole: every file \input by graypaper.tex, in order. */
export function readPaper(gp: string): Paper {
  const main = readFileSync(join(gp, "graypaper.tex"), "utf8");
  const macros = paperMacros(gp);
  const files = [...main.matchAll(/\\input\{(text\/[^}]+)\}/g)].map((m) => m[1]);
  const appendixAt = main.indexOf("\\appendix");
  const sections: Section[] = [];
  const refs = new Map<string, string>();
  const homes = new Map<string, string>();
  let sectionNo = 0, appendixNo = 0;
  const counters = [0, 0, 0];
  let eq = 0;
  let current: Section | undefined;
  let prefix = "";

  const open = (depth: number, title: string, label?: string) => {
    let id: string;
    if (depth === 0) {
      counters.splice(0, 3, 0, 0, 0);
      eq = 0;
      id = prefix;
    } else {
      counters[depth - 1]++;
      for (let k = depth; k < 3; k++) counters[k] = 0;
      id = [prefix, ...counters.slice(0, depth)].join(".");
    }
    current = { id, title, depth, label, blocks: [] };
    sections.push(current);
    if (label) { refs.set(label, id); homes.set(label, id); }
  };

  for (const f of files) {
    const appendix = main.indexOf(`{${f}}`) > appendixAt;
    const tex = stripComments(readFileSync(join(gp, f.endsWith(".tex") ? f : `${f}.tex`), "utf8"));
    readMacros(tex, macros); // a file's own (accumulation.tex's locals, pvm.tex's \S)
    for (const [name, m] of Object.entries(OVERRIDES)) if (name !== "mrule") macros.set(name, m);
    if (f === "text/abstract.tex") {
      current = { id: "abstract", title: "Abstract", depth: 0, blocks: [] };
      sections.push(current);
    }
    for (const piece of pieces(tex)) {
      if (piece.kind === "heading") {
        if (piece.depth === 0) prefix = appendix ? String.fromCharCode(65 + appendixNo++) : String(++sectionNo);
        open(piece.depth, piece.title, piece.label);
        continue;
      }
      if (!current) throw new Error(`${f}: text before the first section`);
      const block: Block = { id: `${current.id}:${current.blocks.length + 1}`, section: current.id, kind: piece.kind, tex: piece.tex, equations: [], labels: {} };
      if (piece.kind === "math") {
        for (const row of numberedRows(piece.tex, piece.env)) {
          if (!row.numbered) { for (const l of row.labels) refs.set(l, refs.get(l) ?? ""); continue; }
          const n = `${current.id.split(".")[0]}.${++eq}`;
          block.equations.push(n);
          for (const l of row.labels) block.labels[l] = n;
        }
      }
      // a numbered list's item is cited by its number (§1.2's "items 3 and 4")
      if (piece.kind === "list" && piece.env === "enumerate") {
        piece.tex.split(/\\item\b/).slice(1).forEach((item, k) => {
          for (const l of item.matchAll(/\\label\{([^}]+)\}/g)) block.labels[l[1]] = String(k + 1);
        });
      }
      for (const l of piece.tex.matchAll(/\\label\{([^}]+)\}/g)) {
        if (!(l[1] in block.labels)) block.labels[l[1]] = refs.get(l[1]) || current.id;
      }
      for (const [l, n] of Object.entries(block.labels)) { refs.set(l, n); homes.set(l, block.id); }
      if (piece.kind === "text" && !piece.tex.replace(/\\label\{[^}]*\}/g, "").trim()) continue;
      current.blocks.push(block);
    }
  }
  return { sections, refs, homes, macros, bib: readBib(join(gp, "biblio.bib")), version: readFileSync(join(gp, "VERSION"), "utf8").trim() };
}

type Piece =
  | { kind: "heading"; depth: number; title: string; label?: string }
  | { kind: BlockKind; tex: string; env?: string };

/** A file's pieces, in order: headings, paragraphs, displayed formulas, lists and tables. */
function pieces(tex: string): Piece[] {
  const out: Piece[] = [];
  let para = "";
  const flush = () => {
    for (const p of para.split(/\n\s*\n/)) {
      const t = p.replace(/\\(noindent|newpage|medskip|bigskip|smallskip|par)\b/g, "").trim();
      if (t && !/^\\(vskip|vspace)/.test(t)) out.push({ kind: "text", tex: t });
    }
    para = "";
  };
  for (let i = 0; i < tex.length;) {
    if (tex[i] !== "\\") { para += tex[i++]; continue; }
    const { name, end } = controlAt(tex, i);
    const heading = ["section", "subsection", "subsubsection"].indexOf(name);
    if (heading >= 0 && tex[skipSpace(tex, end)] === "{") {
      flush();
      const t = readArg(tex, end);
      let j = t.end;
      let label: string | undefined;
      const k = skipSpace(tex, j);
      if (tex.startsWith("\\label{", k)) { const g = readArg(tex, k + 6); label = g.arg; j = g.end; }
      out.push({ kind: "heading", depth: heading, title: t.arg.trim(), label });
      i = j;
      continue;
    }
    if (name === "begin") {
      const env = readArg(tex, end).arg;
      if (DISPLAY.has(env) || LISTS.has(env) || TABLES.has(env)) {
        flush();
        const close = environmentEnd(tex, i, env);
        out.push({ kind: DISPLAY.has(env) ? "math" : LISTS.has(env) ? "list" : "table", tex: tex.slice(i, close).trim(), env });
        i = close;
        continue;
      }
      if (env === "center" || env === "abstract") { i = readArg(tex, end).end; continue; }
    }
    if (name === "end") {
      const env = readArg(tex, end).arg;
      if (env === "center" || env === "abstract") { i = readArg(tex, end).end; continue; }
    }
    if (name === "renewcommand" || name === "newcommand") { // definitions, already read
      let j = end;
      if (tex[j] === "*") j++;
      j = readArg(tex, j).end;
      const n = readOptional(tex, j); if (n) { j = n.end; const d = readOptional(tex, j); if (d) j = d.end; }
      i = readArg(tex, j).end;
      continue;
    }
    para += tex.slice(i, end);
    i = end;
  }
  flush();
  return out;
}

/** Where the environment that begins at s[i] ends, nested ones of the same name counted. */
function environmentEnd(s: string, i: number, env: string): number {
  const b = `\\begin{${env}}`, e = `\\end{${env}}`;
  let depth = 0;
  for (let j = i; j < s.length; j++) {
    if (s.startsWith(b, j)) depth++;
    else if (s.startsWith(e, j) && --depth === 0) return j + e.length;
  }
  throw new Error(`unclosed ${env}`);
}

/** The top-level parts of `s` between separators (`&` or `\\`), outside groups and environments. */
export function splitTop(s: string, sep: "&" | "\\\\"): string[] {
  const parts: string[] = [];
  let depth = 0, from = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "\\") {
      if (s.startsWith("\\begin{", i)) depth++;
      else if (s.startsWith("\\end{", i)) depth--;
      else if (sep === "\\\\" && s[i + 1] === "\\" && depth === 0) { parts.push(s.slice(from, i)); from = i + 2; i++; continue; }
      i++;
      continue;
    }
    if (c === "{") depth++;
    else if (c === "}") depth--;
    else if (c === "&" && sep === "&" && depth === 0) { parts.push(s.slice(from, i)); from = i + 1; }
  }
  parts.push(s.slice(from));
  return parts;
}

/** A displayed formula's rows, and which of them the PDF numbers. */
function numberedRows(tex: string, env: string | undefined): { numbered: boolean; labels: string[] }[] {
  const inner = innerOf(tex, env!);
  const starred = env!.endsWith("*");
  // amsmath numbers every row of an align, an empty one after a final \\ too (the PDF's 17.11)
  const rows = env === "equation" || env === "equation*" ? [inner] : splitTop(inner, "\\\\");
  return rows.map((r) => ({
    numbered: !starred && !/\\(nonumber|notag)\b/.test(r),
    labels: [...r.matchAll(/\\label\{([^}]+)\}/g)].map((m) => m[1]),
  }));
}

/** The inside of `\begin{env} ... \end{env}`. */
export function innerOf(tex: string, env: string): string {
  const b = `\\begin{${env}}`;
  return tex.slice(tex.indexOf(b) + b.length, tex.lastIndexOf(`\\end{${env}}`));
}

/** Each bibliography key as the paper's citation prints it: "Wood 2014". */
function readBib(path: string): Map<string, string> {
  const bib = new Map<string, string>();
  const text = readFileSync(path, "utf8");
  for (const m of text.matchAll(/@\w+\{([^,]+),([\s\S]*?)\n\}/g)) {
    // a field's value: braced (braces nested), quoted or bare (year = 2023), its TeX made text
    const field = (f: string) => {
      const at = new RegExp(`\\b${f}\\s*=\\s*`, "i").exec(m[2]);
      if (!at) return "";
      const k = at.index + at[0].length;
      const raw = m[2][k] === "{" ? m[2].slice(k + 1, groupEnd(m[2], k) - 1)
        : m[2][k] === '"' ? m[2].slice(k + 1, m[2].indexOf('"', k + 1))
        : /^[^,\n]*/.exec(m[2].slice(k))![0];
      return raw.replace(/\\textsc\{([^}]*)\}/g, (_, x: string) => x.toUpperCase())
        .replace(/\\"\{?([A-Za-z])\}?/g, "$1\u0308").replace(/\\'\{?([A-Za-z])\}?/g, "$1\u0301")
        .replace(/[{}]/g, "").normalize("NFC").trim();
    };
    const authors = field("author").split(/\s+and\s+/).map((a) => (a.includes(",") ? a.split(",")[0] : a.split(/\s+/).at(-1) ?? "").replace(/[{}]/g, "").trim()).filter(Boolean);
    const year = field("year") || field("date").slice(0, 4);
    // an author in double braces is one name, a group's ({{PolkaVM Project}})
    if (/\bauthor\s*=\s*\{\{/.test(m[2])) authors.splice(0, authors.length, field("author"));
    const who = authors.length > 2 ? `${authors[0]} et al.` : authors.join(" and ") || field("title").replace(/[{}]/g, "") || m[1];
    const url = field("url");
    bib.set(m[1].trim(), `${who} ${year}`.trim() + (url ? `|${url}` : ""));
  }
  return bib;
}
