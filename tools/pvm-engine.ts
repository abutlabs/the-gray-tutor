// The PVM Playground's engine: the tutorial's own PVM, not a second one. It applies every
// lesson's snippets, as `npm run verify` does, and copies out the files the PVM and its host
// calls need into .vitepress/theme/pvm-engine/, because the site is built where neither
// client/ nor reference/ exists. tools/pvm-engine.test.ts fails if the copy and the lessons
// ever differ.
//
//   npm run pvm-engine        writes the files

import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, normalize } from "node:path";
import { readLessons, ROOT } from "./lessons.ts";
import { applyStep } from "./tangle.ts";

/** Where the engine's files live, each at its path under the client. */
export const ENGINE = join(ROOT, ".vitepress/theme/pvm-engine");

/** What the playground runs: the PVM and the host calls. The rest follows from their imports. */
const ROOTS = [
  "src/host.ts",
  "src/pvm/arithmetic.ts",
  "src/pvm/bits.ts",
  "src/pvm/gas.ts",
  "src/pvm/instructions.ts",
  "src/pvm/machine.ts",
  "src/pvm/memory.ts",
  "src/pvm/program.ts",
  "src/pvm/standard.ts",
];

/** The relative imports of a file, types too: the copy has to typecheck on its own. */
function imports(path: string, code: string): string[] {
  const found = [...code.matchAll(/^import .* from "(\.[^"]+)";$/gm)];
  return found.map((m) => normalize(join(dirname(path), m[1])));
}

/** The engine's files, by path under the client, from the lessons as they stand. */
export function engineFiles(): Map<string, string> {
  const dir = mkdtempSync(join(tmpdir(), "pvm-engine-"));
  try {
    for (const lesson of readLessons()) {
      for (const step of lesson.steps) {
        if (step.kind === "file" && step.path.startsWith("src/")) applyStep(dir, step);
      }
    }
    const files = new Map<string, string>();
    const visit = (path: string) => {
      if (files.has(path)) return;
      const code = readFileSync(join(dir, path), "utf8");
      files.set(path, code);
      imports(path, code).forEach(visit);
    };
    ROOTS.forEach(visit);
    return files;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const files = engineFiles();
  rmSync(ENGINE, { recursive: true, force: true });
  for (const [path, code] of files) {
    mkdirSync(dirname(join(ENGINE, path)), { recursive: true });
    writeFileSync(join(ENGINE, path), code);
  }
  console.log(`${files.size} files in .vitepress/theme/pvm-engine/`);
}
