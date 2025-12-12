// Script para sincronizar el status de asistencias entre subcollection y top-level
// Actualiza registros en top-level attendances a 'completed' si el empleado ya tiene feedback

const adminApp = firebase.initializeApp({
    apiKey: "AIzaSyBMlR0PD-nJqYFD2GBHv4DWKNnYOGxOEIM",
    authDomain: "ibero-activate.firebaseapp.com",
    projectId: "ibero-activate",
    storageBucket: "ibero-activate.firebasestorage.app",
    messagingSenderId: "933257915492",
    appId: "1:933257915492:web:4679fef0d5c69a5c6768da"
}, 'admin');

const db = adminApp.firestore();

async function syncAttendanceStatus() {
    console.log('🚀 Iniciando sincronización de status de asistencias...');

    try {
        // 1. Obtener todas las asistencias 'active' de la colección top-level
        const activeAttendances = await db.collection('attendances')
            .where('status', '==', 'active')
            .get();

        console.log(`📊 Encontradas ${activeAttendances.size} asistencias activas`);

        let updatedCount = 0;
        let errorCount = 0;

        // 2. Para cada asistencia activa, verificar si tiene feedback
        for (const doc of activeAttendances.docs) {
            const data = doc.data();
            const attendanceId = doc.id;

            if (!data.employeeId) {
                console.warn(`⚠️ Asistencia ${attendanceId} no tiene employeeId`);
                continue;
            }

            try {
                // Buscar feedback para esta asistencia
                const feedbackSnapshot = await db.collection('employees')
                    .doc(data.employeeId)
                    .collection('feedback')
                    .where('attendanceId', '==', attendanceId)
                    .get();

                if (!feedbackSnapshot.empty) {
                    // Ya tiene feedback, actualizar status a 'completed'
                    await db.collection('attendances').doc(attendanceId).update({
                        status: 'completed'
                    });

                    updatedCount++;
                    console.log(`✅ Actualizado: ${data.employeeName} (${attendanceId})`);
                }
            } catch (error) {
                console.error(`❌ Error procesando ${attendanceId}:`, error);
                errorCount++;
            }
        }

        console.log('\n✨ Sincronización completada:');
        console.log(`   ✅ Actualizados: ${updatedCount}`);
        console.log(`   ❌ Errores: ${errorCount}`);
        console.log(`   ⏭️  Sin cambios: ${activeAttendances.size - updatedCount - errorCount}`);

    } catch (error) {
        console.error('❌ Error en sincronización:', error);
    }
}

// Ejecutar
syncAttendanceStatus();
