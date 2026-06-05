/**
 * VALIDACIÓN MÍNIMA - SOLO MUESTRA NOMBRE
 * NO REDIRIGE - ACCESO LIBRE
 */

(function simpleHealthAccess() {
    // Esperar a que Firebase esté listo
    if (typeof auth !== 'undefined') {
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    // Intentar obtener nombre del usuario
                    const userDoc = await db.collection('users').doc(user.uid).get();
                    const userName = userDoc.exists ? userDoc.data().name : user.email;
                    console.log('✅ Acceso permitido para:', userName);
                } catch (error) {
                    console.log('✅ Acceso permitido para:', user.email);
                }
            } else {
                console.log('ℹ️ Usuario no autenticado - acceso libre');
            }
        });
    }
})();
