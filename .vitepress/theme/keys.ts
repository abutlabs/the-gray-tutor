// Keys, as in the Rust Book: left and right arrows turn the lessons, ? lists the keys. And
// the lesson you're on stays in view in the sidebar, however far down the list it is.

const KEYS = (): [string, string][] => [
  ["←", "previous lesson"],
  ["→", "next lesson"],
  [`/  or  ${/Mac|iP(hone|ad)/.test(navigator.platform) ? "⌘" : "Ctrl"} K`, "search"],
  ["Enter", "enlarge the picture you tabbed to"],
  ["R", "reading mode: hide the menus, or show them"],
  ["?", "these keys"],
  ["Esc", "close"],
];

/** Typing, using a shortcut, or scrolling a code block: then a key isn't ours to take. */
function busy(e: KeyboardEvent): boolean {
  const target = e.target instanceof Element ? e.target : null;
  return e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey
    || Boolean(target?.closest("input, textarea, select, [contenteditable], dialog, pre"));
}

/** The help: a dialog made on first use, closed by Esc, ?, or a click outside it. */
function toggleHelp(): void {
  let help = document.getElementById("keys-help") as HTMLDialogElement | null;
  if (!help) {
    help = document.createElement("dialog");
    help.id = "keys-help";
    help.innerHTML = `<h2>Keys</h2><dl>${KEYS().map(([k, what]) => `<dt>${k}</dt><dd>${what}</dd>`).join("")}</dl>`;
    help.addEventListener("click", (e) => { if (e.target === help) help!.close(); });
    document.body.append(help);
  }
  if (help.open) help.close();
  else help.showModal();
}

export function listenForKeys(): void {
  window.addEventListener("keydown", (e) => {
    if (e.key === "?" && document.querySelector("#keys-help[open]")) return toggleHelp();
    if (busy(e)) return;
    if (e.key === "?") return toggleHelp();
    if (e.shiftKey) return;
    const side = e.key === "ArrowLeft" ? "prev" : e.key === "ArrowRight" ? "next" : null;
    const link = side && document.querySelector<HTMLAnchorElement>(`.VPDocFooter .pager-link.${side}`);
    if (link) {
      e.preventDefault();
      link.click();
    }
  });
}

/**
 * Scrolls the sidebar so the current lesson sits in its middle, unless it's already in view.
 * The sidebar marks the lesson only once the page is running in the browser, and moves the
 * mark a moment after a new page opens, so it waits for the mark on this page, up to a second.
 */
export function revealActiveLesson(tries = 20): void {
  const sidebar = document.querySelector<HTMLElement>(".VPSidebar");
  const item = sidebar?.querySelector<HTMLElement>(".VPSidebarItem.is-active > .item");
  const marks = item?.querySelector<HTMLAnchorElement>("a.link");
  if (!sidebar || !item || !marks || new URL(marks.href).pathname !== location.pathname) {
    if (tries > 0) setTimeout(() => revealActiveLesson(tries - 1), 50);
    return;
  }
  const box = sidebar.getBoundingClientRect();
  const at = item.getBoundingClientRect();
  if (at.top >= box.top && at.bottom <= box.bottom) return;
  sidebar.scrollTop += at.top - box.top - (box.height - at.height) / 2;
}
