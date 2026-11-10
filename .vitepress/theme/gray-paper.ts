// The Gray Paper's quotes (tools/gray-paper-text.ts): a word underlined in the paper's text,
// or a symbol in one of its formulas, shows what it means in a small bubble, on hover with a
// mouse and on a tap with a finger (a phone has no hover). A symbol's meaning is its row in
// the page's key, where the page first keyed it.

let bubble: HTMLElement | undefined;
let owner: Element | undefined;
/** the bubble came from a mouse hovering, so a click on the same thing keeps it */
let hovered = false;

function hide(): void {
  bubble?.remove();
  bubble = undefined;
  owner = undefined;
}

function show(target: Element, html: string): void {
  hide();
  owner = target;
  bubble = document.createElement("div");
  bubble.className = "gp-bubble";
  bubble.setAttribute("role", "tooltip");
  bubble.innerHTML = html;
  document.body.append(bubble);
  const r = target.getBoundingClientRect();
  const w = bubble.offsetWidth;
  const left = Math.max(8, Math.min(window.scrollX + r.left, window.scrollX + document.documentElement.clientWidth - w - 8));
  bubble.style.left = `${left}px`;
  bubble.style.top = `${window.scrollY + r.bottom + 6}px`;
}

/** What a word or symbol means, as HTML for the bubble; undefined if it has none. */
function meaning(el: Element): string | undefined {
  if (el.matches("abbr.gp-term")) {
    const text = el.getAttribute("data-means") ?? el.getAttribute("title") ?? "";
    // the title is moved aside, so the browser's own tooltip doesn't show beside the bubble
    if (el.hasAttribute("title")) { el.setAttribute("data-means", text); el.removeAttribute("title"); }
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  }
  const name = [...el.classList].find((c) => c.startsWith("gk-"));
  const row = name && document.getElementById(name)?.closest("tr");
  if (!row) return undefined;
  const cells = row.querySelectorAll("td");
  return `${cells[2]?.innerHTML ?? ""}<span class="gp-bubble-say">say “${cells[1]?.textContent ?? ""}”</span>`;
}

function target(e: Event): Element | undefined {
  const el = (e.target as Element | null)?.closest?.("abbr.gp-term, .gray-paper .gp-sym");
  return el ?? undefined;
}

export function listenForGlossTaps(): void {
  document.addEventListener("pointerover", (e) => {
    if ((e as PointerEvent).pointerType !== "mouse") return;
    const el = target(e);
    if (!el || el === owner) return;
    const html = meaning(el);
    if (html) { show(el, html); hovered = true; }
  });
  document.addEventListener("pointerout", (e) => {
    if ((e as PointerEvent).pointerType !== "mouse") return;
    if (owner && target(e) === owner && !owner.contains((e as PointerEvent).relatedTarget as Node)) hide();
  });
  document.addEventListener("click", (e) => {
    const el = target(e);
    if (!el) { if (bubble && !bubble.contains(e.target as Node)) hide(); return; }
    if (el === owner) { if (hovered) hovered = false; else hide(); return; }
    const html = meaning(el);
    if (html) { e.preventDefault(); show(el, html); hovered = false; }
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") hide(); });
}
