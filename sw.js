// sw.js — Service Worker (PWA + Offline-first)
const CACHE_VERSION = "wc2026-v2.0.0";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./bracket.html",
  "./manifest.json",
  "./src/main.js",
  "./src/data/teams.js",
  "./src/data/matches.js",
  "./src/data/groups.js",
  "./src/data/stadiums.js",
  "./src/core/store.js",
  "./src/core/api.js",
  "./src/core/i18n.js",
  "./src/utils/utils.js",
  "./src/components/MatchCard.js",
  "./src/pages/Home.js",
  "./src/pages/Bracket.js",
  "./src/styles/tokens.css",
  "./src/styles/base.css",
  "./src/styles/components.css",
  "./src/styles/bracket.css"
];

const RUNTIME_CACHE = "wc2026-runtime-v1";
const API_CACHE = "wc2026-api-v1";

// Install
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k !== CACHE_VERSION && k !== RUNTIME_CACHE && k !== API_CACHE)
          .map((k) => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

// Fetch — Stale-While-Revalidate for assets, Network-First for API
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // API calls: Network-first, fallback to cache
  if (url.hostname.includes("espn.com") || url.hostname.includes("anthropic.com") || url.hostname.includes("flagcdn.com")) {
    event.respondWith(networkFirst(req, API_CACHE));
    return;
  }

  // JS/CSS: Stale-while-revalidate
  if (url.pathname.endsWith(".js") || url.pathname.endsWith(".css")) {
    event.respondWith(staleWhileRevalidate(req, CACHE_VERSION));
    return;
  }

  // HTML: Network-first
  if (req.mode === "navigate") {
    event.respondWith(networkFirst(req, CACHE_VERSION));
    return;
  }

  // Default: Stale-while-revalidate
  event.respondWith(staleWhileRevalidate(req, RUNTIME_CACHE));
});

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const networkPromise = fetch(req).then((res) => {
    if (res.ok) cache.put(req, res.clone());
    return res;
  }).catch(() => null);
  return cached || networkPromise || new Response("Offline", { status: 503 });
}

async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (e) {
    const cached = await cache.match(req);
    return cached || new Response("Offline", { status: 503 });
  }
}
