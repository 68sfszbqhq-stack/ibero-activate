/* ============================================================
   PROTOTIPO — Service Worker del aviso de pausa activa
   ============================================================
   Scope: /prototipo-aviso/  →  NO interfiere con el sw.js de
   producción que vive en la raíz. No cachea ni intercepta nada:
   sólo muestra avisos y escucha la respuesta.

   Windows admite SÓLO DOS botones por aviso (Notification.maxActions = 2),
   así que los dos botones son las dos formas de participar:
     · "Va, me uno"  → sesión guiada por el coach
     · "Solo, 5 min" → sesión express autónoma
   Cerrar el aviso equivale a "ahora no" y no cuesta nada.
   ============================================================ */

const TAG = 'pausa-activa-aviso';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

function mostrarAviso({ area, coach, minutos, actividad, activityId, emoji }) {
    return self.registration.showNotification(`${coach} está en ${area}`, {
        body: `${actividad || 'Pausa activa'} · ${minutos} min. ¿Te unes?`,
        icon: '../assets/icon.png',
        badge: '../assets/icon.png',
        tag: TAG,              // reemplaza el aviso anterior, nunca se apilan
        renotify: false,
        silent: true,          // REGLA: sin sonido
        requireInteraction: false,
        data: { area, coach, minutos, actividad, activityId, emoji },
        actions: [
            { action: 'aceptar', title: 'Va, me uno' },
            { action: 'express', title: 'Solo, 5 min' }
        ]
    });
}

function cerrarAvisos(motivo) {
    return self.registration.getNotifications({ tag: TAG }).then((lista) => {
        lista.forEach((n) => n.close());
        if (lista.length && motivo) return avisarPaginas({ tipo: 'respuesta', respuesta: motivo });
    });
}

async function avisarPaginas(mensaje) {
    const ventanas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    ventanas.forEach((v) => v.postMessage(mensaje));
}

async function abrir(url) {
    const destino = new URL(url, self.location).href;
    const ventanas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const abierta = ventanas.find((v) => v.url.split('?')[0] === destino.split('?')[0]);
    if (abierta) return abierta.focus();
    return self.clients.openWindow(destino);
}

/* ---------- La página le pide al SW que dispare el aviso ---------- */
self.addEventListener('message', (event) => {
    const data = event.data || {};
    if (data.tipo === 'mostrar-aviso') event.waitUntil(mostrarAviso(data));
    if (data.tipo === 'cerrar-aviso') event.waitUntil(cerrarAvisos(data.motivo));
});

/* ---------- FASE 2: aviso que llega por internet (FCM) ----------
   Hoy no se usa: el prototipo dispara todo localmente.
   Queda listo para cuando el aviso salga del panel de admin.     */
self.addEventListener('push', (event) => {
    let payload = { area: 'tu área', coach: 'El coach', minutos: 15, actividad: 'Pausa activa' };
    try { if (event.data) payload = { ...payload, ...event.data.json() }; } catch (e) { /* payload por defecto */ }
    event.waitUntil(mostrarAviso(payload));
});

/* ---------- El empleado responde ---------- */
self.addEventListener('notificationclick', (event) => {
    const accion = event.action || 'cuerpo';   // 'cuerpo' = clic en el aviso, no en un botón
    const d = event.notification.data || {};
    event.notification.close();

    event.waitUntil((async () => {
        if (accion === 'express') {
            await avisarPaginas({ tipo: 'respuesta', respuesta: 'express', area: d.area });
            return abrir('express.html');
        }
        // 'aceptar' o clic en el cuerpo → sesión guiada
        await avisarPaginas({ tipo: 'respuesta', respuesta: 'aceptar', area: d.area });
        return abrir(
            `cronometro.html?area=${encodeURIComponent(d.area || '')}`
            + `&min=${d.minutos || 15}&act=${encodeURIComponent(d.activityId || '')}`
        );
    })());
});

/* ---------- Lo cerró sin responder: eso es "ahora no" ---------- */
self.addEventListener('notificationclose', (event) => {
    event.waitUntil(avisarPaginas({ tipo: 'respuesta', respuesta: 'declinar' }));
});
