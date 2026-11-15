// Reading mode, for a tablet or an e-reader's browser: the sidebar, the top bar and the
// "On this page" column go, and the lesson takes the whole screen in larger type, with no
// animations to smear an e-ink screen. The R key or the round button in the corner
// (ReadToggle.vue) switches it, and the choice rides along from page to page. ?read in the
// address turns it on, ?read=0 off; the installed app (manifest.webmanifest) opens in it.

import { READ_CLASS, READ_KEY } from "./reading-head.ts";

export function readingOn(): boolean {
  return document.documentElement.classList.contains(READ_CLASS);
}

export function setReading(on: boolean): void {
  document.documentElement.classList.toggle(READ_CLASS, on);
  try {
    localStorage.setItem(READ_KEY, on ? "on" : "off");
  } catch {} // no storage (a private window): it lasts until the page is closed
  window.dispatchEvent(new CustomEvent("reading-change"));
  // the text's width changed: what fits itself to it on a resize (the formulas, the side
  // arrows, the widgets) fits again
  window.dispatchEvent(new Event("resize"));
}

/** R switches reading mode, unless the key is someone else's (typing, a shortcut). */
export function listenForReadKey(): void {
  window.addEventListener("keydown", (e) => {
    const target = e.target instanceof Element ? e.target : null;
    if (e.key !== "r" || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    if (target?.closest("input, textarea, select, [contenteditable], dialog")) return;
    setReading(!readingOn());
  });
}

/** The service worker that lets the installed app open with no network (public/sw.js). */
export function registerServiceWorker(base: string): void {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register(`${base}sw.js`, { scope: base }).catch(() => {});
}
