// The Code switch and the client picker (.vitepress/theme/code-link.ts): code is folded
// unless a link's ?code or the saved choice shows it; an old link's ?concepts still opens a
// page folded; ?client= picks whose code; a link beats the saved choice without changing it;
// and the address says what is on, so copying it shares the page as it is read.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runInNewContext } from "node:vm";
import { CLIENT_CSS, CLIENT_KEY, CLIENTS, clientFromLink, clientLabel, clientOr, DEFAULT_CLIENT, fromLink, HEAD, KEY, linkFor, UNLISTED } from "../.vitepress/theme/code-link.ts";
import { CLIENT_BLOCK, clientBlockEnd } from "../.vitepress/clients.ts";
import { parseLesson, readLessons, ROOT } from "./lessons.ts";

test("a link's choice: ?code, =on or =1 shows the code; =off, =0 or =false folds it; none says nothing", () => {
  for (const s of ["?code", "?code=", "?code=on", "?code=1", "?a=2&code"]) assert.equal(fromLink(s), true, s);
  for (const s of ["?code=off", "?code=0", "?code=false"]) assert.equal(fromLink(s), false, s);
  for (const s of ["", "?", "?a=2", "?codex"]) assert.equal(fromLink(s), null, s);
});

test("an old link still works: ?concepts folds the code, ?concepts=off shows it, and ?code wins", () => {
  for (const s of ["?concepts", "?concepts=on", "?concepts=1"]) assert.equal(fromLink(s), false, s);
  for (const s of ["?concepts=off", "?concepts=0", "?concepts=false"]) assert.equal(fromLink(s), true, s);
  assert.equal(fromLink("?concepts&code"), true);
  assert.equal(fromLink("?concepts=off&code=off"), false);
});

test("the clients: the one the lessons build first; lasair is written but not listed, so nothing can choose it", () => {
  assert.equal(CLIENTS[0].id, DEFAULT_CLIENT);
  assert.equal(new Set(CLIENTS.map((c) => c.id)).size, CLIENTS.length);
  for (const c of CLIENTS) assert.match(c.id, /^[a-z][a-z0-9-]*$/, c.id);
  assert.deepEqual(CLIENTS.map(clientLabel), ["TypeScript"]);
  assert.deepEqual(UNLISTED, ["lasair"]);
  for (const id of ["lasair", "rust", "", null, undefined]) assert.equal(clientOr(id), DEFAULT_CLIENT, String(id));
  assert.equal(clientFromLink("?client=tutor"), "tutor");
  for (const s of ["", "?client", "?client=lasair", "?client=rust", "?code"]) assert.equal(clientFromLink(s), null, s);
});

type Saved = { code: string | null; client: string | null } | "throws";

/** Runs the <head> script on a page at `search`, with saved choices (or storage that throws). */
function head(search: string, saved: Saved): { folded: boolean; other: boolean; client: string | undefined; savedAfter: Saved } {
  const classes = new Set<string>();
  const attrs = new Map<string, string>();
  const store: Saved = saved === "throws" ? "throws" : { ...saved };
  const localStorage = {
    getItem: (k: string) => {
      if (store === "throws") throw new Error("private window");
      return k === KEY ? store.code : k === CLIENT_KEY ? store.client : null;
    },
    setItem: () => { throw new Error("the head script never saves"); },
  };
  const documentElement = { classList: { add: (c: string) => classes.add(c) }, setAttribute: (k: string, v: string) => attrs.set(k, v) };
  runInNewContext(HEAD, { URLSearchParams, location: { search }, localStorage, document: { documentElement } });
  return { folded: classes.has("code-folded"), other: classes.has("other-client"), client: attrs.get("data-client"), savedAfter: store };
}

test("before the page draws: folded unless the link or the saved choice shows the code; a link never changes what's saved", () => {
  const saves: Saved[] = [{ code: "on", client: null }, { code: "off", client: null }, { code: null, client: null }, "throws"];
  for (const saved of saves) {
    const savedOn = saved !== "throws" && saved.code === "on";
    assert.deepEqual(head("?code", saved), { folded: false, other: false, client: "tutor", savedAfter: saved }, `?code, saved ${JSON.stringify(saved)}`);
    assert.deepEqual(head("?code=off", saved), { folded: true, other: false, client: "tutor", savedAfter: saved });
    assert.deepEqual(head("?concepts", saved), { folded: true, other: false, client: "tutor", savedAfter: saved });
    assert.deepEqual(head("", saved), { folded: !savedOn, other: false, client: "tutor", savedAfter: saved }, `no link, saved ${JSON.stringify(saved)}`);
  }
  // the inline rule and fromLink agree on every spelling
  for (const s of ["?code", "?code=on", "?code=1", "?code=off", "?code=0", "?code=false", "?concepts", "?concepts=off", "?concepts&code", "?a=1"]) {
    assert.equal(head(s, { code: "off", client: null }).folded, fromLink(s) !== true, s);
  }
});

test("before the page draws: the client is the lessons' own, whatever a link or an old saved choice names", () => {
  const none: Saved = { code: null, client: null };
  for (const search of ["", "?client=tutor", "?client=lasair", "?code&client=lasair", "?client=rust"]) {
    const page = head(search, none);
    assert.deepEqual([page.other, page.client, page.savedAfter], [false, "tutor", none], search);
  }
  const old: Saved = { code: "on", client: "lasair" }; // saved while lasair was listed
  assert.deepEqual(head("", old), { folded: false, other: false, client: "tutor", savedAfter: old });
  assert.equal(head("?client=lasair", "throws").client, "tutor");
});

test("the address: ?code while the code shows, ?client= while another client is chosen, the rest kept", () => {
  const page = "https://abutlabs.github.io/the-gray-tutor/03-work-and-reports/03-a-work-report";
  assert.equal(linkFor(page, true), `${page}?code`);
  assert.equal(linkFor(page, false), page);
  assert.equal(linkFor(`${page}#the-big-picture`, true), `${page}?code#the-big-picture`);
  assert.equal(linkFor(`${page}?code#the-big-picture`, false), `${page}#the-big-picture`);
  assert.equal(linkFor(`${page}?code=off`, false), page);
  assert.equal(linkFor(`${page}?a=1`, true), `${page}?a=1&code`);
  assert.equal(linkFor(`${page}?a=1&code`, false), `${page}?a=1`);
  assert.equal(linkFor(linkFor(page, true), true), `${page}?code`, "once is enough");
  assert.equal(fromLink(new URL(linkFor(page, true)).search), true, "the shared address opens with its code");
  // the old parameter goes: the address says what is on now
  assert.equal(linkFor(`${page}?concepts`, false), page);
  assert.equal(linkFor(`${page}?concepts=off`, true), `${page}?code`);
  // a second client's choice rides in the address; the default's doesn't
  assert.equal(linkFor(page, true, "rust"), `${page}?code&client=rust`);
  assert.equal(linkFor(`${page}?code&client=rust`, true, "tutor"), `${page}?code`);
});

test("the site puts HEAD and the clients' rules in every page's <head>", () => {
  const config = readFileSync(join(ROOT, ".vitepress/config.ts"), "utf8");
  assert.match(config, /import \{ CLIENT_CSS, HEAD as CODE_HEAD, UNLISTED \} from "\.\/theme\/code-link\.ts";/);
  assert.match(config, /\["script", \{\}, CODE_HEAD\]/);
  assert.match(config, /\["style", \{\}, CLIENT_CSS\]/);
  assert.equal(CLIENT_CSS, "", "one rule per listed client after the first: none yet");
  // an unlisted client's folds and blocks are left out of the built site
  assert.match(config, /if \(!UNLISTED\.includes\("lasair"\)\)/);
  assert.match(readFileSync(join(ROOT, ".vitepress/clients.ts"), "utf8"), /if \(UNLISTED\.includes\(id\)\)/);
});

test("folding is the script's doing: no rule hides code unless <html> has a class the script sets", () => {
  const css = readFileSync(join(ROOT, ".vitepress/theme/custom.css"), "utf8");
  const start = css.indexOf("/* Code off, the default");
  const rules = css.slice(start, css.indexOf("/* The top bar's eight links")).split("\n").filter((l) => /^(html|\.vp-doc)/.test(l));
  assert.ok(start > 0 && rules.length > 8);
  for (const rule of rules) {
    if (rule.startsWith(".vp-doc .client-code")) continue; // another client's block: hidden until chosen
    assert.match(rule, /^html\.(code-folded|other-client) /, rule);
  }
});

test("a ::: client block closes at its own :::, past a container and a fence inside it", () => {
  const lines = ["::: client lasair", "**New file** `lib/a.ml`", "", "```ocaml", ":::", "```", "::: code-group", "```sh [run]", "dune test", "```", ":::", "", ":::", "after"];
  assert.equal(clientBlockEnd(lines, 0), 12);
  assert.equal(clientBlockEnd(["::: client lasair", "never closed"], 0), -1);
  assert.equal(CLIENT_BLOCK.exec("::: client lasair")?.[1], "lasair");
  assert.equal(CLIENT_BLOCK.exec("::: client"), null);
});

test("another client's steps are not ours: a label inside a ::: client block is no step of the lesson", () => {
  const text = [
    "# A lesson", "",
    "**New file** `src/a.ts`", "", "```ts", "export const a = 1;", "```", "",
    "::: client lasair", "**New file** `lib/a.ml`", "", "```ocaml", "let a = 1", "```", "",
    "**Run**", "", "```sh", "dune test", "```", ":::", "",
    "**Run**", "", "```sh", "npm test", "```", "",
  ].join("\n");
  const lesson = parseLesson("0.0", "virtual.md", text);
  assert.deepEqual(lesson.steps.map((s) => (s.kind === "file" ? s.path : s.command)), ["src/a.ts", "npm test"]);
  assert.deepEqual(lesson.steps.map((s) => s.line), [3, 23]);
  // and the real lessons parse as before
  assert.ok(readLessons().length > 100);
});
