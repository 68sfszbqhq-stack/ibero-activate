// Sistema de Gamificación

const POINTS_CONFIG = {
    attendance: 10,           // Puntos base por asistencia
    rating_bonus: {           // Bonus por calificación
        5: 10,
        4: 7,
        3: 5,
        2: 2,
        1: 0
    },
    streak_bonus: {           // Bonus por racha
        3: 5,   // 3 días consecutivos
        5: 15,  // 5 días consecutivos
        10: 50  // 10 días consecutivos
    }
};

const BADGES = {
    perfect_week: {
        id: 'perfect_week',
        name: 'Semana Perfecta',
        description: 'Asististe todos los días de la semana',
        icon: '🌟',
        condition: (data) => data.attendances >= 5
    },
    top_rated: {
        id: 'top_rated',
        name: 'Súper Satisfecho',
        description: 'Calificación promedio de 5 estrellas',
        icon: '⭐',
        condition: (data) => data.averageRating === 5
    },
    streak_master: {
        id: 'streak_master',
        name: 'Racha Imparable',
        description: '10 días consecutivos de asistencia',
        icon: '🔥',
        condition: (data) => data.streak >= 10
    },
    early_bird: {
        id: 'early_bird',
        name: 'Madrugador',
        description: 'Primera persona en dar feedback 3 veces',
        icon: '🐦',
        condition: (data) => data.firstFeedbacks >= 3
    }
};

// Función para verificar y otorgar insignias
async function checkAndAwardBadges(employeeId, weekNumber, year) {
    try {
        // Obtener datos de puntos del empleado
        const pointsRef = db.collection('points')
            .where('employeeId', '==', employeeId)
            .where('weekNumber', '==', weekNumber)
            .where('year', '==', year);

        const snapshot = await pointsRef.get();

        if (snapshot.empty) return;

        const doc = snapshot.docs[0];
        const data = doc.data();
        const currentBadges = data.badges || [];
        const newBadges = [];

        // Verificar cada insignia
        for (const [badgeId, badge] of Object.entries(BADGES)) {
            if (!currentBadges.includes(badgeId) && badge.condition(data)) {
                newBadges.push(badgeId);
            }
        }

        // Si hay nuevas insignias, actualizar
        if (newBadges.length > 0) {
            await doc.ref.update({
                badges: firebase.firestore.FieldValue.arrayUnion(...newBadges)
            });

            // Notificar al usuario (podría ser un toast)
            console.log(`¡Nuevas insignias ganadas: ${newBadges.join(', ')}!`);
            return newBadges;
        }
    } catch (error) {
        console.error('Error en gamificación:', error);
    }
    return [];
}

// Exportar para uso en otros archivos si fuera módulos ES6
// window.Gamification = { POINTS_CONFIG, BADGES, checkAndAwardBadges };
