// Ranking de Gamificación por Áreas

// Cargar y mostrar el ranking de áreas
async function loadAreaRanking() {
    const loadingState = document.getElementById('loading-state');
    const rankingContainer = document.getElementById('ranking-container');
    const emptyState = document.getElementById('empty-state');

    try {
        console.log('Cargando ranking de áreas...');

        // Obtener todos los empleados para saber sus áreas
        const employeesSnapshot = await db.collection('employees').get();
        const employeesByArea = {};

        employeesSnapshot.forEach(doc => {
            const employee = doc.data();
            const area = employee.area || 'Sin área';

            if (!employeesByArea[area]) {
                employeesByArea[area] = [];
            }
            employeesByArea[area].push(doc.id);
        });

        console.log('Empleados por área:', employeesByArea);

        // Obtener todos los puntos
        const pointsSnapshot = await db.collection('points').get();
        const areaPoints = {};

        // Inicializar contadores para cada área
        Object.keys(employeesByArea).forEach(area => {
            areaPoints[area] = {
                totalPoints: 0,
                attendances: 0,
                employees: employeesByArea[area].length,
                averageRating: 0,
                totalRatings: 0,
                ratingCount: 0
            };
        });

        // Sumar puntos por área
        pointsSnapshot.forEach(doc => {
            const pointData = doc.data();
            const employeeId = pointData.employeeId;

            // Encontrar el área del empleado
            let employeeArea = 'Sin área';
            for (const [area, employees] of Object.entries(employeesByArea)) {
                if (employees.includes(employeeId)) {
                    employeeArea = area;
                    break;
                }
            }

            if (areaPoints[employeeArea]) {
                areaPoints[employeeArea].totalPoints += pointData.totalPoints || 0;
                areaPoints[employeeArea].attendances += pointData.attendances || 0;

                if (pointData.averageRating) {
                    areaPoints[employeeArea].totalRatings += pointData.averageRating;
                    areaPoints[employeeArea].ratingCount++;
                }
            }
        });

        // Calcular promedio de calificaciones
        Object.keys(areaPoints).forEach(area => {
            if (areaPoints[area].ratingCount > 0) {
                areaPoints[area].averageRating =
                    areaPoints[area].totalRatings / areaPoints[area].ratingCount;
            }
        });

        console.log('Puntos por área:', areaPoints);

        // Convertir a array y ordenar por puntos
        const ranking = Object.entries(areaPoints)
            .map(([area, data]) => ({
                area,
                ...data
            }))
            .sort((a, b) => b.totalPoints - a.totalPoints);

        console.log('Ranking ordenado:', ranking);

        // Mostrar ranking
        if (ranking.length === 0 || ranking.every(r => r.totalPoints === 0)) {
            loadingState.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        renderRanking(ranking);
        loadingState.style.display = 'none';
        rankingContainer.style.display = 'block';

    } catch (error) {
        console.error('Error cargando ranking:', error);
        loadingState.innerHTML = `
            <i class="fa-solid fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444;"></i>
            <h2>Error al cargar el ranking</h2>
            <p>${error.message}</p>
        `;
    }
}

// Renderizar el ranking
function renderRanking(ranking) {
    const container = document.getElementById('ranking-container');
    const maxPoints = ranking[0]?.totalPoints || 1;

    container.innerHTML = ranking.map((item, index) => {
        const position = index + 1;
        const positionClass = position === 1 ? 'position-1' :
            position === 2 ? 'position-2' :
                position === 3 ? 'position-3' : 'position-other';

        const medal = position === 1 ? '🥇' :
            position === 2 ? '🥈' :
                position === 3 ? '🥉' : '';

        const progressPercent = (item.totalPoints / maxPoints) * 100;

        return `
            <div class="ranking-card">
                <div class="ranking-header">
                    <div class="ranking-position ${positionClass}">
                        ${position}
                    </div>
                    
                    <div class="area-info">
                        <div class="area-name">
                            ${item.area} ${medal ? `<span class="medal-icon">${medal}</span>` : ''}
                        </div>
                        <div class="area-stats">
                            <div class="stat-item">
                                <i class="fa-solid fa-users"></i>
                                <span>${item.employees} empleados</span>
                            </div>
                            <div class="stat-item">
                                <i class="fa-solid fa-calendar-check"></i>
                                <span>${item.attendances} asistencias</span>
                            </div>
                            <div class="stat-item">
                                <i class="fa-solid fa-star"></i>
                                <span>${item.averageRating.toFixed(1)} promedio</span>
                            </div>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progressPercent}%"></div>
                        </div>
                    </div>
                    
                    <div class="points-display">
                        <div class="points-number">${item.totalPoints.toLocaleString()}</div>
                        <div class="points-label">Puntos</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    loadAreaRanking();
});
