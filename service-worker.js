const CACHE_NAME = 'gestion-horaires-v4';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/db.js',
    '/admin.js',
    '/employe.js',
    '/camera.js',
    '/qr.js',
    '/backup.js',
    '/manifest.json',
    'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js'
];

self.addEventListener('install', event => {
    console.log('🔄 Installation Service Worker');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    console.log('🔄 Activation Service Worker');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});
