/** SCWIS optional service worker shell; forwards all requests normally and never caches /api. */

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
