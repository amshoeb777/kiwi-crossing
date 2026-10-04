/* Kiwi Crossing service worker.
   - App shell: pre-cached in a versioned cache so the app opens offline. On activate, every older
     "ctd-…" cache (and the retired "ctdglass-…" preview cache) is deleted.
   - Pages: network-first (so updates appear straight away), falling back to the cache when offline.
   - Other same-origin files: cache-first.
   - Exchange-rate APIs (and any other cross-origin request): NOT handled or cached here, so the app
     only ever shows a genuinely live rate. Offline, the request fails and the app uses its saved default. */
const VERSION = "ctd-8eef6b204d";
const SHELL = [
  "./", "./index.html", "./privacy.html", "./manifest.webmanifest", "./favicon.ico",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/maskable-192.png", "./icons/maskable-512.png",
  "./icons/apple-touch-icon.png", "./icons/favicon-32.png", "./icons/icon.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => (k.startsWith("ctd-") || k.startsWith("ctdglass-")) && k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;          // live exchange rates etc.: straight to the network

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then(res => { if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); } return res; })
        .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match("./index.html")))
    );
    return;
  }
  event.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok && res.type === "basic") { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    }))
  );
});
