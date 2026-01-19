// REEMPLAZO DE FUNCIÓN calculateStreak
// Copia y pega esta función completa en dashboard-employee.js línea 212-248

// CALCULAR RACHA (semanas completas con 2+ asistencias)
function calculateStreak(attendancesSnapshot) {
    if (attendancesSnapshot.empty) return 0;

    // Get all dates
    const dates = [];
    attendancesSnapshot.forEach(doc => {
        dates.push(doc.data().date);
    });

    // Group by week
    const weekMap = new Map();
    dates.forEach(dateStr => {
        const date = new Date(dateStr);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay()); // Get Sunday of that week
        const weekKey = weekStart.toISOString().split('T')[0];

        if (!weekMap.has(weekKey)) {
            weekMap.set(weekKey, 0);
        }
        weekMap.set(weekKey, weekMap.get(weekKey) + 1);
    });

    // Sort weeks (most recent first)
    const weeks = Array.from(weekMap.entries())
        .sort((a, b) => b[0].localeCompare(a[0]));

    // Calculate streak (consecutive weeks with 2+ attendances)
    let streak = 0;
    for (let [weekKey, count] of weeks) {
        if (count >= 2) {
            streak++;
        } else {
            break; // Streak broken
        }
    }

    return streak;
}
