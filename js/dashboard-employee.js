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
            // 1. Cargar datos del empleado
            const empDoc = await db.collection('employees').doc(empId).get();
            if (!empDoc.exists) return;

            const empData = empDoc.data();
            const myAccount = empData.accountNumber || '---';

            // Actualizar UI con datos básicos
            const detailsDisplay = document.getElementById('dashboard-details');
            if (detailsDisplay) detailsDisplay.textContent = `Colaborador • #${myAccount}`;

            // 2. RECALCULAR PUNTOS Y BADGES (Datos Reales)
            // Consultar todas las asistencias
            // Obtener asistencias y feedbacks de subcollections
            const attendancesSnapshot = await db.collection('employees')
                .doc(empId)
                .collection('attendance')
                .get();
            const totalAttendances = attendancesSnapshot.size;

            // Consultar todos los feedbacks
            const feedbacksSnapshot = await db.collection('employees')
                .doc(empId)
                .collection('feedback')
                .get();
            const totalFeedbacks = feedbacksSnapshot.size;

            // Calcular Puntos: (Asistencias * 10) + (Feedbacks * 5 [Bonus])
            // Nota: El usuario pidió badges por feedback, asumimos que feedback también da puntos o solo badges.
            // Mantendremos la lógica de puntos simple: 10 por asistencia + puntos extra guardados en feedback si los hubiera.
            // Para simplificar y "limpiar" errores pasados:
            let calculatedPoints = 0;

            // Sumar puntos de asistencias
            calculatedPoints += totalAttendances * 10;

            // Sumar puntos de feedbacks (Rating * 2)
            feedbacksSnapshot.forEach(doc => {
                const data = doc.data();
                calculatedPoints += (data.rating || 0) * 2;
            });

            // Actualizar Puntos en UI
            const pointsCard = document.getElementById('dashboard-points');
            if (pointsCard) pointsCard.textContent = calculatedPoints;

            // Actualizar Firestore si hay discrepancia (Auto-fix)
            if (empData.points !== calculatedPoints) {
                console.log('Corrigiendo puntos...', empData.points, '->', calculatedPoints);
                db.collection('employees').doc(empId).update({ points: calculatedPoints });
            }

            // 3. CALCULAR BADGES (Lógica Nueva)
            // - 1 Insignia por cada 2 asistencias
            // - 1 Insignia por cada Feedback
            const badgesContainer = document.querySelector('.badges-grid');
            if (badgesContainer) {
                badgesContainer.innerHTML = '';

                // Badges por Asistencia (cada 2)
                const attendanceBadgesCount = Math.floor(totalAttendances / 2);
                for (let i = 0; i < attendanceBadgesCount; i++) {
                    addBadgeToUI(badgesContainer, '🔥', 'Constancia', 'Por cada 2 asistencias');
                }

                // Badges por Feedback (cada 1)
                for (let i = 0; i < totalFeedbacks; i++) {
                    addBadgeToUI(badgesContainer, '⭐', 'Feedback', 'Por dar tu opinión');
                }

                if (attendanceBadgesCount === 0 && totalFeedbacks === 0) {
                    badgesContainer.innerHTML = '<p style="color: #999; col-span: 3;">¡Participa para ganar insignias!</p>';
                }
            }

            // 4. Calcular Ranking
            const rankSnapshot = await db.collection('employees')
                .orderBy('points', 'desc')
                .get();
            const myRank = rankSnapshot.size + 1;
            const rankCard = document.getElementById('dashboard-rank');
            if (rankCard) rankCard.textContent = `#${myRank}`;

            // 5. Racha (Simplificada: Asistencias esta semana)
            // Para racha real se necesita lógica compleja de fechas consecutivas.
            // Por ahora mostraremos asistencias totales como "Racha" o días seguidos si es fácil.
            // Usaremos total de asistencias como "Días Activos"
            const streakCard = document.getElementById('dashboard-streak');
            if (streakCard) streakCard.innerHTML = `${totalAttendances} <span style="font-size: 1rem;">días</span>`;


            // 6. Calendario Semanal
            const today = new Date();
            const startOfWeek = getStartOfWeek(today);

            // Filtrar asistencias de esta semana en memoria (ya tenemos todas)
            const weekAttendances = [];
            const startStr = startOfWeek.toISOString().split('T')[0];

            attendancesSnapshot.forEach(doc => {
                const d = doc.data();
                if (d.date >= startStr) {
                    weekAttendances.push(d);
                }
            });

            renderCalendar(weekAttendances);

        } catch (error) {
            console.error('Error cargando datos de empleado:', error);
        }
    }

    function addBadgeToUI(container, icon, title, desc) {
        const badge = document.createElement('div');
        badge.className = 'badge-card';
        badge.innerHTML = `
            <div class="badge-icon">${icon}</div>
            <div class="badge-info">
                <h4>${title}</h4>
                <p>${desc}</p>
            </div>
        `;
        container.appendChild(badge);
    }

    function getStartOfWeek(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day == 0 ? -6 : 1); // Ajustar al lunes
        return new Date(d.setDate(diff));
    }

    function renderCalendar(attendances) {
        const weekGrid = document.querySelector('.week-grid');
        if (!weekGrid) return;

        weekGrid.innerHTML = '';

        // 1. Identificar días con asistencia
        const attendedDays = new Set();
        attendances.forEach(data => {
            attendedDays.add(data.date);
        });

        // 2. Generar días de la semana (Lun-Vie)
        const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
        const today = new Date();
        const startOfWeek = getStartOfWeek(today);

        days.forEach((dayName, index) => {
            const currentDayDate = new Date(startOfWeek);
            currentDayDate.setDate(startOfWeek.getDate() + index);
            const dateString = currentDayDate.toISOString().split('T')[0];
            const isAttended = attendedDays.has(dateString);

            const dayHtml = `
                <div class="day-card" style="text-align: center; flex: 1;">
                    <div style="font-size: 0.8rem; color: #666; margin-bottom: 0.5rem;">${dayName}</div>
                    <div style="width: 40px; height: 40px; 
                                background: ${isAttended ? '#dcfce7' : '#f3f4f6'}; 
                                color: ${isAttended ? '#16a34a' : '#d1d5db'}; 
                                border-radius: 50%; 
                                display: flex; align-items: center; justify-content: center; margin: 0 auto;">
                        ${isAttended ? '<i class="fa-solid fa-check"></i>' : '-'}
                    </div>
                </div>
            `;
            weekGrid.innerHTML += dayHtml;
        });
    }
});
