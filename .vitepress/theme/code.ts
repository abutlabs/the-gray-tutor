// The Code switch and the client picker, in the browser (code-link.ts has the rules, and
// says why). Code is off by default: every snippet is folded to its label, which a tap opens
// and closes; the byte tables and a run's output stay, since they show the idea. The switch
// shows all the code, and the picker says whose: the client the lessons build, or another
// one a lesson quotes beside it. Both choices are kept on this browser, and HEAD (config.ts
// puts it in <head>) applies them before the page draws, so nothing flashes.
//
// A link can carry them, ?code and ?client=<id>; while they are on, the address bar says
// so, and a reader shares a page as they see it by copying it.

import { CLASS, CLIENT_ATTR, CLIENT_KEY, clientOr, DEFAULT_CLIENT, KEY, linkFor, OTHER_CLASS } from "./code-link.ts";

/** Whether the code is on show. */
export const codeOn = (): boolean => !document.documentElement.classList.contains(CLASS);

/** The client whose code is chosen. */
export const chosenClient = (): string => clientOr(document.documentElement.getAttribute(CLIENT_ATTR));

/** Puts the choices in the address bar, without a new history entry or a reload. */
export function showInAddress(): void {
  const next = linkFor(location.href, codeOn(), chosenClient());
  if (next !== location.href) history.replaceState(history.state, "", next);
}

function save(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {} // no storage (a private window): it lasts until the page is closed
}

/** Shows or folds the code, remembers it, and says so in the address. */
export function setCode(on: boolean): void {
  document.documentElement.classList.toggle(CLASS, !on);
  save(KEY, on ? "on" : "off");
  showInAddress();
}

/** Chooses whose code to show, remembers it, and says so in the address. */
export function setClient(id: string): void {
  const client = clientOr(id);
  document.documentElement.setAttribute(CLIENT_ATTR, client);
  document.documentElement.classList.toggle(OTHER_CLASS, client !== DEFAULT_CLIENT);
  save(CLIENT_KEY, client);
  openChosenFolds();
  showInAddress();
}

/** A client quoted in a fold (lasair's) has its folds open while it is the chosen one, and
 *  closed again, if the picker opened them, when it isn't. Called when a page arrives. */
export function openChosenFolds(): void {
  const client = chosenClient();
  for (const fold of document.querySelectorAll<HTMLDetailsElement>(`.vp-doc details[${CLIENT_ATTR}]`)) {
    const chosen = fold.getAttribute(CLIENT_ATTR) === client;
    if (chosen && !fold.open) {
      fold.open = true;
      fold.setAttribute("data-opened-by-picker", "");
    } else if (!chosen && fold.hasAttribute("data-opened-by-picker")) {
      fold.open = false;
      fold.removeAttribute("data-opened-by-picker");
    }
  }
}

/** A snippet that is folded (the code is off, or the picker is on another client) opens and
 *  closes with a tap on its label. With the code on, the label's links work as links. */
export function listenForSnippetTaps(): void {
  document.addEventListener("click", (event) => {
    const label = (event.target as Element).closest?.(".vp-doc p.snippet-label:not(.output)");
    if (!label) return;
    const ours = !label.parentElement?.classList.contains("client-code");
    const folded = !codeOn() || (ours && chosenClient() !== DEFAULT_CLIENT);
    if (!folded) return;
    event.preventDefault(); // its links (the legend, the snippet's own anchor) wait for the code to be on
    label.classList.toggle("shown");
    label.setAttribute("aria-expanded", String(label.classList.contains("shown")));
  });
}
