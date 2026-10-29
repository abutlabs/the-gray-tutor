// Albert, the professor in the logo, with a face for each moment, as the Rust Book's Ferris
// has. Every face is the logo's own hair and head, only the features changed, so they can't
// drift apart: tools/diagrams.ts writes the logo and the faces from here, and
// tools/diagrams.test.ts checks the committed files are what this file draws.
//
// Which face goes where is .vitepress/albert.ts: the tongue for the scoreboard, a playful mix
// of the others for a run that fails on purpose, a Break it section and a check.

/** Albert's faces. The tongue is the scoreboard's; the rest take turns. */
export type Face = "tongue" | "oh" | "puzzled" | "wink" | "eyebrow" | "hmm";
export const FACES: Face[] = ["tongue", "oh", "puzzled", "wink", "eyebrow", "hmm"];
export const MIXED: Face[] = ["oh", "puzzled", "wink", "eyebrow", "hmm"];

/** How each face looks, in words: its alt text in lesson 0.1. */
export const LOOKS: Record<Face, string> = {
  tongue: "Albert sticking his tongue out",
  oh: "Albert, eyebrows up, mouth in a little O",
  puzzled: "Albert frowning under a question mark",
  wink: "Albert winking",
  eyebrow: "Albert with one eyebrow raised",
  hmm: "Albert looking up, thinking",
};

/** Where Albert shows up. */
export type Moment = "scoreboard" | "fails" | "break" | "question" | "says";

/** What he says there, on hover and to a screen reader. */
export const QUIPS: Record<Moment, string[]> = {
  scoreboard: ["The scoreboard climbed!", "Count them!", "More green!", "Look at that board!"],
  fails: ["Red on purpose.", "Oh! That's meant to happen.", "Watch it fail.", "Red already?"],
  break: ["Go on, break it.", "Oops, on purpose.", "What could go wrong?"],
  question: ["Your turn.", "Think it over.", "Hmm, which one?", "Prove it."],
  says: ["Albert says."], // a quote of his own: albert.ts shows his words instead
};

/** Albert at the nth moment on a page: the same every build, and never the same face twice
 * in a row on one page. */
export function albertFor(moment: Moment, page: string, n: number): { face: Face; quip: string } {
  const turn = hash(page) + n;
  const quips = QUIPS[moment];
  return {
    face: moment === "scoreboard" ? "tongue" : MIXED[turn % MIXED.length],
    quip: quips[turn % quips.length],
  };
}

// FNV-1a: a page's own starting face, so every page doesn't open with the same one
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (const c of s) h = Math.imul(h ^ c.codePointAt(0)!, 0x01000193) >>> 0;
  return h;
}

// ---- drawing ---------------------------------------------------------------------------

const INK = "#2a2a30", BROW = "#8f8f99", HAIR = "#b9b9c2", SKIN = "#efc9a6", MOUSTACHE = "#f4f4f6";
const TONGUE = "#d9606e", TONGUE_LINE = "#a8404d";

// hair: eight swept locks, then the puff, cut away where the face sits
const HAIR_PATH = "M16.5 36.5 Q9.4 38.1 6.0 43.4 Q8.6 37.3 12.5 32.6 Z M15.4 29.6 Q6.8 27.8 -0.4 31.0 Q6.5 26.6 14.0 24.2 Z M19.1 23.1 Q12.5 18.1 5.2 18.2 Q12.7 16.9 19.9 17.5 Z M26.0 18.9 Q22.5 11.4 16.0 8.1 Q23.2 10.4 29.3 14.3 Z M36.0 14.5 Q41.9 9.2 50.6 8.3 Q44.3 12.9 39.1 19.2 Z M45.1 18.3 Q52.3 16.4 59.9 19.8 Q52.7 20.8 45.6 23.9 Z M50.5 25.3 Q58.1 26.6 63.9 32.8 Q56.6 30.8 48.7 30.6 Z M51.4 33.3 Q56.0 36.8 56.6 43.7 Q52.6 39.6 47.2 36.9 Z M11.9 37.7 A4.4 4.4 0 0 1 8.7 30.6 A5.0 5.0 0 0 1 12.9 23.8 A4.6 4.6 0 0 1 17.1 16.7 A6.3 6.3 0 0 1 27.2 14.9 A5.7 5.7 0 0 1 37.2 13.6 A5.7 5.7 0 0 1 45.0 18.5 A5.0 5.0 0 0 1 52.6 23.2 A4.7 4.7 0 0 1 54.0 30.6 A4.1 4.1 0 0 1 52.5 37.8 L44 37 A12 14 0 0 0 20 37 Z";
const MOUSTACHE_PATH = "M23.5 44.6 Q27.5 40.4 32 42.8 Q36.5 40.4 40.5 44.6 Q36.5 46.2 32 44.6 Q27.5 46.2 23.5 44.6 Z";
const NOSE_PATH = "M30.6 39.4 Q32 41 33.4 39.4";

/** Line weights and dot sizes: the logo's, or the bold cut's, which reads at 44 px. */
type Cut = { stroke: number; dot: number };
const LOGO: Cut = { stroke: 1, dot: 1 };
const BOLD: Cut = { stroke: 1.7, dot: 1.45 };

const num = (x: number) => String(Math.round(x * 100) / 100);

function features(face: Face | "neutral", cut: Cut): string {
  const brows = (d: string) =>
    `<path d="${d}" fill="none" stroke="${BROW}" stroke-width="${num(2.6 * cut.stroke)}" stroke-linecap="round"/>`;
  const line = (d: string, width = 1.8, colour = INK) =>
    `<path d="${d}" fill="none" stroke="${colour}" stroke-width="${num(width * cut.stroke)}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const eye = (cx: number, cy: number, r: number) => `<circle cx="${num(cx)}" cy="${num(cy)}" r="${num(r * cut.dot)}" fill="${INK}"/>`;
  const eyes = (r = 1.6, dx = 0, dy = 0) => eye(27 + dx, 34.6 + dy, r) + eye(37 + dx, 34.6 + dy, r);
  const nose = line(NOSE_PATH);
  const moustache = `<path fill="${MOUSTACHE}" d="${MOUSTACHE_PATH}"/>`;
  switch (face) {
    case "neutral":
      return brows("M23.5 30.6 Q27 27 30.5 29.8 M33.5 29.8 Q37 27 40.5 30.6") + eyes() + nose + moustache
        + line("M28.8 48 Q32 50 35.2 48");
    case "tongue": // brows up, eyes wide, mouth open, the tongue down over the chin
      return brows("M23 29.2 Q27 24.6 30.6 28.2 M33.4 28.2 Q37 24.6 41 29.2") + eyes(1.9, 0, -0.3) + nose
        + `<path d="M26.6 45.2 Q32 46.4 37.4 45.2 Q36.6 50.2 32 50.6 Q27.4 50.2 26.6 45.2 Z" fill="${INK}"/>`
        + `<path d="M28.6 47.4 Q28.4 55.6 32 56.2 Q35.6 55.6 35.4 47.4 Q32 46.4 28.6 47.4 Z" fill="${TONGUE}"/>`
        + line("M32 48.6 L32 53.4", 1.1, TONGUE_LINE) + moustache;
    case "oh": // brows up, a little round mouth
      return brows("M23.5 29.4 Q27 25.8 30.5 28.6 M33.5 28.6 Q37 25.8 40.5 29.4") + eyes(1.8) + nose + moustache
        + `<ellipse cx="32" cy="48.6" rx="${num(1.9 * cut.dot)}" ry="${num(2.2 * cut.dot)}" fill="${INK}"/>`;
    case "puzzled": // brows down to the middle, a wobbly mouth, and a question mark over the hair
      return brows("M23.5 29.4 Q27 29 30.5 31.4 M33.5 31.4 Q37 29 40.5 29.4") + eyes() + nose + moustache
        + line("M28.6 49.4 Q30.4 47.6 32 48.6 Q33.6 49.6 35.4 47.8")
        + `<path d="M2.6 6.4 Q2.6 1.6 7.4 1.6 Q12 1.6 12 5.8 Q12 8.6 8.8 9.8 Q7.4 10.4 7.4 12.6" fill="none" stroke="${INK}" stroke-width="2.8" stroke-linecap="round"/>`
        + `<circle cx="7.4" cy="16.6" r="1.7" fill="${INK}"/>`;
    case "wink": // the left eye shut, a crooked smile
      return brows("M23.5 31.2 Q27 29.6 30.5 31.4 M33.5 29.4 Q37 26.4 40.5 30.2")
        + line("M25 35 Q27 36.4 29 35", 1.7) + eye(37, 34.6, 1.6) + nose + moustache
        + line("M28.4 47.6 Q31.6 49.6 35.8 46.8");
    case "eyebrow": // the right brow way up, a flat mouth
      return brows("M23.5 31 Q27 30 30.5 31 M33.5 28.6 Q37 23.8 40.5 27.8") + eyes(1.6, 0.6) + nose + moustache
        + line("M29 48.4 L35 47.6");
    case "hmm": // eyes up and to the side, a small doubtful mouth
      return brows("M23.5 29.8 Q27 26.8 30.5 29.2 M33.5 29.2 Q37 26.8 40.5 29.8") + eyes(1.6, 1.2, -1.4) + nose + moustache
        + line("M30.2 48.4 Q32 47.6 33.8 48.4");
  }
}

function head(label: string, size: string, face: Face | "neutral", cut: Cut): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"${size} role="img" aria-label="${label}">
  <title>${label}</title>
  <path fill="${HAIR}" d="${HAIR_PATH}"/>
  <ellipse cx="32" cy="37" rx="12" ry="14" fill="${SKIN}"/>
  ${features(face, cut).replace(/><(?=[a-z])/g, ">\n  <")}
</svg>
`;
}

/** The logo: Albert as he is, at the logo's own weights. */
export const drawLogo = (): string => head("The Gray Tutor", "", "neutral", LOGO);

/** One of Albert's faces, in the bold cut, 64 px unless shown smaller. */
export const drawFace = (face: Face): string => head(LOOKS[face], ' width="64" height="64"', face, BOLD);

const WOOD = "#b08354", WOOD_DARK = "#7c5733";

/**
 * Albert the judge, for Part 10: one eyebrow up, a gavel raised over its block. The gavel
 * (with the fist holding it) is its own <g class="gavel">, hinged at the fist, and the
 * impact lines are <g class="bang">, so AlbertJudge.vue can slam it on hover.
 */
export function drawJudge(): string {
  const label = "Albert the judge in his robe, one eyebrow up, gavel raised";
  const robe = `<g class="robe">`
    + `<path d="M11 64 Q12.5 52.5 23.5 49.2 Q32 54.5 40.5 49.2 Q50 51.8 52.5 58 L54 64 Z" fill="${INK}"/>`
    + `<path d="M29.4 49.8 L34.6 49.8 L33.5 58 L30.5 58 Z" fill="${MOUSTACHE}" stroke="${BROW}" stroke-width="0.8"/>`
    + `<path d="M32 49.8 L32 58" fill="none" stroke="${BROW}" stroke-width="0.8"/>`
    + `</g>`;
  const arm = `<path d="M50 60 Q62 54 68 42" fill="none" stroke="${INK}" stroke-width="6.6" stroke-linecap="round"/>`;
  const gavel = `<g class="gavel">`
    + `<circle cx="69" cy="40" r="4.2" fill="${SKIN}"/>`
    + `<path d="M71 37 L83 23" fill="none" stroke="${WOOD_DARK}" stroke-width="3" stroke-linecap="round"/>`
    + `<rect x="78" y="16.75" width="14" height="8.5" rx="2.6" fill="${WOOD}" stroke="${WOOD_DARK}" stroke-width="1.2" transform="rotate(41 85 21)"/>`
    + `</g>`;
  const block = `<ellipse cx="84" cy="58.5" rx="9" ry="3.2" fill="${WOOD}" stroke="${WOOD_DARK}" stroke-width="1.2"/>`;
  const bang = `<g class="bang" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round">`
    + `<path d="M73 51 L69.5 47.5"/><path d="M83 48.5 L83 44"/><path d="M93 51 L96.5 47.5"/>`
    + `</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 64" role="img" aria-label="${label}">
  <title>${label}</title>
  <path fill="${HAIR}" d="${HAIR_PATH}"/>
  <ellipse cx="32" cy="37" rx="12" ry="14" fill="${SKIN}"/>
  ${features("eyebrow", BOLD).replace(/><(?=[a-z])/g, ">\n  <")}
  ${robe}
  ${arm}
  ${block}
  ${bang}
  ${gavel}
</svg>
`;
}
