document.addEventListener('DOMContentLoaded', () => {
    // Auth Check
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.href = 'login.html';
        } else {
            initCalendar();
        }
    });

    // State
    let currentWeekStart = getStartOfWeek(new Date());
    let activitiesMap = {}; // id -> data
    console.log("Calendar JS Loaded - Simplified v3.0");

    // --- FUNCTIONS DEFINED EARLY TO AVOID REFERENCE ERRORS ---

    function openModal(day, time = null, item = null, index = null, clickEvent = null) {
        const modal = document.getElementById('schedule-modal');
        const modalContent = modal.querySelector('.quick-add-modal');

        modal.classList.remove('hidden');
        modal.style.display = 'flex';

        // Posicionar modal cerca del click (popover contextual)
        if (clickEvent) {
            const rect = clickEvent.target.getBoundingClientRect();
            const modalWidth = 420;
            const modalHeight = 250;

            let left = rect.right + 10;
            let top = rect.top;

            if (left + modalWidth > window.innerWidth) {
                left = rect.left - modalWidth - 10;
            }

            if (top + modalHeight > window.innerHeight) {
                top = window.innerHeight - modalHeight - 20;
            }

            if (top < 20) {
                top = 20;
            }

            modalContent.style.position = 'fixed';
            modalContent.style.top = `${top}px`;
            modalContent.style.left = `${left}px`;
            modalContent.style.transform = 'none';
        }

        document.getElementById('selected-day').value = day;
        document.getElementById('display-day').value = translateDay(day);

        if (item) {
            document.getElementById('modal-title').textContent = '✏️ Editar Actividad';
            document.getElementById('schedule-id').value = index;
            document.getElementById('activity-select').value = item.activityId;
            document.getElementById('location').value = item.location;
            document.getElementById('btn-delete-schedule').classList.remove('hidden');
        } else {
            document.getElementById('modal-title').textContent = '📅 Agregar Actividad';
            document.getElementById('schedule-id').value = '';
            document.getElementById('activity-select').value = '';
            document.getElementById('location').value = 'Explanada';
            document.getElementById('btn-delete-schedule').classList.add('hidden');
        }
    }
    window.openModal = openModal;

    function closeModal() {
        const modal = document.getElementById('schedule-modal');
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
    window.closeModal = closeModal;

    // --- END FUNCTIONS ---

    // DOM Elements
    const calendarBody = document.getElementById('calendar-body');
    const weekLabel = document.getElementById('current-week-label');
    const modal = document.getElementById('schedule-modal');
    const form = document.getElementById('schedule-form');
    const activitySelect = document.getElementById('activity-select');

    // Buttons
    document.getElementById('prev-week').addEventListener('click', () => changeWeek(-1));
    document.getElementById('next-week').addEventListener('click', () => changeWeek(1));
    document.getElementById('btn-close-modal').addEventListener('click', closeModal);
    document.getElementById('btn-cancel').addEventListener('click', closeModal);
    document.getElementById('btn-delete-schedule').addEventListener('click', deleteSchedule);
    form.addEventListener('submit', saveSchedule);

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    async function initCalendar() {
        renderGridStructure();
        await loadActivities();
        loadSchedule();
        updateWeekLabel();
    }

    // 1. Render Simplified Grid Structure (5 days, no times)
    function renderGridStructure() {
        calendarBody.innerHTML = '';
        const days = [
            { key: 'monday', label: 'Lunes' },
            { key: 'tuesday', label: 'Martes' },
            { key: 'wednesday', label: 'Miércoles' },
            { key: 'thursday', label: 'Jueves' },
            { key: 'friday', label: 'Viernes' }
        ];

        // Headers
        days.forEach(({ label }) => {
            const header = document.createElement('div');
            header.className = 'day-header';
            header.textContent = label;
            calendarBody.appendChild(header);
        });

        // Day slots
        days.forEach(({ key }) => {
            const daySlot = document.createElement('div');
            daySlot.className = 'day-slot';
            daySlot.dataset.day = key;
            daySlot.id = `slot-${key}`;

            // Botón agregar
            const btnAdd = document.createElement('button');
            btnAdd.className = 'btn-add-slot';
            btnAdd.innerHTML = '<i class="fa-solid fa-plus"></i> Agregar actividad';
            btnAdd.onclick = (e) => openModal(key, null, null, null, e);
            daySlot.appendChild(btnAdd);

            calendarBody.appendChild(daySlot);
        });
    }

    // 2. Load Activities Catalog
    async function loadActivities() {
        try {
            const snapshot = await db.collection('activities').get();
            activitySelect.innerHTML = '<option value="">Selecciona una actividad...</option>';

            snapshot.forEach(doc => {
                const data = doc.data();
                activitiesMap[doc.id] = data;
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = `${data.emoji} ${data.name} (${data.duration} min)`;
                activitySelect.appendChild(option);
            });
        } catch (error) {
            console.error("Error loading activities:", error);
        }
    }

    // 3. Load Schedule for Current Week
    async function loadSchedule() {
        // Clear existing cards (keep add buttons)
        document.querySelectorAll('.activity-card').forEach(el => el.remove());

        const weekId = getWeekId(currentWeekStart);
        console.log("Loading schedule for:", weekId);

        try {
            const doc = await db.collection('weekly_schedules').doc(weekId).get();
            if (doc.exists) {
                const schedule = doc.data().schedule || [];

                // Process all items in parallel
                const renderPromises = schedule.map((item, index) => renderScheduleItem(item, index));
                await Promise.all(renderPromises);
            }
        } catch (error) {
            console.error("Error loading schedule:", error);
        }
    }

    async function renderScheduleItem(item, index) {
        const slotId = `slot-${item.day}`;
        const slot = document.getElementById(slotId);
        if (!slot) return;

        const activity = activitiesMap[item.activityId];
        const name = activity ? activity.name : 'Actividad desconocida';
        const emoji = activity ? activity.emoji : '❓';
        const duration = activity ? activity.duration : '?';

        // Verificar estado de asistencia
        const hasAttendance = await checkAttendanceStatus(item);
        const statusBadge = getStatusBadge(item, hasAttendance);

        const card = document.createElement('div');
        card.className = 'activity-card';
        card.dataset.itemIndex = index;

        // Tooltip con nombre completo
        card.title = `${emoji} ${name} - ${duration} min${item.location ? ' - ' + item.location : ''}`;

        card.innerHTML = `
            <div class="activity-name">${emoji} ${name.length > 30 ? name.substring(0, 30) + '...' : name}</div>
            <div class="activity-meta">
                <span>⏱️ ${duration} min</span>
                ${item.location ? `<span>📍 ${item.location}</span>` : ''}
            </div>
            ${statusBadge}
        `;

        card.onclick = (e) => {
            e.stopPropagation();
            openModal(item.day, null, item, index, e);
        };

        // Insertar antes del botón +
        slot.insertBefore(card, slot.lastChild);
    }

    async function checkAttendanceStatus(item) {
        try {
            const dayIndex = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].indexOf(item.day);
            const activityDate = new Date(currentWeekStart);
            activityDate.setDate(activityDate.getDate() + dayIndex);
            const dateStr = activityDate.toISOString().split('T')[0];

            // Buscar en la collection principal de attendances
            const snapshot = await db.collection('attendances')
                .where('activityId', '==', item.activityId)
                .where('date', '==', dateStr)
                .limit(1)
                .get();

            return !snapshot.empty;
        } catch (error) {
            console.error('Error checking attendance:', error);
            return false;
        }
    }

    function getStatusBadge(item, hasAttendance) {
        const dayIndex = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].indexOf(item.day);
        const activityDate = new Date(currentWeekStart);
        activityDate.setDate(activityDate.getDate() + dayIndex);

        const now = new Date();
        now.setHours(0, 0, 0, 0);
        activityDate.setHours(0, 0, 0, 0);

        if (hasAttendance) {
            return '<span class="status-badge completed">✅ Completado</span>';
        } else if (activityDate < now) {
            return '<span class="status-badge missed">⚠️ Sin registro</span>';
        } else {
            return '<span class="status-badge pending">⏳ Pendiente</span>';
        }
    }

    // 5. Save Schedule
    async function saveSchedule(e) {
        e.preventDefault();

        const weekId = getWeekId(currentWeekStart);
        const index = document.getElementById('schedule-id').value;

        const newItem = {
            day: document.getElementById('selected-day').value,
            activityId: document.getElementById('activity-select').value,
            location: document.getElementById('location').value
        };

        try {
            const docRef = db.collection('weekly_schedules').doc(weekId);

            await db.runTransaction(async (transaction) => {
                const doc = await transaction.get(docRef);
                let schedule = [];
                if (doc.exists) {
                    schedule = doc.data().schedule || [];
                }

                if (index !== '') {
                    // Update existing
                    schedule[index] = newItem;
                } else {
                    // Add new
                    schedule.push(newItem);
                }

                transaction.set(docRef, { schedule }, { merge: true });
            });

            closeModal();
            loadSchedule();
            alert('Guardado correctamente');

        } catch (error) {
            console.error("Error saving:", error);
            alert("Error al guardar");
        }
    }

    // 6. Delete Schedule
    async function deleteSchedule() {
        if (!confirm('¿Eliminar esta actividad del calendario?')) return;

        const weekId = getWeekId(currentWeekStart);
        const index = parseInt(document.getElementById('schedule-id').value);

        try {
            const docRef = db.collection('weekly_schedules').doc(weekId);

            await db.runTransaction(async (transaction) => {
                const doc = await transaction.get(docRef);
                if (!doc.exists) return;

                let schedule = doc.data().schedule || [];
                schedule.splice(index, 1); // Remove item

                transaction.set(docRef, { schedule }, { merge: true });
            });

            closeModal();
            loadSchedule();

        } catch (error) {
            console.error("Error deleting:", error);
            alert("Error al eliminar");
        }
    }

    // Helpers
    function getStartOfWeek(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }

    function getWeekId(date) {
        const year = date.getFullYear();
        const oneJan = new Date(year, 0, 1);
        const numberOfDays = Math.floor((date - oneJan) / (24 * 60 * 60 * 1000));
        const week = Math.ceil((date.getDay() + 1 + numberOfDays) / 7);
        return `${year}-W${week}`;
    }

    function changeWeek(offset) {
        currentWeekStart.setDate(currentWeekStart.getDate() + (offset * 7));
        loadSchedule();
        updateWeekLabel();
    }

    function updateWeekLabel() {
        const end = new Date(currentWeekStart);
        end.setDate(end.getDate() + 4); // Friday

        const options = { day: 'numeric', month: 'short' };
        weekLabel.textContent = `Semana del ${currentWeekStart.toLocaleDateString('es-ES', options)} al ${end.toLocaleDateString('es-ES', options)}`;
    }

    function translateDay(day) {
        const map = {
            'monday': 'Lunes', 'tuesday': 'Martes', 'wednesday': 'Miércoles',
            'thursday': 'Jueves', 'friday': 'Viernes'
        };
        return map[day] || day;
    }
});
