// Script para cargar datos de prueba (Semilla)

async function seedDatabase() {
    const statusDiv = document.getElementById('seed-status');
    const btn = document.getElementById('seed-btn');

    // Helper para log
    function log(msg, type = 'info') {
        const p = document.createElement('p');
        p.textContent = msg;
        p.className = type;
        statusDiv.appendChild(p);
        statusDiv.scrollTop = statusDiv.scrollHeight;
    }

    btn.disabled = true;
    statusDiv.innerHTML = '';
    log('🚀 Iniciando carga de datos...', 'info');

    try {
        // 1. Crear Áreas
        const areas = [
            { name: 'Recursos Humanos', description: 'Gestión de talento' },
            { name: 'Tecnología (TI)', description: 'Soporte y desarrollo' },
            { name: 'Finanzas', description: 'Contabilidad y administración' },
            { name: 'Marketing', description: 'Publicidad y redes' }
        ];

        const areaIds = [];

        log('📦 Creando áreas...', 'info');

        for (const area of areas) {
            // Verificar si ya existe
            const snapshot = await db.collection('areas').where('name', '==', area.name).get();

            let areaId;
            if (!snapshot.empty) {
                log(`⚠ Área "${area.name}" ya existe. Saltando.`, 'warning');
                areaId = snapshot.docs[0].id;
            } else {
                const docRef = await db.collection('areas').add(area);
                areaId = docRef.id;
                log(`✅ Área "${area.name}" creada.`, 'success');
            }
            areaIds.push({ id: areaId, name: area.name });
        }

        // 2. Crear Empleados
        const employees = [
            // RH
            { fullName: 'Ana García', accountNumber: '1001', areaIdx: 0 },
            { fullName: 'Carlos López', accountNumber: '1002', areaIdx: 0 },
            { fullName: 'María Rodríguez', accountNumber: '1003', areaIdx: 0 },
            // TI
            { fullName: 'David Martínez', accountNumber: '2001', areaIdx: 1 },
            { fullName: 'Elena Sánchez', accountNumber: '2002', areaIdx: 1 },
            { fullName: 'Fernando Torres', accountNumber: '2003', areaIdx: 1 },
            { fullName: 'Gabriel Ruiz', accountNumber: '2004', areaIdx: 1 },
            // Finanzas
            { fullName: 'Isabel Jiménez', accountNumber: '3001', areaIdx: 2 },
            { fullName: 'Javier Morales', accountNumber: '3002', areaIdx: 2 },
            // Marketing
            { fullName: 'Laura Castro', accountNumber: '4001', areaIdx: 3 },
            { fullName: 'Miguel Ángel', accountNumber: '4002', areaIdx: 3 }
        ];

        log('👥 Creando empleados...', 'info');

        for (const emp of employees) {
            // Verificar si ya existe
            const snapshot = await db.collection('employees')
                .where('accountNumber', '==', emp.accountNumber)
                .get();

            if (!snapshot.empty) {
                log(`⚠ Empleado #${emp.accountNumber} ya existe. Saltando.`, 'warning');
            } else {
                const area = areaIds[emp.areaIdx];
                await db.collection('employees').add({
                    fullName: emp.fullName,
                    accountNumber: emp.accountNumber,
                    areaId: area.id,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                log(`✅ Empleado "${emp.fullName}" (${area.name}) creado.`, 'success');
            }
        }

        log('✨ ¡Proceso finalizado con éxito!', 'success');
        log('Ahora puedes ir al Pase de Lista o al Feedback.', 'info');

    } catch (error) {
        console.error(error);
        log(`❌ Error: ${error.message}`, 'error');
    } finally {
        btn.disabled = false;
    }
}
