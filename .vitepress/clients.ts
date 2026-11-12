// More than one client (theme/code-link.ts lists them). The lessons build one, in TypeScript:
// its snippets are the plain labelled blocks, which tools/tangle.ts assembles and
// tools/verify.ts runs. Another client's code for the same step goes in a block of its own,
// right after ours:
//
//   ::: client lasair
//   **New file** `lib/trie.ml`
//
//   ```ocaml
//   ...
//   ```
//   :::
//
// The site shows the block only while the header's picker is on that client and the code is
// on, and folds ours to its labels then (theme/code.ts). tools/lessons.ts leaves the block's
// labels out of our client's steps, so tangle and verify never run them. A block may hold
// other `:::` containers (a code group), which close before it does. lasair's older folds,
// <details><summary>lasair: …, count as its blocks too (config.ts marks them).

import type MarkdownIt from "markdown-it";
import { CLIENTS, DEFAULT_CLIENT, UNLISTED } from "./theme/code-link.ts";

/** The line that opens a client's block, and the client it names. */
export const CLIENT_BLOCK = /^::: client ([\w-]+)\s*$/;

/** Where the block that opens on line `start` closes: the line of its own `:::`, past any
 *  container opened inside it and any fence; -1 if it never closes. */
export function clientBlockEnd(lines: string[], start: number): number {
  let depth = 0;
  let fence: string | null = null;
  for (let n = start + 1; n < lines.length; n++) {
    const line = lines[n].trimEnd();
    if (fence) {
      if (line.trim() === fence) fence = null;
      continue;
    }
    const open = /^\s*(`{3,}|~{3,})/.exec(line);
    if (open) { fence = open[1]; continue; }
    if (/^:::+\s*\S/.test(line)) depth++;
    else if (/^:::+$/.test(line)) {
      if (depth === 0) return n;
      depth--;
    }
  }
  return -1;
}

/** A `::: client <id>` block as a box the picker shows and hides. The Markdown inside is the
 *  lesson's own, rendered in place. */
export function clientBlocks(md: MarkdownIt): void {
  md.block.ruler.before("fence", "client-block", (state, startLine, endLine, silent) => {
    const line = (n: number) => state.src.slice(state.bMarks[n] + state.tShift[n], state.eMarks[n]);
    const m = CLIENT_BLOCK.exec(line(startLine));
    if (!m) return false;
    const lines: string[] = [];
    for (let n = 0; n < endLine; n++) lines.push(n < startLine ? "" : line(n));
    const end = clientBlockEnd(lines, startLine);
    if (end < 0) return false;
    if (silent) return true;
    const id = m[1];
    if (UNLISTED.includes(id)) { // not ready to show: the site is built without it
      state.line = end + 1;
      return true;
    }
    if (id === DEFAULT_CLIENT || !CLIENTS.some((c) => c.id === id)) {
      throw new Error(`${state.env?.relativePath ?? "a lesson"}:${startLine + 1}: "::: client ${id}" names no other client (theme/code-link.ts lists them)`);
    }
    const open = state.push("html_block", "", 0);
    open.content = `<div class="client-code" data-client="${id}">\n`;
    open.map = [startLine, startLine + 1];
    const [parent, max] = [state.parentType, state.lineMax];
    state.parentType = "blockquote";
    state.lineMax = end;
    state.md.block.tokenize(state, startLine + 1, end);
    state.parentType = parent;
    state.lineMax = max;
    const close = state.push("html_block", "", 0);
    close.content = "</div>\n";
    state.line = end + 1;
    return true;
  }, { alt: ["paragraph", "reference", "blockquote", "list"] });
}
