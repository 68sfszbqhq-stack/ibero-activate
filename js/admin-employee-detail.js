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

            // 2. Cargar Asistencias (Total) desde subcollection
            const attendancesSnapshot = await db.collection('employees')
                .doc(id)
                .collection('attendance')
                .get();
            document.getElementById('total-attendances').textContent = attendancesSnapshot.size;

            // 3. Cargar Feedback (Historial)
            const feedbackSnapshot = await db.collection('employees')
                .doc(id)
                .collection('feedback')
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
            const snapshot = await db.collection('employees')
                .doc(id)
                .collection('health_surveys')
                .get();

            const tbody = document.getElementById('wellness-list');
            tbody.innerHTML = '';

            if (snapshot.empty) {
                tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-gray-400">No hay pruebas registradas</td></tr>';
                return;
            }

            // Client-side sort (avoid index requirement)
            const docs = snapshot.docs.sort((a, b) => {
                const timeA = a.data().timestamp ? a.data().timestamp.toMillis() : 0;
                const timeB = b.data().timestamp ? b.data().timestamp.toMillis() : 0;
                return timeB - timeA;
            });

            docs.forEach(doc => {
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
                        <button onclick="viewTestDetails('${doc.id}')" class="text-indigo-600 hover:text-indigo-900 mr-3">Ver respuestas</button>
                        <button onclick="deleteWellnessTest('${doc.id}')" class="text-red-600 hover:text-red-900" title="Eliminar Test">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });

        } catch (error) {
            console.error("Error loading wellness history:", error);
            document.getElementById('wellness-list').innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-red-400">Error cargando datos</td></tr>';
        }
    }

    // Global function to delete wellness test
    window.deleteWellnessTest = async (testId) => {
        if (confirm('¿Estás seguro de eliminar este test? Esta acción no se puede deshacer.')) {
            try {
                await db.collection('employees')
                    .doc(empId)
                    .collection('health_surveys')
                    .doc(testId)
                    .delete();
                alert('Test eliminado correctamente.');
                // Reload history
                const urlParams = new URLSearchParams(window.location.search);
                const employeeId = urlParams.get('id');
                if (employeeId) loadWellnessHistory(employeeId);
            } catch (error) {
                console.error("Error deleting test:", error);
                alert("Error al eliminar el test: " + error.message);
            }
        }
    };

    // --- MODAL LOGIC ---
    const modal = document.getElementById('test-details-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
        });
    }

    // TEST DEFINITIONS (Copy from wellness.js for mapping)
    const TESTS = {
        ansiedad: {
            questions: [
                "Me siento nervioso o ansioso antes de ir al trabajo.",
                "Tengo dificultades para concentrarme en mis tareas debido a preocupaciones laborales.",
                "Siento que mi trabajo me abruma frecuentemente.",
                "Me preocupo constantemente por cometer errores en mi trabajo.",
                "Siento tensión o presión en el pecho cuando pienso en mis responsabilidades laborales.",
                "Tengo problemas para dormir porque pienso en mi trabajo.",
                "Me siento irritable o impaciente con mis compañeros de trabajo.",
                "Siento que no puedo cumplir con las expectativas de mi jefe o equipo.",
                "Experimentó palpitaciones o taquicardia cuando estoy en el trabajo.",
                "Me siento agotado emocionalmente por las demandas de mi trabajo.",
                "Tengo miedo de no poder manejar situaciones difíciles en el trabajo.",
                "Siento que mi trabajo afecta negativamente mi vida personal.",
                "Me preocupo por mi desempeño laboral incluso fuera del horario de trabajo.",
                "Siento que no tengo control sobre las exigencias de mi trabajo.",
                "Tengo pensamientos recurrentes sobre problemas laborales que no puedo controlar.",
                "Siento una sensación de inquietud o nerviosismo durante mi jornada laboral.",
                "Me siento inseguro sobre mi capacidad para realizar mis tareas laborales.",
                "Siento que mi trabajo me genera estrés constante.",
                "Tengo síntomas físicos (como dolores de cabeza o estómago) relacionados con mi trabajo.",
                "Me siento ansioso por el futuro de mi carrera o estabilidad laboral."
            ],
            options: ["Nunca", "A veces", "Frecuentemente", "Siempre"]
        },
        burnout: {
            questions: [
                "Debido a mi trabajo me siento emocionalmente agotado o agotada.",
                "Al final del día me siento agotado o agotada.",
                "Me encuentro cansado o cansada cuando me levanto por la mañana y tengo que enfrentarme a otro día de trabajo.",
                "Puedo entender con facilidad lo que piensan las personas con quienes trabajo.",
                "Creo que trato a las personas como si fueran objetos.",
                "Trabajar con personas todos los días es una tensión para mí.",
                "Me enfrento muy bien a los problemas de trabajo que se me presentan.",
                "Me siento 'quemado' o 'quemada' por mi trabajo.",
                "Siento que con mi trabajo estoy influyendo positivamente en la vida de otros.",
                "Creo que tengo un trato más insensible con las personas desde que tengo este trabajo.",
                "Me preocupa que este trabajo me esté endureciendo emocionalmente.",
                "Me encuentro con mucha vitalidad.",
                "Me siento frustrado por mi trabajo.",
                "Siento que estoy haciendo un trabajo muy duro.",
                "Realmente no me importa lo que pueda suceder a las personas que me rodean.",
                "Trabajar directamente con personas me produce estrés.",
                "Tengo facilidad para crear un ambiente de confianza con las personas con quienes trabajo.",
                "Me encuentro relajado después de una junta de trabajo.",
                "He realizado muchas cosas que valen la pena en este trabajo.",
                "En el trabajo siento que estoy al límite de mis posibilidades.",
                "Siento que sé tratar de forma adecuada los problemas emocionales en el trabajo.",
                "Siento que las personas en mi trabajo me culpan de algunos de sus problemas."
            ],
            options: ["Nunca", "Alguna vez al año", "Una vez al mes", "Algunas veces al mes", "Una vez a la semana", "Varias veces a la semana", "Todos los días"]
        },
        depresion: {
            questions: [
                "Poco interés o placer en hacer cosas",
                "Sentirse deprimido, triste o sin esperanzas",
                "Dificultad para conciliar o mantener el sueño, o dormir demasiado",
                "Sentirse cansado o con poca energía",
                "Poco apetito o comer en exceso",
                "Sentirse mal consigo mismo, o que es un fracaso, o que ha decepcionado a su familia o a sí mismo",
                "Dificultad para concentrarse en cosas, como leer el periódico o ver televisión",
                "Moverse o hablar tan despacio que otras personas lo han notado, o lo contrario, estar tan inquieto o agitado que ha estado moviéndose más de lo habitual",
                "Pensamientos de que estaría mejor muerto o de hacerse daño de alguna manera"
            ],
            options: ["Nada", "Varios días", "Más de la mitad de los días", "Casi todos los días"]
        },
        estres: {
            questions: [
                "¿Sientes que tu carga de trabajo es excesiva?",
                "¿Tienes control sobre cómo realizas tu trabajo?",
                "¿Recibes apoyo suficiente de tus superiores y compañeros?",
                "¿Cómo son tus relaciones interpersonales en el trabajo?",
                "¿Está claro tu rol y responsabilidades en el trabajo?",
                "¿Cómo manejas los cambios en tu entorno laboral?"
            ],
            options: ["Nunca / Muy Malo", "Poco / Malo", "Regular", "Bueno / Bastante", "Siempre / Excelente"]
        }
    };

    window.viewTestDetails = async (testId) => {
        try {
            const doc = await db.collection('employees')
                .doc(empId)
                .collection('health_surveys')
                .doc(testId)
                .get();
            if (!doc.exists) {
                alert('No se encontró el test');
                return;
            }
            const data = doc.data();
            const testDef = TESTS[data.type];

            if (!testDef) {
                alert('Tipo de test desconocido: ' + data.type);
                return;
            }

            // Populate Modal
            document.getElementById('modal-test-title').textContent = data.testTitle || data.type;
            document.getElementById('modal-test-date').textContent = `Fecha: ${data.date}`;
            document.getElementById('modal-test-level').textContent = data.level;
            document.getElementById('modal-test-score').textContent = data.score;

            const list = document.getElementById('modal-questions-list');
            list.innerHTML = '';

            data.answers.forEach((ansValue, index) => {
                const question = testDef.questions[index] || `Pregunta ${index + 1}`;
                // Try to find label from options if possible, else show value
                // Note: Values in DB are numbers. Options array is 0-indexed or 1-indexed depending on test.
                // Ansiedad: 1-4. Options index 0-3.
                // Burnout: 0-6. Options index 0-6.
                // Depresion: 0-3. Options index 0-3.
                // Estres: 0-4. Options index 0-4.

                let answerLabel = ansValue;
                if (data.type === 'ansiedad') {
                    answerLabel = testDef.options[ansValue - 1] || ansValue;
                } else {
                    answerLabel = testDef.options[ansValue] || ansValue;
                }

                const item = document.createElement('div');
                item.className = 'bg-gray-50 p-4 rounded-lg';
                item.innerHTML = `
                    <p class="text-gray-800 font-medium text-sm mb-1">${index + 1}. ${question}</p>
                    <p class="text-indigo-600 font-bold text-sm">${answerLabel}</p>
                `;
                list.appendChild(item);
            });

            modal.classList.remove('hidden');

        } catch (error) {
            console.error("Error fetching test details:", error);
            alert("Error al cargar detalles");
        }
    };

    // --- EDIT EMPLOYEE LOGIC ---
    const editModal = document.getElementById('edit-employee-modal');
    const editBtn = document.getElementById('edit-employee-btn');
    const closeEditBtn = document.getElementById('close-edit-modal-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const editForm = document.getElementById('edit-employee-form');
    const saveEditBtn = document.getElementById('save-edit-btn');

    let currentEmployeeData = null;

    // Cargar áreas en el selector del modal
    async function loadAreasForEdit() {
        try {
            const areasSnapshot = await db.collection('areas').get();
            const areaSelect = document.getElementById('edit-areaId');
            areaSelect.innerHTML = '<option value="">Selecciona un área...</option>';

            areasSnapshot.forEach(doc => {
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = doc.data().name;
                areaSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading areas:', error);
        }
    }

    // Abrir modal de edición
    if (editBtn) {
        editBtn.addEventListener('click', async () => {
            if (!empId || !currentEmployeeData) {
                alert('No se pudo cargar la información del empleado');
                return;
            }

            // Cargar áreas si no se han cargado
            await loadAreasForEdit();

            // Llenar formulario con datos actuales
            document.getElementById('edit-fullName').value = currentEmployeeData.fullName || '';
            document.getElementById('edit-accountNumber').value = currentEmployeeData.accountNumber || '';
            document.getElementById('edit-areaId').value = currentEmployeeData.areaId || '';
            document.getElementById('edit-position').value = currentEmployeeData.position || '';
            document.getElementById('edit-email').value = currentEmployeeData.email || '';
            document.getElementById('edit-phone').value = currentEmployeeData.phone || '';

            // Mostrar modal
            editModal.classList.remove('hidden');
            editModal.style.display = 'flex';
        });
    }

    // Cerrar modal
    function closeEditModal() {
        editModal.classList.add('hidden');
        editModal.style.display = 'none';
    }

    if (closeEditBtn) closeEditBtn.addEventListener('click', closeEditModal);
    if (cancelEditBtn) cancelEditBtn.addEventListener('click', closeEditModal);

    // Guardar cambios
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const fullName = document.getElementById('edit-fullName').value.trim();
            const accountNumber = document.getElementById('edit-accountNumber').value.trim();
            const areaId = document.getElementById('edit-areaId').value;
            const position = document.getElementById('edit-position').value.trim();
            const email = document.getElementById('edit-email').value.trim();
            const phone = document.getElementById('edit-phone').value.trim();

            if (!fullName || !accountNumber || !areaId) {
                alert('Por favor completa todos los campos obligatorios');
                return;
            }

            // Deshabilitar botón mientras se guarda
            saveEditBtn.disabled = true;
            saveEditBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

            try {
                // Actualizar en Firestore
                const updateData = {
                    fullName,
                    accountNumber,
                    areaId,
                    position,
                    email,
                    phone,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                await db.collection('employees').doc(empId).update(updateData);

                // Actualizar datos locales
                currentEmployeeData = { ...currentEmployeeData, ...updateData };

                // Actualizar UI inmediatamente
                document.getElementById('emp-name').textContent = fullName;

                // Resolver nombre del área
                const areaDoc = await db.collection('areas').doc(areaId).get();
                const areaName = areaDoc.exists ? areaDoc.data().name : '---';
                document.getElementById('emp-details').textContent = `${areaName} • #${accountNumber}`;

                // Cerrar modal
                closeEditModal();

                // Mostrar mensaje de éxito
                alert('✅ Datos actualizados correctamente');

            } catch (error) {
                console.error('Error actualizando empleado:', error);
                alert('❌ Error al guardar los cambios: ' + error.message);
            } finally {
                saveEditBtn.disabled = false;
                saveEditBtn.innerHTML = '<i class="fa-solid fa-save"></i> Guardar Cambios';
            }
        });
    }

    // Guardar referencia a los datos del empleado cuando se cargan
    async function loadEmployeeDetails(id) {
        try {
            // 1. Cargar Perfil
            const empDoc = await db.collection('employees').doc(id).get();
            if (!empDoc.exists) {
                document.getElementById('emp-name').textContent = 'Empleado no encontrado';
                return;
            }
            const empData = empDoc.data();
            currentEmployeeData = empData; // Guardar para edición

            // Resolver nombre del área
            let areaName = '---';
            if (empData.areaId) {
                const areaDoc = await db.collection('areas').doc(empData.areaId).get();
                if (areaDoc.exists) areaName = areaDoc.data().name;
            }

            document.getElementById('emp-name').textContent = empData.fullName;
            document.getElementById('emp-details').textContent = `${areaName} • #${empData.accountNumber || '---'}`;
            document.getElementById('total-points').textContent = empData.points || 0;

            // 2. Cargar Asistencias (Total) desde subcollection
            const attendancesSnapshot = await db.collection('employees')
                .doc(id)
                .collection('attendance')
                .get();
            document.getElementById('total-attendances').textContent = attendancesSnapshot.size;

            // 3. Cargar Feedback (Historial) desde subcollection
            const feedbackSnapshot = await db.collection('employees')
                .doc(id)
                .collection('feedback')
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
});
