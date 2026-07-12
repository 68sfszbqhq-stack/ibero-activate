// ============================================================
// GESTOR DE PERIODOS (Temporadas) - IBERO ACTÍVATE
// ============================================================
// CRUD de periodos: crear/editar Primavera / Verano / Otoño,
// marcar el activo y asignar el macrociclo del programa.
// Depende de js/period-utils.js (window.Periods).
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(user => {
        if (!user) window.location.href = 'login.html';
    });

    const listEl = document.getElementById('periods-list');
    const form = document.getElementById('period-form');
    const modal = document.getElementById('period-modal');
    const modalTitle = document.getElementById('modal-title');
    const btnNew = document.getElementById('btn-new-period');
    const btnClose = document.getElementById('btn-close-modal');
    const btnCancel = document.getElementById('btn-cancel');
    const macrocycleSelect = document.getElementById('macrocycleId');

    btnNew.addEventListener('click', () => openModal());
    btnClose.addEventListener('click', closeModal);
    btnCancel.addEventListener('click', closeModal);
    form.addEventListener('submit', savePeriod);

    loadMacrocycles();
    loadPeriods();

    // ---- Cargar macrociclos disponibles para el dropdown ----
    async function loadMacrocycles() {
        try {
            const snap = await db.collection('program_periodization').get();
            macrocycleSelect.innerHTML = '<option value="">— Sin macrociclo —</option>';
            snap.forEach(doc => {
                const data = doc.data();
                const opt = document.createElement('option');
                opt.value = doc.id;
                opt.textContent = `${data.programName || doc.id} (${data.totalWeeks || '?'} sem)`;
                macrocycleSelect.appendChild(opt);
            });
        } catch (e) {
            console.error('Error cargando macrociclos:', e);
        }
    }

    // ---- Listar periodos ----
    async function loadPeriods() {
        listEl.innerHTML = '<p style="color:#9ca3af;padding:1rem;">Cargando periodos...</p>';
        try {
            const periods = await window.Periods.getAllPeriods();
            if (periods.length === 0) {
                listEl.innerHTML = `
                    <div style="text-align:center; padding:3rem; color:#9ca3af;">
                        <i class="fa-solid fa-calendar-plus" style="font-size:3rem; margin-bottom:1rem;"></i>
                        <p>Aún no hay periodos. Crea el primero (ej. "Primavera 2026").</p>
                    </div>`;
                return;
            }

            listEl.innerHTML = '';
            periods.forEach(p => listEl.appendChild(renderCard(p)));
        } catch (e) {
            console.error('Error cargando periodos:', e);
            listEl.innerHTML = '<p style="color:#dc2626;padding:1rem;">Error al cargar periodos.</p>';
        }
    }

    function renderCard(p) {
        const meta = window.Periods.seasonMeta(p.season);
        const card = document.createElement('div');
        card.style.cssText = `background:#fff; border-radius:16px; padding:1.5rem; box-shadow:0 1px 3px rgba(0,0,0,0.08); border-left:6px solid ${meta.color}; display:flex; flex-direction:column; gap:0.75rem;`;

        const activeBadge = p.isActive
            ? `<span style="background:#dcfce7; color:#16a34a; padding:2px 10px; border-radius:9999px; font-size:0.75rem; font-weight:700;"><i class="fa-solid fa-circle-check"></i> Activo</span>`
            : `<button data-id="${p.id}" class="btn-set-active" style="background:#eef2ff; color:#4f46e5; border:none; padding:4px 12px; border-radius:9999px; font-size:0.75rem; font-weight:700; cursor:pointer;">Marcar activo</button>`;

        const dateRange = p.endDate ? `${p.startDate} → ${p.endDate}` : `Desde ${p.startDate}`;

        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:start;">
                <div style="display:flex; align-items:center; gap:0.6rem;">
                    <span style="width:44px; height:44px; border-radius:12px; background:${meta.color}22; color:${meta.color}; display:flex; align-items:center; justify-content:center; font-size:1.3rem;">
                        <i class="fa-solid ${meta.icon}"></i>
                    </span>
                    <div>
                        <h3 style="margin:0; font-size:1.1rem; color:#111827;">${p.name || meta.label}</h3>
                        <p style="margin:0; font-size:0.85rem; color:#6b7280;">${dateRange} · ${p.totalWeeks || '?'} semanas</p>
                    </div>
                </div>
                ${activeBadge}
            </div>
            <div style="display:flex; gap:0.5rem; justify-content:flex-end;">
                <button data-id="${p.id}" class="btn-edit" style="background:#f3f4f6; color:#374151; border:none; padding:6px 14px; border-radius:8px; cursor:pointer; font-size:0.85rem;"><i class="fa-solid fa-pen"></i> Editar</button>
                <button data-id="${p.id}" class="btn-delete" style="background:#fee2e2; color:#dc2626; border:none; padding:6px 14px; border-radius:8px; cursor:pointer; font-size:0.85rem;"><i class="fa-solid fa-trash"></i></button>
            </div>`;

        card.querySelector('.btn-edit').addEventListener('click', () => openModal(p));
        card.querySelector('.btn-delete').addEventListener('click', () => deletePeriod(p));
        const activeBtn = card.querySelector('.btn-set-active');
        if (activeBtn) activeBtn.addEventListener('click', () => setActive(p.id));

        return card;
    }

    // ---- Modal ----
    function openModal(period = null) {
        form.reset();
        document.getElementById('period-id').value = period ? period.id : '';
        modalTitle.textContent = period ? 'Editar Periodo' : 'Nuevo Periodo';

        if (period) {
            document.getElementById('name').value = period.name || '';
            document.getElementById('season').value = period.season || 'primavera';
            document.getElementById('startDate').value = period.startDate || '';
            document.getElementById('endDate').value = period.endDate || '';
            document.getElementById('totalWeeks').value = period.totalWeeks || 19;
            document.getElementById('isActive').checked = !!period.isActive;
            macrocycleSelect.value = period.macrocycleId || '';
        } else {
            document.getElementById('totalWeeks').value = 19;
        }
        modal.classList.remove('hidden');
    }

    function closeModal() {
        modal.classList.add('hidden');
    }

    async function savePeriod(e) {
        e.preventDefault();
        const id = document.getElementById('period-id').value;
        const data = {
            name: document.getElementById('name').value.trim(),
            season: document.getElementById('season').value,
            startDate: document.getElementById('startDate').value,
            endDate: document.getElementById('endDate').value || null,
            totalWeeks: parseInt(document.getElementById('totalWeeks').value, 10) || 19,
            macrocycleId: macrocycleSelect.value || null,
            isActive: document.getElementById('isActive').checked
        };

        if (!data.name || !data.startDate) {
            alert('Nombre y fecha de inicio son obligatorios.');
            return;
        }

        try {
            let periodId = id;
            if (id) {
                await db.collection('periods').doc(id).update(data);
            } else {
                data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                const ref = await db.collection('periods').add(data);
                periodId = ref.id;
            }

            // Si se marcó como activo, desactivar los demás (garantiza uno solo).
            if (data.isActive) {
                await window.Periods.setActivePeriod(periodId);
            } else {
                window.Periods.clearCache();
            }

            closeModal();
            loadPeriods();
        } catch (err) {
            console.error('Error guardando periodo:', err);
            alert('Error al guardar: ' + err.message);
        }
    }

    async function setActive(periodId) {
        try {
            await window.Periods.setActivePeriod(periodId);
            loadPeriods();
        } catch (e) {
            console.error('Error marcando activo:', e);
            alert('Error: ' + e.message);
        }
    }

    async function deletePeriod(p) {
        if (!confirm(`¿Eliminar el periodo "${p.name}"?\n\nLas asistencias registradas NO se borran, pero quedarán sin periodo asignado.`)) return;
        try {
            await db.collection('periods').doc(p.id).delete();
            window.Periods.clearCache();
            loadPeriods();
        } catch (e) {
            console.error('Error eliminando periodo:', e);
            alert('Error: ' + e.message);
        }
    }
});
