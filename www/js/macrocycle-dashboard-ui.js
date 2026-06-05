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
    
    // Selector de Periodo
    const periodSelect = document.getElementById('period-select');
    if (periodSelect) {
        periodSelect.value = localStorage.getItem('activePeriod') || 'VERANO_2026';
        periodSelect.addEventListener('change', async (e) => {
            localStorage.setItem('activePeriod', e.target.value);
            await loadMacrocycleData();
            await loadStepsHistory();
            updateTimeline();
        });
    }
}

// ========================================
// CARGAR DATOS DEL MACROCICLO
// ========================================
async function loadMacrocycleData() {
    try {
        const activePeriod = localStorage.getItem('activePeriod') || 'VERANO_2026';
        const subtitle = document.getElementById('program-duration-subtitle');
        if (subtitle) {
            subtitle.textContent = activePeriod === 'VERANO_2026' ? 'Macrociclo de 6 Semanas' : (activePeriod === 'PRIMAVERA_2026' ? 'Macrociclo de 19 Semanas' : 'Historial General (Todos los Periodos)');
        }

        const phaseCard = document.querySelector('.current-phase-card');
        const timelineCard = document.querySelector('.timeline-card');
        const nextPhaseCard = document.getElementById('next-phase-card');
        
        const existingMsg = document.getElementById('general-period-msg');
        if (existingMsg) existingMsg.remove();

        if (activePeriod === 'TOTAL') {
            if (phaseCard) phaseCard.style.display = 'none';
            if (timelineCard) timelineCard.style.display = 'none';
            if (nextPhaseCard) nextPhaseCard.style.display = 'none';

            // Crear tarjeta de mensaje informativo
            const msgCard = document.createElement('div');
            msgCard.id = 'general-period-msg';
            msgCard.className = 'card';
            msgCard.style.cssText = 'background: white; padding: 2.5rem 2rem; text-align: center; border-radius: 12px; box-shadow: var(--shadow-sm); margin-bottom: 1.5rem; width: 100%; box-sizing: border-box;';
            msgCard.innerHTML = `
                <i class="fa-solid fa-circle-info" style="font-size: 3rem; color: var(--primary); margin-bottom: 1rem; display: block;"></i>
                <h3 style="font-size: 1.2rem; font-weight: 700; color: #1f2937; margin: 0 0 0.5rem 0;">Fases del Macrociclo No Aplicables</h3>
                <p style="font-size: 0.9rem; color: #4b5563; max-width: 500px; margin: 0 auto; line-height: 1.6;">
                    La periodización en fases y metas es específica para cada periodo (Primavera o Verano).
                    <br><br>
                    Selecciona un periodo específico en la parte superior para visualizar tus fases de entrenamiento, metas diarias y timeline.
                </p>
            `;
            
            const periodCard = document.querySelector('.card');
            if (periodCard) {
                periodCard.parentNode.insertBefore(msgCard, periodCard.nextSibling);
            }

            const recGrid = document.getElementById('recommendations-grid');
            if (recGrid) {
                recGrid.innerHTML = '<p style="grid-column: span 2; text-align: center; color: #6b7280; padding: 1.5rem; margin: 0;">Selecciona un periodo específico para recibir recomendaciones personalizadas.</p>';
            }
            return;
        }

        if (phaseCard) phaseCard.style.display = 'block';
        if (timelineCard) timelineCard.style.display = 'block';

        const profileResult = await window.healthProfile.getHealthProfile();

        if (!profileResult.exists) {
            // NO redirigir - mostrar mensaje útil
            console.error('❌ No se encontró perfil de salud');
            console.log('📋 Resultado completo:', profileResult);
            showToast('No se encontró tu perfil de salud. Verifica la consola para más detalles.', 'warning');

            // Mostrar datos de prueba para que pueda ver el dashboard
            phaseData = {
                phase: 1,
                phaseName: 'Adaptación Anatómica',
                description: 'Preparar articulaciones y sistema cardiovascular',
                currentWeek: 1,
                currentWeekInPhase: 1,
                totalWeeks: activePeriod === 'VERANO_2026' ? 2 : 5,
                progress: 20,
                stepGoal: 3000,
                habitPriority: 'Hidratación',
                startDate: new Date().toISOString(),
                endDate: new Date(Date.now() + (activePeriod === 'VERANO_2026' ? 14 : 35) * 24 * 60 * 60 * 1000).toISOString(),
                color: 'linear-gradient(135deg, #10b981, #059669)',
                icon: '🌱'
            };

            updateCurrentPhase();
            updatePhaseStats();
            updateNextPhase();
            loadRecommendations();
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
        showToast('Error al cargar datos del macrociclo: ' + error.message, 'error');
    }
}

// ========================================
// ACTUALIZAR FASE ACTUAL
// ========================================
function updateCurrentPhase() {
    if (!phaseData) return;

    const activePeriod = localStorage.getItem('activePeriod') || 'VERANO_2026';
    const totalPhases = activePeriod === 'VERANO_2026' ? 3 : 4;
    const phaseTotalEl = document.getElementById('phase-total');
    if (phaseTotalEl) {
        phaseTotalEl.textContent = totalPhases;
    }

    // Badge de fase
    const phaseBadge = document.getElementById('phase-badge');
    if (phaseBadge) phaseBadge.style.background = phaseData.color;

    document.getElementById('phase-icon').textContent = phaseData.icon;
    document.getElementById('phase-num').textContent = phaseData.phase;

    // Información de fase
    document.getElementById('phase-name').textContent = phaseData.phaseName;
    document.getElementById('phase-description').textContent = phaseData.description;

    // Progreso
    document.getElementById('current-week').textContent = phaseData.currentWeekInPhase || phaseData.currentWeek;
    document.getElementById('total-weeks').textContent = phaseData.totalWeeks;
    document.getElementById('progress-percent').textContent = `${phaseData.progress}%`;

    const progressBar = document.getElementById('phase-progress-bar');
    if (progressBar) {
        progressBar.style.width = `${phaseData.progress}%`;
        progressBar.style.background = phaseData.color;
    }
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
    const activePeriod = localStorage.getItem('activePeriod') || 'VERANO_2026';
    const maxPhase = activePeriod === 'VERANO_2026' ? 3 : 4;
    const nextPhaseCard = document.getElementById('next-phase-card');

    if (!phaseData || phaseData.phase >= maxPhase) {
        // Ya está en la última fase
        if (nextPhaseCard) nextPhaseCard.style.display = 'none';
        return;
    }

    if (nextPhaseCard) nextPhaseCard.style.display = 'block';

    const nextPhase = phaseData.phase + 1;
    const nextPhaseInfo = getPhaseInfo(nextPhase);

    if (nextPhaseInfo) {
        document.getElementById('next-phase-icon').textContent = nextPhaseInfo.icon;
        document.getElementById('next-phase-name').textContent = nextPhaseInfo.name;
        document.getElementById('next-phase-desc').textContent = nextPhaseInfo.description;
        document.getElementById('next-phase-goal').textContent = nextPhaseInfo.stepGoal.toLocaleString();
    }

    // Calcular días hasta próxima fase
    const endDate = new Date(phaseData.endDate);
    const today = new Date();
    const daysToNext = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    document.getElementById('days-to-next').textContent = Math.max(0, daysToNext);
}

function getPhaseInfo(phase) {
    const activePeriod = localStorage.getItem('activePeriod') || 'VERANO_2026';
    
    if (activePeriod === 'VERANO_2026') {
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
                stepGoal: 5000
            },
            3: {
                icon: '🏆',
                name: 'Consolidación',
                description: 'Mantenimiento óptimo de salud',
                stepGoal: 7000
            }
        };
        return phases[phase];
    }

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

        // Obtener últimos 30 días según el periodo activo
        const activePeriod = localStorage.getItem('activePeriod') || 'VERANO_2026';
        let endDate = new Date();
        if (activePeriod === 'PRIMAVERA_2026') {
            endDate = new Date('2026-05-22T23:59:59');
        }
        const startDate = new Date(endDate);
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

    const activePeriod = localStorage.getItem('activePeriod') || 'VERANO_2026';
    const datasets = [
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
        }
    ];

    if (activePeriod !== 'TOTAL') {
        datasets.push({
            label: 'Meta de Fase',
            data: goalData,
            borderColor: '#f59e0b',
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [5, 5],
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 0
        });
    }

    const goalLegend = document.querySelector('.legend-item:nth-child(2)');
    if (goalLegend) {
        goalLegend.style.display = activePeriod === 'TOTAL' ? 'none' : 'inline-flex';
    }

    stepsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
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

    const activePeriod = localStorage.getItem('activePeriod') || 'VERANO_2026';
    const timelineContainer = document.querySelector('.timeline');
    if (!timelineContainer) return;

    if (activePeriod === 'VERANO_2026') {
        timelineContainer.innerHTML = `
            <!-- Fase 1 -->
            <div class="timeline-phase" data-phase="1">
                <div class="phase-marker">
                    <div class="marker-icon">🌱</div>
                    <div class="marker-line"></div>
                </div>
                <div class="phase-content">
                    <div class="phase-header">
                        <h4>Fase 1: Adaptación Anatómica</h4>
                        <span class="phase-weeks">Semanas 1-2</span>
                    </div>
                    <div class="phase-details">
                        <div class="detail-item">
                            <i class="fas fa-bullseye"></i>
                            <span>Meta: 3,000 pasos/día</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-droplet"></i>
                            <span>Hidratación (8 vasos)</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Fase 2 -->
            <div class="timeline-phase" data-phase="2">
                <div class="phase-marker">
                    <div class="marker-icon">💪</div>
                    <div class="marker-line"></div>
                </div>
                <div class="phase-content">
                    <div class="phase-header">
                        <h4>Fase 2: Base de Resistencia</h4>
                        <span class="phase-weeks">Semanas 3-4</span>
                    </div>
                    <div class="phase-details">
                        <div class="detail-item">
                            <i class="fas fa-bullseye"></i>
                            <span>Meta: 5,000 pasos/día</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-clock"></i>
                            <span>Caminata continua >15 min</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Fase 3 -->
            <div class="timeline-phase" data-phase="3">
                <div class="phase-marker">
                    <div class="marker-icon">🏆</div>
                    <div class="marker-line last"></div>
                </div>
                <div class="phase-content">
                    <div class="phase-header">
                        <h4>Fase 3: Consolidación</h4>
                        <span class="phase-weeks">Semanas 5-6</span>
                    </div>
                    <div class="phase-details">
                        <div class="detail-item">
                            <i class="fas fa-bullseye"></i>
                            <span>Meta: 7,000 pasos/día</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-trophy"></i>
                            <span>Meta Final 7K Club</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else {
        timelineContainer.innerHTML = `
            <!-- Fase 1 -->
            <div class="timeline-phase" data-phase="1">
                <div class="phase-marker">
                    <div class="marker-icon">🌱</div>
                    <div class="marker-line"></div>
                </div>
                <div class="phase-content">
                    <div class="phase-header">
                        <h4>Fase 1: Adaptación Anatómica</h4>
                        <span class="phase-weeks">Semanas 1-5</span>
                    </div>
                    <div class="phase-details">
                        <div class="detail-item">
                            <i class="fas fa-bullseye"></i>
                            <span>Meta: 3,000 pasos/día</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-droplet"></i>
                            <span>Hidratación (8 vasos)</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Fase 2 -->
            <div class="timeline-phase" data-phase="2">
                <div class="phase-marker">
                    <div class="marker-icon">💪</div>
                    <div class="marker-line"></div>
                </div>
                <div class="phase-content">
                    <div class="phase-header">
                        <h4>Fase 2: Base de Resistencia</h4>
                        <span class="phase-weeks">Semanas 6-10</span>
                    </div>
                    <div class="phase-details">
                        <div class="detail-item">
                            <i class="fas fa-bullseye"></i>
                            <span>Meta: 4,500 pasos/día</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-clock"></i>
                            <span>Caminata continua >15 min</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Fase 3 -->
            <div class="timeline-phase" data-phase="3">
                <div class="phase-marker">
                    <div class="marker-icon">🔥</div>
                    <div class="marker-line"></div>
                </div>
                <div class="phase-content">
                    <div class="phase-header">
                        <h4>Fase 3: Intensificación</h4>
                        <span class="phase-weeks">Semanas 11-15</span>
                    </div>
                    <div class="phase-details">
                        <div class="detail-item">
                            <i class="fas fa-bullseye"></i>
                            <span>Meta: 6,000 pasos/día</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-apple-whole"></i>
                            <span>Nutrición Balanceada</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Fase 4 -->
            <div class="timeline-phase" data-phase="4">
                <div class="phase-marker">
                    <div class="marker-icon">🏆</div>
                    <div class="marker-line last"></div>
                </div>
                <div class="phase-content">
                    <div class="phase-header">
                        <h4>Fase 4: Consolidación</h4>
                        <span class="phase-weeks">Semanas 16-19</span>
                    </div>
                    <div class="phase-details">
                        <div class="detail-item">
                            <i class="fas fa-bullseye"></i>
                            <span>Meta: 7,000 pasos/día</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-trophy"></i>
                            <span>Meta Final 7K Club</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

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
    const activePeriod = localStorage.getItem('activePeriod') || 'VERANO_2026';
    const modalBody = document.querySelector('.info-modal .modal-body');
    if (modalBody) {
        if (activePeriod === 'VERANO_2026') {
            modalBody.innerHTML = `
                <div class="info-section">
                    <h3>🎯 ¿Qué es un Macrociclo?</h3>
                    <p>Un macrociclo es un programa de entrenamiento estructurado en fases progresivas. Nuestro programa
                        de 6 semanas te guía desde la adaptación inicial hasta alcanzar la meta de 7,000 pasos diarios.</p>
                </div>

                <div class="info-section">
                    <h3>🔬 Evidencia Científica</h3>
                    <p>Estudios recientes demuestran que <strong>7,000 pasos diarios</strong> reducen el riesgo de
                        mortalidad en un 50-70%. Además, caminatas continuas de <strong>15+ minutos</strong> ofrecen
                        beneficios cardiovasculares adicionales.</p>
                </div>

                <div class="info-section">
                    <h3>📊 Las 3 Fases de Verano</h3>
                    <ul>
                        <li><strong>Fase 1 (Semanas 1-2):</strong> Adaptación Anatómica - 3,000 pasos (Hidratación)</li>
                        <li><strong>Fase 2 (Semanas 3-4):</strong> Base de Resistencia - 5,000 pasos (Caminata continua >15 min)</li>
                        <li><strong>Fase 3 (Semanas 5-6):</strong> Consolidación - 7,000 pasos (Meta Final 7K)</li>
                    </ul>
                </div>

                <div class="info-section">
                    <h3>💡 Consejos para el Éxito</h3>
                    <ul>
                        <li>Sé constante: la clave está en la regularidad, no en la perfección</li>
                        <li>Escucha a tu cuerpo: descansa si sientes dolor</li>
                        <li>Celebra los pequeños logros: cada paso cuenta</li>
                        <li>Mantén tus hábitos prioritarios de cada fase</li>
                    </ul>
                </div>
            `;
        } else {
            modalBody.innerHTML = `
                <div class="info-section">
                    <h3>🎯 ¿Qué es un Macrociclo?</h3>
                    <p>Un macrociclo es un programa de entrenamiento estructurado en fases progresivas. Nuestro programa
                        de 19 semanas te guía desde la adaptación inicial hasta alcanzar la meta científicamente
                        validada de 7,000 pasos diarios.</p>
                </div>

                <div class="info-section">
                    <h3>🔬 Evidencia Científica</h3>
                    <p>Estudios recientes demuestran que <strong>7,000 pasos diarios</strong> reducen el riesgo de
                        mortalidad en un 50-70%. Además, caminatas continuas de <strong>15+ minutos</strong> ofrecen
                        beneficios cardiovasculares adicionales.</p>
                </div>

                <div class="info-section">
                    <h3>📊 Las 4 Fases</h3>
                    <ul>
                        <li><strong>Fase 1 (Semanas 1-5):</strong> Adaptación Anatómica - 3,000 pasos</li>
                        <li><strong>Fase 2 (Semanas 6-10):</strong> Base de Resistencia - 4,500 pasos</li>
                        <li><strong>Fase 3 (Semanas 11-15):</strong> Intensificación - 6,000 pasos</li>
                        <li><strong>Fase 4 (Semanas 16-19):</strong> Consolidación - 7,000 pasos</li>
                    </ul>
                </div>

                <div class="info-section">
                    <h3>💡 Consejos para el Éxito</h3>
                    <ul>
                        <li>Sé constante: la clave está en la regularidad, no en la perfección</li>
                        <li>Escucha a tu cuerpo: descansa si sientes dolor</li>
                        <li>Celebra los pequeños logros: cada paso cuenta</li>
                        <li>Mantén tus hábitos prioritarios de cada fase</li>
                    </ul>
                </div>
            `;
        }
    }
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
