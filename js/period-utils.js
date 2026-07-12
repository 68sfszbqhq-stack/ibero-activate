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

    let _activePeriodCache = null;   // { id, ...data }
    let _activePeriodPromise = null; // dedup de peticiones concurrentes

    // Metadatos de cada temporada (etiqueta, icono, color)
    const SEASON_LABELS = {
        primavera: { label: 'Primavera', icon: 'fa-seedling', color: '#10b981' },
        verano: { label: 'Verano', icon: 'fa-sun', color: '#f59e0b' },
        otono: { label: 'Otoño', icon: 'fa-leaf', color: '#d97706' },
        invierno: { label: 'Invierno', icon: 'fa-snowflake', color: '#3b82f6' }
    };

    // Devuelve TODOS los periodos, del más reciente al más antiguo.
    async function getAllPeriods() {
        try {
            const snap = await db.collection('periods').get();
            const periods = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            // Orden por fecha de inicio descendente (client-side para no exigir índice)
            periods.sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''));
            return periods;
        } catch (e) {
            console.error('[periods] Error listando periodos:', e);
            return [];
        }
    }

    // Devuelve el periodo activo (isActive == true). Si no hay ninguno
    // marcado, cae al más reciente por fecha de inicio. Cachea el resultado.
    async function getActivePeriod(force = false) {
        if (_activePeriodCache && !force) return _activePeriodCache;
        if (_activePeriodPromise && !force) return _activePeriodPromise;

        _activePeriodPromise = (async () => {
            try {
                const snap = await db.collection('periods')
                    .where('isActive', '==', true)
                    .limit(1)
                    .get();

                if (!snap.empty) {
                    const doc = snap.docs[0];
                    _activePeriodCache = { id: doc.id, ...doc.data() };
                    return _activePeriodCache;
                }

                // Fallback: el periodo más reciente
                const all = await getAllPeriods();
                _activePeriodCache = all[0] || null;
                return _activePeriodCache;
            } catch (e) {
                console.error('[periods] Error obteniendo periodo activo:', e);
                return null;
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
