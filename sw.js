/* FORGE — service worker : l'app fonctionne hors connexion */
const CACHE = "forge-v4";
const ASSETS = [
  "./", "index.html", "style.css", "manifest.webmanifest",
  "js/data.js", "js/store.js", "js/logic.js", "js/ui.js", "js/session.js",
  "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(ASSETS.map((u) => c.add(new Request(u, { cache: "reload" }))))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

// Réponse immédiate depuis le cache, mise à jour en arrière-plan quand il y a du réseau
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req, { ignoreSearch: true });
      const fresh = fetch(req).then((res) => { if (res && res.ok) cache.put(req, res.clone()); return res; }).catch(() => null);
      return cached || (await fresh) || (await cache.match("index.html"));
    })
  );
});
