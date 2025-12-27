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

    // Establecer fecha máxima (hoy) en el date picker
    datePicker.max = new Date().toISOString().split('T')[0];
    datePicker.value = currentDate.toISOString().split('T')[0];

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
        try {
            const snapshot = await db.collection('areas').get();
            areaDropdown.innerHTML = '<option value="">Selecciona un Área...</option>';

            snapshot.forEach(doc => {
                const area = doc.data();
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = area.name;
                areaDropdown.appendChild(option);
            });
        } catch (error) {
            console.error('Error cargando áreas:', error);
        }
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
                employeeList.innerHTML = '<div class="no-data">No hay empleados en esta área</div>';
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
            employeeList.innerHTML = '<div class="error">Error al cargar datos</div>';
        }
    }

    function createEmployeeCard(id, emp, status) {
        const card = document.createElement('div');
        card.className = 'employee-card'; // Quitamos 'selected' inicial, lo manejará updateEmployeeCardStatus
        card.id = `card-${id}`; // ID para busqueda rápida
        card.dataset.id = id;

        card.innerHTML = `
            <div class="card-icon"><i class="fa-regular fa-circle"></i></div>
            <div class="card-info">
                <h3>${emp.fullName}</h3>
                <p>#${emp.accountNumber}</p>
            </div>
        `;

        // Click Event: Toggle Asistencia
        card.addEventListener('click', () => toggleAttendance(card, id, emp));

        employeeList.appendChild(card);
    }

    function updateEmployeeCardStatus(id, status) {
        const card = document.getElementById(`card-${id}`);
        if (!card) return;

        const iconContainer = card.querySelector('.card-icon');

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
            // Doble Check O Check Azul/Diferente
            iconContainer.innerHTML = '<i class="fa-solid fa-check-double" style="color: #4CAF50;"></i>';
            card.style.borderColor = '#4CAF50';
            card.style.backgroundColor = '#e8f5e9'; // Verde clarito

        } else {
            // AUSENTE
            iconContainer.innerHTML = '<i class="fa-regular fa-circle"></i>';
            card.style.borderColor = '#e1e4e8';
            card.style.backgroundColor = '#fff';
        }

        // Guardar status actual en dataset para lógica de toggle
        card.dataset.status = status || 'absent';
    }

    async function toggleAttendance(card, employeeId, employeeData) {
        // Prevenir doble clic rápido
        if (card.classList.contains('processing')) return;
        card.classList.add('processing');

        const currentStatus = card.dataset.status || 'absent';
        const selectedDate = currentDate.toISOString().split('T')[0];
        const areaId = areaDropdown.value;

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
                        // Asistencia activa pero sin feedback - Reactivar por redundancia
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
                } else {
                    // NO EXISTE - Crear nueva asistencia
                    const attendanceData = {
                        employeeId: employeeId,
                        employeeName: employeeData.fullName,
                        areaId: areaId,
                        date: selectedDate,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                        status: 'active',
                        weekNumber: getWeekNumber(currentDate),
                        year: currentDate.getFullYear()
                    };

                    // 1. Crear en subcollection (source of truth histórico)
                    const subcollectionDoc = await db.collection('employees')
                        .doc(employeeId)
                        .collection('attendance')
                        .add(attendanceData);

                    // 2. Crear en Top-Level (para real-time y queries rápidas)
                    await db.collection('attendances').doc(subcollectionDoc.id).set(attendanceData);

                    showToast(`Asistencia marcada: ${employeeData.fullName}`);
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

    // Helper: Week Number
    function getWeekNumber(d) {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return weekNo;
    }
});
