// ========================================
// WELLNESS WALKING UI INTERACTIONS
// ========================================

// ========================================
// MOSTRAR/OCULTAR OPCIONES DE SINCRONIZACIÓN
// ========================================
function showSyncOptions() {
    const syncOptions = document.getElementById('sync-options');
    const manualEntry = document.getElementById('manual-entry');

    if (syncOptions) {
        const isVisible = syncOptions.style.display !== 'none';
        syncOptions.style.display = isVisible ? 'none' : 'block';

        // Ocultar entrada manual si está visible
        if (manualEntry) {
            manualEntry.style.display = 'none';
        }
    }
}

function hideSyncOptions() {
    const syncOptions = document.getElementById('sync-options');
    if (syncOptions) {
        syncOptions.style.display = 'none';
    }
}

// ========================================
// MOSTRAR/OCULTAR ENTRADA MANUAL
// ========================================
function showManualEntry() {
    const manualEntry = document.getElementById('manual-entry');
    const syncOptions = document.getElementById('sync-options');

    if (manualEntry) {
        manualEntry.style.display = 'block';

        // Ocultar opciones de sincronización
        if (syncOptions) {
            syncOptions.style.display = 'none';
        }

        // Scroll suave hacia el formulario
        manualEntry.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function hideManualEntry() {
    const manualEntry = document.getElementById('manual-entry');
    if (manualEntry) {
        manualEntry.style.display = 'none';
    }
}

// ========================================
// ACTUALIZAR UI DEL DASHBOARD (Override)
// ========================================
function updateWalkingDashboardUI(stats) {
    // Pasos de hoy
    const today = new Date().toISOString().split('T')[0];
    const todayStats = stats.daily_stats[today] || {
        steps: 0,
        calories: 0,
        distance_km: 0,
        duration_mins: 0,
        is_continuous: false
    };

    // Actualizar contador de pasos
    const stepsElement = document.getElementById('current-steps');
    if (stepsElement) {
        animateNumber(stepsElement, 0, todayStats.steps, 1000);
    }

    // Actualizar progreso circular
    const progressPercentage = Math.min((todayStats.steps / WALKING_GOALS.DAILY_STEPS) * 100, 100);
    const progressCircle = document.getElementById('steps-circle');
    if (progressCircle) {
        animateProgress(progressCircle, progressPercentage);
    }

    // Actualizar porcentaje
    const percentageElement = document.getElementById('percentage');
    if (percentageElement) {
        percentageElement.textContent = Math.round(progressPercentage) + '%';
    }

    // Actualizar métricas del día
    updateMetric('calories-today', todayStats.calories || 0);
    updateMetric('distance-today', (todayStats.distance_km || 0).toFixed(2));
    updateMetric('duration-today', todayStats.duration_mins || 0);

    // Mostrar indicador de caminata continua
    const continuousIndicator = document.getElementById('continuous-indicator');
    if (continuousIndicator) {
        continuousIndicator.style.display = todayStats.is_continuous ? 'flex' : 'none';
    }

    // Actualizar mensaje motivacional
    const healthTip = document.getElementById('health-tip');
    if (healthTip) {
        healthTip.textContent = getHealthInsight(todayStats.steps);
    }

    // Actualizar resumen
    updateSummaryStats(stats.summary);

    // Actualizar badges
    updateBadgesUI(stats.badges);
}

// ========================================
// ANIMACIONES
// ========================================
function animateNumber(element, start, end, duration) {
    const range = end - start;
    const increment = range / (duration / 16); // 60 FPS
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = Math.round(current).toLocaleString();
    }, 16);
}

function animateProgress(element, percentage) {
    let current = 0;
    const increment = percentage / 50; // 50 frames

    const timer = setInterval(() => {
        current += increment;
        if (current >= percentage) {
            current = percentage;
            clearInterval(timer);
        }
        element.style.setProperty('--progress', current);
    }, 20);
}

// ========================================
// ACTUALIZAR MÉTRICAS
// ========================================
function updateMetric(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        if (typeof value === 'number') {
            animateNumber(element, 0, value, 800);
        } else {
            element.textContent = value;
        }
    }
}

// ========================================
// ACTUALIZAR ESTADÍSTICAS DE RESUMEN
// ========================================
function updateSummaryStats(summary) {
    const elements = {
        'avg-steps': summary.avg_steps,
        'days-with-goal': summary.days_with_goal,
        'continuous-sessions': summary.continuous_sessions,
        'total-steps': summary.total_steps
    };

    Object.entries(elements).forEach(([id, value]) => {
        updateMetric(id, value);
    });
}

// ========================================
// ACTUALIZAR BADGES UI
// ========================================
function updateBadgesUI(badges) {
    const badgesContainer = document.getElementById('wellness-badges');
    const badgeCount = document.getElementById('badge-count');

    if (!badgesContainer) return;

    if (!badges || badges.length === 0) {
        badgesContainer.innerHTML = `
            <div class="no-badges">
                <i class="fas fa-medal"></i>
                <p>¡Comienza a caminar para desbloquear insignias!</p>
            </div>
        `;
        if (badgeCount) badgeCount.textContent = '0 insignias';
        return;
    }

    const badgeDefinitions = {
        '7k_club': {
            icon: '🏆',
            title: 'Club 7K',
            description: 'Alcanzaste la meta óptima de 7,000 pasos'
        },
        'continuous_walker': {
            icon: '⚡',
            title: 'Caminante Continuo',
            description: 'Caminaste 15+ minutos sin parar'
        },
        'pioneer': {
            icon: '🌟',
            title: 'Pionero',
            description: 'Primero en usar el sistema de bienestar'
        },
        'week_warrior': {
            icon: '💪',
            title: 'Guerrero Semanal',
            description: 'Cumpliste tu meta 5 días en una semana'
        },
        'month_master': {
            icon: '👑',
            title: 'Maestro Mensual',
            description: 'Cumpliste tu meta 20 días en un mes'
        }
    };

    badgesContainer.innerHTML = badges.map(badgeId => {
        const badge = badgeDefinitions[badgeId];
        if (!badge) return '';

        return `
            <div class="badge-card" data-badge="${badgeId}">
                <div class="badge-icon">${badge.icon}</div>
                <div class="badge-title">${badge.title}</div>
                <div class="badge-description">${badge.description}</div>
            </div>
        `;
    }).join('');

    // Animar entrada de badges
    const badgeCards = badgesContainer.querySelectorAll('.badge-card');
    badgeCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'scale(0.8)';
        setTimeout(() => {
            card.style.transition = 'all 0.3s ease';
            card.style.opacity = '1';
            card.style.transform = 'scale(1)';
        }, index * 100);
    });

    // Actualizar contador
    if (badgeCount) {
        badgeCount.textContent = `${badges.length} insignia${badges.length !== 1 ? 's' : ''}`;
    }
}

// ========================================
// TOGGLE DE VISTA (7 días / 30 días)
// ========================================
function setupViewToggle() {
    const toggleButtons = document.querySelectorAll('.view-toggle button');

    toggleButtons.forEach(button => {
        button.addEventListener('click', async () => {
            // Remover clase active de todos los botones
            toggleButtons.forEach(btn => btn.classList.remove('active'));

            // Agregar clase active al botón clickeado
            button.classList.add('active');

            // Obtener número de días
            const days = parseInt(button.dataset.view);

            // Recargar estadísticas con el nuevo período
            await reloadStatsWithPeriod(days);
        });
    });
}

async function reloadStatsWithPeriod(days) {
    try {
        showLoading('Cargando estadísticas...');

        const user = auth.currentUser;
        if (!user) return;

        const userDoc = await db.collection('users').doc(user.uid).get();
        const userEmail = userDoc.data()?.email || user.email;

        // Obtener estadísticas con el nuevo período
        const stats = await getUserWalkingStats(userEmail, days);

        if (stats) {
            // Solo actualizar el resumen, no los datos del día actual
            updateSummaryStats(stats.summary);
        }

        hideLoading();
    } catch (error) {
        console.error('Error al recargar estadísticas:', error);
        hideLoading();
    }
}

// ========================================
// HELPERS UI (Override con implementación real)
// ========================================
function showLoading(message = 'Cargando...') {
    const overlay = document.getElementById('loading-overlay');
    const messageElement = document.getElementById('loading-message');

    if (overlay) {
        overlay.style.display = 'flex';
    }

    if (messageElement) {
        messageElement.textContent = message;
    }
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };

    toast.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <span>${message}</span>
    `;

    toast.style.cssText = `
        background: white;
        color: #1f2937;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.5rem;
        border-left: 4px solid ${colors[type]};
        animation: slideInRight 0.3s ease;
    `;

    toast.querySelector('i').style.color = colors[type];

    container.appendChild(toast);

    // Auto-remover después de 4 segundos
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            container.removeChild(toast);
        }, 300);
    }, 4000);
}

// Agregar estilos de animación para toasts
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;
document.head.appendChild(style);

// ========================================
// CONFIGURACIÓN INICIAL DE GOOGLE FIT
// ========================================
function showGoogleFitSetup() {
    const clientId = GOOGLE_FIT_CONFIG.clientId;

    if (!clientId || clientId === '') {
        showToast(
            '⚠️ Para usar Google Fit, necesitas configurar tu Client ID en Google Cloud Console. ' +
            'Consulta la documentación para más detalles.',
            'warning'
        );
        return false;
    }

    return true;
}

// ========================================
// INICIALIZACIÓN
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🏃 Wellness Walking UI inicializado');

    // Configurar toggle de vista
    setupViewToggle();

    // Verificar autenticación
    auth.onAuthStateChanged(user => {
        if (user) {
            // Cargar dashboard
            loadWalkingDashboard();
        } else {
            // Redirigir a login
            window.location.href = '../index.html';
        }
    });

    // Verificar si Google API está disponible
    if (typeof gapi !== 'undefined') {
        // Inicializar Google Fit API si está configurado
        if (GOOGLE_FIT_CONFIG.clientId && GOOGLE_FIT_CONFIG.clientId !== '') {
            initGoogleFitAPI();
        }
    }
});

// ========================================
// REFRESCAR DATOS PERIÓDICAMENTE
// ========================================
// Refrescar cada 5 minutos si la página está activa
let refreshInterval = null;

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Pausar refresco cuando la página no está visible
        if (refreshInterval) {
            clearInterval(refreshInterval);
            refreshInterval = null;
        }
    } else {
        // Reanudar refresco cuando la página vuelve a estar visible
        loadWalkingDashboard(); // Refrescar inmediatamente

        refreshInterval = setInterval(() => {
            loadWalkingDashboard();
        }, 5 * 60 * 1000); // 5 minutos
    }
});

// ========================================
// EXPORTAR FUNCIONES GLOBALES
// ========================================
window.showSyncOptions = showSyncOptions;
window.hideSyncOptions = hideSyncOptions;
window.showManualEntry = showManualEntry;
window.hideManualEntry = hideManualEntry;
