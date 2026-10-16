// Lógica de Pase de Lista Extemporáneo
// Permite marcar asistencias para fechas pasadas

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
    const emptyState = document.getElementById('empty-state');

    // Variable para la fecha seleccionada
    let currentDate = null;

    // Inicializar fecha sin restricción de máximo (permite fechas pasadas y futuras)
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

    // Cargar Áreas
    loadAreas();

    // Event Listeners
    areaDropdown.addEventListener('change', loadEmployees);
    datePicker.addEventListener('change', (e) => {
        if (e.target.value) {
            currentDate = new Date(e.target.value + 'T12:00:00'); // Mediodía para evitar problemas de zona horaria
            updateDateDisplay();
            loadEmployees(); // Recargar empleados para la nueva fecha
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
        try {
            const snapshot = await db.collection('areas').get();
            areaDropdown.innerHTML = '<option value="">-- Seleccione un área --</option>';

            // Deduplicar por nombre normalizado
            const normalize = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
            const grouped = new Map(); // normName -> { name, ids[] }

            snapshot.forEach(doc => {
                const area = doc.data();
                const normName = normalize(area.name);
                if (grouped.has(normName)) {
                    grouped.get(normName).ids.push(doc.id);
                } else {
                    grouped.set(normName, { name: area.name, ids: [doc.id] });
                }
            });

            // Ordenar alfabéticamente por nombre visible
            const sorted = [...grouped.values()].sort((a, b) => a.name.localeCompare(b.name));

            sorted.forEach(group => {
                const option = document.createElement('option');
                option.value = group.ids.join(',');
                option.textContent = group.name;
                areaDropdown.appendChild(option);
            });
        } catch (error) {
            console.error('Error cargando áreas:', error);
        }
    }

    async function loadEmployees() {
        const areaValue = areaDropdown.value;

        employeeList.innerHTML = ''; // Limpiar lista

        // Validar que se haya seleccionado fecha y área
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

        // Ocultar empty state y mostrar loading
        emptyState.style.display = 'none';
        employeeList.innerHTML = '<div style="text-align: center; padding: 2rem; color: #666;"><i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem;"></i><br><br>Cargando empleados...</div>';

        const areaIds = areaValue.includes(',') ? areaValue.split(',') : [areaValue];

        try {
            // 1. Obtener empleados del área (soporta múltiples IDs con 'in')
            const snapshot = await db.collection('employees')
                .where('areaId', 'in', areaIds)
                .get();

            employeeList.innerHTML = ''; // Limpiar mensaje de carga

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

            // 2. Asistencia de cada empleado en la FECHA SELECCIONADA
            //    (consultas en paralelo, antes iban una por una)
            const selectedDate = currentDate.toISOString().split('T')[0];
            const statuses = await Promise.all(employees.map(emp =>
                db.collection('employees').doc(emp.id).collection('attendance')
                    .where('date', '==', selectedDate).get()
                    .then(snap => snap.empty ? null : snap.docs[0].data().status || 'active')
            ));

            // 3. Renderizar tarjetas
            employees.forEach((emp, i) => createEmployeeCard(emp.id, emp, statuses[i]));

        } catch (error) {
            console.error('Error cargando empleados:', error);
            employeeList.innerHTML = '<div class="error">Error al cargar datos</div>';
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

        // Click Event: Toggle Asistencia
        card.addEventListener('click', () => toggleAttendance(card, id, emp));

        employeeList.appendChild(card);
    }

    // Igual que el pase de lista: dos palomitas = completa; una = registro viejo
    function paintCard(card, status) {
        card.dataset.status = status || 'absent';
        card.classList.toggle('selected', !!status);
        const icon = status === 'completed'
            ? '<i class="fa-solid fa-check-double"></i>'
            : status ? '<i class="fa-solid fa-check"></i>'
            : '<i class="fa-regular fa-circle"></i>';
        card.querySelector('.card-icon').innerHTML = icon;
    }

    // Un toque = asistencia completa (dos palomitas, +20 pts), como en el pase
    // de lista. Tocar a alguien que ya tiene dos la quita y resta los puntos.
    async function toggleAttendance(card, employeeId, employeeData) {
        if (card.classList.contains('processing')) return;

        const currentStatus = card.dataset.status;
        const selectedDate = currentDate.toISOString().split('T')[0];
        const areaValue = areaDropdown.value;
        const areaId = employeeData.areaId || areaValue.split(',')[0];
        const empRef = db.collection('employees').doc(employeeId);

        if (currentStatus === 'completed') {
            const ok = confirm(`⚠️ ¿Quitar la asistencia del ${selectedDate} de ${employeeData.fullName}?\n\nSe le restan los 20 puntos que ganó.`);
            if (!ok) return;
        }

        card.classList.add('processing');
        paintCard(card, currentStatus === 'completed' ? null : 'completed'); // al instante

        try {
            // Registros de ese día (subcolección, top-level y feedback)
            const [subSnap, topSnap, fbSnap] = await Promise.all([
                empRef.collection('attendance').where('date', '==', selectedDate).get(),
                db.collection('attendances').where('employeeId', '==', employeeId).where('date', '==', selectedDate).get(),
                empRef.collection('feedback').where('date', '==', selectedDate).get()
            ]);
            const batch = db.batch();

            if (currentStatus === 'completed') {
                // QUITAR
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
                showToast(`❌ Asistencia eliminada: ${employeeData.fullName}`);
                return;
            }

            // MARCAR (sin palomita, o completar una sola de antes)
            let attendanceId;
            if (!subSnap.empty) {
                const existing = subSnap.docs[0];
                attendanceId = existing.id;
                batch.update(existing.ref, { status: 'completed' });
                topSnap.forEach(doc => batch.update(doc.ref, { status: 'completed' }));
            } else {
                // El periodo sale de la FECHA (puede ser de un periodo pasado)
                const periodId = window.Periods
                    ? await window.Periods.getPeriodIdForDate(selectedDate)
                    : null;
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
                    periodId: periodId,
                    isLate: true // Marcar como asistencia extemporánea
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

            await batch.commit();
            showToast(`✅ Asistencia completa (+20 pts): ${employeeData.fullName}`);

        } catch (error) {
            console.error('Error actualizando asistencia:', error);
            paintCard(card, currentStatus === 'absent' ? null : currentStatus); // regresar
            showToast('❌ No se guardó. Revisa tu conexión e intenta de nuevo.');
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
