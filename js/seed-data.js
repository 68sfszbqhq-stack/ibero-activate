// Script para cargar datos de prueba (Semilla)

async function seedDatabase() {
    const statusDiv = document.getElementById('seed-status');
    const btn = document.getElementById('seed-btn');

    // Helper para log
    function log(msg, type = 'info') {
        const p = document.createElement('p');
        p.textContent = msg;
        p.className = type;
        statusDiv.appendChild(p);
        statusDiv.scrollTop = statusDiv.scrollHeight;
    }

    btn.disabled = true;
    statusDiv.innerHTML = '';
    log('🚀 Iniciando carga de datos...', 'info');

    try {
        // 1. Crear Áreas
        const areas = [
            { name: 'Recursos Humanos', description: 'Gestión de talento' },
            { name: 'Tecnología (TI)', description: 'Soporte y desarrollo' },
            { name: 'Finanzas', description: 'Contabilidad y administración' },
            { name: 'Marketing', description: 'Publicidad y redes' }
        ];

        const areaIds = [];

        log('📦 Creando áreas...', 'info');

        for (const area of areas) {
            // Verificar si ya existe
            const snapshot = await db.collection('areas').where('name', '==', area.name).get();

            let areaId;
            if (!snapshot.empty) {
                log(`⚠ Área "${area.name}" ya existe. Saltando.`, 'warning');
                areaId = snapshot.docs[0].id;
            } else {
                const docRef = await db.collection('areas').add(area);
                areaId = docRef.id;
                log(`✅ Área "${area.name}" creada.`, 'success');
            }
            areaIds.push({ id: areaId, name: area.name });
        }

        // 2. Crear Empleados
        const employees = [
            // RH
            { fullName: 'Ana García', accountNumber: '1001', areaIdx: 0 },
            { fullName: 'Carlos López', accountNumber: '1002', areaIdx: 0 },
            { fullName: 'María Rodríguez', accountNumber: '1003', areaIdx: 0 },
            // TI
            { fullName: 'David Martínez', accountNumber: '2001', areaIdx: 1 },
            { fullName: 'Elena Sánchez', accountNumber: '2002', areaIdx: 1 },
            { fullName: 'Fernando Torres', accountNumber: '2003', areaIdx: 1 },
            { fullName: 'Gabriel Ruiz', accountNumber: '2004', areaIdx: 1 },
            // Finanzas
            { fullName: 'Isabel Jiménez', accountNumber: '3001', areaIdx: 2 },
            { fullName: 'Javier Morales', accountNumber: '3002', areaIdx: 2 },
            // Marketing
            { fullName: 'Laura Castro', accountNumber: '4001', areaIdx: 3 },
            { fullName: 'Miguel Ángel', accountNumber: '4002', areaIdx: 3 }
        ];

        log('👥 Creando empleados...', 'info');

        for (const emp of employees) {
            // Verificar si ya existe
            const snapshot = await db.collection('employees')
                .where('accountNumber', '==', emp.accountNumber)
                .get();

            if (!snapshot.empty) {
                log(`⚠ Empleado #${emp.accountNumber} ya existe. Saltando.`, 'warning');
            } else {
                const area = areaIds[emp.areaIdx];
                await db.collection('employees').add({
                    fullName: emp.fullName,
                    accountNumber: emp.accountNumber,
                    areaId: area.id,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                log(`✅ Empleado "${emp.fullName}" (${area.name}) creado.`, 'success');
            }
        }

        // 3. Generar Asistencias y Feedbacks (Historial)
        log('📅 Generando historial de asistencias y feedbacks...', 'info');

        // Obtener todos los empleados
        const empSnapshot = await db.collection('employees').get();
        const allEmployees = [];
        empSnapshot.forEach(doc => allEmployees.push({ id: doc.id, ...doc.data() }));

        const reactions = ['happy', 'neutral', 'excited', 'tired'];
        const comments = ['Excelente sesión', 'Me ayudó mucho', 'Gracias', 'Muy divertido', ''];

        // Generar datos para los últimos 7 días
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            // Seleccionar 5 empleados al azar por día
            const dailyAttendees = allEmployees.sort(() => 0.5 - Math.random()).slice(0, 5);

            for (const emp of dailyAttendees) {
                // Crear Asistencia
                const attendanceRef = await db.collection('attendances').add({
                    employeeId: emp.id,
                    employeeName: emp.fullName,
                    areaId: emp.areaId,
                    date: dateStr,
                    timestamp: firebase.firestore.Timestamp.fromDate(date),
                    status: 'completed',
                    weekNumber: getWeekNumber(date),
                    year: date.getFullYear()
                });

                // Crear Feedback
                const rating = Math.floor(Math.random() * 3) + 3; // 3 to 5
                const points = 10 + (rating * 2);

                await db.collection('feedbacks').add({
                    employeeId: emp.id,
                    attendanceId: attendanceRef.id,
                    rating: rating,
                    reaction: reactions[Math.floor(Math.random() * reactions.length)],
                    comment: comments[Math.floor(Math.random() * comments.length)],
                    timestamp: firebase.firestore.Timestamp.fromDate(date),
                    date: dateStr
                });

                // Actualizar Puntos del Empleado
                await db.collection('employees').doc(emp.id).update({
                    points: firebase.firestore.FieldValue.increment(points),
                    lastAttendance: firebase.firestore.Timestamp.fromDate(date)
                });
            }
            log(`✅ Datos generados para ${dateStr}`, 'success');
        }

        function getWeekNumber(d) {
            d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
            d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
            var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
            return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        }

        log('✨ ¡Proceso finalizado con éxito!', 'success');
        log('Ahora puedes ir al Pase de Lista o al Feedback.', 'info');

    } catch (error) {
        console.error(error);
        log(`❌ Error: ${error.message}`, 'error');
    } finally {
        btn.disabled = false;
    }
}
