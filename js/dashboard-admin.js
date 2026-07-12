// Lógica del Dashboard Admin con Análisis Real

document.addEventListener('DOMContentLoaded', () => {
    // Elementos DOM
    const totalAttendancesEl = document.getElementById('total-attendances');
    const avgRatingEl = document.getElementById('avg-rating');
    const activeAreasEl = document.getElementById('active-areas');
    const feedbackRateEl = document.getElementById('feedback-rate');
    const leaderboardTable = document.getElementById('leaderboard-table').querySelector('tbody');

    // Metas configurables
    const GOALS = {
        attendances: 400,  // Meta mensual
        rating: 4.0,       // Rating mínimo deseado
        areas: 10,         // Total de áreas que existen
        feedbackRate: 90   // Porcentaje de feedback deseado
    };

    // Data global para modales
    let globalData = {};

    // Instancias de Chart.js (para destruirlas antes de re-renderizar).
    const chartInstances = {};

    // Control de recargas: debounce (colapsa ráfagas de eventos en una sola
    // recarga) y token de generación (evita que renders concurrentes se
    // entrecrucen, p. ej. en el leaderboard asíncrono).
    let reloadTimer = null;
    let loadGeneration = 0;
    function scheduleReload() {
        clearTimeout(reloadTimer);
        reloadTimer = setTimeout(() => loadDashboardData(), 500);
    }

    // Periodo (temporada) seleccionado en el dashboard. '__all__' = todos.
    let dashPeriods = [];
    let dashSelectedPeriodId = null;

    const periodSelect = document.getElementById('period-select');

    // Rellena el dropdown con los periodos reales + "Todos".
    async function setupDashboardPeriodSelect() {
        if (!window.Periods) return;
        dashPeriods = await window.Periods.getAllPeriods();
        const active = await window.Periods.getActivePeriod();
        const saved = localStorage.getItem('dashboardPeriodId');
        dashSelectedPeriodId = saved || (active ? active.id : '__all__');

        if (periodSelect) {
            periodSelect.innerHTML = '';
            dashPeriods.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.id;
                opt.textContent = (p.name || 'Periodo') + (p.isActive ? ' (Activo)' : '');
                periodSelect.appendChild(opt);
            });
            const optAll = document.createElement('option');
            optAll.value = '__all__';
            optAll.textContent = 'General (Todos los periodos)';
            periodSelect.appendChild(optAll);
            periodSelect.value = dashSelectedPeriodId;

            periodSelect.addEventListener('change', (e) => {
                dashSelectedPeriodId = e.target.value;
                localStorage.setItem('dashboardPeriodId', dashSelectedPeriodId);
                loadDashboardData();
                loadProgramSummary();
            });
        }
    }

    // Muestra el badge del periodo activo en el encabezado del dashboard.
    function renderDashboardPeriodBadge(period) {
        const badge = document.getElementById('dashboard-period-badge');
        if (!badge) return;
        if (!period) {
            badge.textContent = 'Todos los periodos';
            badge.style.background = '#f3f4f6';
            badge.style.color = '#6b7280';
            return;
        }
        const meta = window.Periods.seasonMeta(period.season);
        badge.innerHTML = `<i class="fa-solid ${meta.icon}"></i> ${period.name}`;
        badge.style.background = meta.color + '22';
        badge.style.color = meta.color;
    }

    // Inicializar
    setupDashboardPeriodSelect().then(() => {
        loadDashboardData();
        loadProgramSummary(); // Program Periodization
    });
    setupDetailButtons();
    setupModalClose();
    setupRealtimeListeners(); // NEW: Real-time updates

    async function loadDashboardData() {
        // Token de esta ejecución: si empieza otra recarga, las tareas async
        // de ésta (p. ej. el leaderboard) se abortan para no entrecruzarse.
        const myGen = ++loadGeneration;
        try {
            // 0. Cargar Mapa de Áreas (ID → Nombre)
            const areasMap = {};
            const areasSnapshot = await db.collection('areas').get();
            areasSnapshot.forEach(doc => {
                areasMap[doc.id] = doc.data().name;
            });

            // 1. Cargar todos los empleados para iterar sus subcollections
            const employeesSnapshot = await db.collection('employees').get();

            // Conteo de empleados por área (denominador para la tasa por área).
            const areaEmployeeCounts = {};
            employeesSnapshot.forEach(d => {
                const a = d.data().areaId;
                if (a) areaEmployeeCounts[a] = (areaEmployeeCounts[a] || 0) + 1;
            });

            let totalAttendances = 0;
            let totalRating = 0;
            let feedbackCount = 0;
            const areasSet = new Set();
            const allAttendances = [];
            const allFeedbacks = [];

            // Periodo (temporada) seleccionado: el dashboard muestra SOLO sus
            // datos para que las temporadas no se entrecrucen. '__all__' = todos.
            const dashPeriod = (dashSelectedPeriodId && dashSelectedPeriodId !== '__all__')
                ? (dashPeriods.find(p => p.id === dashSelectedPeriodId) || null)
                : null;
            const periodIdFilter = dashPeriod ? dashPeriod.id : null;
            const periodStart = dashPeriod ? dashPeriod.startDate : null;
            const periodEnd = dashPeriod ? dashPeriod.endDate : null;
            renderDashboardPeriodBadge(dashPeriod);

            // ¿La asistencia entra en el periodo activo? Prefiere periodId;
            // si el doc aún no está migrado, cae al rango de fechas del periodo.
            const attInPeriod = (data) => {
                if (!periodIdFilter) return true; // sin periodo: mostrar todo
                if (data.periodId) return data.periodId === periodIdFilter;
                if (periodStart) return data.date >= periodStart && (!periodEnd || data.date <= periodEnd);
                return true;
            };

            // Mapa empId -> nombre (para adjuntar nombre a asistencias/feedback
            // que no lo traigan en el documento).
            const empNameById = {};
            employeesSnapshot.forEach(d => { empNameById[d.id] = d.data().fullName || 'Desconocido'; });

            // ============================================================
            // OPTIMIZACIÓN (Fase 4): en lugar de leer la subcolección de CADA
            // empleado (N+1 lecturas), se hacen 2 consultas fijas:
            //   1) Asistencias de la colección top-level `attendances`,
            //      filtrada por periodId (misma fuente que los Reportes → los
            //      números coinciden). Evita además contaminación con el módulo
            //      de Caminatas (que usa otra subcolección llamada 'attendance').
            //   2) Todo el feedback vía collectionGroup('feedback') en una sola
            //      consulta. Escala sin importar el número de empleados.
            // ============================================================
            let attQuery = db.collection('attendances');
            if (periodIdFilter) attQuery = attQuery.where('periodId', '==', periodIdFilter);

            const [attSnapshot, fbSnapshot] = await Promise.all([
                attQuery.get(),
                db.collectionGroup('feedback').get()
            ]);

            // 1) Asistencias
            attSnapshot.forEach(doc => {
                const data = doc.data();
                if (!attInPeriod(data)) return; // salvaguarda (docs sin periodId)
                if (data.areaId) areasSet.add(data.areaId);
                const empId = data.employeeId || (doc.ref.parent.parent && doc.ref.parent.parent.id);
                allAttendances.push({
                    id: doc.id, ...data, employeeId: empId,
                    employeeName: data.employeeName || empNameById[empId] || 'Desconocido'
                });
            });
            totalAttendances = allAttendances.length;

            // 2) Feedback (una sola consulta; se filtra por rango de fechas del
            //    periodo, ya que el feedback no lleva periodId).
            fbSnapshot.forEach(doc => {
                const data = doc.data();
                if (typeof data.rating !== 'number') return; // ignora docs que no sean feedback válido
                const empId = data.employeeId || (doc.ref.parent.parent && doc.ref.parent.parent.id);

                let fbDateStr = data.date;
                if (!fbDateStr && data.timestamp && data.timestamp.toDate) {
                    fbDateStr = data.timestamp.toDate().toISOString().split('T')[0];
                }
                if (!fbDateStr) {
                    fbDateStr = data.createdAt ? new Date(data.createdAt).toISOString().split('T')[0] : '';
                }
                if (periodStart && fbDateStr && (fbDateStr < periodStart || (periodEnd && fbDateStr > periodEnd))) {
                    return; // fuera del periodo
                }
                totalRating += data.rating || 0;
                feedbackCount++;
                allFeedbacks.push({
                    id: doc.id, ...data, employeeId: empId,
                    employeeName: empNameById[empId] || 'Desconocido'
                });
            });

            // Guardar datos globales para modales
            globalData = {
                allAttendances,
                allFeedbacks,
                areasMap,
                totalAttendances,
                totalRating,
                feedbackCount,
                areasSet
            };

            // Mostrar valores principales
            totalAttendancesEl.textContent = totalAttendances;

            // Calcular Rating Promedio
            const avgRating = feedbackCount > 0
                ? (totalRating / feedbackCount).toFixed(1)
                : '0.0';
            avgRatingEl.textContent = `${avgRating} ⭐`;

            // Calcular Tasa de Feedback
            const feedbackRate = totalAttendances > 0
                ? Math.round((feedbackCount / totalAttendances) * 100)
                : 0;
            feedbackRateEl.textContent = `${feedbackRate}%`;

            // Áreas Activas
            activeAreasEl.textContent = areasSet.size;

            // Calcular cambios de últimos 7 vs anteriores 7 días
            calculateAndDisplayChanges(allAttendances, allFeedbacks, totalAttendances, avgRating, areasSet.size, feedbackRate);

            // Crear sparklines
            createSparklines(allAttendances, allFeedbacks);

            // Calcular progreso hacia metas
            calculateProgress(totalAttendances, avgRating, areasSet.size, feedbackRate);

            // 4. Generar Gráficas (pasamos arrays con datos agregados)
            renderCharts(allAttendances, areasMap, areaEmployeeCounts, dashPeriod);

            // 5. Generar Leaderboard (con el token de esta ejecución)
            generateLeaderboard(allAttendances, allFeedbacks, areasMap, myGen);

            // 6. Cargar conteo de actividades
            const activitiesSnapshot = await db.collection('activities').get();
            const activitiesCountEl = document.getElementById('total-activities-count');
            if (activitiesCountEl) {
                activitiesCountEl.textContent = activitiesSnapshot.size;
            }

        } catch (error) {
            console.error('Error cargando dashboard:', error);
        }
    }

    // Setup real-time listeners for automatic updates.
    // IMPORTANTE: antes se creaban 2 listeners POR CADA empleado (cientos en
    // total), que se disparaban todos a la vez al cargar y provocaban una
    // tormenta de recargas concurrentes (el leaderboard se duplicaba). Ahora
    // se usan 2 listeners top-level + debounce → una sola recarga por ráfaga.
    function setupRealtimeListeners() {
        console.log('🔄 Configurando listeners en tiempo real...');

        db.collection('attendances').onSnapshot(() => {
            scheduleReload();
        }, error => console.error('Error en listener de asistencias:', error));

        db.collectionGroup('feedback').onSnapshot(() => {
            scheduleReload();
        }, error => console.error('Error en listener de feedback:', error));
    }

    function calculateAndDisplayChanges(attendances, feedbacks, totalAtt, avgRating, activeAreas, feedbackRate) {
        const now = new Date();

        // Separar datos en períodos de 7 días
        const last7Days = [];
        const previous7Days = [];
        const last7Feedbacks = [];
        const previous7Feedbacks = [];

        attendances.forEach(att => {
            const attDate = new Date(att.date);
            const daysAgo = Math.floor((now - attDate) / (1000 * 60 * 60 * 24));

            if (daysAgo <= 7) {
                last7Days.push(att);
            } else if (daysAgo > 7 && daysAgo <= 14) {
                previous7Days.push(att);
            }
        });

        feedbacks.forEach(fb => {
            const fbDate = fb.timestamp ? fb.timestamp.toDate() : new Date(fb.date);
            const daysAgo = Math.floor((now - fbDate) / (1000 * 60 * 60 * 24));

            if (daysAgo <= 7) {
                last7Feedbacks.push(fb);
            } else if (daysAgo > 7 && daysAgo <= 14) {
                previous7Feedbacks.push(fb);
            }
        });

        // Calcular cambios
        const attChange = previous7Days.length > 0
            ? ((last7Days.length - previous7Days.length) / previous7Days.length) * 100
            : null;

        const lastRating = last7Feedbacks.length > 0
            ? last7Feedbacks.reduce((sum, fb) => sum + (fb.rating || 0), 0) / last7Feedbacks.length
            : 0;
        const prevRating = previous7Feedbacks.length > 0
            ? previous7Feedbacks.reduce((sum, fb) => sum + (fb.rating || 0), 0) / previous7Feedbacks.length
            : 0;
        const ratingChange = prevRating > 0
            ? ((lastRating - prevRating) / prevRating) * 100
            : null;

        // Áreas - contar áreas únicas en cada período
        const last7Areas = new Set(last7Days.map(a => a.areaId).filter(Boolean));
        const prev7Areas = new Set(previous7Days.map(a => a.areaId).filter(Boolean));
        const areasChange = prev7Areas.size > 0
            ? ((last7Areas.size - prev7Areas.size) / prev7Areas.size) * 100
            : null;

        // Feedback rate
        const lastFeedbackRate = last7Days.length > 0
            ? (last7Feedbacks.length / last7Days.length) * 100
            : 0;
        const prevFeedbackRate = previous7Days.length > 0
            ? (previous7Feedbacks.length / previous7Days.length) * 100
            : 0;
        const feedbackRateChange = prevFeedbackRate > 0
            ? ((lastFeedbackRate - prevFeedbackRate) / prevFeedbackRate) * 100
            : null;

        // Mostrar cambios
        displayChange('attendances-change', attChange, last7Days.length, previous7Days.length);
        displayChange('rating-change', ratingChange, lastRating, prevRating);
        displayChange('areas-change', areasChange, last7Areas.size, prev7Areas.size);
        displayChange('feedback-change', feedbackRateChange, lastFeedbackRate, prevFeedbackRate);
    }

    function displayChange(elementId, change, currentValue, previousValue) {
        const element = document.getElementById(elementId);
        if (!element) return;

        if (change === null || previousValue === 0) {
            element.innerHTML = `<i class="fa-solid fa-chart-line"></i> Últimos 7 días: datos insuficientes`;
            element.style.background = '#f3f4f6';
            element.style.color = '#6b7280';
            return;
        }

        const arrow = change >= 0 ? '↑' : '↓';
        const isGood = change >= 0; 
        const bgColor = isGood ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
        const textColor = isGood ? '#10b981' : '#ef4444';
        const absChange = Math.abs(change).toFixed(1);

        element.innerHTML = `${arrow} ${absChange}% vs 7 d. previos`;
        element.style.background = bgColor;
        element.style.color = textColor;
        element.style.border = 'none';
        element.style.display = 'inline-block';
        element.style.padding = '4px 8px';
        element.style.borderRadius = '6px';
        element.style.fontSize = '0.8rem';
        element.style.fontWeight = '600';
    }

    function createSparklines(attendances, feedbacks) {
        const now = new Date();

        // Preparar datos de últimos 7 días
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            last7Days.push(date);
        }

        // Contar asistencias por día
        const attByDay = last7Days.map(date => {
            return attendances.filter(att => {
                const attDate = new Date(att.date);
                attDate.setHours(0, 0, 0, 0);
                return attDate.getTime() === date.getTime();
            }).length;
        });

        // Ratings promedio por día
        const ratingByDay = last7Days.map(date => {
            const dayFeedbacks = feedbacks.filter(fb => {
                const fbDate = fb.timestamp ? fb.timestamp.toDate() : new Date(fb.date);
                fbDate.setHours(0, 0, 0, 0);
                return fbDate.getTime() === date.getTime();
            });
            if (dayFeedbacks.length === 0) return 0;
            return dayFeedbacks.reduce((sum, fb) => sum + (fb.rating || 0), 0) / dayFeedbacks.length;
        });

        // Áreas activas por día
        const areasByDay = last7Days.map(date => {
            const dayAtts = attendances.filter(att => {
                const attDate = new Date(att.date);
                attDate.setHours(0, 0, 0, 0);
                return attDate.getTime() === date.getTime();
            });
            return new Set(dayAtts.map(a => a.areaId).filter(Boolean)).size;
        });

        // Tasa de feedback por día
        const feedbackRateByDay = last7Days.map(date => {
            const dayAtts = attendances.filter(att => {
                const attDate = new Date(att.date);
                attDate.setHours(0, 0, 0, 0);
                return attDate.getTime() === date.getTime();
            });
            const dayFeedbacks = feedbacks.filter(fb => {
                const fbDate = fb.timestamp ? fb.timestamp.toDate() : new Date(fb.date);
                fbDate.setHours(0, 0, 0, 0);
                return fbDate.getTime() === date.getTime();
            });
            return dayAtts.length > 0 ? (dayFeedbacks.length / dayAtts.length) * 100 : 0;
        });

        // Crear sparklines
        createSparkline('attendances-sparkline', attByDay, '#667eea');
        createSparkline('rating-sparkline', ratingByDay, '#f59e0b');
        createSparkline('areas-sparkline', areasByDay, '#8b5cf6');
        createSparkline('feedback-sparkline', feedbackRateByDay, '#10b981');
    }

    function createSparkline(canvasId, data, color) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['', '', '', '', '', '', ''],
                datasets: [{
                    data: data,
                    borderColor: color,
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 0,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { display: false },
                    y: { display: false }
                }
            }
        });
    }

    function calculateProgress(totalAtt, avgRating, activeAreas, feedbackRate) {
        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const currentDay = now.getDate();

        const expectedMonthProgress = (currentDay / daysInMonth) * 100;

        // Asistencias
        updateProgressBar('attendances', totalAtt, GOALS.attendances, expectedMonthProgress, 'asist.', false);

        // Rating
        updateProgressBar('rating', parseFloat(avgRating), GOALS.rating, 100, '⭐', true);

        // Áreas
        updateProgressBar('areas', activeAreas, GOALS.areas, 100, 'áreas', true);

        // Feedback Rate
        updateProgressBar('feedback', feedbackRate, GOALS.feedbackRate, 100, '%', true);
    }

    function updateProgressBar(metric, currentValue, goalValue, expectedProgress, unitFormat, isStatic) {
        const progressFill = document.getElementById(`${metric}-progress`);
        const goalInfo = document.getElementById(`${metric}-goal-info`);
        const statusChip = document.getElementById(`${metric}-status-chip`);
        const overageEl = document.getElementById(`${metric}-overage`);

        if (!progressFill || !goalInfo || !statusChip) return;

        let percentage = (currentValue / goalValue) * 100;
        let overagePercentage = 0;

        if (percentage > 100) {
            overagePercentage = percentage - 100;
            percentage = 100;
        }

        progressFill.style.width = `${percentage}%`;

        let displayCurrent = currentValue;
        if (unitFormat === '⭐') displayCurrent = displayCurrent.toFixed(1);
        else if (unitFormat === '%') displayCurrent = Math.round(displayCurrent);

        let displayGoal = (unitFormat === '⭐') ? goalValue.toFixed(1) : goalValue;

        goalInfo.textContent = `${displayCurrent} / ${displayGoal} ${unitFormat}`;

        if (overageEl) {
            if (overagePercentage > 0) {
                overageEl.innerHTML = `+${Math.round(overagePercentage)}% sobre meta`;
                overageEl.style.display = 'block';
            } else {
                overageEl.style.display = 'none';
            }
        }

        let statusText = '';
        let statusColor = '';
        const actualPercentForStatus = (currentValue / goalValue) * 100;

        if (!isStatic) {
            if (actualPercentForStatus >= expectedProgress) {
                statusText = 'En meta';
                statusColor = '#10b981';
            } else if (actualPercentForStatus >= expectedProgress * 0.7) {
                statusText = 'Atención';
                statusColor = '#f59e0b';
            } else {
                statusText = 'Crítico';
                statusColor = '#ef4444';
            }
        } else {
            if (actualPercentForStatus >= 100) {
                statusText = 'En meta';
                statusColor = '#10b981';
            } else if (actualPercentForStatus >= 70) {
                statusText = 'Atención';
                statusColor = '#f59e0b';
            } else {
                statusText = 'Crítico';
                statusColor = '#ef4444';
            }
        }

        statusChip.textContent = statusText;
        statusChip.style.color = statusColor;
        progressFill.style.background = statusColor;
    }

    // Setup detail buttons
    function setupDetailButtons() {
        const detailButtons = document.querySelectorAll('.btn-detail');
        detailButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const metric = e.currentTarget.dataset.metric;
                showDetailedAnalysis(metric);
            });
        });
    }

    function showDetailedAnalysis(metric) {
        const modal = document.getElementById('analysis-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');

        let content = '';
        let title = '';

        switch (metric) {
            case 'attendances':
                title = '📊 Análisis de Asistencias';
                content = generateAttendanceAnalysis();
                break;
            case 'rating':
                title = '⭐ Análisis de Calificaciones';
                content = generateRatingAnalysis();
                break;
            case 'areas':
                title = '🏢 Análisis por Áreas';
                content = generateAreasAnalysis();
                break;
            case 'feedback':
                title = '💬 Análisis de Feedback';
                content = generateFeedbackAnalysis();
                break;
        }

        modalTitle.textContent = title;
        modalBody.innerHTML = content;
        modal.classList.add('show');

        // Render charts in modal if needed
        setTimeout(() => {
            if (metric === 'attendances') renderModalAttendanceChart();
            if (metric === 'rating') renderModalRatingChart();
            if (metric === 'areas') renderModalAreasChart();
        }, 100);
    }

    function generateAttendanceAnalysis() {
        const { allAttendances, areasMap } = globalData;

        // Top 5 empleados
        const empStats = {};
        allAttendances.forEach(att => {
            empStats[att.employeeId] = empStats[att.employeeId] || { name: att.employeeName, count: 0 };
            empStats[att.employeeId].count++;
        });
        const topEmployees = Object.values(empStats).sort((a, b) => b.count - a.count).slice(0, 5);

        // Por área
        const byArea = {};
        allAttendances.forEach(att => {
            const area = areasMap[att.areaId] || 'Desconocida';
            byArea[area] = (byArea[area] || 0) + 1;
        });

        return `
            <div class="modal-section">
                <h3>📈 Tendencia de Asistencias (30 días)</h3>
                <div class="modal-chart-container">
                    <canvas id="modal-attendance-chart" style="height: 250px;"></canvas>
                </div>
            </div>

            <div class="modal-section">
                <h3>🏆 Top 5 Empleados Más Activos</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="border-bottom: 2px solid #f3f4f6;">
                            <th style="padding: 0.75rem; text-align: left;">#</th>
                            <th style="padding: 0.75rem; text-align: left;">Nombre</th>
                            <th style="padding: 0.75rem; text-align: right;">Asistencias</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${topEmployees.map((emp, i) => `
                            <tr style="border-bottom: 1px solid #f3f4f6;">
                                <td style="padding: 0.75rem;">${i + 1}</td>
                                <td style="padding: 0.75rem; font-weight: 500;">${emp.name}</td>
                                <td style="padding: 0.75rem; text-align: right; color: var(--primary); font-weight: 700;">${emp.count}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="modal-section">
                <h3>🏢 Distribución por Área</h3>
                <div class="insight-grid">
                    ${Object.entries(byArea).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([area, count]) => `
                        <div class="insight-card">
                            <h4>${area}</h4>
                            <div class="value">${count}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    function generateRatingAnalysis() {
        const { allFeedbacks } = globalData;

        // Distribución de ratings
        const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        allFeedbacks.forEach(fb => {
            const rating = Math.round(fb.rating || 0);
            if (rating >= 1 && rating <= 5) distribution[rating]++;
        });

        const total = allFeedbacks.length;

        return `
            <div class="modal-section">
                <h3>📈 Tendencia de Satisfacción (30 días)</h3>
                <div class="modal-chart-container">
                    <canvas id="modal-rating-chart" style="height: 250px;"></canvas>
                </div>
            </div>

            <div class="modal-section">
                <h3>📊 Distribución de Calificaciones</h3>
                <div style="space-y: 0.75rem;">
                    ${[5, 4, 3, 2, 1].map(stars => {
            const count = distribution[stars];
            const percent = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
            return `
                            <div style="margin-bottom: 0.75rem;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                                    <span>${'⭐'.repeat(stars)}</span>
                                    <span style="font-weight: 600;">${count} (${percent}%)</span>
                                </div>
                                <div style="height: 8px; background: #f3f4f6; border-radius: 10px; overflow: hidden;">
                                    <div style="height: 100%; width: ${percent}%; background: linear-gradient(90deg, #f59e0b, #d97706); border-radius: 10px;"></div>
                                </div>
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;
    }

    function generateAreasAnalysis() {
        const { allAttendances, areasMap } = globalData;

        const byArea = {};
        allAttendances.forEach(att => {
            const area = areasMap[att.areaId] || 'Desconocida';
            byArea[area] = (byArea[area] || 0) + 1;
        });

        const sorted = Object.entries(byArea).sort((a, b) => b[1] - a[1]);

        return `
            <div class="modal-section">
                <h3>📊 Participación por Área</h3>
                <div class="modal-chart-container">
                    <canvas id="modal-areas-chart" style="height: 300px;"></canvas>
                </div>
            </div>

            <div class="modal-section">
                <h3>🏆 Área Más Activa</h3>
                ${sorted.length > 0 ? `
                    <div class="insight-card" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white;">
                        <h4 style="color: rgba(255,255,255,0.9);">${sorted[0][0]}</h4>
                        <div class="value" style="color: white;">${sorted[0][1]} asistencias</div>
                    </div>
                ` : '<p>No hay datos disponibles</p>'}
            </div>
        `;
    }

    function generateFeedbackAnalysis() {
        const { allAttendances, allFeedbacks } = globalData;

        const feedbackRate = allAttendances.length > 0
            ? ((allFeedbacks.length / allAttendances.length) * 100).toFixed(1)
            : 0;

        return `
            <div class="modal-section">
                <div class="insight-grid">
                    <div class="insight-card">
                        <h4>Total Asistencias</h4>
                        <div class="value">${allAttendances.length}</div>
                    </div>
                    <div class="insight-card">
                        <h4>Feedbacks Recibidos</h4>
                        <div class="value">${allFeedbacks.length}</div>
                    </div>
                    <div class="insight-card" style="background: linear-gradient(135deg, #10b981, #059669); color: white;">
                        <h4 style="color: rgba(255,255,255,0.9);">Tasa de Feedback</h4>
                        <div class="value" style="color: white;">${feedbackRate}%</div>
                    </div>
                </div>
            </div>

            <div class="modal-section">
                <h3>🎯 Progreso hacia Meta (90%)</h3>
                <div style="padding: 1.5rem; background: #f9fafb; border-radius: 12px;">
                    <div style="height: 20px; background: #e5e7eb; border-radius: 10px; overflow: hidden;">
                        <div style="height: 100%; width: ${Math.min(feedbackRate, 100)}%; background: linear-gradient(90deg, #10b981, #059669); border-radius: 10px; transition: width 0.8s;"></div>
                    </div>
                    <p style="margin-top: 0.75rem; color: #6b7280; text-align: center;">
                        ${feedbackRate >= 90 ? '✓ Meta alcanzada!' : `Faltan ${(90 - feedbackRate).toFixed(1)}% para alcanzar la meta`}
                    </p>
                </div>
            </div>
        `;
    }

    function renderModalAttendanceChart() {
        const canvas = document.getElementById('modal-attendance-chart');
        if (!canvas) return;

        const { allAttendances } = globalData;
        const now = new Date();
        const last30Days = [];

        for (let i = 29; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            last30Days.push(date);
        }

        const dataPoints = last30Days.map(date => {
            return allAttendances.filter(att => {
                const attDate = new Date(att.date);
                attDate.setHours(0, 0, 0, 0);
                return attDate.getTime() === date.getTime();
            }).length;
        });

        const labels = last30Days.map(d => `${d.getDate()}/${d.getMonth() + 1}`);

        new Chart(canvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Asistencias',
                    data: dataPoints,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    function renderModalRatingChart() {
        const canvas = document.getElementById('modal-rating-chart');
        if (!canvas) return;

        const { allFeedbacks } = globalData;
        const now = new Date();
        const last30Days = [];

        for (let i = 29; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            last30Days.push(date);
        }

        const dataPoints = last30Days.map(date => {
            const dayFeedbacks = allFeedbacks.filter(fb => {
                const fbDate = fb.timestamp ? fb.timestamp.toDate() : new Date(fb.date);
                fbDate.setHours(0, 0, 0, 0);
                return fbDate.getTime() === date.getTime();
            });
            if (dayFeedbacks.length === 0) return null;
            return dayFeedbacks.reduce((sum, fb) => sum + (fb.rating || 0), 0) / dayFeedbacks.length;
        });

        const labels = last30Days.map(d => `${d.getDate()}/${d.getMonth() + 1}`);

        new Chart(canvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Rating Promedio',
                    data: dataPoints,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    tension: 0.4,
                    fill: true,
                    spanGaps: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 5
                    }
                }
            }
        });
    }

    function renderModalAreasChart() {
        const canvas = document.getElementById('modal-areas-chart');
        if (!canvas) return;

        const { allAttendances, areasMap } = globalData;

        const byArea = {};
        allAttendances.forEach(att => {
            const area = areasMap[att.areaId] || 'Desconocida';
            byArea[area] = (byArea[area] || 0) + 1;
        });

        const sorted = Object.entries(byArea).sort((a, b) => b[1] - a[1]);
        const labels = sorted.map(([area]) => area);
        const data = sorted.map(([, count]) => count);

        new Chart(canvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Asistencias',
                    data: data,
                    backgroundColor: 'rgba(139, 92, 246, 0.6)',
                    borderColor: '#8b5cf6',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    function setupModalClose() {
        const modal = document.getElementById('analysis-modal');

        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    window.closeModal = function () {
        const modal = document.getElementById('analysis-modal');
        modal.classList.remove('show');
    };

    // --- Paleta validada (dataviz skill, modo claro) ---
    const VIZ = {
        blue: '#2a78d6',
        blueFill: 'rgba(42,120,214,0.12)',
        ink: '#0b0b0b',
        inkSecondary: '#52514e',
        muted: '#898781',
        grid: '#e1e0d9',
        font: 'system-ui, -apple-system, "Segoe UI", sans-serif'
    };

    // Plugin ligero para dibujar el valor al final de cada barra (etiqueta
    // directa; cubre el requisito de "relief" de la paleta y se lee sin hover).
    function valueLabels({ horizontal = false, format = (v) => String(v) }) {
        return {
            id: 'valueLabels_' + (horizontal ? 'h' : 'v') + Math.random().toString(36).slice(2, 6),
            afterDatasetsDraw(chart) {
                const { ctx } = chart;
                ctx.save();
                ctx.font = '600 12px ' + VIZ.font;
                ctx.fillStyle = VIZ.inkSecondary;
                chart.data.datasets.forEach((ds, di) => {
                    const meta = chart.getDatasetMeta(di);
                    meta.data.forEach((el, i) => {
                        const v = ds.data[i];
                        if (v == null || v === 0) return;
                        const txt = format(v);
                        if (horizontal) {
                            ctx.textAlign = 'left';
                            ctx.textBaseline = 'middle';
                            ctx.fillText(txt, el.x + 6, el.y);
                        } else {
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'bottom';
                            ctx.fillText(txt, el.x, el.y - 6);
                        }
                    });
                });
                ctx.restore();
            }
        };
    }

    const baseScale = {
        grid: { color: VIZ.grid, drawBorder: false },
        ticks: { color: VIZ.muted, font: { family: VIZ.font, size: 12 } }
    };

    async function renderCharts(attendances, areasMap, areaEmployeeCounts, period) {
        renderWeekTrendChart(attendances, period);
        renderAreaRateChart(attendances, areasMap, areaEmployeeCounts);
        await renderPeriodCompareChart();
    }

    // 1) Participación semana a semana (línea, 1 serie).
    function renderWeekTrendChart(attendances, period) {
        const canvas = document.getElementById('week-trend-chart');
        if (!canvas) return;

        const weekCounts = {};
        let maxWeek = (period && period.totalWeeks) ? period.totalWeeks : 0;
        attendances.forEach(att => {
            let wk = null;
            if (period && period.startDate && window.Periods) {
                wk = window.Periods.programWeekForDate(period, att.date);
            } else {
                wk = att.weekNumber || null;
            }
            if (wk == null) return;
            weekCounts[wk] = (weekCounts[wk] || 0) + 1;
            if (wk > maxWeek) maxWeek = wk;
        });

        let labels, data;
        if (period && period.startDate) {
            // Timeline completo del programa (muestra también las semanas flojas).
            labels = [];
            data = [];
            for (let w = 1; w <= (maxWeek || 1); w++) {
                labels.push('S' + w);
                data.push(weekCounts[w] || 0);
            }
        } else {
            const keys = Object.keys(weekCounts).map(Number).sort((a, b) => a - b);
            labels = keys.map(k => 'Sem ' + k);
            data = keys.map(k => weekCounts[k]);
        }

        const subtitle = document.getElementById('week-trend-subtitle');
        if (subtitle) subtitle.textContent = period ? period.name : 'Todos los periodos';

        if (chartInstances.week) chartInstances.week.destroy();
        chartInstances.week = new Chart(canvas.getContext('2d'), {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Asistencias',
                    data,
                    borderColor: VIZ.blue,
                    backgroundColor: VIZ.blueFill,
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true,
                    pointRadius: 3,
                    pointBackgroundColor: VIZ.blue,
                    pointHoverRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            title: (items) => 'Semana ' + items[0].label.replace(/\D/g, ''),
                            label: (item) => item.parsed.y + ' asistencias'
                        }
                    }
                },
                scales: {
                    y: { ...baseScale, beginAtZero: true, title: { display: true, text: 'Asistencias', color: VIZ.muted } },
                    x: { ...baseScale, grid: { display: false } }
                }
            }
        });
    }

    // 2) Participación por área: asistencias por persona (barra horizontal).
    function renderAreaRateChart(attendances, areasMap, areaEmployeeCounts) {
        const canvas = document.getElementById('area-rate-chart');
        if (!canvas) return;

        const areaCounts = {};
        attendances.forEach(att => {
            if (att.areaId) areaCounts[att.areaId] = (areaCounts[att.areaId] || 0) + 1;
        });

        const rows = Object.keys(areaCounts).map(id => {
            const emp = areaEmployeeCounts[id] || 0;
            const count = areaCounts[id];
            return {
                name: areasMap[id] || 'Desconocido',
                emp,
                count,
                rate: emp > 0 ? count / emp : 0
            };
        }).filter(r => r.emp > 0).sort((a, b) => b.rate - a.rate);

        if (chartInstances.areaRate) chartInstances.areaRate.destroy();
        chartInstances.areaRate = new Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: rows.map(r => r.name),
                datasets: [{
                    label: 'Asistencias por persona',
                    data: rows.map(r => Number(r.rate.toFixed(2))),
                    backgroundColor: VIZ.blue,
                    borderRadius: 4,
                    borderSkipped: false,
                    maxBarThickness: 26,
                    _meta: rows
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: { right: 32 } }, // espacio para la etiqueta al final de la barra
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (item) => {
                                const r = rows[item.dataIndex];
                                return `${r.count} asistencias / ${r.emp} personas = ${r.rate.toFixed(2)} por persona`;
                            }
                        }
                    }
                },
                scales: {
                    x: { ...baseScale, beginAtZero: true },
                    y: { ...baseScale, grid: { display: false } }
                }
            },
            plugins: [valueLabels({ horizontal: true, format: (v) => v.toFixed(1) })]
        });
    }

    // 3) Comparativa entre periodos: total de asistencias por temporada (barras).
    async function renderPeriodCompareChart() {
        const canvas = document.getElementById('period-compare-chart');
        if (!canvas || !window.Periods) return;

        const periods = dashPeriods.length ? dashPeriods : await window.Periods.getAllPeriods();

        // Conteo por periodo: usa agregación count() (eficiente); si el SDK no
        // la soporta, cae a contar los documentos.
        const results = [];
        for (const p of periods) {
            let total = 0;
            try {
                const agg = await db.collection('attendances').where('periodId', '==', p.id).count().get();
                total = agg.data().count;
            } catch (e) {
                const snap = await db.collection('attendances').where('periodId', '==', p.id).get();
                total = snap.size;
            }
            results.push({ name: p.name, season: p.season, total });
        }
        // Orden cronológico por fecha de inicio ascendente para leer la evolución.
        results.sort((a, b) => {
            const pa = periods.find(p => p.name === a.name);
            const pb = periods.find(p => p.name === b.name);
            return (pa.startDate || '').localeCompare(pb.startDate || '');
        });

        if (chartInstances.periodCompare) chartInstances.periodCompare.destroy();
        chartInstances.periodCompare = new Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: results.map(r => r.name),
                datasets: [{
                    label: 'Asistencias',
                    data: results.map(r => r.total),
                    backgroundColor: results.map(r => window.Periods.seasonMeta(r.season).color),
                    borderRadius: 4,
                    borderSkipped: false,
                    maxBarThickness: 64
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: (item) => item.parsed.y + ' asistencias' } }
                },
                scales: {
                    y: { ...baseScale, beginAtZero: true },
                    x: { ...baseScale, grid: { display: false } }
                }
            },
            plugins: [valueLabels({ horizontal: false, format: (v) => String(v) })]
        });
    }

    async function generateLeaderboard(attendances, feedbacks, areasMap, gen) {
        // Agrupar por empleado
        const employeeStats = {};

        attendances.forEach(att => {
            const empId = att.employeeId;

            if (!employeeStats[empId]) {
                employeeStats[empId] = { id: empId, attendances: 0, points: 0 };
            }
            employeeStats[empId].attendances++;
            employeeStats[empId].points += 10; // 10 pts por asistencia
        });

        // Sumar puntos de feedback
        feedbacks.forEach(fb => {
            const empId = fb.employeeId;

            if (employeeStats[empId]) {
                employeeStats[empId].points += (fb.rating * 2); // Bonus por rating
            }
        });

        // Convertir a array y ordenar
        const sortedEmployees = Object.values(employeeStats)
            .sort((a, b) => b.points - a.points)
            .slice(0, 10);

        // Si empezó otra recarga mientras tanto, aborta (evita duplicados).
        if (gen !== undefined && gen !== loadGeneration) return;

        // Renderizar tabla
        leaderboardTable.innerHTML = '';

        // Obtener máximo de puntos para barras relativas
        const maxPoints = sortedEmployees.length > 0 ? sortedEmployees[0].points : 100;

        for (const [index, stat] of sortedEmployees.entries()) {
            try {
                const empDoc = await db.collection('employees').doc(stat.id).get();
                // Si una recarga más nueva tomó el control, deja de agregar filas.
                if (gen !== undefined && gen !== loadGeneration) return;
                const empData = empDoc.data() || { fullName: 'Desconocido', areaId: 'N/A' };

                // Resolver nombre del área
                const areaName = areasMap[empData.areaId] || 'Área Desconocida';
                
                // Color para Top 3
                const rankColor = index === 0 ? '#fbbf24' : (index === 1 ? '#94a3b8' : (index === 2 ? '#b45309' : '#10b981'));
                const barWidth = Math.max((stat.points / maxPoints) * 100, 5);

                const row = document.createElement('tr');
                row.style.borderBottom = '1px solid #f3f4f6';
                row.innerHTML = `
                    <td style="padding: 1rem; font-weight: bold; color: ${rankColor};">#${index + 1}</td>
                    <td style="padding: 1rem; font-weight: 500;">
                        <a href="employee-detail.html?id=${stat.id}" style="color: var(--primary); text-decoration: none; font-weight: bold;">
                            ${empData.fullName} <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.8rem;"></i>
                        </a>
                    </td>
                    <td style="padding: 1rem; color: #666;">${areaName}</td>
                    <td style="padding: 1rem;">${stat.attendances}</td>
                    <td style="padding: 1rem;">-</td>
                    <td style="padding: 1rem; font-weight: 700; width: 140px;">
                        <div style="display: flex; flex-direction: column; gap: 4px;">
                            <span style="color: var(--primary); font-size: 0.9rem;">${stat.points} pts</span>
                            <div style="height: 6px; background: #e5e7eb; border-radius: 3px; width: 100%; overflow: hidden;">
                                <div style="height: 100%; width: ${barWidth}%; background: ${rankColor};"></div>
                            </div>
                        </div>
                    </td>
                `;
                leaderboardTable.appendChild(row);
            } catch (e) {
                console.error('Error fetching employee', e);
            }
        }
    }

    // Load Program Peridization Summary
    async function loadProgramSummary() {
        try {
            // Con "Todos los periodos" no hay un macrociclo único que mostrar.
            if (dashSelectedPeriodId === '__all__') {
                const summaryCard = document.getElementById('program-summary');
                if (summaryCard) summaryCard.style.display = 'none';
                return;
            }

            // Periodo seleccionado → su macrociclo asignado (o el por defecto).
            const period = dashPeriods.find(p => p.id === dashSelectedPeriodId) || null;
            const docId = (period && period.macrocycleId) ? period.macrocycleId : 'current_macrocycle';

            const doc = await db.collection('program_periodization')
                .doc(docId)
                .get();

            if (!doc.exists) {
                // No program configured, hide the summary card
                const summaryCard = document.getElementById('program-summary');
                if (summaryCard) summaryCard.style.display = 'none';
                return;
            }

            const programData = doc.data();
            // La fecha de inicio/fin del periodo manda sobre la del macrociclo.
            if (period && period.startDate) programData.startDate = period.startDate;
            if (period && period.totalWeeks) programData.totalWeeks = period.totalWeeks;
            const programContext = calculateProgramWeek(programData, period ? period.endDate : null);

            if (!programContext) return;

            // Show the card
            const summaryCard = document.getElementById('program-summary');
            if (summaryCard) {
                summaryCard.style.display = 'block';
            }

            // Update content
            const weekTag = document.getElementById('program-week-tag');
            const phaseName = document.getElementById('program-phase-name');
            const objective = document.getElementById('program-objective');
            const progressCircle = document.getElementById('progress-circle');
            const progressPercentage = document.getElementById('progress-percentage');

            if (weekTag) {
                weekTag.textContent = `Semana ${programContext.weekNumber}/${programContext.totalWeeks}`;
            }

            if (phaseName && programContext.phase) {
                phaseName.textContent = programContext.phase.name;
            }

            if (objective && programContext.phase) {
                objective.textContent = programContext.phase.nomenclatura;
            }

            if (progressPercentage) {
                progressPercentage.textContent = `${Math.round(programContext.progress)}%`;
            }

            // Animate progress ring
            if (progressCircle) {
                const circumference = 2 * Math.PI * 42; // r=42
                const offset = circumference - (programContext.progress / 100) * circumference;
                progressCircle.style.strokeDashoffset = offset;
            }

        } catch (error) {
            console.error('Error loading program summary:', error);
        }
    }

    function calculateProgramWeek(programData, periodEndDate = null) {
        if (!programData || !programData.startDate) {
            return null;
        }

        const startDate = new Date(programData.startDate);
        const today = new Date();

        // Si el periodo ya terminó, congelar la semana en su fecha de fin.
        let referenceDate = today;
        if (periodEndDate) {
            const end = new Date(periodEndDate + 'T23:59:59');
            if (today > end) referenceDate = end;
        }

        const diffTime = referenceDate - startDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const weekNumber = Math.max(1, Math.min(
            Math.floor(diffDays / 7) + 1,
            programData.totalWeeks
        ));

        // Find current phase
        const phase = programData.phases.find(p =>
            weekNumber >= p.weekRange[0] && weekNumber <= p.weekRange[1]
        );

        return {
            weekNumber,
            phase,
            totalWeeks: programData.totalWeeks,
            progress: (weekNumber / programData.totalWeeks) * 100
        };
    }
});
