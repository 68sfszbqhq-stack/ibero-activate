// Feedback Activity Banner - Show today's scheduled activity
document.addEventListener('DOMContentLoaded', () => {
    loadTodayActivity();
});

// Get day name in Spanish format matching calendar
function getTodayDayName() {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayIndex = new Date().getDay();
    return days[dayIndex];
}

// Get current week ID (same format as calendar.js)
function getWeekId(date) {
    const year = date.getFullYear();
    const oneJan = new Date(year, 0, 1);
    const numberOfDays = Math.floor((date - oneJan) / (24 * 60 * 60 * 1000));
    const week = Math.ceil((date.getDay() + 1 + numberOfDays) / 7);
    return `${year}-W${week}`;
}

// Load today's scheduled activity from calendar
async function loadTodayActivity() {
    const banner = document.getElementById('activity-banner');
    const activityNameEl = document.getElementById('activity-name');

    if (!banner || !activityNameEl) {
        console.warn('Activity banner elements not found');
        return;
    }

    try {
        const today = getTodayDayName();
        const weekId = getWeekId(new Date());

        console.log('Checking for scheduled activity:', { today, weekId });

        // Query weekly schedule
        const scheduleDoc = await db.collection('weekly_schedules').doc(weekId).get();

        if (!scheduleDoc.exists) {
            console.log('No schedule found for this week');
            return;
        }

        const schedule = scheduleDoc.data().schedule || [];

        // Find activity scheduled for today (any time)
        const todayActivity = schedule.find(item => item.day === today);

        if (!todayActivity) {
            console.log('No activity scheduled for today');
            return;
        }

        console.log('Found today activity:', todayActivity);

        // Fetch full activity details
        const activityDoc = await db.collection('activities').doc(todayActivity.activityId).get();

        if (!activityDoc.exists) {
            console.warn('Activity not found:', todayActivity.activityId);
            return;
        }

        const activityData = activityDoc.data();

        // Show banner
        activityNameEl.textContent = `${activityData.emoji} ${activityData.name}`;
        banner.classList.remove('hidden');

        // Store activity data for modal
        banner.dataset.activityId = todayActivity.activityId;
        banner.dataset.activityData = JSON.stringify(activityData);

        console.log('Activity banner displayed:', activityData.name);

    } catch (error) {
        console.error('Error loading today\'s activity:', error);
    }
}

// Handle banner click to show modal
function showActivityModal() {
    const banner = document.getElementById('activity-banner');
    const activityData = JSON.parse(banner.dataset.activityData);

    if (!activityData) {
        console.error('No activity data found');
        return;
    }

    // Populate modal
    const modal = document.getElementById('activity-detail-modal');

    document.getElementById('modal-activity-image').src = activityData.imagen || 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=800&q=80';
    document.getElementById('modal-activity-emoji').textContent = activityData.emoji || '⭐';
    document.getElementById('modal-activity-title').textContent = activityData.name;
    document.getElementById('modal-activity-category').textContent = activityData.categoria || 'Actividad';

    // Duration
    document.getElementById('modal-activity-duration').innerHTML = `<i class="fa-solid fa-clock"></i> ${activityData.duration} min`;

    // Type
    let typeIcon = activityData.type === 'outdoor' ? '🌳' : (activityData.type === 'desk' ? '💻' : '🏢');
    document.getElementById('modal-activity-type').innerHTML = `${typeIcon} ${activityData.type}`;

    // Intensity
    let intensityIcon = activityData.intensity === 'alta' ? '🔥' : (activityData.intensity === 'moderada' ? '⚡' : '🌱');
    document.getElementById('modal-activity-intensity').innerHTML = `${intensityIcon} ${activityData.intensity}`;

    // Description/Objective
    document.getElementById('modal-activity-description').textContent = activityData.objetivo || activityData.description || 'No especificado';

    // Materials
    document.getElementById('modal-activity-materials').textContent = activityData.materials || 'No se requieren materiales especiales';

    // Instructions
    const instructionsList = document.getElementById('modal-activity-instructions');
    instructionsList.innerHTML = '';
    if (activityData.instrucciones && activityData.instrucciones.length > 0) {
        activityData.instrucciones.forEach(instruction => {
            const li = document.createElement('li');
            li.textContent = instruction;
            instructionsList.appendChild(li);
        });
    } else {
        instructionsList.innerHTML = '<li>No hay instrucciones detalladas disponibles</li>';
    }

    // Benefits
    const benefitsEl = document.getElementById('modal-activity-benefits');
    benefitsEl.innerHTML = '';
    if (activityData.specificBenefits && activityData.specificBenefits.length > 0) {
        activityData.specificBenefits.forEach(benefit => {
            const span = document.createElement('span');
            span.className = 'benefit-badge';
            span.innerHTML = `<i class="fa-solid fa-check"></i> ${benefit}`;
            benefitsEl.appendChild(span);
        });
    } else {
        benefitsEl.innerHTML = '<span class="text-gray">No especificado</span>';
    }

    // Show modal
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

// Close modal
function closeActivityModal() {
    const modal = document.getElementById('activity-detail-modal');
    modal.classList.add('hidden');
    document.body.style.overflow = '';
}

// Expose functions globally
window.showActivityModal = showActivityModal;
window.closeActivityModal = closeActivityModal;
