// ========================================
// HEALTH INSIGHTS - IA PERSONALIZADA
// ========================================
// Sistema de generación de recomendaciones personalizadas
// basadas en perfil de salud, hábitos diarios y macrociclo

// ========================================
// TIPOS DE INSIGHTS
// ========================================
const INSIGHT_TYPES = {
    SUCCESS: {
        icon: '🎉',
        color: '#10b981',
        priority: 1
    },
    WARNING: {
        icon: '⚠️',
        color: '#f59e0b',
        priority: 2
    },
    INFO: {
        icon: 'ℹ️',
        color: '#3b82f6',
        priority: 3
    },
    MEDICAL: {
        icon: '🏥',
        color: '#ef4444',
        priority: 4
    },
    MOTIVATION: {
        icon: '💪',
        color: '#8b5cf6',
        priority: 5
    }
};

// ========================================
// GENERAR INSIGHTS PERSONALIZADOS
// ========================================
async function generateHealthInsights() {
    try {
        const insights = [];

        // Obtener datos del usuario
        const profileResult = await window.healthProfile.getHealthProfile();
        const todayHabits = await window.dailyHabits.getTodayHabits();

        if (!profileResult.exists) {
            return [{
                type: 'INFO',
                icon: INSIGHT_TYPES.INFO.icon,
                color: INSIGHT_TYPES.INFO.color,
                title: 'Completa tu Perfil de Salud',
                message: 'Para recibir recomendaciones personalizadas, completa tu perfil de salud.',
                priority: 1
            }];
        }

        const profile = profileResult.profile;
        const habits = todayHabits.habits;

        // ========================================
        // INSIGHTS MÉDICOS (Prioridad Alta)
        // ========================================

        // Hipertensión
        if (profile.medical_conditions.hypertension) {
            insights.push({
                type: 'MEDICAL',
                icon: INSIGHT_TYPES.MEDICAL.icon,
                color: INSIGHT_TYPES.MEDICAL.color,
                title: 'Precaución: Hipertensión',
                message: 'Mantén un paso moderado y evita esfuerzos bruscos. Consulta a tu médico antes de aumentar la intensidad.',
                priority: INSIGHT_TYPES.MEDICAL.priority
            });
        }

        // Diabetes
        if (profile.medical_conditions.diabetes) {
            insights.push({
                type: 'MEDICAL',
                icon: INSIGHT_TYPES.MEDICAL.icon,
                color: INSIGHT_TYPES.MEDICAL.color,
                title: 'Precaución: Diabetes',
                message: 'Monitorea tu glucosa antes y después del ejercicio. La actividad física mejora la sensibilidad a la insulina.',
                priority: INSIGHT_TYPES.MEDICAL.priority
            });
        }

        // Asma
        if (profile.medical_conditions.asthma) {
            insights.push({
                type: 'MEDICAL',
                icon: INSIGHT_TYPES.MEDICAL.icon,
                color: INSIGHT_TYPES.MEDICAL.color,
                title: 'Precaución: Asma',
                message: 'Ten tu inhalador a mano. Evita ejercicio intenso en días de alta contaminación o frío extremo.',
                priority: INSIGHT_TYPES.MEDICAL.priority
            });
        }

        // Lesión de espalda
        if (profile.medical_conditions.back_injury) {
            insights.push({
                type: 'WARNING',
                icon: INSIGHT_TYPES.WARNING.icon,
                color: INSIGHT_TYPES.WARNING.color,
                title: 'Cuidado con tu Espalda',
                message: 'Mantén una postura erguida al caminar. Evita cargar peso excesivo. Consulta a un fisioterapeuta si hay dolor.',
                priority: INSIGHT_TYPES.WARNING.priority
            });
        }

        // ========================================
        // INSIGHTS DE IMC
        // ========================================

        const bmi = profile.computed_metrics.bmi_value;
        const bmiCategory = profile.computed_metrics.bmi_category;

        if (bmiCategory === 'Obesidad I' || bmiCategory === 'Obesidad II+') {
            const idealRange = profile.computed_metrics.ideal_weight_range;
            insights.push({
                type: 'INFO',
                icon: '💪',
                color: INSIGHT_TYPES.INFO.color,
                title: `IMC: ${bmi} (${bmiCategory})`,
                message: `Tu peso ideal está entre ${idealRange.min}-${idealRange.max} kg. ¡Cada paso cuenta! Meta hoy: ${profile.macrocycle.daily_step_goal} pasos.`,
                priority: INSIGHT_TYPES.INFO.priority
            });
        } else if (bmiCategory === 'Sobrepeso') {
            insights.push({
                type: 'WARNING',
                icon: INSIGHT_TYPES.WARNING.icon,
                color: INSIGHT_TYPES.WARNING.color,
                title: `IMC: ${bmi} (${bmiCategory})`,
                message: 'Estás cerca de tu peso ideal. Mantén la constancia en tus caminatas y cuida tu alimentación.',
                priority: INSIGHT_TYPES.WARNING.priority
            });
        } else if (bmiCategory === 'Normal') {
            insights.push({
                type: 'SUCCESS',
                icon: INSIGHT_TYPES.SUCCESS.icon,
                color: INSIGHT_TYPES.SUCCESS.color,
                title: `IMC: ${bmi} (${bmiCategory})`,
                message: '¡Excelente! Mantén tu peso saludable con actividad física regular.',
                priority: INSIGHT_TYPES.SUCCESS.priority
            });
        }

        // ========================================
        // INSIGHTS DE CAMINATA CONTINUA
        // ========================================

        if (habits.physical_activity?.continuous_walk_15min) {
            insights.push({
                type: 'SUCCESS',
                icon: INSIGHT_TYPES.SUCCESS.icon,
                color: INSIGHT_TYPES.SUCCESS.color,
                title: '¡Caminata Continua Lograda!',
                message: `Tus ${habits.physical_activity.duration_mins} minutos de caminata continua reducen tu riesgo metabólico y mejoran tu salud cardiovascular.`,
                priority: INSIGHT_TYPES.SUCCESS.priority
            });
        }

        // ========================================
        // INSIGHTS DE HIDRATACIÓN
        // ========================================

        const glassesCount = habits.hydration?.glasses_count || 0;

        if (glassesCount >= 8) {
            insights.push({
                type: 'SUCCESS',
                icon: '💧',
                color: INSIGHT_TYPES.SUCCESS.color,
                title: '¡Excelente Hidratación!',
                message: `${glassesCount} vasos de agua. Esto mejora tu rendimiento físico y función cognitiva.`,
                priority: INSIGHT_TYPES.SUCCESS.priority
            });
        } else if (glassesCount >= 5) {
            insights.push({
                type: 'WARNING',
                icon: INSIGHT_TYPES.WARNING.icon,
                color: INSIGHT_TYPES.WARNING.color,
                title: 'Hidratación Moderada',
                message: `Llevas ${glassesCount} vasos. Meta: 8 vasos al día. Faltan ${8 - glassesCount} vasos.`,
                priority: INSIGHT_TYPES.WARNING.priority
            });
        } else if (glassesCount > 0) {
            insights.push({
                type: 'WARNING',
                icon: INSIGHT_TYPES.WARNING.icon,
                color: INSIGHT_TYPES.WARNING.color,
                title: 'Necesitas Más Agua',
                message: `Solo ${glassesCount} vasos hoy. La deshidratación reduce tu energía y concentración. ¡Toma más agua!`,
                priority: INSIGHT_TYPES.WARNING.priority
            });
        }

        // ========================================
        // INSIGHTS DE NUTRICIÓN
        // ========================================

        const nutritionQuality = habits.nutrition?.quality;

        if (nutritionQuality === 'nutritivo') {
            insights.push({
                type: 'SUCCESS',
                icon: '🍎',
                color: INSIGHT_TYPES.SUCCESS.color,
                title: 'Nutrición Excelente',
                message: '¡Comida nutritiva! Esto optimiza tu energía y recuperación muscular.',
                priority: INSIGHT_TYPES.SUCCESS.priority
            });
        } else if (nutritionQuality === 'balanceado') {
            insights.push({
                type: 'INFO',
                icon: '🥗',
                color: INSIGHT_TYPES.INFO.color,
                title: 'Nutrición Balanceada',
                message: 'Buena elección. Mantén el equilibrio entre proteínas, carbohidratos y grasas saludables.',
                priority: INSIGHT_TYPES.INFO.priority
            });
        } else if (nutritionQuality === 'antojo') {
            insights.push({
                type: 'WARNING',
                icon: '🍔',
                color: INSIGHT_TYPES.WARNING.color,
                title: 'Antojo del Día',
                message: 'Está bien darse un gusto ocasional. Mañana vuelve a opciones más nutritivas.',
                priority: INSIGHT_TYPES.WARNING.priority
            });
        }

        // ========================================
        // INSIGHTS DEL MACROCICLO
        // ========================================

        if (profile.macrocycle && profile.macrocycle.phase_data) {
            const phaseData = profile.macrocycle.phase_data;
            const progress = phaseData.progress;

            insights.push({
                type: 'INFO',
                icon: phaseData.icon,
                color: INSIGHT_TYPES.INFO.color,
                title: `Fase ${phaseData.phase}: ${phaseData.phaseName}`,
                message: `Semana ${phaseData.currentWeek}/19. Meta: ${phaseData.stepGoal} pasos. Hábito prioritario: ${phaseData.habitPriority}`,
                priority: INSIGHT_TYPES.INFO.priority
            });

            // Motivación según progreso de fase
            if (progress >= 75) {
                insights.push({
                    type: 'MOTIVATION',
                    icon: INSIGHT_TYPES.MOTIVATION.icon,
                    color: INSIGHT_TYPES.MOTIVATION.color,
                    title: '¡Casi Terminas Esta Fase!',
                    message: `${progress}% completado. ¡Sigue así! La próxima fase será más desafiante.`,
                    priority: INSIGHT_TYPES.MOTIVATION.priority
                });
            }
        }

        // ========================================
        // INSIGHTS DE WELLNESS SCORE
        // ========================================

        const wellnessScore = habits.wellness_score || 0;

        if (wellnessScore >= 80) {
            insights.push({
                type: 'SUCCESS',
                icon: '🌟',
                color: INSIGHT_TYPES.SUCCESS.color,
                title: `Wellness Score: ${wellnessScore}/100`,
                message: '¡Día excelente! Estás cuidando muy bien tu salud integral.',
                priority: INSIGHT_TYPES.SUCCESS.priority
            });
        } else if (wellnessScore >= 60) {
            insights.push({
                type: 'INFO',
                icon: 'ℹ️',
                color: INSIGHT_TYPES.INFO.color,
                title: `Wellness Score: ${wellnessScore}/100`,
                message: 'Buen día. Puedes mejorar tu puntuación con más hidratación o actividad física.',
                priority: INSIGHT_TYPES.INFO.priority
            });
        } else if (wellnessScore > 0) {
            insights.push({
                type: 'WARNING',
                icon: INSIGHT_TYPES.WARNING.icon,
                color: INSIGHT_TYPES.WARNING.color,
                title: `Wellness Score: ${wellnessScore}/100`,
                message: 'Hay espacio para mejorar. Enfócate en tu hábito prioritario de la fase actual.',
                priority: INSIGHT_TYPES.WARNING.priority
            });
        }

        // ========================================
        // INSIGHTS DE RIESGO CARDIOVASCULAR
        // ========================================

        const cvRisk = profile.computed_metrics.cardiovascular_risk;

        if (cvRisk === 'Alto') {
            insights.push({
                type: 'MEDICAL',
                icon: '❤️',
                color: INSIGHT_TYPES.MEDICAL.color,
                title: 'Riesgo Cardiovascular Alto',
                message: 'Consulta regularmente a tu médico. La actividad física moderada es clave para reducir este riesgo.',
                priority: INSIGHT_TYPES.MEDICAL.priority
            });
        } else if (cvRisk === 'Medio') {
            insights.push({
                type: 'WARNING',
                icon: '❤️',
                color: INSIGHT_TYPES.WARNING.color,
                title: 'Riesgo Cardiovascular Medio',
                message: 'Mantén hábitos saludables. Cada caminata fortalece tu corazón.',
                priority: INSIGHT_TYPES.WARNING.priority
            });
        }

        // Ordenar por prioridad
        insights.sort((a, b) => a.priority - b.priority);

        return insights;

    } catch (error) {
        console.error('❌ Error al generar insights:', error);
        return [{
            type: 'INFO',
            icon: 'ℹ️',
            color: '#3b82f6',
            title: 'Bienvenido',
            message: 'Completa tu perfil de salud para recibir recomendaciones personalizadas.',
            priority: 1
        }];
    }
}

// ========================================
// GENERAR RECOMENDACIÓN DIARIA
// ========================================
async function getDailyRecommendation() {
    try {
        const profileResult = await window.healthProfile.getHealthProfile();

        if (!profileResult.exists) {
            return {
                title: 'Completa tu Perfil',
                message: 'Ingresa tus datos de salud para recibir recomendaciones personalizadas.',
                action: 'Ir a Perfil de Salud'
            };
        }

        const profile = profileResult.profile;
        const phaseData = profile.macrocycle?.phase_data;

        if (!phaseData) {
            return {
                title: 'Comienza tu Macrociclo',
                message: 'Inicia tu programa "Ruta a los 7K" de 19 semanas.',
                action: 'Comenzar Programa'
            };
        }

        // Recomendación basada en la fase actual
        const recommendations = {
            1: {
                title: '💧 Prioridad: Hidratación',
                message: `Fase de Adaptación Anatómica. Meta: ${phaseData.stepGoal} pasos y 8 vasos de agua al día.`,
                action: 'Registrar Hidratación'
            },
            2: {
                title: '⏱️ Prioridad: Caminata Continua',
                message: `Fase de Base de Resistencia. Meta: ${phaseData.stepGoal} pasos con al menos 15 minutos continuos.`,
                action: 'Iniciar Caminata'
            },
            3: {
                title: '🥗 Prioridad: Nutrición',
                message: `Fase de Intensificación. Meta: ${phaseData.stepGoal} pasos y alimentación balanceada.`,
                action: 'Registrar Comida'
            },
            4: {
                title: '🏆 Meta Final: 7K Club',
                message: `Fase de Consolidación. ¡Alcanza los ${phaseData.stepGoal} pasos diarios!`,
                action: 'Ver Progreso'
            }
        };

        return recommendations[phaseData.phase] || recommendations[1];

    } catch (error) {
        console.error('❌ Error al generar recomendación diaria:', error);
        return {
            title: 'Cuida tu Salud',
            message: 'Mantén hábitos saludables: hidratación, nutrición y actividad física.',
            action: 'Ver Hábitos'
        };
    }
}

// ========================================
// EXPORTAR FUNCIONES
// ========================================
window.healthInsights = {
    generateHealthInsights,
    getDailyRecommendation,
    INSIGHT_TYPES
};
