// One run, one widget (.vitepress/run-views.ts): a three-tab group and the Run and Output after it
// render as one framed group of five tabs, the command first, while the lesson's source keeps
// them apart for tools/verify.ts and tools/bin-io.test.ts.

import { test } from "node:test";
import assert from "node:assert/strict";
import { createMarkdownRenderer } from "vitepress";
import type MarkdownIt from "markdown-it";
import { runViews } from "../.vitepress/run-views.ts";
import { LESSONS, lessonText } from "./lessons.ts";

// the site's renderer, with this pass; VitePress ships its own markdown-it types (see albert.test.ts)
const md = await createMarkdownRenderer(LESSONS, { math: false }, "/") as unknown as MarkdownIt;
runViews(md);
const render = (src: string, page = "a/b.md") => md.render(src, { relativePath: page });
const tabs = (html: string) => [...html.matchAll(/<label data-title="([^"]+)"/g)].map((m) => m[1]);

const ONE_RUN = `Lead in.

::: code-group

\`\`\`json [what goes in]
{ "slot": 1 }
\`\`\`

\`\`\`ts [what it computes]
const computed = { slot: 1 };
\`\`\`

\`\`\`text [what comes out]
slot 1
\`\`\`

:::

The walk from input to output.

**Run**

\`\`\`sh
npm pkg set scripts.now="node bin/now.ts"
npm run now
\`\`\`

\`\`\`text
slot 1
done
\`\`\`
`;

test("a group and the Run and Output after it become one framed widget of five tabs, the command first", () => {
  const html = render(ONE_RUN);
  assert.deepEqual(tabs(html), ["run in client/", "what goes in", "what it computes", "what comes out", "output"]);
  assert.match(html, /<div class="run-widget" id="run-now">\n<p class="run-widget-title">▶ One run of <code>npm run now<\/code>/);
  assert.ok(!/<p>.*\*\*Run\*\*|<strong>Run<\/strong>/.test(html), "the Run label went into the tab");
  assert.match(html, /data-tab="output"[\s\S]*done/, "the whole output, all its lines, is the last tab");
  // every block knows its tab's title, for print and the e-book
  for (const title of tabs(html)) assert.ok(html.includes(`data-tab="${title}"`), title);
  // the walk prose stays after the widget
  assert.ok(html.indexOf("The walk from input to output.") > html.indexOf("</div>\n"), "prose after the widget");
});

test("a run that fails on purpose says so in its tab; a group with no Run after it is left alone", () => {
  assert.equal(tabs(render(ONE_RUN.replace("**Run**", "**Run, expect it to fail**")))[0], "run, expect it to fail");
  const alone = render("::: code-group\n\n```json [what goes in]\n{}\n```\n\n:::\n\n## Next\n\n**Run**\n\n```sh\nnpm run now\n```\n");
  assert.ok(!alone.includes("run-widget"), "a heading in between: not this group's run");
  const other = render("::: code-group\n\n```js [a]\n1\n```\n\n```js [b]\n2\n```\n\n:::\n\n**Run**\n\n```sh\nnpm run now\n```\n");
  assert.ok(!other.includes("run-widget"), "an ordinary code group is not a run's");
});

test("two runs of one script on a page get their own anchors", () => {
  const html = render(`${ONE_RUN}\n${ONE_RUN.replace("npm run now", "npm run now 3")}`);
  assert.match(html, /id="run-now"/);
  assert.match(html, /id="run-now-2"/);
});

test("lesson 10.1 renders its run as one widget: verdicts-progress, five tabs", () => {
  const html = render(lessonText("10-disputes/01-votes-and-verdicts.md"), "10-disputes/01-votes-and-verdicts.md");
  assert.match(html, /<div class="run-widget" id="run-verdicts-progress">/);
  const group = html.slice(html.indexOf('id="run-verdicts-progress"'));
  assert.deepEqual(tabs(group).slice(0, 5), ["run in client/", "what goes in", "what it computes", "what comes out", "output"]);
});
