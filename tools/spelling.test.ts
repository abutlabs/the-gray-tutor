import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { LESSONS } from "./lessons.ts";
import { jamWords, misspellings, proseWords, speller, WORDS } from "./spelling.ts";

const files = readdirSync(LESSONS, { recursive: true }).map(String).filter((f) => f.endsWith(".md")).sort();

test("prose only: no code, URLs, numbers, paths or names, and the line numbers kept", () => {
  const page = [
    "The wrods here.", // a typo: line 1
    "```ts",
    "const notprose = 1;",
    "```",
    "Some `inlinecode`, <code>htmlcode</code>, https://example.org/xyzzy and 0xff.",
    "A path …/client/src, a file HARDENING.md, X^mov, the PVM's JAM, VitePress.",
    "[linktext](./qwerty.md) and ![alttext](./img.png)",
    "$$",
    "x \\mapsto \\text{otherwize}",
    "$$",
    "Math $\\lfloor x \\rfloor$ inline, and a lone $ sign.",
    "### A heading {#qwertyid}",
  ].join("\n");
  const words = proseWords(page).map((w) => `${w.line}:${w.word}`);
  assert.deepEqual(words, [
    "1:The", "1:wrods", "1:here", "5:Some", "5:and", "6:path", "6:file", "6:the",
    "7:linktext", "7:and", "7:alttext", "11:Math", "11:inline", "11:and", "11:lone", "11:sign",
    "12:heading",
  ]);
});

test("a word is known in either English, or as a JAM word, its plural or its 's", () => {
  const { known } = speller();
  for (const w of ["colour", "color", "serialization", "validators", "Validator", "lasair's", "trie's"]) {
    assert.ok(known(w), w);
  }
  for (const w of ["wrods", "valdiator", "preimgae"]) assert.ok(!known(w), w);
});

test("every word of the lessons' prose is spelled right (or add a JAM word to tools/words.txt)", () => {
  assert.deepEqual(misspellings(files), []);
});

// A word the lessons stopped using is housekeeping, not a broken site: it warns (and, on
// GitHub, annotates its line in tools/words.txt) rather than failing the build and the deploy.
test("every word in tools/words.txt is needed: no dictionary knows it, and a lesson uses it", (t) => {
  const { english } = speller();
  const used = new Set<string>();
  for (const f of files) {
    for (const { word } of proseWords(readFileSync(join(LESSONS, f), "utf8"))) {
      used.add(word.toLowerCase().replace(/'s$/, ""));
    }
  }
  const list = readFileSync(WORDS, "utf8").split("\n");
  for (const w of jamWords()) {
    const why = english(w) ? "the dictionaries know it"
      : used.has(w) || used.has(`${w}s`) || used.has(`${w}es`) ? undefined
      : "no lesson uses it";
    if (!why) continue;
    const message = `${w}: ${why}, so tools/words.txt needn't list it`;
    t.diagnostic(`warning: ${message}`);
    if (process.env.GITHUB_ACTIONS) {
      console.log(`::warning file=tools/words.txt,line=${list.indexOf(w) + 1}::${message}`);
    }
  }
});
