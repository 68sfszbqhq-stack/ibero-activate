// Lógica de Pase de Lista

document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticación primero (manejado por auth.js)

    // Inicializar fecha
    const dateDisplay = document.getElementById('current-date-display');
    if (dateDisplay) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateDisplay.textContent = new Date().toLocaleDateString('es-ES', options);
    }

    // Elementos DOM
    const areaDropdown = document.getElementById('area-dropdown');
    const employeeList = document.getElementById('employee-list');
    const emptyState = document.getElementById('empty-state');
    const loadingIndicator = document.getElementById('loading-indicator');
    const saveBtn = document.getElementById('save-attendance');
    const countSpan = document.getElementById('count');
    const selectAllBtn = document.getElementById('select-all-btn');

    // Cargar áreas
    loadAreas();

    // Event Listeners
    if (areaDropdown) {
        areaDropdown.addEventListener('change', (e) => {
            const areaId = e.target.value;
            if (areaId) {
                loadEmployees(areaId);
            } else {
                showEmptyState();
            }
        });
    }

    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', toggleSelectAll);
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', saveAttendances);
    }

    // Funciones
    async function loadAreas() {
        try {
            const snapshot = await db.collection('areas').orderBy('name').get();

            if (snapshot.empty) {
                console.log('No hay áreas registradas');
                // Crear datos de prueba si está vacío (solo para desarrollo)
                // createDummyData(); 
                return;
            }

            snapshot.forEach(doc => {
                const area = doc.data();
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = area.name;
                areaDropdown.appendChild(option);
            });
        } catch (error) {
            console.error('Error al cargar áreas:', error);
            alert('Error al cargar las áreas. Verifica tu conexión.');
        }
    }

    async function loadEmployees(areaId) {
        // UI Updates
        emptyState.classList.add('hidden');
        employeeList.classList.add('hidden');
        loadingIndicator.classList.remove('hidden');
        saveBtn.classList.add('hidden');

        try {
            const snapshot = await db.collection('employees')
                .where('areaId', '==', areaId)
                .orderBy('fullName')
                .get();

            loadingIndicator.classList.add('hidden');
            employeeList.innerHTML = '';

            if (snapshot.empty) {
                employeeList.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No hay empleados en esta área.</p>';
                employeeList.classList.remove('hidden');
                return;
            }

            snapshot.forEach(doc => {
                const employee = doc.data();
                const card = createEmployeeCard(doc.id, employee);
                employeeList.appendChild(card);
            });

            employeeList.classList.remove('hidden');
            saveBtn.classList.remove('hidden');
            updateCount();

        } catch (error) {
            console.error('Error al cargar empleados:', error);
            loadingIndicator.classList.add('hidden');
            alert('Error al cargar empleados.');
        }
    }

    function createEmployeeCard(id, employee) {
        const div = document.createElement('div');
        div.className = 'employee-card';
        div.dataset.id = id;

        // Iniciales para avatar
        const initials = employee.fullName
            .split(' ')
            .map(n => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();

        div.innerHTML = `
            <div class="checkbox-wrapper">
                <input type="checkbox" id="${id}" class="attendance-checkbox">
            </div>
            <div class="avatar-small">${initials}</div>
            <div class="employee-info">
                <h3>${employee.fullName}</h3>
                <span class="account-number">#${employee.accountNumber}</span>
            </div>
        `;

        // Click en tarjeta selecciona checkbox
        div.addEventListener('click', (e) => {
            if (e.target.type !== 'checkbox') {
                const checkbox = div.querySelector('.attendance-checkbox');
                checkbox.checked = !checkbox.checked;
                toggleCardSelection(div, checkbox.checked);
                updateCount();
            }
        });

        // Evento directo en checkbox
        const checkbox = div.querySelector('.attendance-checkbox');
        checkbox.addEventListener('change', (e) => {
            toggleCardSelection(div, e.target.checked);
            updateCount();
        });

        return div;
    }

    function toggleCardSelection(card, isSelected) {
        if (isSelected) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    }

    function updateCount() {
        const checked = document.querySelectorAll('.attendance-checkbox:checked').length;
        countSpan.textContent = checked;
    }

    function toggleSelectAll() {
        const checkboxes = document.querySelectorAll('.attendance-checkbox');
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);

        checkboxes.forEach(cb => {
            cb.checked = !allChecked;
            const card = cb.closest('.employee-card');
            toggleCardSelection(card, !allChecked);
        });

        updateCount();
    }

    function showEmptyState() {
        emptyState.classList.remove('hidden');
        employeeList.classList.add('hidden');
        loadingIndicator.classList.add('hidden');
        saveBtn.classList.add('hidden');
    }

    async function saveAttendances() {
        const checkboxes = document.querySelectorAll('.attendance-checkbox:checked');

        if (checkboxes.length === 0) {
            alert('Selecciona al menos un empleado.');
            return;
        }

        const saveBtn = document.getElementById('save-attendance');
        const originalText = saveBtn.innerHTML;
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

        try {
            const batch = db.batch();
            const today = new Date().toISOString().split('T')[0];
            const sessionType = document.getElementById('session-type').value;
            const areaId = document.getElementById('area-dropdown').value;
            const currentUser = auth.currentUser;

            checkboxes.forEach(checkbox => {
                const employeeId = checkbox.id;
                const attendanceRef = db.collection('attendances').doc();

                batch.set(attendanceRef, {
                    employeeId,
                    areaId,
                    date: today,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    markedBy: currentUser ? currentUser.uid : 'unknown',
                    sessionType,
                    weekNumber: getWeekNumber(new Date()),
                    year: new Date().getFullYear()
                });

                // Actualizar puntos del empleado (Attendance = 10 pts)
                // Esto idealmente se haría con Cloud Functions, pero lo haremos aquí para simplificar
                updateEmployeePoints(employeeId, 10);
            });

            await batch.commit();

            alert(`✅ ${checkboxes.length} asistencias guardadas correctamente.`);

            // Resetear selección
            const allCheckboxes = document.querySelectorAll('.attendance-checkbox');
            allCheckboxes.forEach(cb => {
                cb.checked = false;
                toggleCardSelection(cb.closest('.employee-card'), false);
            });
            updateCount();

        } catch (error) {
            console.error('Error al guardar:', error);
            alert('Hubo un error al guardar las asistencias.');
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalText;
        }
    }

    // Helper para actualizar puntos (simplificado)
    function updateEmployeePoints(employeeId, pointsToAdd) {
        const weekNumber = getWeekNumber(new Date());
        const year = new Date().getFullYear();

        // Esta lógica es compleja para ejecutar en cliente por cada empleado en batch
        // En una app real, usaríamos Cloud Functions.
        // Aquí solo registraremos la asistencia y dejaremos que el dashboard calcule o 
        // actualizaremos puntos cuando el usuario entre a su perfil.
    }

    // Helper para número de semana ISO
    function getWeekNumber(d) {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return weekNo;
    }
});
