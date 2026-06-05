const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'pausas-activas-ibero-2026'
});

const db = admin.firestore();

const toDelete = [
    { date: '2026-02-13', name: 'RIVERA DIEZ PAULINA' },
    { date: '2026-02-13', name: 'MARÍA DEL ROSARIO ARRAMBIDE GONZÁLEZ' },
    { date: '2026-02-13', name: 'ILIANA GALILEA CARIÑO CEPEDA' },
    { date: '2026-02-12', name: 'CARRION GOMEZ MA. DEL CARMEN' },
    { date: '2026-02-12', name: 'AVALOS HUERTA JULIO CESAR' },
    { date: '2026-02-12', name: 'ESTRADA JIMENEZ MAR' },
    { date: '2026-02-12', name: 'GUZMÁN MÉNDEZ LAURA ANGÉLICA' },
    { date: '2026-02-12', name: 'CLAUDIA ELENA GARCIA MARAÑON' },
    { date: '2026-02-12', name: 'SUSANA CRUZ RAMIREZ' },
    { date: '2026-02-12', name: 'PÉREZ OSORIO ISABEL' },
    { date: '2026-02-12', name: 'JUAN CARLOS DOMINGUEZ VERGARA' },
    { date: '2026-02-10', name: 'COIFFIER LOPEZ. FATIMA YAZMIN' },
    { date: '2026-02-10', name: 'JIMENEZ BEDOLLA JAZMIN' },
    { date: '2026-02-09', name: 'GARCÍA GUTIÉRREZ SANTIAGO' },
    { date: '2026-02-09', name: 'LOPEZ CORTES IVAN NOE' },
    { date: '2026-02-13', name: 'Emmanuel Galicia Illescas' },
    { date: '2026-02-13', name: 'Monserrat Cosme flores' },
    { date: '2026-02-13', name: 'VICTOR HUGO JUAREZ MENDEZ' },
    { date: '2026-02-13', name: 'Lizzete Luna Jimenez' },
    { date: '2026-02-13', name: 'Benjamina Abraham Hernández de los Santos' },
    { date: '2026-02-13', name: 'JIMÉNEZ VELÁZQUEZ ELIA' },
    { date: '2026-02-11', name: 'BADILLO MAXIMO MIRIAM' },
    { date: '2026-02-11', name: 'AGUILERA RAYA LAURA' },
    { date: '2026-02-11', name: 'CUACUAS CASTILLO CÉSAR' },
    { date: '2026-02-11', name: 'HERNANDEZ SMITH YANETH' },
    { date: '2026-02-11', name: 'POSADAS CARCAMO JOSE FRANCISCO' },
    { date: '2026-02-11', name: 'POSEROS ACOSTA SELMA ABIGAIL' },
    { date: '2026-02-11', name: 'FLORES MORO YAMILI GUADALUPE' },
    { date: '2026-02-11', name: 'BARBOSA SANTILLÁN NANCY' },
    { date: '2026-02-13', name: 'GARCIA PATIÑO ANDRES' },
    { date: '2026-02-13', name: 'GONZALEZ DAVILA MONICA' },
    { date: '2026-02-13', name: 'MACIAS ROJAS MARIA FERNANDA' },
    { date: '2026-02-13', name: 'PEREZ RIOS KARLA' },
    { date: '2026-02-13', name: 'SERRANO BAROJAS DULCE MARÍA' }
];

async function removeAttendances() {
    console.log('--- Iniciando limpieza de asistencias erróneas ---');
    
    let totalDeleted = 0;
    let totalPointsDeducted = 0;

    for (const item of toDelete) {
        console.log(`\nProcesando: ${item.name} (${item.date})...`);
        
        try {
            // 1. Buscar en la colección top-level 'attendances'
            const snapshot = await db.collection('attendances')
                .where('date', '==', item.date)
                .where('employeeName', '==', item.name)
                .get();

            if (snapshot.empty) {
                console.log(`   ⚠️ No se encontró registro para ${item.name} en ${item.date}`);
                continue;
            }

            const batch = db.batch();
            
            for (const doc of snapshot.docs) {
                const data = doc.data();
                const employeeId = data.employeeId;
                const attendanceId = doc.id;

                console.log(`   ✅ Encontrado! ID: ${attendanceId}, EmployeeId: ${employeeId}, Status: ${data.status}`);

                // A. Borrar de 'attendances'
                batch.delete(doc.ref);

                if (employeeId) {
                    // B. Borrar de 'employees/{id}/attendance' (puede que el ID de la subcollección sea el mismo que el top-level)
                    // Según js/attendance.js: const subRef = db.collection('employees').doc(employeeId).collection('attendance').doc();
                    // const topRef = db.collection('attendances').doc(subRef.id);
                    // Así que el ID del documento en top-level ES el ID del documento en la subcollección.
                    const subRef = db.collection('employees').doc(employeeId).collection('attendance').doc(attendanceId);
                    batch.delete(subRef);

                    // C. Borrar de 'employees/{id}/feedback'
                    const feedbackSnapshot = await db.collection('employees').doc(employeeId).collection('feedback')
                        .where('date', '==', item.date)
                        .get();
                    
                    feedbackSnapshot.forEach(fDoc => {
                        console.log(`   🗑️ Borrando feedback asociado: ${fDoc.id}`);
                        batch.delete(fDoc.ref);
                    });

                    // D. Restar puntos si estaba completado
                    if (data.status === 'completed') {
                        console.log(`   📉 Restando 20 puntos a ${item.name}`);
                        const empRef = db.collection('employees').doc(employeeId);
                        batch.update(empRef, {
                            points: admin.firestore.FieldValue.increment(-20)
                        });
                        totalPointsDeducted += 20;
                    }
                }
                
                totalDeleted++;
            }

            await batch.commit();
            console.log(`   ✨ Eliminación completada para ${item.name}`);

        } catch (e) {
            console.error(`   ❌ Error procesando ${item.name}:`, e.message);
        }
    }

    console.log('\n--- RESUMEN ---');
    console.log(`Asistencias eliminadas: ${totalDeleted}`);
    console.log(`Total puntos restados: ${totalPointsDeducted}`);
    console.log('--- Fin del proceso ---');
    process.exit(0);
}

removeAttendances();
