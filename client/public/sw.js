/** SCWIS demo: optional offline shell; never caches /api. */
const CACHE = "scwis-shell-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) =>
      Promise.all(["/", "/index.html"].map((p) => c.add(p).catch(() => {}))),
    ),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.pathname.startsWith("/api")) return;

  event.respondWith(
    fetch(request)
      .then((res) => res)
      .catch(async () => {
        const cache = await caches.open(CACHE);
        const cached = await cache.match(request);
        if (cached) return cached;
        if (request.mode === "navigate") {
          const fallback = await cache.match("/index.html");
          if (fallback) return fallback;
        }
        return Response.error();
      }),
  );
});
