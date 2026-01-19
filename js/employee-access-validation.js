/**
 * MÓDULO DE VALIDACIÓN DE ACCESO PARA EMPLEADOS
 * 
 * Este módulo asegura que solo empleados con asistencia completada
 * del día puedan acceder a las páginas protegidas (dashboard, wellness, etc.)
 */

(async function validateEmployeeAccess() {
    // 1. Verificar que haya un empleado en localStorage
    const storedEmployee = localStorage.getItem('currentEmployee');

    if (!storedEmployee) {
        alert('⚠️ Acceso Restringido\n\nDebe registrar su asistencia primero.');
        window.location.href = 'feedback.html';
        return false;
    }

    try {
        const currentUser = JSON.parse(storedEmployee);
        const employeeId = currentUser.id;
        const today = new Date().toISOString().split('T')[0];

        // 2. SEGURIDAD: Verificar que tiene asistencia completada HOY
        const attendanceCheck = await db.collection('attendances')
            .where('employeeId', '==', employeeId)
            .where('date', '==', today)
            .where('status', '==', 'completed')
            .get();

        if (attendanceCheck.empty) {
            // No tiene asistencia completada hoy = no puede acceder
            alert('⚠️ Acceso Restringido\n\nSolo puede acceder después de completar su feedback del día.');
            localStorage.removeItem('currentEmployee'); // Limpiar sesión inválida
            window.location.href = 'feedback.html';
            return false;
        }

        // 3. Acceso permitido
        console.log('✅ Acceso permitido para:', currentUser.name);
        return true;

    } catch (error) {
        console.error('Error verificando acceso:', error);
        alert('Error verificando acceso. Intente nuevamente.');
        window.location.href = 'feedback.html';
        return false;
    }
})();
