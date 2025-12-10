document.addEventListener('DOMContentLoaded', async () => {

    const areasRace = document.getElementById('areas-race');
    const employeesList = document.getElementById('employees-list');

    try {
        // 1. Fetch Data
        const [areasSnap, employeesSnap, attendanceSnap] = await Promise.all([
            db.collection('areas').get(),
            db.collection('employees').get(),
            db.collection('attendances').get()
        ]);

        // 2. Process Areas Map with Employee Count
        const areasMap = {};
        areasSnap.forEach(doc => {
            areasMap[doc.id] = {
                id: doc.id,
                name: doc.data().name,
                employees: 0,
                attendances: 0,
                percentage: 0
            };
        });

        // 3. Count Employees per Area
        const employees = [];
        employeesSnap.forEach(doc => {
            const data = doc.data();
            employees.push(data);

            if (data.areaId && areasMap[data.areaId]) {
                areasMap[data.areaId].employees += 1;
            }
        });

        // 4. Count Attendances per Area
        attendanceSnap.forEach(doc => {
            const data = doc.data();
            if (data.areaId && areasMap[data.areaId]) {
                areasMap[data.areaId].attendances += 1;
            }
        });

        // 5. Calculate Percentage for each Area
        Object.values(areasMap).forEach(area => {
            if (area.employees > 0) {
                area.percentage = (area.attendances / area.employees) * 100;
            }
        });

        // 6. Sort Areas by Percentage (descending)
        const areasArray = Object.values(areasMap).filter(a => a.employees > 0);
        areasArray.sort((a, b) => b.percentage - a.percentage);

        // 7. Render Horse Race
        renderHorseRace(areasArray);

        // 8. Sort & Render Top Employees (by points)
        employees.sort((a, b) => (b.points || 0) - (a.points || 0));
        renderEmployees(employees.slice(0, 10));

        // 9. Global Stats
        document.getElementById('total-participation').textContent = attendanceSnap.size;
        document.getElementById('total-employees').textContent = employeesSnap.size;
        document.getElementById('total-areas').textContent = areasSnap.size;

    } catch (error) {
        console.error("Error loading rankings:", error);
    }

    function renderHorseRace(areas) {
        const maxPercentage = Math.max(...areas.map(a => a.percentage), 100);

        areasRace.innerHTML = areas.map((area, index) => {
            const percentage = area.percentage.toFixed(1);
            const barWidth = (area.percentage / maxPercentage) * 100;

            // Podium colors for top 3
            let barColor = 'bg-gradient-to-r from-gray-300 to-gray-400';
            let textColor = 'text-gray-700';
            let medalEmoji = '';

            if (index === 0) {
                barColor = 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600';
                textColor = 'text-yellow-600';
                medalEmoji = '🥇';
            } else if (index === 1) {
                barColor = 'bg-gradient-to-r from-gray-300 via-gray-400 to-gray-500';
                textColor = 'text-gray-600';
                medalEmoji = '🥈';
            } else if (index === 2) {
                barColor = 'bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600';
                textColor = 'text-orange-600';
                medalEmoji = '🥉';
            }

            return `
                <div class="group">
                    <!-- Area Info -->
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-3">
                            <span class="text-2xl">${medalEmoji || '🏢'}</span>
                            <div>
                                <div class="font-bold ${textColor} text-sm">${area.name}</div>
                                <div class="text-xs text-gray-500">${area.attendances} asistencias de ${area.employees} empleados</div>
                            </div>
                        </div>
                        <div class="font-bold ${textColor} text-lg">${percentage}%</div>
                    </div>
                    
                    <!-- Progress Bar -->
                    <div class="relative h-8 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                        <div class="horse-race-bar h-full ${barColor} rounded-full transition-all duration-[2000ms] ease-out shadow-lg" 
                             style="width: 0%;" 
                             data-width="${barWidth}%">
                            <div class="absolute inset-0 bg-white/20"></div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Trigger animation after render
        setTimeout(() => {
            document.querySelectorAll('.horse-race-bar').forEach(bar => {
                bar.style.width = bar.dataset.width;
            });
        }, 100);
    }

    function renderEmployees(list) {
        employeesList.innerHTML = list.map((emp, index) => {
            const medal = getMedal(index);
            return `
            <div class="flex items-center justify-between group">
                <div class="flex items-center gap-4">
                    <div class="w-8 font-bold text-gray-400 text-lg flex justify-center">${medal || (index + 1)}</div>
                    <div>
                        <div class="font-bold text-gray-800">${emp.fullName}</div>
                        <div class="text-xs text-gray-500">Nivel ${Math.floor((emp.points || 0) / 100) + 1}</div>
                    </div>
                </div>
                <div class="font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full text-sm">
                    ${emp.points || 0} pts
                </div>
            </div>
            `;
        }).join('');
    }

    function getMedal(index) {
        if (index === 0) return '🥇';
        if (index === 1) return '🥈';
        if (index === 2) return '🥉';
        return null;
    }

});
