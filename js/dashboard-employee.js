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
            // 1. Cargar datos del empleado (Puntos Reales)
            const empDoc = await db.collection('employees').doc(empId).get();
            if (!empDoc.exists) return;

            const empData = empDoc.data();
            const myPoints = empData.points || 0;
            const myAccount = empData.accountNumber || '---';

            // Actualizar UI con datos reales
            const detailsDisplay = document.getElementById('dashboard-details');
            if (detailsDisplay) detailsDisplay.textContent = `Colaborador • #${myAccount}`;

            // Actualizar Puntos en UI
            const pointsCard = document.querySelector('.card:nth-child(1) p'); // Asumiendo orden
            if (pointsCard) pointsCard.textContent = myPoints;

            // 2. Calcular Ranking (Cuántos tienen más puntos que yo)
            const rankSnapshot = await db.collection('employees')
                .where('points', '>', myPoints)
                .get();

            const myRank = rankSnapshot.size + 1;

            // Actualizar Ranking en UI
            const rankCard = document.querySelector('.card:nth-child(3) p');
            if (rankCard) rankCard.textContent = `#${myRank}`;


            // 3. Cargar Asistencias de la Semana
            const today = new Date();
            const startOfWeek = getStartOfWeek(today);

            // Query real de asistencias
            const attendances = await db.collection('attendances')
                .where('employeeId', '==', empId)
                .where('date', '>=', startOfWeek.toISOString().split('T')[0])
                .get();

            // Renderizar calendario
            renderCalendar(attendances);

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

    function renderCalendar(snapshot) {
        const weekGrid = document.querySelector('.week-grid');
        if (!weekGrid) return;

        weekGrid.innerHTML = ''; // Limpiar lo anterior

        // 1. Identificar días con asistencia
        const attendedDays = new Set();
        snapshot.forEach(doc => {
            const data = doc.data();
            // data.date es YYYY-MM-DD
            attendedDays.add(data.date);
        });

        // 2. Generar días de la semana (Lun-Vie)
        const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
        const today = new Date();
        const startOfWeek = getStartOfWeek(today);

        days.forEach((dayName, index) => {
            // Calcular fecha de este día
            const currentDayDate = new Date(startOfWeek);
            currentDayDate.setDate(startOfWeek.getDate() + index);
            const dateString = currentDayDate.toISOString().split('T')[0];

            const isAttended = attendedDays.has(dateString);

            // HTML del día
            const dayHtml = `
                <div class="day-card" style="text-align: center; flex: 1;">
                    <div style="font-size: 0.8rem; color: #666; margin-bottom: 0.5rem;">${dayName}</div>
                    <div style="width: 40px; height: 40px; 
                                background: ${isAttended ? '#dcfce7' : '#f3f4f6'}; 
                                color: ${isAttended ? '#16a34a' : '#d1d5db'}; 
                                border-radius: 50%; 
                                display: flex; align-items: center; justify-content: center; margin: 0 auto;">
                        ${isAttended ? '✓' : '-'}
                    </div>
                </div>
            `;
            weekGrid.innerHTML += dayHtml;
        });
    }
});
