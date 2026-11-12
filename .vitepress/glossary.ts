// The glossary's entries have addresses, so a lesson links a word where it first uses it
// instead of listing it under a "New words" heading: [*trie*](../glossary.md#trie).
// An entry opens "**Trie, leaf and branch.**": each of its words gets an id (trie, leaf,
// branch), put in front of the entry as it is rendered. tools/urls.test.ts counts the same
// ids, so a link to a word the glossary doesn't have fails the tests.

import type MarkdownIt from "markdown-it";

/** The words an entry's title holds: "Trie, leaf and branch" is trie, leaf and branch. */
export const termWords = (term: string): string[] => term.replace(/\s*\([^)]*\)/g, "").split(/,\s*|\s+and\s+/)
  .map((w) => w.trim().toLowerCase()).filter(Boolean);

/** A word's id in the glossary's address: "State root" is state-root. */
export const termId = (word: string): string => word.toLowerCase().replace(/`/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const ENTRY = /^\*\*(.+?)\.\*\*/gm;

/** Every id the glossary page has for its words. */
export function glossaryIds(markdown: string): string[] {
  return [...markdown.matchAll(ENTRY)].flatMap(([, term]) => termWords(term).map(termId)).filter(Boolean);
}

/** The glossary's text with each entry's ids in front of it; the lines stay where they were. */
export function withTermIds(markdown: string): string {
  const seen = new Set<string>();
  return markdown.replace(ENTRY, (entry, term: string) => {
    const ids = termWords(term).map(termId).filter((id) => id && !seen.has(id));
    for (const id of ids) seen.add(id);
    return ids.map((id) => `<a id="${id}"></a>`).join("") + entry;
  });
}

/** Gives the glossary page its words' ids, before the page is parsed. */
export function glossaryTerms(md: MarkdownIt): void {
  md.core.ruler.before("normalize", "glossary-terms", (state) => {
    if (state.env?.relativePath === "glossary.md") state.src = withTermIds(state.src);
  });
}
