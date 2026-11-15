// The installed app's service worker (theme/reading.ts registers it): every page and file
// the reader opens is kept, so the app still opens, and those lessons still read, with no
// network. A page is fetched fresh when the network answers, so a new deploy shows at once;
// a build's files (assets/, named by their content) never change, so the kept copy is used.

const CACHE = "the-gray-tutor-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) if (name !== CACHE) await caches.delete(name);
    await self.clients.claim();
  })());
});

async function keep(request, response) {
  if (response.ok && response.type === "basic") {
    const cache = await caches.open(CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

async function fresh(request) {
  try {
    return await keep(request, await fetch(request));
  } catch (error) {
    const kept = await caches.match(request, { ignoreSearch: true });
    if (kept) return kept;
    // a page never opened: the start page, if it was kept, rather than the browser's error
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
  const path = new URL(request.url).pathname;
  event.respondWith(path.includes("/assets/") ? kept(request) : fresh(request));
});
