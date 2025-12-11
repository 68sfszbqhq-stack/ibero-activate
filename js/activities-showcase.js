// Activities Showcase - Public presentation page
document.addEventListener('DOMContentLoaded', () => {
    const activitiesGrid = document.getElementById('activities-grid');
    const totalActivitiesEl = document.getElementById('total-activities');
    const filterButtons = document.querySelectorAll('.filter-btn');

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

            // Type badge color
            let typeClass = 'bg-blue-100 text-blue-800';
            let typeIcon = '🏢';
            if (activity.type === 'outdoor') {
                typeClass = 'bg-green-100 text-green-800';
                typeIcon = '🌳';
            } else if (activity.type === 'desk') {
                typeClass = 'bg-purple-100 text-purple-800';
                typeIcon = '💻';
            }

            // Benefit type badges
            const benefitBadges = (activity.benefitType || []).map(benefit => {
                let badgeClass = 'bg-gray-100 text-gray-700';
                let icon = '';

                if (benefit === 'Físico') {
                    badgeClass = 'bg-blue-100 text-blue-700';
                    icon = '💪';
                } else if (benefit === 'Psicológico') {
                    badgeClass = 'bg-purple-100 text-purple-700';
                    icon = '🧠';
                } else if (benefit === 'Social') {
                    badgeClass = 'bg-green-100 text-green-700';
                    icon = '🤝';
                }

                return `<span class="badge ${badgeClass}">${icon} ${benefit}</span>`;
            }).join('');

            // Specific benefits
            const specificBenefits = (activity.specificBenefits || []).slice(0, 3).map(benefit =>
                `<li class="flex items-start gap-2">
                    <i class="fa-solid fa-check text-green-500 mt-1"></i>
                    <span class="text-sm text-gray-600">${benefit}</span>
                </li>`
            ).join('');

            return `
                <div class="bg-white rounded-2xl shadow-lg overflow-hidden card-hover fade-in border border-gray-100" 
                     style="animation-delay: ${index * 0.1}s">
                    <!-- Header with Emoji -->
                    <div class="p-8 text-center bg-gradient-to-br from-blue-50 to-purple-50">
                        <div class="text-6xl mb-4">${activity.emoji}</div>
                        <h3 class="text-2xl font-bold text-gray-900 mb-2">${activity.name}</h3>
                        
                        <!-- Type & Duration -->
                        <div class="flex justify-center gap-2 flex-wrap">
                            <span class="badge ${typeClass}">${typeIcon} ${activity.type}</span>
                            <span class="badge bg-gray-100 text-gray-700">
                                <i class="fa-solid fa-clock"></i> ${activity.duration} min
                            </span>
                            <span class="badge ${intensityClass}">${intensityIcon} ${activity.intensity}</span>
                        </div>
                    </div>

                    <!-- Content -->
                    <div class="p-6">
                        <!-- Description -->
                        <p class="text-gray-600 mb-4 leading-relaxed">${activity.description}</p>

                        <!-- Benefits -->
                        <div class="mb-4">
                            <h4 class="text-sm font-semibold text-gray-700 mb-2">Tipo de Beneficio</h4>
                            <div class="flex gap-2 flex-wrap">
                                ${benefitBadges || '<span class="text-sm text-gray-400">Sin especificar</span>'}
                            </div>
                        </div>

                        ${specificBenefits ? `
                            <div class="border-t pt-4 mt-4">
                                <h4 class="text-sm font-semibold text-gray-700 mb-2">Beneficios Específicos</h4>
                                <ul class="space-y-2">
                                    ${specificBenefits}
                                </ul>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    // Filter logic
    function filterActivities() {
        let filtered = allActivities;

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
        currentBenefitFilter = 'all';
        currentIntensityFilter = 'all';

        // Reset button styles
        filterButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === 'all') {
                btn.classList.add('active');
            }
        });

        renderActivities(allActivities);
    };

    // Filter button event listeners
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Benefit type filter
            if (btn.dataset.filter) {
                // Remove active from benefit buttons
                filterButtons.forEach(b => {
                    if (b.dataset.filter) {
                        b.classList.remove('active');
                    }
                });

                btn.classList.add('active');
                currentBenefitFilter = btn.dataset.filter;
            }

            // Intensity filter
            if (btn.dataset.intensity) {
                // Toggle intensity filter
                if (btn.classList.contains('active')) {
                    btn.classList.remove('active');
                    currentIntensityFilter = 'all';
                } else {
                    // Remove active from other intensity buttons
                    filterButtons.forEach(b => {
                        if (b.dataset.intensity) {
                            b.classList.remove('active');
                        }
                    });
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
