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
    const btnClose = document.getElementById('btn-close-modal');
    const btnCancel = document.getElementById('btn-cancel');
    const modalTitle = document.getElementById('modal-title');

    // Event Listeners
    btnNew.addEventListener('click', () => openModal());
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
                console.error("Error deleting activity:", error);
                alert("Error al eliminar: " + error.message);
            }
        }
    };
});
