/* ============================================================
   PROTOTIPO — Lectura de la sesión programada
   ============================================================
   Toma la actividad del catálogo real (js/catalog-data.js) y
   reparte sus pasos sobre la duración que elija el coach.

   Las instrucciones del catálogo ya traen su tiempo escrito
   ("1 min: Lubricación...", "3 min: Circuito..."). Esos minutos
   se usan como PROPORCIÓN, no como valor fijo: así una actividad
   diseñada para 5 min se puede correr en 20 sin deformar el peso
   que José le dio a cada bloque.
   ============================================================ */

function catalogoDisponible() {
    return typeof CATALOGO_COMPLETO !== 'undefined' && Array.isArray(CATALOGO_COMPLETO);
}

function obtenerActividad(id) {
    if (!catalogoDisponible()) return null;
    return CATALOGO_COMPLETO.find((a) => a.activityId === id) || null;
}

/* "1 min: Lubricación (cuello)." → { peso: 1, texto: "Lubricación (cuello)." } */
function partirPaso(linea) {
    const t = String(linea).trim();
    const m = t.match(/^(\d+(?:[.,]\d+)?)\s*min\s*:\s*(.*)$/i);
    if (m) return { peso: parseFloat(m[1].replace(',', '.')), texto: m[2].trim() };
    return { peso: null, texto: t };
}

/* Reparte `total` segundos según `pesos`, sumando exacto y sin bloques de 0 s */
function repartir(total, pesos) {
    const n = pesos.length;
    if (!n) return [];
    if (total < n) total = n;

    const suma = pesos.reduce((a, b) => a + b, 0) || n;
    const crudos = pesos.map((p) => Math.max(1, (total * p) / suma));
    const base = crudos.map((v) => Math.max(1, Math.floor(v)));

    let falta = total - base.reduce((a, b) => a + b, 0);
    const porResto = crudos
        .map((v, i) => ({ i, frac: v - Math.floor(v) }))
        .sort((a, b) => b.frac - a.frac);

    let k = 0;
    while (falta > 0) { base[porResto[k % n].i]++; falta--; k++; }
    while (falta < 0) {
        const idx = base.indexOf(Math.max(...base));
        if (base[idx] <= 1) break;
        base[idx]--; falta++;
    }
    return base;
}

/* Devuelve los bloques cronometrados de la sesión */
function armarBloques(actividad, minutosTotales) {
    const total = Math.round(minutosTotales * 60);
    const crudos = (actividad && actividad.instrucciones) ? actividad.instrucciones.map(partirPaso) : [];

    if (!crudos.length) {
        return [{ dur: total, texto: (actividad && actividad.objetivo) || 'Sesión en curso' }];
    }

    // A los pasos sin minutos escritos se les da el promedio de los que sí traen
    const conPeso = crudos.filter((p) => p.peso !== null).map((p) => p.peso);
    const promedio = conPeso.length ? conPeso.reduce((a, b) => a + b, 0) / conPeso.length : 1;
    const pesos = crudos.map((p) => (p.peso !== null ? p.peso : promedio));

    const duraciones = repartir(total, pesos);
    return crudos.map((p, i) => ({ dur: duraciones[i], texto: p.texto }));
}

function formatoReloj(segundos) {
    const s = Math.max(0, Math.round(segundos));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

/* "45 s" / "1:30" para las etiquetas de cada bloque */
function formatoBloque(segundos) {
    return segundos < 60 ? segundos + ' s' : formatoReloj(segundos);
}
