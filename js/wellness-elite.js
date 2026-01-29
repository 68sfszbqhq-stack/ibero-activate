/**
 * WELLNESS ELITE - LOGIC
 * Maneja la navegación SPA, la carga de datos y las interacciones
 */

// === STATE MANAGEMENT ===
const AppState = {
    currentView: 'home',
    metrics: {
        steps: 0,
        strain: 0,
        recovery: 0,
        sleep: 0,
        hrv: 0,
        rhr: 0
    }
};

// === NAVIGATION ===
function switchView(viewId) {
    // 1. Update Buttons
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    // Find button that calls this view (approximation)
    const btn = document.querySelector(`button[onclick="switchView('${viewId}')"]`);
    if (btn) btn.classList.add('active');

    // 2. Hide all sections
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));

    // 3. Show target section
    const target = document.getElementById(`view-${viewId}`);
    if (target) target.classList.add('active');

    AppState.currentView = viewId;
    window.scrollTo(0, 0);
}

function toggleActionSheet() {
    const overlay = document.getElementById('action-overlay');
    overlay.classList.toggle('active');
}

// === DATA MOCKUP (Init) ===
// En una fase posterior esto vendrá de Firestore/NativeIntegration
function initDashboard() {
    // Fecha
    const now = new Date();
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    document.getElementById('date-display').textContent = now.toLocaleDateString('es-ES', options).toLocaleUpperCase();

    // Saludo según hora
    const hour = now.getHours();
    let greeting = 'Hola';
    if (hour < 12) greeting = 'Buenos Días';
    else if (hour < 20) greeting = 'Buenas Tardes';
    else greeting = 'Buenas Noches';

    document.getElementById('greeting-text').innerHTML = `${greeting}, <span style="color:white">Atleta</span>`;

    // Cargar datos reales
    loadMetrics();
}

// === METRIC LOGIC ===

async function loadMetrics() {
    let steps = 0;

    // 1. Obtener Pasos (Nativo o Simulado)
    if (window.NativeHealth && window.NativeHealth.isNative()) {
        try {
            const nativeSteps = await window.NativeHealth.getTodaySteps();
            if (nativeSteps) steps = nativeSteps;
        } catch (e) { console.error("Error nativo", e); }
    } else {
        // Mock si no es nativo (para web testing)
        // steps = 2500; 
        console.log("Web Environment: Using 0 steps default or mock");
    }

    // 2. Calcular Strain basado en Pasos
    // Fórmula simple: 0-21. Max strain (21) = 20,000 pasos (aprox atleta elite)
    // 10,000 pasos = ~10.5 strain
    const strain = Math.min((steps / 1000) * 1.5, 21).toFixed(1);

    // 3. Recuperar Energía (Recovery) REAL de Firebase
    const today = new Date().toISOString().split('T')[0];
    let recovery = 50; // default neutro

    // Integramos DB Real
    // Nota: Esto es asíncrono, para actualizar la UI rápido usamos valores por defecto
    // y luego repintamos cuando llegue la data.
    getDailyMetric(today).then(journal => {
        if (journal) {
            // Algoritmo "Bio-Friendly"
            // Base: 50
            // Sueño: +0 a +50 (según calidad 0-100)
            // Estrés: -0 a -20 (según nivel 1-10)
            // Hábitos: -15 (si hubo alcohol o mala comida)

            const sleepScore = (journal.sleep_quality / 100) * 50;
            const stressPenalty = (journal.stress || 5) * 2;
            const habitPenalty = (journal.tags?.includes('alcohol') || journal.tags?.includes('late_meal')) ? 10 : 0;

            let calculatedRecovery = 50 + sleepScore - stressPenalty - habitPenalty;
            calculatedRecovery = Math.max(10, Math.min(100, calculatedRecovery)); // Nunca menos de 10 ni más de 100

            // Actualizar UI con dato real
            updateDashboardUI(steps, strain, Math.round(calculatedRecovery));

            // Actualizar Coach
            initCoach(strain, Math.round(calculatedRecovery));
        }
    });

    // Render inicial (con default o cache)
    updateDashboardUI(steps, strain, Math.round(recovery));
}

function updateDashboardUI(steps, strain, recovery) {
    // DOM Updates
    document.getElementById('steps-display').textContent = steps.toLocaleString();
    document.getElementById('score-strain').textContent = strain;
    document.getElementById('score-recovery').textContent = recovery + '%';
    document.getElementById('body-battery').innerHTML = `<i class="fa-solid fa-bolt"></i> ${recovery}%`;

    // Strain Bar
    const strainPercent = (strain / 21) * 100;
    document.getElementById('strain-bar').style.width = `${strainPercent}%`;

    // Colores dinámicos
    const recoveryEl = document.getElementById('score-recovery');
    if (recovery >= 66) recoveryEl.style.color = 'var(--color-recovery)'; // Verde
    else if (recovery >= 33) recoveryEl.style.color = '#facc15'; // Amarillo
    else recoveryEl.style.color = '#ef4444'; // Rojo
}

// === INTERACTION LOGIC ===

function toggleModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.toggle('active');
    }
}

function selectOption(btn, inputId, value) {
    // UI Feedback
    const parent = btn.parentElement;
    parent.querySelectorAll('.action-btn').forEach(b => b.style.borderColor = 'rgba(255,255,255,0.1)');
    btn.style.borderColor = 'var(--color-recovery)';

    // Set Value
    document.getElementById('input_' + inputId).value = value;
}

function toggleTag(btn, tag) {
    btn.classList.toggle('active');
    if (btn.classList.contains('active')) {
        btn.style.background = 'var(--color-strain)';
        btn.dataset.selected = "true";
    } else {
        btn.style.background = 'rgba(255,255,255,0.05)';
        btn.dataset.selected = "false";
    }
}

function handleJournalSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);

    // Collect tags manually
    const tags = [];
    document.querySelectorAll('#journal-form button[data-selected="true"]').forEach(btn => {
        // Extract tag from onclick logic or button text (simplification)
        // Here we rely on the specific buttons we made
        if (btn.innerText.includes('Alcohol')) tags.push('alcohol');
        if (btn.innerText.includes('Cena')) tags.push('late_meal');
        if (btn.innerText.includes('Dolor')) tags.push('soreness');
    });

    const journalData = {
        date: new Date().toISOString().split('T')[0],
        sleep_quality: parseInt(document.getElementById('input_sleep_quality').value || 50),
        stress: parseInt(formData.get('stress')),
        tags: tags
    };

    // Save to Firestore
    saveDailyMetric(journalData);

    // UI Feedback
    toggleModal('journal-modal');
    showToast('¡Diario guardado! Recalculando energía...', 'success');

    // Update local state immediately for responsiveness
    setTimeout(() => loadMetrics(), 1000);
}

// === FIREBASE INTEGRATION ===

async function saveDailyMetric(data) {
    const user = auth.currentUser;
    if (!user) return;

    const date = new Date().toISOString().split('T')[0];
    const userEmail = user.email; // Auth is truth

    try {
        console.log("Intentando guardar en:", `wellness_records/${userEmail}/daily_logs/${date}`);
        console.log("Datos:", data);

        await db.collection('wellness_records').doc(userEmail).collection('daily_logs').doc(date).set({
            ...data,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log("✅ Métricas guardadas exitosamente en Firebase");
    } catch (e) {
        console.error("❌ Error guardando métricas:", e);
        console.error("Código de error:", e.code);
        console.error("Mensaje:", e.message);

        if (e.code === 'permission-denied') {
            showToast("Error de permisos. Contacta al admin.", "error");
        } else {
            showToast(`Error al guardar: ${e.message}`, "error");
        }
    }
}

async function getDailyMetric(date) {
    const user = auth.currentUser;
    if (!user) return null;

    try {
        const doc = await db.collection('wellness_records').doc(user.email).collection('daily_logs').doc(date).get();
        if (doc.exists) return doc.data();
        return null;
    } catch (e) {
        console.error("Error leyendo métricas:", e);
        return null;
    }
}

async function saveWorkoutSession(durationStr) {
    const user = auth.currentUser;
    if (!user) return;

    // Parse duration "MM:SS" to minutes
    const [mins, secs] = durationStr.split(':').map(Number);
    const totalMins = mins + (secs / 60);

    if (totalMins < 1) return; // Ignore micro workouts

    try {
        await db.collection('walking_stats').add({
            collaboratorEmail: user.email,
            date: new Date().toISOString().split('T')[0],
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            metrics: {
                steps: 0, // GPS/Pedometer tracking would go here
                duration_mins: Math.round(totalMins),
                calories: Math.round(totalMins * 5), // Est. 5 cal/min
                distance_km: (totalMins * 0.08).toFixed(2) // Est. walking speed
            },
            source: 'Elite_Workout_Timer',
            type: 'workout'
        });
        showToast("Entrenamiento registrado en tu historial", "success");
    } catch (e) {
        console.error("Error guardando workout:", e);
    }
}

function showDetail(metricType) {
    const modal = document.getElementById('detail-modal');
    const title = document.getElementById('detail-title');
    const content = document.getElementById('detail-content');

    title.textContent = metricType.charAt(0).toUpperCase() + metricType.slice(1);

    if (metricType === 'strain') {
        content.innerHTML = `
            <div style="text-align:center; padding: 20px;">
                <h2 style="font-size: 4rem; color: var(--color-strain); margin: 0;">${document.getElementById('score-strain').textContent}</h2>
                <p>Nivel de Esfuerzo Diario</p>
                <hr style="border-color: rgba(255,255,255,0.1); margin: 20px 0;">
                <p>Tu esfuerzo se calcula en base a tus pasos y actividad cardíaca. Un esfuerzo de 21 representa un día de maratón.</p>
            </div>
        `;
    } else if (metricType === 'recovery') {
        content.innerHTML = `
            <div style="text-align:center; padding: 20px;">
                <h2 style="font-size: 4rem; color: var(--color-recovery); margin: 0;">${document.getElementById('score-recovery').textContent}</h2>
                <p>Capacidad de Rendimiento</p>
                <hr style="border-color: rgba(255,255,255,0.1); margin: 20px 0;">
                <div style="text-align: left;">
                    <p><strong>Factores que afectaron hoy:</strong></p>
                    <ul style="color: var(--text-secondary);">
                        <li>Calidad de Sueño</li>
                        <li>Niveles de Estrés reportados</li>
                        <li>Hábitos (Alcohol/Nutrición)</li>
                    </ul>
                </div>
            </div>
        `;
    }

    toggleModal('detail-modal');
}

// === WORKOUT LOGIC ===

let workoutTimer = null;
let workoutStartTime = null;
let isWorkoutRunning = false;

function startWorkout() {
    const btn = document.querySelector('#workout-controls button');

    if (isWorkoutRunning) {
        // If workout is running, stop it
        stopWorkoutAndSave();
    } else {
        // INICIAR
        workoutStartTime = Date.now();
        isWorkoutRunning = true;
        btn.innerHTML = '<i class="fa-solid fa-stop"></i>';
        btn.style.background = '#ef4444';

        workoutTimer = setInterval(updateTimer, 1000);
    }
}

function stopWorkoutAndSave() {
    // DETENER
    clearInterval(workoutTimer);
    isWorkoutRunning = false; // Ensure this is set to false to prevent infinite recursion if called again

    const btn = document.querySelector('#workout-controls button');
    if (btn) {
        btn.innerHTML = '<i class="fa-solid fa-play"></i>';
        btn.style.background = 'var(--color-recovery)';
    }

    // Guardar sesión REAL
    const duration = document.getElementById('timer-display').textContent;
    saveWorkoutSession(duration); // Llama a Firebase

    toggleModal('workout-modal');
}

function updateTimer() {
    const now = Date.now();
    const diff = now - workoutStartTime;

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    document.getElementById('timer-display').textContent =
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// === UTILS ===
function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fa-solid fa-${type === 'success' ? 'check-circle' : 'circle-exclamation'}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// === COACH LOGIC ===
function initCoach(strain, recovery) {
    const container = document.querySelector('.chat-container');
    if (!container) return;

    let advice = "";

    if (recovery > 66) {
        if (strain < 10) advice = "Tu recuperación es excelente y tu carga es baja. ¡Es el momento perfecto para un entrenamiento intenso! Considera intervalos de alta intensidad o una carrera larga.";
        else advice = "Estás trabajando duro y tu cuerpo aguanta bien. Mantén la hidratación y considera una sesión de estiramientos antes de dormir.";
    } else if (recovery > 33) {
        advice = "Tu cuerpo está en un estado de mantenimiento. Un entrenamiento moderado sería ideal hoy. No te excedas para no comprometer tu energía mañana.";
    } else {
        advice = "Prioridad: Descanso activo. Tu recuperación está baja. Concéntrate en dormir temprano (antes de las 10pm) y limita el estrés. Una caminata ligera de 20 min es suficiente por hoy.";
    }

    container.innerHTML = `
        <div class="ai-message">
            <strong><i class="fa-solid fa-robot"></i> Coach Elite</strong><br>
            ${advice}
        </div>
        
        <div style="margin-top: auto;">
             <div class="action-btn" onclick="alert('Coach IA conectará con Gemini en la próxima versión')" style="margin-top: 10px; font-size: 0.9rem;">
                <i class="fa-regular fa-comment-dots" style="font-size: 1.2rem; margin-bottom: 5px;"></i>
                Hacer pregunta específica...
            </div>
        </div>
    `;
}

// === INIT ===
document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
});
