// Mi Diario de Bienestar - Módulo Antigravity
// IBERO ACTÍVATE 2026

document.addEventListener('DOMContentLoaded', async () => {
    // Get current employee
    const storedEmployee = localStorage.getItem('currentEmployee');
    if (!storedEmployee) {
        window.location.href = 'feedback.html';
        return;
    }

    const currentUser = JSON.parse(storedEmployee);
    const employeeId = currentUser.id;
    const today = new Date().toISOString().split('T')[0];

    // Display today's date
    const dateDisplay = document.getElementById('today-date');
    if (dateDisplay) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateDisplay.textContent = new Date().toLocaleDateString('es-MX', options);
    }

    // Kaizen Quotes rotation
    const kaizenQuotes = [
        { quote: "La mente no distingue entre realidad e imaginación. Planta las semillas correctas.", author: "Filosofía Kaizen" },
        { quote: "21 días para formar un hábito. 90 días para que sea un estilo de vida.", author: "Neurociencia del Hábito" },
        { quote: "Lo que agradeces crece. Lo que niegas persiste.", author: "Ley de la Atracción" },
        { quote: "Cada día es una nueva oportunidad para sembrar en tu jardín mental.", author: "Bienestar Integral" },
        { quote: "El cuerpo logra lo que la mente cree.", author: "Psicología Deportiva" },
        { quote: "Un vaso de agua es un acto de amor propio.", author: "Salud Holística" }
    ];

    function rotateKaizenQuote() {
        const randomQuote = kaizenQuotes[Math.floor(Math.random() * kaizenQuotes.length)];
        document.getElementById('kaizen-quote').textContent = `"${randomQuote.quote}"`;
        document.querySelector('.kaizen-author').textContent = `— ${randomQuote.author}`;
    }

    rotateKaizenQuote();
    setInterval(rotateKaizenQuote, 30000); // Rotate every 30 seconds

    // ============================================
    // 1. RUEDA DE LA VIDA (Wheel of Life)
    // ============================================

    const wheelAreas = [
        'Salud Física',
        'Salud Mental',
        'Finanzas',
        'Familia',
        'Carrera',
        'Desarrollo Personal',
        'Relaciones',
        'Diversión'
    ];

    let wheelData = Array(8).fill(5); // Default values
    let wheelChart = null;
    let wheelLocked = false;

    async function loadWheelData() {
        try {
            // Check for existing wheel data
            const wheelDoc = await db.collection('employees')
                .doc(employeeId)
                .collection('wheel_of_life')
                .doc('current')
                .get();

            if (wheelDoc.exists) {
                const data = wheelDoc.data();
                wheelData = data.scores;
                wheelLocked = data.locked || false;

                if (wheelLocked) {
                    document.getElementById('wheel-active-container').classList.add('hidden');
                    document.getElementById('wheel-locked-message').classList.remove('hidden');
                    document.getElementById('save-wheel-btn').classList.add('hidden');
                    renderLockedWheelChart();
                } else {
                    renderWheelWithSliders();
                }
            } else {
                renderWheelWithSliders();
            }
        } catch (error) {
            console.error('Error loading wheel data:', error);
            renderWheelWithSliders();
        }
    }

    function renderWheelWithSliders() {
        // Render chart
        const ctx = document.getElementById('wheelChart');
        if (!ctx) return;

        if (wheelChart) {
            wheelChart.destroy();
        }

        wheelChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: wheelAreas,
                datasets: [{
                    label: 'Mi Evaluación',
                    data: wheelData,
                    backgroundColor: 'rgba(102, 126, 234, 0.2)',
                    borderColor: 'rgba(102, 126, 234, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(102, 126, 234, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(102, 126, 234, 1)',
                    pointRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    r: {
                        beginAtZero: true,
                        min: 0,
                        max: 10,
                        ticks: {
                            stepSize: 2
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return `${context.label}: ${context.parsed.r}/10`;
                            }
                        }
                    }
                }
            }
        });

        // Render sliders
        const slidersContainer = document.getElementById('wheel-sliders');
        if (slidersContainer) {
            slidersContainer.innerHTML = '';

            wheelAreas.forEach((area, index) => {
                const sliderDiv = document.createElement('div');
                sliderDiv.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <label style="font-weight: 600; color: #374151;">${area}</label>
                        <span id="wheel-value-${index}" style="font-size: 1.5rem; font-weight: 700; color: var(--primary); min-width: 50px; text-align: right;">${wheelData[index]}/10</span>
                    </div>
                    <input type="range" 
                           id="wheel-slider-${index}" 
                           min="1" 
                           max="10" 
                           value="${wheelData[index]}"
                           style="width: 100%; height: 8px; border-radius: 5px; background: linear-gradient(to right, #e5e7eb 0%, #667eea 100%); outline: none; -webkit-appearance: none;"
                           >
                `;
                slidersContainer.appendChild(sliderDiv);

                // Add event listener
                const slider = document.getElementById(`wheel-slider-${index}`);
                const valueDisplay = document.getElementById(`wheel-value-${index}`);

                slider.oninput = function () {
                    const value = parseInt(this.value);
                    wheelData[index] = value;
                    valueDisplay.textContent = `${value}/10`;

                    // Update chart in real-time
                    if (wheelChart) {
                        wheelChart.data.datasets[0].data[index] = value;
                        wheelChart.update();
                    }
                };
            });
        }
    }

    function renderLockedWheelChart() {
        const ctx = document.getElementById('wheelChartLocked');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'radar',
            data: {
                labels: wheelAreas,
                datasets: [{
                    label: 'Mi Evaluación',
                    data: wheelData,
                    backgroundColor: 'rgba(102, 126, 234, 0.2)',
                    borderColor: 'rgba(102, 126, 234, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(102, 126, 234, 1)',
                    pointBorderColor: '#fff',
                    pointRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    r: {
                        beginAtZero: true,
                        min: 0,
                        max: 10,
                        ticks: { stepSize: 2 }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    document.getElementById('save-wheel-btn')?.addEventListener('click', async () => {
        try {
            const confirmSave = confirm('¿Guardar evaluación? Esta se bloqueará hasta el final del cuatrimestre para permitir una comparación real de tu evolución.');

            if (!confirmSave) return;

            await db.collection('employees')
                .doc(employeeId)
                .collection('wheel_of_life')
                .doc('current')
                .set({
                    scores: wheelData,
                    locked: true,
                    evaluationDate: firebase.firestore.FieldValue.serverTimestamp(),
                    employeeId: employeeId
                });

            Toast.success('Evaluación guardada! Podrás volver a evaluar al final del cuatrimestre.', 5000);
            location.reload();

        } catch (error) {
            console.error('Error saving wheel:', error);
            Toast.error('Error al guardar. Intenta nuevamente.');
        }
    });

    loadWheelData();

    // ============================================
    // 2. TRACKERS DIARIOS
    // ============================================

    let dailyData = {
        water: Array(8).fill(false),
        mood: null,
        weather: null,
        gratitudes: ['', '', ''],
        affirmations: ['', ''],
        reflection: ''
    };

    // Load today's diary
    async function loadTodayDiary() {
        try {
            const diaryDoc = await db.collection('employees')
                .doc(employeeId)
                .collection('daily_diary')
                .doc(today)
                .get();

            if (diaryDoc.exists) {
                dailyData = diaryDoc.data();
                renderDailyTrackers();
            } else {
                renderDailyTrackers();
            }
        } catch (error) {
            console.error('Error loading diary:', error);
            renderDailyTrackers();
        }
    }

    function renderDailyTrackers() {
        // Water tracker
        const waterTracker = document.getElementById('water-tracker');
        if (waterTracker) {
            waterTracker.innerHTML = '';
            for (let i = 0; i < 8; i++) {
                const btn = document.createElement('button');
                btn.className = 'glass-btn' + (dailyData.water[i] ? ' filled' : '');
                btn.innerHTML = dailyData.water[i] ? '💧' : '🥤';
                btn.onclick = () => {
                    dailyData.water[i] = !dailyData.water[i];
                    renderDailyTrackers();
                };
                waterTracker.appendChild(btn);
            }
        }

        // Mood selector
        const moods = [
            { icon: '😢', label: 'Triste/Estresado', value: 1 },
            { icon: '😐', label: 'Regular', value: 2 },
            { icon: '🙂', label: 'Bien', value: 3 },
            { icon: '😄', label: 'Feliz/Motivado', value: 4 }
        ];

        const moodSelector = document.getElementById('mood-selector');
        if (moodSelector) {
            moodSelector.innerHTML = '';
            moods.forEach(mood => {
                const btn = document.createElement('button');
                btn.className = 'mood-btn' + (dailyData.mood === mood.value ? ' selected' : '');
                btn.innerHTML = `
                    <div class="mood-icon">${mood.icon}</div>
                    <div class="mood-label">${mood.label}</div>
                `;
                btn.onclick = () => {
                    dailyData.mood = mood.value;
                    renderDailyTrackers();
                };
                moodSelector.appendChild(btn);
            });
        }

        // Weather selector
        const weathers = [
            { icon: '☀️', label: 'Soleado', value: 'sunny' },
            { icon: '☁️', label: 'Nublado', value: 'cloudy' },
            { icon: '🌧️', label: 'Lluvia', value: 'rainy' }
        ];

        const weatherSelector = document.getElementById('weather-selector');
        if (weatherSelector) {
            weatherSelector.innerHTML = '';
            weathers.forEach(weather => {
                const btn = document.createElement('button');
                btn.className = 'weather-btn' + (dailyData.weather === weather.value ? ' selected' : '');
                btn.innerHTML = `
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">${weather.icon}</div>
                    <div style="font-size: 0.9rem; font-weight: 500;">${weather.label}</div>
                `;
                btn.onclick = () => {
                    dailyData.weather = weather.value;
                    renderDailyTrackers();
                };
                weatherSelector.appendChild(btn);
            });
        }

        // Populate text inputs
        document.getElementById('gratitude-1').value = dailyData.gratitudes[0] || '';
        document.getElementById('gratitude-2').value = dailyData.gratitudes[1] || '';
        document.getElementById('gratitude-3').value = dailyData.gratitudes[2] || '';
        document.getElementById('affirmation-1').value = dailyData.affirmations[0] || '';
        document.getElementById('affirmation-2').value = dailyData.affirmations[1] || '';
        document.getElementById('reflection').value = dailyData.reflection || '';
    }

    // Save diary
    document.getElementById('save-diary-btn')?.addEventListener('click', async () => {
        try {
            // Collect current data
            dailyData.gratitudes = [
                document.getElementById('gratitude-1').value,
                document.getElementById('gratitude-2').value,
                document.getElementById('gratitude-3').value
            ];
            dailyData.affirmations = [
                document.getElementById('affirmation-1').value,
                document.getElementById('affirmation-2').value
            ];
            dailyData.reflection = document.getElementById('reflection').value;

            // Save to Firestore
            await db.collection('employees')
                .doc(employeeId)
                .collection('daily_diary')
                .doc(today)
                .set({
                    ...dailyData,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    employeeId: employeeId,
                    date: today
                });

            Toast.success('Diario guardado exitosamente!', 3000);

        } catch (error) {
            console.error('Error saving diary:', error);
            Toast.error('Error al guardar. Intenta nuevamente.');
        }
    });

    // Initialize
    loadTodayDiary();
});
