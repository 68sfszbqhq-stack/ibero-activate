// ============================================================
// APLICA EL CALENDARIO DEL DOCUMENTO DEL CONSEJO DE DIRECTORES
// ============================================================
//
// Fuente: "Pausas Activas para el Cuidado de la Comunidad_8745.docx"
// (Consejo de Directores) — Propuesta de actividades, 17 semanas.
//
// La Semana 1 arrancó el lunes 17 de agosto de 2026, así que las 17
// semanas caen en 2026-W33 … 2026-W49 (mismo cálculo de semana que
// usa js/calendar.js).
//
// Cada semana trae tres actividades:
//   Lunes y Martes → A
//   Miércoles y Jueves → B
//   Viernes → C
//
//   node scripts/aplicar-calendario-consejo.js --dry-run
//   node scripts/aplicar-calendario-consejo.js --execute
//
// Antes de escribir deja un respaldo con fecha en scripts/backups/.
// ============================================================

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const RAIZ = path.join(__dirname, '..');
const EJECUTAR = process.argv.includes('--execute');

if (!EJECUTAR && !process.argv.includes('--dry-run')) {
    console.error('Falta --dry-run o --execute.');
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert(require(path.join(RAIZ, 'firebase-service-account.json')))
});
const db = admin.firestore();

// --- El calendario, tal como viene en el documento -------------
// [semana, lunes-martes, miércoles-jueves, viernes]
const CALENDARIO = [
    ['Escuela de Postura', 'Dominó Tren Mexicano', 'Torre Jenga'],
    ['Juego de Mesa UNO', 'Meditación Guiada', 'Caminata Consciente'],
    ['Ping Pong con Tablas', "Tarjetas 'Somos'", 'Yoga en Silla'],
    ['Rodillo Miofascial', 'Tiro de Costalitos', 'Círculo de Toques'],
    ['Exploding Kittens', 'El nudo humano', 'Círculo de Agradecimiento'],
    ['Precisión-Pong', 'Cartas al Universo', 'Automasaje con Pelota'],
    ['Lotería Mexicana', 'Campo minado', 'Rebote-Reto'],
    ['Crazy Tower', 'Pausa de Escritorio', 'Ping Pong con Tablas'],
    ['Caminata Consciente', 'Dibujo a Ciegas', 'Estiramientos Funcionales'],
    ['Respiración 4-7-8', 'La torre imposible', 'Polilla Tramposa'],
    ['Spaghetti-Vóley', 'Rueda de la Vida Express', 'Boggle Party'],
    ['EVERYBODY 1 2 SWITCH', 'Mini Voleibol', 'Fuerza con Liga'],
    ['Estiramiento Integral', 'Círculo de Agradecimiento', 'Torre Jenga'],
    ['Taco Gato Cabra Queso Pizza', 'Diario de Gratitud', 'Estación de Habilidades'],
    ['Basta', 'Movilidad Express', "That's Not a Hat"],
    ['Pasa el balón', 'Relax y Enfoque', 'Spot It (Dobble)'],
    ['Mario Party', 'Escuela de Postura', 'Torre Jenga — Torneo Final'],
];

// El documento escribe algunos nombres distinto a como están dados
// de alta en el catálogo. Aquí se empatan, para no duplicar fichas.
const ALIAS = {
    'El nudo humano': 'Nudo Humano',
    'Círculo de Agradecimiento': 'Círculo Agradecimiento',
    'Taco Gato Cabra Queso Pizza': 'Taco Gato Cabra...',
    'Torre Jenga — Torneo Final': 'Torre Jenga',
};

// Tres nombres quedaron duplicados en Firestore. Se fija cuál usar:
// el que trae código de catálogo y ficha completa.
const DESEMPATE = {
    'Basta': '2PGkz9w9gqsY2HE2sAEe',
    'Spaghetti-Vóley': '3Xe9DCju9v7K2nWnYlWI',
};

// --- Las cuatro que el documento pide y no estaban en el catálogo.
// El objetivo, la descripción, los materiales y la duración son los
// de la ficha didáctica del propio documento.
const NUEVAS = [
    {
        activityId: 'FG-19',
        name: 'Campo minado',
        categoria: 'Físicos/Grupal',
        type: 'outdoor',
        intensity: 'baja',
        duration: 15,
        emoji: '🚧',
        objetivo: 'Fomentar la confianza mutua, la comunicación asertiva y el liderazgo solidario mediante un recorrido guiado por la voz del equipo.',
        materials: 'Conos u objetos suaves de oficina para obstáculos, antifaces o paliacates.',
        description: 'Dinámica vivencial de confianza y orientación. Se colocan obstáculos seguros en el piso de un área despejada (conos, vasos, pelotas, cajas). Se forman parejas: uno de los integrantes se venda los ojos o los cierra por completo y el otro se coloca a la orilla del campo. Únicamente mediante instrucciones verbales de guía ("dos pasos al frente", "gira a la izquierda", "alto"), el compañero guía debe llevar al participante vendado de un extremo al otro sin pisar ningún obstáculo. Aprender a dejarse guiar y cuidar al compañero con nuestra voz refleja la responsabilidad y la confianza necesarias para el trabajo en equipo.',
        instrucciones: [
            'MONTAJE (3 min). Despejar un área y repartir en el piso conos, vasos o cajas como obstáculos.',
            'PAREJAS (2 min). Uno se venda los ojos; el otro se queda a la orilla del campo y no puede entrar.',
            'RECORRIDO (8 min). El guía lleva a su compañero de un extremo al otro solo con la voz, sin tocarlo y sin pisar obstáculos. Luego se invierten los papeles.',
            'CIERRE (2 min). Preguntar qué instrucción fue la más útil y qué se sintió al depender de la voz del otro.'
        ],
        benefitType: ['Psicológico'],
        specificBenefits: ['Fomenta confianza', 'Mejora comunicación', 'Fomenta trabajo en equipo', 'Mejora clima laboral'],
    },
    {
        activityId: 'FG-20',
        name: 'Pasa el balón',
        categoria: 'Físicos/Grupal',
        type: 'outdoor',
        intensity: 'baja',
        duration: 10,
        emoji: '🏐',
        objetivo: 'Fomentar la coordinación física, el ritmo grupal y el soporte mutuo mediante un relevo de pases en círculo.',
        materials: 'Pelota ligera de vinil.',
        description: 'Dinámica cooperativa de relevos. El grupo forma un círculo de pie y se introduce una pelota ligera. La consigna es pasar el balón de mano en mano siguiendo distintas secuencias que dicta quien guía: por detrás de la espalda, por debajo de las piernas o girando antes de entregar. Se busca completar vueltas completas al círculo sin que el balón caiga al suelo. Entregar bien el trabajo y recibirlo con atención asegura que los proyectos fluyan sin interrupciones en la oficina.',
        instrucciones: [
            'CÍRCULO (1 min). Todos de pie formando un círculo, con espacio para mover los brazos.',
            'VUELTA SIMPLE (2 min). Pasar el balón de mano en mano hasta completar una vuelta.',
            'VARIANTES (5 min). Repetir pasando por detrás de la espalda, por debajo de las piernas y girando antes de entregar.',
            'RETO (2 min). Completar una vuelta completa sin que el balón toque el suelo.'
        ],
        benefitType: ['Físico', 'Psicológico'],
        specificBenefits: ['Mejora coordinación', 'Activa circulación', 'Fomenta integración', 'Mejora clima laboral'],
    },
    {
        activityId: 'FG-21',
        name: 'La torre imposible',
        categoria: 'Físicos/Grupal',
        type: 'indoor',
        intensity: 'baja',
        duration: 15,
        emoji: '🗼',
        objetivo: 'Resolver un reto colectivo de ingeniería lúdica coordinando manos y recursos para construir la estructura más alta.',
        materials: 'Vasos de plástico ligeros o palitos de madera y tarjetas.',
        description: 'Reto colaborativo de construcción y liderazgo. Se organizan equipos de 3 a 5 personas y se les entrega un kit de materiales simples (vasos de plástico, popotes, palitos o tarjetas). El reto consiste en construir la torre más alta y estable en un tiempo límite de 10 minutos, con la condición de que todos los integrantes del equipo deben colocar al menos un elemento por nivel. El servicio al equipo consiste en sostener la base y apoyar la idea del otro para que la meta común crezca sólida.',
        instrucciones: [
            'EQUIPOS (2 min). Formar equipos de 3 a 5 personas y repartir el kit de materiales.',
            'CONSTRUCCIÓN (10 min). Levantar la torre más alta y estable posible. Regla: todos deben colocar al menos un elemento por nivel.',
            'MEDICIÓN Y CIERRE (3 min). Medir las torres y comentar qué decisión del equipo sostuvo la estructura.'
        ],
        benefitType: ['Psicológico'],
        specificBenefits: ['Fomenta trabajo en equipo', 'Mejora comunicación', 'Fomenta integración', 'Mejora concentración'],
    },
    {
        activityId: 'VD-05', // el código con el que ya vivía en la curaduría
        name: 'Boggle Party',
        categoria: 'Mesa',
        type: 'desk',
        intensity: 'baja',
        duration: 15,
        emoji: '🔤',
        objetivo: 'Estimular la agilidad léxica, la atención y el trabajo colaborativo formando palabras contrarreloj.',
        materials: 'Juego Boggle de mesa o proyección en pantalla de cuadrícula de letras, hojas y lápices.',
        description: 'Lúdica de agilidad mental y desafío de palabras. En la pantalla de la sala o con el tablero de mesa se mezclan las letras en cuadrícula. En equipos de 2 a 3 personas, los colaboradores disponen de 3 minutos para encontrar y anotar la mayor cantidad de palabras conectando letras contiguas. Al sonar la alarma se revisan las palabras y se suman los puntos de las que cada equipo encontró en exclusiva. Poner la inteligencia y la creatividad al servicio del reto colectivo despierta el entusiasmo y la agilidad mental.',
        instrucciones: [
            'EQUIPOS (2 min). Formar equipos de 2 o 3 personas y repartir hoja y lápiz.',
            'RONDA (3 min por ronda). Revolver las letras y anotar todas las palabras posibles conectando letras contiguas.',
            'CONTEO (2 min por ronda). Se leen las palabras: solo puntúan las que ningún otro equipo encontró.',
            'CIERRE. Jugar dos o tres rondas según el tiempo disponible.'
        ],
        benefitType: ['Psicológico'],
        specificBenefits: ['Mejora concentración', 'Fomenta trabajo en equipo', 'Mejora clima laboral', 'Fomenta integración'],
    },
];

// --- Utilidades ------------------------------------------------

// El mismo cálculo de semana que usa js/calendar.js. No es ISO 8601:
// hay que replicarlo tal cual o los documentos no se empatan.
function getWeekId(date) {
    const year = date.getFullYear();
    const oneJan = new Date(year, 0, 1);
    const numberOfDays = Math.floor((date - oneJan) / (24 * 60 * 60 * 1000));
    const week = Math.ceil((date.getDay() + 1 + numberOfDays) / 7);
    return `${year}-W${week}`;
}

const normalizar = s => (s || '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim();

// Dónde se hace: las de patio a la explanada, el resto en el área.
const ubicacionDe = act => act.type === 'outdoor' ? 'Explanada' : 'Oficina del área';

const LUNES_SEMANA_1 = new Date(2026, 7, 17); // 17 de agosto de 2026
const DIAS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

// --- Proceso ---------------------------------------------------

(async () => {
    // 1. Catálogo actual
    const snap = await db.collection('activities').get();
    const porNombre = {};
    snap.forEach(d => {
        const k = normalizar(d.data().name);
        (porNombre[k] = porNombre[k] || []).push({ id: d.id, ...d.data() });
    });

    // 2. Respaldo de lo que se va a tocar
    const semanas = [];
    for (let i = 0; i < 17; i++) {
        const lunes = new Date(LUNES_SEMANA_1);
        lunes.setDate(LUNES_SEMANA_1.getDate() + i * 7);
        semanas.push({ n: i + 1, lunes, weekId: getWeekId(lunes) });
    }

    const antes = {};
    for (const s of semanas) {
        const doc = await db.collection('weekly_schedules').doc(s.weekId).get();
        antes[s.weekId] = doc.exists ? doc.data() : null;
    }

    const dirBackup = path.join(__dirname, 'backups');
    if (!fs.existsSync(dirBackup)) fs.mkdirSync(dirBackup);
    const sello = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const archivoBackup = path.join(dirBackup, `weekly_schedules-${sello}.json`);
    if (EJECUTAR) {
        fs.writeFileSync(archivoBackup, JSON.stringify(antes, null, 2));
        console.log('Respaldo guardado en', path.relative(RAIZ, archivoBackup), '\n');
    }

    // 3. Dar de alta las que faltan
    const creadas = {};
    for (const nueva of NUEVAS) {
        const k = normalizar(nueva.name);
        if (porNombre[k]) {
            console.log(`  ya existía, no se crea: ${nueva.name}`);
            creadas[nueva.name] = porNombre[k][0].id;
            continue;
        }
        if (EJECUTAR) {
            const ref = await db.collection('activities').add({
                ...nueva,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                origen: 'Documento del Consejo de Directores'
            });
            creadas[nueva.name] = ref.id;
            porNombre[k] = [{ id: ref.id, ...nueva }];
            console.log(`  ALTA  ${nueva.name}  (${nueva.activityId})  -> ${ref.id}`);
        } else {
            creadas[nueva.name] = '(nueva)';
            porNombre[k] = [{ id: '(nueva)', ...nueva }];
            console.log(`  ALTA  ${nueva.name}  (${nueva.activityId})  [dry-run]`);
        }
    }
    console.log('');

    // 4. Resolver cada nombre del calendario a una ficha
    function resolver(nombre) {
        const real = ALIAS[nombre] || nombre;
        const k = normalizar(real);
        const cands = porNombre[k];
        if (!cands) return null;
        if (cands.length === 1) return cands[0];
        const fijo = DESEMPATE[real];
        return cands.find(c => c.id === fijo) || cands[0];
    }

    const sinResolver = [];
    const plan = semanas.map((s, i) => {
        const [a, b, c] = CALENDARIO[i];
        const fichas = [a, b, c].map(n => {
            const f = resolver(n);
            if (!f) sinResolver.push(n);
            return { nombre: n, ficha: f };
        });
        const schedule = [];
        [0, 0, 1, 1, 2].forEach((idx, d) => {
            const f = fichas[idx].ficha;
            if (!f) return;
            schedule.push({ day: DIAS[d], activityId: f.id, location: ubicacionDe(f) });
        });
        return { ...s, fichas, schedule };
    });

    if (sinResolver.length) {
        console.error('NO SE PUDO EMPATAR:', [...new Set(sinResolver)].join(', '));
        process.exit(1);
    }

    // 5. Escribir
    console.log('Semana  weekId      Lun+Mar / Mié+Jue / Vie');
    console.log('─'.repeat(100));
    for (const p of plan) {
        const cambia = JSON.stringify((antes[p.weekId] || {}).schedule || []) !== JSON.stringify(p.schedule);
        const marca = cambia ? '*' : ' ';
        console.log(
            `${marca} ${String(p.n).padStart(2)}    ${p.weekId.padEnd(10)}  ` +
            p.fichas.map(f => f.nombre).join('  /  ')
        );
        if (EJECUTAR) {
            await db.collection('weekly_schedules').doc(p.weekId).set(
                { schedule: p.schedule, fuente: 'Documento del Consejo de Directores' },
                { merge: true }
            );
        }
    }
    console.log('─'.repeat(100));
    console.log(`${plan.length} semanas · ${plan.reduce((n, p) => n + p.schedule.length, 0)} sesiones` +
        (EJECUTAR ? ' escritas.' : ' (dry-run, no se escribió nada).'));
    console.log('* = la semana queda distinta a como estaba.');
    process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
