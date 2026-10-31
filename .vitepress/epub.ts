// The tutorial as an e-book, for an e-reader (a Kindle through Send to Kindle, Apple Books,
// a Kobo): the concepts edition, made after the build from the built pages, as print.ts
// makes print.html. One chapter a page, in reading order.
//
// What an e-reader can't do decides what changes:
// - the code is folded away, as the site's Concepts only does (theme/concepts.ts): the byte
//   tables and a run's output stay, the snippets and the lasair folds go;
// - Grafana screenshots go: dark dashboards are noise in greyscale, and about the running
//   client, not the concepts;
// - a widget becomes one line pointing to it on the website;
// - a lesson's check becomes printed review questions, with the answers and every option's
//   reason at the end of the chapter;
// - diagrams and formulas, SVG on the site, become PNGs (white, for e-ink): Kindle's SVG
//   support is patchy.

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { crc32, deflateRawSync } from "node:zlib";
import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";
import { DOMParser } from "@xmldom/xmldom";
import { Resvg } from "@resvg/resvg-js";
import { docText, type PrintPage } from "./print.ts";

export const EPUB_FILE = "the-gray-tutor-concepts.epub";
const TITLE = "The Gray Tutor: the concepts";
const SITE = "https://abutlabs.github.io/the-gray-tutor/";

// ---- a zip, as EPUB needs it: the mimetype first and stored, the rest deflated ---------

export type ZipEntry = { name: string; data: Buffer };

/** A zip archive of the entries, in order. The first is stored as it is, every other deflated. */
export function zip(entries: ZipEntry[]): Buffer {
  const local: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;
  entries.forEach(({ name, data }, i) => {
    const stored = i === 0; // EPUB: "mimetype", uncompressed, first
    const body = stored ? data : deflateRawSync(data, { level: 9 });
    const nameBytes = Buffer.from(name, "utf8");
    const crc = crc32(data);
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4); // version needed
    header.writeUInt16LE(0x0800, 6); // names in UTF-8
    header.writeUInt16LE(stored ? 0 : 8, 8);
    header.writeUInt32LE(0, 10); // time and date: zero, so the same input makes the same bytes
    header.writeUInt32LE(crc, 14);
    header.writeUInt32LE(body.length, 18);
    header.writeUInt32LE(data.length, 22);
    header.writeUInt16LE(nameBytes.length, 26);
    header.writeUInt16LE(0, 28);
    local.push(header, nameBytes, body);
    const entry = Buffer.alloc(46);
    entry.writeUInt32LE(0x02014b50, 0);
    entry.writeUInt16LE(20, 4);
    entry.writeUInt16LE(20, 6);
    entry.writeUInt16LE(0x0800, 8);
    entry.writeUInt16LE(stored ? 0 : 8, 10);
    entry.writeUInt32LE(0, 12);
    entry.writeUInt32LE(crc, 16);
    entry.writeUInt32LE(body.length, 20);
    entry.writeUInt32LE(data.length, 24);
    entry.writeUInt16LE(nameBytes.length, 28);
    entry.writeUInt32LE(offset, 42);
    central.push(entry, nameBytes);
    offset += header.length + nameBytes.length + body.length;
  });
  const directory = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, directory, end]);
}

// ---- SVG to PNG ---------------------------------------------------------------------

const MONO = process.platform === "darwin" ? "Menlo" : "DejaVu Sans Mono";
const SANS = process.platform === "darwin" ? "Helvetica" : "DejaVu Sans";

/** An SVG as a PNG on white, `zoom` times its own size. */
export function png(svg: string, zoom: number): Buffer {
  const resvg = new Resvg(svg, {
    background: "white",
    fitTo: { mode: "zoom", value: zoom },
    font: { loadSystemFonts: true, defaultFontFamily: SANS, monospaceFamily: MONO, sansSerifFamily: SANS },
  });
  return resvg.render().asPng();
}

// MathJax sizes its SVGs in ex; an ex is about half an em, 8 px at the site's 16 px
const EX_PX = 8;
const exNumber = (s: string | undefined) => Number(/^(-?[\d.]+)ex$/.exec(s ?? "")?.[1] ?? NaN);

// ---- a page, made fit for an e-reader -------------------------------------------------

export type Image = { name: string; data: Buffer };
export type Chapter = { file: string; title: string; xhtml: string };

/** The context a page is made in: where everything is, and the images gathered so far. */
export type Book = {
  outDir: string;
  base: string;
  /** a page's address → its chapter's file */
  chapters: Map<string, string>;
  images: Map<string, Image>;
};

function addImage(book: Book, data: Buffer): string {
  const name = `images/${createHash("sha256").update(data).digest("hex").slice(0, 16)}.png`;
  book.images.set(name, { name, data });
  return name;
}

/** A link from a page, pointing into the book where it can, else to the website or away. */
export function bookHref(href: string, address: string, book: Book): string {
  if (href.startsWith("#")) return href;
  if (/^[a-z]+:/i.test(href)) return href; // another site, mail, localhost
  const pageUrl = new URL(book.base + address, "https://site.invalid");
  const url = new URL(href, pageUrl);
  if (!url.pathname.startsWith(book.base)) return href;
  const target = url.pathname.slice(book.base.length).replace(/\.html$/, "");
  const chapter = book.chapters.get(target);
  if (chapter) return chapter + url.hash;
  return SITE + target + url.hash; // a page the book doesn't hold: the website has it
}

/** A picture's SVG, from its file or its data: URL; undefined if it isn't an SVG. */
export function svgOf(src: string, address: string, book: Book): string | undefined {
  const data = /^data:image\/svg\+xml(;base64)?,(.*)$/s.exec(src);
  if (data) return data[1] ? Buffer.from(data[2], "base64").toString("utf8") : decodeURIComponent(data[2]);
  if (!src.endsWith(".svg")) return undefined;
  const path = new URL(src, new URL(book.base + address, "https://site.invalid")).pathname;
  return readFileSync(join(book.outDir, path.slice(book.base.length)), "utf8");
}

/** The page's check as printed review questions, and its answers for the chapter's end. */
function reviewQuestions($: CheerioAPI, check: ReturnType<CheerioAPI>, n: number): { questions: string; answers: string } {
  const letters = "ABCDE";
  const qs: string[] = [];
  const as: string[] = [];
  check.find("li.question").each((qi, q) => {
    const ask = $(q).find("p.ask").html() ?? "";
    const options = $(q).find("ul.options > li").toArray().map((li) => ({
      text: $(li).find("button.option > span").last().html() ?? "",
      why: $(li).find("p.why > span").last().html() ?? "",
      right: $(li).attr("data-right") === "yes",
    }));
    const id = `q${n}-${qi + 1}`;
    qs.push(`<li id="${id}"><p class="ask">${ask}</p><ol class="options" type="A">${
      options.map((o) => `<li>${o.text}</li>`).join("")}</ol><p class="to-answer"><a href="#${id}-answer">Answer</a></p></li>`);
    const right = options.findIndex((o) => o.right);
    as.push(`<li id="${id}-answer"><p><strong>${letters[right]}.</strong> ${options[right].why}</p>${
      options.map((o, i) => (o.right ? "" : `<p class="other"><strong>${letters[i]}</strong> (${o.text}): ${o.why}</p>`)).join("")
    }<p class="back"><a href="#${id}">Back to the question</a></p></li>`);
  });
  return {
    questions: `<ol class="review">${qs.join("")}</ol>`,
    answers: `<h2 id="answers-${n}">Answers</h2><ol class="answers">${as.join("")}</ol>`,
  };
}

/** One built page's text, as a chapter's body. */
export function chapterBody(text: string, address: string, book: Book, n: number): string {
  const $ = cheerio.load(text, null, false);
  // a run's tabs (run-views.ts): an e-reader can't switch tabs, so each text tab is shown in
  // turn under its title, and the tab bar goes
  $(".vp-code-group .tabs").remove();
  $('.vp-code-group div[class*="language-"].language-text[data-tab]').each((_, b) => {
    $(b).before(`<p class="snippet-label output"><strong>${$(b).attr("data-tab")}</strong></p>`);
  });
  $(".run-widget-anchor").remove();
  // the code, as Concepts only folds it: the byte tables and outputs (language-text) stay
  $('div[class*="language-"]').not(".language-text").remove();
  $("p.snippet-label").not(".output").remove();
  $("details.lasair").remove();
  // Albert sits on code, and the book leaves the code out: he's met in lesson 0.1 instead
  $("a.header-anchor, button.copy, button.eye, span.lang, a.albert").remove();
  // a code block's colours are the site's theme, as CSS variables no e-reader reads
  $("pre, pre *").removeAttr("style").removeAttr("tabindex");
  // other folds: an e-reader may not open them, so they're shown open
  $("details").each((_, d) => {
    const summary = $(d).children("summary");
    summary.replaceWith(`<p class="summary"><strong>${summary.html() ?? ""}</strong></p>`);
    $(d).replaceWith(`<div class="fold">${$(d).html() ?? ""}</div>`);
  });
  // the check, printed; its answers go at the chapter's end
  $(".widget.check-yourself").each((_, el) => {
    const printed = reviewQuestions($, $(el), n);
    $(el).replaceWith(printed.questions);
    $.root().append(printed.answers);
  });
  $(".widget").each((_, el) => {
    $(el).replaceWith(`<p class="widget-note">Interactive on the website: <a href="${SITE}${address}">try it there</a>.</p>`);
  });
  // formulas: MathJax's SVG, as PNG at three times its size, shown at its own size in em
  $("mjx-container").each((_, el) => {
    const svg = $(el).children("svg").first();
    const display = $(el).attr("display") === "true";
    const w = exNumber(svg.attr("width"));
    const h = exNumber(svg.attr("height"));
    const align = /vertical-align:\s*(-?[\d.]+)ex/.exec(svg.attr("style") ?? "")?.[1];
    svg.attr("width", `${w * EX_PX}`).attr("height", `${h * EX_PX}`).removeAttr("style");
    const alt = $(el).find("mjx-assistive-mml").text().replace(/\s+/g, " ").trim();
    const src = addImage(book, png($.xml(svg), 2));
    const size = `width: ${(w / 2).toFixed(2)}em;${display ? "" : ` vertical-align: ${(Number(align ?? 0) / 2).toFixed(2)}em;`}`;
    const img = `<img class="math" src="${src}" alt="${escapeXml(alt)}" style="${size}"/>`;
    $(el).replaceWith(display ? `<div class="math">${img}</div>` : img);
  });
  // pictures: diagrams (SVG) become PNG; screenshots (PNG) go. A small diagram is inlined
  // by the build as a data: URL (Vite inlines files under 4 KB), a bigger one is a file.
  $("img").not(".math").each((_, el) => {
    const src = $(el).attr("src") ?? "";
    const svg = svgOf(src, address, book);
    if (svg === undefined) {
      const parent = $(el).parent("p");
      if (parent.length && parent.text().trim() === "") parent.remove();
      else $(el).remove();
      return;
    }
    $(el).attr("src", addImage(book, png(svg, 2))).removeAttr("role").removeAttr("tabindex");
  });
  $("a[href]").each((_, a) => { $(a).attr("href", bookHref($(a).attr("href") ?? "", address, book)); });
  // the site's own attributes: Vue's scoped-style marks and the like mean nothing here
  $("*").each((_, el) => {
    for (const name of Object.keys((el as { attribs?: Record<string, string> }).attribs ?? {})) {
      if (name.startsWith("data-v-") || name === "data-right") $(el).removeAttr(name);
    }
  });
  return utf8($.xml());
}

/** XML written with its characters as they are: the serializer writes ℹ as &#x2139;. */
export const utf8 = (s: string) => s.replace(/&#x([0-9a-f]+);/gi, (entity, hex: string) => {
  const c = parseInt(hex, 16);
  return c < 0x20 || "&<>\"'".includes(String.fromCodePoint(c)) ? entity : String.fromCodePoint(c);
});

const escapeXml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** A chapter's whole XHTML document. */
export function xhtml(title: string, body: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="en" xml:lang="en">
<head><meta charset="utf-8"/><title>${escapeXml(title)}</title><link rel="stylesheet" type="text/css" href="book.css"/></head>
<body>
${body}
</body>
</html>
`;
}

/** Throws unless the document is well-formed XML: an e-reader refuses a chapter that isn't. */
export function checkXml(name: string, document: string): void {
  const problems: string[] = [];
  const parser = new DOMParser({ onError: (level, message) => { if (level !== "warning") problems.push(message); } });
  try {
    parser.parseFromString(document, "application/xhtml+xml");
  } catch (e) { // a fatal error throws, after onError has heard it
    problems.push((e as Error).message);
  }
  if (problems.length > 0) throw new Error(`${name} is not well-formed: ${problems[0]}`);
}

// ---- the book ---------------------------------------------------------------------------

const CSS = `body { font-family: serif; line-height: 1.5; margin: 0 4%; }
h1, h2, h3 { font-family: sans-serif; line-height: 1.25; page-break-after: avoid; }
h1 { font-size: 1.6em; margin-top: 0.5em; }
code { font-family: monospace; font-size: 0.9em; }
pre { font-family: monospace; font-size: 0.72em; line-height: 1.35; white-space: pre-wrap; word-wrap: break-word; border-left: 3px solid #999; padding: 0.4em 0.6em; margin: 0.8em 0; page-break-inside: avoid; }
table { border-collapse: collapse; margin: 0.8em 0; font-size: 0.9em; }
th, td { border: 1px solid #999; padding: 0.2em 0.4em; vertical-align: top; }
img { max-width: 100%; }
p > img:only-child { display: block; margin: 0.8em auto; }
div.math { text-align: center; margin: 0.8em 0; }
img.math { max-width: 100%; }
.custom-block { border: 1px solid #999; padding: 0.3em 0.8em; margin: 0.8em 0; }
.custom-block-title { font-weight: bold; }
.snippet-label { font-family: sans-serif; font-size: 0.85em; font-weight: bold; margin-bottom: 0; }
.widget-note { font-style: italic; font-size: 0.9em; }
.fold { border-left: 3px solid #ccc; padding-left: 0.6em; }
ol.review > li { margin-bottom: 1em; }
.ask { font-weight: bold; margin-bottom: 0.2em; }
ol.options { margin-top: 0; }
.to-answer, .back { font-size: 0.85em; margin-top: 0.2em; }
ol.answers > li { margin-bottom: 1em; }
.other { font-size: 0.9em; margin: 0.2em 0 0.2em 1em; }
.cover { text-align: center; margin-top: 15%; }
.cover img { width: 40%; }
`;

const mediaType = (name: string) => (name.endsWith(".png") ? "image/png" : name.endsWith(".css") ? "text/css" : "application/xhtml+xml");

/** The book: every page in `pages`, from the built site in outDir, as one EPUB file there. */
export function writeEpub(outDir: string, base: string, pages: PrintPage[]): void {
  const book: Book = { outDir, base, chapters: new Map(), images: new Map() };
  pages.forEach((p, i) => book.chapters.set(p.address, `c${String(i).padStart(3, "0")}.xhtml`));
  const built = (a: string) => join(outDir, a === "" || a.endsWith("/") ? `${a}index.html` : `${a}.html`);

  const chapters: Chapter[] = pages.map((p, i) => ({
    file: book.chapters.get(p.address)!,
    title: p.title,
    xhtml: xhtml(p.title, `<section>${chapterBody(docText(readFileSync(built(p.address), "utf8")), p.address, book, i)}</section>`),
  }));

  const date = new Date().toISOString().slice(0, 10);
  const cover = addImage(book, png(readFileSync(join(outDir, "logo.svg"), "utf8"), 12));
  const coverPage: Chapter = {
    file: "cover.xhtml",
    title: TITLE,
    xhtml: xhtml(TITLE, `<div class="cover"><img src="${cover}" alt=""/><h1>The Gray Tutor</h1><p>The concepts: JAM from the Gray Paper, one rule at a time, with the code folded away.</p><p>${date}</p><p><a href="${SITE}">${SITE}</a></p></div>`),
  };

  // the contents: each part with its lessons under it, as the site's sidebar has them
  const groups: { head: PrintPage; pages: PrintPage[] }[] = [];
  for (const p of pages) {
    if (p.part || groups.length === 0) groups.push({ head: p, pages: [] });
    else groups.at(-1)!.pages.push(p);
  }
  const link = (p: PrintPage) => `<a href="${book.chapters.get(p.address)}">${escapeXml(p.title)}</a>`;
  const nav = xhtml("Contents", `<nav epub:type="toc" id="toc"><h1>Contents</h1><ol>${groups.map(({ head, pages: ps }) =>
    `<li>${link(head)}${ps.length ? `<ol>${ps.map((p) => `<li>${link(p)}</li>`).join("")}</ol>` : ""}</li>`).join("")}</ol></nav>`);
  // the older table of contents too, which Kindle's converter still reads
  let order = 0;
  const point = (p: PrintPage, inner = "") =>
    `<navPoint id="n${++order}" playOrder="${order}"><navLabel><text>${escapeXml(p.title)}</text></navLabel><content src="${book.chapters.get(p.address)}"/>${inner}</navPoint>`;
  const id = `urn:uuid:${uuidFrom(SITE)}`;
  const ncx = `<?xml version="1.0" encoding="utf-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1"><head><meta name="dtb:uid" content="${id}"/></head><docTitle><text>${escapeXml(TITLE)}</text></docTitle><navMap>${
  groups.map(({ head, pages: ps }) => point(head, ps.map((p) => point(p)).join(""))).join("")}</navMap></ncx>
`;

  const all = [coverPage, ...chapters];
  for (const c of all) checkXml(c.file, c.xhtml);
  checkXml("nav.xhtml", nav);
  checkXml("toc.ncx", ncx);
  const images = [...book.images.values()];
  const manifest = [
    `<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>`,
    `<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>`,
    `<item id="css" href="book.css" media-type="text/css"/>`,
    ...all.map((c) => `<item id="${c.file.replace(".xhtml", "")}" href="${c.file}" media-type="application/xhtml+xml"/>`),
    ...images.map((im) => `<item id="i${im.name.slice(7, 23)}" href="${im.name}" media-type="${mediaType(im.name)}"${im.name === cover ? ` properties="cover-image"` : ""}/>`),
  ];
  const opf = `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="id" xml:lang="en">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:identifier id="id">${id}</dc:identifier>
<dc:title>${escapeXml(TITLE)}</dc:title>
<dc:creator>abutlabs</dc:creator>
<dc:language>en</dc:language>
<dc:date>${date}</dc:date>
<meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z$/, "Z")}</meta>
<meta name="cover" content="i${cover.slice(7, 23)}"/>
</metadata>
<manifest>
${manifest.join("\n")}
</manifest>
<spine toc="ncx">
${all.map((c) => `<itemref idref="${c.file.replace(".xhtml", "")}"/>`).join("\n")}
</spine>
</package>
`;
  checkXml("content.opf", opf);
  const container = `<?xml version="1.0" encoding="utf-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>
`;
  const text = (s: string) => Buffer.from(s, "utf8");
  writeFileSync(join(outDir, EPUB_FILE), zip([
    { name: "mimetype", data: text("application/epub+zip") },
    { name: "META-INF/container.xml", data: text(container) },
    { name: "OEBPS/content.opf", data: text(opf) },
    { name: "OEBPS/nav.xhtml", data: text(nav) },
    { name: "OEBPS/toc.ncx", data: text(ncx) },
    { name: "OEBPS/book.css", data: text(CSS) },
    ...all.map((c) => ({ name: `OEBPS/${c.file}`, data: text(c.xhtml) })),
    ...images.map((im) => ({ name: `OEBPS/${im.name}`, data: im.data })),
  ]));
}

/** A stable UUID from a string, so the book keeps its identity from build to build. */
function uuidFrom(s: string): string {
  const h = createHash("sha256").update(s).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
