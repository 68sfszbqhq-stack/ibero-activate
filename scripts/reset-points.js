/**
 * SCRIPT PARA RESETEAR PUNTOS DE EMPLEADOS A 0
 * 
 * Este script intenta resetear los puntos de todos los empleados a 0.
 * Si falla por permisos, tendrás que hacerlo desde Firebase Console.
 * 
 * EJECUTAR DESDE LA CONSOLA
 */

(async function resetPoints() {
    console.log('🔄 Reseteando puntos de empleados...');

    const confirmed = confirm('¿Resetear puntos de TODOS los empleados a 0?');

    if (!confirmed) {
        console.log('❌ Cancelado');
        return;
    }

    try {
        const employeesSnapshot = await db.collection('employees').get();
        let success = 0;
        let failed = 0;

        for (const employeeDoc of employeesSnapshot.docs) {
            const employeeId = employeeDoc.id;
            const employeeName = employeeDoc.data().fullName || 'Sin nombre';

            try {
                await db.collection('employees').doc(employeeId).update({
                    points: 0,
                    lastAttendance: null
                });
                console.log(`   ✅ ${employeeName}: Puntos reseteados`);
                success++;
            } catch (error) {
                console.log(`   ❌ ${employeeName}: Error - ${error.message}`);
                failed++;
            }
        }

        console.log('\n═══════════════════════════════════');
        console.log('📊 RESUMEN:');
        console.log(`✅ Exitosos: ${success}`);
        console.log(`❌ Fallidos: ${failed}`);
        console.log('═══════════════════════════════════');

        if (failed > 0) {
            console.log('\n⚠️  SOLUCIÓN ALTERNATIVA:');
            console.log('Si hay errores de permisos, resetea los puntos desde Firebase Console:');
            console.log('1. Ve a: https://console.firebase.google.com/');
            console.log('2. Selecciona tu proyecto');
            console.log('3. Ve a Firestore Database');
            console.log('4. Navega a la colección "employees"');
            console.log('5. Para cada documento, edita el campo "points" a 0');
        } else {
            alert(`✅ COMPLETADO!\n\n${success} empleados con puntos reseteados a 0`);
        }

    } catch (error) {
        console.error('❌ Error:', error);
        alert('❌ Error: ' + error.message);
    }
})();
