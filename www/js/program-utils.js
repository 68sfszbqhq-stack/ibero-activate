// Program Periodization Utilities
// Funciones compartidas para cálculos de periodización

const ProgramUtils = {
    /**
     * Carga los datos del programa de periodización desde Firestore
     * @returns {Promise<Object|null>} Datos del programa o null si no existe
     */
    async loadProgramData() {
        try {
            const doc = await db.collection('program_periodization')
                .doc('current_macrocycle')
                .get();
            return doc.exists ? doc.data() : null;
        } catch (error) {
            console.error('Error loading program data:', error);
            return null;
        }
    },

    /**
     * Valida la integridad de los datos del programa
     * @param {Object} data - Datos del programa
     * @returns {Object} { valid: boolean, errors: string[] }
     */
    validateProgramData(data) {
        const errors = [];

        if (!data) {
            errors.push('Program data is null');
            return { valid: false, errors };
        }

        if (!data.startDate || isNaN(new Date(data.startDate).getTime())) {
            errors.push('Invalid or missing startDate');
        }

        if (!data.totalWeeks || data.totalWeeks <= 0) {
            errors.push('Invalid totalWeeks');
        }

        if (!Array.isArray(data.phases) || data.phases.length === 0) {
            errors.push('Phases array is empty or invalid');
        }

        if (!Array.isArray(data.weeklySchedule)) {
            errors.push('weeklySchedule is not an array');
        } else if (data.weeklySchedule.length !== data.totalWeeks) {
            errors.push(`weeklySchedule length (${data.weeklySchedule.length}) does not match totalWeeks (${data.totalWeeks})`);
        }

        return {
            valid: errors.length === 0,
            errors
        };
    },

    /**
     * Calcula el contexto actual del programa (semana, fase, progreso)
     * @param {Object} programData - Datos del programa
     * @param {Date} date - Fecha para calcular (default: hoy)
     * @returns {Object|null} Contexto del programa o null si datos inválidos
     */
    calculateProgramWeek(programData, date = new Date()) {
        if (!programData || !programData.startDate) {
            return null;
        }

        const startDate = new Date(programData.startDate);
        startDate.setHours(0, 0, 0, 0);

        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);

        // Calcular fecha de fin
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + (programData.totalWeeks * 7));

        // CASO 1: Programa no ha iniciado
        if (checkDate < startDate) {
            const daysUntilStart = Math.ceil((startDate - checkDate) / (1000 * 60 * 60 * 24));
            return {
                weekNumber: 0,
                phase: null,
                weekSchedule: null,
                totalWeeks: programData.totalWeeks,
                progress: 0,
                status: 'not_started',
                daysUntilStart,
                daysRemaining: (programData.totalWeeks * 7) + daysUntilStart
            };
        }

        // CASO 2: Programa ha finalizado
        if (checkDate >= endDate) {
            const lastPhase = programData.phases[programData.phases.length - 1];
            return {
                weekNumber: programData.totalWeeks,
                phase: lastPhase,
                weekSchedule: programData.weeklySchedule?.[programData.totalWeeks - 1],
                totalWeeks: programData.totalWeeks,
                progress: 100,
                status: 'completed',
                daysUntilStart: 0,
                daysRemaining: 0
            };
        }

        // CASO 3: Programa en curso
        const diffTime = checkDate - startDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const weekNumber = Math.max(1, Math.min(
            Math.floor(diffDays / 7) + 1,
            programData.totalWeeks
        ));

        // Encontrar fase actual
        const phase = programData.phases.find(p =>
            weekNumber >= p.weekRange[0] && weekNumber <= p.weekRange[1]
        );

        // Encontrar plan semanal
        const weekSchedule = programData.weeklySchedule?.find(w => w.week === weekNumber);

        // Calcular días restantes
        const daysRemaining = Math.max(0, Math.floor((endDate - checkDate) / (1000 * 60 * 60 * 24)));

        return {
            weekNumber,
            phase,
            weekSchedule,
            totalWeeks: programData.totalWeeks,
            progress: (weekNumber / programData.totalWeeks) * 100,
            status: 'in_progress',
            daysUntilStart: 0,
            daysRemaining
        };
    },

    /**
     * Genera un ID de semana en formato YYYY-W#
     * @param {Date} date - Fecha para la cual generar el ID
     * @returns {string} ID de semana (ej: "2026-W5")
     */
    getWeekId(date) {
        const year = date.getFullYear();
        const oneJan = new Date(year, 0, 1);
        const numberOfDays = Math.floor((date - oneJan) / (24 * 60 * 60 * 1000));
        const week = Math.ceil((date.getDay() + 1 + numberOfDays) / 7);
        return `${year}-W${week}`;
    },

    /**
     * Oscurece un color hexadecimal
     * @param {string} hex - Color en formato hex (ej: "#667eea")
     * @param {number} percent - Porcentaje a oscurecer (0-100)
     * @returns {string} Color oscurecido en hex
     */
    darkenColor(hex, percent) {
        // Remover # si existe
        const cleanHex = hex.replace('#', '');
        const num = parseInt(cleanHex, 16);

        // Calcular cantidad a restar
        const amt = Math.round(2.55 * percent);

        // Extraer componentes RGB y oscurecer
        const R = Math.max(0, Math.min(255, (num >> 16) - amt));
        const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) - amt));
        const B = Math.max(0, Math.min(255, (num & 0x0000FF) - amt));

        // Reconstruir hex
        const result = (R << 16) | (G << 8) | B;
        return '#' + result.toString(16).padStart(6, '0');
    },

    /**
     * Formatea una clave de métrica para mostrar
     * @param {string} key - Clave de la métrica
     * @returns {string} Nombre legible
     */
    formatMetricKey(key) {
        const map = {
            'intensidadFC': 'Intensidad FC',
            'volumen': 'Volumen',
            'cargaSocial': 'Carga Social',
            'participacionObjetivo': 'Participación Objetivo',
            'especificidad': 'Especificidad',
            'intensidadCognitiva': 'Intensidad Cognitiva',
            'cargaEstrategica': 'Carga Estratégica',
            'periodizacion': 'Periodización',
            'intensidad': 'Intensidad',
            'autonomia': 'Autonomía',
            'enfoque': 'Enfoque'
        };
        return map[key] || key;
    },

    /**
     * Escapa HTML para prevenir XSS
     * @param {string} text - Texto a escapar
     * @returns {string} Texto escapado
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Hacer disponible globalmente
window.ProgramUtils = ProgramUtils;
