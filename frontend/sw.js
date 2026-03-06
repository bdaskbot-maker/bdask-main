// ============================================
// BdAsk Service Worker v2
// Enables offline support for Bangladesh's unreliable networks
// ============================================

const CACHE_NAME = 'bdask-v2';
const STATIC_CACHE = 'bdask-static-v2';
const API_CACHE = 'bdask-api-v2';

// Static assets to cache on install
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/manifest.json',
    '/src/utils/errorHandler.js',
    '/src/utils/appInit.js',
    '/og-image.svg',
];

// ---- INSTALL ----
self.addEventListener('install', (event) => {
    console.log('[SW] Installing BdAsk Service Worker v2...');
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// ---- ACTIVATE ----
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...');
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys
                    .filter((key) => key !== STATIC_CACHE && key !== API_CACHE)
                    .map((key) => {
                        console.log('[SW] Removing old cache:', key);
                        return caches.delete(key);
                    })
            );
        }).then(() => self.clients.claim())
    );
});

// ---- FETCH ----
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // API requests: Network first, fall back to cache
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirstStrategy(request));
        return;
    }

    // Static assets: Cache first, fall back to network
    event.respondWith(cacheFirstStrategy(request));
});

// ---- STRATEGIES ----

// Network first (for API data - always try fresh data first)
async function networkFirstStrategy(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(API_CACHE);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.log('[SW] Network failed, trying cache for:', request.url);
        const cachedResponse = await caches.match(request);
        if (cachedResponse) return cachedResponse;
        return new Response(
            JSON.stringify({
                error: true,
                message_bn: 'ইন্টারনেট সংযোগ নেই। অফলাইন ডেটা দেখাচ্ছি।',
                message_en: 'No internet connection. Showing offline data.',
                offline: true
            }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
    }
}

// Cache first (for static assets - faster load)
async function cacheFirstStrategy(request) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        if (request.mode === 'navigate') {
            return caches.match('/index.html');
        }
        return new Response('Offline', { status: 503 });
    }
}
