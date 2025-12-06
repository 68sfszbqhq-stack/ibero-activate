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
    areaDropdown.addEventListener('change', loadEmployees);
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

    async function loadEmployees() {
        const areaId = areaDropdown.value;
        employeeList.innerHTML = ''; // Limpiar lista

        if (!areaId) return;

        try {
            // 1. Obtener empleados del área
            // Nota: Quitamos orderBy en Firestore para evitar requerir índice compuesto
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

            // 2. Verificar quiénes ya tienen asistencia en la FECHA SELECCIONADA
            const selectedDate = currentDate.toISOString().split('T')[0];

            // Obtener asistencias de todos los empleados del área para esta fecha
            const attendedEmployeeIds = new Set();
            for (const emp of employees) {
                const attSnapshot = await db.collection('employees')
                    .doc(emp.id)
                    .collection('attendance')
                    .where('date', '==', selectedDate)
                    .get();
                if (!attSnapshot.empty) {
                    attendedEmployeeIds.add(emp.id);
                }
            }



            // 3. Renderizar tarjetas
            employees.forEach(emp => {
                const isPresent = attendedEmployeeIds.has(emp.id);
                createEmployeeCard(emp.id, emp, isPresent);
            });

        } catch (error) {
            console.error('Error cargando empleados:', error);
            employeeList.innerHTML = '<div class="error">Error al cargar datos</div>';
        }
    }

    function createEmployeeCard(id, emp, isPresent) {
        const card = document.createElement('div');
        card.className = `employee-card ${isPresent ? 'selected' : ''}`;
        card.dataset.id = id;

        // Estilo visual para indicar estado
        const statusIcon = isPresent ? '<i class="fa-solid fa-check-circle"></i>' : '<i class="fa-regular fa-circle"></i>';

        card.innerHTML = `
            <div class="card-icon">${statusIcon}</div>
            <div class="card-info">
                <h3>${emp.fullName}</h3>
                <p>#${emp.accountNumber}</p>
            </div>
        `;

        // Click Event: Toggle Asistencia en Tiempo Real
        card.addEventListener('click', () => toggleAttendance(card, id, emp));

        employeeList.appendChild(card);
    }

    async function toggleAttendance(card, employeeId, employeeData) {
        // Prevenir doble clic rápido
        if (card.classList.contains('processing')) return;
        card.classList.add('processing');

        const isSelected = card.classList.contains('selected');
        const selectedDate = currentDate.toISOString().split('T')[0];
        const areaId = areaDropdown.value;

        try {
            if (!isSelected) {
                // 1. VERIFICACIÓN DOBLE (Server-side check)
                const checkSnapshot = await db.collection('employees')
                    .doc(employeeId)
                    .collection('attendance')
                    .where('date', '==', selectedDate)
                    .get();

                if (!checkSnapshot.empty) {
                    showToast('⚠️ Este empleado ya tiene asistencia en esta fecha.');
                    card.classList.add('selected'); // Sincronizar UI
                    card.querySelector('.card-icon').innerHTML = '<i class="fa-solid fa-check-circle"></i>';
                    return;
                }

                // 2. MARCAR ASISTENCIA (Crear documento en subcollection)
                await db.collection('employees')
                    .doc(employeeId)
                    .collection('attendance')
                    .add({
                        employeeName: employeeData.fullName,
                        areaId: areaId,
                        date: selectedDate,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                        status: 'active',
                        weekNumber: getWeekNumber(currentDate),
                        year: currentDate.getFullYear()
                    });

                card.classList.add('selected');
                card.querySelector('.card-icon').innerHTML = '<i class="fa-solid fa-check-circle"></i>';

                // Feedback visual rápido
                showToast(`Asistencia marcada: ${employeeData.fullName}`);

            } else {
                // DESMARCAR (Borrar documento de subcollection)
                const snapshot = await db.collection('employees')
                    .doc(employeeId)
                    .collection('attendance')
                    .where('date', '==', selectedDate)
                    .get();

                const batch = db.batch();
                snapshot.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });
                await batch.commit();

                card.classList.remove('selected');
                card.querySelector('.card-icon').innerHTML = '<i class="fa-regular fa-circle"></i>';
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
