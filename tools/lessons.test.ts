import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { LESSONS, ROOT, clientPackages, lessonsThrough, readParts } from "./lessons.ts";

const parts = readParts();
const home = readFileSync(join(LESSONS, "index.md"), "utf8");

test("every lesson parses, with a title and a number", () => {
  assert.ok(parts.length > 0);
  for (const p of parts) for (const l of p.lessons) assert.match(l.id, /^\d+\.\d+$/, l.file);
});

test("the home page and each part's page link every lesson, titled as the lesson is", () => {
  for (const p of parts) {
    const index = readFileSync(join(LESSONS, p.dir, "index.md"), "utf8");
    assert.ok(home.includes(`](./${p.dir}/index.md)`), `the home page links ${p.dir}`);
    for (const l of p.lessons) {
      const name = l.file.slice(p.dir.length + 1);
      assert.ok(home.includes(`[${l.id} ${l.title}](./${l.file})`), `the home page links ${l.id} ${l.title}`);
      assert.ok(index.includes(`[${l.id} ${l.title}](./${name})`), `${p.dir}/index.md links ${l.id} ${l.title}`);
    }
  }
});

// A part's page says what it builds on, so a reader starting there knows what to read
// first: the earlier parts whose files its code imports, besides Parts 0 to 2, which every
// part uses. And how to start there, as the Rust Book's introduction lets you skip: catch up
// to the last lesson before it.
test("each part's page says what it builds on and how to start there", () => {
  // what the client's code exports ("src/work.ts WorkReport"), and the part that added it:
  // a later part may add to a file an earlier one made, so names count, not files; and a
  // test helper (test/vectors.ts's vectorFiles) is plumbing, not something to read first
  const addedIn = new Map<string, number>();
  const problems: string[] = [];
  const exported = /^export (?:async )?(?:const|let|function|type|interface|class) (\w+)/gm;
  const imported = /^import (?:type )?\{([^}]*)\} from "(\.{1,2}\/[^"]+)"/gm;
  for (const [i, p] of parts.entries()) {
    const used = new Set<number>();
    for (const l of p.lessons) {
      for (const s of l.steps) {
        if (s.kind !== "file") continue;
        for (const [, name] of s.code.matchAll(exported)) {
          if (!addedIn.has(`${s.path} ${name}`)) addedIn.set(`${s.path} ${name}`, p.number);
        }
        for (const [, names, from] of s.code.matchAll(imported)) {
          const file = join(dirname(s.path), from);
          if (!file.startsWith("src/")) continue;
          for (const name of names.split(",").map((n) => n.trim().replace(/^type /, "").split(/\s+as\s+/)[0])) {
            const part = name ? addedIn.get(`${file} ${name}`) : undefined;
            if (part !== undefined && part > 2 && part !== p.number) used.add(part);
          }
        }
      }
    }
    const index = readFileSync(join(LESSONS, p.dir, "index.md"), "utf8");
    if (i > 0) {
      const before = parts[i - 1].lessons.at(-1)!.id;
      if (!index.includes(`\`npm run catch-up -- ${before}\``)) problems.push(`${p.dir}: start at ${before}`);
    }
    if (p.number < 3) continue;
    const buildsOn = /^\*\*Builds on\*\*[\s\S]*?\n\n/m.exec(index)?.[0] ?? "";
    if (!buildsOn) problems.push(`${p.dir}: no "**Builds on**" paragraph`);
    const linked = [...buildsOn.matchAll(/\[([^\]]+)\]\(\.\.\/(\d+-[^/)]+)\/index\.md\)/g)]
      .map(([, text, dir]) => `${dir}: ${text.replace(/\s+/g, " ")}`);
    const expected = parts.filter((q) => used.has(q.number)).map((q) => `${q.dir}: ${q.title}`);
    for (const x of expected) if (!linked.includes(x)) problems.push(`${p.dir} builds on ${x}, unsaid`);
    for (const x of linked) if (!expected.includes(x)) problems.push(`${p.dir} says it builds on ${x}, but doesn't`);
    if (linked.join() !== expected.filter((x) => linked.includes(x)).join()) problems.push(`${p.dir}: parts out of order`);
  }
  assert.deepEqual(problems, []);
});

test("each lesson ends by pointing to the next one", () => {
  const all = parts.flatMap((p) => p.lessons);
  for (const [i, l] of all.slice(0, -1).entries()) {
    const text = readFileSync(join(LESSONS, l.file), "utf8");
    const next = all[i + 1];
    const target = next.file.split("/")[0] === l.file.split("/")[0] ? `./${next.file.split("/")[1]}` : `../${next.file.split("/")[0]}/index.md`;
    assert.ok(text.includes(`](${target})`), `${l.file} links the next lesson (${target})`);
  }
});

test("TypeScript snippet lines fit half a laptop screen: 100 characters, imports aside", () => {
  const long: string[] = [];
  for (const p of parts) for (const l of p.lessons) for (const s of l.steps) {
    if (s.kind !== "file" || !s.path.endsWith(".ts")) continue;
    s.code.split("\n").forEach((line, i) => {
      if (line.length > 100 && !line.startsWith("import ")) long.push(`${l.id} ${s.path} line ${i + 1}`);
    });
  }
  assert.deepEqual(long, []);
});

test("visual tutorial verification: every picture exists, is used, has alt text, fits", () => {
  const files = readdirSync(LESSONS, { recursive: true }).map(String);
  const shown = new Set<string>();
  for (const md of files.filter((f) => f.endsWith(".md"))) {
    const text = readFileSync(join(LESSONS, md), "utf8");
    for (const [, alt, src] of text.matchAll(/!\[([^\]]*)\]\(([^)\s]+)\)/g)) {
      const path = join(LESSONS, dirname(md), src);
      const where = `${md}: ${src}`;
      assert.ok(alt.trim(), `${where} has alt text`);
      assert.match(src, /^\.\/images\/[^/]+$/, `${where} is in its part's images/ folder`);
      assert.equal(basename(src).slice(0, 2), basename(md).slice(0, 2), `${where} is named for its lesson`);
      assert.ok(existsSync(path), `${where} exists`);
      assert.ok(statSync(path).size < 1_000_000, `${where} is under 1 MB`);
      shown.add(path);
    }
  }
  // public/ is the website's own files (the logo), served as they are, not a lesson's pictures
  for (const f of files.filter((f) => /\.(png|jpe?g|gif|webp|svg)$/i.test(f) && !f.startsWith("public/"))) {
    assert.ok(shown.has(join(LESSONS, f)), `lessons/${f} is shown by a lesson`);
  }
});

// zsh, macOS's shell, doesn't read # as a comment unless told to: a pasted
// `npm install   # the tools` asks npm for packages named "#", "the" and "tools".
// A comment gets a line of its own (the website leaves those out when copying).
test("commands paste safely: no shell line has a comment after its command", () => {
  const docs = readdirSync(LESSONS, { recursive: true }).map(String).filter((f) => f.endsWith(".md"))
    .map((f) => join(LESSONS, f)).concat(["README.md", "WRITING.md", "HARDENING.md"].map((f) => join(ROOT, f)));
  const bad: string[] = [];
  for (const doc of docs) {
    let shell: boolean | undefined;
    for (const [i, line] of readFileSync(doc, "utf8").split("\n").entries()) {
      const fence = /^\s*```(\w*)/.exec(line);
      if (fence) shell = shell === undefined ? /^(sh|bash|zsh|shell)$/.test(fence[1]) : undefined;
      else if (shell && /^\s*[^#\s].*\s#/.test(line)) bad.push(`${doc.slice(ROOT.length)}:${i + 1}: ${line.trim()}`);
    }
  }
  assert.deepEqual(bad, []);
});

// Prose only: no code blocks, inline code, links, headings or HTML tags.
function prose(text: string): string {
  return text.replace(/```[\s\S]*?```|`[^`\n]*`|!?\[[^\]]*\]\([^)]*\)|^#.*$|<[^>\n]+>/gm, " ");
}
const pages = readdirSync(LESSONS, { recursive: true }).map(String).filter((f) => f.endsWith(".md"));
const HARDENING = "https://github.com/abutlabs/the-gray-tutor/blob/main/HARDENING.md";
const lessonAt = new Map(parts.flatMap((p) => p.lessons).map((l) => [l.file, l.id]));

// As the Rust Book links every cross-reference: a reader can always follow one.
test("every mention of another lesson is a link to it", () => {
  const ids = new Set(lessonAt.values());
  const plain: string[] = [];
  for (const md of pages) {
    const text = prose(readFileSync(join(LESSONS, md), "utf8"));
    for (const [mention, id] of text.matchAll(/\b[Ll]essons?\s+(\d+\.\d+)/g)) {
      if (ids.has(id) && lessonAt.get(md) !== id) plain.push(`${md}: ${mention}`);
    }
  }
  assert.deepEqual(plain, []);
});

// And every part: "Part 8" links to Part 8's page, wherever it's mentioned.
test("every mention of a part is a link to its page", () => {
  const numbers = new Set(parts.map((p) => p.number));
  const plain: string[] = [];
  for (const md of pages) {
    const text = prose(readFileSync(join(LESSONS, md), "utf8"));
    for (const [mention, n] of text.matchAll(/\bParts?\s+(\d+)/g)) {
      if (numbers.has(Number(n))) plain.push(`${md}: ${mention}`);
    }
  }
  assert.deepEqual(plain, []);
});

// "The next lesson" links to it, and "the hardening pass" to HARDENING.md, where the
// shortcuts are listed: a reader can follow either.
test("the next lesson and the hardening pass are links, to the right place", () => {
  const all = parts.flatMap((p) => p.lessons);
  const problems: string[] = [];
  for (const md of pages) {
    const text = readFileSync(join(LESSONS, md), "utf8");
    for (const [plain] of prose(text).matchAll(/\b(next\s+lesson|hardening\s+pass)\b/gi)) problems.push(`${md}: ${plain}`);
    const at = all.findIndex((l) => l.file === md);
    for (const [, words, href] of text.matchAll(/\[([^\]]*\b(?:next\s+lesson|hardening\s+pass)\b[^\]]*)\]\(([^)]*)\)/gi)) {
      const want = /hardening/i.test(words) ? HARDENING : all[at + 1]?.file;
      const got = /^https:/.test(href) ? href : join(dirname(md), href);
      if (got !== want) problems.push(`${md}: [${words}] goes to ${href}`);
    }
  }
  assert.deepEqual(problems, []);
});

// New words and the glossary agree: every word a lesson's New words brings in has a
// glossary entry, and every glossary word is brought in by some lesson's New words, at or
// before the lesson its entry links (the one that builds it). An entry may join words
// ("Trie, leaf and branch"); each word counts on its own.
const wordsOf = (term: string) => term.replace(/\s*\([^)]*\)/g, "").split(/,\s*|\s+and\s+/)
  .map((w) => w.trim().toLowerCase()).filter(Boolean);
const newWords = (text: string) => [...(/^## New words\n([\s\S]*?)(?=^## )/m.exec(text)?.[1] ?? "")
  .matchAll(/^- \*\*(.+?)\.\*\*/gm)].flatMap(([, term]) => wordsOf(term));

test("every new word is in the glossary, and every glossary word is brought in by a lesson", () => {
  const order = parts.flatMap((p) => p.lessons).map((l) => l.file);
  const broughtIn = new Map<string, number>(); // a word, and the first lesson to list it
  for (const [i, file] of order.entries()) {
    for (const w of newWords(readFileSync(join(LESSONS, file), "utf8"))) if (!broughtIn.has(w)) broughtIn.set(w, i);
  }
  const glossary = new Map<string, number>(); // a word, and the lesson its entry links
  for (const entry of readFileSync(join(LESSONS, "glossary.md"), "utf8").split(/\n\s*\n/)) {
    const term = /^\*\*(.+?)\.\*\*/.exec(entry)?.[1];
    const lesson = /\(\[\d+\.\d+\]\(\.\/([^)]+)\)\)\s*$/.exec(entry)?.[1];
    if (term) for (const w of wordsOf(term)) glossary.set(w, lesson ? order.indexOf(lesson) : -1);
  }
  const problems: string[] = [];
  for (const file of order) {
    for (const w of newWords(readFileSync(join(LESSONS, file), "utf8"))) {
      if (!glossary.has(w)) problems.push(`${file}: "${w}" isn't in the glossary`);
    }
  }
  for (const [w, at] of glossary) {
    if (at < 0) continue; // an entry that links no one lesson
    const from = broughtIn.get(w);
    if (from === undefined || from > at) problems.push(`glossary "${w}" (${order[at]}): no New words up to there`);
  }
  assert.deepEqual(problems, []);
});

// Where the body first uses a new word, it's in italics (WRITING.md), so the reader can
// match it to its definition. Bold is for labels, not words; a bold sentence, a step's
// title ("**Unlock, again and again.**"), is a label, and the word in it isn't flagged.
test("a new word is not bold where the body first uses it", () => {
  const bold: string[] = [];
  for (const l of parts.flatMap((p) => p.lessons)) {
    const text = readFileSync(join(LESSONS, l.file), "utf8");
    const body = prose(text.replace(/^## New words\n[\s\S]*?(?=^## )/m, (m) => m.replace(/[^\n]/g, " ")));
    for (const w of newWords(text).filter((w) => !w.startsWith("`"))) {
      const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const first = new RegExp(`(?<![\\w-])${escaped}(?:s|es)?(?![\\w-])`, "i").exec(body);
      if (!first || body.slice(first.index - 2, first.index) !== "**") continue;
      const title = body.slice(first.index, body.indexOf("**", first.index)).trimEnd().endsWith(".");
      if (!title) bold.push(`${l.file}: **${first[0]}**`);
    }
  }
  assert.deepEqual(bold, []);
});

// The code font means "exactly this code", and `bigint`s isn't code (the Book's style guide).
test("no word is half code: two `bigint` values, not two `bigint`s", () => {
  const mixed: string[] = [];
  for (const md of pages) {
    const text = readFileSync(join(LESSONS, md), "utf8").replace(/```[\s\S]*?```/g, " ");
    for (const [word] of text.matchAll(/`[^`\n]+`(?:s|es|ed|ing)\b/g)) mixed.push(`${md}: ${word}`);
  }
  assert.deepEqual(mixed, []);
});

// A practice goes by its common name, test-driven development (WRITING.md). "Write the test
// first" says what to do, and stays; "test first" or "test-first" as the practice's name goes.
test("test-driven development is called that, never test-first", () => {
  const named: string[] = [];
  for (const md of pages) {
    const text = readFileSync(join(LESSONS, md), "utf8");
    for (const [phrase] of text.matchAll(/(?<!\bthe\s+)\btest[-\s]+first\b/gi)) named.push(`${md}: ${phrase}`);
  }
  assert.deepEqual(named, []);
});

// A test that fails because what it imports isn't written yet proves only that a file is
// missing, so no lesson shows one (WRITING.md, "A missing import is never the red").
test("no lesson shows a missing import's red", () => {
  const shown: string[] = [];
  for (const md of pages) {
    const text = readFileSync(join(LESSONS, md), "utf8");
    const red = /^(?:Error \[ERR_MODULE_NOT_FOUND\]|SyntaxError: The requested module)/gm;
    for (const _ of text.matchAll(red)) shown.push(md);
  }
  assert.deepEqual(shown, []);
});

// The Book closes a chapter with what you learned, then why the next one comes next.
test("every lesson closes with What you have", () => {
  for (const file of lessonAt.keys()) {
    const sections = [...readFileSync(join(LESSONS, file), "utf8").replace(/```[\s\S]*?```/g, "")
      .matchAll(/^## (.+)$/gm)].map((m) => m[1]);
    assert.equal(sections.at(-1), "What you have", `${file} closes with "## What you have"`);
  }
});

// Readers work on flights (offline.md): npm run offline caches every package the lessons
// add to the client, read from their package.json steps, so each must have one version.
test("npm run offline knows every package a lesson adds, each at one version", () => {
  const packages = clientPackages(); // throws on two versions of one package
  const setup = parts[0].lessons.find((l) => l.id === "0.2")!;
  const atSetup = setup.steps.find((s) => s.kind === "file" && s.path === "package.json");
  assert.ok(atSetup?.kind === "file", "0.2 writes client/package.json");
  for (const [name, version] of Object.entries<string>(JSON.parse(atSetup.code).devDependencies)) {
    assert.equal(packages[name], version, `${name} from 0.2`);
  }
  assert.ok(Object.keys(packages).length > Object.keys(JSON.parse(atSetup.code).devDependencies).length,
    "later lessons add packages too");
});

// A formula is only as clear as its symbols (WRITING.md, Formulas): a What the Gray Paper
// says with a formula in it has a key, a table whose every symbol links to its entry on
// the symbols page. (tools/urls.test.ts checks each link lands on an entry.)
test("every Gray Paper formula has a key, its symbols linked to symbols.md", () => {
  const KEY = "| Symbol | Say it | Here |";
  const problems: string[] = [];
  for (const file of lessonAt.keys()) {
    const text = readFileSync(join(LESSONS, file), "utf8").replace(/```[\s\S]*?```/g, "");
    const section = /^## What the Gray Paper says\n([\s\S]*?)(?=^## )/m.exec(text)?.[1] ?? "";
    if (!section.includes("$$")) continue;
    const lines = section.split("\n");
    const at = lines.indexOf(KEY);
    if (at < 0) {
      problems.push(`${file}: a formula with no key ("${KEY}")`);
      continue;
    }
    for (const row of lines.slice(at + 2)) {
      if (!row.startsWith("|")) break;
      const symbol = row.split(/(?<!\\)\|/)[1].trim();
      if (!/^\[.+\]\(\.\.\/symbols\.md#[\w-]+\)$/.test(symbol)) problems.push(`${file}: ${symbol} doesn't link to symbols.md`);
    }
  }
  assert.deepEqual(problems, []);
});

// One thing, several names: the symbols page groups JAM's synonyms (symbol, plain word,
// vector field), each row linking the lesson that teaches it, and the glossary points there.
test("the symbols page's synonyms: every row has a lesson link, and the big three are grouped", () => {
  const text = readFileSync(join(LESSONS, "symbols.md"), "utf8");
  const section = /^## Synonyms[\s\S]*?(?=^## )/m.exec(text)?.[0];
  assert.ok(section, "a Synonyms section on the symbols page");
  const rows = section!.split("\n").filter((l) => l.startsWith("| ") && !l.startsWith("| Symbol") && !l.startsWith("| ---"));
  assert.ok(rows.length >= 12, `${rows.length} synonym rows`);
  for (const row of rows) assert.match(row, /\[\d+\.\d+\]\(\.\/[\w./-]+\.md\)/, `a lesson link: ${row}`);
  // the group that started this: M_R = super-peak = beefy_root, in one row
  const peak = rows.find((r) => r.includes("M_R"));
  assert.ok(peak && peak.includes("super-peak") && peak.includes("`beefy_root`"), "M_R's row holds all three names");
  assert.match(readFileSync(join(LESSONS, "glossary.md"), "utf8"), /\(\.\/symbols\.md#synonyms\)/, "the glossary points to it");
});

// The symbols page's tables are its index: every full entry is in them, linked.
test("every entry on the symbols page is linked from its tables", () => {
  const text = readFileSync(join(LESSONS, "symbols.md"), "utf8");
  const linked = new Set([...text.matchAll(/^\| \[.+?\]\(#([\w-]+)\) \|/gm)].map((m) => m[1]));
  const entries = [...text.matchAll(/^### .+ \{#([\w-]+)\}$/gm)].map((m) => m[1]);
  assert.deepEqual(entries.filter((id) => !linked.has(id)), []);
});

// Markdown forgives a heading glued to the line above it, and blank lines doubled, but the
// source reads worse for it, and an editor's outline can miss such a heading. Code aside.
test("every heading has a blank line above it, and no blank line is doubled", () => {
  const problems: string[] = [];
  for (const file of readdirSync(LESSONS, { recursive: true }).map(String).filter((f) => f.endsWith(".md"))) {
    const lines = readFileSync(join(LESSONS, file), "utf8").split("\n");
    let code = false;
    lines.forEach((line, i) => {
      if (line.startsWith("```")) code = !code;
      if (code || i === 0) return;
      if (/^#{1,6} /.test(line) && lines[i - 1].trim() !== "") problems.push(`${file}:${i + 1} glued: ${line}`);
      if (line.trim() === "" && lines[i - 1].trim() === "") problems.push(`${file}:${i + 1} a second blank line`);
    });
  }
  assert.deepEqual(problems, []);
});

// .vscode/launch.json hands the debugger over in 1.2 (WRITING.md): each program made up to
// then has a configuration, named for the lesson that makes it. Tests have only the two
// for any lesson: all of them, and the open file.
test("every program up to 1.2 has a debug configuration, named for its lesson", () => {
  const launch = JSON.parse(readFileSync(join(ROOT, ".vscode", "launch.json"), "utf8").replace(/^\s*\/\/.*$/gm, ""));
  const madeIn = new Map<string, string>();
  for (const l of lessonsThrough("1.2")) {
    for (const s of l.steps) if (s.kind === "file" && s.op === "new") madeIn.set(s.path, l.id);
  }
  const named: string[] = [];
  for (const c of launch.configurations as { name: string; program?: string }[]) {
    const lesson = /\((\d+\.\d+)\)$/.exec(c.name)?.[1];
    if (!lesson) continue; // one for any file, such as "Tests: the open file"
    const path = (c.program ?? "").replace("${workspaceFolder}/client/", "");
    assert.equal(madeIn.get(path), lesson, `"${c.name}" runs ${path}, which lesson ${lesson} makes`);
    named.push(path);
  }
  const programs = [...madeIn.keys()].filter((p) => p.startsWith("bin/"));
  assert.deepEqual(named.sort(), programs.sort());
});

// Every program runs through npm (0.3): a lesson that writes bin/NAME.ts gives it the script
// NAME, `npm pkg set scripts.NAME="node bin/NAME.ts"`, in the first Run block that runs it,
// and a Run block runs `npm run NAME`, never `node bin/` itself. A run on a file (a word
// with a /) or a long value has a script of its own, named for what it shows, the
// program's name first (2.6): `npm pkg set scripts.decode-work-item="node bin/decode.ts
// work_item …"`, then `npm run decode-work-item`. A package.json the reader rewrites keeps
// every script given so far, in order.
const PROGRAM_SCRIPT = /^npm pkg set scripts\.([a-z-]+)="node bin\/([a-z-]+)\.ts"$/;
const EXAMPLE_SCRIPT = /^npm pkg set scripts\.([a-z0-9-]+)="((?:[A-Z_]+=\S+ )*)node bin\/([a-z-]+)\.ts( \S[^"]*)?"$/;
/** Scripts a Run block may run that no lesson gives: npm's own, and the repo root's. */
const NOT_GIVEN = new Set(["test", "typecheck", "catch-up", "compare", "vectors"]);
const LONG_WORDS = (words: string) => words.split(/\s+/).some((w) => w.includes("/") || w.length >= 20);

test("every program has its npm script, given before it first runs, and runs through it", () => {
  const programs = new Set<string>();
  const given: string[] = [];
  const problems: string[] = [];
  for (const lesson of parts.flatMap((p) => p.lessons)) {
    for (const s of lesson.steps) {
      if (s.kind === "file") {
        const made = /^bin\/([a-z-]+)\.ts$/.exec(s.path);
        if (made && s.op === "new") programs.add(made[1]);
        if (s.path === "package.json") {
          const scripts = Object.keys(JSON.parse(s.code).scripts ?? {}).filter((n) => n !== "test" && n !== "typecheck");
          if (scripts.join() !== given.join()) problems.push(`${lesson.id}: package.json's scripts should be ${given.join(", ")}`);
        }
        continue;
      }
      if (/\bnode bin\//.test(s.command.replace(/^npm pkg set .*$/gm, ""))) problems.push(`${lesson.id}: runs node bin/ (npm run it)`);
      for (const line of s.command.split("\n")) {
        const set = PROGRAM_SCRIPT.exec(line);
        const example = set ? null : EXAMPLE_SCRIPT.exec(line);
        if (set && set[1] !== set[2]) problems.push(`${lesson.id}: script ${set[1]} runs bin/${set[2]}.ts`);
        if (example && (!example[1].startsWith(`${example[3]}-`) || programs.has(example[1]))) {
          problems.push(`${lesson.id}: script ${example[1]} runs bin/${example[3]}.ts, so it's named ${example[3]}-…`);
        }
        if (example && !example[2] && !example[4]) problems.push(`${lesson.id}: ${example[1]} is ${example[3]}'s script again`);
        const name = (set ?? example)?.[1];
        if (name) {
          if (given.includes(name)) problems.push(`${lesson.id}: ${name} has its script already`);
          given.push(name);
        } else if (/^npm pkg set scripts\./.test(line)) problems.push(`${lesson.id}: a script that isn't a program's: ${line}`);
        for (const [, name, words] of line.matchAll(/\bnpm run ([a-z][a-z0-9-]*)( [^>&|;]*)?/g)) {
          if (!given.includes(name) && !NOT_GIVEN.has(name)) problems.push(`${lesson.id}: npm run ${name} before its script`);
          if (words && LONG_WORDS(words)) problems.push(`${lesson.id}: npm run ${name}${words}: give it a script of its own`);
        }
      }
    }
  }
  assert.deepEqual(problems, []);
  assert.deepEqual([...programs].filter((p) => !given.includes(p)), [], "programs never given a script");
});

// The scoreboard (lesson 2.6, scoreboard.md): a lesson where a vector family crosses the
// line ends with a section that runs it, The scoreboard, and a Milestone note; the page
// lists those lessons in order, each with the count its board ends with. A lesson that
// changes the families on the board runs it, so no family joins unseen.
test("every scoreboard milestone is on the scoreboard page, with the count its board shows", () => {
  const page = readFileSync(join(LESSONS, "scoreboard.md"), "utf8");
  const listed = [...page.matchAll(/^\| \[([\d.]+)\]\(\.\/([^)#]+)#the-scoreboard\) \|[^|]+\| ([\d,]+) \|$/gm)]
    .map(([, id, file, board]) => ({ id, file, board }));
  const run: { id: string; file: string; board: string }[] = [];
  const problems: string[] = [];
  for (const lesson of parts.flatMap((p) => p.lessons)) {
    const text = readFileSync(join(LESSONS, lesson.file), "utf8");
    const boards = lesson.steps.filter((s) => s.kind === "run" && /^npm run scoreboard$/m.test(s.command));
    const families = lesson.steps.some((s) => s.kind === "file" && s.path === "test/families.ts" &&
      /^export const FAMILIES\b/m.test(s.code));
    if (boards.length === 0) {
      if (families) problems.push(`${lesson.id} changes FAMILIES but doesn't run the scoreboard`);
      continue;
    }
    if (!/^## The scoreboard$/m.test(text)) problems.push(`${lesson.id} has no "## The scoreboard"`);
    if (!/^> \[!TIP\] Milestone$/m.test(text)) problems.push(`${lesson.id} has no "> [!TIP] Milestone" note`);
    const last = boards.at(-1)!;
    const board = last.kind === "run" && /^([\d,]+) of 1,428 vectors pass\.$/m.exec(last.output ?? "")?.[1];
    if (!board) problems.push(`${lesson.id}: its scoreboard run shows no "… of 1,428 vectors pass." line`);
    run.push({ id: lesson.id, file: lesson.file, board: board || "?" });
  }
  assert.deepEqual(problems, []);
  assert.deepEqual(listed, run);
});
