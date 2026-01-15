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
        // Mostrar loading state
        showLoadingState();

        try {
            programData = await ProgramUtils.loadProgramData();

            if (!programData) {
                showNoProgramMessage();
                return;
            }

            // Validar integridad de datos
            const validation = ProgramUtils.validateProgramData(programData);
            if (!validation.valid) {
                console.error('Program data validation failed:', validation.errors);
                showErrorMessage('Los datos del programa están incompletos o son inválidos.');
                return;
            }

            // Calcular contexto actual
            programContext = ProgramUtils.calculateProgramWeek(programData);

            if (!programContext) {
                showErrorMessage('No se pudo calcular el contexto del programa.');
                return;
            }

            currentWeekNumber = programContext.weekNumber;
            currentPhase = programContext.phase;

            renderHeroSection();
            renderPhaseTimeline();
            renderWeeksGrid();

        } catch (error) {
            console.error('Error loading program data:', error);
            showErrorMessage();
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
                // Navegar al calendario de esa semana
                const startDate = new Date(programData.startDate);
                startDate.setDate(startDate.getDate() + ((week.week - 1) * 7));
                const weekParam = ProgramUtils.getWeekId(startDate);
                window.location.href = `calendar.html?week=${weekParam}`;
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
});
