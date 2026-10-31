// The whole tutorial on one page, for printing and for reading offline, as the Rust Book's
// print.html. After the build, every page's rendered text is copied into print.html in
// reading order. Each page's ids get the page's own prefix, so they stay unique, and a link
// to another page of the tutorial becomes a link within the one page.

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** A page on the one page: its address (as in urls.ts), its title, and whether it opens a part. */
export type PrintPage = { address: string; title: string; part?: boolean };

/** The id a page's section gets: "02-codec/03-writer-and-reader" is "p-02-codec-03-writer-and-reader". */
export function sectionId(address: string): string {
  return `p-${address.replace(/\/$/, "").replace(/\//g, "-") || "start"}`;
}

/** A built page's text: what's inside its vp-doc, without the site around it. */
export function docText(html: string): string {
  const open = /<div style="position:relative;" class="vp-doc[^"]*"[^>]*><div>/.exec(html);
  const end = html.lastIndexOf("</div></div></main>");
  if (!open || end < open.index) throw new Error("no vp-doc in this page");
  return html.slice(open.index + open[0].length, end);
}

/**
 * A page's text, ready for the one page: its ids prefixed with the page's, and every link to
 * a page on the one page (another page, or a heading on this one) turned into a link to its
 * place on the one page. Other links stay as they are. A step shows its whole file, folded,
 * as on the website; paper can't open a fold or tap an eye, so the folded lines, the eye and
 * the snippet behind it stay on the website.
 */
export function forOnePage(text: string, address: string, addresses: Set<string>, base: string): string {
  const id = sectionId(address);
  const pageUrl = new URL(base + address, "https://site.invalid");
  const withoutEyes = text
    .replace(/<button type="button" class="eye"[\s\S]*?<\/button>/g, "")
    .replace(/<div class="[^"]*\bstep-only\b[^"]*">[\s\S]*?<\/pre><\/div>/g, "")
    .replace(/<span class="folded" hidden>[^<]*<\/span>/g, "")
    .replace(/<button type="button" class="unfold">([^<]*)<\/button>/g, "$1");
  const withIds = withoutEyes.replace(/ id="([^"]+)"/g, ` id="${id}--$1"`);
  return withIds.replace(/ href="([^"]*)"/g, (whole, href: string) => {
    if (href.startsWith("#")) return ` href="#${id}--${href.slice(1)}"`;
    if (/^[a-z]+:/i.test(href)) return whole; // another site
    const url = new URL(href, pageUrl);
    if (!url.pathname.startsWith(base)) return whole;
    const target = url.pathname.slice(base.length).replace(/\.html$/, "");
    if (!addresses.has(target)) return whole;
    const fragment = url.hash ? `--${url.hash.slice(1)}` : "";
    return ` href="#${sectionId(target)}${fragment}"`;
  });
}

const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Writes print.html: the pages in order, after a list of them, styled like the site. */
export function writePrintPage(outDir: string, base: string, pages: PrintPage[]): void {
  const css = readdirSync(join(outDir, "assets")).find((f) => /^style\..+\.css$/.test(f));
  const addresses = new Set(pages.map((p) => p.address));
  const built = (a: string) => join(outDir, a === "" || a.endsWith("/") ? `${a}index.html` : `${a}.html`);
  const sections = pages.map((p) => {
    const text = forOnePage(docText(readFileSync(built(p.address), "utf8")), p.address, addresses, base);
    return `<section id="${sectionId(p.address)}" class="${p.part ? "part" : "page"}">${text}</section>`;
  });
  // the contents: each part with its lessons under it, as the sidebar has them
  const groups: { head: PrintPage; pages: PrintPage[] }[] = [];
  for (const p of pages) {
    if (p.part || groups.length === 0) groups.push({ head: p, pages: [] });
    else groups[groups.length - 1].pages.push(p);
  }
  const link = (p: PrintPage) => `<a href="#${sectionId(p.address)}">${escape(p.title)}</a>`;
  const contents = groups.map(({ head, pages }) => pages.length === 0
    ? `<li>${link(head)}</li>`
    : `<li>${link(head)}<ul>${pages.map((p) => `<li>${link(p)}</li>`).join("")}</ul></li>`);
  writeFileSync(join(outDir, "print.html"), `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>The Gray Tutor, on one page</title>
<link rel="icon" type="image/svg+xml" href="${base}logo.svg">
<link rel="stylesheet" href="${base}assets/${css}">
<script>
  // light or dark, as the reader's system is (the diagrams follow it too); light to print
  const dark = matchMedia("(prefers-color-scheme: dark)");
  const follow = () => document.documentElement.classList.toggle("dark", dark.matches);
  follow();
  dark.addEventListener("change", follow);
  addEventListener("beforeprint", () => document.documentElement.classList.remove("dark"));
  addEventListener("afterprint", follow);
</script>
<style>
  body { background: var(--vp-c-bg); }
  .one-page { max-width: 760px; margin: 0 auto; padding: 32px 24px 96px; } /* 24px: code blocks reach into it on phones */
  .one-page .note { color: var(--vp-c-text-2); }
  .one-page .contents > li { margin-top: 12px; font-weight: 600; }
  .one-page .contents li li { margin-top: 2px; font-weight: 400; }
  .one-page section.part { margin-top: 64px; padding-top: 32px; border-top: 1px solid var(--vp-c-divider); }
  .one-page section.page { margin-top: 48px; }
  @media print {
    .one-page { max-width: none; padding: 0; }
    .one-page .note, .header-anchor, .snippet-anchor, button.copy, span.lang { display: none; }
    .one-page section.part { break-before: page; border: 0; }
    .one-page div[class*="language-"] pre { white-space: pre-wrap; word-break: break-word; }
    /* a run's tabs (run-views.ts) all at once on paper, each under its title */
    .one-page .vp-code-group .tabs { display: none; }
    .one-page .vp-code-group div[class*="language-"] { display: block; }
    .one-page .vp-code-group div[data-tab]::before { content: attr(data-tab); display: block; font: 600 12px sans-serif; margin: 8px 0 2px; }
    .one-page .run-widget { border: 2px solid #888; border-left-width: 6px; border-radius: 10px; padding: 8px 12px; margin: 16px 0; }
  }
</style>
</head>
<body>
<div class="one-page vp-doc">
<h1>The Gray Tutor</h1>
<p class="note">The whole tutorial on one page: print it (most browsers can print to a PDF), or
save it to read offline. The website, with search and every snippet's whole file, is
<a href="${base}">here</a>.</p>
<ul class="contents">
${contents.join("\n")}
</ul>
${sections.join("\n")}
</div>
</body>
</html>
`);
}
