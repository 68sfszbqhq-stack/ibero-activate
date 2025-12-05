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

    async function initCalendar() {
        renderGridStructure();
        await loadActivities();
        loadSchedule();
        updateWeekLabel();
    }

    // 1. Render Grid Structure (9:00 - 17:00)
    function renderGridStructure() {
        calendarBody.innerHTML = '';
        const hours = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

        hours.forEach(time => {
            // Time Column
            const timeCell = document.createElement('div');
            timeCell.className = 'time-slot';
            timeCell.textContent = time;
            calendarBody.appendChild(timeCell);

            // Day Columns
            days.forEach(day => {
                const dayCell = document.createElement('div');
                dayCell.className = 'day-column';
                dayCell.dataset.day = day;
                dayCell.dataset.time = time;
                dayCell.id = `cell-${day}-${time.replace(':', '')}`;

                // Add Button
                const btnAdd = document.createElement('button');
                btnAdd.className = 'btn-add-slot';
                btnAdd.innerHTML = '<i class="fa-solid fa-plus"></i>';
                btnAdd.onclick = () => openModal(day, time);
                dayCell.appendChild(btnAdd);

                calendarBody.appendChild(dayCell);
            });
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
        // Clear existing items (keep add buttons)
        document.querySelectorAll('.activity-item').forEach(el => el.remove());

        const weekId = getWeekId(currentWeekStart);
        console.log("Loading schedule for:", weekId);

        try {
            const doc = await db.collection('weekly_schedules').doc(weekId).get();
            if (doc.exists) {
                const schedule = doc.data().schedule || [];
                schedule.forEach((item, index) => {
                    renderScheduleItem(item, index);
                });
            }
        } catch (error) {
            console.error("Error loading schedule:", error);
        }
    }

    function renderScheduleItem(item, index) {
        const cellId = `cell-${item.day}-${item.time.replace(':', '')}`;
        const cell = document.getElementById(cellId);
        if (!cell) return;

        const activity = activitiesMap[item.activityId];
        const name = activity ? activity.name : 'Actividad desconocida';
        const emoji = activity ? activity.emoji : '❓';

        const div = document.createElement('div');
        div.className = 'activity-item';
        div.innerHTML = `
            <div style="font-weight: 600;">${emoji} ${name}</div>
            <div style="color: #666; font-size: 0.75rem;">📍 ${item.location}</div>
        `;
        div.onclick = (e) => {
            e.stopPropagation();
            openModal(item.day, item.time, item, index);
        };

        // Insert before the add button
        cell.insertBefore(div, cell.lastChild);
    }

    // 4. Modal Logic
    // 4. Modal Logic
    function openModal(day, time, item = null, index = null) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';

        document.getElementById('selected-day').value = day;
        document.getElementById('selected-time').value = time;
        document.getElementById('display-day').value = translateDay(day);
        document.getElementById('display-time').value = time;

        if (item) {
            document.getElementById('modal-title').textContent = 'Editar Actividad';
            document.getElementById('schedule-id').value = index; // Using array index as ID for now
            document.getElementById('activity-select').value = item.activityId;
            document.getElementById('location').value = item.location;
            document.getElementById('btn-delete-schedule').classList.remove('hidden');
        } else {
            document.getElementById('modal-title').textContent = 'Programar Actividad';
            document.getElementById('schedule-id').value = '';
            document.getElementById('activity-select').value = '';
            document.getElementById('location').value = '';
            document.getElementById('btn-delete-schedule').classList.add('hidden');
        }
    }
    // Expose to window for HTML onclick
    window.openModal = openModal;

    function closeModal() {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
    window.closeModal = closeModal;

    // 5. Save Schedule
    async function saveSchedule(e) {
        e.preventDefault();

        const weekId = getWeekId(currentWeekStart);
        const index = document.getElementById('schedule-id').value;

        const newItem = {
            day: document.getElementById('selected-day').value,
            time: document.getElementById('selected-time').value,
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
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
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
