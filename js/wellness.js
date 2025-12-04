document.addEventListener('DOMContentLoaded', () => {
    // --- STATE ---
    let currentEmployee = JSON.parse(localStorage.getItem('currentEmployee'));
    let currentTestId = null;

    // --- DOM ELEMENTS ---
    const testGrid = document.getElementById('test-grid');
    const testInterface = document.getElementById('test-interface');
    const testForm = document.getElementById('test-form');
    const testTitle = document.getElementById('test-title');
    const closeTestBtn = document.getElementById('close-test-btn');
    const submitTestBtn = document.getElementById('submit-test-btn');
    const successModal = document.getElementById('success-modal');
    const closeSuccessBtn = document.getElementById('close-success-btn');
    const progressBar = document.getElementById('progress-bar');
    const userNameDisplay = document.getElementById('user-name-display');

    // --- INIT ---
    if (currentEmployee) {
        userNameDisplay.textContent = currentEmployee.name;
    } else {
        // Fallback for demo/testing if no employee selected
        // In production, redirect to login or selection
        userNameDisplay.textContent = "Invitado";
    }

    // --- TEST DATA DEFINITIONS ---
    const TESTS = {
        ansiedad: {
            id: 'ansiedad',
            title: 'Test de Ansiedad Laboral',
            icon: 'fa-bolt',
            color: 'from-amber-400 to-orange-500',
            description: 'Evalúa síntomas de ansiedad relacionados con el entorno laboral.',
            questions: [
                "Me siento nervioso o ansioso antes de ir al trabajo.",
                "Tengo dificultades para concentrarme en mis tareas debido a preocupaciones laborales.",
                "Siento que mi trabajo me abruma frecuentemente.",
                "Me preocupo constantemente por cometer errores en mi trabajo.",
                "Siento tensión o presión en el pecho cuando pienso en mis responsabilidades laborales.",
                "Tengo problemas para dormir porque pienso en mi trabajo.",
                "Me siento irritable o impaciente con mis compañeros de trabajo.",
                "Siento que no puedo cumplir con las expectativas de mi jefe o equipo.",
                "Experimentó palpitaciones o taquicardia cuando estoy en el trabajo.",
                "Me siento agotado emocionalmente por las demandas de mi trabajo.",
                "Tengo miedo de no poder manejar situaciones difíciles en el trabajo.",
                "Siento que mi trabajo afecta negativamente mi vida personal.",
                "Me preocupo por mi desempeño laboral incluso fuera del horario de trabajo.",
                "Siento que no tengo control sobre las exigencias de mi trabajo.",
                "Tengo pensamientos recurrentes sobre problemas laborales que no puedo controlar.",
                "Siento una sensación de inquietud o nerviosismo durante mi jornada laboral.",
                "Me siento inseguro sobre mi capacidad para realizar mis tareas laborales.",
                "Siento que mi trabajo me genera estrés constante.",
                "Tengo síntomas físicos (como dolores de cabeza o estómago) relacionados con mi trabajo.",
                "Me siento ansioso por el futuro de mi carrera o estabilidad laboral."
            ],
            options: [
                { label: "Nunca", value: 1 },
                { label: "A veces", value: 2 },
                { label: "Frecuentemente", value: 3 },
                { label: "Siempre", value: 4 }
            ],
            calculate: (answers) => {
                const total = answers.reduce((a, b) => a + b, 0);
                // Logic from PHP: round((($total_score - 20) / (80 - 20)) * (10 - 1) + 1);
                let levelNum = Math.round(((total - 20) / 60) * 9 + 1);
                levelNum = Math.max(1, Math.min(10, levelNum));

                let levelText = "Bajo";
                if (levelNum > 8) levelText = "Muy Alto";
                else if (levelNum > 6) levelText = "Alto";
                else if (levelNum > 3) levelText = "Moderado";

                return { score: levelNum, level: levelText, rawScore: total };
            }
        },
        burnout: {
            id: 'burnout',
            title: 'Test de Burnout (Maslach)',
            icon: 'fa-fire',
            color: 'from-red-500 to-rose-600',
            description: 'Mide el desgaste profesional, despersonalización y realización personal.',
            questions: [
                "Debido a mi trabajo me siento emocionalmente agotado o agotada.",
                "Al final del día me siento agotado o agotada.",
                "Me encuentro cansado o cansada cuando me levanto por la mañana y tengo que enfrentarme a otro día de trabajo.",
                "Puedo entender con facilidad lo que piensan las personas con quienes trabajo.",
                "Creo que trato a las personas como si fueran objetos.",
                "Trabajar con personas todos los días es una tensión para mí.",
                "Me enfrento muy bien a los problemas de trabajo que se me presentan.",
                "Me siento 'quemado' o 'quemada' por mi trabajo.",
                "Siento que con mi trabajo estoy influyendo positivamente en la vida de otros.",
                "Creo que tengo un trato más insensible con las personas desde que tengo este trabajo.",
                "Me preocupa que este trabajo me esté endureciendo emocionalmente.",
                "Me encuentro con mucha vitalidad.",
                "Me siento frustrado por mi trabajo.",
                "Siento que estoy haciendo un trabajo muy duro.",
                "Realmente no me importa lo que pueda suceder a las personas que me rodean.",
                "Trabajar directamente con personas me produce estrés.",
                "Tengo facilidad para crear un ambiente de confianza con las personas con quienes trabajo.",
                "Me encuentro relajado después de una junta de trabajo.",
                "He realizado muchas cosas que valen la pena en este trabajo.",
                "En el trabajo siento que estoy al límite de mis posibilidades.",
                "Siento que sé tratar de forma adecuada los problemas emocionales en el trabajo.",
                "Siento que las personas en mi trabajo me culpan de algunos de sus problemas."
            ],
            options: [
                { label: "Nunca", value: 0 },
                { label: "Alguna vez al año", value: 1 },
                { label: "Una vez al mes", value: 2 },
                { label: "Algunas veces al mes", value: 3 },
                { label: "Una vez a la semana", value: 4 },
                { label: "Varias veces a la semana", value: 5 },
                { label: "Todos los días", value: 6 }
            ],
            calculate: (answers) => {
                // Indices are 0-based here, PHP was 1-based
                const ee_indices = [0, 1, 2, 5, 7, 12, 13, 15, 19];
                const d_indices = [4, 9, 10, 14, 21];
                const pa_indices = [3, 6, 8, 11, 16, 17, 18, 20];

                let ee = 0, d = 0, pa = 0;
                ee_indices.forEach(i => ee += answers[i]);
                d_indices.forEach(i => d += answers[i]);
                pa_indices.forEach(i => pa += answers[i]);

                const ee_norm = (ee / 54) * 100;
                const d_norm = (d / 30) * 100;
                const pa_norm = 100 - ((pa / 48) * 100);

                const score = (0.4 * ee_norm + 0.4 * d_norm + 0.2 * pa_norm) / 10;
                let levelNum = Math.round(Math.min(Math.max(score, 1), 10));

                let levelText = "Bajo";
                if (levelNum > 8) levelText = "Muy Alto";
                else if (levelNum > 6) levelText = "Alto";
                else if (levelNum > 3) levelText = "Moderado";

                return {
                    score: levelNum,
                    level: levelText,
                    dimensions: { ee, d, pa }
                };
            }
        },
        depresion: {
            id: 'depresion',
            title: 'Test de Depresión (PHQ-9)',
            icon: 'fa-cloud-rain',
            color: 'from-blue-500 to-cyan-600',
            description: 'Herramienta para detectar síntomas depresivos.',
            questions: [
                "Poco interés o placer en hacer cosas",
                "Sentirse deprimido, triste o sin esperanzas",
                "Dificultad para conciliar o mantener el sueño, o dormir demasiado",
                "Sentirse cansado o con poca energía",
                "Poco apetito o comer en exceso",
                "Sentirse mal consigo mismo, o que es un fracaso, o que ha decepcionado a su familia o a sí mismo",
                "Dificultad para concentrarse en cosas, como leer el periódico o ver televisión",
                "Moverse o hablar tan despacio que otras personas lo han notado, o lo contrario, estar tan inquieto o agitado que ha estado moviéndose más de lo habitual",
                "Pensamientos de que estaría mejor muerto o de hacerse daño de alguna manera"
            ],
            options: [
                { label: "Nada", value: 0 },
                { label: "Varios días", value: 1 },
                { label: "Más de la mitad de los días", value: 2 },
                { label: "Casi todos los días", value: 3 }
            ],
            calculate: (answers) => {
                const total = answers.reduce((a, b) => a + b, 0);

                let levelText = "Bajo"; // <= 4
                if (total > 19) levelText = "Muy Alto"; // Severa
                else if (total > 14) levelText = "Alto"; // Moderadamente severa
                else if (total > 9) levelText = "Moderado"; // Moderada
                else if (total > 4) levelText = "Leve"; // Leve

                return { score: total, level: levelText, rawScore: total };
            }
        },
        estres: {
            id: 'estres',
            title: 'Test de Estrés Laboral (OMS)',
            icon: 'fa-weight-hanging',
            color: 'from-purple-500 to-indigo-600',
            description: 'Evalúa la carga de trabajo, control y apoyo en el entorno laboral.',
            questions: [
                "¿Sientes que tu carga de trabajo es excesiva?",
                "¿Tienes control sobre cómo realizas tu trabajo?",
                "¿Recibes apoyo suficiente de tus superiores y compañeros?",
                "¿Cómo son tus relaciones interpersonales en el trabajo?",
                "¿Está claro tu rol y responsabilidades en el trabajo?",
                "¿Cómo manejas los cambios en tu entorno laboral?"
            ],
            // Custom options per question handled in rendering logic or simplified here
            // For simplicity, we'll use a unified scale but map values differently if needed
            // PHP logic had mixed scales. Let's standardize for JS or handle exceptions.
            // PHP: Q1 (0-4 direct), Q2-6 (4-0 reverse: 4=Mucho/Bueno is LOW stress)
            // Let's implement custom logic in calculate.
            options: [
                { label: "Nunca / Muy Malo", value: 0 },
                { label: "Poco / Malo", value: 1 },
                { label: "Regular", value: 2 },
                { label: "Bueno / Bastante", value: 3 },
                { label: "Siempre / Excelente", value: 4 }
            ],
            calculate: (answers) => {
                // Q1: Higher is worse (stress). Values 0-4.
                // Q2-6: Higher is better (less stress). Values 0-4.
                // PHP Logic:
                // Q1: 0=Nada(0), 1=Poco(1), 2=Mod(2), 3=Bast(3), 4=Mucho(4) -> Direct
                // Q2-6: 4=Mucho(0 stress), 3=Bast(1), 2=Mod(2), 1=Poco(3), 0=Nada(4) -> Reverse mapping needed?
                // Wait, PHP code for Q2-6:
                // value="4" (Mucho/Muy bueno) -> In PHP post processing?
                // PHP: $estres_total = array_sum($respuestas);
                // HTML: value="4" for "Mucho/Muy bueno".
                // So if I answer "Mucho control" (4), it adds 4 to stress? That seems wrong for "Stress Test".
                // Usually "High Control" = "Low Stress".
                // Let's look at PHP again.
                // PHP Q2-6: value="4" label="Mucho/Muy bueno".
                // Total sum = stress.
                // So 4 points = High Stress?
                // If I have "Mucho control" (4), I get +4 stress points?
                // That implies the test is measuring "Lack of Stress" or the PHP logic was:
                // "Mucho control" should be 0 stress points.
                // Let's check PHP HTML values again.
                // Q2-6: value=4 for Mucho.
                // If the PHP logic was `sum`, then High Control = High Score.
                // And result: <=8 Bajo, <=16 Moderado.
                // So High Score = High Stress.
                // This means the PHP code might have been treating "Mucho Control" as "High Stress contributor"?
                // OR, maybe the question is "Do you LACK control?". No, text is "¿Tienes control...?".
                // If I answer "Mucho" (4), I get 4 points.
                // If I get 24 points (max), I have "Alto" stress.
                // So "Mucho Control" -> High Stress? That is counter-intuitive.
                // Standard stress tests usually reverse score positive items.
                // I WILL FIX THIS LOGIC FOR THE JS VERSION TO BE CORRECT.
                // Correct Logic:
                // Q1 (Carga): Mucho (4) = High Stress.
                // Q2-6 (Control, Apoyo, etc): Mucho (4) = Low Stress (0 points).

                let score = 0;
                // Q1: Direct (0=0, 4=4)
                score += answers[0];

                // Q2-6: Reverse (0=4, 1=3, 2=2, 3=1, 4=0)
                for (let i = 1; i < 6; i++) {
                    score += (4 - answers[i]);
                }

                let levelText = "Bajo";
                if (score > 16) levelText = "Alto";
                else if (score > 8) levelText = "Moderado";

                return { score: score, level: levelText, rawScore: score };
            }
        }
    };

    // --- RENDER FUNCTIONS ---



    window.openTest = (testId) => {
        currentTestId = testId;
        const test = TESTS[testId];

        testTitle.textContent = test.title;
        renderQuestions(test);

        testInterface.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    };

    function renderQuestions(test) {
        testForm.innerHTML = test.questions.map((q, index) => `
            <div class="bg-white p-6 rounded-xl border border-gray-100 shadow-sm question-card" data-index="${index}">
                <p class="text-lg text-gray-800 font-medium mb-4">
                    <span class="text-indigo-500 font-bold mr-2">${index + 1}.</span>${q}
                </p>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    ${test.options.map(opt => `
                        <label class="relative flex items-center p-4 rounded-lg border border-gray-200 cursor-pointer hover:bg-indigo-50 hover:border-indigo-200 transition-all">
                            <input type="radio" name="q${index}" value="${opt.value}" class="w-5 h-5 text-indigo-600 border-gray-300 focus:ring-indigo-500" required onchange="updateProgress()">
                            <span class="ml-3 text-gray-700 font-medium">${opt.label}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `).join('');

        progressBar.style.width = '0%';
        submitTestBtn.disabled = true;
        submitTestBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }

    window.updateProgress = () => {
        const test = TESTS[currentTestId];
        const total = test.questions.length;
        const answered = testForm.querySelectorAll('input:checked').length;
        const percent = (answered / total) * 100;

        progressBar.style.width = `${percent}%`;

        if (answered === total) {
            submitTestBtn.disabled = false;
            submitTestBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    };

    // --- ACTIONS ---

    closeTestBtn.addEventListener('click', () => {
        if (confirm('¿Seguro que quieres salir? Se perderá tu progreso.')) {
            testInterface.classList.add('hidden');
            document.body.style.overflow = '';
            currentTestId = null;
        }
    });

    submitTestBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        if (!currentTestId) return;

        const test = TESTS[currentTestId];
        const formData = new FormData(testForm);
        const answers = [];

        // Collect answers
        for (let i = 0; i < test.questions.length; i++) {
            const val = formData.get(`q${i}`);
            if (val === null) {
                alert('Por favor responde todas las preguntas.');
                return;
            }
            answers.push(parseInt(val));
        }

        // Calculate results
        const result = test.calculate(answers);

        // Save to Firebase
        try {
            submitTestBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Guardando...';

            await db.collection('wellness_tests').add({
                employeeId: currentEmployee ? currentEmployee.id : 'anonymous',
                employeeName: currentEmployee ? currentEmployee.name : 'Anónimo',
                type: test.id,
                testTitle: test.title,
                date: new Date().toISOString().split('T')[0],
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                score: result.score,
                level: result.level,
                rawScore: result.rawScore || 0,
                answers: answers, // Save raw answers for detailed analysis
                dimensions: result.dimensions || null
            });

            // Show success
            testInterface.classList.add('hidden');
            document.body.style.overflow = '';
            successModal.classList.remove('hidden');

        } catch (error) {
            console.error("Error saving test:", error);
            alert("Hubo un error al guardar. Intenta de nuevo.");
        } finally {
            submitTestBtn.innerHTML = 'Enviar Respuestas';
        }
    });

    closeSuccessBtn.addEventListener('click', () => {
        successModal.classList.add('hidden');
        currentTestId = null;
    });

    // --- START ---
    checkCompletedTests();

    async function checkCompletedTests() {
        if (!currentEmployee) return;

        try {
            // Calcular rango del mes actual
            const date = new Date();
            const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
            const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];

            const snapshot = await db.collection('wellness_tests')
                .where('employeeId', '==', currentEmployee.id)
                .where('date', '>=', startOfMonth)
                .where('date', '<=', endOfMonth)
                .get();

            const completedTypes = new Set();
            snapshot.forEach(doc => completedTypes.add(doc.data().type));

            renderGrid(completedTypes);

        } catch (error) {
            console.error("Error checking completed tests:", error);
            renderGrid(new Set()); // Render anyway on error
        }
    }

    function renderGrid(completedSet = new Set()) {
        testGrid.innerHTML = Object.values(TESTS).map(test => {
            const isCompleted = completedSet.has(test.id);

            if (isCompleted) {
                return `
                <div class="bg-gray-50 rounded-2xl p-6 border border-gray-200 relative overflow-hidden opacity-75 cursor-default">
                    <div class="absolute top-4 right-4 text-green-500 bg-green-100 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <i class="fa-solid fa-check"></i> Completado este mes
                    </div>
                    
                    <div class="flex items-start justify-between mb-4">
                        <div class="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center text-gray-400">
                            <i class="fa-solid ${test.icon} text-xl"></i>
                        </div>
                    </div>
                    
                    <h3 class="text-xl font-bold text-gray-500 mb-2">${test.title}</h3>
                    <p class="text-gray-400 text-sm leading-relaxed">Ya has realizado este test este mes. Vuelve el próximo mes.</p>
                </div>
                `;
            }

            return `
            <div class="glass-card rounded-2xl p-6 test-card cursor-pointer group relative overflow-hidden" onclick="openTest('${test.id}')">
                <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${test.color} opacity-10 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                
                <div class="flex items-start justify-between mb-4">
                    <div class="w-12 h-12 rounded-xl bg-gradient-to-br ${test.color} flex items-center justify-center text-white shadow-lg">
                        <i class="fa-solid ${test.icon} text-xl"></i>
                    </div>
                    <span class="bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1 rounded-full">
                        ${test.questions.length} Preguntas
                    </span>
                </div>
                
                <h3 class="text-xl font-bold text-gray-800 mb-2 group-hover:text-indigo-600 transition-colors">${test.title}</h3>
                <p class="text-gray-500 text-sm leading-relaxed">${test.description}</p>
                
                <div class="mt-6 flex items-center text-indigo-600 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                    Comenzar Test <i class="fa-solid fa-arrow-right ml-2"></i>
                </div>
            </div>
            `;
        }).join('');
    }
