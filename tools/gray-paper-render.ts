// A piece of the Gray Paper (gray-paper-tex.ts) as the Markdown a lesson quotes: its words
// as the paper has them, its math expanded to plain LaTeX with the paper's own equation
// numbers, its references as links to wherever the tutorial quotes what they point at.

import { type Block, type Paper, type Section, controlAt, expandMath, groupEnd, innerOf, readArg, splitTop } from "./gray-paper-tex.ts";

/** Where a label's target is quoted: a link from the page being written, or undefined. */
export type Linker = (label: string) => string | undefined;

/** An anchor id for an equation, a section or a block: "eq-11-25", "gp-8-2", "gp-8-2-p5". */
export const anchor = {
  equation: (n: string) => `eq-${n.replace(/\./g, "-")}`,
  section: (id: string) => `gp-${id.replace(/\./g, "-")}`,
  block: (id: string) => { const [s, k] = id.split(":"); return `gp-${s.replace(/\./g, "-")}-p${k}`; },
};

export interface Rendered {
  markdown: string;
  /** the paper's macros its display math uses, in order of first use, for the formula's key */
  macros: string[];
}

/** One block as Markdown. */
export function renderBlock(block: Block, paper: Paper, link: Linker): Rendered {
  const notes: string[] = [];
  const used = new Set<string>();
  const ctx: Ctx = { paper, link, notes, used };
  let body: string;
  switch (block.kind) {
    case "text": body = text(block.tex, ctx).replace(/\s*\n\s*/g, " ").trim(); break;
    case "math": body = display(block, ctx); break;
    case "list": body = list(block.tex, ctx, 0); break;
    case "table": body = table(block.tex, ctx); break;
  }
  const anchors = [anchor.block(block.id), ...block.equations.map(anchor.equation)].map((a) => `<a id="${a}"></a>`).join("");
  const footnotes = notes.map((n, k) => `<sup>${k + 1}</sup> ${n}`).join("<br>\n");
  const markdown = block.kind === "text"
    ? `${anchors}${body}${footnotes ? `\n\n<small class="gp-note">${footnotes}</small>` : ""}`
    : `${anchors}\n\n${body}${footnotes ? `\n\n<small class="gp-note">${footnotes}</small>` : ""}`;
  return { markdown, macros: [...used] };
}

/** A section's title, as Markdown. */
export function renderTitle(s: Section, paper: Paper): string {
  return text(s.title, { paper, link: () => undefined, notes: [], used: new Set() }).trim();
}

interface Ctx { paper: Paper; link: Linker; notes: string[]; used: Set<string>; inTable?: boolean }

// ---- text -------------------------------------------------------------------------------

const WORDS: Record<string, string> = {
  Jam: "JAM", ie: "i.e.", Ie: "I.e.", eg: "e.g.", Eg: "E.g.", etc: "&c.", nb: "NB", S: "§",
  ldots: "…", dots: "…", textellipsis: "…", newline: "<br>", noindent: "", xspace: "", par: "",
  twothirds: "⅔", onethird: "⅓", hfill: "", quad: " ", qquad: " ", textbackslash: "\\",
  smallskip: "", medskip: "", bigskip: "", centering: "", toprule: "", midrule: "", bottomrule: "",
  small: "", footnotesize: "", scriptsize: "", normalsize: "", large: "", Large: "", em: "", it: "", bf: "",
};
/** The paper's words that end with \xspace: a space after them when a word follows. */
const XSPACE = new Set(["Jam", "ie", "Ie", "eg", "Eg", "etc", "nb"]);
const ESCAPED: Record<string, string> = { "%": "%", "&": "&amp;", "#": "#", _: "_", $: "\\$", "{": "{", "}": "}", ",": " ", " ": " ", ";": " ", ":": " ", "!": "", "@": "", "/": "", "-": "", "'": "’", "`": "‘", "\\": "<br>" };

/** Text-mode TeX as Markdown. */
function text(s: string, ctx: Ctx): string {
  s = s.replace(/\\undef\{[^}]*\}/g, "");
  let out = "";
  for (let i = 0; i < s.length;) {
    const c = s[i];
    if (c === "$") {
      const display = s[i + 1] === "$";
      const close = mathClose(s, i + (display ? 2 : 1), display ? "$$" : "$");
      out += inline(s.slice(i + (display ? 2 : 1), close), ctx, ctx.inTable);
      i = close + (display ? 2 : 1);
      continue;
    }
    if (c === "\\" && s[i + 1] === "(") {
      const close = s.indexOf("\\)", i);
      out += inline(s.slice(i + 2, close), ctx);
      i = close + 2;
      continue;
    }
    if (c === "~") { out += " "; i++; continue; }
    if (s.startsWith("---", i)) { out += "—"; i += 3; continue; }
    if (s.startsWith("--", i)) { out += "–"; i += 2; continue; }
    if (s.startsWith("``", i)) { out += "“"; i += 2; continue; }
    if (s.startsWith("''", i)) { out += "”"; i += 2; continue; }
    if (c === "<") { out += "&lt;"; i++; continue; }
    if (c === ">") { out += "&gt;"; i++; continue; }
    if (c === "*") { out += "\\*"; i++; continue; }
    if (c === "|" && ctx.inTable) { out += "\\|"; i++; continue; }
    if (c === "{" || c === "}") { i++; continue; } // a bare group: its inside is read on
    if (c !== "\\") { out += c; i++; continue; }
    const { name, end } = controlAt(s, i);
    if (name in ESCAPED && !/[A-Za-z]/.test(name)) { out += ESCAPED[name]; i = end; continue; }
    const arg = () => { const a = readArg(s, end); i = a.end; return a.arg; };
    switch (name) {
      case "emph": case "textit": out += wrap("*", text(arg(), ctx)); break;
      case "textbf": out += wrap("**", text(arg(), ctx)); break;
      case "textsc": out += text(arg(), ctx).toUpperCase(); break;
      case "texttt": case "token": out += "`" + plain(arg()) + "`"; break;
      case "textsf": case "textrm": case "text": case "mbox": case "textnormal": out += text(arg(), ctx); break;
      case "ref": case "eqref": out += ref(arg(), ctx); break;
      case "cite": case "citep": case "autocite": case "textcite": out += cite(arg(), ctx); break;
      case "footnote": ctx.notes.push(text(arg(), ctx).replace(/\s*\n\s*/g, " ").trim()); out += `<sup>${ctx.notes.length}</sup>`; break;
      case "url": { const u = plain(arg()); out += `<${u}>`; break; }
      case "href": { const u = plain(arg()); const t = readArg(s, i); i = t.end; out += `[${text(t.arg, ctx)}](${u})`; break; }
      case "label": arg(); break;
      case "vskip": case "vspace": case "hspace": i = s.slice(end).search(/[\s}]|$/) + end; if (s[end] === "{") arg(); break;
      case "oldstylenums": out += text(arg(), ctx); break;
      case "multicolumn": { let j = readArg(s, end).end; j = readArg(s, j).end; const a = readArg(s, j); i = a.end; out += text(a.arg, ctx); break; }
      case "nicefrac": { const a = arg(); const b = readArg(s, i); i = b.end; out += `${text(a, ctx)}/${text(b.arg, ctx)}`; break; }
      case "undef": arg(); break;
      case "aboverulesep": case "belowrulesep": i = end + (/^\s*=\s*[\d.]+\s*mm/.exec(s.slice(end))?.[0].length ?? 0); break;
      case "makecell": { const o = /^\*?(\[[^\]]*\])?/.exec(s.slice(end))![0]; const a = readArg(s, end + o.length); i = a.end; out += text(a.arg, ctx); break; }
      case "thead": { const o = s[end] === "*" ? 1 : 0; const a = readArg(s, end + o); i = a.end; out += text(a.arg, ctx); break; }
      default:
        if (ctx.paper.macros.has(name)) { const e = expandText(s.slice(i), ctx.paper); s = s.slice(0, i) + e; break; }
        if (name in WORDS) {
          out += WORDS[name];
          i = end;
          // TeX eats the spaces after a control word; \xspace puts one back before a word
          if (/^[A-Za-z]/.test(name)) {
            while (s[i] === " " || s[i] === "\n") i++;
            if (XSPACE.has(name) && /[A-Za-z(]/.test(s[i] ?? "")) out += " ";
          }
          break;
        }
        throw new Error(`text: no rule for \\${name} in: ${s.slice(Math.max(0, i - 40), i + 40)}`);
    }
  }
  return out;
}

/** `*x*` around the words, the spaces kept outside, as Markdown needs. */
const wrap = (mark: string, s: string) => {
  const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(s)!;
  return m[2] ? `${m[1]}${mark}${m[2]}${mark}${m[3]}` : s;
};

/** Text as it is, for code: escapes undone. */
const plain = (s: string) => s.replace(/\\([_$&%#{}])/g, "$1").replace(/\\textbackslash\s*/g, "\\").replace(/[{}]/g, "");

/** Where the math that opens before `from` closes: the next unescaped `$` (or `$$`). */
function mathClose(s: string, from: number, mark: string): number {
  for (let j = from; j < s.length; j++) {
    if (s[j] === "\\") { j++; continue; }
    if (s.startsWith(mark, j)) return j;
  }
  throw new Error(`unclosed ${mark} in: ${s.slice(from - 1, from + 80)}`);
}

/** The text with the macro at its start expanded once, in text mode (pvm.tex's gas-table
 *  shorthands: \\simplealuthreeop is seven cells). */
function expandText(s: string, paper: Paper): string {
  const { name, end } = controlAt(s, 0);
  const m = paper.macros.get(name)!;
  let j = end;
  const args: string[] = [];
  while (args.length < m.args) { const a = readArg(s, j); args.push(a.arg); j = a.end; }
  return m.body.replace(/#(\d)/g, (_, k: string) => args[Number(k) - 1] ?? "") + s.slice(j);
}

/** Every macro outside math expanded, in text mode: before a table is cut into cells. */
function expandTextAll(s: string, paper: Paper): string {
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "$") { i = mathClose(s, i + 1, "$"); continue; }
    if (s[i] !== "\\") continue;
    const { name, end } = controlAt(s, i);
    const m = paper.macros.get(name);
    if (m && /[&$]/.test(m.body)) { s = s.slice(0, i) + expandText(s.slice(i), paper); i--; continue; }
    i = end - 1;
  }
  return s;
}

function ref(label: string, ctx: Ctx): string {
  const n = ctx.paper.refs.get(label);
  if (n === undefined) return "??"; // as the PDF prints a label the paper never set (I.4.4's eq:onxferinvocation)
  const href = ctx.link(label);
  return href ? `[${n}](${href})` : n;
}

function cite(keys: string, ctx: Ctx): string {
  const parts = keys.split(",").map((k) => {
    const entry = ctx.paper.bib.get(k.trim());
    if (!entry) throw new Error(`no bibliography entry ${k}`);
    const [who, url] = entry.split("|");
    return url ? `[${who}](${url})` : who;
  });
  // biblatex's authoryear \cite, as the PDF prints it: "Masson et al. 2021", no brackets
  return parts.join("; ");
}

// ---- math -------------------------------------------------------------------------------

/** Inline math, expanded, on one line. */
function inline(tex: string, ctx: Ctx, inTable = false): string {
  let m = expandMath(mathRefs(tex, ctx), ctx.paper.macros, ctx.used).replace(/\s*\n\s*/g, " ").trim();
  if (inTable) m = m.replace(/\\\|/g, "\\Vert ").replace(/\|/g, "\\vert ");
  return m ? `$${m}$` : "";
}

/** A \\ref inside math (in a \\text) prints its number, as in the PDF. */
const mathRefs = (tex: string, ctx: Ctx) => tex.replace(/\\(?:eq)?ref\{([^}]*)\}/g, (_, l: string) => ctx.paper.refs.get(l) || "??");

/** A displayed formula: its rows with the paper's numbers as tags, in $$ lines. */
function display(block: Block, ctx: Ctx): string {
  const env = /^\\begin\{([a-z*]+)\}/.exec(block.tex)![1];
  const base = env.replace("*", "");
  const inner = innerOf(block.tex, env);
  const rows = base === "equation" ? [inner] : splitTop(inner, "\\\\");
  let k = 0;
  const tagged = rows.map((row) => {
    const numbered = !env.endsWith("*") && !/\\(nonumber|notag)\b/.test(row);
    const clean = row.replace(/\\label\{[^}]*\}/g, "").replace(/\\(nonumber|notag)\b/g, "");
    return numbered ? `${clean.trimEnd()} \\tag{${block.equations[k++]}}` : clean.trimEnd() + (base === "equation" ? "" : " \\notag");
  });
  const outer = base === "equation" ? "equation" : base === "gather" ? "gather" : "align";
  const body = expandMath(mathRefs(tagged.join(" \\\\\n"), ctx), ctx.paper.macros, ctx.used)
    .split("\n").map((l) => l.trim()).filter(Boolean).join("\n");
  // an empty last row, numbered as amsmath numbers it, keeps its place
  return `$$\n\\begin{${outer}}\n${body}\n\\end{${outer}}\n$$`;
}

// ---- lists and tables -------------------------------------------------------------------------

function list(tex: string, ctx: Ctx, depth: number): string {
  const env = /^\\begin\{([a-z]+)\}/.exec(tex)![1];
  const inner = innerOf(tex, env);
  const items: { term?: string; body: string }[] = [];
  let i = 0, depthHere = 0, from = -1, term: string | undefined;
  const push = (to: number) => { if (from >= 0) items.push({ term, body: inner.slice(from, to) }); };
  while (i < inner.length) {
    if (inner.startsWith("\\begin{", i)) { depthHere++; i += 7; continue; }
    if (inner.startsWith("\\end{", i)) { depthHere--; i += 5; continue; }
    if (depthHere === 0 && inner.startsWith("\\item", i) && !/[A-Za-z]/.test(inner[i + 5] ?? "")) {
      push(i);
      let j = i + 5;
      term = undefined;
      const k = j + (inner.slice(j).match(/^\s*/)?.[0].length ?? 0);
      if (inner[k] === "[") { const e = groupEnd(inner, k, "[", "]"); term = inner.slice(k + 1, e - 1); j = e; }
      from = j;
      i = j;
      continue;
    }
    i++;
  }
  push(inner.length);
  const pad = "  ".repeat(depth);
  const marker = env === "enumerate" ? "1." : "-";
  return items.map(({ term: t, body }) => {
    const nested: string[] = [];
    const words = body.replace(/\\begin\{(description|itemize|enumerate)\}[\s\S]*?\\end\{\1\}/g, (m) => {
      // nested lists of the same name are matched whole by environment counting
      nested.push(m);
      return "";
    });
    const head = t !== undefined ? `**${text(t, ctx).trim()}** ` : "";
    const line = `${pad}${marker} ${head}${text(words, ctx).replace(/\s*\n\s*/g, " ").trim()}`;
    return [line, ...nested.map((n) => list(n.trim(), ctx, depth + 1))].join("\n");
  }).join("\n");
}

function table(tex: string, ctx: Ctx): string {
  const env = /^\\begin\{([a-z]+)\}/.exec(tex)![1];
  let inner = innerOf(tex, env);
  inner = inner.replace(/^\s*(\[[^\]]*\])?\s*\{/, "{"); // [h]
  inner = inner.slice(groupEnd(inner, inner.indexOf("{"))); // the column spec
  inner = inner.replace(/\\(toprule|midrule|bottomrule|mrule|endhead|endfirsthead|endfoot|endlastfoot|hline)\b/g, "")
    .replace(/\\cmidrule(\([a-z]*\))?\{[^}]*\}/g, "")
    .replace(/\\(caption)\{[^}]*\}/g, "");
  inner = expandTextAll(inner, ctx.paper);
  const rows = splitTop(inner, "\\\\").map((r) => r.trim()).filter(Boolean)
    .map((r) => splitTop(r, "&").map((cell) => tableCell(cell.trim(), ctx)));
  if (rows.length === 0) return "";
  const width = Math.max(...rows.map((r) => r.length));
  const line = (r: string[]) => `| ${[...r, ...Array(width - r.length).fill("")].join(" | ")} |`;
  return [line(rows[0]), line(Array(width).fill("---")), ...rows.slice(1).map(line)].join("\n");
}

function tableCell(cell: string, ctx: Ctx): string {
  return text(cell, { ...ctx, inTable: true }).replace(/\s*\n\s*/g, " ").trim();
}

/** A control word's name at s[i], for callers outside. */
export const nameAt = (s: string, i: number) => controlAt(s, i).name;
