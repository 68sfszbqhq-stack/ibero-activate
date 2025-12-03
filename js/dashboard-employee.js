// Lógica del Dashboard de Empleado

document.addEventListener('DOMContentLoaded', () => {
    // En una app real, obtendríamos el ID del empleado autenticado o seleccionado previamente
    // Para demo, usaremos un ID fijo o el último seleccionado en localStorage
    const employeeId = 'emp_001'; // ID de prueba

    loadEmployeeData(employeeId);

    async function loadEmployeeData(empId) {
        try {
            // 1. Cargar datos del empleado
            // const empDoc = await db.collection('employees').doc(empId).get();
            // const empData = empDoc.data();
            // updateProfileUI(empData);

            // 2. Cargar Puntos y Estadísticas
            // Simulación de datos para demo visual
            // En producción: query a colección 'points'

            // 3. Cargar Asistencias de la Semana
            const today = new Date();
            const startOfWeek = getStartOfWeek(today);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(endOfWeek.getDate() + 6);

            // Query real
            /*
            const attendances = await db.collection('attendances')
                .where('employeeId', '==', empId)
                .where('date', '>=', startOfWeek.toISOString().split('T')[0])
                .get();
            */

            // Renderizar calendario (simulado para demo)
            renderCalendar();

        } catch (error) {
            console.error('Error cargando datos de empleado:', error);
        }
    }

    function getStartOfWeek(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day == 0 ? -6 : 1); // Ajustar al lunes
        return new Date(d.setDate(diff));
    }

    function renderCalendar() {
        // Lógica para marcar días completados en el calendario visual
        // Ya está hardcodeado en el HTML para la demo inicial
    }
});
