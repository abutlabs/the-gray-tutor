// The debug launcher: three ▶ configurations in .vscode/launch.json that run, under the
// debugger, any npm script the lessons add, a whole block-import trace, or a fuzz session;
// and .vscode/launch.json.md, the sheet that says what each script shows and where to put a
// breakpoint for each station of a block import. Both are made from the lessons, so a script a
// lesson adds is in the list the moment it's written. tools/launcher.test.ts checks the files
// on disk are what this makes.
//
//   npm run launcher     rewrite both (the configurations not marked ▶ are kept as they are)

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { STATIONS, STEPS } from "../.vitepress/theme/import-line.ts";
import { ROOT, readParts } from "./lessons.ts";

export const LAUNCH = join(ROOT, ".vscode", "launch.json");
export const SHEET = join(ROOT, ".vscode", "launch.json.md");

/** The block-import traces in vectors/traces/, the ones `import` and `fuzz` take. */
export const FAMILIES = ["fallback", "safrole", "preimages", "preimages_light", "storage", "storage_light", "fuzzy", "fuzzy_light"];

/** A script a lesson adds: its name, its command, the lesson, and what its program says it does. */
export type Script = { name: string; command: string; lesson: { id: string; title: string; file: string }; part: string; about: string };

const SCRIPT = /^npm pkg set scripts\.([\w-]+)="(.+)"$/;

/** Every script the lessons add, in the order they add them (a later lesson's own copy of a
 *  package.json keeps the first), each with the header comment of the program it runs. */
export function lessonScripts(): Script[] {
  const scripts: Script[] = [];
  const header = new Map<string, string>(); // bin/NAME.ts: its opening comment, as last written
  for (const part of readParts()) {
    for (const l of part.lessons) {
      for (const s of l.steps) {
        if (s.kind === "file" && /^bin\/[\w-]+\.ts$/.test(s.path) && (s.op === "new" || s.op === "rewrite")) {
          header.set(s.path, opening(s.code));
        }
        if (s.kind !== "run") continue;
        for (const line of s.command.split("\n")) {
          const m = SCRIPT.exec(line.trim());
          if (!m || scripts.some((x) => x.name === m[1])) continue;
          const lesson = { id: l.id, title: l.title, file: l.file };
          scripts.push({ name: m[1], command: m[2], lesson, part: part.title, about: "" });
        }
      }
    }
  }
  for (const s of scripts) s.about = header.get(/bin\/[\w-]+\.ts/.exec(s.command)?.[0] ?? "") ?? "";
  return scripts;
}

/** A program's opening comment, up to its usage line, as its first sentence. */
function opening(code: string): string {
  const said: string[] = [];
  for (const line of code.split("\n")) {
    if (!line.startsWith("//") || line.startsWith("// Usage")) break;
    said.push(line.slice(2).trim());
  }
  return said.join(" ").split(/(?<=[.:])\s/)[0].replace(/:$/, "");
}

const SKIP = ["<node_internals>/**", "**/node_modules/**"];
const viaNpm = (name: string, args: string[]) => ({
  name, type: "node", request: "launch", cwd: "${workspaceFolder}/client", runtimeVersion: "26",
  runtimeExecutable: "npm", runtimeArgs: args, autoAttachChildProcesses: true, skipFiles: SKIP,
});

/** The ▶ configurations and the pickers they ask from. */
export function launcher(scripts: Script[]) {
  return {
    configurations: [
      viaNpm("▶ Any npm script (pick one)", ["run", "${input:script}"]),
      viaNpm("▶ Import a trace, block by block (lesson 19.4)", ["run", "import", "${input:family}"]),
      viaNpm("▶ Fuzz session: our fuzzer and our target (lesson 20.3)", ["run", "fuzz", "${input:family}"]),
    ],
    inputs: [
      {
        id: "script", type: "pickString", description: "Which npm script? Type to filter; a lesson you haven't reached hasn't added its script yet.",
        options: scripts.map((s) => ({ label: `${s.name} · ${s.lesson.id} ${s.lesson.title}`, value: s.name })),
      },
      { id: "family", type: "pickString", description: "Which block-import trace (vectors/traces/)?", options: FAMILIES, default: "safrole" },
    ],
  };
}

const HEAD = `// Run and Debug (⇧⌘D): pick a configuration, press F5. A breakpoint pauses the code on
// its line. Node runs the .ts files itself, so there's no build and no source maps.
// runtimeVersion "26" takes Node 26 from nvm, whatever your default Node is. What the
// code prints shows in the Debug Console: VS Code starts Node itself, with no shell in
// between, so your shell's startup files can't slow or break the launch.
// The three marked ▶ ask what to run: any npm script the lessons have added, a whole trace,
// or a fuzz session. launch.json.md, beside this file, says what each script shows and where
// to break in a block import. npm run launcher remakes the ▶ ones from the lessons.
`;

/** JSON as this file writes it: two spaces, and a short list of plain values on one line. */
export function format(value: unknown): string {
  return JSON.stringify(value, null, 2).replace(/\[\n\s+((?:"[^"\n]*"|[\d.]+)(?:,\n\s+(?:"[^"\n]*"|[\d.]+))*)\n\s+\]/g, (all, inner: string) => {
    const one = `[${inner.split(/,\n\s+/).join(", ")}]`;
    return one.length <= 80 ? one : all;
  });
}

/** launch.json with the ▶ configurations first and the rest as they were. */
export function launchFile(current: string, scripts: Script[]): string {
  const parsed = JSON.parse(current.replace(/^\s*\/\/.*$/gm, "")) as { configurations: { name: string }[] };
  const kept = parsed.configurations.filter((c) => !c.name.startsWith("▶"));
  const made = launcher(scripts);
  return `${HEAD}${format({ version: "0.2.0", configurations: [...made.configurations, ...kept], inputs: made.inputs })}\n`;
}

/** The sheet: the configurations, a breakpoint for each station of lesson 0.6, every script. */
export function sheet(scripts: Script[]): string {
  const link = (l: Script["lesson"]) => `[${l.id} ${l.title}](../lessons/${l.file})`;
  const out = [
    "# Debugging: the launcher and every npm script",
    "",
    "Run and Debug (⇧⌘D), pick a configuration, F5. A breakpoint is a click left of a line",
    "number; F10 steps over, F11 steps into, ⇧F11 steps out, F5 runs on. Hover a variable, or",
    "add it to *Watch*. To find a function, ⌘T (Ctrl+T) and type its name.",
    "",
    "| configuration | what it runs |",
    "| --- | --- |",
    "| ▶ Any npm script | any script below, from a list you can type to filter |",
    "| ▶ Import a trace, block by block | `npm run import <trace>`: 100 blocks, each into the state the one before left, each root against the trace's |",
    "| ▶ Fuzz session | `npm run fuzz <trace>`: our fuzzer starts our target and speaks fuzz-proto to it; a breakpoint in the target pauses it too |",
    "| Tests: all, Tests: the open file | `npm test`, or the test file open in the editor |",
    "| Program: the open file | the `bin/` program open in the editor |",
    "",
    "## Walk a block import",
    "",
    "Start *▶ Import a trace* with `safrole`, or *▶ Fuzz session* to come in through the",
    "target as the official fuzzer does, with a breakpoint in each station you want to stop",
    "at. The stations are [lesson 0.6](../lessons/00-start/06-how-a-block-is-imported.md)'s.",
    "",
    "| station | break in | refuses with |",
    "| --- | --- | --- |",
  ];
  STATIONS.forEach((s, i) => {
    const refuses = s.refuses.map((e) => `\`${e}\``).join(", ") || "—";
    out.push(`| ${i + 1} ${s.title[0].toLowerCase()}${s.title.slice(1)} | \`${s.ours.file}\` · \`${s.ours.fns.join("`, `")}\` | ${refuses} |`);
    if (s.id === "steps") {
      for (const p of STEPS) out.push(`| ↳ ${p.does} | \`${p.call}\` | ${p.refuses.map((e) => `\`${e}\``).join(", ") || "—"} |`);
    }
  });
  out.push(
    "",
    "- **To stop at one block:** right-click a breakpoint, *Edit Condition*, `block.header.slot === 37`.",
    "- **To print without stopping:** right-click left of a line, *Add Logpoint*, `slot {block.header.slot}`.",
    "- **To see a refusal:** *▶ Import a trace* with `fuzzy`. Its blocks 37 to 39 are refused,",
    "  `bad_code_hash`, by the guarantees' report checks; every other trace imports all 100.",
    "",
    "## Every npm script",
    "",
    "In the order the lessons add them. Each runs with `npm run <script>` in `client/`, or from",
    "*▶ Any npm script*, once you've reached its lesson.",
  );
  let part = "";
  for (const s of scripts) {
    if (s.part !== part) {
      part = s.part;
      out.push("", `### ${part}`, "", "| script | lesson | what it shows |", "| --- | --- | --- |");
    }
    const on = s.command.replace(/^node bin\/[\w-]+\.ts\s*/, "").replace(/\.\.\/vectors\//g, "");
    const about = s.about + (on && !s.command.startsWith("JAM_FUZZ") ? ` — on \`${on}\`` : "");
    out.push(`| \`${s.name}\` | ${link(s.lesson)} | ${about || `\`${s.command}\``} |`);
  }
  return `${out.join("\n")}\n`;
}

if (import.meta.main) {
  const scripts = lessonScripts();
  writeFileSync(LAUNCH, launchFile(readFileSync(LAUNCH, "utf8"), scripts));
  writeFileSync(SHEET, sheet(scripts));
  console.log(`${scripts.length} scripts: .vscode/launch.json and .vscode/launch.json.md`);
}
