// The playground's engine is the lessons' PVM, byte for byte: run `npm run pvm-engine` after
// changing a lesson's PVM or host code.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { ENGINE, engineFiles } from "./pvm-engine.ts";
import { ROOT } from "./lessons.ts";

/** Every file under a folder, by path relative to it. */
function walk(dir: string, from = dir): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path, from) : [relative(from, path)];
  });
}

test("the playground's engine is the lessons' code, every file, byte for byte", () => {
  const files = engineFiles();
  assert.deepEqual(walk(ENGINE).sort(), [...files.keys()].sort());
  for (const [path, code] of files) {
    assert.equal(readFileSync(join(ENGINE, path), "utf8"), code, `${path}: npm run pvm-engine`);
  }
});

test("the engine is the finished client's, where that client is here", (t) => {
  const reference = join(ROOT, "reference");
  if (!existsSync(reference)) return t.skip("no reference/");
  const noComments = (code: string) => code.replace(/^\s*\/\/.*\n/gm, ""); // it trails on wording
  for (const [path, code] of engineFiles()) {
    assert.equal(noComments(readFileSync(join(reference, path), "utf8")), noComments(code), path);
  }
});
