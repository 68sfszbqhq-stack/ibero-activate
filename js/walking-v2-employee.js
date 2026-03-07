// ============================================================
// WALKING V2 - EMPLOYEE DASHBOARD JAVASCRIPT
// Historial personal, KPIs acumulativos y galería de fotos
// ============================================================

let currentUser = null;
let userProfile = null;
let allSessions = []; // todas las sesiones con asistencia del usuario
let stepsChart = null;

const QUOTES = [
    { q: '"Caminar es el mejor remedio para el hombre."', a: '— Hipócrates' },
    { q: '"Un paseo por la naturaleza nutre el alma."', a: '— Mary Davis' },
    { q: '"El movimiento es vida. La vida es movimiento."', a: '— Aristóteles' },
    { q: '"Cuida tu cuerpo. Es el único lugar que tienes para vivir."', a: '— Jim Rohn' },
    { q: '"Cada paso cuenta. Cada esfuerzo importa."', a: '— Programa IBERO Actívate' },
    { q: '"La salud es la mayor riqueza que puede poseer un ser humano."', a: '— Virgilio' },
];

// ──── INIT ────
firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) { window.location.href = 'walking-v2-login.html'; return; }
    currentUser = user;
    await loadUserProfile();
    await loadAllData();
    hideLoading();
    showRandomQuote();
});

function hideLoading() {
    const el = document.getElementById('loading-screen');
    if (el) el.style.display = 'none';
}
function showRandomQuote() {
    const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    document.getElementById('motivational-quote').textContent = q.q;
    document.getElementById('motivational-author').textContent = q.a;
}

// ──── LOAD USER PROFILE ────
async function loadUserProfile() {
    try {
        const snap = await db.collection('walking_v2_users')
            .where('email', '==', currentUser.email)
            .limit(1).get();

        if (snap.empty) {
            document.getElementById('hero-name').textContent = currentUser.displayName || currentUser.email;
            return;
        }
        const doc = snap.docs[0];
        userProfile = { id: doc.id, ...doc.data() };

        const initial = (userProfile.name || 'U').charAt(0).toUpperCase();
        document.getElementById('user-initial').textContent = initial;
        document.getElementById('user-display-name').textContent = userProfile.name;
        document.getElementById('user-display-dept').textContent = userProfile.department || '';
        document.getElementById('hero-name').textContent = userProfile.name;
        document.getElementById('hero-dept').textContent = userProfile.department || '';
    } catch (e) { console.error('Error loading profile:', e); }
}

// ──── LOAD ALL DATA ────
async function loadAllData() {
    await loadSessionHistory();
    await loadPhotos();
    updateKPIs();
}

// ──── LOAD SESSION HISTORY ────
// Carga todas las sesiones y verifica asistencia del usuario por su uid
async function loadSessionHistory() {
    if (!userProfile) return;
    try {
        const sessSnap = await db.collection('walking_v2_sessions')
            .orderBy('date', 'desc').limit(60).get();

        allSessions = [];

        // Para cada sesión verificar si el usuario tiene registro de asistencia
        // El doc de asistencia usa el uid como ID
        const userId = userProfile.id; // uid del usuario en walking_v2_users

        for (const sessDoc of sessSnap.docs) {
            const sessData = { id: sessDoc.id, ...sessDoc.data() };

            try {
                // Buscar el registro de asistencia por uid
                const attDoc = await db.collection('walking_v2_sessions')
                    .doc(sessDoc.id).collection('attendance').doc(userId).get();

                if (attDoc.exists) {
                    sessData.userAttended = attDoc.data().present === true;
                    sessData.attendanceName = attDoc.data().name || userProfile.name;
                } else {
                    // También buscar por nombre en caso de que el ID sea diferente
                    const attByName = await db.collection('walking_v2_sessions')
                        .doc(sessDoc.id).collection('attendance')
                        .where('name', '==', userProfile.name).limit(1).get();

                    if (!attByName.empty) {
                        sessData.userAttended = attByName.docs[0].data().present === true;
                    } else {
                        sessData.userAttended = null; // sin registro
                    }
                }
            } catch (e) {
                sessData.userAttended = null;
            }

            allSessions.push(sessData);
        }

        renderSessionList();
        renderStepsChart();
    } catch (e) { console.error('Error loading sessions:', e); }
}

// ──── RENDER SESSION LIST ────
function renderSessionList() {
    const container = document.getElementById('session-list');
    if (!container) return;

    if (!allSessions.length) {
        container.innerHTML = '<div style="text-align:center;color:#9CA3AF;padding:2rem;">No hay sesiones registradas aún.</div>';
        return;
    }

    container.innerHTML = allSessions.map(s => {
        const st = s.stats || {};
        const attended = s.userAttended === true;
        const absent = s.userAttended === false;
        const pending = s.userAttended === null;

        // Badge de asistencia
        const badge = attended
            ? '<span style="background:rgba(34,197,94,0.12);color:#34d399;padding:.2rem .6rem;border-radius:999px;font-size:.68rem;font-weight:600;">✅ Asististe</span>'
            : absent
                ? '<span style="background:rgba(248,113,113,0.12);color:#f87171;padding:.2rem .6rem;border-radius:999px;font-size:.68rem;font-weight:600;">❌ Ausente</span>'
                : '<span style="background:rgba(100,116,139,0.12);color:#9CA3AF;padding:.2rem .6rem;border-radius:999px;font-size:.68rem;font-weight:600;">— Sin registro</span>';

        // Stats — solo mostrar si asistió y hay datos
        const showStats = attended && (st.steps || st.km || st.duration || st.calories);
        const statsHtml = showStats ? `
            <div class="session-meta" style="margin-top:.6rem;">
                ${st.steps ? `<div class="session-stat"><div class="v">${(st.steps).toLocaleString()}</div><div class="l">Pasos</div></div>` : ''}
                ${st.km ? `<div class="session-stat"><div class="v">${st.km}</div><div class="l">Km</div></div>` : ''}
                ${st.duration ? `<div class="session-stat"><div class="v">${st.duration}</div><div class="l">Min</div></div>` : ''}
                ${st.calories ? `<div class="session-stat"><div class="v">${st.calories}</div><div class="l">Kcal</div></div>` : ''}
                ${st.weather ? `<div class="session-stat"><div class="v">${st.weather}</div><div class="l">Clima</div></div>` : ''}
            </div>` : '';

        // Borde de color según asistencia
        const borderColor = attended ? '#22c55e' : absent ? '#ef4444' : '#DDE1E9';

        return `
        <div class="session-item" style="border-left:3px solid ${borderColor}; padding-left:.75rem;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:.5rem;">
                <div>
                    <div class="session-date">${formatDate(s.date)} · ${formatType(s.type)}</div>
                    <div style="margin-top:.3rem;">${badge}</div>
                    ${s.week ? `<div style="font-size:.68rem;color:#9CA3AF;margin-top:.2rem;">Semana ${s.week}</div>` : ''}
                </div>
                <div class="attendance-dot ${attended ? 'att-present' : absent ? 'att-absent' : ''}"
                     style="${pending ? 'background:#DDE1E9;' : ''}"
                     title="${attended ? 'Presente' : absent ? 'Ausente' : 'Sin dato'}">
                </div>
            </div>
            ${statsHtml}
        </div>`;
    }).join('');
}

// ──── UPDATE KPIs ────
// Calcula KPIs directamente de allSessions (no depende de campos del perfil)
function updateKPIs() {
    const attended = allSessions.filter(s => s.userAttended === true);
    const withStats = attended.filter(s => s.stats);

    // Acumulados reales desde las sesiones
    const totalSteps = withStats.reduce((acc, s) => acc + (s.stats.steps || 0), 0);
    const totalKm = withStats.reduce((acc, s) => acc + (s.stats.km || 0), 0);
    const totalMins = withStats.reduce((acc, s) => acc + (s.stats.duration || 0), 0);
    const totalCal = withStats.reduce((acc, s) => acc + (s.stats.calories || 0), 0);
    const totalSessions = attended.length;
    const avgSteps = withStats.length > 0 ? Math.round(totalSteps / withStats.length) : 0;

    // Hero card
    animateNumber('total-steps', totalSteps);
    document.getElementById('steps-equiv').textContent =
        `Equivalente a ${totalKm.toFixed(1)} km recorridos | ${Math.round(totalCal)} calorías quemadas`;

    // KPIs
    animateNumber('kpi-sessions', totalSessions);
    document.getElementById('kpi-km').textContent = totalKm.toFixed(1);
    document.getElementById('kpi-minutes').textContent = formatNum(totalMins);
    animateNumber('kpi-calories', Math.round(totalCal));
    document.getElementById('kpi-avg-steps').textContent = formatNum(avgSteps);

    // % asistencia
    const totalWithRecord = allSessions.filter(s => s.userAttended !== null).length;
    const pct = totalWithRecord > 0 ? Math.round((totalSessions / totalWithRecord) * 100) : 0;
    document.getElementById('kpi-attendance-pct').textContent = pct + '%';

    // Racha
    const streak = computeStreak();
    document.getElementById('streak-count').textContent = streak;

    // Rings
    drawRing('attendance-ring', pct, '#C41230', '#1B3060');
    document.getElementById('attendance-ring-label').textContent = `${totalSessions} / ${allSessions.length} sesiones`;

    const stepsGoal = 10000;
    const stepsPct = Math.min(Math.round((avgSteps / stepsGoal) * 100), 100);
    drawRing('steps-ring', stepsPct, '#10b981', '#1B3060');
    document.getElementById('steps-ring-label').textContent = `${formatNum(avgSteps)} / ${formatNum(stepsGoal)} pasos`;
}

// ──── DOWNLOAD EMPLOYEE PERSONAL REPORT ────
function downloadEmployeeReport() {
    const attended = allSessions.filter(s => s.userAttended === true);
    if (!attended.length) { alert('No tienes sesiones asistidas registradas aún.'); return; }

    const name = userProfile?.name || 'Empleado';
    const dept = userProfile?.department || '';
    const now = new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const fmt = n => Math.round(n || 0).toLocaleString('es-MX');
    const fmtKm = n => Number(n || 0).toFixed(2);

    // Acumulados
    const totalSteps = attended.reduce((a, s) => a + (s.stats?.steps || 0), 0);
    const totalKm = attended.reduce((a, s) => a + (s.stats?.km || 0), 0);
    const totalMins = attended.reduce((a, s) => a + (s.stats?.duration || 0), 0);
    const totalCal = attended.reduce((a, s) => a + (s.stats?.calories || 0), 0);
    const totalSess = allSessions.filter(s => s.userAttended !== null).length;
    const pct = totalSess > 0 ? Math.round((attended.length / totalSess) * 100) : 0;

    // Tabla con todos las sesiones (presente y ausente) en orden cronológico
    const sorted = [...allSessions].reverse(); // más antigua primero
    let cumSteps = 0, cumKm = 0, cumMins = 0, cumCal = 0;
    let rows = '';

    sorted.forEach((s, i) => {
        const st = s.stats || {};
        const att = s.userAttended === true;
        const abs = s.userAttended === false;
        if (att) {
            cumSteps += st.steps || 0;
            cumKm += st.km || 0;
            cumMins += st.duration || 0;
            cumCal += st.calories || 0;
        }
        const typeMap = { matutina: '🌅 Matutina', vespertina: '🌇 Vespertina', especial: '⭐ Especial' };
        const statusTxt = att ? '✅ Presente' : abs ? '❌ Ausente' : '— Sin registro';
        const statusColor = att ? '#15803d' : abs ? '#b91c1c' : '#9CA3AF';
        const bg = i % 2 === 1 ? '#f8faff' : '#fff';

        rows += `<tr style="background:${bg};">
            <td style="font-weight:600;">${i + 1}</td>
            <td>${formatDate(s.date)}</td>
            <td>${typeMap[s.type] || s.type || '-'}</td>
            <td>${s.week ? 'Sem. ' + s.week : '-'}</td>
            <td style="color:${statusColor}; font-weight:600;">${statusTxt}</td>
            <td>${att ? fmt(st.steps || 0) : '-'}</td>
            <td>${att ? fmtKm(st.km || 0) + ' km' : '-'}</td>
            <td>${att ? (st.duration || 0) + ' min' : '-'}</td>
            <td>${att ? fmt(st.calories || 0) + ' kcal' : '-'}</td>
            <td style="background:#FFF0F2; font-weight:700; color:#C41230;">${att ? fmt(cumSteps) : '-'}</td>
            <td style="background:#FFF0F2; font-weight:700; color:#C41230;">${att ? fmtKm(cumKm) + ' km' : '-'}</td>
            <td style="background:#FFF0F2; font-weight:700; color:#C41230;">${att ? fmt(cumMins) + ' min' : '-'}</td>
            <td style="background:#FFF0F2; font-weight:700; color:#C41230;">${att ? fmt(cumCal) + ' kcal' : '-'}</td>
        </tr>`;
    });

    const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8">
<title>Mi Reporte de Caminatas — ${name}</title>
<style>
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:Arial,sans-serif; color:#1B3060; background:#fff; padding:2rem; }
  .header { border-bottom:3px solid #C41230; padding-bottom:1rem; margin-bottom:1.5rem;
            display:flex; justify-content:space-between; align-items:flex-start; }
  .header h1 { font-size:1.3rem; color:#C41230; font-weight:800; }
  .header .meta { font-size:.8rem; color:#9CA3AF; margin-top:.25rem; }
  .kpis { display:grid; grid-template-columns:repeat(5,1fr); gap:.65rem; margin-bottom:1.5rem; }
  .kpi { background:#FFF5F6; border:1px solid #FBBEC9; border-radius:8px;
          padding:.65rem; text-align:center; }
  .kpi .val { font-size:1.1rem; font-weight:800; color:#C41230; }
  .kpi .lbl { font-size:.6rem; color:#9CA3AF; text-transform:uppercase; margin-top:.2rem; }
  table { width:100%; border-collapse:collapse; font-size:.68rem; }
  th { background:#C41230; color:#fff; padding:.45rem .35rem; text-align:center;
       font-size:.6rem; text-transform:uppercase; letter-spacing:.04em; }
  td { padding:.4rem .35rem; text-align:center; border-bottom:1px solid #e2e8f0; }
  .cum-th { background:#C41230; }
  tfoot td { background:#1B3060 !important; color:#fff !important; font-weight:800; }
  .footer-note { margin-top:1.25rem; font-size:.7rem; color:#94a3b8; text-align:center; }
  @media print { button { display:none; } body { padding:.5rem; }
    table { font-size:.6rem; } th { font-size:.55rem; } }
</style></head><body>
  <div class="header">
    <div>
      <h1>🏃 Mi Reporte Personal de Caminatas</h1>
      <div class="meta"><b>${name}</b>${dept ? ' · ' + dept : ''}</div>
      <div class="meta">Generado: ${now} · Asistencia: <b>${attended.length}/${totalSess} sesiones (${pct}%)</b></div>
    </div>
    <div style="font-size:2rem;">🎓</div>
  </div>
  <div class="kpis">
    <div class="kpi"><div class="val">${attended.length}</div><div class="lbl">📅 Sesiones</div></div>
    <div class="kpi"><div class="val">${fmtKm(totalKm)}</div><div class="lbl">🛣️ Km Totales</div></div>
    <div class="kpi"><div class="val">${fmt(totalSteps)}</div><div class="lbl">👟 Pasos Acum.</div></div>
    <div class="kpi"><div class="val">${fmt(totalMins)}</div><div class="lbl">⏱️ Minutos</div></div>
    <div class="kpi"><div class="val">${fmt(totalCal)}</div><div class="lbl">🔥 Calorías</div></div>
  </div>
  <table>
    <thead>
      <tr>
        <th rowspan="2">#</th><th rowspan="2">Fecha</th><th rowspan="2">Tipo</th>
        <th rowspan="2">Sem.</th><th rowspan="2">Asistencia</th>
        <th colspan="4">Estadísticas de la Sesión</th>
        <th colspan="4" class="cum-th">▶ Acumulado Progresivo</th>
      </tr>
      <tr>
        <th>Pasos</th><th>Km</th><th>Durac.</th><th>Calorías</th>
        <th class="cum-th">Pasos Acum.</th><th class="cum-th">Km Acum.</th>
        <th class="cum-th">Min Acum.</th><th class="cum-th">Cal Acum.</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr>
        <td colspan="5">TOTALES FINALES</td>
        <td>${fmt(totalSteps)}</td><td>${fmtKm(totalKm)} km</td>
        <td>${fmt(totalMins)} min</td><td>${fmt(totalCal)} kcal</td>
        <td>${fmt(totalSteps)}</td><td>${fmtKm(totalKm)} km</td>
        <td>${fmt(totalMins)} min</td><td>${fmt(totalCal)} kcal</td>
      </tr>
    </tfoot>
  </table>
  <div class="footer-note">
    IBERO Actívate · Programa de Caminatas · pausas-activas-ibero-2026
  </div>
  <div style="margin-top:1.25rem; text-align:center;">
    <button onclick="window.print()" style="background:#C41230;color:#fff;border:none;
        padding:.6rem 1.5rem;border-radius:8px;cursor:pointer;font-size:.9rem;font-weight:700;">
      🖨️ Imprimir / Guardar PDF
    </button>
  </div>
</body></html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.focus();
}

// ──── STEPS CHART ────
function renderStepsChart() {
    const ctx = document.getElementById('steps-chart');
    if (!ctx) return;

    const attended = allSessions
        .filter(s => s.userAttended && s.stats?.steps)
        .slice().reverse(); // cronológico

    if (!attended.length) return;

    const labels = attended.map(s => `${formatDateShort(s.date)} ${formatTypeShort(s.type)}`);
    const data = attended.map(s => s.stats.steps || 0);

    if (stepsChart) stepsChart.destroy();
    stepsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Pasos',
                data,
                fill: true,
                backgroundColor: 'rgba(196,18,48,0.08)',
                borderColor: '#C41230',
                borderWidth: 2.5,
                pointBackgroundColor: '#E8394F',
                pointRadius: 4,
                tension: 0.4,
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: '#9CA3AF', font: { size: 10 } }, grid: { color: '#1B3060' } },
                y: { ticks: { color: '#9CA3AF', font: { size: 11 } }, grid: { color: '#DDE1E9' }, beginAtZero: true }
            }
        }
    });
}

// ──── DRAW RING ────
function drawRing(canvasId, pct, color, bg) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx2 = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const size = 100;
    canvas.width = size * dpr; canvas.height = size * dpr;
    canvas.style.width = size + 'px'; canvas.style.height = size + 'px';
    ctx2.scale(dpr, dpr);
    const cx = size / 2, cy = size / 2, r = 38, lw = 10;
    const angle = (pct / 100) * Math.PI * 2 - Math.PI / 2;
    ctx2.beginPath(); ctx2.arc(cx, cy, r, 0, Math.PI * 2);
    ctx2.strokeStyle = '#DDE1E9'; ctx2.lineWidth = lw; ctx2.lineCap = 'round'; ctx2.stroke();
    if (pct > 0) {
        ctx2.beginPath(); ctx2.arc(cx, cy, r, -Math.PI / 2, angle);
        ctx2.strokeStyle = color; ctx2.lineWidth = lw; ctx2.lineCap = 'round'; ctx2.stroke();
    }
    ctx2.fillStyle = '#f8fafc';
    ctx2.font = 'bold 16px Inter, sans-serif';
    ctx2.textAlign = 'center'; ctx2.textBaseline = 'middle';
    ctx2.fillText(pct + '%', cx, cy);
}

// ──── LOAD PHOTOS (desde subcolección photos/) ────
async function loadPhotos() {
    const galleryGrid = document.getElementById('gallery-grid');
    if (!galleryGrid) return;
    try {
        // Cargar sesiones recientes y luego sus fotos de la subcolección
        const sessSnap = await db.collection('walking_v2_sessions')
            .orderBy('date', 'desc').limit(15).get();

        const allPhotos = [];
        for (const sessDoc of sessSnap.docs) {
            const d = sessDoc.data();
            try {
                const photoSnap = await sessDoc.ref.collection('photos')
                    .orderBy('uploadedAt').get();
                photoSnap.forEach(pDoc => {
                    const p = pDoc.data();
                    if (p.base64) allPhotos.push({ base64: p.base64, date: d.date, name: p.name || '' });
                });
            } catch (e) { /* sesión sin fotos */ }
        }

        if (!allPhotos.length) {
            galleryGrid.innerHTML = '<div style="color:#9CA3AF;font-size:.85rem;padding:1rem;text-align:center;">No hay fotos registradas aún.</div>';
            return;
        }

        galleryGrid.innerHTML = allPhotos.map((p, i) => `
            <div class="gallery-item" onclick="openLightbox(${i})" data-idx="${i}">
                <img src="${p.base64}" alt="Caminata ${p.date}" loading="lazy">
                <div class="date-overlay">${formatDateShort(p.date)}</div>
            </div>
        `).join('');

        // Guardar para lightbox
        window._galleryPhotos = allPhotos;
    } catch (e) { console.error('Error loading photos:', e); }
}

// ──── LIGHTBOX ────
function openLightbox(idx) {
    const photos = window._galleryPhotos || [];
    const p = photos[idx];
    if (!p) return;
    const img = document.getElementById('lightbox-img');
    if (img) img.src = p.base64;
    document.getElementById('lightbox').classList.add('open');
}
function closeLightbox() {
    document.getElementById('lightbox').classList.remove('open');
    const img = document.getElementById('lightbox-img');
    if (img) img.src = '';
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

// ──── COMPUTE STREAK ────
function computeStreak() {
    const attended = allSessions.filter(s => s.userAttended === true);
    if (!attended.length) return 0;
    const sorted = [...attended].sort((a, b) => b.date.localeCompare(a.date));
    let streak = 1;
    for (let i = 1; i < sorted.length; i++) {
        const curr = new Date(sorted[i - 1].date);
        const prev = new Date(sorted[i].date);
        const diff = (curr - prev) / (1000 * 60 * 60 * 24);
        if (diff <= 7) streak++;
        else break;
    }
    return streak;
}

// ──── LOGOUT ────
function doLogout() {
    firebase.auth().signOut().then(() => window.location.href = 'walking-v2-login.html');
}

// ──── HELPERS ────
function formatDate(dateStr) {
    if (!dateStr) return '-';
    const [y, m, d] = dateStr.split('-');
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${d} ${months[parseInt(m, 10) - 1]} ${y}`;
}
function formatDateShort(dateStr) {
    if (!dateStr) return '';
    const [, m, d] = dateStr.split('-');
    return `${d}/${m}`;
}
function formatType(type) {
    const map = { matutina: '🌅 Matutina 8AM', vespertina: '🌇 Vespertina 5PM', especial: '⭐ Especial' };
    return map[type] || type || '';
}
function formatTypeShort(type) {
    const map = { matutina: '🌅', vespertina: '🌇', especial: '⭐' };
    return map[type] || '';
}
function formatNum(n) {
    n = Math.round(n || 0);
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return n.toString();
}
function animateNumber(id, target) {
    const el = document.getElementById(id);
    if (!el) return;
    const duration = 1200;
    const start = performance.now();
    const from = parseInt(el.textContent.replace(/[^0-9]/g, '')) || 0;
    function step(now) {
        const p = Math.min((now - start) / duration, 1);
        const ease = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
        el.textContent = Math.round(from + (target - from) * ease).toLocaleString();
        if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}
