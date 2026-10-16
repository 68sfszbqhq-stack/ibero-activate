// Lógica de Pase de Lista en Tiempo Real
// Ahora cada clic guarda inmediatamente en Firestore

document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticación
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.href = 'login.html';
        }
    });

    // Elementos DOM
    const dateDisplay = document.getElementById('current-date');
    const datePicker = document.getElementById('date-picker');
    const areaDropdown = document.getElementById('area-dropdown');
    const employeeList = document.getElementById('employee-list');
    const saveBtn = document.getElementById('save-attendance-btn'); // Ya no se usará igual, pero lo mantenemos oculto o para "cerrar sesión"

    // Variable para la fecha seleccionada (por defecto hoy)
    let currentDate = new Date();

    // Periodo (temporada) activo. Se resuelve una sola vez al cargar la página
    // y se estampa en cada asistencia para que los conteos NO se entrecrucen
    // entre Primavera / Verano / Otoño. Ver js/period-utils.js
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

    // Establecer fecha máxima (hoy) en el date picker
    const todayStr = getLocalDateString();
    datePicker.max = todayStr;
    datePicker.value = todayStr;

    // Copias en el navegador de áreas y empleados (para que salgan al instante)
    const CACHE_EMPLOYEES = 'ia_cache_employees_v1';
    const CACHE_AREAS = 'ia_cache_areas_v1';
    function readCache(key) {
        try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; }
    }
    function writeCache(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* sin espacio: no pasa nada */ }
    }

    // Cargar Áreas
    loadAreas();

    // Event Listeners
    // Safari iOS sometimes needs both 'change' and 'input' events
    areaDropdown.addEventListener('change', loadEmployees);
    areaDropdown.addEventListener('input', loadEmployees); // Safari iOS fallback

    // Additional touch event for Safari iOS
    areaDropdown.addEventListener('touchend', function (e) {
        console.log('Touchend event on area dropdown');
        // Let the native picker handle it, then trigger change
        setTimeout(() => {
            if (this.value) {
                console.log('Area selected via touch:', this.value);
                loadEmployees();
            }
        }, 300);
    });

    datePicker.addEventListener('change', (e) => {
        currentDate = new Date(e.target.value + 'T12:00:00'); // Mediodía para evitar problemas de zona horaria
        updateDateDisplay();
        loadEmployees(); // Recargar empleados para la nueva fecha
    });

    function updateDateDisplay() {
        dateDisplay.textContent = currentDate.toLocaleDateString('es-ES', options);
        datePicker.value = currentDate.toLocaleDateString('en-CA');
    }

    // --- SEMÁFORO DE ÁREAS ---
    // Devuelve un mapa areaId -> fecha (YYYY-MM-DD) de la última asistencia
    // en los últimos 30 días. Una sola consulta acotada por fecha.
    async function getAreaRecency() {
        const map = {};
        try {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - 30);
            const cutoffStr = cutoff.toLocaleDateString('en-CA');
            const snap = await db.collection('attendances').where('date', '>=', cutoffStr).get();
            snap.forEach(doc => {
                const d = doc.data();
                if (!d.areaId || !d.date) return;
                if (!map[d.areaId] || d.date > map[d.areaId]) map[d.areaId] = d.date;
            });
        } catch (e) {
            console.error('Error obteniendo recencia de áreas:', e);
        }
        return map;
    }

    // Días transcurridos desde una fecha 'YYYY-MM-DD' hasta hoy (Infinity si no hay).
    function daysSinceDate(dateStr) {
        if (!dateStr) return Infinity;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const d = new Date(dateStr + 'T00:00:00');
        return Math.floor((today - d) / 86400000);
    }

    // Semáforo del botón de cada área, por días sin pase de lista:
    //   verde     dentro de la semana (≤7 días)
    //   amarillo  ya pasó una semana (8–14 días)
    //   rojo      más de dos semanas (15 o más, o nada en los últimos 30)
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
        // Actualizar input oculto — puede contener múltiples IDs separados por coma
        const hiddenInput = document.getElementById('area-dropdown');
        if (hiddenInput) hiddenInput.value = areaIdOrIds;

        // Actualizar visualmente
        document.querySelectorAll('.area-btn').forEach(b => b.classList.remove('active'));
        if (btnElement) btnElement.classList.add('active');

        // Cargar empleados
        loadEmployees();
    }

    // --- VELOCIDAD ---
    // Antes, cada toque a un área volvía a pedir sus empleados al servidor.
    // Ahora se descargan TODOS una sola vez al abrir la página (y se guardan
    // en el navegador para que la siguiente vez aparezcan al instante), y las
    // asistencias del día se escuchan con un solo listener por fecha.

    let allEmployees = readCache(CACHE_EMPLOYEES); // [{id, fullName, accountNumber, areaId}]
    let renderedSignature = '';

    db.collection('employees').get().then(snap => {
        const list = [];
        snap.forEach(doc => {
            const d = doc.data();
            list.push({
                id: doc.id,
                fullName: d.fullName || '',
                accountNumber: d.accountNumber || '',
                areaId: d.areaId || ''
            });
        });
        list.sort((a, b) => a.fullName.localeCompare(b.fullName));
        allEmployees = list;
        writeCache(CACHE_EMPLOYEES, list);
        // Si la lista fresca trae cambios para el área abierta, repintar
        loadEmployees();
    }).catch(error => {
        console.error('Error cargando empleados:', error);
        if (!allEmployees) {
            employeeList.innerHTML = '';
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error';
            errorDiv.textContent = 'Error al cargar empleados. Revisa tu conexión y recarga.';
            employeeList.appendChild(errorDiv);
        }
    });

    // Asistencias del día: empleadoId -> { status, docId, count }
    let attendanceByEmp = new Map();
    let attendanceUnsub = null;
    let listenedDate = null;
    // Empleados con un guardado en curso (evita doble registro por doble toque)
    const pendingSaves = new Set();

    function listenAttendances() {
        const selectedDate = currentDate.toLocaleDateString('en-CA');
        if (attendanceUnsub && listenedDate === selectedDate) return;
        if (attendanceUnsub) attendanceUnsub();
        listenedDate = selectedDate;
        attendanceByEmp = new Map();

        attendanceUnsub = db.collection('attendances')
            .where('date', '==', selectedDate)
            .onSnapshot(snap => {
                const map = new Map();
                snap.forEach(doc => {
                    const d = doc.data();
                    if (d.employeeId) {
                        map.set(d.employeeId, { status: d.status, docId: doc.id, count: d.chairStandsCount });
                    }
                });
                attendanceByEmp = map;
                paintStatuses();
            }, error => console.error('Error en listener de asistencia:', error));
    }

    function paintStatuses() {
        employeeList.querySelectorAll('.employee-card').forEach(card => {
            const id = card.dataset.id;
            if (pendingSaves.has(id)) return; // ya se pintó al tocar
            const att = attendanceByEmp.get(id);
            updateEmployeeCardStatus(id, att ? att.status : undefined, att ? att.count : undefined);
        });
    }

    function loadEmployees() {
        const areaValue = areaDropdown.value;
        const emptyState = document.getElementById('empty-state');

        if (!areaValue) {
            employeeList.innerHTML = '';
            renderedSignature = '';
            emptyState.style.display = 'block';
            return;
        }
        emptyState.style.display = 'none';

        listenAttendances();

        if (!allEmployees) {
            // Primera vez en este navegador: esperar la descarga
            employeeList.innerHTML = '<div style="text-align: center; padding: 2rem; color: #666;"><i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem;"></i><br><br>Cargando empleados...</div>';
            renderedSignature = '';
            return;
        }

        // Soportar múltiples IDs separados por coma (áreas deduplicadas)
        const areaIds = areaValue.split(',');
        const employees = allEmployees.filter(e => areaIds.includes(e.areaId));

        // Si ya está pintada la misma lista, solo actualizar palomitas
        const signature = areaValue + '|' + listenedDate + '|' +
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
            noDataDiv.textContent = 'No hay empleados en esta área';
            employeeList.appendChild(noDataDiv);
            return;
        }

        employees.forEach(emp => createEmployeeCard(emp.id, emp, null));
        paintStatuses();
    }

    function createEmployeeCard(id, emp, status) {
        const card = document.createElement('div');
        card.className = 'employee-card';
        card.id = `card-${id}`;
        card.dataset.id = id;
        card.dataset.areaId = emp.areaId || '';

        // SEGURIDAD XSS: Crear estructura de forma segura
        const iconDiv = document.createElement('div');
        iconDiv.className = 'card-icon';
        const icon = document.createElement('i');
        icon.className = 'fa-regular fa-circle';
        iconDiv.appendChild(icon);

        const infoDiv = document.createElement('div');
        infoDiv.className = 'card-info';

        const h3 = document.createElement('h3');
        // Sanitizar nombre del empleado
        h3.textContent = window.SecurityUtils
            ? window.SecurityUtils.escapeHTML(emp.fullName)
            : emp.fullName;

        const p = document.createElement('p');
        // Sanitizar número de cuenta
        const safeAccountNumber = window.SecurityUtils
            ? window.SecurityUtils.validateAccountNumber(emp.accountNumber)
            : emp.accountNumber;
        p.textContent = `#${safeAccountNumber || 'N/A'}`;

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
            e.stopPropagation(); // Prevenir toggle de asistencia al hacer clic en el input
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

        // Click Event: Toggle Asistencia
        card.addEventListener('click', () => toggleAttendance(card, id, emp));

        employeeList.appendChild(card);
    }

    function updateEmployeeCardStatus(id, status, count = '') {
        const card = document.getElementById(`card-${id}`);
        if (!card) return;

        const iconContainer = card.querySelector('.card-icon');
        // Limpiar botones previos de reset si existen
        const existingReset = card.querySelector('.reset-btn-overlay');
        if (existingReset) existingReset.remove();

        // Limpiar clases de estado previo
        card.classList.remove('selected', 'completed');

        // Actualizar el valor del input si el usuario no está enfocado en él
        const input = card.querySelector('.chair-stands-input');
        if (input && document.activeElement !== input) {
            input.value = (count !== undefined && count !== null) ? count : '';
        }

        if (status === 'active') {
            // ASISTENCIA MARCADA (Pendiente de feedback) - AHORA EN VERDE TAMBIÉN
            card.classList.add('selected');
            // Check simple pero VERDE
            iconContainer.innerHTML = '<i class="fa-solid fa-check" style="color: #4CAF50; font-size: 1.2rem;"></i>';
            card.style.borderColor = '#4CAF50';
            card.style.backgroundColor = '#e8f5e9'; // Verde clarito (Igual que completed)
            // Añadir botón borrar también aquí por si se equivocan rápido
            const existingReset = card.querySelector('.reset-btn-overlay');
            if (!existingReset) {
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
            }

        } else if (status === 'completed') {
            // FEEDBACK RECIBIDO (Ciclo completo)
            card.classList.add('selected', 'completed');
            // Doble Check
            iconContainer.innerHTML = '<i class="fa-solid fa-check-double" style="color: #4CAF50; font-size: 1.2rem;"></i>';
            card.style.borderColor = '#4CAF50';
            card.style.backgroundColor = '#e8f5e9';

            // --- BOTÓN DE RESET/ELIMINAR ---
            // (Ya estaba implementado, se mantiene igual por lógica de función, 
            // pero aseguro que se renderice si entra aquí directo)
            const existingReset = card.querySelector('.reset-btn-overlay');
            if (!existingReset) {
                const resetBtn = document.createElement('button');
                resetBtn.className = 'reset-btn-overlay';
                resetBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
                resetBtn.title = 'Eliminar asistencia y feedback (Reset)';
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
            }

        } else {
            // AUSENTE
            iconContainer.innerHTML = '<i class="fa-regular fa-circle"></i>';
            card.style.borderColor = '#e1e4e8';
            card.style.backgroundColor = '#fff';
        }

        // Guardar status actual
        card.dataset.status = status || 'absent';
    }

    async function saveChairStandsCount(employeeId, countValue) {
        const selectedDate = currentDate.toLocaleDateString('en-CA');
        
        try {
            // Buscar si ya existe la asistencia para hoy
            const snapshot = await db.collection('employees')
                .doc(employeeId)
                .collection('attendance')
                .where('date', '==', selectedDate)
                .get();
                
            const topLevelSnapshot = await db.collection('attendances')
                .where('employeeId', '==', employeeId)
                .where('date', '==', selectedDate)
                .get();

            const batch = db.batch();
            
            if (!snapshot.empty) {
                // Actualizar documentos existentes
                snapshot.docs.forEach(doc => {
                    batch.update(doc.ref, { chairStandsCount: countValue });
                });
                topLevelSnapshot.docs.forEach(doc => {
                    batch.update(doc.ref, { chairStandsCount: countValue });
                });
                await batch.commit();
                
                const card = document.getElementById(`card-${employeeId}`);
                const name = card ? card.querySelector('h3').textContent : 'Empleado';
                showToast(`✓ Repeticiones guardadas para ${name}`);
            } else {
                // Si no existe, crear la asistencia primero con el count
                // Ya no se usa el feedback: la asistencia nace completa (+20 pts)
                const skipFeedback = true;
                const status = 'completed';
                
                const card = document.getElementById(`card-${employeeId}`);
                const empData = card ? { fullName: card.querySelector('h3').textContent } : { fullName: 'Empleado' };
                
                // Obtener ID del área
                const hiddenInput = document.getElementById('area-dropdown');
                let areaId = hiddenInput ? hiddenInput.value : '';
                
                // Si el área tiene múltiples IDs por deduplicación, buscar la del empleado o usar el primer ID
                if (card && card.dataset.areaId) {
                    areaId = card.dataset.areaId;
                } else if (areaId.includes(',')) {
                    areaId = areaId.split(',')[0];
                }
                
                if (!areaId) {
                    alert('Error: Selecciona un área primero.');
                    return;
                }

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
                
                const subRef = db.collection('employees').doc(employeeId).collection('attendance').doc();
                batch.set(subRef, attendanceData);
                
                const topRef = db.collection('attendances').doc(subRef.id);
                batch.set(topRef, attendanceData);
                
                if (skipFeedback) {
                    const empRef = db.collection('employees').doc(employeeId);
                    batch.update(empRef, {
                        points: firebase.firestore.FieldValue.increment(20),
                        lastAttendance: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    
                    const feedRef = db.collection('employees').doc(employeeId).collection('feedback').doc();
                    batch.set(feedRef, {
                        attendanceId: subRef.id,
                        rating: 5,
                        reaction: '⚡',
                        comment: 'Feedback omitido por admin (Auto +20 pts)',
                        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                        date: selectedDate,
                        autoGenerated: true
                    });
                }
                
                await batch.commit();
                showToast(`✓ Asistencia y repeticiones guardadas para ${empData.fullName}`);
            }
        } catch (error) {
            console.error('Error al guardar repeticiones:', error);
            showToast('❌ Error al guardar repeticiones');
        }
    }

    // Nueva función para borrar explícitamente desde el botón
    async function deleteAttendanceRecord(employeeId) {
        const confirmDelete = confirm('⚠️ ¿Quitar la asistencia de hoy de este empleado?\n\nSi estaba completa se le restan los 20 puntos que ganó.');
        if (!confirmDelete) return;

        const selectedDate = currentDate.toLocaleDateString('en-CA') || new Date().toLocaleDateString('en-CA'); // Fallback YYYY-MM-DD

        try {
            const batch = db.batch();

            // 1. Buscar y Borrar de employees/{id}/attendance
            const attSnapshot = await db.collection('employees').doc(employeeId).collection('attendance')
                .where('date', '==', selectedDate).get();

            // Restar los 20 pts de cada asistencia completa, igual que al desmarcar
            // tocando la tarjeta (antes el bote borraba y dejaba los puntos).
            let pointsToDeduct = 0;
            attSnapshot.forEach(doc => {
                if (doc.data().status === 'completed') pointsToDeduct += 20;
                batch.delete(doc.ref);
            });
            if (pointsToDeduct > 0) {
                batch.update(db.collection('employees').doc(employeeId), {
                    points: firebase.firestore.FieldValue.increment(-pointsToDeduct)
                });
            }

            // 2. Buscar y Borrar de attendances (top-level)
            const topSnapshot = await db.collection('attendances')
                .where('employeeId', '==', employeeId)
                .where('date', '==', selectedDate).get();

            topSnapshot.forEach(doc => batch.delete(doc.ref));

            // 3. Buscar y Borrar Feedback
            const feedSnapshot = await db.collection('employees').doc(employeeId).collection('feedback')
                .where('date', '==', selectedDate).get();

            feedSnapshot.forEach(doc => batch.delete(doc.ref));

            await batch.commit();
            showToast('🗑️ Registro eliminado correctamente');

            // Forzar actualización visual inmediata (limpiar status)
            updateEmployeeCardStatus(employeeId, null);

        } catch (error) {
            console.error('Error borrando registro:', error);
            alert('Error al eliminar: ' + error.message);
        }
    }

    // Un toque = asistencia completa (dos palomitas, +20 pts). Ya no existe la
    // palomita sola ni el feedback. Se pinta AL INSTANTE y se guarda por
    // detrás; si el guardado falla, se regresa la tarjeta y se avisa.
    async function toggleAttendance(card, employeeId, employeeData) {
        // Doble toque mientras se guarda: ignorar (evita registros dobles)
        if (pendingSaves.has(employeeId)) return;

        const att = attendanceByEmp.get(employeeId);
        const currentStatus = att ? att.status : 'absent';
        const selectedDate = currentDate.toLocaleDateString('en-CA');

        // Área del empleado (si el botón agrupa varias áreas, la suya propia)
        let areaId = (employeeData && employeeData.areaId) || '';
        if (!areaId) {
            const hiddenInput = document.getElementById('area-dropdown');
            areaId = hiddenInput ? hiddenInput.value.split(',')[0] : '';
        }
        if (!areaId) {
            alert('Error: No se ha seleccionado un área válida. Por favor recarga la página.');
            return;
        }

        if (currentStatus === 'completed') {
            // QUITAR la asistencia (tocar a alguien que ya tiene dos palomitas)
            const confirmDelete = confirm(
                `⚠️ ¿Quitar la asistencia de hoy de ${employeeData.fullName}?\n\n` +
                `Se le restan los 20 puntos que ganó.`
            );
            if (!confirmDelete) return;

            pendingSaves.add(employeeId);
            updateEmployeeCardStatus(employeeId, null);
            try {
                await removeAttendance(employeeId, selectedDate);
                showToast(`Asistencia eliminada: ${employeeData.fullName}`);
            } catch (error) {
                console.error('Error quitando asistencia:', error);
                updateEmployeeCardStatus(employeeId, 'completed', att && att.count);
                alert(`No se pudo quitar la asistencia de ${employeeData.fullName}. Revisa tu conexión e intenta de nuevo.`);
            } finally {
                pendingSaves.delete(employeeId);
                paintStatuses();
            }
            return;
        }

        // MARCAR: sin palomita o con una sola (registros viejos) -> dos palomitas
        pendingSaves.add(employeeId);
        updateEmployeeCardStatus(employeeId, 'completed', att && att.count);

        try {
            const batch = db.batch();
            const empRef = db.collection('employees').doc(employeeId);
            let attendanceId;

            if (att && att.docId) {
                // Ya tenía una palomita: completarla
                attendanceId = att.docId;
                const updateData = {
                    status: 'completed',
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                };
                batch.update(empRef.collection('attendance').doc(attendanceId), updateData);
                batch.update(db.collection('attendances').doc(attendanceId), updateData);
            } else {
                // Nueva asistencia, nace completa
                const subRef = empRef.collection('attendance').doc();
                attendanceId = subRef.id;
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

            // +20 pts
            batch.update(empRef, {
                points: firebase.firestore.FieldValue.increment(20),
                lastAttendance: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Registro automático que mantiene las estadísticas históricas
            // (el empleado ya no llena feedback)
            batch.set(empRef.collection('feedback').doc(), {
                attendanceId: attendanceId,
                rating: 5,
                reaction: '⚡',
                comment: 'Feedback omitido por admin (Auto +20 pts)',
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                date: selectedDate,
                autoGenerated: true
            });

            await batch.commit();
            showToast(`Asistencia completa (+20 pts): ${employeeData.fullName}`);
        } catch (error) {
            console.error('Error marcando asistencia:', error);
            updateEmployeeCardStatus(employeeId, att ? att.status : null, att && att.count);
            alert(`No se guardó la asistencia de ${employeeData.fullName}. Revisa tu conexión e intenta de nuevo.`);
        } finally {
            pendingSaves.delete(employeeId);
            paintStatuses();
        }
    }

    // Borra la asistencia del día (subcolección + top-level + feedback de ese
    // día) y resta 20 pts por cada asistencia completa.
    async function removeAttendance(employeeId, selectedDate) {
        const empRef = db.collection('employees').doc(employeeId);
        const [subSnap, topSnap, fbSnap] = await Promise.all([
            empRef.collection('attendance').where('date', '==', selectedDate).get(),
            db.collection('attendances').where('employeeId', '==', employeeId).where('date', '==', selectedDate).get(),
            empRef.collection('feedback').where('date', '==', selectedDate).get()
        ]);

        const batch = db.batch();
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
        await batch.commit();
    }

    // Helper: Toast Notification
    function showToast(message) {
        // Crear elemento toast si no existe
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
    // 0 = Domingo, 1 = Lunes, ... 6 = Sábado
    // NOTA: El sistema intentará coincidir estos nombres con los de la base de datos (ignorando mayúsculas/acentos)
    const WEEKLY_ROUTE = {
        1: [ // LUNES
            'PLANTA FÍSICA',
            'ADMISIONES',
            'DIRECCION DE PERSONAL',
            'TESORERIA', // Único agregado aquí
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
            'HUMANIDADES', // Tocado por usuario
            'DEPARTAMENTO DE CIENCIAS SOCIALES', // Agregado
            'IDIT',
            'PROTECCIÓN UNIVERSITARIA',
            'AIDEL',
            'SERVICIO SOCIAL',
            'REFLEXIÓN UNIVERSITARIA', // Agregado
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
            // --- NUEVOS DE VIERNES ---
            'MARKETING',
            'DIRECCION DE COMUNICACION INSTITUCIONAL',
            'DEFENSORIA DE LOS DERECHOS UNIVERSITARIOS',
            'IBERO ACTIVATE',
            'NUTRICIÓN', // Agregado
            'LAINES',
            'OFICINA DE ATEN TECNOLOGICA'
        ]
    };

    // Configuración específica de Horarios para Martes (y Jueves si aplica)
    const TUESDAY_SCHEDULE_MAP = [
        { name: 'SERVICIOS ESCOLARES', time: '10:00 - 10:20' },
        { name: 'DIRECCIONES GENERALES', time: '10:20 - 11:00' }, // Incluye Humanidades, C. Sociales
        { name: 'IDIT', time: '11:00 - 11:20' },
        { name: 'PROTECCION UNIVERSITARIA', time: '11:20 - 11:40' },
        { name: 'AIDEL', time: '11:40 - 12:00' }, // Incluye Serv Social, Reflexión, DADA
        { name: 'PLANEACIÓN Y EVALUACIÓN', time: '12:00 - 12:30' }, // Incluye Centro Part.
        { name: 'MEDIOS UNIVERSITARIOS', time: '12:30 - 13:00' }
    ];

    function getTimeSlot(index, dayIndex, areaName, routeMap) {
        // Lógica especial para Martes (2) y Jueves (4)
        if (dayIndex === 2 || dayIndex === 4) {
            // Encontrar el líder del grupo para asignar horario
            const norm = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
            const name = norm(areaName);

            // Definir mapping líder -> tiempo
            // Usamos 'includes' para ser flexibles
            if (name.includes('servicios escolares')) return TUESDAY_SCHEDULE_MAP[0].time;

            // JUEVES: Preparatoria IBERO en lugar de Direcciones Generales
            if (dayIndex === 4) {
                if (name.includes('preparatoria ibero')) return '10:20 - 11:00';
                if (name.includes('humanidades') || name.includes('ciencias sociales')) return '10:20 - 11:00';
            } else {
                // MARTES: Direcciones Generales con Humanidades y C. Sociales
                if (name.includes('direcciones generales') || name.includes('humanidades') || name.includes('ciencias sociales')) return TUESDAY_SCHEDULE_MAP[1].time;
            }

            if (name.includes('idit')) return TUESDAY_SCHEDULE_MAP[2].time;
            if (name.includes('proteccion universitaria')) return TUESDAY_SCHEDULE_MAP[3].time;
            if (name.includes('aidel') || name.includes('servicio social') || name.includes('reflexion') || name.includes('dada')) return TUESDAY_SCHEDULE_MAP[4].time;
            if (name.includes('planeacion') || name.includes('centro de participacion')) return TUESDAY_SCHEDULE_MAP[5].time;
            if (name.includes('medios universitarios')) return TUESDAY_SCHEDULE_MAP[6].time;

            return '13:00+'; // Fallback
        }

        // Lógica estándar para otros días (Lunes, Miércoles, Viernes...)
        /* ... existing standard logic ... */
        const startHour = 10;
        const durationMinutes = 20;
        const startDate = new Date();
        startDate.setHours(startHour, 0, 0, 0);

        // Aquí el 'index' es puramente secuencial en la lista renderizada...
        // Pero para Viernes agrupado (Nutrición+Laines), necesitamos que compartan.
        // Como 'index' incrementa por CADA botón, si imprimimos 2 botones, el segundo tendría +20min.
        // FIX: Usar un mapa de "Slots usados" o lógica de grupo.
        // Simplificación: Si es Vie (5) y es Nutrición o Laines, forzamos slot.

        if (dayIndex === 5) { // Viernes
            // 0: VILLAS
            // 1: PREPARATORIA
            // 2: MARKETING
            // 3: DIR COMUNICACION
            // 4: DEFENSORIA
            // 5: IBERO ACTIVATE
            // 6: NUTRICION + LAINES (Mismo slot)
            // 7: OFICINA ATEN TEC

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

        // Estándar (Mon/Wed) - Asumimos índice lineal simple por ahora,
        // pero idealmente deberíamos aplicar la misma lógica de mapa si hay agrupaciones.
        // Para Lunes/Miercoles hay grupo (Salud/Humanidades), tratemos de arreglarlo también.

        if (dayIndex === 1 || dayIndex === 3) {
            // ... Logic for Mon/Wed grouping ... (Simplificado: index-based funciona si están al final)
            const slotStart = new Date(startDate.getTime() + index * durationMinutes * 60000);
            const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000);
            const formatTime = (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return `${formatTime(slotStart)} - ${formatTime(slotEnd)}`;
        }

        // Fallback Default
        const slotStart = new Date(startDate.getTime() + index * durationMinutes * 60000);
        const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000);
        const formatTime = (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `${formatTime(slotStart)} - ${formatTime(slotEnd)}`;
    }

    async function loadAreas() {
        const container = document.getElementById('area-buttons-container');
        if (!container) return;

        // Semáforo en paralelo: los botones salen sin esperarlo y se colorean
        // en cuanto llega.
        const recencyPromise = getAreaRecency();
        let lastRecency = null;
        recencyPromise.then(r => { lastRecency = r; applyRecency(container, r); });

        // Áreas guardadas en el navegador: se pintan al instante y luego se
        // actualizan con las del servidor.
        const cached = readCache(CACHE_AREAS);
        if (cached && cached.length) renderAreas(cached);

        try {
            const snapshot = await db.collection('areas').get();
            const fresh = [];
            snapshot.forEach(doc => fresh.push({ id: doc.id, name: doc.data().name || '' }));
            const changed = JSON.stringify(fresh) !== JSON.stringify(cached);
            writeCache(CACHE_AREAS, fresh);
            if (changed) {
                renderAreas(fresh);
                if (lastRecency) applyRecency(container, lastRecency);
            }
        } catch (error) {
            console.error('Error cargando áreas:', error);
            if (!cached) container.innerHTML = '<div style="color: #ef4444;">Error al cargar áreas</div>';
        }

        function renderAreas(areaDocs) {
            container.innerHTML = '';

            // Deduplicar por nombre normalizado, agrupando todos los IDs
            const normalize = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
            const grouped = new Map(); // normName -> { id, name, allIds[] }

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

            // 1. Identificar Día Actual
            // FORCE CHANGE FOR TESTING: const today = 2;
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

            // Apply Grouping overrides to Sort Key (_routeIndex)
            inRouteAreas.forEach(area => {
                let effectiveIndex = area._routeIndex;
                const name = normalize(area.name);

                // ... (Grouping Logic from previous step: reuse SAME logic to keep order) ...
                const isMonWed = (today === 1 || today === 3);
                const isTueThu = (today === 2 || today === 4);
                const isFri = (today === 5);

                // Reuse valid grouping logic from Step 276
                if (isTueThu) {
                    if (name.includes('humanidades') || name.includes('ciencias sociales')) {
                        const leaderIndex = inRouteAreas.findIndex(a => normalize(a.name).includes('direcciones generales'));
                        if (leaderIndex !== -1) effectiveIndex = inRouteAreas[leaderIndex]._routeIndex; // Use route index of leader
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

            // Sort by effective index
            inRouteAreas.sort((a, b) => a._effectiveSort - b._effectiveSort);
            otherAreas.sort((a, b) => a.name.localeCompare(b.name));

            // Render - ALWAYS show both groups
            // 1. First render today's route areas (with time)
            if (inRouteAreas.length > 0) {
                inRouteAreas.forEach((area, index) => {
                    // Pass explicit arguments to new getTimeSlot
                    const timeSlot = getTimeSlot(index, today, area.name, null);
                    createAreaButton(area, container, timeSlot);
                });
            }

            // 2. Then add separator if we have both groups
            if (inRouteAreas.length > 0 && otherAreas.length > 0) {
                const separator = document.createElement('div');
                separator.style.cssText = 'width: 100%; border-top: 2px solid #e5e7eb; margin: 1rem 0; grid-column: 1 / -1;';
                container.appendChild(separator);
            }

            // 3. Finally render other areas
            if (otherAreas.length > 0) {
                otherAreas.forEach(area => {
                    createAreaButton(area, container);
                });
            }

            if (areas.length === 0) {
                container.innerHTML = '<div style="color: #999; width: 100%; text-align: center;">No hay áreas registradas</div>';
            }

            // Conservar el área que estaba abierta al repintar
            const current = areaDropdown.value;
            if (current) {
                container.querySelectorAll('.area-btn').forEach(b => {
                    if (b.dataset.allIds === current) b.classList.add('active');
                });
            }
        }
    }

    // Pinta el semáforo (verde/amarillo/rojo) sobre los botones ya creados
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

        // El color del semáforo lo pone applyRecency() cuando llega
        const btn = document.createElement('button');
        btn.className = 'area-btn';
        btn.dataset.id = area.id;
        btn.dataset.allIds = allIds.join(',');

        // Icono por defecto
        const iconContent = '<i class="fa-solid fa-building"></i>';

        const safeName = window.SecurityUtils
            ? window.SecurityUtils.escapeHTML(area.name)
            : area.name;

        // Layout: Nombre arriba, Horario (si existe) pequeño al lado o abajo
        // Usaremos flex en CSS, aquí solo estructura HTML
        let html = `<div style="display:flex; flex-direction:column; align-items:flex-start; line-height:1.2;">
                        <span>${iconContent} ${safeName}</span>`;

        if (timeSlot) {
            html += `<span style="font-size:0.75rem; opacity:0.85; margin-left:1.4rem; font-weight:400;">${timeSlot}</span>`;
        }

        html += `</div>`;

        btn.innerHTML = html;
        // Ajustar estilo del botón para permitir dos líneas
        btn.style.alignItems = 'center';

        btn.addEventListener('click', () => {
            const ids = area.allIds ? area.allIds.join(',') : area.id;
            selectArea(ids, btn);
        });

        container.appendChild(btn);
    }

    // Helper: Week Number
    function getWeekNumber(d) {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return weekNo;
    }

    // Mark "No Attendance" - When admin visits area but nobody shows up
    window.markNoAttendance = async function () {
        const areaId = areaDropdown.value; // Note: This might need update if using buttons, but let's keep it safe for now as we have a hidden input
        const sessionType = document.getElementById('session-type').value;

        if (!areaId) {
            alert('⚠️ Por favor selecciona un área primero');
            return;
        }

        // Get area name
        // Since we are using buttons now, we need to get the name differently if the select is hidden/empty
        // However, the hidden input is updated with ID. To get name, we might need to find the button or store it.
        // For now let's try to get it from the select if populated, or find the active button.
        let areaName = 'Área Desconocida';
        const activeBtn = document.querySelector('.area-btn.active');
        if (activeBtn) {
            areaName = activeBtn.innerText.trim();
        } else {
            const areaSelect = document.getElementById('area-dropdown');
            if (areaSelect && areaSelect.options.length > 0 && areaSelect.selectedIndex >= 0) {
                areaName = areaSelect.options[areaSelect.selectedIndex].text;
            }
        }

        const selectedDate = currentDate.toLocaleDateString('en-CA');

        const confirmMsg = `¿Confirmar que pasaste al área "${areaName}" pero no hubo asistencia?\n\n` +
            `Fecha: ${currentDate.toLocaleDateString('es-ES')}\n` +
            `Sesión: ${sessionType}\n\n` +
            `Esto quedará registrado para fines de seguimiento.`;

        if (!confirm(confirmMsg)) {
            return;
        }

        const btn = document.getElementById('btn-no-attendance');
        const originalHTML = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

        try {
            // Create a special record in a "no_attendance_logs" collection
            await db.collection('no_attendance_logs').add({
                areaId: areaId,
                areaName: areaName,
                date: selectedDate,
                sessionType: sessionType,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                weekNumber: getWeekNumber(currentDate),
                year: currentDate.getFullYear(),
                adminEmail: auth.currentUser ? auth.currentUser.email : 'unknown'
            });

            showToast(`✓ Registrado: Sin asistencia en ${areaName}`);

            // Optional: Show a visual confirmation
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
