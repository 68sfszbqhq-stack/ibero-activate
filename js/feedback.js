// Lógica de Feedback

document.addEventListener('DOMContentLoaded', () => {
    // Estado local
    let selectedEmployee = null;
    let currentRating = 0;
    let currentEmoji = '';

    // Elementos DOM
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    const searchSection = document.getElementById('search-section');
    const feedbackForm = document.getElementById('feedback-form');
    const successState = document.getElementById('success-state');

    // Elementos del perfil seleccionado
    const profileAvatar = document.getElementById('profile-avatar');
    const employeeName = document.getElementById('employee-name');
    const employeeAccount = document.getElementById('employee-account');
    const changeUserBtn = document.getElementById('change-user-btn');

    // Elementos de interacción
    const stars = document.querySelectorAll('.star');
    const ratingText = document.getElementById('rating-text');
    const emojiBtns = document.querySelectorAll('.emoji-btn');
    const submitBtn = document.getElementById('submit-feedback');
    const newFeedbackBtn = document.getElementById('new-feedback-btn');

    // Event Listeners
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }

    if (changeUserBtn) {
        changeUserBtn.addEventListener('click', resetSelection);
    }

    if (newFeedbackBtn) {
        newFeedbackBtn.addEventListener('click', () => {
            resetSelection();
            successState.classList.add('hidden');
            searchSection.classList.remove('hidden');
            searchInput.value = '';
        });
    }

    // Rating System
    stars.forEach(star => {
        star.addEventListener('click', () => {
            const rating = parseInt(star.dataset.rating);
            setRating(rating);
        });

        star.addEventListener('mouseover', () => {
            const rating = parseInt(star.dataset.rating);
            highlightStars(rating);
        });

        star.addEventListener('mouseout', () => {
            highlightStars(currentRating);
        });
    });

    // Emoji System
    emojiBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            emojiBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            currentEmoji = btn.dataset.emoji;
        });
    });

    // Submit
    if (submitBtn) {
        submitBtn.addEventListener('click', submitFeedback);
    }

    // Funciones
    async function handleSearch(e) {
        const query = e.target.value.trim();

        if (query.length < 3) {
            searchResults.classList.add('hidden');
            return;
        }

        try {
            // Búsqueda simple por nombre (startAt/endAt)
            // Nota: Firestore requiere índices para búsquedas complejas, aquí usamos una simple
            const snapshot = await db.collection('employees')
                .where('fullName', '>=', query)
                .where('fullName', '<=', query + '\uf8ff')
                .limit(5)
                .get();

            displayResults(snapshot);
        } catch (error) {
            console.error('Error en búsqueda:', error);
        }
    }

    function displayResults(snapshot) {
        searchResults.innerHTML = '';

        if (snapshot.empty) {
            searchResults.innerHTML = '<div class="result-item">No se encontraron empleados</div>';
            searchResults.classList.remove('hidden');
            return;
        }

        snapshot.forEach(doc => {
            const employee = doc.data();
            const div = document.createElement('div');
            div.className = 'result-item';
            div.innerHTML = `
                <div class="avatar-small" style="width: 32px; height: 32px; font-size: 0.8rem;">
                    ${getInitials(employee.fullName)}
                </div>
                <div>
                    <div style="font-weight: 600;">${employee.fullName}</div>
                    <div style="font-size: 0.8rem; color: #666;">#${employee.accountNumber}</div>
                </div>
            `;

            div.addEventListener('click', () => selectEmployee(doc.id, employee));
            searchResults.appendChild(div);
        });

        searchResults.classList.remove('hidden');
    }

    function selectEmployee(id, employee) {
        selectedEmployee = { id, ...employee };

        // Actualizar UI
        profileAvatar.textContent = getInitials(employee.fullName);
        employeeName.textContent = employee.fullName;
        employeeAccount.textContent = `#${employee.accountNumber}`;

        searchSection.classList.add('hidden');
        searchResults.classList.add('hidden');
        feedbackForm.classList.remove('hidden');
    }

    function resetSelection() {
        selectedEmployee = null;
        currentRating = 0;
        currentEmoji = '';

        // Reset UI
        stars.forEach(s => s.classList.remove('active'));
        emojiBtns.forEach(b => b.classList.remove('selected'));
        document.getElementById('comment').value = '';
        ratingText.textContent = 'Selecciona una calificación';

        feedbackForm.classList.add('hidden');
        searchSection.classList.remove('hidden');
    }

    function setRating(rating) {
        currentRating = rating;
        highlightStars(rating);

        const texts = ['Malo', 'Regular', 'Bueno', 'Muy Bueno', 'Excelente'];
        ratingText.textContent = texts[rating - 1];
    }

    function highlightStars(rating) {
        stars.forEach(star => {
            const starRating = parseInt(star.dataset.rating);
            if (starRating <= rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }

    async function submitFeedback() {
        if (!currentRating) {
            alert('Por favor selecciona una calificación (estrellas)');
            return;
        }

        const submitBtn = document.getElementById('submit-feedback');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...';

        try {
            const today = new Date().toISOString().split('T')[0];
            const comment = document.getElementById('comment').value;

            // Buscar asistencia de hoy (opcional, para vincular)
            // En este MVP permitimos feedback incluso sin asistencia marcada por admin
            // pero idealmente buscaríamos el ID de asistencia.

            await db.collection('feedbacks').add({
                employeeId: selectedEmployee.id,
                rating: currentRating,
                reaction: currentEmoji,
                comment: comment,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                date: today
            });

            // Calcular puntos ganados (10 base + rating * 2)
            const earnedPoints = 10 + (currentRating * 2);
            document.getElementById('earned-points').textContent = earnedPoints;

            // Mostrar éxito
            feedbackForm.classList.add('hidden');
            successState.classList.remove('hidden');

        } catch (error) {
            console.error('Error al enviar feedback:', error);
            alert('Hubo un error al enviar tu feedback. Intenta nuevamente.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }

    // Helpers
    function getInitials(name) {
        return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    }

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
});
