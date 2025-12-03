// Lógica del Dashboard de Empleado

document.addEventListener('DOMContentLoaded', () => {
    // Recuperar empleado seleccionado del LocalStorage
    const storedEmployee = localStorage.getItem('currentEmployee');

    if (!storedEmployee) {
        // Si no hay usuario seleccionado, volver al inicio
        window.location.href = 'feedback.html';
        return;
    }

    const currentUser = JSON.parse(storedEmployee);
    const employeeId = currentUser.id;

    // Actualizar UI con datos del LocalStorage
    const nameDisplay = document.getElementById('dashboard-name');
    const detailsDisplay = document.getElementById('dashboard-details');
    const avatarDisplay = document.querySelector('.avatar-medium');

    if (nameDisplay) nameDisplay.textContent = currentUser.name;
    if (detailsDisplay) detailsDisplay.textContent = `Colaborador • #${employeeId.substring(0, 6)}`;
    if (avatarDisplay) avatarDisplay.textContent = currentUser.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

    loadEmployeeData(employeeId);

    async function loadEmployeeData(empId) {
        try {
            // 1. Cargar datos del empleado (Opcional si ya tenemos el nombre)
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
