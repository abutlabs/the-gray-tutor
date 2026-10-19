// Every Run block runs in client/ (tools/verify.ts runs it there), and the website's label
// says so, "Run in client/" (config.ts, snippetLabels): npm test at the repo root runs the
// tutorial's own checks instead, hundreds of them, not the client's.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { readParts, ROOT } from "./lessons.ts";

test("no Run block leaves client/, so its label can say it runs there", () => {
  const lessons = readParts().flatMap((p) => p.lessons);
  let runs = 0;
  for (const l of lessons) {
    const text = readFileSync(join(ROOT, "lessons", l.file), "utf8");
    for (const m of text.matchAll(/^\*\*Run(?:, expect it to fail)?\*\*\n\n```sh\n([\s\S]*?)```/gm)) {
      runs++;
      assert.doesNotMatch(m[1], /^\s*cd\b|^\s*\.\.\//m, `${l.file}: a Run block that leaves client/`);
    }
  }
  assert.ok(runs > 100, `${runs} Run blocks`);
  const config = readFileSync(join(ROOT, ".vitepress/config.ts"), "utf8");
  assert.match(config, /if \(m\[1\]\.startsWith\("Run"\)\) \{[\s\S]*?where\.content = " in ";[\s\S]*?folder\.content = "client\/";/);
  assert.match(readFileSync(join(ROOT, "lessons/00-start/01-what-you-will-build.md"), "utf8"), /^- \*\*Run\*\*: type it in a terminal in `client\/`\./m);
});
