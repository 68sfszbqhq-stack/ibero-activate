// ========================================
// IA WELLNESS EXPERT - INTEGRAL BIENESTAR
// ========================================
// Conecta Salud Mental (Cuestionarios) + Salud Física (Caminatas Consciousness)

document.addEventListener('DOMContentLoaded', () => {
    waitForFirebase(initWellnessExpert);
});

function waitForFirebase(callback) {
    if (typeof db !== 'undefined' && db && typeof auth !== 'undefined') {
        callback();
    } else {
        console.log('Esperando a Firebase...');
        setTimeout(() => waitForFirebase(callback), 100);
    }
}

function initWellnessExpert() {
    // --- STATE ---
    let currentEmployee = JSON.parse(localStorage.getItem('currentEmployee'));
    let wellnessData = null;  // Datos Psicológicos
    let walkingData = null;   // Datos Físicos (Chi Walking)

    // --- DOM ELEMENTS ---
    const userNameDisplay = document.getElementById('user-name-display');
    const testsStatus = document.getElementById('tests-status');
    const apiKeyInput = document.getElementById('gemini-api-key');
    const generateBtn = document.getElementById('generate-btn');
    const loadingState = document.getElementById('loading-state');
    const resultsContainer = document.getElementById('results-container');

    // --- INIT ---
    if (!currentEmployee) {
        alert('No hay empleado activo. Regresando al inicio.');
        window.location.href = '../index.html';
        return;
    }

    // SEGURIDAD XSS
    const safeName = window.SecurityUtils
        ? window.SecurityUtils.escapeHTML(currentEmployee.name)
        : currentEmployee.name;
    if (userNameDisplay) userNameDisplay.textContent = safeName;

    // Load saved API key
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey && apiKeyInput) {
        apiKeyInput.value = savedKey;
    }

    // CARGAR DATOS INTEGRALES
    loadAllWellnessData();

    // --- EVENT LISTENERS ---
    if (generateBtn) {
        generateBtn.addEventListener('click', async () => {
            const apiKey = apiKeyInput.value.trim();

            if (!apiKey) {
                alert('Por favor ingresa tu API Key de Gemini');
                return;
            }

            // Validar que exista AL MENOS UN tipo de dato
            const hasWellness = wellnessData && wellnessData.totalTests > 0;
            const hasWalking = walkingData && walkingData.totalSessions > 0;

            if (!hasWellness && !hasWalking) {
                alert('Necesitas registrar actividad (Cuestionarios o Caminatas) para obtener recomendaciones.');
                return;
            }

            // Save API key
            localStorage.setItem('gemini_api_key', apiKey);

            try {
                loadingState.classList.remove('hidden');
                resultsContainer.classList.add('hidden');
                generateBtn.disabled = true;

                console.log('Generando recomendaciones integrales...');

                // LLAMADA A GEMINI CON CONTEXTO COMPLETO
                const recommendations = await generatePersonalizedRecommendations(wellnessData, walkingData, apiKey);

                displayRecommendations(recommendations);

            } catch (error) {
                console.error('Error:', error);
                alert('Error al generar: ' + error.message);
            } finally {
                loadingState.classList.add('hidden');
                generateBtn.disabled = false;
            }
        });
    }

    // --- DATA LOADING FUNCTIONS ---

    async function loadAllWellnessData() {
        await Promise.all([
            loadEmployeeWellnessData(),
            loadChiWalkingData()
        ]);
        console.log("Datos Integrales Cargados:", { wellnessData, walkingData });
    }

    async function loadEmployeeWellnessData() {
        try {
            const surveysSnapshot = await db.collection('employees')
                .doc(currentEmployee.id)
                .collection('health_surveys')
                .orderBy('timestamp', 'desc')
                .limit(10)
                .get();

            const testTypes = ['ansiedad', 'burnout', 'depresion', 'estres'];
            const latestTests = {};

            surveysSnapshot.forEach(doc => {
                const data = doc.data();
                const testType = data.type;

                if (testTypes.includes(testType) && !latestTests[testType]) {
                    latestTests[testType] = {
                        type: testType,
                        title: data.testTitle || testType,
                        score: data.score,
                        level: data.level
                    };
                }
            });

            wellnessData = {
                totalTests: Object.keys(latestTests).length,
                tests: latestTests
            };

            displayTestsStatus(latestTests);

        } catch (error) {
            console.error('Error loading wellness data:', error);
            if (testsStatus) testsStatus.innerHTML = '<p class="text-red-600">Error cargando cuestionarios.</p>';
        }
    }

    async function loadChiWalkingData() {
        try {
            const user = auth.currentUser;
            let email = currentEmployee.email; // Fallback
            if (user) email = user.email;

            // Consultar subcolección de caminatas detalladas
            // Nota: Usamos la colección global o subcolección según tu estructura.
            // Asumimos estructura: wellness_records/{email}/chi_sessions
            const walksSnapshot = await db.collection('wellness_records')
                .doc(email)
                .collection('chi_sessions')
                .orderBy('timestamp', 'desc')
                .limit(5) // Últimas 5 sesiones para contexto reciente
                .get();

            let sessions = [];
            let totalSteps = 0;
            let moodImprovementCount = 0;

            walksSnapshot.forEach(doc => {
                const data = doc.data();
                sessions.push(data);

                // Métrica: Pasos
                if (data.tech_values?.performance?.steps) {
                    totalSteps += data.tech_values.performance.steps;
                }

                // Métrica: Mejora de Ánimo (Mindful)
                const pre = data.tech_values?.mindful?.mood_pre;
                const post = data.tech_values?.mindful?.mood_post;
                if (isMoodImproved(pre, post)) moodImprovementCount++;
            });

            walkingData = {
                totalSessions: sessions.length,
                avgSteps: sessions.length > 0 ? Math.round(totalSteps / sessions.length) : 0,
                moodImprovementRate: sessions.length > 0 ? Math.round((moodImprovementCount / sessions.length) * 100) : 0,
                recentSessions: sessions
            };

        } catch (error) {
            console.error("Error cargando caminatas:", error);
            walkingData = { totalSessions: 0, recentSessions: [] };
        }
    }

    function isMoodImproved(pre, post) {
        // Mapa de valor emocional simple
        const moods = {
            'stressed': 1, 'tired': 2, 'neutral': 3,
            'good': 4, 'happy': 5, 'energized': 5, 'relaxed': 5
        };
        // Si no hay dato, asumimos neutral (3)
        const vPre = moods[pre] || 3;
        const vPost = moods[post] || 3;

        return vPost > vPre;
    }

    function displayTestsStatus(tests) {
        if (!testsStatus) return;

        const testTypes = [
            { id: 'ansiedad', name: 'Ansiedad', icon: 'fa-bolt' },
            { id: 'burnout', name: 'Burnout', icon: 'fa-fire' },
            { id: 'depresion', name: 'Depresión', icon: 'fa-cloud-rain' },
            { id: 'estres', name: 'Estrés', icon: 'fa-weight-hanging' }
        ];

        testsStatus.innerHTML = testTypes.map(testType => {
            const testData = tests[testType.id];
            return testData ?
                `<div class="badge badge-completed" style="display:inline-flex; align-items:center; gap:5px; padding:5px 10px; background:#e0f2f1; border-radius:15px; margin:2px; font-size:0.85em; color:#00695c;">
                    <i class="fa-solid ${testType.icon}"></i> ${testType.name}: ${testData.level} <i class="fa-solid fa-check-circle"></i>
                 </div>` :
                `<div class="badge badge-pending" style="display:inline-flex; align-items:center; gap:5px; padding:5px 10px; background:#f5f5f5; border-radius:15px; margin:2px; font-size:0.85em; color:#9e9e9e;">
                    <i class="fa-solid ${testType.icon}"></i> ${testType.name}
                 </div>`;
        }).join('');
    }

    // --- GEMINI AI INTEGRATION ---

    async function generatePersonalizedRecommendations(psychData, physData, apiKey) {
        // 1. Contexto Psicológico (Mental)
        let psychContext = "No hay datos recientes de salud mental.";
        if (psychData && psychData.totalTests > 0) {
            psychContext = Object.values(psychData.tests).map(t =>
                `- ${t.title}: Nivel ${t.level}`
            ).join('\n');
        }

        // 2. Contexto Físico (Chi Walking)
        let physContext = "No hay actividad física reciente registrada.";
        if (physData && physData.totalSessions > 0) {
            const lastSession = physData.recentSessions[0];
            const lastSteps = lastSession.tech_values?.performance?.steps || 0;
            const lastBorg = lastSession.tech_values?.perception?.borg_scale || 0;

            physContext = `
            - Sesiones recientes: ${physData.totalSessions}
            - Promedio pasos: ${physData.avgSteps} (Meta: 7000)
            - Mejora anímica post-caminata: ${physData.moodImprovementRate}% de las veces.
            - Última sesión: ${lastSteps} pasos, Esfuerzo Percibido (Borg): ${lastBorg}/10.
            - Gratitud reciente: "${lastSession.tech_values?.mindful?.gratitude_log || 'Ninguna'}"
            `;
        }

        const prompt = `
        Actúa como un Coach de Bienestar Integral experto en Salud Ocupacional Ignaciana (Cura Personalis).
        Analiza al siguiente empleado:

        [SALUD MENTAL]
        ${psychContext}

        [ACTIVIDAD FÍSICA Y MINDFULNESS (Chi Walking)]
        ${physContext}

        TU MISIÓN:
        Generar 3 recomendaciones BREVES y CONCRETAS que conecten su estado mental con su actividad física.
        
        EJEMPLO DE CONEXIÓN:
        "Veo que tienes Ansiedad Alta pero caminas poco. Inicia con caminatas de 10 min enfocadas solo en respirar (Borg 3), esto reducirá tu cortisol."
        
        FORMATO JSON OBLIGATORIO (Responde SOLO el JSON):
        {
            "recomendaciones_integrales": [
                "Recomendación 1 conectando mente-cuerpo",
                "Recomendación 2 sobre técnica o hábito",
                "Recomendación 3 de autocuidado"
            ],
            "insight_clave": "Una frase poderosa basada en sus datos (ej: 'Tu ánimo mejora un 80% cuando caminas, úsalo como medicina')."
        }
        `;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: "user", parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.7 }
                })
            }
        );

        if (!response.ok) throw new Error('Error al conectar con Gemini AI');

        const result = await response.json();
        let text = result.candidates[0].content.parts[0].text;

        // Limpiar markdown del JSON
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(text);
    }

    function displayRecommendations(data) {
        if (!resultsContainer) return;

        // Limpiar contenedor
        resultsContainer.innerHTML = '';

        // Título
        const title = document.createElement('h3');
        title.className = "text-xl font-bold text-gray-800 mb-4";
        title.innerText = "Tu Plan de Bienestar 360°";
        resultsContainer.appendChild(title);

        // Insight Clave (Destacado)
        if (data.insight_clave) {
            const insightDiv = document.createElement('div');
            insightDiv.className = "bg-indigo-50 border-l-4 border-indigo-500 p-4 mb-6 rounded-r";
            insightDiv.innerHTML = `
                <p class="font-bold text-indigo-700">💡 Insight Clave</p>
                <p class="text-gray-700 italic">"${data.insight_clave}"</p>
            `;
            resultsContainer.appendChild(insightDiv);
        }

        // Recomendaciones (Lista)
        const list = document.createElement('ul');
        list.className = "space-y-3";

        data.recomendaciones_integrales.forEach(rec => {
            const li = document.createElement('li');
            li.className = "flex items-start gap-3 bg-white p-3 rounded-lg shadow-sm border border-gray-100";
            li.innerHTML = `
                <i class="fa-solid fa-person-walking-arrow-right text-green-500 mt-1"></i>
                <span class="text-gray-700 text-sm">${rec}</span>
            `;
            list.appendChild(li);
        });
        resultsContainer.appendChild(list);

        // Mostrar
        resultsContainer.classList.remove('hidden');
        resultsContainer.scrollIntoView({ behavior: 'smooth' });

        // Ocultar botón PDF antiguo si existe (o adaptarlo)
        const pdfBtn = document.getElementById('export-pdf-btn');
        if (pdfBtn) pdfBtn.style.display = 'none'; // Desactivado temporalmente en esta versión simple
    }
}
