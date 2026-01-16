// Reportes inteligentes con Gemini AI - Versión Anónima Multi-Experto
// ACTUALIZADO: Con sanitización XSS

// Esperar a que Firebase esté listo
function waitForFirebase(callback) {
    if (typeof db !== 'undefined' && db) {
        callback();
    } else {
        console.log('Esperando a Firebase...');
        setTimeout(() => waitForFirebase(callback), 100);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    waitForFirebase(initReports);
});

function initReports() {
    const generateBtn = document.getElementById('generate-report-btn');
    const reportContainer = document.getElementById('report-container');
    const reportContent = document.getElementById('report-content');
    const loadingState = document.getElementById('loading-state');
    const periodSelect = document.getElementById('report-period');
    const apiKeyInput = document.getElementById('gemini-api-key');

    // Cargar API key guardada (ADVERTENCIA: Ver recomendaciones de seguridad)
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
        apiKeyInput.value = savedKey;
    }

    generateBtn.addEventListener('click', async () => {
        const apiKey = apiKeyInput.value.trim();
        const period = periodSelect.value;

        if (!apiKey) {
            alert('Por favor ingresa tu API Key de Gemini');
            return;
        }

        // SEGURIDAD: Validar formato de API key
        if (!apiKey.match(/^[A-Za-z0-9_-]{20,}$/)) {
            alert('⚠️ Formato de API Key inválido');
            window.SecurityUtils?.SecurityLogger.warn('Invalid API key format attempted');
            return;
        }

        localStorage.setItem('gemini_api_key', apiKey);

        try {
            loadingState.classList.remove('hidden');
            reportContainer.classList.add('hidden');
            generateBtn.disabled = true;

            console.log('Recopilando datos anónimos por departamento...');
            const anonymousData = await aggregateAnonymousData(period);

            console.log('Enviando a Gemini para análisis multi-experto...');
            const aiReport = await generateMultiExpertReport(anonymousData, apiKey);

            displayReport(aiReport, anonymousData);

        } catch (error) {
            console.error('Error:', error);
            const errorMsg = window.SecurityUtils
                ? window.SecurityUtils.escapeHTML(error.message)
                : 'Error al generar reporte';
            alert('Error: ' + errorMsg);
        } finally {
            loadingState.classList.add('hidden');
            generateBtn.disabled = false;
        }
    });

    function displayReport(aiReport, data) {
        // SEGURIDAD XSS: Usar sanitización de markdown
        const sanitizedHTML = window.SecurityUtils
            ? window.SecurityUtils.formatAIResponse(aiReport)
            : escapeBasicHTML(aiReport);

        reportContent.innerHTML = sanitizedHTML;

        const periodText = window.SecurityUtils
            ? window.SecurityUtils.escapeHTML(translatePeriod(data.period))
            : translatePeriod(data.period);

        document.getElementById('report-date').textContent =
            `Generado: ${new Date().toLocaleString('es-MX')} | Período: ${periodText}`;

        reportContainer.classList.remove('hidden');
        reportContainer.scrollIntoView({ behavior: 'smooth' });
    }

    // Función de escape básica como fallback
    function escapeBasicHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function translatePeriod(period) {
        const translations = {
            'daily': 'Último Día',
            'weekly': 'Última Semana',
            'monthly': 'Último Mes'
        };
        return translations[period] || period;
    }

    document.getElementById('export-pdf-btn')?.addEventListener('click', () => {
        window.print();
    });
}

// Recopilar datos ANÓNIMOS agregados por departamento
async function aggregateAnonymousData(period = 'weekly') {
    const now = new Date();
    let startDate;

    switch (period) {
        case 'daily':
            startDate = new Date(now.setDate(now.getDate() - 1));
            break;
        case 'weekly':
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
        case 'monthly':
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
    }

    const startDateStr = startDate.toISOString().split('T')[0];

    // Cargar áreas/departamentos
    const areasSnapshot = await db.collection('areas').get();
    const areasMap = {};
    areasSnapshot.forEach(doc => {
        // SEGURIDAD: Sanitizar nombres de áreas
        const areaName = window.SecurityUtils
            ? window.SecurityUtils.escapeHTML(doc.data().name)
            : doc.data().name;
        areasMap[doc.id] = areaName;
    });

    const employeesSnapshot = await db.collection('employees').get();

    // Estructura de datos anónimos por departamento
    const departmentStats = {};

    // Inicializar
    Object.values(areasMap).forEach(areaName => {
        departmentStats[areaName] = {
            empleados: 0,
            asistencias: 0,
            tasaAsistencia: 0,
            feedbacks: 0,
            promedioSatisfaccion: 0,
            burnout: { bajo: 0, moderado: 0, alto: 0, muyAlto: 0 },
            ansiedad: { bajo: 0, moderado: 0, alto: 0, muyAlto: 0 },
            depresion: { bajo: 0, moderado: 0, alto: 0, muyAlto: 0 }
        };
    });

    // Agregar categoría para empleados sin departamento
    departmentStats['Sin Departamento Asignado'] = {
        empleados: 0,
        asistencias: 0,
        tasaAsistencia: 0,
        feedbacks: 0,
        promedioSatisfaccion: 0,
        burnout: { bajo: 0, moderado: 0, alto: 0, muyAlto: 0 },
        ansiedad: { bajo: 0, moderado: 0, alto: 0, muyAlto: 0 },
        depresion: { bajo: 0, moderado: 0, alto: 0, muyAlto: 0 }
    };

    // Procesar cada empleado (SIN guardar nombres ni números de cuenta)
    const employeePromises = employeesSnapshot.docs.map(async (empDoc) => {
        const empId = empDoc.id;
        const empData = empDoc.data();
        const deptName = areasMap[empData.areaId] || 'Sin Departamento Asignado';

        departmentStats[deptName].empleados++;

        const [attendances, healthSurveys, feedbacks] = await Promise.all([
            db.collection('employees').doc(empId).collection('attendance')
                .where('date', '>=', startDateStr).get(),
            db.collection('employees').doc(empId).collection('health_surveys')
                .where('date', '>=', startDateStr).get(),
            db.collection('employees').doc(empId).collection('feedback')
                .where('date', '>=', startDateStr).get()
        ]);

        departmentStats[deptName].asistencias += attendances.size;
        departmentStats[deptName].feedbacks += feedbacks.size;

        // Tests de salud mental (solo conteos por nivel)
        healthSurveys.forEach(doc => {
            const data = doc.data();
            const level = data.level || 'moderado';

            if (data.type === 'burnout' && departmentStats[deptName].burnout[level] !== undefined) {
                departmentStats[deptName].burnout[level]++;
            }
            if (data.type === 'ansiedad' && departmentStats[deptName].ansiedad[level] !== undefined) {
                departmentStats[deptName].ansiedad[level]++;
            }
            if (data.type === 'depresion' && departmentStats[deptName].depresion[level] !== undefined) {
                departmentStats[deptName].depresion[level]++;
            }
        });

        // Satisfacción
        let totalRating = 0;
        feedbacks.forEach(doc => {
            totalRating += doc.data().rating || 0;
        });

        return {
            dept: deptName,
            feedbackCount: feedbacks.size,
            totalRating: totalRating
        };
    });

    const results = await Promise.all(employeePromises);

    // Calcular promedios
    results.forEach(r => {
        if (r.feedbackCount > 0 && departmentStats[r.dept]) {
            departmentStats[r.dept].promedioSatisfaccion += r.totalRating;
        }
    });

    Object.keys(departmentStats).forEach(dept => {
        const stats = departmentStats[dept];
        if (stats.empleados > 0) {
            const dias = period === 'daily' ? 1 : period === 'weekly' ? 7 : 30;
            stats.tasaAsistencia = ((stats.asistencias / stats.empleados) / dias * 100).toFixed(1);
        }
        if (stats.feedbacks > 0) {
            stats.promedioSatisfaccion = (stats.promedioSatisfaccion / stats.feedbacks).toFixed(1);
        }
    });

    return {
        period: period,
        startDate: startDateStr,
        endDate: new Date().toISOString().split('T')[0],
        totalEmpleados: employeesSnapshot.size,
        departamentos: departmentStats
    };
}

// Generar análisis con Gemini desde 3 perspectivas de expertos
async function generateMultiExpertReport(data, apiKey) {
    // Formatear datos para el prompt (ya sanitizados)
    const deptSummary = Object.entries(data.departamentos)
        .filter(([_, stats]) => stats.empleados > 0)
        .map(([dept, stats]) => {
            const totalTests = Object.values(stats.burnout).reduce((a, b) => a + b, 0) +
                Object.values(stats.ansiedad).reduce((a, b) => a + b, 0) +
                Object.values(stats.depresion).reduce((a, b) => a + b, 0);

            return `${dept}:
  - Empleados: ${stats.empleados}
  - Asistencias: ${stats.asistencias} (tasa: ${stats.tasaAsistencia}%)
  - Satisfacción promedio: ${stats.promedioSatisfaccion}/5
  - Tests de salud: ${totalTests} realizados
    * Burnout: ${stats.burnout.bajo} bajo, ${stats.burnout.moderado} mod, ${stats.burnout.alto} alto, ${stats.burnout.muyAlto} muy alto
    * Ansiedad: ${stats.ansiedad.bajo} bajo, ${stats.ansiedad.moderado} mod, ${stats.ansiedad.alto} alto, ${stats.ansiedad.muyAlto} muy alto`;
        }).join('\n\n');

    const prompt = `Eres un panel de 3 expertos analizando datos ANÓNIMOS de un programa de bienestar laboral (pausas activas) en una universidad.

DATOS AGREGADOS POR DEPARTAMENTO (${data.period.toUpperCase()}):
Período: ${data.startDate} a ${data.endDate}
Total empleados: ${data.totalEmpleados}

${deptSummary}

---

INSTRUCCIONES:
Analiza estos datos desde 3 perspectivas expertas diferentes y genera un reporte integrado:

**EXPERTO 1: Especialista en Riesgos Laborales y Salud Ocupacional**
- Identifica riesgos psicosociales por departamento
- Evalúa indicadores de burnout, ansiedad y depresión
- Señala departamentos en "zona roja" que requieren intervención urgente
- Recomienda medidas preventivas y correctivas

**EXPERTO 2: Especialista en Liderazgo, Comunicación y Desarrollo Personal**
- Analiza participación y engagement por departamento
- Identifica oportunidades de liderazgo y trabajo en equipo
- Sugiere estrategias de comunicación interna
- Propone iniciativas de desarrollo y crecimiento personal

**EXPERTO 3: Psicólogo Organizacional / Especialista en Bienestar Corporativo**
- Evalúa clima laboral y satisfacción
- Analiza correlación entre participación y bienestar mental
- Identifica patrones de comportamiento colectivo
- Recomienda programas de bienestar personalizados por departamento

---

FORMATO DEL REPORTE:

# Reporte Multi-Experto de Bienestar Laboral

## RESUMEN EJECUTIVO
(2-3 líneas sobre el estado general)

## ANÁLISIS POR EXPERTO

### 🛡️ Perspectiva: Riesgos Laborales
**Hallazgos:**
- (3-4 puntos clave)

**Departamentos de Riesgo Alto:**
- (listar si aplica)

**Recomendaciones Inmediatas:**
1. (acción específica)
2. (acción específica)

### 💡 Perspectiva: Liderazgo y Desarrollo
**Hallazgos:**
- (3-4 puntos clave)

**Oportunidades de Mejora:**
- (específicas por dept si es posible)

**Estrategias Sugeridas:**
1. (acción específica)
2. (acción específica)

### 🧠 Perspectiva: Psicología Organizacional
**Hallazgos:**
- (3-4 puntos clave)

**Correlaciones Detectadas:**
- (relaciones entre variables)

**Programas Recomendados:**
1. (programa específico)
2. (programa específico)

## PLAN DE ACCIÓN INTEGRADO
(Combina las 3 perspectivas en 5-7 acciones prioritarias concretas, ordenadas por urgencia)

## INDICADORES CLAVE A MONITOREAR
(3-5 métricas específicas para seguimiento)

---

Sé específico, usa datos concretos, y mantén un tono profesional pero empático. Los nombres de departamentos son reales pero NO menciones ningún dato personal individual.`;

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.8,
                    maxOutputTokens: 3072,
                }
            })
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Error llamando a Gemini API');
    }

    const result = await response.json();

    // SEGURIDAD: Log de uso de API
    window.SecurityUtils?.SecurityLogger.log('Gemini API called', {
        period: data.period,
        departments: Object.keys(data.departamentos).length
    });

    return result.candidates[0].content.parts[0].text;
}
