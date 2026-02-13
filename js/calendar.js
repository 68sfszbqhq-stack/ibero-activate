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
    let programData = null; // Program periodization data
    let currentProgramContext = null; // Current week and phase info
    let currentSchedule = []; // Current week's schedule
    let currentWeekId = null; // Current week ID for Firebase
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

    // Fallback buttons (if program not configured)
    const prevWeekFallback = document.getElementById('prev-week-fallback');
    const nextWeekFallback = document.getElementById('next-week-fallback');
    if (prevWeekFallback) prevWeekFallback.addEventListener('click', () => changeWeek(-1));
    if (nextWeekFallback) nextWeekFallback.addEventListener('click', () => changeWeek(1));

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
        await loadProgramData();
        await loadActivities();
        loadSchedule();
        updateWeekLabel();
        updateProgramContext();
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
        currentWeekId = weekId; // Store globally
        console.log("Loading schedule for:", weekId);

        try {
            const doc = await db.collection('weekly_schedules').doc(weekId).get();
            if (doc.exists) {
                const schedule = doc.data().schedule || [];
                currentSchedule = schedule; // Store globally

                // Process all items in parallel
                const renderPromises = schedule.map((item, index) => renderScheduleItem(item, index));
                await Promise.all(renderPromises);
            } else {
                currentSchedule = []; // Empty schedule
            }
        } catch (error) {
            console.error("Error loading schedule:", error);
            currentSchedule = [];
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

        // Determine if day is past
        const dayIndex = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].indexOf(item.day);
        const activityDate = new Date(currentWeekStart);
        activityDate.setDate(activityDate.getDate() + dayIndex);
        activityDate.setHours(23, 59, 59, 999); // End of the activity day
        const now = new Date();
        const isDayOver = now > activityDate;

        // Fetch Rating if day is over
        let ratingBadge = '';
        if (true) { // Always fetch to show live updates if available, or restrict to isDayOver if strictly requested
            const rating = await getActivityRating(item.activityId, item.day);
            if (rating > 0) {
                ratingBadge = `
                    <div class="card-rating-container">
                        <span>${rating}</span>
                        <i class="fa-solid fa-star"></i>
                        <span style="font-size: 0.75rem; font-weight: normal; color: #6b7280;">(Promedio)</span>
                    </div>`;
            } else if (isDayOver) {
                ratingBadge = `
                    <div class="card-rating-container" style="background: #f3f4f6; color: #9ca3af;">
                        <span style="font-size: 0.75rem;">Sin feedback</span>
                    </div>`;
            }
        }

        const card = document.createElement('div');
        card.className = 'activity-card';
        card.dataset.itemIndex = index;
        card.title = `${emoji} ${name} - ${duration} min${item.location ? ' - ' + item.location : ''}`;

        // Evidence Part
        let evidenceHtml = '';
        if (item.evidenceUrl) {
            evidenceHtml = `<img src="${item.evidenceUrl}" class="card-evidence-thumb" alt="Evidencia">`;
        } else {
            evidenceHtml = `
                <div class="btn-card-upload" onclick="event.stopPropagation(); showActivityDetail('${item.activityId}', '${item.location || ''}', ${index});">
                    <i class="fa-solid fa-camera"></i>
                    <span>Agregar Evidencia</span>
                </div>`;
        }

        card.innerHTML = `
            <div class="activity-name">${emoji} ${name.length > 30 ? name.substring(0, 30) + '...' : name}</div>
            <div class="activity-meta">
                <span>⏱️ ${duration} min</span>
                ${item.location ? `<span>📍 ${item.location}</span>` : ''}
            </div>
            ${evidenceHtml}
            ${ratingBadge}
            <button class="btn-delete-activity" title="Eliminar actividad" onclick="event.stopPropagation(); deleteScheduledActivity(${index})">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;

        card.onclick = (e) => {
            e.stopPropagation();
            showActivityDetail(item.activityId, item.location, index);
        };

        card.ondblclick = (e) => {
            e.stopPropagation();
            openModal(item.day, null, item, index, e);
        };

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
        updateProgramContext(); // Update phase context when changing weeks
    }

    function updateWeekLabel() {
        const end = new Date(currentWeekStart);
        end.setDate(end.getDate() + 4); // Friday

        const options = { day: 'numeric', month: 'short' };
        weekLabel.textContent = `Semana del ${currentWeekStart.toLocaleDateString('es-ES', options)} al ${end.toLocaleDateString('es-ES', options)}`;

        // Update fallback label too
        const fallbackLabel = document.getElementById('current-week-label-fallback');
        if (fallbackLabel) {
            fallbackLabel.textContent = `Semana del ${currentWeekStart.toLocaleDateString('es-ES', options)} al ${end.toLocaleDateString('es-ES', options)}`;
        }
    }

    function translateDay(day) {
        const map = {
            'monday': 'Lunes', 'tuesday': 'Martes', 'wednesday': 'Miércoles',
            'thursday': 'Jueves', 'friday': 'Viernes'
        };
        return map[day] || day;
    }

    // --- PROGRAM PERIODIZATION FUNCTIONS ---

    async function loadProgramData() {
        try {
            const doc = await db.collection('program_periodization')
                .doc('current_macrocycle')
                .get();

            if (doc.exists) {
                programData = doc.data();
                console.log('Program periodization loaded:', programData.programName);
            } else {
                console.log('No program periodization configured');
                showFallbackHeader();
            }
        } catch (error) {
            console.error('Error loading program data:', error);
            showFallbackHeader();
        }
    }

    function calculateProgramWeek(date = currentWeekStart) {
        if (!programData || !programData.startDate) {
            return null;
        }

        const programStart = new Date(programData.startDate);
        const diffTime = date - programStart;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const weekNumber = Math.max(1, Math.min(
            Math.floor(diffDays / 7) + 1,
            programData.totalWeeks
        ));

        // Find current phase
        const phase = programData.phases.find(p =>
            weekNumber >= p.weekRange[0] && weekNumber <= p.weekRange[1]
        );

        // Find week schedule
        const weekSchedule = programData.weeklySchedule?.find(w => w.week === weekNumber);

        return {
            weekNumber,
            phase,
            weekSchedule,
            totalWeeks: programData.totalWeeks,
            progress: (weekNumber / programData.totalWeeks) * 100
        };
    }

    function updateProgramContext() {
        if (!programData) {
            showFallbackHeader();
            return;
        }

        currentProgramContext = calculateProgramWeek();

        if (!currentProgramContext) {
            showFallbackHeader();
            return;
        }

        // Show program banner, hide fallback
        const banner = document.getElementById('program-context-banner');
        const fallback = document.getElementById('fallback-header');

        if (banner && fallback) {
            banner.style.display = 'grid';
            fallback.style.display = 'none';
        }

        // Update phase badge
        const phaseBadge = document.getElementById('phase-badge');
        const phaseNameBadge = document.getElementById('phase-name-badge');

        if (currentProgramContext.phase && phaseBadge && phaseNameBadge) {
            phaseBadge.style.setProperty('--phase-color', currentProgramContext.phase.colorTheme);
            phaseNameBadge.textContent = `${currentProgramContext.phase.name}`;
        }

        // Update week title
        const weekTitle = document.getElementById('week-title');
        if (weekTitle) {
            weekTitle.textContent = `Semana ${currentProgramContext.weekNumber}/${currentProgramContext.totalWeeks} - Calendario Semanal`;
        }

        // Update objective
        const objectiveValue = document.getElementById('objective-value');
        if (objectiveValue && currentProgramContext.weekSchedule) {
            objectiveValue.textContent = `${currentProgramContext.weekSchedule.objetivo} (${currentProgramContext.weekSchedule.intensidad})`;
        }

        // Setup science link
        const scienceLink = document.getElementById('btn-view-science');
        if (scienceLink && currentProgramContext.phase) {
            scienceLink.onclick = (e) => {
                e.preventDefault();
                showScienceModal(currentProgramContext.phase);
            };
        }
    }

    function showFallbackHeader() {
        const banner = document.getElementById('program-context-banner');
        const fallback = document.getElementById('fallback-header');

        if (banner) banner.style.display = 'none';
        if (fallback) fallback.style.display = 'flex';
    }

    function showScienceModal(phase) {
        // Create simple modal for scientific foundations
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(4px);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            border-radius: 16px;
            max-width: 700px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        `;

        const header = document.createElement('div');
        header.style.cssText = `
            padding: 2rem;
            background: linear-gradient(135deg, ${phase.colorTheme}, ${darkenColor(phase.colorTheme, 20)});
            color: white;
            border-radius: 16px 16px 0 0;
            position: relative;
        `;
        header.innerHTML = `
            <button onclick="this.closest('.science-modal-overlay').remove()" style="
                position: absolute;
                top: 1.5rem;
                right: 1.5rem;
                background: rgba(255, 255, 255, 0.2);
                border: none;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                color: white;
                font-size: 1.25rem;
                cursor: pointer;
            ">&times;</button>
            <h2 style="margin: 0 0 0.5rem 0; font-size: 1.75rem;">${phase.name}</h2>
            <p style="margin: 0; opacity: 0.9;">${phase.nomenclatura}</p>
        `;

        const body = document.createElement('div');
        body.style.cssText = 'padding: 2rem; line-height: 1.7;';

        const justification = phase.justificacionCientifica.split('\n\n').map(para =>
            `<p style="margin-bottom: 1rem;">${para.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>`
        ).join('');

        body.innerHTML = `
            <h3 style="color: var(--text-dark); margin-bottom: 0.75rem;">
                <i class="fa-solid fa-flask"></i> Justificación Científica
            </h3>
            ${justification}
            
            <h3 style="color: var(--text-dark); margin: 2rem 0 0.75rem 0;">
                <i class="fa-solid fa-bullseye"></i> Objetivos de la Fase
            </h3>
            <ul>
                ${phase.objetivosFase.map(obj => `<li style="margin-bottom: 0.5rem;">${obj}</li>`).join('')}
            </ul>
        `;

        content.appendChild(header);
        content.appendChild(body);
        modal.appendChild(content);
        modal.className = 'science-modal-overlay';
        document.body.appendChild(modal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    function darkenColor(hex, percent) {
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, (num >> 8 & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }

    // --- EVIDENCE & REPORTING FUNCTIONS ---

    // Elements
    const btnSaveEvidence = document.getElementById('btn-save-evidence');
    const btnSelectEvidence = document.getElementById('btn-select-evidence');
    const fileInput = document.getElementById('evidence-file-input');
    const fileNameDisplay = document.getElementById('file-name-display');
    const ratingDisplayEl = document.getElementById('current-activity-rating-display');
    const btnGenerateReport = document.getElementById('btn-generate-report');

    // Event Listeners
    if (btnSelectEvidence && fileInput) {
        btnSelectEvidence.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0) {
                fileNameDisplay.textContent = fileInput.files[0].name;
            }
        });
    }

    if (btnSaveEvidence) {
        btnSaveEvidence.addEventListener('click', saveEvidence);
    }

    if (btnGenerateReport) {
        btnGenerateReport.addEventListener('click', generateWeeklyReport);
    }

    async function saveEvidence() {
        if (!currentActivityId) return;
        if (typeof currentScheduleIndex === 'undefined' || currentScheduleIndex === null) {
            alert("Error: No se identificó la actividad específica.");
            return;
        }

        const file = fileInput.files[0];
        const comments = document.getElementById('admin-comments').value;

        if (!file && !comments) {
            alert("Por favor sube una foto o escribe un comentario para guardar.");
            return;
        }

        if (!file) {
            alert("Por favor selecciona una foto para subir.");
            return;
        }

        btnSaveEvidence.disabled = true;
        btnSaveEvidence.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

        try {
            let imageUrl = null;

            // 1. Upload Image if exists
            if (file) {
                // --- IMAGE PROCESSING & COMPRESSION ---
                btnSaveEvidence.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Procesando imagen...';

                let fileToUpload = file;

                // A. Convert HEIC if needed
                if (file.name.toLowerCase().endsWith('.heic') || file.type === 'image/heic') {
                    console.log("Detectado formato HEIC, convirtiendo...");
                    try {
                        const blob = await heic2any({
                            blob: file,
                            toType: "image/jpeg",
                            quality: 0.8
                        });
                        fileToUpload = new File([blob], file.name.replace(/\.heic$/i, ".jpg"), {
                            type: "image/jpeg",
                            lastModified: new Date().getTime(),
                        });
                    } catch (e) {
                        console.error("Error converting HEIC:", e);
                        // Fallback: try uploading original if conversion fails
                    }
                }

                // B. Compress Image
                console.log("Comprimiendo imagen...", fileToUpload.size / 1024 / 1024, "MB");
                const options = {
                    maxSizeMB: 0.3, // Max size 300KB (reduced to avoid Firestore 1MB doc limit)
                    maxWidthOrHeight: 1280, // Max dimension 1280px
                    useWebWorker: true
                };

                try {
                    const compressedFile = await imageCompression(fileToUpload, options);
                    console.log("Imagen comprimida:", compressedFile.size / 1024 / 1024, "MB");
                    fileToUpload = compressedFile;
                } catch (error) {
                    console.error("Error compressing image:", error);
                }

                // C. PLAN B: Convert to Base64 (Store directly in Firestore)
                // This bypasses Firebase Storage requirements
                btnSaveEvidence.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

                const toBase64 = file => new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = error => reject(error);
                });

                try {
                    imageUrl = await toBase64(fileToUpload);
                    console.log("Imagen convertida a Base64 exitosamente.");
                } catch (e) {
                    console.error("Error converting to Base64:", e);
                    throw new Error("No se pudo procesar la imagen.");
                }

                // Removed Firebase Storage upload logic
                // const storageRef = storage.ref();
                // const fileRef = storageRef.child(`evidence/${currentWeekId}/${currentActivityId}_${Date.now()}.jpg`);
                // await fileRef.put(fileToUpload);
                // imageUrl = await fileRef.getDownloadURL();
            }

            // 2. Update Firestore (Only image URL)
            const docRef = db.collection('weekly_schedules').doc(currentWeekId);

            await db.runTransaction(async (transaction) => {
                const doc = await transaction.get(docRef);
                if (!doc.exists) throw "Week schedule not found";

                const schedule = doc.data().schedule || [];

                // Update specific item
                if (schedule[currentScheduleIndex]) {
                    // Create a clean copy of the item to avoid reference issues or non-serializable properties
                    const originalItem = schedule[currentScheduleIndex];
                    const item = { ...originalItem }; // Shallow copy

                    if (imageUrl) {
                        item.evidenceUrl = imageUrl;
                    }

                    if (comments) {
                        item.adminComments = comments;
                    } else {
                        // Ensure we don't save empty string if not needed
                        if (typeof comments === 'string') {
                            item.adminComments = comments;
                        }
                    }

                    item.evidenceTimestamp = new Date().toISOString();

                    // SANITIZE: Remove any undefined values which cause Firestore "invalid nested entity"
                    // JSON stringify/parse is a brute-force way to ensure a clean plain object with no functions/undefineds
                    const cleanItem = JSON.parse(JSON.stringify(item));

                    // Update the array in place
                    schedule[currentScheduleIndex] = cleanItem;

                    // Update document
                    transaction.update(docRef, { schedule: schedule });

                    // Update local state
                    currentSchedule = schedule;
                }
            });

            alert("Evidencia guardada exitosamente");

            // Refresh UI
            showActivityDetail(currentActivityId, null, currentScheduleIndex);
            loadSchedule();

        } catch (error) {
            console.error("Error saving evidence:", error);
            alert("Error al guardar la evidencia: " + error.message);
        } finally {
            btnSaveEvidence.disabled = false;
            btnSaveEvidence.innerHTML = '<i class="fa-solid fa-save"></i> Guardar Evidencia';
        }
    }

    async function getActivityRating(activityId, dayStr) {
        // Calculate date from day string (monday, tuesday, etc) relative to currentWeekStart
        const dayIndex = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].indexOf(dayStr);
        if (dayIndex === -1) return null;

        const activityDate = new Date(currentWeekStart);
        activityDate.setDate(activityDate.getDate() + dayIndex);
        const dateString = activityDate.toISOString().split('T')[0];

        try {
            // Note: 'feedback' is a subcollection in employees/{id}/feedback
            // We use collectionGroup to query all of them by date.
            // This might require a Firestore Index created in the Firebase Console.
            const snapshot = await db.collectionGroup('feedback')
                .where('date', '==', dateString)
                .get();

            if (snapshot.empty) return 0;

            let total = 0;
            let count = 0;
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.rating) {
                    total += Number(data.rating);
                    count++;
                }
            });

            return count > 0 ? (total / count).toFixed(1) : 0;
        } catch (error) {
            console.error("Error fetching rating:", error);
            // Fallback: If index is missing, return 0 (console will show link to create index)
            return 0;
        }
    }

    async function generateWeeklyReport() {
        if (!currentSchedule || currentSchedule.length === 0) {
            alert("No hay actividades en esta semana para generar reporte.");
            return;
        }

        // Generate report button loading state
        btnGenerateReport.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generando...';
        btnGenerateReport.disabled = true;

        try {
            // Verificar que la librería docx esté cargada
            if (typeof window.docx === 'undefined') {
                throw new Error('La librería docx no está cargada. Por favor recarga la página.');
            }

            const { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, Packer, ImageRun } = window.docx;

            const weekTitle = document.getElementById('current-week-label').textContent;
            const itemsToReport = currentSchedule;

            // Crear secciones del documento
            const sections = [];

            // Encabezado del documento
            sections.push(
                new Paragraph({
                    text: "Reporte Semanal de Actividades",
                    heading: HeadingLevel.HEADING_1,
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "Periodo: ", bold: true }),
                        new TextRun(weekTitle)
                    ],
                    spacing: { after: 200 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "Generado el: ", bold: true }),
                        new TextRun(new Date().toLocaleDateString('es-MX', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        }))
                    ],
                    spacing: { after: 200 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "Responsable: ", bold: true }),
                        new TextRun(auth.currentUser.email)
                    ],
                    spacing: { after: 600 }
                })
            );

            // Procesar cada actividad
            for (const item of itemsToReport) {
                const activity = activitiesMap[item.activityId];
                const name = activity ? activity.name : 'Actividad';
                const day = translateDay(item.day);

                // Obtener calificación
                const ratingValue = await getActivityRating(item.activityId, item.day);
                const ratingDisplay = ratingValue > 0 ? `${ratingValue} / 5.0` : 'Sin feedback';
                const comments = item.adminComments || 'Sin observaciones.';

                // Encabezado de actividad
                sections.push(
                    new Paragraph({
                        text: `${day} - ${name}`,
                        heading: HeadingLevel.HEADING_2,
                        spacing: { before: 400, after: 200 }
                    })
                );

                // Tabla con información de la actividad
                const tableRows = [
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph({ text: "Ubicación:", bold: true })],
                                width: { size: 30, type: WidthType.PERCENTAGE }
                            }),
                            new TableCell({
                                children: [new Paragraph(item.location || 'No definida')],
                                width: { size: 70, type: WidthType.PERCENTAGE }
                            })
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph({ text: "Calificación:", bold: true })]
                            }),
                            new TableCell({
                                children: [new Paragraph(`⭐ ${ratingDisplay}`)]
                            })
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph({ text: "Estado:", bold: true })]
                            }),
                            new TableCell({
                                children: [new Paragraph(item.evidenceUrl ? '✅ Evidencia adjunta' : '⚠️ Sin foto')]
                            })
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph({ text: "Observaciones:", bold: true })],
                                verticalAlign: "top"
                            }),
                            new TableCell({
                                children: [new Paragraph(comments)],
                                verticalAlign: "top"
                            })
                        ]
                    })
                ];

                sections.push(
                    new Table({
                        rows: tableRows,
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        margins: {
                            top: 100,
                            bottom: 100,
                            left: 100,
                            right: 100
                        }
                    })
                );

                // Agregar imagen de evidencia si existe
                if (item.evidenceUrl) {
                    try {
                        // Convertir base64 a buffer para docx
                        const base64Data = item.evidenceUrl.split(',')[1];
                        const binaryString = atob(base64Data);
                        const bytes = new Uint8Array(binaryString.length);
                        for (let i = 0; i < binaryString.length; i++) {
                            bytes[i] = binaryString.charCodeAt(i);
                        }

                        sections.push(
                            new Paragraph({
                                children: [
                                    new TextRun({ text: "Evidencia fotográfica:", bold: true })
                                ],
                                spacing: { before: 200, after: 100 }
                            }),
                            new Paragraph({
                                children: [
                                    new ImageRun({
                                        data: bytes,
                                        transformation: {
                                            width: 400,
                                            height: 300
                                        }
                                    })
                                ],
                                spacing: { after: 200 }
                            })
                        );
                    } catch (imageError) {
                        console.error('Error procesando imagen:', imageError);
                        // Si hay error con la imagen, solo agregar texto
                        sections.push(
                            new Paragraph({
                                children: [
                                    new TextRun({ text: "Evidencia fotográfica: Error al cargar imagen", italics: true })
                                ],
                                spacing: { before: 200, after: 200 }
                            })
                        );
                    }
                }

                // Espacio después de cada actividad
                sections.push(
                    new Paragraph({
                        text: "",
                        spacing: { after: 400 }
                    })
                );
            }

            // Pie de página
            sections.push(
                new Paragraph({
                    text: "IBERO ACTÍVATE - Reporte Generado Automáticamente",
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 600 },
                    italics: true
                })
            );

            // Crear el documento
            const doc = new Document({
                sections: [{
                    properties: {},
                    children: sections
                }]
            });

            // Generar y descargar el archivo
            const blob = await Packer.toBlob(doc);
            const fileName = `Reporte_Semanal_${weekTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`;
            saveAs(blob, fileName);

            alert('✅ Reporte DOCX generado exitosamente');

        } catch (e) {
            console.error(e);
            alert("Error al generar el reporte: " + e.message);
        } finally {
            btnGenerateReport.innerHTML = '<i class="fa-solid fa-file-word"></i> Reporte Semanal';
            btnGenerateReport.disabled = false;
        }
    }

    // --- ACTIVITY DETAIL PANEL FUNCTIONS ---

    let currentActivityId = null; // Store current activity ID for editing
    let currentScheduleIndex = null; // Store index for saving evidence

    function showActivityDetail(activityId, location, scheduleIndex = null) {
        // If scheduleIndex matches an item in currentSchedule, use it.
        // If not provided, we try to find the first occurrence (fallback, but risky if duplicates exist)
        // We will update the `onclick` in `renderScheduleItem` to pass the index.

        currentScheduleIndex = scheduleIndex;

        const activity = activitiesMap[activityId];
        if (!activity) {
            console.error('Activity not found:', activityId);
            return;
        }

        currentActivityId = activityId; // Store for edit button
        const panel = document.getElementById('activity-detail-panel');

        // Populate panel with activity data
        document.getElementById('detail-activity-name').innerHTML = `${activity.emoji} ${activity.name}`;

        // Image - try both imagen and imageUrl
        const imageEl = document.getElementById('detail-activity-image');
        const imageUrl = activity.imagen || activity.imageUrl;
        if (imageUrl) {
            imageEl.src = imageUrl;
            imageEl.style.display = 'block';
        } else {
            imageEl.style.display = 'none';
        }

        // Meta tags
        document.getElementById('detail-duration-value').textContent = `${activity.duration} minutos`;
        document.getElementById('detail-category-value').textContent = activity.categoria || activity.category || 'General';
        document.getElementById('detail-location-value').textContent = location || 'Por definir';

        // Description
        document.getElementById('detail-description').textContent = activity.description || 'Sin descripción disponible. Haz clic en el botón de editar para agregar una descripción.';

        // Objective - try both objetivo and objective
        const objetivo = activity.objetivo || activity.objective;
        document.getElementById('detail-objective').textContent = objetivo || 'Sin objetivo definido. Haz clic en el botón de editar para agregar un objetivo.';

        // Evidence Display Logic
        const evidenceContainer = document.getElementById('evidence-preview-container');
        const evidenceImage = document.getElementById('evidence-image');
        const ratingDisplay = document.getElementById('current-activity-rating-display');
        const commentsInput = document.getElementById('admin-comments');

        // Reset fields
        evidenceContainer.style.display = 'none';
        if (ratingDisplay) ratingDisplay.textContent = "Cargando...";
        fileInput.value = "";
        fileNameDisplay.textContent = "";
        if (commentsInput) commentsInput.value = "";

        // Check if this specific schedule item has evidence
        if (currentScheduleIndex !== null && currentSchedule[currentScheduleIndex]) {
            const item = currentSchedule[currentScheduleIndex];

            // Fetch rating asynchronously
            getActivityRating(item.activityId, item.day).then(rating => {
                if (ratingDisplay) {
                    ratingDisplay.textContent = rating > 0 ? `${rating} / 5.0` : "Sin feedback aún";
                }
            });

            if (item.adminComments && commentsInput) {
                commentsInput.value = item.adminComments;
            }

            if (item.evidenceUrl) {
                evidenceContainer.style.display = 'block';
                evidenceImage.src = item.evidenceUrl;
            }
        }

        // Improvements - use specificBenefits
        const improvementsContainer = document.getElementById('detail-improvements');
        improvementsContainer.innerHTML = '';

        const improvements = activity.specificBenefits || activity.whatImproves || [];

        if (improvements && improvements.length > 0) {
            const improvementIcons = {
                'Salud Física': 'fa-heart-pulse',
                'Salud Mental': 'fa-brain',
                'Salud Emocional': 'fa-smile',
                'Salud Ocupacional': 'fa-briefcase',
                'Bienestar General': 'fa-star',
                'Resistencia': 'fa-running',
                'Fuerza': 'fa-dumbbell',
                'Flexibilidad': 'fa-person-walking',
                'Coordinación': 'fa-hands',
                'Relajación': 'fa-spa',
                'Concentración': 'fa-bullseye',
                'Creatividad': 'fa-lightbulb',
                'Trabajo en Equipo': 'fa-users',
                'Comunicación': 'fa-comments',
                'Liderazgo': 'fa-crown',
                'Mejora postura': 'fa-user-check',
                'Reduce dolor': 'fa-hand-holding-medical',
                'Mejora movilidad': 'fa-person-walking',
                'Activa circulación': 'fa-heart-circle-bolt',
                'Reduce estrés': 'fa-spa',
                'Mejora estado de ánimo': 'fa-face-smile',
                'Aumenta energía': 'fa-bolt',
                'Fomenta trabajo en equipo': 'fa-users',
                'Mejora clima laboral': 'fa-building-user',
                'Fomenta integración': 'fa-handshake'
            };

            improvements.forEach(improvement => {
                const badge = document.createElement('span');
                badge.className = 'improvement-badge';

                // Find matching icon or use default
                let icon = 'fa-check-circle';
                for (const [key, value] of Object.entries(improvementIcons)) {
                    if (improvement.toLowerCase().includes(key.toLowerCase())) {
                        icon = value;
                        break;
                    }
                }

                badge.innerHTML = `<i class="fa-solid ${icon}"></i> ${improvement}`;
                improvementsContainer.appendChild(badge);
            });
        } else {
            improvementsContainer.innerHTML = '<p style="color: #9ca3af; font-style: italic;">No se especificaron mejoras. Haz clic en el botón de editar para agregar beneficios.</p>';
        }

        // Show panel with animation
        panel.classList.remove('hidden');

        // Smooth scroll to panel
        setTimeout(() => {
            panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    }

    // Close detail panel button
    const closeDetailBtn = document.getElementById('btn-close-detail');
    if (closeDetailBtn) {
        closeDetailBtn.addEventListener('click', () => {
            const panel = document.getElementById('activity-detail-panel');
            panel.classList.add('hidden');
            currentActivityId = null;
        });
    }

    // Edit activity button
    const editActivityBtn = document.getElementById('btn-edit-activity');
    if (editActivityBtn) {
        editActivityBtn.addEventListener('click', () => {
            if (currentActivityId) {
                // Navigate to activities page with edit mode
                window.location.href = `activities.html?edit=${currentActivityId}`;
            }
        });
    }

    // Delete scheduled activity function
    window.deleteScheduledActivity = async function (index) {
        if (!currentSchedule || !currentSchedule[index]) {
            alert('Error: No se pudo encontrar la actividad');
            return;
        }

        const item = currentSchedule[index];
        const activity = activitiesMap[item.activityId];
        const activityName = activity ? activity.name : 'esta actividad';

        const dayNames = {
            'monday': 'Lunes',
            'tuesday': 'Martes',
            'wednesday': 'Miércoles',
            'thursday': 'Jueves',
            'friday': 'Viernes'
        };
        const dayName = dayNames[item.day] || item.day;

        if (!confirm(`¿Estás seguro de eliminar "${activityName}" del ${dayName}?`)) {
            return;
        }

        try {
            // Remove from array
            currentSchedule.splice(index, 1);

            // Update Firebase
            await db.collection('weekly_schedules')
                .doc(currentWeekId)
                .update({
                    schedule: currentSchedule,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

            console.log('✓ Actividad eliminada del calendario');

            // Reload schedule to update UI
            loadSchedule();

        } catch (error) {
            console.error('Error eliminando actividad:', error);
            alert('Error al eliminar la actividad. Intenta de nuevo.');
        }
    };
});
