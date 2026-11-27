// Service worker: network-first for the app's own files, falling back to the cache when offline.
// Every successful load refreshes the cache, so a new deploy is picked up on the next online visit
// without bumping a version. Supabase API calls (another origin) are not touched; the app keeps
// its own copy of the directory for offline viewing.
const CACHE_NAME = 'app-shell';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.add('./')));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(networkFirst(request));
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  // fetch() rejects only when the network is unreachable: that is exactly when we serve the cache.
  const response = await fetch(request).catch(() => null);
  if (response !== null) {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }
  const cached = (await cache.match(request)) ?? (request.mode === 'navigate' ? await cache.match('./') : undefined);
  return cached ?? Response.error();
}
