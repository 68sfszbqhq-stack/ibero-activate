// Node.js Script - Inicialización de Sistema de Periodización
// Ejecutar con: npm run init-periodization

const admin = require('firebase-admin');
const path = require('path');

// Importar datos de periodización
const PERIODIZATION_DATA = {
    programName: "Macrociclo IBERO ACTÍVATE",
    totalWeeks: 19,
    startDate: "2026-01-13", // ⚠️ CAMBIAR A FECHA REAL DE INICIO (debe ser lunes)

    phases: [
        {
            phaseId: 1,
            name: "Reconexión y Adaptación",
            nomenclatura: "Mesociclo Introductorio",
            weekRange: [1, 3],
            objetivoDominante: "Social-Cardiovascular",
            intensidad: "Baja",
            colorTheme: "#10b981",
            icon: "fa-heart-pulse",
            justificacionCientifica: "**Principio de sobrecarga progresiva aplicado.** La transición de inactividad a actividad regular requiere un período de habituación neuromuscular y cardiovascular (Bompa & Buzzichelli, 2019).\n\n**Adaptaciones fisiológicas tempranas:** En las primeras 2-3 semanas, el cuerpo experimenta principalmente adaptaciones neurales (mejora en la coordinación intermuscular) antes que adaptaciones estructurales (hipertrofia o capacidad aeróbica).\n\n**Componente social como motivador:** La evidencia muestra que las intervenciones con componente social tienen 25% mayor adherencia en las primeras semanas (Carron et al., 1988).",
            objetivosFase: [
                "Establecer hábito de asistencia regular",
                "Crear vínculos sociales entre participantes",
                "Evaluación basal de condición física",
                "Familiarización con rutinas de ejercicio"
            ],
            metricsTarget: {
                intensidadFC: "50-60% FCmáx",
                volumen: "30min/sesión",
                cargaSocial: "Alta",
                participacionObjetivo: "80%+"
            }
        },
        {
            phaseId: 2,
            name: "Construcción de Base Física y Lúdica",
            nomenclatura: "Mesociclo de Desarrollo de Capacidades Coordinativas",
            weekRange: [4, 7],
            objetivoDominante: "Físico-Coordinativo",
            intensidad: "Moderada",
            colorTheme: "#3b82f6",
            icon: "fa-person-running",
            justificacionCientifica: "**Desarrollo de capacidades coordinativas.** Este mesociclo aprovecha la neuroplasticidad para mejorar patrones de movimiento complejos. Los juegos y actividades lúdicas activan áreas cognitivas superiores (corteza prefrontal) mientras mantienen engagement alto.\n\n**Periodización ondulante no lineal:** Se introducen estímulos variados (caminatas, baile, juegos) para evitar adaptación específica prematura y mantener motivación (Rhea et al., 2002).\n\n**Incremento gradual de carga:** El volumen aumenta ~15% respecto a fase anterior, respetando regla del 10% semanal para prevenir lesiones por sobreuso.",
            objetivosFase: [
                "Mejorar coordinación y agilidad",
                "Aumentar volumen de actividad progresivamente",
                "Incorporar variedad de estímulos motores",
                "Fortalecer musculatura estabilizadora"
            ],
            metricsTarget: {
                intensidadFC: "60-70% FCmáx",
                volumen: "40min/sesión",
                especificidad: "Media",
                cargaSocial: "Media-Alta"
            }
        },
        {
            phaseId: 3,
            name: "Intensificación Cognitiva y Estratégica",
            nomenclatura: "Mesociclo de Complejidad Creciente",
            weekRange: [8, 11],
            objetivoDominante: "Cognitivo-Estratégico",
            intensidad: "Moderada-Alta",
            colorTheme: "#8b5cf6",
            icon: "fa-brain",
            justificacionCientifica: "**Entrenamiento cognitivo dual-task.** Actividades que combinan demanda física y cognitiva (deportes de estrategia) mejoran función ejecutiva y memoria de trabajo (Ludyga et al., 2016).\n\n**Semana 9 - Microciclo de descarga:** Aplicación del principio de supercompensación. Tras 6 semanas de carga acumulada, se programa una semana de volumen reducido (-30%) para permitir adaptación completa y prevenir fatiga acumulada.\n\n**Especificidad progresiva:** Se introducen actividades más complejas que requieren toma de decisiones rápidas, anticipación y planificación táctica.",
            objetivosFase: [
                "Desarrollar toma de decisiones bajo presión física",
                "Mejorar capacidad de anticipación y reacción",
                "Integrar aprendizaje motor complejo",
                "Consolidar adaptaciones de fases anteriores (semana 9)"
            ],
            metricsTarget: {
                intensidadCognitiva: "Alta",
                cargaEstrategica: "Media-Alta",
                intensidadFC: "65-75% FCmáx",
                periodizacion: "Microciclo descarga S9"
            }
        },
        {
            phaseId: 4,
            name: "Pico de Rendimiento",
            nomenclatura: "Mesociclo de Máxima Intensidad y Competencia",
            weekRange: [12, 14],
            objetivoDominante: "Competitivo-Integrativo",
            intensidad: "Alta",
            colorTheme: "#ef4444",
            icon: "fa-trophy",
            justificacionCientifica: "**Fase de realización.** Después de 11 semanas de preparación, el organismo está en condiciones óptimas para rendir al máximo. Se aplican actividades de alta demanda física y cognitiva integradas.\n\n**Competencia interna (Fantasma Blitz):** El componente competitivo activa sistema de recompensa dopaminérgico, aumentando motivación intrínseca y esfuerzo percibido (Dishman et al., 2021).\n\n**Tapering inverso próximo:** Las siguientes semanas reducirán carga para evitar sobrentrenamiento y permitir recuperación antes de consolidación final.",
            objetivosFase: [
                "Alcanzar rendimiento máximo individual y grupal",
                "Evaluar transferencia de aprendizajes",
                "Fomentar competencia sana y espíritu de equipo",
                "Identificar mejoras en métricas de condición física"
            ],
            metricsTarget: {
                intensidad: "75-85% FCmáx",
                volumen: "45min/sesión",
                cargaSocial: "Muy Alta",
                enfoque: "Competencia controlada"
            }
        },
        {
            phaseId: 5,
            name: "Consolidación y Autonomía",
            nomenclatura: "Mesociclo de Tapering y Transferencia",
            weekRange: [15, 19],
            objetivoDominante: "Autonomía y Mantenimiento",
            intensidad: "Moderada-Baja",
            colorTheme: "#f59e0b",
            icon: "fa-graduation-cap",
            justificacionCientifica: "**Tapering (reducción de carga).** Similar a preparación pre-competencia en deporte, se reduce volumen e intensidad (~20-30%) para permitir supercompensación completa sin pérdida de adaptaciones (Mujika & Padilla, 2003).\n\n**Enfoque en adherencia post-programa:** Se enseñan estrategias de auto-regulación y planificación de actividad física independiente. El objetivo es transformar participación guiada en hábito autónomo sostenible.\n\n**Evaluación sumativa:** Comparación de métricas iniciales (Semana 1-2) vs finales (Semana 18-19) para cuantificar impacto del programa según framework RE-AIM.",
            objetivosFase: [
                "Reducir carga para permitir recuperación completa",
                "Desarrollar capacidad de auto-gestión del ejercicio",
                "Evaluar resultados finales del programa",
                "Planificar mantenimiento post-programa",
                "Celebrar logros y reforzar identidad activa"
            ],
            metricsTarget: {
                intensidad: "55-65% FCmáx",
                volumen: "35min/sesión (tapering)",
                autonomia: "Alta",
                enfoque: "Autonomía y reflexión"
            }
        }
    ],

    weeklySchedule: [
        { week: 1, phase: 1, activity: "Caminatas Reflexivas", objetivo: "Social-Cardiovascular", intensidad: "Baja" },
        { week: 2, phase: 1, activity: "Círculos de Movimiento", objetivo: "Social-Coordinativo", intensidad: "Baja" },
        { week: 3, phase: 1, activity: "Juegos de Integración", objetivo: "Social-Lúdico", intensidad: "Baja-Moderada" },
        { week: 4, phase: 2, activity: "Baile Social", objetivo: "Físico-Coordinativo", intensidad: "Moderada" },
        { week: 5, phase: 2, activity: "Circuitos Funcionales Básicos", objetivo: "Físico-Fuerza", intensidad: "Moderada" },
        { week: 6, phase: 2, activity: "Yoga Activo", objetivo: "Físico-Flexibilidad", intensidad: "Moderada" },
        { week: 7, phase: 2, activity: "Juegos Cooperativos", objetivo: "Físico-Social", intensidad: "Moderada" },
        { week: 8, phase: 3, activity: "Kickball Estratégico", objetivo: "Cognitivo-Estratégico", intensidad: "Moderada-Alta" },
        { week: 9, phase: 3, activity: "Caminata Mindful (Descarga)", objetivo: "Recuperación Activa", intensidad: "Baja" },
        { week: 10, phase: 3, activity: "Básquetbol", objetivo: "Cognitivo-Táctico", intensidad: "Moderada-Alta" },
        { week: 11, phase: 3, activity: "Ultimate Frisbee", objetivo: "Cognitivo-Estratégico", intensidad: "Moderada-Alta" },
        { week: 12, phase: 4, activity: "Fantasma Blitz", objetivo: "Competitivo-Integral", intensidad: "Alta" },
        { week: 13, phase: 4, activity: "Torneo Interno (Deporte Elegido)", objetivo: "Competitivo-Social", intensidad: "Alta" },
        { week: 14, phase: 4, activity: "Competencia de Equipos", objetivo: "Competitivo-Cooperativo", intensidad: "Alta" },
        { week: 15, phase: 5, activity: "Sesión de Fortalecimiento", objetivo: "Mantenimiento-Fuerza", intensidad: "Moderada" },
        { week: 16, phase: 5, activity: "Caminata Autónoma Grupal", objetivo: "Autonomía-Cardiovascular", intensidad: "Moderada-Baja" },
        { week: 17, phase: 5, activity: "Taller de Planificación Personal", objetivo: "Autonomía-Educación", intensidad: "Baja" },
        { week: 18, phase: 5, activity: "Sesión de Evaluación Final", objetivo: "Evaluación-Reflexión", intensidad: "Baja-Moderada" },
        { week: 19, phase: 5, activity: "Celebración y Cierre", objetivo: "Social-Celebración", intensidad: "Baja" }
    ],

    principiosCientificos: [
        "Periodización: Organización sistemática del entrenamiento en ciclos",
        "Sobrecarga Progresiva: Incremento gradual de demanda física y cognitiva",
        "Especificidad Progresiva: De actividades generales a específicas y complejas",
        "Recuperación Planificada: Inclusión de microciclos de descarga (Semana 9)",
        "Variabilidad Controlada: Diferentes estímulos para evitar adaptación prematura",
        "Tapering: Reducción de carga final para consolidar adaptaciones"
    ],

    sistemaEvaluacion: {
        framework: "RE-AIM (Reach, Effectiveness, Adoption, Implementation, Maintenance)",
        metricas: {
            Reach: "% de empleados participantes del total elegible",
            Effectiveness: "Mejoras en: condición física, bienestar psicológico, cohesión social",
            Adoption: "Tasa de asistencia semanal, adherencia al programa",
            Implementation: "Fidelidad al protocolo de periodización, cumplimiento de intensidades",
            Maintenance: "% de participantes que continúan activos 3-6 meses post-programa"
        }
    }
};

// Inicializar Firebase Admin
function initializeFirebase() {
    try {
        // Intentar cargar service account
        const serviceAccount = require('./firebase-service-account.json');

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });

        console.log('✅ Firebase Admin inicializado correctamente');
        return admin.firestore();
    } catch (error) {
        console.error('❌ Error al inicializar Firebase Admin:');
        console.error('   Asegúrate de tener el archivo firebase-service-account.json en la carpeta scripts/');
        console.error('   Descárgalo desde: Firebase Console > Project Settings > Service Accounts');
        throw error;
    }
}

// Función principal
async function initializePeriodization() {
    console.log('\n🚀 Iniciando sistema de periodización...\n');

    try {
        const db = initializeFirebase();

        // Validar fecha de inicio
        const startDate = new Date(PERIODIZATION_DATA.startDate);
        if (isNaN(startDate.getTime())) {
            throw new Error('❌ Fecha de inicio inválida. Usa formato YYYY-MM-DD');
        }

        // Verificar que sea lunes
        if (startDate.getDay() !== 1) {
            console.warn('⚠️  ADVERTENCIA: La fecha de inicio no es lunes.');
            console.warn(`   Fecha seleccionada: ${startDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`);
            console.warn('   Se recomienda que el programa inicie un lunes.\n');
        }

        console.log(`📅 Fecha de inicio: ${startDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`);
        console.log(`📊 Total de semanas: ${PERIODIZATION_DATA.totalWeeks}`);
        console.log(`🎯 Total de fases: ${PERIODIZATION_DATA.phases.length}\n`);

        // Guardar en Firestore
        console.log('💾 Guardando en Firestore...');

        await db.collection('program_periodization')
            .doc('current_macrocycle')
            .set(PERIODIZATION_DATA);

        console.log('\n✅ ¡Sistema de periodización inicializado correctamente!\n');

        // Mostrar resumen
        console.log('📋 Resumen de fases:');
        PERIODIZATION_DATA.phases.forEach(phase => {
            console.log(`   ${phase.phaseId}. ${phase.name} (Semanas ${phase.weekRange[0]}-${phase.weekRange[1]})`);
        });

        console.log('\n✨ Próximos pasos:');
        console.log('   1. Abre admin/program-overview.html para ver el programa completo');
        console.log('   2. Verifica que el dashboard muestra el card de progreso');
        console.log('   3. Revisa que el calendario muestra el banner de fase actual\n');

        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error durante la inicialización:');
        console.error(error.message);
        process.exit(1);
    }
}

// Ejecutar
initializePeriodization();
