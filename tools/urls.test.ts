import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, posix } from "node:path";
import { LESSONS } from "./lessons.ts";
import { snippetNumbers } from "./snapshots.ts";
import { LEGEND, MOVED, PUBLISHED, movedTo } from "../.vitepress/urls.ts";

/** A page's address: its path under lessons/ without ".md", an index by its folder. */
function address(file: string): string {
  return file.replace(/(^|\/)index\.md$/, "$1").replace(/\.md$/, "");
}

const files = readdirSync(LESSONS, { recursive: true }).map(String).filter((f) => f.endsWith(".md"));
const pages = new Map(files.map((f) => [address(f), f]));

test("every published address still works: its page, or a page that moved", () => {
  for (const a of PUBLISHED) {
    assert.ok(pages.has(a) || a in MOVED, `"${a}" was published: keep it, or add it to MOVED (.vitepress/urls.ts)`);
  }
});

test("every page is in the published list", () => {
  for (const a of pages.keys()) assert.ok(PUBLISHED.includes(a), `add "${a}" to PUBLISHED (.vitepress/urls.ts)`);
});

test("a moved page's old address is free, and its new one is a page", () => {
  for (const [from, to] of Object.entries(MOVED)) {
    assert.ok(!pages.has(from), `"${from}" is a page again: take it out of MOVED`);
    assert.ok(pages.has(to), `"${from}" moved to "${to}", which isn't a page`);
  }
});

test("the dev server sends a moved address on too, with or without .html, under any base", () => {
  for (const [from, to] of Object.entries(MOVED)) {
    assert.equal(movedTo(`/${from}`, "/"), `/${to}`);
    assert.equal(movedTo(`/${from}.html?x=1`, "/"), `/${to}`);
    assert.equal(movedTo(`/the-gray-tutor/${from}`, "/the-gray-tutor/"), `/the-gray-tutor/${to}`);
  }
  assert.equal(movedTo("/00-start/06-how-a-block-is-imported", "/"), null, "a page that exists is served");
});

// The ids VitePress gives headings: @mdit-vue/shared's slugify (bundled in VitePress), with
// -1, -2, ... for a repeat, or the id a heading names itself ("### ℰₗ {#encode-fixed}").
// An <a id="..."> keeps a renamed heading's old id working.
function slugify(text: string): string {
  return text.normalize("NFKD").replace(/[\u0300-\u036F]/g, "").replace(/[\u0000-\u001f]/g, "")
    .replace(/[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'“”‘’<>,.?/]+/g, "-").replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "").replace(/^(\d)/, "_$1").toLowerCase();
}

function anchors(file: string): Set<string> {
  const text = readFileSync(join(LESSONS, file), "utf8").replace(/```[\s\S]*?```/g, "");
  const ids = new Set<string>();
  for (const [, heading] of text.matchAll(/^#{1,6} (.+)$/gm)) {
    const own = / \{#([^}]+)\}$/.exec(heading);
    if (own) {
      ids.add(own[1]);
      continue;
    }
    const plain = heading.replace(/`([^`]*)`/g, "$1").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/\*/g, "");
    let id = slugify(plain);
    for (let n = 1; ids.has(id); n++) id = `${slugify(plain)}-${n}`;
    ids.add(id);
  }
  for (const [, id] of text.matchAll(/<a id="([^"]+)"/g)) ids.add(id);
  for (const [key, n] of numbers) if (key.startsWith(`${file}:`)) ids.add(`snippet-${n}`); // #snippet-2
  return ids;
}

const numbers = snippetNumbers();

test("a file snippet has an anchor: #snippet-1 is a lesson's first", () => {
  assert.ok(anchors("02-codec/03-writer-and-reader.md").has("snippet-1"));
  assert.ok(!anchors("00-start/01-what-you-will-build.md").has("snippet-1")); // no snippets there
});

test("every link to a section lands on a heading or a snippet", () => {
  const links: [string, string][] = [["(.vitepress/config.ts)", LEGEND]];
  for (const f of files) {
    const text = readFileSync(join(LESSONS, f), "utf8").replace(/```[\s\S]*?```/g, "");
    for (const [, target] of text.matchAll(/\]\(([^)\s]*#[^)\s]+)\)/g)) {
      if (!/^https?:/.test(target)) links.push([f, target]);
    }
  }
  for (const [from, target] of links) {
    const [path, id] = target.split("#");
    const file = path === "" ? from : path.startsWith("/") ? path.slice(1) : posix.join(dirname(from), path);
    assert.ok(pages.has(address(file)), `${from}: ${target} names no page`);
    assert.ok(anchors(file).has(id), `${from}: ${target}: ${file} has no heading or snippet with the id "${id}"`);
  }
});
