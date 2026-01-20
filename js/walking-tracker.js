// ========================================
// WALKING TRACKER - Evidence-Based Wellness
// ========================================
// Basado en investigación científica:
// - 7,000 pasos/día = reducción óptima de mortalidad
// - 15+ minutos continuos = beneficio cardiovascular adicional
// - Integración con Google Fit API (gratis)
// - Entrada manual para usuarios iOS

const WALKING_GOALS = {
    DAILY_STEPS: 7000,           // Meta óptima según evidencia
    CONTINUOUS_MINUTES: 15,       // Mínimo para beneficio cardiovascular
    WEEKLY_SESSIONS: 5            // Frecuencia recomendada
};

// ========================================
// GOOGLE FIT API CONFIGURATION
// ========================================
const GOOGLE_FIT_CONFIG = {
    clientId: '', // El usuario debe configurar esto en Google Cloud Console
    scope: 'https://www.googleapis.com/auth/fitness.activity.read',
    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/fitness/v1/rest']
};

// ========================================
// GUARDAR SESIÓN DE CAMINATA
// ========================================
async function saveWalkingSession(sessionData) {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        // Obtener email del colaborador
        const userDoc = await db.collection('users').doc(user.uid).get();
        const userEmail = userDoc.data()?.email || user.email;

        // Validar datos mínimos
        if (!sessionData.steps || sessionData.steps < 0) {
            throw new Error('Número de pasos inválido');
        }

        const today = new Date().toISOString().split('T')[0];

        // Calcular si cumple con el criterio de continuidad
        const isContinuous = (sessionData.duration_mins || 0) >= WALKING_GOALS.CONTINUOUS_MINUTES;

        // Calcular calorías estimadas (si no se proporcionan)
        const calories = sessionData.calories || estimateCalories(
            sessionData.steps,
            sessionData.duration_mins || 0
        );

        const walkingData = {
            collaboratorEmail: userEmail,
            date: today,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            metrics: {
                steps: parseInt(sessionData.steps),
                distance_km: parseFloat(sessionData.distance_km || estimateDistance(sessionData.steps)),
                calories: parseFloat(calories),
                duration_mins: parseInt(sessionData.duration_mins || 0),
                intensity: sessionData.intensity || 'moderate'
            },
            physiological: {
                avg_heart_rate: sessionData.avg_heart_rate || null,
                max_heart_rate: sessionData.max_heart_rate || null
            },
            source: sessionData.source || 'Manual',
            is_continuous: isContinuous,
            meets_goal: parseInt(sessionData.steps) >= WALKING_GOALS.DAILY_STEPS
        };

        // Guardar en Firestore
        const docRef = await db.collection('walking_stats').add(walkingData);

        console.log('✅ Sesión de caminata guardada:', docRef.id);

        // Actualizar estadísticas del usuario
        await updateUserWalkingStats(userEmail, walkingData);

        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('❌ Error al guardar sesión de caminata:', error);
        return { success: false, error: error.message };
    }
}

// ========================================
// ACTUALIZAR ESTADÍSTICAS DEL USUARIO
// ========================================
async function updateUserWalkingStats(email, sessionData) {
    try {
        const statsRef = db.collection('wellness_records').doc(email);
        const statsDoc = await statsRef.get();

        const today = sessionData.date;
        const currentStats = statsDoc.exists ? statsDoc.data() : {};

        // Inicializar estructura si no existe
        if (!currentStats.daily_stats) {
            currentStats.daily_stats = {};
        }

        // Actualizar o crear entrada del día
        currentStats.daily_stats[today] = {
            steps: sessionData.metrics.steps,
            continuous_walk_minutes: sessionData.metrics.duration_mins,
            calories: sessionData.metrics.calories,
            distance_km: sessionData.metrics.distance_km,
            heart_rate_avg: sessionData.physiological.avg_heart_rate,
            source: sessionData.source,
            is_continuous: sessionData.is_continuous,
            meets_goal: sessionData.meets_goal
        };

        // Actualizar badges si alcanza meta
        if (!currentStats.badges) {
            currentStats.badges = [];
        }

        if (sessionData.meets_goal && !currentStats.badges.includes('7k_club')) {
            currentStats.badges.push('7k_club');
        }

        if (sessionData.is_continuous && !currentStats.badges.includes('continuous_walker')) {
            currentStats.badges.push('continuous_walker');
        }

        // Guardar actualización
        await statsRef.set({
            ...currentStats,
            last_sync: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log('✅ Estadísticas de usuario actualizadas');
    } catch (error) {
        console.error('❌ Error al actualizar estadísticas:', error);
    }
}

// ========================================
// OBTENER ESTADÍSTICAS DEL USUARIO
// ========================================
async function getUserWalkingStats(email, days = 30) {
    try {
        const statsDoc = await db.collection('wellness_records').doc(email).get();

        if (!statsDoc.exists) {
            return {
                daily_stats: {},
                badges: [],
                summary: {
                    total_steps: 0,
                    avg_steps: 0,
                    days_with_goal: 0,
                    continuous_sessions: 0
                }
            };
        }

        const data = statsDoc.data();
        const dailyStats = data.daily_stats || {};

        // Calcular resumen
        const summary = calculateWalkingSummary(dailyStats, days);

        return {
            daily_stats: dailyStats,
            badges: data.badges || [],
            summary: summary
        };
    } catch (error) {
        console.error('❌ Error al obtener estadísticas:', error);
        return null;
    }
}

// ========================================
// CALCULAR RESUMEN DE CAMINATAS
// ========================================
function calculateWalkingSummary(dailyStats, days) {
    const today = new Date();
    const cutoffDate = new Date(today.getTime() - (days * 24 * 60 * 60 * 1000));

    let totalSteps = 0;
    let daysWithGoal = 0;
    let continuousSessions = 0;
    let daysCount = 0;

    Object.entries(dailyStats).forEach(([date, stats]) => {
        const statDate = new Date(date);
        if (statDate >= cutoffDate) {
            totalSteps += stats.steps || 0;
            daysCount++;

            if (stats.meets_goal) daysWithGoal++;
            if (stats.is_continuous) continuousSessions++;
        }
    });

    return {
        total_steps: totalSteps,
        avg_steps: daysCount > 0 ? Math.round(totalSteps / daysCount) : 0,
        days_with_goal: daysWithGoal,
        continuous_sessions: continuousSessions,
        days_tracked: daysCount
    };
}

// ========================================
// GOOGLE FIT INTEGRATION
// ========================================
let googleFitAccessToken = null;

// Inicializar Google API Client
function initGoogleFitAPI() {
    // Cargar la librería de Google API
    gapi.load('client:auth2', () => {
        gapi.client.init({
            clientId: GOOGLE_FIT_CONFIG.clientId,
            scope: GOOGLE_FIT_CONFIG.scope,
            discoveryDocs: GOOGLE_FIT_CONFIG.discoveryDocs
        }).then(() => {
            console.log('✅ Google Fit API inicializada');
        }).catch(error => {
            console.error('❌ Error al inicializar Google Fit API:', error);
        });
    });
}

// Autenticar con Google Fit
async function authenticateGoogleFit() {
    try {
        const authInstance = gapi.auth2.getAuthInstance();
        const user = await authInstance.signIn();
        const authResponse = user.getAuthResponse();

        googleFitAccessToken = authResponse.access_token;

        console.log('✅ Autenticado con Google Fit');
        return true;
    } catch (error) {
        console.error('❌ Error al autenticar con Google Fit:', error);
        return false;
    }
}

// Obtener pasos de Google Fit
async function getStepsFromGoogleFit(date = null) {
    try {
        if (!googleFitAccessToken) {
            throw new Error('No autenticado con Google Fit');
        }

        const targetDate = date ? new Date(date) : new Date();
        const startTime = new Date(targetDate.setHours(0, 0, 0, 0)).getTime();
        const endTime = new Date(targetDate.setHours(23, 59, 59, 999)).getTime();

        const response = await gapi.client.fitness.users.dataset.aggregate({
            userId: 'me',
            requestBody: {
                aggregateBy: [{
                    dataTypeName: 'com.google.step_count.delta',
                    dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps'
                }],
                bucketByTime: { durationMillis: 86400000 }, // 1 día
                startTimeMillis: startTime,
                endTimeMillis: endTime
            }
        });

        const data = response.result;
        let totalSteps = 0;

        if (data.bucket && data.bucket.length > 0) {
            data.bucket.forEach(bucket => {
                if (bucket.dataset && bucket.dataset[0] && bucket.dataset[0].point) {
                    bucket.dataset[0].point.forEach(point => {
                        if (point.value && point.value[0]) {
                            totalSteps += point.value[0].intVal || 0;
                        }
                    });
                }
            });
        }

        return totalSteps;
    } catch (error) {
        console.error('❌ Error al obtener pasos de Google Fit:', error);
        return 0;
    }
}

// Sincronizar con Google Fit
async function syncWithGoogleFit() {
    try {
        showLoading('Sincronizando con Google Fit...');

        // Autenticar si no está autenticado
        if (!googleFitAccessToken) {
            const authenticated = await authenticateGoogleFit();
            if (!authenticated) {
                throw new Error('No se pudo autenticar con Google Fit');
            }
        }

        // Obtener pasos del día
        const steps = await getStepsFromGoogleFit();

        if (steps > 0) {
            // Guardar sesión
            const result = await saveWalkingSession({
                steps: steps,
                source: 'GoogleFit',
                duration_mins: 0 // Google Fit no proporciona duración continua
            });

            if (result.success) {
                showToast('✅ Sincronizado: ' + steps + ' pasos', 'success');
                // Recargar estadísticas
                await loadWalkingDashboard();
            } else {
                throw new Error(result.error);
            }
        } else {
            showToast('ℹ️ No se encontraron pasos para hoy', 'info');
        }

        hideLoading();
    } catch (error) {
        console.error('❌ Error al sincronizar con Google Fit:', error);
        hideLoading();
        showToast('❌ Error al sincronizar: ' + error.message, 'error');
    }
}

// ========================================
// ENTRADA MANUAL (iOS / Apple Health)
// ========================================
async function saveManualSteps() {
    try {
        const steps = parseInt(document.getElementById('manual-steps').value);
        const duration = parseInt(document.getElementById('manual-duration').value) || 0;
        const isContinuous = document.getElementById('continuous-walk').checked;

        if (!steps || steps < 0) {
            showToast('❌ Por favor ingresa un número válido de pasos', 'error');
            return;
        }

        showLoading('Guardando...');

        const result = await saveWalkingSession({
            steps: steps,
            duration_mins: isContinuous ? Math.max(duration, WALKING_GOALS.CONTINUOUS_MINUTES) : duration,
            source: 'AppleHealth_Manual'
        });

        if (result.success) {
            showToast('✅ Pasos guardados exitosamente', 'success');

            // Limpiar formulario
            document.getElementById('manual-steps').value = '';
            document.getElementById('manual-duration').value = '';
            document.getElementById('continuous-walk').checked = false;

            // Recargar dashboard
            await loadWalkingDashboard();
        } else {
            throw new Error(result.error);
        }

        hideLoading();
    } catch (error) {
        console.error('❌ Error al guardar pasos manuales:', error);
        hideLoading();
        showToast('❌ Error: ' + error.message, 'error');
    }
}

// ========================================
// UTILIDADES DE CÁLCULO
// ========================================

// Estimar distancia en km basado en pasos
function estimateDistance(steps) {
    // Promedio: 1 km ≈ 1,250 pasos
    return (steps / 1250).toFixed(2);
}

// Estimar calorías quemadas
function estimateCalories(steps, duration_mins) {
    // Fórmula aproximada: 0.04 calorías por paso
    // Ajustado por intensidad si hay duración
    let calories = steps * 0.04;

    if (duration_mins >= WALKING_GOALS.CONTINUOUS_MINUTES) {
        // Bonus por caminata continua (mayor intensidad)
        calories *= 1.2;
    }

    return Math.round(calories);
}

// Obtener mensaje motivacional basado en progreso
function getHealthInsight(currentSteps, goalSteps = WALKING_GOALS.DAILY_STEPS) {
    const percentage = (currentSteps / goalSteps) * 100;

    if (percentage >= 100) {
        return '🎉 ¡Meta alcanzada! Reducción óptima de mortalidad cardiovascular.';
    } else if (percentage >= 75) {
        return `💪 ¡Casi lo logras! Solo ${goalSteps - currentSteps} pasos más.`;
    } else if (percentage >= 50) {
        return `🚶 Vas por buen camino. ${goalSteps - currentSteps} pasos para tu meta.';
    } else if (percentage >= 25) {
        return `⭐ Buen inicio.Cada paso cuenta para tu salud cardiovascular.`;
    } else {
        return `🌟 Comienza hoy. 7,000 pasos reducen tu mortalidad en un 50 - 70 %.`;
    }
}

// ========================================
// CARGAR DASHBOARD DE CAMINATAS
// ========================================
async function loadWalkingDashboard() {
    try {
        const user = auth.currentUser;
        if (!user) return;
        
        const userDoc = await db.collection('users').doc(user.uid).get();
        const userEmail = userDoc.data()?.email || user.email;
        
        // Obtener estadísticas
        const stats = await getUserWalkingStats(userEmail, 30);
        
        if (!stats) {
            console.error('No se pudieron cargar las estadísticas');
            return;
        }
        
        // Actualizar UI
        updateWalkingDashboardUI(stats);
        
    } catch (error) {
        console.error('❌ Error al cargar dashboard:', error);
    }
}

// ========================================
// ACTUALIZAR UI DEL DASHBOARD
// ========================================
function updateWalkingDashboardUI(stats) {
    // Pasos de hoy
    const today = new Date().toISOString().split('T')[0];
    const todayStats = stats.daily_stats[today] || { steps: 0 };
    
    // Actualizar contador de pasos
    const stepsElement = document.getElementById('current-steps');
    if (stepsElement) {
        stepsElement.textContent = todayStats.steps.toLocaleString();
    }
    
    // Actualizar progreso circular
    const progressPercentage = (todayStats.steps / WALKING_GOALS.DAILY_STEPS) * 100;
    const progressCircle = document.getElementById('steps-circle');
    if (progressCircle) {
        progressCircle.style.setProperty('--progress', `${ Math.min(progressPercentage, 100) }% `);
    }
    
    // Actualizar mensaje motivacional
    const healthTip = document.getElementById('health-tip');
    if (healthTip) {
        healthTip.textContent = getHealthInsight(todayStats.steps);
    }
    
    // Actualizar resumen semanal/mensual
    updateSummaryStats(stats.summary);
    
    // Actualizar badges
    updateBadges(stats.badges);
}

// Actualizar estadísticas de resumen
function updateSummaryStats(summary) {
    const elements = {
        'avg-steps': summary.avg_steps.toLocaleString(),
        'days-with-goal': summary.days_with_goal,
        'continuous-sessions': summary.continuous_sessions,
        'total-steps': summary.total_steps.toLocaleString()
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
}

// Actualizar badges
function updateBadges(badges) {
    const badgesContainer = document.getElementById('wellness-badges');
    if (!badgesContainer) return;
    
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
        }
    };
    
    badgesContainer.innerHTML = badges.map(badgeId => {
        const badge = badgeDefinitions[badgeId];
        if (!badge) return '';
        
        return `
            < div class="badge-card" >
                <div class="badge-icon">${badge.icon}</div>
                <div class="badge-title">${badge.title}</div>
                <div class="badge-description">${badge.description}</div>
            </div >
            `;
    }).join('');
}

// ========================================
// HELPERS UI
// ========================================
function showLoading(message = 'Cargando...') {
    // Implementar según tu sistema de UI
    console.log('Loading:', message);
}

function hideLoading() {
    // Implementar según tu sistema de UI
    console.log('Loading complete');
}

function showToast(message, type = 'info') {
    // Implementar según tu sistema de UI
    console.log(`Toast[${ type }]: `, message);
}

// ========================================
// INICIALIZACIÓN
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    // Verificar si estamos en la página de wellness
    if (window.location.pathname.includes('wellness-walking')) {
        loadWalkingDashboard();
    }
});
