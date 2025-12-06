// Lógica de Feedback Extemporáneo
// Permite a empleados dar feedback para asistencias de fechas pasadas

document.addEventListener('DOMContentLoaded', () => {
    // Estado local
    let selectedEmployee = null;
    let currentRating = 0;
    let currentEmoji = '';
    let currentAttendanceId = null;
    let currentAttendanceRef = null;

    // Elementos DOM
    const searchSection = document.getElementById('search-section');
    const datePicker = document.getElementById('date-picker');
    const accountInput = document.getElementById('account-input');
    const searchBtn = document.getElementById('search-btn');
    const searchResults = document.getElementById('search-results');
    const attendanceList = document.getElementById('attendance-list');
    const emptyState = document.getElementById('empty-state');
    const feedbackForm = document.getElementById('feedback-form');
    const successState = document.getElementById('success-state');

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
    if (searchBtn) searchBtn.addEventListener('click', searchAttendances);
    if (changeUserBtn) changeUserBtn.addEventListener('click', resetSelection);
    if (newFeedbackBtn) newFeedbackBtn.addEventListener('click', () => {
        resetSelection();
        successState.classList.add('hidden');
        searchSection.classList.remove('hidden');
    });
    if (submitBtn) submitBtn.addEventListener('click', submitFeedback);

    // Setup interaction logic (stars & emojis)
    setupInteractionLogic();

    // Permitir búsqueda con Enter
    accountInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchAttendances();
    });

    async function searchAttendances() {
        const selectedDate = datePicker.value;
        const accountNumber = accountInput.value.trim();

        // Validaciones
        if (!selectedDate) {
            alert('Por favor selecciona una fecha');
            return;
        }

        if (!accountNumber) {
            alert('Por favor ingresa tu número de cuenta');
            return;
        }

        // Mostrar loading
        searchBtn.disabled = true;
        searchBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Buscando...';
        attendanceList.innerHTML = '';
        searchResults.classList.add('hidden');
        emptyState.classList.add('hidden');

        try {
            // 1. Buscar empleado por número de cuenta
            const employeeSnapshot = await db.collection('employees')
                .where('accountNumber', '==', parseInt(accountNumber))
                .get();

            if (employeeSnapshot.empty) {
                showEmptyState('No se encontró ningún empleado con ese número de cuenta');
                return;
            }

            const employeeDoc = employeeSnapshot.docs[0];
            const employeeData = employeeDoc.data();
            const employeeId = employeeDoc.id;

            // 2. Buscar asistencias de esa fecha para ese empleado
            const attendanceSnapshot = await db.collection('employees')
                .doc(employeeId)
                .collection('attendance')
                .where('date', '==', selectedDate)
                .where('status', '==', 'active') // Solo las que NO tienen feedback
                .get();

            if (attendanceSnapshot.empty) {
                showEmptyState('No se encontraron asistencias pendientes de feedback para esta fecha');
                return;
            }

            // 3. Mostrar resultados
            searchResults.classList.remove('hidden');
            attendanceSnapshot.forEach(doc => {
                createAttendanceCard(employeeId, employeeData, doc.id, doc.data());
            });

        } catch (error) {
            console.error('Error buscando asistencias:', error);
            alert('Error al buscar. Intenta de nuevo.');
        } finally {
            searchBtn.disabled = false;
            searchBtn.innerHTML = '<i class="fa-solid fa-search"></i> Buscar mi asistencia';
        }
    }

    function showEmptyState(message) {
        emptyState.classList.remove('hidden');
        emptyState.querySelector('p').textContent = message;
    }

    function createAttendanceCard(employeeId, employeeData, attendanceId, attendanceData) {
        const card = document.createElement('button');
        card.className = 'magic-btn'; // Reutilizar estilo existente
        card.style.width = '100%';
        card.style.marginBottom = '1rem';

        const formattedDate = new Date(attendanceData.date + 'T12:00:00').toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        card.innerHTML = `
            <div class="avatar-tiny">${getInitials(employeeData.fullName)}</div>
            <div style="flex: 1; text-align: left;">
                <span style="display: block; font-weight: 600;">${employeeData.fullName}</span>
                <span style="display: block; font-size: 0.85rem; color: #666;">${formattedDate}</span>
            </div>
            <i class="fa-solid fa-chevron-right"></i>
        `;

        card.addEventListener('click', () => selectAttendance(employeeId, employeeData, attendanceId, attendanceData));
        attendanceList.appendChild(card);
    }

    function selectAttendance(employeeId, employeeData, attendanceId, attendanceData) {
        selectedEmployee = {
            id: employeeId,
            name: employeeData.fullName,
            accountNumber: employeeData.accountNumber
        };
        currentAttendanceId = attendanceId;
        currentAttendanceRef = db.collection('employees').doc(employeeId).collection('attendance').doc(attendanceId);

        // Guardar en localStorage
        localStorage.setItem('currentEmployee', JSON.stringify(selectedEmployee));

        // Actualizar UI
        profileAvatar.textContent = getInitials(employeeData.fullName);
        employeeName.textContent = employeeData.fullName;
        employeeAccount.textContent = `#${employeeData.accountNumber}`;

        const formattedDate = new Date(attendanceData.date + 'T12:00:00').toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        attendanceDate.textContent = formattedDate;

        searchSection.classList.add('hidden');
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
                    date: attendanceData.date, // Fecha de la asistencia, no la actual
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
        searchSection.classList.remove('hidden');
        searchResults.classList.add('hidden');
        emptyState.classList.add('hidden');
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
