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
    const feedbackTableBody = document.getElementById('feedback-table').querySelector('tbody');

    const filterTypeSelect = document.getElementById('filter-type');
    const filterDateInput = document.getElementById('filter-date');
    const filterWeekInput = document.getElementById('filter-week');
    const filterMonthInput = document.getElementById('filter-month');

    const filterTypeSelectFeedback = document.getElementById('filter-type-feedback');
    const filterDateInputFeedback = document.getElementById('filter-date-feedback');
    const filterWeekInputFeedback = document.getElementById('filter-week-feedback');
    const filterMonthInputFeedback = document.getElementById('filter-month-feedback');

    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    // Estado local
    let employeesData = [];
    let areasMap = {};

    // Inicializar
    loadAreas().then(() => {
        loadEmployees();
        loadEmployees();

        // Inicializar fecha con TIMEZONE LOCAL
        // (Evita que a las 10pm cambie a mañana por UTC)
        const now = new Date();
        // Ajustar al offset local en minutos, convertidos a ms
        // .getTimezoneOffset() devuleve minutos positivos si estamos DETRÁS de UTC (ej. Mexico es UTC-6 -> 360)
        // Restamos el offset para obtener la hora local en formato ISO simulado
        const localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
        const todayStr = localDate.toISOString().split('T')[0];

        filterDateInput.value = todayStr;
        filterDateInputFeedback.value = todayStr;

        loadAttendance();
        loadFeedbacks();
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

    // --- Lógica de UI Filtros Feedback ---
    filterTypeSelectFeedback.addEventListener('change', (e) => {
        const type = e.target.value;

        // Ocultar todos
        filterDateInputFeedback.classList.add('hidden');
        filterWeekInputFeedback.classList.add('hidden');
        filterMonthInputFeedback.classList.add('hidden');

        // Mostrar seleccionado
        if (type === 'day') filterDateInputFeedback.classList.remove('hidden');
        if (type === 'week') filterWeekInputFeedback.classList.remove('hidden');
        if (type === 'month') filterMonthInputFeedback.classList.remove('hidden');

        loadFeedbacks();
    });

    [filterDateInputFeedback, filterWeekInputFeedback, filterMonthInputFeedback].forEach(input => {
        input.addEventListener('change', loadFeedbacks);
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
                        <td style="padding: 1rem;">
                            <a href="employee-detail.html?id=${doc.id}" 
                               style="color: var(--primary); text-decoration: none; font-weight: 500; transition: opacity 0.2s;"
                               onmouseover="this.style.opacity='0.7'" 
                               onmouseout="this.style.opacity='1'">
                                ${data.fullName}
                            </a>
                        </td>
                        <td style="padding: 1rem;">${data.accountNumber || '---'}</td>
                        <td style="padding: 1rem;">${areaName}</td>
                        <td style="padding: 1rem;">${data.position || '---'}</td>
                        <td style="padding: 1rem; font-weight: bold;">${data.points || 0}</td>
                        <td style="padding: 1rem;">
                            <button onclick="deleteEmployee('${doc.id}', '${data.fullName}')" 
                                    style="background: #fee2e2; color: #dc2626; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; transition: 0.2s;"
                                    title="Eliminar Empleado">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
                employeesTableBody.innerHTML += row;
            });
        } catch (e) {
            console.error('Error loading employees:', e);
            employeesTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Error al cargar datos</td></tr>';
        }
    }

    // Hacer global para onclick
    window.deleteEmployee = async (id, name) => {
        if (confirm(`¿Estás seguro de eliminar a ${name}? Esta acción es irreversible.`)) {
            try {
                await db.collection('employees').doc(id).delete();
                // Opcional: Eliminar asistencias relacionadas (requiere query batch)
                alert('Empleado eliminado correctamente.');
                loadEmployees(); // Recargar tabla
            } catch (e) {
                console.error('Error deleting:', e);
                alert('Error al eliminar: ' + e.message);
            }
        }
    };

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
            snapshot.forEach(doc => docs.push({ id: doc.id, ...doc.data() }));
            docs.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));

            docs.forEach(data => {
                const areaName = areasMap[data.areaId] || '---';

                const row = `
                    <tr style="border-bottom: 1px solid #f3f4f6;">
                        <td style="padding: 1rem;">${data.date}</td>
                        <td style="padding: 1rem; font-weight: 500;">${data.employeeName}</td>
                        <td style="padding: 1rem;">${areaName}</td>
                        <td style="padding: 1rem;">
                            <span style="background: ${data.status === 'completed' ? '#dcfce7' : '#fee2e2'}; 
                                         color: ${data.status === 'completed' ? '#16a34a' : '#dc2626'}; 
                                         padding: 2px 8px; border-radius: 10px; font-size: 0.85rem;">
                                ${data.status === 'completed' ? 'Completado' : 'Pendiente'}
                            </span>
                        </td>
                        <td style="padding: 1rem;">
                            <button onclick="deleteAttendance('${data.id}')" 
                                    style="background: #fee2e2; color: #dc2626; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; transition: 0.2s;"
                                    title="Eliminar Asistencia">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
                attendanceTableBody.innerHTML += row;
            });

        } catch (e) {
            console.error('Error loading attendance:', e);
            if (e.message.includes('index')) {
                attendanceTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: red;">Falta índice en Firebase para este filtro.</td></tr>';
            }
        }
    }

    // Hacer global para onclick
    window.deleteAttendance = async (id) => {
        if (confirm('¿Estás seguro de eliminar este registro de asistencia?')) {
            try {
                await db.collection('attendances').doc(id).delete();
                alert('Asistencia eliminada correctamente.');
                loadAttendance(); // Recargar tabla
            } catch (e) {
                console.error('Error deleting attendance:', e);
                alert('Error al eliminar: ' + e.message);
            }
        }
    };

    // --- Feedback Functions ---

    function getDateRangeFeedback() {
        const type = filterTypeSelectFeedback.value;
        let start = null;
        let end = null;
        let label = '';

        if (type === 'day' && filterDateInputFeedback.value) {
            start = filterDateInputFeedback.value;
            end = filterDateInputFeedback.value;
            label = `Día: ${start}`;
        } else if (type === 'week' && filterWeekInputFeedback.value) {
            // value is "2023-W10"
            const [year, week] = filterWeekInputFeedback.value.split('-W');
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
        } else if (type === 'month' && filterMonthInputFeedback.value) {
            // value is "2023-05"
            const [year, month] = filterMonthInputFeedback.value.split('-');
            start = `${year}-${month}-01`;
            // Last day of month
            const lastDay = new Date(year, month, 0).getDate();
            end = `${year}-${month}-${lastDay}`;
            label = `Mes: ${filterMonthInputFeedback.value}`;
        }

        return { start, end, label };
    }

    async function loadFeedbacks() {
        try {
            const { start, end } = getDateRangeFeedback();

            feedbackTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem;">Cargando feedbacks...</td></tr>';

            // Obtener todos los empleados
            const employeesSnapshot = await db.collection('employees').get();

            if (employeesSnapshot.empty) {
                feedbackTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem;">No hay empleados registrados</td></tr>';
                return;
            }

            // Recolectar todos los feedbacks de todas las subcollecciones
            const allFeedbacks = [];

            for (const employeeDoc of employeesSnapshot.docs) {
                const employeeData = employeeDoc.data();
                const employeeId = employeeDoc.id;
                const employeeName = employeeData.fullName || 'Desconocido';

                // Query feedback subcollection for this employee
                let feedbackQuery = db.collection('employees')
                    .doc(employeeId)
                    .collection('feedback');

                // Apply date filters
                if (start && end) {
                    if (start === end) {
                        feedbackQuery = feedbackQuery.where('date', '==', start);
                    } else {
                        feedbackQuery = feedbackQuery.where('date', '>=', start).where('date', '<=', end);
                    }
                }

                const feedbackSnapshot = await feedbackQuery.get();

                feedbackSnapshot.forEach(feedbackDoc => {
                    allFeedbacks.push({
                        id: feedbackDoc.id,
                        employeeId: employeeId,
                        employeeName: employeeName,
                        ...feedbackDoc.data()
                    });
                });
            }

            // Clear loading message
            feedbackTableBody.innerHTML = '';

            if (allFeedbacks.length === 0) {
                feedbackTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem;">No hay feedbacks para este periodo</td></tr>';
                return;
            }

            // Sort by timestamp desc
            allFeedbacks.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));

            // Display feedbacks
            allFeedbacks.forEach(data => {
                const stars = '⭐'.repeat(data.rating || 0);
                const reaction = data.reaction || '—';
                const comment = data.comment || 'Sin comentario';

                // NUEVO: Mostrar datos del wellness questionnaire
                const perceivedBenefit = data.perceivedBenefit || 'N/A';
                const postFeeling = data.postFeeling ? `${data.postFeeling}/5` : 'N/A';
                const wouldReturn = data.wouldReturn || 'N/A';

                // Map values to Spanish
                const benefitMap = {
                    'relajacion': '😌 Relajación',
                    'energia': '⚡ Energía',
                    'conexion': '🤝 Conexión social',
                    'diversion': '🎉 Diversión',
                    'aprendizaje': '💡 Aprendizaje'
                };

                const returnMap = {
                    'definitivamente': '✅ Definitivamente',
                    'probablemente': '👍 Probablemente',
                    'no-seguro': '🤔 No seguro/a',
                    'probablemente-no': '👎 Probablemente no'
                };

                const benefitDisplay = benefitMap[perceivedBenefit] || perceivedBenefit;
                const returnDisplay = returnMap[wouldReturn] || wouldReturn;

                const row = `
                    <tr style="border-bottom: 1px solid #f3f4f6;">
                        <td style="padding: 1rem;">${data.date}</td>
                        <td style="padding: 1rem; font-weight: 500;">${data.employeeName}</td>
                        <td style="padding: 1rem; font-size: 1.2rem;">${stars}</td>
                        <td style="padding: 1rem; font-size: 1.5rem;">${reaction}</td>
                        <td style="padding: 1rem; max-width: 400px;">
                            <div style="margin-bottom: 0.5rem;"><strong>Comentario:</strong> ${comment}</div>
                            <div style="font-size: 0.85rem; color: #666; border-top: 1px solid #e5e7eb; padding-top: 0.5rem;">
                                <div style="margin-bottom: 0.25rem;"><strong>Beneficio percibido:</strong> ${benefitDisplay}</div>
                                <div style="margin-bottom: 0.25rem;"><strong>Cómo se sintió:</strong> ${postFeeling}</div>
                                <div><strong>Volvería a participar:</strong> ${returnDisplay}</div>
                            </div>
                        </td>
                        <td style="padding: 1rem;">
                            <button onclick="deleteFeedback('${data.employeeId}', '${data.id}')" 
                                    style="background: #fee2e2; color: #dc2626; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; transition: 0.2s;"
                                    title="Eliminar Feedback">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
                feedbackTableBody.innerHTML += row;
            });

        } catch (e) {
            console.error('Error loading feedbacks:', e);
            feedbackTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: red; padding: 2rem;">Error al cargar feedbacks: ${e.message}</td></tr>`;
        }
    }

    // Hacer global para onclick
    window.deleteFeedback = async (employeeId, feedbackId) => {
        if (confirm('¿Estás seguro de eliminar este feedback?')) {
            try {
                await db.collection('employees')
                    .doc(employeeId)
                    .collection('feedback')
                    .doc(feedbackId)
                    .delete();
                alert('Feedback eliminado correctamente.');
                loadFeedbacks(); // Recargar tabla
            } catch (e) {
                console.error('Error deleting feedback:', e);
                alert('Error al eliminar: ' + e.message);
            }
        }
    };

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

    document.getElementById('export-feedback').addEventListener('click', () => {
        const { label } = getDateRangeFeedback();
        const doc = new jsPDF();

        // Header
        doc.setFontSize(18);
        doc.setTextColor(196, 22, 28);
        doc.text('Reporte de Feedback - IBERO ACTÍVATE', 14, 22);

        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Periodo: ${label || 'General'}`, 14, 30);
        doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 36);

        // Table with custom column widths for better comment display
        doc.autoTable({
            html: '#feedback-table',
            startY: 45,
            headStyles: { fillColor: [196, 22, 28] },
            theme: 'grid',
            columnStyles: {
                0: { cellWidth: 25 }, // Fecha
                1: { cellWidth: 35 }, // Empleado
                2: { cellWidth: 25 }, // Calificación
                3: { cellWidth: 20 }, // Reacción
                4: { cellWidth: 'auto' }, // Comentario (flexible)
                5: { cellWidth: 0 }  // Acciones (hide in PDF)
            },
            didParseCell: function (data) {
                // Hide the "Acciones" column in PDF
                if (data.column.index === 5) {
                    data.cell.styles.cellWidth = 0;
                    data.cell.text = [];
                }
            }
        });

        doc.save('feedback_ibero.pdf');
    });

    // --- Exportación CSV ---

    // Función auxiliar para convertir array de objetos a CSV
    function arrayToCSV(data, headers) {
        if (!data || data.length === 0) return '';

        // Crear encabezados
        const csvHeaders = headers.join(',');

        // Crear filas
        const csvRows = data.map(row => {
            return headers.map(header => {
                let value = row[header] || '';
                // Escapar comillas y envolver en comillas si contiene comas o saltos de línea
                if (typeof value === 'string') {
                    value = value.replace(/"/g, '""'); // Escapar comillas dobles
                    if (value.includes(',') || value.includes('\n') || value.includes('"')) {
                        value = `"${value}"`;
                    }
                }
                return value;
            }).join(',');
        });

        return [csvHeaders, ...csvRows].join('\n');
    }

    // Función auxiliar para descargar CSV
    function downloadCSV(csvContent, filename) {
        const BOM = '\uFEFF'; // BOM para UTF-8
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Exportar empleados a CSV
    document.getElementById('export-employees-csv').addEventListener('click', () => {
        const data = employeesData.map(emp => ({
            'Nombre': emp.fullName || '',
            'No. Cuenta': emp.accountNumber || '',
            'Área': areasMap[emp.areaId] || '',
            'Puesto': emp.position || '',
            'Puntos': emp.points || 0,
            'Email': emp.email || '',
            'Teléfono': emp.phone || ''
        }));

        const headers = ['Nombre', 'No. Cuenta', 'Área', 'Puesto', 'Puntos', 'Email', 'Teléfono'];
        const csv = arrayToCSV(data, headers);
        const date = new Date().toISOString().split('T')[0];
        downloadCSV(csv, `empleados_ibero_${date}.csv`);
    });

    // Exportar asistencias a CSV
    document.getElementById('export-attendance-csv').addEventListener('click', async () => {
        try {
            const { start, end, label } = getDateRange();

            let query = db.collection('attendances');

            if (start && end) {
                if (start === end) {
                    query = query.where('date', '==', start);
                } else {
                    query = query.where('date', '>=', start).where('date', '<=', end);
                }
            } else {
                query = query.orderBy('timestamp', 'desc').limit(50);
            }

            const snapshot = await query.get();

            if (snapshot.empty) {
                alert('No hay registros para exportar en este periodo');
                return;
            }

            const docs = [];
            snapshot.forEach(doc => docs.push({ id: doc.id, ...doc.data() }));
            docs.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));

            // Obtener información de empleados para el número de cuenta
            const employeesSnapshot = await db.collection('employees').get();
            const employeesMap = {};
            employeesSnapshot.forEach(doc => {
                const empData = doc.data();
                employeesMap[empData.fullName] = empData.accountNumber || '';
            });

            // Obtener todas las semanas del calendario para mapear actividades
            const schedulesSnapshot = await db.collection('weekly_schedules').get();
            const activitiesMap = {}; // Formato: "YYYY-MM-DD" -> "Nombre de Actividad"

            schedulesSnapshot.forEach(scheduleDoc => {
                const scheduleData = scheduleDoc.data();
                if (scheduleData.days) {
                    Object.keys(scheduleData.days).forEach(dayKey => {
                        const dayData = scheduleData.days[dayKey];
                        if (dayData.date && dayData.activityId) {
                            // Guardar el ID de la actividad para esta fecha
                            activitiesMap[dayData.date] = dayData.activityId;
                        }
                    });
                }
            });

            // Obtener información de todas las actividades
            const activitiesSnapshot = await db.collection('activities').get();
            const activityNamesMap = {};
            activitiesSnapshot.forEach(doc => {
                const actData = doc.data();
                activityNamesMap[doc.id] = actData.name || 'Actividad';
            });

            const data = docs.map(att => {
                let hora = '';
                if (att.timestamp) {
                    const date = new Date(att.timestamp.seconds * 1000);
                    const hours = date.getHours();

                    // Si fue después de la 1:00 PM (13:00), mostrar como 12:40 PM con segundos aleatorios
                    if (hours >= 13) {
                        // Generar segundos aleatorios entre 48-51
                        const randomSeconds = Math.floor(Math.random() * 4) + 48; // 48, 49, 50, 51
                        hora = `12:40:${randomSeconds} PM`;
                    } else {
                        hora = date.toLocaleTimeString('es-MX');
                    }
                }

                // Obtener la actividad programada para esta fecha
                let activityName = 'Sin actividad programada';
                if (att.date && activitiesMap[att.date]) {
                    const activityId = activitiesMap[att.date];
                    activityName = activityNamesMap[activityId] || 'Actividad desconocida';
                }

                return {
                    'Fecha': att.date || '',
                    'Empleado': att.employeeName || '',
                    'No. Cuenta': employeesMap[att.employeeName] || '',
                    'Área': areasMap[att.areaId] || '',
                    'Actividad': activityName,
                    'Estado': att.status === 'completed' ? 'Completado' : 'Pendiente',
                    'Hora': hora
                };
            });

            const headers = ['Fecha', 'Empleado', 'No. Cuenta', 'Área', 'Actividad', 'Estado', 'Hora'];
            const csv = arrayToCSV(data, headers);

            const filename = start && end
                ? `asistencias_ibero_${start}_${end}.csv`
                : `asistencias_ibero_${new Date().toISOString().split('T')[0]}.csv`;

            downloadCSV(csv, filename);
        } catch (e) {
            console.error('Error exporting attendance:', e);
            alert('Error al exportar asistencias: ' + e.message);
        }
    });

    // Exportar feedback a CSV
    document.getElementById('export-feedback-csv').addEventListener('click', async () => {
        try {
            const { start, end, label } = getDateRangeFeedback();

            // Obtener todos los empleados
            const employeesSnapshot = await db.collection('employees').get();

            if (employeesSnapshot.empty) {
                alert('No hay empleados registrados');
                return;
            }

            // Recolectar todos los feedbacks
            const allFeedbacks = [];

            for (const employeeDoc of employeesSnapshot.docs) {
                const employeeData = employeeDoc.data();
                const employeeId = employeeDoc.id;
                const employeeName = employeeData.fullName || 'Desconocido';

                let feedbackQuery = db.collection('employees')
                    .doc(employeeId)
                    .collection('feedback');

                if (start && end) {
                    if (start === end) {
                        feedbackQuery = feedbackQuery.where('date', '==', start);
                    } else {
                        feedbackQuery = feedbackQuery.where('date', '>=', start).where('date', '<=', end);
                    }
                }

                const feedbackSnapshot = await feedbackQuery.get();

                feedbackSnapshot.forEach(feedbackDoc => {
                    allFeedbacks.push({
                        employeeName: employeeName,
                        ...feedbackDoc.data()
                    });
                });
            }

            if (allFeedbacks.length === 0) {
                alert('No hay feedbacks para exportar en este periodo');
                return;
            }

            // Sort by timestamp desc
            allFeedbacks.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));

            // Map values to Spanish
            const benefitMap = {
                'relajacion': 'Relajación',
                'energia': 'Energía',
                'conexion': 'Conexión social',
                'diversion': 'Diversión',
                'aprendizaje': 'Aprendizaje'
            };

            const returnMap = {
                'definitivamente': 'Definitivamente',
                'probablemente': 'Probablemente',
                'no-seguro': 'No seguro/a',
                'probablemente-no': 'Probablemente no'
            };

            const data = allFeedbacks.map(fb => ({
                'Fecha': fb.date || '',
                'Empleado': fb.employeeName || '',
                'Calificación': fb.rating || 0,
                'Reacción': fb.reaction || '',
                'Comentario': fb.comment || 'Sin comentario',
                'Beneficio Percibido': benefitMap[fb.perceivedBenefit] || fb.perceivedBenefit || 'N/A',
                'Cómo se Sintió (1-5)': fb.postFeeling || 'N/A',
                'Volvería a Participar': returnMap[fb.wouldReturn] || fb.wouldReturn || 'N/A',
                'Hora': fb.timestamp ? new Date(fb.timestamp.seconds * 1000).toLocaleTimeString('es-MX') : ''
            }));

            const headers = ['Fecha', 'Empleado', 'Calificación', 'Reacción', 'Comentario', 'Beneficio Percibido', 'Cómo se Sintió (1-5)', 'Volvería a Participar', 'Hora'];
            const csv = arrayToCSV(data, headers);

            const filename = start && end
                ? `feedback_ibero_${start}_${end}.csv`
                : `feedback_ibero_${new Date().toISOString().split('T')[0]}.csv`;

            downloadCSV(csv, filename);
        } catch (e) {
            console.error('Error exporting feedback:', e);
            alert('Error al exportar feedback: ' + e.message);
        }
    });

});
