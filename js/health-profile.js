// ========================================
// HEALTH PROFILE MANAGER - FASE 2
// ========================================
// Sistema de gestión de perfiles de salud biométrica
// Incluye cálculo de IMC, riesgo cardiovascular y macrociclo

// ========================================
// CONSTANTES DE SALUD
// ========================================
const HEALTH_CONSTANTS = {
    BMI_CATEGORIES: {
        UNDERWEIGHT: { min: 0, max: 18.4, label: 'Bajo Peso', color: '#3b82f6', risk: 'Medio' },
        NORMAL: { min: 18.5, max: 24.9, label: 'Normal', color: '#10b981', risk: 'Bajo' },
        OVERWEIGHT: { min: 25, max: 29.9, label: 'Sobrepeso', color: '#f59e0b', risk: 'Medio' },
        OBESE_I: { min: 30, max: 34.9, label: 'Obesidad I', color: '#ef4444', risk: 'Alto' },
        OBESE_II: { min: 35, max: 100, label: 'Obesidad II+', color: '#991b1b', risk: 'Muy Alto' }
    },

    MACROCYCLE_PHASES: {
        1: {
            name: 'Adaptación Anatómica',
            weeks: [1, 2, 3, 4, 5],
            stepGoal: 3000,
            habitPriority: 'Hidratación (8 vasos)',
            description: 'Preparar articulaciones y sistema cardiovascular',
            icon: '🌱'
        },
        2: {
            name: 'Base de Resistencia',
            weeks: [6, 7, 8, 9, 10],
            stepGoal: 4500,
            habitPriority: 'Caminata continua >15 min',
            description: 'Desarrollar capacidad aeróbica',
            icon: '💪'
        },
        3: {
            name: 'Intensificación',
            weeks: [11, 12, 13, 14, 15],
            stepGoal: 6000,
            habitPriority: 'Nutrición Balanceada',
            description: 'Mejorar composición corporal',
            icon: '🔥'
        },
        4: {
            name: 'Consolidación',
            weeks: [16, 17, 18, 19],
            stepGoal: 7000,
            habitPriority: 'Meta Final 7K Club',
            description: 'Mantenimiento óptimo de salud',
            icon: '🏆'
        }
    }
};

// ========================================
// CALCULAR IMC
// ========================================
function calculateBMI(weightKg, heightCm) {
    if (!weightKg || !heightCm || weightKg <= 0 || heightCm <= 0) {
        return null;
    }

    const heightM = heightCm / 100;
    const bmi = weightKg / (heightM * heightM);

    return {
        value: parseFloat(bmi.toFixed(1)),
        category: getBMICategory(bmi),
        color: getBMIColor(bmi),
        risk: getBMIRisk(bmi)
    };
}

function getBMICategory(bmi) {
    for (const [key, range] of Object.entries(HEALTH_CONSTANTS.BMI_CATEGORIES)) {
        if (bmi >= range.min && bmi <= range.max) {
            return range.label;
        }
    }
    return 'Desconocido';
}

function getBMIColor(bmi) {
    for (const [key, range] of Object.entries(HEALTH_CONSTANTS.BMI_CATEGORIES)) {
        if (bmi >= range.min && bmi <= range.max) {
            return range.color;
        }
    }
    return '#6b7280';
}

function getBMIRisk(bmi) {
    for (const [key, range] of Object.entries(HEALTH_CONSTANTS.BMI_CATEGORIES)) {
        if (bmi >= range.min && bmi <= range.max) {
            return range.risk;
        }
    }
    return 'Desconocido';
}

// ========================================
// CALCULAR RANGO DE PESO IDEAL
// ========================================
function calculateIdealWeightRange(heightCm) {
    if (!heightCm || heightCm <= 0) {
        return null;
    }

    const heightM = heightCm / 100;

    // IMC saludable: 18.5 - 24.9
    const minWeight = 18.5 * (heightM * heightM);
    const maxWeight = 24.9 * (heightM * heightM);

    return {
        min: Math.round(minWeight * 10) / 10,
        max: Math.round(maxWeight * 10) / 10
    };
}

// ========================================
// CALCULAR RIESGO CARDIOVASCULAR
// ========================================
function calculateCardiovascularRisk(profile) {
    let riskScore = 0;

    // Factores de riesgo por condiciones médicas
    if (profile.medical_conditions.diabetes) riskScore += 3;
    if (profile.medical_conditions.hypertension) riskScore += 3;
    if (profile.medical_conditions.heart_disease) riskScore += 4;

    // Factor de riesgo por IMC
    const bmi = profile.computed_metrics?.bmi_value || 0;
    if (bmi >= 30) riskScore += 2;
    else if (bmi >= 25) riskScore += 1;

    // Factor de riesgo por edad
    const age = profile.biometrics?.age || 0;
    if (age >= 60) riskScore += 2;
    else if (age >= 45) riskScore += 1;

    // Clasificación de riesgo
    if (riskScore >= 6) return 'Alto';
    if (riskScore >= 3) return 'Medio';
    return 'Bajo';
}

// ========================================
// CALCULAR EDAD
// ========================================
function calculateAge(birthDate) {
    if (!birthDate) return null;

    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    return age;
}

// ========================================
// CALCULAR FASE ACTUAL DEL MACROCICLO
// ========================================
function calculateCurrentPhase(startDate) {
    if (!startDate) {
        return {
            phase: 1,
            currentWeek: 1,
            stepGoal: 3000,
            habitPriority: 'Hidratación (8 vasos)',
            phaseName: 'Adaptación Anatómica',
            icon: '🌱',
            description: 'Preparar articulaciones y sistema cardiovascular',
            daysInPhase: 0,
            totalDays: 0,
            progress: 0
        };
    }

    const today = new Date();
    const start = new Date(startDate);
    const diffTime = Math.abs(today - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const currentWeek = Math.min(Math.ceil(diffDays / 7), 19);

    // Determinar fase actual
    let phase = 1;
    for (const [phaseNum, phaseData] of Object.entries(HEALTH_CONSTANTS.MACROCYCLE_PHASES)) {
        if (phaseData.weeks.includes(currentWeek)) {
            phase = parseInt(phaseNum);
            break;
        }
    }

    const phaseData = HEALTH_CONSTANTS.MACROCYCLE_PHASES[phase];
    const daysInPhase = diffDays - ((phaseData.weeks[0] - 1) * 7);
    const totalPhaseDays = phaseData.weeks.length * 7;
    const progress = Math.min((daysInPhase / totalPhaseDays) * 100, 100);

    return {
        phase: phase,
        currentWeek: currentWeek,
        stepGoal: phaseData.stepGoal,
        habitPriority: phaseData.habitPriority,
        phaseName: phaseData.name,
        icon: phaseData.icon,
        description: phaseData.description,
        daysInPhase: daysInPhase,
        totalDays: diffDays,
        progress: Math.round(progress)
    };
}

// ========================================
// CREAR PERFIL DE SALUD
// ========================================
async function createHealthProfile(profileData) {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        // Calcular edad
        const age = calculateAge(profileData.birth_date);

        // Calcular IMC
        const bmiData = calculateBMI(
            profileData.weight_initial,
            profileData.height_cm
        );

        // Calcular rango de peso ideal
        const idealWeightRange = calculateIdealWeightRange(profileData.height_cm);

        // Preparar datos del perfil
        const healthProfile = {
            userId: user.uid,
            email: user.email,
            biometrics: {
                gender: profileData.gender,
                height_cm: parseFloat(profileData.height_cm),
                weight_initial: parseFloat(profileData.weight_initial),
                current_weight: parseFloat(profileData.weight_initial),
                birth_date: profileData.birth_date,
                blood_type: profileData.blood_type || '',
                age: age
            },
            medical_conditions: {
                diabetes: profileData.diabetes || false,
                hypertension: profileData.hypertension || false,
                asthma: profileData.asthma || false,
                back_injury: profileData.back_injury || false,
                heart_disease: profileData.heart_disease || false,
                other: profileData.other_conditions || ''
            },
            computed_metrics: {
                bmi_value: bmiData.value,
                bmi_category: bmiData.category,
                cardiovascular_risk: 'Bajo', // Se calculará después
                ideal_weight_range: idealWeightRange
            },
            macrocycle: {
                start_date: firebase.firestore.FieldValue.serverTimestamp(),
                current_phase: 1,
                current_week: 1,
                daily_step_goal: 3000,
                phase_name: 'Adaptación Anatómica'
            },
            status: 'active',
            created_at: firebase.firestore.FieldValue.serverTimestamp(),
            updated_at: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Calcular riesgo cardiovascular
        healthProfile.computed_metrics.cardiovascular_risk = calculateCardiovascularRisk(healthProfile);

        // Guardar en Firestore
        await db.collection('health_profiles').doc(user.uid).set(healthProfile);

        // Crear primer registro de peso
        await addWeightRecord(
            profileData.weight_initial,
            'Peso inicial del programa'
        );

        console.log('✅ Perfil de salud creado exitosamente');
        return { success: true, profile: healthProfile };

    } catch (error) {
        console.error('❌ Error al crear perfil de salud:', error);
        return { success: false, error: error.message };
    }
}

// ========================================
// OBTENER PERFIL DE SALUD
// ========================================
async function getHealthProfile(userId = null) {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        const targetUserId = userId || user.uid;
        const profileDoc = await db.collection('health_profiles').doc(targetUserId).get();

        if (!profileDoc.exists) {
            return { exists: false, profile: null };
        }

        const profile = profileDoc.data();

        // Actualizar fase del macrociclo si es necesario
        if (profile.macrocycle && profile.macrocycle.start_date) {
            const currentPhase = calculateCurrentPhase(profile.macrocycle.start_date.toDate());
            profile.macrocycle.current_phase = currentPhase.phase;
            profile.macrocycle.current_week = currentPhase.currentWeek;
            profile.macrocycle.daily_step_goal = currentPhase.stepGoal;
            profile.macrocycle.phase_name = currentPhase.phaseName;
            profile.macrocycle.phase_data = currentPhase;
        }

        return { exists: true, profile: profile };

    } catch (error) {
        console.error('❌ Error al obtener perfil de salud:', error);
        return { exists: false, profile: null, error: error.message };
    }
}

// ========================================
// ACTUALIZAR PESO
// ========================================
async function updateWeight(newWeight, notes = '') {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        // Obtener perfil actual
        const profileRef = db.collection('health_profiles').doc(user.uid);
        const profileDoc = await profileRef.get();

        if (!profileDoc.exists) {
            throw new Error('Perfil de salud no encontrado');
        }

        const profile = profileDoc.data();

        // Calcular nuevo IMC
        const bmiData = calculateBMI(newWeight, profile.biometrics.height_cm);

        // Actualizar perfil
        await profileRef.update({
            'biometrics.current_weight': parseFloat(newWeight),
            'computed_metrics.bmi_value': bmiData.value,
            'computed_metrics.bmi_category': bmiData.category,
            'updated_at': firebase.firestore.FieldValue.serverTimestamp()
        });

        // Agregar registro de peso
        await addWeightRecord(newWeight, notes);

        console.log('✅ Peso actualizado exitosamente');
        return { success: true, bmi: bmiData };

    } catch (error) {
        console.error('❌ Error al actualizar peso:', error);
        return { success: false, error: error.message };
    }
}

// ========================================
// AGREGAR REGISTRO DE PESO
// ========================================
async function addWeightRecord(weight, notes = '') {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        // Obtener perfil para calcular IMC
        const profileDoc = await db.collection('health_profiles').doc(user.uid).get();
        if (!profileDoc.exists) {
            throw new Error('Perfil de salud no encontrado');
        }

        const profile = profileDoc.data();
        const bmiData = calculateBMI(weight, profile.biometrics.height_cm);

        const today = new Date().toISOString().split('T')[0];

        const weightRecord = {
            userId: user.uid,
            email: user.email,
            date: today,
            weight_kg: parseFloat(weight),
            bmi_value: bmiData.value,
            bmi_category: bmiData.category,
            notes: notes,
            measurement_type: 'manual',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('weight_history').add(weightRecord);

        console.log('✅ Registro de peso agregado');
        return { success: true };

    } catch (error) {
        console.error('❌ Error al agregar registro de peso:', error);
        return { success: false, error: error.message };
    }
}

// ========================================
// OBTENER HISTORIAL DE PESO
// ========================================
async function getWeightHistory(userId = null, limit = 30) {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        const targetUserId = userId || user.uid;

        const snapshot = await db.collection('weight_history')
            .where('userId', '==', targetUserId)
            .orderBy('timestamp', 'desc')
            .limit(limit)
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
        console.error('❌ Error al obtener historial de peso:', error);
        return [];
    }
}

// ========================================
// VERIFICAR SI NECESITA ONBOARDING
// ========================================
async function needsHealthOnboarding() {
    try {
        const user = auth.currentUser;
        if (!user) return true;

        const profileDoc = await db.collection('health_profiles').doc(user.uid).get();
        return !profileDoc.exists || profileDoc.data().status === 'onboarding_pending';

    } catch (error) {
        console.error('❌ Error al verificar onboarding:', error);
        return true;
    }
}

// ========================================
// EXPORTAR FUNCIONES
// ========================================
window.healthProfile = {
    calculateBMI,
    calculateIdealWeightRange,
    calculateCardiovascularRisk,
    calculateAge,
    calculateCurrentPhase,
    createHealthProfile,
    getHealthProfile,
    updateWeight,
    addWeightRecord,
    getWeightHistory,
    needsHealthOnboarding,
    HEALTH_CONSTANTS
};
