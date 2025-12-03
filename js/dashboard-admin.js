// Lógica del Dashboard Admin

document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticación (manejado por auth.js)

    // Elementos DOM
    const totalAttendancesEl = document.getElementById('total-attendances');
    const avgRatingEl = document.getElementById('avg-rating');
    const activeAreasEl = document.getElementById('active-areas');
    const feedbackRateEl = document.getElementById('feedback-rate');
    const leaderboardTable = document.getElementById('leaderboard-table').querySelector('tbody');

    // Inicializar
    loadDashboardData();

    async function loadDashboardData() {
        try {
            // En una app real, filtraríamos por semana actual
            // Aquí cargamos todo para demo

            // 0. Cargar Mapa de Áreas (ID -> Nombre)
            const areasMap = {};
            const areasSnapshot = await db.collection('areas').get();
            areasSnapshot.forEach(doc => {
                areasMap[doc.id] = doc.data().name;
            });

            // 1. Cargar Asistencias
            const attendancesSnapshot = await db.collection('attendances').get();
            const totalAttendances = attendancesSnapshot.size;
            totalAttendancesEl.textContent = totalAttendances;

            // 2. Cargar Feedbacks
            const feedbacksSnapshot = await db.collection('feedbacks').get();

            // Calcular Rating Promedio
            let totalRating = 0;
            feedbacksSnapshot.forEach(doc => {
                totalRating += doc.data().rating;
            });
            const avgRating = feedbacksSnapshot.size > 0
                ? (totalRating / feedbacksSnapshot.size).toFixed(1)
                : '0.0';
            avgRatingEl.textContent = `${avgRating} ⭐`;

            // Calcular Tasa de Feedback
            const feedbackRate = totalAttendances > 0
                ? Math.round((feedbacksSnapshot.size / totalAttendances) * 100)
                : 0;
            feedbackRateEl.textContent = `${feedbackRate}%`;

            // 3. Áreas Activas (simplificado)
            const areasSet = new Set();
            attendancesSnapshot.forEach(doc => {
                areasSet.add(doc.data().areaId);
            });
            activeAreasEl.textContent = areasSet.size;

            // 4. Generar Gráficas
            renderCharts(attendancesSnapshot, feedbacksSnapshot, areasMap);

            // 5. Generar Leaderboard
            generateLeaderboard(attendancesSnapshot, feedbacksSnapshot, areasMap);

        } catch (error) {
            console.error('Error cargando dashboard:', error);
        }
    }

    function renderCharts(attendances, feedbacks, areasMap) {
        // Preparar datos para gráfica de áreas
        const areaCounts = {};
        attendances.forEach(doc => {
            const areaId = doc.data().areaId;
            areaCounts[areaId] = (areaCounts[areaId] || 0) + 1;
        });

        // Gráfica de Áreas
        const areaCtx = document.getElementById('area-chart').getContext('2d');
        new Chart(areaCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(areaCounts).map(id => areasMap[id] || 'Desconocido'),
                datasets: [{
                    label: 'Asistencias',
                    data: Object.values(areaCounts),
                    backgroundColor: 'rgba(102, 126, 234, 0.6)',
                    borderColor: 'rgba(102, 126, 234, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } }
            }
        });

        // Gráfica de Tendencia (Días)
        const dayCounts = {};
        const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

        attendances.forEach(doc => {
            const date = new Date(doc.data().date); // Asumiendo formato YYYY-MM-DD compatible
            const dayName = days[date.getDay()];
            dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
        });

        const trendCtx = document.getElementById('trend-chart').getContext('2d');
        new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: Object.keys(dayCounts),
                datasets: [{
                    label: 'Participación Diaria',
                    data: Object.values(dayCounts),
                    borderColor: '#f093fb',
                    backgroundColor: 'rgba(240, 147, 251, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true
            }
        });
    }

    async function generateLeaderboard(attendances, feedbacks, areasMap) {
        // areasMap ya viene cargado

        // Agrupar por empleado
        const employeeStats = {};

        attendances.forEach(doc => {
            const data = doc.data();
            const empId = data.employeeId;

            if (!employeeStats[empId]) {
                employeeStats[empId] = { id: empId, attendances: 0, points: 0 };
            }
            employeeStats[empId].attendances++;
            employeeStats[empId].points += 10; // 10 pts por asistencia
        });

        // Sumar puntos de feedback
        feedbacks.forEach(doc => {
            const data = doc.data();
            const empId = data.employeeId;

            if (employeeStats[empId]) {
                employeeStats[empId].points += (data.rating * 2); // Bonus por rating
            }
        });

        // Convertir a array y ordenar
        const sortedEmployees = Object.values(employeeStats)
            .sort((a, b) => b.points - a.points)
            .slice(0, 10);

        // Renderizar tabla
        leaderboardTable.innerHTML = '';

        for (const [index, stat] of sortedEmployees.entries()) {
            try {
                const empDoc = await db.collection('employees').doc(stat.id).get();
                const empData = empDoc.data() || { fullName: 'Desconocido', areaId: 'N/A' };

                // Resolver nombre del área
                const areaName = areasMap[empData.areaId] || 'Área Desconocida';

                const row = document.createElement('tr');
                row.style.borderBottom = '1px solid #f3f4f6';
                row.innerHTML = `
                    <td style="padding: 1rem;">${index + 1}</td>
                    <td style="padding: 1rem; font-weight: 500;">
                        <a href="employee-detail.html?id=${stat.id}" style="color: var(--primary); text-decoration: none; font-weight: bold;">
                            ${empData.fullName} <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.8rem;"></i>
                        </a>
                    </td>
                    <td style="padding: 1rem; color: #666;">${areaName}</td>
                    <td style="padding: 1rem;">${stat.attendances}</td>
                    <td style="padding: 1rem;">-</td>
                    <td style="padding: 1rem; font-weight: 700; color: var(--primary);">${stat.points} pts</td>
                `;
                leaderboardTable.appendChild(row);
            } catch (e) {
                console.error('Error fetching employee', e);
            }
        }
    }
});
