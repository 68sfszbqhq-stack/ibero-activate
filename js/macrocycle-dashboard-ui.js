// ========================================
// MACROCYCLE DASHBOARD UI - FASE 2.4
// ========================================
// Maneja la interfaz del dashboard de macrociclo
// Incluye fase actual, gráfica, timeline y recomendaciones

let phaseData = null;
let stepsChart = null;

// ========================================
// INICIALIZACIÓN
// ========================================
document.addEventListener('DOMContentLoaded', async function () {
    await loadMacrocycleData();
    await loadStepsHistory();
    setupEventListeners();
    updateTimeline();
});

function setupEventListeners() {
    document.getElementById('info-btn').addEventListener('click', openInfoModal);
}

// ========================================
// CARGAR DATOS DEL MACROCICLO
// ========================================
async function loadMacrocycleData() {
    try {
        const profileResult = await window.healthProfile.getHealthProfile();

        if (!profileResult.exists) {
            window.location.href = 'health-onboarding.html';
            return;
        }

        phaseData = profileResult.profile.macrocycle.phase_data;

        // Actualizar UI
        updateCurrentPhase();
        updatePhaseStats();
        updateNextPhase();
        loadRecommendations();

    } catch (error) {
        console.error('Error al cargar macrociclo:', error);
        showToast('Error al cargar datos del macrociclo', 'error');
    }
}

// ========================================
// ACTUALIZAR FASE ACTUAL
// ========================================
function updateCurrentPhase() {
    if (!phaseData) return;

    // Badge de fase
    const phaseBadge = document.getElementById('phase-badge');
    phaseBadge.style.background = phaseData.color;

    document.getElementById('phase-icon').textContent = phaseData.icon;
    document.getElementById('phase-num').textContent = phaseData.phase;

    // Información de fase
    document.getElementById('phase-name').textContent = phaseData.phaseName;
    document.getElementById('phase-description').textContent = phaseData.description;

    // Progreso
    document.getElementById('current-week').textContent = phaseData.currentWeek;
    document.getElementById('total-weeks').textContent = phaseData.totalWeeks;
    document.getElementById('progress-percent').textContent = `${phaseData.progress}%`;

    const progressBar = document.getElementById('phase-progress-bar');
    progressBar.style.width = `${phaseData.progress}%`;
    progressBar.style.background = phaseData.color;
}

function updatePhaseStats() {
    if (!phaseData) return;

    document.getElementById('daily-goal').textContent = phaseData.stepGoal.toLocaleString();
    document.getElementById('habit-priority').textContent = phaseData.habitPriority;

    // Calcular días en fase
    const startDate = new Date(phaseData.startDate);
    const today = new Date();
    const daysInPhase = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    document.getElementById('days-in-phase').textContent = Math.max(0, daysInPhase);
}

// ========================================
// PRÓXIMA FASE
// ========================================
function updateNextPhase() {
    if (!phaseData || phaseData.phase === 4) {
        // Ya está en la última fase
        return;
    }

    const nextPhaseCard = document.getElementById('next-phase-card');
    nextPhaseCard.style.display = 'block';

    const nextPhase = phaseData.phase + 1;
    const nextPhaseInfo = getPhaseInfo(nextPhase);

    document.getElementById('next-phase-icon').textContent = nextPhaseInfo.icon;
    document.getElementById('next-phase-name').textContent = nextPhaseInfo.name;
    document.getElementById('next-phase-desc').textContent = nextPhaseInfo.description;
    document.getElementById('next-phase-goal').textContent = nextPhaseInfo.stepGoal.toLocaleString();

    // Calcular días hasta próxima fase
    const endDate = new Date(phaseData.endDate);
    const today = new Date();
    const daysToNext = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    document.getElementById('days-to-next').textContent = Math.max(0, daysToNext);
}

function getPhaseInfo(phase) {
    const phases = {
        1: {
            icon: '🌱',
            name: 'Adaptación Anatómica',
            description: 'Preparar articulaciones y sistema cardiovascular',
            stepGoal: 3000
        },
        2: {
            icon: '💪',
            name: 'Base de Resistencia',
            description: 'Desarrollar capacidad aeróbica',
            stepGoal: 4500
        },
        3: {
            icon: '🔥',
            name: 'Intensificación',
            description: 'Aumentar volumen e intensidad',
            stepGoal: 6000
        },
        4: {
            icon: '🏆',
            name: 'Consolidación',
            description: 'Alcanzar y mantener meta final',
            stepGoal: 7000
        }
    };

    return phases[phase];
}

// ========================================
// GRÁFICA DE PASOS
// ========================================
async function loadStepsHistory() {
    try {
        const user = auth.currentUser;
        if (!user) return;

        const userDoc = await db.collection('users').doc(user.uid).get();
        const userEmail = userDoc.data()?.email || user.email;

        // Obtener últimos 30 días
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 29);

        const snapshot = await db.collection('walking_stats')
            .where('collaboratorEmail', '==', userEmail)
            .where('date', '>=', startDate.toISOString().split('T')[0])
            .where('date', '<=', endDate.toISOString().split('T')[0])
            .orderBy('date', 'asc')
            .get();

        // Procesar datos
        const labels = [];
        const stepsData = [];
        const goalData = [];

        for (let i = 0; i < 30; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            const dateString = date.toISOString().split('T')[0];

            labels.push(date.getDate());

            // Buscar datos de ese día
            const dayData = snapshot.docs.find(doc => doc.data().date === dateString);
            stepsData.push(dayData ? dayData.data().metrics.steps : 0);

            // Meta de ese día (puede variar según fase)
            goalData.push(phaseData ? phaseData.stepGoal : 7000);
        }

        createStepsChart(labels, stepsData, goalData);

    } catch (error) {
        console.error('Error al cargar historial de pasos:', error);
    }
}

function createStepsChart(labels, stepsData, goalData) {
    const ctx = document.getElementById('steps-chart').getContext('2d');

    if (stepsChart) {
        stepsChart.destroy();
    }

    stepsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Pasos Reales',
                    data: stepsData,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#10b981',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                },
                {
                    label: 'Meta de Fase',
                    data: goalData,
                    borderColor: '#f59e0b',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: false,
                    pointRadius: 0,
                    pointHoverRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        title: function (context) {
                            return `Día ${context[0].label}`;
                        },
                        label: function (context) {
                            return `${context.dataset.label}: ${context.parsed.y.toLocaleString()} pasos`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        callback: function (value) {
                            return value.toLocaleString();
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// ========================================
// TIMELINE
// ========================================
function updateTimeline() {
    if (!phaseData) return;

    const currentPhase = phaseData.phase;

    // Marcar fase actual
    document.querySelectorAll('.timeline-phase').forEach((phase, index) => {
        const phaseNum = index + 1;

        if (phaseNum < currentPhase) {
            phase.classList.add('completed');
        } else if (phaseNum === currentPhase) {
            phase.classList.add('active');
        } else {
            phase.classList.add('upcoming');
        }
    });
}

// ========================================
// RECOMENDACIONES
// ========================================
function loadRecommendations() {
    if (!phaseData) return;

    const recommendations = getPhaseRecommendations(phaseData.phase);
    const container = document.getElementById('recommendations-grid');
    container.innerHTML = '';

    recommendations.forEach(rec => {
        const recCard = document.createElement('div');
        recCard.className = 'recommendation-card';
        recCard.innerHTML = `
            <div class="rec-icon" style="background: ${rec.color}">
                ${rec.icon}
            </div>
            <div class="rec-content">
                <h4>${rec.title}</h4>
                <p>${rec.description}</p>
            </div>
        `;
        container.appendChild(recCard);
    });
}

function getPhaseRecommendations(phase) {
    const recommendations = {
        1: [
            {
                icon: '💧',
                color: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                title: 'Hidratación Constante',
                description: 'Bebe 8 vasos de agua al día. La hidratación mejora tu rendimiento y recuperación.'
            },
            {
                icon: '👟',
                color: 'linear-gradient(135deg, #10b981, #059669)',
                title: 'Calzado Adecuado',
                description: 'Usa zapatos cómodos con buen soporte. Esto previene lesiones y mejora tu experiencia.'
            },
            {
                icon: '⏰',
                color: 'linear-gradient(135deg, #f59e0b, #d97706)',
                title: 'Establece Rutinas',
                description: 'Camina a la misma hora cada día. La consistencia es clave en esta fase.'
            },
            {
                icon: '📱',
                color: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                title: 'Registra tus Pasos',
                description: 'Usa el walking tracker diariamente para monitorear tu progreso.'
            }
        ],
        2: [
            {
                icon: '⏱️',
                color: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                title: 'Caminatas Continuas',
                description: 'Realiza al menos una caminata de 15+ minutos sin parar. Esto fortalece tu corazón.'
            },
            {
                icon: '🏃',
                color: 'linear-gradient(135deg, #10b981, #059669)',
                title: 'Aumenta el Ritmo',
                description: 'Camina a un paso moderado. Debes poder hablar pero con algo de esfuerzo.'
            },
            {
                icon: '🗓️',
                color: 'linear-gradient(135deg, #f59e0b, #d97706)',
                title: 'Planifica tus Rutas',
                description: 'Varía tus rutas para mantener la motivación y trabajar diferentes músculos.'
            },
            {
                icon: '💪',
                color: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                title: 'Fortalecimiento',
                description: 'Complementa con ejercicios de fuerza ligeros 2 veces por semana.'
            }
        ],
        3: [
            {
                icon: '🍎',
                color: 'linear-gradient(135deg, #10b981, #059669)',
                title: 'Nutrición Balanceada',
                description: 'Prioriza alimentos nutritivos. Tu cuerpo necesita energía de calidad.'
            },
            {
                icon: '📈',
                color: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                title: 'Incrementa Gradualmente',
                description: 'Aumenta tus pasos progresivamente. No te apresures, evita lesiones.'
            },
            {
                icon: '😴',
                color: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                title: 'Descanso Adecuado',
                description: 'Duerme 7-8 horas. El descanso es crucial para la recuperación muscular.'
            },
            {
                icon: '🎯',
                color: 'linear-gradient(135deg, #f59e0b, #d97706)',
                title: 'Mantén el Enfoque',
                description: 'Estás cerca de la meta. Mantén la constancia y celebra tus logros.'
            }
        ],
        4: [
            {
                icon: '🏆',
                color: 'linear-gradient(135deg, #f59e0b, #d97706)',
                title: '¡Meta Final!',
                description: '7,000 pasos diarios. Estás en la fase de consolidación, ¡sigue así!'
            },
            {
                icon: '🔄',
                color: 'linear-gradient(135deg, #10b981, #059669)',
                title: 'Haz un Hábito',
                description: 'Integra la caminata en tu rutina diaria. Que sea parte de tu estilo de vida.'
            },
            {
                icon: '👥',
                color: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                title: 'Comparte tu Éxito',
                description: 'Motiva a otros. Tu ejemplo puede inspirar a tus compañeros.'
            },
            {
                icon: '📊',
                color: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                title: 'Monitorea tu Progreso',
                description: 'Revisa tus estadísticas regularmente. Celebra cuánto has avanzado.'
            }
        ]
    };

    return recommendations[phase] || recommendations[1];
}

// ========================================
// MODAL DE INFORMACIÓN
// ========================================
function openInfoModal() {
    document.getElementById('info-modal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeInfoModal() {
    document.getElementById('info-modal').classList.remove('active');
    document.body.style.overflow = 'auto';
}

// ========================================
// UTILIDADES
// ========================================
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
