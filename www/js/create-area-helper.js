// Script auxiliar para crear el área "DIRECCIONES GENERALES" si no existe
async function ensureAreaExists() {
    try {
        const db = firebase.firestore();
        const areaName = "DIRECCIONES GENERALES";
        
        const snapshot = await db.collection('areas').where('name', '==', areaName).get();
        
        if (snapshot.empty) {
            console.log('Creando área faltante:', areaName);
            await db.collection('areas').add({
                name: areaName,
                description: 'Área agregada automáticamente para ruta',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            alert('✅ Área "DIRECCIONES GENERALES" creada automáticamente. Refresca la página.');
             window.location.reload();
        } else {
            console.log('El área', areaName, 'ya existe.');
        }
    } catch (e) {
        console.error('Error verificando área:', e);
    }
}

// Ejecutar brevemente después de cargar
setTimeout(ensureAreaExists, 2000);
