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
  document.documentElement.classList.remove(CONTENTS_CLASS);
  try {
    localStorage.setItem(READ_KEY, on ? "on" : "off");
  } catch {} // no storage (a private window): it lasts until the page is closed
  window.dispatchEvent(new CustomEvent("reading-change"));
  // the text's width changed: what fits itself to it on a resize (the formulas, the side
  // arrows, the widgets) fits again
  window.dispatchEvent(new Event("resize"));
}

export const CONTENTS_CLASS = "reading-contents";

/** The contents, in reading mode: the sidebar's list of lessons, over the page, until a
 *  lesson is chosen or the page behind is tapped. */
export function contentsOpen(): boolean {
  return document.documentElement.classList.contains(CONTENTS_CLASS);
}

export function setContents(open: boolean): void {
  document.documentElement.classList.toggle(CONTENTS_CLASS, open);
  window.dispatchEvent(new CustomEvent("reading-change"));
}

/** Opens the site's search box, as Ctrl K does (its button is in the hidden top bar). */
export function openSearch(): void {
  setContents(false);
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", code: "KeyK", ctrlKey: true, bubbles: true }));
}

/** R switches reading mode, unless the key is someone else's (typing, a shortcut). */
export function listenForReadKey(): void {
  window.addEventListener("keydown", (e) => {
    const target = e.target instanceof Element ? e.target : null;
    if (e.key === "Escape" && contentsOpen()) return setContents(false);
    if (e.key !== "r" || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    if (target?.closest("input, textarea, select, [contenteditable], dialog")) return;
    setReading(!readingOn());
  });
}

export type OfflineStatus = { offline: "saving" | "ready" | "failed"; done?: number; total?: number };

/** The service worker that saves the whole site for reading with no network (public/sw.js).
 *  Each time the site opens, it is asked to fetch whatever a newer build changed; what it
 *  says of its progress goes to the page as an "offline-status" event (ReadToggle.vue). */
export function registerServiceWorker(base: string): void {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.addEventListener("message", (e) => {
    window.dispatchEvent(new CustomEvent<OfflineStatus>("offline-status", { detail: e.data }));
  });
  navigator.serviceWorker.register(`${base}sw.js`, { scope: base })
    .then(() => navigator.serviceWorker.ready)
    .then((registration) => registration.active?.postMessage("save-offline"))
    .catch(() => {});
}
