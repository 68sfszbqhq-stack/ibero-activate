// Activities Showcase - Enhanced with images, materials, and modal
document.addEventListener('DOMContentLoaded', () => {
    const activitiesGrid = document.getElementById('activities-grid');
    const totalActivitiesEl = document.getElementById('total-activities');
    const filterButtons = document.querySelectorAll('.filter-card, .filter-pill');
    const modal = document.getElementById('activity-modal');
    const closeModalBtn = document.getElementById('close-modal');

    let allActivities = [];
    let currentBenefitFilter = 'all';
    let currentIntensityFilter = 'all';

    // Load activities from Firestore
    async function loadActivities() {
        try {
            const snapshot = await db.collection('activities').get();

            allActivities = [];
            snapshot.forEach(doc => {
                allActivities.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            totalActivitiesEl.textContent = allActivities.length;
            renderActivities(allActivities);

        } catch (error) {
            console.error('Error loading activities:', error);
            activitiesGrid.innerHTML = `
                <div class="col-span-full text-center py-20">
                    <i class="fa-solid fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
                    <p class="text-gray-500">Error al cargar actividades</p>
                </div>
            `;
        }
    }

    // Render activities to grid
    function renderActivities(activities) {
        if (activities.length === 0) {
            activitiesGrid.innerHTML = `
                <div class="col-span-full text-center py-20">
                    <i class="fa-solid fa-inbox text-4xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500 text-lg">No se encontraron actividades con estos filtros</p>
                    <button onclick="resetFilters()" class="mt-4 px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors">
                        Limpiar Filtros
                    </button>
                </div>
            `;
            return;
        }

        activitiesGrid.innerHTML = activities.map((activity, index) => {
            // Intensity badge color
            let intensityClass = 'bg-green-100 text-green-800';
            let intensityIcon = '🌱';
            if (activity.intensity === 'moderada') {
                intensityClass = 'bg-yellow-100 text-yellow-800';
                intensityIcon = '⚡';
            } else if (activity.intensity === 'alta') {
                intensityClass = 'bg-red-100 text-red-800';
                intensityIcon = '🔥';
            }

            // Category badge with ID
            const categoryDisplay = activity.activityId || activity.categoria || 'SIN CATEGORÍA';
            const categoryClass = getCategoryClass(activity.categoria);

            // Use imagen if available, otherwise fallback
            const imageUrl = activity.imagen || 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=800&q=80';

            // Escape single quotes for onclick
            const activityJson = JSON.stringify(activity).replace(/'/g, '&#39;');

            return `
                <div class="bg-white rounded-2xl overflow-hidden card-hover fade-in border border-gray-100 cursor-pointer" 
                     style="animation-delay: ${index * 0.1}s"
                     onclick='openActivityModal(${activityJson})'>
                    
                    <!-- Activity Image -->
                    <div class="relative h-56 overflow-hidden">
                        <img src="${imageUrl}" alt="${activity.name}" 
                             class="w-full h-full object-cover transition-transform duration-300 hover:scale-110">
                        <div class="absolute top-4 left-4">
                            <span class="badge ${categoryClass} shadow-lg text-sm font-bold">
                                ${categoryDisplay}
                            </span>
                        </div>
                        <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                            <div class="text-4xl mb-2">${activity.emoji || '⭐'}</div>
                        </div>
                    </div>

                    <!-- Card Content -->
                    <div class="p-5">
                        <h3 class="text-xl font-bold text-gray-900 mb-2">${activity.name}</h3>
                        
                        <!-- Meta badges -->
                        <div class="flex gap-2 flex-wrap mb-3">
                            <span class="badge bg-gray-100 text-gray-700">
                                <i class="fa-solid fa-clock"></i> ${activity.duration} min
                            </span>
                            <span class="badge ${intensityClass}">${intensityIcon} ${activity.intensity}</span>
                        </div>

                        <!-- Objective -->
                        <p class="text-gray-600 text-sm line-clamp-2 mb-4">${activity.objetivo || activity.description || ''}</p>

                        <!-- View details button -->
                        <button class="w-full py-2 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all">
                            Ver Detalles <i class="fa-solid fa-arrow-right ml-2"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Get category badge class
    function getCategoryClass(categoria) {
        const categoryColors = {
            'Física': 'bg-blue-600 text-white',
            'Juegos': 'bg-green-600 text-white',
            'Mesa': 'bg-purple-600 text-white',
            'Relax': 'bg-pink-600 text-white',
            'Caminata': 'bg-orange-600 text-white'
        };
        return categoryColors[categoria] || 'bg-gray-600 text-white';
    }

    // Open activity modal
    window.openActivityModal = (activity) => {
        // Populate modal with activity data
        document.getElementById('modal-image').src = activity.imagen || 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=800&q=80';
        document.getElementById('modal-emoji').textContent = activity.emoji || '⭐';
        document.getElementById('modal-title').textContent = activity.name;
        document.getElementById('modal-category-badge').textContent = activity.activityId || activity.categoria || 'Actividad';
        document.getElementById('modal-category-badge').className = `inline-block px-3 py-1 rounded-full text-xs font-semibold ${getCategoryClass(activity.categoria)}`;

        // Meta info
        document.getElementById('modal-duration').innerHTML = `<i class="fa-solid fa-clock"></i> ${activity.duration} min`;

        // Type
        let typeIcon = '🏢';
        let typeClass = 'bg-blue-100 text-blue-800';
        if (activity.type === 'outdoor') {
            typeIcon = '🌳';
            typeClass = 'bg-green-100 text-green-800';
        } else if (activity.type === 'desk') {
            typeIcon = '💻';
            typeClass = 'bg-purple-100 text-purple-800';
        }
        document.getElementById('modal-type').className = `badge ${typeClass}`;
        document.getElementById('modal-type').innerHTML = `${typeIcon} ${activity.type}`;

        // Intensity
        let intensityIcon = '🌱';
        let intensityClass = 'bg-green-100 text-green-800';
        if (activity.intensity === 'moderada') {
            intensityIcon = '⚡';
            intensityClass = 'bg-yellow-100 text-yellow-800';
        } else if (activity.intensity === 'alta') {
            intensityIcon = '🔥';
            intensityClass = 'bg-red-100 text-red-800';
        }
        document.getElementById('modal-intensity').className = `badge ${intensityClass}`;
        document.getElementById('modal-intensity').innerHTML = `${intensityIcon} ${activity.intensity}`;

        // Objective
        document.getElementById('modal-objective').textContent = activity.objetivo || activity.description || 'No especificado';

        // Materials
        document.getElementById('modal-materials').textContent = activity.materials || 'No se requieren materiales especiales';

        // Instructions
        const instructionsList = document.getElementById('modal-instructions');
        instructionsList.innerHTML = '';
        if (activity.instrucciones && activity.instrucciones.length > 0) {
            activity.instrucciones.forEach(instruction => {
                const li = document.createElement('li');
                li.textContent = instruction;
                instructionsList.appendChild(li);
            });
        } else {
            instructionsList.innerHTML = '<li>No hay instrucciones detalladas disponibles</li>';
        }

        // Benefits
        const benefitsEl = document.getElementById('modal-benefits');
        benefitsEl.innerHTML = '';
        if (activity.specificBenefits && activity.specificBenefits.length > 0) {
            activity.specificBenefits.forEach(benefit => {
                const badge = document.createElement('span');
                badge.className = 'badge bg-green-100 text-green-700';
                badge.innerHTML = `<i class="fa-solid fa-check"></i> ${benefit}`;
                benefitsEl.appendChild(badge);
            });
        } else {
            benefitsEl.innerHTML = '<span class="text-gray-500">No especificado</span>';
        }

        // Show modal
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    };

    // Close modal
    function closeModal() {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }

    closeModalBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Variables for filters (declared at top of file, updating values here is implicit)
    // Filter logic starts here

    // Filter logic
    function filterActivities() {
        let filtered = allActivities;

        // Filter by category
        if (currentCategoryFilter !== 'all') {
            filtered = filtered.filter(activity =>
                (activity.categoria && activity.categoria === currentCategoryFilter) ||
                (activity.category && activity.category === currentCategoryFilter) // Fallback
            );
        }

        // Filter by benefit type
        if (currentBenefitFilter !== 'all') {
            filtered = filtered.filter(activity =>
                activity.benefitType && activity.benefitType.includes(currentBenefitFilter)
            );
        }

        // Filter by intensity
        if (currentIntensityFilter !== 'all') {
            filtered = filtered.filter(activity =>
                activity.intensity === currentIntensityFilter
            );
        }

        renderActivities(filtered);
    }

    // Reset filters
    window.resetFilters = () => {
        currentCategoryFilter = 'all';
        currentBenefitFilter = 'all';
        currentIntensityFilter = 'all';

        filterButtons.forEach(btn => {
            btn.classList.remove('active');
            // Reset to "Todas" if it's an 'all' filter
            if (btn.dataset.category === 'all' || btn.dataset.filter === 'all' || (btn.dataset.intensity === undefined && !btn.dataset.category && !btn.dataset.filter)) {
                // This logic is a bit complex, simpler to just set active classes manually or re-init
            }
        });

        // Simpler reset visual
        document.querySelectorAll('.filter-card, .filter-pill').forEach(btn => btn.classList.remove('active'));
        const allBtn = document.querySelector('[data-category="all"]');
        if (allBtn) allBtn.classList.add('active');

        renderActivities(allActivities);
    };

    // Filter button event listeners
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Category filter
            if (btn.dataset.category) {
                document.querySelectorAll('[data-category]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentCategoryFilter = btn.dataset.category;
            }

            // Benefit filter
            if (btn.dataset.filter) {
                document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentBenefitFilter = btn.dataset.filter;
            }

            // Intensity filter
            if (btn.dataset.intensity) {
                if (btn.classList.contains('active')) {
                    btn.classList.remove('active');
                    currentIntensityFilter = 'all';
                } else {
                    document.querySelectorAll('[data-intensity]').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    currentIntensityFilter = btn.dataset.intensity;
                }
            }

            filterActivities();
        });
    });

    // Initialize
    loadActivities();
});
