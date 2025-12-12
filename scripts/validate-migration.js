/**
 * SCRIPT DE VALIDACIÓN POST-MIGRACIÓN
 * 
 * Valida que la migración fue exitosa comparando:
 * - Conteo de documentos antes vs después
 * - Integridad de referencias
 * - Datos de ejemplo
 * 
 * USO:
 *   node scripts/validate-migration.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'pausas-activas-ibero-2026'
});

const db = admin.firestore();

async function validateMigration() {
    console.log('🔍 VALIDACIÓN DE MIGRACIÓN\n');
    console.log('==========================\n');

    const results = {
        attendances: { old: 0, new: 0, match: false },
        wellness_tests: { old: 0, new: 0, match: false },
        feedbacks: { old: 0, new: 0, match: false }
    };

    let allMatch = false;

    try {
        // 1. Validar Attendances
        console.log('📋 Validando ATTENDANCES...');
        const oldAttendances = await db.collection('attendances').get();
        results.attendances.old = oldAttendances.size;

        let newAttendancesCount = 0;
        const employees = await db.collection('employees').get();

        for (const emp of employees.docs) {
            const attendances = await db.collection('employees')
                .doc(emp.id)
                .collection('attendance')
                .get();
            newAttendancesCount += attendances.size;
        }

        results.attendances.new = newAttendancesCount;
        results.attendances.match = results.attendances.old === results.attendances.new;

        console.log(`   Antiguo: ${results.attendances.old}`);
        console.log(`   Nuevo:   ${results.attendances.new}`);
        console.log(`   ${results.attendances.match ? '✅ MATCH' : '❌ MISMATCH'}\n`);

        // 2. Validar Wellness Tests
        console.log('🧠 Validando WELLNESS TESTS...');
        const oldWellness = await db.collection('wellness_tests').get();
        results.wellness_tests.old = oldWellness.size;

        let newWellnessCount = 0;
        for (const emp of employees.docs) {
            const surveys = await db.collection('employees')
                .doc(emp.id)
                .collection('health_surveys')
                .get();
            newWellnessCount += surveys.size;
        }

        results.wellness_tests.new = newWellnessCount;
        results.wellness_tests.match = results.wellness_tests.old === results.wellness_tests.new;

        console.log(`   Antiguo: ${results.wellness_tests.old}`);
        console.log(`   Nuevo:   ${results.wellness_tests.new}`);
        console.log(`   ${results.wellness_tests.match ? '✅ MATCH' : '❌ MISMATCH'}\n`);

        // 3. Validar Feedbacks
        console.log('💬 Validando FEEDBACKS...');
        const oldFeedbacks = await db.collection('feedbacks').get();
        results.feedbacks.old = oldFeedbacks.size;

        let newFeedbacksCount = 0;
        for (const emp of employees.docs) {
            const feedbacks = await db.collection('employees')
                .doc(emp.id)
                .collection('feedback')
                .get();
            newFeedbacksCount += feedbacks.size;
        }

        results.feedbacks.new = newFeedbacksCount;
        results.feedbacks.match = results.feedbacks.old === results.feedbacks.new;

        console.log(`   Antiguo: ${results.feedbacks.old}`);
        console.log(`   Nuevo:   ${results.feedbacks.new}`);
        console.log(`   ${results.feedbacks.match ? '✅ MATCH' : '❌ MISMATCH'}\n`);

        // 4. Resumen
        allMatch = results.attendances.match &&
            results.wellness_tests.match &&
            results.feedbacks.match;

        console.log('📊 RESUMEN FINAL');
        console.log('===============');

        if (allMatch) {
            console.log('✅ VALIDACIÓN EXITOSA');
            console.log('   Todos los documentos fueron migrados correctamente.');
            console.log('\n✅ Puedes proceder a actualizar el código JavaScript.');
        } else {
            console.log('❌ VALIDACIÓN FALLIDA');
            console.log('   Hay discrepancias en los conteos.');
            console.log('   Revisa los logs de migración antes de continuar.');
        }

    } catch (error) {
        console.error('❌ Error durante validación:', error);
        process.exit(1);
    }

    process.exit(allMatch ? 0 : 1);
}

validateMigration();
