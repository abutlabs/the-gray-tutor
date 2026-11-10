// What the Gray Paper's symbols and hard words mean, in plain words: the key under every
// formula the tutorial quotes (gray-paper-text.ts), the hover on the site and the pop-up
// note on an e-reader. A symbol is looked up by the paper's own macro for it (\authpool is
// α, the authorizer pools), so a letter can mean two things in two places, as it does in
// the paper; a plain LaTeX command (\forall, \in) by its name.
//
// The entries live in tools/glosses/, one file for each part of the paper, holding the
// symbols that part uses first (s08.ts: §8's). terms.ts holds the prose words.

import { S03 } from "./glosses/s03.ts";
import { S04 } from "./glosses/s04.ts";
import { S05 } from "./glosses/s05.ts";
import { S06 } from "./glosses/s06.ts";
import { S07 } from "./glosses/s07.ts";
import { S08 } from "./glosses/s08.ts";
import { S09 } from "./glosses/s09.ts";
import { S10 } from "./glosses/s10.ts";
import { S11 } from "./glosses/s11.ts";
import { S12 } from "./glosses/s12.ts";
import { S13 } from "./glosses/s13.ts";
import { S14 } from "./glosses/s14.ts";
import { S15 } from "./glosses/s15.ts";
import { SA } from "./glosses/sA.ts";
import { SB } from "./glosses/sB.ts";
import { SC } from "./glosses/sC.ts";
import { SD } from "./glosses/sD.ts";
import { SE } from "./glosses/sE.ts";
import { SF } from "./glosses/sF.ts";
import { SH } from "./glosses/sH.ts";
import { TERMS as TERM_LIST } from "./glosses/terms.ts";

/** A symbol in plain words. */
export interface Gloss {
  /** how to read it aloud: "alpha", "E sub G" */
  say: string;
  /** what it is, in a line a reader new to the paper can follow; Markdown, $math$ allowed */
  means: string;
  /** its entry on the symbols page, where it has one: "concat" for symbols.md#concat */
  entry?: string;
}

/** Each symbol's gloss by its macro or command name, no backslash; "skip" for typography a
 *  key needn't explain (\qquad, \text, the brackets of \left and \right). */
export type Glosses = Record<string, Gloss | "skip">;

/** A word of the paper's prose, explained where a page first quotes it. */
export interface Term {
  /** the words as the paper writes them, matched whole */
  term: string;
  means: string;
}

export const GLOSSES: Glosses = {
  ...S03, ...S04, ...S05, ...S06, ...S07, ...S08, ...S09, ...S10, ...S11, ...S12, ...S13, ...S14, ...S15,
  ...SA, ...SB, ...SC, ...SD, ...SE, ...SF, ...SH,
};

export const TERMS: Term[] = TERM_LIST;
