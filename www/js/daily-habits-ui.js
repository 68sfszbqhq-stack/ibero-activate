// ========================================
// DAILY HABITS UI - FASE 2.3
// ========================================
// Maneja la interfaz del dashboard de hábitos diarios
// Incluye hidrómetro, nutrición, actividad y wellness score

let currentHabits = {
    hydration: { glasses_count: 0, goal_met: false },
    nutrition: { quality: '', emoji: '', notes: '' },
    physical_activity: {
        steps_count: 0,
        continuous_walk_15min: false,
        duration_mins: 0,
        source: 'Manual'
    },
    wellness_score: 0,
    phase_compliance: false
};

let stepGoal = 7000;
let autoSaveTimeout = null;

// ========================================
// INICIALIZACIÓN
// ========================================
document.addEventListener('DOMContentLoaded', async function () {
    await initializePage();
    setupEventListeners();
    await loadTodayHabits();
    await syncWithWalkingTracker();
    await loadHealthInsights();
});

async function initializePage() {
    // Mostrar fecha actual
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent =
        today.toLocaleDateString('es-MX', options);

    // Generar vasos de agua
    generateWaterGlasses();

    // Obtener meta de pasos del perfil
    try {
        const profileResult = await window.healthProfile.getHealthProfile();
        if (profileResult.exists && profileResult.profile.macrocycle) {
            stepGoal = profileResult.profile.macrocycle.daily_step_goal || 7000;
            document.getElementById('step-goal').textContent = stepGoal.toLocaleString();
        }
    } catch (error) {
        console.error('Error al obtener perfil:', error);
    }
}

// ========================================
// EVENT LISTENERS
// ========================================
function setupEventListeners() {
    // Botón de sincronización
    document.getElementById('sync-walking-btn').addEventListener('click', syncWithWalkingTracker);

    // Botón de guardar
    document.getElementById('save-habits-btn').addEventListener('click', saveHabits);

    // Opciones de nutrición
    document.querySelectorAll('.nutrition-option').forEach(btn => {
        btn.addEventListener('click', selectNutrition);
    });

    // Checkbox de caminata continua
    document.getElementById('continuous-walk-checkbox').addEventListener('change', updateContinuousWalk);

    // Notas de nutrición
    document.getElementById('nutrition-notes').addEventListener('input', () => {
        currentHabits.nutrition.notes = document.getElementById('nutrition-notes').value;
        scheduleAutoSave();
    });
}

// ========================================
// HIDRÓMETRO DE AGUA
// ========================================
function generateWaterGlasses() {
    const container = document.getElementById('glasses-container');
    container.innerHTML = '';

    for (let i = 1; i <= 10; i++) {
        const glass = document.createElement('div');
        glass.className = 'water-glass';
        glass.dataset.glass = i;
        glass.innerHTML = `
            <div class="glass-fill"></div>
            <div class="glass-number">${i}</div>
        `;
        glass.addEventListener('click', toggleGlass);
        container.appendChild(glass);
    }
}

function toggleGlass(event) {
    const glass = event.currentTarget;
    const glassNumber = parseInt(glass.dataset.glass);

    // Determinar si estamos llenando o vaciando
    const isFilled = glass.classList.contains('filled');

    if (isFilled) {
        // Vaciar este vaso y todos los siguientes
        for (let i = glassNumber; i <= 10; i++) {
            const g = document.querySelector(`.water-glass[data-glass="${i}"]`);
            g.classList.remove('filled');
        }
        currentHabits.hydration.glasses_count = glassNumber - 1;
    } else {
        // Llenar este vaso y todos los anteriores
        for (let i = 1; i <= glassNumber; i++) {
            const g = document.querySelector(`.water-glass[data-glass="${i}"]`);
            g.classList.add('filled');
        }
        currentHabits.hydration.glasses_count = glassNumber;
    }

    // Actualizar estadísticas
    updateHydrationStats();
    updateWellnessScore();
    scheduleAutoSave();
}

function updateHydrationStats() {
    const count = currentHabits.hydration.glasses_count;
    const ml = count * 250; // 250ml por vaso
    const percent = Math.min((count / 8) * 100, 100);

    document.getElementById('glasses-count').textContent = count;
    document.getElementById('water-ml').textContent = ml.toLocaleString();
    document.getElementById('hydration-percent').textContent = `${Math.round(percent)}%`;

    // Actualizar mensaje
    const messageEl = document.getElementById('hydration-message');
    if (count >= 8) {
        messageEl.innerHTML = '<i class="fas fa-check-circle"></i><span>¡Excelente! Meta de hidratación alcanzada</span>';
        messageEl.classList.add('success');
        currentHabits.hydration.goal_met = true;
    } else if (count >= 5) {
        messageEl.innerHTML = `<i class="fas fa-droplet"></i><span>Buen progreso. Te faltan ${8 - count} vasos</span>`;
        messageEl.classList.remove('success');
        currentHabits.hydration.goal_met = false;
    } else if (count > 0) {
        messageEl.innerHTML = `<i class="fas fa-exclamation-triangle"></i><span>Necesitas más agua. Te faltan ${8 - count} vasos</span>`;
        messageEl.classList.remove('success');
        currentHabits.hydration.goal_met = false;
    } else {
        messageEl.innerHTML = '<i class="fas fa-info-circle"></i><span>Haz clic en los vasos para registrar tu consumo</span>';
        messageEl.classList.remove('success');
        currentHabits.hydration.goal_met = false;
    }
}

// ========================================
// SELECTOR DE NUTRICIÓN
// ========================================
function selectNutrition(event) {
    const btn = event.currentTarget;
    const quality = btn.dataset.quality;

    // Remover selección anterior
    document.querySelectorAll('.nutrition-option').forEach(b => {
        b.classList.remove('selected');
    });

    // Seleccionar nuevo
    btn.classList.add('selected');

    // Actualizar datos
    const nutritionTypes = window.dailyHabits.HABITS_CONSTANTS.NUTRITION_TYPES;
    currentHabits.nutrition.quality = quality;
    currentHabits.nutrition.emoji = nutritionTypes[quality].emoji;

    // Mostrar campo de notas
    document.getElementById('nutrition-notes-container').style.display = 'block';

    // Actualizar wellness score
    updateWellnessScore();
    scheduleAutoSave();
}

// ========================================
// ACTIVIDAD FÍSICA
// ========================================
function updateContinuousWalk() {
    const isChecked = document.getElementById('continuous-walk-checkbox').checked;
    currentHabits.physical_activity.continuous_walk_15min = isChecked;

    updateWellnessScore();
    scheduleAutoSave();
}

async function syncWithWalkingTracker() {
    const btn = document.getElementById('sync-walking-btn');
    btn.classList.add('spinning');

    try {
        const result = await window.dailyHabits.syncWithWalkingTracker();

        if (result.success) {
            await loadTodayHabits();
            showToast('Sincronizado con Walking Tracker', 'success');
        } else {
            showToast('No hay datos de caminata para hoy', 'info');
        }
    } catch (error) {
        console.error('Error al sincronizar:', error);
        showToast('Error al sincronizar', 'error');
    } finally {
        btn.classList.remove('spinning');
    }
}

// ========================================
// WELLNESS SCORE
// ========================================
function updateWellnessScore() {
    const score = window.dailyHabits.calculateWellnessScore(currentHabits, stepGoal);
    currentHabits.wellness_score = score;

    // Actualizar círculo de progreso
    const circle = document.getElementById('score-progress');
    const circumference = 339.292;
    const offset = circumference - (score / 100) * circumference;
    circle.style.strokeDashoffset = offset;

    // Animar número
    animateNumber('score-number', score);

    // Actualizar color según puntuación
    if (score >= 80) {
        circle.style.stroke = '#10b981'; // Verde
    } else if (score >= 60) {
        circle.style.stroke = '#3b82f6'; // Azul
    } else if (score >= 40) {
        circle.style.stroke = '#f59e0b'; // Naranja
    } else {
        circle.style.stroke = '#ef4444'; // Rojo
    }

    // Actualizar desglose
    updateScoreBreakdown();
}

function updateScoreBreakdown() {
    // Hidratación (0-30)
    const hydrationScore = Math.min((currentHabits.hydration.glasses_count / 8) * 30, 30);
    document.getElementById('hydration-score').textContent = `${Math.round(hydrationScore)}/30`;

    // Nutrición (0-30)
    let nutritionScore = 0;
    if (currentHabits.nutrition.quality) {
        const nutritionTypes = window.dailyHabits.HABITS_CONSTANTS.NUTRITION_TYPES;
        nutritionScore = nutritionTypes[currentHabits.nutrition.quality].score;
    }
    document.getElementById('nutrition-score').textContent = `${nutritionScore}/30`;

    // Actividad (0-30)
    const activityScore = Math.min((currentHabits.physical_activity.steps_count / stepGoal) * 30, 30);
    document.getElementById('activity-score').textContent = `${Math.round(activityScore)}/30`;

    // Continuo (0-10)
    const continuousScore = currentHabits.physical_activity.continuous_walk_15min ? 10 : 0;
    document.getElementById('continuous-score').textContent = `${continuousScore}/10`;
}

// ========================================
// CARGAR HÁBITOS DEL DÍA
// ========================================
async function loadTodayHabits() {
    try {
        const result = await window.dailyHabits.getTodayHabits();

        if (result.exists) {
            currentHabits = result.habits;

            // Actualizar UI
            updateHydrationUI();
            updateNutritionUI();
            updateActivityUI();
            updateWellnessScore();
        }
    } catch (error) {
        console.error('Error al cargar hábitos:', error);
    }
}

function updateHydrationUI() {
    const count = currentHabits.hydration.glasses_count || 0;

    // Llenar vasos
    for (let i = 1; i <= count; i++) {
        const glass = document.querySelector(`.water-glass[data-glass="${i}"]`);
        if (glass) glass.classList.add('filled');
    }

    updateHydrationStats();
}

function updateNutritionUI() {
    if (currentHabits.nutrition.quality) {
        const btn = document.querySelector(`.nutrition-option[data-quality="${currentHabits.nutrition.quality}"]`);
        if (btn) btn.classList.add('selected');

        document.getElementById('nutrition-notes-container').style.display = 'block';
        document.getElementById('nutrition-notes').value = currentHabits.nutrition.notes || '';
    }
}

function updateActivityUI() {
    const activity = currentHabits.physical_activity;

    document.getElementById('steps-count').textContent = (activity.steps_count || 0).toLocaleString();
    document.getElementById('duration-mins').textContent = activity.duration_mins || 0;
    document.getElementById('continuous-walk-checkbox').checked = activity.continuous_walk_15min || false;
}

// ========================================
// HEALTH INSIGHTS
// ========================================
async function loadHealthInsights() {
    try {
        const insights = await window.healthInsights.generateHealthInsights();
        const container = document.getElementById('insights-container');
        container.innerHTML = '';

        // Mostrar máximo 3 insights
        insights.slice(0, 3).forEach(insight => {
            const insightEl = document.createElement('div');
            insightEl.className = `insight-item insight-${insight.type.toLowerCase()}`;
            insightEl.innerHTML = `
                <div class="insight-icon" style="color: ${insight.color}">
                    ${insight.icon}
                </div>
                <div class="insight-content">
                    <strong>${insight.title}</strong>
                    <p>${insight.message}</p>
                </div>
            `;
            container.appendChild(insightEl);
        });
    } catch (error) {
        console.error('Error al cargar insights:', error);
    }
}

// ========================================
// GUARDAR HÁBITOS
// ========================================
async function saveHabits() {
    const btn = document.getElementById('save-habits-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

    try {
        const result = await window.dailyHabits.saveDailyHabits(currentHabits);

        if (result.success) {
            showToast('Hábitos guardados exitosamente', 'success');
            await loadHealthInsights(); // Recargar insights
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error al guardar hábitos:', error);
        showToast('Error al guardar hábitos', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check"></i> Guardar Hábitos del Día';
    }
}

function scheduleAutoSave() {
    // Cancelar guardado anterior
    if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
    }

    // Programar nuevo guardado en 2 segundos
    autoSaveTimeout = setTimeout(async () => {
        await saveHabits();
    }, 2000);
}

// ========================================
// UTILIDADES
// ========================================
function animateNumber(elementId, targetValue) {
    const element = document.getElementById(elementId);
    const currentValue = parseInt(element.textContent) || 0;
    const increment = targetValue > currentValue ? 1 : -1;
    const duration = 500;
    const steps = Math.abs(targetValue - currentValue);
    const stepDuration = duration / steps;

    let current = currentValue;
    const timer = setInterval(() => {
        current += increment;
        element.textContent = current;

        if (current === targetValue) {
            clearInterval(timer);
        }
    }, stepDuration);
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    toast.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 100);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
