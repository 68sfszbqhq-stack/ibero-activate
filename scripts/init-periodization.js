// Script para inicializar el sistema de periodización en Firestore
// Ejecutar una sola vez al inicio del semestre

const PERIODIZATION_DATA = {
    programName: "IBERO ACTÍVATE - Macrociclo de Bienestar Integral",
    totalWeeks: 19,
    // IMPORTANTE: Configurar esta fecha al inicio real del programa
    startDate: "2026-01-12", // Formato: YYYY-MM-DD (Lunes de inicio)

    phases: [
        {
            phaseId: 1,
            name: "Reconexión y Diagnóstico",
            nomenclatura: "Mesociclo de Adaptación Socioemocional",
            weekRange: [1, 3],
            objetivoDominante: "Social-Cardiovascular",
            intensidad: "Baja-Moderada",
            colorTheme: "#10b981",
            icon: "fa-heart-pulse",

            justificacionCientifica: "Las caminatas combinadas con conversación reflexiva son una intervención ideal para iniciar el programa porque activan simultáneamente tres sistemas:\n\n**Beneficios fisiológicos documentados:** Las caminatas regulares reducen la presión arterial, fortalecen la función cardíaca, mejoran los perfiles lipídicos, reducen grasa corporal y preservan masa muscular.\n\n**Beneficios neurocognitivos:** El ejercicio aeróbico ligero como la caminata aumenta el flujo sanguíneo cerebral, estimulando la neurogénesis en el hipocampo y mejorando la función cognitiva.\n\n**Beneficios sociales:** La integración de preguntas reflexivas genera \"conversaciones de alta calidad\", que fortalecen vínculos interpersonales, aumentan la confianza grupal y establecen sentido de pertenencia.",

            objetivosFase: [
                "Establecer línea base de bienestar (cuestionario diagnóstico)",
                "Generar compromiso inicial (30-40% participación sostenida)",
                "Crear seguridad psicológica mediante diálogo abierto",
                "Activación cardiovascular suave y progresiva"
            ],

            metricsTarget: {
                intensidadFC: "50-65% FCmáx",
                volumen: "15 min/sesión, 2-3 sesiones/semana",
                cargaSocial: "Alta",
                participacionObjetivo: "30-40%"
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
            icon: "fa-running",

            justificacionCientifica: "Esta fase implementa una periodización ondulatoria, alternando entre actividades cognitivas (juegos de mesa) y físicas (deportes adaptados). Este enfoque previene la monotonía y trabaja diferentes sistemas adaptativos.\n\n**Dominó:** Los juegos de mesa estimulan memoria, atención, pensamiento lógico-matemático y creatividad.\n\n**Bádminton y Voleibol:** Desarrollan coordinación óculo-manual, agilidad y reflejos, actividad cardiovascular moderada, y trabajo en equipo.",

            objetivosFase: [
                "Incrementar frecuencia cardíaca de forma controlada (60-75% FCmáx)",
                "Desarrollar capacidades coordinativas básicas",
                "Alternar carga física/cognitiva para optimizar recuperación",
                "Aumentar participación (objetivo: 50-60%)"
            ],

            metricsTarget: {
                intensidadFC: "60-75% FCmáx",
                volumen: "15-20 min/sesión",
                especificidad: "Desarrollo de habilidades motrices generales",
                participacionObjetivo: "50-60%"
            }
        },

        {
            phaseId: 3,
            name: "Intensificación y Diferenciación",
            nomenclatura: "Mesociclo de Especialización Cognitivo-Social",
            weekRange: [8, 11],
            objetivoDominante: "Cognitivo-Estratégico",
            intensidad: "Alta (cognitiva), Variable (física)",
            colorTheme: "#8b5cf6",
            icon: "fa-brain",

            justificacionCientifica: "Esta fase aumenta la complejidad cognitiva y la demanda estratégica, características del principio de sobrecarga progresiva aplicado al dominio cognitivo.\n\n**Videojuegos cooperativos** mejoran cohesión grupal y habilidades de trabajo en equipo.\n\n**Tarjetas 'Somos' (Semana 9):** Microciclo de recuperación socioemocional estratégicamente ubicado.",

            objetivosFase: [
                "Maximizar complejidad estratégica y cognitiva",
                "Integrar recuperación socioemocional planificada (Semana 9)",
                "Fomentar creatividad e innovación",
                "Participación sostenida (55-65%)"
            ],

            metricsTarget: {
                intensidadCognitiva: "Alta",
                cargaEstrategica: "Máxima",
                periodizacion: "Ondulatoria con descarga en Semana 9",
                participacionObjetivo: "55-65%"
            }
        },

        {
            phaseId: 4,
            name: "Pico de Rendimiento y Velocidad Cognitiva",
            nomenclatura: "Mesociclo de Máxima Demanda Neurocognitiva",
            weekRange: [12, 14],
            objetivoDominante: "Neurocognitivo",
            intensidad: "Máxima",
            colorTheme: "#ef4444",
            icon: "fa-bolt",

            justificacionCientifica: "**Fantasma Blitz** representa el pico de demanda neurocognitiva: velocidad de procesamiento máxima, atención selectiva extrema, inhibición de respuestas automáticas.\n\nActividades que requieren inhibición de respuestas prepotentes fortalecen la corteza prefrontal dorsolateral, mejorando control atencional y función ejecutiva.",

            objetivosFase: [
                "Alcanzar pico de rendimiento neurocognitivo",
                "Demostrar capacidades desarrolladas en fases previas",
                "Integrar descarga física estratégica",
                "Mantener participación (60-70%)"
            ],

            metricsTarget: {
                intensidadCognitiva: "Máxima",
                volumen: "Sesiones más frecuentes (3-4/semana)",
                participacionObjetivo: "60-70%"
            }
        },

        {
            phaseId: 5,
            name: "Consolidación y Autonomía",
            nomenclatura: "Mesociclo de Transición y Mantenimiento",
            weekRange: [15, 19],
            objetivoDominante: "Autonomía y Recuperación",
            intensidad: "Decreciente (Tapering)",
            colorTheme: "#f59e0b",
            icon: "fa-spa",

            justificacionCientifica: "**Tapering fisiológico y cognitivo:** Reducción progresiva de intensidad (40-60% de carga), permitiendo consolidación de adaptaciones.\n\n**Técnicas de relajación:** Meditación reduce cortisol. Yoga combina estiramiento, respiración y mindfulness.\n\n**Diario de gratitud:** Activa áreas cerebrales de recompensa, aumenta dopamina y serotonina.",

            objetivosFase: [
                "Reducir intensidad progresivamente (tapering)",
                "Transferir conocimientos a participantes",
                "Preparar siguiente ciclo",
                "Medir impacto del programa"
            ],

            metricsTarget: {
                intensidad: "Decreciente (40-60% carga)",
                autonomia: "Creciente",
                enfoque: "Recuperación y transferencia",
                participacionObjetivo: "Sostenida"
            }
        }
    ],

    weeklySchedule: [
        { week: 1, phase: 1, activity: "Caminatas Reflexivas + Tarjetas Somos", objetivo: "Social-Cardiovascular", intensidad: "Baja-Mod" },
        { week: 2, phase: 1, activity: "Caminatas Reflexivas + Tarjetas Somos", objetivo: "Social-Cardiovascular", intensidad: "Baja-Mod" },
        { week: 3, phase: 1, activity: "Caminatas Reflexivas + Tarjetas Somos", objetivo: "Social-Cardiovascular", intensidad: "Baja-Mod" },
        { week: 4, phase: 2, activity: "Dominó Doble 12", objetivo: "Cognitivo", intensidad: "Moderada" },
        { week: 5, phase: 2, activity: "Bádminton Portátil", objetivo: "Físico-Coordinativo", intensidad: "Moderada" },
        { week: 6, phase: 2, activity: "Mini Voleibol", objetivo: "Físico-Social", intensidad: "Moderada" },
        { week: 7, phase: 2, activity: "Taco Gato Cabra Queso", objetivo: "Cognitivo-Reflejos", intensidad: "Moderada" },
        { week: 8, phase: 3, activity: "Mario Party + That's Not a Hat", objetivo: "Social-Estratégico", intensidad: "Alta" },
        { week: 9, phase: 3, activity: "Tarjetas 'Somos'", objetivo: "Socioemocional", intensidad: "Baja" },
        { week: 10, phase: 3, activity: "Exploding Kittens", objetivo: "Estratégico-Riesgo", intensidad: "Alta" },
        { week: 11, phase: 3, activity: "Ping Pong Tablas", objetivo: "Físico-Creativo", intensidad: "Moderada-Alta" },
        { week: 12, phase: 4, activity: "Fantasma Blitz", objetivo: "Neurocognitivo Máximo", intensidad: "Máxima" },
        { week: 13, phase: 4, activity: "AF-03 Ritmo Cardiaco", objetivo: "Físico-Cardiovascular", intensidad: "Alta" },
        { week: 14, phase: 4, activity: "Spot It (Dobble)", objetivo: "Cognitivo-Velocidad", intensidad: "Moderada-Alta" },
        { week: 15, phase: 5, activity: "Mario Party + Everybody 1-2", objetivo: "Social-Celebratorio", intensidad: "Moderada" },
        { week: 16, phase: 5, activity: "Dominó Doble 12", objetivo: "Cognitivo Familiar", intensidad: "Moderada" },
        { week: 17, phase: 5, activity: "Meditación + Yoga + Estiramientos", objetivo: "Recuperación-Mindfulness", intensidad: "Baja" },
        { week: 18, phase: 5, activity: "Actividades Autogestionadas", objetivo: "Transferencia", intensidad: "Baja-Mod" },
        { week: 19, phase: 5, activity: "Gratitud + Círculo Agradecimientos", objetivo: "Reflexivo-Proyectivo", intensidad: "Baja" }
    ],

    createdAt: null, // Se establecerá con serverTimestamp
    updatedAt: null
};

console.log("====================================");
console.log("  INICIALIZACIÓN DEL SISTEMA DE    ");
console.log("  PERIODIZACIÓN - IBERO ACTÍVATE   ");
console.log("====================================\n");

console.log("⚠️  CONFIGURACIÓN IMPORTANTE:");
console.log(`   Fecha de inicio del programa: ${PERIODIZATION_DATA.startDate}`);
console.log("   Por favor, actualiza esta fecha según el inicio real del semestre.\n");

console.log("Este script creará el documento 'current_macrocycle' en Firestore.");
console.log("Ejecuta este código en la consola del navegador (con Firebase inicializado):\n");

console.log(`
// Copiar y pegar en la consola del navegador:

const periodizationData = ${JSON.stringify(PERIODIZATION_DATA, null, 2)};

// Agregar timestamps
periodizationData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
periodizationData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();

// Guardar en Firestore
db.collection('program_periodization')
  .doc('current_macrocycle')
  .set(periodizationData)
  .then(() => {
    console.log('✅ Sistema de periodización inicializado correctamente');
    console.log('📊 Macrociclo:', periodizationData.programName);
    console.log('📅 Fecha de inicio:', periodizationData.startDate);
    console.log('🔢 Total de semanas:', periodizationData.totalWeeks);
    console.log('🎯 Fases configuradas:', periodizationData.phases.length);
  })
  .catch((error) => {
    console.error('❌ Error al inicializar:', error);
  });
`);

console.log("\n====================================");
console.log("Después de ejecutar, verifica en:");
console.log("Firebase Console > Firestore > program_periodization");
console.log("====================================");
