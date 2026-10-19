// Which Gray Paper sections each lesson is about, read from the lesson's own citations
// ("§11 (*Work Report*)", "Appendix C", "App. A.6"): its prose, not its code, lasair's folds
// or its checks. config.ts hands the result to the theme, which puts a lesson's sections at
// its top (GrayPaperRefs.vue), a part's under its name in the sidebar, and every section on
// the Gray Paper map page (GrayPaperMap.vue). tools/gray-paper.test.ts checks the titles
// against the Gray Paper 0.8.0 tex.

/** A section of the Gray Paper 0.8.0: "§11" or "App C", its title, and a page anchor. */
export interface Section { id: string; title: string; anchor: string }

const NUMBERED = [
  "Introduction", "Previous Work and Present Trends", "Notational Conventions", "Overview", "The Header",
  "Block Production and Chain Growth", "Recent History", "Authorization", "Service Accounts",
  "Disputes, Verdicts and Judgments", "Reporting and Assurance", "Accumulation", "Statistics",
  "Work Packages and Work Reports", "Guaranteeing", "Availability Assurance", "Auditing and Judging",
  "Beefy Distribution", "Grandpa and the Best Chain", "Discussion", "Conclusion", "Acknowledgements",
];
const APPENDICES = [
  "Polkadot Virtual Machine", "Virtual Machine Invocations", "Serialization Codec", "State Merklization",
  "General Merklization", "Shuffling", "Bandersnatch VRF", "Erasure Coding", "Index of Notation",
];

export const SECTIONS: Section[] = [
  ...NUMBERED.map((title, i) => ({ id: `§${i + 1}`, title, anchor: `s${i + 1}` })),
  ...APPENDICES.map((title, i) => ({ id: `App ${String.fromCharCode(65 + i)}`, title, anchor: `app-${String.fromCharCode(97 + i)}` })),
];
const ORDER = new Map(SECTIONS.map((s, i) => [s.id, i]));

/** The sections a lesson cites, in the Gray Paper's order. */
export function cited(markdown: string): string[] {
  const prose = markdown.replace(/```[\s\S]*?```|<details>[\s\S]*?<\/details>|::: check[\s\S]*?\n:::/g, "");
  const ids = new Set<string>();
  for (const m of prose.matchAll(/§\s?(\d+)(?:\.\d+)*|\bApp(?:endix|\.)\s?([A-I])\b/g)) ids.add(m[1] ? `§${m[1]}` : `App ${m[2]}`);
  return sorted([...ids]);
}

/** Section ids in the Gray Paper's order; an unknown one (a typo) last, so a test can find it. */
export const sorted = (ids: string[]): string[] => [...ids].sort((a, b) => (ORDER.get(a) ?? 1e9) - (ORDER.get(b) ?? 1e9));

/** A section as the site writes it: "§11", "App. C". */
export const label = (id: string): string => id.replace("App ", "App. ");

/** The sections no lesson cites, and why a block importer leaves them out. */
export const BESIDE: Record<string, string> = {
  "§1": "the introduction", "§2": "the history before JAM", "§15": "what guarantors do off the chain",
  "§16": "how validators share the pieces", "§17": "auditing, off the chain", "§18": "signing for bridges",
  "§19": "choosing the best chain", "§20": "the discussion", "§21": "the conclusion", "§22": "the thanks",
  "App H": "erasure coding, done beside block import (lesson 3.3 shows the idea)",
};
