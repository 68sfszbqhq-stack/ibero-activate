document.addEventListener('DOMContentLoaded', () => {
    // Auth Check
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.href = 'login.html';
        } else {
            loadActivities();
        }
    });

    // DOM Elements
    const activitiesGrid = document.getElementById('activities-grid');
    const modal = document.getElementById('activity-modal');
    const form = document.getElementById('activity-form');
    const btnNew = document.getElementById('btn-new-activity');
    const btnImport = document.getElementById('btn-import-catalog');
    const btnClose = document.getElementById('btn-close-modal');
    const btnCancel = document.getElementById('btn-cancel');
    const modalTitle = document.getElementById('modal-title');

    // Event Listeners
    btnNew.addEventListener('click', () => openModal());
    btnImport.addEventListener('click', importCatalog);
    btnClose.addEventListener('click', closeModal);
    btnCancel.addEventListener('click', closeModal);
    form.addEventListener('submit', saveActivity);

    // Load Activities
    async function loadActivities() {
        try {
            const snapshot = await db.collection('activities').get();
            activitiesGrid.innerHTML = '';

            if (snapshot.empty) {
                activitiesGrid.innerHTML = '<p class="text-gray-500 col-span-full text-center py-8">No hay actividades registradas. ¡Crea la primera!</p>';
                return;
            }

            snapshot.forEach(doc => {
                const data = doc.data();
                const card = document.createElement('div');
                card.className = 'card activity-card';
                card.style.position = 'relative';

                // Badge color based on intensity
                let intensityColor = 'bg-green-100 text-green-800';
                if (data.intensity === 'moderada') intensityColor = 'bg-yellow-100 text-yellow-800';
                if (data.intensity === 'alta') intensityColor = 'bg-red-100 text-red-800';

                card.innerHTML = `
                    <div style="font-size: 3rem; margin-bottom: 1rem; text-align: center;">${data.emoji}</div>
                    <h3 style="font-size: 1.2rem; font-weight: 700; margin-bottom: 0.5rem; text-align: center;">${data.name}</h3>
                    
                    <div style="display: flex; justify-content: center; gap: 0.5rem; margin-bottom: 1rem;">
                        <span class="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">${data.type}</span>
                        <span class="px-2 py-1 rounded-full text-xs font-semibold ${intensityColor}">${data.intensity}</span>
                        <span class="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">${data.duration} min</span>
                    </div>

                    <p style="color: #6b7280; font-size: 0.9rem; margin-bottom: 1.5rem; text-align: center;">${data.description}</p>

                    <div style="display: flex; gap: 0.5rem; justify-content: center;">
                        <button onclick="editActivity('${doc.id}')" class="btn-secondary" style="padding: 0.5rem 1rem;">
                            <i class="fa-solid fa-pen"></i> Editar
                        </button>
                        <button onclick="deleteActivity('${doc.id}')" class="btn-secondary" style="padding: 0.5rem 1rem; color: var(--primary); border-color: var(--primary);">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                `;
                activitiesGrid.appendChild(card);
            });

        } catch (error) {
            console.error("Error loading activities:", error);
            activitiesGrid.innerHTML = '<p class="error">Error cargando actividades</p>';
        }
    }

    // Open Modal
    window.openModal = (id = null, data = null) => {
        modal.classList.remove('hidden');
        modal.style.display = 'flex'; // Ensure flex for centering

        if (id && data) {
            modalTitle.textContent = 'Editar Actividad';
            document.getElementById('activity-id').value = id;
            document.getElementById('name').value = data.name;
            document.getElementById('emoji').value = data.emoji;
            document.getElementById('duration').value = data.duration;
            document.getElementById('type').value = data.type;
            document.getElementById('intensity').value = data.intensity;
            document.getElementById('description').value = data.description;

            // Populate Checkboxes
            const benefitTypes = data.benefitType || [];
            document.querySelectorAll('input[name="benefitType"]').forEach(cb => {
                cb.checked = benefitTypes.includes(cb.value);
            });

            const specificBenefits = data.specificBenefits || [];
            document.querySelectorAll('input[name="specificBenefits"]').forEach(cb => {
                cb.checked = specificBenefits.includes(cb.value);
            });

        } else {
            modalTitle.textContent = 'Nueva Actividad';
            form.reset();
            document.getElementById('activity-id').value = '';
            // Uncheck all manually just in case
            document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        }
    };

    function closeModal() {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }

    // Save Activity (Create/Update)
    async function saveActivity(e) {
        e.preventDefault();

        const id = document.getElementById('activity-id').value;

        // Collect Checkbox Values
        const benefitType = Array.from(document.querySelectorAll('input[name="benefitType"]:checked')).map(cb => cb.value);
        const specificBenefits = Array.from(document.querySelectorAll('input[name="specificBenefits"]:checked')).map(cb => cb.value);

        const data = {
            name: document.getElementById('name').value,
            emoji: document.getElementById('emoji').value,
            duration: parseInt(document.getElementById('duration').value),
            type: document.getElementById('type').value,
            intensity: document.getElementById('intensity').value,
            description: document.getElementById('description').value,
            benefitType: benefitType,
            specificBenefits: specificBenefits,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            if (id) {
                await db.collection('activities').doc(id).update(data);
                alert('Actividad actualizada correctamente');
            } else {
                data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                await db.collection('activities').add(data);
                alert('Actividad creada correctamente');
            }
            closeModal();
            loadActivities();
        } catch (error) {
            console.error("Error saving activity:", error);
            alert("Error al guardar: " + error.message);
        }
    }

    // Edit Activity (Global wrapper to fetch data first)
    window.editActivity = async (id) => {
        try {
            const doc = await db.collection('activities').doc(id).get();
            if (doc.exists) {
                openModal(id, doc.data());
            }
        } catch (error) {
            console.error("Error fetching activity:", error);
        }
    };

    // Delete Activity
    window.deleteActivity = async (id) => {
        if (confirm('¿Estás seguro de eliminar esta actividad?')) {
            try {
                await db.collection('activities').doc(id).delete();
                loadActivities();
            } catch (error) {
                console.error('Error deleting activity:', error);
                alert('Error al eliminar: ' + error.message);
            }
        }
    };

    // Import Complete Catalog
    async function importCatalog() {
        if (!confirm('¿Importar el catálogo completo de 5 actividades de ejemplo? Esto agregará o actualizará las actividades.')) {
            return;
        }

        const catalogoActividades = [
            {
                activityId: "AF-01",
                categoria: "Física",
                name: "Energía Express",
                objetivo: "Aumentar energía y mejorar estado de ánimo",
                duration: 5,
                materials: "Cronómetro (App Seconds), Bocina",
                imagen: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80",
                instrucciones: [
                    "Fase 1 (1 min): Lubricación articular (cuello, hombros, torso)",
                    "Fase 2 (3 min): Circuito (Sentadillas, Elevación de rodillas, Flexiones pared, Saltos tijera)",
                    "Fase 3 (1 min): Vuelta a la calma (Estiramientos)"
                ],
                emoji: "⚡",
                type: "indoor",
                intensity: "moderada",
                benefitType: ["Físico", "Psicológico"],
                specificBenefits: ["Aumenta energía", "Mejora estado de ánimo", "Activa circulación"],
                description: "Secuencia rápida de ejercicios para aumentar energía y mejorar el estado de ánimo en solo 5 minutos."
            },
            {
                activityId: "FG-01",
                categoria: "Juegos",
                name: "Spaghetti-Vóley",
                objetivo: "Trabajo en equipo y coordinación",
                duration: 15,
                materials: "Tubos de espuma ('spaguetis'), globo o pelota de playa",
                imagen: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=800&q=80",
                instrucciones: [
                    "Dividir en dos equipos con una línea imaginaria",
                    "Pasar el globo al campo contrario usando solo los tubos de espuma",
                    "Si el globo cae, es punto para el equipo contrario"
                ],
                emoji: "🎈",
                type: "outdoor",
                intensity: "moderada",
                benefitType: ["Físico", "Social"],
                specificBenefits: ["Fomenta trabajo en equipo", "Mejora coordinación", "Fomenta integración"],
                description: "Juego dinámico en equipo que combina coordinación, estrategia y diversión usando tubos de espuma."
            },
            {
                activityId: "JM-04",
                categoria: "Mesa",
                name: "UNO (Clásico)",
                objetivo: "Interacción social y pensamiento estratégico simple",
                duration: 20,
                materials: "Mazo de cartas UNO",
                imagen: "https://images.unsplash.com/photo-1605304383472-3c2243e39c4f?auto=format&fit=crop&w=800&q=80",
                instrucciones: [
                    "Deshacerse de todas las cartas coincidiendo número o color",
                    "Usar cartas especiales (Reversa, Toma 2) estratégicamente",
                    "Gritar 'UNO' cuando quede una sola carta"
                ],
                emoji: "🎴",
                type: "desk",
                intensity: "baja",
                benefitType: ["Psicológico", "Social"],
                specificBenefits: ["Reduce estrés", "Mejora clima laboral", "Fomenta integración"],
                description: "Clásico juego de cartas que fomenta la interacción social y el pensamiento estratégico de forma divertida."
            },
            {
                activityId: "RC-02",
                categoria: "Relax",
                name: "Meditación Guiada",
                objetivo: "Eliminar estrés y mejorar concentración",
                duration: 10,
                materials: "Sillas cómodas, bocina, ambiente tranquilo",
                imagen: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80",
                instrucciones: [
                    "Sentarse cómodamente y cerrar los ojos",
                    "Seguir el audio o voz del instructor enfocándose en la respiración",
                    "Liberar pensamientos y buscar la calma"
                ],
                emoji: "🧘",
                type: "indoor",
                intensity: "baja",
                benefitType: ["Psicológico"],
                specificBenefits: ["Reduce estrés", "Mejora concentración", "Mejora estado de ánimo"],
                description: "Sesión de meditación guiada para eliminar el estrés y mejorar la concentración a través de la atención plena."
            },
            {
                activityId: "CR-01",
                categoria: "Caminata",
                name: "Caminata Consciente",
                objetivo: "Conexión personal y atención plena",
                duration: 15,
                materials: "Tarjetas 'Somos' (opcional), ruta segura",
                imagen: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=800&q=80",
                instrucciones: [
                    "Fase 1 (5 min): Conexión y reflexión en parejas con preguntas",
                    "Fase 2 (7 min): Caminata enfocada en respiración y entorno",
                    "Fase 3 (3 min): Cierre y compartir reflexión grupal"
                ],
                emoji: "🚶",
                type: "outdoor",
                intensity: "baja",
                benefitType: ["Físico", "Psicológico", "Social"],
                specificBenefits: ["Reduce estrés", "Mejora concentración", "Mejora comunicación", "Activa circulación"],
                description: "Caminata consciente que combina movimiento físico con reflexión personal y conexión interpersonal."
            }
        ];

        try {
            let added = 0;
            let updated = 0;

            for (const actividad of catalogoActividades) {
                // Buscar si ya existe por activityId
                const existing = await db.collection('activities')
                    .where('activityId', '==', actividad.activityId)
                    .get();

                if (existing.empty) {
                    // No existe, crear nueva
                    await db.collection('activities').add({
                        ...actividad,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    added++;
                } else {
                    // Ya existe, actualizar
                    const docId = existing.docs[0].id;
                    await db.collection('activities').doc(docId).update({
                        ...actividad,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    updated++;
                }
            }

            alert(`✅ Catálogo importado exitosamente!\n\nAgregadas: ${added}\nActualizadas: ${updated}`);
            loadActivities();
        } catch (error) {
            console.error('Error importing catalog:', error);
            alert('Error al importar: ' + error.message);
        }
    }
});
