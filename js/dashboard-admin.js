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

    // Inicializar
    loadDashboardData();
    loadProgramSummary(); // Program Periodization
    setupDetailButtons();
    setupModalClose();
    setupRealtimeListeners(); // NEW: Real-time updates

    async function loadDashboardData() {
        try {
            // 0. Cargar Mapa de Áreas (ID → Nombre)
            const areasMap = {};
            const areasSnapshot = await db.collection('areas').get();
            areasSnapshot.forEach(doc => {
                areasMap[doc.id] = doc.data().name;
            });

            // 1. Cargar todos los empleados para iterar sus subcollections
            const employeesSnapshot = await db.collection('employees').get();

            let totalAttendances = 0;
            let totalRating = 0;
            let feedbackCount = 0;
            const areasSet = new Set();
            const allAttendances = [];
            const allFeedbacks = [];

            // OPTIMIZACIÓN: Usar Promise.all para queries paralelas
            const employeePromises = employeesSnapshot.docs.map(async (empDoc) => {
                const empId = empDoc.id;
                const empData = empDoc.data();

                // Obtener attendances y feedbacks en paralelo
                const [attSnapshot, fbSnapshot] = await Promise.all([
                    db.collection('employees')
                        .doc(empId)
                        .collection('attendance')
                        .get(),
                    db.collection('employees')
                        .doc(empId)
                        .collection('feedback')
                        .get()
                ]);

                // Procesar attendances
                const empAttendances = [];
                attSnapshot.forEach(doc => {
                    const data = doc.data();
                    if (data.areaId) areasSet.add(data.areaId);
                    empAttendances.push({ id: doc.id, ...data, employeeId: empId, employeeName: empData.fullName || 'Desconocido' });
                });

                // Procesar feedbacks
                const empFeedbacks = [];
                let empTotalRating = 0;
                fbSnapshot.forEach(doc => {
                    const data = doc.data();
                    empTotalRating += data.rating || 0;
                    empFeedbacks.push({ id: doc.id, ...data, employeeId: empId, employeeName: empData.fullName || 'Desconocido' });
                });

                return {
                    attendances: empAttendances,
                    feedbacks: empFeedbacks,
                    totalRating: empTotalRating,
                    attendanceCount: attSnapshot.size,
                    feedbackCount: fbSnapshot.size
                };
            });

            // Esperar todas las queries en paralelo
            const results = await Promise.all(employeePromises);

            // Agregar resultados
            results.forEach(result => {
                totalAttendances += result.attendanceCount;
                feedbackCount += result.feedbackCount;
                totalRating += result.totalRating;
                allAttendances.push(...result.attendances);
                allFeedbacks.push(...result.feedbacks);
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
            renderCharts(allAttendances, allFeedbacks, areasMap);

            // 5. Generar Leaderboard
            generateLeaderboard(allAttendances, allFeedbacks, areasMap);

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

    // NEW: Setup real-time listeners for automatic updates
    function setupRealtimeListeners() {
        console.log('🔄 Configurando listeners en tiempo real...');

        // Listen to all employees' attendance subcollections
        db.collection('employees').get().then(employeesSnapshot => {
            employeesSnapshot.forEach(empDoc => {
                const empId = empDoc.id;

                // Listen to attendance changes
                db.collection('employees')
                    .doc(empId)
                    .collection('attendance')
                    .onSnapshot(() => {
                        console.log('✨ Cambio detectado en asistencias - Actualizando dashboard...');
                        loadDashboardData();
                    }, error => {
                        console.error('Error en listener de attendance:', error);
                    });

                // Listen to feedback changes
                db.collection('employees')
                    .doc(empId)
                    .collection('feedback')
                    .onSnapshot(() => {
                        console.log('✨ Cambio detectado en feedback - Actualizando dashboard...');
                        loadDashboardData();
                    }, error => {
                        console.error('Error en listener de feedback:', error);
                    });
            });
        });
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

    function renderCharts(attendances, feedbacks, areasMap) {
        // Preparar datos para gráfica de áreas
        const areaCounts = {};
        attendances.forEach(att => {
            const areaId = att.areaId;
            areaCounts[areaId] = (areaCounts[areaId] || 0) + 1;
        });

        // Gráfica de Áreas
        const areaCtx = document.getElementById('area-chart').getContext('2d');
        new Chart(areaCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(areaCounts).map(id => areasMap[id] || 'Desconocido'),
                datasets: [{
                    label: 'Asistencias',
                    data: Object.values(areaCounts),
                    backgroundColor: 'rgba(102, 126, 234, 0.6)',
                    borderColor: 'rgba(102, 126, 234, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } }
            }
        });

        // Gráfica de Tendencia (Días)
        const dayCounts = {};
        const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

        attendances.forEach(att => {
            const date = new Date(att.date);
            const dayName = days[date.getDay()];
            dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
        });

        const trendCtx = document.getElementById('trend-chart').getContext('2d');
        new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: Object.keys(dayCounts),
                datasets: [{
                    label: 'Participación Diaria',
                    data: Object.values(dayCounts),
                    borderColor: '#f093fb',
                    backgroundColor: 'rgba(240, 147, 251, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true
            }
        });
    }

    async function generateLeaderboard(attendances, feedbacks, areasMap) {
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

        // Renderizar tabla
        leaderboardTable.innerHTML = '';

        // Obtener máximo de puntos para barras relativas
        const maxPoints = sortedEmployees.length > 0 ? sortedEmployees[0].points : 100;

        for (const [index, stat] of sortedEmployees.entries()) {
            try {
                const empDoc = await db.collection('employees').doc(stat.id).get();
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
            const doc = await db.collection('program_periodization')
                .doc('current_macrocycle')
                .get();

            if (!doc.exists) {
                // No program configured, hide the summary card
                return;
            }

            const programData = doc.data();
            const programContext = calculateProgramWeek(programData);

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

    function calculateProgramWeek(programData) {
        if (!programData || !programData.startDate) {
            return null;
        }

        const startDate = new Date(programData.startDate);
        const today = new Date();

        const diffTime = today - startDate;
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
