// Lógica de Gestión de Inventario - IBERO ACTÍVATE
document.addEventListener('DOMContentLoaded', () => {
    // 1. Verificar autenticación
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.href = 'login.html';
        }
    });

    // 2. Elementos del DOM
    const inventoryTableBody = document.getElementById('inventory-table-body');
    const searchInput = document.getElementById('search-input');
    const filterStatus = document.getElementById('filter-status');
    const filterLocation = document.getElementById('filter-location');
    const btnAddItem = document.getElementById('btn-add-item');
    
    // Modal
    const itemModal = document.getElementById('item-modal');
    const itemForm = document.getElementById('item-form');
    const modalTitle = document.getElementById('modal-title');
    const itemIdInput = document.getElementById('item-id');
    const itemNameInput = document.getElementById('item-name');
    const itemQuantityInput = document.getElementById('item-quantity');
    const itemStatusInput = document.getElementById('item-status');
    const itemLocationInput = document.getElementById('item-location');
    const itemObservationsInput = document.getElementById('item-observations');
    const btnCancel = document.getElementById('btn-cancel');
    const btnCloseModal = document.getElementById('btn-close-modal');

    // Cards estadísticas
    const cardTotalArticles = document.getElementById('stat-total-articles');
    const cardTotalUnits = document.getElementById('stat-total-units');
    const cardOptimalArticles = document.getElementById('stat-optimal-articles');
    const cardUniqueLocations = document.getElementById('stat-unique-locations');

    let inventoryItems = []; // Caché local para filtrado rápido

    // 3. Semilla de datos iniciales del Excel (Versión más reciente de 18 artículos)
    const SEED_INVENTORY = [
        { name: "JUEGO DE MESA DOBBLE", quantity: 1, status: "OPTIMO", location: "ARCHIVERO PAUSAS ACTIVAS", observations: "55 TARJETAS" },
        { name: "CAJA DE PELOTAS DE TENIS CON 12 TUBOS CON 3 PELOTAS CADA TUBO", quantity: 36, status: "OPTIMO", location: "ARCHIVERO PAUSAS ACTIVAS", observations: "36 PELOTAS DE TENIS" },
        { name: "JUEGO UNO STACKO", quantity: 1, status: "OPTIMO", location: "ARCHIVERO PAUSAS ACTIVAS", observations: "45 BLOQUES" },
        { name: "JUEGO DE MESA BASTA FOTORAMA", quantity: 1, status: "OPTIMO", location: "ARCHIVERO PAUSAS ACTIVAS", observations: "REQUIERE BATERIAS" },
        { name: "JUEGO DE MESA THE MIND", quantity: 1, status: "OPTIMO", location: "ARCHIVERO PAUSAS ACTIVAS", observations: "120 TARJETAS APROX" },
        { name: "JUEGO DE LOTERIA", quantity: 1, status: "OPTIMO", location: "ARCHIVERO PAUSAS ACTIVAS", observations: "Caja de Naipes de Loteria 54 piezas y 54 Tabletas de Loteria" },
        { name: "JUEGO DE MESA BANANAGRAMS", quantity: 1, status: "OPTIMO", location: "ARCHIVERO PAUSAS ACTIVAS", observations: "144 FICHAS 11 BOLSA" },
        { name: "TABLAS CON CLIP", quantity: 18, status: "OPTIMO", location: "ARCHIVERO PAUSAS ACTIVAS", observations: "18 tablas de anotacion" },
        { name: "JUEGO TWISTTER", quantity: 1, status: "OPTIMO", location: "ARCHIVERO PAUSAS ACTIVAS", observations: "Dancing Challenge Mat solo para 2 jugadores Compra no optima para las pausas" },
        { name: "JUEGO CRAZY TOWER", quantity: 1, status: "OPTIMO", location: "ARCHIVERO PAUSAS ACTIVAS", observations: "cartones y piezas plasticas" },
        { name: "CARTAS DE CONEXIÓN SOMOS", quantity: 1, status: "OPTIMO", location: "ARCHIVERO PAUSAS ACTIVAS", observations: "150 TARJETAS" },
        { name: "SET PORTATIL BADMINTON", quantity: 1, status: "OPTIMO", location: "PARTE SUPERIOR LIBRERO OFICINA MAESTRO AGUSTIN", observations: "CONTIENE 2 RAQUETAS DOS GALLITOS DOS TUBOS EXPANDIBLES Y UNA RED Y BASE" },
        { name: "JUEGO DE MESA TACO GATO CABRA QUESO PIZZA", quantity: 1, status: "OPTIMO", location: "ARCHIVERO PAUSAS ACTIVAS", observations: "54 cartas" },
        { name: "THATS NOT A HAT", quantity: 1, status: "OPTIMO", location: "ARCHIVERO PAUSAS ACTIVAS", observations: "100 cartas" },
        { name: "JUEGO DE MESA EXPLODING KITTENS", quantity: 1, status: "OPTIMO", location: "ARCHIVERO PAUSAS ACTIVAS", observations: "CAJA CON 56 CARTAS" },
        { name: "CAJA CON 20 SPAGUETIS DE NATACION", quantity: 1, status: "OPTIMO", location: "BODEGA GIMNASIO", observations: "ALGUNOS HAN SUFRIDO DESGASTE POR USO" },
        { name: "PIZARRONES PORTATILES CON KIT DE BORRADOR 4 PLUMONES Y 4 IMANES", quantity: 2, status: "OPTIMO", location: "ARCHIVERO PAUSAS ACTIVAS", observations: "BOLSAS CON PIEZAS PEQUEÑAS" },
        { name: "2 PORTERIAS PORTATILES", quantity: 2, status: "OPTIMO", location: "BODEGA GIMNASIO", observations: "CAJA CON2 REDES QUE CUBREN LOS TUBOS Y ACCESORIOS NECESARIOS PARA EL ARMADO" }
    ];

    // Inicializar y cargar datos
    initInventory();

    async function initInventory() {
        try {
            // Verificar si la colección está vacía o tiene la versión anterior de 16 elementos
            const snapshot = await db.collection('inventory').get();
            if (snapshot.empty || snapshot.size <= 16) {
                console.log('🌱 Sembrando o actualizando inventario con la versión más reciente...');
                
                // Limpiar colección existente si no está vacía para evitar duplicados
                if (!snapshot.empty) {
                    const cleanBatch = db.batch();
                    snapshot.forEach(doc => {
                        cleanBatch.delete(doc.ref);
                    });
                    await cleanBatch.commit();
                }

                // Insertar los 18 nuevos elementos
                const batch = db.batch();
                SEED_INVENTORY.forEach(item => {
                    const docRef = db.collection('inventory').doc();
                    batch.set(docRef, {
                        ...item,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                });
                await batch.commit();
                console.log('✅ Sembrado y actualización de inventario completada');
            }
            
            // Escuchar cambios en tiempo real
            listenToInventory();
        } catch (error) {
            console.error('Error al inicializar inventario:', error);
            showToast('❌ Error de conexión con la base de datos');
        }
    }

    function listenToInventory() {
        db.collection('inventory').orderBy('name').onSnapshot(snapshot => {
            const previousChecked = {};
            inventoryItems.forEach(item => {
                if (item.checked) previousChecked[item.id] = true;
            });

            inventoryItems = [];
            snapshot.forEach(doc => {
                const id = doc.id;
                inventoryItems.push({ 
                    id, 
                    ...doc.data(),
                    checked: !!previousChecked[id]
                });
            });
            
            // Actualizar filtros dropdowns, estadísticas y renderizar la tabla
            populateLocationFilter();
            updateStatistics();
            renderTable();
        }, error => {
            console.error('Error escuchando inventario:', error);
            showToast('❌ Error al actualizar inventario en tiempo real');
        });
    }

    // 4. Renderizar tabla con datos locales (filtrados)
    function renderTable() {
        const query = searchInput.value.toLowerCase().trim();
        const statusVal = filterStatus.value;
        const locationVal = filterLocation.value;

        // Filtrado en memoria
        const filtered = inventoryItems.filter(item => {
            const matchesQuery = item.name.toLowerCase().includes(query) || 
                                 (item.observations && item.observations.toLowerCase().includes(query));
            const matchesStatus = !statusVal || item.status === statusVal;
            const matchesLocation = !locationVal || item.location === locationVal;
            return matchesQuery && matchesStatus && matchesLocation;
        });

        inventoryTableBody.innerHTML = '';

        if (filtered.length === 0) {
            inventoryTableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 3rem; color: #9ca3af;">
                        <i class="fa-solid fa-box-open" style="font-size: 2.5rem; margin-bottom: 0.5rem; display: block;"></i>
                        No se encontraron artículos
                    </td>
                </tr>
            `;
            return;
        }

        filtered.forEach(item => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid #f3f4f6';

            // Determinar clases de badge para Estado
            let statusClass = 'badge-success';
            let statusLabel = 'Óptimo';
            if (item.status === 'REGULAR') {
                statusClass = 'badge-warning';
                statusLabel = 'Regular';
            } else if (item.status === 'REQUIERE_ATENCION') {
                statusClass = 'badge-danger';
                statusLabel = 'Requiere Atención';
            }

            // Seleccionar icono adecuado para la categoría
            let iconClass = 'fa-solid fa-gamepad';
            const nameLower = item.name.toLowerCase();
            if (nameLower.includes('caja') || nameLower.includes('pelota') || nameLower.includes('set') || nameLower.includes('badminton') || nameLower.includes('natacion') || nameLower.includes('spagueti')) {
                iconClass = 'fa-solid fa-volleyball';
            } else if (nameLower.includes('tabla') || nameLower.includes('clip')) {
                iconClass = 'fa-solid fa-clipboard';
            }

            tr.innerHTML = `
                <td style="padding: 1rem 1.5rem; text-align: center;">
                    <input type="checkbox" class="item-checkbox" data-id="${item.id}" ${item.checked ? 'checked' : ''} style="width: 1.15rem; height: 1.15rem; cursor: pointer; accent-color: var(--primary);">
                </td>
                <td style="padding: 1rem; font-weight: 600; color: #1f2937;">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <div style="width: 36px; height: 36px; border-radius: 8px; background: #f3f4f6; color: #6b7280; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;">
                            <i class="${iconClass}"></i>
                        </div>
                        <span>${escapeHTML(item.name)}</span>
                    </div>
                </td>
                <td style="padding: 1rem; font-weight: 700; color: #374151;">
                    <span class="badge" style="background: #eef2ff; color: #4f46e5; border: 1px solid #c7d2fe; padding: 4px 10px; border-radius: 6px;">
                        ${item.quantity} ${item.quantity === 1 ? 'unidad' : 'unidades'}
                    </span>
                </td>
                <td style="padding: 1rem;">
                    <span class="badge ${statusClass}">${statusLabel}</span>
                </td>
                <td style="padding: 1rem; color: #4b5563;">
                    <i class="fa-solid fa-location-dot" style="color: #ef4444; margin-right: 0.25rem;"></i>
                    ${escapeHTML(item.location)}
                </td>
                <td style="padding: 1rem; color: #6b7280; font-size: 0.9rem;">
                    ${item.observations ? `<i class="fa-solid fa-comment-dots" style="margin-right: 0.25rem;"></i> ${escapeHTML(item.observations)}` : '---'}
                </td>
                <td style="padding: 1rem;">
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn-edit" data-id="${item.id}" style="background: #e0e7ff; color: #4f46e5; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; transition: 0.2s;" title="Editar Artículo">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="btn-delete" data-id="${item.id}" data-name="${escapeHTML(item.name)}" style="background: #fee2e2; color: #dc2626; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; transition: 0.2s;" title="Eliminar Artículo">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;

            // Asignar listeners
            tr.querySelector('.item-checkbox').addEventListener('change', (e) => {
                item.checked = e.target.checked;
            });
            tr.querySelector('.btn-edit').addEventListener('click', () => openEditModal(item));
            tr.querySelector('.btn-delete').addEventListener('click', () => deleteItem(item.id, item.name));

            inventoryTableBody.appendChild(tr);
        });
    }

    // 5. Gestión de estadísticas e indicadores de cabecera
    function updateStatistics() {
        const totalArticles = inventoryItems.length;
        const totalUnits = inventoryItems.reduce((acc, item) => acc + (parseInt(item.quantity) || 0), 0);
        const optimalArticles = inventoryItems.filter(item => item.status === 'OPTIMO').length;
        const uniqueLocs = [...new Set(inventoryItems.map(item => item.location.trim().toUpperCase()))].length;

        cardTotalArticles.textContent = totalArticles;
        cardTotalUnits.textContent = totalUnits;
        cardOptimalArticles.textContent = optimalArticles;
        cardUniqueLocations.textContent = uniqueLocs;
    }

    // 6. Rellenar dinámicamente filtro de ubicaciones
    function populateLocationFilter() {
        const currentSelected = filterLocation.value;
        const locations = [...new Set(inventoryItems.map(item => item.location.trim()))].sort();
        
        filterLocation.innerHTML = '<option value="">Todas las ubicaciones</option>';
        locations.forEach(loc => {
            const opt = document.createElement('option');
            opt.value = loc;
            opt.textContent = loc;
            filterLocation.appendChild(opt);
        });

        // Restaurar selección previa si aún existe
        if (locations.includes(currentSelected)) {
            filterLocation.value = currentSelected;
        }
    }

    // 7. Acciones del Modal
    btnAddItem.addEventListener('click', () => {
        modalTitle.textContent = 'Agregar Nuevo Artículo';
        itemIdInput.value = '';
        itemForm.reset();
        itemModal.classList.add('show');
    });

    function openEditModal(item) {
        modalTitle.textContent = 'Editar Artículo';
        itemIdInput.value = item.id;
        itemNameInput.value = item.name;
        itemQuantityInput.value = item.quantity;
        itemStatusInput.value = item.status;
        itemLocationInput.value = item.location;
        itemObservationsInput.value = item.observations || '';
        itemModal.classList.add('show');
    }

    function closeModal() {
        itemModal.classList.remove('show');
        itemForm.reset();
        itemIdInput.value = '';
    }

    btnCancel.addEventListener('click', closeModal);
    btnCloseModal.addEventListener('click', closeModal);

    // Guardar / Actualizar artículo
    itemForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = itemIdInput.value;
        const name = itemNameInput.value.trim().toUpperCase();
        const quantity = parseInt(itemQuantityInput.value) || 0;
        const status = itemStatusInput.value;
        const location = itemLocationInput.value.trim().toUpperCase();
        const observations = itemObservationsInput.value.trim();

        if (!name || quantity < 0 || !location) {
            showToast('⚠️ Por favor completa los campos obligatorios');
            return;
        }

        const itemData = {
            name,
            quantity,
            status,
            location,
            observations,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            if (id) {
                // Actualizar
                await db.collection('inventory').doc(id).update(itemData);
                showToast('✅ Artículo actualizado correctamente');
            } else {
                // Crear nuevo
                await db.collection('inventory').add(itemData);
                showToast('✅ Nuevo artículo registrado');
            }
            closeModal();
        } catch (error) {
            console.error('Error al guardar artículo:', error);
            showToast('❌ Error al guardar en la base de datos');
        }
    });

    // Eliminar artículo
    async function deleteItem(id, name) {
        if (confirm(`¿Estás seguro de eliminar el artículo "${name}" del inventario?\nEsta acción no se puede deshacer.`)) {
            try {
                await db.collection('inventory').doc(id).delete();
                showToast('❌ Artículo eliminado del inventario');
            } catch (error) {
                console.error('Error al eliminar artículo:', error);
                showToast('❌ Error al intentar eliminar el artículo');
            }
        }
    }

    // 8. Eventos de Filtrado
    searchInput.addEventListener('input', renderTable);
    filterStatus.addEventListener('change', renderTable);
    filterLocation.addEventListener('change', renderTable);

    // Seleccionar/Deseleccionar Todos los Artículos Filtrados
    const selectAllCheckbox = document.getElementById('select-all-items');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', (e) => {
            const checked = e.target.checked;
            const query = searchInput.value.toLowerCase().trim();
            const statusVal = filterStatus.value;
            const locationVal = filterLocation.value;

            inventoryItems.forEach(item => {
                const matchesQuery = item.name.toLowerCase().includes(query) || 
                                     (item.observations && item.observations.toLowerCase().includes(query));
                const matchesStatus = !statusVal || item.status === statusVal;
                const matchesLocation = !locationVal || item.location === locationVal;
                
                if (matchesQuery && matchesStatus && matchesLocation) {
                    item.checked = checked;
                }
            });

            renderTable();
        });
    }

    // Generación y descarga de PDF
    const btnDownloadPDF = document.getElementById('btn-download-pdf');
    if (btnDownloadPDF) {
        btnDownloadPDF.addEventListener('click', () => {
            // Filtrar los artículos que tienen la casilla marcada
            let selectedItems = inventoryItems.filter(item => item.checked);

            // Si no hay ninguno seleccionado, preguntar si se desea descargar todo el inventario
            if (selectedItems.length === 0) {
                const confirmAll = confirm('No has seleccionado ningún artículo de la lista.\n¿Deseas descargar el reporte con todos los artículos del inventario?');
                if (!confirmAll) return;
                selectedItems = inventoryItems;
            }

            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();

                const primaryColor = [79, 70, 229]; // Indigo
                const darkText = [31, 41, 55]; // Gray 800

                // 1. Barra de cabecera institucional
                doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                doc.rect(0, 0, 210, 35, 'F');

                // Texto de cabecera
                doc.setTextColor(255, 255, 255);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(22);
                doc.text('IBERO ACTÍVATE', 15, 18);
                
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);
                doc.text('Sistema de Gestión de Pausas Activas', 15, 26);
                
                const today = new Date();
                const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                const dateStr = today.toLocaleDateString('es-MX', dateOptions);
                doc.text(`Fecha del Reporte: ${dateStr}`, 120, 26);

                // 2. Título del Reporte
                doc.setTextColor(darkText[0], darkText[1], darkText[2]);
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.text('REPORTE DE VERIFICACIÓN DE MATERIALES', 15, 48);

                // 3. Resumen en tarjetas grises
                doc.setFillColor(243, 244, 246);
                doc.rect(15, 53, 180, 18, 'F');
                
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                doc.text(`Artículos incluidos: ${selectedItems.length}`, 20, 64);
                
                const totalUnits = selectedItems.reduce((acc, item) => acc + (parseInt(item.quantity) || 0), 0);
                doc.text(`Unidades físicas totales: ${totalUnits}`, 80, 64);

                const locationCount = [...new Set(selectedItems.map(item => item.location.trim().toUpperCase()))].length;
                doc.text(`Ubicaciones involucradas: ${locationCount}`, 140, 64);

                // 4. Mapear datos para la tabla
                const tableData = selectedItems.map(item => [
                    item.name.toUpperCase(),
                    `${item.quantity} ${item.quantity === 1 ? 'un.' : 'un.'}`,
                    item.status === 'OPTIMO' ? 'ÓPTIMO' : (item.status === 'REGULAR' ? 'REGULAR' : 'REQUIERE ATENCIÓN'),
                    item.location.toUpperCase(),
                    item.observations || '---',
                    item.checked ? '[X] VERIFICADO' : '[ ] PENDIENTE'
                ]);

                // 5. Renderizar tabla con autoTable
                doc.autoTable({
                    startY: 78,
                    head: [['Artículo', 'Cantidad', 'Estado', 'Ubicación', 'Observaciones', 'Control Diario']],
                    body: tableData,
                    theme: 'grid',
                    headStyles: {
                        fillColor: primaryColor,
                        textColor: [255, 255, 255],
                        fontStyle: 'bold',
                        fontSize: 9
                    },
                    styles: {
                        fontSize: 8,
                        cellPadding: 3,
                        overflow: 'linebreak'
                    },
                    columnStyles: {
                        0: { cellWidth: 50 },
                        1: { cellWidth: 20 },
                        2: { cellWidth: 25 },
                        3: { cellWidth: 35 },
                        4: { cellWidth: 30 },
                        5: { cellWidth: 20 }
                    },
                    margin: { left: 15, right: 15 }
                });

                // 6. Firmas
                const finalY = doc.lastAutoTable.finalY || 150;
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.text('Material verificado por: __________________________', 15, finalY + 25);
                doc.text('Firma de conformidad: __________________________', 120, finalY + 25);

                const pdfName = `Inventario_Pausas_Activas_${today.toISOString().split('T')[0]}.pdf`;
                doc.save(pdfName);

                showToast('✅ Reporte PDF generado correctamente');
            } catch (error) {
                console.error('Error al generar PDF:', error);
                alert('Ocurrió un error al generar el PDF del reporte.');
            }
        });
    }

    // Helpers
    function escapeHTML(str) {
        if (!str) return '';
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }

    function showToast(message) {
        let toast = document.getElementById('toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            toast.style.cssText = `
                position: fixed; bottom: 20px; right: 20px;
                background: var(--secondary); color: white;
                padding: 1rem 2rem; border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 1000; opacity: 0; transition: opacity 0.3s;
            `;
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.style.opacity = '1';
        setTimeout(() => { toast.style.opacity = '0'; }, 3000);
    }
});
