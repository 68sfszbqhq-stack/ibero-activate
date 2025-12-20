// Wellness Questionnaires Logic for IBERO ACTÍVATE

document.addEventListener('DOMContentLoaded', () => {
    // State
    let wellnessData = {
        preHappiness: null,
        postHappiness: null,
        panasResponses: [],
        satisfactionResponses: []
    };

    // Elements
    const preWellness = document.getElementById('pre-wellness');
    const postWellness = document.getElementById('post-wellness');
    const confirmPreBtn = document.getElementById('confirm-pre-wellness');
    const submitPostBtn = document.getElementById('submit-post-wellness');

    // ============= PRE-ACTIVITY HAPPINESS =============

    // Handle PRE happiness button clicks
    document.querySelectorAll('.happiness-btn[data-value]').forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove previous selection
            document.querySelectorAll('.happiness-btn').forEach(b => b.classList.remove('selected'));

            // Select current
            btn.classList.add('selected');
            wellnessData.preHappiness = parseInt(btn.getAttribute('data-value'));

            // Enable confirm button
            confirmPreBtn.disabled = false;
        });
    });

    // Confirm PRE wellness and show feedback form
    confirmPreBtn.addEventListener('click', () => {
        console.log('PRE Happiness:', wellnessData.preHappiness);
        preWellness.classList.add('hidden');

        // Show feedback form (implement this based on your current flow)
        // document.getElementById('feedback-form').classList.remove('hidden');
    });

    // ============= POST-ACTIVITY QUESTIONNAIRES =============

    // Handle POST happiness button clicks
    document.querySelectorAll('.happiness-btn-small[data-post-happiness]').forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove previous selection
            document.querySelectorAll('.happiness-btn-small').forEach(b => b.classList.remove('selected'));

            // Select current
            btn.classList.add('selected');
            wellnessData.postHappiness = parseInt(btn.getAttribute('data-post-happiness'));

            checkPostQuestionnaire();
        });
    });

    // Check if all POST questions are answered
    function checkPostQuestionnaire() {
        const allPanasAnswered = Array.from(document.querySelectorAll('[data-panas]'))
            .every(select => select.value !== '');

        const allSatisfactionAnswered = Array.from(document.querySelectorAll('[data-satisfaction]'))
            .every(select => select.value !== '');

        const hasPostHappiness = wellnessData.postHappiness !== null;

        submitPostBtn.disabled = !(allPanasAnswered && allSatisfactionAnswered && hasPostHappiness);
    }

    // Listen to PANAS changes
    document.querySelectorAll('[data-panas]').forEach(select => {
        select.addEventListener('change', checkPostQuestionnaire);
    });

    // Listen to Satisfaction changes
    document.querySelectorAll('[data-satisfaction]').forEach(select => {
        select.addEventListener('change', checkPostQuestionnaire);
    });

    // ============= SUBMIT POST WELLNESS =============

    submitPostBtn.addEventListener('click', async () => {
        // Collect PANAS responses
        wellnessData.panasResponses = Array.from(document.querySelectorAll('[data-panas]'))
            .map(select => parseInt(select.value));

        // Collect Satisfaction responses
        wellnessData.satisfactionResponses = Array.from(document.querySelectorAll('[data-satisfaction]'))
            .map(select => parseInt(select.value));

        // Calculate scores
        const scores = calculateWellnessScores(wellnessData);

        console.log('Wellness Data:', wellnessData);
        console.log('Calculated Scores:', scores);

        // Save to Firebase (integrate with your existing saveFeedback function)
        await saveWellnessData(scores);

        // Show success or next step
        postWellness.classList.add('hidden');
        // document.getElementById('success-state').classList.remove('hidden');
    });

    // ============= SCORE CALCULATION =============

    function calculateWellnessScores(data) {
        // PANAS calculation
        const panasPositive = data.panasResponses.slice(0, 5).reduce((a, b) => a + b, 0); // Items 1-5
        const panasNegative = data.panasResponses.slice(5, 10).reduce((a, b) => a + b, 0); // Items 6-10

        // Satisfaction average
        const satisfactionAvg = data.satisfactionResponses.reduce((a, b) => a + b, 0) / data.satisfactionResponses.length;

        // Happiness change
        const happinessChange = data.postHappiness - data.preHappiness;

        return {
            preHappiness: data.preHappiness,
            postHappiness: data.postHappiness,
            happinessChange: happinessChange,
            panasPositive: panasPositive,
            panasNegative: panasNegative,
            panasResponses: data.panasResponses,
            satisfaction: satisfactionAvg,
            satisfactionResponses: data.satisfactionResponses
        };
    }

    // ============= FIREBASE INTEGRATION =============

    async function saveWellnessData(scores) {
        const currentEmployee = JSON.parse(localStorage.getItem('currentEmployee'));

        if (!currentEmployee) {
            console.error('No employee found');
            return;
        }

        try {
            submitPostBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Guardando...';
            submitPostBtn.disabled = true;

            // Save to wellness_data collection
            await db.collection('wellness_data').add({
                employeeId: currentEmployee.id,
                employeeName: currentEmployee.name,
                employeeAccount: currentEmployee.accountNumber,
                activityDate: new Date().toISOString().split('T')[0],
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),

                // Scores
                ...scores,

                // Additional metadata
                deviceType: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
            });

            console.log('✅ Wellness data saved successfully');
            submitPostBtn.innerHTML = '✅ Guardado';

        } catch (error) {
            console.error('Error saving wellness data:', error);
            alert('Error al guardar. Por favor intenta de nuevo.');
            submitPostBtn.innerHTML = '📤 Enviar Respuestas';
            submitPostBtn.disabled = false;
        }
    }

    // ============= PUBLIC API =============

    // Export functions for integration with existing feedback.js
    window.wellnessQuestionnaire = {
        showPre: () => {
            preWellness.classList.remove('hidden');
        },
        showPost: () => {
            postWellness.classList.remove('hidden');
        },
        getData: () => wellnessData,
        getScores: () => calculateWellnessScores(wellnessData)
    };
});
