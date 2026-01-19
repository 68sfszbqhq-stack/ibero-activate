// Lógica de Feedback "Magia en Vivo"
// Escucha cambios en tiempo real en la colección 'attendances'

document.addEventListener('DOMContentLoaded', () => {
    // Estado local
    let selectedEmployee = null;
    let currentRating = 0;
    let currentEmoji = '';
    let currentAttendanceId = null;
    const recentlyCompletedIds = new Set(); // Blacklist local para filtrar inmediatamente

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

    // Asegurar autenticación (Anónima) para cumplir reglas de Firestore "isAuth()"
    auth.onAuthStateChanged(user => {
        if (!user) {
            console.log("Autenticando anónimamente para permisos...");
            auth.signInAnonymously().catch(e => console.error("Error auth anon:", e));
        }
    });

    // Event Listeners UI
    if (changeUserBtn) changeUserBtn.addEventListener('click', resetSelection);
    if (newFeedbackBtn) newFeedbackBtn.addEventListener('click', () => {
        resetSelection();
        successState.classList.add('hidden');
        welcomeSection.classList.remove('hidden');
    });
    if (submitBtn) submitBtn.addEventListener('click', submitFeedback);

    // --- BÚSQUEDA MANUAL ---
    const manualToggle = document.getElementById('manual-login-toggle');
    const manualContainer = document.getElementById('manual-search-container');
    const manualInput = document.getElementById('manual-search-input');
    const manualBtn = document.getElementById('manual-search-btn');
    const manualResults = document.getElementById('manual-search-results');

    if (manualToggle) {
        manualToggle.addEventListener('click', () => {
            manualContainer.classList.toggle('hidden');
            if (!manualContainer.classList.contains('hidden')) {
                manualInput.focus();
            }
        });
    }

    if (manualBtn) {
        manualBtn.addEventListener('click', performManualSearch);
    }

    if (manualInput) {
        manualInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performManualSearch();
        });
    }

    async function performManualSearch() {
        const query = manualInput.value.trim().toLowerCase();
        if (query.length < 3) {
            alert('Ingresa al menos 3 letras o números');
            return;
        }

        manualResults.innerHTML = '<div style="text-align: center; padding: 1rem;"><i class="fa-solid fa-spinner fa-spin"></i> Buscando...</div>';

        try {
            // Buscar en empleados (por nombre o cuenta)
            // Firebase no tiene OR nativo simple, haremos 2 queries o buscaremos una heurística
            // Por simplicidad buscaremos coincidencia de string básica en cliente si son pocos, o 2 queries

            // Query 1: Por número de cuenta (exacto)
            const snapshotAccount = await db.collection('employees')
                .where('accountNumber', '==', query)
                .get();

            let results = [];
            snapshotAccount.forEach(doc => results.push({ id: doc.id, ...doc.data() }));

            // Si no hay resultados por cuenta, buscar por nombre (esto es caro en Firebase sin index, 
            // pero asumiremos que el usuario pone el nombre completo o usamos '>=')
            if (results.length === 0) {
                // Hack para búsqueda de prefijo
                const endQuery = query.replace(/.$/, c => String.fromCharCode(c.charCodeAt(0) + 1));
                const snapshotName = await db.collection('employees')
                    .where('name_lower', '>=', query)
                    .where('name_lower', '<', endQuery)
                    .limit(5)
                    .get();

                snapshotName.forEach(doc => results.push({ id: doc.id, ...doc.data() }));

                // Fallback: Si no tenemos name_lower, buscar por 'name' (case sensitive, user must type correctly)
                if (snapshotName.empty) {
                    // Intentar búsqueda manual por nombre exacto o scan limitado (solo en dev)
                    // Mejor: Buscar por cuenta es lo más seguro.
                }
            }

            // Si sigue vacío, buscar una asistencia de HOY (tal vez ya se creó)
            if (results.length === 0) {
                // Intentar buscar asistencias Activas con ese nombre (en caso que no esté en employees collection aun? no debería)
            }

            renderManualResults(results);

        } catch (error) {
            console.error('Error en búsqueda manual:', error);
            manualResults.innerHTML = '<p style="color: red; text-align: center;">Error al buscar</p>';
        }
    }

    function renderManualResults(results) {
        manualResults.innerHTML = '';

        if (results.length === 0) {
            manualResults.innerHTML = '<p style="text-align: center; color: #666;">No se encontraron empleados. Intenta con tu número de cuenta exacto.</p>';
            return;
        }

        results.forEach(emp => {
            const btn = document.createElement('button');
            btn.className = 'magic-btn';

            const avatar = document.createElement('div');
            avatar.className = 'avatar-tiny';
            avatar.textContent = getInitials(emp.name || 'Usuario');

            const span = document.createElement('span');
            span.textContent = emp.name;

            const icon = document.createElement('i');
            icon.className = 'fa-solid fa-chevron-right';

            btn.appendChild(avatar);
            btn.appendChild(span);
            btn.appendChild(icon);

            btn.addEventListener('click', async () => {
                // Seleccionar al empleado (Login Manual)
                const safeName = window.SecurityUtils ? window.SecurityUtils.escapeHTML(emp.name) : emp.name;

                selectedEmployee = {
                    id: emp.id,
                    name: safeName
                };

                localStorage.setItem('currentEmployee', JSON.stringify(selectedEmployee));
                profileAvatar.textContent = getInitials(safeName);
                employeeName.textContent = safeName;

                // Verificar si tiene asistencia activa HOY para vincularla
                const today = new Date().toISOString().split('T')[0];
                const activeAttendance = await db.collection('attendances')
                    .where('date', '==', today)
                    .where('employeeId', '==', emp.id)
                    .where('status', '==', 'active')
                    .limit(1)
                    .get();

                if (!activeAttendance.empty) {
                    currentAttendanceId = activeAttendance.docs[0].id;
                    welcomeSection.classList.add('hidden');
                    feedbackForm.classList.remove('hidden');
                } else {
                    // No tiene asistencia activa.
                    // Opción A: Alertar y redirigir al Dashboard (Login exitoso)
                    // Opción B: Alertar "Espera a tu instructor"

                    if (confirm(`Bienvenido ${safeName}. Has iniciado sesión.\n\nNo tienes una asistencia activa pendiente de feedback en este momento.\n\n¿Quieres ir a tu Dashboard?`)) {
                        window.location.href = 'dashboard.html';
                    } else {
                        // Quedarse aquí logueado
                        welcomeSection.classList.add('hidden');
                        feedbackForm.classList.remove('hidden');
                        document.getElementById('feedback-form').innerHTML = `
                            <div style="text-align: center; padding: 2rem;">
                                <h2>¡Hola ${safeName.split(' ')[0]}! 👋</h2>
                                <p>Has iniciado sesión correctamente.</p>
                                <p style="margin: 2rem 0; color: #666;">Cuando tu instructor pase lista, podrás dar feedback aquí.</p>
                                <button onclick="window.location.href='dashboard.html'" class="btn-primary">Ir a Mi Perfil / Dashboard</button>
                                <br><br>
                                <button onclick="location.reload()" class="btn-secondary">Volver</button>
                            </div>
                        `;
                    }
                }
            });

            manualResults.appendChild(btn);
        });
    }

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

            // Filtrar si ya se completó localmente (Blacklist)
            if (recentlyCompletedIds.has(doc.id)) {
                return;
            }

            // SEGURIDAD XSS: Crear elemento de forma segura
            const btn = document.createElement('button');
            btn.className = 'magic-btn';

            const avatar = document.createElement('div');
            avatar.className = 'avatar-tiny';
            // Sanitizar nombre antes de mostrar
            const safeName = window.SecurityUtils
                ? window.SecurityUtils.escapeHTML(data.employeeName || 'Usuario')
                : (data.employeeName || 'Usuario');
            avatar.textContent = getInitials(safeName);

            const span = document.createElement('span');
            span.textContent = `Soy ${safeName}`;

            const icon = document.createElement('i');
            icon.className = 'fa-solid fa-chevron-right';

            btn.appendChild(avatar);
            btn.appendChild(span);
            btn.appendChild(icon);

            // Al hacer clic, seleccionamos a este empleado
            btn.addEventListener('click', () => selectEmployee(doc.id, data));
            liveList.appendChild(btn);
        });
    }

    function selectEmployee(attendanceId, data) {
        // SEGURIDAD: Sanitizar datos del empleado
        const safeName = window.SecurityUtils
            ? window.SecurityUtils.escapeHTML(data.employeeName || 'Usuario')
            : (data.employeeName || 'Usuario');

        selectedEmployee = {
            id: data.employeeId,
            name: safeName
        };
        currentAttendanceId = attendanceId;

        // GUARDAR EN LOCALSTORAGE para que el dashboard sepa quién es
        localStorage.setItem('currentEmployee', JSON.stringify(selectedEmployee));

        // Actualizar UI del perfil con datos sanitizados
        profileAvatar.textContent = getInitials(safeName);
        employeeName.textContent = safeName;

        // NUEVO: Mostrar formulario unificado directamente (sin PRE-wellness)
        welcomeSection.classList.add('hidden');
        feedbackForm.classList.remove('hidden');
    }

    async function submitFeedback() {
        if (!currentRating) {
            alert('Por favor califica con estrellas ⭐');
            return;
        }

        // NUEVO: Validar que las 3 preguntas del wellness estén completas
        const wellnessComplete = window.wellnessQuestionnaire && window.wellnessQuestionnaire.isComplete();
        if (!wellnessComplete) {
            alert('⚠️ Por favor responde las 3 preguntas rápidas');
            return;
        }

        const submitBtn = document.getElementById('submit-feedback');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...';

        try {
            const commentRaw = document.getElementById('comment').value;

            // SEGURIDAD XSS: Validar y sanitizar comentario
            const comment = window.SecurityUtils
                ? window.SecurityUtils.validateComment(commentRaw, 500)
                : commentRaw.substring(0, 500);

            // SEGURIDAD: Validar rating
            const validRating = window.SecurityUtils
                ? window.SecurityUtils.validateRating(currentRating, 1, 5)
                : currentRating;

            if (!validRating) {
                alert('⚠️ Calificación inválida');
                return;
            }

            // Obtener datos del wellness questionnaire
            const wellnessData = window.wellnessQuestionnaire ? window.wellnessQuestionnaire.getData() : {};

            // 0.1 SEGURIDAD: Verificar que la asistencia sigue activa (en subcollection)
            const attendanceDoc = await db.collection('employees')
                .doc(selectedEmployee.id)
                .collection('attendance')
                .doc(currentAttendanceId)
                .get();
            if (!attendanceDoc.exists || attendanceDoc.data().status !== 'active') {
                alert('⚠️ Esta sesión de asistencia ya no es válida o ha expirado.');
                resetSelection();
                return;
            }

            // 0.2 SEGURIDAD: Verificar si ya dio feedback para esta asistencia
            const existingFeedback = await db.collection('employees')
                .doc(selectedEmployee.id)
                .collection('feedback')
                .where('attendanceId', '==', currentAttendanceId)
                .get();

            if (!existingFeedback.empty) {
                alert('⚠️ Ya has enviado tu feedback para esta sesión.');

                // TRACK LOCAL COMPLETED (to hide from list)
                recentlyCompletedIds.add(currentAttendanceId);

                // Opcional: Mostrar estado de éxito directamente si ya lo hizo
                feedbackForm.classList.add('hidden');
                successState.classList.remove('hidden');
                return;
            }

            // 1. Guardar Feedback en subcollection (con datos sanitizados + wellness data)
            await db.collection('employees')
                .doc(selectedEmployee.id)
                .collection('feedback')
                .add({
                    attendanceId: currentAttendanceId,
                    rating: validRating,
                    reaction: currentEmoji,
                    comment: comment, // Ya sanitizado

                    // NUEVO: Wellness data integrado
                    perceivedBenefit: wellnessData.perceivedBenefit || null,
                    postFeeling: wellnessData.postFeeling || null,
                    wouldReturn: wellnessData.wouldReturn || null,

                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    date: new Date().toISOString().split('T')[0],
                    questionnaireVersion: 'unified-option-b'
                });


            // 2. Actualizar estado de asistencia a 'completed' en AMBAS ubicaciones
            // (subcollection Y top-level para que el listener lo filtre correctamente)
            console.log('Updating attendance status to completed for:', currentAttendanceId);

            await db.collection('employees')
                .doc(selectedEmployee.id)
                .collection('attendance')
                .doc(currentAttendanceId)
                .update({
                    status: 'completed'
                });

            console.log('Updated subcollection attendance status');

            // También actualizar en top-level attendances (para el listener de feedback en vivo)
            await db.collection('attendances')
                .doc(currentAttendanceId)
                .update({
                    status: 'completed'
                });

            console.log('Updated top-level attendance status');

            // 3. Guardar wellness data también en colección separada para análisis
            await db.collection('wellness_data').add({
                employeeId: selectedEmployee.id,
                employeeName: selectedEmployee.name,
                attendanceId: currentAttendanceId,
                activityDate: new Date().toISOString().split('T')[0],
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),

                // Wellness data
                perceivedBenefit: wellnessData.perceivedBenefit,
                postFeeling: wellnessData.postFeeling,
                wouldReturn: wellnessData.wouldReturn,

                // Metadata
                deviceType: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
                questionnaireVersion: 'unified-option-b'
            });

            console.log('✅ Wellness data saved to analytics collection');

            // 4. Calcular puntos (Gamificación: 20 fijos + 10 si ganó)
            let earnedPoints = 20;
            const commentLower = comment.toLowerCase();

            // Si el comentario incluye la palabra "gane", dar bono
            if (commentLower.includes('gane')) {
                earnedPoints += 10;
            }

            document.getElementById('earned-points').textContent = earnedPoints;

            // TRACK LOCAL COMPLETED
            recentlyCompletedIds.add(currentAttendanceId);

            // 5. GUARDAR PUNTOS EN EL EMPLEADO
            await db.collection('employees').doc(selectedEmployee.id).update({
                points: firebase.firestore.FieldValue.increment(earnedPoints),
                lastAttendance: firebase.firestore.FieldValue.serverTimestamp()
            });

            // NUEVO: Ir directo al estado de éxito (sin POST-wellness separado)
            feedbackForm.classList.add('hidden');
            successState.classList.remove('hidden');

            // Reset wellness data
            if (window.wellnessQuestionnaire) {
                window.wellnessQuestionnaire.reset();
            }

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
        currentRating = 0;
        currentEmoji = '';

        // Reset UI elements
        stars.forEach(s => s.classList.remove('active'));
        emojiBtns.forEach(b => b.classList.remove('selected'));
        document.getElementById('comment').value = '';
        ratingText.textContent = 'Selecciona una calificación';

        // Reset wellness questionnaire (unified)
        if (window.wellnessQuestionnaire) {
            window.wellnessQuestionnaire.reset();
        }

        // Hide all sections, show welcome
        feedbackForm.classList.add('hidden');
        successState.classList.add('hidden');
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
