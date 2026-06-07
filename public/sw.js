// Eorzea Advisor service worker — makes the web app installable + offline-able.
// Strategy:
//   • navigations        → network-first (always try for the freshest app)
//   • _next/static assets → cache-first (content-hashed, immutable)
//   • bundled data JSON   → stale-while-revalidate (instant, refreshes in bg)
//   • /api/*              → network-only (live data, never cached)
const CACHE = "ea-cache-v1";

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["/"])));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

function isStaticAsset(url) {
  return url.pathname.startsWith("/_next/static") || url.pathname.startsWith("/icons/") || url.pathname === "/icon.png";
}
function isData(url) {
  return /^\/(bestiary|leves|mounts|crafting)\//.test(url.pathname);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // let cross-origin (images/APIs) pass through
  if (url.pathname.startsWith("/api/")) return; // live data — network only

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          caches.open(CACHE).then((c) => c.put("/", res.clone()));
          return res;
        })
        .catch(() => caches.match("/").then((m) => m || caches.match(request)))
    );
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((hit) => hit || fetch(request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(request, copy));
        return res;
      }))
    );
    return;
  }

  if (isData(url)) {
    event.respondWith(
      caches.match(request).then((hit) => {
        const net = fetch(request).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
          return res;
        }).catch(() => hit);
        return hit || net;
      })
    );
  }
});
