// Lógica de Detalle de Empleado (Admin)
document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticación
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.href = 'login.html';
        }
    });

    // Obtener ID de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const empId = urlParams.get('id');

    if (!empId) {
        alert('No se especificó un empleado');
        window.location.href = 'dashboard.html';
        return;
    }

    loadEmployeeDetails(empId);

    async function loadEmployeeDetails(id) {
        try {
            // 1. Cargar Perfil
            const empDoc = await db.collection('employees').doc(id).get();
            if (!empDoc.exists) {
                document.getElementById('emp-name').textContent = 'Empleado no encontrado';
                return;
            }
            const empData = empDoc.data();

            // Resolver nombre del área
            let areaName = '---';
            if (empData.areaId) {
                const areaDoc = await db.collection('areas').doc(empData.areaId).get();
                if (areaDoc.exists) areaName = areaDoc.data().name;
            }

            document.getElementById('emp-name').textContent = empData.fullName;
            document.getElementById('emp-details').textContent = `${areaName} • #${empData.accountNumber || '---'}`;
            document.getElementById('total-points').textContent = empData.points || 0;

            // 2. Cargar Asistencias (Total)
            const attendancesSnapshot = await db.collection('attendances')
                .where('employeeId', '==', id)
                .get();
            document.getElementById('total-attendances').textContent = attendancesSnapshot.size;

            // 3. Cargar Feedback (Historial)
            const feedbackSnapshot = await db.collection('feedbacks')
                .where('employeeId', '==', id)
                .orderBy('timestamp', 'desc')
                .get();

            const tbody = document.getElementById('feedback-history-body');
            tbody.innerHTML = '';

            let totalRating = 0;

            if (feedbackSnapshot.empty) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 1rem;">Sin feedback registrado</td></tr>';
            } else {
                feedbackSnapshot.forEach(doc => {
                    const data = doc.data();
                    totalRating += data.rating;

                    const row = document.createElement('tr');
                    row.style.borderBottom = '1px solid #f3f4f6';
                    row.innerHTML = `
                        <td style="padding: 1rem;">${data.date}</td>
                        <td style="padding: 1rem;">${'⭐'.repeat(data.rating)}</td>
                        <td style="padding: 1rem; font-size: 1.2rem;">${data.reaction || '-'}</td>
                        <td style="padding: 1rem; color: #666;">${data.comment || ''}</td>
                    `;
                    tbody.appendChild(row);
                });

                // Calcular Promedio
                const avg = (totalRating / feedbackSnapshot.size).toFixed(1);
                document.getElementById('avg-mood').textContent = `${avg} / 5.0`;
            }

        } catch (error) {
            console.error('Error cargando detalles:', error);
        }
    }
});
