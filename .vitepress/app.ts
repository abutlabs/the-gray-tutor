// The site as an app a tablet can install (Chrome: "Install app" or "Add to home screen"):
// its manifest and its icons, the professor drawn on white, written into the built site.
// The app opens on the tutorial's first page in reading mode (theme/reading.ts), full
// screen, and the service worker (public/sw.js) lets it open with no network.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";

export const MANIFEST = "manifest.webmanifest";
const SIZES = [192, 512];

/** The manifest, for a site served at `base`. */
export function manifest(base: string): object {
  return {
    name: "The Gray Tutor",
    short_name: "Gray Tutor",
    description: "Build a JAM client in TypeScript, one Gray Paper rule at a time.",
    id: base,
    start_url: `${base}?read`,
    scope: base,
    display: "standalone",
    orientation: "any",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: SIZES.flatMap((size) => [
      { src: `${base}icons/icon-${size}.png`, sizes: `${size}x${size}`, type: "image/png", purpose: "any" },
      { src: `${base}icons/icon-${size}.png`, sizes: `${size}x${size}`, type: "image/png", purpose: "maskable" },
    ]),
  };
}

/** The logo with room around it, so a launcher's round or squircle mask doesn't cut it. */
export function iconSvg(logo: string): string {
  return logo.replace(/viewBox="[^"]*"/, 'viewBox="-14 -14 92 92"');
}

export function writeApp(outDir: string, base: string, logo: string): void {
  writeFileSync(join(outDir, MANIFEST), JSON.stringify(manifest(base), null, 2));
  mkdirSync(join(outDir, "icons"), { recursive: true });
  const svg = iconSvg(readFileSync(logo, "utf8"));
  for (const size of SIZES) {
    const png = new Resvg(svg, { background: "white", fitTo: { mode: "width", value: size } }).render().asPng();
    writeFileSync(join(outDir, "icons", `icon-${size}.png`), png);
  }
}
