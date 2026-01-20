// Lógica de Registro de Empleados
document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticación
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.href = 'login.html';
        }
    });

    const form = document.getElementById('employee-form');
    const areaSelect = document.getElementById('areaId');
    const recentList = document.getElementById('recent-list');

    // Elementos de Nueva Área
    const toggleAreaBtn = document.getElementById('toggle-area-btn');
    const newAreaContainer = document.getElementById('new-area-container');
    const newAreaInput = document.getElementById('newAreaName');
    const saveAreaBtn = document.getElementById('save-area-btn');
    const cancelAreaBtn = document.getElementById('cancel-area-btn');

    // Cargar Áreas al iniciar
    loadAreas();

    // --- Lógica de Nueva Área ---
    toggleAreaBtn.addEventListener('click', () => {
        newAreaContainer.classList.remove('hidden');
        newAreaInput.focus();
    });

    cancelAreaBtn.addEventListener('click', () => {
        newAreaContainer.classList.add('hidden');
        newAreaInput.value = '';
    });

    saveAreaBtn.addEventListener('click', async () => {
        const name = newAreaInput.value.trim();
        if (!name) return;

        try {
            saveAreaBtn.disabled = true;

            // Guardar en Firestore
            const docRef = await db.collection('areas').add({
                name: name,
                description: 'Agregada manualmente'
            });

            // Feedback
            showToast(`✅ Área "${name}" creada`);

            // Recargar dropdown y seleccionar la nueva
            await loadAreas();
            areaSelect.value = docRef.id;

            // Limpiar UI
            newAreaContainer.classList.add('hidden');
            newAreaInput.value = '';

        } catch (error) {
            console.error('Error creando área:', error);
            showToast('❌ Error al crear área');
        } finally {
            saveAreaBtn.disabled = false;
        }
    });

    // Manejar Envío del Formulario
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fullName = document.getElementById('fullName').value.trim();
        const accountNumber = document.getElementById('accountNumber').value.trim();
        const areaId = document.getElementById('areaId').value;
        const position = document.getElementById('position').value.trim();

        if (!areaId) {
            showToast('Por favor selecciona un área');
            return;
        }

        try {
            // 1. Verificar duplicados (por número de cuenta)
            const duplicateCheck = await db.collection('employees')
                .where('accountNumber', '==', accountNumber)
                .get();

            if (!duplicateCheck.empty) {
                showToast('⚠️ Error: Ya existe un empleado con ese número de cuenta.');
                return;
            }

            // 2. Guardar en Firestore
            const newEmployee = {
                fullName,
                accountNumber,
                areaId,
                position: position || 'No especificado',
                email: `${accountNumber}@iberopuebla.mx`, // Generado automáticamente
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await db.collection('employees').add(newEmployee);

            // 3. Feedback y Limpieza
            showToast('✅ Empleado registrado correctamente');
            form.reset();
            addToRecentList(newEmployee);

        } catch (error) {
            console.error('Error al guardar:', error);
            showToast('❌ Error al guardar en la base de datos');
        }
    });

    async function loadAreas() {
        try {
            const snapshot = await db.collection('areas').orderBy('name').get();
            areaSelect.innerHTML = '<option value="">-- Selecciona un Área --</option>';

            snapshot.forEach(doc => {
                const area = doc.data();
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = area.name;
                areaSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error cargando áreas:', error);
            areaSelect.innerHTML = '<option value="">Error al cargar</option>';
        }
    }

    // Hacer la función global para que funcione el onclick
    window.deleteEmployee = async (id, name) => {
        if (confirm(`¿Estás seguro de eliminar a ${name}? Esta acción no se puede deshacer.`)) {
            try {
                await db.collection('employees').doc(id).delete();
                // Opcional: Eliminar también sus asistencias y feedbacks si se requiere limpieza total
                // Por seguridad, solo eliminamos el perfil por ahora.
                // loadEmployees(); // Recargar lista - Assuming this function exists elsewhere or will be added
                alert('Empleado eliminado correctamente.');
            } catch (error) {
                console.error('Error deleting employee:', error);
                alert('Error al eliminar empleado.');
            }
        }
    };

    function addToRecentList(emp) {
        // Remover mensaje de "vacío" si existe
        const emptyMsg = recentList.querySelector('p');
        if (emptyMsg) emptyMsg.remove();

        const item = document.createElement('div');
        item.className = 'recent-item';
        item.style.cssText = `
            padding: 0.8rem;
            background: #f8fafc;
            border-left: 4px solid var(--primary);
            border-radius: 4px;
            animation: slideIn 0.3s ease-out;
        `;

        item.innerHTML = `
            <div style="font-weight: bold;">${emp.fullName}</div>
            <div style="font-size: 0.9rem; color: #666;">
                #${emp.accountNumber} • ${emp.position}
            </div>
        `;

        recentList.prepend(item);
    }

    function showToast(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.style.opacity = '1';
        setTimeout(() => { toast.style.opacity = '0'; }, 3000);
    }
});
