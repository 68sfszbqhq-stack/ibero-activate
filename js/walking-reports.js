// Lógica de Reportes - CAMINATAS
// Visualización de walking_stats (Registros GPS) y walking_live_responses (Feedbacks)

document.addEventListener('DOMContentLoaded', () => {
    // Verificar Auth
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.href = 'login.html';
        } else {
            console.log("Admin autenticado. Cargando reportes...");
            loadStats();
            loadFeedbacks();
        }
    });

    // Logout function
    window.logout = function () {
        auth.signOut().then(() => {
            window.location.href = 'login.html';
        });
    };
});

async function loadStats() {
    const tableBody = document.getElementById('walking-stats-body');
    if (!tableBody) return;

    try {
        const snapshot = await db.collection('walking_stats')
            .orderBy('timestamp', 'desc')
            .limit(50)
            .get();

        tableBody.innerHTML = '';
        if (snapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2rem; color:#9ca3af;">No hay caminatas registradas</td></tr>';
            return;
        }

        snapshot.forEach(doc => {
            const data = doc.data();
            const perf = data.tech_values?.performance || {};
            const ts = data.timestamp ? new Date(data.timestamp.seconds * 1000) : new Date(data.date);

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="padding:12px; border-bottom:1px solid #f3f4f6;">
                    <div style="font-weight:700; color:#1f2937;">${data.collaboratorEmail || 'Anónimo'}</div>
                    <small style="color:#6b7280; font-family:monospace;">ID: ${data.employeeId}</small>
                </td>
                <td style="padding:12px; border-bottom:1px solid #f3f4f6; color:#4b5563;">
                    ${ts.toLocaleDateString()}<br><small>${ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                </td>
                <td style="padding:12px; border-bottom:1px solid #f3f4f6;">
                    <span style="background:#f0fdf4; color:#10b981; font-weight:800; padding:4px 8px; border-radius:6px;">${perf.distance_km || 0.00} km</span>
                </td>
                <td style="padding:12px; border-bottom:1px solid #f3f4f6; color:#4b5563; font-weight:600;">${perf.steps || 0}</td>
                <td style="padding:12px; border-bottom:1px solid #f3f4f6; color:#6b7280;">${perf.duration_total_min || 0} min</td>
                <td style="padding:12px; border-bottom:1px solid #f3f4f6; text-align:right;">
                    <button onclick="viewDetail('${doc.id}')" class="btn-secondary" style="padding:4px 10px; font-size:0.75rem;">Detalles</button>
                </td>
            `;
            tableBody.appendChild(tr);
        });

    } catch (error) {
        console.error("Error al cargar stats:", error);
        tableBody.innerHTML = '<tr><td colspan="6" style="color:red; text-align:center;">Error al cargar datos</td></tr>';
    }
}

async function loadFeedbacks() {
    const feedbackBody = document.getElementById('walking-feedbacks-body');
    if (!feedbackBody) return;

    try {
        const snapshot = await db.collection('walking_live_responses')
            .orderBy('timestamp', 'desc')
            .limit(30)
            .get();

        feedbackBody.innerHTML = '';
        if (snapshot.empty) {
            feedbackBody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:2rem; color:#9ca3af;">No hay reflexiones recientes</td></tr>';
            return;
        }

        snapshot.forEach(doc => {
            const data = doc.data();
            const ts = data.timestamp ? new Date(data.timestamp.seconds * 1000) : new Date();

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="padding:12px; border-bottom:1px solid #f3f4f6;">
                    <div style="font-weight:700;">${data.employeeName || 'Caminante'}</div>
                    <small style="color:#9ca3af;">${ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                </td>
                <td style="padding:12px; border-bottom:1px solid #f3f4f6; font-size:0.85rem; color:#4b5563;">${data.question || 'Reflexión libre'}</td>
                <td style="padding:12px; border-bottom:1px solid #f3f4f6;">
                    <div style="background:#eff6ff; border-left:3px solid #3b82f6; padding:8px 12px; border-radius:4px; font-size:0.9rem; color:#1e40af; font-style:italic;">
                        "${data.response || '---'}"
                    </div>
                </td>
            `;
            feedbackBody.appendChild(tr);
        });

    } catch (error) {
        console.error("Error al cargar feedbacks:", error);
    }
}

window.viewDetail = async (docId) => {
    try {
        const doc = await db.collection('walking_stats').doc(docId).get();
        if (!doc.exists) return;
        const d = doc.data();
        const tech = d.tech_values || {};

        alert(`DETALLES DE SESIÓN\n\n` +
            `Caminante: ${d.collaboratorEmail}\n` +
            `Fecha: ${d.date}\n` +
            `Distancia: ${tech.performance?.distance_km} km\n` +
            `Pasos: ${tech.performance?.steps}\n` +
            `Cadencia: ${tech.performance?.cadence_zpm} ppm\n` +
            `Escala Borg: ${tech.perception?.borg_scale}/10\n` +
            `Gratitud: ${tech.mindful?.gratitude_log || 'N/A'}`);
    } catch (e) { console.error(e); }
};

window.exportCSV = async (type) => {
    try {
        const collection = type === 'stats' ? 'walking_stats' : 'walking_live_responses';
        const snapshot = await db.collection(collection).orderBy('timestamp', 'desc').get();

        if (snapshot.empty) return alert("No hay datos para exportar");

        let csv = "";
        if (type === 'stats') {
            csv = "\uFEFFFecha,Email,EmpleadoId,Distancia_KM,Pasos,Duracion_Min,Borg,Gratitud\n";
            snapshot.forEach(doc => {
                const d = doc.data();
                const p = d.tech_values?.performance || {};
                const m = d.tech_values?.mindful || {};
                const date = d.timestamp ? new Date(d.timestamp.seconds * 1000).toLocaleString() : d.date;
                csv += `"${date}","${d.collaboratorEmail}","${d.employeeId}","${p.distance_km || 0}","${p.steps || 0}","${p.duration_total_min || 0}","${d.tech_values?.perception?.borg_scale || 0}","${(m.gratitude_log || '').replace(/"/g, '""')}"\n`;
            });
        } else {
            csv = "\uFEFFFecha,Empleado,Pregunta,Respuesta\n";
            snapshot.forEach(doc => {
                const d = doc.data();
                const date = d.timestamp ? new Date(d.timestamp.seconds * 1000).toLocaleString() : '';
                csv += `"${date}","${d.employeeName || 'Anónimo'}","${(d.question || '').replace(/"/g, '""')}","${(d.response || '').replace(/"/g, '""')}"\n`;
            });
        }

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `reporte_caminatas_${type}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    } catch (e) { alert("Error: " + e.message); }
};
