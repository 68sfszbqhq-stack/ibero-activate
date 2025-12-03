// Lógica de Reportes y Exportación
document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticación
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.href = 'login.html';
        }
    });

    // Elementos DOM
    const employeesTableBody = document.getElementById('employees-table').querySelector('tbody');
    const attendanceTableBody = document.getElementById('attendance-table').querySelector('tbody');

    const filterTypeSelect = document.getElementById('filter-type');
    const filterDateInput = document.getElementById('filter-date');
    const filterWeekInput = document.getElementById('filter-week');
    const filterMonthInput = document.getElementById('filter-month');

    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    // Estado local
    let employeesData = [];
    let areasMap = {};

    // Inicializar
    loadAreas().then(() => {
        loadEmployees();
        // Set default date to today
        filterDateInput.value = new Date().toISOString().split('T')[0];
        loadAttendance();
    });

    // --- Lógica de UI Filtros ---
    filterTypeSelect.addEventListener('change', (e) => {
        const type = e.target.value;

        // Ocultar todos
        filterDateInput.classList.add('hidden');
        filterWeekInput.classList.add('hidden');
        filterMonthInput.classList.add('hidden');

        // Mostrar seleccionado
        if (type === 'day') filterDateInput.classList.remove('hidden');
        if (type === 'week') filterWeekInput.classList.remove('hidden');
        if (type === 'month') filterMonthInput.classList.remove('hidden');

        loadAttendance();
    });

    [filterDateInput, filterWeekInput, filterMonthInput].forEach(input => {
        input.addEventListener('change', loadAttendance);
    });

    // --- Lógica de Tabs ---
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // UI Update
            tabs.forEach(t => {
                t.classList.remove('active');
                t.style.color = '#666';
                t.style.borderBottom = 'none';
            });
            contents.forEach(c => c.classList.add('hidden'));

            tab.classList.add('active');
            tab.style.color = 'var(--primary)';
            tab.style.borderBottom = '2px solid var(--primary)';
            document.getElementById(tab.dataset.target).classList.remove('hidden');
        });
    });

    // --- Carga de Datos ---

    async function loadAreas() {
        try {
            const snapshot = await db.collection('areas').get();
            snapshot.forEach(doc => {
                areasMap[doc.id] = doc.data().name;
            });
        } catch (e) {
            console.error('Error loading areas:', e);
        }
    }

    async function loadEmployees() {
        try {
            const snapshot = await db.collection('employees').orderBy('fullName').get();
            employeesData = [];
            employeesTableBody.innerHTML = '';

            snapshot.forEach(doc => {
                const data = doc.data();
                employeesData.push(data);

                const areaName = areasMap[data.areaId] || '---';
                const row = `
                    <tr style="border-bottom: 1px solid #f3f4f6;">
                        <td style="padding: 1rem;">${data.fullName}</td>
                        <td style="padding: 1rem;">${data.accountNumber || '---'}</td>
                        <td style="padding: 1rem;">${areaName}</td>
                        <td style="padding: 1rem;">${data.position || '---'}</td>
                        <td style="padding: 1rem; font-weight: bold;">${data.points || 0}</td>
                    </tr>
                `;
                employeesTableBody.innerHTML += row;
            });
        } catch (e) {
            console.error('Error loading employees:', e);
            employeesTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Error al cargar datos</td></tr>';
        }
    }

    function getDateRange() {
        const type = filterTypeSelect.value;
        let start = null;
        let end = null;
        let label = '';

        if (type === 'day' && filterDateInput.value) {
            start = filterDateInput.value;
            end = filterDateInput.value;
            label = `Día: ${start}`;
        } else if (type === 'week' && filterWeekInput.value) {
            // value is "2023-W10"
            const [year, week] = filterWeekInput.value.split('-W');
            const simpleDate = new Date(year, 0, 1 + (week - 1) * 7);
            const dayOfWeek = simpleDate.getDay();
            const weekStart = simpleDate;
            if (dayOfWeek <= 4) weekStart.setDate(simpleDate.getDate() - simpleDate.getDay() + 1);
            else weekStart.setDate(simpleDate.getDate() + 8 - simpleDate.getDay());

            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);

            start = weekStart.toISOString().split('T')[0];
            end = weekEnd.toISOString().split('T')[0];
            label = `Semana: ${start} al ${end}`;
        } else if (type === 'month' && filterMonthInput.value) {
            // value is "2023-05"
            const [year, month] = filterMonthInput.value.split('-');
            start = `${year}-${month}-01`;
            // Last day of month
            const lastDay = new Date(year, month, 0).getDate();
            end = `${year}-${month}-${lastDay}`;
            label = `Mes: ${filterMonthInput.value}`;
        }

        return { start, end, label };
    }

    async function loadAttendance() {
        try {
            const { start, end } = getDateRange();

            let query = db.collection('attendances');

            if (start && end) {
                if (start === end) {
                    query = query.where('date', '==', start);
                } else {
                    query = query.where('date', '>=', start).where('date', '<=', end);
                }
            } else {
                // Default fallback if no date selected
                query = query.orderBy('timestamp', 'desc').limit(50);
            }

            const snapshot = await query.get();
            attendanceTableBody.innerHTML = '';

            if (snapshot.empty) {
                attendanceTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem;">No hay registros para este periodo</td></tr>';
                return;
            }

            // Client-side sort by timestamp desc (since we might have filtered by date range)
            const docs = [];
            snapshot.forEach(doc => docs.push(doc.data()));
            docs.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));

            docs.forEach(data => {
                const dateObj = data.timestamp ? data.timestamp.toDate() : new Date();
                const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const areaName = areasMap[data.areaId] || '---';

                const row = `
                    <tr style="border-bottom: 1px solid #f3f4f6;">
                        <td style="padding: 1rem;">${data.date}</td>
                        <td style="padding: 1rem;">${timeStr}</td>
                        <td style="padding: 1rem; font-weight: 500;">${data.employeeName}</td>
                        <td style="padding: 1rem;">${areaName}</td>
                        <td style="padding: 1rem;">
                            <span style="background: ${data.status === 'completed' ? '#dcfce7' : '#fee2e2'}; 
                                         color: ${data.status === 'completed' ? '#16a34a' : '#dc2626'}; 
                                         padding: 2px 8px; border-radius: 10px; font-size: 0.85rem;">
                                ${data.status === 'completed' ? 'Completado' : 'Pendiente'}
                            </span>
                        </td>
                    </tr>
                `;
                attendanceTableBody.innerHTML += row;
            });

        } catch (e) {
            console.error('Error loading attendance:', e);
            if (e.message.includes('index')) {
                attendanceTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: red;">Falta índice en Firebase para este filtro.</td></tr>';
            }
        }
    }

    // --- Exportación PDF ---
    const { jsPDF } = window.jspdf;

    document.getElementById('export-employees').addEventListener('click', () => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(18);
        doc.setTextColor(196, 22, 28); // IBERO Red
        doc.text('Reporte de Empleados - IBERO ACTÍVATE', 14, 22);

        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 30);

        // Table
        doc.autoTable({
            html: '#employees-table',
            startY: 40,
            headStyles: { fillColor: [196, 22, 28] }, // Red header
            theme: 'grid'
        });

        doc.save('empleados_ibero.pdf');
    });

    document.getElementById('export-attendance').addEventListener('click', () => {
        const { label } = getDateRange();
        const doc = new jsPDF();

        // Header
        doc.setFontSize(18);
        doc.setTextColor(196, 22, 28);
        doc.text('Bitácora de Asistencias - IBERO ACTÍVATE', 14, 22);

        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Periodo: ${label || 'General'}`, 14, 30);
        doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 36);

        // Table
        doc.autoTable({
            html: '#attendance-table',
            startY: 45,
            headStyles: { fillColor: [45, 45, 45] }, // Dark header for attendance
            theme: 'grid'
        });

        doc.save('asistencias_ibero.pdf');
    });

});
