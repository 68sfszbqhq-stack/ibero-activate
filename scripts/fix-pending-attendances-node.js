const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'pausas-activas-ibero-2026'
});

const db = admin.firestore();

async function fixPendingAttendances() {
    console.log('Buscando asistencias en estado "pending" o "active"...');
    
    try {
        const snapshot = await db.collection('attendances').get();
        let batch = db.batch();
        let count = 0;
        
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.status === 'pending' || data.status === 'active') {
                batch.update(doc.ref, { status: 'completed' });
                count++;
            }
        });
        
        if (count > 0) {
            console.log(`Encontradas ${count} asistencias para actualizar. Aplicando cambios...`);
            await batch.commit();
            console.log('¡Actualización completada!');
        } else {
            console.log('No se encontraron asistencias en estado "pending" o "active".');
        }
    } catch (e) {
        console.error('Error al actualizar asistencias:', e);
    }
}

fixPendingAttendances();
