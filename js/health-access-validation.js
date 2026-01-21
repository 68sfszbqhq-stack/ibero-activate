/**
 * MÓDULO DE VALIDACIÓN SIMPLE PARA PÁGINAS DE SALUD
 * 
 * Este módulo solo verifica autenticación de Firebase
 * NO redirige a feedback - permite acceso libre a módulos de salud
 */

(async function validateHealthAccess() {
    // Esperar a que Firebase esté listo
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            // No hay usuario autenticado - redirigir a login
            console.warn('⚠️ Usuario no autenticado');
            window.location.href = '../index.html';
            return;
        }

        try {
            // Obtener datos del usuario desde Firestore
            const userDoc = await db.collection('users').doc(user.uid).get();

            if (!userDoc.exists) {
                console.warn('⚠️ Usuario no encontrado en Firestore');
                window.location.href = '../index.html';
                return;
            }

            const userData = userDoc.data();

            // Verificar que sea un empleado (no admin)
            if (userData.role && userData.role !== 'employee') {
                console.log('ℹ️ Usuario con rol:', userData.role);
            }

            // Acceso permitido - mostrar nombre
            console.log('✅ Acceso permitido para:', userData.name || user.email);

            // Guardar en localStorage para uso posterior
            if (!localStorage.getItem('currentEmployee')) {
                localStorage.setItem('currentEmployee', JSON.stringify({
                    id: user.uid,
                    name: userData.name || user.email,
                    email: userData.email || user.email,
                    area: userData.area || 'Sin área'
                }));
            }

        } catch (error) {
            console.error('❌ Error verificando acceso:', error);
            // No redirigir en caso de error - permitir acceso
        }
    });
})();
