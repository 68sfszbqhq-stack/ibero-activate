// ============================================================
// MÓDULO DE PERIODOS (Temporadas) - IBERO ACTÍVATE
// ============================================================
// Aísla las asistencias por temporada (Primavera / Verano / Otoño)
// para que los conteos NO se entrecrucen entre periodos.
//
// Cada periodo es un documento en la colección `periods`:
//   { name, season, startDate, endDate, macrocycleId, isActive,
//     totalWeeks, createdAt }
//
// Uso:
//   const p = await Periods.getActivePeriod();
//   const id = await Periods.getActivePeriodId();
//
// Requiere que `db` (firebase.firestore()) esté disponible globalmente
// (ver js/firebase-config.js).
// ============================================================

(function () {
    'use strict';

    const STORAGE_KEY_PERIODS = 'ia_cache_periods_v1';
    let _activePeriodCache = null;   // { id, ...data }
    let _activePeriodPromise = null; // dedup de peticiones concurrentes

    function readStoredPeriods() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY_PERIODS);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length) return parsed;
            }
        } catch (e) { /* ignore */ }
        if (window.IA_OFFLINE_SEED && Array.isArray(window.IA_OFFLINE_SEED.periods) && window.IA_OFFLINE_SEED.periods.length) {
            return window.IA_OFFLINE_SEED.periods;
        }
        return [];
    }

    function writeStoredPeriods(list) {
        try {
            if (Array.isArray(list) && list.length) {
                localStorage.setItem(STORAGE_KEY_PERIODS, JSON.stringify(list));
            }
        } catch (e) { /* ignore */ }
    }

    function withTimeout(promise, ms) {
        return new Promise((resolve, reject) => {
            const t = setTimeout(() => reject(new Error('timeout')), ms);
            promise.then(v => { clearTimeout(t); resolve(v); }, err => { clearTimeout(t); reject(err); });
        });
    }

    // Metadatos de cada temporada (etiqueta, icono, color)
    const SEASON_LABELS = {
        primavera: { label: 'Primavera', icon: 'fa-seedling', color: '#10b981' },
        verano: { label: 'Verano', icon: 'fa-sun', color: '#f59e0b' },
        otono: { label: 'Otoño', icon: 'fa-leaf', color: '#d97706' },
        invierno: { label: 'Invierno', icon: 'fa-snowflake', color: '#3b82f6' }
    };

    // Devuelve TODOS los periodos, del más reciente al más antiguo.
    // Con mala señal usa caché local o semilla en ≤2s para no colgar la pantalla.
    async function getAllPeriods() {
        const fallback = readStoredPeriods();
        try {
            const snap = await withTimeout(db.collection('periods').get(), 2200);
            const periods = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            periods.sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''));
            if (periods.length) writeStoredPeriods(periods);
            return periods.length ? periods : fallback;
        } catch (e) {
            try {
                const cacheSnap = await db.collection('periods').get({ source: 'cache' });
                if (!cacheSnap.empty) {
                    const periods = cacheSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                    periods.sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''));
                    return periods;
                }
            } catch (_) { /* ignore */ }
            return fallback;
        }
    }

    // Devuelve el periodo activo (isActive == true). Si no hay ninguno
    // marcado, cae al más reciente por fecha de inicio. Cachea el resultado.
    async function getActivePeriod(force = false) {
        if (_activePeriodCache && !force) return _activePeriodCache;
        if (_activePeriodPromise && !force) return _activePeriodPromise;

        // Si tenemos respaldo local y no se pide forzar red, responder rápido y refrescar detrás
        const stored = readStoredPeriods();
        const storedActive = stored.find(p => p.isActive) || stored[0] || null;
        if (storedActive && !force) {
            _activePeriodCache = storedActive;
            // Actualizar en segundo plano sin bloquear
            db.collection('periods').get().then(snap => {
                if (!snap.empty) {
                    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                    list.sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''));
                    writeStoredPeriods(list);
                    const active = list.find(p => p.isActive) || list[0] || null;
                    if (active) _activePeriodCache = active;
                }
            }).catch(() => {});
            return _activePeriodCache;
        }

        _activePeriodPromise = (async () => {
            try {
                const all = await getAllPeriods();
                _activePeriodCache = all.find(p => p.isActive) || all[0] || null;
                return _activePeriodCache;
            } catch (e) {
                console.error('[periods] Error obteniendo periodo activo:', e);
                return storedActive;
            } finally {
                _activePeriodPromise = null;
            }
        })();

        return _activePeriodPromise;
    }

    // Atajo: solo el id del periodo activo (o null).
    async function getActivePeriodId() {
        const p = await getActivePeriod();
        return p ? p.id : null;
    }

    // Resuelve a qué periodo pertenece una fecha ("YYYY-MM-DD"), comparando
    // contra el rango [startDate, endDate] de cada periodo. Útil para el pase
    // extemporáneo (fechas pasadas). Si ninguno coincide, cae al periodo activo.
    async function getPeriodIdForDate(dateStr) {
        if (!dateStr) return getActivePeriodId();
        const periods = await getAllPeriods();
        const match = periods.find(p => {
            if (!p.startDate) return false;
            const afterStart = dateStr >= p.startDate;
            const beforeEnd = !p.endDate || dateStr <= p.endDate;
            return afterStart && beforeEnd;
        });
        if (match) return match.id;
        return getActivePeriodId();
    }

    // Marca un periodo como activo y desactiva TODOS los demás (batch).
    async function setActivePeriod(periodId) {
        const all = await getAllPeriods();
        const batch = db.batch();
        all.forEach(p => {
            batch.update(db.collection('periods').doc(p.id), { isActive: p.id === periodId });
        });
        await batch.commit();
        clearCache();
    }

    // Fuerza recargar el periodo activo la próxima vez que se pida.
    function clearCache() {
        _activePeriodCache = null;
        _activePeriodPromise = null;
    }

    // Devuelve metadatos visuales de una temporada (etiqueta, icono, color).
    function seasonMeta(season) {
        return SEASON_LABELS[season] || { label: season || 'Periodo', icon: 'fa-calendar', color: '#6b7280' };
    }

    // Calcula la semana del programa (1..totalWeeks) para una fecha dada,
    // relativa al startDate del periodo. Devuelve null si no aplica.
    function programWeekForDate(period, date) {
        if (!period || !period.startDate) return null;
        const start = new Date(period.startDate + 'T00:00:00');
        const d = (date instanceof Date) ? date : new Date(date + 'T00:00:00');
        const diffDays = Math.floor((d - start) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return null;
        const total = period.totalWeeks || 19;
        return Math.max(1, Math.min(Math.floor(diffDays / 7) + 1, total));
    }

    // Rellena un <select> con los periodos disponibles. Selecciona el activo
    // por defecto. Devuelve el id seleccionado.
    async function populatePeriodSelect(selectEl, { includeAll = false } = {}) {
        if (!selectEl) return null;
        const periods = await getAllPeriods();
        const active = await getActivePeriod();
        selectEl.innerHTML = '';

        if (includeAll) {
            const optAll = document.createElement('option');
            optAll.value = '__all__';
            optAll.textContent = 'Todos los periodos';
            selectEl.appendChild(optAll);
        }

        periods.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            const meta = seasonMeta(p.season);
            opt.textContent = p.name || `${meta.label} ${p.startDate || ''}`.trim();
            if (active && p.id === active.id) opt.selected = true;
            selectEl.appendChild(opt);
        });

        return selectEl.value || (active ? active.id : null);
    }

    // API pública
    window.Periods = {
        getAllPeriods,
        getActivePeriod,
        getActivePeriodId,
        getPeriodIdForDate,
        setActivePeriod,
        clearCache,
        seasonMeta,
        programWeekForDate,
        populatePeriodSelect,
        SEASON_LABELS
    };
})();
