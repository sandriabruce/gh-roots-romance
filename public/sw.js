// Minimal service worker for PWA installability. No caching to avoid stale content.
self.addEventListener("install", (e) => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => { /* pass-through */ });