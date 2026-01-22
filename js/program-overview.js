// Program Overview - Vista de Macrociclo de 19 Semanas
document.addEventListener('DOMContentLoaded', () => {
    // Auth Check
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.href = 'login.html';
        } else {
            loadProgramData();
        }
    });

    let programData = null;
    let currentWeekNumber = 1;
    let currentPhase = null;
    let programContext = null;

    async function loadProgramData() {
        // NO mostrar loading state - dejar el hero como está
        // showLoadingState();

        // Timeout de seguridad: si no carga en 10 segundos, mostrar error
        const timeoutId = setTimeout(() => {
            console.error('⏱️ Timeout: La carga tomó más de 10 segundos');
            showErrorMessage('La carga está tomando más tiempo del esperado. Por favor, recarga la página.');
        }, 10000);

        try {
            console.log('📊 [Program Overview] Iniciando carga de datos...');

            programData = await ProgramUtils.loadProgramData();
            console.log('📊 [Program Overview] Datos cargados:', programData ? 'SÍ' : 'NO');

            if (!programData) {
                clearTimeout(timeoutId);
                showNoProgramMessage();
                return;
            }

            // Validar integridad de datos
            console.log('📊 [Program Overview] Validando datos...');
            const validation = ProgramUtils.validateProgramData(programData);
            console.log('📊 [Program Overview] Validación:', validation.valid ? 'OK' : 'FALLÓ');

            if (!validation.valid) {
                clearTimeout(timeoutId);
                console.error('Program data validation failed:', validation.errors);
                showErrorMessage('Los datos del programa están incompletos o son inválidos.');
                return;
            }

            // Calcular contexto actual
            console.log('📊 [Program Overview] Calculando contexto...');
            programContext = ProgramUtils.calculateProgramWeek(programData);
            console.log('📊 [Program Overview] Contexto:', programContext);

            if (!programContext) {
                clearTimeout(timeoutId);
                showErrorMessage('No se pudo calcular el contexto del programa.');
                return;
            }

            currentWeekNumber = programContext.weekNumber;
            currentPhase = programContext.phase;

            console.log('📊 [Program Overview] Renderizando UI...');
            console.log('  - Semana actual:', currentWeekNumber);
            console.log('  - Fase actual:', currentPhase?.name);

            renderHeroSection();
            renderPhaseTimeline();
            renderWeeksGrid();

            clearTimeout(timeoutId);
            console.log('✅ [Program Overview] Carga completada exitosamente');

        } catch (error) {
            clearTimeout(timeoutId);
            console.error('❌ [Program Overview] Error loading program data:', error);
            console.error('Stack trace:', error.stack);
            showErrorMessage('Error al cargar el programa: ' + error.message);
        }
    }

    function renderHeroSection() {
        const hero = document.getElementById('program-hero');

        // CASO: Programa no ha iniciado
        if (programContext.status === 'not_started') {
            hero.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <i class="fa-solid fa-calendar-clock" style="font-size: 3rem; margin-bottom: 1rem; color: var(--primary);"></i>
                    <h2>Programa Próximamente</h2>
                    <p style="font-size: 1.2rem; margin: 1rem 0;">El programa iniciará en <strong>${programContext.daysUntilStart} días</strong></p>
                    <p style="color: #6b7280;">Fecha de inicio: ${new Date(programData.startDate).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
            `;
            // NO actualizar stats porque el hero fue reemplazado
            return;
        }

        // CASO: Programa normal o completado
        const progress = programContext.progress;

        // Progress bar
        const progressFill = document.getElementById('main-progress-fill');
        if (progressFill) progressFill.style.width = `${progress}%`;

        // Stats - verificar que existan
        const weekStat = document.getElementById('current-week-stat');
        const progressPercent = document.getElementById('progress-percent');
        const phaseName = document.getElementById('current-phase-name');
        const daysRemaining = document.getElementById('days-remaining');

        if (weekStat) weekStat.textContent = `${currentWeekNumber}/${programData.totalWeeks}`;
        if (progressPercent) progressPercent.textContent = `${Math.round(progress)}%`;
        if (phaseName) phaseName.textContent = currentPhase ? currentPhase.name : (programContext.status === 'completed' ? 'Completado' : '-');
        if (daysRemaining) daysRemaining.textContent = programContext.daysRemaining;

        // Actualizar color del hero con el de la fase actual
        if (currentPhase) {
            hero.style.background = `linear-gradient(135deg, ${currentPhase.colorTheme} 0%, ${ProgramUtils.darkenColor(currentPhase.colorTheme, 20)} 100%)`;
        } else if (programContext.status === 'completed') {
            hero.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        }
    }

    function renderPhaseTimeline() {
        const container = document.getElementById('phase-timeline');
        container.innerHTML = '';

        programData.phases.forEach((phase, index) => {
            const isActive = currentPhase && phase.phaseId === currentPhase.phaseId;

            const block = document.createElement('div');
            block.className = `phase-block ${isActive ? 'active' : ''}`;
            block.style.setProperty('--phase-color', phase.colorTheme);
            block.style.setProperty('--phase-color-dark', ProgramUtils.darkenColor(phase.colorTheme, 20));

            block.innerHTML = `
                <div class="phase-number">${phase.phaseId}</div>
                <div class="phase-name">${phase.name}</div>
                <div class="phase-weeks">Semanas ${phase.weekRange[0]}-${phase.weekRange[1]}</div>
                <div class="phase-objective">${phase.objetivoDominante}</div>
            `;

            block.addEventListener('click', () => openPhaseModal(phase));
            container.appendChild(block);
        });
    }

    function renderWeeksGrid() {
        const container = document.getElementById('weeks-grid');
        container.innerHTML = '';

        programData.weeklySchedule.forEach(week => {
            const phase = programData.phases.find(p => p.phaseId === week.phase);

            let statusClass = 'status-pending';
            let cardClass = 'week-card';
            let statusText = 'Pendiente';

            if (week.week < currentWeekNumber) {
                statusClass = 'status-completed';
                cardClass = 'week-card completed';
                statusText = 'Completada';
            } else if (week.week === currentWeekNumber) {
                statusClass = 'status-current';
                cardClass = 'week-card current';
                statusText = 'En Curso';
            }

            const card = document.createElement('div');
            card.className = cardClass;
            card.style.setProperty('--phase-color', phase ? phase.colorTheme : '#6b7280');

            card.innerHTML = `
                <div class="week-header">
                    <div class="week-number">S${week.week}</div>
                    <span class="week-status-badge ${statusClass}">${statusText}</span>
                </div>
                <div class="week-activity">${week.activity}</div>
                <div class="week-objective">
                    <i class="fa-solid fa-bullseye"></i> ${week.objetivo}
                </div>
                <div class="week-intensity">
                    <i class="fa-solid fa-gauge"></i> ${week.intensidad}
                </div>
            `;

            card.addEventListener('click', () => {
                showWeekDetail(week, phase, statusText);
            });

            container.appendChild(card);
        });
    }

    // Modal de fundamentos científicos
    window.openPhaseModal = (phase) => {
        const modal = document.getElementById('science-modal');
        const header = document.getElementById('modal-header');

        // Configurar colores
        header.style.background = `linear-gradient(135deg, ${phase.colorTheme}, ${ProgramUtils.darkenColor(phase.colorTheme, 20)})`;
        document.querySelectorAll('.objectives-list i, .metric-item').forEach(el => {
            el.style.setProperty('--phase-color', phase.colorTheme);
        });

        // Contenido
        document.getElementById('modal-phase-name').textContent = phase.name;
        document.getElementById('modal-nomenclatura').textContent = phase.nomenclatura;

        // Justificación (convertir saltos de línea a párrafos) con sanitización
        const safeJustification = ProgramUtils.escapeHtml(phase.justificacionCientifica);
        const justification = safeJustification.split('\n\n').map(para =>
            `<p style="margin-bottom: 1rem;">${para.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>`
        ).join('');
        document.getElementById('modal-justification').innerHTML = justification;

        // Objetivos
        const objectivesList = document.getElementById('modal-objectives');
        objectivesList.innerHTML = phase.objetivosFase.map(obj => `
            <li>
                <i class="fa-solid fa-circle-check"></i>
                <span>${obj}</span>
            </li>
        `).join('');

        // Métricas
        const metricsContainer = document.getElementById('modal-metrics');
        metricsContainer.innerHTML = Object.entries(phase.metricsTarget).map(([key, value]) => `
            <div class="metric-item">
                <strong>${ProgramUtils.formatMetricKey(key)}</strong>
                <span>${value}</span>
            </div>
        `).join('');

        modal.classList.add('show');
    };

    window.closeModal = () => {
        document.getElementById('science-modal').classList.remove('show');
    };

    // Cerrar modal al hacer clic fuera
    document.getElementById('science-modal').addEventListener('click', (e) => {
        if (e.target.id === 'science-modal') {
            closeModal();
        }
    });

    // Helpers - ahora usando ProgramUtils
    function showLoadingState() {
        const hero = document.getElementById('program-hero');
        hero.innerHTML = `
            <div style="text-align: center; padding: 3rem;">
                <i class="fa-solid fa-spinner fa-spin" style="font-size: 3rem; color: var(--primary);"></i>
                <p style="margin-top: 1rem; color: #6b7280;">Cargando programa...</p>
            </div>
        `;
        document.getElementById('phase-timeline').innerHTML = '';
        document.getElementById('weeks-grid').innerHTML = '';
    }

    function showNoProgramMessage() {
        const hero = document.getElementById('program-hero');
        hero.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <i class="fa-solid fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                <h2>No hay programa configurado</h2>
                <p>Por favor, ejecuta el script de inicialización para configurar el sistema de periodización.</p>
                <a href="#" onclick="alert('Ejecuta scripts/init-periodization.js en la consola de Firebase')" 
                   class="btn-primary" style="display: inline-block; margin-top: 1rem; padding: 0.75rem 1.5rem; background: white; color: var(--primary); border-radius: 8px; text-decoration: none; font-weight: 600;">
                    Ver Instrucciones
                </a>
            </div>
        `;
        document.getElementById('phase-timeline').innerHTML = '';
        document.getElementById('weeks-grid').innerHTML = '';
    }

    function showErrorMessage(message = 'Por favor, intenta recargar la página.') {
        const hero = document.getElementById('program-hero');
        hero.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <i class="fa-solid fa-exclamation-circle" style="font-size: 3rem; margin-bottom: 1rem; color: #ef4444;"></i>
                <h2>Error al cargar el programa</h2>
                <p>${message}</p>
            </div>
        `;
        document.getElementById('phase-timeline').innerHTML = '';
        document.getElementById('weeks-grid').innerHTML = '';
    }

    // --- WEEK DETAIL PANEL FUNCTIONS ---

    function showWeekDetail(week, phase, statusText) {
        const panel = document.getElementById('week-detail-panel');
        const header = panel.querySelector('.detail-panel-header');

        // Update header with phase color
        if (phase) {
            header.style.background = `linear-gradient(135deg, ${phase.colorTheme}, ${ProgramUtils.darkenColor(phase.colorTheme, 20)})`;
        }

        // Update title
        document.getElementById('detail-week-title').innerHTML = `<i class="fa-solid fa-calendar-week"></i> Semana ${week.week} - ${week.activity}`;

        // Populate week information
        document.getElementById('detail-week-number').textContent = `${week.week}/${programData.totalWeeks}`;
        document.getElementById('detail-week-phase').textContent = phase ? phase.name : 'Sin fase';
        document.getElementById('detail-week-status').textContent = statusText;
        document.getElementById('detail-week-intensity').textContent = week.intensidad;
        document.getElementById('detail-week-activity').textContent = week.activity;
        document.getElementById('detail-week-objective').textContent = week.objetivo;

        // Populate phase scientific content
        if (phase) {
            const scienceContent = document.getElementById('detail-week-science-content');
            const justification = phase.justificacionCientifica.split('\n\n').map(para =>
                `<p>${para.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>`
            ).join('');
            scienceContent.innerHTML = justification;

            // Populate phase objectives
            const objectivesList = document.getElementById('detail-week-phase-objectives');
            objectivesList.innerHTML = phase.objetivosFase.map(obj => `
                <li>
                    <i class="fa-solid fa-circle-check"></i>
                    <span>${obj}</span>
                </li>
            `).join('');
        } else {
            document.getElementById('detail-week-science-content').innerHTML = '<p>No hay información científica disponible para esta semana.</p>';
            document.getElementById('detail-week-phase-objectives').innerHTML = '<li>No hay objetivos definidos.</li>';
        }

        // Setup calendar navigation button
        const calendarBtn = document.getElementById('btn-view-week-calendar');
        calendarBtn.onclick = () => {
            const startDate = new Date(programData.startDate);
            startDate.setDate(startDate.getDate() + ((week.week - 1) * 7));
            const weekParam = ProgramUtils.getWeekId(startDate);
            window.location.href = `calendar.html?week=${weekParam}`;
        };

        // Show panel with animation
        panel.classList.remove('hidden');

        // Smooth scroll to panel
        setTimeout(() => {
            panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    }

    // Close detail panel button
    const closeWeekDetailBtn = document.getElementById('btn-close-week-detail');
    if (closeWeekDetailBtn) {
        closeWeekDetailBtn.addEventListener('click', () => {
            const panel = document.getElementById('week-detail-panel');
            panel.classList.add('hidden');
        });
    }

    // --- PDF GENERATION FUNCTIONS ---

    // Download Month PDF Button
    const btnDownloadMonth = document.getElementById('btn-download-month-pdf');
    if (btnDownloadMonth) {
        btnDownloadMonth.addEventListener('click', () => generateMonthPDF());
    }

    // Download Full PDF Button
    const btnDownloadFull = document.getElementById('btn-download-full-pdf');
    if (btnDownloadFull) {
        btnDownloadFull.addEventListener('click', () => generateFullPDF());
    }

    async function generateMonthPDF() {
        if (!programData || !programContext) {
            alert('No hay datos del programa disponibles');
            return;
        }

        const btn = document.getElementById('btn-download-month-pdf');
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generando PDF...';

        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // Get current month weeks
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth();
            const currentYear = currentDate.getFullYear();

            const monthWeeks = programData.weeklySchedule.filter(week => {
                const startDate = new Date(programData.startDate);
                startDate.setDate(startDate.getDate() + ((week.week - 1) * 7));
                return startDate.getMonth() === currentMonth && startDate.getFullYear() === currentYear;
            });

            if (monthWeeks.length === 0) {
                alert('No hay semanas programadas para el mes actual');
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-file-pdf"></i> <span>Descargar Plan del Mes Actual (PDF)</span>';
                return;
            }

            // Get activities data
            const activitiesSnapshot = await db.collection('activities').get();
            const activitiesData = {};
            activitiesSnapshot.forEach(doc => {
                activitiesData[doc.id] = doc.data();
            });

            // Get scheduled activities for these weeks
            const scheduledActivities = {};

            // First, get all week IDs from Firebase to map them correctly
            const allSchedules = await db.collection('weekly_schedules').get();
            const weekIdMap = {};

            allSchedules.forEach(doc => {
                const docId = doc.id;
                const weekMatch = docId.match(/W(\d+)/);
                if (weekMatch) {
                    const calendarWeek = parseInt(weekMatch[1]);
                    if (!weekIdMap[calendarWeek]) {
                        weekIdMap[calendarWeek] = docId;
                    }
                }
            });

            // Use first available week in Firebase as starting point
            const availableWeeks = Object.keys(weekIdMap)
                .map(w => parseInt(w))
                .filter(w => w >= 2 && w <= 52)
                .sort((a, b) => a - b);
            const firstAvailableWeek = availableWeeks[0];

            for (const week of monthWeeks) {
                const calendarWeek = firstAvailableWeek + (week.week - 1);
                const weekId = weekIdMap[calendarWeek];

                console.log(`[PDF Mensual] Semana ${week.week} → W${calendarWeek} → ID: ${weekId || 'NO ENCONTRADO'}`);

                if (weekId) {
                    const scheduleDoc = await db.collection('weekly_schedules').doc(weekId).get();
                    if (scheduleDoc.exists) {
                        const activities = scheduleDoc.data().schedule || [];
                        scheduledActivities[week.week] = activities;
                        console.log(`  ✓ Encontradas ${activities.length} actividades`);
                    } else {
                        scheduledActivities[week.week] = [];
                    }
                } else {
                    console.log(`  ✗ No se encontró el ID`);
                    scheduledActivities[week.week] = [];
                }
            }

            // Header
            doc.setFontSize(20);
            doc.setTextColor(102, 126, 234);
            doc.text('IBERO ACTÍVATE', 105, 20, { align: 'center' });

            doc.setFontSize(16);
            doc.setTextColor(60, 60, 60);
            const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
            doc.text(`Plan del Mes: ${monthNames[currentMonth]} ${currentYear}`, 105, 30, { align: 'center' });

            doc.setFontSize(10);
            doc.setTextColor(120, 120, 120);
            doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, 105, 37, { align: 'center' });

            let yPos = 45;

            // For each week in the month
            monthWeeks.forEach((week, index) => {
                const phase = programData.phases.find(p => p.phaseId === week.phase);

                if (yPos > 250) {
                    doc.addPage();
                    yPos = 20;
                }

                // Week header
                doc.setFillColor(102, 126, 234);
                doc.rect(15, yPos, 180, 10, 'F');
                doc.setFontSize(12);
                doc.setTextColor(255, 255, 255);
                doc.text(`Semana ${week.week} - ${week.activity}`, 20, yPos + 7);

                yPos += 15;

                // Week details
                doc.setFontSize(10);
                doc.setTextColor(60, 60, 60);
                doc.text(`Fase: ${phase ? phase.name : 'N/A'}`, 20, yPos);
                doc.text(`Intensidad: ${week.intensidad}`, 120, yPos);
                yPos += 6;
                doc.text(`Objetivo: ${week.objetivo}`, 20, yPos);
                yPos += 10;

                // Scheduled activities table
                const weekActivities = scheduledActivities[week.week] || [];
                if (weekActivities.length > 0) {
                    // Sort activities by day
                    const dayOrder = { 'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 'friday': 5, 'saturday': 6, 'sunday': 7 };
                    weekActivities.sort((a, b) => (dayOrder[a.day] || 99) - (dayOrder[b.day] || 99));

                    const tableData = weekActivities.map(item => {
                        const activity = activitiesData[item.activityId];
                        const dayNames = {
                            'monday': 'Lunes',
                            'tuesday': 'Martes',
                            'wednesday': 'Miércoles',
                            'thursday': 'Jueves',
                            'friday': 'Viernes'
                        };
                        return [
                            dayNames[item.day] || item.day,
                            activity ? activity.name : 'Actividad desconocida',
                            activity ? `${activity.duration} min` : '-',
                            item.location || 'Por definir'
                        ];
                    });

                    doc.autoTable({
                        startY: yPos,
                        head: [['Día', 'Actividad', 'Duración', 'Ubicación']],
                        body: tableData,
                        theme: 'grid',
                        headStyles: { fillColor: [199, 210, 254], textColor: [67, 56, 202], fontStyle: 'bold' },
                        styles: { fontSize: 9, cellPadding: 3 },
                        margin: { left: 20, right: 20 }
                    });

                    yPos = doc.lastAutoTable.finalY + 10;
                } else {
                    doc.setTextColor(150, 150, 150);
                    doc.setFontSize(9);
                    doc.text('No hay actividades programadas para esta semana', 20, yPos);
                    yPos += 10;
                }
            });

            // Save PDF
            doc.save(`IBERO_ACTIVATE_${monthNames[currentMonth]}_${currentYear}.pdf`);

        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error al generar el PDF: ' + error.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-file-pdf"></i> <span>Descargar Plan del Mes Actual (PDF)</span>';
        }
    }

    async function generateFullPDF() {
        if (!programData) {
            alert('No hay datos del programa disponibles');
            return;
        }

        const btn = document.getElementById('btn-download-full-pdf');
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generando PDF completo...';

        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // Get activities data
            const activitiesSnapshot = await db.collection('activities').get();
            const activitiesData = {};
            activitiesSnapshot.forEach(doc => {
                activitiesData[doc.id] = doc.data();
            });

            // Get all scheduled activities for all weeks
            const scheduledActivities = {};

            // First, get all week IDs from Firebase to map them correctly
            const allSchedules = await db.collection('weekly_schedules').get();
            const weekIdMap = {};

            allSchedules.forEach(doc => {
                // Try to extract week number from various patterns
                const docId = doc.id;
                const weekMatch = docId.match(/W(\d+)/);  // Matches 2026-W3, 2026-W10, etc.

                if (weekMatch) {
                    const calendarWeek = parseInt(weekMatch[1]);
                    // Store the document ID for this calendar week
                    if (!weekIdMap[calendarWeek]) {
                        weekIdMap[calendarWeek] = docId;
                    }
                }
            });

            console.log('=== Mapa de IDs de semanas encontradas en Firebase ===', weekIdMap);

            // Find the first available week in Firebase for 2026 (this is where Week 1 should start)
            const availableWeeks = Object.keys(weekIdMap)
                .map(w => parseInt(w))
                .filter(w => w >= 2 && w <= 52) // Only 2026 weeks, ignore 2025
                .sort((a, b) => a - b);

            const firstAvailableWeek = availableWeeks[0];

            console.log(`Primera semana disponible en Firebase para 2026: W${firstAvailableWeek}`);

            // Build schedule and collect used images
            const usedImages = new Set();

            for (const week of programData.weeklySchedule) {
                // Map program week to calendar week starting from first available week
                const calendarWeek = firstAvailableWeek + (week.week - 1);
                const weekId = weekIdMap[calendarWeek];

                if (weekId) {
                    const scheduleDoc = await db.collection('weekly_schedules').doc(weekId).get();
                    if (scheduleDoc.exists) {
                        const activities = scheduleDoc.data().schedule || [];
                        scheduledActivities[week.week] = activities;
                    } else {
                        scheduledActivities[week.week] = [];
                    }
                } else {
                    scheduledActivities[week.week] = [];
                }
            }

            // Header - Page 1
            doc.setFontSize(22);
            doc.setTextColor(102, 126, 234);
            doc.text('IBERO ACTÍVATE', 105, 20, { align: 'center' });

            doc.setFontSize(16);
            doc.setTextColor(60, 60, 60);
            doc.text('Programa Completo de 19 Semanas', 105, 30, { align: 'center' });

            doc.setFontSize(10);
            doc.setTextColor(120, 120, 120);
            doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, 105, 37, { align: 'center' });

            // Program overview
            doc.setFontSize(11);
            doc.setTextColor(60, 60, 60);
            doc.text(`Inicio: ${new Date(programData.startDate).toLocaleDateString('es-ES')}`, 20, 50);
            doc.text(`Duración: ${programData.totalWeeks} semanas`, 20, 57);

            let yPos = 70;

            // Phases overview
            doc.setFontSize(14);
            doc.setTextColor(102, 126, 234);
            doc.text('Fases del Programa', 20, yPos);
            yPos += 10;

            programData.phases.forEach(phase => {
                if (yPos > 270) {
                    doc.addPage();
                    yPos = 20;
                }
                doc.setFontSize(11);
                doc.setTextColor(60, 60, 60);
                doc.setFont(undefined, 'bold');
                doc.text(`${phase.name} (Semanas ${phase.weekRange[0]}-${phase.weekRange[1]})`, 25, yPos);
                doc.setFont(undefined, 'normal');
                yPos += 6;
                doc.setFontSize(9);
                doc.setTextColor(100, 100, 100);
                doc.text(`Objetivo: ${phase.objetivoDominante}`, 30, yPos);
                yPos += 8;
            });

            // Weekly schedule with daily activities
            doc.addPage();
            yPos = 20;

            doc.setFontSize(16);
            doc.setTextColor(102, 126, 234);
            doc.text('Calendario Detallado - 19 Semanas', 105, yPos, { align: 'center' });
            yPos += 15;

            // For each week
            programData.weeklySchedule.forEach((week, index) => {
                const phase = programData.phases.find(p => p.phaseId === week.phase);

                // Check if we need a new page
                if (yPos > 240) {
                    doc.addPage();
                    yPos = 20;
                }

                // Week header with color
                const phaseColor = phase ? hexToRgb(phase.colorTheme) : [102, 126, 234];
                doc.setFillColor(phaseColor[0], phaseColor[1], phaseColor[2]);
                doc.rect(15, yPos, 180, 10, 'F');
                doc.setFontSize(12);
                doc.setTextColor(255, 255, 255);
                doc.setFont(undefined, 'bold');
                doc.text(`Semana ${week.week}: ${week.activity}`, 20, yPos + 7);
                doc.setFont(undefined, 'normal');

                yPos += 15;

                // Week details
                doc.setFontSize(9);
                doc.setTextColor(60, 60, 60);
                doc.text(`Fase: ${phase ? phase.name : 'N/A'}`, 20, yPos);
                doc.text(`Intensidad: ${week.intensidad}`, 100, yPos);
                yPos += 5;

                // Wrap objective text if too long
                const objectiveLines = doc.splitTextToSize(`Objetivo: ${week.objetivo}`, 170);
                doc.text(objectiveLines, 20, yPos);
                yPos += (objectiveLines.length * 5) + 5;

                // Daily activities table
                const weekActivities = scheduledActivities[week.week] || [];
                if (weekActivities.length > 0) {
                    // Sort activities by day
                    const dayOrder = { 'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 'friday': 5, 'saturday': 6, 'sunday': 7 };
                    weekActivities.sort((a, b) => (dayOrder[a.day] || 99) - (dayOrder[b.day] || 99));

                    const tableData = weekActivities.map(item => {
                        const activity = activitiesData[item.activityId];
                        const dayNames = {
                            'monday': 'Lunes',
                            'tuesday': 'Martes',
                            'wednesday': 'Miércoles',
                            'thursday': 'Jueves',
                            'friday': 'Viernes'
                        };

                        const activityName = activity ? activity.name : 'Actividad desconocida';
                        const description = activity ? (activity.description || activity.objetivo || '-') : '-';

                        return [
                            dayNames[item.day] || item.day,
                            activityName,
                            activity ? `${activity.duration} min` : '-',
                            description // FULL DESCRIPTION (no truncation)
                        ];
                    });

                    doc.autoTable({
                        startY: yPos,
                        head: [['Día', 'Actividad', 'Duración', 'Descripción']],
                        body: tableData,
                        theme: 'grid',
                        headStyles: {
                            fillColor: [phaseColor[0], phaseColor[1], phaseColor[2]],
                            textColor: [255, 255, 255],
                            fontStyle: 'bold',
                            fontSize: 8
                        },
                        styles: {
                            fontSize: 7,
                            cellPadding: 2,
                            overflow: 'linebreak'
                        },
                        columnStyles: {
                            0: { cellWidth: 25 },
                            1: { cellWidth: 45 },
                            2: { cellWidth: 20 },
                            3: { cellWidth: 90 }
                        },
                        margin: { left: 15, right: 15 }
                    });

                    yPos = doc.lastAutoTable.finalY + 8;
                } else {
                    doc.setTextColor(150, 150, 150);
                    doc.setFontSize(8);
                    doc.text('⚠ No hay actividades programadas para esta semana', 20, yPos);
                    yPos += 10;
                }

                // Add separator line
                if (index < programData.weeklySchedule.length - 1) {
                    doc.setDrawColor(220, 220, 220);
                    doc.line(15, yPos, 195, yPos);
                    yPos += 5;
                }
            });

            // Footer on last page
            const totalPages = doc.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150, 150, 150);
                doc.text(`Página ${i} de ${totalPages}`, 105, 287, { align: 'center' });
                doc.text('IBERO ACTÍVATE - Programa de Bienestar Integral', 105, 292, { align: 'center' });
            }

            // Save PDF
            doc.save('IBERO_ACTIVATE_Plan_Completo_19_Semanas.pdf');

        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error al generar el PDF: ' + error.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-download"></i> <span>Descargar Plan Completo 19 Semanas (PDF)</span>';
        }
    }

    // Helper function to convert hex to RGB
    function hexToRgb(hex) {
        if (!hex) return [102, 126, 234];
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : [102, 126, 234];
    }

    function getWeekIdForWeekNumber(weekNumber) {
        const startDate = new Date(programData.startDate);
        startDate.setDate(startDate.getDate() + ((weekNumber - 1) * 7));
        return ProgramUtils.getWeekId(startDate);
    }
});
