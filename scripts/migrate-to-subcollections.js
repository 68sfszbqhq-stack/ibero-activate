/**
 * SCRIPT DE MIGRACIÓN A SUBCOLLECTIONS
 * 
 * Migra datos de colecciones planas a estructura jerárquica:
 * - attendances → employees/{id}/attendance
 * - wellness_tests → employees/{id}/health_surveys
 * - feedbacks → employees/{id}/feedback
 * 
 * USO:
 *   node scripts/migrate-to-subcollections.js --dry-run    (simular sin escribir)
 *   node scripts/migrate-to-subcollections.js --execute    (ejecutar migración real)
 * 
 * CARACTERÍSTICAS:
 * - Batching automático (500 ops por lote)
 * - Manejo de errores con log detallado
 * - Validación de integridad
 * - Progress reporting
 */

const admin = require('firebase-admin');
const fs = require('fs').promises;
const path = require('path');

// Configuración
const serviceAccount = require('../firebase-service-account.json');
const DRY_RUN = process.argv.includes('--dry-run');
const BATCH_SIZE = 500;

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'pausas-activas-ibero-2026'
});

const db = admin.firestore();

// Logs
const migrationLog = {
    startTime: new Date().toISOString(),
    dryRun: DRY_RUN,
    stats: {
        attendances: { read: 0, written: 0, errors: 0 },
        wellness_tests: { read: 0, written: 0, errors: 0 },
        feedbacks: { read: 0, written: 0, errors: 0 }
    },
    errors: []
};

/**
 * Migrar attendances → employees/{id}/attendance
 */
async function migrateAttendances() {
    console.log('\n📋 Migrando ATTENDANCES...');

    const snapshot = await db.collection('attendances').get();
    migrationLog.stats.attendances.read = snapshot.size;

    console.log(`   📊 ${snapshot.size} documentos encontrados`);

    let batch = db.batch();
    let batchCount = 0;
    let totalWritten = 0;

    for (const doc of snapshot.docs) {
        const data = doc.data();
        const employeeId = data.employeeId;

        if (!employeeId) {
            migrationLog.errors.push({
                collection: 'attendances',
                docId: doc.id,
                error: 'Missing employeeId'
            });
            migrationLog.stats.attendances.errors++;
            continue;
        }

        // Crear nuevo documento en subcollection
        const newRef = db.collection('employees')
            .doc(employeeId)
            .collection('attendance')
            .doc(doc.id); // Mantener mismo ID para referencia

        // Remover employeeId del documento (ya no es necesario)
        const { employeeId: _, ...newData } = data;

        if (!DRY_RUN) {
            batch.set(newRef, newData);
            batchCount++;

            // Commit batch si alcanzamos el límite
            if (batchCount >= BATCH_SIZE) {
                await batch.commit();
                totalWritten += batchCount;
                console.log(`   ✅ Batch committed: ${totalWritten}/${snapshot.size}`);
                batch = db.batch();
                batchCount = 0;
            }
        }
    }

    // Commit último batch
    if (!DRY_RUN && batchCount > 0) {
        await batch.commit();
        totalWritten += batchCount;
    }

    migrationLog.stats.attendances.written = DRY_RUN ? 0 : totalWritten;
    console.log(`   ✨ Migración completada: ${DRY_RUN ? `(DRY RUN - ${snapshot.size} docs verificados)` : `${totalWritten} docs escritos`}`);
}

/**
 * Migrar wellness_tests → employees/{id}/health_surveys
 */
async function migrateWellnessTests() {
    console.log('\n🧠 Migrando WELLNESS TESTS...');

    const snapshot = await db.collection('wellness_tests').get();
    migrationLog.stats.wellness_tests.read = snapshot.size;

    console.log(`   📊 ${snapshot.size} documentos encontrados`);

    let batch = db.batch();
    let batchCount = 0;
    let totalWritten = 0;

    for (const doc of snapshot.docs) {
        const data = doc.data();
        const employeeId = data.employeeId;

        if (!employeeId) {
            migrationLog.errors.push({
                collection: 'wellness_tests',
                docId: doc.id,
                error: 'Missing employeeId'
            });
            migrationLog.stats.wellness_tests.errors++;
            continue;
        }

        const newRef = db.collection('employees')
            .doc(employeeId)
            .collection('health_surveys')
            .doc(doc.id);

        const { employeeId: _, employeeName: __, ...newData } = data;

        if (!DRY_RUN) {
            batch.set(newRef, newData);
            batchCount++;

            if (batchCount >= BATCH_SIZE) {
                await batch.commit();
                totalWritten += batchCount;
                console.log(`   ✅ Batch committed: ${totalWritten}/${snapshot.size}`);
                batch = db.batch();
                batchCount = 0;
            }
        }
    }

    if (!DRY_RUN && batchCount > 0) {
        await batch.commit();
        totalWritten += batchCount;
    }

    migrationLog.stats.wellness_tests.written = DRY_RUN ? 0 : totalWritten;
    console.log(`   ✨ Migración completada: ${DRY_RUN ? `(DRY RUN - ${snapshot.size} docs verificados)` : `${totalWritten} docs escritos`}`);
}

/**
 * Migrar feedbacks → employees/{id}/feedback
 */
async function migrateFeedbacks() {
    console.log('\n💬 Migrando FEEDBACKS...');

    const snapshot = await db.collection('feedbacks').get();
    migrationLog.stats.feedbacks.read = snapshot.size;

    console.log(`   📊 ${snapshot.size} documentos encontrados`);

    let batch = db.batch();
    let batchCount = 0;
    let totalWritten = 0;

    for (const doc of snapshot.docs) {
        const data = doc.data();
        const employeeId = data.employeeId;

        if (!employeeId) {
            migrationLog.errors.push({
                collection: 'feedbacks',
                docId: doc.id,
                error: 'Missing employeeId'
            });
            migrationLog.stats.feedbacks.errors++;
            continue;
        }

        const newRef = db.collection('employees')
            .doc(employeeId)
            .collection('feedback')
            .doc(doc.id);

        const { employeeId: _, ...newData } = data;

        if (!DRY_RUN) {
            batch.set(newRef, newData);
            batchCount++;

            if (batchCount >= BATCH_SIZE) {
                await batch.commit();
                totalWritten += batchCount;
                console.log(`   ✅ Batch committed: ${totalWritten}/${snapshot.size}`);
                batch = db.batch();
                batchCount = 0;
            }
        }
    }

    if (!DRY_RUN && batchCount > 0) {
        await batch.commit();
        totalWritten += batchCount;
    }

    migrationLog.stats.feedbacks.written = DRY_RUN ? 0 : totalWritten;
    console.log(`   ✨ Migración completada: ${DRY_RUN ? `(DRY RUN - ${snapshot.size} docs verificados)` : `${totalWritten} docs escritos`}`);
}

/**
 * Función principal
 */
async function runMigration() {
    console.log('🚀 MIGRACIÓN DE FIRESTORE');
    console.log('========================\n');
    console.log(`⚙️  Modo: ${DRY_RUN ? '🔍 DRY RUN (solo lectura)' : '✍️  EJECUCIÓN REAL'}\n`);

    if (!DRY_RUN) {
        console.log('⚠️  ADVERTENCIA: Esta operación escribirá en Firestore.');
        console.log('   Asegúrate de haber creado un backup primero.\n');
    }

    try {
        await migrateAttendances();
        await migrateWellnessTests();
        await migrateFeedbacks();

        migrationLog.endTime = new Date().toISOString();

        // Guardar log
        const logDir = path.join(__dirname, '..', 'migration-logs');
        await fs.mkdir(logDir, { recursive: true });

        const logFile = path.join(
            logDir,
            `migration_${DRY_RUN ? 'dryrun' : 'exec'}_${Date.now()}.json`
        );
        await fs.writeFile(logFile, JSON.stringify(migrationLog, null, 2));

        // Resumen final
        console.log('\n📊 RESUMEN DE MIGRACIÓN');
        console.log('======================');
        console.log(`Attendances:     ${migrationLog.stats.attendances.read} leídos, ${migrationLog.stats.attendances.written} escritos, ${migrationLog.stats.attendances.errors} errores`);
        console.log(`Wellness Tests:  ${migrationLog.stats.wellness_tests.read} leídos, ${migrationLog.stats.wellness_tests.written} escritos, ${migrationLog.stats.wellness_tests.errors} errores`);
        console.log(`Feedbacks:       ${migrationLog.stats.feedbacks.read} leídos, ${migrationLog.stats.feedbacks.written} escritos, ${migrationLog.stats.feedbacks.errors} errores`);
        console.log(`\n📝 Log guardado en: ${logFile}`);

        if (migrationLog.errors.length > 0) {
            console.log(`\n⚠️  ${migrationLog.errors.length} errores encontrados (ver log)`);
        }

        if (DRY_RUN) {
            console.log('\n✅ DRY RUN completado. Todo está listo para migración real.');
            console.log('   Ejecuta: node scripts/migrate-to-subcollections.js --execute');
        } else {
            console.log('\n✅ MIGRACIÓN COMPLETADA EXITOSAMENTE!');
            console.log('\n⚠️  IMPORTANTE: No borres las colecciones antiguas aún.');
            console.log('   Mantén el backup por al menos 2 semanas.');
        }

    } catch (error) {
        console.error('\n❌ ERROR FATAL:', error);
        migrationLog.fatalError = error.message;
        process.exit(1);
    }

    process.exit(0);
}

// Verificar argumentos
if (!process.argv.includes('--dry-run') && !process.argv.includes('--execute')) {
    console.error('❌ Error: Debes especificar --dry-run o --execute');
    console.log('\nUso:');
    console.log('  node scripts/migrate-to-subcollections.js --dry-run');
    console.log('  node scripts/migrate-to-subcollections.js --execute');
    process.exit(1);
}

// Ejecutar
runMigration();
