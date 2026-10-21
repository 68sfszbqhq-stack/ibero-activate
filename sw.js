const CACHE_NAME = 'ibero-activate-v4';
const ASSETS_TO_CACHE = [
    './',
    'index.html',
    'css/main.css',
    'css/design-system.css',
    'css/admin.css',
    'css/employee.css',
    'js/firebase-config.js',
    'js/attendance.js',
    'js/security-utils.js',
    'js/roles.js',
    'js/period-utils.js',
    'js/create-area-helper.js',
    'admin/attendance.html',
    'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js',
    'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Con mala señal la red no falla: se queda colgada. Pasado este tiempo se
// sirve la copia guardada y la red, si llega, solo actualiza la copia.
const NETWORK_TIMEOUT_MS = 3000;

// Instalar Service Worker y guardar caché
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            // Uno por uno: si un archivo falla (mala señal), los demás se
            // guardan igual y el service worker se instala de todos modos.
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

// Interceptar peticiones
self.addEventListener('fetch', (event) => {
    // Solo cachear GET
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);

    // Firestore / Auth tienen su propio manejo sin conexión: no tocarlos
    if (url.hostname.endsWith('googleapis.com')) return;

    // Librerías con versión fija en la URL (Firebase SDK, Font Awesome):
    // nunca cambian, así que primero la copia guardada.
    if (url.hostname === 'www.gstatic.com' || url.hostname === 'cdnjs.cloudflare.com') {
        event.respondWith(
            caches.match(event.request).then(cached => cached || fetchAndCache(event.request))
        );
        return;
    }

    // Archivos propios: red primero, pero si tarda más de NETWORK_TIMEOUT_MS
    // y hay copia guardada, se usa la copia.
    event.respondWith(networkWithTimeout(event.request));
});

function fetchAndCache(request) {
    return fetch(request).then((response) => {
        if (response && (response.ok || response.type === 'opaque')) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, responseClone));
        }
        return response;
    });
}

function networkWithTimeout(request) {
    return new Promise((resolve) => {
        let settled = false;
        const network = fetchAndCache(request);

        const timer = setTimeout(() => {
            caches.match(request).then(cached => {
                if (cached && !settled) { settled = true; resolve(cached); }
            });
        }, NETWORK_TIMEOUT_MS);

        network.then((response) => {
            clearTimeout(timer);
            if (!settled) { settled = true; resolve(response); }
        }).catch(() => {
            clearTimeout(timer);
            caches.match(request).then(cached => {
                if (!settled) { settled = true; resolve(cached || Response.error()); }
            });
        });
    });
}
