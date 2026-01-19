/**
 * SCRIPT DE BACKUP PRE-LANZAMIENTO
 * 
 * Este script exporta todos los datos importantes a archivos JSON
 * antes de hacer el reset de asistencias y feedbacks.
 * 
 * EJECUTAR DESDE LA CONSOLA DEL NAVEGADOR EN:
 * http://localhost:8080/admin/dashboard.html (o la URL de tu proyecto)
 * 
 * INSTRUCCIONES:
 * 1. Abre las DevTools (F12)
 * 2. Ve a la pestaña Console
 * 3. Copia y pega este código completo
 * 4. Presiona Enter
 * 5. Espera a que termine (verás mensajes en consola)
 * 6. Se descargarán automáticamente varios archivos JSON
 */

(async function backupFirebaseData() {
    console.log('🔄 Iniciando backup de datos...');

    const timestamp = new Date().toISOString().split('T')[0];
    const backupData = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        data: {}
    };

    try {
        // 1. Backup de Empleados
        console.log('📦 Respaldando empleados...');
        const employeesSnapshot = await db.collection('employees').get();
        const employees = [];

        for (const doc of employeesSnapshot.docs) {
            const employeeData = {
                id: doc.id,
                ...doc.data()
            };

            // Backup de subcollecciones de cada empleado
            const attendanceSnapshot = await db.collection('employees').doc(doc.id).collection('attendance').get();
            employeeData.attendances = attendanceSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

            const feedbackSnapshot = await db.collection('employees').doc(doc.id).collection('feedback').get();
            employeeData.feedbacks = feedbackSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

            employees.push(employeeData);
        }
        backupData.data.employees = employees;
        console.log(`✅ ${employees.length} empleados respaldados`);

        // 2. Backup de Asistencias (top-level)
        console.log('📦 Respaldando asistencias...');
        const attendancesSnapshot = await db.collection('attendances').get();
        backupData.data.attendances = attendancesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        console.log(`✅ ${backupData.data.attendances.length} asistencias respaldadas`);

        // 3. Backup de Wellness Data
        console.log('📦 Respaldando wellness data...');
        const wellnessSnapshot = await db.collection('wellness_data').get();
        backupData.data.wellness_data = wellnessSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        console.log(`✅ ${backupData.data.wellness_data.length} registros de wellness respaldados`);

        // 4. Backup de Áreas
        console.log('📦 Respaldando áreas...');
        const areasSnapshot = await db.collection('areas').get();
        backupData.data.areas = areasSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        console.log(`✅ ${backupData.data.areas.length} áreas respaldadas`);

        // 5. Backup de Actividades
        console.log('📦 Respaldando actividades...');
        const activitiesSnapshot = await db.collection('activities').get();
        backupData.data.activities = activitiesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        console.log(`✅ ${backupData.data.activities.length} actividades respaldadas`);

        // 6. Backup de Calendario (weekly_schedules)
        console.log('📦 Respaldando calendario...');
        const schedulesSnapshot = await db.collection('weekly_schedules').get();
        backupData.data.weekly_schedules = schedulesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        console.log(`✅ ${backupData.data.weekly_schedules.length} semanas de calendario respaldadas`);

        // Generar estadísticas
        const stats = {
            totalEmployees: employees.length,
            totalAttendances: backupData.data.attendances.length,
            totalFeedbacks: employees.reduce((sum, emp) => sum + (emp.feedbacks?.length || 0), 0),
            totalWellnessRecords: backupData.data.wellness_data.length,
            totalAreas: backupData.data.areas.length,
            totalActivities: backupData.data.activities.length,
            totalWeeklySchedules: backupData.data.weekly_schedules.length
        };
        backupData.stats = stats;

        console.log('\n📊 RESUMEN DEL BACKUP:');
        console.table(stats);

        // Descargar archivo JSON
        const dataStr = JSON.stringify(backupData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ibero-activate-backup-${timestamp}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        console.log(`\n✅ BACKUP COMPLETO!`);
        console.log(`📥 Archivo descargado: ibero-activate-backup-${timestamp}.json`);
        console.log(`\n⚠️  IMPORTANTE: Guarda este archivo en un lugar seguro antes de ejecutar el reset.`);

        return backupData;

    } catch (error) {
        console.error('❌ Error durante el backup:', error);
        throw error;
    }
})();
