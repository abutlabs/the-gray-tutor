// The e-book (.vitepress/epub.ts): a zip an e-reader opens, and pages made fit for one.

import { test } from "node:test";
import assert from "node:assert/strict";
import { crc32, inflateRawSync } from "node:zlib";
import { type Book, chapterBody, checkXml, coverSvg, kindleLetters, xhtml, zip } from "../.vitepress/epub.ts";

/** The entries of a zip, read back from its local headers. */
function unzip(archive: Buffer): { name: string; stored: boolean; data: Buffer }[] {
  const out: { name: string; stored: boolean; data: Buffer }[] = [];
  let at = 0;
  while (archive.readUInt32LE(at) === 0x04034b50) {
    const method = archive.readUInt16LE(at + 8);
    const crc = archive.readUInt32LE(at + 14);
    const size = archive.readUInt32LE(at + 18);
    const nameLength = archive.readUInt16LE(at + 26);
    const name = archive.toString("utf8", at + 30, at + 30 + nameLength);
    const body = archive.subarray(at + 30 + nameLength, at + 30 + nameLength + size);
    const data = method === 0 ? Buffer.from(body) : inflateRawSync(body);
    assert.equal(crc32(data), crc, `${name}'s checksum`);
    out.push({ name, stored: method === 0, data });
    at += 30 + nameLength + size;
  }
  assert.equal(archive.readUInt32LE(at), 0x02014b50, "the central directory follows the files");
  return out;
}

test("the zip: mimetype first and stored, as EPUB requires; the rest deflated, every checksum right", () => {
  const archive = zip([
    { name: "mimetype", data: Buffer.from("application/epub+zip") },
    { name: "OEBPS/c000.xhtml", data: Buffer.from("<p>ℰ₄ ".repeat(200)) },
  ]);
  assert.equal(archive.toString("latin1", 30, 38), "mimetype", "mimetype's name at byte 30");
  assert.equal(archive.toString("latin1", 38, 58), "application/epub+zip", "and its text right after");
  const entries = unzip(archive);
  assert.deepEqual(entries.map((e) => [e.name, e.stored]), [["mimetype", true], ["OEBPS/c000.xhtml", false]]);
  assert.equal(entries[1].data.toString("utf8"), "<p>ℰ₄ ".repeat(200));
  // the same input makes the same bytes: no timestamps
  assert.deepEqual(zip([{ name: "a", data: Buffer.from("x") }]), zip([{ name: "a", data: Buffer.from("x") }]));
});

const book = (): Book => ({
  outDir: "/nowhere",
  base: "/the-gray-tutor/",
  chapters: new Map([["02-codec/01-fixed-width-integers", "c010.xhtml"], ["02-codec/02-compact-naturals", "c011.xhtml"]]),
  images: new Map(),
});

// a built page's text, cut down: a snippet, a run, its output, a widget, a check, links
const PAGE = `<h1 id="compact-naturals" tabindex="-1">Compact naturals <a class="header-anchor" href="#compact-naturals">​</a></h1>
<p>As in <a href="/the-gray-tutor/02-codec/01-fixed-width-integers#recipe">lesson 2.1</a>, and <a href="/the-gray-tutor/glossary">the glossary</a>.</p>
<p class="snippet-label new"><strong>New file</strong> <code>src/x.ts</code></p>
<div class="language-ts vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">ts</span><pre class="shiki"><code><span class="line"><span style="--shiki-light:#D73A49;">const</span> x = 1;</span></code></pre></div>
<p class="snippet-label run"><strong>Run</strong></p>
<div class="language-sh vp-adaptive-theme"><pre><code>npm test</code></pre></div>
<p class="snippet-label output"><strong>Output</strong></p>
<div class="language-text vp-adaptive-theme"><button class="copy"></button><span class="lang">text</span><pre class="shiki" tabindex="0"><code><span class="line"><span style="--shiki-light:#24292E;">ℹ pass 3</span></span></code></pre></div>
<p>Try it:</p>
<div class="widget bit-places" data-v-1234abcd><button data-v-1234abcd>1</button></div>
<details class="lasair"><summary>lasair</summary><pre>let x = 1</pre></details>
<div class="widget check-yourself" data-v-99><ol class="questions"><li class="question"><p class="ask">Why <code>7f</code>?</p><ul class="options">
<li><button class="option"><span class="mark"></span><span>A wrong one</span></button><p class="why wrong" style="display:none;"><span class="sr-only">Not this one.</span><span>No: see <a href="/the-gray-tutor/02-codec/01-fixed-width-integers">lesson 2.1</a>.</span></p></li>
<li data-right="yes"><button class="option"><span class="mark"></span><span>The right one</span></button><p class="why right" style="display:none;"><span class="sr-only">Right.</span><span>Yes: 127.</span></p></li>
</ul></li></ol></div>
<h2 id="what-you-have">What you have</h2><p>The end.</p>`;

test("a page for an e-reader: the code folded away, outputs kept, a widget pointed to, links into the book", () => {
  const body = chapterBody(PAGE, "02-codec/02-compact-naturals", book(), 11);
  assert.doesNotMatch(body, /const<\/span> x|npm test|let x = 1/, "no snippet, command or lasair fold");
  assert.doesNotMatch(body, /New file|<strong>Run<\/strong>/, "and no label for code that isn't there");
  assert.match(body, /<strong>Output<\/strong>/);
  assert.match(body, /ℹ pass 3/, "a run's output stays: it shows the concept");
  assert.doesNotMatch(body, /--shiki|style=|header-anchor|class="copy"|data-v-|data-right/, "nothing of the site's machinery");
  assert.match(body, /Interactive on the website: <a href="https:\/\/abutlabs\.github\.io\/the-gray-tutor\/02-codec\/02-compact-naturals">/);
  assert.match(body, /href="c010\.xhtml#recipe"/, "a lesson in the book: its chapter");
  assert.match(body, /href="https:\/\/abutlabs\.github\.io\/the-gray-tutor\/glossary"/, "a page the book doesn't hold: the website");
});

test("a page for an e-reader: the check as review questions, answers at the chapter's end with every reason", () => {
  const body = chapterBody(PAGE, "02-codec/02-compact-naturals", book(), 11);
  const questions = body.indexOf('<ol class="review">');
  const end = body.indexOf("What you have");
  const answers = body.indexOf('<h2 id="answers-11">Answers</h2>');
  assert.ok(questions > 0 && questions < end && end < answers, "questions, then What you have, then the answers");
  assert.match(body, /<li id="q11-1"><p class="ask">Why <code>7f<\/code>\?<\/p><ol class="options" type="A"><li>A wrong one<\/li><li>The right one<\/li><\/ol>/);
  assert.match(body, /<a href="#q11-1-answer">Answer<\/a>/);
  assert.match(body, /<li id="q11-1-answer"><p><strong>B\.<\/strong> Yes: 127\.<\/p><p class="other"><strong>A<\/strong> \(A wrong one\): No: see <a href="c010\.xhtml">lesson 2\.1<\/a>\.<\/p>/,
    "the right letter and its reason, then each wrong one's, its links into the book");
  assert.doesNotMatch(body, /Not this one\.|Right\./, "the screen-reader words stay on the website");
});

test("every chapter is well-formed XHTML, and a broken one is refused", () => {
  const body = chapterBody(PAGE, "02-codec/02-compact-naturals", book(), 11);
  checkXml("c011.xhtml", xhtml("2.2 Compact naturals", `<section>${body}</section>`));
  assert.throws(() => checkXml("bad.xhtml", xhtml("bad", "<p>unclosed")), /bad\.xhtml is not well-formed/);
});

// a run as run-views.ts renders it: five tabs in a frame
const RUN = `<div class="run-widget" id="run-verdicts-progress">
<p class="run-widget-title">▶ One run of <code>npm run verdicts-progress</code> <a class="run-widget-anchor" href="#run-verdicts-progress" aria-label="A link to this run">#</a></p>
<div class="vp-code-group vp-adaptive-theme"><div class="tabs"><input type="radio" name="group-1" id="tab-a" checked><label data-title="run in client/" for="tab-a">run in client/</label></div><div class="blocks">
<div data-tab="run in client/" class="language-sh vp-adaptive-theme active"><pre><code>npm run verdicts-progress</code></pre></div>
<div data-tab="what goes in" class="language-json vp-adaptive-theme"><pre><code>{ "age": 0 }</code></pre></div>
<div data-tab="what it computes" class="language-ts vp-adaptive-theme"><pre><code>const computed = { valid: 5 };</code></pre></div>
<div data-tab="what comes out" class="language-text vp-adaptive-theme"><pre><code>report 0x11da6d1f…: 5 of 5 say valid</code></pre></div>
<div data-tab="output" class="language-text vp-adaptive-theme"><pre><code>report 0x11da6d1f…: 5 of 5 say valid
reported to Grafana: http://127.0.0.1:3300</code></pre></div>
</div></div>
</div>`;

test("a run in the book keeps what it's about, each under its title; no commands, no tab bar, no whole output", () => {
  const body = chapterBody(RUN, "10-disputes/01-votes-and-verdicts", book(), 55);
  for (const tab of ["what goes in", "what it computes", "what comes out"]) assert.match(body, new RegExp(`<strong>${tab}</strong>`), tab);
  assert.match(body, /\{ &quot;age&quot;: 0 \}/, "the input, though it's JSON (XML writes its quotes as &quot;)");
  assert.match(body, /const computed = \{ valid: 5 \};/, "the computed structures");
  assert.doesNotMatch(body, /npm run verdicts-progress<\/code><\/pre>|reported to Grafana|<input|<label|class="tabs"/, "no commands, whole output or tab bar");
  assert.match(body, /<p class="run-widget-title">One run of <code>npm run verdicts-progress<\/code>\s*<\/p>/, "titled, without the triangle or the anchor");
});

test("an inline SVG picture (Albert's poses) becomes a PNG: no SVG is left in a chapter", () => {
  const pose = `<p>Hi.</p><a class="albert-judge" href="../00-start/01-what-you-will-build#albert"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 64" role="img" aria-label="Albert the judge"><title>Albert the judge</title><rect width="100" height="64" fill="black"/></svg></a>`;
  const b = book();
  const body = chapterBody(pose, "10-disputes/", b, 54);
  assert.doesNotMatch(body, /<svg/, "EPUBCheck refuses inline SVG an OPF doesn't declare");
  assert.match(body, /<p class="pose"><img class="pose" src="images\/[0-9a-f]{16}\.png" alt="Albert the judge" style="width: 35%"\/><\/p>/);
  assert.equal(b.images.size, 1);
});

test("the maths letters Kindle's fonts lack become plain letters with their style; everything else stays", () => {
  assert.equal(kindleLetters("𝐑*"), "<b>R</b>*");
  assert.equal(kindleLetters("𝒴(H_S)"), "<i>Y</i>(H_S)");
  assert.equal(kindleLetters("𝔹 and 𝕏"), "<b>B</b> and <b>X</b>");
  assert.equal(kindleLetters("𝔪"), "<i>m</i>");
  assert.equal(kindleLetters("ρ† ⌢ ℰ₄ ≺ ℕ"), "ρ† ⌢ ℰ₄ ≺ ℕ", "Greek, operators, letterlike symbols and subscripts stay");
  const body = chapterBody("<p>𝐑* from ρ‡, and ↕\uFE0E</p>", "17-accumulation/02-waiting-reports", book(), 90);
  assert.match(body, /<b>R<\/b>\* from ρ‡, and ↕<\/p>/);
  assert.doesNotMatch(body, /\uFE0E|[\u{1D400}-\u{1D7FF}]/u);
});

test("the cover is a portrait page Kindle's library can show: 1600 by 2560, the title on it", () => {
  const svg = coverSvg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30"/></svg>`, "2026-11-01");
  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="1600" height="2560"/);
  assert.match(svg, /<svg x="400" y="360" width="800" height="800" xmlns=/, "Albert, centred");
  assert.match(svg, />The Gray Tutor<\/text>/);
  assert.match(svg, />2026-11-01<\/text>/);
  checkXml("cover.svg", svg);
});
