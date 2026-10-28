// Concepts only (.vitepress/theme/concepts-link.ts): a link's ?concepts opens a page folded and
// beats the saved choice without changing it; the address says ?concepts while the mode is
// on, so copying it shares the page folded.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runInNewContext } from "node:vm";
import { fromLink, HEAD, KEY, linkFor } from "../.vitepress/theme/concepts-link.ts";
import { ROOT } from "./lessons.ts";

test("a link's choice: ?concepts, =on or =1 is on; =off, =0 or =false is off; none says nothing", () => {
  for (const s of ["?concepts", "?concepts=", "?concepts=on", "?concepts=1", "?a=2&concepts"]) assert.equal(fromLink(s), true, s);
  for (const s of ["?concepts=off", "?concepts=0", "?concepts=false"]) assert.equal(fromLink(s), false, s);
  for (const s of ["", "?", "?a=2", "?conceptsx"]) assert.equal(fromLink(s), null, s);
});

/** Runs the <head> script on a page at `search`, with a saved choice (or storage that throws). */
function head(search: string, saved: string | null | "throws"): { folded: boolean; savedAfter: string | null | "throws" } {
  const classes = new Set<string>();
  let store = saved;
  const sessionStorage = {
    getItem: (k: string) => { if (store === "throws") throw new Error("private window"); return k === KEY ? store : null; },
    setItem: (_k: string, v: string) => { store = v; },
  };
  runInNewContext(HEAD, { URLSearchParams, location: { search }, sessionStorage, document: { documentElement: { classList: { add: (c: string) => classes.add(c) } } } });
  return { folded: classes.has("concepts"), savedAfter: store };
}

test("before the page draws: the link wins, else the saved choice; a link never changes what's saved", () => {
  for (const saved of ["on", "off", null, "throws"] as const) {
    assert.deepEqual(head("?concepts", saved), { folded: true, savedAfter: saved }, `?concepts, saved ${saved}`);
    assert.deepEqual(head("?concepts=off", saved), { folded: false, savedAfter: saved }, `?concepts=off, saved ${saved}`);
    assert.deepEqual(head("", saved), { folded: saved === "on", savedAfter: saved }, `no link, saved ${saved}`);
  }
  // the inline rule and fromLink agree on every spelling
  for (const s of ["?concepts", "?concepts=on", "?concepts=1", "?concepts=off", "?concepts=0", "?concepts=false", "?a=1"]) {
    assert.equal(head(s, "off").folded, fromLink(s) === true, s);
  }
});

test("the address: ?concepts added while on and dropped while off, other parameters and the #anchor kept", () => {
  const page = "https://abutlabs.github.io/the-gray-tutor/03-work-and-reports/03-a-work-report";
  assert.equal(linkFor(page, true), `${page}?concepts`);
  assert.equal(linkFor(`${page}#the-big-picture`, true), `${page}?concepts#the-big-picture`);
  assert.equal(linkFor(`${page}?concepts#the-big-picture`, false), `${page}#the-big-picture`);
  assert.equal(linkFor(`${page}?concepts=off`, false), page);
  assert.equal(linkFor(`${page}?a=1`, true), `${page}?a=1&concepts`);
  assert.equal(linkFor(`${page}?a=1&concepts`, false), `${page}?a=1`);
  assert.equal(linkFor(linkFor(page, true), true), `${page}?concepts`, "once is enough");
  assert.equal(fromLink(new URL(linkFor(page, true)).search), true, "the shared address opens folded");
});

test("the site puts HEAD in every page's <head>", () => {
  const config = readFileSync(join(ROOT, ".vitepress/config.ts"), "utf8");
  assert.match(config, /import \{ HEAD as CONCEPTS_HEAD \} from "\.\/theme\/concepts-link\.ts";/);
  assert.match(config, /\["script", \{\}, CONCEPTS_HEAD\]/);
});
