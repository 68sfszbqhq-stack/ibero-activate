document.addEventListener('DOMContentLoaded', async () => {

    const areasList = document.getElementById('areas-list');
    const employeesList = document.getElementById('employees-list');

    try {
        // 1. Fetch Data
        const [areasSnap, employeesSnap, attendanceSnap] = await Promise.all([
            db.collection('areas').get(),
            db.collection('employees').get(),
            db.collection('attendances').get() // For total participation count
        ]);

        // 2. Process Areas Map
        const areasMap = {};
        areasSnap.forEach(doc => {
            areasMap[doc.id] = {
                name: doc.data().name,
                points: 0,
                employees: 0
            };
        });

        // 3. Process Employees & Calculate Area Points
        const employees = [];
        employeesSnap.forEach(doc => {
            const data = doc.data();
            employees.push(data);

            if (data.areaId && areasMap[data.areaId]) {
                areasMap[data.areaId].points += (data.points || 0);
                areasMap[data.areaId].employees += 1;
            }
        });

        // 4. Sort & Render Top Employees
        employees.sort((a, b) => (b.points || 0) - (a.points || 0));
        renderEmployees(employees.slice(0, 5));

        // 5. Sort & Render Top Areas (by Average Points per Employee to be fair? Or Total? Let's do Total for now as it encourages mass participation)
        // User asked for "Rankings de areas", usually total points or total attendance is best for "competition".
        const areasArray = Object.values(areasMap);
        areasArray.sort((a, b) => b.points - a.points);
        renderAreas(areasArray.slice(0, 5));

        // 6. Global Stats
        document.getElementById('total-participation').textContent = attendanceSnap.size;
        document.getElementById('total-employees').textContent = employeesSnap.size;
        document.getElementById('total-areas').textContent = areasSnap.size;

    } catch (error) {
        console.error("Error loading rankings:", error);
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

    function renderAreas(list) {
        areasList.innerHTML = list.map((area, index) => {
            const medal = getMedal(index);
            return `
            <div class="flex items-center justify-between group">
                <div class="flex items-center gap-4">
                    <div class="w-8 font-bold text-gray-400 text-lg flex justify-center">${medal || (index + 1)}</div>
                    <div>
                        <div class="font-bold text-gray-800">${area.name}</div>
                        <div class="text-xs text-gray-500">${area.employees} colaboradores</div>
                    </div>
                </div>
                <div class="font-bold text-gray-800 text-sm">
                    ${area.points} pts
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
