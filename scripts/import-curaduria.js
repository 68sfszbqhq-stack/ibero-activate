/**
 * IMPORTAR CURADURÍA A FIRESTORE
 *
 * Sube a la colección activity_ratings las decisiones, calificaciones y
 * reflexiones que quedaron guardadas en el navegador durante una sesión
 * de curaduría.
 *
 * USO:
 *   node scripts/import-curaduria.js <archivo.json> --dry-run     (por defecto)
 *   node scripts/import-curaduria.js <archivo.json> --execute
 *   node scripts/import-curaduria.js <archivo.json> --execute --email tu@correo.mx
 *
 * Solo escribe las actividades que tienen decisión. Nunca borra nada.
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccount = require('../firebase-service-account.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'pausas-activas-ibero-2026'
});
const db = admin.firestore();

const COLECCION = 'activity_ratings';

// ── Argumentos ──────────────────────────────────────────────
const args = process.argv.slice(2);
const archivo = args.find(a => !a.startsWith('--'));
const ejecutar = args.includes('--execute');
const idxEmail = args.indexOf('--email');
const email = idxEmail !== -1 ? args[idxEmail + 1] : null;

if (!archivo) {
    console.error('❌ Falta el archivo JSON.\n   node scripts/import-curaduria.js backups/curaduria-respaldo-XXXX.json --dry-run');
    process.exit(1);
}

async function main() {
    const ruta = path.resolve(process.cwd(), archivo);
    if (!fs.existsSync(ruta)) {
        console.error(`❌ No existe el archivo: ${ruta}`);
        process.exit(1);
    }

    const datos = JSON.parse(fs.readFileSync(ruta, 'utf8'));
    const registros = Object.entries(datos).filter(([, v]) => v && v.decision);

    console.log(`\n${ejecutar ? '🚀 MODO EJECUCIÓN' : '🔍 MODO DRY-RUN (no escribe nada)'}`);
    console.log(`   Archivo: ${archivo}`);
    console.log(`   Colección destino: ${COLECCION}`);
    console.log(`   Registros con decisión: ${registros.length}\n`);

    // Qué hay ya en Firestore, para no pisar nada sin avisar
    const actuales = await db.collection(COLECCION).get();
    const existentes = new Set(actuales.docs.map(d => d.id));
    console.log(`   Documentos ya existentes en Firestore: ${existentes.size}\n`);

    let nuevos = 0, sobrescritos = 0;
    const detalle = [];

    for (const [id, r] of registros) {
        const yaEstaba = existentes.has(id);
        if (yaEstaba) sobrescritos++; else nuevos++;
        detalle.push({
            id,
            estado: yaEstaba ? 'SOBRESCRIBE' : 'nuevo',
            decision: r.decision,
            rating: r.rating || '—',
            reflexion: (r.reflexion || '').replace(/\s+/g, ' ').slice(0, 58) || '(sin reflexión)'
        });
    }

    detalle.forEach(d => {
        const marca = d.decision === 'conservar' ? '✅' : '🗑️ ';
        const aviso = d.estado === 'SOBRESCRIBE' ? ' ⚠️ SOBRESCRIBE' : '';
        console.log(`   ${marca} ${d.id.padEnd(7)} ${String(d.rating).padEnd(2)}★  ${d.reflexion}${aviso}`);
    });

    console.log(`\n   Nuevos: ${nuevos}   Sobrescribe: ${sobrescritos}`);

    if (!ejecutar) {
        console.log('\n✋ Dry-run terminado. Nada se escribió.');
        console.log('   Para aplicarlo: agrega --execute\n');
        return;
    }

    console.log('\n⏳ Escribiendo...');
    const lote = db.batch();
    for (const [id, r] of registros) {
        const ref = db.collection(COLECCION).doc(id);
        lote.set(ref, {
            activityId: id,
            name: r.name || '',
            segmento: r.segmento || 'sin-clasificar',
            decision: r.decision,
            rating: (typeof r.rating === 'number' && r.rating > 0) ? r.rating : null,
            reflexion: r.reflexion || '',
            updatedAtMs: r.updatedAtMs || Date.now(),
            updatedBy: email || r.updatedBy || 'admin',
            importadoEl: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    }
    await lote.commit();
    console.log(`✅ Listo. ${registros.length} documentos escritos en ${COLECCION}.\n`);
}

main().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
