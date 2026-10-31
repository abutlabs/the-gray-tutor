// One run, one widget (#87). In a lesson's source a run of a bin is four separate things: the
// three-tab group of what flows through it (WRITING.md), then the Run block, then its Output.
// They are kept apart there because tools/verify.ts runs the Run block and checks its Output,
// and tools/bin-io.test.ts checks the tabs against both. On the page they are one run, so this
// pass moves the Run's commands and its Output into the group as two more tabs:
//
//   run in client/ · what goes in · what it computes · what comes out · output
//
// framed and titled with the script it runs, so a reader sees one thing. A scoreboard group
// (what goes in, console) takes its Run the same way. Every tab's block also carries its title
// (data-tab), so the one-page print and the e-book, which show every tab at once, can caption
// each. tools/run-views.test.ts renders a group through it.

import type MarkdownIt from "markdown-it";
import type { Token } from "markdown-it";

const TITLE = /\[([^\]]+)\]/;
const RUN = /^\*\*Run(, expect it to fail)?\*\*$/;
/** Scripts that aren't the run's program: the title names the bin, not these. */
const NOT_THE_PROGRAM = new Set(["test", "typecheck", "compare", "catch-up", "verify", "site", "check"]);

export function runViews(md: MarkdownIt): void {
  md.core.ruler.push("run-views", (state) => {
    const t = state.tokens;
    const ids = new Set<string>(); // each widget's anchor, unique on the page
    for (let i = 0; i < t.length; i++) {
      if (t[i].type !== "container_code-group_open") continue;
      const close = t.findIndex((x, k) => k > i && x.type === "container_code-group_close");
      if (close < 0) break;
      const explains = t.slice(i + 1, close).some((x) => x.type === "fence" && x.info.includes("[what goes in]"));
      const at = explains ? runAfter(t, close) : -1;
      if (at < 0) {
        i = close;
        continue;
      }
      // the Run: its label paragraph, its sh block, maybe the Output label snippetLabels put in,
      // and the Output block
      const fails = RUN.exec(t[at + 1].content)![1] !== undefined;
      const run = t[at + 3];
      let end = at + 4;
      let output: Token | undefined;
      if (t[end]?.type === "html_block" && t[end].content.includes("snippet-label output")) end++;
      if (t[end]?.type === "fence" && t[end].info.trim() === "text") output = t[end++];
      run.info = `${run.info.trim()} [${fails ? "run, expect it to fail" : "run in client/"}]`;
      if (output) output.info = `${output.info.trim()} [output]`;
      t.splice(at, end - at); // after the group, so i and close don't move
      if (output) t.splice(close, 0, output);
      t.splice(i + 1, 0, run); // the command first: it is the tab a reader starts on
      const shut = close + (output ? 2 : 1) + 1; // just after the group's close
      t.splice(shut, 0, html(state, "</div>\n"));
      const script = scriptOf(run.content);
      const title = script ? `One run of <code>npm run ${script}</code>` : "One run";
      // a link straight to it, #run-verdicts-progress, for a bookmark or a talk's notes
      let id = `run-${script ?? "1"}`;
      for (let n = 2; ids.has(id); n++) id = `run-${script ?? ""}-${n}`;
      ids.add(id);
      const anchor = `<a class="run-widget-anchor" href="#${id}" aria-label="A link to this run">#</a>`;
      t.splice(i, 0, html(state, `<div class="run-widget" id="${id}">\n<p class="run-widget-title">▶ ${title} ${anchor}</p>\n`));
      i = shut + 1;
    }
    // every tab's block knows its title, for the print page and the e-book
    let inGroup = false;
    for (const token of t) {
      if (token.type === "container_code-group_open") inGroup = true;
      else if (token.type === "container_code-group_close") inGroup = false;
      else if (inGroup && token.type === "fence") {
        const title = TITLE.exec(token.info)?.[1];
        if (title) token.meta = { ...token.meta, tab: title };
      }
    }
  });

  const fence = md.renderer.rules.fence!;
  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const out = fence(tokens, idx, options, env, self);
    const tab: string | undefined = tokens[idx].meta?.tab;
    return tab ? out.replace(/^<div /, `<div data-tab="${md.utils.escapeHtml(tab)}" `) : out;
  };
}

/** The Run a group explains: the first Run label after it, before any heading, code or other group. */
function runAfter(t: Token[], close: number): number {
  for (let k = close + 1; k + 3 < t.length; k++) {
    const x = t[k];
    if (x.type === "heading_open" || x.type === "fence" || x.type.startsWith("container_")) return -1;
    if (x.type === "paragraph_open" && t[k + 1].type === "inline" && RUN.test(t[k + 1].content)
      && t[k + 2].type === "paragraph_close" && t[k + 3].type === "fence") return k;
  }
  return -1;
}

/** The bin's script a Run block runs: its last `npm run` that isn't a test or a tool. */
function scriptOf(commands: string): string | undefined {
  return [...commands.matchAll(/^npm run ([\w-]+)/gm)].map((m) => m[1]).filter((s) => !NOT_THE_PROGRAM.has(s)).at(-1);
}

function html(state: { Token: new (type: string, tag: string, nesting: 0 | 1 | -1) => Token }, content: string): Token {
  const token = new state.Token("html_block", "", 0);
  token.content = content;
  return token;
}
