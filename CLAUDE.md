# IBERO ACTÍVATE

Sistema de asistencia y feedback para el programa de pausas activas de **IBERO Puebla**. Es la app del trabajo estable de José: la usan empleados reales de la universidad, no es un demo.

## Contexto de uso
- **Admin** (`/admin`): pase de lista por departamento, dashboards de asistencia, inventario, reportes exportables, periodización.
- **Empleado** (`/employee`): registra su participación, deja feedback con estrellas y comentarios, ve su progreso.
- Tiene gamificación: puntos, insignias y rachas. Eso es lo que sostiene la participación — al tocar esa lógica, cuidar que nadie pierda puntos ya ganados.

## Stack
HTML + CSS + JavaScript vanilla (sin framework). Firebase: Firestore + Auth. Capacitor para el build de iOS (`ios/`).

## Comandos
```bash
npm run dev          # servidor local en :8080
npm run backup       # respaldo antes de cualquier migración
npm run validate     # valida el estado de la migración
```

## Despliegue
Se publica en **GitHub Pages** al hacer push a `main`: https://68sfszbqhq-stack.github.io/ibero-activate/

## Reglas al trabajar aquí
- `firebase-service-account.json` es una llave real de administrador. Está en `.gitignore` y **nunca** debe commitearse ni imprimirse en pantalla.
- Los scripts de `scripts/` tocan datos de producción. Correr siempre `--dry-run` antes de `--execute`, y `npm run backup` antes de migrar.
- Hay tres copias del frontend (`/`, `www/`, `ios/App/App/public/`). Si cambias `js/firebase-config.js` o lógica compartida, verifica si hay que sincronizar las otras.

## Tablero de áreas (`tablero-areas.html`)

Matriz para que la jefatura decida, área por área, qué actividades quiere:
**71 actividades curadas en filas × 35 áreas en columnas** = 2,485 cuadritos.
Se toca una celda y cicla verde (le gusta) → azul (más o menos) → rojo (no le
gusta) → vacío.

**Llenarlos uno por uno no es viable**, así que hay tres atajos:

1. **Barras de banda.** Las filas de aspecto y de segmento traen una barra por
   área. Un toque califica de golpe todas las actividades de ese grupo para esa
   área: 3 toques por área cubren sus 71 (105 en total), o 12 si se quiere el
   detalle por segmento. Si el grupo quedó dispar la barra sale **rayada**
   ("a medias"), y el siguiente toque lo deja parejo antes de seguir el ciclo.
2. **Rellenar vacías.** Llena de una vez todo lo que falte, sin tocar lo ya
   calificado. Dos modos:
   - **Con base en tus datos** (el bueno). Cruza dos señales reales ya
     guardadas: las *asistencias por persona* de cada área (`attendances` /
     `employees`, en tres bandas por tercios) y la *concurrencia por sesión* de
     cada actividad (`popularidadDe`, 29 de 71 tienen historial; el resto cuenta
     como término medio). La tabla está en `TABLA_LLENADO`, y respeta la regla
     que puso José: **un área de participación baja nunca sale "Le gusta"**.
     Con los datos de hoy da 802 sí · 1,575 más o menos · 108 no.
   - **Todo igual**, con un solo valor, para poner una base plana.

   No hay modo aleatorio a propósito: el tablero alimenta una decisión real del
   Consejo, y un número inventado no se puede defender si alguien pregunta de
   dónde salió.
3. **Contador de avance** en la barra de herramientas: cuántas van de 2,485.

Todo lo masivo entra al historial como un solo paso, así que **Deshacer**
revierte una barra de 25 celdas o un rellenado de 2,465 de un tirón.
La segunda pestaña es la semana de visitas: lunes a viernes de 10:00 a 13:00
en pausas de `PASO` minutos (hoy **25**), 7 al día y **35 ranuras** para 35 áreas.

- **Un área puede repetirse.** Las ranuras que sobran se reparten como segundas
  pausas; la 2ª visita se marca con una insignia en la cuadrícula.
- **En una ranura caben hasta `TOPE_POR_RANURA` áreas** (4), porque hay áreas
  que se juntan en la misma pausa. El selector es de varias: se marcan con
  paloma y al llegar al tope las demás se deshabilitan.
- El diálogo ordena por menos visitas y más personas; el panel lista las
  candidatas a segunda pausa de mayor a menor plantilla. El número de personas
  sale de `employees` (`areaId`).

`estado.semana[dia|hora]` es **una lista** de ids de área. `normalizarSemana()`
corre al cargar y al importar un respaldo, y guarda de una vez:

1. Convierte el formato viejo (un id suelto) a lista.
2. Si cambió `PASO`, las horas guardadas ya no existen en la rejilla. En vez de
   borrarlas **las reacomoda por posición dentro de cada día** (la 1ª pausa del
   lunes sigue siendo la 1ª del lunes). Lo que ya no cabe va a
   `estado.desacomodadas` y sale en un aviso ámbar arriba de la semana, hasta
   que José lo da por entendido. Nunca se tira nada en silencio.

**Al cambiar `PASO` hay que pensar en cuántas ranuras quedan:** con 20 min eran
45 (10 de sobra para segundas pausas); con 25 min son 35, justo el número de
áreas. Para dar segundas pausas con 25 min hay que juntar áreas en una ranura.

Las actividades **no** van por los nueve segmentos de `js/segments-data.js`.
Van por la estructura del documento del Consejo de Directores, "Pausas Activas
para el Cuidado de la Comunidad: Movimiento con Sentido Ignaciano":
**tres aspectos y, dentro de cada uno, sus segmentos** (en el documento los
segmentos son las viñetas • y las actividades las sub-viñetas o).

| Aspecto | Segmentos |
|---|---|
| Cura Personalis | Activaciones físicas saludables · Ejercicios de respiración consciente · Pausas de estiramiento con reflexión · Estrategias de manejo del estrés |
| Comunidad para el Bien Común | Juegos cooperativos · Retos grupales · Dinámicas de confianza · Actividades de integración inter áreas |
| Magis y Servicio | Retos colaborativos · Actividades de liderazgo compartido · Reflexiones breves sobre servicio · Dinámicas de ayuda mutua |

Las que caben en dos segmentos quedan en **Por clasificar**, con el motivo
escrito, y se resuelven desde el propio tablero con el botón de cada fila.
Los segmentos que el documento pide y no tienen ninguna actividad se muestran
igual, en gris y con su aviso, para que la falta no se pierda de vista.

Es un archivo suelto, **sin login y sin Firebase en tiempo de uso**. Se abre en
el navegador y guarda en `localStorage`. Si el navegador no deja guardar
(pasa al abrirlo con doble clic en algunos casos), sale un aviso rojo arriba
en lugar de fallar callado.

```bash
node scripts/build-tablero.js           # regenera desde Firestore
node scripts/build-tablero.js --cache   # solo rearma el HTML con la plantilla,
                                        # usando scripts/datos-tablero.json
```

`--cache` sirve cuando solo cambió la plantilla, y cuando se agota la cuota de
lectura diaria de Firestore (pasa: `RESOURCE_EXHAUSTED`).

**El tablero se entrega ya calificado.** El generador precalcula los 2,485
cuadritos con la misma regla del punto 2 de abajo y los incrusta comprimidos
(`datos.precarga`: una cadena por actividad, un carácter por área — `g`/`m`/`n`).
`aplicarPrecarga()` los pone al abrir **solo la primera vez**: si ya hay algo
calificado, o si se usó *Limpiar*, no vuelve a tocar nada. La semana de visitas
nunca se toca.

El generador lee `activity_ratings` (solo las de `decision: 'conservar'`),
`activities` y `areas`, y las incrusta en `scripts/tablero-plantilla.html`.
Hay que volver a correrlo cuando cambie la curaduría o se den de alta áreas.

En el generador viven, y ahí se editan:
- `ASPECTOS` y `SEGMENTOS` — la estructura del documento, en su orden.
- `CLASIFICACION` — qué actividad va en cada segmento, por nombre. Lo que no
  aparece cae en "Por clasificar". Avisa si un nombre no existe en el catálogo.
- `DUDAS` — por qué quedó pendiente cada una. Se muestra al momento de decidir.
- `CORTOS` y `SIGLAS` — nombres cortos de las áreas para el encabezado.

**Ojo:** este archivo está en la raíz, así que se publica en GitHub Pages al
hacer push. Es una página abierta con los nombres de las áreas y del catálogo.

## El .docx para la jefatura (`Pausas Activas para el Cuidado de la Comunidad.docx`)

Reproduce el documento del Consejo de Directores **tal cual** —mismo título,
mismos tres aspectos, mismos doce segmentos, mismo texto de Meta Crucial,
Meta 2030 y Meta Anual— con una sola diferencia: bajo cada segmento van las
actividades reales del catálogo curado en vez de los ejemplos sueltos.

```bash
node scripts/build-tablero.js   # primero: deja scripts/datos-tablero.json
python3 scripts/build-docx.py   # después: arma el Word
```

El Word **no** reclasifica nada: lee `scripts/datos-tablero.json`, que produce
el generador del tablero. Una sola fuente para los dos, para que nunca se
contradigan. El texto del documento está literal en `build-docx.py`
(constantes `TITULO`, `ASPECTOS`, `META`); si la jefatura cambia una frase,
se cambia ahí.

Detalles que resuelve:
- Las 12 actividades sin clasificar y los segmentos vacíos van a un **anexo**
  al final, con su motivo. No se esconden ni se meten a fuerza en un segmento.
- El catálogo trae tres nombres repetidos (quedaron duplicados en Firestore).
  En el documento se muestran una sola vez.
- Las sangrías de los dos niveles de viñeta se fijan a mano (`SANGRIA`), porque
  las plantillas de Word definen `List Bullet` y `List Bullet 2` con la misma
  y entonces se pierde qué actividad cuelga de qué segmento.
- La fuente es Calibri. José no la tiene en el sistema, pero viene dentro de
  Microsoft Word, así que en Word se ve bien. Quick Look la sustituye por una
  serif: eso es del visor, no del archivo.

## Excel y PDF del tablero

```bash
python3 scripts/build-entregables.py
```

Produce en la raíz:
- `Tablero de áreas - Pausas Activas.xlsx` — hoja **Tablero** con la matriz
  coloreada (fila congelada y primeras columnas fijas), agrupada por segmento;
  hoja **Áreas** con personas, asistencias, asistencias por persona y la banda
  de participación de cada área.
- `Tablero de áreas - Pausas Activas.pdf` — la matriz completa en **una sola
  hoja** de tamaño calculado, con los nombres de área de canto y leyenda.

Lee `scripts/datos-tablero.json`, la misma fuente del tablero y del .docx, y
toma las calificaciones de `precarga`. **Ojo:** lo que José cambie después en
el navegador vive en su `localStorage` y no llega aquí; para exportar eso se usa
el botón **Excel** del propio tablero.

Necesita `openpyxl` y `reportlab` (`pip3 install --user reportlab`).

## El calendario del Consejo en la app (`scripts/aplicar-calendario-consejo.js`)

El documento del Consejo trae, además de los tres aspectos, una **propuesta de
actividades de 17 semanas**: una para lunes y martes, otra para miércoles y
jueves y una tercera para el viernes. Este script la vuelca a
`weekly_schedules`, que es lo que lee `admin/calendar.html`.

```bash
node scripts/aplicar-calendario-consejo.js --dry-run   # imprime el plan
node scripts/aplicar-calendario-consejo.js --execute   # escribe en Firestore
```

- **La Semana 1 arrancó el lunes 17 de agosto de 2026**, así que las 17 caen en
  `2026-W33` … `2026-W49`. Esa fecha es el único dato que hay que mover si el
  programa se recorre: la constante `LUNES_SEMANA_1`.
- El id de semana **no es ISO 8601**. `getWeekId()` está copiada tal cual de
  `js/calendar.js`; si allá cambia, aquí también, o los documentos no empatan.
- El documento escribe algunos nombres distinto a como están en el catálogo
  ("El nudo humano" / "Nudo Humano"). Esos empates viven en `ALIAS`, para no
  dar de alta fichas duplicadas. Los nombres repetidos en Firestore se
  resuelven en `DESEMPATE`, eligiendo la ficha que sí trae código de catálogo.
- La ubicación sale del `type` de la ficha: `outdoor` → Explanada, lo demás →
  Oficina del área.
- Antes de escribir deja el estado anterior en `scripts/backups/` con fecha
  (esa carpeta está gitignoreada).

Cuatro actividades que el documento pide **no existían en el catálogo** y el
script las da de alta con la ficha didáctica del propio documento (objetivo,
descripción, materiales, duración): Campo minado (`FG-19`), Pasa el balón
(`FG-20`), La torre imposible (`FG-21`) y Boggle Party (`VD-05`, el código que ya
tenía en la curaduría aunque nunca tuvo ficha en `activities`). Quedan
marcadas con `origen: 'Documento del Consejo de Directores'`.

## Semáforo de áreas en el pase de lista

En `admin/attendance.html` cada área trae un punto de color con lo que lleva
sin pase de lista. Tenía tres escalones (verde ≤3, amarillo ≤6, rojo el resto)
y con la realidad del programa **33 de 35 áreas salían rojas**: el semáforo ya
no distinguía nada. `trafficLight()` en `js/attendance.js` tiene ahora cinco:

| Color | Rango |
|---|---|
| 🟢 verde `#10b981` | al día, ≤3 días |
| 🟡 amarillo `#f59e0b` | esta semana, 4–7 días |
| 🟠 naranja `#f97316` | ya se pasó una semana, 8–14 días |
| 🔴 rojo `#ef4444` | dos semanas o más, 15–30 días |
| 🟣 morado `#7c3aed` | ninguna visita en los últimos 30 días |

El morado no es "más rojo": es **sin dato**. `getAreaRecency()` consulta solo
30 días a propósito (una lectura acotada), así que todo lo anterior a ese corte
es indistinguible y se reporta como tal en vez de fingir un número.

La leyenda de la barra de filtros en `admin/attendance.html` lista los cinco;
si se toca un rango hay que moverla también. El semáforo vive **solo** en la
copia raíz: `www/` e `ios/App/App/public/` no lo tienen, no hay que sincronizar.
