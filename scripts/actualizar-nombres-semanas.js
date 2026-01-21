// Script para actualizar los nombres de las semanas en Firestore
// Ejecutar en la consola de Firebase o con Node.js

const nuevosNombres = {
    1: "Movimiento y Diversión",
    2: "Masaje y Conexión",
    3: "Calma y Reflexión",
    4: "Voleibol en Acción",
    5: "Raqueta y Respiración",
    6: "Fichas y Flexión",
    7: "Palabras y Extensión",
    8: "Juegos y Relajación",
    9: "Adivinanzas y Precisión",
    10: "Mente y Corazón",
    11: "Masaje y Acción",
    12: "Reflejos en Acción",
    13: "Consola y Emoción",
    14: "Circuitos de Precisión",
    15: "Equilibrio y Cooperación",
    16: "Letras y Respiración",
    17: "Cartas y Atención",
    18: "Gratitud y Diversión",
    19: "Cierre y Celebración"
};

async function actualizarNombresEnFirestore() {
    console.log('🔄 Iniciando actualización de nombres en Firestore...');

    try {
        // Obtener el documento del programa
        const programDoc = await db.collection('program_periodization').doc('current_program').get();

        if (!programDoc.exists) {
            console.error('❌ No se encontró el documento del programa');
            return;
        }

        const programData = programDoc.data();
        const weeklySchedule = programData.weeklySchedule || [];

        console.log(`📋 Encontradas ${weeklySchedule.length} semanas`);

        // Actualizar cada semana con el nuevo nombre
        const updatedSchedule = weeklySchedule.map(week => {
            const nuevoNombre = nuevosNombres[week.week];
            if (nuevoNombre) {
                console.log(`✏️  Semana ${week.week}: "${week.activity}" → "${nuevoNombre}"`);
                return {
                    ...week,
                    activity: nuevoNombre
                };
            }
            return week;
        });

        // Guardar en Firestore
        await db.collection('program_periodization').doc('current_program').update({
            weeklySchedule: updatedSchedule,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log('✅ ¡Nombres actualizados exitosamente en Firestore!');
        console.log('🔄 Recarga la página para ver los cambios');

    } catch (error) {
        console.error('❌ Error al actualizar:', error);
    }
}

// Ejecutar la función
actualizarNombresEnFirestore();
