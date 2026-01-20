// Wellness Questionnaires Logic for IBERO ACTÍVATE
// UNIFIED VERSION - All questions in one form

document.addEventListener('DOMContentLoaded', () => {
    // State
    let wellnessData = {
        perceivedBenefit: null,
        postFeeling: null,
        wouldReturn: null
    };

    // Q1: Handle perceived benefit dropdown
    const benefitSelect = document.getElementById('perceived-benefit');
    if (benefitSelect) {
        benefitSelect.addEventListener('change', (e) => {
            wellnessData.perceivedBenefit = e.target.value;
            console.log('Perceived benefit:', wellnessData.perceivedBenefit);
        });
    }

    // Q2: Handle post-activity feeling emoji clicks
    document.querySelectorAll('.feeling-emoji-btn[data-feeling]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent form submission

            // Remove previous selection
            document.querySelectorAll('.feeling-emoji-btn').forEach(b => b.classList.remove('selected'));

            // Select current
            btn.classList.add('selected');
            wellnessData.postFeeling = parseInt(btn.getAttribute('data-feeling'));

            console.log('Post feeling:', wellnessData.postFeeling);
        });
    });

    // Q3: Handle would-return buttons
    document.querySelectorAll('.would-return-btn[data-return]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent form submission

            // Remove previous selection
            document.querySelectorAll('.would-return-btn').forEach(b => b.classList.remove('selected'));

            // Select current
            btn.classList.add('selected');
            wellnessData.wouldReturn = btn.getAttribute('data-return');

            console.log('Would return:', wellnessData.wouldReturn);
        });
    });

    // ============= PUBLIC API =============

    // Export functions for integration with existing feedback.js
    window.wellnessQuestionnaire = {
        getData: () => wellnessData,
        isComplete: () => {
            // Check if all 3 required questions are answered
            const hasBenefit = wellnessData.perceivedBenefit !== null && wellnessData.perceivedBenefit !== '';
            const hasFeeling = wellnessData.postFeeling !== null;
            const hasReturn = wellnessData.wouldReturn !== null;

            return hasBenefit && hasFeeling && hasReturn;
        },
        reset: () => {
            wellnessData = {
                perceivedBenefit: null,
                postFeeling: null,
                wouldReturn: null
            };

            // Reset UI
            const benefitSelect = document.getElementById('perceived-benefit');
            if (benefitSelect) benefitSelect.value = '';

            document.querySelectorAll('.feeling-emoji-btn').forEach(b => b.classList.remove('selected'));
            document.querySelectorAll('.would-return-btn').forEach(b => b.classList.remove('selected'));
        }
    };

    console.log('✅ Wellness questionnaire module loaded (unified version)');
});
