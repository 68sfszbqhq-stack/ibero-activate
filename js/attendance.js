// Lógica de Pase de Lista en Tiempo Real (Offline-First para iPhone / Chrome / Safari)
// Muestra áreas, rutas, semáforo y colaboradores en 0 ms incluso sin señal de Wi-Fi,
// y encola los pases de lista sin quedarse colgado cuando la red está lenta ("lie-fi").

document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticación (no redirigir en falso si aún está cargando o sin red)
    let authChecked = false;
    auth.onAuthStateChanged(user => {
        authChecked = true;
        if (!user && navigator.onLine) {
            window.location.href = 'login.html';
        }
    });

    // Elementos DOM
    const dateDisplay = document.getElementById('current-date');
    const datePicker = document.getElementById('date-picker');
    const areaDropdown = document.getElementById('area-dropdown');
    const employeeList = document.getElementById('employee-list');

    // Variable para la fecha seleccionada (por defecto hoy)
    let currentDate = new Date();

    // Copias en el navegador de áreas, empleados, semáforo y asistencias del día
    const CACHE_EMPLOYEES = 'ia_cache_employees_v2';
    const CACHE_AREAS = 'ia_cache_areas_v2';
    const CACHE_RECENCY = 'ia_cache_recency_v1';
    const CACHE_DAILY_ATT_PREFIX = 'ia_cache_att_day_'; // + YYYY-MM-DD

    function readCache(key) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }
    function writeCache(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) { /* sin espacio: ignorar */ }
    }

    // Semilla integrada en js/offline-seed.js como respaldo inmediato si localStorage está vacío
    const seed = window.IA_OFFLINE_SEED || {};

    // Periodo (temporada) activo
    let activePeriodId = null;
    let activePeriod = null;
    if (window.Periods) {
        window.Periods.getActivePeriod().then(p => {
            activePeriod = p;
            activePeriodId = p ? p.id : null;
            renderPeriodBadge(p);
        });
    }

    function renderPeriodBadge(period) {
        const badge = document.getElementById('active-period-badge');
        if (!badge) return;
        if (!period) {
            badge.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Sin periodo activo — configúralo en Periodos';
            badge.style.background = '#fef3c7';
            badge.style.color = '#92400e';
            return;
        }
        const meta = window.Periods.seasonMeta(period.season);
        badge.innerHTML = `<i class="fa-solid ${meta.icon}"></i> ${period.name}`;
        badge.style.background = meta.color + '22';
        badge.style.color = meta.color;
    }

    // Banner / Indicador de estado de conexión y sincronización en vivo
    let pendingSyncCount = 0;
    function ensureConnectionBadge() {
        let pill = document.getElementById('connection-status-pill');
        if (!pill) {
            const headerDiv = document.querySelector('.page-header > div:first-child');
            if (!headerDiv) return null;
            pill = document.createElement('span');
            pill.id = 'connection-status-pill';
            pill.style.cssText = 'display: inline-flex; align-items: center; gap: 0.35rem; margin-top: 0.5rem; margin-left: 0.4rem; padding: 0.3rem 0.75rem; border-radius: 9999px; font-size: 0.78rem; font-weight: 700; transition: all 0.2s;';
            headerDiv.appendChild(pill);
        }
        return pill;
    }

    function updateConnectionBadge(state) {
        const pill = ensureConnectionBadge();
        if (!pill) return;
        const isOnline = navigator.onLine && state !== 'offline';
        if (pendingSyncCount > 0) {
            pill.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> Guardado en iPhone (${pendingSyncCount} por subir)`;
            pill.style.background = '#fef3c7';
            pill.style.color = '#b45309';
        } else if (!isOnline) {
            pill.innerHTML = `<i class="fa-solid fa-wifi-slash"></i> Modo sin señal (Áreas y lista activas)`;
            pill.style.background = '#fee2e2';
            pill.style.color = '#b91c1c';
        } else {
            pill.innerHTML = `<i class="fa-solid fa-bolt"></i> Lista instantánea activa`;
            pill.style.background = '#dcfce7';
            pill.style.color = '#15803d';
        }
    }

    window.addEventListener('online', () => updateConnectionBadge('online'));
    window.addEventListener('offline', () => updateConnectionBadge('offline'));
    updateConnectionBadge();

    // Inicializar fecha
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    updateDateDisplay();

    // Obtener fecha local en formato YYYY-MM-DD
    const getLocalDateString = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const todayStr = getLocalDateString();
    datePicker.max = todayStr;
    datePicker.value = todayStr;

    // Buscador rápido de empleados dentro del área o en todas las áreas
    let searchQuery = '';
    function injectQuickSearchBar() {
        if (document.getElementById('quick-employee-search-wrap')) return;
        const filtersBar = document.querySelector('.filters-bar');
        if (!filtersBar) return;

        const searchWrap = document.createElement('div');
        searchWrap.id = 'quick-employee-search-wrap';
        searchWrap.style.cssText = 'width: 100%; margin-top: 0.5rem; display: flex; gap: 0.5rem; align-items: center;';
        searchWrap.innerHTML = `
            <div style="position: relative; flex: 1;">
                <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #9ca3af;"></i>
                <input type="search" id="quick-employee-search" placeholder="Buscar trabajador por nombre o # de cuenta (en el área o en toda la IBERO)..."
                    style="width: 100%; padding: 0.65rem 2.2rem 0.65rem 2.3rem; border: 1px solid #d1d5db; border-radius: 10px; font-size: 0.92rem; outline: none;">
                <button type="button" id="clear-employee-search" style="display: none; position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #9ca3af; cursor: pointer; font-size: 1rem;">
                    <i class="fa-solid fa-circle-xmark"></i>
                </button>
            </div>
        `;
        filtersBar.appendChild(searchWrap);

        const input = document.getElementById('quick-employee-search');
        const clearBtn = document.getElementById('clear-employee-search');

        input.addEventListener('input', (e) => {
            searchQuery = e.target.value.trim();
            clearBtn.style.display = searchQuery ? 'block' : 'none';
            renderedSignature = '';
            loadEmployees();
        });

        clearBtn.addEventListener('click', () => {
            input.value = '';
            searchQuery = '';
            clearBtn.style.display = 'none';
            renderedSignature = '';
            loadEmployees();
        });
    }
    injectQuickSearchBar();

    // Helper: correr una consulta de Firestore con timeout; si la red cuelga, cae a caché de IndexedDB
    async function getCollectionResilient(collectionRef, timeoutMs = 2200) {
        return new Promise((resolve, reject) => {
            let done = false;
            const timer = setTimeout(async () => {
                if (done) return;
                try {
                    const cacheSnap = await collectionRef.get({ source: 'cache' });
                    if (!done && !cacheSnap.empty) {
                        done = true;
                        resolve(cacheSnap);
                    }
                } catch (_) { /* ignore */ }
            }, timeoutMs);

            collectionRef.get().then(snap => {
                clearTimeout(timer);
                if (!done) {
                    done = true;
                    resolve(snap);
                }
            }).catch(async err => {
                clearTimeout(timer);
                if (done) return;
                try {
                    const cacheSnap = await collectionRef.get({ source: 'cache' });
                    done = true;
                    resolve(cacheSnap);
                } catch (_) {
                    done = true;
                    reject(err);
                }
            });
        });
    }

    //Helper: ejecutar un batch de escritura sin bloquear la interfaz si el Wi-Fi está colgado ("lie-fi")
    function commitBatchNonBlocking(batch, onSynced) {
        pendingSyncCount++;
        updateConnectionBadge();

        return new Promise((resolve, reject) => {
            let resolvedToUI = false;
            // Si en 1.2 segundos el Wi-Fi no respondió, liberamos la UI porque Firestore
            // ya guardó la operación en su cola persistente de IndexedDB y la subirá solo.
            const uiTimer = setTimeout(() => {
                if (!resolvedToUI) {
                    resolvedToUI = true;
                    resolve({ queuedOffline: true });
                }
            }, 1200);

            batch.commit().then(() => {
                clearTimeout(uiTimer);
                pendingSyncCount = Math.max(0, pendingSyncCount - 1);
                updateConnectionBadge('online');
                if (typeof onSynced === 'function') onSynced();
                if (!resolvedToUI) {
                    resolvedToUI = true;
                    resolve({ queuedOffline: false });
                }
            }).catch(err => {
                clearTimeout(uiTimer);
                pendingSyncCount = Math.max(0, pendingSyncCount - 1);
                updateConnectionBadge();
                if (!resolvedToUI) {
                    resolvedToUI = true;
                    reject(err);
                }
            });
        });
    }

    // --- CARGA INSTANTÁNEA DE EMPLEADOS (0ms desde caché o semilla) ---
    let allEmployees = readCache(CACHE_EMPLOYEES);
    if (!allEmployees || !allEmployees.length) {
        allEmployees = Array.isArray(seed.employees) && seed.employees.length ? seed.employees : null;
    } else if (Array.isArray(seed.employees) && seed.employees.length > allEmployees.length) {
        // Si la semilla trae dados de alta nuevos que no estaban en el caché viejo, unirlos por ID
        const byId = new Map(allEmployees.map(e => [e.id, e]));
        seed.employees.forEach(e => {
            if (!byId.has(e.id)) byId.set(e.id, e);
        });
        allEmployees = [...byId.values()].sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
        writeCache(CACHE_EMPLOYEES, allEmployees);
    }

    let areaNameMap = new Map();
    let renderedSignature = '';

    // Cargar Áreas inmediatamente (usa caché o semilla en 0 ms, luego refresca en segundo plano)
    loadAreas();

    // Actualizar empleados desde Firestore sin bloquear la vista actual
    getCollectionResilient(db.collection('employees'), 2200).then(snap => {
        if (!snap || snap.empty) return;
        const list = [];
        snap.forEach(doc => {
            const d = doc.data();
            list.push({
                id: doc.id,
                fullName: d.fullName || d.name || '',
                accountNumber: String(d.accountNumber || ''),
                areaId: d.areaId || ''
            });
        });
        list.sort((a, b) => a.fullName.localeCompare(b.fullName));
        allEmployees = list;
        writeCache(CACHE_EMPLOYEES, list);
        loadEmployees();
    }).catch(error => {
        console.warn('Usando lista local de empleados (sin señal):', error);
        updateConnectionBadge('offline');
    });

    // Event Listeners
    areaDropdown.addEventListener('change', loadEmployees);
    areaDropdown.addEventListener('input', loadEmployees);

    areaDropdown.addEventListener('touchend', function () {
        setTimeout(() => {
            if (this.value) loadEmployees();
        }, 300);
    });

    datePicker.addEventListener('change', (e) => {
        currentDate = new Date(e.target.value + 'T12:00:00');
        updateDateDisplay();
        renderedSignature = '';
        loadEmployees();
    });

    function updateDateDisplay() {
        dateDisplay.textContent = currentDate.toLocaleDateString('es-ES', options);
        datePicker.value = currentDate.toLocaleDateString('en-CA');
    }

    // --- SEMÁFORO DE ÁREAS ---
    // Se pinta primero desde caché/semilla en 0ms y se actualiza de Firestore
    // 1.2 segundos después para NO competir con la carga principal en Wi-Fi lento.
    async function getAreaRecency() {
        const map = {};
        try {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - 30);
            const cutoffStr = cutoff.toLocaleDateString('en-CA');
            const snap = await getCollectionResilient(
                db.collection('attendances').where('date', '>=', cutoffStr),
                3500
            );
            snap.forEach(doc => {
                const d = doc.data();
                if (!d.areaId || !d.date) return;
                if (!map[d.areaId] || d.date > map[d.areaId]) map[d.areaId] = d.date;
            });
            if (Object.keys(map).length > 0) {
                writeCache(CACHE_RECENCY, map);
            }
        } catch (e) {
            console.warn('Usando semáforo en caché:', e);
        }
        return Object.keys(map).length > 0 ? map : (readCache(CACHE_RECENCY) || seed.recency || {});
    }

    function daysSinceDate(dateStr) {
        if (!dateStr) return Infinity;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const d = new Date(dateStr + 'T00:00:00');
        return Math.floor((today - d) / 86400000);
    }

    function trafficLight(days) {
        if (days <= 7) return { cls: 'tl-verde', label: 'Al día' };
        if (days <= 14) return { cls: 'tl-amarillo', label: 'Más de una semana' };
        return { cls: 'tl-rojo', label: 'Más de dos semanas' };
    }

    function trafficLightTitle(lastDate) {
        const days = daysSinceDate(lastDate);
        if (!lastDate) return 'Sin pase de lista en los últimos 30 días';
        const hace = days === 0 ? 'hoy' : days === 1 ? 'ayer' : `hace ${days} días`;
        return `Último pase de lista: ${hace} — ${trafficLight(days).label}`;
    }

    function selectArea(areaIdOrIds, btnElement) {
        const hiddenInput = document.getElementById('area-dropdown');
        if (hiddenInput) hiddenInput.value = areaIdOrIds;

        document.querySelectorAll('.area-btn').forEach(b => b.classList.remove('active'));
        if (btnElement) btnElement.classList.add('active');

        loadEmployees();
    }

    // Asistencias del día: empleadoId -> { status, docId, count }
    let attendanceByEmp = new Map();
    let attendanceUnsub = null;
    let listenedDate = null;
    const pendingSaves = new Set();

    function saveLocalDayAttendance(dateStr, map) {
        const obj = {};
        map.forEach((v, k) => { obj[k] = v; });
        writeCache(CACHE_DAILY_ATT_PREFIX + dateStr, obj);
    }

    function loadLocalDayAttendance(dateStr) {
        const cached = readCache(CACHE_DAILY_ATT_PREFIX + dateStr);
        const map = new Map();
        if (cached && typeof cached === 'object') {
            Object.entries(cached).forEach(([k, v]) => map.set(k, v));
        }
        return map;
    }

    function listenAttendances() {
        const selectedDate = currentDate.toLocaleDateString('en-CA');
        if (attendanceUnsub && listenedDate === selectedDate) return;
        if (attendanceUnsub) attendanceUnsub();
        listenedDate = selectedDate;

        // 1. Pintar inmediatamente lo que ya esté guardado en este dispositivo para esa fecha
        attendanceByEmp = loadLocalDayAttendance(selectedDate);
        paintStatuses();

        // 2. Escuchar cambios en vivo (incluyendo cambios pendientes locales con includeMetadataChanges)
        attendanceUnsub = db.collection('attendances')
            .where('date', '==', selectedDate)
            .onSnapshot({ includeMetadataChanges: true }, snap => {
                // Si el snapshot viene vacío desde caché frío pero teníamos marcas locales recién hechas, conservarlas
                if (snap.empty && snap.metadata.fromCache && attendanceByEmp.size > 0) {
                    paintStatuses();
                    return;
                }
                const map = new Map();
                snap.forEach(doc => {
                    const d = doc.data();
                    if (d.employeeId) {
                        map.set(d.employeeId, { status: d.status, docId: doc.id, count: d.chairStandsCount });
                    }
                });
                // Conservar los guardados optimistas que están en vuelo
                pendingSaves.forEach(empId => {
                    if (attendanceByEmp.has(empId) && !map.has(empId)) {
                        map.set(empId, attendanceByEmp.get(empId));
                    }
                });
                attendanceByEmp = map;
                saveLocalDayAttendance(selectedDate, map);
                paintStatuses();
            }, error => {
                console.warn('Listener de asistencia en modo offline:', error);
            });
    }

    function paintStatuses() {
        employeeList.querySelectorAll('.employee-card').forEach(card => {
            const id = card.dataset.id;
            if (pendingSaves.has(id)) return;
            const att = attendanceByEmp.get(id);
            updateEmployeeCardStatus(id, att ? att.status : undefined, att ? att.count : undefined);
        });
    }

    function normalizeText(str) {
        return (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    }

    function loadEmployees() {
        const areaValue = areaDropdown.value;
        const emptyState = document.getElementById('empty-state');

        if (!areaValue && !searchQuery) {
            employeeList.innerHTML = '';
            renderedSignature = '';
            emptyState.style.display = 'block';
            return;
        }
        emptyState.style.display = 'none';

        listenAttendances();

        if (!allEmployees) {
            employeeList.innerHTML = '<div style="text-align: center; padding: 2rem; color: #666;"><i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem;"></i><br><br>Cargando empleados...</div>';
            renderedSignature = '';
            return;
        }

        let employees = [];
        const normQuery = normalizeText(searchQuery);

        if (normQuery) {
            // Si el usuario escribe en el buscador: si hay área seleccionada filtra primero en el área,
            // y si no hay coincidencias (o no seleccionó área), busca en TODOS los colaboradores de la IBERO.
            const areaIds = areaValue ? areaValue.split(',') : [];
            const inArea = areaIds.length
                ? allEmployees.filter(e => areaIds.includes(e.areaId) && (normalizeText(e.fullName).includes(normQuery) || normalizeText(e.accountNumber).includes(normQuery)))
                : [];
            if (inArea.length > 0) {
                employees = inArea;
            } else {
                employees = allEmployees.filter(e =>
                    normalizeText(e.fullName).includes(normQuery) || normalizeText(e.accountNumber).includes(normQuery)
                );
            }
        } else {
            const areaIds = areaValue.split(',');
            employees = allEmployees.filter(e => areaIds.includes(e.areaId));
        }

        const signature = areaValue + '|' + normQuery + '|' + listenedDate + '|' +
            employees.map(e => e.id + ':' + e.fullName + ':' + e.accountNumber).join(',');
        if (signature === renderedSignature) {
            paintStatuses();
            return;
        }
        renderedSignature = signature;

        employeeList.innerHTML = '';
        if (employees.length === 0) {
            const noDataDiv = document.createElement('div');
            noDataDiv.className = 'no-data';
            noDataDiv.textContent = searchQuery
                ? `No se encontró ningún colaborador con "${searchQuery}"`
                : 'No hay empleados en esta área';
            employeeList.appendChild(noDataDiv);
            return;
        }

        employees.forEach(emp => createEmployeeCard(emp.id, emp, null, !!normQuery));
        paintStatuses();
    }

    function createEmployeeCard(id, emp, status, showAreaName = false) {
        const card = document.createElement('div');
        card.className = 'employee-card';
        card.id = `card-${id}`;
        card.dataset.id = id;
        card.dataset.areaId = emp.areaId || '';

        const iconDiv = document.createElement('div');
        iconDiv.className = 'card-icon';
        const icon = document.createElement('i');
        icon.className = 'fa-regular fa-circle';
        iconDiv.appendChild(icon);

        const infoDiv = document.createElement('div');
        infoDiv.className = 'card-info';

        const h3 = document.createElement('h3');
        h3.textContent = window.SecurityUtils
            ? window.SecurityUtils.escapeHTML(emp.fullName)
            : emp.fullName;

        const p = document.createElement('p');
        const safeAccountNumber = window.SecurityUtils
            ? window.SecurityUtils.validateAccountNumber(emp.accountNumber)
            : emp.accountNumber;
        const areaLabel = showAreaName && areaNameMap.get(emp.areaId)
            ? ` • ${areaNameMap.get(emp.areaId)}`
            : '';
        p.textContent = `#${safeAccountNumber || 'N/A'}${areaLabel}`;

        infoDiv.appendChild(h3);
        infoDiv.appendChild(p);

        // Contenedor para prueba de sentarse/levantarse de silla (30 segundos)
        const testDiv = document.createElement('div');
        testDiv.className = 'chair-stands-container';
        testDiv.style.cssText = 'margin-top: 8px; display: flex; align-items: center; gap: 8px; border-top: 1px solid #f3f4f6; padding-top: 8px; width: 100%;';

        const testLabel = document.createElement('span');
        testLabel.style.cssText = 'font-size: 0.75rem; color: #4b5563; font-weight: 500; white-space: nowrap;';
        testLabel.textContent = 'Prueba Silla (30s):';

        const testInput = document.createElement('input');
        testInput.type = 'number';
        testInput.className = 'chair-stands-input';
        testInput.min = '0';
        testInput.max = '99';
        testInput.placeholder = '-';
        testInput.style.cssText = 'width: 55px; padding: 4px 6px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.85rem; font-weight: 600; text-align: center; color: #111827; outline: none; transition: border-color 0.2s;';

        testInput.addEventListener('focus', () => {
            testInput.style.borderColor = '#667eea';
        });
        testInput.addEventListener('blur', () => {
            testInput.style.borderColor = '#d1d5db';
        });

        testInput.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        testInput.addEventListener('change', async (e) => {
            const val = parseInt(e.target.value, 10);
            const countValue = isNaN(val) ? null : val;
            await saveChairStandsCount(id, countValue);
        });

        testDiv.appendChild(testLabel);
        testDiv.appendChild(testInput);

        card.appendChild(iconDiv);
        card.appendChild(infoDiv);
        card.appendChild(testDiv);

        card.addEventListener('click', () => toggleAttendance(card, id, emp));

        employeeList.appendChild(card);
    }

    function updateEmployeeCardStatus(id, status, count = '') {
        const card = document.getElementById(`card-${id}`);
        if (!card) return;

        const iconContainer = card.querySelector('.card-icon');
        const existingReset = card.querySelector('.reset-btn-overlay');
        if (existingReset) existingReset.remove();

        card.classList.remove('selected', 'completed');

        const input = card.querySelector('.chair-stands-input');
        if (input && document.activeElement !== input) {
            input.value = (count !== undefined && count !== null) ? count : '';
        }

        if (status === 'active' || status === 'completed') {
            card.classList.add('selected');
            if (status === 'completed') card.classList.add('completed');

            iconContainer.innerHTML = status === 'completed'
                ? '<i class="fa-solid fa-check-double" style="color: #4CAF50; font-size: 1.2rem;"></i>'
                : '<i class="fa-solid fa-check" style="color: #4CAF50; font-size: 1.2rem;"></i>';
            card.style.borderColor = '#4CAF50';
            card.style.backgroundColor = '#e8f5e9';

            const resetBtn = document.createElement('button');
            resetBtn.className = 'reset-btn-overlay';
            resetBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
            resetBtn.title = 'Eliminar asistencia';
            resetBtn.style.cssText = `
                position: absolute; top: 10px; right: 10px;
                background: #fee2e2; color: #ef4444; border: 1px solid #fecaca;
                border-radius: 50%; width: 28px; height: 28px;
                display: flex; align-items: center; justify-content: center;
                cursor: pointer; font-size: 12px; z-index: 10;
            `;
            resetBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteAttendanceRecord(id);
            });
            card.style.position = 'relative';
            card.appendChild(resetBtn);
        } else {
            iconContainer.innerHTML = '<i class="fa-regular fa-circle"></i>';
            card.style.borderColor = '#e1e4e8';
            card.style.backgroundColor = '#fff';
        }

        card.dataset.status = status || 'absent';
    }

    async function saveChairStandsCount(employeeId, countValue) {
        const selectedDate = currentDate.toLocaleDateString('en-CA');
        const existingAtt = attendanceByEmp.get(employeeId);

        try {
            const batch = db.batch();

            if (existingAtt && existingAtt.docId) {
                const subRef = db.collection('employees').doc(employeeId).collection('attendance').doc(existingAtt.docId);
                const topRef = db.collection('attendances').doc(existingAtt.docId);
                batch.update(subRef, { chairStandsCount: countValue });
                batch.update(topRef, { chairStandsCount: countValue });

                attendanceByEmp.set(employeeId, { ...existingAtt, count: countValue });
                saveLocalDayAttendance(selectedDate, attendanceByEmp);
                await commitBatchNonBlocking(batch);

                const card = document.getElementById(`card-${employeeId}`);
                const name = card ? card.querySelector('h3').textContent : 'Empleado';
                showToast(`✓ Repeticiones guardadas para ${name}`);
            } else {
                const status = 'completed';
                const card = document.getElementById(`card-${employeeId}`);
                const empData = card ? { fullName: card.querySelector('h3').textContent } : { fullName: 'Empleado' };

                const hiddenInput = document.getElementById('area-dropdown');
                let areaId = hiddenInput ? hiddenInput.value : '';
                if (card && card.dataset.areaId) {
                    areaId = card.dataset.areaId;
                } else if (areaId.includes(',')) {
                    areaId = areaId.split(',')[0];
                }

                if (!areaId) {
                    alert('Error: Selecciona un área primero.');
                    return;
                }

                const subRef = db.collection('employees').doc(employeeId).collection('attendance').doc();
                const attendanceData = {
                    employeeId: employeeId,
                    employeeName: empData.fullName,
                    areaId: areaId,
                    date: selectedDate,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    status: status,
                    weekNumber: getWeekNumber(currentDate),
                    year: currentDate.getFullYear(),
                    periodId: activePeriodId,
                    chairStandsCount: countValue
                };

                batch.set(subRef, attendanceData);
                batch.set(db.collection('attendances').doc(subRef.id), attendanceData);

                const empRef = db.collection('employees').doc(employeeId);
                batch.update(empRef, {
                    points: firebase.firestore.FieldValue.increment(20),
                    lastAttendance: firebase.firestore.FieldValue.serverTimestamp()
                });

                const feedRef = empRef.collection('feedback').doc();
                batch.set(feedRef, {
                    attendanceId: subRef.id,
                    rating: 5,
                    reaction: '⚡',
                    comment: 'Feedback omitido por admin (Auto +20 pts)',
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    date: selectedDate,
                    autoGenerated: true
                });

                attendanceByEmp.set(employeeId, { status: 'completed', docId: subRef.id, count: countValue });
                saveLocalDayAttendance(selectedDate, attendanceByEmp);
                updateEmployeeCardStatus(employeeId, 'completed', countValue);

                await commitBatchNonBlocking(batch);
                showToast(`✓ Asistencia y repeticiones guardadas para ${empData.fullName}`);
            }
        } catch (error) {
            console.error('Error al guardar repeticiones:', error);
            showToast('❌ Error al guardar repeticiones');
        }
    }

    async function deleteAttendanceRecord(employeeId) {
        const confirmDelete = confirm('⚠️ ¿Quitar la asistencia de hoy de este empleado?\n\nSi estaba completa se le restan los 20 puntos que ganó.');
        if (!confirmDelete) return;

        const selectedDate = currentDate.toLocaleDateString('en-CA') || new Date().toLocaleDateString('en-CA');
        const prevAtt = attendanceByEmp.get(employeeId);

        updateEmployeeCardStatus(employeeId, null);
        attendanceByEmp.delete(employeeId);
        saveLocalDayAttendance(selectedDate, attendanceByEmp);

        try {
            await removeAttendance(employeeId, selectedDate, prevAtt && prevAtt.docId);
            showToast('🗑️ Registro eliminado correctamente');
        } catch (error) {
            console.error('Error borrando registro:', error);
            if (prevAtt) {
                attendanceByEmp.set(employeeId, prevAtt);
                saveLocalDayAttendance(selectedDate, attendanceByEmp);
                updateEmployeeCardStatus(employeeId, prevAtt.status, prevAtt.count);
            }
            alert('Error al eliminar: ' + error.message);
        }
    }

    // Un toque = asistencia completa (dos palomitas, +20 pts).
    // Se pinta AL INSTANTE en 0 ms y se encola en Firestore sin bloquear aunque no haya Wi-Fi.
    async function toggleAttendance(card, employeeId, employeeData) {
        if (pendingSaves.has(employeeId)) return;

        const att = attendanceByEmp.get(employeeId);
        const currentStatus = att ? att.status : 'absent';
        const selectedDate = currentDate.toLocaleDateString('en-CA');

        let areaId = (employeeData && employeeData.areaId) || '';
        if (!areaId) {
            const hiddenInput = document.getElementById('area-dropdown');
            areaId = hiddenInput ? hiddenInput.value.split(',')[0] : '';
        }
        if (!areaId) {
            alert('Error: No se ha seleccionado un área válida. Por favor selecciona un área.');
            return;
        }

        if (currentStatus === 'completed') {
            const confirmDelete = confirm(
                `⚠️ ¿Quitar la asistencia de hoy de ${employeeData.fullName}?\n\n` +
                `Se le restan los 20 puntos que ganó.`
            );
            if (!confirmDelete) return;

            pendingSaves.add(employeeId);
            attendanceByEmp.delete(employeeId);
            saveLocalDayAttendance(selectedDate, attendanceByEmp);
            updateEmployeeCardStatus(employeeId, null);

            try {
                await removeAttendance(employeeId, selectedDate, att && att.docId);
                showToast(`Asistencia eliminada: ${employeeData.fullName}`);
            } catch (error) {
                console.error('Error quitando asistencia:', error);
                if (att) attendanceByEmp.set(employeeId, att);
                saveLocalDayAttendance(selectedDate, attendanceByEmp);
                updateEmployeeCardStatus(employeeId, 'completed', att && att.count);
                alert(`No se pudo quitar la asistencia de ${employeeData.fullName}.`);
            } finally {
                pendingSaves.delete(employeeId);
                paintStatuses();
            }
            return;
        }

        // MARCAR ASISTENCIA COMPLETA AL INSTANTE
        pendingSaves.add(employeeId);
        const empRef = db.collection('employees').doc(employeeId);
        let attendanceId = (att && att.docId) ? att.docId : empRef.collection('attendance').doc().id;

        const newAttEntry = { status: 'completed', docId: attendanceId, count: att ? att.count : undefined };
        attendanceByEmp.set(employeeId, newAttEntry);
        saveLocalDayAttendance(selectedDate, attendanceByEmp);
        updateEmployeeCardStatus(employeeId, 'completed', att && att.count);

        // Actualizar semáforo local del área a hoy (verde inmediato)
        const container = document.getElementById('area-buttons-container');
        const cachedRecency = readCache(CACHE_RECENCY) || seed.recency || {};
        cachedRecency[areaId] = selectedDate;
        writeCache(CACHE_RECENCY, cachedRecency);
        if (container) applyRecency(container, cachedRecency);

        try {
            const batch = db.batch();

            if (att && att.docId) {
                const updateData = {
                    status: 'completed',
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                };
                batch.update(empRef.collection('attendance').doc(attendanceId), updateData);
                batch.update(db.collection('attendances').doc(attendanceId), updateData);
            } else {
                const subRef = empRef.collection('attendance').doc(attendanceId);
                const attendanceData = {
                    employeeId: employeeId,
                    employeeName: employeeData.fullName,
                    areaId: areaId,
                    date: selectedDate,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    status: 'completed',
                    weekNumber: getWeekNumber(currentDate),
                    year: currentDate.getFullYear(),
                    periodId: activePeriodId
                };
                batch.set(subRef, attendanceData);
                batch.set(db.collection('attendances').doc(attendanceId), attendanceData);
            }

            batch.update(empRef, {
                points: firebase.firestore.FieldValue.increment(20),
                lastAttendance: firebase.firestore.FieldValue.serverTimestamp()
            });

            batch.set(empRef.collection('feedback').doc(), {
                attendanceId: attendanceId,
                rating: 5,
                reaction: '⚡',
                comment: 'Feedback omitido por admin (Auto +20 pts)',
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                date: selectedDate,
                autoGenerated: true
            });

            const result = await commitBatchNonBlocking(batch);
            if (result && result.queuedOffline) {
                showToast(`📶 Guardado en iPhone (+20 pts): ${employeeData.fullName}`);
            } else {
                showToast(`✅ Asistencia completa (+20 pts): ${employeeData.fullName}`);
            }
        } catch (error) {
            console.error('Error marcando asistencia:', error);
            if (att) {
                attendanceByEmp.set(employeeId, att);
            } else {
                attendanceByEmp.delete(employeeId);
            }
            saveLocalDayAttendance(selectedDate, attendanceByEmp);
            updateEmployeeCardStatus(employeeId, att ? att.status : null, att && att.count);
            alert(`No se guardó la asistencia de ${employeeData.fullName}.`);
        } finally {
            pendingSaves.delete(employeeId);
            paintStatuses();
        }
    }

    // Borra la asistencia del día sin colgarse si hay mala señal
    async function removeAttendance(employeeId, selectedDate, knownDocId) {
        const empRef = db.collection('employees').doc(employeeId);
        const batch = db.batch();

        if (knownDocId) {
            // Si ya conocemos el docId (lo más común), borrado directo sin necesidad de esperar 3 lecturas de red
            batch.delete(empRef.collection('attendance').doc(knownDocId));
            batch.delete(db.collection('attendances').doc(knownDocId));
            batch.update(empRef, { points: firebase.firestore.FieldValue.increment(-20) });
            await commitBatchNonBlocking(batch);
            return;
        }

        const [subSnap, topSnap, fbSnap] = await Promise.all([
            getCollectionResilient(empRef.collection('attendance').where('date', '==', selectedDate), 1800),
            getCollectionResilient(db.collection('attendances').where('employeeId', '==', employeeId).where('date', '==', selectedDate), 1800),
            getCollectionResilient(empRef.collection('feedback').where('date', '==', selectedDate), 1800)
        ]);

        let pointsToDeduct = 0;
        subSnap.forEach(doc => {
            if (doc.data().status === 'completed') pointsToDeduct += 20;
            batch.delete(doc.ref);
            batch.delete(db.collection('attendances').doc(doc.id));
        });
        topSnap.forEach(doc => batch.delete(doc.ref));
        fbSnap.forEach(doc => batch.delete(doc.ref));
        if (pointsToDeduct > 0) {
            batch.update(empRef, { points: firebase.firestore.FieldValue.increment(-pointsToDeduct) });
        }
        await commitBatchNonBlocking(batch);
    }

    function showToast(message) {
        let toast = document.getElementById('toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            toast.style.cssText = `
                position: fixed; bottom: 20px; right: 20px;
                background: var(--secondary); color: white;
                padding: 1rem 2rem; border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 1000; opacity: 0; transition: opacity 0.3s;
            `;
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.style.opacity = '1';
        setTimeout(() => { toast.style.opacity = '0'; }, 3000);
    }

    // CONFIGURACIÓN DEL RECORRIDO SEMANAL
    const WEEKLY_ROUTE = {
        1: [ // LUNES
            'PLANTA FÍSICA',
            'ADMISIONES',
            'DIRECCION DE PERSONAL',
            'TESORERIA',
            'COMPRAS',
            'EDUCACIÓN CONTINUA',
            'EGRESADOS',
            'DEPARTAMENTO CIENCIAS DE LA SALUD',
            'HUMANIDADES',
            'INSTITUTO DE INVESTIGACIONES EN MEDIO AMBIENTE'
        ],
        2: [ // MARTES
            'SERVICIOS ESCOLARES',
            'DIRECCIONES GENERALES',
            'HUMANIDADES',
            'DEPARTAMENTO DE CIENCIAS SOCIALES',
            'IDIT',
            'PROTECCIÓN UNIVERSITARIA',
            'AIDEL',
            'SERVICIO SOCIAL',
            'REFLEXIÓN UNIVERSITARIA',
            'DADA',
            'PLANEACIÓN Y EVALUACIÓN',
            'CENTRO DE PARTICIPACIÓN Y DIFUSIÓN UNIVERSITARIA',
            'MEDIOS UNIVERSITARIOS'
        ],
        3: [ // MIÉRCOLES
            'PLANTA FÍSICA',
            'ADMISIONES',
            'DIRECCION DE PERSONAL',
            'TESORERIA',
            'FORMACIÓN DE PROFESORES',
            'EDUCACIÓN CONTINUA',
            'EGRESADOS',
            'DEPARTAMENTO CIENCIAS DE LA SALUD',
            'HUMANIDADES',
            'INSTITUTO DE INVESTIGACIONES EN MEDIO AMBIENTE'
        ],
        4: [ // JUEVES
            'SERVICIOS ESCOLARES',
            'PREPARATORIA IBERO',
            'HUMANIDADES',
            'DEPARTAMENTO DE CIENCIAS SOCIALES',
            'IDIT',
            'PROTECCIÓN UNIVERSITARIA',
            'AIDEL',
            'SERVICIO SOCIAL',
            'REFLEXIÓN UNIVERSITARIA',
            'DADA',
            'PLANEACIÓN Y EVALUACIÓN',
            'CENTRO DE PARTICIPACIÓN Y DIFUSIÓN UNIVERSITARIA',
            'MEDIOS UNIVERSITARIOS'
        ],
        5: [ // VIERNES
            'VILLAS IBERO',
            'PREPARATORIA IBERO',
            'MARKETING',
            'DIRECCION DE COMUNICACION INSTITUCIONAL',
            'DEFENSORIA DE LOS DERECHOS UNIVERSITARIOS',
            'IBERO ACTIVATE',
            'NUTRICIÓN',
            'LAINES',
            'OFICINA DE ATEN TECNOLOGICA'
        ]
    };

    const TUESDAY_SCHEDULE_MAP = [
        { name: 'SERVICIOS ESCOLARES', time: '10:00 - 10:20' },
        { name: 'DIRECCIONES GENERALES', time: '10:20 - 11:00' },
        { name: 'IDIT', time: '11:00 - 11:20' },
        { name: 'PROTECCION UNIVERSITARIA', time: '11:20 - 11:40' },
        { name: 'AIDEL', time: '11:40 - 12:00' },
        { name: 'PLANEACIÓN Y EVALUACIÓN', time: '12:00 - 12:30' },
        { name: 'MEDIOS UNIVERSITARIOS', time: '12:30 - 13:00' }
    ];

    function getTimeSlot(index, dayIndex, areaName) {
        if (dayIndex === 2 || dayIndex === 4) {
            const norm = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
            const name = norm(areaName);

            if (name.includes('servicios escolares')) return TUESDAY_SCHEDULE_MAP[0].time;

            if (dayIndex === 4) {
                if (name.includes('preparatoria ibero')) return '10:20 - 11:00';
                if (name.includes('humanidades') || name.includes('ciencias sociales')) return '10:20 - 11:00';
            } else {
                if (name.includes('direcciones generales') || name.includes('humanidades') || name.includes('ciencias sociales')) return TUESDAY_SCHEDULE_MAP[1].time;
            }

            if (name.includes('idit')) return TUESDAY_SCHEDULE_MAP[2].time;
            if (name.includes('proteccion universitaria')) return TUESDAY_SCHEDULE_MAP[3].time;
            if (name.includes('aidel') || name.includes('servicio social') || name.includes('reflexion') || name.includes('dada')) return TUESDAY_SCHEDULE_MAP[4].time;
            if (name.includes('planeacion') || name.includes('centro de participacion')) return TUESDAY_SCHEDULE_MAP[5].time;
            if (name.includes('medios universitarios')) return TUESDAY_SCHEDULE_MAP[6].time;

            return '13:00+';
        }

        const startHour = 10;
        const durationMinutes = 20;
        const startDate = new Date();
        startDate.setHours(startHour, 0, 0, 0);

        if (dayIndex === 5) {
            const norm = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
            const n = norm(areaName);

            if (n.includes('villas ibero')) return '10:00 - 10:20';
            if (n.includes('preparatoria ibero')) return '10:20 - 10:40';
            if (n.includes('marketing')) return '10:40 - 11:00';
            if (n.includes('comunicacion institucional')) return '11:00 - 11:20';
            if (n.includes('defensoria')) return '11:20 - 11:40';
            if (n.includes('ibero activate')) return '11:40 - 12:00';
            if (n.includes('nutricion') || n.includes('laines')) return '12:00 - 12:20';
            if (n.includes('oficina de aten')) return '12:20 - 12:40';
        }

        const slotStart = new Date(startDate.getTime() + index * durationMinutes * 60000);
        const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000);
        const formatTime = (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `${formatTime(slotStart)} - ${formatTime(slotEnd)}`;
    }

    async function loadAreas() {
        const container = document.getElementById('area-buttons-container');
        if (!container) return;

        // 1. Pintar áreas AL INSTANTE desde caché o semilla (0 ms)
        let cached = readCache(CACHE_AREAS);
        if (!cached || !cached.length) {
            cached = Array.isArray(seed.areas) && seed.areas.length ? seed.areas : null;
        } else if (Array.isArray(seed.areas) && seed.areas.length > cached.length) {
            const byId = new Map(cached.map(a => [a.id, a]));
            seed.areas.forEach(a => { if (!byId.has(a.id)) byId.set(a.id, a); });
            cached = [...byId.values()];
            writeCache(CACHE_AREAS, cached);
        }

        const initialRecency = readCache(CACHE_RECENCY) || seed.recency || null;
        if (cached && cached.length) {
            renderAreas(cached);
            if (initialRecency) applyRecency(container, initialRecency);
        }

        // 2. Actualizar áreas desde Firestore (con fallback rápido si la señal está débil)
        try {
            const snapshot = await getCollectionResilient(db.collection('areas'), 2000);
            if (snapshot && !snapshot.empty) {
                const fresh = [];
                snapshot.forEach(doc => fresh.push({ id: doc.id, name: doc.data().name || '' }));
                const changed = JSON.stringify(fresh) !== JSON.stringify(cached);
                writeCache(CACHE_AREAS, fresh);
                if (changed || !cached) {
                    renderAreas(fresh);
                    const rec = readCache(CACHE_RECENCY) || seed.recency;
                    if (rec) applyRecency(container, rec);
                }
            }
        } catch (error) {
            console.warn('Usando áreas en caché local (sin señal):', error);
        }

        // 3. Refrescar semáforo de 30 días en segundo plano (después de 1.2s para no saturar Wi-Fi débil)
        setTimeout(() => {
            getAreaRecency().then(r => {
                if (r) applyRecency(container, r);
            });
        }, 1200);

        function renderAreas(areaDocs) {
            container.innerHTML = '';
            areaNameMap = new Map();
            areaDocs.forEach(a => areaNameMap.set(a.id, a.name));

            const normalize = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
            const grouped = new Map();

            areaDocs.forEach(doc => {
                const data = { name: doc.name };
                const normName = normalize(data.name);
                if (grouped.has(normName)) {
                    grouped.get(normName).allIds.push(doc.id);
                } else {
                    grouped.set(normName, { id: doc.id, ...data, allIds: [doc.id] });
                }
            });

            let areas = [...grouped.values()];
            const today = new Date().getDay();

            const todaysRoute = WEEKLY_ROUTE[today] || [];
            const routeMap = new Map();
            todaysRoute.forEach((name, index) => routeMap.set(normalize(name), index));

            const inRouteAreas = [];
            const otherAreas = [];

            areas.forEach(area => {
                const normName = normalize(area.name);
                let isInRoute = routeMap.has(normName);
                let routeIndex = routeMap.get(normName);

                if (!isInRoute) {
                    for (const [routeItem, index] of routeMap.entries()) {
                        if (normName.includes(routeItem) || routeItem.includes(normName)) {
                            isInRoute = true;
                            routeIndex = index;
                            break;
                        }
                    }
                }

                if (isInRoute) {
                    area._routeIndex = routeIndex;
                    inRouteAreas.push(area);
                } else {
                    otherAreas.push(area);
                }
            });

            inRouteAreas.forEach(area => {
                let effectiveIndex = area._routeIndex;
                const name = normalize(area.name);

                const isMonWed = (today === 1 || today === 3);
                const isTueThu = (today === 2 || today === 4);
                const isFri = (today === 5);

                if (isTueThu) {
                    if (name.includes('humanidades') || name.includes('ciencias sociales')) {
                        const leaderIndex = inRouteAreas.findIndex(a => normalize(a.name).includes('direcciones generales'));
                        if (leaderIndex !== -1) effectiveIndex = inRouteAreas[leaderIndex]._routeIndex;
                    }
                    if (name.includes('servicio social') || name.includes('reflexion') || name.includes('dada')) {
                        const leaderIndex = inRouteAreas.findIndex(a => normalize(a.name).includes('aidel'));
                        if (leaderIndex !== -1) effectiveIndex = inRouteAreas[leaderIndex]._routeIndex;
                    }
                    if (name.includes('centro de participacion')) {
                        const leaderIndex = inRouteAreas.findIndex(a => normalize(a.name).includes('planeacion'));
                        if (leaderIndex !== -1) effectiveIndex = inRouteAreas[leaderIndex]._routeIndex;
                    }
                }
                if (isFri) {
                    if (name.includes('laines')) {
                        const leaderIndex = inRouteAreas.findIndex(a => normalize(a.name).includes('nutricion'));
                        if (leaderIndex !== -1) effectiveIndex = inRouteAreas[leaderIndex]._routeIndex;
                    }
                }
                if (isMonWed) {
                    if (name.includes('humanidades') || name.includes('instituto de investigaciones')) {
                        const leaderIndex = inRouteAreas.findIndex(a => normalize(a.name).includes('ciencias de la salud'));
                        if (leaderIndex !== -1) effectiveIndex = inRouteAreas[leaderIndex]._routeIndex;
                    }
                }

                area._effectiveSort = effectiveIndex;
            });

            inRouteAreas.sort((a, b) => a._effectiveSort - b._effectiveSort);
            otherAreas.sort((a, b) => a.name.localeCompare(b.name));

            if (inRouteAreas.length > 0) {
                inRouteAreas.forEach((area, index) => {
                    const timeSlot = getTimeSlot(index, today, area.name);
                    createAreaButton(area, container, timeSlot);
                });
            }

            if (inRouteAreas.length > 0 && otherAreas.length > 0) {
                const separator = document.createElement('div');
                separator.style.cssText = 'width: 100%; border-top: 2px solid #e5e7eb; margin: 1rem 0; grid-column: 1 / -1;';
                container.appendChild(separator);
            }

            if (otherAreas.length > 0) {
                otherAreas.forEach(area => {
                    createAreaButton(area, container);
                });
            }

            if (areas.length === 0) {
                container.innerHTML = '<div style="color: #999; width: 100%; text-align: center;">No hay áreas registradas</div>';
            }

            const current = areaDropdown.value;
            if (current) {
                container.querySelectorAll('.area-btn').forEach(b => {
                    if (b.dataset.allIds === current) b.classList.add('active');
                });
            }
        }
    }

    function applyRecency(container, recency) {
        container.querySelectorAll('.area-btn').forEach(btn => {
            let lastDate = null;
            (btn.dataset.allIds || '').split(',').forEach(id => {
                const d = recency[id];
                if (d && (!lastDate || d > lastDate)) lastDate = d;
            });
            btn.classList.remove('tl-verde', 'tl-amarillo', 'tl-rojo');
            btn.classList.add(trafficLight(daysSinceDate(lastDate)).cls);
            btn.title = trafficLightTitle(lastDate);
        });
    }

    function createAreaButton(area, container, timeSlot = null) {
        const allIds = area.allIds || [area.id];

        const btn = document.createElement('button');
        btn.className = 'area-btn';
        btn.dataset.id = area.id;
        btn.dataset.allIds = allIds.join(',');

        const iconContent = '<i class="fa-solid fa-building"></i>';

        const safeName = window.SecurityUtils
            ? window.SecurityUtils.escapeHTML(area.name)
            : area.name;

        let html = `<div style="display:flex; flex-direction:column; align-items:flex-start; line-height:1.2;">
                        <span>${iconContent} ${safeName}</span>`;

        if (timeSlot) {
            html += `<span style="font-size:0.75rem; opacity:0.85; margin-left:1.4rem; font-weight:400;">${timeSlot}</span>`;
        }

        html += `</div>`;

        btn.innerHTML = html;
        btn.style.alignItems = 'center';

        btn.addEventListener('click', () => {
            const ids = area.allIds ? area.allIds.join(',') : area.id;
            selectArea(ids, btn);
        });

        container.appendChild(btn);
    }

    function getWeekNumber(d) {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return weekNo;
    }

    window.markNoAttendance = async function () {
        const areaId = areaDropdown.value;
        const sessionType = document.getElementById('session-type').value;

        if (!areaId) {
            alert('⚠️ Por favor selecciona un área primero');
            return;
        }

        let areaName = 'Área Desconocida';
        const activeBtn = document.querySelector('.area-btn.active');
        if (activeBtn) {
            areaName = activeBtn.innerText.trim();
        } else {
            const areaSelect = document.getElementById('area-dropdown');
            if (areaSelect && areaSelect.options && areaSelect.options.length > 0 && areaSelect.selectedIndex >= 0) {
                areaName = areaSelect.options[areaSelect.selectedIndex].text;
            }
        }

        const selectedDate = currentDate.toLocaleDateString('en-CA');

        const confirmMsg = `¿Confirmar que pasaste al área "${areaName}" pero no hubo asistencia?\n\n` +
            `Fecha: ${currentDate.toLocaleDateString('es-ES')}\n` +
            `Sesión: ${sessionType}\n\n` +
            `Esto quedará registrado para fines de seguimiento.`;

        if (!confirm(confirmMsg)) return;

        const btn = document.getElementById('btn-no-attendance');
        const originalHTML = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

        try {
            const batch = db.batch();
            const docRef = db.collection('no_attendance_logs').doc();
            batch.set(docRef, {
                areaId: areaId,
                areaName: areaName,
                date: selectedDate,
                sessionType: sessionType,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                weekNumber: getWeekNumber(currentDate),
                year: currentDate.getFullYear(),
                adminEmail: auth.currentUser ? auth.currentUser.email : 'unknown'
            });
            await commitBatchNonBlocking(batch);

            showToast(`✓ Registrado: Sin asistencia en ${areaName}`);

            const emptyState = document.getElementById('empty-state');
            if (emptyState) {
                emptyState.innerHTML = `
                    <i class="fa-solid fa-circle-check" style="font-size: 3rem; color: #f59e0b; margin-bottom: 1rem;"></i>
                    <h3 style="color: #4b5563;">Registrado: Sin Asistencia</h3>
                    <p style="color: #9ca3af;">Área: ${areaName}</p>
                    <p style="color: #9ca3af;">Fecha: ${currentDate.toLocaleDateString('es-ES')}</p>
                    <p style="color: #9ca3af;">Sesión: ${sessionType}</p>
                `;
                emptyState.style.display = 'block';
                employeeList.innerHTML = '';
            }
        } catch (error) {
            console.error('Error registrando sin asistencia:', error);
            alert('Error al guardar el registro. Intenta de nuevo.');
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalHTML;
        }
    };
});
