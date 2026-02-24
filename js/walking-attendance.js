// Lógica de Pase de Lista - CAMINATAS (Separado)
// Guarda en colecciones específicas de caminata

document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticación
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.href = 'login.html';
        }
    });

    // Colecciones Específicas
    const LOG_COLLECTION = 'walking_attendances_log';
    const SUB_COLLECTION = 'walking_attendance';
    const FEEDBACK_COLLECTION = 'walking_feedback';

    // Elementos DOM
    const dateDisplay = document.getElementById('current-date');
    const datePicker = document.getElementById('date-picker');
    const areaDropdown = document.getElementById('area-dropdown');
    const employeeList = document.getElementById('employee-list');

    // Variable para la fecha seleccionada
    let currentDate = new Date();

    // Inicializar fecha
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    updateDateDisplay();

    const getLocalDateString = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const todayStr = getLocalDateString();
    datePicker.max = todayStr;
    datePicker.value = todayStr;

    // Cargar Áreas
    loadAreas();

    // Event Listeners
    areaDropdown.addEventListener('change', loadEmployees);
    areaDropdown.addEventListener('input', loadEmployees);

    // Touch support
    areaDropdown.addEventListener('touchend', function (e) {
        setTimeout(() => { if (this.value) loadEmployees(); }, 300);
    });

    datePicker.addEventListener('change', (e) => {
        currentDate = new Date(e.target.value + 'T12:00:00');
        updateDateDisplay();
        loadEmployees();
    });

    function updateDateDisplay() {
        dateDisplay.textContent = currentDate.toLocaleDateString('es-ES', options);
        datePicker.value = currentDate.toISOString().split('T')[0];
    }

    async function loadAreas() {
        const container = document.getElementById('area-buttons-container');
        if (!container) return;

        try {
            const snapshot = await db.collection('areas').get();
            container.innerHTML = '';

            let areas = [];
            snapshot.forEach(doc => {
                areas.push({ id: doc.id, ...doc.data() });
            });

            // Orden alfabético simple
            areas.sort((a, b) => a.name.localeCompare(b.name));

            if (areas.length === 0) {
                container.innerHTML = '<div style="color: #999; width: 100%; text-align: center;">No hay áreas registradas</div>';
                return;
            }

            areas.forEach(area => {
                const btn = document.createElement('button');
                btn.className = 'area-btn';
                btn.dataset.id = area.id;
                const iconContent = '<i class="fa-solid fa-person-walking"></i>'; // Icono diferente
                const safeName = window.SecurityUtils ? window.SecurityUtils.escapeHTML(area.name) : area.name;
                btn.innerHTML = `${iconContent} ${safeName}`;

                btn.addEventListener('click', () => selectArea(area.id, btn));
                container.appendChild(btn);
            });

        } catch (error) {
            console.error('Error cargando áreas:', error);
            container.innerHTML = '<div style="color: #ef4444;">Error al cargar áreas</div>';
        }
    }

    function selectArea(areaId, btnElement) {
        const hiddenInput = document.getElementById('area-dropdown');
        if (hiddenInput) hiddenInput.value = areaId;

        document.querySelectorAll('.area-btn').forEach(b => b.classList.remove('active'));
        if (btnElement) btnElement.classList.add('active');

        loadEmployees();
    }

    let unsubscribe = null;

    async function loadEmployees() {
        const areaId = areaDropdown.value;
        const emptyState = document.getElementById('empty-state');

        employeeList.innerHTML = '';
        if (unsubscribe) { unsubscribe(); unsubscribe = null; }

        if (!areaId) {
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        employeeList.innerHTML = '<div style="text-align: center; padding: 2rem; color: #666;"><i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem;"></i><br><br>Cargando caminantes...</div>';

        try {
            const snapshot = await db.collection('employees')
                .where('areaId', '==', areaId)
                .get();

            if (snapshot.empty) {
                employeeList.innerHTML = '';
                const noDataDiv = document.createElement('div');
                noDataDiv.className = 'no-data';
                noDataDiv.textContent = 'No hay empleados en esta área';
                employeeList.appendChild(noDataDiv);
                return;
            }

            let employees = [];
            snapshot.forEach(doc => employees.push({ id: doc.id, ...doc.data() }));
            employees.sort((a, b) => a.fullName.localeCompare(b.fullName));

            employeeList.innerHTML = '';
            employees.forEach(emp => {
                createEmployeeCard(emp.id, emp, null);
            });

            // LISTENER REAL-TIME (COLECCIÓN ESPECÍFICA DE CAMINATAS)
            const selectedDate = currentDate.toISOString().split('T')[0];

            unsubscribe = db.collection(LOG_COLLECTION)
                .where('date', '==', selectedDate)
                .onSnapshot((attSnapshot) => {
                    console.log('🔄 Listener de CAMINATAS activado:', attSnapshot.size);
                    const attendanceMap = new Map();
                    attSnapshot.forEach(doc => {
                        const data = doc.data();
                        if (data.employeeId) {
                            attendanceMap.set(data.employeeId, data.status);
                        }
                    });

                    employees.forEach(emp => {
                        const status = attendanceMap.get(emp.id);
                        updateEmployeeCardStatus(emp.id, status);
                    });
                });

        } catch (error) {
            console.error('Error cargando empleados:', error);
            employeeList.innerHTML = '<div class="error">Error al cargar datos</div>';
        }
    }

    function createEmployeeCard(id, emp, status) {
        const card = document.createElement('div');
        card.className = 'employee-card';
        card.id = `card-${id}`;
        card.dataset.id = id;

        const iconDiv = document.createElement('div');
        iconDiv.className = 'card-icon';
        const icon = document.createElement('i');
        icon.className = 'fa-regular fa-circle';
        iconDiv.appendChild(icon);

        const infoDiv = document.createElement('div');
        infoDiv.className = 'card-info';

        const h3 = document.createElement('h3');
        h3.textContent = window.SecurityUtils ? window.SecurityUtils.escapeHTML(emp.fullName) : emp.fullName;

        const p = document.createElement('p');
        const safeAccount = window.SecurityUtils ? window.SecurityUtils.validateAccountNumber(emp.accountNumber) : emp.accountNumber;
        p.textContent = `#${safeAccount || 'N/A'}`;

        infoDiv.appendChild(h3);
        infoDiv.appendChild(p);

        card.appendChild(iconDiv);
        card.appendChild(infoDiv);

        card.addEventListener('click', () => toggleAttendance(card, id, emp));
        employeeList.appendChild(card);
    }

    function updateEmployeeCardStatus(id, status) {
        const card = document.getElementById(`card-${id}`);
        if (!card) return;

        const iconContainer = card.querySelector('.card-icon');
        const existingReset = card.querySelector('.reset-btn-overlay');
        if (existingReset) existingReset.remove();

        card.classList.remove('selected', 'completed');

        if (status === 'active' || status === 'completed') {
            card.classList.add('selected');
            if (status === 'completed') card.classList.add('completed');

            // Icono verde en ambos casos para caminata
            const iconType = status === 'completed' ? 'fa-check-double' : 'fa-check';
            iconContainer.innerHTML = `<i class="fa-solid ${iconType}" style="color: #10b981; font-size: 1.2rem;"></i>`;
            card.style.borderColor = '#10b981';
            card.style.backgroundColor = '#ecfdf5';

            // Botón de eliminar
            const resetBtn = document.createElement('button');
            resetBtn.className = 'reset-btn-overlay';
            resetBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
            resetBtn.title = 'Eliminar registro de caminata';
            resetBtn.style.cssText = `
                position: absolute; top: 10px; right: 10px;
                background: #fee2e2; color: #ef4444; border: 1px solid #fecaca;
                border-radius: 50%; width: 28px; height: 28px;
                display: flex; align-items: center; justify-content: center;
                cursor: pointer; font-size: 12px; z-index: 10;
            `;
            resetBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteAttendanceRecord(id);
            });
            card.style.position = 'relative';
            card.appendChild(resetBtn);

        } else {
            // AUSENTE
            iconContainer.innerHTML = '<i class="fa-regular fa-circle"></i>';
            card.style.borderColor = '#e1e4e8';
            card.style.backgroundColor = '#fff';
        }
        card.dataset.status = status || 'absent';
    }

    async function deleteAttendanceRecord(employeeId) {
        if (!confirm('¿Eliminar registro de caminata?')) return;
        const selectedDate = currentDate.toISOString().split('T')[0];

        try {
            const batch = db.batch();

            // Borrar de subcolección caminata
            const subSnap = await db.collection('employees').doc(employeeId).collection(SUB_COLLECTION)
                .where('date', '==', selectedDate).get();
            subSnap.forEach(doc => batch.delete(doc.ref));

            // Borrar de log general de caminatas
            const topSnap = await db.collection(LOG_COLLECTION)
                .where('employeeId', '==', employeeId)
                .where('date', '==', selectedDate).get();
            topSnap.forEach(doc => batch.delete(doc.ref));

            await batch.commit();
            showToast('🗑️ Registro de caminata eliminado');
            updateEmployeeCardStatus(employeeId, null);
        } catch (error) {
            console.error(error);
            alert('Error al eliminar');
        }
    }

    async function toggleAttendance(card, employeeId, employeeData) {
        if (card.classList.contains('processing')) return;
        card.classList.add('processing');

        const currentStatus = card.dataset.status || 'absent';
        const selectedDate = currentDate.toISOString().split('T')[0];
        const areaId = document.getElementById('area-dropdown').value;
        const skipFeedback = document.getElementById('skip-feedback-toggle').checked;
        const firstDayMode = document.getElementById('first-day-mode')?.checked;
        const sessionType = document.getElementById('session-type').value;

        if (!areaId) {
            alert('Selecciona un área');
            card.classList.remove('processing');
            return;
        }

        try {
            if (currentStatus === 'absent') {
                // REGISTRAR CAMINATA
                let status = skipFeedback ? 'completed' : 'active';

                // Si es primer día, forzamos estado especial
                if (firstDayMode) {
                    status = 'active'; // Siempre inicia activa para que el usuario la vea
                }

                updateEmployeeCardStatus(employeeId, status); // Optimistic

                const data = {
                    employeeId,
                    employeeName: employeeData.fullName,
                    areaId,
                    date: selectedDate,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    status: status,
                    type: sessionType,
                    category: 'walking_session',
                    isFirstDay: firstDayMode || false
                };

                const batch = db.batch();
                const subRef = db.collection('employees').doc(employeeId).collection(SUB_COLLECTION).doc();
                const topRef = db.collection(LOG_COLLECTION).doc(subRef.id);

                batch.set(subRef, data);
                batch.set(topRef, data);

                // ACTIVACIÓN REMOTA DEL PERFIL (Primer Día)
                if (firstDayMode) {
                    const empRef = db.collection('employees').doc(employeeId);
                    batch.update(empRef, {
                        walkingSessionState: 'active',
                        currentSessionId: subRef.id,
                        lastWalkingSession: firebase.firestore.FieldValue.serverTimestamp()
                    });
                } else if (skipFeedback) {
                    const empRef = db.collection('employees').doc(employeeId);
                    batch.update(empRef, {
                        points: firebase.firestore.FieldValue.increment(20),
                        lastWalkingSession: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }

                await batch.commit();
                showToast(firstDayMode ? `🚀 Sesión Iniciada: ${employeeData.fullName}` : `Caminata registrada: ${employeeData.fullName}`);

            } else {
                // Si es completado y modo primer día, podríamos abrir modal de edición de resultados
                if (currentStatus === 'completed' && firstDayMode) {
                    showOfficialStatsModal(employeeId, employeeData);
                    card.classList.remove('processing');
                    return;
                }
                await deleteAttendanceRecord(employeeId);
            }
        } catch (error) {
            console.error(error);
            alert('Error de conexión');
        } finally {
            card.classList.remove('processing');
        }
    }

    function showOfficialStatsModal(employeeId, employeeData) {
        // Remover si ya existe
        document.getElementById('stats-modal')?.remove();

        const modal = document.createElement('div');
        modal.id = 'stats-modal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.7); z-index: 10000;
            display: flex; align-items: center; justify-content: center;
        `;

        modal.innerHTML = `
            <div style="background: white; padding: 2rem; border-radius: 20px; width: 90%; max-width: 400px; box-shadow: 0 20px 50px rgba(0,0,0,0.3);">
                <h2 style="margin-bottom: 1.5rem; color: #1f2937;">📊 Métricas Oficiales - ${employeeData.fullName}</h2>
                <div style="margin-bottom: 1rem;">
                    <label style="display:block; font-size: 0.8rem; font-weight: 700; color: #6b7280;">DISTANCIA TOTAL (KM)</label>
                    <input type="number" id="official-km" step="0.01" style="width: 100%; padding: 0.75rem; border: 2px solid #e5e7eb; border-radius: 10px; font-size: 1.1rem;" placeholder="Ej: 2.45">
                </div>
                <div style="margin-bottom: 1rem;">
                    <label style="display:block; font-size: 0.8rem; font-weight: 700; color: #6b7280;">RITMO PROMEDIO (MIN/KM)</label>
                    <input type="number" id="official-pace" step="0.1" style="width: 100%; padding: 0.75rem; border: 2px solid #e5e7eb; border-radius: 10px; font-size: 1.1rem;" placeholder="Ej: 8.5">
                </div>
                <div style="margin-bottom: 1.5rem;">
                    <label style="display:block; font-size: 0.8rem; font-weight: 700; color: #6b7280;">PASOS PROMEDIO</label>
                    <input type="number" id="official-steps" style="width: 100%; padding: 0.75rem; border: 2px solid #e5e7eb; border-radius: 10px; font-size: 1.1rem;" placeholder="Ej: 3200">
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <button onclick="document.getElementById('stats-modal').remove()" style="padding: 0.75rem; border: none; background: #f3f4f6; color: #4b5563; border-radius: 10px; font-weight: 700; cursor: pointer;">Cancelar</button>
                    <button id="save-official-btn" style="padding: 0.75rem; border: none; background: #10b981; color: white; border-radius: 10px; font-weight: 700; cursor: pointer;">Guardar</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('save-official-btn').addEventListener('click', async () => {
            const km = document.getElementById('official-km').value;
            const pace = document.getElementById('official-pace').value;
            const steps = document.getElementById('official-steps').value;

            if (!km || !steps) { alert("Completa los datos"); return; }

            const btn = document.getElementById('save-official-btn');
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

            try {
                // Buscar el registro de hoy
                const selectedDate = currentDate.toISOString().split('T')[0];
                const statsSnap = await db.collection('walking_stats')
                    .where('employeeId', '==', employeeId)
                    .where('date', '==', selectedDate).get();

                const batch = db.batch();
                statsSnap.forEach(doc => {
                    batch.update(doc.ref, {
                        "tech_values.performance.official_distance_km": parseFloat(km),
                        "tech_values.performance.official_pace": parseFloat(pace),
                        "tech_values.performance.official_steps": parseInt(steps),
                        "isValidatedByAdmin": true
                    });
                });

                await batch.commit();
                showToast("✅ Métricas oficiales guardadas");
                modal.remove();
            } catch (err) {
                console.error(err);
                alert("Error al guardar");
                btn.disabled = false;
                btn.innerHTML = 'Guardar';
            }
        });
    }

    // --- LÓGICA DE CONTROL MAESTRO (LIVE SESSION) ---
    const LIVE_SESSION_REF = db.collection('live_walking_sessions').doc('current');
    let liveSessionActive = false;
    let currentQuestionIndex = 0;
    let responseMode = 'none';
    let sessionStartTime = null;

    const QUESTIONS_SCRIPT_DEFAULT = [
        { title: "Sustento: Rader & Plante (1/5)", question: "¿Cómo llegas hoy a esta caminata? Elige una palabra que describa tu día.", options: ["Feliz", "Estresado", "Cansado", "Neutral"] },
        { title: "Sustento: Rader & Plante (2/5)", question: "¿Qué momento de hoy se te hizo más pesado y qué sentiste?", options: ["Trabajo", "Familia", "Tráfico", "Otro"] },
        { title: "Sustento: Rader & Plante (3/5)", question: "¿Qué cosa pequeña salió bien hoy?", options: ["Una plática", "Un logro", "Un café", "Un respiro"] },
        { title: "Sustento: Rader & Plante (4/5)", question: "¿Por qué te sientes agradecido hoy?", options: ["Salud", "Compañeros", "Familia", "El clima"] },
        { title: "Sustento: Rader & Plante (5/5)", question: "¿Qué acción pequeña quieres intentar mañana?", options: ["Más calma", "Mejor organización", "Escuchar más", "Descansar"] }
    ];

    const QUESTIONS_SCRIPT_FIRST_DAY = [
        { title: "Bienvenida (1/5)", question: "¿Qué te motivó a inscribirte en este programa de caminatas?", options: ["Salud", "Convivencia", "Curiosidad", "Recomendación"] },
        { title: "Expectativas (2/5)", question: "¿Cómo describirías tu nivel actual de actividad física?", options: ["Sedentario", "Ligero", "Activo", "Atleta"] },
        { title: "Métricas (3/5)", question: "¿Sabías que 7,000 pasos al día reducen significativamente el riesgo de mortalidad?", options: ["Sí", "No", "Tenía idea", "No me importa"] },
        { title: "Compromiso (4/5)", question: "¿Cuántos días a la semana te gustaría caminar con el grupo?", options: ["1 día", "2 días", "3+ días", "Veremos"] },
        { title: "Sensación (5/5)", question: "¿Cómo te sientes después de estos primeros pasos?", options: ["Emocionado", "Cansado", "Motivado", "Indiferente"] }
    ];

    function getActiveScript() {
        const isFirstDay = document.getElementById('first-day-mode')?.checked;
        return isFirstDay ? QUESTIONS_SCRIPT_FIRST_DAY : QUESTIONS_SCRIPT_DEFAULT;
    }

    window.toggleLiveSession = async function () {
        const btn = document.getElementById('btn-toggle-live');
        const control = document.getElementById('live-questions-control');
        const badge = document.getElementById('live-status-badge');
        const summaryBtn = document.getElementById('btn-show-summary');

        liveSessionActive = !liveSessionActive;

        if (liveSessionActive) {
            sessionStartTime = new Date();
            btn.textContent = "DETENER SESIÓN";
            btn.style.background = "#ef4444";
            control.style.opacity = "1";
            control.style.pointerEvents = "auto";
            badge.textContent = "EN VIVO 🔴";
            badge.style.background = "#ef4444";
            if (summaryBtn) summaryBtn.style.display = 'block';

            // Reset index when starting
            currentQuestionIndex = 0;
            const script = getActiveScript();
            document.getElementById('current-q-index').textContent = `PREGUNTA 1/${script.length}`;
            document.getElementById('current-q-text').textContent = script[0].question;

            updateLiveDatabase();
        } else {
            btn.textContent = "INICIAR SESIÓN";
            btn.style.background = "#10b981";
            control.style.opacity = "0.5";
            control.style.pointerEvents = "none";
            badge.textContent = "INACTIVO";
            badge.style.background = "rgba(255,255,255,0.2)";
            await LIVE_SESSION_REF.delete().catch(() => { });
        }
    };

    window.changeLiveQuestion = function (dir) {
        const script = getActiveScript();
        currentQuestionIndex += dir;
        if (currentQuestionIndex < 0) currentQuestionIndex = 0;
        if (currentQuestionIndex >= script.length) currentQuestionIndex = script.length - 1;

        document.getElementById('current-q-index').textContent = `PREGUNTA ${currentQuestionIndex + 1}/${script.length}`;
        document.getElementById('current-q-text').textContent = script[currentQuestionIndex].question;

        updateLiveDatabase();
    };

    window.setResponseMode = function (mode) {
        responseMode = mode;
        showToast(`Modo: ${mode === 'multiple' ? 'Opción Múltiple' : 'Texto'}`);
        updateLiveDatabase();
    };

    async function updateLiveDatabase() {
        if (!liveSessionActive) return;
        const script = getActiveScript();

        await LIVE_SESSION_REF.set({
            active: true,
            currentQuestionIndex,
            title: script[currentQuestionIndex].title,
            question: script[currentQuestionIndex].question,
            options: script[currentQuestionIndex].options,
            responseMode,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });
    }

    // Escuchar respuestas en tiempo real
    db.collection('walking_live_responses').where('timestamp', '>', new Date(Date.now() - 3600000))
        .onSnapshot(snap => {
            const countElem = document.getElementById('live-response-count');
            if (countElem) countElem.textContent = snap.size;
        });

    window.generateLiveSessionSummary = async function () {
        if (!sessionStartTime) return alert("No hay una sesión activa para resumir");

        const modal = document.getElementById('summary-modal');
        const content = document.getElementById('summary-content');
        modal.style.display = 'flex';
        content.innerHTML = '<div style="text-align:center; padding:3rem;"><i class="fa-solid fa-spinner fa-spin fa-3x"></i><p>Generando reporte...</p></div>';

        try {
            const snap = await db.collection('walking_live_responses')
                .where('timestamp', '>=', sessionStartTime)
                .orderBy('timestamp', 'asc')
                .get();

            if (snap.empty) {
                content.innerHTML = '<div style="text-align:center; padding:3rem;"><i class="fa-solid fa-comment-slash fa-3x mb-3" style="color:#d1d5db;"></i><p>No se recibieron respuestas durante esta sesión.</p></div>';
                return;
            }

            const responses = [];
            snap.forEach(doc => responses.push(doc.data()));

            // Agrupar por pregunta
            const groups = {};
            responses.forEach(res => {
                const qText = res.question || "Sin pregunta específica";
                if (!groups[qText]) groups[qText] = [];
                groups[qText].push(res);
            });

            let html = `
                <div style="background: white; border-radius: 15px; padding: 2rem; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; border-bottom: 2px solid #f3f4f6; padding-bottom: 1.5rem;">
                        <div>
                            <h3 style="margin: 0; color: #111827; font-size: 1.5rem;">Caminata Grupal: Sesión de Reflexión</h3>
                            <p style="color: #6b7280; margin: 5px 0 0 0;">Fecha: ${sessionStartTime.toLocaleDateString()} | Inicio: ${sessionStartTime.toLocaleTimeString()}</p>
                        </div>
                        <div style="text-align: right;">
                            <span style="background: #eff6ff; color: #2563eb; padding: 6px 15px; border-radius: 20px; font-weight: 800; font-size: 0.8rem;">${snap.size} TOTAL RESPUESTAS</span>
                        </div>
                    </div>
            `;

            for (const [question, groupResponses] of Object.entries(groups)) {
                html += `
                    <div style="margin-bottom: 2.5rem;">
                        <h4 style="color: #10b981; font-size: 1rem; margin-bottom: 1rem; border-left: 4px solid #10b981; padding-left: 10px;">PREGUNTA: "${question}"</h4>
                        <div style="display: flex; flex-direction: column; gap: 0.8rem;">
                `;

                groupResponses.forEach(res => {
                    const time = res.timestamp ? new Date(res.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
                    html += `
                        <div style="background: #fff; border: 1px solid #f3f4f6; padding: 1rem; border-radius: 12px; display: flex; gap: 0.8rem; align-items: flex-start;">
                            <div style="width: 32px; height: 32px; border-radius: 50%; background: #f0fdf4; color: #10b981; display: flex; align-items: center; justify-content: center; font-weight: 800; flex-shrink: 0; font-size: 0.8rem;">${res.employeeName ? res.employeeName.charAt(0) : '?'}</div>
                            <div style="flex: 1;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.2rem;">
                                    <b style="color: #4b5563; font-size: 0.9rem;">${res.employeeName || 'Anónimo'}</b>
                                    <span style="font-size: 0.7rem; color: #9ca3af;">${time}</span>
                                </div>
                                <p style="margin: 0; color: #1f2937; line-height: 1.4; font-size: 0.95rem;">
                                    ${res.response}
                                </p>
                            </div>
                        </div>
                    `;
                });

                html += `</div></div>`;
            }

            html += `</div>`;
            content.innerHTML = html;
        } catch (e) {
            console.error(e);
            content.innerHTML = `<p style="color: red; text-align: center;">Error al cargar respuestas: ${e.message}</p>`;
        }
    };

    function showToast(message) {
        let toast = document.getElementById('toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            toast.style.cssText = `
                position: fixed; bottom: 20px; right: 20px;
                background: #059669; color: white;
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
