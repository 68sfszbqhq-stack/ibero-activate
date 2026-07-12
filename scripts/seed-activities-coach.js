// ============================================================
// LOTE "COACH": Actividades de Team Building y Desarrollo Personal
// ============================================================
// Siembra 18 actividades nuevas en la colección `activities`, con el
// mismo esquema que el catálogo existente. Idempotente: si ya existe
// una actividad con el mismo `activityId`, la actualiza (no duplica).
//
// Uso:
//   node scripts/seed-activities-coach.js --dry-run   (muestra el lote)
//   node scripts/seed-activities-coach.js --execute   (siembra en Firestore)
// ============================================================

const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'pausas-activas-ibero-2026'
});

const db = admin.firestore();
const DRY_RUN = !process.argv.includes('--execute');

// Imágenes reutilizadas del catálogo (garantizadas: ya cargan en la app).
const IMG = [
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=800',
    'https://images.unsplash.com/photo-1521791136064-7986c2920277?q=80&w=800',
    'https://images.unsplash.com/photo-1517842645767-c639042777db?q=80&w=800',
    'https://images.unsplash.com/photo-1526676037777-05a232554f77?q=80&w=800',
    'https://images.unsplash.com/photo-1516147696185-3ba529ef8849?q=80&w=800',
    'https://images.unsplash.com/photo-1500995617113-cf789362a3e1?q=80&w=800',
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=800',
    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=800',
    'https://images.unsplash.com/photo-1483721310020-03333e577078?q=80&w=800',
    'https://images.unsplash.com/photo-1494451930944-8998635c2123?q=80&w=800'
];
const img = (i) => IMG[i % IMG.length];

// ---- TEAM BUILDING (categoría Físicos/Grupal o Mesa) ----
const TEAM_BUILDING = [
    {
        activityId: 'TB-01', categoria: 'Físicos/Grupal', name: 'Nudo Humano',
        objetivo: 'Fortalecer la comunicación y la colaboración resolviendo un reto físico en equipo.',
        duration: 15, materials: 'Ninguno (espacio despejado).',
        emoji: '🪢', type: 'indoor', intensity: 'moderada',
        benefitType: ['Social', 'Físico'],
        specificBenefits: ['Fomenta trabajo en equipo', 'Mejora comunicación', 'Fomenta integración'],
        description: 'El grupo se enreda tomándose de las manos y debe desenredarse sin soltarse.',
        instrucciones: [
            'En círculo, cada persona toma la mano de dos compañeros distintos (no los de al lado).',
            'Sin soltarse en ningún momento, el grupo debe desenredarse hasta formar uno o varios círculos.',
            'Fomenta que se comuniquen y propongan movimientos en voz alta.',
            'Cierre (2 min): ¿qué ayudó a lograrlo?'
        ]
    },
    {
        activityId: 'TB-02', categoria: 'Mesa', name: 'Torre de Malvaviscos',
        objetivo: 'Estimular la creatividad y la planeación colaborativa bajo restricciones.',
        duration: 20, materials: '20 espaguetis, 1 malvavisco, 1 m de cinta y 1 m de hilo por equipo.',
        emoji: '🗼', type: 'indoor', intensity: 'baja',
        benefitType: ['Social', 'Psicológico'],
        specificBenefits: ['Fomenta trabajo en equipo', 'Mejora concentración', 'Fomenta integración'],
        description: 'Equipos construyen la torre más alta que sostenga un malvavisco en la punta.',
        instrucciones: [
            'Forma equipos de 3 a 5 personas y reparte los materiales.',
            'En 18 minutos deben construir la estructura más alta que se sostenga sola con el malvavisco arriba.',
            'No se puede pegar la estructura a la mesa.',
            'Mide las torres y celebra la más alta. Reflexiona sobre prototipar y probar rápido.'
        ]
    },
    {
        activityId: 'TB-03', categoria: 'Físicos/Grupal', name: 'El Lazarillo',
        objetivo: 'Construir confianza y practicar la comunicación clara guiando a un compañero.',
        duration: 15, materials: 'Vendas o antifaces; objetos suaves para un circuito.',
        emoji: '🤝', type: 'indoor', intensity: 'moderada',
        benefitType: ['Social', 'Psicológico'],
        specificBenefits: ['Mejora comunicación', 'Fomenta trabajo en equipo', 'Reduce estrés'],
        description: 'En parejas, uno guía con la voz a su compañero con los ojos vendados por un circuito.',
        instrucciones: [
            'Arma un circuito sencillo con obstáculos suaves.',
            'En parejas: una persona se venda los ojos y la otra la guía SOLO con la voz.',
            'A mitad del recorrido, intercambian roles.',
            'Cierre: ¿qué instrucciones fueron más útiles? ¿cómo se sintió confiar?'
        ]
    },
    {
        activityId: 'TB-04', categoria: 'Mesa', name: 'Cuento en Cadena',
        objetivo: 'Fomentar la escucha activa y la creatividad colectiva.',
        duration: 10, materials: 'Ninguno (opcional: objeto para dar turnos).',
        emoji: '📖', type: 'desk', intensity: 'baja',
        benefitType: ['Social', 'Psicológico'],
        specificBenefits: ['Mejora comunicación', 'Fomenta integración', 'Mejora estado de ánimo'],
        description: 'El grupo construye una historia agregando una frase cada quien por turnos.',
        instrucciones: [
            'En círculo, alguien inicia una historia con una frase.',
            'Cada persona agrega una frase que continúe lo anterior, escuchando con atención.',
            'Da 2 vueltas al círculo y cierra la historia entre todos.',
            'Reflexión: la escucha hace posible construir algo juntos.'
        ]
    },
    {
        activityId: 'TB-05', categoria: 'Físicos/Grupal', name: 'La Isla que se Encoge',
        objetivo: 'Promover la cooperación y la resolución de problemas bajo presión.',
        duration: 15, materials: 'Hojas de periódico o cuerdas para marcar áreas.',
        emoji: '🏝️', type: 'indoor', intensity: 'moderada',
        benefitType: ['Social', 'Físico'],
        specificBenefits: ['Fomenta trabajo en equipo', 'Fomenta integración', 'Activa circulación'],
        description: 'El equipo debe caber en una "isla" que se hace cada vez más pequeña.',
        instrucciones: [
            'Marca un área en el piso donde quepa cómodamente el equipo.',
            'Cada ronda, reduce el área (dobla el periódico o achica la cuerda).',
            'El reto: que TODOS permanezcan dentro sin tocar el "agua".',
            'Cierre: ¿cómo se organizaron para lograrlo juntos?'
        ]
    },
    {
        activityId: 'TB-06', categoria: 'Mesa', name: 'Puente de Papel',
        objetivo: 'Trabajar planeación, roles y prueba de ideas en equipo.',
        duration: 20, materials: '10 hojas de papel y cinta por equipo; un objeto ligero para probar.',
        emoji: '🌉', type: 'indoor', intensity: 'baja',
        benefitType: ['Social', 'Psicológico'],
        specificBenefits: ['Fomenta trabajo en equipo', 'Mejora concentración', 'Mejora comunicación'],
        description: 'Equipos construyen un puente de papel entre dos mesas que soporte un objeto.',
        instrucciones: [
            'Separa dos mesas unos 30 cm y forma equipos.',
            'Con solo papel y cinta, construyan un puente que una las mesas.',
            'Al final, prueben cuánto peso soporta cada puente.',
            'Reflexión: repartir roles y probar temprano mejora el resultado.'
        ]
    },
    {
        activityId: 'TB-07', categoria: 'Mesa', name: 'Dibujo a Ciegas',
        objetivo: 'Evidenciar la importancia de la comunicación precisa y la retroalimentación.',
        duration: 12, materials: 'Hojas, lápices y una imagen simple impresa.',
        emoji: '✏️', type: 'desk', intensity: 'baja',
        benefitType: ['Social', 'Psicológico'],
        specificBenefits: ['Mejora comunicación', 'Fomenta trabajo en equipo', 'Mejora concentración'],
        description: 'En parejas, uno describe una imagen y el otro la dibuja sin verla.',
        instrucciones: [
            'En parejas y espalda con espalda: A tiene una imagen simple, B tiene hoja y lápiz.',
            'A describe la imagen SOLO con palabras; B dibuja lo que entiende (sin ver).',
            'Comparen el dibujo con el original y comenten las diferencias.',
            'Intercambien roles con una nueva imagen.'
        ]
    },
    {
        activityId: 'TB-08', categoria: 'Físicos/Grupal', name: 'Búsqueda Express',
        objetivo: 'Energizar y fomentar la colaboración con un reto de tiempo.',
        duration: 12, materials: 'Lista de objetos/retos preparada por el facilitador.',
        emoji: '🔎', type: 'indoor', intensity: 'moderada',
        benefitType: ['Social', 'Físico'],
        specificBenefits: ['Fomenta integración', 'Aumenta energía', 'Fomenta trabajo en equipo'],
        description: 'Equipos completan una lista de retos u objetos en el menor tiempo posible.',
        instrucciones: [
            'Prepara una lista de 8-10 objetos o mini-retos alcanzables en la oficina.',
            'Forma equipos y entrega la lista al mismo tiempo.',
            'El primer equipo en completarla (o el que más logre en 8 min) gana.',
            'Cierre breve: ¿cómo se repartieron el trabajo?'
        ]
    },
    {
        activityId: 'TB-09', categoria: 'Activación', name: 'Cadena de Ritmo',
        objetivo: 'Sincronizar al grupo y elevar la energía con una dinámica de ritmo.',
        duration: 8, materials: 'Ninguno.',
        emoji: '👏', type: 'indoor', intensity: 'baja',
        benefitType: ['Social', 'Psicológico'],
        specificBenefits: ['Fomenta integración', 'Aumenta energía', 'Mejora estado de ánimo'],
        description: 'El grupo pasa un aplauso o ritmo alrededor del círculo, cada vez más rápido.',
        instrucciones: [
            'En círculo, una persona "pasa" un aplauso al de al lado mirándolo.',
            'El aplauso viaja por el círculo lo más sincronizado posible.',
            'Aumenta la velocidad y agrega variantes (doble aplauso cambia de dirección).',
            'Termina con una ronda a máxima velocidad y un aplauso final grupal.'
        ]
    },
    {
        activityId: 'TB-10', categoria: 'Físicos/Grupal', name: 'Transporta sin Manos',
        objetivo: 'Fomentar coordinación y estrategia colaborativa.',
        duration: 15, materials: 'Una pelota u objeto por equipo.',
        emoji: '⚽', type: 'outdoor', intensity: 'moderada',
        benefitType: ['Social', 'Físico'],
        specificBenefits: ['Fomenta trabajo en equipo', 'Activa circulación', 'Fomenta integración'],
        description: 'El equipo traslada un objeto de un punto a otro sin usar las manos.',
        instrucciones: [
            'Forma equipos en fila y define un punto de salida y meta.',
            'Deben trasladar el objeto entre todos SIN usar las manos (hombro, espalda, etc.).',
            'Si el objeto cae, reinician el tramo.',
            'Reflexión: ¿qué estrategia funcionó mejor?'
        ]
    }
];

// ---- DESARROLLO PERSONAL (categoría Relax) ----
const DESARROLLO_PERSONAL = [
    {
        activityId: 'DP-01', categoria: 'Relax', name: 'Rueda de la Vida Express',
        objetivo: 'Tomar conciencia del equilibrio personal e identificar un área a mejorar.',
        duration: 15, materials: 'Hoja con la rueda de la vida y lápiz.',
        emoji: '🎯', type: 'desk', intensity: 'baja',
        benefitType: ['Psicológico'],
        specificBenefits: ['Reduce estrés', 'Mejora concentración', 'Mejora estado de ánimo'],
        description: 'Autoevaluación breve de áreas de vida y elección de un pequeño paso de mejora.',
        instrucciones: [
            'Cada persona califica del 1 al 10 áreas clave (salud, trabajo, relaciones, ocio, etc.).',
            'Identifica el área con menor puntaje y una acción pequeña para subir 1 punto esta semana.',
            'Quien quiera comparte su acción con el grupo (opcional).',
            'Cierre: un paso pequeño y constante cambia el promedio.'
        ]
    },
    {
        activityId: 'DP-02', categoria: 'Relax', name: 'Tres Gratitudes',
        objetivo: 'Activar el enfoque positivo y mejorar el estado de ánimo.',
        duration: 8, materials: 'Ninguno (opcional: hoja).',
        emoji: '🙏', type: 'desk', intensity: 'baja',
        benefitType: ['Psicológico', 'Social'],
        specificBenefits: ['Mejora estado de ánimo', 'Reduce estrés', 'Mejora clima laboral'],
        description: 'Cada persona nombra tres cosas por las que está agradecida hoy.',
        instrucciones: [
            'En silencio, cada quien piensa en 3 cosas por las que está agradecido hoy.',
            'Por turnos, quien quiera comparte una de ellas en voz alta.',
            'Nota cómo cambia el ánimo del grupo al escuchar lo positivo.',
            'Invita a repetir el ejercicio en casa antes de dormir.'
        ]
    },
    {
        activityId: 'DP-03', categoria: 'Relax', name: 'Fortaleza Escondida',
        objetivo: 'Reforzar la autoestima y el reconocimiento entre compañeros.',
        duration: 12, materials: 'Tarjetas o notas adhesivas.',
        emoji: '💎', type: 'desk', intensity: 'baja',
        benefitType: ['Social', 'Psicológico'],
        specificBenefits: ['Mejora clima laboral', 'Fomenta integración', 'Mejora estado de ánimo'],
        description: 'Cada persona reconoce por escrito una fortaleza de un compañero.',
        instrucciones: [
            'Cada persona escribe en una tarjeta una fortaleza real de un compañero asignado.',
            'Entrega la tarjeta y, si el grupo es pequeño, la lee en voz alta.',
            'Quien recibe solo agradece, sin minimizar el cumplido.',
            'Cierre: reconocer al otro fortalece al equipo.'
        ]
    },
    {
        activityId: 'DP-04', categoria: 'Relax', name: 'Carta a mi Yo Futuro',
        objetivo: 'Clarificar propósitos personales y proyectarse a futuro.',
        duration: 15, materials: 'Hoja, sobre y lápiz.',
        emoji: '✉️', type: 'desk', intensity: 'baja',
        benefitType: ['Psicológico'],
        specificBenefits: ['Reduce estrés', 'Mejora concentración', 'Mejora estado de ánimo'],
        description: 'Cada persona escribe una carta a sí misma con una meta a 3 meses.',
        instrucciones: [
            'Cada quien escribe una carta a su "yo" de dentro de 3 meses.',
            'Incluye: una meta, por qué importa y un primer paso concreto.',
            'Guarda la carta en un sobre con su nombre y fecha.',
            'El facilitador la devuelve en 3 meses para revisar avances.'
        ]
    },
    {
        activityId: 'DP-05', categoria: 'Relax', name: 'Respiración 4-7-8',
        objetivo: 'Reducir el estrés y regular el sistema nervioso con la respiración.',
        duration: 6, materials: 'Ninguno.',
        emoji: '🌬️', type: 'desk', intensity: 'baja',
        benefitType: ['Psicológico', 'Físico'],
        specificBenefits: ['Reduce estrés', 'Mejora concentración', 'Activa circulación'],
        description: 'Ejercicio guiado de respiración para calmar cuerpo y mente.',
        instrucciones: [
            'Sentados con la espalda recta, inhala por la nariz contando 4.',
            'Retén el aire contando 7.',
            'Exhala lento por la boca contando 8.',
            'Repite 4 ciclos y observa cómo baja la tensión.'
        ]
    },
    {
        activityId: 'DP-06', categoria: 'Relax', name: 'Meta de la Semana',
        objetivo: 'Practicar el establecimiento de metas pequeñas y alcanzables (SMART).',
        duration: 12, materials: 'Hoja y lápiz.',
        emoji: '✅', type: 'desk', intensity: 'baja',
        benefitType: ['Psicológico', 'Social'],
        specificBenefits: ['Mejora concentración', 'Mejora estado de ánimo', 'Fomenta integración'],
        description: 'Cada persona define una micro-meta de la semana y un compañero de seguimiento.',
        instrucciones: [
            'Cada quien define UNA meta pequeña y concreta para esta semana.',
            'Verifica que sea específica, medible y realista (ej. "caminar 10 min, 3 días").',
            'Forma parejas de "seguimiento" que se preguntarán cómo van.',
            'La próxima sesión, revisen quién la cumplió y qué aprendieron.'
        ]
    },
    {
        activityId: 'DP-07', categoria: 'Relax', name: 'Círculo de Reconocimiento',
        objetivo: 'Cerrar con gratitud y fortalecer los vínculos del equipo.',
        duration: 10, materials: 'Ninguno.',
        emoji: '🌟', type: 'indoor', intensity: 'baja',
        benefitType: ['Social', 'Psicológico'],
        specificBenefits: ['Mejora clima laboral', 'Fomenta integración', 'Mejora estado de ánimo'],
        description: 'En círculo, cada persona agradece algo a otra del grupo.',
        instrucciones: [
            'En círculo, una persona agradece algo específico a otra ("Gracias por…").',
            'Quien recibe el agradecimiento elige a la siguiente persona a reconocer.',
            'Continúa hasta que todos hayan dado y recibido al menos un reconocimiento.',
            'Cierre en silencio de 30 segundos para asimilar lo compartido.'
        ]
    },
    {
        activityId: 'DP-08', categoria: 'Relax', name: 'Mapa de Emociones',
        objetivo: 'Desarrollar autoconciencia emocional y normalizar hablar de cómo estamos.',
        duration: 8, materials: 'Opcional: tablero con palabras de emociones.',
        emoji: '🧭', type: 'desk', intensity: 'baja',
        benefitType: ['Psicológico', 'Social'],
        specificBenefits: ['Reduce estrés', 'Mejora estado de ánimo', 'Mejora comunicación'],
        description: 'Check-in emocional: cada quien nombra con una palabra cómo se siente hoy.',
        instrucciones: [
            'Cada persona elige UNA palabra que describa cómo se siente hoy.',
            'Por turnos la comparten, sin necesidad de explicar ni justificar.',
            'El facilitador agradece cada participación por igual.',
            'Cierre: nombrar lo que sentimos ya ayuda a regularlo.'
        ]
    }
];

const ACTIVITIES = [...TEAM_BUILDING, ...DESARROLLO_PERSONAL].map((a, i) => ({
    ...a,
    imagen: img(i)
}));

async function main() {
    console.log(`\n=== seed-activities-coach.js — modo: ${DRY_RUN ? 'DRY-RUN (sin escribir)' : 'EXECUTE'} ===`);
    console.log(`Actividades en el lote: ${ACTIVITIES.length} (team building + desarrollo personal)\n`);

    let creadas = 0, actualizadas = 0;
    for (const act of ACTIVITIES) {
        const existing = await db.collection('activities').where('activityId', '==', act.activityId).get();
        const payload = { ...act, updatedAt: admin.firestore.FieldValue.serverTimestamp() };

        if (existing.empty) {
            console.log(`＋ ${act.activityId}  ${act.emoji} ${act.name}  [${act.categoria}, ${act.intensity}, ${act.duration}min]`);
            if (!DRY_RUN) {
                payload.createdAt = admin.firestore.FieldValue.serverTimestamp();
                await db.collection('activities').add(payload);
            }
            creadas++;
        } else {
            console.log(`↻ ${act.activityId}  ${act.name}  (ya existía, se actualiza)`);
            if (!DRY_RUN) {
                await db.collection('activities').doc(existing.docs[0].id).update(payload);
            }
            actualizadas++;
        }
    }

    console.log(`\nResumen: ${creadas} nuevas, ${actualizadas} actualizadas.`);
    console.log(`=== ${DRY_RUN ? 'DRY-RUN terminado. Ejecuta con --execute para sembrar.' : 'Actividades sembradas.'} ===\n`);
    process.exit(0);
}

main().catch(err => {
    console.error('Error sembrando actividades:', err);
    process.exit(1);
});
