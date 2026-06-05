// ========================================
// DAILY HABITS TRACKER - FASE 2
// ========================================
// Sistema de registro de hábitos diarios:
// - Hidratación (vasos de agua)
// - Nutrición (calidad de alimentos)
// - Actividad física (pasos y caminata continua)
// - Wellness Score (puntuación de bienestar)

// ========================================
// CONSTANTES DE HÁBITOS
// ========================================
const HABITS_CONSTANTS = {
    HYDRATION_GOAL: 8, // vasos de agua

    NUTRITION_TYPES: {
        nutritivo: {
            label: 'Nutritivo',
            emoji: '🍎',
            score: 30,
            color: '#10b981'
        },
        balanceado: {
            label: 'Balanceado',
            emoji: '🥗',
            score: 25,
            color: '#3b82f6'
        },
        antojo: {
            label: 'Antojo',
            emoji: '🍔',
            score: 10,
            color: '#f59e0b'
        }
    },

    WELLNESS_SCORE_WEIGHTS: {
        hydration: 30,      // 30 puntos máximo
        nutrition: 30,      // 30 puntos máximo
        steps: 30,          // 30 puntos máximo
        continuous_walk: 10 // 10 puntos máximo
    }
};

// ========================================
// CALCULAR WELLNESS SCORE
// ========================================
function calculateWellnessScore(habitsData, stepGoal) {
    let score = 0;

    // Puntos por hidratación (0-30)
    if (habitsData.hydration && habitsData.hydration.glasses_count) {
        const hydrationScore = Math.min(
            (habitsData.hydration.glasses_count / HABITS_CONSTANTS.HYDRATION_GOAL) * 30,
            30
        );
        score += hydrationScore;
    }

    // Puntos por nutrición (0-30)
    if (habitsData.nutrition && habitsData.nutrition.quality) {
        const nutritionType = HABITS_CONSTANTS.NUTRITION_TYPES[habitsData.nutrition.quality];
        if (nutritionType) {
            score += nutritionType.score;
        }
    }

    // Puntos por pasos (0-30)
    if (habitsData.physical_activity && habitsData.physical_activity.steps_count) {
        const stepsScore = Math.min(
            (habitsData.physical_activity.steps_count / stepGoal) * 30,
            30
        );
        score += stepsScore;
    }

    // Puntos por caminata continua (0-10)
    if (habitsData.physical_activity && habitsData.physical_activity.continuous_walk_15min) {
        score += 10;
    }

    return Math.round(score);
}

// ========================================
// GUARDAR HÁBITOS DEL DÍA
// ========================================
async function saveDailyHabits(habitsData) {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        // Obtener perfil de salud para meta de pasos
        const profileResult = await window.healthProfile.getHealthProfile();
        const stepGoal = profileResult.profile?.macrocycle?.daily_step_goal || 7000;

        // Calcular wellness score
        const wellnessScore = calculateWellnessScore(habitsData, stepGoal);

        // Verificar cumplimiento de fase
        const phaseCompliance = habitsData.physical_activity?.steps_count >= stepGoal;

        const today = new Date().toISOString().split('T')[0];

        // Verificar si ya existe registro para hoy
        const existingQuery = await db.collection('daily_habits')
            .where('userId', '==', user.uid)
            .where('date', '==', today)
            .get();

        const habitRecord = {
            userId: user.uid,
            email: user.email,
            date: today,
            hydration: {
                glasses_count: habitsData.hydration?.glasses_count || 0,
                goal_met: (habitsData.hydration?.glasses_count || 0) >= HABITS_CONSTANTS.HYDRATION_GOAL
            },
            nutrition: {
                quality: habitsData.nutrition?.quality || '',
                emoji: HABITS_CONSTANTS.NUTRITION_TYPES[habitsData.nutrition?.quality]?.emoji || '',
                notes: habitsData.nutrition?.notes || ''
            },
            physical_activity: {
                steps_count: habitsData.physical_activity?.steps_count || 0,
                continuous_walk_15min: habitsData.physical_activity?.continuous_walk_15min || false,
                duration_mins: habitsData.physical_activity?.duration_mins || 0,
                source: habitsData.physical_activity?.source || 'Manual'
            },
            wellness_score: wellnessScore,
            phase_compliance: phaseCompliance,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Actualizar o crear registro
        if (!existingQuery.empty) {
            // Actualizar registro existente
            const docId = existingQuery.docs[0].id;
            await db.collection('daily_habits').doc(docId).update(habitRecord);
            console.log('✅ Hábitos actualizados para hoy');
        } else {
            // Crear nuevo registro
            await db.collection('daily_habits').add(habitRecord);
            console.log('✅ Hábitos guardados para hoy');
        }

        return { success: true, wellnessScore: wellnessScore };

    } catch (error) {
        console.error('❌ Error al guardar hábitos:', error);
        return { success: false, error: error.message };
    }
}

// ========================================
// OBTENER HÁBITOS DEL DÍA
// ========================================
async function getTodayHabits() {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        const today = new Date().toISOString().split('T')[0];

        const snapshot = await db.collection('daily_habits')
            .where('userId', '==', user.uid)
            .where('date', '==', today)
            .get();

        if (snapshot.empty) {
            return {
                exists: false,
                habits: {
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
                }
            };
        }

        const habitData = snapshot.docs[0].data();
        return { exists: true, habits: habitData };

    } catch (error) {
        console.error('❌ Error al obtener hábitos del día:', error);
        return { exists: false, habits: null, error: error.message };
    }
}

// ========================================
// OBTENER HISTORIAL DE HÁBITOS
// ========================================
async function getHabitsHistory(days = 30) {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        const cutoffString = cutoffDate.toISOString().split('T')[0];

        const snapshot = await db.collection('daily_habits')
            .where('userId', '==', user.uid)
            .where('date', '>=', cutoffString)
            .orderBy('date', 'desc')
            .get();

        const history = [];
        snapshot.forEach(doc => {
            history.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return history;

    } catch (error) {
        console.error('❌ Error al obtener historial de hábitos:', error);
        return [];
    }
}

// ========================================
// ACTUALIZAR HIDRATACIÓN
// ========================================
async function updateHydration(glassesCount) {
    try {
        const todayHabits = await getTodayHabits();

        const updatedHabits = {
            ...todayHabits.habits,
            hydration: {
                glasses_count: glassesCount,
                goal_met: glassesCount >= HABITS_CONSTANTS.HYDRATION_GOAL
            }
        };

        return await saveDailyHabits(updatedHabits);

    } catch (error) {
        console.error('❌ Error al actualizar hidratación:', error);
        return { success: false, error: error.message };
    }
}

// ========================================
// ACTUALIZAR NUTRICIÓN
// ========================================
async function updateNutrition(quality, notes = '') {
    try {
        const todayHabits = await getTodayHabits();

        const updatedHabits = {
            ...todayHabits.habits,
            nutrition: {
                quality: quality,
                emoji: HABITS_CONSTANTS.NUTRITION_TYPES[quality]?.emoji || '',
                notes: notes
            }
        };

        return await saveDailyHabits(updatedHabits);

    } catch (error) {
        console.error('❌ Error al actualizar nutrición:', error);
        return { success: false, error: error.message };
    }
}

// ========================================
// ACTUALIZAR ACTIVIDAD FÍSICA
// ========================================
async function updatePhysicalActivity(activityData) {
    try {
        const todayHabits = await getTodayHabits();

        const updatedHabits = {
            ...todayHabits.habits,
            physical_activity: {
                steps_count: activityData.steps_count || 0,
                continuous_walk_15min: activityData.continuous_walk_15min || false,
                duration_mins: activityData.duration_mins || 0,
                source: activityData.source || 'Manual'
            }
        };

        return await saveDailyHabits(updatedHabits);

    } catch (error) {
        console.error('❌ Error al actualizar actividad física:', error);
        return { success: false, error: error.message };
    }
}

// ========================================
// CALCULAR ESTADÍSTICAS DE HÁBITOS
// ========================================
async function calculateHabitsStats(days = 30) {
    try {
        const history = await getHabitsHistory(days);

        if (history.length === 0) {
            return {
                avgWellnessScore: 0,
                avgHydration: 0,
                daysWithGoal: 0,
                continuousWalkDays: 0,
                nutritionBreakdown: {
                    nutritivo: 0,
                    balanceado: 0,
                    antojo: 0
                },
                totalDays: 0
            };
        }

        let totalWellnessScore = 0;
        let totalHydration = 0;
        let daysWithGoal = 0;
        let continuousWalkDays = 0;
        const nutritionBreakdown = {
            nutritivo: 0,
            balanceado: 0,
            antojo: 0
        };

        history.forEach(day => {
            totalWellnessScore += day.wellness_score || 0;
            totalHydration += day.hydration?.glasses_count || 0;

            if (day.hydration?.goal_met) daysWithGoal++;
            if (day.physical_activity?.continuous_walk_15min) continuousWalkDays++;

            const quality = day.nutrition?.quality;
            if (quality && nutritionBreakdown.hasOwnProperty(quality)) {
                nutritionBreakdown[quality]++;
            }
        });

        return {
            avgWellnessScore: Math.round(totalWellnessScore / history.length),
            avgHydration: Math.round((totalHydration / history.length) * 10) / 10,
            daysWithGoal: daysWithGoal,
            continuousWalkDays: continuousWalkDays,
            nutritionBreakdown: nutritionBreakdown,
            totalDays: history.length
        };

    } catch (error) {
        console.error('❌ Error al calcular estadísticas:', error);
        return null;
    }
}

// ========================================
// SINCRONIZAR CON WALKING TRACKER
// ========================================
async function syncWithWalkingTracker() {
    try {
        // Obtener datos del walking tracker de hoy
        const user = auth.currentUser;
        if (!user) return;

        const userDoc = await db.collection('users').doc(user.uid).get();
        const userEmail = userDoc.data()?.email || user.email;

        const today = new Date().toISOString().split('T')[0];

        // Buscar sesión de caminata de hoy
        const walkingSnapshot = await db.collection('walking_stats')
            .where('collaboratorEmail', '==', userEmail)
            .where('date', '==', today)
            .orderBy('timestamp', 'desc')
            .limit(1)
            .get();

        if (!walkingSnapshot.empty) {
            const walkingData = walkingSnapshot.docs[0].data();

            // Actualizar actividad física con datos del walking tracker
            await updatePhysicalActivity({
                steps_count: walkingData.metrics.steps,
                continuous_walk_15min: walkingData.is_continuous,
                duration_mins: walkingData.metrics.duration_mins,
                source: walkingData.source
            });

            console.log('✅ Sincronizado con walking tracker');
            return { success: true };
        }

        return { success: false, message: 'No hay datos de caminata para hoy' };

    } catch (error) {
        console.error('❌ Error al sincronizar con walking tracker:', error);
        return { success: false, error: error.message };
    }
}

// ========================================
// EXPORTAR FUNCIONES
// ========================================
window.dailyHabits = {
    calculateWellnessScore,
    saveDailyHabits,
    getTodayHabits,
    getHabitsHistory,
    updateHydration,
    updateNutrition,
    updatePhysicalActivity,
    calculateHabitsStats,
    syncWithWalkingTracker,
    HABITS_CONSTANTS
};
