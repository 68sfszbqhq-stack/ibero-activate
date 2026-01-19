/**
 * SCRIPT DE RESET ALTERNATIVO (Sin actualizar empleados)
 * 
 * Esta versión solo BORRA datos, no actualiza documentos de empleados
 * para evitar problemas de permisos.
 * 
 * EJECUTAR DESDE LA CONSOLA
 */

(async function resetAlternative() {
    console.log('⚠️  SCRIPT DE RESET ALTERNATIVO');
    console.log('==============================');

    const confirmed = confirm('¿Continuar con el borrado de subcollecciones de empleados?\n\nNOTA: Los puntos NO se resetearán automáticamente.');

    if (!confirmed) {
        console.log('❌ Cancelado');
        return;
    }

    try {
        let totalDeleted = 0;

        // Procesar empleados: solo BORRAR subcollecciones
        console.log('\n🗑️  Procesando empleados...');
        const employeesSnapshot = await db.collection('employees').get();

        for (const employeeDoc of employeesSnapshot.docs) {
            const employeeId = employeeDoc.id;
            const employeeName = employeeDoc.data().fullName || 'Sin nombre';
            console.log(`   Procesando: ${employeeName}...`);

            let deletedAttendances = 0;
            let deletedFeedbacks = 0;

            // Borrar subcollection 'attendance'
            const attendanceSubSnapshot = await db.collection('employees')
                .doc(employeeId)
                .collection('attendance')
                .get();

            for (const doc of attendanceSubSnapshot.docs) {
                await doc.ref.delete();
                deletedAttendances++;
                totalDeleted++;
            }

            // Borrar subcollection 'feedback'
            const feedbackSubSnapshot = await db.collection('employees')
                .doc(employeeId)
                .collection('feedback')
                .get();

            for (const doc of feedbackSubSnapshot.docs) {
                await doc.ref.delete();
                deletedFeedbacks++;
                totalDeleted++;
            }

            console.log(`   ✅ ${employeeName}: ${deletedAttendances} asistencias, ${deletedFeedbacks} feedbacks borrados`);
        }

        console.log(`\n✅ ${employeesSnapshot.size} empleados procesados`);
        console.log(`📊 Total de documentos borrados: ${totalDeleted}`);
        console.log('\n⚠️  NOTA: Los puntos de empleados NO fueron reseteados.');
        console.log('   Resetéalos manualmente desde la consola de Firebase si es necesario.');

        alert(`✅ BORRADO COMPLETADO!\n\n${totalDeleted} documentos borrados\n${employeesSnapshot.size} empleados procesados\n\n⚠️ Los puntos NO fueron reseteados.\n\nRecarga la página.`);

    } catch (error) {
        console.error('❌ Error:', error);
        alert('❌ Error: ' + error.message);
        throw error;
    }
})();
