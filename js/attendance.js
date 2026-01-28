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
        datePicker.value = currentDate.toISOString().split('T')[0];
    }

    async function loadAreas() {
        const container = document.getElementById('area-buttons-container');
        if (!container) return;

        try {
            const snapshot = await db.collection('areas').get();
            container.innerHTML = ''; // Limpiar mensaje de carga

            let areas = [];
            snapshot.forEach(doc => {
                areas.push({ id: doc.id, ...doc.data() });
            });

            // ORDENAR SEGÚN RECORRIDO POR DÍAS
            // TODO: Implementar lógica de ruta cuando el admin confirme el recorrido
            areas = sortAreasByRoute(areas);

            if (areas.length === 0) {
                container.innerHTML = '<div style="color: #999; width: 100%; text-align: center;">No hay áreas registradas</div>';
                return;
            }

            areas.forEach(area => {
                const btn = document.createElement('button');
                btn.className = 'area-btn';
                btn.dataset.id = area.id;

                // Icono por defecto
                const iconContent = '<i class="fa-solid fa-building"></i>';

                const safeName = window.SecurityUtils
                    ? window.SecurityUtils.escapeHTML(area.name)
                    : area.name;

                btn.innerHTML = `${iconContent} ${safeName}`;

                btn.addEventListener('click', () => {
                    selectArea(area.id, btn);
                });

                container.appendChild(btn);
            });

        } catch (error) {
            console.error('Error cargando áreas:', error);
            container.innerHTML = '<div style="color: #ef4444;">Error al cargar áreas</div>';
        }
    }

    function sortAreasByRoute(areas) {
        // Aquí implementaremos la lógica del recorrido
        // Por ahora, orden alfabético
        return areas.sort((a, b) => a.name.localeCompare(b.name));
    }

    function selectArea(areaId, btnElement) {
        // Actualizar input oculto para compatibilidad
        const hiddenInput = document.getElementById('area-dropdown');
        if (hiddenInput) hiddenInput.value = areaId;

        // Actualizar visualmente
        document.querySelectorAll('.area-btn').forEach(b => b.classList.remove('active'));
        if (btnElement) btnElement.classList.add('active');

        // Cargar empleados
        loadEmployees();
    }

    let unsubscribe = null; // Para detener el listener cuando cambie la fecha/área

    async function loadEmployees() {
        const areaId = areaDropdown.value;
        const emptyState = document.getElementById('empty-state');

        employeeList.innerHTML = ''; // Limpiar lista

        // Detener listener anterior si existe
        if (unsubscribe) {
            unsubscribe();
            unsubscribe = null;
        }

        if (!areaId) {
            emptyState.style.display = 'block';
            return;
        }

        // Ocultar empty state y mostrar loading
        emptyState.style.display = 'none';
        employeeList.innerHTML = '<div style="text-align: center; padding: 2rem; color: #666;"><i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem;"></i><br><br>Cargando empleados...</div>';

        try {
            // 1. Obtener empleados del área (Static fetch)
            const snapshot = await db.collection('employees')
                .where('areaId', '==', areaId)
                .get();

            if (snapshot.empty) {
                // SEGURIDAD XSS: Crear mensaje de forma segura
                employeeList.innerHTML = '';
                const noDataDiv = document.createElement('div');
                noDataDiv.className = 'no-data';
                noDataDiv.textContent = 'No hay empleados en esta área';
                employeeList.appendChild(noDataDiv);
                return;
            }

            // Convertir a array y ordenar en cliente
            let employees = [];
            snapshot.forEach(doc => {
                employees.push({ id: doc.id, ...doc.data() });
            });

            employees.sort((a, b) => a.fullName.localeCompare(b.fullName));

            // Renderizar slots vacíos primero (para llenar luego con el listener)
            employeeList.innerHTML = '';
            employees.forEach(emp => {
                createEmployeeCard(emp.id, emp, null); // null status initially
            });

            // 2. ACTIVAR LISTENER DE ASISTENCIAS (Real-time)
            const selectedDate = currentDate.toISOString().split('T')[0];

            // Escuchar cambios en la collección TOP-LEVEL 'attendances' para esta fecha
            // Esto detectará instantáneamente cuando se crea una asistencia O cuando cambia a 'completed'
            unsubscribe = db.collection('attendances')
                .where('date', '==', selectedDate)
                .onSnapshot((attSnapshot) => {
                    console.log('🔄 Listener de asistencias activado - Documentos:', attSnapshot.size);

                    // Crear mapa de asistencias: ID_Empleado -> Status
                    const attendanceMap = new Map();
                    attSnapshot.forEach(doc => {
                        const data = doc.data();
                        if (data.employeeId) { // Asegurar que tenga ID
                            // Si hay duplicados (raro), el último gana.
                            // Importante: Diferenciar 'active' de 'completed'
                            attendanceMap.set(data.employeeId, data.status);
                            console.log(`  - ${data.employeeName}: ${data.status}`);
                        }
                    });

                    // Actualizar UI para cada empleado
                    let updatedCount = 0;
                    employees.forEach(emp => {
                        const status = attendanceMap.get(emp.id); // 'active', 'completed', or undefined
                        const card = document.getElementById(`card-${emp.id}`);
                        const previousStatus = card ? card.dataset.status : null;

                        if (previousStatus !== status) {
                            console.log(`✏️ Actualizando ${emp.fullName}: ${previousStatus} → ${status}`);
                            updatedCount++;
                        }

                        updateEmployeeCardStatus(emp.id, status);
                    });

                    console.log(`✅ Listener completado - ${updatedCount} tarjetas actualizadas`);

                }, (error) => {
                    console.error("❌ Error en listener de asistencia:", error);
                });

        } catch (error) {
            console.error('Error cargando empleados:', error);
            // SEGURIDAD XSS: Crear mensaje de error de forma segura
            employeeList.innerHTML = '';
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error';
            errorDiv.textContent = 'Error al cargar datos';
            employeeList.appendChild(errorDiv);
        }
    }

    function createEmployeeCard(id, emp, status) {
        const card = document.createElement('div');
        card.className = 'employee-card';
        card.id = `card-${id}`;
        card.dataset.id = id;

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

        card.appendChild(iconDiv);
        card.appendChild(infoDiv);

        // Click Event: Toggle Asistencia
        card.addEventListener('click', () => toggleAttendance(card, id, emp));

        employeeList.appendChild(card);
    }

    function updateEmployeeCardStatus(id, status) {
        const card = document.getElementById(`card-${id}`);
        if (!card) return;

        const iconContainer = card.querySelector('.card-icon');
        // Limpiar botones previos de reset si existen
        const existingReset = card.querySelector('.reset-btn-overlay');
        if (existingReset) existingReset.remove();

        // Limpiar clases de estado previo
        card.classList.remove('selected', 'completed');

        if (status === 'active') {
            // ASISTENCIA MARCADA (Pendiente de feedback)
            card.classList.add('selected');
            iconContainer.innerHTML = '<i class="fa-solid fa-check-circle"></i>';
            card.style.borderColor = 'var(--primary)';
            card.style.backgroundColor = 'var(--light-bg)';

        } else if (status === 'completed') {
            // FEEDBACK RECIBIDO (Ciclo completo)
            card.classList.add('selected', 'completed');
            // Doble Check
            iconContainer.innerHTML = '<i class="fa-solid fa-check-double" style="color: #4CAF50;"></i>';
            card.style.borderColor = '#4CAF50';
            card.style.backgroundColor = '#e8f5e9'; // Verde clarito

            // --- BOTÓN DE RESET/ELIMINAR (SOLICITADO POR USUARIO) ---
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
                e.stopPropagation(); // Evitar que dispare el toggle
                deleteAttendanceRecord(id);
            });

            card.style.position = 'relative'; // Asegurar posicionamiento
            card.appendChild(resetBtn);

        } else {
            // AUSENTE
            iconContainer.innerHTML = '<i class="fa-regular fa-circle"></i>';
            card.style.borderColor = '#e1e4e8';
            card.style.backgroundColor = '#fff';
        }

        // Guardar status actual
        card.dataset.status = status || 'absent';
    }

    // Nueva función para borrar explícitamente desde el botón
    async function deleteAttendanceRecord(employeeId) {
        const confirmDelete = confirm('⚠️ ¿Estás seguro de ELIMINAR la asistencia y feedback de hoy para este empleado?');
        if (!confirmDelete) return;

        const selectedDate = currentDate.toISOString().split('T')[0] || new Date().toLocaleDateString('en-CA'); // Fallback YYYY-MM-DD

        try {
            const batch = db.batch();

            // 1. Buscar y Borrar de employees/{id}/attendance
            const attSnapshot = await db.collection('employees').doc(employeeId).collection('attendance')
                .where('date', '==', selectedDate).get();

            attSnapshot.forEach(doc => batch.delete(doc.ref));

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

    async function toggleAttendance(card, employeeId, employeeData) {
        // Prevenir doble clic rápido
        if (card.classList.contains('processing')) return;
        card.classList.add('processing');

        const currentStatus = card.dataset.status || 'absent';
        const selectedDate = currentDate.toISOString().split('T')[0];

        // Obtener ID del área de forma segura (re-query por si acaso)
        const hiddenInput = document.getElementById('area-dropdown');
        const areaId = hiddenInput ? hiddenInput.value : '';

        if (!areaId) {
            alert('Error: No se ha seleccionado un área válida. Por favor recarga la página.');
            card.classList.remove('processing');
            return;
        }

        try {

            if (currentStatus === 'absent') {
                // MARCAR ASISTENCIA
                // Primero verificar si ya existe una asistencia para este empleado en esta fecha
                const existingAttendanceSnapshot = await db.collection('employees')
                    .doc(employeeId)
                    .collection('attendance')
                    .where('date', '==', selectedDate)
                    .get();

                if (!existingAttendanceSnapshot.empty) {
                    // YA EXISTE UNA ASISTENCIA
                    const existingDoc = existingAttendanceSnapshot.docs[0];
                    const existingData = existingDoc.data();
                    const existingDocId = existingDoc.id;

                    // Verificar el estado de la asistencia existente
                    if (existingData.status === 'completed') {
                        // Ya dio feedback - NO reactivar para evitar que aparezca en la lista
                        alert(
                            `ℹ️ ${employeeData.fullName} ya tiene asistencia registrada para hoy y ya dio su feedback.\n\n` +
                            `Si necesitas marcarlo de nuevo, primero debes eliminar su asistencia actual haciendo clic en su tarjeta.`
                        );
                        card.classList.remove('processing');
                        return;
                    } else if (existingData.status === 'active') {
                        // Asistencia activa existente.
                        // Verificar si ahora queremos "Completarla" (Upgrade) usando el toggle
                        const skipFeedback = document.getElementById('skip-feedback-toggle').checked;

                        if (skipFeedback) {
                            // UPGRADE: Active -> Completed (+20 pts)
                            const batch = db.batch();

                            // 1. Actualizar ambas colecciones a 'completed'
                            const updateData = {
                                status: 'completed',
                                timestamp: firebase.firestore.FieldValue.serverTimestamp()
                            };

                            const subRef = db.collection('employees').doc(employeeId).collection('attendance').doc(existingDocId);
                            const topRef = db.collection('attendances').doc(existingDocId);

                            batch.update(subRef, updateData);
                            batch.update(topRef, updateData);

                            // 2. Dar puntos (+20)
                            const empRef = db.collection('employees').doc(employeeId);
                            batch.update(empRef, {
                                points: firebase.firestore.FieldValue.increment(20),
                                lastAttendance: firebase.firestore.FieldValue.serverTimestamp()
                            });

                            // 3. Crear feedback fantasma
                            const feedRef = db.collection('employees').doc(employeeId).collection('feedback').doc();
                            batch.set(feedRef, {
                                attendanceId: existingDocId,
                                rating: 5,
                                reaction: '⚡',
                                comment: 'Feedback omitido por admin (Upgrade +20 pts)',
                                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                                date: selectedDate,
                                autoGenerated: true
                            });

                            await batch.commit();
                            showToast(`Asistencia completada (+20 pts): ${employeeData.fullName}`);

                        } else {
                            // SOLO REACTIVAR (Timestamp update) - Comportamiento original
                            const reactivationData = {
                                status: 'active',
                                timestamp: firebase.firestore.FieldValue.serverTimestamp()
                            };

                            await db.collection('employees')
                                .doc(employeeId)
                                .collection('attendance')
                                .doc(existingDocId)
                                .update(reactivationData);

                            await db.collection('attendances')
                                .doc(existingDocId)
                                .update(reactivationData);

                            showToast(`Asistencia actualizada: ${employeeData.fullName}`);
                        }
                    }
                } else {
                    // NO EXISTE - Crear nueva asistencia
                    // Verificar si OMITIR FEEDBACK está activo
                    const skipFeedback = document.getElementById('skip-feedback-toggle').checked;
                    const status = skipFeedback ? 'completed' : 'active';

                    const attendanceData = {
                        employeeId: employeeId,
                        employeeName: employeeData.fullName,
                        areaId: areaId,
                        date: selectedDate,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                        status: status,
                        weekNumber: getWeekNumber(currentDate),
                        year: currentDate.getFullYear()
                    };

                    const batch = db.batch();

                    // 1. Crear en subcollection
                    const subRef = db.collection('employees').doc(employeeId).collection('attendance').doc();
                    batch.set(subRef, attendanceData);

                    // 2. Crear en Top-Level (mismo ID)
                    const topRef = db.collection('attendances').doc(subRef.id);
                    batch.set(topRef, attendanceData);

                    // 3. SOLO SI OMITIR FEEDBACK: Dar puntos automáticamente (+20) y actualizar lastAttendance
                    if (skipFeedback) {
                        const empRef = db.collection('employees').doc(employeeId);
                        batch.update(empRef, {
                            points: firebase.firestore.FieldValue.increment(20),
                            lastAttendance: firebase.firestore.FieldValue.serverTimestamp()
                        });

                        // Opcional: Crear un feedback "fantasma" para registro histórico
                        const feedRef = db.collection('employees').doc(employeeId).collection('feedback').doc();
                        batch.set(feedRef, {
                            attendanceId: subRef.id,
                            rating: 5, // Default 5 estrellas
                            reaction: '⚡', // Auto
                            comment: 'Feedback omitido por admin (Auto +20 pts)',
                            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                            date: selectedDate,
                            autoGenerated: true
                        });
                    }

                    await batch.commit();

                    const msg = skipFeedback
                        ? `Asistencia completa (+20 pts): ${employeeData.fullName}`
                        : `Asistencia marcada: ${employeeData.fullName}`;
                    showToast(msg);
                }

            } else {
                // DESMARCAR (Borrar) - Aplica tanto para 'active' como 'completed' si el admin quiere borrarlo

                // Si el status es 'completed', significa que ya hay feedback. Pedir confirmación.
                if (currentStatus === 'completed') {
                    const confirmDelete = confirm(
                        `⚠️ ${employeeData.fullName} ya dio su feedback.\n\n` +
                        `¿Estás seguro de que quieres eliminar esta asistencia?\n\n` +
                        `Esto también eliminará su feedback asociado.`
                    );

                    if (!confirmDelete) {
                        card.classList.remove('processing');
                        return;
                    }
                }

                // Buscar registros para borrar (usando ID de empleado y fecha)
                const snapshot = await db.collection('employees')
                    .doc(employeeId)
                    .collection('attendance')
                    .where('date', '==', selectedDate)
                    .get();

                const topLevelSnapshot = await db.collection('attendances')
                    .where('employeeId', '==', employeeId)
                    .where('date', '==', selectedDate)
                    .get();

                // Si hay feedback asociado, también eliminarlo
                const feedbackSnapshot = await db.collection('employees')
                    .doc(employeeId)
                    .collection('feedback')
                    .where('date', '==', selectedDate)
                    .get();

                const batch = db.batch();

                // Eliminar asistencias en subcollection
                snapshot.docs.forEach(doc => {
                    batch.delete(doc.ref);
                    // Intento borrar por ID directo si coincide
                    batch.delete(db.collection('attendances').doc(doc.id));
                });

                // Eliminar asistencias en top-level
                topLevelSnapshot.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });

                // Eliminar feedback asociado
                feedbackSnapshot.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });

                await batch.commit();
                showToast(`Asistencia eliminada: ${employeeData.fullName}`);
            }
        } catch (error) {
            console.error('Error actualizando asistencia:', error);
            alert('Error de conexión. Intenta de nuevo.');
        } finally {
            card.classList.remove('processing');
        }
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
            'DIRECCIONES GENERALES', // ← Nuevo, justo después de Servicios Escolares
            'NEGOCIOS',
            'IDIT',
            'PROTECCIÓN UNIVERSITARIA',
            'AIDEL',
            'SERVICIO SOCIAL',
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
        4: [ // JUEVES (Igual que Martes)
            'SERVICIOS ESCOLARES',
            'DIRECCIONES GENERALES', // ← Nuevo
            'NEGOCIOS',
            'IDIT',
            'PROTECCIÓN UNIVERSITARIA',
            'AIDEL',
            'SERVICIO SOCIAL',
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
            'LAINES',
            'OFICINA DE ATEN TECNOLOGICA'
        ]
    };

    // Helper para generar horarios
    function getTimeSlot(index, startHour = 10, startMinute = 0, durationMinutes = 20) {
        const startDate = new Date();
        startDate.setHours(startHour, startMinute, 0, 0);

        // Sumar tiempo según el índice
        const slotStart = new Date(startDate.getTime() + index * durationMinutes * 60000);
        const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000);

        // Formatear HH:MM
        const formatTime = (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Limitar hasta las 13:00 si se pasa (opcional, pero pedido por usuario "hasta las 13:00")
        if (slotStart.getHours() >= 13) return null; // O manejar overflow

        return `${formatTime(slotStart)} - ${formatTime(slotEnd)}`;
    }

    async function loadAreas() {
        const container = document.getElementById('area-buttons-container');
        if (!container) return;

        try {
            const snapshot = await db.collection('areas').get();
            container.innerHTML = ''; // Limpiar mensaje de carga

            let areas = [];
            snapshot.forEach(doc => {
                areas.push({ id: doc.id, ...doc.data() }); // Normaliza nombres aquí si es necesario
            });

            // 1. Identificar Día Actual
            const today = new Date().getDay(); // 0(Dom) - 6(Sab)

            // 2. Definir Clase de Color según el día
            let colorClass = '';
            if (today === 1 || today === 3) colorClass = 'day-mon-wed'; // Lunes/Miercoles (Azul)
            else if (today === 2 || today === 4) colorClass = 'day-tue-thu'; // Martes/Jueves (Verde)
            else if (today === 5) colorClass = 'day-fri'; // Viernes (Morado)

            // 3. Separar Rutas de Hoy vs Otros
            const todaysRoute = WEEKLY_ROUTE[today] || [];

            // Normalizar string para comparación
            const normalize = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

            // Mapa rápido de la ruta
            const routeMap = new Map();
            todaysRoute.forEach((name, index) => routeMap.set(normalize(name), index));

            const inRouteAreas = [];
            const otherAreas = [];

            areas.forEach(area => {
                const normName = normalize(area.name);
                // Búsqueda exacta o parcial
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

            // Ordenar grupos
            inRouteAreas.sort((a, b) => a._routeIndex - b._routeIndex);
            otherAreas.sort((a, b) => a.name.localeCompare(b.name));


            // 4. Renderizar: Grupo HOY (Con color)
            if (inRouteAreas.length > 0) {
                inRouteAreas.forEach((area, index) => {
                    // Calcular horario solo para los que están en ruta
                    const timeSlot = getTimeSlot(index);
                    createAreaButton(area, container, colorClass, timeSlot);
                });
            } else {
                container.innerHTML += '<div style="width:100%; text-align:center; color:#9ca3af; font-size:0.9rem; padding:0.5rem;">Hoy no hay ruta programada (o es fin de semana)</div>';
            }

            // 5. Separador (si hay otras áreas)
            if (otherAreas.length > 0) {
                const separator = document.createElement('div');
                separator.className = 'areas-separator';
                separator.innerHTML = '<span>Otras Áreas</span>';
                container.appendChild(separator);

                // 6. Renderizar: Otros (Sin color especial)
                otherAreas.forEach(area => {
                    createAreaButton(area, container, ''); // Sin clase extra (blanco/gris)
                });
            }

            if (areas.length === 0) {
                container.innerHTML = '<div style="color: #999; width: 100%; text-align: center;">No hay áreas registradas</div>';
            }

        } catch (error) {
            console.error('Error cargando áreas:', error);
            container.innerHTML = '<div style="color: #ef4444;">Error al cargar áreas</div>';
        }
    }

    function createAreaButton(area, container, extraClass, timeSlot = null) {
        const btn = document.createElement('button');
        btn.className = `area-btn ${extraClass}`;
        btn.dataset.id = area.id;

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
            selectArea(area.id, btn);
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

        const selectedDate = currentDate.toISOString().split('T')[0];

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
