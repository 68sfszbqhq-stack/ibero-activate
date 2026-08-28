// ============================================================
// CURADURÍA DE ACTIVIDADES - IBERO ACTÍVATE
// ============================================================
//
// Revisión rápida del catálogo, una actividad a la vez:
//   → conservar / descartar
//   → calificación de 1 a 5 estrellas
//   → reflexión escrita
//
// Guarda en Firestore (colección activity_ratings, un documento
// por actividad) y deja siempre una copia en localStorage para
// que nada se pierda si se cae la conexión.
// ============================================================

(function () {
    'use strict';

    const LS_KEY = 'ibero_curaduria_v1';
    const COLECCION = 'activity_ratings';
    const UMBRAL_SWIPE = 110;   // px que hay que arrastrar para que cuente

    // ── Estado ──────────────────────────────────────────────
    let actividades = [];        // catálogo completo normalizado
    let registros = {};          // activityId -> { decision, rating, reflexion, segmento, ... }
    let filtroSegmento = 'todos';
    let pila = [];               // ids pendientes de decidir en el filtro actual
    let historial = [];          // ids en orden de decisión, para deshacer
    let pendienteSheet = null;   // actividad abierta en la hoja de calificación
    let ratingTemporal = 0;
    let hayFirestore = false;

    // ── Atajos al DOM ───────────────────────────────────────
    const $ = (id) => document.getElementById(id);

    const el = {};
    const IDS = [
        'tab-revisar', 'tab-resultados', 'view-deck', 'view-resultados',
        'cur-count', 'cur-keep', 'cur-drop', 'cur-left', 'cur-bar-fill',
        'cur-filters', 'cur-deck', 'btn-drop', 'btn-keep', 'btn-undo',
        'cur-coverage', 'cur-offline',
        'cur-sheet-backdrop', 'sheet-verdict', 'sheet-title', 'sheet-sub',
        'sheet-stars', 'sheet-star-text', 'sheet-reflexion', 'sheet-prompts',
        'btn-sheet-save', 'btn-sheet-skip',
        'cur-search', 'cur-filter-decision', 'cur-tbody', 'btn-export',
        'cur-results-empty'
    ];

    const TEXTO_ESTRELLAS = {
        0: 'Sin calificar',
        1: 'No funcionó',
        2: 'Funcionó a medias',
        3: 'Correcta, sin más',
        4: 'Buena, la repito',
        5: 'De las mejores'
    };

    const SUGERENCIAS = [
        '¿Cómo respondió el grupo?',
        '¿Qué salió mal?',
        '¿Qué cambiaría la próxima vez?',
        '¿Para qué departamento sirve?',
        '¿Alcanzó el tiempo?',
        '¿Faltó material?'
    ];

    // ========================================================
    // ARRANQUE
    // ========================================================
    document.addEventListener('DOMContentLoaded', () => {
        IDS.forEach(id => { el[id] = $(id); });

        auth.onAuthStateChanged(user => {
            if (!user) {
                window.location.href = 'login.html';
                return;
            }
            iniciar();
        });
    });

    async function iniciar() {
        cargarLocal();
        conectarEventos();
        await cargarActividades();
        await cargarRegistrosRemotos();
        pintarFiltros();
        reconstruirPila();
        pintarTodo();
    }

    // ========================================================
    // DATOS
    // ========================================================

    // Normaliza una actividad venga de Firestore o del archivo local
    function normalizar(a, docId) {
        const id = a.activityId || docId || a.id;
        return {
            id: id,
            docId: docId || null,
            name: a.name || a.nombre || 'Sin nombre',
            objetivo: a.objetivo || a.description || '',
            categoria: a.categoria || '',
            duration: a.duration || null,
            materials: a.materials || '',
            intensity: a.intensity || '',
            emoji: a.emoji || '🎯',
            imagen: a.imagen || '',
            instrucciones: Array.isArray(a.instrucciones) ? a.instrucciones : []
        };
    }

    async function cargarActividades() {
        let desdeFirestore = [];
        try {
            const snap = await db.collection('activities').get();
            desdeFirestore = snap.docs.map(d => normalizar(d.data(), d.id));
            hayFirestore = true;
        } catch (e) {
            console.warn('[curaduria] No se pudo leer activities de Firestore:', e);
            hayFirestore = false;
        }

        if (desdeFirestore.length > 0) {
            actividades = desdeFirestore;
        } else if (typeof CATALOGO_COMPLETO !== 'undefined') {
            // Respaldo: el catálogo estático del proyecto
            actividades = CATALOGO_COMPLETO.map(a => normalizar(a, null));
        } else {
            actividades = [];
        }

        // Asigna segmento sugerido a las que aún no tienen decisión guardada
        actividades.forEach(a => {
            if (!registros[a.id]) registros[a.id] = {};
            if (!registros[a.id].segmento) {
                registros[a.id].segmento = inferirSegmento(a);
            }
        });
    }

    async function cargarRegistrosRemotos() {
        if (!hayFirestore) { mostrarOffline(true); return; }
        try {
            const snap = await db.collection(COLECCION).get();
            snap.docs.forEach(d => {
                const data = d.data() || {};
                const prev = registros[d.id] || {};
                // Lo remoto manda, salvo que lo local sea más reciente
                const localTs = prev.updatedAtMs || 0;
                const remotoTs = data.updatedAtMs || 0;
                registros[d.id] = (remotoTs >= localTs)
                    ? Object.assign({}, prev, data)
                    : Object.assign({}, data, prev);
            });
            guardarLocal();
            mostrarOffline(false);
        } catch (e) {
            console.warn('[curaduria] No se pudieron leer las decisiones guardadas:', e);
            mostrarOffline(true);
        }
    }

    function cargarLocal() {
        try {
            const raw = localStorage.getItem(LS_KEY);
            registros = raw ? JSON.parse(raw) : {};
        } catch (e) {
            registros = {};
        }
    }

    function guardarLocal() {
        try {
            localStorage.setItem(LS_KEY, JSON.stringify(registros));
        } catch (e) {
            console.warn('[curaduria] localStorage no disponible:', e);
        }
    }

    async function guardarRegistro(id) {
        const actividad = actividades.find(a => a.id === id);
        const r = registros[id] || {};
        const doc = {
            activityId: id,
            name: actividad ? actividad.name : (r.name || ''),
            segmento: r.segmento || 'sin-clasificar',
            decision: r.decision || null,
            rating: (typeof r.rating === 'number' && r.rating > 0) ? r.rating : null,
            reflexion: r.reflexion || '',
            updatedAtMs: Date.now(),
            updatedBy: (auth.currentUser && auth.currentUser.email) || 'admin'
        };

        registros[id] = Object.assign({}, r, doc);
        guardarLocal();

        try {
            await db.collection(COLECCION).doc(id).set(doc, { merge: true });
            mostrarOffline(false);
        } catch (e) {
            console.warn('[curaduria] Guardado solo local (sin conexión):', e);
            mostrarOffline(true);
        }
    }

    async function borrarRegistro(id) {
        const seg = registros[id] ? registros[id].segmento : null;
        registros[id] = seg ? { segmento: seg } : {};
        guardarLocal();
        try {
            await db.collection(COLECCION).doc(id).delete();
        } catch (e) {
            console.warn('[curaduria] No se pudo borrar en Firestore:', e);
        }
    }

    function mostrarOffline(activo) {
        if (el['cur-offline']) el['cur-offline'].classList.toggle('show', !!activo);
    }

    // ========================================================
    // PILA DE TARJETAS
    // ========================================================
    function pendientes() {
        return actividades.filter(a => {
            const r = registros[a.id] || {};
            if (r.decision) return false;
            if (filtroSegmento === 'todos') return true;
            return (r.segmento || 'sin-clasificar') === filtroSegmento;
        });
    }

    function reconstruirPila() {
        pila = pendientes().map(a => a.id);
    }

    // ========================================================
    // PINTADO
    // ========================================================
    function pintarTodo() {
        pintarProgreso();
        pintarMazo();
        pintarCobertura();
        pintarResultados();
        actualizarFiltros();
    }

    function pintarProgreso() {
        const total = actividades.length;
        const decididas = actividades.filter(a => (registros[a.id] || {}).decision).length;
        const keep = actividades.filter(a => (registros[a.id] || {}).decision === 'conservar').length;
        const drop = actividades.filter(a => (registros[a.id] || {}).decision === 'descartar').length;

        el['cur-count'].innerHTML = `${decididas} <span>de ${total} revisadas</span>`;
        el['cur-keep'].textContent = `✅ ${keep} conservadas`;
        el['cur-drop'].textContent = `🗑️ ${drop} descartadas`;
        el['cur-left'].textContent = `⏳ ${total - decididas} por revisar`;
        el['cur-bar-fill'].style.width = total ? `${(decididas / total) * 100}%` : '0%';
    }

    function pintarMazo() {
        const deck = el['cur-deck'];
        deck.innerHTML = '';

        if (pila.length === 0) {
            const revisadasTodas = pendientes().length === 0;
            deck.innerHTML = `
                <div class="cur-empty">
                    <span class="cur-empty-emoji">${revisadasTodas ? '🎉' : '🔍'}</span>
                    <h3>${revisadasTodas ? 'Terminaste este montón' : 'No hay actividades aquí'}</h3>
                    <p>${revisadasTodas
                        ? 'Ya decidiste todas las actividades de este filtro. Revisa tus decisiones en la pestaña Resultados o cambia de segmento.'
                        : 'Ningún pendiente en este segmento. Prueba con otro filtro.'}</p>
                    <button class="cur-btn cur-btn-solid" onclick="document.getElementById('tab-resultados').click()">
                        Ver resultados
                    </button>
                </div>`;
            el['btn-drop'].disabled = true;
            el['btn-keep'].disabled = true;
            el['btn-undo'].disabled = historial.length === 0;
            return;
        }

        // Dibuja las dos siguientes: la de atrás primero
        const visibles = pila.slice(0, 2).reverse();
        visibles.forEach((id, indice) => {
            const esTop = (indice === visibles.length - 1);
            deck.appendChild(construirTarjeta(id, esTop));
        });

        el['btn-drop'].disabled = false;
        el['btn-keep'].disabled = false;
        el['btn-undo'].disabled = historial.length === 0;

        const top = deck.querySelector('.cur-card.is-top');
        if (top) habilitarArrastre(top);
    }

    function construirTarjeta(id, esTop) {
        const a = actividades.find(x => x.id === id);
        const r = registros[id] || {};
        const seg = getSegmento(r.segmento || 'sin-clasificar');

        const card = document.createElement('article');
        card.className = 'cur-card ' + (esTop ? 'is-top' : 'is-behind');
        card.dataset.id = id;

        const fondo = a.imagen
            ? `background-image:url('${escaparAttr(a.imagen)}')`
            : `background:linear-gradient(135deg, ${seg.color}22, ${seg.color}55)`;

        const pills = [];
        if (a.duration) pills.push(`<span class="cur-pill">⏱️ ${a.duration} min</span>`);
        if (a.intensity) pills.push(`<span class="cur-pill">💪 ${escapar(a.intensity)}</span>`);
        if (a.materials) pills.push(`<span class="cur-pill">🎒 ${escapar(recortar(a.materials, 46))}</span>`);

        const pasos = a.instrucciones.length
            ? `<ul class="cur-steps">${a.instrucciones.slice(0, 4).map(p => `<li>${escapar(p)}</li>`).join('')}</ul>`
            : '';

        const opciones = SEGMENTOS.map(s =>
            `<option value="${s.id}" ${s.id === seg.id ? 'selected' : ''}>${s.emoji} ${s.nombre}</option>`
        ).join('');

        card.innerHTML = `
            <div class="cur-stamp cur-stamp-keep">Conservar</div>
            <div class="cur-stamp cur-stamp-drop">Descartar</div>
            <div class="cur-card-img" style="${fondo}">
                <span class="cur-card-id">${escapar(id)}</span>
                <span class="cur-card-emoji">${escapar(a.emoji)}</span>
            </div>
            <div class="cur-card-body">
                <h2 class="cur-card-title">${escapar(a.name)}</h2>
                ${a.objetivo ? `<p class="cur-card-obj">${escapar(a.objetivo)}</p>` : ''}
                ${pills.length ? `<div class="cur-card-meta">${pills.join('')}</div>` : ''}
                ${pasos}
                <div class="cur-seg-row">
                    <span class="cur-seg-label">Segmento</span>
                    <select class="cur-seg-select" data-id="${escaparAttr(id)}" aria-label="Segmento de la actividad">
                        ${opciones}
                    </select>
                </div>
            </div>`;

        const select = card.querySelector('.cur-seg-select');
        select.addEventListener('change', async (ev) => {
            ev.stopPropagation();
            registros[id] = Object.assign({}, registros[id], { segmento: ev.target.value });
            guardarLocal();
            if ((registros[id] || {}).decision) await guardarRegistro(id);
            pintarCobertura();
            actualizarFiltros();
            if (typeof Toast !== 'undefined') {
                Toast.show(`Movida a ${getSegmento(ev.target.value).nombre}`, 'info', 1800);
            }
        });
        // Que arrastrar el select no arrastre la tarjeta
        ['pointerdown', 'mousedown', 'touchstart'].forEach(evt =>
            select.addEventListener(evt, e => e.stopPropagation())
        );

        return card;
    }

    function pintarFiltros() {
        const cont = el['cur-filters'];
        cont.innerHTML = '';

        const chips = [{ id: 'todos', nombre: 'Todos', emoji: '📋', color: '#4F5AC7' }]
            .concat(SEGMENTOS);

        chips.forEach(s => {
            const btn = document.createElement('button');
            btn.className = 'cur-chip' + (s.id === filtroSegmento ? ' active' : '');
            btn.style.setProperty('--chip-color', s.color);
            btn.dataset.seg = s.id;
            btn.innerHTML = `${s.emoji} ${escapar(s.nombre)} <span class="cur-chip-n"></span>`;
            btn.addEventListener('click', () => {
                filtroSegmento = s.id;
                reconstruirPila();
                pintarTodo();
            });
            cont.appendChild(btn);
        });
        actualizarFiltros();
    }

    function actualizarFiltros() {
        const cont = el['cur-filters'];
        if (!cont) return;
        cont.querySelectorAll('.cur-chip').forEach(btn => {
            const seg = btn.dataset.seg;
            btn.classList.toggle('active', seg === filtroSegmento);
            const n = (seg === 'todos')
                ? actividades.filter(a => !(registros[a.id] || {}).decision).length
                : actividades.filter(a => !(registros[a.id] || {}).decision &&
                    (registros[a.id] || {}).segmento === seg).length;
            const span = btn.querySelector('.cur-chip-n');
            if (span) span.textContent = n;
        });
    }

    function pintarCobertura() {
        const cont = el['cur-coverage'];
        if (!cont) return;
        cont.innerHTML = SEGMENTOS.map(s => {
            const total = actividades.filter(a => (registros[a.id] || {}).segmento === s.id).length;
            const keep = actividades.filter(a => (registros[a.id] || {}).segmento === s.id &&
                (registros[a.id] || {}).decision === 'conservar').length;
            return `
                <div class="cur-cov-row">
                    <span class="cur-cov-dot" style="background:${s.color}"></span>
                    <span class="cur-cov-name">${s.emoji} ${escapar(s.nombre)}</span>
                    <span class="cur-cov-num">${keep}/${total}</span>
                </div>`;
        }).join('');
    }

    // ========================================================
    // ARRASTRE (swipe)
    // ========================================================
    function habilitarArrastre(card) {
        let inicioX = 0, inicioY = 0, dx = 0, dy = 0, arrastrando = false;
        const keep = card.querySelector('.cur-stamp-keep');
        const drop = card.querySelector('.cur-stamp-drop');

        card.addEventListener('pointerdown', (e) => {
            if (e.target.closest('.cur-seg-select')) return;
            arrastrando = true;
            inicioX = e.clientX;
            inicioY = e.clientY;
            card.classList.add('is-dragging');
            card.setPointerCapture(e.pointerId);
        });

        card.addEventListener('pointermove', (e) => {
            if (!arrastrando) return;
            dx = e.clientX - inicioX;
            dy = e.clientY - inicioY;
            // Deja pasar el scroll vertical dentro del cuerpo de la tarjeta
            if (Math.abs(dy) > Math.abs(dx) * 1.6 && Math.abs(dx) < 25) return;
            const giro = dx / 18;
            card.style.transform = `translate(${dx}px, ${dy * 0.25}px) rotate(${giro}deg)`;
            keep.style.opacity = dx > 25 ? Math.min(1, (dx - 25) / 70) : 0;
            drop.style.opacity = dx < -25 ? Math.min(1, (-dx - 25) / 70) : 0;
        });

        const soltar = () => {
            if (!arrastrando) return;
            arrastrando = false;
            card.classList.remove('is-dragging');
            if (dx > UMBRAL_SWIPE) {
                decidir('conservar');
            } else if (dx < -UMBRAL_SWIPE) {
                decidir('descartar');
            } else {
                card.style.transform = '';
                keep.style.opacity = 0;
                drop.style.opacity = 0;
            }
            dx = 0; dy = 0;
        };

        card.addEventListener('pointerup', soltar);
        card.addEventListener('pointercancel', soltar);
        card.addEventListener('lostpointercapture', soltar);
    }

    // ========================================================
    // DECISIÓN
    // ========================================================
    async function decidir(decision) {
        if (pila.length === 0) return;
        const id = pila[0];
        const card = el['cur-deck'].querySelector('.cur-card.is-top');

        if (card) {
            card.classList.remove('is-top');
            card.classList.add(decision === 'conservar' ? 'fly-right' : 'fly-left');
        }

        registros[id] = Object.assign({}, registros[id], { decision: decision });
        guardarLocal();
        pila.shift();
        historial.push(id);

        // Guarda la decisión de inmediato: la reflexión puede llegar después
        guardarRegistro(id);

        setTimeout(() => {
            pintarProgreso();
            pintarCobertura();
            pintarMazo();
            actualizarFiltros();
            abrirHoja(id, decision);
        }, 260);
    }

    async function deshacer() {
        if (historial.length === 0) return;
        const id = historial.pop();
        await borrarRegistro(id);
        reconstruirPila();
        // Vuelve a ponerla al frente aunque el filtro la ordene distinto
        pila = [id].concat(pila.filter(x => x !== id));
        pintarTodo();
        if (typeof Toast !== 'undefined') Toast.show('Decisión deshecha', 'info', 2000);
    }

    // ========================================================
    // HOJA DE CALIFICACIÓN
    // ========================================================
    function abrirHoja(id, decision) {
        const a = actividades.find(x => x.id === id);
        if (!a) return;
        pendienteSheet = id;
        const r = registros[id] || {};
        ratingTemporal = r.rating || 0;

        el['sheet-verdict'].className = 'cur-sheet-verdict ' + (decision === 'conservar' ? 'keep' : 'drop');
        el['sheet-verdict'].textContent = decision === 'conservar' ? '✅ La conservas' : '🗑️ La descartas';
        el['sheet-title'].textContent = a.name;
        el['sheet-sub'].textContent = `${id} · ${getSegmento(r.segmento).emoji} ${getSegmento(r.segmento).nombre}`;
        el['sheet-reflexion'].value = r.reflexion || '';

        pintarEstrellas();
        el['cur-sheet-backdrop'].classList.add('open');
        setTimeout(() => el['sheet-reflexion'].focus(), 60);
    }

    function cerrarHoja() {
        el['cur-sheet-backdrop'].classList.remove('open');
        pendienteSheet = null;
        ratingTemporal = 0;
    }

    function pintarEstrellas() {
        const cont = el['sheet-stars'];
        cont.querySelectorAll('.cur-star').forEach(btn => {
            const v = Number(btn.dataset.valor);
            btn.classList.toggle('on', v <= ratingTemporal);
            btn.setAttribute('aria-pressed', v <= ratingTemporal ? 'true' : 'false');
        });
        el['sheet-star-text'].textContent = TEXTO_ESTRELLAS[ratingTemporal] || '';
    }

    async function guardarHoja() {
        if (!pendienteSheet) return;
        const id = pendienteSheet;
        registros[id] = Object.assign({}, registros[id], {
            rating: ratingTemporal || null,
            reflexion: el['sheet-reflexion'].value.trim()
        });
        cerrarHoja();
        await guardarRegistro(id);
        pintarResultados();
        if (typeof Toast !== 'undefined') Toast.show('Guardado', 'success', 1600);
    }

    // ========================================================
    // RESULTADOS
    // ========================================================
    function filasResultados() {
        const q = (el['cur-search'].value || '').trim().toLowerCase();
        const filtroDec = el['cur-filter-decision'].value;

        return actividades
            .map(a => ({ a: a, r: registros[a.id] || {} }))
            .filter(({ a, r }) => {
                if (filtroDec === 'conservar' && r.decision !== 'conservar') return false;
                if (filtroDec === 'descartar' && r.decision !== 'descartar') return false;
                if (filtroDec === 'pendiente' && r.decision) return false;
                if (filtroDec === 'con-reflexion' && !(r.reflexion || '').trim()) return false;
                if (filtroSegmento !== 'todos' && (r.segmento || 'sin-clasificar') !== filtroSegmento) return false;
                if (!q) return true;
                return (a.name + ' ' + a.id + ' ' + (r.reflexion || '')).toLowerCase().includes(q);
            })
            .sort((x, y) => (y.r.rating || 0) - (x.r.rating || 0) || x.a.name.localeCompare(y.a.name));
    }

    function pintarResultados() {
        if (!el['cur-tbody']) return;
        const filas = filasResultados();

        el['cur-results-empty'].style.display = filas.length ? 'none' : 'block';

        el['cur-tbody'].innerHTML = filas.map(({ a, r }) => {
            const seg = getSegmento(r.segmento || 'sin-clasificar');
            const badge = r.decision === 'conservar'
                ? '<span class="cur-badge cur-badge-keep">✅ Conservar</span>'
                : r.decision === 'descartar'
                    ? '<span class="cur-badge cur-badge-drop">🗑️ Descartar</span>'
                    : '<span class="cur-badge cur-badge-none">Pendiente</span>';
            const estrellas = r.rating
                ? '★'.repeat(r.rating) + '<span style="color:#D1D5DB">' + '★'.repeat(5 - r.rating) + '</span>'
                : '<span style="color:#D1D5DB">—</span>';
            const refl = (r.reflexion || '').trim();

            return `
                <tr>
                    <td class="cur-td-name">${escapar(a.emoji)} ${escapar(a.name)}<br>
                        <span style="font-size:.72rem;color:#9CA3AF;font-weight:500">${escapar(a.id)}</span></td>
                    <td><span class="cur-badge" style="background:${seg.color}1A;color:${seg.color}">${seg.emoji} ${escapar(seg.nombre)}</span></td>
                    <td>${badge}</td>
                    <td class="cur-td-stars">${estrellas}</td>
                    <td class="cur-td-refl ${refl ? '' : 'empty'}">${refl ? escapar(refl) : 'Sin reflexión'}</td>
                    <td>
                        <div class="cur-row-actions">
                            <button class="cur-mini-btn" data-editar="${escaparAttr(a.id)}" title="Editar calificación y reflexión">✏️</button>
                            <button class="cur-mini-btn" data-reiniciar="${escaparAttr(a.id)}" title="Volver a dejarla pendiente">↩️</button>
                        </div>
                    </td>
                </tr>`;
        }).join('');

        el['cur-tbody'].querySelectorAll('[data-editar]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.editar;
                const r = registros[id] || {};
                abrirHoja(id, r.decision || 'conservar');
            });
        });

        el['cur-tbody'].querySelectorAll('[data-reiniciar]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.reiniciar;
                await borrarRegistro(id);
                historial = historial.filter(x => x !== id);
                reconstruirPila();
                pintarTodo();
                if (typeof Toast !== 'undefined') Toast.show('Vuelve a estar pendiente', 'info', 1800);
            });
        });
    }

    function exportarCSV() {
        const filas = filasResultados();
        if (filas.length === 0) {
            if (typeof Toast !== 'undefined') Toast.show('No hay nada que exportar', 'warning');
            return;
        }
        const cab = ['ID', 'Actividad', 'Segmento', 'Eje', 'Decisión', 'Calificación', 'Reflexión', 'Actualizado'];
        const cuerpo = filas.map(({ a, r }) => {
            const seg = getSegmento(r.segmento || 'sin-clasificar');
            const fecha = r.updatedAtMs ? new Date(r.updatedAtMs).toLocaleString('es-MX') : '';
            return [a.id, a.name, seg.nombre, seg.eje, r.decision || 'pendiente',
                r.rating || '', (r.reflexion || '').replace(/\s+/g, ' '), fecha];
        });

        const csv = [cab].concat(cuerpo)
            .map(f => f.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
            .join('\r\n');

        // BOM para que Excel respete los acentos
        const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const hoy = new Date().toISOString().slice(0, 10);
        link.href = url;
        link.download = `curaduria-actividades-${hoy}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        if (typeof Toast !== 'undefined') Toast.show('CSV descargado', 'success');
    }

    // ========================================================
    // EVENTOS
    // ========================================================
    function conectarEventos() {
        el['btn-keep'].addEventListener('click', () => decidir('conservar'));
        el['btn-drop'].addEventListener('click', () => decidir('descartar'));
        el['btn-undo'].addEventListener('click', deshacer);

        el['tab-revisar'].addEventListener('click', () => cambiarPestana('deck'));
        el['tab-resultados'].addEventListener('click', () => cambiarPestana('resultados'));

        // Estrellas
        el['sheet-stars'].querySelectorAll('.cur-star').forEach(btn => {
            btn.addEventListener('click', () => {
                const v = Number(btn.dataset.valor);
                ratingTemporal = (ratingTemporal === v) ? 0 : v;  // volver a tocar la quita
                pintarEstrellas();
            });
        });

        // Sugerencias de reflexión
        el['sheet-prompts'].innerHTML = SUGERENCIAS
            .map(s => `<button type="button" class="cur-prompt">${s}</button>`).join('');
        el['sheet-prompts'].querySelectorAll('.cur-prompt').forEach(btn => {
            btn.addEventListener('click', () => {
                const ta = el['sheet-reflexion'];
                const sep = ta.value.trim() ? '\n' : '';
                ta.value = ta.value.trim() + sep + btn.textContent + ' ';
                ta.focus();
                ta.setSelectionRange(ta.value.length, ta.value.length);
            });
        });

        el['btn-sheet-save'].addEventListener('click', guardarHoja);
        el['btn-sheet-skip'].addEventListener('click', cerrarHoja);
        el['cur-sheet-backdrop'].addEventListener('click', (e) => {
            if (e.target === el['cur-sheet-backdrop']) cerrarHoja();
        });

        el['cur-search'].addEventListener('input', pintarResultados);
        el['cur-filter-decision'].addEventListener('change', pintarResultados);
        el['btn-export'].addEventListener('click', exportarCSV);

        document.addEventListener('keydown', manejarTeclado);
    }

    function cambiarPestana(cual) {
        const enDeck = (cual === 'deck');
        el['tab-revisar'].classList.toggle('active', enDeck);
        el['tab-resultados'].classList.toggle('active', !enDeck);
        el['view-deck'].classList.toggle('hidden', !enDeck);
        el['view-resultados'].classList.toggle('active', !enDeck);
        if (!enDeck) pintarResultados();
    }

    function manejarTeclado(e) {
        const hojaAbierta = el['cur-sheet-backdrop'].classList.contains('open');

        if (hojaAbierta) {
            if (e.key === 'Escape') { e.preventDefault(); cerrarHoja(); return; }
            if ((e.key === 'Enter' && (e.metaKey || e.ctrlKey))) { e.preventDefault(); guardarHoja(); return; }
            if (/^[1-5]$/.test(e.key) && document.activeElement !== el['sheet-reflexion']) {
                e.preventDefault();
                ratingTemporal = Number(e.key);
                pintarEstrellas();
            }
            return;
        }

        // Fuera de la hoja, no secuestrar las teclas si se está escribiendo
        const tag = (document.activeElement && document.activeElement.tagName) || '';
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
        if (el['view-deck'].classList.contains('hidden')) return;

        if (e.key === 'ArrowRight') { e.preventDefault(); decidir('conservar'); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); decidir('descartar'); }
        if (e.key.toLowerCase() === 'z' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); deshacer(); }
    }

    // ========================================================
    // UTILIDADES
    // ========================================================
    function escapar(txt) {
        const d = document.createElement('div');
        d.textContent = String(txt == null ? '' : txt);
        return d.innerHTML;
    }

    function escaparAttr(txt) {
        return String(txt == null ? '' : txt).replace(/"/g, '&quot;').replace(/</g, '&lt;');
    }

    function recortar(txt, n) {
        const s = String(txt || '');
        return s.length > n ? s.slice(0, n - 1) + '…' : s;
    }
})();
