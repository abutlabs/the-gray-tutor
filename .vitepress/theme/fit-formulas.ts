// The Gray Paper's widest formulas (D.2 is 1,200 px across) ran out of their box and over the
// outline. A displayed formula wider than its column is now drawn smaller, to fit (fit.ts has
// the rule); a click on it, or Enter, opens it full size in a box that scrolls, and a click
// outside or Esc closes that. A formula that fits is left alone. A symbol's own tap (its
// meaning, theme/gray-paper.ts) still works on a shrunk formula.

import { fitScale } from "./fit.ts";

const FORMULA = '.vp-doc mjx-container[display="true"]';

/** Shrinks one formula to its column, or puts it back at full size if it fits now. */
function fit(formula: HTMLElement): void {
  const column = formula.parentElement;
  if (!column) return;
  formula.style.removeProperty("zoom"); // measure it at full size
  const style = getComputedStyle(column);
  const available = column.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
  const drawing = formula.querySelector("svg");
  const natural = Math.max(formula.scrollWidth, formula.offsetWidth, drawing ? drawing.getBoundingClientRect().width : 0);
  const scale = fitScale(natural, available);
  if (scale === 1) {
    for (const name of ["data-fit", "tabindex", "role", "aria-label", "title"]) formula.removeAttribute(name);
    formula.style.removeProperty("--fit");
    return;
  }
  formula.style.setProperty("--fit", String(scale));
  formula.style.setProperty("zoom", String(scale));
  formula.setAttribute("data-fit", "");
  formula.tabIndex = 0;
  formula.setAttribute("role", "button");
  formula.setAttribute("aria-label", "Formula drawn smaller to fit: open it full size");
  formula.title = "Drawn smaller to fit. Click to open it full size.";
}

/** Fits every displayed formula on the page. */
export function fitFormulas(): void {
  for (const formula of document.querySelectorAll<HTMLElement>(FORMULA)) {
    if (!formula.closest("#formula-zoom")) fit(formula);
  }
}

let viewer: HTMLDialogElement | undefined;

/** The formula at full size, in a box that scrolls both ways. */
function enlarge(formula: HTMLElement): void {
  if (!viewer) {
    viewer = document.createElement("dialog");
    viewer.id = "formula-zoom";
    viewer.addEventListener("click", (e) => { if (e.target === viewer) viewer!.close(); });
    document.body.append(viewer);
  }
  const close = document.createElement("button");
  close.type = "button";
  close.className = "close";
  close.textContent = "Close";
  close.addEventListener("click", () => viewer!.close());
  const copy = formula.cloneNode(true) as HTMLElement;
  for (const name of ["data-fit", "tabindex", "role", "aria-label", "title", "id"]) copy.removeAttribute(name);
  copy.style.removeProperty("zoom");
  copy.style.removeProperty("--fit");
  const box = document.createElement("div");
  box.className = "formula";
  box.append(copy);
  viewer.replaceChildren(close, box);
  viewer.showModal();
}

/** The shrunk formula a click or a key landed on; not one of its glossed symbols, whose tap
 *  shows the symbol's meaning instead. */
function shrunk(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element) || target.closest(".gp-sym")) return null;
  return target.closest<HTMLElement>(`${FORMULA}[data-fit]`);
}

export function listenForFormulas(): void {
  document.addEventListener("click", (e) => {
    const formula = shrunk(e.target);
    if (formula) enlarge(formula);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const formula = e.target instanceof HTMLElement && e.target.matches(`${FORMULA}[data-fit]`) ? e.target : null;
    if (!formula) return;
    e.preventDefault();
    enlarge(formula);
  });
  // a formula in a fold is 0 wide until the fold opens (toggle doesn't bubble: capture it)
  document.addEventListener("toggle", () => fitFormulas(), true);
  // the column's width changes with the window, the sidebar and the code switch
  let width = 0;
  const refit = () => {
    const now = document.querySelector(".vp-doc")?.clientWidth ?? 0;
    if (now === width) return;
    width = now;
    fitFormulas();
  };
  addEventListener("resize", refit);
  if (typeof ResizeObserver !== "undefined") new ResizeObserver(refit).observe(document.body);
}
