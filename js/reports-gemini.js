// Reportes inteligentes con Gemini AI

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

    // Cargar API key guardada
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

        // Guardar API key
        localStorage.setItem('gemini_api_key', apiKey);

        try {
            // Mostrar loading
            loadingState.classList.remove('hidden');
            reportContainer.classList.add('hidden');
            generateBtn.disabled = true;

            // 1. Agregar datos
            console.log('Agregando datos del período:', period);
            const reportData = await aggregateDataForReport(period);

            // 2. Generar reporte con IA
            console.log('Generando análisis con Gemini IA...');
            const aiReport = await generateAIReport(reportData, apiKey);

            // 3. Mostrar reporte
            displayReport(aiReport, reportData);

        } catch (error) {
            console.error('Error generando reporte:', error);
            alert('Error: ' + error.message);
        } finally {
            loadingState.classList.add('hidden');
            generateBtn.disabled = false;
        }
    });

    function displayReport(aiReport, data) {
        // Convertir markdown a HTML básico
        let html = aiReport
            .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/^# (.+)$/gm, '<h1>$1</h1>')
            .replace(/^- (.+)$/gm, '<li>$1</li>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/<li>/g, '<ul><li>')
            .replace(/<\/li>(?!\n<li>)/g, '</li></ul>');

        html = '<p>' + html + '</p>';

        reportContent.innerHTML = html;
        document.getElementById('report-date').textContent =
            `Generado: ${new Date().toLocaleString('es-MX')} | Período: ${translatePeriod(data.period)}`;

        reportContainer.classList.remove('hidden');
        reportContainer.scrollIntoView({ behavior: 'smooth' });
    }

    function translatePeriod(period) {
        const translations = {
            'daily': 'Último Día',
            'weekly': 'Última Semana',
            'monthly': 'Último Mes'
        };
        return translations[period] || period;
    }

    // Exportar a PDF
    document.getElementById('export-pdf-btn')?.addEventListener('click', () => {
        window.print();
    });
}

// Función para agregar datos del período
async function aggregateDataForReport(period = 'weekly') {
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

    // Obtener todos los empleados
    const employees = await db.collection('employees').get();

    const reportData = {
        period: period,
        startDate: startDateStr,
        endDate: new Date().toISOString().split('T')[0],
        totalEmployees: employees.size,
        employeeMetrics: [],
        globalStats: {
            totalAttendances: 0,
            avgFeedbackRating: 0,
            burnoutLevels: [],
            anxietyLevels: [],
            depressionLevels: []
        }
    };

    // Usar Promise.all para mejor performance
    const employeePromises = employees.docs.map(async (empDoc) => {
        const empId = empDoc.id;
        const empData = empDoc.data();

        // Obtener datos en paralelo
        const [attendances, healthSurveys, feedbacks] = await Promise.all([
            db.collection('employees').doc(empId).collection('attendance')
                .where('date', '>=', startDateStr).get(),
            db.collection('employees').doc(empId).collection('health_surveys')
                .where('date', '>=', startDateStr).get(),
            db.collection('employees').doc(empId).collection('feedback')
                .where('date', '>=', startDateStr).get()
        ]);

        const empMetric = {
            name: empData.fullName,
            attendanceCount: attendances.size,
            healthTests: [],
            avgFeedback: 0,
            feedbackCount: feedbacks.size
        };

        // Procesar health surveys
        healthSurveys.forEach(doc => {
            const data = doc.data();
            empMetric.healthTests.push({
                type: data.type,
                level: data.level,
                score: data.score,
                date: data.date
            });
        });

        // Calcular avg feedback
        let totalRating = 0;
        feedbacks.forEach(doc => {
            totalRating += doc.data().rating || 0;
        });
        empMetric.avgFeedback = feedbacks.size > 0 ?
            (totalRating / feedbacks.size).toFixed(1) : 0;

        return empMetric;
    });

    reportData.employeeMetrics = await Promise.all(employeePromises);

    // Calcular stats globales
    reportData.globalStats.totalAttendances = reportData.employeeMetrics.reduce(
        (sum, emp) => sum + emp.attendanceCount, 0
    );

    const totalFeedbackRating = reportData.employeeMetrics.reduce(
        (sum, emp) => sum + parseFloat(emp.avgFeedback || 0), 0
    );
    reportData.globalStats.avgFeedbackRating =
        (totalFeedbackRating / reportData.employeeMetrics.filter(e => e.avgFeedback > 0).length).toFixed(1);

    // Extraer niveles de salud mental
    reportData.employeeMetrics.forEach(emp => {
        emp.healthTests.forEach(test => {
            if (test.type === 'burnout') {
                reportData.globalStats.burnoutLevels.push({
                    employee: emp.name,
                    level: test.level,
                    score: test.score
                });
            }
            if (test.type === 'ansiedad') {
                reportData.globalStats.anxietyLevels.push({
                    employee: emp.name,
                    level: test.level,
                    score: test.score
                });
            }
            if (test.type === 'depresion') {
                reportData.globalStats.depressionLevels.push({
                    employee: emp.name,
                    level: test.level,
                    score: test.score
                });
            }
        });
    });

    return reportData;
}

// Función para llamar a Gemini API
async function generateAIReport(reportData, apiKey) {
    const prompt = `Eres un analista de recursos humanos especializado en bienestar laboral y salud mental organizacional. Analiza los siguientes datos de un programa de pausas activas en una universidad y genera un reporte ejecutivo.

DATOS DEL PERÍODO (${reportData.period.toUpperCase()}):
- Período: ${reportData.startDate} a ${reportData.endDate}
- Total de empleados: ${reportData.totalEmployees}
- Total de asistencias: ${reportData.globalStats.totalAttendances}
- Calificación promedio de actividades: ${reportData.globalStats.avgFeedbackRating}/5

MÉTRICAS POR EMPLEADO (Top 10 más activos):
${reportData.employeeMetrics
            .sort((a, b) => b.attendanceCount - a.attendanceCount)
            .slice(0, 10)
            .map(emp => `- ${emp.name}: ${emp.attendanceCount} asistencias, ${emp.healthTests.length} tests, rating: ${emp.avgFeedback}/5`)
            .join('\n')}

NIVELES DE BURNOUT REGISTRADOS:
${reportData.globalStats.burnoutLevels.length > 0 ?
            reportData.globalStats.burnoutLevels.slice(0, 5).map(b => `- ${b.employee}: ${b.level} (${b.score} pts)`).join('\n') :
            'No hay datos de burnout en este período'}

NIVELES DE ANSIEDAD:
${reportData.globalStats.anxietyLevels.length > 0 ?
            reportData.globalStats.anxietyLevels.slice(0, 5).map(a => `- ${a.employee}: ${a.level} (${a.score} pts)`).join('\n') :
            'No hay datos de ansiedad en este período'}

---

GENERA UN REPORTE EJECUTIVO QUE INCLUYA:

1. **RESUMEN EJECUTIVO** (2-3 líneas)
   Un overview del estado general del programa

2. **HALLAZGOS CLAVE** (3-5 puntos bullet)
   Insights más importantes encontrados en los datos

3. **CORRELACIONES DETECTADAS**
   ¿Existe correlación entre asistencia y niveles de burnout/ansiedad?

4. **TENDENCIAS POSITIVAS**
   ¿Qué está funcionando bien?

5. **ÁREAS DE OPORTUNIDAD**
   ¿Dónde se puede mejorar?

6. **RECOMENDACIONES ESPECÍFICAS** (3-5 acciones concretas)
   Pasos para mejorar el programa

7. **VALIDACIÓN DE HIPÓTESIS**
   ¿Los datos apoyan que empleados con alta asistencia tienen menor burnout?

Usa lenguaje profesional pero accesible. Incluye porcentajes y números cuando sea relevante.`;

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2048,
                }
            })
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Error llamando a Gemini API');
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}
