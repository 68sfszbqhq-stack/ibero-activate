// Script de emergencia para limpiar documento semanal corrupto
// Ejecutar en la consola del navegador cuando estés en calendar.html

async function fixCorruptedWeek() {
    const weekId = '2026-W4'; // Cambia esto si es otra semana

    console.log(`🔧 Limpiando documento corrupto: ${weekId}`);

    try {
        // Obtener el documento actual
        const docRef = db.collection('weekly_schedules').doc(weekId);
        const doc = await docRef.get();

        if (!doc.exists) {
            console.error('❌ El documento no existe');
            return;
        }

        const data = doc.data();
        const schedule = data.schedule || [];

        console.log(`📋 Actividades encontradas: ${schedule.length}`);

        // Limpiar todas las evidencias (Base64) para reducir tamaño
        const cleanedSchedule = schedule.map(item => {
            const cleaned = { ...item };

            // Eliminar evidenceUrl si existe (es lo que causa el problema)
            if (cleaned.evidenceUrl) {
                delete cleaned.evidenceUrl;
                console.log(`🧹 Limpiada evidencia de: ${cleaned.activityId || 'unknown'}`);
            }

            // Eliminar adminComments si son muy largos
            if (cleaned.adminComments && cleaned.adminComments.length > 500) {
                cleaned.adminComments = cleaned.adminComments.substring(0, 500);
            }

            // Eliminar evidenceTimestamp
            if (cleaned.evidenceTimestamp) {
                delete cleaned.evidenceTimestamp;
            }

            return cleaned;
        });

        // Actualizar el documento con el schedule limpio
        await docRef.update({ schedule: cleanedSchedule });

        console.log('✅ Documento limpiado exitosamente');
        console.log('🔄 Recarga la página para ver los cambios');

        alert('✅ Documento limpiado. Recarga la página (F5)');

    } catch (error) {
        console.error('❌ Error limpiando documento:', error);
        alert('Error: ' + error.message);
    }
}

// Ejecutar automáticamente
fixCorruptedWeek();
