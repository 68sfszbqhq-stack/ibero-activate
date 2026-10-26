// Lógica de Pase de Lista Extemporáneo (Offline-First)
// Permite marcar asistencias para fechas pasadas usando caché local + semilla instantánea

document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(user => {
        if (!user && navigator.onLine) {
            window.location.href = 'login.html';
        }
    });

    const dateDisplay = document.getElementById('current-date');
    const datePicker = document.getElementById('date-picker');
    const areaDropdown = document.getElementById('area-dropdown');
    const employeeList = document.getElementById('employee-list');
    const emptyState = document.getElementById('empty-state');

    let currentDate = null;
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

    const CACHE_EMPLOYEES = 'ia_cache_employees_v2';
    const CACHE_AREAS = 'ia_cache_areas_v2';
    const CACHE_DAILY_ATT_PREFIX = 'ia_cache_att_day_';
    const seed = window.IA_OFFLINE_SEED || {};

    function readCache(key) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : null;
        } catch (e) { return null; }
    }
    function writeCache(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore */ }
    }

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
                if (!done) { done = true; resolve(snap); }
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

    function commitBatchNonBlocking(batch) {
        return new Promise((resolve, reject) => {
            let resolvedToUI = false;
            const uiTimer = setTimeout(() => {
                if (!resolvedToUI) {
                    resolvedToUI = true;
                    resolve({ queuedOffline: true });
                }
            }, 1200);

            batch.commit().then(() => {
                clearTimeout(uiTimer);
                if (!resolvedToUI) {
                    resolvedToUI = true;
                    resolve({ queuedOffline: false });
                }
            }).catch(err => {
                clearTimeout(uiTimer);
                if (!resolvedToUI) {
                    resolvedToUI = true;
                    reject(err);
                }
            });
        });
    }

    let allEmployees = readCache(CACHE_EMPLOYEES);
    if (!allEmployees || !allEmployees.length) {
        allEmployees = Array.isArray(seed.employees) && seed.employees.length ? seed.employees : null;
    } else if (Array.isArray(seed.employees) && seed.employees.length > allEmployees.length) {
        const byId = new Map(allEmployees.map(e => [e.id, e]));
        seed.employees.forEach(e => { if (!byId.has(e.id)) byId.set(e.id, e); });
        allEmployees = [...byId.values()].sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
        writeCache(CACHE_EMPLOYEES, allEmployees);
    }

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
        if (currentDate && areaDropdown.value) loadEmployees();
    }).catch(() => {});

    // Cargar Áreas inmediatamente
    loadAreas();

    areaDropdown.addEventListener('change', loadEmployees);
    datePicker.addEventListener('change', (e) => {
        if (e.target.value) {
            currentDate = new Date(e.target.value + 'T12:00:00');
            updateDateDisplay();
            loadEmployees();
        }
    });

    function updateDateDisplay() {
        if (currentDate) {
            dateDisplay.textContent = currentDate.toLocaleDateString('es-ES', options);
            datePicker.value = currentDate.toISOString().split('T')[0];
        } else {
            dateDisplay.textContent = 'Selecciona una fecha...';
        }
    }

    async function loadAreas() {
        let cached = readCache(CACHE_AREAS);
        if (!cached || !cached.length) {
            cached = Array.isArray(seed.areas) && seed.areas.length ? seed.areas : null;
        }
        if (cached && cached.length) {
            populateAreaSelect(cached);
        }

        try {
            const snapshot = await getCollectionResilient(db.collection('areas'), 2000);
            if (snapshot && !snapshot.empty) {
                const fresh = [];
                snapshot.forEach(doc => fresh.push({ id: doc.id, name: doc.data().name || '' }));
                writeCache(CACHE_AREAS, fresh);
                populateAreaSelect(fresh);
            }
        } catch (error) {
            console.warn('Usando áreas en caché local para pase extemporáneo:', error);
        }

        function populateAreaSelect(areaDocs) {
            const prevValue = areaDropdown.value;
            areaDropdown.innerHTML = '<option value="">-- Seleccione un área --</option>';

            const normalize = (str) => (str || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
            const grouped = new Map();

            areaDocs.forEach(doc => {
                const normName = normalize(doc.name);
                if (grouped.has(normName)) {
                    grouped.get(normName).ids.push(doc.id);
                } else {
                    grouped.set(normName, { name: doc.name, ids: [doc.id] });
                }
            });

            const sorted = [...grouped.values()].sort((a, b) => a.name.localeCompare(b.name));

            sorted.forEach(group => {
                const option = document.createElement('option');
                option.value = group.ids.join(',');
                option.textContent = group.name;
                areaDropdown.appendChild(option);
            });

            if (prevValue) areaDropdown.value = prevValue;
        }
    }

    let attendanceByEmp = new Map();

    async function loadEmployees() {
        const areaValue = areaDropdown.value;
        employeeList.innerHTML = '';

        if (!currentDate) {
            emptyState.style.display = 'block';
            emptyState.innerHTML = `
                <i class="fa-solid fa-calendar-xmark" style="font-size: 3rem; color: #f59e0b; margin-bottom: 1rem;"></i>
                <h3 style="color: #4b5563;">Selecciona una fecha primero</h3>
                <p style="color: #9ca3af;">Usa el selector de fecha arriba para elegir el día.</p>
            `;
            return;
        }

        if (!areaValue) {
            emptyState.style.display = 'block';
            emptyState.innerHTML = `
                <i class="fa-solid fa-users-viewfinder" style="font-size: 3rem; color: #d1d5db; margin-bottom: 1rem;"></i>
                <h3 style="color: #4b5563;">Selecciona un área para comenzar</h3>
                <p style="color: #9ca3af;">La lista se actualizará automáticamente.</p>
            `;
            return;
        }

        emptyState.style.display = 'none';
        const areaIds = areaValue.includes(',') ? areaValue.split(',') : [areaValue];
        const selectedDate = currentDate.toISOString().split('T')[0];

        // 1. Pintar trabajadores al instante desde memoria/caché/semilla
        let employees = (allEmployees || []).filter(e => areaIds.includes(e.areaId));
        employees.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));

        if (employees.length === 0) {
            employeeList.innerHTML = '<div class="no-data">No hay empleados en esta área</div>';
            return;
        }

        const cachedDay = readCache(CACHE_DAILY_ATT_PREFIX + selectedDate) || {};
        attendanceByEmp = new Map(Object.entries(cachedDay));

        employees.forEach(emp => {
            const st = attendanceByEmp.get(emp.id);
            createEmployeeCard(emp.id, emp, st ? st.status : null);
        });

        // 2. Consultar asistencias de esa fecha en una sola consulta top-level (en vez de N consultas individuales)
        try {
            const snap = await getCollectionResilient(
                db.collection('attendances').where('date', '==', selectedDate),
                2200
            );
            if (snap) {
                const map = new Map();
                snap.forEach(doc => {
                    const d = doc.data();
                    if (d.employeeId) {
                        map.set(d.employeeId, { status: d.status || 'completed', docId: doc.id });
                    }
                });
                attendanceByEmp = map;
                const obj = {};
                map.forEach((v, k) => { obj[k] = v; });
                writeCache(CACHE_DAILY_ATT_PREFIX + selectedDate, obj);

                employeeList.querySelectorAll('.employee-card').forEach(card => {
                    const empId = card.dataset.id;
                    const entry = attendanceByEmp.get(empId);
                    paintCard(card, entry ? entry.status : null);
                });
            }
        } catch (error) {
            console.warn('Mostrando estado en caché para fecha:', selectedDate, error);
        }
    }

    function createEmployeeCard(id, emp, status) {
        const card = document.createElement('div');
        card.className = 'employee-card';
        card.dataset.id = id;

        card.innerHTML = `
            <div class="card-icon"></div>
            <div class="card-info">
                <h3></h3>
                <p></p>
            </div>
        `;
        card.querySelector('h3').textContent = emp.fullName;
        card.querySelector('p').textContent = `#${emp.accountNumber}`;
        paintCard(card, status);

        card.addEventListener('click', () => toggleAttendance(card, id, emp));
        employeeList.appendChild(card);
    }

    function paintCard(card, status) {
        card.dataset.status = status || 'absent';
        card.classList.toggle('selected', !!status);
        const icon = status === 'completed'
            ? '<i class="fa-solid fa-check-double"></i>'
            : status ? '<i class="fa-solid fa-check"></i>'
            : '<i class="fa-regular fa-circle"></i>';
        card.querySelector('.card-icon').innerHTML = icon;
    }

    async function toggleAttendance(card, employeeId, employeeData) {
        if (card.classList.contains('processing')) return;

        const currentStatus = card.dataset.status;
        const selectedDate = currentDate.toISOString().split('T')[0];
        const areaValue = areaDropdown.value;
        const areaId = employeeData.areaId || areaValue.split(',')[0];
        const empRef = db.collection('employees').doc(employeeId);
        const existingEntry = attendanceByEmp.get(employeeId);

        if (currentStatus === 'completed') {
            const ok = confirm(`⚠️ ¿Quitar la asistencia del ${selectedDate} de ${employeeData.fullName}?\n\nSe le restan los 20 puntos que ganó.`);
            if (!ok) return;
        }

        card.classList.add('processing');
        paintCard(card, currentStatus === 'completed' ? null : 'completed');

        try {
            const batch = db.batch();

            if (currentStatus === 'completed') {
                if (existingEntry && existingEntry.docId) {
                    batch.delete(empRef.collection('attendance').doc(existingEntry.docId));
                    batch.delete(db.collection('attendances').doc(existingEntry.docId));
                    batch.update(empRef, { points: firebase.firestore.FieldValue.increment(-20) });
                } else {
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
                }
                attendanceByEmp.delete(employeeId);
                const obj = {};
                attendanceByEmp.forEach((v, k) => { obj[k] = v; });
                writeCache(CACHE_DAILY_ATT_PREFIX + selectedDate, obj);

                await commitBatchNonBlocking(batch);
                showToast(`❌ Asistencia eliminada: ${employeeData.fullName}`);
                return;
            }

            // MARCAR ASISTENCIA EXTEMPORÁNEA
            const periodId = window.Periods
                ? await window.Periods.getPeriodIdForDate(selectedDate)
                : null;
            const subRef = empRef.collection('attendance').doc();
            const attendanceId = subRef.id;
            const attendanceData = {
                employeeId: employeeId,
                employeeName: employeeData.fullName,
                areaId: areaId,
                date: selectedDate,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'completed',
                weekNumber: getWeekNumber(currentDate),
                year: currentDate.getFullYear(),
                periodId: periodId,
                isLate: true
            };
            batch.set(subRef, attendanceData);
            batch.set(db.collection('attendances').doc(attendanceId), attendanceData);

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

            attendanceByEmp.set(employeeId, { status: 'completed', docId: attendanceId });
            const obj = {};
            attendanceByEmp.forEach((v, k) => { obj[k] = v; });
            writeCache(CACHE_DAILY_ATT_PREFIX + selectedDate, obj);

            const res = await commitBatchNonBlocking(batch);
            if (res && res.queuedOffline) {
                showToast(`📶 Guardado en iPhone (+20 pts): ${employeeData.fullName}`);
            } else {
                showToast(`✅ Asistencia completa (+20 pts): ${employeeData.fullName}`);
            }

        } catch (error) {
            console.error('Error actualizando asistencia:', error);
            paintCard(card, currentStatus === 'absent' ? null : currentStatus);
            showToast('❌ No se guardó. Revisa tu conexión e intenta de nuevo.');
        } finally {
            card.classList.remove('processing');
        }
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

    function getWeekNumber(d) {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return weekNo;
    }
});
