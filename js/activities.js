document.addEventListener('DOMContentLoaded', () => {
    // Variables de Estado
    let allActivities = [];
    let currentCategory = 'all';

    // Auth Check
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.href = 'login.html';
        } else {
            loadActivities();

            // Check for edit parameter in URL
            const urlParams = new URLSearchParams(window.location.search);
            const editId = urlParams.get('edit');
            if (editId) {
                // Wait for activities to load, then open edit modal
                setTimeout(() => {
                    editActivity(editId);
                }, 500);
            }
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

    // Image Input Elements
    const inputImagen = document.getElementById('imagen');
    const imgPreview = document.getElementById('image-preview');

    // Filter Elements
    const filterButtons = document.querySelectorAll('.filter-card');

    // Event Listeners
    btnNew.addEventListener('click', () => openModal());
    btnImport.addEventListener('click', importCatalog);
    btnClose.addEventListener('click', closeModal);
    btnCancel.addEventListener('click', closeModal);
    form.addEventListener('submit', saveActivity);

    // Image Preview Listener
    if (inputImagen) {
        inputImagen.addEventListener('input', (e) => {
            const url = e.target.value;
            if (url) {
                imgPreview.src = url;
                imgPreview.style.display = 'block';
            } else {
                imgPreview.style.display = 'none';
            }
        });
    }

    // Filter Logic
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            renderActivities();
        });
    });

    // Load Activities
    async function loadActivities() {
        try {
            const snapshot = await db.collection('activities').get();
            if (snapshot.empty) {
                allActivities = [];
                renderActivities();
                return;
            }
            allActivities = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            renderActivities();
        } catch (error) {
            console.error("Error loading activities:", error);
            activitiesGrid.innerHTML = '<p class="text-red-500 col-span-full text-center py-8">Error cargando actividades</p>';
        }
    }

    // Render Function
    function renderActivities() {
        activitiesGrid.innerHTML = '';
        const filtered = currentCategory === 'all'
            ? allActivities
            : allActivities.filter(a => a.categoria === currentCategory || a.category === currentCategory);

        if (filtered.length === 0) {
            activitiesGrid.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center py-12 text-gray-400">
                    <i class="fa-solid fa-folder-open text-4xl mb-4"></i>
                    <p>No se encontraron actividades en esta categoría.</p>
                </div>`;
            return;
        }

        filtered.forEach(data => {
            const card = document.createElement('div');
            card.className = 'group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col h-full';

            let badgeClass = 'bg-blue-100 text-blue-700';
            if (data.intensity === 'alta') badgeClass = 'bg-red-100 text-red-700';
            if (data.intensity === 'baja') badgeClass = 'bg-green-100 text-green-700';

            const bgImage = data.imagen || 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=800';

            card.innerHTML = `
                <div class="h-48 relative overflow-hidden shrink-0">
                    <img src="${bgImage}" alt="${data.name}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0"></div>
                    
                    <div class="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button onclick="editActivity('${data.id}')" class="w-8 h-8 flex items-center justify-center bg-white rounded-full text-blue-600 hover:bg-blue-600 hover:text-white shadow-lg transition-colors" title="Editar">
                            <i class="fa-solid fa-pen text-sm"></i>
                        </button>
                        <button onclick="deleteActivity('${data.id}')" class="w-8 h-8 flex items-center justify-center bg-white rounded-full text-red-600 hover:bg-red-600 hover:text-white shadow-lg transition-colors" title="Eliminar">
                            <i class="fa-solid fa-trash text-sm"></i>
                        </button>
                    </div>

                    <span class="absolute top-3 left-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-gray-700 shadow-sm">
                        ${data.emoji || '✨'} ${data.categoria || 'General'}
                    </span>
                    <span class="absolute bottom-3 right-3 bg-black/50 backdrop-blur text-white px-2 py-1 rounded-md text-xs font-medium">
                        <i class="fa-regular fa-clock mr-1"></i>${data.duration} min
                    </span>
                </div>

                <div class="p-5 flex flex-col grow">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="font-bold text-lg text-gray-800 leading-tight group-hover:text-blue-600 transition-colors">
                            ${data.name}
                        </h3>
                    </div>
                    <p class="text-gray-500 text-sm line-clamp-2 mb-4 grow">
                        ${data.objetivo || data.description || 'Sin descripción disponible.'}
                    </p>
                    <div class="flex flex-wrap gap-2 mt-auto pt-4 border-t border-gray-50">
                        <span class="px-2 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                            ${(data.benefitType && data.benefitType[0]) || 'Bienestar'}
                        </span>
                        <span class="px-2 py-1 rounded-md text-xs font-semibold ${badgeClass} border border-transparent">
                            Intensidad ${data.intensity}
                        </span>
                    </div>
                </div>
            `;
            activitiesGrid.appendChild(card);
        });
    }

    // Open Modal
    window.openModal = (id = null, data = null) => {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';

        if (id && data) {
            modalTitle.textContent = 'Editar Actividad';
            document.getElementById('activity-id').value = id;
            document.getElementById('name').value = data.name;
            document.getElementById('imagen').value = data.imagen || ''; // Load URL

            // Preview
            if (data.imagen) {
                imgPreview.src = data.imagen;
                imgPreview.style.display = 'block';
            } else {
                imgPreview.style.display = 'none';
            }

            document.getElementById('emoji').value = data.emoji;
            document.getElementById('duration').value = data.duration;
            document.getElementById('type').value = data.type;
            document.getElementById('intensity').value = data.intensity;
            document.getElementById('description').value = data.description;

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
            document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
            imgPreview.style.display = 'none'; // Reset preview
        }
    };

    function closeModal() {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }

    // Save Activity
    async function saveActivity(e) {
        e.preventDefault();
        const id = document.getElementById('activity-id').value;

        // Collect Checkboxes
        const benefitType = Array.from(document.querySelectorAll('input[name="benefitType"]:checked')).map(cb => cb.value);
        const specificBenefits = Array.from(document.querySelectorAll('input[name="specificBenefits"]:checked')).map(cb => cb.value);

        const data = {
            name: document.getElementById('name').value,
            imagen: document.getElementById('imagen').value, // Save URL
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
                const activity = allActivities.find(a => a.id === id);
                // Preserve original category if not edited (modal doesn't have category input yet, assuming existing)
                // Actually, catalog-data has 'categoria'. If we create new, where does it come from? 
                // Currently modal doesn't allow editing Category. 
                // We should probably safeguard 'categoria'
                if (activity && activity.categoria) {
                    data.categoria = activity.categoria;
                } else if (!data.categoria) {
                    // Default for new
                    data.categoria = 'General';
                }

                await db.collection('activities').doc(id).update(data);
                const idx = allActivities.findIndex(a => a.id === id);
                if (idx !== -1) allActivities[idx] = { id, ...data, ...allActivities[idx] };
                alert('Actividad actualizada correctamente');
            } else {
                data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                data.categoria = 'General'; // Default
                const docRef = await db.collection('activities').add(data);
                allActivities.push({ id: docRef.id, ...data });
                alert('Actividad creada correctamente');
            }
            closeModal();
            renderActivities();
        } catch (error) {
            console.error("Error saving activity:", error);
            alert("Error al guardar: " + error.message);
        }
    }

    // Edit Activity Global
    window.editActivity = async (id) => {
        const activity = allActivities.find(a => a.id === id);
        if (activity) {
            openModal(id, activity);
        } else {
            try {
                const doc = await db.collection('activities').doc(id).get();
                if (doc.exists) openModal(id, doc.data());
            } catch (e) {
                console.error(e);
            }
        }
    };

    // Delete Activity Global
    window.deleteActivity = async (id) => {
        if (confirm('¿Estás seguro de eliminar esta actividad?')) {
            try {
                await db.collection('activities').doc(id).delete();
                allActivities = allActivities.filter(a => a.id !== id);
                renderActivities();
            } catch (error) {
                console.error(error);
                alert('Error al eliminar: ' + error.message);
            }
        }
    };

    // Import Logic
    async function importCatalog() {
        if (!confirm('¿Importar el catálogo COMPLETO de 54 actividades?')) return;
        const catalogoActividades = typeof CATALOGO_COMPLETO !== 'undefined' ? CATALOGO_COMPLETO : [];
        if (catalogoActividades.length === 0) {
            alert('Error: No se pudo cargar el catálogo.');
            return;
        }
        try {
            const btn = document.getElementById('btn-import-catalog');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Importando...';
            btn.disabled = true;
            let added = 0;
            let updated = 0;
            for (const actividad of catalogoActividades) {
                const existing = await db.collection('activities').where('activityId', '==', actividad.activityId).get();
                if (existing.empty) {
                    await db.collection('activities').add({ ...actividad, createdAt: firebase.firestore.FieldValue.serverTimestamp(), updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
                    added++;
                } else {
                    const docId = existing.docs[0].id;
                    await db.collection('activities').doc(docId).update({ ...actividad, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
                    updated++;
                }
            }
            alert(`✅ Importación finalizada!\nAgregadas: ${added}\nActualizadas: ${updated}`);
            btn.innerHTML = originalText;
            btn.disabled = false;
            loadActivities();
        } catch (error) {
            console.error(error);
            alert('Error al importar: ' + error.message);
        }
    }
});
