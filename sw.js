const CACHE_NAME = 'ibero-activate-v11';
const ASSETS_TO_CACHE = [
    './',
    'index.html',
    'css/main.css',
    'css/design-system.css',
    'css/admin.css',
    'css/employee.css',
    'js/firebase-config.js',
    'js/offline-seed.js',
    'js/attendance.js',
    'js/attendance-late.js',
    'js/security-utils.js',
    'js/roles.js',
    'js/period-utils.js',
    'admin/attendance.html',
    'admin/attendance-late.html',
    'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js',
    'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// En iPhone con Wi-Fi débil ("lie-fi"), la red no falla sino que se queda
// colgada. A los 1.8 segundos servimos la copia local al instante y la red,
// si termina llegando, actualiza la caché en segundo plano.
const NETWORK_TIMEOUT_MS = 1800;

// Instalar Service Worker y guardar caché
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => Promise.all(
                ASSETS_TO_CACHE.map(url => cache.add(url).catch(() => {}))
            ))
            .then(() => self.skipWaiting())
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
        }).then(() => self.clients.claim())
    );
});

// Busca en caché primero de forma exacta y luego ignorando ?v=...
async function matchFromCache(request) {
    const exact = await caches.match(request);
    if (exact) return exact;
    return caches.match(request, { ignoreSearch: true });
}

// Interceptar peticiones
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);

    // Firestore / Auth tienen su propio manejo sin conexión: no tocarlos
    if (url.hostname.endsWith('googleapis.com')) return;

    // Librerías con versión fija en la URL (Firebase SDK, Font Awesome y sus fuentes):
    // nunca cambian, así que siempre se sirve primero la copia guardada.
    if (url.hostname === 'www.gstatic.com' || url.hostname === 'cdnjs.cloudflare.com' || url.hostname === 'fonts.gstatic.com') {
        event.respondWith(
            matchFromCache(event.request).then(cached => cached || fetchAndCache(event.request))
        );
        return;
    }

    // Semilla offline y scripts/CSS propios: Stale-While-Revalidate o Network con timeout corto
    event.respondWith(networkWithTimeout(event.request));
});

function fetchAndCache(request) {
    return fetch(request).then((response) => {
        if (response && (response.ok || response.type === 'opaque')) {
            const responseClone1 = response.clone();
            const cleanUrl = request.url.split('?')[0];
            const responseClone2 = cleanUrl !== request.url ? response.clone() : null;
            caches.open(CACHE_NAME).then(cache => {
                cache.put(request, responseClone1);
                if (responseClone2) {
                    cache.put(cleanUrl, responseClone2);
                }
            });
        }
        return response;
    }).catch(async () => {
        const cached = await matchFromCache(request);
        return cached || new Response('', { status: 503, statusText: 'Offline' });
    });
}

function networkWithTimeout(request) {
    return new Promise((resolve) => {
        let settled = false;
        const network = fetchAndCache(request);

        const timer = setTimeout(() => {
            matchFromCache(request).then(cached => {
                if (cached && !settled) {
                    settled = true;
                    resolve(cached);
                }
            });
        }, NETWORK_TIMEOUT_MS);

        network.then((response) => {
            clearTimeout(timer);
            if (!settled) {
                if (response && response.status !== 503) {
                    settled = true;
                    resolve(response);
                } else {
                    matchFromCache(request).then(cached => {
                        settled = true;
                        resolve(cached || response);
                    });
                }
            }
        }).catch(() => {
            clearTimeout(timer);
            matchFromCache(request).then(cached => {
                if (!settled) {
                    settled = true;
                    resolve(cached || new Response('', { status: 503, statusText: 'Offline' }));
                }
            });
        });
    });
}
