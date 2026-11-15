// The installed app's service worker (theme/reading.ts registers it). Once installed it
// fetches the whole site in the background, every file named in offline.json (written by
// the build, .vitepress/app.ts), so the app opens, and every lesson reads, with no network.
// Each page that opens tells it to check for a newer build, and it fetches only the files
// that build changed. A page is fetched fresh while the network answers, so a deploy shows
// at once; a build's files (assets/, named by their content) never change, so the kept copy
// is used. It tells the open pages how far the saving has got (ReadToggle.vue shows it).

const CACHE = "the-gray-tutor-v1";
const LIST = "offline.json";
const BUILT = self.registration.scope + "offline-built"; // the build whose files are all kept

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) if (name !== CACHE) await caches.delete(name);
    await self.clients.claim();
  })());
  event.waitUntil(saveAll());
});
self.addEventListener("message", (event) => {
  if (event.data === "save-offline") event.waitUntil(saveAll());
});

async function tell(message) {
  for (const client of await self.clients.matchAll()) client.postMessage(message);
}

let saving = null;
function saveAll() {
  saving ??= save().catch(() => tell({ offline: "failed" })).finally(() => { saving = null; });
  return saving;
}

/** Fetches every file of the newest build that isn't kept yet, then drops the ones it no
 *  longer names. Stops quietly with no network; the next page to open tries again. */
async function save() {
  const scope = self.registration.scope;
  const response = await fetch(scope + LIST, { cache: "no-store" });
  if (!response.ok) return;
  const { built, urls } = await response.json();
  const cache = await caches.open(CACHE);
  const builtNow = await cache.match(BUILT);
  if (builtNow && (await builtNow.text()) === built) return tell({ offline: "ready", total: urls.length });

  const origin = new URL(scope).origin;
  const wanted = new Set(urls.map((url) => origin + url));
  const missing = [];
  for (const url of wanted) {
    // a page may have changed between builds; a file in assets/ never does
    if (!url.includes("/assets/") || !(await cache.match(url))) missing.push(url);
  }
  let done = urls.length - missing.length;
  let failed = 0;
  await tell({ offline: "saving", done, total: urls.length });
  const next = () => missing.shift();
  await Promise.all(Array.from({ length: 6 }, async () => {
    for (let url = next(); url; url = next()) {
      try {
        const got = await fetch(url, { cache: "no-cache" });
        if (got.ok) await cache.put(url, got);
        else failed++;
      } catch {
        failed++;
      }
      if (++done % 25 === 0) await tell({ offline: "saving", done, total: urls.length });
    }
  }));
  if (failed) return tell({ offline: "failed", done: done - failed, total: urls.length });
  for (const request of await cache.keys()) {
    if (request.url !== BUILT && !wanted.has(request.url.split("?")[0])) await cache.delete(request);
  }
  await cache.put(BUILT, new Response(built));
  await tell({ offline: "ready", total: urls.length });
}

async function keep(request, response) {
  if (response.ok && response.type === "basic") {
    const cache = await caches.open(CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

/** The kept copy of a page, by its address with or without .html or a trailing slash. */
async function keptPage(request) {
  const url = new URL(request.url);
  url.search = "";
  const path = url.pathname;
  const tries = [path, path.replace(/\.html$/, ""), path.replace(/\/$/, ""), path.endsWith("/") ? path : path + "/"];
  for (const tryPath of tries) {
    const kept = await caches.match(url.origin + tryPath);
    if (kept) return kept;
  }
  return null;
}

async function fresh(request) {
  try {
    // a page waits on a slow network no more than a few seconds before the kept copy is used
    const slow = new AbortController();
    const timer = setTimeout(() => slow.abort(), (await keptPage(request)) ? 4000 : 30000);
    try {
      return await keep(request, await fetch(request, { signal: slow.signal }));
    } finally {
      clearTimeout(timer);
    }
  } catch (error) {
    const kept = (await caches.match(request, { ignoreSearch: true })) ?? (await keptPage(request));
    if (kept) return kept;
    // a page that isn't kept: the start page, if it is, rather than the browser's error
    if (request.mode === "navigate") {
      const start = await caches.match(self.registration.scope);
      if (start) return start;
    }
    throw error;
  }
}

async function kept(request) {
  return (await caches.match(request)) ?? keep(request, await fetch(request));
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || !request.url.startsWith(self.registration.scope)) return;
  if (new URL(request.url).pathname.endsWith("/" + LIST)) return; // always the network's
  event.respondWith(new URL(request.url).pathname.includes("/assets/") ? kept(request) : fresh(request));
});
