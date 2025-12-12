/**
 * Script de diagnóstico para investigar datos faltantes
 */

const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'pausas-activas-ibero-2026'
});

const db = admin.firestore();

async function diagnose() {
    console.log('🔍 DIAGNÓSTICO DE DATOS FALTANTES\n');

    // 1. Buscar attendances que no se migraron
    console.log('📋 AttendancesNO migraron:');
    const oldAttendances = await db.collection('attendances').get();
    const employees = await db.collection('employees').get();

    const employeeIds = new Set(employees.docs.map(d => d.id));
    let orphanedAttendances = [];

    for (const doc of oldAttendances.docs) {
        const employeeId = doc.data().employeeId;
        if (!employeeId) {
            console.log(`   ❌ ${doc.id}: Sin employeeId`);
            orphanedAttendances.push(doc.id);
        } else if (!employeeIds.has(employeeId)) {
            console.log(`   ❌ ${doc.id}: employeeId "${employeeId}" no existe en employees`);
            orphanedAttendances.push(doc.id);
        }
    }

    console.log(`\n   Total huérfanos: ${orphanedAttendances.length}\n`);

    // 2. Buscar wellness tests
    console.log('🧠 Wellness Tests NO migrados:');
    const oldWellness = await db.collection('wellness_tests').get();
    let orphanedWellness = [];

    for (const doc of oldWellness.docs) {
        const employeeId = doc.data().employeeId;
        if (!employeeId) {
            console.log(`   ❌ ${doc.id}: Sin employeeId`);
            orphanedWellness.push(doc.id);
        } else if (!employeeIds.has(employeeId)) {
            console.log(`   ❌ ${doc.id}: employeeId "${employeeId}" no existe`);
            orphanedWellness.push(doc.id);
        }
    }

    console.log(`\n   Total huérfanos: ${orphanedWellness.length}\n`);

    // 3. Buscar feedbacks
    console.log('💬 Feedbacks NO migrados:');
    const oldFeedbacks = await db.collection('feedbacks').get();
    let orphanedFeedbacks = [];

    for (const doc of oldFeedbacks.docs) {
        const employeeId = doc.data().employeeId;
        if (!employeeId) {
            console.log(`   ❌ ${doc.id}: Sin employeeId`);
            orphanedFeedbacks.push(doc.id);
        } else if (!employeeIds.has(employeeId)) {
            console.log(`   ❌ ${doc.id}: employeeId "${employeeId}" no existe`);
            orphanedFeedbacks.push(doc.id);
        }
    }

    console.log(`\n   Total huérfanos: ${orphanedFeedbacks.length}\n`);

    console.log('📊 RESUMEN');
    console.log('==========');
    console.log(`Attendances huérfanos: ${orphanedAttendances.length}`);
    console.log(`Wellness tests huérfanos: ${orphanedWellness.length}`);
    console.log(`Feedbacks huérfanos: ${orphanedFeedbacks.length}`);

    if (orphanedAttendances.length + orphanedWellness.length + orphanedFeedbacks.length === 0) {
        console.log('\n✅ No hay datos huérfanos. El problema puede ser otra cosa.');
    } else {
        console.log('\n⚠️  Estos documentos NO se pueden migrar porque no tienen employeeId válido.');
        console.log('   Opción: Eliminarlos o asignarles un employeeId válido manualmente.');
    }

    process.exit(0);
}

diagnose().catch(console.error);
