/**
 * VALIDACIÓN MÍNIMA PARA EMPLEADOS - SOLO MUESTRA NOMBRE
 * NO REDIRIGE - ACCESO LIBRE
 */

(function simpleEmployeeAccess() {
    // Solo intentar obtener el nombre del empleado si está en localStorage
    const storedEmployee = localStorage.getItem('currentEmployee');

    if (storedEmployee) {
        try {
            const currentUser = JSON.parse(storedEmployee);
            console.log('✅ Acceso permitido para:', currentUser.name);
        } catch (error) {
            console.log('ℹ️ Acceso libre');
        }
    } else {
        console.log('ℹ️ Acceso libre - sin validación');
    }
})();
