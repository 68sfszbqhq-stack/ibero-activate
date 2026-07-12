// ============================================================
// MIGRACIÓN: Asignar `periodId` a asistencias existentes
// ============================================================
// Estampa el campo `periodId` en TODAS las asistencias que aún no lo
// tienen, tanto en la colección top-level `attendances` como en las
// subcolecciones `employees/{id}/attendance`.
//
// Cómo decide el periodo de cada asistencia:
//   1. Lee los periodos de la colección `periods`.
//   2. Para cada asistencia, busca el periodo cuyo rango
//      [startDate, endDate] contiene su `date`.
//   3. Si ninguno coincide, usa el periodo marcado `isActive`, y si no
//      hay activo, usa un periodo "Histórico" que crea automáticamente.
//
// Uso:
//   node scripts/assign-periods.js --dry-run   (solo reporta, NO escribe)
//   node scripts/assign-periods.js --execute   (aplica los cambios)
// ============================================================

const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'pausas-activas-ibero-2026'
});

const db = admin.firestore();

const DRY_RUN = !process.argv.includes('--execute');

// Devuelve el id del periodo al que corresponde una fecha "YYYY-MM-DD".
function resolvePeriodId(dateStr, periods, activePeriodId, fallbackId) {
    if (dateStr) {
        const match = periods.find(p => {
            if (!p.startDate) return false;
            const afterStart = dateStr >= p.startDate;
            const beforeEnd = !p.endDate || dateStr <= p.endDate;
            return afterStart && beforeEnd;
        });
        if (match) return match.id;
    }
    return activePeriodId || fallbackId;
}

async function ensureFallbackPeriod(periods) {
    // Si ya existe un "Histórico", reutilízalo.
    const existing = periods.find(p => p.season === 'historico');
    if (existing) return existing.id;

    if (DRY_RUN) {
        console.log('  (dry-run) Se crearía un periodo "Histórico" para asistencias sin rango.');
        return '__HISTORICO_PLACEHOLDER__';
    }

    const ref = await db.collection('periods').add({
        name: 'Histórico (migrado)',
        season: 'historico',
        startDate: '2000-01-01',
        endDate: null,
        totalWeeks: 19,
        macrocycleId: null,
        isActive: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`  Creado periodo "Histórico (migrado)" con id ${ref.id}`);
    return ref.id;
}

async function processCollection(getSnapshot, label, periods, activePeriodId, fallbackId) {
    const snapshot = await getSnapshot();
    let toUpdate = 0;
    let alreadyOk = 0;
    const perPeriod = {};

    let batch = db.batch();
    let batchCount = 0;

    for (const doc of snapshot.docs) {
        const data = doc.data();
        if (data.periodId) { alreadyOk++; continue; }

        const periodId = resolvePeriodId(data.date, periods, activePeriodId, fallbackId);
        perPeriod[periodId] = (perPeriod[periodId] || 0) + 1;
        toUpdate++;

        if (!DRY_RUN) {
            batch.update(doc.ref, { periodId });
            batchCount++;
            if (batchCount >= 400) {
                await batch.commit();
                batch = db.batch();
                batchCount = 0;
            }
        }
    }

    if (!DRY_RUN && batchCount > 0) await batch.commit();

    console.log(`\n[${label}] total=${snapshot.size}  ya tenían periodId=${alreadyOk}  por asignar=${toUpdate}`);
    Object.entries(perPeriod).forEach(([pid, n]) => console.log(`    → ${pid}: ${n}`));
    return toUpdate;
}

async function main() {
    console.log(`\n=== assign-periods.js — modo: ${DRY_RUN ? 'DRY-RUN (sin escribir)' : 'EXECUTE'} ===`);

    // Cargar periodos
    const periodsSnap = await db.collection('periods').get();
    const periods = periodsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const active = periods.find(p => p.isActive);
    const activePeriodId = active ? active.id : null;

    console.log(`Periodos encontrados: ${periods.length}. Activo: ${activePeriodId || '(ninguno)'}`);

    // El periodo "Histórico" solo se necesita si NO hay periodo activo al que
    // caer. Con un activo definido, toda asistencia sin match de fecha usa ese,
    // así que evitamos crear un periodo vacío.
    const fallbackId = activePeriodId ? null : await ensureFallbackPeriod(periods);

    // 1. Top-level attendances
    await processCollection(
        () => db.collection('attendances').get(),
        'attendances (top-level)',
        periods, activePeriodId, fallbackId
    );

    // 2. Subcolecciones employees/{id}/attendance (collectionGroup)
    await processCollection(
        () => db.collectionGroup('attendance').get(),
        'attendance (subcolecciones)',
        periods, activePeriodId, fallbackId
    );

    console.log(`\n=== ${DRY_RUN ? 'DRY-RUN terminado. Ejecuta con --execute para aplicar.' : 'Migración aplicada.'} ===\n`);
    process.exit(0);
}

main().catch(err => {
    console.error('Error en la migración:', err);
    process.exit(1);
});
