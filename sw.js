const CACHE_NAME = 'ibero-activate-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/css/main.css',
    '/css/design-system.css',
    '/css/admin.css',
    '/css/employee.css',
    '/js/firebase-config.js',
    '/js/attendance.js',
    '/js/security-utils.js',
    '/admin/attendance.html',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Instalar Service Worker y guardar caché
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

// Activar y limpiar cachés viejos
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Interceptar peticiones: Network first, fallback to cache (Estrategia mixta)
self.addEventListener('fetch', (event) => {
    // Solo cachear GET
    if (event.request.method !== 'GET') return;

    // Estrategia: "Network First, falling back to cache"
    // Ideal para datos dinámicos como el Admin Panel, pero permite cargar la UI si no hay red
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Si hay red, guardamos una copia fresca en caché
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseClone);
                });
                return response;
            })
            .catch(() => {
                // Si falla la red, intentar desde caché
                return caches.match(event.request);
            })
    );
});
