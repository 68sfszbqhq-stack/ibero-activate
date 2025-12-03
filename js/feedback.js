// Lógica de Feedback "Magia en Vivo"
// Escucha cambios en tiempo real en la colección 'attendances'

document.addEventListener('DOMContentLoaded', () => {
    // Estado local
    let selectedEmployee = null;
    let currentRating = 0;
    let currentEmoji = '';
    let currentAttendanceId = null;

    // Elementos DOM
    const liveList = document.getElementById('live-list'); // Contenedor para botones mágicos
    const waitingMessage = document.getElementById('waiting-message');
    const feedbackForm = document.getElementById('feedback-form');
    const successState = document.getElementById('success-state');
    const welcomeSection = document.getElementById('welcome-section'); // Sección de bienvenida/búsqueda (ahora lista)

    // Elementos del perfil seleccionado
    const profileAvatar = document.getElementById('profile-avatar');
    const employeeName = document.getElementById('employee-name');
    const changeUserBtn = document.getElementById('change-user-btn');

    // Elementos de interacción
    const stars = document.querySelectorAll('.star');
    const ratingText = document.getElementById('rating-text');
    const emojiBtns = document.querySelectorAll('.emoji-btn');
    const submitBtn = document.getElementById('submit-feedback');
    const newFeedbackBtn = document.getElementById('new-feedback-btn');

    // Inicializar Listener en Tiempo Real
    initRealTimeListener();

    // Event Listeners UI
    if (changeUserBtn) changeUserBtn.addEventListener('click', resetSelection);
    if (newFeedbackBtn) newFeedbackBtn.addEventListener('click', () => {
        resetSelection();
        successState.classList.add('hidden');
        welcomeSection.classList.remove('hidden');
    });
    if (submitBtn) submitBtn.addEventListener('click', submitFeedback);

    // Rating & Emoji Logic (Igual que antes)
    // Rating & Emoji Logic (Igual que antes)
    setupInteractionLogic();

    // --- LOGICA DE ESTADÍSTICAS ---
    const statsModal = document.getElementById('stats-modal');
    const showStatsBtn = document.getElementById('show-stats-btn');
    const closeStatsBtn = document.getElementById('close-stats-btn');

    if (showStatsBtn) {
        showStatsBtn.addEventListener('click', () => {
            statsModal.classList.remove('hidden');
            statsModal.style.display = 'flex'; // Ensure flex for centering
            loadGlobalStats();
        });
    }

    if (closeStatsBtn) {
        closeStatsBtn.addEventListener('click', () => {
            statsModal.classList.add('hidden');
            statsModal.style.display = 'none';
        });
    }

    async function loadGlobalStats() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const currentYear = new Date().getFullYear();
            const currentMonth = new Date().getMonth(); // 0-11

            // Helper para semana
            const getWeekNumber = (d) => {
                d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
                d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
                var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
                return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
            };
            const currentWeek = getWeekNumber(new Date());

            // 1. Hoy
            const todaySnapshot = await db.collection('attendances').where('date', '==', today).get();
            document.getElementById('stats-today').textContent = todaySnapshot.size;

            // 2. Semana (Requiere index o filtro cliente si es poco data. Usaremos filtro cliente por seguridad de indices)
            // Para optimizar, pedimos solo las de este año y filtramos en memoria (si no son miles)
            // O mejor, usamos where weekNumber si lo guardamos (sí lo guardamos en attendance.js)
            const weekSnapshot = await db.collection('attendances')
                .where('year', '==', currentYear)
                .where('weekNumber', '==', currentWeek)
                .get();
            document.getElementById('stats-week').textContent = weekSnapshot.size;

            // 3. Mes (Filtro cliente simple sobre una query de rango de fechas del mes)
            const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
            const endOfMonth = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];

            const monthSnapshot = await db.collection('attendances')
                .where('date', '>=', startOfMonth)
                .where('date', '<=', endOfMonth)
                .get();
            document.getElementById('stats-month').textContent = monthSnapshot.size;

        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    // --- FUNCIONES CORE ---

    function initRealTimeListener() {
        const today = new Date().toISOString().split('T')[0];

        // Escuchar asistencias de HOY que estén 'active' (sin feedback aún)
        // Ordenamos por timestamp desc para que los últimos aparezcan arriba
        db.collection('attendances')
            .where('date', '==', today)
            .where('status', '==', 'active') // Solo los que el admin acaba de marcar
            .orderBy('timestamp', 'desc')
            .limit(20)
            .onSnapshot((snapshot) => {
                updateLiveList(snapshot);
            }, (error) => {
                console.error("Error escuchando cambios:", error);
            });
    }

    function updateLiveList(snapshot) {
        liveList.innerHTML = '';

        if (snapshot.empty) {
            waitingMessage.classList.remove('hidden');
            return;
        }

        waitingMessage.classList.add('hidden');

        snapshot.forEach(doc => {
            const data = doc.data();
            const btn = document.createElement('button');
            btn.className = 'magic-btn'; // Clase CSS nueva para animación
            btn.innerHTML = `
                <div class="avatar-tiny">${getInitials(data.employeeName)}</div>
                <span>Soy ${data.employeeName}</span>
                <i class="fa-solid fa-chevron-right"></i>
            `;

            // Al hacer clic, seleccionamos a este empleado
            btn.addEventListener('click', () => selectEmployee(doc.id, data));
            liveList.appendChild(btn);
        });
    }

    function selectEmployee(attendanceId, data) {
        selectedEmployee = {
            id: data.employeeId,
            name: data.employeeName
        };
        currentAttendanceId = attendanceId;

        // GUARDAR EN LOCALSTORAGE para que el dashboard sepa quién es
        localStorage.setItem('currentEmployee', JSON.stringify(selectedEmployee));

        // Actualizar UI
        profileAvatar.textContent = getInitials(data.employeeName);
        employeeName.textContent = data.employeeName;

        welcomeSection.classList.add('hidden');
        feedbackForm.classList.remove('hidden');
    }

    async function submitFeedback() {
        if (!currentRating) {
            alert('Por favor califica con estrellas ⭐');
            return;
        }

        const submitBtn = document.getElementById('submit-feedback');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...';

        try {
            const comment = document.getElementById('comment').value;

            // 1. Guardar Feedback
            await db.collection('feedbacks').add({
                employeeId: selectedEmployee.id,
                attendanceId: currentAttendanceId,
                rating: currentRating,
                reaction: currentEmoji,
                comment: comment,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                date: new Date().toISOString().split('T')[0]
            });

            // 2. Actualizar estado de asistencia a 'completed' para que desaparezca de la lista
            await db.collection('attendances').doc(currentAttendanceId).update({
                status: 'completed'
            });

            // 3. Calcular puntos (Gamificación simple)
            const earnedPoints = 10 + (currentRating * 2);
            document.getElementById('earned-points').textContent = earnedPoints;

            // 4. GUARDAR PUNTOS EN EL EMPLEADO
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
            submitBtn.innerHTML = 'Enviar Calificación';
        }
    }

    function resetSelection() {
        selectedEmployee = null;
        currentAttendanceId = null;
        currentRating = 0;
        currentEmoji = '';

        // Reset UI elements
        stars.forEach(s => s.classList.remove('active'));
        emojiBtns.forEach(b => b.classList.remove('selected'));
        document.getElementById('comment').value = '';
        ratingText.textContent = 'Selecciona una calificación';

        feedbackForm.classList.add('hidden');
        welcomeSection.classList.remove('hidden');
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
