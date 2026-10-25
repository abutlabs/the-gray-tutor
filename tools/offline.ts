// Fetches everything the tutorial needs from the network, so a flight can't stop a lesson
// (the appendix, lessons/offline.md):
//
//   npm run offline
//
// 1. the tutorial's own packages: npm install at the root
// 2. every package the lessons add to your client, into npm's cache: installed in a
//    scratch folder, so client/ is left alone, then installed again with --offline to
//    prove the cache holds them all
// 3. the test vectors: npm run vectors
// 4. the stack's Docker images: ./obs up, in ../observability
//
// Each step runs even if one before it failed, and the list at the end says which are ready.

import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { clientPackages, ROOT } from "./lessons.ts";

const OBS = join(ROOT, "..", "observability", "obs");

/** Runs a command where its output shows; true if it succeeded. */
function run(cwd: string, command: string, ...args: string[]): boolean {
  console.log(`\n$ ${[command, ...args].join(" ")}`);
  return spawnSync(command, args, { cwd, stdio: "inherit" }).status === 0;
}

/** Installs the client's packages into a fresh scratch folder; true if npm succeeded. */
function installClientPackages(packages: Record<string, string>, ...flags: string[]): boolean {
  const dir = mkdtempSync(join(tmpdir(), "gray-tutor-offline-"));
  try {
    writeFileSync(join(dir, "package.json"), JSON.stringify({ private: true, dependencies: packages }));
    return run(dir, "npm", "install", "--no-audit", "--no-fund", "--ignore-scripts", ...flags);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const ready: [string, string | null][] = []; // what, and why it isn't ready (null: it is)

console.log("1. The tutorial's own packages");
ready.push(["the tutorial's packages", run(ROOT, "npm", "install", "--no-audit", "--no-fund") ? null : "npm install failed"]);

console.log("\n2. Your client's packages, into npm's cache");
const packages = clientPackages();
const names = Object.entries(packages).map(([name, version]) => `${name}@${version}`).join(" ");
ready.push([
  `your client's packages (${names})`,
  !installClientPackages(packages) ? "npm couldn't fetch them"
    : !installClientPackages(packages, "--offline") ? "fetched, but npm install --offline still can't find them all"
    : null,
]);

console.log("\n3. The test vectors");
ready.push(["the test vectors", run(ROOT, "npm", "run", "vectors") ? null : "npm run vectors failed"]);

console.log("\n4. The stack's Docker images");
ready.push([
  "the stack's Docker images",
  !existsSync(OBS) ? `no ${OBS}: clone abutlabs/observability next to the tutorial, as lesson 0.2 does`
    : !run(dirname(OBS), OBS, "up") ? "./obs up failed: is Docker running?"
    : null,
]);

console.log("\nReady for the plane?");
for (const [what, why] of ready) console.log(why ? `  ✘ ${what}: ${why}` : `  ✔ ${what}`);
if (ready.some(([, why]) => why)) process.exit(1);
console.log("\nAll set. Offline, type npm install --offline wherever a lesson says npm install.");
