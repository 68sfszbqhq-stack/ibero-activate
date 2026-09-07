// ============================================================
// GENERA tablero-areas.html
// ============================================================
//
// Lee de Firestore las actividades que quedaron marcadas
// "conservar" en la Curaduría y las áreas reales, y las
// incrusta en scripts/tablero-plantilla.html.
//
//   node scripts/build-tablero.js
//
// El resultado es un solo archivo que se abre en el navegador
// sin login y sin internet. Vuelve a correrlo cuando cambie
// la curaduría o se den de alta áreas nuevas.
// ============================================================

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const RAIZ = path.join(__dirname, '..');
const PLANTILLA = path.join(__dirname, 'tablero-plantilla.html');
const SALIDA = path.join(RAIZ, 'tablero-areas.html');
// Los mismos datos en JSON, para que el .docx no vuelva a inventar la
// clasificación: el Word y el tablero salen de una sola fuente.
const SALIDA_JSON = path.join(__dirname, 'datos-tablero.json');

// Los nombres de las áreas vienen en mayúsculas y algunos son muy
// largos para caber en el encabezado de una columna. Aquí van los
// nombres cortos; el nombre completo se conserva en el tooltip,
// en la semana de visitas y en el Excel.
const CORTOS = {
  'CENTRO DE PARTICIPACIÓN Y DIFUSIÓN UNIVERSITARIA': 'Participación y Difusión',
  'DEFENSORIA DE LOS DERECHOS UNIVERSITARIOS': 'Defensoría Derechos',
  'DEPARTAMENTO CIENCIAS DE LA SALUD': 'Ciencias de la Salud',
  'DEPARTAMENTO DE CIENCIAS E INGENIERÍAS': 'Ciencias e Ingenierías',
  'DIRECCION DE COMUNICACION INSTITUCIONAL': 'Comunicación Institucional',
  'DIRECCIÓN DE INNOVACIÓN E INTERNACIONALIZACIÓN EDUCATIVA': 'Innovación e Internacionalización',
  'INSTITUTO DE INVESTIGACIONES EN MEDIO AMBIENTE': 'Medio Ambiente',
  'OFICINA DE ATEN TECNOLOGICA': 'Atención Tecnológica',
  'EDUCACION VIR': 'Educación Virtual',
  'PREPARATORIA IBERO': 'Prepa IBERO',
  'DIRECCION DE PERSONAL': 'Dirección de Personal',
  'Ibero Activate': 'IBERO Actívate',
  // En Firestore están sin acento.
  'CLINICA DE NUTRICIÓN': 'Clínica de Nutrición',
  'TESORERIA': 'Tesorería',
};

// Las siglas se quedan en mayúsculas; todo lo demás pasa a may/min,
// porque las mayúsculas sostenidas se leen peor de canto.
const SIGLAS = ['AIDEL', 'DADA', 'IDIT', 'LAINES', 'IBERO', 'TI'];

function titular(s) {
  const menores = ['de', 'del', 'la', 'las', 'los', 'y', 'e', 'en'];
  return s.split(' ').map((p, i) => {
    if (SIGLAS.includes(p.toUpperCase())) return p.toUpperCase();
    const b = p.toLowerCase();
    if (i > 0 && menores.includes(b)) return b;
    return b.charAt(0).toUpperCase() + b.slice(1);
  }).join(' ');
}

function corto(nombre) {
  if (CORTOS[nombre]) return CORTOS[nombre];
  return titular(nombre);
}

// Estructura del documento del Consejo de Directores, "Pausas Activas para
// el Cuidado de la Comunidad: Movimiento con Sentido Ignaciano".
//
// Tres aspectos, y dentro de cada uno sus segmentos. En el documento los
// segmentos son las viñetas (•) y las actividades son las sub-viñetas (o).
// Esto sustituye por completo a los nueve segmentos de js/segments-data.js.
const ASPECTOS = {
  cura: {
    nombre: 'Cura Personalis',
    lema: 'Cuidado integral de la persona: salud física, emocional, social y espiritual.',
    color: '#7C3AED', fondo: '#F5F3FF',
  },
  comunidad: {
    nombre: 'Comunidad para el Bien Común',
    lema: 'Colaboración y apoyo mutuo. Fortalece la identidad universitaria.',
    color: '#EA580C', fondo: '#FFF7ED',
  },
  magis: {
    nombre: 'Magis y Servicio',
    lema: 'Dar lo mejor de sí al servicio de los demás: solidaridad y corresponsabilidad.',
    color: '#0891B2', fondo: '#ECFEFF',
  },
  'por-clasificar': {
    nombre: 'Por clasificar',
    lema: 'Caben en dos segmentos a la vez. Falta que José decida en cuál entran.',
    color: '#9CA3AF', fondo: '#F9FAFB',
  },
};

// El orden es el del documento, no alfabético.
const SEGMENTOS = {
  activaciones:      { aspecto: 'cura',      nombre: 'Activaciones físicas saludables' },
  respiracion:       { aspecto: 'cura',      nombre: 'Ejercicios de respiración consciente' },
  'estiramiento-reflexion': { aspecto: 'cura', nombre: 'Pausas de estiramiento con reflexión' },
  estres:            { aspecto: 'cura',      nombre: 'Estrategias de manejo del estrés' },

  cooperativos:      { aspecto: 'comunidad', nombre: 'Juegos cooperativos' },
  'retos-grupales':  { aspecto: 'comunidad', nombre: 'Retos grupales' },
  confianza:         { aspecto: 'comunidad', nombre: 'Dinámicas de confianza' },
  'inter-areas':     { aspecto: 'comunidad', nombre: 'Actividades de integración inter áreas' },

  'retos-colaborativos': { aspecto: 'magis', nombre: 'Retos colaborativos' },
  liderazgo:         { aspecto: 'magis',     nombre: 'Actividades de liderazgo compartido' },
  'reflexion-servicio': { aspecto: 'magis',  nombre: 'Reflexiones breves sobre servicio' },
  'ayuda-mutua':     { aspecto: 'magis',     nombre: 'Dinámicas de ayuda mutua' },

  'por-clasificar':  { aspecto: 'por-clasificar', nombre: 'Por clasificar' },
};

const ORDEN_SEGMENTO = Object.keys(SEGMENTOS);
const ORDEN_ASPECTO = ['cura', 'comunidad', 'magis', 'por-clasificar'];

// La clasificación se ancla en los ejemplos que el documento nombra bajo cada
// segmento. Lo nombrado manda; lo demás sigue por parecido. Lo que cabe en dos
// segmentos a la vez NO se decide aquí: cae en "por clasificar".
const CLASIFICACION = {
  // ---- Cura Personalis ----
  activaciones: [
    // Nombradas: escuelas de posturas, fuerza con ligas, estiramientos
    // funcionales, masaje inducido, rodillo miofascial, puntos gatillo.
    'Escuela de Postura', 'Fuerza con Liga', 'Estiramientos Funcionales',
    'Automasaje con Pelota', 'Rodillo Miofascial', 'Punto Gatillo',
    'Energía Express', 'Ritmo Cardiaco', 'Estiramiento Integral', 'Movilidad Express',
  ],
  respiracion: [
    // Nombradas: meditación guiada, diario de gratitud.
    'Meditación Guiada', 'Diario de Gratitud',
    'Respiración 4-7-8', 'Relax y Enfoque', 'Tres Gratitudes',
  ],
  'estiramiento-reflexion': [
    // Nombradas: pausas en su escritorio, yoga en silla.
    'Pausa de Escritorio', 'Yoga en Silla',
  ],
  estres: [
    // El documento no dio ejemplos. Van las de trabajo emocional.
    'Mapa de Emociones', 'Rueda de la Vida Express',
  ],

  // ---- Comunidad para el Bien Común ----
  cooperativos: [
    // Nombradas: mini voli, círculo de toques con pelota y "todos los
    // juegos de mesa".
    'Mini Voleibol', 'Círculo de Toques', 'The Mind',
    'Bananagrams', 'Crazy Tower', 'Cuento en Cadena', 'Dibujo a Ciegas',
    'Dominó Tren Mexicano', 'Exploding Kittens', 'Fantasma Blitz',
    'Hockey de Mesa', 'Lotería', 'Lotería Mexicana', 'Polilla Tramposa',
    'Spot It (Dobble)', 'Taco Gato Cabra...', "That's Not a Hat",
    'UNO Clásico', 'UNO No Mercy', 'Juego de Mesa UNO',
    'Hockey de Suelo', 'Mini Bádminton', 'Spaghetti-Vóley', 'El Globo Loco',
  ],
  'retos-grupales': [
    'Torre Jenga',   // "jenga gigante" en el documento
  ],
  confianza: [
    'Tarjetas \'Somos\'', 'Cartas al Universo',
  ],
  'inter-areas': [
    // Subrayado en el documento y sin ejemplos. Todavía no hay ninguna
    // actividad del catálogo que sea de integración entre áreas.
  ],

  // ---- Magis y Servicio ----
  'retos-colaborativos': [
    // Nombradas: Nintendo, ping pong, tiro de costales, adivina la palabra.
    'Mario Party', 'Jeopardy / Switch 1-2', 'EVERYBODY 1 2 SWITCH',
    'Ping Pong con Tablas', 'Precisión-Pong', 'Tiro de Costalitos',
    'Adivina la Palabra',
  ],
  liderazgo: [
    'Caminata Consciente',   // "caminatas con sentido"
  ],
  'reflexion-servicio': [
    // El documento no dio ejemplos y el catálogo no tiene ninguna.
  ],
  'ayuda-mutua': [
    // Nombradas: círculo de agradecimiento, variante de tarjetas.
    'Círculo Agradecimiento', 'Círculo de Reconocimiento',
  ],
};

// Por qué quedó pendiente cada una. Se muestra al abrir el selector, para
// que la decisión se tome con el motivo a la vista.
const DUDAS = {
  'Basta': 'Es juego de mesa (Juegos cooperativos), pero el documento mandó "adivina la palabra" a Retos colaborativos.',
  'Basta Digital': 'Mismo caso que Basta, y además es de pantalla, como el Nintendo de Retos colaborativos.',
  'Boggle Party': 'Juego de palabras en pantalla: cabe en Juegos cooperativos y en Retos colaborativos.',
  'Pictionary Air': 'Juego de dibujo en pantalla. Cabe en Juegos cooperativos y en Retos colaborativos.',
  'Pictionary Digital': 'Mismo caso que Pictionary Air.',
  'Noche de Juegos': 'Es una sesión, no una actividad suelta. Depende de qué se juegue esa noche.',
  'Overcooked por Equipos': 'Cooperar para lograrlo (Juegos cooperativos) o reto de Nintendo (Retos colaborativos).',
  'Tetris Relámpago': 'Reto individual de velocidad (Retos colaborativos) o juego de pantalla compartido (Juegos cooperativos).',
  'Estación de Habilidades': 'Retos grupales (Bien Común) o Retos colaborativos (Magis): los dos segmentos casi se tocan.',
  'Pelotas a la Pared': 'Mismo empate: Retos grupales o Retos colaborativos.',
  'Rebote-Reto': 'Mismo empate: Retos grupales o Retos colaborativos.',
  'Fortaleza Escondida': 'Trabajo de fortalezas propias (Manejo del estrés) o dinámica que se comparte (Dinámicas de confianza).',
};

// El horario de visitas que trae el documento del Consejo, tal cual: cinco
// días × las siete pausas de 25 minutos entre 10:00 y 12:55, que son las
// mismas ranuras de la rejilla del tablero. Las celdas con varias áreas son
// las que se juntan en una sola pausa.
//
// Los nombres son los del documento; abajo se empatan con las áreas reales.
// Si el Consejo mueve el horario, se edita aquí y se vuelve a generar.
const HORARIO = {
  '10:00': {
    Lunes: ['Planta Física'],
    Martes: ['Direcciones Generales'],
    Miércoles: ['Planta Física'],
    Jueves: ['AIDEL', 'Servicio Social', 'DADA', 'Reflexión Universitaria'],
    Viernes: ['IBERO Actívate'],
  },
  '10:25': {
    Lunes: ['Admisiones', 'Bibliotecas'],
    Martes: ['Negocios', 'Ciencias Sociales'],
    Miércoles: ['Admisiones', 'Bibliotecas'],
    Jueves: ['Negocios', 'Ciencias Sociales', 'Humanidades'],
    Viernes: ['Villas IBERO'],
  },
  '10:50': {
    Lunes: ['Dirección de Personal'],
    Martes: ['IDIT'],
    Miércoles: ['Innovación e Internacionalización'],
    Jueves: ['IDIT'],
    Viernes: ['Prepa IBERO'],
  },
  '11:15': {
    Lunes: ['Tesorería'],
    Martes: ['Protección Universitaria'],
    Miércoles: ['Clínica de Nutrición'],
    Jueves: ['Protección Universitaria'],
    Viernes: ['Marketing'],
  },
  '11:40': {
    Lunes: ['Compras'],
    Martes: ['DADA', 'AIDEL', 'Servicio Social', 'Reflexión Universitaria'],
    Miércoles: ['Ciencias e Ingenierías'],
    Jueves: ['Servicios Escolares'],
    Viernes: ['LAINES'],
  },
  '12:05': {
    Lunes: ['Educación Continua'],
    Martes: ['Servicios Escolares'],
    Miércoles: ['Dirección de Personal'],
    Jueves: ['Participación y Difusión', 'Planeación y Evaluación', 'Educación Virtual', 'Medios Universitarios'],
    Viernes: ['Egresados'],
  },
  '12:30': {
    Lunes: ['Humanidades', 'Ciencias de la Salud', 'Medio Ambiente'],
    Martes: ['Planeación y Evaluación', 'Educación Virtual', 'Medios Universitarios'],
    Miércoles: ['Compras'],
    Jueves: ['Comunicación Institucional'],
    Viernes: ['Defensoría Derechos Universitarios', 'Atención Tecnológica'],
  },
};

// El documento nombra varias áreas distinto a como están dadas de alta.
// Aquí se empatan; lo que no aparezca en ninguna de las dos listas se
// reporta al generar, nunca se descarta en silencio.
const AREA_DEL_HORARIO = {
  'Ciencias de la Salud': 'Departamento Ciencias de la Salud',
  'Ciencias e Ingenierías': 'Departamento de Ciencias e Ingenierías',
  'Comunicación Institucional': 'Direccion de Comunicacion Institucional',
  'Defensoría Derechos Universitarios': 'Defensoria de los Derechos Universitarios',
  'Educación Virtual': 'Educacion Vir',
  'Innovación e Internacionalización': 'Dirección de Innovación e Internacionalización Educativa',
  'Medio Ambiente': 'Instituto de Investigaciones en Medio Ambiente',
  'Participación y Difusión': 'Centro de Participación y Difusión Universitaria',
  'Prepa IBERO': 'Preparatoria IBERO',
  'Atención Tecnológica': 'Oficina de Aten Tecnologica',
  'IBERO Actívate': 'IBERO Activate',
  'Clínica de Nutrición': 'Clinica de Nutrición',
  'Dirección de Personal': 'Direccion de Personal',
  'Tesorería': 'Tesoreria',
};

// Índice inverso: nombre de actividad -> segmento.
const SEGMENTO_DE = {};
Object.entries(CLASIFICACION).forEach(([seg, nombres]) => {
  nombres.forEach((n) => { SEGMENTO_DE[n] = seg; });
});

// Rearma el HTML desde el JSON ya guardado, sin tocar Firestore. Sirve cuando
// solo cambió la plantilla, y cuando la cuota de lectura del día se agotó.
function soloPlantilla() {
  if (!fs.existsSync(SALIDA_JSON)) {
    console.error('✗ No hay scripts/datos-tablero.json en caché. Hay que correrlo con red.');
    process.exit(1);
  }
  const datos = JSON.parse(fs.readFileSync(SALIDA_JSON, 'utf8'));
  const plantilla = fs.readFileSync(PLANTILLA, 'utf8');
  if (!plantilla.includes('/*__DATOS__*/')) {
    console.error('✗ La plantilla ya no tiene la marca /*__DATOS__*/.');
    process.exit(1);
  }
  fs.writeFileSync(SALIDA, plantilla.replace('/*__DATOS__*/', JSON.stringify(datos)));
  console.log(`✓ ${datos.actividades.length} actividades × ${datos.areas.length} áreas ` +
    `→ ${path.basename(SALIDA)}  (desde caché del ${datos.generado.slice(0, 10)})`);
}

async function main() {
  if (process.argv.includes('--cache')) return soloPlantilla();

  const llave = path.join(RAIZ, 'firebase-service-account.json');
  if (!fs.existsSync(llave)) {
    console.error('✗ Falta firebase-service-account.json en la raíz del proyecto.');
    process.exit(1);
  }

  admin.initializeApp({ credential: admin.credential.cert(require(llave)) });
  const db = admin.firestore();

  const [snapRatings, snapActs, snapAreas, snapEmp, snapSch, snapAtt] = await Promise.all([
    db.collection('activity_ratings').get(),
    db.collection('activities').get(),
    db.collection('areas').orderBy('name').get(),
    db.collection('employees').get(),
    db.collection('weekly_schedules').get(),
    db.collection('attendances').get(),
  ]);

  // ── POPULARIDAD REAL ────────────────────────────────────────────────────
  //
  // De dónde sale, porque no es obvio: `attendances` dice quién asistió y qué
  // día, pero NO qué actividad se hizo. `weekly_schedules` sí dice qué
  // actividad tocó cada día. Cruzando los dos por la fecha se sabe cuánta
  // gente fue a cada actividad. Cruzan 2,122 de las 2,198 asistencias.
  //
  // SE MIDE POR SESIÓN, NO POR TOTAL. El total premia a la que programaste más
  // veces, no a la que gustó: una actividad puesta diez veces junta más gente
  // que una puesta una vez, aunque a nadie le entusiasme.
  //
  // Y SE ENCOGE HACIA LA MEDIA cuando hay pocas sesiones. Sin eso, una
  // actividad con una sola sesión afortunada encabeza la lista para siempre.
  // Con k=2 sesiones de lastre, una que corrió una vez pesa un tercio de lo
  // que dice su promedio y dos tercios de la media general.
  //
  // LO QUE ESTO NO ES: no mide cuánto les GUSTÓ. Mide cuánta gente fue. Los
  // `feedbacks` (46) califican la asistencia, no la actividad, así que no hay
  // forma de saber por actividad qué tan bien cayó. Para tenerlo habría que
  // guardar el activityId en la asistencia o en el feedback.
  const DIAS_SEMANA = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5 };
  const fechaDeSemanaISO = (anio, semana, dow) => {
    const x = new Date(Date.UTC(anio, 0, 4));
    const w = x.getUTCDay() || 7;
    x.setUTCDate(x.getUTCDate() - w + 1 + (semana - 1) * 7 + (dow - 1));
    return x.toISOString().slice(0, 10);
  };

  const actividadDeFecha = {};
  snapSch.docs.forEach((d) => {
    const m = /^(\d{4})-W(\d{1,2})$/.exec(d.id);
    if (!m) return;
    (d.data().schedule || []).forEach((e) => {
      const dow = DIAS_SEMANA[e.day];
      if (dow && e.activityId) actividadDeFecha[fechaDeSemanaISO(+m[1], +m[2], dow)] = e.activityId;
    });
  });

  const asistencia = {};
  snapAtt.docs.forEach((d) => {
    const x = d.data();
    const act = actividadDeFecha[x.date];
    if (!act) return;
    asistencia[act] = asistencia[act] || { personas: 0, fechas: new Set() };
    asistencia[act].personas++;
    asistencia[act].fechas.add(x.date);
  });

  const medidas = Object.values(asistencia).map((v) => v.personas / v.fechas.size);
  const mediaGlobal = medidas.length ? medidas.reduce((a, b) => a + b, 0) / medidas.length : 0;
  const LASTRE = 2;

  // El cruce va POR NOMBRE, no por id, y no es un atajo: el horario apunta a los
  // documentos de `activities`, mientras que el tablero se arma desde
  // `activity_ratings`, que usa otros identificadores. Por id cruzaban 3 de 71;
  // por nombre cruzan casi todas. El nombre se normaliza (sin acentos, sin
  // dobles espacios, en minúsculas) porque el mismo juego aparece escrito de
  // formas ligeramente distintas en una colección y en la otra.
  const llaveNombre = (s) => String(s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/\s+/g, ' ').trim();

  const nombreDeActividad = {};
  snapActs.docs.forEach((d) => {
    const x = d.data();
    nombreDeActividad[d.id] = x.name;
    if (x.activityId) nombreDeActividad[x.activityId] = x.name;
  });

  const porNombre = {};
  Object.entries(asistencia).forEach(([id, v]) => {
    const k = llaveNombre(nombreDeActividad[id]);
    if (!k) return;
    if (!porNombre[k]) porNombre[k] = { personas: 0, fechas: new Set() };
    porNombre[k].personas += v.personas;
    v.fechas.forEach((f) => porNombre[k].fechas.add(f));
  });

  const popularidadDe = (nombre) => {
    const v = porNombre[llaveNombre(nombre)];
    if (!v) return null; // nunca se ha aplicado: no hay dato que inventar
    const sesiones = v.fechas.size;
    return {
      porSesion: Math.round(((v.personas + LASTRE * mediaGlobal) / (sesiones + LASTRE)) * 10) / 10,
      personas: v.personas,
      sesiones,
    };
  };

  // Cuánta gente tiene cada área. Es el criterio para repartir las pausas
  // que sobran: la segunda visita va donde hay más personas.
  const personasPorArea = {};
  snapEmp.docs.forEach((d) => {
    const a = d.data().areaId;
    if (a) personasPorArea[a] = (personasPorArea[a] || 0) + 1;
  });

  // El catálogo se indexa por las dos llaves posibles: el id del
  // documento y el activityId, porque la curaduría guarda por una
  // y algunas actividades traen la otra.
  const catalogo = {};
  snapActs.docs.forEach((d) => {
    const x = d.data();
    catalogo[d.id] = x;
    if (x.activityId) catalogo[x.activityId] = x;
  });

  const conservadas = snapRatings.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((x) => x.decision === 'conservar');

  const actividades = conservadas.map((x) => {
    const c = catalogo[x.activityId] || catalogo[x.id] || {};
    const nombre = x.name || c.name || 'Sin nombre';
    const segmento = SEGMENTO_DE[nombre] || 'por-clasificar';
    return {
      id: x.id,
      nombre,
      segmento,
      aspecto: SEGMENTOS[segmento].aspecto,
      duda: DUDAS[nombre] || '',
      emoji: c.emoji || '',
      duracion: c.duration || null,
      estrellas: x.rating || 0,
      // `null` cuando la actividad nunca se ha aplicado. Es distinto de cero y
      // el tablero lo trata distinto: sin historial no se ajusta nada.
      popularidad: popularidadDe(nombre),
    };
  });

  // Por segmento en el orden del documento, y dentro de cada uno por nombre.
  actividades.sort((a, b) => {
    const oa = ORDEN_SEGMENTO.indexOf(a.segmento);
    const ob = ORDEN_SEGMENTO.indexOf(b.segmento);
    if (oa !== ob) return oa - ob;
    return a.nombre.localeCompare(b.nombre, 'es');
  });

  // Un nombre mal escrito en CLASIFICACION mandaría la actividad a
  // "por clasificar" sin avisar. Mejor que salte aquí.
  const existentes = new Set(actividades.map((a) => a.nombre));
  const fantasmas = Object.keys(SEGMENTO_DE).filter((n) => !existentes.has(n));
  if (fantasmas.length) {
    console.warn('⚠ Nombres en CLASIFICACION que no existen en el catálogo:');
    fantasmas.forEach((n) => console.warn('   ' + n));
  }

  // Participación real: cuántas veces asistió en promedio cada persona del
  // área. Los registros solo guardan asistencias (no faltas), así que este
  // promedio es la mejor señal de qué tan enganchada está un área.
  const areaDeEmpleado = {};
  snapEmp.docs.forEach((d) => { areaDeEmpleado[d.id] = d.data().areaId; });

  const asistenciasPorArea = {};
  snapAtt.docs.forEach((d) => {
    const x = d.data();
    const a = x.areaId || areaDeEmpleado[x.employeeId];
    if (a) asistenciasPorArea[a] = (asistenciasPorArea[a] || 0) + 1;
  });

  let areas = snapAreas.docs.map((d) => {
    const personas = personasPorArea[d.id] || 0;
    const asistencias = asistenciasPorArea[d.id] || 0;
    return {
      id: d.id,
      nombre: titular(d.data().name || ''),
      corto: corto(d.data().name || ''),
      personas,
      asistencias,
      porPersona: personas ? +(asistencias / personas).toFixed(1) : 0,
    };
  });

  // Tres bandas por tercios: las de abajo son las que menos participan.
  const ordenadas = areas.slice().sort((a, b) => a.porPersona - b.porPersona);
  const corte = Math.ceil(ordenadas.length / 3);
  ordenadas.forEach((a, i) => {
    a.banda = i < corte ? 'baja' : (i < corte * 2 ? 'media' : 'alta');
  });

  // ── LLENADO DE FÁBRICA ──────────────────────────────────────────────────
  //
  // El tablero se entrega ya calificado, para no dejarle 2,485 cuadritos en
  // blanco a José. No es aleatorio: cruza dos señales que ya están medidas.
  //
  //   del área      → asistencias por persona (qué tan enganchada está)
  //   de la actividad → personas por sesión cuando se ha aplicado
  //
  // Regla dura: un área de participación baja NUNCA sale "le gusta".
  //
  // Se guarda comprimido: una cadena por actividad, un carácter por área en el
  // orden de `areas` (g = le gusta, m = más o menos, n = no le gusta). Así son
  // ~4 KB en vez de los ~120 KB que ocuparían 2,485 claves sueltas.
  const TABLA_LLENADO = {
    alta:  { alta: 'g', media: 'g', baja: 'm' },
    media: { alta: 'g', media: 'm', baja: 'm' },
    baja:  { alta: 'm', media: 'm', baja: 'n' },
  };

  const conPop = actividades.filter((a) => a.popularidad).map((a) => a.popularidad.porSesion).sort((x, y) => x - y);
  const cortePop = (f) => conPop[Math.floor(conPop.length * f)];
  const popBajo = cortePop(1 / 3), popAlto = cortePop(2 / 3);

  const nivelDe = (a) => {
    if (!a.popularidad) return 'media';   // sin historial no se inventa nada
    const v = a.popularidad.porSesion;
    return v >= popAlto ? 'alta' : (v < popBajo ? 'baja' : 'media');
  };

  const precarga = {};
  const reparto = { g: 0, m: 0, n: 0 };
  actividades.forEach((a) => {
    const nivel = nivelDe(a);
    precarga[a.id] = areas.map((ar) => {
      const c = TABLA_LLENADO[ar.banda || 'media'][nivel];
      reparto[c]++;
      return c;
    }).join('');
  });

  console.log(`\n   Llenado de fábrica: ${reparto.g} le gusta · ` +
    `${reparto.m} más o menos · ${reparto.n} no le gusta ` +
    `(${reparto.g + reparto.m + reparto.n} de ${actividades.length * areas.length})`);

  // El horario del Consejo, traducido a ids de área y a las claves que usa
  // la semana del tablero ("Lunes|10:00"). Lo que no empate se reporta.
  const normArea = (s) => (s || '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim();
  const idPorNombre = {};
  areas.forEach((ar) => { idPorNombre[normArea(ar.nombre)] = ar.id; });

  const horario = {};
  const sinArea = [];
  Object.entries(HORARIO).forEach(([hora, dias]) => {
    Object.entries(dias).forEach(([dia, nombres]) => {
      const ids = [];
      nombres.forEach((n) => {
        const id = idPorNombre[normArea(AREA_DEL_HORARIO[n] || n)];
        if (id) ids.push(id); else sinArea.push(`${n} (${dia} ${hora})`);
      });
      if (ids.length) horario[`${dia}|${hora}`] = ids;
    });
  });

  const visitas = Object.values(horario).reduce((n, l) => n + l.length, 0);
  console.log(`\n   Horario del Consejo: ${visitas} visitas en ${Object.keys(horario).length} ranuras`);
  if (sinArea.length) {
    console.log(`   ⚠ Sin área que empate (no entran al tablero): ${sinArea.join(', ')}`);
  }

  const datos = {
    generado: new Date().toISOString(),
    precarga,
    horario,
    aspectos: ASPECTOS,
    segmentos: SEGMENTOS,
    orden: ORDEN_SEGMENTO,
    ordenAspecto: ORDEN_ASPECTO,
    actividades,
    areas,
  };

  const plantilla = fs.readFileSync(PLANTILLA, 'utf8');
  if (!plantilla.includes('/*__DATOS__*/')) {
    console.error('✗ La plantilla ya no tiene la marca /*__DATOS__*/.');
    process.exit(1);
  }
  fs.writeFileSync(SALIDA, plantilla.replace('/*__DATOS__*/', JSON.stringify(datos)));
  fs.writeFileSync(SALIDA_JSON, JSON.stringify(datos, null, 1));

  const cuenta = {};
  actividades.forEach((a) => { cuenta[a.segmento] = (cuenta[a.segmento] || 0) + 1; });

  console.log(`✓ ${actividades.length} actividades × ${areas.length} áreas → ${path.basename(SALIDA)}`);

  let aspectoPrevio = null;
  ORDEN_SEGMENTO.forEach((k) => {
    const seg = SEGMENTOS[k];
    if (seg.aspecto !== aspectoPrevio) {
      aspectoPrevio = seg.aspecto;
      const total = actividades.filter((a) => a.aspecto === seg.aspecto).length;
      console.log(`\n   ${ASPECTOS[seg.aspecto].nombre} · ${total}`);
    }
    const n = cuenta[k] || 0;
    console.log(`     ${String(n).padStart(3)}  ${seg.nombre}${n ? '' : '   ← sin actividades'}`);
  });

  const porBanda = {};
  areas.forEach((a) => { porBanda[a.banda] = (porBanda[a.banda] || 0) + 1; });
  console.log(`\n   Participación (asistencias por persona): ` +
    `${porBanda.baja} bajas · ${porBanda.media} medias · ${porBanda.alta} altas`);

  const sinGente = areas.filter((a) => !a.personas);
  if (sinGente.length) {
    console.log(`\n   ${sinGente.length} áreas sin nadie registrado: ` +
      sinGente.map((a) => a.corto).join(', '));
  }

  const conHistorial = actividades.filter((a) => a.popularidad);
  console.log(`\n   Popularidad: ${conHistorial.length} de ${actividades.length} actividades ` +
    `tienen historial de asistencia; las otras ${actividades.length - conHistorial.length} ` +
    `nunca se han aplicado y no se pueden ponderar.`);
  if (conHistorial.length) {
    const top = [...conHistorial].sort((a, b) => b.popularidad.porSesion - a.popularidad.porSesion);
    console.log('   Las que más gente juntan por sesión:');
    top.slice(0, 5).forEach((a) =>
      console.log(`     ${String(a.popularidad.porSesion).padStart(5)}  ${a.nombre} (${a.popularidad.sesiones} ses.)`));
  }

  const pendientes = actividades.filter((a) => a.segmento === 'por-clasificar');
  if (pendientes.length) {
    console.log('\n   Sin decidir, para que las resuelva José:');
    pendientes.forEach((a) => console.log(`     · ${a.nombre}`));
  }

  process.exit(0);
}

main().catch((e) => { console.error('✗', e.message); process.exit(1); });
