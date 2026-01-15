// IBERO ACTÍVATE - Datos del Sistema de Periodización Científica (19 Semanas)

const PERIODIZATION_DATA = {
    programName: "IBERO ACTÍVATE - Macrociclo de Bienestar Integral",
    totalWeeks: 19,
    // Fecha de inicio debe configurarse manualmente según el semestre
    defaultStartDate: "2026-01-12", // Ejemplo: Lunes del inicio del semestre

    phases: [
        {
            phaseId: 1,
            name: "Reconexión y Diagnóstico",
            nomenclatura: "Mesociclo de Adaptación Socioemocional",
            weekRange: [1, 3],
            objetivoDominante: "Social-Cardiovascular",
            intensidad: "Baja-Moderada",
            colorTheme: "#10b981", // green-500
            icon: "fa-heart-pulse",

            justificacionCientifica: `Las caminatas combinadas con conversación reflexiva son una intervención ideal para iniciar el programa porque activan simultáneamente tres sistemas:

**Beneficios fisiológicos documentados:** Las caminatas regulares reducen la presión arterial, fortalecen la función cardíaca, mejoran los perfiles lipídicos, reducen grasa corporal y preservan masa muscular.

**Beneficios neurocognitivos:** El ejercicio aeróbico ligero como la caminata aumenta el flujo sanguíneo cerebral, estimulando la neurogénesis en el hipocampo y mejorando la función cognitiva.

**Beneficios sociales:** La integración de preguntas reflexivas genera "conversaciones de alta calidad", que fortalecen vínculos interpersonales, aumentan la confianza grupal y establecen sentido de pertenencia.`,

            objetivosFase: [
                "Establecer línea base de bienestar (cuestionario diagnóstico)",
                "Generar compromiso inicial (30-40% participación sostenida)",
                "Crear seguridad psicológica mediante diálogo abierto",
                "Activación cardiovascular suave y progresiva"
            ],

            metricsTarget: {
                intensidadFC: "50-65% FCmáx",
                volumen: "15 min/sesión, 2-3 sesiones/semana",
                cargaSocial: "Alta (enfoque en conexión interpersonal)",
                participacionObjetivo: "30-40%"
            },

            actividadesRecomendadas: [
                "Caminatas Activas y Reflexivas con Tarjetas Somos"
            ]
        },

        {
            phaseId: 2,
            name: "Construcción de Base Física y Lúdica",
            nomenclatura: "Mesociclo de Desarrollo de Capacidades Coordinativas",
            weekRange: [4, 7],
            objetivoDominante: "Físico-Coordinativo",
            intensidad: "Moderada",
            colorTheme: "#3b82f6", // blue-500
            icon: "fa-running",

            justificacionCientifica: `Esta fase implementa una periodización ondulatoria, alternando entre actividades cognitivas (juegos de mesa) y físicas (deportes adaptados). Este enfoque previene la monotonía y trabaja diferentes sistemas adaptativos.

**Dominó:** Los juegos de mesa estimulan memoria, atención, pensamiento lógico-matemático y creatividad. La evidencia muestra que actividades de mesa mejoran la agilidad mental y ralentizan el deterioro cognitivo.

**Bádminton y Voleibol:** Desarrollan coordinación óculo-manual, agilidad y reflejos, actividad cardiovascular moderada, y trabajo en equipo. La implementación de deportes de raqueta en espacios laborales está respaldada por estudios que muestran mejoras en coordinación y reducción de estrés.`,

            objetivosFase: [
                "Incrementar frecuencia cardíaca de forma controlada (60-75% FCmáx)",
                "Desarrollar capacidades coordinativas básicas",
                "Alternar carga física/cognitiva para optimizar recuperación",
                "Aumentar participación (objetivo: 50-60%)"
            ],

            metricsTarget: {
                intensidadFC: "60-75% FCmáx",
                volumen: "15-20 min/sesión (creciente progresivamente)",
                especificidad: "Desarrollo de habilidades motrices generales",
                participacionObjetivo: "50-60%"
            },

            actividadesRecomendadas: [
                "Dominó Doble 12 - Tren Mexicano",
                "Bádminton Portátil",
                "Mini Voleibol",
                "Taco Gato Cabra Queso Pizza"
            ]
        },

        {
            phaseId: 3,
            name: "Intensificación y Diferenciación",
            nomenclatura: "Mesociclo de Especialización Cognitivo-Social",
            weekRange: [8, 11],
            objetivoDominante: "Cognitivo-Estratégico",
            intensidad: "Alta (cognitiva), Variable (física)",
            colorTheme: "#8b5cf6", // violet-500
            icon: "fa-brain",

            justificacionCientifica: `Esta fase aumenta la complejidad cognitiva y la demanda estratégica, características del principio de sobrecarga progresiva aplicado al dominio cognitivo.

**Mario Party + That's Not a Hat:** Los videojuegos cooperativos mejoran cohesión grupal y habilidades de trabajo en equipo. La normalización del error en contextos lúdicos reduce ansiedad y promueve resiliencia.

**Tarjetas "Somos" (Semana 9):** Estratégicamente ubicada como microciclo de recuperación socioemocional. Permite consolidar vínculos, procesamiento emocional de experiencias compartidas, y recuperación de fatiga de decisión.

**Ping Pong Adaptado:** Facilita inclusión, promueve pensamiento creativo organizacional, y mantiene beneficios cardiovasculares y coordinativos.`,

            objetivosFase: [
                "Maximizar complejidad estratégica y cognitiva",
                "Integrar recuperación socioemocional planificada (Semana 9)",
                "Fomentar creatividad e innovación",
                "Participación sostenida (55-65%)"
            ],

            metricsTarget: {
                intensidadCognitiva: "Alta",
                cargaEstrategica: "Máxima",
                periodizacion: "Ondulatoria con microciclo de descarga en Semana 9",
                participacionObjetivo: "55-65%"
            },

            actividadesRecomendadas: [
                "Mario Party + That's Not a Hat",
                "Tarjetas Somos (retorno en Semana 9)",
                "Exploding Kittens",
                "Ping Pong con Tablas de Oficina"
            ]
        },

        {
            phaseId: 4,
            name: "Pico de Rendimiento y Velocidad Cognitiva",
            nomenclatura: "Mesociclo de Máxima Demanda Neurocognitiva",
            weekRange: [12, 14],
            objetivoDominante: "Neurocognitivo",
            intensidad: "Máxima",
            colorTheme: "#ef4444", // red-500
            icon: "fa-bolt",

            justificacionCientifica: `**Fantasma Blitz** representa el pico de demanda neurocognitiva del programa: velocidad de procesamiento máxima, atención selectiva extrema, inhibición de respuestas automáticas, y flexibilidad cognitiva.

La investigación en neurociencia cognitiva muestra que actividades que requieren inhibición de respuestas prepotentes fortalecen la corteza prefrontal dorsolateral, mejorando control atencional y función ejecutiva.

**Semana 13 - Transición a Activación Física:** Después del pico cognitivo, implementar pausas activas estructuradas permite descarga cognitiva mediante actividad física moderada-alta, elevación de frecuencia cardíaca, liberación de endorfinas post-estrés cognitivo.`,

            objetivosFase: [
                "Alcanzar pico de rendimiento neurocognitivo",
                "Demostrar capacidades desarrolladas en fases previas",
                "Integrar descarga física estratégica",
                "Mantener participación (60-70%)"
            ],

            metricsTarget: {
                intensidadCognitiva: "Máxima (Semana 12)",
                transicion: "Cognitiva a Física (Semana 13)",
                volumen: "Sesiones más frecuentes (3-4/semana)",
                participacionObjetivo: "60-70%"
            },

            actividadesRecomendadas: [
                "Fantasma Blitz",
                "Pausas Activas - Ritmo Cardiaco (AF-03)",
                "Spot It (Dobble)"
            ]
        },

        {
            phaseId: 5,
            name: "Consolidación y Autonomía",
            nomenclatura: "Mesociclo de Transición y Mantenimiento",
            weekRange: [15, 19],
            objetivoDominante: "Autonomía y Recuperación",
            intensidad: "Decreciente (Tapering)",
            colorTheme: "#f59e0b", // amber-500
            icon: "fa-spa",

            justificacionCientifica: `**Tapering fisiológico y cognitivo:** Las semanas 15-19 implementan reducción progresiva de intensidad (40-60% de carga), permitiendo consolidación de adaptaciones, prevención de burnout, y transición hacia autonomía.

**Técnicas de relajación y recuperación:** Meditación guiada reduce cortisol y mejora regulación emocional. Estiramientos funcionales mejoran rango de movimiento. Yoga en silla combina beneficios de estiramiento, respiración y mindfulness.

**Entrenamiento de campeones:** La literatura sobre implementación de programas de bienestar muestra que formar facilitadores internos es crítico para sostenibilidad.

**Diario de gratitud:** Activa áreas cerebrales de recompensa (núcleo accumbens), aumenta dopamina y serotonina, fortalece vías neuronales positivas.`,

            objetivosFase: [
                "Reducir intensidad progresivamente (tapering)",
                "Transferir conocimientos a participantes",
                "Preparar siguiente ciclo",
                "Medir impacto del programa (evaluación post-intervención)"
            ],

            metricsTarget: {
                intensidad: "Decreciente (40-60% de carga)",
                autonomia: "Creciente",
                enfoque: "Recuperación, reflexión, y transferencia",
                participacionObjetivo: "Sostenida"
            },

            actividadesRecomendadas: [
                "Semana 15: Mario Party + Everybody 1-2 Switch (Celebración)",
                "Semana 16: Dominó Doble 12 (retorno actividad conocida)",
                "Semana 17: Meditación Guiada (RC-02), Estiramientos (RC-03), Yoga en Silla (RC-06)",
                "Semana 18: Actividades autogestionadas (Fichero AF)",
                "Semana 19: Diario de Gratitud (CR-02), Círculo de Agradecimientos (RC-01)"
            ]
        }
    ],

    // Calendario detallado semana por semana
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
        { week: 18, phase: 5, activity: "Actividades Autogestionadas (AF)", objetivo: "Transferencia", intensidad: "Baja-Mod" },
        { week: 19, phase: 5, activity: "Gratitud + Círculo Agradecimientos", objetivo: "Reflexivo-Proyectivo", intensidad: "Baja" }
    ],

    // Principios científicos aplicados
    principiosCientificos: [
        {
            nombre: "Variación Estratégica",
            descripcion: "Alternancia entre actividades físicas, cognitivas y sociales cada 1-2 semanas, previniendo monotonía."
        },
        {
            nombre: "Sobrecarga Progresiva",
            descripcion: "Incremento de complejidad cognitiva (de Dominó a Fantasma Blitz) y demanda física (de caminatas a bádminton)."
        },
        {
            nombre: "Especificidad Progresiva",
            descripcion: "Inicio con actividades generales (caminatas) → actividades específicas (juegos estratégicos complejos)."
        },
        {
            nombre: "Recuperación Planificada",
            descripcion: "Retorno a Tarjetas 'Somos' en Semana 9 como microciclo de descarga, y fase de tapering final (Semanas 16-19)."
        },
        {
            nombre: "Marco RE-AIM",
            descripcion: "Evaluación de intervenciones de bienestar: Reach (alcance), Effectiveness (efectividad), Adoption (adopción), Implementation (implementación), Maintenance (mantenimiento)."
        }
    ],

    // Sistema de evaluación
    sistemaEvaluacion: {
        cuantitativas: [
            "Asistencia: Tracking de participantes por sesión",
            "Satisfacción: Escala 1-5 en formularios semanales",
            "Datos biométricos: Distancia caminada, calorías quemadas",
            "Participación por área: Mapeo de departamentos"
        ],
        cualitativas: [
            "Retroalimentación abierta: '¿Qué te gustó más?'",
            "Sugerencias de mejora: Captura continua",
            "Percepción de impacto: '¿Cómo describes tu nivel de energía?'"
        ],
        prePost: [
            "Cuestionario diagnóstico inicial: Identifica necesidades, riesgos, preferencias",
            "Cuestionario de seguimiento: Mide percepción de mejora en bienestar"
        ]
    }
};

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PERIODIZATION_DATA;
}
