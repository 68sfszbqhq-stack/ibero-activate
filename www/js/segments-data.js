// ============================================================
// SEGMENTOS DE PAUSAS ACTIVAS - IBERO ACTÍVATE
// ============================================================
//
// Los 8 segmentos con los que se diseña el programa, agrupados
// en 3 ejes según su función (activación / recuperación / mente
// y vínculo).
//
// CLASIFICACION_DEFAULT asigna un segmento sugerido a cada
// actividad del catálogo. Es solo un punto de partida: desde
// la página de Curaduría se puede cambiar el segmento de
// cualquier actividad, y ese cambio se guarda en Firestore
// (colección activity_ratings) sobrescribiendo este default.
// ============================================================

const SEGMENTOS = [
    {
        id: 'recreativos',
        nombre: 'Juegos recreativos',
        eje: 'Activación',
        emoji: '🎈',
        color: '#F59E0B',
        descripcion: 'Reglas simples, sin objetivo deportivo. El foco es el disfrute y que participen todos.'
    },
    {
        id: 'predeportivos',
        nombre: 'Juegos pre-deportivos',
        eje: 'Activación',
        emoji: '🏐',
        color: '#EA580C',
        descripcion: 'Gesto o regla de un deporte formal, con espacio reducido y reglas adaptadas.'
    },
    {
        id: 'retos',
        nombre: 'Retos físicos',
        eje: 'Activación',
        emoji: '🔥',
        color: '#DC2626',
        descripcion: 'Meta medible individual o por equipo, con marcador y plazo. Aquí vive la gamificación.'
    },
    {
        id: 'automasaje',
        nombre: 'Sesiones de automasaje',
        eje: 'Recuperación',
        emoji: '🖐️',
        color: '#0D9488',
        descripcion: 'Liberación miofascial aplicada por la propia persona: trapecio, cuello, antebrazo, mano.'
    },
    {
        id: 'postural',
        nombre: 'Recuperación postural',
        eje: 'Recuperación',
        emoji: '🧍',
        color: '#0891B2',
        descripcion: 'Ejercicio correctivo contra cabeza adelantada y hombros redondeados.'
    },
    {
        id: 'mesa',
        nombre: 'Juegos de mesa',
        eje: 'Mente y vínculo',
        emoji: '🎲',
        color: '#7C3AED',
        descripcion: 'Estrategia, atención y conversación alrededor de una mesa.'
    },
    {
        id: 'virtuales',
        nombre: 'Juegos virtuales',
        eje: 'Mente y vínculo',
        emoji: '🎮',
        color: '#4F5AC7',
        descripcion: 'Consola, app, pantalla compartida o realidad virtual. Sirve también para personal remoto.'
    },
    {
        id: 'cooperativos',
        nombre: 'Juegos cooperativos',
        eje: 'Mente y vínculo',
        emoji: '🤝',
        color: '#DB2777',
        descripcion: 'El grupo gana o pierde junto: sin eliminación ni ganador individual.'
    },
    {
        id: 'recuperacion-mental',
        nombre: 'Recuperación mental',
        eje: 'Mente y vínculo',
        emoji: '🌿',
        color: '#15803D',
        descripcion: 'Atención plena, gratitud, escritura reflexiva y vínculo. Recupera recursos psicológicos, no físicos: es el equivalente mental de la recuperación postural.'
    },
    {
        id: 'sin-clasificar',
        nombre: 'Sin clasificar',
        eje: 'Pendiente',
        emoji: '❓',
        color: '#6B7280',
        descripcion: 'No encaja limpio en ninguno de los 8 segmentos. Decide tú a dónde va o si se queda aparte.'
    }
];

// ── Clasificación sugerida por actividad ────────────────────
const CLASIFICACION_DEFAULT = {
    // Activación física → mayormente retos físicos y postural
    'AF-01': 'retos',
    'AF-02': 'postural',
    'AF-03': 'retos',
    'AF-04': 'postural',
    'AF-05': 'retos',
    'AF-06': 'retos',
    'AF-07': 'retos',
    'AF-08': 'retos',
    'AF-09': 'retos',
    'AF-10': 'retos',

    // Físicos / grupales
    'FG-01': 'predeportivos',   // Spaghetti-Vóley
    'FG-02': 'predeportivos',   // Precisión-Pong
    'FG-03': 'predeportivos',   // Mini Bádminton
    'FG-04': 'recreativos',     // Rebote-Reto
    'FG-05': 'cooperativos',    // Círculo de Toques
    'FG-06': 'recreativos',     // El Globo Loco
    'FG-07': 'predeportivos',   // Hockey de Suelo
    'FG-09': 'recreativos',     // Relevo de Equilibrio
    'FG-09b': 'recreativos',    // Pelotas a la Pared
    'FG-10': 'predeportivos',   // Estación de Habilidades
    'FG-12': 'predeportivos',   // Mini Voleibol
    'FG-15': 'retos',           // Copa Pausas Activas (torneo entre áreas)

    // Juegos de mesa
    'JM-01': 'mesa',
    'JM-02': 'mesa',
    'JM-03': 'mesa',
    'JM-04': 'mesa',
    'JM-05': 'mesa',
    'JM-06': 'mesa',
    'JM-07': 'cooperativos',    // The Mind es cooperativo puro
    'JM-08': 'mesa',
    'JM-09': 'mesa',
    'JM-10': 'mesa',
    'JM-11': 'mesa',
    'JM-12': 'mesa',
    'JM-14': 'mesa',
    'JM-18': 'mesa',
    'JM-20': 'mesa',
    'JM-21': 'mesa',
    'JM-21b': 'mesa',
    'JM-22': 'mesa',
    'JM-23': 'mesa',            // Stacko Activo (mesa + micropausas)

    // Digital
    'VD-01': 'virtuales',
    'VD-02': 'virtuales',
    'VD-03': 'virtuales',
    'VD-04': 'virtuales',

    // Relajación y conexión
    'RC-01': 'recuperacion-mental',  // Círculo de Agradecimiento: gratitud + afiliación
    'RC-02': 'recuperacion-mental',  // Meditación Guiada: atención plena + relajación
    'RC-03': 'postural',        // Estiramientos Funcionales
    'RC-04': 'automasaje',      // Automasaje con Pelota
    'RC-06': 'postural',        // Yoga en Silla

    // Caminatas reflexivas (módulo aparte del programa)
    'CR-01': 'recuperacion-mental',  // Caminata Consciente: atención plena en movimiento
    'CR-02': 'recuperacion-mental',  // Diario de Gratitud: gratitud escrita
    'CR-03': 'recuperacion-mental',  // Cartas al Universo: escritura reflexiva y significado
    'CR-04': 'recuperacion-mental',  // Tarjetas Somos: afiliación y empatía

    // ── Material nuevo (agosto 2026) ───────────────────────
    // Set 6 en 1 de automasaje (8 sets)
    'AM-01': 'automasaje',
    'AM-02': 'automasaje',
    'AM-03': 'automasaje',
    'AM-04': 'automasaje',
    'AM-05': 'automasaje',
    'AM-06': 'automasaje',
    'AM-07': 'automasaje',
    'AM-08': 'automasaje',

    // Cornhole / lanzamiento de costales
    'FG-16': 'predeportivos',   // Cornhole Clasico
    'FG-17': 'retos',           // Torneo Relampago (competencia entre areas)
    'FG-18': 'cooperativos',    // Costales a Ciegas (marcador colectivo)

    // Pelota gigante de voleibol de playa
    'FG-19': 'cooperativos',    // Voley Gigante en Circulo
    'FG-20': 'predeportivos',   // Voley Playa Adaptado

    // Juegos de Netflix
    'VD-05': 'virtuales',
    'VD-06': 'virtuales',
    'VD-07': 'virtuales',
    'VD-08': 'cooperativos',    // Overcooked es cooperativo puro
    'VD-09': 'virtuales'
};

// ── Helpers ─────────────────────────────────────────────────
function getSegmento(segId) {
    return SEGMENTOS.find(s => s.id === segId) || SEGMENTOS[SEGMENTOS.length - 1];
}

// Adivina el segmento cuando la actividad no está en el mapa
// (por ejemplo, una actividad nueva creada desde el catálogo).
function inferirSegmento(actividad) {
    const id = actividad.activityId || actividad.id || '';
    if (CLASIFICACION_DEFAULT[id]) return CLASIFICACION_DEFAULT[id];

    const prefijo = String(id).split('-')[0].toUpperCase();
    const porPrefijo = {
        AF: 'retos',
        FG: 'predeportivos',
        JM: 'mesa',
        VD: 'virtuales',
        AM: 'automasaje',
        RC: 'postural',
        CR: 'recuperacion-mental'
    };
    if (porPrefijo[prefijo]) return porPrefijo[prefijo];

    const cat = (actividad.categoria || '').toLowerCase();
    if (cat.includes('mesa')) return 'mesa';
    if (cat.includes('digital')) return 'virtuales';
    if (cat.includes('relax')) return 'postural';
    if (cat.includes('grupal')) return 'predeportivos';
    if (cat.includes('activaci')) return 'retos';
    if (cat.includes('caminata')) return 'sin-clasificar';

    return 'sin-clasificar';
}
