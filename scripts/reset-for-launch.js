/**
 * SCRIPT DE RESET PRE-LANZAMIENTO
 * 
 * Este script limpia todos los datos de prueba para empezar fresh:
 * - Borra todas las asistencias (top-level y subcollections)
 * - Borra todos los feedbacks (subcollections)
 * - Borra todos los wellness_data
 * - Resetea puntos de empleados a 0
 * 
 * MANTIENE INTACTO:
 * ✅ Empleados
 * ✅ Áreas
 * ✅ Actividades
 * ✅ Calendario (weekly_schedules)
 * 
 * ⚠️ ADVERTENCIA: ESTE SCRIPT BORRA DATOS PERMANENTEMENTE
 * ⚠️ ASEGÚRATE DE HABER EJECUTADO EL BACKUP PRIMERO!
 * 
 * EJECUTAR DESDE LA CONSOLA DEL NAVEGADOR EN:
 * http://localhost:8080/admin/dashboard.html (o la URL de tu proyecto)
 * 
 * INSTRUCCIONES:
 * 1. Ejecuta primero el script de backup (backup-before-launch.js)
 * 2. Verifica que se descargó el archivo JSON de backup
 * 3. Abre las DevTools (F12)
 * 4. Ve a la pestaña Console
 * 5. Copia y pega este código completo
 * 6. Presiona Enter
 * 7. Confirma cuando te pregunte
 * 8. Espera a que termine (puede tomar varios minutos)
 */

(async function resetForLaunch() {
    console.log('⚠️  SCRIPT DE RESET PRE-LANZAMIENTO');
    console.log('==================================');
    console.log('Este script va a:');
    console.log('- Borrar todas las asistencias');
    console.log('- Borrar todos los feedbacks');
    console.log('- Borrar wellness_data');
    console.log('- Resetear puntos a 0');
    console.log('');
    console.log('✅ Mantiene: empleados, áreas, actividades, calendario');
    console.log('');

    const confirmed = confirm('⚠️ ¿YA HICISTE EL BACKUP?\n\nEste proceso borrará datos permanentemente.\n\n¿Estás seguro de continuar?');

    if (!confirmed) {
        console.log('❌ Reset cancelado por el usuario');
        return;
    }

    const doubleConfirm = confirm('⚠️ ÚLTIMA CONFIRMACIÓN\n\n¿Realmente quieres borrar todas las asistencias y feedbacks?\n\nEsta acción NO se puede deshacer.');

    if (!doubleConfirm) {
        console.log('❌ Reset cancelado por el usuario');
        return;
    }

    try {
        let totalDeleted = 0;

        // 1. Borrar colección top-level 'attendances'
        console.log('\n🗑️  Borrando asistencias (top-level)...');
        const attendancesSnapshot = await db.collection('attendances').get();
        const attendancesBatch = db.batch();
        attendancesSnapshot.forEach(doc => {
            attendancesBatch.delete(doc.ref);
            totalDeleted++;
        });
        await attendancesBatch.commit();
        console.log(`✅ ${attendancesSnapshot.size} asistencias (top-level) borradas`);

        // 2. Borrar wellness_data
        console.log('\n🗑️  Borrando wellness data...');
        const wellnessSnapshot = await db.collection('wellness_data').get();
        const wellnessBatch = db.batch();
        wellnessSnapshot.forEach(doc => {
            wellnessBatch.delete(doc.ref);
            totalDeleted++;
        });
        await wellnessBatch.commit();
        console.log(`✅ ${wellnessSnapshot.size} registros de wellness borrados`);

        // 3. Para cada empleado: borrar attendance y feedback subcollections + resetear puntos
        console.log('\n🗑️  Procesando empleados...');
        const employeesSnapshot = await db.collection('employees').get();

        for (const employeeDoc of employeesSnapshot.docs) {
            const employeeId = employeeDoc.id;
            const employeeName = employeeDoc.data().fullName || 'Sin nombre';
            console.log(`   Procesando: ${employeeName}...`);

            // Borrar subcollection 'attendance'
            const attendanceSubSnapshot = await db.collection('employees')
                .doc(employeeId)
                .collection('attendance')
                .get();

            const attendanceSubBatch = db.batch();
            attendanceSubSnapshot.forEach(doc => {
                attendanceSubBatch.delete(doc.ref);
                totalDeleted++;
            });
            await attendanceSubBatch.commit();

            // Borrar subcollection 'feedback'
            const feedbackSubSnapshot = await db.collection('employees')
                .doc(employeeId)
                .collection('feedback')
                .get();

            const feedbackSubBatch = db.batch();
            feedbackSubSnapshot.forEach(doc => {
                feedbackSubBatch.delete(doc.ref);
                totalDeleted++;
            });
            await feedbackSubBatch.commit();

            // Resetear puntos a 0
            await db.collection('employees').doc(employeeId).update({
                points: 0,
                lastAttendance: null
            });

            console.log(`   ✅ ${employeeName}: ${attendanceSubSnapshot.size} asistencias, ${feedbackSubSnapshot.size} feedbacks borrados, puntos reseteados`);
        }

        console.log(`\n✅ ${employeesSnapshot.size} empleados procesados`);

        // Resumen final
        console.log('\n');
        console.log('═══════════════════════════════════');
        console.log('✅ RESET COMPLETADO EXITOSAMENTE');
        console.log('═══════════════════════════════════');
        console.log(`📊 Total de documentos borrados: ${totalDeleted}`);
        console.log(`👥 Empleados procesados: ${employeesSnapshot.size}`);
        console.log('');
        console.log('✅ La plataforma está lista para el lanzamiento!');
        console.log('');
        console.log('Próximos pasos:');
        console.log('1. Recarga la página para ver los cambios');
        console.log('2. Verifica que todo esté limplio');
        console.log('3. ¡Empieza a usar la plataforma!');
        console.log('');

        alert('✅ RESET COMPLETADO!\n\n' +
            `${totalDeleted} documentos borrados\n` +
            `${employeesSnapshot.size} empleados procesados\n\n` +
            'La plataforma está lista para el lanzamiento!');

    } catch (error) {
        console.error('❌ Error durante el reset:', error);
        alert('❌ Error durante el reset: ' + error.message);
        throw error;
    }
})();
