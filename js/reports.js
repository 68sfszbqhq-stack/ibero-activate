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
    const filterDateInput = document.getElementById('filter-date');
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    // Estado local
    let employeesData = [];
    let areasMap = {};

    // Inicializar
    loadAreas().then(() => {
        loadEmployees();
        loadAttendance();
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

    async function loadAttendance() {
        try {
            let query = db.collection('attendances').orderBy('timestamp', 'desc').limit(100);

            // Filtro de fecha simple (si se selecciona)
            if (filterDateInput.value) {
                query = db.collection('attendances')
                    .where('date', '==', filterDateInput.value)
                    .orderBy('timestamp', 'desc');
            }

            const snapshot = await query.get();
            attendanceTableBody.innerHTML = '';

            if (snapshot.empty) {
                attendanceTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem;">No hay registros</td></tr>';
                return;
            }

            snapshot.forEach(doc => {
                const data = doc.data();
                const dateObj = data.timestamp ? data.timestamp.toDate() : new Date();
                const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                // Resolver nombre de área (si no está en el doc de asistencia, buscarlo)
                // Para optimizar, asumimos que el doc de asistencia podría tener el areaId
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
            // Si falla por índice, mostrar mensaje amigable
            if (e.message.includes('index')) {
                attendanceTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: red;">Falta índice en Firebase para este filtro.</td></tr>';
            }
        }
    }

    // Listener para filtro de fecha
    filterDateInput.addEventListener('change', loadAttendance);

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
        const doc = new jsPDF();

        // Header
        doc.setFontSize(18);
        doc.setTextColor(196, 22, 28);
        doc.text('Bitácora de Asistencias - IBERO ACTÍVATE', 14, 22);

        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 30);

        // Table
        doc.autoTable({
            html: '#attendance-table',
            startY: 40,
            headStyles: { fillColor: [45, 45, 45] }, // Dark header for attendance
            theme: 'grid'
        });

        doc.save('asistencias_ibero.pdf');
    });

});
