// Lógica de Feedback Extemporáneo
// Muestra automáticamente los empleados con asistencia pendiente de una fecha seleccionada

document.addEventListener('DOMContentLoaded', () => {
    // Estado local
    let selectedEmployee = null;
    let currentRating = 0;
    let currentEmoji = '';
    let currentAttendanceId = null;
    let currentAttendanceRef = null;
    let selectedDate = null;

    // Elementos DOM
    const datePicker = document.getElementById('date-picker');
    const dateDisplay = document.getElementById('current-date');
    const liveList = document.getElementById('live-list');
    const waitingMessage = document.getElementById('waiting-message');
    const emptyState = document.getElementById('empty-state');
    const feedbackForm = document.getElementById('feedback-form');
    const successState = document.getElementById('success-state');
    const welcomeSection = document.getElementById('welcome-section');

    // Elementos del perfil seleccionado
    const profileAvatar = document.getElementById('profile-avatar');
    const employeeName = document.getElementById('employee-name');
    const employeeAccount = document.getElementById('employee-account');
    const attendanceDate = document.getElementById('attendance-date');
    const changeUserBtn = document.getElementById('change-user-btn');

    // Elementos de interacción
    const stars = document.querySelectorAll('.star');
    const ratingText = document.getElementById('rating-text');
    const emojiBtns = document.querySelectorAll('.emoji-btn');
    const submitBtn = document.getElementById('submit-feedback');
    const newFeedbackBtn = document.getElementById('new-feedback-btn');

    // Event Listeners
    if (datePicker) datePicker.addEventListener('change', handleDateChange);
    if (changeUserBtn) changeUserBtn.addEventListener('click', resetSelection);
    if (newFeedbackBtn) newFeedbackBtn.addEventListener('click', () => {
        resetSelection();
        successState.classList.add('hidden');
        welcomeSection.classList.remove('hidden');
    });
    if (submitBtn) submitBtn.addEventListener('click', submitFeedback);

    // Setup interaction logic (stars & emojis)
    setupInteractionLogic();

    async function handleDateChange(e) {
        selectedDate = e.target.value;
        console.log('📅 Fecha seleccionada:', selectedDate);
        if (!selectedDate) return;

        // Actualizar display
        const dateObj = new Date(selectedDate + 'T12:00:00');
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateDisplay.textContent = dateObj.toLocaleDateString('es-ES', options);
        console.log('📅 Display actualizado a:', dateDisplay.textContent);

        // Cargar asistencias de esa fecha
        await loadAttendancesForDate(selectedDate);
    }

    async function loadAttendancesForDate(date) {
        console.log('🔄 Iniciando búsqueda de asistencias para:', date);
        liveList.innerHTML = '';
        waitingMessage.classList.add('hidden');
        emptyState.classList.add('hidden');

        try {
            console.log('🔍 Ejecutando collectionGroup query...');
            // Buscar TODAS las asistencias de esa fecha con status 'active' (pendientes de feedback)
            // Usamos collectionGroup para buscar en todas las subcollections de attendance
            const attendancesQuery = await db.collectionGroup('attendance')
                .where('date', '==', date)
                .where('status', '==', 'active')
                .get();

            console.log('📊 Resultados encontrados:', attendancesQuery.size);

            if (attendancesQuery.empty) {
                console.log('❌ No se encontraron asistencias pendientes para esta fecha');
                emptyState.classList.remove('hidden');
                return;
            }

            // Para cada asistencia, crear un botón con el nombre del empleado
            const attendances = [];
            console.log('👥 Procesando', attendancesQuery.size, 'asistencias...');

            for (const doc of attendancesQuery.docs) {
                const attendanceData = doc.data();
                const employeeId = doc.ref.parent.parent.id; // Obtener el ID del empleado desde la referencia
                console.log('  - Asistencia de empleado ID:', employeeId);

                // Obtener datos completos del empleado
                const employeeDoc = await db.collection('employees').doc(employeeId).get();
                if (employeeDoc.exists) {
                    const employeeData = employeeDoc.data();
                    console.log('  ✅ Empleado encontrado:', employeeData.fullName);
                    attendances.push({
                        attendanceId: doc.id,
                        attendanceData: attendanceData,
                        employeeId: employeeId,
                        employeeData: employeeData
                    });
                } else {
                    console.warn('  ⚠️ Empleado no encontrado:', employeeId);
                }
            }

            console.log('📋 Total de empleados a mostrar:', attendances.length);

            // Ordenar por nombre
            attendances.sort((a, b) => a.employeeData.fullName.localeCompare(b.employeeData.fullName));

            // Mostrar botones
            attendances.forEach(item => {
                createEmployeeButton(item);
            });

            console.log('✅ Lista de empleados creada exitosamente');

        } catch (error) {
            console.error('❌ Error cargando asistencias:', error);
            console.error('   Tipo de error:', error.name);
            console.error('   Mensaje:', error.message);

            // Mostrar mensaje de error más específico
            emptyState.classList.remove('hidden');
            emptyState.querySelector('h3').textContent = 'Error al cargar asistencias';
            emptyState.querySelector('p').textContent = 'Error: ' + error.message + '. Revisa la consola para más detalles.';
        }
    }

    function createEmployeeButton(item) {
        const btn = document.createElement('button');
        btn.className = 'magic-btn';
        btn.innerHTML = `
            <div class="avatar-tiny">${getInitials(item.employeeData.fullName)}</div>
            <span>Soy ${item.employeeData.fullName}</span>
            <i class="fa-solid fa-chevron-right"></i>
        `;

        btn.addEventListener('click', () => selectEmployee(item));
        liveList.appendChild(btn);
    }

    function selectEmployee(item) {
        selectedEmployee = {
            id: item.employeeId,
            name: item.employeeData.fullName,
            accountNumber: item.employeeData.accountNumber
        };
        currentAttendanceId = item.attendanceId;
        currentAttendanceRef = db.collection('employees')
            .doc(item.employeeId)
            .collection('attendance')
            .doc(item.attendanceId);

        // Guardar en localStorage
        localStorage.setItem('currentEmployee', JSON.stringify(selectedEmployee));

        // Actualizar UI
        profileAvatar.textContent = getInitials(item.employeeData.fullName);
        employeeName.textContent = item.employeeData.fullName;
        employeeAccount.textContent = `#${item.employeeData.accountNumber}`;

        const formattedDate = new Date(item.attendanceData.date + 'T12:00:00').toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        attendanceDate.textContent = formattedDate;

        welcomeSection.classList.add('hidden');
        feedbackForm.classList.remove('hidden');
    }

    async function submitFeedback() {
        if (!currentRating) {
            alert('Por favor califica con estrellas ⭐');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...';

        try {
            const comment = document.getElementById('comment').value;

            // SEGURIDAD: Verificar que la asistencia sigue activa
            const attendanceDoc = await currentAttendanceRef.get();
            if (!attendanceDoc.exists || attendanceDoc.data().status !== 'active') {
                alert('⚠️ Esta sesión de asistencia ya no es válida o ha expirado.');
                resetSelection();
                return;
            }

            // SEGURIDAD: Verificar si ya dio feedback
            const existingFeedback = await db.collection('employees')
                .doc(selectedEmployee.id)
                .collection('feedback')
                .where('attendanceId', '==', currentAttendanceId)
                .get();

            if (!existingFeedback.empty) {
                alert('⚠️ Ya has enviado tu feedback para esta sesión.');
                feedbackForm.classList.add('hidden');
                successState.classList.remove('hidden');
                return;
            }

            const attendanceData = attendanceDoc.data();

            // 1. Guardar Feedback en subcollection
            await db.collection('employees')
                .doc(selectedEmployee.id)
                .collection('feedback')
                .add({
                    attendanceId: currentAttendanceId,
                    rating: currentRating,
                    reaction: currentEmoji,
                    comment: comment,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    date: attendanceData.date,
                    isLate: true // Marcar como feedback extemporáneo
                });

            // 2. Actualizar estado de asistencia a 'completed'
            await currentAttendanceRef.update({
                status: 'completed'
            });

            // 3. Calcular puntos
            let earnedPoints = 20;
            const commentLower = comment.toLowerCase();

            if (commentLower.includes('gane')) {
                earnedPoints += 10;
            }

            document.getElementById('earned-points').textContent = earnedPoints;

            // 4. Guardar puntos en el empleado
            await db.collection('employees').doc(selectedEmployee.id).update({
                points: firebase.firestore.FieldValue.increment(earnedPoints),
                lastAttendance: firebase.firestore.FieldValue.serverTimestamp()
            });

            // UI Success
            feedbackForm.classList.add('hidden');
            successState.classList.remove('hidden');

        } catch (error) {
            console.error('Error:', error);
            alert('Error al enviar. Intenta de nuevo.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '📤 Enviar Feedback';
        }
    }

    function resetSelection() {
        selectedEmployee = null;
        currentAttendanceId = null;
        currentAttendanceRef = null;
        currentRating = 0;
        currentEmoji = '';

        // Reset UI elements
        stars.forEach(s => s.classList.remove('active'));
        emojiBtns.forEach(b => b.classList.remove('selected'));
        document.getElementById('comment').value = '';
        ratingText.textContent = 'Selecciona una calificación';

        feedbackForm.classList.add('hidden');
        welcomeSection.classList.remove('hidden');

        // Recargar lista si hay fecha seleccionada
        if (selectedDate) {
            loadAttendancesForDate(selectedDate);
        }
    }

    function setupInteractionLogic() {
        stars.forEach(star => {
            star.addEventListener('click', () => {
                const rating = parseInt(star.dataset.rating);
                currentRating = rating;
                highlightStars(rating);
                const texts = ['Malo', 'Regular', 'Bueno', 'Muy Bueno', 'Excelente'];
                ratingText.textContent = texts[rating - 1];
            });
        });

        emojiBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                emojiBtns.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                currentEmoji = btn.dataset.emoji;
            });
        });
    }

    function highlightStars(rating) {
        stars.forEach(star => {
            const starRating = parseInt(star.dataset.rating);
            if (starRating <= rating) star.classList.add('active');
            else star.classList.remove('active');
        });
    }

    function getInitials(name) {
        return name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : '??';
    }
});
