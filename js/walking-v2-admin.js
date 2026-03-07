// ============================================================
// WALKING V2 - ADMIN JAVASCRIPT
// Gestiona asistencia, estadísticas y fotos de caminatas
// ============================================================

// ──── ESTADO GLOBAL ────
let allEmployees = [];
let attendanceMap = {}; // { userId: true/false }
let pendingPhotos = []; // Files to upload
let currentSessionId = null;

// ──── INIT ────
firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) {
        // No autenticado → redirigir al login del proyecto Pausas Activas
        window.location.href = 'login.html';
        return;
    }

    // Verificar que el usuario NO sea un empleado del sistema V2
    // (los empleados V2 tienen su propia cuenta en walking_v2_users)
    try {
        const empSnap = await db.collection('walking_v2_users')
            .where('email', '==', user.email).limit(1).get();

        if (!empSnap.empty) {
            // Es un empleado V2, no un admin → redirigir a su panel
            window.location.href = '../employee/walking-v2-dashboard.html';
            return;
        }
    } catch (e) {
        // Si hay error de permisos, continuar (es un admin del sistema principal)
        console.warn('Verificación de empleado omitida:', e.message);
    }

    // ✅ Es admin del sistema → cargar datos
    await loadEmployees();
    loadHistory();
    generateSessionId();
});

function generateSessionId() {
    const date = document.getElementById('session-date').value;
    const type = document.getElementById('session-type').value;
    currentSessionId = `${date}_${type}`;
}

document.getElementById('session-date').addEventListener('change', generateSessionId);
document.getElementById('session-type').addEventListener('change', generateSessionId);

// ──── TOAST ────
function showToast(msg, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'circle-exclamation'}"></i> ${msg}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

// ──── LOAD EMPLOYEES ────
async function loadEmployees() {
    try {
        const snap = await db.collection('walking_v2_users').orderBy('name').get();
        allEmployees = [];
        snap.forEach(doc => {
            allEmployees.push({ id: doc.id, ...doc.data() });
        });
        renderAttendanceGrid(allEmployees);
        updateStats();
        await loadUsers(); // also update users table
    } catch (e) {
        console.error('Error loading employees:', e);
        showToast('Error al cargar empleados: ' + e.message, 'error');
    }
}

// ──── RENDER ATTENDANCE ────
function renderAttendanceGrid(employees) {
    const container = document.getElementById('attendance-container');
    if (!employees.length) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users-slash"></i>
                <p>No hay usuarios registrados aún.</p>
                <p style="font-size:0.8rem; margin-top:0.5rem;">Ve a la pestaña "Usuarios" para agregar participantes.</p>
            </div>`;
        return;
    }
    const grid = document.createElement('div');
    grid.className = 'attendance-grid';
    employees.forEach(emp => {
        const isPresent = attendanceMap[emp.id] === true;
        const isAbsent = attendanceMap[emp.id] === false;
        const initials = emp.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
        const card = document.createElement('div');
        card.className = `emp-card ${isPresent ? 'present' : isAbsent ? 'absent' : ''}`;
        card.id = `emp-${emp.id}`;
        card.onclick = () => toggleAttendance(emp.id);
        card.innerHTML = `
            <div class="emp-status ${isPresent ? 'present' : isAbsent ? 'absent' : ''}" id="status-${emp.id}">
                ${isPresent ? '<i class="fas fa-check"></i>' : isAbsent ? '<i class="fas fa-times"></i>' : ''}
            </div>
            <div class="emp-avatar">${initials}</div>
            <div class="emp-name">${emp.name}</div>
            <div class="emp-num">${emp.accountNumber || ''}</div>
            <div style="margin-top:0.5rem;">${emp.department ? `<span style="font-size:0.65rem; color:#64748b;">${emp.department}</span>` : ''}</div>
        `;
        grid.appendChild(card);
    });
    container.innerHTML = '';
    container.appendChild(grid);
}

// ──── TOGGLE ATTENDANCE ────
function toggleAttendance(empId) {
    if (attendanceMap[empId] === undefined || attendanceMap[empId] === false) {
        attendanceMap[empId] = true;
    } else if (attendanceMap[empId] === true) {
        attendanceMap[empId] = false;
    }
    // Update card visual
    const card = document.getElementById(`emp-${empId}`);
    const status = document.getElementById(`status-${empId}`);
    if (attendanceMap[empId]) {
        card.classList.add('present'); card.classList.remove('absent');
        status.className = 'emp-status present';
        status.innerHTML = '<i class="fas fa-check"></i>';
    } else {
        card.classList.add('absent'); card.classList.remove('present');
        status.className = 'emp-status absent';
        status.innerHTML = '<i class="fas fa-times"></i>';
    }
    updateStats();
}

// ──── MARK ALL ────
function markAll(present) {
    allEmployees.forEach(emp => {
        attendanceMap[emp.id] = present;
    });
    renderAttendanceGrid(allEmployees);
    updateStats();
}

// ──── UPDATE STATS ────
function updateStats() {
    const total = allEmployees.length;
    const present = Object.values(attendanceMap).filter(v => v === true).length;
    const pct = total > 0 ? Math.round((present / total) * 100) : 0;
    document.getElementById('stat-present').textContent = present;
    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-pct').textContent = pct + '%';
}

// ──── FILTER EMPLOYEES ────
function filterEmployees() {
    const q = document.getElementById('search-employees').value.toLowerCase();
    const filtered = allEmployees.filter(e =>
        e.name.toLowerCase().includes(q) ||
        (e.accountNumber || '').toLowerCase().includes(q) ||
        (e.department || '').toLowerCase().includes(q)
    );
    renderAttendanceGrid(filtered);
}

// ──── SAVE SESSION (Asistencia + Stats + Fotos juntos) ────
async function saveCurrentSession() {
    generateSessionId();
    const date = document.getElementById('session-date').value;
    const type = document.getElementById('session-type').value;
    const week = document.getElementById('session-week').value || null;

    if (!date) { showToast('Por favor selecciona una fecha', 'error'); return; }

    const btn = document.getElementById('btn-save-session');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

    try {
        // ① LEER ESTADÍSTICAS del formulario integrado
        const km = parseFloat(document.getElementById('stat-km').value) || 0;
        const steps = parseInt(document.getElementById('stat-steps').value) || 0;
        const duration = parseInt(document.getElementById('stat-duration').value) || 0;
        const calories = parseInt(document.getElementById('stat-calories').value) || 0;
        const hr = parseInt(document.getElementById('stat-hr').value) || null;
        const cadence = parseInt(document.getElementById('stat-cadence').value) || null;
        const weather = document.getElementById('stat-weather').value;
        const notes = document.getElementById('stat-notes').value.trim();

        // ② GUARDAR ASISTENCIA + STATS en Firestore (batch)
        const batch = db.batch();
        const sessionRef = db.collection('walking_v2_sessions').doc(currentSessionId);

        const presentCount = Object.values(attendanceMap).filter(v => v).length;

        // Documento principal de la sesión
        batch.set(sessionRef, {
            date, type, week: week ? parseInt(week) : null,
            sessionId: currentSessionId,
            totalAttendees: presentCount,
            totalUsers: allEmployees.length,
            stats: { km, steps, duration, calories, hr, cadence, weather, notes },
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        // Registros de asistencia individual
        for (const [userId, present] of Object.entries(attendanceMap)) {
            const empData = allEmployees.find(e => e.id === userId);
            const attRef = sessionRef.collection('attendance').doc(userId);
            batch.set(attRef, {
                userId, present,
                name: empData?.name || '',
                email: empData?.email || '',
                date, sessionId: currentSessionId,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Acumular stats solo para los presentes
            if (present && steps > 0) {
                const userRef = db.collection('walking_v2_users').doc(userId);
                batch.update(userRef, {
                    totalSessions: firebase.firestore.FieldValue.increment(1),
                    lastSession: date,
                    cumulativeKm: firebase.firestore.FieldValue.increment(km),
                    cumulativeSteps: firebase.firestore.FieldValue.increment(steps),
                    cumulativeMinutes: firebase.firestore.FieldValue.increment(duration),
                    cumulativeCalories: firebase.firestore.FieldValue.increment(calories),
                });
            } else if (present) {
                const userRef = db.collection('walking_v2_users').doc(userId);
                batch.update(userRef, {
                    totalSessions: firebase.firestore.FieldValue.increment(1),
                    lastSession: date,
                });
            }
        }

        await batch.commit();

        // ③ GUARDAR FOTOS como Base64 en Firestore (sin Firebase Storage)
        if (pendingPhotos.length > 0) {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando fotos...';
            const bar = document.getElementById('upload-bar');
            const fill = document.getElementById('upload-bar-fill');
            bar.style.display = 'block';

            const photoData = [];
            for (let i = 0; i < pendingPhotos.length; i++) {
                const base64 = await compressToBase64(pendingPhotos[i], 900, 0.75);
                photoData.push({
                    base64,
                    name: pendingPhotos[i].name,
                    uploadedAt: new Date().toISOString()
                });
                fill.style.width = `${((i + 1) / pendingPhotos.length) * 100}%`;
            }

            // Firestore doc limit ~1MB — guardamos en subcolección por foto
            for (const photo of photoData) {
                await db.collection('walking_v2_sessions').doc(currentSessionId)
                    .collection('photos').add(photo);
            }
            await db.collection('walking_v2_sessions').doc(currentSessionId).update({
                photoCount: firebase.firestore.FieldValue.increment(photoData.length),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            pendingPhotos = [];
            document.getElementById('photo-preview-grid').innerHTML = '';
            bar.style.display = 'none';
            fill.style.width = '0%';
        }

        showToast(`✅ Sesión guardada — ${presentCount} presentes, ${km} km, ${steps.toLocaleString()} pasos`);
        loadSessionPhotos(); // recargar galería guardada

    } catch (e) {
        console.error(e);
        showToast('Error al guardar: ' + e.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save"></i> Guardar Sesión';
    }
}

// ──── SAVE STATS ────
async function saveStats() {
    generateSessionId();
    const km = parseFloat(document.getElementById('stat-km').value) || 0;
    const steps = parseInt(document.getElementById('stat-steps').value) || 0;
    const duration = parseInt(document.getElementById('stat-duration').value) || 0;
    const calories = parseInt(document.getElementById('stat-calories').value) || 0;
    const hr = parseInt(document.getElementById('stat-hr').value) || null;
    const cadence = parseInt(document.getElementById('stat-cadence').value) || null;
    const weather = document.getElementById('stat-weather').value;
    const notes = document.getElementById('stat-notes').value.trim();
    const date = document.getElementById('session-date').value;
    const week = document.getElementById('session-week').value || null;

    if (!date) { showToast('Selecciona la fecha primero', 'error'); return; }

    try {
        await db.collection('walking_v2_sessions').doc(currentSessionId).set({
            date, week: week ? parseInt(week) : null,
            stats: { km, steps, duration, calories, hr, cadence, weather, notes },
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        // Also update cumulative stats per-user for those who attended
        const presentUsers = Object.entries(attendanceMap).filter(([, v]) => v).map(([k]) => k);
        const batch = db.batch();
        for (const userId of presentUsers) {
            const userRef = db.collection('walking_v2_users').doc(userId);
            batch.update(userRef, {
                cumulativeKm: firebase.firestore.FieldValue.increment(km),
                cumulativeSteps: firebase.firestore.FieldValue.increment(steps),
                cumulativeMinutes: firebase.firestore.FieldValue.increment(duration),
                cumulativeCalories: firebase.firestore.FieldValue.increment(calories),
            });
        }
        if (presentUsers.length > 0) await batch.commit();

        showToast('📊 Estadísticas guardadas y distribuidas a los empleados');
    } catch (e) {
        console.error(e);
        showToast('Error: ' + e.message, 'error');
    }
}

// ──── LOAD PREVIOUS STATS ────
async function loadPreviousStats() {
    try {
        const snap = await db.collection('walking_v2_sessions')
            .orderBy('date', 'desc').limit(1).get();
        if (snap.empty) { showToast('No hay sesiones previas', 'error'); return; }
        const d = snap.docs[0].data();
        const s = d.stats || {};
        document.getElementById('stat-km').value = s.km || '';
        document.getElementById('stat-steps').value = s.steps || '';
        document.getElementById('stat-duration').value = s.duration || '';
        document.getElementById('stat-calories').value = s.calories || '';
        document.getElementById('stat-hr').value = s.hr || '';
        document.getElementById('stat-cadence').value = s.cadence || '';
        document.getElementById('stat-weather').value = s.weather || '';
        document.getElementById('stat-notes').value = s.notes || '';
        showToast('Datos de la última sesión cargados');
    } catch (e) {
        showToast('Error: ' + e.message, 'error');
    }
}

// ──── PHOTO HANDLING (Base64 → Firestore, sin Storage) ────

// Comprime imagen con Canvas y devuelve base64
function compressToBase64(file, maxPx = 900, quality = 0.75) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            let { width, height } = img;
            if (width > maxPx || height > maxPx) {
                if (width > height) { height = Math.round(height * maxPx / width); width = maxPx; }
                else { width = Math.round(width * maxPx / height); height = maxPx; }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width; canvas.height = height;
            canvas.getContext('2d').drawImage(img, 0, 0, width, height);
            URL.revokeObjectURL(url);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
        img.src = url;
    });
}

function handlePhotoSelect(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    // Aceptar hasta 10MB por archivo (se comprimirán)
    const valid = files.filter(f => f.size <= 10 * 1024 * 1024 && f.type.startsWith('image/'));
    if (valid.length < files.length)
        showToast(`${files.length - valid.length} archivo(s) ignorados (>10MB o no son imágenes)`, 'error');
    pendingPhotos = [...pendingPhotos, ...valid];
    renderPreviews();
}

function renderPreviews() {
    const grid = document.getElementById('photo-preview-grid');
    grid.innerHTML = '';
    pendingPhotos.forEach((file, i) => {
        const reader = new FileReader();
        reader.onload = e => {
            const item = document.createElement('div');
            item.className = 'photo-preview-item';
            item.innerHTML = `
                <img src="${e.target.result}" alt="foto">
                <button class="photo-remove" onclick="removePhoto(${i})"><i class="fas fa-times"></i></button>
            `;
            grid.appendChild(item);
        };
        reader.readAsDataURL(file);
    });
}

function removePhoto(index) {
    pendingPhotos.splice(index, 1);
    renderPreviews();
}

async function loadSessionPhotos() {
    generateSessionId();
    try {
        const snap = await db.collection('walking_v2_sessions')
            .doc(currentSessionId).collection('photos')
            .orderBy('uploadedAt').get();
        const card = document.getElementById('saved-photos-card');
        const grid = document.getElementById('saved-photos-grid');
        if (snap.empty) { card.style.display = 'none'; return; }
        card.style.display = 'block';
        grid.innerHTML = '';
        snap.forEach(doc => {
            const p = doc.data();
            const item = document.createElement('div');
            item.className = 'photo-preview-item';
            item.innerHTML = `<img src="${p.base64}" alt="foto" style="cursor:pointer;"
                onclick="openPhotoModal('${doc.id}')">`;
            grid.appendChild(item);
        });
    } catch (e) { console.log('No photos yet:', e.message); }
}

// Abrir foto en modal/ventana
function openPhotoModal(docId) {
    const imgs = document.querySelectorAll('#saved-photos-grid img');
    imgs.forEach(img => {
        if (img.closest('[data-id="' + docId + '"]')) {
            window.open(img.src, '_blank');
        }
    });
    // Fallback: abrir la primera seleccionada
    const clicked = event.target;
    if (clicked && clicked.src) {
        const w = window.open();
        w.document.write(`<img src="${clicked.src}" style="max-width:100%;height:auto;">`);
    }
}

// ──── REGISTER USER ────
async function registerUser() {
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const dept = document.getElementById('reg-dept').value.trim();

    if (!name || !email) {
        showToast('Nombre y correo son obligatorios', 'error'); return;
    }

    // Derivar contraseña = números al inicio del correo (ej: 715919@ibero → "715919")
    const emailUser = email.split('@')[0];
    const password = emailUser.replace(/\D/g, ''); // Solo dígitos

    if (password.length < 4) {
        showToast('El correo debe comenzar con al menos 4 dígitos (ej: 715919@iberopuebla.mx)', 'error'); return;
    }

    try {
        // Crear cuenta Firebase Auth con correo y contraseña numérica
        const cred = await firebase.auth().createUserWithEmailAndPassword(email, password);

        // Guardar perfil en Firestore
        await db.collection('walking_v2_users').doc(cred.user.uid).set({
            uid: cred.user.uid,
            name, email, department: dept,
            accountNumber: password, // guardamos para referencia
            totalSessions: 0, cumulativeKm: 0, cumulativeSteps: 0,
            cumulativeMinutes: 0, cumulativeCalories: 0,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        showToast(`✅ ${name} registrado. Contraseña de acceso: ${password}`);

        // Limpiar form
        document.getElementById('reg-name').value = '';
        document.getElementById('reg-email').value = '';
        document.getElementById('reg-dept').value = '';

        await loadEmployees();
    } catch (e) {
        console.error(e);
        if (e.code === 'auth/email-already-in-use') {
            showToast('Este correo ya está registrado', 'error');
        } else if (e.code === 'auth/weak-password') {
            showToast('La contraseña debe tener al menos 6 dígitos en el número de correo', 'error');
        } else {
            showToast('Error: ' + e.message, 'error');
        }
    }
}

// ──── LOAD USERS TABLE ────
async function loadUsers() {
    try {
        const snap = await db.collection('walking_v2_users').orderBy('name').get();
        const tbody = document.getElementById('users-tbody');
        if (snap.empty) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#64748b;">Sin usuarios registrados</td></tr>'; return; }
        tbody.innerHTML = '';
        snap.forEach(doc => {
            const u = doc.data();
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong style="color:#f1f5f9;">${u.name}</strong></td>
                <td><span class="badge badge-blue">${u.accountNumber || '-'}</span></td>
                <td style="font-size:0.8rem;">${u.email || '-'}</td>
                <td>${u.department || '-'}</td>
                <td><span class="badge badge-green">${u.totalSessions || 0}</span></td>
                <td>
                    <button class="btn btn-outline btn-sm" onclick="copyLoginInfo('${u.email}','${u.accountNumber}')">
                        <i class="fas fa-copy"></i> Copiar acceso
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error(e);
        showToast('Error al cargar usuarios: ' + e.message, 'error');
    }
}

function copyLoginInfo(email, account) {
    const text = `Acceso Caminatas IBERO Actívate:\nURL: ${window.location.origin}/employee/walking-v2-login.html\nCorreo: ${email}\nContraseña: ${account}`;
    navigator.clipboard.writeText(text).then(() => showToast('Info de acceso copiada al portapapeles'));
}

function filterUserTable() {
    const q = document.getElementById('search-users').value.toLowerCase();
    const rows = document.querySelectorAll('#users-tbody tr');
    rows.forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
}

// ──── LOAD HISTORY ────
async function loadHistory() {
    try {
        const snap = await db.collection('walking_v2_sessions').orderBy('date', 'desc').limit(30).get();
        const tbody = document.getElementById('history-tbody');

        // Banda 1: totales por sesión (promedios sumados)
        let totSessions = 0, totSteps = 0, totKm = 0, totCal = 0, totMins = 0;

        // Banda 2: impacto colectivo (stats × asistentes por sesión)
        let grpAttendees = 0, grpSteps = 0, grpKm = 0, grpCal = 0, grpMins = 0;

        if (snap.empty) {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:#64748b;">Sin sesiones registradas</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        snap.forEach(doc => {
            const s = doc.data();
            const st = s.stats || {};
            const attendees = s.totalAttendees || 0;

            // Banda 1
            totSessions++;
            totSteps += st.steps || 0;
            totKm += st.km || 0;
            totCal += st.calories || 0;
            totMins += st.duration || 0;

            // Banda 2: multiplicar stats por asistentes de cada sesión
            grpAttendees += attendees;
            grpSteps += (st.steps || 0) * attendees;
            grpKm += (st.km || 0) * attendees;
            grpCal += (st.calories || 0) * attendees;
            grpMins += (st.duration || 0) * attendees;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${formatDate(s.date)}</td>
                <td><span class="badge badge-blue">${s.type || '-'}</span></td>
                <td>${s.week ? 'Sem. ' + s.week : '-'}</td>
                <td>${attendees} / ${s.totalUsers || 0}</td>
                <td>${(st.steps || 0).toLocaleString()}</td>
                <td>${(st.km || 0).toFixed(1)} km</td>
                <td>${st.duration || 0} min</td>
                <td>${(st.calories || 0).toLocaleString()} kcal</td>
                <td style="display:flex; gap:0.4rem;">
                    <button class="btn btn-outline btn-sm" onclick="loadSessionDetails('${doc.id}')" title="Ver sesión">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteSession('${doc.id}')" title="Borrar sesión">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Actualizar Banda 1
        document.getElementById('ov-sessions').textContent = totSessions;
        document.getElementById('ov-steps').textContent = formatNum(Math.round(totSteps / totSessions || 0));
        document.getElementById('ov-km').textContent = totKm.toFixed(1);
        document.getElementById('ov-cal').textContent = formatNum(Math.round(totCal / totSessions || 0));
        document.getElementById('ov-mins').textContent = formatNum(Math.round(totMins / totSessions || 0));

        // Actualizar Banda 2 (colectivo)
        document.getElementById('ov-group-attendees').textContent = grpAttendees.toLocaleString();
        document.getElementById('ov-group-steps').textContent = formatNum(Math.round(grpSteps));
        document.getElementById('ov-group-km').textContent = grpKm.toFixed(1);
        document.getElementById('ov-group-cal').textContent = formatNum(Math.round(grpCal));
        document.getElementById('ov-group-mins').textContent = formatNum(Math.round(grpMins));

    } catch (e) {
        console.error(e);
        showToast('Error al cargar historial: ' + e.message, 'error');
    }
}

async function loadSessionDetails(sessionId) {
    showToast('Cargando sesión: ' + sessionId);
    const date = sessionId.split('_')[0];
    const type = sessionId.split('_').slice(1).join('_');
    document.getElementById('session-date').value = date;
    document.getElementById('session-type').value = type;
    generateSessionId();

    try {
        const attSnap = await db.collection('walking_v2_sessions').doc(sessionId).collection('attendance').get();
        attendanceMap = {};
        attSnap.forEach(doc => { attendanceMap[doc.id] = doc.data().present; });
        switchTab('asistencia');
    } catch (e) { console.error(e); }
}

// ──── DELETE SESSION ────
async function deleteSession(sessionId) {
    const confirmed = confirm(
        `⚠️ ¿Borrar la sesión "${sessionId}"?\n\nEsto eliminará:\n• La sesión y sus estadísticas\n• Todos los registros de asistencia\n• Todas las fotos guardadas\n\nEsta acción NO SE PUEDE deshacer.`
    );
    if (!confirmed) return;

    try {
        showToast('Borrando sesión...', 'success');
        const sessionRef = db.collection('walking_v2_sessions').doc(sessionId);

        // Borrar subcolección: attendance
        const attSnap = await sessionRef.collection('attendance').get();
        const batch1 = db.batch();
        attSnap.forEach(doc => batch1.delete(doc.ref));
        if (!attSnap.empty) await batch1.commit();

        // Borrar subcolección: photos
        const photoSnap = await sessionRef.collection('photos').get();
        const batch2 = db.batch();
        photoSnap.forEach(doc => batch2.delete(doc.ref));
        if (!photoSnap.empty) await batch2.commit();

        // Borrar documento principal
        await sessionRef.delete();

        showToast(`✅ Sesión "${sessionId}" eliminada`);
        loadHistory(); // refrescar tabla
    } catch (e) {
        console.error(e);
        showToast('Error al borrar: ' + e.message, 'error');
    }
}

function logout() {
    firebase.auth().signOut().then(() => window.location.href = 'login.html');
}

// ──── HELPERS ────
function formatDate(dateStr) {
    if (!dateStr) return '-';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
}
function formatNum(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return n.toString();
}
