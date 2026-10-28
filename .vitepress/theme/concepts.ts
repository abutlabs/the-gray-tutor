// Concepts only: a reader who wants the Gray Paper's ideas first, the code later (on a phone,
// say), folds every code block away. A snippet keeps its label line, which a tap opens and
// closes; the byte tables and a run's output stay, since they show the concept. The choice
// is kept for the visit (off by default: a fresh visit always shows the code), and HEAD
// (config.ts puts it in <head>) applies it before the page draws, so a folded page never
// flashes its code first.
//
// A link can carry the mode, ?concepts (concepts-link.ts has the rules); while the mode is on,
// the address bar says ?concepts, so a reader shares a folded page by copying it.

import { CLASS, KEY, linkFor } from "./concepts-link.ts";

export { KEY };

/** Puts the mode in the address bar, without a new history entry or a reload. */
export function showInAddress(on: boolean): void {
  const next = linkFor(location.href, on);
  if (next !== location.href) history.replaceState(history.state, "", next);
}

/** Whether the page is in concepts-only mode. */
export const conceptsOn = (): boolean => document.documentElement.classList.contains(CLASS);

/** Turns concepts-only mode on or off, remembers it for the visit, and says so in the
 *  address. Off by default: a fresh visit always starts with the code shown. */
export function setConcepts(on: boolean): void {
  document.documentElement.classList.toggle(CLASS, on);
  try {
    sessionStorage.setItem(KEY, on ? "on" : "off");
  } catch {} // no storage (a private window): it lasts until the page is closed
  showInAddress(on);
}

/** In concepts-only mode, a tap on a snippet's label shows or folds its code. */
export function listenForSnippetTaps(): void {
  document.addEventListener("click", (event) => {
    if (!conceptsOn()) return;
    const label = (event.target as Element).closest?.(".vp-doc p.snippet-label:not(.output)");
    if (!label) return;
    event.preventDefault(); // its links (the legend, the snippet's own anchor) wait for full mode
    label.classList.toggle("shown");
    label.setAttribute("aria-expanded", String(label.classList.contains("shown")));
  });
}
