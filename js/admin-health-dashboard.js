// ========================================
// ADMIN HEALTH DASHBOARD - FASE 2.5
// ========================================
// Panel administrativo de salud poblacional
// Incluye estadísticas, alertas y análisis de datos

let healthProfiles = [];
let bmiChart = null;

// ========================================
// INICIALIZACIÓN
// ========================================
document.addEventListener('DOMContentLoaded', async function () {
    showLoading();
    await loadHealthData();
    setupEventListeners();
    hideLoading();
});

function setupEventListeners() {
    document.getElementById('export-btn').addEventListener('click', exportReport);

    // Filtros de IMC
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            // TODO: Implementar filtro por área
        });
    });
}

// ========================================
// CARGAR DATOS DE SALUD
// ========================================
async function loadHealthData() {
    try {
        // Obtener todos los perfiles de salud
        const snapshot = await db.collection('health_profiles').get();

        healthProfiles = [];
        snapshot.forEach(doc => {
            healthProfiles.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // Actualizar UI
        updateSummaryCards();
        updateBMIDistribution();
        updateHealthAlerts();
        updateMacrocycleProgress();
        updateMedicalConditions();
        updateCardiovascularRisk();

    } catch (error) {
        console.error('Error al cargar datos de salud:', error);
        showToast('Error al cargar datos de salud', 'error');
    }
}

// ========================================
// TARJETAS DE RESUMEN
// ========================================
function updateSummaryCards() {
    // Total de usuarios (obtener de colección users)
    db.collection('users').get().then(snapshot => {
        const totalUsers = snapshot.size;
        document.getElementById('total-users').textContent = totalUsers;

        // Usuarios con perfil
        const usersWithProfile = healthProfiles.length;
        document.getElementById('users-with-profile').textContent = usersWithProfile;

        const percent = totalUsers > 0 ? Math.round((usersWithProfile / totalUsers) * 100) : 0;
        document.getElementById('profile-percent').textContent = `${percent}%`;
    });

    // IMC Promedio
    if (healthProfiles.length > 0) {
        const totalBMI = healthProfiles.reduce((sum, profile) => {
            return sum + (profile.computed_metrics?.bmi_value || 0);
        }, 0);

        const avgBMI = (totalBMI / healthProfiles.length).toFixed(1);
        document.getElementById('avg-bmi').textContent = avgBMI;

        // Categoría de IMC promedio
        const bmiCategory = getBMICategory(parseFloat(avgBMI));
        const categoryEl = document.getElementById('avg-bmi-category');
        categoryEl.textContent = bmiCategory.category;
        categoryEl.style.color = bmiCategory.color;
    }

    // Wellness Score Promedio
    loadAverageWellnessScore();
}

async function loadAverageWellnessScore() {
    try {
        // Obtener hábitos de los últimos 7 días
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const dateString = sevenDaysAgo.toISOString().split('T')[0];

        const snapshot = await db.collection('daily_habits')
            .where('date', '>=', dateString)
            .get();

        if (snapshot.size > 0) {
            const totalScore = snapshot.docs.reduce((sum, doc) => {
                return sum + (doc.data().wellness_score || 0);
            }, 0);

            const avgScore = Math.round(totalScore / snapshot.size);
            document.getElementById('avg-wellness').textContent = avgScore;
        }
    } catch (error) {
        console.error('Error al cargar wellness score:', error);
    }
}

function getBMICategory(bmi) {
    if (bmi < 18.5) return { category: 'Bajo Peso', color: '#3b82f6' };
    if (bmi < 25) return { category: 'Normal', color: '#10b981' };
    if (bmi < 30) return { category: 'Sobrepeso', color: '#f59e0b' };
    return { category: 'Obesidad', color: '#ef4444' };
}

// ========================================
// DISTRIBUCIÓN DE IMC
// ========================================
function updateBMIDistribution() {
    const distribution = {
        underweight: 0,
        normal: 0,
        overweight: 0,
        obese: 0
    };

    healthProfiles.forEach(profile => {
        const category = profile.computed_metrics?.bmi_category;
        if (!category) return;

        if (category === 'Bajo Peso') {
            distribution.underweight++;
        } else if (category === 'Normal') {
            distribution.normal++;
        } else if (category === 'Sobrepeso') {
            distribution.overweight++;
        } else {
            distribution.obese++;
        }
    });

    const total = healthProfiles.length;

    // Actualizar estadísticas
    document.getElementById('bmi-underweight').textContent = distribution.underweight;
    document.getElementById('bmi-underweight-percent').textContent =
        `${total > 0 ? Math.round((distribution.underweight / total) * 100) : 0}%`;

    document.getElementById('bmi-normal').textContent = distribution.normal;
    document.getElementById('bmi-normal-percent').textContent =
        `${total > 0 ? Math.round((distribution.normal / total) * 100) : 0}%`;

    document.getElementById('bmi-overweight').textContent = distribution.overweight;
    document.getElementById('bmi-overweight-percent').textContent =
        `${total > 0 ? Math.round((distribution.overweight / total) * 100) : 0}%`;

    document.getElementById('bmi-obese').textContent = distribution.obese;
    document.getElementById('bmi-obese-percent').textContent =
        `${total > 0 ? Math.round((distribution.obese / total) * 100) : 0}%`;

    // Crear gráfica
    createBMIChart(distribution);
}

function createBMIChart(distribution) {
    const ctx = document.getElementById('bmi-distribution-chart').getContext('2d');

    if (bmiChart) {
        bmiChart.destroy();
    }

    bmiChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Bajo Peso', 'Normal', 'Sobrepeso', 'Obesidad'],
            datasets: [{
                data: [
                    distribution.underweight,
                    distribution.normal,
                    distribution.overweight,
                    distribution.obese
                ],
                backgroundColor: [
                    '#3b82f6',
                    '#10b981',
                    '#f59e0b',
                    '#ef4444'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percent = total > 0 ? Math.round((context.parsed / total) * 100) : 0;
                            return `${context.label}: ${context.parsed} (${percent}%)`;
                        }
                    }
                }
            }
        }
    });
}

// ========================================
// ALERTAS DE SALUD
// ========================================
function updateHealthAlerts() {
    const alerts = [];

    healthProfiles.forEach(profile => {
        // Alerta por obesidad
        if (profile.computed_metrics?.bmi_category === 'Obesidad I' ||
            profile.computed_metrics?.bmi_category === 'Obesidad II+') {
            alerts.push({
                type: 'warning',
                icon: 'fa-weight-scale',
                user: profile.email,
                message: `IMC: ${profile.computed_metrics.bmi_value} (${profile.computed_metrics.bmi_category})`,
                action: 'Recomendar programa de reducción de peso'
            });
        }

        // Alerta por riesgo cardiovascular alto
        if (profile.computed_metrics?.cardiovascular_risk === 'Alto') {
            alerts.push({
                type: 'danger',
                icon: 'fa-heart-pulse',
                user: profile.email,
                message: 'Riesgo cardiovascular alto',
                action: 'Seguimiento médico recomendado'
            });
        }

        // Alerta por múltiples condiciones médicas
        const conditions = profile.medical_conditions || {};
        const conditionCount = Object.values(conditions).filter(v => v === true).length;
        if (conditionCount >= 3) {
            alerts.push({
                type: 'danger',
                icon: 'fa-notes-medical',
                user: profile.email,
                message: `${conditionCount} condiciones médicas activas`,
                action: 'Evaluación médica integral'
            });
        }
    });

    // Actualizar contador
    document.getElementById('alert-count').textContent =
        `${alerts.length} alerta${alerts.length !== 1 ? 's' : ''}`;

    // Mostrar alertas (máximo 10)
    const container = document.getElementById('alerts-container');
    container.innerHTML = '';

    if (alerts.length === 0) {
        container.innerHTML = '<div class="no-alerts"><i class="fas fa-check-circle"></i> No hay alertas activas</div>';
        return;
    }

    alerts.slice(0, 10).forEach(alert => {
        const alertEl = document.createElement('div');
        alertEl.className = `alert-item alert-${alert.type}`;
        alertEl.innerHTML = `
            <div class="alert-icon">
                <i class="fas ${alert.icon}"></i>
            </div>
            <div class="alert-content">
                <div class="alert-user">${alert.user}</div>
                <div class="alert-message">${alert.message}</div>
                <div class="alert-action">${alert.action}</div>
            </div>
        `;
        container.appendChild(alertEl);
    });
}

// ========================================
// PROGRESO DEL MACROCICLO
// ========================================
function updateMacrocycleProgress() {
    const phaseDistribution = { 1: 0, 2: 0, 3: 0, 4: 0 };

    healthProfiles.forEach(profile => {
        const phase = profile.macrocycle?.current_phase;
        if (phase && phaseDistribution.hasOwnProperty(phase)) {
            phaseDistribution[phase]++;
        }
    });

    const total = healthProfiles.length;

    for (let phase = 1; phase <= 4; phase++) {
        const count = phaseDistribution[phase];
        const percent = total > 0 ? (count / total) * 100 : 0;

        document.getElementById(`phase-${phase}-count`).textContent =
            `${count} usuario${count !== 1 ? 's' : ''}`;

        const fillEl = document.getElementById(`phase-${phase}-fill`);
        fillEl.style.width = `${percent}%`;
    }
}

// ========================================
// CONDICIONES MÉDICAS
// ========================================
function updateMedicalConditions() {
    const conditions = {
        diabetes: 0,
        hypertension: 0,
        asthma: 0,
        back_injury: 0,
        heart_disease: 0
    };

    healthProfiles.forEach(profile => {
        const medicalConditions = profile.medical_conditions || {};
        Object.keys(conditions).forEach(condition => {
            if (medicalConditions[condition]) {
                conditions[condition]++;
            }
        });
    });

    const total = healthProfiles.length;

    Object.keys(conditions).forEach(condition => {
        const count = conditions[condition];
        const percent = total > 0 ? Math.round((count / total) * 100) : 0;

        document.getElementById(`${condition}-count`).textContent = count;
        document.getElementById(`${condition}-percent`).textContent = `${percent}%`;
    });
}

// ========================================
// RIESGO CARDIOVASCULAR
// ========================================
function updateCardiovascularRisk() {
    const riskDistribution = {
        low: 0,
        medium: 0,
        high: 0
    };

    healthProfiles.forEach(profile => {
        const risk = profile.computed_metrics?.cardiovascular_risk;
        if (risk === 'Bajo') riskDistribution.low++;
        else if (risk === 'Medio') riskDistribution.medium++;
        else if (risk === 'Alto') riskDistribution.high++;
    });

    const total = healthProfiles.length;

    ['low', 'medium', 'high'].forEach(level => {
        const count = riskDistribution[level];
        const percent = total > 0 ? Math.round((count / total) * 100) : 0;

        document.getElementById(`risk-${level}-count`).textContent = count;
        document.getElementById(`risk-${level}-percent`).textContent = `${percent}%`;
    });
}

// ========================================
// EXPORTAR REPORTE
// ========================================
function exportReport() {
    showToast('Generando reporte PDF...', 'info');

    // TODO: Implementar generación de PDF con jsPDF
    // Por ahora, mostrar mensaje
    setTimeout(() => {
        showToast('Funcionalidad de exportación en desarrollo', 'warning');
    }, 1500);
}

// ========================================
// UTILIDADES
// ========================================
function showLoading() {
    document.getElementById('loading-overlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading-overlay').style.display = 'none';
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
