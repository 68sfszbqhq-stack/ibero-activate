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

    // Tabs Logic
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all
            tabs.forEach(t => {
                t.classList.remove('text-indigo-600', 'border-indigo-600');
                t.classList.add('text-gray-500', 'border-transparent');
            });
            contents.forEach(c => c.classList.add('hidden'));

            // Add active class to current
            tab.classList.remove('text-gray-500', 'border-transparent');
            tab.classList.add('text-indigo-600', 'border-indigo-600');

            // Show content
            const targetId = tab.dataset.tab + '-tab';
            document.getElementById(targetId).classList.remove('hidden');
        });
    });

    // Set default tab (Feedback)
    if (tabs.length > 0) tabs[0].click();

    if (!empId) {
        alert('No se especificó un empleado');
        window.location.href = 'dashboard.html';
        return;
    }

    loadEmployeeDetails(empId);
    loadWellnessHistory(empId);

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

            const feedbackList = document.getElementById('feedback-list');
            feedbackList.innerHTML = '';

            let totalRating = 0;

            if (feedbackSnapshot.empty) {
                feedbackList.innerHTML = '<div class="p-8 text-center text-gray-400">Sin feedback registrado</div>';
                document.getElementById('avg-rating').textContent = '-';
                document.getElementById('avg-stars').innerHTML = '';
            } else {
                const lastDate = feedbackSnapshot.docs[0].data().date;
                document.getElementById('last-feedback-date').textContent = lastDate;
                document.getElementById('total-feedbacks').textContent = feedbackSnapshot.size;

                feedbackSnapshot.forEach(doc => {
                    const data = doc.data();
                    totalRating += data.rating;

                    const item = document.createElement('div');
                    item.className = 'p-6 hover:bg-gray-50 transition-colors';
                    item.innerHTML = `
                        <div class="flex justify-between items-start mb-2">
                            <div class="flex items-center gap-2">
                                <span class="font-medium text-gray-900">${'⭐'.repeat(data.rating)}</span>
                                <span class="text-sm text-gray-500">• ${data.date}</span>
                            </div>
                            <div class="text-2xl">${data.reaction || ''}</div>
                        </div>
                        <p class="text-gray-600 text-sm leading-relaxed">${data.comment || 'Sin comentario'}</p>
                    `;
                    feedbackList.appendChild(item);
                });

                // Calcular Promedio
                const avg = (totalRating / feedbackSnapshot.size).toFixed(1);
                document.getElementById('avg-rating').textContent = avg;

                // Render stars for average
                const fullStars = Math.floor(avg);
                const hasHalf = avg % 1 >= 0.5;
                let starsHtml = '';
                for (let i = 0; i < fullStars; i++) starsHtml += '<i class="fa-solid fa-star"></i>';
                if (hasHalf) starsHtml += '<i class="fa-solid fa-star-half-stroke"></i>';
                document.getElementById('avg-stars').innerHTML = starsHtml;
            }

        } catch (error) {
            console.error('Error cargando detalles:', error);
        }
    }

    async function loadWellnessHistory(id) {
        try {
            const snapshot = await db.collection('wellness_tests')
                .where('employeeId', '==', id)
                .orderBy('timestamp', 'desc')
                .get();

            const tbody = document.getElementById('wellness-list');
            tbody.innerHTML = '';

            if (snapshot.empty) {
                tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-gray-400">No hay pruebas registradas</td></tr>';
                return;
            }

            snapshot.forEach(doc => {
                const data = doc.data();

                // Color badge logic
                let badgeColor = 'bg-gray-100 text-gray-800';
                if (['Alto', 'Muy Alto', 'Severa', 'Moderadamente severa'].includes(data.level)) {
                    badgeColor = 'bg-red-100 text-red-800';
                } else if (['Moderado', 'Leve'].includes(data.level)) {
                    badgeColor = 'bg-yellow-100 text-yellow-800';
                } else if (['Bajo', 'Mínima'].includes(data.level)) {
                    badgeColor = 'bg-green-100 text-green-800';
                }

                const row = document.createElement('tr');
                row.className = 'hover:bg-gray-50 transition-colors';
                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${data.date}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${data.testTitle || data.type}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${badgeColor}">
                            ${data.level}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${data.score}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onclick="viewTestDetails('${doc.id}')" class="text-indigo-600 hover:text-indigo-900">Ver respuestas</button>
                    </td>
                `;
                tbody.appendChild(row);
            });

        } catch (error) {
            console.error("Error loading wellness history:", error);
            document.getElementById('wellness-list').innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-red-400">Error cargando datos</td></tr>';
        }
    }

    // Global function for modal (placeholder for now)
    window.viewTestDetails = (testId) => {
        alert('Detalle completo próximamente. ID: ' + testId);
        // TODO: Implement modal to show specific answers if needed
    };
});
