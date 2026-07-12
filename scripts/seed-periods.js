// ============================================================
// SIEMBRA DE PERIODOS (Temporadas) - IBERO ACTÍVATE
// ============================================================
// Crea los periodos Primavera / Verano / Otoño 2026 con las fechas
// confirmadas por el usuario. Idempotente: si un periodo con el mismo
// `name` ya existe, lo actualiza en vez de duplicarlo.
//
// Uso:
//   node scripts/seed-periods.js --dry-run   (muestra lo que haría)
//   node scripts/seed-periods.js --execute   (aplica en Firestore)
// ============================================================

const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'pausas-activas-ibero-2026'
});

const db = admin.firestore();
const DRY_RUN = !process.argv.includes('--execute');

// Fechas confirmadas por el usuario (2026):
//   Verano activo hoy (11-jul) hasta el 15-jul. Otoño queda listo para
//   marcarse activo el 17-ago (un clic en la pantalla Periodos).
const PERIODS = [
    {
        name: 'Primavera 2026',
        season: 'primavera',
        startDate: '2026-01-12',
        endDate: '2026-05-22',
        totalWeeks: 19,
        macrocycleId: null,
        isActive: false
    },
    {
        name: 'Verano 2026',
        season: 'verano',
        startDate: '2026-06-01',
        endDate: '2026-07-15',
        totalWeeks: 6,
        macrocycleId: null,
        isActive: true   // activo hoy (11-jul, dentro del rango)
    },
    {
        name: 'Otoño 2026',
        season: 'otono',
        startDate: '2026-08-17',
        endDate: '2026-12-09',
        totalWeeks: 17,
        macrocycleId: null,
        isActive: false  // márcalo activo cuando arranque (17-ago)
    }
];

async function main() {
    console.log(`\n=== seed-periods.js — modo: ${DRY_RUN ? 'DRY-RUN (sin escribir)' : 'EXECUTE'} ===\n`);

    // Periodos existentes (para no duplicar por nombre)
    const existingSnap = await db.collection('periods').get();
    const byName = {};
    existingSnap.forEach(doc => { byName[(doc.data().name || '').trim()] = doc.id; });

    for (const p of PERIODS) {
        const existingId = byName[p.name];
        const payload = { ...p, updatedAt: admin.firestore.FieldValue.serverTimestamp() };

        if (existingId) {
            console.log(`↻ Actualizar "${p.name}" (${p.startDate}→${p.endDate}) activo=${p.isActive}  [id ${existingId}]`);
            if (!DRY_RUN) await db.collection('periods').doc(existingId).update(payload);
        } else {
            console.log(`＋ Crear "${p.name}" (${p.startDate}→${p.endDate}) activo=${p.isActive}`);
            if (!DRY_RUN) {
                payload.createdAt = admin.firestore.FieldValue.serverTimestamp();
                await db.collection('periods').add(payload);
            }
        }
    }

    console.log(`\n=== ${DRY_RUN ? 'DRY-RUN terminado. Ejecuta con --execute para aplicar.' : 'Periodos sembrados.'} ===\n`);
    process.exit(0);
}

main().catch(err => {
    console.error('Error sembrando periodos:', err);
    process.exit(1);
});
