// Notes in ink, for a tablet's pen (a BOOX's, an iPad's): the pen writes on the lesson, a
// finger still scrolls. A short tap of the pen still follows a link or presses a button, and
// the pen's side button (or its eraser end) rubs ink out. Each stroke is tied to the
// paragraph it was written beside and scaled with the text's column, so it stays beside it
// when the tablet turns or full screen changes the width. The notes are kept in this
// browser (IndexedDB), offline; ✎ in the corner lists them, and exports or imports them
// as one file (ReadToggle.vue).

/** A stroke: the block it belongs to (its place among the page's blocks and the start of its
 *  text), the column's width when it was written, and its points, x from the column's left
 *  and y from the block's top, in px at that width, flattened [x0, y0, x1, y1, …]. */
export type Stroke = { b: number; k: string; w: number; p: number[] };
export type PageNotes = { path: string; title: string; updated: number; strokes: Stroke[] };
export type NotesFile = { notes: "the-gray-tutor"; version: 1; pages: PageNotes[] };

const DB = "the-gray-tutor-notes";
const STORE = "pages";
const TAP_MOVE = 6; // px: a pen touch that moves less, and lifts quickly, is a tap
const TAP_TIME = 350; // ms
const ERASE_REACH = 14; // px around the pen's point that the eraser takes

// ── storage ──────────────────────────────────────────────────────────────────────────

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: "path" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function run<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const request = work(db.transaction(STORE, mode).objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const allNotes = (): Promise<PageNotes[]> => run("readonly", (s) => s.getAll() as IDBRequest<PageNotes[]>);
const readPage = (path: string) => run("readonly", (s) => s.get(path) as IDBRequest<PageNotes | undefined>);
const writePage = (page: PageNotes) => run("readwrite", (s) => s.put(page));
export const deletePage = (path: string) => run("readwrite", (s) => s.delete(path));

/** The page's key: its address, without .html or the query. */
export function pageKey(pathname: string): string {
  return decodeURI(pathname).replace(/\.html$/, "").replace(/\/index$/, "/");
}

/** Merges an exported file in: a page keeps whichever copy was written last. */
export async function importNotes(file: NotesFile): Promise<number> {
  if (file?.notes !== "the-gray-tutor" || !Array.isArray(file.pages)) throw new Error("not a Gray Tutor notes file");
  const mine = new Map((await allNotes()).map((p) => [p.path, p]));
  let taken = 0;
  for (const page of file.pages) {
    if ((mine.get(page.path)?.updated ?? 0) >= page.updated) continue;
    await writePage(page);
    taken++;
  }
  await showPage();
  return taken;
}

export async function exportNotes(): Promise<NotesFile> {
  return { notes: "the-gray-tutor", version: 1, pages: await allNotes() };
}

// ── where a stroke goes ─────────────────────────────────────────────────────────────

function column(): HTMLElement | null {
  return document.querySelector<HTMLElement>(".VPDoc .vp-doc");
}

function blocks(doc: HTMLElement): HTMLElement[] {
  const inner = doc.querySelector<HTMLElement>(":scope > div") ?? doc;
  return Array.from(inner.children).filter((e): e is HTMLElement => e instanceof HTMLElement);
}

const blockKey = (e: HTMLElement) => `${e.tagName}:${(e.textContent ?? "").trim().slice(0, 48)}`;

/** The block a stroke belongs to now: the one with its text, nearest its old place, else the
 *  one at its old place (the page has changed), else the last. */
function findBlock(all: HTMLElement[], stroke: Stroke): HTMLElement | undefined {
  let best: HTMLElement | undefined;
  let gap = Infinity;
  all.forEach((e, i) => {
    if (blockKey(e) === stroke.k && Math.abs(i - stroke.b) < gap) { best = e; gap = Math.abs(i - stroke.b); }
  });
  return best ?? all[Math.min(stroke.b, all.length - 1)];
}

/** The block at a height on the page: the one it falls in, else the nearest above it. */
function blockAt(all: HTMLElement[], y: number): number {
  let at = 0;
  all.forEach((e, i) => { if (e.getBoundingClientRect().top <= y) at = i; });
  return at;
}

// ── drawing ──────────────────────────────────────────────────────────────────────────

let layer: SVGSVGElement | null = null;
let page: PageNotes | null = null;
let drawn: { stroke: Stroke; points: number[] }[] = []; // each stroke's points on screen now, in the layer's px

function ensureLayer(): SVGSVGElement {
  if (layer?.isConnected) return layer;
  layer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  layer.classList.add("ink-layer");
  layer.setAttribute("aria-hidden", "true");
  document.body.append(layer);
  return layer;
}

const pathData = (p: number[]) =>
  p.length === 2 ? `M${p[0]} ${p[1]}h0.1` : p.reduce((d, v, i) => d + (i % 2 ? ` ${v}` : `${i ? "L" : "M"}${v}`), "");

/** Lays the layer over the text's column and draws the page's strokes where their blocks are. */
export function drawInk(): void {
  const doc = column();
  const svg = ensureLayer();
  if (!doc || !page?.strokes.length) {
    svg.replaceChildren();
    svg.style.display = "none";
    drawn = [];
    return;
  }
  const box = doc.getBoundingClientRect();
  Object.assign(svg.style, {
    display: "block",
    left: `${box.left + scrollX}px`,
    top: `${box.top + scrollY}px`,
    width: `${box.width}px`,
    height: `${box.height}px`,
  });
  const all = blocks(doc);
  drawn = [];
  const paths: SVGPathElement[] = [];
  for (const stroke of page.strokes) {
    const block = findBlock(all, stroke);
    if (!block) continue;
    const top = block.getBoundingClientRect().top - box.top;
    const scale = box.width / stroke.w;
    const points = stroke.p.map((v, i) => (i % 2 ? top + v * scale : v * scale));
    drawn.push({ stroke, points });
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathData(points));
    paths.push(path);
  }
  svg.replaceChildren(...paths);
}

let watching: ResizeObserver | null = null;

/** Loads this page's notes and draws them; again whenever the column changes size. */
export async function showPage(): Promise<void> {
  const path = pageKey(location.pathname);
  try {
    page = (await readPage(path)) ?? { path, title: "", updated: 0, strokes: [] };
  } catch {
    page = { path, title: "", updated: 0, strokes: [] }; // no storage: ink lasts until the page closes
  }
  watching?.disconnect();
  const doc = column();
  if (doc) {
    watching = new ResizeObserver(() => drawInk());
    watching.observe(doc);
  }
  drawInk();
}

async function save(): Promise<void> {
  if (!page) return;
  page.title = document.title.replace(/\s*\|.*$/, "");
  page.updated = Date.now();
  try {
    if (page.strokes.length) await writePage(page);
    else await deletePage(page.path);
  } catch {} // no storage: kept on screen only
  window.dispatchEvent(new CustomEvent("ink-change"));
}

export async function clearPage(): Promise<void> {
  if (!page) return;
  page.strokes = [];
  drawInk();
  await save();
}

export const pageHasInk = () => Boolean(page?.strokes.length);

// ── the pen ──────────────────────────────────────────────────────────────────────────

type Pen = { id: number; erase: boolean; x: number; y: number; t: number; moved: boolean; points: number[]; live?: SVGPathElement };
let pen: Pen | null = null;

/** What the pen should work as normal on: controls, and the widgets' own drawing areas. */
const NATIVE = "a, button, input, select, textarea, summary, label, [role=button], [contenteditable], canvas, .ink-free";

function start(e: PointerEvent): void {
  if (e.pointerType !== "pen" || !e.isPrimary) return;
  const target = e.target instanceof Element ? e.target : null;
  // anywhere on the lesson, its margins too, but not on the menus or a control
  const area = document.querySelector(".VPDoc");
  if (!column() || !target || !area?.contains(target) || target.closest(NATIVE)) return;
  pen = { id: e.pointerId, erase: Boolean(e.buttons & 32 || e.buttons & 2), x: e.clientX, y: e.clientY, t: e.timeStamp, moved: false, points: [] };
  e.preventDefault();
  if (pen.erase) eraseAt(e.clientX, e.clientY);
  else addPoint(e.clientX, e.clientY);
}

function addPoint(x: number, y: number): void {
  if (!pen) return;
  const box = column()!.getBoundingClientRect();
  pen.points.push(Math.round((x - box.left) * 10) / 10, Math.round((y - box.top) * 10) / 10);
  const svg = ensureLayer();
  if (svg.style.display !== "block") {
    page ??= { path: pageKey(location.pathname), title: "", updated: 0, strokes: [] };
    Object.assign(svg.style, { display: "block", left: `${box.left + scrollX}px`, top: `${box.top + scrollY}px`, width: `${box.width}px`, height: `${box.height}px` });
  }
  if (!pen.live) {
    pen.live = document.createElementNS("http://www.w3.org/2000/svg", "path");
    svg.append(pen.live);
  }
  pen.live.setAttribute("d", pathData(pen.points));
}

function move(e: PointerEvent): void {
  if (!pen || e.pointerId !== pen.id) return;
  e.preventDefault();
  if (Math.hypot(e.clientX - pen.x, e.clientY - pen.y) > TAP_MOVE) pen.moved = true;
  for (const each of e.getCoalescedEvents?.() ?? [e]) {
    if (pen.erase) eraseAt(each.clientX, each.clientY);
    else addPoint(each.clientX, each.clientY);
  }
}

function end(e: PointerEvent): void {
  if (!pen || e.pointerId !== pen.id) return;
  const done = pen;
  pen = null;
  if (e.type === "pointercancel") { done.live?.remove(); return; }
  if (!done.moved && e.timeStamp - done.t < TAP_TIME) {
    // a tap, not a note: what a finger's tap would have done
    done.live?.remove();
    const under = document.elementFromPoint(done.x, done.y);
    under?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window, clientX: done.x, clientY: done.y }));
    return;
  }
  if (done.erase) { void save(); return; }
  const doc = column();
  if (!doc || !page) return;
  // the stroke belongs to the block beside its first point, from that block's top
  const box = doc.getBoundingClientRect();
  const all = blocks(doc);
  const b = blockAt(all, box.top + done.points[1]);
  const top = all[b] ? all[b].getBoundingClientRect().top - box.top : 0;
  const p = done.points.map((v, i) => (i % 2 ? Math.round((v - top) * 10) / 10 : v));
  page.strokes.push({ b, k: all[b] ? blockKey(all[b]) : "", w: Math.round(box.width), p });
  drawInk();
  void save();
}

function eraseAt(x: number, y: number): void {
  const box = column()?.getBoundingClientRect();
  if (!box || !page) return;
  const px = x - box.left;
  const py = y - box.top;
  const hit = drawn.filter(({ points }) => {
    for (let i = 0; i < points.length; i += 2) if (Math.hypot(points[i] - px, points[i + 1] - py) < ERASE_REACH) return true;
    return false;
  });
  if (!hit.length) return;
  const gone = new Set(hit.map((h) => h.stroke));
  page.strokes = page.strokes.filter((s) => !gone.has(s));
  drawInk();
}

/** The pen's events. The pen's touch is kept from scrolling the page (a finger's isn't). */
export function listenForPen(): void {
  if (!("PointerEvent" in window)) return;
  document.addEventListener("pointerdown", start, { passive: false });
  document.addEventListener("pointermove", move, { passive: false });
  document.addEventListener("pointerup", end);
  document.addEventListener("pointercancel", end);
  // Chrome sends a pen's touch as touch events too, after its pointerdown: stopping the
  // first one is what keeps the page from scrolling under the pen
  document.addEventListener("touchstart", (e) => { if (pen) e.preventDefault(); }, { passive: false });
  document.addEventListener("touchmove", (e) => { if (pen) e.preventDefault(); }, { passive: false });
  addEventListener("resize", () => drawInk());
}
