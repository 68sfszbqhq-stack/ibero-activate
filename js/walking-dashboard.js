// Dashboard Logic for Walking Admin
// Reads from 'walking_attendances_log' and 'walking_sessions'

document.addEventListener('DOMContentLoaded', () => {
    // Auth Check
    auth.onAuthStateChanged(user => {
        if (!user) window.location.href = 'login.html';
        initDashboard();
    });

    // State
    let currentWeekStart = getMonday(new Date());

    function getMonday(d) {
        d = new Date(d);
        var day = d.getDay(),
            diff = d.getDate() - day + (day == 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }

    function initDashboard() {
        updateDateDisplay();
        loadMetrics();
        loadCharts();
        loadLeaderboard();

        document.getElementById('prev-week').addEventListener('click', () => changeWeek(-7));
        document.getElementById('next-week').addEventListener('click', () => changeWeek(7));
    }

    function changeWeek(days) {
        currentWeekStart.setDate(currentWeekStart.getDate() + days);
        updateDateDisplay();
        loadMetrics();
        // Reload charts if they depended on week, simplified for now
    }

    function updateDateDisplay() {
        const endOfWeek = new Date(currentWeekStart);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        document.getElementById('current-date-display').textContent =
            `Semana del ${currentWeekStart.toLocaleDateString('es-ES', options)} al ${endOfWeek.toLocaleDateString('es-ES', options)}`;
    }

    async function loadMetrics() {
        // Query 'walking_attendances_log' for this week
        // Simplified Logic: Just pulling total stats for demo purposes or strictly this week
        // Ideally we filter by date range.

        // For simplicity in this demo, we'll fetch recent logs
        try {
            const snapshot = await db.collection('walking_attendances_log')
                // .where('date', '>=', ...) // Add date filter in real prod
                .limit(100)
                .get();

            let totalWalks = 0;
            let totalKm = 0;
            let totalSteps = 0;
            let totalDuration = 0;

            snapshot.forEach(doc => {
                const data = doc.data();
                totalWalks++;
                // Assuming data has metrics, if not we simulate or use defaults
                const dist = data.distanceKm || (Math.random() * 2 + 1); // Mock if missing
                const steps = data.steps || (dist * 1300);
                const duration = data.durationMin || 20;

                totalKm += dist;
                totalSteps += steps;
                totalDuration += duration;
            });

            // Update UI
            document.getElementById('total-walks').textContent = totalWalks;
            document.getElementById('total-km').textContent = totalKm.toFixed(1) + ' km';
            document.getElementById('total-steps').textContent = Math.floor(totalSteps).toLocaleString();

            const avgDur = totalWalks > 0 ? (totalDuration / totalWalks).toFixed(1) : 0;
            document.getElementById('avg-duration').textContent = avgDur + ' min';

        } catch (error) {
            console.error("Error metrics", error);
        }
    }

    function loadCharts() {
        // Mock Data for Charts
        const ctxKm = document.getElementById('km-chart').getContext('2d');
        new Chart(ctxKm, {
            type: 'bar',
            data: {
                labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'],
                datasets: [{
                    label: 'Kilômetros Recorridos',
                    data: [12, 19, 15, 22, 18], // Placheolder
                    backgroundColor: '#10b981',
                    borderRadius: 4
                }]
            },
            options: { responsive: true }
        });

        const ctxGroup = document.getElementById('group-chart').getContext('2d');
        new Chart(ctxGroup, {
            type: 'doughnut',
            data: {
                labels: ['Matutino', 'Vespertino', 'Eventos'],
                datasets: [{
                    data: [40, 35, 25], // Placeholder
                    backgroundColor: ['#10b981', '#3b82f6', '#f59e0b']
                }]
            },
            options: { responsive: true }
        });
    }

    async function loadLeaderboard() {
        // Again, simplified top 5
        const tbody = document.querySelector('#leaderboard-table tbody');
        tbody.innerHTML = '';

        try {
            // Real query would group by employeeId
            const snapshot = await db.collection('walking_attendances_log').limit(50).get();
            const map = {};

            snapshot.forEach(doc => {
                const d = doc.data();
                if (!map[d.employeeId]) map[d.employeeId] = { name: d.employeeName, area: 'General', walks: 0, km: 0 };
                map[d.employeeId].walks++;
                map[d.employeeId].km += (d.distanceKm || 1.5);
            });

            const sorted = Object.values(map).sort((a, b) => b.km - a.km).slice(0, 10);

            sorted.forEach((u, index) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="padding: 1rem; border-bottom: 1px solid #f3f4f6;">${index + 1}</td>
                    <td style="padding: 1rem; border-bottom: 1px solid #f3f4f6; font-weight: 500;">${u.name}</td>
                    <td style="padding: 1rem; border-bottom: 1px solid #f3f4f6; color: #6b7280;">${u.area}</td>
                    <td style="padding: 1rem; border-bottom: 1px solid #f3f4f6;">${u.walks}</td>
                    <td style="padding: 1rem; border-bottom: 1px solid #f3f4f6; color: #10b981; font-weight: 600;">${u.km.toFixed(1)}</td>
                `;
                tbody.appendChild(tr);
            });
        } catch (e) { console.error(e); }
    }
});
