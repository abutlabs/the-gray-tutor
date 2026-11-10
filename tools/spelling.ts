// The spellcheck: every word of the lessons' prose (not their code) must be one the English
// dictionaries know, American or British (the tutorial writes "colour" and "serialization",
// as the Gray Paper does), or one in tools/words.txt, the JAM words they don't know. As
// the Rust Book checks its own text with a dictionary of Rust words.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import en from "dictionary-en";
import gb from "dictionary-en-gb";
import nspell from "nspell";
import { GRAY_PAPER_QUOTE, LESSONS, ROOT } from "./lessons.ts";

/** A word of prose, and the line it's on (from 1). */
export type Word = { word: string; line: number };

/** Blanks out a match but keeps its line breaks, so line numbers stay right. */
const blank = (m: string) => "\n".repeat(m.split("\n").length - 1) || " ";

/**
 * The words of a Markdown page's prose. Not prose: code (blocks, inline, <code>), math
 * ($$ ... $$, $...$), URLs, HTML tags, numbers (0xff, u32), file names and paths
 * (HARDENING.md, …/client/src), and the Gray Paper's superscripts (X^mov).
 */
export function proseWords(markdown: string): Word[] {
  const text = markdown
    .replace(/^---\n[\s\S]*?\n---\n/, blank) // front matter
    .replace(/```[\s\S]*?```/g, blank)
    .replace(GRAY_PAPER_QUOTE, blank) // the Gray Paper's own words, spelled as it spells them
    .replace(/<!--[\s\S]*?-->/g, blank)
    .replace(/<code>[\s\S]*?<\/code>/g, blank)
    .replace(/`[^`]+`/g, blank) // inline code, even when it wraps onto the next line
    .replace(/\$\$[\s\S]*?\$\$/g, blank) // a formula: LaTeX, not English
    .replace(/\$[^$\s][^$\n]*\$/g, blank) // math inside a sentence
    .replace(/\]\([^)\s]*\)/g, "]") // a link's address; its text stays
    .replace(/ \{#[\w-]+\}$/gm, " ") // a heading's own id: an address too
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/<[^>\n]+>/g, " ")
    .replace(/\S*[\/^]\S*/g, " ") // paths, X^mov
    .replace(/\S+\.(md|ts|js|json|ml|txt|html|svg|png)\b/g, " ") // file names
    .replace(/[\w']*\d[\w']*/g, " "); // anything with a digit: 0xff, u32, 2n
  const words: Word[] = [];
  text.split("\n").forEach((line, i) => {
    for (const [token] of line.matchAll(/[A-Za-z][A-Za-z']*/g)) {
      const word = token.replace(/'+$/, "");
      if (word.length < 2) continue; // a, x, φ's letters
      if (/^[A-Z]+('?s)?$/.test(word)) continue; // JAM, PVM's, ALUs: names
      if (/[a-z][A-Z]/.test(word)) continue; // camelCase, VitePress: names, often code
      words.push({ word, line: i + 1 });
    }
  });
  return words;
}

export const WORDS = join(ROOT, "tools", "words.txt");

/** The JAM words: tools/words.txt, one a line, lower case; # starts a comment. */
export function jamWords(): Set<string> {
  const text = readFileSync(WORDS, "utf8");
  return new Set(text.split("\n").map((l) => l.replace(/#.*/, "").trim()).filter(Boolean));
}

/**
 * Whether a word is spelled right: an English word (either side of the Atlantic), or a JAM
 * word, also as a plural or with 's (validators, lasair's), in any case (Validator).
 */
export function speller(): { known: (word: string) => boolean; english: (word: string) => boolean } {
  const us = nspell(en);
  const uk = nspell(gb);
  const jam = jamWords();
  const english = (word: string) => us.correct(word) || uk.correct(word);
  const jamWord = (word: string) => {
    const w = word.toLowerCase();
    return jam.has(w) || (w.endsWith("s") && jam.has(w.slice(0, -1))) || (w.endsWith("es") && jam.has(w.slice(0, -2)));
  };
  const known = (word: string) => {
    const base = word.replace(/'s$/, ""); // the dictionaries know possessives; the JAM list doesn't
    return english(word) || base.length < 2 || english(base) || jamWord(base);
  };
  return { known, english };
}

/** Every misspelling in the lessons, as "file:line word", in file order. */
export function misspellings(files: string[]): string[] {
  const { known } = speller();
  const seen = new Map<string, boolean>();
  const out: string[] = [];
  for (const file of files) {
    for (const { word, line } of proseWords(readFileSync(join(LESSONS, file), "utf8"))) {
      if (!seen.has(word)) seen.set(word, known(word));
      if (!seen.get(word)) out.push(`${file}:${line} ${word}`);
    }
  }
  return out;
}
