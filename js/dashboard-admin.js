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
            // 0. Cargar Mapa de Áreas (ID → Nombre)
            const areasMap = {};
            const areasSnapshot = await db.collection('areas').get();
            areasSnapshot.forEach(doc => {
                areasMap[doc.id] = doc.data().name;
            });

            // 1. Cargar todos los empleados para iterar sus subcollections
            const employeesSnapshot = await db.collection('employees').get();

            let totalAttendances = 0;
            let totalRating = 0;
            let feedbackCount = 0;
            const areasSet = new Set();
            const allAttendances = [];
            const allFeedbacks = [];

            // OPTIMIZACIÓN: Usar Promise.all para queries paralelas
            const employeePromises = employeesSnapshot.docs.map(async (empDoc) => {
                const empId = empDoc.id;
                const empData = empDoc.data();

                // Obtener attendances y feedbacks en paralelo
                const [attSnapshot, fbSnapshot] = await Promise.all([
                    db.collection('employees')
                        .doc(empId)
                        .collection('attendance')
                        .get(),
                    db.collection('employees')
                        .doc(empId)
                        .collection('feedback')
                        .get()
                ]);

                // Procesar attendances
                const empAttendances = [];
                attSnapshot.forEach(doc => {
                    const data = doc.data();
                    if (data.areaId) areasSet.add(data.areaId);
                    empAttendances.push({ id: doc.id, ...data, employeeId: empId });
                });

                // Procesar feedbacks
                const empFeedbacks = [];
                let empTotalRating = 0;
                fbSnapshot.forEach(doc => {
                    const data = doc.data();
                    empTotalRating += data.rating || 0;
                    empFeedbacks.push({ id: doc.id, ...data, employeeId: empId });
                });

                return {
                    attendances: empAttendances,
                    feedbacks: empFeedbacks,
                    totalRating: empTotalRating,
                    attendanceCount: attSnapshot.size,
                    feedbackCount: fbSnapshot.size
                };
            });

            // Esperar todas las queries en paralelo
            const results = await Promise.all(employeePromises);

            // Agregar resultados
            results.forEach(result => {
                totalAttendances += result.attendanceCount;
                feedbackCount += result.feedbackCount;
                totalRating += result.totalRating;
                allAttendances.push(...result.attendances);
                allFeedbacks.push(...result.feedbacks);
            });

            totalAttendancesEl.textContent = totalAttendances;

            // Calcular Rating Promedio
            const avgRating = feedbackCount > 0
                ? (totalRating / feedbackCount).toFixed(1)
                : '0.0';
            avgRatingEl.textContent = `${avgRating} ⭐`;

            // Calcular Tasa de Feedback
            const feedbackRate = totalAttendances > 0
                ? Math.round((feedbackCount / totalAttendances) * 100)
                : 0;
            feedbackRateEl.textContent = `${feedbackRate}%`;

            // Áreas Activas
            activeAreasEl.textContent = areasSet.size;

            // 4. Generar Gráficas (pasamos arrays con datos agregados)
            renderCharts(allAttendances, allFeedbacks, areasMap);

            // 5. Generar Leaderboard
            generateLeaderboard(allAttendances, allFeedbacks, areasMap);

        } catch (error) {
            console.error('Error cargando dashboard:', error);
        }
    }

    function renderCharts(attendances, feedbacks, areasMap) {
        // Preparar datos para gráfica de áreas
        const areaCounts = {};
        attendances.forEach(att => {
            const areaId = att.areaId;
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

        attendances.forEach(att => {
            const date = new Date(att.date); // Asumiendo formato YYYY-MM-DD compatible
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

        attendances.forEach(att => {
            const empId = att.employeeId;

            if (!employeeStats[empId]) {
                employeeStats[empId] = { id: empId, attendances: 0, points: 0 };
            }
            employeeStats[empId].attendances++;
            employeeStats[empId].points += 10; // 10 pts por asistencia
        });

        // Sumar puntos de feedback
        feedbacks.forEach(fb => {
            const empId = fb.employeeId;

            if (employeeStats[empId]) {
                employeeStats[empId].points += (fb.rating * 2); // Bonus por rating
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
