/**
 * Script para eliminar documentos huérfanos
 * Elimina datos de usuarios de prueba que ya no existen
 */

const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'pausas-activas-ibero-2026'
});

const db = admin.firestore();

// IDs de documentos huérfanos identificados
const ORPHANED_DOCS = {
    attendances: ['4WG5N5IPIAnh669W5kgi', 'a9PkX7FGxCLMHeZfttEZ'],
    wellness_tests: ['TQyoCXe984aH0a2WA2aj'],
    feedbacks: ['AqYooyFvXJS6PhEaagxj', 'QFk8wtNsD4blz3jZckf4', 'nBwiSLAE8bcjfrqxghhl']
};

async function cleanOrphanedData() {
    console.log('🧹 LIMPIEZA DE DATOS HUÉRFANOS\n');
    console.log('================================\n');

    let totalDeleted = 0;

    try {
        // 1. Eliminar attendances huérfanos
        console.log('📋 Eliminando attendances huérfanos...');
        for (const docId of ORPHANED_DOCS.attendances) {
            await db.collection('attendances').doc(docId).delete();
            console.log(`   ✅ Eliminado: ${docId}`);
            totalDeleted++;
        }

        // 2. Eliminar wellness tests huérfanos
        console.log('\n🧠 Eliminando wellness tests huérfanos...');
        for (const docId of ORPHANED_DOCS.wellness_tests) {
            await db.collection('wellness_tests').doc(docId).delete();
            console.log(`   ✅ Eliminado: ${docId}`);
            totalDeleted++;
        }

        // 3. Eliminar feedbacks huérfanos
        console.log('\n💬 Eliminando feedbacks huérfanos...');
        for (const docId of ORPHANED_DOCS.feedbacks) {
            await db.collection('feedbacks').doc(docId).delete();
            console.log(`   ✅ Eliminado: ${docId}`);
            totalDeleted++;
        }

        console.log('\n✨ LIMPIEZA COMPLETADA');
        console.log('======================');
        console.log(`Total eliminados: ${totalDeleted} documentos`);
        console.log('\n✅ Ahora ejecuta la validación de nuevo con: npm run validate');

    } catch (error) {
        console.error('❌ Error durante limpieza:', error);
        process.exit(1);
    }

    process.exit(0);
}

cleanOrphanedData();
