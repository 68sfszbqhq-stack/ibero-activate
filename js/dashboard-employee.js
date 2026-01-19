// Lógica del Dashboard de Empleado

document.addEventListener('DOMContentLoaded', async () => {
    // Recuperar empleado seleccionado del LocalStorage
    const storedEmployee = localStorage.getItem('currentEmployee');

    if (!storedEmployee) {
        // Si no hay usuario seleccionado, volver al inicio
        alert('⚠️ Acceso Restringido\n\nDebe registrar su asistencia primero.');
        window.location.href = 'feedback.html';
        return;
    }

    const currentUser = JSON.parse(storedEmployee);
    const employeeId = currentUser.id;

    // SEGURIDAD: Verificar que el empleado tiene asistencia activa HOY
    const today = new Date().toISOString().split('T')[0];
    try {
        const attendanceCheck = await db.collection('attendances')
            .where('employeeId', '==', employeeId)
            .where('date', '==', today)
            .where('status', '==', 'completed')
            .get();

        if (attendanceCheck.empty) {
            // No tiene asistencia completada hoy = no puede acceder
            alert('⚠️ Acceso Restringido\n\nSolo puede acceder después de completar su feedback del día.');
            localStorage.removeItem('currentEmployee'); // Limpiar sesión
            window.location.href = 'feedback.html';
            return;
        }
    } catch (error) {
        console.error('Error verificando asistencia:', error);
        alert('Error verificando acceso. Intente nuevamente.');
        window.location.href = 'feedback.html';
        return;
    }

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

            // 3. CALCULAR RANKING CORRECTO
            const rankSnapshot = await db.collection('employees')
                .orderBy('points', 'desc')
                .get();

            let myRank = 1;
            rankSnapshot.forEach((doc, index) => {
                if (doc.id === empId) {
                    myRank = index + 1;
                }
            });

            const rankCard = document.getElementById('dashboard-rank');
            if (rankCard) rankCard.textContent = `#${myRank}`;

            // 4. CALCULAR RACHA REAL (días consecutivos)
            const streak = calculateStreak(attendancesSnapshot);
            const streakCard = document.getElementById('dashboard-streak');
            if (streakCard) streakCard.innerHTML = `${streak} <span style="font-size: 1rem;">${streak === 1 ? 'semana' : 'semanas'}</span>`;

            // 5. CALCULAR BADGES DINÁMICAMENTE
            const badges = calculateBadges(totalAttendances, totalFeedbacks, streak, calculatedPoints);
            renderBadges(badges);

            // 6. Calendario Mensual
            renderMonthlyCalendar(attendancesSnapshot, new Date());

        } catch (error) {
            console.error('Error cargando datos de empleado:', error);
        }
    }

    // Estado global del calendario
    let currentCalendarMonth = new Date();
    let allAttendances = null;

    function renderMonthlyCalendar(attendancesSnapshot, month) {
        allAttendances = attendancesSnapshot; // Guardar para navegación
        currentCalendarMonth = new Date(month);

        const calendar = document.getElementById('monthly-calendar');
        const monthYearDisplay = document.getElementById('calendar-month-year');

        if (!calendar || !monthYearDisplay) return;

        // Set month/year display
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        monthYearDisplay.textContent = `${monthNames[currentCalendarMonth.getMonth()]} ${currentCalendarMonth.getFullYear()}`;

        // Get attendance dates
        const attendedDates = new Set();
        attendancesSnapshot.forEach(doc => {
            attendedDates.add(doc.data().date);
        });

        // Calculate calendar grid
        const year = currentCalendarMonth.getFullYear();
        const monthIndex = currentCalendarMonth.getMonth();
        const firstDay = new Date(year, monthIndex, 1);
        const lastDay = new Date(year, monthIndex + 1, 0);
        const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday
        const daysInMonth = lastDay.getDate();

        calendar.innerHTML = '';

        // Day headers
        const dayHeaders = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        dayHeaders.forEach(day => {
            const header = document.createElement('div');
            header.style.cssText = 'text-align: center; font-weight: 600; font-size: 0.75rem; color: #666; padding: 0.5rem 0;';
            header.textContent = day;
            calendar.appendChild(header);
        });

        // Empty cells before first day
        for (let i = 0; i < startingDayOfWeek; i++) {
            const empty = document.createElement('div');
            calendar.appendChild(empty);
        }

        // Days of month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, monthIndex, day);
            const dateString = date.toISOString().split('T')[0];
            const hasAttendance = attendedDates.has(dateString);
            const isToday = dateString === new Date().toISOString().split('T')[0];

            const dayCell = document.createElement('div');
            dayCell.style.cssText = `
                aspect-ratio: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 8px;
                font-size: 0.9rem;
                font-weight: ${isToday ? '700' : '500'};
                background: ${hasAttendance ? '#10b981' : '#e5e7eb'};
                color: ${hasAttendance ? 'white' : '#9ca3af'};
                border: ${isToday ? '2px solid #10b981' : 'none'};
                cursor: default;
            `;
            dayCell.textContent = day;

            if (hasAttendance) {
                dayCell.title = `Asistencia registrada el ${dateString}`;
            }

            calendar.appendChild(dayCell);
        }
    }

    // Navigation buttons
    document.getElementById('prev-month')?.addEventListener('click', () => {
        if (!allAttendances) return;
        currentCalendarMonth.setMonth(currentCalendarMonth.getMonth() - 1);
        renderMonthlyCalendar(allAttendances, currentCalendarMonth);
    });

    document.getElementById('next-month')?.addEventListener('click', () => {
        if (!allAttendances) return;
        const today = new Date();
        if (currentCalendarMonth.getMonth() >= today.getMonth() &&
            currentCalendarMonth.getFullYear() >= today.getFullYear()) {
            return; // Don't go beyond current month
        }
        currentCalendarMonth.setMonth(currentCalendarMonth.getMonth() + 1);
        renderMonthlyCalendar(allAttendances, currentCalendarMonth);
    });
});

// CALCULAR RACHA (días consecutivos con asistencia)
function calculateStreak(attendancesSnapshot) {
    if (attendancesSnapshot.empty) return 0;

    // Get all dates and sort
    const dates = [];
    attendancesSnapshot.forEach(doc => {
        dates.push(doc.data().date);
    });
    dates.sort().reverse(); // Most recent first

    // Calculate streak from today backwards
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = 0;
    let currentDate = new Date(today);

    for (let i = 0; i < dates.length; i++) {
        const checkDate = new Date(dates[i]);
        checkDate.setHours(0, 0, 0, 0);

        // Skip weekends
        while (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
            currentDate.setDate(currentDate.getDate() - 1);
        }

        if (checkDate.getTime() === currentDate.getTime()) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        } else {
            break; // Streak broken
        }
    }

    return streak;
}

// CALCULAR BADGES DINÁMICAMENTE
function calculateBadges(totalAttendances, totalFeedbacks, streak, points) {
    const badges = [];

    // 🔥 Racha badges (por semanas)
    if (streak >= 10) badges.push({ icon: '🔥🔥🔥', name: '10 Semanas', desc: 'Imparable' });
    else if (streak >= 5) badges.push({ icon: '🔥🔥', name: '5 Semanas', desc: 'En fuego' });
    else if (streak >= 3) badges.push({ icon: '🔥', name: '3 Semanas', desc: 'Constante' });
    else if (streak >= 2) badges.push({ icon: '✨', name: '2 Semanas', desc: 'Buen inicio' });

    // ⭐ Asistencia badges
    if (totalAttendances >= 20) badges.push({ icon: '👑', name: 'Rey/Reina', desc: '20+ asistencias' });
    else if (totalAttendances >= 10) badges.push({ icon: '🏆', name: 'Campeón', desc: '10+ asistencias' });
    else if (totalAttendances >= 5) badges.push({ icon: '🌟', name: 'Estrella', desc: '5+ asistencias' });

    // 💬 Feedback badges
    if (totalFeedbacks >= 10) badges.push({ icon: '💎', name: 'Crítico Pro', desc: '10+ feedbacks' });
    else if (totalFeedbacks >= 5) badges.push({ icon: '💬', name: 'Comunicador', desc: '5+ feedbacks' });

    // 💪 Puntos badges
    if (points >= 200) badges.push({ icon: '🚀', name: 'Elite', desc: '200+ puntos' });
    else if (points >= 100) badges.push({ icon: '⚡', name: 'Pro', desc: '100+ puntos' });
    else if (points >= 50) badges.push({ icon: '🎯', name: 'Activo', desc: '50+ puntos' });

    // 🎁 Especiales
    if (totalAttendances === totalFeedbacks && totalAttendances > 0) {
        badges.push({ icon: '✅', name: 'Perfeccionista', desc: '100% feedback' });
    }

    return badges;
}

// RENDERIZAR BADGES EN LA UI
function renderBadges(badges) {
    const container = document.querySelector('[style*="display: flex; gap: 1rem; flex-wrap: wrap"]');
    if (!container) return;

    container.innerHTML = '';

    if (badges.length === 0) {
        container.innerHTML = '<p style="width: 100%; text-align: center; color: #9ca3af; padding: 1rem;">¡Participa para ganar insignias! 🎯</p>';
        return;
    }

    badges.forEach(badge => {
        const badgeDiv = document.createElement('div');
        badgeDiv.style.cssText = 'text-align: center; min-width: 80px;';
        badgeDiv.innerHTML = `
            <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">${badge.icon}</div>
            <strong style="font-size: 0.75rem; display: block; margin-bottom: 0.25rem;">${badge.name}</strong>
            <span style="font-size: 0.7rem; color: #6b7280;">${badge.desc}</span>
        `;
        container.appendChild(badgeDiv);
    });
}
